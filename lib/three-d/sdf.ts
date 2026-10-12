import { add, cross, dot, len, mul, norm, sub, type V3 } from './math';
import type { Mesh } from './mesh';

/**
 * Organic bodies as one continuous surface. A body is a signed distance function (negative inside)
 * built from rounded volumes blended with a smooth union, so a head flows into the neck and the back
 * the way living tissue does, with no seams between "parts". `surfaceMesh` turns it into triangles.
 */

/** Signed distance at (x, y, z): negative inside. Scalar arguments, so evaluating it allocates nothing. */
export type SDF = (x: number, y: number, z: number) => number;

/** Ellipsoid (approximate distance, exact surface), centre c, semi-axes r, optional local axes. */
export function ellipsoid(c: V3, r: V3, axes?: [V3, V3, V3]): SDF {
  const [cx, cy, cz] = c;
  const [i0, i1, i2] = [1 / r[0], 1 / r[1], 1 / r[2]];
  const [j0, j1, j2] = [i0 * i0, i1 * i1, i2 * i2];
  const A = axes ?? [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const [a, b, d] = A;
  return (x, y, z) => {
    const px = x - cx;
    const py = y - cy;
    const pz = z - cz;
    const q0 = px * a[0] + py * a[1] + pz * a[2];
    const q1 = px * b[0] + py * b[1] + pz * b[2];
    const q2 = px * d[0] + py * d[1] + pz * d[2];
    const k0 = Math.sqrt(q0 * q0 * i0 * i0 + q1 * q1 * i1 * i1 + q2 * q2 * i2 * i2);
    const k1 = Math.sqrt(q0 * q0 * j0 * j0 + q1 * q1 * j1 * j1 + q2 * q2 * j2 * j2);
    return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(r[0], r[1], r[2]);
  };
}

/** A rounded cone between two points (radius ra at a, rb at b). */
export function capsule(a: V3, b: V3, ra: number, rb = ra): SDF {
  const [bx, by, bz] = sub(b, a);
  const l2 = bx * bx + by * by + bz * bz;
  return (x, y, z) => {
    const px = x - a[0];
    const py = y - a[1];
    const pz = z - a[2];
    const h = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / l2));
    return Math.hypot(px - bx * h, py - by * h, pz - bz * h) - (ra + (rb - ra) * h);
  };
}

/** Smooth union of distances (polynomial smin), blend width k. */
export function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

/** Smooth subtraction: carve b out of a (grooves: the mouth, the eyelid fold). */
export function ssub(a: number, b: number, k: number) {
  return -smin(-a, b, k);
}

export const blend =
  (k: number, ...fs: SDF[]): SDF =>
  (x, y, z) => {
    let d = fs[0](x, y, z);
    for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k);
    return d;
  };

export function gradient(f: SDF, p: V3, e = 0.004): V3 {
  const [x, y, z] = p;
  return norm([f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)]);
}

/** Where a ray from inside the body leaves its surface (and the outward normal there). */
export function surfaceAlong(f: SDF, from: V3, dir: V3, maxLen = 3): { p: V3; n: V3 } {
  const d = norm(dir);
  let a = 0;
  let b = maxLen;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    const q = add(from, mul(d, m));
    if (f(q[0], q[1], q[2]) < 0) a = m;
    else b = m;
  }
  const p = add(from, mul(d, (a + b) / 2));
  return { p, n: gradient(f, p) };
}

/**
 * Surface nets: one vertex per grid cell the surface crosses (the mean of its edge crossings, then
 * pulled onto the surface), one quad per crossed grid edge. Smooth normals from the field itself.
 */
