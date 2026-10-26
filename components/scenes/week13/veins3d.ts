import { add, mix3, type M4, type V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import { cachedBlob } from '@/lib/three-d/mesh-cache';
import type { Item3, Tissue3 } from '@/lib/three-d/scene';
import { POSE0, blobParts, caudal, heartModel, mixHex, routeLength, tubeParts, vesselRouteOf, type HeartPose } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';

/**
 * Topic 13's one venous system, in 3D. Every view of stages 2–12 (and the venous half of the circulation,
 * 13–16) is a camera on this model: topic 10's heart with its sinus venosus and horns, the three vein pairs
 * of the 5th week (vitelline, umbilical, cardinal), the liver growing into the septum transversum with the
 * vitelline plexus round the duodenum and the hepatic sinusoids, the three new cardinal systems of weeks 5–7
 * (sub-, sacro- and supracardinal), and every anastomosis that carries the left veins' blood to the right.
 * Each segment grows, stays or regresses ("desagertu") on its own parameter, and with `dc` (the cardinals)
 * and `dv` (the veins of the viscera, the liver and the inferior vena cava) the system takes its adult shape.
 *
 * Axes (the embryo's own, as in topics 10–12): x towards the embryo's LEFT, y cranial, z ventral. A camera
 * in front (+z) shows the embryo's left on the viewer's right, as in the notes' figures (Langman, ventral).
 *
 * Colour = origin (the notes' figures): every piece keeps the colour of the embryonic vein it comes from
 * while it becomes an adult vein. Sinus horns violet (topic 10), vitelline teal (→ portal, superior
 * mesenteric, splenic, the hepatic segment of the IVC), umbilical rose (→ ductus venosus; ligaments putty),
 * anterior cardinal blue, common cardinal sky (→ the SVC's two parts), posterior cardinal lime (→ the azygos
 * arch), subcardinal orange (→ renal segment, left renal and gonadal veins), sacrocardinal magenta (→
 * sacrocardinal segment, common iliacs), supracardinal yellow as in the notes ("horiz argazkian": → azygos,
 * hemiazygos). Blood colour (O₂) is used only by the cells in the streams.
 *
 * Every vessel is one polyline of key points in two poses, embryonic (E) and adult (A), with the same number
 * of points: the pose mixes them point by point, so a junction (a point shared by two vessels) stays one.
 */

// ———————————————————————————— colours ————————————————————————————

export const VC = {
  sinus: T.sinus,
  hornR: '#a78bfa',
  hornL: '#8a6ae6',
  vit: '#22c3b0',
  vitDeep: '#0f6e63',
  umb: '#f0609a',
  umbDeep: '#8f2350',
  ant: '#2f6fe0',
  common: '#7dd3fc',
  post: '#84cc16',
  sub: '#f97316',
  sacro: '#e879f9',
  supra: '#facc15',
  intercostal: '#e9d77a',
  ligament: '#c9c1b2',
  liver: '#a0483a',
  liverDeep: '#4a1a14',
  septum: T.septum,
  gut: T.endo,
  gutDeep: T.endoDeep,
  kidney: '#c86b5a',
  gonad: '#e9b6c8',
  spleen: '#9b3b5a',
  rib: '#d6d9de',
  yolk: '#f2c14e',
  o2: T.o2,
  o2Deep: T.o2Deep,
  deo2: T.deo2,
  deo2Deep: T.deo2Deep,
} as const;

const darker = (c: string) => mixHex(c, '#000000', 0.55);

// ———————————————————————————— pose ————————————————————————————

export interface VeinPose {
  /** Cardinal veins (anterior, posterior, common, supracardinal) embryonic → adult shape. */
  dc: number;
  /** Veins of the viscera (vitelline, umbilical, liver, sub- and sacrocardinal) embryonic → adult shape. */
  dv: number;
  /** The three pairs of the 5th week, grown in (vitelline, umbilical, cardinal). */
  vit: number;
  umb: number;
  card: number;
  /** The vitelline veins' anastomoses round the duodenum (the periduodenal plexus). */
  plexus: number;
  /** The liver bud and its growth into the septum transversum (0 = none, 0.2 = bud, 1 = the liver). */
  liver: number;
  /** The vitelline veins branched inside the liver: the hepatic sinusoids. */
  sinus: number;
  /** Vitelline regressions: left distal, left proximal (= the left hepatocardiac channel), right distal; the plexus remodelled. */
  lDist: number;
  lProx: number;
  rDist: number;
  remodel: number;
  /** The portal system named: superior mesenteric and splenic veins grown, portal branches in the liver, hepatic veins. */
  portal: number;
  hepV: number;
  /** Umbilical veins: proximal parts gone, the right one gone entirely, the ductus venosus. */
  umbProx: number;
  umbR: number;
  dv0: number;
  /** After birth: left umbilical vein → ligamentum teres, ductus venosus → ligamentum venosum. */
  teres: number;
  venosum: number;
  /** The new cardinal systems (weeks 5–7), grown in one by one. */
  sub: number;
  sacro: number;
  supra: number;
  /** Most of the posterior cardinals gone (the right one's proximal part stays: the azygos arch). */
  pcGone: number;
  /** Supracardinal anastomoses: the lower (→ hemiazygos crossing) and the upper (→ accessory crossing). */
  supraAn: number;
  accAn: number;
  /** The left supracardinal's middle gone: two trunks (hemiazygos, accessory hemiazygos). */
  supraGap: number;
  /** Intercostal veins, the trunk of the first three spaces and the lumbar vein. */
  intercostal: number;
  /** Subcardinal anastomosis; left subcardinal's proximal part gone; right subcardinal fused up to the hepatic segment. */
  subAn: number;
  lSubProx: number;
  hepSub: number;
  /** Sacrocardinal anastomosis; left sacrocardinal's proximal part gone; internal and external iliac veins. */
  sacroAn: number;
  lSacroProx: number;
  iliacs: number;
  /** Anterior cardinal anastomosis (→ left brachiocephalic); left anterior cardinal's low part and left common cardinal gone. */
  acAn: number;
  lAcLow: number;
  lCommon: number;
  /** Subclavian veins (from the limb buds) and external jugulars. */
  subcl: number;
  extJug: number;
  /** Names of the adult veins (0 = embryonic names, 1 = adult names): portal system, the IVC's hepatic, renal and sacrocardinal segments, SVC, azygos. */
  names: { portal: number; hep: number; ren: number; sac: number; svc: number; azygos: number };
  /** Topic 10's heart: the left horn shrinking (shift) and the coronary sinus. */
  shift: number;
  coronary: number;
  /** Colours: 1 = by origin, 0 = by blood (veins blue, umbilical red). */
  colour: number;
}

export const VP0: VeinPose = {
  dc: 0,
  dv: 0,
  vit: 1,
  umb: 1,
  card: 1,
  plexus: 0,
  liver: 0,
  sinus: 0,
  lDist: 0,
  lProx: 0,
  rDist: 0,
  remodel: 0,
  portal: 0,
  hepV: 0,
  umbProx: 0,
  umbR: 0,
  dv0: 0,
  teres: 0,
  venosum: 0,
  sub: 0,
  sacro: 0,
  supra: 0,
  pcGone: 0,
  supraAn: 0,
  accAn: 0,
  supraGap: 0,
  intercostal: 0,
  subAn: 0,
  lSubProx: 0,
  hepSub: 0,
  sacroAn: 0,
  lSacroProx: 0,
  iliacs: 0,
  acAn: 0,
  lAcLow: 0,
  lCommon: 0,
  subcl: 0,
  extJug: 0,
  names: { portal: 0, hep: 0, ren: 0, sac: 0, svc: 0, azygos: 0 },
  shift: 0,
  coronary: 0,
  colour: 1,
};

/** Everything the liver stages end with (stage 5's end). */
export const LIVER_DONE: Partial<VeinPose> = { plexus: 1, liver: 1, sinus: 1, lDist: 1, lProx: 1, rDist: 1, remodel: 1, portal: 1, hepV: 1, umbProx: 1, umbR: 1, dv0: 1 };
/** Everything the cardinal stages end with (stage 7's end). */
export const CARD_DONE: Partial<VeinPose> = { sub: 1, sacro: 1, supra: 1, pcGone: 1, supraAn: 1, accAn: 1, supraGap: 1, intercostal: 1, dc: 1 };
/** The adult pattern: everything that goes is gone, the rest in its final place. */
export const ADULT: VeinPose = {
  ...VP0,
  ...LIVER_DONE,
  ...CARD_DONE,
  dv: 1,
  subAn: 1,
  lSubProx: 1,
  hepSub: 1,
  sacroAn: 1,
  lSacroProx: 1,
  iliacs: 1,
  acAn: 1,
  lAcLow: 1,
  lCommon: 1,
  subcl: 1,
  extJug: 1,
  names: { portal: 1, hep: 1, ren: 1, sac: 1, svc: 1, azygos: 1 },
  shift: 1,
  coronary: 1,
};

export interface VeinOpts {
  /** Topic 10's heart (0..1) and how see-through it is (0..1). */
  heart?: number;
  heartGlass?: number;
  /** Context: the liver's opacity (multiplied by its growth), septum transversum, gut, kidneys and gonads, ribs, limb buds, yolk stalk and cord. */
  liverOp?: number;
  septum?: number;
  gut?: number;
  kidneys?: number;
  ribs?: number;
  limbs?: number;
  stalk?: number;
  /** The embryo's body wall as a faint glass shell, so the veins sit in a body (0..1). */
  body?: number;
  /** Vessels that are going, as faint ghosts where they were (0..1). */
  ghosts?: number;
  /** All the veins see-through but one set (lit by ids or groups): 0..1. */
  dim?: { ids: readonly string[]; k: number } | null;
  /** Every vein faint (the lymph stage): 0..1. */
  faint?: number;
  /** Vessel walls turned to glass so blood cells show (0..1). */
  glass?: number;
  /** Blood colour of a vein by id, where the default (umbilical red, the rest blue) is not what it carries (the fetal IVC above the ductus venosus: mixed). */
  blood?: Record<string, string>;
}

const SKIN = '#f1c7ab';
const SKIN_DEEP = '#9c6a4e';

// ———————————————————————————— geometry ————————————————————————————

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

type Side = -1 | 1;
/** A key point in both poses. */
type KP = readonly [V3, V3];
const kp = (e: V3, a: V3): KP => [e, a];
const X = (s: Side, p: V3): V3 => [s * p[0], p[1], p[2]];
const zip = (e: V3[], a: V3[]): KP[] => {
  if (e.length !== a.length) throw new Error(`pose length ${e.length} ≠ ${a.length}`);
  return e.map((p, i) => [p, a[i]]);
};
/** Same place in both poses. */
const fixed = (ps: V3[]): KP[] => ps.map((p) => [p, p]);
const at = (k: KP, d: number): V3 => (d <= 0 ? k[0] : d >= 1 ? k[1] : mix3(k[0], k[1], d));

// The heart of topic 10 (the loop, its sinus venosus and horns), placed so its horn tips sit at ±0.7.
const HEART_POSE: HeartPose = { ...POSE0, segs: 1, colour: 1, split: 1, loop: 1, atriaFuse: 1, arches: 0, veins: 0 };
const HK = 1.25;
const HCD = caudal(HEART_POSE);
const HTR: V3 = [0, -HK * HCD.horn[0][1], -0.35 - HK * HCD.horn[0][2]];
const placeH = (p: V3): V3 => [HK * p[0] + HTR[0], HK * p[1] + HTR[1], HK * p[2] + HTR[2]];
/** The horn tips: right (−x) and left (+x). Every vein of the 5th week ends at one of them. */
export const HORN = { R: placeH(HCD.horn[0]), L: placeH(HCD.horn[1]) } as const;
const horn = (s: Side) => (s < 0 ? HORN.R : HORN.L);

/** Intercostal space k (1–11) level in the adult pose (back of the thorax). */
export const spaceY = (k: number) => 1.9 - 0.4 * k;

/** Junctions, embryonic and adult. */
const J = {
  /** Anterior + posterior cardinal → common cardinal. */
  card: (s: Side) => kp(X(s, [1.35, 0.15, -0.8]), s < 0 ? [-1.0, 0.65, -0.5] : [0.9, 0.25, -0.55]),
  /** Right brachiocephalic ends here (anterior cardinal anastomosis arrives). */
  bc: kp([-1.08, 2.15, -0.85], [-0.85, 1.75, -0.5]),
  /** Internal jugular + subclavian (the jugulo-subclavian junction). */
  sj: (s: Side) => kp(X(s, [1.07, 2.7, -0.85]), s < 0 ? [-0.95, 2.45, -0.65] : [0.95, 2.45, -0.7]),
  /** Posterior cardinal: its proximal part ends where the supracardinal joins it. */
  p1: (s: Side) => kp(X(s, [1.33, -0.45, -0.86]), s < 0 ? [-0.8, 0.78, -1.0] : [1.05, -0.3, -0.9]),
  /** Top of the supracardinal. */
  sup: (s: Side) => kp(X(s, [0.55, -0.9, -1.1]), s < 0 ? [-0.4, 0.35, -1.2] : [0.42, 0.4, -1.2]),
  m1: (s: Side) => kp(X(s, [0.54, -1.6, -1.1]), s < 0 ? [-0.37, -1.3, -1.2] : [0.4, -1.3, -1.2]),
  m2: (s: Side) => kp(X(s, [0.53, -2.1, -1.1]), s < 0 ? [-0.36, -1.75, -1.2] : [0.4, -1.7, -1.2]),
  supBot: (s: Side) => kp(X(s, [0.5, -4.2, -1.1]), s < 0 ? [-0.35, -3.6, -1.2] : [0.4, -3.4, -1.2]),
  /** Vitelline: below the plexus, at the liver's lower edge, at its top. */
  v1: (s: Side) => kp(X(s, [0.45, -3.7, 0.45]), s < 0 ? [-0.15, -3.45, 0.05] : [0.7, -3.6, 0.3]),
  v2: (s: Side) => kp(X(s, [0.42, -2.45, 0.42]), s < 0 ? [-0.18, -2.3, 0.12] : [0.5, -2.4, 0.3]),
  v3: (s: Side) => kp(X(s, [0.47, -0.85, 0.1]), s < 0 ? [-0.37, -2.0, -0.42] : [0.5, -0.8, 0.0]),
  hc1: (s: Side) => kp(X(s, [0.55, -0.45, -0.12]), s < 0 ? [-0.4, -1.2, -0.32] : [0.55, -0.45, -0.12]),
  /** Umbilical: the navel, the liver's lower edge, the liver's top. */
  navel: (s: Side) => kp([0, -4.9, 1.3], s < 0 ? [0, -4.9, 1.3] : [0.05, -4.35, 1.45]),
  ul: (s: Side) => kp(X(s, [1.3, -2.4, 0.85]), s < 0 ? [-1.3, -2.4, 0.85] : [0.3, -2.3, 0.55]),
  up: (s: Side) => kp(X(s, [1.1, -0.4, 0.0]), X(s, [0.9, -0.4, 0.1])),
  /** Subcardinal: top, the anastomosis level, bottom. */
  s0: (s: Side) => kp(X(s, [0.55, -1.6, -0.5]), s < 0 ? [-0.36, -2.3, -0.45] : [0.6, -1.9, -0.55]),
  s1: (s: Side) => kp(X(s, [0.55, -2.85, -0.5]), s < 0 ? [-0.34, -3.0, -0.5] : [0.45, -3.05, -0.55]),
  s2: (s: Side) => kp(X(s, [0.5, -4.05, -0.55]), s < 0 ? [-0.33, -4.0, -0.52] : [0.7, -4.25, -0.35]),
  /** Sacrocardinal anastomosis point and the end of each common iliac. */
  sa: (s: Side) => kp(X(s, [0.52, -4.8, -0.62]), s < 0 ? [-0.28, -4.8, -0.52] : [0.3, -5.15, -0.5]),
  il: (s: Side) => kp(X(s, [1.4, -6.2, -0.4]), X(s, [1.15, -6.3, -0.35])),
};

/** Every vessel: key, colour, radius, key points (E, A), which shape parameter moves it. */
interface Vessel {
  key: string;
  color: string;
  r: number;
  kps: KP[];
  /** 'c': the cardinals' morph, 'v': the viscera's. */
  m: 'c' | 'v';
}

function vessels(s: Side): Record<string, Vessel> {
  const R = s < 0;
  const n = R ? 'R' : 'L';
  const h = horn(s);
  const A = <P,>(r: P, l: P): P => (R ? r : l);
  const v = (key: string, color: string, r: number, kps: KP[], m: 'c' | 'v'): Vessel => ({ key: `${key}${n}`, color, r, kps, m });
  return {
    // ———— cardinals ————
    common: v('common', VC.common, 0.14, [kp(h, h), kp(X(s, [1.22, 0.06, -0.55]), A([-1.05, 0.3, -0.45], [0.98, 0.12, -0.45])), J.card(s)], 'c'),
    acLow: v('acLow', VC.ant, 0.11, A(
      [J.card(s), kp([-1.22, 1.0, -0.85], [-0.95, 1.0, -0.5]), kp([-1.12, 1.8, -0.85], [-0.9, 1.4, -0.5]), J.bc],
      [J.card(s), kp([1.22, 1.0, -0.85], [0.9, 1.0, -0.8]), kp([1.12, 1.9, -0.85], [0.95, 1.8, -0.85]), J.sj(s)],
    ), 'c'),
    acMid: v('acMid', VC.ant, 0.1, A([J.bc, kp([-1.07, 2.45, -0.85], [-0.9, 2.1, -0.58]), J.sj(s)], [J.sj(s), J.sj(s)]), 'c'),
    acTop: v('acTop', VC.ant, 0.09, [J.sj(s), kp(X(s, [1.0, 3.4, -0.8]), X(s, [1.0, 3.2, -0.65])), kp(X(s, [0.9, 4.1, -0.72]), X(s, [1.05, 4.0, -0.6])), kp(X(s, [0.8, 4.8, -0.6]), X(s, [1.05, 4.8, -0.55]))], 'c'),
    subcl: v('subcl', VC.ant, 0.08, [kp(X(s, [2.6, 1.9, -0.55]), X(s, [2.7, 2.0, -0.55])), kp(X(s, [2.0, 2.4, -0.7]), X(s, [2.1, 2.35, -0.6])), kp(X(s, [1.5, 2.65, -0.8]), X(s, [1.5, 2.45, -0.65])), J.sj(s)], 'c'),
    extJug: v('extJug', VC.ant, 0.055, [kp(X(s, [0.7, 4.3, 0.35]), X(s, [0.75, 4.3, 0.35])), kp(X(s, [1.35, 3.6, 0.0]), X(s, [1.4, 3.6, 0.0])), kp(X(s, [1.75, 2.9, -0.45]), X(s, [1.85, 2.85, -0.4])), kp(X(s, [1.75, 2.53, -0.75]), X(s, [1.8, 2.4, -0.6]))], 'c'),
    pcUp: v('pcUp', VC.post, 0.11, [J.card(s), kp(X(s, [1.33, -0.15, -0.82]), A([-0.98, 0.92, -0.78], [1.0, 0.0, -0.8])), J.p1(s)], 'c'),
    pcLow: v('pcLow', VC.post, 0.1, [J.p1(s), ...fixed([X(s, [1.4, -1.6, -0.9]), X(s, [1.4, -2.8, -0.9]), X(s, [1.32, -4.0, -0.88]), X(s, [1.15, -5.1, -0.82]), X(s, [0.95, -6.0, -0.75])])], 'c'),
    supLink: v('supLink', VC.supra, 0.1, [J.p1(s), kp(X(s, [0.95, -0.7, -1.0]), A([-0.62, 0.6, -1.12], [0.75, -0.1, -1.1])), J.sup(s)], 'c'),
    supUp: v('supUp', VC.supra, 0.1, [J.sup(s), kp(X(s, [0.545, -1.25, -1.1]), A([-0.38, -0.5, -1.2], [0.4, -0.45, -1.2])), J.m1(s)], 'c'),
    supMid: v('supMid', VC.supra, 0.1, [J.m1(s), J.m2(s)], 'c'),
    supLow: v('supLow', VC.supra, 0.1, [J.m2(s), kp(X(s, [0.52, -2.8, -1.1]), A([-0.36, -2.4, -1.2], [0.4, -2.35, -1.2])), kp(X(s, [0.51, -3.5, -1.1]), A([-0.35, -3.0, -1.2], [0.4, -2.9, -1.2])), J.supBot(s)], 'c'),
    // ———— vitelline ————
    vitDist: v('vitDist', VC.vit, 0.085, [kp(X(s, [0.12, -4.7, 1.0]), X(s, [0.2, -4.6, 0.6])), kp(X(s, [0.35, -4.2, 0.7]), X(s, [0.3, -4.0, 0.3])), J.v1(s)], 'v'),
    vitPeri: v('vitPeri', VC.vit, R ? 0.1 : 0.085, [J.v1(s), kp(X(s, [0.47, -3.3, 0.42]), A([-0.17, -3.1, 0.08], [0.6, -3.2, 0.3])), kp(X(s, [0.47, -2.9, 0.42]), A([-0.18, -2.7, 0.1], [0.55, -2.8, 0.3])), J.v2(s)], 'v'),
    vitHep: v('vitHep', VC.vit, 0.085, [J.v2(s), kp(X(s, [0.4, -2.0, 0.4]), A([-0.25, -2.1, 0.0], [0.45, -2.0, 0.3])), kp(X(s, [0.42, -1.4, 0.35]), A([-0.33, -2.05, -0.25], [0.45, -1.4, 0.3])), J.v3(s)], 'v'),
    hc: v('hc', VC.vit, R ? 0.13 : 0.1, [J.v3(s), J.hc1(s), kp(X(s, [0.85, -0.12, -0.3]), A([-0.75, -0.4, -0.33], [0.85, -0.12, -0.3])), kp(h, h)], 'v'),
    // ———— umbilical ————
    umbDist: v('umbDist', VC.umb, 0.1, [J.navel(s), kp(X(s, [0.55, -4.4, 1.2]), A([-0.55, -4.4, 1.2], [0.15, -3.9, 1.3])), kp(X(s, [1.2, -3.3, 1.0]), A([-1.2, -3.3, 1.0], [0.25, -3.0, 1.0])), J.ul(s)], 'v'),
    umbLiver: v('umbLiver', VC.umb, 0.1, [J.ul(s), kp(X(s, [1.45, -1.6, 0.6]), X(s, [0.9, -1.7, 0.7])), kp(X(s, [1.35, -0.85, 0.3]), X(s, [1.0, -1.0, 0.5])), J.up(s)], 'v'),
    umbProx: v('umbProx', VC.umb, 0.1, [J.up(s), kp(X(s, [1.12, -0.2, -0.22]), X(s, [1.05, -0.2, -0.22])), kp(h, h)], 'v'),
    // ———— subcardinal ————
    subUp: v('subUp', VC.sub, 0.1, [J.s0(s), kp(X(s, [0.55, -2.25, -0.5]), A([-0.35, -2.6, -0.48], [0.55, -2.5, -0.55])), J.s1(s)], 'v'),
    subLow: v('subLow', VC.sub, 0.1, [J.s1(s), kp(X(s, [0.55, -3.45, -0.5]), A([-0.33, -3.5, -0.52], [0.55, -3.6, -0.45])), J.s2(s)], 'v'),
    // ———— sacrocardinal ————
    sacroProx: v('sacroProx', VC.sacro, 0.1, [kp(X(s, [0.5, -4.05, -0.55]), A([-0.33, -4.0, -0.52], [0.5, -4.05, -0.55])), kp(X(s, [0.5, -4.45, -0.6]), A([-0.32, -4.4, -0.52], [0.5, -4.45, -0.6])), J.sa(s)], 'v'),
    sacroDist: v('sacroDist', VC.sacro, 0.1, [J.sa(s), kp(X(s, [0.6, -5.3, -0.62]), A([-0.6, -5.2, -0.48], [0.65, -5.45, -0.47])), kp(X(s, [0.95, -5.85, -0.55]), X(s, [0.95, -5.8, -0.42])), J.il(s)], 'v'),
  };
}

/** The crossings (left → right) and the other single vessels. */
const CROSS = {
  /** Anterior cardinals → left brachiocephalic vein (left jugulo-subclavian junction → right brachiocephalic end). */
  ac: [J.sj(1), kp([0.5, 2.55, -0.55], [0.4, 2.2, -0.3]), kp([-0.4, 2.3, -0.55], [-0.2, 1.95, -0.3]), J.bc],
  /** Supracardinals: lower (→ the hemiazygos crossing) and upper (→ the accessory hemiazygos crossing). */
  supLow: [kp([0.52, -2.45, -1.1], [0.4, -2.1, -1.2]), kp([0, -2.55, -1.25], [0, -2.15, -1.3]), kp([-0.52, -2.4, -1.1], [-0.36, -2.0, -1.2])],
  supUp: [kp([0.545, -1.2, -1.1], [0.4, -0.6, -1.2]), kp([0, -1.3, -1.25], [0, -0.65, -1.3]), kp([-0.545, -1.15, -1.1], [-0.37, -0.55, -1.2])],
  /** Subcardinal anastomosis (→ left renal vein's middle part). */
  sub: [J.s1(1), kp([0, -2.95, -0.3], [0.05, -3.05, -0.35]), J.s1(-1)],
  /** Sacrocardinal anastomosis (→ the left common iliac reaching the right). */
  sacro: [J.sa(1), kp([0, -4.95, -0.45], [0.0, -5.0, -0.5]), J.sa(-1)],
  /** Right subcardinal's top fused with the hepatic segment (the renal segment reaching up). */
  hepSub: [J.s0(-1), kp([-0.52, -1.2, -0.3], [-0.365, -2.15, -0.44]), J.v3(-1)],
  /** Kidneys' veins: left (→ left renal vein's outer part) and right. */
  renalL: [kp([0.72, -2.95, -0.7], [0.72, -3.0, -0.68]), J.s1(1)],
  renalR: [kp([-0.72, -2.95, -0.7], [-0.7, -3.0, -0.65]), J.s1(-1)],
  /** Ductus venosus: left umbilical → on the liver's SURFACE (underneath and behind) → right hepatocardiac channel. */
  dv: [J.ul(1), kp([0.8, -2.42, 0.15], [0.2, -2.32, 0.0]), kp([0.3, -2.15, -0.42], [0.05, -2.1, -0.55]), kp([-0.25, -1.3, -0.48], [-0.25, -1.55, -0.6]), J.hc1(-1)],
  /** Periduodenal plexus: upper ventral, middle dorsal (→ splenic vein), lower ventral. */
  pUp: [kp([0.47, -2.8, 0.42], [0.55, -2.8, 0.3]), kp([0, -2.75, 0.85], [0.2, -2.75, 0.6]), kp([-0.47, -2.8, 0.42], [-0.18, -2.75, 0.1])],
  pMid: [kp([0.47, -3.2, 0.4], [1.0, -3.0, -0.1]), kp([0.25, -3.35, 0.05], [0.55, -3.25, -0.05]), kp([-0.2, -3.55, 0.05], [0.15, -3.42, 0.0]), J.v1(-1)],
  pLow: [kp([0.45, -3.65, 0.45], [0.7, -3.6, 0.3]), kp([0, -3.7, 0.85], [0.3, -3.6, 0.6]), kp([-0.45, -3.65, 0.45], [-0.15, -3.45, 0.05])],
  /** The splenic vein's way out to the spleen, and the superior mesenteric vein down into the mesentery. */
  spleen: [kp([0.47, -3.2, 0.4], [1.0, -3.0, -0.1]), kp([0.9, -3.05, 0.15], [1.2, -2.95, -0.15]), kp([1.35, -2.85, -0.15], [1.45, -2.85, -0.2])],
  smv: [J.v1(-1), kp([-0.5, -4.1, 0.35], [-0.25, -4.0, 0.1]), kp([-0.45, -4.6, 0.2], [-0.3, -4.6, 0.15])],
  /** Lumbar vein up into the azygos; the trunk of the first three intercostal spaces down into the azygos arch. */
  lumbar: [kp([-0.6, -5.0, -1.0], [-0.6, -4.5, -1.0]), kp([-0.5, -4.6, -1.08], [-0.45, -3.9, -1.15]), J.supBot(-1)],
  trunk3: [kp([-0.6, 1.0, -1.1], [-0.5, 1.55, -1.15]), kp([-0.6, 0.4, -1.1], [-0.55, 1.05, -1.15]), kp([-0.75, -0.2, -1.05], [-0.62, 0.62, -1.12])],
  /** Lower lumbar veins into the IVC's renal segment. */
  lowLumbar: [kp([-0.95, -3.7, -0.85], [-0.85, -3.6, -0.85]), kp([-0.55, -3.7, -0.55], [-0.33, -3.6, -0.52])],
  /** Hepatic veins (figure p3B): from the liver into the hepatic segment's top. */
  hepVR: [kp([-0.95, -0.95, 0.3], [-1.0, -1.25, 0.2]), kp([-0.6, -0.55, -0.05], [-0.55, -0.7, -0.25])],
  hepVL: [kp([0.6, -0.95, 0.3], [0.7, -1.25, 0.2]), kp([-0.1, -0.5, 0.0], [-0.1, -0.6, -0.1]), kp([-0.55, -0.4, -0.12], [-0.5, -0.5, -0.3])],
};

/** The duodenum (the vitelline plexus is round it), embryonic and adult. */
const DUODENUM: KP[] = zip(
  [[0.15, -1.95, 0.05], [0.1, -2.4, 0.3], [-0.05, -2.9, 0.45], [0.0, -3.4, 0.45], [0.2, -3.8, 0.3], [0.35, -4.2, 0.1]],
  [[0.2, -2.3, -0.1], [0.15, -2.6, 0.1], [0.0, -3.0, 0.25], [0.05, -3.4, 0.25], [0.25, -3.75, 0.15], [0.4, -4.1, 0.0]],
);

/** Internal and external iliac veins (adult only), from the end of each common iliac. */
const iliacBranches = (s: Side) => ({
  ext: [J.il(s), kp(X(s, [1.6, -6.7, -0.1]), X(s, [1.35, -6.8, -0.05])), kp(X(s, [1.7, -7.1, 0.1]), X(s, [1.45, -7.2, 0.15]))],
  int: [J.il(s), kp(X(s, [1.1, -6.7, -0.6]), X(s, [0.85, -6.8, -0.6])), kp(X(s, [0.85, -7.0, -0.7]), X(s, [0.6, -7.1, -0.7]))],
});

/** Intercostal veins: space k on side s, from the wall to the vein that takes it. */
function intercostal(s: Side, k: number, dc: number): V3[] {
  const y = lerp(spaceY(k) - 0.6, spaceY(k), dc);
  const toX = s < 0 ? (k <= 3 ? -0.55 : -0.37) : 0.4;
  const z = k <= 3 && s < 0 ? -1.15 : -1.2;
  return curve3([[s * 1.95, y - 0.12, -0.55], [s * 1.35, y - 0.03, -1.0], [s * 0.85, y, -1.18], [toX, y, z]], 8);
}

// ———————————————————————————— items ————————————————————————————

export interface VeinModel {
  items: Item3[];
  pts: Record<string, V3>;
  /** Centrelines (current pose) by vessel key, for routes and arrows. */
  lines: Record<string, V3[]>;
}

const N = 18;
const lineOf = (kps: readonly KP[], d: number, n = N) => curve3(kps.map((k) => at(k, d)), n);
/** A vessel's first part only (it grows from its start). */
const grown = (line: V3[], g: number) => (g >= 0.999 ? line : line.slice(0, Math.max(2, Math.round(line.length * clamp01(g)))));
/** Radius along a vessel that is going: it narrows from its middle to a thread, then fades. */
const goingRadius = (r: number, g: number) => (g <= 0.001 ? () => r : (u: number) => r * Math.max(0.14, 1 - g * (1.25 - 0.55 * Math.abs(2 * u - 1))));
/** Visibility of a vessel that is going (0 at gone = 1). */
const left = (g: number) => 1 - ss(0.75, 1, g);

/** Venous blood colour for a vessel (the umbilical veins carry the placenta's oxygenated blood). */
const bloodOf = (id: string) => (id.includes('lotailu') ? null : id.includes('zilbor') || id === 'hodi-benosoa' ? VC.o2 : VC.deo2);

/** The heart as topic 10 left it (the loop, sinus and horns), placed at the horns; its right horn is the RA's smooth back wall. */
function heartItems(pose: VeinPose, glass: number): { items: Item3[]; pts: Record<string, V3> } {
  const h = heartModel({ ...HEART_POSE, shift: pose.shift, coronary: pose.coronary, glass }, { cavity: 0, septum: 0, gut: 0, aortas: 0, noto: 0 });
  const m: M4 = new Float32Array([HK, 0, 0, 0, 0, HK, 0, 0, 0, 0, HK, 0, HTR[0], HTR[1], HTR[2], 1]);
  const items = h.items
    .filter((it) => !it.stream)
    .map((it) => {
      // The right horn is the smooth back wall of the right atrium (where both venae cavae open).
      const extra = it.id === 'eskuineko-sinu-luzapena' ? ['eskuineko-aurikula', 'atal-lisoa'] : it.id === 'atal-aurikularra' ? ['eskuineko-aurikula'] : [];
      return { ...it, key: `h-${it.key}`, groups: it.id ? [...(it.groups ?? []), ...extra, 'bihotza'] : undefined, matrix: m };
    });
  const pts: Record<string, V3> = {};
  for (const [k, p] of Object.entries(h.pts)) pts[k] = placeH(p);
  return { items, pts };
}

export function veinModel(pose: VeinPose, o: VeinOpts = {}): VeinModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const lines: Record<string, V3[]> = {};
  const dim = o.dim;
  const ghost = o.ghosts ?? 0;
  const faint = o.faint ?? 0;
  const glassK = o.glass ?? 0;
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));

  /** One vessel item. */
  const push = (key: string, id: string | undefined, line: V3[], color: string, r: number | ((u: number) => number), show = 1, extra: Partial<Item3> = {}) => {
    if (show <= 0.01 || line.length < 2) return;
    const b = id ? (o.blood?.[id] ?? bloodOf(id)) : VC.deo2;
    const col = b ? mixHex(b, color, pose.colour) : color;
    const k = (id ? (lit(id, extra.groups) ? 1 : 1 - 0.78 * (dim?.k ?? 0)) : 1) * (1 - 0.72 * faint) * (1 - 0.45 * glassK);
    items.push({ key, id, ...tubeParts(line, { radius: typeof r === 'number' ? () => r : r, ref: [0, 0, 1], sides: 12, capStart: true, capEnd: true }), color: col, deep: darker(col), tissue: 'vessel', show, opacity: k, ...extra });
  };
  /** Where a vessel was (the notes' dashed outline), once it is going; it keeps the vessel's name so the narration can still point at it. */
  const ghostOf = (key: string, line: V3[], r: number, g: number, id?: string, groups?: readonly string[]) => {
    const k = ghost * ss(0.35, 0.9, g) * (1 - faint) * (id && !lit(id, groups) ? 1 - 0.78 * (dim?.k ?? 0) : 1);
    if (k <= 0.01) return;
    items.push({ key: `ghost-${key}`, id, groups: groups ? [...groups] : undefined, ...tubeParts(line, { radius: () => r * 0.5, ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }), color: '#e6e0f0', deep: '#6a6478', tissue: 'membrane', opacity: 0.42 * k, outline: false });
  };
  const dOf = (m: 'c' | 'v') => clamp01(m === 'c' ? pose.dc : pose.dv);
  const L = (v: Vessel) => {
    const l = lineOf(v.kps, dOf(v.m));
    lines[v.key] = l;
    return l;
  };
  const Lc = (key: string, kps: readonly KP[], m: 'c' | 'v', n = 12) => {
    const l = lineOf(kps, dOf(m), n);
    lines[key] = l;
    return l;
  };
  const mid = (l: V3[], f = 0.5) => l[Math.min(l.length - 1, Math.round((l.length - 1) * f))];
  const nm = pose.names;

  for (const s of [-1, 1] as Side[]) {
    const R = s < 0;
    const n = R ? 'R' : 'L';
    const V = vessels(s);
    const card = clamp01(pose.card);
    const vSide = R ? 'eskuineko-zain-bitelinoa' : 'ezkerreko-zain-bitelinoa';
    const uSide = R ? 'eskuineko-zilbor-zaina' : 'ezkerreko-zilbor-zaina';

    // ———— cardinals ————
    {
      const l = L(V.common);
      const gone = R ? 0 : clamp01(pose.lCommon);
      const svc = R && nm.svc > 0.5;
      push(V.common.key, svc ? 'goiko-kaba-zaina' : 'bena-kardinal-komuna', grown(l, card), V.common.color, goingRadius(V.common.r, gone), left(gone) * (card > 0.01 ? 1 : 0), {
        groups: R ? ['bena-kardinal-komuna', 'goiko-kaba-zaina', 'goiko-kabaren-bukaerako-atala'] : ['bena-kardinal-komuna', 'ezkerreko-kardinal-komuna'],
      });
      ghostOf(V.common.key, l, V.common.r, gone, 'ezkerreko-kardinal-komuna', ['bena-kardinal-komuna']);
      pts[`bena-kardinal-komuna${n}`] = mid(l, 0.55);
      if (R) pts['goiko-kabaren-bukaerako-atala'] = mid(l, 0.55);
    }
    {
      const l = L(V.acLow);
      const gone = R ? 0 : clamp01(pose.lAcLow);
      const svc = R && nm.svc > 0.5;
      push(V.acLow.key, svc ? 'goiko-kaba-zaina' : 'aurreko-zain-kardinalak', grown(l, card), V.acLow.color, goingRadius(V.acLow.r * (R ? 1 + 0.25 * nm.svc : 1), gone), left(gone) * (card > 0.01 ? 1 : 0), {
        groups: R ? ['aurreko-zain-kardinalak', 'goiko-kaba-zaina', 'goiko-kabaren-hasierako-atala'] : ['aurreko-zain-kardinalak'],
      });
      ghostOf(V.acLow.key, l, V.acLow.r, gone, 'aurreko-zain-kardinalak');
      pts[`aurreko-zain-kardinalak${n}`] = mid(l, 0.45);
      if (R) pts['goiko-kabaren-hasierako-atala'] = mid(l, 0.5);
    }
    if (R) {
      const l = L(V.acMid);
      push(V.acMid.key, nm.svc > 0.5 ? 'eskuineko-zain-brakiozefalikoa' : 'aurreko-zain-kardinalak', grown(l, card), V.acMid.color, V.acMid.r, card > 0.01 ? 1 : 0, { groups: ['aurreko-zain-kardinalak', 'eskuineko-zain-brakiozefalikoa', 'zain-brakiozefalikoak'] });
      pts['eskuineko-zain-brakiozefalikoa'] = mid(l, 0.5);
    }
    {
      const l = L(V.acTop);
      push(V.acTop.key, nm.svc > 0.5 ? 'barneko-jugularrak' : 'aurreko-zain-kardinalak', grown(l, card), V.acTop.color, (u: number) => V.acTop.r * lerp(1, 0.8, u), card > 0.01 ? 1 : 0, { groups: ['aurreko-zain-kardinalak', 'barneko-jugularrak'] });
      pts[`barneko-jugularrak${n}`] = mid(l, 0.5);
      pts[`aurreko-zain-kardinalak-top${n}`] = mid(l, 0.6);
    }
    if (pose.subcl > 0.01) {
      const l = L(V.subcl);
      push(V.subcl.key, 'zain-subklabioak', grown([...l].reverse(), pose.subcl).reverse(), V.subcl.color, V.subcl.r, 1, { groups: ['zain-subklabioak'] });
      pts[`zain-subklabioak${n}`] = mid(l, 0.45);
    }
    if (pose.extJug > 0.01) {
      const l = L(V.extJug);
      push(V.extJug.key, 'kanpoko-jugularrak', grown(l, pose.extJug), V.extJug.color, V.extJug.r, 1);
      pts[`kanpoko-jugularrak${n}`] = mid(l, 0.4);
    }
    pts[`lotura-yugulosubklabikoa${n}`] = at(J.sj(s), pose.dc);
    {
      const l = L(V.pcUp);
      const gone = R ? 0 : clamp01(pose.pcGone);
      const az = R && nm.azygos > 0.5;
      push(V.pcUp.key, az ? 'azigos-zaina' : 'atzeko-zain-kardinalak', grown(l, card), V.pcUp.color, goingRadius(V.pcUp.r, gone), left(gone) * (card > 0.01 ? 1 : 0), { groups: R ? ['atzeko-zain-kardinalak', 'azigos-zaina'] : ['atzeko-zain-kardinalak'] });
      ghostOf(V.pcUp.key, l, V.pcUp.r, gone, 'atzeko-zain-kardinalak');
      if (R) pts['azigos-arkua'] = mid(l, 0.6);
      const ll = L(V.pcLow);
      const g2 = clamp01(pose.pcGone);
      push(V.pcLow.key, 'atzeko-zain-kardinalak', grown(ll, card), V.pcLow.color, goingRadius(V.pcLow.r, g2), left(g2) * (card > 0.01 ? 1 : 0));
      ghostOf(V.pcLow.key, ll, V.pcLow.r, g2, 'atzeko-zain-kardinalak');
      pts[`atzeko-zain-kardinalak${n}`] = mid(ll, 0.3);
    }
    if (pose.supra > 0.01) {
      const sup = clamp01(pose.supra);
      const az = nm.azygos > 0.5;
      const idR = az ? 'azigos-zaina' : 'kardinal-gaineko-zainak';
      const gR = ['kardinal-gaineko-zainak', 'azigos-zaina'];
      // The supracardinal grows from below up to where it meets the posterior cardinal.
      const lLow = L(V.supLow);
      const lMid = L(V.supMid);
      const lUp = L(V.supUp);
      const lLink = L(V.supLink);
      // From the bottom up: low first, the link to the posterior cardinal last.
      const gLow = clamp01(sup * 4);
      const gMid = clamp01(sup * 4 - 1);
      const gUp = clamp01(sup * 4 - 2);
      const gLink = clamp01(sup * 4 - 3);
      const gap = R ? 0 : clamp01(pose.supraGap);
      const lowId = R ? idR : az ? 'hemiazigos-zaina' : 'kardinal-gaineko-zainak';
      const upId = R ? idR : az ? 'hemiazigos-laguntzailea' : 'kardinal-gaineko-zainak';
      const linkGone = R ? 0 : clamp01(pose.pcGone);
      push(V.supLow.key, lowId, grown([...lLow].reverse(), gLow).reverse(), V.supLow.color, V.supLow.r, gLow > 0.01 ? 1 : 0, { groups: R ? gR : ['kardinal-gaineko-zainak', 'hemiazigos-zaina'] });
      push(V.supMid.key, R ? idR : 'kardinal-gaineko-zainak', grown([...lMid].reverse(), gMid).reverse(), V.supMid.color, goingRadius(V.supMid.r, gap), left(gap) * (gMid > 0.01 ? 1 : 0), { groups: R ? gR : ['kardinal-gaineko-zainak'] });
      ghostOf(V.supMid.key, lMid, V.supMid.r, gap, 'kardinal-gaineko-zainak');
      push(V.supUp.key, upId, grown([...lUp].reverse(), gUp).reverse(), V.supUp.color, V.supUp.r, gUp > 0.01 ? 1 : 0, { groups: R ? gR : ['kardinal-gaineko-zainak', 'hemiazigos-laguntzailea'] });
      push(V.supLink.key, R ? idR : 'kardinal-gaineko-zainak', grown([...lLink].reverse(), gLink).reverse(), V.supLink.color, goingRadius(V.supLink.r, linkGone), left(linkGone) * (gLink > 0.01 ? 1 : 0), { groups: R ? gR : ['kardinal-gaineko-zainak'] });
      ghostOf(V.supLink.key, lLink, V.supLink.r, linkGone);
      pts[`kardinal-gaineko-zainak${n}`] = mid(lLow, 0.35);
      if (R) {
        pts['azigos-zaina'] = mid(lUp, 0.6);
        pts['azigos-behea'] = mid(lLow, 0.6);
      } else {
        pts['hemiazigos-zaina'] = mid(lLow, 0.4);
        pts['hemiazigos-laguntzailea'] = mid(lUp, 0.45);
      }
    }

    // ———— vitelline ————
    const vit = clamp01(pose.vit);
    if (vit > 0.01) {
      const dist = clamp01(R ? pose.rDist : pose.lDist);
      const l0 = L(V.vitDist);
      push(V.vitDist.key, vSide, l0, V.vitDist.color, goingRadius(V.vitDist.r, dist), left(dist) * vit, { groups: ['bitelo-zainak'] });
      ghostOf(V.vitDist.key, l0, V.vitDist.r, dist, vSide, ['bitelo-zainak']);
      pts[`bitelo-zainak-dist${n}`] = mid(l0, 0.4);
      const l1 = L(V.vitPeri);
      const portal = R && nm.portal > 0.5;
      // The left periduodenal part goes with the left distal part (the plexus is remodelled into the portal vein).
      const periGone = R ? 0 : clamp01(pose.remodel);
      push(V.vitPeri.key, portal ? 'porta-zaina' : vSide, l1, V.vitPeri.color, goingRadius(V.vitPeri.r * (portal ? 1.3 : 1), periGone), left(periGone) * vit, { groups: R ? ['bitelo-zainak', 'porta-zaina', 'eskuineko-zain-bitelinoa'] : ['bitelo-zainak'] });
      ghostOf(V.vitPeri.key, l1, V.vitPeri.r, periGone, vSide, ['bitelo-zainak']);
      pts[`bitelo-zainak${n}`] = mid(l1, 0.5);
      if (R) pts['porta-zaina'] = mid(l1, 0.55);
      // Inside the liver: the vein branches into the sinusoids and, as a vein of its own, is gone.
      const l2 = L(V.vitHep);
      const hepGone = clamp01(pose.sinus) * 0.85 + 0.15 * clamp01(pose.remodel);
      push(V.vitHep.key, vSide, l2, V.vitHep.color, goingRadius(V.vitHep.r, hepGone), left(hepGone) * vit, { groups: ['bitelo-zainak'] });
      pts[`bitelo-zainak-hep${n}`] = mid(l2, 0.5);
      // Hepatocardiac channel: right → hepatic segment of the IVC; left (the left vitelline's proximal part) goes.
      const l3 = L(V.hc);
      const hcGone = R ? 0 : clamp01(pose.lProx);
      const ivc = R && nm.hep > 0.5;
      push(V.hc.key, ivc ? 'kabaren-gibel-segmentua' : R ? 'eskuineko-hodi-hepatokardiakoa' : 'ezkerreko-hodi-hepatokardiakoa', l3, VC.vit,goingRadius(V.hc.r * (R ? 1 + 0.3 * pose.dv : 1), hcGone), left(hcGone) * vit, {
        groups: R ? ['hodi-hepatokardiakoak', 'eskuineko-hodi-hepatokardiakoa', 'kabaren-gibel-segmentua', 'beheko-kaba-zaina', 'bitelo-zainak'] : ['hodi-hepatokardiakoak', 'ezkerreko-hodi-hepatokardiakoa', 'ezkerreko-zain-bitelinoa', 'bitelo-zainak'],
      });
      ghostOf(V.hc.key, l3, V.hc.r, hcGone, 'ezkerreko-hodi-hepatokardiakoa', ['hodi-hepatokardiakoak', 'ezkerreko-zain-bitelinoa']);
      pts[R ? 'eskuineko-hodi-hepatokardiakoa' : 'ezkerreko-hodi-hepatokardiakoa'] = mid(l3, 0.45);
      if (R) pts['kabaren-gibel-segmentua'] = mid(l3, pose.dv > 0.5 ? 0.35 : 0.45);
      // From where the ductus venosus joins it up to the horn (the umbilical blood's way in).
      if (R) lines['hcUpR'] = [at(J.hc1(-1), pose.dv), ...l3.slice(6)];
    }

    // ———— umbilical ————
    const umb = clamp01(pose.umb);
    if (umb > 0.01) {
      const whole = R ? clamp01(pose.umbR) : 0;
      const prox = clamp01(pose.umbProx);
      const teres = R ? 0 : clamp01(pose.teres);
      const lig = (c: string) => mixHex(c, VC.ligament, teres);
      const l0 = L(V.umbDist);
      push(V.umbDist.key, teres > 0.5 ? 'gibeleko-lotailu-borobila' : uSide, l0, lig(V.umbDist.color), (u: number) => goingRadius(V.umbDist.r, whole)(u) * lerp(1, 0.45, teres), left(whole) * umb, {
        groups: R ? ['zilbor-zainak', uSide] : ['zilbor-zainak', uSide, 'gibeleko-lotailu-borobila'],
        tissue: teres > 0.5 ? 'tendon' : 'vessel',
      });
      ghostOf(V.umbDist.key, l0, V.umbDist.r, whole, uSide, ['zilbor-zainak']);
      pts[`zilbor-zainak${n}`] = mid(l0, 0.55);
      if (!R) pts['gibeleko-lotailu-borobila'] = mid(l0, 0.6);
      const l1 = L(V.umbLiver);
      // Beside the liver: on the right it goes with the whole vein; on the left the stretch past the ductus venosus empties into the liver plexus and goes.
      const g1 = R ? whole : clamp01(pose.dv0);
      push(V.umbLiver.key, uSide, l1, V.umbLiver.color, goingRadius(V.umbLiver.r, g1), left(g1) * umb, { groups: ['zilbor-zainak'] });
      ghostOf(V.umbLiver.key, l1, V.umbLiver.r, g1, uSide, ['zilbor-zainak']);
      pts[`zilbor-zainak-liver${n}`] = mid(l1, 0.4);
      const l2 = L(V.umbProx);
      push(V.umbProx.key, uSide, l2, V.umbProx.color, goingRadius(V.umbProx.r, prox), left(prox) * umb, { groups: ['zilbor-zainak'] });
      ghostOf(V.umbProx.key, l2, V.umbProx.r, prox, uSide, ['zilbor-zainak']);
      pts[`zilbor-zainak-prox${n}`] = mid(l2, 0.4);
      // Their contact with the liver's plexus: two short twigs each, as the sinusoids form.
      const tw = clamp01(pose.sinus) * left(g1);
      if (tw > 0.01)
        [[-1.5, 0.62, 0.42], [-0.95, 0.55, 0.3]].forEach(([y, x2, z2], k) => {
          const a = l1[Math.round((l1.length - 1) * (k ? 0.65 : 0.35))];
          const tl = curve3([a, mix3(a, X(s, [x2, y, z2]), 0.5), X(s, [x2 * (1 - 0.4 * pose.dv), y, z2])], 6);
          push(`umbTw${k}${n}`, uSide, tl, VC.umb, 0.04, tw, { groups: ['zilbor-zainak'] });
        });
    }

    // ———— subcardinal ————
    if (pose.sub > 0.01) {
      const g = clamp01(pose.sub);
      const ivc = R && nm.ren > 0.5;
      const lu = L(V.subUp);
      const gu = R ? 0 : clamp01(pose.lSubProx);
      push(V.subUp.key, ivc ? 'kabaren-giltzurrun-segmentua' : 'kardinal-azpiko-zainak', grown(lu, g), V.subUp.color, goingRadius(V.subUp.r * (R ? 1 + 0.3 * pose.dv : 1), gu), left(gu), { groups: R ? ['kardinal-azpiko-zainak', 'kabaren-giltzurrun-segmentua', 'beheko-kaba-zaina'] : ['kardinal-azpiko-zainak'] });
      ghostOf(V.subUp.key, lu, V.subUp.r, gu, 'kardinal-azpiko-zainak');
      const ll = L(V.subLow);
      const gonad = !R && nm.ren > 0.5;
      push(V.subLow.key, ivc ? 'kabaren-giltzurrun-segmentua' : gonad ? 'ezkerreko-zain-gonadala' : 'kardinal-azpiko-zainak', grown(ll, g), V.subLow.color, (u: number) => V.subLow.r * (R ? 1 + 0.3 * pose.dv : lerp(1, 0.6, pose.dv * u)), 1, {
        groups: R ? ['kardinal-azpiko-zainak', 'kabaren-giltzurrun-segmentua', 'beheko-kaba-zaina'] : ['kardinal-azpiko-zainak', 'ezkerreko-zain-gonadala'],
      });
      pts[`kardinal-azpiko-zainak${n}`] = mid(lu, 0.5);
      if (R) pts['kabaren-giltzurrun-segmentua'] = mid(ll, 0.35);
      else pts['ezkerreko-zain-gonadala'] = mid(ll, 0.6);
    }

    // ———— sacrocardinal ————
    if (pose.sacro > 0.01) {
      const g = clamp01(pose.sacro);
      const ivc = nm.sac > 0.5;
      const lp = L(V.sacroProx);
      const gp = R ? 0 : clamp01(pose.lSacroProx);
      push(V.sacroProx.key, R && ivc ? 'kabaren-segmentu-sakrokardinala' : 'zain-sakrokardinalak', grown(lp, g), V.sacroProx.color, goingRadius(V.sacroProx.r * (R ? 1 + 0.3 * pose.dv : 1), gp), left(gp), { groups: R ? ['zain-sakrokardinalak', 'kabaren-segmentu-sakrokardinala', 'beheko-kaba-zaina'] : ['zain-sakrokardinalak'] });
      ghostOf(V.sacroProx.key, lp, V.sacroProx.r, gp, 'zain-sakrokardinalak');
      const ld = L(V.sacroDist);
      const ilId = R ? 'eskuineko-zain-iliako-primitiboa' : 'ezkerreko-zain-iliako-primitiboa';
      push(V.sacroDist.key, ivc ? ilId : 'zain-sakrokardinalak', grown(ld, g), V.sacroDist.color, V.sacroDist.r, 1, { groups: ['zain-sakrokardinalak', ilId, 'zain-iliako-primitiboak'] });
      pts[`zain-sakrokardinalak${n}`] = mid(ld, 0.35);
      if (R) pts['kabaren-segmentu-sakrokardinala'] = mid(lp, 0.5);
      pts[ilId] = mid(ld, 0.5);
      if (pose.iliacs > 0.01) {
        const b = iliacBranches(s);
        const le = Lc(`ilExt${n}`, b.ext, 'v', 8);
        const li = Lc(`ilInt${n}`, b.int, 'v', 8);
        push(`ilExt${n}`, 'kanpoko-zain-iliakoak', grown(le, pose.iliacs), VC.sacro, 0.08, 1);
        push(`ilInt${n}`, 'barneko-zain-iliakoak', grown(li, pose.iliacs), VC.sacro, 0.07, 1);
        pts[`kanpoko-zain-iliakoak${n}`] = mid(le, 0.7);
        pts[`barneko-zain-iliakoak${n}`] = mid(li, 0.7);
      }
    }

    // ———— intercostal veins ————
    if (pose.intercostal > 0.01) {
      const ic = clamp01(pose.intercostal);
      for (let k = 1; k <= 11; k++) {
        if (!R && k <= 3) continue;
        const l = intercostal(s, k, pose.dc);
        lines[`ic${k}${n}`] = l;
        const into = R ? (k <= 3 ? 'lehen-saihets-arteko-enborra' : 'azigos-zaina') : k <= 8 ? 'hemiazigos-laguntzailea' : 'hemiazigos-zaina';
        push(`ic${k}${n}`, 'saihets-arteko-zainak', grown(l, clamp01(ic * 1.6 - (k % 4) * 0.12)), VC.intercostal, 0.045, 1, { groups: ['saihets-arteko-zainak', into] });
        if (k === 6) pts[`saihets-arteko-zainak${n}`] = l[3];
      }
    }
  }

  // ———— crossings and single vessels ————
  if (pose.acAn > 0.01) {
    const l = Lc('acAn', CROSS.ac, 'c');
    push('acAn', nm.svc > 0.5 ? 'ezkerreko-zain-brakiozefalikoa' : 'aurreko-kardinalen-anastomosia', grown(l, pose.acAn), VC.ant, 0.11, 1, { groups: ['aurreko-kardinalen-anastomosia', 'ezkerreko-zain-brakiozefalikoa', 'zain-brakiozefalikoak', 'anastomosiak'] });
    pts['ezkerreko-zain-brakiozefalikoa'] = mid(l, 0.4);
    pts['aurreko-kardinalen-anastomosia'] = mid(l, 0.5);
  }
  if (pose.supraAn > 0.01) {
    const l = Lc('supAnLow', CROSS.supLow, 'c', 10);
    push('supAnLow', 'kardinal-gaineko-anastomosia', grown(l, pose.supraAn), VC.supra, 0.085, 1, { groups: ['kardinal-gaineko-anastomosia', 'hemiazigos-zaina', 'anastomosiak'] });
    pts['kardinal-gaineko-anastomosia'] = mid(l, 0.45);
  }
  if (pose.accAn > 0.01) {
    const l = Lc('supAnUp', CROSS.supUp, 'c', 10);
    push('supAnUp', 'kardinal-gaineko-anastomosia', grown(l, pose.accAn), VC.supra, 0.08, 1, { groups: ['kardinal-gaineko-anastomosia', 'hemiazigos-laguntzailea', 'anastomosiak'] });
    pts['kardinal-gaineko-anastomosia-goi'] = mid(l, 0.45);
  }
  if (pose.intercostal > 0.01) {
    const l = Lc('trunk3', CROSS.trunk3, 'c', 10);
    push('trunk3', 'lehen-saihets-arteko-enborra', grown(l, pose.intercostal), VC.intercostal, 0.06, 1, { groups: ['saihets-arteko-zainak'] });
    pts['lehen-saihets-arteko-enborra'] = mid(l, 0.3);
    const lu = Lc('lumbar', CROSS.lumbar, 'c', 10);
    push('lumbar', 'zain-lunbarra', grown(lu, pose.intercostal), VC.supra, 0.06, 1);
    pts['zain-lunbarra'] = mid(lu, 0.35);
  }
  if (pose.subAn > 0.01) {
    const l = Lc('subAn', CROSS.sub, 'v', 10);
    const named = nm.ren > 0.5;
    push('subAn', named ? 'ezkerreko-giltzurrun-zaina' : 'kardinal-azpiko-anastomosia', grown(l, pose.subAn), VC.sub, 0.1, 1, { groups: ['kardinal-azpiko-anastomosia', 'ezkerreko-giltzurrun-zaina', 'anastomosiak'] });
    pts['kardinal-azpiko-anastomosia'] = mid(l, 0.5);
    pts['ezkerreko-giltzurrun-zaina'] = mid(l, 0.3);
  }
  if (pose.sub > 0.01 && (o.kidneys ?? 0) > 0.01) {
    const g = clamp01(pose.sub);
    const lL = Lc('renalL', CROSS.renalL, 'v', 6);
    const lR = Lc('renalR', CROSS.renalR, 'v', 6);
    push('renalL', 'ezkerreko-giltzurrun-zaina', grown(lL, g), VC.sub, 0.085, 1, { groups: ['ezkerreko-giltzurrun-zaina'] });
    push('renalR', undefined, grown(lR, g), VC.sub, 0.08, 1);
  }
  if (pose.sacroAn > 0.01) {
    const l = Lc('sacroAn', CROSS.sacro, 'v', 10);
    push('sacroAn', nm.sac > 0.5 ? 'ezkerreko-zain-iliako-primitiboa' : 'sakrokardinal-anastomosia', grown(l, pose.sacroAn), VC.sacro, 0.1, 1, { groups: ['sakrokardinal-anastomosia', 'ezkerreko-zain-iliako-primitiboa', 'zain-iliako-primitiboak', 'anastomosiak'] });
    pts['sakrokardinal-anastomosia'] = mid(l, 0.5);
  }
  if (pose.hepSub > 0.01) {
    const l = Lc('hepSub', CROSS.hepSub, 'v', 10);
    push('hepSub', nm.ren > 0.5 ? 'kabaren-giltzurrun-segmentua' : 'kardinal-azpiko-zainak', grown([...l].reverse(), pose.hepSub).reverse(), VC.sub, 0.11 * (1 + 0.3 * pose.dv), 1, { groups: ['kardinal-azpiko-zainak', 'kabaren-giltzurrun-segmentua', 'beheko-kaba-zaina'] });
    pts['hepSub'] = mid(l, 0.5);
  }
  if (pose.iliacs > 0.01) {
    const l = Lc('lowLumbar', CROSS.lowLumbar, 'v', 6);
    push('lowLumbar', 'beheko-zain-lunbarrak', grown(l, pose.iliacs), VC.sub, 0.045, 1);
    pts['beheko-zain-lunbarrak'] = mid(l, 0.3);
  }
  // Vitelline plexus round the duodenum (three anastomoses), the splenic and superior mesenteric veins.
  if (pose.plexus > 0.01 && pose.vit > 0.01) {
    const g = clamp01(pose.plexus);
    const rem = clamp01(pose.remodel);
    const lu = Lc('pUp', CROSS.pUp, 'v', 10);
    const ll = Lc('pLow', CROSS.pLow, 'v', 10);
    const lm = Lc('pMid', CROSS.pMid, 'v', 10);
    push('pUp', 'zain-plexu-periduodenala', grown(lu, g), VC.vit, goingRadius(0.07, rem), left(rem), { groups: ['zain-plexu-periduodenala', 'bitelo-zainak', 'anastomosiak'] });
    push('pLow', 'zain-plexu-periduodenala', grown(ll, g), VC.vit, goingRadius(0.07, rem), left(rem), { groups: ['zain-plexu-periduodenala', 'bitelo-zainak', 'anastomosiak'] });
    ghostOf('pUp', lu, 0.07, rem);
    ghostOf('pLow', ll, 0.07, rem);
    const splenic = nm.portal > 0.5;
    push('pMid', splenic ? 'zain-esplenikoa' : 'zain-plexu-periduodenala', grown(lm, g), VC.vit, 0.075 * (1 + 0.25 * pose.portal), 1, { groups: ['zain-plexu-periduodenala', 'zain-esplenikoa', 'bitelo-zainak', 'anastomosiak'] });
    pts['zain-plexu-periduodenala'] = mid(lu, 0.5);
    pts['zain-plexu-periduodenala-low'] = mid(ll, 0.5);
    pts['zain-esplenikoa'] = mid(lm, 0.35);
  }
  if (pose.portal > 0.01) {
    const ls = Lc('spleenV', CROSS.spleen, 'v', 8);
    push('spleenV', 'zain-esplenikoa', grown(ls, clamp01(pose.portal * 2 - 1)), VC.vit, 0.075, 1, { groups: ['zain-esplenikoa'] });
    const lm = Lc('smv', CROSS.smv, 'v', 10);
    push('smv', 'goiko-zain-mesenterikoa', grown(lm, clamp01(pose.portal * 2)), VC.vit, (u: number) => lerp(0.09, 0.06, u), 1);
    pts['goiko-zain-mesenterikoa'] = mid(lm, 0.55);
    // Spleen.
    const sp = at(CROSS.spleen[2], pose.dv);
    items.push({ key: 'spleen', id: 'barea', ...blobParts({ center: add(sp, [0.22, 0.05, -0.08]), radii: [0.2, 0.32, 0.16], rings: 10, sides: 14 }), color: VC.spleen, deep: darker(VC.spleen), tissue: 'mesenchyme', show: clamp01(pose.portal * 2 - 1), opacity: (1 - 0.6 * faint) * (lit('barea') ? 1 : 1 - 0.6 * (dim?.k ?? 0)) });
    pts['barea'] = add(sp, [0.3, 0.1, -0.05]);
  }
  if (pose.hepV > 0.01) {
    const a = Lc('hepVR', CROSS.hepVR, 'v', 6);
    const b = Lc('hepVL', CROSS.hepVL, 'v', 8);
    push('hepVR', 'zain-hepatikoak', grown(a, pose.hepV), VC.vit, 0.06, 1);
    push('hepVL', 'zain-hepatikoak', grown(b, pose.hepV), VC.vit, 0.06, 1);
    pts['zain-hepatikoak'] = mid(b, 0.4);
  }
  // Ductus venosus, on the liver's surface: then the ligamentum venosum.
  if (pose.dv0 > 0.01) {
    const l = Lc('dv', CROSS.dv, 'v', 16);
    const lg = clamp01(pose.venosum);
    push('dv', lg > 0.5 ? 'gibeleko-lotailu-benosoa' : 'hodi-benosoa', grown(l, pose.dv0), mixHex(VC.umb, VC.ligament, lg), (u: number) => lerp(0.1, 0.045, lg) * (1 - 0.15 * Math.sin(Math.PI * u) * lg), 1, { groups: ['hodi-benosoa', 'gibeleko-lotailu-benosoa'], tissue: lg > 0.5 ? 'tendon' : 'vessel' });
    pts['hodi-benosoa'] = mid(l, 0.5);
    pts['gibeleko-lotailu-benosoa'] = mid(l, 0.5);
  }

  // ———— the liver's own veins: the hepatic sinusoids ————
  const liver = clamp01(pose.liver);
  const LC = mix3([0, -1.6, 0.35], [-0.1, -1.45, 0.3], pose.dv);
  const LR: V3 = [lerp(1.15, 1.5, pose.dv), lerp(0.8, 0.75, pose.dv), lerp(0.78, 0.8, pose.dv)];
  if (pose.sinus > 0.01 && pose.vit > 0.01) {
    const net = sinusoidNet(LC, LR);
    const y0 = LC[1] - LR[1];
    net.forEach((l, k) => {
      const delay = clamp01((l[0][1] - y0) / (2 * LR[1])) * 0.6;
      push(`sinusoid${k}`, 'gibeleko-sinusoideak', grown(l, clamp01((pose.sinus - delay) * 2.5)), mixHex(VC.vit, '#ffffff', 0.2), 0.028, 1, { groups: ['gibeleko-sinusoideak', 'bitelo-zainak'], outline: false });
    });
    pts['gibeleko-sinusoideak'] = add(LC, [0.35 * LR[0], 0.25 * LR[1], 0.2]);
  }

  // The two cavae, named where their adult trunk is clearest.
  if (pts['goiko-kabaren-hasierako-atala']) pts['goiko-kaba-zaina'] = pts['goiko-kabaren-hasierako-atala'];
  const ivcAt = pts['kabaren-giltzurrun-segmentua'] ?? pts['kabaren-gibel-segmentua'];
  if (ivcAt) pts['beheko-kaba-zaina'] = ivcAt;

  // ———— context ————
  if (liver > 0.01) {
    // The bud (endoderm, yellow) grows out of the foregut into the septum transversum, then the liver round it.
    const bud = ss(0, 0.3, liver);
    const big = ss(0.2, 1, liver);
    const budC = mix3([0.05, -2.3, 0.45], [0.02, -2.05, 0.5], bud);
    if (big < 0.98) items.push({ key: 'bud', id: 'gibel-hastapena', ...blobParts({ center: budC, radii: [0.18 * bud + 0.05, 0.26 * bud + 0.05, 0.16 * bud + 0.05], rings: 10, sides: 14 }), color: VC.gut, deep: VC.gutDeep, tissue: 'epithelium', show: bud * (1 - big), opacity: 0.9 });
    pts['gibel-hastapena'] = add(budC, [0.12, 0.08, 0.1]);
    if (big > 0.01) {
      const op = (o.liverOp ?? 0.28) * (1 - 0.6 * faint);
      items.push({ key: 'liver', id: 'gibela', ...blobParts({ center: LC, radii: [LR[0] * lerp(0.35, 1, big), LR[1] * lerp(0.35, 1, big), LR[2] * lerp(0.4, 1, big)], rings: 18, sides: 26 }), color: VC.liver, deep: VC.liverDeep, tissue: 'epithelium', opacity: op * big * (lit('gibela') ? 1 : 1 - 0.5 * (dim?.k ?? 0)), outline: false });
      pts['gibela'] = add(LC, [-0.7 * LR[0], 0.35 * LR[1], 0.45 * LR[2]]);
    }
  }
  const sept = o.septum ?? 0;
  if (sept > 0.01) {
    const c: V3 = [0, -1.55, 0.3];
    items.push({ key: 'septum', id: 'septum-transversum', ...blobParts({ center: c, radii: [1.65, 0.55, 1.05], rings: 14, sides: 24 }), color: VC.septum, deep: T.septumDeep, tissue: 'mesenchyme', opacity: 0.22 * sept, outline: false });
    pts['septum-transversum'] = add(c, [-1.3, 0.25, 0.4]);
  }
  const gut = o.gut ?? 0;
  if (gut > 0.01) {
    const g = lineOf(DUODENUM, pose.dv, 16);
    items.push({ key: 'duodenum', id: 'duodenoa', ...tubeParts(g, { radius: () => 0.17, ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true }), color: VC.gut, deep: VC.gutDeep, tissue: 'epithelium', opacity: 0.55 * gut * (1 - 0.6 * faint) * (lit('duodenoa') ? 1 : 1 - 0.6 * (dim?.k ?? 0)), outline: false });
    pts['duodenoa'] = g[9];
  }
  const kid = o.kidneys ?? 0;
  if (kid > 0.01) {
    for (const s of [-1, 1] as Side[]) {
      const c: V3 = X(s, [lerp(0.95, 0.95, pose.dv), -3.0, -0.8]);
      items.push({ key: `kidney${s}`, id: 'giltzurruna', ...blobParts({ center: c, radii: [0.3, lerp(0.48, 0.58, pose.dv), 0.26], rings: 12, sides: 16 }), color: VC.kidney, deep: darker(VC.kidney), tissue: 'epithelium', opacity: 0.55 * kid * (1 - 0.6 * faint), outline: false, quiet: true });
      if (s > 0) pts['giltzurruna'] = add(c, [0.18, 0.2, 0.1]);
      const gc: V3 = X(s, [0.75, lerp(-4.3, -4.45, pose.dv), lerp(-0.45, -0.3, pose.dv)]);
      items.push({ key: `gonad${s}`, id: 'gonadak', ...blobParts({ center: gc, radii: [0.14, 0.22, 0.12], rings: 8, sides: 12 }), color: VC.gonad, deep: darker(VC.gonad), tissue: 'epithelium', opacity: 0.6 * kid * (1 - 0.6 * faint), outline: false, quiet: true });
      if (s > 0) pts['gonadak'] = add(gc, [0.12, -0.05, 0.05]);
    }
  }
  const ribs = o.ribs ?? 0;
  if (ribs > 0.01) {
    for (let k = 1; k <= 12; k++) {
      const y = lerp(spaceY(k) + 0.2 - 0.6, spaceY(k) + 0.2, pose.dc);
      for (const s of [-1, 1] as Side[]) {
        const l = curve3([[s * 0.22, y + 0.02, -1.3], [s * 0.9, y - 0.04, -1.32], [s * 1.6, y - 0.12, -1.0], [s * 2.0, y - 0.22, -0.45]], 10);
        items.push({ key: `rib${k}${s}`, id: 'saihetsak', ...tubeParts(l, { radius: () => 0.045, ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }), color: VC.rib, deep: '#6f7782', tissue: 'bone', opacity: 0.3 * ribs * (1 - 0.6 * faint), outline: false, quiet: true });
      }
    }
    pts['saihetsak'] = [1.9, lerp(spaceY(6) - 0.4, spaceY(6) + 0.2, pose.dc) - 0.2, -0.5];
  }
  const body = o.body ?? 0;
  if (body > 0.01) {
    // Neck to tail, widest at the chest and the belly; the yolk stalk and the cord leave through its front wall.
    const axis = curve3([[0, 3.6, -0.45], [0, 1.2, -0.3], [0, -2.4, -0.15], [0, -5.6, -0.25], [0, -7.6, -0.5]], 34);
    const r = (u: number) => 0.85 + 1.25 * Math.sin(Math.PI * Math.min(1, u * 1.08)) ** 0.55 - 0.25 * ss(0.75, 1, u);
    items.push({ key: 'body', ...tubeParts(axis, { radius: r, ref: [1, 0, 0], sides: 36, capStart: true, capEnd: true }), color: SKIN, deep: SKIN_DEEP, tissue: 'skin', opacity: 0.075 * body * (1 - 0.6 * faint), outline: false, quiet: true });
  }
  const limbs = o.limbs ?? 0;
  if (limbs > 0.01) {
    for (const s of [-1, 1] as Side[]) {
      const up: V3 = X(s, [1.95, lerp(1.85, 1.95, pose.dc), -0.4]);
      const low: V3 = X(s, [1.75, -6.45, -0.25]);
      items.push({ key: `limbU${s}`, id: 'goiko-gorputz-adarraren-hasikina', ...blobParts({ center: up, radii: [0.5, 0.34, 0.26], rings: 12, sides: 18 }), color: SKIN, deep: SKIN_DEEP, tissue: 'skin', opacity: 0.85 * limbs * (1 - 0.6 * faint), outline: false, quiet: true });
      items.push({ key: `limbL${s}`, id: 'beheko-gorputz-adarraren-hasikina', ...blobParts({ center: low, radii: [0.46, 0.34, 0.26], rings: 12, sides: 18 }), color: SKIN, deep: SKIN_DEEP, tissue: 'skin', opacity: 0.85 * limbs * (1 - 0.6 * faint), outline: false, quiet: true });
      if (s > 0) {
        pts['goiko-gorputz-adarraren-hasikina'] = add(up, [0.2, 0.15, 0.1]);
        pts['beheko-gorputz-adarraren-hasikina'] = add(low, [0.2, -0.1, 0.1]);
      }
    }
  }
  const stalk = o.stalk ?? 0;
  if (stalk > 0.01) {
    const st = curve3([[0, -4.75, 1.05], [0, -5.2, 1.6], [0, -5.7, 2.3]], 10);
    items.push({ key: 'stalk', id: 'hodi-onfalomesenterikoa', ...tubeParts(st, { radius: () => 0.07, ref: [1, 0, 0], sides: 10, capStart: true, capEnd: true }), color: VC.yolk, deep: '#a7801f', tissue: 'epithelium', opacity: 0.7 * stalk * (1 - pose.rDist * 0.7) });
    const ys: V3 = [0, -6.2, 2.85];
    items.push({ key: 'yolk', id: 'bitelo-zaku-sekundarioa', ...blobParts({ center: ys, radii: [0.55, 0.55, 0.55], rings: 12, sides: 16 }), color: VC.yolk, deep: '#a7801f', tissue: 'epithelium', opacity: 0.55 * stalk * (1 - pose.rDist * 0.7), outline: false });
    pts['bitelo-zaku-sekundarioa'] = add(ys, [0.3, 0.32, 0.2]);
    pts['hodi-onfalomesenterikoa'] = st[6];
  }

  // ———— topic 10's heart ————
  const heart = o.heart ?? 0;
  if (heart > 0.01) {
    const hm = heartItems(pose, o.heartGlass ?? 0);
    for (const it of hm.items) items.push({ ...it, show: (it.show ?? 1) * heart, opacity: (it.opacity ?? 1) * (dim && dim.k > 0 && !lit(it.id ?? '', it.groups) ? 1 - 0.6 * dim.k : 1) * (1 - 0.6 * faint) });
    // The model's own points win (the heart's carry topic 10's vein names at other places).
    for (const [k, v] of Object.entries(hm.pts)) if (!(k in pts)) pts[k] = v;
    pts['eskuineko-aurikula'] = hm.pts['eskuineko-sinu-luzapena'];
    pts['atal-lisoa'] = hm.pts['eskuineko-sinu-luzapena'];
    pts['bihotza'] = hm.pts['atal-bentrikularra'];
  }
  pts['zain-sinua-R'] = HORN.R;
  pts['zain-sinua-L'] = HORN.L;
  return { items, pts, lines };
}

