import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAnswer } from '@/lib/kimu/groq';
import { offlineReply } from '@/lib/kimu/offline';
import { buildMessages } from '@/lib/kimu/prompt';
import { CONFIDENT, search, toTarget } from '@/lib/kimu/search';
import { detectLang, fold } from '@/lib/kimu/text';
import type { KimuAsk, KimuModelReply } from '@/lib/kimu/types';
import { FORMATIONS, formationFrame, formationOf } from '@/content/formation';
import { getWeek } from '@/content/registry';
import { expandNotes, sentence } from '@/content/notes-text';
import { askKimu, retrievalQuestion } from '@/lib/kimu/engine';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const first = (q: string) => search(q, 4)[0];

describe('Kimu search: finds where the simulator explains something', () => {
  it('reconciles Spanish and Basque spellings', () => {
    expect(fold('Notocorda')).toBe(fold('Notokorda'));
    expect(fold('gastrulazioa').startsWith(fold('gastrulación').slice(0, -1))).toBe(true);
    expect(fold('vitelino')).toBe(fold('bitelino'));
  });

  it.each([
    ['cuándo se forma la notocorda', 3, 'notokorda'],
    ['noiz sortzen da notokorda?', 3, 'notokorda'],
    ['notochord', 3, 'notokorda'],
    ['somitas', 4, 'somitak'],
    ['when does the primitive streak appear', 3, 'gastrulazioa'],
    ['gastrulación', 3, 'gastrulazioa'],
    ['cierre del tubo neural', 4, 'neurulazioa'],
    ['cordón umbilical', 6, 'zilbor-hestea'],
  ])('%s → week %i, stage %s', (question, week, stage) => {
    const hits = search(question, 4);
    expect(hits.some((h) => h.doc.week === week && h.doc.stage === stage), hits.map((h) => `${h.doc.week}/${h.doc.stage}`).join(' ')).toBe(true);
    expect(hits[0].score).toBeGreaterThan(CONFIDENT);
  });

  it('plays the reviewed notochord formation, rather than guessing the stage start', () => {
    const h = first('cuándo se forma la notocorda');
    expect(toTarget(h, 'c1')).toMatchObject({ kind: 'structure', week: 3, stage: 'notokorda', at: .59, structure: 'notokorda', formation: 'notokorda', view: 'zelulak' });
  });

  it('finds nothing for chit-chat, so Kimu does not point at random places', () => {
    expect(search('hola qué tal', 4)).toEqual([]);
    expect(search('receta de paella', 4)).toEqual([]);
  });

  it('gives every hit a place that exists in the simulator', () => {
    for (const q of ['notocorda', 'blastocisto', 'ectodermo', 'somitas', 'trofoblasto']) {
      for (const h of search(q, 4)) {
        expect(h.doc.at).toBeGreaterThanOrEqual(0);
        expect(h.doc.at).toBeLessThanOrEqual(1);
        expect(h.doc.where).toMatch(/^\d\. gaia/);
      }
    }
  });
});

