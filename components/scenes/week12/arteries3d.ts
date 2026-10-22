import { add, mix3, type M4, type V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import { cachedBlob } from '@/lib/three-d/mesh-cache';
import { STREAM_ROUTE_N, type Item3, type Tissue3 } from '@/lib/three-d/scene';
import { POSE0, blobParts, heartModel, mixHex, routeLength, tubeParts, vesselRouteOf, type HeartPose } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';

/**
 * Topic 12's one arterial system, in 3D. Every view of the topic is a camera on this model: the aortic
 * sac and its two horns, six pairs of aortic arches round the pharynx, the two dorsal aortas (fusing
 * below T4), the 7th intersegmental arteries, the primitive pulmonary arteries, the vagus nerves and
 * their laryngeal branches; each arch grows, keeps or loses its parts, and with `descend` the whole
 * system takes its adult shape (the heart goes down into the thorax, the carotids and the
 * brachiocephalic trunk lengthen, the left subclavian climbs up the arch).
 *
 * Axes (the embryo's own, as in topics 10–11): x towards the embryo's LEFT, y cranial, z ventral. A camera
 * in front (+z) shows the embryo's left on the viewer's right, as in the notes' figures.
 *
 * Colour = origin (the notes' figures, Langman): every piece keeps the colour of what it comes from while
 * it becomes an adult artery — aortic sac and truncus ivory (topic 10's truncus), 1st arch sky blue,
 * 2nd lilac, 3rd orange, 4th magenta, 5th grey, 6th blue (the pulmonary arteries), dorsal aortas red,
 * 7th intersegmental arteries teal, nerves yellow. With `colour` = 0 the arteries are drawn by their
 * blood instead (red), as in the notes' first figure.
 *
 * Every vessel is one polyline of key points in two poses, embryonic (E, ≈29 days) and adult (A), with
 * the same number of points: `descend` mixes them point by point, so a junction (a point shared by two
 * vessels) stays a junction all the way.
 */

// ———————————————————————————— colours ————————————————————————————

export const AC = {
  sac: T.truncus,
  sacDeep: T.truncusDeep,
  a1: '#7dd3fc',
  a2: '#b9a3ff',
  a3: '#ff9a3c',
  a4: '#e0408f',
  a5: '#a3a1b3',
  a6: '#3b82f6',
  da: '#dc2626',
  is7: '#14b8a6',
  nerve: '#facc15',
  nerveDeep: '#8a6a00',
  ligament: '#c9c1b2',
  aortaIv: mixHex(T.truncus, T.o2, 0.16),
  pulmIv: mixHex(T.truncus, T.deo2, 0.16),
  pharynx: '#f2c14e',
  pharynxDeep: '#a7801f',
  arch: '#e98b7a',
  archDeep: '#8c3f33',
  lung: '#f7b6c2',
  lungDeep: '#a85a6a',
  blood: T.o2,
  bloodDeep: T.o2Deep,
} as const;

const darker = (c: string) => mixHex(c, '#000000', 0.55);

// ———————————————————————————— pose ————————————————————————————

/** Arch indices 0..5 = the 1st..6th pair. */
export interface ArtPose {
  /** How far each arch pair has grown (0 = not there, 1 = whole). */
  grow: readonly [number, number, number, number, number, number];
  /** 1st and 2nd arches: their ventral part gone (a small dorsal remnant stays: maxillary, hyoid and stapedial arteries). */
  gone1: number;
  gone2: number;
  /** The cranial horns of the aortic sac (feeding the 1st and 2nd arches) gone. */
  cranGone: number;
  /** The 5th arches gone. */
  gone5: number;
  /** The truncus divided into the ascending aorta and the pulmonary trunk. */
  split: number;
  /** The dorsal aortas fused below T4 (0 = paired all the way down). */
  fuse: number;
  /** 7th intersegmental arteries grown out to the upper limb buds. */
  is7: number;
  /** Primitive pulmonary arteries grown from the 6th arches to the lung buds. */
  pulm: number;
  /** External carotids budding from the common carotids. */
  eca: number;
  /** Carotid ducts (dorsal aorta between the 3rd and 4th arches) gone. */
  ductCar: number;
  /** Right 6th arch, distal part, gone. */
  r6dist: number;
  /** Right dorsal aorta between the 7th intersegmental artery and the fusion gone. */
  rLow: number;
  /** Embryonic → adult shape. */
  descend: number;
  /** Ductus arteriosus → ligamentum arteriosum (after birth). */
  ligament: number;
  /** Colours: 0 = by blood (red), 1 = by origin. */
  colour: number;
  /** The right recurrent laryngeal nerve's hook: 0 under the 6th arch, 1 under the 4th (the right subclavian). */
  rHook: number;
  /** The 3rd and 4th arches grown in size (29 days). */
  size34?: number;
}

export const AP0: ArtPose = {
  grow: [1, 1, 1, 1, 1, 1],
  gone1: 0,
  gone2: 0,
  cranGone: 0,
  gone5: 0,
  split: 0,
  fuse: 1,
  is7: 1,
  pulm: 1,
  eca: 0,
  ductCar: 0,
  r6dist: 0,
  rLow: 0,
  descend: 0,
  ligament: 0,
  colour: 1,
  rHook: 0,
};

/** The adult pattern: everything that goes is gone, the rest in its final place. */
/** Where the left subclavian leaves the aorta (the left 7th intersegmental artery's root) and where the left common carotid does, for a pose: the subclavian's climb. */
export const leftOrigins = (d: number) => ({ subclavian: at(J.d7(1), d), carotid: at(J.j34(1), d) });

export const ADULT: ArtPose = { ...AP0, gone1: 1, gone2: 1, cranGone: 1, gone5: 1, split: 1, eca: 1, ductCar: 1, r6dist: 1, rLow: 1, descend: 1, rHook: 1 };

export interface ArtOpts {
  /** Context: the pharynx and its pouches, the larynx (0..1). */
  pharynx?: number;
  /** The pharyngeal arches round each aortic arch (mesenchyme bars, 0..1). */
  bars?: number;
  /** The heart (topic 10's loop) under the truncus (0..1) and its own colours (0 = myocardium). */
  heart?: number;
  heartColour?: number;
  /** Lung buds and trachea (0..1). */
  lungs?: number;
  /** Vagus nerves (0..1), recurrent laryngeals (0..1), superior laryngeals (0..1). */
  vagus?: number;
  recurrent?: number;
  superior?: number;
  /** Vessels that are gone, as faint ghosts where they were (the notes' dashed lines, 0..1). */
  ghosts?: number;
  /** Blood flowing: phase (stage time × speed) and visibility; `ductus` also through the ductus arteriosus. */
  flow?: { phase: number; show: number; ductus?: number } | null;
  /** All the arteries see-through but one set (lit by ids): 0..1. */
  dim?: { ids: readonly string[]; k: number } | null;
}

// ———————————————————————————— geometry ————————————————————————————

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Arch levels (y) of the 1st..6th pair in the embryonic pose. */
export const Y = [3.8, 3.15, 2.5, 1.85, 1.38, 0.95] as const;
const D7Y = 0.25;

type Side = -1 | 1;
/** A key point in both poses. */
type KP = readonly [V3, V3];
const kp = (e: V3, a: V3): KP => [e, a];
const X = (s: Side, p: V3): V3 => [s * p[0], p[1], p[2]];

/** Dorsal aorta (embryonic) at height y. */
const D = (s: Side, y: number): V3 => [s * 0.5, y, -0.8];

/** Junctions, embryonic and adult. */
const J = {
  heart: kp([0.05, -0.65, 1.15], [0.02, -2.5, 1.12]),
  sac: kp([0, 0.55, 0.95], [-0.12, -0.95, 0.8]),
  j34: (s: Side) => kp(X(s, [0.36, 1.6, 0.9]), s < 0 ? [-0.5, 0.3, 0.55] : [0.18, -0.2, 0.52]),
  c3: (s: Side) => kp(X(s, [0.52, 2.38, 0.8]), X(s, [0.6, 2.6, 0.36])),
  d3: (s: Side) => kp(D(s, Y[2]), X(s, [0.62, 3.35, 0.1])),
  d4: (s: Side) => kp(D(s, Y[3]), s < 0 ? [-0.88, 0.42, 0.3] : [0.55, -0.4, -0.04]),
  d7: (s: Side) => kp(D(s, D7Y), s < 0 ? [-1.2, 0.38, 0.05] : [0.6, -0.62, -0.25]),
  m6: (s: Side) => kp(X(s, [0.94, 0.96, 0.18]), s < 0 ? [-0.5, -1.4, 0.18] : [0.48, -1.36, 0.14]),
  v6: (s: Side) => kp(X(s, [0.16, 0.68, 0.84]), [0.12 + s * 0.05, -1.32, 0.32]),
  pulmTop: kp([0, 0.62, 0.8], [0.12, -1.32, 0.32]),
  larynx: (s: Side) => kp(X(s, [0.14, 1.75, 0.4]), X(s, [0.14, 2.12, 0.4])),
};

/** The fused aorta's top (T4) for a fusion state: paired all the way down at 0. */
const fuseY = (fuse: number) => lerp(-6.2, -0.95, fuse);

/** An arch's loop round the pharynx at height y, from its ventral start to the dorsal aorta (embryonic). */
const loop = (s: Side, y: number): V3[] => [X(s, [0.62, y + 0.04, 0.74]), X(s, [0.92, y + 0.06, 0.3]), X(s, [0.98, y + 0.03, -0.25]), X(s, [0.78, y, -0.7]), D(s, y)];

/** Every vessel: id, colour, radius, key points (E, A). */
interface Vessel {
  key: string;
  id: string;
  color: string;
  r: number;
  kps: KP[];
  tissue?: Tissue3;
}

const zip = (e: V3[], a: V3[]): KP[] => {
  if (e.length !== a.length) throw new Error(`pose length ${e.length} ≠ ${a.length}`);
  return e.map((p, i) => [p, a[i]]);
};

/** A point of a key-point list for a pose (0 = embryonic, 1 = adult). */
const at = (k: KP, d: number): V3 => (d <= 0 ? k[0] : d >= 1 ? k[1] : mix3(k[0], k[1], d));

function vessels(s: Side): Record<string, Vessel> {
  const n = s < 0 ? 'R' : 'L';
  const j34 = J.j34(s);
  const d3 = J.d3(s);
  const d4 = J.d4(s);
  const d7 = J.d7(s);
  const m6 = J.m6(s);
  const v6 = J.v6(s);
  const c3 = J.c3(s);
  const R = s < 0;
  // The adult points of the left and right sides differ (the arch is on the left), so each is listed.
  const A = <P extends V3 | V3[]>(r: P, l: P): P => (R ? r : l);
  return {
    // Horn of the aortic sac (sac → 3rd/4th arch junction): right → brachiocephalic trunk, left → first part of the arch.
    horn: {
      key: `horn${n}`,
      id: R ? 'eskuineko-luzapena' : 'ezkerreko-luzapena',
      color: AC.sac,
      r: R ? 0.12 : 0.15,
      kps: [J.sac, kp(X(s, [0.2, 0.9, 0.93]), A([-0.26, -0.55, 0.76], [-0.02, -0.55, 0.8])), kp(X(s, [0.3, 1.3, 0.92]), A([-0.4, -0.1, 0.66], [0.08, -0.3, 0.68])), j34],
    },
    // The horns' cranial part (feeding the 1st and 2nd arches): goes with them.
    cran: {
      key: `cran${n}`,
      id: 'aorta-zakua',
      color: AC.sac,
      r: 0.08,
      kps: [j34, kp(X(s, [0.3, 2.3, 0.9]), X(s, [0.5, 1.8, 0.6])), kp(X(s, [0.3, Y[1], 0.88]), X(s, [0.55, 2.9, 0.6])), kp(X(s, [0.28, Y[0], 0.84]), X(s, [0.55, 3.6, 0.6]))],
    },
    a1v: { key: `a1v${n}`, id: 'lehen-aorta-arkua', color: AC.a1, r: 0.075, kps: zip([X(s, [0.28, Y[0], 0.84]), ...loop(s, Y[0]).slice(0, 2)], [X(s, [0.55, 3.6, 0.6]), X(s, [0.75, 3.9, 0.62]), X(s, [0.95, 4.2, 0.6])]) },
    a1d: { key: `a1d${n}`, id: 'lehen-aorta-arkua', color: AC.a1, r: 0.075, kps: zip(loop(s, Y[0]).slice(1), [X(s, [0.95, 4.45, 0.55]), X(s, [0.85, 4.38, 0.25]), X(s, [0.68, 4.27, 0.02]), X(s, [0.56, 4.2, -0.1])]) },
    a2v: { key: `a2v${n}`, id: 'bigarren-aorta-arkua', color: AC.a2, r: 0.075, kps: zip([X(s, [0.3, Y[1], 0.88]), ...loop(s, Y[1]).slice(0, 2)], [X(s, [0.55, 2.9, 0.6]), X(s, [0.75, 3.3, 0.6]), X(s, [0.95, 3.7, 0.55])]) },
    a2d: { key: `a2d${n}`, id: 'bigarren-aorta-arkua', color: AC.a2, r: 0.075, kps: zip(loop(s, Y[1]).slice(1), [X(s, [0.95, 3.95, 0.45]), X(s, [0.85, 3.9, 0.2]), X(s, [0.7, 3.85, 0.07]), X(s, [0.6, 3.8, 0.0])]) },
    // 3rd arch: the common carotid (up to c3) and the proximal internal carotid.
    a3: {
      key: `a3${n}`,
      id: 'hirugarren-aorta-arkua',
      color: AC.a3,
      r: 0.1,
      kps: [
        j34,
        kp(X(s, [0.44, 2.05, 0.86]), A([-0.56, 1.1, 0.48], [0.4, 0.6, 0.5])),
        c3,
        kp(X(s, [0.72, 2.52, 0.64]), X(s, [0.61, 2.8, 0.31])),
        kp(X(s, [0.95, 2.56, 0.28]), X(s, [0.62, 2.95, 0.26])),
        kp(X(s, [0.99, 2.53, -0.25]), X(s, [0.62, 3.08, 0.2])),
        kp(X(s, [0.78, 2.5, -0.7]), X(s, [0.62, 3.2, 0.15])),
        d3,
      ],
    },
    // 4th arch: left → the arch between the left carotid and subclavian; right → the right subclavian's first part.
    a4: {
      key: `a4${n}`,
      id: 'laugarren-aorta-arkua',
      color: AC.a4,
      r: R ? 0.1 : 0.13,
      kps: [
        j34,
        kp(X(s, [0.58, 1.78, 0.76]), A([-0.62, 0.36, 0.48], [0.3, -0.18, 0.42])),
        kp(X(s, [0.9, 1.88, 0.32]), A([-0.72, 0.39, 0.42], [0.4, -0.22, 0.3])),
        kp(X(s, [0.98, 1.87, -0.25]), A([-0.78, 0.4, 0.38], [0.47, -0.28, 0.17])),
        kp(X(s, [0.78, 1.85, -0.7]), A([-0.84, 0.41, 0.34], [0.52, -0.34, 0.06])),
        d4,
      ],
    },
    a5: { key: `a5${n}`, id: 'bostgarren-aorta-arkua', color: AC.a5, r: 0.05, kps: zip([X(s, [0.3, 1.25, 0.92]), ...loop(s, Y[4])], [X(s, [0.4, 0.0, 0.6]), X(s, [0.6, 0.1, 0.5]), X(s, [0.7, 0.1, 0.3]), X(s, [0.75, 0.1, 0.1]), X(s, [0.75, 0.1, 0.0]), X(s, [0.75, 0.05, -0.1])]) },
    // 6th arch: proximal part (→ pulmonary artery) and distal part (left → ductus arteriosus; right goes).
    a6p: {
      key: `a6p${n}`,
      id: R ? 'eskuineko-birika-arteria' : 'ezkerreko-birika-arteria',
      color: AC.a6,
      r: 0.1,
      kps: [v6, kp(X(s, [0.5, 0.86, 0.74]), A([-0.15, -1.36, 0.27], [0.28, -1.33, 0.26])), kp(X(s, [0.8, 0.94, 0.48]), A([-0.32, -1.38, 0.22], [0.38, -1.34, 0.2])), m6],
    },
    a6d: {
      key: `a6d${n}`,
      id: R ? 'seigarren-aorta-arkua' : 'hodi-arteriosoa',
      color: AC.a6,
      r: 0.1,
      kps: [m6, kp(X(s, [0.98, 0.96, -0.25]), A([-0.75, -1.0, 0.0], [0.56, -1.25, -0.05])), kp(X(s, [0.78, 0.95, -0.7]), A([-0.95, -0.4, -0.15], [0.6, -1.12, -0.25])), kp(D(s, Y[5]), A([-1.05, 0.41, 0.17], [0.57, -1.0, -0.5]))],
    },
    // Primitive pulmonary artery: from the 6th arch to the lung bud (later the rest of the pulmonary artery).
    pulm: {
      key: `pulm${n}`,
      id: 'hasierako-birika-arteriak',
      color: AC.a6,
      r: 0.06,
      kps: [m6, kp(X(s, [0.8, 0.5, 0.3]), A([-0.85, -1.5, 0.12], [0.8, -1.45, 0.1])), kp(X(s, [0.55, -0.1, 0.2]), A([-1.15, -1.65, 0.05], [1.1, -1.6, 0.05])), kp(X(s, [0.4, -0.62, 0.14]), A([-1.4, -1.9, 0.0], [1.35, -1.85, 0.0]))],
    },
    // Dorsal aorta, in four stretches: cranial to the 3rd arch (→ distal internal carotid), between the 3rd and
    // 4th (carotid duct, goes), from the 4th to the 7th intersegmental artery, and from there to the fusion.
    daCran: {
      key: `daCran${n}`,
      id: 'aorta-dortsalak',
      color: AC.da,
      r: 0.1,
      kps: [d3, kp(D(s, Y[1]), X(s, [0.6, 3.8, 0.0])), kp(D(s, Y[0]), X(s, [0.56, 4.2, -0.1])), kp(X(s, [0.5, 4.4, -0.78]), X(s, [0.52, 4.6, -0.15])), kp(X(s, [0.46, 4.9, -0.6]), X(s, [0.48, 5.1, -0.12]))],
    },
    daDuct: { key: `daDuct${n}`, id: 'hodi-karotideoa', color: AC.da, r: 0.1, kps: [d4, kp(D(s, (Y[2] + Y[3]) / 2), A([-0.8, 1.9, 0.2], [0.6, 1.4, 0.05])), d3] },
    daMid: {
      key: `daMid${n}`,
      id: 'aorta-dortsalak',
      color: AC.da,
      r: R ? 0.1 : 0.13,
      kps: [d4, kp(D(s, Y[4]), A([-0.96, 0.41, 0.24], [0.57, -0.44, -0.1])), kp(D(s, Y[5]), A([-1.05, 0.41, 0.17], [0.58, -0.5, -0.15])), kp(D(s, 0.6), A([-1.13, 0.4, 0.11], [0.59, -0.56, -0.2])), d7],
    },
    is7: {
      key: `is7${n}`,
      id: 'zazpigarren-segmentu-arteko-arteria',
      color: AC.is7,
      r: 0.085,
      kps: zip(
        [D(s, D7Y), X(s, [0.8, 0.28, -0.9]), X(s, [1.25, 0.3, -0.82]), X(s, [1.7, 0.26, -0.6]), X(s, [2.0, 0.2, -0.45])],
        A([[-1.2, 0.38, 0.05], [-1.5, 0.36, 0.0], [-1.8, 0.3, -0.05], [-2.1, 0.2, -0.08], [-2.35, 0.05, -0.1]], [[0.6, -0.62, -0.25], [0.85, -0.3, -0.18], [1.25, 0.08, -0.12], [1.8, 0.2, -0.08], [2.35, 0.05, -0.1]]),
      ),
    },
    eca: { key: `eca${n}`, id: 'kanpoko-karotida', color: AC.a3, r: 0.07, kps: [c3, kp(X(s, [0.46, 2.8, 0.9]), X(s, [0.72, 3.2, 0.5])), kp(X(s, [0.42, 3.3, 0.95]), X(s, [0.8, 3.8, 0.62])), kp(X(s, [0.4, 3.75, 0.98]), X(s, [0.85, 4.4, 0.72]))] },
  };
}

/** The low stretch of a dorsal aorta (7th intersegmental → fusion) for a fusion state. */
function lowStretch(s: Side, fuse: number): KP[] {
  const fy = fuseY(fuse);
  const e: V3[] = [D(s, D7Y), D(s, lerp(D7Y, fy, 0.3)), D(s, lerp(D7Y, fy, 0.62)), D(s, fy + 0.45), [s * 0.22, fy + 0.1, -0.83], [0, fy, -0.85]];
  const a: V3[] = s < 0 ? [[-1.2, 0.38, 0.05], [-1.0, 0.0, -0.3], [-0.7, -0.6, -0.6], [-0.4, -1.2, -0.8], [-0.15, -1.7, -0.84], [0.06, -2.0, -0.86]] : [[0.6, -0.62, -0.25], [0.58, -0.9, -0.45], [0.5, -1.3, -0.62], [0.32, -1.65, -0.78], [0.14, -1.85, -0.84], [0.06, -2.0, -0.86]];
  return zip(e, a);
}
/** The fused aorta, from the fusion (T4) down. */
function fusedStretch(fuse: number): KP[] {
  const fy = fuseY(fuse);
  return zip(
    [[0, fy, -0.85], [0, lerp(fy, -6.6, 0.33), -0.86], [0, lerp(fy, -6.6, 0.66), -0.87], [0, -6.6, -0.87]],
    [[0.06, -2.0, -0.86], [0.04, -3.5, -0.88], [0.02, -5.0, -0.88], [0, -6.6, -0.88]],
  );
}

/** The truncus (one tube) and, once divided, its two channels: the ascending aorta and the pulmonary trunk. */
const TRUNCUS: KP[] = zip([[0.05, -0.65, 1.15], [0.03, -0.2, 1.1], [0.01, 0.2, 1.02], [0, 0.55, 0.95]], [[0.02, -2.5, 1.12], [-0.1, -1.95, 1.06], [-0.16, -1.4, 0.95], [-0.12, -0.95, 0.8]]);
const AORTA_CH: KP[] = zip([[-0.04, -0.65, 1.18], [-0.05, -0.2, 1.14], [-0.03, 0.2, 1.06], [0, 0.55, 0.95]], [[0.0, -2.5, 1.1], [-0.1, -1.95, 1.06], [-0.16, -1.4, 0.95], [-0.12, -0.95, 0.8]]);
const PULM_CH: KP[] = zip([[0.14, -0.65, 1.1], [0.12, -0.2, 1.04], [0.07, 0.25, 0.94], [0, 0.62, 0.8]], [[0.26, -2.45, 1.2], [0.36, -1.98, 1.14], [0.3, -1.58, 0.78], [0.12, -1.32, 0.32]]);

/** The vagus and its laryngeal branches. */
function nerves(s: Side, rHook: number) {
  const R = s < 0;
  const vagus: KP[] = zip(
    [X(s, [1.2, 5.2, -0.1]), X(s, [1.22, 3.5, -0.1]), X(s, [1.22, 2.0, -0.1]), X(s, [1.2, 0.3, -0.1]), X(s, [1.0, -1.6, -0.3]), X(s, [0.6, -3.0, -0.35])],
    R ? [[-0.75, 5.2, -0.05], [-0.8, 3.4, 0.03], [-0.92, 1.4, 0.3], [-1.0, 0.3, 0.55], [-0.8, -1.5, 0.1], [-0.6, -3.0, -0.3]] : [[0.75, 5.2, -0.05], [0.8, 3.4, 0.03], [0.85, 1.4, 0.25], [0.82, -0.6, 0.35], [0.75, -1.6, 0.05], [0.55, -3.0, -0.35]],
  );
  const lx = J.larynx(s);
  // Under the 6th arch (both sides at first) …
  const under6: V3[] = [X(s, [1.2, 0.5, -0.1]), X(s, [1.05, 0.6, 0.05]), X(s, [0.72, 0.66, 0.08]), X(s, [0.6, 1.0, 0.12]), X(s, [0.45, 1.5, 0.3]), lx[0]];
  // … the right one under the 4th once the 5th and the right 6th's distal part are gone.
  const under4: V3[] = [X(s, [1.22, 1.5, -0.1]), X(s, [1.08, 1.6, 0.05]), X(s, [0.74, 1.66, 0.1]), X(s, [0.6, 1.72, 0.16]), X(s, [0.45, 1.76, 0.3]), lx[0]];
  const e = R ? under6.map((p, i) => mix3(p, under4[i], ss(0, 1, rHook))) : under6;
  const recurrent: KP[] = zip(
    e,
    R ? [[-1.0, 0.2, 0.5], [-1.05, 0.12, 0.3], [-0.95, 0.2, 0.0], [-0.7, 0.6, -0.05], [-0.4, 1.4, 0.15], lx[1]] : [[0.82, -0.9, 0.3], [0.74, -1.42, 0.0], [0.52, -1.3, -0.42], [0.3, -0.7, -0.4], [0.2, 0.6, -0.05], lx[1]],
  );
  const superior: KP[] = zip([X(s, [1.22, 2.9, -0.1]), X(s, [0.95, 2.75, 0.25]), X(s, [0.6, 2.25, 0.38]), add(lx[0], [0, 0.08, 0])], [X(s, [0.85, 3.4, 0.03]), X(s, [0.6, 3.0, 0.3]), X(s, [0.35, 2.5, 0.42]), add(lx[1], [0, 0.08, 0])]);
  return { vagus, recurrent, superior };
}

// ———————————————————————————— items ————————————————————————————

export interface ArtModel {
  items: Item3[];
  pts: Record<string, V3>;
  /** Centrelines (current pose) by vessel key, for routes and arrows. */
  lines: Record<string, V3[]>;
}

const N = 22;

/** A smooth centreline through the key points for a pose. */
const lineOf = (kps: readonly KP[], d: number, n = N) => curve3(kps.map((k) => at(k, d)), n);

/** A vessel's first part only (it grows from its start). */
const grown = (line: V3[], g: number) => (g >= 0.999 ? line : line.slice(0, Math.max(2, Math.round(line.length * clamp01(g)))));

/**
 * Radius along a vessel that is going (g 0..1): it narrows from its middle to a thread, then fades, as the
 * notes say "endekatzen da" (degenerates); at 0 it is whole.
 */
const goingRadius = (r: number, g: number) => (g <= 0.001 ? () => r : (u: number) => r * Math.max(0.12, 1 - g * (1.25 - 0.55 * Math.abs(2 * u - 1))));

/** Vessels that carry the right ventricle's blood (poorly oxygenated), blue when drawn by blood. */
const DEO2 = new Set(['birika-arteria', 'eskuineko-birika-arteria', 'ezkerreko-birika-arteria', 'hasierako-birika-arteriak', 'hodi-arteriosoa', 'lotailu-arteriosoa']);
const COLOUR_BLOOD = (id: string, c: string, k: number) => mixHex(DEO2.has(id) ? T.deo2 : AC.blood, c, k);
/** Every aortic arch also counts as "the aortic arches". */
const ARCHES = new Set(['lehen-aorta-arkua', 'bigarren-aorta-arkua', 'hirugarren-aorta-arkua', 'laugarren-aorta-arkua', 'bostgarren-aorta-arkua', 'seigarren-aorta-arkua']);

export function arteryModel(pose: ArtPose, o: ArtOpts = {}): ArtModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const lines: Record<string, V3[]> = {};
  const d = clamp01(pose.descend);
  const dim = o.dim;
  const lit = (id: string, groups?: string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  const ghost = o.ghosts ?? 0;

  /** One vessel item (and its ghost when it is going). */
  const push = (key: string, id: string, line: V3[], color: string, r: number | ((u: number) => number), show = 1, extra: Partial<Item3> = {}) => {
    if (show <= 0.01 || line.length < 2) return;
    const col = COLOUR_BLOOD(id, color, pose.colour);
    const groups = ARCHES.has(id) || (extra.groups ?? []).some((g) => ARCHES.has(g)) ? [...(extra.groups ?? []), 'aorta-arkuak'] : extra.groups;
    const k = lit(id, groups) ? 1 : 1 - 0.78 * (dim?.k ?? 0);
    items.push({ key, id, ...tubeParts(line, { radius: typeof r === 'number' ? () => r : r, ref: [0, 0, 1], sides: 14, capStart: true, capEnd: true }), color: col, deep: darker(col), tissue: 'vessel', show, opacity: k, ...extra, groups });
  };
  /** Where a vessel was (the notes' dashed outline), once it is going. */
  const ghostOf = (key: string, line: V3[], r: number, g: number) => {
    const k = ghost * ss(0.35, 0.9, g);
    if (k <= 0.01) return;
    items.push({ key: `ghost-${key}`, ...tubeParts(line, { radius: () => r * 0.5, ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }), color: '#d8d2e6', deep: '#5a5468', tissue: 'membrane', opacity: 0.16 * k, outline: false });
  };

  // Truncus: one tube, then the two channels.
  const sp = clamp01(pose.split);
  const tLine = lineOf(TRUNCUS, d);
  lines.truncus = tLine;
  if (sp < 0.999) push('truncus', 'enbor-arteriosoa', tLine, AC.sac, 0.17 * (1 - 0.35 * sp), 1 - ss(0.6, 1, sp));
  if (sp > 0.001) {
    const aLine = lineOf(AORTA_CH, d);
    const pLine = lineOf(PULM_CH, d);
    lines.aortaCh = aLine;
    lines.pulmCh = pLine;
    push('asc-aorta', 'goranzko-aorta', aLine, AC.aortaIv, 0.15, ss(0, 0.5, sp));
    push('pulm-trunk', 'birika-arteria', pLine, AC.pulmIv, 0.14, ss(0, 0.5, sp));
    pts['goranzko-aorta'] = aLine[Math.round(N * 0.45)];
    pts['birika-arteria'] = pLine[Math.round(N * 0.55)];
  }
  pts['enbor-arteriosoa'] = tLine[Math.round(N * 0.4)];
  pts['aorta-zakua'] = at(J.sac, d);

  for (const s of [-1, 1] as Side[]) {
    const n = s < 0 ? 'R' : 'L';
    const V = vessels(s);
    const R = s < 0;
    const g = pose.grow;
    const line = (v: Vessel) => {
      const l = lineOf(v.kps, d);
      lines[v.key] = l;
      return l;
    };
    // Horns of the aortic sac.
    const horn = line(V.horn);
    const future = R ? 'enbor-brakiozefalikoa' : 'aortaren-makoa';
    push(V.horn.key, d > 0.5 ? future : 'aorta-zakua', horn, mixHex(V.horn.color, AC.aortaIv, d), V.horn.r, 1, { groups: ['aorta-zakua', future] });
    pts[`luzapena${n}`] = horn[Math.round(N * 0.55)];
    const cran = line(V.cran);
    const cg = clamp01(pose.cranGone);
    push(V.cran.key, V.cran.id, cran, V.cran.color, goingRadius(V.cran.r, cg), (1 - ss(0.75, 1, cg)) * clamp01(g[1] * 2 + g[0]));
    ghostOf(V.cran.key, cran, V.cran.r, cg);

    // 1st and 2nd arches: the ventral part goes, a remnant stays.
    for (const [vv, dd, k, rem] of [[V.a1v, V.a1d, 0, 'arteria-maxilarra'], [V.a2v, V.a2d, 1, 'hioide-arteria']] as const) {
      const g12 = clamp01(k === 0 ? pose.gone1 : pose.gone2);
      const lv = line(vv);
      const ld = line(dd);
      const gk = clamp01(g[k]);
      if (gk > 0.01) {
        // It grows from the ventral end round to the dorsal aorta.
        const both = [...lv, ...ld];
        const upTo = Math.round(both.length * gk);
        push(vv.key, vv.id, lv.slice(0, Math.max(2, Math.min(lv.length, upTo))), vv.color, goingRadius(vv.r, g12), 1 - ss(0.75, 1, g12));
        if (upTo > lv.length) push(dd.key, g12 > 0.5 ? rem : dd.id, ld.slice(0, Math.max(2, upTo - lv.length)), dd.color, g12 > 0.01 ? (u: number) => dd.r * (1 - 0.3 * g12 * (1 - u)) : dd.r, 1, { groups: k === 1 ? [dd.id, rem, 'ointokiko-arteria'] : [dd.id, rem] });
        ghostOf(vv.key, lv, vv.r, g12);
        pts[`${vv.id}${n}`] = lv[Math.round(lv.length * 0.55)];
        pts[`${rem}${n}`] = ld[Math.round(ld.length * 0.35)];
        if (k === 1) pts[`ointokiko-arteria${n}`] = ld[Math.round(ld.length * 0.75)];
      }
    }

    // 3rd arch: common carotid + proximal internal carotid. 4th arch.
    for (const v of [V.a3, V.a4]) {
      const l = line(v);
      const k = v === V.a3 ? 2 : 3;
      const gk = clamp01(g[k]);
      if (gk > 0.01) push(v.key, v.id, grown(l, gk), v.color, v.r * (1 + 0.3 * (pose.size34 ?? 0)), 1, { groups: v === V.a3 ? ['karotida-komuna', 'barneko-karotida'] : R ? ['eskuineko-subklabioa'] : ['aortaren-makoa', 'makoaren-urrutiko-atala', 'aorta'] });
    }
    const a3 = lines[V.a3.key];
    pts[`hirugarren-aorta-arkua${n}`] = a3[Math.round(N * 0.62)];
    pts[`karotida-komuna${n}`] = a3[Math.round(N * 0.22)];
    pts[`barneko-karotida${n}`] = a3[Math.round(N * 0.8)];
    const a4 = lines[V.a4.key];
    pts[`laugarren-aorta-arkua${n}`] = a4[Math.round(N * 0.5)];

    // External carotid bud.
    if (pose.eca > 0.01) {
      const l = line(V.eca);
      push(V.eca.key, V.eca.id, grown(l, pose.eca), V.eca.color, (u: number) => V.eca.r * (1 - 0.35 * u), 1, { groups: ['karotida-komuna'] });
      pts[`kanpoko-karotida${n}`] = l[Math.round(N * 0.7)];
    }

    // 5th arch: thin, brief.
    const g5 = clamp01(pose.gone5);
    if (g[4] > 0.01) {
      const l = line(V.a5);
      push(V.a5.key, V.a5.id, grown(l, g[4]), V.a5.color, goingRadius(V.a5.r, g5), 1 - ss(0.75, 1, g5));
      ghostOf(V.a5.key, l, V.a5.r, g5);
      pts[`bostgarren-aorta-arkua${n}`] = l[Math.round(N * 0.55)];
    }

    // 6th arch: proximal and distal parts; the primitive pulmonary artery.
    if (g[5] > 0.01) {
      const lp = line(V.a6p);
      const ldd = line(V.a6d);
      const both = [...lp, ...ldd];
      const upTo = Math.round(both.length * clamp01(g[5]));
      const isPulm = pose.descend > 0.3 || sp > 0.5;
      push(V.a6p.key, isPulm ? V.a6p.id : 'seigarren-aorta-arkua', lp.slice(0, Math.max(2, Math.min(lp.length, upTo))), V.a6p.color, V.a6p.r, 1, { groups: ['seigarren-aorta-arkua', V.a6p.id] });
      if (upTo > lp.length) {
        const part = ldd.slice(0, Math.max(2, upTo - lp.length));
        if (R) {
          const gr = clamp01(pose.r6dist);
          push(V.a6d.key, 'seigarren-aorta-arkua', part, V.a6d.color, goingRadius(V.a6d.r, gr), 1 - ss(0.75, 1, gr));
          ghostOf(V.a6d.key, ldd, V.a6d.r, gr);
        } else {
          const lg = clamp01(pose.ligament);
          const id = lg > 0.5 ? 'lotailu-arteriosoa' : pose.descend > 0.3 || sp > 0.5 ? 'hodi-arteriosoa' : 'seigarren-aorta-arkua';
          push(V.a6d.key, id, part, mixHex(V.a6d.color, AC.ligament, lg), (u: number) => lerp(V.a6d.r, 0.04, lg) * (1 - 0.15 * lg * Math.sin(Math.PI * u)), 1, { groups: ['seigarren-aorta-arkua', 'hodi-arteriosoa', 'lotailu-arteriosoa'], tissue: lg > 0.5 ? 'tendon' : 'vessel' });
        }
      }
      pts[`seigarren-aorta-arkua${n}`] = lp[Math.round(N * 0.85)];
      pts[`${V.a6p.id}`] = lp[Math.round(N * 0.6)];
      pts[R ? 'seigarren-distala-R' : 'hodi-arteriosoa'] = ldd[Math.round(N * 0.45)];
      if (!R) pts['lotailu-arteriosoa'] = ldd[Math.round(N * 0.5)];
      if (pose.pulm > 0.01) {
        const l = line(V.pulm);
        push(V.pulm.key, V.pulm.id, grown(l, pose.pulm), V.pulm.color, (u: number) => V.pulm.r * (1 - 0.3 * u), 1, { groups: [R ? 'eskuineko-birika-arteria' : 'ezkerreko-birika-arteria'] });
        pts[`hasierako-birika-arteriak${n}`] = l[Math.round(N * 0.6)];
      }
    }

    // Dorsal aorta stretches.
    const dc = line(V.daCran);
    push(V.daCran.key, V.daCran.id, dc, V.daCran.color, V.daCran.r, 1, { groups: ['barneko-karotida'] });
    pts[`aorta-dortsalak-cran${n}`] = dc[Math.round(N * 0.75)];
    const du = line(V.daDuct);
    const gd = clamp01(pose.ductCar);
    push(V.daDuct.key, gd > 0.05 ? 'hodi-karotideoa' : 'aorta-dortsalak', du, V.daDuct.color, goingRadius(V.daDuct.r, gd), 1 - ss(0.75, 1, gd), { groups: ['aorta-dortsalak', 'hodi-karotideoa'] });
    ghostOf(V.daDuct.key, du, V.daDuct.r, gd);
    pts[`hodi-karotideoa${n}`] = du[Math.round(N * 0.5)];
    const dm = line(V.daMid);
    push(V.daMid.key, V.daMid.id, dm, V.daMid.color, V.daMid.r, 1, { groups: R ? ['eskuineko-subklabioa'] : ['beheranzko-aorta', 'aorta'] });
    pts[`aorta-dortsalak${n}`] = dm[Math.round(N * 0.45)];
    const low = lineOf(lowStretch(s, pose.fuse), d);
    lines[`daLow${n}`] = low;
    const gl = R ? clamp01(pose.rLow) : 0;
    push(`daLow${n}`, 'aorta-dortsalak', low, AC.da, goingRadius(R ? 0.1 : 0.13, gl), 1 - ss(0.75, 1, gl), { groups: R ? [] : ['beheranzko-aorta', 'aorta'] });
    ghostOf(`daLow${n}`, low, 0.1, gl);
    pts[`aorta-dortsalak-low${n}`] = low[Math.round(N * 0.35)];

    // 7th intersegmental artery (→ subclavian).
    if (pose.is7 > 0.01) {
      const l = line(V.is7);
      push(V.is7.key, V.is7.id, grown(l, pose.is7), V.is7.color, (u: number) => V.is7.r * (1 - 0.25 * u), 1, { groups: [R ? 'eskuineko-subklabioa' : 'ezkerreko-subklabioa'] });
      pts[`zazpigarren-segmentu-arteko-arteria${n}`] = l[Math.round(N * 0.45)];
    }
  }

  // The fused aorta.
  const fused = lineOf(fusedStretch(pose.fuse), d);
  lines.fused = fused;
  if (pose.fuse > 0.01) push('fused', 'aorta-dortsalak', fused, AC.da, 0.15, 1, { groups: ['beheranzko-aorta', 'aorta'] });
  pts['aorta-dortsal-bakarra'] = fused[Math.round(N * 0.3)];

  // Adult names on the pieces (where each is drawn in the adult pose).
  const L = lines;
  pts['enbor-brakiozefalikoa'] = L.hornR[Math.round(N * 0.6)];
  pts['aortaren-makoa'] = L.hornL[Math.round(N * 0.8)];
  pts['eskuineko-subklabioa'] = L.is7R?.[Math.round(N * 0.35)] ?? L.a4R[N - 3];
  pts['ezkerreko-subklabioa'] = L.is7L?.[Math.round(N * 0.5)] ?? L.daMidL[N - 2];
  pts['beheranzko-aorta'] = L.daLowL[Math.round(N * 0.7)];
  pts['makoaren-urrutiko-atala'] = L.a4L[Math.round(N * 0.6)];

  // ———— nerves ————
  const vg = o.vagus ?? 0;
  const rc = o.recurrent ?? 0;
  const su = o.superior ?? 0;
  if (vg > 0.01 || rc > 0.01 || su > 0.01)
    for (const s of [-1, 1] as Side[]) {
      const n = s < 0 ? 'R' : 'L';
      const nv = nerves(s, s < 0 ? pose.rHook : 0);
      const nerve = (key: string, id: string, kps: KP[], r: number, show: number, groups: string[] = []) => {
        if (show <= 0.01) return null;
        const l = lineOf(kps, d, 26);
        const k = lit(id, groups) ? 1 : 1 - 0.78 * (dim?.k ?? 0);
        items.push({ key, id, groups, ...tubeParts(l, { radius: () => r, ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }), color: AC.nerve, deep: AC.nerveDeep, tissue: 'nerve', show, opacity: k });
        return l;
      };
      const v = nerve(`vagus${n}`, 'nerbio-bagoa', nv.vagus, 0.045, vg);
      if (v) pts[`nerbio-bagoa${n}`] = v[7];
      const rid = s < 0 ? 'eskuineko-nerbio-atzerakaria' : 'ezkerreko-nerbio-atzerakaria';
      const r = nerve(`rec${n}`, rid, nv.recurrent, 0.035, rc, ['nerbio-laringeo-atzerakaria']);
      if (r) pts[rid] = r[9];
      const sl = nerve(`sup${n}`, 'goiko-nerbio-laringeoa', nv.superior, 0.03, su);
      if (sl) pts[`goiko-nerbio-laringeoa${n}`] = sl[13];
    }

  // ———— context ————
  const ph = o.pharynx ?? 0;
  if (ph > 0.01) {
    const top = lerp(4.5, 4.9, d);
    const bot = lerp(0.35, 1.3, d);
    const centre: V3 = [0, (top + bot) / 2, lerp(0.02, 0.0, d)];
    items.push({ key: 'pharynx', id: 'faringe-hestea', ...blobParts({ center: centre, radii: [lerp(0.55, 0.42, d), (top - bot) / 2, 0.3], rings: 16, sides: 22 }), color: AC.pharynx, deep: AC.pharynxDeep, tissue: 'epithelium', opacity: 0.32 * ph, outline: false, quiet: true });
    pts['faringe-hestea'] = add(centre, [0.25, 0.9, 0.22]);
    const lx = mix3(J.larynx(1)[0], J.larynx(1)[1], d);
    const lc: V3 = [0, lx[1], lx[2] - 0.05];
    items.push({ key: 'larynx', id: 'laringea', ...blobParts({ center: lc, radii: [0.2, 0.16, 0.12], rings: 10, sides: 14 }), color: '#f0d9a8', deep: '#8a7040', tissue: 'cartilage', opacity: 0.85 * ph });
    pts['laringea'] = lc;
  }
  const bars = o.bars ?? 0;
  if (bars > 0.01)
    for (const s of [-1, 1] as Side[])
      for (let k = 0; k < 6; k++) {
        if (k === 4) continue;
        const g = pose.grow[k];
        if (g <= 0.05) continue;
        const l = curve3(loop(s, Y[k]).slice(0, 4), 16);
        items.push({ key: `bar${k}${s}`, id: 'faringe-arkuak', ...tubeParts(l, { radius: () => 0.22, ref: [0, 0, 1], sides: 14, capStart: true, capEnd: true }), color: AC.arch, deep: AC.archDeep, tissue: 'mesenchyme', opacity: 0.2 * bars * g, outline: false, quiet: true });
        if (k === 2 && s > 0) pts['faringe-arkuak'] = add(l[10], [0.12, 0.1, 0.12]);
      }
  const lungs = o.lungs ?? 0;
  if (lungs > 0.01) {
    const trE: V3[] = [[0, 1.0, 0.3], [0, 0.3, 0.22], [0, -0.35, 0.15]];
    const trA: V3[] = [[0, 2.0, 0.32], [0, 0.5, 0.15], [0, -1.0, 0.05]];
    const tr = curve3(trE.map((p, i) => mix3(p, trA[i], d)), 12);
    items.push({ key: 'trachea', id: 'trakea', ...tubeParts(tr, { radius: () => 0.09, ref: [0, 0, 1], sides: 12, capStart: true, capEnd: true }), color: AC.lung, deep: AC.lungDeep, tissue: 'epithelium', opacity: 0.5 * lungs, quiet: true });
    for (const s of [-1, 1] as Side[]) {
      const cE: V3 = [s * 0.36, -0.8, 0.1];
      const cA: V3 = [s * 1.45, -2.1, -0.05];
      const c = mix3(cE, cA, d);
      const rr = lerp(0.24, 0.62, d);
      items.push({ key: `lung${s}`, id: 'birika-hastapenak', ...blobParts({ center: c, radii: [rr, rr * 1.3, rr * 0.8], rings: 12, sides: 16 }), color: AC.lung, deep: AC.lungDeep, tissue: 'epithelium', opacity: 0.38 * lungs, outline: false, quiet: true });
      if (s > 0) pts['birika-hastapenak'] = add(c, [rr * 0.6, -rr * 0.6, rr * 0.3]);
    }
  }
  const heart = o.heart ?? 0;
  if (heart > 0.01) {
    const hm = heartPlaced(d, o.heartColour ?? 0);
    for (const it of hm.items) items.push({ ...it, show: (it.show ?? 1) * heart, opacity: (it.opacity ?? 1) * (dim && dim.k > 0 ? 1 - 0.6 * dim.k : 1) });
    pts['bihotza'] = hm.centre;
  }

  // ———— blood ————
  if (o.flow && o.flow.show > 0.01) streams(items, lines, pose, o.flow);

  return { items, pts, lines };
}

// ———————————————————————————— the heart under the truncus ————————————————————————————

const HEART_POSE: HeartPose = { ...POSE0, segs: 1, colour: 1, split: 1, loop: 1, atriaFuse: 1, arches: 0, veins: 0 };
/** Topic 10's loop, its aortic sac at the truncus base, a little smaller. */
function heartPlaced(d: number, colour: number): { items: Item3[]; centre: V3 } {
  const h = heartModel({ ...HEART_POSE, colour }, { cavity: 0, septum: 0, gut: 0, aortas: 0, noto: 0 });
  const sac = h.pts['aorta-zakua'];
  const base = at(J.heart, d);
  const k = lerp(0.9, 0.62, d);
  const tr: V3 = [base[0] - k * sac[0], base[1] - k * sac[1] - 0.1, base[2] - k * sac[2] + 0.05];
  const m: M4 = new Float32Array([k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, tr[0], tr[1], tr[2], 1]);
  const items = h.items.filter((it) => !it.stream).map((it) => ({ ...it, key: `h-${it.key}`, groups: it.id ? [...(it.groups ?? []), 'bihotza'] : undefined, matrix: m }));
  const c = h.pts['atal-bentrikularra'];
  return { items, centre: [k * c[0] + tr[0], k * c[1] + tr[1], k * c[2] + tr[2]] };
}

// ———————————————————————————— blood ————————————————————————————

type Cells = { cells: Float32Array; gates: Float32Array };
function cellSet(n: number, jit: number): Cells {
  const cells = new Float32Array(n * 4);
  const gates = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    cells.set([i / n, Math.sin(i * 12.9) * 0.05 * jit, Math.cos(i * 7.3) * 0.04 * jit, Math.sin(i * 3.1) * 0.05 * jit], i * 4);
    gates[i] = ((i * 0.618034) % 1) * 0.85;
  }
  return { cells, gates };
}
const CELLS = cellSet(9, 0.6);
const CELL_MESH = () => cachedBlob({ center: [0, 0, 0], radii: [0.05, 0.036, 0.05], rings: 6, sides: 8 });

