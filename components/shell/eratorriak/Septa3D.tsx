'use client';

import { CHANGES11, SEPTA } from '@/content/eratorriak/septa';
import { aliveAt, changedAt, colourOf, lifeAt, nameAt, type Piece } from '@/content/eratorriak/model';
import { orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { mixHex } from '@/components/scenes/week10/model3d';
import { AT0, YF, atriaModel, type AtriaFlow, type AtriaState } from '@/components/scenes/week11/atria3d';
import { CN0, canalModel, type CanalState } from '@/components/scenes/week11/canal3d';
import { TR0, type TruncusState } from '@/components/scenes/week11/truncus3d';
import { DONE } from '@/components/scenes/week11/SpiralSeptum3D';
import { blendCamera } from '@/lib/three-d/aim';
import type { Camera3, V3 } from '@/lib/three-d/math';
import { ownCentre } from '@/lib/three-d/occlusion';
import type { Item3 } from '@/lib/three-d/scene';
import { Room3D, useGlide, type Frame3 } from './kit/Room3D';
import type { RoomViewState } from './kit/StudyRoom';

/**
 * Topic 11's room in 3D, from the simulator's two heart models. The room's eight moments are the atrial
 * sequence, so the atria (atria3d) carry them: the common atrium, septum primum and its two openings, the
 * cushions closing the lower one, septum secundum and the foramen ovale, the oblique way between the two
 * septa, the valve pressed at birth and the fused septum with the walls' two origins. A picked piece that
 * only the lower heart has (the AV valves, the interventricular septum, the conus and truncus) glides the
 * view to the ventricles and outflow (canal3d), at the same moment; picking an atrial piece glides back.
 */

const ATRIA: AtriaState[] = (() => {
  const op: AtriaState = { ...AT0, primum: 0.82, cushions: 1, cushionFuse: 1, os2: 1, closeOP: 1 };
  const sec: AtriaState = { ...op, secundum: 1, spurium: 1 };
  const born: AtriaState = { ...sec, stub: 1, press: 1, pulmonary: 1, adult: true, cut: -0.1 };
  const poses: AtriaState[] = [
    { ...AT0, spurium: 0.5 },
    { ...AT0, spurium: 0.5, primum: 0.74, cushions: 0.75, glassRA: 1 },
    { ...AT0, spurium: 0.5, primum: 0.82, cushions: 1, cushionFuse: 0.4, os2: 1, glassRA: 1 },
    { ...op, spurium: 0.5, glassRA: 1 },
    { ...sec, glassRA: 1 },
    { ...sec, stub: 1, cut: -0.1 },
    born,
    {
      ...born,
      fuse: 1,
      cut: 9,
      glassRA: 0.55,
      walls: true,
      smoothWide: 1,
      cs: 1,
      crista: 1,
      node: 1,
      pect: 1,
      laPect: 1,
      pvIncorp: 1,
      laSmooth: 1,
    },
  ];
  // The primitive pulmonary vein (the room's piece) until birth; from birth its four veins open into the wall.
  return poses.map((p) => (p.pulmonary > 0 ? p : { ...p, pvGrow: 1 }));
})();
const NO_FLOW: AtriaFlow = { phase: 0, low: 0, high: 0, down: 0, born: 0, slit: 0 };

const LOWER: CanalState[] = (() => {
  const early: CanalState = { ...CN0, flatten: 0.5, shift: 0.5, cushions: 0.6, septum: 0.3, trab: 0.5, foramen: 1, truncus: { ...TR0 } };
  const ridges: CanalState = { ...early, cushions: 1, conusRidges: 0.6, truncus: { ...TR0, ridges: 0.6 } };
  const fused: CanalState = { ...ridges, fuse: 0.5, conusRidges: 1, truncus: { ...TR0, ridges: 1, fuse: 0.5 } };
  // Once the semilunar valves form, the truncus is the two vessels apart (the model draws the cusps in them).
  const done: CanalState = { ...CN0, ...DONE, foramen: 0, truncus: { ...TR0, ridges: 1, fuse: 1, split: 1, tubercles: 1, hollow: 1 } };
  const closing: CanalState = {
    ...done,
    membranous: 0.5,
    conusFuse: 0.7,
    leaflets: 0.6,
    hollow: 0.3,
    foramen: 0.5,
    truncus: { ...TR0, ridges: 1, fuse: 1, split: 1, tubercles: 0.6 },
  };
  return [early, ridges, fused, closing, done, done, done, done];
})();

const ATRIA_CAMS = [
  orbit(-24, 18, 9.4, [0, -0.15, 0]),
  orbit(-80, 8, 7.4, [0, -0.15, -0.18]),
  orbit(-80, 8, 7.4, [0, -0.15, -0.18]),
  orbit(-50, 34, 7.6, [0, YF + 0.4, -0.05]),
  orbit(-70, 10, 8.6, [-0.1, -0.4, -0.2]),
  orbit(-14, 10, 6.4, [-0.06, -0.05, -0.15]),
  orbit(-14, 10, 6.4, [-0.06, -0.05, -0.15]),
  orbit(-30, 12, 8.6, [-0.2, -0.05, -0.3]),
];
const LOWER_CAM = orbit(-22, 12, 9, [0, 0.25, -0.1]);
const N = ATRIA.length;

/** Each room piece's items: by item key or id, in the atria (A) and the lower heart (V). */
const A: Record<string, readonly string[]> = {
  primum: ['primum', 'primum-cut', 'fused', 'fused-cut'],
  secundum: ['secundum', 'secundum-edge'],
  spurium: ['spurium'],
  leftValve: ['lvv'],
  ostium1: ['op-edge'],
  ostium2: ['os-rim', 'primum-edge'],
  foramen: ['fo-rim', 'slit'],
  // Each cushion its own blob; their extensions closing the ostium primum are one band for both.
  cushionSup: ['cush-sup', 'op-cap'],
  cushionInf: ['cush-inf', 'op-cap'],
  raTrab: ['ra', 'auricle', 'pect', 'crista'],
  raSmooth: ['smooth', 'sinus-dome', 'sinus', 'sinus-left'],
  laTrab: ['la', 'la-auricle', 'la-pect'],
  // Before it is taken into the wall: the primitive pulmonary vein out of the back wall.
  laSmooth: ['la-smooth', 'pv-hole', 'pv-tree'],
  rvTrab: ['rv'],
  lvTrab: ['lv'],
};
const V: Record<string, readonly string[]> = {
  cushionSup: ['goiko-kuxina'],
  cushionInf: ['beheko-kuxina'],
  valveR: ['cuff-r', 'balbula-trikuspidea'],
  valveL: ['cuff-l', 'balbula-mitrala'],
  ivMuscle: ['ridge-r', 'ridge-l', 'ridge-cap-r', 'ridge-cap-l'],
  ivMembrane: ['membranous'],
  ivGap: ['foramen'],
  rvTrab: ['in-r', 'out-r', 'cut-r', 'trab-r'],
  lvTrab: ['in-l', 'out-l', 'cut-l', 'trab-l'],
  // Until its ridges divide it, the conus is one space holding both outflows.
  rvSmooth: ['conus-in-r', 'conus-in', 'conus'],
  lvSmooth: ['conus-in-l', 'conus-in', 'conus'],
  // The paired ridges are one item in the model: a pick of either shows both (they fuse into one septum).
  conalRidgeR: ['conus-ridges', 'conus-septum'],
  conalRidgeL: ['conus-ridges', 'conus-septum'],
  // Once the vessels are apart, the aorticopulmonary septum is the wall each has towards the other.
  truncRidgeR: ['truncus-ridges', 'truncus-septum', 'vessel-a'],
  truncRidgeL: ['truncus-ridges', 'truncus-septum', 'vessel-p'],
  truncAorta: ['truncus-in-a', 'truncus-in', 'truncus', 'vessel-a', 'vessel-in-a'],
  truncPulm: ['truncus-in-p', 'truncus-in', 'truncus', 'vessel-p', 'vessel-in-p'],
  semiAorta: ['aorta-balbula'],
  semiPulm: ['birika-balbula'],
};
/** Where each name points, by the model's named points (else the middle of the piece's biggest item). */
const PT_A: Record<string, readonly string[]> = {
  primum: ['zulo-obalaren-balbula', 'septum-primum'],
  secundum: ['septum-secundum'],
  spurium: ['septum-spurium'],
  leftValve: ['ezkerreko-zain-balbula'],
  ostium1: ['ostium-primuma'],
  ostium2: ['ostium-secunduma'],
  foramen: ['zulo-obala'],
  cushionSup: [],
  cushionInf: [],
  raTrab: ['muskulu-pektinioak'],
  raSmooth: ['atal-lisoa'],
  laTrab: ['la-pect'],
  laSmooth: ['ezkerreko-aurikularen-atal-lisoa'],
  rvTrab: ['hasierako-eskuineko-bentrikulua'],
  lvTrab: ['hasierako-ezkerreko-bentrikulua'],
};
const PT_V: Record<string, readonly string[]> = {
  cushionSup: ['goiko-kuxina'],
  cushionInf: ['beheko-kuxina'],
  valveR: ['balbula-trikuspidea'],
  valveL: ['ezkerreko-zulo-ab'],
  ivMuscle: ['trenkada-muskularra', 'ertz-bulbobentrikularra'],
  ivMembrane: ['mintzezko-trenkada'],
  ivGap: ['bentrikulu-arteko-zulo-primarioa'],
  rvTrab: ['hasierako-eskuineko-bentrikulua'],
  lvTrab: ['hasierako-ezkerreko-bentrikulua'],
  rvSmooth: ['eskuineko-infundibulua'],
  lvSmooth: ['ezkerreko-infundibulua'],
  conalRidgeR: ['konoaren-gandorrak'],
  conalRidgeL: ['konoaren-gandorra-aurre-ezker', 'konoaren-gandorrak'],
  truncRidgeR: ['enborraren-gandorrak'],
  truncRidgeL: ['enborraren-gandorrak'],
  truncAorta: ['aorta', 'enbor-arteriosoa'],
  truncPulm: ['birika-arteria', 'enbor-arteriosoa'],
  semiAorta: [],
  semiPulm: [],
};
/** Two names on one point (one item for both): the second sits a little lower. */
const NUDGE: Record<string, V3> = { conalRidgeL: [0, -0.1, 0], truncRidgeL: [0, -0.18, 0], truncPulm: [0, 0.12, 0] };

/** The pieces only the lower heart has: picking one (and no atrial-only piece) turns to it. */
const LOWER_ONLY = new Set(Object.keys(V).filter((k) => !A[k]));
const ATRIA_ONLY = new Set(Object.keys(A).filter((k) => !V[k]));
export const lowerView = (lit: ReadonlySet<string>) => [...lit].some((k) => LOWER_ONLY.has(k)) && ![...lit].some((k) => ATRIA_ONLY.has(k));

const BY_KEY = new Map(SEPTA.pieces.map((p) => [p.key, p]));
const PREFIX = 'v:';
const bare = (key: string) => (key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key);
/** Whether an item (of either model) is one of the piece's. */
export const isOf = (piece: string, it: Item3) => {
  const lower = it.key.startsWith(PREFIX);
  const list = (lower ? V : A)[piece] ?? [];
  const k = bare(it.key);
  return list.includes(k) || (!!it.id && list.includes(it.id));
};
const pieceOf = (it: Item3) => {
  for (const p of SEPTA.pieces) if (isOf(p.key, it)) return p;
  return undefined;
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);
function mixState<S extends object>(a: S, b: S, k: number): S {
  const o = { ...a } as Record<string, unknown>;
  for (const key of Object.keys(a) as (keyof S & string)[]) {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'number' && typeof y === 'number') o[key] = lerp(x, y, k);
    else if (x && typeof x === 'object' && y && typeof y === 'object') o[key] = mixState(x as object, y as object, k);
    else o[key] = k < 0.5 ? x : y;
  }
  return o as S;
}

