'use client';

import { clamp, lerp, lerpPt, mix, smoothPath, type Pt } from '@/components/kit';
import { interp } from './growth';
import { ramp } from './skin';

/**
 * The fetus in side view as in the course figures (A 9 · B 12 · C 20 · D 28 · E 38 astea;
 * "Bostgarren hilabetea"): facing right, curled with a convex back, the chin on the chest, a
 * hand at the mouth, the knees drawn up and the feet tucked under, the cord leaving the belly.
 * Proportions follow the week: the head shrinks relative to the body, the limbs lengthen and
 * thicken, fat rounds the body in the last two months, hair and lanugo appear from the 5th.
 *
 * Local frame: crown–rump length = 100 units, vertex at (1, 0), lowest point of the rump at
 * y = 100. `placeFetus` scales it to the length in the notes' table.
 */

export interface FetusPose {
  /** 0 rest … 1 near leg stretched forward (kick). */
  kick?: number;
  /** 0 hand in front of the chest … 1 hand at the mouth (sucking). */
  suck?: number;
  /** -1..1 chest and belly movement (breathing movements). */
  breathe?: number;
  /** Head nod, degrees (+ = chin down). */
  nod?: number;
}

const P = (c: Pt, deg: number, rx: number, ry = rx): Pt => [c[0] + Math.cos((deg * Math.PI) / 180) * rx, c[1] + Math.sin((deg * Math.PI) / 180) * ry];
const rotAbout = (p: Pt, c: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
};
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const dir = (a: Pt, b: Pt) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

/** Two-bone limb: the joint on the side chosen by `pick`, the end clamped to reach. */
function ik(a: Pt, target: Pt, l1: number, l2: number, pick: (j: Pt) => number) {
  const d = clamp(dist(a, target), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.2);
  const base = Math.atan2(target[1] - a[1], target[0] - a[0]);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const js = [base + A, base - A].map((g): Pt => [a[0] + Math.cos(g) * l1, a[1] + Math.sin(g) * l1]);
  const j = pick(js[0]) >= pick(js[1]) ? js[0] : js[1];
  const end: Pt = [a[0] + Math.cos(base) * d, a[1] + Math.sin(base) * d];
  return { a, j, end };
}

/** Tapered capsule (two circles and their hull), as a polygon. */
function capsule(a: Pt, b: Pt, wa: number, wb: number) {
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const g = th - Math.PI / 2 + (Math.PI * i) / 10;
    pts.push([b[0] + Math.cos(g) * wb, b[1] + Math.sin(g) * wb]);
  }
  for (let i = 0; i <= 10; i++) {
    const g = th + Math.PI / 2 + (Math.PI * i) / 10;
    pts.push([a[0] + Math.cos(g) * wa, a[1] + Math.sin(g) * wa]);
  }
  return `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z`;
}

// Traced from the course figures: back and front of the trunk as (x, v), v = 0 at the nape,
// 1 at the lowest point of the rump. LEAN ≈ 28 weeks (D), FULL ≈ 38 weeks (E).
const BACK_LEAN: Pt[] = [[-20, 0], [-29, 0.14], [-31.5, 0.34], [-31, 0.52], [-28, 0.7], [-21, 0.87], [-12, 0.97], [-3, 1]];
const BACK_FULL: Pt[] = [[-18, 0], [-28, 0.14], [-34, 0.32], [-35.5, 0.5], [-33, 0.68], [-26, 0.83], [-16, 0.95], [-3, 1]];
const FRONT: Pt[] = [[5, 0.97], [9, 0.84], [11, 0.66], [11, 0.48], [8, 0.28], [4, 0.1]];

