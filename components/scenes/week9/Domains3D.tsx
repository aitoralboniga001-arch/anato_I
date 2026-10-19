'use client';

import { Callouts, Note, rand, type SceneProps } from '@/components/kit';
import { Loading3D, Stage3D } from '@/components/kit/three/Stage3D';
import { C } from '@/lib/sim/palette';
import { seg } from '@/lib/sim/anim';
import { add, deg, mix3, type M4, type V3 } from '@/lib/three-d/math';
import { blob, type Mesh } from '@/lib/three-d/mesh';
import type { Item3, Scene3 } from '@/lib/three-d/scene';
import { flyIn, reveal } from '@/lib/three-d/flyin';
import { EMBRYO5 } from '@/lib/three-d/embryo5';
import { geoOf, geoSlot, useGeoReady } from '@/lib/three-d/offthread';
import { deformBy, ellipsoid, mirrorX, polyline2, prismZ, smin, surfaceMesh, type SDF } from '@/lib/three-d/sdf';
import { HUE, W, vis } from './common';

/**
 * 9:domeinuak in 3D (notes w9/2.2.1). A cut-away block of the 5-week trunk, three somites long: its
 * cranial cut face is the familiar section (topics 4 and 9), and the skin is peeled back from the
 * cranial part so the inside shows. The somites repeat along the neural tube — dermatome over myotome,
 * the sclerotome around the notochord. The lateral somitic frontier is a green curtain the whole length
 * of the trunk; muscle precursors leave every somite's ventrolateral lip, cross it and settle in the
 * parietal layer. Then the two domains light up as volumes: primaxial (blue) inside the curtain,
 * abaxial (amber) the parietal layer with the cells that reached it.
 */

export const DOM3_T = {
  /** From the whole embryo into the block (see lib/three-d/flyin). */
  fly: [0, 0.05],
  migrate: [0.055, 0.098],
  frontier: [0.1, 0.14],
  prim: [0.2, 0.25],
  abax: [0.32, 0.37],
  recall: [0.95, 0.995],
} as const;

const Z0 = -0.92;
const Z1 = 0.92;
const SOMITES = [-0.4, 0.2, 0.8];
/** The skin covers the caudal part only: peeled back from here to the cranial cut. */
const SKIN_END = 0.12;

const PARIETAL: [number, number][] = [
  [0.72, 0.02],
  [0.95, -0.06],
  [1.07, -0.36],
  [1.0, -0.76],
  [0.72, -1.04],
  [0.32, -1.16],
];
const VISCERAL: [number, number][] = [
  [0.62, -0.02],
  [0.4, -0.22],
  [0.2, -0.36],
];
const ECTO: [number, number][] = [
  [0, 0.9],
  [0.32, 0.9],
  [0.64, 0.86],
  [0.92, 0.62],
  [1.12, 0.12],
  [1.15, -0.36],
  [1.06, -0.82],
  [0.76, -1.13],
  [0.34, -1.24],
  [0, -1.27],
];
const FRONTIER: [number, number][] = [
  [0.8, 0.73],
  [0.77, 0.45],
  [0.73, 0.2],
  [0.71, 0.03],
];
const PRIM: [number, number][] = [
  [0, 0.84],
  [0.62, 0.8],
  [0.77, 0.7],
  [0.75, 0.4],
  [0.72, 0.12],
  [0.58, 0.04],
  [0, 0.04],
];

/** A point along an open curve, by fraction of its length. */
function along(pts: readonly [number, number][], u: number): [number, number] {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const want = u * L[L.length - 1];
  for (let i = 1; i < pts.length; i++)
    if (want <= L[i]) {
      const k = (want - L[i - 1]) / (L[i] - L[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
  return pts[pts.length - 1];
}

/** Inside-or-not of a closed polygon in (x, y), as a signed distance. */
function polygonXY(pts: readonly [number, number][]) {
  const n = pts.length;
  return (x: number, y: number) => {
    let d = Infinity;
    let s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const [ax, ay] = pts[i];
      const ex = pts[j][0] - ax;
      const ey = pts[j][1] - ay;
      const wx = x - ax;
      const wy = y - ay;
      const h = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey || 1)));
      d = Math.min(d, (wx - ex * h) ** 2 + (wy - ey * h) ** 2);
      const c1 = y >= ay;
      const c2 = y < pts[j][1];
      const c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };
}

