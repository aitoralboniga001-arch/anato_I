'use client';

import { Arrow, C, Label, Note, Part, clamp, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { f1 } from './common';
import { CellCluster, DiscDrawing, MembraneMark, NotochordPlate, NotochordRod, makeDisc } from './DiscSection';

/**
 * Prenotochordal cells invaginate at Hensen's node and stream cranially in the midline to the
 * prechordal plate: first as the notochordal plate (intercalated in the endoderm), then as the
 * definitive (detached, solid) notochord. Only cranial to the node — never caudal to it. The
 * neurenteric canal is a transient connection between the amniotic cavity and the yolk sac
 * through the node while this happens.
 */
/**
 * Realistic midsagittal section (cranial = left). Fade-in windows end at the beats:
 * .16 prenotochordal cells leave the pit cranially · .34 neurenteric canal · .44 they reach the
 * prechordal plate · .5 notochordal plate intercalated in the endoderm · .66 solid notochord detaches ·
 * .78 endoderm continuous again underneath (canal closes once the notochord is complete).
 */
const X_NODE = 62;
const X_BUCCO = -238;
const X_PRE = -196;
const X_CLOACA = 246;
const X_HEAD = X_PRE + 20; // cranial end of the notochord (caudal edge of the prechordal plate)

function sagGeometry(t: number) {
  return {
    migrate: seg(t, 0.1, 0.44),
    canal: seg(t, 0.28, 0.34) * (1 - seg(t, 0.8, 0.9)),
    plate: seg(t, 0.44, 0.5),
    rod: seg(t, 0.6, 0.66),
    close: seg(t, 0.72, 0.78),
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
            return <ellipse key={i} cx={X} cy={Y} rx={4.6 * s.k} ry={3.8 * s.k} fill={C.notochord} stroke="rgba(40,10,70,0.7)" strokeWidth={0.8} />;
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
        <ellipse cx={nodeTop[0]} cy={nodeTop[1] + 12 * s.k} rx={17 * s.k} ry={15 * s.k} fill="none" stroke="#fcd34d" strokeWidth={1.4} strokeDasharray="3 3" />
      </Part>
      <Part id="hobitxo-primitiboa">
        <path d={pit} fill="#15294a" stroke="#0b1530" strokeWidth={1.2} />
      </Part>
      {g.canal > 0.01 && (
        <Part id="hodi-neuroenterikoa" show={g.canal}>
          <path d={canal} fill="#2a3a5c" stroke="#9fb6e8" strokeWidth={1.2} />
        </Part>
      )}
      <Note x={500} y={606} show={seg(t, 0.82, 0.88)} tone="accent" size={11}>
        Notokorda: hobitxo primitibotik alde zefalikora, plaka prekordaleraino; hobitxotik behera ez dago notokordarik
      </Note>

      {L('ektodermoa', 190, 110, s.map(-120, 8))}
      {L('mintz-bukofaringeoa', 190, 160, s.map(X_BUCCO, s.top(X_BUCCO) + 6))}
      {L('plaka-prekordala', 190, 205, mid(X_PRE))}
      {L(notoSlot, 190, 250, g.plate >= 0.5 ? s.map(-80, s.dEnd(-80) + 3) : mid((front + X_NODE) / 2), notoSlot === 'notokorda-plaka' ? 1 - g.rod : g.migrate)}
      {L('notokorda', 190, 430, mid(-80), g.rod)}
      {L('endodermoa', 190, 470, s.map(-150, s.dEnd(-150) + 6))}
      {L('nodo-primitiboa', 810, 150, [nodeTop[0] + 14 * s.k, nodeTop[1] + 6 * s.k])}
      {L('hobitxo-primitiboa', 810, 235, [nodeTop[0], nodeTop[1] + 6])}
      {L('hodi-neuroenterikoa', 810, 415, s.map(X_NODE, s.dEnd(X_NODE) + 12), g.canal)}
      {L('ildo-primitiboa', 810, 455, s.at.groove)}
      {L('kloaka-mintza', 810, 495, s.map(X_CLOACA, s.dEnd(X_CLOACA) + 8))}
    </g>
  );
}

/**
 * Two realistic transverse sections (w3 fig. 2, lower row): cranial to the node (top — prenotochordal
 * cells → notochordal plate intercalated in the endoderm → solid notochord, endoderm closing under it)
 * vs caudal to the node (bottom — primitive groove still invaginating, no notochord ever).
 * Fade-in windows end at the beats (.16 cells, .5 plate, .66 notochord, .78 endoderm closed).
 */
function notoGeometry(t: number) {
  return {
    pre: seg(t, 0.08, 0.16),
    plate: seg(t, 0.44, 0.5),
    rod: seg(t, 0.6, 0.66),
    close: seg(t, 0.72, 0.78),
  };
}

const PANEL = { k: 0.95, w: 300, amnionH: 70, yolkH: 70 };

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
      <text x={500} y={86} textAnchor="middle" fontSize={14} fill="#93c5fd" fontWeight={700}>
        Nodotik gora (kraneala): notokorda eratzen
      </text>
      <text x={500} y={360} textAnchor="middle" fontSize={14} fill="#fcd34d" fontWeight={700}>
        Nodotik behera (kaudala): ildo primitiboa, notokordarik EZ
      </text>

      <Note x={500} y={606} show={seg(t, 0.82, 0.88)} tone="accent" size={11}>
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
