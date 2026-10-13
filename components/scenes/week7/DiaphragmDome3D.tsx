'use client';

import { Callouts, Note, type SceneProps } from '@/components/kit';
import { Loading3D, Stage3D } from '@/components/kit/three/Stage3D';
import { partState, useScene } from '@/components/kit/context';
import { seg } from '@/lib/sim/anim';
import { add, deg, mix3, type M4, type V3 } from '@/lib/three-d/math';
import { blob, curve3, tube, type Mesh } from '@/lib/three-d/mesh';
import type { Item3, Scene3 } from '@/lib/three-d/scene';
import { EMBRYO5, sectionMatrix } from '@/lib/three-d/embryo5';
import { flyIn, reveal } from '@/lib/three-d/flyin';
import { geoOf, geoSlot, useGeoReady } from '@/lib/three-d/offthread';
import { deform, polygon2, slab, surfaceMesh, type SDF } from '@/lib/three-d/sdf';
import { AORTA_X, BODY_X, CANAL_L, CAV_X, ESO_X, IVC_X, MES, SEPTUM_X } from './Diaphragm';
import { CavityKey, KEY7, P, resample, vis } from './common';
import type { Pt } from '@/components/kit';
import { FATE } from './timing';

/**
 * The diaphragm assembling itself, in 3D (notes w7/3, 3.1). The same outlines as the notes' transverse
 * section, lifted into a cut-away slice of the trunk seen from the front and above: the septum
 * transversum in front, the oesophageal mesenchyme in the middle at the back, and either side behind
 * them the open pericardioperitoneal canals (the glassy passages between the cavity above and the one
 * below). The pleuroperitoneal membranes grow in from the posterolateral wall and close the canals;
 * myocytes migrate from the septum into them; the body wall adds the muscular rim. Then the flat floor
 * rises into the dome (the right cupola higher, the back attached lower than the front), the crura grow
 * down beside the aorta to the spine, and every component keeps its colour in the adult diaphragm.
 */

/** Stage times (diafragma-eraketa). */
export const DOME_T = {
  memIn: [0.62, 0.65],
  close: [0.636, 0.72],
  /** Entering the view at its step: from the whole embryo into the slice (lib/three-d/flyin). */
  fly: [0.7568, 0.7918],
  rim: [0.787, 0.825],
  myo: [0.787, 0.855],
  dome: [0.818, 0.85],
  adult: [FATE.at, FATE.at + 0.015],
} as const;

/** The 2D section's coordinates (dorsal at the top of the image) → 3D (x = embryo's left, z = ventral). */
const X = (xi: number) => (xi - 500) / 300;
const Z = (yi: number) => (yi - 320) / 300;
/** In 3D units, resampled evenly (fewer points: the distance fields stay cheap to evaluate). */
const to2 = (pts: readonly Pt[], n = 48) => {
  const closed = [...pts, pts[0]];
  return resample(closed, n + 1)
    .slice(0, n)
    .map(([a, b]) => [X(a), Z(b)] as [number, number]);
};

const dBody = polygon2(to2(BODY_X));
const dCav = polygon2(to2(CAV_X));
const dSept = polygon2(to2(SEPTUM_X));
const dMes = polygon2(to2(MES));
const dCanalR = polygon2(to2(CANAL_L));
const dCanalL = polygon2(to2(CANAL_L.map(([a, b]) => [1000 - a, b] as Pt)));
const RIM_W = 0.1;
/** Where a membrane is attached (the posterolateral wall) and how far in it reaches when grown. */
const MEM_PIVOT = { right: X(226), left: X(774) };

const smooth = (k: number) => k * k * (3 - 2 * k);

/** Height of the adult dome over the floor at (x, z): two cupolas (the right one higher), the back attached lower than the front. */
function domeH(x: number, z: number) {
  const r2 = (x / 0.83) ** 2 + ((z - 0.23) / 0.62) ** 2;
  const base = -0.22 + 0.26 * smooth(Math.max(0, Math.min(1, (z + 0.39) / 1.24)));
  const cap = Math.pow(Math.max(0, 1 - Math.min(1, r2)), 0.75) * (0.46 + 0.07 * Math.tanh(-4 * x));
  const tendon = 0.1 * Math.exp(-(x * x) / 0.03 - ((z - 0.3) * (z - 0.3)) / 0.08);
  return base + cap - tendon;
}

