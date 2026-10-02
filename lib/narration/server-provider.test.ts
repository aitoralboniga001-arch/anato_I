import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { weeks } from '@/content/registry';
import { getNarrationSegments, type NarrationKind, type NarrationOptions } from '@/lib/sim/narration';
import { getNarrationAsset, narrationConfigured, resolveNarrationText, validNarrationAsset } from './server';
import manifest from '@/public/narration/manifest.json';
import { createHash } from 'node:crypto';
import { parseNarrationRequest } from './server-utils';
import { GET, POST } from '@/app/api/narration/route';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

vi.mock('@/public/narration/manifest.json', () => ({ default: { version: 1, provider: 'piper', voice: 'eu_ES-maider-medium', entries: {} } }));
const catalog = manifest.entries as Record<string, unknown>;
afterEach(() => { for (const key of Object.keys(catalog)) delete catalog[key]; });
const ask = (body: unknown, origin = 'https://simulator.test') => new Request('https://simulator.test/api/narration', {
  method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

describe('Static canonical narration server and HTTP contract', () => {
  it('resolves real intro/beat/structure/view fragments from every topic', () => {
    for (const week of weeks) {
      const stage = week.stages[0];
      expect(resolveNarrationText(parseNarrationRequest({ week: week.week, stage: stage.id, kind: 'intro' }))).toContain(stage.title);
      expect(resolveNarrationText(parseNarrationRequest({ week: week.week, stage: stage.id, kind: 'beat', beat: 0 }))).toBeTruthy();
      expect(resolveNarrationText(parseNarrationRequest({ week: week.week, stage: stage.id, kind: 'bridge', view: stage.views[0].id }))).toBeTruthy();
      expect(resolveNarrationText(parseNarrationRequest({ week: week.week, stage: stage.id, kind: 'structure', structure: stage.structures[0] }))).toBeTruthy();
    }
  });

  it('rejects invented destinations and out-of-range segments before synthesis', () => {
    const stage = weeks[0].stages[0];
    for (const input of [
      { week: 1, stage: 'invented', kind: 'intro' },
      { week: 1, stage: stage.id, kind: 'intro', segment: 999 },
      { week: 1, stage: stage.id, kind: 'beat', beat: 999 },
      { week: 1, stage: stage.id, kind: 'bridge', view: 'invented' },
      { week: 1, stage: stage.id, kind: 'structure', structure: 'invented' },
    ]) expect(() => resolveNarrationText(parseNarrationRequest(input))).toThrow();
  });

  it('resolves every canonical fragment in all six topics without truncating the script', () => {
    let count = 0;
    for (const week of weeks) for (const stage of week.stages) {
      const targets: Array<{ kind: NarrationKind } & NarrationOptions> = [
        { kind: 'intro' as const },
        ...stage.beats.map((_, beat) => ({ kind: 'beat' as const, beat })),
        ...stage.structures.map(structure => ({ kind: 'structure' as const, structure })),
        ...stage.views.map(view => ({ kind: 'bridge' as const, view: view.id })),
      ];
      for (const target of targets) {
        const segments = getNarrationSegments(week, stage, target.kind, target);
        expect(segments.length, `${week.week}/${stage.id}/${JSON.stringify(target)}`).toBeGreaterThan(0);
        for (const [segment, expected] of segments.entries()) {
          expect(resolveNarrationText(parseNarrationRequest({ week: week.week, stage: stage.id, ...target, segment }))).toBe(expected.text);
          count++;
        }
      }
    }
    expect(count).toBeGreaterThan(1000);
  });

  it('reports missing configuration without a provider call or leaking configuration', async () => {
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', ''); vi.stubEnv('GEMINI_API_KEY', '');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect(await GET().json()).toEqual({ configured: false, provider: 'piper' });
    const response = await POST(ask({ week: 1, stage: weeks[0].stages[0].id, kind: 'intro' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'NOT_CONFIGURED' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects cross-origin and arbitrary text requests before a provider call', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const valid = { week: 1, stage: weeks[0].stages[0].id, kind: 'intro' };
    expect((await POST(ask(valid, 'https://attacker.test'))).status).toBe(403);
    expect((await POST(ask({ ...valid, text: 'paid arbitrary text' }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });


  it('redirects canonical requests to immutable MP3 assets without credentials or provider calls', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const input = parseNarrationRequest({ week: 1, stage: weeks[0].stages[0].id, kind: 'intro' });
    const textHash = createHash('sha256').update(resolveNarrationText(input), 'utf8').digest('hex');
    const asset = { url: `/narration/audio/${'a'.repeat(64)}.mp3`, durationMs: 2500, bytes: 21000 };
    catalog[textHash] = asset;
    expect(narrationConfigured()).toBe(true);
    expect(getNarrationAsset(input)).toEqual(asset);
    const response = await POST(ask(input));
    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe(asset.url);
    expect(await response.text()).toBe('');
    expect(await GET().json()).toEqual({ configured: true, provider: 'piper' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    ['http://127.0.0.1:3000', '127.0.0.1:3000', 'http'],
    ['http://localhost:3000', 'localhost:3000', 'http'],
    ['https://enbrio.example', 'enbrio.example', 'https'],
  ])('accepts public browser origin %s when Next uses an internal request URL', async (origin, host, protocol) => {
    const input = parseNarrationRequest({ week: 1, stage: weeks[0].stages[0].id, kind: 'intro' });
    const hash = createHash('sha256').update(resolveNarrationText(input), 'utf8').digest('hex');
    const asset = { url: `/narration/audio/${'a'.repeat(64)}.mp3`, durationMs: 2500, bytes: 21000 };
    catalog[hash] = asset;
    const request = new Request('http://localhost:3000/api/narration', { method: 'POST',
      headers: { origin, host, 'x-forwarded-proto': protocol, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    const response = await POST(request);
    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe(asset.url);
  });

  it('rejects unsafe asset metadata and reports missing clips without synthesis', async () => {
    for (const url of ['https://attacker.test/audio.mp3', '/narration/audio/../x.mp3', '//attacker.test/x.mp3', '/narration/audio/nohash.mp3']) {
      expect(validNarrationAsset({ url, durationMs: 200, bytes: 200 })).toBe(false);
    }
    expect(validNarrationAsset({ url: `/narration/audio/${'a'.repeat(64)}.mp3`, durationMs: -1, bytes: 200 })).toBe(false);
    catalog['a'.repeat(64)] = { url: `/narration/audio/${'b'.repeat(64)}.mp3`, durationMs: 200, bytes: 200 };
    const response = await POST(ask({ week: 1, stage: weeks[0].stages[0].id, kind: 'intro' }));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'AUDIO_NOT_FOUND' });
    catalog['a'.repeat(64)] = { url: 'https://attacker.test', durationMs: 200, bytes: 200 };
    expect(narrationConfigured()).toBe(false);
  });
});