/** Both models at a moment that may lie between two, and how far the view has turned to the lower heart (w). */
export function septaFrame(u: number, w: number, mode: RoomViewState['mode']) {
  const i = Math.max(0, Math.min(N - 1, Math.floor(u)));
  const j = Math.min(N - 1, i + 1);
  const e = ease(u - i);
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const vpts: Record<string, V3> = {};
  // A piece the room does not have at the moment (not yet, or gone) is not drawn: an opening closed by
  // fusion leaves only the wall's edge, which is not the opening any more.
  const born = (p: Piece, s: number) => (aliveAt(p, s) ? 1 : 0);
  const tint = (it: Item3, fade: number, lower: boolean): Item3 | null => {
    const key = lower ? `${PREFIX}${it.key}` : it.key;
    const p = pieceOf({ ...it, key });
    const show = (it.show ?? 1) * fade * (p ? lerp(born(p, i), born(p, j), e) : 1);
    if (show <= 0.01) return null;
    if (!p || it.stream) return { ...it, key, show };
    const c = colourOf(p, mode, SEPTA);
    return { ...it, key, show, color: c, deep: mixHex(c, '#000000', 0.55) };
  };
  if (w < 0.999) {
    const m = atriaModel(mixState(ATRIA[i], ATRIA[j], e), NO_FLOW);
    for (const it of m.items) {
      const t = !it.stream && tint(it, 1 - w, false);
      if (t) items.push(t);
    }
    Object.assign(pts, m.pts);
  }
  if (w > 0.001) {
    const m = canalModel(mixState(LOWER[i], LOWER[j], e), { phase: 0, show: 0 });
    for (const it of m.items) {
      const t = !it.stream && tint(it, w, true);
      if (t) items.push(t);
    }
    Object.assign(vpts, m.pts);
  }
  // Between two moments two states of one structure can both be drawn (the primitive pulmonary vein's
  // opening and the four veins' openings): every item keeps its own key.
  const seen = new Map<string, number>();
  for (const it of items) {
    const n = seen.get(it.key) ?? 0;
    seen.set(it.key, n + 1);
    if (n) it.key = `${it.key}~${n}`;
  }
  const atCam: Camera3 = blendCamera(ATRIA_CAMS[i], ATRIA_CAMS[j], e);
  return { items, pts, vpts, camera: blendCamera(atCam, LOWER_CAM, ease(w)) };
}

