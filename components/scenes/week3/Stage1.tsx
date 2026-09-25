'use client';

import { Arrow, C, Label, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
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
const VILLI = Array.from({ length: 24 }, (_, i) => villus((i / 24) * 360 + 7, 12 + ((i * 7) % 3) * 5));

function embryo(k: number, cx: number, y: number, amnionH: number, yolkH: number) {
  return makeDisc({ cx, y, k, w: 270, amnionH, yolkH });
}
const IDS = { amnionWall: 'amnioblastoak' };

function Stage1Drawing({ t }: SceneProps) {
  const s = embryo(0.6, 485, 336, 150, 160);
  const base: P2 = [s.p.cx + s.rx + 6, s.cyA - 4];
  const end = onRing(R_MESO - 2, -28);
  const stalk = Array.from({ length: 21 }, (_, i): P2 => {
    const u = i / 20;
    const c: P2 = [base[0] + 50, base[1] - 10];
    return [(1 - u) * (1 - u) * base[0] + 2 * (1 - u) * u * c[0] + u * u * end[0], (1 - u) * (1 - u) * base[1] + 2 * (1 - u) * u * c[1] + u * u * end[1]];
  });
  const side = (d: number) =>
    stalk.map((q, i): P2 => {
      const a = stalk[Math.max(0, i - 1)];
      const b = stalk[Math.min(stalk.length - 1, i + 1)];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const w = d * lerp(1, 1.5, i / 20);
      return [q[0] - ((b[1] - a[1]) / L) * w, q[1] + ((b[0] - a[0]) / L) * w];
    });
  const pol = seg(t, 0.88, 1);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="korion-barrunbea" quiet>
        <path d={pathD(ring(R_MESO))} fill="#141c30" />
      </Part>
      {/* Primary villi, then the chorionic plate over their roots. */}
      <Part id="biloxka-primarioa">
        {VILLI.map((v, i) => (
          <g key={i}>
            <path d={v.syn} fill="#b7824f" stroke="#7c5230" strokeWidth={0.7} />
            <path d={v.core} fill="#e3c58f" stroke="rgba(90,60,20,0.6)" strokeWidth={0.6} />
          </g>
        ))}
      </Part>
      <Part id="korion-plaka">
        <path d={pathD(ring(R_OUT)) + pathD(ring(R_SYN).reverse())} fill="#b7824f" fillRule="evenodd" />
        {ring(R_SYN + 5.5, 70).map((q, i) => (
          <ellipse key={i} cx={q[0]} cy={q[1]} rx={1.8} ry={1.3} fill="rgba(70,40,15,0.75)" />
        ))}
        <Cells outer={ring(R_SYN)} inner={ring(R_CYTO)} n={96} fill="#e3c58f" nucleus="rgba(90,60,20,0.6)" seed={81} />
      </Part>
      <Part id="enbrioi-kanpoko-mesodermoa">
        <Cells outer={ring(R_CYTO)} inner={ring(R_MESO)} n={90} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={82} />
      </Part>
      <Part id="finkapen-pedikulua">
        <path d={pathD([...side(-11), ...side(11).reverse()]) + 'Z'} fill={C.mesoExtra} stroke="#c96b45" strokeWidth={1.1} />
        {stalk.slice(2, -1).map((q, i) => (
          <ellipse key={i} cx={q[0] + ((i * 37) % 9) - 4} cy={q[1] + ((i * 53) % 9) - 4} rx={2.2} ry={1.7} fill="rgba(150,70,50,0.7)" />
        ))}
      </Part>

      <DiscDrawing s={s} ids={IDS} />
      <Part id="bi-orriko-diskoa" quiet>
        <path d={pathD([...Array.from({ length: 31 }, (_, i) => s.map(lerp(-270, 270, i / 30), -1.5)), ...Array.from({ length: 31 }, (_, i) => s.map(lerp(270, -270, i / 30), s.dEnd(lerp(270, -270, i / 30)) + 9.5))]) + 'Z'} fill="none" stroke="#e8eefc" strokeWidth={0.9} strokeDasharray="4 3" opacity={0.5} />
      </Part>
      <Arrow from={[CH.cx, 40]} to={[CH.cx, 600]} bend={0} color="#93c5fd" show={pol * 0.5} progress={pol} width={1.4} dashed />
    </g>
  );
}

const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small />;

export function Stage1Sagittal(props: SceneProps) {
  const s = embryo(0.6, 485, 336, 150, 160);
  return (
    <g>
      <Stage1Drawing {...props} />
      {L('biloxka-primarioa', 190, 150, VILLI[16].tip)}
      {L('korion-plaka', 190, 200, onRing(R_SYN, 218))}
      {L('korion-barrunbea', 190, 400, [300, 420])}
      {L('enbrioi-kanpoko-mesodermoa', 190, 440, onRing(R_MESO + 5, 150))}
      {L('epiblastoa', 190, 480, s.at.epiblast)}
      {L('bi-orriko-diskoa', 190, 520, s.map(-150, 20))}
      {L('finkapen-pedikulua', 810, 235, onRing(R_MESO - 20, -28))}
      {L('amnios-barrunbea', 810, 270, s.at.amnion)}
      {L('amnioblastoak', 810, 380, s.at.amnionWall.map((v, i) => (i ? v : 2 * s.p.cx - v)) as Pt)}
      {L('hipoblastoa', 810, 420, s.map(120, s.dEnd(120) + 4))}
      {L('bitelo-zaku-sekundarioa', 810, 460, s.at.yolk)}
    </g>
  );
}

/** Close-up of the bilaminar disc: columnar epiblast continuous with the amnioblasts, cuboidal hypoblast continuous with the yolk-sac lining. */
export function Stage1Disc(props: SceneProps) {
  void props;
  const s = makeDisc({});
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={s} ids={IDS} />
      {L('amnios-barrunbea', 810, 160, s.at.amnion)}
      {L('amnioblastoak', 190, 170, s.at.amnionWall)}
      {L('epiblastoa', 190, 215, s.at.epiblast)}
      {L('bi-orriko-diskoa', 810, 420, s.map(120, 14))}
      {L('hipoblastoa', 190, 440, s.at.hypo)}
      {L('enbrioi-kanpoko-mesodermoa', 810, 470, s.at.extraMesoYolk)}
      {L('bitelo-zaku-sekundarioa', 810, 510, s.at.yolk)}
    </g>
  );
}
