'use client';

import { Callouts, Note, type SceneProps } from '@/components/kit';
import { Loading3D, Stage3D } from '@/components/kit/three/Stage3D';
import { seg } from '@/lib/sim/anim';
import { add, cross, deg, dot, mix3, mul, norm, sub, type M4, type V3 } from '@/lib/three-d/math';
import { merge, tube, type Mesh } from '@/lib/three-d/mesh';
import type { Clip3, Hole3, Item3, Scene3 } from '@/lib/three-d/scene';
import { capsule, ellipsoid, mirrorX, smin, surfaceAlong, surfaceMesh, type SDF } from '@/lib/three-d/sdf';
import { geoOf, geoSlot, useGeoReady } from '@/lib/three-d/offthread';
import { CAL_T } from './Calvaria';
import { Q, vis } from './common';

/**
 * 8:buru-ganga in 3D (notes w8/3.1.1). The newborn vault as one dome over the brain, on its cartilage
 * floor, with the small face in front. Each flat bone spreads from its ossification centre through the
 * membrane, its edge streaked with spicules; where two bones meet a narrow suture is left, where more
 * than two meet a wider fontanelle — both of them the blue connective tissue. Seen round, the six
 * fontanelles sit in one picture: bregma on top in front, lambda behind, the sphenoidal and mastoid
 * ones low on each side. At birth the parietals ride over their neighbours; then the posterior
 * fontanelle closes first (1–2 months), the anterior one last (18 months).
 *
 * Frame: x = the baby's left, y up, z forward (the face).
 */

/** Centre of the vault, the origin every clip measures directions from. */
const O: V3 = [0, -0.05, 0];

type BoneKey = 'FL' | 'FR' | 'PL' | 'PR' | 'OC' | 'TL' | 'TR' | 'SL' | 'SR';
interface BoneDef {
  key: BoneKey;
  id: string;
  dir: V3;
  /** Weight of its share of the dome (larger = reaches farther). */
  w: number;
}

const BONES: BoneDef[] = [
  { key: 'FL', id: 'hezur-frontala', dir: norm([0.34, 0.42, 0.84]), w: 1 },
  { key: 'FR', id: 'hezur-frontala', dir: norm([-0.34, 0.42, 0.84]), w: 1 },
  { key: 'PL', id: 'hezur-parietala', dir: norm([0.8, 0.52, -0.2]), w: 1.14 },
  { key: 'PR', id: 'hezur-parietala', dir: norm([-0.8, 0.52, -0.2]), w: 1.14 },
  { key: 'OC', id: 'okzipitalaren-ezkata', dir: norm([0, 0.12, -1]), w: 1.02 },
  { key: 'TL', id: 'tenporalaren-ezkata', dir: norm([0.97, -0.34, 0.02]), w: 0.72 },
  { key: 'TR', id: 'tenporalaren-ezkata', dir: norm([-0.97, -0.34, 0.02]), w: 0.72 },
  { key: 'SL', id: 'esfenoidesaren-hego-handia', dir: norm([0.8, -0.36, 0.5]), w: 0.5 },
  { key: 'SR', id: 'esfenoidesaren-hego-handia', dir: norm([-0.8, -0.36, 0.5]), w: 0.5 },
];
const idx = (k: BoneKey) => BONES.findIndex((b) => b.key === k);

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));
const dirOf = (x: number, y: number, z: number): V3 => {
  const dx = x - O[0];
  const dy = y - O[1];
  const dz = z - O[2];
  const l = Math.hypot(dx, dy, dz) || 1;
  return [dx / l, dy / l, dz / l];
};
/** Weighted angular distance to each centre: the bones share the dome like this. */
const scores = (q: V3, out: number[]) => {
  for (let i = 0; i < BONES.length; i++) out[i] = Math.acos(clamp1(dot(q, BONES[i].dir))) / BONES[i].w;
  return out;
};

// ——— The head ———
/**
 * The newborn vault: smooth and egg-shaped from above (widest across the parietal eminences, behind
 * the middle; narrower at the forehead), a little flatter on top. No separate bumps: they read as lobes.
 */
