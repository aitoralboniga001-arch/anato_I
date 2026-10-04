'use client';

import { Part, lerp, smoothPath, type Pt } from '@/components/kit';
import { SKIN, SkinDefs, mixShape, ramp, sampleSpine, spineAt, win } from './skin';

/**
 * The embryo on days 28 and 32, traced from the course figures (Langman: "28. eguna",
 * "32. eguna"). Tightly C-shaped: a large head bent over the heart prominence, the pharyngeal
 * arches between them, the somites as a row of beads along the whole convex back, and the
 * tail curling forward under the umbilical cord. Face to the left (ventral), back to the right.
 *
 * Each keyframe is written in the pixel coordinates of its figure and mapped into the scene
 * with the figure's own scale, so both are drawn at the same height and morph into each other.
 */

type Ell = [number, number, number, number, number]; // cx, cy, rx, ry, rot

interface Key {
  box: { x: number; y: number; s: number }; // figure point (x, y) → scene (545, 80), scale s
  spine: Pt[]; // dorsal outline, from the hindbrain to the tip of the tail
  inner: Pt[]; // ventral edge of the trunk, from the neck to the tip of the tail
  cran: Ell; // fore/midbrain
  hind: Ell; // hindbrain and neck, joining head and back
  face: Ell; // lower forebrain / frontonasal region
  heart: Ell;
  arch: [number, number, number, number, number]; // first bar top x, y · step x, y · bar width
  archLen: number[];
  cord: [number, number, number, number, number]; // root x, y · tip x, y · radius
  arm: Ell;
  leg: Ell;
  eye: Pt;
  nose: Pt;
  ear: Pt;
  atrium: Pt;
  meso: Pt[];
  somites: number;
}

const K28: Key = {
  box: { x: 1395, y: 205, s: 0.522 },
  spine: [[1330, 208], [1450, 215], [1550, 240], [1625, 290], [1680, 370], [1718, 470], [1730, 590], [1722, 710], [1690, 820], [1640, 920], [1575, 1010], [1480, 1080], [1360, 1120], [1250, 1122], [1170, 1080], [1140, 1010], [1150, 935], [1195, 868], [1250, 832], [1296, 814]],
  inner: [[1300, 330], [1330, 430], [1370, 540], [1390, 660], [1370, 760], [1340, 800], [1306, 818]],
  cran: [1195, 385, 140, 165, -28],
  hind: [1340, 320, 120, 110, 0],
  face: [1195, 552, 92, 58, 12],
  heart: [1405, 605, 78, 92, -8],
  arch: [1340, 418, 44, -4, 40],
  archLen: [100, 88, 70, 46],
  cord: [1320, 770, 1150, 730, 42],
  arm: [1640, 765, 30, 46, -10],
  leg: [1252, 952, 36, 34, 0],
  eye: [1245, 485],
  nose: [1200, 552],
  ear: [1460, 330],
  atrium: [1480, 520],
  meso: [[1640, 640], [1620, 760], [1580, 870], [1520, 960]],
  somites: 28,
};

const K32: Key = {
  box: { x: 1302, y: 185, s: 0.542 },
  spine: [[1250, 192], [1370, 188], [1480, 208], [1570, 255], [1635, 335], [1668, 450], [1674, 580], [1658, 715], [1612, 840], [1540, 945], [1440, 1030], [1320, 1068], [1200, 1058], [1100, 1015], [1040, 950], [1012, 870], [1015, 790], [1030, 735], [1040, 712]],
  inner: [[1240, 330], [1280, 440], [1320, 560], [1330, 690], [1290, 762], [1200, 772], [1120, 778], [1078, 792], [1062, 760], [1058, 728], [1052, 710]],
  cran: [1085, 405, 158, 212, -14],
  hind: [1265, 300, 110, 105, 0],
  face: [1165, 598, 80, 66, 28],
  heart: [1335, 612, 92, 124, 14],
  arch: [1255, 372, 40, -3, 42],
  archLen: [135, 118, 96, 58],
  cord: [1245, 718, 1122, 706, 32],
  arm: [1465, 640, 55, 62, 0],
  leg: [1125, 850, 62, 68, 0],
  eye: [1170, 535],
  nose: [1195, 606],
  ear: [1380, 300],
  atrium: [1400, 500],
  meso: [[1560, 560], [1540, 700], [1490, 820], [1410, 920]],
  somites: 36,
};

