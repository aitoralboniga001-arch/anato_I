'use client';

import { CHANGES, VEINS } from '@/content/eratorriak/veins';
import { aliveAt, changedAt, colourOf, lifeAt, nameAt, type Piece } from '@/content/eratorriak/model';
import { orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { mixHex } from '@/components/scenes/week10/model3d';
import { ADULT, VP0, veinModel, type VeinOpts, type VeinPose } from '@/components/scenes/week13/veins3d';
import type { Item3 } from '@/lib/three-d/scene';
import { Room3D, type Frame3 } from './kit/Room3D';
import type { RoomViewState } from './kit/StudyRoom';

/**
 * Topic 13's room in 3D: the simulator's venous model (veins3d) at the diagram's six moments, morphing
 * between them. Vessels that go narrow and leave a faint ghost where they were; the room's pieces take
 * the room's colours (Jatorria / Eratorria) and light up when picked. Seen from the front throughout (the
 * embryo's right on the viewer's left), closer on the liver for its moments, farther for the cardinals.
 */

/** The model's pose at each moment. The left distal vitelline stays (the room keeps it: the inferior mesenteric vein). */
const LIVER: Partial<VeinPose> = { plexus: 1, liver: 1, sinus: 1, portal: 0.5 };
const POSES: VeinPose[] = [
  { ...VP0, portal: 0.5 },
  { ...VP0, ...LIVER },
  { ...VP0, ...LIVER, portal: 1, lProx: 0.6, rDist: 0.6, remodel: 0.6, umbProx: 0.6, umbR: 0.6, dv0: 1, hepV: 0.5 },
  {
    ...VP0,
    ...LIVER,
    portal: 1,
    lProx: 1,
    rDist: 1,
    remodel: 1,
    umbProx: 1,
    umbR: 1,
    dv0: 1,
    hepV: 1,
    sub: 1,
    sacro: 1,
    supra: 1,
    subAn: 1,
    sacroAn: 1,
    acAn: 1,
    supraAn: 1,
    accAn: 1,
    pcGone: 0.6,
    lSubProx: 0.6,
    dc: 0.4,
    dv: 0.4,
  },
  { ...ADULT, lDist: 0 },
  { ...ADULT, lDist: 0, teres: 1, venosum: 1 },
];

const OPTS: VeinOpts[] = [
  { heart: 1, body: 1, ghosts: 1, septum: 1, gut: 1, stalk: 1 },
  { heart: 1, body: 1, ghosts: 1, septum: 0.7, gut: 1, stalk: 1, liverOp: 0.24 },
  { heart: 1, body: 1, ghosts: 1, gut: 0.8, liverOp: 0.2 },
  { heart: 1, body: 1, ghosts: 1, gut: 0.4, kidneys: 1, liverOp: 0.16 },
  { heart: 1, body: 1, ghosts: 1, gut: 0.4, kidneys: 1, liverOp: 0.16 },
  { heart: 1, body: 1, ghosts: 1, gut: 0.6, kidneys: 0.6, liverOp: 0.22 },
];

const CAMS = [
  { yaw: -14, elev: 10, dist: 21, target: [0, -0.8, 0.1] },
  { yaw: -16, elev: 12, dist: 12.5, target: [0, -1.9, 0.35] },
  { yaw: 22, elev: 10, dist: 12.5, target: [0, -1.8, 0.2] },
  { yaw: -16, elev: 8, dist: 21, target: [0, -1.2, -0.4] },
  { yaw: -14, elev: 8, dist: 21.5, target: [0, -1.1, -0.3] },
  { yaw: -18, elev: 10, dist: 13, target: [0, -1.6, 0.3] },
] as const;
const N = CAMS.length;

/** Each room piece's items in the model (the R/L suffix is the model's side). */
const ITEMS: Record<string, readonly string[]> = {
  hcR: ['hcR'],
  hcL: ['hcL'],
  vitDistR: ['vitDistR'],
  vitDistL: ['vitDistL'],
  portal: ['vitPeriR'],
  smv: ['smv'],
  splenic: ['pMid', 'spleenV'],
  sinusoids: ['sinusoid'],
  umbProxR: ['umbProxR'],
  umbProxL: ['umbProxL'],
  umbR: ['umbDistR', 'umbLiverR'],
  umbL: ['umbDistL', 'umbLiverL'],
  dv: ['dv'],
  acR: ['acLowR'],
  ccR: ['commonR'],
  acDistR: ['acTopR'],
  acDistL: ['acTopL'],
  acAn: ['acAn'],
  pcR: ['pcUpR'],
  pcDistR: ['pcLowR'],
  pcDistL: ['pcUpL', 'pcLowL'],
  subR: ['subUpR', 'subLowR', 'hepSub'],
  subProxL: ['subUpL'],
  subDistL: ['subLowL'],
  subAn: ['subAn', 'renalL'],
  sacroR: ['sacroProxR'],
  sacroDistR: ['sacroDistR'],
  sacroAn: ['sacroAn'],
  supR: ['supLowR', 'supMidR', 'supUpR', 'supLinkR'],
  supLowL: ['supLowL', 'supAnLow'],
  supHighL: ['supUpL', 'supAnUp'],
  hornL: ['h-horn1'],
  // Until the coronary sinus forms, the oblique vein's part is the left horn itself.
  oblique: ['h-oblique', 'h-horn1'],
};
/** Where each piece's name points (the model's named points). */
const PT: Record<string, readonly string[]> = {
  hcR: ['eskuineko-hodi-hepatokardiakoa'],
  hcL: ['ezkerreko-hodi-hepatokardiakoa'],
  vitDistR: ['bitelo-zainak-distR'],
  vitDistL: ['bitelo-zainak-distL'],
  portal: ['porta-zaina'],
  smv: ['goiko-zain-mesenterikoa'],
  splenic: ['zain-esplenikoa'],
  sinusoids: ['gibeleko-sinusoideak'],
  umbProxR: ['zilbor-zainak-proxR'],
  umbProxL: ['zilbor-zainak-proxL'],
  umbR: ['zilbor-zainakR'],
  umbL: ['zilbor-zainakL'],
  dv: ['hodi-benosoa'],
  acR: ['goiko-kabaren-hasierako-atala'],
  ccR: ['goiko-kabaren-bukaerako-atala'],
  acDistR: ['barneko-jugularrakR'],
  acDistL: ['barneko-jugularrakL'],
  acAn: ['aurreko-kardinalen-anastomosia'],
  pcR: ['azigos-arkua'],
  pcDistR: ['atzeko-zain-kardinalakR'],
  pcDistL: ['atzeko-zain-kardinalakL'],
  subR: ['kabaren-giltzurrun-segmentua'],
  subProxL: ['kardinal-azpiko-zainakL'],
  subDistL: ['ezkerreko-zain-gonadala'],
  subAn: ['kardinal-azpiko-anastomosia'],
  sacroR: ['kabaren-segmentu-sakrokardinala'],
  sacroDistR: ['eskuineko-zain-iliako-primitiboa'],
  sacroAn: ['sakrokardinal-anastomosia'],
  supR: ['azigos-zaina'],
  supLowL: ['hemiazigos-zaina'],
  supHighL: ['hemiazigos-laguntzailea'],
  hornL: ['ezkerreko-sinu-luzapena'],
  oblique: ['ezkerreko-aurikularen-zain-laprana', 'ezkerreko-sinu-luzapena'],
};

const BY_KEY = new Map(VEINS.pieces.map((p) => [p.key, p]));
/** The room piece an item belongs to (a ghost belongs to its vessel's piece). */
const PIECE_OF = new Map<string, string>();
// First wins: the left horn is the horn's piece (the oblique vein only shares it before the coronary sinus).
for (const [piece, its] of Object.entries(ITEMS)) for (const it of its) if (!PIECE_OF.has(it)) PIECE_OF.set(it, piece);
export const pieceOfItem = (key: string) => {
  const k = key.replace(/^ghost-/, '');
  return PIECE_OF.get(k) ?? (k.startsWith('sinusoid') ? 'sinusoids' : undefined);
};
/** Whether an item is one of the piece's (the sinusoids are a numbered series). */
export const isOf = (piece: string, key: string) => {
  const k = key.replace(/^ghost-/, '');
  return (ITEMS[piece] ?? []).some((i) => k === i || (i === 'sinusoid' && /^sinusoid\d+$/.test(k)));
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);

function mixPose(a: VeinPose, b: VeinPose, k: number): VeinPose {
  const o = { ...a, names: { ...a.names } };
  for (const key of Object.keys(a) as (keyof VeinPose)[])
    if (key !== 'names') (o[key] as number) = lerp(a[key] as number, b[key] as number, k);
  for (const n of Object.keys(a.names) as (keyof VeinPose['names'])[]) o.names[n] = lerp(a.names[n], b.names[n], k);
  return o;
}
function mixOpts(a: VeinOpts, b: VeinOpts, k: number): VeinOpts {
  const o: Record<string, number> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof VeinOpts>)
    o[key] = lerp((a[key] as number | undefined) ?? 0, (b[key] as number | undefined) ?? 0, k);
  return o as VeinOpts;
}

