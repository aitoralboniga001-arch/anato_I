import { clamp, lerp, type Pt } from '@/components/kit';

/**
 * The day-28 embryo outline (Langman "28. eguna", as traced for topic 5), frozen here so week 4 no
 * longer depends on the week-5 drawing files while they change. Values and maths are a copy of the
 * day-28 keyframe of week5/EarlyEmbryo.tsx (earlyGeom(28)) and the spine helpers of week5/skin.tsx.
 */

type Ell = [number, number, number, number, number]; // cx, cy, rx, ry, rot

export interface SpineSample {
  p: Pt;
  /** Unit tangent. */
  t: Pt;
  /** Unit normal pointing to the ventral side. */
  n: Pt;
}

const catmull = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const u2 = u * u;
  const u3 = u2 * u;
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
};

/** Samples `n + 1` points evenly by arclength along a Catmull-Rom curve through `pts`. */
export function sampleSpine(pts: readonly (readonly number[])[], n = 64): SpineSample[] {
  const P = pts.map((q) => [q[0], q[1]] as Pt);
  const dense: Pt[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 16; k++) dense.push(catmull(p0, P[i], P[i + 1], p3, k / 16));
  }
  dense.push(P[P.length - 1]);
  const acc = [0];
  for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = acc[acc.length - 1];
  const out: SpineSample[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (L * i) / n;
    while (j < acc.length - 2 && acc[j + 1] < s) j++;
    const k = (s - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
    const p: Pt = [lerp(dense[j][0], dense[j + 1][0], k), lerp(dense[j][1], dense[j + 1][1], k)];
    const a = dense[Math.max(0, j - 1)];
    const b = dense[Math.min(dense.length - 1, j + 2)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    out.push({ p, t, n: [-t[1], t[0]] });
  }
  return out;
}

/** Point on the spine at parameter u (0..1), pushed `d` units toward ventral. */
export function spineAt(S: SpineSample[], u: number, d = 0): SpineSample {
  const f = clamp(u) * (S.length - 1);
  const i = Math.min(S.length - 2, Math.floor(f));
  const k = f - i;
  const a = S[i];
  const b = S[i + 1];
  const t: Pt = [lerp(a.t[0], b.t[0], k), lerp(a.t[1], b.t[1], k)];
  const n: Pt = [lerp(a.n[0], b.n[0], k), lerp(a.n[1], b.n[1], k)];
  return { p: [lerp(a.p[0], b.p[0], k) + n[0] * d, lerp(a.p[1], b.p[1], k) + n[1] * d], t, n };
}

// Day-28 keyframe in its figure's pixel coordinates; point (x, y) of the figure → scene (545, 80), scale s.
const K28 = {
  box: { x: 1395, y: 205, s: 0.522 },
  spine: [[1330, 208], [1450, 215], [1550, 240], [1625, 290], [1680, 370], [1718, 470], [1730, 590], [1722, 710], [1690, 820], [1640, 920], [1575, 1010], [1480, 1080], [1360, 1120], [1250, 1122], [1170, 1080], [1140, 1010], [1150, 935], [1195, 868], [1250, 832], [1300, 815]] as Pt[],
  inner: [[1300, 330], [1330, 430], [1370, 540], [1390, 660], [1370, 760], [1340, 800], [1300, 815]] as Pt[],
  cran: [1195, 385, 140, 165, -28] as Ell,
  hind: [1340, 320, 120, 110, 0] as Ell,
  face: [1195, 552, 92, 58, 12] as Ell,
  heart: [1405, 605, 78, 92, -8] as Ell,
  arch: [1340, 418, 44, -4, 40],
  archLen: [100, 88, 70, 46],
  cord: [1320, 770, 1150, 730, 42],
  arm: [1640, 765, 30, 46, -10] as Ell,
};

function build() {
  const k = K28;
  const { x, y, s } = k.box;
  const P = (p: readonly number[]): Pt => [545 + (p[0] - x) * s, 80 + (p[1] - y) * s];
  const E = (e: Ell): Ell => [...P(e), e[2] * s, e[3] * s, e[4]];
  const spine = sampleSpine(k.spine.map(P), 27).map((q) => q.p);
  const inner = sampleSpine(k.inner.map(P), 15).map((q) => q.p);
  const a0 = P([k.arch[0], k.arch[1]]);
  const arch = [a0[0], a0[1], k.arch[2] * s, k.arch[3] * s, k.arch[4] * s];
  const archLen = k.archLen.map((v) => v * s);
  const S = sampleSpine(spine, 90);
  const [ax, ay, sx, sy, w] = arch;
  // Pharyngeal arches: bars from dorsal (top) to ventral, stacked caudally.
  const bars = archLen.map((len, i) => {
    const top: Pt = [ax + sx * i, ay + sy * i];
    const bot: Pt = [top[0] - len * 0.1, top[1] + len];
    return { top, bot, w: w * (1 - i * 0.12) };
  });
  const cord = [...P([k.cord[0], k.cord[1]]), ...P([k.cord[2], k.cord[3]]), k.cord[4] * s];
  return {
    spine,
    inner,
    cran: E(k.cran),
    hind: E(k.hind),
    face: E(k.face),
    heart: E(k.heart),
    arm: E(k.arm),
    arch,
    archLen,
    cord,
    S,
    bars,
    tail: S[S.length - 1].p,
  };
}

/** Day-28 embryo geometry in scene coordinates (face to the left, back to the right). */
export const G28 = build();
