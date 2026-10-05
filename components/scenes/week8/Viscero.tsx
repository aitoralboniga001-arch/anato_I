'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mesCells, offset, resample, spline, vis } from './common';

/**
 * 8:errai-kraneoa — apunteen 3.2 atala eta haren bi irudiak (5. asteko burua arkuekin; jaioberriaren burezurra
 * arkuetako deribatuekin). Bi ikuspegi, aurpegia ezkerrera:
 * - `arkuak`: gandor neuraletako zelulak arku faringeoetara iristen dira; 1. arkua prozesu maxilarra eta barail
 *   prozesua bihurtzen da; haietan barra pterigopalatino karratua eta Meckel kartilagoa, 2. arkuan Reichert-ena.
 * - `burezurra`: deribatuak (kolorea = zein kartilago/prozesutatik), hezurtxoen hurbilketa, aurpegiaren hazkuntza
 *   (sinuak eta apofisi albeolarrak) eta, amaieran, jatorriaren koloreak (gandor neurala / mesodermo paraxiala).
 */

export const VK_T = { crest: 0, split: 0.09, ptq: 0.18, meckel: 0.27, reichert: 0.36, maxD: 0.46, manD: 0.56, hyoD: 0.65, ear: 0.74, growth: 0.82, origin: 0.92 };

/** One colour per arch family: what came from the maxillary process, the mandibular process, the 2nd (hyoid) arch. */
const F = { max: '#fb923c', maxDeep: '#b45309', man: '#f472b6', manDeep: '#9d174d', hyo: '#60a5fa', hyoDeep: '#1d4ed8' };
const TISSUE = '#e7c3b2';
const TISSUE_EDGE = '#9a6f60';

