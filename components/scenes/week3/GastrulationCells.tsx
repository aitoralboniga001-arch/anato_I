'use client';

import { Arrow, C, Label, Mark, Note, Part, clamp, easeInOut, lerp, lin, mix, rand, seg, useScene, type Pt, type SceneProps } from '@/components/kit';
import { f1 } from './common';

/**
 * 15–16. egunak — gastrulation, cell by cell. A close-up transverse section through the primitive
 * streak where every cell is a tracked individual, not a looping particle: the epiblast sheet flows
 * to the groove, and each cell that reaches it bottles, detaches and goes down. The first group
 * (yellow) inserts into the hypoblast row at the midline and pushes the hypoblast aside, so the
 * endoderm grows from the middle outwards; the next group (red) stops between the layers and spreads
 * sideways as mesenchyme; the cells that never reach the groove stay on top as ectoderm. Six cells
 * are followed with a trail from start to end. An inset shows the disc from above (streak, node,
 * pit) and where the section is cut.
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
const WH = 32;
const HALF = 318;

/** Departure times (per side) of the cells that go in: 7 → endoderm, then 5 → mesoderm. */
const A_LEAVE = [0.415, 0.445, 0.5, 0.518, 0.536, 0.554, 0.572];
const B_LEAVE = [0.64, 0.654, 0.668, 0.682, 0.696];
const NA = A_LEAVE.length;
const K = NA + B_LEAVE.length;
const DIVE = 0.04;
const INS = 0.025;
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
const squeeze = (o: number, t: number) => o * (1 - 0.55 * seg(t, GB.streak, GB.groove) * Math.exp(-((o / (2.2 * W)) ** 2)));
const dipAt = (o: number, t: number) => 20 * seg(t, GB.groove, GB.node) * Math.exp(-((o / 28) ** 2));
const thickAt = (o: number, t: number) => 17 * seg(t, GB.streak, GB.groove) * Math.exp(-((o / 62) ** 2));

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
  const spread = easeInOut(lin(t, t0 + DIVE * 0.8, t0 + DIVE * 0.8 + 0.045));
  const target = 60 + (B_LEAVE.length - 1 - j) * 62;
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

/** Short on-scene call-out on a dark chip, optionally pointing at something. */
function Callout({ x, y, text, show, color = '#e8eefc', to, align = 'middle' }: { x: number; y: number; text: string; show: number; color?: string; to?: Pt; align?: 'start' | 'middle' | 'end' }) {
  const ctx = useScene();
  if (show <= 0.02 || !ctx.showLabels || ctx.quiz) return null;
  const w = text.length * 6.9 + 18;
  const x0 = align === 'middle' ? x - w / 2 : align === 'end' ? x - w : x;
  return (
    <g opacity={show} pointerEvents="none">
      {to && <path d={`M${f1(x)},${f1(y)} L${f1(to[0])},${f1(to[1])}`} stroke={color} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.8} />}
      {to && <circle cx={to[0]} cy={to[1]} r={3} fill={color} />}
      <rect x={f1(x0)} y={y - 12} width={f1(w)} height={24} rx={12} fill="rgba(12,12,16,0.88)" stroke={color} strokeOpacity={0.55} />
      <text x={f1(x0 + w / 2)} y={y} dy="0.35em" textAnchor="middle" fontSize={12.5} fontWeight={600} fill={color}>
        {text}
      </text>
    </g>
  );
}

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

