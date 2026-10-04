'use client';

import { Arrow, C, Journey, Label, Mark, Note, Part, clamp, lerp, mix, rand, seg, type Pt, type SceneProps } from '@/components/kit';
import { discOutline, f1 } from './common';
import { GB } from './GastrulationCells';
import { Callout, LitCell, LitDefs, columnY, ellipsePath, frameAt, inFrame, type Key } from './gastroKit';
import { DorsalDefs, Stellate } from './dorsalKit';

/**
 * 15–16. egunak — gastrulation seen from above (amnion cut at its edge, Langman fig. 5.2A).
 *
 * The epiblast is drawn as what it is from above: a mosaic of cell apices, lit from the top left, with
 * the cut amnion as a pale rim. The primitive streak rises as a ridge, the groove sinks along its middle,
 * and the node is a mound at its cranial end with the pit in its centre — modelled with light and shadow,
 * not outlined. Eight epiblast cells are followed: they slide to the groove, dive in, and (from the
 * invagination step on) the right half of the epiblast is lifted away like a textbook cut-away, so what
 * the cells become underneath is seen in its true colours: the yellow endoderm spreading from the midline
 * and pushing the dull hypoblast to the margin, then the red mesenchyme spreading laterally and
 * cranially between the layers. Cells that never go in stay on top: the ectoderm.
 */

const D = { cx: 500, cy: 320, rxT: 146, rxB: 128, ryT: 206, ryB: 198 };
const NODE_END = D.cy - 55;
const CAUDAL = D.cy + D.ryB - 22;

const OUTLINE = discOutline(D.cx, D.cy, D.rxT, D.rxB, D.ryT, D.ryB, 96);
const RIM = discOutline(D.cx, D.cy, D.rxT + 9, D.rxB + 9, D.ryT + 9, D.ryB + 9, 96);
const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
const OUT_D = poly(OUTLINE);
/** Half-width of the disc at height y (for keeping things inside it). */
function halfW(y: number) {
  let best = 0;
  for (let i = 0; i < OUTLINE.length; i++) {
    const a = OUTLINE[i];
    const b = OUTLINE[(i + 1) % OUTLINE.length];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) best = Math.max(best, Math.abs(lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])) - D.cx));
  }
  return best;
}

const DORSAL_KEYS: Key[] = [
  [0, 500, 320, 1.16],
  [0.08, 500, 320, 1.16],
  [0.125, 500, 392, 1.5],
  [0.16, 500, 392, 1.5],
  [0.19, 500, 380, 1.62],
  [0.23, 500, 380, 1.62],
  [0.265, 500, 300, 2],
  [0.31, 500, 300, 2],
  [0.355, 500, 320, 1.16],
  [1, 500, 320, 1.16],
];
/** In the dual's narrow pane the camera stays calm: the whole disc in view, a slight close-up on the node only. */
const PANE_KEYS: Key[] = [
  [0, 500, 320, 1],
  [0.19, 500, 320, 1],
  [0.23, 500, 330, 1.12],
  [0.31, 500, 330, 1.12],
  [0.355, 500, 320, 1],
  [1, 500, 320, 1],
];

/** One call-out chip per step (the same story in every view). */
const CHIPS: [number, string, string][] = [
  [GB.streak, 'lerro primitiboa: epiblastoaren loditasuna, alde kaudalean', '#dbe4ff'],
  [GB.groove, 'ildo primitiboa: lerroaren erdian sakonune bat', '#93a7d9'],
  [GB.node, 'nodo primitiboa (Hensen) eta hobitxo primitiboa: alde kranealean', '#dbe4ff'],
  [GB.converge, 'epiblasto-zelulak alboetatik ildorantz doaz', '#a9c3ff'],
  [GB.invag, 'ildoan sartu eta askatzen dira: inbaginazioa', '#e8eefc'],
  [GB.endo, '1. taldea (horia): hipoblastoa ordezkatzen du → endodermoa', C.endoderm],
  [GB.meso, '2. taldea (gorria): bi geruzen artean → mesodermo intraenbrionarioa', '#ff8a8a'],
  [GB.ecto, 'sartzen ez direnak (urdina): gainean → ektodermoa', '#a9c3ff'],
  [GB.tri, 'hiru orriko diskoa: ektodermoa · mesodermoa · endodermoa', '#e8eefc'],
];

