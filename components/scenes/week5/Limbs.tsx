'use client';

import { useId } from 'react';
import { Label, Mark, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, PlateMask, SKIN, SkinDefs, limbGeom, ramp, type LimbGeom } from './skin';

/**
 * Stage `gorputz-adarrak` — upper and lower limb side by side on the same day, so the 1–2 day
 * delay of the lower limb is visible at every moment. Bud → 1st constriction (proximal/distal)
 * → hand/foot plate with 4 grooves → digital rays → 2nd constriction (3 segments, joints).
 * Each limb grows out of a strip of body wall; a day ruler under the limbs keeps the timing
 * (1st constriction ≈ day 42, 2nd ≈ day 48) and the lag of the lower limb in sight.
 */

// Development index per day (same scale as the whole-embryo scenes).
const DEV_ARM: [number, number][] = [[28, 0.75], [32, 1.1], [42, 2.25], [48, 3.25], [56, 4]];
const DEV_LEG: [number, number][] = [[28, 0.25], [32, 0.9], [42, 1.9], [48, 2.9], [56, 3.9]];
const devAt = (tab: [number, number][], day: number) => {
  if (day <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) if (day <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], (day - tab[i][0]) / (tab[i + 1][0] - tab[i][0]));
  return tab[tab.length - 1][1];
};
/** Day on which the upper limb had the development the lower limb has today (for the lag read-out). */
const armDayFor = (dev: number) => {
  for (let i = 0; i < DEV_ARM.length - 1; i++) {
    const [d0, v0] = DEV_ARM[i];
    const [d1, v1] = DEV_ARM[i + 1];
    if (dev <= v1) return lerp(d0, d1, Math.max(0, (dev - v0) / (v1 - v0)));
  }
  return 56;
};

// Stage time → day (beats: 0 bud, .18 1st constriction, .34 plates, .5 rays, .66 2nd constriction, .84 joints).
// The ruler reads 42 at the first-constriction step and ~48-49 when the second constriction is shown, as in the notes.
const DAYS: [number, number][] = [[0, 29], [0.16, 38], [0.3, 42], [0.46, 44], [0.62, 46.5], [0.8, 48.6], [1, 56]];
const dayAt = (t: number) => {
  for (let i = 0; i < DAYS.length - 1; i++) if (t <= DAYS[i + 1][0]) return lerp(DAYS[i][1], DAYS[i + 1][1], seg(t, DAYS[i][0], DAYS[i + 1][0], (k) => k));
  return 56;
};

const ARM_ROOT: Pt = [350, 142];
const LEG_ROOT: Pt = [650, 142];
const LEN = 300;

