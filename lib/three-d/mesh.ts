import { perfCount } from '@/lib/perf';
import { add, cross, dot, mul, norm, perp, rotate, sub, type V3 } from './math';

/**
 * Triangle meshes for the 3D views, built procedurally from the scene's own parameters (so a limb
 * bends or a membrane grows as a function of `t`, like the 2D drawings). Every generator can build a
 * coarse version too: the SVG layer projects that one for pointing, naming and the no-WebGL fallback.
 */
export interface Mesh {
  pos: Float32Array;
  nrm: Float32Array;
  /** u: along the shape (0..1), v: around it (0..1). Drives the tissue texture direction (fibres). */
  uv: Float32Array;
  idx: Uint32Array;
}

/** A frame along a curve: tangent t, and two normals n (reference side) and b. */
interface Frame {
  p: V3;
  t: V3;
  n: V3;
  b: V3;
}

/**
 * Rotation-minimising frames along a polyline. `ref` fixes which way the first normal points
 * (e.g. the flexor side of a limb), so a side of the tube can be named and coloured.
 */
export function frames(path: readonly V3[], ref: V3): Frame[] {
  const out: Frame[] = [];
  const tan = (i: number) => norm(sub(path[Math.min(path.length - 1, i + 1)], path[Math.max(0, i - 1)]));
  let t = tan(0);
  let n = perp(ref, t);
  for (let i = 0; i < path.length; i++) {
    const ti = tan(i);
    // Carry the normal over by the rotation that takes the previous tangent onto this one.
    const ax = cross(t, ti);
    const s = Math.hypot(ax[0], ax[1], ax[2]);
    if (s > 1e-6) n = rotate(n, mul(ax, 1 / s), Math.atan2(s, dot(t, ti)));
    n = perp(n, ti);
    t = ti;
    out.push({ p: path[i], t: ti, n, b: cross(ti, n) });
  }
  return out;
}

export interface TubeOptions {
  /** Radius at u (0..1 along the path); may vary around via `around`. */
  radius: (u: number) => number;
  /** Squash around the tube: radius multiplier at angle a (0 = the reference side `n`). */
  around?: (a: number, u: number) => number;
  /** Which way angle 0 points (perpendicular to the path at its start). */
  ref: V3;
  /** Angular range drawn, radians from the reference side: [-π, π] is the whole tube. */
  from?: number;
  to?: number;
  sides?: number;
  /** Rounded ends (whole tubes only). */
  capStart?: boolean;
  capEnd?: boolean;
}

/** A tube (or a part of one, e.g. its flexor half) swept along a path. */
export function tube(path: readonly V3[], o: TubeOptions): Mesh {
  const fr = frames(path, o.ref);
  const a0 = o.from ?? -Math.PI;
  const a1 = o.to ?? Math.PI;
  const whole = a1 - a0 >= Math.PI * 2 - 1e-6;
  const sides = o.sides ?? 18;
  const cols = whole ? sides : sides + 1;
  const pos: number[] = [];
  const uv: number[] = [];
  const rows: V3[][] = [];
  const capRows = 4;
  const ring = (f: Frame, u: number, scale: number, push: number) => {
    const r = o.radius(u) * scale;
    const pts: V3[] = [];
    for (let j = 0; j < cols; j++) {
      const a = a0 + ((a1 - a0) * j) / sides;
      const k = o.around?.(a, u) ?? 1;
      const d = add(mul(f.n, Math.cos(a) * r * k), mul(f.b, Math.sin(a) * r * k));
      pts.push(add(add(f.p, d), mul(f.t, push)));
    }
    return pts;
  };
  const us: number[] = [];
  if (o.capStart && whole)
    for (let c = capRows; c >= 1; c--) {
      const th = (c / capRows) * (Math.PI / 2);
      rows.push(ring(fr[0], 0, Math.cos(th), -Math.sin(th) * o.radius(0)));
      us.push(0);
    }
  fr.forEach((f, i) => {
    const u = i / (fr.length - 1);
    rows.push(ring(f, u, 1, 0));
    us.push(u);
  });
  if (o.capEnd && whole)
    for (let c = 1; c <= capRows; c++) {
      const th = (c / capRows) * (Math.PI / 2);
      rows.push(ring(fr[fr.length - 1], 1, Math.max(0.02, Math.cos(th)), Math.sin(th) * o.radius(1)));
      us.push(1);
    }
  rows.forEach((r, i) =>
    r.forEach((p, j) => {
      pos.push(p[0], p[1], p[2]);
      uv.push(us[i], j / sides);
    }),
  );
  const idx: number[] = [];
  for (let i = 0; i < rows.length - 1; i++)
    for (let j = 0; j < (whole ? cols : cols - 1); j++) {
      const j1 = (j + 1) % cols;
      const a = i * cols + j;
      const b = i * cols + j1;
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + j1;
      // Counter-clockwise seen from outside: around (b = t × n) × along gives the outward normal.
      idx.push(a, b, c, b, d, c);
    }
  return finish(pos, uv, idx);
}

export interface BlobOptions {
  center: V3;
  /** Semi-axes along the three directions. */
  radii: V3;
  /** Orientation: the three unit axes (default world x, y, z). */
  axes?: [V3, V3, V3];
  /** Radius multiplier for a unit direction (local frame) — bumps, bulges, flattening. */
  shape?: (d: V3) => number;
  rings?: number;
  sides?: number;
}

