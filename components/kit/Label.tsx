'use client';

import type { CSSProperties } from 'react';
import { partState, useLabelScale, useScene, type LabelScale } from './context';

/** Semibold text width per character at 1px font size (13.5px ≈ 7.1 frame units per character). */
const CHAR_W = 7.1 / 13.5;
/** Line box height per 1px of font size (13.5px text ≈ 15 frame units tall). */
const LINE_H = 15 / 13.5;
/** HTML chrome over the frame: the zoom and view buttons (top right) and the side orientation pills. */
const TOOLBAR = { x: 932, y: 222 };
const PILLS = { y0: 302, y1: 338, left: 114, right: 891 };

/**
 * Grow a label by up to `k` without leaving the 1000×640 frame or running under the chrome.
 * Labels that only fit at their drawn size keep it (the layout was checked at that size).
 */
function fitScale({ k, left: pillL, right: pillR }: LabelScale, x: number, y: number, anchor: 'start' | 'middle' | 'end', chars: number, size: number): number {
  if (k <= 1) return 1;
  const half = (size * k * LINE_H) / 2;
  const onPills = y + half > PILLS.y0 && y - half < PILLS.y1;
  const right = y - half < TOOLBAR.y ? TOOLBAR.x : onPills && pillR ? PILLS.right : 996;
  const left = onPills && pillL ? PILLS.left : 4;
  const room = anchor === 'end' ? x - left : anchor === 'start' ? right - x : 2 * Math.min(x - left, right - x);
  const fit = (room - 3) / (chars * CHAR_W * size); // a little slack for the width estimate
  const tall = (Math.min(y - 4, 636 - y) - 1) / ((size * LINE_H) / 2);
  return Math.max(1, Math.min(k, fit, tall));
}

/** Inline size for a grown label (none at drawn size, so the stylesheet keeps control). */
const grown = (size: number, k: number): CSSProperties | undefined =>
  k > 1 ? { fontSize: `${(size * k).toFixed(2)}px`, strokeWidth: `${(4 * Math.sqrt(k)).toFixed(2)}px` } : undefined;

interface LabelProps {
  /** Structure id; the text comes from the registry so names stay consistent everywhere. */
  id: string;
  /** Where the text sits. Keep labels in the side gutters (x < 190 or x > 810) when possible. */
  x: number;
  y: number;
  /** Anchor point on the structure (leader line target). Omit for a label without a leader. */
  ax?: number;
  ay?: number;
  /** Text alignment relative to (x, y). Defaults to 'end' when the anchor is to the right, else 'start'. */
  align?: 'start' | 'middle' | 'end';
  /** 0..1 visibility, so labels can fade in with their structure. */
  show?: number;
  /** Override the registry name (e.g. to add a day). Prefer the registry name. */
  text?: string;
  small?: boolean;
}

/** Textbook-style label with a leader line. Render labels after the geometry so they sit on top. */
export function Label({ id, x, y, ax, ay, align, show = 1, text, small }: LabelProps) {
  const ctx = useScene();
  const scale = useLabelScale();
  if (!ctx.showLabels || ctx.quiz || show <= 0.02) return null;
  const state = partState(ctx, id);
  const anchor = align ?? (ax !== undefined && ax > x ? 'end' : 'start');
  const hasLeader = ax !== undefined && ay !== undefined;
  const space = !!ctx.isSpace?.(id);
  // Leader starts at the text edge and bends horizontally first, like textbook call-outs.
  const lx = x + (anchor === 'end' ? 4 : anchor === 'start' ? -4 : 0);
  const elbowX = hasLeader ? lx + (ax! - lx) * 0.35 : lx;
  const name = text ?? ctx.nameOf(id);
  const size = state === 'spot' ? 16 : small ? 12 : 13.5;
  const k = fitScale(scale, x, y, anchor, name.length, size);
  return (
    <g
      data-label={id}
      className={`label label-${state}${small ? ' label-small' : ''}${space ? ' label-space' : ''}`}
      opacity={show}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onSelect(id);
      }}
      onPointerEnter={() => ctx.onHover(id)}
      onPointerLeave={() => ctx.onHover(null)}
    >
      {hasLeader && (
        <>
          <path className="label-leader" d={`M${lx},${y} L${elbowX},${y} L${ax},${ay}`} />
          <circle className="label-dot" cx={ax} cy={ay} r={space ? 3.4 : 2.6} />
        </>
      )}
      <text x={x} y={y} dy="0.35em" textAnchor={anchor} className="label-text" style={grown(size, k)}>
        {name}
      </text>
    </g>
  );
}

interface NoteProps {
  x: number;
  y: number;
  children: string;
  align?: 'start' | 'middle' | 'end';
  show?: number;
  tone?: 'dim' | 'accent' | 'warn';
  size?: number;
}

/** Free annotation that is not a structure (e.g. "Alde kraneala", "Ernalkuntza: anpulua"). */
export function Note({ x, y, children, align = 'middle', show = 1, tone = 'dim', size }: NoteProps) {
  const ctx = useScene();
  const scale = useLabelScale();
  if (show <= 0.02 || (!ctx.showLabels && tone !== 'warn')) return null;
  const base = size ?? 12.5;
  const k = fitScale(scale, x, y, align, children.length, base);
  return (
    <text
      x={x}
      y={y}
      dy="0.35em"
      textAnchor={align}
      className={`note note-${tone}`}
      opacity={show}
      style={grown(base, k) ?? (size ? { fontSize: size } : undefined)}
    >
      {children}
    </text>
  );
}
