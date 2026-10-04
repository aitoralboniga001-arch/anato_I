'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { clamp, lerp, lerpPt, smoothPath, type Pt } from '@/components/kit';
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
  const R = interp([[9, 27], [12, 25.5], [20, 22], [28, 20.2], [38, 19.2]], week);
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
  const wA = interp([[9, 2.5], [20, 3.5], [28, 3.8], [38, 5.2]], week);
  const wL = interp([[9, 3.2], [20, 4.7], [28, 5.3], [38, 7.8]], week);
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

// ---------------------------------------------------------------------------
// Drawing. No SVG filters: the volume comes from gradients laid out in figure space (light from the
// upper left of the screen), a dark contour on every piece, contact shadows where a limb lies on the
// body, and soft highlights clipped to the silhouette.
// ---------------------------------------------------------------------------

const f2 = (v: number) => v.toFixed(2);

/** Exact tapered capsule (two circles and their outer tangents), drawn with arcs: smooth at any zoom. */
function capsuleD(a: Pt, b: Pt, wa: number, wb: number) {
  const d = Math.max(dist(a, b), Math.abs(wa - wb) + 0.01);
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const phi = Math.asin(clamp((wa - wb) / d, -0.99, 0.99));
  const n1 = th - (Math.PI / 2 - phi);
  const n2 = th + (Math.PI / 2 - phi);
  const pt = (c: Pt, r: number, g: number): Pt => [c[0] + Math.cos(g) * r, c[1] + Math.sin(g) * r];
  const [p1, p2, p3, p4] = [pt(a, wa, n1), pt(b, wb, n1), pt(b, wb, n2), pt(a, wa, n2)];
  return `M${f2(p1[0])},${f2(p1[1])}L${f2(p2[0])},${f2(p2[1])}A${f2(wb)},${f2(wb)} 0 0 1 ${f2(p3[0])},${f2(p3[1])}L${f2(p4[0])},${f2(p4[1])}A${f2(wa)},${f2(wa)} 0 1 1 ${f2(p1[0])},${f2(p1[1])}Z`;
}

