'use client';

import { lerp, polyline, smoothPath, type Pt } from '@/components/kit';

/**
 * Shared transverse-section model for week 4B (mesoderm & endoderm derivatives).
 *
 * The cross-section is parameterised by `s` (position across the width of the flat trilaminar
 * disc, -1..1, 0 = dorsal midline, ±1 = the disc's free lateral edges) and `depth` (distance from
 * the outer/dorsal surface inward, in svg units). `foldK` (0..1) morphs the section from a flat
 * disc (Fig. 6 of the notes, ~day 17-20) into a closed cylindrical body (after lateral folding,
 * ~day 24+): at foldK=0 points lie on a flat horizontal band; at foldK=1 they lie on a circle
 * whose top (s=0) is dorsal and whose bottom (s=±1) is the ventral midline, where the two lateral
 * edges of the disc fuse. Interpolating the two Cartesian positions reproduces the textbook
 * animation of the lateral body-wall folds swinging ventrally to close the body wall and gut tube.
 */
export const BODY = { cx: 500, cy: 330, w: 330, r: 168, flatY: 232 } as const;

export function bodyPoint(s: number, foldK: number, depth: number): Pt {
  const { cx, cy, w, r, flatY } = BODY;
  const flat: Pt = [cx + s * w, flatY + depth];
  const theta = ((-90 + 180 * s) * Math.PI) / 180;
  const rr = r - depth;
  const folded: Pt = [cx + rr * Math.cos(theta), cy + rr * Math.sin(theta)];
  return [lerp(flat[0], folded[0], foldK), lerp(flat[1], folded[1], foldK)];
}

/**
 * After folding is well under way, the gut tube pinches off the ventral midline and hangs free
 * inside the coelom, suspended by the dorsal mesentery — it must NOT be drawn as a full-width
 * band reaching the dorsal pole (that produces the "concentric rings" bug). `gutCenter` gives the
 * free-floating centre of that small tube: it starts at the ventral rim (pinch=0, where the two
 * lateral edges of the flat endoderm sheet have just met) and migrates inward toward the middle
 * of the body as pinch -> 1.
 */
export function gutCenter(foldK: number, pinch: number): Pt {
  const { cx, cy, r } = BODY;
  const rr = lerp(r - 34, r * 0.38, pinch);
  const ventral = bodyPoint(1, foldK, r - rr);
  const flatFallback: Pt = [cx, BODY.flatY + (r - rr)];
  return [lerp(flatFallback[0], ventral[0], foldK), lerp(flatFallback[1], ventral[1], foldK)];
}

/** Closed band between depths d0 (outer edge) and d1 (inner edge), spanning s in [s0, s1]. */
export function bandPathT(s0: number, s1: number, foldK: number, d0: number, d1: number, n = 22): string {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(bodyPoint(s0 + ((s1 - s0) * i) / n, foldK, d0));
  for (let i = n; i >= 0; i--) pts.push(bodyPoint(s0 + ((s1 - s0) * i) / n, foldK, d1));
  return smoothPath(pts, true, 0.4);
}

/** Open contour at a constant depth, spanning s in [s0, s1] (for outlines / leader anchors). */
export function linePathT(s0: number, s1: number, foldK: number, depth: number, n = 22): string {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(bodyPoint(s0 + ((s1 - s0) * i) / n, foldK, depth));
  return smoothPath(pts, false, 0.4);
}

/** Midpoint anchor inside a band, for label leader lines. */
export function midT(s0: number, s1: number, foldK: number, d0: number, d1: number): Pt {
  return bodyPoint((s0 + s1) / 2, foldK, (d0 + d1) / 2);
}

export const f1 = (v: number) => v.toFixed(1);

/** A tube of half-width `half` centred on the polyline through `pts` (for the gut tube). */
export function tubeBand(pts: Pt[], half: number, n = 48): string {
  const c = polyline(pts);
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = c(i / n);
    outer.push([s.x + s.nx * half, s.y + s.ny * half]);
    inner.push([s.x - s.nx * half, s.y - s.ny * half]);
  }
  return smoothPath([...outer, ...inner.reverse()], true, 0.35);
}

/** Point at fraction `u` along the polyline through `pts`. */
export function alongPts(pts: Pt[], u: number): Pt {
  const s = polyline(pts)(u);
  return [s.x, s.y];
}

/** Somite pair schedule: 44 pairs total, grouped by region (per the notes' counts). */
export const SOMITE_REGIONS = [
  { id: 'okzipitala', n: 4, color: '#e0363f' },
  { id: 'zerbikala', n: 8, color: '#e0655f' },
  { id: 'toraziko', n: 12, color: '#e0363f' },
  { id: 'lunbarra', n: 5, color: '#c94a52' },
  { id: 'sakroa', n: 5, color: '#b04a5c' },
  { id: 'kokzigeoa', n: 10, color: '#8a4a66' },
] as const;

export interface SomiteInfo {
  index: number;
  region: string;
  color: string;
  y: number;
  /** True for the somites that normally regress (1st occipital, last 5-7 coccygeal). */
  transient: boolean;
}

export const TOTAL_SOMITES = SOMITE_REGIONS.reduce((a, r) => a + r.n, 0);

export function buildSomites(yTop: number, yBottom: number): SomiteInfo[] {
  const list: SomiteInfo[] = [];
  let idx = 0;
  for (const r of SOMITE_REGIONS) {
    for (let i = 0; i < r.n; i++) {
      list.push({ index: idx, region: r.id, color: r.color, y: lerp(yTop, yBottom, idx / (TOTAL_SOMITES - 1)), transient: false });
      idx++;
    }
  }
  list[0].transient = true;
  for (let i = list.length - 6; i < list.length; i++) list[i].transient = true;
  return list;
}
