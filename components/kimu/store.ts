'use client';

import { useSyncExternalStore } from 'react';
import type { KimuHere, KimuTarget } from '@/lib/kimu/types';

/**
 * Kimu lives in the root layout, but the simulator owns the playback. This small store is the bridge:
 * the simulator says where the student is and how to jump to a step; Kimu says "open" and "go".
 */

interface Host {
  /** Jump to a step and play it (the simulator's own time machine, so "Bueltatu" works). */
  go: (t: KimuTarget) => void;
}

let host: Host | null = null;
let here: KimuHere | null = null;
let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function registerKimuHost(h: Host) {
  host = h;
  return () => {
    if (host === h) host = null;
  };
}

export const kimuHost = () => host;

export function setKimuHere(h: KimuHere | null) {
  here = h;
  emit();
}
export const getKimuHere = () => here;

export function setKimuOpen(v: boolean) {
  if (open === v) return;
  open = v;
  emit();
}
export const openKimu = () => setKimuOpen(true);
export const toggleKimu = () => setKimuOpen(!open);

export const useKimuOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );

/** The step the student is on: changes per step, not per frame. */
export const useKimuHere = () =>
  useSyncExternalStore(
    subscribe,
    () => here,
    () => null,
  );

/** Runs `cb` each time Kimu opens (from anywhere: the button, the K key, the toast). */
export function onKimuOpen(cb: () => void) {
  const l = () => {
    if (open) cb();
  };
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
