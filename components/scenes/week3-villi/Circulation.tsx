'use client';

import { Arrow, C, Flow, Label, Note, Part, line, seg, tube, type SceneProps } from '@/components/kit';
import { V, VilliDefs, f1 } from './common';

/**
 * Stage `zirkulazioa` — continuity of the embryo's own vascular circuit (embryo ↔ connecting stalk ↔
 * chorionic plate ↔ tertiary-villus capillaries) and the placental barrier that keeps maternal and
 * fetal blood forever separate. Windows shared by both views and content/weeks/week3b.ts. The three
 * anatomical vessel segments reveal strictly in sequence, matching these windows one-to-one:
 *   .00–.11 embryonic vessels meet the connecting-stalk vessels (zilbor-hodiak)
 *   .15–.28 stalk vessels continue as the chorionic-plate vessels (enbrioi-kanpoko-hodiak)
 *   .32–.46 plate vessels continue into the tertiary villus capillary (biloxka-kapilarrak)
 *   .50–.60 a single continuous circuit now links embryo → placenta → embryo
 *   .65–.72 week 4: the heart begins to beat → blood starts moving through the whole circuit
 *   .76–.84 O2 / nutrients cross from maternal to fetal blood at the barrier
 *   .88–.97 CO2 / waste cross back; the two bloods never mix (karena-muga)
 * Each window starts at its beat and ends before the step's complete frame (next beat − 0.035).
 */
export const W = {
  embryoStalk: [0.0, 0.11],
  stalkPlate: [0.15, 0.28],
  platevillus: [0.32, 0.46],
  circuit: [0.5, 0.6],
  heartbeat: [0.65, 0.72],
  o2: [0.76, 0.84],
  co2: [0.88, 0.97],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);

/**
 * Vertical layout. The villus tip merges directly into the (already-formed, static) cytotrophoblastic
 * shell against the decidua — no gap, mirroring stage `zorro-zitotrofoblastikoa`:
 *   0..deciduaBottom          dezidua basala
 *   deciduaBottom..shellSplit kanpoko zorro zitotrofoblastikoa (static context)
 *   shellSplit..roofBottom    thin residual sinzitiotrofoblastoa
 *   roofBottom..plateSyn      biloxka arteko espazioa
 */
const Y = { deciduaBottom: 70, shellSplit: 90, roofBottom: 104, plateSyn: 320, plateCyto: 334, plateMeso: 348, plateBottom: 386, stalkTop: 386, stalkBottom: 560 };
const VILLUS_TIP = Y.deciduaBottom;
const VX = 500;
const EMBRYO = { x: 500, y: 596, rx: 66, ry: 38 };

/** Full deoxy/oxy guide paths (embryo → villus tip), used only for the faint backdrop and the heartbeat flow. */
function vesselPaths() {
  const deoxy =
    `M${VX - 6},${EMBRYO.y - EMBRYO.ry + 4} C${VX - 10},${Y.stalkBottom} ${VX - 9},${Y.stalkTop} ${VX - 5},${Y.plateBottom} ` +
    `C${VX - 3},${Y.plateMeso} ${VX - 2},${Y.plateSyn} ${VX},${(Y.plateSyn + VILLUS_TIP) / 2} L${VX},${VILLUS_TIP + 22}`;
  const oxy =
    `M${VX},${VILLUS_TIP + 22} L${VX},${(Y.plateSyn + VILLUS_TIP) / 2} C${VX + 2},${Y.plateSyn} ${VX + 3},${Y.plateMeso} ${VX + 5},${Y.plateBottom} ` +
    `C${VX + 9},${Y.stalkTop} ${VX + 10},${Y.stalkBottom} ${VX + 6},${EMBRYO.y - EMBRYO.ry + 4}`;
  return { deoxy, oxy };
}

/** The three anatomical segments, each owned by its own structure id and revealed on its own window. */
function segmentPaths() {
  const stalkDeoxy = `M${VX - 6},${EMBRYO.y - EMBRYO.ry + 4} C${VX - 10},${Y.stalkBottom} ${VX - 9},${Y.stalkTop + 40} ${VX - 5},${Y.stalkTop}`;
  const stalkOxy = `M${VX + 6},${EMBRYO.y - EMBRYO.ry + 4} C${VX + 10},${Y.stalkBottom} ${VX + 9},${Y.stalkTop + 40} ${VX + 5},${Y.stalkTop}`;
  const plate = `M${VX},${Y.stalkTop} L${VX},${Y.plateSyn}`;
  const capillary = `M${VX - 12},${Y.plateSyn} L${VX - 12},${VILLUS_TIP + 26} A12 12 0 0 0 ${VX + 12},${VILLUS_TIP + 26} L${VX + 12},${Y.plateSyn}`;
  return { stalkDeoxy, stalkOxy, plate, capillary };
}

