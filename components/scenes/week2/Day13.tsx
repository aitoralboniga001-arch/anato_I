'use client';

import { C, Label, Note, Part, lerp, seg, zoom, type Pt, type SceneProps } from '@/components/kit';
import { CYTO, HYPO_BOTTOM, INNER, TrapBand, W2, discGeometry, f1, lensPath } from './common';
import { EndometriumBack, EndometriumFront } from './Day11_12';

/**
 * 13. eguna — gainazaleko epitelioa sendatuta, biloxka primarioak, korion plaka, bitelo zaku
 * sekundarioa, kiste exozelomikoak eta finkapen pedikulua.
 * Windows (shared by every view and the stage beats in content/weeks/week2.ts):
 *   .00-.10 epitelioa erabat itxita (fibrina desagertuta) · .06-.30 biloxka primarioak agertzen dira
 *   .14-.50 korion barrunbea handitzen jarraitzen du → korion plaka nabarmentzen da (.34-.50)
 *   .48-.68 hipoblastoak Heuser-en mintzaren barrualdea estaltzen du → bitelo zaku sekundarioa
 *   .60-.76 hasierako bitelo zakuaren zatiak kiste exozelomiko gisa geratzen dira
 *   .72-.84 finkapen pedikulua nabarmentzen da · .84-.98 korioia (zito+sinzitio+mesodermo somatikoa)
 */
export const W = {
  heal: [0, 0.1],
  villi: [0.08, 0.22],
  cavityGrow: [0.14, 0.5],
  plaka: [0.34, 0.5],
  secondary: [0.48, 0.68],
  cysts: [0.6, 0.76],
  stalk: [0.72, 0.84],
  chorion: [0.84, 0.98],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);
const rad = (deg: number) => (deg * Math.PI) / 180;
const norm = (a: number) => (a < 90 ? a + 360 : a);

const RC0 = 150;
const RC_MAX = 165;
const EDGE_H = (Math.asin(-HYPO_BOTTOM / INNER) * 180) / Math.PI;
const AMNION_L = 180 + EDGE_H;
const AMNION_R = 360 - EDGE_H;
const CYST = '#f2c14e';
/** Opaque dark fill for the chorionic cavity (a space: nothing of the stroma may show through). */
const CAVITY = '#232a3d';

function fingers(a: number) {
  return 1 + 0.22 * Math.sin((a * Math.PI) / 11) + 0.12 * Math.sin((a * Math.PI) / 5.3);
}
/** Syncytiotrophoblast thickness, ruffled by the primary villi as they push out. */
function synTh(a: number, villi: number) {
  const p = Math.pow((1 - Math.sin(rad(a))) / 2, 0.9);
  const base = (7 + 63 * p) * (1 + (fingers(a) - 1) * p);
  const ripple = villi * 11 * (0.5 + 0.5 * Math.sin((a * Math.PI) / 10));
  return base + ripple;
}

function geometry(t: number) {
  const grow = seg(t, W.cavityGrow[0], W.cavityGrow[1]);
  const Rc = lerp(RC0, RC_MAX, grow);
  const cy = W2.surfaceY - 14 - Rc;
  const core = discGeometry(W2.cx, cy);
  const villi = s(t, W.villi);
  return { ...core, Rc, villi };
}
type Geo = ReturnType<typeof geometry>;

const polar = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];
const synAt = (g: Geo, a: number, frac: number): Pt => polar(g, a, g.Rc + frac * synTh(norm(a), g.villi));

function syncytioPath(g: Geo) {
  const pts: Pt[] = [];
  for (let i = 0; i < 144; i++) {
    const a = 90 + i * 2.5;
    pts.push(polar(g, a, g.Rc + synTh(a, g.villi)));
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f1(x)},${f1(y)}`).join(' ') + 'Z';
  return `${d}M${f1(g.cx + g.Rc)},${f1(g.cy)} A${g.Rc} ${g.Rc} 0 1 0 ${f1(g.cx - g.Rc)},${f1(g.cy)} A${g.Rc} ${g.Rc} 0 1 0 ${f1(g.cx + g.Rc)},${f1(g.cy)}Z`;
}

/** 18 villus cores, evenly spaced (ripple peaks of synTh). */
const VILLI_A = Array.from({ length: 18 }, (_, i) => 5 + i * 20);

function ring(g: Geo, r0: number, r1: number, a0: number, a1: number) {
  const p0 = polar(g, a0, r1);
  const p1 = polar(g, a1, r1);
  const p2 = polar(g, a1, r0);
  const p3 = polar(g, a0, r0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${f1(p0[0])},${f1(p0[1])} A${r1} ${r1} 0 ${large} 1 ${f1(p1[0])},${f1(p1[1])} L${f1(p2[0])},${f1(p2[1])} A${r0} ${r0} 0 ${large} 0 ${f1(p3[0])},${f1(p3[1])}Z`;
}
/** Edge angle where a circle of radius r (centred on the blastocyst) meets the hypoblast line. */
const edgeAt = (r: number) => (Math.asin(Math.min(1, -HYPO_BOTTOM / r)) * 180) / Math.PI;

