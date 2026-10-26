import { useEffect, useRef, useSyncExternalStore } from 'react';

const KEY = 'enbrioatlas:visited';

type Store = Record<string, string[]>;

const read = (): Store => {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, ids]) => Array.isArray(ids) && ids.every((id) => typeof id === 'string'))) as Store;
  } catch {
    return {};
  }
};

// Snapshots are cached per week so useSyncExternalStore sees a stable array until it changes.
const cache = new Map<number, string[]>();
const listeners = new Set<() => void>();
const NONE: string[] = [];

function storageChanged(event: StorageEvent) {
  if (event.key !== null && ![KEY, LAST_KEY, PLACE_KEY].includes(event.key)) return;
  cache.clear();
  allCache = null;
  lastCache = undefined;
  placesCache = undefined;
  listeners.forEach((l) => l());
}

export const subscribeProgress = (cb: () => void) => {
  if (!listeners.size) window.addEventListener('storage', storageChanged);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (!listeners.size) window.removeEventListener('storage', storageChanged);
  };
};

/** Stage ids the viewer has opened in a week (per-browser convenience only). */
export const readVisited = (week: number): string[] => {
  let list = cache.get(week);
  if (!list) {
    list = read()[week] ?? NONE;
    cache.set(week, list);
  }
  return list;
};

export const markVisited = (week: number, stageId: string) => {
  if (readVisited(week).includes(stageId)) return;
  const all = { ...(allCache ?? read()) };
  const list = [...(all[week] ?? []), stageId];
  all[week] = list;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable (private mode): progress simply isn't remembered.
  }
  cache.set(week, list);
  allCache = all;
  listeners.forEach((l) => l());
};

/** Visited stage ids for a week; empty on the server and during hydration. */
export const useVisited = (week: number) =>
  useSyncExternalStore(
    subscribeProgress,
    () => readVisited(week),
    () => NONE,
  );

let allCache: Store | null = null;

// Where the student last was (topic + stage), for the home page's "Jarraitu".
const LAST_KEY = 'enbrioatlas:last';
export interface LastPlace {
  week: number;
  stage: string;
  view?: string;
  t?: number;
  chunk?: string;
}
let lastCache: LastPlace | null | undefined;
const readLast = (): LastPlace | null => {
  if (lastCache === undefined) {
    try {
      lastCache = validPlace(JSON.parse(window.localStorage.getItem(LAST_KEY) ?? 'null'));
    } catch {
      lastCache = null;
    }
  }
  return lastCache;
};
const PLACE_KEY = 'enbrioatlas:places';
let placesCache: Record<string, LastPlace> | undefined;
function validPlace(v: unknown): LastPlace | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as LastPlace;
  if (!Number.isInteger(p.week) || p.week < 1 || typeof p.stage !== 'string' || !p.stage) return null;
  return { week: p.week, stage: p.stage,
    ...(typeof p.view === 'string' ? { view: p.view } : {}),
    ...(typeof p.t === 'number' && Number.isFinite(p.t) ? { t: Math.max(0, Math.min(1, p.t)) } : {}),
    ...(typeof p.chunk === 'string' ? { chunk: p.chunk } : {}),
  };
}

/** Read fresh before a write: another tab may have saved a different topic meanwhile. */
function persistedPlaces(): Record<string, LastPlace> {
  const places: Record<string, LastPlace> = {};
  try {
    const legacy = validPlace(JSON.parse(window.localStorage.getItem(LAST_KEY) ?? 'null'));
    if (legacy) places[legacy.week] = legacy;
    const raw = JSON.parse(window.localStorage.getItem(PLACE_KEY) ?? '{}');
    for (const v of Object.values(raw ?? {})) {
      const p = validPlace(v);
      if (p) places[p.week] = p;
    }
  } catch {}
  return places;
}

export function readPlace(week: number): LastPlace | null {
  placesCache ??= persistedPlaces();
  return placesCache[week] ?? (readLast()?.week === week ? readLast() : null);
}

export function savePlace(place: LastPlace) {
  const p = validPlace(place);
  if (!p) return;
  readPlace(p.week);
  const persisted = persistedPlaces();
  const previousLast = readLast();
  // Preserve legacy global progress before replacing it, including when storage is unavailable.
  const merged = { ...(previousLast ? { [previousLast.week]: previousLast } : {}), ...placesCache, ...persisted, [p.week]: p };
  if (JSON.stringify(lastCache) === JSON.stringify(p) && JSON.stringify(placesCache) === JSON.stringify(merged)) return;
  placesCache = merged;
  lastCache = p;
  try {
    window.localStorage.setItem(PLACE_KEY, JSON.stringify(placesCache));
    window.localStorage.setItem(LAST_KEY, JSON.stringify(p));
  } catch {} // The in-memory location still works when storage is unavailable.
  listeners.forEach((l) => l());
}

export const usePlace = (week: number) => useSyncExternalStore(subscribeProgress, () => readPlace(week), () => null);

/** Legacy visits mean opened, not finished: return to the most recently opened valid stage. */
export function resumeHref(week: number, stages: readonly { id: string }[], place: LastPlace | null, visited: readonly string[] = []) {
  const saved = place?.week === week && stages.some((s) => s.id === place.stage) ? place : null;
  const stage = saved?.stage ?? [...visited].reverse().find((id) => stages.some((s) => s.id === id));
  if (!stage) return `/astea/${week}`;
  const q = new URLSearchParams({ etapa: stage });
  if (saved?.view) q.set('ikuspegia', saved.view);
  if (saved?.t !== undefined) q.set('une', String(saved.t));
  if (saved?.chunk) q.set('klasea', saved.chunk);
  return `/astea/${week}?${q}`;
}

/** Only committed snapshots enter here: time can never be paired with another stage's view. */
export function createPlaceRecorder(save: (p: LastPlace) => void = savePlace) {
  let latest: LastPlace | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let saved = '';
  const flush = () => {
    const key = JSON.stringify(latest);
    if (!latest || key === saved) return;
    save(latest);
    saved = key;
  };
  return {
    update(place: LastPlace, moving: boolean) {
      const changed = !latest || latest.week !== place.week || latest.stage !== place.stage || latest.view !== place.view || latest.chunk !== place.chunk;
      latest = { ...place };
      clearTimeout(timer);
      if (changed) flush();
      // Debounce scrubbing/glides; animation frames only update memory.
      if (!moving) timer = setTimeout(flush, 300);
    },
    flush,
    dispose() { clearTimeout(timer); flush(); },
  };
}

export function useStudyPosition(place: LastPlace | null, moving: boolean) {
  const recorder = useRef<ReturnType<typeof createPlaceRecorder> | null>(null);
  useEffect(() => {
    const r = createPlaceRecorder();
    recorder.current = r;
    const hidden = () => { if (document.hidden) r.flush(); };
    const timer = setInterval(r.flush, 5000);
    window.addEventListener('pagehide', r.flush);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', r.flush);
      document.removeEventListener('visibilitychange', hidden);
      r.dispose();
      recorder.current = null;
    };
  }, []);
  useEffect(() => { if (place) recorder.current?.update(place, moving); });
}

/** Last saved study location; null on the server, during hydration and before any visit. */
export const useLastPlace = () =>
  useSyncExternalStore(
    subscribeProgress,
    readLast,
    () => null,
  );
const EMPTY: Store = {};

/** Visited stages of every topic at once (the home page's study route). */
export const useVisitedAll = () =>
  useSyncExternalStore(
    subscribeProgress,
    () => (allCache ??= read()),
    () => EMPTY,
  );
