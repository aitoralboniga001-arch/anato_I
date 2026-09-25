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
  spine: [[1330, 208], [1450, 215], [1550, 240], [1625, 290], [1680, 370], [1718, 470], [1730, 590], [1722, 710], [1690, 820], [1640, 920], [1575, 1010], [1480, 1080], [1360, 1120], [1250, 1122], [1170, 1080], [1140, 1010], [1150, 935], [1195, 868], [1250, 832], [1300, 815]],
  inner: [[1300, 330], [1330, 430], [1370, 540], [1390, 660], [1370, 760], [1340, 800], [1300, 815]],
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
  spine: [[1250, 192], [1370, 188], [1480, 208], [1570, 255], [1635, 335], [1668, 450], [1674, 580], [1658, 715], [1612, 840], [1540, 945], [1440, 1030], [1320, 1068], [1200, 1058], [1100, 1015], [1040, 950], [1012, 870], [1015, 790], [1030, 735], [1042, 700]],
  inner: [[1240, 330], [1280, 440], [1320, 560], [1330, 690], [1290, 762], [1200, 772], [1120, 778], [1078, 792], [1062, 760], [1058, 715], [1042, 700]],
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

const ORANGE = '#e5866c';
const RIM = '#c9634f';
const PALE = '#fbd9cf';

