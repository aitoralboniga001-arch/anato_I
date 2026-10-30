'use client';

import { MUSCLES, MUSCLE_FACTS } from '@/content/eratorriak/muscles';
import { colourOf, nameAt, type Piece } from '@/content/eratorriak/model';
import { nameOf } from '@/content/registry';
import { orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { POSE0, heartModel, mixHex, tubeParts, type HeartPose } from '@/components/scenes/week10/model3d';
import { GEO as DOMAINS_GEO, buildDomains } from '@/components/scenes/week9/Domains3D';
import { EMBRYO5, axisAt, embryo5 } from '@/lib/three-d/embryo5';
import { Loading3D } from '@/components/kit/three/Stage3D';
import { blendCamera } from '@/lib/three-d/aim';
import { blob, curve3, type Mesh } from '@/lib/three-d/mesh';
import { mulM, type Camera3, type M4, type V3 } from '@/lib/three-d/math';
import { useGeoReady } from '@/lib/three-d/offthread';
import { surfaceAlong } from '@/lib/three-d/sdf';
import type { Item3 } from '@/lib/three-d/scene';
import { Room3D, type Frame3 } from './kit/Room3D';
import { twoLines } from './kit/twoLines';
import type { RoomViewState } from './kit/StudyRoom';
import styles from './eratorriak.module.css';

/**
 * Topic 9's room in 3D. The room's five views are categories, not moments, so nothing morphs between
 * them: one 5-week embryo (lib/three-d/embryo5) holds every station and the camera travels between
 * them. Types: the embryo seen through, with the gut and the aorta in the trunk block, the eye, the
 * mammary ridge, the sweat glands and the heart. Head: the pharyngeal arches, the eye muscles' primordia,
 * the larynx's arches and the hypoglossal cord. Domains: the simulator's trunk block (week9/Domains3D)
 * at its place in the trunk, with a spinal nerve's dorsal and ventral rami. Patterns: the same arches
 * as the neural crest's connective pattern, and the parietal layer with the limb buds as the body's.
 * Cardiac: the looped heart in the heart bulge, with its conduction system.
 */

const N = MUSCLES.stages.length;
const BY_KEY = new Map(MUSCLES.pieces.map((p) => [p.key, p]));
/** The view each piece belongs to (the table's own sorting), and what each view says. */
const VIEW_OF: Record<string, number> = { head: 1, body: 2, patterns: 3, cardiac: 4, other: 0 };
export const ownStage = (key: string) => VIEW_OF[MUSCLE_FACTS[key].view];
export const piecesAt = (s: number) => {
  const said = MUSCLES.changes[s].flatMap((c) => c.keys);
  return MUSCLES.pieces.filter((p) => ownStage(p.key) === s || said.includes(p.key)).map((p) => p.key);
};

// —— the embryo's places (lib/three-d/embryo5: x lateral, the body curled in the y–z plane) ——

/** A point by angle along the body axis, `out` from it (negative = ventral) and lateral `x`. */
const onBody = (th: number, out: number, x = 0): V3 => {
  const a = axisAt(th);
  return [a[0] + x, a[1] + Math.cos(th) * out, a[2] + Math.sin(th) * out];
};
/** The arches as embryo5 draws them (the most cranial is the first). */
const ARCH_TH = [1.76, 1.6, 1.42];
const archAt = (i: number, s: number) => {
  const k = 2 - i;
  return { c: onBody(ARCH_TH[i], -0.55 - k * 0.05, s * (0.62 - k * 0.04)), r: [0.34, 0.52 - k * 0.06, 0.22] as V3 };
};
const HEART_C = onBody(1.18, -1.05);
const HEART_K = 0.4;
/** The heart model (y cranial, z ventral) turned to the body's axis at the heart bulge. */
const HEART_M: M4 = (() => {
  const th = 1.18;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const k = HEART_K;
  return new Float32Array([k, 0, 0, 0, 0, -s * k, c * k, 0, 0, -c * k, -s * k, 0, HEART_C[0], HEART_C[1], HEART_C[2], 1]);
})();
const inHeart = (p: V3): V3 => {
  const m = HEART_M;
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
};
const HEART: HeartPose = {
  ...POSE0,
  segs: 1,
  colour: 1,
  loop: 1,
  atriaFuse: 1,
  split: 1,
  expand: 1,
  truncusMid: 1,
  veins: 0,
  arches: 0,
  glass: 0.8,
};

/** The trunk block's own places (Domains3D: its cranial cut face at z = 0.92, x > 0 the embryo's left). */
const FACE = 0.93;
const PARIETAL: [number, number][] = [
  [0.72, 0.02],
  [0.95, -0.06],
  [1.07, -0.36],
  [1.0, -0.76],
  [0.72, -1.04],
  [0.32, -1.16],
];
function alongParietal(u: number): V3 {
  const segs = PARIETAL.slice(1).map((q, i) => Math.hypot(q[0] - PARIETAL[i][0], q[1] - PARIETAL[i][1]));
  let d = u * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = Math.min(1, d / segs[i]);
      return [PARIETAL[i][0] + (PARIETAL[i + 1][0] - PARIETAL[i][0]) * k, PARIETAL[i][1] + (PARIETAL[i + 1][1] - PARIETAL[i][1]) * k, FACE];
    }
    d -= segs[i];
  }
  return [PARIETAL[0][0], PARIETAL[0][1], FACE];
}