const CYST_A = [24, 72, 168, 328, 352];

function Day13Drawing({ t }: SceneProps) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo, Rc, villi } = g;
  const plaka = s(t, W.plaka);
  const secondary = s(t, W.secondary);
  const cysts = s(t, W.cysts);
  const chorion = s(t, W.chorion);
  const lens = lensPath(g);

  const bandTh = 5;
  const innerOuter = INNER + bandTh;
  const outerInner = Rc - CYTO - bandTh;
  const stalkA0 = 251;
  const stalkA1 = 269;

  const rYPrim = INNER - 4.5;
  const rYSec = lerp(rYPrim, 60, secondary);
  const wY = (rY: number) => Math.sqrt(Math.max(1, rY * rY - HYPO_BOTTOM * HYPO_BOTTOM));
  const wYPrim = wY(rYPrim);
  const wYSec = wY(rYSec);
  const yolkPath = (rY: number, w: number) => `M${f1(cx - w)},${f1(hypoBottom)} A${rY} ${rY} 0 1 0 ${f1(cx + w)},${f1(hypoBottom)} Z`;

  // Splanchnopleure hugs the yolk sac as it shrinks; the chorionic cavity takes the freed space.
  const rY = lerp(rYPrim, rYSec, secondary);
  const eY = edgeAt(rY + 5);
  const wUp = Math.sqrt(Math.max(1, INNER * INNER - HYPO_BOTTOM * HYPO_BOTTOM));
  const cavOut = outerInner;

  return (
    <g>
      {/* Chorionic cavity: one space around amnion + yolk sac, interrupted only by the connecting stalk. */}
      <Part id="korion-barrunbea">
        <path d={ring(g, 0.5, cavOut, stalkA1, stalkA0 + 360)} fill={CAVITY} stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
      </Part>
      {/* Above the disc: the amniotic side (cap of the old blastocyst interior). */}
      <path d={`M${f1(cx - wUp)},${f1(hypoBottom)} A${INNER} ${INNER} 0 0 1 ${f1(cx + wUp)},${f1(hypoBottom)} Z`} fill="#1b2437" pointerEvents="none" />

      <Part id="hasierako-bitelo-zakua" show={1 - secondary}>
        <path d={yolkPath(rYPrim, wYPrim)} fill={CAVITY} />
        <path d={yolkPath(rYPrim, wYPrim)} fill={C.yolkCavity} />
        <path d={yolkPath(rYPrim, wYPrim)} fill="url(#g-cavity)" />
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={secondary}>
        <path d={yolkPath(rYSec, wYSec)} fill={CAVITY} />
        <path d={yolkPath(rYSec, wYSec)} fill={C.yolkCavity} />
        <path d={yolkPath(rYSec, wYSec)} fill="rgba(242,193,78,0.2)" />
        <path d={yolkPath(rYSec, wYSec)} fill="url(#g-cavity)" />
      </Part>
      <Part id="kiste-exozelomikoak" show={cysts}>
        {CYST_A.map((a, i) => {
          const r = lerp(rYSec, rYPrim, 0.5 + 0.15 * Math.sin(i * 2.1));
          const [x, y] = polar(g, a, r);
          return <ellipse key={i} cx={f1(x)} cy={f1(y)} rx={7} ry={5.4} fill={CYST} opacity={0.55} stroke="#c99a2e" strokeWidth={0.8} />;
        })}
      </Part>

      <Part id="korion-plaka">
        <path d={ring(g, outerInner, Rc - CYTO, stalkA1, stalkA0 + 360)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} opacity={lerp(0.55, 1, plaka)} />
      </Part>
      <Part id="somatopleura-kanpokoa">
        <path d={ring(g, INNER, innerOuter, AMNION_L, AMNION_R)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
      </Part>
      <Part id="esplaknopleura-kanpokoa">
        <path d={ring(g, rY, rY + 5, 360 - eY, 540 + eY)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
      </Part>
      <Part id="finkapen-pedikulua">
        <path d={ring(g, INNER, Rc - CYTO, stalkA0, stalkA1)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1.2} />
      </Part>

      <Part id="sinzitiotrofoblastoa">
        <path d={syncytioPath(g)} fill="url(#p-syncytio)" fillRule="evenodd" stroke={C.syncytioDeep} strokeWidth={1.2} />
      </Part>
      {/* The lacunar network from days 11–12 keeps its maternal blood: villi grow out between its spaces. */}
      <Part id="sare-lakunarra">
        {VILLI_A.map((v, i) => {
          const a = v + 10;
          const th = synTh(norm(a), villi);
          if (th < 16) return null;
          const [x, y] = polar(g, a, Rc + th * 0.5);
          return <ellipse key={i} cx={f1(x)} cy={f1(y)} rx={f1(Math.min(9, th * 0.16))} ry={f1(Math.min(15, th * 0.3))} transform={`rotate(${f1(a)} ${f1(x)} ${f1(y)})`} fill="#b3303f" stroke="#7d1d2b" strokeWidth={0.8} opacity={0.85} />;
        })}
      </Part>
      <Part id="biloxka-primarioa" show={villi}>
        {/* Cytotrophoblast fingers growing out of the cyto ring into the syncytium (villus cores). */}
        {VILLI_A.map((a, i) => {
          const th = synTh(a, villi);
          const len = th * 0.72 * villi;
          if (len < 2) return null;
          const u: Pt = [Math.cos(rad(a)), Math.sin(rad(a))];
          const n: Pt = [-u[1], u[0]];
          const w = Math.min(7, 3 + th * 0.06);
          const at = (r: number, side: number, k = 1): Pt => [cx + u[0] * r + n[0] * w * side * k, cy + u[1] * r + n[1] * w * side * k];
          const r0 = Rc - 3;
          const r1 = Rc + len;
          const b1 = at(r0, -1);
          const t1 = at(r1, -1, 0.75);
          const t2 = at(r1, 1, 0.75);
          const b2 = at(r0, 1);
          const tip = at(r1 + w * 1.3, 0);
          const nuc = at(Rc + len * 0.55, 0);
          return (
            <g key={i}>
              <path d={`M${f1(b1[0])},${f1(b1[1])} L${f1(t1[0])},${f1(t1[1])} Q${f1(tip[0])},${f1(tip[1])} ${f1(t2[0])},${f1(t2[1])} L${f1(b2[0])},${f1(b2[1])}Z`} fill={C.cyto} stroke="#4a9d63" strokeWidth={0.8} />
              {len > 14 && <circle cx={f1(nuc[0])} cy={f1(nuc[1])} r={1.8} fill="#2f7a4a" />}
            </g>
          );
        })}
      </Part>

      <Part id="zitotrofoblastoa">
        <path
          d={`M${f1(cx + Rc)},${f1(cy)} A${Rc} ${Rc} 0 1 1 ${f1(cx - Rc)},${f1(cy)} A${Rc} ${Rc} 0 1 1 ${f1(cx + Rc)},${f1(cy)} M${f1(cx + Rc - CYTO)},${f1(cy)} A${Rc - CYTO} ${Rc - CYTO} 0 1 0 ${f1(cx - (Rc - CYTO))},${f1(cy)} A${Rc - CYTO} ${Rc - CYTO} 0 1 0 ${f1(cx + Rc - CYTO)},${f1(cy)}`}
          fill={C.cyto}
          fillRule="evenodd"
          stroke="#4a9d63"
          strokeWidth={1}
        />
      </Part>

      <Part id="korioia" show={chorion}>
        <path
          d={`M${f1(cx + Rc + 6)},${f1(cy)} A${Rc + 6} ${Rc + 6} 0 1 1 ${f1(cx - Rc - 6)},${f1(cy)} A${Rc + 6} ${Rc + 6} 0 1 1 ${f1(cx + Rc + 6)},${f1(cy)}`}
          fill="none"
          stroke="#e8eefc"
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.7}
        />
      </Part>

      <Part id="amnios-barrunbea">
        <path d={lens} fill="#6d9be6" opacity={0.42} />
        <path d={lens} fill="url(#g-cavity)" />
      </Part>
      <Part id="epiblastoa">
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
      </Part>
    </g>
  );
}

