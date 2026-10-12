'use client';

import { useId } from 'react';
import { Label, Mark, Note, Part, clamp, lerp, lerpPt, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, PlateMask, SKIN, SkinDefs, atDay, limbGeom, polar, ramp, win, type LimbGeom, type Num } from './skin';

/**
 * Topic 5, step 2 — the embryo from day 36 to day 56 seen from its left side, traced from the
 * course figures "42. eguna", "48. eguna" and "56. eguna" (Langman). Every keyframe is written in
 * the pixel coordinates of its figure and mapped into the scene at the figure's own scale, so the
 * body morphs continuously: the head swells to almost half the length, the face forms, the limb
 * buds flatten into hand and foot plates, grow digital rays and bend at elbow and knee.
 * Face to the left (ventral), back to the right (dorsal).
 */

type Ell = readonly [number, number, number, number, number]; // cx, cy, rx, ry, rot (figure px)
type LimbV = readonly [number, number, number, number, number, number, number, number]; // root x, y · a0 a1 a2 · len · dev · w

interface Key {
  [k: string]: Num;
  box: readonly [number, number, number]; // figure centre x, y · scale
  /**
   * Head and trunk silhouette, traced on the figure, always with the same 22 landmarks in order:
   * 0 nape · 1–4 back · 5 rump · 6 under the thigh · 7 lower belly · 8 below the cord · 9 above the cord ·
   * 10 chest · 11 under the chin · 12 chin · 13 mouth · 14 upper lip · 15 nose · 16 below the forehead ·
   * 17 forehead · 18 crown (front) · 19 vertex · 20 crown (back) · 21 occiput.
   */
  outline: readonly (readonly [number, number])[];
  cran: Ell; // skull vault (for the scalp vessels)
  jaw: Ell;
  heart: Ell;
  liver: Ell;
  cord: readonly [number, number, number, number, number]; // root x, y · tip x, y · radius
  arm: LimbV;
  leg: LimbV;
  eye: readonly [number, number, number]; // x, y, radius
  ear: readonly [number, number, number];
  nose: readonly [number, number];
  mouth: readonly [number, number];
  arch: number; // pharyngeal arches still visible (36 → 42)
}

const K42: Key = {
  box: [1470, 560, 0.58],
  outline: [
    [1758, 262], [1802, 393], [1819, 527], [1813, 682], [1780, 838], [1700, 915], [1580, 935], [1450, 880], [1395, 790], [1300, 648], [1262, 630],
    [1230, 612], [1195, 592], [1165, 566], [1141, 538], [1124, 500], [1119, 455], [1135, 380], [1190, 290], [1285, 212], [1420, 150], [1600, 136],
  ],
  cran: [1420, 380, 300, 235, 8],
  jaw: [1420, 598, 52, 30, 20],
  heart: [1530, 612, 96, 108, 0],
  liver: [1505, 762, 72, 56, 0],
  cord: [1395, 727, 1210, 721, 58],
  arm: [1705, 440, 98, 100, 105, 270, 2.25, 100],
  leg: [1700, 890, 180, 180, 182, 310, 1.9, 104],
  eye: [1374, 482, 22],
  ear: [1524, 415, 27],
  nose: [1458, 540],
  mouth: [1430, 580],
  arch: 0.15,
};


/** Day ~36, derived from day 42: a smaller head bent further over the heart, paddle-like buds, arches still visible. */
const shrinkHead = (p: readonly number[], i: number): [number, number] => {
  if (i >= 1 && i <= 9) return [p[0], p[1]];
  const k = i === 0 || i === 10 ? 0.93 : 0.82;
  return [1560 + (p[0] - 1560) * k, 520 + (p[1] - 520) * k];
};
const K36: Key = {
  ...K42,
  outline: K42.outline.map(shrinkHead),
  cran: [1450, 412, 250, 195, 8],
  jaw: [1442, 600, 46, 27, 20],
  eye: [...shrinkHead(K42.eye, 15), 17],
  ear: [...shrinkHead(K42.ear, 15), 17],
  nose: shrinkHead(K42.nose, 15),
  mouth: shrinkHead(K42.mouth, 15),
  arm: [1665, 425, 98, 98, 108, 270, 1.35, 96],
  leg: [1700, 862, 172, 172, 176, 310, 1.0, 98],
  arch: 0.8,
};

const K48: Key = {
  box: [1405, 580, 0.52],
  outline: [
    [1680, 262], [1696, 380], [1692, 520], [1698, 680], [1698, 830], [1662, 970], [1540, 1040], [1390, 980], [1334, 948], [1330, 850], [1325, 760],
    [1300, 612], [1270, 592], [1232, 577], [1170, 545], [1122, 485], [1098, 400], [1100, 300], [1150, 170], [1280, 92], [1450, 100], [1600, 160],
  ],
  cran: [1380, 330, 280, 235, 0],
  jaw: [1270, 598, 55, 30, 10],
  heart: [1420, 690, 90, 80, 0],
  liver: [1385, 795, 62, 55, 0],
  cord: [1345, 940, 1185, 955, 52],
  arm: [1580, 585, 100, 180, 192, 380, 3.25, 88],
  leg: [1600, 955, 188, 170, 190, 380, 2.9, 104],
  eye: [1310, 512, 25],
  ear: [1452, 468, 30],
  nose: [1146, 490],
  mouth: [1250, 585],
  arch: 0,
};