/** An ellipsoid, optionally deformed: heads, bulges, paddles. */
export function blob(o: BlobOptions): Mesh {
  const rings = o.rings ?? 18;
  const sides = o.sides ?? 24;
  const [ax, ay, az] = o.axes ?? [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const th = (i / rings) * Math.PI;
    for (let j = 0; j <= sides; j++) {
      const ph = (j / sides) * Math.PI * 2;
      const d: V3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      const k = o.shape?.(d) ?? 1;
      const l: V3 = [d[0] * o.radii[0] * k, d[1] * o.radii[1] * k, d[2] * o.radii[2] * k];
      const p = add(o.center, add(add(mul(ax, l[0]), mul(ay, l[1])), mul(az, l[2])));
      pos.push(p[0], p[1], p[2]);
      uv.push(i / rings, j / sides);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j;
      const b = a + 1;
      const c = a + sides + 1;
      const d = c + 1;
      if (i > 0) idx.push(a, b, c);
      if (i < rings - 1) idx.push(b, d, c);
    }
  return finish(pos, uv, idx);
}

/**
 * A surface patch over a (u, v) grid in 0..1 × 0..1 — walls of an opened chamber, flaps. `facing`: the
 * point the front side looks towards (a chamber seen from inside faces its own centre), so pointing and
 * the flat fallback find it from there.
 */
export function grid(nu: number, nv: number, at: (u: number, v: number) => V3, facing?: V3): Mesh {
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= nu; i++)
    for (let j = 0; j <= nv; j++) {
      const p = at(i / nu, j / nv);
      pos.push(p[0], p[1], p[2]);
      uv.push(i / nu, j / nv);
    }
  // Which way round the triangles go: their normal towards `facing` at the middle of the patch.
  let flip = false;
  if (facing) {
    const P = (i: number, j: number) => at(i / nu, j / nv);
    const mi = Math.floor(nu / 2);
    const mj = Math.floor(nv / 2);
    const a = P(mi, mj);
    const n = cross(sub(P(mi + 1, mj), a), sub(P(mi, mj + 1), a));
    flip = dot(n, sub(facing, a)) < 0;
  }
  const idx: number[] = [];
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + 1;
      const c = a + nv + 1;
      const d = c + 1;
      if (flip) idx.push(a, b, c, b, d, c);
      else idx.push(a, c, b, b, c, d);
    }
  return finish(pos, uv, idx);
}

/** Smooth vertex normals from the triangles (seams of open parts keep their own). */
function finish(pos: number[], uv: number[], idx: number[]): Mesh {
  perfCount('meshBuild');
  const p = new Float32Array(pos);
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    const e1: V3 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
    const e2: V3 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
    const f = cross(e1, e2);
    for (const v of [a, b, c]) {
      n[v] += f[0];
      n[v + 1] += f[1];
      n[v + 2] += f[2];
    }
  }
  // Coincident vertices (a closed tube's seam, the poles of a blob) share one normal.
  const key = (i: number) => `${p[i].toFixed(4)},${p[i + 1].toFixed(4)},${p[i + 2].toFixed(4)}`;
  const acc = new Map<string, [number, number, number]>();
  for (let i = 0; i < p.length; i += 3) {
    const k = key(i);
    const s = acc.get(k) ?? [0, 0, 0];
    s[0] += n[i];
    s[1] += n[i + 1];
    s[2] += n[i + 2];
    acc.set(k, s);
  }
  for (let i = 0; i < p.length; i += 3) {
    const s = acc.get(key(i))!;
    const l = Math.hypot(s[0], s[1], s[2]) || 1;
    n[i] = s[0] / l;
    n[i + 1] = s[1] / l;
    n[i + 2] = s[2] / l;
  }
  return { pos: p, nrm: n, uv: new Float32Array(uv), idx: new Uint32Array(idx) };
}

/** Points of a smooth path through key points (Catmull-Rom), n samples. */
export function curve3(keys: readonly V3[], n = 24): V3[] {
  const k = keys;
  const out: V3[] = [];
  const at = (i: number) => k[Math.max(0, Math.min(k.length - 1, i))];
  for (let s = 0; s < n; s++) {
    const g = (s / (n - 1)) * (k.length - 1);
    const i = Math.min(k.length - 2, Math.floor(g));
    const u = g - i;
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const u2 = u * u;
    const u3 = u2 * u;
    const c = (j: number) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3);
    out.push([c(0), c(1), c(2)]);
  }
  return out;
}

/** Several meshes as one (e.g. the five digits of a hand, coloured and named together). */
export function merge(ms: readonly Mesh[]): Mesh {
  perfCount('meshMerge');
  const nv = ms.reduce((s, m) => s + m.pos.length, 0);
  const ni = ms.reduce((s, m) => s + m.idx.length, 0);
  const pos = new Float32Array(nv);
  const nrm = new Float32Array(nv);
  const uv = new Float32Array((nv / 3) * 2);
  const idx = new Uint32Array(ni);
  let o = 0;
  let oi = 0;
  for (const m of ms) {
    pos.set(m.pos, o);
    nrm.set(m.nrm, o);
    uv.set(m.uv, (o / 3) * 2);
    for (let i = 0; i < m.idx.length; i++) idx[oi + i] = m.idx[i] + o / 3;
    o += m.pos.length;
    oi += m.idx.length;
  }
  return { pos, nrm, uv, idx };
}