const N = 28;

/** Map a keyframe into scene coordinates, with the spine resampled to a fixed count. */
function toScene(k: Key) {
  const { x, y, s } = k.box;
  const P = (p: readonly number[]): Pt => [545 + (p[0] - x) * s, 80 + (p[1] - y) * s];
  const E = (e: Ell): Ell => [...P(e), e[2] * s, e[3] * s, e[4]];
  const spine = sampleSpine(k.spine.map(P), N - 1).map((q) => q.p);
  return {
    spine: spine as Pt[],
    inner: sampleSpine(k.inner.map(P), 15).map((q) => q.p) as Pt[],
    cran: E(k.cran),
    hind: E(k.hind),
    face: E(k.face),
    heart: E(k.heart),
    arch: [...P([k.arch[0], k.arch[1]]), k.arch[2] * s, k.arch[3] * s, k.arch[4] * s],
    archLen: k.archLen.map((v) => v * s),
    cord: [...P([k.cord[0], k.cord[1]]), ...P([k.cord[2], k.cord[3]]), k.cord[4] * s],
    arm: E(k.arm),
    leg: E(k.leg),
    eye: P(k.eye),
    nose: P(k.nose),
    ear: P(k.ear),
    atrium: P(k.atrium),
    meso: k.meso.map(P),
    somites: [k.somites],
  };
}

const S28 = toScene(K28);
const S32 = toScene(K32);
type Shape = typeof S28;

export function earlyGeom(day: number) {
  const k = ramp(day, 28, 32);
  const g = mixShape(S28 as never, S32 as never, k * k * (3 - 2 * k)) as unknown as Shape;
  const S = sampleSpine(g.spine, 90);
  const [ax, ay, sx, sy, w] = g.arch;
  // Pharyngeal arches: bars from dorsal (top) to ventral, stacked caudally.
  const bars = g.archLen.map((len, i) => {
    const top: Pt = [ax + sx * i, ay + sy * i];
    const bot: Pt = [top[0] - len * 0.1, top[1] + len];
    return { top, bot, w: w * (1 - i * 0.12) };
  });
  const cordRoot: Pt = [g.cord[0], g.cord[1]];
  const cordTip: Pt = [g.cord[2], g.cord[3]];
  return { ...g, S, bars, cordRoot, cordTip, tail: S[S.length - 1].p, v4: polar2(g.hind, -60, 0.55) };
}

function polar2(e: Ell | number[], deg: number, f: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [e[0] + Math.cos(a) * e[2] * f, e[1] + Math.sin(a) * e[3] * f];
}

const ell = (e: readonly number[], extra?: React.SVGProps<SVGEllipseElement>) => (
  <ellipse cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} transform={e[4] ? `rotate(${e[4]} ${e[0]} ${e[1]})` : undefined} {...extra} />
);

/** A rounded bar between two points (arches, cord). */
function bar(a: Pt, b: Pt, wa: number, wb = wa) {
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const pts: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const g = th - Math.PI / 2 + (Math.PI * i) / 8;
    pts.push([b[0] + Math.cos(g) * wb, b[1] + Math.sin(g) * wb]);
  }
  for (let i = 0; i <= 8; i++) {
    const g = th + Math.PI / 2 + (Math.PI * i) / 8;
    pts.push([a[0] + Math.cos(g) * wa, a[1] + Math.sin(g) * wa]);
  }
  return smoothPath(pts, true, 0.4);
}

const RIM = '#c9634f';
const PALE = '#fbd9cf';
const COUNT = '#ffc98a';

