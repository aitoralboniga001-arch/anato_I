'use client';

import { C, Label, Mark, Note, Part, bezier, lerp, mix, rand, seg, smoothPath, tube, type Curve, type Pt, type SceneProps } from '@/components/kit';
import { useId } from 'react';
import { EarlyEmbryo, earlyGeom } from '@/components/scenes/week5/EarlyEmbryo';

/**
 * Stage `zilbor-hestea` (content/weeks/week6.ts) — reference: notes figure img_p08_0 panels A–D.
 *
 * `CordFormation` (view `sagitala`): a ~5-week embryo, curled, seen from its left side, inside the
 * amnios. From the ventral body wall the "hasierako zilbor eraztuna" opens onto a common trunk that
 * forks: an upper branch (finkapen pedikulua: umbilical vessels + allantois) reaching the chorionic
 * plate, and a lower branch (hodi onfalomesenterikoa: vitelline vessels) reaching the yolk sac inside
 * the chorionic cavity. Over t the amnios wall sweeps out and sleeves the trunk + upper branch into a
 * tube (the primitive cord); the yolk sac / vitelline duct shrink away, the physiological gut loop
 * herniation appears then returns to the abdomen, the allantois and coelomic communication close, and
 * the chorionic cavity disappears (amnios fuses with the chorionic plate) leaving the definitive cord:
 * two arteries + one vein in Wharton's jelly.
 *
 * `CordSections` (view `zeharkakoa`): one cross-section that morphs C → D → the definitive section,
 * with a checklist of the four things that disappear.
 */

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

const bez = (p0: Pt, c1: Pt, c2: Pt, p3: Pt, u: number): Pt => {
  const v = 1 - u;
  return [
    v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1],
  ];
};
const f1 = (v: number) => v.toFixed(1);
const bezD = (p0: Pt, c1: Pt, c2: Pt, p3: Pt) => `M${f1(p0[0])},${f1(p0[1])} C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(p3[0])},${f1(p3[1])}`;

/** Offset a cubic bezier sideways by a constant amount (perpendicular to its chord) — good enough for gentle curves. */
function offsetCurve(p0: Pt, c1: Pt, c2: Pt, p3: Pt, off: number): [Pt, Pt, Pt, Pt] {
  const dx = p3[0] - p0[0];
  const dy = p3[1] - p0[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const o = (p: Pt): Pt => [p[0] + nx * off, p[1] + ny * off];
  return [o(p0), o(c1), o(c2), o(p3)];
}

/* ---------------------------------------------------------------------------------------------- */
/* CordFormation                                                                                     */
/* ---------------------------------------------------------------------------------------------- */

// The whole conceptus at once: the chorionic sac (smooth chorion all round, the villous chorionic
// plate on its upper right), the embryo in its amnios on the left, the connecting stalk running up to
// the plate and the yolk sac hanging in the chorionic cavity. Langman colours: trophoblast green,
// extra-embryonic mesoderm salmon, amnion blue, yolk sac yellow.
const SAC = { cx: 505, cy: 316, rx: 296, ry: 258 };
const rad = (deg: number) => (deg * Math.PI) / 180;
/** A point on the chorionic sac at angle `deg`, `d` units outside its inner (cavity) surface. */
const sacPt = (deg: number, d = 0): Pt => [SAC.cx + (SAC.rx + d) * Math.cos(rad(deg)), SAC.cy + (SAC.ry + d) * Math.sin(rad(deg))];
/** Outward unit normal of the sac at angle `deg`. */
const sacN = (deg: number): Pt => {
  const nx = Math.cos(rad(deg)) / SAC.rx;
  const ny = Math.sin(rad(deg)) / SAC.ry;
  const l = Math.hypot(nx, ny);
  return [nx / l, ny / l];
};
// The chorionic plate (chorion frondosum) spans the upper right of the sac; it thins out at both ends.
const PLATE_A0 = -124;
const PLATE_A1 = -24;
const PLATE_T = 16;
const plateTaper = (deg: number) => Math.max(0, Math.sin((Math.PI * (deg - PLATE_A0)) / (PLATE_A1 - PLATE_A0))) ** 0.45;
const arcPts = (a0: number, a1: number, d: (deg: number) => number, n = 40): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / n);
    return sacPt(a, d(a));
  });
