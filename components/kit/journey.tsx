'use client';

import { type Pt } from '@/lib/sim/geometry';

/**
 * The visual language of a cell migration, shared by every scene that follows cells: where a cell
 * started (the start dot of Journey), the whole way it has come (the faint route of Journey), where it is heading now
 * (Journey's bright tapered head), which cell it is (FollowRing: the cell outlined in white) and
 * what it will become (Destination: a faint ghost of the future structure).
 * Fate colours are the caller's (Langman code); this only decides how a path reads.
 */

const f1 = (v: number) => v.toFixed(1);
const CASE = 'rgba(6,8,14,0.62)';
const poly = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}`;

/** Drop samples closer than `min` to the previous one: no zero-length segments, lighter paths. */
function thin(pts: Pt[], min = 1.2) {
  const out: Pt[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= min) out.push(p);
  }
  return out;
}

interface JourneyProps {
  /** Positions oldest → newest; the last one is where the cell is now. */
  pts: Pt[];
  color: string;
  /** How many of the newest samples form the bright, tapered head. */
  head?: number;
  width?: number;
  show?: number;
  /** Faint route behind the head (0 hides it). */
  route?: number;
  /** Ghost ring at the starting point once the cell has left it. */
  origin?: boolean;
  /** Radius of the origin ghost (the cell's size). */
  r?: number;
  /** Scene units per screen unit: 1 / magnification when drawn inside a zoom() group, so strokes keep their weight. */
  u?: number;
}

/**
 * A migrating cell's path: the full route so far as a thin cased line in the fate colour, the last
 * stretch as a bright tapered stroke that fades toward the tail (direction is read from the taper),
 * and a dashed ghost where the cell set out from.
 */
export function Journey({ pts, color, head = 12, width = 2.8, show = 1, route = 0.55, origin = true, r = 8, u = 1 }: JourneyProps) {
  if (show <= 0.02 || pts.length < 2) return null;
  // The head is the last `head` samples in time (a cell at rest has no head), the route everything before it.
  const cut = Math.max(0, pts.length - 1 - head);
  const headPts = thin(pts.slice(cut), 1.2 * u);
  const routePts = thin(pts.slice(0, cut + 1), 1.2 * u);
  const W = width * u;
  const start = pts[0];
  const now = pts[pts.length - 1];
  const left = Math.hypot(now[0] - start[0], now[1] - start[1]) > r * 1.8;
  const h = headPts.length - 1;
  const parts = Array.from({ length: h }, (_, i) => {
    const k = (i + 1) / h;
    const a = headPts[i];
    const b = headPts[i + 1];
    return { d: `M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`, w: W * (0.3 + 0.7 * k), o: 0.15 + 0.85 * k };
  });
  return (
    <g opacity={show} pointerEvents="none" fill="none" strokeLinecap="round">
      {route > 0 && routePts.length > 1 && (
        <g opacity={route}>
          <path d={poly(routePts)} stroke={CASE} strokeWidth={W * 0.45 + 2.4 * u} strokeLinejoin="round" />
          <path d={poly(routePts)} stroke={color} strokeWidth={W * 0.45} strokeLinejoin="round" />
        </g>
      )}
      {/* All casings first, then the colour: joints stay seamless. */}
      {parts.map((p, i) => <path key={`k${i}`} d={p.d} stroke={CASE} strokeWidth={p.w + 2.6 * u} opacity={p.o} />)}
      {parts.map((p, i) => <path key={`c${i}`} d={p.d} stroke={color} strokeWidth={p.w} opacity={p.o} />)}
      {/* Start of the route: a small dot, like the start of a route on a map. */}
      {origin && left && (
        <g opacity={0.95}>
          <circle cx={f1(start[0])} cy={f1(start[1])} r={3.4 * u} fill={color} stroke={CASE} strokeWidth={1.8 * u} />
        </g>
      )}
    </g>
  );
}

/**
 * "This is the cell we follow": the cell itself outlined in white (cased so it holds on any tissue).
 * Pass `d` for a non-round cell; otherwise a circle of radius `r` hugs it.
 */
export function FollowRing({ x = 0, y = 0, r = 8, d, show = 1, u = 1 }: { x?: number; y?: number; r?: number; d?: string; show?: number; u?: number }) {
  if (show <= 0.02) return null;
  const shape = (extra: object) => (d ? <path d={d} {...extra} /> : <circle cx={f1(x)} cy={f1(y)} r={r} {...extra} />);
  return (
    <g opacity={show} pointerEvents="none" fill="none" strokeLinejoin="round">
      {shape({ stroke: CASE, strokeWidth: 4.6 * u })}
      {shape({ stroke: '#fff', strokeWidth: 2.1 * u })}
    </g>
  );
}

/**
 * What the moving cells will form, before it exists: a faint ghost of the future structure in their
 * colour (no outline), so "where they go and what they become" is visible on the way.
 */
export function Destination({ x, y, w, h, color, show = 1, rx = 8, oval }: { x: number; y: number; w: number; h: number; color: string; show?: number; rx?: number; oval?: boolean }) {
  if (show <= 0.02) return null;
  return (
    <g opacity={show} pointerEvents="none" fill={color} fillOpacity={0.2}>
      {oval ? <ellipse cx={f1(x + w / 2)} cy={f1(y + h / 2)} rx={f1(w / 2)} ry={f1(h / 2)} /> : <rect x={f1(x)} y={f1(y)} width={f1(w)} height={f1(h)} rx={rx} />}
    </g>
  );
}
