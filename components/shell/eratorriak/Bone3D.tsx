'use client';

import { BONES, BONE_FACTS } from '@/content/eratorriak/bones';
import { colourOf, nameAt, type Piece } from '@/content/eratorriak/model';
import { nameOf } from '@/content/registry';
import { orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { GEO as CALVARIA_GEO, buildCalvaria } from '@/components/scenes/week8/Calvaria3D';
import { CAL_T } from '@/components/scenes/week8/Calvaria';
import { Q } from '@/components/scenes/week8/common';
import { Loading3D } from '@/components/kit/three/Stage3D';
import { blendCamera } from '@/lib/three-d/aim';
import { blob, curve3, merge, type Mesh } from '@/lib/three-d/mesh';
import { norm, type Camera3, type V3 } from '@/lib/three-d/math';
import { useGeoReady } from '@/lib/three-d/offthread';
import { capsule, ellipsoid, smin, surfaceMesh, type SDF } from '@/lib/three-d/sdf';
import type { Item3 } from '@/lib/three-d/scene';
import { Room3D, type Frame3 } from './kit/Room3D';
import type { RoomViewState } from './kit/StudyRoom';
import { twoLines } from './kit/twoLines';
import styles from './eratorriak.module.css';

/**
 * Topic 8's room in 3D. The five views are categories, not moments, so nothing morphs between them: one
 * newborn skeleton holds every station and the camera travels between them. Vault: the simulator's
 * calvaria (week8/Calvaria3D) with its sutures and fontanelles. Base: the vault lifted off, the cartilage
 * plates on the skull's floor in the notes' order (parachordals either side of the notochord, then the
 * hypophyseal cartilages and the cranial trabeculae; at the sides the periotic capsule, the temporal wing
 * and the orbital wing). Face: the face bones from the side, the three ossicles at the ear, each with the
 * arch cartilage it comes from (Meckel's inside the see-through mandible, which is not made from it).
 * Limbs and thorax: the whole skeleton from the front. Axis: the lumbar column cut open from the front,
 * each body in two halves (the lower half of one segment over the upper half of the next), the disc's
 * nucleus with the notochord's thread in the bodies, nerves at the discs and arteries at the bodies.
 *
 * Frame (as the calvaria and the room's axis badge): x = the baby's left, y up, z forward.
 */

const N = BONES.stages.length;
const BY_KEY = new Map(BONES.pieces.map((p) => [p.key, p]));
const VIEW_OF: Record<string, number> = { vault: 0, base: 1, face: 2, limb: 3, thorax: 3, axis: 4 };
export const ownStage = (key: string) => VIEW_OF[BONE_FACTS[key].view];
/** Said in a view but drawn in another: the vault's remark that the notochord is no bone source (its nucleus is in the disc). */
const ELSEWHERE: Record<number, string[]> = { 0: ['nucleus'] };
export const piecesAt = (s: number) => {
  const said = BONES.changes[s].flatMap((c) => c.keys);
  return BONES.pieces.filter((p) => ownStage(p.key) === s || (said.includes(p.key) && !ELSEWHERE[s]?.includes(p.key))).map((p) => p.key);
};

// —— the calvaria as the simulator draws it at birth (bones grown, sutures and fontanelles open, no moulding) ——

const CAL_AT = CAL_T.side + 0.02;
let calvaria: Item3[] | null = null;
const calvariaItems = () => (calvaria ??= buildCalvaria(CAL_AT, true).scene.items);

// —— the parts the calvaria does not draw (built once, on first use) ——

interface Part {
  key: string;
  id?: string;
  mesh: Mesh;
  hit?: Mesh;
  centre: V3;
  color: string;
  tissue: Item3['tissue'];
  opacity?: number;
}
const BONE = Q.bone;
const CART = '#c9c3f0';
const NOTO = '#a855f7';
const tube = (pts: V3[], r: number | ((u: number) => number), n = 18, sides = 10) =>
  tubeParts(curve3(pts, n), { radius: typeof r === 'number' ? () => r : r, ref: [1, 0, 0], sides, capStart: true, capEnd: true });
/** A long bone: a shaft with its two ends (epiphyses) thicker. */
const longBone = (pts: V3[], r: number) =>
  tube(pts, (u) => r * (1 + 0.55 * Math.exp(-((u / 0.09) ** 2)) + 0.55 * Math.exp(-(((1 - u) / 0.09) ** 2))), 20, 12);
const ball = (c: V3, r: V3, axes?: [V3, V3, V3]) => ({ mesh: blob({ center: c, radii: r, axes, rings: 12, sides: 16 }) });
const both = (a: { mesh: Mesh; hit?: Mesh }, b: { mesh: Mesh; hit?: Mesh }) => ({
  mesh: merge([a.mesh, b.mesh]),
  hit: a.hit && b.hit ? merge([a.hit, b.hit]) : undefined,
});
const mirror = (p: V3, s: number): V3 => [p[0] * s, p[1], p[2]];
const turnedY = (a: number): [V3, V3, V3] => [norm([Math.cos(a), 0, Math.sin(a)]), [0, 1, 0], norm([-Math.sin(a), 0, Math.cos(a)])];

/** The skull's cartilage floor as the calvaria has it (an ellipsoid): its top at (x, z). */
const floorY = (x: number, z: number) => -0.42 + 0.17 * Math.sqrt(Math.max(0, 1 - (x / 0.76) ** 2 - ((z + 0.04) / 0.96) ** 2));
const onFloor = (x: number, z: number, lift = 0.02): V3 => [x, floorY(x, z) + lift, z];

/** The column: 7 cervical, 12 thoracic and 5 lumbar bodies, each with its disc below. */
interface Level {
  y: number;
  h: number;
  r: number;
  disc: number;
}
const Z_COL = -0.37;
const LEVELS: Level[] = (() => {
  const out: Level[] = [];
  let y = -0.72;
  for (const [n, pitch, r0, r1] of [
    [7, 0.075, 0.05, 0.06],
    [12, 0.105, 0.066, 0.084],
    [5, 0.125, 0.092, 0.104],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const h = pitch * 0.7;
      out.push({ y: y - h / 2, h, r: r0 + ((r1 - r0) * i) / Math.max(1, n - 1), disc: pitch - h });
      y -= pitch;
    }
  }
  return out;
})();
/** The lumbar levels the axis view cuts open (L1–L4) and the discs round them. */
const CUT_BODIES = [19, 20, 21, 22];
const CUT_DISCS = [18, 19, 20, 21, 22];
const discY = (i: number) => LEVELS[i].y - LEVELS[i].h / 2 - LEVELS[i].disc / 2;

/** A rounded cylinder along y (flattened behind), between y0 and y1; `cut` keeps only z ≤ the axis. */
const cylinder =
  (r: number, y0: number, y1: number, cut = false, inner = 0): SDF =>
  (x, y, z) => {
    const zz = z - Z_COL;
    const rr = Math.hypot(x, zz < 0 ? zz / 0.8 : zz);
    const ym = (y0 + y1) / 2;
    const dy = Math.abs(y - ym) - (y1 - y0) / 2;
    const dr = rr - r;
    let d = Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) - 0.004;
    if (inner) d = Math.max(d, inner - rr);
    return cut ? Math.max(d, zz) : d;
  };
