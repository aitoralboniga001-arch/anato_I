'use client';

import { Arrow, C, Cell, Label, Mark, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { W3C, discOutlinePath, f1 } from './common';
import { DiscDrawing, makeDisc } from './DiscSection';
import { GB } from './GastrulationCells';

/**
 * 15–16. egunak — gastrulation: the primitive line/groove and Hensen's node appear, epiblast
 * cells invaginate and split into the three germ layers.
 * Both views follow the shared step windows GB (GastrulationCells.tsx), so every view of the stage
 * shows what the current step says. Dorsal: lerro→ildo primitiboa elongates cranially, nodo primitiboa ·
 *    and hobitxo primitiboa, then cells stream into the groove.
 * Transverse view: realistic cell section (DiscSection) — streak, groove, bottle cells, endoderm replacing
 *    the hypoblast from the midline outwards, mesoderm spreading laterally, epiblast → ectoderm.
 */
const D = { cx: 500, cy: 320, rx: 190, ry: 145 };

function dorsalGeometry(t: number) {
  const growth = seg(t, GB.streak, GB.converge);
  const caudalY = D.cy + D.ry - 20;
  const nodeY = lerp(caudalY, D.cy - 55, growth);
  return { caudalY, nodeY, growth };
}

function DorsalDrawing({ t, reduced }: SceneProps) {
  const outline = discOutlinePath(D.cx, D.cy, D.rx, D.rx, D.ry, D.ry);
  const { caudalY, nodeY, growth } = dorsalGeometry(t);
  const node = seg(t, GB.node, GB.node + 0.05);
  const pit = seg(t, GB.node + 0.04, GB.converge);
  const migrate = seg(t, GB.converge, GB.ecto);
  const lateral = seg(t, GB.meso, GB.tri);
  const ecto = seg(t, GB.ecto, GB.tri);

  const streakW = lerp(3, 9, growth);
  const streakPath = `M${f1(D.cx - streakW)},${f1(caudalY + 6)} Q${f1(D.cx - streakW * 1.3)},${f1((caudalY + nodeY) / 2)} ${f1(D.cx - streakW * 0.4)},${f1(nodeY + 10)} L${f1(D.cx + streakW * 0.4)},${f1(nodeY + 10)} Q${f1(D.cx + streakW * 1.3)},${f1((caudalY + nodeY) / 2)} ${f1(D.cx + streakW)},${f1(caudalY + 6)} Z`;

  const migrants = Array.from({ length: 10 }, (_, i) => {
    const along = ((t * 3.2 + i * 0.17) % 1 + 1) % 1;
    const y = lerp(caudalY, nodeY, 0.15 + 0.75 * ((i * 37) % 10) / 10);
    const side = i % 2 === 0 ? -1 : 1;
    const x = D.cx + side * lerp(streakW + 10, 1, along);
    return { x, y, o: (1 - along) * migrate };
  });

  const lateralArrows = [nodeY + 30, (caudalY + nodeY) / 2].map((y, i) => ({
    from: [D.cx, y] as Pt,
    l: [D.cx - 70 - i * 10, y - 6] as Pt,
    r: [D.cx + 70 + i * 10, y - 6] as Pt,
  }));

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="hiru-orriko-diskoa" quiet>
        <path d={outline} fill="#1a2540" stroke="rgba(232,238,252,0.25)" strokeWidth={1.2} />
      </Part>

      {/* Epiblast surface, seen from above (amnion removed) — hard cut (not a crossfade) since both tints
          cover the whole disc and would otherwise alternate hiding each other's hit-target. */}
      <Part id="epiblastoa" quiet show={ecto < 0.5 ? 1 : 0}>
        <path d={outline} fill={C.epiblast} opacity={0.22} />
      </Part>
      <Part id="ektodermoa" quiet show={ecto >= 0.5 ? 1 : 0}>
        <path d={outline} fill={C.ectoderm} opacity={0.24} />
      </Part>

      {/* hiru-orriko-diskoa's own hit-target: a rim on top of the surface tint, so it stays clickable
          even though the epiblast/ectoderm tint fully overlays the disc. */}
      <Part id="hiru-orriko-diskoa" quiet>
        <path d={outline} fill="none" stroke="rgba(232,238,252,0.5)" strokeWidth={3} />
      </Part>

      {/* Hard cut (not a crossfade) between lerro/ildo: they share the same physical geometry, so only one
          can ever be the topmost hit-testable shape — beats never focus both at once anyway. */}
      <Part id="lerro-primitiboa" show={node < 0.5 ? growth : 0}>
        <path d={streakPath} fill="#2a3a63" stroke="#93a7d9" strokeWidth={1} opacity={0.9} />
      </Part>
      <Part id="ildo-primitiboa" show={node >= 0.5 ? node : 0}>
        <path d={streakPath} fill="#0c1730" stroke="#93a7d9" strokeWidth={1.2} opacity={0.95} />
      </Part>

      <Part id="nodo-primitiboa" show={node}>
        <ellipse cx={D.cx} cy={nodeY} rx={lerp(4, 15, node)} ry={lerp(4, 13, node)} fill="#0c1730" stroke="#dbe4ff" strokeWidth={1.4} />
      </Part>
      <Part id="hobitxo-primitiboa" show={pit}>
        <ellipse cx={D.cx} cy={nodeY} rx={lerp(1, 6, pit)} ry={lerp(1, 5, pit)} fill="#02040a" />
      </Part>

      {/* Epiblast cells migrating into the streak and node (bottle cells / invagination). */}
      <g opacity={migrate}>
        {migrants.map((m, i) => (
          <Cell key={i} x={m.x} y={m.y} r={4.6} color="#6f9cf2" opacity={m.o} nucleus="rgba(20,24,40,0.5)" />
        ))}
      </g>

      {!reduced &&
        lateralArrows.map((a, i) => (
          <g key={i}>
            <Arrow from={a.from} to={a.l} bend={-0.1} color={W3C.mesoIntra} show={lateral} progress={lateral} width={2} />
            <Arrow from={a.from} to={a.r} bend={0.1} color={W3C.mesoIntra} show={lateral} progress={lateral} width={2} />
          </g>
        ))}
    </g>
  );
}