const mid = (a: Pt, b: Pt, k = 0.5): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/** A strip of the body wall the limb grows from: lit like skin toward its free edge, fading out upward and to both sides. */
function Wall({ sk, root }: { sk: string; root: Pt }) {
  const [x, y] = root;
  const W = 138;
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
const spanX = (a: Pt, b: Pt, side: number, g: LimbGeom) => {
  // Beside the widest part of the limb between a and b, never out into the label column.
  const xs = [a[0], b[0]];
  const ext = side < 0 ? Math.min(...xs) - g.w * 0.75 : Math.max(...xs) + g.w * 0.75;
  return side < 0 ? Math.max(ext, SPAN_MIN) : Math.min(ext, SPAN_MAX);
};

/** Bracket beside a segment (proximal / distal, arm / forearm / hand…). */
function Span({ id, a, b, side, show, g }: { id: string; a: Pt; b: Pt; side: number; show: number; g: LimbGeom }) {
  if (show < 0.02) return null;
  const x = spanX(a, b, side, g);
  const y0 = Math.min(a[1], b[1]) + 3;
  const y1 = Math.max(a[1], b[1]) - 3;
  return (
    <Part id={id} show={show}>
      <path d={`M${x - side * 8},${y0} L${x},${y0} L${x},${y1} L${x - side * 8},${y1}`} fill="none" stroke="#2a2724" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M${x - side * 8},${y0} L${x},${y0} L${x},${y1} L${x - side * 8},${y1}`} fill="none" stroke="#cfc8bc" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </Part>
  );
}

// Day ruler under the limbs.
const R0 = 250;
const R1 = 750;
const RY = 566;
const rx = (d: number) => R0 + ((d - 28) / 28) * (R1 - R0);

function DayRuler({ day, lagDay, lag }: { day: number; lagDay: number; lag: number }) {
  const x = rx(day);
  return (
    <g pointerEvents="none">
      <path d={`M${R0},${RY} L${R1},${RY}`} stroke="#3b3833" strokeWidth={4} strokeLinecap="round" />
      <path d={`M${R0},${RY} L${x},${RY}`} stroke="#ffb86b" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      {Array.from({ length: 15 }, (_, i) => 28 + i * 2).map((d) => (
        <path key={d} d={`M${rx(d)},${RY + 5} L${rx(d)},${RY + (d % 4 === 0 ? 10 : 8)}`} stroke="#6f6a62" strokeWidth={1} />
      ))}
      {[28, 32, 36, 52, 56].map((d) => (
        <text key={d} x={rx(d)} y={RY + 22} textAnchor="middle" fill="#7c7870" fontSize={10.5} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {d}
        </text>
      ))}
      {/* The two constrictions, as in the notes. */}
      {[
        [42, '1. ertzadura'],
        [48, '2. ertzadura'],
      ].map(([d, s]) => {
        const reached = day >= (d as number) - 0.2;
        return (
          <g key={d}>
            <path d={`M${rx(d as number)},${RY - 6} L${rx(d as number)},${RY + 10}`} stroke={reached ? '#ffb86b' : '#8a857c'} strokeWidth={1.6} />
            <text x={rx(d as number)} y={RY + 22} textAnchor="middle" fill={reached ? '#ffd7a8' : '#a9a397'} fontSize={10.5} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {`${d} · ${s}`}
            </text>
          </g>
        );
      })}
      {/* Lag of the lower limb: it looks like the upper limb did 1–2 days earlier. */}
      {lag > 0.02 && (
        <g opacity={lag}>
          <path d={`M${rx(lagDay)},${RY} L${x},${RY}`} stroke="#ff8f70" strokeWidth={8} strokeLinecap="round" opacity={0.45} />
          <circle cx={rx(lagDay)} cy={RY} r={4.5} fill="#ff8f70" />
        </g>
      )}
      <circle cx={x} cy={RY} r={6.5} fill="#ffb86b" stroke="#1b1916" strokeWidth={2} />
    </g>
  );
}

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
  const segs2 = two(t, 0.18, 0.66) * ertz1;
  const segs3 = two(t, 0.66) * ertz2;
  const joints = two(t, 0.84);
  const digits = two(t, 0.9);
  const armPlate = ramp(day, 38, 41);
  const legPlate = ramp(day, 39.5, 42.5);
  const lagDay = armDayFor(devLeg);
  const handLow = Math.max(A.tip[1], A.palm[1] + arm.plateR);
  const footLow = Math.max(L.tip[1], L.palm[1] + leg.plateR);

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
      </defs>

      <text x={350} y={52} textAnchor="middle" fill="#b4afa6" fontSize={12} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
        Goiko gorputz-adarra
      </text>
      <text x={650} y={52} textAnchor="middle" fill="#b4afa6" fontSize={12} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
        Beheko gorputz-adarra
      </text>
      <line x1={500} y1={70} x2={500} y2={540} stroke="rgba(255,255,255,0.07)" />

      <Wall sk={sk} root={ARM_ROOT} />
      <Wall sk={sk} root={LEG_ROOT} />
      <Limb sk={sk} pid={`${sk}-arm`} g={arm} id="goiko-gorputz-adarraren-hasikina" plateId="esku-plaka" plate={armPlate} />
      <Limb sk={sk} pid={`${sk}-leg`} g={leg} id="beheko-gorputz-adarraren-hasikina" plateId="oin-plaka" plate={legPlate} />

      {/* First constriction: proximal vs distal (days ~38–48) — a soft light where the limb narrows. */}
      <Mark id="ertzadura" x={A.dist[0]} y={A.dist[1]} rx={arm.w * 0.32} show={segs2} />
      <Mark id="ertzadura" x={L.dist[0]} y={L.dist[1]} rx={leg.w * 0.32} show={segs2} />
      <Span id="segmentu-proximala" a={A.prox} b={A.dist} side={-1} show={segs2} g={arm} />
      <Span id="segmentu-distala" a={A.dist} b={[A.tip[0], handLow]} side={-1} show={segs2} g={arm} />

      {/* Second constriction: three segments and their joints. */}
      <Span id="besoa" a={A.prox} b={A.mid} side={-1} show={segs3} g={arm} />
      <Span id="besaurrea" a={A.mid} b={A.dist} side={-1} show={segs3} g={arm} />
      <Span id="eskua" a={A.dist} b={[A.tip[0], handLow]} side={-1} show={segs3} g={arm} />
      <Span id="izterra" a={L.prox} b={L.mid} side={1} show={segs3} g={leg} />
      <Span id="berna" a={L.mid} b={L.dist} side={1} show={segs3} g={leg} />
      <Span id="oina" a={L.dist} b={[L.tip[0], footLow]} side={1} show={segs3} g={leg} />
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

      <DayRuler day={day} lagDay={lagDay} lag={joints} />
      <Note x={rx(lagDay) - 12} y={RY - 16} align="end" tone="warn" size={12.5} show={joints * seg(t, 0.87, 0.89)}>
        Behekoa 1–2 egun atzeratuta
      </Note>

      {/* Labels: upper limb in the left gutter, lower limb in the right one. */}
      <Label id="goiko-gorputz-adarraren-hasikina" x={350} y={A.tip[1] + 46} align="middle" ax={A.tip[0]} ay={A.tip[1] - 8} show={two(t, 0, 0.18)} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={650} y={L.tip[1] + 74} align="middle" ax={L.tip[0]} ay={L.tip[1] - 8} show={two(t, 0, 0.18)} />
      <Label id="segmentu-proximala" x={176} y={mid(A.prox, A.dist)[1]} ax={spanX(A.prox, A.dist, -1, arm)} ay={mid(A.prox, A.dist)[1]} show={segs2} />
      <Label id="segmentu-distala" x={176} y={mid(A.dist, [A.tip[0], handLow])[1] - 14} ax={spanX(A.dist, A.tip, -1, arm)} ay={mid(A.dist, [A.tip[0], handLow])[1]} show={segs2} />
      <Label id="ertzadura" x={828} y={L.dist[1] - 40} ax={L.dist[0] + leg.w * 0.3} ay={L.dist[1]} show={segs2} />
      <Label id="esku-plaka" x={176} y={handLow + 6} ax={A.palm[0] - arm.plateR * 0.5} ay={A.palm[1] + arm.plateR * 0.35} show={two(t, 0.34, 0.66)} />
      <Label id="oin-plaka" x={828} y={footLow + 6} ax={L.palm[0] + leg.plateR * 0.5} ay={L.palm[1] + leg.plateR * 0.35} show={two(t, 0.34, 0.66)} />
      <Label id="hatzetako-izpiak" x={176} y={handLow + 40} ax={arm.rays[1][1][0]} ay={arm.rays[1][1][1]} show={two(t, 0.5, 0.84)} />
      <Label id="izpiarteko-ildoak" x={828} y={footLow + 40} ax={leg.grooves[2][1][0]} ay={leg.grooves[2][1][1]} show={two(t, 0.5, 0.84)} />
      <Label id="besoa" x={176} y={mid(A.prox, A.mid)[1]} ax={spanX(A.prox, A.mid, -1, arm)} ay={mid(A.prox, A.mid)[1]} show={segs3} />
      <Label id="ukondoa" x={176} y={A.mid[1]} ax={A.mid[0] - 4} ay={A.mid[1]} show={joints} />
      <Label id="besaurrea" x={176} y={mid(A.mid, A.dist)[1]} ax={spanX(A.mid, A.dist, -1, arm)} ay={mid(A.mid, A.dist)[1]} show={segs3} />
      <Label id="eskumuturra" x={176} y={A.dist[1] + 6} ax={A.dist[0] - 4} ay={A.dist[1]} show={joints} />
      <Label id="eskua" x={176} y={mid(A.dist, [A.tip[0], handLow])[1] + 8} ax={spanX(A.dist, A.tip, -1, arm)} ay={mid(A.dist, [A.tip[0], handLow])[1] + 8} show={segs3} />
      <Label id="atzamarrak" x={176} y={handLow + 22} ax={arm.digits[1][1][0]} ay={arm.digits[1][1][1]} show={digits} />
      <Label id="izterra" x={828} y={mid(L.prox, L.mid)[1]} ax={spanX(L.prox, L.mid, 1, leg)} ay={mid(L.prox, L.mid)[1]} show={segs3} />
      <Label id="belauna" x={828} y={L.mid[1]} ax={L.mid[0] + 4} ay={L.mid[1]} show={joints} />
      <Label id="berna" x={828} y={mid(L.mid, L.dist)[1]} ax={spanX(L.mid, L.dist, 1, leg)} ay={mid(L.mid, L.dist)[1]} show={segs3} />
      <Label id="orkatila" x={828} y={L.dist[1] + 6} ax={L.dist[0] + 4} ay={L.dist[1]} show={joints} />
      <Label id="oina" x={828} y={mid(L.dist, [L.tip[0], footLow])[1] + 8} ax={spanX(L.dist, L.tip, 1, leg)} ay={mid(L.dist, [L.tip[0], footLow])[1] + 8} show={segs3} />
      <Label id="behatzak" x={828} y={footLow + 22} ax={leg.digits[3][1][0]} ay={leg.digits[3][1][1]} show={digits} />

      <AgeHud value={Math.round(day)} unit=". eguna" caption="Adina" />
    </g>
  );
}
