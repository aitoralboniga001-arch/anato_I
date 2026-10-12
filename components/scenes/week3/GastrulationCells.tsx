'use client';

import { C, Journey, Label, Mark, Note, OnTop, Part, clamp, easeInOut, lerp, lin, mix, rand, seg, type Pt, type SceneProps } from '@/components/kit';
import type { ReactNode } from 'react';
import { f1 } from './common';
import { Callout, LitCell, LitDefs, ellipsePath, frameAt, tint, type Key } from './gastroKit';

/**
 * 15–16. egunak — gastrulation, cell by cell. A close-up transverse section through the primitive
 * streak where every cell is a tracked individual, not a looping particle: the epiblast sheet flows
 * to the groove, and each cell that reaches it bottles, detaches and goes down. The first group
 * (yellow) inserts into the hypoblast row at the midline and pushes the hypoblast aside, so the
 * endoderm grows from the middle outwards; the next group (red) stops between the layers and spreads
 * sideways as mesenchyme; the cells that never reach the groove stay on top as ectoderm. Six cells
 * are followed with a trail from start to end. The companion dorsal view shows the streak, node and pit.
 */

/** Step windows of the 'gastrulazioa' stage; the dorsal and the realistic transverse views use them too. */
export const GB = { streak: 0.08, groove: 0.16, node: 0.23, converge: 0.31, invag: 0.41, endo: 0.5, meso: 0.64, ecto: 0.78, tri: 0.88 } as const;

const MID = 500;
/** Epiblast column spacing and the section's layers (y). */
const W = 24;
const EPI_TOP = 186;
const EPI_BOT = 250;
const LANE_Y = 292;
const HYP_Y = 346;
const HYP_H = 30;
const WH = 24;
const HALF = 210;

/** Departure times (per side) of the cells that go in: 7 → endoderm, then 5 → mesoderm. */
const A_LEAVE = [0.413, 0.427, 0.5, 0.512, 0.524, 0.536, 0.548];
const B_LEAVE = [0.64, 0.648, 0.656, 0.664, 0.672];
const NA = A_LEAVE.length;
const K = NA + B_LEAVE.length;
const DIVE = 0.028;
const INS = 0.018;
const RANKS = 32;

const HYP_COLOR = mix(C.hypoblast, '#6b7280', 0.5);

const leaveAt = (k: number, s: number) => (k < NA ? A_LEAVE[k] : B_LEAVE[k - NA]) + (s > 0 ? 0.006 : 0);

/** How many cell widths the epiblast sheet has slid toward the midline (a cell reaches the groove at each departure). */
function shiftOf(t: number, s: number) {
  const keys: [number, number][] = [[GB.converge, 0], ...Array.from({ length: K }, (_, k): [number, number] => [leaveAt(k, s), k + 0.5])];
  if (t <= keys[0][0]) return 0;
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
  return K - 0.5;
}

/** Cells crowd into the streak: offsets are squeezed near the midline. */
const squeeze = (o: number, t: number) => o * (1 - 0.55 * seg(t, GB.streak, GB.streak + 0.04) * Math.exp(-((o / (2.2 * W)) ** 2)));
const dipAt = (o: number, t: number) => 20 * seg(t, GB.groove, GB.groove + 0.025) * Math.exp(-((o / 28) ** 2));
const thickAt = (o: number, t: number) => 17 * seg(t, GB.streak, GB.streak + 0.04) * Math.exp(-((o / 62) ** 2));

/** Insertion progress (0..1) of endoderm cell k on side s, and when it starts. */
function insertion(k: number, s: number, t: number) {
  const arrive = leaveAt(k, s) + DIVE;
  const start = Math.max(arrive, k < 2 ? GB.endo + k * 0.02 + (s > 0 ? 0.006 : 0) : arrive);
  return seg(t, start, start + INS);
}

/** Where endoderm cell k sits in the row once inserted (later cells insert medially and push it out). */
function endoSlot(k: number, s: number, t: number) {
  let out = 0.5;
  for (let j = k + 1; j < NA; j++) out += insertion(j, s, t);
  return MID + s * out * WH;
}

function pushedOf(s: number, t: number) {
  let e = 0;
  for (let k = 0; k < NA; k++) e += insertion(k, s, t);
  return e;
}

/** Surface position of epiblast rank r on side s. */
function surface(r: number, s: number, t: number) {
  const o = (r + 0.5 - shiftOf(t, s)) * W;
  const x = MID + s * (squeeze(o, t) + 1);
  return { o, x };
}

interface Mover {
  x: number;
  y: number;
  /** 0..1 along the dive; the neck to the groove breaks at 0.45 (detachment). */
  dive: number;
  /** Endoderm: 0..1 into the row. Mesoderm: 0..1 along the lateral spread. */
  settle: number;
  color: string;
}