/** Intersection of two fields with the crease rounded by r (a hard max meshes as a staircase on the grid). */
const cut = (a: number, b: number, r: number) => Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0)) + Math.min(Math.max(a + r, b + r), 0) - r;
const slabZ = (z: number, z0: number, z1: number) => Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2;
const clipZ = (f: SDF, z0 = Z0, z1 = Z1, r = 0.03): SDF => (x, y, z) => cut(f(x, y, z), slabZ(z, z0, z1), r);
const sym = (f: SDF): SDF => (x, y, z) => f(Math.abs(x), y, z);

/** A fine mesh for the WebGL layer and a coarse one for pointing and the flat fallback. */
interface Pair {
  m: Mesh;
  h: Mesh;
}

interface Geo {
  neural: Pair;
  noto: Pair;
  sclero: Pair;
  dermato: Pair;
  myo: Pair;
  inter: Pair;
  aorta: Pair;
  gut: Pair;
  parietal: Pair;
  visceral: Pair;
  ecto: Pair;
  frontier: Pair;
  prim: Pair;
  abax: Pair;
  cell: Mesh;
}

function cat(m: Mesh, r: Mesh): Mesh {
  const n = m.pos.length / 3;
  const join = (a: Float32Array, b: Float32Array) => {
    const o = new Float32Array(a.length + b.length);
    o.set(a);
    o.set(b, a.length);
    return o;
  };
  const idx = new Uint32Array(m.idx.length + r.idx.length);
  idx.set(m.idx);
  for (let i = 0; i < r.idx.length; i++) idx[m.idx.length + i] = r.idx[i] + n;
  return { pos: join(m.pos, r.pos), nrm: join(m.nrm, r.nrm), uv: join(m.uv, r.uv), idx };
}

