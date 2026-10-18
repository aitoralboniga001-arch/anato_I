import { type V3 } from '@/lib/three-d/math';
import { grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedBlob, cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { perfCount } from '@/lib/perf';
import { T } from '@/components/scenes/week10/common';
import { mixHex, routeLength, vesselRouteOf } from '@/components/scenes/week10/model3d';
import { K } from './common';

/**
 * M0 of topic 11 (notes 1, p5–p6): the two ways a septum grows, as three small chambers cut open from the
 * front, side by side, so the student compares them in one picture:
 * - A (mechanism 1): two endocardial cushions on opposite walls (roof and floor) grow towards each other
 *   and fuse: a complete septum. The front cut shows what a cushion is: a mint core of extracellular matrix
 *   covered by the pink endocardium, the same layer that lines the whole chamber;
 * - B (mechanism 1, the other way): one cushion on one wall grows until it reaches the opposite wall;
 * - C (mechanism 2): two primitive ventricles side by side (green right, cyan left); their inner muscular
 *   walls grow, touch and fuse into a muscular septum that stays incomplete: blood still passes over it.
 *
 * Axes as every heart model: x = the embryo's left, y = cranial, z = ventral (towards the viewer at yaw 0).
 * Each chamber is an ellipsoid opened by a frontal cut (z ≤ ZC); its septum grows in the sagittal plane
 * x = 0 of the chamber, as the heart's septa do. A is on the embryo's right (your left from the front).
 */

const RX = 1.15;
const RY = 0.72;
const RZ = 0.7;
/** The front cut. */
const ZC = 0.1;
/** Wall thickness (myocardium), and the endocardium's at the cut. */
const TH = 0.13;
const END = 0.035;
/** Where the three chambers stand. */
export const SPECIMEN_X = { a: -3.4, b: 0, c: 3.4 } as const;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const q = (v: number) => Math.round(v * 240) / 240;

/** A point of the inside of the wall by azimuth φ (0 front, 90 the embryo's left, 180 back) and polar θ (0 roof). */
function inner(phi: number, th: number, grow = 0): V3 {
  const p = (phi * Math.PI) / 180;
  const t = (th * Math.PI) / 180;
  return [(RX + grow) * Math.sin(t) * Math.sin(p), (RY + grow) * Math.cos(t), (RZ + grow) * Math.sin(t) * Math.cos(p)];
}
/** Where the front cut leaves the wall at polar angle θ (wall of depth radius rz). */
const phi0 = (th: number, rz: number) => {
  const r = rz * Math.sin((th * Math.PI) / 180);
  return r <= ZC ? 0 : (Math.acos(ZC / r) * 180) / Math.PI;
};
/** Height of the inside of the roof over (x, z). */
const roof = (x: number, z: number) => RY * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - (z / RZ) ** 2));

// ———————————————————————————— the chamber (built once) ————————————————————————————

