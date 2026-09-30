'use client';

import { C, ellipseArc, smoothPath, type Pt } from '@/components/kit';

/**
 * Shared geometry for week-3A embryo scenes (gastrulation → notochord → allantois).
 *
 * Orientation convention (matches the notes' sagittal figures, e.g. "Enbrioiaren mozketa-plano
 * sagitala": ezkerrean alde kraneala, eskuinean alde kaudala):
 *  - Sagittal views: cranial = left (small x), caudal = right (large x), dorsal = up (small y,
 *    amnion side), ventral = down (large y, yolk-sac side).
 *  - Dorsal views (disc seen from above, amnion removed): cranial = top (small y), caudal =
 *    bottom (large y), matching "amniosaren ertz moztua" pointing up in the notes' figures.
 */

export const f1 = (v: number) => v.toFixed(1);

/** Sagittal frame: the flat trilaminar disc as a chord between the amnion dome (above) and the yolk-sac dome (below). */
export const SAG = {
  cx: 500,
  cranialX: 250,
  caudalX: 740,
  discY: 340,
  amnionTopY: 168,
  yolkBottomY: 512,
} as const;

/** Amnion dorsal dome: half-ellipse over the disc, touching down at the cranial/caudal tips. */
export function amnionArc(shrink = 0) {
  const rx = (SAG.caudalX - SAG.cranialX) / 2 - shrink;
  const ry = SAG.discY - SAG.amnionTopY;
  return ellipseArc(SAG.cx, SAG.discY, rx, ry, 180, 360);
}

/** Yolk-sac ventral dome, mirrored below the disc. */
export function yolkArc(shrink = 0) {
  const rx = (SAG.caudalX - SAG.cranialX) / 2 - shrink;
  const ry = SAG.yolkBottomY - SAG.discY;
  return ellipseArc(SAG.cx, SAG.discY, rx, ry, 180, 0);
}

/** x position along the disc for u in [0,1] (0 = cranial tip, 1 = caudal tip). */
export const discX = (u: number) => SAG.cranialX + (SAG.caudalX - SAG.cranialX) * u;

/**
 * Dorsal disc outline (amnion removed, looking down on the epiblast): a "pear" shape, round early
 * and wider cranially (top) than caudally (bottom) once cranial growth outpaces caudal growth.
 */
export function discOutline(cx: number, cy: number, rxTop: number, rxBot: number, ryTop: number, ryBot: number, n = 72): Pt[] {
  const pts: Pt[] = [];
  // Blend rx/ry smoothly over most of the outline (not only near the equator): a narrow blend made
  // the radius drop abruptly below the widest point, giving the pear shape hard "shoulders".
  const band = 0.75;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.sin(a);
    const u = Math.max(0, Math.min(1, (s + band) / (2 * band)));
    const k = u * u * (3 - 2 * u); // 0 = cranial half, 1 = caudal half
    const rx = rxTop + (rxBot - rxTop) * k;
    const ry = ryTop + (ryBot - ryTop) * k;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

export function discOutlinePath(cx: number, cy: number, rxTop: number, rxBot: number, ryTop: number, ryBot: number) {
  return smoothPath(discOutline(cx, cy, rxTop, rxBot, ryTop, ryBot), true, 0.6);
}

/** Tissue colours used across week-3A (kept in one place so scenes stay consistent). */
export const W3C = {
  ectoderm: C.ectoderm,
  endoderm: C.endoderm,
  mesoIntra: C.mesoIntra,
  mesoExtra: C.mesoExtra,
  notochord: C.notochord,
  prechordal: C.prechordal,
  epiblast: C.epiblast,
  hypoblast: C.hypoblast,
} as const;

/** A small pale patch marking a membrane (bucco-pharyngeal / cloacal): ecto+endo fused, no mesoderm. */
export function membraneCap(x: number, yTop: number, yBottom: number, w: number) {
  return `M${f1(x - w)},${f1(yTop)} L${f1(x + w)},${f1(yTop)} L${f1(x + w)},${f1(yBottom)} L${f1(x - w)},${f1(yBottom)} Z`;
}