/** A band of the plate between depths d0(a) and d1(a) (outward from the cavity surface). */
const plateBand = (d0: (deg: number) => number, d1: (deg: number) => number) => {
  const outer = arcPts(PLATE_A0, PLATE_A1, d1);
  const inner = arcPts(PLATE_A0, PLATE_A1, d0).reverse();
  return `${smoothPath(outer, false)} L${f1(inner[0][0])},${f1(inner[0][1])} ${smoothPath(inner, false).replace(/^M/, 'L')} Z`;
};
const PLATE_D = plateBand(() => 0, (a) => PLATE_T * plateTaper(a));
const PLATE_MESO_D = plateBand(() => 0, (a) => PLATE_T * 0.42 * plateTaper(a));
/** Villi branching off the plate's outer face, into the decidua side (out of the sac). */
const VILLI = Array.from({ length: 15 }, (_, i) => {
  const a = PLATE_A0 + 7 + i * ((PLATE_A1 - PLATE_A0 - 14) / 14);
  const k = plateTaper(a);
  const base = sacPt(a, PLATE_T * k - 1);
  const [nx, ny] = sacN(a);
  const len = (11 + 7 * rand(i + 3)) * k;
  const tip: Pt = [base[0] + nx * len, base[1] + ny * len];
  const side = i % 2 ? 1 : -1;
  const mid: Pt = [base[0] + nx * len * 0.5, base[1] + ny * len * 0.5];
  const tw: Pt = [mid[0] + (nx * 0.55 - side * ny * 0.8) * len * 0.55, mid[1] + (ny * 0.55 + side * nx * 0.8) * len * 0.55];
  return `M${f1(base[0])},${f1(base[1])} L${f1(tip[0])},${f1(tip[1])} M${f1(mid[0])},${f1(mid[1])} L${f1(tw[0])},${f1(tw[1])}`;
}).join(' ');

// The ~5-week embryo is the traced Langman drawing from topic 5 (EarlyEmbryo, which faces left),
// mirrored so its ventral side faces the cord, with the umbilical ring on the cord root.
const EMB_DAY = 32;
const EMB_S = 0.5;
const EMB = earlyGeom(EMB_DAY);
/** The amnios around the embryo: at first, after it widens (.48), and fused with the chorion (.74–.82). */
const AM0 = { cx: 385, cy: 318, rx: 154, ry: 163 };
const AM1 = { cx: 387, cy: 317, rx: 164, ry: 172 };
const AM2 = { cx: SAC.cx, cy: SAC.cy, rx: SAC.rx - 5, ry: SAC.ry - 5 };
const RING: Pt = [417, 327];
const FORK: Pt = [570, 300];
// The cord meets the plate's cavity face at INS_A: trunk and upper branch share one tangent at the fork.
const INS_A = -58;
const TRUNK: [Pt, Pt, Pt, Pt] = [RING, [470, 312], [530, 314], FORK];
const UP: [Pt, Pt, Pt, Pt] = [FORK, [612, 286], [648, 190], [668, 84]];
/** The whole cord (ring → chorionic plate) as one curve: u 0–.4 = trunk (starting inside the body wall), .4–1 = upper branch. */
const TRUNK_C = bezier(...TRUNK);
const UP_C = bezier(...UP);
const cordC: Curve = (u) => (u < 0.4 ? TRUNK_C(lerp(-0.05, 1, u / 0.4)) : UP_C((u - 0.4) / 0.6));
/** The cord curve shifted sideways by `off` (along its left-hand normal). */
const cordOff =
  (off: number): Curve =>
  (u) => {
    const q = cordC(u);
    return { ...q, x: q.x + q.nx * off, y: q.y + q.ny * off };
  };
const cordAt = (u: number, off = 0): Pt => {
  const q = cordC(u);
  return [q.x + q.nx * off, q.y + q.ny * off];
};
/** Reversed (plate → ring), with the normal flipped to stay the left-hand normal, so `tube` can round the growing front. */
const cordRev: Curve = (u) => {
  const q = cordC(1 - u);
  return { ...q, nx: -q.nx, ny: -q.ny };
};
/** Sleeve half-width: a little slimmer distally, flaring into the plate, bulging where the gut loops lie. */
const GUT_U = 0.22;
const cordW = (u: number, gut: number) => lerp(17, 15, seg(u, 0.3, 0.5)) + 8 * Math.max(0, (u - 0.86) / 0.14) ** 2 + 9 * gut * Math.exp(-(((u - GUT_U) / 0.09) ** 2));
const cordLine = (off: number, u0 = 0, u1 = 1, n = 60) =>
  smoothPath(
    Array.from({ length: n + 1 }, (_, i) => cordAt(lerp(u0, u1, i / n), off)),
    false,
  );
// The yolk sac hangs in the chorionic cavity; when the amnios fills the sac it is pressed against the wall.
const YOLK0: Pt = [676, 446];
const YOLK1: Pt = [702, 486];
// Vessels in the cord: two arteries either side, the vein and the allantois between them.
const ART_OFF = [7, -7];
const VEIN_OFF = -1.5;
const ALL_OFF = 2.8;

