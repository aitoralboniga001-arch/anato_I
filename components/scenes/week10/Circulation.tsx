'use client';

import { Callouts, Note, Part, clamp, lerp, rand, smoothPath, type Callout, type Pt, type SceneProps } from '@/components/kit';
import { EarlyEmbryo, earlyGeom } from '@/components/scenes/week5/EarlyEmbryo';
import { spineAt } from '@/components/scenes/week5/skin';
import { Defs10, Steps, Stream, SummaryTable, T, f1, offset, spline, vis } from './common';

/**
 * 10:zirkulazio-goiztiarra `alboa` — the 4th-week circulation on topic 5's day-28 embryo (week5/EarlyEmbryo:
 * face to the left = ventral, back to the right), its body see-through, inside its sacs. The camera starts
 * outside (the chorionic cavity, the amnion, the yolk sac, the cord to the placenta), dives into the embryo,
 * and leaves it again whenever a vessel comes from or goes to the yolk sac or the placenta: the student
 * follows each stream from where it starts to where it ends. One colour per oxygen (red O₂, blue poor in O₂);
 * mixing is red and blue cells side by side, never purple. Vessels are paired: the far one shows faintly
 * behind the near one.
 */

/** Step starts of stage 3 (shared with the 3D view and the content file). */
export const S3 = [0, 0.08, 0.19, 0.3, 0.38, 0.48, 0.57, 0.66, 0.74, 0.8, 0.87, 0.94] as const;

const DAY = 28;
const g = earlyGeom(DAY);
const back = (u: number, d: number): Pt => spineAt(g.S, u, d).p;

// ———————————————————————————— camera ————————————————————————————

interface Cam {
  fx: number;
  fy: number;
  s: number;
  tx?: number;
}
/** The whole chorionic sac; the embryo; the heart; the yolk sac → heart route; the placenta → heart route; the arches; the summary. */
const WORLD: Cam = { fx: 352, fy: 322, s: 0.8 };
const EMB: Cam = { fx: 585, fy: 322, s: 1.12 };
const HEART: Cam = { fx: 568, fy: 298, s: 2.3 };
const YOLK: Cam = { fx: 392, fy: 404, s: 1.02 };
const PLAC: Cam = { fx: 262, fy: 282, s: 0.92 };
const ARCH: Cam = { fx: 560, fy: 222, s: 2.0 };
const TABLE: Cam = { fx: 590, fy: 322, s: 0.95, tx: 772 };

const KEYS: [number, Cam][] = [
  [0, WORLD],
  [0.028, WORLD],
  [0.065, EMB],
  [0.088, EMB],
  [0.108, WORLD],
  [0.148, WORLD],
  [0.17, EMB],
  [0.2, HEART],
  [0.29, HEART],
  [0.31, EMB],
  [0.48, EMB],
  [0.497, YOLK],
  [0.522, YOLK],
  [0.556, EMB],
  [0.572, EMB],
  [0.59, PLAC],
  [0.616, PLAC],
  [0.65, EMB],
  [0.662, EMB],
  [0.678, ARCH],
  [0.712, ARCH],
  [0.732, EMB],
  [0.8, EMB],
  [0.818, WORLD],
  [0.862, WORLD],
  [0.9, EMB],
  [0.93, EMB],
  [0.955, TABLE],
];

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));

function camAt(t: number): Required<Cam> {
  const full = (c: Cam): Required<Cam> => ({ ...c, tx: c.tx ?? 500 });
  if (t <= KEYS[0][0]) return full(KEYS[0][1]);
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, c1] = KEYS[i];
    if (t <= t1) {
      const [t0, c0] = KEYS[i - 1];
      const k = ease((t - t0) / (t1 - t0 || 1));
      const a = full(c0);
      const b = full(c1);
      // Scale glides geometrically, and the focus point so the picture slides at the zoom's own pace.
      const s = a.s * Math.pow(b.s / a.s, k);
      const w = a.s === b.s ? k : (1 / a.s - 1 / s) / (1 / a.s - 1 / b.s || 1);
      return { fx: lerp(a.fx, b.fx, w), fy: lerp(a.fy, b.fy, w), s, tx: lerp(a.tx, b.tx, k) };
    }
  }
  return full(KEYS[KEYS.length - 1][1]);
}

// ———————————————————————————— the conceptus (outside the embryo) ————————————————————————————

const SAC = { cx: 352, cy: 322, rx: 428, ry: 300 };
const rad = (a: number) => (a * Math.PI) / 180;
const sacPt = (a: number, d = 0): Pt => [SAC.cx + (SAC.rx + d) * Math.cos(rad(a)), SAC.cy + (SAC.ry + d) * Math.sin(rad(a))];
/** The villous chorion (the placenta, karena) on the upper left of the sac. */
const PLATE = [168, 246] as const;
const PLATE_MID: Pt = sacPt(207, 10);
const AMNION = { cx: 572, cy: 322, rx: 186, ry: 272 };
const YOLK_C: Pt = [222, 474];
const YOLK_R = 58;

