'use client';

import { useId } from 'react';
import { Label, Mark, Note, Part, clamp, lerp, seg, zoom, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, PlateMask, SKIN, SkinDefs, limbGeom, ramp, type LimbGeom } from './skin';

/**
 * Stage `gorputz-adarrak` — upper and lower limb side by side on the same day, so the 1–2 day
 * delay of the lower limb is visible at every moment. Bud → 1st constriction (proximal/distal)
 * → hand/foot plate with 4 grooves → digital rays → 2nd constriction (3 segments, joints).
 * Each limb grows out of a strip of body wall. The camera follows the growth (close on the small buds,
 * pulling back as the limbs lengthen) and pushes in on the hand and foot plates for the plate, ray and
 * groove steps. Under the limbs a milestone trail keeps the whole sequence of the notes in sight
 * (hasikina → 1. ertzadura → esku plaka → hatzetako izpiak → izpiarteko ildoak → 2. ertzadura →
 * atzamarrak): each stage of the upper limb is left behind as a small figure when it is reached, and two
 * markers on its axis show how far each limb has got (the lower one 1–2 days behind).
 */

// Development index per day (same scale as the whole-embryo scenes).
const DEV_ARM: [number, number][] = [[28, 0.75], [32, 1.1], [42, 2.25], [48, 3.25], [56, 4]];
const DEV_LEG: [number, number][] = [[28, 0.25], [32, 0.9], [42, 1.9], [48, 2.9], [56, 3.9]];
const devAt = (tab: [number, number][], day: number) => {
  if (day <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) if (day <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], (day - tab[i][0]) / (tab[i + 1][0] - tab[i][0]));
  return tab[tab.length - 1][1];
};
// Stage time → day (beats: 0 bud, .18 1st constriction, .34 plates, .5 rays, .66 2nd constriction, .84 joints).
// The ruler reads 42 at the first-constriction step and ~48-49 when the second constriction is shown, as in the notes.
const DAYS: [number, number][] = [[0, 29], [0.16, 38], [0.3, 42], [0.46, 44], [0.62, 46.5], [0.8, 48.6], [1, 56]];
const dayAt = (t: number) => {
  for (let i = 0; i < DAYS.length - 1; i++) if (t <= DAYS[i + 1][0]) return lerp(DAYS[i][1], DAYS[i + 1][1], seg(t, DAYS[i][0], DAYS[i + 1][0], (k) => k));
  return 56;
};

const ARM_ROOT: Pt = [375, 112];
const LEG_ROOT: Pt = [625, 112];
const LEN = 300;
/** Lowest screen row the limbs may use: the milestone trail lives below it. */
const STAGE_BOTTOM = 462;

/** A strip of the body wall the limb grows from: lit like skin toward its free edge, fading out upward and to both sides. */
function Wall({ sk, root }: { sk: string; root: Pt }) {
  const [x, y] = root;
  const W = 118;
  const edge = `M${x - W},${y - 24} C${x - W * 0.62},${y - 5} ${x - W * 0.34},${y + 4} ${x},${y + 4} C${x + W * 0.34},${y + 4} ${x + W * 0.62},${y - 5} ${x + W},${y - 24}`;
  return (
    <g mask={`url(#${sk}-wallfade)`} pointerEvents="none">
      <path d={`M${x - W},${y - 78} L${x - W},${y - 24} ${edge.slice(edge.indexOf('C'))} L${x + W},${y - 78} Z`} fill={`url(#${sk}-wallskin)`} />
      {/* Its free edge: a soft contour, and a rim of light just inside it. */}
      <path d={edge} fill="none" stroke="#3a1512" strokeWidth={2.4} opacity={0.6} />
      <path d={edge} transform="translate(0,-3)" fill="none" stroke="#fff3ec" strokeWidth={2} opacity={0.4} />
    </g>
  );
}

