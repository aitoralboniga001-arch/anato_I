'use client';

import { cloneElement, isValidElement, useContext, type ReactNode } from 'react';
import type { SceneComponent, SceneProps } from '@/lib/sim/types';
import { PaneContext, useScene } from './context';
import { Label, Note } from './Label';

/**
 * Two views of the same moment side by side (e.g. the disc from above and its cross-section), so a
 * step can be followed in both at once. Each pane draws an existing scene, scaled into its half; the
 * scene's names are lifted out of the pane and set in that pane's outer column (left pane → left
 * column, right pane → right column), still pointing at the same spot, at full size and above every
 * line. Its notes are set under both panes. Scenes used here must return their Labels and Notes in
 * their own element tree (not inside a child component), which is how the stage scenes are written.
 */

export const useInPane = () => useContext(PaneContext);

export interface Pane {
  scene: SceneComponent;
  /** Short caption over the pane, with its orientation (e.g. "Goitik · goian kraneala"). */
  title: string;
  /** Point of the scene's 1000×640 frame shown at the pane centre, and the scale it is shown at. */
  fx: number;
  fy: number;
  s: number;
}

interface LabelProps {
  id: string;
  ax?: number;
  ay?: number;
  show?: number;
  text?: string;
  small?: boolean;
}
interface NoteProps {
  x: number;
  y: number;
  children: string;
  show?: number;
  tone?: 'dim' | 'accent' | 'warn';
  size?: number;
}

/** Name columns (outer) and panes (inner) of the 1000×640 frame. */
const COL_L = 196;
const COL_R = 804;
/** Default boundary between the panes; a scene whose right view is wide and short can move it left. */
const SPLIT = 440;
const panesAt = (split: number): [number, number][] => [
  [204, split - 4],
  [split + 4, 796],
];
const TOP = 52;
const BOTTOM = 572;

/** Strip Labels and Notes out of a scene's element tree, collecting their props. */
function lift(node: ReactNode, labels: LabelProps[], notes: NoteProps[]): ReactNode {
  if (Array.isArray(node)) return node.map((n) => lift(n, labels, notes));
  if (!isValidElement(node)) return node;
  if (node.type === Label) {
    labels.push(node.props as LabelProps);
    return null;
  }
  if (node.type === Note) {
    notes.push(node.props as NoteProps);
    return null;
  }
  const ch = (node.props as { children?: ReactNode }).children;
  if (ch === undefined || ch === null || typeof ch === 'function') return node;
  return Array.isArray(ch) ? cloneElement(node, undefined, ...ch.map((c) => lift(c, labels, notes))) : cloneElement(node, undefined, lift(ch, labels, notes));
}

/** Rows for one column: each name near its anchor's height, pushed apart so plates never overlap. */
function rows(wanted: number[], lo: number, hi: number, gap = 31): number[] {
  const order = wanted.map((w, i) => ({ w, i })).sort((p, q) => p.w - q.w);
  const ys = new Array<number>(wanted.length);
  let prev = lo - gap;
  for (const o of order) {
    ys[o.i] = Math.max(Math.min(Math.max(o.w, lo), hi), prev + gap);
    prev = ys[o.i];
  }
  let next = hi + gap;
  for (const o of order.slice().reverse()) {
    ys[o.i] = Math.min(ys[o.i], next - gap);
    next = ys[o.i];
  }
  return ys;
}

export interface DualOptions {
  /** x of the boundary between the panes (default 440; allowed 320–680). */
  split?: number;
}

export function dual(left: Pane, right: Pane, opts: DualOptions = {}): SceneComponent {
  const PANES = panesAt(Math.min(680, Math.max(320, opts.split ?? SPLIT)));
  function Dual({ t, reduced }: SceneProps) {
    const { nameOf } = useScene();
    // A side column is ~185 units wide: long names are set small so they never run off the frame.
    const fits = (l: LabelProps) => (l.text ?? nameOf(l.id)).length <= 20;
    const notes: NoteProps[] = [];
    const panes = [left, right].map((pane, i) => {
      const [x0, x1] = PANES[i];
      const px = (x0 + x1) / 2;
      const py = (TOP + BOTTOM) / 2;
      const map = (x: number, y: number): [number, number] => [px + (x - pane.fx) * pane.s, py + (y - pane.fy) * pane.s];
      const labels: LabelProps[] = [];
      // The scene is called here (not mounted) so its names can be taken out before it is drawn.
      const tree = lift((pane.scene as (p: SceneProps) => ReactNode)({ t, reduced }), labels, notes);
      const shown = labels
        .map((l) => ({ l, at: l.ax !== undefined && l.ay !== undefined ? map(l.ax, l.ay) : null }))
        .filter(({ l, at }) => (l.show ?? 1) > 0.02 && at && at[0] > x0 + 2 && at[0] < x1 - 2 && at[1] > TOP - 30 && at[1] < BOTTOM + 30);
      const ys = rows(shown.map(({ at }) => at![1]), i ? 240 : TOP + 20, BOTTOM - 4);
      return { pane, i, x0, x1, px, py, tree, shown, ys };
    });
    const liveNotes = notes.filter((n) => (n.show ?? 1) > 0.02).slice(-2);
    return (
      <g>
        <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
        {panes.map(({ pane, i, x0, x1, px, py, tree }) => (
          <g key={i}>
            <clipPath id={`dual-pane-${i}`}>
              <rect x={x0} y={TOP - 30} width={x1 - x0} height={BOTTOM - TOP + 60} rx={10} />
            </clipPath>
            <g clipPath={`url(#dual-pane-${i})`}>
              <g transform={`translate(${px} ${py}) scale(${pane.s}) translate(${-pane.fx} ${-pane.fy})`}>
                <PaneContext.Provider value={true}>{tree}</PaneContext.Provider>
              </g>
            </g>
            <rect x={x0} y={TOP - 30} width={x1 - x0} height={BOTTOM - TOP + 60} rx={10} fill="none" stroke="rgba(232,238,252,0.14)" pointerEvents="none" />
          </g>
        ))}
        {panes.map(({ pane, i, x0, x1, shown, ys }) => (
          <g key={`n${i}`}>
            <Note x={(x0 + x1) / 2} y={TOP - 40} tone="dim" size={13}>
              {pane.title}
            </Note>
            {shown.map(({ l, at }, j) => (
              <Label key={`${l.id}-${j}`} id={l.id} x={i ? COL_R : COL_L} y={ys[j]} ax={at![0]} ay={at![1]} align={i ? 'start' : 'end'} show={l.show ?? 1} text={l.text} small={l.small || !fits(l)} />
            ))}
          </g>
        ))}
        {liveNotes.map((n, j) => (
          <Note key={j} x={500} y={612 - (liveNotes.length - 1 - j) * 20} show={n.show} tone={n.tone} size={Math.min(n.size ?? 12.5, 12)}>
            {n.children}
          </Note>
        ))}
      </g>
    );
  }
  return Dual;
}