function build(): Geo {
  /** Mesh a field finely and coarsely (the coarse one a little inflated so thin sheets survive); `both` mirrors it to the left. */
  const mk = (f: SDF, lo: V3, hi: V3, step: number | V3, both = false, hitStep = 0.07): Pair => {
    const pad = hitStep * 0.45;
    const m = surfaceMesh(f, lo, hi, step);
    const h = surfaceMesh((x, y, z) => f(x, y, z) - pad, [lo[0] - pad, lo[1] - pad, lo[2] - pad], [hi[0] + pad, hi[1] + pad, hi[2] + pad], hitStep);
    return both ? { m: cat(m, mirrorX(m)), h: cat(h, mirrorX(h)) } : { m, h };
  };
  const zr: [number, number] = [Z0 - 0.04, Z1 + 0.04];
  // The block is a slice of the trunk: most parts are the same all along it (extruded), and need few
  // grid cells along it (the cut faces, in x and y, keep the fine step). Only the somites change along it.
  const along = (step: number): V3 => [step, step, 0.04];
  // Neural tube with its slit-like lumen (seen on the cut face), notochord under it.
  const neuralF: SDF = (x, y, z) => {
    const e = Math.hypot(x / 0.17, (y - 0.55) / 0.3);
    const lumen = Math.hypot(x / 0.028, (y - 0.56) / 0.2);
    return cut(Math.max((e - 1) * 0.17, -(lumen - 1) * 0.028), slabZ(z, Z0, Z1), 0.03);
  };
  const neural = mk(neuralF, [-0.2, 0.2, zr[0]], [0.2, 0.9, zr[1]], along(0.02));
  const noto = mk(prismZ((x, y) => Math.hypot(x, y - 0.13) - 0.065, Z0, Z1, 0.03), [-0.09, 0.03, zr[0]], [0.09, 0.23, zr[1]], along(0.018));
  // Sclerotome: mesenchyme gathering round the notochord and the neural tube, one condensation per somite.
  const scl = SOMITES.map((zs) => ellipsoid([0.2, 0.22, zs], [0.2, 0.24, 0.25]));
  const scleroF = clipZ(
    sym((x, y, z) => {
      let d = Infinity;
      for (const e of scl) d = smin(d, e(x, y, z), 0.06);
      // Not inside the neural tube or the notochord.
      return Math.max(d, -(Math.hypot(x / 0.18, (y - 0.55) / 0.31) - 1) * 0.17, -(Math.hypot(x, y - 0.13) - 0.075));
    }),
  );
  const sclero = mk(scleroF, [-0.45, -0.08, zr[0]], [0.45, 0.5, zr[1]], 0.024);
  const somiteF = (c: V3, r: V3): SDF => {
    const es = SOMITES.map((zs) => ellipsoid([c[0], c[1], zs + c[2]], r));
    return clipZ((x, y, z) => Math.min(es[0](x, y, z), es[1](x, y, z), es[2](x, y, z)));
  };
  // The dermatome is a curved epithelial cap over the myotome (the dermomyotome of topic 4).
  const outer = SOMITES.map((zs) => ellipsoid([0.48, 0.56, zs], [0.26, 0.17, 0.25]));
  const inner = SOMITES.map((zs) => ellipsoid([0.48, 0.53, zs], [0.21, 0.13, 0.21]));
  const capF = clipZ((x, y, z) => {
    let d = Infinity;
    for (let i = 0; i < 3; i++) d = smin(d, cut(outer[i](x, y, z), -inner[i](x, y, z), 0.012), 0.03);
    return cut(d, 0.55 - y, 0.015);
  });
  const dermato = mk(capF, [0.18, 0.5, zr[0]], [0.78, 0.78, zr[1]], 0.0135, true);
  const myo = mk(somiteF([0.48, 0.55, 0], [0.19, 0.09, 0.2]), [0.24, 0.42, zr[0]], [0.72, 0.68, zr[1]], 0.014, true);
  const inter = mk(prismZ((x, y) => Math.hypot(x - 0.65, y - 0.07) - 0.075, Z0, Z1, 0.03), [0.54, -0.04, zr[0]], [0.76, 0.18, zr[1]], along(0.016), true);
  const aorta = mk(prismZ((x, y) => Math.hypot(x - 0.2, y + 0.06) - 0.07, Z0, Z1, 0.03), [0.1, -0.16, zr[0]], [0.3, 0.04, zr[1]], along(0.016), true);
  const gut = mk(prismZ((x, y) => Math.hypot(x, y + 0.42) - 0.11, Z0, Z1, 0.03), [-0.14, -0.56, zr[0]], [0.14, -0.28, zr[1]], along(0.016));
  const par2 = polyline2(PARIETAL);
  const sheet = (d2: (u: number, v: number) => number, half: number) => prismZ((x, y) => d2(x, y) - half, Z0, Z1, Math.min(0.03, half * 0.8));
  const parietal = mk(sheet(par2, 0.04), [0.25, -1.24, zr[0]], [1.14, 0.1, zr[1]], along(0.021), true);
  // The visceral layer: from the intermediate mesoderm round the gut.
  const vis2 = polyline2(VISCERAL);
  const visF: SDF = (x, y, z) => {
    const ring = Math.abs(Math.hypot(Math.abs(x), y + 0.42) - 0.15) - 0.03;
    const strip = vis2(Math.abs(x), y) - 0.03;
    return cut(Math.min(ring, strip), slabZ(z, Z0, Z1), 0.025);
  };
  const visceral = mk(visF, [-0.7, -0.62, zr[0]], [0.7, 0.05, zr[1]], along(0.016));
  const ecto2 = polyline2(ECTO);
  const ecto = mk((x, y, z) => cut(ecto2(Math.abs(x), y) - 0.03, slabZ(z, Z0, SKIN_END), 0.025), [-1.2, -1.32, zr[0]], [1.2, 0.96, SKIN_END + 0.04], along(0.026));
  const frontier = mk(sheet(polyline2(FRONTIER), 0.016), [0.64, -0.03, zr[0]], [0.86, 0.8, zr[1]], along(0.011), true);
  const prim2 = polygonXY(PRIM);
  const prim = mk(clipZ(sym((x, y) => prim2(x, y)), Z0, Z1, 0.04), [-0.85, -0.02, zr[0]], [0.85, 0.9, zr[1]], along(0.024));
  const abax = mk(sheet(par2, 0.085), [0.18, -1.32, zr[0]], [1.22, 0.18, zr[1]], along(0.03), true);
  return { neural, noto, sclero, dermato, myo, inter, aorta, gut, parietal, visceral, ecto, frontier, prim, abax, cell: blob({ center: [0, 0, 0], radii: [0.04, 0.04, 0.04], rings: 6, sides: 8 }) };
}