const head: SDF = (x, y, z) => {
  const zz = z + 0.04;
  const rx = 0.8 + 0.12 * Math.exp(-(((zz + 0.18) / 0.62) ** 2)) - 0.05 * smooth(0.35, 0.95, zz);
  const ry = 0.84 - 0.04 * smooth(0.2, 0.9, zz);
  const q = Math.hypot(x / rx, (y + 0.02) / ry, zz / 1.07);
  return (q - 1) * 0.82;
};
const orbits = [ellipsoid([0.29, -0.21, 0.84], [0.17, 0.155, 0.2]), ellipsoid([-0.29, -0.21, 0.84], [0.17, 0.155, 0.2])];
const orbitCut = (x: number, y: number, z: number) => Math.min(orbits[0](x, y, z), orbits[1](x, y, z));
/** How low the vault reaches, by direction: the orbital roofs in front, the squamae at the sides, the occiput behind. */
const yLow = (q: V3) => -0.42 + 0.22 * smooth(0.45, 0.85, q[2]) - 0.12 * smooth(-0.35, -0.85, q[2]);
function smooth(a: number, b: number, x: number) {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

const BONE_T = 0.05;
const GAP = 0.03;

const sc = new Array<number>(BONES.length);
/** Field of bone i: the shell, inside its share of the dome, a suture's width from the next one. */
const boneField = (i: number): SDF => (x, y, z) => {
  const h = head(x, y, z);
  const shell = Math.max(h, -(h + BONE_T));
  const q = dirOf(x, y, z);
  scores(q, sc);
  let other = Infinity;
  for (let j = 0; j < sc.length; j++) if (j !== i && sc[j] < other) other = sc[j];
  const own = (sc[i] - other + GAP) * 0.95;
  return Math.max(shell, own, yLow(q) - y, -orbitCut(x, y, z));
};

/** A strip of connective tissue between bones a and b (a little below the bone surface: a groove). */
const sutureField = (pairs: [number, number][]): SDF => (x, y, z) => {
  const h = head(x, y, z);
  const shell = Math.max(h + 0.004, -(h + 0.032));
  const q = dirOf(x, y, z);
  scores(q, sc);
  let best = Infinity;
  for (const [a, b] of pairs) {
    let other = Infinity;
    for (let j = 0; j < sc.length; j++) if (j !== a && j !== b && sc[j] < other) other = sc[j];
    const d = Math.max((Math.abs(sc[a] - sc[b]) - GAP * 1.6) * 0.95, (Math.max(sc[a], sc[b]) - other) * 0.95);
    if (d < best) best = d;
  }
  return Math.max(shell, best, yLow(q) - y, -orbitCut(x, y, z));
};

/** The membrane the bones grow in: the whole dome, under them. */
const membraneField: SDF = (x, y, z) => {
  const h = head(x, y, z);
  const q = dirOf(x, y, z);
  // Thick enough for its mesh step (0.04): a thinner shell meshes with pinholes.
  return Math.max(h + 0.012, -(h + 0.1), yLow(q) - y, -orbitCut(x, y, z));
};

// ——— Fontanelles: found where their bones meet (equal shares), not placed by hand ———
interface FontDef {
  id: string;
  bones: BoneKey[];
  /** Kite extents at birth (front, back, side), in tangent units. */
  size: [number, number, number];
}
const FONTS: FontDef[] = [
  { id: 'aurreko-fontanela', bones: ['FL', 'FR', 'PL', 'PR'], size: [0.3, 0.2, 0.16] },
  { id: 'atzeko-fontanela', bones: ['PL', 'PR', 'OC'], size: [0.11, 0.045, 0.09] },
  { id: 'fontanela-esfenoidala', bones: ['FL', 'PL', 'TL', 'SL'], size: [0.085, 0.07, 0.075] },
  { id: 'fontanela-esfenoidala', bones: ['FR', 'PR', 'TR', 'SR'], size: [0.085, 0.07, 0.075] },
  { id: 'fontanela-mastoidea', bones: ['PL', 'OC', 'TL'], size: [0.07, 0.085, 0.075] },
  { id: 'fontanela-mastoidea', bones: ['PR', 'OC', 'TR'], size: [0.07, 0.085, 0.075] },
];

function junction(keys: BoneKey[]): V3 {
  const ids = keys.map(idx);
  const s = new Array<number>(BONES.length);
  const cost = (q: V3) => {
    scores(q, s);
    let lo = Infinity;
    let hi = -Infinity;
    for (const i of ids) {
      lo = Math.min(lo, s[i]);
      hi = Math.max(hi, s[i]);
    }
    let other = Infinity;
    for (let j = 0; j < s.length; j++) if (!ids.includes(j)) other = Math.min(other, s[j]);
    return hi - lo + Math.max(0, hi - other) * 4;
  };
  // Start at the mean of the centres, then a shrinking pattern search on the sphere.
  let q = norm(ids.reduce<V3>((a, i) => add(a, BONES[i].dir), [0, 0, 0]));
  let best = cost(q);
  for (let step = 0.2; step > 1e-4; step *= 0.6)
    for (let it = 0; it < 30; it++) {
      let moved = false;
      for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as V3[]) {
        const c = norm(add(q, mul(d, step)));
        const v = cost(c);
        if (v < best) {
          best = v;
          q = c;
          moved = true;
        }
      }
      if (!moved) break;
    }
  return q;
}

