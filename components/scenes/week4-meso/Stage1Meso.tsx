'use client';

import { C, Label, Note, Part, lerp, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { CX, ConceptusSection, U_INT, U_PAR, W, Y0, conceptusAnchors, mesoTiming } from './conceptus';

/**
 * `mesodermoa-banatzen` — ~days 17–20 (notes §3; Langman fig. 6-9 A–C). The thin sheet of
 * intra-embryonic mesoderm beside the notochord thickens into the paraxial mesoderm; the lateral
 * mesoderm, a single sheet continuous at the disc edge with the extra-embryonic mesoderm, develops
 * small cavities that coalesce into the intra-embryonic coelom, splitting it into the parietal
 * (somatic) and visceral (splanchnic) layers — continuous with the amnion's and the yolk sac's coats,
 * the coelom opening into the chorionic cavity. ONLY LATER does the intermediate mesoderm appear
 * between the paraxial and lateral mesoderm (notes: "Gerora…").
 */

/** Transverse section of the whole conceptus (amnion above, yolk sac below). */
export function MesoSplitSection({ t }: SceneProps) {
  const m = mesoTiming(t);
  const a = conceptusAnchors(m);
  const extraOld = 1 - Math.min(1, Math.max(0, (t - 0.5) / 0.04));
  const extraNew = Math.min(1, Math.max(0, (t - 0.53) / 0.05));
  const cav = Math.max(m.coel, Math.min(1, m.ves * 3 - 0.36));
  return (
    <g>
      <ConceptusSection m={m} />

      <Label id="amnios-barrunbea" x={190} y={112} ax={a.amnion[0]} ay={a.amnion[1]} small />
      <Label id="enbrioi-kanpoko-mesodermoa" x={222} y={170} ax={a.amnionCoatL[0]} ay={a.amnionCoatL[1]} show={m.lat * extraOld} />
      <Label id="somatopleura-kanpokoa" x={190} y={150} ax={a.amnionCoatL[0]} ay={a.amnionCoatL[1]} show={extraNew} small={m.somato < 0.5} />
      <Label id="mesodermo-paraxiala" x={190} y={222} ax={a.paraxial[0]} ay={a.paraxial[1]} show={m.par} />
      <Label id="bitarteko-mesodermoa" x={190} y={258} ax={a.intermediate[0]} ay={a.intermediate[1]} show={m.inter} />
      <Label id="mesodermo-intraenbrionarioa" x={226} y={289} ax={a.sheet[0]} ay={a.sheet[1]} show={1 - m.lat} />
      <Label id="alboko-mesodermoa" x={190} y={352} ax={a.lateral[0]} ay={a.lateral[1] + (m.coel > 0.5 ? -9 : 0)} show={m.lat} />
      <Label id="notokorda" x={190} y={390} ax={a.notochord[0]} ay={a.notochord[1]} />
      <Label id="esplaknopleura-kanpokoa" x={190} y={476} ax={a.yolkCoatL[0]} ay={a.yolkCoatL[1]} show={extraNew} small={m.splanchno < 0.5} />
      <Label id="bitelo-zaku-sekundarioa" x={190} y={540} ax={a.yolk[0]} ay={a.yolk[1]} small />

      <Label id="ektodermoa" x={810} y={196} ax={a.ectoderm[0]} ay={a.ectoderm[1]} small />
      <Label id="paretako-orria" x={810} y={234} ax={a.parietal[0]} ay={a.parietal[1]} show={m.somato} />
      <Label id="enbrioi-barruko-zeloma" x={810} y={272} ax={(m.coel > 0.2 ? a.coelom : a.vacuole)[0]} ay={(m.coel > 0.2 ? a.coelom : a.vacuole)[1]} show={cav} />
      <Label id="errai-orria" x={810} y={310} ax={a.visceral[0]} ay={a.visceral[1]} show={m.splanchno} />
      <Label id="endodermoa" x={810} y={348} ax={a.endoderm[0]} ay={a.endoderm[1]} small />
      <Label id="korion-barrunbea" x={810} y={410} ax={a.chorion[0]} ay={a.chorion[1]} show={m.lat} small={m.coel < 0.5} />
    </g>
  );
}

/**
 * Dorsal view of the trilaminar disc (ectoderm lifted off) with, under it and aligned to it, the
 * transverse section at the marked level — the same zones in both, at the same width, so the
 * stripes seen from above read straight down into the layers of the section.
 */
const DD = { cx: 500, cy: 286, rxTop: 168, rxBot: 120, ryTop: 172, ryBot: 158 };
/** Pear-shaped disc outline (broad cranial end). */
function pearPts(n = 96): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const top = s < 0;
    const rx = top ? DD.rxTop : lerp(DD.rxTop, DD.rxBot, Math.min(1, s * 1.15));
    const ry = top ? DD.ryTop : DD.ryBot;
    return [DD.cx + rx * c, DD.cy + ry * s];
  });
}
const PEAR = pearPts();
const DISC_D = smoothPath(PEAR, true, 0.5);
/** Half-width of the disc at height y (from the outline). */
function rimAt(y: number) {
  let best = 0;
  for (let i = 0; i < PEAR.length; i++) {
    const p = PEAR[i];
    const q = PEAR[(i + 1) % PEAR.length];
    if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) {
      const x = p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]);
      best = Math.max(best, Math.abs(x - DD.cx));
    }
  }
  return best;
}
const Y_BPM = 134; // buccopharyngeal membrane
const Y_PRE = 152; // prechordal plate
const Y_NODE = 384;
const Y_STREAK = 432;
const Y_CLOACA = 438;
const Y_SEC = 292; // level of the transverse section shown underneath
/** Scale of the dorsal view relative to the section, so the zones line up. */
const KD = rimAt(Y_SEC) / W;
const XP: [number, number] = [U_PAR[0] * KD, U_PAR[1] * KD];
const XI: [number, number] = [U_INT[0] * KD, U_INT[1] * KD];

