'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useRef, type ReactNode } from 'react';
import { PaneContext } from '@/components/kit/context';
import type { PlaneKind, ViewDef } from '@/lib/sim/types';
import { PLANE_TEXT } from './Locator';
import { cutOf, hull, modelOf, poly, shapeFor, type Axis, type Model, type SpecimenShape, type V3 } from './Specimen';

/**
 * The camera move between two views of the same body. When the simulation changes the view, the
 * picture on screen does not just cut to another drawing: it shrinks back onto its own section plane
 * inside a 3-D sketch of the embryo, the camera turns round the embryo to the new plane, and the new
 * drawing grows out of that plane until it fills the stage. The student sees where both cuts lie
 * and which way is up, before reading the new picture.
 */

// ---- small vector kit ---------------------------------------------------------------------------

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const axisVec = (a: Axis): V3 => [a === 0 ? 1 : 0, a === 1 ? 1 : 0, a === 2 ? 1 : 0];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Camera easing: slow away, slow arrival. */
const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
/** 0 → 1 between a and b. */
const ramp = (p: number, a: number, b: number) => ease((p - a) / (b - a));

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

// ---- where each view lies in the sketch --------------------------------------------------------

const TUBES: SpecimenShape[] = ['c', 'fetua', 'karena'];
const FLATS: SpecimenShape[] = ['diskoa', 'tolesten'];

/** The world direction an orientation word points to (x/y/z as in Specimen). Left/right follow the body's own. */
function dirOf(label: string | undefined, shape: SpecimenShape): V3 | null {
  if (!label) return null;
  const w = label.toLowerCase();
  const tube = TUBES.includes(shape);
  const at = (s: string) => w.startsWith(s);
  if (at('dortsal') || at('atzea')) return tube ? [1, 0, 0] : [0, 1, 0];
  if (at('bentral') || at('aurrea')) return tube ? [-1, 0, 0] : [0, -1, 0];
  if (at('kraneal')) return tube ? [0, 1, 0] : [-1, 0, 0];
  if (at('kaudal')) return tube ? [0, -1, 0] : [1, 0, 0];
  if (at('ezker')) return [0, 0, 1];
  if (at('eskuin')) return [0, 0, -1];
  return null;
}
const neg = (v: V3 | null): V3 | null => (v ? [-v[0], -v[1], -v[2]] : null);

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
  /** Nothing fixes which way the drawing's right points (no left/right edge): it may be mirrored to face the other view. */
  free: boolean;
  /** The stretch of the body the drawing shows (0 = head … 1 = tail end). */
  span: [number, number];
}

const PLANES: PlaneKind[] = ['sagitala', 'zeharkakoa', 'koronala'];

export function frameOf(view: ViewDef, m: Model, shape: SpecimenShape): Frame | null {
  if (!TUBES.includes(shape) && !FLATS.includes(shape)) return null;
  const plane = view.plane === 'eskema' ? view.frame : view.plane;
  if (!plane || !PLANES.includes(plane)) return null;
  const cut = cutOf(plane, m, view.locator?.level ?? 0.5);
  if (!cut) return null;
  const o = view.orientation ?? {};
  const u = dirOf(o.top, shape) ?? neg(dirOf(o.bottom, shape));
  if (!u || u[cut.axis] !== 0) return null;
  const fixed = dirOf(o.right, shape) ?? neg(dirOf(o.left, shape));
  if (fixed && (fixed[cut.axis] !== 0 || dot(fixed, u) !== 0)) return null;
  const r = fixed ?? cross(u, axisVec(cut.axis));
  const n = cross(r, u);

  // The drawing is centred where the body crosses the plane (for the C body's horizontal cut, the trunk).
  const e = [m.ext.x, m.ext.y, m.ext.z];
  const center: V3 = [(e[0][0] + e[0][1]) / 2, (e[1][0] + e[1][1]) / 2, 0];
  if (FLATS.includes(shape)) center[1] = m.spot[1];
  center[cut.axis] = cut.at;
  if (m.tube && cut.axis === 1) {
    let best = -Infinity;
    const pts = m.tube.pts;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1][1] - cut.at;
      const b = pts[i][1] - cut.at;
      if (a === 0 || a * b < 0) {
        const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * (a / (a - b));
        best = Math.max(best, x);
      }
    }
    if (best > -Infinity) center[0] = best;
  }
  // As big as the plane allows around that centre, at the stage's 1000 × 640 proportions.
  const room = (v: V3) => {
    const a = v.findIndex((c) => c !== 0);
    return Math.max(10, Math.min(center[a] - e[a][0], e[a][1] - center[a]));
  };
  const w = Math.min(2 * room(r), 2 * room(u) * (1000 / 640));
  return {
    axis: cut.axis,
    at: cut.at,
    center,
    r,
    u,
    n,
    w,
    h: w * 0.64,
    free: !fixed,
    span: view.span ?? [0, 1],
  };
}

