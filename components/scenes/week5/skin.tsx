'use client';

import { clamp, lerp, mix, smoothPath, type Pt } from '@/components/kit';

/**
 * Shared drawing kit for topic 5: the external embryo and fetus are drawn as one sculpted
 * silhouette (union of simple shapes) lit by an SVG filter, so organs that bulge under the
 * skin (heart, liver, arches, somites) read as relief, like the course figures.
 */

export const SKIN = {
  light: '#f7d2c4',
  mid: '#eba897',
  deep: '#c9786b',
  line: '#9b4d45',
  ink: '#5e2622',
  vessel: '#c9404c',
};

/** Gradients and the sculpt filter. `id` prefixes every def so several drawings can coexist. */
export function SkinDefs({ id = 'w5', cx = 470, cy = 260, r = 420, red = 0 }: { id?: string; cx?: number; cy?: number; r?: number; red?: number }) {
  // `red`: thin, wrinkled, reddish skin of the 5th–6th month (little fat yet).
  const light = mix(SKIN.light, '#f2b3a3', red);
  const midC = mix(SKIN.mid, '#df8577', red);
  const deep = mix(SKIN.deep, '#b85a50', red);
  return (
    <defs>
      <radialGradient id={`${id}-skin`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
        <stop offset="0" stopColor={light} />
        <stop offset="0.55" stopColor={midC} />
        <stop offset="1" stopColor={deep} />
      </radialGradient>
      <radialGradient id={`${id}-heart`} cx="0.45" cy="0.45" r="0.6">
        <stop offset="0" stopColor="#e0656a" stopOpacity="0.55" />
        <stop offset="1" stopColor="#e0656a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-liver`} cx="0.45" cy="0.45" r="0.6">
        <stop offset="0" stopColor="#9d3b36" stopOpacity="0.4" />
        <stop offset="1" stopColor="#9d3b36" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-sculpt`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="dil" />
        <feFlood floodColor="#2b0f0c" floodOpacity="0.9" />
        <feComposite in2="dil" operator="in" result="edge" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur" />
        <feOffset in="blur" dx="6" dy="8" result="offA" />
        <feComposite in="SourceAlpha" in2="offA" operator="out" result="hiA" />
        <feFlood floodColor="#fff3ec" floodOpacity="0.5" />
        <feComposite in2="hiA" operator="in" result="hi" />
        <feOffset in="blur" dx="-8" dy="-10" result="offB" />
        <feComposite in="SourceAlpha" in2="offB" operator="out" result="shA" />
        <feFlood floodColor="#76302a" floodOpacity="0.75" />
        <feComposite in2="shA" operator="in" result="sh" />
        <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.25  0 0 0 0 0.22  0.22 0 0 0 -0.09" result="tint" />
        <feComposite in="tint" in2="SourceAlpha" operator="in" result="mottle" />
        <feMerge>
          <feMergeNode in="edge" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="mottle" />
          <feMergeNode in="sh" />
          <feMergeNode in="hi" />
        </feMerge>
      </filter>
      {/* Same lighting without the hard contour, for parts that must melt into the body (limb roots). */}
      <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
        <feOffset in="blur" dx="4" dy="6" result="offA" />
        <feComposite in="SourceAlpha" in2="offA" operator="out" result="hiA" />
        <feFlood floodColor="#fff3ec" floodOpacity="0.55" />
        <feComposite in2="hiA" operator="in" result="hi" />
        <feOffset in="blur" dx="-5" dy="-7" result="offB" />
        <feComposite in="SourceAlpha" in2="offB" operator="out" result="shA" />
        <feFlood floodColor="#6d2a25" floodOpacity="0.85" />
        <feComposite in2="shA" operator="in" result="sh" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="sh" />
          <feMergeNode in="hi" />
        </feMerge>
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Keyframe interpolation: every keyframe is a plain object of numbers / number arrays.
// ---------------------------------------------------------------------------

export type Num = number | readonly Num[];
export type Shape = { readonly [k: string]: Num };

const mixNum = (a: Num, b: Num, k: number): Num =>
  typeof a === 'number' ? lerp(a, b as number, k) : a.map((v, i) => mixNum(v, (b as readonly Num[])[i], k));

export function mixShape<T extends Shape>(a: T, b: T, k: number): T {
  const out: Record<string, Num> = {};
  for (const key of Object.keys(a)) out[key] = mixNum(a[key], b[key], k);
  return out as unknown as T;
}

const smooth = (k: number) => k * k * (3 - 2 * k);

/** Shape at `day` from keyframes sorted by day (clamped at both ends, smoothstep in between). */
export function atDay<T extends Shape>(keys: readonly { day: number; s: T }[], day: number): T {
  if (day <= keys[0].day) return keys[0].s;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (day <= b.day) return mixShape(a.s, b.s, smooth((day - a.day) / (b.day - a.day)));
  }
  return keys[keys.length - 1].s;
}

/** 0→1 as `v` goes a→b (linear, clamped). */
export const ramp = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
/** Visible inside [a, b] with soft edges of width `d`. */
export const win = (v: number, a: number, b: number, d = 1) => Math.min(ramp(v, a - d, a), 1 - ramp(v, b, b + d));

// ---------------------------------------------------------------------------
// Spine: a smooth curve through control points, sampled with arclength.
// ---------------------------------------------------------------------------

export interface SpineSample {
  p: Pt;
  /** Unit tangent. */
  t: Pt;
  /** Unit normal pointing to the ventral side (right-hand of the direction of travel). */
  n: Pt;
}

const catmull = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const u2 = u * u;
  const u3 = u2 * u;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
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

/** Interpolated thickness profile (values at evenly spaced u). */
export const profile = (vals: readonly number[], u: number) => {
  const f = clamp(u) * (vals.length - 1);
  const i = Math.min(vals.length - 2, Math.floor(f));
  const k = smooth(f - i);
  return lerp(vals[i], vals[i + 1], k);
};

/** Closed outline of a tube whose dorsal edge is the spine and whose ventral edge is spine + n·thick(u). */
export function trunkPath(S: SpineSample[], thick: readonly number[]) {
  const dorsal = S.map((s) => s.p);
  // Offsetting a tight curve by more than its radius folds the ventral edge; relax it smooth.
  let ventral = S.map((s, i) => {
    const d = profile(thick, i / (S.length - 1));
    return [s.p[0] + s.n[0] * d, s.p[1] + s.n[1] * d] as Pt;
  });
  for (let it = 0; it < 8; it++)
    ventral = ventral.map((p, i) => {
      if (i === 0 || i === ventral.length - 1) return p;
      const a = ventral[i - 1];
      const b = ventral[i + 1];
      return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4] as Pt;
    });
  return smoothPath([...dorsal, ...ventral.reverse()], true, 0.6);
}

export const polar = (c: readonly number[], deg: number, r: number): Pt => [c[0] + Math.cos((deg * Math.PI) / 180) * r, c[1] + Math.sin((deg * Math.PI) / 180) * r];

// ---------------------------------------------------------------------------
// Limb: bud → paddle (1st constriction) → rays → 2nd constriction, fingers separate.
// ---------------------------------------------------------------------------

export interface LimbPose {
  root: readonly number[];
  /** Directions (degrees) of the proximal, middle and distal segments. */
  a: readonly number[];
  /** Full length when finished (root → fingertips). */
  len: number;
  /** Development 0 (nothing) … 1 bud … 2 plate … 3 rays + 2nd constriction … 4 separate digits. */
  dev: number;
  /** Width at the root. */
  w: number;
  /** Lower limb: shorter digits (toes). */
  toes?: boolean;
}

export interface LimbGeom {
  /** Free digits (capsules), their width and visibility. */
  digits: [Pt, Pt][];
  digitW: number;
  digitA: number;
  /** Root width, for masks that blend the limb into the body. */
  w: number;
  body: string;
  hand: string;
  rays: [Pt, Pt][];
  grooves: [Pt, Pt][];
  joints: { prox: Pt; mid: Pt; dist: Pt; palm: Pt; tip: Pt };
  /** Opacity helpers: rays visible, grooves visible, fingers free. */
  rayA: number;
  grooveA: number;
}

const RAYS = [-50, -22, 0, 20, 40];

export function limbGeom(L: LimbPose): LimbGeom {
  const dev = clamp(L.dev / 4) * 4;
  const grow = clamp(dev); // bud emerging
  const long = ramp(dev, 1, 2.6); // elongation
  // Segment lengths (proximal, middle, distal plate).
  const total = L.len * lerp(lerp(0.12, 0.3, grow), 1, long);
  const lp = total * lerp(0.5, 0.36, long);
  const lm = total * lerp(0.2, 0.3, long);
  const plateR = Math.max(4, L.w * lerp(0.55, 0.62, long) * lerp(0.9, 1.05, ramp(dev, 1.2, 2)));
  const bend = ramp(dev, 2.4, 3.6);
  const a0 = L.a[0];
  const a1 = lerp(a0, L.a[1], bend);
  const a2 = lerp(a1, L.a[2], ramp(dev, 1.6, 3.4));
  const P0: Pt = polar([L.root[0], L.root[1]], a0 + 180, L.w * 0.35);
  const P1 = polar(P0, a0, lp + L.w * 0.35);
  const P2 = polar(P1, a1, lm);
  const palm = polar(P2, a2, plateR * lerp(0.4, 0.85, ramp(dev, 1.3, 2.2)));

  // Width along the arm: dips at the 1st constriction (wrist, dev≥1.3) and the 2nd (elbow, dev≥2.8).
  const wRoot = L.w * lerp(0.9, 1, grow);
  const c1 = ramp(dev, 1.3, 2.2);
  const c2 = ramp(dev, 2.7, 3.5);
  const chain: [Pt, number, number][] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const seg1 = u < 0.5;
    const k = seg1 ? u / 0.5 : (u - 0.5) / 0.5;
    const p: Pt = seg1 ? [lerp(P0[0], P1[0], k), lerp(P0[1], P1[1], k)] : [lerp(P1[0], P2[0], k), lerp(P1[1], P2[1], k)];
    const ang = seg1 ? a0 : a1;
    let w = lerp(wRoot, wRoot * lerp(0.95, 0.72, long), u);
    w *= 1 - 0.3 * c2 * Math.exp(-((u - 0.5) ** 2) / 0.004);
    w *= 1 - 0.34 * c1 * Math.exp(-((u - 1) ** 2) / 0.006);
    chain.push([p, ang, w / 2]);
  }
  const left = chain.map(([p, a, w]) => polar(p, a - 90, w));
  const right = chain.map(([p, a, w]) => polar(p, a + 90, w)).reverse();
  const [pe, ae, we] = chain[chain.length - 1];
  const cap = [-50, 0, 50].map((d) => polar(pe, ae + d, we * (d === 0 ? 1.05 : 0.95)));
  const body = smoothPath([...left, ...cap, ...right], true, 0.5);

  // Hand/foot plate: a paddle whose distal rim grows digits as `notch` deepens.
  const flat = ramp(dev, 1.4, 2.2);
  const ext = plateR * 0.9 * ramp(dev, 2.6, 4);
  const notch = ramp(dev, 2.9, 4);
  const pts: Pt[] = [];
  const M = 72;
  for (let i = 0; i <= M; i++) {
    const th = lerp(-180, 180, i / M);
    let bump = 0;
    for (const r of RAYS) bump = Math.max(bump, Math.exp(-((th - r) ** 2) / (2 * lerp(16, 9.5, notch) ** 2)));
    // Proximal half narrows into the wrist so plate and forearm read as one piece.
    const c = Math.cos((th * Math.PI) / 180);
    const aspect = lerp(1, c * c * 0.8 + (1 - c * c) * 1.14, flat);
    const rr = plateR * aspect * lerp(1, 1.08, flat) * (Math.abs(th) > 75 ? lerp(1, 0.62, Math.min(1, (Math.abs(th) - 75) / 60)) : 1);
    // The rim scallops between the rays, then recedes into a palm as the digits take over.
    const r = rr + (Math.abs(th) > 90 ? 0 : ext * (1 - notch) * lerp(1, bump, 0.6) * Math.min(1, (90 - Math.abs(th)) / 25));
    pts.push(polar(palm, a2 + th, r));
  }
  const hand = dev < 1.2 ? '' : smoothPath(pts, true, 0.5);
  const rays: [Pt, Pt][] = RAYS.map((r) => [polar(palm, a2 + r * 1.6, plateR * 0.3), polar(palm, a2 + r, plateR + ext * 0.85)]);
  const grooves: [Pt, Pt][] = RAYS.slice(0, -1).map((r, i) => {
    const m = (r + RAYS[i + 1]) / 2;
    return [polar(palm, a2 + m, plateR * 0.7), polar(palm, a2 + m, plateR * 0.98 + ext * 0.2 * (1 - notch))];
  });
  const reach = L.toes ? 0.5 : 1;
  const digits: [Pt, Pt][] = RAYS.map((r, i) => {
    const a = polar(palm, a2 + r * 0.85, plateR * 0.5);
    const b = polar(palm, a2 + r * 1.05, plateR + ext * reach * (i === 0 ? 0.75 : i === 4 ? 0.85 : 1));
    const k = 0.35 + 0.65 * notch;
    return [a, [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]];
  });
  return {
    w: L.w,
    digits,
    digitW: plateR * (L.toes ? 0.42 : 0.36),
    digitA: notch,
    body,
    hand,
    rays,
    grooves,
    joints: { prox: P0, mid: P1, dist: P2, palm, tip: polar(palm, a2, plateR + ext) },
    rayA: ramp(dev, 1.9, 2.4) * (1 - 0.6 * notch),
    grooveA: ramp(dev, 2.3, 2.9) * (1 - notch) ** 2,
  };
}

/** Always-visible age read-out (bottom-left), like the timecode on a microscope camera. */
export function AgeHud({ value, unit, caption, x = 40, y = 606 }: { value: string | number; unit: string; caption: string; x?: number; y?: number }) {
  return (
    <g pointerEvents="none">
      <text x={x} y={y - 34} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        {caption}
      </text>
      <text x={x} y={y} fill="#f1eee8" fontSize={30} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
        <tspan fill="#b4afa6" fontSize={16} fontWeight={500} dx={2}>
          {unit}
        </tspan>
      </text>
    </g>
  );
}
