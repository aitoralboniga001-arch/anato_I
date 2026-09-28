'use client';

import { createContext, useContext } from 'react';

export type QuizFlash = { id: string; ok: boolean } | null;

export interface SceneContextValue {
  selected: string | null;
  hovered: string | null;
  /** Structures highlighted by the active narrative beat. */
  focus: readonly string[];
  /** Cognitive focus: shade everything the beat is not about (only when its focus is drawn here). */
  dimContext?: boolean;
  /** Guided tour: the one structure lit right now; everything else is shaded. */
  spotlight?: string | null;
  showLabels: boolean;
  /** When quiz mode is on, labels are hidden and clicks answer the prompt. */
  quiz: boolean;
  quizFlash: QuizFlash;
  nameOf: (id: string) => string;
  /** Spaces (cavities) are labelled differently from tissues. */
  isSpace?: (id: string) => boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

const noop = () => {};

export const SceneContext = createContext<SceneContextValue>({
  selected: null,
  hovered: null,
  focus: [],
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => id,
  onSelect: noop,
  onHover: noop,
});

export const useScene = () => useContext(SceneContext);

/** Visual state of a structure id given the current interaction state. */
export function partState(ctx: SceneContextValue, id: string): 'active' | 'dim' | 'focus' | 'idle' | 'spot' | 'shade' | 'ctx' {
  const pointed = ctx.hovered ?? ctx.selected;
  if (ctx.quizFlash?.id === id) return 'active';
  if (pointed) return pointed === id ? 'active' : 'dim';
  if (ctx.spotlight) return ctx.spotlight === id ? 'spot' : 'shade';
  if (ctx.focus.length) return ctx.focus.includes(id) ? 'focus' : ctx.dimContext ? 'ctx' : 'idle';
  return 'idle';
}
