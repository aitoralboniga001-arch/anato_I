'use client';

import { C } from '@/components/kit';

/**
 * Shared drawing helpers for week 3B (chorionic villi, cytotrophoblastic shell, placental circulation).
 * Orientation follows the notes' figure (week3-p10-12): maternal decidua on top, chorionic plate and
 * chorionic cavity at the bottom, villi growing upwards into the intervillous space.
 */

export const V = {
  /** Fetal blood inside villus capillaries before the heart beats (no direction yet). */
  fetal: '#c23a63',
  fetalPlasma: '#3b1830',
  endothelium: '#f5c9d4',
  /** Towards the placenta (umbilical arteries): deoxygenated. */
  deoxy: '#4f7df0',
  /** Back to the embryo (umbilical vein): oxygenated. */
  oxy: '#ef4444',
  /** Intra-embryonic vessels (mixed blood). */
  intra: '#fb7185',
  shell: '#9ee6b0',
  barrier: '#fde68a',
} as const;

/** Local patterns (ids prefixed w3v-). Render once inside each scene. */
export function VilliDefs() {
  return (
    <defs>
      {/* Cytotrophoblast: individual polygonal cells with a nucleus each (cell borders visible). */}
      <pattern id="w3v-cyto" width="18" height="16" patternUnits="userSpaceOnUse">
        <rect width="18" height="16" fill={C.cyto} />
        <path d="M0 8H18M9 0V8M4 8V16M13 8V16" stroke="rgba(22,80,45,0.5)" strokeWidth="0.8" />
        <circle cx="4.5" cy="4" r="1.7" fill="rgba(22,70,40,0.6)" />
        <circle cx="13.5" cy="4" r="1.7" fill="rgba(22,70,40,0.6)" />
        <circle cx="8.5" cy="12" r="1.7" fill="rgba(22,70,40,0.6)" />
        <circle cx="0" cy="12" r="1.7" fill="rgba(22,70,40,0.6)" />
        <circle cx="18" cy="12" r="1.7" fill="rgba(22,70,40,0.6)" />
      </pattern>
      {/* Maternal blood in the intervillous space: plasma with anucleate red cells. */}
      <pattern id="w3v-mblood" width="26" height="22" patternUnits="userSpaceOnUse">
        <rect width="26" height="22" fill="#9d1b33" />
        <ellipse cx="6" cy="6" rx="3.6" ry="2.4" fill="#e0344f" />
        <ellipse cx="19" cy="9" rx="3.6" ry="2.4" fill="#e0344f" transform="rotate(30 19 9)" />
        <ellipse cx="11" cy="17" rx="3.6" ry="2.4" fill="#e0344f" transform="rotate(-20 11 17)" />
      </pattern>
    </defs>
  );
}

export const f1 = (v: number) => v.toFixed(1);

/**
 * Finger-shaped outline (a villus or one of its layers) with its base centred on the origin and the
 * rounded tip at (0, -len). `flare` widens the base where it merges with the chorionic plate.
 */
export function fingerD(len: number, hw: number, flare = 8) {
  if (len < 1) return '';
  const h = Math.min(hw, len * 0.7);
  const fl = Math.min(flare, Math.max(0, len - h));
  const top = -(len - h);
  return (
    `M${f1(-h - fl)},0 Q${f1(-h)},0 ${f1(-h)},${f1(-fl)} L${f1(-h)},${f1(top)} ` +
    `A${f1(h)} ${f1(h)} 0 0 1 ${f1(h)},${f1(top)} L${f1(h)},${f1(-fl)} Q${f1(h)},0 ${f1(h + fl)},0 Z`
  );
}

/** Transform placing a finger's base at (x, y) and turning it by `deg` (0 = pointing up, + = clockwise). */
export const place = (x: number, y: number, deg = 0) => `translate(${f1(x)} ${f1(y)}) rotate(${f1(deg)})`;

/** A point `d` along a finger placed at (x, y) with angle `deg`, offset `o` sideways (+ = to its right). */
export function alongFinger(x: number, y: number, deg: number, d: number, o = 0): [number, number] {
  const r = (deg * Math.PI) / 180;
  return [x + d * Math.sin(r) + o * Math.cos(r), y - d * Math.cos(r) + o * Math.sin(r)];
}

/** Capillary loop inside a villus core (local coordinates of a finger): up one side, round the tip, down the other. */
export function loopD(len: number, half: number) {
  if (len < half + 2) return '';
  const top = -(len - half);
  return `M${f1(-half)},0 L${f1(-half)},${f1(top)} A${f1(half)} ${f1(half)} 0 0 1 ${f1(half)},${f1(top)} L${f1(half)},0`;
}

/** Microvilli fringe along a horizontal edge (syncytiotrophoblast surface facing maternal blood). */
export function fringeD(x0: number, x1: number, y: number, dir: -1 | 1, step = 5, h = 4) {
  let d = '';
  for (let x = x0; x <= x1; x += step) d += `M${f1(x)},${f1(y)} l0,${f1(dir * h)}`;
  return d;
}
