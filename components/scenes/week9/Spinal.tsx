'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { VertebraBack, VertebraTop } from '@/components/scenes/week8/Vertebra';
import { HUE, Steps, SummaryTable, W, along, f1, vis } from './common';
import { retell } from './Somite';

/**
 * 9:nerbio-espinala — 2.2.2 (first half). The vertebra and the column are topic 8's own pictures (a vertebra
 * from above, the column from behind with the canal and a nerve pair per level). The new picture is the spinal
 * cord in transverse section, dorsal up like every section in the atlas: white matter (its three cords, tracts
 * as ⊙ up / ⊗ down), the grey H (anterior horns motor, posterior horns sensory, lateral horns vegetative — the
 * same three colours as the cranial nuclei of this topic), the roots, the ganglion, the nerve. Fibres are
 * coloured threads inside the yellow nerve cable; an impulse runs along them to show the direction.
 */

/* ---------- topic 8's vertebra and column, retold ---------- */

/** 9 `ornoa`: topic 8's vertebra from above, finished (foramen, cord inside). */
export function SpinalVertebra({ t, reduced }: SceneProps) {
  return (
    <g>
      <VertebraTop t={retell(t, [[0, 0.6], [0.06, 1]])} reduced={reduced} />
      <Label id="ornoak" x={810} y={540} ax={568} ay={548} text="Ornoa" small />
    </g>
  );
}

/** 9 `zutabea`: topic 8's column from behind: canal (0.08), then a nerve pair per segment (0.14). */
export function SpinalColumn({ t, reduced }: SceneProps) {
  const t8 = retell(t, [[0.08, 0.66], [0.13, 0.76], [0.14, 0.78], [0.16, 0.88]]);
  const segs = vis(t, 0.14, 2);
  return (
    <g>
      <VertebraBack t={t8} reduced={reduced} />
      {/* Each segment a bracket over its run of vertebrae and nerve pairs (topic 8's column: 2 cervical, 3 thoracic, 2 lumbar). */}
      <Part id="ornomuin-segmentuak" show={segs}>
        {(
          [
            [96, 244],
            [244, 466],
            [466, 614],
          ] as const
        ).map(([y0, y1], k) => (
          <path key={k} d={`M826,${y0 + 5}Q816,${y0 + 5} 816,${y0 + 16}V${y1 - 16}Q816,${y1 - 5} 826,${y1 - 5}`} fill="none" stroke="#c7d2ff" strokeWidth={2.2} strokeLinecap="round" opacity={segs} />
        ))}
      </Part>
      <Note x={846} y={540} size={12.5} align="start" show={segs}>
        … sakroak, kokzigeoak
      </Note>
      <Label id="ornomuin-segmentuak" x={990} y={600} align="end" ax={816} ay={572} show={segs} small />
    </g>
  );
}

/* ---------- the cord in section ---------- */

const C: Pt = [340, 320];
const RX = 150;
const RY = 118;
const P = (x: number, y: number): Pt => [C[0] + x, C[1] + y];
const Lf = (x: number, y: number): Pt => [C[0] - x, C[1] + y];
const both = (loc: [number, number][]) => [loc.map(([x, y]) => P(x, y)), loc.map(([x, y]) => Lf(x, y))];
const D = (pts: Pt[], closed = true, k = 0.2) => smoothPath(pts, closed, k);

/** Grey matter, right half, top midline → bottom midline (local units). */
const GREY_R: [number, number][] = [
  [0, -22], [10, -28], [30, -58], [48, -92], [58, -104], [70, -98], [64, -74], [46, -40], [50, -16], [66, -10], [70, 4], [60, 12],
  [84, 30], [104, 52], [106, 78], [88, 92], [60, 86], [34, 70], [16, 46], [0, 40],
];
const GREY: Pt[] = [...GREY_R.map(([x, y]) => P(x, y)), ...GREY_R.slice(1, -1).reverse().map(([x, y]) => Lf(x, y))];
const POST_H: [number, number][] = [[12, -28], [30, -58], [48, -92], [58, -104], [70, -98], [64, -74], [46, -40], [30, -26]];
const ANT_H: [number, number][] = [[60, 12], [84, 30], [104, 52], [106, 78], [88, 92], [60, 86], [34, 70], [18, 46], [30, 22]];
const LAT_H: [number, number][] = [[46, -26], [50, -16], [66, -10], [70, 4], [54, 6]];
/** White-matter cords (sectors, clipped to the cord outline). */
const POST_C: [number, number][] = [[0, -22], [0, -150], [86, -150], [58, -104], [48, -92], [30, -58], [10, -28]];
const LAT_C: [number, number][] = [[58, -104], [86, -150], [220, -150], [220, 140], [106, 78], [104, 52], [84, 30], [60, 12], [70, 4], [66, -10], [50, -16], [46, -40], [64, -74], [70, -98]];
const ANT_C: [number, number][] = [[106, 78], [220, 140], [0, 170], [0, 40], [16, 46], [34, 70], [60, 86], [88, 92]];