/** The model at a moment that may lie between two: the room's colours on its pieces. */
export function veinFrame(u: number, mode: RoomViewState['mode']) {
  const i = Math.max(0, Math.min(N - 1, Math.floor(u)));
  const j = Math.min(N - 1, i + 1);
  const e = ease(u - i);
  const m = veinModel(mixPose(POSES[i], POSES[j], e), mixOpts(OPTS[i], OPTS[j], e));
  // A piece not yet there in the room is not drawn (the model can leave a stub of a vessel about to grow).
  const born = (p: Piece, s: number) => (lifeAt(p, s) === 0 ? 0 : 1);
  const items = m.items.flatMap((it): Item3[] => {
    const piece = pieceOfItem(it.key);
    if (!piece || it.key.startsWith('ghost-')) return [it];
    const p = BY_KEY.get(piece)!;
    const show = (it.show ?? 1) * lerp(born(p, i), born(p, j), e);
    if (show <= 0.01) return [];
    const c = colourOf(p, mode, VEINS);
    return [{ ...it, show, color: c, deep: mixHex(c, '#000000', 0.55) }];
  });
  return { items, pts: m.pts, i, j, e };
}

/** A piece's name point and the id of its item at this moment (so the dot stays on the piece in sight). */
export function anchorOf(piece: string, items: Item3[], pts: Record<string, unknown>) {
  const p = (PT[piece] ?? []).find((k) => pts[k]);
  const it = items.find((x) => !x.key.startsWith('ghost-') && isOf(piece, x.key) && x.id);
  return p && it ? { p, id: it.id! } : null;
}