/** Villus layer outline: base half-width `b` (at the plate), tip radius `r`, tip inset `inset` below the shell. */
const villusD = (b: number, r: number, inset: number) => {
  const mid = (Y.plateSyn + VILLUS_TIP) / 2;
  const base = Y.plateMeso + 8;
  const tip = VILLUS_TIP + inset;
  return `M${VX - b},${base} L${VX - b},${Y.plateSyn} Q${VX - b + 2},${mid} ${VX - r},${tip} A${r} ${r} 0 0 1 ${VX + r},${tip} Q${VX + b - 2},${mid} ${VX + b},${Y.plateSyn} L${VX + b},${base}Z`;
};

/** Connecting stalk: a soft cord flaring into the chorionic plate, its lower end tucked under the embryo. */
const STALK = tube(line([VX, Y.stalkTop - 4], [VX, EMBRYO.y - EMBRYO.ry + 5]), (u) => 17 + 18 * Math.max(0, 1 - u / 0.28) ** 2 + 6 * Math.max(0, (u - 0.85) / 0.15) ** 2, 0, 1, 40);

const dash = (p: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: f1(1 - Math.max(0, Math.min(1, p))) });

function CirculationDrawing({ t, reduced }: SceneProps) {
  const embryoStalk = s(t, W.embryoStalk);
  const stalkPlate = s(t, W.stalkPlate);
  const plateVillus = s(t, W.platevillus);
  const circuit = s(t, W.circuit);
  const heartbeat = s(t, W.heartbeat);
  const flowOn = t > W.heartbeat[0] ? 1 : 0;
  const { deoxy, oxy } = vesselPaths();
  const { stalkDeoxy, stalkOxy, plate, capillary } = segmentPaths();
  const pulse = 1 + 0.14 * Math.sin(t * 46);

  return (
    <g mask="url(#m-slab)">
      <Part id="dezidua-basala" quiet>
        <rect x={0} y={0} width={1000} height={Y.deciduaBottom} fill="url(#p-decidua)" />
      </Part>
      <Part id="kanpoko-zorro-zitotrofoblastikoa" quiet>
        <rect x={0} y={Y.deciduaBottom} width={1000} height={Y.shellSplit - Y.deciduaBottom} fill="url(#w3v-cyto)" />
      </Part>
      <Part id="sinzitiotrofoblastoa" quiet>
        <rect x={0} y={Y.shellSplit} width={1000} height={Y.roofBottom - Y.shellSplit} fill="url(#p-syncytio)" />
      </Part>
      <Part id="biloxka-arteko-espazioa" quiet>
        <rect x={0} y={Y.roofBottom} width={1000} height={Y.plateSyn - Y.roofBottom} fill="url(#w3v-mblood)" opacity={0.55} />
      </Part>
      {!reduced && <Flow d={`M330,${Y.roofBottom + 6} C300,220 320,290 330,${Y.plateSyn - 10}`} n={4} dur={8} r={2} color="#ff6b81" reduced={reduced} />}
      {!reduced && <Flow d={`M670,${Y.roofBottom + 6} C700,220 680,290 670,${Y.plateSyn - 10}`} n={4} dur={9} r={2} color="#ff6b81" reduced={reduced} />}

      {/* A single tertiary villus, tip merged into the shell, rising from the chorionic plate: each layer's
          outline first (double width), then the plate band, then the fill — so the villus and the plate
          read as one tissue, with no seam where they meet. */}
      <Part id="sinzitiotrofoblastoa" quiet>
        <path d={villusD(46, 30, 0)} fill="none" stroke={C.syncytioDeep} strokeWidth={2} />
        <rect x={0} y={Y.plateSyn} width={1000} height={Y.plateCyto - Y.plateSyn + 1} fill="url(#p-syncytio)" />
        <path d={villusD(46, 30, 0)} fill="url(#p-syncytio)" />
      </Part>
      <Part id="zitotrofoblastoa" quiet>
        <path d={villusD(36, 22, 10)} fill="none" stroke="rgba(22,80,45,0.6)" strokeWidth={1.8} />
        <rect x={0} y={Y.plateCyto} width={1000} height={Y.plateMeso - Y.plateCyto + 1} fill="url(#w3v-cyto)" />
        <path d={villusD(36, 22, 10)} fill="url(#w3v-cyto)" />
      </Part>
      <Part id="enbrioi-kanpoko-mesodermoa" quiet>
        <path d={villusD(24, 14, 18)} fill="none" stroke="#d9785a" strokeWidth={1.4} />
        <rect x={0} y={Y.plateMeso} width={1000} height={Y.plateBottom - Y.plateMeso} fill={C.mesoExtra} />
        <path d={villusD(24, 14, 18)} fill={C.mesoExtra} />
        <rect x={0} y={Y.plateMeso} width={1000} height={Y.plateBottom - Y.plateMeso} fill="url(#p-meso-extra)" />
      </Part>
      <Part id="korion-plaka">
        <path d={`M232,${Y.plateSyn} h-8 v${Y.plateBottom - Y.plateSyn} h8`} fill="none" stroke="#e8eefc" strokeWidth={2} opacity={0.85} />
      </Part>
      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={Y.plateBottom} width={1000} height={640 - Y.plateBottom} fill="#131a2b" />
        <rect x={0} y={Y.plateBottom} width={1000} height={640 - Y.plateBottom} fill="url(#g-shade)" opacity={0.35} />
      </Part>

      {/* Connecting stalk: tapered cord from the chorionic plate down to the embryo. */}
      <Part id="finkapen-pedikulua">
        <path d={STALK.d} fill={C.mesoExtra} />
        <path d={STALK.d} fill="url(#p-meso-extra)" opacity={0.6} />
        <g fill="none" stroke="#d9785a" strokeWidth={1}>
          <path d={STALK.left} />
          <path d={STALK.right} />
        </g>
      </Part>

      {/* Embryo schematic (decorative — internal embryo structures belong to week 3A). */}
      <g opacity={0.9}>
        <ellipse cx={EMBRYO.x} cy={EMBRYO.y} rx={EMBRYO.rx} ry={EMBRYO.ry} fill="#3a4a72" stroke="#7c93cf" strokeWidth={1.4} />
        <ellipse cx={EMBRYO.x} cy={EMBRYO.y} rx={EMBRYO.rx} ry={EMBRYO.ry} fill="url(#g-shade)" opacity={0.4} />
        <g opacity={heartbeat} transform={`translate(${EMBRYO.x} ${EMBRYO.y}) scale(${flowOn ? pulse : 1})`}>
          <path d="M0,-7 C4,-13 12,-9 0,4 C-12,-9 -4,-13 0,-7 Z" fill={V.oxy} stroke="#7a1020" strokeWidth={0.8} />
        </g>
      </g>

      {/* Faint full-length guide, always present, so the eventual continuity reads clearly. */}
      <g pointerEvents="none">
        <path d={deoxy} fill="none" stroke={V.deoxy} strokeWidth={5} strokeLinecap="round" opacity={0.18} />
        <path d={oxy} fill="none" stroke={V.oxy} strokeWidth={5} strokeLinecap="round" opacity={0.18} />
      </g>

      {/* Segment 1 — stalk (zilbor-hodiak): fully revealed by .15. */}
      <Part id="zilbor-hodiak" show={embryoStalk > 0.02 ? 1 : 0}>
        <path d={stalkDeoxy} fill="none" stroke={V.deoxy} strokeWidth={5.5} strokeLinecap="round" {...dash(embryoStalk)} />
        <path d={stalkOxy} fill="none" stroke={V.oxy} strokeWidth={5.5} strokeLinecap="round" {...dash(embryoStalk)} />
      </Part>

      {/* Segment 2 — chorionic-plate vessel (enbrioi-kanpoko-hodiak), in the plate's mesoderm, not its
          syncytio/cyto covering: reveals .15 → .32, continuing the stalk vessels upward. */}
      <Part id="enbrioi-kanpoko-hodiak" show={stalkPlate > 0.02 ? 1 : 0}>
        <path d={plate} fill="none" stroke={V.endothelium} strokeWidth={6.5} strokeLinecap="round" {...dash(stalkPlate)} />
        <path d={plate} fill="none" stroke={V.fetal} strokeWidth={3.4} strokeLinecap="round" {...dash(stalkPlate)} />
      </Part>

      {/* Segment 3 — villus capillary (biloxka-kapilarrak): reveals .32 → .50, continuing the plate vessel. */}
      <Part id="biloxka-kapilarrak" show={plateVillus > 0.02 ? 1 : 0}>
        <path d={capillary} fill="none" stroke={V.endothelium} strokeWidth={6} {...dash(plateVillus)} />
        <path d={capillary} fill="none" stroke={V.fetal} strokeWidth={3} {...dash(plateVillus)} />
      </Part>

      {flowOn > 0 && !reduced && (
        <>
          <Flow d={deoxy} n={5} dur={3.2} r={2.4} color={V.deoxy} reduced={reduced} />
          <Flow d={oxy} n={5} dur={3.2} r={2.4} color={V.oxy} reduced={reduced} />
        </>
      )}

      {/* Placental barrier: traced directly on the villus's own syncytial wall (radius 30, matching the
          syncytiotrophoblast outline above), not floating in the blood space. */}
      <Part id="karena-muga" show={circuit > 0.3 ? seg(circuit, 0.3, 1) : 0}>
        <path d={`M${VX - 30},${VILLUS_TIP} A30 30 0 0 1 ${VX + 30},${VILLUS_TIP}`} fill="none" stroke="#fde68a" strokeWidth={1.6} strokeDasharray="3 4" opacity={0.9} />
      </Part>
    </g>
  );
}

