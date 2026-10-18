import { mix3, type V3 } from '@/lib/three-d/math';
import { grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedBlob, cachedMerge, cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { perfCount } from '@/lib/perf';
import { T } from '@/components/scenes/week10/common';
import { blobParts, mixHex, routeLength, tubeParts, vesselRouteOf } from '@/components/scenes/week10/model3d';
import { K } from './common';

/**
 * M2 of topic 11 (notes 3): the AV canal and its valves. The two primitive ventricles are one chamber cut
 * open from the front (the right one green, from the proximal part; the left one cyan, from the
 * ventricular part), the bulboventricular ridge rising from the floor between them. The AV canal opens
 * in their BACK wall: its opening faces the viewer, in a near-frontal plane, as the notes insist (the
 * atria are behind and above, the ventricles in front and below). So its cushions are superior (dorsal)
 * and inferior, with a lateral one on each side; superior and inferior fuse into a vertical bar that
 * leaves a right and a left orifice. Stage 7 grows the valves from the swellings round each orifice:
 * leaflets (3 on the right, 2 on the left) hollowed thin from the ventricular side, chordae tendineae to
 * the papillary muscles.
 *
 * Axes as every heart model: x = the embryo's left, y = cranial, z = ventral (towards the viewer at yaw 0).
 */

const C: V3 = [0, -0.55, 0];
const RX = 1.75;
const RY = 0.95;
const RZ = 0.95;
/** The front cut (absolute z). */
const ZC = 0.28;
const TH = 0.14;
/** The opening's height on the back wall, and its half-extents (x, y). */
const YO = -0.3;
const OA = 0.55;
const OB = 0.42;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const q = (v: number) => Math.round(v * 200) / 200;

function inner(phi: number, th: number, grow = 0): V3 {
  const p = (phi * Math.PI) / 180;
  const t = (th * Math.PI) / 180;
  return [(RX + grow) * Math.sin(t) * Math.sin(p) + C[0], (RY + grow) * Math.cos(t) + C[1], (RZ + grow) * Math.sin(t) * Math.cos(p) + C[2]];
}
const phi0 = (th: number, rz: number) => {
  const r = rz * Math.sin((th * Math.PI) / 180);
  return r <= ZC - C[2] ? 0 : (Math.acos((ZC - C[2]) / r) * 180) / Math.PI;
};
/** A point of the back wall over (x, y), `k` < 1 a little inside the chamber. */
function back(x: number, y: number, k = 1): V3 {
  const s = Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - ((y - C[1]) / RY) ** 2));
  return [x, y, C[2] - RZ * s * k];
}
/** The floor's height over (x, z). */
const floorAt = (x: number, z: number) => C[1] - RY * Math.sqrt(Math.max(0.0, 1 - (x / RX) ** 2 - ((z - C[2]) / RZ) ** 2));

// ———————————————————————————— the chamber (built once) ————————————————————————————

type Part = { mesh: Mesh; hit: Mesh };
let shell: { inR: Part; inL: Part; outR: Part; outL: Part; cutR: Part; cutL: Part } | null = null;
function shellOnce() {
  if (shell) return shell;
  const surf = (right: boolean, grow: number, coarse: number) =>
    grid(Math.round(26 / coarse), Math.round(40 / coarse), (u, v) => {
      const th = lerp(0.5, 179.5, v);
      const f = phi0(th, RZ + grow);
      const phi = right ? lerp(180, 360 - f, u) : lerp(f, 180, u);
      return inner(phi, th, grow);
    }, grow > 0 ? [right ? -9 : 9, C[1], -9] : C);
  const part = (right: boolean, grow: number): Part => ({ mesh: surf(right, grow, 1), hit: surf(right, grow, 3) });
  const ring = (right: boolean, coarse: number) => {
    const s = (g: number) => Math.sqrt(Math.max(0, 1 - ((ZC - C[2]) / (RZ + g)) ** 2));
    return grid(Math.round(40 / coarse), 2, (u, v) => {
      const a = right ? lerp(Math.PI / 2, (Math.PI * 3) / 2, u) : lerp(-Math.PI / 2, Math.PI / 2, u);
      const g = lerp(0, TH, v);
      return [(RX + g) * s(g) * Math.cos(a) + C[0], (RY + g) * s(g) * Math.sin(a) + C[1], ZC];
    }, [0, C[1], 9]);
  };
  shell = {
    inR: part(true, 0),
    inL: part(false, 0),
    outR: part(true, TH),
    outL: part(false, TH),
    cutR: { mesh: ring(true, 1), hit: ring(true, 3) },
    cutL: { mesh: ring(false, 1), hit: ring(false, 3) },
  };
  return shell;
}