function Limb({ sk, pid, g, id, plateId, plate }: { sk: string; pid: string; g: LimbGeom; id: string; plateId: string; plate: number }) {
  const [rx, ry] = g.joints.prox;
  const rayW = Math.max(3, g.plateR * 0.1);
  return (
    <g>
      <defs>
        {/* Each limb lit from its own upper left, so both read alike side by side. */}
        <radialGradient id={`${pid}-skin`} gradientUnits="userSpaceOnUse" cx={rx - 70} cy={ry - 20} r={460}>
          <stop offset="0" stopColor="#f9dccf" />
          <stop offset="0.55" stopColor="#eba897" />
          <stop offset="1" stopColor="#c9786b" />
        </radialGradient>
        <radialGradient id={`${pid}-fade`} gradientUnits="userSpaceOnUse" cx={rx} cy={ry} r={g.w * 1.1}>
          <stop offset="0.38" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id={`${pid}-root`} maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
          <rect x="-1000" y="-1000" width="3000" height="3000" fill={`url(#${pid}-fade)`} />
        </mask>
        <PlateMask id={`${pid}-marks`} g={g} inset={rayW / 2 + 3} />
      </defs>
      {/* Contour first (melting into the wall at the root), then the lit skin over it. */}
      <g fill="none" stroke="#3a1512" strokeOpacity={0.75} strokeLinecap="round" mask={`url(#${pid}-root)`} pointerEvents="none">
        <path d={g.body} strokeWidth={2.6} />
        {g.hand && <path d={g.hand} strokeWidth={2.6} />}
        {g.digitA > 0.02 && g.digits.map(([a, b], i) => <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} strokeWidth={g.digitW + 2.6} strokeOpacity={0.75 * g.digitA} />)}
      </g>
      <g filter={`url(#${sk}-soft)`} fill={`url(#${pid}-skin)`} pointerEvents="none">
        <path d={g.body} />
        {g.hand && <path d={g.hand} />}
        {g.digitA > 0.02 && (
          <g stroke={`url(#${pid}-skin)`} strokeWidth={g.digitW} strokeLinecap="round">
            {g.digits.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} />
            ))}
          </g>
        )}
      </g>
      <Part id={id} show={1 - plate * 0.999}>
        <path d={g.body} fill="rgba(255,255,255,0.001)" />
      </Part>
      {g.hand && (
        <Part id={plateId} show={plate}>
          <path d={g.hand} fill="rgba(255,255,255,0.001)" />
        </Part>
      )}
      {/* Rays: pale condensations fanning through the plate; grooves: shallow furrows between them. */}
      <g mask={`url(#${pid}-marks)`}>
        {g.rayA > 0.02 && (
          <Part id="hatzetako-izpiak" show={g.rayA}>
            {g.rays.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke="#fff3ec" strokeWidth={rayW} strokeLinecap="round" opacity={0.6} />
            ))}
          </Part>
        )}
        {g.grooveA > 0.02 && (
          <Part id="izpiarteko-ildoak" show={g.grooveA}>
            {g.grooves.map(([a, b], i) => (
              <g key={i}>
                <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.line} strokeWidth={4} strokeLinecap="round" opacity={0.25} />
                <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.line} strokeWidth={1.8} strokeLinecap="round" />
              </g>
            ))}
          </Part>
        )}
      </g>
    </g>
  );
}

const SPAN_MIN = 200;
const SPAN_MAX = 800;
/** x of a bracket beside the widest part of the limb between a and b (screen points; `hw` = screen offset). */
const spanX = (a: Pt, b: Pt, side: number, hw: number) => {
  const xs = [a[0], b[0]];
  const ext = side < 0 ? Math.min(...xs) - hw : Math.max(...xs) + hw;
  return side < 0 ? Math.max(ext, SPAN_MIN) : Math.min(ext, SPAN_MAX);
};