/** The cord from the embryo's cord to the placenta, and the yolk stalk off it. */
const CORD_PTS: Pt[] = spline([[430, 357], [380, 346], [318, 328], [236, 296], [150, 256], [68, 222], sacPt(207, 0)], 10);
const STALK_PTS: Pt[] = spline([[326, 331], [300, 368], [272, 410], YOLK_C], 10);
const VILLI = Array.from({ length: 13 }, (_, i) => {
  const a = lerp(PLATE[0] + 5, PLATE[1] - 5, i / 12);
  const k = Math.sin((Math.PI * (a - PLATE[0])) / (PLATE[1] - PLATE[0])) ** 0.5;
  const b = sacPt(a, 14 * k);
  const tip = sacPt(a + (rand(i) - 0.5) * 4, 14 * k + (14 + 10 * rand(i + 4)) * k);
  const mid = sacPt(a, 14 * k + 9 * k);
  const tw = sacPt(a + (i % 2 ? 4 : -4), 14 * k + 18 * k);
  return `M${f1(b[0])},${f1(b[1])}L${f1(tip[0])},${f1(tip[1])}M${f1(mid[0])},${f1(mid[1])}L${f1(tw[0])},${f1(tw[1])}`;
}).join('');
const arcD = (a0: number, a1: number, d: (a: number) => number, n = 40) => {
  const o = Array.from({ length: n + 1 }, (_, i) => sacPt(lerp(a0, a1, i / n), d(lerp(a0, a1, i / n))));
  const inn = Array.from({ length: n + 1 }, (_, i) => sacPt(lerp(a1, a0, i / n), 0));
  return `${smoothPath(o, false)} L${f1(inn[0][0])},${f1(inn[0][1])} ${smoothPath(inn, false).replace(/^M/, 'L')} Z`;
};
const PLATE_D = arcD(PLATE[0], PLATE[1], (a) => 16 * Math.sin((Math.PI * (a - PLATE[0])) / (PLATE[1] - PLATE[0])) ** 0.5);

// ———————————————————————————— the heart tube (side view) ————————————————————————————

/** Venous end (sinus venosus, in the septum transversum) → arterial end (aortic sac, under the arches). */
const TUBE: Pt[] = spline([[606, 344], [590, 329], [567, 313], [547, 295], [534, 275], [529, 254]], 8);
const SIN: Pt = TUBE[0];
const SAC_PT: Pt = TUBE[TUBE.length - 1];
const tubeAt = (u: number): Pt => TUBE[Math.round(clamp(u) * (TUBE.length - 1))];
const tubePart = (u0: number, u1: number) => TUBE.slice(Math.round(u0 * (TUBE.length - 1)), Math.round(u1 * (TUBE.length - 1)) + 1);
/** Segments from the venous end: sinus venosus, atrium, ventricle, bulbus, aortic sac (with their widths). */
const SEGS = [
  { id: 'zain-sinua', u: [0, 0.16], w: 15, c: T.sinus, d: T.sinusDeep },
  { id: 'atal-aurikularra', u: [0.16, 0.38], w: 19, c: T.atrium, d: T.atriumDeep },
  { id: 'atal-bentrikularra', u: [0.38, 0.64], w: 23, c: T.ventricle, d: T.ventricleDeep },
  { id: 'atal-bulbarra', u: [0.64, 0.88], w: 17, c: T.bulbus, d: T.bulbusDeep },
  { id: 'aorta-zakua', u: [0.88, 1], w: 13, c: T.truncus, d: T.truncusDeep },
] as const;

// ———————————————————————————— vessels ————————————————————————————

