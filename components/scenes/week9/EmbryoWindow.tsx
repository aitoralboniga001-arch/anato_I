'use client';

import { C, Part, clamp, lerp, rand, smoothPath, type Pt } from '@/components/kit';
import { EarlyEmbryo, earlyGeom } from '@/components/scenes/week5/EarlyEmbryo';
import { spineAt } from '@/components/scenes/week5/skin';
import { HUE, f1 } from './common';

/**
 * Topic 9's embryo is topic 5's day-32 embryo (week5/EarlyEmbryo: same outline, skin, arches, limb
 * buds; face to the left, back to the right), so the student meets the same figure again. What topic 9
 * needs to show inside — the neural tube, the paraxial mesoderm, somitomeres and somites — is seen
 * through a window cut in the skin: a band along the back and a lobe over the head, with a cut rim.
 */

export const DAY = 32;
export const g32 = earlyGeom(DAY);
const S = g32.S;

/** Somites of day 32, exactly where topic 5 draws its beads. */
export const SOM_N = Math.round(g32.somites[0]);
export const somU = (i: number) => 0.06 + (0.9 * i) / (SOM_N - 1);
export const somDepth = (u: number) => lerp(21, 8, u);
export function somite(i: number) {
  const u = somU(i);
  const s = spineAt(S, u, somDepth(u));
  return { c: s.p, a: (Math.atan2(s.t[1], s.t[0]) * 180) / Math.PI, r: lerp(12.5, 4.5, u * u), u, n: s.n };
}
/** Regions on day 32 (36 pairs): occipital 4 (the first of five has gone), cervical 8, thoracic 12, lumbar 5, sacral 5, coccygeal 2. */
export const REGIONS = [
  { name: 'O', from: 0, to: 3, color: HUE.os25 },
  { name: 'C', from: 4, to: 11, color: '#f87171' },
  { name: 'T', from: 12, to: 23, color: '#ef4444' },
  { name: 'L', from: 24, to: 28, color: '#dc2626' },
  { name: 'S', from: 29, to: 33, color: '#b91c1c' },
  { name: 'Co', from: 34, to: 35, color: '#991b1b' },
];
export const regionOf = (i: number) => REGIONS.find((r) => i >= r.from && i <= r.to)!;

/** Somitomeres 1–7 (rostral → caudal): behind the eye, over the arch tops, up to the occipital somites. */
export const SMT: Pt[] = [
  [493, 232],
  [498, 209],
  [505, 186],
  [516, 162],
  [530, 145],
  [546, 132],
  [563, 121],
];
export const EYE: Pt = [g32.eye[0], g32.eye[1]];
export const BARS = g32.bars;

/** Inner depth of the back window (deeper when the myotomes are shown reaching into the flank). */
const dIn = (u: number, widen: number) => lerp(40, 17, u) + widen * lerp(70, 34, u);

/** The window outline: the band along the back joined to the head lobe in one closed path. */
export function windowPath(widen = 0) {
  const n = 46;
  const inner = Array.from({ length: n + 1 }, (_, i) => spineAt(S, lerp(0.97, 0.13, i / n), dIn(lerp(0.97, 0.13, i / n), widen)).p);
  const outer = Array.from({ length: n + 1 }, (_, i) => spineAt(S, lerp(0.035, 0.97, i / n), 2.5).p);
  const e = EYE;
  // Lobe round the somitomere arc (ventral side first, round the eye, back up the dorsal side).
  const lobe: Pt[] = [
    [578, 138],
    [560, 148],
    [542, 158],
    [527, 168],
    [512, 184],
    [509, 214],
    [e[0] + 22, e[1] + 6],
    [e[0] + 10, e[1] + 24],
    [e[0] - 12, e[1] + 22],
    [e[0] - 24, e[1] + 2],
    [e[0] - 18, e[1] - 22],
    [478, 222],
    [484, 196],
    [494, 170],
    [508, 146],
    [526, 126],
    [546, 108],
  ];
  return smoothPath([...inner, ...lobe, ...outer], true, 0.35);
}

/** The embryo with the window: skin outside, the inside seen through a cut rim. `children` are drawn inside (clipped). */
export function WindowEmbryo({ id = 'w9win', widen = 0, children, over }: { id?: string; widen?: number; children?: React.ReactNode; over?: React.ReactNode }) {
  const d = windowPath(widen);
  const dots = Array.from({ length: 150 }, (_, i) => [lerp(380, 760, rand(i * 1.7)), lerp(70, 560, rand(i * 2.3 + 4))] as Pt);
  return (
    <g>
      <EarlyEmbryo day={DAY} hideSomites />
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={d} />
        </clipPath>
        <radialGradient id={`${id}-in`} cx="0.6" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#4a1d26" />
          <stop offset="1" stopColor="#2a0e15" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <path d={d} fill={`url(#${id}-in)`} />
        {dots.map((p, i) => (
          <circle key={i} cx={f1(p[0])} cy={f1(p[1])} r={1.3} fill="rgba(255,190,170,0.16)" />
        ))}
        {/* The brain and the spinal cord, seen from the side (deep, behind the mesoderm). */}
        <Part id="hodi-neurala" quiet>
          <ellipse cx={g32.hind[0]} cy={g32.hind[1] + 6} rx={g32.hind[2] * 0.82} ry={g32.hind[3] * 0.7} fill={C.neural} opacity={0.42} />
          <ellipse cx={g32.cran[0] + 8} cy={g32.cran[1] - 6} rx={g32.cran[2] * 0.78} ry={g32.cran[3] * 0.78} transform={`rotate(${g32.cran[4]} ${g32.cran[0]} ${g32.cran[1]})`} fill={C.neural} opacity={0.42} />
          <path d={smoothPath(Array.from({ length: 40 }, (_, i) => spineAt(S, 0.02 + (0.94 * i) / 39, 6.5).p), false, 0.4)} fill="none" stroke={C.neural} strokeWidth={8} strokeLinecap="round" opacity={0.8} />
        </Part>
        {children}
        {/* Inner shadow of the cut. */}
        <path d={d} fill="none" stroke="#14060a" strokeWidth={10} opacity={0.55} />
      </g>
      {/* The cut rim of the skin. */}
      <path d={d} fill="none" stroke="#f9d3c4" strokeWidth={2.6} />
      <path d={d} fill="none" stroke="#a5503f" strokeWidth={0.9} opacity={0.6} />
      {over}
    </g>
  );
}

/** A somite as topic 5 draws its beads (rounded block across the back), in a given colour. */
export function SomiteBead({ i, fill, k = 1 }: { i: number; fill: string; k?: number }) {
  const s = somite(i);
  const r = s.r * k;
  return (
    <rect
      x={f1(s.c[0] - r * 0.75)}
      y={f1(s.c[1] - r)}
      width={f1(r * 1.5)}
      height={f1(r * 2)}
      rx={f1(r * 0.65)}
      transform={`rotate(${f1(s.a + 90)} ${f1(s.c[0])} ${f1(s.c[1])})`}
      fill={fill}
      stroke="rgba(60,6,14,0.75)"
      strokeWidth={1}
    />
  );
}

/** The myotome of somite i reaching ventrally into the flank (grow 0..1). */
export function myotomeStrip(i: number, grow: number) {
  const s = somite(i);
  const L = lerp(22, 62, 1 - s.u) * clamp(grow);
  const a: Pt = s.c;
  const b: Pt = [s.c[0] + s.n[0] * L, s.c[1] + s.n[1] * L];
  return `M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`;
}