// —— the overlays the two models do not draw (built once, on first use) ——

interface Extra {
  key: string;
  id: string;
  mesh: Mesh;
  hit?: Mesh;
  centre: V3;
  color: string;
  tissue: Item3['tissue'];
  opacity?: number;
}
let extras: Extra[] | null = null;
const tube = (pts: V3[], r: number, n = 18) =>
  tubeParts(curve3(pts, n), { radius: () => r, ref: [1, 0, 0], sides: 10, capStart: true, capEnd: true });
function buildExtras(): Extra[] {
  const E = embryo5();
  const out: Extra[] = [];
  const eyeC = (m: Mesh): V3 => {
    let x = 0;
    let y = 0;
    let z = 0;
    const n = m.pos.length / 3;
    for (let i = 0; i < m.pos.length; i += 3) {
      x += m.pos[i];
      y += m.pos[i + 1];
      z += m.pos[i + 2];
    }
    return [x / n, y / n, z / n];
  };
  const onSkin = (p: V3, dir: V3, lift = 0.03): V3 => {
    const s = surfaceAlong(E.field, p, dir);
    const l = Math.hypot(...s.n) || 1;
    return [s.p[0] + (s.n[0] / l) * lift, s.p[1] + (s.n[1] / l) * lift, s.p[2] + (s.n[2] / l) * lift];
  };
  for (const s of [1, -1]) {
    const tag = s > 0 ? 'l' : 'r';
    // The arches, a little proud of the skin.
    ARCH_TH.forEach((_, i) => {
      const a = archAt(i, s);
      out.push({
        key: `arch${i + 1}-${tag}`,
        id: 'faringe-arkuak',
        ...mk(blob({ center: a.c, radii: a.r, rings: 12, sides: 16 })),
        centre: a.c,
        color: '#f472b6',
        tissue: 'mesenchyme',
      });
    });
    // The 4th and 6th arches, sunk caudal to the 3rd (with the occipital somites' muscle for the larynx).
    const lx = onBody(1.27, -0.5, s * 0.5);
    out.push({
      key: `larynx-${tag}`,
      id: 'laringearen-muskuluak',
      ...mk(blob({ center: lx, radii: [0.22, 0.28, 0.16], rings: 10, sides: 14 })),
      centre: lx,
      color: '#818cf8',
      tissue: 'muscle',
    });
    // The hypoglossal cord: from the occipital somites at the back of the neck round to the floor of the mouth.
    const cord = [onBody(1.45, 0.55, s * 0.42), onBody(1.42, 0.05, s * 0.55), onBody(1.52, -0.42, s * 0.36), onBody(1.68, -0.62, s * 0.14)];
    out.push({ key: `tongue-${tag}`, id: 'mihiaren-muskuluak', ...tube(cord, 0.075), centre: cord[1], color: '#c084fc', tissue: 'muscle' });
    // The eye muscles' primordia round the eye: medial (III), above (IV), caudolateral (VI).
    const eye = eyeC(E.eyes[s > 0 ? 0 : 1]);
    const th = 2.55;
    const dorsal: V3 = [0, Math.cos(th), Math.sin(th)];
    const cranial: V3 = [0, -Math.sin(th), Math.cos(th)];
    const at = (d: number, c: number, inward: number): V3 => [
      eye[0] - s * inward,
      eye[1] + dorsal[1] * d + cranial[1] * c,
      eye[2] + dorsal[2] * d + cranial[2] * c,
    ];
    const e12 = at(-0.02, 0.06, 0.24);
    const e3 = at(0.24, 0.02, 0.12);
    const e5 = at(-0.08, -0.24, 0.1);
    out.push({
      key: `eye12-${tag}`,
      id: 'begiaren-kanpoko-muskuluak',
      ...mk(blob({ center: e12, radii: [0.11, 0.1, 0.1], rings: 8, sides: 12 })),
      centre: e12,
      color: '#f87171',
      tissue: 'muscle',
    });
    out.push({
      key: `eye3-${tag}`,
      id: 'begi-goiko-laprana',
      ...mk(blob({ center: e3, radii: [0.08, 0.07, 0.08], rings: 8, sides: 12 })),
      centre: e3,
      color: '#fb923c',
      tissue: 'muscle',
    });
    out.push({
      key: `eye5-${tag}`,
      id: 'begi-alboko-zuzena',
      ...mk(blob({ center: e5, radii: [0.08, 0.07, 0.08], rings: 8, sides: 12 })),
      centre: e5,
      color: '#a3e635',
      tissue: 'muscle',
    });
    // The mammary ridge: the milk line from the arm bud to the leg bud, on the ventrolateral wall.
    const ridge = [0.55, 0.25, -0.05, -0.35, -0.62].map((t) => onSkin(onBody(t, -0.55, s * 0.6), [s, -0.25, 0], 0.01));
    out.push({
      key: `breast-${tag}`,
      id: 'zelula-mioepitelialak',
      ...tube(ridge, 0.05, 24),
      centre: ridge[2],
      color: '#5b8def',
      tissue: 'epithelium',
    });
    // Sweat glands: buds in the skin of the back (drawn as a few, for the place).
    [-0.5, -0.2, 0.1].forEach((t, i) => {
      const g = onSkin(onBody(t, 0.7, s * 0.55), [s, 0.6, 0], 0.0);
      out.push({
        key: `sweat${i}-${tag}`,
        id: 'izerdi-guruinak',
        ...mk(blob({ center: g, radii: [0.07, 0.07, 0.07], rings: 6, sides: 10 })),
        centre: g,
        color: '#5b8def',
        tissue: 'epithelium',
      });
    });
    // The limb buds, as the body's connective pattern.
    for (const [lt, out0, x0, r] of [
      [0.78, -0.25, 1.05, [0.44, 0.57, 0.4]],
      [-0.82, -0.3, 0.9, [0.42, 0.52, 0.38]],
    ] as const) {
      const c = onBody(lt, out0, s * (x0 + 0.04));
      out.push({
        key: `limb${lt > 0 ? 'A' : 'L'}-${tag}`,
        id: 'paretako-orria',
        ...mk(blob({ center: c, radii: [r[0] * 1.08, r[1] * 1.08, r[2] * 1.08], rings: 12, sides: 16 })),
        centre: c,
        color: '#f9b4b4',
        tissue: 'skin',
      });
    }
    // The arch arteries through the three arches to the dorsal aorta, which runs down to the trunk.
    const dao = [1.85, 1.5, 1.1, 0.7, 0.36].map((t) => onBody(t, 0.12, s * 0.2));
    out.push({ key: `dao-${tag}`, id: 'aorta-arkuak', ...tube(dao, 0.06, 22), centre: dao[2], color: '#2dd4bf', tissue: 'vessel' });
    ARCH_TH.forEach((t, i) => {
      const a = archAt(i, s);
      const path = [onBody(1.3, -0.95, s * 0.05), [a.c[0] * 0.9, a.c[1], a.c[2]] as V3, onBody(t, 0.12, s * 0.2)];
      out.push({ key: `aa${i}-${tag}`, id: 'aorta-arkuak', ...tube(path, 0.05), centre: path[1], color: '#2dd4bf', tissue: 'vessel' });
    });
    // A spinal nerve on the block's cranial face: root, ganglion, the trunk and its two primary rami.
    const z = FACE + 0.02;
    const P = (x: number, y: number): V3 => [s * x, y, z];
    out.push({
      key: `root-${tag}`,
      id: 'nerbio-espinala',
      ...tube([P(0.16, 0.6), P(0.3, 0.5), P(0.42, 0.38)], 0.025, 10),
      centre: P(0.36, 0.44),
      color: '#f5d142',
      tissue: 'nerve',
    });
    out.push({
      key: `dra-${tag}`,
      id: 'atzeko-adar-primarioa',
      ...tube([P(0.42, 0.38), P(0.42, 0.55), P(0.34, 0.74)], 0.022, 10),
      centre: P(0.41, 0.6),
      color: '#e879f9',
      tissue: 'nerve',
    });
    out.push({
      key: `vra-${tag}`,
      id: 'aurreko-adar-primarioa',
      ...tube([P(0.42, 0.38), P(0.62, 0.24), P(0.8, 0.0), P(0.98, -0.3), P(0.98, -0.62)], 0.022, 16),
      centre: P(0.7, 0.14),
      color: '#34d399',
      tissue: 'nerve',
    });
  }
  return out;
}
const mk = (m: Mesh) => ({ mesh: m });

