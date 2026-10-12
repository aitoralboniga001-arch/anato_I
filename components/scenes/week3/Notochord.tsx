'use client';

import { Arrow, C, Label, Note, Part, clamp, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { f1 } from './common';
import { CellCluster, DiscDrawing, MembraneMark, NotochordPlate, NotochordRod, makeDisc } from './DiscSection';
import { NB } from './NotochordCells';

/**
 * Prenotochordal cells invaginate at Hensen's node and stream cranially in the midline to the
 * prechordal plate: first as the notochordal plate (intercalated in the endoderm), then as the
 * definitive (detached, solid) notochord. Only cranial to the node — never caudal to it. The
 * neurenteric canal is a transient connection between the amniotic cavity and the yolk sac
 * through the node while this happens.
 */
/**
 * Realistic midsagittal section (cranial = left). Each change happens inside the step that tells it
 * (windows NB, shared with NotochordCells): cells leave the pit and reach the prechordal plate ·
 * neurenteric canal · notochordal plate intercalated in the endoderm · solid notochord detaches ·
 * endoderm continuous again underneath (canal closes once the notochord is complete).
 */
const X_NODE = 62;
const X_BUCCO = -238;
const X_PRE = -196;
const X_CLOACA = 246;
const X_HEAD = X_PRE + 20; // cranial end of the notochord (caudal edge of the prechordal plate)

function sagGeometry(t: number) {
  return {
    // The cord reaches the prechordal plate by the 'reach' step's complete frame (canal − 0.035).
    migrate: seg(t, NB.migrate, NB.canal - 0.04),
    canal: seg(t, NB.canal, NB.canal + 0.05) * (1 - seg(t, NB.close, NB.close + 0.06)),
    plate: seg(t, NB.plate, NB.plate + 0.08),
    rod: seg(t, NB.rod, NB.rod + 0.08),
    close: seg(t, NB.close, NB.close + 0.07),
  };
}

function sagDisc(t: number) {
  const g = sagGeometry(t);
  // Endoderm gap left where the plate lifts off: shrinks to nothing as the endoderm closes.
  const midX = (X_HEAD + X_NODE) / 2;
  const endoGaps: [number, number][] = g.plate > 0.5 && g.close < 0.98 ? [[lerp(X_HEAD, midX, g.close), lerp(X_NODE - 4, midX, g.close)]] : [];
  const s = makeDisc({
    endo: 1,
    meso: 1,
    ecto: 1,
    streak: 0.5,
    groove: 1,
    invag: 1,
    phase: t * 14,
    streakAt: [X_NODE + 14, 214],
    membranes: [X_BUCCO, X_CLOACA],
    mesoRange: [X_NODE - 6, 270],
    endoGaps,
    gapFn: (x) => lerp(26, 40, clamp((x - X_NODE) / 30)) * clamp((262 - Math.abs(x)) / 40),
  });
  return { s, g };
}

export function NotochordSagittal({ t }: SceneProps) {
  const { s, g } = sagDisc(t);
  const front = lerp(X_NODE - 8, X_HEAD, g.migrate);
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const nodeTop = s.map(X_NODE, s.top(X_NODE));
  const canal = `M${[s.map(X_NODE - 4, s.top(X_NODE) - 3), s.map(X_NODE + 4, s.top(X_NODE) - 3), s.map(X_NODE + 4, s.dEnd(X_NODE) + 13), s.map(X_NODE - 4, s.dEnd(X_NODE) + 13)].map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
  const pit = `M${[s.map(X_NODE - 9, s.top(X_NODE - 9) - 1), s.map(X_NODE, s.top(X_NODE) + 10), s.map(X_NODE + 9, s.top(X_NODE + 9) - 1)].map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
  // A prenotochordal cell's centre nearest x (the cells are spaced along the cord).
  const preCell = (x: number): Pt => {
    const n = Math.max(1, Math.round((X_NODE - front) / 10));
    const i = clamp(Math.round((X_NODE - 8 - x) / 10), 0, n - 1);
    const cx = X_NODE - 8 - i * 10;
    return s.map(cx, (s.base(cx) + s.dEnd(cx)) / 2 + (i % 2 ? 3 : -3));
  };
  const notoSlot = g.plate >= 0.5 ? 'notokorda-plaka' : 'zelula-prenotokordalak';
  const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} />;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={s} ids={{ epiblast: 'ektodermoa' }} />

      <Part id="plaka-prekordala">
        <CellCluster s={s} x={X_PRE} color={C.prechordal} />
      </Part>
      <Part id="mintz-bukofaringeoa">
        <MembraneMark s={s} x={X_BUCCO} />
      </Part>
      <Part id="kloaka-mintza">
        <MembraneMark s={s} x={X_CLOACA} />
      </Part>

      {g.migrate > 0.01 && g.plate < 0.99 && (
        <Part id="zelula-prenotokordalak" show={1 - g.plate}>
          {Array.from({ length: Math.max(1, Math.round((X_NODE - front) / 10)) }, (_, i) => {
            const x = X_NODE - 8 - i * 10;
            const [X, Y] = s.map(x, (s.base(x) + s.dEnd(x)) / 2 + (i % 2 ? 3 : -3));
            return <ellipse key={i} cx={X} cy={Y} rx={5.2 * s.k} ry={4.6 * s.k} fill={C.notochord} stroke="rgba(40,10,70,0.7)" strokeWidth={0.8} />;
          })}
        </Part>
      )}
      <Arrow from={mid(X_NODE - 14)} to={mid(lerp(X_NODE - 30, X_HEAD + 10, g.migrate))} bend={0} color="#fde68a" width={1.6} head={7} show={g.migrate * (1 - g.plate)} />
      {g.plate > 0.01 && g.rod < 0.99 && (
        <Part id="notokorda-plaka" show={g.plate * (1 - g.rod)}>
          <NotochordPlate s={s} x0={X_HEAD} x1={X_NODE - 4} />
        </Part>
      )}
      {g.rod > 0.01 && (
        <Part id="notokorda" show={g.rod}>
          <NotochordRod s={s} x0={X_HEAD} x1={X_NODE - 6} />
        </Part>
      )}

      <Part id="nodo-primitiboa">
        {/* The node: thickened, raised ectoderm round the pit, lit from above (no ring drawn round it). */}
        <defs>
          <radialGradient id="w3n-node" cx="50%" cy="28%" r="68%">
            <stop offset="0" stopColor="#dbe6ff" stopOpacity={0.62} />
            <stop offset="0.7" stopColor="#8fb0f5" stopOpacity={0.2} />
            <stop offset="1" stopColor="#8fb0f5" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={nodeTop[0]} cy={nodeTop[1] + 8 * s.k} rx={20 * s.k} ry={15 * s.k} fill="url(#w3n-node)" />
        <path d={`M${f1(nodeTop[0] - 18 * s.k)},${f1(nodeTop[1] - 1)} Q${f1(nodeTop[0])},${f1(nodeTop[1] - 13 * s.k)} ${f1(nodeTop[0] + 18 * s.k)},${f1(nodeTop[1] - 1)}`} fill="none" stroke="#d6e2ff" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} />
      </Part>
      {/* The canal runs down from the pit, drawn under it so the pit stays its own opening. */}
      {g.canal > 0.01 && (
        <Part id="hodi-neuroenterikoa" show={g.canal}>
          <path d={canal} fill="#2a3a5c" stroke="#9fb6e8" strokeWidth={1.2} />
        </Part>
      )}
      <Part id="hobitxo-primitiboa">
        <path d={pit} fill="#15294a" stroke="#0b1530" strokeWidth={1.2} />
      </Part>
      <Note x={500} y={606} show={seg(t, NB.extent, NB.extent + 0.04)} tone="accent" size={11}>
        Notokorda: hobitxo primitibotik alde zefalikora, plaka prekordaleraino; hobitxotik behera ez dago notokordarik
      </Note>

      {L('ektodermoa', 190, 110, s.map(-120, 8))}
      {L('mintz-bukofaringeoa', 190, 160, s.map(X_BUCCO, s.top(X_BUCCO) + 6))}
      {L('plaka-prekordala', 190, 205, mid(X_PRE))}
      {L(notoSlot, 190, 250, g.plate >= 0.5 ? s.map(-80, s.dEnd(-80) + 3) : preCell((front + X_NODE) / 2), notoSlot === 'notokorda-plaka' ? 1 - g.rod : seg(t, NB.migrate, NB.migrate + 0.05))}
      {L('notokorda', 190, 430, mid(-80), g.rod)}
      {L('endodermoa', 190, 470, s.map(-150, s.dEnd(-150) + 6.5))}
      {L('nodo-primitiboa', 810, 150, [nodeTop[0] + 14 * s.k, nodeTop[1] + 6 * s.k])}
      {L('hobitxo-primitiboa', 810, 235, [nodeTop[0], nodeTop[1] + 6])}
      {L('hodi-neuroenterikoa', 810, 415, mid(X_NODE), g.canal)}
      {L('ildo-primitiboa', 810, 455, s.at.groove)}
      {L('kloaka-mintza', 810, 495, s.map(X_CLOACA, s.dEnd(X_CLOACA) + 8))}
    </g>
  );
}

