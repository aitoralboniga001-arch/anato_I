import { add, deg, mix3, type V3 } from '@/lib/three-d/math';
import { grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedMerge, cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { K } from '@/components/scenes/week11/common';
import { perfCount } from '@/lib/perf';
import { T } from './common';
import { blobParts, mixHex, tubeParts } from './model3d';

/**
 * The right atrium of stage 10 (notes 3.4 p10–p23) as a 3D chamber opened from the front, as the notes
 * draw it: we look in at its posterior wall, the septal (medial) wall on the embryo's left, the lateral
 * wall on its right. What the 2D drawing had to fold flat (the septum seen edge-on, the lateral wall
 * squashed to a rim) is here a room the camera can turn in: to see the septum it turns to the embryo's
 * left wall while the lateral wall goes clear.
 *
 * Axes as the heart model: x = the embryo's left, y = cranial, z = ventral (towards the viewer at yaw 0).
 * A wall point is named by azimuth φ (0 front, 90 the septum, 180 back, 270 the lateral wall) and polar
 * angle θ (0 the roof, 180 the floor).
 */

export interface AtriumState {
  /** Venous valves grow on the rims of the sinoatrial orifice. */
  valves: number;
  /** The two valves fused at the top: septum spurium, up to the roof. */
  spur: number;
  /** The left valve and the spurium join the septum secundum. */
  toSeptum: number;
  secundum: number;
  primum: number;
  /** The right valve's upper part vanishes. */
  rightTopGone: number;
  /** Its lower part becomes the valves of the IVC and of the coronary sinus. */
  lowSplit: number;
  /** The orifice (and the sinus seen through it) while it is one. */
  orifice: number;
  /** Openings of the IVC and the coronary sinus; of the SVC. */
  holes: number;
  svc: number;
  /** The sinus taken into the back wall: the smooth part spreads. */
  incorp: number;
  pect: number;
  crista: number;
  node: number;
  /** The lateral wall goes clear (seeing the septum from the right). */
  lateralGlass: number;
}

export const A0: AtriumState = { valves: 0, spur: 0, toSeptum: 0, secundum: 0, primum: 0, rightTopGone: 0, lowSplit: 0, orifice: 1, holes: 0, svc: 0, incorp: 0, pect: 0, crista: 0, node: 0, lateralGlass: 0 };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const R: V3 = [1.15, 1.35, 0.95];
const C: V3 = [0, 0, 0];

/** A point of the chamber wall (k = 1 on it, < 1 a little inside). */
export function wall(phi: number, th: number, k = 1): V3 {
  const p = deg(phi);
  const t = deg(th);
  return [R[0] * Math.sin(t) * Math.sin(p) * k, R[1] * Math.cos(t) * k, R[2] * Math.sin(t) * Math.cos(p) * k];
}

/** A wall sector between two azimuths, roof to floor, facing the inside. */
const sector = (phi0: number, phi1: number, k = 1, th0 = 1, th1 = 179, coarse = 1) =>
  grid(Math.max(4, Math.round(Math.abs(phi1 - phi0) / 4 / coarse)), Math.round(40 / coarse), (u, v) => wall(lerp(phi0, phi1, u), lerp(th0, th1, v), k), C);

/** An oval patch on the wall round (φ0, θ0), half-extents in degrees; `e` < 1 squares it off. */
function patch(phi0: number, th0: number, ea: number, eb: number, k: number, e = 1): Mesh {
  return cachedMesh('atrium patch', [phi0, th0, ea, eb, k, e], () => grid(10, 36, (r, s) => {
    const a = s * Math.PI * 2;
    const c = Math.cos(a);
    const n = Math.sin(a);
    return wall(phi0 + ea * r * Math.sign(c) * Math.abs(c) ** e, th0 - eb * r * Math.sign(n) * Math.abs(n) ** e, k);
  }, C));
}

/** A ridge or fold along the wall through (φ, θ) points, `k` inside the wall. */
const along = (keys: readonly (readonly [number, number])[], k: number, n = 24): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * (keys.length - 1);
    const j = Math.min(keys.length - 2, Math.floor(x));
    const f = x - j;
    // Smooth through the keys (cosine blend between neighbours).
    const g = (1 - Math.cos(f * Math.PI)) / 2;
    out.push(wall(lerp(keys[j][0], keys[j + 1][0], g), lerp(keys[j][1], keys[j + 1][1], g), k));
  }
  return out;
};
const ridge = (path: V3[], r: number, taper = true) =>
  tubeParts(path, { radius: (u) => (taper ? r * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 0.6) : r), ref: [0, 0, 1], sides: 10, capStart: true, capEnd: true });

