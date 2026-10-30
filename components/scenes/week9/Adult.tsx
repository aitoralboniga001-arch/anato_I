'use client';

import { Label, Note, Part, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs9, HUE, Steps, W, f1 } from './common';
import { Nerve, SM_COLOR } from './Head';

/**
 * 9:somitomeroak-burua `heldua` — the arch muscles on an adult skull, lateral view (face to the right), as in
 * an anatomy atlas: the bones they attach to, a ghost of the skin profile, each muscle shaped by its real
 * attachments with its fibres running the right way, and the nerve that reaches it. Each muscle keeps the
 * colour of the somitomere it comes from (1. arch pink, 2. arch emerald, 3. arch sky), and so does its nerve tag.
 * The pterygoids lie deep to the ramus: they get their own small window, bottom left.
 */

const P = (pts: Pt[], closed = true, k = 0.22) => smoothPath(pts, closed, k);

/* Skull (cranium + face, without the mandible). */
const CRANIUM: Pt[] = [
  [842, 262], [838, 214], [820, 160], [788, 118], [740, 88], [676, 72], [606, 72], [540, 88], [486, 118], [446, 160], [420, 214], [410, 270],
  [416, 326], [436, 372], [470, 404], [522, 420], [560, 418], [570, 432], [584, 414], [598, 380], [640, 372], [700, 376], [746, 388], [760, 412],
  [858, 416], [872, 388], [874, 368], [866, 348], [870, 306], [852, 272],
];
const ORBIT: Pt[] = [[742, 226], [796, 224], [818, 248], [816, 298], [792, 312], [748, 308], [730, 280], [732, 246]];
const NASAL: Pt[] = [[852, 300], [866, 312], [870, 342], [864, 366], [850, 370], [844, 340]];
const ZYGO_BODY: Pt[] = [[732, 300], [762, 312], [772, 346], [744, 362], [704, 354], [692, 338], [702, 316]];
const ZYGO_ARCH: Pt[] = [[706, 330], [604, 334], [594, 344], [602, 354], [706, 352]];
const MEATUS: Pt = [560, 352];
/* Mandible: condyle in front of the ear canal, ramus, angle, body, chin. */
const MANDIBLE: Pt[] = [
  [586, 348], [602, 348], [608, 372], [626, 384], [642, 368], [656, 344], [670, 350], [676, 392], [702, 422], [760, 436], [856, 438], [864, 470],
  [854, 500], [800, 508], [720, 496], [640, 488], [612, 476], [600, 452], [596, 402], [590, 374],
];
const HYOID: Pt[] = [[672, 552], [704, 548], [716, 556], [704, 562], [672, 562]];
/* Ghost of the skin profile round the skull. */
const SKIN: Pt[] = [
  [600, 50], [700, 52], [782, 82], [840, 138], [864, 206], [868, 258], [884, 288], [904, 332], [906, 352], [888, 368], [882, 384], [896, 404],
  [886, 420], [896, 438], [884, 454], [888, 486], [870, 516], [820, 534], [760, 542], [722, 564], [704, 640], [470, 640], [440, 560], [418, 470],
  [392, 380], [384, 280], [398, 190], [440, 118], [510, 72],
];

/* Temporalis: its whole origin inside the temporal line, converging under the zygomatic arch on the coronoid. */
const T_LINE: Pt[] = [[792, 172], [744, 120], [662, 100], [580, 110], [518, 148], [484, 206], [482, 268], [508, 318], [560, 340]];
const TEMPORALIS: Pt[] = [...T_LINE, [604, 346], [642, 352], [660, 348], [690, 330], [736, 300], [770, 236]];
const CORONOID: Pt = [654, 348];
/* Masseter: from the lower border of the zygomatic arch down to the ramus and the angle. */
const MASSETER: Pt[] = [[610, 354], [668, 348], [726, 352], [724, 384], [712, 448], [694, 478], [642, 492], [612, 480], [602, 432], [604, 386]];