function labels(t: number) {
  const embryoStalk = s(t, W.embryoStalk);
  const stalkPlate = s(t, W.stalkPlate);
  const plateVillus = s(t, W.platevillus);
  const circuit = s(t, W.circuit);
  return (
    <>
      <Label id="dezidua-basala" x={190} y={54} ax={280} ay={54} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={110} ax={280} ay={(Y.deciduaBottom + Y.shellSplit) / 2} text="Zorro zitotrofoblastikoa" />
      <Label id="biloxka-arteko-espazioa" x={190} y={170} ax={260} ay={200} />
      <Label id="sinzitiotrofoblastoa" x={190} y={250} ax={VX - 44} ay={Y.plateSyn - 10} />
      <Label id="korion-plaka" x={190} y={330} ax={224} ay={320} />
      <Label id="finkapen-pedikulua" x={190} y={410} ax={VX - 24} ay={470} />
      <Label id="zilbor-hodiak" x={190} y={480} ax={VX - 6} ay={(Y.stalkTop + Y.stalkBottom) / 2} show={embryoStalk} />
      <Label id="korion-barrunbea" x={190} y={560} ax={260} ay={600} />
      <Label id="enbrioi-kanpoko-hodiak" x={810} y={330} ax={VX + 3} ay={(Y.stalkTop + Y.plateSyn) / 2} show={Math.max(stalkPlate, plateVillus)} text="Enbrioi kanpoko hodiak" />
      <Label id="biloxka-kapilarrak" x={810} y={390} ax={VX + 10} ay={(Y.plateSyn + VILLUS_TIP) / 2} show={plateVillus} text="Biloxka kapilarrak" />
      <Label id="karena-muga" x={810} y={450} ax={VX + 21} ay={VILLUS_TIP - 21} show={circuit > 0.3 ? seg(circuit, 0.3, 1) : 0} />
      <Label id="zilbor-hodiak" x={810} y={500} ax={VX + 6} ay={470} show={embryoStalk} key="zh-r" />
    </>
  );
}