describe('Reviewed formation destinations', () => {
  it.each([
    ['heuserren mintza', 'heuser-mintza', 2, 'eguna-9', 'heuser'],
    ['desidua erreakzioa', 'desidua-erreakzioa', 2, 'eguna-11-12', 'desidua'],
    ['somatopleura', 'paretako-orria', 4, 'mesodermoa-banatzen', 'zeharkakoa'],
    ['somatopleura kanpokoa', 'somatopleura-kanpokoa', 2, 'eguna-11-12', 'mesodermoa'],
  ])('%s goes to its explanation in the correct view', (q, structure, week, stage, view) => {
    expect(toTarget(first(q), 'c1')).toMatchObject({ structure, week, stage, view });
  });
  it.each(FORMATIONS.map(f => [f.structure, f] as const))('%s has a real view, narrative focus and original passage', (id, f) => {
    expect(formationOf(id)).toEqual(f);
    const stage = getWeek(f.week)!.stages.find(s => s.id === f.stage)!;
    expect(stage.beats[f.beat].focus).toContain(id);
    expect(f.start).toBeGreaterThanOrEqual(0);
    expect(f.end).toBeGreaterThan(f.start);
    expect(f.end).toBeLessThanOrEqual(1);
    const refs = expandNotes(stage.beats[f.beat].notes);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every(id => !!sentence(id))).toBe(true);
    const scene = stage.views.find(v => v.id === f.view)!.scene;
    const drawing = renderToStaticMarkup(createElement('svg', null, createElement(scene, { t: f.end, reduced: true })));
    expect(drawing.includes(`data-part="${id}"`) || drawing.includes(`data-label="${id}"`)).toBe(true);
    for (const part of f.highlight ?? [id]) {
      expect(drawing.includes(`data-part="${part}"`) || drawing.includes(`data-label="${part}"`)).toBe(true);
    }
    expect(formationFrame(f, f.start, 10_000, 2)).toBe(f.end);
    expect(formationFrame(f, f.end, 1, 1)).toBe(f.end);
  });

  it('only labels reviewed clips as formations; a location question lands on the completed structure', () => {
    expect(first('¿Cómo se forma el tubo neural?').doc.formation).toBe('hodi-neurala');
    expect(first('Non dago notokorda?').doc).toMatchObject({ at: formationOf('notokorda')!.end, action: 'explanation' });
    expect(first('¿Cómo se forma el endometrio?').doc.formation).toBeUndefined();
    expect(first('¿Cómo se forma el endometrio?').doc.facts).toContain('Do not promise');
    expect(formationOf('unknown')).toBeUndefined();
    expect(new Set(FORMATIONS.map(f => f.structure)).size).toBe(FORMATIONS.length);
  });

  it('keeps short clips readable and cannot overshoot, even at higher playback speeds', () => {
    const f = formationOf('gandor-neurala')!;
    expect(formationFrame(f, f.start, 1, 1)).toBeLessThan(f.end);
    expect(formationFrame(f, f.start, 4, 1)).toBeLessThan(f.end);
    expect(formationFrame(f, f.start, 0, 1)).toBe(f.start);
  });
});

describe('Kimu contextual retrieval', () => {
  afterEach(() => vi.unstubAllGlobals());
  const history = [{ role: 'user' as const, text: '¿Cómo se forma la notocorda?' }, { role: 'kimu' as const, text: 'Notokorda…' }];
  it('retrieves the previous structure for an unnamed follow-up', () => {
    const q = retrievalQuestion('¿Y de dónde viene?', history, null);
    expect(q).toContain('Notocorda');
    expect(first(q).doc.structure).toBe('notokorda');
    expect(retrievalQuestion('Nondik dator?', history, null)).toContain('Notocorda');
  });
  it('uses the currently highlighted structure for this, while respecting an explicitly named topic', () => {
    const here = { week: 4, stage: 'neurulazioa', beat: 3, structure: 'hodi-neurala' };
    expect(first(retrievalQuestion('¿Qué es esto?', history, here)).doc.structure).toBe('hodi-neurala');
    expect(retrievalQuestion('¿Y cómo se forma la notocorda?', history, here)).toBe('¿Y cómo se forma la notocorda?');
  });
  it('keeps the reviewed formation as primary even if the model cites a different passage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, reply: 'Hara!', go: ['c2', 'c9'], followups: [], mood: 'happy' })));
    const result = await askKimu('¿Cómo se forma la notocorda?', [], null);
    expect(result.targets[0]).toMatchObject({ id: 'c1', formation: 'notokorda', at: .59 });
    expect(result.targets.some(t => t.id === 'c9')).toBe(false);
  });
  it('uses contextual evidence and the same destinations without a model', async () => {
    const request = vi.fn(async (_url: string, _init: RequestInit) => Response.json({ ok: false, reason: 'nokey' }));
    vi.stubGlobal('fetch', request);
    const result = await askKimu('¿Y de dónde viene?', history, null);
    expect(result.targets[0].structure).toBe('notokorda');
    expect(JSON.parse(request.mock.calls[0][1].body as string).notes[0]).toContain('Jatorria');
  });
});

describe('Kimu language and offline voice', () => {
  it('detects the language of the question', () => {
    expect(detectLang('cuándo se forma la notocorda')).toBe('es');
    expect(detectLang('noiz sortzen da notokorda?')).toBe('eu');
    expect(detectLang('when does the notochord form')).toBe('en');
    expect(detectLang('somitas')).toBe('eu');
  });

  it('answers from the notes alone, in the student language, with places to go', () => {
    const r = offlineReply(search('cuándo se forma la notocorda', 4), 'es', false);
    expect(r.source).toBe('offline');
    expect(r.reply).toContain('Notokorda');
    expect(r.reply).toMatch(/Pulsa/);
    expect(r.targets[0]).toMatchObject({ week: 3, stage: 'notokorda' });
  });

  it('greets back, and suggests real topics when nothing matches', () => {
    expect(offlineReply([], 'es', false, 'hola!').reply).toMatch(/Soy Kimu/);
    const r = offlineReply([], 'es', false);
    expect(r.targets).toEqual([]);
    expect(r.followups.length).toBeGreaterThan(0);
    expect(r.mood).toBe('curious');
  });
});