const path = (pts: readonly Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;
const closed = (pts: readonly Pt[]) => `${path(pts)}Z`;
/** A band round a centre line, its half-width a function of the position along it (0 at the dorsal end). */
const band = (c: readonly Pt[], w: (u: number) => number): Pt[] => {
  const n = c.length - 1;
  return [...offset(c, (i) => w(i / n)), ...offset(c, (i) => -w(i / n)).reverse()];
};
/** The first fraction k of a centre line. */
const part = (c: readonly Pt[], k: number) => {
  const r = resample(c, 60);
  return r.slice(0, Math.max(2, Math.round(k * 59) + 1));
};

// ——— View `arkuak`: the head at 5 weeks, from the left side (face to the left) ———
const HEAD = spline(
  [[212, 300], [222, 210], [270, 140], [350, 92], [450, 72], [560, 84], [650, 128], [720, 196], [764, 290], [786, 400], [796, 520], [800, 650], [360, 650], [318, 610], [254, 580], [222, 520], [236, 470], [276, 444], [300, 424], [270, 404], [232, 372]],
  8,
  true,
);
const ARCH: { id: number; c: Pt[]; w: number }[] = [
  { id: 1, c: spline([[562, 292], [538, 340], [492, 384], [424, 414], [352, 424]], 8), w: 25 },
  { id: 2, c: spline([[608, 314], [588, 370], [542, 420], [472, 452], [410, 464]], 8), w: 20 },
  { id: 3, c: spline([[646, 350], [630, 402], [592, 446], [540, 474]], 8), w: 15 },
  { id: 4, c: spline([[678, 392], [666, 434], [636, 470], [600, 490]], 8), w: 11 },
];
const archBand = (a: (typeof ARCH)[number]) => band(a.c, (u) => a.w * (0.75 + 0.35 * Math.sin(Math.PI * Math.min(1, u * 1.2))));
const MAXC = spline([[552, 300], [506, 326], [444, 342], [378, 346]], 8);
const PTQ = spline([[538, 308], [500, 326], [452, 338]], 8);
const MECKEL = spline([[558, 298], [532, 344], [488, 386], [422, 412], [366, 420]], 8);
const REICHERT = spline([[606, 318], [586, 372], [540, 420], [478, 450]], 8);
const STOMO: Pt = [318, 392];
const EYE: Pt = [312, 300];
/** The cranial neural crest, along the dorsal edge of the hindbrain, and the four streams into the arches. */
const CREST = spline([[430, 84], [520, 82], [610, 112], [688, 172], [740, 252]], 8);
const STREAMS: Pt[][] = [
  [[560, 92], [570, 200], [520, 352]],
  [[630, 128], [624, 240], [566, 400]],
  [[690, 176], [670, 290], [610, 436]],
  [[728, 232], [702, 330], [646, 462]],
];
const quad = (p: Pt[], u: number): Pt => {
  const [a, c, b] = p;
  return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
};
const ARCH_CELLS = ARCH.map((a, i) => mesCells((x, y) => inPoly(archBand(a), x, y), [330, 270, 700, 520], 13, 40 + i * 7));
const MAX_CELLS = mesCells((x, y) => inPoly(band(MAXC, (u) => 17 * (1 - 0.3 * u)), x, y), [360, 290, 570, 370], 12, 77);

/** A cartilage rod condensing along its centre line (dorsal end first), with an optional knob at the dorsal end. */
function Rod({ c, k, w, fill, deep, knob }: { c: Pt[]; k: number; w: number; fill: string; deep: string; knob?: number }) {
  if (k <= 0.01) return null;
  const pts = part(c, k);
  return (
    <g>
      <path d={path(pts)} fill="none" stroke={deep} strokeWidth={w * 2 + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(pts)} fill="none" stroke={fill} strokeWidth={w * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(pts)} fill="none" stroke="url(#w8-cart)" strokeWidth={w * 2} strokeLinecap="round" opacity={0.7} />
      {knob ? <circle cx={c[0][0]} cy={c[0][1]} r={knob * Math.min(1, k * 2)} fill={fill} stroke={deep} strokeWidth={1.5} /> : null}
    </g>
  );
}

export function FaceArches({ t, reduced }: SceneProps) {
  const crestFlow = seg(t, 0.01, 0.07);
  const split = seg(t, VK_T.split + 0.005, VK_T.split + 0.05);
  const ptq = seg(t, VK_T.ptq + 0.005, VK_T.ptq + 0.05);
  const mec = seg(t, VK_T.meckel + 0.005, VK_T.meckel + 0.05);
  const rei = seg(t, VK_T.reichert + 0.005, VK_T.reichert + 0.05);
  const arch12 = vis(t, VK_T.split);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      {/* The embryo's head, covered by surface ectoderm. */}
      <path d={smoothPath(HEAD, true, 0.3)} fill={TISSUE} />
      <path d={smoothPath(HEAD, true, 0.3)} fill="url(#w8-light)" />
      <Part id="bihotz-goragunea" quiet>
        <ellipse cx={318} cy={560} rx={92} ry={74} fill="#d49a8c" stroke={TISSUE_EDGE} strokeWidth={1.2} />
      </Part>
      <Part id="begia">
        <circle cx={EYE[0]} cy={EYE[1]} r={19} fill="#3b2a2a" stroke={TISSUE_EDGE} strokeWidth={1.5} />
        <circle cx={EYE[0] - 3} cy={EYE[1] - 2} r={8} fill="#9fb4d8" />
      </Part>
      <Part id="estomodeoa">
        <ellipse cx={STOMO[0]} cy={STOMO[1]} rx={34} ry={12} fill="#3a1d22" stroke={TISSUE_EDGE} strokeWidth={1.2} />
      </Part>

      {/* The pharyngeal arches: mesenchyme swellings side by side, grooves between them. */}
      <Part id="faringe-arkuak">
        {ARCH.map((a) => (
          <g key={a.id}>
            <path d={smoothPath(archBand(a), true, 0.3)} fill="#dcae9c" stroke={TISSUE_EDGE} strokeWidth={1.6} />
            <path d={smoothPath(archBand(a), true, 0.3)} fill="url(#w8-boneshade)" opacity={0.5} />
            {/* The mesodermal core of each arch (it gives the muscles). */}
            <path d={path(part(a.c, 0.85))} fill="none" stroke={Q.paraxial} strokeWidth={a.w * 0.45} strokeLinecap="round" opacity={0.55} />
          </g>
        ))}
      </Part>
      {/* The 1st arch: its dorsal part grows forward under the eye as the maxillary process… */}
      <Part id="prozesu-maxilarra" show={split > 0.01 ? 1 : 0}>
        <path d={smoothPath(band(part(MAXC, split), (u) => 17 * (1 - 0.3 * u)), true, 0.3)} fill="#dcae9c" stroke={F.maxDeep} strokeWidth={2} />
      </Part>
      {/* …its ventral part, below the primitive mouth, is the mandibular process. */}
      <Part id="barail-prozesua" show={arch12}>
        <path d={smoothPath(archBand(ARCH[0]), true, 0.3)} fill="none" stroke={F.manDeep} strokeWidth={2.6} />
      </Part>
      <Part id="hioide-arkua" show={arch12}>
        <path d={smoothPath(archBand(ARCH[1]), true, 0.3)} fill="none" stroke={F.hyoDeep} strokeWidth={2.6} />
      </Part>

      {/* Neural crest cells reach the arches and make their mesenchyme. */}
      <Part id="gandor-neurala">
        <path d={path(CREST)} fill="none" stroke={Q.crest} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        {ARCH_CELLS.flatMap((cells, i) =>
          cells.map((c, j) => {
            const arrive = seg(crestFlow, (j % 7) * 0.06 + i * 0.05, (j % 7) * 0.06 + i * 0.05 + 0.4);
            if (arrive <= 0.01) return null;
            const from = quad(STREAMS[i], 0);
            const p: Pt = arrive < 1 ? [lerp(from[0], c.p[0], arrive), lerp(from[1], c.p[1], arrive)] : c.p;
            const pulled = i === 0 ? mec : i === 1 ? rei : 0;
            const toward = i === 0 ? MECKEL[Math.min(MECKEL.length - 1, Math.round((j / cells.length) * (MECKEL.length - 1)))] : REICHERT[Math.min(REICHERT.length - 1, Math.round((j / cells.length) * (REICHERT.length - 1)))];
            const q: Pt = pulled > 0 ? [lerp(p[0], toward[0], 0.35 * pulled), lerp(p[1], toward[1], 0.35 * pulled)] : p;
            return <MesCell key={`${i}-${j}`} p={q} r={0.62} a={c.a + (reduced ? 0 : t * 90)} fill={Q.crest} opacity={0.9} />;
          }),
        )}
        {MAX_CELLS.map((c, j) => {
          const k = seg(split, 0.3 + (j % 5) * 0.1, 0.8 + (j % 5) * 0.04);
          if (k <= 0.01) return null;
          const q: Pt = ptq > 0 ? [lerp(c.p[0], c.p[0], 1), lerp(c.p[1], 328 + (c.p[0] - 452) * -0.2, 0.3 * ptq)] : c.p;
          return <MesCell key={`m${j}`} p={q} r={0.6} a={c.a} fill={Q.crest} opacity={0.9 * k} />;
        })}
        {STREAMS.map((s, i) =>
          Array.from({ length: 5 }, (_, j) => {
            const u = (j / 5 + (reduced ? 0 : t * 14)) % 1;
            const show = vis(t, 0, VK_T.split) * Math.min(1, u * 5, (1 - u) * 5);
            return show > 0.02 ? <MesCell key={`s${i}${j}`} p={quad(s, u)} r={0.9} a={j * 60} fill={Q.crest} opacity={show} /> : null;
          }),
        )}
      </Part>
      <Part id="azaleko-ektodermoa" quiet>
        <path d={smoothPath(HEAD, true, 0.3)} fill="none" stroke={Q.skin} strokeWidth={3} />
      </Part>

      {/* The cartilages: pterygoquadrate bar (maxillary process), Meckel (mandibular), Reichert (2nd arch). */}
      <Part id="barra-pterigopalatino-karratua" show={ptq > 0.01 ? 1 : 0}>
        <Rod c={PTQ} k={ptq} w={6} fill={F.max} deep={F.maxDeep} knob={8} />
      </Part>
      <Part id="meckel-kartilagoa" show={mec > 0.01 ? 1 : 0}>
        <Rod c={MECKEL} k={mec} w={6.5} fill={F.man} deep={F.manDeep} knob={11} />
      </Part>
      <Part id="reichert-kartilagoa" show={rei > 0.01 ? 1 : 0}>
        <Rod c={REICHERT} k={rei} w={5.5} fill={F.hyo} deep={F.hyoDeep} knob={8} />
      </Part>

      {/* Arch numbers (text above every line). */}
      {ARCH.map((a) => {
        const p = a.c[a.c.length - 1];
        return (
          <text key={a.id} x={p[0] - 2} y={p[1] + a.w + 18} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff" stroke="#0f0f11" strokeWidth={3} paintOrder="stroke">
            {['I', 'II', 'III', 'IV'][a.id - 1]}
          </text>
        );
      })}

      <Note x={500} y={30} size={12}>
        Burua alboz · 5. astea (aurpegia ezkerrera)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, VK_T.split)}>
        Gandor neuraletako zelulak arku faringeoetara: haien mesenkimatik aurpegiko hezurrak (ektodermikoak)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.split, VK_T.ptq)}>
        1. arkua: atal dortsala = prozesu maxilarra · atal bentrala = barail prozesua
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.ptq, VK_T.meckel)}>
        Prozesu maxilarrean: barra pterigopalatino karratua
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.meckel, VK_T.reichert)}>
        Barail prozesuan: Meckel kartilagoa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.reichert)}>
        Barail prozesutik eta 2. arkutik (hioide arkua): Reichert kartilagoa
      </Note>

      <Label id="gandor-neurala" x={810} y={110} ax={CREST[18][0]} ay={CREST[18][1]} />
      <Label id="azaleko-ektodermoa" x={810} y={200} ax={760} ay={300} small />
      <Label id="faringe-arkuak" x={810} y={470} ax={ARCH[3].c[6][0] + 6} ay={ARCH[3].c[6][1]} />
      <Label id="hioide-arkua" x={810} y={530} ax={ARCH[1].c[22][0]} ay={ARCH[1].c[22][1] + 12} show={arch12} />
      <Label id="reichert-kartilagoa" x={810} y={380} ax={REICHERT[10][0] + 4} ay={REICHERT[10][1]} show={rei} />
      <Label id="begia" x={190} y={250} ax={EYE[0] - 16} ay={EYE[1] - 8} small />
      <Label id="prozesu-maxilarra" x={190} y={360} ax={MAXC[Math.min(MAXC.length - 1, 22)][0]} ay={MAXC[Math.min(MAXC.length - 1, 22)][1] + 8} show={split} />
      <Label id="barra-pterigopalatino-karratua" x={254} y={150} ax={PTQ[8][0]} ay={PTQ[8][1] - 6} show={ptq} />
      <Label id="estomodeoa" x={190} y={402} ax={STOMO[0] - 30} ay={STOMO[1]} small />
      <Label id="barail-prozesua" x={190} y={450} ax={ARCH[0].c[28][0]} ay={ARCH[0].c[28][1] + 18} show={arch12} />
      <Label id="meckel-kartilagoa" x={810} y={280} ax={MECKEL[4][0] + 6} ay={MECKEL[4][1]} show={mec} />
      <Label id="bihotz-goragunea" x={190} y={560} ax={240} ay={560} small />
    </g>
  );
}

