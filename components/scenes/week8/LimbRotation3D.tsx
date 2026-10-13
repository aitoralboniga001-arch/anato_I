'use client';

import { Callouts, Note, type SceneProps } from '@/components/kit';
import { Loading3D, Stage3D } from '@/components/kit/three/Stage3D';
import { geoOf, geoSlot, useGeoReady } from '@/lib/three-d/offthread';
import { mix, seg } from '@/lib/sim/anim';
import { add, cross, deg, dot, mix3, mul, norm, perp, rotate, rotateAbout, sub, type M4, type V3 } from '@/lib/three-d/math';
import { blob, curve3, merge, tube, type Mesh } from '@/lib/three-d/mesh';
import { blend, capsule, ellipsoid, partition, smin, surfaceAlong, surfaceMesh, type SDF } from '@/lib/three-d/sdf';
import type { Item3, Scene3 } from '@/lib/three-d/scene';
import { Q } from './common';
import { LIMB_T } from './Limbs';

/**
 * The opposite limb rotations of the 8th week, in 3D (notes w8/4/p13–p16). Before turning, palms and
 * soles face the trunk: the flexor mass (red) is on the inner side of every limb, the extensor mass
 * (blue) on the outer side, elbows and knees point outwards. Each limb then turns 90° about its own
 * long axis: the upper ones outwards (lateral rotation) — flexors come to the front, the elbow
 * points back; the lower ones inwards (medial rotation) — extensors come to the front, the knee
 * points forward. The viewer can drag the embryo to look from any side.
 */

/** Rotation windows inside the stage: each pair turns while its step plays. */
export const ROT3 = { up: [LIMB_T.rotUp + 0.015, LIMB_T.rotUp + 0.095], low: [LIMB_T.rotLow + 0.015, LIMB_T.rotLow + 0.095] } as const;

// Translucent pink skin; the two muscle masses show through it as strong red and blue (the code of
// every limb view), so the limb still reads as part of the same living embryo.
const SKIN = '#ebc2b2';
const SKIN_DEEP = '#93504f';
const FLEX = mix(SKIN, Q.flexor, 0.8);
const FLEX_DEEP = '#6a1d22';
const EXT = mix(SKIN, Q.extensor, 0.8);
const EXT_DEEP = '#1e2c66';

interface LimbGeo {
  /** Root (inside the body wall): the rotation turns the limb about the axis through it. */
  root: V3;
  axis: V3;
  /** Flexor side at the root before turning (towards the trunk). */
  flex: V3;
  /** Where to name it from: points along the limb (before turning) and the flexor side there. */
  marks: { mid1: V3; f1: V3; mid2: V3; f2: V3; joint: V3; jointOut: V3 };
  flexMesh: Mesh;
  extMesh: Mesh;
  hitFlex: Mesh;
  hitExt: Mesh;
}

