import { useSyncExternalStore } from 'react';

const KEY = 'enbrioatlas:visited';

type Store = Record<string, string[]>;

const read = (): Store => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
};

// Snapshots are cached per week so useSyncExternalStore sees a stable array until it changes.
const cache = new Map<number, string[]>();
const listeners = new Set<() => void>();
const NONE: string[] = [];

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
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
  writeLast(week, stageId);
  if (readVisited(week).includes(stageId)) return;
  const all = read();
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
    subscribe,
    () => readVisited(week),
    () => NONE,
  );

let allCache: Store | null = null;

// Where the student last was (topic + stage), for the home page's "Jarraitu".
const LAST_KEY = 'enbrioatlas:last';
export interface LastPlace {
  week: number;
  stage: string;
}
let lastCache: LastPlace | null | undefined;
const readLast = (): LastPlace | null => {
  if (lastCache === undefined) {
    try {
      const v = JSON.parse(window.localStorage.getItem(LAST_KEY) ?? 'null') as LastPlace | null;
      lastCache = v && typeof v.week === 'number' && typeof v.stage === 'string' ? v : null;
    } catch {
      lastCache = null;
    }
  }
  return lastCache;
};
function writeLast(week: number, stage: string) {
  const cur = readLast();
  if (cur?.week === week && cur.stage === stage) return;
  lastCache = { week, stage };
  try {
    window.localStorage.setItem(LAST_KEY, JSON.stringify(lastCache));
  } catch {}
  listeners.forEach((l) => l());
}

/** The last stage opened in the simulator; null on the server, during hydration and before any visit. */
export const useLastPlace = () =>
  useSyncExternalStore(
    subscribe,
    readLast,
    () => null,
  );
const EMPTY: Store = {};

/** Visited stages of every topic at once (the home page's study route). */
export const useVisitedAll = () =>
  useSyncExternalStore(
    subscribe,
    () => (allCache ??= read()),
    () => EMPTY,
  );