/**
 * The hepatic sinusoids: a net of small vessels inside the liver, from the vitelline veins' way in at the
 * liver's lower edge, through three layers of branching, to their way out at its top (the hepatocardiac
 * channels). They grow in from below, layer by layer.
 */
function sinusoidNet(c: V3, r: V3): V3[][] {
  const out: V3[][] = [];
  const P = (u: number, v: number, w: number): V3 => [c[0] + u * r[0], c[1] + v * r[1], c[2] + w * r[2]];
  const jit = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5;
  const layers = [-0.55, -0.12, 0.32].map((v, L) => [-0.62, -0.31, 0, 0.31, 0.62].map((u, i) => P(u + 0.08 * jit(i, L), v + 0.1 * jit(i + 3, L), 0.35 * jit(i + 7, L) + 0.15)));
  const inlet = [P(-0.38, -0.92, 0.1), P(0.38, -0.92, 0.1)];
  const outlet = [P(-0.42, 0.85, -0.25), P(0.42, 0.85, -0.25)];
  const bend = (a: V3, b: V3, i: number): V3[] => {
    const m = mix3(a, b, 0.5);
    return curve3([a, add(m, [0.07 * jit(i, 1), 0.05 * jit(i, 2), 0.07 * jit(i, 3)]), b], 7);
  };
  let i = 0;
  // In from below: each inlet fans to the three nearest nodes of the first layer.
  inlet.forEach((p, s) => [0, 1, 2].forEach((k) => out.push(bend(p, layers[0][s ? 4 - k : k], i++))));
  // Up through the layers, each node to the two nearest above, and side links within a layer.
  for (let L = 0; L < 2; L++)
    layers[L].forEach((p, k) => {
      out.push(bend(p, layers[L + 1][k], i++));
      if (k < 4) out.push(bend(p, layers[L + 1][k + 1], i++));
    });
  layers.forEach((row) => row.forEach((p, k) => k < 4 && k % 2 === 0 && out.push(bend(p, row[k + 1], i++))));
  // Out at the top: the nodes of the last layer converge on the two outlets.
  layers[2].forEach((p, k) => out.push(bend(p, outlet[k < 2 ? 0 : k > 2 ? 1 : 0], i++)));
  out.push(bend(layers[2][2], outlet[1], i++));
  return out;
}

