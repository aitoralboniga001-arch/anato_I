import { afterEach, describe, expect, it, vi } from 'vitest';
import { weeks, structures } from '@/content/registry';
import { getNarrationSegments, narratedFrame, splitNarration, needsStageRestart } from '@/lib/sim/narration';
import { parseNarrationRequest } from '@/lib/narration/server-utils';
import { NarrationTransport } from '@/components/shell/narrate';

const settle = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };
class FakeAudio {
  static all: FakeAudio[] = [];
  duration = 10; currentTime = 0; playbackRate = 1;
  onended: (() => void) | null = null; onerror: (() => void) | null = null;
  play = vi.fn(async () => {}); pause = vi.fn(); removeAttribute = vi.fn(); load = vi.fn();
  constructor(public src: string) { FakeAudio.all.push(this); }
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); FakeAudio.all = []; });

describe('course narration', () => {
  it('retains every original beat across all six themes, including ordinal days', () => {
    expect(splitNarration('15. eguna: hasten da. Gero, amaitzen da.')).toEqual(['15. eguna: hasten da.', 'Gero, amaitzen da.']);
    for (const week of weeks) for (const stage of week.stages) for (let beat = 0; beat < stage.beats.length; beat++) {
      const segments = getNarrationSegments(week, stage, 'beat', { beat });
      expect(segments.map((s) => s.text).join(' ')).toBe(stage.beats[beat].text.trim().replace(/\s+/g, ' '));
      expect(parseNarrationRequest({ week: week.week, stage: stage.id, kind: 'beat', beat, segment: 0 })).toBeTruthy();
    }
  });
  it('resolves inherited canonical structures and all view bridges', () => {
    for (const week of weeks) for (const stage of week.stages) {
      for (const id of stage.structures) if (structures.has(id)) expect(getNarrationSegments(week, stage, 'structure', { structure: id }).length).toBeGreaterThan(0);
      for (const view of stage.views) expect(getNarrationSegments(week, stage, 'bridge', { view: view.id }).map((s) => s.text).join(' ')).toContain(view.description);
    }
  });
  it('resumes final narration, observation and manual holds instead of replaying a completed stage', () => {
    expect(needsStageRestart(false, 1, true)).toBe(false);
    expect(needsStageRestart(false, 1, false)).toBe(true);
    expect(needsStageRestart(true, 1, false)).toBe(false);
    expect(needsStageRestart(false, .8, false)).toBe(false);
  });
  it('maps audio position monotonically inside one step', () => {
    expect(narratedFrame(.2, .6, 1, 2, .5)).toBeCloseTo(.5);
    expect(narratedFrame(.2, .6, 1, 2, 1)).toBeCloseTo(.6);
    expect(narratedFrame(.2, .6, 0, 2, -1)).toBeCloseTo(.2);
  });
});

