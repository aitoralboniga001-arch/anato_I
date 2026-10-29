import { deg, mix3, type V3 } from '@/lib/three-d/math';
import { curve3, grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedBlob, cachedMerge, cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { perfCount } from '@/lib/perf';
import { T } from '@/components/scenes/week10/common';
import { blobParts, mixHex, routeLength, tubeParts, vesselRouteOf } from '@/components/scenes/week10/model3d';
import { K } from './common';

/**
 * M1 of topic 11 (notes 2.1–2.2): both primitive atria as one 3D room opened from the front, the
 * interatrial septa growing between them. What the 2D drawings split into two pictures (the frontal
 * section for where the blood goes, the view from the right atrium for the shape of each septum and hole)
 * is one specimen here: turned from the front the septa are the section's two lines; turned to the right
 * atrium they are the two curtains with their holes; and the blood cells take whichever way is open.
 *
 * Axes as every heart model: x = the embryo's left, y = cranial, z = ventral (towards the viewer at yaw 0).
 * The room is a two-lobed ellipsoid, pinched at the septum (x = 0): the right atrium on x < 0, the left on
 * x > 0. It is opened by a frontal cut (z ≤ ZC) and its floor has the AV canal (θ > TH_FLOOR).
 * The septa lie in sagittal planes: septum primum at x = XP (a thin membrane), septum secundum at
 * x = XS, on the primum's right (a thick muscular crescent: it never reaches the cushions, so its free
 * edge arches over the foramen ovale, which stays open down to the canal between the crescent's front and
 * back limbs). A septum point is named in its plane by (y, z); the primum's holes are ellipses round a
 * centre. In the frontal-section steps the septa are cut further back (`cut`), through both holes, so seen
 * from the front they are the notes' two lines and the oblique way between them shows.
 * Stage 5 (notes 2.2 p8–p15) adds the walls' two origins: in the right atrium the sinus venosus taken into
 * the back wall (smooth, violet, with the cavae and the coronary sinus) and the trabeculated rest (the
 * atrial part's orange, pectinate muscles, the auricle), the crista terminalis between them and the sinus
 * node at its top; in the left atrium the primitive pulmonary vein budding from the back wall, branching
 * to the lung buds and taken into the wall, so four veins open into its smooth part.
 */

const RX = 2.05;
const RYT = 1.2;
const RYB = 1.25;
const RZ = 0.95;
/** The front cut (on the un-pinched z). */
const ZC = 0.5;
/** Polar angle of the AV canal's rim in the floor. */
const TH_FLOOR = 155;
/** The floor's level at the canal rim (the septa stand on it). */
export const YF = -RYB * Math.cos(deg(180 - TH_FLOOR));
/** Septum primum's plane (fetal) and septum secundum's (centre of its thickness), and its half-thickness. */
const XP = 0.035;
const XS = -0.15;
const HS = 0.055;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** The waist between the two atria: 1 at the septum, 0 far from it. */
const waist = (x: number) => Math.exp(-((x / 0.6) ** 2));

/** A point of the room's wall by azimuth φ (0 front, 90 the left atrium, 180 back, 270 the right atrium) and polar θ (0 roof). */
export function chamber(phi: number, th: number, k = 1): V3 {
  const p = deg(phi);
  const t = deg(th);
  const x = RX * Math.sin(t) * Math.sin(p);
  const w = waist(x);
  const c = Math.cos(t);
  const y = c * (c > 0 ? RYT * (1 - 0.14 * w) : RYB);
  const z = RZ * (1 - 0.1 * w) * Math.sin(t) * Math.cos(p);
  return [x * k, y * k, z * k];
}

/** Where the front cut leaves the wall at polar angle θ: the wall runs from φ0 to 360 − φ0. */
const phi0 = (th: number) => {
  const r = RZ * Math.sin(deg(th));
  return r <= ZC ? 0 : (Math.acos(ZC / r) * 180) / Math.PI;
};

// ———————————————————————————— the septal planes ————————————————————————————

interface Plane {
  x: number;
  ryT: number;
  ryB: number;
  rz: number;
  zcut: number;
}
/** A septum's plane at x; `cut` trims it further back than the room's front opening (a frontal section). */
function plane(x: number, cut = Infinity): Plane {
  const s = Math.sqrt(Math.max(0, 1 - (x / RX) ** 2));
  const w = waist(x);
  return { x, ryT: RYT * (1 - 0.14 * w) * s, ryB: RYB * s, rz: RZ * (1 - 0.1 * w) * s, zcut: Math.min(ZC * (1 - 0.1 * w), cut) };
}
const inside = (P: Plane, y: number, z: number) => (y >= 0 ? (y / P.ryT) ** 2 : (y / P.ryB) ** 2) + (z / P.rz) ** 2 <= 1 && z <= P.zcut + 1e-9 && y >= YF - 1e-9;

/** From (cy, cz) along angle a (0 = ventral, 90° = cranial, 180° = dorsal) to the edge of the room's section. */
function reach(P: Plane, cy: number, cz: number, a: number): number {
  const dy = Math.sin(a);
  const dz = Math.cos(a);
  if (!inside(P, cy, cz)) return 0;
  let lo = 0;
  let hi = 0.02;
  while (hi < 4 && inside(P, cy + hi * dy, cz + hi * dz)) {
    lo = hi;
    hi += 0.04;
  }
  for (let i = 0; i < 12; i++) {
    const m = (lo + hi) / 2;
    if (inside(P, cy + m * dy, cz + m * dz)) lo = m;
    else hi = m;
  }
  return lo;
}

/** Radius of an ellipse (half-axes ry, rz) along angle a. */
const rEll = (ry: number, rz: number, a: number) => 1 / Math.sqrt((Math.sin(a) / Math.max(1e-4, ry)) ** 2 + (Math.cos(a) / Math.max(1e-4, rz)) ** 2);

/** A sheet near plane x (`xf` bends it) round a hole (centre cy, cz; edge radius `hole(a)`) out to the room's wall. */
function sheet(x: number, cy: number, cz: number, hole: (a: number) => number, a0: number, a1: number, nA: number, nR: number, facing: V3, xf: (y: number, z: number) => number = () => x, outer?: (a: number) => number, cut?: number): Mesh {
  const P = plane(x, cut);
  const reachAt = new Map<number, number>();
  const R = (i: number, a: number) => {
    let r = reachAt.get(i);
    if (r === undefined) reachAt.set(i, (r = reach(P, cy, cz, a)));
    return r;
  };
  // Its triangles face +x as built (angle round, radius out); turned round when it must face −x. (Asking
  // `grid` to face a point fails when the middle cell is empty, as when the hole still fills most rays.)
  const m = grid(nA, nR, (u, v) => {
    const a = lerp(a0, a1, u);
    const wall = R(Math.round(u * nA), a);
    const out = outer ? Math.min(wall, outer(a)) : wall;
    const r = lerp(Math.min(hole(a), out), out, v);
    const y = cy + r * Math.sin(a);
    const z = cz + r * Math.cos(a);
    return [xf(y, z), y, z];
  });
  return facing[0] < x ? flipped(m) : m;
}

/**
 * Holes cut into a sheet with clean edges: a vertex inside a hole moves out onto its rim (along the ray
 * from the hole's middle), and a triangle with all three corners inside is dropped.
 */
function cutHoles(m: Mesh, holes: readonly Hole[], xf: (y: number, z: number) => number): Mesh {
  if (!holes.length) return m;
  const pos = new Float32Array(m.pos);
  const n = pos.length / 3;
  const inner = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const y = pos[i * 3 + 1];
    const z = pos[i * 3 + 2];
    const h = holes.find((o) => inEll(y, z, o));
    if (!h) continue;
    inner[i] = 1;
    const a = Math.atan2(y - h.y, z - h.z);
    const r = rEll(h.ry, h.rz, a);
    const ny = h.y + r * Math.sin(a);
    const nz = h.z + r * Math.cos(a);
    pos[i * 3] = xf(ny, nz);
    pos[i * 3 + 1] = ny;
    pos[i * 3 + 2] = nz;
  }
  const idx: number[] = [];
  for (let i = 0; i < m.idx.length; i += 3) {
    const a = m.idx[i];
    const b = m.idx[i + 1];
    const c = m.idx[i + 2];
    if (!(inner[a] && inner[b] && inner[c])) idx.push(a, b, c);
  }
  return { pos, nrm: m.nrm, uv: m.uv, idx: new Uint32Array(idx) };
}