const FONT_AT = FONTS.map((f) => {
  const c = junction(f.bones);
  // Long axis forward (along the metopic/sagittal line on top; along the squamous line at the sides).
  const u = norm(sub([0, 0, 1], mul(c, c[2])));
  const v = norm(cross(c, u));
  return { ...f, c, u, v };
});

const kite = (k: number, f: (typeof FONT_AT)[number]): Hole3 => ({ c: f.c, u: f.u, v: f.v, front: f.size[0] * k, back: f.size[1] * k, side: f.size[2] * k });

/** A patch of the membrane round a fontanelle (its own mesh, so it can be named and glow). */
const fontField = (c: V3, r: number): SDF => (x, y, z) => {
  const h = head(x, y, z);
  const q = dirOf(x, y, z);
  return Math.max(h + 0.002, -(h + 0.024), Math.acos(clamp1(dot(q, c))) - r);
};

// ——— Context: the cartilage floor, the face ———
const baseF = ellipsoid([0, -0.42, -0.04], [0.76, 0.17, 0.96]);
const faceF: SDF = (x, y, z) => {
  const ax = Math.abs(x);
  // Maxilla, the brow band with the orbital rims, the cheekbones and their arches back to the ear.
  let d = ellipsoid([0, -0.47, 0.72], [0.38, 0.2, 0.26])(x, y, z);
  d = smin(d, ellipsoid([0, -0.2, 0.76], [0.58, 0.16, 0.26])(x, y, z), 0.08);
  d = smin(d, ellipsoid([0.42, -0.34, 0.62], [0.14, 0.12, 0.17])(ax, y, z), 0.07);
  d = smin(d, capsule([0.48, -0.37, 0.5], [0.7, -0.39, 0.06], 0.045)(ax, y, z), 0.05);
  // Nasal bones, the alveolar ridge with the tooth germs inside.
  d = smin(d, ellipsoid([0, -0.29, 0.97], [0.075, 0.13, 0.07])(x, y, z), 0.04);
  // The mandible: a U under the maxilla, its short rami up to the joint in front of the ear.
  const jaw = Math.max(ellipsoid([0, -0.74, 0.56], [0.4, 0.1, 0.36])(x, y, z), -ellipsoid([0, -0.72, 0.4], [0.32, 0.2, 0.34])(x, y, z));
  d = Math.min(d, smin(jaw, capsule([0.37, -0.74, 0.3], [0.56, -0.5, 0.08], 0.055)(ax, y, z), 0.05));
  // The orbits (big at birth) and the nasal aperture.
  d = Math.max(d, -orbitCut(x, y, z), -ellipsoid([0, -0.45, 0.98], [0.085, 0.11, 0.15])(x, y, z));
  return d;
};
/** External acoustic meatus: a dark ring opening low on each side (no mastoid process yet at birth). */
const earF: SDF = (x, y, z) => ellipsoid([0.74, -0.5, 0.0], [0.06, 0.07, 0.07])(Math.abs(x), y, z);

interface Pair {
  m: Mesh;
  h: Mesh;
}
interface Geo {
  bones: Pair[];
  maxAng: number[];
  centres: Mesh[];
  spicules: Mesh[];
  sutures: { id: string; groups: string[]; m: Pair }[];
  fonts: Pair[];
  membrane: Pair;
  ear: Pair;
  base: Pair;
  face: Pair;
}

/** The dome sampled once (direction → surface point), for the bounding boxes of its parts. */
let samples: { q: V3; p: V3 }[] | null = null;
function domeSamples() {
  if (samples) return samples;
  samples = [];
  for (let a = 0; a < 72; a++)
    for (let b = 0; b <= 36; b++) {
      const th = (a / 72) * Math.PI * 2;
      const ph = (b / 36) * Math.PI;
      const q: V3 = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      samples.push({ q, p: surfaceAlong(head, O, q, 2).p });
    }
  return samples;
}