function dorsalLabels(t: number) {
  const { caudalY, nodeY, growth } = dorsalGeometry(t);
  const node = seg(t, GB.node, GB.node + 0.05);
  const pit = seg(t, GB.node + 0.04, GB.converge);
  const ecto = seg(t, GB.ecto, GB.tri);
  const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} />;
  return (
    <>
      {L('lerro-primitiboa', 190, 235, [D.cx, (caudalY + nodeY) / 2 + 14], t < GB.groove ? seg(t, GB.streak, GB.streak + 0.03) : 0)}
      {L('ildo-primitiboa', 190, 270, [D.cx, (caudalY + nodeY) / 2 - 14], t >= GB.groove ? seg(t, GB.groove, GB.groove + 0.03) : 0)}
      {L('nodo-primitiboa', 190, 460, [D.cx + lerp(4, 15, node) * 0.6, nodeY], node)}
      {L('hobitxo-primitiboa', 810, 460, [D.cx + 4, nodeY], pit)}
      {L('epiblastoa', 810, 235, [D.cx + D.rx * 0.5, D.cy - 30], ecto < 0.5 ? 1 : 0)}
      {L('ektodermoa', 810, 390, [D.cx + D.rx * 0.5, D.cy - 55], ecto >= 0.5 ? 1 : 0)}
      {L('hiru-orriko-diskoa', 810, 270, [D.cx + D.rx * Math.cos((200 * Math.PI) / 180), D.cy + D.ry * Math.sin((200 * Math.PI) / 180)], seg(t, GB.tri, GB.tri + 0.04))}
    </>
  );
}

export function GastrulationDorsal(props: SceneProps) {
  return (
    <g>
      <DorsalDrawing {...props} />
      <Mark id="gastrulazioa" x={D.cx} y={D.cy} rx={D.rx + 16} ry={D.ry + 16} show={seg(props.t, GB.streak, GB.streak + 0.05)} />
      <Label id="gastrulazioa" x={810} y={90} ax={D.cx + D.rx * 0.75} ay={D.cy - D.ry * 0.7} show={seg(props.t, GB.streak, GB.streak + 0.05)} />
      {dorsalLabels(props.t)}
    </g>
  );
}

/**
 * Transverse section through the primitive streak (realistic cells, like w3 fig. "Zelula mesodermikoak
 * inbaginatzen"). Fade-in windows end at each beat's `at` (0, .14, .26, .34, .42, .5, .62, .72, .84, .94).
 */