/** The same triangles facing the other way. */
function flipped(m: Mesh): Mesh {
  const idx = new Uint32Array(m.idx.length);
  for (let i = 0; i < m.idx.length; i += 3) {
    idx[i] = m.idx[i];
    idx[i + 1] = m.idx[i + 2];
    idx[i + 2] = m.idx[i + 1];
  }
  const nrm = new Float32Array(m.nrm.length);
  for (let i = 0; i < nrm.length; i++) nrm[i] = -m.nrm[i];
  return { pos: m.pos, nrm, uv: m.uv, idx };
}
/** The same sheet seen from both sides (the renderer draws front faces only). */
const twoSided = (m: Mesh): Mesh => merge([m, flipped(m)]);

const ridge = (path: V3[], r: number, sides = 8) => tubeParts(path, { radius: () => r, ref: [1, 0, 0], sides, capStart: true, capEnd: true });

/** Points of an ellipse arc in plane x, kept where `keep` holds; split into runs. */
function ellipseRuns(x: number | ((y: number, z: number) => number), cy: number, cz: number, ry: number, rz: number, keep: (y: number, z: number) => boolean, a0 = 0, a1 = Math.PI * 2, n = 72): V3[][] {
  const xf = typeof x === 'number' ? () => x : x;
  const runs: V3[][] = [];
  let cur: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    const r = rEll(ry, rz, a);
    const y = cy + r * Math.sin(a);
    const z = cz + r * Math.cos(a);
    if (keep(y, z)) cur.push([xf(y, z), y, z]);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  // A closed ring split at its start: join the two ends.
  if (runs.length > 1 && a1 - a0 >= Math.PI * 2 - 1e-6) {
    const first = runs[0];
    const last = runs[runs.length - 1];
    if (first[0] && last[last.length - 1] && Math.hypot(first[0][1] - last[last.length - 1][1], first[0][2] - last[last.length - 1][2]) < 0.1) {
      runs[0] = [...last, ...first.slice(1)];
      runs.pop();
    }
  }
  // Runs of a point or two (a rim grazing another hole) would be specks.
  return runs.filter((r) => r.length >= 4);
}

// ———————————————————————————— the state ————————————————————————————

export interface AtriaState {
  /** Septum primum grown from the roof (the 2D scale: 0 → 0.82 at its full length). */
  primum: number;
  /** AV cushions grown (0.35 = just appearing) and fused (superior with inferior). */
  cushions: number;
  cushionFuse: number;
  /** Ostium secundum: small perforations (to 0.5), merging into one hole (to 1). */
  os2: number;
  /** The cushions' extensions close the ostium primum. */
  closeOP: number;
  secundum: number;
  /** The septum spurium and the left venous valve merge into septum secundum. */
  spurium: number;
  /** The primum's upper part above the ostium secundum vanishes: the rest is the valve of the foramen ovale. */
  stub: number;
  /** Birth: the valve pressed onto septum secundum, fusing; `patent`: a slit stays open. */
  press: number;
  fuse: number;
  patent: boolean;
  /** Four pulmonary veins in the left atrium's back wall (birth). */
  pulmonary: number;
  /** The definitive atria (names). */
  adult: boolean;
  /** A wall goes clear so the septum is seen through it. */
  glassRA: number;
  glassLA: number;
  /** The valve of the foramen ovale goes see-through (from the left atrium, the foramen behind it shows). */
  glassValve: number;
  /** A frontal cut through both septa at this z (through the ostium secundum and the foramen ovale); 9 = none. */
  cut: number;
  /** Stage 5: the sinus venosus as a sac behind the right atrium (1), taken into its back wall (0). */
  sinus: number;
  /** The right atrium's smooth part spreads over the back wall (0 = the strip of stages 2–4). */
  smoothWide: number;
  /** The walls named by their two origins (smooth / trabeculated). */
  walls: boolean;
  /** Coronary sinus opening; crista terminalis; sinus node; pectinate muscles and auricle (right, left). */
  cs: number;
  crista: number;
  node: number;
  pect: number;
  laPect: number;
  /** The primitive pulmonary vein: one bud out of the left atrium's back wall (to 0.35), branching to the lung buds (1). */
  pvGrow: number;
  /** Its trunk and first branches taken into the wall: four separate openings. */
  pvIncorp: number;
  /** The lung buds behind the heart, with their own veins. */
  lungs: number;
  /** The left atrium's smooth part round the four openings. */
  laSmooth: number;
  /** The dorsal mesocardium behind the left atrium (grey sentences of the notes). */
  meso: number;
}

export const AT0: AtriaState = {
  primum: 0,
  cushions: 0.35,
  cushionFuse: 0,
  os2: 0,
  closeOP: 0,
  secundum: 0,
  spurium: 0,
  stub: 0,
  press: 0,
  fuse: 0,
  patent: false,
  pulmonary: 0,
  adult: false,
  glassRA: 0,
  glassLA: 0,
  glassValve: 0,
  cut: 9,
  sinus: 0,
  smoothWide: 0,
  walls: false,
  cs: 0,
  crista: 0,
  node: 0,
  pect: 0,
  laPect: 0,
  pvGrow: 0,
  pvIncorp: 0,
  lungs: 0,
  laSmooth: 0,
  meso: 0,
};

/** Blood: how much of each way is running, and the stage time (cells move with it). */
export interface AtriaFlow {
  phase: number;
  /** Fetal blood (mixed) right → left through the low gap (ostium primum / the common atrium). */
  low: number;
  /** Right → left by the high way: the ostium secundum, then (septum secundum grown) the oblique path. */
  high: number;
  /** Each atrium down through the AV canal. */
  down: number;
  /** After birth: pulmonary veins into the left atrium (red), right atrium venous (blue). */
  born: number;
  /** A patent slit: a few venous cells into the left atrium. */
  slit: number;
}

export interface AtriaModel {
  items: Item3[];
  pts: Record<string, V3>;
}

// ———————————————————————————— geometry of each septum for a state ————————————————————————————

/** Height of the cushions' top over the floor. */
const CUSH_TOP = (s: AtriaState) => 0.04 + 0.05 * clamp01(s.cushions) + lerp(0.08, 0.16, clamp01(s.cushions));
/** Septum primum: the hole under its free edge (ostium primum), round the canal's middle. */
const OPC = { y: YF, z: -0.03 };
function opRadius(s: AtriaState) {
  // Grown 0 → 0.82: the free edge comes down from the roof to just over the cushions; closed by their extensions.
  const g = clamp01(s.primum / 0.82);
  // Slow at first (a crest in the roof), then down to a gap a little higher than the cushions.
  const ry = s.primum < 0.005 ? 9 : lerp(2.25, 0.55, g ** 1.4) * (1 - 0.94 * s.closeOP);
  return { ry, rz: ry * 0.95 };
}
/** Ostium secundum: four small holes that grow and merge into one (centre, radius in the plane). */
const OSC = { y: 0.5, z: -0.27 };
function osHoles(os2: number): { y: number; z: number; ry: number; rz: number }[] {
  if (os2 <= 0.01) return [];
  const small = clamp01(os2 / 0.5);
  const merge1 = clamp01((os2 - 0.5) / 0.5);
  const offs: [number, number][] = [[0.13, 0.12], [-0.11, 0.15], [0.1, -0.15], [-0.13, -0.1]];
  const out = offs.map(([dy, dz]) => {
    const r = lerp(0.03, 0.1, small) + 0.06 * merge1;
    return { y: OSC.y + dy * (1 - 0.75 * merge1), z: OSC.z + dz * (1 - 0.75 * merge1), ry: r, rz: r };
  });
  if (merge1 > 0.01) out.push({ y: OSC.y, z: OSC.z, ry: 0.22 * merge1, rz: 0.29 * merge1 });
  return out;
}
type Hole = { y: number; z: number; ry: number; rz: number };
const inEll = (y: number, z: number, h: Hole) => ((y - h.y) / h.ry) ** 2 + ((z - h.z) / h.rz) ** 2 < 1;
/** Along a ray from (cy, cz), how far to the line where the primum's upper part is gone (Infinity if never). */
function toStub(s: AtriaState, cy: number, cz: number, a: number, max: number) {
  const f = (r: number) => cy + r * Math.sin(a) - stubTop(s, cz + r * Math.cos(a));
  if (f(max) < 0) return Infinity;
  let lo = 0;
  let hi = max;
  for (let i = 0; i < 18; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < 0) lo = m;
    else hi = m;
  }
  return lo;
}
/** Where the primum's upper part is gone (the valve's free upper edge), as a height at z. A patent foramen:
 *  along a stretch of the edge the two septa never fused, and the edge stops a little short (the slit). */
