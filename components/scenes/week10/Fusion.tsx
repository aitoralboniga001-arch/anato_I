'use client';

import { Label, Note, Part, clamp, lerp, mix, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { Stellate } from '@/components/scenes/week3/dorsalKit';
import { Defs10, Steps, T, arc, f1, mirror, offset, resample, sm, spline } from './common';
import { F, coelomRight, ectoBottomAt, ectoTopAt, range } from './flat';

/**
 * 10:bihotz-hodia `zeharkakoa` — enbrioiaren zeharkako mozketa bihotzaren mailan (dortsala goian). 1.
 * etapako mozketa gertukoa (flat.ts) bera da hasieran; zeharkako tolespenak alboko aldeak behera eta
 * erdirantz eramaten ditu: bi endokardio hodiak hurbildu eta fusionatzen dira; errai orriak hodia
 * inguratzen du (orri epimiokardikoa) eta miokardioa eta epikardioa ematen ditu; miokardioak bihotz
 * gelatina jariatzen du eta endokardio zelula batzuk bertara migratzen dute; azkenik mesokardio
 * dortsala desagertzen da eta perikardioaren zeharkako sinua geratzen da.
 */

/** Stage times of this topic's stage 2 (shared with the sagittal view). */
export const D2 = {
  fold: [0.1, 0.3],
  fuse: [0.32, 0.45],
  wrap: [0.47, 0.55],
  jelly: [0.59, 0.68],
  migrate: [0.62, 0.7],
  meso: [0.73, 0.8],
  arches: [0.85, 0.95],
} as const;

const N = 64;
type Key = readonly [readonly Pt[], readonly Pt[], readonly Pt[]];
const ease = (k: number) => (k < 0.5 ? sm(k * 2) : sm((k - 0.5) * 2));
/** Three key shapes (flat disc → folding → closed body), smoothly blended by k ∈ [0, 1]. */
function key3(k: number, [a, b, c]: Key, n = N): Pt[] {
  const [p, q] = k < 0.5 ? [a, b] : [b, c];
  const rp = resample(p, n);
  const rq = resample(q, n);
  const u = ease(k);
  return rp.map((pt, i) => [lerp(pt[0], rq[i][0], u), lerp(pt[1], rq[i][1], u)]);
}
const lerp3 = (k: number, a: Pt, b: Pt, c: Pt): Pt => {
  const u = ease(k);
  const [p, q] = k < 0.5 ? [a, b] : [b, c];
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
};
const num3 = (k: number, a: number, b: number, c: number) => lerp3(k, [a, 0], [b, 0], [c, 0])[0];

// ---------------------------------------------------------------------------------------------------
// Key shapes, right half (the left half is their mirror image about x = 500). A = stage 1's last
// frame exactly; B = halfway through the transverse fold; C = closed body round the heart.

/** Heart (C): centre, and the visceral ring's outer radii (growing as the jelly is secreted). */
const HC: Pt = [500, 452];
const ringR = (j: number) => [lerp(78, 96, j), lerp(60, 78, j)] as const;
const RING = 22; // epimyocardium thickness
const EPI = 9; // of which epicardium

// Surface ectoderm (from the neural fold outwards).
const ECTO: Key = [
  range(500 + F.plateHalf, F.x1 + 6, 40).map((x): Pt => [x, ectoTopAt(x)]),
  spline([[584, 104], [650, 112], [716, 152], [758, 226], [772, 316], [752, 404], [702, 462], [642, 492]], 8),
  spline([[500, 78], [620, 92], [712, 150], [758, 240], [770, 340], [752, 440], [700, 520], [610, 575], [500, 592]], 8),
];
const ECTO_IN: Key = [
  range(500 + F.plateHalf, F.x1 + 6, 40).map((x): Pt => [x, ectoBottomAt(x)]),
  offset(ECTO[1], -22),
  offset(ECTO[2], -16),
];
// Neural plate → neural tube: apical face (dorsal in A, the lumen in C) and basal face. Index 0 is the
// midline of the plate (the floor of the tube), the last index its edge (the roof, where the folds meet).
const NEURAL_AP: Key = [
  range(500, 500 + F.plateHalf, 24).map((x): Pt => [x, ectoTopAt(x)]),
  spline([[500, 202], [530, 188], [556, 158], [574, 124]], 8),
  arc(500, 152, 7, 40, 90, -90, 24),
];
const NEURAL_BA: Key = [
  range(500, 500 + F.plateHalf, 24).map((x): Pt => [x, ectoBottomAt(x)]),
  spline([[500, 234], [554, 214], [588, 170], [600, 124]], 8),
  arc(500, 152, 44, 58, 90, -90, 24),
];

// Coelom (pericardial cavity): its roof (parietal side) and its floor (visceral side), both from the
// medial tip outwards. In C the floor runs over the foregut, down the dorsal mesocardium and round the heart.
const FLAT_COELOM = coelomRight(1, 1.1);
const ROOF_B = spline([[628, 250], [684, 232], [726, 262], [734, 330], [716, 400], [682, 448], [656, 476]], 8);
const ROOF_C = spline([[592, 300], [648, 290], [700, 316], [722, 370], [716, 440], [686, 500], [630, 540], [566, 556], [500, 560]], 8);
const ROOF: Key = [FLAT_COELOM.top, ROOF_B, ROOF_C];
// Parietal layer: from the ectoderm (A) or a band outside the roof (B, C) to the roof.
const PAR_OUT: Key = [FLAT_COELOM.top.map((p): Pt => [p[0], ectoBottomAt(p[0]) + 1]), offset(ROOF_B, 16), offset(ROOF_C, 18)];
const FLOOR_B = spline([[628, 250], [668, 290], [682, 350], [670, 410], [660, 456], [656, 480]], 8);
const floorC = (j: number): Pt[] => {
  const [rx, ry] = ringR(j);
  return [...spline([[592, 300], [566, 326], [530, 340], [508, 352], [508, HC[1] - ry + 6]], 5), ...arc(HC[0], HC[1], rx, ry, -84, 90, 34)];
};
const floorKey = (j: number): Key => [FLAT_COELOM.bot, FLOOR_B, floorC(j)];
// Visceral layer's other face: on the endoderm (A, B); in C a thin sheet over the gut and the ring's inner face.
const visInC = (j: number) => {
  const f = floorC(j);
  return offset(f, (i) => -(i < 20 ? 12 : RING));
};
const visInKey = (j: number): Key => [FLAT_COELOM.bot.map((p): Pt => [p[0], F.endoTop - 1]), offset(FLOOR_B, -34), visInC(j)];
// Endoderm: flat sheet → groove → closed foregut (index 0 = the midline of the sheet = the gut's roof).
const ENDO: Key = [
  range(500, F.x1 + 6, 40).map((x): Pt => [x, F.endoTop]),
  spline([[500, 300], [540, 318], [562, 358], [568, 410], [596, 460], [640, 486]], 8),
  arc(500, 300, 40, 28, -90, 90, 30),
];
const ENDO_IN: Key = [range(500, F.x1 + 6, 40).map((x): Pt => [x, F.endoBot]), offset(ENDO[1], -20), arc(500, 300, 27, 15, -90, 90, 30)];

const M: [Pt, Pt, Pt] = [FLAT_COELOM.bot[0], [628, 250], [592, 300]];
const TUBE: [Pt, Pt, Pt] = [[F.tube[0], F.tube[1] - 4], [618, 410], HC];
const TUBE_R: [Pt, Pt, Pt] = [[49, 28], [40, 30], [52, 34]];

/** Yolk-sac wall: stage 1's arc → hanging from the folds → pinched off under the gut. */
const YOLK: Key = [
  [[F.x1 + 6, F.endoBot], ...arc(500, F.endoBot - 12, 454, 112, 52, 128, 40), [F.x0 - 6, F.endoBot]],
  spline([[640, 486], [690, 540], [600, 600], [500, 610], [400, 600], [310, 540], [360, 486]], 8),
  spline([[512, 330], [526, 344], [500, 356], [474, 344], [488, 330]], 6),
];
/** The transverse sinus: the cavity passing behind the heart where the dorsal mesocardium was. */
const sinusD = (k: number, top: number) => {
  const w = 30 * k;
  return `M${f1(500 - w)},${f1(top + 6)} C${f1(500 - w)},${f1(top - 8)} ${f1(500 - 10 * k)},${f1(top - 6)} ${f1(500 - 8 * k)},357 L${f1(500 + 8 * k)},357 C${f1(500 + 10 * k)},${f1(top - 6)} ${f1(500 + w)},${f1(top - 8)} ${f1(500 + w)},${f1(top + 6)}Z`;
};

const pathOf = (pts: readonly Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;
const band = (a: readonly Pt[], b: readonly Pt[]) => `${pathOf(a)}L${b.slice().reverse().map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`;
const flipAll = (pts: readonly Pt[], sd: 1 | -1): Pt[] => (sd > 0 ? [...pts] : pts.map((p) => mirror(p)));
const mid = (a: readonly Pt[], b: readonly Pt[], u: number): Pt => {
  const i = Math.round(u * (a.length - 1));
  return [(a[i][0] + b[i][0]) / 2, (a[i][1] + b[i][1]) / 2];
};

/** One endocardial tube (lumen with blood, endocardium round it); `out` 0..1 = cells leaving for the jelly. */
function Tube({ c, r, out, seed }: { c: Pt; r: Pt; out: number; seed: number }) {
  const [rx, ry] = r;
  const outer = arc(c[0], c[1], rx, ry, 0, 360, 40);
  const inner = arc(c[0], c[1], rx - 10, ry - 10, 0, 360, 40);
  return (
    <g>
      <path d={smoothPath(inner, true, 0.3)} fill={T.blood} />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx={f1(c[0] - rx * 0.6 + (i * rx * 1.2) / 7)} cy={f1(c[1] + Math.sin(i * 2.1 + seed) * ry * 0.35)} rx={3.4} ry={2.5} fill={T.island} stroke="rgba(70,8,14,0.6)" strokeWidth={0.6} />
      ))}
      <Cells outer={outer} inner={inner} n={22} fill={T.endocard} nucleus="rgba(120,20,70,0.7)" edge="rgba(120,20,70,0.4)" seed={seed} />
      <path d={smoothPath(outer, true, 0.3)} fill="url(#w10-ball)" pointerEvents="none" />
      {out > 0.01 &&
        Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + 0.26;
          const d = clamp(out * 1.3 - rand(i * 3.1) * 0.3);
          const p: Pt = [c[0] + Math.cos(a) * (rx + 3 + d * 13), c[1] + Math.sin(a) * (ry + 3 + d * 11)];
          return <ellipse key={`j${i}`} cx={f1(p[0])} cy={f1(p[1])} rx={3.4} ry={2.3} transform={`rotate(${f1((a * 180) / Math.PI + 90)} ${f1(p[0])} ${f1(p[1])})`} fill={T.endocard} stroke="rgba(120,20,70,0.6)" strokeWidth={0.7} />;
        })}
    </g>
  );
}

