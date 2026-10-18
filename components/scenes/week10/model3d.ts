import { add, cross, mix3, mul, norm, sub, type V3 } from '@/lib/three-d/math';
import { blob, curve3, merge, type BlobOptions, type Mesh, type TubeOptions } from '@/lib/three-d/mesh';
import { cachedBlob, cachedMerge, Sig } from '@/lib/three-d/mesh-cache';
import { heartTube } from './tube-geometry';
import { STREAM_ROUTE_N, type Item3 } from '@/lib/three-d/scene';
import { perfCount } from '@/lib/perf';
import { T } from './common';

/**
 * Topic 10's one heart, in 3D. Every heart view of the topic is a camera on this model, so the student
 * never meets a new picture: the two endocardial tubes zip together, the straight tube gets its
 * constrictions (segments), bends into the loop, its paired atria and sinus horns fuse, the common
 * atrium bulges out on both sides of the truncus, and the sinus venosus loses its left horn.
 *
 * Axes (the embryo's own): x towards the embryo's LEFT, y cranial, z ventral (anterior). A camera in
 * front (+z) therefore shows the embryo's left on the viewer's right, as in the notes' figures.
 * Units: the straight heart tube is about 2.4 long.
 *
 * Colours: one per segment, kept by everything the segment becomes (see week10-structures SEG):
 * sinus venosus violet, atrium orange, ventricle cyan, bulbus green (proximal green, conus lime,
 * truncus and aortic sac ivory). Blood by oxygen: red oxygenated, blue poorly oxygenated.
 */

export interface HeartPose {
  /** The two endocardial tubes fused, from the cranial end down (0 = two tubes, 1 = one tube). */
  fuse: number;
  /** The tubes are wrapped in myocardium (0 = bare endocardial tubes). */
  myo: number;
  /** Constrictions (sulci) and dilatations along the tube (0 = smooth). */
  segs: number;
  /** Segment colours (0 = all myocardium magenta). */
  colour: number;
  /** Per segment, overriding `colour` (segments named one after the other). */
  colourBy?: Partial<Record<'bulbus' | 'ventricle' | 'atrium' | 'sinus', number>>;
  /** 0 = straight (21 d), 0.5 = C-shaped (≈24 d), 1 = the loop (28 d). */
  loop: number;
  /** The caudal end's own progress through the loop (defaults to `loop`): the two ends can move one after the other. */
  loopTail?: number;
  /** Paired atria and sinus horns fused in the midline (0 = paired). */
  atriaFuse: number;
  /** Bulbus in its three sub-parts (proximal, conus, truncus) and their own colours. */
  split: number;
  /** The common atrium bulges out on both sides of the truncus (primitive right and left atria). */
  expand: number;
  /** The truncus moves from the right side of the pericardial cavity to the middle. */
  truncusMid: number;
  /** Sinus venosus: blood shunted to the right (0 = symmetric, 1 = left horn small, right horn wide). */
  shift: number;
  /** Left veins obliterated: [right umbilical + left vitelline (4th week), left common cardinal (≈10th week)]. */
  obliterate: [number, number];
  /** Aortic arches shown (0..3; fractional = the next one growing). */
  arches: number;
  /** Walls see-through (to show blood flowing inside). */
  glass: number;
  /** Veins and their names (0 = cut short at the sinus horns). */
  veins: number;
  /** Anastomoses carrying the left veins' blood to the right (0..1). */
  anast?: number;
  /** The left horn as the coronary sinus, with the oblique vein of the left atrium (0..1). */
  coronary?: number;
  /** The sinoatrial orifice drawn as an opening in the back wall of the atrium (0..1, its visibility). */
  hole?: number;
  /**
   * What each bulbus sub-part becomes (notes 3.1), drawn inside it: muscle trabeculae in the proximal
   * part (the primitive right ventricle), the conus divided by a ridge into two lumens (the infundibula),
   * the truncus divided the same way into the roots of the pulmonary trunk (right) and the aorta (left).
   */
  derive?: { trab?: number; conus?: number; truncus?: number };
}