const stubTop = (s: AtriaState, z: number) => lerp(1.4, 0.27 + 0.04 * Math.sin(z * 7 + 1), s.stub) - (s.patent ? NOTCH * slitAlong(z) : 0);
const NOTCH = 0.07;
const SLIT_Z: [number, number] = [-0.36, 0.02];
/** 0 … 1 … 0 along the unfused stretch of the valve's upper edge. */
function slitAlong(z: number) {
  const u = (z - SLIT_Z[0]) / (SLIT_Z[1] - SLIT_Z[0]);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI) ** 0.7;
}

/** Septum secundum: the hole left under it (the foramen ovale), shrinking as it grows down from the roof. */
const FOC = { y: -0.45, z: -0.1 };
function foHole(s: AtriaState) {
  const g = clamp01(s.secundum);
  return { y: lerp(YF - 0.3, FOC.y, g ** 0.7), z: lerp(0.0, FOC.z, g), ry: lerp(2.5, 0.34, g ** 0.7), rz: lerp(2.3, 0.27, g ** 0.7) };
}
type Fo = ReturnType<typeof foHole>;
/**
 * The foramen ovale is not a hole ringed by septum secundum: the crescent never reaches the cushions
 * (septum intermedium). Over the foramen's middle its free edge is an arch (the ellipse's upper half);
 * below, the opening runs down to the canal between the crescent's two limbs, widening a little (the
 * limbs taper towards the floor, as in the face view).
 */
const FO_FLARE = 0.6;
const foDepth = (fo: Fo) => Math.max(0.05, fo.y - YF);
/** Half-width of the opening below the arch (where the limbs' edges run down). */
const foHalf = (fo: Fo, y: number) => fo.rz * (1 + (FO_FLARE * Math.max(0, fo.y - y)) / foDepth(fo));
/** Inside the opening left by septum secundum. */
const inFo = (fo: Fo, y: number, z: number) => (y >= fo.y ? ((y - fo.y) / fo.ry) ** 2 + ((z - fo.z) / fo.rz) ** 2 < 1 : Math.abs(z - fo.z) < foHalf(fo, y));
/** From the foramen's centre along angle a, how far to septum secundum's free edge. */
function foEdge(fo: Fo, a: number) {
  const sa = Math.sin(a);
  if (sa >= 0) return rEll(fo.ry, fo.rz, a);
  const den = Math.abs(Math.cos(a)) + (FO_FLARE * fo.rz * sa) / foDepth(fo);
  return den <= 1e-3 ? 9 : Math.min(9, fo.rz / den);
}
/** The free edge as a line: the front limb up from the floor, the arch over the foramen, the back limb down. */
function foRim(fo: Fo): V3[] {
  const out: V3[] = [];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const y = lerp(YF, fo.y, i / n);
    out.push([XS, y, fo.z + foHalf(fo, y)]);
  }
  for (let i = 1; i < 48; i++) {
    const a = (i / 48) * Math.PI;
    const r = rEll(fo.ry, fo.rz, a);
    out.push([XS, fo.y + r * Math.sin(a), fo.z + r * Math.cos(a)]);
  }
  for (let i = 0; i <= n; i++) {
    const y = lerp(fo.y, YF, i / n);
    out.push([XS, y, fo.z - foHalf(fo, y)]);
  }
  return out;
}
/** A line's runs where `keep` holds. */
function runsOf(line: V3[], keep: (p: V3) => boolean): V3[][] {
  const runs: V3[][] = [];
  let cur: V3[] = [];
  for (const p of line) {
    if (keep(p)) cur.push(p);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  return runs.filter((r) => r.length >= 3);
}

/** The primum's plane: at birth it is pressed onto septum secundum's left face. */
const xPrimum = (s: AtriaState) => lerp(XP, XS + HS + 0.014, s.press);
/** The membrane is not a flat card: it billows gently, and is pressed flat at birth. */
const primumX = (s: AtriaState) => {
  const x = xPrimum(s);
  const k = 0.035 * (1 - s.press);
  return (y: number, z: number) => x + k * Math.sin(y * 2.1 + 0.4) * Math.cos(z * 2.4);
};

// ———————————————————————————— the model ————————————————————————————

export function atriaModel(s: AtriaState, flow: AtriaFlow): AtriaModel {
  perfCount('atriaModel');
  const key = JSON.stringify(s, (_k, v) => (typeof v === 'number' ? Math.round(v * 400) / 400 : v));
  let geo = snapshots.get(key);
  if (geo) {
    snapshots.delete(key);
    snapshots.set(key, geo);
  } else {
    perfCount('atriaModelBuild');
    geo = buildAtria(s);
    if (snapshots.size >= 3) snapshots.delete(snapshots.keys().next().value!);
    snapshots.set(key, geo);
  }
  return { items: [...geo.items, ...streams(s, flow)], pts: geo.pts };
}
const snapshots = new Map<string, AtriaModel>();

type Part = { mesh: Mesh; hit: Mesh };
let walls: { ra: Part; la: Part; rim: Part; canal: Part } | null = null;
function wallsOnce() {
  if (walls) return walls;
  const C: V3 = [0, 0, 0];
  const side = (right: boolean, coarse: number) =>
    grid(Math.round(30 / coarse), Math.round(44 / coarse), (u, v) => {
      const th = lerp(1, TH_FLOOR, v);
      const f = phi0(th);
      const phi = right ? lerp(180, 360 - f, u) : lerp(f, 180, u);
      return chamber(phi, th);
    }, C);
  const part = (right: boolean): Part => ({ mesh: side(right, 1), hit: side(right, 3) });
  // The cut edge of the opened front: where the plane z = ZC leaves the wall, round the window.
  const thA = (Math.asin(ZC / RZ) * 180) / Math.PI + 0.3;
  const thB = 180 - thA;
  const n = 40;
  const loop: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const th = lerp(thA, Math.min(thB, TH_FLOOR - 0.2), i / n);
    loop.push(chamber(360 - phi0(th), th));
  }
  for (let i = n; i >= 0; i--) {
    const th = lerp(thA, Math.min(thB, TH_FLOOR - 0.2), i / n);
    loop.push(chamber(phi0(th), th));
  }
  loop.push(loop[0]);
  const rim = tubeParts(loop, { radius: () => 0.045, ref: [0, 0, 1], sides: 10 });
  // The AV canal: from its rim in the floor a short funnel down towards the ventricles.
  const canalAt = (coarse: number) =>
    grid(Math.round(48 / coarse), Math.round(8 / coarse), (u, v) => {
      const p = chamber(u * 360, TH_FLOOR);
      const k = 1 - 0.12 * v;
      return [p[0] * k, YF - 0.62 * v, p[2] * k + 0.04 * v];
    }, [0, YF - 0.3, 0]);
  walls = { ra: part(true), la: part(false), rim, canal: { mesh: twoSided(canalAt(1)), hit: canalAt(3) } };
  return walls;
}

/** An oval patch on the wall round (φ, θ), half-extents in degrees. */
const patch = (phi: number, th: number, ea: number, eb: number, k: number) =>
  cachedMesh('atria patch', [phi, th, ea, eb, k], () => grid(8, 28, (r, t) => {
    const a = t * Math.PI * 2;
    return chamber(phi + ea * r * Math.cos(a), th - eb * r * Math.sin(a), k);
  }, [0, 0, 0]));

