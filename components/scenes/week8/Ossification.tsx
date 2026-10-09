'use client';

import { useId } from 'react';
import { Label, Note, Part, clamp, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mesCells, sm, spline, vis } from './common';

/**
 * 8:hezurtzapena — apunteen 2. atala eta 29. orriko irudia (A–D). Bi panel aldi berean:
 *  ezkerrean MINTZEZKO hezurtzapena (buru-ganga: azalaren eta garunaren artean): mesenkimak mintzezko eredua
 *  osatzen du, erdian hezurtzapen zentroa agertzen da (osteoblastoak) eta hezur espikulak erradialki hazten dira:
 *  eredua zuzenean hezurtzen da;
 *  eskuinean hezurtzapen ENDOKONDRALA: mesenkima → kondroblastoek kartilago hialinozko eredua → 2. fasean
 *  erdian hezurtzapen zentroa (odol hodia sartzen da, osteoblastoak) → hezurra erditik muturretara hedatzen da.
 */

export const OSS_T = { membrane: 0.16, spicules: 0.32, cartilage: 0.48, centre: 0.64, spread: 0.8 };

// ——— Left: membranous (skull vault) ———
const LX = 345;
const LC: Pt = [LX, 318];
/** A piece of the vault cut across: every layer bows with the curve of the head (x from 210 to 480). */
const VX0 = 210;
const VX1 = 480;
const bow = (x: number) => 0.0012 * (x - LX) ** 2;
const layer = (y0: number, y1: number): Pt[] => {
  const xs = Array.from({ length: 19 }, (_, i) => VX0 + ((VX1 - VX0) * i) / 18);
  return [...xs.map((x) => [x, y0 + bow(x)] as Pt), ...[...xs].reverse().map((x) => [x, y1 + bow(x)] as Pt)];
};
/** Skin (surface ectoderm over its dermis), the membrane of mesenchyme, the brain under its meninges. */
const SKIN = layer(140, 166);
const MEMBRANE = layer(172, 464);
const BRAIN = layer(476, 560);
const L_CELLS = mesCells((x, y) => inPoly(MEMBRANE, x, y) && x > VX0 + 6 && x < VX1 - 6, [VX0, 172, VX1, 486], 26, 11);
/** Radial spicules: each a branching polyline from the centre. */
const SPICULES: Pt[][] = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + rand(i * 3.3) * 0.3;
  const len = 92 + rand(i * 7.1) * 26;
  const pts: Pt[] = [];
  for (let k = 0; k <= 6; k++) {
    const r = (len * k) / 6;
    const wob = Math.sin(k * 1.7 + i) * 6 * (k / 6);
    pts.push([LC[0] + Math.cos(a) * r - Math.sin(a) * wob, LC[1] + Math.sin(a) * r * 0.92 + Math.cos(a) * wob]);
  }
  return pts;
});
const BRANCHES: { from: number; spic: number; pts: Pt[] }[] = SPICULES.flatMap((sp, i) =>
  [3, 5].map((k, j) => {
    const p = sp[k];
    const a = Math.atan2(p[1] - LC[1], p[0] - LC[0]) + (j ? -0.6 : 0.55);
    const l = 22 + rand(i * 5 + j) * 10;
    return { from: k / 6, spic: i, pts: [p, [p[0] + Math.cos(a) * l * 0.5, p[1] + Math.sin(a) * l * 0.5], [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l]] as Pt[] };
  }),
);

