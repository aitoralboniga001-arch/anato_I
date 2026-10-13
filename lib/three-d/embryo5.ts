import { add, cross, mul, norm, sub, type M4, type V3 } from './math';
import { blob, type Mesh } from './mesh';
import { ellipsoid, smin, surfaceAlong, surfaceMesh, type SDF } from './sdf';
import { geoOf, geoSlot } from './offthread';

/**
 * A 5-week embryo (C-shaped, head folded over the heart bulge, limb buds, pharyngeal arches, a row of
 * somites along the back) for the "where is this cut?" fly-in of the 3D section views.
 *
 * Embryo space: x lateral; the body curls in the y–z plane round the centre O. At θ = 0 (mid-trunk)
 * the body axis runs along +z (cranial) and +y is dorsal, so a block cut there has the same frame
 * as the topic-9 domains block (x lateral, y dorsal, z cranial; trunk half-width ≈ 1.15).
 */

export const RC = 2.6;
export const O: V3 = [0, -0.2 - RC, 0];
const T_TAIL = -2.55;
const T_HEAD = 1.95;

const smooth = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/** The body axis at angle θ. */
export const axisAt = (th: number): V3 => [0, O[1] + RC * Math.cos(th), RC * Math.sin(th)];

/** Body radius along the axis: a thin tail, the full trunk, a slightly narrower neck. */
function radius(th: number) {
  const tail = 0.14 + 1.0 * smooth(T_TAIL, -0.85, th);
  const neck = 1 - 0.1 * smooth(1.05, 1.5, th);
  return tail * neck;
}

/** Somites at the angles where the topic-9 block has them (z = -0.4, 0.2, 0.8 at r ≈ RC + 0.55). */
const SOMITE_R = RC + 0.55;
const SOMITE_TH0 = 0.2 / SOMITE_R;
const SOMITE_DTH = 0.6 / SOMITE_R;

function trunk(x: number, y: number, z: number) {
  const yy = y - O[1];
  const r = Math.hypot(yy, z);
  const th = Math.atan2(z, yy);
  if (th < T_TAIL || th > T_HEAD) {
    const c = th < T_TAIL ? T_TAIL : T_HEAD;
    const p = axisAt(c);
    return Math.hypot(x, y - p[1], z - p[2]) - radius(c);
  }
  const dr = r - RC;
  // Somite bumps either side of the dorsal midline, along the whole back.
  const around = Math.atan2(Math.abs(x), dr);
  const side = Math.max(0, Math.cos((around - 0.5) * 2.6));
  const bump = 0.085 * side * (0.5 + 0.5 * Math.cos(((th - SOMITE_TH0) / SOMITE_DTH) * Math.PI * 2)) * smooth(T_TAIL + 0.3, -1.2, th) * (1 - smooth(1.2, 1.6, th));
  return Math.hypot(x * 1.08, dr) - radius(th) - bump;
}

/** Points on the body by angle along the axis, `out` from the axis (negative = ventral), lateral `x`. */
const onBody = (th: number, out: number, x = 0): V3 => {
  const d: V3 = [0, Math.cos(th), Math.sin(th)];
  return add(add(axisAt(th), mul(d, out)), [x, 0, 0]);
};

function makeField(): SDF {
  // Head: hindbrain/midbrain over the neck, the forebrain folded down in front of the heart.
  const mid = ellipsoid(onBody(2.08, 0.25), [1.2, 1.35, 1.35]);
  const fore = ellipsoid(onBody(2.6, -0.45), [1.08, 1.12, 1.18]);
  const face = ellipsoid(onBody(2.42, -1.05), [0.8, 0.7, 0.8]);
  // Ventral bulges: the heart under the pharynx, the liver below it.
  const heart = ellipsoid(onBody(1.18, -1.05), [0.95, 0.95, 0.9]);
  const liver = ellipsoid(onBody(0.42, -0.85), [0.98, 0.85, 0.95]);
  // Pharyngeal arches on the side of the neck, one behind the other.
  const arches = [1.42, 1.6, 1.76].map((th, i) => ellipsoid(onBody(th, -0.55 - i * 0.05, 0.62 - i * 0.04), [0.32, 0.5 - i * 0.06, 0.2]));
  // Limb buds: paddles at the upper and lower limb levels.
  const armBud = ellipsoid(onBody(0.78, -0.25, 1.05), [0.42, 0.55, 0.38]);
  const legBud = ellipsoid(onBody(-0.82, -0.3, 0.9), [0.4, 0.5, 0.36]);
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = trunk(x, y, z);
    d = smin(d, mid(x, y, z), 0.35);
    d = smin(d, fore(x, y, z), 0.3);
    d = smin(d, face(x, y, z), 0.25);
    d = smin(d, heart(x, y, z), 0.35);
    d = smin(d, liver(x, y, z), 0.35);
    for (const a of arches) d = smin(d, a(ax, y, z), 0.08);
    d = smin(d, armBud(ax, y, z), 0.18);
    d = smin(d, legBud(ax, y, z), 0.18);
    return d;
  };
}