const solid = (f: SDF, r: number, y0: number, y1: number, step = 0.012) =>
  surfaceMesh(f, [-r - 0.03, y0 - 0.03, Z_COL - r - 0.03], [r + 0.03, y1 + 0.03, Z_COL + r + 0.03], step);

/** The calvaria's face (week8/Calvaria3D), split into its bones with a narrow gap between them. */
const ORBITS = [ellipsoid([0.29, -0.21, 0.84], [0.17, 0.155, 0.2]), ellipsoid([-0.29, -0.21, 0.84], [0.17, 0.155, 0.2])];
const holes = (x: number, y: number, z: number) =>
  Math.min(ORBITS[0](x, y, z), ORBITS[1](x, y, z), ellipsoid([0, -0.45, 0.98], [0.085, 0.11, 0.15])(x, y, z));
const maxRaw: SDF = (x, y, z) =>
  smin(ellipsoid([0, -0.47, 0.72], [0.38, 0.2, 0.26])(x, y, z), ellipsoid([0, -0.29, 0.97], [0.075, 0.13, 0.07])(x, y, z), 0.04);
const zygRaw: SDF = (x, y, z) => {
  const ax = Math.abs(x);
  return smin(
    ellipsoid([0.42, -0.34, 0.62], [0.14, 0.12, 0.17])(ax, y, z),
    capsule([0.48, -0.37, 0.5], [0.7, -0.39, 0.06], 0.045)(ax, y, z),
    0.07,
  );
};
const maxF: SDF = (x, y, z) => Math.max(maxRaw(x, y, z), -holes(x, y, z));
const zygF: SDF = (x, y, z) => Math.max(zygRaw(x, y, z), 0.012 - maxRaw(x, y, z), -holes(x, y, z));
const browF: SDF = (x, y, z) =>
  Math.max(ellipsoid([0, -0.2, 0.76], [0.58, 0.16, 0.26])(x, y, z), 0.012 - maxRaw(x, y, z), 0.012 - zygRaw(x, y, z), -holes(x, y, z));
const mandF: SDF = (x, y, z) => {
  const jaw = Math.max(ellipsoid([0, -0.74, 0.56], [0.4, 0.1, 0.36])(x, y, z), -ellipsoid([0, -0.72, 0.4], [0.32, 0.2, 0.34])(x, y, z));
  return smin(jaw, capsule([0.37, -0.74, 0.3], [0.56, -0.5, 0.08], 0.055)(Math.abs(x), y, z), 0.05);
};

