'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { EAM, MANDIBLE, Orbit, SIDE_BONES, SOUT } from './Calvaria';
import { Defs8, MesCell, Q, f1, inPoly, mesCells, offset, resample, sm, spline, vis } from './common';

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
  const cid = useId().replace(/:/g, '');
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
      <defs>
        <radialGradient id={`w8-vk-head${cid}`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#5a2a22" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <path d={smoothPath(HEAD, true, 0.3)} fill={TISSUE} />
      <path d={smoothPath(HEAD, true, 0.3)} fill={`url(#w8-vk-head${cid})`} />
      {/* Brain bulges under the skin, the otic pit behind the arches and the nasal placode in front of the eye. */}
      <g pointerEvents="none">
        <path d="M300,150 C380,96 470,92 540,120" fill="none" stroke="#b98a7a" strokeWidth={2} opacity={0.5} />
        <path d="M262,236 C300,200 360,190 410,210" fill="none" stroke="#b98a7a" strokeWidth={2} opacity={0.45} />
        <ellipse cx={668} cy={292} rx={13} ry={10} fill="#b07c6c" stroke={TISSUE_EDGE} strokeWidth={1.2} />
        <ellipse cx={666} cy={290} rx={6} ry={4.5} fill="#7a4a40" />
        <ellipse cx={258} cy={346} rx={11} ry={14} fill="#d8a898" stroke={TISSUE_EDGE} strokeWidth={1.1} />
        <ellipse cx={256} cy={348} rx={4} ry={6} fill="#9a6a5c" />
      </g>
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

      {/* Pharyngeal clefts: the grooves behind each arch. */}
      <g pointerEvents="none">
        {ARCH.map((a) => (
          <path key={a.id} d={smoothPath(offset(a.c, () => -a.w - 4), false, 0.3)} fill="none" stroke="#7a4a40" strokeWidth={4} strokeLinecap="round" opacity={0.55} />
        ))}
      </g>
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
// The same newborn skull as the vault's side view (buru-ganga), mirrored so the face looks left.
const mx = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [1000 - x, y] as Pt);
const SKULL = mx(SOUT);
const VAULT = SIDE_BONES.map((b) => ({ ...b, region: mx(b.region), c: [1000 - b.c[0], b.c[1]] as Pt }));
const VAULT_OF = (id: string) => VAULT.find((b) => b.id === id)!;
/** Temporal squama, closed along the lower edge of the vault. */
const SQUAMA_T = mx(spline([[584, 304], [544, 270], [480, 260], [422, 282], [388, 330], [378, 392], [386, 432], [398, 466], [440, 462], [490, 440], [548, 414], [578, 404], [586, 352]], 8, true));
/** The temporal's zygomatic process (back half of the arch). */
const ARCH_T = mx([[498, 400], [528, 394], [558, 390]]);
const MALAR = mx(spline([[628, 292], [636, 300], [632, 330], [640, 352], [652, 362], [645, 380], [637, 396], [633, 406], [612, 404], [584, 405], [563, 407], [562, 390], [596, 386], [616, 370], [620, 340], [622, 306]], 8, true));
const MAXILLA = mx(spline([[652, 362], [684, 360], [700, 344], [705, 316], [702, 298], [712, 318], [719, 340], [721, 352], [718, 362], [732, 378], [734, 384], [729, 398], [723, 414], [704, 421], [684, 424], [664, 424], [644, 419], [633, 407], [638, 392], [645, 378]], 8, true));
const NASAL = mx(spline([[700, 288], [712, 304], [724, 328], [730, 344], [721, 350], [716, 330], [705, 306]], 6, true));
const MANDIBLE_V = mx(MANDIBLE);
const EAR_C: Pt = [1000 - EAM[0], EAM[1]];
/** Meckel's cartilage runs inside the mandible, back to the ear (where its end becomes the malleus). */
const MECKEL_B = spline([[294, 470], [340, 476], [400, 478], [444, 462], [472, 436], [EAR_C[0] - 10, EAR_C[1] - 2]], 8);
const PTQ_B: Pt[] = [[EAR_C[0] - 2, EAR_C[1] - 6], [488, 398], [452, 392]];
const REICHERT_B = spline([[EAR_C[0] + 10, EAR_C[1] + 8], [528, 462], [508, 500], [478, 530]], 8);
const STYLOID: Pt[] = [[EAR_C[0] + 4, EAR_C[1] + 12], [EAR_C[0] + 12, EAR_C[1] + 14], [510, 478], [503, 476]];
const HYOID: Pt[] = [[436, 536], [468, 528], [484, 538], [470, 548], [438, 550], [428, 544]];
/** Face growth after birth: the face bones scale up from behind the jaw. */
/**
 * Growth after birth: the orbit is already near its adult size, the face grows DOWN under it (and a little forward)
 * as the sinuses and alveolar processes form. The maxilla stretches from under the orbit; the mandible keeps its
 * condyle at the joint while its ramus lengthens, so the body comes down with the teeth.
 */
