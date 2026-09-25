import { useSyncExternalStore } from 'react';

/** Boolean viewer preferences (guided mode, narration), remembered per browser. */
export type PrefKey = 'guided' | 'voice';

const KEY = (k: PrefKey) => `enbrioatlas:${k}`;
const cache = new Map<PrefKey, boolean>();
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const readPref = (k: PrefKey) => {
  let v = cache.get(k);
  if (v === undefined) {
    try {
      v = window.localStorage.getItem(KEY(k)) === '1';
    } catch {
      v = false;
    }
    cache.set(k, v);
  }
  return v;
};

export const setPref = (k: PrefKey, v: boolean) => {
  cache.set(k, v);
  try {
    window.localStorage.setItem(KEY(k), v ? '1' : '0');
  } catch {
    // Storage unavailable: the preference lasts for this page only.
  }
  listeners.forEach((l) => l());
};

/** False on the server and during hydration. */
export const usePref = (k: PrefKey) =>
  useSyncExternalStore(
    subscribe,
    () => readPref(k),
    () => false,
  );