let parts: Part[] | null = null;
function buildParts(): Part[] {
  const out: Part[] = [];
  const add = (
    key: string,
    id: string | undefined,
    m: { mesh: Mesh; hit?: Mesh },
    centre: V3,
    color: string,
    tissue: Item3['tissue'],
    opacity?: number,
  ) => out.push({ key, id, mesh: m.mesh, hit: m.hit, centre, color, tissue, opacity });

  // — The base: the cartilage plates on the floor, posterior to anterior (the notes' order). —
  const FM: V3 = onFloor(0, -0.62, 0.004);
  add('nk:foramen', undefined, ball(FM, [0.09, 0.008, 0.085]), FM, '#2a2230', 'bone');
  const noto = [[0, -0.74, -0.6] as V3, onFloor(0, -0.5, 0.0), onFloor(0, -0.25, 0.01), onFloor(0, -0.06, 0.01)];
  add('nk:noto', 'notokorda', tube(noto, 0.016, 16), noto[2], NOTO, 'neural');
  for (const s of [1, -1]) {
    const t = s > 0 ? 'l' : 'r';
    // The first cervical sclerotome's share, round the front of the foramen magnum; the occipital somites' in front of it.
    const rim = [0.2, 0.75, 1.3].map((a) => onFloor(s * 0.12 * Math.sin(a), -0.62 + 0.12 * Math.cos(a), 0.03));
    add(`k:parNeck-${t}`, 'okzipitalaren-oinaldea', tube(rim, 0.032, 12), rim[1], BONE, 'cartilage');
    const po = onFloor(s * 0.1, -0.3, 0.03);
    add(`k:parOcc-${t}`, 'okzipitalaren-oinaldea', ball(po, [0.075, 0.035, 0.16]), po, BONE, 'cartilage');
    const hy = onFloor(s * 0.07, 0.03, 0.03);
    add(`k:hyp-${t}`, 'esfenoidesaren-gorputza', ball(hy, [0.055, 0.035, 0.07]), hy, BONE, 'cartilage');
    const tr = [onFloor(s * 0.06, 0.12, 0.03), onFloor(s * 0.045, 0.34, 0.03), onFloor(s * 0.03, 0.56, 0.03)];
    add(`k:trab-${t}`, 'etmoidesa', tube(tr, 0.03, 12), tr[1], BONE, 'cartilage');
    const lw = onFloor(s * 0.26, 0.24, 0.025);
    add(`k:lw-${t}`, 'esfenoidesaren-hego-txikia', ball(lw, [0.16, 0.025, 0.075], turnedY(s * 0.35)), lw, BONE, 'cartilage');
    const gw = onFloor(s * 0.25, -0.01, 0.03);
    add(`k:gw-${t}`, 'esfenoidesaren-hego-handia', ball(gw, [0.13, 0.03, 0.085], turnedY(-s * 0.3)), gw, BONE, 'cartilage');
    const ot = onFloor(s * 0.37, -0.28, 0.05);
    add(`k:otic-${t}`, 'harkaitza', ball(ot, [0.18, 0.07, 0.095], turnedY(-s * 0.6)), ot, BONE, 'cartilage');
  }

  // — The face from the side: its bones (carved from the calvaria's own face), the ossicles and the arch cartilages. —
  const face = (f: SDF, lo: V3, hi: V3) => ({ mesh: surfaceMesh(f, lo, hi, 0.022) });
  add('f:max', 'goiko-maxilarra', face(maxF, [-0.44, -0.72, 0.4], [0.44, -0.12, 1.08]), [0.26, -0.52, 0.82], BONE, 'bone');
  add('f:zyg', 'hezur-malarra', face(zygF, [-0.78, -0.52, -0.02], [0.78, -0.18, 0.84]), [0.5, -0.34, 0.6], BONE, 'bone');
  add('f:brow', undefined, face(browF, [-0.64, -0.4, 0.46], [0.64, -0.0, 1.06]), [0.3, -0.12, 0.9], BONE, 'bone');
  // The mandible: see-through, so Meckel's cartilage shows inside it (it forms round the cartilage, not from it).
  add('f:mand', 'beheko-maxilarra', face(mandF, [-0.64, -0.88, -0.02], [0.64, -0.4, 0.96]), [0.42, -0.74, 0.34], BONE, 'bone', 0.5);
  for (const s of [1, -1]) {
    const t = s > 0 ? 'l' : 'r';
    const M = (p: V3) => mirror(p, s);
    // The ossicles, drawn larger than life (×1.8 about the ear), in front of a dark middle-ear recess.
    const E: V3 = [0.8, -0.5, 0.0];
    const O = (d: V3): V3 => M([E[0] + d[0] * 1.8, E[1] + d[1] * 1.8, E[2] + d[2] * 1.8]);
    add(`o:cave-${t}`, undefined, ball(M([0.79, -0.53, -0.005]), [0.02, 0.15, 0.13]), M([0.79, -0.53, 0]), '#1a1216', 'bone');
    const mHead = O([0.004, 0.03, 0.035]);
    add(
      `o:mall-${t}`,
      'mailua',
      both(
        ball(mHead, [0.022, 0.028, 0.024]),
        tube([O([0.004, 0.012, 0.036]), O([0.008, -0.03, 0.046]), O([0.012, -0.072, 0.056])], (u) => 0.011 * (1 - 0.45 * u), 12),
      ),
      mHead,
      BONE,
      'bone',
    );
    const iBody = O([0.006, 0.032, -0.008]);
    add(
      `o:inc-${t}`,
      'ingudea',
      both(
        both(
          ball(iBody, [0.02, 0.026, 0.022]),
          tube([O([0.006, 0.04, -0.016]), O([0.004, 0.044, -0.05])], (u) => 0.01 * (1 - 0.5 * u), 6),
        ),
        tube([O([0.008, 0.016, -0.016]), O([0.01, -0.025, -0.02]), O([0.008, -0.048, -0.01])], (u) => 0.009 * (1 - 0.3 * u), 10),
      ),
      iBody,
      BONE,
      'bone',
    );
    const sMid = O([0.002, -0.07, -0.02]);
    add(
      `o:stap-${t}`,
      'ointokia',
      both(
        tube(
          [
            O([0.007, -0.052, -0.006]),
            O([0.002, -0.066, -0.038]),
            O([-0.002, -0.09, -0.03]),
            O([-0.002, -0.084, 0.0]),
            O([0.007, -0.052, -0.006]),
          ],
          0.006,
          16,
        ),
        ball(O([-0.003, -0.092, -0.015]), [0.006, 0.01, 0.022]),
      ),
      sMid,
      BONE,
      'bone',
    );
    // Meckel's cartilage, from the malleus up the ramus and along the inside of the jaw to the chin.
    const meckel = [
      O([0.012, -0.07, 0.056]),
      M([0.66, -0.56, 0.08]),
      M([0.5, -0.64, 0.16]),
      M([0.36, -0.74, 0.32]),
      M([0.31, -0.75, 0.52]),
      M([0.18, -0.75, 0.72]),
      M([0.02, -0.75, 0.83]),
    ];
    add(`c:meckel-${t}`, 'meckel-kartilagoa', tube(meckel, 0.02, 28), meckel[4], CART, 'cartilage');
    // Reichert's (the 2nd arch) from the stapes down behind the jaw; the palatopterygoquadrate bar (the 1st arch's dorsal part) from the incus forward.
    const reich = [O([-0.002, -0.09, -0.04]), M([0.72, -0.68, -0.04]), M([0.58, -0.82, 0.04]), M([0.44, -0.9, 0.16])];
    add(`c:reichert-${t}`, 'reichert-kartilagoa', tube(reich, 0.018, 18), reich[2], CART, 'cartilage');
    const pq = [O([0.004, 0.044, -0.05]), M([0.7, -0.45, 0.08]), M([0.6, -0.47, 0.24]), M([0.48, -0.48, 0.4])];
    add(`c:pq-${t}`, 'barra-pterigopalatino-karratua', tube(pq, 0.018, 16), pq[2], CART, 'cartilage');
  }

  // — The trunk: column, ribs and sternum, the girdles and the limbs. —
  LEVELS.forEach((L, i) => {
    const top = L.y + L.h / 2;
    const bot = L.y - L.h / 2;
    add(
      `s:v${i}u`,
      'orno-gorputza',
      { mesh: solid(cylinder(L.r, L.y + 0.003, top), L.r, L.y, top) },
      [L.r * 0.6, (L.y + top) / 2, Z_COL],
      BONE,
      'bone',
    );
    add(
      `s:v${i}d`,
      'orno-gorputza',
      { mesh: solid(cylinder(L.r, bot, L.y - 0.003), L.r, bot, L.y) },
      [L.r * 0.6, (L.y + bot) / 2, Z_COL],
      BONE,
      'bone',
    );
    // The arch round the canal and its spine (not a piece of the room: quiet bone).
    const r = L.r;
    const arch = [
      [0.75, -0.55],
      [0.85, -1.4],
      [0.3, -1.9],
      [0, -2.0],
      [-0.3, -1.9],
      [-0.85, -1.4],
      [-0.75, -0.55],
    ].map(([x, z]) => [x * r, L.y, Z_COL + z * r] as V3);
    const spine = [
      [0, L.y, Z_COL - 2.0 * r],
      [0, L.y - 0.35 * r, Z_COL - 2.7 * r],
    ] as V3[];
    add(`s:arch${i}`, undefined, both(tube(arch, r * 0.17, 16), tube(spine, r * 0.15, 6)), [0, L.y, Z_COL - 2 * r], BONE, 'bone');
    if (i < LEVELS.length - 1) {
      const y = discY(i);
      const rd = (L.r + LEVELS[i + 1].r) / 2;
      add(
        `s:disc${i}`,
        'eraztun-fibrosoa',
        { mesh: solid(cylinder(rd, y - L.disc / 2 + 0.003, y + L.disc / 2 - 0.003), rd, y - L.disc / 2, y + L.disc / 2) },
        [rd * 0.8, y, Z_COL],
        '#d8e2ee',
        'membrane',
      );
    }
  });
  const sacrum: V3 = [0, -3.36, Z_COL + 0.02];
  add('s:sacrum', undefined, ball(sacrum, [0.15, 0.24, 0.075], [[1, 0, 0], norm([0, 1, 0.35]), norm([0, -0.35, 1])]), sacrum, BONE, 'bone');

  // Ribs: from each thoracic body round the chest to the front; bone behind, cartilage in front.
  const T0 = 7;
  const ENDS = [-1.43, -1.56, -1.67, -1.77, -1.87, -1.96, -2.05, -2.17, -2.28, -2.39, -2.62, -2.8];
  const AX = [0.3, 0.4, 0.47, 0.52, 0.56, 0.58, 0.59, 0.59, 0.57, 0.54, 0.49, 0.43];
  const CARTF = [0.14, 0.16, 0.19, 0.21, 0.23, 0.26, 0.29, 0.3, 0.3, 0.3, 0.14, 0.12];
  const sternumZ = (y: number) => 0.3 + (-1.38 - y) * 0.25;
  for (let k = 0; k < 12; k++) {
    const L = LEVELS[T0 + k];
    const ax = AX[k];
    const front = k < 10;
    const xEnd = k < 7 ? 0.06 : k < 10 ? 0.12 + 0.07 * (k - 7) : 0;
    const zEnd = front ? sternumZ(Math.max(-2.12, ENDS[k])) - (k < 7 ? 0 : 0.03 * (k - 6)) : 0;
    const az = front ? (zEnd - Z_COL) / 1.88 : 0.36;
    const zc = Z_COL + 0.9 * az;
    const f0 = Math.asin(Math.min(1, (L.r + 0.03) / ax));
    const f1 = front ? Math.PI - Math.asin(Math.min(1, xEnd / ax)) : 1.75;
    const fc = f1 - (f1 - f0) * CARTF[k];
    for (const s of [1, -1]) {
      const t = s > 0 ? 'l' : 'r';
      const at = (f: number): V3 => {
        const u = (f - f0) / (f1 - f0);
        return [s * ax * Math.sin(f), L.y + (ENDS[k] - L.y) * (u * (1.3 - 0.3 * u)), zc - az * Math.cos(f)];
      };
      const path = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, j) => at(a + ((b - a) * j) / n));
      const rr = 0.018 + (0.004 * Math.min(k, 6)) / 6;
      add(`s:rib${k}-${t}`, 'saihets-hezurra', tube(path(f0, fc, 10), rr, 30), at((f0 + fc) * 0.5), BONE, 'bone');
      add(`s:cc${k}-${t}`, 'saihets-kartilagoa', tube(path(fc - 0.02, f1, 4), rr * 0.95, 12), at((fc + f1) / 2), '#d9dcef', 'cartilage');
    }
  }
  // The sternum: manubrium, body and xiphoid (fused from the parietal layer's cartilages).
  const st = (y: number): V3 => [0, y, sternumZ(y)];
  const manub = st(-1.47);
  const body = st(-1.83);
  const xiph = st(-2.15);
  const tilt: [V3, V3, V3] = [[1, 0, 0], norm([0, 1, -0.25]), norm([0, 0.25, 1])];
  add('s:sternM', 'kirtena', ball(manub, [0.085, 0.095, 0.03], tilt), manub, BONE, 'bone');
  add('s:sternB', 'esternoi-barrak', ball(body, [0.06, 0.25, 0.028], tilt), body, BONE, 'bone');
  add('s:sternX', 'apofisi-xifoidea', ball(xiph, [0.03, 0.065, 0.02], tilt), xiph, BONE, 'bone');

  for (const s of [1, -1]) {
    const t = s > 0 ? 'l' : 'r';
    const M = (p: V3) => mirror(p, s);
    // The shoulder girdle (not in the notes' list: quiet).
    add(
      `s:clav-${t}`,
      undefined,
      tube([M([0.06, -1.37, 0.31]), M([0.36, -1.3, 0.24]), M([0.66, -1.3, -0.02])], 0.022, 12),
      M([0.36, -1.3, 0.24]),
      BONE,
      'bone',
    );
    add(
      `s:scap-${t}`,
      undefined,
      ball(M([0.42, -1.62, -0.52]), [0.2, 0.26, 0.03], turnedY(-s * 0.38)),
      M([0.42, -1.62, -0.52]),
      BONE,
      'bone',
    );
    // The upper limb, palms forward: humerus, radius (thumb side) and ulna, the hand's rays.
    const S = M([0.68, -1.38, -0.12]);
    const E = M([0.79, -2.22, -0.18]);
    const W = M([0.84, -2.95, -0.04]);
    const arm = [
      longBone([S, M([0.75, -1.8, -0.17]), E], 0.042),
      longBone([M([0.82, -2.24, -0.15]), M([0.87, -2.6, -0.1]), M([0.88, -2.94, -0.02])], 0.024),
      longBone([M([0.76, -2.21, -0.22]), M([0.78, -2.6, -0.14]), M([0.8, -2.95, -0.07])], 0.026),
      ...[-0.06, -0.03, 0, 0.03, 0.065].map((dx, j) =>
        longBone(
          [
            M([0.84 + dx * 0.4, -3.0, -0.03 + j * 0.005]),
            M([0.84 + dx, -3.17, 0 + (j === 4 ? 0.04 : 0)]),
            M([0.84 + dx * 1.15, -(3.3 - (j === 4 ? 0.1 : 0)), 0.02 + (j === 4 ? 0.06 : 0)]),
          ],
          0.013,
        ),
      ),
    ];
    add(
      `s:upper-${t}`,
      'gorputz-adarretako-hezurrak',
      { mesh: merge(arm.map((m) => m.mesh)), hit: merge(arm.map((m) => m.hit)) },
      M([0.75, -1.8, -0.17]),
      BONE,
      'bone',
    );
    // The pelvic girdle: the iliac wing and the ring of pubis and ischium round to the symphysis.
    const il = M([0.26, -3.24, -0.2]);
    const ring = [
      M([0.2, -3.38, -0.12]),
      M([0.24, -3.6, -0.06]),
      M([0.15, -3.68, 0.1]),
      M([0.03, -3.6, 0.19]),
      M([0.12, -3.47, 0.12]),
      M([0.21, -3.4, 0.0]),
    ];
    add(
      `s:pelvis-${t}`,
      'gerriko-hezurrak',
      both(ball(il, [0.05, 0.2, 0.19], turnedY(s * 0.45)), tube(ring, 0.032, 18)),
      M([0.3, -3.2, -0.14]),
      BONE,
      'bone',
    );
    // The lower limb, knee forward: femur, tibia and fibula, the foot's rays (big toe inward).
    const H = M([0.26, -3.5, 0.02]);
    const K = M([0.29, -4.55, 0.08]);
    const leg = [
      longBone([H, M([0.3, -4.0, 0.0]), K], 0.052),
      longBone([M([0.27, -4.6, 0.09]), M([0.28, -5.0, 0.04]), M([0.29, -5.42, 0.0])], 0.037),
      longBone([M([0.35, -4.62, 0.02]), M([0.36, -5.0, -0.02]), M([0.36, -5.4, -0.04])], 0.019),
      ...[-0.07, -0.035, 0, 0.035, 0.065].map((dx, j) =>
        longBone(
          [M([0.31 + dx * 0.3, -5.5, -0.04]), M([0.31 + dx * 0.8, -5.57, 0.18]), M([0.31 + dx, -5.6, 0.36 - j * 0.025])],
          j === 0 ? 0.019 : 0.014,
        ),
      ),
    ];
    add(
      `s:lower-${t}`,
      'gorputz-adarretako-hezurrak',
      { mesh: merge(leg.map((m) => m.mesh)), hit: merge(leg.map((m) => m.hit)) },
      M([0.3, -4.0, 0.0]),
      BONE,
      'bone',
    );
  }

  // — The axis view: the cut lumbar levels (front halves away), nucleus and notochord, nerves and arteries. —
  for (const i of CUT_BODIES) {
    const L = LEVELS[i];
    const top = L.y + L.h / 2;
    const bot = L.y - L.h / 2;
    add(
      `a:v${i}u`,
      'orno-gorputza',
      { mesh: solid(cylinder(L.r, L.y + 0.003, top, true), L.r, L.y, top) },
      [L.r * 0.55, (L.y + top) / 2, Z_COL],
      BONE,
      'bone',
    );
    add(
      `a:v${i}d`,
      'orno-gorputza',
      { mesh: solid(cylinder(L.r, bot, L.y - 0.003, true), L.r, bot, L.y) },
      [L.r * 0.55, (L.y + bot) / 2, Z_COL],
      BONE,
      'bone',
    );
    // What is left of the notochord in a body: a thread, fading.
    add(
      `a:noto${i}`,
      'notokorda',
      tube(
        [
          [0, top, Z_COL - 0.004],
          [0, bot, Z_COL - 0.004],
        ],
        0.007,
        6,
      ),
      [0, L.y - L.h * 0.25, Z_COL],
      NOTO,
      'neural',
      0.55,
    );
    // The segmental artery round the body's middle, where the two halves meet (the old segment border).
    for (const s of [1, -1]) {
      const t = s > 0 ? 'l' : 'r';
      const r = L.r;
      const art = [
        [0.72, 0.42],
        [0.98, 0.0],
        [1.02, -0.45],
        [0.85, -0.85],
      ].map(([x, z]) => [s * x * r, L.y, Z_COL + z * r] as V3);
      add(`a:art${i}-${t}`, 'segmentu-arteko-arteriak', tube(art, 0.008, 12, 8), art[1], Q.vessel, 'vessel');
    }
  }
  for (const i of CUT_DISCS) {
    const L = LEVELS[i];
    const y = discY(i);
    const rd = (L.r + LEVELS[i + 1].r) / 2;
    const y0 = y - L.disc / 2 + 0.003;
    const y1 = y + L.disc / 2 - 0.003;
    add(
      `a:ann${i}`,
      'eraztun-fibrosoa',
      { mesh: solid(cylinder(rd, y0, y1, true, rd * 0.45), rd, y0, y1, 0.008) },
      [rd * 0.75, y, Z_COL],
      '#d8e2ee',
      'membrane',
    );
    add(
      `a:nuc${i}`,
      'gune-pulposoa',
      { mesh: solid(cylinder(rd * 0.45, y0 + 0.004, y1 - 0.004, true), rd * 0.45, y0, y1, 0.006) },
      [0, y, Z_COL],
      NOTO,
      'mesenchyme',
    );
    // The spinal nerve leaves at the disc's level.
    for (const s of [1, -1]) {
      const t = s > 0 ? 'l' : 'r';
      const nv = [
        [s * 0.05, y, Z_COL - rd * 1.25],
        [s * rd * 1.15, y - 0.01, Z_COL - rd * 1.2],
        [s * rd * 2.2, y - 0.05, Z_COL - rd * 0.6],
      ] as V3[];
      add(`a:nerve${i}-${t}`, 'nerbio-espinala', tube(nv, 0.009, 12, 8), nv[2], '#f5d142', 'nerve');
    }
  }
  return out;
}

