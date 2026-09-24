'use client';

import { rand } from '@/lib/sim/anim';
import { type Curve, type Pt } from '@/lib/sim/geometry';
import { C } from '@/lib/sim/palette';

interface CellBandProps {
  curve: Curve;
  /** Number of cells along the curve. */
  n: number;
  /** Cell height measured along the curve normal. */
  thickness: number;
  color: string;
  nucleus?: string;
  /** columnar: tall nuclei near the base; cuboidal: round central nuclei; squamous: flat nuclei. */
  shape?: 'columnar' | 'cuboidal' | 'squamous';
  /** Grow the band towards -normal instead of +normal. */
  inward?: boolean;
  from?: number;
  to?: number;
  /** 0..1: how many of the n cells are drawn (grows from `from`). */
  grow?: number;
  stroke?: string;
  opacity?: number;
}

/**
 * An epithelium drawn as a row of cells that tile along any curve.
 * Use it for epiblast (columnar), hypoblast (cuboidal), amnioblasts / Heuser membrane (squamous),
 * cytotrophoblast (cuboidal), endometrial epithelium, etc.
 */
export function CellBand({
  curve,
  n,
  thickness,
  color,
  nucleus = 'rgba(20,24,40,0.55)',
  shape = 'cuboidal',
  inward,
  from = 0,
  to = 1,
  grow = 1,
  stroke = 'rgba(10,14,28,0.45)',
  opacity = 1,
}: CellBandProps) {
  const sgn = inward ? -1 : 1;
  const count = Math.max(0, Math.round(n * grow));
  const cells = [];
  for (let i = 0; i < count; i++) {
    const u0 = from + ((to - from) * i) / n;
    const u1 = from + ((to - from) * (i + 1)) / n;
    const a = curve(u0);
    const b = curve(u1);
    const m = curve((u0 + u1) / 2);
    const th = thickness;
    const p = (s: typeof a, k: number): Pt => [s.x + s.nx * th * k * sgn, s.y + s.ny * th * k * sgn];
    const a1 = p(a, 1);
    const b1 = p(b, 1);
    const m1 = p(m, 1);
    const f = (v: number) => v.toFixed(1);
    const d = `M${f(a.x)},${f(a.y)} Q${f(m.x)},${f(m.y)} ${f(b.x)},${f(b.y)} L${f(b1[0])},${f(b1[1])} Q${f(m1[0])},${f(m1[1])} ${f(a1[0])},${f(a1[1])}Z`;
    const w = Math.hypot(b.x - a.x, b.y - a.y);
    const nk = shape === 'columnar' ? 0.38 : 0.5;
    const nc = p(m, nk);
    const rAlong = shape === 'squamous' ? Math.min(w * 0.32, 5) : Math.min(w * 0.26, th * 0.3);
    const rAcross = shape === 'columnar' ? Math.min(th * 0.2, 5) : shape === 'squamous' ? Math.min(th * 0.28, 2) : Math.min(th * 0.22, w * 0.24);
    cells.push(
      <g key={i}>
        <path d={d} fill={color} stroke={stroke} strokeWidth={0.8} />
        <ellipse cx={f(nc[0])} cy={f(nc[1])} rx={f(rAlong)} ry={f(rAcross)} fill={nucleus} transform={`rotate(${f(m.angle)} ${f(nc[0])} ${f(nc[1])})`} />
      </g>,
    );
  }
  return <g opacity={opacity}>{cells}</g>;
}

interface CellProps {
  x: number;
  y: number;
  r: number;
  color: string;
  nucleus?: string | false;
  nucleusScale?: number;
  stroke?: string;
  opacity?: number;
  rx?: number;
  ry?: number;
  rotate?: number;
}

/** A single rounded cell with shading and nucleus. */
export function Cell({ x, y, r, color, nucleus = 'rgba(30,20,50,0.55)', nucleusScale = 0.38, stroke = 'rgba(10,14,28,0.5)', opacity = 1, rx, ry, rotate = 0 }: CellProps) {
  const ex = rx ?? r;
  const ey = ry ?? r;
  return (
    <g opacity={opacity} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      <ellipse cx={x} cy={y} rx={ex} ry={ey} fill={color} stroke={stroke} strokeWidth={0.9} />
      <ellipse cx={x} cy={y} rx={ex} ry={ey} fill="url(#g-cell)" />
      {nucleus && <circle cx={x + ex * 0.05} cy={y + ey * 0.05} r={Math.min(ex, ey) * nucleusScale} fill={nucleus} />}
    </g>
  );
}

/** Scatter deterministic points inside an ellipse (for loose cells, nuclei, particles). */
export function scatterInEllipse(cx: number, cy: number, rx: number, ry: number, n: number, seed = 1): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rand(seed + i * 3.1) * Math.PI * 2;
    const r = Math.sqrt(rand(seed + i * 7.7));
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return pts;
}

interface ArrowProps {
  from: Pt;
  to: Pt;
  /** Perpendicular bow of the arrow as a fraction of its length (+ bends left). */
  bend?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  /** Animate a marching dash along the arrow (process direction). */
  flow?: boolean;
  show?: number;
  /** 0..1: draw only the first part of the arrow (grow-in). */
  progress?: number;
  head?: number;
}

/** Curved arrow with a computed arrowhead (no <marker>, so colour works everywhere). */
export function Arrow({ from, to, bend = 0.15, color = '#fbbf24', width = 2.4, dashed, flow, show = 1, progress = 1, head = 9 }: ArrowProps) {
  if (show <= 0.02 || progress <= 0.01) return null;
  const [x0, y0] = from;
  const dx = to[0] - x0;
  const dy = to[1] - y0;
  const cx = x0 + dx / 2 - dy * bend;
  const cy = y0 + dy / 2 + dx * bend;
  const q = (u: number): Pt => [
    (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * to[0],
    (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * to[1],
  ];
  const end = q(progress);
  const pre = q(Math.max(0, progress - 0.04));
  const ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
  // Sub-curve of a quadratic from 0..progress via de Casteljau.
  const cpx = x0 + (cx - x0) * progress;
  const cpy = y0 + (cy - y0) * progress;
  const d = `M${x0},${y0} Q${cpx},${cpy} ${end[0]},${end[1]}`;
  const hx = (a: number) => end[0] - head * Math.cos(ang + a);
  const hy = (a: number) => end[1] - head * Math.sin(ang + a);
  return (
    <g opacity={show} className="arrow" pointerEvents="none">
      <path d={d} fill="none" stroke="rgba(5,8,18,0.55)" strokeWidth={width + 2.4} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed || flow ? '7 6' : undefined}
        className={flow ? 'dash-flow' : undefined}
      />
      <path d={`M${end[0]},${end[1]} L${hx(0.45)},${hy(0.45)} L${hx(-0.45)},${hy(-0.45)}Z`} fill={color} stroke="rgba(5,8,18,0.55)" strokeWidth={1} />
    </g>
  );
}

interface FlowProps {
  /** SVG path the particles follow. */
  d: string;
  n?: number;
  dur?: number;
  r?: number;
  color?: string;
  reduced?: boolean;
}

/** Ambient particles moving along a path (blood flow, sperm transport). Pure decoration. */
export function Flow({ d, n = 6, dur = 4, r = 2.6, color = C.maternalBlood, reduced }: FlowProps) {
  if (reduced) return null;
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, i) => (
        <ellipse key={i} rx={r * 1.25} ry={r} fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth={0.6}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} begin={`${(-dur * i) / n}s`} rotate="auto" />
        </ellipse>
      ))}
    </g>
  );
}