/** A limb as one organic surface (no seam at the elbow or knee), split lengthwise into its two muscle masses. */
function limb(side: 1 | -1, lower: boolean): LimbGeo {
  const s = side;
  const root: V3 = lower ? [0.25 * s, -0.74, 0.02] : [0.31 * s, 0.32, 0.0];
  const axis = norm(lower ? [0.55 * s, -0.18, 0.82] : [0.64 * s, -0.58, 0.5]);
  const flex = perp([-s, 0, 0], axis);
  const bendAxis = norm(cross(axis, flex));
  const [l1, l2, l3] = lower ? [0.4, 0.36, 0.24] : [0.42, 0.38, 0.2];
  const phi = deg(lower ? 60 : 62);
  const d1 = axis;
  const joint = add(root, mul(d1, l1 + 0.06));
  const d2 = rotate(d1, bendAxis, phi);
  const f2 = rotate(flex, bendAxis, phi);
  const wrist = add(joint, mul(d2, l2));
  // The hand continues the forearm, a little flexed; the foot is bent up at the ankle (towards the
  // extensor side): its sole is the flexor surface.
  const a2 = norm(cross(d2, f2));
  const d3 = lower ? rotate(d2, a2, -deg(78)) : rotate(d2, a2, deg(14));
  const f3 = lower ? rotate(f2, a2, -deg(78)) : rotate(f2, a2, deg(14));
  const tip = add(wrist, mul(d3, l3));
  const start = sub(root, mul(d1, 0.08));
  // One continuous surface: the segments as rounded cones with a muscle belly each, the hand or foot
  // plate, and the five digit rays (free by the 8th week), the first one (thumb, big toe) in front.
  const [rRoot, rJoint, rEnd] = lower ? [0.15, 0.115, 0.088] : [0.125, 0.1, 0.08];
  const pre = norm(cross(d3, f3));
  const across = mul(pre, dot(pre, [0, 0, 1]) > 0 ? 1 : -1);
  const plateC = add(wrist, mul(d3, l3 * 0.42));
  const plate = ellipsoid(plateC, [lower ? 0.105 : 0.115, 0.045, l3 * 0.5], [across, f3, d3]);
  const rays = [0, 1, 2, 3, 4].map((i) => {
    const k = (i - 2) / 2;
    const base = add(add(wrist, mul(d3, l3 * 0.72)), mul(across, k * (lower ? 0.072 : 0.078)));
    const dir = norm(add(d3, mul(across, k * (i === 0 ? (lower ? 0.15 : 0.7) : 0.16))));
    const ln = (lower ? 0.075 : 0.12) * (i === 0 ? 0.72 : i === 4 ? 0.78 : 1);
    return capsule(base, add(add(base, mul(dir, ln)), mul(f3, lower ? 0.0 : 0.03)), lower ? 0.03 : 0.025, lower ? 0.026 : 0.02);
  });
  const field = blend(
    0.05,
    capsule(start, joint, rRoot, rJoint),
    ellipsoid(add(root, mul(d1, l1 * 0.5)), [rRoot * 1.05, rRoot * 1.05, l1 * 0.42], [norm(cross(d1, flex)), flex, d1]),
    capsule(joint, wrist, rJoint, rEnd),
    ellipsoid(add(joint, mul(d2, l2 * 0.42)), [rJoint * 1.08, rJoint * 1.08, l2 * 0.4], [norm(cross(d2, f2)), f2, d2]),
    plate,
    ...rays,
  );
  const pts = [start, joint, wrist, add(wrist, mul(d3, l3 + 0.15))];
  const lo: V3 = [Math.min(...pts.map((p) => p[0])) - 0.22, Math.min(...pts.map((p) => p[1])) - 0.22, Math.min(...pts.map((p) => p[2])) - 0.22];
  const hi: V3 = [Math.max(...pts.map((p) => p[0])) + 0.22, Math.max(...pts.map((p) => p[1])) + 0.22, Math.max(...pts.map((p) => p[2])) + 0.22];
  // Flexor or extensor: which side of the nearest segment's flexor direction a point lies on.
  const segs: { a: V3; b: V3; f: V3 }[] = [
    { a: start, b: joint, f: flex },
    { a: joint, b: wrist, f: f2 },
    { a: wrist, b: add(wrist, mul(d3, l3 + 0.2)), f: f3 },
  ];
  const isFlexor = (c: V3) => {
    let best = Infinity;
    let side = true;
    for (const sg of segs) {
      const ab = sub(sg.b, sg.a);
      const h = Math.max(0, Math.min(1, dot(sub(c, sg.a), ab) / dot(ab, ab)));
      const q = add(sg.a, mul(ab, h));
      const dd = sub(c, q);
      const dist = dot(dd, dd);
      if (dist < best) {
        best = dist;
        side = dot(dd, sg.f) > 0;
      }
    }
    return side;
  };
  const [flexMesh, extMesh] = partition(surfaceMesh(field, lo, hi, 0.019), isFlexor);
  const [hitFlex, hitExt] = partition(surfaceMesh(field, lo, hi, 0.06), isFlexor);
  return {
    root,
    axis,
    flex,
    marks: { mid1: add(root, mul(d1, l1 * 0.62)), f1: flex, mid2: add(joint, mul(d2, l2 * 0.5)), f2, joint, jointOut: mul(flex, -1) },
    flexMesh,
    extMesh,
    hitFlex,
    hitExt,
  };
}