// —— which item is which piece, view by view ——

const CAL_OF: Record<string, (s: number) => string[]> = {
  'bone-FL': (s) => (s === 0 ? ['frontal'] : []),
  'bone-FR': (s) => (s === 0 ? ['frontal'] : []),
  'bone-PL': (s) => (s === 0 ? ['parietal'] : []),
  'bone-PR': (s) => (s === 0 ? ['parietal'] : []),
  'bone-OC': (s) => (s === 0 ? ['occScale'] : []),
  'bone-TL': (s) => (s === 0 || s === 2 ? ['tempScale'] : []),
  'bone-TR': (s) => (s === 0 || s === 2 ? ['tempScale'] : []),
};
const PART_OF: Record<string, string> = {
  parNeck: 'occBaseNeck',
  parOcc: 'occBaseOcc',
  hyp: 'hypophyseal',
  trab: 'trabeculae',
  lw: 'lesserWing',
  gw: 'greaterWing',
  otic: 'otic',
  max: 'maxilla',
  zyg: 'zygoma',
  mand: 'mandible',
  mall: 'malleus',
  meckel: 'malleus',
  inc: 'incus',
  pq: 'incus',
  stap: 'stapes',
  reichert: 'stapes',
  upper: 'upper',
  lower: 'lower',
  pelvis: 'pelvis',
  sternM: 'sternum',
  sternB: 'sternum',
  sternX: 'sternum',
};
const STATION: Record<string, number> = { k: 1, f: 2, o: 2, c: 2 };
/** The room pieces an item stands for in a view. */
export function piecesOf(key: string, s: number): string[] {
  const [kind, rest = ''] = key.split(':');
  if (kind === 'cal') return CAL_OF[rest]?.(s) ?? [];
  const base = rest.replace(/-[lr]$/, '');
  if (kind in STATION) return s === STATION[kind] && PART_OF[base] ? [PART_OF[base]] : [];
  if (kind === 's') {
    if (s === 3) {
      if (/^rib\d+$/.test(base)) return ['ribBone'];
      if (/^cc\d+$/.test(base)) return ['ribCart'];
      return PART_OF[base] ? [PART_OF[base]] : [];
    }
    if (s === 4) {
      if (/^v\d+u$/.test(base)) return ['vertebraCaudal'];
      if (/^v\d+d$/.test(base)) return ['vertebraCranial'];
      if (/^disc\d+$/.test(base)) return ['annulus'];
    }
    return [];
  }
  if (kind === 'a' && s === 4) {
    if (/^v\d+u$/.test(base)) return ['vertebraCaudal'];
    if (/^v\d+d$/.test(base)) return ['vertebraCranial'];
    if (/^ann\d+$/.test(base)) return ['annulus'];
    if (/^nuc\d+$/.test(base)) return ['nucleus'];
    if (/^noto\d+$/.test(base)) return ['notoBody'];
  }
  return [];
}
export const isOf = (piece: string, it: Item3, s: number) => piecesOf(it.key.replace(/~\d+$/, ''), s).includes(piece);

