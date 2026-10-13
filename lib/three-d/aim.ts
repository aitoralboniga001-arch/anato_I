import { add, cross, dot, len, mix3, mul, norm, perp, rotate, sub, type Camera3, type M4, type V3 } from './math';
import type { Mesh } from './mesh';
import type { Item3 } from './scene';

/**
 * The 3D views' study camera: when one structure is put forward (the step's tour, the 3D tour), the
 * camera turns towards the side it lies on and comes a little closer, so it is seen from where it is
 * best seen instead of wherever the step's camera happened to be. Pure: the shell animates between
 * cameras, the tests can check the aim.
 */

/** Mean vertex of a mesh in its own coordinates (computed once per mesh). */
const means = new WeakMap<Mesh, V3>();
function meanOf(m: Mesh): V3 {
  const hit = means.get(m);
  if (hit) return hit;
  const n = m.pos.length / 3;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < n; i++) {
    x += m.pos[i * 3];
    y += m.pos[i * 3 + 1];
    z += m.pos[i * 3 + 2];
  }
  const out: V3 = n ? [x / n, y / n, z / n] : [0, 0, 0];
  means.set(m, out);
  return out;
}

const apply = (m: M4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

/** Where a structure is in the scene: the centre of every visible item that draws it (or a part of it). */
export function centreOf(items: Item3[], id: string, partsOf?: (id: string) => readonly string[]): V3 | null {
  const parts = partsOf?.(id) ?? [];
  let sum: V3 = [0, 0, 0];
  let n = 0;
  for (const it of items) {
    if ((it.show ?? 1) * (it.opacity ?? 1) < 0.3) continue;
    if (!it.id || !(it.id === id || it.groups?.includes(id) || parts.includes(it.id))) continue;
    const c = meanOf(it.hit ?? it.mesh);
    sum = add(sum, it.matrix ? apply(it.matrix, c) : c);
    n++;
  }
  return n ? mul(sum, 1 / n) : null;
}

/** How far towards the structure's side the camera turns (of the whole angle), and the elevation it keeps. */
const TURN = 0.6;
const ELEV: [number, number] = [-0.25, 1.15];

/** The step's camera turned towards `at` (a point in the scene), a little closer and re-centred on it. */
export function aimCamera(cam: Camera3, at: V3 | null): Camera3 {
  if (!at) return cam;
  const up = cam.up ?? [0, 1, 0];
  const off = sub(cam.eye, cam.target);
  const r = len(off);
  const o = norm(off);
  const v = sub(at, cam.target);
  let dir = o;
  // A structure off the centre: turn towards its side (one at the centre is seen from anywhere).
  if (len(v) > r * 0.04) {
    const vh = norm(v);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot(o, vh))));
    if (angle > 0.08) {
      const axis = cross(o, vh);
      dir = rotate(o, len(axis) > 1e-4 ? norm(axis) : up, angle * TURN);
    }
  }
  // Never so low or so high that the picture loses its up and down.
  const el = Math.asin(Math.max(-1, Math.min(1, dot(dir, up))));
  if (el < ELEV[0] || el > ELEV[1]) {
    const e = Math.max(ELEV[0], Math.min(ELEV[1], el));
    const h = perp(dir, up);
    dir = norm(add(mul(h, Math.cos(e)), mul(up, Math.sin(e))));
  }
  const target = mix3(cam.target, at, 0.3);
  return { ...cam, target, eye: add(target, mul(dir, r * 0.92)) };
}

/** A camera on the way from `a` to `b` (e = 0..1): round the target, never through the model. */
export function blendCamera(a: Camera3, b: Camera3, e: number): Camera3 {
  if (e <= 0) return a;
  if (e >= 1) return b;
  const target = mix3(a.target, b.target, e);
  const oa = sub(a.eye, a.target);
  const ob = sub(b.eye, b.target);
  const ua = norm(oa);
  const ub = norm(ob);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(ua, ub))));
  let dir = ub;
  if (angle > 1e-4) {
    const axis = cross(ua, ub);
    dir = rotate(ua, len(axis) > 1e-4 ? norm(axis) : (b.up ?? [0, 1, 0]), angle * e);
  }
  const r = len(oa) + (len(ob) - len(oa)) * e;
  const shift: [number, number] | undefined =
    a.shift || b.shift ? [(a.shift?.[0] ?? 0) + ((b.shift?.[0] ?? 0) - (a.shift?.[0] ?? 0)) * e, (a.shift?.[1] ?? 0) + ((b.shift?.[1] ?? 0) - (a.shift?.[1] ?? 0)) * e] : undefined;
  return { ...b, target, eye: add(target, mul(dir, r)), fov: a.fov + (b.fov - a.fov) * e, shift };
}
