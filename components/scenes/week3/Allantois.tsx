'use client';

import { Arrow, C, CellBand, Label, Note, Part, bezier, lerp, line, rand, seg, tube, type Pt, type SceneProps } from '@/components/kit';
import { W3C, amnionArc, discOutlinePath, f1, SAG, yolkArc } from './common';
import { DiscDrawing, MembraneMark, makeDisc } from './DiscSection';
import { Cells } from '@/components/scenes/section/Section';

/**
 * The disc's cranio-caudal, dorso-ventral and left-right polarity is already fixed; the disc grows
 * faster cranially (pear/slipper shape) while the streak regresses caudally — gastrulation
 * continues caudally until the end of week 4. Around day 16 the allantois buds from the posterior
 * yolk-sac wall into the connecting stalk, which itself thins by days 19–20.
 * Dorsal t (each change right after its beat): .36–.68 disc grows cranially (pear shape) ·
 *    .50–.58 streak shortens caudally · .72–.80 cloacal membrane appears at the caudal tip ·
 *    polarity already fixed (shown throughout).
 * Sagittal: see AllantoisSagittal.
 */
const D = { cx: 500, cy: 330 };
/** Streak half-width at its caudal end; dorso-ventral legend corner. */
const SW = 6;
const LEG: Pt = [790, 120];

function discShape(t: number) {
  const g = seg(t, 0.36, 0.68);
  return {
    rxTop: lerp(150, 215, g),
    rxBot: lerp(150, 158, g),
    ryTop: lerp(120, 148, g),
    ryBot: lerp(120, 112, g),
  };
}

function DorsalDrawing({ t }: SceneProps) {
  const { rxTop, rxBot, ryTop, ryBot } = discShape(t);
  const outline = discOutlinePath(D.cx, D.cy, rxTop, rxBot, ryTop, ryBot);
  const regress = seg(t, 0.5, 0.58);
  const streakLen = lerp(120, 34, regress);
  const streakY0 = D.cy + ryBot - 16;
  const streakY1 = streakY0 - streakLen;
  const cloaca = seg(t, 0.72, 0.8);
  const rxW = Math.max(rxTop, rxBot);

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="hiru-orriko-diskoa" show={1}>
        <path d={outline} fill="#1a2540" stroke="rgba(232,238,252,0.3)" strokeWidth={1.4} />
      </Part>
      <Part id="ektodermoa" quiet>
        <path d={outline} fill={C.ectoderm} opacity={0.15} />
      </Part>

      <Part id="ildo-primitiboa" show={1}>
        {/* A groove widening caudally, as in the gastrulation view (it shortens as it regresses). */}
        <path
          d={`M${f1(D.cx - SW)},${f1(streakY0)} Q${f1(D.cx - SW * 1.3)},${f1((streakY0 + streakY1) / 2)} ${f1(D.cx - SW * 0.4)},${f1(streakY1 + 3)} L${f1(D.cx + SW * 0.4)},${f1(streakY1 + 3)} Q${f1(D.cx + SW * 1.3)},${f1((streakY0 + streakY1) / 2)} ${f1(D.cx + SW)},${f1(streakY0)} Q${f1(D.cx)},${f1(streakY0 + 6)} ${f1(D.cx - SW)},${f1(streakY0)}Z`}
          fill="#0c1730"
          stroke="#93a7d9"
          strokeWidth={1.2}
        />
      </Part>
      <Part id="nodo-primitiboa" show={1}>
        <ellipse cx={D.cx} cy={streakY1} rx={11} ry={9} fill="#0c1730" stroke="#dbe4ff" strokeWidth={1.4} />
        <ellipse cx={D.cx} cy={streakY1} rx={4} ry={3.4} fill="#02040a" />
      </Part>
      <Part id="kloaka-mintza" show={cloaca}>
        <ellipse cx={D.cx} cy={streakY0 + 8} rx={14} ry={7} fill="rgba(223,230,247,0.5)" stroke="#dfe6f7" strokeWidth={1.4} />
      </Part>

      {/* Polarity is already fixed on this disc (kept visible throughout, not a new event at .65). */}
      <g opacity={1}>
        <text x={D.cx} y={D.cy - ryTop - 44} textAnchor="middle" fontSize={12} fill="#93c5fd">
          ▲ Kraneala
        </text>
        <text x={D.cx} y={D.cy + ryBot + 46} textAnchor="middle" fontSize={12} fill="#93c5fd">
          ▼ Kaudala
        </text>
        {/* Dorso-ventral is out-of-plane for a top-down view: shown as a symbol + caption, not an in-plane arrow. */}
        <text x={LEG[0]} y={LEG[1]} textAnchor="middle" fontSize={13} fill="#fcd34d">
          ⊙
        </text>
        <Note x={LEG[0] + 16} y={LEG[1]} tone="accent" align="start" size={11}>
          Dortsala (irten)
        </Note>
        <text x={LEG[0]} y={LEG[1] + 20} textAnchor="middle" fontSize={13} fill="#fcd34d">
          ⊗
        </text>
        <Note x={LEG[0] + 16} y={LEG[1] + 20} tone="accent" align="start" size={11}>
          Bentrala (sartu)
        </Note>
        <Note x={D.cx - rxW - 16} y={D.cy - 4} tone="accent" align="end" size={12}>
          Ezkerra
        </Note>
        <Note x={D.cx + rxW + 16} y={D.cy - 4} tone="accent" align="start" size={12}>
          Eskuina
        </Note>
      </g>
    </g>
  );
}

