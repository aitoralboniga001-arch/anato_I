'use client';

import { Label, Part, clamp, lerp, seg, smoothPath, type Pt } from '@/components/kit';
import { W, f1, length, offset, resample, spline } from './common';

/**
 * The 5-week embryo seen from its left side (head up and to the right, back on the left), drawn the way
 * the course handout draws the origin of the muscles: the paraxial mesoderm as a row of somitomeres in
 * the head and of somites along the back, the eye, the pharyngeal arches, the heart prominence and the
 * limb buds. Shared by the stages about striated muscle (2), the head muscles (3–4) and their connective
 * tissue (5); each scene lights the part it is about.
 */

export const OUTLINE: Pt[] = spline(
  [
    [600, 62], [680, 68], [752, 98], [802, 150], [828, 214], [828, 280], [810, 324], [788, 348], [770, 358], [762, 378],
    [740, 392], [714, 398], [692, 404], [690, 420], [714, 442], [738, 478], [740, 522], [716, 556], [690, 566], [676, 586],
    [638, 602], [594, 608], [556, 604], [526, 602], [498, 612], [470, 624], [444, 628], [422, 614], [418, 598], [394, 590],
    [360, 556], [332, 500], [316, 430], [316, 350], [330, 282], [360, 216], [402, 162], [452, 120], [504, 88], [552, 70],
  ],
  8,
  true,
);

/** Dorsal midline from the hindbrain to the tail (the back the somites line). */
const BACK: Pt[] = spline([[556, 70], [504, 88], [452, 120], [402, 162], [360, 216], [330, 282], [316, 350], [316, 430], [332, 500], [360, 556], [396, 592]], 10);
/** The column of somites, a little inside the back. */
export const COL: Pt[] = resample(offset(BACK, 32), 240);
/** The neural tube under the back: spinal cord, then the brain vesicles in the head. */
export const CORD: Pt[] = resample(offset(BACK, 13), 200);
export const BRAIN: Pt[] = spline([[566, 96], [620, 92], [690, 100], [748, 134], [786, 188], [794, 240]], 8);

/** Somitomeres 1–7 along the head, from the eye back to the hindbrain. */
export const SOMITOMERES: Pt[] = [
  [764, 246],
  [748, 210],
  [724, 180],
  [694, 160],
  [660, 146],
  [626, 136],
  [592, 128],
];
export const EYE: Pt = [782, 290];

/** Pharyngeal arches: centre, size and tilt (1, 2, 3, 4 and 6 are named in topic 9). */
export const ARCHES: { c: Pt; rx: number; ry: number; rot: number; n: string }[] = [
  { c: [748, 360], rx: 15, ry: 30, rot: -26, n: '1' },
  { c: [719, 366], rx: 12, ry: 27, rot: -22, n: '2' },
  { c: [694, 372], rx: 10, ry: 23, rot: -18, n: '3' },
  { c: [673, 377], rx: 8, ry: 18, rot: -16, n: '4' },
  { c: [657, 381], rx: 6, ry: 13, rot: -14, n: '6' },
];
export const HEART_C: Pt = [704, 496];
export const UPPER_LIMB: Pt = [470, 330];
export const LOWER_LIMB: Pt = [452, 524];

/** Somite k (0 = 1st occipital) along the column; 42 pairs fill it from the neck to the tail. */
export const SOMITE_N = 42;
export const somiteAt = (k: number): Pt => COL[Math.round(clamp((k + 0.5) / SOMITE_N) * (COL.length - 1))];
/** Region of somite k: occipital 0–4, cervical 5–12, thoracic 13–24, lumbar 25–29, sacral 30–34, coccygeal 35+. */
export const REGIONS = [
  { name: 'O', from: 0, to: 4 },
  { name: 'C', from: 5, to: 12 },
  { name: 'T', from: 13, to: 24 },
  { name: 'L', from: 25, to: 29 },
  { name: 'S', from: 30, to: 34 },
  { name: 'Co', from: 35, to: 41 },
];

const tangentAt = (pts: readonly Pt[], i: number) => {
  const a = pts[Math.max(0, i - 1)];
  const b = pts[Math.min(pts.length - 1, i + 1)];
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
};
export const somiteAngle = (k: number) => tangentAt(COL, Math.round(clamp((k + 0.5) / SOMITE_N) * (COL.length - 1)));