export function fetusGeom(week: number, pose: FetusPose = {}) {
  const { kick = 0, suck = 1, breathe = 0, nod = 0 } = pose;
  const k = clamp((week - 9) / 29);
  const early = 1 - ramp(week, 9, 20); // 1 at 9 weeks: flat face, thin short limbs
  const fat = ramp(week, 28, 38);
  const R = interp([[9, 27], [12, 25.5], [20, 22], [28, 20.5], [38, 20]], week);
  const Hc: Pt = [1, R];
  const neckY = R * 1.55;
  const ws = lerp(1, 0.8, early); // trunk width
  const Y = (v: number) => lerp(neckY, 100, v);

  const back = BACK_LEAN.map((p, i): Pt => [lerp(p[0], BACK_FULL[i][0], fat) * ws, Y(p[1])]);
  const front = FRONT.map(([x, v], i): Pt => [(x + (i > 0 && i < 4 ? breathe * 1.1 + fat * 2 : 0)) * ws, Y(v)]);
  const trunk = [...back, ...front];

  // Head: cranium plus the face profile; `f` scales how far the face stands out.
  const f = lerp(0.45, 1, 1 - early);
  const pivot: Pt = [Hc[0] - 0.1 * R, Hc[1] + 0.85 * R];
  const turn = (p: Pt) => rotAbout(p, pivot, nod);
  const FACE: [number, number][] = [
    [4, 1.01], [20, 1.03], [34, 0.98], [42, 1.02], [50, 1.17], [56, 1.1], [62, 1.16], [66, 1.12], [70, 1.19], [75, 1.16], [82, 1.29], [94, 1.17], [110, 0.98],
  ];
  const at = (a: number, m: number) => turn(P(Hc, a, R * (1 + (m - 1) * f)));
  const head: Pt[] = [];
  for (let a = 120; a <= 350; a += 14) head.push(turn(P(Hc, a, R * 1.02, R)));
  for (const [a, m] of FACE) head.push(at(a, m));
  const eye = turn(P(Hc, 46, R * 0.7));
  const brow = turn(P(Hc, 30, R * 0.86));
  const nose = at(50, 1.15);
  const mouth = at(66, 1.08);
  const chin = at(82, 1.24);
  const ear = turn(P(Hc, 140, R * 0.36));
  const scalp = turn(P(Hc, 250, R * 0.9));
  const vertex: Pt = turn([Hc[0], 0]);

  // Limbs.
  const wA = interp([[9, 2.4], [20, 3.3], [28, 3.5], [38, 5]], week);
  const wL = interp([[9, 3], [20, 4.4], [28, 4.8], [38, 7.6]], week);
  const la = interp([[9, 11], [20, 17], [38, 20]], week);
  const lt = interp([[9, 12], [12, 15], [20, 24], [28, 27], [38, 30]], week);
  const ls = lt * 1.05;
  const shoulder: Pt = [-12 * ws, Y(0.2)];
  const hip: Pt = [-8 * ws, Y(0.74)];

  const chestFront: Pt = [12 * ws, Y(0.34)];
  const handT = lerpPt(chestFront, [mouth[0] - 1, mouth[1] + 2], suck);
  const arm = ik(shoulder, handT, la, la * 1.02, (j) => j[1]);

  const ankleRest: Pt = [lerp(4, 9, k) * ws, Y(lerp(0.9, 0.88, k))];
  const ankleKick: Pt = [hip[0] + (lt + ls) * 0.9, hip[1] - 4];
  const leg = ik(hip, lerpPt(ankleRest, ankleKick, kick), lt, ls, (j) => j[0] - j[1] * 0.3);
  // Far leg: the near one turned a little forward about the hip, so its foot peeps out in front.
  const farHip: Pt = [hip[0] + 2, hip[1] - 2];
  const fl = (p: Pt): Pt => {
    const q = rotAbout(p, hip, -16 * (1 - kick));
    return [q[0] + 2, q[1] - 2];
  };
  const farLeg = { a: farHip, j: fl(leg.j), end: fl(leg.end) };
  const farShoulder: Pt = [shoulder[0] + 4, shoulder[1] - 1];
  const farArm = ik(farShoulder, [leg.j[0] - 1, leg.j[1] - wL * 0.9], la, la * 1.02, (j) => j[1]);

  const cordBase: Pt = [front[2][0] - 1, lerp(front[1][1], front[2][1], 0.35)];
  const femur = lerpPt(hip, leg.j, 0.55);
  return {
    week, k, early, fat, R, Hc, f, turn, trunk, head, eye, brow, nose, mouth, chin, ear, scalp, vertex,
    back: back[3], nape: back[0], belly: front[2], rump: back[back.length - 1],
    wA, wL, shoulder, hip, arm, leg, farArm, farLeg, cordBase, femur,
    hand: arm.end, foot: leg.end,
  };
}

export type FetusGeom = ReturnType<typeof fetusGeom>;

