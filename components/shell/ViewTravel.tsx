'use client';

import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { PaneContext } from '@/components/kit/context';
import type { PlaneKind, ViewDef } from '@/lib/sim/types';
import { PLANE_TEXT } from './Locator';
import { cutOf, modelOf, poly, shapeFor, type Axis, type Model, type SpecimenShape, type V3 } from './Specimen';

/**
 * The camera move between two views of the same body. The picture on screen does not just cut to
 * another drawing: the camera pulls back until the drawing lies on its own section plane inside a
 * modelled embryo, the cutting plane turns (or slides) to the new cut while the body's section follows
 * it live, and the camera closes in on the new plane until its drawing fills the stage. The body's
 * own directions (cranial, dorsal, left…) ride along and end at the stage edges, where the new view
 * names them. The student sees where both cuts lie and which way is up before reading the new picture.
 */

// ---- small vector kit ---------------------------------------------------------------------------

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];
const axisVec = (a: Axis): V3 => [a === 0 ? 1 : 0, a === 1 ? 1 : 0, a === 2 ? 1 : 0];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Camera easing: slow away, slow arrival, never a rush in between (smootherstep). */
const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));
/** 0 → 1 between a and b. */
const ramp = (p: number, a: number, b: number) => ease((p - a) / (b - a));
/** Turned round the vertical (cranial) axis. */
const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];

type Quat = [number, number, number, number];

/** Rotation (rows: screen right, screen up, towards the viewer, in world axes) as a quaternion. */
function quatOf(r: V3, u: V3, n: V3): Quat {
  const [m00, m01, m02] = r;
  const [m10, m11, m12] = u;
  const [m20, m21, m22] = n;
  const tr = m00 + m11 + m22;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    return [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s];
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s];
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s];
}

function rowsOf([x, y, z, w]: Quat): [V3, V3, V3] {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function slerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const c: Quat = d < 0 ? [-b[0], -b[1], -b[2], -b[3]] : [...b];
  d = Math.abs(d);
  if (d > 0.9995) {
    const q = a.map((v, i) => lerp(v, c[i], t)) as Quat;
    const l = Math.hypot(...q);
    return q.map((v) => v / l) as Quat;
  }
  const th = Math.acos(d);
  const s = Math.sin(th);
  const ka = Math.sin((1 - t) * th) / s;
  const kb = Math.sin(t * th) / s;
  return a.map((v, i) => v * ka + c[i] * kb) as Quat;
}

// ---- where each view lies in the body ----------------------------------------------------------

/** The body the move is shown on: the C embryo of the 4th–8th weeks (the modelled one). */
const BODIES: SpecimenShape[] = ['c'];

/** The world direction an orientation word points to (x dorsal, y cranial, z the body's left). */
function dirOf(label: string | undefined): V3 | null {
  if (!label) return null;
  const w = label.toLowerCase();
  const at = (s: string) => w.startsWith(s);
  if (at('dortsal') || at('atzea')) return [1, 0, 0];
  if (at('bentral') || at('aurrea')) return [-1, 0, 0];
  if (at('kraneal')) return [0, 1, 0];
  if (at('kaudal')) return [0, -1, 0];
  if (at('ezker')) return [0, 0, 1];
  if (at('eskuin')) return [0, 0, -1];
  return null;
}

/** A view laid on its plane: centre, screen-right and screen-up of the drawing, its normal (towards the viewer) and size. */
export interface Frame {
  axis: Axis;
  at: number;
  center: V3;
  r: V3;
  u: V3;
  n: V3;
  /** Drawing width and height in world units. */
  w: number;
  h: number;
  /** Nothing fixes which way the drawing's right points (no left/right edge): it may be mirrored to face the camera. */
  free: boolean;
  /** The stretch of the body the drawing shows (0 = head … 1 = tail end). */
  span: [number, number];
}

const PLANES: PlaneKind[] = ['sagitala', 'zeharkakoa', 'koronala'];

export function frameOf(view: ViewDef, m: Model): Frame | null {
  const plane = view.plane === 'eskema' || view.plane === 'kanpokoa' ? view.frame : view.plane;
  if (!plane || !PLANES.includes(plane)) return null;
  const cut = cutOf(plane, m, view.locator?.level ?? 0.5);
  if (!cut) return null;
  const o = view.orientation ?? {};
  const top = dirOf(o.top);
  const bottom = dirOf(o.bottom);
  const u = top ?? (bottom ? neg(bottom) : null);
  if (!u || u[cut.axis] !== 0) return null;
  const right = dirOf(o.right);
  const left = dirOf(o.left);
  const fixed = right ?? (left ? neg(left) : null);
  if (fixed && (fixed[cut.axis] !== 0 || dot(fixed, u) !== 0)) return null;
  const r = fixed ?? cross(u, axisVec(cut.axis));
  const n = cross(r, u);

  // The drawing is centred where the body crosses the plane (for the C body's horizontal cut, the trunk at the back).
  const e = [m.ext.x, m.ext.y, m.ext.z];
  const center: V3 = [(e[0][0] + e[0][1]) / 2, (e[1][0] + e[1][1]) / 2, 0];
  center[cut.axis] = cut.at;
  if (m.tube && cut.axis === 1) {
    let best = -Infinity;
    const pts = m.tube.pts;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1][1] - cut.at;
      const b = pts[i][1] - cut.at;
      if (a === 0 || a * b < 0) best = Math.max(best, pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * (a / (a - b)));
    }
    if (best > -Infinity) center[0] = best;
  }
  const room = (v: V3) => {
    const a = v.findIndex((c) => c !== 0);
    return Math.max(10, Math.min(center[a] - e[a][0], e[a][1] - center[a]));
  };
  const w = Math.min(2 * room(r), 2 * room(u) * (1000 / 640));
  return { axis: cut.axis, at: cut.at, center, r, u, n, w, h: w * 0.64, free: !fixed, span: view.span ?? [0, 1] };
}

type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface TravelPlan {
  shape: SpecimenShape;
  day: number;
  from: Frame;
  to: Frame;
  fromLabel: string;
  toLabel: string;
  fromPlane: PlaneKind;
  toPlane: PlaneKind;
  /** The words the new view puts on its edges (the body's directions ride there at the end). */
  words: Partial<Record<Edge, string>>;
}

