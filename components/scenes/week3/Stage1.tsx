'use client';

import { Arrow, C, Label, Note, Part, bezier, lerp, rand, seg, tube, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { f1 } from './common';
import { DiscDrawing, makeDisc } from './DiscSection';

/**
 * Recap of the end-of-week-2 conceptus (realistic cells, w3 fig. 1): chorionic cavity inside the
 * chorionic plate (extra-embryonic mesoderm + cytotrophoblast + syncytiotrophoblast) with primary
 * villi (cytotrophoblast cores pushing into the syncytium), the connecting stalk, and the bilaminar
 * disc between the amnion (dorsal) and the secondary yolk sac (ventral), both coated by
 * extra-embryonic mesoderm.
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
  return { syn: pathD(syn) + 'Z', core: pathD(core) + 'Z', tip: onRing(R_OUT + len + 5, deg) };
}
const villi = (grow: number) => Array.from({ length: 24 }, (_, i) => villus((i / 24) * 360 + 7, (12 + ((i * 7) % 3) * 5) * grow));
const VILLI = villi(1);

/** The recap builds up beat by beat (beats at 0, .12, .22, .32, .42, .52, .62, .72, .88). */
const from = (t: number, a: number) => (a <= 0 ? 1 : seg(t, a, a + 0.04));

function embryo(k: number, cx: number, y: number, amnionH: number, yolkH: number) {
  return makeDisc({ cx, y, k, w: 270, amnionH, yolkH });
}
const IDS = { amnionWall: 'amnioblastoak' };

/** Stalk centreline: from the amnion's mesoderm coat (caudal side) out to the chorionic lining at −28°. */
function stalkCurve(s: ReturnType<typeof embryo>) {
  const a = 0.42;
  const rX = s.rx + 8 * s.k;
  const rY = s.p.amnionH * s.k + 8 * s.k;
  const p0: P2 = [s.p.cx + rX * Math.cos(a), s.cyA - rY * Math.sin(a)];
  const nx = Math.cos(a) / rX;
  const ny = -Math.sin(a) / rY;
  const nl = Math.hypot(nx, ny);
  const p3 = onRing(R_CYTO - 1, -28);
  const p2 = onRing(R_MESO - 60, -28);
  return bezier(p0, [p0[0] + (nx / nl) * 55, p0[1] + (ny / nl) * 55], p2, p3);
}
/** Half-width: slim in the middle, flaring where it merges into the amnion coat (u=0) and the chorion (u=1). */
const stalkW = (u: number) => 12 + 6 * Math.max(0, 1 - u / 0.22) ** 2 + 11 * Math.max(0, (u - 0.76) / 0.24) ** 2;
/** Mesenchymal nuclei scattered through the stalk (fixed positions, revealed as it grows). */
const STALK_NUCLEI = Array.from({ length: 30 }, (_, i) => ({ u: Math.min(0.95, (i + 0.2 + rand(i * 7.3) * 0.6) / 30), v: (rand(i * 3.7 + 1) - 0.5) * 1.3 }));

/** Outer edge of the embryo complex: amnion (dorsal) and yolk sac (ventral), each with its mesoderm coat. */
function complexOutline(s: ReturnType<typeof embryo>) {
  const coat = 10 * s.k;
  const up = s.arc(s.cyA, s.rx + coat, s.p.amnionH * s.k + coat, true);
  const down = s.arc(s.cyY, s.rx + coat, s.p.yolkH * s.k + coat, false).reverse();
  return pathD([...up, ...down]) + 'Z';
}

function Stage1Drawing({ t }: SceneProps) {
  const s = embryo(0.6, 485, 336, 150, 160);
  // Primary villi: cytotrophoblast cores push into the syncytium.
  const V = villi(lerp(0.15, 1, seg(t, 0, 0.1)));
  const sheath = t >= 0.72 && t < 0.88 ? 1 : 0;
  const stalkG = seg(t, 0.32, 0.4);
  const stalk = stalkCurve(s);
  const ST = tube(stalk, stalkW, 1 - stalkG, 1, 40, stalkG < 0.999);
  const pol = seg(t, 0.88, 1);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      {/* The cavity is only the space around the embryo complex: the amnion and yolk sac (with their mesoderm
          coat) are cut out, so lighting the cavity never lights the complex inside it. */}
      <Part id="korion-barrunbea" quiet>
        <path d={pathD(ring(R_MESO)) + complexOutline(s)} fill="#141c30" fillRule="evenodd" />
      </Part>
      {/* Primary villi, then the chorionic plate over their roots. */}
      <Part id="biloxka-primarioa">
        {V.map((v, i) => (
          <g key={i}>
            <path d={v.syn} fill="#b7824f" stroke="#7c5230" strokeWidth={0.7} />
            <path d={v.core} fill="#e3c58f" stroke="rgba(90,60,20,0.6)" strokeWidth={0.6} />
          </g>
        ))}
      </Part>
      {/* Chorion, outside in: syncytiotrophoblast, cytotrophoblast, and (below) the chorionic plate lining it. */}
      <Part id="sinzitiotrofoblastoa">
        <path d={pathD(ring(R_OUT)) + pathD(ring(R_SYN).reverse())} fill="#b7824f" fillRule="evenodd" />
        {ring(R_SYN + 5.5, 70).map((q, i) => (
          <ellipse key={i} cx={q[0]} cy={q[1]} rx={1.8} ry={1.3} fill="rgba(70,40,15,0.75)" />
        ))}
      </Part>
      <Part id="zitotrofoblastoa">
        <Cells outer={ring(R_SYN)} inner={ring(R_CYTO)} n={96} fill="#e3c58f" nucleus="rgba(90,60,20,0.6)" seed={81} />
      </Part>
      {/* Connecting stalk: extra-embryonic mesoderm continuous with the chorionic lining and with the coat of the
          amnion — drawn beneath both so its flared ends merge into them; it grows out from the chorion. */}
      <Part id="finkapen-pedikulua" show={stalkG > 0.001 ? 1 : 0}>
        <path d={ST.d} fill={C.mesoExtra} />
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
      <Part id="bi-orriko-diskoa" quiet show={seg(t, 0.52, 0.56)}>
        <path d={pathD([...Array.from({ length: 31 }, (_, i) => s.map(lerp(-270, 270, i / 30), -1.5)), ...Array.from({ length: 31 }, (_, i) => s.map(lerp(270, -270, i / 30), s.dEnd(lerp(270, -270, i / 30)) + 9.5))]) + 'Z'} fill="none" stroke="#e8eefc" strokeWidth={0.9} strokeDasharray="4 3" opacity={0.5} />
      </Part>
      <Arrow from={[CH.cx, 40]} to={[CH.cx, 600]} bend={0} color="#93c5fd" show={pol * 0.5} progress={pol} width={1.4} dashed />
    </g>
  );
}