/** Tract markers: ⊙ ascending, ⊗ descending. */
const TRACTS: { p: [number, number]; up: boolean }[] = [
  { p: [16, -78], up: true }, { p: [20, -50], up: true }, { p: [34, -100], up: true },
  { p: [104, -52], up: true }, { p: [124, -10], up: false }, { p: [120, 30], up: true }, { p: [92, -78], up: false },
  { p: [40, 102], up: false }, { p: [84, 104], up: false }, { p: [18, 84], up: false },
];

const MOTOR: Pt = P(70, 58);
const SENS: Pt = P(44, -64);
const VEG: Pt = P(60, -4);
const TRACT_UP: Pt = P(122, -32);

const GANG: Pt = [566, 198];
const J: Pt = [676, 316];
const K: Pt = [746, 316];
const DR: Pt[] = [P(62, -110), [452, 186], [512, 182], GANG];
const DR2: Pt[] = [GANG, [612, 216], [652, 262], J];
const VR: Pt[] = [P(100, 88), [500, 424], [570, 414], [632, 372], J];
const TRUNK: Pt[] = [J, K];
const PPR: Pt[] = [K, [786, 262], [826, 202], [866, 150]];
const APR: Pt[] = [K, [792, 372], [826, 424], [850, 462]];
const MUSCLE_W: Pt = [906, 506];
const SKIN_W: Pt = [906, 562];

const cat = (...ps: Pt[][]) => ps.flatMap((p, i) => (i ? p.slice(1) : p));
const MOTOR_AXON = cat([MOTOR, P(92, 76)], VR, TRUNK, APR, [APR[APR.length - 1], MUSCLE_W]);
const CENTRIFUGAL = cat(DR2, TRUNK, APR, [APR[APR.length - 1], [828, 516], [852, 558], SKIN_W]);
const CENTRIPETAL = [...DR].reverse().concat([P(52, -88), SENS]);
const UP_AXON: Pt[] = [SENS, P(80, -48), TRACT_UP];
const BACK_M: Pt = [892, 128];
const MOTOR_AXON_P = cat([MOTOR, P(92, 76)], VR, TRUNK, PPR, [PPR[PPR.length - 1], BACK_M]);
const CENTRIFUGAL_P = cat(DR2, TRUNK, PPR, [PPR[PPR.length - 1], [840, 112], [846, 80]]);
const SENS_IN = [...CENTRIFUGAL].reverse().concat(CENTRIPETAL.slice(1), UP_AXON.slice(1));