describe('Kimu model contract', () => {
  it('reads the model JSON, tolerating thinking and prose around it', () => {
    const raw = '<think>hmm</think>Here: {"reply":"Kaixo! **Notokorda**","go":["c1","c2","c3"],"followups":["Zer da?"],"mood":"proud"}';
    expect(parseAnswer(raw)).toEqual({ reply: 'Kaixo! **Notokorda**', go: ['c1', 'c2'], followups: ['Zer da?'], mood: 'proud' });
  });

  it('falls back to a plain-text reply and a friendly mood', () => {
    expect(parseAnswer('Kaixo, ni Kimu naiz')).toMatchObject({ reply: 'Kaixo, ni Kimu naiz', go: [], mood: 'happy' });
    expect(parseAnswer('{"reply":"ok","mood":"furious"}')?.mood).toBe('happy');
    expect(parseAnswer('   ')).toBeNull();
  });

  it('sends the model only the numbered passages, the last turns and the question', () => {
    const ask: KimuAsk = {
      question: 'cuándo se forma la notocorda',
      history: Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? ('kimu' as const) : ('user' as const), text: `t${i}` })),
      notes: ['A', 'B'],
      here: { title: '3. gaia · Notokordaren eraketa', step: 'urratsa', picked: '' },
      lang: 'es',
    };
    const m = buildMessages(ask);
    expect(m[0].role).toBe('system');
    expect(m).toHaveLength(1 + 4 + 1);
    expect(m.at(-1)?.content).toContain('[c1] A\n[c2] B');
    expect(m.at(-1)?.content).toContain('HERE');
    expect(JSON.stringify(m).length).toBeLessThan(3500);
  });

  it('never lets a target through that the model was not given', () => {
    const hits = search('notocorda', 4);
    const t = toTarget(hits[0], 'c1');
    expect(t).toMatchObject({ id: 'c1', week: 3, stage: 'notokorda' });
  });
});

describe('Kimu route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const post = async (body: unknown) => {
    const { POST } = await import('@/app/api/kimu/route');
    const res = await POST(new Request('http://x/api/kimu', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': '9.9.9.9' } }));
    return { status: res.status, json: (await res.json()) as KimuModelReply };
  };
  const ask = { question: 'Noiz sortzen da notokorda?', history: [], notes: ['Notokorda: …'], here: null, lang: 'eu' };

  it('says "no key" (so the browser answers from the notes) when Groq is not configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    expect((await post(ask)).json).toEqual({ ok: false, reason: 'nokey' });
  });

  it('rejects malformed requests', async () => {
    vi.stubEnv('GROQ_API_KEY', 'k');
    expect((await post({ question: 1 })).status).toBe(400);
    expect((await post({ question: ' ' })).status).toBe(400);
  });

  it('asks Qwen 3.8 on Groq in instruct mode and returns its reply', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    const fetchMock = vi.fn(async () => Response.json({ choices: [{ message: { content: '{"reply":"Hara!","go":["c1"],"followups":[],"mood":"happy"}' } }] }));
    vi.stubGlobal('fetch', fetchMock);
    const { json } = await post(ask);
    expect(json).toEqual({ ok: true, reply: 'Hara!', go: ['c1'], followups: [], mood: 'happy' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ model: 'qwen/qwen3.8-27b', reasoning_effort: 'none' });
    expect(sent.max_tokens).toBeLessThanOrEqual(400);
  });

  it('retries once in plain mode when structured output is rejected, then gives up quietly on errors', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    const calls: number[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_u: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        calls.push(body.response_format ? 1 : 0);
        return body.response_format ? new Response('{}', { status: 400 }) : Response.json({ choices: [{ message: { content: '{"reply":"Bai","go":[],"followups":[],"mood":"happy"}' } }] });
      }),
    );
    expect((await post({ ...ask, question: 'Zer da hau?' })).json).toMatchObject({ ok: true, reply: 'Bai' });
    expect(calls).toEqual([1, 0]);

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    expect((await post({ ...ask, question: 'Beste galdera bat' })).json).toEqual({ ok: false, reason: 'error' });
  });
});
