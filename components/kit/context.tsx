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
  /** A whole's drawn members: pointing at the whole lights them too. */
  partsOf?: (id: string) => readonly string[];
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

/**
 * How much labels grow so they stay readable when the frame is drawn small (k = 1: their drawn size),
 * and which side orientation pills cover the frame. The viewport sets it from its on-screen scale;
 * each label then caps k so it stays inside the frame and clear of the pills and the toolbar.
 */
export interface LabelScale {
  k: number;
  left: boolean;
  right: boolean;
}

export const LabelScaleContext = createContext<LabelScale>({ k: 1, left: false, right: false });

export const useLabelScale = () => useContext(LabelScaleContext);

/**
 * Visual state of a structure id given the current interaction state. A drawing also answers to the
 * groups it belongs to in the scene (`groups`) and to any whole whose drawn members include it.
 */
export function partState(ctx: SceneContextValue, id: string, groups: readonly string[] = []): 'active' | 'dim' | 'focus' | 'idle' | 'spot' | 'shade' | 'ctx' {
  const is = (x: string) => x === id || groups.includes(x) || !!ctx.partsOf?.(x).includes(id);
  const pointed = ctx.hovered ?? ctx.selected;
  if (ctx.quizFlash?.id === id) return 'active';
  if (pointed) return is(pointed) ? 'active' : 'dim';
  if (ctx.spotlight) return is(ctx.spotlight) ? 'spot' : 'shade';
  if (ctx.focus.length) return ctx.focus.some(is) ? 'focus' : ctx.dimContext ? 'ctx' : 'idle';
  return 'idle';
}

/**
 * The viewport's top text layer: label names and notes are portalled here, above every leader line,
 * arrow and marker, so a line can never be drawn over a word. Null outside the viewport (thumbnails,
 * server render): text then stays inline.
 */
export const TextLayerContext = createContext<SVGGElement | null>(null);

/** Inside a dual view's pane (see Dual.tsx): the pane's own text layer stays out; the dual sets its names. */
export const PaneContext = createContext(false);

/**
 * The viewport's underlay: an HTML layer behind the scene SVG where a 3D view draws its shaded
 * tissue (WebGL), plus the scene group whose screen transform (zoom, pan, the room the preview
 * card makes) the drawing must follow. Null outside the viewport (thumbnails, contact sheets,
 * server render): 3D views then draw their projected outlines in the SVG instead.
 */
export interface Underlay {
  host: HTMLDivElement;
  scene: SVGGElement | null;
  /** Zoomed in: dragging pans the frame, so a 3D view does not turn. */
  zoomed: boolean;
}

export const UnderlayContext = createContext<Underlay | null>(null);

/**
 * Inside a SceneView every <Label> hands its props to this collector instead of drawing itself; the
 * view's label layer then lays the names out together (so columns follow their points and no two
 * leaders cross) and draws them. Outside a SceneView labels draw themselves, as before.
 */
export class LabelCollector {
  readonly entries = new Map<string, LabelEntry>();
  /** The last props of names that were dropped, for an effect that mounts them again (StrictMode). */
  private last = new Map<string, LabelEntry>();
  private listener: () => void = () => {};
  put(key: string, e: LabelEntry) {
    this.entries.set(key, e);
    this.last.set(key, e);
  }
  /** Back in, with the props it last rendered with. */
  restore(key: string) {
    const e = this.last.get(key);
    if (e) this.entries.set(key, e);
  }
  drop(key: string) {
    this.entries.delete(key);
  }
  notify() {
    this.listener();
  }
  /** The layer that draws the names; returns the unsubscribe. */
  listen(f: () => void) {
    this.listener = f;
    return () => {
      if (this.listener === f) this.listener = () => {};
    };
  }
}
export interface LabelEntry {
  id: string;
  x: number;
  y: number;
  ax?: number;
  ay?: number;
  align?: 'start' | 'middle' | 'end';
  show?: number;
  text?: string;
  small?: boolean;
  span?: [[number, number], [number, number]];
  /** Hand-placed: the label layer never moves it to another slot. */
  noArrange?: boolean;
}
export const LabelCollectorContext = createContext<LabelCollector | null>(null);