// The walls never change shape: built once.
type Part = { mesh: Mesh; hit: Mesh };
let walls: { septal: Part; back: Part; lateral: Part; rim: Part } | null = null;
function wallsOnce() {
  if (walls) return walls;
  const rimAt = (phi: number) => ridge(Array.from({ length: 31 }, (_, i) => wall(phi, lerp(2, 178, i / 30))), 0.05, false);
  // Each with a coarse copy for pointing and the SVG layer (projected again whenever the camera moves).
  const part = (phi0: number, phi1: number): Part => ({ mesh: sector(phi0, phi1), hit: sector(phi0, phi1, 1, 1, 179, 3) });
  const rims = [rimAt(65), rimAt(295)];
  walls = { septal: part(65, 125), back: part(125, 215), lateral: part(215, 295), rim: { mesh: merge(rims.map((r) => r.mesh)), hit: merge(rims.map((r) => r.hit)) } };
  return walls;
}

/** The sinoatrial orifice on the back wall: centre and half-extents (degrees). */
const O = { phi: 168, th: 92, eb: 26 };
const SVC = { phi: 174, th: 24, ea: 13, eb: 9 };
const IVC = { phi: 190, th: 152, ea: 15, eb: 10 };
const CS = { phi: 136, th: 140, ea: 7, eb: 5 };
/** The crista terminalis: the edge of the smooth part, roof to floor. */
const CRISTA: [number, number][] = [[210, 20], [214, 50], [216, 90], [214, 130], [208, 162]];

export interface AtriumModel {
  items: Item3[];
  pts: Record<string, V3>;
}