const UP: Pt = [334, 300];
const COND: Pt = [489, 410];
const JAW_DROP = 52;
const HYOID_DROP = 30;
const upAt = (p: Pt, g: number): Pt => [UP[0] + (p[0] - UP[0]) * (1 + 0.12 * g), UP[1] + (p[1] - UP[1]) * (1 + 0.32 * g)];
const jawAt = (p: Pt, g: number): Pt => {
  const s = 1 + 0.15 * g;
  return [COND[0] + (p[0] - COND[0]) * s, COND[1] + (p[1] - COND[1]) * s + JAW_DROP * g * sm((COND[0] - p[0] - 8) / 62)];
};
const upT = (g: number) => `translate(${UP[0]},${UP[1]}) scale(${(1 + 0.12 * g).toFixed(3)},${(1 + 0.32 * g).toFixed(3)}) translate(${-UP[0]},${-UP[1]})`;
/** The jaw's body (front of the ramus): one affine piece of `jawAt`. */
const jawT = (g: number) =>
  `translate(0,${f1(JAW_DROP * g)}) translate(${COND[0]},${COND[1]}) scale(${(1 + 0.15 * g).toFixed(3)}) translate(${-COND[0]},${-COND[1]})`;

/** A bone that ossifies out of a centre to fill its shape (membranous growth). */
function Grow({ id, pts, c, k, fill, deep, uid, size = 140 }: { id: string; pts: Pt[]; c: Pt; k: number; fill: string; deep: string; uid: string; size?: number }) {
  const cid = useId().replace(/:/g, '');
  if (k <= 0.01) return null;
  const r = size * k;
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
/** Malleus, incus and stapes as an anatomy atlas draws the chain (anterior to the left), in units round EAR_C. */
const MALLEUS: Pt[] = [
  [-8, -12.2], [-5.2, -11], [-3.9, -7.6], [-5, -3.8], [-7.3, -1.4], [-8.5, 2.8], [-9.8, 7.4], [-10.9, 11.2], [-12.4, 11.3],
  [-11.6, 7.2], [-10.9, 3.2], [-12.3, 0.6], [-11.6, -1.2], [-11.5, -3.4], [-12.4, -7], [-10.8, -11],
];
const INCUS: Pt[] = [
  [-4.3, -10.6], [-1, -12.1], [4.8, -11.3], [9.4, -9.9], [9.1, -8.4], [4.2, -7.6], [1.3, -5.6], [0.5, -1.2], [0.8, 3.4],
  [2.7, 5.2], [3, 7], [0.9, 7.4], [-1, 4.6], [-1.5, -0.8], [-3.1, -4.4], [-4.3, -6.6],
];
function Ossicles({ m, i, s, z, colors }: { m: number; i: number; s: number; z: number; colors: { m: string; i: string; s: string } }) {
  const gid = useId().replace(/:/g, '');
  const [x, y] = EAR_C;
  const sw = Math.max(0.35, 1.4 / z);
  const at = (pts: Pt[]) => pts.map(([u, v]) => [x + u, y + v] as Pt);
  const shade = `w8-oss${gid}`;
  return (
    <g>
      <defs>
        <radialGradient id={shade} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0.06} />
          <stop offset="1" stopColor="#000" stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <Part id="mailua" show={m}>
        {/* hammer: rounded head (up, against the incus), neck, lateral process, long handle down to the umbo */}
        <path d={smoothPath(at(MALLEUS), true, 0.3)} fill={colors.m} stroke="#3b0a24" strokeWidth={sw} strokeLinejoin="round" />
        <path d={smoothPath(at(MALLEUS), true, 0.3)} fill={`url(#${shade})`} />
      </Part>
      <Part id="ingudea" show={i}>
        {/* anvil: body (joint with the hammer's head), short process back, long process down to the lenticular process */}
        <path d={smoothPath(at(INCUS), true, 0.3)} fill={colors.i} stroke="#4a2205" strokeWidth={sw} strokeLinejoin="round" />
        <path d={smoothPath(at(INCUS), true, 0.3)} fill={`url(#${shade})`} />
      </Part>
      <Part id="ointokia" show={s}>
        {/* stirrup: head on the lenticular process, two crura round the opening, the oval footplate */}
        <g fill="none" stroke="#0f2a5c" strokeWidth={1.9} strokeLinecap="round">
          <path d={`M${x + 4.6},${y + 5.8}Q${x + 7},${y + 2.2} ${x + 10.8},${y + 2.4}M${x + 4.6},${y + 6.8}Q${x + 7},${y + 10.4} ${x + 10.8},${y + 10.2}`} />
        </g>
        <g fill="none" stroke={colors.s} strokeWidth={1.2} strokeLinecap="round">
          <path d={`M${x + 4.6},${y + 5.8}Q${x + 7},${y + 2.2} ${x + 10.8},${y + 2.4}M${x + 4.6},${y + 6.8}Q${x + 7},${y + 10.4} ${x + 10.8},${y + 10.2}`} />
        </g>
        <ellipse cx={x + 3.7} cy={y + 6.3} rx={1.7} ry={1.5} fill={colors.s} stroke="#0f2a5c" strokeWidth={sw} />
        <ellipse cx={x + 11.3} cy={y + 6.3} rx={1.3} ry={4.6} fill={colors.s} stroke="#0f2a5c" strokeWidth={sw} />
        <ellipse cx={x + 11.3} cy={y + 6.3} rx={1.3} ry={4.6} fill={`url(#${shade})`} />
      </Part>
    </g>
  );
}