// —— which item is which piece, view by view ——

const EXTRA_OF: Record<string, (s: number) => string[]> = {
  arch1: (s) => (s === 1 ? ['arch1'] : s === 3 ? ['ctHead'] : []),
  arch2: (s) => (s === 1 ? ['arch2'] : s === 3 ? ['ctHead'] : []),
  arch3: (s) => (s === 1 ? ['arch3'] : s === 3 ? ['ctHead'] : []),
  larynx: (s) => (s === 1 ? ['larynx'] : []),
  tongue: (s) => (s === 1 ? ['tongue'] : []),
  eye12: (s) => (s === 1 ? ['eye12'] : []),
  eye3: (s) => (s === 1 ? ['eye3'] : []),
  eye5: (s) => (s === 1 ? ['eye5'] : []),
  breast: (s) => (s === 0 ? ['breast'] : []),
  sweat0: (s) => (s === 0 ? ['sweat'] : []),
  sweat1: (s) => (s === 0 ? ['sweat'] : []),
  sweat2: (s) => (s === 0 ? ['sweat'] : []),
  limbA: (s) => (s === 3 ? ['ctBody'] : []),
  limbL: (s) => (s === 3 ? ['ctBody'] : []),
  dao: (s) => (s === 0 ? ['vascularCrest'] : []),
  aa0: (s) => (s === 0 ? ['vascularCrest'] : []),
  aa1: (s) => (s === 0 ? ['vascularCrest'] : []),
  aa2: (s) => (s === 0 ? ['vascularCrest'] : []),
};
const BLOCK_OF: Record<string, (s: number) => string[]> = {
  visceral: (s) => (s === 0 ? ['gut'] : []),
  aorta: (s) => (s === 0 ? ['vascularWall'] : []),
  prim: (s) => (s === 2 ? ['deep', 'intercostal', 'neck', 'scapula'] : []),
  abax: (s) => (s === 2 ? ['wall', 'limb'] : []),
  parietal: (s) => (s === 3 ? ['ctBody'] : []),
};
/** The room pieces an item stands for in a view. */
export function piecesOf(key: string, s: number): string[] {
  const [kind, rest] = key.split(':') as [string, string | undefined];
  if (kind === 'x' && rest) return EXTRA_OF[rest.replace(/-[lr]$/, '')]?.(s) ?? [];
  if (kind === 'b' && rest) {
    if (rest.startsWith('cell')) return s === 2 ? ['wall', 'limb'] : [];
    return BLOCK_OF[rest]?.(s) ?? [];
  }
  if (kind === 'eye') return s === 0 ? ['pupil'] : [];
  if (kind === 'h' && rest)
    return s === 0 || s === 4
      ? rest.startsWith('cond')
        ? s === 4
          ? ['conduct']
          : []
        : rest.startsWith('myo-') || rest === 'atria' || rest === 'av-canal'
          ? ['cardiac']
          : []
      : [];
  return [];
}
export const isOf = (piece: string, it: Item3, s: number) => piecesOf(it.key.replace(/~\d+$/, ''), s).includes(piece);

