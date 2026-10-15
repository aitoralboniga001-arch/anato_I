'use client';

import { useContext, useId, useLayoutEffect, useSyncExternalStore, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { OnTop } from './OnTop';
import { LabelCollectorContext, PaneContext, partState, useLabelScale, useScene, type LabelScale } from './context';

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
  /**
   * A name for a layered whole (a structure with `spans` in the registry, e.g. the bilaminar disc): the
   * leader ends in a thin bracket across the whole thickness, from the first layer to the last, instead
   * of a dot inside one of them. Give the two ends inside the outer layers; the leader meets the middle
   * (ax, ay default to it).
   */
  span?: [[number, number], [number, number]];
  /** Hand-placed: the view's label layer never moves this name to another slot (see arrangeLabels). */
  noArrange?: boolean;
  /** Set by the label layer when it moved the name (dev sheets tint it). */
  moved?: boolean;
}

/** Textbook-style label with a leader line. Render labels after the geometry so they sit on top. */
export function Label(given: LabelProps) {
  const { span } = given;
  // A bracket's leader meets its middle unless the scene says otherwise.
  const props = span && given.ax === undefined ? { ...given, ax: (span[0][0] + span[1][0]) / 2, ay: (span[0][1] + span[1][1]) / 2 } : given;
  const col = useContext(LabelCollectorContext);
  const inPane = useContext(PaneContext);
  const key = useId();
  // Mounted inside a SceneView: the view's label layer draws this name (see LabelCollector).
  useLayoutEffect(() => {
    if (!col || inPane) return;
    col.restore(key);
    col.notify();
    return () => {
      col.drop(key);
      col.notify();
    };
  }, [col, inPane, key]);
  // Re-rendered on its own (its layer did not draw this version): ask the layer to redraw before the paint.
  useLayoutEffect(() => {
    if (col && !inPane && col.stale()) col.notify();
  });
  if (!col || inPane) return <LabelDraw {...props} />;
  col.put(key, props);
  return null;
}

/** A name's drawn font size before any growth: the step's own names are bigger than the rest. */
export const labelSize = (state: ReturnType<typeof partState>, small?: boolean) =>
  state === 'spot' ? 16 : state === 'focus' ? (small ? 13.5 : 15) : small ? 12 : 13.5;

type Pt = [number, number];

/** Where a name is drawn: its font size, plate, text box and leader (the label layer lays names out with it). */
export interface LabelGeom {
  anchor: 'start' | 'middle' | 'end';
  /** Growth over the drawn size (see fitScale). */
  k: number;
  fs: number;
  plate: ReturnType<typeof plateBox>;
  /** The text's box as the layout rules judge it (tests/labels.test): x0, x1, y0, y1. */
  box: [number, number, number, number];
  /** Plate edge → elbow → the dot (empty without a leader). */
  leader: Pt[];
}

export function labelGeom(
  { x, y, ax, ay, align, small }: Pick<LabelProps, 'x' | 'y' | 'ax' | 'ay' | 'align' | 'small'>,
  chars: number,
  size: number,
  scale: LabelScale,
  measure?: (fs: number) => number,
): LabelGeom {
  const anchor = align ?? (ax !== undefined && ax > x ? 'end' : 'start');
  const k = fitScale(scale, x, y, anchor, chars, size);
  const fs = size * k;
  const plate = plateBox(x, y, anchor, measure ? measure(fs) : chars * CHAR_W * fs, fs);
  // The rules' estimate: 7.1 units a character at 13.5px (6.4 at the small 12px), 15 units a line.
  const drawn = small ? 12 : 13.5;
  const w = (chars * (small ? 6.4 : 7.1) * fs) / drawn;
  const h = (15 * fs) / drawn;
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  const box: LabelGeom['box'] = [x0, x0 + w, y - h / 2, y + h / 2];
  if (ax === undefined || ay === undefined) return { anchor, k, fs, plate, box, leader: [] };
  // Leader starts at the plate edge and bends horizontally first, like textbook call-outs.
  // It leaves from the plate edge nearest the anchor, so its bend never lands inside a column of names.
  const lx = ax < plate.x ? plate.x : ax > plate.x + plate.w ? plate.x + plate.w : x + (anchor === 'end' ? plate.padX : anchor === 'start' ? -plate.padX : 0);
  const elbowX = lx + (ax - lx) * 0.35;
  return { anchor, k, fs, plate, box, leader: [[lx, y], [elbowX, y], [ax, ay]] };
}

/** A bracket from one end of a span to the other, with 4-unit end bars pointing away from `from`. */
function bracket([[x1, y1], [x2, y2]]: [[number, number], [number, number]], from: Pt) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  let nx = -(y2 - y1) / len;
  let ny = (x2 - x1) / len;
  // The bars point away from the leader's elbow (into the structure, not back at the name).
  if (nx * ((x1 + x2) / 2 - from[0]) + ny * ((y1 + y2) / 2 - from[1]) < 0) [nx, ny] = [-nx, -ny];
  const r = (v: number) => Math.round(v * 10) / 10;
  return `M${r(x1 + nx * 4)},${r(y1 + ny * 4)}L${r(x1)},${r(y1)}L${r(x2)},${r(y2)}L${r(x2 + nx * 4)},${r(y2 + ny * 4)}`;
}

/** Draws one label where its props say (the label layer calls it with the laid-out position). */
export function LabelDraw({ id, x, y, ax, ay, align, show = 1, text, small, span, moved }: LabelProps) {
  const ctx = useScene();
  const scale = useLabelScale();
  const measured = useMeasured();
  // A name left inside a dual view's pane would shrink with it: the dual lifts and sets the pane's names.
  const inPane = useContext(PaneContext);
  if (!ctx.showLabels || ctx.quiz || show <= 0.02 || inPane) return null;
  const state = partState(ctx, id);
  // Not named yet (progressive names): the slot is kept, so names already shown never move when it comes.
  if (ctx.named && state !== 'focus' && state !== 'spot' && state !== 'active' && !ctx.named(id)) return null;
  const space = !!ctx.isSpace?.(id);
  const name = text ?? ctx.nameOf(id);
  const size = labelSize(state, small);
  const weight = state === 'spot' || state === 'focus' ? 700 : 550;
  const { anchor, k, fs, plate, leader: pts } = labelGeom({ x, y, ax, ay, align, small }, name.length, size, scale, (f) => textWidth(name, f, weight, space, measured));
  const hasLeader = pts.length > 0;
  const leader = hasLeader ? `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]} L${ax},${ay}` : '';
  const group = {
    'data-label': id,
    className: `label label-${state}${small ? ' label-small' : ''}${space ? ' label-space' : ''}`,
    opacity: show,
    'data-moved': moved ? '' : undefined,
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
          {span ? (
            // Across the whole: a thin bracket, its short end bars turned away from the name.
            <g className="label-span">
              <path className="label-casing" d={bracket(span, pts[1])} />
              <path className="label-leader" d={bracket(span, pts[1])} />
            </g>
          ) : (
            <circle className="label-dot" cx={ax} cy={ay} r={space ? 3.8 : 3.1} />
          )}
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