type At = (x: number, y: number) => [number, number];
function makeL(at: At) {
  return function label(id: string, x: number, y: number, p: Pt, show = 1, key = id) {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={ax} ay={ay} show={show} />;
  };
}

function anchors(t: number) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY } = g;
  const secondary = s(t, W.secondary);
  return {
    g,
    villi: g.villi,
    plaka: s(t, W.plaka),
    secondary,
    cysts: s(t, W.cysts),
    chorion: s(t, W.chorion),
    cyto: (a: number) => polar(g, a, g.Rc - CYTO / 2),
    syn: (a: number) => synAt(g, a, 0.5),
    villus: (i: number) => synAt(g, VILLI_A[i], 0.4),
    meso: (a: number, r: number) => polar(g, a, r),
    amnios: [cx - 22, (cy - INNER + epiTop) / 2 + 2] as Pt,
    epi: [cx + 38, (epiTop + discY) / 2] as Pt,
    yolk: [cx - 12, hypoBottomOf(g)] as Pt,
    stalk: polar(g, 260, (INNER + g.Rc - CYTO) / 2),
  };
}
function hypoBottomOf(g: Geo) {
  return g.hypoBottom + 40;
}

export function Day13Section(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const L = makeL((x, y) => [x, y]);
  return (
    <g>
      <EndometriumBack decidua={0.85} />
      <Day13Drawing {...props} />
      <EndometriumFront gap={0} />
      {L('endometrio-estroma', 190, 50, [300, 60])}
      {L('umetoki-guruina', 190, 100, [266, 250])}
      {L('endometrio-epitelioa', 190, 150, [300, W2.surfaceY - 8])}
      {L('sinzitiotrofoblastoa', 190, 380, k.syn(150))}
      {L('biloxka-primarioa', 190, 430, k.villus(11), k.villi)}
      {L('zitotrofoblastoa', 190, 475, k.cyto(140))}
      {L('finkapen-pedikulua', 190, 520, k.stalk)}
      {L('korion-plaka', 190, 565, k.meso(300, (k.g.Rc - CYTO + INNER) / 2), k.plaka)}
      {L('mutur-enbrionarioa', 810, 250, k.cyto(276))}
      {L('korion-barrunbea', 810, 380, k.meso(220, (INNER + k.g.Rc - CYTO) / 2))}
      {L('amnios-barrunbea', 810, 430, k.amnios)}
      {L('epiblastoa', 810, 475, k.epi)}
      {L('bitelo-zaku-sekundarioa', 810, 520, k.yolk, k.secondary)}
      {L('kiste-exozelomikoak', 810, 565, k.meso(72, (INNER + k.g.Rc - CYTO) / 2), k.cysts)}
      {L('korioia', 810, 598, k.meso(340, k.g.Rc + 6), k.chorion)}
      <Note x={500} y={585} tone="dim" show={1}>
        Blastozistoa guztiz sartuta dago; umetokiaren paretan goragunea antzematen da
      </Note>
    </g>
  );
}

