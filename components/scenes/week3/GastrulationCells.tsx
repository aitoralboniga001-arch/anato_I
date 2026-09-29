'use client';

import { Arrow, C, Label, Mark, Note, Part, clamp, easeInOut, lerp, lin, mix, rand, seg, type Pt, type SceneProps } from '@/components/kit';
import { f1 } from './common';
import { Callout, frameAt, type Key } from './gastroKit';

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
      <circle cx={f1(x + 0.6)} cy={f1(y + 0.5)} r={r * 0.4} fill="rgba(30,20,50,0.55)" />
    </g>
  );
}

/** Auto-zoom: wide at the start, then close on the groove while the cells go in. */
const CELL_KEYS: Key[] = [
  [0, 500, 280, 2.05],
  [0.31, 500, 280, 2.05],
  [0.34, 500, 260, 2.3],
  [0.41, 500, 260, 2.3],
  [0.44, 500, 270, 2.3],
  [0.5, 500, 270, 2.3],
  [0.53, 500, 281, 2.1],
  [0.64, 500, 281, 2.1],
  [0.67, 500, 280, 2.2],
  [0.78, 500, 280, 2.2],
  [0.81, 500, 255, 2.15],
  [0.88, 500, 255, 2.15],
  [0.91, 500, 280, 2.05],
  [1, 500, 280, 2.05],
];