/** A muscle as an atlas draws it: its colour, its fibres (clipped to it), light from the top left, a darker rim. */
function Muscle({ id, d, color, fibres, rim = 'rgba(40,6,14,0.75)' }: { id: string; d: string; color: string; fibres: [Pt, Pt][]; rim?: string }) {
  const clip = `w9a-${id}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={color} />
      <g clipPath={`url(#${clip})`}>
        {fibres.map(([a, b], i) => (
          <path key={i} d={`M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`} stroke={i % 2 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'} strokeWidth={i % 2 ? 1.6 : 1.2} />
        ))}
        <path d={d} fill="url(#w9-light)" />
      </g>
      <path d={d} fill="none" stroke={rim} strokeWidth={1.4} />
    </g>
  );
}

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** Fibres from every point of an origin line to one insertion point (a fan, like the temporalis). */
const fan = (from: Pt[], to: Pt, n: number): [Pt, Pt][] =>
  Array.from({ length: n }, (_, i) => {
    const u = (i / (n - 1)) * (from.length - 1);
    const k = Math.floor(u);
    return [lerpPt(from[k], from[Math.min(from.length - 1, k + 1)], u - k), to];
  });
/** Parallel fibres between two lines (like the masseter). */
const sheet = (a0: Pt, a1: Pt, b0: Pt, b1: Pt, n: number): [Pt, Pt][] => Array.from({ length: n }, (_, i) => [lerpPt(a0, a1, i / (n - 1)), lerpPt(b0, b1, i / (n - 1))]);

export function AdultHead({ t }: SceneProps) {
  // Step 7 names the three arches: each one's muscles take its colour in turn (and stay), then steps 8–10 take one each.
  const a1 = Math.max(seg(t, 0.66, 0.71), seg(t, 0.568, 0.585));
  const a2 = Math.max(seg(t, 0.76, 0.81), seg(t, 0.592, 0.609));
  const a3 = Math.max(seg(t, 0.86, 0.91), seg(t, 0.616, 0.633));
  const n1 = seg(t, 0.69, 0.74);
  const n2 = seg(t, 0.79, 0.84);
  const n3 = seg(t, 0.89, 0.94);
  const mim = SM_COLOR[5];

  return (
    <g>
      <Defs9 />
      <defs>
        <linearGradient id="w9a-bone" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#f6eedb" />
          <stop offset="0.6" stopColor="#e4d6b4" />
          <stop offset="1" stopColor="#c9b78f" />
        </linearGradient>
        <radialGradient id="w9a-hole" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#05050a" />
          <stop offset="0.75" stopColor="#1d1712" />
          <stop offset="1" stopColor="#5c4c34" />
        </radialGradient>
      </defs>

      {/* Ghost of the skin and the soft profile. */}
      <path d={P(SKIN)} fill="#f3d3c2" opacity={0.07} />
      <path d={P(SKIN)} fill="none" stroke="#f0c4ae" strokeOpacity={0.7} strokeWidth={2} />

      {/* The pharynx behind the jaw (deep), for the 3rd-arch muscle. */}
      <Part id="faringe-heldua" show={0.4 + 0.6 * a3}>
        <path d={P([[618, 470], [664, 466], [672, 560], [680, 640], [630, 640], [622, 560]])} fill="#b97a74" opacity={0.75} />
        {[490, 520, 550, 580, 610].map((y) => (
          <path key={y} d={`M${622},${y} Q648,${y + 8} ${670},${y}`} fill="none" stroke="rgba(60,10,10,0.35)" strokeWidth={1.4} />
        ))}
      </Part>

      {/* Skull. */}
      <path d={P(CRANIUM)} fill="url(#w9a-bone)" stroke="#8f7c58" strokeWidth={1.8} />
      <path d={P(CRANIUM)} fill="url(#w9-bone)" opacity={0.7} />
      {/* Sutures and the temporal line. */}
      <path d="M700,76 Q684,170 700,270" fill="none" stroke="#9c8a64" strokeWidth={1.4} strokeDasharray="5 3" />
      <path d="M520,250 Q560,226 640,236 Q690,246 700,300" fill="none" stroke="#9c8a64" strokeWidth={1.2} strokeDasharray="5 3" />
      <path d={P(T_LINE, false, 0.3)} fill="none" stroke="#8f7c58" strokeWidth={1.4} opacity={0.8} />
      <path d={P(ORBIT)} fill="url(#w9a-hole)" stroke="#8f7c58" strokeWidth={1.6} />
      <path d={P(NASAL)} fill="url(#w9a-hole)" stroke="#8f7c58" strokeWidth={1.4} />
      <ellipse cx={MEATUS[0]} cy={MEATUS[1]} rx={10} ry={13} fill="url(#w9a-hole)" stroke="#8f7c58" strokeWidth={1.2} />
      {/* Upper teeth. */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={766 + i * 11.4} y={410} width={10} height={20} rx={3} fill="#fbf7ec" stroke="#a89a78" strokeWidth={0.8} />
      ))}

      {/* Arch 1 (somitomere 4): temporalis — under the zygomatic arch, so it is drawn first. */}
      <Part id="loki-muskulua" show={0.3 + 0.7 * a1} groups={['muskulu-murtsikatzaileak', 'lehen-faringe-arkua']}>
        <Muscle id="temp" d={P(TEMPORALIS, true, 0.18)} color={SM_COLOR[3]} fibres={fan(T_LINE, CORONOID, 26)} />
      </Part>

      {/* Zygomatic bone and arch, then the mandible. */}
      <path d={P(ZYGO_BODY)} fill="url(#w9a-bone)" stroke="#8f7c58" strokeWidth={1.4} />
      <path d={P(ZYGO_ARCH, true, 0.1)} fill="url(#w9a-bone)" stroke="#8f7c58" strokeWidth={1.4} />
      <g>
        <path d={P(MANDIBLE, true, 0.16)} fill="url(#w9a-bone)" stroke="#8f7c58" strokeWidth={1.8} />
        <path d={P(MANDIBLE, true, 0.16)} fill="url(#w9-bone)" opacity={0.6} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={766 + i * 11.4} y={432} width={10} height={16} rx={3} fill="#fbf7ec" stroke="#a89a78" strokeWidth={0.8} />
        ))}
        <circle cx={790} cy={470} r={3} fill="#4a3b26" />
      </g>
      <g>
        <path d="M586,392 L626,466 L620,468 L582,398Z" fill="url(#w9a-bone)" stroke="#8f7c58" strokeWidth={1} />
      </g>
      <g>
        <path d={P(HYOID, true, 0.3)} fill="url(#w9a-bone)" stroke="#8f7c58" strokeWidth={1.2} />
      </g>

      {/* Arch 1: masseter, on the outside of the ramus. */}
      <Part id="maseter-muskulua" show={0.3 + 0.7 * a1} groups={['muskulu-murtsikatzaileak', 'lehen-faringe-arkua']}>
        <Muscle id="mass" d={P(MASSETER, true, 0.2)} color={SM_COLOR[3]} fibres={sheet([608, 350], [728, 350], [594, 480], [712, 486], 16)} />
      </Part>

      {/* Arch 3 (somitomere 7): stylopharyngeus, from the styloid process down into the pharynx wall. */}
      <Part id="muskulu-estilofaringeoa" show={0.3 + 0.7 * a3} groups={['hirugarren-faringe-arkua']}>
        <Muscle id="stph" d={P([[596, 410], [606, 408], [650, 548], [640, 556]], true, 0.2)} color={SM_COLOR[6]} fibres={sheet([598, 408], [606, 408], [638, 556], [650, 552], 4)} />
      </Part>

      {/* Arch 2 (somitomere 6): muscles of facial expression and the jaw depressors. */}
      <Part id="muskulu-mimikoak" show={0.3 + 0.7 * a2} groups={['hioide-arkua']}>
        {/* Frontal belly on the forehead. */}
        <Muscle id="front" d={P([[752, 96], [812, 128], [842, 198], [840, 234], [792, 222], [744, 212], [726, 150]], true, 0.2)} color={mim} fibres={sheet([740, 100], [840, 160], [736, 214], [842, 236], 14)} />
        {/* Orbicularis oculi: a ring round the orbit. */}
        <path d="M774,206 a66,62 0 1,0 0.1,0Z M774,226 a46,42 0 1,1 -0.1,0Z" fill={mim} fillRule="evenodd" opacity={0.92} />
        <ellipse cx={774} cy={268} rx={56} ry={52} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} />
        <ellipse cx={774} cy={268} rx={61} ry={57} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1.4} />
        {/* Zygomaticus major: from the cheekbone to the corner of the mouth. */}
        <Muscle id="zyg" d={P([[744, 344], [756, 336], [874, 414], [866, 424]], true, 0.2)} color={mim} fibres={sheet([744, 342], [756, 336], [866, 424], [874, 414], 4)} />
        {/* Orbicularis oris round the lips. */}
        <path d="M884,398 Q912,426 884,456 L874,448 Q896,426 874,406Z" fill={mim} stroke="rgba(10,40,30,0.7)" strokeWidth={1.2} />
        {/* Platysma: a thin sheet over the neck. */}
        <path d={P([[706, 506], [858, 512], [826, 560], [748, 620], [690, 632], [672, 560]], true, 0.2)} fill={mim} opacity={0.45} />
      </Part>
      <Part id="barailaren-muskulu-jeistaileak" show={0.3 + 0.7 * a2} groups={['hioide-arkua']}>
        {/* Posterior belly of the digastric (mastoid → hyoid) and the stylohyoid (styloid → hyoid). */}
        <Muscle id="dig" d={P([[562, 424], [576, 418], [690, 552], [680, 558]], true, 0.2)} color={mim} fibres={sheet([562, 422], [576, 418], [680, 556], [690, 552], 4)} />
        <Muscle id="sth" d={P([[612, 452], [618, 450], [682, 548], [676, 552]], true, 0.2)} color="#1fa37f" fibres={[]} />
      </Part>

      {/* Nerves: V to the arch-1 muscles, VII over the face, IX to the stylopharyngeus. */}
      <Part id="nerbio-trigeminoa" show={n1} groups={['nerbio-kranialak']}>
        <Nerve pts={[[632, 384], [630, 340], [626, 300], [612, 228]]} plug={[626, 300]} color={SM_COLOR[3]} num="V" show={1} />
        <path d="M632,384 Q650,404 666,436" fill="none" stroke="#1a1405" strokeWidth={6} strokeLinecap="round" />
        <path d="M632,384 Q650,404 666,436" fill="none" stroke={HUE.nerve} strokeWidth={3} strokeLinecap="round" />
      </Part>
      <Part id="aurpegi-nerbioa" show={n2} groups={['nerbio-kranialak']}>
        {[
          [[578, 414], [620, 410], [690, 300], [740, 214]],
          [[620, 410], [700, 352], [748, 330]],
          [[620, 410], [720, 404], [820, 404]],
          [[620, 410], [700, 470], [800, 486]],
          [[600, 418], [650, 500], [700, 580]],
        ].map((pts, i) => (
          <g key={i}>
            <path d={P(pts as Pt[], false, 0.3)} fill="none" stroke="#1a1405" strokeWidth={5.6} strokeLinecap="round" />
            <path d={P(pts as Pt[], false, 0.3)} fill="none" stroke={HUE.nerve} strokeWidth={2.8} strokeLinecap="round" />
          </g>
        ))}
        <Nerve pts={[[578, 414], [620, 410]]} plug={[620, 410]} color={mim} num="VII" show={1} />
      </Part>
      <Part id="nerbio-glosofaringeoa" show={n3} groups={['nerbio-kranialak']}>
        <Nerve pts={[[590, 404], [600, 440], [614, 482], [636, 520]]} plug={[614, 482]} color={SM_COLOR[6]} num="IX" show={1} />
      </Part>

      {/* Which arch, which somitomere, which nerve: three chips that light with their step. */}
      {(
        [
          ['lehen-faringe-arkua', '1. arkua · 4. somitomeroa · V', SM_COLOR[3], a1],
          ['hioide-arkua', '2. arkua · 6. somitomeroa · VII', SM_COLOR[5], a2],
          ['hirugarren-faringe-arkua', '3. arkua · 7. somitomeroa · IX', SM_COLOR[6], a3],
        ] as const
      ).map(([id, text, color, s], i) => (
        <g key={id}>
          <Part id={id} show={0.35 + 0.65 * s}>
            <rect x={24} y={78 + i * 46} width={300} height={34} rx={9} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1.4} />
            <rect x={24} y={78 + i * 46} width={8} height={34} rx={4} fill={color} />
          </Part>
          <Label id={id} x={178} y={95 + i * 46} align="middle" text={text} show={0.35 + 0.65 * s} small />
        </g>
      ))}

      {/* Deep window: the pterygoids, with the masseter and the ramus taken away. */}
      <rect x={24} y={404} width={208} height={200} rx={12} fill="#16111a" stroke="rgba(255,255,255,0.22)" />
      <Note x={128} y={420} size={11} tone="dim">
        Sakonean (adarra kenduta)
      </Note>
      <path d={P([[44, 440], [212, 440], [212, 470], [44, 476]])} fill="url(#w9a-bone)" opacity={0.85} />
      <path d={P([[60, 476], [80, 474], [92, 590], [70, 592]], true, 0.2)} fill="url(#w9a-bone)" opacity={0.85} />
      <Part id="muskulu-pterigoideoak" show={0.3 + 0.7 * a1} groups={['muskulu-murtsikatzaileak', 'lehen-faringe-arkua']}>
        <Muscle id="ptl" d={P([[84, 482], [196, 470], [204, 492], [88, 512]], true, 0.2)} color={SM_COLOR[3]} fibres={sheet([84, 480], [88, 512], [198, 470], [204, 492], 6)} />
        <Muscle id="ptm" d={P([[90, 520], [112, 514], [200, 584], [176, 594]], true, 0.2)} color="#c72f78" fibres={sheet([90, 518], [112, 514], [176, 592], [200, 584], 6)} />
      </Part>
      <circle cx={206} cy={480} r={9} fill="url(#w9a-bone)" stroke="#8f7c58" />

      <Note x={620} y={30} size={12.5} tone="accent">
        Kolore bera = somitomero bera = nerbio bera
      </Note>
      <Steps
        t={t}
        steps={[
          [0.66, '4. somitomeroa → 1. arkua → muskulu murtsikatzaileak · V. nerbio trigeminoa'],
          [0.76, '6. somitomeroa → 2. arkua → muskulu mimikoak eta jeistaileak · VII. aurpegi nerbioa'],
          [0.86, '7. somitomeroa → 3. arkua → muskulu estilofaringeoa · IX. nerbio glosofaringeoa'],
        ]}
      />

      <Label id="loki-muskulua" x={560} y={56} ax={600} ay={150} align="middle" />
      <Label id="muskulu-mimikoak" x={920} y={150} ax={814} ay={176} align="end" />
      <Label id="muskulu-murtsikatzaileak" x={990} y={262} ax={712} ay={340} align="end" show={a1} />
      <Label id="maseter-muskulua" x={990} y={300} ax={690} ay={420} align="end" />
      <Label id="beheko-maxilarra" x={990} y={520} ax={822} ay={498} align="end" small />
      <Label id="barailaren-muskulu-jeistaileak" x={990} y={556} ax={664} ay={528} align="end" small />
      <Label id="hioidesa" x={404} y={592} ax={672} ay={558} align="end" small />
      <Label id="faringe-heldua" x={990} y={616} ax={650} ay={604} align="end" small />
      <Label id="nerbio-kranialak" x={404} y={250} align="end" text="Nerbio kranialak: V, VII, IX" show={n1} small />
      <Label id="nerbio-trigeminoa" x={404} y={210} ax={614} ay={232} align="end" show={n1} small />
      <Label id="aurpegi-nerbioa" x={404} y={430} ax={608} ay={412} align="end" show={n2} small />
      <Label id="apofisi-estiloidea" x={404} y={470} ax={606} ay={436} align="end" small />
      <Label id="nerbio-glosofaringeoa" x={404} y={510} ax={606} ay={470} align="end" show={n3} small />
      <Label id="muskulu-estilofaringeoa" x={404} y={550} ax={634} ay={530} align="end" />
      <Label id="muskulu-pterigoideoak" x={128} y={598} ax={140} ay={540} align="middle" small />
    </g>
  );
}