describe('audio ownership', () => {
  function setup() {
    vi.stubGlobal('Audio', FakeAudio);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:clip');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
      parseNarrationRequest(JSON.parse(options.body as string));
      return { ok: true, blob: async () => new Blob(['wav'], { type: 'audio/wav' }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const transport = new NarrationTransport(() => {});
    return { transport, revoke, fetchMock };
  }
  it('pauses/resumes the same sample, keeps playback speed and gives a paused observation interval', async () => {
    const { transport, revoke, fetchMock } = setup();
    transport.start('step', { week: 1, stage: weeks[0].stages[0].id, kind: 'beat', beat: 0 }, [{ text: 'A.', focus: ['x'] }], 1.5);
    await settle();
    const audio = FakeAudio.all[0]; audio.currentTime = 4;
    transport.pause(); expect(transport.snapshot().fraction).toBe(.4);
    transport.resume(); await settle(); expect(audio.currentTime).toBe(4); expect(fetchMock).toHaveBeenCalledTimes(1);
    transport.setSpeed(.5); expect(audio.playbackRate).toBe(.5);
    audio.onended!(); transport.pause(); transport.tick(10); expect(transport.snapshot().status).toBe('observing');
    expect(needsStageRestart(false, 1, !!transport.key)).toBe(false);
    transport.resume(); transport.tick(1); expect(transport.snapshot().status).toBe('observing');
    transport.tick(.5); expect(transport.snapshot().status).toBe('done');
    transport.pause(); expect(needsStageRestart(false, 1, !!transport.key)).toBe(false);
    transport.dispose(); expect(needsStageRestart(false, 1, !!transport.key)).toBe(true); expect(revoke).toHaveBeenCalledWith('blob:clip');
  });
  it.each(['resolve', 'reject'] as const)('preserves pause during a pending play promise (%s)', async (outcome) => {
    const { transport } = setup();
    let resolvePlay!: () => void;
    let rejectPlay!: (error: Error) => void;
    class DeferredAudio extends FakeAudio {
      play = vi.fn(() => new Promise<void>((resolve, reject) => { resolvePlay = resolve; rejectPlay = reject; }));
    }
    vi.stubGlobal('Audio', DeferredAudio);
    transport.start('step', { week: 1, stage: weeks[0].stages[0].id, kind: 'beat', beat: 0 }, [{ text: 'A.', focus: [] }], 1);
    await settle();
    const audio = FakeAudio.all[0]; audio.currentTime = 3;
    transport.pause(); expect(transport.snapshot().status).toBe('paused');
    if (outcome === 'resolve') resolvePlay(); else rejectPlay(new DOMException('Paused', 'AbortError'));
    await settle(); expect(transport.snapshot().status).toBe('paused');
    transport.resume(); expect(audio.play).toHaveBeenCalledTimes(2);
    resolvePlay(); await settle(); expect(transport.snapshot().status).toBe('playing'); expect(audio.currentTime).toBe(3);
    transport.dispose();
  });
  it('shares an in-flight preload with active loading of the next fragment', async () => {
    const { transport } = setup();
    let nextResponse!: (value: unknown) => void;
    const requests: number[] = [];
    vi.stubGlobal('fetch', (_url: string, options: RequestInit) => {
      const { segment } = JSON.parse(options.body as string); requests.push(segment);
      const response = { ok: true, blob: async () => new Blob(['wav'], { type: 'audio/wav' }) };
      return segment === 0 ? Promise.resolve(response) : new Promise((resolve) => { nextResponse = resolve; });
    });
    transport.start('step', { week: 1, stage: weeks[0].stages[0].id, kind: 'beat', beat: 0 }, [{ text: 'A.', focus: [] }, { text: 'B.', focus: [] }], 1);
    await settle(); FakeAudio.all[0].onended!(); await settle();
    expect(requests).toEqual([0, 1]);
    nextResponse({ ok: true, blob: async () => new Blob(['wav'], { type: 'audio/wav' }) });
    await settle(); expect(FakeAudio.all).toHaveLength(2); transport.dispose();
  });
  it('does not allow a late cancelled request to play', async () => {
    setup(); let resolve!: (value: unknown) => void;
    vi.stubGlobal('fetch', () => new Promise((done) => { resolve = done; }));
    const transport = new NarrationTransport(() => {});
    transport.start('old', { week: 1, stage: weeks[0].stages[0].id, kind: 'intro' }, [{ text: 'A.', focus: [] }], 1);
    transport.cancel(); resolve({ ok: true, blob: async () => new Blob(['wav'], { type: 'audio/wav' }) });
    await settle(); expect(FakeAudio.all).toHaveLength(0); expect(transport.key).toBe('');
  });
});

describe('segments without a recorded clip', () => {
  const stage = weeks[0].stages[0].id;
  class Utterance { onstart?: () => void; onend?: () => void; onerror?: () => void; onboundary?: () => void; voice: unknown; lang = ''; rate = 1; volume = 1; constructor(public text: string) {} }
  function setup(voices: object[] = [{ name: 'Mónica', lang: 'es-ES', localService: true }], status = 404, code = 'AUDIO_NOT_FOUND') {
    vi.useFakeTimers();
    const said: Utterance[] = [];
    const synth = { getVoices: () => voices, speak: vi.fn((u: Utterance) => { said.push(u); }), cancel: vi.fn(), addEventListener: vi.fn() };
    vi.stubGlobal('window', { speechSynthesis: synth, localStorage: { getItem: () => null, setItem: () => {} } });
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
    vi.stubGlobal('Audio', FakeAudio);
    const fetchMock = vi.fn(async () => ({ ok: false, status, json: async () => ({ code }) }));
    vi.stubGlobal('fetch', fetchMock);
    const states: string[] = [];
    const transport = new NarrationTransport((s) => { if (states.at(-1) !== s.status) states.push(s.status); });
    const sayNext = async () => { await settle(); vi.advanceTimersByTime(60); return said.at(-1)!; };
    return { transport, said, synth, fetchMock, states, sayNext };
  }
  afterEach(() => { vi.useRealTimers(); });

  it('speaks the step with the browser voice, keeping pause, speed, progress and step pacing', async () => {
    const { transport, said, synth, fetchMock, states, sayNext } = setup();
    transport.start('step', { week: 1, stage, kind: 'beat', beat: 0 }, [{ text: 'Bihotz hodia.', focus: ['a'] }, { text: 'Zain sinua.', focus: ['b'] }], 1.25);
    const first = await sayNext();
    expect(first.text).toBe('bihots hodia.'); // respelled for a Spanish voice, as the class does
    expect(first.rate).toBe(1.25);
    expect(transport.snapshot().status).toBe('loading');
    first.onstart!(); expect(transport.snapshot().status).toBe('playing');
    vi.advanceTimersByTime(400); const reached = transport.snapshot().fraction; expect(reached).toBeGreaterThan(0);
    transport.pause(); expect(transport.snapshot().status).toBe('paused'); expect(synth.cancel).toHaveBeenCalled();
    transport.setSpeed(.75); transport.resume();
    const again = await sayNext(); expect(again).not.toBe(first); expect(again.rate).toBe(.75);
    again.onstart!(); vi.advanceTimersByTime(80); expect(transport.snapshot().fraction).toBeGreaterThanOrEqual(reached);
    again.onend!(); const second = await sayNext();
    expect(transport.snapshot()).toMatchObject({ segment: 1, text: 'Zain sinua.', focus: ['b'] });
    second.onstart!(); second.onend!(); await settle();
    expect(transport.snapshot().status).toBe('observing');
    transport.tick(1.5); expect(transport.snapshot().status).toBe('done');
    expect(states).not.toContain('error'); expect(said).toHaveLength(3); expect(FakeAudio.all).toHaveLength(0);
    // Each missing clip is asked for once (the second via preload), never retried.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    transport.dispose();
  });
  it('says plainly that the step has no recorded voice when the browser has none', async () => {
    const { transport } = setup([]);
    transport.start('step', { week: 1, stage, kind: 'intro' }, [{ text: 'A.', focus: [] }], 1);
    await settle(); vi.advanceTimersByTime(1500); await settle(); // voices that never load: loadVoices gives up
    expect(transport.snapshot().status).toBe('error');
    expect(transport.snapshot().error).toMatch(/ahots grabaturik/);
    expect(transport.snapshot().error).not.toMatch(/Saiatu berriro/);
  });
  it('keeps real server failures as errors', async () => {
    const { transport, said } = setup(undefined, 500, 'SERVER_ERROR');
    transport.start('step', { week: 1, stage, kind: 'intro' }, [{ text: 'A.', focus: [] }], 1);
    await settle(); vi.advanceTimersByTime(60);
    expect(transport.snapshot()).toMatchObject({ status: 'error', error: 'Ezin izan da audioa erreproduzitu. Saiatu berriro.' });
    expect(said).toHaveLength(0);
  });
  it('never cancels speech it did not start (the class shares speechSynthesis)', () => {
    const { transport, synth } = setup();
    transport.start('step', { week: 1, stage, kind: 'intro' }, [{ text: 'A.', focus: [] }], 1);
    transport.cancel(); transport.dispose();
    expect(synth.cancel).not.toHaveBeenCalled();
  });
});
