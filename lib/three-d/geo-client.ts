import { adoptGeo, buildIdle, geoReady, setGeoRequester } from './offthread';

/**
 * The main thread's side of the geometry worker (see offthread.ts). Kept apart from offthread.ts,
 * which the worker itself loads: only the page imports this file, so the worker never contains it.
 */
let worker: Worker | null | undefined;
const asked = new Set<string>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./geo.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ key: string; data?: unknown; error?: string }>) => {
      const { key, data, error } = e.data;
      if (error) buildIdle(key);
      else adoptGeo(key, data);
    };
    worker.onerror = () => {
      // The worker could not start: whatever is still missing is built here instead.
      worker = null;
      for (const k of asked) if (!geoReady(k)) buildIdle(k);
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
    if (w) w.postMessage({ key });
    else buildIdle(key);
  }
}

setGeoRequester(warmGeo);