export function surfaceMesh(f: SDF, min: V3, max: V3, step: number): Mesh {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1;
  const ny = Math.ceil((max[1] - min[1]) / step) + 1;
  const nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const val = new Float32Array(nx * ny * nz);
  // Narrow band: a coarse grid first; fine samples only where the surface can be near.
  const B = 4;
  const cx = Math.ceil((nx - 1) / B) + 1;
  const cy = Math.ceil((ny - 1) / B) + 1;
  const cz = Math.ceil((nz - 1) / B) + 1;
  const coarse = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) coarse[i + cx * (j + cy * k)] = f(min[0] + i * B * step, min[1] + j * B * step, min[2] + k * B * step);
  const reach = B * step * 1.9;
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const c = coarse[Math.round(i / B) + cx * (Math.round(j / B) + cy * Math.round(k / B))];
        val[at(i, j, k)] = Math.abs(c) > reach ? c : f(min[0] + i * step, min[1] + j * step, min[2] + k * step);
      }
  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const pos: number[] = [];
  const nrm: number[] = [];
  const corners: [number, number, number][] = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
  ];
  const edges: [number, number][] = [
    [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let q = 0; q < 8; q++) {
          const cq = corners[q];
          v[q] = val[at(i + cq[0], j + cq[1], k + cq[2])];
          if (v[q] < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let n = 0;
        for (const [a, b] of edges) {
          if (v[a] < 0 === v[b] < 0) continue;
          const t = v[a] / (v[a] - v[b]);
          const ca = corners[a];
          const cb = corners[b];
          sx += ca[0] + (cb[0] - ca[0]) * t;
          sy += ca[1] + (cb[1] - ca[1]) * t;
          sz += ca[2] + (cb[2] - ca[2]) * t;
          n++;
        }
        let p: V3 = [min[0] + (i + sx / n) * step, min[1] + (j + sy / n) * step, min[2] + (k + sz / n) * step];
        // Pull the vertex onto the surface (one Newton step along the field's gradient).
        const g = gradient(f, p, step * 0.3);
        p = sub(p, mul(g, f(p[0], p[1], p[2])));
        cellVert[at(i, j, k)] = pos.length / 3;
        pos.push(p[0], p[1], p[2]);
        nrm.push(g[0], g[1], g[2]);
      }
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, d, c, a, c, b);
    else idx.push(a, b, c, a, c, d);
  };
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const v0 = val[at(i, j, k)] < 0;
        // Edge along x: the four cells around it.
        if (i < nx - 1 && j > 0 && k > 0 && v0 !== val[at(i + 1, j, k)] < 0)
          quad(cellVert[at(i, j - 1, k - 1)], cellVert[at(i, j, k - 1)], cellVert[at(i, j, k)], cellVert[at(i, j - 1, k)], !v0);
        if (j < ny - 1 && i > 0 && k > 0 && v0 !== val[at(i, j + 1, k)] < 0)
          quad(cellVert[at(i - 1, j, k - 1)], cellVert[at(i - 1, j, k)], cellVert[at(i, j, k)], cellVert[at(i, j, k - 1)], !v0);
        if (k < nz - 1 && i > 0 && j > 0 && v0 !== val[at(i, j, k + 1)] < 0)
          quad(cellVert[at(i - 1, j - 1, k)], cellVert[at(i, j - 1, k)], cellVert[at(i, j, k)], cellVert[at(i - 1, j, k)], !v0);
      }
  const P = new Float32Array(pos);
  const N = new Float32Array(nrm);
  // Wind every triangle so it faces along the field's outward normal (front faces outside).
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3;
    const b = idx[t + 1] * 3;
    const c = idx[t + 2] * 3;
    const fnv = cross([P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]]);
    if (dot(fnv, [N[a] + N[b] + N[c], N[a + 1] + N[b + 1] + N[c + 1], N[a + 2] + N[b + 2] + N[c + 2]]) < 0) {
      const s = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = s;
    }
  }
  return { pos: P, nrm: N, uv: new Float32Array((P.length / 3) * 2), idx: new Uint32Array(idx) };
}

/**
 * Split a mesh in two by which side each triangle's centre is on (e.g. a limb's flexor and extensor
 * halves, coloured and named apart). Vertices on the border are shared by both halves.
 */
export function partition(m: Mesh, side: (c: V3) => boolean): [Mesh, Mesh] {
  const out = [0, 1].map(() => ({ map: new Map<number, number>(), pos: [] as number[], nrm: [] as number[], idx: [] as number[] }));
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t];
    const b = m.idx[t + 1];
    const c = m.idx[t + 2];
    const cen: V3 = [
      (m.pos[a * 3] + m.pos[b * 3] + m.pos[c * 3]) / 3,
      (m.pos[a * 3 + 1] + m.pos[b * 3 + 1] + m.pos[c * 3 + 1]) / 3,
      (m.pos[a * 3 + 2] + m.pos[b * 3 + 2] + m.pos[c * 3 + 2]) / 3,
    ];
    const o = out[side(cen) ? 0 : 1];
    for (const v of [a, b, c]) {
      let i = o.map.get(v);
      if (i === undefined) {
        i = o.pos.length / 3;
        o.map.set(v, i);
        o.pos.push(m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2]);
        o.nrm.push(m.nrm[v * 3], m.nrm[v * 3 + 1], m.nrm[v * 3 + 2]);
      }
      o.idx.push(i);
    }
  }
  const [p, q] = out.map((o) => ({ pos: new Float32Array(o.pos), nrm: new Float32Array(o.nrm), uv: new Float32Array((o.pos.length / 3) * 2), idx: new Uint32Array(o.idx) }));
  return [p, q];
}

