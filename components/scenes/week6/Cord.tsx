'use client';

import { C, Label, Mark, Note, Part, bezier, lerp, mix, seg, smoothPath, tube, type Curve, type Pt, type SceneProps } from '@/components/kit';
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

// The ~5-week embryo is the traced Langman drawing from topic 5 (EarlyEmbryo, which faces left),
// mirrored so its ventral side faces the cord, with the umbilical ring on the cord root.
const EMB_DAY = 32;
const EMB_S = 0.56;
const EMB = earlyGeom(EMB_DAY);
const RING: Pt = [374, 316];
const FORK: Pt = [560, 300];
// Trunk and upper branch share one tangent at the fork, so the cord reads as one smooth tube.
const TRUNK: [Pt, Pt, Pt, Pt] = [RING, [450, 290], [512, 317], FORK];
const UP: [Pt, Pt, Pt, Pt] = [FORK, [650, 268], [790, 184], [972, 177]];
/** The whole cord (ring → chorionic plate) as one curve: u 0–.4 = trunk (starting inside the body wall), .4–1 = upper branch. */
const TRUNK_C = bezier(...TRUNK);
const UP_C = bezier(...UP);
const cordC: Curve = (u) => (u < 0.4 ? TRUNK_C(lerp(-0.05, 1, u / 0.4)) : UP_C((u - 0.4) / 0.6));
/** Reversed (plate → ring), with the normal flipped to stay the left-hand normal, so `tube` can round the growing front. */
const cordRev: Curve = (u) => {
  const q = cordC(1 - u);
  return { ...q, nx: -q.nx, ny: -q.ny };
};
/** Half-width: a little slimmer distally, flaring where it inserts into the chorionic plate. */
const cordW = (u: number) => lerp(21, 19, seg(u, 0.3, 0.5)) + 9 * Math.max(0, (u - 0.84) / 0.16) ** 2;
const cordLine = (off: number, u0 = 0, u1 = 1, n = 60) =>
  smoothPath(
    Array.from({ length: n + 1 }, (_, i) => {
      const q = cordC(lerp(u0, u1, i / n));
      return [q.x + q.nx * off, q.y + q.ny * off] as Pt;
    }),
    false,
  );
const DOWN: [Pt, Pt, Pt, Pt] = [FORK, [650, 362], [742, 408], [800, 422]];
const YOLK: Pt = [800, 422];
const CHORION_WALL_X = 955;

