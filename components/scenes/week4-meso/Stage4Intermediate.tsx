'use client';

import { C, Label, Note, Part, clamp, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { ParaxialDerivatives } from './Stage3Somite';
import { Aortae, NOTO, NeuralTube, Notochord, SOMITE, TE, TP, TrunkSection, ellipsePts, f1, off, placer, trunkGeom, trunkRegions, type Place, type Trunk } from './trunk';

/**
 * `bitarteko-eta-alboko-mesodermoa` (Langman figs. 6-14 A→B and the notes w4 §3.2–3.3).
 *  - Transverse: the same trunk section as the somite stage, while lateral folding closes the body.
 *    The body-wall folds (ectoderm + parietal layer) curl ventrally and meet; the splanchnopleure
 *    (endoderm + visceral layer) closes into the gut tube, which stays hung from the dorsal wall by
 *    the dorsal mesentery; the coelom, open to the chorionic cavity until then, becomes a closed
 *    cavity round the gut. The intermediate mesoderm swells into the urogenital ridge (nephric
 *    tubules and duct laterally, gonadal ridge medially); the parietal layer lays down the sternal
 *    bars in the ventral body wall.
 *  - Craniocaudal (dorsal view): somites beside the neural tube; lateral to them the intermediate
 *    mesoderm is segmented (nephrotomes, one per somite) at neck / upper thoracic levels and a
 *    continuous nephrogenic cord below; the lateral plate outermost. A level line marks the section.
 */

// Beats (week4b.ts): 0, .14 (craniocaudal) · .28, .42, .54, .66, .78, .9 (transverse).
function timing(t: number) {
  return {
    e: lerp(0.3, 1, seg(t, 0.29, 0.72)),
    split: seg(t, 0.28, 0.34),
    uro: seg(t, 0.42, 0.49),
    wall: seg(t, 0.54, 0.6),
    folded: seg(t, 0.66, 0.73),
    cav: seg(t, 0.78, 0.85),
    mes: seg(t, 0.9, 0.96),
  };
}

const CART = '#a9c2d2';
const CART_EDGE = '#5f8196';
const KIDNEY = '#f2986b';
const GONAD = '#f7b3c2';
const CAV = { peri: '#f4a6a6', pleura: '#9ec7f0', perit: '#c9b2f2' };
const sides = [1, -1] as const;

// ---------------------------------------------------------------- urogenital ridge (model, right side)

function ridge(e: number) {
  const k = clamp((e - 0.3) / 0.7);
  return { cx: lerp(104, 86, k), cy: lerp(108, 150, k), rx: lerp(11, 22, k), ry: lerp(14, 18, k) };
}

function UroRidge({ e, uro, M }: { e: number; uro: number; M: (p: Pt, sd?: 1 | -1) => Pt }) {
  const r = ridge(e);
  const out = ellipsePts(r.cx, r.cy, r.rx, r.ry, 0, Math.PI * 2, 30).slice(0, -1);
  // Gonadal ridge: thickened coelomic epithelium on the ventromedial face.
  const arc = (d: number) => ellipsePts(r.cx, r.cy, r.rx - d, r.ry - d, 1.45, 2.95, 12);
  const tub = [
    { x: r.cx + r.rx * 0.18, y: r.cy - r.ry * 0.25, rr: r.ry * 0.24 },
    { x: r.cx - r.rx * 0.22, y: r.cy + r.ry * 0.05, rr: r.ry * 0.22 },
  ];
  const duct = { x: r.cx + r.rx * 0.6, y: r.cy + r.ry * 0.12, rr: r.ry * 0.2 };
  return (
    <>
      <Part id="bitarteko-mesodermoa">
        {sides.map((sd) => {
          const d = smoothPath(
            out.map((p) => M(p, sd)),
            true,
            0.5,
          );
          return (
            <g key={sd}>
              <path d={d} fill={C.mesoIntermediate} stroke="rgba(245,154,154,0.75)" strokeWidth={1.6} />
              <path d={d} fill="url(#g-shade)" opacity={0.35} />
            </g>
          );
        })}
      </Part>
      {uro > 0.01 && (
        <Part id="giltzurruna" show={uro}>
          {sides.map((sd) =>
            [...tub, duct].map((q, i) => {
              const [x, y] = M([q.x, q.y], sd);
              const rr = q.rr * (M([1, 0])[0] - M([0, 0])[0]);
              return (
                <g key={`${sd}${i}`}>
                  <circle cx={f1(x)} cy={f1(y)} r={f1(rr)} fill={KIDNEY} stroke="#9a4a22" strokeWidth={1} />
                  <circle cx={f1(x)} cy={f1(y)} r={f1(rr * 0.42)} fill="#3a1408" />
                </g>
              );
            }),
          )}
        </Part>
      )}
      {uro > 0.01 && (
        <Part id="gonadak" show={uro}>
          {sides.map((sd) => (
            <Cells key={sd} outer={arc(0).map((p) => M(p, sd))} inner={arc(4.8).map((p) => M(p, sd))} n={6} fill={GONAD} nucleus="rgba(120,30,50,0.6)" edge="rgba(120,30,50,0.35)" seed={7 + sd} />
          ))}
        </Part>
      )}
    </>
  );
}

/** Sternal bars: cartilage condensing in the ventral body wall (parietal layer), meeting as the walls close. */
function sternalBar(g: Trunk): Pt[] {
  const i0 = Math.max(g.iA + 4, g.iTip - 16);
  const pts: Pt[] = [];
  for (let i = i0; i <= g.iTip - 2; i++) pts.push(off(g.S[i], TE + TP * 0.5));
  return pts;
}

// ---------------------------------------------------------------- transverse


export function IntermediateSection({ t }: SceneProps) {
  const tm = timing(t);
  const g = trunkGeom(tm.e);
  // The camera eases left and back a little to make room for the cavity map in step 7.
  const PL: Place = { k: lerp(1.04, 0.92, tm.cav), ox: lerp(500, 432, tm.cav), oy: lerp(172, 168, tm.cav) };
  const M = placer(PL);
  const reg = trunkRegions(g);
  const bar = sternalBar(g);
  const coel = sides.map((sd) => smoothPath(reg.coelomR.map((p) => M(p, sd)), true, 0.2)).join('');
  const r = ridge(tm.e);
  // Anchors (left side for left-gutter names).
  const L_ = (p: Pt): Pt => M(p, -1);
  const a = {
    ecto: L_(off(g.S[Math.round(g.iU1 * 0.5)], TE / 2)),
    par: L_([SOMITE.cx, SOMITE.cy - 8]),
    noto: L_([NOTO.cx + 6, NOTO.cy + 6]),
    inter: L_([r.cx + r.rx * 0.5, r.cy - r.ry * 0.5]),
    kid: L_([r.cx + r.rx * 0.6, r.cy + r.ry * 0.12]),
    gon: L_([r.cx - r.rx * 0.55, r.cy + r.ry * 0.62]),
    mes: L_(reg.mesR[Math.round(reg.mesR.length * 0.25)]),
    stern: L_(bar[Math.round(bar.length / 2)]),
    endo: L_(off(g.G[Math.round(g.iM * 0.75)], 4)),
    lat: M(off(g.S[g.iA + 2], TE + TP / 2)),
    pari: M(off(g.S[Math.round((g.iA + g.iTip) / 2)], TE + TP / 2)),
    visc: M(off(g.G[Math.round((g.iV + g.iM) / 2)], g.G[0].a + g.G[0].b / 2)),
  };
  const coelA = M(off(g.S[Math.round(g.iA + 0.4 * (g.iTip - g.iA))], TE + TP + 9));
  const L = (id: string, x: number, y: number, at: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={at[0]} ay={at[1]} show={show} small={small} />;

  return (
    <g>
      <TrunkSection
        g={g}
        pl={PL}
        detail={1}
        mid={
          <>
            <ParaxialDerivatives g={g} pl={PL} />
            <UroRidge e={tm.e} uro={tm.uro} M={M} />
            {/* The section is at the mesonephros / midgut level: its coelom becomes the peritoneal cavity. */}
            {tm.cav > 0.01 && (
              <Part id="peritoneo-barrunbea" show={tm.cav}>
                <path d={coel} fill={CAV.perit} opacity={0.22} />
              </Part>
            )}
          </>
        }
        over={
          <>
            {tm.wall > 0.01 && (
              <Part id="esternoia" show={tm.wall}>
                {sides.map((sd) => {
                  const pts = bar.map((p) => M(p, sd));
                  return <path key={sd} d={smoothPath(pts, false, 0.4)} fill="none" stroke={CART} strokeWidth={7 * PL.k} strokeLinecap="round" opacity={0.92} />;
                })}
                {sides.map((sd) => (
                  <path key={`e${sd}`} d={smoothPath(bar.map((p) => M(p, sd)), false, 0.4)} fill="none" stroke={CART_EDGE} strokeWidth={0.8} opacity={0.5} />
                ))}
              </Part>
            )}
            <NeuralTube pl={PL} />
            <Notochord pl={PL} />
            <Aortae pl={PL} />
          </>
        }
      />

      <CavityMap show={tm.cav} />

      <Note x={500} y={616} tone="dim" show={1 - seg(t, 0.66, 0.69)} size={12}>
        Alboko tolestura: gorputz-paretak bentralki kurbatzen dira; zeloma oraindik korion barrunbera irekita
      </Note>
      <Note x={500} y={616} tone="accent" show={seg(t, 0.69, 0.73) * (1 - seg(t, 0.765, 0.78))} size={12}>
        Tolestura amaituta: heste-hodia zintzilik, zeloma itxia haren inguruan
      </Note>
      <Note x={500} y={600} tone="dim" show={tm.wall * (1 - seg(t, 0.66, 0.69))} size={11}>
        Paretako orria → gorputz-paretaren dermisa, gorputz-adarretako hezurrak, esternoia
      </Note>

      {L('ektodermoa', 190, 96, a.ecto, 1, true)}
      {L('mesodermo-paraxiala', 190, 136, a.par, 1, true)}
      {L('notokorda', 190, 176, a.noto, 1, true)}
      {L('bitarteko-mesodermoa', 190, 236, a.inter)}
      {L('giltzurruna', 190, 276, a.kid, tm.uro, true)}
      {L('gonadak', 190, 360, a.gon, tm.uro, true)}
      {L('mesenterio-dortsala', 190, 400, a.mes, tm.mes)}
      {L('endodermoa', 190, 440, a.endo, 1, true)}
      {L('esternoia', 190, 500, a.stern, tm.wall, true)}
      {L('alboko-mesodermoa', 810, 110, a.lat, tm.split)}
      {L('paretako-orria', 810, 160, a.pari, tm.split)}
      {L('enbrioi-barruko-zeloma', 810, 236, coelA, tm.split)}
      {L('errai-orria', 810, 290, a.visc, tm.split)}
    </g>
  );
}

/**
 * Where the three serous cavities lie (they are at different craniocaudal levels, not in this section):
 * the horseshoe-shaped coelom seen from the ventral side — its cranial bend round the heart becomes
 * the pericardial cavity, the two narrow canals the pleural cavities, the caudal limbs the peritoneal
 * cavity. A line marks the level of the section beside it.
 */
function CavityMap({ show }: { show: number }) {
  if (show <= 0.01) return null;
  const cx = 718;
  const top = 450;
  const W = 46; // half spread of the limbs
  const limb = (sd: 1 | -1, y0: number, y1: number, w0: number, w1: number): Pt[] => {
    const n = 8;
    const L: Pt[] = [];
    const R: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const y = lerp(y0, y1, i / n);
      const w = lerp(w0, w1, i / n);
      const x = cx + sd * (W + 6 * Math.sin((i / n) * Math.PI));
      L.push([x - w, y]);
      R.push([x + w, y]);
    }
    return [...L, ...R.reverse()];
  };
  const bend: Pt[] = [
    ...ellipsePts(cx, top + 26, W + 9, 24, Math.PI, Math.PI * 2, 20),
    ...ellipsePts(cx, top + 26, W - 9, 12, Math.PI * 2, Math.PI, 20),
  ];
  const yS = 586;
  return (
    <g opacity={show}>
      <path d={`M${cx - 74},${top - 8} Q${cx},${top - 30} ${cx + 74},${top - 8} L${cx + 82},${top + 160} Q${cx},${top + 176} ${cx - 82},${top + 160} Z`} fill="rgba(255,255,255,0.03)" stroke="rgba(200,190,220,0.25)" strokeWidth={1} />
      <Part id="perikardio-barrunbea" show={show}>
        <path d={smoothPath(bend, true, 0.3)} fill={CAV.peri} opacity={0.9} />
      </Part>
      <Part id="pleura-barrunbea" show={show}>
        {sides.map((sd) => (
          <path key={sd} d={smoothPath(limb(sd, top + 24, top + 70, 5, 5), true, 0.3)} fill={CAV.pleura} opacity={0.9} />
        ))}
      </Part>
      <Part id="peritoneo-barrunbea" show={show}>
        {sides.map((sd) => (
          <path key={sd} d={smoothPath(limb(sd, top + 70, top + 150, 5, 12), true, 0.3)} fill={CAV.perit} opacity={0.9} />
        ))}
      </Part>
      <path d={`M${cx - 84},${yS} H${cx + 84}`} stroke="#e8eefc" strokeWidth={1.4} opacity={0.75} />
      <Note x={cx} y={yS + 16} tone="dim" size={10.5}>
        Mozketa honen maila
      </Note>
      <Note x={cx} y={top - 34} tone="dim" size={10.5}>
        Zeloma, bentralki (kraneala goian)
      </Note>
      <Label id="perikardio-barrunbea" x={810} y={440} ax={cx + W * 0.4} ay={top + 8} show={show} small />
      <Label id="pleura-barrunbea" x={810} y={500} ax={cx + W + 8} ay={top + 50} show={show} small />
      <Label id="peritoneo-barrunbea" x={810} y={560} ax={cx + W + 12} ay={top + 118} show={show} small />
    </g>
  );
}


// ---------------------------------------------------------------- craniocaudal (dorsal view)

const Y0 = 100; // top of the first (occipital) somite
const PITCH = 19;
const NS = 24;
const NEPH = [4, 14]; // somite indices with a nephrotome (neck + upper thorax)
const SEC = 19; // level of the transverse section (somite index)
const CXL = 500;
/** Columns (distance from the midline): neural tube · somites · intermediate · lateral plate. */
const XT = 12;
const XS: [number, number] = [21, 53];
const XI: [number, number] = [61, 83];
const XL0 = 91;
const BODY_BG = '#2c1522';

/** Beat 0: one cleft per somite boundary cuts the intermediate strip, craniocaudally. */
const cleftAt = (t: number, j: number) => seg(t, 0.008 + j * 0.007, 0.03 + j * 0.007);

export function IntermediateLongitudinal({ t }: SceneProps) {
  const cord = seg(t, 0.14, 0.22);
  const uro = seg(t, 0.42, 0.5);
  const yOf = (i: number) => Y0 + i * PITCH;
  const yEnd = yOf(NS) + 4;
  const yTail = yEnd + 30;
  const half = (y: number) => 152 - 44 * clamp((y - 420) / 190) ** 2;
  // Body: broad trunk, rounded caudal end, and the cranial end (head region) above the somites.
  const right: Pt[] = [];
  for (let y = Y0 - 34; y <= yEnd; y += 8) right.push([CXL + half(y), y]);
  const tail: Pt[] = Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI * (i + 1)) / 10;
    return [CXL + half(yEnd) * Math.cos(a), yEnd + (yTail - yEnd) * Math.sin(a)];
  });
  const head: Pt[] = Array.from({ length: 11 }, (_, i) => {
    const a = (Math.PI * (i + 1)) / 12;
    return [CXL - half(Y0) * Math.cos(a), Y0 - 34 - 30 * Math.sin(a)];
  });
  const left = right.slice().reverse().map((p): Pt => [2 * CXL - p[0], p[1]]);
  const bodyD = smoothPath([...right, ...tail, ...left, ...head], true, 0.3);
  const yNeph0 = yOf(NEPH[0]) - 2;
  const yCord0 = yOf(NEPH[1]) - 2;
  const nN = NEPH[1] - NEPH[0];
  // The boundary below nephrotome j (the last one frees the cord).
  const cuts = Array.from({ length: nN }, (_, j) => cleftAt(t, j + 1));
  // Neural tube: a column with the hindbrain swelling at the cranial end.
  const tubeHW = (y: number) => XT + 8 * Math.exp(-(((y - (Y0 - 30)) / 22) ** 2));
  const tubeR: Pt[] = [];
  for (let y = Y0 - 56; y <= yEnd + 14; y += 6) tubeR.push([CXL + tubeHW(y), y]);
  const tubeD = smoothPath([...tubeR, ...tubeR.slice().reverse().map((p): Pt => [2 * CXL - p[0], p[1]])], true, 0.3);
  const stripX = (sd: 1 | -1) => (sd > 0 ? CXL + XI[0] : CXL - XI[1]);
  const wI = XI[1] - XI[0];
  const cordGrow = 1.5 * cord;
  const cordTop = yCord0 - 1 + 3.3 * cuts[nN - 1];
  return (
    <g>
      <defs>
        <linearGradient id="w4b-ll-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22101a" />
          <stop offset="0.5" stopColor="#341926" />
          <stop offset="1" stopColor="#22101a" />
        </linearGradient>
        <pattern id="w4b-ll-cells" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.05" fill="rgba(90,20,8,0.55)" />
          <circle cx="5.5" cy="5" r="0.95" fill="rgba(90,20,8,0.5)" />
        </pattern>
      </defs>
      <path d={bodyD} fill="url(#w4b-ll-body)" stroke="rgba(122,167,245,0.55)" strokeWidth={2.4} />

      {/* Lateral plate: outermost, continuous. */}
      <Part id="alboko-mesodermoa">
        {sides.map((sd) => {
          const pts: Pt[] = [];
          for (let y = Y0 - 18; y <= yEnd; y += 8) pts.push([CXL + sd * XL0, y]);
          for (let y = yEnd; y >= Y0 - 18; y -= 8) pts.push([CXL + sd * (half(y) - 12), y]);
          return <path key={sd} d={smoothPath(pts, true, 0.2)} fill={C.mesoLateral} opacity={0.55} />;
        })}
      </Part>

      {/* Neural tube in the midline. */}
      <Part id="hodi-neurala" quiet>
        <path d={tubeD} fill={C.neural} opacity={0.8} />
        <path d={`M${CXL},${Y0 - 50}V${yEnd + 8}`} stroke="#14204d" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      </Part>

      {/* Somites beside it; each one glows briefly as its nephrotome is cut off — one per somite. */}
      <Part id="mesodermo-paraxiala">
        {sides.map((sd) =>
          Array.from({ length: NS }, (_, i) => {
            const j = i - NEPH[0];
            const pulse = j >= 0 && j < nN ? Math.sin(Math.PI * cleftAt(t, j + 1)) : 0;
            const x = sd > 0 ? CXL + XS[0] : CXL - XS[1];
            return (
              <g key={`${sd}${i}`}>
                <rect x={x} y={f1(yOf(i))} width={XS[1] - XS[0]} height={PITCH - 4} rx={5} fill={C.mesoParaxial} stroke="rgba(80,6,16,0.7)" strokeWidth={1} />
                <rect x={x} y={f1(yOf(i))} width={XS[1] - XS[0]} height={PITCH - 4} rx={5} fill="url(#g-cell)" opacity={0.6} />
                {pulse > 0.02 && <rect x={x - 1} y={f1(yOf(i) - 1)} width={XS[1] - XS[0] + 2} height={PITCH - 2} rx={6} fill="none" stroke="#ffe1c2" strokeWidth={1.6} opacity={f1(pulse)} />}
              </g>
            );
          }),
        )}
      </Part>

      {/* Intermediate mesoderm, cranial part: clefts at every somite boundary cut it into nephrotomes. */}
      <Part id="nefrotomak">
        {sides.map((sd) => {
          // The clefts are real holes (a mask), so each nephrotome is lit and outlined on its own.
          const mid = `w4b-neph-${sd > 0 ? 'r' : 'l'}-${Math.round(t * 1e4)}`;
          const x0 = stripX(sd);
          return (
            <g key={sd}>
              <mask id={mid} maskUnits="userSpaceOnUse" x={x0 - 6} y={yNeph0 - 6} width={wI + 12} height={yCord0 - yNeph0 + 14}>
                <rect x={x0 - 6} y={yNeph0 - 6} width={wI + 12} height={yCord0 - yNeph0 + 14} fill="#fff" />
                {cuts.map((c, j) => {
                  if (c <= 0.01) return null;
                  const yb = yOf(NEPH[0] + j + 1) - 2;
                  const h = lerp(1.4, 4.6, c);
                  if (c > 0.97) return <rect key={j} x={x0 - 4} y={f1(yb - h / 2)} width={wI + 8} height={f1(h)} fill="#000" />;
                  const w = 3 + (wI / 2 - 2.5) * c;
                  return (
                    <g key={j}>
                      <rect x={f1(x0 - 3)} y={f1(yb - h / 2)} width={f1(w)} height={f1(h)} rx={f1(h / 2)} fill="#000" />
                      <rect x={f1(x0 + wI + 3 - w)} y={f1(yb - h / 2)} width={f1(w)} height={f1(h)} rx={f1(h / 2)} fill="#000" />
                    </g>
                  );
                })}
              </mask>
              <g mask={`url(#${mid})`}>
                <rect x={x0} y={yNeph0} width={wI} height={yCord0 - yNeph0 + 1} rx={6} fill={C.mesoIntermediate} />
                <rect x={x0} y={yNeph0} width={wI} height={yCord0 - yNeph0 + 1} rx={6} fill="url(#w4b-ll-cells)" />
                <rect x={x0 + 1} y={yNeph0 + 1} width={wI - 2} height={yCord0 - yNeph0 - 1} rx={5} fill="none" stroke="rgba(255,214,190,0.35)" strokeWidth={1} />
              </g>
            </g>
          );
        })}
      </Part>
      {/* … and below: a continuous, unsegmented mass, the nephrogenic cord. */}
      <Part id={t < 0.14 ? 'bitarteko-mesodermoa' : 'kordoi-nefrogenoa'}>
        {sides.map((sd) => (
          <g key={sd}>
            <rect x={f1(stripX(sd) - cordGrow)} y={f1(cordTop)} width={f1(wI + 2 * cordGrow)} height={f1(yEnd - 4 - cordTop)} rx={9} fill={C.mesoIntermediate} />
            <rect x={f1(stripX(sd) - cordGrow)} y={f1(cordTop)} width={f1(wI + 2 * cordGrow)} height={f1(yEnd - 4 - cordTop)} rx={9} fill="url(#w4b-ll-cells)" />
          </g>
        ))}
      </Part>
      {uro > 0.01 && (
        <Part id="giltzurruna" show={uro}>
          {sides.map((sd) =>
            Array.from({ length: 8 }, (_, j) => {
              const x = CXL + sd * (XI[0] + XI[1]) * 0.5;
              const y = yCord0 + 30 + j * 22;
              return (
                <g key={`${sd}${j}`}>
                  <ellipse cx={x} cy={f1(y)} rx={6} ry={7} fill={KIDNEY} stroke="#9a4a22" strokeWidth={0.9} />
                  <ellipse cx={x} cy={f1(y)} rx={2.2} ry={2.8} fill="#3a1408" />
                </g>
              );
            }),
          )}
        </Part>
      )}
      {uro > 0.01 && (
        <Part id="gonadak" show={uro}>
          {sides.map((sd) => (
            <rect key={sd} x={sd > 0 ? CXL + XI[0] - 7 : CXL - XI[0] + 1} y={yOf(SEC) - 40} width={6} height={86} rx={3} fill={GONAD} />
          ))}
        </Part>
      )}

      {/* Level of the transverse section. */}
      <path d={`M${CXL - 166},${yOf(SEC) + 7} H${CXL + 166}`} stroke="#e8eefc" strokeWidth={1.4} opacity={0.7} />
      <Note x={CXL + 172} y={yOf(SEC) + 7} align="start" tone="dim" size={12}>
        Zeharkako mozketa
      </Note>

      {/* Level brackets. */}
      <path d={`M${CXL - 168},${yNeph0} h-7 V${yCord0 - 3} h7`} fill="none" stroke="#c9b2a6" strokeWidth={1.6} strokeLinejoin="round" />
      <Note x={CXL - 184} y={(yNeph0 + yCord0) / 2 - 9} align="end" tone="accent" size={13}>
        Lepoa / goiko toraxa
      </Note>
      <Note x={CXL - 184} y={(yNeph0 + yCord0) / 2 + 9} align="end" tone="dim" size={11.5}>
        segmentatuta
      </Note>
      <path d={`M${CXL - 168},${yCord0 + 3} h-7 V${yEnd - 4} h7`} fill="none" stroke="#c9b2a6" strokeWidth={1.6} strokeLinejoin="round" opacity={lerp(0.35, 1, cord)} />
      <Note x={CXL - 184} y={(yCord0 + yEnd) / 2 - 34} align="end" tone="accent" size={13} show={lerp(0.35, 1, cord)}>
        Beheragoko atala
      </Note>
      <Note x={CXL - 184} y={(yCord0 + yEnd) / 2 - 16} align="end" tone="dim" size={11.5} show={lerp(0.35, 1, cord)}>
        masa jarraia
      </Note>
      <Note x={190} y={48} align="end" tone="dim" size={11.5}>
        Ikuspegi dortsala
      </Note>
      <Note x={190} y={64} align="end" tone="dim" size={11.5}>
        (ektodermoa kenduta)
      </Note>

      <Label id="nefrotomak" x={190} y={196} ax={CXL - XI[1] + 4} ay={yOf(NEPH[0] + 2) + 7} />
      <Label id="gonadak" x={190} y={540} ax={CXL - XI[0] + 4} ay={yOf(SEC) + 22} show={uro} small />
      <Label id="hodi-neurala" x={810} y={250} ax={CXL + 4} ay={yOf(6)} small />
      <Label id="mesodermo-paraxiala" x={810} y={290} ax={CXL + XS[1] - 6} ay={yOf(9) + 8} small />
      <Label id="alboko-mesodermoa" x={810} y={330} ax={CXL + half(yOf(11)) - 22} ay={yOf(11)} small />
      <Label id="bitarteko-mesodermoa" x={810} y={370} ax={CXL + XI[1] - 4} ay={yCord0 + 60} show={1 - seg(t, 0.13, 0.15)} small />
      <Label id="kordoi-nefrogenoa" x={810} y={410} ax={CXL + XI[1] + cordGrow - 2} ay={yCord0 + 100} show={seg(t, 0.14, 0.17)} />
      <Label id="giltzurruna" x={810} y={500} ax={CXL + (XI[0] + XI[1]) * 0.5 + 5} ay={yCord0 + 30 + 5 * 22} show={uro} small />
    </g>
  );
}
