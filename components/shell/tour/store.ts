'use client';

import { useSyncExternalStore } from 'react';

/**
 * The guide ("Gida"): one short tour per place. The home page teaches where to start; the simulator
 * teaches how to study. Any button can start one; the place's <TourHost> draws it.
 */
export type TourId = 'sim' | 'home';

type State = { active: TourId | null; offer: TourId | null; run: number };

let state: State = { active: null, offer: null, run: 0 };
const listeners = new Set<() => void>();
const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const SERVER: State = { active: null, offer: null, run: 0 };

/** Starts (or restarts, from its first stop) the tour of a place. */
export function startTour(id: TourId) {
  markOffered(id);
  emit({ active: id, offer: null, run: state.run + 1 });
}

export function endTour() {
  if (state.active) markOffered(state.active);
  emit({ active: null });
}

/** Shows the quiet first-visit offer; it is remembered as made, so it never comes back by itself. */
export function showOffer(id: TourId) {
  if (state.active || wasOffered(id)) return false;
  markOffered(id);
  emit({ offer: id });
  return true;
}

export function hideOffer() {
  if (state.offer) emit({ offer: null });
}

export const tourState = () => state;

export function useTourState(): State {
  return useSyncExternalStore(subscribe, tourState, () => SERVER);
}

/** True while a tour or its offer holds the eye: other first-time cards and nudges wait. */
export const isTourBusy = () => !!(state.active || state.offer);

export function useTourBusy(): boolean {
  return useSyncExternalStore(subscribe, isTourBusy, () => false);
}

const key = (id: TourId) => `enbrioatlas:gida:${id}`;

export function wasOffered(id: TourId): boolean {
  try {
    return window.localStorage.getItem(key(id)) === '1';
  } catch {
    // No storage (private mode, blocked): never push the offer on every visit.
    return true;
  }
}

function markOffered(id: TourId) {
  try {
    window.localStorage.setItem(key(id), '1');
  } catch {
    // Storage unavailable: nothing to remember.
  }
}

/** Test hook: back to a fresh page. */
export function resetTourStore() {
  state = { active: null, offer: null, run: 0 };
  listeners.forEach((l) => l());
}
