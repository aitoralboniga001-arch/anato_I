'use client';

import { C, Label, Mark, Note, Part, bezier, lerp, rand, seg, tube, type Pt, type SceneProps } from '@/components/kit';
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
/** Lit while a beat is on: rises at its start, fades at the next beat. */
const during = (t: number, a: number, b: number) => seg(t, a - 0.01, a + 0.03) * (1 - seg(t, b - 0.01, b + 0.02));

const EMB = { k: 0.74, cx: 482, y: 328, amnionH: 150, yolkH: 160 };
function embryo() {
  return makeDisc({ cx: EMB.cx, y: EMB.y, k: EMB.k, w: 270, amnionH: EMB.amnionH, yolkH: EMB.yolkH });
}
const IDS = { amnionWall: 'amnioblastoak' };

/** Stalk centreline: from the amnion's mesoderm coat (caudal side) out to the chorionic lining at −30°. */
function stalkCurve(s: ReturnType<typeof embryo>) {
  const a = 0.36;
  const rX = s.rx + 8 * s.k;
  const rY = s.p.amnionH * s.k + 8 * s.k;
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
  const coat = 10 * s.k;
  const up = s.arc(s.cyA, s.rx + coat, s.p.amnionH * s.k + coat, true);
  const down = s.arc(s.cyY, s.rx + coat, s.p.yolkH * s.k + coat, false).reverse();
  return pathD([...up, ...down]) + 'Z';
}

function Stage1Drawing({ t }: SceneProps) {
  const s = embryo();
  // Primary villi: cytotrophoblast cores push into the syncytium.
  const V = villi(lerp(0.15, 1, seg(t, 0, 0.1)));
  const sheath = t >= 0.72 && t < 0.88 ? 1 : 0;
  const stalkG = seg(t, 0.32, 0.4);
  const stalk = stalkCurve(s);
  const ST = tube(stalk, stalkW, 1 - stalkG, 1, 40, stalkG < 0.999);
  const discY = s.map(0, 14)[1];
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
      <Part id="finkapen-pedikulua" show={stalkG > 0.001 ? 1 : 0}>
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
      {/* The extra-embryonic mesoderm lining the cytotrophoblast is the chorionic plate. While the step tells
          that this mesoderm lines every cavity (chorionic, amniotic, yolk sac), it lights as that mesoderm. */}
      <Part id={sheath > 0.5 ? 'enbrioi-kanpoko-mesodermoa' : 'korion-plaka'}>
        <Cells outer={ring(R_CYTO)} inner={ring(R_MESO)} n={90} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={82} />
      </Part>

      {/* Shown whole from the start: the cavity and the stalk steps are explained by the germ disc they surround and hold. */}
      <DiscDrawing s={s} ids={IDS} />
      {/* The germ disc as a whole: a soft pool of light along it while a step is about the disc. */}
      <Mark id="bi-orriko-diskoa" x={EMB.cx} y={discY} rx={s.rx * 0.98} ry={16} show={Math.max(during(t, 0.52, 0.62), seg(t, 0.88, 0.92))} />
    </g>
  );
}

const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small />;

export function Stage1Sagittal(props: SceneProps) {
  const { t } = props;
  const s = embryo();
  return (
    <g>
      <Stage1Drawing {...props} />
      {L('biloxka-primarioa', 190, 120, VILLI[16].tip, from(t, 0))}
      {L('korion-plaka', 190, 170, onRing(R_MESO + 6, 212), from(t, 0.22))}
      {L('sinzitiotrofoblastoa', 190, 215, onRing((R_SYN + R_OUT) / 2, 196), from(t, 0))}
      {L('zitotrofoblastoa', 190, 260, onRing((R_CYTO + R_SYN) / 2, 188), from(t, 0))}
      {L('korion-barrunbea', 190, 410, [292, 452], from(t, 0.12))}
      {/* On the amnion's coat (the chorionic lining is named as the plate). */}
      {L('enbrioi-kanpoko-mesodermoa', 810, 500, s.at.extraMesoYolk, from(t, 0.22))}
      {L('epiblastoa', 190, 486, s.at.epiblast, from(t, 0.52))}
      {L('bi-orriko-diskoa', 190, 524, s.map(-150, 20), from(t, 0.52))}
      {L('finkapen-pedikulua', 810, 222, ((c) => [c.x, c.y] as Pt)(stalkCurve(s)(0.55)), from(t, 0.34))}
      {L('amnios-barrunbea', 810, 262, s.at.amnion, from(t, 0.42))}
      {L('amnioblastoak', 810, 380, s.at.amnionWall.map((v, i) => (i ? v : 2 * s.p.cx - v)) as Pt, from(t, 0.42))}
      {L('hipoblastoa', 810, 420, s.map(120, s.dEnd(120) + 4), from(t, 0.52))}
      {L('bitelo-zaku-sekundarioa', 810, 460, s.at.yolk, from(t, 0.62))}
      <Note x={500} y={608} tone="accent" show={seg(t, 0.88, 0.93)}>
        13–14. eguna: bi orri. Hurrengo etapa (15–16. egunak): gastrulazioa
      </Note>
    </g>
  );
}

