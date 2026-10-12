'use client';

import { C, lerp, rand, type Pt } from '@/components/kit';
import { f1 } from '@/components/scenes/week7/common';

export { arc, along, f1, length, mirror, morph, normals, offset, poly, resample, sm, spline, vis } from '@/components/scenes/week7/common';
export { Steps, SummaryTable, type TableRow } from '@/components/scenes/week9/common';

/**
 * Shared language of topic 10 (zirkulazio aparatua). One colour per meaning in every view:
 * - germ layers as in topics 3–9 (ectoderm blue, neural plate deep blue, notochord violet, endoderm
 *   yellow, intra-embryonic mesoderm red, parietal layer pale pink, visceral layer rose);
 * - the heart's own layers as in topic 9 (endocardium pink, myocardium magenta) plus cardiac jelly
 *   (translucent sea green) and epicardium (pale rose);
 * - blood by its oxygen: oxygenated red, poorly oxygenated blue (never a purple "mix": mixing is shown
 *   as red and blue cells side by side);
 * - one colour per heart-tube segment, kept by everything that segment becomes (sinus venosus violet,
 *   atrium orange, ventricle cyan, bulbus green: proximal green, conus lime, truncus and aortic sac ivory).
 */
export const T = {
  ecto: C.surfaceEcto,
  ectoDeep: '#4a74c9',
  neural: C.neural,
  neuralDeep: '#24409e',
  noto: C.notochord,
  endo: C.endoderm,
  endoDeep: '#a7801f',
  meso: C.mesoIntra,
  mesoDeep: '#5a2630',
  paraxial: C.mesoParaxial,
  lateral: C.mesoLateral,
  parietal: '#f9b4b4',
  visceral: '#e0707f',
  extra: C.mesoExtra,
  amnion: C.amnioblast,
  amnionCavity: C.amnionCavity,
  yolk: '#2a2413',
  space: '#140e18',
  cavity: 'rgba(120,170,255,0.13)',
  peri: 'rgba(255,120,150,0.20)',
  // Stage 1: blood islands, the horseshoe plexus and its two parts.
  island: '#e8554e',
  angioblast: '#f6b0a8',
  plexus: '#ec6f9e',
  plate: '#e05592',
  // Heart wall (topic 9 colours for endocardium and myocardium).
  endocard: '#f9a8d4',
  jelly: '#a9e4dc',
  myocard: '#d6337a',
  epicard: '#f3b5c4',
  epimyo: '#e46a8c',
  // Blood by oxygen.
  o2: '#e5484d',
  o2Deep: '#8f1d24',
  deo2: '#3b82f6',
  deo2Deep: '#1e3f8f',
  aorta: '#dc2626',
  aortaDeep: '#7f1d1d',
  blood: '#5a0f18',
  // Heart-tube segments.
  sinus: '#9b7bf0',
  sinusDeep: '#5b3fb8',
  atrium: '#ef7d2d',
  atriumDeep: '#9a4310',
  ventricle: '#22b8cf',
  ventricleDeep: '#0e6d7c',
  bulbus: '#3fbf73',
  bulbusDeep: '#1d7a44',
  proximal: '#2fa865',
  conus: '#9ccc3c',
  conusDeep: '#5d8417',
  truncus: '#e6dcc0',
  truncusDeep: '#9a8d68',
  septum: '#f2a65a',
  septumDeep: '#c97a34',
  ink: '#e8eefc',
} as const;

/** Shared gradients and textures of topic 10 (light from the top left, mesenchyme, a glossy tube). */
export function Defs10() {
  return (
    <defs>
      <linearGradient id="w10-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.26} />
      </linearGradient>
      <radialGradient id="w10-ball" cx="35%" cy="32%" r="70%">
        <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.35} />
      </radialGradient>
      <radialGradient id="w10-disc" cx="45%" cy="38%" r="70%">
        <stop offset="0" stopColor="#fff" stopOpacity={0.14} />
        <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.3} />
      </radialGradient>
      <pattern id="w10-mes" width="22" height="20" patternUnits="userSpaceOnUse">
        <g fill="rgba(255,200,200,0.17)" stroke="rgba(255,200,200,0.12)" strokeWidth={0.8}>
          <circle cx="5" cy="5" r="1.5" />
          <path d="M5 5l-4-2M5 5l3-4M5 5l4 2" />
          <circle cx="16" cy="14" r="1.5" />
          <path d="M16 14l-4-1M16 14l2-4M16 14l3 3" />
        </g>
      </pattern>
      <pattern id="w10-jelly" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="5" r="0.9" fill="rgba(255,255,255,0.35)" />
        <circle cx="12" cy="11" r="0.8" fill="rgba(255,255,255,0.28)" />
        <path d="M2 13q3-2 6 0" stroke="rgba(255,255,255,0.18)" fill="none" strokeWidth={0.7} />
      </pattern>
      <pattern id="w10-ecto" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="4.5" cy="4.5" r="1.4" fill="rgba(20,40,110,0.35)" />
        <path d="M0 0h9M0 0v9" stroke="rgba(20,40,110,0.18)" strokeWidth={0.7} />
      </pattern>
      <pattern id="w10-neural" width="7" height="7" patternUnits="userSpaceOnUse">
        <ellipse cx="3.5" cy="3.5" rx="1.1" ry="1.6" fill="rgba(10,20,70,0.45)" />
      </pattern>
    </defs>
  );
}

/**
 * Blood cells carried along a path (a function of t, so a still frame shows where the blood is):
 * `n` cells spaced along the path, moving `speed` path-lengths per unit of stage time.
 */
export function Stream({ pts, t, n = 8, speed = 6, color, r = 3, show = 1, seed = 1 }: { pts: readonly Pt[]; t: number; n?: number; speed?: number; color: string; r?: number; show?: number; seed?: number }) {
  if (show <= 0.01 || pts.length < 2) return null;
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1] || 1;
  const at = (u: number): Pt => {
    const want = u * total;
    let i = 1;
    while (i < L.length - 1 && L[i] < want) i++;
    const k = (want - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
  };
  return (
    <g opacity={show} pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const u = (((i + rand(seed + i) * 0.4) / n + t * speed) % 1 + 1) % 1;
        const p = at(u);
        // Fade in at the start of the path and out at its end.
        const o = Math.min(1, u * 8, (1 - u) * 8);
        return <ellipse key={i} cx={f1(p[0])} cy={f1(p[1])} rx={r * 1.2} ry={r * 0.85} fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth={0.6} opacity={o} />;
      })}
    </g>
  );
}
