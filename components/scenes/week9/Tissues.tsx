'use client';

import { Label, Note, Part, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs9, Fibre, Spindle, Steps, W, f1 } from './common';

/**
 * 9:muskulu-motak `ehunak` — hiru muskulu motak mikroskopioan, elkarren ondoan, jatorriaren kolorearekin:
 * ildaskatua (zuntz luze nukleo anitzekoak, nukleoak periferian, ildaskak), leuna (zelula ardatz-itxurakoak,
 * nukleo bakarra erdian, ildaskarik gabe) eta miokardioa (zelula adarkatuak, nukleo bakarra, ildaskak eta
 * disko interkalarrak). Panel bakoitzaren azpian, nola bereizi (nukleoak, ildaskak, zelulak); gero, leku
 * berean, ektodermotik datozen salbuespenak: begi-niniko muskuluak, hodi galaktoforoetako zelula
 * mioepitelialak eta izerdi guruinetako muskulu lisoa.
 */

/** Cardiac cells: two rows of branched cells joined end to end by intercalated discs. */
const CARD: { x: number; y: number; w: number; branch?: 1 | -1 }[] = [
  { x: 668, y: 128, w: 70 },
  { x: 744, y: 128, w: 64, branch: 1 },
  { x: 814, y: 128, w: 58 },
  { x: 682, y: 196, w: 62, branch: -1 },
  { x: 750, y: 196, w: 72 },
  { x: 818, y: 196, w: 48 },
];
/** Intercalated discs: where two cardiac cells meet end to end (a stepped band across the junction). */
const DISCS: Pt[] = [
  [703, 128],
  [776, 128],
  [711, 196],
  [787, 196],
];

/** When each piece is drawn: the view plays steps 5 (the three tissues, compared) and 6 (the exceptions). */
export const TISSUE_T = { a: [0.645, 0.69], b: [0.68, 0.725], c: [0.715, 0.76], cmp: [0.75, 0.79], exc: [0.835, 0.88] } as const;

/** How to tell them apart, under each panel: nuclei, striations, cells. */
const KEYS: [string, string][][] = [
  [
    ['Nukleoak', 'ugari, periferian'],
    ['Ildaskak', 'bai'],
    ['Zelulak', 'fusionatuta: zuntz luzea'],
  ],
  [
    ['Nukleoak', 'bakarra, erdian'],
    ['Ildaskak', 'ez'],
    ['Zelulak', 'bereizita, ardatz-itxurakoak'],
  ],
  [
    ['Nukleoak', 'bakarra, erdian'],
    ['Ildaskak', 'bai'],
    ['Zelulak', 'bereizita: disko interkalarrak'],
  ],
];