type Part = { mesh: Mesh; hit: Mesh };
type Shell = { innerR: Part; innerL: Part; outerR: Part; outerL: Part; endoR: Part; endoL: Part; myoR: Part; myoL: Part };
let shell: Shell | null = null;
function shellOnce(): Shell {
  if (shell) return shell;
  // The inside (lining) and the outside, each in two halves: the embryo's right (x < 0) and left.
  const surf = (right: boolean, grow: number, coarse: number) =>
    grid(Math.round(22 / coarse), Math.round(40 / coarse), (u, v) => {
      const th = lerp(0.5, 179.5, v);
      const f = phi0(th, RZ + grow);
      const phi = right ? lerp(180, 360 - f, u) : lerp(f, 180, u);
      return inner(phi, th, grow);
    }, grow > 0 ? [right ? -9 : 9, 0, -9] : [0, 0, 0]);
  const part = (right: boolean, grow: number): Part => ({ mesh: surf(right, grow, 1), hit: surf(right, grow, 3) });
  // The cut face at the front: a ring of wall in the plane z = ZC, the endocardium its inner strip.
  const ring = (r0: number, r1: number, right: boolean, coarse: number) => {
    const s0 = Math.sqrt(1 - (ZC / RZ) ** 2);
    return grid(Math.round(36 / coarse), 2, (u, v) => {
      const a = right ? lerp(Math.PI / 2, (Math.PI * 3) / 2, u) : lerp(-Math.PI / 2, Math.PI / 2, u);
      const g = lerp(r0, r1, v);
      const sx = (RX + g) * (g === 0 ? s0 : Math.sqrt(Math.max(0, 1 - (ZC / (RZ + g)) ** 2)));
      const sy = (RY + g) * (g === 0 ? s0 : Math.sqrt(Math.max(0, 1 - (ZC / (RZ + g)) ** 2)));
      return [sx * Math.cos(a), sy * Math.sin(a), ZC];
    }, [0, 0, 9]);
  };
  const band = (r0: number, r1: number, right: boolean): Part => ({ mesh: ring(r0, r1, right, 1), hit: ring(r0, r1, right, 3) });
  shell = {
    innerR: part(true, 0),
    innerL: part(false, 0),
    outerR: part(true, TH),
    outerL: part(false, TH),
    endoR: band(0, END, true),
    endoL: band(0, END, false),
    myoR: band(END, TH, true),
    myoL: band(END, TH, false),
  };
  return shell;
}

// ———————————————————————————— cushions and walls ————————————————————————————

/**
 * A ridge across the roof (top) or the floor, at x = cx, in the chamber's sagittal plane: its section is a
 * half-ellipse of half-width w, its height a share `g` of the way to the chamber's middle (g = 1 reaches it;
 * g = 2 the opposite wall). Narrower towards the back, where the chamber narrows.
 */
interface Ridge {
  top: boolean;
  cx: number;
  w: number;
  g: number;
}
const taper = (z: number) => Math.min(1, 1.5 * Math.sqrt(Math.max(0, 1 - (z / RZ) ** 2)));
const zAt = (v: number) => lerp(-RZ * 0.985, ZC, v);
/** The ridge's surface: a = −90°…90° across its section, v back to front. */
function ridgePoint(r: Ridge, a: number, z: number, inset = 0): V3 {
  const w = Math.max(0, r.w * taper(z) - inset);
  const x = r.cx + w * Math.sin(a);
  const base = roof(x, z) + 0.02;
  const H = Math.max(0, r.g * (roof(r.cx, z) + 0.02) - inset) * Math.cos(a);
  const y = base - H;
  return [x, r.top ? y : -y, z];
}
/** A point on a ridge's axis at the front cut, a share `frac` of its height from its wall (at least `min` in). */
function cutAxis(r: Ridge, frac: number, min = 0): V3 {
  const base = roof(r.cx, ZC) + 0.02;
  const H = Math.min(r.g * base, 2 * base - 0.04);
  const y = base - Math.max(min, H * frac);
  return [r.cx, r.top ? y : -y, ZC + 0.01];
}
function ridgeMesh(r: Ridge, coarse: number): Mesh {
  return grid(Math.round(36 / coarse), Math.round(22 / coarse), (u, v) => ridgePoint(r, lerp(-Math.PI / 2, Math.PI / 2, u), zAt(v)), [r.cx, r.top ? -9 : 9, -0.2]);
}
/** The ridge's section at the front cut, filled from the wall to its surface (inset: the core inside its cover). */
function ridgeCap(r: Ridge, inset: number, dz: number): Mesh {
  return grid(30, 3, (u, v) => {
    const p = ridgePoint(r, lerp(-Math.PI / 2, Math.PI / 2, u), ZC, inset);
    const b = (r.top ? 1 : -1) * (roof(p[0], ZC) + 0.02);
    return [p[0], lerp(b, p[1], v), ZC + dz];
  }, [r.cx, 0, 9]);
}

