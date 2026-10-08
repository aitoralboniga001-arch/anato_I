'use client';

import { rand, type Pt } from '@/components/kit';

export { arc, along, f1, length, mirror, morph, normals, offset, poly, resample, sm, spline, vis } from '@/components/scenes/week7/common';

/**
 * Shared language of topic 8 (hezur sistema). One colour per meaning in every view:
 * - where the bone comes from: neural crest teal, paraxial mesoderm coral, parietal layer of the lateral mesoderm amber;
 * - what the tissue is now: mesenchyme (loose brown cells), cartilage (lavender, cells in lacunae), bone (ivory),
 *   an active ossification centre (ochre with dark osteoblast clusters), connective tissue of sutures and fontanelles (blue).
 */
export const Q = {
  crest: '#2dd4bf',
  crestDeep: '#0f8f80',
  paraxial: '#ef6b5b',
  paraxialDeep: '#a8392d',
  lateral: '#e6a23c',
  lateralDeep: '#a66a14',
  mes: '#d9a066',
  mesDeep: '#7a4a1e',
  cart: '#9a8fe0',
  cartDeep: '#5d52a8',
  cartCell: '#e9e6ff',
  bone: '#efe3c4',
  boneDeep: '#b9a77e',
  centre: '#b9772f',
  osteo: '#2a160a',
  vessel: '#e04a3a',
  suture: '#4fb3e8',
  flexor: '#e8564f',
  extensor: '#5b8def',
  neural: '#3a5fd9',
  noto: '#a855f7',
  skin: '#7aa7f5',
  body: '#3a2a36',
  bodyEdge: '#6b5566',
  grey: '#4a4552',
  greyEdge: '#77707f',
  nerve: '#fde047',
  space: '#120d14',
} as const;

/** Loose mesenchymal cells scattered over a polygon (deterministic): star-shaped cells with a nucleus. */
export function mesCells(inside: (x: number, y: number) => boolean, box: [number, number, number, number], step: number, seed: number) {
  const out: { p: Pt; r: number; a: number }[] = [];
  let i = 0;
  for (let y = box[1]; y <= box[3]; y += step * 0.87)
    for (let x = box[0]; x <= box[2]; x += step) {
      i++;
      const jx = x + (rand(seed + i * 1.7) - 0.5) * step * 0.8;
      const jy = y + (rand(seed + i * 3.1) - 0.5) * step * 0.7;
      if (inside(jx, jy)) out.push({ p: [jx, jy], r: 0.8 + rand(seed + i * 5.3) * 0.4, a: rand(seed + i * 7.9) * 360 });
    }
  return out;
}

/** Point in polygon (even-odd). */
export function inPoly(pts: readonly Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** A star-shaped mesenchymal cell. */
export function MesCell({ p, r = 1, a = 0, fill = Q.mes, opacity = 1 }: { p: Pt; r?: number; a?: number; fill?: string; opacity?: number }) {
  if (opacity <= 0.01) return null;
  const s = 4.2 * r;
  return (
    <g transform={`translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${a.toFixed(0)})`} opacity={opacity}>
      <path d={`M${-s},0L${-s * 0.3},${-s * 0.25}L0,${-s}L${s * 0.3},${-s * 0.2}L${s},${s * 0.1}L${s * 0.2},${s * 0.35}L${-s * 0.1},${s * 0.9}L${-s * 0.35},${s * 0.25}Z`} fill={fill} stroke="rgba(60,30,10,0.55)" strokeWidth={0.6} />
      <circle r={s * 0.32} fill={Q.mesDeep} />
    </g>
  );
}

/** Shared gradients and patterns of topic 8. */
export function Defs8() {
  return (
    <defs>
      <linearGradient id="w8-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.14} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.24} />
      </linearGradient>
      <radialGradient id="w8-boneshade" cx="38%" cy="32%" r="75%">
        <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
        <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.25} />
      </radialGradient>
      <radialGradient id="w8-boss" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff" stopOpacity={0.2} />
        <stop offset="0.45" stopColor="#fff" stopOpacity={0.04} />
        <stop offset="1" stopColor="#3a2a10" stopOpacity={0.32} />
      </radialGradient>
      {/* A vault seen from outside: a dome, lit at its crown, falling into shadow toward the rim. */}
      <radialGradient id="w8-dome" cx="0.46" cy="0.4" r="0.62">
        <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.85" stopColor="#000" stopOpacity={0.14} />
        <stop offset="1" stopColor="#000" stopOpacity={0.4} />
      </radialGradient>
      <pattern id="w8-cart" width="13" height="12" patternUnits="userSpaceOnUse">
        <ellipse cx="4" cy="4" rx="2.6" ry="2" fill={Q.cartCell} opacity={0.75} />
        <circle cx="4" cy="4" r="1" fill={Q.cartDeep} />
        <ellipse cx="10.5" cy="10" rx="2.4" ry="1.9" fill={Q.cartCell} opacity={0.75} />
        <circle cx="10.5" cy="10" r="0.9" fill={Q.cartDeep} />
      </pattern>
      <pattern id="w8-bone" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 8Q4 3 8 8T16 8" fill="none" stroke="rgba(120,95,50,0.28)" strokeWidth={1} />
        <circle cx="4" cy="12" r="0.9" fill="rgba(90,70,30,0.45)" />
        <circle cx="12" cy="4" r="0.9" fill="rgba(90,70,30,0.45)" />
      </pattern>
      <pattern id="w8-mes" width="20" height="18" patternUnits="userSpaceOnUse">
        <g fill="rgba(255,215,170,0.22)" stroke="rgba(255,215,170,0.16)" strokeWidth={0.8}>
          <circle cx="5" cy="5" r="1.5" />
          <path d="M5 5l-4-2M5 5l3-4M5 5l4 2" />
          <circle cx="15" cy="13" r="1.5" />
          <path d="M15 13l-4-1M15 13l2-4M15 13l3 3" />
        </g>
      </pattern>
      <pattern id="w8-muscle" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
        <path d="M0 2h8M0 6h8" stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
      </pattern>
    </defs>
  );
}