/** Openings of veins in the wall: centre (φ, θ), half-extents, where the vein comes from outside. */
const SVC = { phi: 214, th: 32, ea: 11, eb: 9, out: [-0.75, 2.15, -0.85] as V3 };
const IVC = { phi: 212, th: 142, ea: 12, eb: 9, out: [-0.8, -2.15, -0.95] as V3 };
/** The four pulmonary veins: the lateral two to the left lung, the medial two (behind the right atrium) to the right one. */
const PVS = [
  { phi: 146, th: 66, ea: 6, eb: 6, out: [1.4, 0.58, -2.12] as V3 },
  { phi: 160, th: 64, ea: 6, eb: 6, out: [-0.36, 0.58, -2.22] as V3 },
  { phi: 146, th: 104, ea: 6, eb: 6, out: [1.4, -0.22, -2.16] as V3 },
  { phi: 160, th: 106, ea: 6, eb: 6, out: [-0.36, -0.22, -2.26] as V3 },
];
/** The coronary sinus: low in the right atrium's back wall, near the septum. */
const CS = { phi: 197, th: 126, ea: 7, eb: 6.5, out: [0.45, -1.3, -1.4] as V3 };
/** The primitive pulmonary vein: where it leaves the left atrium, where it branches (left lung, right lung). */
const PV_O = { phi: 153, th: 85 };
const PV_T: V3 = [0.86, 0.1, -1.32];
const PV_B: V3[] = [
  [1.2, 0.14, -1.66],
  [0.22, 0.14, -1.76],
];
const PV_SIDE = [0, 1, 0, 1];
const LUNGS: V3[] = [
  [1.66, 0.18, -2.3],
  [-0.62, 0.18, -2.42],
];
/** The crista terminalis on the right atrium's wall, roof to floor (φ, θ), at the smooth part's lateral edge. */
const CRISTA: [number, number][] = [
  [247, 24],
  [250, 56],
  [251, 92],
  [249, 128],
  [243, 150],
];