/** Interpolated profile through (u, value) keys, eased between them. */
function profile(keys: readonly [number, number][]) {
  return (u: number) => {
    for (let i = 1; i < keys.length; i++)
      if (u <= keys[i][0]) {
        const [u0, v0] = keys[i - 1];
        const [u1, v1] = keys[i];
        const k = (u - u0) / (u1 - u0 || 1);
        return v0 + (v1 - v0) * k * k * (3 - 2 * k);
      }
    return keys[keys.length - 1][1];
  };
}

/**
 * The body of an 8-week embryo (Carnegie stages 20–23) as one continuous surface: rounded volumes
 * blended into each other like living tissue, with no seam between head, neck and trunk. The head is
 * very large and long (the brain grows fastest): a high forehead bulging forwards, a big occiput, and
 * a small face low in front, its chin resting on the heart prominence. The back runs in one smooth
 * C from the occiput to the rump; the heart and the liver bulge the front; the cord leaves the lower
 * belly, thick at its base. The eyes are dark (pigmented retina) and set wide; the ear is still low,
 * near the angle of the jaw.
 */
export function embryoField(): SDF {
  const up = norm([0, 0.94, -0.34]);
  const fwd = norm([0, 0.34, 0.94]);
  const X: V3 = [1, 0, 0];
  const cranium = ellipsoid([0, 1.0, 0.02], [0.5, 0.52, 0.6], [X, up, fwd]);
  const head = blend(
    0.14,
    cranium,
    ellipsoid([0, 1.1, 0.28], [0.41, 0.38, 0.35]),
    ellipsoid([0, 0.84, -0.3], [0.41, 0.43, 0.37]),
  );
  const face = blend(
    0.07,
    ellipsoid([0, 0.66, 0.38], [0.29, 0.2, 0.24]),
    ellipsoid([0, 0.7, 0.57], [0.085, 0.065, 0.07]),
    ellipsoid([0, 0.575, 0.51], [0.13, 0.05, 0.07]),
    ellipsoid([0, 0.475, 0.41], [0.15, 0.085, 0.12]),
    ellipsoid([0.23, 0.63, 0.34], [0.14, 0.13, 0.14]),
    ellipsoid([-0.23, 0.63, 0.34], [0.14, 0.13, 0.14]),
  );
  const ears = blend(0.02, ellipsoid([0.43, 0.56, -0.05], [0.045, 0.1, 0.075]), ellipsoid([-0.43, 0.56, -0.05], [0.045, 0.1, 0.075]));
  const trunk = blend(
    0.16,
    capsule([0, 0.66, -0.2], [0, 0.25, -0.25], 0.27, 0.3),
    capsule([0, 0.25, -0.25], [0, -0.5, -0.24], 0.3, 0.28),
    ellipsoid([0, 0.15, 0.0], [0.38, 0.34, 0.34]),
    ellipsoid([0, 0.29, 0.23], [0.24, 0.19, 0.2]),
    ellipsoid([0, -0.24, 0.13], [0.44, 0.42, 0.42]),
    ellipsoid([0, -0.7, -0.06], [0.34, 0.3, 0.3]),
    ellipsoid([0, -0.92, 0.06], [0.22, 0.2, 0.22]),
  );
  const joints = blend(
    0.04,
    ellipsoid([0.3, 0.31, 0.0], [0.15, 0.15, 0.14]),
    ellipsoid([-0.3, 0.31, 0.0], [0.15, 0.15, 0.14]),
    ellipsoid([0.24, -0.74, 0.02], [0.16, 0.16, 0.16]),
    ellipsoid([-0.24, -0.74, 0.02], [0.16, 0.16, 0.16]),
  );
  return (x, y, z) => smin(smin(smin(head(x, y, z), face(x, y, z), 0.12), ears(x, y, z), 0.04), smin(trunk(x, y, z), joints(x, y, z), 0.12), 0.2);
}