const levelOf = (rest: string) => Number(rest.match(/^(?:v|disc)(\d+)/)?.[1] ?? -1);
/** How much of each part a view shows (0..1). */
function shown(key: string, s: number): number {
  const [kind, rest = ''] = key.split(':');
  if (kind === 'cal') {
    // The floor stays under the base's plates; the face gives way to its bones; the vault lifts off for the base.
    if (rest === 'base' || rest === 'ear') return 1;
    if (rest === 'face') return s === 2 ? 0 : 1;
    return s === 1 ? 0 : 1;
  }
  if (kind === 'k' || kind === 'nk') return s === 1 ? 1 : 0;
  if (kind === 'f' || kind === 'o' || kind === 'c') return s === 2 ? 1 : 0;
  if (kind === 'a') return s === 4 ? 1 : 0;
  if (kind === 's' && s === 4) {
    // Only the column in the axis view (the limbs and the ribs would stand in front of it).
    if (!/^(v\d|disc|arch|sacrum)/.test(rest)) return 0;
    const i = levelOf(rest);
    if (rest.startsWith('v') && CUT_BODIES.includes(i)) return 0;
    if (rest.startsWith('disc') && CUT_DISCS.includes(i)) return 0;
  }
  return 1;
}

const CAMS: Camera3[] = [
  orbit(56, 30, 5.4, [0, 0.05, 0]),
  orbit(180, 56, 4.2, [0, -0.3, -0.3]),
  orbit(60, 6, 3.3, [0.32, -0.5, 0.3]),
  orbit(16, 6, 12.6, [0, -2.45, 0]),
  orbit(24, 8, 2.3, [0.02, -2.86, Z_COL]),
];

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => x * x * (3 - 2 * x);

