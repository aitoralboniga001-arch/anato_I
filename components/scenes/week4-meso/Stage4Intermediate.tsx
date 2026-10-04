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

const Y0 = 84; // first (occipital) somite
const PITCH = 19.5;
const NS = 26;
const NEPH = [4, 14]; // somite indices with a nephrotome (neck + upper thorax)
const SEC = 20; // level of the transverse section (somite index)

export function IntermediateLongitudinal({ t }: SceneProps) {
  const cord = seg(t, 0.14, 0.22);
  const uro = seg(t, 0.42, 0.5);
  const yOf = (i: number) => Y0 + i * PITCH;
  const yEnd = yOf(NS) + 10;
  const cx = 500;
  const half = (y: number) => 128 - 26 * clamp((y - 470) / 140) ** 2;
  const body: Pt[] = [];
  for (let y = Y0 - 20; y <= yEnd + 30; y += 10) body.push([cx + half(y), y]);
  // Rounded cranial end (the head lies above the frame of this schematic).
  const cap: Pt[] = Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI * (i + 1)) / 10;
    return [cx + half(Y0) * Math.cos(a), Y0 - 20 - 26 * Math.sin(a)];
  });
  const bodyD = smoothPath([...body.slice().reverse(), ...cap, ...body.map((p): Pt => [2 * cx - p[0], p[1]])], true, 0.3);
  const cordTop = yOf(NEPH[1]) - 2;
  const nepY = (i: number) => yOf(i) + 3;
  const xi = [56, 72];
  return (
    <g>
      <path d={bodyD} fill="#2a1420" stroke="rgba(122,167,245,0.55)" strokeWidth={3} />
      <Note x={cx} y={Y0 - 52} tone="dim">
        Ikuspegi dortsala (ektodermoa kenduta)
      </Note>

      {/* Lateral plate: outermost, continuous. */}
      <Part id="alboko-mesodermoa">
        {sides.map((sd) => (
          <path key={sd} d={`M${cx + sd * 80},${Y0 - 22} L${cx + sd * 112},${Y0 - 22} L${cx + sd * (half(yEnd) - 12)},${yEnd} L${cx + sd * 80},${yEnd} Z`} fill={C.mesoLateral} opacity={0.5} />
        ))}
      </Part>

      {/* Neural tube in the midline, somites beside it. */}
      <rect x={cx - 11} y={Y0 - 40} width={22} height={yEnd - Y0 + 44} rx={11} fill={C.neural} opacity={0.6} />
      <Part id="mesodermo-paraxiala">
        {sides.map((sd) =>
          Array.from({ length: NS }, (_, i) => (
            <rect key={`${sd}${i}`} x={sd > 0 ? cx + 20 : cx - 48} y={f1(yOf(i))} width={28} height={PITCH - 4} rx={5} fill={C.mesoParaxial} stroke="rgba(80,6,16,0.6)" strokeWidth={1} />
          )),
        )}
      </Part>

      {/* Intermediate mesoderm: nephrotomes (segmented, one per somite) cranially … */}
      <Part id="nefrotomak">
        {sides.map((sd) =>
          Array.from({ length: NEPH[1] - NEPH[0] }, (_, j) => {
            const i = NEPH[0] + j;
            return <rect key={`${sd}${i}`} x={sd > 0 ? cx + xi[0] : cx - xi[1]} y={f1(nepY(i))} width={xi[1] - xi[0]} height={PITCH - 9} rx={4} fill={C.mesoIntermediate} stroke="rgba(110,20,10,0.6)" strokeWidth={1} />;
          }),
        )}
      </Part>
      {/* … and a continuous nephrogenic cord below. */}
      <Part id="kordoi-nefrogenoa" show={lerp(0.35, 1, cord)}>
        {sides.map((sd) => (
          <rect key={sd} x={sd > 0 ? cx + xi[0] - 1 : cx - xi[1] - 1} y={cordTop} width={xi[1] - xi[0] + 2} height={yEnd - cordTop - 6} rx={8} fill={C.mesoIntermediate} stroke="rgba(110,20,10,0.6)" strokeWidth={1} />
        ))}
      </Part>
      {uro > 0.01 && (
        <Part id="giltzurruna" show={uro}>
          {sides.map((sd) =>
            Array.from({ length: 8 }, (_, j) => <ellipse key={`${sd}${j}`} cx={cx + sd * (xi[0] + xi[1]) * 0.5} cy={f1(cordTop + 26 + j * 24)} rx={5} ry={6.5} fill={KIDNEY} stroke="#9a4a22" strokeWidth={0.9} />),
          )}
        </Part>
      )}
      {uro > 0.01 && (
        <Part id="gonadak" show={uro}>
          {sides.map((sd) => (
            <rect key={sd} x={sd > 0 ? cx + 49 : cx - 54} y={yOf(SEC) - 34} width={5} height={78} rx={2.5} fill={GONAD} />
          ))}
        </Part>
      )}

      {/* Level of the transverse section. */}
      <path d={`M${cx - 150},${yOf(SEC) + 8} H${cx + 150}`} stroke="#e8eefc" strokeWidth={1.4} opacity={0.7} />
      <Note x={cx + 156} y={yOf(SEC) + 12} align="start" tone="dim" size={11}>
        Zeharkako mozketa
      </Note>

      {/* Level brackets. */}
      <path d={`M${cx - 140},${nepY(NEPH[0])} h-6 V${nepY(NEPH[1] - 1) + PITCH - 9} h6`} fill="none" stroke="#8a97b3" strokeWidth={1.2} />
      <Note x={cx - 152} y={(nepY(NEPH[0]) + nepY(NEPH[1] - 1)) / 2 + 4} align="end" tone="dim" size={11.5}>
        Lepoa / goiko toraxa
      </Note>
      <path d={`M${cx - 140},${cordTop} h-6 V${yEnd - 6} h6`} fill="none" stroke="#8a97b3" strokeWidth={1.2} opacity={lerp(0.4, 1, cord)} />
      <Note x={cx - 152} y={(cordTop + yEnd) / 2 + 30} align="end" tone="dim" size={11.5} show={lerp(0.4, 1, cord)}>
        Beheragoko atala
      </Note>

      <Label id="nefrotomak" x={190} y={200} ax={cx - xi[1]} ay={nepY(7) + 5} />
      <Label id="kordoi-nefrogenoa" x={810} y={400} ax={cx + xi[1] + 1} ay={cordTop + 120} show={cord} />
      <Label id="mesodermo-paraxiala" x={810} y={150} ax={cx + 48} ay={yOf(5) + 7} small />
      <Label id="alboko-mesodermoa" x={810} y={250} ax={cx + 104} ay={yOf(9)} small />
      <Label id="giltzurruna" x={810} y={530} ax={cx + (xi[0] + xi[1]) * 0.5 + 5} ay={cordTop + 26 + 5 * 24} show={uro} small />
      <Label id="gonadak" x={190} y={420} ax={cx - 54} ay={yOf(SEC) - 16} show={uro} small />
    </g>
  );
}