/** Bounds of a plate (2D outline extent, thin in y). */
function plateBox(pts: readonly Pt[], pad: number, h: number): [V3, V3] {
  const xs = pts.map((p) => X(p[0]));
  const zs = pts.map((p) => Z(p[1]));
  return [
    [Math.min(...xs) - pad, -h, Math.min(...zs) - pad],
    [Math.max(...xs) + pad, h, Math.max(...zs) + pad],
  ];
}

interface Geo {
  wall: Mesh;
  wallHit: Mesh;
  septum: Mesh;
  septumHit: Mesh;
  mes: Mesh;
  mesHit: Mesh;
  mem: [Mesh, Mesh];
  memHit: [Mesh, Mesh];
  canal: [Mesh, Mesh];
  canalHit: [Mesh, Mesh];
  rim: Mesh;
  rimHit: Mesh;
  /** Per vertex of the rim: how far inside the wall it is, and the outward direction (x, z). */
  rimWall: Float32Array;
  rimHitWall: Float32Array;
  spine: Mesh;
  myo: Mesh;
}

const vgap = (d2: (x: number, z: number) => number, x: number, z: number) => {
  // Outward 2D gradient of an outline's distance.
  const e = 0.004;
  const gx = d2(x + e, z) - d2(x - e, z);
  const gz = d2(x, z + e) - d2(x, z - e);
  const l = Math.hypot(gx, gz) || 1;
  return [gx / l, gz / l] as const;
};

const plateBoxCav = () => plateBox(CAV_X, 0.05, 0.07);

function wallData(m: Mesh) {
  const out = new Float32Array((m.pos.length / 3) * 3);
  for (let i = 0; i < m.pos.length / 3; i++) {
    const x = m.pos[i * 3];
    const z = m.pos[i * 3 + 2];
    const [gx, gz] = vgap(dCav, x, z);
    out[i * 3] = dCav(x, z);
    out[i * 3 + 1] = gx;
    out[i * 3 + 2] = gz;
  }
  return out;
}