/** A cable: dark rim, nerve-yellow core. */
function Cable({ pts, w = 10, show = 1 }: { pts: Pt[]; w?: number; show?: number }) {
  if (show <= 0.01) return null;
  const d = D(pts, false, 0.3);
  return (
    <g opacity={show}>
      <path d={d} fill="none" stroke="#6b5608" strokeWidth={w + 4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={W.nerve} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}
/** A fibre thread (part of a path) inside the cable. */
function Thread({ pts, color, u = 1, show = 1, w = 2.6 }: { pts: Pt[]; color: string; u?: number; show?: number; w?: number }) {
  if (show <= 0.01 || u <= 0.01) return null;
  const n = 120;
  const sub = Array.from({ length: Math.max(2, Math.round(n * u)) }, (_, i) => along(pts, (i / (n - 1)) * 1));
  return <path d={D(sub, false, 0.3)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={show} />;
}
/** An impulse: a bright bead running along `pts`, repeating every `period` of stage time inside [a, b]. */
function Impulse({ t, a, b, period, pts, color }: { t: number; a: number; b: number; period: number; pts: Pt[]; color: string }) {
  if (t < a || t > b) return null;
  const u = ((t - a) / period) % 1;
  const p = along(pts, u);
  return (
    <g>
      <circle cx={f1(p[0])} cy={f1(p[1])} r={11} fill={color} opacity={0.3} />
      <circle cx={f1(p[0])} cy={f1(p[1])} r={5} fill="#fff" stroke={color} strokeWidth={2} />
    </g>
  );
}

const FIB = { m: '#fb7185', s: '#7dd3fc', v: '#86efac' };

export interface SpinalShow {
  cord: number;
  grey: number;
  ant: number;
  post: number;
  lat: number;
  white: number;
  vr: number;
  dr: number;
  gang: number;
  sensFibres: number;
  /** Motor thread grown so far, and the wall muscle's twitch. */
  motorU: number;
  contract: number;
  /** Stage 9: the two primary rami in their colours, with their own threads; domain colours on the muscles. */
  rami: number;
  dom: number;
}

/** The section: cord, roots, nerve, periphery. `s` says how much of each is in. */
function Section({ s, uid, ids }: { s: SpinalShow; uid: string; ids: { back: string; wall: string } }) {
  const clip = `${uid}-cord`;
  const { motorU, contract } = s;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <ellipse cx={C[0]} cy={C[1]} rx={RX} ry={RY} />
        </clipPath>
        <pattern id={`${uid}-stri`} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0,0V7" stroke="rgba(60,4,10,0.45)" strokeWidth={1.4} />
        </pattern>
        {/* Grey matter: scattered neuron cell bodies. */}
        <pattern id={`${uid}-soma`} width="34" height="29" patternUnits="userSpaceOnUse">
          {(
            [
              [4, 5, 2.1, 0.55],
              [15, 2, 1.1, 0.35],
              [26, 8, 1.6, 0.5],
              [9, 15, 1.3, 0.4],
              [21, 19, 2.3, 0.55],
              [31, 21, 1, 0.3],
              [3, 25, 1.5, 0.45],
              [14, 26, 0.9, 0.3],
            ] as const
          ).map(([x, y, r, o], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={`rgba(40,30,44,${o})`} />
          ))}
        </pattern>
        {/* White matter: myelinated fibres cut across, a fine stipple; lighter at the rim. */}
        <pattern id={`${uid}-myel`} width="9" height="8" patternUnits="userSpaceOnUse">
          <circle cx={2} cy={2} r={1.1} fill="none" stroke="rgba(120,104,80,0.28)" strokeWidth={0.7} />
          <circle cx={6.5} cy={6} r={1} fill="none" stroke="rgba(120,104,80,0.22)" strokeWidth={0.7} />
        </pattern>
        <radialGradient id={`${uid}-wm`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#e9e2d2" />
          <stop offset="100%" stopColor="#f6f1e6" />
        </radialGradient>
      </defs>
      {/* Periphery: the back (dorsal) and the body wall, each with its skin. */}
      <g opacity={Math.max(s.vr, s.rami)}>
        <path d="M790,70Q900,58 1000,66V84Q900,76 790,88Z" fill="#e8b48f" opacity={0.75} />
        <Part id={ids.back} show={Math.max(s.vr, s.rami)} groups={['muskulu-ildaskatuak']}>
          <ellipse cx={900} cy={130} rx={80} ry={34} fill={W.striated} stroke="#7a1d1d" strokeWidth={1.6} />
          <ellipse cx={900} cy={130} rx={80} ry={34} fill={`url(#${uid}-stri)`} />
        </Part>
        <Part id={ids.wall} show={s.vr} groups={['muskulu-ildaskatuak']}>
          <g transform={`translate(${f1(MUSCLE_W[0])} ${f1(MUSCLE_W[1])}) scale(${f1(1 - 0.12 * contract)} 1) translate(${-MUSCLE_W[0]} ${-MUSCLE_W[1]})`}>
            <rect x={838} y={470} width={150} height={72} rx={22} fill={W.striated} stroke="#7a1d1d" strokeWidth={1.6} />
            <rect x={838} y={470} width={150} height={72} rx={22} fill={`url(#${uid}-stri)`} />
          </g>
        </Part>
        <path d="M820,552Q900,560 1000,552V570Q900,578 820,570Z" fill="#e8b48f" opacity={0.75} />
      </g>
      {/* Origin is not innervation: the muscles in their domain colours. */}
      {s.dom > 0.01 && (
        <g opacity={s.dom}>
          <Part id="domeinu-primaxiala" show={s.dom}>
            <ellipse cx={900} cy={130} rx={80} ry={34} fill={HUE.primaxial} fillOpacity={0.55} stroke={HUE.primaxial} strokeWidth={2} />
          </Part>
          <Part id="saihets-arteko-muskuluak" show={s.dom} groups={['domeinu-primaxiala']}>
            <path d="M860,470H912V542H860Q838,542 838,520V492Q838,470 860,470Z" fill={HUE.primaxial} fillOpacity={0.55} stroke={HUE.primaxial} strokeWidth={2} />
          </Part>
          <Part id="abdomeneko-muskuluak" show={s.dom} groups={['domeinu-abaxiala']}>
            <path d="M912,470H966Q988,470 988,492V520Q988,542 966,542H912Z" fill={HUE.abaxial} fillOpacity={0.55} stroke={HUE.abaxial} strokeWidth={2} />
          </Part>
          <Part id="domeinu-abaxiala" show={s.dom}>
            <path d="M912,470H966Q988,470 988,492V520Q988,542 966,542H912Z" fill="none" />
          </Part>
        </g>
      )}

      {/* Cord: white matter and its three cords. */}
      <Part id="ornomuina" show={s.cord}>
        <ellipse cx={C[0]} cy={C[1]} rx={RX + 4} ry={RY + 4} fill="#3a3550" />
        <ellipse cx={C[0]} cy={C[1]} rx={RX} ry={RY} fill={`url(#${uid}-wm)`} />
      </Part>
      <Part id="gai-zuria" show={s.cord} quiet>
        <ellipse cx={C[0]} cy={C[1]} rx={RX} ry={RY} fill={`url(#${uid}-wm)`} />
        <ellipse cx={C[0]} cy={C[1]} rx={RX} ry={RY} fill={`url(#${uid}-myel)`} />
      </Part>
      <g clipPath={`url(#${clip})`} opacity={s.white}>
        {(
          [
            ['atzeko-kordoia', POST_C, '#efe6c8'],
            ['alboko-kordoia', LAT_C, '#d4e3f6'],
            ['aurreko-kordoia', ANT_C, '#e6d9f2'],
          ] as const
        ).map(([id, loc, fill]) => (
          <Part key={id} id={id} show={s.white} groups={['gai-zuria']}>
            {both(loc as unknown as [number, number][]).map((pts, i) => (
              <path key={i} d={`M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`} fill={fill} stroke="#9aa3bd" strokeWidth={1} />
            ))}
          </Part>
        ))}
      </g>
      {/* Midline: posterior sulcus, anterior fissure. */}
      <path d={`M${C[0]},${C[1] - RY}V${C[1] - 24}M${C[0]},${C[1] + RY}V${C[1] + 96}`} stroke="#3a3550" strokeWidth={2.4} opacity={s.cord} />
      {/* Tracts, running up and down through the white matter. */}
      <Part id="traktuak" show={s.white} groups={['gai-zuria']}>
        {TRACTS.flatMap((tr, i) =>
          [P(tr.p[0], tr.p[1]), Lf(tr.p[0], tr.p[1])].map((q, j) => (
            <g key={`${i}${j}`} opacity={s.white}>
              <circle cx={f1(q[0])} cy={f1(q[1])} r={5.5} fill="#fff" stroke="#5b6480" strokeWidth={1.3} />
              {tr.up ? <circle cx={f1(q[0])} cy={f1(q[1])} r={1.8} fill="#5b6480" /> : <path d={`M${f1(q[0] - 3)},${f1(q[1] - 3)}l6,6m0,-6l-6,6`} stroke="#5b6480" strokeWidth={1.3} />}
            </g>
          )),
        )}
      </Part>

      {/* Grey matter: the H, then its horns as their own pieces. */}
      <Part id="gai-grisa" show={s.grey}>
        <path d={D(GREY)} fill="#9a8e98" stroke="#4a3f4a" strokeWidth={1.6} />
        <path d={D(GREY)} fill={`url(#${uid}-soma)`} />
      </Part>
      {(
        [
          ['atzeko-adarra', POST_H, s.post],
          ['alboko-adarra', LAT_H, s.lat],
          ['aurreko-adarra', ANT_H, s.ant],
        ] as const
      ).map(([id, loc, k]) => (
        <Part key={id} id={id} show={Math.max(k, s.grey * 0.6)} groups={['gai-grisa']}>
          {both(loc as unknown as [number, number][]).map((pts, i) => (
            <g key={i}>
              <path d={D(pts)} fill="#a39aa3" stroke={k > 0.5 ? '#fff7e8' : '#4a3f4a'} strokeWidth={k > 0.5 ? 2 : 1} />
              <path d={D(pts)} fill={`url(#${uid}-soma)`} />
            </g>
          ))}
        </Part>
      ))}
      <Part id="enimo-hodia" show={s.lat}>
        <circle cx={C[0]} cy={C[1]} r={6} fill="#1d2140" stroke="#eef0f8" strokeWidth={1.4} />
      </Part>

      {/* Neuron somata: motor (anterior), sensory (posterior), vegetative (lateral). */}
      <Part id="neurona-motoreak" show={s.ant}>
        {[MOTOR, Lf(70, 58), P(50, 74), Lf(50, 74)].map((q, i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} d={`M${f1(q[0])},${f1(q[1])}l${f1(Math.cos((a * Math.PI) / 180) * 14)},${f1(Math.sin((a * Math.PI) / 180) * 14)}`} stroke={FIB.m} strokeWidth={2} strokeLinecap="round" />
            ))}
            <circle cx={f1(q[0])} cy={f1(q[1])} r={i ? 6 : 8} fill={FIB.m} stroke="#5a0d1a" strokeWidth={1.2} />
          </g>
        ))}
      </Part>
      <Part id="neurona-sentsorialak" show={s.post}>
        {[SENS, Lf(44, -64), P(36, -44), Lf(36, -44)].map((q, i) => (
          <circle key={i} cx={f1(q[0])} cy={f1(q[1])} r={i ? 4.5 : 6} fill={FIB.s} stroke="#0c3a52" strokeWidth={1.2} />
        ))}
      </Part>
      <Part id="neurona-begetatiboak" show={s.lat}>
        {[VEG, Lf(60, -4)].map((q, i) => (
          <circle key={i} cx={f1(q[0])} cy={f1(q[1])} r={4.5} fill={FIB.v} stroke="#14532d" strokeWidth={1.2} />
        ))}
      </Part>

      {/* Roots, nerve trunk, rami. */}
      <Part id="atzeko-sustraia" show={s.dr}>
        <Cable pts={DR} w={8} />
        <Cable pts={DR2} w={8} />
      </Part>
      <Part id="aurreko-sustraia" show={s.vr}>
        <Cable pts={VR} w={8} />
      </Part>
      <Part id="nerbio-espinalak" show={s.vr}>
        <Cable pts={TRUNK} w={13} />
      </Part>
      <Part id="atzeko-adar-primarioa" show={Math.max(s.vr, s.rami)}>
        {s.rami > 0.01 && <path d={D(PPR, false, 0.3)} fill="none" stroke={HUE.dorsalRamus} strokeWidth={22} strokeLinecap="round" opacity={0.35 * s.rami} />}
        <Cable pts={PPR} w={9} />
      </Part>
      <Part id="aurreko-adar-primarioa" show={s.vr}>
        {s.rami > 0.01 && <path d={D(APR, false, 0.3)} fill="none" stroke={HUE.ventralRamus} strokeWidth={22} strokeLinecap="round" opacity={0.35 * s.rami} />}
        <Cable pts={APR} w={10} />
      </Part>
      <Part id="gongoil-errakideoak" show={s.dr}>
        <ellipse cx={GANG[0]} cy={GANG[1]} rx={30} ry={20} transform={`rotate(14 ${GANG[0]} ${GANG[1]})`} fill="#f6e27a" stroke="#6b5608" strokeWidth={2} />
        <circle cx={GANG[0]} cy={GANG[1]} r={7} fill={FIB.s} stroke="#0c3a52" strokeWidth={1.2} />
      </Part>

      {/* Fibres as threads. */}
      <Part id="axoi-motoreak" show={s.vr}>
        <Thread pts={MOTOR_AXON} color={FIB.m} u={motorU} />
      </Part>
      <Part id="luzapen-zentrifugoa" show={s.sensFibres}>
        <Thread pts={CENTRIFUGAL} color={FIB.s} show={s.sensFibres} />
      </Part>
      <Part id="luzapen-zentripetoa" show={s.sensFibres}>
        <Thread pts={CENTRIPETAL} color={FIB.s} show={s.sensFibres} />
      </Part>
      <Thread pts={UP_AXON} color={FIB.s} show={s.gang} w={2} />
      {s.rami > 0.01 && (
        <g>
          <Thread pts={MOTOR_AXON_P} color={FIB.m} show={s.rami} />
          <Thread pts={CENTRIFUGAL_P} color={FIB.s} show={s.rami} />
        </g>
      )}
    </g>
  );
}