const J: Pt = [662, 296];
const V = {
  antCard: spline([[446, 142], [482, 120], [532, 116], [584, 132], [624, 166], [648, 212], [660, 258], J], 8),
  postCard: spline([...[0.8, 0.72, 0.64, 0.56, 0.48, 0.42, 0.37].map((u) => back(u, 56)), J], 8),
  commonCard: spline([J, [640, 318], [620, 334], [SIN[0] + 4, SIN[1]]], 8),
  vitVein: spline([[506, 372], [540, 375], [572, 372], [596, 361], [SIN[0] - 1, SIN[1] + 4]], 8),
  umbVein: spline([[498, 381], [518, 368], [540, 355], [568, 349], [SIN[0] - 6, SIN[1]]], 8),
  dao: spline([[488, 186], [520, 178], [562, 176], [604, 179], [640, 192], ...[0.27, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.8].map((u) => back(u, 38))], 8),
  vitArt: spline([back(0.5, 38), [612, 410], [572, 398], [536, 386], [508, 376]], 8),
  umbArt: spline([back(0.7, 38), [512, 494], [500, 452], [497, 416], [502, 386]], 8),
};
/** The aortic arches: from the aortic sac up through the pharyngeal arches to the dorsal aorta. */
const ARCHES = g.bars.slice(0, 3).map((b) =>
  spline([SAC_PT, [b.bot[0] + 2, b.bot[1] - 3], [lerp(b.bot[0], b.top[0], 0.5) + 2, lerp(b.bot[1], b.top[1], 0.5)], [b.top[0] + 3, b.top[1] - 2], [b.top[0] + 6, 177]], 8),
);
/** Outside: the umbilical and vitelline vessels in the cord, to the placenta and the yolk sac. */
const CORD_IN: Pt[] = [[506, 378], [470, 368]];
const OUT = {
  umb: spline([...CORD_IN, ...CORD_PTS], 4),
  vit: spline([...CORD_IN, ...CORD_PTS.slice(0, 4), ...STALK_PTS.slice(1)], 4),
};
/** Branches of the vessels in the villi and over the yolk sac wall. */
const PLACENTA_TWIGS = Array.from({ length: 9 }, (_, i) => {
  const a = lerp(PLATE[0] + 10, PLATE[1] - 10, i / 8);
  const p = sacPt(a, 6);
  return [lerp(PLATE_MID[0], p[0], 0.25), lerp(PLATE_MID[1], p[1], 0.25), p[0], p[1]] as const;
});
const YOLK_TWIGS = Array.from({ length: 7 }, (_, i) => {
  const a = rad(-40 + i * 34);
  const p: Pt = [YOLK_C[0] + Math.cos(a) * YOLK_R * 0.9, YOLK_C[1] + Math.sin(a) * YOLK_R * 0.9];
  return [lerp(STALK_PTS[STALK_PTS.length - 3][0], p[0], 0.2), lerp(STALK_PTS[STALK_PTS.length - 3][1], p[1], 0.2), p[0], p[1]] as const;
});

/** A vessel: dark rim, colour, a soft highlight; the pair's far vessel faintly behind. */
function Vessel({ id, pts, w, c, d, show = 1, far = true, grow = 1 }: { id: string; pts: Pt[]; w: number; c: string; d: string; show?: number; far?: boolean; grow?: number }) {
  if (show <= 0.01) return null;
  const n = Math.max(2, Math.round(pts.length * clamp(grow)));
  const dd = smoothPath(pts.slice(0, n), false, 0.4);
  const body = (
    <>
      <path d={dd} fill="none" stroke={d} strokeWidth={w + 2.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={dd} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={dd} fill="none" stroke="#fff" strokeWidth={w * 0.28} strokeLinecap="round" opacity={0.35} transform="translate(-0.6 -0.7)" />
    </>
  );
  return (
    <Part id={id} show={show}>
      {far && (
        <g transform="translate(8 -7)" opacity={0.34}>
          {body}
        </g>
      )}
      {body}
    </Part>
  );
}

/** Arrowheads along a path (direction of flow), at fractions `at`. */
function Heads({ pts, at, color, size = 7, show = 1 }: { pts: Pt[]; at: number[]; color: string; size?: number; show?: number }) {
  if (show <= 0.01) return null;
  return (
    <g opacity={show} pointerEvents="none">
      {at.map((u) => {
        const i = Math.min(pts.length - 2, Math.max(0, Math.round(u * (pts.length - 1))));
        const a = pts[i];
        const b = pts[i + 1];
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const tip: Pt = [a[0] + c * size * 0.6, a[1] + s * size * 0.6];
        const l: Pt = [a[0] - c * size * 0.6 - s * size * 0.55, a[1] - s * size * 0.6 + c * size * 0.55];
        const r: Pt = [a[0] - c * size * 0.6 + s * size * 0.55, a[1] - s * size * 0.6 - c * size * 0.55];
        return <path key={u} d={`M${f1(tip[0])},${f1(tip[1])}L${f1(l[0])},${f1(l[1])}L${f1(r[0])},${f1(r[1])}Z`} fill={color} stroke="rgba(10,6,12,0.8)" strokeWidth={0.8} />;
      })}
    </g>
  );
}

/** Oxygen fading along the dorsal aorta: more blue cells caudally (red and blue side by side, no purple). */
function AortaCells({ t, show }: { t: number; show: number }) {
  if (show <= 0.01) return null;
  const pts = V.dao;
  const n = 22;
  return (
    <g opacity={show} pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const u = ((i / n + t * 5) % 1 + 1) % 1;
        const p = pts[Math.round(u * (pts.length - 1))];
        const blue = rand(i * 3.1) < u * 0.75;
        return <ellipse key={i} cx={f1(p[0])} cy={f1(p[1])} rx={2.9} ry={2.1} fill={blue ? T.deo2 : T.o2} stroke="rgba(0,0,0,0.45)" strokeWidth={0.5} opacity={Math.min(1, u * 10, (1 - u) * 10)} />;
      })}
    </g>
  );
}

const BODY: Pt[] = [...g.spine, ...[...g.inner].reverse()];
const ell = (e: readonly number[], k = 1) => (
  <ellipse cx={e[0]} cy={e[1]} rx={e[2] * k} ry={e[3] * k} transform={e[4] ? `rotate(${e[4]} ${e[0]} ${e[1]})` : undefined} />
);
const NECK: Pt[] = [[470, 120], [560, 110], [600, 190], [592, 250], [520, 262], [480, 240], [440, 210]];