function build(): Geo {
  // Body wall: the slice of trunk around the cavity, cut low in front so the floor can be seen.
  const top = (z: number) => 0.5 - 0.56 * smooth(Math.max(0, Math.min(1, (z + 0.9) / 1.8)));
  const wallF: SDF = (x, y, z) => {
    const ring = Math.max(dBody(x, z), -dCav(x, z));
    return Math.max(ring, y - top(z), -0.5 - y);
  };
  const plate = (d2: (x: number, z: number) => number, half: number): SDF => slab(d2, half, Math.min(half, 0.025));
  const septF = plate(dSept, 0.05);
  const mesF = plate(dMes, 0.04);
  // A membrane fills its canal inside the cavity, up to the septum and the mesenchyme (it fuses with them).
  const memD = (dc: (x: number, z: number) => number) => (x: number, z: number) => Math.max(dc(x, z), dCav(x, z) + 0.005, -(dSept(x, z) - 0.004), -(dMes(x, z) - 0.004));
  const memF = (dc: (x: number, z: number) => number) => plate(memD(dc), 0.03);
  // The canal: the same opening, as a tall glassy passage between the cavity above and the one below.
  const canalF = (dc: (x: number, z: number) => number) => slab(memD(dc), 0.34, 0.06);
  const rimF = plate((x, z) => Math.max(dCav(x, z) - 0.004, -dCav(x, z) - RIM_W), 0.045);
  const rimMesh = surfaceMesh(rimF, ...plateBoxCav(), 0.018);
  const rimHitMesh = surfaceMesh(rimF, ...plateBoxCav(), 0.05);
  const mesh = (f: SDF, step: number, box: [V3, V3]) => surfaceMesh(f, box[0], box[1], step);
  const wallBox: [V3, V3] = [
    [-1.06, -0.56, -0.96],
    [1.06, 0.68, 0.96],
  ];
  const septBox = plateBox(SEPTUM_X, 0.06, 0.08);
  const mesBox = plateBox(MES, 0.06, 0.07);
  const canalBoxR = plateBox(CANAL_L, 0.06, 0.07);
  const canalBoxL = plateBox(CANAL_L.map(([a, b]) => [1000 - a, b] as Pt), 0.06, 0.07);
  const tall = (b: [V3, V3]): [V3, V3] => [
    [b[0][0], -0.42, b[0][2]],
    [b[1][0], 0.42, b[1][2]],
  ];

  // The spine: vertebral bodies behind the aorta, above and below the slice.
  const spine: Mesh = surfaceMesh((x, y, z) => {
    let d = Infinity;
    for (let i = -4; i <= 4; i++) {
      const cy = i * 0.21;
      const q = Math.hypot(x / 0.12, (y - cy) / 0.085, (z - Z(158)) / 0.075);
      d = Math.min(d, (q - 1) * 0.075);
    }
    return d;
  }, [-0.16, -0.95, Z(158) - 0.11], [0.16, 0.95, Z(158) + 0.11], 0.02);
  return {
    wall: mesh(wallF, 0.036, wallBox),
    wallHit: mesh(wallF, 0.09, wallBox),
    septum: mesh(septF, 0.02, septBox),
    septumHit: mesh(septF, 0.06, septBox),
    mes: mesh(mesF, 0.018, mesBox),
    mesHit: mesh(mesF, 0.05, mesBox),
    mem: [mesh(memF(dCanalR), 0.018, canalBoxR), mesh(memF(dCanalL), 0.018, canalBoxL)],
    memHit: [mesh(memF(dCanalR), 0.05, canalBoxR), mesh(memF(dCanalL), 0.05, canalBoxL)],
    canal: [mesh(canalF(dCanalR), 0.035, tall(canalBoxR)), mesh(canalF(dCanalL), 0.035, tall(canalBoxL))],
    canalHit: [mesh(canalF(dCanalR), 0.08, tall(canalBoxR)), mesh(canalF(dCanalL), 0.08, tall(canalBoxL))],
    rim: rimMesh,
    rimHit: rimHitMesh,
    rimWall: wallData(rimMesh),
    rimHitWall: wallData(rimHitMesh),
    spine,
    myo: blob({ center: [0, 0, 0], radii: [0.04, 0.017, 0.017], rings: 6, sides: 8 }),
  };
}

const GEO = geoSlot('diaphragm', build);
let last: { t: number; out: ReturnType<typeof frameAt> } | null = null;


function frameAt(t: number) {
  const G = geoOf(GEO);
  const memK = seg(t, DOME_T.memIn[0], DOME_T.memIn[1]);
  const c = seg(t, DOME_T.close[0], DOME_T.close[1]);
  // The membrane's free edge sweeps from the wall to the middle: the grown part is squeezed against the wall.
  const memGrow = 0.08 + 0.92 * Math.pow(c, 0.85);
  const rimK = seg(t, DOME_T.rim[0], DOME_T.rim[1]);
  const domeK = seg(t, DOME_T.dome[0], DOME_T.dome[1]);
  const lift = (p: V3): V3 => [p[0], p[1] + domeK * domeH(p[0], p[2]), p[2]];
  const squeeze = (pivot: number, k: number) => (p: V3): V3 => lift([pivot + (p[0] - pivot) * k, p[1], p[2]]);
  // The rim grows inwards from the wall: its vertices are pushed back towards the wall while it is thin.
  const rimMove = (data: Float32Array) => (p: V3, i: number): V3 => {
    const back = (data[i * 3] + 0.004) * (1 - Math.max(0.06, rimK));
    return lift([p[0] - data[i * 3 + 1] * back, p[1], p[2] - data[i * 3 + 2] * back]);
  };
  // The open part of each canal shrinks towards the middle as its membrane comes in.
  const medial = { right: X(470), left: X(530) };
  const open = Math.max(0.04, 1 - c);
  return {
    domeK,
    memK,
    c,
    rimK,
    lift,
    meshes: {
      septum: deform(G.septum, lift),
      septumHit: deform(G.septumHit, lift),
      mes: deform(G.mes, lift),
      mesHit: deform(G.mesHit, lift),
      memR: deform(G.mem[0], squeeze(MEM_PIVOT.right, memGrow)),
      memL: deform(G.mem[1], squeeze(MEM_PIVOT.left, memGrow)),
      memRHit: deform(G.memHit[0], squeeze(MEM_PIVOT.right, memGrow)),
      memLHit: deform(G.memHit[1], squeeze(MEM_PIVOT.left, memGrow)),
      canalR: deform(G.canal[0], (p) => [medial.right + (p[0] - medial.right) * open, p[1], p[2]]),
      canalL: deform(G.canal[1], (p) => [medial.left + (p[0] - medial.left) * open, p[1], p[2]]),
      canalRHit: deform(G.canalHit[0], (p) => [medial.right + (p[0] - medial.right) * open, p[1], p[2]]),
      canalLHit: deform(G.canalHit[1], (p) => [medial.left + (p[0] - medial.left) * open, p[1], p[2]]),
      rim: deform(G.rim, rimMove(G.rimWall)),
      rimHit: deform(G.rimHit, rimMove(G.rimHitWall)),
    },
  };
}