export interface BoneFrame {
  items: Item3[];
  pts: Record<string, V3>;
  camera: Camera3;
  stage: number;
  /** Where each part is (its middle), by item key. */
  centres: Record<string, V3>;
}

/** The world at u (between two views only the camera travels and the parts cross-fade). */
export function boneFrame(u: number, mode: Parameters<typeof colourOf>[1]): BoneFrame {
  const i = Math.max(0, Math.min(N - 1, Math.floor(u)));
  const j = Math.min(N - 1, i + 1);
  const e = ease(Math.max(0, Math.min(1, u - i)));
  const stage = Math.round(u);
  const col = (k: string) => {
    const c = colourOf(BY_KEY.get(k)!, mode, BONES);
    // The body's two halves share source and fate: the lower one (the next segment's upper half) is lighter.
    return k === 'vertebraCranial' ? mixHex(c, '#ffffff', 0.42) : c;
  };
  const colourAt = (key: string, s: number) => {
    const ps = piecesOf(key, s);
    // The arch cartilages keep their own colour (cartilage, not the bone that comes from it).
    return ps.length && !key.startsWith('c:') ? col(ps[0]) : null;
  };
  const items: Item3[] = [];
  const centres: Record<string, V3> = {};
  const push = (it: Item3) => {
    const show = (it.show ?? 1) * lerp(shown(it.key, i), shown(it.key, j), e);
    if (show <= 0.01) return;
    const a = colourAt(it.key, i);
    const b = colourAt(it.key, j);
    // A part named only in the next view keeps its own colour until the glide starts.
    const c = a || b ? mixHex(a ?? it.color, b ?? it.color, e) : null;
    items.push(c && (a || e > 0.001) ? { ...it, show, quiet: false, color: c, deep: mixHex(c, '#000000', 0.55) } : { ...it, show });
  };

  // The floor (the calvaria's cartilage) in a quiet bone tone: the base view's plates stand on it.
  for (const it of calvariaItems())
    push(
      it.key === 'base' ? { ...it, key: 'cal:base', color: '#e6dcc4', deep: '#9a8c6c', tissue: 'bone' } : { ...it, key: `cal:${it.key}` },
    );
  parts ??= buildParts();
  for (const p of parts) {
    centres[p.key] = p.centre;
    push({
      key: p.key,
      id: p.id,
      mesh: p.mesh,
      hit: p.hit,
      color: p.color,
      deep: mixHex(p.color, '#000000', 0.55),
      tissue: p.tissue,
      opacity: p.opacity,
      quiet: !p.id,
    });
  }

  const seen = new Map<string, number>();
  for (const it of items) {
    const n = seen.get(it.key) ?? 0;
    seen.set(it.key, n + 1);
    if (n) it.key = `${it.key}~${n}`;
  }
  return { items, pts: {}, camera: blendCamera(CAMS[i], CAMS[j], e), stage, centres };
}