const BODY_MIN: V3 = [-0.7, -1.2, -0.72];
const BODY_MAX: V3 = [0.7, 1.62, 0.86];

function body() {
  const f = embryoField();
  const skin = surfaceMesh(f, BODY_MIN, BODY_MAX, 0.029);
  const skinHit = surfaceMesh(f, BODY_MIN, BODY_MAX, 0.085);
  const onSkin = (from: V3, dir: V3, radii: V3, out: number) => {
    const { p, n } = surfaceAlong(f, from, dir);
    const u = norm(cross([0, 1, 0], n));
    const v = cross(n, u);
    return blob({ center: add(p, mul(n, out)), radii, axes: [u, v, n], rings: 10, sides: 16 });
  };
  const eyeRay = (s: number): [V3, V3] => [[0.16 * s, 0.8, 0.18], [0.6 * s, 0.06, 0.8]];
  const eyes = merge([1, -1].map((s) => onSkin(...eyeRay(s), [0.078, 0.066, 0.03], -0.008)));
  // The eyelid folds: a slightly darker ring of skin around each eye.
  const lids = merge([1, -1].map((s) => onSkin(...eyeRay(s), [0.108, 0.092, 0.026], -0.013)));
  const mouthPts: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const x = -0.12 + (0.24 * i) / 10;
    mouthPts.push(add(surfaceAlong(f, [x * 0.6, 0.54, 0.2], [x * 1.4, 0, 1]).p, [0, 0, 0.002]));
  }
  const mouth = tube(mouthPts, { radius: (u) => 0.009 * Math.sin(Math.PI * Math.min(0.88, Math.max(0.12, u))), ref: [0, 0, 1], sides: 6 });
  const cordPath = curve3(
    [
      [0, -0.44, 0.3],
      [0, -0.58, 0.54],
      [-0.02, -0.76, 0.66],
    ],
    14,
  );
  // A short stump, as in embryo models: thick (the gut loops are still in it at 8 weeks), cut short so it hides nothing.
  const cord = tube(cordPath, { radius: profile([[0, 0.16], [0.4, 0.14], [1, 0.12]]), ref: [0, 1, 0], sides: 18, capEnd: true });
  return { skin, skinHit, eyes, lids, mouth, cord };
}

const GEO = geoSlot('limbs', (): { limbs: { side: 1 | -1; lower: boolean; g: LimbGeo }[]; body: ReturnType<typeof body> } => ({
    limbs: [
      { side: 1, lower: false, g: limb(1, false) },
      { side: -1, lower: false, g: limb(-1, false) },
      { side: 1, lower: true, g: limb(1, true) },
      { side: -1, lower: true, g: limb(-1, true) },
    ],
    body: body(),
  }));
const geometry = () => geoOf(GEO);

/** Signed 90° that takes the flexor side to the front (upper limbs) or to the back (lower limbs). */
function turnSign(g: LimbGeo, lower: boolean) {
  const f = rotate(g.flex, g.axis, Math.PI / 2);
  return (f[2] > 0) !== lower ? 1 : -1;
}

/** An arc around the limb's axis while it turns: which way, and how far. */
function turnArc(g: LimbGeo, angle: number, opacity: number): Mesh | null {
  if (opacity < 0.02 || Math.abs(angle) < 0.05) return null;
  const c = add(g.root, mul(g.axis, 0.16));
  const r0 = perp([0, 1, 0], g.axis);
  const pts: V3[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) pts.push(add(c, mul(rotate(r0, g.axis, (angle * i) / n), 0.25)));
  return tube(pts, { radius: (u) => (u > 0.86 ? 0.032 * (1 - (u - 0.86) / 0.14) + 0.002 : 0.012), ref: g.axis, sides: 8 });
}