/** 9:nerbio-espinala `ornomuina`. */
export function SpinalCord({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const s: SpinalShow = {
    cord: 1,
    grey: seg(t, 0.2, 0.24),
    ant: seg(t, 0.28, 0.31),
    post: seg(t, 0.36, 0.39),
    lat: seg(t, 0.44, 0.47),
    white: seg(t, 0.52, 0.55),
    vr: seg(t, 0.62, 0.64),
    dr: seg(t, 0.76, 0.79),
    gang: seg(t, 0.86, 0.89),
    sensFibres: seg(t, 0.78, 0.82),
    motorU: seg(t, 0.62, 0.66),
    contract: t > 0.62 ? Math.max(0, Math.sin((((t - 0.62) / 0.03) % 1) * Math.PI)) * vis(t, 0.66, 0.76) : 0,
    rami: 0,
    dom: 0,
  };
  // Steps 4–8 are about the cord itself (grey matter, horns, canal, white matter): the camera moves in on it,
  // then back out when the roots and the nerve leave it for the muscles.
  const zm = seg(t, 0.2, 0.24) * (1 - seg(t, 0.585, 0.62));
  const z = zoom(C[0], C[1], lerp(1, 1.6, zm), lerp(C[0], 400, zm), C[1]);
  const Z = (p: Pt): Pt => z.at(p[0], p[1]);
  const L = (id: string, x: number, y: number, at: Pt, show = 1, small = false) => {
    const a = Z(at);
    return <Label key={id} id={id} x={x} y={y} ax={a[0]} ay={a[1]} show={show} small={small} align="start" />;
  };
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#120f18" />
      <g transform={z.transform}>
        <Section s={s} uid={uid} ids={{ back: 'muskulu-ildaskatuak', wall: 'muskulu-ildaskatuak' }} />
        <Impulse t={t} a={0.66} b={0.76} period={0.03} pts={MOTOR_AXON} color={FIB.m} />
        <Impulse t={t} a={0.9} b={1} period={0.04} pts={SENS_IN} color={FIB.s} />
      </g>
      <Note x={340} y={24} size={12.5} tone="accent">
        Ornomuina zeharka ebakita (atzea goian)
      </Note>
      <Note x={lerp(340, 770, zm)} y={lerp(470, 540, zm)} size={12} tone="dim" show={s.white}>
        ⊙ goranzko traktua · ⊗ beheranzkoa
      </Note>
      <Steps
        t={t}
        steps={[
          [0.2, 'Barruan tximeleta (H) itxurako gai grisa: neuronen somak'],
          [0.28, 'Aurreko 2 adarrak: neurona motoreak'],
          [0.36, 'Atzeko 2 adarrak: neurona sentsorialak'],
          [0.44, 'Albokoak (ez beti): neurona begetatiboak · erdian enimo hodia'],
          [0.52, 'Kanpoan gai zuria: atzeko, alboko eta aurreko kordoiak, goranzko eta beheranzko traktuekin'],
          [0.62, 'Axoi motoreak → aurreko sustraia → nerbioaren enborra → periferiara: muskulu ildaskatuak uzkurtu'],
          [0.76, 'Aurreko eta atzeko sustraiak batu: nerbio espinala (zuntz motoreak + sentsorialak)'],
          [0.86, 'Atzeko sustraian gongoil errakideoa: luzapen zentrifugoa (periferiatik) eta zentripetoa (ornomuinera)'],
        ]}
      />

      {/* Left half: the parts of the cord (both sides are the same). */}
      {L('ornomuina', 14, 70, Lf(24, -119))}
      {L('gai-zuria', 14, 120, Lf(64, -100), s.cord)}
      {L('atzeko-kordoia', 14, 175, Lf(20, -96), s.white)}
      {L('atzeko-adarra', 14, 222, Lf(54, -84), s.post)}
      {L('alboko-adarra', 14, 280, Lf(64, -4), s.lat, true)}
      {L('alboko-kordoia', 14, 360, Lf(130, 10), s.white)}
      {L('enimo-hodia', 14, 400, [C[0] - 6, C[1] + 2], s.lat, true)}
      {L('aurreko-adarra', 14, 450, Lf(92, 66), s.ant)}
      {L('aurreko-kordoia', 14, 520, Lf(30, 104), s.white)}
      {L('gai-grisa', 250, 590, [C[0] - 4, C[1] + 30], s.grey)}
      {/* Right half: neurons, roots, nerve. */}
      {L('neurona-sentsorialak', 300, 64, SENS, s.post, true)}
      {L('luzapen-zentripetoa', 480, 64, along(CENTRIPETAL, 0.15), s.sensFibres, true)}
      {L('gongoil-errakideoak', 700, 64, [GANG[0] + 14, GANG[1] - 14], s.dr)}
      {L('atzeko-sustraia', 380, 150, along(DR, 0.3), s.dr, true)}
      {L('neurona-begetatiboak', lerp(560, 680, zm), 250, VEG, s.lat, true)}
      {L('traktuak', lerp(560, 680, zm), 290, TRACT_UP, s.white, true)}
      {L('nerbio-espinalak', 700, 380, along(TRUNK, 0.5), s.vr)}
      {L('luzapen-zentrifugoa', 850, 400, along(CENTRIFUGAL, 0.62), s.sensFibres, true)}
      {L('muskulu-ildaskatuak', 850, 450, [870, 490], s.vr, true)}
      {L('neurona-motoreak', lerp(470, 680, zm), lerp(560, 410, zm), MOTOR, s.ant, true)}
      {L('aurreko-sustraia', 600, 520, along(VR, 0.75), s.vr, true)}
      {L('axoi-motoreak', 760, 600, along(MOTOR_AXON, 0.9), s.vr, true)}
    </g>
  );
}