function CordFormationDrawing({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const sacClip = `url(#${uid}-sac)`;

  // Amnios barrunbea: widens around the embryo (.48), then fills the whole sac (.74–.82).
  const amGrow = seg(t, 0.48, 0.56);
  const fuse = seg(t, 0.74, 0.82);
  const am = {
    cx: lerp(lerp(AM0.cx, AM1.cx, amGrow), AM2.cx, fuse),
    cy: lerp(lerp(AM0.cy, AM1.cy, amGrow), AM2.cy, fuse),
    rx: lerp(lerp(AM0.rx, AM1.rx, amGrow), AM2.rx, fuse),
    ry: lerp(lerp(AM0.ry, AM1.ry, amGrow), AM2.ry, fuse),
  };

  // The amnios wall sweeps out and sleeves the trunk, then the upper branch, into a tube.
  const trunkWrap = seg(t, 0.48, 0.56);
  const upWrap = seg(t, 0.74, 0.82);
  const whartonK = seg(t, 0.86, 0.96);
  // Amnion-covered mesoderm at first, Wharton's jelly (pale, mucoid) once the cord is definitive.
  const sleeveFill = mix('#e8977c', '#efe3c4', whartonK);

  // Distal remnants: bitelo-zakua + hodi onfalomesenterikoa, pressed to the wall, then gone.
  const distal = 1 - seg(t, 0.86, 0.91);
  const yolk: Pt = [lerp(YOLK0[0], YOLK1[0], fuse), lerp(YOLK0[1], YOLK1[1], fuse)];
  const yolkK = lerp(1, 0.6, fuse) * lerp(1, 0.7, seg(t, 0.86, 0.91));
  const down: [Pt, Pt, Pt, Pt] = [FORK, [610, 348], [lerp(646, 676, fuse), lerp(420, 466, fuse)], yolk];
  // Chorionic cavity disappears as the amnios fuses with the chorionic plate.
  const chorionCav = 1 - seg(t, 0.74, 0.82);
  // Physiological gut loop: appears in the proximal part, then returns to the abdomen.
  const gut = seg(t, 0.6, 0.66) * (1 - seg(t, 0.89, 0.94));
  // Allantois (distal part) closes back towards the embryo.
  const allClose = seg(t, 0.92, 0.96);
  const allantois = 1 - allClose;
  // The coelomic communication (embryo ↔ chorionic cavity) narrows from its open end and closes.
  const coelomClose = seg(t, 0.94, 0.98);
  const coelom = 1 - coelomClose;
  // The primitive ring is absorbed into the cord once it's wrapped.
  const ringA = 1 - seg(t, 0.6, 0.68);

  // The sleeve grows from the ring along the trunk, then along the upper branch; its front is rounded.
  const sleeveU = 0.4 * Math.max(trunkWrap, upWrap > 0 ? 1 : 0) + 0.6 * upWrap;
  const sleeve = sleeveU > 0.004 ? tube(cordRev, (v) => cordW(1 - v, gut), 1 - sleeveU, 1, 64, sleeveU < 0.999) : null;
  // Before it is sleeved, the connecting stalk is a slim mesoderm cord carrying the vessels.
  const stalk = tube(cordC, (u) => 10 + 6 * Math.max(0, (u - 0.86) / 0.14) ** 2, 0, 1, 64);
  // The coelomic channel runs beside the vessels from the ring to the fork, where it opens into the chorionic cavity.
  const coelomTube = coelom > 0.02 ? tube(cordOff(-10.5), () => 3.6, 0.03, lerp(0.4, 0.06, coelomClose), 30) : null;

  const gutP = cordAt(GUT_U, -2);
  const gutAng = cordC(GUT_U).angle;
  const ins = sacPt(INS_A, 3);

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-sac`}>
          <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx} ry={SAC.ry} />
        </clipPath>
        <radialGradient id={`${uid}-cav`} gradientUnits="userSpaceOnUse" cx={SAC.cx + 80} cy={SAC.cy + 20} r={SAC.rx}>
          <stop offset="0" stopColor="#1a2234" />
          <stop offset="1" stopColor="#0f1524" />
        </radialGradient>
        <radialGradient id={`${uid}-yolk`} cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#ffe08f" />
          <stop offset="0.6" stopColor="#f2c14e" />
          <stop offset="1" stopColor="#c9952c" />
        </radialGradient>
      </defs>

      {/* Chorionic cavity (extra-embryonic coelom) inside the smooth chorion */}
      <Part id="korion-barrunbea" show={chorionCav} quiet>
        <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx} ry={SAC.ry} fill={`url(#${uid}-cav)`} />
        <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx} ry={SAC.ry} fill={C.chorionCavity} />
      </Part>
      {/* Smooth chorion all round: trophoblast outside, a thin lining of extra-embryonic mesoderm inside */}
      <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx + 3} ry={SAC.ry + 3} fill="none" stroke="#3f8f5e" strokeWidth={4} opacity={0.85} />
      <ellipse cx={SAC.cx} cy={SAC.cy} rx={SAC.rx + 0.6} ry={SAC.ry + 0.6} fill="none" stroke={C.mesoExtra} strokeWidth={1.6} opacity={0.7} />

      <Part id="finkapen-pedikulua" show={1 - upWrap}>
        <g clipPath={sacClip}>
          <path d={stalk.d} fill={C.mesoExtra} opacity={0.42} />
          <g fill="none" stroke="#d98466" strokeWidth={1} opacity={0.7}>
            <path d={stalk.left} />
            <path d={stalk.right} />
          </g>
        </g>
      </Part>

      {/* Amnios: the sac around the embryo, then (fused) the lining of the whole chorionic sac */}
      <Part id="amnios-barrunbea" quiet>
        <ellipse cx={am.cx} cy={am.cy} rx={am.rx} ry={am.ry} fill="#0f1a2c" opacity={0.55} />
        <ellipse cx={am.cx} cy={am.cy} rx={am.rx} ry={am.ry} fill={C.amnionCavity} />
      </Part>

      {/* Distal branch: hodi onfalomesenterikoa (with its vitelline vessels) + bitelo-zaku-sekundarioa */}
      <Part id="hodi-onfalomesenterikoa" show={distal}>
        <path d={bezD(...down)} fill="none" stroke="#c9952c" strokeWidth={9} strokeLinecap="round" opacity={0.75} />
        <path d={bezD(...down)} fill="none" stroke="#f2c14e" strokeWidth={6.4} strokeLinecap="round" />
        {(() => {
          const a = offsetCurve(...down, 2.1);
          const b = offsetCurve(...down, -2.1);
          return (
            <>
              <path d={bezD(...a)} fill="none" stroke={C.artery} strokeWidth={1.6} strokeLinecap="round" />
              <path d={bezD(...b)} fill="none" stroke={C.vein} strokeWidth={1.6} strokeLinecap="round" />
            </>
          );
        })()}
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={distal}>
        <ellipse cx={yolk[0]} cy={yolk[1]} rx={30 * yolkK} ry={23 * yolkK} fill={`url(#${uid}-yolk)`} stroke="#b07f22" strokeWidth={1.4} />
        <ellipse cx={yolk[0] - 8 * yolkK} cy={yolk[1] - 7 * yolkK} rx={8 * yolkK} ry={5 * yolkK} fill="#fff6d6" opacity={0.45} />
      </Part>

      <Part id="amniosa">
        <ellipse cx={am.cx} cy={am.cy} rx={am.rx} ry={am.ry} fill="none" stroke="#2b4a73" strokeWidth={4.2} opacity={0.6} />
        <ellipse cx={am.cx} cy={am.cy} rx={am.rx} ry={am.ry} fill="none" stroke="#9fc3e6" strokeWidth={2} />
      </Part>

      {/* The amnios sleeve is the cord itself: primitive, then definitive, then filled with Wharton's jelly. */}
      <Part id={whartonK > 0.4 ? 'wharton-gelatina' : t < 0.74 ? 'hasierako-zilbor-hestea' : 'behin-betiko-zilbor-hestea'} show={trunkWrap > 0.01 ? 1 : 0}>
        {sleeve && (
          <g clipPath={sacClip}>
            <path d={sleeve.d} fill={sleeveFill} opacity={0.94} />
            {/* the amnion covering, continuous with the amnios at the ring */}
            <path d={sleeve.d} fill="none" stroke="#9fc3e6" strokeWidth={2} strokeLinejoin="round" />
          </g>
        )}
      </Part>

      {/* Coelomic communication: a channel beside the vessels, open into the chorionic cavity until it closes */}
      <Part id="enbrioi-barruko-zeloma" show={coelom} quiet>
        {coelomTube && (
          <>
            <path d={coelomTube.d} fill="#3a2430" />
            <path d={coelomTube.d} fill="rgba(255,150,150,0.28)" stroke="#e7a3a3" strokeWidth={1} />
          </>
        )}
      </Part>

      {/* Heste lakioak: the physiological hernia in the proximal part of the cord */}
      <Part id="heste-lakioak" show={gut}>
        <g transform={`translate(${f1(gutP[0])} ${f1(gutP[1])}) rotate(${f1(gutAng)})`}>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-24,3 C-21,-12 -9,-12 -7,0 S7,12 9,0 S22,-12 24,3" stroke="#9e4a43" strokeWidth={8} />
            <path d="M-24,3 C-21,-12 -9,-12 -7,0 S7,12 9,0 S22,-12 24,3" stroke="#d6776c" strokeWidth={5.6} />
            <path d="M-24,3 C-21,-12 -9,-12 -7,0 S7,12 9,0 S22,-12 24,3" stroke="#f6b2a6" strokeWidth={1.6} opacity={0.8} />
          </g>
        </g>
      </Part>

      {/* Zilbor-hodiak: 2 arteries + 1 vein along the whole (future) cord, branching over the chorionic plate */}
      <Part id="zilbor-hodiak">
        <g clipPath={sacClip}>
          {ART_OFF.map((off) => (
            <path key={off} d={cordLine(off)} fill="none" stroke={C.artery} strokeWidth={2.8} strokeLinecap="round" />
          ))}
          <path d={cordLine(VEIN_OFF)} fill="none" stroke={C.vein} strokeWidth={3.6} strokeLinecap="round" />
        </g>
      </Part>

      {/* Alantoidea: a thin duct (lumen and wall) in the stalk, closing back towards the embryo late */}
      <Part id="alantoidea" show={allantois}>
        <path d={cordLine(ALL_OFF, 0.02, lerp(0.66, 0.08, allClose), 30)} fill="none" stroke="#b8902a" strokeWidth={3} strokeLinecap="round" />
        <path d={cordLine(ALL_OFF, 0.02, lerp(0.66, 0.08, allClose), 30)} fill="none" stroke="#ffe28a" strokeWidth={1.4} strokeLinecap="round" />
      </Part>

      {/* Chorionic plate: extra-embryonic mesoderm under the trophoblast, villi on its outer face */}
      <Part id="korion-plaka">
        <path d={VILLI} fill="none" stroke="#2c6b41" strokeWidth={5.4} strokeLinecap="round" />
        <path d={VILLI} fill="none" stroke="#4fa36f" strokeWidth={3.4} strokeLinecap="round" />
        <path d={PLATE_D} fill="#3f8f5e" stroke="#2c6b41" strokeWidth={1.1} strokeLinejoin="round" />
        <path d={PLATE_MESO_D} fill={C.mesoExtra} opacity={0.9} />
      </Part>
      {/* The cord vessels fan out in the plate's mesoderm */}
      <Part id="zilbor-hodiak" quiet>
        {[-1, 1].map((dir) => (
          <g key={dir} fill="none" strokeLinecap="round">
            <path d={smoothPath(arcPts(INS_A, INS_A + dir * 30, (a) => 2.2 * plateTaper(a), 12), false)} stroke={C.artery} strokeWidth={1.7} />
            <path d={smoothPath(arcPts(INS_A, INS_A + dir * 24, (a) => 4.4 * plateTaper(a), 10), false)} stroke={C.vein} strokeWidth={1.7} />
          </g>
        ))}
        <circle cx={ins[0]} cy={ins[1]} r={3} fill="#a03a48" />
      </Part>

      {/* Embryo (mirrored Langman 32-day embryo), umbilical ring on its ventral wall */}
      <g transform={`translate(${RING[0]} ${RING[1]}) scale(${-EMB_S} ${EMB_S}) translate(${-EMB.cordRoot[0]} ${-EMB.cordRoot[1]})`}>
        <EarlyEmbryo day={EMB_DAY} beat={Math.sin(t * 160)} />
      </g>

      {/* Primitive ring: the oval lip of the ventral body wall where the amnion turns onto the stalk */}
      <Part id="hasierako-zilbor-eraztuna" show={ringA}>
        <g transform={`translate(${RING[0]} ${RING[1]}) rotate(${f1(TRUNK_C(0).angle)})`}>
          <ellipse cx={0} cy={0} rx={6.5} ry={19} fill="#d98c96" stroke="#9c4f5b" strokeWidth={1.2} />
          <ellipse cx={1.5} cy={-3} rx={2.6} ry={11} fill="#f6d3d8" opacity={0.8} />
        </g>
      </Part>

      {/* Labels — left gutter */}
      <Label id="amniosa" x={200} y={70} ax={am.cx + am.rx * Math.cos(rad(-138))} ay={am.cy + am.ry * Math.sin(rad(-138))} show={vis(t, 0)} />
      <Label id="amnios-barrunbea" x={200} y={114} ax={lerp(AM1.cx - 92, 300, fuse)} ay={lerp(AM1.cy - 118, 150, fuse)} show={vis(t, 0.48)} />
      <Label id="behin-betiko-zilbor-hestea" x={200} y={158} small ax={cordAt(0.6)[0]} ay={cordAt(0.6)[1]} show={vis(t, 0.74)} />
      <Label id="hasierako-zilbor-hestea" x={200} y={202} ax={cordAt(0.33, 12)[0]} ay={cordAt(0.33, 12)[1]} show={vis(t, 0.48, 0.78)} />
      <Label id="alantoidea" x={200} y={246} ax={cordAt(0.14, ALL_OFF)[0]} ay={cordAt(0.14, ALL_OFF)[1]} show={vis(t, 0.12, 0.96)} />
      <Label id="enbrioi-barruko-zeloma" x={200} y={290} ax={cordAt(0.08, -10.5)[0]} ay={cordAt(0.08, -10.5)[1]} show={vis(t, 0.36, 0.98)} />
      <Label id="heste-lakioak" x={200} y={334} ax={gutP[0] - 6} ay={gutP[1] + 4} show={gut} />
      <Label id="hasierako-zilbor-eraztuna" x={462} y={566} align="start" ax={RING[0]} ay={RING[1] + 14} show={vis(t, 0, 0.68)} />

      {/* Labels — right gutter */}
      <Label id="korion-plaka" x={812} y={236} ax={sacPt(-30, 7)[0]} ay={sacPt(-30, 7)[1]} show={vis(t, 0.36)} />
      <Label id="zilbor-hodiak" x={812} y={280} ax={cordAt(0.84, 7)[0]} ay={cordAt(0.84, 7)[1]} show={vis(t, 0.12)} />
      <Mark id="finkapen-pedikulua" x={cordAt(0.68)[0]} y={cordAt(0.68)[1]} rx={20} show={vis(t, 0.12, 0.76)} />
      <Label id="finkapen-pedikulua" x={812} y={324} ax={cordAt(0.68, -8)[0]} ay={cordAt(0.68, -8)[1]} show={vis(t, 0.12, 0.76)} />
      <Label id="wharton-gelatina" x={812} y={324} ax={cordAt(0.7, -10)[0]} ay={cordAt(0.7, -10)[1]} show={vis(t, 0.86)} />
      <Label id="korion-barrunbea" x={812} y={368} ax={742} ay={352} show={vis(t, 0.36, 0.82)} />
      <Label id="hodi-onfalomesenterikoa" x={812} y={412} ax={bez(...down, 0.62)[0]} ay={bez(...down, 0.62)[1]} show={vis(t, 0.24, 0.91)} />
      <Label id="bitelo-zaku-sekundarioa" x={812} y={456} ax={yolk[0] + 12 * yolkK} ay={yolk[1] + 4} show={vis(t, 0.24, 0.91)} />

      <Note x={500} y={612} tone="dim" show={vis(t, 0.48, 0.74)}>
        Amnios barrunbea zabaldu ahala, paretak eraztuneko egiturak inguratzen ditu
      </Note>
      <Note x={500} y={612} tone="dim" show={vis(t, 0.74, 0.86)}>
        Amniosa korion plakarekin fusionatu: korion barrunbea desagertu
      </Note>
      <Note x={500} y={612} tone="dim" show={vis(t, 0.86)}>
        Bitelo-zakua eta hodi onfalomesenterikoa galdu; heste lakioak abdomenera; alantoidea itxi
      </Note>
    </g>
  );
}

