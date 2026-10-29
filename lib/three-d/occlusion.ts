import type { M4, V3 } from './math';
import type { Item3 } from './scene';

/**
 * Where a name's dot can sit so the camera sees it on its own structure. From a front view the dorsal
 * aortae lie behind the aortic sac: a dot at their anchor would be drawn on the sac. When something
 * solid is in front of the anchor, the dot moves to the nearest point of the named structure's own
 * surface that the eye does see. The test is a ray from the eye against the coarse (`hit`) meshes,
 * culled by bounding spheres, so an unhidden anchor costs one cheap pass.
 */

interface Sphere {
  c: V3;
  r: number;
}

interface Bound extends Sphere {
  /** World-space vertices (the matrix applied once). */
  pos: Float32Array;
  idx: Uint32Array;
  /** Runs of CHUNK triangles with their own spheres: a long curved vessel's one sphere is loose. */
  chunks: Sphere[];
}

const CHUNK = 48;

function sphereOf(pos: Float32Array, idx: Uint32Array | null, from = 0, to = 0): Sphere {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  const n = idx ? to - from : pos.length / 3;
  for (let k = 0; k < n; k++) {
    const i = (idx ? idx[from + k] : k) * 3;
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], pos[i + a]);
      hi[a] = Math.max(hi[a], pos[i + a]);
    }
  }
  if (!n) return { c: [0, 0, 0], r: 0 };
  const c: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  return { c, r: Math.hypot(hi[0] - c[0], hi[1] - c[1], hi[2] - c[2]) };
}

const bounds = new WeakMap<Item3['mesh'], Map<M4 | undefined, Bound>>();

function boundOf(it: Item3): Bound {
  const mesh = it.hit ?? it.mesh;
  let per = bounds.get(mesh);
  if (!per) bounds.set(mesh, (per = new Map()));
  const hit = per.get(it.matrix);
  if (hit) return hit;
  const P = mesh.pos;
  const M = it.matrix;
  const pos = M ? new Float32Array(P.length) : P;
  if (M)
    for (let i = 0; i < P.length; i += 3) {
      const x = P[i], y = P[i + 1], z = P[i + 2];
      pos[i] = M[0] * x + M[4] * y + M[8] * z + M[12];
      pos[i + 1] = M[1] * x + M[5] * y + M[9] * z + M[13];
      pos[i + 2] = M[2] * x + M[6] * y + M[10] * z + M[14];
    }
  const chunks: Sphere[] = [];
  for (let k = 0; k < mesh.idx.length; k += CHUNK * 3) chunks.push(sphereOf(pos, mesh.idx, k, Math.min(mesh.idx.length, k + CHUNK * 3)));
  const b = { ...sphereOf(pos, null), pos, idx: mesh.idx, chunks };
  per.set(it.matrix, b);
  return b;
}

/** Things that hide what is behind them: drawn, mostly opaque, and not a glassy tissue or a stream. */
export const solid = (it: Item3) => !it.stream && !!it.id && (it.opacity ?? 1) * (it.show ?? 1) >= 0.6 && !(it.tissue && (it.opacity ?? 1) < 0.9);

/** The item is the named structure itself (or one of its pieces). */
const isOwn = (it: Item3, id: string) => it.id === id || !!it.groups?.includes(id);

/**
 * Where a structure is when the model gives it no named point (drawn only as pieces, or as a group of
 * other parts): the middle of its biggest drawn piece. Null when nothing of it is drawn.
 */
export function ownCentre(items: Item3[], id: string): V3 | null {
  let best: Sphere | null = null;
  for (const it of items) {
    // Anything drawn, glassy organs included (a lung seen through is still where its name points).
    if (!isOwn(it, id) || it.stream || (it.opacity ?? 1) * (it.show ?? 1) < 0.05) continue;
    const b = boundOf(it);
    if (!best || b.r > best.r) best = b;
  }
  return best ? best.c : null;
}

/** Whether the segment o → o + d (of length len) comes within the sphere. */
function nearSphere(s: Sphere, o: V3, d: V3, len: number) {
  const oc: V3 = [s.c[0] - o[0], s.c[1] - o[1], s.c[2] - o[2]];
  const near = Math.max(0, Math.min(len, (oc[0] * d[0] + oc[1] * d[1] + oc[2] * d[2]) / len));
  const px = o[0] + (d[0] / len) * near - s.c[0];
  const py = o[1] + (d[1] / len) * near - s.c[1];
  const pz = o[2] + (d[2] / len) * near - s.c[2];
  return px * px + py * py + pz * pz <= s.r * s.r;
}

/** Whether the segment eye → p (stopped a vessel's width short of p) crosses a triangle of the item. */
function crosses(b: Bound, o: V3, d: V3, len: number): boolean {
  if (!nearSphere(b, o, d, len)) return false;
  for (let c = 0; c < b.chunks.length; c++) if (nearSphere(b.chunks[c], o, d, len) && crossesRun(b, o, d, c * CHUNK * 3, Math.min(b.idx.length, (c + 1) * CHUNK * 3))) return true;
  return false;
}

