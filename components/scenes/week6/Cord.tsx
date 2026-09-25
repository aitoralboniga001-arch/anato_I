'use client';

import { C, Label, Note, Part, lerp, mix, seg, type Pt, type SceneProps } from '@/components/kit';
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

/** Filled band around a cubic bezier, drawn only up to `uMax` (0..1) — lets a sleeve "grow" along a path. */
function partialBand(p0: Pt, c1: Pt, c2: Pt, p3: Pt, uMax: number, half: number, n = 22): string {
  if (uMax <= 0.004) return '';
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * uMax;
    const p = bez(p0, c1, c2, p3, u);
    const a = bez(p0, c1, c2, p3, Math.max(0, u - 0.004));
    const b = bez(p0, c1, c2, p3, Math.min(1, u + 0.004));
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    outer.push([p[0] + nx * half, p[1] + ny * half]);
    inner.push([p[0] - nx * half, p[1] - ny * half]);
  }
  const cap = (a: Pt, b: Pt) => `Q${f1((a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.3)},${f1((a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.3)} ${f1(b[0])},${f1(b[1])}`;
  return (
    `M${f1(outer[0][0])},${f1(outer[0][1])}` +
    outer
      .slice(1)
      .map((p) => `L${f1(p[0])},${f1(p[1])}`)
      .join('') +
    cap(outer[outer.length - 1], inner[inner.length - 1]) +
    inner
      .slice()
      .reverse()
      .slice(1)
      .map((p) => `L${f1(p[0])},${f1(p[1])}`)
      .join('') +
    'Z'
  );
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
const TRUNK: [Pt, Pt, Pt, Pt] = [RING, [460, 282], [512, 290], FORK];
const UP: [Pt, Pt, Pt, Pt] = [FORK, [650, 216], [750, 178], [880, 176]];
const DOWN: [Pt, Pt, Pt, Pt] = [FORK, [650, 362], [742, 408], [800, 422]];
const YOLK: Pt = [800, 422];
const CHORION_WALL_X = 955;

