'use client';

import { Arrow, Label, Note, Part, seg, type SceneProps } from '@/components/kit';
import { Defs9, Fibre, Steps, W, vis } from './common';

/**
 * 9:ildaskatuak `fusioa` — mioblastoetatik zuntz muskular ildaskatura, hiru urratsetan, beti zuntz berean:
 * (1) mioblastoak lerrokatu eta fusionatzen dira → zuntz luze nukleo ugarikoa (nukleoak periferiara);
 * (2) zitoplasman miofibrillak; (3) 3. hilabetearen bukaerarako ildaskak. Eskuinean, kontrastea:
 * miokardioko mioblastoak EZ dira fusionatzen (disko interkalarrak).
 */
export function FusionScene({ t }: SceneProps) {
  const fuse = seg(t, 0.78, 0.86);
  const fibrils = seg(t, 0.85, 0.9);
  const striae = seg(t, 0.9, 0.95);
  const cardiac = vis(t, 0.8, 2);

  return (
    <g>
      <Defs9 />
      <rect x={110} y={70} width={560} height={440} rx={18} fill="#1b1520" stroke={W.striated} strokeOpacity={0.4} strokeWidth={1.6} />
      <Note x={390} y={92} size={14} tone="accent">
        Muskulu ildaskatua: mioblastoak fusionatzen dira
      </Note>

      {/* Three rows, read top to bottom like a strip: separate myoblasts → the fused fibre → its inside. */}
      <Note x={128} y={136} size={12} tone="dim" align="start">
        1
      </Note>
      <Part id="mioblastoak">
        <Fibre x0={150} x1={630} y={150} h={44} n={7} fuse={0} seed={4} />
      </Part>
      <Arrow from={[390, 180]} to={[390, 224]} color="#ffd5b0" width={2.4} show={vis(t, 0.77, 2)} progress={seg(t, 0.77, 0.8)} />
      <Note x={128} y={246} size={12} tone="dim" align="start" show={vis(t, 0.78, 2)}>
        2
      </Note>
      <Part id="zuntz-muskularrak" show={vis(t, 0.78, 2)}>
        <Fibre x0={150} x1={630} y={262} h={50} n={7} fuse={fuse} fibrils={fibrils} striae={striae} seed={4} />
      </Part>
      <Arrow from={[390, 294]} to={[390, 330]} color="#ffd5b0" width={2.4} show={fibrils} progress={fibrils} />
      <Note x={128} y={350} size={12} tone="dim" align="start" show={fibrils}>
        3
      </Note>
      {/* Zoomed band of the same fibre: myofibrils and then the striations. */}
      <Part id="miofibrillak" show={fibrils}>
        <rect x={190} y={338} width={400} height={74} rx={14} fill="#7f1d2d" stroke="rgba(60,6,16,0.75)" />
        {[356, 375, 394].map((y) => (
          <path key={y} d={`M206,${y} H${206 + 368 * fibrils}`} stroke="#ffc0c8" strokeWidth={9} strokeLinecap="round" opacity={0.8} />
        ))}
      </Part>
      <Part id="ildaskak" show={striae}>
        <rect x={204} y={346} width={372} height={58} rx={10} fill="url(#w9-striae)" />
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d={`M${214 + i * 23},344 V406`} stroke="#2a0710" strokeWidth={2.4} opacity={0.75 * striae} />
        ))}
      </Part>
      <Note x={390} y={428} size={12} tone="dim" show={fibrils}>
        zuntzaren zati bat, handituta
      </Note>

      {/* Timeline: when each step happens. */}
      {[
        [0.78, 190, 'Fusioa: nukleo ugari, periferian'],
        [0.85, 390, 'Miofibrillak zitoplasman'],
        [0.9, 590, '3. hilabetearen bukaera: ildaskak'],
      ].map(([a, x, txt]) => (
        <Note key={txt as string} x={x as number} y={474} size={12} tone="accent" show={vis(t, a as number, 2)}>
          {txt as string}
        </Note>
      ))}

      {/* Contrast: cardiac myoblasts never fuse. */}
      <g opacity={cardiac}>
        <rect x={700} y={70} width={190} height={440} rx={18} fill="#1b1520" stroke={W.cardiac} strokeOpacity={0.45} strokeWidth={1.6} />
        <Note x={795} y={92} size={13} tone="accent">
          Miokardioa: fusiorik ez
        </Note>
      </g>
      <Part id="miokardioa" show={cardiac}>
        {[150, 214, 278].map((y, r) =>
          [740, 800, 856].map((x, i) => (
            <g key={`${r}${i}`}>
              <rect x={x - 26 + (r % 2) * 6} y={y - 18} width={50} height={36} rx={13} fill={W.cardiac} stroke="#5a0a30" />
              <ellipse cx={x + (r % 2) * 6} cy={y} rx={5} ry={3.6} fill="#3b0620" />
            </g>
          )),
        )}
      </Part>
      <Part id="disko-interkalarrak" show={cardiac}>
        {[150, 214, 278].map((y, r) =>
          [770, 829].map((x) => <path key={`${r}${x}`} d={`M${x + (r % 2) * 6},${y - 16} l3,5 l-3,5 l3,5 l-3,5 l3,5 l-3,5`} fill="none" stroke="#fde68a" strokeWidth={2.6} />),
        )}
      </Part>

      <Steps
        t={t}
        steps={[
          [0.76, 'Mioblastoak lerrokatu eta elkarren artean fusionatzen dira'],
          [0.85, 'Zuntz luze nukleo ugarikoaren zitoplasman miofibrillak agertzen dira'],
          [0.9, '3. hilabetearen bukaerarako ildaskak → zuntz muskular ildaskatua'],
        ]}
      />

      <Label id="mioblastoak" x={390} y={116} ax={390} ay={136} align="middle" />
      <Label id="zuntz-muskularrak" x={540} y={212} ax={540} ay={240} align="middle" show={vis(t, 0.78, 2)} />
      <Label id="miofibrillak" x={150} y={318} ax={214} ay={356} show={fibrils} small />
      <Label id="ildaskak" x={630} y={318} ax={566} ay={378} show={striae} small />
      <Label id="miokardioa" x={760} y={330} ax={740} ay={296} align="middle" show={cardiac} />
      <Label id="disko-interkalarrak" x={826} y={376} ax={835} ay={290} align="middle" show={cardiac} small />
    </g>
  );
}
