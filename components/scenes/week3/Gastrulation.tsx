'use client';

import { Arrow, C, Label, Mark, Note, Part, clamp, dual, lerp, mix, seg, type Pt, type SceneProps } from '@/components/kit';
import { f1 } from './common';
import { DiscDrawing, makeDisc } from './DiscSection';
import { GB, GastrulationCellsPane } from './GastrulationCells';
import { Chips, GastrulationDorsalPane } from './GastrulationDorsal';
export { GastrulationDorsal } from './GastrulationDorsal';
import { columnY, frameAt, inFrame, type Key } from './gastroKit';

/**
 * 15–16. egunak — gastrulation. Both views follow the shared step windows GB (GastrulationCells.tsx),
 * so every view of the stage shows what the current step says, and each step gets its own close-up
 * (auto-zoom): streak → groove → node/pit → converging cells → invagination → endoderm → mesoderm → ectoderm.
 *
 * Dorsal view: GastrulationDorsal.tsx (cut-away disc from above, tracked cells; the dual uses its pane mode).
 * Transverse view: realistic cell section (DiscSection), zoomed on the streak and then on the layers.
 */
const TRANS_KEYS: Key[] = [
  [0, 500, 293, 1.12],
  [0.08, 500, 293, 1.12],
  [0.125, 500, 290, 1.42],
  [0.31, 500, 290, 1.42],
  [0.36, 500, 285, 1.7],
  [0.5, 500, 285, 1.7],
  [0.55, 500, 305, 1.5],
  [0.64, 500, 305, 1.5],
  [0.69, 500, 310, 1.45],
  [0.88, 500, 310, 1.45],
  [0.93, 500, 308, 1.3],
  [1, 500, 308, 1.3],
];

/* ------------------------------------------------------------ transverse */

/**
 * Transverse section through the primitive streak (realistic cells, like w3 fig. "Zelula mesodermikoak
 * inbaginatzen"). Changes settle before the guided player's pre-beat hold.
 */
function transverseGeometry(t: number) {
  const streak = seg(t, GB.streak, GB.streak + 0.04);
  const groove = seg(t, GB.groove, GB.groove + 0.025);
  const nodeNote = seg(t, GB.node, GB.node + 0.022) * (1 - seg(t, GB.invag - 0.01, GB.invag + 0.03));
  const converge = seg(t, GB.converge, GB.converge + 0.06) * (1 - seg(t, GB.endo, GB.endo + 0.06));
  const invag = seg(t, GB.invag, GB.invag + 0.045);
  const endo = seg(t, GB.endo, GB.endo + 0.095);
  const meso = seg(t, GB.meso, GB.meso + 0.095);
  const endoArrows = seg(t, GB.endo + 0.02, GB.endo + 0.08) * (1 - seg(t, GB.meso - 0.02, GB.meso + 0.02));
  const spreadArrows = seg(t, GB.meso, GB.meso + 0.06) * (1 - seg(t, GB.ecto - 0.02, GB.ecto + 0.02));
  const ecto = seg(t, GB.ecto, GB.ecto + 0.06);
  const tri = seg(t, GB.tri, GB.tri + 0.05);
  return { streak, groove, nodeNote, converge, invag, endo, meso, endoArrows, spreadArrows, ecto, tri };
}