/** Convex hull (monotone chain), used to fill the neck between head, arches and heart in one piece. */
function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** Points on an ellipse (cx, cy, rx, ry, rot), `f` = fraction of the radius. */
const onEll = (e: readonly number[], deg: number, f = 1): Pt => {
  const a = (deg * Math.PI) / 180;
  const r = ((e[4] ?? 0) * Math.PI) / 180;
  const x = Math.cos(a) * e[2] * f;
  const y = Math.sin(a) * e[3] * f;
  return [e[0] + x * Math.cos(r) - y * Math.sin(r), e[1] + x * Math.sin(r) + y * Math.cos(r)];
};

export interface EarlyOpts {
  day: number;
  /** Heartbeat phase (-1..1). */
  beat?: number;
  /** Somites counted so far (warm), for the "count the somites" step; -1 = none. */
  counted?: number;
  /** Lower limb bud size (0..1): it appears 2–3 days after the upper one. */
  legGrow?: number;
}

/** Heart prominence split into its two visible bulges: the left ventricle below, the left atrium above. */
export function heartLobes(heart: readonly number[], atrium: Pt) {
  const vent: Ell = [heart[0] - heart[2] * 0.12, heart[1] + heart[3] * 0.24, heart[2] * 0.74, heart[3] * 0.62, heart[4] ?? 0];
  const atr: Ell = [atrium[0], atrium[1], heart[2] * 0.42, heart[3] * 0.34, -25];
  return { vent, atr };
}