function CordFormationDrawing({ t }: SceneProps) {
  // Amnios barrunbea slowly widening around the embryo.
  const amGrow = seg(t, 0, 0.48);
  const amRx = lerp(172, 190, amGrow);
  const amRy = lerp(182, 202, amGrow);
  const amCx = 338;
  const amCy = 306;

  // The amnios wall sweeps out and sleeves the trunk, then the upper branch, into a tube.
  const trunkWrap = seg(t, 0.36, 0.6);
  const upWrap = seg(t, 0.74, 0.92);
  const whartonK = seg(t, 0.82, 1);
  const sleeveFill = mix('rgba(110,170,255,0.20)'.replace('rgba(110,170,255,0.20)', '#4a7fd1'), '#e8e3c8', whartonK);

  // Distal remnants fade away: bitelo-zakua + hodi onfalomesenterikoa.
  const distal = 1 - seg(t, 0.74, 0.92);
  // Chorionic cavity disappears as the amnios fuses with the chorionic plate.
  const chorionCav = 1 - seg(t, 0.74, 0.88);
  // Physiological gut loop: appears in the proximal part, then returns to the abdomen.
  const gut = seg(t, 0.48, 0.6) * (1 - seg(t, 0.84, 0.97));
  // Allantois (distal part) closes.
  const allantois = 1 - seg(t, 0.84, 0.96);
  // The coelomic communication (embryo ↔ chorion) closes.
  const coelom = 1 - seg(t, 0.84, 0.96);
  // The primitive ring is absorbed into the cord once it's wrapped.
  const ringA = 1 - seg(t, 0.6, 0.78);

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
      <Part id="korion-plaka">
        <path d={`M${CHORION_WALL_X},118 Q${CHORION_WALL_X + 22},300 ${CHORION_WALL_X},484`} fill="none" stroke="#b9c6e6" strokeWidth={3} opacity={0.85} />
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

      {/* Amnios: sac around the embryo + sleeve wrapping the cord */}
      <Part id="amnios-barrunbea" quiet>
        <ellipse cx={amCx} cy={amCy} rx={amRx} ry={amRy} fill={C.amnionCavity} />
      </Part>
      <Part id="amniosa">
        <ellipse cx={amCx} cy={amCy} rx={amRx} ry={amRy} fill="none" stroke="#9fc3e6" strokeWidth={1.6} strokeDasharray="2 4" opacity={0.85} />
        <path d={partialBand(...TRUNK, Math.max(trunkWrap, upWrap > 0 ? 1 : 0), 21)} fill={sleeveFill} opacity={0.9} />
        {upWrap > 0.01 && <path d={partialBand(...UP, upWrap, 19)} fill={sleeveFill} opacity={0.9} />}
      </Part>

      {/* Zilbor-hodiak: 2 arteries + 1 vein running the length of the (future) cord */}
      <Part id="zilbor-hodiak">
        {[7, -7].map((off, i) => {
          const [tp0, tc1, tc2, tp3] = offsetCurve(...TRUNK, off);
          const [up0, uc1, uc2, up3] = offsetCurve(...UP, off);
          return (
            <g key={i}>
              <path d={bezD(tp0, tc1, tc2, tp3)} fill="none" stroke={C.artery} strokeWidth={3.4} strokeLinecap="round" />
              <path d={bezD(up0, uc1, uc2, up3)} fill="none" stroke={C.artery} strokeWidth={3.4} strokeLinecap="round" />
            </g>
          );
        })}
        {(() => {
          const [tp0, tc1, tc2, tp3] = offsetCurve(...TRUNK, 0);
          const [up0, uc1, uc2, up3] = offsetCurve(...UP, 0);
          return (
            <>
              <path d={bezD(tp0, tc1, tc2, tp3)} fill="none" stroke={C.vein} strokeWidth={4} strokeLinecap="round" />
              <path d={bezD(up0, uc1, uc2, up3)} fill="none" stroke={C.vein} strokeWidth={4} strokeLinecap="round" />
            </>
          );
        })()}
      </Part>

      {/* Alantoidea: thin duct inside the proximal part, closing late */}
      <Part id="alantoidea" show={allantois}>
        <path d={bezD(...TRUNK)} fill="none" stroke="#ffe28a" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />
        <path d={bezD(bez(...UP, 0), bez(...UP, 0.2), bez(...UP, 0.35), bez(...UP, 0.42))} fill="none" stroke="#ffe28a" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />
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

      {/* Behin-betiko zilbor-hestea: the final cord identity, once fused */}
      <Part id="behin-betiko-zilbor-hestea" show={seg(t, 0.74, 0.88)} quiet>
        <path d={bezD(...TRUNK)} fill="none" stroke="none" />
      </Part>
      <Part id="wharton-gelatina" show={whartonK} quiet>
        <path d={bezD(...TRUNK)} fill="none" stroke="none" />
      </Part>

      {/* Labels — left gutter */}
      <Label id="amniosa" x={200} y={80} ax={amCx + amRx * 0.7} ay={amCy - amRy * 0.65} show={vis(t, 0)} />
      <Label id="amnios-barrunbea" x={200} y={130} ax={amCx} ay={amCy - 60} show={vis(t, 0.48)} />
      <Label id="hasierako-zilbor-eraztuna" x={420} y={556} align="start" ax={RING[0]} ay={RING[1]} show={vis(t, 0, 0.66)} />
      <Label id="finkapen-pedikulua" x={200} y={230} ax={upMid[0]} ay={upMid[1]} show={vis(t, 0.12, 0.76)} />
      <Label id="alantoidea" x={200} y={280} ax={trunkMid[0]} ay={trunkMid[1] + 8} show={vis(t, 0.12, 0.9)} />
      <Label id="zilbor-hodiak" x={200} y={330} ax={bez(...UP, 0.75)[0]} ay={bez(...UP, 0.75)[1]} show={vis(t, 0.12)} />
      <Label id="enbrioi-barruko-zeloma" x={200} y={380} ax={RING[0] + 10} ay={RING[1] + 10} show={vis(t, 0.36, 0.9)} />
      <Label id="hasierako-zilbor-hestea" x={200} y={430} ax={trunkMid[0]} ay={trunkMid[1] - 14} show={vis(t, 0.48, 0.78)} />
      <Label id="heste-lakioak" x={200} y={480} ax={FORK[0] - 10} ay={FORK[1] + 12} show={gut} />
      <Label id="behin-betiko-zilbor-hestea" x={200} y={530} ax={upMid[0] - 30} ay={upMid[1] + 10} show={vis(t, 0.74)} />
      <Label id="wharton-gelatina" x={200} y={580} ax={bez(...UP, 0.3)[0]} ay={bez(...UP, 0.3)[1]} show={vis(t, 0.86)} />

      {/* Labels — right gutter */}
      <Label id="korion-barrunbea" x={760} y={260} ax={700} ay={300} show={vis(t, 0.36, 0.82)} />
      <Label id="hodi-onfalomesenterikoa" x={760} y={310} ax={downMid[0]} ay={downMid[1]} show={vis(t, 0.24, 0.8)} />
      <Label id="bitelo-zaku-sekundarioa" x={760} y={360} ax={YOLK[0]} ay={YOLK[1]} show={vis(t, 0.24, 0.8)} />
      <Label id="korion-plaka" x={760} y={410} ax={CHORION_WALL_X} ay={300} show={vis(t, 0.36)} />

      <Note x={500} y={612} tone="dim" show={vis(t, 0.36, 0.72)}>
        Amnios barrunbea zabaldu ahala, paretak eraztuneko egiturak inguratzen ditu
      </Note>
      <Note x={500} y={612} tone="dim" show={vis(t, 0.74, 1)}>
        Korion barrunbea desagertu; bitelo-zakua eta hodi onfalomesenterikoa galtzen dira
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
  const ductOut = seg(t, 0.34, 0.5); // hodi onfalomesenterikoa → heste lakioa
  const gutVisible = ductOut * (1 - seg(t, 0.6, 0.76)); // heste lakioa itself, then returns to abdomen
  const alantoidea = 1 - seg(t, 0.75, 0.85);
  const zeloma = 1 - seg(t, 0.85, 0.96);
  const definitiv = seg(t, 0.86, 1);
  const vesselShift = seg(t, 0.86, 1);

  const zelomaC: Pt = [SEC_C[0] - 66, SEC_C[1] - 58];
  const ductC: Pt = zelomaC;
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
      <Part id="amniosa">
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R} fill="none" stroke="#9fc3e6" strokeWidth={3} strokeDasharray="2 5" />
      </Part>
      <Part id="wharton-gelatina">
        <circle cx={SEC_C[0]} cy={SEC_C[1]} r={SEC_R - 10} fill={mix('#e9a48f', '#f1c7b5', definitiv)} />
      </Part>

      <Part id="enbrioi-barruko-zeloma" show={zeloma} quiet>
        <circle cx={zelomaC[0]} cy={zelomaC[1]} r={40} fill="#fbe7de" stroke="#b85b4a" strokeWidth={1.4} />
      </Part>

      <Part id="hodi-onfalomesenterikoa" show={Math.max(1 - ductOut, 0.001) > 0.02 ? 1 - ductOut : 0}>
        <circle cx={ductC[0]} cy={ductC[1]} r={16} fill="#f0b34e" stroke="#c98a2c" strokeWidth={1.4} />
        <circle cx={ductC[0] - 4} cy={ductC[1] - 3} r={5} fill="#3b5bdb" opacity={0.6} />
      </Part>
      <Part id="heste-lakioak" show={gutVisible}>
        <g transform={`translate(${ductC[0] - 16} ${ductC[1] - 8})`}>
          <circle cx={10} cy={8} r={11} fill="none" stroke="#c9665e" strokeWidth={5} />
          <circle cx={26} cy={12} r={9} fill="none" stroke="#c9665e" strokeWidth={4.5} />
        </g>
      </Part>

      <Part id="alantoidea" show={alantoidea}>
        <circle cx={SEC_C[0] - 10} cy={SEC_C[1] - 4} r={4} fill="#ffe28a" stroke="#c9a13a" strokeWidth={0.8} />
      </Part>

      <Part id="zilbor-hodiak">
        {[0, 1].map((i) => (
          <circle key={i} cx={vpos(i)[0]} cy={vpos(i)[1]} r={13} fill={C.artery} stroke="#7a1f1f" strokeWidth={1.2} />
        ))}
        <circle cx={vpos(2)[0]} cy={vpos(2)[1]} r={15} fill={C.vein} stroke="#1f3a7a" strokeWidth={1.2} />
      </Part>

      <Label id="amniosa" x={200} y={80} ax={SEC_C[0] - SEC_R * 0.7} ay={SEC_C[1] - SEC_R * 0.7} />
      <Label id="hodi-onfalomesenterikoa" x={200} y={130} ax={ductC[0]} ay={ductC[1]} show={1 - ductOut} />
      <Label id="heste-lakioak" x={200} y={180} ax={ductC[0] + 10} ay={ductC[1]} show={gutVisible} />
      <Label id="alantoidea" x={200} y={230} ax={SEC_C[0] - 10} ay={SEC_C[1] - 4} show={alantoidea} />
      <Label id="enbrioi-barruko-zeloma" x={200} y={280} ax={zelomaC[0]} ay={zelomaC[1]} show={zeloma} />

      <Label id="zilbor-hodiak" x={800} y={200} ax={vpos(2)[0]} ay={vpos(2)[1]} />
      <Label id="wharton-gelatina" x={800} y={250} ax={SEC_C[0] + SEC_R * 0.55} ay={SEC_C[1]} show={vis(t, 0.1)} />
      <Label id="behin-betiko-zilbor-hestea" x={800} y={300} ax={SEC_C[0]} ay={SEC_C[1] + SEC_R - 20} show={definitiv} />

      <Note x={40} y={470} align="start" tone="accent" show={seg(t, 0.5, 0.56)}>
        1) Bitelo-zakua eta hodi onfalomesenterikoa desagertu
      </Note>
      <Note x={40} y={505} align="start" tone="accent" show={seg(t, 0.6, 0.7)}>
        2) Heste lakioak abdomenera itzuli (12. astetik)
      </Note>
      <Note x={40} y={540} align="start" tone="accent" show={seg(t, 0.75, 0.82)}>
        3) Alantoidea itxi
      </Note>
      <Note x={40} y={575} align="start" tone="accent" show={seg(t, 0.85, 0.92)}>
        4) Zelomen arteko komunikazioa itxi
      </Note>
    </g>
  );
}