export function GastrulationTransverse({ t, reduced }: SceneProps) {
  const g = transverseGeometry(t);
  const s = makeDisc({ k: 1.55, w: 165, y: 250, amnionH: 80, yolkH: 95, streak: g.streak, groove: g.groove, invag: 0, endo: g.endo, meso: g.meso, ecto: g.ecto });
  const z = frameAt(t, TRANS_KEYS);
  const W = s.W;
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const low = (x: number) => s.map(x, s.dEnd(x) + 5);
  const outline = `M${[...Array.from({ length: 41 }, (_, i) => s.map(lerp(-W, W, i / 40), s.top(lerp(-W, W, i / 40)) - 1.5)), ...Array.from({ length: 41 }, (_, i) => s.map(lerp(W, -W, i / 40), s.dEnd(lerp(W, -W, i / 40)) + 11.5))]
    .map((q) => `${f1(q[0])},${f1(q[1])}`)
    .join('L')}Z`;

  const gastAt = z.at(...s.at.streak);
  const anchors = {
    lerro: z.at(...s.at.streak),
    ildo: z.at(...s.at.groove),
    epi: z.at(...s.at.epiblast),
    meso: z.at(...s.at.meso),
    hypo: z.at(...s.at.hypo),
    endo: z.at(...s.at.endo),
    amnion: z.at(...s.at.amnion),
    extra: z.at(...s.at.extraMeso),
    disc: z.at(...s.at.disc),
    yolk: z.at(...s.at.yolk),
  };
  const leftY = columnY([anchors.lerro[1], anchors.epi[1], anchors.meso[1], anchors.hypo[1], anchors.endo[1]], 110, 575);
  const rightY = columnY([anchors.amnion[1], anchors.extra[1], anchors.disc[1], anchors.yolk[1]], 240, 575, 32);
  const ok = (p: Pt) => inFrame(p, 70);

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
        <DiscDrawing s={s} ids={{ epiblast: g.ecto >= 0.5 ? 'ektodermoa' : 'epiblastoa' }} />

        {/* Finite journeys: each cell enters once, then reaches its own layer. */}
        {(['endodermoa', 'mesodermo-intraenbrionarioa'] as const).flatMap((id, group) =>
          [-1, 1].flatMap(side => Array.from({ length: 4 }, (_, i) => {
            const start = (group === 0 ? 0.413 : 0.64) + i * (group === 0 ? 0.018 : 0.012);
            if (t < start) return null;
            const descend = seg(t, start, start + 0.026);
            const moveAt = group === 0 ? Math.max(start + 0.026, 0.5 + i * 0.01) : start + 0.026;
            const travel = seg(t, moveAt, moveAt + 0.038);
            const x = side * lerp(3, 110 - i * 23, travel);
            const destination = group === 0 ? s.dEnd(x) + 5 : (s.base(x) + s.dEnd(x)) / 2;
            const p = s.map(x, lerp(s.top(0) + 9, destination, descend));
            const color = mix(C.epiblast, group === 0 ? C.endoderm : C.mesoIntra, descend);
            const origin = s.map(side * 3, s.top(0) + 9);
            return <Part key={`${id}-${side}-${i}`} id={descend < 0.5 ? 'epiblastoa' : id} show={t < GB.ecto ? 1 : 0.45}>
              {travel < 1 && <path d={`M${origin.join(',')} Q${s.map(0, destination).join(',')} ${p.join(',')}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity={0.55} />}
              <circle cx={p[0]} cy={p[1]} r={6.5} fill={color} stroke="#eff3ff" strokeWidth={1} />
              <circle cx={p[0]} cy={p[1]} r={2.2} fill="#34364b" />
            </Part>;
          })),
        )}

        {/* Fate-coloured movement: epiblast cells converge on the streak (blue); the first go under and along the hypoblast (yellow); the next spread between the layers (red). */}
        {[1, -1].map((sd) => (
          <g key={sd}>
            <Arrow from={s.map(sd * 130, -22)} to={s.map(sd * 40, -14)} bend={sd * 0.08} color={C.epiblast} width={2.4} head={8} show={g.converge} flow={!reduced} />
            <Arrow from={low(sd * 28)} to={low(sd * 125)} bend={0} color={C.endoderm} width={2.4} head={8} show={g.endoArrows} />
            <Arrow from={mid(sd * 34)} to={mid(sd * 135)} bend={0} color={C.mesoIntra} width={2.4} head={8} show={g.spreadArrows} />
          </g>
        ))}

        <Mark id="gastrulazioa" x={s.at.streak[0]} y={s.at.streak[1] + 6} rx={34} ry={26} show={g.streak} />

        <Part id="hiru-orriko-diskoa" show={g.tri}>
          <path d={outline} fill="none" stroke="rgba(6,8,14,0.6)" strokeWidth={4} />
          <path d={outline} fill="none" stroke="#f3f6ff" strokeWidth={1.6} />
        </Part>
      </g>

      <Chips t={t} y={70} />
      <Note x={500} y={590} show={g.nodeNote} tone="dim" size={11}>
        Nodo eta hobitxo primitiboa mozketa honetatik kranealago daude (ikus ikuspegi dortsala)
      </Note>

      <Label id="gastrulazioa" x={810} y={130} ax={gastAt[0]} ay={gastAt[1]} show={g.streak * ok(gastAt)} />
      <Label id="lerro-primitiboa" x={190} y={leftY[0]} ax={anchors.lerro[0]} ay={anchors.lerro[1]} show={g.streak * (1 - clamp(g.groove * 2)) * ok(anchors.lerro)} />
      <Label id="ildo-primitiboa" x={190} y={leftY[0]} ax={anchors.ildo[0]} ay={anchors.ildo[1]} show={clamp(g.groove * 2 - 1) * ok(anchors.ildo)} />
      <Label id="epiblastoa" x={190} y={leftY[1]} ax={anchors.epi[0]} ay={anchors.epi[1]} show={(1 - clamp(g.ecto * 2)) * ok(anchors.epi)} />
      <Label id="ektodermoa" x={190} y={leftY[1]} ax={anchors.epi[0]} ay={anchors.epi[1]} show={clamp(g.ecto * 2 - 1) * ok(anchors.epi)} />
      <Label id="mesodermo-intraenbrionarioa" x={198} y={leftY[2]} ax={anchors.meso[0]} ay={anchors.meso[1]} show={g.meso * ok(anchors.meso)} small />
      <Label id="hipoblastoa" x={190} y={leftY[3]} ax={anchors.hypo[0]} ay={anchors.hypo[1]} show={(1 - clamp((g.endo - 0.8) / 0.17)) * ok(anchors.hypo)} />
      <Label id="endodermoa" x={190} y={leftY[4]} ax={anchors.endo[0]} ay={anchors.endo[1]} show={g.endo * ok(anchors.endo)} />
      <Label id="amnios-barrunbea" x={810} y={rightY[0]} ax={anchors.amnion[0]} ay={anchors.amnion[1]} show={ok(anchors.amnion)} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={810} y={rightY[1]} ax={anchors.extra[0]} ay={anchors.extra[1]} show={ok(anchors.extra)} small />
      <Label id="hiru-orriko-diskoa" x={810} y={rightY[2]} ax={anchors.disc[0]} ay={anchors.disc[1]} show={g.tri * ok(anchors.disc)} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={rightY[3]} ax={anchors.yolk[0]} ay={anchors.yolk[1]} show={ok(anchors.yolk)} />
    </g>
  );
}

/**
 * Both at once: the disc from above and the cell-by-cell cross-section through the streak. The section is
 * wide and short, so the right pane gets most of the width (split 380) and shows the central part of it,
 * where the cells go in, much larger; the tall disc keeps a narrower pane.
 */
export const GastrulationBoth = dual(
  { scene: GastrulationDorsalPane, title: 'Goitik · goian kraneala', fx: 500, fy: 320, s: 0.54 },
  { scene: GastrulationCellsPane, title: 'Zeharkako mozketa · goian dortsala', fx: 500, fy: 272, s: 0.74 },
  { split: 380 },
);