const GEO = geoSlot('domains', build);

const at3 = (p: V3): M4 => {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  m[12] = p[0];
  m[13] = p[1];
  m[14] = p[2];
  return m;
};

const IDENTITY = at3([0, 0, 0]);
/** The block's two cut faces, for the fly-in. */
const PLANES = [Z0, Z1].map((z) => ({ center: [0, -0.18, z] as V3, a: [1.9, 0, 0] as V3, b: [0, 1.75, 0] as V3 }));

/** Where each migrating cell starts (a somite's ventrolateral lip) and where it settles (in the parietal layer). */
const CELLS = SOMITES.flatMap((zs, si) =>
  Array.from({ length: 7 }, (_, i) => {
    const seed = si * 31 + i * 7.3;
    const from: V3 = [0.68 + rand(seed) * 0.04, 0.5 + rand(seed + 1) * 0.06, zs + (rand(seed + 2) - 0.5) * 0.3];
    const gate: V3 = [0.74, 0.22 + rand(seed + 3) * 0.08, from[2] + (rand(seed + 4) - 0.5) * 0.1];
    // Settled on the outer face of the parietal layer, so they stay in sight.
    const u = 0.04 + rand(seed + 5) * 0.5;
    const [px, py] = along(PARIETAL, u);
    const [qx, qy] = along(PARIETAL, u + 0.01);
    const tl = Math.hypot(qx - px, qy - py) || 1;
    const to: V3 = [px - ((qy - py) / tl) * 0.05, py + ((qx - px) / tl) * 0.05, gate[2] + (rand(seed + 6) - 0.5) * 0.16];
    return { from, gate, to, delay: rand(seed + 7) * 0.45, sclero: i === 6 };
  }),
).filter((c) => c.to[2] < Z1 - 0.03 && c.to[2] > Z0 + 0.03);

function cellAt(c: (typeof CELLS)[number], k: number): V3 {
  const u = Math.max(0, Math.min(1, (k - c.delay) / (1 - c.delay)));
  return u < 0.5 ? mix3(c.from, c.gate, u * 2) : mix3(c.gate, c.to, (u - 0.5) * 2);
}