/* ---------- 9:epaxial-hipaxial ---------- */

/** 9:epaxial-hipaxial `adarrak`: the same section, the two primary rami in their colours, each to its muscles. */
export function SpinalRami({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const rami = seg(t, 0, 0.04);
  const dom = vis(t, 0.26, 2);
  const s: SpinalShow = { cord: 1, grey: 1, ant: 1, post: 1, lat: 1, white: 1, vr: 1, dr: 1, gang: 1, sensFibres: 1, motorU: 1, contract: 0, rami, dom };
  const levels = vis(t, 0.14, 0.26);
  const L = (id: string, x: number, y: number, at: Pt, show = 1, small = false, text?: string) => (
    <Label key={`${id}${x}${y}`} id={id} x={x} y={y} ax={at[0]} ay={at[1]} show={show} small={small} align="start" text={text} />
  );
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#120f18" />
      <Section s={s} uid={uid} ids={{ back: 'muskulu-epaxialak', wall: 'muskulu-hipaxialak' }} />
      <Impulse t={t} a={0.03} b={0.14} period={0.035} pts={MOTOR_AXON_P} color={FIB.m} />
      <Impulse t={t} a={0.045} b={0.14} period={0.035} pts={MOTOR_AXON} color={FIB.m} />
      <Note x={340} y={24} size={12.5} tone="accent" show={Math.max(0, 1 - levels - dom)}>
        Nerbio espinalaren enborretik bi adar primario
      </Note>
      <Note x={340} y={24} size={12.5} tone="warn" show={levels}>
        Ez nahastu: gai grisaren adarrak · sustraiak · nerbioaren adar primarioak
      </Note>
      <Note x={340} y={24} size={12.5} tone="warn" show={dom}>
        Kolorea = jatorria (domeinua) · adarra = inerbazioa: ez dute zerikusirik
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Aurreko adar primarioa → aurreko muskuluak · atzeko adar primarioa → atzeko muskuluak (biak motoreak + sentsorialak)'],
          [0.14, 'Gai grisaren aurreko/atzeko adarrak ≠ aurreko/atzeko sustraiak ≠ aurreko/atzeko adar primarioak'],
          [0.26, 'Atzeko adarra: bizkarreko sakonak (primaxialak) · aurreko adarra: saihets artekoak (primaxialak) eta abdomenekoak (abaxialak)'],
        ]}
      />
      {L('ornomuina', 14, 70, Lf(24, -119))}
      {L('atzeko-adarra', 14, 222, Lf(54, -84))}
      {L('aurreko-adarra', 14, 450, Lf(92, 66))}
      {L('axoi-motoreak', 14, 540, Lf(30, 104), 1, true, 'Zuntz motoreak (gorria) · sentsorialak (urdina)')}
      {L('atzeko-sustraia', 380, 150, along(DR, 0.3), 1, true)}
      {L('gongoil-errakideoak', 700, 64, [GANG[0] + 14, GANG[1] - 14], 1, true)}
      {L('nerbio-espinalak', 640, 380, along(TRUNK, 0.5))}
      {L('aurreko-sustraia', 470, 560, along(VR, 0.55), 1, true)}
      {L('atzeko-adar-primarioa', 560, 230, along(PPR, 0.45), rami)}
      {L('aurreko-adar-primarioa', 640, 470, along(APR, 0.55), rami)}
      {L('muskulu-epaxialak', 690, 130, [822, 132], rami)}
      {L('muskulu-hipaxialak', 850, 600, [956, 548], rami)}
      {L('domeinu-primaxiala', 690, 176, [846, 150], dom, true)}
      {L('saihets-arteko-muskuluak', 600, 520, [866, 524], dom, true, 'Saihets artekoak (primaxialak)')}
      <Label id="abdomeneko-muskuluak" x={990} y={440} align="end" ax={950} ay={480} show={dom} small text="Abdomenekoak (abaxialak)" />
      {/* Their domain: here the abdominal muscles are all of it (the same block, its lower half). */}
      <Label id="domeinu-abaxiala" x={990} y={404} align="end" ax={958} ay={526} show={dom} small />
    </g>
  );
}