// ———————————————————————————— blood ————————————————————————————

type Cells = { cells: Float32Array; gates: Float32Array };
const cellSets = new Map<string, Cells>();
/** n cells along a route; `pick` keeps some of them (red or blue): together the two sets fill the route. */
function cellSet(n: number, pick: (i: number) => boolean): Cells {
  const ids = Array.from({ length: n }, (_, i) => i).filter(pick);
  const cells = new Float32Array(ids.length * 4);
  const gates = new Float32Array(ids.length);
  ids.forEach((i, k) => {
    cells.set([i / n, Math.sin(i * 12.9) * 0.03, Math.cos(i * 7.3) * 0.025, Math.sin(i * 3.1) * 0.03], k * 4);
    gates[k] = ((i * 0.618034) % 1) * 0.85;
  });
  return { cells, gates };
}
/** Whether cell i of n is red at a saturation (the share of red cells is the share the notes give). */
const isRed = (i: number, sat: number) => ((i * 0.7548776662) % 1) < sat;
const CELL_MESH = () => cachedBlob({ center: [0, 0, 0], radii: [0.06, 0.042, 0.06], rings: 6, sides: 8 });

/**
 * Blood along a route, as red (oxygenated) and blue (poorly oxygenated) cells side by side (topic 10's rule:
 * never a purple "mix"): `sat` is the share of red cells, so 0.8 reads as mostly red, 0.58 as a little over half.
 */