export function Chips({ t, y = 78 }: { t: number; y?: number }) {
  return (
    <>
      {CHIPS.map(([a, text, color], i) => {
        const b = i + 1 < CHIPS.length ? CHIPS[i + 1][0] : 2;
        const show = seg(t, a, a + 0.02) * (1 - seg(t, b - 0.012, b));
        return <Callout key={text} x={500} y={y} text={text} show={show} color={color} />;
      })}
    </>
  );
}

/* ------------------------------------------------------------ the cells */

type Fate = 'A' | 'B' | 'C';
const FATE_COLOR: Record<Fate, string> = { A: C.endoderm, B: C.mesoIntra, C: C.ectoderm };

interface Tracked {
  fate: Fate;
  p0: Pt;
  /** Height at which the cell reaches the groove. */
  ty: number;
  /** Departure into the groove. */
  t0: number;
  /** Where it ends under the surface (null: under the opaque left half, out of sight). */
  end: Pt | null;
}

const TRACK: Tracked[] = [
  { fate: 'A', p0: [D.cx + 104, D.cy + 36], ty: D.cy + 42, t0: 0.416, end: [D.cx + 82, D.cy + 66] },
  { fate: 'A', p0: [D.cx + 86, D.cy + 128], ty: D.cy + 112, t0: 0.432, end: [D.cx + 52, D.cy + 140] },
  { fate: 'A', p0: [D.cx - 100, D.cy + 4], ty: D.cy + 14, t0: 0.448, end: null },
  { fate: 'B', p0: [D.cx + 116, D.cy - 40], ty: D.cy - 6, t0: 0.646, end: [D.cx + 92, D.cy - 112] },
  { fate: 'B', p0: [D.cx + 100, D.cy + 160], ty: D.cy + 146, t0: 0.656, end: [D.cx + 104, D.cy + 96] },
  { fate: 'B', p0: [D.cx - 112, D.cy + 88], ty: D.cy + 84, t0: 0.666, end: null },
  { fate: 'C', p0: [D.cx + 66, D.cy - 124], ty: D.cy - 30, t0: 2, end: null },
  { fate: 'C', p0: [D.cx - 72, D.cy + 146], ty: D.cy + 140, t0: 2, end: null },
];
const DIVE = 0.026;

function cellAt(c: Tracked, t: number) {
  const side = c.p0[0] < D.cx ? -1 : 1;
  const edge: Pt = [D.cx + side * 9, c.ty];
  const approach =
    c.fate === 'A' ? seg(t, GB.converge, c.t0) : c.fate === 'B' ? 0.42 * seg(t, GB.converge, GB.invag - 0.01) + 0.58 * seg(t, GB.meso - 0.04, c.t0) : 0.32 * seg(t, GB.converge, GB.invag) + 0.08 * seg(t, GB.ecto, GB.tri);
  const surf: Pt = [lerp(c.p0[0], edge[0], approach), lerp(c.p0[1], edge[1], approach)];
  if (t < c.t0) return { pos: surf, under: 0, color: C.epiblast, r: 7.5, side };
  const dive = seg(t, c.t0, c.t0 + DIVE);
  const groove: Pt = [D.cx + side * 2, c.ty];
  const s0 = c.fate === 'A' ? Math.max(c.t0 + DIVE, GB.endo + 0.004) : c.t0 + DIVE;
  const spread = seg(t, s0, s0 + (c.fate === 'A' ? 0.07 : 0.06));
  const end = c.end ?? [D.cx + side * 70, c.ty];
  const at: Pt = [lerp(edge[0], groove[0], dive), lerp(edge[1], groove[1], dive)];
  return { pos: [lerp(at[0], end[0], spread), lerp(at[1], end[1], spread)] as Pt, under: dive, color: mix(C.epiblast, FATE_COLOR[c.fate], dive), r: lerp(7.5, 6.4, dive), side };
}