// ——— View `burezurra`: the newborn skull from the left (face to the left), as in the notes' figure ———
const SKULL = spline([[250, 300], [266, 200], [320, 126], [410, 80], [520, 66], [630, 88], [714, 146], [764, 230], [780, 320], [764, 400], [720, 456], [650, 486], [580, 480]], 8);
const FRONTAL_B: Pt[] = [[262, 290], [276, 196], [330, 128], [420, 86], [446, 150], [440, 230], [404, 290], [340, 318]];
const PARIETAL_B: Pt[] = [[454, 80], [552, 68], [650, 98], [702, 160], [690, 250], [640, 300], [566, 290], [500, 298], [452, 232], [452, 150]];
const OCCIPITAL_B: Pt[] = [[712, 172], [756, 240], [774, 320], [748, 400], [700, 448], [650, 428], [662, 336], [700, 262]];
const SQUAMA_T: Pt[] = [[500, 330], [528, 296], [580, 288], [624, 306], [636, 346], [612, 380], [566, 392], [522, 384], [488, 378], [446, 378], [430, 368], [448, 362], [490, 360]];
const MALAR: Pt[] = [[350, 356], [372, 350], [398, 352], [430, 362], [438, 376], [414, 390], [388, 396], [364, 388]];
const MAXILLA: Pt[] = [[288, 316], [302, 320], [306, 358], [340, 364], [374, 374], [392, 396], [384, 420], [356, 434], [316, 440], [290, 430], [282, 400], [284, 352]];
const MANDIBLE: Pt[] = [[290, 456], [340, 448], [404, 450], [452, 432], [470, 394], [490, 388], [494, 422], [478, 458], [420, 482], [340, 488], [296, 478]];
const ORBIT_B: Pt = [328, 330];
const EAR_C: Pt = [540, 402];
const MECKEL_B = spline([[304, 466], [362, 468], [424, 460], [472, 428], [522, 400]], 8);
const REICHERT_B = spline([[556, 406], [552, 440], [528, 478], [494, 506]], 8);
const STYLOID: Pt[] = [[548, 404], [558, 410], [530, 470], [524, 468]];
const HYOID: Pt[] = [[452, 506], [486, 498], [500, 510], [486, 520], [452, 522], [440, 514]];
/** Face growth after birth: the face bones scale up from the jaw corner. */
const FACE_ORIGIN: Pt = [470, 400];

