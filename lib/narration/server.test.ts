import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioCache, NarrationError, RequestBudget, audioToWav, isSameOriginNarrationRequest, parseNarrationRequest, readBoundedBody } from './server-utils';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('public browser origin boundary', () => {
  const request = (headers: Record<string, string>) => new Request('http://localhost:3000/api/narration', { headers });
  it('uses public Host while refusing an attacker-controlled forwarded host', () => {
    expect(isSameOriginNarrationRequest(request({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' }))).toBe(true);
    expect(isSameOriginNarrationRequest(request({ host: 'localhost:3000', origin: 'https://attacker.test', 'x-forwarded-host': 'attacker.test', 'x-forwarded-proto': 'https' }))).toBe(false);
  });
  const invalidHeaders: Record<string, string>[] = [
    { host: 'localhost:3000' },
    { host: 'localhost:3000', origin: 'null' },
    { host: 'localhost:3000', origin: 'http://localhost:3000/' },
    { host: 'localhost:3000', origin: 'http://localhost:3000', 'sec-fetch-site': 'cross-site' },
    { host: 'localhost:3000', origin: 'https://localhost:3000' },
    { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3001' },
    { host: 'localhost:3000', origin: 'http://localhost:3000', 'x-forwarded-proto': 'ftp' },
    { host: 'localhost:3000', origin: 'http://localhost:3000', 'x-forwarded-proto': 'http, https' },
    { host: 'localhost:3000,attacker.test', origin: 'http://localhost:3000' },
    { host: 'attacker.test@localhost:3000', origin: 'http://localhost:3000' },
    { host: 'localhost:3000/path', origin: 'http://localhost:3000' },
  ];
  it.each(invalidHeaders)('rejects missing, cross-site, malformed or ambiguous origin/host headers %j', headers => {
    expect(isSameOriginNarrationRequest(request(headers))).toBe(false);
  });
});

describe('canonical narration boundary', () => {
  it('accepts canonical identifiers for all nine topics', () => {
    for (let week = 1; week <= 9; week++) expect(parseNarrationRequest({ week, stage: 'etapa-1', kind: 'beat', beat: 0, segment: 1 })).toMatchObject({ week });
  });

  it.each([
    { week: 1, stage: 'etapa', kind: 'intro', text: 'Arbitrary paid synthesis' },
    { week: 1, stage: 'etapa', kind: 'intro', model: 'other' },
    { week: 12, stage: 'etapa', kind: 'intro' },
    { week: '1', stage: 'etapa', kind: 'intro' },
    { week: 1, stage: '../etapa', kind: 'intro' },
    { week: 1, stage: 'etapa', kind: 'beat', beat: -1 },
    { week: 1, stage: 'etapa', kind: 'beat' },
    { week: 1, stage: 'etapa', kind: 'intro', structure: 'mesodermoa' },
    { week: 1, stage: 'etapa', kind: 'bridge' },
    { week: 1, stage: 'etapa', kind: 'intro', segment: 0.5 },
    { week: 1, stage: 'etapa', kind: ['intro'] },
  ])('rejects invalid or arbitrary input: %j', (input) => expect(() => parseNarrationRequest(input)).toThrow(NarrationError));

  it('bounds chunked JSON before parsing, regardless of content-length', async () => {
    const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(2100))); controller.close(); } });
    const request = new Request('https://example.test', { method: 'POST', body, duplex: 'half' } as RequestInit);
    await expect(readBoundedBody(request, 2048)).rejects.toMatchObject({ status: 413 });
    expect(await readBoundedBody(new Response('{"week":1}'), 2048)).toBe('{"week":1}');
  });
});

describe('audio playback compatibility', () => {
  it('wraps documented PCM with a correct mono 24kHz WAV header without changing samples', () => {
    const pcm = Buffer.from([0, 0, 255, 127, 0, 128]);
    const wav = audioToWav(pcm.toString('base64'), 'audio/L16;codec=pcm;rate=24000');
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.readUInt32LE(4)).toBe(wav.length - 8);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.readUInt32LE(40)).toBe(pcm.length);
    expect(wav.subarray(44)).toEqual(pcm);
    expect(audioToWav(wav.toString('base64'), 'audio/wav')).toEqual(wav);
  });

  it.each([['%%%%', 'audio/wav'], ['aGVsbG8=', 'audio/wav'], ['AA==', 'audio/l16'], ['AAA=', 'audio/mp3'], ['AAA=', 'audio/l16;rate=0'], ['AAA=', 'audio/l16;channels=2']])('rejects malformed/unsupported audio %s %s', (data, mime) => {
    expect(() => audioToWav(data, mime)).toThrow(NarrationError);
  });
});

describe('bounded shared audio cache and budgets', () => {
  it('deduplicates simultaneous synthesis and keeps completed audio', async () => {
    const cache = new AudioCache();
    const generate = vi.fn(async () => Buffer.from('audio'));
    const [a, b] = await Promise.all([cache.obtain('a', generate), cache.obtain('a', generate)]);
    expect(a).toEqual(b);
    expect(generate).toHaveBeenCalledTimes(1);
    await cache.obtain('a', generate);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures and frees pending slots', async () => {
    const cache = new AudioCache();
    await expect(cache.obtain('a', async () => { throw new Error('failed'); })).rejects.toThrow('failed');
    await expect(cache.obtain('a', async () => Buffer.from('ok'))).resolves.toEqual(Buffer.from('ok'));
  });

  it('evicts oldest content to stay under both bytes and lifetime', async () => {
    vi.useFakeTimers();
    const cache = new AudioCache(4, 3, 100);
    const generate = vi.fn(async () => Buffer.from('aa'));
    await cache.obtain('a', generate); await cache.obtain('b', generate); await cache.obtain('c', generate);
    await cache.obtain('a', generate);
    expect(generate).toHaveBeenCalledTimes(4);
    vi.advanceTimersByTime(101);
    await cache.obtain('a', generate);
    expect(generate).toHaveBeenCalledTimes(5);
  });

  it('limits independent syntheses to four but still shares existing work', async () => {
    const cache = new AudioCache();
    let finish!: (value: Buffer) => void;
    const pending = new Promise<Buffer>(resolve => { finish = resolve; });
    const jobs = ['a', 'b', 'c', 'd'].map(key => cache.obtain(key, () => pending));
    const same = cache.obtain('a', () => pending);
    await expect(cache.obtain('e', () => pending)).rejects.toMatchObject({ code: 'BUSY', status: 429 });
    finish(Buffer.from('ok'));
    await Promise.all([...jobs, same]);
  });

  it('caps request counts and refuses unbounded spoofed identities', () => {
    vi.useFakeTimers();
    const budget = new RequestBudget(2);
    expect(budget.allow('a', 2, 100)).toBe(true);
    expect(budget.allow('a', 2, 100)).toBe(true);
    expect(budget.allow('a', 2, 100)).toBe(false);
    expect(budget.allow('b', 2, 100)).toBe(true);
    expect(budget.allow('c', 2, 100)).toBe(false);
    vi.advanceTimersByTime(101);
    expect(budget.allow('a', 2, 100)).toBe(true);
    expect(budget.allow('c', 2, 100)).toBe(true);
  });
});