/** Where each piece's name points in its view (on the side the camera faces). */
const POINT: Record<string, (f: BoneFrame) => V3 | undefined> = {
  frontal: () => onBone('bone-FL'),
  parietal: () => onBone('bone-PL'),
  occScale: () => onBone('bone-OC', [0.35, 0, 0]),
  tempScale: () => onBone('bone-TL'),
  // From behind the embryo's right is on the screen's right.
  occBaseOcc: (f) => f.centres['k:parOcc-r'],
  occBaseNeck: (f) => f.centres['k:parNeck-r'],
  hypophyseal: (f) => f.centres['k:hyp-r'],
  trabeculae: (f) => f.centres['k:trab-r'],
  otic: (f) => f.centres['k:otic-r'],
  greaterWing: (f) => f.centres['k:gw-r'],
  lesserWing: (f) => f.centres['k:lw-r'],
  maxilla: (f) => f.centres['f:max'],
  zygoma: (f) => f.centres['f:zyg'],
  mandible: (f) => f.centres['f:mand'],
  malleus: (f) => f.centres['o:mall-l'],
  incus: (f) => f.centres['o:inc-l'],
  stapes: (f) => f.centres['o:stap-l'],
  upper: (f) => f.centres['s:upper-l'],
  lower: (f) => f.centres['s:lower-l'],
  pelvis: (f) => f.centres['s:pelvis-l'],
  ribBone: (f) => f.centres['s:rib5-l'],
  ribCart: (f) => f.centres['s:cc4-l'],
  sternum: (f) => f.centres['s:sternB'],
  vertebraCaudal: (f) => f.centres['a:v20u'],
  vertebraCranial: (f) => f.centres['a:v21d'],
  annulus: (f) => f.centres['a:ann20'],
  nucleus: (f) => f.centres['a:nuc20'],
  notoBody: (f) => f.centres['a:noto21'],
};

