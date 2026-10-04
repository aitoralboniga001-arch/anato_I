'use client';

import { clamp, lerp, type Pt } from '@/components/kit';

/**
 * Shared drawing helpers for the neural crest scenes (section and derivatives map): a migration
 * route drawn the way the kit's Journey draws a cell's path (a cased line in the fate colour), but
 * persistent and ending in an arrowhead, so "from here → to there" stays readable after the cells
 * have arrived. Routes are polylines; `spline` turns a few control points into one.
 */

const CASE = 'rgba(6,8,14,0.66)';
const f1 = (v: number) => v.toFixed(1);

/** Centripetal-ish Catmull-Rom through the control points, sampled into a polyline. */
export function spline(ctrl: Pt[], per = 10): Pt[] {
  if (ctrl.length < 3) return ctrl;
  const out: Pt[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const u = k / per;
      const u2 = u * u;
      const u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

const lengths = (pts: Pt[]) => pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));

/** Point at fraction v (by length) along a polyline, with its heading in degrees. */
export function along(pts: Pt[], v: number): { p: Pt; ang: number } {
  const lens = lengths(pts);
  let want = clamp(v) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (want <= lens[i] || i === lens.length - 1) {
      const k = lens[i] > 0 ? clamp(want / lens[i]) : 0;
      const a = pts[i];
      const b = pts[i + 1];
      return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
    }
    want -= lens[i];
  }
  return { p: pts[pts.length - 1], ang: 0 };
}

/** The first `v` (by length) of a polyline. */
export function upTo(pts: Pt[], v: number): Pt[] {
  const lens = lengths(pts);
  let want = clamp(v) * lens.reduce((a, b) => a + b, 0);
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < lens.length; i++) {
    if (want <= lens[i]) {
      const k = lens[i] > 0 ? want / lens[i] : 0;
      out.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]);
      return out;
    }
    want -= lens[i];
    out.push(pts[i + 1]);
  }
  return out;
}

const poly = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;

interface RouteProps {
  pts: Pt[];
  color: string;
  /** How much of the route is drawn (it grows with the lead cell). */
  progress?: number;
  width?: number;
  show?: number;
  /** Scene units per screen unit (1 / magnification inside a scaled group). */
  u?: number;
  /** Arrowhead length in screen units. */
  head?: number;
}

/** A migration route: cased line in the fate colour with an arrowhead at its leading end. */
export function Route({ pts, color, progress = 1, width = 2.4, show = 1, u = 1, head = 9 }: RouteProps) {
  if (show <= 0.02 || progress <= 0.01 || pts.length < 2) return null;
  const drawn = upTo(pts, progress);
  const W = width * u;
  const H = head * u;
  // Stop the shaft a little short of the tip so the line never pokes through the arrowhead.
  const tip = drawn[drawn.length - 1];
  const total = lengths(drawn).reduce((a, b) => a + b, 0);
  const back = along(drawn, total > 0 ? Math.max(0, 1 - (H * 0.9) / total) : 0).p;
  const ang = Math.atan2(tip[1] - back[1], tip[0] - back[0]);
  const shaft = upTo(drawn, total > 0 ? Math.max(0, 1 - (H * 0.6) / total) : 0);
  const hx = (a: number) => tip[0] - H * Math.cos(ang + a);
  const hy = (a: number) => tip[1] - H * Math.sin(ang + a);
  const tri = `M${f1(tip[0])},${f1(tip[1])}L${f1(hx(0.45))},${f1(hy(0.45))}L${f1(hx(-0.45))},${f1(hy(-0.45))}Z`;
  return (
    <g opacity={show} pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={poly(shaft)} stroke={CASE} strokeWidth={W + 2.8 * u} />
      <path d={tri} fill={CASE} stroke={CASE} strokeWidth={2.8 * u} />
      <path d={poly(shaft)} stroke={color} strokeWidth={W} />
      <path d={tri} fill={color} />
    </g>
  );
}

/**
 * A migrating neural crest cell: teal, elongated along its heading, with a leading lamellipodium
 * and two or three filopodia — the shape of a free mesenchymal cell, not of an epithelial one.
 * `mes` 0..1 morphs it from the tall, packed epithelial shape (no processes) to the migratory one.
 */
export function CrestCell({ x, y, ang = 0, mes = 1, s = 1, color = '#2dd4bf', edge = '#0f766e', nucleus = '#0f4f49', opacity = 1 }: { x: number; y: number; ang?: number; mes?: number; s?: number; color?: string; edge?: string; nucleus?: string; opacity?: number }) {
  const rx = lerp(2.4, 5.4, mes) * s;
  const ry = lerp(6.2, 3.1, mes) * s;
  const proc = clamp((mes - 0.45) / 0.55);
  return (
    <g opacity={opacity} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})`}>
      {proc > 0.02 && (
        <g stroke={color} strokeWidth={0.9 * s} strokeLinecap="round" fill="none" opacity={0.9 * proc}>
          <path d={`M${f1(rx * 0.6)},${f1(-ry * 0.5)} q${f1(4 * s * proc)},${f1(-2.6 * s * proc)} ${f1(7.5 * s * proc)},${f1(-3.8 * s * proc)}`} />
          <path d={`M${f1(rx * 0.9)},0 l${f1(7.5 * s * proc)},${f1(0.6 * s * proc)}`} />
          <path d={`M${f1(rx * 0.6)},${f1(ry * 0.5)} q${f1(4 * s * proc)},${f1(2.4 * s * proc)} ${f1(7 * s * proc)},${f1(3.6 * s * proc)}`} />
          <path d={`M${f1(-rx * 0.9)},0 l${f1(-3.2 * s * proc)},${f1(0.4 * s)}`} />
        </g>
      )}
      <ellipse rx={f1(rx)} ry={f1(ry)} fill={color} stroke={edge} strokeWidth={0.9 * s} />
      <circle cx={f1(rx * 0.12)} r={f1(Math.min(rx, ry) * 0.55)} fill={nucleus} />
    </g>
  );
}
