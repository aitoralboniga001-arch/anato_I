'use client';

import { useId } from 'react';
import { Arrow, C, Label, Note, Part, clamp, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Sheet, f1, offset, poly, resample, sm, spline, vis } from './common';

/**
 * Topic 7 sagittal section of the ~4–5 week embryo (apunteen 24. orriko irudiak: "Hasierako perikardio
 * barrunbea · Septum transversuma · Erreten perikardioperitonealak · Peritoneo barrunbea"; Langman 15.1).
 * Ventral is on the left, dorsal on the right, cranial at the top. The C-shaped body is built round its
 * neural tube (brain vesicles → spinal cord → tail): the back is the tube moved outwards, so the somites,
 * notochord and dorsal aorta follow the same curve. In the ventral concavity: the pharynx behind the
 * stomodeum, the looping heart in the cranial coelom, the septum transversum under it (the sinus venosus
 * and the liver bud already in it), the gut hanging from its dorsal mesentery, the cord with the vitelline
 * duct and the allantois.
 *
 * One drawing serves two stages:
 *  - `zeloma` (§1): the intra-embryonic coelom is one continuous cavity from the future thorax to the
 *    future abdomen;
 *  - `septum-transversum` (§2): the septum condenses at C3–C5 as a mesenchymal plate between the heart
 *    and the gut, anchored ventrally on the body wall and dorsally on the mesenchyme round the oesophagus;
 *    it splits the coelom into the primitive pericardial cavity (above) and the peritoneal cavity (below),
 *    except for the two dorsolateral pericardioperitoneal canals (shown beside the plane, and in a loupe
 *    as the transverse section at the septum).
 */

const cum = (pts: readonly Pt[]) => {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = out[out.length - 1] || 1;
  return out.map((v) => v / L);
};
/** Piecewise-linear lookup in a sorted [u, value] table. */
function table(u: number, tab: readonly [number, number][]) {
  if (u <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++)
    if (u <= tab[i][0]) {
      const [a, va] = tab[i - 1];
      const [b, vb] = tab[i];
      return lerp(va, vb, (u - a) / (b - a || 1));
    }
  return tab[tab.length - 1][1];
}
/** Indices of a polyline whose arc-length fraction lies in [a, b]. */
const span = (pts: readonly Pt[], us: readonly number[], a: number, b: number) => pts.filter((_, i) => us[i] >= a && us[i] <= b);

/** A closed tube round a centre line, half-width per sample, with round caps. */
function tubePts(pts: readonly Pt[], hw: readonly number[], caps = true): Pt[] {
  const a = offset(pts, (i) => hw[i]);
  const b = offset(pts, (i) => -hw[i]);
  if (!caps) return [...a, ...b.reverse()];
  const cap = (p: Pt, q: Pt, r: number, from: Pt): Pt[] => {
    // Half circle round p, away from q, starting at `from`.
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
    const ux = (p[0] - q[0]) / d;
    const uy = (p[1] - q[1]) / d;
    const a0 = Math.atan2(from[1] - p[1], from[0] - p[0]);
    const cross = (from[0] - p[0]) * uy - (from[1] - p[1]) * ux;
    const dir = cross > 0 ? -1 : 1;
    return Array.from({ length: 7 }, (_, k) => {
      const ang = a0 + (dir * Math.PI * (k + 1)) / 8;
      return [p[0] + Math.cos(ang) * r, p[1] + Math.sin(ang) * r] as Pt;
    });
  };
  const n = pts.length - 1;
  const end = cap(pts[n], pts[n - 1], hw[n], a[n]);
  const start = cap(pts[0], pts[1], hw[0], b[0]);
  return [...a, ...end, ...b.reverse(), ...start];
}
const tubeD = (pts: readonly Pt[], hw: readonly number[], caps = true) => smoothPath(tubePts(pts, hw, caps), true, 0.3);