/** Top-right inset: the disc from above, with the streak, node, pit and the plane of this section. */
function Inset({ t }: { t: number }) {
  const cx = 846;
  const cy = 104;
  const growth = seg(t, GB.streak, GB.node + 0.05);
  const caudal = cy + 40;
  const nodeY = lerp(caudal, cy - 8, growth);
  const node = seg(t, GB.node, GB.node + 0.04);
  const pit = seg(t, GB.node + 0.035, GB.converge);
  const cutY = cy + 22;
  const flow = seg(t, GB.converge, GB.converge + 0.03) * (1 - seg(t, GB.ecto, GB.ecto + 0.03));
  const w = lerp(1.5, 4, growth);
  return (
    <g>
      <rect x={764} y={20} width={164} height={160} rx={12} fill="rgba(12,12,16,0.82)" stroke="rgba(232,238,252,0.14)" />
      <Note x={846} y={36} size={10.5}>
        Goitik ikusita · kraneala ▲
      </Note>
      <ellipse cx={cx} cy={cy} rx={64} ry={52} fill="rgba(91,141,239,0.2)" stroke="rgba(232,238,252,0.35)" strokeWidth={1.2} />
      <Part id={t < GB.groove ? 'lerro-primitiboa' : 'ildo-primitiboa'} show={seg(t, GB.streak, GB.streak + 0.03)}>
        <path d={`M${f1(cx - w)},${f1(caudal)} L${f1(cx - w * 0.6)},${f1(nodeY + 4)} L${f1(cx + w * 0.6)},${f1(nodeY + 4)} L${f1(cx + w)},${f1(caudal)} Z`} fill={t < GB.groove ? '#dbe4ff' : '#93a7d9'} />
      </Part>
      <Part id="nodo-primitiboa" show={node}>
        <circle cx={cx} cy={f1(nodeY)} r={6.5} fill="#dbe4ff" />
      </Part>
      <Part id="hobitxo-primitiboa" show={pit}>
        <circle cx={cx} cy={f1(nodeY)} r={2.6} fill="#0c1730" />
      </Part>
      {flow > 0.02 && (
        <g opacity={flow}>
          <Arrow from={[cx - 52, cutY - 10]} to={[cx - 10, cutY - 4]} bend={0.1} color={C.epiblast} width={1.8} head={6} />
          <Arrow from={[cx + 52, cutY - 10]} to={[cx + 10, cutY - 4]} bend={-0.1} color={C.epiblast} width={1.8} head={6} />
        </g>
      )}
      <line x1={cx - 72} y1={cutY} x2={cx + 72} y2={cutY} stroke="#ffb86b" strokeWidth={1.4} strokeDasharray="4 3" />
      <Note x={846} y={168} size={10.5} tone="accent">
        - - mozketa hau
      </Note>
    </g>
  );
}

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
  const isTracked = (k: number, s: number) => TRACKED.some((q) => q.s === s && q.k === k);

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
          <ellipse cx={MID} cy={(EPI_TOP + EPI_BOT) / 2 + 6} rx={46} ry={40} fill="none" stroke="#dbe4ff" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.7 * (1 - seg(t, GB.converge, GB.invag))} />
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
            <Arrow from={[MID - 300, 160]} to={[MID - 40, 170]} bend={0.08} color={C.epiblast} width={2.4} flow={!reduced} />
            <Arrow from={[MID + 300, 160]} to={[MID + 40, 170]} bend={-0.08} color={C.epiblast} width={2.4} flow={!reduced} />
          </g>
        )}
        {invagOn > 0.02 && <Arrow from={[MID + 30, 150]} to={[MID + 30, 300]} bend={-0.25} color="#e8eefc" width={2.4} flow={!reduced} show={invagOn} />}
        {endoOn > 0.02 && (
          <g opacity={endoOn}>
            <Arrow from={[MID - 150, HYP_Y + 34]} to={[MID - 300, HYP_Y + 34]} bend={0} color={HYP_COLOR} width={2.2} flow={!reduced} />
            <Arrow from={[MID + 150, HYP_Y + 34]} to={[MID + 300, HYP_Y + 34]} bend={0} color={HYP_COLOR} width={2.2} flow={!reduced} />
          </g>
        )}
        {mesoOn > 0.02 && (
          <g opacity={mesoOn}>
            <Arrow from={[MID - 40, LANE_Y]} to={[MID - 250, LANE_Y]} bend={0} color={C.mesoIntra} width={2.2} flow={!reduced} />
            <Arrow from={[MID + 40, LANE_Y]} to={[MID + 250, LANE_Y]} bend={0} color={C.mesoIntra} width={2.2} flow={!reduced} />
          </g>
        )}
      </g>

      {/* Call-outs: what the cells are doing right now. */}
      <Callout x={MID - 170} y={132} text="epiblastoko zelulak → ildorantz" show={conv} color="#a9c3ff" />
      <Callout x={MID + 145} y={132} text="sartu eta askatu: inbaginazioa" show={invagOn} />
      <Callout x={MID} y={HYP_Y + 64} text="lehenak: hipoblastoa ordezkatzen dute → endodermoa" show={endoOn} color={C.endoderm} />
      <Callout x={MID} y={HYP_Y + 64} text="hurrengoak: tartean geratzen dira → mesodermo intraenbrionarioa" show={mesoOn} color="#ff8a8a" to={[MID - 180, LANE_Y]} />
      <Callout x={MID - 150} y={132} text="sartzen ez direnak: azalean → ektodermoa" show={ectoOn} color="#a9c3ff" to={[MID - 100, EPI_TOP + 4]} />
      <Callout x={MID} y={HYP_Y + 64} text="ektodermoa · mesodermoa · endodermoa — hirurak epiblastotik" show={triOn} />

      <Mark id="gastrulazioa" x={MID} y={(EPI_TOP + LANE_Y) / 2} rx={190} ry={120} show={seg(t, GB.converge, GB.converge + 0.03)} />
      <Label id="gastrulazioa" x={170} y={150} ax={MID - 150} ay={EPI_TOP + 20} show={seg(t, GB.converge, GB.converge + 0.03)} />

      <Inset t={t} />

      {/* Step chip. */}
      <g pointerEvents="none">
        <rect x={MID - 100} y={34} width={200} height={26} rx={13} fill="rgba(12,12,16,0.86)" stroke="rgba(232,238,252,0.16)" />
        <circle cx={MID - 84} cy={47} r={5} fill={step[2]} />
        <text x={MID + 6} y={47} dy="0.35em" textAnchor="middle" fontSize={12.5} fontWeight={650} fill="#e8eefc" key={stepIdx}>
          {step[1]}
        </text>
      </g>

      <Legend t={t} />

      <Label id="amnios-barrunbea" x={MID + 190} y={104} align="middle" small />
      <Label id={ectoName ? 'ektodermoa' : 'epiblastoa'} x={170} y={218} ax={MID - HALF + 34} ay={218} small />
      <Label id="lerro-primitiboa" x={MID - 130} y={112} ax={MID - 20} ay={EPI_TOP + 8} show={seg(t, GB.streak, GB.streak + 0.03) * (1 - seg(t, GB.groove - 0.01, GB.groove + 0.01))} />
      <Label id="ildo-primitiboa" x={MID - 130} y={112} ax={MID - 6} ay={EPI_TOP + 14} show={seg(t, GB.groove, GB.groove + 0.03) * (1 - conv) * (1 - invagOn) * (1 - ectoOn)} />
      <Label id="mesodermo-intraenbrionarioa" x={192} y={LANE_Y + 2} ax={MID - 240} ay={LANE_Y} small show={seg(t, GB.meso + 0.08, GB.meso + 0.11)} />
      <Label id="endodermoa" x={170} y={HYP_Y + 2} ax={MID - 170} ay={HYP_Y} small show={seg(t, GB.endo + 0.06, GB.endo + 0.09)} />
      <Label id="hipoblastoa" x={170} y={HYP_Y + 2} ax={MID - HALF + 34} ay={HYP_Y} small show={1 - seg(t, GB.endo + 0.04, GB.endo + 0.06)} />
      <Label id="hipoblastoa" x={836} y={HYP_Y + 2} ax={MID + HALF - 34} ay={HYP_Y} small show={seg(t, GB.endo + 0.06, GB.endo + 0.09)} />
      <Label id="bitelo-zaku-sekundarioa" x={MID - 170} y={470} align="middle" small />
      <Label id="hiru-orriko-diskoa" text="Hiru orriko diskoa" x={836} y={272} ax={MID + HALF - 30} ay={272} small show={triOn} />
    </g>
  );
}

