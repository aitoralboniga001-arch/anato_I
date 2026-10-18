import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextRenderDeadline, renderTiming, RENDER_FRAME_MS } from '@/lib/three-d/render-policy';
import { createWaker } from '@/lib/three-d/waker';

afterEach(() => vi.unstubAllGlobals());
describe('Topic 10 diagnostic frame-rate comparison', () => {
  it('requires the harness, an exact Topic 10 route and an allowed numeric target', () => {
    vi.stubGlobal('location', { pathname: '/astea/10' });
    vi.stubGlobal('__topic10Fps', 40);
    expect(renderTiming()).toEqual({ frameMs: RENDER_FRAME_MS, preserveCadence: false });
    vi.stubGlobal('__perf', {});
    expect(renderTiming()).toEqual({ frameMs: 25, preserveCadence: true });
    vi.stubGlobal('__topic10Fps', 30);
    expect(renderTiming()).toEqual({ frameMs: RENDER_FRAME_MS, preserveCadence: true });
    for (const fps of [0, 60, 120, '40', null, NaN]) {
      vi.stubGlobal('__topic10Fps', fps);
      expect(renderTiming()).toEqual({ frameMs: RENDER_FRAME_MS, preserveCadence: false });
    }
    vi.stubGlobal('__topic10Fps', 40);
    for (const pathname of ['/astea/1', '/astea/9', '/astea/11', '/astea/101', '/']) {
      vi.stubGlobal('location', { pathname });
      expect(renderTiming()).toEqual({ frameMs: RENDER_FRAME_MS, preserveCadence: false });
    }
    vi.stubGlobal('location', { pathname: '/astea/10/' });
    expect(renderTiming().frameMs).toBe(25);
  });

  it.each([60, 120])('delivers true 30/40 Hz from a %s Hz display, rather than silently quantizing 40 to 30', hz => {
    for (const fps of [30, 40]) {
      let next = -Infinity, previous = -Infinity, count = 0;
      const gaps: number[] = [];
      for (let i = 0; i < hz * 4; i++) {
        const now = i * 1000 / hz;
        if (now + 0.25 < next) continue;
        next = nextRenderDeadline(now, next, 1000 / fps, true);
        if (Number.isFinite(previous)) gaps.push(now - previous);
        previous = now; count++;
      }
      expect(count).toBe(fps * 4);
      expect(Math.min(...gaps)).toBeGreaterThanOrEqual(1000 / hz - 1e-8);
      expect(Math.max(...gaps)).toBeLessThanOrEqual(Math.ceil(hz / fps) * 1000 / hz + 1e-8);
    }
    let next = -Infinity, count = 0;
    for (let i = 0; i < 240; i++) {
      const now = i * 1000 / 60;
      if (now + 0.25 < next) continue;
      next = nextRenderDeadline(now, next, 25); count++;
    }
    expect(count).toBe(120); // A simple now + 25 ms gate still produces only 30 Hz at 60 Hz.
  });

  it('skips missed deadlines without catch-up bursts and accepts the early-frame tolerance', () => {
    expect(nextRenderDeadline(24.9, 25, 25, true)).toBe(50);
    expect(nextRenderDeadline(1015, 25, 25, true)).toBe(1025);
    expect(nextRenderDeadline(1015, -Infinity, 25, true)).toBe(1040);
    expect(nextRenderDeadline(1015, 25, 0, true)).toBe(1015);
    expect(nextRenderDeadline(1015, 25, RENDER_FRAME_MS)).toBe(1015 + RENDER_FRAME_MS);
  });

  it('keeps the waker asleep while disabled, resets cadence on resume and still settles', () => {
    let time = 0, id = 0, ticks = 0, changing = true;
    const queue = new Map<number, (now: number) => void>();
    const step = (ms: number) => { time += ms; const due = [...queue.values()]; queue.clear(); due.forEach(cb => cb(time)); };
    const w = createWaker(() => { ticks++; return changing; }, {
      minFrameMs: 25, preserveCadence: true, keepMs: 100,
      now: () => time, raf: cb => { queue.set(++id, cb); return id; }, caf: key => { queue.delete(key); },
    });
    w.kick(); for (let i = 0; i < 120; i++) step(1000 / 60);
    expect(ticks).toBe(80);
    w.setEnabled(false); const before = ticks; step(2000); expect(ticks).toBe(before);
    w.setEnabled(true); step(1000 / 60); expect(ticks).toBe(before + 1);
    changing = false; for (let i = 0; i < 30; i++) step(1000 / 60);
    expect(w.awake).toBe(false); expect(queue.size).toBe(0);
    w.kick(); step(1000 / 60); expect(w.awake).toBe(true);
    w.stop(); expect(queue.size).toBe(0);
  });
});