/** Vertical tubes through the slice: the aorta behind, the oesophagus through the mesenchyme, the IVC through the septum. */
const AORTA = tube(
  [
    [X(AORTA_X[0]), 0.78, Z(AORTA_X[1])],
    [X(AORTA_X[0]), -0.8, Z(AORTA_X[1])],
  ],
  { radius: () => 0.046, ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true },
);
const ESO = tube(
  curve3(
    [
      [X(ESO_X[0]) - 0.02, 0.72, Z(ESO_X[1]) - 0.04],
      [X(ESO_X[0]), 0.2, Z(ESO_X[1])],
      [X(ESO_X[0]) + 0.04, -0.35, Z(ESO_X[1]) + 0.06],
      [X(ESO_X[0]) + 0.16, -0.62, Z(ESO_X[1]) + 0.16],
    ],
    20,
  ),
  { radius: () => 0.034, ref: [0, 0, 1], sides: 14, capStart: true, capEnd: true },
);
const STOMACH = blob({ center: [X(ESO_X[0]) + 0.3, -0.72, Z(ESO_X[1]) + 0.2], radii: [0.2, 0.13, 0.13], axes: [[0.86, -0.5, 0], [0.5, 0.86, 0], [0, 0, 1]], rings: 14, sides: 18 });
const IVC = tube(
  [
    [X(IVC_X[0]), 0.62, Z(IVC_X[1])],
    [X(IVC_X[0]), -0.7, Z(IVC_X[1])],
  ],
  { radius: () => 0.038, ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true },
);

/** The crura: from the back of the oesophageal mesenchyme down beside the aorta to the vertebral bodies. */
function crura(lift: (p: V3) => V3, k: number): Mesh | null {
  if (k < 0.02) return null;
  const parts = [1, -1].map((s) => {
    const a = lift([s * 0.07, 0, Z(232)]);
    const b: V3 = [s * 0.11, a[1] - 0.25 * k, Z(214)];
    const c: V3 = [s * 0.1, a[1] - 0.6 * k, Z(178)];
    return tube(curve3([a, b, c], 12), { radius: (u) => 0.045 * (1 - 0.45 * u), ref: [0, 0, 1], sides: 12, capEnd: true });
  });
  const [p, q] = parts;
  const n = p.pos.length / 3;
  const idx = new Uint32Array(p.idx.length + q.idx.length);
  idx.set(p.idx);
  for (let i = 0; i < q.idx.length; i++) idx[p.idx.length + i] = q.idx[i] + n;
  const cat = (a: Float32Array, b: Float32Array) => {
    const o = new Float32Array(a.length + b.length);
    o.set(a);
    o.set(b, a.length);
    return o;
  };
  return { pos: cat(p.pos, q.pos), nrm: cat(p.nrm, q.nrm), uv: cat(p.uv, q.uv), idx };
}