/** A cell that has left the epiblast: dive through the groove, then insert (endoderm) or spread (mesoderm). */
function mover(k: number, s: number, t: number): Mover {
  const t0 = leaveAt(k, s);
  const dive = easeInOut(lin(t, t0, t0 + DIVE));
  const g: Pt = [MID + s * 2, EPI_TOP + 26];
  if (k < NA) {
    const wait: Pt = [MID + s * (14 + 20 * Math.min(k, 1)), HYP_Y - HYP_H / 2 - 13];
    const c: Pt = [MID + s * 6, EPI_BOT + 18];
    const q = bez(g, c, wait, dive);
    const p = insertion(k, s, t);
    const slot: Pt = [endoSlot(k, s, t), HYP_Y];
    return { x: lerp(q[0], slot[0], p), y: lerp(q[1], slot[1], p), dive, settle: p, color: mix(C.epiblast, C.endoderm, dive) };
  }
  const j = k - NA;
  const lane: Pt = [MID + s * 16, LANE_Y + (j % 2 ? 9 : -9)];
  const q = bez(g, [MID + s * 4, EPI_BOT + 10], lane, dive);
  const spread = easeInOut(lin(t, t0 + DIVE * 0.8, t0 + DIVE * 0.8 + 0.036));
  const target = 48 + (B_LEAVE.length - 1 - j) * 25;
  const drift = 1 + 0.12 * seg(t, GB.ecto, 1);
  return { x: lerp(q[0], MID + s * target * drift, spread), y: q[1], dive, settle: spread, color: mix(C.epiblast, C.mesoIntra, dive) };
}

const bez = (a: Pt, c: Pt, b: Pt, u: number): Pt => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];

/* ------------------------------------------------------------ the fate streams */

const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, n = 22): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const v = 1 - u;
    return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
  });

/** First fraction `p` (by length) of a polyline. */
function partOf(pts: Pt[], p: number): Pt[] {
  if (p >= 1) return pts;
  const seglen = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let left = seglen.reduce((a, b) => a + b, 0) * Math.max(0, p);
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < seglen.length; i++) {
    if (left >= seglen[i]) {
      out.push(pts[i + 1]);
      left -= seglen[i];
    } else {
      const k = seglen[i] ? left / seglen[i] : 0;
      out.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]);
      break;
    }
  }
  return out;
}

/**
 * The paths the cells take, as one branching stream (Langman fig. 5.3 arrows, joined up): along the
 * epiblast into the groove (blue), then either down to the hypoblast row (yellow) or out between the
 * layers (red). Each branch grows along its length when its step is told and stays, quieter, afterwards.
 */
const STREAM = (s: number) => ({
  in: cubic([MID + s * 200, 171], [MID + s * 110, 168], [MID + s * 30, 168], [MID + s * 8, 201]),
  endo: cubic([MID + s * 5, 279], [MID + s * 6, 296], [MID + s * 9, 308], [MID + s * 13, 325], 12),
  row: cubic([MID + s * 18, HYP_Y + 30], [MID + s * 60, HYP_Y + 30], [MID + s * 100, HYP_Y + 30], [MID + s * 138, HYP_Y + 30], 8),
  hyp: cubic([MID + s * 150, HYP_Y + 30], [MID + s * 160, HYP_Y + 30], [MID + s * 170, HYP_Y + 30], [MID + s * 182, HYP_Y + 30], 4),
  meso: cubic([MID + s * 6, 279], [MID + s * 10, LANE_Y + 2], [MID + s * 40, LANE_Y], [MID + s * 176, LANE_Y], 26),
});

function Stream({ pts, p, color, w = 4, show = 1, flow }: { pts: Pt[]; p: number; color: string; w?: number; show?: number; flow?: boolean }) {
  if (show <= 0.02 || p <= 0.02) return null;
  const q = partOf(pts, p);
  if (q.length < 2) return null;
  const d = `M${q.map((v) => `${f1(v[0])},${f1(v[1])}`).join('L')}`;
  const e = q[q.length - 1];
  const b = q[Math.max(0, q.length - 3)];
  const ang = Math.atan2(e[1] - b[1], e[0] - b[0]);
  const hd = w * 3.1;
  const tipAt = (len: number, a: number): Pt => [e[0] + Math.cos(ang) * len - Math.cos(ang + a) * hd, e[1] + Math.sin(ang) * len - Math.sin(ang + a) * hd];
  const t0 = tipAt(hd * 0.55, 0.5);
  const t1 = tipAt(hd * 0.55, -0.5);
  const tipEnd: Pt = [e[0] + Math.cos(ang) * hd * 0.55, e[1] + Math.sin(ang) * hd * 0.55];
  const tip = `M${f1(tipEnd[0])},${f1(tipEnd[1])} L${f1(t0[0])},${f1(t0[1])} L${f1(t1[0])},${f1(t1[1])}Z`;
  return (
    <g opacity={show} pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* A soft band of the fate's colour under a crisp, cased core: reads on dark ground and at pane scale. */}
      <path d={d} stroke={color} strokeWidth={w * 3.4} opacity={0.16} />
      <path d={d} stroke="rgba(6,8,14,0.72)" strokeWidth={w + 3.2} />
      <path d={tip} fill="rgba(6,8,14,0.72)" stroke="rgba(6,8,14,0.72)" strokeWidth={3.2} />
      <path d={d} stroke={color} strokeWidth={w} />
      <path d={tip} fill={color} />
      {flow && <path d={d} stroke="rgba(255,255,255,0.55)" strokeWidth={w * 0.36} strokeDasharray="2 11" className="dash-flow" />}
    </g>
  );
}

type Fate = 'A' | 'B' | 'C';
const FATE_COLOR: Record<Fate, string> = { A: C.endoderm, B: C.mesoIntra, C: C.ectoderm };