/** Points of an ellipse placed at `at`, turned by `deg` (figure space, so gradients stay put). */
function ellPts(at: Pt, deg: number, cx: number, cy: number, rx: number, ry: number, rot = 0, n = 20): Pt[] {
  const a = (deg * Math.PI) / 180;
  const r = (rot * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const g = (i / n) * Math.PI * 2;
    const lx = cx + Math.cos(g) * rx * Math.cos(r) - Math.sin(g) * ry * Math.sin(r);
    const ly = cy + Math.cos(g) * rx * Math.sin(r) + Math.sin(g) * ry * Math.cos(r);
    return [at[0] + lx * Math.cos(a) - ly * Math.sin(a), at[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  });
}
const local = (at: Pt, deg: number) => (x: number, y: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [at[0] + x * Math.cos(a) - y * Math.sin(a), at[1] + x * Math.sin(a) + y * Math.cos(a)];
};

/** Mix two #rrggbb colours into #rrggbb (chainable). */
function mix(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(k))).toString(16).padStart(2, '0')).join('')}`;
}

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Skin by age (Langman, 3rd–9th month): thin and translucent early (the scalp vessels show),
 * thin red and wrinkled in the 5th–6th month, a warm natural pink once fat is laid down.
 */
function skinTones(week: number) {
  const early = 1 - ramp(week, 10, 18);
  const red = Math.min(ramp(week, 16, 21), 1 - ramp(week, 27, 33));
  const tone = (term: string, e: string, r: string) => mix(mix(term, e, early), r, red);
  return {
    early,
    red,
    light: tone('#f3b5b6', '#f2b0b8', '#f1a9ae'),
    mid: tone('#e68f9a', '#e2869c', '#dc7c90'),
    deep: tone('#c15c7a', '#ba547b', '#a94566'),
    edge: tone('#6a2238', '#6e1f3e', '#661935'),
  };
}
type Tones = ReturnType<typeof skinTones>;

interface Seg {
  key: string;
  a: Pt;
  b: Pt;
  wa: number;
  wb: number;
  /** fade the proximal end into the body (hip, shoulder) */
  fade?: boolean;
}

/** One limb piece: cylinder shading across it, a contour, optional fade into the body at its root. */
function LimbSeg({ id, sg, tones, lx, s, dark = 0 }: { id: string; sg: Seg; tones: Tones; lx: number; s: number; dark?: number }) {
  const { a, b, wa, wb } = sg;
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  // normal pointing towards the light (screen upper left, figure (lx, -1))
  let n: Pt = [-Math.sin(th), Math.cos(th)];
  if (n[0] * lx - n[1] < 0) n = [-n[0], -n[1]];
  const w = Math.max(wa, wb);
  const m = lerpPt(a, b, 0.5);
  const gid = `${id}-${sg.key}`;
  const L = mix(tones.light, tones.mid, 0.3 + dark);
  const M = mix(tones.mid, tones.deep, dark);
  const D = mix(tones.mid, tones.deep, 0.55 + dark);
  const ax: Pt = [Math.cos(th), Math.sin(th)];
  const d = capsuleD(a, b, wa, wb);
  const fill = (
    <g>
      <path d={d} fill={`url(#${gid})`} />
      {/* soft light band inside the lit side, well clear of the contour */}
      <path d={capsuleD(a, b, Math.max(0.2, wa - 3.2 / s), Math.max(0.2, wb - 3.2 / s))} fill="none" stroke={`url(#${gid}-rim)`} strokeWidth={2.2 / s} />
    </g>
  );
  // At the root (hip, shoulder) the round cap has no contour: the limb grows out of the body.
  const cap0: Pt = [a[0] - ax[0] * wa, a[1] - ax[1] * wa];
  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={f2(m[0] + n[0] * w)} y1={f2(m[1] + n[1] * w)} x2={f2(m[0] - n[0] * w)} y2={f2(m[1] - n[1] * w)}>
          <stop offset="0" stopColor={L} />
          <stop offset="0.45" stopColor={M} />
          <stop offset="0.88" stopColor={D} />
          <stop offset="1" stopColor={mix(D, M, 0.5)} />
        </linearGradient>
        <linearGradient id={`${gid}-rim`} gradientUnits="userSpaceOnUse" x1={f2(m[0] + n[0] * w)} y1={f2(m[1] + n[1] * w)} x2={f2(m[0] - n[0] * w)} y2={f2(m[1] - n[1] * w)}>
          <stop offset="0" stopColor="#fff4f0" stopOpacity={0.32 * (1 - dark)} />
          <stop offset="0.45" stopColor="#fff4f0" stopOpacity={0} />
        </linearGradient>
        {sg.fade && (
          <>
            <linearGradient id={`${gid}-eg`} gradientUnits="userSpaceOnUse" x1={f2(cap0[0])} y1={f2(cap0[1])} x2={f2(a[0] + ax[0] * wa * 0.2)} y2={f2(a[1] + ax[1] * wa * 0.2)}>
              <stop offset="0" stopColor={tones.edge} stopOpacity={0} />
              <stop offset="0.7" stopColor={tones.edge} stopOpacity={0} />
              <stop offset="1" stopColor={tones.edge} stopOpacity={1} />
            </linearGradient>
          </>
        )}
      </defs>
      {fill}
      <path d={d} fill="none" stroke={sg.fade ? `url(#${gid}-eg)` : tones.edge} strokeWidth={2 / s} strokeLinejoin="round" />
    </g>
  );
}

/** Hand in figure space: palm, the fingers' tips and a thumb (near hand). */
function handShape(g: FetusGeom, at: Pt, from: Pt, far?: boolean) {
  const a = dir(from, at);
  const r = g.wA * 1.35;
  const palm = smoothPath(ellPts(at, a, r * 0.5, 0, r * 1.15, r * 0.95), true, 0.5);
  const thumb = far ? '' : smoothPath(ellPts(at, a, r * 0.85, -r * 0.55, r * 0.36, r * 0.21, -30, 14), true, 0.5);
  const T = local(at, a);
  const fingers = [-0.42, -0.14, 0.14, 0.42].map((k) => [T(r * 1.05, k * r * 1.2), T(r * 1.55, k * r * 1.05)] as [Pt, Pt]);
  return { palm, thumb, fingers };
}

/** Foot in figure space: leaves the ankle at ~90° to the shin, pointing forward, toes at the tip. */
function footShape(g: FetusGeom, ankle: Pt, knee: Pt) {
  const a = dir(knee, ankle) - 95;
  const L = g.wL * 2.6;
  const w = g.wL * 0.72;
  const T = local(ankle, a);
  const sole = capsuleD(T(-w * 0.3, 0), T(L, 0), w * 1.05, w * 0.8);
  const toes = [0, 1, 2, 3, 4].map((i) => ({ c: T(L + w * 0.55, (i - 2) * w * 0.34), r: w * (i === 0 ? 0.3 : 0.24) }));
  const heel = T(-w * 0.1, w * 0.55);
  return { sole, toes, heel, a };
}