/** Where the camera looks from between the two views: the embryo's left side, a little from the front and above, turned so both drawings face it. */
function heroDir(a: Frame, b: Frame): V3 {
  const h: V3 = [-0.35, 0.45, 1];
  const least = [0.55, 0.6, 0.8];
  for (const f of [a, b]) h[f.axis] = Math.sign(f.n[f.axis]) * Math.max(Math.abs(h[f.axis]), least[f.axis]);
  return norm(h);
}

/**
 * The camera move from one view to the other, or null when there is none to show: another object
 * (another week's body), a view not laid in a plane of the body, or the same plane at the same place.
 */
export function travelPlan(week: number, day: number, from: ViewDef, to: ViewDef, fromDay = day): TravelPlan | null {
  if (from.travel === false || to.travel === false) return null;
  const shape = shapeFor(week, day, to.plane);
  if (!BODIES.includes(shape) || shapeFor(week, fromDay, from.plane) !== shape) return null;
  const m = modelOf(shape, day);
  let a = frameOf(from, m);
  let b = frameOf(to, m);
  if (!a || !b) return null;
  if (a.axis === b.axis && Math.abs(a.at - b.at) < 4 && dot(a.n, b.n) > 0.9) return null;
  // A drawing with no left/right edge may face either side: the side the camera will look from.
  const turned = (f: Frame): Frame => ({ ...f, r: neg(f.r), n: neg(f.n) });
  const base: V3 = [-0.35, 0.45, 1];
  if (a.free && dot(a.n, base) < 0) a = turned(a);
  if (b.free && dot(b.n, base) < 0) b = turned(b);
  if (a.axis === b.axis && dot(a.n, b.n) < 0) {
    if (b.free) b = turned(b);
    else if (a.free) a = turned(a);
  }
  const kind = (v: ViewDef) => (v.plane === 'eskema' || v.plane === 'kanpokoa' ? v.frame : v.plane) ?? v.plane;
  return { shape, day, from: a, to: b, fromLabel: from.label, toLabel: to.label, fromPlane: kind(from), toPlane: kind(to), words: { ...to.orientation } };
}

// ---- camera -----------------------------------------------------------------------------------

interface Cam {
  q: Quat;
  /** Pixels per world unit. */
  s: number;
  /** World point at the middle of the stage. */
  c: V3;
}

const W = 1000;
const H = 640;
const MID: [number, number] = [W / 2, H / 2];

/** The camera square to a frame, so close that its drawing fills the stage exactly. */
const facing = (f: Frame): Cam => ({ q: quatOf(f.r, f.u, f.n), s: W / f.w, c: f.center });

/** Screen axes for a camera looking along −n, cranial kept up. */
function rowsFrom(n: V3): [V3, V3, V3] {
  const Y: V3 = [0, 1, 0];
  const u = norm(sub(Y, mul(n, dot(Y, n))));
  return [cross(u, n), u, n];
}

const between = (a: Cam, b: Cam, t: number): Cam => ({
  q: slerp(a.q, b.q, t),
  s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
  c: lerp3(a.c, b.c, t),
});

function projector(cam: Cam) {
  const rows = rowsOf(cam.q);
  const [r, u] = rows;
  return {
    rows,
    P: (v: V3): [number, number] => {
      const d = sub(v, cam.c);
      return [MID[0] + cam.s * dot(r, d), MID[1] - cam.s * dot(u, d)];
    },
  };
}

/** SVG matrix that lays the 1000 × 640 drawing of a frame where the camera sees that frame. */
function pictureMatrix(cam: Cam, f: Frame) {
  const [rr, uu] = rowsOf(cam.q);
  const A: [number, number] = [dot(rr, f.r), dot(uu, f.r)];
  const B: [number, number] = [dot(rr, f.u), dot(uu, f.u)];
  const D: [number, number] = [dot(rr, sub(f.center, cam.c)), dot(uu, sub(f.center, cam.c))];
  const kx = (cam.s * f.w) / W;
  const ky = (cam.s * f.h) / H;
  const a = kx * A[0];
  const b = -kx * A[1];
  const c = -ky * B[0];
  const d = ky * B[1];
  const e = MID[0] + cam.s * D[0] - 500 * a - 320 * c;
  const g = MID[1] - cam.s * D[1] - 500 * b - 320 * d;
  return { m: `matrix(${[a, b, c, d, e, g].map((v) => v.toFixed(4)).join(' ')})`, front: a * d - b * c > 0 };
}

// ---- the embryo, modelled ---------------------------------------------------------------------

interface Ball {
  c: V3;
  r: number;
  /** Place along the body (0 = head … 1 = tail end). */
  t: number;
}

type DecalKind = 'eye' | 'lens' | 'pit' | 'mouth' | 'somite' | 'arch' | 'cord' | 'artery' | 'vein';

/** A mark painted on the surface: an ellipse of radius r (and r·k across) in the plane normal to n. */
interface Decal {
  c: V3;
  n: V3;
  a: V3;
  r: number;
  k: number;
  kind: DecalKind;
  alpha?: number;
}

type Tone = 'skin' | 'heart' | 'liver' | 'cord';

/** One rounded mass of the body (the C trunk with its head, the heart's bulge, a limb bud…), drawn as one shaded volume. */
interface Piece {
  k: string;
  balls: Ball[];
  tone: Tone;
  /** Drawn later than its depth alone would say (a bulge sits on the trunk). */
  bias: number;
  /** Counts for laying a drawing on the body's section. */
  fit: boolean;
  decals: Decal[];
}

interface Body {
  pieces: Piece[];
  center: V3;
}

/** Outline, shadow, mid tone, light and gloss of each kind of mass (painted in bands, like the scenes' own drawings). */
const TONE: Record<Tone, { edge: string; base: string; mid: string; hi: string; spec: string }> = {
  skin: { edge: '#3e1d25', base: '#b06a60', mid: '#cd8c7d', hi: '#e8ae9b', spec: '#fbdccd' },
  heart: { edge: '#45161f', base: '#a2414e', mid: '#c25f68', hi: '#e08584', spec: '#f8c4bd' },
  liver: { edge: '#3e1c1c', base: '#93514b', mid: '#ae6a60', hi: '#c98b7c', spec: '#e8beaf' },
  cord: { edge: '#36242e', base: '#9f7a85', mid: '#b8939c', hi: '#d2b2b7', spec: '#efdcdc' },
};
/** Each light band: how big against its sphere and how far towards the light. */
const BANDS: { k: string; size: number; shift: number }[] = [
  { k: 'm', size: 0.88, shift: 0.1 },
  { k: 'h', size: 0.6, shift: 0.3 },
  { k: 's', size: 0.24, shift: 0.52 },
];

