/**
 * Small 3D math for the scenes' 3D views. No three.js here: the scene geometry, the camera and the
 * projection of label anchors stay pure, synchronous functions of `t` (server render, tests), and the
 * lazily loaded WebGL layer only draws what this produces. Matrices are column-major (as WebGL and
 * three.js expect), so they can be handed over unchanged.
 */

export type V3 = readonly [number, number, number];
export type M4 = Float32Array;

export const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** Component of `a` perpendicular to unit `n`, normalised. */
export const perp = (a: V3, n: V3): V3 => norm(sub(a, mul(n, dot(a, n))));

/** Rotate `v` about unit `axis` by `a` radians (Rodrigues). */
export function rotate(v: V3, axis: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = cross(axis, v);
  const d = dot(axis, v) * (1 - c);
  return [v[0] * c + k[0] * s + axis[0] * d, v[1] * c + k[1] * s + axis[1] * d, v[2] * c + k[2] * s + axis[2] * d];
}

export const deg = (d: number) => (d * Math.PI) / 180;

export function identity(): M4 {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

/** a × b (apply b first). */
export function mulM(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}

export function perspective(fovyDeg: number, aspect: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(deg(fovyDeg) / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

/** World → camera (view) matrix of a camera at `eye` looking at `target`. */
export function lookAt(eye: V3, target: V3, up: V3 = [0, 1, 0]): M4 {
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  const m = new Float32Array(16);
  m[0] = x[0];
  m[4] = x[1];
  m[8] = x[2];
  m[1] = y[0];
  m[5] = y[1];
  m[9] = y[2];
  m[2] = z[0];
  m[6] = z[1];
  m[10] = z[2];
  m[12] = -dot(x, eye);
  m[13] = -dot(y, eye);
  m[14] = -dot(z, eye);
  m[15] = 1;
  return m;
}

export function invertRigid(m: M4): M4 {
  // Inverse of a rotation + translation matrix (the camera's view matrix).
  const o = new Float32Array(16);
  o[0] = m[0];
  o[1] = m[4];
  o[2] = m[8];
  o[4] = m[1];
  o[5] = m[5];
  o[6] = m[9];
  o[8] = m[2];
  o[9] = m[6];
  o[10] = m[10];
  o[12] = -(m[0] * m[12] + m[1] * m[13] + m[2] * m[14]);
  o[13] = -(m[4] * m[12] + m[5] * m[13] + m[6] * m[14]);
  o[14] = -(m[8] * m[12] + m[9] * m[13] + m[10] * m[14]);
  o[15] = 1;
  return o;
}

/** Homogeneous transform of a point: [x, y, z, w]. */
export function apply4(m: M4, p: V3): [number, number, number, number] {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
  ];
}

/** The 1000×640 scene frame every view is drawn in. */
export const FRAME_W = 1000;
export const FRAME_H = 640;

export interface Camera3 {
  eye: V3;
  target: V3;
  up?: V3;
  /** Vertical field of view, degrees. */
  fov: number;
  /**
   * Where the target lands in the frame and how big the picture is, so a 3D view can leave the side
   * gutters free for names like every other view: the view is shifted by (cx, cy) frame units.
   */
  shift?: [number, number];
}

export interface View3 {
  view: M4;
  proj: M4;
  /** proj × view */
  vp: M4;
  eye: V3;
}

/** Camera → matrices. The shift moves the picture in the frame without changing the perspective. */
export function viewOf(cam: Camera3): View3 {
  const view = lookAt(cam.eye, cam.target, cam.up);
  const proj = perspective(cam.fov, FRAME_W / FRAME_H, 0.05, 100);
  if (cam.shift) {
    proj[8] -= (2 * cam.shift[0]) / FRAME_W;
    proj[9] += (2 * cam.shift[1]) / FRAME_H;
  }
  return { view, proj, vp: mulM(proj, view), eye: cam.eye };
}

/** World point → frame coordinates (x right, y down) and depth (larger = farther). */
export function project(v: View3, p: V3): { x: number; y: number; z: number; w: number } {
  const [x, y, z, w] = apply4(v.vp, p);
  const iw = 1 / (w || 1e-6);
  return { x: (x * iw * 0.5 + 0.5) * FRAME_W, y: (1 - (y * iw * 0.5 + 0.5)) * FRAME_H, z: z * iw, w };
}

/** Rotation by `a` radians about the line through `p` with unit direction `axis`. */
export function rotateAbout(p: V3, axis: V3, a: number): M4 {
  const [x, y, z] = axis;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const t = 1 - c;
  const m = new Float32Array(16);
  m[0] = t * x * x + c;
  m[1] = t * x * y + s * z;
  m[2] = t * x * z - s * y;
  m[4] = t * x * y - s * z;
  m[5] = t * y * y + c;
  m[6] = t * y * z + s * x;
  m[8] = t * x * z + s * y;
  m[9] = t * y * z - s * x;
  m[10] = t * z * z + c;
  m[15] = 1;
  // Translate so the axis passes through p: M = T(p) R T(-p).
  m[12] = p[0] - (m[0] * p[0] + m[4] * p[1] + m[8] * p[2]);
  m[13] = p[1] - (m[1] * p[0] + m[5] * p[1] + m[9] * p[2]);
  m[14] = p[2] - (m[2] * p[0] + m[6] * p[1] + m[10] * p[2]);
  return m;
}