/** Limb bud as a paddle growing out of the flank (0..1). */
export function limbPath(c: Pt, grow: number, rot: number) {
  const L = lerp(10, 46, grow);
  const w = lerp(22, 30, grow);
  const pts: Pt[] = [
    [-w, 0],
    [-w * 0.8, -L * 0.6],
    [-w * 0.3, -L],
    [w * 0.3, -L],
    [w * 0.8, -L * 0.6],
    [w, 0],
  ];
  const r = (rot * Math.PI) / 180;
  return pts.map(([x, y]) => [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)] as Pt);
}

interface BodyProps {
  /** 0..1: the body behind everything (skin, brain, heart) is dimmed so the mesoderm reads first. */
  dim?: number;
  limbs?: number;
  /** Ids for the parts drawn here (a scene can leave one out to draw it itself, lit). */
  parts?: { eye?: boolean; arches?: boolean; heart?: boolean; brain?: boolean; limbs?: boolean };
  archShow?: number;
}

/** Skin, brain and spinal cord, eye, pharyngeal arches, heart prominence and limb buds. */
export function EmbryoBody({ dim = 0, limbs = 1, parts = {}, archShow = 1 }: BodyProps) {
  const { eye = true, arches = true, heart = true, brain = true, limbs: limbParts = true } = parts;
  const o = 1 - 0.45 * dim;
  return (
    <g>
      <defs>
        <radialGradient id="w9-emb-skin" cx="58%" cy="40%" r="62%">
          <stop offset="0" stopColor="#f2c6b8" />
          <stop offset="0.7" stopColor="#d99a8c" />
          <stop offset="1" stopColor="#a8665c" />
        </radialGradient>
      </defs>
      <Part id="azaleko-ektodermoa" quiet>
        <path d={smoothPath(OUTLINE, true, 0.3)} fill="url(#w9-emb-skin)" stroke="#6d3a33" strokeWidth={1.6} opacity={o} />
      </Part>
      {/* Otic vesicle, liver bulge and the umbilical stump: landmarks that make the side view read. */}
      <circle cx={652} cy={300} r={9} fill="#f6d2c6" stroke="#8a4a40" strokeWidth={1} opacity={0.8 * o} pointerEvents="none" />
      <ellipse cx={652} cy={566} rx={40} ry={26} fill="#8f3a33" opacity={0.28 * o} pointerEvents="none" />
      <path d="M560,604 Q572,632 600,640 L640,640 Q628,628 632,604Z" fill="#e3b0a2" stroke="#7a443b" strokeWidth={1.2} opacity={o} pointerEvents="none" />
      {heart && (
        <Part id="bihotza" quiet>
          <ellipse cx={HEART_C[0]} cy={HEART_C[1]} rx={34} ry={44} fill="#c62d42" opacity={0.55 * o} />
          <ellipse cx={HEART_C[0] - 6} cy={HEART_C[1] - 10} rx={16} ry={20} fill="#ff8a96" opacity={0.25 * o} />
        </Part>
      )}
      {brain && (
        <Part id="hodi-neurala" quiet>
          <path d={smoothPath(CORD, false, 0.3)} fill="none" stroke={W.neural} strokeWidth={12} strokeLinecap="round" opacity={0.42 * o} />
          <path d={smoothPath(BRAIN, false, 0.3)} fill="none" stroke={W.neural} strokeWidth={30} strokeLinecap="round" opacity={0.28 * o} />
          {/* Brain vesicles bulging through the thin skin: midbrain at the crown, forebrain in front, hindbrain behind. */}
          <ellipse cx={660} cy={104} rx={58} ry={34} fill={W.neural} opacity={0.2 * o} />
          <ellipse cx={756} cy={176} rx={46} ry={56} fill={W.neural} opacity={0.2 * o} />
          <ellipse cx={584} cy={100} rx={38} ry={22} fill={W.neural} opacity={0.18 * o} />
        </Part>
      )}
      {eye && (
        <Part id="begia">
          <circle cx={EYE[0]} cy={EYE[1]} r={19} fill="#2b2033" stroke="#1a1020" strokeWidth={1.4} />
          <circle cx={EYE[0] + 3} cy={EYE[1] + 1} r={10} fill="#c9d8f0" opacity={0.85} />
          <circle cx={EYE[0] - 5} cy={EYE[1] - 6} r={3.4} fill="#fff" opacity={0.6} />
        </Part>
      )}
      {arches && (
        <Part id="faringe-arkuak" show={archShow}>
          {ARCHES.map((a) => (
            <g key={a.n}>
              <ellipse cx={a.c[0]} cy={a.c[1]} rx={a.rx} ry={a.ry} transform={`rotate(${a.rot} ${a.c[0]} ${a.c[1]})`} fill="#e98b7a" stroke="#8a3f33" strokeWidth={1.2} opacity={o} />
              <ellipse cx={a.c[0] - 3} cy={a.c[1] - 8} rx={a.rx * 0.45} ry={a.ry * 0.5} transform={`rotate(${a.rot} ${a.c[0]} ${a.c[1]})`} fill="#fff" opacity={0.18 * o} />
            </g>
          ))}
        </Part>
      )}
      {limbParts && limbs > 0.01 && (
        <>
          <Part id="goiko-gorputz-adarraren-hasikina" quiet>
            <path d={smoothPath(limbPath(UPPER_LIMB, limbs, 60), false, 0.3)} fill="#e7ad9e" stroke="#7a443b" strokeWidth={1.3} opacity={o} />
          </Part>
          <Part id="beheko-gorputz-adarraren-hasikina" quiet>
            <path d={smoothPath(limbPath(LOWER_LIMB, limbs * 0.85, 70), false, 0.3)} fill="#e7ad9e" stroke="#7a443b" strokeWidth={1.3} opacity={o} />
          </Part>
        </>
      )}
      <path d={smoothPath(OUTLINE, true, 0.3)} fill="url(#w9-light)" pointerEvents="none" />
    </g>
  );
}