const translate = (p: V3, yaw: number): M4 => {
  const m = new Float32Array(16);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  m[0] = c;
  m[2] = -s;
  m[5] = 1;
  m[8] = s;
  m[10] = c;
  m[12] = p[0];
  m[13] = p[1];
  m[14] = p[2];
  m[15] = 1;
  return m;
};

/** The 5-week embryo placed so its section between the heart and the liver is this slice (x left, y cranial, z ventral). */
const EMBRYO_AT = sectionMatrix(0.95, [0, 0, 0.05], [1, 0, 0], [0, 0, -1], 0.8);
/** The slice's cut faces (above and below), for the fly-in. */
const PLANES = [-0.5, 0.5].map((y) => ({ center: [0, y, 0.05] as V3, a: [1.7, 0, 0] as V3, b: [0, 0, 1.6] as V3 }));


/** `canalLit`: the canals are what is being studied, so their glass is denser (otherwise they barely read). */
export function buildDiaphragm(t: number, reduced: boolean, canalLit = false) {
  if (!last || last.t !== t) last = { t, out: frameAt(t) };
  const F = last.out;
  const G = geoOf(GEO);
  const M = F.meshes;
  const canalShow = 1 - seg(F.c, 0.82, 1);
  const crusK = seg(t, DOME_T.dome[0] + 0.01, DOME_T.dome[1] + 0.01);
  const items: Item3[] = [
    { key: 'wall', id: 'gorputz-pareta', quiet: true, mesh: G.wall, hit: G.wallHit, color: '#9a6570', deep: '#4a2630', tissue: 'mesenchyme' },
    { key: 'spine', id: 'ornoak', quiet: true, mesh: G.spine, color: P.bone, deep: '#8a8070', tissue: 'cartilage' },
    { key: 'aorta', id: 'aorta', mesh: AORTA, color: P.aorta, deep: '#6a0f1e', tissue: 'vessel' },
    { key: 'ivc', id: 'beheko-kaba-zaina', mesh: IVC, color: P.ivc, deep: '#1c3c88', tissue: 'vessel' },
    { key: 'eso', id: 'hestegorria', mesh: ESO, color: '#c98a7a', deep: '#6a3a34', tissue: 'epithelium' },
    { key: 'stomach', id: 'urdaila', quiet: true, mesh: STOMACH, color: '#d9a084', deep: '#7a4a3a', tissue: 'epithelium' },
    { key: 'septum', id: 'septum-transversum', groups: ['zentro-tendinosoa'], mesh: M.septum, hit: M.septumHit, color: P.septum, deep: P.septumDeep, tissue: 'mesenchyme' },
    { key: 'mes', id: 'hestegorri-inguruko-mesenkima', groups: ['gerriko-atala'], mesh: M.mes, hit: M.mesHit, color: P.eso, deep: '#2a6a60', tissue: 'mesenchyme' },
    { key: 'memR', id: 'mintz-pleuroperitonealak', mesh: M.memR, hit: M.memRHit, color: P.poMem, deep: '#5a3a8a', tissue: 'membrane', show: F.memK },
    { key: 'memL', id: 'mintz-pleuroperitonealak', mesh: M.memL, hit: M.memLHit, color: P.poMem, deep: '#5a3a8a', tissue: 'membrane', show: F.memK },
    { key: 'rim', id: 'gorputz-paretako-mesodermoa', groups: ['diafragmaren-alde-periferikoa'], mesh: M.rim, hit: M.rimHit, color: P.bodyMuscle, deep: '#6a2a4a', tissue: 'muscle', show: F.rimK > 0.01 ? 1 : 0 },
  ];
  if (canalShow > 0.02)
    items.push(
      { key: 'canalR', id: 'erreten-perikardioperitonealak', mesh: M.canalR, hit: M.canalRHit, color: '#7fc8e8', deep: '#2a5a78', tissue: 'membrane', opacity: (canalLit ? 0.58 : 0.32) * canalShow, outline: false },
      { key: 'canalL', id: 'erreten-perikardioperitonealak', mesh: M.canalL, hit: M.canalLHit, color: '#7fc8e8', deep: '#2a5a78', tissue: 'membrane', opacity: (canalLit ? 0.58 : 0.32) * canalShow, outline: false },
    );
  const cr = crura(F.lift, crusK);
  if (cr) items.push({ key: 'crura', id: 'hestegorri-inguruko-mesenkima', groups: ['gerriko-atala'], mesh: cr, color: P.eso, deep: '#2a6a60', tissue: 'muscle' });
  // Myocytes from the septum into the membranes, while they are being colonised.
  const myoShow = vis(t, DOME_T.myo[0], DOME_T.myo[1], 0.012);
  const myoAt: V3[] = [];
  if (myoShow > 0.02)
    for (let i = 0; i < 3; i++) {
      const u = reduced ? 0.2 + i * 0.3 : (i / 3 + seg(t, DOME_T.myo[0], DOME_T.myo[1], (k) => k) * 2.4) % 1;
      for (const s of [1, -1]) {
        const a: V3 = [s * Math.abs(X(400)), 0, Z(430)];
        const b: V3 = [s * Math.abs(X(332)), 0, Z(300)];
        const p0 = mix3(a, b, u);
        const p = F.lift([p0[0], 0.065 + 0.04 * Math.sin(Math.PI * u), p0[2]]);
        myoAt.push(p);
        items.push({ key: `myo${i}${s}`, id: 'miozitoak', mesh: G.myo, matrix: translate(p, s * deg(58)), color: '#ff98a6', deep: '#7a1f2e', tissue: 'muscle', show: myoShow });
      }
    }
  // Camera: from the front and above onto the floor; lower and a little round while the dome rises.
  // While the dome rises the camera goes round to the side: the profile (front higher, back lower)
  // and the near membrane come into view; it keeps turning slowly while the step holds.
  const k = F.domeK;
  const hold = seg(t, DOME_T.dome[1], DOME_T.adult[1] + 0.03, (q) => q);
  const elev = deg(58 - 14 * k);
  const yaw = deg(-14 + 74 * k + 16 * hold);
  const dist = 5.6;
  const target: V3 = [0, 0.02 + 0.16 * k, 0.12];
  const eye = add(target, [Math.sin(yaw) * Math.cos(elev) * dist, Math.sin(elev) * dist, Math.cos(yaw) * Math.cos(elev) * dist]);
  const camera = { eye, target, fov: 30, shift: [0, 18] as [number, number] };
  // Entering the view: the whole embryo, cut between the heart and the liver, then into the slice.
  const fly = reduced || t < DOME_T.fly[0] ? 1 : seg(t, DOME_T.fly[0], DOME_T.fly[1], (q) => q);
  const FI = flyIn(fly, EMBRYO_AT, camera, PLANES, { cranial: [0, 1, 0], dorsal: [0, 0, -1] });
  reveal(items, FI, (it) => it.key.startsWith('myo'));
  const scene: Scene3 = { camera: FI.camera, items: [...FI.items, ...items] };
  return { scene, F, myoAt, canalShow, FI };
}