/** The six followed cells: two of each fate (k = departure order, or r = surface rank for C). */
const TRACKED: { s: number; k: number; fate: Fate }[] = [
  { s: -1, k: 0, fate: 'A' },
  { s: 1, k: 3, fate: 'A' },
  { s: -1, k: 8, fate: 'B' },
  { s: 1, k: 10, fate: 'B' },
  { s: -1, k: 14, fate: 'C' },
  { s: 1, k: 15, fate: 'C' },
];

function posOf(k: number, s: number, t: number): Pt {
  if (k < K && t >= leaveAt(k, s)) {
    const m = mover(k, s, t);
    return [m.x, m.y];
  }
  const { o, x } = surface(k, s, t);
  return [x, (EPI_TOP + dipAt(o, t) + EPI_BOT + thickAt(o, t)) / 2];
}

/** Rounded column (epiblast cell); `wt` narrower than `wb` gives the bottle shape. */
function column(x: number, y0: number, y1: number, wt: number, wb: number) {
  const r = Math.max(0.5, Math.min(4, wt / 2, wb / 2));
  return `M${f1(x - wt / 2 + r)},${f1(y0)} L${f1(x + wt / 2 - r)},${f1(y0)} Q${f1(x + wt / 2)},${f1(y0)} ${f1(x + wt / 2)},${f1(y0 + r)} L${f1(x + wb / 2)},${f1(y1 - r)} Q${f1(x + wb / 2)},${f1(y1)} ${f1(x + wb / 2 - r)},${f1(y1)} L${f1(x - wb / 2 + r)},${f1(y1)} Q${f1(x - wb / 2)},${f1(y1)} ${f1(x - wb / 2)},${f1(y1 - r)} L${f1(x - wt / 2)},${f1(y0 + r)} Q${f1(x - wt / 2)},${f1(y0)} ${f1(x - wt / 2 + r)},${f1(y0)} Z`;
}

/** Stellate mesenchymal cell: body plus short processes. */
function Stellate({ x, y, r, color, arms, seed, opacity = 1 }: { x: number; y: number; r: number; color: string; arms: number; seed: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + rand(seed + i) * 0.9;
        const L = r + 9 * arms;
        return <line key={i} x1={f1(x)} y1={f1(y)} x2={f1(x + Math.cos(a) * L)} y2={f1(y + Math.sin(a) * L * 0.7)} stroke={color} strokeWidth={2.4} strokeLinecap="round" />;
      })}
      <ellipse cx={f1(x)} cy={f1(y)} rx={r} ry={r * 0.82} fill={color} stroke="rgba(10,14,28,0.5)" strokeWidth={0.9} />
      <ellipse cx={f1(x)} cy={f1(y)} rx={r} ry={r * 0.82} fill="url(#gc-shine)" />
      <circle cx={f1(x + 0.6)} cy={f1(y + 0.5)} r={r * 0.4} fill="rgba(30,20,50,0.55)" />
      <circle cx={f1(x - 0.6)} cy={f1(y - 0.4)} r={r * 0.13} fill="rgba(255,255,255,0.4)" />
    </g>
  );
}

/** Auto-zoom: wide at the start, then close on the groove while the cells go in. */
const CELL_KEYS: Key[] = [
  [0, 500, 280, 2.05],
  [0.31, 500, 280, 2.05],
  [0.36, 500, 260, 2.3],
  [0.41, 500, 260, 2.3],
  [0.46, 500, 270, 2.3],
  [0.5, 500, 270, 2.3],
  [0.55, 500, 281, 2.1],
  [0.64, 500, 281, 2.1],
  [0.69, 500, 280, 2.2],
  [0.78, 500, 280, 2.2],
  [0.83, 500, 255, 2.15],
  [0.88, 500, 255, 2.15],
  [0.93, 500, 280, 2.05],
  [1, 500, 280, 2.05],
];

/** Emphasis of each population per step: the step's subject stays bright, the rest steps back. */
function emphasis(t: number) {
  const k = (a: number, b: number) => seg(t, a, a + 0.03) * (1 - seg(t, b, b + 0.03));
  const inv = k(GB.invag, GB.endo);
  const endo = k(GB.endo, GB.meso);
  const meso = k(GB.meso, GB.ecto);
  const ecto = k(GB.ecto, GB.tri);
  const back = 0.38;
  return {
    epi: 1 - (1 - back) * Math.max(inv * 0.6, endo, meso),
    hyp: 1 - (1 - back) * Math.max(meso, ecto, inv * 0.5),
    a: 1 - (1 - back) * Math.max(meso, ecto),
    b: 1 - (1 - back) * Math.max(endo, ecto),
  };
}

/** Step call-outs under the section: [from, to, text, colour]. */
const CALLOUTS: [number, number, string, string][] = [
  [GB.converge, GB.invag, 'Epiblastoko zelulak → ildo primitibora', C.epiblast],
  [GB.invag, GB.endo, 'Inbaginazioa: zelula geruzatik askatzen da', '#e8eefc'],
  [GB.endo, GB.meso, 'Endodermoa txertatu → hipoblastoa alboetara baztertu', C.endoderm],
  [GB.meso, GB.ecto, 'Mesodermoa: goiko eta beheko geruzen ARTEAN', C.mesoIntra],
  [GB.ecto, GB.tri, 'Ektodermoa: SARTU GABE, azalean geratu', C.ectoderm],
  [GB.tri, 2, 'Hiru geruzak epiblastotik; hipoblastoa ordezkatua', '#e8eefc'],
];