/** A bone that ossifies out of a centre to fill its shape (membranous growth). */
function Grow({ id, pts, c, k, fill, deep, uid }: { id: string; pts: Pt[]; c: Pt; k: number; fill: string; deep: string; uid: string }) {
  const cid = useId().replace(/:/g, '');
  if (k <= 0.01) return null;
  const r = 140 * k;
  return (
    <Part id={id}>
      <clipPath id={uid + cid}>
        <path d={smoothPath(pts, true, 0.25)} />
      </clipPath>
      <g clipPath={`url(#${uid}${cid})`}>
        <circle cx={c[0]} cy={c[1]} r={r} fill={fill} />
        <path d={smoothPath(pts, true, 0.25)} fill="url(#w8-bone)" />
        <circle cx={c[0]} cy={c[1]} r={r} fill="url(#w8-boneshade)" />
      </g>
      <path d={smoothPath(pts, true, 0.25)} fill="none" stroke={deep} strokeWidth={1.6} opacity={Math.min(1, k * 2)} />
    </Part>
  );
}

/** The three ossicles, drawn at the scale of the push-in (centre = EAR_C, 1 unit ≈ 1 px of the skull). */
function Ossicles({ m, i, s, z, colors }: { m: number; i: number; s: number; z: number; colors: { m: string; i: string; s: string } }) {
  const [x, y] = EAR_C;
  const sw = Math.max(0.6, 1.4 / z);
  return (
    <g>
      <Part id="mailua" show={m}>
        {/* hammer: head up, handle down */}
        <ellipse cx={x - 9} cy={y - 6} rx={4.2} ry={4.6} fill={colors.m} stroke="#3b0a24" strokeWidth={sw} />
        <path d={`M${x - 10},${y - 2}L${x - 13},${y + 10}`} stroke={colors.m} strokeWidth={2.4} strokeLinecap="round" />
      </Part>
      <Part id="ingudea" show={i}>
        {/* anvil: body joined to the hammer's head, a short and a long process */}
        <ellipse cx={x - 2} cy={y - 6} rx={4} ry={4.4} fill={colors.i} stroke="#4a2205" strokeWidth={sw} />
        <path d={`M${x + 1},${y - 8}L${x + 7},${y - 9}M${x - 1},${y - 2}L${x + 2},${y + 6}`} stroke={colors.i} strokeWidth={2.2} strokeLinecap="round" />
      </Part>
      <Part id="ointokia" show={s}>
        {/* stirrup: head on the anvil's long process, two crura, footplate */}
        <path d={`M${x + 3},${y + 6}L${x + 9},${y + 3}M${x + 3},${y + 6}L${x + 9},${y + 10}M${x + 9},${y + 1.5}L${x + 9},${y + 11.5}`} stroke={colors.s} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      </Part>
    </g>
  );
}