/** How much of each part a view shows (0..1). */
function shown(key: string, s: number): number {
  const [kind, rest = ''] = key.split(':');
  if (kind === 'body') return [0.42, 0.6, 0, 0.42, 0.3][s];
  if (kind === 'eye') return s === 2 ? 0 : 1;
  if (kind === 'h') return rest.startsWith('cond') ? (s === 4 ? 1 : 0) : s === 0 || s === 4 ? 1 : 0;
  if (kind === 'b') {
    if (s === 1 || s === 4) return 0;
    // Seen whole in the domains view; elsewhere only what the view is about, inside the embryo.
    if (s === 2) return 1;
    if (rest.startsWith('cell')) return s === 3 ? 1 : 0;
    const part: Record<number, string[]> = { 0: ['gut', 'visceral', 'aorta', 'neural', 'noto'], 3: ['parietal', 'neural', 'noto', 'gut'] };
    return part[s]?.includes(rest) ? 1 : 0;
  }
  if (kind === 'x') {
    const base = rest.replace(/-[lr]$/, '');
    if (/^(root|dra|vra)$/.test(base)) return s === 2 ? 1 : 0;
    if (/^arch/.test(base)) return s === 1 || s === 3 ? 1 : 0;
    if (/^(limbA|limbL)$/.test(base)) return s === 3 ? 1 : 0;
    return (EXTRA_OF[base]?.(s) ?? []).length ? 1 : 0;
  }
  return 0;
}

