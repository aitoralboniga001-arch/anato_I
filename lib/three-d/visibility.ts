import { add, cross, dot, len, mul, norm, sub, type M4, type V3 } from './math';
import type { Item3 } from './scene';

/** These label occluders use rigid transforms (rotation and translation, without scale). */
const localPoint = (p: V3, m?: M4): V3 => {
  if (!m) return p;
  const q = sub(p, [m[12], m[13], m[14]]);
  return [m[0] * q[0] + m[1] * q[1] + m[2] * q[2], m[4] * q[0] + m[5] * q[1] + m[6] * q[2], m[8] * q[0] + m[9] * q[1] + m[10] * q[2]];
};

type Mesh = Item3['mesh'];

/** A bounding sphere per mesh (computed once): most rays miss most occluders, and skipping those
 *  before the triangle loop keeps per-frame label checks cheap on tablets. */
const spheres = new WeakMap<Mesh, { c: V3; r: number }>();
const sphereOf = (mesh: Mesh) => {
  let s = spheres.get(mesh);
  if (s) return s;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.pos.length; i += 3)
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], mesh.pos[i + k]); hi[k] = Math.max(hi[k], mesh.pos[i + k]); }
  const c: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  let r = 0;
  for (let i = 0; i < mesh.pos.length; i += 3) r = Math.max(r, Math.hypot(mesh.pos[i] - c[0], mesh.pos[i + 1] - c[1], mesh.pos[i + 2] - c[2]));
  s = { c, r: r + 1e-6 };
  spheres.set(mesh, s);
  return s;
};

/** Segment/triangle test: a label must not point through opaque tissue in front of its anchor. */
export function visibleFrom(point: V3, eye: V3, occluders: readonly Item3[], tolerance = 0.035): boolean {
  for (const item of occluders) {
    const from = localPoint(eye, item.matrix);
    const to = localPoint(point, item.matrix);
    const delta = sub(to, from);
    const distance = Math.hypot(...delta);
    const direction = norm(delta);
    const mesh = item.hit ?? item.mesh;
    const sphere = sphereOf(mesh);
    const along = Math.min(distance, Math.max(0, dot(sub(sphere.c, from), direction)));
    if (len(sub(sphere.c, add(from, mul(direction, along)))) > sphere.r) continue;
    const vertex = (i: number): V3 => [mesh.pos[i * 3], mesh.pos[i * 3 + 1], mesh.pos[i * 3 + 2]];
    for (let i = 0; i < mesh.idx.length; i += 3) {
      const a = vertex(mesh.idx[i]);
      const e1 = sub(vertex(mesh.idx[i + 1]), a);
      const e2 = sub(vertex(mesh.idx[i + 2]), a);
      const h = cross(direction, e2);
      const det = dot(e1, h);
      if (Math.abs(det) < 1e-8) continue;
      const s = sub(from, a);
      const u = dot(s, h) / det;
      if (u < 0 || u > 1) continue;
      const q = cross(s, e1);
      const v = dot(direction, q) / det;
      if (v < 0 || u + v > 1) continue;
      const t = dot(e2, q) / det;
      if (t > 1e-6 && t < distance - tolerance) return false;
    }
  }
  return true;
}
