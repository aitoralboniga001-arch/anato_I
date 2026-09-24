'use client';

import { partState, useScene } from './context';

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
  if (!ctx.showLabels || ctx.quiz || show <= 0.02) return null;
  const state = partState(ctx, id);
  const anchor = align ?? (ax !== undefined && ax > x ? 'end' : 'start');
  const hasLeader = ax !== undefined && ay !== undefined;
  // Leader starts at the text edge and bends horizontally first, like textbook call-outs.
  const lx = x + (anchor === 'end' ? 4 : anchor === 'start' ? -4 : 0);
  const elbowX = hasLeader ? lx + (ax! - lx) * 0.35 : lx;
  return (
    <g
      data-label={id}
      className={`label label-${state}${small ? ' label-small' : ''}`}
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
          <circle className="label-dot" cx={ax} cy={ay} r={2.6} />
        </>
      )}
      <text x={x} y={y} dy="0.35em" textAnchor={anchor} className="label-text">
        {text ?? ctx.nameOf(id)}
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
  if (show <= 0.02 || (!ctx.showLabels && tone !== 'warn')) return null;
  return (
    <text
      x={x}
      y={y}
      dy="0.35em"
      textAnchor={align}
      className={`note note-${tone}`}
      opacity={show}
      style={size ? { fontSize: size } : undefined}
    >
      {children}
    </text>
  );
}