/** Signed distance to a closed 2D outline in the (x, z) plane (negative inside). */
export function polygon2(pts: readonly (readonly [number, number])[]): (x: number, z: number) => number {
  const n = pts.length;
  const px = Float64Array.from(pts, (p) => p[0]);
  const pz = Float64Array.from(pts, (p) => p[1]);
  return (x, z) => {
    let d = Infinity;
    let s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const ex = px[j] - px[i];
      const ez = pz[j] - pz[i];
      const wx = x - px[i];
      const wz = z - pz[i];
      const h = Math.max(0, Math.min(1, (wx * ex + wz * ez) / (ex * ex + ez * ez || 1)));
      const bx = wx - ex * h;
      const bz = wz - ez * h;
      d = Math.min(d, bx * bx + bz * bz);
      const c1 = z >= pz[i];
      const c2 = z < pz[j];
      const c3 = ex * wz > ez * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };
}

/** A flat plate of the given 2D shape (distance d2(x, z)), thickness 2·half around y = y0, rounded edges. */
export function slab(d2: (x: number, z: number) => number, half: number, round: number, y0 = 0): SDF {
  return (x, y, z) => {
    const a = d2(x, z) + round;
    const b = Math.abs(y - y0) - (half - round);
    return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0) - round;
  };
}

/**
 * Move a mesh's vertices (growth, folding into a dome) without rebuilding it: `move` maps a rest
 * position to its new place; normals follow the local deformation (finite differences).
 */
export function deform(m: Mesh, move: (p: V3, i: number) => V3, e = 0.01): Mesh {
  const pos = new Float32Array(m.pos.length);
  const nrm = new Float32Array(m.nrm.length);
  for (let i = 0; i < m.pos.length; i += 3) {
    const p: V3 = [m.pos[i], m.pos[i + 1], m.pos[i + 2]];
    const vi = i / 3;
    const q = move(p, vi);
    pos[i] = q[0];
    pos[i + 1] = q[1];
    pos[i + 2] = q[2];
    // Normals transform by the inverse transpose of the Jacobian: n' ∝ cofactor(J)·n.
    const jx = sub(move([p[0] + e, p[1], p[2]], vi), q);
    const jy = sub(move([p[0], p[1] + e, p[2]], vi), q);
    const jz = sub(move([p[0], p[1], p[2] + e], vi), q);
    const n: V3 = [m.nrm[i], m.nrm[i + 1], m.nrm[i + 2]];
    const c = add(add(mul(cross(jy, jz), n[0]), mul(cross(jz, jx), n[1])), mul(cross(jx, jy), n[2]));
    const nn = norm(c);
    nrm[i] = nn[0];
    nrm[i + 1] = nn[1];
    nrm[i + 2] = nn[2];
  }
  return { pos, nrm, uv: m.uv, idx: m.idx };
}

/** Unsigned distance to an open 2D curve (a sheet's mid-line), in whatever plane the caller uses. */
export function polyline2(pts: readonly (readonly [number, number])[]): (u: number, v: number) => number {
  const n = pts.length;
  return (u, v) => {
    let d = Infinity;
    for (let i = 0; i + 1 < n; i++) {
      const [ax, ay] = pts[i];
      const ex = pts[i + 1][0] - ax;
      const ey = pts[i + 1][1] - ay;
      const wx = u - ax;
      const wy = v - ay;
      const h = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey || 1)));
      d = Math.min(d, (wx - ex * h) ** 2 + (wy - ey * h) ** 2);
    }
    return Math.sqrt(d);
  };
}

/** A 2D shape (distance d2(x, y), negative inside) extruded along z from z0 to z1, edges rounded by `round`. */
export function prismZ(d2: (x: number, y: number) => number, z0: number, z1: number, round = 0.01): SDF {
  const zc = (z0 + z1) / 2;
  const half = (z1 - z0) / 2;
  return (x, y, z) => {
    const a = d2(x, y) + round;
    const b = Math.abs(z - zc) - (half - round);
    return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0) - round;
  };
}

/** The mirror image of a mesh across x = 0 (the other side of a bilateral body), still facing outwards. */
export function mirrorX(m: Mesh): Mesh {
  const pos = Float32Array.from(m.pos);
  const nrm = Float32Array.from(m.nrm);
  for (let i = 0; i < pos.length; i += 3) {
    pos[i] = -pos[i];
    nrm[i] = -nrm[i];
  }
  const idx = Uint32Array.from(m.idx);
  for (let t = 0; t < idx.length; t += 3) {
    const s = idx[t + 1];
    idx[t + 1] = idx[t + 2];
    idx[t + 2] = s;
  }
  return { pos, nrm, uv: m.uv, idx };
}