/** Umbilical cord stub: a translucent gelatinous rope with two arteries and a vein twisting in a helix. */
function Cord({ g, s }: { g: FetusGeom; s: number }) {
  const b = g.cordBase;
  const u = g.R / 20;
  const ctrl: Pt[] = [b, [b[0] + 8 * u, b[1] + 1], [b[0] + 15 * u, b[1] + 5 * u], [b[0] + 19 * u, b[1] + 11 * u]];
  const w = lerp(3.2, 4.6, g.k);
  // sample the centreline
  const N = 48;
  const cps = ctrl;
  const C: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const v = (i / N) * (cps.length - 1);
    const j = Math.min(cps.length - 2, Math.floor(v));
    const k = v - j;
    const p0 = cps[Math.max(0, j - 1)];
    const p1 = cps[j];
    const p2 = cps[j + 1];
    const p3 = cps[Math.min(cps.length - 1, j + 2)];
    const k2 = k * k;
    const k3 = k2 * k;
    const cr = (q0: number, q1: number, q2: number, q3: number) => 0.5 * (2 * q1 + (-q0 + q2) * k + (2 * q0 - 5 * q1 + 4 * q2 - q3) * k2 + (-q0 + 3 * q1 - 3 * q2 + q3) * k3);
    C.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
  }
  const nrm = (i: number): Pt => {
    const p = C[Math.max(0, i - 1)];
    const q = C[Math.min(N, i + 1)];
    const l = dist(p, q) || 1;
    return [-(q[1] - p[1]) / l, (q[0] - p[0]) / l];
  };
  const turns = 3.2;
  const strands = [
    { ph: 0, col: '#b0415f', r: 0.2 },
    { ph: (2 * Math.PI) / 3, col: '#b0415f', r: 0.2 },
    { ph: (4 * Math.PI) / 3, col: '#5f6bb5', r: 0.27 },
  ];
  const segs = strands.flatMap((st, si) =>
    Array.from({ length: N }, (_, i) => {
      const g0 = st.ph + (i / N) * turns * 2 * Math.PI;
      const g1 = st.ph + ((i + 1) / N) * turns * 2 * Math.PI;
      const o0 = Math.sin(g0) * w * 0.28;
      const o1 = Math.sin(g1) * w * 0.28;
      const n0 = nrm(i);
      const n1 = nrm(i + 1);
      const front = Math.cos((g0 + g1) / 2) > 0;
      return { si, front, d: `M${f2(C[i][0] + n0[0] * o0)},${f2(C[i][1] + n0[1] * o0)}L${f2(C[i + 1][0] + n1[0] * o1)},${f2(C[i + 1][1] + n1[1] * o1)}`, col: st.col, sw: w * st.r };
    }),
  );
  const d = smoothPath(C.filter((_, i) => i % 3 === 0 || i === N), false);
  const end = C[N];
  const ang = dir(C[N - 3], end) + 90;
  return (
    <g strokeLinecap="round" fill="none">
      <path d={d} stroke="#7a3550" strokeWidth={w + 1.2 / s} />
      <path d={d} stroke="#e9c9d2" strokeWidth={w} />
      {segs.filter((q) => !q.front).map((q, i) => <path key={`b${i}`} d={q.d} stroke={q.col} strokeWidth={q.sw} opacity={0.35} />)}
      <path d={d} stroke="#f6e3e8" strokeWidth={w * 0.82} opacity={0.35} />
      {segs.filter((q) => q.front).map((q, i) => <path key={`f${i}`} d={q.d} stroke={q.col} strokeWidth={q.sw} opacity={0.9} />)}
      <path d={d} stroke="#fff" strokeWidth={w * 0.18} opacity={0.35} transform={`translate(${f2(-0.18 * w)} ${f2(-0.22 * w)})`} />
      <ellipse cx={end[0]} cy={end[1]} rx={w * 0.5} ry={w * 0.32} transform={`rotate(${f2(ang)} ${f2(end[0])} ${f2(end[1])})`} fill="#f3cbd6" stroke="#9c4a6d" strokeWidth={0.6 / s} />
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
  /** Replaces the short cut cord stub (figure-local coordinates), drawn between the far and near limbs. */
  cord?: ReactNode;
}