/** Smooth profile through (t, value) keys. */
function profile(keys: [number, number][]) {
  return (t: number) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++)
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1];
        const [t1, v1] = keys[i];
        return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
      }
    return keys[keys.length - 1][1];
  };
}

/**
 * The C embryo of the 4th–8th weeks on the sketch's centre line: a big head (forebrain bent down over
 * the heart, the midbrain at the crown), the pharyngeal arches under the hindbrain, the heart and liver
 * bulges in the C's hollow, the somites down the back, the limb buds (upper from day 26, lower from
 * day 28, growing into paddles), the umbilical cord and a tail that shortens after the 6th week.
 */
function embryo(m: Model, shape: SpecimenShape, day: number): Body {
  const pts = m.tube!.pts;
  const big = shape === 'fetua';
  const at = (t: number): V3 => {
    const f = clamp01(t) * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    return lerp3(pts[i], pts[i + 1], f - i);
  };
  const tan = (t: number) => norm(sub(at(Math.min(1, t + 0.01)), at(Math.max(0, t - 0.01))));
  // Into the C's hollow (ventral) and out of it (dorsal).
  const inw = (t: number): V3 => {
    const T = tan(t);
    const n: V3 = [-T[1], T[0], 0];
    return dot(n, at(t)) > 0 ? neg(n) : n;
  };
  const Z: V3 = [0, 0, 1];
  const R = profile(
    big
      ? [[0, 11], [0.08, 13.5], [0.17, 14.5], [0.27, 12], [0.34, 9], [0.45, 10], [0.6, 10.4], [0.74, 9], [0.86, 5]]
      : [[0, 9], [0.07, 11.4], [0.16, 12.4], [0.26, 10.4], [0.33, 7.4], [0.42, 8.2], [0.58, 8.6], [0.72, 7.2], [0.84, 4.8], [0.93, 2.6], [1, 1.1]],
  );
  const tail = big ? 0.86 : day >= 50 ? 0.9 : day >= 42 ? 0.95 : 1;

  // The trunk and head: spheres along the centre line, closer where it is thin, plus the rounded cranium.
  const spine: Ball[] = [];
  for (let t = 0; t <= tail + 1e-6; ) {
    spine.push({ c: at(t), r: R(t), t });
    t += Math.max(0.45, R(t) * 0.3) / 122;
  }
  spine.push({ c: add(at(0.16), mul(inw(0.16), -1.6)), r: R(0.16) * 1.06, t: 0.16 });
  spine.push({ c: add(add(at(0.02), mul(tan(0.02), -1.5)), mul(inw(0.02), 0.6)), r: R(0.02) * 1.05, t: 0.02 });

  const decals: Decal[] = [];
  for (const side of [1, -1]) {
    // The eye: the optic cup with its lens, pigmented from the 6th week.
    const te = 0.065;
    // On the side of the face, looking out and a little forward (ventrally).
    const ne = norm(add(mul(Z, side * 0.9), [-0.38, -0.12, 0]));
    const ce = add(at(te), mul(ne, R(te) * 0.98));
    decals.push({ c: ce, n: ne, a: tan(te), r: R(te) * 0.24, k: 0.92, kind: 'eye', alpha: day >= 37 ? 1 : 0.6 });
    decals.push({ c: add(ce, mul(ne, 0.05)), n: ne, a: tan(te), r: R(te) * 0.1, k: 1, kind: 'lens' });
    // The otic pit behind it, by the hindbrain.
    const to = 0.25;
    const no = norm(add(mul(Z, side), mul(inw(to), 0.2)));
    decals.push({ c: add(at(to), mul(no, R(to) * 0.99)), n: no, a: tan(to), r: R(to) * 0.1, k: 1, kind: 'pit' });
    // The nasal pit at the front of the face, from the 5th week.
    if (day >= 31) {
      const nn = norm(add(mul(Z, side * 0.5), mul(inw(0.005), 0.86)));
      decals.push({ c: add(at(0.005), mul(nn, R(0.005) * 0.98)), n: nn, a: tan(0.005), r: R(0.005) * 0.12, k: 0.7, kind: 'pit' });
    }
    // The somites as a beaded ridge either side of the back (occipital → caudal, about three pairs a day).
    const pairs = Math.max(4, Math.min(38, Math.round((day - 19.5) * 3.2)));
    const fade = 1 - clamp01((day - 34) / 12);
    if (!big && fade > 0)
      for (let i = 0; i < pairs; i++) {
        const t = 0.3 + (i / 38) * 0.6;
        if (t > tail - 0.02) break;
        const n = norm(add(mul(inw(t), -0.62), mul(Z, side * 0.78)));
        decals.push({ c: add(at(t), mul(n, R(t) * 0.99)), n, a: tan(t), r: Math.max(0.55, R(t) * 0.17), k: 0.82, kind: 'somite', alpha: fade });
      }
  }
  // The mouth (stomodeum) between the forebrain and the heart.
  const nm = norm(add(inw(0.02), mul(tan(0.02), 0.3)));
  decals.push({ c: add(at(0.02), mul(nm, R(0.02) * 1.0)), n: nm, a: Z, r: R(0.02) * 0.4, k: 0.22, kind: 'mouth' });

  const pieces: Piece[] = [{ k: 'body', balls: spine, tone: 'skin', bias: 0, fit: true, decals }];

  // The heart's bulge fills the top of the hollow, the liver's lies below it.
  const bulge = (t: number, out: number, r: number): Ball => ({ c: add(at(t), mul(inw(t), R(t) + out)), r, t });
  const heartK = big ? 0.55 : day >= 44 ? 0.8 : 1;
  pieces.push({ k: 'heart', tone: 'heart', bias: 2, fit: true, decals: [], balls: [bulge(0.375, 1.6, 9.2 * heartK), bulge(0.415, 0.8, 8 * heartK)] });
  pieces.push({ k: 'liver', tone: 'liver', bias: 1, fit: true, decals: [], balls: [bulge(0.49, -0.6, 7.4), bulge(0.535, -0.4, 7.8)] });

  // The pharyngeal arches: ridges with grooves between them on the side of the neck, under the hindbrain.
  for (const side of [1, -1])
    [0.205, 0.238, 0.268].forEach((t, i) => {
      const n = norm(add(mul(inw(t), 0.62), mul(Z, side * 0.8)));
      const across = norm(cross(n, tan(t)));
      decals.push({ c: add(at(t), mul(n, R(t) * 1.0)), n, a: across, r: R(t) * (0.42 - i * 0.07), k: 0.36, kind: 'arch' });
    });

  // Limb buds: a ridge on the flank that grows out into a paddle (hand and foot plates).
  const limb = (t0: number, side: number, grow: number, lower: boolean) => {
    const R0 = R(t0);
    const root = add(add(at(t0), mul(Z, side * R0 * 0.45)), mul(inw(t0), R0 * 0.12));
    const dir = norm(add(add(mul(Z, side), mul(inw(t0), lower ? 0.3 : 0.5)), mul(tan(t0), 0.35)));
    const L = R0 * 0.55 + lerp(1.5, big ? 16 : 11, grow);
    const balls: Ball[] = [];
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      const tip = f > 0.62 ? (f - 0.62) / 0.38 : 0;
      balls.push({ c: add(root, mul(dir, L * f)), r: lerp(R0 * 0.52, 3 + grow * 1.2, f) + tip * grow * 1.6, t: t0 });
    }
    pieces.push({ k: `${lower ? 'leg' : 'arm'}${side}`, tone: 'skin', bias: 0.5, fit: false, decals: [], balls });
  };
  for (const side of [1, -1]) {
    if (day >= 26 || big) limb(0.43, side, big ? 1 : clamp01((day - 26) / 18), false);
    if (day >= 28 || big) limb(0.71, side, big ? 1 : clamp01((day - 28) / 18), true);
  }

  // The umbilical cord leaves the belly below the liver, ventrally; its cut end shows its vessels.
  const cs = add(at(0.64), mul(inw(0.64), R(0.64) * 0.55));
  const cd = norm([-1, -0.05, 0.1]);
  const CL = big ? 18 : 14;
  const cr = big ? 4 : 3.1;
  const cord: Ball[] = [];
  for (let l = 0; l <= CL; l += cr * 0.35) cord.push({ c: add(cs, mul(cd, l)), r: cr * (l < 4 ? 1.12 - l * 0.03 : 1), t: 0.64 });
  const ce = add(cs, mul(cd, CL + cr * 0.02));
  const ca: V3 = [0, 1, 0];
  const cb = cross(cd, ca);
  const cordDecals: Decal[] = [
    { c: ce, n: cd, a: ca, r: cr * 0.94, k: 1, kind: 'cord' },
    { c: add(ce, add(mul(ca, cr * 0.4), mul(cd, 0.02))), n: cd, a: ca, r: cr * 0.22, k: 1, kind: 'vein' },
    { c: add(ce, add(add(mul(ca, -cr * 0.32), mul(cb, cr * 0.36)), mul(cd, 0.02))), n: cd, a: ca, r: cr * 0.15, k: 1, kind: 'artery' },
    { c: add(ce, add(add(mul(ca, -cr * 0.32), mul(cb, -cr * 0.36)), mul(cd, 0.02))), n: cd, a: ca, r: cr * 0.15, k: 1, kind: 'artery' },
  ];
  pieces.push({ k: 'cord', tone: 'cord', bias: 1.5, fit: false, decals: cordDecals, balls: cord });

  const all = pieces.flatMap((p) => p.balls);
  const lo = [0, 1, 2].map((i) => Math.min(...all.map((b) => b.c[i] - b.r)));
  const hi = [0, 1, 2].map((i) => Math.max(...all.map((b) => b.c[i] + b.r)));
  return { pieces, center: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2] };
}