const STEPS: [number, string, string][] = [
  [0, 'Bi orriko diskoa', C.epiblast],
  [GB.streak, 'Lerro primitiboa', '#dbe4ff'],
  [GB.groove, 'Ildo primitiboa', '#93a7d9'],
  [GB.node, 'Nodoa eta hobitxoa', '#dbe4ff'],
  [GB.converge, 'Zelulak ildorantz', C.epiblast],
  [GB.invag, 'Inbaginazioa', '#e8eefc'],
  [GB.endo, 'Endodermoa', C.endoderm],
  [GB.meso, 'Mesodermoa', C.mesoIntra],
  [GB.ecto, 'Ektodermoa', C.ectoderm],
  [GB.tri, 'Hiru orriko diskoa', '#e8eefc'],
];

/** The cell section for the dual view's right pane: names go to the right column, so free anchors sit on the right half. */
export function GastrulationCellsPane(props: SceneProps) {
  return GastrulationCells({ ...props, pane: true });
}

export function GastrulationCells({ t, reduced, pane }: SceneProps & { pane?: boolean }) {
  /** Anchor side for names whose spot is free (either half shows the same tissue). */
  const R = pane ? -1 : 1;
  const em = emphasis(t);
  const ectoName = t >= GB.ecto;
  const hypPush = [-1, 1].map((s) => pushedOf(s, t));
  const trackOn = seg(t, GB.converge, GB.converge + 0.03);

  // Epiblast / ectoderm surface cells (those still on top).
  const surfaceCells: { key: string; d: string; nx: number; ny: number; nr: number; tracked: boolean; fate?: Fate; streak: boolean }[] = [];
  const streakOn = t >= GB.streak;
  for (const s of [-1, 1])
    for (let r = 0; r < RANKS; r++) {
      if (r < K && t >= leaveAt(r, s)) continue;
      const { o, x } = surface(r, s, t);
      if (o > HALF + W) continue;
      const sp = Math.abs(squeeze(o + W / 2, t) - squeeze(o - W / 2, t));
      const wb = Math.max(4, sp * 0.94);
      const bottle = seg(t, GB.converge, GB.invag) * Math.exp(-((o / (1.3 * W)) ** 2));
      const wt = Math.max(2.5, wb * (1 - 0.8 * bottle));
      const y0 = EPI_TOP + dipAt(o, t);
      const y1 = EPI_BOT + thickAt(o, t) + bottle * 8;
      const nk = 0.35 + 0.35 * rand(r * 7 + (s > 0 ? 3 : 0));
      const tr = TRACKED.find((q) => q.s === s && q.k === r);
      surfaceCells.push({ key: `${s}:${r}`, d: column(x, y0, y1, wt, wb), nx: x, ny: lerp(y0, y1, nk), nr: Math.min(wb * 0.32, 5.5), tracked: !!tr, fate: tr?.fate, streak: streakOn && Math.abs(x - MID) < 2.2 * W });
    }

  // Cells that have gone in, split by fate.
  const movers: { key: string; k: number; s: number; m: Mover }[] = [];
  for (const s of [-1, 1])
    for (let k = 0; k < K; k++) if (t >= leaveAt(k, s)) movers.push({ key: `${s}:${k}`, k, s, m: mover(k, s, t) });
  const aCells = movers.filter((c) => c.k < NA);
  const bCells = movers.filter((c) => c.k >= NA);

  const neck = (c: { k: number; s: number; m: Mover }) =>
    c.m.dive < 0.45 ? <path d={`M${f1(MID + c.s * 2)},${f1(EPI_TOP + 22)} L${f1(c.m.x)},${f1(c.m.y)}`} stroke={c.m.color} strokeWidth={f1(5 * (1 - c.m.dive / 0.45) + 0.6)} strokeLinecap="round" /> : null;

  const stepIdx = STEPS.reduce((acc, st, i) => (t >= st[0] - 1e-6 ? i : acc), 0);
  const step = STEPS[stepIdx];

  const triOn = seg(t, GB.tri, GB.tri + 0.03);
  const trailOn = trackOn;
  const win = (a: number, b: number) => seg(t, a, a + 0.03) * (1 - seg(t, b, b + 0.03));

  // Fate streams: grow when their step is told, stay quieter afterwards, all bright again in the summary.
  const quiet = (told: number) => Math.max(0.42 + 0.58 * told, triOn);
  const sIn = seg(t, GB.converge, GB.converge + 0.05);
  const sEndo = seg(t, GB.invag + 0.005, GB.invag + 0.04);
  const sRow = seg(t, GB.endo + 0.01, GB.endo + 0.06);
  const sMeso = seg(t, GB.meso, GB.meso + 0.055);
  const ectoQuiet = 1 - 0.3 * win(GB.ecto, GB.tri);
  const stIn = quiet(win(GB.converge, GB.endo)) * ectoQuiet;
  const stEndo = quiet(win(GB.invag, GB.meso)) * ectoQuiet;
  const stHyp = win(GB.endo, GB.meso);
  const stMeso = quiet(win(GB.meso, GB.ecto)) * ectoQuiet;

  const z = frameAt(t, CELL_KEYS);
  // The furrow: from the surface line down to the dipped tops of the midline cells.
  const grooveOn = seg(t, GB.groove, GB.groove + 0.025);
  const furrow = Array.from({ length: 41 }, (_, i): Pt => {
    const o = lerp(-84, 84, i / 40);
    return [MID + Math.sign(o) * (squeeze(Math.abs(o), t) + 1), EPI_TOP + Math.max(0, dipAt(o, t) - 0.6)];
  });
  const groovePath = `M${furrow.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
  // The mesoderm's extent on each side: out to its farthest cell that is below the epiblast.
  const ext = [-1, 1].map((sd) => Math.max(0, ...bCells.filter((c) => c.s === sd && c.m.dive > 0.5).map((c) => Math.abs(c.m.x - MID) + 12)));
  const mesoBand =
    Math.max(...ext) > 14
      ? `M${f1(MID - Math.max(ext[0], 14))},${EPI_BOT + 2}H${f1(MID + Math.max(ext[1], 14))}V${HYP_Y - HYP_H / 2 - 1}H${f1(MID - Math.max(ext[0], 14))}Z`
      : null;
  const A = (x: number, y: number) => z.at(x, y);

  return (
    <g>
      <defs>
        <linearGradient id="gc-edge" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.07" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.93" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        {/* Light from the top left on every cell: a soft highlight that fades into a shaded lower-right edge. */}
        <linearGradient id="gc-shine" x1="0" x2="0.7" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="0.38" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.24} />
        </linearGradient>
        <LitDefs />
        <mask id="gc-fade" maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={MID - HALF} y={0} width={HALF * 2} height={640} fill="url(#gc-edge)" />
        </mask>
      </defs>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />

      <g transform={z.transform}>
      <g mask="url(#gc-fade)">
        <Part id="amnios-barrunbea" quiet>
          <rect x={MID - HALF} y={82} width={HALF * 2} height={EPI_TOP - 82} fill="rgba(143,180,247,0.07)" />
          {Array.from({ length: 22 }, (_, i) => (
            <ellipse key={i} cx={MID - HALF + 16 + i * 31} cy={80} rx={14} ry={3.6} fill={C.amnioblast} opacity={0.55} />
          ))}
        </Part>
        <Part id="bitelo-zaku-sekundarioa" quiet>
          <rect x={MID - HALF} y={HYP_Y + HYP_H / 2 + 2} width={HALF * 2} height={640 - HYP_Y} fill="rgba(242,193,78,0.05)" />
        </Part>

        {/* Hypoblast: the old lower layer, pushed sideways as endoderm cells insert at the midline. */}
        <Part id="hipoblastoa">
          <g opacity={em.hyp}>
            {[-1, 1].map((s, si) =>
              Array.from({ length: 16 }, (_, h) => {
                const x = MID + s * (h + 0.5 + hypPush[si]) * WH;
                if (Math.abs(x - MID) > HALF + WH) return null;
                return (
                  <g key={`${s}:${h}`}>
                    <rect x={f1(x - WH / 2 + 1)} y={HYP_Y - HYP_H / 2} width={WH - 2} height={HYP_H} rx={5} fill={HYP_COLOR} stroke="rgba(10,14,28,0.5)" strokeWidth={0.9} />
                    <rect x={f1(x - WH / 2 + 1)} y={HYP_Y - HYP_H / 2} width={WH - 2} height={HYP_H} rx={5} fill="url(#gc-shine)" />
                    <circle cx={f1(x)} cy={HYP_Y + 1} r={4.6} fill="rgba(30,20,50,0.5)" />
                    <circle cx={f1(x - 1.2)} cy={HYP_Y} r={1.3} fill="rgba(255,255,255,0.35)" />
                  </g>
                );
              }),
            )}
          </g>
        </Part>

        {/* The fate streams, under the cells (they mark the way the cells go, never cover them). */}
        {[-1, 1].map((s) => {
          const st = STREAM(s);
          return (
            <g key={`st${s}`}>
              <Stream pts={st.in} p={sIn} color={C.epiblast} w={4.2} show={stIn} flow={!reduced} />
              <Stream pts={st.endo} p={sEndo} color={C.endoderm} w={4.2} show={stEndo} flow={!reduced} />
              <Stream pts={st.row} p={sRow} color={C.endoderm} w={3.4} show={stEndo} flow={!reduced} />
              <Stream pts={st.hyp} p={sRow} color={HYP_COLOR} w={3} show={stHyp} />
              <Stream pts={st.meso} p={sMeso} color={C.mesoIntra} w={4.2} show={stMeso} flow={!reduced} />
            </g>
          );
        })}

        {/* The groove is the furrow itself: the space the dipping surface leaves along the midline. */}
        {grooveOn > 0.01 && (
          <Part id="ildo-primitiboa" show={grooveOn}>
            <path d={groovePath} fill="rgba(120,150,232,0.2)" />
            <path d={groovePath} fill="url(#gc-shine)" opacity={0.5} />
          </Part>
        )}
        {/* Intra-embryonic mesoderm as a tissue: loose matrix between the layers, as far as its cells have spread. */}
        {mesoBand && (
          <Part id="mesodermo-intraenbrionarioa">
            <path d={mesoBand} fill={C.mesoIntra} opacity={0.2 * em.b} />
          </Part>
        )}

        {/* Endoderm: first cells in, diving then inserting into the row. */}
        <Part id="endodermoa" show={aCells.length ? 1 : 0}>
          <g opacity={em.a}>
            {aCells.map((c) => {
              const p = c.m.settle;
              const rw = lerp(10, WH / 2 - 1, p);
              const rh = lerp(10, HYP_H / 2, p);
              return (
                <g key={c.key}>
                  {neck(c)}
                  <rect x={f1(c.m.x - rw)} y={f1(c.m.y - rh)} width={f1(rw * 2)} height={f1(rh * 2)} rx={f1(lerp(10, 5, p))} fill={c.m.color} stroke="rgba(10,14,28,0.5)" strokeWidth={0.9} />
                  <rect x={f1(c.m.x - rw)} y={f1(c.m.y - rh)} width={f1(rw * 2)} height={f1(rh * 2)} rx={f1(lerp(10, 5, p))} fill="url(#gc-shine)" />
                  <circle cx={f1(c.m.x)} cy={f1(c.m.y + 1)} r={4.4} fill="rgba(30,20,50,0.55)" />
                  <circle cx={f1(c.m.x - 1.2)} cy={f1(c.m.y)} r={1.3} fill="rgba(255,255,255,0.35)" />
                </g>
              );
            })}
          </g>
        </Part>

        {/* Intra-embryonic mesoderm: the next cells, stopping between the layers and spreading out. */}
        <Part id="mesodermo-intraenbrionarioa" show={bCells.length ? 1 : 0}>
          <g opacity={em.b}>
            {bCells.map((c) => (
              <g key={c.key}>
                {neck(c)}
                <Stellate x={c.m.x} y={c.m.y} r={9} color={c.m.color} arms={clamp(c.m.settle * 1.4)} seed={c.k * 5 + c.s} />
              </g>
            ))}
          </g>
        </Part>

        {/* Epiblast → ectoderm: the sheet that flows to the groove; what never goes in stays on top. */}
        {/* The primitive streak is the crowded, thickened midline of this same sheet: its cells belong to both. */}
        {[false, true].map((inStreak) => (
          <Part key={String(inStreak)} id={ectoName ? 'ektodermoa' : 'epiblastoa'} groups={inStreak ? ['lerro-primitiboa'] : undefined}>
            <g opacity={em.epi}>
              {surfaceCells
                .filter((c) => c.streak === inStreak)
                .map((c) => (
                  <g key={c.key}>
                    <path d={c.d} fill={ectoName ? mix(C.epiblast, '#7aa2ff', seg(t, GB.ecto, GB.ecto + 0.04)) : C.epiblast} stroke="rgba(10,14,28,0.55)" strokeWidth={0.9} />
                    <path d={c.d} fill="url(#gc-shine)" />
                    <ellipse cx={f1(c.nx)} cy={f1(c.ny)} rx={f1(c.nr)} ry={5.5} fill="rgba(30,20,50,0.55)" />
                    <circle cx={f1(c.nx - c.nr * 0.25)} cy={f1(c.ny - 1.5)} r={1.3} fill="rgba(255,255,255,0.35)" />
                  </g>
                ))}
            </g>
          </Part>
        ))}
        {/* Where the streak / groove is: a soft pool of light on the midline cells (no ring drawn over them). */}
        <Mark id={t < GB.groove ? 'lerro-primitiboa' : 'ildo-primitiboa'} x={MID} y={(EPI_TOP + EPI_BOT) / 2 + 8} rx={30} ry={40} show={seg(t, GB.streak, GB.streak + 0.04) * Math.max(0.35, 1 - trackOn)} />
      </g>

      {/* Followed cells: the same individuals from start to end; the route links where they set out and where they end. */}
      {trackOn > 0.02 && (
        <g pointerEvents="none">
          {TRACKED.map((q) => {
            const pts: Pt[] = [];
            for (let tt = GB.converge; tt < t; tt += 0.003) {
              const p = posOf(q.k, q.s, tt);
              // Cells that go in: only the last stretch on the surface (the sheet's slide is told by the stream), so no
              // trail runs sideways through the whole epiblast.
              const onSurface = !(q.k < K && tt >= leaveAt(q.k, q.s));
              if (q.fate !== 'C' && onSurface && Math.abs(p[0] - MID) > 64) continue;
              if (Math.abs(p[0] - MID) < HALF - 14) pts.push(p);
            }
            const [x, y] = posOf(q.k, q.s, t);
            pts.push([x, y]);
            const col = FATE_COLOR[q.fate];
            const subj = q.fate === 'A' ? em.a : q.fate === 'B' ? em.b : em.epi;
            // The followed cell is lit on its own outline: a column in the sheet, a block in the row, a stellate mesenchymal cell.
            const sc = surfaceCells.find((c) => c.key === `${q.s}:${q.k}`);
            const edge = clamp((HALF - 12 - Math.abs(x - MID)) / 36);
            let lit: ReactNode;
            if (sc) {
              const now = ectoName ? mix(C.epiblast, '#7aa2ff', seg(t, GB.ecto, GB.ecto + 0.04)) : C.epiblast;
              lit = (
                <LitCell d={sc.d} color={now} fate={col} show={edge}>
                  <ellipse cx={f1(sc.nx)} cy={f1(sc.ny)} rx={f1(sc.nr)} ry={5.5} fill="rgba(30,20,50,0.6)" />
                </LitCell>
              );
            } else if (q.k < K) {
              const m = mover(q.k, q.s, t);
              const p = m.settle;
              if (q.k < NA) {
                const rw = lerp(10, WH / 2 - 1, p);
                const rh = lerp(10, HYP_H / 2, p);
                const rr = lerp(10, 5, p);
                const d = `M${f1(x - rw + rr)},${f1(y - rh)} H${f1(x + rw - rr)} Q${f1(x + rw)},${f1(y - rh)} ${f1(x + rw)},${f1(y - rh + rr)} V${f1(y + rh - rr)} Q${f1(x + rw)},${f1(y + rh)} ${f1(x + rw - rr)},${f1(y + rh)} H${f1(x - rw + rr)} Q${f1(x - rw)},${f1(y + rh)} ${f1(x - rw)},${f1(y + rh - rr)} V${f1(y - rh + rr)} Q${f1(x - rw)},${f1(y - rh)} ${f1(x - rw + rr)},${f1(y - rh)} Z`;
                lit = (
                  <LitCell d={d} color={m.color} fate={col} show={edge}>
                    <circle cx={f1(x)} cy={f1(y + 1)} r={4.4} fill="rgba(30,20,50,0.6)" />
                  </LitCell>
                );
              } else {
                // Same processes as its Stellate body (same seed), lit too.
                const seed = q.k * 5 + q.s;
                const L = 9 + 9 * clamp(p * 1.4);
                const arms = Array.from({ length: 4 }, (_, i) => {
                  const a = (i / 4) * Math.PI * 2 + rand(seed + i) * 0.9;
                  return <line key={i} x1={f1(x)} y1={f1(y)} x2={f1(x + Math.cos(a) * L)} y2={f1(y + Math.sin(a) * L * 0.7)} stroke={tint(tint(m.color, col, 0.2), '#ffffff', 0.22)} strokeWidth={2.6} strokeLinecap="round" />;
                });
                lit = (
                  <g opacity={edge}>
                    {arms}
                    <LitCell d={ellipsePath(x, y, 9, 9 * 0.82)} color={m.color} fate={col}>
                      <circle cx={f1(x + 0.6)} cy={f1(y + 0.5)} r={3.6} fill="rgba(30,20,50,0.6)" />
                    </LitCell>
                  </g>
                );
              }
            }
            // The whole route (and the origin ghost) while this fate is the step's subject, and all together in the summary.
            const told = q.fate === 'A' ? win(GB.invag, GB.meso) : q.fate === 'B' ? win(GB.meso, GB.ecto) : win(GB.ecto, GB.tri);
            // In the summary the fate streams carry the paths; the individual routes step back so the picture stays clean.
            const route = Math.max(told * 0.6, triOn * 0.22);
            return (
              <g key={`${q.s}:${q.k}`} opacity={trackOn * Math.max(0.5, subj)}>
                <Journey pts={pts} color={col} head={16} width={2.6} route={route} origin={route > 0.15} r={q.fate === 'C' ? 6 : 8} show={trailOn} />
                {lit}
              </g>
            );
          })}
        </g>
      )}

      </g>

      {/* One call-out per step on the same spot: the outgoing one is gone before the incoming one fades in. */}
      {!pane && CALLOUTS.map(([a, b, text, color]) => (
        <Callout key={text} x={500} y={565} text={text} show={seg(t, a + 0.02, a + 0.045) * (1 - seg(t, b, b + 0.018))} color={color} />
      ))}


      {/* Step chip (in the dual the stage sets one for both panes). */}
      {!pane && <OnTop>
        <g pointerEvents="none">
          <rect x={MID - 100} y={34} width={200} height={26} rx={13} fill="rgba(12,12,16,0.86)" stroke="rgba(232,238,252,0.16)" />
          <circle cx={MID - 84} cy={47} r={5} fill={step[2]} />
          <text x={MID + 6} y={47} dy="0.35em" textAnchor="middle" fontSize={12.5} fontWeight={650} fill="#e8eefc" key={stepIdx}>
            {step[1]}
          </text>
        </g>
      </OnTop>}

      {!pane && <Legend t={t} />}

      {(() => {
        const label = (id: string, x: number, y: number, p: Pt, show = 1, text?: string) => {
          const [ax, ay] = A(...p);
          return <Label key={id} id={id} x={x} y={y} ax={ax} ay={ay} align={x < 500 ? 'end' : 'start'} show={show * (ay > 35 && ay < 580 ? 1 : 0)} text={text} small />;
        };
        // Names on the left column point at tissue on the left half (and the pane's right-column names at the right
        // half), each at a cell well inside its layer: a short leader that never runs across the section.
        const side = -R;
        const mine = bCells.filter((c) => c.s === side);
        const settled = mine.filter((c) => c.m.settle > 0.6);
        const pick = settled.length ? settled.reduce((a, c) => (Math.abs(Math.abs(c.m.x - MID) - 100) < Math.abs(Math.abs(a.m.x - MID) - 100) ? c : a)) : mine.at(-1);
        const currentMeso = pick?.m;
        const mesoX = MID + side * clamp(ext[side > 0 ? 1 : 0] * 0.55, 30, 100);
        const endoX = MID + side * Math.max(WH / 2, Math.min(WH * 4.5, 0.6 * Math.abs(endoSlot(0, side, t) - MID)));
        const hypoX = MID + (0.5 + hypPush[1]) * WH;
        return <>
          {/* Renamed names on the same spot hand over: the old one fades out first, then the new one fades in. */}
          {label('lerro-primitiboa', 790, 92, [MID, EPI_TOP + 30], seg(t, GB.streak, GB.streak + 0.025) * (1 - seg(t, GB.groove, GB.groove + 0.012)))}
          {label('ildo-primitiboa', 790, 92, [MID, EPI_TOP + 8], seg(t, GB.groove + 0.012, GB.groove + 0.03))}
          {label('epiblastoa', 192, 170, [MID - R * (pane ? 66 : 100), 218], 1 - seg(t, GB.ecto, GB.ecto + 0.012))}
          {label('ektodermoa', 192, 170, [MID - R * (pane ? 66 : 100), 218], seg(t, GB.ecto + 0.012, GB.ecto + 0.03))}
          {label('mesodermo-intraenbrionarioa', 198, 368, mesoBand ? [mesoX, (EPI_BOT + HYP_Y - HYP_H / 2) / 2] : currentMeso ? [currentMeso.x, currentMeso.y] : [MID, LANE_Y], currentMeso ? 1 : 0)}
          {label('endodermoa', 192, 469, [endoX, HYP_Y], seg(t, GB.endo + 0.015, GB.endo + 0.035))}
          {label('hipoblastoa', 790, 506, [hypoX, HYP_Y], 1 - seg(t, GB.meso, GB.meso + 0.02))}
          {label('amnios-barrunbea', 790, 241, [MID + 85, EPI_TOP - 24])}
          {label('bitelo-zaku-sekundarioa', 790, 566, [MID + 85, HYP_Y + 35])}
          {(() => {
            // The three-layered disc: a bracket across all three layers (ectoderm cell, mesoderm, endoderm cell).
            const a = A(MID + 108, EPI_TOP + 30);
            const b = A(MID + 108, HYP_Y + 4);
            const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            return <Label key="hiru-orriko-diskoa" id="hiru-orriko-diskoa" x={790} y={401} span={[a, b]} ax={m[0]} ay={m[1]} align="start" show={triOn} text="Hiru orriko diskoa" small />;
          })()}
        </>;
      })()}
    </g>
  );
}

/** The key: the followed-cell ring, then the three fates; the one being told lights up. */
function Legend({ t }: { t: number }) {
  const on = (a: number, b: number) => seg(t, a, a + 0.03) * (1 - seg(t, b, b + 0.03));
  const rows = [
    { color: C.endoderm, text: 'Ordezkatu → endodermoa', active: on(GB.endo, GB.meso) },
    { color: C.mesoIntra, text: 'Tartean → mesodermoa', active: on(GB.meso, GB.ecto) },
    { color: C.ectoderm, text: 'Gelditu → ektodermoa', active: on(GB.ecto, 2) },
  ];
  const show = seg(t, GB.converge, GB.converge + 0.03);
  const X = [214, 384, 556, 726];
  return <OnTop><g pointerEvents="none">
    <g opacity={show}>
      <rect x={196} y={584} width={608} height={30} rx={15} fill="rgba(12,12,16,0.86)" stroke="rgba(232,238,252,0.14)" />
      {/* The swatch is a lit cell, as in the scene: brighter body, inner glow, lit rim on its own edge. */}
      <ellipse cx={X[0] + 6} cy={599} rx={7} ry={7} fill={mix(C.epiblast, '#ffffff', 0.2)} />
      <ellipse cx={X[0] + 6} cy={599} rx={7} ry={7} fill="url(#gk-glow)" />
      <circle cx={X[0] + 6.4} cy={599.6} r={2.6} fill="rgba(30,20,50,0.6)" />
      <ellipse cx={X[0] + 6} cy={599} rx={7} ry={7} fill="none" stroke={mix('#7aa2ff', '#ffffff', 0.58)} strokeWidth={1.7} />
      <text x={X[0] + 19} y={599} dy="0.35em" fontSize={12} fontWeight={600} fill="#e8eefc">Jarraitutako zelula</text>
      {rows.map((r, i) => <g key={r.text} opacity={0.55 + 0.45 * r.active}>
        <circle cx={X[i + 1] + 6} cy={599} r={5} fill={r.color} stroke="rgba(6,8,14,0.6)" strokeWidth={1.2} />
        <text x={X[i + 1] + 17} y={599} dy="0.35em" fontSize={12} fontWeight={r.active > 0.5 ? 700 : 550} fill={r.active > 0.5 ? r.color : '#e8eefc'}>{r.text}</text>
      </g>)}
    </g>
    <Note x={500} y={76} size={10}>Zelulen bidaia: geruzen arteko tartea handituta, ibilbidea ikusteko.</Note>
  </g></OnTop>;
}