function DiaphragmDome3DView({ t, reduced }: SceneProps) {
  const ctx = useScene();
  const lit = ['focus', 'spot', 'active'].includes(partState(ctx, 'erreten-perikardioperitonealak'));
  const { scene, F, myoAt, canalShow, FI } = buildDiaphragm(t, reduced, lit);
  const L = FI.labels;
  const top = (x: number, z: number, up = 0.06) => F.lift([x, up, z]);
  const adult = seg(t, DOME_T.adult[0], DOME_T.adult[1]);
  const young = 1 - adult;
  const memShow = F.memK;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="none" />
      <Stage3D scene={scene} axes={{ up: 'kraneala', front: 'bentrala', side: 'ezkerra', sideDir: [1, 0, 0] }}>
        {(at) => {
          const sept = at(top(X(560), Z(500), 0.06));
          const mes = at(top(X(500), Z(330), 0.05));
          const memR = at(top(MEM_PIVOT.right + (X(330) - MEM_PIVOT.right) * (0.08 + 0.92 * F.c), Z(300), 0.04));
          const canal = at([X(330) + (X(470) - X(330)) * (1 - Math.max(0.04, 1 - F.c)), 0.2, Z(300)]);
          const rim = at(top(X(712), Z(500), 0.05));
          const aorta = at([X(AORTA_X[0]) + 0.05, 0.62, Z(AORTA_X[1])]);
          const eso = at([X(ESO_X[0]) + 0.03, 0.55, Z(ESO_X[1])]);
          const ivc = at([X(IVC_X[0]) - 0.04, 0.45, Z(IVC_X[1])]);
          const myo = myoAt.length ? at(myoAt[0]) : null;
          const head = at(FI.head);
          const tail = at(FI.tail);
          const crus = at(F.lift([0.1, -0.35 * seg(t, DOME_T.dome[0] + 0.01, DOME_T.dome[1] + 0.01), Z(200)]));
          return (
            <>
              <Note x={head.x} y={head.y - 14} size={13} show={FI.where}>
                Burua
              </Note>
              <Note x={tail.x} y={tail.y + 22} size={13} show={FI.where}>
                Buztana
              </Note>
              <Note x={500} y={612} tone="accent" show={FI.where * (t >= DOME_T.fly[0] ? 1 : 0)}>
                5. astea · ebaki zeharkakoa septum transversumaren mailan
              </Note>
              <Note x={24} y={24} size={12.5} align="start" show={L}>
                Diafragmaren osagaiak · aurretik eta goitik
              </Note>
              <CavityKey rows={[canalShow > 0.5 && KEY7.canal, KEY7.septum]} y={48} show={L} quiet />
              <Callouts
                items={[
                  { id: 'aorta', at: aorta, show: L, small: true },
                  { id: 'hestegorria', at: eso, show: L, small: true },
                  { id: 'hestegorri-inguruko-mesenkima', at: mes, show: young * L },
                  { id: 'gerriko-atala', at: crus, show: adult * L },
                  { id: 'gorputz-paretako-mesodermoa', at: rim, show: ((F.rimK > 0.05 ? 1 : 0) * young) * L },
                  { id: 'diafragmaren-alde-periferikoa', at: rim, show: adult * L },
                  { id: 'erreten-perikardioperitonealak', at: canal, show: canalShow * L, small: true },
                  { id: 'mintz-pleuroperitonealak', at: memR, show: memShow * L },
                  { id: 'miozitoak', at: myo ?? { x: 0, y: 0 }, show: myo ? (vis(t, DOME_T.myo[0], DOME_T.myo[1], 0.012)) * L : 0, small: true },
                  { id: 'beheko-kaba-zaina', at: ivc, show: L, small: true },
                  { id: 'septum-transversum', at: sept, show: young * L },
                  { id: 'zentro-tendinosoa', at: sept, show: adult * L },
                ]}
              />
              <Note x={500} y={612} tone="accent" show={vis(t, 0, DOME_T.close[0]) * L}>
                Erretenak zabalik: goiko barrunbea (pleura) ↔ beheko barrunbea (peritoneoa)
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, DOME_T.close[0], DOME_T.rim[0]) * L}>
                5. astea: mintz pleuroperitonealak hazi eta erretenak ixten dituzte
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, DOME_T.rim[0], DOME_T.dome[0]) * L}>
                Miozitoak septumetik mintzetara · gorputz paretak ertz muskularra
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, DOME_T.dome[0], DOME_T.adult[0]) * L}>
                Lau osagaiak kupula bihurtzen dira: bakoitzak bere tokia gordetzen du
              </Note>
              <Note x={500} y={612} tone="accent" show={adult * L}>
                Zentro tendinosoa ← septuma · gerriko atala ← mesenkima · alde periferikoa ← gorputz pareta
              </Note>
            </>
          );
        }}
      </Stage3D>
    </g>
  );
}

/** The view waits (without freezing the page) until its geometry has been built off the main thread. */
export function DiaphragmDome3D(props: SceneProps) {
  return useGeoReady([EMBRYO5, GEO]) ? <DiaphragmDome3DView {...props} /> : <Loading3D />;
}
DiaphragmDome3D.geo = ['embryo5', 'diaphragm'];