/** The body's own extent along a direction from its centre. */
const reach = (body: Body, v: V3) => Math.max(...body.pieces.flatMap((p) => p.balls.map((b) => dot(sub(b.c, body.center), v) + b.r)));

/** The camera between the two views: the whole body framed under the caption, from `dir`. */
function heroCam(dir: V3, body: Body): Cam {
  const [r, u, n] = rowsFrom(dir);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of body.pieces)
    for (const b of p.balls) {
      const x = dot(r, b.c);
      const y = dot(u, b.c);
      x0 = Math.min(x0, x - b.r);
      x1 = Math.max(x1, x + b.r);
      y0 = Math.min(y0, y - b.r);
      y1 = Math.max(y1, y + b.r);
    }
  const s = Math.min(600 / (x1 - x0), 372 / (y1 - y0));
  return { q: quatOf(r, u, n), s, c: add(mul(r, (x0 + x1) / 2), mul(u, (y0 + y1) / 2 + 12 / s)) };
}

/** The extent of the body's own section on a frame's plane, in the frame's right/up units. */
function sectionBox(body: Body, f: Frame) {
  let a0 = Infinity;
  let a1 = -Infinity;
  let b0 = Infinity;
  let b1 = -Infinity;
  for (const p of body.pieces) {
    if (!p.fit) continue;
    for (const s of p.balls) {
      // A horizontal cut through the C body can also clip the bent-down head: the drawn section is the trunk's.
      if (s.t < f.span[0] || s.t > f.span[1] || (f.axis === 1 && p.k === 'body' && s.t < 0.3)) continue;
      const d = s.c[f.axis] - f.at;
      if (Math.abs(d) >= s.r) continue;
      const rr = Math.sqrt(s.r * s.r - d * d);
      const a = dot(s.c, f.r);
      const b = dot(s.c, f.u);
      a0 = Math.min(a0, a - rr);
      a1 = Math.max(a1, a + rr);
      b0 = Math.min(b0, b - rr);
      b1 = Math.max(b1, b + rr);
    }
  }
  return a0 < a1 ? { a: (a0 + a1) / 2, b: (b0 + b1) / 2, w: a1 - a0, h: b1 - b0 } : null;
}

/**
 * The frame moved and scaled so that the anatomy of its drawing (`box`, in stage pixels) lies on the
 * body's own section: the side view over the whole C body, a cross-section as a slice of the trunk.
 */
function fitted(f: Frame, box: DOMRect | null, body: Body): Frame {
  if (!box || box.width < 20 || box.height < 20) return f;
  const sec = sectionBox(body, f);
  if (!sec) return f;
  const k = Math.sqrt((Math.max(16, sec.w * 1.12) / box.width) * (Math.max(16, sec.h * 1.12) / box.height));
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const onPlane = add(add(mul(f.r, sec.a), mul(f.u, sec.b)), mul(axisVec(f.axis), f.at));
  const center = add(sub(onPlane, mul(f.r, (cx - 500) * k)), mul(f.u, (cy - 320) * k));
  return { ...f, center, w: W * k, h: H * k };
}

