/** Geometry helpers for drawing tissues as parametric curves (no DOM measurement needed). */

export type Pt = [number, number];

/** A sample on a curve: position plus the unit normal pointing to the curve's "outside". */
export interface Sample {
  x: number;
  y: number;
  /** Tangent angle in degrees. */
  angle: number;
  nx: number;
  ny: number;
}

/** A curve maps u in [0,1] to a sample. */
export type Curve = (u: number) => Sample;

const deg = (r: number) => (r * 180) / Math.PI;

/** Ellipse arc from angle a0 to a1 (degrees, 0 = +x, 90 = +y/down). Normal points outward. */
export const ellipseArc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Curve => (u) => {
  const a = ((a0 + (a1 - a0) * u) * Math.PI) / 180;
  const x = cx + rx * Math.cos(a);
  const y = cy + ry * Math.sin(a);
  const tx = -rx * Math.sin(a) * Math.sign(a1 - a0 || 1);
  const ty = ry * Math.cos(a) * Math.sign(a1 - a0 || 1);
  let nx = Math.cos(a) / rx;
  let ny = Math.sin(a) / ry;
  const l = Math.hypot(nx, ny) || 1;
  nx /= l;
  ny /= l;
  return { x, y, angle: deg(Math.atan2(ty, tx)), nx, ny };
};

/** Straight segment. Normal is the left-hand normal (rotate tangent -90°), i.e. "up" for a left→right line. */
export const line = (p: Pt, q: Pt): Curve => (u) => {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const l = Math.hypot(dx, dy) || 1;
  return { x: p[0] + dx * u, y: p[1] + dy * u, angle: deg(Math.atan2(dy, dx)), nx: dy / l, ny: -dx / l };
};

/** Cubic Bézier. Normal is the left-hand normal. */
export const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt): Curve => (u) => {
  const v = 1 - u;
  const x = v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0];
  const y = v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1];
  const dx = 3 * v * v * (p1[0] - p0[0]) + 6 * v * u * (p2[0] - p1[0]) + 3 * u * u * (p3[0] - p2[0]);
  const dy = 3 * v * v * (p1[1] - p0[1]) + 6 * v * u * (p2[1] - p1[1]) + 3 * u * u * (p3[1] - p2[1]);
  const l = Math.hypot(dx, dy) || 1;
  return { x, y, angle: deg(Math.atan2(dy, dx)), nx: dy / l, ny: -dx / l };
};

/** Polyline through points, parametrised by arc length. Normal is the left-hand normal. */
export const polyline = (pts: Pt[]): Curve => {
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  return (u) => {
    const d = u * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i++;
    const seg = lens[i] - lens[i - 1] || 1;
    const k = (d - lens[i - 1]) / seg;
    const p = pts[i - 1];
    const q = pts[i];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const l = Math.hypot(dx, dy) || 1;
    return { x: p[0] + dx * k, y: p[1] + dy * k, angle: deg(Math.atan2(dy, dx)), nx: dy / l, ny: -dx / l };
  };
};

/** Approximate length of a curve. */
export const curveLength = (c: Curve, n = 48) => {
  let len = 0;
  let prev = c(0);
  for (let i = 1; i <= n; i++) {
    const s = c(i / n);
    len += Math.hypot(s.x - prev.x, s.y - prev.y);
    prev = s;
  }
  return len;
};

/** Sample a curve into an SVG path "d" string. */
export const curvePath = (c: Curve, n = 48, move = true) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const s = c(i / n);
    d += `${i === 0 && move ? 'M' : 'L'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
  }
  return d;
};

/**
 * Closed band between a curve and its offset along the normal (thickness may vary along u).
 * Useful for epithelia, membranes and layered walls.
 */
export const bandPath = (c: Curve, thickness: number | ((u: number) => number), n = 64, inward = false) => {
  const th = typeof thickness === 'number' ? () => thickness : thickness;
  const sgn = inward ? -1 : 1;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const s = c(u);
    const w = th(u);
    outer.push(`${s.x.toFixed(1)},${s.y.toFixed(1)}`);
    inner.push(`${(s.x + s.nx * w * sgn).toFixed(1)},${(s.y + s.ny * w * sgn).toFixed(1)}`);
  }
  return `M${outer.join('L')}L${inner.reverse().join('L')}Z`;
};

/** Smooth closed/open path through points using Catmull-Rom → cubic Bézier. */
export const smoothPath = (pts: readonly (readonly [number, number])[], closed = true, tension = 0.5) => {
  const n = pts.length;
  if (n < 2) return '';
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) * tension) / 3;
    const c1y = p1[1] + ((p2[1] - p0[1]) * tension) / 3;
    const c2x = p2[0] - ((p3[0] - p1[0]) * tension) / 3;
    const c2y = p2[1] - ((p3[1] - p1[1]) * tension) / 3;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
};

/**
 * Organic tube along a curve (stalks, cords, ducts): the half-width may vary along u so the ends can flare
 * into the tissue they join. Samples u ∈ [from, to]; `cap` rounds the `from` end (a growing tip).
 * Returns the fill outline plus the two side lines, so the sides can be stroked without drawing a hard edge
 * across the ends (which should be tucked under / merged into neighbouring tissue).
 */
export const tube = (c: Curve, hw: (u: number) => number, from = 0, to = 1, n = 40, cap = false) => {
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = c(from + ((to - from) * i) / n);
    const w = hw(from + ((to - from) * i) / n);
    L.push([s.x + s.nx * w, s.y + s.ny * w]);
    R.push([s.x - s.nx * w, s.y - s.ny * w]);
  }
  const tip: Pt[] = [];
  if (cap) {
    const s = c(from);
    const w = hw(from);
    const tx = -s.ny;
    const ty = s.nx; // unit tangent (n is the tangent's left-hand normal); the cap bulges backwards, towards −u
    for (let i = 1; i < 8; i++) {
      const a = (i / 8) * Math.PI;
      tip.push([s.x - s.nx * w * Math.cos(a) - tx * w * Math.sin(a), s.y - s.ny * w * Math.cos(a) - ty * w * Math.sin(a)]);
    }
  }
  return {
    d: smoothPath([...L, ...[...R].reverse(), ...tip], true, 0.5),
    left: smoothPath(L, false, 0.5),
    right: smoothPath(R, false, 0.5),
  };
};

/** Points on an ellipse, optionally with a deterministic wobble (for organic blobs). */
export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, n = 24, wobble = 0, seed = 1): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + wobble * Math.sin(a * 3 + seed) * Math.cos(a * 2 + seed * 1.7);
    return [cx + rx * w * Math.cos(a), cy + ry * w * Math.sin(a)] as Pt;
  });

/** Ellipse path string. */
export const ellipseD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 ${-rx * 2},0Z`;