/**
 * Two realistic transverse sections (w3 fig. 2, lower row): cranial to the node (top — prenotochordal
 * cells → notochordal plate intercalated in the endoderm → solid notochord, endoderm closing under it)
 * vs caudal to the node (bottom — primitive groove still invaginating, no notochord ever).
 * Windows NB, as in the other views: cells arrive, plate, notochord, endoderm closed.
 */
function notoGeometry(t: number) {
  return {
    pre: seg(t, NB.migrate + 0.08, NB.reach),
    plate: seg(t, NB.plate, NB.plate + 0.08),
    rod: seg(t, NB.rod, NB.rod + 0.08),
    close: seg(t, NB.close, NB.close + 0.07),
  };
}

const PANEL = { k: 0.95, w: 300, amnionH: 70, yolkH: 70 };

/** Section heading as a chip numbered like its cut on the locator. */
function Heading({ y, color, n, text }: { y: number; color: string; n: number; text: string }) {
  const w = text.length * 7.6 + 46;
  return (
    <g pointerEvents="none">
      <rect x={f1(500 - w / 2)} y={y - 14} width={f1(w)} height={28} rx={14} fill="rgba(12,12,16,0.86)" stroke={color} strokeOpacity={0.45} />
      <circle cx={f1(500 - w / 2 + 16)} cy={y} r={9} fill={color} />
      <text x={f1(500 - w / 2 + 16)} y={y} dy="0.35em" textAnchor="middle" fontSize={11} fontWeight={800} fill="#0f0f11">
        {n}
      </text>
      <text x={f1(500 + 12)} y={y} dy="0.35em" textAnchor="middle" fontSize={14} fontWeight={700} fill={color}>
        {text}
      </text>
    </g>
  );
}