/** The anatomy drawn in a scene (its structures, not its notes), in stage pixels. */
function anatomyBox(g: Element | null) {
  if (!g) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  g.querySelectorAll('[data-part]').forEach((el) => {
    const b = (el as SVGGraphicsElement).getBBox?.();
    if (!b || b.width * b.height < 4 || b.width > 990) return;
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.width);
    y1 = Math.max(y1, b.y + b.height);
  });
  return x0 < x1 ? new DOMRect(x0, y0, x1 - x0, y1 - y0) : null;
}

// ---- timeline (ms) ----------------------------------------------------------------------------

/** How long the move takes (ms). */
export const TRAVEL_MS = 5300;
/** Camera back from the old drawing to the whole body. */
const OUT: [number, number] = [0, 1550];
/** The cutting plane turns or slides from the old cut to the new one. */
const KNIFE: [number, number] = [1950, 3300];
/** Camera in to the new drawing. */
const IN: [number, number] = [3600, 5050];
/** A slow turn of the body while the camera is back, so it reads as a solid. */
const YAW = 0.16;

const TAGS: { v: V3; text: string; color: string }[] = [
  { v: [0, 1, 0], text: 'Kraneala', color: '#9dbdf8' },
  { v: [0, -1, 0], text: 'Kaudala', color: '#9dbdf8' },
  { v: [1, 0, 0], text: 'Dortsala', color: '#8fdca3' },
  { v: [-1, 0, 0], text: 'Bentrala', color: '#8fdca3' },
  { v: [0, 0, 1], text: 'Ezkerra', color: '#f5ab8c' },
  { v: [0, 0, -1], text: 'Eskuina', color: '#f5ab8c' },
];

const COPIES = ['b', 'f'] as const;
/** Light from the upper left, in screen terms. */
const LIGHT: [number, number] = [-0.58, -0.81];