/**
 * Close-up of the bilaminar disc: columnar epiblast continuous with the amnioblasts, cuboidal hypoblast
 * continuous with the yolk-sac lining. While the step names the two layers the camera pushes in on the
 * disc margin, so the tall epiblast cells and the low hypoblast cells (and where each sheet runs on into
 * its sac) are seen cell by cell; it pulls back out for the yolk sac and its mesoderm coat.
 */
const DISC_KEYS: Key[] = [
  [0, 500, 330, 1],
  [0.5, 500, 330, 1],
  [0.548, 300, 300, 2.25],
  [0.6, 300, 300, 2.25],
  [0.645, 500, 330, 1],
  [1, 500, 330, 1],
];

export function Stage1Disc({ t }: SceneProps) {
  const s = makeDisc({});
  const z = frameAt(t, DISC_KEYS);
  const close = (z.s - 1) / 1.25; // 0 overview … 1 pushed in
  const amnion = from(t, 0.42);
  const disc = from(t, 0.52);
  const yolk = from(t, 0.62);
  const sheath = from(t, 0.72);
  // On the close-up the amnion is named where its wall meets the disc margin (still inside the frame).
  const wallA = lerp(0.9, 0.34, close);
  const wall: Pt = [s.p.cx - s.rx * Math.cos(wallA), s.cyA - (s.p.amnionH * s.k + 3 * s.k) * Math.sin(wallA)];
  const P = (p: Pt) => z.at(p[0], p[1]);
  const LZ = (id: string, x: number, y: number, p: Pt, show: number) => {
    const q = P(p);
    return L(id, x, y, q, show * inFrame(q, 34));
  };
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
        <g opacity={lerp(0.3, 1, Math.max(amnion, seg(t, 0, 0.06) * 0.4))}>
          <DiscDrawing s={s} ids={IDS} />
        </g>
      </g>
      {LZ('amnios-barrunbea', 810, 160, s.at.amnion, amnion)}
      {LZ('amnioblastoak', 190, 170, wall, amnion)}
      {LZ('epiblastoa', 190, lerp(215, 262, close), close > 0.5 ? s.map(-200, 10) : s.at.epiblast, disc)}
      {LZ('bi-orriko-diskoa', 810, lerp(420, 440, close), s.map(lerp(120, -40, close), lerp(14, 24, close)), disc)}
      {LZ('hipoblastoa', 190, lerp(440, 400, close), close > 0.5 ? s.map(-215, s.dEnd(-215) + 4) : s.at.hypo, disc)}
      {LZ('enbrioi-kanpoko-mesodermoa', 810, 470, s.at.extraMesoYolk, sheath)}
      {LZ('bitelo-zaku-sekundarioa', 810, 510, s.at.yolk, yolk)}
      <Note x={500} y={606} tone="accent" show={Math.min(disc, 1 - seg(t, 0.6, 0.64))}>
        Epiblastoa: zelula zilindriko luzeak (dortsala) · hipoblastoa: zelula kubiko txikiak (bentrala)
      </Note>
      <Note x={500} y={606} show={seg(t, 0.88, 0.92)}>
        Oraindik bi orri: gastrulazioa hurrengo etapan
      </Note>
    </g>
  );
}