/**
 * Where the two sections are cut: the disc seen from above (cranial up) with the streak and node, the
 * notochord growing cranially from the node, and the two planes — 1 above the node, 2 below it.
 */
function Locator({ t }: { t: number }) {
  const cx = 905;
  const cy = 330;
  const rx = 30;
  const ryT = 46;
  const ryB = 42;
  const nodeY = cy + 8;
  const g = notoGeometry(t);
  const grow = seg(t, NB.migrate, NB.canal - 0.04);
  const notoTop = lerp(nodeY - 4, cy - ryT + 14, grow);
  const disc = `M${cx},${cy - ryT} C${cx + rx * 1.1},${cy - ryT} ${cx + rx},${cy + ryB * 0.7} ${cx},${cy + ryB} C${cx - rx},${cy + ryB * 0.7} ${cx - rx * 1.1},${cy - ryT} ${cx},${cy - ryT}Z`;
  const cut1 = cy - 20;
  const cut2 = cy + 24;
  return (
    <g pointerEvents="none">
      <rect x={cx - 56} y={cy - ryT - 28} width={112} height={ryT + ryB + 40} rx={12} fill="rgba(12,12,16,0.7)" stroke="rgba(232,238,252,0.12)" />
      <text x={cx} y={cy - ryT - 13} textAnchor="middle" fontSize={9.5} fill="#c9d3ea" fontStyle="italic">
        Goitik · goian kraneala
      </text>
      <path d={disc} fill={C.ectoderm} stroke="#24407e" strokeWidth={1.2} />
      <path d={disc} fill="url(#w3n-loc)" />
      <defs>
        <radialGradient id="w3n-loc" cx="35%" cy="25%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      {/* streak and node */}
      <path d={`M${cx - 3},${nodeY + 4} L${cx},${cy + ryB - 8} L${cx + 3},${nodeY + 4}Z`} fill="#2a4a96" />
      <circle cx={cx} cy={nodeY} r={4.2} fill="#a9c3ff" stroke="#2a4a96" strokeWidth={1} />
      {/* notochord, growing cranially from the node */}
      {grow > 0.02 && <path d={`M${cx},${nodeY - 4} L${cx},${f1(notoTop)}`} stroke={C.notochord} strokeWidth={g.rod > 0.5 ? 4 : 3} strokeLinecap="round" />}
      <circle cx={cx} cy={cy - ryT + 9} r={3.6} fill={C.prechordal} />
      {/* the two cutting planes */}
      {[
        [cut1, '#93c5fd', 1],
        [cut2, '#fcd34d', 2],
      ].map(([y, c, n]) => (
        <g key={n as number}>
          <line x1={cx - rx - 6} y1={y as number} x2={cx + rx + 6} y2={y as number} stroke={c as string} strokeWidth={1.8} />
          <circle cx={cx + rx + 12} cy={y as number} r={7} fill={c as string} />
          <text x={cx + rx + 12} y={y as number} dy="0.35em" textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#0f0f11">
            {n}
          </text>
        </g>
      ))}
    </g>
  );
}