export function EarlyEmbryo({ day, beat = 0, counted = -1, legGrow = 1 }: EarlyOpts) {
  const g = earlyGeom(day);
  const { S } = g;
  const nSom = Math.round(g.somites[0]);
  const heart: Ell = [g.heart[0], g.heart[1], g.heart[2] * (1 + 0.025 * beat), g.heart[3] * (1 + 0.025 * beat), g.heart[4]];
  const lensPlate = 1 - ramp(day, 30, 31.5);
  const lensPit = ramp(day, 30, 31.5);
  const nasal = ramp(day, 30.5, 32);
  const sinus = ramp(day, 29, 32);
  const otic = 1 - ramp(day, 29.5, 31);
  const atrium = 1 - ramp(day, 30, 31.5);
  const { vent, atr } = heartLobes(heart, g.atrium);
  const leg: Ell = [g.leg[0], g.leg[1], g.leg[2] * lerp(0.45, 1, legGrow), g.leg[3] * lerp(0.45, 1, legGrow), 0];

  // Somites: beads along the whole dorsal edge, from the neck to the tail.
  const somites = Array.from({ length: nSom }, (_, i) => {
    const u = 0.06 + (0.9 * i) / Math.max(1, nSom - 1);
    const s = spineAt(S, u, lerp(21, 8, u));
    return { c: s.p, a: (Math.atan2(s.t[1], s.t[0]) * 180) / Math.PI, r: lerp(12.5, 4.5, u * u) };
  });
  const cordW = g.cord[4];
  const cordAng = (Math.atan2(g.cordTip[1] - g.cordRoot[1], g.cordTip[0] - g.cordRoot[0]) * 180) / Math.PI;

  // Cord geometry (local frame: along the cord from root x0 to the cut end x0 + L).
  const cord = (() => {
    const L = Math.hypot(g.cordTip[0] - g.cordRoot[0], g.cordTip[1] - g.cordRoot[1]);
    const x0 = g.cordRoot[0];
    const y0 = g.cordRoot[1];
    const w0 = cordW * 1.12;
    const w1 = cordW * 0.92;
    // How far the drawn tube runs on into the body, behind the belly wall.
    const inset = cordW * 2.2 + 24;
    const upper = `C${x0 + L * 0.4},${y0 - w0 * 0.98} ${x0 + L * 0.7},${y0 - w1 * 1.04} ${x0 + L},${y0 - w1}`;
    const tube = `M${x0 - 6},${y0 - w0} ${upper} L${x0 + L},${y0 + w1} C${x0 + L * 0.7},${y0 + w1 * 1.04} ${x0 + L * 0.4},${y0 + w0} ${x0 - 6},${y0 + w0} Z`;
    // Flaring a little toward the body, as the cord does where it joins the umbilical ring.
    const tubeIn = `M${x0 - inset},${y0 - w0 * 1.22} C${x0 - inset * 0.4},${y0 - w0 * 1.15} ${x0},${y0 - w0 * 1.02} ${x0 + L * 0.2},${y0 - w0} ${upper} L${x0 + L},${y0 + w1} C${x0 + L * 0.7},${y0 + w1 * 1.04} ${x0 + L * 0.4},${y0 + w0} ${x0 + L * 0.2},${y0 + w0} C${x0},${y0 + w0 * 1.02} ${x0 - inset * 0.4},${y0 + w0 * 1.15} ${x0 - inset},${y0 + w0 * 1.22} Z`;
    // The cord points to the left (≈190°): mirror its local frame so its lit side stays on top (light from the upper left).
    const flip = Math.cos((cordAng * Math.PI) / 180) < 0 ? ` translate(0 ${2 * y0}) scale(1 -1)` : '';
    return { L, x0, y0, w0, w1, inset, tube, tubeIn, rot: `rotate(${cordAng} ${x0} ${y0})${flip}` };
  })();

  // The neck in one piece: the arches sit on its side, the head rests on the heart prominence (no gaps).
  const neck = hull([
    ...[0, 60, 120, 180, 240, 300].map((a) => onEll(g.hind, a, 0.7)),
    ...g.bars.map((b) => b.top),
    ...g.bars.map((b) => lerpPt2(b.top, b.bot, 0.62)),
    ...[200, 250, 300].map((a) => onEll(heart, a, 0.7)),
    onEll(g.face, -30, 0.6),
    onEll(g.cran, 30, 0.7),
  ]);
  // Stomodeum: the slit between the frontonasal prominence and the first (mandibular) arch.
  const b0 = g.bars[0];
  const mouthA: Pt = [b0.bot[0] - b0.w * 0.6, b0.bot[1] - b0.w * 0.2];
  const mouthC: Pt = onEll(g.face, -10, 0.85);

  return (
    <g>
      <SkinDefs id="w5e" cx={455} cy={180} r={470} red={0.3} />
      <defs>
        <radialGradient id="w5e-vent" cx="0.38" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#f08f84" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#c8505a" stopOpacity="0.42" />
          <stop offset="1" stopColor="#9c3040" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id="w5e-atr" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fff1ea" stopOpacity="0.7" />
          <stop offset="1" stopColor="#d9707a" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id="w5e-cord" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c6b8" />
          <stop offset="0.45" stopColor="#e9a191" />
          <stop offset="1" stopColor="#c56f62" />
        </linearGradient>
        {/* Limb bud: a raised mound lit from the upper left, deepening toward its lower rim. */}
        <radialGradient id="w5e-bud" cx="0.36" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#fde6dc" />
          <stop offset="0.42" stopColor="#f8cdbf" />
          <stop offset="0.82" stopColor="#e9a291" />
          <stop offset="1" stopColor="#d4826f" />
        </radialGradient>
        <radialGradient id="w5e-budsh">
          <stop offset="0.55" stopColor="#7a2e28" stopOpacity="0.34" />
          <stop offset="1" stopColor="#7a2e28" stopOpacity="0" />
        </radialGradient>
        {/* Shade on the cord where it leaves the body wall (the wall overhangs its root). */}
        <linearGradient id="w5e-cordocc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6e2a24" stopOpacity="0.5" />
          <stop offset="1" stopColor="#6e2a24" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Umbilical cord, drawn under the body so it grows out of the belly wall: its root runs on into
          the body (hidden by it) and the wall's own edge is the junction, shaded on the cord. */}
      <g transform={cord.rot} pointerEvents="none">
        <path d={cord.tubeIn} fill="url(#w5e-cord)" stroke="#8f3f37" strokeWidth={1.2} strokeOpacity={0.7} />
        <path d={`M${cord.x0 + 4},${cord.y0 - cord.w0 * 0.45} C${cord.x0 + cord.L * 0.45},${cord.y0 - cord.w0 * 0.55} ${cord.x0 + cord.L * 0.75},${cord.y0 - cord.w1 * 0.5} ${cord.x0 + cord.L - 4},${cord.y0 - cord.w1 * 0.55}`} fill="none" stroke="#fff4ee" strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
        <rect x={cord.x0 - cord.inset} y={cord.y0 - cord.w0 - 2} width={cord.inset + cord.L * 0.3} height={cord.w0 * 2 + 4} fill="url(#w5e-cordocc)" />
      </g>
      {/* Silhouette: one lit surface */}
      <g filter="url(#w5e-sculpt)" fill="url(#w5e-skin)">
        <path d={smoothPath([...g.spine, ...[...g.inner].reverse()], true, 0.5)} />
        <path d={smoothPath(neck, true, 0.35)} />
        {ell(g.hind)}
        {ell(g.cran)}
        {ell(g.face)}
        {ell(heart)}
        {g.bars.map((b, i) => (
          <path key={i} d={bar(b.top, b.bot, b.w / 2, b.w / 2.4)} />
        ))}
        {ell(g.arm)}
        {ell(leg)}
      </g>

      {/* Relief on the surface: darker dorsal rim, pale mesonephric ridge */}
      <g pointerEvents="none">
        <path d={smoothPath(Array.from({ length: 40 }, (_, i) => spineAt(S, 0.03 + (0.95 * i) / 39, 5).p), false)} fill="none" stroke={RIM} strokeWidth={7} strokeLinecap="round" opacity={0.42} />
        <path d={smoothPath(g.meso, false)} fill="none" stroke={PALE} strokeWidth={lerp(16, 22, ramp(day, 28, 32))} strokeLinecap="round" opacity={0.5} />
        {/* Stomodeum */}
        <path d={`M${mouthA[0]},${mouthA[1]} Q${(mouthA[0] + mouthC[0]) / 2 - 4},${(mouthA[1] + mouthC[1]) / 2 + 5} ${mouthC[0]},${mouthC[1]}`} fill="none" stroke={SKIN.ink} strokeWidth={2.6} strokeLinecap="round" opacity={0.55} />
      </g>
      <Part id="mesonefros-gandorra">
        <path d={smoothPath(g.meso, false)} fill="none" stroke="rgba(255,255,255,0.001)" strokeWidth={18} />
      </Part>
      <Part id="somitak">
        {somites.map((s, i) => {
          const c = counted >= 0 && i < counted;
          return (
            <rect
              key={i}
              x={s.c[0] - s.r * 0.75}
              y={s.c[1] - s.r}
              width={s.r * 1.5}
              height={s.r * 2}
              rx={s.r * 0.65}
              transform={`rotate(${s.a + 90} ${s.c[0]} ${s.c[1]})`}
              fill={c ? COUNT : PALE}
              stroke={c ? '#e0803a' : '#e5866c'}
              strokeWidth={c ? 1.5 : 1.1}
              opacity={0.92}
            />
          );
        })}
      </Part>
      <Part id="bihotz-goragunea">
        {/* The heart shows through the thin body wall: a dark-red ventricle below, the atrium above. */}
        {ell(heart, { fill: 'url(#w5e-heart)' })}
      </Part>
      <Part id="ezkerreko-bentrikulua">
        {ell(vent, { fill: 'url(#w5e-vent)' })}
        <path d={`M${onEll(vent, 200)[0]},${onEll(vent, 200)[1]} Q${vent[0]},${vent[1] - vent[3] * 1.15} ${onEll(vent, -20)[0]},${onEll(vent, -20)[1]}`} fill="none" stroke={RIM} strokeWidth={1.5} opacity={0.5} />
      </Part>
      {atrium > 0.02 && (
        <Part id="ezkerreko-aurikula" show={atrium}>
          {ell(atr, { fill: 'url(#w5e-atr)' })}
        </Part>
      )}
      <Part id="faringe-arkuak">
        {g.bars.map((b, i) => (
          <g key={i}>
            {/* Each arch is a rounded ridge: shadow on its caudal flank, pale crest, rim light cranially. */}
            <path d={bar([b.top[0] + 3, b.top[1] + 2], [b.bot[0] + 3, b.bot[1] + 1], b.w / 2 - 1, b.w / 2.4 - 1)} fill="#9b4d45" opacity={0.35} />
            <path d={bar(b.top, b.bot, b.w / 2 - 2.5, b.w / 2.4 - 2.5)} fill={PALE} opacity={0.8} />
            <path d={`M${b.top[0] - b.w * 0.22},${b.top[1] + 5} L${b.bot[0] - b.w * 0.18},${b.bot[1] - 5}`} stroke="#fff8f4" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
          </g>
        ))}
      </Part>
      <Part id="arrialdura-brankialak">
        {g.bars.slice(0, -1).map((b, i) => {
          const n = g.bars[i + 1];
          const t: Pt = [(b.top[0] + n.top[0]) / 2, (b.top[1] + n.top[1]) / 2 + 8];
          const u: Pt = [(b.bot[0] + n.bot[0]) / 2 + 2, (Math.min(b.bot[1], n.bot[1]) + t[1]) / 2 + 10];
          return <path key={i} d={`M${t[0]},${t[1]} Q${t[0] + 3},${(t[1] + u[1]) / 2} ${u[0]},${u[1]}`} fill="none" stroke={SKIN.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.62} />;
        })}
      </Part>
      {sinus > 0.02 && (
        <Part id="lepoko-sinua" show={sinus}>
          {(() => {
            const b = g.bars[g.bars.length - 1];
            const c: Pt = [b.top[0] + 16, b.top[1] + g.archLen[3] * 0.5];
            return (
              <>
                <ellipse cx={c[0] + 2} cy={c[1]} rx={7} ry={17} fill={SKIN.ink} opacity={0.18} />
                <path d={`M${c[0] - 4},${c[1] - 16} q12,16 0,32`} fill="none" stroke={SKIN.ink} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
              </>
            );
          })()}
        </Part>
      )}
      <Part id="goiko-gorputz-adarraren-hasikina">
        <Bud e={[g.arm[0], g.arm[1], g.arm[2] * 0.95, g.arm[3] * 0.95, g.arm[4]]} />
      </Part>
      {legGrow > 0.02 && (
        <Part id="beheko-gorputz-adarraren-hasikina" show={Math.min(1, 0.4 + legGrow)}>
          <Bud e={[leg[0], leg[1], leg[2] * 0.95, leg[3] * 0.95, 0]} />
        </Part>
      )}
      {(() => {
        // Cut umbilical cord: the tube is drawn under the body (above); the part is its visible length and the pale cut face.
        const { L, x0, y0, w1, rot, tube } = cord;
        return (
          <>
            <Part id="zilborrestea">
              <g transform={rot}>
                <path d={tube} fill="rgba(255,255,255,0.001)" />
                <ellipse cx={x0 + L} cy={y0} rx={w1 * 0.38} ry={w1} fill="#f7cdbf" stroke="#8f3f37" strokeWidth={1.2} />
                <ellipse cx={x0 + L + 1} cy={y0} rx={w1 * 0.24} ry={w1 * 0.7} fill="#efb3a3" />
              </g>
            </Part>
          </>
        );
      })()}
      <Part id="goragune-kaudala">
        <circle cx={g.tail[0]} cy={g.tail[1]} r={8} fill="rgba(255,255,255,0.001)" />
      </Part>

      {/* Head: lens placode → lens pit, nasal placode, otic placode (thickenings of the surface ectoderm) */}
      {lensPlate > 0.02 && (
        <Part id="kristalinoaren-plaka" show={lensPlate}>
          <circle cx={g.eye[0]} cy={g.eye[1]} r={10} fill={PALE} stroke={RIM} strokeWidth={1.2} />
          <circle cx={g.eye[0] - 2.5} cy={g.eye[1] - 2.5} r={4} fill="#fff" opacity={0.5} />
        </Part>
      )}
      {lensPit > 0.02 && (
        <Part id="kristalinoaren-hobitxoa" show={lensPit}>
          <circle cx={g.eye[0]} cy={g.eye[1]} r={10.5} fill={PALE} stroke={RIM} strokeWidth={1.2} />
          {/* The placode sinks in: a pit opening, darker toward its lower rim */}
          <circle cx={g.eye[0] + 1} cy={g.eye[1] + 1} r={lerp(1.5, 5, lensPit)} fill={RIM} />
          <circle cx={g.eye[0]} cy={g.eye[1]} r={lerp(1, 2.6, lensPit)} fill={SKIN.ink} opacity={0.7} />
        </Part>
      )}
      {nasal > 0.02 && (
        <Part id="sudur-plaka" show={nasal}>
          <ellipse cx={g.nose[0]} cy={g.nose[1]} rx={8.5} ry={11.5} transform={`rotate(25 ${g.nose[0]} ${g.nose[1]})`} fill={PALE} stroke={RIM} strokeWidth={1.1} />
          <ellipse cx={g.nose[0] - 2} cy={g.nose[1] - 3} rx={3} ry={4.5} transform={`rotate(25 ${g.nose[0]} ${g.nose[1]})`} fill="#fff" opacity={0.45} />
        </Part>
      )}
      {otic > 0.02 && (
        <Part id="entzumen-plaka" show={otic}>
          <ellipse cx={g.ear[0]} cy={g.ear[1]} rx={9.5} ry={8.5} fill={PALE} stroke={RIM} strokeWidth={1} opacity={0.9} />
          <circle cx={g.ear[0] - 2.5} cy={g.ear[1] - 2} r={3.2} fill="#fff" opacity={0.5} />
        </Part>
      )}
      <Part id="laugarren-bentrikulua" show={win(day, 29, 36, 2)}>
        {ell([g.v4[0], g.v4[1], 38, 22, 20], { fill: '#b3544c', opacity: 0.16 })}
      </Part>
      <Part id="mesentzefaloa" quiet>
        {ell([g.cran[0], g.cran[1] - g.cran[3] * 0.45, g.cran[2] * 0.6, g.cran[3] * 0.4, g.cran[4]], { fill: 'rgba(255,255,255,0.001)' })}
      </Part>
    </g>
  );
}