export function buildLimbRotation(t: number): { scene: Scene3; turn: { up: number; low: number }; mats: M4[]; geo: ReturnType<typeof geometry> } {
  const G = geometry();
  const up = seg(t, ROT3.up[0], ROT3.up[1]);
  const low = seg(t, ROT3.low[0], ROT3.low[1]);
  const B = G.body;
  const items: Item3[] = [
    { key: 'body', mesh: B.skin, hit: B.skinHit, color: SKIN, deep: SKIN_DEEP, tissue: 'skin' },
    { key: 'lids', mesh: B.lids, color: '#d9a090', deep: '#7e3f40', tissue: 'skin', outline: false },
    { key: 'eyes', mesh: B.eyes, color: '#47323a', deep: '#140b0e', tissue: 'membrane', outline: false },
    { key: 'mouth', mesh: B.mouth, color: '#8a4246', deep: '#4a1e22', tissue: 'skin', outline: false },
    { key: 'cord', mesh: B.cord, color: '#e6c9c0', deep: '#86585a', tissue: 'skin' },
  ];
  const mats: M4[] = [];
  G.limbs.forEach(({ side, lower, g }, i) => {
    const k = lower ? low : up;
    const angle = turnSign(g, lower) * (Math.PI / 2) * k;
    const m = rotateAbout(g.root, g.axis, angle);
    mats.push(m);
    const tag = `${lower ? 'low' : 'up'}${side > 0 ? 'L' : 'R'}`;
    items.push(
      { key: `${tag}-flex`, id: 'muskulu-tolestatzaileak', mesh: g.flexMesh, hit: g.hitFlex, matrix: m, color: FLEX, deep: FLEX_DEEP, tissue: 'skin' },
      { key: `${tag}-ext`, id: 'muskulu-hedatzaileak', mesh: g.extMesh, hit: g.hitExt, matrix: m, color: EXT, deep: EXT_DEEP, tissue: 'skin' },
    );
    // The arc shows the turn of the near limbs while they turn.
    const turning = lower ? seg(t, ROT3.low[0] - 0.01, ROT3.low[0] + 0.01) * (1 - seg(t, ROT3.low[1] + 0.01, ROT3.low[1] + 0.03)) : seg(t, ROT3.up[0] - 0.01, ROT3.up[0] + 0.01) * (1 - seg(t, ROT3.up[1] + 0.01, ROT3.up[1] + 0.03));
    const arc = side > 0 ? turnArc(g, angle, turning) : null;
    if (arc) items.push({ key: `${tag}-arc-${i}`, mesh: arc, color: '#ffb86b', deep: '#a0612a', tissue: 'membrane', outline: false, opacity: turning });
  });
  // The camera eases down from the arms to the legs as the steps move on.
  const focusLow = seg(t, LIMB_T.rotLow - 0.02, LIMB_T.rotLow + 0.04);
  const target = mix3([0.08, 0.18, 0.12], [0.08, -0.28, 0.16], focusLow);
  const yaw = deg(50 + 6 * focusLow);
  const pitch = deg(14 - 4 * focusLow);
  const dist = 7.0;
  const eye: V3 = add(target, [Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist]);
  return { scene: { camera: { eye, target, fov: 30, shift: [-70, 6] }, items }, turn: { up, low }, mats, geo: G };
}