export function CordFormation(props: SceneProps) {
  return <CordFormationDrawing {...props} />;
}

/* ---------------------------------------------------------------------------------------------- */
/* CordSections                                                                                      */
/* ---------------------------------------------------------------------------------------------- */

const SEC_C: Pt = [500, 320];
const SEC_R = 168;
/** Stellate fibroblasts scattered through Wharton's jelly (mucoid connective tissue), fixed positions. */
const JELLY_CELLS = Array.from({ length: 70 }, (_, i) => {
  const a = rand(i * 3.1 + 1) * Math.PI * 2;
  const r = Math.sqrt(rand(i * 5.7 + 2)) * (SEC_R - 18);
  const x = SEC_C[0] + Math.cos(a) * r;
  const y = SEC_C[1] + Math.sin(a) * r;
  const rot = rand(i * 1.9 + 4) * Math.PI;
  const arms = [0, 2.1, 4.2].map((o) => {
    const b = rot + o + rand(i + o) * 0.6;
    const l = 5 + rand(i * 2.3 + o) * 4;
    return `M${f1(x)},${f1(y)} l${f1(Math.cos(b) * l)},${f1(Math.sin(b) * l)}`;
  });
  return { x, y, d: arms.join(' ') };
});

export function CordSections({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  // The four losses all belong to the last step, in the order the notes list them.
  const duct = 1 - seg(t, 0.86, 0.89);
  const gutVisible = seg(t, 0.6, 0.66) * (1 - seg(t, 0.89, 0.92)); // proximal part: gut loops, then back to the abdomen
  const alantoidea = 1 - seg(t, 0.92, 0.95);
  const zeloma = 1 - seg(t, 0.95, 0.98);
  const definitiv = seg(t, 0.86, 1);
  const vesselShift = seg(t, 0.86, 1);

  const zelomaC: Pt = [SEC_C[0] - 66, SEC_C[1] - 58];
  const zelomaR = lerp(40, 4, seg(t, 0.95, 0.98));
  const ductC: Pt = [zelomaC[0] - 16, zelomaC[1] - 16];
  const vesselBase: Pt[] = [
    [SEC_C[0] + 54, SEC_C[1] + 58],
    [SEC_C[0] + 30, SEC_C[1] + 76],
    [SEC_C[0] + 74, SEC_C[1] + 78],
  ];
  const vesselDef: Pt[] = [
    [SEC_C[0] - 4, SEC_C[1] - 8],
    [SEC_C[0] - 26, SEC_C[1] + 14],
    [SEC_C[0] + 20, SEC_C[1] + 16],
  ];
  const vpos = (i: number): Pt => [lerp(vesselBase[i][0], vesselDef[i][0], vesselShift), lerp(vesselBase[i][1], vesselDef[i][1], vesselShift)];
  const gutLoops: Pt[] = [
    [zelomaC[0] + 6, zelomaC[1] + 6],
    [zelomaC[0] + 22, zelomaC[1] + 12],
  ];

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-jelly`} gradientUnits="userSpaceOnUse" cx={SEC_C[0] - 50} cy={SEC_C[1] - 60} r={SEC_R * 1.25}>
          <stop offset="0" stopColor={mix('#f8cbb8', '#f8ecd6', definitiv)} />
          <stop offset="0.7" stopColor={mix('#f0ae97', '#efdcbf', definitiv)} />
          <stop offset="1" stopColor={mix('#dc917b', '#d6bc98', definitiv)} />
        </radialGradient>
        <radialGradient id={`${uid}-art`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.42" stopColor="#7a1f26" />
          <stop offset="0.5" stopColor="#c45a60" />
          <stop offset="0.8" stopColor="#d97c7c" />
          <stop offset="1" stopColor="#9d3a40" />
        </radialGradient>
        <radialGradient id={`${uid}-vein`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.74" stopColor="#1f3a7a" />
          <stop offset="0.8" stopColor="#8aa0d6" />
          <stop offset="1" stopColor="#5b74b6" />
        </radialGradient>
        <radialGradient id={`${uid}-lumen`} cx="0.38" cy="0.34" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
      </defs>

      <Part id="wharton-gelatina">
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R - 6} fill={`url(#${uid}-jelly)`} />
        {/* stellate cells in the mucoid ground substance */}
        <g stroke={mix('#b4705e', '#b8977a', definitiv)} strokeWidth={1} strokeLinecap="round" opacity={0.55}>
          {JELLY_CELLS.map((c, i) => (
            <path key={i} d={c.d} />
          ))}
        </g>
        <g fill={mix('#a65b4b', '#a3845f', definitiv)} opacity={0.6}>
          {JELLY_CELLS.map((c, i) => (
            <circle key={i} cx={f1(c.x)} cy={f1(c.y)} r={1.7} />
          ))}
        </g>
      </Part>
      {/* The amnion covering the cord: a thin epithelium lying on the jelly (cell boundaries as ticks). */}
      <Part id="amniosa">
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R - 3} fill="none" stroke="#9fc3e6" strokeWidth={6} />
        <g stroke="#5f86b8" strokeWidth={0.9}>
          {Array.from({ length: 96 }, (_, i) => {
            const a = (i / 96) * Math.PI * 2;
            const [c, sn] = [Math.cos(a), Math.sin(a)];
            return <line key={i} x1={f1(SEC_C[0] + c * (SEC_R - 6))} y1={f1(SEC_C[1] + sn * (SEC_R - 6))} x2={f1(SEC_C[0] + c * SEC_R)} y2={f1(SEC_C[1] + sn * SEC_R)} />;
          })}
        </g>
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R} fill="none" stroke="#5f86b8" strokeWidth={0.9} />
      </Part>

      {/* Coelomic communication: a cavity lined by a thin mesothelium, shrinking shut at the end */}
      <Part id="enbrioi-barruko-zeloma" show={zeloma} quiet>
        <circle cx={zelomaC[0]} cy={zelomaC[1]} r={zelomaR + 2} fill="none" stroke="#b85b4a" strokeWidth={2.4} opacity={0.5} />
        <circle cx={zelomaC[0]} cy={zelomaC[1]} r={zelomaR} fill="#5a3a44" />
        <circle cx={zelomaC[0]} cy={zelomaC[1]} r={zelomaR} fill="rgba(255,150,150,0.22)" stroke="#e7a3a3" strokeWidth={1.2} />
      </Part>

      {/* Vitelline duct (endoderm-lined) with its two vitelline vessels */}
      <Part id="hodi-onfalomesenterikoa" show={duct}>
        <circle cx={ductC[0]} cy={ductC[1]} r={12} fill="#f2c14e" stroke="#b07f22" strokeWidth={1.4} />
        <circle cx={ductC[0]} cy={ductC[1]} r={4.6} fill="#5a3d12" />
        <circle cx={ductC[0]} cy={ductC[1]} r={12} fill={`url(#${uid}-lumen)`} />
        <circle cx={ductC[0] - 17} cy={ductC[1] + 5} r={3.4} fill={C.artery} stroke="#7a1f1f" strokeWidth={0.8} />
        <circle cx={ductC[0] - 8} cy={ductC[1] + 15} r={3.8} fill={C.vein} stroke="#1f3a7a" strokeWidth={0.8} />
      </Part>
      {/* Herniated gut loops cut across: mesoderm wall, endoderm lining, lumen */}
      <Part id="heste-lakioak" show={gutVisible}>
        {gutLoops.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i ? 10 : 12} fill="#d6776c" stroke="#9e4a43" strokeWidth={1.2} />
            <circle cx={x} cy={y} r={i ? 5 : 6} fill="#f2c14e" />
            <circle cx={x} cy={y} r={i ? 2.2 : 2.8} fill="#4a2a18" />
          </g>
        ))}
      </Part>

      <Part id="alantoidea" show={alantoidea}>
        <circle cx={SEC_C[0] - 10} cy={SEC_C[1] - 4} r={5} fill="#ffe28a" stroke="#b8902a" strokeWidth={1} />
        <circle cx={SEC_C[0] - 10} cy={SEC_C[1] - 4} r={1.8} fill="#6b5212" />
      </Part>

      {/* Two arteries (thick muscular wall, narrow lumen) and one vein (thinner wall, wide lumen). */}
      <Part id="zilbor-hodiak">
        {[0, 1].map((i) => (
          <g key={i}>
            <circle cx={vpos(i)[0]} cy={vpos(i)[1]} r={14.5} fill={`url(#${uid}-art)`} stroke="#6e1a20" strokeWidth={1.1} />
            <circle cx={vpos(i)[0]} cy={vpos(i)[1]} r={5.8} fill={C.artery} />
            <circle cx={vpos(i)[0]} cy={vpos(i)[1]} r={14.5} fill={`url(#${uid}-lumen)`} />
          </g>
        ))}
        <circle cx={vpos(2)[0]} cy={vpos(2)[1]} r={16.5} fill={`url(#${uid}-vein)`} stroke="#1f3a7a" strokeWidth={1.1} />
        <circle cx={vpos(2)[0]} cy={vpos(2)[1]} r={12.2} fill={C.vein} />
        <circle cx={vpos(2)[0]} cy={vpos(2)[1]} r={16.5} fill={`url(#${uid}-lumen)`} />
      </Part>

      <Note x={500} y={110} tone="dim" show={1 - seg(t, 0.84, 0.88)}>
        Hasierako zilbor-hestea, atal proximala
      </Note>
      <Note x={500} y={110} tone="accent" show={seg(t, 0.88, 0.92)}>
        Behin-betikoa: 2 arteria + zain 1, Wharton-en gelatinan
      </Note>

      <Label id="amniosa" x={200} y={80} ax={SEC_C[0] - SEC_R * 0.7} ay={SEC_C[1] - SEC_R * 0.7} />
      <Label id="hodi-onfalomesenterikoa" x={200} y={130} ax={ductC[0] - 6} ay={ductC[1] - 6} show={duct} />
      <Label id="heste-lakioak" x={200} y={180} ax={gutLoops[0][0] - 8} ay={gutLoops[0][1] + 6} show={gutVisible} />
      <Label id="alantoidea" x={200} y={230} ax={SEC_C[0] - 10} ay={SEC_C[1] - 4} show={alantoidea} />
      <Label id="enbrioi-barruko-zeloma" x={200} y={280} ax={zelomaC[0] - zelomaR * 0.6} ay={zelomaC[1] + zelomaR * 0.5} show={zeloma} />

      <Label id="zilbor-hodiak" x={800} y={200} ax={vpos(2)[0]} ay={vpos(2)[1]} />
      <Label id="wharton-gelatina" x={800} y={250} ax={SEC_C[0] + SEC_R * 0.55} ay={SEC_C[1]} show={vis(t, 0.86)} />
      <Label id="behin-betiko-zilbor-hestea" x={800} y={300} ax={SEC_C[0]} ay={SEC_C[1] + SEC_R - 20} show={vis(t, 0.74)} />

      <Note x={40} y={470} align="start" tone="accent" show={seg(t, 0.86, 0.89)}>
        1) Bitelo-zakua eta hodi onfalomesenterikoa desagertu
      </Note>
      <Note x={40} y={505} align="start" tone="accent" show={seg(t, 0.89, 0.92)}>
        2) Heste lakioak abdomenera itzuli (12. astetik)
      </Note>
      <Note x={40} y={540} align="start" tone="accent" show={seg(t, 0.92, 0.95)}>
        3) Alantoidea itxi
      </Note>
      <Note x={40} y={575} align="start" tone="accent" show={seg(t, 0.95, 0.98)}>
        4) Zelomen arteko komunikazioa itxi
      </Note>
    </g>
  );
}
