import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let data: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  data = new Map();
  vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const stages = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

describe('study resume', () => {
  it('retains independent topic locations and the global last location across reloads', async () => {
    let p = await import('@/components/shell/progress');
    p.savePlace({ week: 10, stage: 'second', view: 'cut', t: .63 });
    p.savePlace({ week: 11, stage: 'first', view: 'outside', t: .24 });
    vi.resetModules();
    p = await import('@/components/shell/progress');
    expect(p.readPlace(10)).toEqual({ week: 10, stage: 'second', view: 'cut', t: .63 });
    expect(JSON.parse(data.get('enbrioatlas:last')!)).toEqual(p.readPlace(11));
    expect(p.resumeHref(10, stages, p.readPlace(10))).toBe('/astea/10?etapa=second&ikuspegia=cut&une=0.63');
  });

  it('migrates the legacy global location before a different topic replaces it', async () => {
    data.set('enbrioatlas:last', JSON.stringify({ week: 10, stage: 'second' }));
    let p = await import('@/components/shell/progress');
    expect(p.readPlace(10)?.stage).toBe('second');
    p.savePlace({ week: 11, stage: 'first', t: .3 });
    expect(p.readPlace(10)?.stage).toBe('second');
    vi.resetModules();
    p = await import('@/components/shell/progress');
    expect(p.readPlace(10)).toEqual({ week: 10, stage: 'second' });
  });

  it('merges independently cached tabs without dropping or reverting another topic', async () => {
    const a = await import('@/components/shell/progress');
    a.readPlace(10);
    vi.resetModules();
    const b = await import('@/components/shell/progress');
    b.readPlace(11);
    a.savePlace({ week: 10, stage: 'second', t: .7 });
    b.savePlace({ week: 11, stage: 'first', t: .3 });
    a.savePlace({ week: 10, stage: 'second', t: .8 });
    b.savePlace({ week: 11, stage: 'first', t: .4 });
    const saved = JSON.parse(data.get('enbrioatlas:places')!);
    expect(saved[10].t).toBe(.8);
    expect(saved[11].t).toBe(.4);
  });

  it('refreshes subscribed Home snapshots when another tab saves or clears storage', async () => {
    const p = await import('@/components/shell/progress');
    p.readPlace(10);
    p.readVisited(10);
    const changed = vi.fn();
    const unsubscribe = p.subscribeProgress(changed);
    data.set('enbrioatlas:places', JSON.stringify({ 10: { week: 10, stage: 'second', t: .8 } }));
    data.set('enbrioatlas:visited', JSON.stringify({ 10: ['second'] }));
    const notify = (key: string | null) => window.dispatchEvent(Object.assign(new Event('storage'), { key }));
    notify('unrelated');
    expect(changed).not.toHaveBeenCalled();
    notify('enbrioatlas:places');
    expect(changed).toHaveBeenCalledTimes(1);
    expect(p.readPlace(10)?.t).toBe(.8);
    expect(p.readVisited(10)).toEqual(['second']);
    data.clear();
    notify(null);
    expect(p.readPlace(10)).toBeNull();
    expect(p.readVisited(10)).toEqual([]);
    unsubscribe();
    notify('enbrioatlas:places');
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('does not let an unchanged idle recorder replace another tab global location', async () => {
    const p = await import('@/components/shell/progress');
    const recorder = p.createPlaceRecorder();
    recorder.update({ week: 10, stage: 'first', t: .2 }, true);
    p.savePlace({ week: 11, stage: 'second', t: .8 });
    recorder.flush();
    recorder.dispose();
    expect(JSON.parse(data.get('enbrioatlas:last')!).week).toBe(11);
  });

  it('visiting never overwrites a bookmark or implies completion', async () => {
    const p = await import('@/components/shell/progress');
    p.savePlace({ week: 10, stage: 'first', t: .4 });
    p.markVisited(10, 'second');
    expect(p.readPlace(10)?.stage).toBe('first');
    expect(p.resumeHref(10, stages, null, ['first', 'second'])).toBe('/astea/10?etapa=second');
  });

  it('reads legacy last place and uses last valid visit for other topics', async () => {
    data.set('enbrioatlas:last', JSON.stringify({ week: 10, stage: 'second' }));
    const p = await import('@/components/shell/progress');
    expect(p.resumeHref(10, stages, p.readPlace(10))).toBe('/astea/10?etapa=second');
    expect(p.resumeHref(11, stages, p.readPlace(11), ['first', 'second', 'removed'])).toBe('/astea/11?etapa=second');
    expect(p.resumeHref(12, stages, null)).toBe('/astea/12');
    expect(p.resumeHref(10, stages, { week: 10, stage: 'removed' }, ['first'])).toBe('/astea/10?etapa=first');
  });

  it('keeps working with unavailable storage and rejects malformed stored data', async () => {
    data.set('enbrioatlas:visited', 'null');
    data.set('enbrioatlas:places', JSON.stringify({ 10: { week: 10, stage: null } }));
    const p = await import('@/components/shell/progress');
    expect(p.readVisited(10)).toEqual([]);
    expect(p.readPlace(10)).toBeNull();
    Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('blocked'); } });
    p.savePlace({ week: 10, stage: 'first', t: .5 });
    p.markVisited(10, 'first');
    p.markVisited(10, 'second');
    expect(p.readPlace(10)?.t).toBe(.5);
    expect(p.readVisited(10)).toEqual(['first', 'second']);
  });

  it('cancels stale paused saves on stage changes and flushes the latest complete snapshot', async () => {
    const { createPlaceRecorder } = await import('@/components/shell/progress');
    const save = vi.fn();
    const recorder = createPlaceRecorder(save);
    recorder.update({ week: 10, stage: 'first', view: 'a', t: .9 }, false);
    recorder.update({ week: 10, stage: 'second', view: 'b', t: 0 }, true);
    vi.advanceTimersByTime(500);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ week: 10, stage: 'second', view: 'b', t: 0 });
    for (let i = 1; i <= 60; i++) recorder.update({ week: 10, stage: 'second', view: 'b', t: i / 100 }, true);
    expect(save).toHaveBeenCalledTimes(2);
    recorder.dispose();
    expect(save).toHaveBeenLastCalledWith({ week: 10, stage: 'second', view: 'b', t: .6 });
  });

  it('saves paused scrubbing after a short debounce and resumes classes without autoplay', async () => {
    const { createPlaceRecorder, resumeHref } = await import('@/components/shell/progress');
    const save = vi.fn();
    const recorder = createPlaceRecorder(save);
    recorder.update({ week: 10, stage: 'first', t: 0 }, false);
    recorder.update({ week: 10, stage: 'first', t: .25 }, false);
    recorder.update({ week: 10, stage: 'first', t: .5 }, false);
    vi.advanceTimersByTime(300);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ week: 10, stage: 'first', t: .5 });
    expect(resumeHref(10, stages, { week: 10, stage: 'first', t: .5, chunk: 'loop' })).toBe('/astea/10?etapa=first&une=0.5&klasea=loop');
    recorder.dispose();
  });
});