export function CirculationOverview(props: SceneProps) {
  const { t } = props;
  return (
    <g>
      <VilliDefs />
      <CirculationDrawing {...props} />
      {labels(t)}
      <Note x={770} y={600} show={s(t, W.heartbeat)}>
        Bihotzak taupada egiten hasten da (4. astea)
      </Note>
    </g>
  );
}

/* ---------- Placental barrier close-up (karena-muga): two flows that never mix ---------- */

const BX = { ivs0: 150, ivs1: 330, syn1: 400, cyto1: 452, meso1: 548, endo1: 600, lumen1: 850 };
const BY = { top: 150, bot: 460, mid: 305 };

export function BarrierClose({ t, reduced }: SceneProps) {
  const layers = seg(t, 0.02, 0.2);
  const heartbeat = seg(t, W.heartbeat[0], W.heartbeat[1]);
  const flowOn = t > W.heartbeat[0] ? 1 : 0;
  const o2 = seg(t, W.o2[0], W.o2[1]);
  const co2 = seg(t, W.co2[0], W.co2[1]);
  const midY = BY.mid;
  return (
    <g>
      <VilliDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />

      <Part id="biloxka-arteko-espazioa">
        <rect x={BX.ivs0} y={BY.top} width={BX.ivs1 - BX.ivs0} height={BY.bot - BY.top} fill="url(#w3v-mblood)" />
      </Part>
      {!reduced && <Flow d={`M${BX.ivs0 + 10},${midY - 60} L${BX.ivs1 - 10},${midY - 60}`} n={4} dur={4} r={2.4} color="#ff6b81" reduced={reduced} />}
      {!reduced && <Flow d={`M${BX.ivs1 - 10},${midY + 70} L${BX.ivs0 + 10},${midY + 70}`} n={4} dur={4.4} r={2.4} color="#ff6b81" reduced={reduced} />}

      <Part id="sinzitiotrofoblastoa" show={Math.max(0.4, layers)}>
        <rect x={BX.ivs1} y={BY.top} width={BX.syn1 - BX.ivs1} height={BY.bot - BY.top} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={1} />
      </Part>
      <Part id="zitotrofoblastoa" show={Math.max(0.4, seg(layers, 0.2, 1))}>
        <rect x={BX.syn1} y={BY.top} width={BX.cyto1 - BX.syn1} height={BY.bot - BY.top} fill="url(#w3v-cyto)" stroke="rgba(22,80,45,0.6)" strokeWidth={1} />
      </Part>
      <Part id="enbrioi-kanpoko-mesodermoa" show={Math.max(0.4, seg(layers, 0.4, 1))}>
        <rect x={BX.cyto1} y={BY.top} width={BX.meso1 - BX.cyto1} height={BY.bot - BY.top} fill={C.mesoExtra} />
        <rect x={BX.cyto1} y={BY.top} width={BX.meso1 - BX.cyto1} height={BY.bot - BY.top} fill="url(#p-meso-extra)" stroke="#d9785a" strokeWidth={1} />
      </Part>
      <Part id="biloxka-kapilarrak" show={Math.max(0.4, seg(layers, 0.6, 1))}>
        <rect x={BX.meso1} y={BY.top} width={BX.endo1 - BX.meso1} height={BY.bot - BY.top} fill={V.endothelium} opacity={0.9} stroke="#7a2f45" strokeWidth={1} />
        <rect x={BX.endo1} y={BY.top} width={BX.lumen1 - BX.endo1} height={BY.bot - BY.top} fill={V.fetalPlasma} />
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={BX.endo1 + 40 + i * 34} cy={midY + (i % 2 === 0 ? -55 : 60)} rx={9} ry={6} fill={V.fetal} opacity={0.9} />
        ))}
      </Part>

      {flowOn > 0 && !reduced && <Flow d={`M${BX.endo1 + 10},${midY} L${BX.lumen1 - 10},${midY}`} n={5} dur={2.6} r={4} color={V.fetal} reduced={reduced} />}

      <Part id="karena-muga">
        <rect x={BX.ivs1} y={BY.top - 8} width={BX.endo1 - BX.ivs1} height={8} fill="none" stroke="#fde68a" strokeWidth={1.4} strokeDasharray="4 3" />
        <path d={`M${BX.ivs1},${BY.top - 8} L${BX.ivs1},${BY.top - 20} M${BX.endo1},${BY.top - 8} L${BX.endo1},${BY.top - 20}`} stroke="#fde68a" strokeWidth={1.2} />
      </Part>

      <Arrow from={[BX.ivs1 + 20, midY - 30]} to={[BX.endo1 - 10, midY - 30]} bend={0} color="#fbbf24" show={o2} progress={o2} width={3} />
      <Arrow from={[BX.endo1 - 10, midY + 40]} to={[BX.ivs1 + 20, midY + 40]} bend={0} color="#60a5fa" show={co2} progress={co2} width={3} />

      <Label id="biloxka-arteko-espazioa" x={190} y={120} ax={BX.ivs0 + 40} ay={BY.top + 30} />
      <Label id="sinzitiotrofoblastoa" x={190} y={220} ax={(BX.ivs1 + BX.syn1) / 2} ay={BY.top + 30} />
      <Label id="zitotrofoblastoa" x={190} y={370} ax={(BX.syn1 + BX.cyto1) / 2} ay={BY.top + 30} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={190} y={430} ax={(BX.cyto1 + BX.meso1) / 2} ay={BY.top + 30} text="Kanpoko mesodermoa" />
      <Label id="karena-muga" x={190} y={510} ax={BX.ivs1} ay={BY.top - 14} />
      <Label id="endotelioa" x={810} y={240} ax={(BX.meso1 + BX.endo1) / 2} ay={BY.top + 30} show={seg(layers, 0.6, 1)} />
      <Label id="biloxka-kapilarrak" x={810} y={380} ax={BX.endo1 + 40} ay={BY.top + 60} />
      <Note x={500} y={70} show={o2}>
        O2 eta elikagaiak: amaren odoletik fetuarenera
      </Note>
      <Note x={500} y={575} show={co2} tone="accent">
        CO2 eta hondakinak: fetuaren odoletik amarenera
      </Note>
      <Note x={500} y={610} tone="warn" show={Math.max(o2, co2)}>
        Bi odolak ez dira inoiz nahasten: karena mugak beti bereizten ditu
      </Note>
    </g>
  );
}