// ———————————————————————————— the state ————————————————————————————

export interface CanalState {
  /** The bulboventricular ridge: sharp and tall (0), flattened (1). */
  flatten: number;
  /** The canal moves right: over the left ventricle only (0), over both (1). */
  shift: number;
  /** Four cushions on its rim (0.35 just appearing), superior and inferior fused. */
  cushions: number;
  fuse: number;
  /** Stage 7: mesenchymal swellings round each orifice; leaflets out of them; hollowed thin. */
  swell: number;
  leaflets: number;
  hollow: number;
  /** Papillary muscles and the chordae tendineae (muscular at first, fibrous at 1). */
  papillary: number;
  chordae: number;
  fibrous: number;
  /** Papillary muscles contracting (0 at rest, 1 pulled). */
  pull: number;
  /** Which order of chordae glows (1–3), 0 none. */
  order: number;
  /** A frontal plane through the opening. */
  frontal: number;
  /** The primary interventricular foramen shown: a faint doorway over the ridge. */
  foramen: number;
  /** The right ventricle's wall seen through (side views: the canal and its cushions behind it). */
  glassR: number;
}
export const CN0: CanalState = { flatten: 0, shift: 0, cushions: 0, fuse: 0, swell: 0, leaflets: 0, hollow: 0, papillary: 0, chordae: 0, fibrous: 0, pull: 0, order: 0, frontal: 0, foramen: 0, glassR: 0 };

export interface CanalFlow {
  phase: number;
  /** Blood shown (0–1). */
  show: number;
}

export interface CanalModel {
  items: Item3[];
  pts: Record<string, V3>;
}

/** The opening's middle across x: over the left ventricle, then over the ridge. */
const xOpen = (s: CanalState) => lerp(0.72, 0, clamp01(s.shift));
/** The two orifices after fusion: centre x and half-extents. */
const orifice = (s: CanalState, right: boolean) => ({ x: xOpen(s) + (right ? -1 : 1) * 0.33, y: YO, ea: 0.2, eb: 0.33 });

const ATRIUM: V3 = [0.12, 0.92, -2.0];
/** Where the outflow leaves the right ventricle's roof. */
const OUT_X = -0.78;
const OUT_Z = -0.02;
const RIDGE_X = 0;

/** The ridge on the floor between the ventricles: a = −90°…90° across it, z back to front. */
function ridgePoint(s: CanalState, a: number, z: number): V3 {
  const w = lerp(0.16, 0.36, clamp01(s.flatten));
  const h = lerp(0.95, 0.32, clamp01(s.flatten));
  const taper = Math.min(1, 1.6 * Math.sqrt(Math.max(0, 1 - ((z - C[2]) / RZ) ** 2)));
  const x = RIDGE_X + w * taper * Math.sin(a);
  return [x, floorAt(x, z) - 0.03 + h * taper * Math.cos(a), z];
}
/** Top of the ridge at depth z. */
const ridgeTop = (s: CanalState, z: number) => ridgePoint(s, 0, z)[1];