/** The embryo with a see-through body: its skin, then the inside darkened toward the middle. */
function GlassEmbryo({ clip }: { clip: string }) {
  return (
    <>
      <EarlyEmbryo day={DAY} hideSomites />
      <defs>
        <clipPath id={clip}>
          <path d={smoothPath(BODY, true, 0.5)} />
          {ell(g.cran)}
          {ell(g.hind)}
          {ell(g.face)}
          {ell(g.heart)}
          <path d={smoothPath(NECK, true, 0.4)} />
        </clipPath>
        <filter id={`${clip}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <g clipPath={`url(#${clip})`} pointerEvents="none">
        <g filter={`url(#${clip}-soft)`} fill="#17070f" opacity={0.9}>
          <path d={smoothPath(BODY, true, 0.5)} />
          {ell(g.cran, 0.9)}
          {ell(g.hind, 0.9)}
          {ell(g.face, 0.8)}
          {ell(g.heart, 0.9)}
          <path d={smoothPath(NECK, true, 0.4)} />
        </g>
      </g>
    </>
  );
}

const NEURAL: Pt[] = Array.from({ length: 40 }, (_, i) => back(0.03 + (0.9 * i) / 39, 8));
const GUT: Pt[] = spline([[512, 214], [552, 214], [592, 236], [618, 282], [626, 330], [612, 372], [572, 392], [530, 384], [506, 374]], 8);

// ———————————————————————————— the scene ————————————————————————————

export function CirculationSide({ t }: SceneProps) {
  const cam = camAt(t);
  const tr = `translate(${f1(cam.tx)} 320) scale(${cam.s.toFixed(4)}) translate(${f1(-cam.fx)} ${f1(-cam.fy)})`;
  const toScreen = (p: Pt) => ({ x: cam.tx + (p[0] - cam.fx) * cam.s, y: 320 + (p[1] - cam.fy) * cam.s });

  // Segments get their colours as they are named (step 3, in the 3D view); before, one tube with two ends.
  const segOn = vis(t, S3[2] + 0.02);
  const veinsOn = { umb: vis(t, S3[1] + 0.01), vit: vis(t, S3[1] + 0.025), card: vis(t, S3[1] + 0.05) };
  const archOn = vis(t, S3[2] + 0.04);
  const artOut = vis(t, S3[9]);
  const table = vis(t, S3[11] + 0.01);
  const flowV = vis(t, S3[1] + 0.03) * (1 - 0.5 * table);
  const flowA = vis(t, S3[3]) * (1 - 0.5 * table);
  const outside = 1 - table;

  // From step 5 on, the stream being told is in full; the others keep flowing, quieter.
  const featured = (a: number, b: number) => (t >= S3[4] && t < S3[10] ? (t >= a && t < b ? 1 : 0.4) : 1);
  const sCard = featured(S3[4], S3[5]);
  const sVit = featured(S3[5], S3[6]);
  const sUmb = featured(S3[6], S3[7]);
  const sArt = featured(S3[7], S3[9]);
  const sOut = featured(S3[9], S3[10]);

  const names: { id: string; p: Pt; show: number; small?: boolean; text?: string; key?: string }[] = [
    { id: 'korion-barrunbea', p: [150, 420], show: vis(t, 0, S3[1]) + vis(t, S3[9] + 0.015, S3[9] + 0.06), small: true },
    { id: 'amnios-barrunbea', p: [418, 210], show: vis(t, 0, S3[1]), small: true },
    { id: 'zilborrestea', p: CORD_PTS[8], show: vis(t, 0, S3[1]) + vis(t, S3[1] + 0.02, S3[2]) + vis(t, S3[6] + 0.01, S3[7]), small: true },
    { id: 'karena', p: PLATE_MID, show: vis(t, 0, S3[1]) + vis(t, S3[1] + 0.02, S3[2]) + vis(t, S3[6] + 0.01, S3[7]) + vis(t, S3[9] + 0.015, S3[10]) },
    { id: 'bitelo-zaku-sekundarioa', text: 'Bitelo zakua', p: [YOLK_C[0] - 10, YOLK_C[1] + 10], show: vis(t, 0, S3[1]) + vis(t, S3[1] + 0.02, S3[2]) + vis(t, S3[5] + 0.01, S3[6]) + vis(t, S3[9] + 0.015, S3[10]) },
    { id: 'zain-muturra', p: tubeAt(0.08), show: vis(t, 0, S3[2]) },
    { id: 'arteria-muturra', p: tubeAt(0.94), show: vis(t, 0, S3[2]) },
    { id: 'aorta-zakua', p: tubeAt(0.95), show: vis(t, S3[2] + 0.02, S3[3]) + vis(t, S3[7], S3[8]) },
    { id: 'atal-bulbarra', p: tubeAt(0.76), show: vis(t, S3[2] + 0.02, S3[3]) },
    { id: 'atal-bentrikularra', p: tubeAt(0.51), show: vis(t, S3[2] + 0.02, S3[3]) },
    { id: 'atal-aurikularra', p: tubeAt(0.27), show: vis(t, S3[2] + 0.02, S3[3]) + vis(t, S3[10], S3[11]) },
    { id: 'zain-sinua', p: tubeAt(0.07), show: vis(t, S3[2] + 0.02, S3[3]) + vis(t, S3[4], S3[7]) },
    { id: 'zilbor-zainak', p: V.umbVein[14], show: veinsOn.umb * vis(t, 0, S3[2]) + vis(t, S3[3], S3[4]) + vis(t, S3[6], S3[7]), small: true },
    { id: 'bitelo-zainak', p: V.vitVein[18], show: veinsOn.vit * vis(t, 0, S3[2]) + vis(t, S3[3], S3[4]) + vis(t, S3[5], S3[6]), small: true },
    { id: 'bena-kardinal-komuna', p: V.commonCard[10], show: veinsOn.card * vis(t, 0, S3[2]) + vis(t, S3[3], S3[5]), small: true },
    { id: 'aurreko-zain-kardinalak', p: V.antCard[22], show: veinsOn.card * vis(t, 0, S3[2]) + vis(t, S3[4], S3[5]), small: true },
    { id: 'atzeko-zain-kardinalak', p: V.postCard[24], show: veinsOn.card * vis(t, 0, S3[2]) + vis(t, S3[4], S3[5]), small: true },
    { id: 'aorta-arkuak', p: ARCHES[1][16], show: archOn * vis(t, 0, S3[4]) + vis(t, S3[7], S3[8]) },
    { id: 'aorta-dortsalak', p: V.dao[52], show: archOn * vis(t, 0, S3[4]) + vis(t, S3[7], S3[10]) },
    { id: 'bitelo-arteriak', p: V.vitArt[16], show: vis(t, S3[9] + 0.005, S3[11]), small: true },
    { id: 'zilbor-arteriak', p: V.umbArt[18], show: vis(t, S3[9] + 0.005, S3[11]), small: true },
    { id: 'perikardio-barrunbea', p: [g.heart[0] - 22, g.heart[1] + 26], show: vis(t, 0, S3[1]), small: true },
    { id: 'septum-transversum', p: [570, 352], show: vis(t, S3[4], S3[6]), small: true },
  ];
  const callouts: Callout[] = [];
  for (const n of names) {
    const show = clamp(n.show) * (1 - table);
    if (show <= 0.01) continue;
    const q = toScreen(n.p);
    if (q.x < 20 || q.x > 980 || q.y < 20 || q.y > 620) continue;
    callouts.push({ id: n.id, at: q, show, small: n.small, text: n.text, key: n.key });
  }

  const tubeFlowPts = TUBE;
  return (
    <g>
      <Defs10 />
      <g transform={tr}>
        {/* The chorionic sac: chorion all round, the villous chorion (placenta) on the upper left. */}
        <g opacity={clamp(outside * 1.2)}>
          <Part id="korion-barrunbea" quiet>
            <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx} ry={SAC.ry} fill="#1c1626" />
          </Part>
          <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx + 5} ry={SAC.ry + 5} fill="none" stroke={T.extra} strokeWidth={8} opacity={0.55} />
          <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx + 11} ry={SAC.ry + 11} fill="none" stroke="#5aa76a" strokeWidth={5} opacity={0.6} />
          <Part id="karena">
            <path d={PLATE_D} fill="#c2415f" stroke="#7a1f36" strokeWidth={1.4} />
            <path d={VILLI} fill="none" stroke="#c2415f" strokeWidth={4.5} strokeLinecap="round" />
            <path d={VILLI} fill="none" stroke="#e98aa0" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
          </Part>
          {/* The yolk sac hangs in the chorionic cavity on its stalk. */}
          <Part id="bitelo-zaku-sekundarioa">
            <circle cx={YOLK_C[0]} cy={YOLK_C[1]} r={YOLK_R} fill="#d9b13b" stroke="#8a6a1e" strokeWidth={2} />
            <circle cx={YOLK_C[0]} cy={YOLK_C[1]} r={YOLK_R} fill="url(#w10-ball)" />
          </Part>
          <Part id="hodi-onfalomesenterikoa" quiet>
            <path d={smoothPath(STALK_PTS, false)} fill="none" stroke="#8a6a1e" strokeWidth={13} strokeLinecap="round" />
            <path d={smoothPath(STALK_PTS, false)} fill="none" stroke="#e2bf55" strokeWidth={9.5} strokeLinecap="round" />
          </Part>
          {/* The amnion round the embryo (its cavity), sleeving the cord where it leaves. */}
          <Part id="amnios-barrunbea" quiet>
            <ellipse cx={AMNION.cx} cy={AMNION.cy} rx={AMNION.rx} ry={AMNION.ry} fill={T.amnionCavity} opacity={0.22} />
            <ellipse cx={AMNION.cx} cy={AMNION.cy} rx={AMNION.rx} ry={AMNION.ry} fill="none" stroke={T.amnion} strokeWidth={3} opacity={0.75} />
          </Part>
          <Part id="zilborrestea">
            <path d={smoothPath(CORD_PTS, false)} fill="none" stroke="#8f3f37" strokeWidth={36} strokeLinecap="round" />
            <path d={smoothPath(CORD_PTS, false)} fill="none" stroke="#e9a191" strokeWidth={33} strokeLinecap="round" />
            <path d={smoothPath(offset(CORD_PTS, () => -8), false)} fill="none" stroke="#fff4ee" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
          </Part>
        </g>

        <GlassEmbryo clip="w10circ-body" />

        {/* Landmarks inside: the brain and spinal cord, the gut to the yolk stalk, the pericardial cavity, the septum. */}
        <g pointerEvents="none" opacity={0.75}>
          <ellipse cx={g.hind[0]} cy={g.hind[1] + 4} rx={g.hind[2] * 0.78} ry={g.hind[3] * 0.68} fill={T.neural} opacity={0.32} />
          <ellipse cx={g.cran[0] + 6} cy={g.cran[1] - 4} rx={g.cran[2] * 0.78} ry={g.cran[3] * 0.78} transform={`rotate(${g.cran[4]} ${g.cran[0]} ${g.cran[1]})`} fill={T.neural} opacity={0.32} />
          <path d={smoothPath(NEURAL, false)} fill="none" stroke={T.neural} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
          <path d={smoothPath(GUT, false)} fill="none" stroke={T.endo} strokeWidth={7} strokeLinecap="round" opacity={0.42} />
        </g>
        <Part id="perikardio-barrunbea" quiet>
          <ellipse cx={g.heart[0]} cy={g.heart[1]} rx={g.heart[2] * 0.92} ry={g.heart[3] * 0.9} fill={T.peri} stroke="#ffb3c4" strokeWidth={1} strokeOpacity={0.4} />
        </Part>
        <Part id="septum-transversum" quiet>
          <ellipse cx={574} cy={352} rx={42} ry={11} transform="rotate(10 574 352)" fill={T.septum} opacity={0.4} />
        </Part>

        {/* Arteries: the dorsal aortas along the back, the aortic arches in the pharyngeal arches; later the
            vitelline and umbilical arteries out to the yolk sac and the placenta. */}
        <Vessel id="aorta-dortsalak" pts={V.dao} w={5.5} c={T.aorta} d={T.aortaDeep} />
        {ARCHES.map((a, i) => (
          <Vessel key={i} id="aorta-arkuak" pts={a} w={3.6} c={T.o2} d={T.o2Deep} show={archOn} grow={archOn} />
        ))}
        <Vessel id="bitelo-arteriak" pts={V.vitArt} w={3.4} c={T.deo2} d={T.deo2Deep} show={artOut} grow={vis(t, S3[9], 2, 0.02)} />
        <Vessel id="zilbor-arteriak" pts={V.umbArt} w={3.6} c={T.deo2} d={T.deo2Deep} show={artOut} grow={vis(t, S3[9], 2, 0.02)} />

        {/* Veins to the venous end. */}
        <Vessel id="aurreko-zain-kardinalak" pts={V.antCard} w={3.8} c={T.deo2} d={T.deo2Deep} show={veinsOn.card} />
        <Vessel id="atzeko-zain-kardinalak" pts={V.postCard} w={3.8} c={T.deo2} d={T.deo2Deep} show={veinsOn.card} />
        <Vessel id="bena-kardinal-komuna" pts={V.commonCard} w={5.2} c={T.deo2} d={T.deo2Deep} show={veinsOn.card} />
        <Vessel id="bitelo-zainak" pts={V.vitVein} w={4.2} c={T.deo2} d={T.deo2Deep} show={veinsOn.vit} />
        <Vessel id="zilbor-zainak" pts={V.umbVein} w={4.2} c={T.o2} d={T.o2Deep} show={veinsOn.umb} />

        {/* The vessels in the cord, to the placenta and the yolk sac. */}
        <g opacity={clamp(outside * 1.2)}>
          <Part id="zilbor-zainak" show={veinsOn.umb}>
            <path d={smoothPath(offset(OUT.umb, () => 4), false)} fill="none" stroke={T.o2} strokeWidth={3} strokeLinecap="round" />
            {PLACENTA_TWIGS.map((q, i) => (
              <path key={i} d={`M${f1(q[0])},${f1(q[1])}L${f1(q[2])},${f1(q[3])}`} stroke={T.o2} strokeWidth={1.8} strokeLinecap="round" />
            ))}
          </Part>
          <Part id="zilbor-arteriak" show={artOut}>
            <path d={smoothPath(offset(OUT.umb, () => -4), false)} fill="none" stroke={T.deo2} strokeWidth={2.6} strokeLinecap="round" />
          </Part>
          <Part id="bitelo-zainak" show={veinsOn.vit}>
            <path d={smoothPath(offset(OUT.vit, () => 2.5), false)} fill="none" stroke={T.deo2} strokeWidth={2.4} strokeLinecap="round" />
            {YOLK_TWIGS.map((q, i) => (
              <path key={i} d={`M${f1(q[0])},${f1(q[1])}L${f1(q[2])},${f1(q[3])}`} stroke={T.deo2} strokeWidth={1.6} strokeLinecap="round" />
            ))}
          </Part>
          <Part id="bitelo-arteriak" show={artOut}>
            <path d={smoothPath(offset(OUT.vit, () => -2.5), false)} fill="none" stroke="#7aa7f7" strokeWidth={2} strokeLinecap="round" />
          </Part>
        </g>

        {/* The heart tube: one tube with two ends, then its segments in their colours. */}
        <g>
          {segOn < 0.99 && (
            <g opacity={1 - segOn}>
              {(
                [
                  ['zain-muturra', 0, 0.24],
                  ['bihotz-hodia', 0.22, 0.78],
                  ['arteria-muturra', 0.76, 1],
                ] as const
              ).map(([id, a, b]) => (
                <Part key={id} id={id}>
                  <path d={smoothPath(tubePart(a, b), false)} fill="none" stroke="#7a1636" strokeWidth={21} strokeLinecap="round" />
                  <path d={smoothPath(tubePart(a, b), false)} fill="none" stroke={T.myocard} strokeWidth={18} strokeLinecap="round" />
                </Part>
              ))}
            </g>
          )}
          {segOn > 0.01 &&
            SEGS.map((s) => (
              <Part key={s.id} id={s.id} show={segOn} groups={['bihotz-hodia']}>
                <path d={smoothPath(tubePart(s.u[0], s.u[1]), false)} fill="none" stroke={s.d} strokeWidth={s.w + 3} strokeLinecap="round" />
                <path d={smoothPath(tubePart(s.u[0], s.u[1]), false)} fill="none" stroke={s.c} strokeWidth={s.w} strokeLinecap="round" />
              </Part>
            ))}
          <path d={smoothPath(offset(TUBE, () => -4), false)} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.28} pointerEvents="none" />
        </g>

        {/* Blood: veins to the heart, mixed in the tube (red and blue side by side), arteries away from it. */}
        <Stream pts={[...OUT.umb].reverse()} t={t} n={16} speed={2.2} color={T.o2} r={2.4} show={flowV * veinsOn.umb * sUmb * outside} seed={2} />
        <Stream pts={[...OUT.vit].reverse()} t={t} n={12} speed={2.2} color={T.deo2} r={2.2} show={flowV * veinsOn.vit * sVit * outside} seed={3} />
        <Stream pts={V.umbVein} t={t} n={4} speed={5} color={T.o2} r={2.2} show={flowV * veinsOn.umb * sUmb} seed={4} />
        <Stream pts={V.vitVein} t={t} n={4} speed={5} color={T.deo2} r={2.2} show={flowV * veinsOn.vit * sVit} seed={5} />
        <Stream pts={V.antCard} t={t} n={8} speed={3.5} color={T.deo2} r={2.2} show={flowV * veinsOn.card * sCard} seed={6} />
        <Stream pts={V.postCard} t={t} n={9} speed={3.5} color={T.deo2} r={2.2} show={flowV * veinsOn.card * sCard} seed={7} />
        <Stream pts={V.commonCard} t={t} n={4} speed={5} color={T.deo2} r={2.4} show={flowV * veinsOn.card * sCard} seed={8} />
        <Stream pts={offset(tubeFlowPts, () => 3)} t={t} n={7} speed={4} color={T.deo2} r={2.6} show={flowV} seed={9} />
        <Stream pts={offset(tubeFlowPts, () => -3)} t={t + 0.013} n={5} speed={4} color={T.o2} r={2.6} show={flowV} seed={10} />
        {ARCHES.map((a, i) => (
          <Stream key={i} pts={a} t={t + i * 0.01} n={3} speed={5} color={T.o2} r={2} show={flowA * archOn * sArt} seed={11 + i} />
        ))}
        <AortaCells t={t} show={flowA * sArt} />
        <Stream pts={V.vitArt} t={t} n={4} speed={5} color={T.deo2} r={2.1} show={flowA * artOut * sOut} seed={15} />
        <Stream pts={V.umbArt} t={t} n={5} speed={5} color={T.deo2} r={2.1} show={flowA * artOut * sOut} seed={16} />
        <Stream pts={OUT.umb} t={t} n={14} speed={2.2} color={T.deo2} r={2} show={flowA * artOut * sOut * outside} seed={17} />
        <Stream pts={OUT.vit} t={t} n={10} speed={2.2} color={T.deo2} r={2} show={flowA * artOut * sOut * outside} seed={18} />

        {/* Arteries vs veins (step 4): which way each vessel carries the blood. */}
        <Heads pts={V.dao} at={[0.25, 0.5, 0.75]} color="#ffd27a" show={vis(t, S3[3], S3[4])} />
        {ARCHES.map((a, i) => (
          <Heads key={i} pts={a} at={[0.55]} color="#ffd27a" show={vis(t, S3[3], S3[4])} size={6} />
        ))}
        {[V.antCard, V.postCard, V.commonCard, V.vitVein, V.umbVein].map((p, i) => (
          <Heads key={i} pts={p} at={[0.5]} color="#9fd0ff" show={vis(t, S3[3], S3[4])} size={6} />
        ))}
      </g>

      <Callouts items={callouts} left={[110, 590]} right={[240, 590]} axes={false} />

      {table > 0.01 && (
        // A camera move out of this view first fades the table: it never flies past its cells.
        <g className="zoom-fade">
          <g opacity={table}>
            <Note x={378} y={64} size={14} tone="accent">
              4. asteko zirkulazioa: nondik nora, eta zer odol
            </Note>
            <rect x={108} y={44} width={540} height={404} rx={14} fill="#120d17" opacity={0.92} stroke="rgba(255,255,255,0.1)" />
            <SummaryTable
              t={t}
              x={116}
              y={86}
              widths={[150, 228, 146]}
              rowH={30}
              head={['Odol hodia', 'Nondik → nora', 'Odola']}
              rows={[
                { at: S3[11] + 0.005, cells: [{ id: 'zilbor-zainak', text: 'Zilbor zainak', color: T.o2 }, { text: 'Karena → zain sinua' }, { text: 'Oxigenatua', color: T.o2 }] },
                { at: S3[11] + 0.01, cells: [{ id: 'bitelo-zainak', text: 'Bitelo zainak', color: T.deo2 }, { text: 'Bitelo zakua → zain sinua' }, { text: 'O₂ gutxi', color: T.deo2 }] },
                { at: S3[11] + 0.015, cells: [{ id: 'bena-kardinal-komuna', text: 'Kardinal komunak', color: T.deo2 }, { text: 'Burua + gorputza → zain sinua' }, { text: 'O₂ gutxi', color: T.deo2 }] },
                { at: S3[11] + 0.02, cells: [{ id: 'atal-aurikularra', text: 'Atrio primitiboa', color: T.atrium }, { text: 'Hiru odolak nahasten dira' }, { text: 'Nahasia', color: '#6b6475' }] },
                { at: S3[11] + 0.025, cells: [{ id: 'aorta-arkuak', text: 'Arku aortikoak', color: T.o2 }, { text: 'Aorta zakua → burua, aortak' }, { text: 'Oxigenatua', color: T.o2 }] },
                { at: S3[11] + 0.03, cells: [{ id: 'aorta-dortsalak', text: 'Aorta dortsalak', color: T.aorta }, { text: 'Gorputz osora' }, { text: 'O₂ gero eta gutxiago', color: T.o2 }] },
                { at: S3[11] + 0.035, cells: [{ id: 'bitelo-arteriak', text: 'Bitelo arteriak', color: T.deo2 }, { text: 'Aorta → bitelo zakua' }, { text: 'O₂ gabea', color: T.deo2 }] },
                { at: S3[11] + 0.04, cells: [{ id: 'zilbor-arteriak', text: 'Zilbor arteriak', color: T.deo2 }, { text: 'Aorta → karena' }, { text: 'O₂ gabea', color: T.deo2 }] },
              ]}
            />
            <Note x={378} y={430} size={12.5} tone="dim">
              Hodi guztiak bikoitiak dira (ezkerra eta eskuina)
            </Note>
          </g>
        </g>
      )}

      <Note x={24} y={24} size={12.5} align="start" tone="dim">
        {t < S3[0] + 0.06 || (t > S3[9] && t < S3[10]) ? '4. astea · korion barrunbea, amniosa, bitelo zakua eta karena' : '4. astea · enbrioia alboz, gardena (aurrea ezkerrean)'}
      </Note>
      <Steps
        t={t}
        y={616}
        steps={[
          [S3[0] + 0.03, 'Kanpotik barrura: korion barrunbetik enbrioiaren bihotzeraino'],
          [S3[0] + 0.065, 'Bihotz hodiak bi mutur: goian arteria muturra, behean zain muturra'],
          [S3[1], 'Zain muturrera hiru zain mota: zilborrekoak, bitelinoak eta kardinal komunak'],
          [S3[2] + 0.01, 'Atalak goitik behera: aorta zakua, bulboa, bentrikulua, aurikula, zain sinua'],
          [S3[3], 'Arteriak bihotzetik irteten dira (horia) · zainak bihotzera doaz (urdin argia)'],
          [S3[4], 'Aurreko + atzeko kardinala = kardinal komuna: O₂ gutxiko odola'],
          [S3[5], 'Bitelo zakutik zain sinura: O₂ gutxiko odola'],
          [S3[6], 'Karenatik zain sinura: odol oxigenatua'],
          [S3[7], 'Aorta zakutik arkuetatik barrena: burura eta aorta dortsaletara'],
          [S3[8], 'Aorta dortsalak: gorputz osora, gero eta O₂ gutxiagorekin'],
          [S3[9], 'Bitelo eta zilbor arteriak: O₂ gabeko odola kanpora'],
          [S3[11], 'Honela, gorputzaren atal guztietara heltzen da odola'],
        ]}
      />
    </g>
  );
}
