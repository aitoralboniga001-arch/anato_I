'use client';

import { C, Label, Mark, Note, Part, bezier, seg, lerp, lerpPt, smoothPath, tube, zoom, type Pt, type SceneProps } from '@/components/kit';
import { K } from '@/components/scenes/week3-villi/art';
import { FetusFigure, fetusGeom, placeFetus } from '@/components/scenes/week5/FetusFigure';
import { CordRope } from './CordRope';

/**
 * 6:korion-hostotsua:sagitala — apunteetako irudia A → B (img_p05_0): umetokiaren mozketa sagitala.
 * A: korion-zakua umetoki paretaren goiko-eskuineko aldean txertatuta; mutur enbrionarioan korion
 * hostotsua (biloxka trinkoak) dezidua basalaren kontra, mutur anenbrionarioan korion leuna dezidua
 * kapsularrak estalita, umetoki barrunbera bultzatuz. B: zakuak umetoki barrunbea betetzen du;
 * kapsularra endekatu eta korion leuna paretako deziduarekin fusionatzen da; karena diska lodia.
 */

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
const f1 = (v: number) => v.toFixed(1);

// Uterine wall (serosa outline), A and B share point count so they can be morphed.
const OUTER_A: Pt[] = [
  [500, 72], [596, 90], [660, 160], [676, 262], [652, 350], [598, 420], [560, 468], [548, 530], [542, 585],
  [458, 585], [452, 530], [440, 468], [402, 420], [348, 350], [324, 262], [340, 160], [404, 90],
];
const OUTER_B: Pt[] = [
  [500, 38], [628, 60], [704, 150], [722, 272], [694, 384], [622, 452], [570, 492], [554, 540], [546, 585],
  [454, 585], [446, 540], [430, 492], [378, 452], [306, 384], [278, 272], [296, 150], [372, 60],
];
// Inner surface of the myometrium (the decidua lines it), with the cervical canal below.
const DEC_A: Pt[] = [
  [500, 126], [574, 140], [616, 196], [624, 266], [598, 336], [558, 392], [518, 440], [507, 520], [504, 585],
  [496, 585], [493, 520], [482, 440], [442, 392], [402, 336], [376, 266], [384, 196], [426, 140],
];
const DEC_B: Pt[] = [
  [500, 86], [600, 100], [660, 170], [672, 270], [646, 364], [586, 424], [532, 466], [510, 530], [505, 585],
  [495, 585], [490, 530], [468, 466], [414, 424], [354, 364], [328, 270], [340, 170], [400, 100],
];

type Ell = { cx: number; cy: number; rx: number; ry: number };
const onE = (e: Ell, a: number, d = 0): Pt => {
  const r = (a * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  // outward normal of the ellipse at this angle
  const nx = c / e.rx;
  const ny = s / e.ry;
  const n = Math.hypot(nx, ny);
  return [e.cx + e.rx * c + (d * nx) / n, e.cy + e.ry * s + (d * ny) / n];
};
/** Band between offsets d0 and d1 outside the ellipse, over angles a0..a1 (degrees, 0 = right, 90 = down). */
function band(e: Ell, d0: number, d1: number, a0: number, a1: number, taper = 0, steps = 48) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const k = taper ? Math.sqrt(Math.min(1, u / taper, (1 - u) / taper)) : 1;
    const p = onE(e, a0 + (a1 - a0) * u, lerp(d0, d1, k));
    d += `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`;
  }
  for (let i = steps; i >= 0; i--) {
    const p = onE(e, a0 + ((a1 - a0) * i) / steps, d0);
    d += `L${f1(p[0])},${f1(p[1])}`;
  }
  return d + 'Z';
}
const ellPath = (e: Ell) =>
  `M${f1(e.cx - e.rx)},${f1(e.cy)}a${f1(e.rx)},${f1(e.ry)} 0 1 0 ${f1(2 * e.rx)},0a${f1(e.rx)},${f1(e.ry)} 0 1 0 ${f1(-2 * e.rx)},0Z`;

