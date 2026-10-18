import { adoptGeo, buildIdle, geoReady, setGeoRequester } from './offthread';

/**
 * The main thread's side of the geometry worker (see offthread.ts). Kept apart from offthread.ts,
 * which the worker itself loads: only the page imports this file, so the worker never contains it.
 */
let worker: Worker | null | undefined;
const asked = new Set<string>();
const pending = new Set<string>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    const w = new Worker(new URL('./geo.worker.ts', import.meta.url), { type: 'module' });
    worker = w;
    w.onmessage = (e: MessageEvent<{ key: string; data?: unknown; error?: string }>) => {
      if (worker !== w) return;
      const { key, data, error } = e.data;
      pending.delete(key);
      if (error) buildIdle(key);
      else adoptGeo(key, data);
      // The page owns the delivered meshes. Release the worker's duplicate meshes, fields and
      // module caches after this batch; another requested view can start a fresh worker later.
      if (!pending.size) { w.terminate(); worker = undefined; }
    };
    w.onerror = () => {
      if (worker !== w) return;
      // The worker could not start: whatever is still missing is built here instead.
      w.terminate();
      worker = null;
      for (const k of pending) if (!geoReady(k)) buildIdle(k);
      pending.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

/** Start building these slots now, off the main thread, in order. Safe to call often. */
export function warmGeo(keys: string[]) {
  if (typeof window === 'undefined') return;
  for (const key of keys) {
    if (asked.has(key) || geoReady(key)) continue;
    asked.add(key);
    const w = getWorker();
    if (w) { pending.add(key); w.postMessage({ key }); }
    else buildIdle(key);
  }
}

setGeoRequester(warmGeo);