const lerpPt2 = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/**
 * A limb bud as a raised mound on the body wall (not a flat disc): a soft cast shadow toward the lower
 * right, a lit dome, a fine rim, and a crest of light along its upper-left edge.
 */
function Bud({ e }: { e: readonly number[] }) {
  const [cx, cy, rx, ry, rot] = e;
  const tr = `rotate(${rot} ${cx} ${cy})`;
  const arc = (a0: number, a1: number, f: number) => {
    const p = (a: number): Pt => [cx + Math.cos((a * Math.PI) / 180) * rx * f, cy + Math.sin((a * Math.PI) / 180) * ry * f];
    const [p0, p1] = [p(a0), p(a1)];
    return `M${p0[0]},${p0[1]} A${rx * f},${ry * f} 0 0 1 ${p1[0]},${p1[1]}`;
  };
  return (
    <g transform={tr}>
      <ellipse cx={cx + rx * 0.2} cy={cy + ry * 0.24} rx={rx * 1.28} ry={ry * 1.22} fill="url(#w5e-budsh)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#w5e-bud)" stroke="#a5503f" strokeWidth={1.1} strokeOpacity={0.4} />
      <path d={arc(-195, -70, 0.8)} fill="none" stroke="#fffaf6" strokeWidth={Math.max(1.4, rx * 0.09)} strokeLinecap="round" opacity={0.5} />
      <path d={arc(20, 140, 0.9)} fill="none" stroke="#a5503f" strokeWidth={Math.max(1.4, rx * 0.1)} strokeLinecap="round" opacity={0.3} />
    </g>
  );
}

/** Somite `i` (0-based) of `day`, for counters and labels. */
export function somiteAt(day: number, i: number): Pt {
  const g = earlyGeom(day);
  const n = Math.round(g.somites[0]);
  const u = 0.06 + (0.9 * i) / Math.max(1, n - 1);
  return spineAt(g.S, u, lerp(21, 8, u)).p;
}

export type EarlyGeom = ReturnType<typeof earlyGeom>;