/** A line on the room's wall through (φ, θ) keys, `k` inside it. */
function alongWall(keys: readonly (readonly [number, number])[], k: number, n = 24): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * (keys.length - 1);
    const j = Math.min(keys.length - 2, Math.floor(x));
    const g = (1 - Math.cos((x - j) * Math.PI)) / 2;
    out.push(chamber(lerp(keys[j][0], keys[j + 1][0], g), lerp(keys[j][1], keys[j + 1][1], g), k));
  }
  return out;
}
/** The first share `f` of a path's length. */
function trim(path: readonly V3[], f: number): V3[] {
  const L: number[] = [0];
  for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
  const want = L[L.length - 1] * clamp01(f);
  const out: V3[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    if (L[i] < want) {
      out.push(path[i]);
      continue;
    }
    const k = (want - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    out.push(mix3(path[i - 1], path[i], k));
    break;
  }
  return out;
}
/** The way of pulmonary vein `i`: through the common trunk and its side's branch while not yet taken in (k = 0), straight from its own opening (k = 1). */
function pvPath(i: number, k: number): V3[] {
  const o = PVS[i];
  const a = chamber(lerp(PV_O.phi, o.phi, k), lerp(PV_O.th, o.th, k), 1.0);
  return curve3([a, mix3(PV_T, mix3(a, o.out, 0.3), k), mix3(PV_B[PV_SIDE[i]], mix3(a, o.out, 0.65), k), o.out], 22);
}

function buildAtria(s: AtriaState): AtriaModel {
  const W = wallsOnce();
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const raId = s.walls ? 'atal-trabekulatua' : s.adult ? 'eskuineko-aurikula' : 'hasierako-eskuineko-aurikula';
  const laId = s.walls ? 'ezkerreko-aurikularen-atal-trabekulatua' : s.adult ? 'ezkerreko-aurikula-jaiotakoan' : 'hasierako-ezkerreko-aurikula';
  const owner = (base: string) => (s.walls ? [base, 'aurikula-komuna'] : ['aurikula-komuna']);
  const ra = 1 - 0.85 * s.glassRA;
  const la = 1 - 0.85 * s.glassLA;

  // The walls: the right atrium and the left, the cut edge of the opened front, the AV canal below.
  items.push({ key: 'ra', id: raId, groups: owner('hasierako-eskuineko-aurikula'), ...W.ra, color: T.atrium, deep: T.atriumDeep, tissue: 'muscle', opacity: ra });
  items.push({ key: 'la', id: laId, groups: owner('hasierako-ezkerreko-aurikula'), ...W.la, color: mixHex(T.atrium, '#d8662a', 0.4), deep: T.atriumDeep, tissue: 'muscle', opacity: la });
  items.push({ key: 'rim', ...W.rim, color: '#f2a27e', deep: '#9a4a28', tissue: 'muscle', opacity: Math.min(ra, la), outline: false });
  items.push({ key: 'canal', id: 'erreten-aurikulubentrikularra', ...W.canal, color: mixHex(T.atrium, T.ventricle, 0.45), deep: mixHex(T.atriumDeep, T.ventricleDeep, 0.5), tissue: 'muscle' });
  pts[raId] = s.walls ? chamber(266, 112, 0.96) : chamber(258, 96, 0.96);
  pts[laId] = s.walls ? chamber(96, 112, 0.96) : chamber(102, 96, 0.96);
  pts['aurikula-komuna'] = chamber(180, 60, 0.95);
  pts['erreten-aurikulubentrikularra'] = [-0.28, YF - 0.33, 0.37];

  // The primitive ventricles under the canal, seen from outside (the canal opens into them).
  items.push({ key: 'rv', id: 'hasierako-eskuineko-bentrikulua', ...blobParts({ center: [-0.72, YF - 1.02, 0.2], radii: [0.56, 0.47, 0.43], rings: 16, sides: 22 }), color: mixHex(T.proximal, '#1c2a24', 0.12), deep: T.bulbusDeep, tissue: 'muscle' });
  items.push({ key: 'lv', id: 'hasierako-ezkerreko-bentrikulua', ...blobParts({ center: [0.48, YF - 1.1, 0.05], radii: [0.68, 0.53, 0.51], rings: 16, sides: 22 }), color: mixHex(T.ventricle, '#16262b', 0.12), deep: T.ventricleDeep, tissue: 'muscle' });
  pts['hasierako-eskuineko-bentrikulua'] = [-0.95, YF - 1.02, 0.52];
  pts['hasierako-ezkerreko-bentrikulua'] = [0.82, YF - 1.1, 0.42];

  // The veins' openings: the cavae in the right atrium's back wall (the sinus side), the pulmonary veins in the left's.
  // Several openings of one structure (the four pulmonary veins) are one piece each of holes, rims and veins.
  const opening = (key: string, id: string, os: { phi: number; th: number; ea: number; eb: number; out: V3 }[], k: number, red: boolean) => {
    if (k <= 0.01) return;
    const holes = os.map((o) => patch(o.phi, o.th, o.ea * k, o.eb * k, 0.985));
    const rims = os.map((o) => ridge(Array.from({ length: 29 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return chamber(o.phi + o.ea * k * Math.cos(a), o.th - o.eb * k * Math.sin(a), 0.982);
    }), 0.024));
    const veins = os.map((o) => {
      const from = chamber(o.phi, o.th, 1.02);
      const mid = (f: number): V3 => [lerp(from[0], o.out[0], f), lerp(from[1], o.out[1], f), lerp(from[2], o.out[2], f)];
      return tubeParts([from, mid(0.35), mid(0.7), o.out], { radius: () => 0.016 * Math.max(o.ea, o.eb), ref: [0, 0, 1], sides: 14, capEnd: true });
    });
    items.push({ key: `${key}-hole`, id, mesh: cachedMerge(holes), color: '#12070c', deep: '#000000', tissue: 'vessel', outline: false });
    items.push({ key: `${key}-rim`, id, mesh: cachedMerge(rims.map((r) => r.mesh)), hit: cachedMerge(rims.map((r) => r.hit)), color: red ? T.o2Deep : K.smoothDeep, deep: '#2a1050', tissue: 'vessel', opacity: k });
    items.push({ key: `${key}-vein`, id, mesh: cachedMerge(veins.map((r) => r.mesh)), hit: cachedMerge(veins.map((r) => r.hit)), color: red ? T.o2 : T.deo2, deep: red ? T.o2Deep : T.deo2Deep, tissue: 'vessel', opacity: 0.85 * k });
    pts[id] = chamber(os[0].phi, os[0].th, 0.96);
  };
  opening('svc', 'goiko-kaba-zaina', [SVC], 1, false);
  opening('ivc', 'beheko-kaba-zaina', [IVC], 1, false);
  opening('pv', 'birika-zainak', PVS, s.pulmonary, true);
  if (s.pulmonary > 0.01) pts['birika-zainak'] = chamber(153, 84, 0.96);
  // The smooth (sinus) part round the cavae in the right atrium's back wall (topic 10, stage 10); in
  // stage 5 it spreads as the sinus is taken in, up to the crista terminalis.
  const sea = lerp(10, 24, s.smoothWide);
  const seb = lerp(56, 62, s.smoothWide);
  items.push({ key: 'smooth', id: 'atal-lisoa', groups: ['zain-sinua'], quiet: !s.walls, mesh: patch(222, 88, sea, seb, 0.99), color: K.smoothRA, deep: K.smoothDeep, tissue: 'epithelium', outline: false, opacity: Math.max(ra, s.sinus > 0.01 ? 1 : 0) });
  pts['atal-lisoa'] = chamber(222 + 0.55 * sea, 100, 0.96);
  walls5(s, items, pts, opening, ra, la);

  // The AV cushions at the canal's back (superior, dorsal) and front (inferior) lips; fused, a bar across it.
  const c = clamp01(s.cushions);
  const f = clamp01(s.cushionFuse);
  const cush = (key: string, id: string, z0: number) => {
    const z = lerp(z0, Math.sign(z0) * 0.13, f);
    const center: V3 = [0, YF + 0.04 + 0.05 * c, z];
    items.push({ key, id, groups: ['kuxin-aurikulubentrikularrak', 'endokardio-kuxinak'], ...blobParts({ center, radii: [lerp(0.2, 0.36, c), lerp(0.08, 0.16, c), lerp(0.08, 0.2, c) + 0.05 * f], rings: 14, sides: 20 }), color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' });
    // The back one's dot on its right-atrium half: the septum primum hangs over its middle.
    pts[id] = [z0 < 0 ? -lerp(0.1, 0.2, c) : 0, center[1] + 0.06, z];
  };
  // The canal faces forward and down (its opening in a near-frontal plane, notes 3 p10): its upper lip is
  // the dorsal one. Seen in this floor, the superior (dorsal) cushion is at the back, the inferior at the front.
  cush('cush-sup', 'goiko-kuxina', -0.32);
  cush('cush-inf', 'beheko-kuxina', 0.3);
  pts['kuxin-aurikulubentrikularrak'] = [0, YF + 0.12, f > 0.5 ? 0 : 0.3];

  // —— septum primum: a thin cream membrane hanging from the roof, its free edge over the cushions ——
  const xp = xPrimum(s);
  const xf = primumX(s);
  if (s.primum > 0.005) {
    // The membrane keeps the edge it grew to; the cushions' extensions (a mint band) fill the gap under it.
    const op = opRadius(s);
    const opMem = opRadius({ ...s, closeOP: 0 });
    const holes = osHoles(s.os2);
    const stubbed = s.stub > 0.005;
    const P = plane(xp, s.cut);
    const keep = (y: number, z: number) => !holes.some((h) => inEll(y, z, h)) && (!stubbed || y < stubTop(s, z));
    const build = (nA: number, nR: number) => {
      const m = sheet(xp, OPC.y, OPC.z, (a) => rEll(opMem.ry, opMem.rz, a), 0, Math.PI, nA, nR, [-3, 0, 0], xf, stubbed ? (a) => toStub(s, OPC.y, OPC.z, a, 3) : undefined, s.cut);
      // Holes wholly in the vanished part are gone with it.
      return twoSided(cutHoles(m, stubbed ? holes.filter((h) => h.y - h.ry < stubTop(s, h.z)) : holes, xf));
    };
    const deps = [xp, opMem.ry, s.os2, s.stub, s.cut, s.patent ? 1 : 0];
    const mesh = cachedMesh('atria primum', deps, () => build(120, 34));
    const hit = cachedMesh('atria primum hit', deps, () => build(40, 10));
    const id = s.stub > 0.5 ? 'zulo-obalaren-balbula' : 'septum-primum';
    const tone = s.fuse > 0 ? mixHex(K.primum, K.secundum, 0.35 * s.fuse) : K.primum;
    items.push({ key: 'primum', id, groups: ['aurikula-arteko-trenkada', 'septum-primum'], mesh, hit, color: tone, deep: K.primumDeep, tissue: 'membrane', thin: 1, outline: false, opacity: 1 - 0.5 * s.glassValve });
    // Its free edge (the ostium primum's roof), the rims of the holes and of the vanished top: a thin cord.
    // Each opening glows by its own rim: the free edge over the ostium primum, the rims of the ostium secundum.
    const cord = (key: string, hole: string, lines: V3[][], color: string) => {
      if (!lines.length) return;
      const parts = lines.map((e) => ridge(e, 0.017, 6));
      items.push({ key, id: hole, groups: ['septum-primum'], mesh: cachedMerge(parts.map((p) => p.mesh)), hit: cachedMerge(parts.map((p) => p.hit)), color, deep: K.primumDeep, tissue: 'membrane', outline: false });
    };
    const cordTone = mixHex(K.primum, K.primumDeep, 0.35);
    if (op.ry < 3 && s.closeOP < 0.999) cord('op-edge', 'ostium-primuma', ellipseRuns(xf, OPC.y, OPC.z, op.ry, op.rz, (y, z) => y > YF + 0.004 && inside(P, y, z) && keep(y, z), 0, Math.PI, 60), mixHex(cordTone, K.cushionDeep, clamp01(s.closeOP * 2)));
    if (s.stub < 0.98) cord('os-rim', 'ostium-secunduma', holes.flatMap((h, i) => ellipseRuns(xf, h.y, h.z, h.ry, h.rz, (y, z) => inside(P, y, z) && !holes.some((o, j) => j !== i && inEll(y, z, o)) && (!stubbed || y < stubTop(s, z)), 0, Math.PI * 2, 36)), cordTone);
    const edges: V3[][] = [];
    if (stubbed) {
      const line: V3[] = [];
      for (let i = 0; i <= 40; i++) {
        const z = lerp(-P.rz, P.zcut, i / 40);
        const y = stubTop(s, z);
        if (inside(P, y, z) && rEll(op.ry, op.rz, Math.atan2(y - OPC.y, z - OPC.z)) < Math.hypot(y - OPC.y, z - OPC.z)) line.push([xf(y, z), y, z]);
      }
      if (line.length > 1) edges.push(line);
    }
    if (edges.length) {
      const parts = edges.map((e) => ridge(e, 0.017 + 0.016 * s.fuse, 6));
      // What is left of the ostium secundum: the way over the valve's free upper edge.
      items.push({ key: 'primum-edge', id: 'ostium-secunduma', groups: ['septum-primum', 'zulo-obalaren-balbula'], mesh: cachedMerge(parts.map((p) => p.mesh)), hit: cachedMerge(parts.map((p) => p.hit)), color: mixHex(cordTone, K.secundum, 0.7 * s.fuse), deep: K.primumDeep, tissue: 'membrane', outline: false });
    }
    // A frontal section: the membrane's cut edge is the notes' line, broken by the ostium secundum.
    if (s.cut < ZC) {
      const zc = P.zcut - 0.004;
      const line: V3[] = [];
      for (let i = 0; i <= 60; i++) {
        const y = lerp(YF + 0.005, P.ryT, i / 60);
        line.push([xf(y, zc), y, zc]);
      }
      const cutRuns = runsOf(line, ([, y, z]) => inside(P, y, z) && keep(y, z) && rEll(op.ry, op.rz, Math.atan2(y - OPC.y, z - OPC.z)) < Math.hypot(y - OPC.y, z - OPC.z));
      if (cutRuns.length) {
        const parts = cutRuns.map((e) => ridge(e, 0.022, 6));
        items.push({ key: 'primum-cut', id: 'septum-primum', groups: ['aurikula-arteko-trenkada'], mesh: cachedMerge(parts.map((q) => q.mesh)), hit: cachedMerge(parts.map((q) => q.hit)), color: mixHex(K.primum, K.primumDeep, 0.2), deep: K.primumDeep, tissue: 'membrane', outline: false });
      }
    }
    // Where each is named: the membrane well inside, the holes at their middle.
    {
      // Well inside the membrane: halfway from its free edge to the wall, up and back from the canal.
      const a = deg(112);
      const out = reach(P, OPC.y, OPC.z, a);
      const r = (Math.min(rEll(opMem.ry, opMem.rz, a), out) + out) / 2;
      const y = OPC.y + r * Math.sin(a);
      const z = OPC.z + r * Math.cos(a);
      pts['septum-primum'] = [xf(y, z), y, z];
      // Once septum secundum hides its upper part from the right atrium, name it where it shows: low in
      // the foramen ovale (under the free edge, above the cushions' extensions), behind any frontal cut.
      if (s.secundum > 0.45) {
        const fo = foHole(s);
        const yl = fo.y - 0.06;
        const zl = Math.min(fo.z - 0.1, P.zcut - 0.1);
        pts['septum-primum'] = [xf(yl, zl), yl, zl];
      }
    }
    // The ostium primum's middle: over the cushions, under the free edge.
    if (op.ry < 3 && s.closeOP < 0.9) pts['ostium-primuma'] = [xf(YF, OPC.z), YF + Math.max(0.12, (CUSH_TOP(s) + Math.min(op.ry, 1)) / 2), OPC.z];
    if (holes.length) {
      const z = Math.min(OSC.z, P.zcut - 0.1);
      pts['ostium-secunduma'] = [xf(OSC.y, z), OSC.y, z];
    }
    pts['zulo-obalaren-balbula'] = [xf(FOC.y + 0.05, FOC.z), FOC.y + 0.05, FOC.z];
    // The cushions' extensions closing the ostium primum: mint, along the edge's lowest part.
    if (s.closeOP > 0.01) {
      const r0 = opMem;
      // Only the band between the edge then and now (the rest is the membrane above).
      const band = cachedMesh('atria op band', [xp, op.ry, r0.ry, s.cut], () => twoSided(sheet(xp, OPC.y, OPC.z, (a) => rEll(op.ry, op.rz, a), 0, Math.PI, 48, 5, [-3, 0, 0], xf, (a) => rEll(r0.ry, r0.rz, a), s.cut)));
      items.push({ key: 'op-cap', id: 'kuxin-aurikulubentrikularrak', groups: ['endokardio-kuxinak'], mesh: band, color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme', opacity: clamp01(s.closeOP * 3), outline: false });
    }
  }

  // —— septum secundum: a thick rose crescent on the primum's right; its free edge arches over the foramen ovale ——
  if (s.secundum > 0.005) {
    const fo = foHole(s);
    const hole = (a: number) => foEdge(fo, a);
    const deps = [s.secundum, s.cut];
    const face = (dx: number, coarse: number) => sheet(XS + dx, fo.y, fo.z, hole, 0, Math.PI * 2, Math.round(110 / coarse), Math.round(20 / coarse), [XS + dx * 60, 0, -0.2], undefined, undefined, s.cut);
    const mesh = cachedMesh('atria secundum', deps, () => merge([face(-HS, 1), face(HS, 1)]));
    const hit = cachedMesh('atria secundum hit', deps, () => merge([face(-HS, 3), face(HS, 3)]));
    items.push({ key: 'secundum', id: 'septum-secundum', groups: ['aurikula-arteko-trenkada'], mesh, hit, color: K.secundum, deep: K.secundumDeep, tissue: 'muscle' });
    // Its thick free edge round the foramen, and its cut face at the front (the section line, when cut).
    const P = plane(XS, s.cut);
    const runs = runsOf(foRim(fo), ([, y, z]) => inside(P, y, z) && y > YF + 0.01);
    const front: V3[] = [];
    for (let i = 0; i <= 30; i++) {
      const y = lerp(YF, P.ryT, i / 30);
      if (inside(P, y, P.zcut) && !inFo(fo, y, P.zcut)) front.push([XS, y, P.zcut]);
    }
    // The foramen's rim glows as the foramen ovale; the cut face at the front is the septum's.
    if (s.secundum > 0.6 && runs.length) {
      const rim = runs.map((l) => ridge(l, HS, 10));
      items.push({ key: 'fo-rim', id: 'zulo-obala', groups: ['septum-secundum', 'aurikula-arteko-trenkada'], mesh: cachedMerge(rim.map((p) => p.mesh)), hit: cachedMerge(rim.map((p) => p.hit)), color: K.secundum, deep: K.secundumDeep, tissue: 'muscle', outline: false });
    }
    const lines = [...(s.secundum > 0.6 ? [] : runs), ...(front.length > 1 ? [front] : [])];
    if (lines.length) {
      const parts = lines.map((l) => ridge(l, HS, 10));
      items.push({ key: 'secundum-edge', id: 'septum-secundum', groups: ['aurikula-arteko-trenkada'], mesh: cachedMerge(parts.map((p) => p.mesh)), hit: cachedMerge(parts.map((p) => p.hit)), color: K.secundum, deep: K.secundumDeep, tissue: 'muscle', outline: false });
    }
    {
      // On its right face, halfway between the foramen's top and the roof.
      const z = Math.min(-0.05, P.zcut - 0.08);
      const top = Math.sqrt(Math.max(0, 1 - (z / P.rz) ** 2)) * P.ryT;
      const holeTop = fo.y + fo.ry * Math.sqrt(Math.max(0, 1 - ((z - fo.z) / fo.rz) ** 2));
      pts['septum-secundum'] = [XS - HS, (Math.min(holeTop, top) + top) / 2, z];
    }
    // The foramen named in its upper part, under the arch (the primum is named lower down, through it).
    // In a frontal section, in the gap just under the free edge, in the septum's own plane.
    if (s.secundum > 0.6) pts['zulo-obala'] = s.cut < ZC ? [XS, fo.y + 0.4 * fo.ry, P.zcut - 0.03] : [XS - HS, fo.y + 0.6 * fo.ry, fo.z - 0.02];
    // Birth, a patent foramen: where the valve's upper edge stops short of fusing, the slit between it and
    // septum secundum opens into the left atrium (a dark slot on septum secundum, just over the edge).
    if (s.press > 0.6 && s.patent) {
      const slit: V3[] = [];
      for (let i = 0; i <= 40; i++) {
        const z = lerp(SLIT_Z[0], SLIT_Z[1], i / 40);
        const y = stubTop(s, z) + 0.035;
        if (!inside(plane(xp), y, z) || slitAlong(z) < 0.45) continue;
        slit.push([XS + HS + 0.012, y, z]);
      }
      if (slit.length > 1) {
        items.push({ key: 'slit', id: 'zulo-obala', groups: ['zulo-obala'], ...ridge(slit, 0.02, 8), color: '#12070c', deep: '#000000', tissue: 'vessel', outline: false });
        // After birth the named communication is this residual slit, not the centre of the fetal
        // foramen (now covered by the valve). Use the opening we actually draw.
        pts['zulo-obala'] = slit[Math.floor(slit.length / 2)];
      }
    }
  }

  // —— septum spurium and the left venous valve on the right atrium's back wall, merging into septum secundum ——
  if (s.spurium > 0.005 && s.secundum > 0.3) {
    const k = clamp01(s.spurium);
    const merged = clamp01((k - 0.5) / 0.5);
    const xr = lerp(-0.42, XS - HS * 0.6, merged);
    const line = (y0: number, y1: number, zBack: number) =>
      Array.from({ length: 14 }, (_, i) => {
        const y = lerp(y0, y1, i / 13);
        const P = plane(xr);
        const zb = -Math.sqrt(Math.max(0, 1 - (y >= 0 ? y / P.ryT : y / P.ryB) ** 2)) * P.rz;
        return [xr, y, zb * 0.92 + zBack] as V3;
      });
    const sp = line(0.95, 0.05, 0.02);
    const lv = line(0.02, -0.85, 0.02);
    const tone = mixHex('#e9d5ff', K.secundum, merged);
    const tone2 = mixHex('#a78bfa', K.secundum, merged);
    items.push({ key: 'spurium', id: 'septum-spurium', ...ridge(sp, 0.06 * Math.min(1, k * 2), 8), color: tone, deep: '#7c5fd6', tissue: 'epithelium', opacity: 1 - 0.85 * merged });
    items.push({ key: 'lvv', id: 'ezkerreko-zain-balbula', ...ridge(lv, 0.05 * Math.min(1, k * 2), 8), color: tone2, deep: '#5b3fb8', tissue: 'epithelium', opacity: 1 - 0.85 * merged });
    pts['septum-spurium'] = sp[5];
    pts['ezkerreko-zain-balbula'] = lv[7];
  }
  pts['aurikula-arteko-trenkada'] = [XS, 0.5, -0.35];
  return { items, pts };
}

// ———————————————————————————— stage 5: the walls' two origins ————————————————————————————

type Opening = (key: string, id: string, os: { phi: number; th: number; ea: number; eb: number; out: V3 }[], k: number, red: boolean) => void;

function walls5(s: AtriaState, items: Item3[], pts: Record<string, V3>, opening: Opening, ra: number, la: number) {
  // The sinus venosus behind the right atrium, opening into it by the sinoatrial orifice (the violet strip);
  // taken into the back wall, it is gone as a sac and the smooth part spreads.
  if (s.sinus > 0.01) {
    const k = s.sinus;
    // Pressed against the back wall, flat front to back (it sinks into the wall as it is taken in).
    const w = chamber(220, 90, 1);
    const c: V3 = [w[0] * 0.92, w[1], w[2] - 0.08 - 0.2 * k];
    items.push({ key: 'sinus', id: 'zain-sinua', ...blobParts({ center: c, radii: [0.1 + 0.38 * k, 0.2 + 0.72 * k, 0.05 + 0.2 * k], rings: 14, sides: 20 }), color: K.smoothRA, deep: K.smoothDeep, tissue: 'vessel', opacity: Math.min(1, k * 1.6) });
    pts['zain-sinua'] = [c[0], c[1] - 0.25 * k, c[2]];
    const sea = lerp(10, 24, s.smoothWide);
    const ring = Array.from({ length: 41 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return chamber(222 + sea * Math.cos(a), 88 - 40 * Math.sin(a), 0.982);
    });
    items.push({ key: 'sa-rim', id: 'zulo-sinoaurikularra', ...ridge(ring, 0.026), color: '#1a0710', deep: '#000000', tissue: 'vessel', opacity: Math.min(1, k * 2) });
    pts['zulo-sinoaurikularra'] = chamber(222 - sea, 104, 0.975);
  } else if (s.walls || s.smoothWide > 0.01) {
    // Taken in: the sinus is the smooth part now.
    pts['zain-sinua'] = chamber(222 + 0.3 * lerp(10, 24, s.smoothWide), 76, 0.96);
  }
  opening('cs', 'sinu-koronarioa', [CS], s.cs, false);

  // Right atrium: the crista terminalis between the two parts, the sinus node at its top.
  if (s.crista > 0.01) {
    const cr = alongWall(CRISTA, 0.972, 30);
    const n = Math.max(2, Math.round(cr.length * s.crista));
    items.push({ key: 'crista', id: 'gandor-terminala', ...ridge(cr.slice(0, n), 0.055, 10), color: '#f08a4b', deep: '#7a2e10', tissue: 'muscle' });
    pts['gandor-terminala'] = cr[Math.min(n - 1, 17)];
  }
  if (s.node > 0.01) {
    const c = chamber(CRISTA[0][0] + 5, CRISTA[0][1] + 5, 0.955);
    items.push({ key: 'node', id: 'nodulu-sinusala', ...blobParts({ center: c, radii: [0.17 * s.node, 0.12 * s.node, 0.14 * s.node], rings: 10, sides: 14 }), color: '#ffd27a', deep: '#a36a00', tissue: 'nerve' });
    pts['nodulu-sinusala'] = c;
  }
  // Pectinate muscles: parallel ridges from the crista over the lateral wall towards the front (right),
  // over the left atrium's lateral wall (left); and each auricle, a pouch at the upper front.
  const pectinate = (right: boolean, k: number) => {
    const parts: { mesh: Mesh; hit: Mesh }[] = [];
    for (let i = 0; i < 9; i++) {
      const th = 36 + i * 13;
      const edge = 360 - phi0(th) - 5;
      const start = right ? CRISTA[2][0] + 4 : 360 - (CRISTA[2][0] + 4);
      const end = right ? edge : 360 - edge;
      const len = (0.75 + 0.25 * Math.sin(i * 1.7)) * k;
      const to = lerp(start, end, len);
      parts.push(ridge(alongWall([[start, th], [lerp(start, to, 0.5), th + 2.5], [to, th + 5]], 0.978, 12), 0.032, 7));
    }
    return parts;
  };
  if (s.pect > 0.01) {
    const parts = pectinate(true, s.pect);
    items.push({ key: 'pect', id: 'muskulu-pektinioak', groups: ['atal-trabekulatua'], mesh: cachedMerge(parts.map((p) => p.mesh)), hit: cachedMerge(parts.map((p) => p.hit)), color: '#ffa765', deep: '#7a2e10', tissue: 'muscle', opacity: ra });
    pts['muskulu-pektinioak'] = chamber(276, 75, 0.972);
    // A flattened ear-shaped pouch on the wall's upper front, not a ball.
    const c = chamber(302, 42, 1.0);
    items.push({ key: 'auricle', id: 'belarritxoa', groups: ['atal-trabekulatua'], ...blobParts({ center: c, radii: [0.14 + 0.16 * s.pect, 0.1 + 0.12 * s.pect, 0.16 + 0.16 * s.pect], axes: [[0.8, 0.45, 0.4], [-0.45, 0.89, 0], [-0.36, -0.2, 0.91]], rings: 14, sides: 20 }), color: T.atrium, deep: T.atriumDeep, tissue: 'muscle' });
    pts['belarritxoa'] = [c[0] - 0.08, c[1] + 0.06, c[2] + 0.06];
  }
  if (s.laPect > 0.01) {
    const parts = pectinate(false, s.laPect);
    items.push({ key: 'la-pect', id: 'muskulu-pektinioak', groups: ['ezkerreko-aurikularen-atal-trabekulatua'], mesh: cachedMerge(parts.map((p) => p.mesh)), hit: cachedMerge(parts.map((p) => p.hit)), color: mixHex('#ffa765', '#d8662a', 0.35), deep: '#7a2e10', tissue: 'muscle', opacity: la });
    pts['la-pect'] = chamber(80, 58, 0.972);
    const c = chamber(58, 42, 1.0);
    items.push({ key: 'la-auricle', id: 'ezkerreko-aurikularen-atal-trabekulatua', groups: ['belarritxoa'], ...blobParts({ center: c, radii: [0.12 + 0.14 * s.laPect, 0.1 + 0.1 * s.laPect, 0.14 + 0.14 * s.laPect], axes: [[0.8, 0.45, -0.4], [-0.45, 0.89, 0], [0.36, 0.2, 0.91]], rings: 14, sides: 20 }), color: mixHex(T.atrium, '#d8662a', 0.4), deep: T.atriumDeep, tissue: 'muscle' });
  }

  // Left atrium: the primitive pulmonary vein buds from the back wall, branches (2, then 4) to the lung
  // buds' veins, and is taken into the wall: four openings in the smooth part.
  if (s.lungs > 0.01) {
    const buds = LUNGS.map((c) => blobParts({ center: c, radii: [0.32, 0.62, 0.3], rings: 16, sides: 22 }));
    items.push({ key: 'lungs', id: 'birika-hastapenak', mesh: cachedMerge(buds.map((b) => b.mesh)), hit: cachedMerge(buds.map((b) => b.hit)), color: '#f4a6b8', deep: '#9a4a5e', tissue: 'epithelium', opacity: s.lungs });
    pts['birika-hastapenak'] = [LUNGS[0][0] + 0.12, LUNGS[0][1] - 0.2, LUNGS[0][2] + 0.18];
    // Their own veins (two in each bud), which the branches meet.
    const own = PVS.map((o, i) => tubeParts([o.out, mix3(o.out, LUNGS[PV_SIDE[i]], 0.55), [LUNGS[PV_SIDE[i]][0], o.out[1] + 0.05, LUNGS[PV_SIDE[i]][2]]], { radius: () => 0.05, ref: [0, 0, 1], sides: 10, capStart: true, capEnd: true }));
    items.push({ key: 'lung-veins', id: 'birika-zainak', groups: ['birika-hastapenak'], mesh: cachedMerge(own.map((r) => r.mesh)), hit: cachedMerge(own.map((r) => r.hit)), color: T.o2, deep: T.o2Deep, tissue: 'vessel', opacity: s.lungs });
    pts['lung-veins'] = mix3(PVS[0].out, LUNGS[0], 0.4);
  }
  if (s.pvGrow > 0.01 && s.pvIncorp < 0.999) {
    const k = s.pvIncorp;
    const paths = PVS.map((_, i) => trim(pvPath(i, k), s.pvGrow));
    const id = k < 0.5 ? 'birika-zain-primitiboa' : 'birika-zainak';
    const tubes = paths.map((p) => tubeParts(p, { radius: (u) => 0.1 - 0.02 * u, ref: [0, 0, 1], sides: 14, capEnd: true }));
    items.push({ key: 'pv-tree', id, mesh: cachedMerge(tubes.map((r) => r.mesh)), hit: cachedMerge(tubes.map((r) => r.hit)), color: mixHex(T.o2, '#ffb0b0', 0.15), deep: T.o2Deep, tissue: 'vessel' });
    // Its opening(s) in the wall: one, then four apart.
    const hk = Math.min(1, s.pvGrow * 4);
    const holes = PVS.map((o) => patch(lerp(PV_O.phi, o.phi, k), lerp(PV_O.th, o.th, k), lerp(8, o.ea, k) * hk, lerp(8, o.eb, k) * hk, 0.985));
    items.push({ key: 'pv-hole', id, mesh: cachedMerge(holes), color: '#12070c', deep: '#000000', tissue: 'vessel', outline: false });
    const trunk = trim(pvPath(0, k), Math.min(s.pvGrow, 0.3));
    pts['birika-zain-primitiboa'] = trunk[Math.floor(trunk.length * 0.7)];
    // The veins named at the first one's opening (the trunk's, until they part).
    pts['birika-zainak'] = chamber(lerp(PV_O.phi, PVS[0].phi, k), lerp(PV_O.th, PVS[0].th, k), 0.96);
  } else if (s.pvIncorp >= 0.999 && s.pulmonary < 0.01) {
    opening('pv', 'birika-zainak', PVS, 1, true);
  }
  if (s.laSmooth > 0.01) {
    const m = s.laSmooth;
    items.push({ key: 'la-smooth', id: 'ezkerreko-aurikularen-atal-lisoa', mesh: patch(PV_O.phi, PV_O.th, 15 * m, 32 * m, 0.99), color: mixHex(T.o2, '#5a1820', 0.12), deep: T.o2Deep, tissue: 'epithelium', outline: false, opacity: Math.min(1, m * 1.5) });
    pts['ezkerreko-aurikularen-atal-lisoa'] = chamber(PV_O.phi, PV_O.th, 0.96);
  }
  if (s.meso > 0.01) {
    const sheetAt = (coarse: number) => grid(Math.round(16 / coarse), Math.round(20 / coarse), (u, v) => [lerp(0.3, 1.45, u), lerp(-0.8, 0.95, v), -1.12 - 0.08 * Math.sin(u * Math.PI)], [0.9, 0, 3]);
    items.push({ key: 'meso', id: 'mesokardio-dortsala', mesh: cachedMesh('atria meso', [], () => twoSided(sheetAt(1))), hit: cachedMesh('atria meso hit', [], () => sheetAt(3)), color: '#d98a9a', deep: '#7a3a4a', tissue: 'membrane', thin: 1, opacity: 0.55 * s.meso, outline: false });
    pts['mesokardio-dortsala'] = [1.25, -0.55, -1.15];
  }
}

// ———————————————————————————— blood ————————————————————————————

type Cells = { cells: Float32Array; gates: Float32Array };
function cellSet(n: number, pick: (i: number) => boolean, jit: number): Cells {
  const idx = Array.from({ length: n }, (_, i) => i).filter(pick);
  const cells = new Float32Array(idx.length * 4);
  const gates = new Float32Array(idx.length);
  idx.forEach((i, k) => {
    cells.set([i / n, Math.sin(i * 12.9) * 0.07 * jit, Math.cos(i * 7.3) * 0.05 * jit, Math.sin(i * 3.1) * 0.07 * jit], k * 4);
    gates[k] = ((i * 0.618034) % 1) * 0.85;
  });
  return { cells, gates };
}
/** Fetal blood is mixed (every third cell poorly oxygenated); after birth, all blue on the right, all red on the left. */
const SETS = {
  mixO2: cellSet(14, (i) => i % 3 !== 0, 0.45),
  mixDe: cellSet(14, (i) => i % 3 === 0, 0.45),
  red: cellSet(12, () => true, 0.7),
  blue: cellSet(12, () => true, 0.7),
  few: cellSet(6, () => true, 0.25),
};

const CELL = () => cachedBlob({ center: [0, 0, 0], radii: [0.05, 0.036, 0.05], rings: 6, sides: 8 });
/** Smaller cells squeezing through the patent slit (between the valve and septum secundum). */
const CELL_SMALL = () => cachedBlob({ center: [0, 0, 0], radii: [0.03, 0.022, 0.03], rings: 6, sides: 8 });
/** Speed of the cells: room units per unit of stage time. */
const SPEED = 30;

const IVC_IN: V3[] = [IVC.out, [-0.7, -1.45, -0.75], chamber(IVC.phi, IVC.th, 0.9)];
const SVC_IN: V3[] = [SVC.out, [-0.7, 1.6, -0.7], chamber(SVC.phi, SVC.th, 0.88)];
const DOWN_L: V3[] = [[0.5, -0.4, 0.05], [0.48, YF + 0.05, 0.05], [0.44, YF - 0.65, 0.08]];
const DOWN_R: V3[] = [[-0.55, -0.6, 0.0], [-0.46, YF + 0.05, 0.05], [-0.42, YF - 0.65, 0.08]];

/** The high way right → left: under septum secundum's edge (the foramen ovale, once it is grown), up between the two septa, out through the ostium secundum. */
function highWay(s: AtriaState): V3[] {
  const fo = foHole(s);
  // The lowest it must go to pass under septum secundum's free edge (at the foramen's top) — no lower than the foramen's middle.
  const yUnder = Math.max(FOC.y, Math.min(OSC.y, fo.y + fo.ry * 0.4));
  const mid = Math.round(yUnder * 20) / 20;
  const xBetween = (XS + HS + xPrimum(s)) / 2;
  return [...IVC_IN, [-0.75, Math.min(mid, -0.2), -0.2], [-0.34, mid, -0.12], [xBetween, mid, -0.14], [xBetween, Math.max(mid, 0.18), -0.22], [xBetween, OSC.y - 0.06, OSC.z], [0.3, OSC.y, OSC.z], [0.85, 0.15, -0.12], ...DOWN_L];
}
const LOW_WAY: V3[] = [...IVC_IN, [-0.6, -0.62, -0.12], [-0.18, YF + 0.4, -0.03], [0.2, YF + 0.4, -0.03], [0.75, -0.5, 0.0], ...DOWN_L];
const RA_DOWN: V3[] = [...SVC_IN, [-0.85, 0.2, -0.1], ...DOWN_R];
const PV_IN = PVS.map((o, i): V3[] => [o.out, chamber(o.phi, o.th, 0.9), [0.95 - 0.1 * (i % 2), i < 2 ? 0.3 : -0.35, -0.2], ...DOWN_L]);
const SLIT: V3[] = [...IVC_IN, [-0.75, -0.3, -0.2], [-0.34, -0.3, -0.16], [XS + HS + 0.012, -0.2, -0.17], [XS + HS + 0.012, 0.24, -0.17], [0.2, 0.36, -0.17], [0.85, 0.15, -0.12], ...DOWN_L];

function streams(s: AtriaState, f: AtriaFlow): Item3[] {
  const out: Item3[] = [];
  const cell = CELL();
  const add = (key: string, pts: V3[], grow: number, sets: [Cells, string, string][], mesh = cell) => {
    if (grow <= 0.01) return;
    const route = vesselRouteOf(pts);
    const run = { route, phase: (f.phase * SPEED) / routeLength(route), grow: clamp01(grow) };
    for (const [set, color, deep] of sets) out.push({ key: `flow-${key}-${color}`, mesh, color, deep, tissue: 'skin', stream: { ...run, ...set } });
  };
  const mixed: [Cells, string, string][] = [[SETS.mixO2, T.o2, T.o2Deep], [SETS.mixDe, T.deo2, T.deo2Deep]];
  add('low', LOW_WAY, f.low, mixed);
  add('high', highWay(s), f.high, mixed);
  add('ra-down', RA_DOWN, f.down, f.born > 0.5 ? [[SETS.blue, T.deo2, T.deo2Deep]] : mixed);
  PV_IN.forEach((p, i) => add(`pv${i}`, p, f.born * s.pulmonary, [[SETS.red, T.o2, T.o2Deep]]));
  add('slit', SLIT, f.slit, [[SETS.few, T.deo2, T.deo2Deep]], CELL_SMALL());
  return out;
}