/** Bracket beside a segment (proximal / distal, arm / forearm / hand…), in screen space so it keeps its weight. */
function Span({ id, a, b, side, show, hw }: { id: string; a: Pt; b: Pt; side: number; show: number; hw: number }) {
  if (show < 0.02) return null;
  const x = spanX(a, b, side, hw);
  const y0 = Math.min(a[1], b[1]) + 3;
  const y1 = Math.max(a[1], b[1]) - 3;
  return (
    <Part id={id} show={show}>
      <path d={`M${x - side * 8},${y0} L${x},${y0} L${x},${y1} L${x - side * 8},${y1}`} fill="none" stroke="#2a2724" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M${x - side * 8},${y0} L${x},${y0} L${x},${y1} L${x - side * 8},${y1}`} fill="none" stroke="#cfc8bc" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </Part>
  );
}

// Milestone trail: the stages of the notes' prose, each reached at the arm development (`dev`) of the step
// that names it (week5.ts beats .18, .34, .5, .66, .84); the constrictions carry their days (42, 48).
const STATIONS: { dev: number; name: string[]; day?: number }[] = [
  { dev: 1.0, name: ['Hasikina'] },
  { dev: 2.25, name: ['1. ertzadura'], day: 42 },
  { dev: 2.4, name: ['Esku plaka'] },
  { dev: 2.65, name: ['Hatzetako', 'izpiak'] },
  { dev: 2.9, name: ['Izpiarteko', 'ildoak'] },
  { dev: 3.25, name: ['2. ertzadura'], day: 48 },
  { dev: 3.6, name: ['Atzamarrak'] },
];
const TX0 = 236;
const TX1 = 764;
const TR = 494; // body-wall line the small limbs hang from
const TY = 586; // axis
const stX = (i: number) => lerp(TX0, TX1, i / (STATIONS.length - 1));
/** Position of a development value on the trail axis (between stations, linearly). */
const trailX = (dev: number) => {
  if (dev <= STATIONS[0].dev) return TX0 - (STATIONS[0].dev - dev) * 40;
  for (let i = 0; i < STATIONS.length - 1; i++) if (dev <= STATIONS[i + 1].dev) return lerp(stX(i), stX(i + 1), (dev - STATIONS[i].dev) / (STATIONS[i + 1].dev - STATIONS[i].dev));
  return TX1;
};

/** One stage of the upper limb, small: contour, flat lit fill, rays and grooves (no filters). */
function Thumb({ sk, x, dev, op }: { sk: string; x: number; dev: number; op: number }) {
  const g = limbGeom({ root: [x, TR], a: [90, 112, 102], len: 56, dev, w: 22 });
  return (
    <g opacity={op} pointerEvents="none">
      <path d={`M${x - 24},${TR - 1} Q${x},${TR + 3} ${x + 24},${TR - 1}`} fill="none" stroke="#d98d7e" strokeWidth={3.5} strokeLinecap="round" opacity={0.55} />
      <g fill="none" stroke="#3a1512" strokeOpacity={0.8} strokeLinecap="round">
        <path d={g.body} strokeWidth={1.8} />
        {g.hand && <path d={g.hand} strokeWidth={1.8} />}
        {g.digitA > 0.02 && g.digits.map(([a, b], i) => <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} strokeWidth={g.digitW + 1.8} strokeOpacity={0.8 * g.digitA} />)}
      </g>
      <g fill={`url(#${sk}-th)`}>
        <path d={g.body} />
        {g.hand && <path d={g.hand} />}
      </g>
      {g.digitA > 0.02 && (
        <g stroke="#eeb2a2" strokeWidth={g.digitW} strokeLinecap="round">
          {g.digits.map(([a, b], i) => (
            <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} />
          ))}
        </g>
      )}
      {g.rayA > 0.02 && g.rays.map(([a, b], i) => <path key={`r${i}`} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke="#fff6f0" strokeWidth={1.5} strokeLinecap="round" opacity={0.75 * g.rayA} />)}
      {g.grooveA > 0.02 && g.grooves.map(([a, b], i) => <path key={`g${i}`} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.line} strokeWidth={1.2} strokeLinecap="round" opacity={g.grooveA} />)}
    </g>
  );
}