export function buildDomains(t: number, reduced: boolean) {
  const G = geoOf(GEO);
  const k1 = reduced ? 1 : seg(t, DOM3_T.migrate[0], DOM3_T.migrate[1], (q) => q);
  const k2 = seg(t, DOM3_T.recall[0], DOM3_T.recall[1], (q) => q);
  // In the last step the crossing plays again (the rule to remember).
  const kCells = t >= DOM3_T.recall[0] && !reduced ? k2 : k1;
  const front = seg(t, DOM3_T.frontier[0], DOM3_T.frontier[1]);
  const prim = seg(t, DOM3_T.prim[0], DOM3_T.prim[1]);
  const abax = seg(t, DOM3_T.abax[0], DOM3_T.abax[1]);
  // The curtain grows down from the skin.
  const grow = (p: V3): V3 => [p[0], 0.74 + (p[1] - 0.74) * Math.max(0.02, front), p[2]];
  // Grown only while it shows, and again only when it has grown further.
  const frontier = front >= 1 || front <= 0.01 ? G.frontier.m : deformBy(G.frontier.m, [front], grow);
  const frontierHit = front >= 1 || front <= 0.01 ? G.frontier.h : deformBy(G.frontier.h, [front], grow);
  const items: Item3[] = [
    { key: 'ecto', id: 'azaleko-ektodermoa', quiet: true, mesh: G.ecto.m, hit: G.ecto.h, color: '#cfdcf5', deep: '#7c8fb8', tissue: 'epithelium', opacity: 0.3, outline: false },
    { key: 'neural', id: 'hodi-neurala', mesh: G.neural.m, hit: G.neural.h, color: '#5577e6', deep: '#26398a', tissue: 'neural' },
    { key: 'noto', id: 'notokorda', mesh: G.noto.m, hit: G.noto.h, color: W.noto, deep: '#5a2a8a', tissue: 'cartilage' },
    { key: 'sclero', id: 'esklerotoma', mesh: G.sclero.m, hit: G.sclero.h, color: '#c97a5e', deep: '#7a3a28', tissue: 'mesenchyme' },
    { key: 'dermato', id: 'dermatoma', groups: ['somitak'], mesh: G.dermato.m, hit: G.dermato.h, color: '#b9564a', deep: '#6a2620', tissue: 'epithelium' },
    { key: 'myo', id: 'miotoma', groups: ['somitak'], mesh: G.myo.m, hit: G.myo.h, color: '#e8662c', deep: '#8a3210', tissue: 'muscle' },
    { key: 'inter', id: 'bitarteko-mesodermoa', mesh: G.inter.m, hit: G.inter.h, color: C.mesoIntermediate, deep: '#8a3020', tissue: 'mesenchyme' },
    { key: 'aorta', id: 'aorta-dortsalak', quiet: true, mesh: G.aorta.m, hit: G.aorta.h, color: W.aorta, deep: W.aortaDeep, tissue: 'vessel' },
    { key: 'gut', id: 'endodermoa', quiet: true, mesh: G.gut.m, hit: G.gut.h, color: W.endo, deep: W.endoDeep, tissue: 'epithelium' },
    { key: 'visceral', id: 'alboko-mesodermoa', quiet: true, mesh: G.visceral.m, hit: G.visceral.h, color: W.visceral, deep: '#7a2a38', tissue: 'mesenchyme' },
    { key: 'parietal', id: 'paretako-orria', mesh: G.parietal.m, hit: G.parietal.h, color: W.parietal, deep: '#9a5a5a', tissue: 'mesenchyme' },
  ];
  if (front > 0.01) items.push({ key: 'frontier', id: 'somitaren-alboko-muga', mesh: frontier, hit: frontierHit, color: W.frontier, deep: '#1a7a40', tissue: 'membrane', opacity: 0.75, outline: false });
  if (prim > 0.01) items.push({ key: 'prim', id: 'domeinu-primaxiala', mesh: G.prim.m, hit: G.prim.h, color: '#6f9bff', deep: '#2a4ab0', tissue: 'membrane', opacity: 0.34 * prim + 0.02, outline: false });
  if (abax > 0.01) items.push({ key: 'abax', id: 'domeinu-abaxiala', mesh: G.abax.m, hit: G.abax.h, color: HUE.abaxial, deep: '#8a4a10', tissue: 'membrane', opacity: 0.26 * abax + 0.02, outline: false });
  const cellPts: V3[] = [];
  CELLS.forEach((c, i) => {
    for (const s of [1, -1]) {
      const p = cellAt(c, kCells);
      const q: V3 = [p[0] * s, p[1], p[2]];
      if (s > 0) cellPts.push(q);
      items.push({
        key: `cell${i}${s}`,
        id: c.sclero ? 'esklerotoma' : 'aurre-alboko-muskulu-zelulak',
        groups: c.sclero ? undefined : ['mioblastoak'],
        mesh: G.cell,
        matrix: at3(q),
        color: c.sclero ? '#e8a07f' : '#ffb13d',
        deep: c.sclero ? '#6a2a18' : '#8a4a10',
        tissue: 'mesenchyme',
      });
    }
  });
  // Hold the teaching angle after the fly-in. A slow continuous orbit made every label and hit
  // outline move during reading and kept projecting the whole specimen even after migration ended.
  // The viewer can still turn it explicitly with the orbit controls.
  const yaw = deg(32);
  const elev = deg(20);
  const dist = 4.7;
  const target: V3 = [0.3, 0.02, 0.2];
  const eye = add(target, [Math.sin(yaw) * Math.cos(elev) * dist, Math.sin(elev) * dist, Math.cos(yaw) * Math.cos(elev) * dist]);
  const camera = { eye, target, fov: 30, shift: [-20, 10] as [number, number] };
  // The first second: from the whole embryo, cut at this level, into the block.
  const F = flyIn(reduced ? 1 : seg(t, DOM3_T.fly[0], DOM3_T.fly[1], (q) => q), IDENTITY, camera, PLANES);
  reveal(items, F, (it) => it.key.startsWith('cell'));
  const scene: Scene3 = { camera: F.camera, items: [...F.items, ...items] };
  return { scene, cellPts, front, prim, abax, F };
}

