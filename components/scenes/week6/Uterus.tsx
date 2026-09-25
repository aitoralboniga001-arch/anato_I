'use client';

import { C, Label, Note, Part, seg, lerp, lerpPt, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { FetusFigure, fetusGeom, placeFetus } from '@/components/scenes/week5/FetusFigure';

/**
 * 6:korion-hostotsua:sagitala — apunteetako irudia A → B (img_p05_0): umetokiaren mozketa sagitala.
 * A: korion-zakua umetoki paretaren goiko-eskuineko aldean txertatuta; mutur enbrionarioan korion
 * hostotsua (biloxka trinkoak) dezidua basalaren kontra, mutur anenbrionarioan korion leuna dezidua
 * kapsularrak estalita, umetoki barrunbera bultzatuz. B: zakuak umetoki barrunbea betetzen du;
 * kapsularra endekatu eta korion leuna paretako deziduarekin fusionatzen da; karena diska lodia.
 */

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
const f1 = (v: number) => v.toFixed(1);
const ease = (x: number) => x * x * (3 - 2 * x);

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

/** A villous tree rooted on the chorion at angle a, growing outward `len` px, with two side branches. */
function villus(e: Ell, a: number, len: number, seed: number) {
  const base = onE(e, a, 0);
  const tip = onE(e, a + Math.sin(seed * 3.1) * 3, len);
  const mid = onE(e, a + Math.sin(seed * 1.7) * 4, len * 0.5);
  const b1 = onE(e, a + 5 + Math.sin(seed) * 2, len * 0.78);
  const b2 = onE(e, a - 5 - Math.cos(seed) * 2, len * 0.62);
  const m1 = onE(e, a, len * 0.42);
  const m2 = onE(e, a, len * 0.3);
  return `M${f1(base[0])},${f1(base[1])}Q${f1(mid[0])},${f1(mid[1])} ${f1(tip[0])},${f1(tip[1])}M${f1(m1[0])},${f1(m1[1])}L${f1(b1[0])},${f1(b1[1])}M${f1(m2[0])},${f1(m2[1])}L${f1(b2[0])},${f1(b2[1])}`;
}

const DEC_TONE = '#d59ab4'; // paretako dezidua
const BASAL_TONE = '#e48aac'; // dezidua basala (trinkoa)
const CAPS_TONE = '#c8a2ba'; // dezidua kapsularra
const VILLUS = '#7d1838';
const PLATE = '#5a1026';

export function UterusSagittal({ t }: SceneProps) {
  const k = ease(seg(t, 0.42, 0.92)); // A → B growth
  const outer = OUTER_A.map((p, i) => lerpPt(p, OUTER_B[i], k));
  const dec = DEC_A.map((p, i) => lerpPt(p, DEC_B[i], k));
  const outerD = smoothPath(outer, true, 0.5);
  const decD = smoothPath(dec, true, 0.5);

  // Chorionic sac: embedded upper-right in A, filling the cavity in B (placenta upper-right).
  const sac: Ell = { cx: lerp(546, 488, k), cy: lerp(218, 290, k), rx: lerp(52, 138, k), ry: lerp(52, 152, k) };
  const wallMid = lerp(-55, -70, k); // centre of the embryonic pole (towards the wall)
  const w0 = wallMid - lerp(92, 100, k);
  const w1 = wallMid + lerp(92, 88, k);

  const villLen = lerp(15, 34, k) + 4 * seg(t, 0.56, 0.7);
  const basal = lerp(12, 26, k);
  const leunaVilli = 1 - seg(t, 0.14, 0.4); // abembryonic villi degenerate
  const caps = lerp(11, 2, seg(t, 0.62, 0.84));
  const capsShow = 1 - seg(t, 0.72, 0.86);
  const cavityShow = 1 - seg(t, 0.66, 0.84);

  // Amnion + embryo/fetus
  const amFill = ease(seg(t, 0.5, 0.96));
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
  const cordTop = onE(sac, wallMid + 42, -1);
  const cordMid: Pt = [Math.max(cordRoot[0], cordTop[0]) + am.rx * 0.12, (cordRoot[1] + cordTop[1]) / 2 + am.ry * 0.12];

  const yolkShow = 1 - seg(t, 0.56, 0.74);
  const yolk = onE(sac, 118, -sac.rx * 0.2);
  const yolkR = lerp(8, 4, seg(t, 0.3, 0.7));
  const membraneShow = vis(t, 0.86, 2);

  // villi: dense on the embryonic pole, sparse/regressing elsewhere
  const villi: { d: string; w: number; o: number }[] = [];
  const nW = Math.round(lerp(14, 30, k));
  for (let i = 0; i <= nW; i++) {
    const a = w0 + ((w1 - w0) * i) / nW;
    const edge = Math.min(1, (i + 0.5) / 2.5, (nW - i + 0.5) / 2.5);
    villi.push({ d: villus(sac, a, villLen * (0.7 + 0.3 * edge) * (0.92 + 0.08 * Math.sin(i * 2.3 + t * 12)), i), w: lerp(2, 3.4, k), o: 1 });
  }
  if (leunaVilli > 0.02) {
    for (let i = 1; i < 12; i++) {
      const a = w1 + ((360 - (w1 - w0)) * i) / 12;
      villi.push({ d: villus(sac, a, 11 * leunaVilli, i + 40), w: 1.6, o: leunaVilli });
    }
  }

  const wallA = (a: number, d: number) => onE(sac, a, d);

  return (
    <g>
      <defs>
        <clipPath id="w6ut-dec">
          <path d={decD} />
        </clipPath>
      </defs>

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
          <path d={band(sac, 0, villLen + 1, w0, w1, 0.1)} fill="#8e2036" opacity={0.85} />
          {villi.map((v, i) => (
            <path key={i} d={v.d} stroke={VILLUS} strokeWidth={v.w} fill="none" strokeLinecap="round" opacity={v.o} />
          ))}
          {villi.slice(0, nW + 1).map((v, i) => (
            <path key={`h${i}`} d={v.d} stroke="#f39bbb" strokeWidth={v.w * 0.35} fill="none" strokeLinecap="round" opacity={0.6} />
          ))}
        </Part>
        {/* Korion leuna: smooth chorion on the abembryonic side */}
        <Part id="korion-leuna">
          <path d={band(sac, -2, 1.5, w1, w0 + 360)} fill="#b04a70" />
        </Part>
        {/* Chorionic plate */}
        <path d={band(sac, -3, 1, w0, w1)} fill={PLATE} />

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
        <Part id="zilborrestea">
          <path
            d={`M${f1(cordRoot[0])},${f1(cordRoot[1])} Q${f1(cordMid[0])},${f1(cordMid[1])} ${f1(cordTop[0])},${f1(cordTop[1])}`}
            fill="none" stroke="#e7b9c9" strokeWidth={lerp(3, 8, k)} strokeLinecap="round"
          />
          <path
            d={`M${f1(cordRoot[0])},${f1(cordRoot[1])} Q${f1(cordMid[0])},${f1(cordMid[1])} ${f1(cordTop[0])},${f1(cordTop[1])}`}
            fill="none" stroke="#c0415f" strokeWidth={lerp(0.8, 1.6, k)} strokeDasharray="5 6" opacity={0.7}
          />
        </Part>
        <g transform={`${place.transform}`}>
          <g transform={`translate(-2 50) scale(${f1(1 + breathe)}) translate(2 -50)`}>
            <FetusFigure id="w6ut" week={week} s={place.s} />
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

      {/* Labels — right gutter (as in figure A) */}
      <Label id="mutur-enbrionarioa" x={770} y={110} ax={wallA(wallMid, villLen + basal)[0]} ay={wallA(wallMid, villLen + basal)[1]} show={vis(t, 0.12, 0.4)} small />
      <Label id="dezidua-basala" x={770} y={155} ax={wallA(wallMid + 30, villLen + basal * 0.6)[0]} ay={wallA(wallMid + 30, villLen + basal * 0.6)[1]} show={vis(t, 0.4)} />
      <Label id="korion-hostotsua" x={770} y={200} ax={wallA(wallMid + 60, villLen * 0.55)[0]} ay={wallA(wallMid + 60, villLen * 0.55)[1]} show={vis(t, 0.12)} />
      <Label id="karena" x={770} y={245} ax={wallA(wallMid + 78, villLen * 0.7)[0]} ay={wallA(wallMid + 78, villLen * 0.7)[1]} show={vis(t, 0.56)} />
      <Label id="amnios-barrunbea" x={770} y={375} ax={am.cx + am.rx * 0.45} ay={am.cy + am.ry * 0.72} show={vis(t, 0.1)} />
      <Label id="zilborrestea" x={770} y={420} ax={cordMid[0] - (cordMid[0] - cordTop[0]) * 0.1} ay={(cordMid[1] + cordTop[1]) / 2} show={vis(t, 0.3)} />
      <Label id="bitelo-zaku-sekundarioa" x={770} y={465} ax={yolk[0]} ay={yolk[1]} show={Math.min(yolkShow, vis(t, 0.05))} small />
      <Label id="umetoki-barrunbea" x={770} y={510} ax={500} ay={lerp(390, 440, k)} show={Math.min(cavityShow, vis(t, 0))} />

      {/* Labels — left gutter */}
      <Label id="paretako-dezidua" x={240} y={150} ax={dec[15][0] + 9} ay={dec[15][1]} show={vis(t, 0.4)} align="end" />
      <Label id="korion-barrunbea" x={240} y={210} ax={onE(sac, 200, -sac.rx * 0.1)[0]} ay={onE(sac, 200, -sac.rx * 0.1)[1]} show={vis(t, 0, 0.92)} align="end" />
      <Label id="dezidua-kapsularra" x={240} y={270} ax={wallA(125, caps * 0.6)[0]} ay={wallA(125, caps * 0.6)[1]} show={Math.min(capsShow, vis(t, 0.4))} align="end" />
      <Label id="korion-leuna" x={240} y={330} ax={wallA(165, 0)[0]} ay={wallA(165, 0)[1]} show={vis(t, 0.26, 0.86)} align="end" />
      <Label id="mutur-anenbrionarioa" x={240} y={390} ax={wallA(wallMid + 180, caps + 2)[0]} ay={wallA(wallMid + 180, caps + 2)[1]} show={vis(t, 0.26, 0.4)} align="end" small />
      <Label id="amniosa" x={240} y={390} ax={onE(am, 175)[0]} ay={onE(am, 175)[1]} show={vis(t, 0.5, 0.86)} align="end" />
      <Label id="mintz-amniokorionikoa" x={240} y={450} ax={wallA(150, -1)[0]} ay={wallA(150, -1)[1]} show={membraneShow} align="end" />

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