function dorsalLabels(t: number) {
  const { ryBot } = discShape(t);
  const regress = seg(t, 0.5, 0.58);
  const streakY0 = D.cy + ryBot - 16;
  const streakLen = lerp(120, 34, regress);
  const cloaca = seg(t, 0.72, 0.8);
  const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} />;
  return (
    <>
      {L('ildo-primitiboa', 190, 460, [D.cx, streakY0 - streakLen / 2])}
      {L('nodo-primitiboa', 810, 460, [D.cx, streakY0 - streakLen])}
      {L('kloaka-mintza', 810, 500, [D.cx, streakY0 + 8], cloaca)}
    </>
  );
}

export function AllantoisDorsal(props: SceneProps) {
  return (
    <g>
      <DorsalDrawing {...props} />
      {dorsalLabels(props.t)}
    </g>
  );
}

/**
 * Realistic sagittal section (cranial = left) inside the chorionic cavity. Each change plays right
 * after its beat: .5 streak regresses caudally · .62 disc grows cranially · .72 cloacal membrane +
 * allantois budding from the caudal yolk-sac wall into the connecting stalk · .86 stalk thinner,
 * chorionic cavity larger.
 */
const CAUDAL_X = 760; // screen x of the disc's caudal edge (growth is cranial)
const K = 0.92;

function sagGeometry(t: number) {
  return {
    polarity: seg(t, 0.18, 0.24) * (1 - seg(t, 0.34, 0.37)),
    regress: seg(t, 0.5, 0.58),
    grow: seg(t, 0.62, 0.68),
    bud: seg(t, 0.72, 0.8),
    cloaca: seg(t, 0.72, 0.8),
    thin: seg(t, 0.86, 0.94),
  };
}