/** Colour key of the populations; the row of the step's subject is lit. */
function Legend({ t }: { t: number }) {
  const rows: { color: string; text: string; on: number; lit: number; ring?: boolean }[] = [
    { color: C.epiblast, text: 'Epiblastoa → azalean: ektodermoa', on: 1, lit: seg(t, GB.ecto, GB.ecto + 0.02) * (1 - seg(t, GB.tri, GB.tri + 0.02)) },
    { color: C.endoderm, text: '1. taldea: sartu → endodermoa', on: seg(t, GB.invag, GB.invag + 0.03), lit: seg(t, GB.endo, GB.endo + 0.02) * (1 - seg(t, GB.meso, GB.meso + 0.02)) },
    { color: C.mesoIntra, text: '2. taldea: sartu → mesodermoa', on: seg(t, GB.meso - 0.03, GB.meso), lit: seg(t, GB.meso, GB.meso + 0.02) * (1 - seg(t, GB.ecto, GB.ecto + 0.02)) },
    { color: HYP_COLOR, text: 'Hipoblastoa: alboetara baztertua', on: 1, lit: seg(t, GB.endo, GB.endo + 0.02) * (1 - seg(t, GB.meso, GB.meso + 0.02)) },
    { color: '#fff', text: 'Jarraitutako zelula (arrastoa)', on: seg(t, GB.converge, GB.converge + 0.03), lit: 0, ring: true },
  ];
  const x = 742;
  const y = 492;
  return (
    <g pointerEvents="none">
      <rect x={x - 14} y={y - 26} width={258} height={146} rx={12} fill="rgba(12,12,16,0.82)" stroke="rgba(232,238,252,0.14)" />
      <text x={x} y={y - 10} fontSize={10.5} fontWeight={600} letterSpacing="0.08em" fill="rgba(232,238,252,0.55)">
        NORK ZER EGITEN DU?
      </text>
      {rows.map((r, i) => (
        <g key={r.text} opacity={lerp(0.28, 1, r.on) * lerp(0.8, 1, r.lit)} transform={`translate(${x} ${y + 12 + i * 23})`}>
          {r.lit > 0.02 && <rect x={-8} y={-10} width={242} height={20} rx={6} fill="rgba(255,255,255,0.07)" opacity={r.lit} />}
          {r.ring ? <circle cx={6} cy={0} r={5.5} fill="none" stroke="#fff" strokeWidth={1.6} /> : <rect x={0} y={-6} width={12} height={12} rx={3} fill={r.color} />}
          <text x={22} y={0} dy="0.35em" fontSize={12} fontWeight={r.lit > 0.5 ? 650 : 500} fill="#e8eefc">
            {r.text}
          </text>
        </g>
      ))}
    </g>
  );
}
