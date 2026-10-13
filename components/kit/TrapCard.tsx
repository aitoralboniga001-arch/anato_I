'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import { partState, useScene } from './context';

export interface TrapRow {
  /** The structure the row names (hover, click and the step's focus light it like a label). */
  id: string;
  name: string;
  /** What it does, in a few words (the lines under the name). */
  detail: string | string[];
  /** The colour it is drawn in on the figure (a vessel's lumen, a tissue). */
  swatch: string;
}

/** Type and spacing: the full card, and the narrow one for a side strip beside a round figure. */
const SIZES = {
  wide: { name: 14.5, detail: 13, line: 17, swatch: 34, text: 46 },
  narrow: { name: 13.5, detail: 12, line: 15, swatch: 20, text: 28 },
};
type Size = (typeof SIZES)['wide'];

const linesOf = (d: string | string[]) => (Array.isArray(d) ? d : [d]);
const rowHeight = (r: TrapRow, z: Size) => 20 + linesOf(r.detail).length * z.line + 6;

/**
 * KONTUZ in the picture itself: the trap a step invites (an idea that runs against intuition), said
 * where the student is looking, beside the drawing that shows it. A key of the figure's own colours,
 * each row naming its structure, and the rule that makes it make sense underneath.
 */
export function TrapCard({
  x,
  y,
  w,
  title,
  rows,
  rule,
  show = 1,
  plain,
  narrow,
}: {
  x: number;
  y: number;
  w: number;
  /** One line, or two for a narrow card. */
  title: string | string[];
  rows: TrapRow[];
  rule: string[];
  show?: number;
  /** The familiar case beside a trap (e.g. the adult pattern): same key, quiet frame, no warning. */
  plain?: boolean;
  /** Smaller type for a side strip. */
  narrow?: boolean;
}) {
  const ctx = useScene();
  if (show <= 0.02 || !ctx.showLabels || ctx.quiz) return null;
  const z = SIZES[narrow ? 'narrow' : 'wide'];
  const heads = linesOf(title);
  const tops = rows.reduce<number[]>((acc, r) => [...acc, acc[acc.length - 1] + rowHeight(r, z)], [y + 18 + heads.length * 14]);
  const ruleY = tops[rows.length] + 4;
  const h = ruleY - y + rule.length * z.line + 4;
  return (
    <g opacity={show}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={12}
        fill={plain ? 'rgba(14,16,22,0.9)' : 'rgba(24,16,10,0.93)'}
        stroke={plain ? 'rgba(232,238,252,0.28)' : '#ffb86b'}
        strokeWidth={plain ? 1 : 1.4}
        pointerEvents="none"
      />
      {heads.map((s, i) => (
        <text key={i} x={x + 14} y={y + 21 + i * 14} fontSize={11} fontWeight={800} letterSpacing="0.13em" fill={plain ? '#c9d2e3' : '#ffb86b'} pointerEvents="none">
          {!plain && i === 0 ? `⚠ ${s}` : s}
        </text>
      ))}
      {rows.map((r, i) => (
        <Row key={r.id} row={r} x={x + 14} y={tops[i]} w={w - 28} z={z} />
      ))}
      {rule.map((s, i) => (
        <text key={i} x={x + 14} y={ruleY + i * z.line} dy="0.35em" fontSize={z.detail - 0.5} fontStyle="italic" fill={plain ? '#d6dbe6' : '#f3e3cc'} pointerEvents="none">
          {s}
        </text>
      ))}
    </g>
  );
}

function Row({ row, x, y, w, z }: { row: TrapRow; x: number; y: number; w: number; z: Size }) {
  const ctx = useScene();
  const state = partState(ctx, row.id);
  const lit = state === 'focus' || state === 'spot' || state === 'active';
  const mid = y + 10;
  return (
    <g
      data-label={row.id}
      className="label"
      opacity={state === 'dim' ? 0.5 : 1}
      onClick={(e: ReactMouseEvent) => {
        e.stopPropagation();
        ctx.onSelect(row.id);
      }}
      onPointerEnter={() => ctx.onHover(row.id)}
      onPointerLeave={() => ctx.onHover(null)}
    >
      <rect x={x - 6} y={y - 2} width={w + 12} height={rowHeight(row, z) - 2} fill="transparent" />
      {/* The vessel as drawn: a pale wall round its coloured lumen. */}
      <path d={`M${x + 3},${mid} H${x + z.swatch - 3}`} stroke="#f2d9d2" strokeWidth={9} strokeLinecap="round" />
      <path d={`M${x + 3},${mid} H${x + z.swatch - 3}`} stroke={row.swatch} strokeWidth={5.5} strokeLinecap="round" />
      <text x={x + z.text} y={mid} dy="0.35em" fontSize={z.name} fontWeight={lit ? 800 : 700} fill={lit ? 'var(--focus)' : '#ffffff'}>
        {row.name}
      </text>
      {linesOf(row.detail).map((s, i) => (
        <text key={i} x={x + z.text} y={mid + 18 + i * z.line} dy="0.35em" fontSize={z.detail} fill="#efe6d8">
          {s}
        </text>
      ))}
    </g>
  );
}