// ——— Right: endochondral (a long bone model) ———
const RX = 655;
const TOP = 112;
const BOT = 520;
const MID = (TOP + BOT) / 2;
function boneShape(sw: number, ew: number): Pt[] {
  const R: Pt[] = [
    [RX, TOP - 6],
    [RX + ew * 0.7, TOP],
    [RX + ew, TOP + 40],
    [RX + ew * 0.8, TOP + 92],
    [RX + sw, TOP + 140],
    [RX + sw * 0.94, MID],
    [RX + sw, BOT - 140],
    [RX + ew * 0.8, BOT - 92],
    [RX + ew, BOT - 40],
    [RX + ew * 0.7, BOT],
    [RX, BOT + 6],
  ];
  const L = R.slice(1, -1).map(([x, y]) => [2 * RX - x, y] as Pt).reverse();
  return spline([...R, ...L], 8, true);
}
const MODEL = boneShape(30, 56);
/** The model's half-width at a height (its right side, read as a function of y along the shaft and metaphyses). */
const SIDE = MODEL.filter(([x, y]) => x > RX && y > TOP + 10 && y < BOT - 10).sort((a, b) => a[1] - b[1]);
function halfW(y: number) {
  if (y <= SIDE[0][1]) return SIDE[0][0] - RX;
  for (let i = 1; i < SIDE.length; i++)
    if (SIDE[i][1] >= y) {
      const [x0, y0] = SIDE[i - 1];
      const [x1, y1] = SIDE[i];
      return lerp(x0, x1, (y - y0) / (y1 - y0 || 1)) - RX;
    }
  return SIDE[SIDE.length - 1][0] - RX;
}
function offsetIn(pts: Pt[], d: number): Pt[] {
  return pts.map(([x, y]) => [x - Math.sign(x - RX) * d, y - Math.sign(y - MID) * d * 0.6]);
}
/**
 * Each chondrocyte of the model, with the loose mesenchymal cell it starts as: the cells crowd in (condensation)
 * from a wider field, the middle first, round up into chondroblasts and wall themselves in matrix (lacunae).
 */
const CHONDRO = (() => {
  const out: { p: Pt; r: number; src: Pt; lag: number; a: number; col: number }[] = [];
  const inner = offsetIn(MODEL, 6);
  let i = 0;
  for (let y = TOP + 8; y < BOT - 6; y += 13)
    for (let x = RX - 64; x < RX + 64; x += 15) {
      i++;
      const jx = x + (rand(i * 2.3) - 0.5) * 7 + ((y / 13) % 2) * 6;
      const jy = y + (rand(i * 4.1) - 0.5) * 5;
      if (!inPoly(inner, jx, jy)) continue;
      const dy = jy - MID;
      out.push({
        p: [jx, jy],
        r: 3 + rand(i * 6.7) * 0.8,
        src: [RX + (jx - RX) * 1.75 + (rand(i * 9.1) - 0.5) * 26, MID + dy * 1.1 + (rand(i * 2.9) - 0.5) * 18],
        lag: 0.35 * (Math.abs(dy) / 210) + 0.15 * rand(i * 3.7),
        a: rand(i * 1.3) * 360,
        col: RX + Math.round((jx - RX) / 12) * 12,
      });
    }
  return out;
})();
/** Chondroblasts along the inside of the perichondrium (appositional growth). */
const RIM = offsetIn(MODEL, 4).filter((_, i) => i % 4 === 0);
/** Primary spongiosa: longitudinal trabeculae (laid on the calcified cartilage columns) with cross-links. */
const TRAB_COLS = [-0.74, -0.37, 0, 0.37, 0.74];
const TRABECULAE: Pt[][] = TRAB_COLS.map((f, k) =>
  Array.from({ length: 33 }, (_, j) => {
    const y = MID - 160 + j * 10;
    return [RX + f * (halfW(y) - 8) + Math.sin(j * 1.3 + k * 2.1) * 2.4, y] as Pt;
  }),
);
const TRAB_LINKS: [Pt, Pt][] = [];
TRABECULAE.forEach((c, k) => {
  if (k === TRABECULAE.length - 1) return;
  c.forEach((p, j) => {
    if (j % 2 === (k % 2) || rand(k * 31 + j * 7.7) < 0.35) return;
    const q = TRABECULAE[k + 1][Math.min(32, j + (rand(k + j * 3.1) < 0.5 ? 0 : 1))];
    TRAB_LINKS.push([p, q]);
  });
});
/** The periosteal bud: a vessel from outside, through the bone collar, into the middle of the shaft. */
const BUD = `M${RX - 150},${MID - 92} C${RX - 96},${MID - 80} ${RX - 60},${MID - 30} ${RX - 30},${MID - 10} S${RX - 8},${MID + 4} ${RX + 4},${MID + 2}`;
/** The bone collar on one side of the shaft, reaching `R` up and down from the middle. */
function collarPath(R: number, s: number) {
  if (R < 2) return '';
  const out: Pt[] = [];
  const inn: Pt[] = [];
  for (let k = 0; k <= 24; k++) {
    const y = MID - R + (2 * R * k) / 24;
    const taper = Math.min(1, (R - Math.abs(y - MID)) / 14 + 0.2);
    const w = halfW(y);
    out.push([RX + s * (w + 2), y]);
    inn.push([RX + s * (w + 2 - 8 * taper), y]);
  }
  return smoothPath([...out, ...inn.reverse()], true, 0.3);
}
const rimAngle = (i: number) => {
  const a = RIM[(i + RIM.length - 1) % RIM.length];
  const b = RIM[(i + 1) % RIM.length];
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
};
/** A cell in the upper right of the field, for the mesenchyme's name. */
const MES_I = CHONDRO.reduce((best, c, i) => (c.src[1] < MID - 110 && c.src[0] > CHONDRO[best].src[0] ? i : best), 0);
/** A chondroblast of the rim on the right side of the shaft. */
const RIM_I = RIM.reduce((best, p, i) => (p[0] > RX && Math.abs(p[1] - (TOP + 132)) < Math.abs(RIM[best][1] - (TOP + 132)) ? i : best), 0);