export function FaceSkull({ t }: SceneProps) {
  const maxB = seg(t, VK_T.maxD + 0.01, VK_T.maxD + 0.06);
  const manB = seg(t, VK_T.manD + 0.01, VK_T.manD + 0.06);
  const hyoB = seg(t, VK_T.hyoD + 0.01, VK_T.hyoD + 0.05);
  // Each cartilage dims once its bones have formed, stays as a ghost beside its ossicle in the ear push-in, then goes.
  const gone = 1 - seg(t, VK_T.growth - 0.02, VK_T.growth + 0.005);
  const ptqShow = vis(t, VK_T.maxD, 2) * (1 - 0.55 * seg(t, VK_T.manD, VK_T.manD + 0.03)) * gone;
  const meckelShow = vis(t, VK_T.maxD, 2) * (1 - 0.55 * seg(t, VK_T.hyoD + 0.01, VK_T.hyoD + 0.05)) * gone;
  const reiShow = hyoB * (1 - 0.55 * seg(t, VK_T.ear, VK_T.ear + 0.03)) * gone;
  const push = seg(t, VK_T.ear + 0.01, VK_T.ear + 0.035) * (1 - seg(t, VK_T.growth - 0.02, VK_T.growth + 0.005));
  const grow = seg(t, VK_T.growth + 0.015, VK_T.growth + 0.075);
  const orig = seg(t, VK_T.origin + 0.005, VK_T.origin + 0.04);
  const zs = lerp(1, 6.5, push);
  const z = zoom(lerp(500, EAR_C[0], push), lerp(320, EAR_C[1], push), zs, 500, 300);
  const A = (p: Pt) => z.at(p[0], p[1]);
  const inFrame = (p: Pt) => 1 - Math.min(1, Math.max(30 - p[0], p[0] - 970, 40 - p[1], p[1] - 590, 0) / 24);
  // Colours: arch family, then germ origin at the last step (crest teal / paraxial coral).
  const col = (fam: string) => (orig > 0.5 ? Q.crest : fam);
  const vaultCol = (front: boolean) => (orig > 0.5 ? (front ? Q.crest : Q.paraxial) : '#cfc6b4');
  const faceT = `translate(${f1(FACE_ORIGIN[0])},${f1(FACE_ORIGIN[1])}) scale(${(1 + 0.32 * grow).toFixed(3)}) translate(${-FACE_ORIGIN[0]},${-FACE_ORIGIN[1]})`;
  const ossCol = { m: col(F.man), i: col(F.max), s: col(F.hyo) };
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
        {/* Neurocranium (vault) for scale: plain until the origin step. */}
        <path d={smoothPath(SKULL, false, 0.3)} fill="none" stroke="#5b5360" strokeWidth={2} />
        <Part id="hezur-frontala" quiet={orig < 0.5}>
          <path d={smoothPath(FRONTAL_B, true, 0.25)} fill={vaultCol(true)} stroke="#8a8170" strokeWidth={1.4} opacity={0.9} />
        </Part>
        <Part id="hezur-parietala" quiet={orig < 0.5}>
          <path d={smoothPath(PARIETAL_B, true, 0.25)} fill={vaultCol(false)} stroke="#8a8170" strokeWidth={1.4} opacity={0.9} />
        </Part>
        <Part id="okzipitalaren-ezkata" quiet={orig < 0.5}>
          <path d={smoothPath(OCCIPITAL_B, true, 0.25)} fill={vaultCol(false)} stroke="#8a8170" strokeWidth={1.4} opacity={0.9} />
        </Part>
        <ellipse cx={ORBIT_B[0]} cy={ORBIT_B[1]} rx={30} ry={26} fill="#1a1418" stroke="#5b5360" strokeWidth={1.5} />
        {/* Maxillary process family (pterygoquadrate bar and its mesenchyme). */}
        <Grow id="tenporalaren-ezkata" uid="w8-vk-sq" pts={SQUAMA_T} c={[580, 340]} k={maxB} fill={col(F.max)} deep={F.maxDeep} />
        <g transform={faceT}>
          <Grow id="hezur-malarra" uid="w8-vk-ma" pts={MALAR} c={[396, 372]} k={maxB} fill={col(F.max)} deep={F.maxDeep} />
          <Grow id="goiko-maxilarra" uid="w8-vk-mx" pts={MAXILLA} c={[330, 400]} k={maxB} fill={col(F.max)} deep={F.maxDeep} />
          <Part id="sinu-paranasalak" show={grow}>
            <ellipse cx={346} cy={398} rx={20 * grow} ry={13 * grow} fill="#1b2b44" stroke="#7aa7f5" strokeWidth={1.4} />
            <ellipse cx={402} cy={377} rx={9 * grow} ry={7 * grow} fill="#1b2b44" stroke="#7aa7f5" strokeWidth={1.2} />
          </Part>
          {/* Mandibular process family: Meckel's cartilage, the mandible round it. */}
          <Grow id="beheko-maxilarra" uid="w8-vk-mn" pts={MANDIBLE} c={[380, 466]} k={manB} fill={col(F.man)} deep={F.manDeep} />
          <Part id="meckel-kartilagoa" show={meckelShow}>
            <path d={path(MECKEL_B)} fill="none" stroke={F.manDeep} strokeWidth={9} strokeLinecap="round" />
            <path d={path(MECKEL_B)} fill="none" stroke={F.man} strokeWidth={6} strokeLinecap="round" />
          </Part>
          {/* Alveolar processes with the teeth, after birth. */}
          <Part id="apofisi-albeolarrak" show={grow}>
            <path d={`M296,${f1(440)}Q340,${f1(446 + 8 * grow)} 384,${f1(434)}`} fill="none" stroke={col(F.max)} strokeWidth={8 * grow} strokeLinecap="round" />
            <path d={`M300,${f1(452)}Q350,${f1(444 - 8 * grow)} 404,${f1(450)}`} fill="none" stroke={col(F.man)} strokeWidth={8 * grow} strokeLinecap="round" />
            {Array.from({ length: 7 }, (_, i) => {
              const x = 306 + i * 13;
              return (
                <g key={i} opacity={seg(grow, 0.4 + i * 0.05, 0.7 + i * 0.04)}>
                  <rect x={x} y={438} width={8} height={7} rx={2} fill="#fffaf0" stroke="#b9a77e" strokeWidth={0.8} />
                  <rect x={x + 1} y={449} width={8} height={6} rx={2} fill="#fffaf0" stroke="#b9a77e" strokeWidth={0.8} />
                </g>
              );
            })}
          </Part>
        </g>
        <Part id="barra-pterigopalatino-karratua" show={ptqShow}>
          <path d={`M${EAR_C[0] - 2},${EAR_C[1] - 6}L486,382L452,376`} fill="none" stroke="#3b1a05" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${EAR_C[0] - 2},${EAR_C[1] - 6}L486,382L452,376`} fill="none" stroke={F.max} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${EAR_C[0] - 2},${EAR_C[1] - 6}L486,382L452,376`} fill="none" stroke="url(#w8-cart)" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
        </Part>
        {/* 2nd arch family: Reichert's cartilage. */}
        <Part id="reichert-kartilagoa" show={reiShow}>
          <path d={path(REICHERT_B)} fill="none" stroke={F.hyoDeep} strokeWidth={8} strokeLinecap="round" />
          <path d={path(REICHERT_B)} fill="none" stroke={F.hyo} strokeWidth={5} strokeLinecap="round" />
        </Part>
        <Part id="apofisi-estiloidea" show={maxB}>
          <path d={smoothPath(STYLOID, true, 0.2)} fill={col(F.max)} stroke={F.maxDeep} strokeWidth={1.2} />
        </Part>
        <Part id="hioidesa" quiet>
          <path d={smoothPath(HYOID, true, 0.3)} fill="#cfc6b4" stroke="#8a8170" strokeWidth={1.2} />
        </Part>
        <Ossicles m={manB} i={maxB} s={hyoB} z={zs} colors={ossCol} />
      </g>

      {push > 0.5 && (
        <g opacity={seg(push, 0.5, 1)} fontSize={12.5} fontWeight={600} stroke="#0f0f11" strokeWidth={3} paintOrder="stroke">
          {[
            { s: 'Meckel kartilagotik', c: F.man, y: 470 },
            { s: 'Barra pterigopalatino karratutik', c: F.max, y: 494 },
            { s: 'Reichert kartilagotik', c: F.hyo, y: 518 },
          ].map((k) => (
            <g key={k.s}>
              <rect x={384} y={k.y - 8} width={16} height={12} rx={3} fill={k.c} stroke="#0f0f11" strokeWidth={1} />
              <text x={408} y={k.y + 2.5} fill="#fff">
                {k.s}
              </text>
            </g>
          ))}
        </g>
      )}

      {orig > 0.02 && (
        <g opacity={orig} fontSize={12.5} fontWeight={600} stroke="#0f0f11" strokeWidth={3} paintOrder="stroke">
          {[
            { s: 'Gandor neurala (ektodermoa)', c: Q.crest, y: 548 },
            { s: 'Mesodermo paraxiala', c: Q.paraxial, y: 570 },
          ].map((k) => (
            <g key={k.s}>
              <rect x={214} y={k.y - 8} width={16} height={12} rx={3} fill={k.c} stroke="#0f0f11" strokeWidth={1} />
              <text x={238} y={k.y + 2.5} fill="#fff">
                {k.s}
              </text>
            </g>
          ))}
        </g>
      )}
      <Note x={500} y={30} size={12} show={1 - push}>
        Jaioberriaren burezurra alboz (aurpegia ezkerrera)
      </Note>
      <Note x={500} y={30} size={12} show={push}>
        Bitarteko belarria: hiru hezurtxoak (handituta)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.maxD, VK_T.manD)}>
        Prozesu maxilarra: barra pterigopalatino karratua → ingudea; inguruko mesenkimatik maxilarra, malarra, tenporalaren ezkata
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.manD, VK_T.hyoD)}>
        Barail prozesua: Meckel kartilagoa → mailua; inguruko mesenkimatik beheko maxilarra (baraila)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.hyoD, VK_T.ear)}>
        Reichert kartilagoa (barail prozesua + 2. arkua) → ointokia (estriboa)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.ear, VK_T.growth)}>
        Mailua · ingudea · ointokia: hiru kartilago ezberdinetatik
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.growth, VK_T.origin)}>
        Jaiotzean aurpegia txikia: gero sinu paranasalak eta apofisi albeolarrak (hortzak) → aurpegia hazten da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, VK_T.origin)}>
        Errai kraneo osoa eta neurokraneoaren aurrealdea gandor neuraletik; atzealdea mesodermo paraxialetik
      </Note>

      {/* Left gutter: the face (in front). */}
      <Label id="hezur-frontala" x={190} y={150} ax={A([320, 200])[0]} ay={A([320, 200])[1]} show={orig * inFrame(A([320, 200]))} />
      <Label id="hezur-malarra" x={190} y={280} ax={A([404, 360])[0]} ay={A([404, 360])[1]} show={maxB * inFrame(A([404, 360])) * (1 - grow)} />
      <Label id="goiko-maxilarra" x={190} y={380} ax={A([304, 404])[0]} ay={A([304, 404])[1]} show={maxB * inFrame(A([304, 404])) * (1 - grow)} />
      <Label id="sinu-paranasalak" x={190} y={360} ax={346 + (346 - FACE_ORIGIN[0]) * 0.32 * grow - 14} ay={398 + (398 - FACE_ORIGIN[1]) * 0.32 * grow} show={grow} />
      <Label id="apofisi-albeolarrak" x={190} y={420} ax={330 + (330 - FACE_ORIGIN[0]) * 0.32 * grow} ay={441 + (441 - FACE_ORIGIN[1]) * 0.32 * grow} show={grow} />
      <Label id="beheko-maxilarra" x={190} y={480} ax={A([330, 476])[0] + (330 - FACE_ORIGIN[0]) * 0.32 * grow} ay={A([330, 476])[1] + (476 - FACE_ORIGIN[1]) * 0.32 * grow} show={manB * inFrame(A([330, 476]))} />
      <Label id="meckel-kartilagoa" x={190} y={540} ax={A([400, 464])[0]} ay={A([400, 464])[1]} show={meckelShow * inFrame(A([400, 464]))} />
      {/* Right gutter: the ear region and the vault behind. */}
      <Label id="hezur-parietala" x={810} y={100} ax={A([620, 130])[0]} ay={A([620, 130])[1]} show={orig} />
      <Label id="tenporalaren-ezkata" x={760} y={196} ax={A([600, 320])[0]} ay={A([600, 320])[1]} show={maxB * inFrame(A([600, 320]))} />
      <Label id="ingudea" x={810} y={250} ax={A([EAR_C[0] + 6, EAR_C[1] - 9])[0]} ay={A([EAR_C[0] + 6, EAR_C[1] - 9])[1]} show={maxB} />
      <Label id="barra-pterigopalatino-karratua" x={754} y={290} ax={A([486, 378])[0]} ay={A([486, 378])[1]} show={ptqShow * inFrame(A([486, 378]))} small />
      <Label id="mailua" x={810} y={350} ax={A([EAR_C[0] - 12, EAR_C[1] + 6])[0]} ay={A([EAR_C[0] - 12, EAR_C[1] + 6])[1]} show={manB} />
      <Label id="ointokia" x={810} y={400} ax={A([EAR_C[0] + 9, EAR_C[1] + 9])[0]} ay={A([EAR_C[0] + 9, EAR_C[1] + 9])[1]} show={hyoB} />
      <Label id="okzipitalaren-ezkata" x={810} y={440} ax={A([740, 340])[0]} ay={A([740, 340])[1]} show={orig} />
      <Label id="apofisi-estiloidea" x={810} y={480} ax={A([538, 452])[0]} ay={A([538, 452])[1]} show={maxB * inFrame(A([538, 452]))} />
      <Label id="reichert-kartilagoa" x={810} y={530} ax={A([524, 482])[0]} ay={A([524, 482])[1]} show={reiShow * inFrame(A([524, 482]))} />
      <Label id="hioidesa" x={810} y={570} ax={A([494, 512])[0]} ay={A([494, 512])[1]} show={inFrame(A([494, 512]))} small />
    </g>
  );
}
