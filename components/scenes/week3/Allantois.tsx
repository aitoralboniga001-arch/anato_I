'use client';

import { Arrow, C, Label, clamp, Note, Part, bezier, lerp, rand, seg, tube, type Pt, type SceneProps } from '@/components/kit';
import { discOutline, discOutlinePath, f1 } from './common';
import { DorsalDefs } from './dorsalKit';
import { useId } from 'react';
import { DiscDrawing, MembraneMark, makeDisc } from './DiscSection';
import { frameAt, inFrame } from './gastroKit';
import { Cells } from '@/components/scenes/section/Section';

/**
 * The disc's cranio-caudal, dorso-ventral and left-right polarity is already fixed; the disc grows
 * faster cranially (pear/slipper shape) while the streak regresses caudally — gastrulation
 * continues caudally until the end of week 4. Around day 16 the allantois buds from the posterior
 * yolk-sac wall into the connecting stalk, which itself thins by days 19–20.
 *
 * Dorsal view, drawn like the other week-3 discs seen from above (dorsalKit): the ectoderm as a lit
 * mosaic of cell apices, the cut amnion as a pale rim, the streak as a ridge with its groove and the
 * node as a mound with the pit. A stepped cut-away on the right shows the three layers under the
 * surface (ectoderm | mesoderm | endoderm), so the disc reads as trilaminar from above.
 * Each change plays right after its beat: .18 polarity axes brighten · .36 cranial layers complete
 * first (captions) · .50–.58 streak shortens caudally (node moves caudally) · .62–.68 disc grows
 * cranially (round → pear) · .72–.80 cloacal membrane at the caudal tip.
 */
const D = { cx: 500, cy: 318 };
/** D-V legend corner (out of plane for a top-down view). */
const LEG: Pt = [790, 120];

function discShape(t: number) {
  const g = seg(t, 0.62, 0.68);
  return {
    rxTop: lerp(128, 178, g),
    rxBot: lerp(128, 124, g),
    ryTop: lerp(160, 200, g),
    ryBot: lerp(160, 156, g),
  };
}

/** Streak geometry: its caudal end stays put while it shortens, so the node moves caudally. */
function streakGeom(t: number) {
  const { ryBot } = discShape(t);
  const regress = seg(t, 0.5, 0.58);
  const caudal = D.cy + ryBot - 26;
  const len = lerp(150, 62, regress);
  return { regress, caudal, nodeY: caudal - len, len };
}

/** Where the stepped cut-away sits: ectoderm lifted right of WX1, mesoderm too right of WX2. */
const WX1 = D.cx + 44;
const WX2 = D.cx + 86;
const WY: [number, number] = [D.cy - 70, D.cy + 96];
const WY2: [number, number] = [D.cy - 46, D.cy + 74];