function crossesRun(b: Bound, o: V3, d: V3, from: number, to: number): boolean {
  const P = b.pos;
  const I = b.idx;
  for (let k = from; k < to; k += 3) {
    const a = I[k] * 3, bb = I[k + 1] * 3, c = I[k + 2] * 3;
    const e1x = P[bb] - P[a], e1y = P[bb + 1] - P[a + 1], e1z = P[bb + 2] - P[a + 2];
    const e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
    const qx = d[1] * e2z - d[2] * e2y, qy = d[2] * e2x - d[0] * e2z, qz = d[0] * e2y - d[1] * e2x;
    const det = e1x * qx + e1y * qy + e1z * qz;
    if (det > -1e-9 && det < 1e-9) continue;
    const inv = 1 / det;
    const tx = o[0] - P[a], ty = o[1] - P[a + 1], tz = o[2] - P[a + 2];
    const u = (tx * qx + ty * qy + tz * qz) * inv;
    if (u < 0 || u > 1) continue;
    const rx = ty * e1z - tz * e1y, ry = tz * e1x - tx * e1z, rz = tx * e1y - ty * e1x;
    const v = (d[0] * rx + d[1] * ry + d[2] * rz) * inv;
    if (v < 0 || u + v > 1) continue;
    const s = (e2x * rx + e2y * ry + e2z * rz) * inv;
    if (s > 0 && s < 1) return true;
  }
  return false;
}

/** The first solid structure other than `id` between the eye and `p`, or null when the eye sees `p`. */
export function coverOf(items: Item3[], eye: V3, p: V3, id: string, margin = 0.3): string | null {
  const full: V3 = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
  const len = Math.hypot(full[0], full[1], full[2]);
  if (len <= margin) return null;
  const k = (len - margin) / len;
  const d: V3 = [full[0] * k, full[1] * k, full[2] * k];
  const dl = len - margin;
  for (const it of items) if (solid(it) && !isOwn(it, id) && crosses(boundOf(it), eye, d, dl)) return it.id!;
  return null;
}

/**
 * The anchor itself when the eye sees it; else the nearest vertex of the structure's own surface the
 * eye does see inside the picture (`inFrame`; at most `tries` tried, nearest first); else the anchor
 * (nothing of it is in sight).
 */
export function visibleAnchor(items: Item3[], eye: V3, p: V3, id: string, inFrame: (q: V3) => boolean = () => true, tries = 48): V3 {
  // While the camera turns, an answer holds until the eye has moved a little: one search per name, not per frame.
  let memo = memos.get(items);
  if (!memo) memos.set(items, (memo = new Map()));
  const key = `${id}|${p[0]},${p[1]},${p[2]}`;
  const was = memo.get(key);
  if (was && inFrame(was.q) && Math.hypot(eye[0] - was.eye[0], eye[1] - was.eye[1], eye[2] - was.eye[2]) < 0.08) return was.q;
  const q = search(items, eye, p, id, inFrame, tries);
  memo.set(key, { eye: [eye[0], eye[1], eye[2]], q });
  return q;
}

const memos = new WeakMap<Item3[], Map<string, { eye: V3; q: V3 }>>();

function search(items: Item3[], eye: V3, p: V3, id: string, inFrame: (q: V3) => boolean, tries: number): V3 {
  // Seen and inside the picture: it stays. Cut off by the frame's edge, it looks for a part in the picture too.
  if (!coverOf(items, eye, p, id) && inFrame(p)) return p;
  const cand: { q: V3; d: number }[] = [];
  for (const it of items) {
    // Its own drawn pieces, glassy ones included (a cartilage is seen through, yet it is where the name points).
    if (!isOwn(it, id) || it.stream || (it.opacity ?? 1) * (it.show ?? 1) < 0.2) continue;
    const b = boundOf(it);
    // Every other vertex is plenty (rings of a tube are close together) and halves the sort.
    for (let i = 0; i < b.pos.length; i += 6) {
      const q: V3 = [b.pos[i], b.pos[i + 1], b.pos[i + 2]];
      cand.push({ q, d: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2 });
    }
  }
  cand.sort((a, b) => a.d - b.d);
  // Seen with a little room round it: a point just past another vessel's edge would still read as on that one.
  const f: V3 = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
  const fl = Math.hypot(f[0], f[1], f[2]) || 1;
  const rl = Math.hypot(f[2], f[0]) || 1;
  const right: V3 = [-f[2] / rl, 0, f[0] / rl];
  const up: V3 = [(right[1] * f[2] - right[2] * f[1]) / fl, (right[2] * f[0] - right[0] * f[2]) / fl, (right[0] * f[1] - right[1] * f[0]) / fl];
  // About 12 px on screen whatever the distance: the coarse hit meshes and the drawn outlines are a little wider.
  const ROOM = 0.012 * fl;
  const around = (q: V3): V3[] => [q, ...[right, up].flatMap((a) => [1, -1].map((k): V3 => [q[0] + a[0] * k * ROOM, q[1] + a[1] * k * ROOM, q[2] + a[2] * k * ROOM]))];
  const ok = (q: V3) => inFrame(q) && around(q).every((r) => !coverOf(items, eye, r, id, 0.12));
  const tight = (q: V3) => inFrame(q) && !coverOf(items, eye, q, id, 0.12);
  // Nearest first; farther along, the rest sampled sparsely. A thin thing lying on another (a slit along a
  // seam) never has room round it: then any point of it in sight beats a dot on what covers it.
  for (const pass of [ok, tight]) {
    for (let i = 0; i < Math.min(tries, cand.length); i++) if (pass(cand[i].q)) return cand[i].q;
    for (let i = tries; i < cand.length; i += Math.max(1, Math.floor(cand.length / 64))) if (pass(cand[i].q)) return cand[i].q;
  }
  return p;
}