export function FetusFigure({ id, week, pose, s, hernia = 0, vernix = 0, cord }: FetusFigureProps) {
  const g = fetusGeom(week, pose);
  const { R, Hc, arm, leg, farArm, farLeg, turn } = g;
  // Keep the light at the upper left of the SCREEN when a caller mirrors the figure (week 5 faces left).
  const ref = useRef<SVGGElement>(null);
  const [flip, setFlip] = useState(false);
  useIso(() => {
    const m = ref.current?.getCTM?.();
    if (!m) return;
    const f = m.a * m.d - m.b * m.c < 0;
    if (f !== flip) setFlip(f);
  });
  const lx = flip ? 1 : -1;
  const tones = skinTones(week);
  const { red } = tones;
  const hair = ramp(week, 17, 38);
  const lanugo = Math.min(ramp(week, 17, 21), 1 - ramp(week, 32, 38));
  const vessels = 1 - ramp(week, 11, 15);
  const fat = g.fat;
  const nStrands = Math.round(lerp(24, 150, hair));
  const earH = R * lerp(0.2, 0.3, 1 - g.early);
  const e = g.ear;
  const trunkD = smoothPath(g.trunk, true, 0.5);
  const headD = smoothPath(g.head, true, 0.5);
  // Strokes are set in screen pixels; on small figures (the uterus views, the scale lineup) they thin out
  // so the contours do not turn the limbs into dark sticks.
  const sk = Math.min(1, Math.max(0.45, s / 2.2));
  const se = s / sk;
  const EW = (3.2 / s) * Math.max(0.65, sk); // union contour (half of it shows)

  // One gradient for head and trunk: lit centre on the upper back/shoulder, so the head takes mid tones.
  const lit: Pt = [-6 + lx * 14, g.shoulder[1] - R * 0.15];
  const bodyR = 92;
  const cranLit = turn([Hc[0] + lx * R * 0.38, Hc[1] - R * 0.45]);
  const hairC = turn(P(Hc, 240, R * 0.5));
  const flank: Pt = lx < 0 ? [g.back[0] + 7, g.back[1] - 10] : [g.belly[0] - 9, g.belly[1] - 12];

  const nearLeg: Seg[] = [
    { key: 'th', a: leg.a, b: leg.j, wa: g.wL * 1.12, wb: g.wL * 0.9, fade: true },
    { key: 'sh', a: leg.j, b: leg.end, wa: g.wL * 0.88, wb: g.wL * 0.58 },
  ];
  const nearArm: Seg[] = [
    { key: 'ua', a: arm.a, b: arm.j, wa: g.wA * 1.1, wb: g.wA * 0.9, fade: true },
    { key: 'fa', a: arm.j, b: arm.end, wa: g.wA * 0.9, wb: g.wA * 0.75 },
  ];
  const farSegs: Seg[] = [
    { key: 'fth', a: farLeg.a, b: farLeg.j, wa: g.wL, wb: g.wL * 0.85, fade: true },
    { key: 'fsh', a: farLeg.j, b: farLeg.end, wa: g.wL * 0.82, wb: g.wL * 0.55 },
    { key: 'fua', a: farArm.a, b: farArm.j, wa: g.wA, wb: g.wA * 0.85, fade: true },
    { key: 'ffa', a: farArm.j, b: farArm.end, wa: g.wA * 0.85, wb: g.wA * 0.7 },
  ];
  const foot = footShape(g, leg.end, leg.j);
  const farFoot = footShape(g, farLeg.end, farLeg.j);
  const hand = handShape(g, arm.end, arm.j);
  const farHand = handShape(g, farArm.end, farArm.j, true);
  // contact shadow: the near limbs' silhouettes pushed away from the light, on the body only
  const sh: Pt = [-lx * 1.1, 1.3];
  const nearSil = [...nearLeg, ...nearArm].map((q) => capsuleD(q.a, q.b, q.wa, q.wb));

  const handFill = mix(tones.mid, tones.deep, 0.08);
  const footFill = (dark: number) => mix(tones.mid, tones.deep, 0.15 + dark);
  const edge = tones.edge;
  const cw = 1.2 / se;

  return (
    <g ref={ref}>
      <defs>
        <radialGradient id={`${id}-skin`} gradientUnits="userSpaceOnUse" cx={f2(lit[0])} cy={f2(lit[1])} r={bodyR} fx={f2(lit[0])} fy={f2(lit[1])}>
          <stop offset="0" stopColor={mix(tones.light, tones.mid, 0.4)} />
          <stop offset="0.3" stopColor={mix(tones.light, tones.mid, 0.7)} />
          <stop offset="0.6" stopColor={tones.mid} />
          <stop offset="0.9" stopColor={tones.deep} />
          <stop offset="1" stopColor={mix(tones.deep, tones.edge, 0.25)} />
        </radialGradient>
        <radialGradient id={`${id}-cran`} gradientUnits="userSpaceOnUse" cx={f2(cranLit[0])} cy={f2(cranLit[1])} r={f2(R * 1.15)}>
          <stop offset="0" stopColor="#fff1ee" stopOpacity={0.1} />
          <stop offset="0.5" stopColor="#fff1ee" stopOpacity={0.05} />
          <stop offset="1" stopColor="#fff1e8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-backlit`} gradientUnits="userSpaceOnUse" cx={f2(flank[0])} cy={f2(flank[1])} r={26}>
          <stop offset="0" stopColor="#fff1e8" stopOpacity={0.2} />
          <stop offset="1" stopColor="#fff1e8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-occ`} gradientUnits="userSpaceOnUse" cx={f2(g.hip[0] + 10)} cy={f2(g.hip[1] - 4)} r={30}>
          <stop offset="0" stopColor={tones.edge} stopOpacity={0.28} />
          <stop offset="1" stopColor={tones.edge} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-hair`} gradientUnits="userSpaceOnUse" cx={f2(hairC[0])} cy={f2(hairC[1])} r={f2(R * 1.05)}>
          <stop offset="0" stopColor="#6a3226" stopOpacity={0.24} />
          <stop offset="0.6" stopColor="#6a3226" stopOpacity={0.18} />
          <stop offset="1" stopColor="#5b2c22" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vx`}>
          <stop offset="0" stopColor="#fffaf0" stopOpacity={0.85} />
          <stop offset="1" stopColor="#fffaf0" stopOpacity={0} />
        </radialGradient>
        {/* bevel: a light rim inside the lit edge, a deeper one inside the shadowed edge */}
        <linearGradient id={`${id}-bvl`} gradientUnits="userSpaceOnUse" x1={f2(-12 + lx * 50)} y1={-10} x2={f2(-12 - lx * 50)} y2={110}>
          <stop offset="0" stopColor="#fff3ef" stopOpacity={0.34} />
          <stop offset="0.45" stopColor="#fff3ef" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-bvd`} gradientUnits="userSpaceOnUse" x1={f2(-12 + lx * 50)} y1={-10} x2={f2(-12 - lx * 50)} y2={110}>
          <stop offset="0.5" stopColor={tones.edge} stopOpacity={0} />
          <stop offset="1" stopColor={tones.edge} stopOpacity={0.4} />
        </linearGradient>
        {/* skin texture: faint mottling as a tiled pattern (no filter) */}
        <pattern id={`${id}-tex`} patternUnits="userSpaceOnUse" width={13} height={11} patternTransform="rotate(17)">
          {([[1.5, 1.8, 1.6, 0], [6.4, 2.9, 0.9, 1], [4.2, 6.6, 2.1, 0], [9.8, 7.6, 1.2, 1], [11.6, 2.2, 1.7, 0], [7.9, 9.9, 0.8, 1], [2.3, 9.6, 1.1, 1]] as const).map(([x, y, r, lt], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={lt ? tones.light : tones.deep} opacity={lt ? 0.07 : 0.045} />
          ))}
        </pattern>
        <clipPath id={`${id}-body`}>
          <path d={trunkD} />
          <path d={headD} />
        </clipPath>
        <clipPath id={`${id}-head`}>
          <path d={headD} />
        </clipPath>
      </defs>

      {/* Head and trunk as ONE silhouette: both contours first, then both fills (no seam at the neck) */}
      <g fill="none" stroke={edge} strokeWidth={EW} strokeOpacity={0.9} strokeLinejoin="round">
        <path d={trunkD} />
        <path d={headD} />
      </g>
      <path d={trunkD} fill={`url(#${id}-skin)`} />

      {/* Far-side limbs, a shade darker */}
      {farSegs.map((q) => (
        <LimbSeg key={q.key} id={id} sg={q} tones={tones} lx={lx} s={se} dark={0.22} />
      ))}
      <g stroke={edge} strokeWidth={cw} strokeOpacity={0.85} strokeLinejoin="round">
        <path d={farFoot.sole} fill={footFill(0.25)} />
        {farFoot.toes.map((q, i) => (
          <circle key={i} cx={f2(q.c[0])} cy={f2(q.c[1])} r={f2(q.r)} fill={footFill(0.25)} />
        ))}
        <path d={farHand.palm} fill={mix(handFill, tones.deep, 0.3)} />
      </g>

      {/* Physiological hernia: gut loops in the base of the cord */}
      {hernia > 0.02 && (
        <g fill="#f3c4cf" stroke="#a2466a" strokeWidth={0.5} opacity={hernia}>
          <ellipse cx={g.cordBase[0] + 3} cy={g.cordBase[1] + 1} rx={4.6} ry={4} />
          <path d={`M${g.cordBase[0] + 0.5},${g.cordBase[1]} q2,-2.6 4,0 t4,0 M${g.cordBase[0] + 1},${g.cordBase[1] + 2.4} q2,-2.2 4,0`} fill="none" />
        </g>
      )}
      {cord ?? <Cord g={g} s={se} />}

      <path d={headD} fill={`url(#${id}-skin)`} />

      {/* Volume on the body (clipped to the silhouette): crown and back highlights, groin occlusion, chin shadow */}
      <g clipPath={`url(#${id}-body)`} pointerEvents="none">
        <path d={trunkD} fill={`url(#${id}-tex)`} />
        <path d={headD} fill={`url(#${id}-tex)`} />
        <g fill="none" strokeWidth={R * 0.2}>
          <path d={trunkD} stroke={`url(#${id}-bvd)`} />
          <path d={headD} stroke={`url(#${id}-bvd)`} />
          <path d={trunkD} stroke={`url(#${id}-bvl)`} strokeWidth={R * 0.12} />
          <path d={headD} stroke={`url(#${id}-bvl)`} strokeWidth={R * 0.12} />
        </g>
        <circle cx={f2(cranLit[0])} cy={f2(cranLit[1])} r={f2(R * 1.15)} fill={`url(#${id}-cran)`} />
        <circle cx={f2(flank[0])} cy={f2(flank[1])} r={26} fill={`url(#${id}-backlit)`} />
        <circle cx={f2(g.hip[0] + 10)} cy={f2(g.hip[1] - 4)} r={30} fill={`url(#${id}-occ)`} />
        {/* Contact shadows of the near limbs: three thin offsets stacked, so the shadow darkens toward the
            limb and fades out at its edge (one hard offset copy left a crisp dark line beside every limb on
            the big figures). */}
        {[0.4, 0.8, 1.25].map((k) => (
          <g key={k} fill={tones.edge} transform={`translate(${f2(sh[0] * k)} ${f2(sh[1] * k)})`} opacity={0.055}>
            {nearSil.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        ))}
        {/* Thin red skin of the 5th–6th month: fine wrinkles */}
        {red > 0.05 && (
          <g fill="none" stroke={tones.edge} strokeWidth={0.26} opacity={0.2 * red} strokeLinecap="round">
            {[0.24, 0.46, 0.68].map((v, i) => {
              const yy = lerp(g.trunk[0][1], 100, v);
              const xb = interpX(g.trunk.slice(0, 8), yy) + 3.2;
              return <path key={i} d={`M${f2(xb)},${f2(yy - 1.8)} q2.6,${f2(1.4 + (i % 2) * 0.6)} 5.4,${f2(0.6 - (i % 2) * 0.8)}`} />;
            })}
            <path d={`M${f2(g.belly[0] - 5)},${f2(g.belly[1] - 6)} q2,1.2 4,0.4 M${f2(g.belly[0] - 6)},${f2(g.belly[1] + 3)} q2.2,1 4.4,0.2`} />
          </g>
        )}
        {/* Vernix caseosa: a whitish greasy film along the back and in the creases */}
        {vernix > 0.02 && (
          <g opacity={vernix} pointerEvents="none">
            <path d={smoothPath(g.trunk.slice(0, 8), false, 0.5)} fill="none" stroke="#fff8ee" strokeWidth={4.5} opacity={0.22} />
            {([
              [g.trunk[2], 5, 2.6],
              [g.trunk[4], 4.2, 2.2],
              [g.trunk[6], 4, 2.1],
              [turn(P(Hc, 150, R * 0.8)), 3.2, 1.8],
              [lerpPt(g.hip, g.leg.j, 0.3), 3.4, 1.8],
            ] as [Pt, number, number][]).map(([p, rx, ry], i) => (
              <ellipse key={i} cx={f2(p[0] + (i < 3 ? 2.6 : 0))} cy={f2(p[1])} rx={rx} ry={ry} fill={`url(#${id}-vx)`} opacity={0.75} />
            ))}
          </g>
        )}
      </g>

      {/* Thin skin of the early fetus: the head's vascular network shows through */}
      {vessels > 0.02 && (
        <g stroke="#b8304f" strokeWidth={0.42} fill="none" opacity={0.42 * vessels} strokeLinecap="round" clipPath={`url(#${id}-head)`}>
          {[200, 238, 276, 314].map((a, i) => {
            const p = turn(P(Hc, a, R * 0.95));
            const q = turn(P(Hc, a + 18, R * 0.45));
            const c = turn(P(Hc, a + 30 * (i % 2 ? 1 : -1), R * 0.75));
            const br = turn(P(Hc, a + 10 * (i % 2 ? 1 : -1), R * 0.66));
            const bq = turn(P(Hc, a - 14 * (i % 2 ? 1 : -1), R * 0.52));
            return <path key={a} d={`M${f2(p[0])},${f2(p[1])} Q${f2(c[0])},${f2(c[1])} ${f2(q[0])},${f2(q[1])} M${f2(br[0])},${f2(br[1])} L${f2(bq[0])},${f2(bq[1])}`} />;
          })}
        </g>
      )}

      {/* Scalp hair: a soft cap (gradient, no blur) and fine strokes, sparse from the 5th month, thick at term */}
      {hair > 0.02 && (
        <g pointerEvents="none" clipPath={`url(#${id}-head)`}>
          <circle cx={f2(hairC[0])} cy={f2(hairC[1])} r={f2(R * 1.05)} fill={`url(#${id}-hair)`} opacity={hair * hair} />
          <g stroke="#6e3428" strokeLinecap="round" fill="none" opacity={0.3 + 0.35 * hair} strokeWidth={0.2 + 0.14 * hair}>
            {Array.from({ length: nStrands }, (_, i) => {
              const a = 184 + ((i * 137.5) % 160);
              const rr = R * (0.6 + ((i * 0.618) % 1) * 0.38);
              const L = R * lerp(0.05, 0.13, hair);
              const p = turn(P(Hc, a, rr));
              const q = turn(P(Hc, a + 5, rr - L));
              const c = turn(P(Hc, a + 2.5 + 3 * hair * (i % 2 ? 1 : -1), rr - L * 0.5));
              return <path key={i} d={`M${f2(p[0])},${f2(p[1])} Q${f2(c[0])},${f2(c[1])} ${f2(q[0])},${f2(q[1])}`} />;
            })}
          </g>
        </g>
      )}

      {/* Lanugo: fine down along the back, standing a little off the contour */}
      {lanugo > 0.02 && (
        <g stroke="#ffeae4" strokeWidth={0.2} opacity={0.5 * lanugo} strokeLinecap="round" pointerEvents="none">
          {Array.from({ length: 56 }, (_, i) => {
            const u = (i / 55) * 6.99;
            const n = Math.floor(u);
            const p = lerpPt(g.trunk[n], g.trunk[n + 1], u - n);
            const tg = dir(g.trunk[n], g.trunk[n + 1]);
            const o = 0.3 + (i % 3) * 0.35;
            const nx = Math.cos(((tg - 90) * Math.PI) / 180);
            const ny = Math.sin(((tg - 90) * Math.PI) / 180);
            const x = p[0] - nx * o;
            const y = p[1] - ny * o;
            return <line key={i} x1={f2(x)} y1={f2(y)} x2={f2(x + Math.cos((tg * Math.PI) / 180) * 1.1 + nx * 0.5)} y2={f2(y + Math.sin((tg * Math.PI) / 180) * 1.1 + ny * 0.5)} />;
          })}
        </g>
      )}

      {/* Near leg: thigh up to the chest, shin down, foot forward */}
      {nearLeg.map((q) => (
        <LimbSeg key={q.key} id={id} sg={q} tones={tones} lx={lx} s={se} />
      ))}
      <g stroke={edge} strokeWidth={cw} strokeOpacity={0.88} strokeLinejoin="round">
        <path d={foot.sole} fill={footFill(0)} />
        {foot.toes.map((q, i) => (
          <circle key={i} cx={f2(q.c[0])} cy={f2(q.c[1])} r={f2(q.r)} fill={footFill(0)} />
        ))}
      </g>
      {/* Near arm: elbow down, hand at the mouth */}
      {nearArm.map((q) => (
        <LimbSeg key={q.key} id={id} sg={q} tones={tones} lx={lx} s={se} />
      ))}
      <g stroke={edge} strokeWidth={cw} strokeOpacity={0.88} strokeLinejoin="round">
        <path d={hand.palm} fill={handFill} />
        <path d={hand.thumb} fill={handFill} />
      </g>
      <g stroke={edge} strokeWidth={0.4} opacity={0.45} strokeLinecap="round">
        {hand.fingers.slice(1).map(([p, q], i) => (
          <line key={i} x1={f2(p[0])} y1={f2(p[1])} x2={f2(q[0])} y2={f2(q[1])} />
        ))}
      </g>

      {/* Fat folds at the wrist and ankle: short and soft (full-width lines read as seams across the limb) */}
      {fat > 0.02 && (
        <g fill="none" stroke={edge} strokeWidth={0.4} opacity={0.32 * fat} strokeLinecap="round">
          {[
            [arm.end, arm.j, g.wA * 0.85, 0.12],
            [leg.end, leg.j, g.wL * 0.62, 0.1],
          ].map(([p, q, w, k], i) => {
            const a = p as Pt;
            const b = q as Pt;
            const c = lerpPt(a, b, k as number);
            const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
            const nx = -Math.sin(th) * (w as number) * 0.55;
            const ny = Math.cos(th) * (w as number) * 0.55;
            return <path key={i} d={`M${f2(c[0] + nx)},${f2(c[1] + ny)} Q${f2(c[0] + Math.cos(th) * 1.2)},${f2(c[1] + Math.sin(th) * 1.2)} ${f2(c[0] - nx)},${f2(c[1] - ny)}`} />;
          })}
        </g>
      )}

      {/* Face and ear */}
      <g fill="none" stroke={edge} strokeLinecap="round" strokeWidth={0.55} opacity={0.85}>
        <path d={`M${f2(g.eye[0] - R * 0.13)},${f2(g.eye[1] - R * 0.02)} q${f2(R * 0.13)},${f2(R * 0.1)} ${f2(R * 0.26)},${f2(-R * 0.01)}`} />
        {week >= 17 && <path d={`M${f2(g.brow[0] - R * 0.14)},${f2(g.brow[1] - R * 0.02)} q${f2(R * 0.14)},${f2(-R * 0.07)} ${f2(R * 0.26)},${f2(R * 0.03)}`} opacity={0.5 * ramp(week, 17, 22)} strokeWidth={0.9} stroke="#6e3428" />}
        <path d={`M${f2(g.mouth[0] - R * 0.12)},${f2(g.mouth[1] - R * 0.01)} q${f2(R * 0.06)},${f2(R * 0.03)} ${f2(R * 0.12)},0`} opacity={0.7} />
        <circle cx={f2(g.nose[0] - R * 0.06)} cy={f2(g.nose[1] + R * 0.03)} r={f2(R * 0.022)} fill={edge} stroke="none" opacity={0.6} />
        <g>
          <path d={`M${f2(e[0] + earH * 0.35)},${f2(e[1] - earH)} C${f2(e[0] - earH * 0.9)},${f2(e[1] - earH * 1.1)} ${f2(e[0] - earH * 0.9)},${f2(e[1] + earH * 0.9)} ${f2(e[0] + earH * 0.2)},${f2(e[1] + earH)} Q${f2(e[0] + earH * 0.5)},${f2(e[1])} ${f2(e[0] + earH * 0.35)},${f2(e[1] - earH)}Z`} fill={mix(tones.mid, tones.deep, 0.3)} fillOpacity={0.25} strokeWidth={0.7} />
          <path d={`M${f2(e[0] + earH * 0.15)},${f2(e[1] - earH * 0.45)} c${f2(-earH * 0.45)},0 ${f2(-earH * 0.45)},${f2(earH * 0.8)} 0,${f2(earH * 0.8)}`} strokeWidth={0.5} opacity={0.6} />
        </g>
      </g>
    </g>
  );
}

/** x of a polyline at height y (first crossing). */
function interpX(pts: Pt[], y: number) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
  }
  return pts[0][0];
}



/**
 * Scale and place the drawing so the crown–rump length is `cm` at `pxcm` px per cm; `cx` is
 * the horizontal centre of the body, `cy` the middle of the vertex–rump line (or the lowest
 * point when `base` is set).
 */
export function placeFetus(cm: number, pxcm: number, cx: number, cy: number, base = false, mirror = false) {
  const s = (cm * pxcm) / 100;
  const m: Pt = [-2, base ? 100 : 50];
  // `mirror`: face to the left, as the embryo views of days 28–56 do, so the student follows one body.
  const sx = mirror ? -1 : 1;
  const xf = (p: readonly number[]): Pt => [cx + sx * (p[0] - m[0]) * s, cy + (p[1] - m[1]) * s];
  /** Scene → figure-local coordinates (the inverse of `xf`), e.g. to route a full cord from the belly. */
  const inv = (p: readonly number[]): Pt => [(p[0] - cx) / (sx * s) + m[0], (p[1] - cy) / s + m[1]];
  return { s, xf, inv, vertex: xf([1, 0]), rump: xf([-3, 100]), transform: `translate(${cx} ${cy}) scale(${sx * s} ${s}) translate(${-m[0]} ${-m[1]})` };
}