/** Pink palette of the course figures; `red` = thin reddish wrinkled skin (5th–6th month). */
function FetusDefs({ id, s, red }: { id: string; s: number; red: number }) {
  const light = mix('#fbd3d6', '#f7b6bf', red);
  const midC = mix('#f09aab', '#e7788f', red);
  const deep = mix('#cf6583', '#b8466a', red);
  return (
    <defs>
      <radialGradient id={`${id}-skin`} gradientUnits="userSpaceOnUse" cx={-4} cy={30} r={95}>
        <stop offset="0" stopColor={light} />
        <stop offset="0.55" stopColor={midC} />
        <stop offset="1" stopColor={deep} />
      </radialGradient>
      <filter id={`${id}-sculpt`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius={(1 / s).toFixed(3)} result="dil" />
        <feFlood floodColor="#5a1830" floodOpacity="0.8" />
        <feComposite in2="dil" operator="in" result="edge" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="blur" />
        <feOffset in="blur" dx="1.6" dy="2" result="offA" />
        <feComposite in="SourceAlpha" in2="offA" operator="out" result="hiA" />
        <feFlood floodColor="#fff4f5" floodOpacity="0.55" />
        <feComposite in2="hiA" operator="in" result="hi" />
        <feOffset in="blur" dx="-2.2" dy="-2.6" result="offB" />
        <feComposite in="SourceAlpha" in2="offB" operator="out" result="shA" />
        <feFlood floodColor="#8a2a4e" floodOpacity="0.7" />
        <feComposite in2="shA" operator="in" result="sh" />
        <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="5" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.7  0 0 0 0 0.25  0 0 0 0 0.38  0.18 0 0 0 -0.07" result="tint" />
        <feComposite in="tint" in2="SourceAlpha" operator="in" result="mottle" />
        <feMerge>
          <feMergeNode in="edge" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="mottle" />
          <feMergeNode in="sh" />
          <feMergeNode in="hi" />
        </feMerge>
      </filter>
    </defs>
  );
}

function Hand({ g, at, from, far }: { g: FetusGeom; at: Pt; from: Pt; far?: boolean }) {
  const a = dir(from, at);
  const r = g.wA * 1.35;
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${a})`}>
      <ellipse cx={r * 0.5} cy={0} rx={r * 1.15} ry={r * 0.95} />
      {!far && <ellipse cx={r * 0.85} cy={-r * 0.55} rx={r * 0.34} ry={r * 0.2} transform={`rotate(-30 ${r * 0.95} ${-r * 0.62})`} />}
    </g>
  );
}

function Foot({ g, ankle, knee }: { g: FetusGeom; ankle: Pt; knee: Pt }) {
  // The foot leaves the ankle at ~90° to the shin, pointing forward.
  const a = dir(knee, ankle) - 95;
  const L = g.wL * 2.6;
  const w = g.wL * 0.72;
  return (
    <g transform={`translate(${ankle[0]} ${ankle[1]}) rotate(${a})`}>
      <path d={capsule([-w * 0.3, 0], [L, 0], w * 1.05, w * 0.8)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={L + w * 0.55} cy={(i - 2) * w * 0.34} r={w * (i === 0 ? 0.3 : 0.24)} />
      ))}
    </g>
  );
}

function Cord({ g }: { g: FetusGeom }) {
  const b = g.cordBase;
  const u = g.R / 20;
  const pts: Pt[] = [b, [b[0] + 8 * u, b[1] + 1], [b[0] + 15 * u, b[1] + 5 * u], [b[0] + 19 * u, b[1] + 11 * u]];
  const d = smoothPath(pts, false);
  const w = lerp(3.2, 4.6, g.k);
  const end = pts[pts.length - 1];
  return (
    <g>
      <path d={d} fill="none" stroke="#d9a6b8" strokeWidth={w} />
      <path d={d} fill="none" stroke="#9c4a6d" strokeWidth={w * 0.3} strokeDasharray={`${w * 0.9} ${w * 0.7}`} opacity={0.7} />
      <path d={d} fill="none" stroke="#6f78b8" strokeWidth={w * 0.24} strokeDasharray={`${w * 0.7} ${w * 0.9}`} strokeDashoffset={w * 0.8} opacity={0.65} />
      <ellipse cx={end[0]} cy={end[1]} rx={w * 0.5} ry={w * 0.32} transform={`rotate(${dir(pts[2], end) + 90} ${end[0]} ${end[1]})`} fill="#f3cbd6" stroke="#9c4a6d" strokeWidth={0.4} />
    </g>
  );
}

export interface FetusFigureProps {
  id: string;
  week: number;
  pose?: FetusPose;
  /** Scale the figure is drawn at (px per local unit), to keep the contour line ~1 px. */
  s: number;
  /** Physiological umbilical hernia (up to the 12th week). */
  hernia?: number;
  vernix?: number;
}

export function FetusFigure({ id, week, pose, s, hernia = 0, vernix = 0 }: FetusFigureProps) {
  const g = fetusGeom(week, pose);
  const { R, Hc, arm, leg, farArm, farLeg, turn } = g;
  const red = Math.min(ramp(week, 16, 20), 1 - ramp(week, 28, 34));
  const hair = ramp(week, 17, 38);
  const lanugo = Math.min(ramp(week, 17, 21), 1 - ramp(week, 32, 38));
  const vessels = 1 - ramp(week, 11, 15);
  const nStrands = Math.round(lerp(24, 150, hair));
  const skin = `url(#${id}-skin)`;
  const earH = R * lerp(0.2, 0.3, 1 - g.early);
  const e = g.ear;
  return (
    <g>
      <FetusDefs id={id} s={s} red={red} />
      <g filter={`url(#${id}-sculpt)`} fill={skin}>
        <path d={smoothPath(g.trunk, true, 0.5)} />
        {/* Far-side limbs, a shade darker */}
        <g style={{ filter: 'brightness(0.9)' }}>
          <path d={capsule(farLeg.a, farLeg.j, g.wL, g.wL * 0.85)} />
          <path d={capsule(farLeg.j, farLeg.end, g.wL * 0.82, g.wL * 0.55)} />
          <Foot g={g} ankle={farLeg.end} knee={farLeg.j} />
          <path d={capsule(farArm.a, farArm.j, g.wA, g.wA * 0.85)} />
          <path d={capsule(farArm.j, farArm.end, g.wA * 0.85, g.wA * 0.7)} />
          <Hand g={g} at={farArm.end} from={farArm.j} far />
        </g>
      </g>
      {/* Physiological hernia: gut loops in the base of the cord */}
      {hernia > 0.02 && (
        <g fill="#f3c4cf" stroke="#a2466a" strokeWidth={0.5} opacity={hernia}>
          <ellipse cx={g.cordBase[0] + 3} cy={g.cordBase[1] + 1} rx={4.6} ry={4} />
          <path d={`M${g.cordBase[0] + 0.5},${g.cordBase[1]} q2,-2.6 4,0 t4,0 M${g.cordBase[0] + 1},${g.cordBase[1] + 2.4} q2,-2.2 4,0`} fill="none" />
        </g>
      )}
      <Cord g={g} />
      <g filter={`url(#${id}-sculpt)`} fill={skin}>
        {/* Head over the trunk */}
        <path d={smoothPath(g.head, true, 0.5)} />
        {/* Near leg: thigh up to the chest, shin down, foot forward */}
        <path d={capsule(leg.a, leg.j, g.wL * 1.12, g.wL * 0.9)} />
        <path d={capsule(leg.j, leg.end, g.wL * 0.88, g.wL * 0.58)} />
        <Foot g={g} ankle={leg.end} knee={leg.j} />
        {/* Near arm: elbow down, hand at the mouth */}
        <path d={capsule(arm.a, arm.j, g.wA * 1.1, g.wA * 0.9)} />
        <path d={capsule(arm.j, arm.end, g.wA * 0.9, g.wA * 0.75)} />
        <Hand g={g} at={arm.end} from={arm.j} />
      </g>

      {/* Face and ear */}
      <g fill="none" stroke="#6b1f3c" strokeLinecap="round" strokeWidth={0.55} opacity={0.8}>
        <path d={`M${g.eye[0] - R * 0.13},${g.eye[1] - R * 0.02} q${R * 0.13},${R * 0.1} ${R * 0.26},${-R * 0.01}`} />
        {week >= 17 && <path d={`M${g.brow[0] - R * 0.14},${g.brow[1] - R * 0.02} q${R * 0.14},${-R * 0.07} ${R * 0.26},${R * 0.03}`} opacity={0.5 * ramp(week, 17, 22)} strokeWidth={0.9} stroke="#7a3a3a" />}
        <path d={`M${g.mouth[0] - R * 0.12},${g.mouth[1] - R * 0.01} q${R * 0.06},${R * 0.03} ${R * 0.12},0`} opacity={0.7} />
        <circle cx={g.nose[0] - R * 0.06} cy={g.nose[1] + R * 0.03} r={R * 0.022} fill="#6b1f3c" stroke="none" opacity={0.6} />
        <g opacity={0.75}>
          <path d={`M${e[0] + earH * 0.35},${e[1] - earH} C${e[0] - earH * 0.9},${e[1] - earH * 1.1} ${e[0] - earH * 0.9},${e[1] + earH * 0.9} ${e[0] + earH * 0.2},${e[1] + earH}`} strokeWidth={0.8} />
          <path d={`M${e[0] + earH * 0.15},${e[1] - earH * 0.45} c${-earH * 0.45},0 ${-earH * 0.45},${earH * 0.8} 0,${earH * 0.8}`} strokeWidth={0.5} opacity={0.6} />
        </g>
      </g>

      {/* Thin skin of the early fetus: the head's vascular network shows through */}
      {vessels > 0.02 && (
        <g stroke="#c2375c" strokeWidth={0.45} fill="none" opacity={0.5 * vessels}>
          {[200, 238, 276, 314].map((a, i) => {
            const p = turn(P(Hc, a, R * 0.92));
            const q = turn(P(Hc, a + 18, R * 0.45));
            const c = turn(P(Hc, a + 30 * (i % 2 ? 1 : -1), R * 0.75));
            return <path key={a} d={`M${p[0]},${p[1]} Q${c[0]},${c[1]} ${q[0]},${q[1]}`} />;
          })}
        </g>
      )}

      {/* Scalp hair: sparse fine strokes from the 5th month, a thick cap at term */}
      {hair > 0.02 && (
        <g pointerEvents="none">
          <path d={smoothPath(Array.from({ length: 14 }, (_, i) => turn(P(Hc, 176 + i * 13, R * (i === 0 || i === 13 ? 0.9 : 0.99)))), true, 0.5)} fill="#8a3f3a" opacity={0.22 * hair * hair} style={{ filter: `blur(${(R * 0.08).toFixed(2)}px)` }} />
          <g stroke="#8e4b3e" strokeLinecap="round" fill="none" opacity={0.25 + 0.3 * hair} strokeWidth={0.18 + 0.12 * hair}>
            {Array.from({ length: nStrands }, (_, i) => {
              const a = 184 + ((i * 137.5) % 160);
              const rr = R * (0.6 + ((i * 0.618) % 1) * 0.37);
              const L = R * lerp(0.05, 0.12, hair);
              const p = turn(P(Hc, a, rr));
              const q = turn(P(Hc, a + 5, rr - L));
              const c = turn(P(Hc, a + 2.5 + 3 * hair * (i % 2 ? 1 : -1), rr - L * 0.5));
              return <path key={i} d={`M${p[0].toFixed(2)},${p[1].toFixed(2)} Q${c[0].toFixed(2)},${c[1].toFixed(2)} ${q[0].toFixed(2)},${q[1].toFixed(2)}`} />;
            })}
          </g>
        </g>
      )}

      {/* Lanugo: fine down along the back */}
      {lanugo > 0.02 && (
        <g stroke="#fff0f3" strokeWidth={0.22} opacity={0.35 * lanugo} strokeLinecap="round">
          {Array.from({ length: 40 }, (_, i) => {
            const u = (i / 39) * 6.99;
            const n = Math.floor(u);
            const p = lerpPt(g.trunk[n], g.trunk[n + 1], u - n);
            const o = 1.6 + (i % 3) * 1.4;
            return <line key={i} x1={p[0] + o} y1={p[1]} x2={p[0] + o + 0.9} y2={p[1] - 0.9} />;
          })}
        </g>
      )}

      {/* Vernix caseosa: whitish greasy patches in the last months */}
      {vernix > 0.02 && (
        <g fill="#fffaf0" opacity={0.45 * vernix} style={{ filter: 'blur(0.6px)' }}>
          {([
            [g.trunk[2], 4.5, 2.2, 75],
            [g.trunk[4], 3.6, 1.8, 60],
            [g.trunk[6], 3.4, 1.8, 30],
            [lerpPt(leg.a, leg.j, 0.6), 3, 1.5, -30],
            [turn(P(Hc, 150, R * 0.8)), 2.8, 1.4, 20],
          ] as [Pt, number, number, number][]).map(([p, rx, ry, a], i) => {
            const x = p[0] + (i < 3 ? 2.5 : 0);
            return <ellipse key={i} cx={x} cy={p[1]} rx={rx} ry={ry} transform={`rotate(${a} ${x} ${p[1]})`} />;
          })}
        </g>
      )}
    </g>
  );
}

/**
 * Scale and place the drawing so the crown–rump length is `cm` at `pxcm` px per cm; `cx` is
 * the horizontal centre of the body, `cy` the middle of the vertex–rump line (or the lowest
 * point when `base` is set).
 */
export function placeFetus(cm: number, pxcm: number, cx: number, cy: number, base = false) {
  const s = (cm * pxcm) / 100;
  const m: Pt = [-2, base ? 100 : 50];
  const xf = (p: readonly number[]): Pt => [cx + (p[0] - m[0]) * s, cy + (p[1] - m[1]) * s];
  return { s, xf, vertex: xf([1, 0]), rump: xf([-3, 100]), transform: `translate(${cx} ${cy}) scale(${s}) translate(${-m[0]} ${-m[1]})` };
}