/**
 * A villous tree rooted on the chorion at angle a, growing outward `len` px, with two side branches —
 * drawn in the villus tissue of weeks 3–6: syncytial rim, mesoderm core, a capillary inside.
 */
function villus(e: Ell, a: number, len: number, seed: number, hw: number) {
  const base = onE(e, a, -1);
  const tip = onE(e, a + Math.sin(seed * 3.1) * 3, len);
  const mid = onE(e, a + Math.sin(seed * 1.7) * 4, len * 0.5);
  const trunk = bezier(tip, [lerp(tip[0], mid[0], 0.6), lerp(tip[1], mid[1], 0.6)], [lerp(mid[0], base[0], 0.4), lerp(mid[1], base[1], 0.4)], base);
  const twig = (u: number, da: number, l: number) => {
    const q = trunk(u);
    const end = onE(e, a + da, l);
    return bezier(end, [lerp(end[0], q.x, 0.4), lerp(end[1], q.y, 0.4)], [lerp(end[0], q.x, 0.75), lerp(end[1], q.y, 0.75)], [q.x, q.y]);
  };
  const parts = [
    { c: trunk, w: (u: number) => hw * (0.78 + 0.22 * u) + hw * 0.6 * Math.max(0, (u - 0.85) / 0.15) ** 2 },
    { c: twig(0.32, 5 + Math.sin(seed) * 2, len * 0.8), w: (u: number) => hw * (0.62 + 0.18 * u) },
    { c: twig(0.55, -5 - Math.cos(seed) * 2, len * 0.6), w: (u: number) => hw * (0.62 + 0.18 * u) },
  ];
  let syn = '';
  let meso = '';
  let cap = '';
  for (const q of parts) {
    syn += tube(q.c, q.w, 0, 1, 12, true).d;
    meso += tube(q.c, (u) => Math.max(0.3, q.w(u) - Math.max(0.7, hw * 0.34)), 0, 1, 12, true).d;
    const pts: Pt[] = Array.from({ length: 9 }, (_, i) => {
      const s = q.c(0.08 + (0.92 * i) / 8);
      return [s.x, s.y];
    });
    cap += 'M' + pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L');
  }
  return { syn, meso, cap };
}

const DEC_TONE = '#d59ab4'; // paretako dezidua
const BASAL_TONE = '#e48aac'; // dezidua basala (trinkoa)
const CAPS_TONE = '#c8a2ba'; // dezidua kapsularra

interface StackItem {
  id: string;
  /** Anchor on screen. */
  a: [number, number];
  show: number;
  small?: boolean;
}

/** Rough label width (SVG units) at the largest label size (1.3×); ids spell the names closely enough. */
const labelW = (name: string, small?: boolean) => name.length * (small ? 6.4 : 7.1) * 1.3;

/**
 * One gutter's labels, stacked in the vertical order of their anchors: each sits as close as it can to
 * its anchor's height, pushed apart by at least `GAP` (scaled by its visibility, so a label fading in
 * makes room smoothly). Long names on the right stay below the toolbar.
 */
function stackLabels(items: StackItem[], x: number, align: 'start' | 'end') {
  const GAP = 31;
  const top = 46;
  const bottom = 588;
  const order = items.map((_, i) => i).sort((p, q) => items[p].a[1] - items[q].a[1]);
  const h = items.map((it) => GAP * Math.min(1, Math.max(0, it.show)));
  const minY = items.map((it) => (align === 'start' && x + labelW(it.id, it.small) > 925 ? 240 : top));
  const y = items.map((it) => it.a[1]);
  for (let pass = 0; pass < 3; pass++) {
    order.forEach((i, k) => {
      const prev = k ? order[k - 1] : -1;
      y[i] = Math.max(y[i], minY[i], prev >= 0 ? y[prev] + (h[prev] + h[i]) / 2 : top);
    });
    for (let k = order.length - 1; k >= 0; k--) {
      const i = order[k];
      const next = k < order.length - 1 ? order[k + 1] : -1;
      y[i] = Math.min(y[i], bottom, next >= 0 ? y[next] - (h[next] + h[i]) / 2 : bottom);
    }
  }
  return items.map((it, i) => (
    <Label key={it.id} id={it.id} x={x} y={y[i]} ax={it.a[0]} ay={it.a[1]} show={it.show} align={align} small={it.small} />
  ));
}