/** Emphasis of each population per step: the step's subject stays bright, the rest steps back. */
function emphasis(t: number) {
  const k = (a: number, b: number) => seg(t, a, a + 0.02) * (1 - seg(t, b - 0.01, b + 0.01));
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

export function GastrulationCells({ t, reduced }: SceneProps) {
  const em = emphasis(t);
  const ectoName = t >= GB.ecto;
  const hypPush = [-1, 1].map((s) => pushedOf(s, t));
  const trackOn = seg(t, GB.converge, GB.converge + 0.03);

  // Epiblast / ectoderm surface cells (those still on top).
  const surfaceCells: { key: string; d: string; nx: number; ny: number; nr: number; tracked: boolean; fate?: Fate }[] = [];
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
      surfaceCells.push({ key: `${s}:${r}`, d: column(x, y0, y1, wt, wb), nx: x, ny: lerp(y0, y1, nk), nr: Math.min(wb * 0.32, 5.5), tracked: !!tr, fate: tr?.fate });
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

  const conv = seg(t, GB.converge, GB.converge + 0.03) * (1 - seg(t, GB.invag + 0.03, GB.invag + 0.06));
  const invagOn = seg(t, GB.invag, GB.invag + 0.02) * (1 - seg(t, GB.endo + 0.02, GB.endo + 0.05));
  const endoOn = seg(t, GB.endo + 0.02, GB.endo + 0.05) * (1 - seg(t, GB.meso - 0.01, GB.meso + 0.02));
  const mesoOn = seg(t, GB.meso + 0.02, GB.meso + 0.05) * (1 - seg(t, GB.ecto - 0.01, GB.ecto + 0.02));
  const ectoOn = seg(t, GB.ecto + 0.01, GB.ecto + 0.04) * (1 - seg(t, GB.tri - 0.01, GB.tri + 0.02));
  const triOn = seg(t, GB.tri, GB.tri + 0.03);
  const trailOn = trackOn * (1 - triOn * 0.5);

  const z = frameAt(t, CELL_KEYS);
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
                    <circle cx={f1(x)} cy={HYP_Y + 1} r={4.6} fill="rgba(30,20,50,0.5)" />
                  </g>
                );
              }),
            )}
          </g>
        </Part>

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
                  <circle cx={f1(c.m.x)} cy={f1(c.m.y + 1)} r={4.4} fill="rgba(30,20,50,0.55)" />
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
        <Part id={ectoName ? 'ektodermoa' : 'epiblastoa'}>
          <g opacity={em.epi}>
            {surfaceCells.map((c) => (
              <g key={c.key}>
                <path d={c.d} fill={ectoName ? mix(C.epiblast, '#7aa2ff', seg(t, GB.ecto, GB.ecto + 0.04)) : C.epiblast} stroke="rgba(10,14,28,0.55)" strokeWidth={0.9} />
                <ellipse cx={f1(c.nx)} cy={f1(c.ny)} rx={f1(c.nr)} ry={5.5} fill="rgba(30,20,50,0.55)" />
              </g>
            ))}
          </g>
        </Part>
        <Part id={t < GB.groove ? 'lerro-primitiboa' : 'ildo-primitiboa'} show={seg(t, GB.streak, GB.streak + 0.04)} quiet>
          <ellipse cx={MID} cy={(EPI_TOP + EPI_BOT) / 2 + 6} rx={21} ry={31} fill="none" stroke="#dbe4ff" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.7} />
        </Part>
      </g>

      {/* Followed cells: ring and trail, same individuals from start to end. */}
      {trackOn > 0.02 && (
        <g pointerEvents="none">
          {TRACKED.map((q) => {
            const pts: Pt[] = [];
            for (let i = 14; i >= 0; i--) {
              const tt = t - i * 0.009;
              if (tt >= GB.converge) pts.push(posOf(q.k, q.s, tt));
            }
            const [x, y] = posOf(q.k, q.s, t);
            const col = FATE_COLOR[q.fate];
            const moving = pts.length > 1 && Math.hypot(pts[0][0] - x, pts[0][1] - y) > 3;
            const subj = q.fate === 'A' ? em.a : q.fate === 'B' ? em.b : em.epi;
            return (
              <g key={`${q.s}:${q.k}`} opacity={trackOn * Math.max(0.45, subj) * clamp((HALF - 12 - Math.abs(x - MID)) / 36)}>
                {moving && <path d={`M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}`} fill="none" stroke={col} strokeWidth={2.2} strokeDasharray="2 4" strokeLinecap="round" opacity={trailOn} />}
                <circle cx={f1(x)} cy={f1(y)} r={q.fate === 'C' ? 9 : 13} fill="none" stroke="#fff" strokeWidth={1.8} />
                <circle cx={f1(x)} cy={f1(y)} r={q.fate === 'C' ? 12 : 16} fill="none" stroke={col} strokeWidth={1.4} opacity={0.8} />
              </g>
            );
          })}
        </g>
      )}

      {/* Movement arrows for the step being told. */}
      <g pointerEvents="none">
        {conv > 0.02 && (
          <g opacity={conv}>
            <Arrow from={[MID - 185, 160]} to={[MID - 40, 170]} bend={0.08} color={C.epiblast} width={2.4} flow={!reduced} />
            <Arrow from={[MID + 185, 160]} to={[MID + 40, 170]} bend={-0.08} color={C.epiblast} width={2.4} flow={!reduced} />
          </g>
        )}
        {invagOn > 0.02 && <Arrow from={[MID + 30, 150]} to={[MID + 30, 300]} bend={-0.25} color="#e8eefc" width={2.4} flow={!reduced} show={invagOn} />}
        {endoOn > 0.02 && (
          <g opacity={endoOn}>
            <Arrow from={[MID - 150, HYP_Y + 34]} to={[MID - 185, HYP_Y + 34]} bend={0} color={HYP_COLOR} width={2.2} flow={!reduced} />
            <Arrow from={[MID + 150, HYP_Y + 34]} to={[MID + 185, HYP_Y + 34]} bend={0} color={HYP_COLOR} width={2.2} flow={!reduced} />
          </g>
        )}
        {mesoOn > 0.02 && (
          <g opacity={mesoOn}>
            <Arrow from={[MID - 40, LANE_Y]} to={[MID - 170, LANE_Y]} bend={0} color={C.mesoIntra} width={2.2} flow={!reduced} />
            <Arrow from={[MID + 40, LANE_Y]} to={[MID + 170, LANE_Y]} bend={0} color={C.mesoIntra} width={2.2} flow={!reduced} />
          </g>
        )}
      </g>

      <Mark id="gastrulazioa" x={MID} y={276} rx={40} ry={82} show={seg(t, GB.converge, GB.converge + 0.03)} />
      </g>

      <Callout x={500} y={565} text="Epiblastoko zelulak → ildo primitibora" show={t >= GB.converge && t < GB.invag ? conv : 0} color={C.epiblast} />
      <Callout x={500} y={565} text="Inbaginazioa: zelula geruzatik askatzen da" show={t >= GB.invag && t < GB.endo ? invagOn : 0} />
      <Callout x={500} y={565} text="Endodermoa txertatu → hipoblastoa alboetara baztertu" show={t >= GB.endo && t < GB.meso ? endoOn : 0} color={C.endoderm} />
      <Callout x={500} y={565} text="Mesodermoa: goiko eta beheko geruzen ARTEAN" show={t >= GB.meso && t < GB.ecto ? mesoOn : 0} color={C.mesoIntra} />
      <Callout x={500} y={565} text="Ektodermoa: SARTU GABE, azalean geratu" show={t >= GB.ecto && t < GB.tri ? ectoOn : 0} color={C.ectoderm} />
      <Callout x={500} y={565} text="Hiru geruzak epiblastotik; hipoblastoa ordezkatua" show={triOn} />

      {/* A bracket is a real, clickable representation of the three-layer disc. */}
      <Mark id="hiru-orriko-diskoa" show={triOn}>
        <path d={`M${A(MID - 156, EPI_TOP - 4).join(',')}h-12V${A(0, HYP_Y + 19)[1]}h12M${A(MID + 156, EPI_TOP - 4).join(',')}h12V${A(0, HYP_Y + 19)[1]}h-12`} fill="none" stroke="#e8eefc" strokeWidth={2} strokeDasharray="5 4" />
      </Mark>

      {/* Step chip. */}
      <g pointerEvents="none">
        <rect x={MID - 100} y={34} width={200} height={26} rx={13} fill="rgba(12,12,16,0.86)" stroke="rgba(232,238,252,0.16)" />
        <circle cx={MID - 84} cy={47} r={5} fill={step[2]} />
        <text x={MID + 6} y={47} dy="0.35em" textAnchor="middle" fontSize={12.5} fontWeight={650} fill="#e8eefc" key={stepIdx}>
          {step[1]}
        </text>
      </g>

      <Legend t={t} />

      {(() => {
        const label = (id: string, x: number, y: number, p: Pt, show = 1, text?: string) => {
          const [ax, ay] = A(...p);
          return <Label key={id} id={id} x={x} y={y} ax={ax} ay={ay} align={x < 500 ? 'end' : 'start'} show={show * (ay > 35 && ay < 580 ? 1 : 0)} text={text} small />;
        };
        const currentMeso = bCells.at(-1)?.m;
        const hypoX = MID + (0.5 + hypPush[1]) * WH;
        return <>
          {label('gastrulazioa', 192, 81, [MID - 38, 270], trackOn)}
          {label(t < GB.groove ? 'lerro-primitiboa' : 'ildo-primitiboa', 790, 92, [MID + 3, EPI_TOP + 23], seg(t, GB.streak, GB.streak + 0.025))}
          {label(ectoName ? 'ektodermoa' : 'epiblastoa', 192, 170, [MID - 100, 218])}
          {label('mesodermo-intraenbrionarioa', 192, 368, currentMeso ? [currentMeso.x, currentMeso.y] : [MID, LANE_Y], currentMeso ? 1 : 0)}
          {label('endodermoa', 192, 469, [MID - WH / 2, HYP_Y], seg(t, GB.endo + 0.015, GB.endo + 0.035))}
          {label('hipoblastoa', 790, 506, [hypoX, HYP_Y], 1 - seg(t, GB.meso, GB.meso + 0.02))}
          {label('amnios-barrunbea', 790, 241, [MID + 85, EPI_TOP - 24])}
          {label('bitelo-zaku-sekundarioa', 790, 566, [MID + 85, HYP_Y + 35])}
          {label('hiru-orriko-diskoa', 790, 401, [MID + 156, 290], triOn, 'Hiru orriko diskoa')}
        </>;
      })()}
    </g>
  );
}

/** A compact destination key; its highlight follows the active step. */
function Legend({ t }: { t: number }) {
  const rows = [
    { color: C.endoderm, text: 'Ordezkatu → endodermoa', active: t >= GB.endo && t < GB.meso },
    { color: C.mesoIntra, text: 'Tartean → mesodermoa', active: t >= GB.meso && t < GB.ecto },
    { color: C.ectoderm, text: 'Gelditu → ektodermoa', active: t >= GB.ecto },
  ];
  return <g pointerEvents="none">
    {rows.map((r, i) => <g key={r.text} opacity={r.active ? 1 : 0.38}>
      <circle cx={245 + i * 205} cy={589} r={4} fill={r.color} />
      <Note x={255 + i * 205} y={589} align="start" tone="accent" size={11}>{r.text}</Note>
    </g>)}
    <Note x={500} y={76} size={10}>Zelulen bidaia: geruzen arteko tartea handituta, ibilbidea ikusteko.</Note>
  </g>;
}