function Domains3DView({ t, reduced }: SceneProps) {
  const { scene, cellPts, front, prim, abax, F } = buildDomains(t, reduced);
  const L = F.labels;
  const recall = vis(t, DOM3_T.recall[0], 2);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="none" />
      <Stage3D scene={scene} axes={{ up: 'dortsala', front: 'kraneala', side: 'ezkerra', sideDir: [1, 0, 0], edges: { up: 'Dortsala', down: 'Bentrala', front: 'Kraneala', back: 'Kaudala', side: 'Ezkerra', otherSide: 'Eskuina' } }}>
        {(at, view) => {
          // Both cut faces and both sides exist: labels follow the side the learner is viewing.
          const side = view.eye[0] >= 0 ? 1 : -1;
          const faceZ = view.eye[2] >= (Z0 + Z1) / 2 ? Z1 + 0.005 : Z0 - 0.005;
          const face = (x: number, y: number) => at([x * side, y, faceZ]);
          const head = at(F.head);
          const tail = at(F.tail);
          const neural = face(0.12, 0.62);
          const noto = face(0.05, 0.15);
          const sclero = face(0.3, 0.12);
          const dermato = face(0.5, 0.71);
          const myo = face(0.5, 0.55);
          const fr = at([0.76 * side, 0.42 - 0.3 * (1 - front), faceZ]);
          const par = face(...along(PARIETAL, 0.36));
          const inter = face(0.69, 0.07);
          const cellsLabel = cellPts.length ? at(cellPts.reduce((b, p) => (p[2] > b[2] && p[1] < 0 ? p : b), cellPts[0])) : par;
          const primAt = face(0.45, 0.3);
          const abaxAt = face(...along(PARIETAL, 0.16));
          return (
            <>
              <Note x={head.x} y={head.y - 14} size={13} show={F.where}>
                Burua
              </Note>
              <Note x={tail.x} y={tail.y + 22} size={13} show={F.where}>
                Buztana
              </Note>
              <Note x={500} y={612} tone="accent" show={F.where}>
                5. astea · ebaki zeharkakoa enborraren erdian: hiru somitako xerra
              </Note>
              <Note x={24} y={24} size={12.5} align="start" show={L}>
                5. astea · enborraren xerra (hiru somita) · 3D eredua
              </Note>
              <Callouts
                items={[
                  { id: 'hodi-neurala', at: neural, show: L },
                  { id: 'domeinu-primaxiala', at: primAt, show: prim * L },
                  { id: 'notokorda', at: noto, show: L, small: true },
                  { id: 'esklerotoma', at: sclero, show: L, small: true },
                  { id: 'somitak', at: dermato, show: L },
                  { id: 'miotoma', at: myo, show: L, small: true },
                  { id: 'somitaren-alboko-muga', at: fr, show: front * L },
                  { id: 'aurre-alboko-muskulu-zelulak', at: cellsLabel, show: L, small: true },
                  { id: 'paretako-orria', at: par, show: L },
                  { id: 'domeinu-abaxiala', at: abaxAt, show: abax * L },
                  { id: 'bitarteko-mesodermoa', at: inter, show: L, small: true },
                ]}
              />
              <Note x={500} y={612} tone="accent" show={vis(t, 0, DOM3_T.frontier[0]) * L}>
                Somita bakoitzetik zelulak paretako orrira migratzen dute
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, DOM3_T.frontier[0], DOM3_T.prim[0])}>
                Muga berdea: domeinuak bereizteko eskema, ez benetako mintza
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, DOM3_T.prim[0], DOM3_T.abax[0])}>
                Barrualdean domeinu primaxiala (urdina): somitak, hodi neuralaren aldamenean
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, DOM3_T.abax[0], DOM3_T.recall[0])}>
                Kanpoaldean domeinu abaxiala (laranja): paretako orria eta bertara iritsitako zelulak
              </Note>
              <Note x={500} y={612} tone="accent" show={recall}>
                Muga gurutzatzen dutenak → paretetako eta gorputz-adarretako muskulu gehienak
              </Note>
            </>
          );
        }}
      </Stage3D>
    </g>
  );
}

/** The view waits (without freezing the page) until its geometry has been built off the main thread. */
export function Domains3D(props: SceneProps) {
  return useGeoReady([EMBRYO5, GEO]) ? <Domains3DView {...props} /> : <Loading3D />;
}
Domains3D.geo = ['embryo5', 'domains'];