export function FaceSkull({ t }: SceneProps) {
  const cid = useId().replace(/:/g, '');
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
  const manV = grow > 0 ? MANDIBLE_V.map((p) => jawAt(p, grow)) : MANDIBLE_V;
  const sinusA = upAt([316, 384], grow);
  const alvA = upAt([336, 424], grow);
  const jawA = A(jawAt([340, 494], grow));
  const ossCol = { m: col(F.man), i: col(F.max), s: col(F.hyo) };
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
        {/* Neurocranium (vault) for scale: plain until the origin step. */}
        <path d={smoothPath(SKULL, true, 0.3)} fill="#3b3540" stroke="#5b5360" strokeWidth={2} />
        <clipPath id={`w8-vk-skull${cid}`}>
          <path d={smoothPath(SKULL, true, 0.3)} />
        </clipPath>
        <g clipPath={`url(#w8-vk-skull${cid})`}>
          {(['hezur-frontala', 'hezur-parietala', 'okzipitalaren-ezkata'] as const).map((id) => (
            <Part key={id} id={id} quiet={orig < 0.5}>
              <path d={closed(VAULT_OF(id).region)} fill={vaultCol(id === 'hezur-frontala')} stroke="#6d6458" strokeWidth={2.4} opacity={0.92} />
              <path d={closed(VAULT_OF(id).region)} fill="url(#w8-boneshade)" />
            </Part>
          ))}
          {/* Maxillary process family (pterygoquadrate bar and its mesenchyme). */}
          <Grow id="tenporalaren-ezkata" uid="w8-vk-sq" pts={SQUAMA_T} c={[522, 338]} k={maxB} fill={col(F.max)} deep={F.maxDeep} />
        </g>
        <path d={smoothPath(SKULL, true, 0.3)} fill="url(#w8-light)" pointerEvents="none" />
        <path d={smoothPath(SKULL, true, 0.3)} fill="url(#w8-dome)" pointerEvents="none" />
        <Part id="tenporalaren-ezkata" show={maxB}>
          <path d={path(ARCH_T)} fill="none" stroke={F.maxDeep} strokeWidth={11} strokeLinecap="round" />
          <path d={path(ARCH_T)} fill="none" stroke={col(F.max)} strokeWidth={8} strokeLinecap="round" />
        </Part>
        <g>
          {/* The face's outline before its bones form (and the nasal bone, not followed here). */}
          <path d={smoothPath(MAXILLA, true, 0.3)} fill="#8f877c" stroke="#6d6458" strokeWidth={1.4} transform={upT(grow)} />
          <path d={smoothPath(MALAR, true, 0.3)} fill="#8f877c" stroke="#6d6458" strokeWidth={1.4} />
          <path d={smoothPath(manV, true, 0.3)} fill="#8f877c" stroke="#6d6458" strokeWidth={1.4} />
          <path d={smoothPath(NASAL, true, 0.3)} fill={orig > 0.5 ? Q.crest : '#8f877c'} stroke="#6d6458" strokeWidth={1.2} />
          <g transform={upT(grow)}>
            <Grow id="goiko-maxilarra" uid="w8-vk-mx" pts={MAXILLA} c={[320, 395]} k={maxB} fill={col(F.max)} deep={F.maxDeep} />
            <Part id="sinu-paranasalak" show={grow}>
              <ellipse cx={330} cy={384} rx={17 * grow} ry={10 * grow} fill="#1b2b44" stroke="#7aa7f5" strokeWidth={1.4} />
            </Part>
          </g>
          <Grow id="hezur-malarra" uid="w8-vk-ma" pts={MALAR} c={[390, 380]} k={maxB} fill={col(F.max)} deep={F.maxDeep} />
          <Part id="sinu-paranasalak" show={grow}>
            <ellipse cx={318} cy={270} rx={9 * grow} ry={7 * grow} fill="#1b2b44" stroke="#7aa7f5" strokeWidth={1.2} />
          </Part>
          {/* Mandibular process family: Meckel's cartilage, the mandible round it. */}
          <Grow id="beheko-maxilarra" uid="w8-vk-mn" pts={manV} c={jawAt([360, 480], grow)} k={manB} size={140 + 70 * grow} fill={col(F.man)} deep={F.manDeep} />
          <Part id="meckel-kartilagoa" show={meckelShow}>
            <path d={smoothPath(MECKEL_B, false, 0.3)} fill="none" stroke={F.manDeep} strokeWidth={9} strokeLinecap="round" />
            <path d={smoothPath(MECKEL_B, false, 0.3)} fill="none" stroke={F.man} strokeWidth={6} strokeLinecap="round" />
          </Part>
          {/* Alveolar processes with the teeth, after birth: the lower row on the jaw, the upper row under the maxilla. */}
          <Part id="apofisi-albeolarrak" show={grow}>
            <g transform={jawT(grow)}>
              <path d="M294,419Q336,415 380,421" fill="none" stroke={col(F.man)} strokeWidth={7 * grow} strokeLinecap="round" />
              {Array.from({ length: 7 }, (_, i) => (
                <rect key={i} x={298 + i * 11} y={410.5 + i * 0.3} width={8} height={8} rx={2.2} fill="#fffaf0" stroke="#b9a77e" strokeWidth={0.8} opacity={seg(grow, 0.4 + i * 0.05, 0.7 + i * 0.04)} />
              ))}
            </g>
            <g transform={upT(grow)}>
              <path d="M290,423Q330,427 370,421" fill="none" stroke={col(F.max)} strokeWidth={7 * grow} strokeLinecap="round" />
              {Array.from({ length: 6 }, (_, i) => (
                <rect key={i} x={303 + i * 11} y={420 + i * 0.2} width={8} height={7.5} rx={2.2} fill="#fffaf0" stroke="#b9a77e" strokeWidth={0.8} opacity={seg(grow, 0.4 + i * 0.05, 0.7 + i * 0.04)} />
              ))}
            </g>
          </Part>
          <Orbit flip />
        </g>
        <Part id="barra-pterigopalatino-karratua" show={ptqShow}>
          <path d={path(PTQ_B)} fill="none" stroke="#3b1a05" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <path d={path(PTQ_B)} fill="none" stroke={F.max} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={path(PTQ_B)} fill="none" stroke="url(#w8-cart)" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
        </Part>
        {/* 2nd arch family: Reichert's cartilage. */}
        <Part id="reichert-kartilagoa" show={reiShow}>
          <path d={smoothPath(REICHERT_B, false, 0.3)} fill="none" stroke={F.hyoDeep} strokeWidth={8} strokeLinecap="round" />
          <path d={smoothPath(REICHERT_B, false, 0.3)} fill="none" stroke={F.hyo} strokeWidth={5} strokeLinecap="round" />
        </Part>
        <Part id="apofisi-estiloidea" show={maxB}>
          <path d={smoothPath(STYLOID, true, 0.2)} fill={col(F.max)} stroke={F.maxDeep} strokeWidth={1.2} />
        </Part>
        {/* The hyoid comes down with the jaw. */}
        <Part id="hioidesa" quiet>
          <path d={smoothPath(HYOID, true, 0.3)} fill="#cfc6b4" stroke="#8a8170" strokeWidth={1.2} transform={`translate(0,${f1(HYOID_DROP * grow)})`} />
        </Part>
        {/* External acoustic meatus: the window onto the middle ear, with its tympanic ring. */}
        <circle cx={EAR_C[0]} cy={EAR_C[1]} r={15} fill="#09080b" />
        <path d={`M${EAR_C[0] - 11},${EAR_C[1] - 11}A16,16 0 1 0 ${EAR_C[0] + 11},${EAR_C[1] - 11}`} fill="none" stroke="#cfc6b4" strokeWidth={Math.max(1.2, 4 / zs)} strokeLinecap="round" opacity={0.7} />
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
            { s: 'Gandor neurala (ektodermoa)', c: Q.crest, y: 66 },
            { s: 'Mesodermo paraxiala', c: Q.paraxial, y: 88 },
          ].map((k) => (
            <g key={k.s}>
              <rect x={30} y={k.y - 8} width={16} height={12} rx={3} fill={k.c} stroke="#0f0f11" strokeWidth={1} />
              <text x={54} y={k.y + 2.5} fill="#fff">
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
      <Label id="hezur-malarra" x={190} y={280} ax={A([388, 384])[0]} ay={A([388, 384])[1]} show={maxB * inFrame(A([388, 384])) * (1 - grow)} />
      <Label id="goiko-maxilarra" x={190} y={380} ax={A([300, 404])[0]} ay={A([300, 404])[1]} show={maxB * inFrame(A([300, 404])) * (1 - grow)} />
      <Label id="sinu-paranasalak" x={190} y={360} ax={sinusA[0]} ay={sinusA[1]} show={grow} />
      <Label id="apofisi-albeolarrak" x={190} y={420} ax={alvA[0]} ay={alvA[1]} show={grow} />
      <Label id="beheko-maxilarra" x={190} y={480} ax={jawA[0]} ay={jawA[1]} show={manB * inFrame(A([330, 476]))} />
      <Label id="meckel-kartilagoa" x={190} y={540} ax={A([400, 464])[0]} ay={A([400, 464])[1]} show={meckelShow * inFrame(A([400, 464]))} />
      {/* Right gutter: the ear region and the vault behind. */}
      <Label id="hezur-parietala" x={810} y={100} ax={A([600, 130])[0]} ay={A([600, 130])[1]} show={orig} />
      <Label id="tenporalaren-ezkata" x={760} y={196} ax={A([540, 312])[0]} ay={A([540, 312])[1]} show={maxB * inFrame(A([540, 312]))} />
      <Label id="ingudea" x={810} y={250} ax={A([EAR_C[0] + 6, EAR_C[1] - 9])[0]} ay={A([EAR_C[0] + 6, EAR_C[1] - 9])[1]} show={maxB} />
      <Label id="barra-pterigopalatino-karratua" x={754} y={290} ax={A([486, 378])[0]} ay={A([486, 378])[1]} show={ptqShow * inFrame(A([486, 378]))} small />
      <Label id="mailua" x={810} y={350} ax={A([EAR_C[0] - 12, EAR_C[1] + 6])[0]} ay={A([EAR_C[0] - 12, EAR_C[1] + 6])[1]} show={manB} />
      <Label id="ointokia" x={810} y={400} ax={A([EAR_C[0] + 9, EAR_C[1] + 9])[0]} ay={A([EAR_C[0] + 9, EAR_C[1] + 9])[1]} show={hyoB} />
      <Label id="okzipitalaren-ezkata" x={810} y={440} ax={A([724, 300])[0]} ay={A([724, 300])[1]} show={orig} />
      <Label id="apofisi-estiloidea" x={810} y={480} ax={A([510, 466])[0]} ay={A([510, 466])[1]} show={maxB * inFrame(A([510, 466]))} />
      <Label id="reichert-kartilagoa" x={810} y={530} ax={A([524, 482])[0]} ay={A([524, 482])[1]} show={reiShow * inFrame(A([524, 482]))} />
      <Label id="hioidesa" x={810} y={570} ax={A([476, 540 + HYOID_DROP * grow])[0]} ay={A([476, 540 + HYOID_DROP * grow])[1]} show={inFrame(A([476, 540]))} small />
    </g>
  );
}