export interface Embryo5 {
  field: SDF;
  body: Mesh;
  hit: Mesh;
  eyes: Mesh[];
  /** Where to put the "head" and "tail" notes. */
  head: V3;
  tail: V3;
}

function build(): Embryo5 {
  const field = makeField();
  const lo: V3 = [-1.65, -6.35, -3.75];
  const hi: V3 = [1.65, 1.15, 4.25];
  const body = surfaceMesh(field, lo, hi, 0.085);
  const hit = surfaceMesh((x, y, z) => field(x, y, z) - 0.05, lo, hi, 0.22);
  // Eyes: dark lens placodes on the side of the forebrain.
  const eyes = [1, -1].map((s) => {
    const { p, n } = surfaceAlong(field, onBody(2.55, -0.6, 0.3 * s), [s, -0.1, 0.25]);
    return blob({ center: add(p, mul(norm(n), -0.07)), radii: [0.13, 0.13, 0.13], rings: 8, sides: 10 });
  });
  return { field, body, hit, eyes, head: onBody(2.3, 1.4), tail: onBody(T_TAIL - 0.1, 0.2) };
}

/** Built once, off the main thread in the browser (the field is a function: it is made again on arrival). */
export const EMBRYO5 = geoSlot('embryo5', build, {
  pack: ({ field: _field, ...rest }) => rest,
  unpack: (d) => ({ ...(d as Omit<Embryo5, 'field'>), field: makeField() }),
});

export function embryo5(): Embryo5 {
  return geoOf(EMBRYO5);
}

/**
 * Model matrix that puts the embryo's cross-section at angle θ into a block's own frame: the block's
 * lateral, dorsal and cranial axes (unit, right-handed: lateral × dorsal = cranial) and its centre,
 * at `scale` block units per embryo unit. The domains block is θ = 0, identity axes, scale 1.
 */
export function sectionMatrix(th: number, at: V3, lateral: V3, dorsal: V3, scale = 1): M4 {
  const c = axisAt(th);
  // Embryo-space frame at θ.
  const eDor: V3 = [0, Math.cos(th), Math.sin(th)];
  const eCra: V3 = [0, -Math.sin(th), Math.cos(th)];
  const eLat: V3 = [1, 0, 0];
  const cranial = cross(lateral, dorsal);
  // Rotation R maps eLat→lateral, eDor→dorsal, eCra→cranial: R = B·Aᵀ.
  const A = [eLat, eDor, eCra];
  const B = [lateral, dorsal, cranial];
  const m = new Float32Array(16);
  for (let col = 0; col < 3; col++)
    for (let row = 0; row < 3; row++) {
      let v = 0;
      for (let k = 0; k < 3; k++) v += B[k][row] * A[k][col];
      m[col * 4 + row] = v * scale;
    }
  // Translation: at − s·R·c.
  const rc: V3 = [0, 1, 2].map((row) => m[row] * c[0] + m[4 + row] * c[1] + m[8 + row] * c[2]) as unknown as V3;
  const tr = sub(at, rc);
  m[12] = tr[0];
  m[13] = tr[1];
  m[14] = tr[2];
  m[15] = 1;
  return m;
}

/** A point of embryo space through a model matrix. */
export function apply(m: M4, p: V3): V3 {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}