export function Day13Villi(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const c = polar(k.g, 292, k.g.Rc + 30);
  const z = zoom(c[0], c[1], 2.3, 500, 320);
  const L = makeL(z.at);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <Day13Drawing {...props} />
      </g>
      {L('zitotrofoblastoa', 180, 130, k.cyto(262))}
      {L('biloxka-primarioa', 180, 200, synAt(k.g, VILLI_A[14], 0.4), k.villi)}
      {L('sinzitiotrofoblastoa', 180, 270, k.syn(276))}
      {L('korion-plaka', 800, 400, k.meso(300, k.g.Rc - CYTO - 3), k.plaka)}
      {L('korion-barrunbea', 800, 460, k.meso(305, (INNER + k.g.Rc - CYTO) / 2))}
      <Note x={500} y={585} tone="accent" show={k.villi}>
        Zitotrofoblastoaren zelulak sinzitiotrofoblastoaren erdian sartzen dira: biloxka primarioen biloak
      </Note>
    </g>
  );
}

export function Day13Yolk(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  const z = zoom(cx - 10, cy + 60, 2.1, 500, 320);
  const L = makeL(z.at);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <Day13Drawing {...props} />
      </g>
      {L('hasierako-bitelo-zakua', 180, 150, [cx - 20, k.g.hypoBottom + 30], 1 - k.secondary)}
      {L('bitelo-zaku-sekundarioa', 180, 200, k.yolk, k.secondary)}
      {L('kiste-exozelomikoak', 180, 260, k.meso(70, (INNER + k.g.Rc - CYTO) / 2), k.cysts)}
      {L('hipoblastoa', 180, 400, [cx + 40, k.g.hypoBottom - 10])}
      {L('finkapen-pedikulua', 800, 150, k.stalk)}
      {L('korion-barrunbea', 800, 200, k.meso(310, (INNER + k.g.Rc - CYTO) / 2))}
      <Note x={500} y={585} tone="accent" show={k.secondary}>
        Hasierako bitelo zakua txikituz doa: bitelo zaku sekundarioa (behin betikoa) sortzen da
      </Note>
    </g>
  );
}
