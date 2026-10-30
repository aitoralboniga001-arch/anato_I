'use client';

import { CHANGES10, HEART_TUBE } from '@/content/eratorriak/heart-tube';
import { aliveAt, changedAt, colourOf, lifeAt, nameAt, type Piece } from '@/content/eratorriak/model';
import { nameOf } from '@/content/registry';
import { orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import {
  POSE0,
  blobParts,
  centreline,
  heartModel,
  mixHex,
  radiusAt,
  tubeParts,
  type HeartOpts,
  type HeartPose,
} from '@/components/scenes/week10/model3d';
import { A0, atriumModel, type AtriumState } from '@/components/scenes/week10/atrium3d';
import { blendCamera } from '@/lib/three-d/aim';
import { curve3, grid, type Mesh } from '@/lib/three-d/mesh';
import type { Camera3, V3 } from '@/lib/three-d/math';
import { ownCentre } from '@/lib/three-d/occlusion';
import type { Item3 } from '@/lib/three-d/scene';
import { Room3D, useGlide, type Frame3 } from './kit/Room3D';
import type { RoomViewState } from './kit/StudyRoom';

/**
 * Topic 10's room in 3D, from the simulator's heart-tube model (model3d) through the six moments: the
 * horseshoe plexus with the cardiogenic plate between its arms, the two tubes zipping together in their
 * layers, the straight tube in four segments, the loop, what each part of the bulbus becomes, and the
 * sinus taken into the right atrium. The same tube shows its layers (endocardium inside a clear
 * myocardium, the epicardium round it, the dorsal mesocardium behind) at the second moment and whenever a
 * layer is picked; the venous valves, inside the right atrium, come up beside the heart as a close-up of
 * the opened atrium (atrium3d) at the last moment and whenever a valve is picked.
 */

const LOOPED: HeartPose = { ...POSE0, segs: 1, colour: 1, loop: 1, atriaFuse: 1, veins: 1 };
const PARTS: HeartPose = { ...LOOPED, split: 1, expand: 1, truncusMid: 1, derive: { trab: 1, conus: 1, truncus: 1 } };
const POSES: HeartPose[] = [
  { ...POSE0, fuse: 0, myo: 0, arches: 0, veins: 0 },
  { ...POSE0, fuse: 0.5, myo: 1, arches: 0, veins: 0 },
  { ...POSE0, segs: 1, colour: 1, veins: 1 },
  LOOPED,
  { ...PARTS, glass: 0.6 },
  { ...PARTS, glass: 0.55, shift: 1, obliterate: [1, 1], anast: 1, coronary: 1, hole: 1 },
];
const OPTS: Required<Pick<HeartOpts, 'cavity' | 'gut' | 'aortas'>>[] = [
  { cavity: 0, gut: 0, aortas: 0 },
  { cavity: 0, gut: 0.6, aortas: 0 },
  { cavity: 0, gut: 0.5, aortas: 0.35 },
  { cavity: 0, gut: 0, aortas: 0.35 },
  { cavity: 0, gut: 0, aortas: 0.25 },
  { cavity: 0, gut: 0, aortas: 0 },
];
/** The right atrium's inside: the sinus orifice and its two venous valves, then the adult wall. */
const EARLY: AtriumState = { ...A0, valves: 1, spur: 0.6 };
const ADULT: AtriumState = {
  ...A0,
  valves: 1,
  spur: 1,
  toSeptum: 1,
  secundum: 1,
  rightTopGone: 1,
  lowSplit: 1,
  orifice: 0,
  holes: 1,
  svc: 1,
  incorp: 1,
  pect: 1,
};
const ATRIUM: AtriumState[] = [EARLY, EARLY, EARLY, EARLY, EARLY, ADULT];
const N = POSES.length;

const YAW = [0, -32, -20, 24, 6, -35];
const CAMS: Camera3[] = [
  orbit(0, 12, 8.2, [0, 0.55, 0]),
  orbit(-32, 14, 6.4, [0, 0.55, -0.25]),
  orbit(-20, 10, 9.8, [0, -0.15, -0.2]),
  orbit(24, 14, 9.4, [0, 0.15, 0]),
  orbit(6, 8, 8.4, [0, 0.2, 0]),
  orbit(-35, 12, 8.6, [0, 0, -0.1]),
];
const HEART_C: V3 = [0, 0.1, 0];
/** The viewer's left at a yaw (the embryo's right from the front). */
const leftOf = (yaw: number): V3 => {
  const a = (yaw * Math.PI) / 180;
  return [-Math.cos(a), 0, Math.sin(a)];
};
const along = (p: V3, d: V3, k: number): V3 => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
const INSET_CAMS = YAW.map((y) => orbit(y, 12, 10.6, along(HEART_C, leftOf(y), 1.6)));

/** The close-up: the atrium at scale K beside the heart, its open front turned to the camera. */
const K_INSET = 1.08;
function placeOf(yaw: number) {
  const a = (yaw * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const t = along(HEART_C, leftOf(yaw), 3.2);
  const k = K_INSET;
  const matrix = new Float32Array([k * c, 0, -k * s, 0, 0, k, 0, 0, k * s, 0, k * c, 0, t[0], t[1], t[2], 1]);
  const at = (p: V3): V3 => [k * (c * p[0] + s * p[2]) + t[0], k * p[1] + t[1], k * (-s * p[0] + c * p[2]) + t[2]];
  return { matrix, at };
}

// —— which items are which room piece ——

const SEG: Record<string, string[]> = {
  sac: [],
  truncus: ['truncA', 'truncP'],
  conus: ['conusR', 'conusL'],
  proximal: ['proximal'],
  ventricle: ['ventricle'],
  atrium: ['atriumR', 'atriumL'],
};
const OTHER: Record<string, string[]> = {
  pa0: ['atriumR'],
  pa1: ['atriumL'],
  horn0: ['sinusR'],
  // The left horn holds both remnants' beginnings until it is the coronary sinus with the oblique vein.
  horn1: ['sinusCor', 'sinusOblique'],
  'sinus-mid': ['sinusR', 'sinusCor'],
  oblique: ['sinusOblique'],
  'conus-r': ['conusR'],
  'conus-l': ['conusL'],
  'conus-ridge': ['conusR', 'conusL'],
  'truncus-r': ['truncP'],
  'truncus-l': ['truncA'],
  'truncus-ridge': ['truncA', 'truncP'],
  trabeculae: ['proximal', 'ventricle'],
};
const INSET: Record<string, string[]> = {
  back: ['atriumR'],
  lateral: ['atriumR'],
  auricle: ['atriumR'],
  smooth: ['sinusR'],
  sinus: ['sinusR', 'sinusCor'],
  'sa-rim': ['sinusR'],
  'rv-top': ['valveUpper'],
  // One valve rim until it splits: the precursor of both lower valves.
  'rv-low': ['valveIvc', 'valveCor'],
  lv: ['valveL'],
  spurium: ['spurium'],
  'ivc-valve': ['valveIvc'],
  'cs-valve': ['valveCor'],
  'cs-hole': ['sinusCor'],
  'cs-rim': ['sinusCor'],
  'cs-vein': ['sinusCor'],
};
const LAYER = new Set(['endoR', 'endoL', 'myocard', 'epicard', 'mesocard']);
const VALVE = new Set(['valveUpper', 'valveIvc', 'valveCor', 'valveL', 'spurium']);
/** At the last moment these are named in the close-up (their two walls are what it shows). */
const IN_INSET = new Set([...VALVE, 'atriumR', 'sinusR']);
const BY_KEY = new Map(HEART_TUBE.pieces.map((p) => [p.key, p]));

/** The room pieces an item is part of at a moment (none at the field: everything there is still prospective). */
export function piecesOf(key: string, stage: number): string[] {
  if (key.startsWith('a:')) return INSET[key.slice(2)] ?? [];
  if (key.startsWith('e:')) return stage === 0 ? [] : key.endsWith('--1') ? ['endoR'] : key.endsWith('-1') ? ['endoL'] : ['endoR', 'endoL'];
  if (key.startsWith('p:')) return stage === 0 ? [] : ['epicard'];
  if (key === 'meso') return ['mesocard'];
  if (stage === 0) return [];
  const m = /^myo-([a-z]+)(--1|-1)?$/.exec(key);
  // The wall is the myocardium; its segments are the room's pieces once the tube has them (21st day).
  const segs = stage >= 2;
  if (m) return ['myocard', ...(!segs ? [] : m[1] === 'atrium' && m[2] ? [m[2] === '--1' ? 'atriumR' : 'atriumL'] : (SEG[m[1]] ?? []))];
  if (key === 'atria') return ['myocard', ...(segs ? ['atriumR', 'atriumL'] : [])];
  return OTHER[key] ?? [];
}
export const isOf = (piece: string, it: Item3, stage: number) => piecesOf(it.key, stage).includes(piece);

/** Which view the moment and the pick ask for: the layers, and the atrium close-up. */
export const layerView = (stage: number, lit: ReadonlySet<string>) => (lit.size ? [...lit].every((k) => LAYER.has(k)) : stage === 1);
export const insetView = (stage: number, lit: ReadonlySet<string>) =>
  lit.size ? [...lit].some((k) => VALVE.has(k) || (stage === 5 && IN_INSET.has(k))) : stage === 5;

// —— the extra pieces the tube model does not draw ——

/** The horseshoe: the two tubes' arms joined cranially, with the cardiogenic plate between them. */
const ARC = tubeParts(
  curve3(
    [
      [-0.22, 1.66, 0.05],
      [-0.17, 2.0, 0.05],
      [0.17, 2.0, 0.05],
      [0.22, 1.66, 0.05],
    ],
    16,
  ),
  { radius: () => 0.1, ref: [0, 0, 1], sides: 14 },
);
const PLATE = blobParts({ center: [0, 0.45, -0.02], radii: [0.14, 0.85, 0.05], rings: 12, sides: 18 });

/** The epicardium: the myocardium's surface moved out a little. */
const shells = new WeakMap<Mesh, Mesh>();
function shellOf(m: Mesh): Mesh {
  let s = shells.get(m);
  if (!s) {
    const pos = new Float32Array(m.pos.length);
    for (let i = 0; i < pos.length; i++) pos[i] = m.pos[i] + m.nrm[i] * 0.05;
    s = { ...m, pos };
    shells.set(m, s);
  }
  return s;
}

/** The dorsal mesocardium: a sheet from the fused tube's back to the foregut. */
const sheets = new Map<string, { mesh: Mesh; mid: V3 }>();
function mesocardium(pose: HeartPose) {
  const key = JSON.stringify(pose);
  const known = sheets.get(key);
  if (known) return known;
  const line = centreline(pose, 60);
  const u0 = 0.1;
  const u1 = Math.min(0.8, -0.05 + 1.1 * pose.fuse);
  const at = (a: number, b: number): V3 => {
    const u = u0 + (u1 - u0) * a;
    const p = line[Math.round(u * 60)];
    const back: V3 = [p[0], p[1], p[2] - 0.8 * radiusAt(u, pose)];
    const gut: V3 = [0, p[1], -0.64];
    return [back[0] + (gut[0] - back[0]) * b, back[1] + (gut[1] - back[1]) * b, back[2] + (gut[2] - back[2]) * b];
  };
  const out = { mesh: grid(16, 3, at, [1, 0, 0]), mid: at(0.5, 0.5) };
  if (sheets.size > 4) sheets.delete(sheets.keys().next().value!);
  sheets.set(key, out);
  return out;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => x * x * (3 - 2 * x);
/** Two poses mixed: numbers (and number lists) glide, nested settings mix the same way. */
function mix<T>(a: T, b: T, k: number): T {
  const A = (a ?? {}) as Record<string, unknown>;
  const B = (b ?? {}) as Record<string, unknown>;
  const o: Record<string, unknown> = { ...A };
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const x = A[key];
    const y = B[key];
    if (typeof x === 'number' || typeof y === 'number') o[key] = lerp((x as number) ?? 0, (y as number) ?? 0, k);
    else if (Array.isArray(x) && Array.isArray(y)) o[key] = x.map((v, n) => lerp(v, y[n], k));
    else if ((x && typeof x === 'object') || (y && typeof y === 'object')) o[key] = mix(x, y, k);
    else o[key] = k < 0.5 ? x : y;
  }
  return o as T;
}

export interface TubeFrame {
  items: Item3[];
  pts: Record<string, V3>;
  /** The close-up's own named points, already placed. */
  apts: Record<string, V3>;
  /** The layer anchors: a point in the myocardium's wall, on the epicardium, in the mesocardium. */
  wall: { myocard: V3; epicard: V3; mesocard: V3 | null };
  camera: Camera3;
  stage: number;
}

/** The model at a moment u (maybe between two), with the layers (wL) and the close-up (wA) as far as shown. */
export function tubeFrame(u: number, wL: number, wA: number, mode: Parameters<typeof colourOf>[1]): TubeFrame {
  const i = Math.max(0, Math.min(N - 1, Math.floor(u)));
  const j = Math.min(N - 1, i + 1);
  const e = ease(Math.max(0, Math.min(1, u - i)));
  const stage = Math.round(u);
  const pose = mix(POSES[i], POSES[j], e);
  const opts = mix(OPTS[i], OPTS[j], e);
  const z0 = lerp(i === 0 ? 1 : 0, j === 0 ? 1 : 0, e);

  const col = (k: string) => colourOf(BY_KEY.get(k)!, mode, HEART_TUBE);
  const born = (k: string, s: number) => (aliveAt(BY_KEY.get(k)!, s) ? 1 : 0);
  const presence = (key: string, s: number) => {
    const ps = piecesOf(key, s);
    if (ps.length) return Math.max(...ps.map((k) => born(k, s)));
    if (key === 'arc' || key === 'plate') return s === 0 ? 1 : 0;
    if (s === 0) return key.startsWith('myo-') ? 1 : 0;
    return 1;
  };
  const colourAt = (key: string, s: number): string | null => {
    const ps = piecesOf(key, s);
    if (!ps.length) return s === 0 && key.startsWith('myo-') ? col('endoR') : null;
    if (ps[0] === 'myocard') return mixHex(col(ps[1] ?? 'myocard'), col('myocard'), wL);
    return col(ps[0]);
  };
  const items: Item3[] = [];
  const push = (it: Item3, factor: number, glassy = 1) => {
    const show = (it.show ?? 1) * factor * lerp(presence(it.key, i), presence(it.key, j), e);
    if (show <= 0.01) return;
    const a = colourAt(it.key, i);
    const b = colourAt(it.key, j);
    const c = a && b ? mixHex(a, b, e) : (a ?? b);
    const o = (it.opacity ?? 1) * glassy;
    items.push(c ? { ...it, show, opacity: o, color: c, deep: mixHex(c, '#000000', 0.55) } : { ...it, show, opacity: o });
  };

  const h = heartModel(pose, opts);
  const isWall = (k: string) => k.startsWith('myo-') || k === 'atria';
  const clear = lerp(1, 0.4, wL * (1 - z0));
  for (const it of h.items) if (!it.stream) push(it, 1, isWall(it.key) ? clear : 1);
  if (wL > 0.01 && z0 < 0.99) {
    // The endocardium: the same tube without its myocardium, inside it; the epicardium round it.
    const inner = heartModel({ ...pose, myo: 0 }, {});
    for (const it of inner.items) if (it.key.startsWith('myo-')) push({ ...it, key: `e:${it.key}`, opacity: 1 }, wL);
    for (const it of h.items)
      if (isWall(it.key))
        push({ ...it, key: `p:${it.key}`, mesh: shellOf(it.mesh), hit: it.hit && shellOf(it.hit), opacity: 0.26, groups: undefined }, wL);
  }
  const meso = pose.fuse > 0.2 ? mesocardium(pose) : null;
  if (meso)
    push(
      { key: 'meso', id: 'mesokardio-dortsala', mesh: meso.mesh, color: col('mesocard'), tissue: 'mesenchyme', thin: 1, opacity: 0.9 },
      1,
    );
  if (z0 > 0.01) {
    push({ key: 'arc', id: 'ferra-formako-plexua', ...ARC, color: col('endoR'), tissue: 'vessel' }, 1);
    push({ key: 'plate', id: 'plaka-kardiogenikoa', ...PLATE, color: '#d98a9a', tissue: 'mesenchyme', opacity: 0.9 }, 1);
  }

  const yaw = lerp(YAW[i], YAW[j], e);
  const place = placeOf(yaw);
  const apts: Record<string, V3> = {};
  if (wA > 0.01) {
    const a = atriumModel(mix(ATRIUM[i], ATRIUM[j], e));
    for (const it of a.items) if (!it.stream) push({ ...it, key: `a:${it.key}`, matrix: place.matrix }, wA);
    for (const [k, p] of Object.entries(a.pts)) apts[k] = place.at(p);
  }

  // Between two moments both states of one item can be drawn: every item keeps its own key.
  const seen = new Map<string, number>();
  for (const it of items) {
    const n = seen.get(it.key) ?? 0;
    seen.set(it.key, n + 1);
    if (n) it.key = `${it.key}~${n}`;
  }

  const line = centreline(pose, 60);
  const onWall = (uu: number, k: number): V3 => {
    const p = line[Math.round(uu * 60)];
    return [p[0], p[1], p[2] + k * radiusAt(uu, pose)];
  };
  const wall = { myocard: onWall(0.3, 0.82), epicard: onWall(0.16, 1.12), mesocard: meso ? meso.mid : null };
  const tCam = blendCamera(CAMS[i], CAMS[j], e);
  const iCam = blendCamera(INSET_CAMS[i], INSET_CAMS[j], e);
  return { items, pts: h.pts, apts, wall, camera: blendCamera(tCam, iCam, ease(wA)), stage };
}

/** Named points: model points by name, or `#key` for the middle of that item. */
const PT_T: Record<string, readonly string[]> = {
  proximal: ['bulboaren-hurbileko-atala'],
  ventricle: ['atal-bentrikularra'],
  conusR: ['#conus-r', 'arteria-konoa'],
  conusL: ['#conus-l', 'arteria-konoa'],
  truncA: ['#truncus-l', 'enbor-arteriosoa'],
  truncP: ['#truncus-r', 'enbor-arteriosoa'],
  atriumR: ['hasierako-eskuineko-aurikula', 'atal-aurikularra'],
  atriumL: ['hasierako-ezkerreko-aurikula', 'atal-aurikularra'],
  sinusR: ['eskuineko-sinu-luzapena'],
  sinusCor: ['sinu-koronarioa'],
  sinusOblique: ['ezkerreko-aurikularen-zain-laprana', 'ezkerreko-sinu-luzapena'],
};
const PT_A: Record<string, readonly string[]> = {
  atriumR: ['atal-trabekulatua', 'hasierako-eskuineko-aurikula'],
  sinusR: ['atal-lisoa', 'zain-sinua'],
  sinusCor: ['sinu-koronarioa'],
  valveUpper: ['#rv-top'],
  valveIvc: ['beheko-kabaren-balbula', '#rv-low'],
  valveCor: ['sinu-koronarioaren-balbula', '#rv-low'],
  valveL: ['ezkerreko-zain-balbula'],
  spurium: ['septum-spurium'],
};
/** Two names on one shared point: each moved to its own side (x < 0 is the embryo's right). */
const SHARED: Record<string, V3> = {
  conusR: [-0.08, 0, 0.05],
  conusL: [0.08, 0, 0.05],
  truncA: [0.08, 0, 0.05],
  truncP: [-0.08, 0, 0.05],
  atriumR: [-0.14, 0, 0],
  atriumL: [0.14, 0, 0],
  valveIvc: [0, -0.1, 0],
  valveCor: [0, 0.1, 0],
};

/** A piece's name point in the view shown, and the id of an item of it there. */
export function anchorOf(piece: string, f: TubeFrame, wL: number, wA: number): { p: V3; id: string } | null {
  const inset = wA >= 0.5 && IN_INSET.has(piece);
  const own = f.items.filter((it) => it.key.startsWith('a:') === inset && it.id && (it.show ?? 1) > 0.05 && isOf(piece, it, f.stage));
  const layer = wL >= 0.5 && LAYER.has(piece);
  // The layers are shown only in the layer view (the myocardium and mesocardium are there in both).
  const mine =
    layer || piece === 'myocard' || piece === 'mesocard' ? own : own.filter((it) => !it.key.startsWith('e:') && !it.key.startsWith('p:'));
  if (!mine.length) return null;
  if (piece === 'myocard' || piece === 'epicard' || piece === 'mesocard') {
    const p = f.wall[piece];
    const it =
      piece === 'epicard'
        ? mine.find((x) => x.key.startsWith('p:'))
        : piece === 'mesocard'
          ? mine[0]
          : mine.find((x) => !x.key.startsWith('p:'));
    return p && it ? { p, id: it.id! } : null;
  }
  if (piece === 'endoR' || piece === 'endoL') {
    const inner = mine.filter((x) => x.key.startsWith('e:'));
    const side = inner.filter((x) => /-1$/.test(x.key));
    const pick = (side.length ? side : inner).reduce((a, b) => (b.key.includes('ventricle') ? b : a), (side.length ? side : inner)[0]);
    if (!pick) return null;
    const c = ownCentre([pick], pick.id!);
    if (!c) return null;
    return { p: side.length ? c : [c[0] + (piece === 'endoR' ? -0.06 : 0.06), c[1], c[2]], id: pick.id! };
  }
  const named = (inset ? PT_A : PT_T)[piece] ?? [];
  const pts = inset ? f.apts : f.pts;
  for (const n of named) {
    if (n.startsWith('#')) {
      const it = mine.find((x) => x.key === `${inset ? 'a:' : ''}${n.slice(1)}`);
      const c = it && ownCentre([it], it.id!);
      if (c) {
        const d = n === '#rv-low' ? (SHARED[piece] ?? [0, 0, 0]) : [0, 0, 0];
        return { p: [c[0] + d[0], c[1] + d[1], c[2] + d[2]], id: it.id! };
      }
      continue;
    }
    const p = pts[n];
    if (!p) continue;
    const d = named.indexOf(n) > 0 ? (SHARED[piece] ?? [0, 0, 0]) : [0, 0, 0];
    return { p: [p[0] + d[0], p[1] + d[1], p[2] + d[2]], id: mine[0].id! };
  }
  const c = ownCentre(mine, mine[0].id!);
  return c ? { p: c, id: mine[0].id! } : null;
}

/** What the field shows before any piece is formed (the room names nothing there). */
function fieldNames(f: TubeFrame): CalloutSpec[] {
  const out: CalloutSpec[] = [];
  const has = (k: string) => f.items.find((it) => it.key === k);
  const arc = has('arc');
  const plate = has('plate');
  const arm = has('myo-ventricle--1');
  if (arc) out.push({ id: 'ferra-formako-plexua', p: [0, 2.0, 0.05], show: 1, text: nameOf('ferra-formako-plexua'), small: true });
  if (plate) out.push({ id: 'plaka-kardiogenikoa', p: [0, 0.45, 0.02], show: 1, text: nameOf('plaka-kardiogenikoa'), small: true });
  if (arm) {
    const c = ownCentre([arm], arm.id!);
    if (c) out.push({ id: arm.id!, p: c, show: 1, text: 'Endokardio hodiak', small: true, key: 'field-tubes' });
  }
  return out;
}

export function Tube3D(state: RoomViewState) {
  const { mode, lit, names, stage: asked } = state;
  const wL = useGlide(layerView(asked, lit) ? 1 : 0);
  const wA = useGlide(insetView(asked, lit) ? 1 : 0);
  const frame = (u: number): Frame3 => {
    const f = tubeFrame(u, wL, wA, mode);
    const { stage } = f;
    const items = lit.size
      ? f.items.map((it) => ([...lit].some((k) => isOf(k, it, stage)) ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 }))
      : f.items;
    const said = new Set(CHANGES10[stage].flatMap((c) => c.keys));
    const pick: Piece[] =
      names === 'gabe'
        ? []
        : lit.size
          ? HEART_TUBE.pieces.filter((p) => lit.has(p.key))
          : names === 'guztiak'
            ? HEART_TUBE.pieces
            : HEART_TUBE.pieces.filter((p) => said.has(p.key) || (changedAt(p, stage) && lifeAt(p, stage) !== 3));
    const out: CalloutSpec[] = stage === 0 && names !== 'gabe' && !lit.size ? fieldNames(f) : [];
    for (const p of pick) {
      if (!aliveAt(p, stage)) continue;
      const a = anchorOf(p.key, f, wL, wA);
      if (a) out.push({ id: a.id, p: a.p, show: 1, text: nameAt(p, stage), key: p.key, small: true });
    }
    const twice = new Set(out.filter((c, k) => out.findIndex((d) => d.text === c.text) !== k).map((c) => c.text));
    for (const c of out) if (twice.has(c.text)) c.sub = BY_KEY.get(c.key!)!.side === 'R' ? 'eskuinekoa' : 'ezkerrekoa';
    return { items, pts: { ...f.pts, ...f.apts }, camera: f.camera, names: out };
  };
  return <Room3D state={state} frame={frame} continuity="eratorriak-10" label="Bihotz hodiaren 3D eredua" />;
}