const K56: Key = {
  box: [1060, 630, 0.43],
  outline: [
    [1320, 180], [1395, 300], [1440, 430], [1455, 615], [1447, 805], [1400, 1010], [1235, 1235], [1010, 1000], [990, 900], [985, 780], [1016, 705],
    [1036, 662], [1012, 634], [1000, 608], [948, 596], [932, 572], [765, 488], [673, 323], [729, 153], [900, 38], [1060, 28], [1220, 90],
  ],
  cran: [1010, 330, 335, 300, -5],
  jaw: [1100, 615, 80, 30, 10],
  heart: [1150, 720, 100, 80, 0],
  liver: [1100, 862, 105, 100, 0],
  cord: [985, 820, 855, 800, 44],
  arm: [1277, 556, 113, 195, 178, 580, 4, 100],
  leg: [1150, 990, 168, 180, 195, 560, 4, 118],
  eye: [975, 508, 22],
  ear: [1165, 392, 36],
  nose: [930, 568],
  mouth: [998, 604],
  arch: 0,
};


const KEYS = [
  { day: 36, s: K36 },
  { day: 42, s: K42 },
  { day: 48, s: K48 },
  { day: 56, s: K56 },
];

const CX = 520;
const CY = 322;

/** Geometry of the embryo on `day`, in scene coordinates. Labels anchor to the same points. */
export function embryo56(day: number) {
  const k = atDay(KEYS, day);
  const [fx, fy, s] = k.box;
  const P = (p: readonly number[]): Pt => [CX + (p[0] - fx) * s, CY + (p[1] - fy) * s];
  const E = (e: Ell): Ell => [...P(e), e[2] * s, e[3] * s, e[4]];
  const limb = (v: LimbV, toes: boolean) => limbGeom({ root: P(v), a: [v[2], v[3], v[4]], len: v[5] * s, dev: v[6], w: v[7] * s, toes });
  return {
    k,
    s,
    cran: E(k.cran),
    jaw: E(k.jaw),
    heart: E(k.heart),
    liver: E(k.liver),
    outline: k.outline.map(P),
    cordRoot: P([k.cord[0], k.cord[1]]),
    cordTip: P([k.cord[2], k.cord[3]]),
    cordR: k.cord[4] * s,
    arm: limb(k.arm, false),
    leg: limb(k.leg, true),
    armDev: k.arm[6],
    legDev: k.leg[6],
    eye: P(k.eye),
    eyeR: k.eye[2] * s,
    ear: P(k.ear),
    earR: k.ear[2] * s,
    nose: P(k.nose),
    mouth: P(k.mouth),
    arch: k.arch,
  };
}
export type Embryo56Geom = ReturnType<typeof embryo56>;

/** Point on an ellipse (cx, cy, rx, ry, rot) at angle `deg`, `f` × radius. */
export const onE = (e: readonly number[], deg: number, f = 1): Pt => {
  const a = (deg * Math.PI) / 180;
  const r = ((e[4] ?? 0) * Math.PI) / 180;
  const x = Math.cos(a) * e[2] * f;
  const y = Math.sin(a) * e[3] * f;
  return [e[0] + x * Math.cos(r) - y * Math.sin(r), e[1] + x * Math.sin(r) + y * Math.cos(r)];
};

const ell = (e: readonly number[], extra?: React.SVGProps<SVGEllipseElement>) => (
  <ellipse cx={e[0]} cy={e[1]} rx={Math.max(0.1, e[2])} ry={Math.max(0.1, e[3])} transform={e[4] ? `rotate(${e[4]} ${e[0]} ${e[1]})` : undefined} {...extra} />
);

/** One limb: skin-lit body, plate and free digits, melting into the trunk at the root; rays and grooves on the plate. */
function Limb({ sk, pid, id, idPlate, g, plate }: { sk: string; pid: string; id: string; idPlate: string; g: LimbGeom; plate: number }) {
  const [rx, ry] = g.joints.prox;
  return (
    <g>
      <defs>
        <radialGradient id={`${pid}-fade`} gradientUnits="userSpaceOnUse" cx={rx} cy={ry} r={g.w * 1.2}>
          <stop offset="0.5" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id={`${pid}-mask`} maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
          <rect x="-1000" y="-1000" width="3000" height="3000" fill={`url(#${pid}-fade)`} />
        </mask>
        <PlateMask id={`${pid}-marks`} g={g} inset={3.5} />
      </defs>
      <g mask={`url(#${pid}-mask)`} pointerEvents="none">
        <g fill="none" stroke="#3a1512" strokeOpacity={0.7} strokeLinecap="round">
          <path d={g.body} strokeWidth={2.4} />
          {g.hand && <path d={g.hand} strokeWidth={2.4} />}
          {g.digitA > 0.02 && g.digits.map(([a, b], i) => <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} strokeWidth={g.digitW + 2.4} strokeOpacity={0.7 * g.digitA} />)}
        </g>
        <g filter={`url(#${sk}-soft)`} fill={`url(#${sk}-limb)`}>
          <path d={g.body} />
          {g.hand && <path d={g.hand} />}
          {g.digitA > 0.02 && (
            <g stroke={`url(#${sk}-limb)`} strokeWidth={g.digitW} strokeLinecap="round">
              {g.digits.map(([a, b], i) => (
                <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} />
              ))}
            </g>
          )}
        </g>
      </g>
      <Part id={id} show={1 - plate * 0.999}>
        <path d={g.body} fill="rgba(255,255,255,0.001)" />
      </Part>
      {g.hand && (
        <Part id={idPlate} show={plate}>
          <path d={g.hand} fill="rgba(255,255,255,0.001)" />
        </Part>
      )}
      <g mask={`url(#${pid}-marks)`}>
        {g.rayA > 0.02 && (
          <Part id="hatzetako-izpiak" show={g.rayA}>
            {g.rays.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke="#fff1ea" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
            ))}
          </Part>
        )}
        {g.grooveA > 0.02 && (
          <Part id="izpiarteko-ildoak" show={g.grooveA}>
            {g.grooves.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.line} strokeWidth={1.8} strokeLinecap="round" />
            ))}
          </Part>
        )}
      </g>
    </g>
  );
}

