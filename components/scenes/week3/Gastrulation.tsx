'use client';

import { Arrow, C, Label, Mark, Note, Part, clamp, lerp, mix, rand, seg, type Pt, type SceneProps } from '@/components/kit';
import { discOutlinePath, f1 } from './common';
import { DiscDrawing, makeDisc } from './DiscSection';
import { GB } from './GastrulationCells';
import { Callout, columnY, frameAt, inFrame, type Key } from './gastroKit';

/**
 * 15–16. egunak — gastrulation. Both views follow the shared step windows GB (GastrulationCells.tsx),
 * so every view of the stage shows what the current step says, and each step gets its own close-up
 * (auto-zoom): streak → groove → node/pit → converging cells → invagination → endoderm → mesoderm → ectoderm.
 *
 * Dorsal view: the disc from above (amnion removed). Thirty epiblast cells are tracked individuals:
 * they slide toward the streak, the nearest ones dive in (yellow: replace the hypoblast → endoderm),
 * the next ones dive and spread between the layers (red: mesoderm), the rest stay on top (blue: ectoderm).
 * Six of them carry a ring and a trail. Once the first cells are in, the surface turns translucent so the
 * layers underneath (hypoblast rim, endoderm, mesoderm) can be seen growing outward from the midline.
 * Transverse view: realistic cell section (DiscSection), zoomed on the streak and then on the layers.
 */
const D = { cx: 500, cy: 320, rx: 140, ry: 202 };
const NODE_END = D.cy - 55;
const CAUDAL = D.cy + D.ry - 20;
const HYP = '#c4a86e';

const DORSAL_KEYS: Key[] = [
  [0, 500, 320, 1.16],
  [0.08, 500, 320, 1.16],
  [0.125, 500, 396, 1.55],
  [0.16, 500, 396, 1.55],
  [0.19, 500, 385, 1.8],
  [0.23, 500, 385, 1.8],
  [0.27, 500, 286, 2.55],
  [0.31, 500, 286, 2.55],
  [0.36, 500, 320, 1.16],
  [1, 500, 320, 1.16],
];

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