const HORSE: Pt[] = (() => {
  const pts: Pt[] = [];
  // Right arm from the caudal end up, round the cranial end, down the left arm (offset inside the rim).
  for (let i = 0; i <= 40; i++) {
    const y = lerp(Y_NODE + 14, Y_BPM + 6, i / 40);
    pts.push([DD.cx + rimAt(y) - 26 - 10 * Math.max(0, (y - 330) / 70), y]);
  }
  const yTop = DD.cy - DD.ryTop + 14;
  for (let i = 1; i < 20; i++) {
    const a = (i / 20) * Math.PI;
    const rx = rimAt(Y_BPM + 6) - 26;
    pts.push([DD.cx + rx * Math.cos(a), Y_BPM + 6 - (Y_BPM + 6 - yTop) * Math.sin(a)]);
  }
  return [...pts, ...pts.slice(0, 41).reverse().map((p): Pt => [2 * DD.cx - p[0], p[1]])];
})();
// The arms open to the chorionic cavity at the disc rim (caudolateral ends).
const HORSE_D = smoothPath([[DD.cx + rimAt(Y_NODE + 26), Y_NODE + 26], ...HORSE, [DD.cx - rimAt(Y_NODE + 26), Y_NODE + 26]], false, 0.4);

export function MesoSplitDorsal({ t }: SceneProps) {
  const m = mesoTiming(t);
  const { par, lat, ves, coel, inter } = m;
  const parEnd = lerp(Y_PRE + 40, Y_NODE - 4, par);
  const intEnd = lerp(Y_PRE + 70, Y_NODE - 26, inter);
  const stripe = (x0: number, x1: number, y0: number, y1: number) => {
    const r = (x1 - x0) / 2;
    const h = Math.max(0, y1 - y0);
    return [1, -1].map((sd) => {
      const x = sd > 0 ? DD.cx + x0 : DD.cx - x1;
      return `M${x},${y0 + r}A${r},${r} 0 0 1 ${x + 2 * r},${y0 + r}V${y0 + r + Math.max(0, h - 2 * r)}A${r},${r} 0 0 1 ${x},${y0 + r + Math.max(0, h - 2 * r)}Z`;
    }).join('');
  };
  const parD = par > 0.01 ? stripe(XP[0], XP[1], Y_PRE + 18, parEnd) : '';
  const intD = inter > 0.01 ? stripe(XI[0], XI[1], Y_PRE + 58, intEnd) : '';
  const axisD = `M${DD.cx - XP[0]},${Y_PRE}H${DD.cx + XP[0]}V${Y_NODE}H${DD.cx - XP[0]}Z`;
  // Vacuoles along the horseshoe (round-capped dashes) that lengthen into one continuous cavity.
  const dash = lerp(0.1, 6, ves) + 26 * coel;
  const gap = lerp(15, 9, ves) * (1 - coel);
  const wC = lerp(4, 8, ves) + 5 * coel;
  const insetY = 538;
  const zs = 0.7;
  const inset = `translate(${DD.cx} ${insetY}) scale(${zs}) translate(${-CX} ${-(Y0 + 40)})`;
  const sheetId = t < 0.24 ? 'mesodermo-intraenbrionarioa' : 'alboko-mesodermoa';
  const at = (x: number, y: number): Pt => [DD.cx + (x - CX) * zs, insetY + (y - (Y0 + 40)) * zs];
  return (
    <g>
      <defs>
        <pattern id="w4b-dots" width="17" height="15" patternUnits="userSpaceOnUse">
          <ellipse cx="4" cy="4" rx="1.9" ry="1.4" fill="rgba(90,10,24,0.55)" />
          <ellipse cx="12" cy="9" rx="1.7" ry="1.3" fill="rgba(90,10,24,0.5)" />
          <ellipse cx="6" cy="12.5" rx="1.5" ry="1.2" fill="rgba(90,10,24,0.45)" />
        </pattern>
        <pattern id="w4b-dots-dense" width="11" height="10" patternUnits="userSpaceOnUse">
          <ellipse cx="3" cy="3" rx="1.7" ry="1.3" fill="rgba(70,4,16,0.6)" />
          <ellipse cx="8.5" cy="7" rx="1.6" ry="1.2" fill="rgba(70,4,16,0.55)" />
        </pattern>
        <clipPath id="w4b-disc">
          <path d={DISC_D} />
        </clipPath>
        <clipPath id="w4b-inset">
          <rect x={258} y={478} width={484} height={118} rx={12} />
        </clipPath>
      </defs>

      <path d={DISC_D} fill="#141826" />
      <g clipPath="url(#w4b-disc)">
        {/* Whole sheet (later the lateral mesoderm) — the axis and the stripes are cut out so lighting one lights only it. */}
        <Part id={sheetId}>
          <path d={`${DISC_D}${axisD}${parD}${intD}`} fillRule="evenodd" fill={C.mesoIntra} opacity={0.62} />
          <path d={`${DISC_D}${axisD}${parD}${intD}`} fillRule="evenodd" fill={C.mesoLateral} opacity={0.6 * lat} />
          <path d={`${DISC_D}${axisD}${parD}${intD}`} fillRule="evenodd" fill="url(#w4b-dots)" />
        </Part>
        {parD && (
          <Part id="mesodermo-paraxiala" show={Math.min(1, par * 3)}>
            <path d={parD} fill={C.mesoParaxial} />
            <path d={parD} fill="url(#g-shade)" opacity={0.5} />
            <path d={parD} fill="url(#w4b-dots-dense)" />
          </Part>
        )}
        {intD && (
          <Part id="bitarteko-mesodermoa" show={Math.min(1, inter * 3)}>
            <path d={intD} fill={C.mesoIntermediate} />
            <path d={intD} fill="url(#w4b-dots-dense)" />
          </Part>
        )}
        {(ves > 0.01 || coel > 0.01) && (
          <Part id="enbrioi-barruko-zeloma">
            <path d={HORSE_D} fill="none" stroke="rgba(255,170,170,0.5)" strokeWidth={wC + 2.4} strokeLinecap="round" strokeDasharray={`${dash.toFixed(1)} ${gap.toFixed(1)}`} />
            <path d={HORSE_D} fill="none" stroke="#1b0d22" strokeWidth={wC} strokeLinecap="round" strokeDasharray={`${dash.toFixed(1)} ${gap.toFixed(1)}`} />
          </Part>
        )}
        {/* Axis: membranes (no mesoderm), prechordal plate, notochord, node and the regressing streak. */}
        <path d={axisD} fill="#20121c" />
        <ellipse cx={DD.cx} cy={Y_BPM} rx={15} ry={8} fill="rgba(223,230,247,0.4)" stroke="#dfe6f7" strokeWidth={1} />
        <ellipse cx={DD.cx} cy={Y_CLOACA} rx={10} ry={6} fill="rgba(223,230,247,0.4)" stroke="#dfe6f7" strokeWidth={1} />
        <ellipse cx={DD.cx} cy={Y_PRE} rx={10} ry={6} fill={C.prechordal} stroke="#f5b8e2" strokeWidth={1} />
        <Part id="notokorda">
          <rect x={DD.cx - 5} y={Y_PRE + 5} width={10} height={Y_NODE - Y_PRE - 8} rx={5} fill={C.notochord} stroke="#d8b4fe" strokeWidth={1} />
        </Part>
        <path
          d={`M${DD.cx - 6},${Y_STREAK} Q${DD.cx - 8},${(Y_NODE + Y_STREAK) / 2} ${DD.cx - 3},${Y_NODE + 6} L${DD.cx + 3},${Y_NODE + 6} Q${DD.cx + 8},${(Y_NODE + Y_STREAK) / 2} ${DD.cx + 6},${Y_STREAK} Q${DD.cx},${Y_STREAK + 5} ${DD.cx - 6},${Y_STREAK}Z`}
          fill="#0c1730"
          stroke="#93a7d9"
          strokeWidth={1.2}
        />
        <ellipse cx={DD.cx} cy={Y_NODE} rx={9} ry={7} fill={C.ectoderm} stroke="#dbe4ff" strokeWidth={1.2} />
        <ellipse cx={DD.cx} cy={Y_NODE} rx={3.6} ry={2.8} fill="#02040a" />
        {/* Level of the section shown below. */}
        <path d={`M${DD.cx - 200},${Y_SEC}H${DD.cx + 200}`} stroke="rgba(232,238,252,0.55)" strokeWidth={1.2} />
      </g>
      <path d={DISC_D} fill="none" stroke="#5b8def" strokeOpacity={0.6} strokeWidth={2} />
      <path d={`M${DD.cx - rimAt(Y_SEC) - 14},${Y_SEC}H${DD.cx - rimAt(Y_SEC) - 2}M${DD.cx + rimAt(Y_SEC) + 2},${Y_SEC}H${DD.cx + rimAt(Y_SEC) + 14}`} stroke="rgba(232,238,252,0.7)" strokeWidth={2} strokeLinecap="round" />
      {/* Guides from the cut down to the section: the zones keep their width. */}
      {[-1, 1].map((sd) => (
        <path key={sd} d={`M${DD.cx + sd * (rimAt(Y_SEC) + 8)},${Y_SEC + 6}V476`} stroke="rgba(232,238,252,0.12)" strokeWidth={1} />
      ))}

      {/* The section at that level, at the same width as the disc there. */}
      <rect x={258} y={478} width={484} height={118} rx={12} fill="#0b0b0e" stroke="rgba(232,238,252,0.14)" />
      <g clipPath="url(#w4b-inset)">
        <g transform={inset}>
          <ConceptusSection m={m} lite />
        </g>
      </g>

      <Note x={500} y={110} tone="dim">
        Kraneala
      </Note>
      <Note x={DD.cx + rimAt(Y_SEC) + 22} y={Y_SEC} align="start" tone="dim" size={11.5}>
        Mozketaren maila ↓
      </Note>
      <Note x={270} y={490} align="start" tone="dim" size={11}>
        Zeharkako mozketa
      </Note>

      <Label id="mesodermo-paraxiala" x={190} y={190} ax={DD.cx - (XP[0] + XP[1]) / 2} ay={Math.min(232, parEnd - 8)} show={par} />
      <Label id="bitarteko-mesodermoa" x={190} y={232} ax={DD.cx - (XI[0] + XI[1]) / 2} ay={Math.min(268, intEnd - 8)} show={inter} />
      <Label id="mesodermo-intraenbrionarioa" x={318} y={336} ax={DD.cx - 96} ay={340} show={1 - lat} />
      <Label id="alboko-mesodermoa" x={190} y={380} ax={DD.cx - 112} ay={360} show={lat} />
      <Label id="notokorda" x={190} y={430} ax={DD.cx - 4} ay={366} />
      <Label id="enbrioi-barruko-zeloma" x={810} y={250} ax={HORSE[12][0]} ay={HORSE[12][1]} show={Math.max(coel, Math.min(1, ves * 3 - 0.4))} />
      <Label id="ektodermoa" x={810} y={466} ax={at(CX + 150, Y0 + 6)[0]} ay={at(CX + 150, Y0 + 6)[1]} small />
      <Label id="endodermoa" x={810} y={578} ax={at(CX + 150, Y0 + 73)[0]} ay={at(CX + 150, Y0 + 73)[1]} small />
      <Label id="paretako-orria" x={810} y={500} ax={at(CX + 200, Y0 + 19)[0]} ay={at(CX + 200, Y0 + 19)[1]} show={m.somato} small />
      <Label id="errai-orria" x={810} y={540} ax={at(CX + 200, Y0 + 60)[0]} ay={at(CX + 200, Y0 + 60)[1]} show={m.splanchno} small />
    </g>
  );
}
