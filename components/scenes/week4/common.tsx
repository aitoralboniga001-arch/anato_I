'use client';

import { lerp, lerpPt, smoothPath, type Pt } from '@/components/kit';

export type { Pt };

/**
 * Shared geometry for week-4A scenes (folding, neurulation, brain vesicles, neural crest).
 * viewBox is always 1000x640 (see components/kit).
 */

// ---------------------------------------------------------------------------
// Cephalocaudal + lateral folding (sagittal C-shape).
// The disc is modelled as a band that runs from the cranial pole (s=0, buccopharyngeal
// membrane) to the caudal pole (s=1, cloacal membrane). At fold=0 it is flat (trilaminar
// disc); at fold=1 it has curled into a C around FOLD_CENTER, leaving a small ventral gap
// where the connecting stalk / vitelline duct persist (the umbilical ring never fully closes
// at this stage).
// ---------------------------------------------------------------------------

export const FOLD_CENTER: Pt = [560, 300];
export const FOLD_R = 176;

const NS = 18;
const SS = Array.from({ length: NS + 1 }, (_, i) => i / NS);

/** Half-thickness of the disc at cranio-caudal position s; tapers to 0 at both membranes. */
export function taper(s: number) {
  return 58 * Math.pow(Math.sin(Math.PI * s), 0.7);
}

/** Angle (deg) around FOLD_CENTER once fully curled. Sweeps the long way (330°) so the two
 * poles end up close together on the right, leaving the ventral gap there. */
function angleOf(s: number) {
  return 345 - 330 * s;
}

function flatXY(s: number, dy: number): Pt {
  return [lerp(258, 742, s), 300 + dy];
}
function curlXY(s: number, r: number): Pt {
  const a = (angleOf(s) * Math.PI) / 180;
  return [FOLD_CENTER[0] + r * Math.cos(a), FOLD_CENTER[1] + r * Math.sin(a)];
}
function clampDepth(s: number, d: number) {
  return Math.max(-40, Math.min(d, taper(s) * 0.92));
}

/** Point on the dorsal (back) contour. depth 0 = outer skin surface; growing depth moves inward (toward the gut lumen); negative depth bulges outward (amnion). */
export function dorsalPt(s: number, fold: number, depth = 0): Pt {
  const d = clampDepth(s, depth);
  return lerpPt(flatXY(s, -(taper(s) - d)), curlXY(s, FOLD_R + taper(s) - d), fold);
}
/** Point on the ventral (belly/gut) contour. depth 0 = outer gut-facing surface; growing depth moves inward toward the dorsal side; negative depth bulges outward (amnion). */
export function ventralPt(s: number, fold: number, depth = 0): Pt {
  const d = clampDepth(s, depth);
  return lerpPt(flatXY(s, taper(s) - d), curlXY(s, FOLD_R - taper(s) + d), fold);
}

/** Closed ribbon following one contour between two depths, over a sub-range of s. */
export function ribbon(side: 'dorsal' | 'ventral', fold: number, dOuter: number, dInner: number, sFrom = 0, sTo = 1) {
  const fn = side === 'dorsal' ? dorsalPt : ventralPt;
  const us = SS.filter((u) => u >= sFrom - 1e-6 && u <= sTo + 1e-6);
  if (us.length < 2) return '';
  const outer = us.map((s) => fn(s, fold, dOuter));
  const inner = [...us].reverse().map((s) => fn(s, fold, dInner));
  return smoothPath([...outer, ...inner], true, 0.4);
}

/** Whole embryo silhouette (dorsal + ventral contours joined) at a given depth. */
export function bodyLoop(fold: number, depth = 0) {
  const outer = SS.map((s) => dorsalPt(s, fold, depth));
  const inner = [...SS].reverse().map((s) => ventralPt(s, fold, depth));
  return smoothPath([...outer, ...inner], true, 0.4);
}

/** Open arc tracing the amnion membrane over the dorsal/outer aspect, growing in coverage. */
export function amnionArc(fold: number, extra: number, sFrom: number, sTo: number) {
  const us = SS.filter((u) => u >= sFrom - 1e-6 && u <= sTo + 1e-6);
  const pts = us.map((s) => dorsalPt(s, fold, -extra));
  return smoothPath(pts, false, 0.4);
}

export function foldPoint(s: number, fold: number) {
  return { dorsal: dorsalPt(s, fold), ventral: ventralPt(s, fold), mid: lerpPt(dorsalPt(s, fold), ventralPt(s, fold), 0.5) };
}

// ---------------------------------------------------------------------------
// Generic "line bending into a circle" used for the transverse folding view and for
// neurulation. u in [0,1]: u=0.5 is the pivot that stays fixed; the two ends (u=0, u=1)
// swing around and meet at the opposite pole once closure=1.
// ---------------------------------------------------------------------------
/**
 * `depth` is measured from the surface that ends up radially OUTERMOST once closure=1
 * (flatY should be that surface's y in the flat state); increasing depth moves towards the
 * surface that ends up innermost (closer to the centre). This convention is shared with
 * `dorsalPt`/`ventralPt` above.
 */
export function bendPoint(
  u: number,
  closure: number,
  cx: number,
  cy: number,
  r: number,
  flatY: number,
  halfSpan: number,
  openUp: boolean,
  depth = 0,
): Pt {
  const flat: Pt = [cx - halfSpan + 2 * halfSpan * u, flatY + depth];
  const pivotAngle = openUp ? 90 : -90;
  const sign = openUp ? -1 : 1;
  const angle = ((pivotAngle + sign * 360 * (u - 0.5)) * Math.PI) / 180;
  const curl: Pt = [cx + (r - depth) * Math.cos(angle), cy + (r - depth) * Math.sin(angle)];
  return lerpPt(flat, curl, closure);
}

export const f1 = (v: number) => v.toFixed(1);