export function Vein3D(state: RoomViewState) {
  const { mode, lit, names } = state;
  const frame = (u: number): Frame3 => {
    const { items: all, pts, i, j, e } = veinFrame(u, mode);
    const stage = Math.round(u);
    const items = lit.size
      ? all.map((it) => ([...lit].some((k) => isOf(k, it.key)) ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 }))
      : all;
    const said = new Set(CHANGES[stage].flatMap((c) => c.keys));
    const pick: Piece[] =
      names === 'gabe'
        ? []
        : lit.size
          ? VEINS.pieces.filter((p) => lit.has(p.key))
          : names === 'guztiak'
            ? VEINS.pieces
            : VEINS.pieces.filter((p) => said.has(p.key) || (changedAt(p, stage) && lifeAt(p, stage) !== 3));
    const out: CalloutSpec[] = [];
    for (const p of pick) {
      if (!aliveAt(p, stage)) continue;
      const a = anchorOf(p.key, all, pts);
      if (a) out.push({ id: a.id, p: a.p, show: 1, text: nameAt(p, stage), key: p.key, small: true });
    }
    const twice = new Set(out.filter((c, k) => out.findIndex((d) => d.text === c.text) !== k).map((c) => c.text));
    for (const c of out) if (twice.has(c.text)) c.sub = BY_KEY.get(c.key!)!.side === 'R' ? 'eskuinekoa' : 'ezkerrekoa';
    const c0 = CAMS[i];
    const c1 = CAMS[j];
    const target = [0, 1, 2].map((n) => lerp(c0.target[n], c1.target[n], e)) as [number, number, number];
    return { items, pts, camera: orbit(lerp(c0.yaw, c1.yaw, e), lerp(c0.elev, c1.elev, e), lerp(c0.dist, c1.dist, e), target), names: out };
  };
  return <Room3D state={state} frame={frame} continuity="eratorriak-13" label="Zainen 3D eredua" />;
}