function CordFormationDrawing({ t }: SceneProps) {
  // Everything that runs into the chorionic plate is clipped by the plate's curve, so it meets it exactly.
  const clipId = `${useId().replace(/:/g, '')}-plate`;
  const plateClip = `url(#${clipId})`;
  // Amnios barrunbea slowly widening around the embryo.
  const amGrow = seg(t, 0.48, 0.56);
  const amRx = lerp(172, 190, amGrow);
  const amRy = lerp(182, 202, amGrow);
  const amCx = 338;
  const amCy = 306;

  // The amnios wall sweeps out and sleeves the trunk, then the upper branch, into a tube.
  const trunkWrap = seg(t, 0.48, 0.56);
  const upWrap = seg(t, 0.74, 0.82);
  const whartonK = seg(t, 0.86, 0.96);
  const sleeveFill = mix('rgba(110,170,255,0.20)'.replace('rgba(110,170,255,0.20)', '#4a7fd1'), '#e8e3c8', whartonK);

  // Distal remnants fade away: bitelo-zakua + hodi onfalomesenterikoa.
  const distal = 1 - seg(t, 0.86, 0.91);
  // Chorionic cavity disappears as the amnios fuses with the chorionic plate.
  const chorionCav = 1 - seg(t, 0.74, 0.82);
  // Physiological gut loop: appears in the proximal part, then returns to the abdomen.
  const gut = seg(t, 0.6, 0.66) * (1 - seg(t, 0.89, 0.94));
  // Allantois (distal part) closes.
  const allantois = 1 - seg(t, 0.92, 0.96);
  // The coelomic communication (embryo ↔ chorion) closes.
  const coelom = 1 - seg(t, 0.94, 0.98);
  // The primitive ring is absorbed into the cord once it's wrapped.
  const ringA = 1 - seg(t, 0.6, 0.68);

  // The sleeve grows from the ring along the trunk, then along the upper branch; its front is rounded.
  const sleeveU = 0.4 * Math.max(trunkWrap, upWrap > 0 ? 1 : 0) + 0.6 * upWrap;
  const sleeve = sleeveU > 0.004 ? tube(cordRev, (v) => cordW(1 - v), 1 - sleeveU, 1, 64, sleeveU < 0.999) : null;
  // Before it is sleeved, the connecting stalk is a slim mesoderm cord carrying the vessels.
  const stalk = tube(cordC, (u) => 11 + 7 * Math.max(0, (u - 0.86) / 0.14) ** 2, 0, 1, 64);

  const upMid = bez(...UP, 0.5);
  const downMid = bez(...DOWN, 0.5);
  const trunkMid = bez(...TRUNK, 0.55);

  return (
    <g>
      {/* Chorionic cavity + outer chorion wall */}
      <Part id="korion-barrunbea" show={chorionCav} quiet>
        <rect x={600} y={106} width={360} height={392} rx={26} fill={C.chorionCavity} />
        <rect x={600} y={106} width={360} height={392} rx={26} fill="none" stroke="rgba(160,180,220,0.25)" strokeWidth={1.4} />
      </Part>

      {/* Distal branch: hodi onfalomesenterikoa + bitelo-zaku-sekundarioa */}
      <Part id="hodi-onfalomesenterikoa" show={distal}>
        <path d={bezD(...DOWN)} fill="none" stroke="#e8c37a" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
        {(() => {
          const [op0, oc1, oc2, op3] = offsetCurve(...DOWN, 2.6);
          const [op0b, oc1b, oc2b, op3b] = offsetCurve(...DOWN, -2.6);
          return (
            <>
              <path d={bezD(op0, oc1, oc2, op3)} fill="none" stroke={C.artery} strokeWidth={2.2} strokeLinecap="round" />
              <path d={bezD(op0b, oc1b, oc2b, op3b)} fill="none" stroke={C.vein} strokeWidth={2.2} strokeLinecap="round" />
            </>
          );
        })()}
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={distal}>
        <ellipse cx={YOLK[0]} cy={YOLK[1]} rx={32} ry={24} fill="#f0b34e" stroke="#c98a2c" strokeWidth={1.4} />
        <ellipse cx={YOLK[0] - 6} cy={YOLK[1] - 4} rx={11} ry={8} fill="#3b5bdb" opacity={0.6} />
      </Part>

      <clipPath id={clipId}>
        <path d={`M0,0 L${CHORION_WALL_X},0 L${CHORION_WALL_X},118 Q${CHORION_WALL_X + 22},300 ${CHORION_WALL_X},484 L${CHORION_WALL_X},640 L0,640Z`} />
      </clipPath>
      <Part id="finkapen-pedikulua" show={1 - upWrap}>
        <path d={stalk.d} fill={C.mesoExtra} opacity={0.3} clipPath={plateClip} />
      </Part>

      {/* Amnios: sac around the embryo + sleeve wrapping the cord */}
      <Part id="amnios-barrunbea" quiet>
        <ellipse cx={amCx} cy={amCy} rx={amRx} ry={amRy} fill={C.amnionCavity} />
      </Part>
      <Part id="amniosa">
        <ellipse cx={amCx} cy={amCy} rx={amRx} ry={amRy} fill="none" stroke="#9fc3e6" strokeWidth={1.6} strokeDasharray="2 4" opacity={0.85} />
      </Part>
      {/* The amnios sleeve is the cord itself: primitive, then definitive, then filled with Wharton's jelly. */}
      <Part id={whartonK > 0.4 ? 'wharton-gelatina' : t < 0.74 ? 'hasierako-zilbor-hestea' : 'behin-betiko-zilbor-hestea'} show={trunkWrap > 0.01 ? 1 : 0}>
        {sleeve && <path d={sleeve.d} fill={sleeveFill} opacity={0.9} clipPath={plateClip} />}
      </Part>

      {/* Zilbor-hodiak: 2 arteries + 1 vein running the whole (future) cord, into the chorionic plate */}
      <Part id="zilbor-hodiak">
        <g clipPath={plateClip}>
          {[7, -7].map((off) => (
            <path key={off} d={cordLine(off)} fill="none" stroke={C.artery} strokeWidth={3.4} strokeLinecap="round" />
          ))}
          <path d={cordLine(0)} fill="none" stroke={C.vein} strokeWidth={4} strokeLinecap="round" />
        </g>
      </Part>

      {/* Alantoidea: thin duct inside the proximal part, closing late */}
      <Part id="alantoidea" show={allantois}>
        <path d={cordLine(0, 0.04, 0.65, 30)} fill="none" stroke="#ffe28a" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />
      </Part>

      <Part id="korion-plaka">
        <path d={`M${CHORION_WALL_X},118 Q${CHORION_WALL_X + 22},300 ${CHORION_WALL_X},484`} fill="none" stroke="#b9c6e6" strokeWidth={3} opacity={0.85} />
      </Part>

      {/* Heste lakioak: physiological hernia at the base of the cord */}
      <Part id="heste-lakioak" show={gut}>
        <g transform={`translate(${FORK[0] - 24} ${FORK[1] + 6})`}>
          <path d="M0,0 q10,-16 20,0 t20,0" fill="none" stroke="#c9665e" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
          <path d="M2,10 q10,-14 20,0" fill="none" stroke="#c9665e" strokeWidth={5} strokeLinecap="round" opacity={0.65} />
        </g>
      </Part>

      {/* Coelomic communication: small open gap between the embryo cavity and the chorionic cavity */}
      <Part id="enbrioi-barruko-zeloma" show={coelom} quiet>
        <path d={`M${RING[0] + 6},${RING[1] - 26} q14,26 0,52`} fill="none" stroke="#8fb4f7" strokeWidth={2} strokeDasharray="1 4" opacity={0.7} />
      </Part>

      {/* Embryo (mirrored Langman 32-day embryo), umbilical ring on its ventral wall */}
      <g transform={`translate(${RING[0]} ${RING[1]}) scale(${-EMB_S} ${EMB_S}) translate(${-EMB.cordRoot[0]} ${-EMB.cordRoot[1]})`}>
        <EarlyEmbryo day={EMB_DAY} beat={Math.sin(t * 160)} />
      </g>

      {/* Primitive ring */}
      <Part id="hasierako-zilbor-eraztuna" show={ringA}>
        <circle cx={RING[0]} cy={RING[1]} r={15} fill="none" stroke="#f4d7da" strokeWidth={3} opacity={0.9} />
      </Part>


      {/* Labels — left gutter */}
      <Label id="amniosa" x={200} y={80} ax={amCx + amRx * 0.7} ay={amCy - amRy * 0.65} show={vis(t, 0)} />
      <Label id="amnios-barrunbea" x={200} y={130} ax={amCx} ay={amCy - 60} show={vis(t, 0.48)} />
      <Label id="hasierako-zilbor-eraztuna" x={420} y={556} align="start" ax={RING[0]} ay={RING[1]} show={vis(t, 0, 0.68)} />
      <Mark id="finkapen-pedikulua" x={upMid[0]} y={upMid[1]} rx={22} show={vis(t, 0.12, 0.76)} />
      <Label id="finkapen-pedikulua" x={200} y={230} ax={upMid[0]} ay={upMid[1]} show={vis(t, 0.12, 0.76)} />
      <Label id="alantoidea" x={200} y={280} ax={trunkMid[0]} ay={trunkMid[1] + 8} show={vis(t, 0.12, 0.96)} />
      <Label id="zilbor-hodiak" x={200} y={330} ax={bez(...UP, 0.75)[0]} ay={bez(...UP, 0.75)[1]} show={vis(t, 0.12)} />
      <Label id="enbrioi-barruko-zeloma" x={200} y={380} ax={RING[0] + 10} ay={RING[1] + 10} show={vis(t, 0.36, 0.98)} />
      <Label id="hasierako-zilbor-hestea" x={200} y={430} ax={trunkMid[0]} ay={trunkMid[1] - 14} show={vis(t, 0.48, 0.78)} />
      <Label id="heste-lakioak" x={200} y={480} ax={FORK[0] - 10} ay={FORK[1] + 12} show={gut} />
      <Label id="behin-betiko-zilbor-hestea" x={200} y={530} ax={upMid[0] - 30} ay={upMid[1] + 10} show={vis(t, 0.74)} />
      <Label id="wharton-gelatina" x={200} y={580} ax={bez(...UP, 0.3)[0]} ay={bez(...UP, 0.3)[1]} show={vis(t, 0.86)} />

      {/* Labels — right gutter */}
      <Label id="korion-barrunbea" x={760} y={260} ax={700} ay={300} show={vis(t, 0.36, 0.82)} />
      <Label id="hodi-onfalomesenterikoa" x={760} y={310} ax={downMid[0]} ay={downMid[1]} show={vis(t, 0.24, 0.91)} />
      <Label id="bitelo-zaku-sekundarioa" x={760} y={360} ax={YOLK[0]} ay={YOLK[1]} show={vis(t, 0.24, 0.91)} />
      <Label id="korion-plaka" x={940} y={548} ax={CHORION_WALL_X} ay={450} show={vis(t, 0.36)} />

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

export function CordSections({ t }: SceneProps) {
  // The four losses all belong to the last step, in the order the notes list them.
  const duct = 1 - seg(t, 0.86, 0.89);
  const gutVisible = seg(t, 0.6, 0.66) * (1 - seg(t, 0.89, 0.92)); // proximal part: gut loops, then back to the abdomen
  const alantoidea = 1 - seg(t, 0.92, 0.95);
  const zeloma = 1 - seg(t, 0.95, 0.98);
  const definitiv = seg(t, 0.86, 1);
  const vesselShift = seg(t, 0.86, 1);

  const zelomaC: Pt = [SEC_C[0] - 66, SEC_C[1] - 58];
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

  return (
    <g>
      <Part id="wharton-gelatina">
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R - 6} fill={mix('#e9a48f', '#f1c7b5', definitiv)} />
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R - 6} fill="url(#p-meso-extra)" opacity={0.35} />
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R - 6} fill="url(#g-shade)" opacity={0.25} />
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

      <Part id="enbrioi-barruko-zeloma" show={zeloma} quiet>
        <circle cx={zelomaC[0]} cy={zelomaC[1]} r={40} fill="#fbe7de" stroke="#b85b4a" strokeWidth={1.4} />
      </Part>

      <Part id="hodi-onfalomesenterikoa" show={duct}>
        <circle cx={ductC[0]} cy={ductC[1]} r={12} fill="#f0b34e" stroke="#c98a2c" strokeWidth={1.4} />
        <circle cx={ductC[0] - 3} cy={ductC[1] - 2} r={4} fill="#3b5bdb" opacity={0.6} />
      </Part>
      <Part id="heste-lakioak" show={gutVisible}>
        <g transform={`translate(${zelomaC[0] - 4} ${zelomaC[1] - 2})`}>
          <circle cx={10} cy={8} r={11} fill="none" stroke="#c9665e" strokeWidth={5} />
          <circle cx={26} cy={12} r={9} fill="none" stroke="#c9665e" strokeWidth={4.5} />
        </g>
      </Part>

      <Part id="alantoidea" show={alantoidea}>
        <circle cx={SEC_C[0] - 10} cy={SEC_C[1] - 4} r={4} fill="#ffe28a" stroke="#c9a13a" strokeWidth={0.8} />
      </Part>

      {/* Two arteries (thick muscular wall, narrow lumen) and one vein (thinner wall, wide lumen). */}
      <Part id="zilbor-hodiak">
        {[0, 1].map((i) => (
          <g key={i}>
            <circle cx={vpos(i)[0]} cy={vpos(i)[1]} r={14} fill="#c46a6a" stroke="#7a1f1f" strokeWidth={1.1} />
            <circle cx={vpos(i)[0]} cy={vpos(i)[1]} r={10.5} fill="none" stroke="#a84a4f" strokeWidth={0.8} strokeDasharray="1.5 2.5" />
            <circle cx={vpos(i)[0]} cy={vpos(i)[1]} r={6.5} fill={C.artery} stroke="#7a1f1f" strokeWidth={0.9} />
          </g>
        ))}
        <circle cx={vpos(2)[0]} cy={vpos(2)[1]} r={16} fill="#8aa0d6" stroke="#1f3a7a" strokeWidth={1.1} />
        <circle cx={vpos(2)[0]} cy={vpos(2)[1]} r={12.5} fill={C.vein} stroke="#1f3a7a" strokeWidth={0.9} />
      </Part>

      <Label id="amniosa" x={200} y={80} ax={SEC_C[0] - SEC_R * 0.7} ay={SEC_C[1] - SEC_R * 0.7} />
      <Label id="hodi-onfalomesenterikoa" x={200} y={130} ax={ductC[0]} ay={ductC[1]} show={duct} />
      <Label id="heste-lakioak" x={200} y={180} ax={zelomaC[0] + 8} ay={zelomaC[1] + 4} show={gutVisible} />
      <Label id="alantoidea" x={200} y={230} ax={SEC_C[0] - 10} ay={SEC_C[1] - 4} show={alantoidea} />
      <Label id="enbrioi-barruko-zeloma" x={200} y={280} ax={zelomaC[0]} ay={zelomaC[1]} show={zeloma} />

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
