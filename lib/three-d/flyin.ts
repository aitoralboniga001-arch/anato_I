import { add, cross, mix3, mul, norm, sub, type Camera3, type M4, type V3 } from './math';
import type { Mesh } from './mesh';
import type { Item3 } from './scene';
import { apply, embryo5 } from './embryo5';

/**
 * "Where is this cut?" told in 3D: the whole 5-week embryo from the side (head up, as in the books),
 * two glowing planes slice it at the block's level, the embryo turns translucent and fades while the
 * camera flies in and turns until the block sits in its own view. One `u` (0..1) drives it all, so a
 * view gives it the first second or so of its timeline.
 */

export interface Plane {
  center: V3;
  /** Half-extents along two in-plane axes. */
  a: V3;
  b: V3;
}

export interface FlyIn {
  /** The embryo, the planes (empty once the fly-in is over). */
  items: Item3[];
  camera: Camera3;
  /** 0..1: how much of the block to show. */
  block: number;
  /** 0..1: names and step notes. */
  labels: number;
  /** 0..1: the "head"/"tail" and "where" notes of the prelude. */
  where: number;
  head: V3;
  tail: V3;
}

const smooth = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

function quad(p: Plane): Mesh {
  const n = norm(cross(p.a, p.b));
  const c = [sub(sub(p.center, p.a), p.b), add(sub(p.center, p.b), p.a), add(add(p.center, p.a), p.b), sub(add(p.center, p.b), p.a)];
  const pos = new Float32Array(24);
  const nrm = new Float32Array(24);
  const uv = new Float32Array(16);
  for (let s = 0; s < 2; s++)
    c.forEach((q, i) => {
      const j = s * 4 + i;
      pos.set([q[0], q[1], q[2]], j * 3);
      nrm.set(s ? [-n[0], -n[1], -n[2]] : [n[0], n[1], n[2]], j * 3);
      uv.set([i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0], j * 2);
    });
  return { pos, nrm, uv, idx: new Uint32Array([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]) };
}

const planeCache = new Map<string, Mesh>();

/**
 * `matrix` puts the embryo into the scene (see sectionMatrix); `end` is the view's own camera;
 * `planes` are the faces of the block, in scene space.
 */
export function flyIn(
  u: number,
  matrix: M4,
  end: Camera3,
  planes: readonly Plane[],
  o: { dist?: number; cranial?: V3; dorsal?: V3 } = {},
): FlyIn {
  const dist = o.dist ?? 17;
  const E = embryo5();
  const dirOf = (d: V3) => norm(sub(apply(matrix, d), apply(matrix, [0, 0, 0])));
  const centre = apply(matrix, [0, -2.55, 0.15]);
  const side = dirOf([1, 0, 0]);
  const headUp = dirOf(norm([0, 0.13, 1]));
  const camK = smooth(0.45, 1, u);
  // Turn round from the embryo's side to the view's own direction, coming closer on a log scale.
  const endOff = sub(end.eye, end.target);
  const endDist = Math.hypot(endOff[0], endOff[1], endOff[2]);
  // Mostly from the side, a little from the section's cranial and dorsal sides, so the cut planes are seen at an angle.
  const cranial = o.cranial ?? dirOf([0, 0, 1]);
  const dorsal = o.dorsal ?? dirOf([0, 1, 0]);
  const startDir = norm(add(add(side, mul(cranial, 0.45)), mul(dorsal, 0.28)));
  const dir = norm(mix3(startDir, norm(endOff), camK));
  const dd = Math.exp(Math.log(dist) + (Math.log(endDist) - Math.log(dist)) * camK);
  const target = mix3(centre, end.target, camK);
  const up = norm(mix3(headUp, end.up ?? [0, 1, 0], smooth(0.5, 0.95, u)));
  const camera: Camera3 = { eye: add(target, mul(dir, dd)), target, up, fov: end.fov, shift: [end.shift?.[0] ?? 0, (end.shift?.[1] ?? 0) * camK] };
  // The cut, then the slab shows through a ghost of the embryo, then both clear before the camera moves in.
  const op = (1 - 0.8 * smooth(0.32, 0.44, u)) * (1 - smooth(0.5, 0.62, u));
  const glow = smooth(0.12, 0.3, u) * (1 - smooth(0.48, 0.62, u));
  const items: Item3[] = [];
  if (op > 0.005) {
    items.push({ key: 'e5-body', mesh: E.body, hit: E.hit, matrix, color: op < 0.9 ? '#ffe2d8' : '#efc6b8', deep: '#9a5a58', tissue: 'skin', opacity: op });
    E.eyes.forEach((m, i) => items.push({ key: `e5-eye${i}`, mesh: m, matrix, color: '#4a3038', deep: '#1a0e12', tissue: 'skin', opacity: op }));
  }
  if (glow > 0.01)
    planes.forEach((p, i) => {
      const key = `${p.center.join()}|${p.a.join()}|${p.b.join()}`;
      let m = planeCache.get(key);
      if (!m) planeCache.set(key, (m = quad(p)));
      items.push({ key: `e5-plane${i}`, mesh: m, color: '#ffd27a', deep: '#c08a2a', tissue: 'membrane', opacity: 0.55 * glow, outline: false });
    });
  return {
    items,
    camera,
    block: smooth(0.3, 0.52, u),
    labels: smooth(0.86, 1, u),
    where: 1 - smooth(0.42, 0.56, u),
    head: apply(matrix, E.head),
    tail: apply(matrix, E.tail),
  };
}


/**
 * Fade a view's own items in with the fly-in. The GL layer shows them as the block appears (`late`
 * items, tiny ones like migrating cells, only with the names); their SVG parts stay under the
 * pointing threshold until the names come, so the viewer never rings a structure it cannot name yet.
 */
export function reveal(items: Item3[], F: FlyIn, late: (it: Item3) => boolean = () => false) {
  if (F.block >= 0.999 && F.labels >= 0.999) return;
  for (const it of items) {
    const base = it.show ?? 1;
    const g = late(it) ? F.labels : F.block;
    const part = base * Math.min(g, 0.25 + 0.75 * F.labels);
    it.show = part;
    it.opacity = (it.opacity ?? 1) * (part > 1e-4 ? (base * g) / part : 0);
  }
}