export function UterusSagittal({ t }: SceneProps) {
  // A → B growth happens in its own step (chorionic cavity enlarging); the amnion fills it in the next one.
  const k = seg(t, 0.7, 0.82);
  const outer = OUTER_A.map((p, i) => lerpPt(p, OUTER_B[i], k));
  const dec = DEC_A.map((p, i) => lerpPt(p, DEC_B[i], k));
  const outerD = smoothPath(outer, true, 0.5);
  const decD = smoothPath(dec, true, 0.5);

  // Chorionic sac: embedded upper-right in A, filling the cavity in B (placenta upper-right).
  const sac: Ell = { cx: lerp(538, 488, k), cy: lerp(226, 290, k), rx: lerp(70, 138, k), ry: lerp(70, 152, k) };
  const wallMid = lerp(-55, -70, k); // centre of the embryonic pole (towards the wall)
  const w0 = wallMid - lerp(92, 100, k);
  const w1 = wallMid + lerp(92, 88, k);

  const villLen = lerp(lerp(11, 15, seg(t, 0.12, 0.22)), 34, k) + 4 * seg(t, 0.56, 0.66);
  const basal = lerp(12, 26, k);
  const leunaVilli = 1 - 0.3 * seg(t, 0.12, 0.22) - 0.7 * seg(t, 0.26, 0.36); // abembryonic villi degenerate
  const caps = lerp(11, 2, seg(t, 0.7, 0.8));
  const capsShow = 1 - seg(t, 0.72, 0.82);
  const cavityShow = 1 - seg(t, 0.72, 0.82);

  // Amnion + embryo/fetus
  const amFill = seg(t, 0.86, 0.97);
  const am: Ell = {
    cx: lerp(sac.cx - sac.rx * 0.08, sac.cx, amFill),
    cy: lerp(sac.cy + sac.ry * 0.04, sac.cy, amFill),
    rx: lerp(sac.rx * 0.62, sac.rx - 3, amFill),
    ry: lerp(sac.ry * 0.62, sac.ry - 3, amFill),
  };
  const crl = Math.max(am.ry * lerp(1.18, 1.02, k), 20);
  const week = lerp(9, 13, k);
  const breathe = Math.sin(t * Math.PI * 14) * 0.012;
  const place = placeFetus(crl, 1, am.cx - am.rx * 0.08, am.cy + am.ry * 0.02);
  const g = fetusGeom(week);
  const cordRoot = place.xf(g.cordBase);
  // Ends on the chorionic plate, where the amnion line (drawn over it) hides the cut of its flared end.
  const cordTop = onE(sac, wallMid + 42, -3);
  const cordMid: Pt = [Math.max(cordRoot[0], cordTop[0]) + am.rx * 0.12, (cordRoot[1] + cordTop[1]) / 2 + am.ry * 0.12];

  const yolkShow = 1 - seg(t, 0.7, 0.8);
  const yolk = onE(sac, 118, -sac.rx * 0.2);
  const yolkR = lerp(8, 4, seg(t, 0.3, 0.8));
  const membraneShow = vis(t, 0.86, 2);

  // villi: dense on the embryonic pole, sparse/regressing elsewhere
  const hwV = lerp(2.2, 3.4, k);
  const dense = { syn: '', meso: '', cap: '' };
  const sparse = { syn: '', meso: '', cap: '' };
  const nW = Math.round(lerp(14, 26, k));
  for (let i = 0; i <= nW; i++) {
    const a = w0 + ((w1 - w0) * i) / nW;
    const edge = Math.min(1, (i + 0.5) / 2.5, (nW - i + 0.5) / 2.5);
    const v = villus(sac, a, villLen * (0.7 + 0.3 * edge) * (0.9 + 0.1 * Math.sin(i * 2.3)), i, hwV);
    dense.syn += v.syn;
    dense.meso += v.meso;
    dense.cap += v.cap;
  }
  if (leunaVilli > 0.02) {
    for (let i = 1; i < 12; i++) {
      const a = w1 + ((360 - (w1 - w0)) * i) / 12;
      const v = villus(sac, a, 12 * leunaVilli, i + 40, 1.9 * Math.max(0.5, leunaVilli));
      sparse.syn += v.syn;
      sparse.meso += v.meso;
    }
  }

  const wallA = (a: number, d: number) => onE(sac, a, d);

  // Camera: push in on the small chorionic sac for beats 1–5 (poles, chorion types, deciduae), then pull
  // back out while the sac grows to fill the uterus (beat 6), so the whole organ is in view for B.
  const push = seg(t, 0.01, 0.07) * (1 - k);
  const z = zoom(lerp(500, 538, push), lerp(320, 226, push), lerp(1, 1.5, push), lerp(500, 515, push), lerp(320, 296, push));

  const rightLabels: StackItem[] = [
    { id: 'mutur-enbrionarioa', a: z.at(wallA(wallMid, villLen + basal)[0], wallA(wallMid, villLen + basal)[1]), show: vis(t, 0.12, 0.4), small: true },
    { id: 'dezidua-basala', a: z.at(wallA(wallMid + 30, villLen + basal * 0.6)[0], wallA(wallMid + 30, villLen + basal * 0.6)[1]), show: vis(t, 0.4) },
    { id: 'korion-hostotsua', a: z.at(wallA(wallMid + 34, villLen * 0.55)[0], wallA(wallMid + 34, villLen * 0.55)[1]), show: vis(t, 0.12) },
    { id: 'karena', a: z.at(wallA(wallMid + 78, villLen * 0.7)[0], wallA(wallMid + 78, villLen * 0.7)[1]), show: vis(t, 0.56) },
    { id: 'amnios-barrunbea', a: z.at(am.cx + am.rx * 0.45, am.cy + am.ry * 0.72), show: vis(t, 0.1) },
    { id: 'zilborrestea', a: z.at(cordTop[0] - am.rx * 0.1, cordTop[1] + am.ry * 0.3), show: vis(t, 0.3) },
    { id: 'bitelo-zaku-sekundarioa', a: z.at(yolk[0], yolk[1]), show: Math.min(yolkShow, vis(t, 0.05)), small: true },
    { id: 'umetoki-barrunbea', a: z.at(500, lerp(390, 440, k)), show: Math.min(cavityShow, vis(t, 0)) },
  ];
  const leftLabels: StackItem[] = [
    { id: 'paretako-dezidua', a: z.at(dec[15][0] + 9, dec[15][1]), show: vis(t, 0.4) },
    { id: 'korion-barrunbea', a: z.at(onE(sac, 200, -sac.rx * 0.1)[0], onE(sac, 200, -sac.rx * 0.1)[1]), show: vis(t, 0, 0.95) },
    { id: 'dezidua-kapsularra', a: z.at(wallA(125, caps * 0.6)[0], wallA(125, caps * 0.6)[1]), show: Math.min(capsShow, vis(t, 0.4)) },
    { id: 'biloxka-sekundarioa', a: z.at(wallA(165, villLen * 0.4)[0], wallA(165, villLen * 0.4)[1]), show: vis(t, 0, 0.12) },
    { id: 'korion-leuna', a: z.at(wallA(165, 0)[0], wallA(165, 0)[1]), show: vis(t, 0.26, 0.86) },
    { id: 'mutur-anenbrionarioa', a: z.at(wallA(wallMid + 180, caps + 2)[0], wallA(wallMid + 180, caps + 2)[1]), show: vis(t, 0.26, 0.4), small: true },
    { id: 'amniosa', a: z.at(onE(am, 175)[0], onE(am, 175)[1]), show: vis(t, 0.5, 0.86) },
    { id: 'mintz-amniokorionikoa', a: z.at(wallA(150, -1)[0], wallA(150, -1)[1]), show: membraneShow },
  ];

  return (
    <g>
      <defs>
        <radialGradient id="w6ut-ivs" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff8aa0" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        <clipPath id="w6ut-dec">
          <path d={decD} />
        </clipPath>
      </defs>

      <g transform={z.transform}>
        {/* Myometrium */}
        <path d={outerD} fill="url(#p-muscle)" stroke="rgba(247,223,227,0.45)" strokeWidth={2} />
      {/* Decidua lining, then the (closing) uterine cavity */}
      <Part id="paretako-dezidua" quiet>
        <path d={decD} fill={DEC_TONE} stroke="rgba(60,15,30,0.5)" strokeWidth={1.2} />
      </Part>
      <Part id="umetoki-barrunbea" quiet show={cavityShow}>
        <g clipPath="url(#w6ut-dec)">
          <path d={decD} fill="#1a0c16" />
          <path d={decD} fill="none" stroke={DEC_TONE} strokeWidth={30} />
          <path d={decD} fill="none" stroke="rgba(60,15,30,0.35)" strokeWidth={31} strokeDasharray="1 0" opacity={0} />
        </g>
      </Part>
      <path d="M500,470 L500,585" stroke="#1a0c16" strokeWidth={3} strokeLinecap="round" opacity={0.9} />

      <g clipPath="url(#w6ut-dec)">
        {/* Dezidua kapsularra: covers the abembryonic pole and bulges into the cavity */}
        <Part id="dezidua-kapsularra" show={capsShow}>
          <path d={band(sac, 0, caps + villLen * 0.2, w1, w0 + 360)} fill={CAPS_TONE} stroke="rgba(60,15,30,0.45)" strokeWidth={1} />
        </Part>
        {/* Dezidua basala: dense decidua under the embryonic pole */}
        <Part id="dezidua-basala">
          <path d={band(sac, 0, villLen + basal, w0 - 10, w1 + 10, 0.14)} fill={BASAL_TONE} stroke="rgba(60,15,30,0.45)" strokeWidth={1} />
        </Part>
        {/* Korion hostotsua (+ basala = karena): villi bathing in maternal blood */}
        <Part id="korion-hostotsua">
          {/* maternal blood round the villi (the intervillous space under the basal decidua) */}
          <path d={band(sac, 0, villLen + 1, w0, w1, 0.1)} fill={K.blood} />
          <path d={band(sac, 0, villLen + 1, w0, w1, 0.1)} fill="url(#w6ut-ivs)" />
          <path d={dense.syn} fill={C.syncytio} stroke={K.synEdge} strokeWidth={0.6} />
          <path d={dense.meso} fill={K.meso} />
          <path d={dense.cap} fill="none" stroke="#c2334d" strokeWidth={lerp(0.7, 1.1, k)} strokeLinecap="round" opacity={0.9 * seg(t, 0.08, 0.16)} />
          {/* chorionic plate under the villi: mesoderm, its villous face lined by trophoblast */}
          <path d={band(sac, -3.5, 1, w0, w1)} fill={K.meso} />
          <path d={band(sac, 0, 1.2, w0, w1)} fill={C.syncytio} />
        </Part>
        {/* Korion leuna: smooth chorion on the abembryonic side, its villi regressing */}
        <Part id="korion-leuna">
          <g opacity={leunaVilli}>
            <path d={sparse.syn} fill={C.syncytio} stroke={K.synEdge} strokeWidth={0.5} />
            <path d={sparse.meso} fill={K.meso} />
          </g>
          <path d={band(sac, -2.5, 1.5, w1 - 2, w0 + 362)} fill={K.meso} />
          <path d={band(sac, 0.3, 1.5, w1 - 2, w0 + 362)} fill={C.syncytio} />
        </Part>

        <Part id="korion-barrunbea" quiet>
          <path d={ellPath({ ...sac, rx: sac.rx - 2, ry: sac.ry - 2 })} fill="#241a2a" />
          <path d={ellPath({ ...sac, rx: sac.rx - 2, ry: sac.ry - 2 })} fill={C.chorionCavity} />
        </Part>
        <Part id="bitelo-zaku-sekundarioa" show={yolkShow}>
          <circle cx={yolk[0]} cy={yolk[1]} r={yolkR} fill={C.hypoblast} stroke="rgba(70,50,10,0.6)" strokeWidth={0.8} />
          <path d={`M${f1(yolk[0])},${f1(yolk[1] - yolkR)} L${f1(am.cx - am.rx * 0.2)},${f1(am.cy + am.ry * 0.5)}`} stroke={C.hypoblast} strokeWidth={1.2} opacity={0.7} />
        </Part>
        <Part id="amnios-barrunbea">
          <path d={ellPath(am)} fill="#1d2f4d" />
          <path d={ellPath(am)} fill={C.amnionCavity} />
        </Part>
        <g transform={`${place.transform}`}>
          <g transform={`translate(-2 50) scale(${f1(1 + breathe)}) translate(2 -50)`}>
            <FetusFigure
              id="w6ut"
              week={week}
              s={place.s}
              cord={
                <Part id="zilborrestea">
                  <CordRope pts={[cordRoot, [cordRoot[0] + am.rx * 0.22, cordRoot[1] + am.ry * 0.04], [cordTop[0] - am.rx * 0.1, cordTop[1] + am.ry * 0.3], cordTop].map(place.inv)} w={lerp(3.5, 8, k) / place.s} turns={6} />
                </Part>
              }
            />
          </g>
        </g>
        <Part id="amniosa" quiet>
          <path d={ellPath(am)} fill="none" stroke="#9fc3e6" strokeWidth={1.6} />
        </Part>
        {/* Amnion fused with the chorion leuna on the abembryonic side */}
        <Part id="mintz-amniokorionikoa" show={membraneShow}>
          <path d={band(sac, -4, 2, w1 + 4, w0 + 356)} fill="#cfe3ff" opacity={0.55} />
        </Part>
      </g>

      {/* Poles and the villi's fate, ringed where the notes point */}
      <Mark id="mutur-enbrionarioa" x={wallA(wallMid, villLen + basal)[0]} y={wallA(wallMid, villLen + basal)[1]} rx={22} color="#8fb4f7" show={vis(t, 0.12, 0.4)} />
      <Mark id="mutur-anenbrionarioa" x={wallA(wallMid + 180, caps + 2)[0]} y={wallA(wallMid + 180, caps + 2)[1]} rx={22} color="#7ad9a3" show={vis(t, 0.26, 0.4)} />
      <Mark id="biloxka-sekundarioa" x={wallA(165, villLen * 0.4)[0]} y={wallA(165, villLen * 0.4)[1]} rx={18} show={vis(t, 0, 0.12)} />
      <Mark id="karena" x={wallA(wallMid + 78, villLen * 0.7)[0]} y={wallA(wallMid + 78, villLen * 0.7)[1]} rx={24} color="#ff8a8a" show={vis(t, 0.56)} />
      </g>

      {/* Labels: each gutter's stack is ordered by its anchors' heights (no leader crosses another). */}
      {stackLabels(rightLabels, 810, 'start')}
      {stackLabels(leftLabels, 190, 'end')}

      <Note x={500} y={618} show={vis(t, 0, 0.12)}>Biloxkak blastozisto osoan zehar</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.12, 0.26)}>Mutur enbrionarioan biloxka trinkoak: korion hostotsua</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.26, 0.4)}>Mutur anenbrionarioan biloxkak endekatzen dira: korion leuna</Note>
      <Note x={500} y={618} show={vis(t, 0.4, 0.56)}>Dezidua basala, kapsularra eta paretakoa</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.56, 0.7)}>Korion hostotsua + dezidua basala = karena</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.7, 0.86)}>Kapsularra endekatu → korion leuna paretako deziduarekin fusionatu</Note>
      <Note x={500} y={618} show={vis(t, 0.86)}>Amnios + korion leuna = mintz amniokorionikoa</Note>
    </g>
  );
}