/**
 * After the ridges meet, the septum: one wall across the chamber, from roof to floor and back to the cut,
 * each face at half-width W(y). `fill` smooths the waist where they met.
 */
function septumW(rs: readonly Ridge[], y: number, z: number, fill: number) {
  let W = 0;
  for (const r of rs) {
    const top = roof(r.cx, z) + 0.02;
    const h = r.g * top;
    const H = r.top ? top - y : y + top;
    if (H < h && h > 1e-4) W = Math.max(W, r.w * taper(z) * Math.sqrt(1 - (H / h) ** 2));
  }
  return Math.max(W, fill * 0.62 * rs[0].w * taper(z));
}
function septumFace(rs: readonly Ridge[], fill: number, side: -1 | 1, coarse: number): Mesh {
  return grid(Math.round(56 / coarse), Math.round(22 / coarse), (u, v) => {
    const z = zAt(v);
    const top = roof(0, z) + 0.02;
    const y = lerp(-top, top, u);
    return [side * septumW(rs, y, z, fill), y, z];
  }, [side * 9, 0, -0.2]);
}
function septumCap(rs: readonly Ridge[], fill: number, inset: number, dz: number): Mesh {
  const top = roof(0, ZC) + 0.02;
  return grid(56, 4, (u, v) => {
    const y = lerp(-top, top, u);
    const W = Math.max(0, septumW(rs, y, ZC, fill) - inset);
    return [lerp(-W, W, v), y, ZC + dz];
  }, [0, 0, 9]);
}

// ———————————————————————————— the state ————————————————————————————

export interface MechState {
  /** A: both cushions' height (1 = they meet in the middle), then fused. */
  a: number;
  aFuse: number;
  /** B: the one cushion's height (2 = it reaches the floor), then fused with the floor. */
  b: number;
  bFuse: number;
  /** C: the inner muscular walls grow (height) and come together; fused. */
  c: number;
  cFuse: number;
  /** Each chamber shown (0–1). */
  showA: number;
  showB: number;
  showC: number;
}
export const MECH0: MechState = { a: 0, aFuse: 0, b: 0, bFuse: 0, c: 0, cFuse: 0, showA: 1, showB: 1, showC: 1 };

export interface MechModel {
  items: Item3[];
  pts: Record<string, V3>;
}

const translate = (x: number) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1]);
const MAT = { a: translate(SPECIMEN_X.a), b: translate(SPECIMEN_X.b), c: translate(SPECIMEN_X.c) };
const at = (k: 'a' | 'b' | 'c', p: V3): V3 => [p[0] + SPECIMEN_X[k], p[1], p[2]];

/** Cushion and endocardium colours, as everywhere in topic 11. */
const LINING = mixHex(mixHex(T.endocard, T.myocard, 0.5), '#5a2a3a', 0.22);
const LINING_DEEP = '#5e1838';