/** Loose mesenchyme seen through the cut-away: cells revealed outward from the streak as the layer spreads. */
const MESO_PTS = (() => {
  const out: { p: Pt; d: number; a: number }[] = [];
  for (let i = 0; i < 90; i++) {
    const y = lerp(D.cy - D.ryT * 0.9, D.cy + D.ryB * 0.9, rand(i * 3.3 + 1));
    const w = halfW(y) * 0.93;
    const x = D.cx + 24 + (w - 24) * Math.sqrt(rand(i * 7.1 + 2));
    if (x > D.cx + w) continue;
    // Distance from the streak (nearest point on the midline segment NODE_END..CAUDAL), cranial spread a bit slower.
    const sy = clamp(y, NODE_END, CAUDAL);
    const d = Math.hypot(x - D.cx, (y - sy) * (y < sy ? 0.85 : 1.1));
    out.push({ p: [x, y], d, a: rand(i * 5.9) * 180 });
  }
  return out;
})();
const MESO_MAX = Math.max(...MESO_PTS.map((m) => m.d));

/* ------------------------------------------------------------ the scene */

function Dorsal({ t, reduced, pane }: SceneProps & { pane?: boolean }) {
  const z = frameAt(t, pane ? PANE_KEYS : DORSAL_KEYS);
  const growth = seg(t, GB.streak, GB.streak + 0.04);
  const nodeY = lerp(CAUDAL, NODE_END, growth);
  const streakW = lerp(5, 12, growth);
  const grooveOn = seg(t, GB.groove, GB.groove + 0.03);
  const node = seg(t, GB.node, GB.node + 0.022);
  const pit = seg(t, GB.node + 0.01, GB.node + 0.04);
  const conv = seg(t, GB.converge - 0.015, GB.converge + 0.02) * (1 - seg(t, GB.invag + 0.03, GB.invag + 0.06));
  // The cut-away: the right half of the epiblast is lifted away from the invagination step on.
  const peel = seg(t, GB.invag + 0.035, GB.endo - 0.005);
  const wx = lerp(D.cx + D.rxT + 12, D.cx + streakW + 13, peel);
  const endoZ = seg(t, GB.endo, GB.endo + 0.085);
  const mesoZ = seg(t, GB.meso, GB.meso + 0.09);
  const ecto = seg(t, GB.ecto, GB.ecto + 0.03);
  const tri = seg(t, GB.tri, GB.tri + 0.04);
  const endoArrow = seg(t, GB.endo + 0.01, GB.endo + 0.05) * (1 - seg(t, GB.meso - 0.02, GB.meso + 0.01));
  const mesoArrow = seg(t, GB.meso + 0.01, GB.meso + 0.06) * (1 - seg(t, GB.ecto - 0.02, GB.ecto + 0.01));
  const gast = seg(t, GB.streak, GB.streak + 0.05);
  const surfaceId = t >= GB.ecto ? 'ektodermoa' : 'epiblastoa';

  const streakPath = `M${f1(D.cx - streakW)},${f1(CAUDAL + 6)} Q${f1(D.cx - streakW * 1.35)},${f1((CAUDAL + nodeY) / 2)} ${f1(D.cx - streakW * 0.5)},${f1(nodeY + 8)} L${f1(D.cx + streakW * 0.5)},${f1(nodeY + 8)} Q${f1(D.cx + streakW * 1.35)},${f1((CAUDAL + nodeY) / 2)} ${f1(D.cx + streakW)},${f1(CAUDAL + 6)} Z`;
  const gw = streakW * 0.42 * grooveOn;
  const groovePath = `M${f1(D.cx - gw)},${f1(CAUDAL - 2)} Q${f1(D.cx - gw * 1.3)},${f1((CAUDAL + nodeY) / 2)} ${f1(D.cx - gw * 0.45)},${f1(nodeY + 13)} L${f1(D.cx + gw * 0.45)},${f1(nodeY + 13)} Q${f1(D.cx + gw * 1.3)},${f1((CAUDAL + nodeY) / 2)} ${f1(D.cx + gw)},${f1(CAUDAL - 2)} Z`;
  const win = `M${f1(wx)},${f1(D.cy - D.ryT - 30)}H${f1(D.cx + D.rxT + 30)}V${f1(D.cy + D.ryB + 30)}H${f1(wx)}Z`;
  const endoRx = lerp(12, D.rxT * 1.02, endoZ);
  const endoRy = lerp(50, D.ryT * 0.98, endoZ);
  const endoCy = lerp((NODE_END + CAUDAL) / 2 + 20, D.cy + 6, endoZ);
  const endoD = `M${f1(D.cx - endoRx)},${f1(endoCy)}a${f1(endoRx)},${f1(endoRy)} 0 1,0 ${f1(2 * endoRx)},0a${f1(endoRx)},${f1(endoRy)} 0 1,0 ${f1(-2 * endoRx)},0Z`;

  const cells = TRACK.map((c) => ({ c, s: cellAt(c, t) }));
  const showCells = seg(t, GB.converge - 0.02, GB.converge + 0.02);
  const told = (f: Fate) => (f === 'A' ? seg(t, GB.invag, GB.invag + 0.03) * (1 - seg(t, GB.meso, GB.meso + 0.03)) : f === 'B' ? seg(t, GB.meso, GB.meso + 0.03) * (1 - seg(t, GB.ecto, GB.ecto + 0.03)) : seg(t, GB.ecto, GB.ecto + 0.03) * (1 - seg(t, GB.tri, GB.tri + 0.03)));
  const trail = (c: Tracked) => {
    const pts: Pt[] = [];
    for (let tt = GB.converge; tt < t; tt += 0.004) pts.push(cellAt(c, tt).pos);
    pts.push(cellAt(c, t).pos);
    return pts;
  };
  const under = cells.filter(({ s }) => s.under > 0.5);
  const over = cells.filter(({ s }) => s.under <= 0.5);
  const u = 1 / z.s;

  // Anchors (scene space → frame).
  const A = (x: number, y: number) => z.at(x, y);
  const midY = (nodeY + CAUDAL) / 2;
  const at = {
    lerro: A(D.cx - streakW * 0.9, midY + 52),
    ildo: A(D.cx - gw * 0.4, midY - 14),
    nodo: A(D.cx - lerp(5, 17, node) * 0.85, nodeY + 3),
    pit: A(D.cx + (pane ? -2 : 3), nodeY),
    epi: A(D.cx - D.rxT * 0.5, D.cy - D.ryT * 0.42),
    rim: A(D.cx - (D.rxT + 4) * Math.cos(0.5), D.cy - (D.ryT + 4) * Math.sin(0.5)),
    gast: A(D.cx + streakW + 2, midY + 30),
    endo: A(D.cx + D.rxT * 0.5, D.cy + D.ryB * 0.42),
    hypo: A(D.cx + halfW(D.cy + D.ryB * 0.62) - 6, D.cy + D.ryB * 0.62),
    meso: A(D.cx + D.rxT * 0.42, D.cy - D.ryT * 0.18),
    tri: A(D.cx + D.rxT * 0.62, D.cy - D.ryT * 0.62),
  };
  const lerroOn = seg(t, GB.streak, GB.streak + 0.03);
  const mesoLab = seg(t, GB.meso + 0.04, GB.meso + 0.08);
  const endoLab = seg(t, GB.endo + 0.04, GB.endo + 0.08);
  const hypoLab = peel * (1 - seg(t, GB.ecto, GB.ecto + 0.03));
  const rimLab = 1 - seg(t, GB.converge - 0.03, GB.converge);
  const leftY = columnY([at.rim[1], at.epi[1], at.nodo[1], at.ildo[1], at.lerro[1]], 90, 575);
  const rightY = columnY([at.tri[1], at.pit[1], at.meso[1], at.gast[1], at.endo[1], at.hypo[1]], 240, 575);

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <DorsalDefs />
        <LitDefs />
        <clipPath id="w3g-disc">
          <path d={OUT_D} />
        </clipPath>
      </defs>
      <g transform={z.transform}>
        {/* Soft shadow under the disc gives it some depth against the background. */}
        <path d={poly(RIM)} fill="#000" opacity={0.35} transform="translate(3 6)" pointerEvents="none" />
        {/* The amnion, cut at its attachment: a pale rim around the disc (Langman: "borde del amnios"). */}
        <Part id="amnioblastoak" quiet>
          <path d={poly(RIM) + OUT_D} fill={C.amnioblast} fillRule="evenodd" opacity={0.42} />
          <path d={poly(RIM)} fill="none" stroke="#c9dbff" strokeWidth={1} opacity={0.5} />
        </Part>

        {/* Under the surface (seen only through the cut-away): hypoblast, endoderm replacing it, mesoderm between. */}
        <g clipPath="url(#w3g-disc)">
          <Part id="hipoblastoa" show={peel > 0.01 ? 1 : 0}>
            <path d={OUT_D + (endoZ > 0.01 ? endoD : '')} fill="url(#w3g-hyp)" fillRule="evenodd" />
          </Part>
          {endoZ > 0.01 && (
            <Part id="endodermoa">
              <path d={endoD} fill="url(#w3g-endo)" />
              <path d={endoD} fill="none" stroke="#ffe08a" strokeWidth={1.4} opacity={0.8} />
            </Part>
          )}
          {mesoZ > 0.01 && (
            <Part id="mesodermo-intraenbrionarioa">
              {MESO_PTS.filter((m) => m.d < mesoZ * MESO_MAX * 0.72).map((m, i) => (
                <Stellate key={i} x={m.p[0]} y={m.p[1]} r={3.2} a={m.a} color={C.mesoIntra} />
              ))}
            </Part>
          )}
          {/* Fate-coloured movement under the surface: endoderm from the midline outward, mesoderm laterally and cranially. */}
          <Arrow from={[D.cx + 22, D.cy + 96]} to={[D.cx + 112, D.cy + 96]} bend={0} color={C.endoderm} width={2.6} head={9} show={endoArrow} progress={endoArrow} />
          <Arrow from={[D.cx + 22, D.cy + 24]} to={[D.cx + 104, D.cy + 18]} bend={0} color={C.endoderm} width={2.6} head={9} show={endoArrow} progress={endoArrow} />
          <Arrow from={[D.cx + 20, D.cy + 50]} to={[D.cx + 118, D.cy + 52]} bend={0} color={C.mesoIntra} width={2.6} head={9} show={mesoArrow} progress={mesoArrow} />
          <Arrow from={[D.cx + 20, NODE_END + 24]} to={[D.cx + 70, D.cy - D.ryT * 0.72]} bend={0.18} color={C.mesoIntra} width={2.6} head={9} show={mesoArrow} progress={mesoArrow} />
          <Arrow from={[D.cx + 20, CAUDAL - 40]} to={[D.cx + 96, CAUDAL - 70]} bend={-0.12} color={C.mesoIntra} width={2.6} head={9} show={mesoArrow} progress={mesoArrow} />
          {/* Cells that went in, under the surface (hidden by it on the left; seen through the cut-away on the right). */}
          {under.map(({ c, s }, i) => (
            <Part key={i} id={c.fate === 'A' ? 'endodermoa' : 'mesodermo-intraenbrionarioa'}>
              <circle cx={f1(s.pos[0])} cy={f1(s.pos[1])} r={s.r} fill={s.color} stroke="rgba(10,14,28,0.7)" strokeWidth={0.9} />
              <circle cx={f1(s.pos[0] - s.r * 0.3)} cy={f1(s.pos[1] - s.r * 0.3)} r={s.r * 0.42} fill="rgba(255,255,255,0.3)" />
              <circle cx={f1(s.pos[0] + 0.8)} cy={f1(s.pos[1] + 0.8)} r={2} fill="rgba(20,20,50,0.55)" />
            </Part>
          ))}
          {under.map(({ c, s }, i) => (
            <g key={`j${i}`} opacity={showCells}>
              <Journey pts={trail(c)} color={FATE_COLOR[c.fate]} head={14} width={2.6} u={u} route={Math.max(told(c.fate), tri) * 0.6} origin={false} r={7.5} />
              <LitCell d={ellipsePath(s.pos[0], s.pos[1], s.r, s.r)} color={s.color} fate={FATE_COLOR[c.fate]} w={u} show={Math.max(told(c.fate), tri)}>
                <circle cx={f1(s.pos[0] + 0.8)} cy={f1(s.pos[1] + 0.8)} r={2} fill="rgba(20,20,50,0.6)" />
              </LitCell>
            </g>
          ))}
        </g>

        {/* Epiblast surface (apical mosaic, lit from the top left); the cut-away is a hole through it. */}
        <Part id={surfaceId}>
          <path d={OUT_D + (peel > 0.001 ? win : '')} fill="url(#w3g-mosaic)" fillRule="evenodd" clipPath="url(#w3g-disc)" />
          <path d={OUT_D + (peel > 0.001 ? win : '')} fill="url(#w3g-light)" fillRule="evenodd" clipPath="url(#w3g-disc)" pointerEvents="none" />
          {/* The cut edge of the lifted epiblast shows its thickness. */}
          {peel > 0.001 && <rect x={f1(wx - 5)} y={D.cy - D.ryT - 10} width={5} height={D.ryT + D.ryB + 20} fill="url(#w3g-cut)" clipPath="url(#w3g-disc)" />}
        </Part>

        {/* Streak: a raised ridge; groove: a furrow along its middle; node: a mound with the pit at its centre. */}
        <Part id="lerro-primitiboa" show={lerroOn}>
          <path d={streakPath} fill="rgba(6,10,30,0.45)" transform="translate(2.5 2)" />
          <path d={streakPath} fill="url(#w3g-ridge)" />
        </Part>
        {grooveOn > 0.01 && (
          <Part id="ildo-primitiboa" show={grooveOn}>
            <path d={groovePath} fill="#132453" />
            <path d={groovePath} fill="none" stroke="#dbe6ff" strokeWidth={0.9} opacity={0.55} transform="translate(0.8 0.6)" />
          </Part>
        )}
        {node > 0.01 && (
          <Part id="nodo-primitiboa" show={node}>
            <ellipse cx={D.cx + 2.5} cy={nodeY + 3} rx={lerp(5, 17, node)} ry={lerp(5, 14, node)} fill="rgba(6,10,30,0.5)" />
            <ellipse cx={D.cx} cy={nodeY} rx={lerp(5, 17, node)} ry={lerp(5, 14, node)} fill="url(#w3g-node)" />
          </Part>
        )}
        {pit > 0.01 && (
          <Part id="hobitxo-primitiboa" show={pit}>
            <ellipse cx={D.cx} cy={nodeY + 0.5} rx={lerp(1, 6.5, pit)} ry={lerp(1, 5.5, pit)} fill="#081230" />
            <path d={`M${f1(D.cx - 5.5 * pit)},${f1(nodeY + 2)} Q${f1(D.cx)},${f1(nodeY + 8 * pit)} ${f1(D.cx + 5.5 * pit)},${f1(nodeY + 2)}`} fill="none" stroke="#e3ecff" strokeWidth={1} opacity={0.7} />
          </Part>
        )}

        {/* Convergence on the surface. */}
        {[-62, 4, 70].flatMap((dy) =>
          [-1, 1].map((sd) => (
            <Arrow key={`c${dy}${sd}`} from={[D.cx + sd * halfW(D.cy + dy) * 0.86, D.cy + dy]} to={[D.cx + sd * (streakW + 22), D.cy + dy * 0.96]} bend={sd * 0.05} color="#a9c3ff" width={2.4} head={8} show={conv} flow={!reduced} />
          )),
        )}

        {/* Followed cells still on the surface. */}
        <g opacity={showCells}>
          {over.map(({ c, s }, i) => (
            <g key={i}>
              <Journey pts={trail(c)} color={FATE_COLOR[c.fate]} head={12} width={2.4} u={u} route={Math.max(told(c.fate), tri) * 0.6} origin={Math.max(told(c.fate), tri) > 0.15} r={7.5} />
              <Part id={surfaceId}>
                <circle cx={f1(s.pos[0])} cy={f1(s.pos[1])} r={s.r} fill={s.color} stroke="rgba(10,14,28,0.75)" strokeWidth={0.9} />
                <circle cx={f1(s.pos[0] - s.r * 0.3)} cy={f1(s.pos[1] - s.r * 0.3)} r={s.r * 0.42} fill="rgba(255,255,255,0.32)" />
                <circle cx={f1(s.pos[0] + 0.8)} cy={f1(s.pos[1] + 0.8)} r={2.1} fill="rgba(20,20,50,0.6)" />
              </Part>
              <LitCell d={ellipsePath(s.pos[0], s.pos[1], s.r, s.r)} color={s.color} fate={FATE_COLOR[c.fate]} w={u}>
                <circle cx={f1(s.pos[0] + 0.8)} cy={f1(s.pos[1] + 0.8)} r={2.1} fill="rgba(20,20,50,0.6)" />
              </LitCell>
            </g>
          ))}
        </g>

        <Mark id="gastrulazioa" x={D.cx} y={(NODE_END + CAUDAL) / 2 + 6} rx={34} ry={(CAUDAL - NODE_END) / 2 + 22} show={gast * (1 - 0.6 * peel)} />
        {/* The three-layered disc as a whole: its own edge drawn in light (no pointer over the anatomy). */}
        <Part id="hiru-orriko-diskoa" show={tri}>
          <path d={OUT_D} fill="none" stroke="rgba(6,8,14,0.6)" strokeWidth={5 * u} />
          <path d={OUT_D} fill="none" stroke="#f3f6ff" strokeWidth={2.2 * u} />
        </Part>
      </g>

      <Chips t={t} />
      <Note x={500} y={588} tone="dim" size={11}>
        {peel < 0.5 ? 'Goitik ikusita · amniosa ertzean moztuta' : 'Eskuinean epiblastoa kenduta: azpian sortzen diren geruzak'}
      </Note>

      <Label id="amnioblastoak" x={190} y={leftY[0]} ax={at.rim[0]} ay={at.rim[1]} show={rimLab * inFrame(at.rim)} small />
      <Label id="epiblastoa" x={190} y={leftY[1]} ax={at.epi[0]} ay={at.epi[1]} show={(1 - ecto) * inFrame(at.epi)} />
      <Label id="ektodermoa" x={190} y={leftY[1]} ax={at.epi[0]} ay={at.epi[1]} show={ecto * inFrame(at.epi)} />
      <Label id="nodo-primitiboa" x={190} y={leftY[2]} ax={at.nodo[0]} ay={at.nodo[1]} show={node * inFrame(at.nodo)} />
      <Label id="ildo-primitiboa" x={190} y={leftY[3]} ax={at.ildo[0]} ay={at.ildo[1]} show={grooveOn * inFrame(at.ildo)} />
      <Label id="lerro-primitiboa" x={190} y={leftY[4]} ax={at.lerro[0]} ay={at.lerro[1]} show={lerroOn * inFrame(at.lerro)} />
      <Label id="hiru-orriko-diskoa" x={810} y={rightY[0]} ax={at.tri[0]} ay={at.tri[1]} show={tri * inFrame(at.tri)} small />
      <Label id="hobitxo-primitiboa" x={810} y={rightY[1]} ax={at.pit[0]} ay={at.pit[1]} show={pit * inFrame(at.pit)} />
      <Label id="mesodermo-intraenbrionarioa" x={810} y={rightY[2]} ax={at.meso[0]} ay={at.meso[1]} show={mesoLab * inFrame(at.meso)} small />
      <Label id="gastrulazioa" x={810} y={rightY[3]} ax={at.gast[0]} ay={at.gast[1]} show={gast * inFrame(at.gast)} />
      <Label id="endodermoa" x={810} y={rightY[4]} ax={at.endo[0]} ay={at.endo[1]} show={endoLab * inFrame(at.endo)} />
      <Label id="hipoblastoa" x={810} y={rightY[5]} ax={at.hypo[0]} ay={at.hypo[1]} show={hypoLab * inFrame(at.hypo)} />
    </g>
  );
}

export function GastrulationDorsal(props: SceneProps) {
  return Dorsal(props);
}

/** The dorsal view as the left pane of the dual view (all its names kept; Dual lifts them to the side column). */
export function GastrulationDorsalPane(props: SceneProps) {
  return Dorsal({ ...props, pane: true });
}