/** A piece's name point in the view shown, and the id of its item there. */
export function anchorOf(
  piece: string,
  items: Item3[],
  pts: Record<string, V3>,
  vpts: Record<string, V3>,
  lower: boolean,
): { p: V3; id: string } | null {
  const own = items.filter((it) => it.key.startsWith(PREFIX) === lower && isOf(piece, it) && it.id);
  if (!own.length) return null;
  const id = own[0].id!;
  const named = ((lower ? PT_V : PT_A)[piece] ?? []).map((k) => (lower ? vpts : pts)[k]).find(Boolean);
  const at = named ?? ownCentre(own, id);
  if (!at) return null;
  const d = NUDGE[piece] ?? [0, 0, 0];
  return { p: [at[0] + d[0], at[1] + d[1], at[2] + d[2]], id };
}

export function Septa3D(state: RoomViewState) {
  const { mode, lit, names } = state;
  const w = useGlide(lowerView(lit) ? 1 : 0);
  const frame = (u: number): Frame3 => {
    const { items: all, pts, vpts, camera } = septaFrame(u, w, mode);
    const stage = Math.round(u);
    const lower = w >= 0.5;
    const items = lit.size ? all.map((it) => ([...lit].some((k) => isOf(k, it)) ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 })) : all;
    const said = new Set(CHANGES11[stage].flatMap((c) => c.keys));
    const pick: Piece[] =
      names === 'gabe'
        ? []
        : lit.size
          ? SEPTA.pieces.filter((p) => lit.has(p.key))
          : names === 'guztiak'
            ? SEPTA.pieces
            : SEPTA.pieces.filter((p) => said.has(p.key) || (changedAt(p, stage) && lifeAt(p, stage) !== 3));
    const out: CalloutSpec[] = [];
    for (const p of pick) {
      if (!aliveAt(p, stage)) continue;
      const a = anchorOf(p.key, all, pts, vpts, lower);
      if (a) out.push({ id: a.id, p: a.p, show: 1, text: nameAt(p, stage), key: p.key, small: true });
    }
    const twice = new Set(out.filter((c, k) => out.findIndex((d) => d.text === c.text) !== k).map((c) => c.text));
    for (const c of out) if (twice.has(c.text)) c.sub = BY_KEY.get(c.key!)!.side === 'R' ? 'eskuinekoa' : 'ezkerrekoa';
    return { items, pts: { ...pts, ...vpts }, camera, names: out };
  };
  return <Room3D state={state} frame={frame} continuity="eratorriak-11" label="Bihotz trenkaden 3D eredua" />;
}