/** 9:epaxial-hipaxial `zutabea`: topic 8's column from behind; one long deep back muscle on each side gets posterior-ramus twigs from many levels. */
export function EpaxialColumn({ t, reduced }: SceneProps) {
  const k = seg(t, 0.58, 0.59);
  const D8 = (i: number) => 96 + i * 74 + 37;
  const twig = (i: number) => seg(t, 0.584 + i * 0.002, 0.592 + i * 0.002);
  return (
    <g>
      <VertebraBack t={0.88} reduced={reduced} />
      <Part id="bizkarreko-muskulu-sakonak" show={k} groups={['muskulu-epaxialak']}>
        {[1, -1].map((sd) => (
          <g key={sd} opacity={k}>
            <rect x={sd > 0 ? 772 : 1000 - 772 - 40} y={84} width={40} height={490} rx={18} fill={W.striated} stroke="#7a1d1d" strokeWidth={1.6} />
            <path d={Array.from({ length: 12 }, (_, j) => `M${sd > 0 ? 776 + j * 3 : 192 + j * 3},90V568`).join('')} stroke="rgba(60,4,10,0.35)" strokeWidth={1} />
          </g>
        ))}
      </Part>
      <Part id="atzeko-adar-primarioa" show={twig(0)}>
        {[0, 1, 2, 3, 4, 5].map((i) =>
          [1, -1].map((sd) => {
            const u = twig(i);
            if (u <= 0.01) return null;
            const x0 = 500 + sd * 236;
            const x1 = 500 + sd * (236 + 50 * u);
            const y0 = D8(i) + 4;
            const d = `M${x0},${y0}Q${(x0 + x1) / 2},${y0 - 14} ${x1},${y0 - 10}`;
            return (
              <g key={`${i}${sd}`}>
                <path d={d} fill="none" stroke={HUE.dorsalRamus} strokeWidth={7} strokeLinecap="round" opacity={0.45} />
                <path d={d} fill="none" stroke={W.nerve} strokeWidth={3.6} strokeLinecap="round" />
              </g>
            );
          }),
        )}
      </Part>
      {/* Overlay: the same strips, as the epaxial group (their innervation name), with a motor thread in each twig. */}
      <Part id="muskulu-epaxialak" show={k}>
        {[1, -1].map((sd) => (
          <rect key={sd} x={sd > 0 ? 772 : 188} y={84} width={40} height={490} rx={18} fill="none" stroke={HUE.dorsalRamus} strokeWidth={2.4} opacity={k} />
        ))}
      </Part>
      <Part id="axoi-motoreak" show={twig(0)}>
        {[0, 1, 2, 3, 4, 5].map((i) =>
          [1, -1].map((sd) => {
            const u = twig(i);
            if (u <= 0.01) return null;
            const x0 = 500 + sd * 236;
            const x1 = 500 + sd * (236 + 50 * u);
            const y0 = D8(i) + 4;
            return <path key={`${i}${sd}`} d={`M${x0},${y0}Q${(x0 + x1) / 2},${y0 - 14} ${x1},${y0 - 10}`} fill="none" stroke={FIB.m} strokeWidth={1.3} strokeLinecap="round" />;
          }),
        )}
      </Part>
      <Note x={500} y={590} size={12.5} tone="accent" show={k}>
        Muskulu luzeak: maila askotako atzeko adarren zuntz motoreak iristen zaizkie
      </Note>
      <Label id="muskulu-epaxialak" x={990} y={260} align="end" ax={812} ay={300} show={k} />
      <Label id="bizkarreko-muskulu-sakonak" x={14} y={364} align="start" ax={190} ay={372} show={k} small />
      <Label id="axoi-motoreak" x={990} y={520} align="end" ax={500 + 262} ay={D8(5) - 8} show={twig(5)} small text="Zuntz motoreak (gorria)" />
      <Label id="atzeko-adar-primarioa" x={990} y={470} align="end" ax={500 + 270} ay={D8(4) - 6} show={twig(4)} small />
    </g>
  );
}