export function FusionArt({ t }: { t: number }) {
  // Folding: a little during the cephalocaudal fold, then the transverse fold proper.
  const k = 0.12 * seg(t, D2.fold[0], D2.fold[1]) + 0.88 * seg(t, D2.fuse[0], D2.fuse[1] + 0.02);
  const wrap = seg(t, D2.wrap[0], D2.wrap[1]);
  // Late in the step (the class names the layer near its line's end), done before it settles (the next step minus 0.035).
  const split = seg(t, D2.wrap[1] - 0.008, D2.wrap[1] + 0.002);
  const jelly = seg(t, D2.jelly[0], D2.jelly[1]);
  const mig = seg(t, D2.migrate[0], D2.migrate[1]);
  const meso = seg(t, D2.meso[0], D2.meso[1]);
  const closed = seg(k, 0.9, 1);

  const ecto = key3(k, ECTO);
  const ectoIn = key3(k, ECTO_IN);
  const nAp = key3(k, NEURAL_AP, 30);
  const nBa = key3(k, NEURAL_BA, 30);
  const roof = key3(k, ROOF, 48);
  const parOut = key3(k, PAR_OUT, 48);
  const floor = key3(k, floorKey(jelly), 72);
  const visIn = key3(k, visInKey(jelly), 72);
  const endo = key3(k, ENDO);
  const endoIn = key3(k, ENDO_IN);
  const m = lerp3(k, ...M);
  const tube = lerp3(k, ...TUBE);
  const tubeR = lerp3(k, ...TUBE_R);
  const noto = lerp3(k, F.noto, [500, 246], [500, 234]);
  const notoR = num3(k, F.notoR, 17, 15);
  const ao = lerp3(k, F.aorta, [560, 280], [550, 262]);
  const aoR = num3(k, F.aortaR, 15, 14);
  const [rx, ry] = ringR(jelly);
  const heartTop = HC[1] - ry;

  // Edges of the flat close-up fade (the disc goes on beyond the frame); the folded body is whole.
  const fadeK = seg(k, 0, 0.35);
  const fadeW = F.fade * (1 - fadeK);
  const amn = 1 - seg(k, 0.02, 0.22);
  const yolk = 1 - seg(k, 0.55, 0.95);

  // Cavities and layers, right half (mirrored for the left).
  const coelom = [...roof, ...floor.slice().reverse()];
  const roofLining = offset(roof, 9);
  const floorLining = offset(floor, -10);
  // Whole body (mesoderm fill): inside the ectoderm, above the endoderm.
  const bodyR = [...nBa, ...ectoIn, ...endo.slice().reverse()];
  // Both halves in one path: no seam where they meet in the midline.
  const halves = (pts: readonly Pt[]) => `${pathOf(pts)}Z${pathOf(pts.map((p) => mirror(p)))}Z`;
  // Yolk sac: from one lateral end of the endoderm to the other, under the body.
  const yolkWall = key3(k, YOLK, 60);
  const amnOut = arc(500, 186, 460, 140, 180, 360, 70);
  const amnIn = arc(500, 186, 452, 132, 180, 360, 70);

  // The visceral ring round the fused tube (C): the epimyocardial layer, then myocardium + epicardium.
  const ringOut = arc(HC[0], HC[1], rx, ry, -90, 270, 72);
  const ringMid = arc(HC[0], HC[1], rx - EPI, ry - EPI, -90, 270, 72);
  const ringIn = arc(HC[0], HC[1], rx - RING, ry - RING, -90, 270, 72);

  // Label anchors that follow the shapes.
  const parA = mid(parOut, roof, lerp(0.5, 0.3, k));
  const visA = lerp3(k, [720, 392], mid(floor, visIn, 0.2), mid(floor, visIn, 0.16));
  // Cardiac jelly: halfway between the endocardium's outer edge and the ring's inner edge, so the dot stays in the band as it widens.
  const jellyA: Pt = [HC[0] + Math.cos(0.38) * (TUBE_R[2][0] + rx - RING) / 2, HC[1] + Math.sin(0.38) * (TUBE_R[2][1] + ry - RING) / 2];
  const caveA: Pt = k < 0.5 ? mid(roof, floor, 0.55) : lerp3(k, mid(roof, floor, 0.55), mid(roof, floor, 0.55), [580, 520]);

  return (
    <g>
      <Defs10 />
      <defs>
        <linearGradient id="w10f-fadeg" x1={F.x0} x2={F.x1} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity={fadeK} />
          <stop offset={(Math.max(0.001, fadeW) / (F.x1 - F.x0)).toFixed(3)} stopColor="#fff" stopOpacity={1} />
          <stop offset={(1 - Math.max(0.001, fadeW) / (F.x1 - F.x0)).toFixed(3)} stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={fadeK} />
        </linearGradient>
        <mask id="w10f-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640">
          <rect x={0} y={0} width={1000} height={640} fill="#fff" opacity={fadeK} />
          <rect x={F.x0} y={0} width={F.x1 - F.x0} height={640} fill="url(#w10f-fadeg)" />
        </mask>
      </defs>

      <g mask="url(#w10f-fade)">
        {/* Amnion over the flat disc (it is left out as the body closes) and the yolk sac under it. */}
        <g opacity={amn}>
          <Part id="amnios-barrunbea" quiet>
            <path d={pathOf([...amnIn, ...ecto.slice().reverse(), ...nAp.slice().reverse().map((p) => p), ...nAp.map((p) => mirror(p)), ...ecto.map((p) => mirror(p)).reverse()]) + 'Z'} fill={T.amnionCavity} />
          </Part>
          <Part id="amnioblastoak" quiet>
            <Cells outer={amnOut} inner={amnIn} n={70} fill={T.amnion} nucleus="rgba(30,60,140,0.6)" seed={3} />
          </Part>
        </g>
        <Part id="bitelo-zaku-sekundarioa" show={yolk}>
          <path d={pathOf([...endoIn, ...yolkWall.slice(1, -1), ...endoIn.map((p) => mirror(p)).reverse()]) + 'Z'} fill={T.yolk} />
          <Cells outer={yolkWall} inner={offset(yolkWall, 10)} n={56} fill={T.endo} nucleus="rgba(90,60,10,0.7)" seed={5} />
        </Part>

        {/* The body's mesoderm (cavities, gut, tube and vessels are drawn over it). */}
        <Part id="mesodermo-intraenbrionarioa" quiet>
          <path d={halves(bodyR)} fill={T.mesoDeep} />
          <path d={halves(bodyR)} fill="url(#w10-mes)" />
          {Array.from({ length: 30 }, (_, i) => {
            const sd = i % 2 ? 1 : -1;
            const p = lerp3(k, [500 + sd * lerp(30, 110, rand(i * 2.7)), lerp(220, 396, rand(i * 4.1))], [500 + sd * lerp(28, 70, rand(i * 2.7)), lerp(220, 300, rand(i * 4.1))], [500 + sd * lerp(26, 70, rand(i * 2.7)), lerp(200, 280, rand(i * 4.1))]);
            const nearNoto = Math.hypot(p[0] - noto[0], p[1] - noto[1]) < notoR + 8;
            const nearAo = Math.hypot(Math.abs(p[0] - 500) - (ao[0] - 500), p[1] - ao[1]) < aoR + 8;
            const nearGut = k > 0.5 && Math.hypot((p[0] - 500) / 46, (p[1] - 300) / 34) < 1;
            if (nearNoto || nearAo || nearGut) return null;
            return <Stellate key={i} x={p[0]} y={p[1]} r={2.6} a={rand(i * 9.1) * 180} color={T.paraxial} />;
          })}
        </Part>

        {([1, -1] as const).map((sd) => {
          const f = (pts: readonly Pt[]) => flipAll(pts, sd);
          return (
            <g key={sd}>
              {/* Parietal layer: under the ectoderm, the coelom's roof. */}
              <Part id="paretako-orria">
                <path d={band(f(parOut), f(roof))} fill={mix(T.parietal, '#1a0a10', 0.5)} />
                <path d={band(f(parOut), f(roof))} fill="url(#w10-mes)" />
                <Cells outer={f(roofLining)} inner={f(roof)} n={22} fill={T.parietal} nucleus="rgba(120,20,30,0.7)" edge="rgba(120,20,30,0.35)" seed={11 + sd} />
              </Part>
              {/* Visceral layer: the coelom's floor (on the endoderm, then round the tube). */}
              <Part id="errai-orria">
                <path d={band(f(floor), f(visIn))} fill={mix(T.visceral, '#1a0a10', 0.55)} />
                <path d={band(f(floor), f(visIn))} fill="url(#w10-mes)" />
                <Cells outer={f(floorLining)} inner={f(floor)} n={30} fill={T.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={21 + sd} />
              </Part>
            </g>
          );
        })}

        {/* Pericardial cavity (coelom): both halves in one path; they meet under the heart. */}
        <Part id="perikardio-barrunbea">
          <path d={halves([m, ...coelom.slice(1)])} fill={T.space} />
          <path d={halves([m, ...coelom.slice(1)])} fill={T.peri} />
        </Part>

        {/* Dorsal mesocardium: the two visceral layers back to back, from the gut down to the heart. */}
        <Part id="mesokardio-dortsala" show={closed * (1 - meso)}>
          <path d={`M490,352 L490,${f1(heartTop + 4)} L510,${f1(heartTop + 4)} L510,352Z`} fill={T.visceral} />
          <path d={`M490,352 L490,${f1(heartTop + 4)} L510,${f1(heartTop + 4)} L510,352Z`} fill="url(#w10-mes)" />
          <path d={`M500,354 L500,${f1(heartTop + 2)}`} stroke="rgba(90,10,24,0.6)" strokeWidth={1} />
        </Part>
        {/* It goes: the cavity passes behind the heart — the transverse pericardial sinus. */}
        <Part id="perikardioaren-zeharkako-sinua" show={meso}>
          <path d={sinusD(meso, heartTop)} fill={T.space} />
          <path d={sinusD(meso, heartTop)} fill={T.peri} />
        </Part>

        {/* Cardiac jelly between the endocardium and the myocardium. */}
        <Part id="bihotz-gelatina" show={jelly * closed}>
          <path d={smoothPath(ringIn, true, 0.3)} fill={T.jelly} opacity={0.55} />
          <path d={smoothPath(ringIn, true, 0.3)} fill="url(#w10-jelly)" />
        </Part>

        {/* Round the fused tube the visceral layer is the epimyocardial layer; it gives myocardium and epicardium. */}
        {wrap > 0.01 && (
          <g opacity={closed}>
            <Part id="orri-epimiokardikoa" show={wrap * (1 - split)}>
              <Cells outer={ringOut} inner={ringIn} n={40} fill={T.epimyo} nucleus="rgba(90,10,40,0.75)" edge="rgba(90,10,40,0.35)" seed={25} />
            </Part>
            <Part id="miokardioa" show={split} groups={["bihotz-hodia"]}>
              <Cells outer={ringMid} inner={ringIn} n={40} fill={T.myocard} nucleus="rgba(70,6,30,0.75)" edge="rgba(70,6,30,0.4)" seed={27} />
            </Part>
            <Part id="epikardioa" show={split}>
              <Cells outer={ringOut} inner={ringMid} n={52} fill={T.epicard} nucleus="rgba(120,40,60,0.6)" edge="rgba(120,40,60,0.35)" seed={29} />
            </Part>
          </g>
        )}

        {/* Endocardial tubes: two, coming together and fusing into one. */}
        {closed < 0.98 && (
          <Part id="bihotz-hodiak" show={1 - closed}>
            {[tube, mirror(tube)].map((c, i) => (
              <Tube key={i} c={c} r={tubeR} out={0} seed={31 + i} />
            ))}
          </Part>
        )}
        {closed > 0.02 && (
          <Part id="endokardioa" show={closed} groups={["bihotz-hodia"]}>
            <Tube c={HC} r={TUBE_R[2]} out={mig} seed={35} />
          </Part>
        )}

        <Part id="notokorda">
          <circle cx={f1(noto[0])} cy={f1(noto[1])} r={f1(notoR)} fill={T.noto} stroke="#4c1d95" strokeWidth={1.2} />
          <circle cx={f1(noto[0])} cy={f1(noto[1])} r={f1(notoR)} fill="url(#w10-ball)" />
        </Part>
        <Part id="aorta-dortsalak">
          {[ao, mirror(ao)].map((c, i) => (
            <g key={i}>
              <circle cx={f1(c[0])} cy={f1(c[1])} r={f1(aoR)} fill={T.aorta} stroke={T.aortaDeep} strokeWidth={1.4} />
              <circle cx={f1(c[0])} cy={f1(c[1])} r={f1(aoR * 0.62)} fill={T.blood} />
              <circle cx={f1(c[0])} cy={f1(c[1])} r={f1(aoR)} fill="url(#w10-ball)" />
            </g>
          ))}
        </Part>

        {/* Endoderm: the floor of the disc folds into the foregut. */}
        <Part id={k > 0.6 ? 'aurreko-hestea' : 'endodermoa'}>
          {([1, -1] as const).map((sd) => (
            <Cells key={sd} outer={flipAll(endo, sd)} inner={flipAll(endoIn, sd)} n={34} fill={T.endo} nucleus="rgba(90,60,10,0.7)" edge="rgba(90,60,10,0.4)" seed={41 + sd} />
          ))}
          {k > 0.6 && <path d={smoothPath([...ENDO_IN[2], ...ENDO_IN[2].map((p) => mirror(p)).reverse()], true, 0.3)} fill="#2c2010" opacity={seg(k, 0.75, 1)} />}
        </Part>

        {/* Neural plate → neural tube. */}
        <Part id={k > 0.6 ? 'hodi-neurala' : 'plaka-neurala'}>
          {([1, -1] as const).map((sd) => (
            <Cells key={sd} outer={flipAll(nAp, sd)} inner={flipAll(nBa, sd)} n={20} fill={T.neural} nucleus="rgba(10,20,70,0.75)" pseudo seed={61 + sd} />
          ))}
          {k > 0.85 && <path d={smoothPath([...NEURAL_AP[2], ...NEURAL_AP[2].map((p) => mirror(p)).reverse()], true, 0.3)} fill="#0f1530" opacity={seg(k, 0.85, 1)} />}
        </Part>
        <Part id="ektodermoa">
          {([1, -1] as const).map((sd) => (
            <Cells key={sd} outer={flipAll(ecto, sd)} inner={flipAll(ectoIn, sd)} n={36} fill={T.ecto} nucleus="rgba(20,40,110,0.7)" pseudo seed={51 + sd} />
          ))}
        </Part>
      </g>

      {/* Left column (structures on the left), right column (on the right); orders kept so leaders never cross. */}
      <Label id={k > 0.6 ? 'hodi-neurala' : 'plaka-neurala'} x={210} y={110} ax={mirror(mid(nAp, nBa, 0.3))[0]} ay={mid(nAp, nBa, 0.3)[1]} />
      <Label id="paretako-orria" x={210} y={lerp(220, 300, seg(k, 0.5, 1))} ax={mirror(parA)[0]} ay={parA[1]} />
      <Label id="perikardio-barrunbea" x={210} y={lerp(280, 520, seg(k, 0.5, 1))} ax={mirror(caveA)[0]} ay={caveA[1]} />
      <Label id="mesokardio-dortsala" x={210} y={380} ax={496} ay={lerp(352, heartTop, 0.5)} show={closed * (1 - meso) * seg(t, D2.meso[0] - 0.12, D2.meso[0] - 0.02)} />
      {k <= 0.6 && <Label id="endodermoa" x={210} y={430} ax={mirror(mid(endo, endoIn, 0.5))[0]} ay={mid(endo, endoIn, 0.5)[1]} />}
      <Label id="ektodermoa" x={790} y={76} ax={mid(ecto, ectoIn, 0.3)[0]} ay={mid(ecto, ectoIn, 0.3)[1]} small />
      <Label id="notokorda" x={790} y={190} ax={noto[0] + 3} ay={noto[1]} />
      <Label id="aorta-dortsalak" x={790} y={236} ax={ao[0] + 3} ay={ao[1]} />
      {k > 0.6 && <Label id="aurreko-hestea" x={790} y={280} ax={mid(endo, endoIn, 0.5)[0]} ay={mid(endo, endoIn, 0.5)[1]} />}
      <Label id="bihotz-hodiak" x={790} y={lerp(340, 300, k)} ax={tube[0] + 12} ay={tube[1]} show={1 - closed} text="Endokardio hodiak" />
      <Label id="errai-orria" x={790} y={lerp(392, 320, k)} ax={visA[0]} ay={visA[1]} />
      <Label id="perikardioaren-zeharkako-sinua" x={774} y={360} ax={500} ay={(357 + heartTop) / 2} show={meso} small />
      <Label id="epikardioa" x={790} y={420} ax={HC[0] + rx - EPI / 2} ay={HC[1] - 8} show={split} />
      <Label id="orri-epimiokardikoa" x={790} y={456} span={[[HC[0] + rx - RING + 3, HC[1] + 8], [HC[0] + rx - 3, HC[1] + 8]]} show={wrap * (1 - split) * closed} />
      <Label id="miokardioa" x={790} y={456} ax={HC[0] + rx - EPI - (RING - EPI) / 2} ay={HC[1] + 8} show={split} />
      <Label id="bihotz-gelatina" x={790} y={496} ax={jellyA[0]} ay={jellyA[1]} show={jelly * closed} />
      <Label id="endokardioa" x={790} y={540} ax={HC[0] + 14} ay={HC[1] + 28} show={closed} />
      {/* The whole tube (its layers glow): a bracket under it, edge to edge. */}
      <Label id="bihotz-hodia" x={210} y={600} span={[[HC[0] - rx, HC[1] + ry + 8], [HC[0] + rx, HC[1] + ry + 8]]} show={closed} />
    </g>
  );
}

/** 10:bihotz-hodia `zeharkakoa`. */
export function FusionSection({ t }: SceneProps) {
  return (
    <g>
      <FusionArt t={t} />
      <Note x={500} y={22} size={12.5} tone="dim">
        3. aste bukaera – 4. astea · zeharkako mozketa bihotzaren mailan
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Diskoa laua da oraindik: bi endokardio hodiak alboetan'],
          [0.32, 'Zeharkako tolespena: alboko aldeak hurbildu eta bi endokardio hodiak fusionatu'],
          [0.47, 'Errai orria hodiaren inguruan: orri epimiokardikoa → miokardioa eta epikardioa'],
          [0.59, 'Miokardioak bihotz gelatina jariatzen du; endokardio zelula batzuk bertara migratzen dute'],
          [0.73, 'Mesokardio dortsala desagertu: perikardioaren zeharkako sinua'],
        ]}
      />
    </g>
  );
}