/** Bounding box of the part of the shell whose directions satisfy `inside`. */
function boxOf(inside: (q: V3, p: V3) => boolean): [V3, V3] {
  const lo: [number, number, number] = [Infinity, Infinity, Infinity];
  const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const { q, p } of domeSamples()) {
    if (!inside(q, p)) continue;
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p[k] - 0.1);
      hi[k] = Math.max(hi[k], p[k] + 0.1);
    }
  }
  return [lo, hi];
}

const flip = (p: Pair): Pair => ({ m: mirrorX(p.m), h: mirrorX(p.h) });

const mk = (f: SDF, lo: V3, hi: V3, step: number, hitStep = 0.07): Pair => {
  const pad = hitStep * 0.45;
  return {
    m: surfaceMesh(f, lo, hi, step),
    h: surfaceMesh((x, y, z) => f(x, y, z) - pad, [lo[0] - pad, lo[1] - pad, lo[2] - pad], [hi[0] + pad, hi[1] + pad, hi[2] + pad], hitStep),
  };
};
const ns = new Array<number>(BONES.length);
const nearest = (q: V3) => {
  scores(q, ns);
  let k = 0;
  for (let j = 1; j < ns.length; j++) if (ns[j] < ns[k]) k = j;
  return k;
};
const lowOk = (q: V3, p: V3) => p[1] > yLow(q) - 0.05;

/** Built in parts (each cached), so the idle-time prebuild never blocks for long. */
const part: Partial<Geo> = {};

function buildBones() {
  if (part.bones) return;
  // The right bones are the left ones mirrored (the vault is symmetrical).
  const bones: Pair[] = [];
  BONES.forEach((b, i) => {
    if (b.key[1] === 'R') {
      bones[i] = flip(bones[idx(`${b.key[0]}L` as BoneKey)]);
      return;
    }
    const [lo, hi] = boxOf((q, p) => nearest(q) === i && lowOk(q, p));
    bones[i] = mk(boneField(i), lo, hi, 0.024);
  });
  // How far (angle) each bone reaches: its growth runs from 0 to there.
  const maxAng = bones.map((b, i) => {
    let m = 0;
    for (let v = 0; v < b.m.pos.length; v += 3) m = Math.max(m, Math.acos(clamp1(dot(dirOf(b.m.pos[v], b.m.pos[v + 1], b.m.pos[v + 2]), BONES[i].dir))));
    return m;
  });
  Object.assign(part, { bones, maxAng });
}