export function bloodCells(key: string, route: readonly V3[], phase: number, grow: number, sat: number, n = 12): Item3[] {
  if (grow <= 0.01 || route.length < 2) return [];
  const r = vesselRouteOf(route);
  const s = Math.round(sat * 20) / 20;
  const out: Item3[] = [];
  for (const red of [true, false]) {
    const ck = `${n}:${s}:${red}`;
    let set = cellSets.get(ck);
    if (!set) {
      set = cellSet(n, (i) => isRed(i, s) === red);
      cellSets.set(ck, set);
    }
    if (!set.gates.length) continue;
    out.push({ key: `flow-${key}-${red ? 'o' : 'd'}`, mesh: CELL_MESH(), color: red ? VC.o2 : VC.deo2, deep: red ? VC.o2Deep : VC.deo2Deep, tissue: 'skin' as Tissue3, stream: { route: r, phase: phase / Math.max(0.5, routeLength(r)), grow, ...set } });
  }
  return out;
}

const DROP_MESH = () => cachedBlob({ center: [0, 0, 0], radii: [0.038, 0.038, 0.038], rings: 6, sides: 8 });
/** One-colour droplets along a route (the lymph: clear fluid, drawn as small pale-green drops). */
export function tintCells(key: string, route: readonly V3[], phase: number, grow: number, color: string, deep: string, n = 10): Item3[] {
  if (grow <= 0.01 || route.length < 2) return [];
  const r = vesselRouteOf(route);
  const ck = `${n}:all`;
  let set = cellSets.get(ck);
  if (!set) {
    set = cellSet(n, () => true);
    cellSets.set(ck, set);
  }
  return [{ key: `drop-${key}`, mesh: DROP_MESH(), color, deep, tissue: 'skin' as Tissue3, stream: { route: r, phase: phase / Math.max(0.5, routeLength(r)), grow, ...set } }];
}

/** Joins centrelines into one route (dropping each repeated junction point). */
export const route = (...ls: (readonly V3[] | undefined)[]): V3[] => ls.filter((l): l is V3[] => !!l && l.length > 0).reduce<V3[]>((acc, l) => (acc.length ? [...acc, ...l.slice(1)] : [...l]), []);
/** A centreline run backwards (blood towards the heart along a vessel drawn from the heart out). */
export const rev = (l: readonly V3[] | undefined): V3[] => (l ? [...l].reverse() : []);