export function EarlyEmbryo({ day, beat = 0 }: { day: number; beat?: number }) {
  const g = earlyGeom(day);
  const { S } = g;
  const nSom = Math.round(g.somites[0]);
  const heart: Ell = [g.heart[0], g.heart[1], g.heart[2] * (1 + 0.03 * beat), g.heart[3] * (1 + 0.03 * beat), g.heart[4]];
  const lensPlate = 1 - ramp(day, 30, 31.5);
  const lensPit = ramp(day, 30, 31.5);
  const nasal = ramp(day, 30.5, 32);
  const sinus = ramp(day, 29, 32);
  const otic = 1 - ramp(day, 29.5, 31);
  const atrium = 1 - ramp(day, 30, 31.5);

  // Somites: beads along the whole dorsal edge, from the neck to the tail.
  const somites = Array.from({ length: nSom }, (_, i) => {
    const u = 0.06 + (0.9 * i) / Math.max(1, nSom - 1);
    const s = spineAt(S, u, lerp(21, 8, u));
    return { c: s.p, a: (Math.atan2(s.t[1], s.t[0]) * 180) / Math.PI, r: lerp(12.5, 4.5, u * u) };
  });
  const cordW = g.cord[4];

  return (
    <g>
      <SkinDefs id="w5e" cx={470} cy={260} r={430} red={0.35} />
      {/* Silhouette: one lit surface */}
      <g filter="url(#w5e-sculpt)" fill="url(#w5e-skin)">
        <path d={smoothPath([...g.spine, ...[...g.inner].reverse().slice(1)], true, 0.5)} />
        {ell(g.hind)}
        {ell(g.cran)}
        {ell(g.face)}
        {ell(heart)}
        {g.bars.map((b, i) => (
          <path key={i} d={bar(b.top, b.bot, b.w / 2, b.w / 2.4)} />
        ))}
        <path d={bar(g.cordRoot, g.cordTip, cordW * 1.1, cordW)} />
        {ell(g.arm)}
        {ell(g.leg)}
      </g>

      {/* Langman's flat relief: darker dorsal rim, pale beads, pale buds */}
      <g pointerEvents="none">
        <path d={smoothPath(Array.from({ length: 40 }, (_, i) => spineAt(S, 0.03 + (0.95 * i) / 39, 5).p), false)} fill="none" stroke={RIM} strokeWidth={7} strokeLinecap="round" opacity={0.5} />
        <path d={smoothPath(g.meso, false)} fill="none" stroke={PALE} strokeWidth={lerp(16, 22, ramp(day, 28, 32))} strokeLinecap="round" opacity={0.55} />
      </g>
      {/* Contours of the prominences, as in the course drawing */}
      <g fill="none" stroke={RIM} strokeLinecap="round" pointerEvents="none">
        {ell(heart, { strokeWidth: 1.6, opacity: 0.55 })}
        {ell(g.arm, { strokeWidth: 1.3, opacity: 0.5 })}
        {ell(g.leg, { strokeWidth: 1.3, opacity: 0.5 })}
        {g.bars.map((b, i) => (
          <path key={i} d={bar(b.top, b.bot, b.w / 2, b.w / 2.4)} strokeWidth={1.2} opacity={0.45} />
        ))}
        {(() => {
          // Stomodeum: the notch between the face and the first arch.
          const b = g.bars[0];
          const f = g.face;
          const a: Pt = [b.bot[0] - b.w * 0.55, b.bot[1] - b.w * 0.3];
          const c: Pt = [f[0] + f[2] * 0.75, f[1] - f[3] * 0.55];
          return <path d={`M${a[0]},${a[1]} Q${(a[0] + c[0]) / 2 - 6},${(a[1] + c[1]) / 2 + 4} ${c[0]},${c[1]}`} stroke={SKIN.ink} strokeWidth={2.4} opacity={0.6} />;
        })()}
      </g>
      <Part id="mesonefros-gandorra">
        <path d={smoothPath(g.meso, false)} fill="none" stroke="rgba(255,255,255,0.001)" strokeWidth={18} />
      </Part>
      <Part id="somitak">
        {somites.map((s, i) => (
          <rect key={i} x={s.c[0] - s.r * 0.75} y={s.c[1] - s.r} width={s.r * 1.5} height={s.r * 2} rx={s.r * 0.65} transform={`rotate(${s.a + 90} ${s.c[0]} ${s.c[1]})`} fill={PALE} stroke={ORANGE} strokeWidth={1.2} opacity={0.92} />
        ))}
      </Part>
      <Part id="bihotz-goragunea">
        {ell(heart, { fill: 'url(#w5e-heart)' })}
        <path
          d={`M${heart[0] - heart[2] * 0.85},${heart[1] - heart[3] * 0.1} Q${heart[0]},${heart[1] + heart[3] * 0.25} ${heart[0] + heart[2] * 0.8},${heart[1] - heart[3] * 0.25}`}
          fill="none"
          stroke={RIM}
          strokeWidth={1.6}
          opacity={0.55}
        />
      </Part>
      {atrium > 0.02 && (
        <Part id="ezkerreko-aurikula" show={atrium}>
          <ellipse cx={g.atrium[0]} cy={g.atrium[1]} rx={12} ry={10} fill="#fff4ee" opacity={0.75} />
        </Part>
      )}
      <Part id="faringe-arkuak">
        {g.bars.map((b, i) => (
          <path key={i} d={bar(b.top, b.bot, b.w / 2 - 3, b.w / 2.4 - 3)} fill={PALE} opacity={0.55} />
        ))}
      </Part>
      <Part id="arrialdura-brankialak">
        {g.bars.slice(0, -1).map((b, i) => {
          const n = g.bars[i + 1];
          const t: Pt = [(b.top[0] + n.top[0]) / 2, (b.top[1] + n.top[1]) / 2 + 10];
          const u: Pt = [(b.bot[0] + n.bot[0]) / 2 + 2, (Math.min(b.bot[1], n.bot[1]) + t[1]) / 2 + 8];
          return <path key={i} d={`M${t[0]},${t[1]} Q${t[0] + 3},${(t[1] + u[1]) / 2} ${u[0]},${u[1]}`} fill="none" stroke={SKIN.ink} strokeWidth={2} strokeLinecap="round" opacity={0.6} />;
        })}
      </Part>
      {sinus > 0.02 && (
        <Part id="lepoko-sinua" show={sinus}>
          {(() => {
            const b = g.bars[g.bars.length - 1];
            const c: Pt = [b.top[0] + 16, b.top[1] + g.archLen[3] * 0.5];
            return <path d={`M${c[0] - 4},${c[1] - 16} q12,16 0,32`} fill="none" stroke={SKIN.ink} strokeWidth={3} strokeLinecap="round" opacity={0.55} />;
          })()}
        </Part>
      )}
      <Part id="goiko-gorputz-adarraren-hasikina">
        {ell([g.arm[0], g.arm[1], g.arm[2] * 0.8, g.arm[3] * 0.82, g.arm[4]], { fill: PALE, opacity: 0.7 })}
      </Part>
      <Part id="beheko-gorputz-adarraren-hasikina">
        {ell([g.leg[0], g.leg[1], g.leg[2] * 0.8, g.leg[3] * 0.8, 0], { fill: PALE, opacity: 0.7 })}
      </Part>
      <Part id="zilborrestea">
        <ellipse cx={g.cordTip[0]} cy={g.cordTip[1]} rx={cordW * 0.35} ry={cordW * 0.95} transform={`rotate(${(Math.atan2(g.cordTip[1] - g.cordRoot[1], g.cordTip[0] - g.cordRoot[0]) * 180) / Math.PI} ${g.cordTip[0]} ${g.cordTip[1]})`} fill={ORANGE} stroke={RIM} strokeWidth={1.2} opacity={0.85} />
      </Part>
      <Part id="goragune-kaudala">
        <circle cx={g.tail[0]} cy={g.tail[1]} r={6} fill="rgba(255,255,255,0.001)" />
      </Part>

      {/* Head: lens placode → lens pit, nasal placode, otic placode */}
      {lensPlate > 0.02 && (
        <Part id="kristalinoaren-plaka" show={lensPlate}>
          <circle cx={g.eye[0]} cy={g.eye[1]} r={9} fill={PALE} stroke={RIM} strokeWidth={1.2} />
        </Part>
      )}
      {lensPit > 0.02 && (
        <Part id="kristalinoaren-hobitxoa" show={lensPit}>
          <circle cx={g.eye[0]} cy={g.eye[1]} r={10} fill={PALE} stroke={RIM} strokeWidth={1.2} />
          <circle cx={g.eye[0] + 1} cy={g.eye[1] + 1} r={4.5} fill={RIM} />
        </Part>
      )}
      {nasal > 0.02 && (
        <Part id="sudur-plaka" show={nasal}>
          <ellipse cx={g.nose[0]} cy={g.nose[1]} rx={8} ry={11} transform={`rotate(25 ${g.nose[0]} ${g.nose[1]})`} fill={PALE} stroke={RIM} strokeWidth={1.1} />
        </Part>
      )}
      {otic > 0.02 && (
        <Part id="entzumen-plaka" show={otic}>
          <ellipse cx={g.ear[0]} cy={g.ear[1]} rx={9} ry={8} fill={PALE} stroke={RIM} strokeWidth={1} opacity={0.85} />
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

export type EarlyGeom = ReturnType<typeof earlyGeom>;
