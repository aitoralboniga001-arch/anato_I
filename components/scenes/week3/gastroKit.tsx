'use client';

import { clamp, easeInOut, useScene, zoom, type Pt } from '@/components/kit';
import { f1 } from './common';

/** Shared helpers of the gastrulation views: auto-zoom keyframes, label columns and the on-scene call-out chip. */

/** [t, focus x, focus y, scale]: the frame glides between keyframes so every step gets its own close-up. */
export type Key = [number, number, number, number];

export function frameAt(t: number, keys: Key[]) {
  let a = keys[0];
  let b = keys[keys.length - 1];
  if (t <= keys[0][0]) b = keys[0];
  else if (t >= keys[keys.length - 1][0]) a = keys[keys.length - 1];
  else
    for (let i = 1; i < keys.length; i++)
      if (t <= keys[i][0]) {
        a = keys[i - 1];
        b = keys[i];
        break;
      }
  const u = b[0] === a[0] ? 1 : easeInOut(clamp((t - a[0]) / (b[0] - a[0])));
  const l = (p: number, q: number) => p + (q - p) * u;
  const z = zoom(l(a[1], b[1]), l(a[2], b[2]), l(a[3], b[3]));
  return { ...z, s: l(a[3], b[3]), fx: l(a[1], b[1]), fy: l(a[2], b[2]) };
}

/** A point is worth a label when its (zoomed) anchor is well inside the frame. */
export const inFrame = (p: Pt, pad = 60) => (p[0] > 140 && p[0] < 860 && p[1] > pad && p[1] < 640 - pad ? 1 : 0);

/**
 * Label rows for one gutter column: each label wants to sit at its anchor's height, but rows are
 * pushed apart (`gap`) so text never overlaps, and kept between `lo` and `hi`.
 */
export function columnY(wanted: number[], lo: number, hi: number, gap = 30): number[] {
  const order = wanted.map((w, i) => ({ w, i })).sort((p, q) => p.w - q.w);
  const ys = new Array<number>(wanted.length);
  let prev = lo - gap;
  for (const o of order) {
    const y = Math.max(clamp(o.w, lo, hi), prev + gap);
    ys[o.i] = y;
    prev = y;
  }
  // If the stack overflowed the bottom, pull it back up.
  let next = hi + gap;
  for (const o of order.slice().reverse()) {
    ys[o.i] = Math.min(ys[o.i], next - gap);
    next = ys[o.i];
  }
  return ys;
}

/** Short on-scene call-out on a dark chip, optionally pointing at something. */
export function Callout({ x, y, text, show, color = '#e8eefc', to, align = 'middle' }: { x: number; y: number; text: string; show: number; color?: string; to?: Pt; align?: 'start' | 'middle' | 'end' }) {
  const ctx = useScene();
  if (show <= 0.02 || !ctx.showLabels || ctx.quiz) return null;
  const w = text.length * 6.9 + 18;
  const x0 = align === 'middle' ? x - w / 2 : align === 'end' ? x - w : x;
  return (
    <g opacity={show} pointerEvents="none">
      {to && <path d={`M${f1(x)},${f1(y)} L${f1(to[0])},${f1(to[1])}`} stroke={color} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.8} />}
      {to && <circle cx={to[0]} cy={to[1]} r={3} fill={color} />}
      <rect x={f1(x0)} y={y - 12} width={f1(w)} height={24} rx={12} fill="rgba(12,12,16,0.88)" stroke={color} strokeOpacity={0.55} />
      <text x={f1(x0 + w / 2)} y={y} dy="0.35em" textAnchor="middle" fontSize={12.5} fontWeight={600} fill={color}>
        {text}
      </text>
    </g>
  );
}