export function NotochordTransverse({ t }: SceneProps) {
  const g = notoGeometry(t);
  const cranial = makeDisc({ ...PANEL, y: 172, endo: 1, meso: 1, ecto: 1, pre: g.pre, plate: g.plate, rod: g.rod, close: g.close });
  const caudal = makeDisc({ ...PANEL, y: 446, endo: 1, meso: 1, ecto: 1, streak: 1, groove: 1, invag: 1, phase: t * 14 });
  const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} />;
  const notoSlot = g.rod >= 0.5 ? 'notokorda' : g.plate >= 0.5 ? 'notokorda-plaka' : 'zelula-prenotokordalak';
  const notoAt = g.rod >= 0.5 ? cranial.at.noto : g.plate >= 0.5 ? cranial.at.plate : cranial.at.pre;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={cranial} ids={{ epiblast: 'ektodermoa' }} />
      <DiscDrawing s={caudal} ids={{ epiblast: 'ektodermoa' }} />
      <Heading y={86} color="#93c5fd" n={1} text="Nodotik gora (kraneala): notokorda eratzen" />
      <Heading y={360} color="#fcd34d" n={2} text="Nodotik behera (kaudala): ildo primitiboa, notokordarik EZ" />
      <Locator t={t} />

      <Note x={500} y={606} show={seg(t, NB.extent, NB.extent + 0.04)} tone="accent" size={11}>
        Notokorda: hobitxo primitibotik alde zefalikora, plaka prekordaleraino; hobitxotik behera ez dago notokordarik
      </Note>

      {L('ektodermoa', 190, 130, cranial.at.epiblast)}
      {L('mesodermo-intraenbrionarioa', 190, 205, cranial.at.meso)}
      {L('endodermoa', 190, 255, cranial.at.endo)}
      {L(notoSlot, 810, 240, notoAt, notoSlot === 'zelula-prenotokordalak' ? g.pre : 1)}
      {L('ildo-primitiboa', 810, 410, caudal.at.groove)}
    </g>
  );
}