const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small />;

export function Stage1Sagittal(props: SceneProps) {
  const { t } = props;
  const s = embryo(0.6, 485, 336, 150, 160);
  return (
    <g>
      <Stage1Drawing {...props} />
      {L('biloxka-primarioa', 190, 130, VILLI[16].tip, from(t, 0))}
      {L('korion-plaka', 190, 175, onRing(R_MESO + 6, 212), from(t, 0.22))}
      {L('sinzitiotrofoblastoa', 190, 220, onRing((R_SYN + R_OUT) / 2, 196), from(t, 0))}
      {L('zitotrofoblastoa', 190, 265, onRing((R_CYTO + R_SYN) / 2, 188), from(t, 0))}
      {L('korion-barrunbea', 190, 400, [300, 420], from(t, 0.12))}
      {/* On the amnion's coat (the chorionic lining is named as the plate). */}
      {L('enbrioi-kanpoko-mesodermoa', 190, 440, [2 * s.p.cx - s.at.extraMeso[0], s.at.extraMeso[1]], from(t, 0.22))}
      {L('epiblastoa', 190, 480, s.at.epiblast, from(t, 0.52))}
      {L('bi-orriko-diskoa', 190, 520, s.map(-150, 20), from(t, 0.52))}
      {L('finkapen-pedikulua', 810, 235, ((c) => [c.x, c.y] as Pt)(stalkCurve(s)(0.62)), from(t, 0.34))}
      {L('amnios-barrunbea', 810, 270, s.at.amnion, from(t, 0.42))}
      {L('amnioblastoak', 810, 380, s.at.amnionWall.map((v, i) => (i ? v : 2 * s.p.cx - v)) as Pt, from(t, 0.42))}
      {L('hipoblastoa', 810, 420, s.map(120, s.dEnd(120) + 4), from(t, 0.52))}
      {L('bitelo-zaku-sekundarioa', 810, 460, s.at.yolk, from(t, 0.62))}
    </g>
  );
}

/** Close-up of the bilaminar disc: columnar epiblast continuous with the amnioblasts, cuboidal hypoblast continuous with the yolk-sac lining. */
export function Stage1Disc({ t }: SceneProps) {
  const s = makeDisc({});
  const amnion = from(t, 0.42);
  const disc = from(t, 0.52);
  const yolk = from(t, 0.62);
  const sheath = from(t, 0.72);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g opacity={lerp(0.3, 1, Math.max(amnion, seg(t, 0, 0.06) * 0.4))}>
        <DiscDrawing s={s} ids={IDS} />
      </g>
      {L('amnios-barrunbea', 810, 160, s.at.amnion, amnion)}
      {L('amnioblastoak', 190, 170, s.at.amnionWall, amnion)}
      {L('epiblastoa', 190, 215, s.at.epiblast, disc)}
      {L('bi-orriko-diskoa', 810, 420, s.map(120, 14), disc)}
      {L('hipoblastoa', 190, 440, s.at.hypo, disc)}
      {L('enbrioi-kanpoko-mesodermoa', 810, 470, s.at.extraMesoYolk, sheath)}
      {L('bitelo-zaku-sekundarioa', 810, 510, s.at.yolk, yolk)}
      <Note x={500} y={606} tone="accent" show={Math.min(disc, 1 - seg(t, 0.6, 0.64))}>
        Epiblastoa zilindrikoa (dortsala) · hipoblastoa kubikoa (bentrala)
      </Note>
      <Note x={500} y={606} show={seg(t, 0.88, 0.92)}>
        Oraindik bi orri: gastrulazioa hurrengo etapan
      </Note>
    </g>
  );
}
