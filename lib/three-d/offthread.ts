import { useEffect, useSyncExternalStore } from 'react';

/**
 * The heavy, one-time geometry of the 3D views (surface meshes from distance fields take half a
 * second or more each) built off the main thread, so opening a 3D view never freezes the page.
 *
 * Each builder is registered as a slot with a key. In the browser the slot is filled by a Web Worker
 * (the same builders, run there) and the view waits for it; on the server, in the tests and wherever
 * a worker is unavailable, `geoOf` builds it right here, synchronously, as before.
 */
export interface GeoSlot<T> {
  key: string;
  build: () => T;
  /** What crosses to the main thread (structured-cloneable: drop functions here). */
  pack?: (v: T) => unknown;
  /** Rebuild the value from what crossed (restore the functions). */
  unpack?: (d: unknown) => T;
  value: T | null;
}

const slots = new Map<string, GeoSlot<unknown>>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function geoSlot<T>(key: string, build: () => T, io: { pack?: (v: T) => unknown; unpack?: (d: unknown) => T } = {}): GeoSlot<T> {
  const s: GeoSlot<T> = { key, build, ...io, value: null };
  slots.set(key, s as GeoSlot<unknown>);
  return s;
}

/** The slot's value, built here and now if it has not arrived (server, tests, no worker). */
export function geoOf<T>(s: GeoSlot<T>): T {
  return (s.value ??= s.build());
}

/** In the worker: build one slot and return what crosses. */
export function buildForTransfer(key: string): unknown {
  const s = slots.get(key);
  if (!s) throw new Error(`no geometry slot ${key}`);
  const v = geoOf(s);
  return s.pack ? s.pack(v) : v;
}

/**
 * Who builds missing slots in the browser: set by geo-client.ts (the Web Worker), which this module
 * must not import (the worker loads this module too). Until it is set, slots are built when rendered.
 */
let requester: ((keys: string[]) => void) | null = null;
export function setGeoRequester(fn: (keys: string[]) => void) {
  requester = fn;
}

/** Fill a slot that crossed from the worker, and re-render the views waiting for it. */
export function adoptGeo(key: string, data: unknown) {
  const s = slots.get(key);
  if (!s || s.value) return;
  s.value = s.unpack ? s.unpack(data) : data;
  notify();
}

/** Build a slot here, in the browser's idle time (no worker). */
export function buildIdle(key: string) {
  const run = () => {
    const s = slots.get(key);
    if (!s || s.value) return;
    try {
      geoOf(s);
    } catch {
      // Built again (and reported) when the view renders.
    }
    notify();
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 200);
}

/** Has this slot been built (or has it arrived)? */
export const geoReady = (key: string) => !!slots.get(key)?.value;

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/**
 * Are these slots ready? On the server (and in the tests) always: they are built on demand there.
 * In the browser, asks for any missing one and re-renders when it arrives.
 */
export function useGeoReady(list: GeoSlot<any>[]): boolean {
  const ready = useSyncExternalStore(
    subscribe,
    () => list.every((s) => !!s.value),
    () => true,
  );
  const keys = list.map((s) => s.key).join('|');
  useEffect(() => {
    if (ready) return;
    const missing = keys.split('|');
    if (requester) requester(missing);
    else missing.forEach(buildIdle);
  }, [ready, keys]);
  return ready;
}