export interface TravelPlan {
  shape: SpecimenShape;
  day: number;
  from: Frame;
  to: Frame;
  fromLabel: string;
  toLabel: string;
  fromPlane: PlaneKind;
  toPlane: PlaneKind;
}

/**
 * The camera move from one view to the other, or null when there is none to show: another object
 * (another week's body), a view that is not laid in a plane, or the same plane at the same place.
 */
export function travelPlan(week: number, day: number, from: ViewDef, to: ViewDef, fromDay = day): TravelPlan | null {
  const shape = shapeFor(week, day, to.plane);
  if (shapeFor(week, fromDay, from.plane) !== shape) return null;
  const m = modelOf(shape, day);
  let a = frameOf(from, m, shape);
  let b = frameOf(to, m, shape);
  if (!a || !b) return null;
  if (a.axis === b.axis && Math.abs(a.at - b.at) < 4 && dot(a.n, b.n) > 0.9) return null;
  // A drawing with no left/right edge may face either side: face the same side as the other one.
  const turned = (f: Frame): Frame => ({ ...f, r: neg(f.r)!, n: neg(f.n)! });
  if (dot(a.n, b.n) < -1e-6) {
    if (b.free) b = turned(b);
    else if (a.free) a = turned(a);
  }
  const kind = (v: ViewDef) => (v.plane === 'eskema' ? v.frame : v.plane) ?? v.plane;
  return {
    shape,
    day,
    from: a,
    to: b,
    fromLabel: from.label,
    toLabel: to.label,
    fromPlane: kind(from),
    toPlane: kind(to),
  };
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
const MID: [number, number] = [W / 2, H / 2 + 14];

/** The camera square to a frame, so close that its drawing fills the stage exactly. */
const facing = (f: Frame): Cam => ({
  q: quatOf(f.r, f.u, f.n),
  s: W / f.w,
  c: f.center,
});

/** Between the two: back from the body, looking at both planes from their front side, cranial (or dorsal) up. */
function overview(a: Frame, b: Frame, m: Model, shape: SpecimenShape): Cam {
  const tilt: V3 = norm(TUBES.includes(shape) ? [0.3, 0.42, 1] : [0.25, 0.6, 1]);
  // Two parallel planes (the same cut, higher or lower) are best seen from the side, so the move between them shows.
  const mid = add(a.n, b.n);
  let n: V3;
  if (len(mid) > 1.8) {
    // Two parallel planes (the same cut, higher or lower): from the side, a little to their front, so the move between them shows.
    const m1 = norm(mid);
    const side = sub(tilt, mul(m1, dot(tilt, m1)));
    n = norm(add(norm(side), mul(m1, 0.42)));
  } else {
    n = add(mul(mid, 0.5), mul(tilt, 0.6));
    if (len(n) < 0.2) n = tilt;
    n = norm(n);
    // Never so far round that one of the drawings is seen from behind.
    for (let i = 0; i < 6 && (dot(n, a.n) < 0.25 || dot(n, b.n) < 0.25) && len(mid) > 0.2; i++) n = norm(add(n, mul(norm(mid), 0.5)));
  }
  const Y: V3 = [0, 1, 0];
  let u = sub(Y, mul(n, dot(Y, n)));
  if (len(u) < 0.25) u = sub(a.u, mul(n, dot(a.u, n)));
  u = norm(u);
  const r = cross(u, n);
  const rows: [V3, V3, V3] = [r, u, n];
  const corners = m.ext.x.flatMap((x) => m.ext.y.flatMap((y) => m.ext.z.map((z): V3 => [x, y, z])));
  const xs = corners.map((p) => dot(rows[0], p));
  const ys = corners.map((p) => dot(rows[1], p));
  const s = Math.min(820 / (Math.max(...xs) - Math.min(...xs)), 470 / (Math.max(...ys) - Math.min(...ys)));
  const c: V3 = [(m.ext.x[0] + m.ext.x[1]) / 2, (m.ext.y[0] + m.ext.y[1]) / 2, (m.ext.z[0] + m.ext.z[1]) / 2];
  return { q: quatOf(r, u, n), s, c };
}

const between = (a: Cam, b: Cam, t: number): Cam => ({
  q: slerp(a.q, b.q, t),
  s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
  c: lerp3(a.c, b.c, t),
});

/** Camera out to the overview, a pause there, then in to the new plane. */
const OUT = 0.34;
const IN = 0.56;

function camAt(p: number, k0: Cam, k1: Cam, k2: Cam): Cam {
  if (p < OUT) return between(k0, k1, glide(p / OUT));
  if (p < IN) return k1;
  return between(k1, k2, glide((p - IN) / (1 - IN)));
}

function projector(cam: Cam) {
  const [r, u] = rowsOf(cam.q);
  return {
    rows: rowsOf(cam.q),
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
  return {
    m: `matrix(${[a, b, c, d, e, g].map((v) => v.toFixed(4)).join(' ')})`,
    front: a * d - b * c > 0,
  };
}

/** The plane's rectangle (the drawing's frame) on screen. */
function frameQuad(P: (v: V3) => [number, number], f: Frame) {
  const hw = f.w / 2;
  const hh = f.h / 2;
  const at = (x: number, y: number) => P(add(f.center, add(mul(f.r, x), mul(f.u, y))));
  return poly([at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)]);
}

// ---- the embryo as a modelled body --------------------------------------------------------------

interface Ball {
  c: V3;
  r: number;
}

/**
 * The C body as a chain of shaded spheres along its centre line: a big head, a tapering tail, the
 * heart's bulge under the head, a row of somites down the back, the limb buds and the eye on each side.
 */
function embryo(m: Model, day: number) {
  if (!m.tube) return null;
  const pts = m.tube.pts;
  const base = m.tube.w / 2;
  const at = (t: number) => {
    const f = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    return lerp3(pts[i], pts[i + 1], f - i);
  };
  const radius = (t: number) => base * (t < 0.12 ? 1.45 - (t / 0.12) * 0.45 : lerp(1, 0.28, (t - 0.12) / 0.88));
  const N = 96;
  const spine: Ball[] = [];
  for (let k = 0; k <= N; k++) spine.push({ c: at(k / N), r: radius(k / N) });
  // Away from the C's hollow: the back (dorsal) side of the body at that point.
  const out = (t: number): V3 => {
    const c = at(t);
    return norm([c[0], c[1], 0]);
  };
  // What exists at this age (Carnegie stages): somites appear from day 20 (about three pairs a day,
  // occipital to caudal), the upper limb bud about day 26, the lower about day 28, the optic vesicle as a visible eye about day 28.
  const pairs = Math.max(4, Math.min(15, Math.round((day - 19) * 1.5)));
  const somites: Ball[] = [];
  for (let k = 0; k < pairs; k++) {
    const t = 0.2 + (k / 14) * 0.55;
    const r = radius(t);
    for (const z of [-1, 1]) somites.push({ c: add(add(at(t), mul(out(t), r * 0.62)), [0, 0, z * r * 0.42]), r: r * 0.27 });
  }
  // The heart's bulge fills the top of the C's hollow, ventral to the upper thoracic trunk and just behind the face,
  // so a cut at thorax level passes through it as in the drawn sections.
  const heartT = 0.42;
  const heartR = base * 0.85;
  const heart: Ball = { c: add(at(heartT), mul(norm([-1, -0.2, 0]), radius(heartT) + heartR * 0.45)), r: heartR };
  const side = (z: 1 | -1): BodySideBalls => ({
    limbs: [day >= 26 ? 0.36 : null, day >= 28 ? 0.66 : null]
      .filter((t) => t !== null)
      .map((t): Ball => ({ c: add(sub(at(t), mul(out(t), radius(t) * 0.2)), [0, 0, z * radius(t) * 0.82]), r: radius(t) * 0.42 })),
    eye: day >= 28 ? { c: add(sub(at(0.02), mul(out(0.02), radius(0.02) * 0.25)), [0, 0, z * radius(0.02) * 0.82]), r: radius(0.02) * 0.2 } : null,
  });
  return { spine, somites, heart, heartT, near: side(1), far: side(-1) };
}

interface BodySideBalls {
  limbs: Ball[];
  eye: Ball | null;
}

/**
 * Whether a point belongs to the part of the body a frame's drawing shows. A horizontal cut through the
 * C body can also clip the bent-down head; the drawn section is the trunk's, so only the trunk counts.
 * `t` is the point's place along the body (0 = head … 1 = tail end).
 */
const inDrawing = (f: Frame, c: V3, t: number) => t >= f.span[0] && t <= f.span[1] && (f.axis !== 1 || Math.abs(c[0] - f.center[0]) < 16);

/** The ring a plane cuts from the body (where the section lies on it), when it crosses the body. */
function sectionRing(body: ReturnType<typeof embryo>, f: Frame, P: (v: V3) => [number, number]) {
  if (!body || f.axis === 2) return '';
  const [a1, a2] = ([0, 1, 2] as Axis[]).filter((a) => a !== f.axis);
  const rings: string[] = [];
  const sp = body.spine;
  for (let i = 1; i < sp.length; i++) {
    const a = sp[i - 1].c[f.axis] - f.at;
    const b = sp[i].c[f.axis] - f.at;
    if ((a === 0 || a * b < 0) && inDrawing(f, sp[i].c, i / (sp.length - 1))) {
      const k = a / (a - b);
      const c = lerp3(sp[i - 1].c, sp[i].c, k);
      const r = lerp(sp[i - 1].r, sp[i].r, k);
      const ring: [number, number][] = [];
      for (let j = 0; j < 32; j++) {
        const q: V3 = [...c];
        q[a1] += Math.cos((j / 32) * Math.PI * 2) * r;
        q[a2] += Math.sin((j / 32) * Math.PI * 2) * r;
        ring.push(P(q));
      }
      rings.push(poly(ring));
    }
  }
  return rings.join(' ');
}

/** The extent of the body's own section on a plane (the discs its spheres leave there), in the frame's right/up units. */
function sectionBox(body: NonNullable<ReturnType<typeof embryo>>, f: Frame) {
  let a0 = Infinity;
  let a1 = -Infinity;
  let b0 = Infinity;
  let b1 = -Infinity;
  const balls = [...body.spine.map((s, i) => ({ s, t: i / (body.spine.length - 1) })), { s: body.heart, t: body.heartT }];
  for (const { s, t } of balls) {
    const d = s.c[f.axis] - f.at;
    if (Math.abs(d) >= s.r || !inDrawing(f, s.c, t)) continue;
    const rr = Math.sqrt(s.r * s.r - d * d);
    const a = dot(s.c, f.r);
    const b = dot(s.c, f.u);
    a0 = Math.min(a0, a - rr);
    a1 = Math.max(a1, a + rr);
    b0 = Math.min(b0, b - rr);
    b1 = Math.max(b1, b + rr);
  }
  return a0 < a1 ? { a: (a0 + a1) / 2, b: (b0 + b1) / 2, w: a1 - a0, h: b1 - b0 } : null;
}

/**
 * The frame moved and scaled so that the anatomy of its drawing (`box`, in stage pixels) lies on the
 * body's own section: the side view over the whole C body, a cross-section as a slice of the trunk.
 */
function fitted(f: Frame, box: DOMRect | null, body: ReturnType<typeof embryo>): Frame {
  if (!body || !box || box.width < 20 || box.height < 20) return f;
  const sec = sectionBox(body, f);
  if (!sec) return f;
  const tw = Math.max(16, sec.w * 1.2);
  const th = Math.max(16, sec.h * 1.2);
  const k = Math.sqrt((tw / box.width) * (th / box.height));
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

/** The whole cutting plane through the model's box (a large sheet, beyond the body). */
function sheet(P: (v: V3) => [number, number], f: Frame, m: Model) {
  const e = [m.ext.x, m.ext.y, m.ext.z];
  const [i, j] = ([0, 1, 2] as Axis[]).filter((a) => a !== f.axis);
  const at = (si: 0 | 1, sj: 0 | 1) => {
    const q: V3 = [0, 0, 0];
    q[f.axis] = f.at;
    q[i] = e[i][si] * 0.92;
    q[j] = e[j][sj] * 0.92;
    return P(q);
  };
  return poly([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]);
}

/** The body's own axes, for the corner gizmo. */
function axesOf(shape: SpecimenShape): { v: V3; pos: string; color: string }[] {
  const tube = TUBES.includes(shape);
  return [
    { v: tube ? [0, 1, 0] : [-1, 0, 0], pos: 'Kraneala', color: '#8fb4f7' },
    { v: tube ? [1, 0, 0] : [0, 1, 0], pos: 'Dortsala', color: '#86dc9b' },
    { v: [0, 0, 1], pos: 'Ezkerra', color: '#f4a07f' },
  ];
}

/** How long the move takes (ms). */
export const TRAVEL_MS = 3200;

const GIZMO: [number, number] = [118, 540];
const GIZMO_R = 40;

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
  const m = modelOf(plan.shape, plan.day);
  const body = embryo(m, plan.day);
  const axes = axesOf(plan.shape);
  /** The two frames, once their drawings have been measured and laid on the body's section. */
  const frames = useRef<{ from: Frame; to: Frame } | null>(null);
  const root = useRef<SVGGElement>(null);
  /** Every moving element carries `data-t`; the frames rewrite their attributes directly. */
  const ref = (k: string) => ({ 'data-t': k });

  const draw = (p: number) => {
    const R: Record<string, Element> = {};
    root.current?.querySelectorAll('[data-t]').forEach((el) => (R[el.getAttribute('data-t')!] = el));
    const F = frames.current ?? { from: plan.from, to: plan.to };
    const cam = camAt(p, facing(F.from), overview(F.from, F.to, m, plan.shape), facing(F.to));
    const { P, rows } = projector(cam);
    const set = (k: string, attrs: Record<string, string | number>) => {
      const el = R[k];
      if (el) for (const [a, v] of Object.entries(attrs)) el.setAttribute(a, typeof v === 'number' ? v.toFixed(2) : v);
    };
    const ball = (k: string, b: Ball, grow = 0) => {
      const [x, y] = P(b.c);
      set(k, { cx: x, cy: y, r: Math.max(0.1, b.r * cam.s + grow) });
    };

    // The studio: the body fades in as the camera pulls back and out as it closes in on the new plane.
    const seen = ramp(p, 0.05, 0.26) * (1 - ramp(p, 0.62, 0.78));
    set('studio', { opacity: seen });
    set('body', { opacity: seen });
    const [fx, fy] = P([(m.ext.x[0] + m.ext.x[1]) / 2, m.ext.y[0] - 2, 0]);
    set('floor', { cx: fx, cy: fy, rx: 34 * cam.s, ry: 7 * cam.s });
    if (body) {
      body.spine.forEach((b, i) => {
        ball(`rim${i}`, b, 1.6);
        ball(`sk${i}`, b);
      });
      body.somites.forEach((b, i) => ball(`so${i}`, b));
      ball('heart', body.heart);
      // The limb buds and eye of each side, only on the side turned to the camera.
      const toward = rows[2][2];
      for (const [k, s, z] of [
        ['near', body.near, 1],
        ['far', body.far, -1],
      ] as const) {
        set(k, { opacity: ramp(toward * z, -0.12, 0.18) });
        s.limbs.forEach((b, i) => ball(`${k}-limb${i}`, b));
        if (s.eye) ball(`${k}-eye`, s.eye);
      }
    } else
      m.blobs.forEach((b, i) => {
        const pts: [number, number][] = [];
        for (let a = 0; a <= 10; a++)
          for (let k = 0; k < 18; k++) {
            const u = -Math.PI / 2 + (a / 10) * Math.PI;
            if (b.half && Math.sign(Math.sin(u)) === -b.half && Math.abs(Math.sin(u)) > 1e-6) continue;
            const v = (k / 18) * Math.PI * 2;
            pts.push(P([b.c[0] + b.r[0] * Math.cos(u) * Math.cos(v), b.c[1] + b.r[1] * Math.sin(u), b.c[2] + b.r[2] * Math.cos(u) * Math.sin(v)]));
          }
        set(`blob${i}`, { d: poly(hull(pts)) });
      });

    // The two drawings, each on its pane of glass.
    const a = pictureMatrix(cam, F.from);
    const b = pictureMatrix(cam, F.to);
    const oldO = a.front ? 1 - ramp(p, 0.5, 0.78) : 0;
    // Seen whole, the body shows through both panes; closing in, the new drawing becomes solid.
    const through = 0.7 + 0.3 * ramp(p, 0.62, 0.82);
    const newO = b.front ? ramp(p, 0.3, 0.46) * through : 0;
    set('old', { transform: a.m, opacity: oldO * (p < OUT ? 1 : 0.8) });
    set('new', { transform: b.m, opacity: newO });
    // Each cutting plane is a large sheet of glass through the body; its drawing is the cut face on it.
    const qa = sheet(P, F.from, m);
    const qb = sheet(P, F.to, m);
    set('old-glass', { d: qa, opacity: ramp(p, 0.08, 0.24) * (1 - ramp(p, 0.62, 0.8)) });
    set('new-glass', { d: qb, opacity: ramp(p, 0.3, 0.44) * (1 - ramp(p, 0.66, 0.8)) });
    set('old-edge', { d: qa, opacity: ramp(p, 0.08, 0.24) * (1 - ramp(p, 0.62, 0.8)) });
    const edge = ramp(p, 0.3, 0.44) * (1 - ramp(p, 0.66, 0.8));
    set('new-edge', { d: qb, opacity: edge });
    set('new-glow', { d: qb, opacity: edge * 0.6 });
    // Where each plane cuts the body.
    set('old-cut', { d: sectionRing(body, F.from, P), opacity: seen * (1 - ramp(p, 0.6, 0.74)) });
    set('new-cut', { d: sectionRing(body, F.to, P), opacity: seen * ramp(p, 0.3, 0.44) * (1 - ramp(p, 0.64, 0.76)) });

    // The corner gizmo turns with the camera.
    set('gizmo', { opacity: ramp(p, 0.04, 0.16) * (1 - ramp(p, 0.9, 1)) });
    // Names placed first, then pushed apart where two would overlap.
    const [gx, gy] = GIZMO;
    const names = axes.map((ax) => {
      const x = dot(rows[0], ax.v);
      const y = -dot(rows[1], ax.v);
      const end = Math.hypot(x, y) < 0.18;
      return { x: gx + x * (GIZMO_R + 12) + (end ? 12 : 0), y: gy + y * (GIZMO_R + 12), w: ax.pos.length * 7, anchor: end || x > 0.25 ? 'start' : x < -0.25 ? 'end' : 'middle' };
    });
    const span = (n: (typeof names)[number]) => (n.anchor === 'start' ? [n.x, n.x + n.w] : n.anchor === 'end' ? [n.x - n.w, n.x] : [n.x - n.w / 2, n.x + n.w / 2]);
    for (let pass = 0; pass < 3; pass++)
      for (let i = 0; i < names.length; i++)
        for (let j = i + 1; j < names.length; j++) {
          const [a0, a1] = span(names[i]);
          const [b0, b1] = span(names[j]);
          const dy = names[j].y - names[i].y;
          if (a0 < b1 && b0 < a1 && Math.abs(dy) < 14) {
            const push = (14 - Math.abs(dy)) / 2 + 0.5;
            names[i].y -= dy >= 0 ? push : -push;
            names[j].y += dy >= 0 ? push : -push;
          }
        }
    axes.forEach((ax, i) => {
      const x = dot(rows[0], ax.v);
      const y = -dot(rows[1], ax.v);
      const z = dot(rows[2], ax.v);
      const tx = gx + x * GIZMO_R;
      const ty = gy + y * GIZMO_R;
      set(`ax${i}`, { x1: gx, y1: gy, x2: tx, y2: ty, opacity: z < 0 ? 0.45 : 1 });
      set(`axp${i}`, { cx: tx, cy: ty, opacity: z < 0 ? 0.55 : 1 });
      set(`axn${i}`, { cx: gx - x * GIZMO_R * 0.7, cy: gy - y * GIZMO_R * 0.7, opacity: z > 0 ? 0.35 : 0.7 });
      set(`axl${i}`, { x: names[i].x, y: names[i].y, 'text-anchor': names[i].anchor, opacity: z < -0.6 ? 0.5 : 1 });
    });

    set('caption', { opacity: ramp(p, 0, 0.08) * (1 - ramp(p, 0.9, 1)) });
    set('legend', { opacity: ramp(p, 0.06, 0.2) * (1 - ramp(p, 0.88, 1)) });
    set('now', { opacity: 0.5 + 0.5 * ramp(p, 0.4, 0.56) });
    set('was', { opacity: 1 - 0.45 * ramp(p, 0.4, 0.56) });
  };

  const finish = useEffectEvent(onDone);
  const paint = useEffectEvent(draw);
  const measure = useEffectEvent(() => {
    const g = (k: string) => root.current?.querySelector(`[data-t="${k}"]`) ?? null;
    frames.current = { from: fitted(plan.from, anatomyBox(g('old')), body), to: fitted(plan.to, anatomyBox(g('new')), body) };
    // A drawing's own full-stage backdrop would show as a dark card on the glass: only its anatomy travels.
    for (const k of ['old', 'new'])
      g(k)
        ?.querySelectorAll('rect,path')
        .forEach((el) => {
          const b = (el as SVGGraphicsElement).getBBox?.();
          if (b && b.width > 900 && b.height > 560) (el as SVGElement).style.display = 'none';
        });
  });
  useLayoutEffect(() => {
    if (!frames.current) measure();
    paint(progress ?? 0);
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
      const p = Math.min(1, (now - start) / TRAVEL_MS);
      paint(p);
      if (p < 1) raf = requestAnimationFrame(tick);
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
  const legend = [`Lehen: ${fromKind}`, fromKind !== toKind ? `Orain: ${toKind}` : sameCut ? `Orain: ${toKind}, ${plan.toLabel.toLowerCase()}` : `Orain: ${toKind}, beste maila batean`];
  const legendW = Math.max(320, (legend[0].length + legend[1].length) * 7.9 + 120);
  const sans = 'var(--font-sans, system-ui)';

  return (
    <g ref={root} className="travel" aria-hidden>
      <defs>
        <radialGradient id="tv-studio" cx="50%" cy="46%" r="62%">
          <stop offset="0" stopColor="#1d2638" stopOpacity={0.95} />
          <stop offset="0.65" stopColor="#0f131c" stopOpacity={0.96} />
          <stop offset="1" stopColor="#07090d" stopOpacity={0.98} />
        </radialGradient>
        <radialGradient id="tv-skin" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#fbe9dc" />
          <stop offset="0.38" stopColor="#e2b4a0" />
          <stop offset="0.8" stopColor="#a8705f" />
          <stop offset="1" stopColor="#6e4540" />
        </radialGradient>
        <radialGradient id="tv-somite" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff4ea" />
          <stop offset="1" stopColor="#d49c88" />
        </radialGradient>
        <radialGradient id="tv-heart" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ff9aa7" />
          <stop offset="0.55" stopColor="#c8475c" />
          <stop offset="1" stopColor="#6d1e2c" />
        </radialGradient>
        <radialGradient id="tv-floor">
          <stop offset="0" stopColor="#000" stopOpacity={0.55} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="tv-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" stopOpacity={0.12} />
          <stop offset="0.55" stopColor="#fbbf24" stopOpacity={0.05} />
          <stop offset="1" stopColor="#fbbf24" stopOpacity={0.1} />
        </linearGradient>
        <filter id="tv-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect {...ref('studio')} width={W} height={H} fill="url(#tv-studio)" opacity={0} />
      <g {...ref('body')} opacity={0}>
        <ellipse {...ref('floor')} fill="url(#tv-floor)" />
        {body ? (
          <>
            <BodySide k="far" side={body.far} at={ref} />
            {body.spine.map((_, i) => (
              <circle key={`r${i}`} {...ref(`rim${i}`)} fill="#3a2427" />
            ))}
            {body.spine.map((_, i) => (
              <circle key={`s${i}`} {...ref(`sk${i}`)} fill="url(#tv-skin)" />
            ))}
            {body.somites.map((_, i) => (
              <circle key={`o${i}`} {...ref(`so${i}`)} fill="url(#tv-somite)" opacity={0.9} />
            ))}
            <circle {...ref('heart')} fill="url(#tv-heart)" />
            <BodySide k="near" side={body.near} at={ref} />
          </>
        ) : (
          m.blobs.map((b, i) => <path key={i} {...ref(`blob${i}`)} fill={b.fill} stroke={b.stroke} strokeWidth={1.5} />)
        )}
      </g>

      <path {...ref('old-glass')} fill="rgba(232,238,252,0.05)" opacity={0} />
      <g {...ref('old')} opacity={0} pointerEvents="none">
        <PaneContext.Provider value={true}>{old}</PaneContext.Provider>
      </g>
      <path {...ref('old-edge')} fill="none" stroke="rgba(232,238,252,0.45)" strokeWidth={1.2} strokeLinejoin="round" opacity={0} />
      <path {...ref('old-cut')} fill="none" stroke="#e8eefc" strokeWidth={1.4} opacity={0} />

      <path {...ref('new-glass')} fill="url(#tv-glass)" opacity={0} />
      <g {...ref('new')} opacity={0} pointerEvents="none">
        <PaneContext.Provider value={true}>{children}</PaneContext.Provider>
      </g>
      <path {...ref('new-glow')} fill="none" stroke="#fbbf24" strokeWidth={7} strokeLinejoin="round" filter="url(#tv-soft)" opacity={0} />
      <path {...ref('new-edge')} fill="none" stroke="#fbbf24" strokeWidth={1.8} strokeLinejoin="round" opacity={0} />
      <path {...ref('new-cut')} fill="none" stroke="#fde68a" strokeWidth={1.8} opacity={0} />

      {/* Orientation gizmo, as in 3-D software: the body's own axes, turning with the camera. */}
      <g {...ref('gizmo')} opacity={0}>
        <circle cx={GIZMO[0]} cy={GIZMO[1]} r={GIZMO_R + 26} fill="rgba(10,12,18,0.72)" stroke="rgba(255,255,255,0.08)" />
        {axes.map((ax, i) => (
          <g key={ax.pos}>
            <circle {...ref(`axn${i}`)} r={3.2} fill="none" stroke={ax.color} strokeWidth={1.4} />
            <line {...ref(`ax${i}`)} stroke={ax.color} strokeWidth={2.6} strokeLinecap="round" />
            <circle {...ref(`axp${i}`)} r={5.5} fill={ax.color} />
            <text {...ref(`axl${i}`)} dy="0.35em" style={{ font: `600 12px ${sans}`, fill: ax.color, paintOrder: 'stroke', stroke: 'rgba(10,12,18,0.95)', strokeWidth: 4 }}>
              {ax.pos}
            </text>
          </g>
        ))}
      </g>

      <g {...ref('caption')} opacity={0}>
        <rect x={500 - pillW / 2} y={16} width={pillW} height={60} rx={16} fill="rgba(12,14,20,0.82)" stroke="rgba(255,255,255,0.09)" />
        <text x={500} y={37} textAnchor="middle" style={{ font: '600 10.5px var(--font-mono, monospace)', letterSpacing: '0.16em', fill: '#fbbf24' }}>
          IKUSPEGIA ALDATZEN
        </text>
        <text x={500} y={62} textAnchor="middle" style={{ font: `650 19px ${sans}`, fill: '#e8eefc' }}>
          <tspan {...ref('was')} fill="rgba(232,238,252,0.8)">
            {plan.fromLabel}
          </tspan>
          <tspan fill="#fbbf24">{'  →  '}</tspan>
          <tspan {...ref('now')}>{plan.toLabel}</tspan>
        </text>
      </g>

      <g {...ref('legend')} opacity={0}>
        <rect x={500 - legendW / 2} y={H - 50} width={legendW} height={34} rx={17} fill="rgba(12,14,20,0.82)" stroke="rgba(255,255,255,0.09)" />
        <text x={500} y={H - 33} dy="0.35em" textAnchor="middle" style={{ font: `500 14px ${sans}`, fill: 'rgba(232,238,252,0.82)' }}>
          <tspan fill="#e8eefc">▭ </tspan>
          {legend[0]}
          <tspan dx={18} fill="#fbbf24">
            ▭{' '}
          </tspan>
          <tspan fill="#fde68a">{legend[1]}</tspan>
        </text>
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
          <text x={W - 24} y={H - 28} textAnchor="end" style={{ font: `500 12px ${sans}`, fill: 'rgba(232,238,252,0.5)' }}>
            Klik edo Esc: saltatu
          </text>
        </g>
      )}
    </g>
  );
}

function BodySide({ k, side, at }: { k: 'near' | 'far'; side: BodySideBalls; at: (k: string) => { 'data-t': string } }) {
  return (
    <g {...at(k)}>
      {side.limbs.map((_, i) => (
        <circle key={i} {...at(`${k}-limb${i}`)} fill="url(#tv-skin)" stroke="#3a2427" strokeWidth={1.2} />
      ))}
      {side.eye && <circle {...at(`${k}-eye`)} fill="#2b1a1e" />}
    </g>
  );
}
