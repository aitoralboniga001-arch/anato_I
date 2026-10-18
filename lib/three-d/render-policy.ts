/** Conservative limits shared by every 3D view, including full-screen and retina displays. */
export const RENDER_PIXEL_BUDGET = 2_000_000;
export const RENDER_FRAME_MS = 1000 / 30;
export const GPU_FAILURE_KEY = 'enbrioatlas:gpu-unavailable:v1';

/** Harness-only Topic 10 comparison. Ordinary visits and every other topic retain their limits. */
export function renderTiming() {
  const env = globalThis as { __perf?: unknown; __topic10Fps?: unknown; location?: { pathname: string } };
  const fps = env.__perf && /^\/astea\/10\/?$/.test(env.location?.pathname ?? '') &&
    (env.__topic10Fps === 30 || env.__topic10Fps === 40) ? env.__topic10Fps : null;
  return { frameMs: fps ? 1000 / fps : RENDER_FRAME_MS, preserveCadence: fps !== null };
}

/** Carry fractional display-frame time; skip missed deadlines instead of bursting after a stall. */
export function nextRenderDeadline(now: number, previous: number, interval: number, preserveCadence = false) {
  if (!preserveCadence || !Number.isFinite(previous) || interval <= 0) return now + interval;
  return previous + Math.max(1, Math.floor((now - previous + 0.25) / interval) + 1) * interval;
}

export function renderRatio(width: number, height: number, dpr: number, maxDimension = Infinity) {
  const w = Math.max(1, width), h = Math.max(1, height);
  return Math.min(2, dpr || 1, Math.sqrt(RENDER_PIXEL_BUDGET / (w * h)), maxDimension / w, maxDimension / h);
}

type FailureStore = Pick<Storage, 'getItem' | 'setItem'>;

/** A failed context is not retried in the same tab, even after a reload. Storage can be unavailable. */
export function createRenderCircuit(storage: FailureStore | null) {
  let blocked = false;
  try { blocked = storage?.getItem(GPU_FAILURE_KEY) === '1'; } catch { /* In-memory protection still works. */ }
  const listeners = new Set<() => void>();
  return {
    get blocked() { return blocked; },
    trip() {
      if (blocked) return;
      blocked = true;
      try { storage?.setItem(GPU_FAILURE_KEY, '1'); } catch { /* Never lose the flat fallback to a storage error. */ }
      for (const cb of listeners) cb();
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
}
