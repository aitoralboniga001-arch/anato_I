import { cachedBlob, cachedMerge, cachedMesh, cachedTube } from '@/lib/three-d/mesh-cache';
import { curve3, grid, merge, type Mesh } from '@/lib/three-d/mesh';
import type { V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { P } from './common';

/**
 * The body cavities of topic 7 as one model that changes through the notes' six moments (w7/1–3.1):
 * the continuous horseshoe coelom; the septum transversum splitting it into an upper (pericardial) and a
 * lower (peritoneal) space joined by two dorsal canals; the lungs pushing into the canals' upper ends,
 * which become the two pleural cavities, cut off from the pericardium by the pleuropericardial folds; the
 * pleuroperitoneal membranes growing in from the posterolateral walls and closing the canals; and the
 * floor rising into the dome, its four sources kept in place (septum in front, membranes either side at
 * the back, oesophageal mesenchyme in the middle at the back, the body wall's rim all round).
 *
 * Axes: x = the embryo's left, y = cranial, z = ventral. Item keys are the Eratorriak room's piece keys,
 * so a lit piece in the room is the same item here; context (heart, lungs, gut, spine) has its own keys.
 */

export interface CavPose {
  /** The continuous coelom (moment 0) giving way to the separate spaces. */
  coelom: number;
  /** Septum and the three spaces of moment 1. */
  split: number;
  /** Lungs' size (they push into the canals' upper ends). */
  lungs: number;
  /** Pleural cavities grown round the lungs; the pericardial space narrows to the front and middle. */
  pleura: number;
  /** Pleuropericardial folds: grown, and how far moved to the middle. */
  fold: number;
  /** Pleuroperitoneal membranes: 0 absent → 1 grown to the septum (canals closed). */
  mem: number;
  /** How open the canals still are. */
  canal: number;
  /** Height of the floor (septum level): it goes down as the septum descends. */
  floorY: number;
  /** The floor rising into the dome. */
  dome: number;
  /** The body wall's rim: 0 in the wall, 1 the diaphragm's peripheral muscle. */
  rim: number;
  /** The upper cavities and organs made glassy, so the floor can be seen from above. */
  glass: number;
}

const POSE0: CavPose = { coelom: 1, split: 0, lungs: 0, pleura: 0, fold: 0, mem: 0, canal: 1, floorY: 0.6, dome: 0, rim: 0, glass: 0 };
export const CAV_POSES: CavPose[] = [
  POSE0,
  { ...POSE0, coelom: 0, split: 1 },
  { ...POSE0, coelom: 0, split: 1, lungs: 0.7, pleura: 0.75, fold: 0.6 },
  { ...POSE0, coelom: 0, split: 1, lungs: 1, pleura: 1, fold: 0.85, mem: 0.45, canal: 0.55, floorY: 0.38, glass: 0.95 },
  { ...POSE0, coelom: 0, split: 1, lungs: 1, pleura: 1, fold: 1, mem: 1, canal: 0, floorY: 0.3, glass: 0.95 },
  { ...POSE0, coelom: 0, split: 1, lungs: 1, pleura: 1, fold: 1, mem: 1, canal: 0, floorY: 0.1, dome: 1, rim: 1, glass: 0.8 },
];

export function mixCav(a: CavPose, b: CavPose, k: number): CavPose {
  const o = { ...a };
  for (const key of Object.keys(a) as (keyof CavPose)[]) o[key] = a[key] + (b[key] - a[key]) * k;
  return o;
}

/** The floor's outline (an ellipse; r = 1 at the cavity's edge) and the dome over it. */
const RX = 1.3;
const RZ = 1.0;
const Z0 = -0.05;
const floorXZ = (r: number, th: number): [number, number] => [r * RX * Math.sin(th), Z0 + r * RZ * Math.cos(th)];
/** Height of the adult dome at r, θ: two cupolas (the embryo's right one a little higher), flat at the rim. */
const domeH = (r: number, th: number) => (r >= 1 ? 0 : Math.pow(1 - r * r, 0.8) * 0.52 * (1 - 0.14 * Math.sin(th)));
const D = Math.PI / 180;

/** One sector of the floor, r0..r1 × θ0..θ1 (degrees from ventral, towards the embryo's left), as a thin plate. */
function sector(pose: CavPose, r0: number, r1: number, t0: number, t1: number, thick = 0.07): Mesh {
  return cachedMesh('cav-sector', [pose.floorY, pose.dome, r0, r1, t0, t1, thick], () => {
    const at =
      (dy: number) =>
      (u: number, v: number): V3 => {
        const r = r0 + (r1 - r0) * u;
        const th = (t0 + (t1 - t0) * v) * D;
        const [x, z] = floorXZ(r, th);
        return [x, pose.floorY + pose.dome * domeH(r, th) + dy, z];
      };
    const n = Math.max(2, Math.round((t1 - t0) / 8));
    return merge([grid(8, n, at(thick / 2), [0, 9, 0]), grid(8, n, at(-thick / 2), [0, -9, 0])]);
  });
}

/** A point on the floor (for names). */
const floorPt = (pose: CavPose, r: number, deg: number, up = 0.06): V3 => {
  const [x, z] = floorXZ(r, deg * D);
  return [x, pose.floorY + pose.dome * domeH(r, deg * D) + up, z];
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const HEART_C: V3 = [0, 1.55, 0.3];
const GUT_UP: V3[] = [
  [0.0, 2.45, -0.45],
  [0.02, 1.4, -0.46],
  [0.06, 0.6, -0.42],
  [0.28, -0.2, -0.25],
];
const GUT_DOWN: V3[] = [
  [0.3, -0.7, -0.2],
  [0.08, -1.5, -0.32],
  [0.0, -2.45, -0.38],
];
const STOMACH = {
  center: [0.36, -0.45, -0.18] as V3,
  radii: [0.32, 0.22, 0.2] as V3,
  axes: [
    [0.86, -0.5, 0],
    [0.5, 0.86, 0],
    [0, 0, 1],
  ] as [V3, V3, V3],
};
/** The coelom of moment 0: the horseshoe, its bend at the head end (in front, round the heart), its two limbs open at the tail end. */
const HORSESHOE = curve3(
  [
    [-0.86, -3.15, 0.4],
    [-0.88, -1.6, 0.12],
    [-0.8, 0.6, -0.18],
    [-0.6, 1.62, 0.22],
    [0, 2.0, 0.55],
    [0.6, 1.62, 0.22],
    [0.8, 0.6, -0.18],
    [0.88, -1.6, 0.12],
    [0.86, -3.15, 0.4],
  ],
  72,
);

export type Colour = (key: string) => string;

/**
 * The model at a pose. `colour` gives each room piece its colour (the room's origin or fate colours);
 * `show` its visibility at the moment (from the room's lives: 0 absent, fading while it goes).
 */
export function cavityModel(pose: CavPose, colour: Colour, show: (key: string) => number) {
  const items: Item3[] = [];
  const g = pose.glass;
  const glassy = (o: number) => o * (1 - 0.85 * g);
  const add = (it: Item3) => {
    const s = it.show ?? 1;
    if (s > 0.01) items.push(it);
  };

  // Context: spine behind, the gut through the middle, the heart in front and above, the lungs.
  add({
    key: 'spine',
    id: 'ornoak',
    quiet: true,
    mesh: cachedMerge(
      Array.from({ length: 12 }, (_, i) =>
        cachedBlob({ center: [0, -2.7 + i * 0.4, -1.15], radii: [0.17, 0.13, 0.14], rings: 8, sides: 12 }),
      ),
    ),
    color: P.bone,
    deep: '#8a8070',
    tissue: 'cartilage',
    opacity: 1 - 0.75 * g,
  });
  const gut = cachedMerge([
    cachedTube(curve3(GUT_UP, 18), { radius: () => 0.085, ref: [0, 0, 1], sides: 12, capStart: true }),
    cachedBlob({ ...STOMACH, rings: 12, sides: 16 }),
    cachedTube(curve3(GUT_DOWN, 14), { radius: () => 0.095, ref: [0, 0, 1], sides: 12, capEnd: true }),
  ]);
  add({ key: 'gut', id: 'hestea', quiet: true, mesh: gut, color: '#c7a98a', deep: '#6e5a48', tissue: 'epithelium', opacity: glassy(0.85) });
  const heart = cachedBlob({ center: HEART_C, radii: [0.48, 0.52, 0.4], rings: 14, sides: 18 });
  add({ key: 'heart', id: 'bihotza', mesh: heart, color: P.heart, deep: P.heartDeep, tissue: 'muscle', opacity: glassy(1) });
  if (pose.lungs > 0.02)
    add({
      key: 'lungs',
      id: 'birikak',
      mesh: cachedMerge(
        [-1, 1].map((s) =>
          cachedBlob({
            center: [s * 0.74, 1.5, -0.36],
            radii: [0.3 * pose.lungs, 0.55 * pose.lungs, 0.3 * pose.lungs],
            rings: 12,
            sides: 16,
          }),
        ),
      ),
      color: P.lung,
      deep: P.lungDeep,
      tissue: 'epithelium',
      opacity: glassy(1),
    });

  // Serosa: the parietal lining of the wall all round, the visceral layer on the organs.
  add({
    key: 'parietal',
    id: 'paretako-orria',
    mesh: cachedBlob({ center: [0, -0.2, -0.02], radii: [1.5, 2.8, 1.22], rings: 24, sides: 32 }),
    color: colour('parietal'),
    tissue: 'membrane',
    opacity: 0.1,
    thin: 0.6,
    outline: false,
    show: show('parietal'),
  });
  add({
    key: 'visceral',
    id: 'errai-orria',
    mesh: cachedMerge([
      cachedBlob({ center: HEART_C, radii: [0.53, 0.57, 0.45], rings: 14, sides: 18 }),
      cachedTube(curve3(GUT_DOWN, 14), { radius: () => 0.16, ref: [0, 0, 1], sides: 12 }),
    ]),
    color: colour('visceral'),
    tissue: 'membrane',
    opacity: 0.32 * (1 - 0.5 * g),
    thin: 0.6,
    outline: false,
    show: show('visceral'),
  });
  add({
    key: 'mesentery',
    id: 'mesenterio-dortsala',
    mesh: cachedBlob({ center: [0, -1.55, -0.78], radii: [0.03, 0.95, 0.4], rings: 10, sides: 14 }),
    color: colour('mesentery'),
    tissue: 'membrane',
    thin: 0.5,
    show: show('mesentery') * pose.split,
  });

  // The cavities (spaces): glassy volumes, the organs seen through them.
  add({
    key: 'coelom',
    id: 'enbrioi-barruko-zeloma',
    mesh: cachedTube(HORSESHOE, { radius: () => 0.32, ref: [0, 0, 1], sides: 16 }),
    color: colour('coelom'),
    tissue: 'membrane',
    opacity: 0.55 * pose.coelom,
    show: show('coelom') > 0 ? pose.coelom : 0,
  });
  const pr = (a: number, b: number) => lerp(a, b, pose.pleura);
  add({
    key: 'pericardial',
    id: 'perikardio-barrunbea',
    mesh: cachedBlob({ center: [0, 1.55, pr(0.05, 0.3)], radii: [pr(1.05, 0.66), pr(0.82, 0.7), pr(0.86, 0.58)], rings: 18, sides: 24 }),
    color: colour('pericardial'),
    tissue: 'membrane',
    opacity: glassy(0.34) * pose.split,
    show: show('pericardial'),
  });
  for (const [key, s] of [
    ['pleuralR', -1],
    ['pleuralL', 1],
  ] as const)
    if (pose.pleura > 0.02)
      add({
        key,
        id: 'pleura-barrunbea',
        mesh: cachedBlob({
          center: [s * 0.8, 1.45, -0.3],
          radii: [0.44 * pose.pleura, lerp(0.4, 0.82, pose.pleura), 0.48 * pose.pleura],
          rings: 14,
          sides: 18,
        }),
        color: colour(key),
        tissue: 'membrane',
        opacity: glassy(0.36),
        show: show(key),
      });
  add({
    key: 'peritoneal',
    id: 'peritoneo-barrunbea',
    mesh: cachedBlob({ center: [0, -1.3, 0.05], radii: [1.18, 1.18, 0.95], rings: 18, sides: 24 }),
    color: colour('peritoneal'),
    tissue: 'membrane',
    opacity: 0.3 * pose.split,
    show: show('peritoneal'),
  });
  // The canals: behind the septum, either side of the oesophageal mesenchyme, from the upper space down to
  // the lower one. The left one is the larger (w7/3/p8/s1).
  for (const [key, s, rad] of [
    ['canalR', -1, 0.17],
    ['canalL', 1, 0.21],
  ] as const) {
    const [cx, cz] = floorXZ(0.52, s * 115 * D);
    const r = rad * Math.max(0.06, pose.canal);
    const top: V3 = pose.pleura > 0.5 ? [s * 0.8, 1.1, -0.3] : [s * 0.68, 1.2, -0.25];
    add({
      key,
      id: 'erreten-perikardioperitonealak',
      mesh: cachedTube(curve3([top, [cx, pose.floorY + 0.35, cz], [cx, pose.floorY - 0.3, cz], [s * 0.55, -0.35, -0.1]], 16), {
        radius: () => r,
        ref: [0, 0, 1],
        sides: 14,
        capStart: true,
        capEnd: true,
      }),
      color: colour(key),
      tissue: 'membrane',
      opacity: 0.55 * pose.split,
      show: show(key) * Math.min(1, pose.canal * 4),
    });
  }

  // The floor: septum in front, the oesophageal mesenchyme in the middle at the back, the membranes in
  // between at the back on either side, the wall's rim all round (in the wall until it joins).
  add({
    key: 'septum',
    id: 'septum-transversum',
    mesh: sector(pose, 0, 0.84, -80, 80),
    color: colour('septum'),
    tissue: 'mesenchyme',
    show: show('septum') * pose.split,
  });
  add({
    key: 'esophageal',
    id: 'hestegorri-inguruko-mesenkima',
    mesh: sector(pose, 0, 0.84, 150, 210, 0.08),
    color: colour('esophageal'),
    tissue: 'mesenchyme',
    show: show('esophageal') * pose.split,
  });
  if (pose.mem > 0.02) {
    const rIn = 0.84 * (1 - pose.mem);
    add({
      key: 'poR',
      id: 'mintz-pleuroperitonealak',
      mesh: sector(pose, rIn, 0.84, 210, 280, 0.05),
      color: colour('poR'),
      tissue: 'membrane',
      thin: 0.4,
      show: show('poR'),
    });
    add({
      key: 'poL',
      id: 'mintz-pleuroperitonealak',
      mesh: sector(pose, rIn, 0.84, 80, 150, 0.05),
      color: colour('poL'),
      tissue: 'membrane',
      thin: 0.4,
      show: show('poL'),
    });
  }
  add({
    key: 'peripheral',
    id: 'diafragmaren-alde-periferikoa',
    mesh: sector(pose, lerp(1.0, 0.84, pose.rim), lerp(1.13, 1.0, pose.rim), -180, 180, lerp(0.16, 0.09, pose.rim)),
    color: colour('peripheral'),
    tissue: 'muscle',
    show: show('peripheral'),
  });

  // The pleuropericardial folds: walls between each pleural cavity and the pericardial one, moving to the middle.
  if (pose.fold > 0.02)
    for (const [key, s] of [
      ['ppR', -1],
      ['ppL', 1],
    ] as const)
      add({
        key,
        id: 'mintz-pleuroperikardikoak',
        mesh: cachedBlob({
          center: [s * lerp(0.7, 0.5, pose.fold), 1.5, -0.08],
          radii: [0.04, 0.64 * Math.min(1, pose.fold * 1.4), 0.5 * Math.min(1, pose.fold * 1.4)],
          rings: 10,
          sides: 16,
        }),
        color: colour(key),
        tissue: 'membrane',
        thin: 0.5,
        opacity: 1 - 0.65 * g,
        show: show(key),
      });

  // Where each name points.
  const pts: Record<string, V3> = {
    coelom: [-0.86, -0.4, 0.05],
    pericardial: [0, 2.05, 0.45],
    pleuralR: [-0.95, 1.75, -0.3],
    pleuralL: [0.95, 1.75, -0.3],
    peritoneal: [-0.55, -1.7, 0.6],
    canalR: [floorXZ(0.52, -115 * D)[0], pose.floorY + 0.25, floorXZ(0.52, -115 * D)[1]],
    canalL: [floorXZ(0.52, 115 * D)[0], pose.floorY + 0.25, floorXZ(0.52, 115 * D)[1]],
    septum: floorPt(pose, 0.55, 0),
    esophageal: floorPt(pose, 0.55, 180),
    poR: floorPt(pose, 0.84 - 0.42 * pose.mem, -115),
    poL: floorPt(pose, 0.84 - 0.42 * pose.mem, 115),
    peripheral: floorPt(pose, lerp(1.06, 0.92, pose.rim), -40),
    ppR: [-lerp(0.7, 0.5, pose.fold), 1.75, 0.15],
    ppL: [lerp(0.7, 0.5, pose.fold), 1.75, 0.15],
    parietal: [1.2, -2.0, 0.65],
    visceral: [0.3, -1.2, -0.2],
    mesentery: [0, -1.9, -0.8],
  };
  return { items, pts };
}

/** Each room piece's 3D items (the same keys here). */
export const CAV_ITEMS = (key: string) => [key];