export function canalModel(s: CanalState, flow: CanalFlow): CanalModel {
  perfCount('canalModel');
  const S = shellOnce();
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const RV = { color: T.proximal, deep: T.bulbusDeep };
  const LV = { color: T.ventricle, deep: T.ventricleDeep };

  // —— the two primitive ventricles: one chamber, cut open from the front ——
  // The right one from the bulbus's proximal part, the left one from the ventricular part (topic 10).
  const gR = ['bulboaren-hurbileko-atala', 'atal-bulbarra'];
  const gL = ['atal-bentrikularra'];
  const seeR = s.glassR > 0.01 ? { opacity: 1 - 0.78 * clamp01(s.glassR) } : {};
  items.push({ key: 'in-r', id: 'hasierako-eskuineko-bentrikulua', groups: gR, ...S.inR, ...RV, tissue: 'muscle', ...seeR });
  items.push({ key: 'in-l', id: 'hasierako-ezkerreko-bentrikulua', groups: gL, ...S.inL, ...LV, tissue: 'muscle' });
  items.push({ key: 'out-r', id: 'hasierako-eskuineko-bentrikulua', ...S.outR, color: mixHex(T.proximal, '#10241a', 0.25), deep: T.bulbusDeep, tissue: 'muscle', ...seeR });
  items.push({ key: 'out-l', id: 'hasierako-ezkerreko-bentrikulua', ...S.outL, color: mixHex(T.ventricle, '#0c2026', 0.25), deep: T.ventricleDeep, tissue: 'muscle' });
  items.push({ key: 'cut-r', id: 'hasierako-eskuineko-bentrikulua', ...S.cutR, color: mixHex(T.proximal, '#ffffff', 0.2), deep: T.bulbusDeep, tissue: 'muscle', outline: false, ...seeR });
  items.push({ key: 'cut-l', id: 'hasierako-ezkerreko-bentrikulua', ...S.cutL, color: mixHex(T.ventricle, '#ffffff', 0.2), deep: T.ventricleDeep, tissue: 'muscle', outline: false });
  pts['hasierako-eskuineko-bentrikulua'] = inner(258, 118, -0.04);
  pts['hasierako-ezkerreko-bentrikulua'] = inner(102, 118, -0.04);

  // —— the bulboventricular ridge on the floor (it flattens) ——
  {
    const dep = [q(s.flatten)];
    const zAt = (v: number) => lerp(C[2] - RZ * 0.985, ZC, v);
    const build = (coarse: number) => grid(Math.round(32 / coarse), Math.round(20 / coarse), (u, v) => ridgePoint(s, lerp(-Math.PI / 2, Math.PI / 2, u), zAt(v)), [0, 9, 0]);
    const cap = () => grid(30, 3, (u, v) => {
      const p = ridgePoint(s, lerp(-Math.PI / 2, Math.PI / 2, u), ZC);
      return [p[0], lerp(floorAt(p[0], ZC) - 0.03, p[1], v), ZC + 0.003];
    }, [0, 0, 9]);
    const RIDGE = '#2fb3a0';
    items.push({ key: 'ridge', id: 'ertz-bulbobentrikularra', mesh: cachedMesh('canal ridge', dep, () => build(1)), hit: cachedMesh('canal ridge hit', dep, () => build(3)), color: RIDGE, deep: '#14695d', tissue: 'muscle' });
    items.push({ key: 'ridge-cap', groups: ['ertz-bulbobentrikularra'], mesh: cachedMesh('canal ridge cap', dep, cap), color: mixHex(RIDGE, '#ffffff', 0.22), deep: '#14695d', tissue: 'muscle', outline: false });
    const top = ridgeTop(s, ZC);
    pts['ertz-bulbobentrikularra'] = [0, lerp(floorAt(0, ZC), top, 0.55), ZC + 0.01];
    // The primary interventricular foramen: the way over the ridge, between the two ventricles.
    pts['bentrikulu-arteko-zulo-primarioa'] = [0, (ridgeTop(s, -0.2) + C[1] + RY * 0.8) / 2, -0.2];
    // The way over the ridge, as a faint doorway between the two ventricles (seen from either side).
    if (s.foramen > 0.01) {
      const door = cachedMesh('canal foramen', dep, () => {
        const m = grid(14, 10, (u, v) => {
          const z = lerp(C[2] - RZ * 0.9, ZC - 0.02, u);
          const roof = C[1] + RY * 0.96 * Math.sqrt(Math.max(0, 1 - ((z - C[2]) / RZ) ** 2));
          return [0, lerp(ridgeTop(s, z) + 0.02, roof, v), z];
        }, [9, 0, 0]);
        return merge([m, { ...m, idx: flipIdx(m.idx), nrm: m.nrm.map((n) => -n) }]);
      });
      items.push({ key: 'foramen', id: 'bentrikulu-arteko-zulo-primarioa', mesh: door, color: '#ffe7a3', deep: '#9a7a2a', tissue: 'membrane', thin: 1, opacity: 0.3 * s.foramen, outline: false });
    }
  }

  // —— the AV canal: its opening in the back wall (a frontal plane), the duct back and up to the atrium ——
  const xo = xOpen(s);
  const fused = s.fuse > 0.5;
  {
    const half = (right: boolean) => cachedMesh('canal opening', [q(xo), right ? 1 : 0], () =>
      grid(8, 18, (r, t) => {
        const a = right ? lerp(Math.PI / 2, (Math.PI * 3) / 2, t) : lerp(-Math.PI / 2, Math.PI / 2, t);
        return back(xo + OA * r * Math.cos(a), YO + OB * r * Math.sin(a), 0.985);
      }, [xo, YO, 9]));
    const lumen = { color: '#12070c', deep: '#000000', tissue: 'vessel' as const, outline: false };
    items.push({ key: 'open-r', id: fused ? 'eskuineko-zulo-ab' : 'erreten-aurikulubentrikularra', groups: ['zulo-aurikulubentrikularrak', 'erreten-aurikulubentrikularra'], mesh: half(true), ...lumen });
    items.push({ key: 'open-l', id: fused ? 'ezkerreko-zulo-ab' : 'erreten-aurikulubentrikularra', groups: ['zulo-aurikulubentrikularrak', 'erreten-aurikulubentrikularra'], mesh: half(false), ...lumen });
    const rim = cachedMesh('canal rim', [q(xo)], () => tubeParts(Array.from({ length: 41 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return back(xo + OA * Math.cos(a), YO + OB * Math.sin(a), 0.98);
    }), { radius: () => 0.035, ref: [0, 0, 1], sides: 10 }).mesh);
    items.push({ key: 'open-rim', id: 'erreten-aurikulubentrikularra', mesh: rim, color: mixHex(T.atrium, T.ventricle, 0.45), deep: mixHex(T.atriumDeep, T.ventricleDeep, 0.5), tissue: 'muscle', outline: false });
    pts['erreten-aurikulubentrikularra'] = back(xo, YO - OB * 0.55, 0.96);
    if (fused) {
      const r = orifice(s, true);
      const l = orifice(s, false);
      pts['eskuineko-zulo-ab'] = back(r.x - 0.04, r.y - 0.1, 0.95);
      pts['ezkerreko-zulo-ab'] = back(l.x + 0.04, l.y - 0.1, 0.95);
      pts['zulo-aurikulubentrikularrak'] = pts['eskuineko-zulo-ab'];
    }
    // Outside: the duct from the opening back and up to the atrium, the atrium behind and above.
    const from = back(xo, YO, 1.0);
    const duct = tubeParts([mix3(from, [xo, YO, 0], -0.02), [lerp(xo, ATRIUM[0], 0.3), YO + 0.28, -1.32], [lerp(xo, ATRIUM[0], 0.7), 0.45, -1.72], [ATRIUM[0], ATRIUM[1] - 0.25, ATRIUM[2] + 0.1]], { radius: () => 0.36, around: (a) => 1 + 0.25 * Math.cos(a) ** 2, ref: [1, 0, 0], sides: 18 });
    items.push({ key: 'duct', id: 'erreten-aurikulubentrikularra', ...duct, color: mixHex(T.atrium, T.ventricle, 0.45), deep: mixHex(T.atriumDeep, T.ventricleDeep, 0.5), tissue: 'muscle' });
    items.push({ key: 'atrium', id: 'aurikula-komuna', groups: ['atal-aurikularra'], ...blobParts({ center: ATRIUM, radii: [1.45, 0.62, 0.55], rings: 18, sides: 26 }), color: T.atrium, deep: T.atriumDeep, tissue: 'muscle' });
    pts['aurikula-komuna'] = [ATRIUM[0] - 0.9, ATRIUM[1] + 0.25, ATRIUM[2] + 0.2];
    pts['erreten-duct'] = [lerp(xo, ATRIUM[0], 0.5), 0.12, -1.55];
    // The outflow from the right ventricle's roof: the conus, then the truncus (topic 10 colours).
    const outRoot: V3 = [OUT_X, 0.33, OUT_Z];
    const conus = tubeParts([outRoot, [-0.72, 0.62, 0.1], [-0.55, 0.95, 0.3]], { radius: (u) => 0.3 - 0.04 * u, ref: [1, 0, 0], sides: 18 });
    const truncus = tubeParts([[-0.55, 0.92, 0.29], [-0.38, 1.35, 0.4], [-0.1, 1.72, 0.42]], { radius: () => 0.24, ref: [1, 0, 0], sides: 18, capEnd: true });
    items.push({ key: 'conus', id: 'arteria-konoa', groups: ['atal-bulbarra'], ...conus, color: T.conus, deep: '#4d6a12', tissue: 'muscle' });
    items.push({ key: 'truncus', id: 'enbor-arteriosoa', groups: ['atal-bulbarra'], ...truncus, color: '#efe6cf', deep: '#8a7a55', tissue: 'muscle' });
    pts['arteria-konoa'] = [-0.7, 0.62, 0.32];
    pts['enbor-arteriosoa'] = [-0.3, 1.5, 0.42];
    // Its way out of the right ventricle: a dark mouth in the inner roof.
    const mouth = cachedMesh('canal mouth', [], () => grid(6, 24, (r, a) => {
      const x = OUT_X + 0.27 * r * Math.cos(a * Math.PI * 2);
      const z = OUT_Z + 0.25 * r * Math.sin(a * Math.PI * 2);
      return [x, -floorAt(x, z) + 2 * C[1] - 0.012, z];
    }, C));
    items.push({ key: 'mouth', id: 'arteria-konoa', mesh: mouth, color: '#12070c', deep: '#000000', tissue: 'vessel', outline: false });
    // A frontal plane through the opening (seen from the side, the canal faces forward, not up).
    if (s.frontal > 0.01) {
      const z = back(xo, YO, 1)[2];
      const plane = cachedMesh('canal frontal', [q(z)], () => merge([grid(2, 2, (u, v) => [lerp(-2.2, 2.2, u), lerp(-1.75, 1.25, v), z], [0, 0, 9]), grid(2, 2, (u, v) => [lerp(-2.2, 2.2, u), lerp(-1.75, 1.25, v), z - 0.002], [0, 0, -9])]));
      items.push({ key: 'frontal', mesh: plane, color: '#a9c9ff', deep: '#4f6fa8', tissue: 'membrane', thin: 1, opacity: 0.34 * clamp01(s.frontal), outline: false });
    }
  }

  // —— the four cushions on the rim: superior (dorsal) and inferior fuse; the laterals stay small ——
  if (s.cushions > 0.01) {
    const g = clamp01(s.cushions);
    const f = clamp01(s.fuse);
    const slim = 1 - 0.4 * clamp01(s.swell);
    const lat0 = 1 - clamp01(s.swell);
    const tone = { color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' as const };
    const groups = ['kuxin-aurikulubentrikularrak', 'endokardio-kuxinak'];
    const sup = (sign: 1 | -1, id: string) => {
      const y = YO + sign * lerp(OB * 0.92, 0.14, f) * (1 - 0.15 * g);
      const c = back(xo, y, 0.94);
      const ry = lerp(0.07, 0.16, g) + 0.12 * f;
      items.push({ key: id, id, groups, ...blobParts({ center: [c[0], c[1], c[2] + 0.04], radii: [(lerp(0.16, 0.24, g) - 0.08 * f) * slim, ry, lerp(0.07, 0.13, g) * slim], rings: 14, sides: 20 }), ...tone });
      pts[id] = [c[0], y + sign * 0.02, c[2] + 0.17];
    };
    sup(1, 'goiko-kuxina');
    sup(-1, 'beheko-kuxina');
    // The lateral ones (right and left), one structure.
    const lat = [-1, 1].map((sign) => {
      const c = back(xo + sign * OA * 0.95, YO, 0.95);
      return blobParts({ center: [c[0], c[1], c[2] + 0.03], radii: [lerp(0.04, 0.08, g) * lat0 + 0.005, lerp(0.1, 0.2, g) * lat0 + 0.005, lerp(0.04, 0.08, g) * lat0 + 0.005], rings: 12, sides: 16 });
    });
    items.push({ key: 'lateral', id: 'alboko-kuxinak', groups, mesh: cachedMerge(lat.map((b) => b.mesh)), hit: cachedMerge(lat.map((b) => b.hit)), ...tone });
    pts['alboko-kuxinak'] = (() => {
      const c = back(xo - OA * 0.95, YO, 0.95);
      return [c[0], c[1], c[2] + 0.1] as V3;
    })();
    pts['kuxin-aurikulubentrikularrak'] = (() => {
      const c = back(xo, YO + (f > 0.5 ? 0.05 : OB * 0.8), 0.94);
      return [c[0], c[1], c[2] + 0.16] as V3;
    })();
  }

  // —— stage 7: the valves ——
  if (s.swell > 0.01) valves(s, items, pts);

  items.push(...streams(s, flow));
  return { items, pts };
}

// ———————————————————————————— valves (stage 7) ————————————————————————————

/** Papillary muscles: base on the floor, per ventricle. */
const PAPS: { right: boolean; x: number; z: number }[] = [
  { right: true, x: -1.0, z: -0.12 },
  { right: true, x: -0.48, z: 0.12 },
  { right: false, x: 0.5, z: 0.12 },
  { right: false, x: 1.0, z: -0.12 },
];
/** Leaflets: their arcs round each orifice (radians; 0 = towards the embryo's left, π/2 = up). */
const TRI: [number, number][] = [
  [-0.25, 1.6],
  [2.1, 3.85],
  [4.35, 5.7],
];
const MIT: [number, number][] = [
  [-1.25, 1.25],
  [1.85, 4.45],
];

function valves(s: CanalState, items: Item3[], pts: Record<string, V3>) {
  const g = clamp01(s.swell);
  const L = clamp01(s.leaflets);
  const thin = clamp01(s.hollow);
  const close = lerp(0.7, 0.18, clamp01(s.pull));
  const tips = PAPS.map((p) => {
    const base: V3 = [p.x, floorAt(p.x, p.z) - 0.04, p.z];
    const h = 0.42 * clamp01(s.papillary) * (1 - 0.28 * clamp01(s.pull));
    return { base, tip: [p.x * 0.96, base[1] + h, p.z + 0.04] as V3, right: p.right };
  });
  const sides: [boolean, [number, number][], string][] = [
    [true, TRI, 'balbula-trikuspidea'],
    [false, MIT, 'balbula-mitrala'],
  ];
  for (const [right, arcs, id] of sides) {
    const o = orifice(s, right);
    const rimAt = (a: number, k = 0.975): V3 => back(o.x + o.ea * Math.cos(a), o.y + o.eb * Math.sin(a), k);
    const axis = back(o.x, o.y, 0.975);
    const tag = right ? 'r' : 'l';
    // The swelling round the orifice: a thick cuff that thins as the leaflets are hollowed out of it.
    const cuffR = (0.03 + 0.1 * (1 - thin)) * g;
    const cuff = tubeParts(Array.from({ length: 37 }, (_, i) => rimAt((i / 36) * Math.PI * 2, 0.96)), { radius: () => cuffR, ref: [0, 0, 1], sides: 10 });
    items.push({ key: `cuff-${tag}`, id: L > 0.3 ? id : 'balbula-aurikulubentrikularrak', groups: ['balbula-aurikulubentrikularrak', 'endokardio-kuxinak'], ...cuff, color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' });
    // The leaflets, hanging from the rim into the ventricle (towards you), their free edges scalloped.
    if (L > 0.01) {
      const leafPoint = (arc: [number, number], u: number, v: number): V3 => {
        const a = lerp(arc[0], arc[1], u);
        const r = rimAt(a);
        const len = 0.52 * L * (0.72 + 0.28 * Math.sin(Math.PI * u));
        const inward = mix3(r, axis, close * v * 0.85);
        return [inward[0], inward[1] - 0.12 * v * L, inward[2] + len * v];
      };
      const dep = [q(L), q(close), q(o.x), q(thin)];
      const sheets = cachedMesh(`canal leaflets ${tag}`, dep, () => merge(arcs.map((arc) => {
        const m = grid(18, 8, (u, v) => leafPoint(arc, u, v));
        return merge([m, { ...m, idx: flipIdx(m.idx), nrm: m.nrm.map((n) => -n) }]);
      })));
      // Thick at first (a rolled free edge), thin once hollowed.
      const edges = arcs.map((arc) => tubeParts(Array.from({ length: 19 }, (_, i) => leafPoint(arc, i / 18, 1)), { radius: () => 0.012 + 0.032 * (1 - thin), ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }));
      const leafTone = mixHex(K.cushion, '#f4f0e4', thin * 0.6);
      items.push({ key: `leaf-${tag}`, id, groups: ['balbula-aurikulubentrikularrak'], mesh: sheets, color: leafTone, deep: K.cushionDeep, tissue: 'membrane', thin: thin, outline: false });
      items.push({ key: `leaf-edge-${tag}`, id, groups: ['balbula-aurikulubentrikularrak'], mesh: cachedMerge(edges.map((e) => e.mesh)), hit: cachedMerge(edges.map((e) => e.hit)), color: leafTone, deep: K.cushionDeep, tissue: 'membrane', outline: false });
      pts[id] = leafPoint(arcs[right ? 2 : 1], 0.5, 0.55);
      // Chordae of three orders: from the free edge, the middle, the base of each leaflet, to the nearest papillary muscle.
      if (s.chordae > 0.01) {
        const mine = tips.filter((p) => p.right === right);
        for (let order = 1; order <= 3; order++) {
          const from: [number, number][] = order === 1 ? [[0.3, 1], [0.7, 1]] : order === 2 ? [[0.5, 0.55]] : [[0.2, 0.18], [0.8, 0.18]];
          const cords = arcs.flatMap((arc) =>
            from.map(([u, v]) => {
              const a = leafPoint(arc, u, v);
              const p = mine.reduce((b, c) => (Math.hypot(c.tip[0] - a[0], c.tip[2] - a[2]) < Math.hypot(b.tip[0] - a[0], b.tip[2] - a[2]) ? c : b));
              const end = mix3(a, p.tip, clamp01(s.chordae));
              return tubeParts([a, mix3(a, end, 0.5), end], { radius: () => (order === 1 ? 0.011 : 0.014), ref: [1, 0, 0], sides: 6 });
            }),
          );
          const muscle = mixHex(right ? T.proximal : T.ventricle, '#c0606a', 0.5);
          const base = mixHex(muscle, K.chord, clamp01(s.fibrous));
          const tone = !s.order ? base : s.order === order ? '#ffd166' : mixHex(base, '#1a1418', 0.55);
          items.push({ key: `chord-${tag}-${order}`, id: 'soka-tendinosoak', mesh: cachedMerge(cords.map((c) => c.mesh)), hit: cachedMerge(cords.map((c) => c.hit)), color: tone, deep: '#6a6458', tissue: 'nerve', outline: false });
          const c0 = arcs[0];
          const a = leafPoint(c0, from[0][0], from[0][1]);
          const near = mine[0].tip;
          pts[`chord-${tag}-${order}`] = mix3(a, near, 0.45 * clamp01(s.chordae));
        }
        pts['soka-tendinosoak'] = pts[`chord-${tag}-1`];
      }
    }
  }
  pts['balbula-aurikulubentrikularrak'] = pts['balbula-trikuspidea'] ?? (() => {
    const o = orifice(s, true);
    return back(o.x - o.ea * 0.7, o.y - o.eb * 0.7, 0.9);
  })();
  // Papillary muscles: cones up from the floor (each ventricle's colour).
  if (s.papillary > 0.01) {
    const cones = tips.map((p) => tubeParts([p.base, mix3(p.base, p.tip, 0.55), p.tip], { radius: (u) => lerp(0.15, 0.05, u) * clamp01(s.papillary * 1.5), ref: [1, 0, 0], sides: 12, capEnd: true }));
    const r = cones.filter((_, i) => tips[i].right);
    const l = cones.filter((_, i) => !tips[i].right);
    items.push({ key: 'pap-r', id: 'muskulu-papilarrak', mesh: cachedMerge(r.map((c) => c.mesh)), hit: cachedMerge(r.map((c) => c.hit)), color: mixHex(T.proximal, '#ffffff', 0.1), deep: T.bulbusDeep, tissue: 'muscle' });
    items.push({ key: 'pap-l', id: 'muskulu-papilarrak', mesh: cachedMerge(l.map((c) => c.mesh)), hit: cachedMerge(l.map((c) => c.hit)), color: mixHex(T.ventricle, '#ffffff', 0.1), deep: T.ventricleDeep, tissue: 'muscle' });
    pts['muskulu-papilarrak'] = mix3(tips[1].base, tips[1].tip, 0.45);
    pts['pap-l'] = mix3(tips[2].base, tips[2].tip, 0.45);
  }
}

function flipIdx(idx: Uint32Array): Uint32Array {
  const out = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i += 3) {
    out[i] = idx[i];
    out[i + 1] = idx[i + 2];
    out[i + 2] = idx[i + 1];
  }
  return out;
}

// ———————————————————————————— blood ————————————————————————————

type Cells = { cells: Float32Array; gates: Float32Array };
function cellSet(n: number, pick: (i: number) => boolean, jit: number): Cells {
  const idx = Array.from({ length: n }, (_, i) => i).filter(pick);
  const cells = new Float32Array(idx.length * 4);
  const gates = new Float32Array(idx.length);
  idx.forEach((i, k) => {
    cells.set([i / n, Math.sin(i * 12.9) * 0.06 * jit, Math.cos(i * 7.3) * 0.05 * jit, Math.sin(i * 3.1) * 0.06 * jit], k * 4);
    gates[k] = ((i * 0.618034) % 1) * 0.85;
  });
  return { cells, gates };
}
const RED = cellSet(14, (i) => i % 3 !== 0, 0.6);
const BLUE = cellSet(14, (i) => i % 3 === 0, 0.6);
const CELL = () => cachedBlob({ center: [0, 0, 0], radii: [0.05, 0.036, 0.05], rings: 6, sides: 8 });
const SPEED = 30;
const OUT: V3[] = [[-0.8, -0.25, -0.02], [-0.78, 0.3, -0.02], [-0.72, 0.62, 0.1], [-0.55, 0.95, 0.3], [-0.38, 1.35, 0.4], [-0.1, 1.72, 0.42]];

function streams(s: CanalState, f: CanalFlow): Item3[] {
  if (f.show <= 0.01) return [];
  const out: Item3[] = [];
  const cell = CELL();
  const add = (key: string, pts: V3[], grow: number) => {
    if (grow <= 0.01) return;
    const route = vesselRouteOf(pts);
    const run = { route, phase: (f.phase * SPEED) / routeLength(route), grow: clamp01(grow) };
    out.push({ key: `flow-${key}-o2`, mesh: cell, color: T.o2, deep: T.o2Deep, tissue: 'skin', stream: { ...run, ...RED } });
    out.push({ key: `flow-${key}-de`, mesh: cell, color: T.deo2, deep: T.deo2Deep, tissue: 'skin', stream: { ...run, ...BLUE } });
  };
  const xo = Math.round(xOpen(s) * 20) / 20;
  const inAt = (x: number): V3[] => [[ATRIUM[0], ATRIUM[1] - 0.1, ATRIUM[2] + 0.2], [lerp(x, ATRIUM[0], 0.6), 0.4, -1.65], [x, YO + 0.05, -1.2], back(x, YO, 0.85)];
  const over = Math.round((ridgeTop(s, -0.25) + 0.22) * 20) / 20;
  // Into the left ventricle, over the ridge (the primary interventricular foramen) into the right one, out.
  const left = Math.max(0.12, xo + (s.fuse > 0.5 ? 0.3 : 0.15));
  add('left', [...inAt(left), [left + 0.25, -0.75, -0.2], [0.35, over, -0.25], [-0.35, over, -0.2], [-0.8, -0.55, -0.05], ...OUT], f.show);
  // Once the canal opens over both: straight into the right ventricle too.
  add('right', [...inAt(xo - 0.3), [-0.5, -0.7, -0.25], [-0.85, -0.45, -0.05], ...OUT], f.show * clamp01((s.shift - 0.6) / 0.4));
  return out;
}