function Chips({ t, y = 78 }: { t: number; y?: number }) {
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

/* ---------------------------------------------------------------- dorsal */

function dorsalGeometry(t: number) {
  const growth = seg(t, GB.streak, GB.streak + 0.04);
  const nodeY = lerp(CAUDAL, NODE_END, growth);
  const streakW = lerp(4, 11, growth);
  return { growth, nodeY, streakW };
}

type Fate = 'A' | 'B' | 'C';
const FATE_COLOR: Record<Fate, string> = { A: C.endoderm, B: C.mesoIntra, C: C.ectoderm };
const A_T0 = (k: number) => 0.413 + k * 0.016;
const B_T0 = (j: number) => 0.64 + j * 0.005;
const ARRIVE = 0.026;

interface DCell {
  fate: Fate;
  k: number;
  side: number;
  p0: Pt;
  target: Pt;
  end: Pt;
  tracked: boolean;
}

/** Thirty epiblast cells: the nearest to the streak go in first (endoderm), then mesoderm, the rest stay. */
const DCELLS: DCell[] = (() => {
  const raw = Array.from({ length: 30 }, (_, i) => {
    const a = rand(i * 3.7 + 1) * Math.PI * 2;
    const r = Math.sqrt(0.08 + 0.84 * rand(i * 5.3 + 2));
    let dx = Math.cos(a) * r * D.rx * 0.88;
    const dy = Math.sin(a) * r * D.ry * 0.86;
    if (Math.abs(dx) < 40) dx = (dx < 0 ? -1 : 1) * (40 + rand(i + 9) * 16);
    return { dx, dy };
  }).sort((p, q) => Math.abs(p.dx) - Math.abs(q.dx));
  const inside = (x: number, y: number): Pt => {
    const n = Math.hypot((x - D.cx) / (D.rx * 0.9), (y - D.cy) / (D.ry * 0.9));
    return n > 1 ? [D.cx + (x - D.cx) / n, D.cy + (y - D.cy) / n] : [x, y];
  };
  const TRACK = new Set(['A0', 'A3', 'B1', 'B5', 'C0', 'C6']);
  return raw.map((c, i): DCell => {
    const fate: Fate = i < 8 ? 'A' : i < 17 ? 'B' : 'C';
    const k = fate === 'A' ? i : fate === 'B' ? i - 8 : i - 17;
    const side = c.dx < 0 ? -1 : 1;
    const ty = clamp(D.cy + c.dy, NODE_END + 16, CAUDAL - 12);
    const target: Pt = [D.cx, ty];
    const end: Pt =
      fate === 'A'
        ? [D.cx + side * D.rx * (0.62 - 0.06 * k), lerp(ty, D.cy + 10, 0.4)]
        : fate === 'B'
          ? inside(D.cx + side * D.rx * (0.3 + 0.5 * rand(k * 4.1 + 3)), lerp(ty, D.cy - D.ry * 0.62, 0.3 + 0.35 * rand(k * 2.3 + 1)))
          : [0, 0];
    return { fate, k, side, p0: [D.cx + c.dx, D.cy + c.dy], target, end, tracked: TRACK.has(`${fate}${k}`) };
  });
})();

function dcellState(c: DCell, t: number) {
  const drift = seg(t, GB.converge, GB.invag) * 0.4 + (c.fate === 'C' ? seg(t, GB.invag, GB.ecto) * 0.14 : 0);
  const base: Pt = [lerp(c.p0[0], c.target[0], drift), lerp(c.p0[1], c.target[1], drift)];
  if (c.fate === 'C') return { pos: base, under: 0, color: C.epiblast };
  const t0 = c.fate === 'A' ? A_T0(c.k) : B_T0(c.k);
  const arrive = seg(t, t0, t0 + ARRIVE);
  const spreadStart = c.fate === 'A' ? Math.max(t0 + ARRIVE, GB.endo + c.k * 0.007) : t0 + ARRIVE;
  const spread = seg(t, spreadStart, spreadStart + (c.fate === 'A' ? 0.042 : 0.036));
  const at: Pt = [lerp(c.p0[0], c.target[0], 0.4 + 0.6 * arrive), lerp(c.p0[1], c.target[1], 0.4 + 0.6 * arrive)];
  const pos: Pt = t < t0 ? base : [lerp(at[0], c.end[0], spread), lerp(at[1], c.end[1], spread)];
  const under = seg(t, t0 + ARRIVE * 0.6, t0 + ARRIVE);
  return { pos, under, color: mix(C.epiblast, FATE_COLOR[c.fate], under) };
}

export function GastrulationDorsal({ t, reduced }: SceneProps) {
  const z = frameAt(t, DORSAL_KEYS);
  const outline = discOutlinePath(D.cx, D.cy, D.rx, D.rx, D.ry, D.ry);
  const { growth, nodeY, streakW } = dorsalGeometry(t);
  const node = seg(t, GB.node, GB.node + 0.022);
  const pit = seg(t, GB.node + 0.01, GB.node + 0.04);
  const conv = seg(t, GB.converge - 0.015, GB.converge + 0.02) * (1 - seg(t, GB.invag + 0.03, GB.invag + 0.06));
  const peel = seg(t, GB.invag + 0.03, GB.endo) * (1 - seg(t, GB.ecto - 0.02, GB.ecto + 0.03));
  const endoZ = seg(t, GB.endo, 0.595);
  const mesoZ = seg(t, GB.meso, 0.735);
  const zoneDim = 1 - 0.55 * seg(t, GB.ecto, GB.tri);
  const ecto = seg(t, GB.ecto, GB.ecto + 0.03);
  const tri = seg(t, GB.tri, GB.tri + 0.04);
  const endoArrow = seg(t, GB.endo + 0.01, GB.endo + 0.06) * (1 - seg(t, GB.meso - 0.02, GB.meso + 0.01));
  const mesoArrow = seg(t, GB.meso + 0.01, GB.meso + 0.07) * (1 - seg(t, GB.ecto - 0.02, GB.ecto + 0.01));

  const streakPath = `M${f1(D.cx - streakW)},${f1(CAUDAL + 6)} Q${f1(D.cx - streakW * 1.3)},${f1((CAUDAL + nodeY) / 2)} ${f1(D.cx - streakW * 0.4)},${f1(nodeY + 10)} L${f1(D.cx + streakW * 0.4)},${f1(nodeY + 10)} Q${f1(D.cx + streakW * 1.3)},${f1((CAUDAL + nodeY) / 2)} ${f1(D.cx + streakW)},${f1(CAUDAL + 6)} Z`;
  const ellipse = (rx: number, ry: number, cy = D.cy) => `M${f1(D.cx - rx)},${f1(cy)} a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0 a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0Z`;

  const cells = DCELLS.map((c) => ({ c, s: dcellState(c, t) }));
  const showCells = seg(t, GB.converge - 0.02, GB.converge + 0.02);

  // Six followed cells: ring + trail.
  const tracks = cells
    .filter(({ c }) => c.tracked)
    .map(({ c, s }) => {
      const pts: Pt[] = [];
      for (let i = 16; i >= 0; i--) {
        const tt = t - i * 0.011;
        if (tt >= GB.converge) pts.push(dcellState(c, tt).pos);
      }
      return { c, s, pts };
    });

  const midY = (nodeY + CAUDAL) / 2;
  const A = (x: number, y: number) => z.at(x, y);
  const ringTop = A(D.cx - 40, NODE_END - 26);
  const streakMid = A(D.cx, midY);
  const nodeAt = A(D.cx - lerp(4, 15, node) * 0.9, nodeY - 4);
  const pitAt = A(D.cx + 3, nodeY);
  const epiAt = A(D.cx + D.rx * 0.36, D.cy - D.ry * 0.3);
  const mesoAt = A(D.cx - D.rx * 0.34, D.cy - D.ry * 0.1);
  const endoAt = A(D.cx + D.rx * 0.6, D.cy + D.ry * 0.3);
  const hypoAt = A(D.cx + D.rx * 0.9 * Math.cos(0.5), D.cy + D.ry * 0.9 * Math.sin(0.5));
  const triAt = A(D.cx + D.rx * Math.cos((200 * Math.PI) / 180), D.cy + D.ry * Math.sin((200 * Math.PI) / 180));

  const leftY = columnY([ringTop[1], nodeAt[1], streakMid[1], mesoAt[1]], 90, 575);
  const rightY = columnY([epiAt[1], pitAt[1], endoAt[1], hypoAt[1], triAt[1]], 240, 575);
  const lerroOn = t < GB.groove ? seg(t, GB.streak, GB.streak + 0.03) : 0;
  const ildoOn = t >= GB.groove ? seg(t, GB.groove, GB.groove + 0.03) : 0;
  const gast = seg(t, GB.streak, GB.streak + 0.05);

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
        <path d={outline} fill="#1a2540" stroke="rgba(232,238,252,0.25)" strokeWidth={1.2} pointerEvents="none" />

        {/* Under the surface: the hypoblast (grey rim), the endoderm replacing it from the midline and the mesoderm between. */}
        <Part id="hipoblastoa" show={peel}>
          <path d={outline} fill={HYP} opacity={0.42} />
        </Part>
        <Part id="endodermoa" show={endoZ > 0.02 ? Math.max(peel, ecto * 0.6) : 0}>
          <path d={ellipse(lerp(8, D.rx * 0.86, endoZ), lerp(8, D.ry * 0.86, endoZ))} fill={C.endoderm} opacity={0.42 * zoneDim} stroke={C.endoderm} strokeWidth={1.6} strokeDasharray="6 4" />
        </Part>
        <Part id="mesodermo-intraenbrionarioa" show={mesoZ > 0.02 ? Math.max(peel, ecto * 0.6, tri * 0.6) : 0}>
          <path d={ellipse(lerp(14, D.rx * 0.72, mesoZ), lerp(18, D.ry * 0.7, mesoZ), D.cy - lerp(0, 8, mesoZ))} fill={C.mesoIntra} opacity={0.5 * zoneDim} stroke={C.mesoIntra} strokeWidth={1.6} strokeDasharray="6 4" />
        </Part>

        {/* Epiblast surface, seen from above (amnion removed); it turns translucent while the layers below are told. */}
        <Part id="epiblastoa" quiet show={ecto < 0.5 ? 1 : 0}>
          <path d={outline} fill={C.epiblast} opacity={lerp(0.22, 0.1, peel)} pointerEvents={peel > 0.5 ? 'none' : undefined} />
        </Part>
        <Part id="ektodermoa" quiet show={ecto >= 0.5 ? 1 : 0}>
          <path d={outline} fill={C.ectoderm} opacity={0.26} pointerEvents="none" />
        </Part>

        <Part id="hiru-orriko-diskoa" quiet show={tri}>
          <path d={outline} fill="none" stroke="rgba(232,238,252,0.5)" strokeWidth={3} />
        </Part>

        {/* Hard cut between lerro / ildo: same geometry, only one can be the topmost hit-target. */}
        <Part id="lerro-primitiboa" show={t < GB.groove ? seg(t, GB.streak, GB.streak + 0.03) : 0}>
          <path d={streakPath} fill="#2a3a63" stroke="#93a7d9" strokeWidth={1} opacity={0.95} />
        </Part>
        <Part id="ildo-primitiboa" show={t >= GB.groove ? 1 : 0}>
          <path d={streakPath} fill="#0c1730" stroke="#93a7d9" strokeWidth={1.2} opacity={0.96} />
        </Part>
        <Part id="nodo-primitiboa" show={node}>
          <ellipse cx={D.cx} cy={nodeY} rx={lerp(4, 15, node)} ry={lerp(4, 13, node)} fill="#0c1730" stroke="#dbe4ff" strokeWidth={1.4} />
        </Part>
        <Part id="hobitxo-primitiboa" show={pit}>
          <ellipse cx={D.cx} cy={nodeY} rx={lerp(1, 6, pit)} ry={lerp(1, 5, pit)} fill="#02040a" />
        </Part>

        {/* Movement arrows. */}
        {
          <g>
            {[-78, -26, 26, 78].flatMap((dy) =>
              [-1, 1].map((sd) => (
                <Arrow key={`c${dy}${sd}`} from={[D.cx + sd * D.rx * 0.9, D.cy + dy]} to={[D.cx + sd * (streakW + 34), D.cy + dy * 0.9]} bend={sd * 0.06} color={C.epiblast} width={2.2} head={8} show={conv} flow={!reduced} />
              )),
            )}
            {[-1, 1].map((sd) => (
              <g key={`e${sd}`}>
                <Arrow from={[D.cx + sd * 22, D.cy + 46]} to={[D.cx + sd * D.rx * 0.72, D.cy + 46]} bend={0} color={C.endoderm} width={2.4} head={9} show={endoArrow} />
              </g>
            ))}
            {[-1, 1].map((sd) => (
              <g key={`m${sd}`}>
                <Arrow from={[D.cx + sd * 16, D.cy - 4]} to={[D.cx + sd * D.rx * 0.62, D.cy - 6]} bend={sd * -0.05} color={C.mesoIntra} width={2.4} head={9} show={mesoArrow} progress={mesoArrow} />
                <Arrow from={[D.cx + sd * 16, NODE_END + 16]} to={[D.cx + sd * D.rx * 0.36, D.cy - D.ry * 0.72]} bend={sd * -0.15} color={C.mesoIntra} width={2.4} head={9} show={mesoArrow} progress={mesoArrow} />
              </g>
            ))}
          </g>
        }

        {/* The cells: tracked individuals with colour by fate. */}
        <g opacity={showCells}>
          {cells.map(({ c, s }, i) => (
            <Part key={i} id={s.under > 0.5 ? (c.fate === 'A' ? 'endodermoa' : 'mesodermo-intraenbrionarioa') : (t >= GB.ecto ? 'ektodermoa' : 'epiblastoa')} show={lerp(1, 0.9, s.under)}>
              <g>
              <circle cx={f1(s.pos[0])} cy={f1(s.pos[1])} r={7.2} fill={s.color} stroke={s.under > 0.5 ? 'rgba(255,255,255,0.75)' : 'rgba(10,14,28,0.7)'} strokeWidth={s.under > 0.5 ? 1 : 0.8} strokeDasharray={s.under > 0.5 ? '2 2' : undefined} />
              <circle cx={f1(s.pos[0] + 0.6)} cy={f1(s.pos[1] + 0.5)} r={2} fill="rgba(20,20,50,0.55)" />
              {c.fate === 'B' && s.under > 0.5 && <circle cx={f1(s.pos[0])} cy={f1(s.pos[1])} r={8} fill="none" stroke={C.mesoIntra} strokeWidth={0.8} strokeDasharray="1.5 2.5" opacity={0.7} />}
              </g>
            </Part>
          ))}
          {tracks.map(({ c, s, pts }) => {
            const col = FATE_COLOR[c.fate];
            const moving = pts.length > 1 && Math.hypot(pts[0][0] - s.pos[0], pts[0][1] - s.pos[1]) > 3;
            return (
              <g key={`${c.fate}${c.k}`} pointerEvents="none">
                {moving && <path d={`M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}`} fill="none" stroke={col} strokeWidth={2} strokeDasharray="2 4" strokeLinecap="round" />}
                <circle cx={f1(s.pos[0])} cy={f1(s.pos[1])} r={9} fill="none" stroke="#fff" strokeWidth={1.6} />
                <circle cx={f1(s.pos[0])} cy={f1(s.pos[1])} r={12} fill="none" stroke={col} strokeWidth={1.3} opacity={0.85} />
              </g>
            );
          })}
        </g>

        <Mark id="gastrulazioa" x={D.cx} y={(NODE_END + CAUDAL) / 2} rx={54} ry={(CAUDAL - NODE_END) / 2 + 26} show={gast} />
      </g>

      <Chips t={t} />
      <Note x={500} y={586} tone="dim" size={11}>
        {t < GB.endo ? 'Goitik ikusita · amniosa kenduta' : 'Azaleko geruza gardenduta: azpiko eratorriak ikusteko'}
      </Note>

      <Label id="gastrulazioa" x={190} y={leftY[0]} ax={ringTop[0]} ay={ringTop[1]} show={gast * inFrame(ringTop)} />
      <Label id="nodo-primitiboa" x={190} y={leftY[1]} ax={nodeAt[0]} ay={nodeAt[1]} show={node * inFrame(nodeAt)} />
      <Label id="lerro-primitiboa" x={190} y={leftY[2]} ax={streakMid[0]} ay={streakMid[1]} show={lerroOn * inFrame(streakMid)} />
      <Label id="ildo-primitiboa" x={190} y={leftY[2]} ax={streakMid[0]} ay={streakMid[1]} show={ildoOn * inFrame(streakMid)} />
      <Label id="mesodermo-intraenbrionarioa" x={190} y={leftY[3]} ax={mesoAt[0]} ay={mesoAt[1]} show={seg(t, GB.meso + 0.06, GB.meso + 0.1) * inFrame(mesoAt)} />
      <Label id="epiblastoa" x={810} y={rightY[0]} ax={epiAt[0]} ay={epiAt[1]} show={(ecto < 0.5 ? 1 : 0) * inFrame(epiAt)} />
      <Label id="ektodermoa" x={810} y={rightY[0]} ax={epiAt[0]} ay={epiAt[1]} show={(ecto >= 0.5 ? ecto : 0) * inFrame(epiAt)} />
      <Label id="hobitxo-primitiboa" x={810} y={rightY[1]} ax={pitAt[0]} ay={pitAt[1]} show={pit * inFrame(pitAt)} />
      <Label id="endodermoa" x={810} y={rightY[2]} ax={endoAt[0]} ay={endoAt[1]} show={seg(t, GB.endo + 0.06, GB.endo + 0.1) * inFrame(endoAt)} />
      <Label id="hipoblastoa" x={810} y={rightY[3]} ax={hypoAt[0]} ay={hypoAt[1]} show={peel * seg(t, GB.invag + 0.04, GB.endo) * inFrame(hypoAt)} />
      <Label id="hiru-orriko-diskoa" x={810} y={rightY[4]} ax={triAt[0]} ay={triAt[1]} show={tri * inFrame(triAt)} />
    </g>
  );
}

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
              {travel < 1 && <path d={`M${origin.join(',')} Q${s.map(0, destination).join(',')} ${p.join(',')}`} fill="none" stroke={color} strokeWidth={2} strokeDasharray="3 4" opacity={0.7} />}
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

        <Mark id="gastrulazioa" x={s.at.streak[0]} y={s.at.streak[1] + 30} rx={66} ry={60} show={g.streak} />

        <Part id="hiru-orriko-diskoa" show={g.tri}>
          <path d={outline} fill="none" stroke="#e8eefc" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.85} />
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
      <Label id="mesodermo-intraenbrionarioa" x={190} y={leftY[2]} ax={anchors.meso[0]} ay={anchors.meso[1]} show={g.meso * ok(anchors.meso)} />
      <Label id="hipoblastoa" x={190} y={leftY[3]} ax={anchors.hypo[0]} ay={anchors.hypo[1]} show={(1 - clamp((g.endo - 0.8) / 0.17)) * ok(anchors.hypo)} />
      <Label id="endodermoa" x={190} y={leftY[4]} ax={anchors.endo[0]} ay={anchors.endo[1]} show={g.endo * ok(anchors.endo)} />
      <Label id="amnios-barrunbea" x={810} y={rightY[0]} ax={anchors.amnion[0]} ay={anchors.amnion[1]} show={ok(anchors.amnion)} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={810} y={rightY[1]} ax={anchors.extra[0]} ay={anchors.extra[1]} show={ok(anchors.extra)} small />
      <Label id="hiru-orriko-diskoa" x={810} y={rightY[2]} ax={anchors.disc[0]} ay={anchors.disc[1]} show={g.tri * ok(anchors.disc)} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={rightY[3]} ax={anchors.yolk[0]} ay={anchors.yolk[1]} show={ok(anchors.yolk)} />
    </g>
  );
}