export function mechanismModel(s: MechState, phase: number): MechModel {
  perfCount('mechanismModel');
  const S = shellOnce();
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};

  // —— A and B: a plain chamber, lined by endocardium, its wall myocardium ——
  const plain = (k: 'a' | 'b', show: number) => {
    if (show <= 0.01) return;
    const m = MAT[k];
    const base = { matrix: m, show };
    items.push({ key: `${k}-in-r`, id: 'endokardioa', ...S.innerR, ...base, color: LINING, deep: LINING_DEEP, tissue: 'epithelium' });
    items.push({ key: `${k}-in-l`, id: 'endokardioa', ...S.innerL, ...base, color: LINING, deep: LINING_DEEP, tissue: 'epithelium' });
    items.push({ key: `${k}-out`, id: 'miokardioa', mesh: S.outerR.mesh, hit: S.outerR.hit, ...base, color: T.myocard, deep: '#6e1340', tissue: 'muscle' });
    items.push({ key: `${k}-out-l`, id: 'miokardioa', mesh: S.outerL.mesh, hit: S.outerL.hit, ...base, color: T.myocard, deep: '#6e1340', tissue: 'muscle' });
    items.push({ key: `${k}-endo-cut`, id: 'endokardioa', mesh: cachedMesh('mech endo cut', [], () => merge([S.endoR.mesh, S.endoL.mesh])), ...base, color: T.endocard, deep: LINING_DEEP, tissue: 'epithelium', outline: false });
    items.push({ key: `${k}-myo-cut`, id: 'miokardioa', mesh: cachedMesh('mech myo cut', [], () => merge([S.myoR.mesh, S.myoL.mesh])), ...base, color: mixHex(T.myocard, '#ffffff', 0.12), deep: '#6e1340', tissue: 'muscle', outline: false });
    pts[`${k}-lining`] = at(k, inner(232, 118, -0.03));
    pts[`${k}-wall`] = at(k, [-RX * 0.62, -RY * 0.86 - TH * 0.5, ZC]);
  };
  plain('a', s.showA);
  plain('b', s.showB);

  // Cushions: the mint core, its pink cover; fused, one septum.
  const cushions = (k: 'a' | 'b', rs: Ridge[], fused: boolean, fill: number, show: number) => {
    if (show <= 0.01 || rs.every((r) => r.g < 0.01)) return;
    const base = { matrix: MAT[k], show };
    const dep = rs.flatMap((r) => [q(r.g), q(r.w)]).concat([q(fill), fused ? 1 : 0]);
    const surf = (coarse: number) => (fused ? merge([septumFace(rs, fill, -1, coarse), septumFace(rs, fill, 1, coarse)]) : merge(rs.filter((r) => r.g > 0.01).map((r) => ridgeMesh(r, coarse))));
    const mesh = cachedMesh(`mech ${k} cushion`, dep, () => surf(1));
    const hit = cachedMesh(`mech ${k} cushion hit`, dep, () => surf(3));
    const id = 'endokardio-kuxinak';
    items.push({ key: `${k}-cush`, id, mesh, hit, ...base, color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' });
    // The front cut: the pink cover (endocardium) round the mint core (extracellular matrix).
    const cover = cachedMesh(`mech ${k} cover`, dep, () => (fused ? septumCap(rs, fill, 0, 0.002) : merge(rs.filter((r) => r.g > 0.01).map((r) => ridgeCap(r, 0, 0.002)))));
    const core = cachedMesh(`mech ${k} core`, dep, () => (fused ? septumCap(rs, fill, END, 0.005) : merge(rs.filter((r) => r.g > 0.01).map((r) => ridgeCap(r, END, 0.005)))));
    items.push({ key: `${k}-cover`, id: 'endokardioa', groups: [id], mesh: cover, ...base, color: T.endocard, deep: LINING_DEEP, tissue: 'epithelium', outline: false });
    items.push({ key: `${k}-core`, id: 'kuxinaren-matrizea', groups: [id], mesh: core, ...base, color: mixHex(K.cushion, '#ffffff', 0.35), deep: K.cushionDeep, tissue: 'mesenchyme', outline: false });
    // Names on the cut face (seen from every camera of the stage): the pair on the lower cushion (or the
    // septum's lower part), the core and its cover on the upper one.
    const top = rs[0];
    const pair = rs.length > 1 && rs[1].g > 0.2 ? rs[1] : top;
    pts[`${k}-cush`] = fused ? at(k, [0, -0.3 * roof(0, ZC), ZC + 0.01]) : at(k, cutAxis(pair, pair === top ? 0.62 : 0.5));
    pts[`${k}-core`] = at(k, cutAxis(top, 0.38, END * 1.5));
    // The cover on the cushion's flank at the cut, a little in from the edge.
    const flank = ridgePoint(top, -1.0, ZC);
    pts[`${k}-cover`] = at(k, [flank[0] + 0.012, flank[1], ZC + 0.01]);
  };
  const W = 0.24;
  const aFused = s.a >= 1;
  cushions('a', [
    { top: true, cx: 0, w: W, g: Math.min(s.a, 1) + 0.06 * s.aFuse },
    { top: false, cx: 0, w: W, g: Math.min(s.a, 1) + 0.06 * s.aFuse },
  ], aFused, s.aFuse, s.showA);
  const bFused = s.b >= 2;
  cushions('b', [{ top: true, cx: 0, w: W, g: Math.min(s.b, 2) + 0.04 * s.bFuse }, { top: false, cx: 0, w: W * 1.1, g: 0.28 * s.bFuse }], bFused, s.bFuse, s.showB);

  // —— C: two primitive ventricles, their inner muscular walls rising from the floor ——
  if (s.showC > 0.01) {
    const base = { matrix: MAT.c, show: s.showC };
    const RV = { color: T.proximal, deep: T.bulbusDeep };
    const LV = { color: T.ventricle, deep: T.ventricleDeep };
    items.push({ key: 'c-in-r', id: 'hasierako-eskuineko-bentrikulua', ...S.innerR, ...base, ...RV, tissue: 'muscle' });
    items.push({ key: 'c-in-l', id: 'hasierako-ezkerreko-bentrikulua', ...S.innerL, ...base, ...LV, tissue: 'muscle' });
    items.push({ key: 'c-out-r', id: 'hasierako-eskuineko-bentrikulua', ...S.outerR, ...base, color: mixHex(T.proximal, '#10241a', 0.25), deep: T.bulbusDeep, tissue: 'muscle' });
    items.push({ key: 'c-out-l', id: 'hasierako-ezkerreko-bentrikulua', ...S.outerL, ...base, color: mixHex(T.ventricle, '#0c2026', 0.25), deep: T.ventricleDeep, tissue: 'muscle' });
    items.push({ key: 'c-cut-r', id: 'hasierako-eskuineko-bentrikulua', mesh: cachedMesh('mech c cut r', [], () => merge([S.endoR.mesh, S.myoR.mesh])), ...base, color: mixHex(T.proximal, '#ffffff', 0.18), deep: T.bulbusDeep, tissue: 'muscle', outline: false });
    items.push({ key: 'c-cut-l', id: 'hasierako-ezkerreko-bentrikulua', mesh: cachedMesh('mech c cut l', [], () => merge([S.endoL.mesh, S.myoL.mesh])), ...base, color: mixHex(T.ventricle, '#ffffff', 0.18), deep: T.ventricleDeep, tissue: 'muscle', outline: false });
    pts['c-rv'] = at('c', inner(256, 112, -0.03));
    pts['c-lv'] = at('c', inner(104, 112, -0.03));
    // The two walls: they rise (to well under the roof) and come together; fused, one two-tone ridge.
    const g = lerp(0.12, 1.15, clamp01(s.c));
    const wc = 0.2;
    const d = lerp(lerp(0.44, wc * 0.8, clamp01((s.c - 0.25) / 0.75)), 0.07, clamp01(s.cFuse));
    const walls: [string, Ridge, { color: string; deep: string }][] = [
      ['r', { top: false, cx: -d, w: wc, g }, RV],
      ['l', { top: false, cx: d, w: wc, g }, LV],
    ];
    const id = s.cFuse > 0.5 ? 'trenkada-muskularra' : undefined;
    for (const [side, r, tone] of walls) {
      const dep = [q(g), q(d)];
      const mesh = cachedMesh(`mech c wall ${side}`, dep, () => ridgeMesh(r, 1));
      const hit = cachedMesh(`mech c wall ${side} hit`, dep, () => ridgeMesh(r, 3));
      const owner = side === 'r' ? 'hasierako-eskuineko-bentrikulua' : 'hasierako-ezkerreko-bentrikulua';
      items.push({ key: `c-wall-${side}`, id: id ?? owner, groups: ['trenkada-muskularra', owner], mesh, hit, ...base, color: mixHex(tone.color, '#ffffff', 0.08), deep: tone.deep, tissue: 'muscle' });
      items.push({ key: `c-wall-cap-${side}`, groups: ['trenkada-muskularra'], mesh: cachedMesh(`mech c cap ${side}`, dep, () => ridgeCap(r, 0, side === 'r' ? 0.002 : 0.004)), ...base, color: mixHex(tone.color, '#ffffff', 0.2), deep: tone.deep, tissue: 'muscle', outline: false });
    }
    // On the cut face: the fused septum on its seam, each wall on its own middle.
    pts['c-septum'] = at('c', cutAxis({ top: false, cx: 0, w: wc, g }, 0.5));
    pts['c-wall-r'] = at('c', cutAxis(walls[0][1], 0.45));
  }

  items.push(...streams(s, phase));
  return { items, pts };
}

// ———————————————————————————— blood ————————————————————————————

type Cells = { cells: Float32Array; gates: Float32Array };
function cellSet(n: number, pick: (i: number) => boolean, jit: number): Cells {
  const idx = Array.from({ length: n }, (_, i) => i).filter(pick);
  const cells = new Float32Array(idx.length * 4);
  const gates = new Float32Array(idx.length);
  idx.forEach((i, k) => {
    cells.set([i / n, Math.sin(i * 12.9) * 0.05 * jit, Math.cos(i * 7.3) * 0.04 * jit, Math.sin(i * 3.1) * 0.05 * jit], k * 4);
    gates[k] = ((i * 0.618034) % 1) * 0.85;
  });
  return { cells, gates };
}
const RED = cellSet(9, (i) => i % 3 !== 0, 0.5);
const BLUE = cellSet(9, (i) => i % 3 === 0, 0.5);
const CELL = () => cachedBlob({ center: [0, 0, 0], radii: [0.045, 0.032, 0.045], rings: 6, sides: 8 });
const SPEED = 22;

function streams(s: MechState, phase: number): Item3[] {
  const out: Item3[] = [];
  const cell = CELL();
  const add = (key: string, pts: V3[], grow: number) => {
    if (grow <= 0.01) return;
    const route = vesselRouteOf(pts);
    const run = { route, phase: (phase * SPEED) / routeLength(route), grow: clamp01(grow) };
    out.push({ key: `flow-${key}-o2`, mesh: cell, color: T.o2, deep: T.o2Deep, tissue: 'skin', stream: { ...run, ...RED } });
    out.push({ key: `flow-${key}-de`, mesh: cell, color: T.deo2, deep: T.deo2Deep, tissue: 'skin', stream: { ...run, ...BLUE } });
  };
  // From the right half into the left, through whatever gap the septum leaves.
  const across = (k: 'a' | 'b' | 'c', y: number): V3[] => [at(k, [-0.82, y - 0.05, -0.18]), at(k, [-0.42, y, -0.12]), at(k, [0, y, -0.1]), at(k, [0.42, y, -0.12]), at(k, [0.82, y - 0.05, -0.18])];
  // A: through the middle, until the cushions close the gap.
  add('a', across('a', 0), s.showA * (1 - clamp01((s.a - 0.72) / 0.22)));
  // B: under the cushion's tip, until it reaches the floor.
  const tipB = roof(0, -0.1) + 0.02 - Math.min(s.b, 2) * (roof(0, -0.1) + 0.02);
  const yB = Math.round(((tipB - roof(0, -0.1)) / 2) * 25) / 25;
  add('b', across('b', yB), s.showB * (1 - clamp01((s.b - 1.55) / 0.35)));
  // C: over the top of the muscular septum: it never closes.
  const hC = lerp(0.12, 1.15, clamp01(s.c)) * (roof(0, -0.1) + 0.02);
  const yC = Math.round(((-(roof(0, -0.1) + 0.02) + hC + roof(0, -0.1)) / 2) * 25) / 25;
  add('c', across('c', Math.max(yC, 0)), s.showC);
  return out;
}