function buildMarks() {
  if (part.centres) return;
  buildBones();
  const maxAng = part.maxAng!;
  // Ossification centres: a small boss on the surface at each centre; spicules: arcs radiating from it.
  const centres: Mesh[] = [];
  const spicules: Mesh[] = [];
  BONES.forEach((b, i) => {
    const at = surfaceAlong(head, O, b.dir, 2);
    centres.push(surfaceMesh(ellipsoid(at.p, [0.055, 0.055, 0.055]), sub(at.p, [0.08, 0.08, 0.08]), add(at.p, [0.08, 0.08, 0.08]), 0.012));
    const ref = norm(cross(b.dir, Math.abs(b.dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const tubes: Mesh[] = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + i;
      const side = add(mul(ref, Math.cos(a)), mul(cross(b.dir, ref), Math.sin(a)));
      const path: V3[] = [];
      for (let u = 0; u <= 12; u++) {
        const ang = (u / 12) * maxAng[i] * 0.95;
        const q = norm(add(mul(b.dir, Math.cos(ang)), mul(side, Math.sin(ang))));
        const p = surfaceAlong(head, O, q, 2).p;
        if (p[1] < yLow(q) + 0.02 || nearest(q) !== i) break;
        path.push(add(p, mul(q, 0.004)));
      }
      if (path.length >= 3) tubes.push(tube(path, { radius: (u) => 0.0075 * (1 - 0.5 * u), ref: b.dir, sides: 5 }));
    }
    spicules.push(merge(tubes));
  });
  Object.assign(part, { centres, spicules });
}

function buildSutures() {
  if (part.sutures) return;
  const s = new Array<number>(BONES.length);
  const P = (a: BoneKey, b: BoneKey): [number, number] => [idx(a), idx(b)];
  // Paired sutures are built on the left and mirrored.
  const sutureDefs: { id: string; groups: string[]; pairs: [number, number][]; both?: boolean }[] = [
    { id: 'joskura-metopikoa', groups: ['joskurak'], pairs: [P('FL', 'FR')] },
    { id: 'joskura-koronala', groups: ['joskurak'], pairs: [P('FL', 'PL')], both: true },
    { id: 'joskura-sagitala', groups: ['joskurak'], pairs: [P('PL', 'PR')] },
    { id: 'joskura-lanbdoidea', groups: ['joskurak'], pairs: [P('PL', 'OC')], both: true },
    { id: 'joskurak', groups: [], pairs: [P('PL', 'TL'), P('FL', 'SL'), P('PL', 'SL'), P('TL', 'SL'), P('OC', 'TL')], both: true },
  ];
  const sutures = sutureDefs.map((d) => {
    const [lo0, hi] = boxOf((q, p) => {
      if (!lowOk(q, p)) return false;
      scores(q, s);
      const sorted = [...s].sort((x, y) => x - y);
      return d.pairs.some(([a, b]) => Math.max(s[a], s[b]) <= sorted[1] + 1e-9 && Math.abs(s[a] - s[b]) < 0.12);
    });
    // Only the left half's box for the paired ones.
    const lo: V3 = d.both ? [Math.max(lo0[0], -0.12), lo0[1], lo0[2]] : lo0;
    const m = mk(sutureField(d.pairs), lo, hi, 0.018);
    return { id: d.id, groups: d.groups, m: d.both ? { m: merge([m.m, mirrorX(m.m)]), h: merge([m.h, mirrorX(m.h)]) } : m };
  });
  part.sutures = sutures;
}

function buildFonts() {
  if (part.fonts) return;
  const fonts: Pair[] = [];
  FONT_AT.forEach((f, i) => {
    // The right lateral fontanelles (3, 5) are the left ones (2, 4) mirrored.
    if (i === 3 || i === 5) {
      fonts[i] = flip(fonts[i - 1]);
      return;
    }
    const p = surfaceAlong(head, O, f.c, 2).p;
    const r = Math.max(...f.size) + 0.03;
    fonts[i] = mk(fontField(f.c, r), sub(p, [r + 0.06, r + 0.06, r + 0.06]), add(p, [r + 0.06, r + 0.06, r + 0.06]), 0.016);
  });
  part.fonts = fonts;
}

function buildContext() {
  if (part.face) return;
  Object.assign(part, {
    membrane: mk(membraneField, [-1.1, -0.65, -1.25], [1.1, 1.0, 1.15], 0.04, 0.1),
    ear: mk(earF, [-0.86, -0.62, -0.12], [0.86, -0.38, 0.12], 0.02, 0.06),
    base: mk(baseF, [-0.8, -0.62, -1.02], [0.8, -0.22, 0.95], 0.045, 0.1),
    face: mk(faceF, [-0.66, -0.86, 0.2], [0.66, -0.05, 1.08], 0.032, 0.08),
  });
}

function build(): Geo {
  buildBones();
  buildMarks();
  buildSutures();
  buildFonts();
  buildContext();
  return part as Geo;
}

export const GEO = geoSlot('calvaria', build);

const shift = (d: V3): M4 => {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  m[12] = d[0];
  m[13] = d[1];
  m[14] = d[2];
  return m;
};
/** Moulding: the whole head narrower and longer, and one bone's own shift on top. */
const mould = (k: number, d: V3): M4 => {
  const m = shift(mul(d, k));
  m[0] = 1 - 0.06 * k;
  m[5] = 1 + 0.03 * k;
  m[10] = 1 + 0.02 * k;
  return m;
};

/**
 * Camera keys: [t, yaw°, elevation°, distance]. Yaw 0 = from the front, 90 = from the left, 180 = from
 * behind. The face stays in sight wherever the step allows: it is what tells a skull at a glance.
 */
const CAM: [number, number, number, number][] = [
  [0, 50, 12, 6.0],
  [CAL_T.grow, 56, 14, 5.8],
  [CAL_T.bones, 88, 52, 6.0],
  [CAL_T.sutures, 72, 60, 6.0],
  [CAL_T.fontanelles, 100, 52, 6.0],
  [CAL_T.side, 90, 8, 5.8],
  [CAL_T.birth, 58, 46, 6.0],
  [CAL_T.after, 104, 52, 6.0],
];

function camAt(t: number) {
  // The key of the step we are in; the camera turns to it early in the step (0.04 of the stage), then holds.
  let k = 0;
  while (k < CAM.length - 1 && t >= CAM[k + 1][0]) k++;
  const [t1, y1, e1, d1] = CAM[k];
  const [, y0, e0, d0] = CAM[Math.max(0, k - 1)];
  const u = k === 0 ? 1 : seg(t, t1, t1 + 0.04);
  return { yaw: deg(y0 + (y1 - y0) * u), elev: deg(e0 + (e1 - e0) * u), dist: d0 + (d1 - d0) * u, u: k === 0 ? 1 : u };
}

export function buildCalvaria(t: number, reduced: boolean) {
  const G = geoOf(GEO);
  const grow = reduced ? (t >= CAL_T.grow + 0.01 ? 1 : 0) : seg(t, CAL_T.grow + 0.01, CAL_T.bones + 0.03);
  const growing = vis(t, CAL_T.grow, CAL_T.bones + 0.04);
  const mold = seg(t, CAL_T.birth + 0.01, CAL_T.birth + 0.05) * (1 - seg(t, CAL_T.after, CAL_T.after + 0.02));
  const pfClose = seg(t, CAL_T.after + 0.015, CAL_T.after + 0.04);
  const afClose = seg(t, CAL_T.after + 0.07, CAL_T.after + 0.098);
  const sutures = vis(t, CAL_T.sutures - 0.01);
  const fontSize = FONT_AT.map((f) =>
    f.id === 'aurreko-fontanela' ? (1 - afClose) * (1 - 0.35 * mold) : f.id === 'atzeko-fontanela' ? (1 - pfClose) * (1 - 0.4 * mold) : 1 - 0.3 * mold,
  );
  const holes = FONT_AT.map((f, i) => kite(fontSize[i], f));
  const items: Item3[] = [];
  items.push(
    { key: 'base', id: 'kondrokraneoa', quiet: true, mesh: G.base.m, hit: G.base.h, color: Q.cart, deep: Q.cartDeep, tissue: 'cartilage' },
    { key: 'face', id: 'errai-kraneoa', quiet: true, mesh: G.face.m, hit: G.face.h, color: '#dccfb2', deep: '#8a7a58', tissue: 'bone' },
    { key: 'ear', mesh: G.ear.m, hit: G.ear.h, color: '#1a1410', deep: '#000000', tissue: 'bone', outline: false },
    { key: 'membrane', id: 'buru-ganga', quiet: true, mesh: G.membrane.m, hit: G.membrane.h, color: '#a9cbe0', deep: '#3a6884', tissue: 'membrane', outline: false },
  );
  BONES.forEach((b, i) => {
    if (grow < 0.005) return;
    // At birth the parietals ride up and over the frontal and occipital plates, which slip under them.
    const d: V3 = b.key[0] === 'P' ? add(mul(b.dir, 0.05), [0, 0.02, 0]) : b.key === 'OC' || b.key[0] === 'F' ? mul(b.dir, -0.025) : [0, 0, 0];
    const matrix = mould(mold, d);
    const clip: Clip3 = { o: O, holes, ...(grow < 0.999 ? { grow: { dir: b.dir, cos: Math.cos(grow * G.maxAng[i] * 1.04), spicules: 1 } } : {}) };
    items.push({ key: `bone-${b.key}`, id: b.id, groups: ['buru-ganga'], mesh: G.bones[i].m, hit: G.bones[i].h, matrix, color: Q.bone, deep: Q.boneDeep, tissue: 'bone', clip, outline: grow > 0.999 });
    // (No rims while the plates grow: the spicule tips would each get a dark dot.)
    if (growing > 0.01) {
      items.push({ key: `spic-${b.key}`, id: 'hezur-espikulak', groups: ['buru-ganga'], mesh: G.spicules[i], matrix, color: '#fff6dc', deep: '#a8915e', tissue: 'bone', show: growing, clip: { o: O, grow: { dir: b.dir, cos: Math.cos(grow * G.maxAng[i] * 1.04) } }, outline: false });
      items.push({ key: `ctr-${b.key}`, id: 'hezurtzapen-zentroak', mesh: G.centres[i], matrix, color: Q.centre, deep: '#5a3410', tissue: 'bone', show: growing });
    }
  });
  if (sutures > 0.01)
    G.sutures.forEach((s, i) =>
      // These strips sit just below bone: an inflated back-face outline pokes through the plates
      // as black teeth. Their blue surface already marks the groove without an extra rim.
      items.push({ key: `sut${i}`, id: s.id, groups: s.groups, mesh: s.m.m, hit: s.m.h, matrix: mould(mold, [0, 0, 0]), color: Q.suture, deep: '#1a4a6a', tissue: 'membrane', show: sutures, clip: { o: O, holes }, outline: false }),
    );
  if (sutures > 0.01)
    FONT_AT.forEach((f, i) => {
      if (fontSize[i] < 0.01) return;
      items.push({ key: `font${i}`, id: f.id, groups: ['fontanelak'], mesh: G.fonts[i].m, hit: G.fonts[i].h, matrix: mould(mold, [0, 0, 0]), color: '#7cc8f0', deep: '#1a4a6a', tissue: 'membrane', show: sutures, clip: { o: O, keep: holes[i] }, outline: false });
    });
  const c = camAt(t);
  const target: V3 = [0, 0.02, 0];
  const eye = add(target, [Math.sin(c.yaw) * Math.cos(c.elev) * c.dist, Math.sin(c.elev) * c.dist, Math.cos(c.yaw) * Math.cos(c.elev) * c.dist]);
  const scene: Scene3 = { camera: { eye, target, fov: 30, shift: [0, 8] }, items };
  // The names step out while the camera turns (their sides change) and come back once it has settled.
  const calm = Math.min(1, Math.abs(2 * c.u - 1) * 1.6);
  return { scene, eye, grow, growing, mold, pfClose, afClose, sutures, fontSize, calm };
}

/** A point on the vault surface in a direction (for name tips), shifted with the moulding like the bones. */
const onVault = (q: V3, out = 0.006): V3 => add(surfaceAlong(head, O, norm(q), 2).p, mul(norm(q), out));

function Calvaria3DView({ t, reduced }: SceneProps) {
  const { scene, grow, growing, mold, pfClose, afClose, sutures, fontSize, calm } = buildCalvaria(t, reduced);
  const mon = afClose > 0.5 ? '18. hilabetea' : pfClose > 0.5 ? '1.–2. hilabetea' : 'jaiotzean';
  const bones = vis(t, CAL_T.bones);
  const sides = vis(t, CAL_T.side);
  const mirror = (q: V3): V3 => [-q[0], q[1], q[2]];
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="none" />
      <Stage3D scene={scene} axes={{ up: 'goia', front: 'aurrea', side: 'ezkerra', sideDir: [1, 0, 0], edges: { up: 'Goia', down: 'Behea', front: 'Aurrea', back: 'Atzea', side: 'Ezkerra', otherSide: 'Eskuina' } }}>
        {(at, camera) => {
          // Follow the actual camera, including manual orbit and the structure tour.
          const view = norm(sub(camera.eye, O));
          const sd = view[0] >= 0 ? 1 : -1;
          const facing = (q: V3) => dot(norm(q), view) > 0.12;
          const shown = (q: V3, k: number) => (facing(q) ? k : 0);
          const pick = (a: V3, b: V3): V3 => (dot(norm(a), view) >= dot(norm(b), view) ? a : b);
          const m = mould(mold, [0, 0, 0]);
          const tip = (q: V3, out?: number) => at(onVault(q, out), m);
          const F = BONES[idx('FL')].dir;
          const Pd = BONES[idx('PL')].dir;
          const front = pick(F, mirror(F));
          const par = pick(Pd, mirror(Pd));
          const occ = BONES[idx('OC')].dir;
          const tem = sd > 0 ? BONES[idx('TL')].dir : BONES[idx('TR')].dir;
          const sph = sd > 0 ? BONES[idx('SL')].dir : BONES[idx('SR')].dir;
          const fAF = FONT_AT[0];
          const fPF = FONT_AT[1];
          const fSph = FONT_AT[sd > 0 ? 2 : 3];
          const fMas = FONT_AT[sd > 0 ? 4 : 5];
          const metop: V3 = norm([0, 0.5, 0.86]);
          const sagit: V3 = norm([0, 0.92, -0.38]);
          const coron = norm(mix3(fAF.c, fSph.c, 0.45));
          const lamb = norm(mix3(fPF.c, fMas.c, 0.5));
          const squam = norm(mix3(fSph.c, fMas.c, 0.5));
          // The collective names point at whichever member faces the camera.
          const anySut = [squam, sagit, lamb, coron].reduce((a, b) => (dot(b, view) > dot(a, view) ? b : a));
          const anyFont = pick(fAF.c, fPF.c);
          const ctr = pick(BONES[idx('PL')].dir, BONES[idx('PR')].dir);
          const spicQ = norm(add(ctr, mul(norm(cross(ctr, [0, 1, 0])), 0.18 * Math.max(0.3, grow))));
          return (
            <>
              <Note x={24} y={24} size={12.5} align="start">
                Buru-gangaren garapena · 3D eredua
              </Note>
              <Callouts
                dim={calm}
                items={[
                  { id: 'hezur-frontala', at: tip(front), show: bones * (facing(front) ? 1 : 0) },
                  { id: 'hezur-parietala', at: tip(par), show: bones * (facing(par) ? 1 : 0) },
                  { id: 'okzipitalaren-ezkata', at: tip(occ), show: shown(occ, bones) },
                  { id: 'tenporalaren-ezkata', at: tip(tem), show: shown(tem, sides) },
                  { id: 'esfenoidesaren-hego-handia', at: tip(sph), show: shown(sph, sides), small: true },
                  { id: 'hezurtzapen-zentroak', at: tip(ctr, 0.04), show: shown(ctr, growing), text: 'Hezurtzapen zentroak', small: true },
                  { id: 'hezur-espikulak', at: tip(spicQ, 0.01), show: shown(spicQ, growing), small: true },
                  { id: 'buru-ganga', at: tip([0, 1, 0.1]), show: vis(t, 0, CAL_T.sutures), small: true },
                  { id: 'joskura-metopikoa', at: tip(metop), show: shown(metop, sutures), small: true },
                  { id: 'joskura-koronala', at: tip(coron), show: shown(coron, sutures), small: true },
                  { id: 'joskura-sagitala', at: tip(sagit), show: shown(sagit, sutures), small: true },
                  { id: 'joskura-lanbdoidea', at: tip(lamb), show: shown(lamb, sutures), small: true },
                  { id: 'joskurak', at: tip(anySut), show: shown(anySut, vis(t, CAL_T.sutures, CAL_T.fontanelles) + vis(t, CAL_T.birth, CAL_T.after)), small: true },
                  { id: 'aurreko-fontanela', at: tip(fAF.c), show: shown(fAF.c, sutures * (fontSize[0] > 0.05 ? 1 : 0)) },
                  { id: 'atzeko-fontanela', at: tip(fPF.c), show: shown(fPF.c, sutures * (fontSize[1] > 0.05 ? 1 : 0)) },
                  { id: 'fontanela-esfenoidala', at: tip(fSph.c), show: shown(fSph.c, sides) },
                  { id: 'fontanela-mastoidea', at: tip(fMas.c), show: shown(fMas.c, sides) },
                  { id: 'fontanelak', at: tip(anyFont, 0.02), show: shown(anyFont, (vis(t, CAL_T.fontanelles, CAL_T.side) + vis(t, CAL_T.birth, CAL_T.after)) * (1 - afClose)), small: true },
                ]}
              />
              <Note x={500} y={612} tone="accent" show={vis(t, 0, CAL_T.grow)}>
                Buru-ganga: entzefaloaren goiko eta alboko mesenkima (mintza)
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.grow, CAL_T.bones)}>
                Mintzezko hezurtzapena: zentro bakoitzetik hezur espikulak, mintzean zehar
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.bones, CAL_T.sutures)}>
                2 hezur frontal · 2 hezur parietal · okzipitalaren ezkata: hezur lau eta zapalak
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.sutures, CAL_T.fontanelles)}>
                Joskurak: bi hezurren artean, ildo estuak (ehun konektiboa, urdina)
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.fontanelles, CAL_T.side)}>
                Fontanelak: bi hezur baino gehiago elkartzen diren lekuan, zabalagoak
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.side, CAL_T.birth)}>
                Albotik: fontanela esfenoidala (aurrean) eta mastoidea (atzean), alde bakoitzean
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.birth, CAL_T.after)}>
                Erditzean parietalak ondokoen gainera: kraneoa txikiagoa
              </Note>
              <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.after)}>
                Jaio ondoren: atzeko fontanela 1.–2. hilabetean, aurrekoa 18. hilabetean; joskurak beranduago
              </Note>
              <Note x={760} y={24} size={13} tone="accent" show={vis(t, CAL_T.after + 0.01)}>
                {mon}
              </Note>
            </>
          );
        }}
      </Stage3D>
    </g>
  );
}

/** The view waits (without freezing the page) until its geometry has been built off the main thread. */
export function Calvaria3D(props: SceneProps) {
  return useGeoReady([GEO]) ? <Calvaria3DView {...props} /> : <Loading3D />;
}
Calvaria3D.geo = ['calvaria'];
