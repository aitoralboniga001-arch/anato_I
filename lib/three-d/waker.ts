/**
 * A frame loop that sleeps. `tick` draws one frame and says whether anything changed; the loop keeps
 * going while something does, and for `keepMs` after, then stops scheduling frames altogether (a still
 * picture costs nothing). `kick` wakes it: a new frame from the scene, a resize, a CSS transition or a
 * moved ancestor in the page.
 */
export interface Waker {
  kick(): void;
  readonly awake: boolean;
  stop(): void;
}

export interface WakerOptions {
  keepMs?: number;
  now?: () => number;
  raf?: (cb: (now: number) => void) => number;
  caf?: (id: number) => void;
}

export function createWaker(tick: (now: number) => boolean, o: WakerOptions = {}): Waker {
  const keepMs = o.keepMs ?? 500;
  const now = o.now ?? (() => performance.now());
  const raf = o.raf ?? ((cb) => requestAnimationFrame(cb));
  const caf = o.caf ?? ((id) => cancelAnimationFrame(id));
  let id = 0;
  let lastActive = -Infinity;
  let stopped = false;
  const loop = (t: number) => {
    id = 0;
    if (stopped) return;
    if (tick(t)) lastActive = t;
    if (t - lastActive < keepMs) id = raf(loop);
  };
  return {
    kick() {
      if (stopped) return;
      lastActive = now();
      if (!id) id = raf(loop);
    },
    get awake() {
      return id !== 0;
    },
    stop() {
      stopped = true;
      if (id) caf(id);
      id = 0;
    },
  };
}
