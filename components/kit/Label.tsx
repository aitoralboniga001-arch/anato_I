'use client';

import { useSyncExternalStore, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { OnTop } from './OnTop';
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

/** Text widths at 1px font size, measured once per name and weight (the server and hydration use the estimate). */
const widths = new Map<string, number>();
let measureCtx: CanvasRenderingContext2D | null | undefined;
let labelFont = '';

function textWidth(text: string, size: number, weight: number, italic: boolean, measured: boolean) {
  const estimate = text.length * CHAR_W * size;
  if (!measured) return estimate;
  const key = `${weight}${italic ? 'i' : ''}|${text}`;
  const hit = widths.get(key);
  if (hit !== undefined) return hit * size;
  if (measureCtx === undefined) {
    measureCtx = document.createElement('canvas').getContext('2d');
    labelFont = getComputedStyle(document.body).fontFamily;
  }
  if (!measureCtx) return estimate;
  measureCtx.font = `${italic ? 'italic ' : ''}${weight} 100px ${labelFont}`;
  const w = measureCtx.measureText(text).width / 100;
  // Until the web font arrives the fallback face is measured: use it, but measure again later.
  if (document.fonts?.status === 'loaded') widths.set(key, w);
  return w * size;
}

const noSubscribe = () => () => {};
/** False on the server and while hydrating, true after: plates are sized by measurement only on the client. */
const useMeasured = () => useSyncExternalStore(noSubscribe, () => true, () => false);

/**
 * Backdrop plate behind a label's text: the name stays legible over any tissue colour (pale stroma,
 * red mesoderm, dark cavities) without changing where the label sits.
 */
function plateBox(x: number, y: number, anchor: 'start' | 'middle' | 'end', w: number, fs: number) {
  const padX = fs * 0.42;
  const h = fs * 1.42;
  const x0 = anchor === 'start' ? x - padX : anchor === 'end' ? x - w - padX : x - w / 2 - padX;
  return { x: x0, y: y - h / 2, w: w + padX * 2, h, padX };
}

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
  const measured = useMeasured();
  if (!ctx.showLabels || ctx.quiz || show <= 0.02) return null;
  const state = partState(ctx, id);
  const anchor = align ?? (ax !== undefined && ax > x ? 'end' : 'start');
  const hasLeader = ax !== undefined && ay !== undefined;
  const space = !!ctx.isSpace?.(id);
  const name = text ?? ctx.nameOf(id);
  const size = state === 'spot' ? 16 : small ? 12 : 13.5;
  const k = fitScale(scale, x, y, anchor, name.length, size);
  const fs = size * k;
  const plate = plateBox(x, y, anchor, textWidth(name, fs, state === 'spot' ? 700 : 550, space, measured), fs);
  // Leader starts at the plate edge and bends horizontally first, like textbook call-outs.
  const lx = x + (anchor === 'end' ? plate.padX : anchor === 'start' ? -plate.padX : 0);
  const elbowX = hasLeader ? lx + (ax! - lx) * 0.35 : lx;
  const leader = hasLeader ? `M${lx},${y} L${elbowX},${y} L${ax},${ay}` : '';
  const group = {
    'data-label': id,
    className: `label label-${state}${small ? ' label-small' : ''}${space ? ' label-space' : ''}`,
    opacity: show,
    onClick: (e: ReactMouseEvent) => {
      e.stopPropagation();
      ctx.onSelect(id);
    },
    onPointerEnter: () => ctx.onHover(id),
    onPointerLeave: () => ctx.onHover(null),
  };
  // The leader stays with the scene; the name goes to the top text layer, so no line (this or any
  // other leader, arrow or marker) is ever drawn over a word.
  return (
    <>
      {hasLeader && (
        <g {...group}>
          {/* A dark casing under the light leader keeps it visible on pale and dark tissue alike. */}
          <path className="label-casing" d={leader} />
          <path className="label-leader" d={leader} />
          <circle className="label-dot" cx={ax} cy={ay} r={space ? 3.8 : 3.1} />
        </g>
      )}
      <OnTop>
        <g {...group}>
          <rect className="label-plate" x={plate.x} y={plate.y} width={plate.w} height={plate.h} rx={plate.h * 0.3} />
          <text x={x} y={y} dy="0.35em" textAnchor={anchor} className="label-text" style={k > 1 ? { fontSize: `${fs.toFixed(2)}px` } : undefined}>
            {name}
          </text>
        </g>
      </OnTop>
    </>
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
  // Sentences grow less than names (at most 30%): they are long and sit beside names.
  const k = fitScale({ ...scale, k: Math.min(scale.k, 1.3) }, x, y, align, children.length, base);
  return (
    <OnTop>
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
    </OnTop>
  );
}