/** A somite block (rounded rectangle across the column) at k. */
export function SomiteBlock({ k, fill, stroke = 'rgba(70,6,14,0.75)', scale = 1 }: { k: number; fill: string; stroke?: string; scale?: number }) {
  const p = somiteAt(k);
  const a = somiteAngle(k);
  const w = (length(COL) / SOMITE_N) * 0.82 * scale;
  return <rect x={f1(p[0] - w / 2)} y={f1(p[1] - 13 * scale)} width={f1(w)} height={f1(26 * scale)} rx={4} transform={`rotate(${f1(a)} ${f1(p[0])} ${f1(p[1])})`} fill={fill} stroke={stroke} strokeWidth={0.9} />;
}

/** Myotome of somite k: a band reaching from the somite into the flank (grow 0..1). */
export function myotomePath(k: number, grow: number) {
  const p = somiteAt(k);
  const a = ((somiteAngle(k) - 90) * Math.PI) / 180;
  const len = lerp(14, 56, grow);
  const w = (length(COL) / SOMITE_N) * 0.36;
  const t: Pt = [Math.cos(a - Math.PI / 2), Math.sin(a - Math.PI / 2)];
  const n: Pt = [Math.cos(a), Math.sin(a)];
  const at = (s: number, d: number): Pt => [p[0] + n[0] * s + t[0] * d, p[1] + n[1] * s + t[1] * d];
  return `M${at(4, -w).map(f1).join(',')} L${at(len, -w * 0.8).map(f1).join(',')} Q${at(len + 6, 0).map(f1).join(',')} ${at(len, w * 0.8).map(f1).join(',')} L${at(4, w).map(f1).join(',')}Z`;
}

/** Labels of the embryo outline parts that scenes commonly name. */
export function BodyLabels({ eye = 1, arches = 1, limbs = 0 }: { eye?: number; arches?: number; limbs?: number }) {
  return (
    <>
      <Label id="begia" x={896} y={262} ax={EYE[0] + 16} ay={EYE[1] - 6} show={eye} small />
      <Label id="faringe-arkuak" x={862} y={456} ax={ARCHES[1].c[0] + 6} ay={ARCHES[1].c[1] + 22} show={arches} small />
      <Label id="goiko-gorputz-adarraren-hasikina" x={190} y={318} ax={UPPER_LIMB[0] + 18} ay={UPPER_LIMB[1] - 12} show={limbs} small />
      <Label id="beheko-gorputz-adarraren-hasikina" x={190} y={520} ax={LOWER_LIMB[0] + 14} ay={LOWER_LIMB[1] - 10} show={limbs} small />
    </>
  );
}

export { seg };