type P2 = [number, number];
/** Scattered nuclei of the connecting stalk: position along it (u) and across it (v, −1..1 of the half-width). */
const STALK_NUCLEI = Array.from({ length: 34 }, (_, i) => ({ u: 0.12 + 0.8 * ((i + 0.2 + rand(i * 5.1) * 0.6) / 34), v: (rand(i * 2.9 + 3) - 0.5) * 1.4 }));
const pathD = (pts: P2[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${f1(q[0])},${f1(q[1])}`).join('');
const quad = (a: P2, c: P2, b: P2, n: number): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  });
function offset(pts: P2[], d: number): P2[] {
  return pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [q[0] - ((b[1] - a[1]) / len) * d, q[1] + ((b[0] - a[0]) / len) * d];
  });
}

export function AllantoisSagittal({ t }: SceneProps) {
  const g = sagGeometry(t);
  const W = lerp(230, 285, g.grow);
  const node = lerp(20, 130, g.regress);
  const s = makeDisc({
    cx: CAUDAL_X - W * K,
    y: 300,
    k: K,
    w: W,
    amnionH: 118,
    yolkH: 132,
    endo: 1,
    meso: 1,
    ecto: 1,
    streak: 0.5,
    groove: 1,
    invag: 1,
    phase: t * 14,
    streakAt: [node, W - 44],
    membranes: [-W + 30, W - 22],
  });
  // Chorion (chorionic plate lining the cavity) — larger by days 19–20.
  const cr = { cx: 500, cy: 320, rx: lerp(505, 535, g.thin), ry: lerp(318, 340, g.thin) };
  const ring = (dr: number): P2[] =>
    Array.from({ length: 97 }, (_, i) => [cr.cx + (cr.rx + dr) * Math.cos((i / 96) * 2 * Math.PI), cr.cy + (cr.ry + dr) * Math.sin((i / 96) * 2 * Math.PI)]);
  const onChorion = (deg: number): P2 => [cr.cx + cr.rx * Math.cos((deg * Math.PI) / 180), cr.cy + cr.ry * Math.sin((deg * Math.PI) / 180)];
  // Connecting stalk: an organic tube from the dorso-caudal margin (its root hidden under the embryo's
  // mesoderm coat) up and caudally to the chorion, flaring where it joins each so neither end is a cut.
  const ca = (-58 * Math.PI) / 180;
  const cn = [Math.cos(ca) / cr.rx, Math.sin(ca) / cr.ry];
  const cl = Math.hypot(cn[0], cn[1]);
  const p3: P2 = [cr.cx + (cr.rx + 6) * Math.cos(ca), cr.cy + (cr.ry + 6) * Math.sin(ca)];
  const p0: P2 = [s.p.cx + s.rx - 26, (s.cyA + s.cyY) / 2];
  const stalk = bezier(p0, [p0[0] + 95, p0[1] - 6], [p3[0] - (cn[0] / cl) * 170, p3[1] - (cn[1] / cl) * 170], p3);
  const wMid = lerp(32, 25, g.thin);
  const stalkW = (u: number) => wMid + 30 * Math.max(0, 1 - u / 0.24) ** 2 + 18 * Math.max(0, (u - 0.8) / 0.2) ** 2;
  const ST = tube(stalk, stalkW, 0, 1, 48);
  const stalkLine: P2[] = Array.from({ length: 31 }, (_, i) => {
    const q = stalk(i / 30);
    return [q.x, q.y];
  });
  // Allantois: endodermal diverticulum from the caudal yolk-sac wall, around the caudal margin, into the stalk.
  const yolkPt: P2 = [s.p.cx + s.rx * Math.cos(0.42), s.cyY + s.p.yolkH * K * Math.sin(0.42)];
  const a1 = stalk(0.14);
  const a2 = stalk(0.46);
  const allCurve = bezier(yolkPt, [yolkPt[0] + 34, yolkPt[1] + 6], [a1.x - (a2.x - a1.x) * 0.35, a1.y - (a2.y - a1.y) * 0.35 + 18], [a2.x, a2.y]);
  const allLine: P2[] = Array.from({ length: 27 }, (_, i) => {
    const q = allCurve(i / 26);
    return [q.x, q.y];
  });
  const nAll = Math.max(2, Math.round(allLine.length * g.bud));
  const allPart = allLine.slice(0, nAll);
  const [nx, ny] = s.map(node, s.top(node));
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  const xs = Array.from({ length: 41 }, (_, i) => lerp(-W, W, i / 40));
  const outline = pathD([...xs.map((x) => s.map(x, s.top(x) - 1.5)), ...xs.slice().reverse().map((x) => s.map(x, s.dEnd(x) + 11.5))]) + 'Z';
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="korion-barrunbea" quiet>
        <path d={pathD(ring(0))} fill="#141c30" />
      </Part>
      <Part id="finkapen-pedikulua">
        <path d={ST.d} fill={C.mesoExtra} />
        {STALK_NUCLEI.map((c, i) => {
          const q = stalk(c.u);
          const w = stalkW(c.u);
          return <ellipse key={i} cx={f1(q.x + q.nx * w * c.v)} cy={f1(q.y + q.ny * w * c.v)} rx={2.6} ry={1.9} transform={`rotate(${f1(q.angle)} ${f1(q.x + q.nx * w * c.v)} ${f1(q.y + q.ny * w * c.v)})`} fill="rgba(150,70,50,0.6)" />;
        })}
        <g fill="none" stroke="#c96b45" strokeWidth={1.2}>
          <path d={ST.left} />
          <path d={ST.right} />
        </g>
      </Part>
      <Part id="korion-plaka">
        <Cells outer={ring(0)} inner={ring(9)} n={90} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={71} />
        <Cells outer={ring(9)} inner={ring(19)} n={120} fill="#d7bd86" nucleus="rgba(90,60,20,0.6)" seed={72} />
      </Part>

      <DiscDrawing s={s} ids={{ epiblast: 'ektodermoa' }} />

      {g.bud > 0.01 && (
        <Part id="alantoidea" show={g.bud}>
          {/* Blind, rounded tip (a diverticulum, not a cut tube). */}
          <circle cx={f1(allPart[allPart.length - 1][0])} cy={f1(allPart[allPart.length - 1][1])} r={12} fill={C.endoderm} stroke="rgba(90,60,10,0.45)" strokeWidth={0.8} />
          <path d={pathD([...offset(allPart, 7), ...offset(allPart, -7).reverse()]) + 'Z'} fill="#3a3218" />
          <circle cx={f1(allPart[allPart.length - 1][0])} cy={f1(allPart[allPart.length - 1][1])} r={6.5} fill="#3a3218" />
          <Cells outer={offset(allPart, 12)} inner={offset(allPart, 6)} n={Math.max(2, nAll)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={73} />
          <Cells outer={offset(allPart, -12)} inner={offset(allPart, -6)} n={Math.max(2, nAll)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={74} />
        </Part>
      )}
      <Part id="kloaka-mintza" show={g.cloaca}>
        <MembraneMark s={s} x={W - 22} />
      </Part>
      <Part id="nodo-primitiboa">
        <ellipse cx={nx} cy={ny + 11 * K} rx={16 * K} ry={14 * K} fill="none" stroke="#fcd34d" strokeWidth={1.4} strokeDasharray="3 3" />
      </Part>
      <Part id="hiru-orriko-diskoa" show={0.9}>
        <path d={outline} fill="none" stroke="#e8eefc" strokeWidth={1.1} strokeDasharray="5 4" opacity={0.55} />
      </Part>
      <Arrow from={mid(-W * 0.2)} to={mid(-W * 0.2 - 110)} bend={0} color="#fde68a" width={1.8} head={7} show={g.grow * (1 - seg(t, 0.69, 0.72))} />

      <Note x={500} y={606} show={g.polarity} tone="accent" size={11}>
        Polaritatea finkatuta: kraneo-kaudala, dortso-bentrala eta ezker-eskuina
      </Note>

      {L('korion-plaka', 300, 60, onChorion(-122), 1, true)}
      {L('korion-barrunbea', 300, 100, [190, 190], 1, true)}
      {L('nodo-primitiboa', 470, 140, [nx, ny + 2])}
      {L('amnios-barrunbea', 470, 178, s.at.amnion)}
      {L('finkapen-pedikulua', 760, 110, stalkLine[18])}
      {L('hiru-orriko-diskoa', 190, 270, s.map(-W * 0.6, 4))}
      {L('bitelo-zaku-sekundarioa', 190, 470, s.at.yolk)}
      {L('ildo-primitiboa', 810, 400, s.at.groove)}
      {L('kloaka-mintza', 810, 440, s.map(W - 22, s.dEnd(W - 22) + 8), g.cloaca)}
      {L('alantoidea', 810, 480, allPart[Math.min(allPart.length - 1, 10)], g.bud)}
    </g>
  );
}