function transverseGeometry(t: number) {
  const streak = seg(t, GB.streak, GB.streak + 0.07);
  const groove = seg(t, GB.groove, GB.groove + 0.06);
  const nodeNote = seg(t, GB.node, GB.node + 0.05) * (1 - seg(t, GB.invag - 0.01, GB.invag + 0.03));
  const converge = seg(t, GB.converge, GB.converge + 0.06) * (1 - seg(t, GB.endo, GB.endo + 0.06));
  const invag = seg(t, GB.invag, GB.invag + 0.08);
  const endo = seg(t, GB.endo, GB.endo + 0.12);
  const meso = seg(t, GB.meso, GB.meso + 0.12);
  const spreadArrows = seg(t, GB.meso, GB.meso + 0.06) * (1 - seg(t, GB.tri - 0.02, GB.tri + 0.02));
  const ecto = seg(t, GB.ecto, GB.ecto + 0.06);
  const tri = seg(t, GB.tri, GB.tri + 0.05);
  return { streak, groove, nodeNote, converge, invag, endo, meso, spreadArrows, ecto, tri };
}

function transverseDisc(t: number) {
  const g = transverseGeometry(t);
  const s = makeDisc({ streak: g.streak, groove: g.groove, invag: g.invag, phase: t * 14, endo: g.endo, meso: g.meso, ecto: g.ecto });
  return { s, g };
}

export function GastrulationTransverse({ t }: SceneProps) {
  const { s, g } = transverseDisc(t);
  const W = s.W;
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const outline = `M${[...Array.from({ length: 41 }, (_, i) => s.map(lerp(-W, W, i / 40), s.top(lerp(-W, W, i / 40)) - 1.5)), ...Array.from({ length: 41 }, (_, i) => s.map(lerp(W, -W, i / 40), s.dEnd(lerp(W, -W, i / 40)) + 11.5))]
    .map((q) => `${f1(q[0])},${f1(q[1])}`)
    .join('L')}Z`;
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={s} ids={{ epiblast: g.ecto >= 0.5 ? 'ektodermoa' : 'epiblastoa' }} />

      {/* Epiblast cells converge on the streak, then (after invaginating) spread laterally between the layers. */}
      {[1, -1].map((sd) => (
        <g key={sd}>
          <Arrow from={s.map(sd * 170, -16)} to={s.map(sd * 42, -12)} bend={sd * 0.08} color="#fbbf24" width={2} show={g.converge} />
          <Arrow from={mid(sd * 34)} to={mid(sd * 190)} bend={0} color="#fde68a" width={1.8} head={7} show={g.spreadArrows} />
        </g>
      ))}

      <Mark id="gastrulazioa" x={s.at.streak[0]} y={s.at.streak[1] + 30} rx={150} ry={95} show={g.streak} />

      <Part id="hiru-orriko-diskoa" show={g.tri}>
        <path d={outline} fill="none" stroke="#e8eefc" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.85} />
      </Part>

      <Note x={500} y={606} show={g.nodeNote} tone="dim" size={11}>
        Nodo eta hobitxo primitiboa mozketa honetatik kranealago daude (ikus ikuspegi dortsala)
      </Note>

      {L('gastrulazioa', 810, 100, s.at.streak, g.streak)}
      {L('lerro-primitiboa', 190, 170, s.at.streak, g.groove < 0.5 ? g.streak : 0)}
      {L('ildo-primitiboa', 190, 170, s.at.groove, g.groove >= 0.5 ? g.groove : 0)}
      {L('epiblastoa', 190, 215, s.at.epiblast, g.ecto < 0.5 ? 1 : 0)}
      {L('ektodermoa', 190, 215, s.at.epiblast, g.ecto >= 0.5 ? g.ecto : 0)}
      {L('mesodermo-intraenbrionarioa', 190, 420, s.at.meso, g.meso)}
      {L('hipoblastoa', 190, 460, s.at.hypo, g.endo < 0.97 ? 1 : 0)}
      {L('endodermoa', 190, 500, s.at.endo, g.endo)}
      {L('amnios-barrunbea', 810, 160, s.at.amnion)}
      {L('enbrioi-kanpoko-mesodermoa', 810, 235, s.at.extraMeso, 1, true)}
      {L('hiru-orriko-diskoa', 810, 420, s.at.disc, g.tri)}
      {L('bitelo-zaku-sekundarioa', 810, 500, s.at.yolk)}
    </g>
  );
}