export const POSE0: HeartPose = {
  fuse: 1,
  myo: 1,
  segs: 0,
  colour: 0,
  loop: 0,
  atriaFuse: 0,
  split: 0,
  expand: 0,
  truncusMid: 0,
  shift: 0,
  obliterate: [0, 0],
  arches: 1,
  glass: 0,
  veins: 1,
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/** Hex colour mix (both #rrggbb). */
export function mixHex(a: string, b: string, k: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(lerp(p(a, i), p(b, i), clamp01(k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// ———————————————————————————— the heart tube's centreline ————————————————————————————

/** Boundaries along the tube (u from the cranial end): sac | truncus | conus | proximal | ventricle | atrium. */
export const U = { sac: 0.07, truncus: 0.2, conus: 0.33, proximal: 0.54, ventricle: 0.82, end: 1 } as const;

/** Key points along the tube at u = 0, .07, .2, .33, .44, .54, .68, .82, 1 for the three shapes. */
const KU = [0, 0.07, 0.2, 0.33, 0.44, 0.54, 0.68, 0.82, 1];
const STRAIGHT: V3[] = [
  [0, 1.72, 0.05],
  [0, 1.52, 0.08],
  [0, 1.18, 0.1],
  [0, 0.84, 0.12],
  [0, 0.56, 0.12],
  [0, 0.28, 0.12],
  [0, -0.08, 0.12],
  [0, -0.42, 0.1],
  [0, -0.78, 0.04],
];
/** ≈24 days: the bulboventricular part bends ventrally and to the right (a C open to the left). */
const CSHAPE: V3[] = [
  [0, 1.66, 0.02],
  [-0.06, 1.46, 0.12],
  [-0.24, 1.1, 0.34],
  [-0.46, 0.7, 0.58],
  [-0.6, 0.3, 0.7],
  [-0.56, -0.12, 0.62],
  [-0.22, -0.52, 0.42],
  [0.12, -0.66, 0.1],
  [0.18, -0.5, -0.32],
];
/** 28 days: bulbus anterior, inferior and right; ventricle to the left; atrium superior and posterior. */
const LOOPED: V3[] = [
  [0.02, 1.5, 0.0],
  [-0.08, 1.3, 0.22],
  [-0.32, 0.92, 0.52],
  [-0.52, 0.48, 0.66],
  [-0.6, 0.06, 0.66],
  [-0.38, -0.42, 0.6],
  [0.16, -0.58, 0.44],
  [0.5, -0.12, 0.08],
  [0.1, 0.48, -0.5],
];

/** The truncus at the end of stage 8: moved to the middle (x towards 0). */
function truncusShift(p: V3, u: number, k: number): V3 {
  if (k <= 0 || u > U.proximal) return p;
  const w = 1 - ss(U.conus, U.proximal, u);
  return [p[0] + 0.3 * k * w * (u < U.conus ? 1 : 0.6), p[1], p[2] - 0.06 * k * w];
}

/** Key points of the tube for a pose: straight → C → loop (two halves, each eased). */
function keys(pose: HeartPose): V3[] {
  return STRAIGHT.map((_, i) => {
    // Cranial keys follow `loop`, caudal ones `loopTail`, the ventricle blends between them.
    const w = ss(0.44, 0.82, KU[i]);
    const L = clamp01(lerp(pose.loop, pose.loopTail ?? pose.loop, w));
    const a = L < 0.5 ? STRAIGHT : CSHAPE;
    const b = L < 0.5 ? CSHAPE : LOOPED;
    const k = L < 0.5 ? ss(0, 1, L * 2) : ss(0, 1, (L - 0.5) * 2);
    return truncusShift(mix3(a[i], b[i], k), KU[i], pose.truncusMid);
  });
}

/** The centreline, sampled at n + 1 points uniformly in u (u = 0 cranial end, 1 atrial end). */
export function centreline(pose: HeartPose, n = 120): V3[] {
  const key = new Sig().num(pose.loop).num(pose.loopTail ?? pose.loop).num(pose.truncusMid).num(n).key();
  const known = lines.get(key);
  if (known) return known;
  const K = keys(pose);
  // Catmull-Rom through the keys, then resampled by u (the keys are not evenly spaced in u).
  const dense = curve3(K, (K.length - 1) * 24 + 1);
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let j = 0;
    while (j < KU.length - 2 && KU[j + 1] < u) j++;
    const f = (u - KU[j]) / (KU[j + 1] - KU[j]);
    const g = (j + f) * 24;
    const lo = Math.floor(g);
    const hi = Math.min(dense.length - 1, lo + 1);
    out.push(mix3(dense[Math.min(lo, dense.length - 1)], dense[hi], g - lo));
  }
  if (lines.size >= 8) lines.delete(lines.keys().next().value!);
  lines.set(key, out);
  return out;
}
const lines = new Map<string, V3[]>();

const RADIUS_EDGES = [U.sac, U.truncus, U.conus, U.proximal, U.ventricle];
const RADII = [0.17, 0.15, 0.19, 0.31, 0.37, 0.29];

/** Tube radius at u: even at first; with `segs`, the dilatations and the sulci between them. */
export function radiusAt(u: number, pose: HeartPose): number {
  const base = 0.21;
  // The sulci: narrow waists at the bulboventricular and atrioventricular borders, softer at the bulbus' own borders.
  const dip = (c: number, w: number, d: number) => d * Math.exp(-(((u - c) / w) ** 2));
  const waist = dip(U.proximal, 0.028, 0.13) + dip(U.ventricle, 0.03, 0.13) + dip(U.conus, 0.03, 0.04);
  // Smooth the steps between segment radii.
  const sm = (x: number) => {
    let r = RADII[0];
    for (let i = 0; i < RADIUS_EDGES.length; i++) {
      const e = RADIUS_EDGES[i];
      r += (RADII[i + 1] - RADII[i]) * ss(e - 0.04, e + 0.04, x);
    }
    return r;
  };
  const s = clamp01(pose.segs);
  // The tube grows a little as it loops (the heart enlarges).
  const grow = 1 + 0.08 * clamp01(pose.loop);
  return lerp(base, sm(u) - waist, s) * grow;
}

// ———————————————————————————— the caudal tree: atria, sinus horns, veins ————————————————————————————

export interface Caudal {
  /** Per side (0 = right, 1 = left; x sign −1 / +1): atrial branch end, sinus horn medial end, horn tip. */
  atrium: [V3, V3];
  sinusIn: [V3, V3];
  horn: [V3, V3];
  /** The atrial (u = 1) end of the tube. */
  end: V3;
}

export function caudal(pose: HeartPose, line = centreline(pose)): Caudal {
  const end = line[line.length - 1];
  const L = clamp01(pose.loopTail ?? pose.loop);
  const f = clamp01(pose.atriaFuse);
  const sides = [-1, 1] as const;
  const side = (sx: number) => {
    // Straight: the paired atria and horns spread caudally and laterally under the tube (in the septum transversum).
    const aS: V3 = [sx * 0.42, -1.12, 0.0];
    const sS: V3 = [sx * 0.62, -1.42, -0.1];
    const hS: V3 = [sx * 0.95, -1.58, -0.18];
    // Looped: behind the ventricles, the atria superior-posterior and the sinus behind them.
    const aL: V3 = [sx * 0.42, 0.52, -0.6];
    const sL: V3 = [sx * 0.42, 0.08, -0.98];
    const hL: V3 = [sx * 0.88, -0.18, -0.96];
    const k = ss(0, 1, L);
    const a = mix3(aS, aL, k);
    const s = mix3(sS, sL, k);
    const h = mix3(hS, hL, k);
    // Fusion brings the medial parts to the midline: the atria into one, the horns into the transverse part.
    const toMid = (p: V3, amount: number): V3 => [p[0] * (1 - amount), p[1], p[2]];
    return { a: toMid(a, 0.55 * f), s: toMid(s, f), h };
  };
  const r = side(-1);
  const l = side(1);
  void sides;
  return { atrium: [r.a, l.a], sinusIn: [r.s, l.s], horn: [r.h, l.h], end };
}

/** Polyline through key points (smooth). */
const path = (pts: V3[], n = 18) => curve3(pts, n);

/** The three veins of one side, ending at that side's horn tip. */
export function veins(h: V3, sx: number) {
  const j: V3 = add(h, [sx * 0.42, 0.06, -0.34]);
  return {
    cardinal: path([h, add(h, [sx * 0.22, 0.03, -0.14]), j], 10),
    anterior: path([j, add(j, [sx * 0.18, 0.7, -0.22]), add(j, [sx * 0.1, 1.55, -0.3]), add(j, [0, 2.3, -0.32])], 20),
    posterior: path([j, add(j, [sx * 0.14, -0.7, -0.2]), add(j, [sx * 0.08, -1.5, -0.24]), add(j, [0, -2.2, -0.24])], 20),
    umbilical: path([h, add(h, [sx * 0.34, -0.3, 0.24]), add(h, [sx * 0.42, -1.0, 0.44]), add(h, [sx * 0.3, -1.9, 0.62])], 18),
    vitelline: path([h, add(h, [-sx * 0.16, -0.42, 0.22]), add(h, [-sx * 0.36, -1.1, 0.42]), add(h, [-sx * 0.48, -1.9, 0.66])], 18),
  };
}

/** Where each anastomosis leaves a left vein and joins a right one (indices along the veins from the horn). */
const LINK = { vit: [10, 10], ant: [12, 9], umb: [10, 13] } as const;
/**
 * The anastomoses: vitelline to vitelline, anterior cardinal to anterior cardinal, and the left umbilical
 * to the right vitelline (through the liver): every left vein that stays reaches the right horn.
 */
function anastomoses(L: ReturnType<typeof veins>, R: ReturnType<typeof veins>) {
  const cross = (a: V3, b: V3): V3[] => path([a, add(mix3(a, b, 0.5), [0, -0.12, 0.08]), b], 12);
  return [cross(L.vitelline[LINK.vit[0]], R.vitelline[LINK.vit[1]]), cross(L.anterior[LINK.ant[0]], R.anterior[LINK.ant[1]]), cross(L.umbilical[LINK.umb[0]], R.vitelline[LINK.umb[1]])];
}

/** One side's dorsal aorta and its k-th aortic arch (from the aortic sac round the foregut to the aorta). */
function arterial(sac: V3, sx: number, k: number) {
  const da = path([[sx * 0.4, sac[1] + 0.5, -1.38], [sx * 0.42, 0.2, -1.42], [sx * 0.38, -1.6, -1.4], [sx * 0.3, -2.6, -1.36]], 24);
  const y0 = sac[1] + 0.32 - k * 0.3;
  const arch = path([sac, [sx * 0.22, y0 + 0.08, sac[2] - 0.05], [sx * 0.38, y0 + 0.18, -0.55], [sx * 0.4, y0 + 0.08, -1.12], [sx * 0.4, y0 - 0.06, -1.38]], 16);
  return { da, arch };
}

// ———————————————————————————— items ————————————————————————————

export interface HeartOpts {
  /** Context: pericardial cavity (0..1), septum transversum (0..1), foregut (0..1), dorsal aortas + arches. */
  cavity?: number;
  septum?: number;
  gut?: number;
  /** The notochord: a rod in the midline behind the dorsal aortas (0..1). */
  noto?: number;
  aortas?: number;
  /** Faint copy of a pose (the start of the looping). */
  ghost?: HeartPose | null;
  /** Blood cells in the lumen: phase (stage time × speed) and visibility. */
  /**
   * Blood cells: along the tube (`show`); with `vessels` also in from the veins (umbilical red, vitelline
   * and cardinal blue; once the left veins close, the left blood takes the anastomoses to the right horn),
   * and with `arteries` out through the arches into the dorsal aortas. The vessels turn to glass to show
   * them (0..1, cells appearing one by one).
   */
  flow?: { phase: number; show: number; mixed?: boolean; vessels?: number; arteries?: boolean } | null;
  /** Show the 2-tube endocardium inside the myocardium while fusing. */
  endocardium?: number;
  /** Dorsal mesocardium (0..1, and broken 0..1). */
  mesocardium?: [number, number];
}

/** A path for a coarse copy: every third point (and the last). */
const sparse = (p: readonly V3[]) => (p.length <= 7 ? p : p.filter((_, i) => i % 3 === 0 || i === p.length - 1));

/**
 * A tube as drawn, and a coarse copy for pointing and the SVG layer (projected again whenever the camera
 * moves). Both are kept while their inputs are unchanged, so a played stage rebuilds only what moves.
 */
export function tubeParts(path: readonly V3[], o: TubeOptions): { mesh: Mesh; hit: Mesh } {
  return { mesh: heartTube(path, o), hit: heartTube(sparse(path), { ...o, sides: Math.min(o.sides ?? 18, 10) }) };
}

/** A blob as drawn and its coarse copy (see `tubeParts`); `shapeId` names a `shape` function. */
export function blobParts(o: BlobOptions, shapeId?: string): { mesh: Mesh; hit: Mesh } {
  const hit = { ...o, rings: Math.max(6, Math.round((o.rings ?? 18) / 2)), sides: Math.max(8, Math.round((o.sides ?? 24) / 2)) };
  return { mesh: cachedBlob(o, shapeId), hit: cachedBlob(hit, shapeId) };
}

/** Several parts as one item. */
const mergeParts = (ps: readonly { mesh: Mesh; hit: Mesh }[]) => ({ mesh: cachedMerge(ps.map((p) => p.mesh)), hit: cachedMerge(ps.map((p) => p.hit)) });

const vessel = (pts: V3[], r: number | ((u: number) => number), sides = 10, caps = true) =>
  tubeParts(pts, { radius: typeof r === 'number' ? () => r : r, ref: [0, 0, 1], sides, capStart: caps, capEnd: caps });

/** Sub-polyline of a sampled centreline between u0 and u1 (with a little overlap for the seams). */
function slice(line: V3[], u0: number, u1: number): { pts: V3[]; u: number[] } {
  const n = line.length - 1;
  const i0 = Math.max(0, Math.floor(u0 * n));
  const i1 = Math.min(n, Math.ceil(u1 * n));
  const pts = line.slice(i0, i1 + 1);
  return { pts, u: pts.map((_, k) => (i0 + k) / n) };
}

export interface HeartModel {
  items: Item3[];
  line: V3[];
  cd: Caudal;
  /** Named points for the callouts (centres inside each structure). */
  pts: Record<string, V3>;
}

const MYO = T.myocard;
/** Naming the whole tube (or the loop) lights every segment. */
const WHOLE = ['bihotz-hodia', 'bihotz-lakioa'];

/** All items of the heart for a pose. */
export function heartModel(pose: HeartPose, o: HeartOpts = {}): HeartModel {
  perfCount('heartModel');
  // Phase alone moves cells in the shader. Preserve the complete geometry/label snapshot instead
  // of rebuilding paths and re-hashing every static tube for each blood-flow frame or React repeat.
  const phase = o.flow?.phase;
  const key = JSON.stringify([pose, { ...o, flow: o.flow ? { ...o.flow, phase: 0 } : o.flow }], (_key, value) => Object.is(value, -0) ? '-0' : value);
  const known = models.get(key);
  if (known) {
    models.delete(key); models.set(key, known);
    perfCount('heartModelCacheHit');
    if (Object.is(phase, known.phase) || !known.hasStreams) return known.current;
    const items = known.base.items.map(it => !it.stream ? it : { ...it, stream: {
      ...it.stream,
      phase: it.key === 'flow' || it.key === 'flowO2' ? phase! : phase! * known.length / routeLength(it.stream.route),
    } });
    known.phase = phase;
    return (known.current = { ...known.base, items });
  }
  perfCount('heartModelBuild');
  const model = buildHeartModel(pose, o);
  const hasStreams = model.items.some(it => !!it.stream);
  const length = hasStreams ? routeLength(routeOf(model.line)) : 0;
  if (models.size >= 2) models.delete(models.keys().next().value!);
  models.set(key, { base: model, current: model, phase, hasStreams, length });
  return model;
}
const models = new Map<string, { base: HeartModel; current: HeartModel; phase: number | undefined; hasStreams: boolean; length: number }>();

function buildHeartModel(pose: HeartPose, o: HeartOpts): HeartModel {
  const line = centreline(pose);
  const cd = caudal(pose, line);
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const glass = clamp01(pose.glass);
  const wallOp = 1 - 0.62 * glass;
  const colOf = (g: 'bulbus' | 'ventricle' | 'atrium' | 'sinus') => clamp01(pose.colourBy?.[g] ?? pose.colour);
  const split = clamp01(pose.split);
  const segColour = (c: string, g: 'bulbus' | 'ventricle' | 'atrium' | 'sinus') => mixHex(MYO, c, colOf(g));
  const segDeep = (c: string, g: 'bulbus' | 'ventricle' | 'atrium' | 'sinus') => mixHex('#6e0f36', c, colOf(g));
  const at = (u: number) => line[Math.round(clamp01(u) * (line.length - 1))];

  // The myocardial tube, one item per segment (the sulci hide the seams).
  const fuse = clamp01(pose.fuse);
  const myo = clamp01(pose.myo);
  const hasCanal = clamp01(pose.loop) > 0.5 && fuse >= 1;
  type Seg = { key: string; id: string; groups?: string[]; u0: number; u1: number; color: string; deep: string; g: 'bulbus' | 'ventricle' | 'atrium' | 'sinus' };
  const bulbusId = (id: string) => (split > 0.5 ? id : 'atal-bulbarra');
  const segsList: Seg[] = [
    { g: 'bulbus', key: 'sac', id: split > 0.5 ? 'aorta-zakua' : 'aorta-zakua', groups: ['atal-bulbarra', 'arteria-muturra'], u0: 0, u1: U.sac + 0.01, color: mixHex(T.bulbus, T.truncus, Math.max(split, 0.6)), deep: T.truncusDeep },
    { g: 'bulbus', key: 'truncus', id: bulbusId('enbor-arteriosoa'), groups: ['atal-bulbarra', 'arteria-muturra'], u0: U.sac - 0.01, u1: U.truncus + 0.01, color: mixHex(T.bulbus, T.truncus, split), deep: mixHex(T.bulbusDeep, T.truncusDeep, split) },
    { g: 'bulbus', key: 'conus', id: bulbusId('arteria-konoa'), groups: ['atal-bulbarra'], u0: U.truncus - 0.01, u1: U.conus + 0.01, color: mixHex(T.bulbus, T.conus, split), deep: mixHex(T.bulbusDeep, T.conusDeep, split) },
    { g: 'bulbus', key: 'proximal', id: bulbusId('bulboaren-hurbileko-atala'), groups: ['atal-bulbarra', 'atal-bulbobentrikularra', ...((pose.derive?.trab ?? 0) > 0.3 ? ['hasierako-eskuineko-bentrikulua'] : [])], u0: U.conus - 0.01, u1: U.proximal + 0.012, color: mixHex(T.bulbus, T.proximal, split), deep: T.bulbusDeep },
    { g: 'ventricle', key: 'ventricle', id: 'atal-bentrikularra', groups: ['atal-bulbobentrikularra'], u0: U.proximal - 0.012, u1: U.ventricle + 0.012, color: T.ventricle, deep: T.ventricleDeep },
    // The canal is a stretch of the same narrowed tube, not a sleeve over it: a separate raised
    // sleeve crossed the wall at its ends and showed jagged rims even after they were tapered.
    ...(hasCanal ? [{ g: 'atrium' as const, key: 'av-canal', id: 'erreten-aurikulubentrikularra', u0: U.ventricle - 0.006, u1: U.ventricle + 0.04, color: mixHex(T.ventricle, T.atrium, 0.5), deep: T.atriumDeep }] : []),
    { g: 'atrium', key: 'atrium', id: 'atal-aurikularra', groups: ['zain-muturra'], u0: hasCanal ? U.ventricle + 0.028 : U.ventricle - 0.012, u1: 1, color: T.atrium, deep: T.atriumDeep },
  ];
  // Unfused part of the tube: from the fusion front down, the tube is two tubes (left and right).
  const front = lerp(-0.05, 1.05, fuse); // u reached by the zipper
  for (const [si, s] of segsList.entries()) {
    const { pts: P, u: us } = slice(line, s.u0, s.u1);
    if (P.length < 2) continue;
    // Neighbouring segments overlap a little (no gap at the seam); where they do, this one's end is drawn
    // 3% narrower, inside the next one. Two walls in the same place would flicker through each other in
    // jagged teeth.
    const next = segsList[si + 1];
    const tuck = (u: number) => (next ? 1 - 0.03 * ss(next.u0 - 0.008, next.u0, u) : 1);
    const r = (k: number) => {
      const u = lerp(us[0], us[us.length - 1], k);
      return radiusAt(u, pose) * tuck(u);
    };
    const fusedPart = us[us.length - 1] <= front;
    const color = segColour(s.color, s.g);
    const deep = segDeep(s.deep, s.g);
    if (fusedPart || fuse >= 1) {
      // At the loop's tight inner bend an inflated back-face hull cuts through its own wall,
      // drawing a false black crack. Shading defines the looped walls without that hull.
      const outline = pose.loop <= 0.5 || !['proximal', 'ventricle', 'av-canal', 'atrium'].includes(s.key);
      items.push({ key: s.key === 'av-canal' ? s.key : `myo-${s.key}`, id: s.id, groups: [...(s.groups ?? []), ...WHOLE], ...tubeParts(P, { radius: (k) => r(k) * lerp(0.62, 1, myo), ref: [0, 0, 1], sides: 22, capStart: s.key === 'sac' }), color, deep, tissue: 'muscle', opacity: wallOp, outline });
    } else {
      // Paired tubes, drawn apart by how far below the zipper they are.
      for (const sx of [-1, 1]) {
        const Q = P.map((p, k): V3 => {
          const below = clamp01((us[k] - front) / 0.25);
          return [p[0] + sx * 0.36 * ss(0, 1, below), p[1], p[2] - 0.05 * below];
        });
        items.push({ key: `myo-${s.key}-${sx}`, id: s.id, groups: [...(s.groups ?? []), ...WHOLE, 'bihotz-hodiak'], ...tubeParts(Q, { radius: (k) => r(k) * lerp(0.62, 1, myo) * 0.82, ref: [0, 0, 1], sides: 18 }), color, deep, tissue: 'muscle', opacity: wallOp });
      }
    }
    pts[s.id] ??= at((s.u0 + s.u1) / 2);
  }
  pts['aorta-zakua'] = at(0.03);
  pts['atal-bulbarra'] = at((U.sac + U.proximal) / 2 + 0.06);
  pts['enbor-arteriosoa'] = at((U.sac + U.truncus) / 2);
  pts['arteria-konoa'] = at((U.truncus + U.conus) / 2);
  pts['bulboaren-hurbileko-atala'] = at((U.conus + U.proximal) / 2 + 0.02);
  pts['atal-bentrikularra'] = at((U.proximal + U.ventricle) / 2 + 0.02);
  // Naming follows the anatomical segment, independent of splitting off the canal's draw mesh.
  pts['atal-aurikularra'] = at((U.ventricle - 0.012 + 1) / 2);
  pts['erreten-aurikulubentrikularra'] = at(U.ventricle + 0.02);
  pts['atal-bulbobentrikularra'] = at(U.proximal);
  pts['atal-bulbobentrikularra'] = at(U.proximal);

  // What the bulbus sub-parts become, inside them (seen through the glass wall).
  const dv = pose.derive;
  if (dv && fuse >= 1) {
    /** A sub-part's centreline with, at each point, the embryo's right across the tube (the line runs down from the sac). */
    const along = (u0: number, u1: number) => {
      const { pts: P, u: us } = slice(line, u0, u1);
      const side = P.map((q, k) => {
        const tg = norm(sub(P[Math.min(P.length - 1, k + 1)], P[Math.max(0, k - 1)]));
        return norm(cross(tg, [0, 0, 1]));
      });
      return { P, us, side };
    };
    // Two lumens pulled apart by a ridge growing in the middle (k = how far the division has gone).
    const divide = (u0: number, u1: number, k: number, key: string, right: { id: string; color: string; deep: string }, left: { id: string; color: string; deep: string }, ridgeId: string, ridgeColor: string) => {
      const { P, us, side } = along(u0, u1);
      if (P.length < 2) return;
      const rAt = (j: number) => radiusAt(us[j], pose);
      for (const [sx, lum] of [[1, right], [-1, left]] as const) {
        const Q = P.map((q, j): V3 => add(q, mul(side[j], sx * rAt(j) * 0.46 * k)));
        items.push({ key: `${key}-${sx > 0 ? 'r' : 'l'}`, id: lum.id, groups: ['atal-bulbarra'], ...tubeParts(Q, { radius: (x) => rAt(Math.round(x * (P.length - 1))) * lerp(0.6, 0.36, k), ref: [0, 0, 1], sides: 16 }), color: lum.color, deep: lum.deep, tissue: 'vessel', opacity: 0.25 + 0.75 * k });
        pts[lum.id] = Q[Math.floor(Q.length / 2)];
      }
      // The ridge between them, down the middle of the tube.
      items.push({ key: `${key}-ridge`, id: ridgeId, groups: ['atal-bulbarra'], ...tubeParts(P, { radius: (x) => rAt(Math.round(x * (P.length - 1))) * 0.11 * k, ref: [0, 0, 1], sides: 8 }), color: ridgeColor, deep: ridgeColor, tissue: 'muscle', opacity: k });
    };
    const tc = clamp01(dv.conus ?? 0);
    if (tc > 0.01) divide(U.truncus, U.conus, tc, 'conus', { id: 'infundibuluak', color: T.deo2, deep: T.deo2Deep }, { id: 'infundibuluak', color: T.o2, deep: T.o2Deep }, 'arteria-konoa', T.conusDeep);
    const tt = clamp01(dv.truncus ?? 0);
    if (tt > 0.01) divide(U.sac + 0.01, U.truncus, tt, 'truncus', { id: 'birika-enborraren-sustraiak', color: T.deo2, deep: T.deo2Deep }, { id: 'aortaren-sustraiak', color: T.aorta, deep: T.aortaDeep }, 'enbor-arteriosoa', T.truncusDeep);
    if (tc > 0.5) pts['infundibuluak'] = at((U.truncus + U.conus) / 2);
    // Muscle ridges on the inner wall of the proximal part: its wall becomes trabeculated.
    const tr = clamp01(dv.trab ?? 0);
    if (tr > 0.01) {
      const { P, us, side } = along(U.conus + 0.01, U.proximal - 0.01);
      const ridges: { mesh: Mesh; hit: Mesh }[] = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const R = P.map((q, j): V3 => {
          const sd = side[j];
          const tg = norm(sub(P[Math.min(P.length - 1, j + 1)], P[Math.max(0, j - 1)]));
          const up = norm(cross(sd, tg));
          const wob = 0.1 * Math.sin(j * 1.7 + i * 2.3);
          const rr = radiusAt(us[j], pose) * 0.74;
          return add(q, add(mul(sd, rr * Math.cos(a + wob)), mul(up, rr * Math.sin(a + wob))));
        });
        ridges.push(tubeParts(R, { radius: () => 0.035 * tr, ref: [0, 0, 1], sides: 6, capStart: true, capEnd: true }));
      }
      items.push({ key: 'trabeculae', id: 'muskulu-trenkadak', groups: ['hasierako-eskuineko-bentrikulua', 'bulboaren-hurbileko-atala'], ...mergeParts(ridges), color: mixHex(T.proximal, '#0f3d22', 0.35), deep: '#0f3d22', tissue: 'muscle', opacity: tr });
      pts['muskulu-trenkadak'] = add(P[Math.floor(P.length / 2)], mul(side[Math.floor(P.length / 2)], radiusAt(us[Math.floor(P.length / 2)], pose) * 0.6));
    }
  }

  // Atrial branches (paired → fused) and the common atrium.
  const f = clamp01(pose.atriaFuse);
  const atriumColour = segColour(T.atrium, 'atrium');
  const atriumDeep = segDeep(T.atriumDeep, 'atrium');
  const rA = radiusAt(0.95, pose);
  const branches: { mesh: Mesh; hit: Mesh }[] = [];
  for (let i = 0; i < 2; i++) {
    const a = cd.atrium[i];
    const mid = mix3(cd.end, a, 0.5);
    branches.push(tubeParts(path([cd.end, add(mid, [0, -0.02 * (1 - pose.loop), 0]), a], 12), { radius: (k) => rA * lerp(1, 0.86 + 0.3 * f, k), ref: [0, 0, 1], sides: 18, capEnd: true }));
  }
  if (f > 0.02 || pose.expand > 0.01) {
    // The common atrium: a wide chamber between the two branches, bulging on both sides of the truncus later.
    const c = mix3(cd.atrium[0], cd.atrium[1], 0.5);
    const e = clamp01(pose.expand);
    branches.push(blobParts({ center: add(c, [0, 0.02 * e, 0.04 * e]), radii: [lerp(0.3, 0.46, f) + 0.12 * e, lerp(0.26, 0.34, f) + 0.06 * e, lerp(0.24, 0.3, f) + 0.04 * e], rings: 14, sides: 20 }));
  }
  items.push({ key: 'atria', id: 'atal-aurikularra', groups: ['zain-muturra', 'aurikula-komuna', ...WHOLE], ...mergeParts(branches), color: atriumColour, deep: atriumDeep, tissue: 'muscle', opacity: wallOp });
  // Inside the tissue: one branch while they are paired, the common chamber once fused.
  pts['atal-aurikularra'] = f > 0.5 ? mix3(cd.atrium[0], cd.atrium[1], 0.5) : mix3(cd.end, cd.atrium[1], 0.6);

  // Primitive right and left atria: the two lateral expansions of the common atrium, either side of the truncus.
  const e = clamp01(pose.expand);
  if (e > 0.01) {
    for (const [i, id] of [[0, 'hasierako-eskuineko-aurikula'], [1, 'hasierako-ezkerreko-aurikula']] as const) {
      const sx = i ? 1 : -1;
      const a = cd.atrium[i];
      const c: V3 = add(a, [sx * 0.2 * e, 0.12 * e, 0.3 * e]);
      items.push({
        key: `pa${i}`,
        id,
        groups: ['atal-aurikularra'],
        ...blobParts({ center: c, radii: [0.3 * e + 0.04, 0.28 * e + 0.04, 0.26 * e + 0.04], rings: 14, sides: 20, shape: (d) => 1 + 0.12 * d[1] }, 'pa: 1 + 0.12 y'),
        color: T.atrium,
        deep: T.atriumDeep,
        tissue: 'muscle',
        opacity: wallOp,
      });
      pts[id] = add(c, [sx * 0.08, 0.04, 0.12]);
    }
  }

  // The sinus venosus: two horns (paired) that meet in the midline as its transverse part.
  const sh = clamp01(pose.shift);
  const sinusCol = segColour(T.sinus, 'sinus');
  const sinusDeep = segDeep(T.sinusDeep, 'sinus');
  const hornR = (i: number) => (i === 0 ? lerp(0.21, 0.3, sh) : lerp(0.21, 0.1, sh));
  for (let i = 0; i < 2; i++) {
    const sx = i ? 1 : -1;
    const P = path([cd.atrium[i], cd.sinusIn[i], mix3(cd.sinusIn[i], cd.horn[i], 0.55), cd.horn[i]], 16);
    // The left horn shrinks with the shift (towards the coronary sinus).
    items.push({
      key: `horn${i}`,
      id: i && (pose.coronary ?? 0) > 0.5 ? 'sinu-koronarioa' : i ? 'ezkerreko-sinu-luzapena' : 'eskuineko-sinu-luzapena',
      groups: ['zain-sinua', 'zain-muturra', ...(i ? ['ezkerreko-sinu-luzapena'] : []), ...WHOLE],
      ...tubeParts(P, { radius: (k) => hornR(i) * lerp(0.92, 1.05, k) * (k < 0.15 ? lerp(0.86, 1, k / 0.15) : 1), ref: [0, 0, 1], sides: 16, capEnd: true }),
      color: sinusCol,
      deep: sinusDeep,
      tissue: 'muscle',
      opacity: wallOp,
    });
    pts[i ? 'ezkerreko-sinu-luzapena' : 'eskuineko-sinu-luzapena'] = mix3(cd.sinusIn[i], cd.horn[i], 0.6);
    void sx;
  }
  if (f > 0.02) {
    // Behind the atrium (dorsal, -z), sagging a little: it must show from the back, not hide inside the horns.
    const back = (p: V3, k: number): V3 => [p[0], p[1] - 0.06 * k, p[2] - 0.12 * k];
    const P = path([back(cd.sinusIn[0], 0.5), back(mix3(cd.sinusIn[0], cd.sinusIn[1], 0.5), 1), back(cd.sinusIn[1], 0.5)], 10);
    items.push({ key: 'sinus-mid', id: 'zain-sinuaren-zeharkako-atala', groups: ['zain-sinua', 'zain-muturra', ...WHOLE], ...tubeParts(P, { radius: () => lerp(0.14, 0.22, f), ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true }), color: sinusCol, deep: sinusDeep, tissue: 'muscle', opacity: wallOp });
  }
  pts['zain-sinua'] = f > 0.5 ? mix3(cd.sinusIn[0], cd.sinusIn[1], 0.5) : mix3(cd.sinusIn[1], cd.horn[1], 0.5);
  pts['sinu-koronarioa'] = mix3(cd.sinusIn[1], cd.horn[1], 0.6);
  // The sinoatrial orifice: where the sinus opens into the atrium; it moves to the right with the shift.
  const so = lerp(0.5, 0.12, sh);
  pts['zulo-sinoaurikularra'] = mix3(mix3(cd.sinusIn[0], cd.sinusIn[1], so), mix3(cd.atrium[0], cd.atrium[1], so), 0.45);
  const hole = clamp01(pose.hole ?? 0);
  if (hole > 0.01) {
    // Wide at first (the notes' figure), narrower as it moves into the primitive right atrium.
    items.push({ key: 'sa-hole', id: 'zulo-sinoaurikularra', ...blobParts({ center: pts['zulo-sinoaurikularra'], radii: [lerp(0.2, 0.11, sh), lerp(0.11, 0.13, sh), 0.09], rings: 12, sides: 18 }), color: '#1a0710', deep: '#000000', tissue: 'vessel', opacity: hole });
  }
  const cor = clamp01(pose.coronary ?? 0);
  if (cor > 0.01) {
    // The oblique vein of the left atrium: up the back of the left atrium into the coronary sinus.
    const a = mix3(cd.sinusIn[1], cd.horn[1], 0.55);
    const ov = path([a, add(a, [0.02, 0.22, -0.04]), add(cd.atrium[1], [0.12, 0.28, -0.22])], 12);
    items.push({ key: 'oblique', id: 'ezkerreko-aurikularen-zain-laprana', ...vessel(ov.slice(0, Math.max(2, Math.round(ov.length * cor))), 0.045, 8), color: T.deo2, deep: T.deo2Deep, tissue: 'vessel', opacity: 1 });
    pts['ezkerreko-aurikularen-zain-laprana'] = ov[8];
  }
  pts['bihotz-lakioa'] = at(0.62);
  pts['zain-sinuaren-zeharkako-atala'] = add(mix3(cd.sinusIn[0], cd.sinusIn[1], 0.5), [0, -0.06, -0.12]);

  // The veins of each side, at the tips of the horns.
  const vShow = clamp01(pose.veins);
  // With blood shown in the vessels, their walls turn to glass so the cells show through.
  const vesselFlow = clamp01(o.flow?.vessels ?? 0);
  const vesselWall = 1 - 0.5 * vesselFlow;
  if (vShow > 0.01) {
    for (let i = 0; i < 2; i++) {
      const sx = i ? 1 : -1;
      const V = veins(cd.horn[i], sx);
      const gone = (k: number) => clamp01(k);
      // Obliterated veins: right umbilical and left vitelline (4th week), left common cardinal (≈10th week).
      const umbGone = i === 0 ? gone(pose.obliterate[0]) : 0;
      const vitGone = i === 1 ? gone(pose.obliterate[0]) : 0;
      const cardGone = i === 1 ? gone(pose.obliterate[1]) : 0;
      const big = i === 0 ? 1 + 0.35 * sh : 1 - 0.3 * sh;
      // The single veins the notes name (the ones that close) answer to their own ids too.
      const own: Record<string, string | undefined> = {
        umb: i === 0 ? 'eskuineko-zilbor-zaina' : undefined,
        vit: i === 1 ? 'ezkerreko-zain-bitelinoa' : undefined,
        card: i === 1 ? 'ezkerreko-kardinal-komuna' : undefined,
      };
      const v = (key: string, id: string, pts0: V3[], color: string, deep: string, r: number, gone0: number) => {
        if (gone0 >= 0.98) return;
        const g = own[key];
        items.push({ key: `${key}${i}`, id, groups: g ? [g] : undefined, ...vessel(pts0, (u) => r * big * (1 - 0.75 * gone0) * lerp(1, 0.75, u), 10), color, deep, tissue: 'vessel', opacity: vShow * (1 - 0.6 * gone0) * vesselWall });
        if (g) pts[g] = pts0[Math.min(pts0.length - 1, 10)];
      };
      v('card', 'bena-kardinal-komuna', V.cardinal, T.deo2, T.deo2Deep, 0.1, cardGone);
      // Only the left common cardinal closes: the left anterior cardinal drains through its anastomosis to the right.
      v('ant', 'aurreko-zain-kardinalak', V.anterior, T.deo2, T.deo2Deep, 0.075, 0);
      v('post', 'atzeko-zain-kardinalak', V.posterior, T.deo2, T.deo2Deep, 0.075, 0.5 * cardGone);
      if (i === 0) {
        v('umb', 'zilbor-zainak', V.umbilical, T.o2, T.o2Deep, 0.09, umbGone);
        v('vit', 'bitelo-zainak', V.vitelline, T.deo2, T.deo2Deep, 0.085, vitGone);
      } else {
        // Left side: only the stretch between the horn and the anastomosis closes. The left vitelline's
        // stretch goes (the vein the notes say disappears); the left umbilical's end empties as its blood
        // takes the anastomosis to the right, so the shrinking left horn never receives it.
        const J = 10;
        const leftUmbGone = 0.92 * gone(pose.obliterate[0]);
        v('umb', 'zilbor-zainak', V.umbilical.slice(0, J + 1), T.o2, T.o2Deep, 0.09, leftUmbGone);
        v('umbD', 'zilbor-zainak', V.umbilical.slice(J), T.o2, T.o2Deep, 0.09, 0);
        v('vit', 'bitelo-zainak', V.vitelline.slice(0, J + 1), T.deo2, T.deo2Deep, 0.085, vitGone);
        v('vitD', 'bitelo-zainak', V.vitelline.slice(J), T.deo2, T.deo2Deep, 0.085, 0);
        pts['ezkerreko-zain-bitelinoa'] = V.vitelline[5];
      }
      pts[`bena-kardinal-komuna${i}`] = V.cardinal[V.cardinal.length - 1];
      pts[`aurreko-zain-kardinalak${i}`] = V.anterior[10];
      pts[`atzeko-zain-kardinalak${i}`] = V.posterior[10];
      pts[`zilbor-zainak${i}`] = V.umbilical[12];
      pts[`bitelo-zainak${i}`] = V.vitelline[12];
    }
    // Anastomoses: cross connections that carry the left veins' blood over to the right side.
    const an = clamp01(pose.anast ?? 0);
    if (an > 0.01) {
      const L = veins(cd.horn[1], 1);
      const R = veins(cd.horn[0], -1);
      anastomoses(L, R).forEach((c, k) => {
        const part = c.slice(0, Math.max(2, Math.round(c.length * an)));
        // The umbilical one carries the placenta's oxygenated blood (red), the others venous blood.
        items.push({ key: `anast${k}`, id: 'anastomosiak', ...vessel(part, k === 2 ? 0.07 : 0.06, 10), color: k === 2 ? T.o2 : T.deo2, deep: k === 2 ? T.o2Deep : T.deo2Deep, tissue: 'vessel', opacity: vShow * vesselWall });
      });
      pts['anastomosiak'] = mix3(L.vitelline[10], R.vitelline[10], 0.3);
    }
  }

  // Context: dorsal aortas, the aortic arches round the foregut, the foregut, the pericardial cavity, the septum transversum.
  const ao = o.aortas ?? 0;
  if (ao > 0.01) {
    const sac = line[0];
    const n = Math.max(0, Math.min(3, pose.arches));
    for (const sx of [-1, 1]) {
      const { da } = arterial(sac, sx, 0);
      items.push({ key: `dao${sx}`, id: 'aorta-dortsalak', ...vessel(da, 0.11, 12), color: T.aorta, deep: T.aortaDeep, tissue: 'vessel', opacity: ao * vesselWall });
      for (let k = 0; k < 3; k++) {
        const g = clamp01(n - k);
        if (g <= 0.01) continue;
        const { arch } = arterial(sac, sx, k);
        const part = arch.slice(0, Math.max(2, Math.round(arch.length * g)));
        items.push({ key: `arch${k}${sx}`, id: 'aorta-arkuak', ...vessel(part, 0.075, 10), color: T.o2, deep: T.o2Deep, tissue: 'vessel', opacity: ao * vesselWall });
        if (k === 0) pts[`aorta-arkuak${sx}`] = arch[9];
      }
      pts[`aorta-dortsalak${sx}`] = da[12];
    }
  }
  const gut = o.gut ?? 0;
  if (gut > 0.01) {
    const g = path([[0, 2.3, -0.82], [0, 1.0, -0.86], [0, -0.6, -0.9], [0, -2.4, -0.86]], 24);
    items.push({ key: 'gut', id: 'aurreko-hestea', ...tubeParts(g, { radius: (u) => lerp(0.24, 0.18, u), ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true }), color: T.endo, deep: T.endoDeep, tissue: 'epithelium', opacity: gut * 0.85 });
    pts['aurreko-hestea'] = g[6];
  }
  const noto = o.noto ?? 0;
  if (noto > 0.01) {
    const n = path([[0, 2.5, -1.78], [0, 0.4, -1.84], [0, -1.4, -1.82], [0, -2.7, -1.76]], 24);
    items.push({ key: 'noto', id: 'notokorda', ...tubeParts(n, { radius: () => 0.1, ref: [0, 0, 1], sides: 12, capStart: true, capEnd: true }), color: '#a855f7', deep: '#5b21b6', tissue: 'mesenchyme', opacity: noto });
    pts['notokorda'] = n[9];
  }
  const cav = o.cavity ?? 0;
  if (cav > 0.01) {
    const L = clamp01(pose.loop);
    // Straight tube: the cavity ends at the ventricle–atrium boundary (u = 0.82): bulbus and ventricle inside,
    // the atrium and the sinus outside, in the septum transversum (notes 2, p9). The loop brings them in.
    const c: V3 = [lerp(0, -0.04, L), lerp(0.79, 0.42, L), lerp(0.28, 0.08, L)];
    items.push({ key: 'cavity', id: 'perikardio-barrunbea', ...blobParts({ center: c, radii: [lerp(0.95, 1.25, L), lerp(1.24, 1.5, L), lerp(0.85, 1.22, L)], rings: 20, sides: 28 }), color: '#ffb3c4', deep: '#a3485e', tissue: 'membrane', opacity: 0.13 * cav, outline: false });
    pts['perikardio-barrunbea'] = add(c, [0.75, 0.6, 0.3]);
  }
  const st = o.septum ?? 0;
  if (st > 0.01) {
    const L = clamp01(pose.loop);
    // Straight tube: it holds the atrial end of the tube, the paired atria and the sinus horns.
    const c: V3 = [0, lerp(-1.08, -1.3, L), lerp(-0.05, -0.3, L)];
    items.push({ key: 'septum', id: 'septum-transversum', ...blobParts({ center: c, radii: [1.35, lerp(0.68, 0.36, L), 1.0], rings: 14, sides: 24 }), color: T.septum, deep: T.septumDeep, tissue: 'mesenchyme', opacity: 0.32 * st, outline: false });
    pts['septum-transversum'] = add(c, [-0.9, -0.05, 0.4]);
  }

  // Blood in the lumen: cells along the centreline from the horns to the aortic sac, placed by the GPU
  // from the phase (one cell mesh drawn once per cell); they appear one by one as the flow starts.
  if (o.flow && (o.flow.show > 0.01 || vesselFlow > 0.01)) {
    const run = { route: routeOf(line), phase: o.flow.phase, grow: clamp01(o.flow.show) };
    const cell = cachedBlob({ center: [0, 0, 0], radii: [0.055, 0.04, 0.055], rings: 6, sides: 8 });
    if (o.flow.show > 0.01) {
      items.push({ key: 'flow', mesh: cell, color: T.deo2, deep: T.deo2Deep, tissue: 'skin', stream: { ...run, ...(o.flow.mixed ? CELLS.deo2 : CELLS.all) } });
      if (o.flow.mixed) items.push({ key: 'flowO2', mesh: cell, color: T.o2, deep: T.o2Deep, tissue: 'skin', stream: { ...run, ...CELLS.o2 } });
    }
    // In the vessels the cells keep the tube's speed (same distance per stage time, whatever the route's length).
    if (vesselFlow > 0.01) {
      const speed = o.flow.phase * routeLength(run.route);
      const along = (key: string, pts: V3[], sets: [Cells, string, string][], grow = vesselFlow) => {
        if (grow <= 0.01) return;
        const route = vesselRouteOf(pts);
        const sr = { route, phase: speed / routeLength(route), grow };
        for (const [set, color, deep] of sets) items.push({ key: `flow-${key}${color === T.o2 ? 'O2' : ''}`, mesh: cell, color, deep, tissue: 'skin', stream: { ...sr, ...set } });
      };
      const red: [Cells, string, string][] = [[VESSEL_CELLS.all, T.o2, T.o2Deep]];
      const blue: [Cells, string, string][] = [[VESSEL_CELLS.all, T.deo2, T.deo2Deep]];
      if (vShow > 0.01) {
        const R = veins(cd.horn[0], -1);
        const L = veins(cd.horn[1], 1);
        const [vitLink, antLink, umbLink] = anastomoses(L, R);
        // A vein's blood from its far end down to index k (towards the horn), reversed into the blood's direction.
        const from = (p: V3[], k = 0) => [...p.slice(k)].reverse();
        const intoRight = (p: V3[]) => [...p, cd.sinusIn[0], cd.atrium[0]];
        const intoLeft = (p: V3[]) => [...p, cd.sinusIn[1], cd.atrium[1]];
        // As a vein closes, the cells on its old way go one by one and those on its new way (across an
        // anastomosis, once it is there) come one by one: no cell jumps from one way to the other.
        const linked = ss(0.6, 1, clamp01(pose.anast ?? 0));
        const old4 = vesselFlow * (1 - ss(0.25, 0.6, pose.obliterate[0]));
        const new4 = vesselFlow * ss(0.4, 0.75, pose.obliterate[0]) * linked;
        const old10 = vesselFlow * (1 - ss(0.25, 0.6, pose.obliterate[1]));
        const new10 = vesselFlow * ss(0.4, 0.75, pose.obliterate[1]) * linked;
        // Right side: the right umbilical closes in the 4th week; the others stay.
        along('umb0', intoRight(from(R.umbilical)), red, old4);
        along('vit0', intoRight(from(R.vitelline)), blue);
        along('ant0', intoRight([...from(R.anterior), ...from(R.cardinal)]), blue);
        along('post0', intoRight([...from(R.posterior), ...from(R.cardinal)]), blue);
        // Left side: straight into the left horn while its veins are open; once they close, across an
        // anastomosis into the right vein beside it and on to the right horn.
        along('umb1', intoLeft(from(L.umbilical)), red, old4);
        along('vit1', intoLeft(from(L.vitelline)), blue, old4);
        along('umb1x', intoRight([...from(L.umbilical, LINK.umb[0]), ...umbLink, ...from(R.vitelline.slice(0, LINK.umb[1] + 1))]), red, new4);
        along('vit1x', intoRight([...from(L.vitelline, LINK.vit[0]), ...vitLink, ...from(R.vitelline.slice(0, LINK.vit[1] + 1))]), blue, new4);
        along('ant1', intoLeft([...from(L.anterior), ...from(L.cardinal)]), blue, old10);
        along('post1', intoLeft([...from(L.posterior), ...from(L.cardinal)]), blue, old10);
        along('ant1x', intoRight([...from(L.anterior, LINK.ant[0]), ...antLink, ...from(R.anterior.slice(0, LINK.ant[1] + 1)), ...from(R.cardinal)]), blue, new10);
      }
      // Out through the first arch of each side and down its dorsal aorta: oxygenated, a few cells poorer.
      if (o.flow.arteries && ao > 0.01 && pose.arches >= 1)
        for (const sx of [-1, 1]) {
          const { arch, da } = arterial(line[0], sx, 0);
          const end = arch[arch.length - 1][1];
          along(`art${sx}`, [...arch, ...da.filter((p) => p[1] < end - 0.05)], [
            [VESSEL_CELLS.mostO2, T.o2, T.o2Deep],
            [VESSEL_CELLS.someDeo2, T.deo2, T.deo2Deep],
          ]);
        }
    }
  }

  // A faint copy of another pose (where the tube started).
  if (o.ghost) {
    const gl = centreline(o.ghost, 60);
    items.push({ key: 'ghost', ...tubeParts(gl, { radius: (u) => radiusAt(u, o.ghost!) * 0.98, ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true }), color: '#e8eefc', deep: '#8c96b0', tissue: 'membrane', opacity: 0.14, outline: false });
  }

  return { items, line, cd, pts };
}

// ———————————————————————————— blood in the lumen ————————————————————————————

type Cells = { cells: Float32Array; gates: Float32Array };

/**
 * Per cell (constant): where along the route it starts, its fixed offset from the centreline (`jit` of the
 * tube's: a vessel's lumen is narrower), when it appears.
 */
function cellSet(n: number, pick: (i: number) => boolean, jit = 1): Cells {
  const idx = Array.from({ length: n }, (_, i) => i).filter(pick);
  const cells = new Float32Array(idx.length * 4);
  const gates = new Float32Array(idx.length);
  idx.forEach((i, k) => {
    cells.set([i / n, Math.sin(i * 12.9) * 0.07 * jit, Math.cos(i * 7.3) * 0.05 * jit, Math.sin(i * 3.1) * 0.07 * jit], k * 4);
    // Spread evenly over the flow's start, but not in order along the route: here and there.
    gates[k] = ((i * 0.618034) % 1) * 0.85;
  });
  return { cells, gates };
}

/** In the tube, 26 cells; mixed blood: every third cell oxygenated. */
const CELLS = { all: cellSet(26, () => true), deo2: cellSet(26, (i) => i % 3 !== 0), o2: cellSet(26, (i) => i % 3 === 0) };
/** In a vessel, 7 cells; arteries carry oxygenated blood with a few poorer cells (every fourth). */
const VESSEL_CELLS = { all: cellSet(7, () => true, 0.3), mostO2: cellSet(8, (i) => i % 4 !== 1, 0.3), someDeo2: cellSet(8, (i) => i % 4 === 1, 0.3) };

const routes = new Map<string, Float32Array>();
const lengths = new WeakMap<Float32Array, number>();
/** Length of a resampled route (along its points). */
export function routeLength(r: Float32Array): number {
  let L = lengths.get(r);
  if (L === undefined) {
    L = 0;
    for (let j = 1; j < STREAM_ROUTE_N; j++) L += Math.hypot(r[j * 3] - r[j * 3 - 3], r[j * 3 + 1] - r[j * 3 - 2], r[j * 3 + 2] - r[j * 3 - 1]);
    lengths.set(r, L);
  }
  return L;
}
const remember = (key: string, r: Float32Array) => {
  if (routes.size >= 64) routes.delete(routes.keys().next().value!);
  routes.set(key, r);
  return r;
};

/** A vessel's route, in the blood's direction, resampled evenly by length (cells keep one speed along it). */
export function vesselRouteOf(pts: readonly V3[]): Float32Array {
  const key = new Sig().str('vessel').pts(pts).key();
  const known = routes.get(key);
  if (known) return known;
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const total = acc[acc.length - 1] || 1;
  const r = new Float32Array(STREAM_ROUTE_N * 3);
  let i = 1;
  for (let j = 0; j < STREAM_ROUTE_N; j++) {
    const d = (j / (STREAM_ROUTE_N - 1)) * total;
    while (i < pts.length - 1 && acc[i] < d) i++;
    const seg = acc[i] - acc[i - 1];
    r.set(mix3(pts[i - 1], pts[i], seg > 0 ? clamp01((d - acc[i - 1]) / seg) : 0), j * 3);
  }
  return remember(key, r);
}
/**
 * The cells' route: the centreline run backwards (the blood goes from the atrial end up to the sac),
 * resampled for the GPU. The same array while the line keeps its shape, so it is sent to the GPU once.
 */
export function routeOf(line: readonly V3[]): Float32Array {
  const key = new Sig().pts(line).key();
  const known = routes.get(key);
  if (known) return known;
  const r = new Float32Array(STREAM_ROUTE_N * 3);
  const n = line.length - 1;
  for (let j = 0; j < STREAM_ROUTE_N; j++) {
    const g = (1 - j / (STREAM_ROUTE_N - 1)) * n;
    const lo = Math.min(n - 1, Math.floor(g));
    r.set(mix3(line[lo], line[lo + 1], g - lo), j * 3);
  }
  return remember(key, r);
}

/** Unit direction helper for arrows. */
export const dirTo = (a: V3, b: V3) => norm(sub(b, a));
export { add, mul };