export function atriumModel(s: AtriumState): AtriumModel {
  perfCount('atriumModel');
  const W = wallsOnce();
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const late = s.incorp > 0.5;
  const wallId = late ? 'atal-trabekulatua' : 'hasierako-eskuineko-aurikula';
  const lat = 1 - 0.86 * s.lateralGlass;

  // The walls: septal (medial), back, lateral; the cut edge of the opened front.
  items.push({ key: 'septal', id: 'aurikula-arteko-trenkada', quiet: true, ...W.septal, color: mixHex(T.atrium, '#9a3f1c', 0.35), deep: T.atriumDeep, tissue: 'muscle' });
  items.push({ key: 'back', id: wallId, groups: ['eskuineko-aurikula'], ...W.back, color: T.atrium, deep: T.atriumDeep, tissue: 'muscle' });
  items.push({ key: 'lateral', id: wallId, groups: ['eskuineko-aurikula'], ...W.lateral, color: T.atrium, deep: T.atriumDeep, tissue: 'muscle', opacity: lat });
  // The cut edge of the opened front wall, in the paler colour of a cut surface.
  items.push({ key: 'rim', ...W.rim, color: '#f2a27e', deep: '#9a4a28', tissue: 'muscle', opacity: lat, outline: false });
  pts['hasierako-eskuineko-aurikula'] = wall(250, 112, 0.97);
  pts['atal-trabekulatua'] = wall(252, 76, 0.97);
  pts['eskuineko-aurikula'] = wall(240, 128, 0.97);
  pts['aurikula-arteko-trenkada'] = wall(92, 112, 0.97);

  // The auricle: a pouch at the upper front of the lateral wall.
  items.push({ key: 'auricle', id: 'belarritxoa', groups: ['atal-trabekulatua'], ...blobParts({ center: wall(282, 36, 1.02), radii: [0.4, 0.32, 0.34], rings: 14, sides: 20 }), color: T.atrium, deep: T.atriumDeep, tissue: 'muscle', opacity: lat });
  pts['belarritxoa'] = wall(282, 34, 1.12);

  // The smooth part (violet): at first only the sinus seen through the orifice; taken into the wall, it
  // spreads over the back wall up to the crista terminalis.
  const ea = lerp(lerp(13, 10.5, s.valves), 46, s.incorp);
  const eb = lerp(O.eb, 74, s.incorp);
  items.push({
    key: 'smooth',
    id: late ? 'atal-lisoa' : 'zain-sinua',
    groups: late ? ['eskuineko-sinu-luzapena', 'eskuineko-aurikula'] : ['eskuineko-sinu-luzapena'],
    mesh: patch(O.phi, O.th, ea, eb, 0.985, lerp(1, 0.55, s.incorp)),
    color: mixHex('#4a2a78', K.smoothRA, Math.max(s.incorp, 1 - s.orifice)),
    deep: K.smoothDeep,
    tissue: 'epithelium',
    outline: false,
  });
  pts[late ? 'atal-lisoa' : 'zain-sinua'] = wall(O.phi + 4, O.th + 6, 0.97);
  if (late) pts['zain-sinua'] = wall(O.phi + 4, O.th + 6, 0.97);
  // The sinus itself behind the orifice (seen when the room is turned round), until it is taken in.
  if (s.incorp < 0.98) items.push({ key: 'sinus', id: 'zain-sinua', ...blobParts({ center: wall(O.phi, O.th, 1.22), radii: [0.5, 0.62, 0.22], rings: 12, sides: 18 }), color: K.smoothRA, deep: K.smoothDeep, tissue: 'vessel', opacity: 1 - s.incorp });

  // The orifice's rim (while it is an orifice).
  const ea0 = lerp(13, 10.5, s.valves);
  const rim = (a0: number, a1: number, k: number, n = 20) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = deg(lerp(a0, a1, i / n));
      return wall(O.phi + ea0 * Math.cos(a), O.th - O.eb * Math.sin(a), k);
    });
  if (s.orifice > 0.02) {
    items.push({ key: 'sa-rim', id: 'zulo-sinoaurikularra', ...ridge(rim(0, 360, 0.975, 40), 0.03, false), color: '#1a0710', deep: '#000000', tissue: 'vessel', opacity: s.orifice });
    pts['zulo-sinoaurikularra'] = rim(-35, -35, 0.975, 1)[0];
  }

  // The venous valves on the rims: the right one on the lateral rim, the left one on the septal rim.
  if (s.valves > 0.01) {
    const vr = 0.06 * s.valves;
    const VALVE = { color: '#a78bfa', deep: '#5b3fb8' };
    if (s.rightTopGone < 0.99) items.push({ key: 'rv-top', id: 'eskuineko-zain-balbula', ...ridge(rim(8, 84, 0.955), vr), ...VALVE, tissue: 'epithelium', opacity: s.valves * (1 - s.rightTopGone) });
    if (s.lowSplit < 0.99) items.push({ key: 'rv-low', id: 'eskuineko-zain-balbula', ...ridge(rim(-84, 8, 0.955), vr), ...VALVE, tissue: 'epithelium', opacity: s.valves * (1 - s.lowSplit) });
    pts['eskuineko-zain-balbula'] = rim(-30, -30, 0.955, 1)[0];
    // The left valve and the spurium slide onto the septum (its posterior edge, φ ≈ 120) and merge there.
    const shift = -(O.phi - 120) * s.toSeptum;
    const lv = Array.from({ length: 21 }, (_, i) => {
      const a = deg(lerp(96, 264, i / 20));
      return wall(O.phi + shift + ea0 * Math.cos(a) * (1 - 0.6 * s.toSeptum), O.th - O.eb * Math.sin(a) * (1 + 0.3 * s.toSeptum), 0.955);
    });
    const fade = 1 - 0.75 * s.toSeptum;
    items.push({ key: 'lv', id: 'ezkerreko-zain-balbula', ...ridge(lv, vr), ...VALVE, tissue: 'epithelium', opacity: s.valves * fade });
    pts['ezkerreko-zain-balbula'] = lv[Math.round(lv.length * 0.62)];
    if (s.spur > 0.01) {
      const top = lerp(O.th - O.eb, 10, s.spur);
      const sp = along([[O.phi + shift, O.th - O.eb + 2], [O.phi + shift, (O.th - O.eb + top) / 2], [O.phi + shift * 1.05, top]], 0.955, 16);
      items.push({ key: 'spurium', id: 'septum-spurium', ...ridge(sp, 0.075 * s.valves, false), color: '#e9d5ff', deep: '#7c5fd6', tissue: 'epithelium', opacity: fade });
      pts['septum-spurium'] = sp[8];
    }
  }

  // The septum secundum (a thick crescent from the roof down the septum's back edge) and the septum
  // primum (a thin sheet from the roof), on the septal wall.
  // The septum primum: a curtain hanging from the roof, its free edge concave (lower at both ends).
  if (s.primum > 0.01) {
    const depth = (phi: number) => lerp(14, 50, s.primum) * (0.72 + 0.28 * ((phi - 88) / 24) ** 2);
    items.push({ key: 'primum', id: 'septum-primum', mesh: cachedMesh('atrium primum', [s.primum], () => grid(16, 10, (u, v) => { const phi = lerp(64, 112, u); return wall(phi, lerp(8, 8 + depth(phi), v), 0.982); }, C)), color: K.primum, deep: K.primumDeep, tissue: 'membrane', opacity: Math.min(1, s.primum * 2), outline: false });
    pts['septum-primum'] = wall(80, 8 + depth(80) * 0.55, 0.975);
  }
  // The septum secundum: a thick crescent from the roof down the septum's back edge, nearer the viewer
  // than the primum (on the right atrium's side), its free edge facing the middle of the septum.
  if (s.secundum > 0.01) {
    const keys: [number, number][] = [[62, 16], [90, 12], [112, 26], [118, 60], [116, 96], [110, 124]];
    const grown = lerp(0.35, 1, s.secundum);
    const at = (x: number): [number, number] => {
      const f = x * (keys.length - 1);
      const j = Math.min(keys.length - 2, Math.floor(f));
      const g = (1 - Math.cos((f - j) * Math.PI)) / 2;
      return [lerp(keys[j][0], keys[j + 1][0], g), lerp(keys[j][1], keys[j + 1][1], g)];
    };
    const width = lerp(6, 15, s.secundum);
    const band = (u: number, v: number, k: number) => {
      const [phi, th] = at(u * grown);
      const dx = 88 - phi;
      const dy = 70 - th;
      const l = Math.hypot(dx, dy) || 1;
      return wall(phi + (dx / l) * width * v, th + (dy / l) * width * v, k);
    };
    const op = Math.min(1, s.secundum * 2);
    items.push({ key: 'secundum', id: 'septum-secundum', mesh: cachedMesh('atrium secundum', [s.secundum], () => grid(30, 4, (u, v) => band(u, v, 0.958), C)), color: K.secundum, deep: K.secundumDeep, tissue: 'muscle', opacity: op });
    // Its thick free edge.
    items.push({ key: 'secundum-edge', id: 'septum-secundum', ...ridge(Array.from({ length: 31 }, (_, i) => band(i / 30, 1, 0.955)), 0.05, false), color: K.secundum, deep: K.secundumDeep, tissue: 'muscle', opacity: op });
    pts['septum-secundum'] = band(0.5, 0.5, 0.95);
  }

  // Openings of the veins in the back wall, and the veins themselves outside.
  const opening = (key: string, id: string, o: { phi: number; th: number; ea: number; eb: number }, k: number, out: V3) => {
    if (k <= 0.01) return;
    items.push({ key: `${key}-hole`, id, mesh: patch(o.phi, o.th, o.ea * k, o.eb * k, 0.978), color: '#12070c', deep: '#000000', tissue: 'vessel', outline: false });
    const rimP = Array.from({ length: 31 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2;
      return wall(o.phi + o.ea * k * Math.cos(a), o.th - o.eb * k * Math.sin(a), 0.975);
    });
    items.push({ key: `${key}-rim`, id, ...ridge(rimP, 0.026, false), color: K.smoothDeep, deep: '#2a1050', tissue: 'vessel', opacity: k });
    const from = wall(o.phi, o.th, 1.02);
    const v = [from, mix3(from, out, 0.35), mix3(from, out, 0.7), out];
    items.push({ key: `${key}-vein`, id, ...tubeParts(v, { radius: () => 0.17 * Math.max(o.ea, o.eb) / 13, ref: [0, 0, 1], sides: 14, capEnd: true }), color: T.deo2, deep: T.deo2Deep, tissue: 'vessel', opacity: 0.85 * k });
    pts[id] = wall(o.phi, o.th, 0.97);
  };
  opening('svc', 'goiko-kaba-zaina', SVC, s.svc, [0.15, 2.7, -0.75]);
  opening('ivc', 'beheko-kaba-zaina', IVC, s.holes, [-0.2, -2.7, -0.8]);
  opening('cs', 'sinu-koronarioa', CS, s.holes, [1.25, -1.1, -1.05]);

  // From the right valve's lower part: the valves of the IVC and of the coronary sinus (crescents above them).
  if (s.lowSplit > 0.01) {
    const crescent = (o: { phi: number; th: number; ea: number; eb: number }, grow: number) =>
      along([[o.phi + o.ea * 1.2, o.th - 2], [o.phi + o.ea * 0.5, o.th - o.eb - 4 * grow], [o.phi - o.ea * 0.5, o.th - o.eb - 4 * grow], [o.phi - o.ea * 1.2, o.th - 2]], 0.96, 16);
    const ivcV = crescent(IVC, s.lowSplit);
    const csV = crescent(CS, s.lowSplit);
    items.push({ key: 'ivc-valve', id: 'beheko-kabaren-balbula', ...ridge(ivcV, 0.055), color: '#a78bfa', deep: '#5b3fb8', tissue: 'epithelium', opacity: s.lowSplit });
    items.push({ key: 'cs-valve', id: 'sinu-koronarioaren-balbula', ...ridge(csV, 0.04), color: '#a78bfa', deep: '#5b3fb8', tissue: 'epithelium', opacity: s.lowSplit });
    pts['beheko-kabaren-balbula'] = ivcV[8];
    pts['sinu-koronarioaren-balbula'] = csV[8];
  }

  // The crista terminalis between the two parts, and the sinus node at its top.
  if (s.crista > 0.01) {
    const cr = along(CRISTA, 0.955, 30);
    const n = Math.max(2, Math.round(cr.length * s.crista));
    items.push({ key: 'crista', id: 'gandor-terminala', ...ridge(cr.slice(0, n), 0.07, false), color: '#f08a4b', deep: '#7a2e10', tissue: 'muscle' });
    pts['gandor-terminala'] = cr[Math.min(n - 1, 15)];
  }
  if (s.node > 0.01) {
    const c = add(wall(CRISTA[0][0] - 6, CRISTA[0][1] + 6, 0.95), [0, 0, 0]);
    items.push({ key: 'node', id: 'nodulu-sinusala', ...blobParts({ center: c, radii: [0.13 * s.node, 0.09 * s.node, 0.1 * s.node], rings: 10, sides: 14 }), color: '#ffd27a', deep: '#a36a00', tissue: 'nerve' });
    pts['nodulu-sinusala'] = c;
  }

  // Pectinate muscles: parallel ridges from the crista across the lateral wall and into the auricle.
  if (s.pect > 0.01) {
    const ridges: Part[] = [];
    for (let i = 0; i < 10; i++) {
      const th = 30 + i * 13;
      const len = (46 + 18 * Math.sin(i * 1.7)) * s.pect;
      ridges.push(ridge(along([[217, th], [217 + len * 0.5, th + 3], [217 + len, th + 7]], 0.965, 12), 0.04));
    }
    for (let i = 0; i < 4; i++) ridges.push(ridge(along([[286 + i * 7, 28], [292 + i * 7, 46 + 10 * s.pect]], 0.98, 8), 0.035));
    items.push({ key: 'pect', id: 'muskulu-pektinioak', groups: ['atal-trabekulatua'], mesh: cachedMerge(ridges.map((r) => r.mesh)), hit: cachedMerge(ridges.map((r) => r.hit)), color: '#ffa765', deep: '#7a2e10', tissue: 'muscle', opacity: s.pect * lat });
    pts['muskulu-pektinioak'] = wall(240, 74, 0.96);
  }

  return { items, pts };
}