/** A point on a vault bone's outer face, near its middle (nudged sideways by `lean`, towards the camera). */
const vaultPoints = new Map<string, V3>();
function onBone(key: string, lean: V3 = [0, 0, 0]): V3 | undefined {
  const k = `${key}${lean.join()}`;
  if (vaultPoints.has(k)) return vaultPoints.get(k);
  const it = calvariaItems().find((x) => x.key === key);
  if (!it) return undefined;
  const m = it.mesh.pos;
  const O: V3 = [0, -0.05, 0];
  let c: V3 = [0, 0, 0];
  for (let q = 0; q < m.length; q += 3) c = [c[0] + m[q], c[1] + m[q + 1], c[2] + m[q + 2]];
  const n = m.length / 3;
  const d = norm([c[0] / n - O[0] + lean[0], c[1] / n - O[1] + lean[1], c[2] / n - O[2] + lean[2]]);
  let best = 0;
  let p: V3 = O;
  for (let q = 0; q < m.length; q += 3) {
    const v = (m[q] - O[0]) * d[0] + (m[q + 1] - O[1]) * d[1] + (m[q + 2] - O[2]) * d[2];
    if (v > best) {
      best = v;
      p = [m[q], m[q + 1], m[q + 2]];
    }
  }
  vaultPoints.set(k, p);
  return p;
}

/** A piece's name point and the id of a drawn item of it, in the view f shows. */
export function anchorOf(piece: string, f: BoneFrame): { p: V3; id: string } | null {
  const own = f.items.filter((it) => it.id && (it.show ?? 1) > 0.3 && isOf(piece, it, f.stage));
  if (!own.length) return null;
  const p = POINT[piece]?.(f);
  const id3 = BY_KEY.get(piece)?.id3;
  return p ? { p, id: (own.find((it) => it.id === id3) ?? own[0]).id! } : null;
}

/** Names the views give besides the pieces: the notochord between the parachordals; the arch cartilages; nerves and arteries. */
function contextNames(f: BoneFrame): CalloutSpec[] {
  const at = (key: string, id: string): CalloutSpec[] =>
    f.centres[key] ? [{ id, p: f.centres[key], show: 1, text: nameOf(id), small: true }] : [];
  if (f.stage === 1) return at('nk:noto', 'notokorda');
  if (f.stage === 2)
    return [
      ...at('c:meckel-l', 'meckel-kartilagoa'),
      ...at('c:reichert-l', 'reichert-kartilagoa'),
      ...at('c:pq-l', 'barra-pterigopalatino-karratua'),
    ];
  if (f.stage === 4) return [...at('a:nerve20-l', 'nerbio-espinala'), ...at('a:art21-l', 'segmentu-arteko-arteriak')];
  return [];
}

function Bone3DView(state: RoomViewState) {
  const { mode, lit, names } = state;
  const frame = (u: number): Frame3 => {
    const f = boneFrame(u, mode);
    const { stage } = f;
    const items = lit.size
      ? f.items.map((it) => ([...lit].some((k) => isOf(k, it, stage)) ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 }))
      : f.items;
    const said = new Set(BONES.changes[stage].flatMap((c) => c.keys));
    const here = piecesAt(stage);
    const pick: Piece[] =
      names === 'gabe'
        ? []
        : lit.size
          ? BONES.pieces.filter((p) => lit.has(p.key))
          : names === 'guztiak'
            ? BONES.pieces.filter((p) => here.includes(p.key))
            : BONES.pieces.filter((p) => said.has(p.key) && here.includes(p.key));
    const out: CalloutSpec[] = names === 'gabe' || lit.size ? [] : contextNames(f);
    for (const p of pick) {
      const a = anchorOf(p.key, f);
      if (a) out.push({ id: a.id, p: a.p, show: 1, ...twoLines(nameAt(p, stage)), key: p.key, small: true });
    }
    return { items, pts: f.pts, camera: f.camera, names: out };
  };
  return <Room3D state={state} frame={frame} continuity="eratorriak-8" label="Hezurren 3D eredua" />;
}

/** The calvaria is built off the main thread first. */
export function Bone3D(state: RoomViewState) {
  return useGeoReady([CALVARIA_GEO]) ? (
    <Bone3DView {...state} />
  ) : (
    <div className={styles.view3d}>
      <svg viewBox="0 0 1000 640" className={styles.svg3d}>
        <Loading3D />
      </svg>
    </div>
  );
}