function inPoly(p: Pt, pts: readonly Pt[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ——— Neural tube: forebrain → midbrain (top) → hindbrain (thin roof) → spinal cord → tail. ———
const NT_KEYS: Pt[] = [
  [426, 182], [414, 136], [434, 96], [480, 66], [540, 52], [604, 62], [654, 96], [688, 150], [706, 222], [714, 300], [708, 378], [690, 444], [658, 498], [616, 534], [576, 552], [548, 556],
];
const NT = spline(NT_KEYS, 10);
const NT_U = cum(NT);
// Vesicles and their constrictions: forebrain, midbrain, isthmus, hindbrain, then the cord.
const NT_HW = NT_U.map((u) => table(u, [[0, 42], [0.05, 46], [0.11, 40], [0.14, 36], [0.19, 41], [0.24, 39], [0.27, 33], [0.33, 38], [0.4, 30], [0.47, 13], [0.88, 10], [1, 4.5]]));
/** The lumen sits dorsally in the hindbrain (the thin roof of the fourth ventricle). */
const NT_LUMEN_C = offset(NT, (i) => table(NT_U[i], [[0, 0], [0.26, 0], [0.33, 12], [0.42, 8], [0.47, 0]]));
const NT_LUMEN_HW = NT_U.map((u, i) => (u < 0.45 ? NT_HW[i] * table(u, [[0, 0.66], [0.14, 0.5], [0.2, 0.6], [0.27, 0.45], [0.32, 0.66], [0.45, 0.4]]) : table(u, [[0.45, 6], [0.5, 3.2], [1, 1.4]])));
/** The brain is drawn as a union of discs along its axis (a thick tube on a tight curve would fold over itself). */
const I_CORD = NT_U.findIndex((u) => u >= 0.42);
const BRAIN_DISCS = NT.slice(0, I_CORD + 4).map((p, i) => ({ p, r: NT_HW[i] }));
const BRAIN_LUMEN = NT_LUMEN_C.slice(0, I_CORD + 4).map((p, i) => ({ p, r: NT_LUMEN_HW[i] }));
/** Back of the body: the neural tube moved outwards (dorsal skin and the mesenchyme over it). */
const DORSAL = offset(NT, (i) => NT_HW[i] + 15);
/** Ventral surface, tail tip → face: tail, cloacal region, cord root, liver, heart prominence, stomodeum, forehead. */
const VENTRAL = spline(
  [
    [532, 576], [526, 562], [534, 548], [556, 538], [574, 528], [554, 518], [520, 512], [494, 504], [468, 488], [442, 476], [418, 458], [400, 432], [388, 410], [372, 382], [358, 344], [356, 306],
    [364, 276], [382, 262], [402, 256], [420, 254], [404, 244], [384, 230], [370, 210],
  ],
  6,
);
const BODY: Pt[] = [...DORSAL, ...VENTRAL];
const NOTOCHORD = span(offset(NT, (i) => -(NT_HW[i] + 5)), NT_U, 0.3, 0.97);
const AORTA = span(offset(NT, (i) => -(NT_HW[i] + 34)), NT_U, 0.44, 0.92);
const MES_ROOT = span(offset(NT, (i) => -(NT_HW[i] + 44)), NT_U, 0.58, 0.86);

// ——— Gut: mouth → pharynx → oesophagus → stomach → duodenum → midgut loop (to the yolk stalk) → hindgut → cloaca. ———
const GUT = spline(
  [
    [420, 252], [460, 236], [510, 214], [560, 198], [606, 192], [638, 208], [648, 242], [644, 282], [638, 320], [634, 352], [628, 386], [612, 412], [584, 430], [548, 446], [516, 462], [534, 478],
    [568, 484], [598, 492], [606, 508], [588, 520],
  ],
  8,
);
const GUT_U = cum(GUT);
const GUT_HW = GUT_U.map((u) => table(u, [[0, 15], [0.18, 17], [0.27, 12], [0.33, 7], [0.42, 7], [0.47, 12], [0.53, 12], [0.58, 8], [0.85, 7], [0.94, 9], [1, 11]]));
const GUT_LUMEN = GUT_HW.map((h, i) => (GUT_U[i] < 0.3 ? h - 5 : Math.max(1.6, h - 5.5)));
const u2i = (u: number) => GUT_U.findIndex((v) => v >= u);
const I_ESO = [u2i(0.27), u2i(0.45)] as const;
const I_MID = u2i(0.72); // apex of the midgut loop, at the yolk stalk
/** The gut below the septum, hung from the dorsal wall. */
const GUT_ABD = GUT.slice(u2i(0.45));

// Umbilical cord, the vitelline duct out of the midgut loop and the allantois out of the cloaca.
const CORD = spline([[480, 494], [436, 512], [380, 534], [320, 558], [270, 580]], 8);
const CORD_HW = cum(CORD).map((u) => lerp(30, 22, u));
const DUCT = spline([GUT[I_MID], [484, 482], [436, 504], [380, 528], [320, 552], [262, 576]], 8);
const ALLANTOIS = spline([[590, 516], [560, 508], [526, 506], [488, 512], [440, 530], [380, 552], [320, 574], [272, 592]], 8);

// ——— Coelom (one cavity at first): round the heart, under the septum round the gut. ———
const COELOM = spline(
  [
    [378, 284], [410, 268], [454, 258], [500, 240], [552, 224], [600, 218], [618, 240], [620, 286], [630, 340], [656, 368], [666, 410], [662, 452], [646, 484], [614, 502], [576, 506], [540, 498],
    [506, 486], [476, 474], [446, 460], [420, 442], [400, 414], [384, 376], [374, 336], [372, 304],
  ],
  8,
  true,
);

// ——— Heart: sinus venosus (in the septum) → atrium → ventricle (ventral loop) → bulbus → truncus → aortic sac. ———
const HEART = spline([[606, 334], [588, 312], [562, 294], [532, 290], [506, 306], [486, 330], [462, 350], [430, 350], [408, 330], [402, 298], [418, 270], [452, 254], [490, 246]], 8);
const HEART_U = cum(HEART);
const HEART_HW = HEART_U.map((u) => table(u, [[0, 9], [0.12, 12], [0.22, 15], [0.32, 14], [0.4, 11], [0.5, 16], [0.6, 18], [0.7, 16], [0.8, 13], [0.9, 9], [1, 11]]));
const HEART_C: Pt = [500, 312];
/** The chambers swell out of the tube: atrium (dorsal, cranial), ventricle (ventral, caudal). */
const ATRIUM = { cx: 546, cy: 290, rx: 38, ry: 25, rot: -12 };
const VENTRICLE = { cx: 444, cy: 338, rx: 44, ry: 28, rot: 14 };

// ——— Septum transversum: a thick plate from the ventral body wall to the mesenchyme round the oesophagus. ———
const SEPTUM_TOP: Pt[] = [[384, 404], [440, 390], [500, 370], [560, 344], [618, 314]];
const SEPTUM_BOT: Pt[] = [[398, 456], [456, 446], [514, 424], [572, 392], [624, 352]];
const SEPTUM_A: Pt = [390, 430];
const SEPTUM_B: Pt = [621, 333];
/** The plate grows from the ventral wall: `reach` 0..1 of its length (the dorsal end meets the oesophageal mesenchyme at 1). */
function septumPoly(reach: number): Pt[] {
  const cut = (pts: Pt[]) => {
    const all = spline(pts, 8);
    const us = cum(all);
    const out = all.filter((_, i) => us[i] <= reach);
    return out.length ? out : [all[0]];
  };
  const top = cut(SEPTUM_TOP);
  const bot = cut(SEPTUM_BOT);
  const e0 = top[top.length - 1];
  const e1 = bot[bot.length - 1];
  const dx = SEPTUM_B[0] - SEPTUM_A[0];
  const dy = SEPTUM_B[1] - SEPTUM_A[1];
  const L = Math.hypot(dx, dy);
  const bulge = reach < 0.995 ? 9 : 2;
  const tip: Pt = [(e0[0] + e1[0]) / 2 + (dx / L) * bulge, (e0[1] + e1[1]) / 2 + (dy / L) * bulge];
  // Ventral end sunk into the body wall.
  const sink: Pt = [SEPTUM_A[0] - 10, SEPTUM_A[1] + 2];
  return [sink, ...top, tip, ...bot.reverse()];
}
const SEPTUM_FULL = septumPoly(1);
/** Mesenchymal cells that condense into the plate (targets inside it, ordered ventral → dorsal). */
const SEPTUM_CELLS = (() => {
  const out: { p: Pt; from: Pt; k: number; r: number }[] = [];
  const dx = SEPTUM_B[0] - SEPTUM_A[0];
  const dy = SEPTUM_B[1] - SEPTUM_A[1];
  const L = Math.hypot(dx, dy);
  for (let s = 1; out.length < 120 && s < 4000; s++) {
    const p: Pt = [lerp(370, 630, rand(s * 3.1)), lerp(290, 440, rand(s * 7.7))];
    if (!inPoly(p, SEPTUM_FULL)) continue;
    const k = clamp(((p[0] - SEPTUM_A[0]) * dx + (p[1] - SEPTUM_A[1]) * dy) / (L * L));
    // They gather from the loose mesenchyme on both sides of the future plate.
    const side = rand(s * 5.3) > 0.5 ? 1 : -1;
    const d = 24 + 34 * rand(s * 9.1);
    const from: Pt = [p[0] + (-dy / L) * d * side + (rand(s * 2.2) - 0.5) * 30, p[1] + (dx / L) * d * side + (rand(s * 4.4) - 0.5) * 24];
    out.push({ p, from, k, r: 2.3 + rand(s * 6.6) * 1.2 });
  }
  return out;
})();
/** Line along the septum's middle, prolonged both ways: the border between the two cavity halves. */
const SPLIT_LINE: Pt[] = [[0, 540], [300, 470], SEPTUM_A, [510, 390], SEPTUM_B, [700, 296], [1000, 170]];

// The oesophageal mesenchyme (dorsal anchor of the septum) and the pericardioperitoneal canal beside it.
const ESO_MES: Pt[] = spline([[622, 252], [654, 246], [664, 280], [664, 330], [656, 364], [632, 372], [618, 344], [616, 296]], 6, true);
const CANAL = spline([[600, 284], [624, 288], [640, 306], [646, 340], [650, 384]], 8);
const CANAL_MID: Pt = [644, 326];

// ——— Somites: a row along the back; C3–C5 face the septum. ———
const SOMITE_LINE = span(offset(NT, (i) => -(NT_HW[i] + 21)), NT_U, 0.33, 0.99);
/** Arc position (px along SOMITE_LINE) of the somite level of the septum's axis. */
const SOMITE_AT = (() => {
  const dx = SEPTUM_B[0] - SEPTUM_A[0];
  const dy = SEPTUM_B[1] - SEPTUM_A[1];
  let best = 0;
  let bd = Infinity;
  let acc = 0;
  SOMITE_LINE.forEach((p, i) => {
    if (i) acc += Math.hypot(p[0] - SOMITE_LINE[i - 1][0], p[1] - SOMITE_LINE[i - 1][1]);
    const d = Math.abs((p[0] - SEPTUM_A[0]) * dy - (p[1] - SEPTUM_A[1]) * dx) / Math.hypot(dx, dy);
    if (d < bd) {
      bd = d;
      best = acc;
    }
  });
  return best;
})();
const SOMITE_STEP = 15.5;
/** Somite numbering: 4 occipital, 8 cervical (C1–C8)… so C3–C5 are indices 6–8 and C4 faces the septum. */
const C3 = 6;
const SOMITES: { p: Pt; a: number; s: number }[] = (() => {
  const line = SOMITE_LINE;
  const us = cum(line);
  const L = (() => {
    let s = 0;
    for (let i = 1; i < line.length; i++) s += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    return s;
  })();
  const out: { p: Pt; a: number; s: number }[] = [];
  for (let k = 0; k < 40; k++) {
    const d = SOMITE_AT + (k - (C3 + 1)) * SOMITE_STEP * (k > C3 + 1 ? 1 - (k - C3) * 0.006 : 1);
    if (d < 0 || d > L - 4) continue;
    const u = d / L;
    const i = Math.max(1, us.findIndex((v) => v >= u));
    const p = line[i];
    const q = line[i - 1];
    out[k] = { p, a: (Math.atan2(p[1] - q[1], p[0] - q[0]) * 180) / Math.PI, s: k < 4 ? 0.9 : Math.max(0.55, 1 - Math.max(0, k - 20) * 0.025) };
  }
  return out;
})();

interface Look {
  /** 0..1 how far the septal plate has grown from the ventral wall (1 = fused with the oesophageal mesenchyme). */
  reach: number;
  /** 0..1 the mesenchymal cells gathering into the plate. */
  cells: number;
  /** 0..1 the plate as a solid tissue. */
  solid: number;
  /** 0..1: the coelom tint changes from one cavity to the two (pericardial / peritoneal). */
  split: number;
  /** 0..1 visibility of the canals and their flow. */
  canals: number;
  /** Highlight of the C3–C5 somites. */
  levels: number;
  /** Visibility of the oesophageal mesenchyme. */
  eso: number;
  /** 0..1 glow on the two anchors of the plate (ventral wall, oesophageal mesenchyme). */
  anchors: number;
  /** 0..1 the undivided coelom's tint filling from cranial to caudal (1 = full). */
  pour?: number;
  reduced: boolean;
}

function LateralDrawing({ reach, cells, solid, split, canals, levels, eso, anchors, pour = 1, reduced }: Look) {
  const cid = useId().replace(/:/g, '');
  const sep = septumPoly(Math.max(0.02, reach));
  const sepD = smoothPath(sep, true, 0.25);
  const heartD = tubeD(HEART, HEART_HW);
  const heartLumen = tubeD(HEART, HEART_HW.map((h) => Math.max(2, h - 6)));
  const skinIn = offset(BODY, -8, true);
  const bodyD = smoothPath(BODY, true, 0.3);
  const coelomD = smoothPath(COELOM, true, 0.3);
  const heartPath = smoothPath(HEART, false, 0.3);
  const beating = !reduced;
  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id={`w7-lat-up${cid}`}>
          <path d={poly([...SPLIT_LINE, [1000, 0], [0, 0]])} />
        </clipPath>
        <clipPath id={`w7-lat-dn${cid}`}>
          <path d={poly([...SPLIT_LINE, [1000, 640], [0, 640]])} />
        </clipPath>
        {/* Soft-edged growing discs: each cavity's tint spreads from its own centre. */}
        <radialGradient id={`w7-lat-soft${cid}`}>
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`w7-lat-pw${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <circle cx={HEART_C[0]} cy={HEART_C[1]} r={lerp(1, 340, split)} fill={`url(#w7-lat-soft${cid})`} />
        </mask>
        <mask id={`w7-lat-dw${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <circle cx={560} cy={400} r={lerp(1, 300, split)} fill={`url(#w7-lat-soft${cid})`} />
        </mask>
        {/* The undivided coelom's tint pours from the cranial end to the caudal end. */}
        <linearGradient id={`w7-lat-pour${cid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset={f1(Math.max(0, pour * 1.15 - 0.15))} stopColor="#fff" />
          <stop offset={f1(Math.min(1, pour * 1.15))} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`w7-lat-pm${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={300} y={200} width={400} height={330} fill={`url(#w7-lat-pour${cid})`} />
        </mask>
        <clipPath id={`w7-lat-body${cid}`}>
          <path d={bodyD} />
        </clipPath>
        <radialGradient id={`w7-lat-heart${cid}`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f06a7e" />
          <stop offset="0.55" stopColor="#c62d42" />
          <stop offset="1" stopColor="#7d1527" />
        </radialGradient>
        <radialGradient id={`w7-lat-atrium${cid}`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#d9546a" />
          <stop offset="1" stopColor="#6e1222" />
        </radialGradient>
        <radialGradient id={`w7-lat-brain${cid}`} cx="40%" cy="30%" r="75%">
          <stop offset="0" stopColor="#5b7fe8" />
          <stop offset="1" stopColor="#2c46a8" />
        </radialGradient>
        <linearGradient id={`w7-lat-level${cid}`} gradientUnits="userSpaceOnUse" x1={SEPTUM_A[0]} y1={SEPTUM_A[1]} x2={760} y2={260}>
          <stop offset="0" stopColor="#ffb86b" stopOpacity={0.05} />
          <stop offset="0.75" stopColor="#ffb86b" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ffb86b" stopOpacity={0.32} />
        </linearGradient>
      </defs>

      {/* Umbilical cord (behind the body): its connective tissue, the umbilical vessels, the vitelline duct and the allantois. */}
      <path d={tubeD(CORD, CORD_HW, false)} fill="#cdb9a8" stroke="rgba(60,40,30,0.55)" strokeWidth={1} />
      <path d={tubeD(CORD, CORD_HW, false)} fill="url(#w7-light)" />
      <path d={smoothPath(offset(CORD, 13), false, 0.3)} fill="none" stroke={C.artery} strokeWidth={3} opacity={0.75} />
      <path d={smoothPath(offset(CORD, -14), false, 0.3)} fill="none" stroke={C.vein} strokeWidth={3.6} opacity={0.75} />

      {/* Body: body wall and mesenchyme. */}
      <Part id="gorputz-paretako-mesodermoa" quiet>
        <path d={bodyD} fill={P.wall} />
        <path d={bodyD} fill="url(#w7-mesench)" />
      </Part>

      {/* The septum's level: a soft band from the ventral wall to the C3–C5 somites. */}
      {levels > 0.01 && (
        <g clipPath={`url(#w7-lat-body${cid})`} opacity={levels} pointerEvents="none">
          <path d={poly([[300, 452], [360, 432], SEPTUM_A, [500, 366], SEPTUM_B, [700, 282], [800, 240], [800, 196], [700, 236], [612, 276], [500, 324], [389, 371], [360, 386], [300, 410]])} fill={`url(#w7-lat-level${cid})`} />
        </g>
      )}

      {/* Coelom: dark space, tinted as one cavity, then as its two halves (each one spreading from its own centre). */}
      <path d={coelomD} fill={P.space} />
      <Part id="enbrioi-barruko-zeloma" show={1 - split}>
        <path d={coelomD} fill={P.coelom} mask={pour < 0.999 ? `url(#w7-lat-pm${cid})` : undefined} />
      </Part>
      <Part id="hasierako-perikardio-barrunbea" show={split > 0.01 ? 1 : 0}>
        <g clipPath={`url(#w7-lat-up${cid})`}>
          <path d={coelomD} fill={P.peri} mask={`url(#w7-lat-pw${cid})`} />
        </g>
      </Part>
      <Part id="peritoneo-barrunbea" show={split > 0.01 ? 1 : 0}>
        <g clipPath={`url(#w7-lat-dn${cid})`}>
          <path d={coelomD} fill={P.perito} mask={`url(#w7-lat-dw${cid})`} />
        </g>
      </Part>
      {/* The lining of the coelom (mesothelium): a fine bright edge. */}
      <path d={coelomD} fill="none" stroke="rgba(255,200,190,0.35)" strokeWidth={1.4} />

      {/* Dorsal mesentery: the abdominal gut hangs from the dorsal wall below the septum. */}
      <Part id="mesenterio-dortsala">
        <path d={smoothPath([...GUT_ABD, ...[...MES_ROOT].reverse()], true, 0.3)} fill="#c9707a" opacity={0.5} />
        <path d={smoothPath([...GUT_ABD, ...[...MES_ROOT].reverse()], true, 0.3)} fill="url(#w7-mesench)" />
      </Part>

      {/* Somites (beside the plane): the C3–C5 trio lights up when the septum's level is the point. */}
      <Part id="somitak">
        {SOMITES.map((sm_, i) => {
          if (!sm_) return null;
          const { p, a, s } = sm_;
          const lit = i >= C3 && i <= C3 + 2 ? levels : 0;
          return (
            <g key={i} transform={`translate(${f1(p[0])} ${f1(p[1])}) rotate(${f1(a)}) scale(${s})`}>
              <rect x={-7} y={-7.5} width={14} height={15} rx={4.5} fill={lit > 0.5 ? '#ff7b6b' : C.mesoParaxial} stroke={lit > 0.5 ? '#ffd2a8' : 'rgba(80,6,18,0.7)'} strokeWidth={lit > 0.5 ? 1.8 : 0.9} />
              <circle r={2.1} fill="rgba(80,6,18,0.7)" />
            </g>
          );
        })}
      </Part>

      {/* Notochord and dorsal aorta along the back. */}
      <Part id="notokorda" quiet>
        <path d={smoothPath(NOTOCHORD, false, 0.3)} fill="none" stroke={C.notochord} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      </Part>
      <Part id="aorta-dortsalak" quiet>
        <path d={smoothPath(AORTA, false, 0.3)} fill="none" stroke="#7d1527" strokeWidth={7} strokeLinecap="round" />
        <path d={smoothPath(AORTA, false, 0.3)} fill="none" stroke={C.artery} strokeWidth={4.6} strokeLinecap="round" />
        <path d={smoothPath(AORTA, false, 0.3)} fill="none" stroke="#ffb3b3" strokeWidth={1.4} strokeDasharray="3 10" className={beating ? 'dash-flow' : undefined} opacity={0.8} />
      </Part>

      {/* Neural tube: brain vesicles (forebrain, midbrain, hindbrain with its thin roof) and the spinal cord. */}
      <Part id="hodi-neurala">
        <g fill="rgba(10,16,48,0.85)">
          {BRAIN_DISCS.map((d, i) => (
            <circle key={i} cx={f1(d.p[0])} cy={f1(d.p[1])} r={d.r + 1.4} />
          ))}
          <path d={tubeD(NT.slice(I_CORD), NT_HW.slice(I_CORD).map((h) => h + 1.4))} />
        </g>
        <g fill={C.neural}>
          <path d={tubeD(NT.slice(I_CORD), NT_HW.slice(I_CORD))} />
          {BRAIN_DISCS.map((d, i) => (
            <circle key={i} cx={f1(d.p[0])} cy={f1(d.p[1])} r={d.r} />
          ))}
        </g>
        {/* Neuroepithelium: a lighter inner zone round the ventricles. */}
        <g fill="#6f8ff0" opacity={0.5}>
          {BRAIN_LUMEN.map((d, i) => (
            <circle key={i} cx={f1(d.p[0])} cy={f1(d.p[1])} r={d.r + 6} />
          ))}
        </g>
        <g fill="#101a3a">
          {BRAIN_LUMEN.map((d, i) => (
            <circle key={i} cx={f1(d.p[0])} cy={f1(d.p[1])} r={d.r} />
          ))}
          <path d={tubeD(NT_LUMEN_C.slice(I_CORD), NT_LUMEN_HW.slice(I_CORD), false)} />
        </g>
      </Part>

      {/* Gut tube: endoderm wall and lumen. */}
      <Part id="aurreko-hestea">
        <path d={tubeD(GUT.slice(0, I_ESO[1] + 1), GUT_HW.slice(0, I_ESO[1] + 1))} fill={P.gut} stroke="rgba(90,60,10,0.6)" strokeWidth={1} />
        <path d={tubeD(GUT.slice(0, I_ESO[1] + 1), GUT_LUMEN.slice(0, I_ESO[1] + 1))} fill="#3a2a10" />
      </Part>
      <Part id="erdiko-hestea">
        <path d={tubeD(GUT.slice(I_ESO[1]), GUT_HW.slice(I_ESO[1]))} fill={P.gut} stroke="rgba(90,60,10,0.6)" strokeWidth={1} />
        <path d={tubeD(GUT.slice(I_ESO[1]), GUT_LUMEN.slice(I_ESO[1]))} fill="#3a2a10" />
      </Part>
      <Part id="hodi-onfalomesenterikoa">
        <path d={tubeD(DUCT, DUCT.map(() => 4.5))} fill="#e5b84a" stroke="rgba(90,60,10,0.6)" strokeWidth={0.8} />
      </Part>
      <Part id="alantoidea" quiet>
        <path d={tubeD(ALLANTOIS, ALLANTOIS.map((_, i) => lerp(4.2, 2.6, i / ALLANTOIS.length)))} fill="#e9cf7a" stroke="rgba(90,60,10,0.5)" strokeWidth={0.8} />
      </Part>

      {/* Mesenchyme round the oesophagus: where the septum anchors dorsally. */}
      <Part id="hestegorri-inguruko-mesenkima" show={eso}>
        <g transform={`translate(640 310) scale(${f1(lerp(0.4, 1, sm(eso)) * 100 / 100)}) translate(-640 -310)`}>
          <path d={smoothPath(ESO_MES, true, 0.3)} fill={P.eso} opacity={0.62} />
          <path d={smoothPath(ESO_MES, true, 0.3)} fill="url(#w7-mesench)" />
          <path d={smoothPath(ESO_MES, true, 0.3)} fill="none" stroke="#9fe6d8" strokeWidth={1} opacity={0.6} />
        </g>
      </Part>
      {/* The oesophagus runs through it (drawn again on top). */}
      <Part id="aurreko-hestea" show={eso}>
        <path d={tubeD(GUT.slice(I_ESO[0], I_ESO[1] + 1), GUT_HW.slice(I_ESO[0], I_ESO[1] + 1), false)} fill={P.gut} stroke="rgba(90,60,10,0.6)" strokeWidth={1} />
        <path d={tubeD(GUT.slice(I_ESO[0], I_ESO[1] + 1), GUT_LUMEN.slice(I_ESO[0], I_ESO[1] + 1), false)} fill="#3a2a10" />
      </Part>

      {/* Heart: the looping tube in the cranial coelom, beating; blood runs from the sinus venosus to the aortic sac. */}
      <Part id="bihotza">
        <g transform={`translate(${HEART_C[0]} ${HEART_C[1]})`}>
          <g>
            {beating && <animateTransform attributeName="transform" type="scale" values="1;1.045;0.985;1" keyTimes="0;0.18;0.45;1" dur="0.9s" repeatCount="indefinite" />}
            <g transform={`translate(${-HEART_C[0]} ${-HEART_C[1]})`}>
              {/* Outline pass, then fill pass: tube and chambers read as one muscular wall. */}
              <g fill={P.heartDeep} stroke={P.heartDeep} strokeWidth={3}>
                <path d={heartD} />
                <ellipse cx={ATRIUM.cx} cy={ATRIUM.cy} rx={ATRIUM.rx} ry={ATRIUM.ry} transform={`rotate(${ATRIUM.rot} ${ATRIUM.cx} ${ATRIUM.cy})`} />
                <ellipse cx={VENTRICLE.cx} cy={VENTRICLE.cy} rx={VENTRICLE.rx} ry={VENTRICLE.ry} transform={`rotate(${VENTRICLE.rot} ${VENTRICLE.cx} ${VENTRICLE.cy})`} />
              </g>
              <ellipse cx={ATRIUM.cx} cy={ATRIUM.cy} rx={ATRIUM.rx} ry={ATRIUM.ry} transform={`rotate(${ATRIUM.rot} ${ATRIUM.cx} ${ATRIUM.cy})`} fill={`url(#w7-lat-atrium${cid})`} />
              <path d={heartD} fill={`url(#w7-lat-heart${cid})`} />
              <ellipse cx={VENTRICLE.cx} cy={VENTRICLE.cy} rx={VENTRICLE.rx} ry={VENTRICLE.ry} transform={`rotate(${VENTRICLE.rot} ${VENTRICLE.cx} ${VENTRICLE.cy})`} fill={`url(#w7-lat-heart${cid})`} />
              {/* Lumen (blood) inside each piece. */}
              <g fill="#4a0a16" opacity={0.5}>
                <path d={heartLumen} />
                <ellipse cx={ATRIUM.cx} cy={ATRIUM.cy} rx={ATRIUM.rx - 9} ry={ATRIUM.ry - 8} transform={`rotate(${ATRIUM.rot} ${ATRIUM.cx} ${ATRIUM.cy})`} />
                <ellipse cx={VENTRICLE.cx} cy={VENTRICLE.cy} rx={VENTRICLE.rx - 11} ry={VENTRICLE.ry - 10} transform={`rotate(${VENTRICLE.rot} ${VENTRICLE.cx} ${VENTRICLE.cy})`} />
              </g>
              {/* Trabeculae in the ventricle wall. */}
              <g stroke="#e8586e" strokeWidth={1.2} opacity={0.45} strokeLinecap="round">
                {[-28, -16, -4, 8, 20, 30].map((d, k) => (
                  <line key={k} x1={VENTRICLE.cx + d} y1={VENTRICLE.cy + 12 - Math.abs(d) * 0.15} x2={VENTRICLE.cx + d * 1.08} y2={VENTRICLE.cy + 22 - Math.abs(d) * 0.3} />
                ))}
              </g>
              <path d={smoothPath(offset(HEART, (i) => HEART_HW[i] * 0.55), false, 0.3)} fill="none" stroke="#ffd0d6" strokeWidth={1.6} opacity={0.35} strokeLinecap="round" />
              {beating &&
                [0, 1, 2, 3, 4].map((k) => (
                  <circle key={k} r={2.6} fill="#ff9aa8" opacity={0.85}>
                    <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${(-k * 0.36).toFixed(2)}s`} path={heartPath} />
                  </circle>
                ))}
            </g>
          </g>
        </g>
      </Part>

      {/* Septum transversum: first loose mesenchymal cells that gather, then a solid plate with the sinus venosus and the liver bud in it. */}
      {reach > 0.01 && (
        <Part id="septum-transversum">
          <g clipPath={`url(#w7-lat-body${cid})`}>
          <path d={sepD} fill={P.septum} opacity={solid} />
          <path d={sepD} fill="url(#w7-mesench)" opacity={solid} />
          <path d={sepD} fill="url(#w7-light)" opacity={solid} />
          <path d={sepD} fill="none" stroke={P.septumDeep} strokeWidth={1.3} opacity={Math.max(solid, 0.4 * cells)} />
          {cells > 0.01 &&
            SEPTUM_CELLS.map((c, i) => {
              const a = c.k * 0.55;
              const go = sm(seg(cells, a, a + 0.4));
              if (go <= 0.001) return null;
              const x = lerp(c.from[0], c.p[0], go);
              const y = lerp(c.from[1], c.p[1], go);
              return (
                <g key={i} opacity={Math.min(1, go * 3) * lerp(1, 0.45, solid)}>
                  <circle cx={x} cy={y} r={c.r + 1.2} fill="#f7c48a" stroke="#a8622a" strokeWidth={0.7} />
                  <circle cx={x} cy={y} r={c.r * 0.45} fill="#8a4a1c" />
                </g>
              );
            })}
          </g>
        </Part>
      )}
      {/* The septum's two anchors glow while they are the point: the ventral body wall and the oesophageal mesenchyme. */}
      {anchors > 0.01 && (
        <g fill="none" strokeLinecap="round" pointerEvents="none" opacity={anchors}>
          <path d={smoothPath([SEPTUM_TOP[0], [SEPTUM_A[0] + 2, SEPTUM_A[1]], SEPTUM_BOT[0]], false, 0.3)} stroke="#ffe0b8" strokeWidth={6} opacity={0.35} />
          <path d={smoothPath([SEPTUM_TOP[0], [SEPTUM_A[0] + 2, SEPTUM_A[1]], SEPTUM_BOT[0]], false, 0.3)} stroke="#fff4e0" strokeWidth={1.8} />
          <path d={smoothPath([SEPTUM_TOP[4], SEPTUM_B, SEPTUM_BOT[4]], false, 0.3)} stroke="#ffe0b8" strokeWidth={6} opacity={0.35} />
          <path d={smoothPath([SEPTUM_TOP[4], SEPTUM_B, SEPTUM_BOT[4]], false, 0.3)} stroke="#fff4e0" strokeWidth={1.8} />
        </g>
      )}
      {/* Liver bud from the duodenum into the septum (with the plate). */}
      {solid > 0.01 && (
        <g opacity={solid * 0.9} pointerEvents="none" fill="none" stroke={P.gut} strokeLinecap="round">
          <path d="M606,414 C594,404 578,400 560,400" strokeWidth={5} />
          <path d="M576,401 C568,392 558,388 546,388" strokeWidth={3} />
          <path d="M570,403 C560,412 546,416 532,414" strokeWidth={3} />
          <path d="M548,389 C540,384 532,384 522,388" strokeWidth={2} />
          <path d="M546,414 C538,422 526,426 514,426" strokeWidth={2} />
        </g>
      )}

      {/* The canals: passages left on each side of the oesophagus, dorsal to the septum (beside this plane). */}
      <Part id="erreten-perikardioperitonealak" show={canals}>
        <path d={tubeD(CANAL, CANAL.map(() => 9))} fill={P.space} opacity={0.82} />
        <path d={tubeD(CANAL, CANAL.map(() => 9))} fill={P.canal} />
        <path d={tubeD(CANAL, CANAL.map(() => 9))} fill="none" stroke="#7fc8e8" strokeWidth={1.4} />
        {!reduced &&
          [0, 1, 2, 3].map((k) => (
            <circle key={k} r={2.4} fill="#c8ecff">
              <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${(-k * 0.6).toFixed(1)}s`} path={smoothPath(k % 2 ? [...CANAL].reverse() : CANAL, false, 0.3)} />
            </circle>
          ))}
      </Part>

      {/* Skin (surface ectoderm) as a sheet of cells; light from the top left. */}
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY} inner={skinIn} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={3} />
      </Part>
      <path d={bodyD} fill="url(#w7-light)" pointerEvents="none" />
          </g>
  );
}

const ORIENT_LABELS = { left: 'Bentrala', right: 'Dortsala' };
export const lateralOrientation = { top: 'Kraneala', bottom: 'Kaudala', ...ORIENT_LABELS };

/** C3–C5 tags beside the somites. */
function Levels({ show }: { show: number }) {
  if (show <= 0.02) return null;
  return (
    <>
      {['C3', 'C4', 'C5'].map((n, j) => {
        const s = SOMITES[C3 + j];
        if (!s) return null;
        return (
          <Note key={n} x={s.p[0] + 74} y={s.p[1] + 2} size={11.5} tone="accent" show={show}>
            {n}
          </Note>
        );
      })}
    </>
  );
}

/** Transverse section at the septum (dorsal up), in a loupe: the septum leaves two dorsolateral canals open. */
const LOUPE: Pt = [866, 538];
const LR = 80;
function CanalLoupe({ show, reduced, cid }: { show: number; reduced: boolean; cid: string }) {
  if (show <= 0.01) return null;
  const [cx, cy] = LOUPE;
  // Source of the cone: the canal in the main drawing.
  const sx = CANAL_MID[0];
  const sy = CANAL_MID[1];
  const dx = sx - cx;
  const dy = sy - cy;
  const L = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const half = Math.acos(Math.min(1, LR / L));
  const t1: Pt = [cx + Math.cos(ang + half) * LR, cy + Math.sin(ang + half) * LR];
  const t2: Pt = [cx + Math.cos(ang - half) * LR, cy + Math.sin(ang - half) * LR];
  // Section (in loupe coordinates, centre 0,0): body wall ring, neural tube + aorta dorsally, oesophagus in its mesenchyme, septum ventral.
  const wallOut = 'M-74,-6 C-74,-50 -40,-74 0,-74 C40,-74 74,-50 74,-6 C74,40 44,72 0,74 C-44,72 -74,40 -74,-6Z';
  const septum = 'M-60,10 C-48,-6 -30,-4 -22,4 C-12,14 12,14 22,4 C30,-4 48,-6 60,10 C58,40 34,62 0,64 C-34,62 -58,40 -60,10Z';
  const flowD = (k: number) => `M${k * 34},-10 C${k * 40},-26 ${k * 40},-30 ${k * 34},-34`;
  return (
    <g opacity={show} pointerEvents="none">
      <defs>
        <clipPath id={`w7-loupe${cid}`}>
          <circle cx={cx} cy={cy} r={LR} />
        </clipPath>
        <linearGradient id={`w7-cone${cid}`} gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={cx} y2={cy}>
          <stop offset="0" stopColor="#7fc8e8" stopOpacity={0.3} />
          <stop offset="1" stopColor="#7fc8e8" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <path d={poly([[sx, sy], t1, t2])} fill={`url(#w7-cone${cid})`} />
      <circle cx={cx} cy={cy} r={LR + 3} fill="#0b0d12" stroke="#7fc8e8" strokeWidth={2} opacity={0.95} />
      <g clipPath={`url(#w7-loupe${cid})`}>
        <g transform={`translate(${cx} ${cy}) scale(1.08)`}>
          <path d={wallOut} fill={P.wall} />
          <path d={wallOut} fill="url(#w7-mesench)" />
          {/* Pericardial cavity side (cut above the septum): dark coelom between the wall and the septum. */}
          <path d="M-62,-4 C-62,-36 -34,-54 0,-54 C34,-54 62,-36 62,-4 C62,30 40,56 0,58 C-40,56 -62,30 -62,-4Z" fill={P.space} />
          <path d="M-62,-4 C-62,-36 -34,-54 0,-54 C34,-54 62,-36 62,-4 C62,30 40,56 0,58 C-40,56 -62,30 -62,-4Z" fill={P.peri} />
          {/* Dorsal block: neural tube, notochord, aorta and the oesophageal mesenchyme. */}
          <path d="M-26,-74 C-26,-60 -18,-40 -18,-24 C-18,-6 -10,8 0,8 C10,8 18,-6 18,-24 C18,-40 26,-60 26,-74Z" fill={P.wall} />
          <path d="M-26,-74 C-26,-60 -18,-40 -18,-24 C-18,-6 -10,8 0,8 C10,8 18,-6 18,-24 C18,-40 26,-60 26,-74Z" fill="url(#w7-mesench)" />
          <circle cx={0} cy={-62} r={10} fill={C.neural} stroke="rgba(10,16,48,0.7)" />
          <circle cx={0} cy={-62} r={2.6} fill="#101a3a" />
          <circle cx={0} cy={-46} r={3} fill={C.notochord} />
          <circle cx={-6} cy={-36} r={3.6} fill={C.artery} />
          <circle cx={6} cy={-36} r={3.6} fill={C.artery} />
          <ellipse cx={0} cy={-10} rx={17} ry={15} fill={P.eso} opacity={0.75} />
          <circle cx={0} cy={-10} r={6.5} fill={P.gut} />
          <circle cx={0} cy={-10} r={2.4} fill="#3a2a10" />
          {/* The septum: ventral and lateral on the wall, dorsally on the oesophageal mesenchyme… */}
          <path d={septum} fill={P.septum} />
          <path d={septum} fill="url(#w7-mesench)" />
          <path d={septum} fill="none" stroke={P.septumDeep} strokeWidth={1.2} />
          {/* …leaving the two canals open on each side of the oesophagus. */}
          {[-1, 1].map((k) => (
            <g key={k}>
              <ellipse cx={k * 36} cy={-20} rx={12} ry={15} fill={P.space} />
              <ellipse cx={k * 36} cy={-20} rx={12} ry={15} fill={P.canal} stroke="#7fc8e8" strokeWidth={1.4} />
              {!reduced &&
                [0, 1].map((j) => (
                  <circle key={j} r={2.2} fill="#c8ecff">
                    <animateMotion dur="1.6s" repeatCount="indefinite" begin={`${(-j * 0.8).toFixed(1)}s`} path={flowD(k)} />
                  </circle>
                ))}
            </g>
          ))}
        </g>
      </g>
      <circle cx={cx} cy={cy} r={LR + 3} fill="none" stroke="#7fc8e8" strokeWidth={2} />
      <Note x={cx} y={cy - LR - 14} size={11}>
        zeharkako ebakia septumaren mailan
      </Note>
    </g>
  );
}

/** 7:zeloma:sagitala — the coelom runs inside the whole body, from the future thorax to the future abdomen. */
export function CoelomExtent({ t, reduced }: SceneProps) {
  // The view is shown from the stage's last step (.86): its own small animation runs there.
  const sweep = t < 0.84 ? 1 : seg(t, 0.87, 0.95);
  return (
    <g>
      <LateralDrawing reach={0} cells={0} solid={0} split={0} canals={0} levels={0} eso={0} anchors={0} pour={t < 0.84 ? 1 : seg(t, 0.865, 0.94)} reduced={reduced} />
      {/* The plane of the transverse view (midgut level, at the yolk stalk). */}
      <path d="M392,456L690,456" stroke="#0f0f11" strokeWidth={4.4} strokeLinecap="round" opacity={0.8} />
      <path d="M392,456L690,456" stroke="#ffb86b" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      <Note x={760} y={604} size={11.5}>
        marra laranja: zeharkako ebakiaren maila
      </Note>
      <Arrow from={[392, 392]} to={[lerp(392, 396, sweep), lerp(392, 296, sweep)]} color="#c4a8ff" width={2.6} show={sweep > 0.05 ? 1 : 0} bend={-0.06} />
      <Arrow from={[420, 432]} to={[lerp(420, 560, sweep), lerp(432, 494, sweep)]} color="#c4a8ff" width={2.6} show={sweep > 0.05 ? 1 : 0} bend={0.1} />
      <Note x={292} y={318} tone="accent">
        geroko toraxa
      </Note>
      <Note x={296} y={452} tone="accent">
        geroko abdomena
      </Note>

      <Label id="enbrioi-barruko-zeloma" x={236} y={372} ax={386} ay={330} />
      <Label id="bihotza" x={236} y={262} ax={452} ay={330} small />
      <Label id="hodi-onfalomesenterikoa" x={236} y={556} ax={320} ay={548} small />
      <Label id="hodi-neurala" x={790} y={80} ax={650} ay={88} />
      <Label id="somitak" x={790} y={132} ax={SOMITES[2]?.p[0] ?? 660} ay={SOMITES[2]?.p[1] ?? 140} small />
      <Label id="aurreko-hestea" x={790} y={186} ax={600} ay={184} />
      <Label id="mesenterio-dortsala" x={790} y={404} ax={630} ay={420} small />
      <Label id="erdiko-hestea" x={790} y={470} ax={560} ay={478} />
    </g>
  );
}

/** 7:septum-transversum:sagitala — the septum condenses at C3–C5 and splits the coelom, except the canals. */
export function SeptumLateral({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const cells = seg(t, 0.185, 0.3);
  const reach = seg(t, 0.2, 0.32) * 0.9 + 0.1 * seg(t, 0.41, 0.47);
  const solid = seg(t, 0.27, 0.34);
  const eso = seg(t, 0.36, 0.42);
  const anchors = vis(t, 0.44, 0.56, 0.04);
  const split = seg(t, 0.55, 0.63);
  const canals = seg(t, 0.72, 0.77);
  const loupe = seg(t, 0.75, 0.8);
  const levels = vis(t, 0.18, 0.54);
  return (
    <g>
      <LateralDrawing reach={reach} cells={cells} solid={solid} split={split} canals={canals} levels={levels} eso={eso} anchors={anchors} reduced={reduced} />
      <Levels show={levels} />
      <CanalLoupe show={loupe} reduced={reduced} cid={cid} />
      <Note x={500} y={616} tone="accent" show={vis(t, 0.19, 0.36)}>
        4. astea: lepo mailan (C3–C5) mesenkima trinkotu eta trenkada horizontala sortzen da
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, 0.36, 0.54)}>
        Aurrean eta alboetan gorputz paretan finkatuta; atzean, hestegorri inguruko mesenkiman
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, 0.54, 0.72)}>
        Goian hasierako perikardio barrunbea · behean peritoneo barrunbea
      </Note>
      <Note x={470} y={616} tone="accent" show={vis(t, 0.72)}>
        Banaketa partziala: bi erretenek goiko eta beheko barrunbeak lotzen dituzte
      </Note>

      <Label id="enbrioi-barruko-zeloma" x={236} y={372} ax={386} ay={330} show={1 - split} />
      <Label id="hasierako-perikardio-barrunbea" x={250} y={214} ax={404} ay={244} show={split} />
      <Label id="bihotza" x={236} y={268} ax={452} ay={330} />
      <Label id="septum-transversum" x={236} y={420} ax={404} ay={414} show={seg(t, 0.2, 0.24)} />
      <Label id="peritoneo-barrunbea" x={236} y={470} ax={446} ay={446} show={split} />
      <Label id="hodi-onfalomesenterikoa" x={236} y={556} ax={320} ay={548} small />

      <Label id="hodi-neurala" x={790} y={80} ax={650} ay={88} />
      <Label id="somitak" x={790} y={132} ax={SOMITES[2]?.p[0] ?? 660} ay={SOMITES[2]?.p[1] ?? 140} small />
      <Label id="aurreko-hestea" x={790} y={186} ax={600} ay={184} />
      <Label id="hestegorri-inguruko-mesenkima" x={790} y={244} ax={658} ay={262} show={eso} small />
      <Label id="erreten-perikardioperitonealak" x={790} y={282} ax={CANAL_MID[0] + 6} ay={CANAL_MID[1] - 6} show={canals} small />
      <Label id="mesenterio-dortsala" x={790} y={372} ax={630} ay={420} small />
      <Label id="erdiko-hestea" x={790} y={404} ax={560} ay={478} />
    </g>
  );
}