export function OssificationTypes({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  // Left timeline.
  const lCentre = seg(t, OSS_T.membrane + 0.02, OSS_T.membrane + 0.08);
  const spic = seg(t, OSS_T.spicules + 0.01, OSS_T.spicules + 0.13);
  // Right timeline.
  const cond = seg(t, OSS_T.cartilage + 0.005, OSS_T.cartilage + 0.065);
  const round = seg(t, OSS_T.cartilage + 0.05, OSS_T.cartilage + 0.08);
  const matrix = seg(t, OSS_T.cartilage + 0.06, OSS_T.cartilage + 0.12);
  const hyper = seg(t, OSS_T.centre + 0.005, OSS_T.centre + 0.035);
  const collar = seg(t, OSS_T.centre + 0.02, OSS_T.centre + 0.055);
  const vessel = seg(t, OSS_T.centre + 0.045, OSS_T.centre + 0.08);
  const prim = seg(t, OSS_T.centre + 0.075, OSS_T.centre + 0.12);
  const spread = seg(t, OSS_T.spread + 0.01, OSS_T.spread + 0.12);
  // How far the bone reaches up and down from the middle; the collar runs a little ahead of it.
  const boneR = 50 * prim + 88 * spread;
  const collarR = Math.max(lerp(0, 84, collar), boneR + 14);
  const calcIn = prim > 0 ? boneR : 0;
  const calcOut = lerp(72, boneR + 30, prim);
  const cells = CHONDRO.map((c) => {
    const u = sm(clamp(cond * 1.5 - c.lag, 0, 1));
    const ady = Math.abs(c.p[1] - MID);
    // Hypertrophy: first in the middle of the shaft, then in a band just ahead of the ossification front.
    const nearMid = clamp(1 - ady / 90, 0, 1) * hyper;
    const zone = ady > boneR ? clamp(1 - (ady - boneR) / 44, 0, 1) : 1;
    const h = Math.max(nearMid * (1 - prim), zone * prim);
    // Ahead of that, the proliferating cells stack up in columns (the future growth plate).
    const flat = spread * clamp(1 - Math.abs(ady - boneR - 64) / 26, 0, 1);
    const x = lerp(c.p[0], c.col, flat * 0.8);
    return { u, h, flat, p: [lerp(c.src[0], x, u), lerp(c.src[1], c.p[1], u)] as Pt };
  });
  const osteo: Pt[] =
    prim < 0.01
      ? []
      : TRAB_COLS.flatMap((f, k) =>
          [-1, 1].flatMap((s) =>
            [boneR - 7, boneR * (s > 0 ? 0.78 - 0.13 * k : 0.26 + 0.13 * k)].map((d) => {
              const y = MID + s * d;
              return [RX + f * (halfW(y) - 8) + 4, y] as Pt;
            }),
          ),
        );
  const pulse = reduced ? 0 : Math.sin(t * 90) * 0.5 + 0.5;

  const spicPath = (pts: Pt[], u: number) => {
    const n = pts.length - 1;
    const m = u * n;
    const k = Math.floor(m);
    const out = pts.slice(0, k + 1);
    if (k < n) out.push([lerp(pts[k][0], pts[k + 1][0], m - k), lerp(pts[k][1], pts[k + 1][1], m - k)]);
    return `M${out.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;
  };
  const shaftClip = `M${RX - 80},${f1(MID - boneR)}H${RX + 80}V${f1(MID + boneR)}H${RX - 80}Z`;

  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <rect x={499} y={60} width={1.2} height={500} fill="#fff" opacity={0.08} />
      <clipPath id={`w8-oss-model${cid}`}>
        <path d={smoothPath(MODEL, true, 0.3)} />
      </clipPath>
      <clipPath id={`w8-oss-shaft${cid}`}>
        <path d={shaftClip} />
      </clipPath>
      <defs>
        <radialGradient id={`w8-oss-field${cid}`}>
          <stop offset="0" stopColor={Q.mes} stopOpacity={0.16} />
          <stop offset="0.6" stopColor={Q.mes} stopOpacity={0.07} />
          <stop offset="1" stopColor={Q.mes} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`w8-oss-hyal${cid}`} cx="38%" cy="30%" r="85%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#140c3a" stopOpacity={0.4} />
        </radialGradient>
        <pattern id={`w8-oss-calc${cid}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#43378a" opacity={0.75} />
          <circle cx="2" cy="2" r="0.9" fill="#1d1450" />
          <circle cx="5.5" cy="5" r="0.7" fill="#a79be8" />
        </pattern>
        <radialGradient id={`w8-oss-marrow${cid}`}>
          <stop offset="0" stopColor="#a02a3a" />
          <stop offset="1" stopColor="#3a0c14" />
        </radialGradient>
        <radialGradient id={`w8-oss-glow${cid}`}>
          <stop offset="0" stopColor={Q.centre} stopOpacity={0.55} />
          <stop offset="1" stopColor={Q.centre} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`w8-oss-growg${cid}`}>
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`w8-oss-grow${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <ellipse cx={RX} cy={MID} rx={f1(lerp(24, 170, matrix))} ry={f1(lerp(40, 320, matrix))} fill={`url(#w8-oss-growg${cid})`} />
        </mask>
      </defs>

      {/* ——— Membranous: a piece of the vault, between the skin and the brain ——— */}
      <defs>
        <linearGradient id={`w8-oss-fadeg${cid}`} gradientUnits="userSpaceOnUse" x1={VX0} y1={0} x2={VX1} y2={0}>
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.12" stopColor="#fff" />
          <stop offset="0.88" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`w8-oss-fade${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={VX0} y={100} width={VX1 - VX0} height={500} fill={`url(#w8-oss-fadeg${cid})`} />
        </mask>
        <linearGradient id={`w8-oss-brain${cid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b7fe8" />
          <stop offset="1" stopColor="#253c98" />
        </linearGradient>
      </defs>
      {/* Where this piece is: the top of the head (its vault glows). */}
      <Part id="buru-ganga" quiet>
        <g transform="translate(96 118)">
          <path d="M-40,22 C-48,-6 -34,-38 0,-44 C34,-48 52,-22 50,6 C48,30 34,44 14,48 C4,50 -6,48 -12,40 C-20,44 -30,40 -32,34 C-38,32 -40,28 -40,22Z" fill="#e6c2a6" stroke="#9a7056" strokeWidth={1.4} />
          <circle cx={-26} cy={14} r={4} fill="#2b1d22" opacity={0.75} />
          <path d="M-46,4 C-40,-30 -10,-48 18,-44 C40,-40 52,-20 52,2" fill="none" stroke={Q.centre} strokeWidth={9} strokeLinecap="round" opacity={0.35} />
          <path d="M-46,4 C-40,-30 -10,-48 18,-44 C40,-40 52,-20 52,2" fill="none" stroke="#ffd9a0" strokeWidth={3.4} strokeLinecap="round" />
        </g>
      </Part>
      <g mask={`url(#w8-oss-fade${cid})`}>
        <Part id="azaleko-ektodermoa" quiet>
          <path d={smoothPath(SKIN, true, 0.2)} fill="#c99a86" />
          <path d={smoothPath(layer(140, 147), true, 0.2)} fill={Q.skin} opacity={0.85} />
        </Part>
        <Part id="prosentzefaloa" quiet>
          <path d={smoothPath(BRAIN, true, 0.2)} fill={`url(#w8-oss-brain${cid})`} />
          <path d={smoothPath(layer(476, 481), true, 0.2)} fill="#a9bdf5" opacity={0.6} />
        </Part>
        <path d={smoothPath(MEMBRANE, true, 0.2)} fill="#2a1d18" />
      </g>
      <Part id="mesenkima">
        <path d={smoothPath(MEMBRANE, true, 0.2)} fill="url(#w8-mes)" mask={`url(#w8-oss-fade${cid})`} />
        {L_CELLS.map((c, i) => {
          const d = Math.hypot(c.p[0] - LC[0], c.p[1] - LC[1]);
          // Cells near the centre become osteoblasts; spicules then sweep past the rest.
          const taken = lCentre * (d < 40 ? 1 : 0) + Math.min(1, spic * 1.15) * (d < 120 ? 1 : 0);
          return <MesCell key={i} p={c.p} r={c.r} a={c.a} opacity={1 - 0.75 * Math.min(1, taken)} />;
        })}
      </Part>
      <Part id="hezur-espikulak" show={spic > 0.01 ? 1 : 0}>
        {SPICULES.map((sp, i) => (
          <path key={i} d={spicPath(sp, spic)} fill="none" stroke={Q.bone} strokeWidth={lerp(6, 4, i % 2)} strokeLinecap="round" />
        ))}
        {BRANCHES.map((b, i) => {
          const u = Math.max(0, (spic - b.from) / (1 - b.from));
          return u > 0.02 ? <path key={i} d={spicPath(b.pts, u)} fill="none" stroke={Q.bone} strokeWidth={3} strokeLinecap="round" /> : null;
        })}
        <circle cx={LC[0]} cy={LC[1]} r={lerp(8, 26, spic)} fill={Q.bone} />
      </Part>
      <Part id="hezurtzapen-zentroak" show={lCentre}>
        <circle cx={LC[0]} cy={LC[1]} r={22 + 3 * pulse * (1 - spic)} fill={Q.centre} opacity={0.35 * (1 - 0.6 * spic)} />
      </Part>
      <Part id="osteoblastoak" show={lCentre}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const r = lerp(14, 34, spic);
          return <circle key={i} cx={LC[0] + Math.cos(a) * r} cy={LC[1] + Math.sin(a) * r} r={4.2} fill={Q.centre} stroke={Q.osteo} strokeWidth={1.4} />;
        })}
        {SPICULES.map((sp, i) => {
          const p = sp[Math.max(1, Math.round(spic * 6))];
          return spic > 0.15 ? <circle key={`s${i}`} cx={p[0]} cy={p[1]} r={3.4} fill={Q.centre} stroke={Q.osteo} strokeWidth={1.2} /> : null;
        })}
      </Part>

      {/* ——— Endochondral: a long-bone model ——— */}
      <Part id="mesenkima" show={1 - round}>
        <ellipse cx={RX} cy={MID} rx={128} ry={236} fill={`url(#w8-oss-field${cid})`} />
        {cells.map((c, i) => (
          <MesCell key={i} p={c.p} r={CHONDRO[i].r * 0.26 + 0.1} a={CHONDRO[i].a + c.u * 50} />
        ))}
      </Part>
      <Part id="kondroblastoak" show={round * (1 - hyper)}>
        {cells.map((c, i) => (
          <g key={i}>
            <ellipse cx={f1(c.p[0])} cy={f1(c.p[1])} rx={f1(CHONDRO[i].r * 1.05)} ry={f1(CHONDRO[i].r * 0.95)} fill={Q.cartCell} stroke={Q.cartDeep} strokeWidth={0.8} />
            <circle cx={f1(c.p[0])} cy={f1(c.p[1])} r={f1(CHONDRO[i].r * 0.42)} fill={Q.cartDeep} />
          </g>
        ))}
      </Part>
      <Part id="kartilago-eredua" show={matrix}>
        <g mask={`url(#w8-oss-grow${cid})`}>
          <path d={smoothPath(MODEL, true, 0.3)} fill={Q.cart} />
          <path d={smoothPath(MODEL, true, 0.3)} fill={`url(#w8-oss-hyal${cid})`} />
          <g clipPath={`url(#w8-oss-model${cid})`}>
            {/* Calcified matrix round the hypertrophic chondrocytes. */}
            {calcOut > 2 && (
              <path
                d={`M${RX - 80},${f1(MID - calcOut)}H${RX + 80}V${f1(MID - calcIn)}H${RX - 80}ZM${RX - 80},${f1(MID + calcIn)}H${RX + 80}V${f1(MID + calcOut)}H${RX - 80}Z`}
                fill={`url(#w8-oss-calc${cid})`}
                opacity={0.85 * hyper}
              />
            )}
            {cells.map((c, i) => {
              const r = CHONDRO[i].r;
              const k = 1 + 0.35 * c.flat;
              const q = 1 - 0.42 * c.flat;
              return (
                <g key={i} transform={`translate(${f1(c.p[0])},${f1(c.p[1])})`}>
                  <ellipse rx={f1(r * 1.5 * (1 + 0.9 * c.h) * k)} ry={f1(r * 1.2 * (1 + 1.15 * c.h) * q)} fill="#ddd7ff" opacity={0.45} />
                  <ellipse rx={f1(r * 1.05 * (1 + 0.75 * c.h) * k)} ry={f1(r * 0.95 * (1 + 0.95 * c.h) * q)} fill={Q.cartCell} opacity={1 - 0.4 * c.h} stroke={Q.cartDeep} strokeWidth={0.8} />
                  <circle r={f1(r * 0.42 * (1 - 0.35 * c.h))} fill={Q.cartDeep} />
                </g>
              );
            })}
          </g>
          {/* Perichondrium. */}
          <path d={smoothPath(MODEL, true, 0.3)} fill="none" stroke="#c6b9ff" strokeWidth={3.2} opacity={0.9} />
          <path d={smoothPath(MODEL, true, 0.3)} fill="none" stroke={Q.cartDeep} strokeWidth={1.2} />
        </g>
      </Part>
      <Part id="kondroblastoak" show={matrix * (1 - hyper)}>
        {RIM.map((p, i) => (
          <ellipse key={i} cx={f1(p[0])} cy={f1(p[1])} rx={4.4} ry={2.2} transform={`rotate(${f1(rimAngle(i))} ${f1(p[0])} ${f1(p[1])})`} fill={Q.cartCell} stroke={Q.cartDeep} strokeWidth={0.9} />
        ))}
      </Part>
      <Part id="kondrozitoak" show={hyper}>
        {cells.map((c, i) =>
          c.h > 0.25 ? (
            <ellipse
              key={i}
              cx={f1(c.p[0])}
              cy={f1(c.p[1])}
              rx={f1(CHONDRO[i].r * 1.5 * (1 + 0.9 * c.h))}
              ry={f1(CHONDRO[i].r * 1.2 * (1 + 1.15 * c.h))}
              fill="transparent"
              stroke="#f4f1ff"
              strokeWidth={1.1}
              opacity={c.h}
            />
          ) : null,
        )}
      </Part>

      {/* The primary centre: marrow and trabeculae where the cartilage was. */}
      <Part id="hezurtzapen-zentroak" show={prim}>
        <g clipPath={`url(#w8-oss-model${cid})`}>
          <g clipPath={`url(#w8-oss-shaft${cid})`}>
            <rect x={RX - 80} y={TOP} width={160} height={BOT - TOP} fill="#5a1622" />
            <rect x={RX - 80} y={TOP} width={160} height={BOT - TOP} fill={`url(#w8-oss-marrow${cid})`} />
            {TRAB_LINKS.map(([a, b], i) => (
              <path key={i} d={`M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`} stroke={Q.bone} strokeWidth={2} strokeLinecap="round" />
            ))}
            {TRABECULAE.map((c, i) => (
              <path key={i} d={smoothPath(c, false, 0.3)} fill="none" stroke={Q.bone} strokeWidth={3.2} strokeLinecap="round" />
            ))}
            {/* The calcified cartilage cores the bone is laid on. */}
            {TRABECULAE.map((c, i) => (
              <path key={i} d={smoothPath(c, false, 0.3)} fill="none" stroke={Q.cartDeep} strokeWidth={1} opacity={0.55} />
            ))}
          </g>
        </g>
        <ellipse cx={RX} cy={MID} rx={lerp(30, 46, pulse)} ry={lerp(40, 56, pulse) + boneR * 0.6} fill={`url(#w8-oss-glow${cid})`} opacity={1 - 0.8 * spread} />
      </Part>
      {/* Periosteal bone collar round the shaft (the perichondrium there turns periosteum). */}
      <Part id="hezurtzapen-zentroak" show={collar}>
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={collarPath(collarR, s)} fill={Q.bone} stroke={Q.boneDeep} strokeWidth={1} />
            <path d={collarPath(collarR, s)} fill="url(#w8-bone)" />
          </g>
        ))}
      </Part>
      {/* The vessel that brings the osteoblasts in, then runs up and down the marrow behind the front. */}
      {vessel > 0.01 && (
        <Part id="odol-hodiak">
          {/* It comes from outside the plane: its outer end fades in instead of starting in mid-air. */}
          <defs>
            <linearGradient id={`w8-oss-budg${cid}`} gradientUnits="userSpaceOnUse" x1={RX - 150} y1={0} x2={RX - 92} y2={0}>
              <stop offset="0" stopColor="#fff" stopOpacity={0} />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
            <mask id={`w8-oss-bud${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
              <rect x={0} y={0} width={1000} height={640} fill={`url(#w8-oss-budg${cid})`} />
            </mask>
          </defs>
          <g mask={`url(#w8-oss-bud${cid})`}>
            <path d={BUD} fill="none" stroke="#7a1410" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${f1(vessel)} 2`} />
            <path d={BUD} fill="none" stroke={Q.vessel} strokeWidth={4.4} strokeLinecap="round" pathLength={1} strokeDasharray={`${f1(vessel)} 2`} />
          </g>
          {prim > 0.01 &&
            [-1, 1].map((s) => (
              <path
                key={s}
                d={`M${RX + 4},${MID + 2}C${RX + 10},${f1(MID + s * boneR * 0.3)} ${RX - 8},${f1(MID + s * boneR * 0.6)} ${RX - 2},${f1(MID + s * Math.max(4, boneR - 10))}`}
                fill="none"
                stroke={Q.vessel}
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={0.9}
              />
            ))}
          {!reduced && vessel > 0.98 && (
            <g>
              {[0, 1, 2, 3].map((k) => (
                <circle key={k} r={2.2} fill="#ffd0c8">
                  <animateMotion dur="2.4s" begin={`${k * 0.6}s`} repeatCount="indefinite" path={BUD} />
                </circle>
              ))}
            </g>
          )}
        </Part>
      )}
      <Part id="osteoblastoak" show={prim}>
        {osteo.map((p, i) => (
          <ellipse key={i} cx={f1(p[0])} cy={f1(p[1])} rx={3.6} ry={2.6} fill={Q.osteo} stroke={Q.centre} strokeWidth={1.2} />
        ))}
      </Part>


      <Note x={LX} y={44} size={13}>
        Mintzezko hezurtzapena
      </Note>
      <Note x={RX} y={44} size={13}>
        Hezurtzapen endokondrala
      </Note>
      <Note x={LX} y={153} size={12.5} tone="dim">
        azala
      </Note>
      <Note x={LX} y={520} size={12.5} tone="dim">
        entzefaloa
      </Note>
      <Note x={96} y={186} size={12} tone="dim">
        buru-ganga
      </Note>
      <Note x={RX} y={78} size={13} tone="accent" show={vis(t, OSS_T.cartilage + 0.02, OSS_T.centre)}>
        1. fasea: kartilago hialinozko eredua
      </Note>
      <Note x={RX} y={78} size={13} tone="accent" show={vis(t, OSS_T.centre + 0.02)}>
        2. fasea: kartilagoa hezurtzen da
      </Note>
      <Note x={RX - 108} y={MID - 108} size={12.5} tone="dim" show={vessel * (1 - spread)}>
        odol hodia
      </Note>

      <Note x={500} y={612} tone="accent" show={vis(t, 0, OSS_T.membrane)}>
        Bi hezurtzapen mota, biak mesenkimatik
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.membrane, OSS_T.spicules)}>
        Mintzezkoa: mesenkimaren mintzezko ereduan zuzenean agertzen da hezurtzapen zentroa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.spicules, OSS_T.cartilage)}>
        Zentrotik hezur espikulak erradialki: mintzezko eredua zuzenean hezurtzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.cartilage, OSS_T.centre)}>
        Endokondrala: lehenengo kondroblastoek kartilago hialinozko eredua egiten dute
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.centre, OSS_T.spread)}>
        2. fasean: hezurtzapen zentroa (odol hodia, osteoblastoak) eta kartilagoa hezur bihurtzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.spread)}>
        Mintzezkoa: buru-gangako hezur lauak · endokondrala: kondrokraneoa, gorputz-adarrak, ornoak
      </Note>

      <Label id="mesenkima" x={190} y={230} ax={L_CELLS[3].p[0]} ay={L_CELLS[3].p[1]} />
      <Label id="hezurtzapen-zentroak" text="Hezurtzapen zentroa" x={190} y={318} ax={LC[0] - 20} ay={LC[1]} show={lCentre} />
      <Label id="osteoblastoak" x={190} y={360} ax={LC[0] - lerp(14, 34, spic) * Math.cos(Math.PI / 9) + 2} ay={LC[1] + 9} show={lCentre} small />
      <Label id="hezur-espikulak" x={190} y={420} ax={SPICULES[5][4][0]} ay={SPICULES[5][4][1]} show={spic} />

      <Label id="mesenkima" x={810} y={110} ax={cells[MES_I].p[0]} ay={cells[MES_I].p[1]} show={1 - round} />
      <Label id="kartilago-eredua" x={776} y={150} ax={RX + halfW(TOP + 60) - 8} ay={TOP + 58} show={matrix} />
      <Label id="kondroblastoak" x={810} y={196} ax={RIM[RIM_I][0]} ay={RIM[RIM_I][1]} show={round * (1 - hyper)} small />
      <Label id="kondrozitoak" x={810} y={236} ax={RX + 14} ay={MID - boneR - 22} show={hyper} small />
      <Label id="hezurtzapen-zentroak" text="Hezur lepokoa" x={810} y={276} ax={RX + halfW(MID + 40) + 2} ay={MID + 40} show={collar} small />
      <Label id="hezurtzapen-zentroak" text="Zentro primarioa" x={810} y={316} ax={RX + 9} ay={MID + 13} show={prim} />
      <Label id="osteoblastoak" x={810} y={360} ax={osteo.length ? osteo[osteo.length - 2][0] + 3 : RX} ay={osteo.length ? osteo[osteo.length - 2][1] : MID} show={prim} small />
    </g>
  );
}