const apply = (m: M4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const applyDir = (m: M4, d: V3): V3 => [m[0] * d[0] + m[4] * d[1] + m[8] * d[2], m[1] * d[0] + m[5] * d[1] + m[9] * d[2], m[2] * d[0] + m[6] * d[1] + m[10] * d[2]];

function LimbRotation3DView({ t }: SceneProps) {
  const { scene, mats, geo } = buildLimbRotation(t);
  const upTurn = seg(t, LIMB_T.rotUp, LIMB_T.rotUp + 0.02) * (1 - seg(t, LIMB_T.rotLow - 0.01, LIMB_T.rotLow));
  const lowTurn = seg(t, LIMB_T.rotLow, LIMB_T.rotLow + 0.02);
  const before = 1 - seg(t, LIMB_T.rotUp - 0.01, LIMB_T.rotUp);
  const upDone = seg(t, ROT3.up[1] - 0.01, ROT3.up[1] + 0.01);
  const lowDone = seg(t, ROT3.low[1] - 0.01, ROT3.low[1] + 0.01);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="none" />
      <Stage3D scene={scene} axes={{ up: 'kraneala', front: 'bentrala', side: 'ezkerra', sideDir: [1, 0, 0] }}>
        {(at, view) => {
          // A point on the surface of one muscle mass, on whichever limb of the pair (and segment) shows
          // it best to the camera: the name always points at red or blue the student can see.
          const onMass = (lower: boolean, flexSide: boolean) => {
            let best = { p: [0, 0, 0] as V3, score: -Infinity };
            for (const i of lower ? [2, 3] : [0, 1])
              for (const which of ['mid1', 'mid2'] as const) {
                const g = geo.limbs[i].g;
                const m = mats[i];
                const c = apply(m, g.marks[which]);
                const f0 = applyDir(m, which === 'mid1' ? g.marks.f1 : g.marks.f2);
                const f = flexSide ? f0 : mul(f0, -1);
                const toEye = norm(sub(view.eye, c));
                const along = norm(sub(apply(m, g.marks.joint), c));
                // Lean the point from the middle of the mass towards the viewer, staying on that half.
                const side = perp(toEye, along);
                const dir = norm(add(f, mul(side, 0.5 * Math.sign(dot(side, f) || 1))));
                const score = dot(dir, toEye) + (i % 2 === 0 ? 0.08 : 0) + (which === 'mid2' ? 0.04 : 0);
                if (score > best.score) best = { p: add(c, mul(dir, lower ? 0.11 : 0.095)), score };
              }
            return at(best.p);
          };
          const jointAt = (i: number) => {
            const g = geo.limbs[i].g;
            return at(apply(mats[i], add(g.marks.joint, mul(g.flex, -0.12))));
          };
          const uf = onMass(false, true);
          const ue = onMass(false, false);
          const lf = onMass(true, true);
          const le = onMass(true, false);
          const elbow = jointAt(0);
          const knee = jointAt(2);
          return (
            <>
              <Note x={24} y={24} size={12.5} align="start">
                8. astea · ezker aldetik eta aurretik
              </Note>
              <Note x={24} y={44} size={12.5} align="start" show={before}>
                Biratu aurretik: ahurrak eta oin-zolak enborrari begira
              </Note>
              <Note x={24} y={44} size={12.5} align="start" tone="accent" show={upTurn}>
                Goikoak: 90° albora (kanpora)
              </Note>
              <Note x={24} y={44} size={12.5} align="start" tone="accent" show={lowTurn}>
                Behekoak: 90° erdialdera (barrura)
              </Note>
              <Note x={elbow.x} y={elbow.y - 22} size={12} show={upDone * (1 - lowTurn * 0.6)}>
                ukondoa atzera
              </Note>
              <Note x={knee.x} y={knee.y - 22} size={12} show={lowDone}>
                belauna aurrera
              </Note>
              <Note x={590} y={612} tone="accent" show={upTurn}>
                Goiko gorputz-adarrak: aurrean tolestatzaileak; atzean eta alboan hedatzaileak
              </Note>
              <Note x={590} y={612} tone="accent" show={lowTurn}>
                Beheko gorputz-adarrak (kontrako biraketa): aurrean hedatzaileak; atzean tolestatzaileak
              </Note>
              <Callouts
                items={[
                  { id: 'muskulu-tolestatzaileak', at: uf, show: 1 - lowTurn },
                  { id: 'muskulu-hedatzaileak', at: ue, show: 1 - lowTurn },
                  { id: 'muskulu-tolestatzaileak', at: lf, show: lowTurn, key: 'muskulu-tolestatzaileak-1' },
                  { id: 'muskulu-hedatzaileak', at: le, show: lowTurn, key: 'muskulu-hedatzaileak-1' },
                ]}
              />
            </>
          );
        }}
      </Stage3D>
    </g>
  );
}

/** The view waits (without freezing the page) until its geometry has been built off the main thread. */
export function LimbRotation3D(props: SceneProps) {
  return useGeoReady([GEO]) ? <LimbRotation3DView {...props} /> : <Loading3D />;
}
LimbRotation3D.geo = ['limbs'];
