'use client';

import { C, Label, Note, Part, bezier, clamp, lerp, rand, seg, tube, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { f1 } from './common';
import { DiscDrawing, makeDisc } from './DiscSection';
import { frameAt, inFrame, type Key } from './gastroKit';

/**
 * Recap of the end-of-week-2 conceptus (realistic cells, w3 fig. 1 / Langman 13-day embryo): the
 * chorionic cavity inside the chorion — extra-embryonic mesoderm lining (chorionic plate), light-green
 * cytotrophoblast and dark-green syncytiotrophoblast with its maternal-blood lacunae — primary villi
 * (cytotrophoblast cores pushing into the syncytium), the connecting stalk, and the bilaminar disc
 * between the amnion (dorsal) and the secondary yolk sac (ventral), both coated by extra-embryonic
 * mesoderm. Trophoblast colours follow Langman and the week-2 day-13 scene that comes just before.
 */
const CH = { cx: 500, cy: 344 };
const RY = 0.85; // chorion ry / rx
const R_MESO = 250; // inner surface of the extra-embryonic mesoderm lining
const R_CYTO = 262;
const R_SYN = 274;
const R_OUT = 285;

type P2 = [number, number];
const ring = (rx: number, n = 120): P2[] => Array.from({ length: n + 1 }, (_, i) => [CH.cx + rx * Math.cos((i / n) * 2 * Math.PI), CH.cy + rx * RY * Math.sin((i / n) * 2 * Math.PI)]);
const onRing = (rx: number, deg: number): P2 => [CH.cx + rx * Math.cos((deg * Math.PI) / 180), CH.cy + rx * RY * Math.sin((deg * Math.PI) / 180)];
const pathD = (pts: P2[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${f1(q[0])},${f1(q[1])}`).join('');

/** Primary villus: syncytiotrophoblast finger with a cytotrophoblast core. */
function villus(deg: number, len: number) {
  const w = 5.5;
  const syn = [onRing(R_SYN, deg - w), onRing(R_OUT + len, deg - w * 0.35), onRing(R_OUT + len + 5, deg), onRing(R_OUT + len, deg + w * 0.35), onRing(R_SYN, deg + w)];
  const core = [onRing(R_CYTO + 4, deg - w * 0.45), onRing(R_OUT + len - 5, deg - w * 0.18), onRing(R_OUT + len - 2, deg), onRing(R_OUT + len - 5, deg + w * 0.18), onRing(R_CYTO + 4, deg + w * 0.45)];
  return { syn: pathD(syn) + 'Z', core: pathD(core) + 'Z', tip: onRing(R_OUT + len + 5, deg), deg };
}
const villi = (grow: number) => Array.from({ length: 24 }, (_, i) => villus((i / 24) * 360 + 7, (12 + ((i * 7) % 3) * 5) * grow));
const VILLI = villi(1);
/** Lacunae with maternal blood sit in the syncytium between the villi. */
const LACUNAE = Array.from({ length: 24 }, (_, i) => (i / 24) * 360 + 7 + 7.5);
const SYN = '#1f8a5c';
const SYN_EDGE = '#0f5236';
const CYTO = C.cyto;
const CYTO_EDGE = '#4a9d63';

/** The recap builds up beat by beat (beats at 0, .12, .22, .32, .42, .52, .62, .72, .88). */
const from = (t: number, a: number) => (a <= 0 ? 1 : seg(t, a, a + 0.04));

/** The embryo hangs in a large chorionic cavity from a long connecting stalk (course figures' proportions). */
const EMB = { k: 0.52, cx: 432, y: 376, amnionH: 150, yolkH: 160 };
function embryo() {
  return makeDisc({ cx: EMB.cx, y: EMB.y, k: EMB.k, w: 270, amnionH: EMB.amnionH, yolkH: EMB.yolkH });
}
const IDS = { amnionWall: 'amnioblastoak' };

/** Stalk centreline: from the amnion's mesoderm coat (caudal side) out to the chorionic lining at −30°. */
function stalkCurve(s: ReturnType<typeof embryo>) {
  const a = 0.36;
  const cm = s.lay.wallA + s.lay.coatA / 2;
  const rX = s.rx + cm;
  const rY = s.p.amnionH * s.k + cm;
  const p0: P2 = [s.p.cx + rX * Math.cos(a), s.cyA - rY * Math.sin(a)];
  const nx = Math.cos(a) / rX;
  const ny = -Math.sin(a) / rY;
  const nl = Math.hypot(nx, ny);
  const p3 = onRing(R_CYTO - 1, -24);
  const p2 = onRing(R_MESO - 40, -24);
  return bezier(p0, [p0[0] + (nx / nl) * 34, p0[1] + (ny / nl) * 34], p2, p3);
}
/** Half-width: slim in the middle, flaring where it merges into the amnion coat (u=0) and the chorion (u=1). */
const stalkW = (u: number) => 13 + 7 * Math.max(0, 1 - u / 0.25) ** 2 + 12 * Math.max(0, (u - 0.72) / 0.28) ** 2;
/** Mesenchymal nuclei scattered through the stalk (fixed positions, revealed as it grows). */
const STALK_NUCLEI = Array.from({ length: 26 }, (_, i) => ({ u: Math.min(0.95, (i + 0.2 + rand(i * 7.3) * 0.6) / 26), v: (rand(i * 3.7 + 1) - 0.5) * 1.3 }));

/** Outer edge of the embryo complex: amnion (dorsal) and yolk sac (ventral), each with its mesoderm coat. */
function complexOutline(s: ReturnType<typeof embryo>) {
  const coat = s.lay.wallA + s.lay.coatA;
  const up = s.arc(s.cyA, s.rx + coat, s.p.amnionH * s.k + coat, true);
  const down = s.arc(s.cyY, s.rx + coat, s.p.yolkH * s.k + coat, false).reverse();
  return pathD([...up, ...down]) + 'Z';
}

function Stage1Drawing({ t }: SceneProps) {
  const s = embryo();
  // Primary villi: cytotrophoblast cores push into the syncytium.
  const V = villi(lerp(0.15, 1, seg(t, 0.02, 0.11)));
  const stalkG = seg(t, 0.32, 0.4);
  const stalk = stalkCurve(s);
  const ST = tube(stalk, stalkW, 1 - stalkG, 1, 40, stalkG < 0.999);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <radialGradient id="w3s1-cav" cx="44%" cy="38%" r="70%">
          <stop offset="0" stopColor="#1c2742" />
          <stop offset="0.7" stopColor="#131a2c" />
          <stop offset="1" stopColor="#0d1220" />
        </radialGradient>
      </defs>
      {/* The cavity is only the space around the embryo complex: the amnion and yolk sac (with their mesoderm
          coat) are cut out, so lighting the cavity never lights the complex inside it. */}
      <Part id="korion-barrunbea" quiet>
        <path d={pathD(ring(R_MESO)) + complexOutline(s)} fill="url(#w3s1-cav)" fillRule="evenodd" />
      </Part>
      {/* Primary villi, then the chorion over their roots. */}
      <Part id="biloxka-primarioa">
        {V.map((v, i) => (
          <g key={i}>
            <path d={v.syn} fill={SYN} stroke={SYN_EDGE} strokeWidth={0.8} />
            <path d={v.core} fill={CYTO} stroke={CYTO_EDGE} strokeWidth={0.6} />
          </g>
        ))}
      </Part>
      {/* Chorion, outside in: syncytiotrophoblast (with its maternal-blood lacunae), cytotrophoblast, chorionic plate. */}
      <Part id="sinzitiotrofoblastoa">
        <path d={pathD(ring(R_OUT)) + pathD(ring(R_SYN).reverse())} fill={SYN} stroke={SYN_EDGE} strokeWidth={0.8} fillRule="evenodd" />
        {ring(R_SYN + 5.5, 70).map((q, i) => (i % 3 === 1 ? null : <ellipse key={i} cx={q[0]} cy={q[1]} rx={1.7} ry={1.2} fill="rgba(6,40,24,0.8)" />))}
        {LACUNAE.map((deg, i) => {
          const [x, y] = onRing(R_SYN + 5.5, deg);
          return <ellipse key={`l${i}`} cx={f1(x)} cy={f1(y)} rx={4.6} ry={2.4} transform={`rotate(${f1(deg + 90)} ${f1(x)} ${f1(y)})`} fill="#b3303f" stroke="#6d1824" strokeWidth={0.6} />;
        })}
      </Part>
      <Part id="zitotrofoblastoa">
        <Cells outer={ring(R_SYN)} inner={ring(R_CYTO)} n={96} fill={CYTO} nucleus="rgba(30,90,50,0.65)" edge="rgba(30,90,50,0.45)" seed={81} />
      </Part>
      {/* Connecting stalk: extra-embryonic mesoderm continuous with the chorionic lining and with the coat of the
          amnion — drawn beneath both so its flared ends merge into them; it grows out from the chorion. */}
      <Part id="finkapen-pedikulua" groups={['enbrioi-kanpoko-mesodermoa']} show={stalkG > 0.001 ? 1 : 0}>
        <path d={ST.d} fill={C.mesoExtra} />
        <path d={ST.d} fill="url(#g-shade)" opacity={0.4} />
        {STALK_NUCLEI.filter((q) => q.u > 1 - stalkG + 0.03).map((q, i) => {
          const c = stalk(q.u);
          const w = stalkW(q.u) * q.v;
          return <ellipse key={i} cx={c.x + c.nx * w} cy={c.y + c.ny * w} rx={2.3} ry={1.7} transform={`rotate(${c.angle} ${c.x + c.nx * w} ${c.y + c.ny * w})`} fill="rgba(150,70,50,0.6)" />;
        })}
        <path d={ST.left} fill="none" stroke="#c96b45" strokeWidth={1.1} strokeLinecap="round" />
        <path d={ST.right} fill="none" stroke="#c96b45" strokeWidth={1.1} strokeLinecap="round" />
      </Part>
      {/* The extra-embryonic mesoderm lining the cytotrophoblast is the chorionic plate (it lights with that mesoderm too). */}
      <Part id="korion-plaka" groups={['enbrioi-kanpoko-mesodermoa']}>
        <Cells outer={ring(R_CYTO)} inner={ring(R_MESO)} n={90} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={82} />
      </Part>

      {/* Shown whole from the start: the cavity and the stalk steps are explained by the germ disc they surround and hold. */}
      <DiscDrawing s={s} ids={IDS} />
    </g>
  );
}

/** Names at full size; only the long ones are set small so they stay inside the frame. */
/**
 * Row for a name in a side column: clear of the edge pills (orientation, y 302–338) and, on the right, of
 * the tool bar (x > 932, y < 222) when the name is long enough to reach it.
 */
function colY(id: string, side: 'l' | 'r', y: number) {
  let v = clamp(y, side === 'r' && id.length > 16 ? 232 : 70, 580);
  if (v > 292 && v < 348) v = v < 320 ? 292 : 348;
  return v;
}

/**
 * A layered whole (the bilaminar disc): a bracket across all its layers, from a point inside the first
 * (a) to one inside the last (b), given in scene units and set through the camera.
 */
const LS = (id: string, side: 'l' | 'r', z: ReturnType<typeof frameAt>, a: Pt, b: Pt, show: number, dy = 0) => {
  const A = z.at(a[0], a[1]);
  const Bq = z.at(b[0], b[1]);
  const m: Pt = [(A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2];
  return <Label key={id} id={id} x={side === 'l' ? 190 : 810} y={colY(id, side, m[1] + dy)} span={[A, Bq]} show={show * inFrame(m, 40)} small={id.length > 20} />;
};
const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={id.length > 20} />;

/**
 * Camera of the conceptus: each step pushes in on what it names (villi, chorionic plate, amnion, the disc
 * margin) and pulls back for what needs the whole (cavity, stalk, mesoderm round every cavity, recap).
 * Every move starts at its beat and settles well before the beat's held frame.
 */
const VILLUS_DEG = VILLI[15].deg;
const F_VILLI: Pt = onRing(R_OUT + 6, VILLUS_DEG - 7);
const F_PLATE: Pt = onRing(R_CYTO, 160);
/** Wide frame: the chorion's layers stay in view, only the villus tips may run off the top and bottom. */
const WIDE = [515, 340, 1.2] as const;
function conceptusKeys(): Key[] {
  const s = embryo();
  const E: Pt = [EMB.cx + 8, EMB.y - 6];
  // Disc margin close-up: the margin a third in from the left, so the layer names sit in the chorionic cavity beside it.
  const M = s.map(-s.W * 0.57, 10);
  return [
    [0, 500, 330, 1],
    [0.005, 500, 330, 1],
    [0.045, F_VILLI[0], F_VILLI[1], 2.3],
    [0.12, F_VILLI[0], F_VILLI[1], 2.3],
    // The whole cavity, as large as the frame allows (the villus tips may leave it).
    [0.16, WIDE[0], WIDE[1], WIDE[2]],
    [0.22, WIDE[0], WIDE[1], WIDE[2]],
    [0.26, F_PLATE[0], F_PLATE[1], 2.5],
    [0.32, F_PLATE[0], F_PLATE[1], 2.5],
    [0.36, 540, 318, 1.12],
    [0.42, 540, 318, 1.12],
    [0.46, E[0], E[1], 2.05],
    [0.52, E[0], E[1], 2.05],
    [0.56, M[0], M[1], 3.4],
    [0.62, M[0], M[1], 3.4],
    [0.66, E[0], E[1], 2.05],
    [0.72, E[0], E[1], 2.05],
    [0.76, WIDE[0], WIDE[1], WIDE[2]],
    [1, WIDE[0], WIDE[1], WIDE[2]],
  ];
}
const KEYS = conceptusKeys();

/** Names of the conceptus, following the camera: a name is set while its structure is framed and thick enough to point into. */
function conceptusLabels(t: number, z: ReturnType<typeof frameAt>) {
  const s = embryo();
  const stalk = stalkCurve(s);
  const LZ = (id: string, side: 'l' | 'r', p: Pt, show: number, dy = 0) => {
    const q = z.at(p[0], p[1]);
    return L(id, side === 'l' ? 190 : 810, colY(id, side, q[1] + dy), q, show * inFrame(q, 40));
  };
  const big = (min: number) => clamp((z.s - min) / 0.25);
  // On the margin close-up the disc's own name moves in, next to the two layer names.
  // Wide: the disc sits left of centre, so its name goes to the left column, close to its cranial end.
  const wide = z.s < 1.5;
  const half = z.s > 2.5 ? -s.W * 0.32 : wide ? -s.W * 0.78 : s.W * 0.55;
  return (
    <>
      {/* The villus is named in its cytotrophoblast core, which is what makes it a primary villus. */}
      {LZ('biloxka-primarioa', 'l', onRing(R_OUT + 7, VILLUS_DEG), 1, -40)}
      {LZ('sinzitiotrofoblastoa', 'l', onRing((R_SYN + R_OUT) / 2, VILLUS_DEG - 11.5), 1, -4)}
      {LZ('zitotrofoblastoa', 'l', onRing((R_CYTO + R_SYN) / 2, VILLUS_DEG - 9), 1, 36)}
      {LZ('korion-plaka', 'l', onRing((R_MESO + R_CYTO) / 2, 164), from(t, 0.22) * (1 - clamp((z.s - 2.6) / 0.3)))}
      {LZ('korion-barrunbea', 'l', [400, 240], from(t, 0.12), 40)}
      {LZ('finkapen-pedikulua', 'r', ((c) => [c.x, c.y] as Pt)(stalk(0.5)), from(t, 0.34))}
      {LZ('amnios-barrunbea', 'r', s.at.amnion, from(t, 0.42))}
      {LZ('amnioblastoak', 'r', s.at.amnionWall.map((v, i) => (i ? v : 2 * s.p.cx - v)) as Pt, from(t, 0.42) * big(1.8))}
      {LZ('epiblastoa', 'l', s.map(-s.W * 0.86, s.tEpi(s.W * 0.86) / 2), from(t, 0.52) * big(1.8), -24)}
      {LZ('hipoblastoa', 'l', s.map(-s.W * 0.8, s.dEnd(s.W * 0.8) + 4), from(t, 0.52) * big(3), 24)}
      {/* The disc as a whole (both layers light): named on its caudal half, inside the epiblast. */}
      {LS('bi-orriko-diskoa', wide ? 'l' : 'r', z, s.map(half, 2.5), s.map(half, s.dEnd(half) + 5.5), from(t, 0.52), z.s > 2.5 ? 80 : wide ? -34 : -60)}
      {LZ('bitelo-zaku-sekundarioa', 'r', s.at.yolk, from(t, 0.62))}
      {/* Extra-embryonic mesoderm: named on the chorionic plate, its thickest sheet (it lines every cavity). */}
      {LZ('enbrioi-kanpoko-mesodermoa', 'r', onRing((R_MESO + R_CYTO) / 2, 32), from(t, 0.22))}
    </>
  );
}

export function Stage1Sagittal(props: SceneProps) {
  const { t } = props;
  const z = frameAt(t, KEYS);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
        <Stage1Drawing {...props} />
      </g>
      {conceptusLabels(t, z)}
    </g>
  );
}

/**
 * "Diskoa gertutik": the bilaminar disc's own story, at cell level, step by step alongside the narration —
 * the disc between its two sacs, the chorionic cavity around them, the extra-embryonic mesoderm coat (the
 * chorionic plate's own tissue), the connecting stalk's root at the caudal end, the amnion roof, the two
 * layers' cells at the margin, the yolk-sac lining, the mesoderm round every cavity, and the recap. The
 * camera eases from one subject to the next; the subject stays bright and the rest steps back.
 */
const B = [0, 0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.88];
const DISC_KEYS: Key[] = [
  [0, 500, 312, 1],
  [0.12, 500, 312, 1],
  [0.16, 500, 300, 0.8],
  [0.22, 500, 300, 0.8],
  [0.26, 690, 320, 1.3],
  [0.32, 690, 320, 1.3],
  [0.36, 700, 210, 1.12],
  [0.42, 700, 210, 1.12],
  [0.46, 470, 215, 1.35],
  [0.52, 470, 215, 1.35],
  [0.548, 300, 300, 2.25],
  [0.6, 300, 300, 2.25],
  [0.65, 500, 420, 1.3],
  [0.72, 500, 420, 1.3],
  [0.76, 530, 300, 0.9],
  [1, 530, 300, 0.9],
];

/** The close-up disc has the conceptus embryo's sacs, enlarged. */
const DISC = { k: 1.15, amnionH: EMB.amnionH, yolkH: EMB.yolkH };
const DIVE = DISC.k / EMB.k;

/** How much each step is the current one (they sum to 1; each hands over in .04). */
const steps = (t: number) => B.map((b, i) => from(t, b) - (i + 1 < B.length ? from(t, B[i + 1]) : 0));
/** Emphasis per step: [disc, amnion, yolk, coat, stalk, cavity]. */
const TONE: [number, number, number, number, number, number][] = [
  [1, 0.5, 0.5, 0.42, 0.42, 0.5],
  [0.62, 0.62, 0.62, 0.62, 0.62, 1],
  [0.5, 0.5, 0.5, 1, 0.8, 0.5],
  [0.5, 0.5, 0.5, 0.75, 1, 0.5],
  [0.55, 1, 0.45, 0.45, 0.45, 0.5],
  [1, 0.6, 0.6, 0.6, 0.6, 0.5],
  [0.8, 0.45, 1, 0.45, 0.45, 0.5],
  [0.55, 0.55, 0.55, 1, 1, 0.7],
  [1, 1, 1, 1, 1, 0.8],
];

/** Root of the connecting stalk: out of the amnion's mesoderm coat on the caudal side, up to the chorion (off frame). */
function discStalk(s: ReturnType<typeof makeDisc>) {
  const a = 0.36;
  const cm = s.lay.wallA + s.lay.coatA / 2;
  const rX = s.rx + cm;
  const rY = s.p.amnionH * s.k + cm;
  const p0: P2 = [s.p.cx + rX * Math.cos(a), s.cyA - rY * Math.sin(a)];
  const nx = Math.cos(a) / rX;
  const ny = -Math.sin(a) / rY;
  const nl = Math.hypot(nx, ny);
  return bezier(p0, [p0[0] + (nx / nl) * 70, p0[1] + (ny / nl) * 70], [980, 40], [1140, -60]);
}
const discStalkW = (u: number) => DIVE * (13 + 7 * Math.max(0, 1 - u / 0.25) ** 2);

export function Stage1Disc({ t }: SceneProps) {
  const s = makeDisc(DISC);
  const z = frameAt(t, DISC_KEYS);
  const w = steps(t);
  const on = (...ks: number[]) => ks.reduce((a, k) => a + w[k], 0);
  const tone = TONE[0].map((_, j) => w.reduce((a, wi, i) => a + wi * TONE[i][j], 0));
  const [tDisc, tAmn, tYolk, tCoat, tStalk, tCav] = tone;
  const close = clamp((z.s - 1.35) / 0.9); // the margin close-up
  const stalk = discStalk(s);
  const ST = tube(stalk, discStalkW, 0, 1, 40);
  const P = (p: Pt) => z.at(p[0], p[1]);
  const LZ = (id: string, side: 'l' | 'r', p: Pt, show: number, dy = 0) => {
    const q = P(p);
    return L(id, side === 'l' ? 190 : 810, colY(id, side, q[1] + dy), q, show * inFrame(q, 34));
  };
  // The amnion's roof named on its left wall; the disc's layers on its cranial half (left), the disc as a whole on the right.
  const wallA = 0.9;
  const wall: Pt = [s.p.cx - (s.rx + s.lay.wallA / 2) * Math.cos(wallA), s.cyA - (s.p.amnionH * s.k + s.lay.wallA / 2) * Math.sin(wallA)];
  const epiX = lerp(-150, -200, close);
  const hypX = lerp(-140, -215, close);
  // On the margin close-up the bracket sits short of the right column, its name in the amniotic cavity above.
  const discX = lerp(120, -75, close);
  // Named near its root, so the anchor stays left of the right column at every camera.
  const st = stalk(0.16);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <radialGradient id="w3s1d-cav" gradientUnits="userSpaceOnUse" cx={460} cy={260} r={720}>
          <stop offset="0" stopColor="#1c2742" />
          <stop offset="0.7" stopColor="#131a2c" />
          <stop offset="1" stopColor="#0d1220" />
        </radialGradient>
      </defs>
      <g transform={z.transform}>
        {/* The chorionic cavity: all the space round the two sacs and their coat. */}
        <g opacity={tCav}>
          <Part id="korion-barrunbea" quiet>
            <path d={`M-500,-500H1500V1100H-500Z${complexOutline(s)}`} fill="url(#w3s1d-cav)" fillRule="evenodd" />
          </Part>
        </g>
        {/* The stalk's root, drawn under the coat so its flare merges into it. */}
        <g opacity={tStalk}>
          <Part id="finkapen-pedikulua" groups={['enbrioi-kanpoko-mesodermoa']}>
            <path d={ST.d} fill={C.mesoExtra} />
            <path d={ST.d} fill="url(#g-shade)" opacity={0.4} />
            {STALK_NUCLEI.map((q, i) => {
              const c = stalk(q.u);
              const hw = discStalkW(q.u) * q.v;
              return <ellipse key={i} cx={c.x + c.nx * hw} cy={c.y + c.ny * hw} rx={2.3 * DIVE} ry={1.7 * DIVE} transform={`rotate(${c.angle} ${c.x + c.nx * hw} ${c.y + c.ny * hw})`} fill="rgba(150,70,50,0.6)" />;
            })}
            <path d={ST.left} fill="none" stroke="#c96b45" strokeWidth={1.4} strokeLinecap="round" />
            <path d={ST.right} fill="none" stroke="#c96b45" strokeWidth={1.4} strokeLinecap="round" />
          </Part>
        </g>
        <DiscDrawing s={s} ids={IDS} tone={{ disc: tDisc, amnion: tAmn, yolk: tYolk, coat: tCoat }} />
      </g>

      {LS('bi-orriko-diskoa', 'r', z, s.map(discX, 2.5), s.map(discX, s.dEnd(discX) + 5.5), on(0, 5, 8), close > 0.5 ? -80 : 0)}
      {LZ('epiblastoa', 'l', s.map(epiX, s.tEpi(-epiX) / 2), on(0, 5, 8), -18)}
      {LZ('hipoblastoa', 'l', s.map(hypX, s.dEnd(-hypX) + 4), on(0, 5, 6, 8), 18)}
      {LZ('amnios-barrunbea', 'r', s.at.amnion, on(0, 4, 7, 8), -34)}
      {LZ('amnioblastoak', 'l', wall, on(4, 8))}
      {LZ('bitelo-zaku-sekundarioa', 'r', s.at.yolk, on(0, 6, 7, 8))}
      {LZ('korion-barrunbea', 'l', [236, 112], on(1, 7, 8))}
      {LZ('enbrioi-kanpoko-mesodermoa', 'r', s.at.extraMeso, on(2, 7, 8), 40)}
      {LZ('finkapen-pedikulua', 'r', [st.x, st.y], on(3, 7, 8), -44)}

      {(
        [
          [0, 'Bi orriko diskoa: amnios barrunbearen eta bitelo zakuaren artean'],
          [1, 'Korion barrunbea: bi zakuen inguruko barrunbe handia'],
          [2, 'Enbrioi kanpoko mesodermoak bi zakuak estaltzen ditu (korion plakaren ehun bera)'],
          [3, 'Finkapen pedikulua: amnioaren mesodermotik korion plakara, alde kaudalean'],
          [4, 'Amnioblastoek amnios barrunbearen sabaia osatzen dute'],
          [5, 'Epiblastoa: zelula zilindriko luzeak · hipoblastoa: zelula kubiko txikiak'],
          [6, 'Bitelo zaku sekundarioa diskoaren azpian, hipoblastotik sortua'],
          [7, 'Enbrioi kanpoko mesodermoa barrunbe guztien inguruan'],
          [8, 'Oraindik bi orri: gastrulazioa hurrengo etapan'],
        ] as const
      ).map(([k, text]) => (
        <Note key={k} x={500} y={606} tone={k === 8 ? undefined : 'accent'} show={clamp((w[k] - 0.5) * 2)}>
          {text}
        </Note>
      ))}
    </g>
  );
}