function Trail({ sk, devArm, devLeg, lag }: { sk: string; devArm: number; devLeg: number; lag: number }) {
  const ax = trailX(devArm);
  const lx = trailX(devLeg);
  let cur = -1;
  STATIONS.forEach((st, i) => {
    if (devArm >= st.dev - 0.02) cur = i;
  });
  return (
    <g pointerEvents="none">
      {STATIONS.map((st, i) => {
        // A short reveal right at the station, so no held frame shows a half-faded figure.
        const reached = clamp((devArm - (st.dev - 0.03)) / 0.03);
        const x = stX(i);
        const isCur = i === cur;
        return (
          <g key={i}>
            {reached > 0.01 && <Thumb sk={sk} x={x} dev={st.dev} op={reached * (isCur ? 1 : 0.85)} />}
            <circle cx={x} cy={TY} r={isCur ? 4 : 3} fill={reached > 0.5 ? '#ffb86b' : '#4a4640'} />
            {st.name.map((w, k) => (
              <text key={k} x={x} y={TY + 18 + k * 12} textAnchor="middle" fontSize={11} fontWeight={isCur ? 700 : 600} fill={isCur ? '#ffd7a8' : reached > 0.5 ? '#bdb7ad' : '#5d5952'}>
                {w}
              </text>
            ))}
            {st.day && (
              <text x={x} y={TY + 30} textAnchor="middle" fontSize={10} fill={reached > 0.5 ? '#e7a868' : '#5d5952'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {`${st.day}. eguna`}
              </text>
            )}
          </g>
        );
      })}
      <path d={`M${TX0 - 30},${TY} L${TX1},${TY}`} stroke="#3b3833" strokeWidth={3} strokeLinecap="round" />
      <path d={`M${TX0 - 30},${TY} L${ax},${TY}`} stroke="#ffb86b" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      {/* The lower limb's marker trails the upper one's: the lag the notes give (1–2 days). */}
      {lag > 0.02 && <path d={`M${lx},${TY} L${ax},${TY}`} stroke="#ff8f70" strokeWidth={8} strokeLinecap="round" opacity={0.45 * lag} />}
      <circle cx={lx} cy={TY} r={5} fill="#ff8f70" stroke="#1b1916" strokeWidth={1.6} />
      <circle cx={ax} cy={TY} r={6.5} fill="#ffb86b" stroke="#1b1916" strokeWidth={2} />
    </g>
  );
}

/** A name fades away when the camera moves its anchor out of the picture. */
const inFrame = (p: Pt) => {
  const d = Math.max(30 - p[0], p[0] - 970, 34 - p[1], p[1] - STAGE_BOTTOM - 20, 0);
  return 1 - Math.min(1, d / 24);
};

export function LimbDevelopment({ t }: SceneProps) {
  const sk = 'w5l' + useId().replace(/[^A-Za-z0-9_-]/g, '');
  const day = dayAt(t);
  const devArm = devAt(DEV_ARM, day);
  const devLeg = devAt(DEV_LEG, day);
  const arm = limbGeom({ root: ARM_ROOT, a: [90, 112, 102], len: LEN, dev: devArm, w: 98 });
  const leg = limbGeom({ root: LEG_ROOT, a: [90, 70, 64], len: LEN, dev: devLeg, w: 104, toes: true });
  const two = (tt: number, a: number, b = 2) => Math.min(seg(tt, a, a + 0.03), 1 - seg(tt, b - 0.03, b));
  const ertz1 = ramp(day, 38, 42);
  const ertz2 = ramp(day, 46, 49);
  const A = arm.joints;
  const L = leg.joints;
  const armPlate = ramp(day, 38, 41);
  const legPlate = ramp(day, 39.5, 42.5);
  const handLow = Math.max(A.tip[1], A.palm[1] + arm.plateR);
  const footLow = Math.max(L.tip[1], L.palm[1] + leg.plateR);

  // Camera. Fit: the limbs fill the stage above the trail (close on the small buds, back as they grow),
  // centred in it while they are short. Push: on the hand and foot plates for the plate, ray and groove
  // steps (.34–.66).
  const top = ARM_ROOT[1] - 40;
  const low = Math.max(handLow, footLow) + 6;
  const room = STAGE_BOTTOM - 46;
  const sFit = clamp(room / (low - top), 0.95, 1.55);
  const tyFit = 46 + Math.max(0, (room - (low - top) * sFit) / 2);
  const push = seg(t, 0.34, 0.38) * (1 - seg(t, 0.66, 0.7));
  const palmMid: Pt = [(A.palm[0] + L.palm[0]) / 2, (A.palm[1] + L.palm[1]) / 2];
  const z = zoom(lerp(500, palmMid[0], push), lerp(top, palmMid[1], push), lerp(sFit, 1.32, push), 500, lerp(tyFit, 270, push));
  const s = lerp(sFit, 1.32, push);
  const Z = (p: readonly number[]): Pt => z.at(p[0], p[1]);

  // Names and brackets of the first constriction leave while the camera is on the plates.
  const segs2 = two(t, 0.18, 0.66) * ertz1 * (1 - push);
  const segs3 = two(t, 0.66) * ertz2;
  const joints = two(t, 0.84);
  const digits = two(t, 0.9);
  const hwA = arm.w * 0.75 * s;
  const hwL = leg.w * 0.75 * s;
  const hand: Pt = [A.tip[0], handLow];
  const foot: Pt = [L.tip[0], footLow];
  const [zA, zL] = [
    { prox: Z(A.prox), mid: Z(A.mid), dist: Z(A.dist), end: Z(hand) },
    { prox: Z(L.prox), mid: Z(L.mid), dist: Z(L.dist), end: Z(foot) },
  ];
  const m = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  /** Label with its anchor given in scene coordinates (mapped through the camera, faded when it leaves the picture). */
  const N = (id: string, x: number, y: number, p: readonly number[], show: number, align?: 'middle') => {
    const q = Z(p);
    return <Label id={id} x={x} y={y} ax={q[0]} ay={q[1]} align={align} show={show * inFrame(q)} />;
  };
  /** Label pointing at a bracket (screen anchor). */
  const B = (id: string, x: number, y: number, ax: number, show: number) => <Label id={id} x={x} y={y} ax={ax} ay={y} show={show} />;

  return (
    <g>
      <SkinDefs id={sk} cx={300} cy={60} r={620} />
      <defs>
        <linearGradient id={`${sk}-wallgrad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.24" stopColor="#fff" />
          <stop offset="0.76" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <linearGradient id={`${sk}-wallskin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9786b" stopOpacity="0" />
          <stop offset="0.45" stopColor="#d98d7e" stopOpacity="0.85" />
          <stop offset="0.85" stopColor="#efb4a4" />
          <stop offset="1" stopColor="#f6cdbf" />
        </linearGradient>
        <mask id={`${sk}-wallfade`} maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill={`url(#${sk}-wallgrad)`} />
        </mask>
        {/* The stage under the titles and above the trail: the camera's picture is cut to it. */}
        <clipPath id={`${sk}-stage`}>
          <rect x={0} y={36} width={1000} height={STAGE_BOTTOM + 14 - 36} />
        </clipPath>
        <radialGradient id={`${sk}-th`} cx="0.32" cy="0.22" r="0.95">
          <stop offset="0" stopColor="#f9dccf" />
          <stop offset="0.55" stopColor="#eba897" />
          <stop offset="1" stopColor="#c9786b" />
        </radialGradient>
      </defs>

      <text x={zA.prox[0]} y={24} textAnchor="middle" fill="#b4afa6" fontSize={12} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
        Goiko gorputz-adarra
      </text>
      <text x={zL.prox[0]} y={24} textAnchor="middle" fill="#b4afa6" fontSize={12} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
        Beheko gorputz-adarra
      </text>
      <line x1={500} y1={36} x2={500} y2={STAGE_BOTTOM} stroke="rgba(255,255,255,0.07)" />

      <g clipPath={`url(#${sk}-stage)`}>
        <g transform={z.transform}>
          <Wall sk={sk} root={ARM_ROOT} />
          <Wall sk={sk} root={LEG_ROOT} />
          <Limb sk={sk} pid={`${sk}-arm`} g={arm} id="goiko-gorputz-adarraren-hasikina" plateId="esku-plaka" plate={armPlate} />
          <Limb sk={sk} pid={`${sk}-leg`} g={leg} id="beheko-gorputz-adarraren-hasikina" plateId="oin-plaka" plate={legPlate} />
  
          {/* First constriction: proximal vs distal (days ~38–48) — a soft light where the limb narrows. */}
          <Mark id="ertzadura" x={A.dist[0]} y={A.dist[1]} rx={arm.w * 0.32} show={segs2} />
          <Mark id="ertzadura" x={L.dist[0]} y={L.dist[1]} rx={leg.w * 0.32} show={segs2} />
          <Mark id="ukondoa" x={A.mid[0]} y={A.mid[1]} rx={15} show={joints * ertz2} />
          <Mark id="eskumuturra" x={A.dist[0]} y={A.dist[1]} rx={14} show={joints} />
          <Mark id="belauna" x={L.mid[0]} y={L.mid[1]} rx={15} show={joints * ertz2} />
          <Mark id="orkatila" x={L.dist[0]} y={L.dist[1]} rx={14} show={joints} />
  
          {/* Fingers and toes: the free digits themselves light up. */}
          {digits > 0.02 && (
            <>
              <Part id="atzamarrak" show={digits}>
                {arm.digits.map(([a, b], i) => (
                  <path key={i} d={`M${lerp(a[0], b[0], 0.35)},${lerp(a[1], b[1], 0.35)} L${b[0]},${b[1]}`} stroke="#fbe0d6" strokeWidth={arm.digitW * 0.62} strokeLinecap="round" opacity={0.55 * arm.digitA} />
                ))}
              </Part>
              <Part id="behatzak" show={digits}>
                {leg.digits.map(([a, b], i) => (
                  <path key={i} d={`M${lerp(a[0], b[0], 0.35)},${lerp(a[1], b[1], 0.35)} L${b[0]},${b[1]}`} stroke="#fbe0d6" strokeWidth={leg.digitW * 0.62} strokeLinecap="round" opacity={0.55 * leg.digitA} />
                ))}
              </Part>
            </>
          )}
        </g>
      </g>

      {/* Brackets beside the segments (screen space). */}
      <Span id="segmentu-proximala" a={zA.prox} b={zA.dist} side={-1} show={segs2} hw={hwA} />
      <Span id="segmentu-distala" a={zA.dist} b={zA.end} side={-1} show={segs2} hw={hwA} />
      <Span id="besoa" a={zA.prox} b={zA.mid} side={-1} show={segs3} hw={hwA} />
      <Span id="besaurrea" a={zA.mid} b={zA.dist} side={-1} show={segs3} hw={hwA} />
      <Span id="eskua" a={zA.dist} b={zA.end} side={-1} show={segs3} hw={hwA} />
      <Span id="izterra" a={zL.prox} b={zL.mid} side={1} show={segs3} hw={hwL} />
      <Span id="berna" a={zL.mid} b={zL.dist} side={1} show={segs3} hw={hwL} />
      <Span id="oina" a={zL.dist} b={zL.end} side={1} show={segs3} hw={hwL} />

      <Trail sk={sk} devArm={devArm} devLeg={devLeg} lag={joints} />
      <Note x={TX1 + 18} y={TY + 1} align="start" tone="warn" size={12.5} show={joints * seg(t, 0.87, 0.89)}>
        Behekoa 1–2 egun atzeratuta
      </Note>

      {/* Labels: upper limb in the left gutter, lower limb in the right one. */}
      {N('goiko-gorputz-adarraren-hasikina', zA.prox[0], Math.min(Z(A.tip)[1] + 36, STAGE_BOTTOM + 4), [A.tip[0], A.tip[1] - 8], two(t, 0, 0.18), 'middle')}
      {N('beheko-gorputz-adarraren-hasikina', zL.prox[0], Math.min(Z(L.tip)[1] + 36, STAGE_BOTTOM + 4), [L.tip[0], L.tip[1] - 8], two(t, 0, 0.18), 'middle')}
      {B('segmentu-proximala', 176, m(zA.prox, zA.dist)[1], spanX(zA.prox, zA.dist, -1, hwA), segs2)}
      {B('segmentu-distala', 176, m(zA.dist, zA.end)[1], spanX(zA.dist, zA.end, -1, hwA), segs2)}
      {N('ertzadura', 828, Z(L.dist)[1] - 40, [L.dist[0] + leg.w * 0.3, L.dist[1]], segs2)}
      {N('esku-plaka', 176, zA.end[1] - 40, [A.palm[0] - arm.plateR * 0.5, A.palm[1] + arm.plateR * 0.35], two(t, 0.34, 0.66))}
      {N('oin-plaka', 828, zL.end[1] - 40, [L.palm[0] + leg.plateR * 0.5, L.palm[1] + leg.plateR * 0.35], two(t, 0.34, 0.66))}
      {N('hatzetako-izpiak', 176, zA.end[1] + 4, arm.rays[1][1], two(t, 0.5, 0.84))}
      {N('izpiarteko-ildoak', 828, zL.end[1] + 4, leg.grooves[2][1], two(t, 0.5, 0.84))}
      {B('besoa', 176, m(zA.prox, zA.mid)[1], spanX(zA.prox, zA.mid, -1, hwA), segs3)}
      {N('ukondoa', 176, zA.mid[1], [A.mid[0] - 4, A.mid[1]], joints)}
      {B('besaurrea', 176, m(zA.mid, zA.dist)[1], spanX(zA.mid, zA.dist, -1, hwA), segs3)}
      {N('eskumuturra', 176, zA.dist[1] + 6, [A.dist[0] - 4, A.dist[1]], joints)}
      {B('eskua', 176, m(zA.dist, zA.end)[1] + 8, spanX(zA.dist, zA.end, -1, hwA), segs3)}
      {N('atzamarrak', 176, zA.end[1] + 22, arm.digits[1][1], digits)}
      {B('izterra', 828, m(zL.prox, zL.mid)[1], spanX(zL.prox, zL.mid, 1, hwL), segs3)}
      {N('belauna', 828, zL.mid[1], [L.mid[0] + 4, L.mid[1]], joints)}
      {B('berna', 828, m(zL.mid, zL.dist)[1], spanX(zL.mid, zL.dist, 1, hwL), segs3)}
      {N('orkatila', 828, zL.dist[1] + 6, [L.dist[0] + 4, L.dist[1]], joints)}
      {B('oina', 828, m(zL.dist, zL.end)[1] + 8, spanX(zL.dist, zL.end, 1, hwL), segs3)}
      {N('behatzak', 828, zL.end[1] + 22, leg.digits[3][1], digits)}

      <AgeHud value={Math.round(day)} unit=". eguna" caption="Adina" />
    </g>
  );
}