const RAMI_ROWS = (green: string, magenta: string) => [
  { at: 0.38, cells: [{ id: 'gorputz-paretako-muskuluak', text: 'Gorputz paretako muskulu ildaskatu guztiak', color: green }, { id: 'bizkarreko-muskulu-sakonak', text: 'Bizkarreko muskulu sakonak (hedatzaile autoktonoak)', color: magenta }] },
  { at: 0.4, cells: [{ id: 'urrutiko-muskuluak', text: 'Gorputz-adarretako muskulu guztiak', color: green }, { text: '—' }] },
  { at: 0.42, cells: [{ id: 'erronboideak', text: 'Autoktonoen azalekoak (erronboideak…)', color: green }, { text: '—' }] },
  { at: 0.44, cells: [{ text: '(Ia-ia gorputzeko muskulu ildaskatu guztiak)', color: green }, { text: '—' }] },
  { at: 0.5, cells: [{ id: 'muskulu-hipaxialak', text: '= muskulu HIPAXIALAK', color: green }, { id: 'muskulu-epaxialak', text: '= muskulu EPAXIALAK (atzekoak)', color: magenta }] },
];

/** 9:epaxial-hipaxial `taula`: which ramus innervates what, then the names that follow from it. */
export function RamiTable({ t }: SceneProps) {
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#120a10" />
      <SummaryTable t={t} x={20} y={70} widths={[480, 428]} rowH={56} head={['Aurreko adar primarioko zuntz motoreek', 'Atzeko adar primarioko zuntz motoreek']} rows={RAMI_ROWS(HUE.ventralRamus, HUE.dorsalRamus)} />
      <Part id="axoi-motoreak" show={seg(t, 0.38, 0.41)}>
        <path d="M250,36H290" stroke={FIB.m} strokeWidth={3} strokeLinecap="round" />
      </Part>
      <Label id="axoi-motoreak" x={300} y={36} align="start" show={seg(t, 0.38, 0.41)} text="Zuntz motoreek: zein muskulu inerbatzen dituzte?" />
      <Note x={480} y={470} size={12.5} tone="dim" show={seg(t, 0.5, 0.53)}>
        Epaxialak: bizkarrezurreko muskulu sakonak · hipaxialak: gainerako guztiak (aurreko taulakoak)
      </Note>
    </g>
  );
}