/** Blood from the truncus out through each open arch into the dorsal aortas and down (or up to the head). */
function streams(items: Item3[], L: Record<string, V3[]>, pose: ArtPose, flow: NonNullable<ArtOpts['flow']>) {
  const speed = flow.phase;
  const add_ = (key: string, route: V3[], grow: number) => {
    if (grow <= 0.01 || route.length < 2) return;
    const r = vesselRouteOf(route);
    items.push({ key: `flow-${key}`, mesh: CELL_MESH(), color: T.o2, deep: T.o2Deep, tissue: 'skin', stream: { route: r, phase: speed / Math.max(0.5, routeLength(r)), grow, ...CELLS } });
  };
  const trunk = pose.split > 0.5 ? L.aortaCh : L.truncus;
  for (const n of ['R', 'L']) {
    const horn = L[`horn${n}`];
    const down = [...L[`daMid${n}`], ...L[`daLow${n}`].slice(1)];
    // Through the 3rd arch up the carotid to the head, and through the 4th round to the aorta.
    if (pose.grow[2] > 0.9) add_(`a3${n}`, [...trunk, ...horn.slice(1), ...L[`a3${n}`].slice(1), ...L[`daCran${n}`].slice(1)], flow.show);
    if (pose.grow[3] > 0.9) add_(`a4${n}`, [...trunk, ...horn.slice(1), ...L[`a4${n}`].slice(1), ...down.slice(1)], flow.show * (n === 'R' ? 1 - pose.rLow : 1));
    // The 1st and 2nd arches while they are open; the 6th (before the pulmonary trunk takes it).
    if (pose.grow[0] > 0.9 && pose.gone1 < 0.3) add_(`a1${n}`, [...trunk, ...horn.slice(1), ...L[`cran${n}`].slice(1), ...L[`a1v${n}`].slice(1), ...L[`a1d${n}`].slice(1)], flow.show * (1 - pose.gone1 * 3));
    if (pose.grow[5] > 0.9 && pose.split < 0.5) add_(`a6${n}`, [...trunk, ...L[`a6p${n}`], ...L[`a6d${n}`].slice(1), ...down], flow.show);
  }
  // Ductus arteriosus: pulmonary trunk → left pulmonary artery start → ductus → descending aorta.
  const du = flow.ductus ?? 0;
  if (du > 0.01 && L.pulmCh) add_('ductus', [...L.pulmCh, ...L.a6pL.slice(-3), ...L.a6dL.slice(1), ...L.daLowL.slice(2), ...L.fused.slice(1)], du);
  void STREAM_ROUTE_N;
}