function DorsalDrawing({ t }: SceneProps) {
  const clipId = useId();
  const { rxTop, rxBot, ryTop, ryBot } = discShape(t);
  const out = discOutline(D.cx, D.cy, rxTop, rxBot, ryTop, ryBot);
  const OUT = discOutlinePath(D.cx, D.cy, rxTop, rxBot, ryTop, ryBot);
  const RIM = discOutlinePath(D.cx, D.cy, rxTop + 9, rxBot + 9, ryTop + 9, ryBot + 9);
  const { regress, caudal, nodeY } = streakGeom(t);
  const cloaca = seg(t, 0.72, 0.8);
  const polarity = seg(t, 0.18, 0.22) * (1 - seg(t, 0.34, 0.37));
  const cranialFirst = seg(t, 0.36, 0.4) * (1 - seg(t, 0.6, 0.63));
  const growArrows = seg(t, 0.62, 0.64) * (1 - seg(t, 0.69, 0.72));
  const regressArrow = seg(t, 0.5, 0.52) * (1 - seg(t, 0.6, 0.62));
  const rxW = Math.max(rxTop, rxBot);
  const sw = 11;
  const streakPath = `M${f1(D.cx - sw)},${f1(caudal + 6)} Q${f1(D.cx - sw * 1.35)},${f1((caudal + nodeY) / 2)} ${f1(D.cx - sw * 0.5)},${f1(nodeY + 8)} L${f1(D.cx + sw * 0.5)},${f1(nodeY + 8)} Q${f1(D.cx + sw * 1.35)},${f1((caudal + nodeY) / 2)} ${f1(D.cx + sw)},${f1(caudal + 6)} Z`;
  const gw = sw * 0.42;
  const groovePath = `M${f1(D.cx - gw)},${f1(caudal - 2)} Q${f1(D.cx - gw * 1.3)},${f1((caudal + nodeY) / 2)} ${f1(D.cx - gw * 0.45)},${f1(nodeY + 13)} L${f1(D.cx + gw * 0.45)},${f1(nodeY + 13)} Q${f1(D.cx + gw * 1.3)},${f1((caudal + nodeY) / 2)} ${f1(D.cx + gw)},${f1(caudal - 2)} Z`;
  const hole1 = `M${WX1},${WY[0]}H${D.cx + 260}V${WY[1]}H${WX1}Z`;
  const hole2 = `M${WX2},${WY2[0]}H${D.cx + 260}V${WY2[1]}H${WX2}Z`;
  // Cranial edge points for the growth arrows (on the current outline).
  const edge = (a: number): Pt => {
    const i = Math.round(((a + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * out.length) % out.length;
    return out[i];
  };
  const axisGlow = 1 + polarity * 0.18;
  const axisFill = mixHex('#93c5fd', '#e3edff', polarity);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <DorsalDefs />
        <clipPath id={clipId}>
          <path d={OUT} />
        </clipPath>
        <pattern id="w3al-hex" width="13" height="11.3" patternUnits="userSpaceOnUse">
          <path d="M0,2.8 L3.2,0 L9.7,0 L13,2.8 L13,8.5 L9.7,11.3 L3.2,11.3 L0,8.5Z" fill="#6a99f2" stroke="rgba(18,36,92,0.45)" strokeWidth={0.8} />
          <circle cx={6.5} cy={5.6} r={1.5} fill="rgba(24,40,98,0.35)" />
        </pattern>
        <pattern id="w3al-meso" width="18" height="16" patternUnits="userSpaceOnUse">
          <rect width="18" height="16" fill="#a92f36" />
          <path d="M2,5 L11,9 M6,1 L7,12" stroke="#ff7676" strokeWidth={1.1} strokeLinecap="round" opacity={0.85} />
          <ellipse cx={6.5} cy={7} rx={2.6} ry={2.1} fill="#ff7676" stroke="rgba(70,8,14,0.6)" strokeWidth={0.5} />
          <path d="M11,13 L17,15 M14,10 L15,16" stroke="#ff7676" strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
          <ellipse cx={14.5} cy={13} rx={2.2} ry={1.8} fill="#ff7676" />
        </pattern>
      </defs>

      {/* The disc as a whole (three layers): rim of the cut amnion, the layers seen through the cut-away, a casing. */}
      <Part id="hiru-orriko-diskoa">
        <path d={RIM} fill="#000" opacity={0.35} transform="translate(3 6)" />
        <path d={RIM + OUT} fill={C.amnioblast} fillRule="evenodd" opacity={0.42} />
        <path d={RIM} fill="none" stroke="#c9dbff" strokeWidth={1} opacity={0.5} />
        <path d={OUT} fill={C.ectoderm} />
        <g clipPath={`url(#${clipId})`}>
          <path d={hole1} fill="url(#w3al-meso)" />
          <path d={hole2} fill="url(#w3g-endo)" />
          {/* Cut edges: each lifted layer shows its thickness. */}
          <rect x={WX2 - 4} y={WY2[0]} width={4} height={WY2[1] - WY2[0]} fill="#6e1c22" />
          <path d={`M${WX2},${WY2[0]}H${D.cx + 260}M${WX2},${WY2[1]}H${D.cx + 260}`} stroke="#6e1c22" strokeWidth={3} />
          <rect x={WX1 - 5} y={WY[0]} width={5} height={WY[1] - WY[0]} fill="url(#w3g-cut)" />
          <path d={`M${WX1},${WY[0]}H${D.cx + 260}M${WX1},${WY[1]}H${D.cx + 260}`} stroke="#2d4c9c" strokeWidth={4} />
        </g>
        <path d={OUT} fill="none" stroke="#0b1020" strokeWidth={3.2} opacity={0.75} />
        <path d={OUT} fill="none" stroke="#f3f6ff" strokeWidth={1.2} opacity={0.7} />
      </Part>

      {/* The surface seen from above is the ectoderm: a mosaic of cell apices, lit from the top left. */}
      <Part id="ektodermoa">
        <path d={OUT + hole1} fill="url(#w3al-hex)" fillRule="evenodd" clipPath={`url(#${clipId})`} />
        <path d={OUT + hole1} fill="url(#w3g-light)" fillRule="evenodd" clipPath={`url(#${clipId})`} pointerEvents="none" />
      </Part>

      {/* Streak (ridge), groove (furrow) and node (mound with the pit) — they shorten caudally. */}
      <Part id="ildo-primitiboa">
        <path d={streakPath} fill="rgba(6,10,30,0.45)" transform="translate(2.5 2)" />
        <path d={streakPath} fill="url(#w3g-ridge)" />
        <path d={groovePath} fill="#132453" />
        <path d={groovePath} fill="none" stroke="#dbe6ff" strokeWidth={0.9} opacity={0.55} transform="translate(0.8 0.6)" />
      </Part>
      <Part id="nodo-primitiboa">
        <ellipse cx={D.cx + 2.5} cy={nodeY + 3} rx={17} ry={14} fill="rgba(6,10,30,0.5)" />
        <ellipse cx={D.cx} cy={nodeY} rx={17} ry={14} fill="url(#w3g-node)" />
        <ellipse cx={D.cx} cy={nodeY + 0.5} rx={6.5} ry={5.5} fill="#081230" />
        <path d={`M${f1(D.cx - 5.5)},${f1(nodeY + 2)} Q${f1(D.cx)},${f1(nodeY + 8)} ${f1(D.cx + 5.5)},${f1(nodeY + 2)}`} fill="none" stroke="#e3ecff" strokeWidth={1} opacity={0.7} />
      </Part>
      <Part id="kloaka-mintza" show={cloaca}>
        <ellipse cx={D.cx} cy={caudal + 22} rx={17} ry={8.5} fill="url(#w3g-memb)" stroke="#eef2ff" strokeWidth={1.2} />
      </Part>

      {/* Regression: the streak shortens towards the caudal end. */}
      <Arrow from={[D.cx - 34, nodeY - 4]} to={[D.cx - 34, nodeY + 52]} bend={0} color="#a9c3ff" width={2.4} head={8} show={regressArrow} progress={Math.max(0.25, regress)} />
      {/* Cranial growth: the cranial half widens and lengthens (round → pear). */}
      {[0.24, 0.5, 0.76].map((k) => {
        const p = edge(Math.PI * (1 + k));
        const dir: Pt = [p[0] - D.cx, p[1] - D.cy];
        const len = Math.hypot(dir[0], dir[1]) || 1;
        return <Arrow key={k} from={[p[0] + (dir[0] / len) * 8, p[1] + (dir[1] / len) * 8]} to={[p[0] + (dir[0] / len) * 46, p[1] + (dir[1] / len) * 46]} bend={0} color="#a9c3ff" width={2.4} head={8} show={growArrows} />;
      })}

      {/* Polarity is already fixed on this disc (kept visible throughout; it brightens on its beat). */}
      <g pointerEvents="none">
        <text x={D.cx} y={D.cy - ryTop - 60} textAnchor="middle" fontSize={12 * axisGlow} fontWeight={600} fill={axisFill}>
          ▲ Kraneala{cranialFirst > 0.5 ? ' · geruzak lehenago osatzen dira' : ''}
        </text>
        <text x={D.cx} y={D.cy + ryBot + 40} textAnchor="middle" fontSize={12 * axisGlow} fontWeight={600} fill={axisFill}>
          ▼ Kaudala{cranialFirst > 0.5 ? ' · gastrulazioak jarraitzen du' : ''}
        </text>
        <text x={D.cx - rxW - 24} y={D.cy - 110} dy="0.35em" textAnchor="end" fontSize={12 * axisGlow} fontWeight={600} fill={axisFill}>
          Ezkerra
        </text>
        <text x={D.cx + rxW + 24} y={D.cy - 110} dy="0.35em" textAnchor="start" fontSize={12 * axisGlow} fontWeight={600} fill={axisFill}>
          Eskuina
        </text>
        {/* Dorso-ventral is out of plane for a top-down view: a symbol + caption, not an in-plane arrow. */}
        <text x={LEG[0]} y={LEG[1]} dy="0.35em" textAnchor="middle" fontSize={13 * axisGlow} fill="#fcd34d">
          ⊙
        </text>
        <Note x={LEG[0] + 16} y={LEG[1]} tone="accent" align="start" size={11}>
          Dortsala (irten)
        </Note>
        <text x={LEG[0]} y={LEG[1] + 20} dy="0.35em" textAnchor="middle" fontSize={13 * axisGlow} fill="#fcd34d">
          ⊗
        </text>
        <Note x={LEG[0] + 16} y={LEG[1] + 20} tone="accent" align="start" size={11}>
          Bentrala (sartu)
        </Note>
      </g>
    </g>
  );
}

/** Linear blend of two #rrggbb colours. */
function mixHex(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
}

function dorsalLabels(t: number) {
  const { rxTop, ryTop } = discShape(t);
  const { caudal, nodeY } = streakGeom(t);
  const cloaca = seg(t, 0.72, 0.8);
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  return (
    <>
      {L('hiru-orriko-diskoa', 190, 170, [D.cx - (rxTop + 1) * Math.cos(0.9), D.cy - (ryTop + 1) * Math.sin(0.9)])}
      {/* Seen from above, the disc's surface is its ectoderm. */}
      {L('ektodermoa', 190, 290, [D.cx - 80, D.cy - 40])}
      {L('ildo-primitiboa', 190, 450, [D.cx - 4, (caudal + nodeY) / 2 + 22])}
      {L('mesodermo-intraenbrionarioa', 804, 280, [(WX1 + WX2) / 2, WY[0] + 30], 1, true)}
      {L('endodermoa', 810, 330, [WX2 + 18, WY2[0] + 56], 1, true)}
      {L('nodo-primitiboa', 810, 420, [D.cx + 14, nodeY + 4])}
      {L('kloaka-mintza', 810, 500, [D.cx + 14, caudal + 22], cloaca)}
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
  // Camera: the allantois and the cloacal membrane are small and sit together at the caudal end, so their
  // step pushes in there (yolk-sac wall, allantois, stalk root, membrane in one close-up); the next step
  // (thinner stalk, larger cavity) pulls back out to the whole conceptus.
  const memb = s.map(W - 22, s.dEnd(W - 22));
  const fa = allLine[15];
  const F: Pt = [(memb[0] + fa[0]) / 2 + 10, (memb[1] + fa[1]) / 2 - 6];
  const z = frameAt(t, [
    [0, 500, 320, 1],
    [0.7, 500, 320, 1],
    [0.755, F[0], F[1], 2],
    [0.845, F[0], F[1], 2],
    [0.885, 500, 320, 1],
    [1, 500, 320, 1],
  ]);
  const close = z.s > 1.25;
  // Names set inside the picture (not in a gutter) step aside while the camera is close, so none lands on the allantois.
  const far = 1 - clamp((z.s - 1) / 0.5);
  // Anchors follow the camera; a name whose structure has left the close-up is not set.
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => {
    const q = z.at(p[0], p[1]);
    return <Label key={id} id={id} x={x} y={y} ax={q[0]} ay={q[1]} show={show * inFrame(q, 36)} small={small} />;
  };
  const yolkNear: P2 = [s.p.cx + s.rx * Math.cos(0.75), s.cyY + s.p.yolkH * K * Math.sin(0.75) - 10];
  const xs = Array.from({ length: 41 }, (_, i) => lerp(-W, W, i / 40));
  const outline = pathD([...xs.map((x) => s.map(x, s.top(x) - 1.5)), ...xs.slice().reverse().map((x) => s.map(x, s.dEnd(x) + 11.5))]) + 'Z';
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
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
          {/* The node: thickened, raised ectoderm round the pit, lit from above (no ring drawn round it). */}
          <defs>
            <radialGradient id="w3al-node" cx="50%" cy="28%" r="68%">
              <stop offset="0" stopColor="#dbe6ff" stopOpacity={0.62} />
              <stop offset="0.7" stopColor="#8fb0f5" stopOpacity={0.2} />
              <stop offset="1" stopColor="#8fb0f5" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={nx} cy={ny + 7 * K} rx={19 * K} ry={14 * K} fill="url(#w3al-node)" />
          <path d={`M${f1(nx - 17 * K)},${f1(ny - 1)} Q${f1(nx)},${f1(ny - 12 * K)} ${f1(nx + 17 * K)},${f1(ny - 1)}`} fill="none" stroke="#d6e2ff" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} />
        </Part>
        <Part id="hiru-orriko-diskoa" show={0.9}>
          {/* The disc's outline as a solid casing (light line on a dark one), not a dashed pointer. */}
          <path d={outline} fill="none" stroke="#0b1020" strokeWidth={3} opacity={0.6} />
          <path d={outline} fill="none" stroke="#f3f6ff" strokeWidth={1.1} opacity={0.6} />
        </Part>
        <Arrow from={mid(-W * 0.2)} to={mid(-W * 0.2 - 110)} bend={0} color="#fde68a" width={1.8} head={7} show={g.grow * (1 - seg(t, 0.69, 0.72))} />
      </g>

      <Note x={500} y={606} show={g.polarity} tone="accent" size={11}>
        Polaritatea finkatuta: kraneo-kaudala, dortso-bentrala eta ezker-eskuina
      </Note>

      {L('korion-plaka', 300, 60, onChorion(-122), 1, true)}
      {L('korion-barrunbea', 300, 100, [190, 190], 1, true)}
      {L('nodo-primitiboa', 470, 140, [nx, ny + 2], far)}
      {L('amnios-barrunbea', 470, 178, s.at.amnion, far)}
      {L('finkapen-pedikulua', 760, 110, stalkLine[close ? 9 : 18])}
      {L('hiru-orriko-diskoa', 190, 270, s.map(-W * 0.6, 4))}
      {L('bitelo-zaku-sekundarioa', 190, 470, close ? yolkNear : s.at.yolk)}
      {L('ildo-primitiboa', 810, 400, s.at.groove)}
      {L('kloaka-mintza', 810, 440, s.map(W - 22, s.dEnd(W - 22) + 8), g.cloaca)}
      {L('alantoidea', 810, 480, allPart[Math.min(allPart.length - 1, 10)], g.bud)}
    </g>
  );
}
