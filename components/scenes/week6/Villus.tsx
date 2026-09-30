'use client';

import { C, Flow, Label, Mark, Note, Part, lerp, line, seg, tube, type SceneProps } from '@/components/kit';
import { V, VilliDefs, fingerD, loopD, place } from '@/components/scenes/week3-villi/common';

/**
 * Topic 6 — the mature tertiary villus and the placental (karena) barrier.
 * Both views share the `karena-muga` stage timeline (beats at 0/.16/.32/.5/.66/.82): the villus
 * is already fully formed, so `t` drives label reveal, blood flow and one highlighted moment
 * rather than growth.
 */
const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

function VillusDefs() {
  return (
    <defs>
      <pattern id="w6v-endo" width="22" height="18" patternUnits="userSpaceOnUse">
        <rect width="22" height="18" fill="#5b6478" />
        <circle cx="5" cy="5" r="1.3" fill="#3f4759" />
        <circle cx="16" cy="9" r="1.3" fill="#3f4759" />
        <circle cx="9" cy="14" r="1.3" fill="#3f4759" />
      </pattern>
      <pattern id="w6v-shell" width="16" height="14" patternUnits="userSpaceOnUse">
        <rect width="16" height="14" fill="#1d3a2c" />
        <circle cx="4" cy="4" r="1.4" fill="#0f2015" />
        <circle cx="12" cy="9" r="1.4" fill="#0f2015" />
      </pattern>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* VilliLongSection — endometrium → villi hanging from the chorionic plate */
/* ------------------------------------------------------------------ */

const ROOF = { synTop: 96, synBottom: 128 };
const BASE = { syn: 466, cyto: 480, meso: 495, vessel: 522 };
const PLATE = { syn: 466, cyto: 480, meso: 495, bottom: 556 };
/** Plate vessels (chorionic arteries/veins) collecting the villous loops, and the stalk hanging into the chorionic cavity. */
const PLATE_ART_Y = 534;
const PLATE_VEIN_Y = 545;
const STALK_X = 420;
const STALK = tube(line([STALK_X, PLATE.bottom - 3], [STALK_X + 8, 660]), (u) => 17 + 16 * Math.max(0, 1 - u / 0.35) ** 2, 0, 1, 24);

const VILLI = [
  { x: 350, len: 296, hw: 40, ts: 11, tc: 10 },
  { x: 500, len: 330, hw: 50, ts: 13, tc: 11 },
  { x: 650, len: 296, hw: 40, ts: 11, tc: 10 },
] as const;

function layerGeom(v: (typeof VILLI)[number]) {
  const synTip = BASE.syn - v.len;
  const cytoLen = BASE.cyto - (synTip + v.ts);
  const mesoHw = v.hw - v.ts - v.tc;
  const mesoLen = BASE.meso - (synTip + v.ts + v.tc);
  const mesoTip = BASE.meso - mesoLen;
  const half = mesoHw * 0.5;
  const loopLen = BASE.vessel - (synTip + v.ts + v.tc + 6);
  return { ...v, synTip, cytoLen, mesoHw, mesoLen, mesoTip, half, loopLen };
}
const VL = VILLI.map(layerGeom);

function VilliLongSectionDrawing({ t, reduced }: SceneProps) {
  const pathHighlight = seg(t, 0.3, 0.37) * (1 - seg(t, 0.5, 0.58));
  const layerHighlight = seg(t, 0.66, 0.72) * (1 - seg(t, 0.82, 0.88));
  return (
    <g mask="url(#m-slab-wide)">
      <Part id="endometrioa" quiet show={vis(t, 0)}>
        <rect x={0} y={0} width={1000} height={ROOF.synTop + 1} fill="url(#w6v-endo)" />
      </Part>
      <Part id="amaren-odol-hodiak" show={vis(t, 0.16)}>
        {[370, 500, 630].map((x, i) => (
          <path
            key={i}
            d={`M${x - 6},${ROOF.synTop - 34} q9,13 -3,24 q-11,10 3,22`}
            fill="none"
            stroke={C.maternalBlood}
            strokeWidth={5.5}
            strokeLinecap="round"
          />
        ))}
      </Part>
      <Part id="kanpoko-zorro-zitotrofoblastikoa" show={vis(t, 0)}>
        <rect x={0} y={ROOF.synTop} width={1000} height={ROOF.synBottom - ROOF.synTop} fill="url(#w6v-shell)" />
      </Part>
      <Part id="biloxka-arteko-espazioa" show={vis(t, 0.16)}>
        <rect x={0} y={ROOF.synBottom - 1} width={1000} height={BASE.syn - ROOF.synBottom + 2} fill="url(#w3v-mblood)" opacity={0.92} />
      </Part>
      {!reduced &&
        [
          'M398,150 C380,250 420,360 396,455',
          'M604,455 C620,360 588,250 606,150',
          'M232,160 C248,280 224,370 240,455',
        ].map((d, i) => <Flow key={i} d={d} n={4} dur={7 + i} r={2.3} color="#ff6b81" reduced={reduced} />)}

      {/* Chorionic plate: trophoblast facing the intervillous space, extra-embryonic mesoderm below it.
          Drawn under the villi so each villus' layers run straight into the plate's (no cut at the base). */}
      <Part id="korion-plaka" show={vis(t, 0)}>
        <rect x={0} y={PLATE.syn} width={1000} height={PLATE.cyto - PLATE.syn} fill="url(#p-syncytio)" />
        <rect x={0} y={PLATE.cyto} width={1000} height={PLATE.meso - PLATE.cyto} fill="url(#w3v-cyto)" />
        <rect x={0} y={PLATE.meso} width={1000} height={PLATE.bottom - PLATE.meso} fill={C.mesoExtra} />
        <rect x={0} y={PLATE.meso} width={1000} height={PLATE.bottom - PLATE.meso} fill="url(#p-meso-extra)" />
        <path d={`M0,${PLATE.bottom} H1000`} stroke="#d9785a" strokeWidth={1} />
      </Part>
      <Part id="korion-barrunbea" quiet show={vis(t, 0)}>
        <rect x={0} y={PLATE.bottom} width={1000} height={640 - PLATE.bottom} fill="#131a2b" />
      </Part>
      <Part id="finkapen-pedikulua" show={vis(t, 0.32)}>
        <path d={STALK.d} fill={C.mesoExtra} />
        <path d={STALK.d} fill="url(#p-meso-extra)" />
        <g fill="none" stroke="#d9785a" strokeWidth={lerp(1, 2.2, pathHighlight)}>
          <path d={STALK.left} />
          <path d={STALK.right} />
        </g>
      </Part>

      <Part id="biloxka-tertziarioa" show={vis(t, 0)}>
        <path transform={place(VL[1].x, BASE.syn)} d={fingerD(VL[1].len, VL[1].hw + 3, 9)} fill="none" stroke="#e8eefc" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.7} />
      </Part>

      <Part id="sinzitiotrofoblastoa" show={vis(t, 0)}>
        {VL.map((v, i) => (
          <path key={i} transform={place(v.x, BASE.syn)} d={fingerD(v.len, v.hw)} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={1.2} />
        ))}
      </Part>
      <Part id="zitotrofoblastoa" show={vis(t, 0.66)}>
        {VL.map((v, i) => (
          <path key={i} transform={place(v.x, BASE.cyto)} d={fingerD(v.cytoLen, v.hw - v.ts, 6)} fill="url(#w3v-cyto)" stroke="rgba(22,80,45,0.6)" strokeWidth={1} />
        ))}
      </Part>
      <Part id="ehun-konektiboa" show={vis(t, 0.66)}>
        {VL.map((v, i) => (
          <g key={i} transform={place(v.x, BASE.meso)}>
            <path d={fingerD(v.mesoLen, v.mesoHw, 5)} fill={C.mesoExtra} />
            <path d={fingerD(v.mesoLen, v.mesoHw, 5)} fill="url(#p-meso-extra)" stroke="#d9785a" strokeWidth={0.8} />
            {/* the core opens into the plate's mesoderm: no line across its base */}
            <rect x={-v.mesoHw - 5} y={-1.2} width={(v.mesoHw + 5) * 2} height={3} fill={C.mesoExtra} />
          </g>
        ))}
      </Part>

      {/* Chorionic-plate vessels gather the loops and run into the stalk: umbilical vessels */}
      <Part id="zilbor-hodiak" show={vis(t, 0.32)}>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={`${VL.map((v) => `M${v.x - v.half * 0.58},${BASE.vessel} V${PLATE_ART_Y} M${v.x + v.half * 0.58},${BASE.vessel} V${PLATE_ART_Y}`).join(' ')} M${VL[0].x - VL[0].half * 0.58},${PLATE_ART_Y} H${VL[2].x + VL[2].half * 0.58} M${STALK_X - 5},${PLATE_ART_Y} V640`}
            stroke={C.artery}
            strokeWidth={4}
          />
          <path
            d={`${VL.map((v) => `M${v.x - v.half * 1.3},${BASE.vessel} V${PLATE_VEIN_Y} M${v.x + v.half * 1.3},${BASE.vessel} V${PLATE_VEIN_Y}`).join(' ')} M${VL[0].x - VL[0].half * 1.3},${PLATE_VEIN_Y} H${VL[2].x + VL[2].half * 1.3} M${STALK_X + 6},${PLATE_VEIN_Y} V640`}
            stroke={C.vein}
            strokeWidth={4}
          />
        </g>
      </Part>
      <Part id="biloxka-kapilarrak" show={vis(t, 0.32)}>
        {VL.map((v, i) => (
          <g key={i} transform={place(v.x, BASE.vessel)}>
            <path d={loopD(v.loopLen, v.half + 3)} fill="none" stroke={V.endothelium} strokeWidth={lerp(7, 10, pathHighlight)} opacity={0.95} />
            <path d={loopD(v.loopLen, v.half * 0.58)} fill="none" stroke={C.artery} strokeWidth={4} />
            <path d={loopD(v.loopLen * 0.92, v.half * 1.3)} fill="none" stroke={C.vein} strokeWidth={4} />
          </g>
        ))}
      </Part>
      <Part id="endotelioa" show={vis(t, 0.82)}>
        {VL.map((v, i) => (
          <circle key={i} cx={v.x} cy={BASE.vessel - v.loopLen * 0.5} r={v.half + 6} fill="none" stroke="#c43a5a" strokeWidth={lerp(1.4, 2.6, layerHighlight)} strokeDasharray="2 3" opacity={0.9} />
        ))}
      </Part>

      {!reduced && (
        <>
          <Flow d={`M${STALK_X + 6},640 L${STALK_X + 6},${PLATE_VEIN_Y}`} n={3} dur={3} r={2} color={C.vein} reduced={reduced} />
          {VL.map((v, i) => (
            <g key={i} transform={place(v.x, BASE.vessel)}>
              <Flow d={loopD(v.loopLen * 0.92, v.half * 1.3)} n={2} dur={4 + i} r={1.8} color={C.artery} reduced={reduced} />
            </g>
          ))}
        </>
      )}
    </g>
  );
}

export function VilliLongSection(props: SceneProps) {
  const { t } = props;
  const pathHighlight = seg(t, 0.3, 0.37) * (1 - seg(t, 0.5, 0.58));
  const layerHighlight = seg(t, 0.66, 0.72) * (1 - seg(t, 0.82, 0.88));
  const karena = seg(t, 0.5, 0.58) * (1 - seg(t, 0.9, 1));
  return (
    <g>
      <VillusDefs />
      <VilliDefs />
      <VilliLongSectionDrawing {...props} />
      {/* Karena = fetal part (chorionic plate + villi + shell) + maternal part (endometrium / decidua). */}
      <Part id="karenaren-ama-atala" show={karena}>
        <Bracket x={910} y0={12} y1={114} color="#e8a0a8" />
      </Part>
      <Part id="karenaren-fetu-atala" show={karena}>
        <Bracket x={910} y0={122} y1={PLATE.bottom} color="#7fd1a8" />
      </Part>
      <Part id="karena" show={karena}>
        <Bracket x={926} y0={12} y1={PLATE.bottom} color="#f4c06a" />
      </Part>
      <Label id="endometrioa" x={190} y={48} ax={280} ay={48} show={vis(t, 0)} />
      <Label id="amaren-odol-hodiak" x={190} y={92} ax={370} ay={94} show={vis(t, 0.16)} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={300} y={132} align="end" ax={228} ay={112} show={vis(t, 0)} />
      <Label id="sinzitiotrofoblastoa" x={190} y={185} ax={VL[0].x - VL[0].hw + 6} ay={220} show={vis(t, 0)} />
      <Label id="zitotrofoblastoa" x={190} y={235} ax={VL[0].x - VL[0].hw + VL[0].ts + 4} ay={280} show={vis(t, 0.66)} />
      <Label id="ehun-konektiboa" x={190} y={285} ax={VL[0].x - VL[0].mesoHw * 0.6} ay={BASE.meso - VL[0].mesoLen * 0.4} show={vis(t, 0.66)} />
      <Label id="korion-plaka" x={190} y={470} ax={250} ay={520} show={vis(t, 0)} />
      <Label id="korion-barrunbea" x={190} y={610} ax={260} ay={610} show={vis(t, 0)} />

      <Label id="biloxka-tertziarioa" x={740} y={150} ax={VL[1].x + VL[1].hw - 6} ay={230} show={vis(t, 0)} />
      <Label id="biloxka-arteko-espazioa" x={740} y={200} ax={772} ay={260} show={vis(t, 0.16)} />
      <Label id="biloxka-kapilarrak" x={770} y={255} ax={VL[2].x + VL[2].half} ay={BASE.vessel - VL[2].loopLen * 0.55} show={Math.max(vis(t, 0.32), pathHighlight)} />
      <Label id="endotelioa" x={770} y={305} ax={VL[2].x + VL[2].half + 6} ay={BASE.vessel - VL[2].loopLen * 0.5} show={Math.max(vis(t, 0.82), layerHighlight)} />
      <Label id="finkapen-pedikulua" x={190} y={560} ax={STALK_X - 12} ay={596} show={vis(t, 0.32)} />
      <Label id="zilbor-hodiak" x={810} y={530} ax={640} ay={PLATE_VEIN_Y} show={vis(t, 0.32)} />

      <Mark id="karena" x={926} y={PLATE.bottom} rx={26} color="#ff8a8a" show={karena} />
      <Label id="karena" x={900} y={590} align="end" ax={926} ay={PLATE.bottom} show={karena} />
      <Label id="karenaren-ama-atala" x={896} y={64} align="end" ax={910} ay={64} show={karena} small />
      <Label id="karenaren-fetu-atala" x={896} y={420} align="end" ax={910} ay={420} show={karena} small />
      <Note x={658} y={612} show={karena} tone="accent">
        Karena: fetu-osagaia (trofoblastoa) + ama-osagaia (endometrioa)
      </Note>
    </g>
  );
}

/** Vertical bracket (with a wide invisible hit strip) marking what a composite structure spans. */
function Bracket({ x, y0, y1, color }: { x: number; y0: number; y1: number; color: string }) {
  return (
    <g>
      <rect x={x - 6} y={y0} width={14} height={y1 - y0} fill="transparent" />
      <path d={`M${x - 8},${y0} H${x} V${y1} H${x - 8}`} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* VillusCross — a single tertiary villus, the four barrier layers    */
/* ------------------------------------------------------------------ */

const CX = 500;
const CY = 320;
const R_OUT = 150;
const R_CYTO = 128;
const R_MESO = 104;

function VillusCrossDrawing({ t, reduced }: SceneProps) {
  const order = ['endotelioa', 'ehun-konektiboa', 'zitotrofoblastoa', 'sinzitiotrofoblastoa'];
  const stepAt = [0, 0.04, 0.08, 0.12].map((d) => 0.83 + d);
  const active = order.map((_, i) => seg(t, stepAt[i], stepAt[i] + 0.03) * (1 - (i < 3 ? seg(t, stepAt[i + 1], stepAt[i + 1] + 0.03) : 0)));
  const litW = (i: number) => lerp(1.4, 3.2, active[i]);
  const capA: [number, number] = [CX - 32, CY - 22];
  const capB: [number, number] = [CX + 28, CY + 30];
  return (
    <g>
      <VilliDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <Part id="biloxka-arteko-espazioa" show={vis(t, 0)}>
        <rect x={200} y={130} width={600} height={380} rx={60} fill="url(#w3v-mblood)" opacity={0.3} />
      </Part>
      <Part id="sinzitiotrofoblastoa" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={R_OUT} fill="url(#p-syncytio)" stroke={active[3] > 0.01 ? '#fbbf24' : C.syncytioDeep} strokeWidth={litW(3)} />
      </Part>
      <Part id="zitotrofoblastoa" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={R_CYTO} fill="url(#w3v-cyto)" stroke={active[2] > 0.01 ? '#fbbf24' : 'rgba(22,80,45,0.6)'} strokeWidth={litW(2)} />
      </Part>
      <Part id="ehun-konektiboa" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={R_MESO} fill={C.mesoExtra} />
        <circle cx={CX} cy={CY} r={R_MESO} fill="url(#p-meso-extra)" stroke={active[1] > 0.01 ? '#fbbf24' : '#d9785a'} strokeWidth={litW(1)} />
      </Part>
      <Part id="biloxka-kapilarrak" show={vis(t, 0)}>
        {[capA, capB].map((c, i) => (
          <g key={i}>
            <circle cx={c[0]} cy={c[1]} r={22} fill="none" stroke="#c43a5a" strokeWidth={i === 0 ? litW(0) : 1.6} opacity={0.95} />
            <circle cx={c[0]} cy={c[1]} r={17} fill={i === 0 ? C.artery : C.vein} />
          </g>
        ))}
      </Part>
      <Part id="endotelioa" show={vis(t, 0)}>
        <circle cx={capA[0]} cy={capA[1]} r={22} fill="none" stroke={active[0] > 0.01 ? '#fbbf24' : '#c43a5a'} strokeWidth={litW(0)} opacity={0.95} />
      </Part>
      {!reduced && (
        <>
          <Flow d={`M${CX + 190},${CY - 10} C${CX + 90},${CY - 30} ${capA[0] + 40},${capA[1] - 20} ${capA[0] + 6},${capA[1] - 6}`} n={2} dur={5} r={2.6} color="#7dd3fc" reduced={reduced} />
          <Flow d={`M${capB[0] - 4},${capB[1] + 4} C${capB[0] + 60},${capB[1] + 40} ${CX + 120},${CY + 60} ${CX + 190},${CY + 30}`} n={2} dur={5} r={2.4} color="#94a3b8" reduced={reduced} />
        </>
      )}
      <Part id="karena-muga" show={vis(t, 0.82)}>
        <path d={`M${CX - R_OUT - 14},${CY} h-16`} fill="none" stroke="#e8eefc" strokeWidth={1.6} opacity={0.7} />
      </Part>
    </g>
  );
}

export function VillusCross({ t, reduced }: SceneProps) {
  const numberShow = () => vis(t, 0.66);
  return (
    <g>
      <VillusCrossDrawing t={t} reduced={reduced} />
      <Label id="biloxka-arteko-espazioa" x={740} y={140} ax={CX + R_OUT - 10} ay={CY - 70} show={vis(t, 0)} />
      <Label id="sinzitiotrofoblastoa" x={190} y={165} ax={CX - R_OUT + 8} ay={CY - 60} text="4. Sinzitiotrofoblastoa" show={numberShow()} />
      <Label id="zitotrofoblastoa" x={190} y={215} ax={CX - R_CYTO + 8} ay={CY - 20} text="3. Zitotrofoblastoa" show={numberShow()} />
      <Label id="ehun-konektiboa" x={190} y={265} ax={CX - R_MESO + 10} ay={CY + 10} text="2. Ehun konektiboa" show={numberShow()} />
      <Label id="endotelioa" x={190} y={315} ax={CX - 32 + 16} ay={CY - 22} text="1. Endotelioa" show={numberShow()} />
      <Label id="biloxka-kapilarrak" x={810} y={400} ax={CX + 28 + 16} ay={CY + 30} show={vis(t, 0)} />
      <Mark id="karena-muga" x={CX - R_OUT - 8} y={CY} rx={16} color="#fbbf24" show={vis(t, 0.82)} />
      <Label id="karena-muga" x={190} y={365} ax={CX - R_OUT - 8} ay={CY} show={vis(t, 0.82)} />
      <Note x={500} y={520} show={vis(t, 0.82)} tone="accent">
        Karena muga (barrutik kanpora): endotelioa → ehun konektiboa → zitotrofoblastoa → sinzitiotrofoblastoa
      </Note>
      <Note x={500} y={80} show={seg(t, 0.5, 0.54)} tone="dim">
        O2 amaren odoletik biloxkara · CO2 alderantziz
      </Note>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* VillusThinning — the same cross-section, 3rd month → 4th month+    */
/* ------------------------------------------------------------------ */

export function VillusThinning({ t, reduced }: SceneProps) {
  const thin = seg(t, 0.5, 0.62);
  const cytoR = lerp(R_CYTO, R_OUT - 10, thin);
  const mesoR = lerp(R_MESO, R_OUT - 9, thin);
  const capR = lerp(30, R_OUT - 16, thin);
  const capRadius = lerp(20, 15, thin);
  // Figure C → D: the capillaries multiply and move to the periphery, right under the syncytium.
  const caps = [
    { a: -38, r0: 0.34, color: C.artery, show: 1 },
    { a: 150, r0: 0.3, color: C.vein, show: 1 },
    { a: 62, r0: 0.5, color: C.artery, show: thin },
    { a: 228, r0: 0.5, color: C.vein, show: thin },
  ].map((c) => {
    const rr = lerp(R_MESO * c.r0, R_OUT - capRadius - 9, thin);
    const rad = (c.a * Math.PI) / 180;
    return { ...c, p: [CX + Math.cos(rad) * rr, CY + Math.sin(rad) * rr] as [number, number] };
  });
  const cap = caps[0].p;
  const wallThickness = lerp(46, 12, thin);
  return (
    <g>
      <VilliDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <Part id="biloxka-arteko-espazioa" show={1}>
        <rect x={200} y={130} width={600} height={380} rx={60} fill="url(#w3v-mblood)" opacity={0.3} />
      </Part>
      <Part id="sinzitiotrofoblastoa" show={1}>
        <circle cx={CX} cy={CY} r={R_OUT} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={1.6} />
      </Part>
      <Part id="zitotrofoblastoa" show={1 - thin}>
        <circle cx={CX} cy={CY} r={cytoR} fill="url(#w3v-cyto)" stroke="rgba(22,80,45,0.6)" strokeWidth={1.2} />
      </Part>
      <Part id="ehun-konektiboa" show={1}>
        <circle cx={CX} cy={CY} r={mesoR} fill={C.mesoExtra} />
        <circle cx={CX} cy={CY} r={mesoR} fill="url(#p-meso-extra)" stroke="#d9785a" strokeWidth={0.8} />
      </Part>
      <Part id="biloxka-kapilarrak" show={1}>
        {caps.map((c, i) => (
          <circle key={i} cx={c.p[0]} cy={c.p[1]} r={capRadius * (i > 1 ? 0.8 : 1)} fill={c.color} opacity={c.show} />
        ))}
      </Part>
      <Part id="endotelioa" show={1}>
        {caps.map((c, i) => (
          <circle key={i} cx={c.p[0]} cy={c.p[1]} r={capRadius * (i > 1 ? 0.8 : 1) + 4} fill="none" stroke="#f5c9d4" strokeWidth={2.4} opacity={c.show} />
        ))}
      </Part>
      <Part id="karena-mugaren-meheketa" show={seg(t, 0.34, 0.4)}>
        <circle cx={CX} cy={CY} r={R_OUT + 12} fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 5" opacity={0.7} />
      </Part>
      {!reduced && (
        <Flow d={`M${CX + 190},${CY} C${CX + 90},${CY - 20} ${cap[0] + 30},${cap[1] - 14} ${cap[0] + 4},${cap[1] - 4}`} n={2} dur={5} r={2.4} color="#7dd3fc" reduced={reduced} />
      )}
      <Label id="sinzitiotrofoblastoa" x={190} y={160} ax={CX - R_OUT + 8} ay={CY - 60} show={1} />
      <Label id="zitotrofoblastoa" x={190} y={210} ax={CX - cytoR + 6} ay={CY - 20} show={1 - thin} />
      <Label id="ehun-konektiboa" x={190} y={260} ax={CX - mesoR * 0.4} ay={CY + 30} show={1} />
      <Label id="endotelioa" x={190} y={310} ax={cap[0] - capRadius} ay={cap[1]} show={1} />
      <Mark id="karena-muga" x={CX + R_OUT - 10} y={CY - 50} rx={16} color="#fbbf24" />
      <Label id="karena-muga" x={810} y={200} ax={CX + R_OUT - 10} ay={CY - 50} show={1} />
      <Label id="karena-mugaren-meheketa" x={810} y={250} ax={CX + capR * 0.4} ay={CY - capR * 0.3} show={seg(t, 0.34, 0.4)} />

      <rect x={870} y={520 - wallThickness} width={14} height={wallThickness} fill="#e8eefc" opacity={0.85} rx={2} />
      <Note x={877} y={540} show={1} size={12}>
        Muga lodiera
      </Note>

      <Note x={500} y={600} show={1 - seg(t, 0.5, 0.55)} tone="dim">
        3. hilabetea: lau geruza
      </Note>
      <Note x={500} y={600} show={seg(t, 0.56, 0.62)} tone="accent">
        4. hilabetetik aurrera: bi geruza (endotelioa + sinzitiotrofoblastoa)
      </Note>
    </g>
  );
}
