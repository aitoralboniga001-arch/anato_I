import { useSyncExternalStore } from 'react';

/**
 * Boolean viewer preferences (playback mode, narration, which side panels are open), remembered per
 * browser. The playback mode is `quick` (quick replay) over `guided` (guided) over neither (normal).
 */
/** `fsAsk`: offer full screen when a stage starts playing ("Ez galdetu berriro" turns it off). */
export type PrefKey = 'guided' | 'quick' | 'voice' | 'subtitles' | 'outline' | 'panel' | 'fsAsk' | 'notes';

const DEFAULTS: Record<PrefKey, boolean> = { guided: true, quick: false, voice: false, subtitles: false, outline: true, panel: true, fsAsk: true, notes: false };

export type PlayMode = 'gidatua' | 'arrunta' | 'azkarra';

export const setPlayMode = (m: PlayMode) => {
  setPref('quick', m === 'azkarra');
  setPref('guided', m === 'gidatua');
};

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
      const saved = window.localStorage.getItem(KEY(k));
      // The stage list starts folded on narrower screens, so the scene gets the room; it opens with "[".
      v = saved === null ? (k === 'outline' ? window.innerWidth >= 1500 : DEFAULTS[k]) : saved === '1';
    } catch {
      v = DEFAULTS[k];
    }
    cache.set(k, v);
  }
  return v;
};

/** Read a preference outside render (event handlers). */
export const getPref = (k: PrefKey) => readPref(k);

export const setPref = (k: PrefKey, v: boolean) => {
  cache.set(k, v);
  try {
    window.localStorage.setItem(KEY(k), v ? '1' : '0');
  } catch {
    // Storage unavailable: the preference lasts for this page only.
  }
  listeners.forEach((l) => l());
};

/** The default on the server and during hydration (voice stays off until the client can speak). */
export const usePref = (k: PrefKey) =>
  useSyncExternalStore(
    subscribe,
    () => readPref(k),
    () => DEFAULTS[k],
  );