export function ViewTravel({
  plan,
  old,
  children,
  onDone,
  progress,
}: {
  plan: TravelPlan;
  /** The drawing being left. */
  old: ReactNode;
  /** The drawing arrived at (it stays mounted after the move ends). */
  children: ReactNode;
  onDone: () => void;
  /** Fixed progress 0–1 (still frames for checking); otherwise it plays once. */
  progress?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const m = modelOf(plan.shape, plan.day);
  const body = embryo(m, plan.shape, plan.day);
  const heroN = heroDir(plan.from, plan.to);
  const tags = TAGS.map((tg) => {
    const word = (Object.values(plan.words) as string[]).find((w) => {
      const d = dirOf(w);
      return d && dot(d, tg.v) > 0.9;
    });
    return { ...tg, text: word ?? tg.text, at: add(body.center, mul(tg.v, reach(body, tg.v) + 6)) };
  });
  /** The two frames, once their drawings have been measured and laid on the body's section. */
  const frames = useRef<{ from: Frame; to: Frame } | null>(null);
  const root = useRef<SVGGElement>(null);
  const els = useRef<Record<string, Element>>({});
  const backdrops = useRef<{ old: SVGElement[]; new: SVGElement[] }>({ old: [], new: [] });
  const order = useRef('');
  const ref = (k: string) => ({ 'data-t': k });

  const draw = (ms: number) => {
    const R = els.current;
    const F = frames.current ?? { from: plan.from, to: plan.to };
    const hero = heroCam(heroN, body);
    const heroAt = (k: number): Cam => ({ ...hero, q: quatOf(...rowsFrom(rotY(heroN, k * YAW))) });
    const cam =
      ms < OUT[1]
        ? between(facing(F.from), heroAt(-1), glide((ms - OUT[0]) / (OUT[1] - OUT[0])))
        : ms < IN[0]
          ? heroAt(lerp(-1, 1, ease((ms - OUT[1]) / (IN[0] - OUT[1]))))
          : between(heroAt(1), facing(F.to), glide((ms - IN[0]) / (IN[1] - IN[0])));
    const { P, rows } = projector(cam);
    const set = (k: string, attrs: Record<string, string | number>) => {
      const el = R[k];
      if (el) for (const [a, v] of Object.entries(attrs)) el.setAttribute(a, typeof v === 'number' ? v.toFixed(2) : v);
    };
    const setEl = (el: Element | undefined, attrs: Record<string, string | number>) => {
      if (el) for (const [a, v] of Object.entries(attrs)) el.setAttribute(a, typeof v === 'number' ? v.toFixed(2) : v);
    };

    // How much of the studio and the body shows: in as the camera pulls back, out as it closes in.
    const seen = ramp(ms, OUT[1] * 0.5, OUT[1] * 0.95) * (1 - ramp(ms, IN[0], IN[0] + 600));
    set('studio', { opacity: ramp(ms, 0, OUT[1] * 0.45) * (1 - ramp(ms, IN[1] - 350, TRAVEL_MS - 100)) });

    // The cutting plane: on the old cut, then turned and moved to the new one.
    const kp = glide((ms - KNIFE[0]) / (KNIFE[1] - KNIFE[0]));
    const qa = quatOf(F.from.r, F.from.u, F.from.n);
    // The same plane seen from its other side (from above → from below): the knife stays, only the camera goes round.
    const flip = F.from.axis === F.to.axis && dot(F.from.n, F.to.n) < 0;
    const qb = flip ? qa : quatOf(F.to.r, F.to.u, F.to.n);
    const [kr, ku, kn] = rowsOf(slerp(qa, qb, kp));
    const onA: V3 = [...body.center];
    onA[F.from.axis] = F.from.at;
    const onB: V3 = [...body.center];
    onB[F.to.axis] = F.to.at;
    const kc = lerp3(onA, onB, kp);
    const toward = dot(rows[2], kn);
    // Whatever lies between the camera and the plane is shown as glass, so the cut face can be seen.
    const ghost = Math.min(1, Math.abs(toward) * 2.6);
    const isFront = (c: V3) => dot(sub(c, kc), kn) * toward > 0;

    for (const copy of COPIES) set(copy, { opacity: copy === 'b' ? seen : seen * lerp(1, 0.7, ghost) });
    // Draw order by depth: far masses first.
    const depth = body.pieces.map((p, i) => {
      const c = p.balls.reduce((s, b) => add(s, b.c), [0, 0, 0] as V3);
      return { i, d: dot(rows[2], mul(c, 1 / p.balls.length)) + p.bias * 0.8 };
    });
    const sorted = depth.sort((a, b) => a.d - b.d).map((x) => x.i);
    const key = sorted.join(',');
    if (key !== order.current) {
      order.current = key;
      for (const copy of COPIES) {
        const host = R[copy];
        if (host) for (const i of sorted) host.appendChild(R[`${copy}${body.pieces[i].k}`]);
      }
    }
    const ew = Math.min(2.2, Math.max(1.1, cam.s * 0.08));
    for (const p of body.pieces) {
      for (const copy of COPIES) {
        const layer = (n: string) => R[`${copy}${p.k}-${n}`]?.children;
        const eL = layer('e');
        const bL = layer('b');
        const lit = BANDS.map((band) => ({ ...band, el: layer(band.k) }));
        p.balls.forEach((b, i) => {
          const [x, y] = P(b.c);
          const rr = isFront(b.c) === (copy === 'f') ? b.r * cam.s : 0;
          setEl(eL?.[i], { cx: x, cy: y, r: rr ? rr + ew : 0 });
          setEl(bL?.[i], { cx: x, cy: y, r: rr });
          for (const band of lit) setEl(band.el?.[i], { cx: x + LIGHT[0] * rr * band.shift, cy: y + LIGHT[1] * rr * band.shift, r: rr * band.size });
        });
        const dL = layer('d');
        p.decals.forEach((d, i) => {
          const nz = dot(d.n, rows[2]);
          if (nz < 0.05 || isFront(d.c) !== (copy === 'f')) return setEl(dL?.[i], { d: '' });
          const bx = cross(d.n, d.a);
          const ring: [number, number][] = [];
          for (let j = 0; j < 16; j++) {
            const th = (j / 16) * Math.PI * 2;
            ring.push(P(add(d.c, add(mul(d.a, d.r * Math.cos(th)), mul(bx, d.r * d.k * Math.sin(th))))));
          }
          setEl(dL?.[i], { d: poly(ring), opacity: (d.alpha ?? 1) * ramp(nz, 0.05, 0.3) });
        });
      }
    }

    // The section the plane cuts from the body (all of it, the head too where it is crossed).
    const knifeSeen = ramp(ms, OUT[1] * 0.5, OUT[1] * 0.95) * (1 - ramp(ms, IN[0] + 250, IN[1] - 400));
    const discs: string[] = [];
    for (const p of body.pieces)
      for (const b of p.balls) {
        const d = dot(sub(b.c, kc), kn);
        if (Math.abs(d) >= b.r * 0.995) continue;
        const rho = Math.sqrt(b.r * b.r - d * d);
        const q = sub(b.c, mul(kn, d));
        const ring: [number, number][] = [];
        for (let j = 0; j < 20; j++) {
          const th = (j / 20) * Math.PI * 2;
          ring.push(P(add(q, add(mul(kr, rho * Math.cos(th)), mul(ku, rho * Math.sin(th))))));
        }
        discs.push(poly(ring));
      }
    const sec = discs.join(' ');
    // White on the old cut, amber once it reaches the new one.
    const warm = ramp(kp, 0.35, 1);
    set('sec', { opacity: seen * knifeSeen * ramp(ms, KNIFE[0] - 250, KNIFE[0] + 250) });
    set('sec-fill', { d: sec, fill: mix('#e9eefb', '#fde3b0', warm) });
    set('sec-edge', { d: sec, stroke: mix('#f2f5fd', '#fbbf24', warm) });
    set('halo', { opacity: seen });

    // The plane itself: a sheet framing the body, through the cut.
    const sheet = (c: V3, r: V3, u: V3) => {
      const ext = (v: V3) => Math.max(...body.pieces.flatMap((p) => p.balls.map((b) => Math.abs(dot(sub(b.c, c), v)) + b.r))) + 5;
      const hw = ext(r);
      const hh = ext(u);
      const at = (x: number, y: number) => P(add(c, add(mul(r, x), mul(u, y))));
      return poly([at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)]);
    };
    const kq = sheet(kc, kr, ku);
    set('knife', { opacity: knifeSeen });
    set('knife-glass', { d: kq, fill: mix('#c9d6f2', '#fbbf24', warm), 'fill-opacity': lerp(0.07, 0.11, warm) });
    set('knife-edge', { d: kq, opacity: knifeSeen, stroke: mix('#e8eefc', '#fbbf24', warm) });
    const arrive = ramp(ms, KNIFE[1] - 150, KNIFE[1] + 200) * (1 - ramp(ms, KNIFE[1] + 450, KNIFE[1] + 1100));
    set('knife-glow', { d: kq, opacity: knifeSeen * (0.25 + arrive * 0.75) * warm });
    // Where the old cut was, once the plane has left it.
    const aq = sheet(onA, F.from.r, F.from.u);
    set('was-plane', { d: aq, opacity: ramp(ms, KNIFE[0], KNIFE[0] + 300) * 0.8 * (1 - ramp(ms, IN[0], IN[0] + 400)) });

    // The two drawings, each on its plane.
    const a = pictureMatrix(cam, F.from);
    const b = pictureMatrix(cam, F.to);
    set('old-names', { opacity: 1 - ramp(ms, 0, 380) });
    set('old', { transform: a.m, opacity: a.front ? 1 - ramp(ms, KNIFE[0] - 200, KNIFE[0] + 300) : 0 });
    set('new', { transform: b.m, opacity: b.front ? ramp(ms, KNIFE[1] - 50, KNIFE[1] + 500) : 0 });
    backdrops.current.old.forEach((el) => el.setAttribute('opacity', (1 - ramp(ms, 100, OUT[1] * 0.5)).toFixed(3)));
    backdrops.current.new.forEach((el) => el.setAttribute('opacity', ramp(ms, IN[1] - 650, IN[1]).toFixed(3)));

    // The body's directions: beside it while the camera is back, then pushed to the stage edges.
    const tagSeen = ramp(ms, OUT[1] * 0.6, OUT[1]) * (1 - ramp(ms, TRAVEL_MS - 250, TRAVEL_MS));
    tags.forEach((tg, i) => {
      const along = Math.abs(dot(tg.v, rows[2]));
      let [x, y] = P(tg.at);
      const w = tg.text.length * 7.6 + 30;
      const bx = 500 - w / 2 - 14;
      const by = 290;
      const dx = x - MID[0];
      const dy = y - MID[1];
      const k = Math.min(1, Math.abs(dx) > bx ? bx / Math.abs(dx) : 1, Math.abs(dy) > by ? by / Math.abs(dy) : 1);
      x = MID[0] + dx * k;
      y = MID[1] + dy * k;
      // Closing in, each direction the new view names on an edge slides to the middle of that edge, where the view writes it.
      const up = dot(tg.v, F.to.u);
      const right = dot(tg.v, F.to.r);
      const edge: [number, number] | null =
        up > 0.9 ? [500, 26] : up < -0.9 ? [500, 614] : right > 0.9 ? [W - 16 - w / 2, 320] : right < -0.9 ? [16 + w / 2, 320] : null;
      if (edge) {
        const e = glide((ms - IN[0] - 200) / (IN[1] - IN[0] - 200));
        x = lerp(x, edge[0], e);
        y = lerp(y, edge[1], e);
      }
      const ang = (Math.atan2(-dot(tg.v, rows[1]), dot(tg.v, rows[0])) * 180) / Math.PI;
      set(`tag${i}`, { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, opacity: tagSeen * ramp(1 - along, 0.22, 0.5) });
      set(`tag${i}-arrow`, { transform: `translate(${(-w / 2 + 13).toFixed(1)},0) rotate(${(ang + 90).toFixed(1)})` });
    });

    set('caption', { opacity: ramp(ms, 0, 450) * (1 - ramp(ms, IN[0] + 300, IN[0] + 800)) });
    set('legend', { opacity: ramp(ms, OUT[1] * 0.4, OUT[1] * 0.8) * (1 - ramp(ms, IN[0] + 300, IN[0] + 800)) });
    set('was', { opacity: 1 - 0.45 * ramp(ms, KNIFE[0], KNIFE[1]) });
    set('now', { opacity: 0.55 + 0.45 * ramp(ms, KNIFE[0], KNIFE[1]) });
    set('hint', { opacity: ramp(ms, OUT[1] * 0.4, OUT[1] * 0.8) * (1 - ramp(ms, IN[1] - 400, IN[1])) });
  };

  const finish = useEffectEvent(onDone);
  const paint = useEffectEvent(draw);
  const measure = useEffectEvent(() => {
    const map: Record<string, Element> = {};
    root.current?.querySelectorAll('[data-t]').forEach((el) => (map[el.getAttribute('data-t')!] = el));
    els.current = map;
    frames.current = { from: fitted(plan.from, anatomyBox(map.old), body), to: fitted(plan.to, anatomyBox(map.new), body) };
    // A drawing's own full-stage backdrop would show as a dark card in the studio: it fades out as the camera pulls back.
    for (const k of ['old', 'new'] as const)
      backdrops.current[k] = [...(map[k]?.querySelectorAll('rect,path') ?? [])].filter((el) => {
        const b = (el as SVGGraphicsElement).getBBox?.();
        return !!b && b.width > 900 && b.height > 560;
      }) as SVGElement[];
  });
  useLayoutEffect(() => {
    if (!frames.current) measure();
    paint((progress ?? 0) * TRAVEL_MS);
  }, [progress]);
  useEffect(() => {
    if (progress !== undefined) return;
    let raf = 0;
    let start = 0;
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      finish();
    };
    const tick = (now: number) => {
      if (!start) start = now;
      const ms = Math.min(TRAVEL_MS, now - start);
      paint(ms);
      if (ms < TRAVEL_MS) raf = requestAnimationFrame(tick);
      else end();
    };
    raf = requestAnimationFrame(tick);
    // Never left half-way (a tab in the background stops animation frames).
    const safety = window.setTimeout(end, TRAVEL_MS + 2500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.removeEventListener('keydown', onKey);
    };
  }, [progress]);

  const fromKind = PLANE_TEXT[plan.fromPlane].name.toLowerCase();
  const toKind = PLANE_TEXT[plan.toPlane].name.toLowerCase();
  const title = `${plan.fromLabel}  →  ${plan.toLabel}`;
  const pillW = Math.max(380, title.length * 10.4 + 72);
  const sameCut = plan.from.axis === plan.to.axis && Math.abs(plan.from.at - plan.to.at) < 4;
  const legend = [`Lehen: ${fromKind}`, fromKind !== toKind ? `Orain: ${toKind}` : sameCut ? `Orain: ${toKind}, maila berean` : `Orain: ${toKind}, beste maila batean`];
  const legendW = Math.max(330, (legend[0].length + legend[1].length) * 7.9 + 130);
  const sans = 'var(--font-sans, system-ui)';
  const decalStyle = (d: Decal) => DECAL[d.kind];

  return (
    <g ref={root} className="travel" aria-hidden>
      <defs>
        <radialGradient id={`${uid}studio`} cx="50%" cy="48%" r="64%">
          <stop offset="0" stopColor="#1e2638" />
          <stop offset="0.62" stopColor="#10141e" />
          <stop offset="1" stopColor="#07090d" />
        </radialGradient>
        <radialGradient id={`${uid}halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f3c2b0" stopOpacity={0.1} />
          <stop offset="1" stopColor="#f3c2b0" stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect {...ref('studio')} width={W} height={H} fill={`url(#${uid}studio)`} opacity={0} />
      {/* The old view's names stay where they were for a moment and fade, instead of vanishing. */}
      <g {...ref('old-names')} className="travel-names" pointerEvents="none">
        {old}
      </g>
      <ellipse cx={500} cy={332} rx={330} ry={230} fill={`url(#${uid}halo)`} opacity={0} {...ref('halo')} />

      <BodyCopy copy="b" body={body} at={ref} decalStyle={decalStyle} />

      {/* The cutting plane and the body's section on it. */}
      <path {...ref('was-plane')} fill="rgba(232,238,252,0.04)" stroke="rgba(232,238,252,0.5)" strokeWidth={1.2} strokeLinejoin="round" opacity={0} />
      <g {...ref('knife')} opacity={0}>
        <path {...ref('knife-glass')} d="" />
      </g>

      <BodyCopy copy="f" body={body} at={ref} decalStyle={decalStyle} />

      {/* The cut face and the drawings lie over the glass half, as seen through it. */}
      <g {...ref('sec')} opacity={0}>
        <path {...ref('sec-edge')} fill="none" strokeWidth={3.2} strokeLinejoin="round" />
        <path {...ref('sec-fill')} fillOpacity={0.9} />
      </g>
      <g {...ref('old')} opacity={0} pointerEvents="none">
        <PaneContext.Provider value={true}>{old}</PaneContext.Provider>
      </g>
      <g {...ref('new')} opacity={0} pointerEvents="none">
        <PaneContext.Provider value={true}>{children}</PaneContext.Provider>
      </g>

      <path {...ref('knife-glow')} fill="none" stroke="#fbbf24" strokeWidth={7} strokeLinejoin="round" filter={`url(#${uid}glow)`} opacity={0} />
      <path {...ref('knife-edge')} fill="none" strokeWidth={1.8} strokeLinejoin="round" opacity={0} />

      {tags.map((tg, i) => {
        const w = tg.text.length * 7.6 + 30;
        return (
          <g key={tg.text} {...ref(`tag${i}`)} opacity={0}>
            <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill="rgba(10,12,18,0.84)" stroke={tg.color} strokeOpacity={0.45} />
            <path {...ref(`tag${i}-arrow`)} d="M-4.2,2.6 L0,-4.6 L4.2,2.6Z" fill={tg.color} />
            <text x={8} dy="0.35em" textAnchor="middle" style={{ font: `600 12.5px ${sans}`, fill: tg.color }}>
              {tg.text}
            </text>
          </g>
        );
      })}

      <g {...ref('caption')} opacity={0}>
        <rect x={500 - pillW / 2} y={14} width={pillW} height={60} rx={16} fill="rgba(12,14,20,0.84)" stroke="rgba(255,255,255,0.09)" />
        <text x={500} y={35} textAnchor="middle" style={{ font: '600 10.5px var(--font-mono, monospace)', letterSpacing: '0.16em', fill: '#fbbf24' }}>
          IKUSPEGIA ALDATZEN
        </text>
        <text x={500} y={60} textAnchor="middle" style={{ font: `650 19px ${sans}`, fill: '#e8eefc' }}>
          <tspan {...ref('was')} fill="rgba(232,238,252,0.85)">
            {plan.fromLabel}
          </tspan>
          <tspan fill="#fbbf24">{'  →  '}</tspan>
          <tspan {...ref('now')}>{plan.toLabel}</tspan>
        </text>
      </g>

      <g {...ref('legend')} opacity={0}>
        <rect x={500 - legendW / 2} y={H - 52} width={legendW} height={34} rx={17} fill="rgba(12,14,20,0.84)" stroke="rgba(255,255,255,0.09)" />
        <g transform={`translate(${500 - legendW / 2 + 22},${H - 35})`}>
          <rect x={0} y={-7} width={18} height={13} rx={2} fill="rgba(232,238,252,0.1)" stroke="rgba(232,238,252,0.75)" />
          <text x={26} dy="0.35em" style={{ font: `500 14px ${sans}`, fill: 'rgba(232,238,252,0.85)' }}>
            {legend[0]}
          </text>
          <rect x={legend[0].length * 7.9 + 50} y={-7} width={18} height={13} rx={2} fill="rgba(251,191,36,0.2)" stroke="#fbbf24" />
          <text x={legend[0].length * 7.9 + 76} dy="0.35em" style={{ font: `600 14px ${sans}`, fill: '#fde68a' }}>
            {legend[1]}
          </text>
        </g>
      </g>

      {progress === undefined && (
        <g
          className="travel-skip"
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
          pointerEvents="all"
        >
          <rect width={W} height={H} fill="transparent" />
          <text {...ref('hint')} x={W - 24} y={H - 28} textAnchor="end" opacity={0} style={{ font: `500 12px ${sans}`, fill: 'rgba(232,238,252,0.55)' }}>
            Klik edo Esc: saltatu
          </text>
        </g>
      )}
    </g>
  );
}

const DECAL: Record<DecalKind, Record<string, string | number>> = {
  eye: { fill: '#2a161c', stroke: '#6b3a40', strokeWidth: 1 },
  lens: { fill: '#c99b92' },
  pit: { fill: '#7c4448', stroke: '#5a2c33', strokeWidth: 0.6 },
  mouth: { fill: '#3a1b22' },
  somite: { fill: 'rgba(255,226,212,0.42)', stroke: 'rgba(92,44,50,0.45)', strokeWidth: 0.8 },
  arch: { fill: 'rgba(246,196,178,0.55)', stroke: 'rgba(80,36,44,0.6)', strokeWidth: 1.1 },
  cord: { fill: '#ead0cf', stroke: '#8d6470', strokeWidth: 1 },
  artery: { fill: '#c0392b' },
  vein: { fill: '#3b5bb5' },
};

/** Mix of two #rrggbb colours. */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`;
}

/**
 * One copy of the body: `b` is what lies beyond the cutting plane (solid), `f` what lies on the
 * camera's side of it (shown as glass). Every mass is an outline, a shadow tone and three bands of
 * light shifted towards the light, each a union of circles.
 */
function BodyCopy({
  copy,
  body,
  at,
  decalStyle,
}: {
  copy: (typeof COPIES)[number];
  body: Body;
  at: (k: string) => { 'data-t': string };
  decalStyle: (d: Decal) => Record<string, string | number>;
}) {
  return (
    <g {...at(copy)} opacity={0}>
      {body.pieces.map((p) => {
        const tone = TONE[p.tone];
        const circles = p.balls.map((_, i) => <circle key={i} r={0} />);
        return (
          <g key={p.k} {...at(`${copy}${p.k}`)}>
            <g {...at(`${copy}${p.k}-e`)} fill={tone.edge}>
              {circles}
            </g>
            <g {...at(`${copy}${p.k}-b`)} fill={tone.base}>
              {circles}
            </g>
            {BANDS.map((band) => (
              <g key={band.k} {...at(`${copy}${p.k}-${band.k}`)} fill={band.k === 'm' ? tone.mid : band.k === 'h' ? tone.hi : tone.spec} opacity={band.k === 's' ? 0.7 : 1}>
                {circles}
              </g>
            ))}
            <g {...at(`${copy}${p.k}-d`)}>
              {p.decals.map((d, i) => (
                <path key={i} d="" {...decalStyle(d)} />
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}