export function MuscleTissues({ t }: SceneProps) {
  const a = seg(t, ...TISSUE_T.a);
  const b = seg(t, ...TISSUE_T.b);
  const c = seg(t, ...TISSUE_T.c);
  const exc = seg(t, ...TISSUE_T.exc);
  const cmp = seg(t, ...TISSUE_T.cmp) * (1 - seg(t, 0.82, 0.845));
  const coilPts = coil();
  const coilDot = coilPts[3 + 9];

  return (
    <g>
      <Defs9 />
      {/* Three panels. */}
      {[
        [110, 'Muskulu ildaskatua', 'mesodermo paraxiala', W.striated, a],
        [370, 'Muskulu leuna', 'errai orria|hestearen inguruan', W.smooth, b],
        [630, 'Miokardioa', 'errai orria|bihotz hodiaren inguruan', W.cardiac, c],
      ].map(([x, title, origin, col, s], i) => (
        <g key={title as string}>
          <rect x={x as number} y={56} width={252} height={262} rx={16} fill="#1b1520" stroke={col as string} strokeOpacity={0.25 + 0.5 * (s as number)} strokeWidth={1.6} />
          <Note x={(x as number) + 126} y={74} size={14} tone="accent" show={0.35 + 0.65 * (s as number)}>
            {title as string}
          </Note>
          {/* The origin on one line, where it is in a second one (each kept inside its panel). */}
          {(origin as string).split('|').map((line, j, all) => (
            <Note key={j} x={(x as number) + 126} y={300 - (all.length - 1 - j) * 15} size={11.5} show={s as number}>
              {j ? `(${line})` : `jatorria: ${line}`}
            </Note>
          ))}
          {/* How to tell it apart: a card under the panel, in the tissue's colour. */}
          {cmp > 0.01 && (
            <g opacity={cmp}>
              <rect x={x as number} y={338} width={252} height={240} rx={16} fill={col as string} fillOpacity={0.1} stroke={col as string} strokeOpacity={0.55} strokeWidth={1.4} />
              {KEYS[i].map(([k, v], j) => (
                <g key={k}>
                  <rect x={(x as number) + 14} y={356 + j * 74} width={224} height={60} rx={10} fill="#1b1520" fillOpacity={0.85} />
                  <rect x={(x as number) + 14} y={356 + j * 74} width={6} height={60} rx={3} fill={col as string} />
                </g>
              ))}
            </g>
          )}
          {KEYS[i].map(([k, v], j) => (
            <g key={k}>
              <Note x={(x as number) + 32} y={374 + j * 74} align="start" size={11.5} show={cmp}>
                {k}
              </Note>
              <Note x={(x as number) + 32} y={396 + j * 74} align="start" size={13} tone="accent" show={cmp}>
                {v}
              </Note>
            </g>
          ))}
        </g>
      ))}

      {/* Striated: two long multinucleated fibres, myofibrils and cross striations. */}
      <Part id="muskulu-ildaskatuak" show={a}>
        <Fibre x0={124} x1={348} y={130} h={40} n={6} fuse={1} fibrils={1} striae={0} seed={3} />
        <Fibre x0={130} x1={354} y={190} h={40} n={6} fuse={1} fibrils={1} striae={0} seed={9} />
        <rect x={144} y={175} width={196} height={30} rx={12} fill="url(#w9-striae)" />
      </Part>
      <Part id="ildaskak" show={a}>
        <rect x={138} y={115} width={196} height={30} rx={12} fill="url(#w9-striae)" />
      </Part>
      <Part id="miofibrillak" show={a}>
        {/* The cut end of the upper fibre: myofibrils seen end-on. */}
        <ellipse cx={348} cy={130} rx={10} ry={20} fill="#9b2335" stroke="#5a0a18" strokeWidth={1} />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={f1(345 + (rand(i * 3.1) - 0.5) * 8)} cy={f1(116 + i * 3.4)} r={1.5} fill="#ffc0c8" />
        ))}
      </Part>

      {/* Smooth: spindle cells, one central nucleus each, no striations. */}
      <Part id="muskulu-leuna" show={b}>
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, i) => (
            <Spindle key={`${row}${i}`} x={410 + i * 52 + (row % 2) * 26} y={110 + row * 34} len={54} h={17} rot={(rand(row * 7 + i) - 0.5) * 6} />
          )),
        )}
      </Part>

      {/* Cardiac: branched cells, one central nucleus, striations and intercalated discs. */}
      <Part id="miokardioa" show={c}>
        {CARD.map((k, i) => (
          <g key={i}>
            <rect x={k.x - k.w / 2} y={k.y - 20} width={k.w} height={40} rx={15} fill={W.cardiac} stroke="#5a0a30" strokeWidth={1} />
            {k.branch && <path d={`M${k.x - 8},${k.y + 18 * k.branch} L${k.x - 2},${k.y + 50 * k.branch} L${k.x + 18},${k.y + 50 * k.branch} L${k.x + 14},${k.y + 18 * k.branch}Z`} fill={W.cardiac} stroke="#5a0a30" strokeWidth={1} />}
            <rect x={k.x - k.w / 2 + 5} y={k.y - 15} width={k.w - 10} height={30} rx={8} fill="url(#w9-striae)" />
            <ellipse cx={k.x} cy={k.y} rx={6} ry={4.2} fill="#3b0620" stroke="rgba(255,200,230,0.4)" strokeWidth={0.6} />
          </g>
        ))}
      </Part>
      <Part id="disko-interkalarrak" show={c}>
        {/* A stepped band across each junction (transverse parts and a short longitudinal step), as in histology. */}
        {DISCS.map(([x, y]) => (
          <path key={`${x}${y}`} d={`M${x - 4.5},${y - 21} h9 v19 h5 v23 h-9 v-19 h-5Z`} fill="#fde68a" stroke="#7a4a06" strokeWidth={0.8} />
        ))}
      </Part>

      {/* Exceptions: smooth muscle of ectodermal origin (in the cards' place). */}
      <g opacity={exc > 0.01 ? 1 : 0}>
        <rect x={110} y={338} width={772} height={246} rx={16} fill="#141a2a" stroke={W.ecto} strokeOpacity={0.5 * exc} strokeWidth={1.6} opacity={exc} />
        <Note x={496} y={360} size={13.5} tone="accent" show={exc}>
          Salbuespenak: ektodermotik datozen muskuluak
        </Note>
      </g>
      <Part id="begi-niniko-muskuluak" show={exc}>
        {/* Iris from the front: dilator fibres radial, sphincter ring round the pupil. */}
        <circle cx={240} cy={470} r={66} fill="#2a3550" stroke="#9fb6d9" strokeWidth={1.5} />
        <circle cx={240} cy={470} r={58} fill="#3f6fb0" />
        {Array.from({ length: 28 }, (_, i) => {
          const an = (i / 28) * Math.PI * 2;
          return <path key={i} d={`M${f1(240 + Math.cos(an) * 26)},${f1(470 + Math.sin(an) * 26)} L${f1(240 + Math.cos(an) * 56)},${f1(470 + Math.sin(an) * 56)}`} stroke="#bcd3ff" strokeWidth={1.6} opacity={0.75} />;
        })}
        <circle cx={240} cy={470} r={22} fill="none" stroke="#e0ecff" strokeWidth={5} />
        <circle cx={240} cy={470} r={16} fill="#05070c" />
        <circle cx={232} cy={462} r={4} fill="#fff" opacity={0.5} />
      </Part>
      <Part id="zelula-mioepitelialak" show={exc}>
        {/* A galactophore duct (branching) wrapped by flat contractile cells. */}
        <path d="M430,560 C440,520 470,500 480,460 M480,460 C470,430 450,416 440,398 M480,460 C500,430 528,420 546,404" fill="none" stroke="#c7d7f5" strokeWidth={16} strokeLinecap="round" />
        <path d="M430,560 C440,520 470,500 480,460 M480,460 C470,430 450,416 440,398 M480,460 C500,430 528,420 546,404" fill="none" stroke="#1f2a44" strokeWidth={6} strokeLinecap="round" />
        {[
          [436, 536, 70],
          [452, 506, 55],
          [470, 482, 60],
          [462, 434, 125],
          [448, 414, 130],
          [500, 438, 40],
          [524, 420, 35],
        ].map(([x, y, r], i) => (
          <Spindle key={i} x={x} y={y} len={22} h={7} rot={r} color={W.ecto} />
        ))}
      </Part>
      <Part id="izerdi-guruinak" show={exc}>
        {/* A sweat gland coiled in the dermis, its duct rising to the skin surface. */}
        <path d="M660,404 H860" stroke="#e9b8a0" strokeWidth={8} />
        <path d={smoothPath(coilPts, false, 0.4)} fill="none" stroke="#c7d7f5" strokeWidth={12} strokeLinecap="round" />
        <path d={smoothPath(coilPts, false, 0.4)} fill="none" stroke="#1f2a44" strokeWidth={4} strokeLinecap="round" />
        {coilPts
          .filter((_, i) => i > 3 && i % 2 === 0)
          .map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3.4} fill={W.ecto} stroke="#1e3a8a" strokeWidth={0.8} />
          ))}
      </Part>

      <Steps
        t={t}
        steps={[
          [0, 'Hiru muskulu mota: ildaskatua, leuna eta miokardioa'],
          [0.64, 'Muskulu ildaskatua: mioblastoak fusionatzen dira → zuntz luzeak, nukleo ugari periferian'],
          [0.68, 'Muskulu leuna: zelula bereiziak, ardatz-itxurakoak, ildaskarik gabe'],
          [0.715, 'Miokardioa ildaskatua da, baina zelulak ez dira fusionatzen: disko interkalarrak'],
          [0.82, 'Salbuespenak (ektodermoa): begi-ninia, hodi galaktoforoak, izerdi guruinak'],
        ]}
      />

      <Label id="ildaskak" x={136} y={98} ax={200} ay={130} show={a} small />
      <Label id="miofibrillak" x={356} y={98} ax={348} ay={130} align="end" show={a} small />
      <Label id="muskulu-ildaskatuak" x={236} y={240} ax={236} ay={192} align="middle" show={a} />
      <Label id="muskulu-leuna" x={496} y={240} ax={496} ay={212} align="middle" show={b} />
      <Label id="miokardioa" x={750} y={256} ax={748} ay={196} align="middle" show={c} />
      <Label id="disko-interkalarrak" x={779} y={98} ax={776} ay={117} show={c} small align="middle" />
      <Label id="begi-niniko-muskuluak" x={240} y={566} ax={240} ay={512} align="middle" show={exc} />
      <Label id="zelula-mioepitelialak" x={488} y={566} ax={436} ay={536} align="middle" show={exc} />
      <Label id="izerdi-guruinak" x={760} y={566} ax={coilDot[0]} ay={coilDot[1]} align="middle" show={exc} small />
    </g>
  );
}

/** Coiled sweat gland: a duct from the surface down into a tight coil. */
function coil(): Pt[] {
  const pts: Pt[] = [[760, 404], [758, 430], [762, 452]];
  for (let i = 0; i <= 18; i++) {
    const an = (i / 18) * Math.PI * 4;
    pts.push([760 + Math.cos(an) * (22 - i * 0.4), 480 + Math.sin(an) * 14 + i * 1.6]);
  }
  return pts;
}