export function Embryo56Figure({ day }: { day: number }) {
  const g = embryo56(day);
  const { cran, jaw, heart, liver, arm, leg } = g;
  // Unique def ids: several drawings (frame sheets, transitions) can share one page.
  const sk = 'w5g' + useId().replace(/[^A-Za-z0-9_-]/g, '');

  const eyeA = ramp(day, 37, 41.5);
  const lid = ramp(day, 41, 56);
  const groove = win(day, 39, 46, 3);
  const nasPit = 1 - ramp(day, 49, 54);
  const nose = ramp(day, 49, 55);
  const hill = 1 - ramp(day, 44, 48);
  const auricle = ramp(day, 43.5, 48);
  const meatus = ramp(day, 37, 41);
  const plexus = ramp(day, 51, 56);
  const neckFold = ramp(day, 44, 48);
  const mouth = ramp(day, 50, 56);
  const heartT = lerp(1, 0.55, ramp(day, 48, 56));
  const liverA = ramp(day, 41, 46);

  const trunk = smoothPath(g.outline, true, 0.5);

  // Umbilical cord: a tapering tube, thicker at its root where the gut loops herniate (from week 6).
  const cordAng = Math.atan2(g.cordTip[1] - g.cordRoot[1], g.cordTip[0] - g.cordRoot[0]);
  const cn: Pt = [-Math.sin(cordAng), Math.cos(cordAng)];
  const cordL = Math.hypot(g.cordTip[0] - g.cordRoot[0], g.cordTip[1] - g.cordRoot[1]);
  const herniaW = 1 + 0.4 * ramp(day, 40, 46);
  const cordSide = (sgn: number) =>
    [-0.15, 0.15, 0.4, 0.7, 1].map((u, i): Pt => {
      const w = g.cordR * [1.2, 1.05 * herniaW, 1.02 * herniaW, 0.92, 0.88][i];
      return [g.cordRoot[0] + Math.cos(cordAng) * cordL * u + cn[0] * w * sgn, g.cordRoot[1] + Math.sin(cordAng) * cordL * u + cn[1] * w * sgn];
    });
  const cordPath = smoothPath([...cordSide(1), ...cordSide(-1).reverse()], true, 0.5);
  const cordDeg = (cordAng * 180) / Math.PI;

  // Limb parts change name as they mature (bud → plate → segments).
  const armPlate = ramp(g.armDev, 1.2, 1.6);
  const legPlate = ramp(g.legDev, 1.2, 1.6);
  const segs = day > 52;

  const e = g.eye;
  const er = g.eyeR;
  const ear = g.ear;
  const R = g.earR;
  const n = g.nose;
  const m = g.mouth;

  return (
    <g>
      <SkinDefs id={sk} cx={cran[0] - cran[2] * 0.45} cy={cran[1] - cran[3] * 0.55} r={560} red={0.22} />
      <defs>
        <radialGradient id={`${sk}-limb`} gradientUnits="userSpaceOnUse" cx={cran[0] - cran[2] * 0.3} cy={cran[1] - cran[3] * 0.4} r={620}>
          <stop offset="0" stopColor="#f9dccf" />
          <stop offset="0.6" stopColor="#eba897" />
          <stop offset="1" stopColor="#c9786b" />
        </radialGradient>
        <radialGradient id={`${sk}-heart`} cx="0.42" cy="0.4" r="0.65">
          <stop offset="0" stopColor="#d9505c" stopOpacity="0.5" />
          <stop offset="0.7" stopColor="#c8505a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#c8505a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${sk}-liver`} cx="0.45" cy="0.42" r="0.65">
          <stop offset="0" stopColor="#8f2f2c" stopOpacity="0.5" />
          <stop offset="0.75" stopColor="#8f2f2c" stopOpacity="0.18" />
          <stop offset="1" stopColor="#8f2f2c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${sk}-cord`} gradientUnits="userSpaceOnUse" x1={g.cordRoot[0] + cn[0] * g.cordR} y1={g.cordRoot[1] + cn[1] * g.cordR} x2={g.cordRoot[0] - cn[0] * g.cordR} y2={g.cordRoot[1] - cn[1] * g.cordR}>
          <stop offset="0" stopColor="#c56f62" />
          <stop offset="0.55" stopColor="#eaa595" />
          <stop offset="1" stopColor="#f7cfc2" />
        </linearGradient>
        <radialGradient id={`${sk}-iris`} cx="0.4" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#5a2a26" />
          <stop offset="0.7" stopColor="#2a1110" />
          <stop offset="1" stopColor="#1a0a09" />
        </radialGradient>
      </defs>

      {/* Umbilical cord tube, under the body so it grows out of the belly wall. */}
      <g pointerEvents="none">
        <path d={cordPath} fill={`url(#${sk}-cord)`} stroke="#8f3f37" strokeWidth={1.2} strokeOpacity={0.75} />
        <path
          d={smoothPath([0.05, 0.4, 0.75, 0.97].map((u): Pt => [g.cordRoot[0] + Math.cos(cordAng) * cordL * u - cn[0] * g.cordR * 0.45, g.cordRoot[1] + Math.sin(cordAng) * cordL * u - cn[1] * g.cordR * 0.45]), false)}
          fill="none"
          stroke="#fff4ee"
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.45}
        />
      </g>
      {/* One lit silhouette for head and trunk; the leg lies on top of it, beside the tail. */}
      <g filter={`url(#${sk}-sculpt)`} fill={`url(#${sk}-skin)`}>
        <path d={trunk} />
      </g>

      {/* Langman's darker dorsal band: the back curves away from the light. */}
      <clipPath id={`${sk}-clip`}>
        <path d={trunk} />
      </clipPath>
      <g clipPath={`url(#${sk}-clip)`} pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={smoothPath(g.outline.slice(0, 7), false)} stroke="#b4544a" strokeWidth={34 * g.s / 0.5} opacity={0.22} />
        <path d={smoothPath(g.outline.slice(0, 7), false)} stroke="#a3443d" strokeWidth={14 * g.s / 0.5} opacity={0.3} />
        <path d={smoothPath(g.outline.slice(17, 22), false)} stroke="#fff3ec" strokeWidth={30 * g.s / 0.5} opacity={0.12} />
      </g>
      {/* Relief: pharyngeal arches fading out, neck fold, organs showing through the thin wall. */}
      <g pointerEvents="none">
        {g.arch > 0.02 &&
          [0, 1, 2].map((i) => {
            const a = onE(jaw, -40 + i * 22, 1.05 + i * 0.22);
            const b = onE(jaw, 60 + i * 12, 0.9 + i * 0.25);
            return <path key={i} d={`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2 + 6},${(a[1] + b[1]) / 2} ${b[0]},${b[1]}`} fill="none" stroke={SKIN.line} strokeWidth={2} strokeLinecap="round" opacity={0.55 * g.arch} />;
          })}
      </g>
      <Part id="bihotz-goragunea" show={heartT}>
        {ell(heart, { fill: `url(#${sk}-heart)` })}
      </Part>
      {liverA > 0.02 && (
        <Part id="gibelaren-goragunea" show={liverA}>
          {ell(liver, { fill: `url(#${sk}-liver)` })}
        </Part>
      )}
      {neckFold > 0.02 && (
        <Part id="lepoko-tolestura" show={neckFold}>
          {(() => {
            const a = onE(cran, 18, 0.93);
            const b = g.outline[0];
            const c: Pt = [(a[0] + b[0]) / 2 - 10, (a[1] + b[1]) / 2 + 4];
            return (
              <>
                <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0] - 6},${b[1] + 8}`} fill="none" stroke={SKIN.line} strokeWidth={4} strokeLinecap="round" opacity={0.18} />
                <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0] - 6},${b[1] + 8}`} fill="none" stroke={SKIN.line} strokeWidth={1.8} strokeLinecap="round" opacity={0.65} />
              </>
            );
          })()}
        </Part>
      )}
      {plexus > 0.02 && (
        <Part id="sare-baskularra" show={plexus}>
          {/* The superficial vascular plexus of the scalp: a band of branching vessels high on the head. */}
          <g fill="none" stroke={SKIN.vessel} strokeLinecap="round" opacity={0.7}>
            {[-168, -150, -132, -114, -96, -78, -60].map((a, i) => {
              const p0 = onE(cran, a, 0.6);
              const p1 = onE(cran, a + 4, 0.76);
              const p2 = onE(cran, a - 3, 0.9);
              const b1 = onE(cran, a + 12, 0.84);
              return (
                <g key={i}>
                  <path d={`M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} strokeWidth={1.4} />
                  <path d={`M${p1[0]},${p1[1]} L${b1[0]},${b1[1]}`} strokeWidth={0.9} />
                </g>
              );
            })}
          </g>
        </Part>
      )}

      {/* Cut face of the umbilical cord (its tube is drawn under the body, which covers its root). */}
      <Part id="zilborrestea">
        <path d={cordPath} fill="rgba(255,255,255,0.001)" />
        <ellipse cx={g.cordTip[0]} cy={g.cordTip[1]} rx={g.cordR * 0.34} ry={g.cordR * 0.88} transform={`rotate(${cordDeg} ${g.cordTip[0]} ${g.cordTip[1]})`} fill="#f7cdbf" stroke="#8f3f37" strokeWidth={1.2} />
        <ellipse cx={g.cordTip[0]} cy={g.cordTip[1]} rx={g.cordR * 0.2} ry={g.cordR * 0.6} transform={`rotate(${cordDeg} ${g.cordTip[0]} ${g.cordTip[1]})`} fill="#efb3a3" />
      </Part>

      {/* Leg over the cord's root (as in the figures), arm in front of everything. */}
      <Limb sk={sk} pid={`${sk}-leg`} id={segs ? 'izterra' : 'beheko-gorputz-adarraren-hasikina'} idPlate={segs ? 'oina' : 'oin-plaka'} g={leg} plate={legPlate} />
      {/* Arm in front of the body. */}
      <Limb sk={sk} pid={`${sk}-arm`} id={segs ? 'besoa' : 'goiko-gorputz-adarraren-hasikina'} idPlate={segs ? 'eskua' : 'esku-plaka'} g={arm} plate={armPlate} />

      {/* Eye: pigmented eye under growing eyelids; nasolacrimal groove toward the nasal pit. */}
      {eyeA > 0.02 && (
        <Part id="begia" show={eyeA}>
          <ellipse cx={e[0]} cy={e[1]} rx={er * 1.18} ry={er} fill="#f4c2b4" opacity={0.6} />
          <circle cx={e[0]} cy={e[1]} r={er * 0.78} fill={`url(#${sk}-iris)`} />
          <circle cx={e[0] - er * 0.28} cy={e[1] - er * 0.28} r={er * 0.2} fill="#fff" opacity={0.55} />
        </Part>
      )}
      {lid > 0.02 && (
        <Part id="betazala" show={ramp(day, 40, 43)}>
          {/* Upper and lower lid folds close over the eye as they grow. */}
          <path d={`M${e[0] - er * 1.25},${e[1]} Q${e[0]},${e[1] - er * lerp(1.7, 0.2, lid)} ${e[0] + er * 1.25},${e[1]} Q${e[0]},${e[1] - er * lerp(2.4, 1.6, lid)} ${e[0] - er * 1.25},${e[1]} Z`} fill="#eeb0a0" stroke={SKIN.line} strokeWidth={1.3} />
          <path d={`M${e[0] - er * 1.15},${e[1] + 1} Q${e[0]},${e[1] + er * lerp(1.6, 0.55, lid)} ${e[0] + er * 1.15},${e[1] + 1} Q${e[0]},${e[1] + er * lerp(2.2, 1.5, lid)} ${e[0] - er * 1.15},${e[1] + 1} Z`} fill="#eeb0a0" stroke={SKIN.line} strokeWidth={1.1} opacity={0.95} />
        </Part>
      )}
      {groove > 0.02 && (
        <Part id="ildo-nasolakrimala" show={groove}>
          <path d={`M${e[0] - er * 0.9},${e[1] + er * 0.8} Q${(e[0] + n[0]) / 2 - 2},${(e[1] + n[1]) / 2 + er * 0.9} ${n[0] + 7},${n[1] - 2}`} fill="none" stroke={SKIN.ink} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </Part>
      )}
      {nasPit > 0.02 && (
        <Part id="sudur-hobia" show={nasPit}>
          <ellipse cx={n[0]} cy={n[1]} rx={6.5} ry={9} transform={`rotate(20 ${n[0]} ${n[1]})`} fill="#f7d2c4" stroke={SKIN.line} strokeWidth={1.1} />
          <ellipse cx={n[0] + 1} cy={n[1] + 1} rx={2.6} ry={5} transform={`rotate(20 ${n[0]} ${n[1]})`} fill={SKIN.ink} opacity={0.75} />
        </Part>
      )}
      {nose > 0.02 && (
        <Part id="sudurra" show={nose}>
          <path d={`M${n[0] + 8},${n[1] - 14} Q${n[0] - 7},${n[1] - 2} ${n[0] + 1},${n[1] + 7} Q${n[0] + 8},${n[1] + 10} ${n[0] + 13},${n[1] + 5}`} fill="#efb3a3" stroke={SKIN.line} strokeWidth={1.4} />
          <ellipse cx={n[0] + 6} cy={n[1] + 4.5} rx={2.4} ry={1.5} fill={SKIN.ink} />
        </Part>
      )}
      {mouth > 0.02 && (
        <>
          <Part id="ahoa" show={mouth}>
            <path d={`M${m[0] - 12},${m[1] - 2} Q${m[0]},${m[1] + 4} ${m[0] + 13},${m[1]}`} fill="none" stroke={SKIN.ink} strokeWidth={2.4} strokeLinecap="round" />
          </Part>
          <Part id="beheko-maxilarra" show={mouth}>
            {/* Chin and the lower border of the jaw, running back under the cheek toward the ear. */}
            {(() => {
              const c = g.outline[12];
              const back: Pt = [lerp(c[0], ear[0] - R * 0.6, 0.55), lerp(c[1], ear[1] + R * 3.2, 0.55)];
              return <path d={`M${m[0] + 2},${m[1] + 9} Q${c[0] - 2},${c[1] + 8} ${back[0]},${back[1]}`} fill="none" stroke={SKIN.line} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />;
            })()}
          </Part>
        </>
      )}

      {/* Ear: six auricular hillocks round the external meatus (42) fuse into the auricle (48–56). */}
      {hill > 0.02 && (
        <Part id="belarriaren-goraguneak" show={hill}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            // Three on the first (mandibular) arch side, three on the second (hyoid) side.
            const a = (i < 3 ? 115 + i * 55 : -65 + (i - 3) * 55) * (Math.PI / 180);
            const p: Pt = [ear[0] + Math.cos(a) * R * 0.78, ear[1] + Math.sin(a) * R * 0.78];
            return (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r={R * 0.32} fill="#f9d8cc" stroke={SKIN.line} strokeWidth={1} />
                <circle cx={p[0] - R * 0.08} cy={p[1] - R * 0.08} r={R * 0.12} fill="#fff" opacity={0.55} />
              </g>
            );
          })}
        </Part>
      )}
      {auricle > 0.02 && (
        <Part id="belarriaren-pabiloia" show={auricle}>
          {/* Helix opening forward (toward the face): a C of skin round the meatus. */}
          <path
            d={`M${ear[0] - R * 0.25},${ear[1] - R * 0.95} C${ear[0] + R * 0.85},${ear[1] - R * 1.25} ${ear[0] + R * 1.25},${ear[1] + R * 0.1} ${ear[0] + R * 0.55},${ear[1] + R * 0.85} C${ear[0] + R * 0.15},${ear[1] + R * 1.2} ${ear[0] - R * 0.5},${ear[1] + R * 1.05} ${ear[0] - R * 0.45},${ear[1] + R * 0.55} C${ear[0] + R * 0.25},${ear[1] + R * 0.6} ${ear[0] + R * 0.55},${ear[1] - R * 0.1} ${ear[0] + R * 0.25},${ear[1] - R * 0.5} C${ear[0]},${ear[1] - R * 0.75} ${ear[0] - R * 0.3},${ear[1] - R * 0.7} ${ear[0] - R * 0.25},${ear[1] - R * 0.95} Z`}
            fill="#f2b9aa"
            stroke={SKIN.line}
            strokeWidth={1.6}
            opacity={0.95}
          />
          <path d={`M${ear[0] + R * 0.1},${ear[1] - R * 0.9} C${ear[0] + R * 0.8},${ear[1] - R * 1.05} ${ear[0] + R * 1.05},${ear[1] - R * 0.1} ${ear[0] + R * 0.6},${ear[1] + R * 0.6}`} fill="none" stroke="#fff6f2" strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
        </Part>
      )}
      {meatus > 0.02 && (
        <Part id="kanpoko-entzumenbidea" show={meatus}>
          <ellipse cx={ear[0]} cy={ear[1]} rx={R * 0.22} ry={R * 0.3} fill={SKIN.ink} />
        </Part>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const day42to56 = (t: number) => {
  if (t < 0.13) return lerp(36, 42, seg(t, 0, 0.13));
  // Each morph runs at the start of the step that names the new day, so every done frame shows a settled embryo.
  if (t < 0.5) return 42;
  if (t < 0.555) return lerp(42, 48, seg(t, 0.5, 0.555));
  if (t < 0.78) return 48;
  if (t < 0.835) return lerp(48, 56, seg(t, 0.78, 0.835));
  return 56;
};

/** Fade in at `a`, out at `b` (stage time). */
const vis = (t: number, a: number, b = 2) => Math.min(seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

/** Camera: on the face for the face and ear steps, on the hand and foot plates for the limb steps. */
function camera(t: number, g: Embryo56Geom) {
  const pFace = seg(t, 0.13, 0.165) * (1 - seg(t, 0.296, 0.322));
  const pLimb = seg(t, 0.322, 0.352) * (1 - seg(t, 0.6, 0.632));
  const face: Pt = [(g.eye[0] * 0.55 + g.ear[0] * 0.45) - 8, (g.eye[1] + g.ear[1]) / 2 + 4];
  const hands: Pt = [(g.arm.joints.palm[0] + g.leg.joints.palm[0]) / 2 + 8, (g.arm.joints.palm[1] + g.leg.joints.palm[1]) / 2 - 6];
  const f = pFace > pLimb ? face : hands;
  const push = Math.max(pFace, pLimb);
  // The limb push-in is close enough that the whole face leaves the picture (its names go with it)
  // and the hand and foot plates fill the frame.
  const s = lerp(1, pFace > pLimb ? 1.4 : 2, push);
  return { pFace, pLimb, push, z: zoom(lerp(500, f[0], push), lerp(320, f[1], push), s, 500, lerp(320, pFace > pLimb ? 310 : 235, push)) };
}

/** A name fades away when the camera moves its anchor out of the picture. */
const inFrame = (p: Pt) => {
  const d = Math.max(30 - p[0], p[0] - 970, 34 - p[1], p[1] - 604, 0);
  return 1 - Math.min(1, d / 24);
};

export function Embryo42to56({ t }: SceneProps) {
  const day = day42to56(t);
  const g = embryo56(day);
  const { z, pLimb } = camera(t, g);
  const A = (p: readonly number[]) => z.at(p[0], p[1]);
  const { arm, leg } = g;
  // Each group of names arrives with the step that talks about it (week5.ts beats .13 face, .23 ear
  // swellings, .32 hand/foot plates, .5 second constriction, .6 auricle/neck/liver, .78 day 56) and
  // stays until the step that replaces it — so a step's own labels are on screen at its done frame.
  const face42 = vis(t, 0.13, 0.5); // the eye label hands over to the 48-day one at .5
  const face48 = vis(t, 0.13, 0.78); // the nose and the heart prominence stay named until day 56
  const ear42 = vis(t, 0.23, 0.6); // the hillocks fuse into the auricle, named at .6
  const limb42 = vis(t, 0.32, 0.5);
  const limb48 = vis(t, 0.5, 0.78);
  const ear48 = vis(t, 0.6, 0.78);
  const d56 = vis(t, 0.78);
  // Days 42–56 the left gutter also carries the finger rays and the liver: the names below the nose
  // step down to make room for the heart prominence, and come back for the day-56 names.
  const k48 = seg(t, 0.47, 0.5) * (1 - seg(t, 0.75, 0.78));
  const limbIn42 = pLimb * (1 - k48);
  // The face names leave a little ahead of the face as the camera slides down to the limbs (they are
  // out of the picture at the push-in itself), so their lines never sweep across other names.
  const faceOut = 1 - seg(limbIn42, 0, 0.6);
  const e = g.eye;
  const ear = g.ear;
  const hand = arm.joints.palm;
  const foot = leg.joints.palm;
  const plex = onE(g.cran, -132, 0.78);
  // Last step: head vs crown–rump length.
  const half = vis(t, 0.9);
  const vtx = A(onE(g.cran, -95, 1));
  const chin = A(onE(g.jaw, 95, 1));
  const rump = A(g.outline[5]);
  const BX = 730;
  const right56 = d56 * (1 - half);

  // Label helper: anchor mapped through the camera, faded when it leaves the picture.
  const L = (id: string, x: number, y: number, p: readonly number[], show: number, text?: string) => {
    const q = A(p);
    return <Label id={id} text={text} x={x} y={y} ax={q[0]} ay={q[1]} show={show * inFrame(q)} />;
  };

  // Oinzola (sole): the plantar rim of the foot plate, on the side that faces down.
  const sole = (() => {
    const pal = leg.joints.palm;
    const side = polar(pal, leg.axis + 90, 1)[1] > polar(pal, leg.axis - 90, 1)[1] ? 1 : -1;
    const pts: Pt[] = [125, 105, 85, 62].map((d) => polar(pal, leg.axis + side * d, leg.plateR * 0.84));
    return { d: smoothPath(pts, false), mid: pts[1] };
  })();
  // Which side of the foot is plantar depends on the pose; pick the one away from the trunk centre.
  const toesTip = leg.digits.map(([, b]) => b);

  return (
    <g>
      <g transform={z.transform}>
        <Embryo56Figure day={day} />
        {/* Shoulder, elbow, wrist and knee: soft pools of light at the joints (no drawn rings). */}
        <Mark id="sorbalda" x={arm.joints.prox[0]} y={arm.joints.prox[1]} rx={15} show={d56} />
        <Mark id="ukondoa" x={arm.joints.mid[0]} y={arm.joints.mid[1]} rx={11} show={d56} />
        <Mark id="eskumuturra" x={arm.joints.dist[0]} y={arm.joints.dist[1]} rx={10} show={Math.max(limb48, d56)} />
        <Mark id="belauna" x={leg.joints.mid[0]} y={leg.joints.mid[1]} rx={12} show={d56} />
        {d56 > 0.02 && (
          <>
            <Part id="oinzola" show={d56}>
              <path d={sole.d} fill="none" stroke="#fff3ec" strokeWidth={3.2} strokeLinecap="round" opacity={0.55} />
              <path d={sole.d} fill="none" stroke="rgba(255,255,255,0.001)" strokeWidth={14} />
            </Part>
            <Part id="behatzak" show={d56}>
              {leg.digits.map(([a, b], i) => (
                <path key={i} d={`M${a[0] + (b[0] - a[0]) * 0.45},${a[1] + (b[1] - a[1]) * 0.45} L${b[0]},${b[1]}`} stroke="#f6c9bb" strokeWidth={leg.digitW * 0.7} strokeLinecap="round" opacity={0.6} />
              ))}
            </Part>
          </>
        )}
      </g>

      {/* 42. eguna */}
      {L('betazala', 250, 185, [e[0], e[1] - g.eyeR * 1.1], vis(t, 0.13) * faceOut)}
      {L('begia', 250, 228, [e[0] - g.eyeR * 0.5, e[1]], face42 * faceOut, 'Begi pigmentatua')}
      {L('ildo-nasolakrimala', 250, 272, [(e[0] + g.nose[0]) / 2 - 2, (e[1] + g.nose[1]) / 2 + g.eyeR * 0.75], face48 * faceOut)}
      {L('sudur-hobia', 250, lerp(330, 316, k48), [g.nose[0] - 3, g.nose[1] + 2], face48 * faceOut)}
      {L('bihotz-goragunea', 250, lerp(400, 352, k48), [g.heart[0] - g.heart[2] * 0.55, g.heart[1]], face48)}
      {L('oin-plaka', 250, 530, [foot[0], foot[1]], limb42)}
      {L('belarriaren-goraguneak', 770, 170, [ear[0] + g.earR * 0.75, ear[1] - g.earR * 0.5], ear42)}
      {L('kanpoko-entzumenbidea', 770, 215, [ear[0] + 2, ear[1] + 2], ear42, 'Kanpoko belarri meatoa')}
      {L('esku-plaka', 770, 372, [hand[0] + 8, hand[1] - 6], limb42)}
      {L('hatzetako-izpiak', 770, 420, arm.rays[4][1], limb42)}

      {/* 48. eguna */}
      {L('begia', 250, 228, [e[0] - g.eyeR * 0.5, e[1]], vis(t, 0.5))}
      {/* In the 48-day push-in the hand plate sits high and the foot plate below it: the hand's names sit
          level with the hand and the foot's beside the foot, so no line crosses a plate. As the camera pulls
          out they hand over to their places beside the whole embryo (out fully, then in: never two at once,
          never sliding through the face names that come back into the picture). */}
      {(() => {
        const near = seg(pLimb, 0.5, 1, (k) => k);
        const far = 1 - seg(pLimb, 0, 0.5, (k) => k);
        return (
          <>
            {L('hatzetako-izpiak', 250, 160, arm.rays[1][1], limb48 * near)}
            {L('izpiarteko-ildoak', 250, 204, arm.grooves[1][1], limb48 * near)}
            {L('hatzetako-izpiak', 250, 290, leg.rays[2][1], limb48 * near, 'Behatzetako izpiak')}
            {L('hatzetako-izpiak', 250, 388, arm.rays[1][1], limb48 * far)}
            {L('izpiarteko-ildoak', 250, 420, arm.grooves[1][1], limb48 * far)}
            {L('hatzetako-izpiak', 250, 530, leg.rays[2][1], limb48 * far, 'Behatzetako izpiak')}
          </>
        );
      })()}
      {L('gibelaren-goragunea', 250, 452, [g.liver[0] - g.liver[2] * 0.35, g.liver[1] + 4], ear48)}
      {L('lepoko-tolestura', 770, 130, [g.outline[0][0] - 12, g.outline[0][1] + 10], vis(t, 0.6) * (1 - half))}
      {L('kanpoko-entzumenbidea', 770, 180, [ear[0] + 2, ear[1] + 2], vis(t, 0.6) * (1 - half))}
      {L('belarriaren-pabiloia', 770, 235, [ear[0] + g.earR * 0.85, ear[1] + g.earR * 0.2], vis(t, 0.6) * (1 - half))}
      {L('eskumuturra', 770, 400, arm.joints.dist, limb48)}
      {/* In the day-42 limb push-in the cord's name moves under the cord, left of its anchor, so its line and the heart's never cross a name. */}
      {/* When the push-in drives the cord tip to the left edge, its name leaves before its line sweeps across the heart's. */}
      {L('zilborrestea', 250, lerp(462, 490, k48), [g.cordTip[0] - 4, g.cordTip[1]], vis(t, 0.13) * (1 - limbIn42) * clamp((A([g.cordTip[0] - 4, g.cordTip[1]])[0] - 90) / 50))}
      {L('zilborrestea', 132, 360, lerpPt([g.cordTip[0] - 4, g.cordTip[1]], g.cordRoot, 0.5), vis(t, 0.13) * limbIn42)}

      {/* 56. eguna */}
      {L('sare-baskularra', 250, 80, plex, d56)}
      {L('sudurra', 250, 290, [g.nose[0] - 2, g.nose[1]], d56)}
      {L('ahoa', 250, 322, [g.mouth[0] - 12, g.mouth[1]], d56)}
      {L('beheko-maxilarra', 250, 354, [g.mouth[0] + 8, g.mouth[1] + 16], d56)}
      {L('eskumuturra', 250, 405, arm.joints.dist, d56)}
      {L('behatzak', 250, 500, toesTip[1], d56)}
      {L('oinzola', 250, 538, sole.mid, d56)}
      {L('sorbalda', 770, 290, [arm.joints.prox[0] + 4, arm.joints.prox[1] + 4], right56)}
      {L('besoa', 770, 350, [lerp(arm.joints.prox[0], arm.joints.mid[0], 0.55), lerp(arm.joints.prox[1], arm.joints.mid[1], 0.55)], right56)}
      {L('ukondoa', 770, 410, arm.joints.mid, right56)}
      {L('belauna', 770, 540, leg.joints.mid, right56)}

      {/* End of the embryonic period: the head is almost half of the length (bracket at the back). */}
      {half > 0.02 && (
        <g opacity={half} pointerEvents="none">
          {[vtx, chin, rump].map((p, i) => (
            <path key={i} d={`M${p[0] + 10},${p[1]} L${BX - 6},${p[1]}`} stroke="#ffb86b" strokeWidth={1} opacity={0.35} />
          ))}
          <path d={`M${BX},${vtx[1]} L${BX},${rump[1]}`} stroke="#6f6a62" strokeWidth={3} strokeLinecap="round" />
          <path d={`M${BX},${vtx[1]} L${BX},${lerp(vtx[1], chin[1], seg(t, 0.905, 0.94))}`} stroke="#ffb86b" strokeWidth={4.5} strokeLinecap="round" />
          {[vtx[1], chin[1], rump[1]].map((y, i) => (
            <path key={i} d={`M${BX - 7},${y} L${BX + 7},${y}`} stroke={i === 1 ? '#ffb86b' : '#a9a397'} strokeWidth={2} strokeLinecap="round" />
          ))}
        </g>
      )}
      <Note x={BX + 16} y={(vtx[1] + chin[1]) / 2} align="start" tone="accent" size={15} show={half * seg(t, 0.93, 0.95)}>
        burua ≈ ½
      </Note>
      <Note x={BX + 16} y={(chin[1] + rump[1]) / 2} align="start" show={half * seg(t, 0.93, 0.95)}>
        gorputza
      </Note>
      <AgeHud value={Math.round(day)} unit=". eguna" caption="Enbrioiaren adina" />
    </g>
  );
}