/**
 * The room's 3D frame names its axes as the heart models have them (y cranial, z ventral, x left); the
 * embryo is built with y dorsal and z cranial (at mid-trunk). The whole world is turned into the room's
 * frame, so the axis badge is true and the embryo stands head up; the trunk block keeps the simulator's
 * view (dorsal up), the other stations stand the embryo upright.
 */
const R: M4 = new Float32Array([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
const turn = (p: V3): V3 => [p[0], p[2], -p[1]];
const turned = new WeakMap<M4, M4>();
const turnM = (m?: M4): M4 => {
  if (!m) return R;
  let t = turned.get(m);
  if (!t) turned.set(m, (t = mulM(R, m)));
  return t;
};
/** A station: an orbit in the embryo's own frame, turned, with its own up. */
const station = (c: Camera3, up: V3): Camera3 => ({ ...c, eye: turn(c.eye), target: turn(c.target), up });
const CRANIAL: V3 = [0, 1, 0];
const DORSAL: V3 = [0, 0, -1];
const CAMS: Camera3[] = [
  station(orbit(90, 12, 16, [0, -2.7, 0.35]), CRANIAL),
  station(orbit(80, -4, 9.6, [0.25, -3.8, 1.55]), CRANIAL),
  station(orbit(32, 20, 5.4, [0.32, -0.16, 0.2]), DORSAL),
  station(orbit(78, 12, 15, [0, -2.6, 0.5]), CRANIAL),
  station(orbit(58, 10, 3.9, [0.1, -2.2, 1.45]), CRANIAL),
];
/** Between two stations the up turns too (blendCamera keeps the destination's). */
function glide(a: Camera3, b: Camera3, e: number): Camera3 {
  const c = blendCamera(a, b, e);
  const ua = a.up ?? CRANIAL;
  const ub = b.up ?? CRANIAL;
  const u: V3 = [lerp(ua[0], ub[0], e), lerp(ua[1], ub[1], e), lerp(ua[2], ub[2], e)];
  const l = Math.hypot(...u) || 1;
  return { ...c, up: [u[0] / l, u[1] / l, u[2] / l] };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => x * x * (3 - 2 * x);

export interface MuscleFrame {
  items: Item3[];
  pts: Record<string, V3>;
  camera: Camera3;
  stage: number;
  /** Where each overlay is (its middle), by item key. */
  centres: Record<string, V3>;
}

/** The world at u (between two views only the camera travels and the parts cross-fade). */
export function muscleFrame(u: number, mode: Parameters<typeof colourOf>[1]): MuscleFrame {
  const i = Math.max(0, Math.min(N - 1, Math.floor(u)));
  const j = Math.min(N - 1, i + 1);
  const e = ease(Math.max(0, Math.min(1, u - i)));
  const stage = Math.round(u);
  const col = (k: string) => colourOf(BY_KEY.get(k)!, mode, MUSCLES);
  const colourAt = (key: string, s: number) => {
    const ps = piecesOf(key, s);
    // The conduction system keeps its own colour: in both colourings it would be the myocardium's.
    return ps.length && ps[0] !== 'conduct' ? col(ps[0]) : null;
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

  const E = embryo5();
  push({ key: 'body', mesh: E.body, hit: E.hit, color: '#f6d6c8', deep: '#b07a70', tissue: 'skin', opacity: 1, outline: false });
  E.eyes.forEach((m, k) =>
    push({ key: `eye:${k}`, id: 'begi-niniko-muskuluak', mesh: m, color: '#4a3038', deep: '#1a0e12', tissue: 'skin' }),
  );

  const block = buildDomains(1, true).scene.items.filter((it) => !it.key.startsWith('e5') && !it.key.startsWith('fly'));
  for (const it of block) push({ ...it, key: `b:${it.key}` });

  const h = heartModel(HEART, {});
  for (const it of h.items) if (!it.stream && it.id) push({ ...it, key: `h:${it.key}`, matrix: HEART_M });
  // The conduction system on the loop: the sinoatrial node where the sinus enters the atrium, the
  // atrioventricular node at the canal, the bundle down to the bulboventricular junction and its two branches.
  const P = h.pts;
  const sa = P['zulo-sinoaurikularra'] ?? P['eskuineko-sinu-luzapena'];
  const av = P['erreten-aurikulubentrikularra'];
  const bv = P['atal-bulbobentrikularra'];
  if (sa && av && bv) {
    const cond = (key: string, part: { mesh: Mesh; hit?: Mesh }) =>
      push({ key: `h:cond-${key}`, id: 'eroapen-sistema', ...part, matrix: HEART_M, color: '#ffd27a', deep: '#8a6a20', tissue: 'nerve' });
    cond('sa', { mesh: blob({ center: sa, radii: [0.13, 0.13, 0.13], rings: 8, sides: 12 }) });
    cond('av', { mesh: blob({ center: av, radii: [0.12, 0.12, 0.12], rings: 8, sides: 12 }) });
    cond('his', tube([av, [(av[0] + bv[0]) / 2, (av[1] + bv[1]) / 2, (av[2] + bv[2]) / 2 + 0.25], bv], 0.06, 12));
    for (const [n, k] of [
      ['r', 'bulboaren-hurbileko-atala'],
      ['l', 'atal-bentrikularra'],
    ] as const)
      if (P[k]) cond(`br-${n}`, tube([bv, [(bv[0] + P[k][0]) / 2, (bv[1] + P[k][1]) / 2, (bv[2] + P[k][2]) / 2 + 0.3], P[k]], 0.045, 12));
    centres['h:cond-av'] = inHeart(av);
    centres['h:cond-sa'] = inHeart(sa);
  }
  centres['h:myo'] = inHeart(P['atal-bentrikularra'] ?? [0, 0, 0]);

  extras ??= buildExtras();
  for (const x of extras) {
    centres[`x:${x.key}`] = x.centre;
    push({
      key: `x:${x.key}`,
      id: x.id,
      mesh: x.mesh,
      hit: x.hit,
      color: x.color,
      deep: mixHex(x.color, '#000000', 0.55),
      tissue: x.tissue,
      opacity: x.opacity,
    });
  }

  // Between two views both states of one item can be drawn: every item keeps its own key.
  const seen = new Map<string, number>();
  for (const it of items) {
    const n = seen.get(it.key) ?? 0;
    seen.set(it.key, n + 1);
    if (n) it.key = `${it.key}~${n}`;
    it.matrix = turnM(it.matrix);
  }
  return { items, pts: {}, camera: glide(CAMS[i], CAMS[j], e), stage, centres };
}

/** Where each piece's name points in its view (on the embryo's left side, which the cameras face). */
const POINT: Record<string, (f: MuscleFrame) => V3 | undefined> = {
  eye12: (f) => f.centres['x:eye12-l'],
  eye3: (f) => f.centres['x:eye3-l'],
  eye5: (f) => f.centres['x:eye5-l'],
  arch1: (f) => f.centres['x:arch1-l'],
  arch2: (f) => f.centres['x:arch2-l'],
  arch3: (f) => f.centres['x:arch3-l'],
  larynx: (f) => f.centres['x:larynx-l'],
  tongue: (f) => f.centres['x:tongue-l'],
  // The primaxial domain holds four: each named where it lies (dorsal by the neural tube; towards the frontier).
  deep: () => [0.3, 0.7, FACE],
  scapula: () => [0.6, 0.66, FACE],
  neck: () => [0.48, 0.3, FACE],
  intercostal: () => [0.66, 0.18, FACE],
  wall: () => alongParietal(0.3),
  limb: () => alongParietal(0.12),
  gut: () => [0.13, -0.42, FACE],
  pupil: (f) => f.items.find((it) => it.key === 'eye:0') && eyeCentre(f),
  breast: (f) => f.centres['x:breast-l'],
  sweat: (f) => f.centres['x:sweat1-l'],
  vascularWall: () => [0.2, -0.06, FACE],
  vascularCrest: (f) => f.centres['x:aa1-l'],
  cardiac: (f) => f.centres['h:myo'],
  conduct: (f) => f.centres['h:cond-av'],
  ctHead: (f) => f.centres['x:arch2-l'],
  ctBody: () => alongParietal(0.62),
};
function eyeCentre(f: MuscleFrame): V3 | undefined {
  const it = f.items.find((x) => x.key === 'eye:0');
  if (!it) return undefined;
  const m = it.mesh.pos;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let k = 0; k < m.length; k += 3) {
    x += m[k];
    y += m[k + 1];
    z += m[k + 2];
  }
  const n = m.length / 3;
  return [x / n, y / n, z / n];
}

/** A piece's name point and the id of a drawn item of it, in the view f shows. */
export function anchorOf(piece: string, f: MuscleFrame): { p: V3; id: string } | null {
  const own = f.items.filter((it) => it.id && (it.show ?? 1) > 0.3 && isOf(piece, it, f.stage));
  if (!own.length) return null;
  const p = POINT[piece]?.(f);
  return p ? { p: turn(p), id: own[0].id! } : null;
}

/** Names the views give besides the pieces: the two primary rami (the innervation the domains are not). */
function contextNames(f: MuscleFrame): CalloutSpec[] {
  if (f.stage !== 2) return [];
  return [
    { id: 'atzeko-adar-primarioa', p: turn([0.4, 0.62, FACE + 0.02]), show: 1, text: nameOf('atzeko-adar-primarioa'), small: true },
    { id: 'aurreko-adar-primarioa', p: turn([0.9, -0.18, FACE + 0.02]), show: 1, text: nameOf('aurreko-adar-primarioa'), small: true },
  ];
}

export { twoLines };

function Muscle3DView(state: RoomViewState) {
  const { mode, lit, names } = state;
  const frame = (u: number): Frame3 => {
    const f = muscleFrame(u, mode);
    const { stage } = f;
    const items = lit.size
      ? f.items.map((it) => ([...lit].some((k) => isOf(k, it, stage)) ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 }))
      : f.items;
    const said = new Set(MUSCLES.changes[stage].flatMap((c) => c.keys));
    const pick: Piece[] =
      names === 'gabe'
        ? []
        : lit.size
          ? MUSCLES.pieces.filter((p) => lit.has(p.key))
          : names === 'guztiak'
            ? MUSCLES.pieces.filter((p) => piecesAt(stage).includes(p.key))
            : MUSCLES.pieces.filter((p) => said.has(p.key));
    const out: CalloutSpec[] = names === 'gabe' || lit.size ? [] : contextNames(f);
    for (const p of pick) {
      const a = anchorOf(p.key, f);
      if (a) out.push({ id: a.id, p: a.p, show: 1, ...twoLines(nameAt(p, stage)), key: p.key, small: true });
    }
    return { items, pts: f.pts, camera: f.camera, names: out };
  };
  return <Room3D state={state} frame={frame} continuity="eratorriak-9" label="Muskuluen 3D eredua" />;
}

/** The embryo and the trunk block are built off the main thread first. */
export function Muscle3D(state: RoomViewState) {
  return useGeoReady([EMBRYO5, DOMAINS_GEO]) ? (
    <Muscle3DView {...state} />
  ) : (
    <div className={styles.view3d}>
      <svg viewBox="0 0 1000 640" className={styles.svg3d}>
        <Loading3D />
      </svg>
    </div>
  );
}
