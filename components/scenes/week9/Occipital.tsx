'use client';

import { Journey, Label, Note, Part, clamp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { Defs9, HUE, Steps, SummaryTable, W, along, f1, resample, vis, type TableRow } from './common';
import { BARS, EYE, g32, somite } from './EmbryoWindow';
import { HZ, HeadInside, MOUTH, Nerve, SM_COLOR, archMid, hz } from './Head';

/**
 * Topic 9, stage `okzipitalak` (2.1.2 Somitak · 2.1.3 Inerbazioa · the 2.1.4 table).
 * - `burua`: the same 5-week head as the somitomere stage (topic 5's embryo, skin window): five occipital
 *   somites, the first one vanishing; somites 1–2 into arches 4/6 (larynx, X), somites 2–5 round the
 *   pharynx into the tongue (XII); then a nerve tag on every head muscle.
 * - `garuna`: the wiring — nucleus columns in the brainstem, fibres through the holes of the skull base
 *   (topic 8's bone), each nerve's tag in the colour of the muscles' origin, the muscles at the end.
 * - `taula`: the notes' table, built row by row in the same colours.
 */

/* ------------------------------------------------------------------ */
/* burua                                                                */
/* ------------------------------------------------------------------ */

/** Where the larynx forms (ventral end of arches 4/6) and the tongue (floor of the pharynx under arches 1–3), model space. */
const LARYNX: Pt = [BARS[3].bot[0] - 2, BARS[3].bot[1] + 9];
const TONGUE: Pt = [(BARS[0].bot[0] + BARS[1].bot[0] + BARS[2].bot[0]) / 3 + 2, (BARS[0].bot[1] + BARS[1].bot[1] + BARS[2].bot[1]) / 3 - 2];

/** A stream of cells along a route (screen space): the lead cell with its route, followers behind it. */
function RouteStream({ route, prog, color, n = 6 }: { route: Pt[]; prog: number; color: string; n?: number }) {
  if (prog <= 0.01) return null;
  const pts = resample(route, 40);
  const lead = clamp(prog);
  const trail = Array.from({ length: 18 }, (_, i) => along(pts, (i / 17) * lead));
  return (
    <g>
      <Journey pts={trail} color={color} head={8} width={2.6} r={7} />
      {Array.from({ length: n }, (_, i) => {
        const u = clamp(lead - i * 0.06);
        const p = along(pts, u);
        return <circle key={i} cx={f1(p[0])} cy={f1(p[1])} r={4.6} fill={color} stroke="rgba(10,10,20,0.6)" strokeWidth={1} opacity={u > 0.02 ? 1 : 0} />;
      })}
    </g>
  );
}

const S = g32.S;

export function OccipitalHead({ t }: SceneProps) {
  const gone = seg(t, 0.04, 0.09);
  const toLar = seg(t, 0.105, 0.145);
  const toTongue = seg(t, 0.2, 0.245);
  const nX = seg(t, 0.13, 0.155);
  const nXII = seg(t, 0.23, 0.255);
  const plugs = seg(t, 0.3, 0.35);
  const occ = [-1, 0, 1, 2, 3].map((i) => hz(somite(i).c));
  const lar = hz(LARYNX);
  const tongue = hz(TONGUE);
  const a46 = hz(archMid(3));
  const eye = hz(EYE);
  // Somites 1–2 into arches 4/6; somites 2–5 down behind arches 4/6 and forward under the arches to the tongue.
  const larRoute: Pt[] = [[(occ[0][0] + occ[1][0]) / 2, occ[0][1] + 12], [a46[0] - 4, (occ[1][1] + a46[1]) / 2], a46];
  const tongueRoute: Pt[] = [[(occ[2][0] + occ[3][0]) / 2, occ[2][1] + 16], [a46[0] + 34, a46[1] - 10], [a46[0] + 18, lar[1] + 26], [hz(BARS[2].bot)[0], hz(BARS[2].bot)[1] + 30], tongue];
  const xPts: Pt[] = [[(occ[0][0] + occ[1][0]) / 2 + 6, occ[1][1] + 22], [a46[0] + 14, a46[1] - 40], [a46[0] + 8, a46[1] + 6], [lar[0] + 6, lar[1] - 6]];
  const xiiPts: Pt[] = [[(occ[2][0] + occ[3][0]) / 2 + 6, occ[3][1] + 24], [a46[0] + 46, a46[1] - 4], [a46[0] + 30, lar[1] + 38], [hz(BARS[2].bot)[0] + 6, hz(BARS[2].bot)[1] + 42], [tongue[0] + 10, tongue[1] + 6]];
  const heart = hz([g32.heart[0] - 20, g32.heart[1] - 30]);
  const skin = hz([g32.cran[0], g32.cran[1] - 50]);
  const brain = hz(spineAt(S, 0.27, 4).p);
  const plugAt: [string, string, Pt, string][] = [
    ['nerbio-begi-eragilea', 'III', [eye[0] - 42, eye[1] - 30], SM_COLOR[0]],
    ['nerbio-troklearra', 'IV', [eye[0] - 4, eye[1] - 58], SM_COLOR[2]],
    ['nerbio-aldentzailea', 'VI', [eye[0] + 34, eye[1] - 36], SM_COLOR[4]],
    ['nerbio-trigeminoa', 'V', hz(archMid(0)), SM_COLOR[3]],
    ['aurpegi-nerbioa', 'VII', hz(archMid(1)), SM_COLOR[5]],
    ['nerbio-glosofaringeoa', 'IX', hz(archMid(2)), SM_COLOR[6]],
  ];
  return (
    <g>
      <Defs9 />
      <g transform={HZ.transform}>
        <HeadInside archLit={[1, 1, 1, toLar]} eyeMus={1} occ0={1 - 0.8 * gone} />
      </g>
      {/* What the occipital somites make: the larynx muscles at the end of arches 4/6, the tongue in the floor of the pharynx. */}
      <Part id="laringearen-muskuluak" show={seg(t, 0.13, 0.155)} groups={['laugarren-seigarren-arkuak']}>
        <ellipse cx={lar[0]} cy={lar[1]} rx={15} ry={11} fill={HUE.os12} stroke="#312e81" strokeWidth={1.4} opacity={0.92} />
        <path d={`M${f1(lar[0] - 9)},${f1(lar[1] - 3)} h18 M${f1(lar[0] - 9)},${f1(lar[1] + 3)} h18`} stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} />
      </Part>
      <Part id="mihiaren-muskuluak" show={seg(t, 0.22, 0.25)}>
        <ellipse cx={tongue[0]} cy={tongue[1]} rx={34} ry={17} transform={`rotate(-14 ${f1(tongue[0])} ${f1(tongue[1])})`} fill={HUE.os25} stroke="#581c87" strokeWidth={1.4} opacity={0.9} />
        <ellipse cx={tongue[0]} cy={tongue[1]} rx={34} ry={17} transform={`rotate(-14 ${f1(tongue[0])} ${f1(tongue[1])})`} fill="url(#w9-fibres)" opacity={0.7} />
      </Part>
      <RouteStream route={larRoute} prog={toLar} color={HUE.os12} />
      <RouteStream route={tongueRoute} prog={toTongue} color={HUE.os25} n={8} />

      {/* X: motor fibres to the larynx muscles; XII: motor fibres only, following the cells into the tongue. */}
      <Part id="nerbio-bagoa" show={nX} groups={['nerbio-kranialak']}>
        <Nerve pts={xPts} plug={xPts[1]} color={HUE.os12} num="X" show={1} />
      </Part>
      <Part id="nerbio-hipoglosoa" show={nXII} groups={['nerbio-kranialak']}>
        <Nerve pts={xiiPts} plug={xiiPts[1]} color={HUE.os25} num="XII" show={1} />
      </Part>
      {/* Every head muscle has its cranial nerve: tags on the eye muscles and on arches 1–3. */}
      {plugAt.map(([id, num, p, c]) => (
        <g key={id}>
          <Part id={id} show={plugs} groups={['nerbio-kranialak']}>
            <circle cx={f1(p[0])} cy={f1(p[1])} r={19} fill={c} stroke="#1a1405" strokeWidth={2} />
          </Part>
          <Label id={id} x={p[0]} y={p[1]} align="middle" text={num} show={plugs} />
        </g>
      ))}

      {occ.map((p, i) => (
        <text key={i} x={p[0]} y={p[1] + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fff" stroke="#10121c" strokeWidth={3} paintOrder="stroke" opacity={i === 0 ? 1 - 0.6 * gone : 1}>
          {i + 1}
        </text>
      ))}
      <Note x={400} y={30} size={12.5} tone="accent" show={vis(t, 0.11, 2)}>
        Somita okzipitalak 1–2 → 4./6. arkuak → laringea (X)
      </Note>
      <Note x={400} y={52} size={12.5} tone="accent" show={vis(t, 0.21, 2)}>
        Somita okzipitalak 2–5 → mihia (XII, motorea soilik)
      </Note>
      <Steps
        t={t}
        steps={[
          [0, '5 bikote somita okzipital: lehenengoa oso goiz desagertzen da → 4 bikote'],
          [0.1, '1.–2. somitak → 4. eta 6. arkuak → laringearen muskulu ildaskatuak · X. bagoa'],
          [0.2, '2.–5. somitak → mihiaren muskulu guztiak · XII. hipoglosoa (zuntz motoreak soilik)'],
          [0.3, 'Buruko muskulu ildaskatu guztiak: nerbio kranialek inerbatzen dituzte'],
        ]}
      />

      <Label id="azaleko-ektodermoa" x={190} y={110} ax={skin[0]} ay={skin[1]} small />
      <Label id="somitomeroak" x={190} y={250} ax={hz([506, 186])[0] - 18} ay={hz([506, 186])[1]} small />
      <Label id="begia" x={190} y={410} ax={eye[0] - 22} ay={eye[1]} small />
      <Label id="mihiaren-muskuluak" x={810} y={516} ax={tongue[0] + 26} ay={tongue[1] + 10} show={seg(t, 0.22, 0.25)} />
      <Label id="estomodeoa" x={190} y={540} ax={hz(MOUTH)[0]} ay={hz(MOUTH)[1]} small />
      <Label id="bihotz-goragunea" x={190} y={600} ax={heart[0]} ay={heart[1]} small />
      <Label id="somita-okzipitalak" x={700} y={30} ax={occ[2][0]} ay={occ[2][1] - 12} align="middle" />
      <Label id="somitak" x={990} y={250} ax={hz(somite(5).c)[0]} ay={hz(somite(5).c)[1]} align="end" small />
      <Label id="hodi-neurala" x={990} y={286} ax={brain[0]} ay={brain[1]} align="end" small />
      <Label id="laugarren-seigarren-arkuak" x={810} y={356} ax={a46[0] + 6} ay={a46[1] + 10} />
      <Label id="laringearen-muskuluak" x={810} y={396} ax={lar[0] + 12} ay={lar[1] + 4} show={seg(t, 0.13, 0.155)} />
      <Label id="nerbio-bagoa" x={810} y={436} ax={xPts[1][0] + 10} ay={xPts[1][1]} show={nX} small />
      <Label id="nerbio-hipoglosoa" x={810} y={476} ax={xiiPts[1][0] + 10} ay={xiiPts[1][1]} show={nXII} small />
      <Label id="faringe-arkuak" x={190} y={286} ax={hz(archMid(0))[0] - 10} ay={hz(archMid(0))[1]} small />
      <Label id="nerbio-kranialak" x={810} y={566} ax={hz(archMid(2))[0] + 12} ay={hz(archMid(2))[1] + 6} show={plugs} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* garuna: nucleus columns → fibres → holes in the skull base → muscles */
/* ------------------------------------------------------------------ */

type Fib = 'm' | 's' | 'v';
/** Fibre types, one colour each (also the colours of the three nucleus columns). */
export const FIB: Record<Fib, string> = { m: '#fb7185', s: '#7dd3fc', v: '#86efac' };
const COL_X: Record<Fib, number> = { s: 192, v: 232, m: 272 };
const COL_ID: Record<Fib, string> = { m: 'nukleo-motoreak', s: 'nukleo-sentsorialak', v: 'nukleo-begetatiboak' };
const OFF: Record<Fib, number> = { s: -5, v: 0, m: 5 };

type Row = { num: string; nerve: string; name: string; y: number; color: string; fib: Fib[]; target: string; text: string; from: string };
const ROWS: Row[] = [
  { num: 'III', nerve: 'nerbio-begi-eragilea', name: 'Begi eragilea', y: 176, color: SM_COLOR[0], fib: ['m', 'v'], target: 'begiaren-kanpoko-muskuluak', text: 'Begiaren zuzenak + beheko laprana', from: '1–2' },
  { num: 'IV', nerve: 'nerbio-troklearra', name: 'Troklearra', y: 216, color: SM_COLOR[2], fib: ['m'], target: 'begi-goiko-laprana', text: 'Begiaren goiko muskulu laprana', from: '3' },
  { num: 'V', nerve: 'nerbio-trigeminoa', name: 'Trigeminoa', y: 256, color: SM_COLOR[3], fib: ['m', 's'], target: 'muskulu-murtsikatzaileak', text: 'Murtsikatzaileak (1. arkua)', from: '4' },
  { num: 'VI', nerve: 'nerbio-aldentzailea', name: 'Aldentzailea', y: 296, color: SM_COLOR[4], fib: ['m'], target: 'begi-alboko-zuzena', text: 'Begiaren alboko muskulu zuzena', from: '5' },
  { num: 'VII', nerve: 'aurpegi-nerbioa', name: 'Aurpegi nerbioa', y: 336, color: SM_COLOR[5], fib: ['m', 's', 'v'], target: 'muskulu-mimikoak', text: 'Mimikoak + barailaren jeistaileak (2. ark.)', from: '6' },
  { num: 'IX', nerve: 'nerbio-glosofaringeoa', name: 'Glosofaringeoa', y: 376, color: SM_COLOR[6], fib: ['m', 's', 'v'], target: 'muskulu-estilofaringeoa', text: 'Estilofaringeoa (3. arkua)', from: '7' },
  { num: 'X', nerve: 'nerbio-bagoa', name: 'Bagoa', y: 416, color: HUE.os12, fib: ['m', 's', 'v'], target: 'laringearen-muskuluak', text: 'Laringearen muskuluak (4./6. arkuak)', from: 'O1–2' },
  { num: 'XII', nerve: 'nerbio-hipoglosoa', name: 'Hipoglosoa', y: 456, color: HUE.os25, fib: ['m'], target: 'mihiaren-muskuluak', text: 'Mihiaren muskulu guztiak', from: 'O2–5' },
];
const SENS = [
  { num: 'I', nerve: 'usaimen-nerbioa', name: 'Usaimena', y: 92 },
  { num: 'II', nerve: 'nerbio-optikoa', name: 'Ikusmen nerbioa', y: 132 },
];
const WALL = { x0: 380, x1: 412 };
const PLUG_X = 450;
const CHIP_X = 604;
const SPINE_Y = 532;
/** The brainstem (with the forebrain stub at the top) continuing as the spinal cord. */
const STEM: Pt[] = [
  [168, 64], [292, 64], [312, 110], [306, 160], [318, 230], [322, 300], [306, 360], [300, 430], [292, 488], [270, 510], [266, 590],
  [206, 590], [202, 510], [180, 488], [172, 430], [166, 360], [150, 300], [154, 230], [166, 160], [160, 110],
];

/** A nerve as a cable of fibre strands (one colour per type) from the brainstem to its plug and on to its target. */
function Cable({ y, fib, x0, x1, show, k = 1 }: { y: number; fib: Fib[]; x0: number; x1: number; show: number; k?: number }) {
  if (show <= 0.01) return null;
  const xe = x0 + (x1 - x0) * clamp(k);
  return (
    <g opacity={show}>
      <path d={`M${x0},${y} H${f1(xe)}`} stroke="#1a1405" strokeWidth={12} strokeLinecap="round" />
      <path d={`M${x0},${y} H${f1(xe)}`} stroke={HUE.nerve} strokeWidth={8.5} strokeLinecap="round" opacity={0.85} />
      {fib.map((f, i) => (
        <path key={f} d={`M${x0},${y + (i - (fib.length - 1) / 2) * 2.6} H${f1(xe)}`} stroke={FIB[f]} strokeWidth={1.6} strokeLinecap="round" />
      ))}
    </g>
  );
}

export function CranialWiring({ t }: SceneProps) {
  const motor = (k: number) => seg(t, 0.38 + k * 0.008, 0.41 + k * 0.008);
  const sens = seg(t, 0.46, 0.5);
  const kinds = seg(t, 0.54, 0.58);
  const holes = vis(t, 0.54, 0.62);
  const spinal = seg(t, 0.62, 0.66);
  const twelve = seg(t, 0.68, 0.72);
  const mixed = seg(t, 0.92, 0.95);
  // In the mixed-fibre step, V and XII stay bright and the rest step back.
  const rowDim = (r: Row) => 1 - mixed * (r.num === 'V' || r.num === 'XII' ? 0 : 0.6);
  const shows = (f: Fib) => (f === 'm' ? 1 : kinds);
  return (
    <g>
      <Defs9 />
      <defs>
        <linearGradient id="w9w-stem" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a3f8f" />
          <stop offset="0.5" stopColor="#3a5fd9" />
          <stop offset="1" stopColor="#2a3f8f" />
        </linearGradient>
        <pattern id="w9w-bone" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill="rgba(120,100,60,0.35)" />
          <circle cx="9" cy="8" r="0.9" fill="rgba(120,100,60,0.3)" />
        </pattern>
      </defs>

      {/* Brainstem and spinal cord (neural tube blue, as in every topic). */}
      <Part id="entzefalo-enborra">
        <path d={smoothPath(STEM, true, 0.3)} fill="url(#w9w-stem)" stroke="#9db0f0" strokeWidth={1.6} />
      </Part>
      <Part id="ornomuina" quiet>
        <path d="M206,512 L266,512 L266,590 L206,590Z" fill="rgba(255,255,255,0.06)" />
      </Part>
      {/* Three nucleus columns: sensory, vegetative, motor; each blob is one nerve's nucleus. */}
      {(['s', 'v', 'm'] as Fib[]).map((f) => (
        <Part key={f} id={COL_ID[f]} show={shows(f)}>
          <rect x={COL_X[f] - 9} y={160} width={18} height={316} rx={9} fill={FIB[f]} opacity={0.18} />
          {ROWS.filter((r) => r.fib.includes(f)).map((r) => (
            <ellipse key={r.num} cx={COL_X[f]} cy={r.y + OFF[f]} rx={9} ry={7} fill={FIB[f]} stroke="rgba(10,10,30,0.6)" strokeWidth={1} opacity={motor(ROWS.indexOf(r)) * rowDim(r)} />
          ))}
        </Part>
      ))}

      {/* Skull base (topic 8's bone) with its holes: fibres leave (motor) or enter (sensory) through them. */}
      <Part id="neurokraneoa" quiet>
        <rect x={WALL.x0} y={56} width={WALL.x1 - WALL.x0} height={432} rx={8} fill={W.bone} stroke={W.boneDeep} strokeWidth={1.6} />
        <rect x={WALL.x0} y={56} width={WALL.x1 - WALL.x0} height={432} rx={8} fill="url(#w9w-bone)" />
      </Part>
      <Part id="burezurreko-zuloak" groups={['neurokraneoa']}>
        {[...SENS, ...ROWS].map((r) => (
          <g key={r.num}>
            <ellipse cx={(WALL.x0 + WALL.x1) / 2} cy={r.y} rx={10} ry={9} fill="#0f0b0e" stroke="#7a6a4a" strokeWidth={1.2} />
            <ellipse cx={(WALL.x0 + WALL.x1) / 2} cy={r.y} rx={15} ry={13} fill="none" stroke="#fde68a" strokeWidth={2} opacity={holes * 0.9} />
          </g>
        ))}
      </Part>
      {/* A vertebra: spinal nerves leave between vertebrae, not through the skull. */}
      <rect x={WALL.x0 - 4} y={SPINE_Y + 14} width={WALL.x1 - WALL.x0 + 8} height={40} rx={8} fill={W.bone} stroke={W.boneDeep} strokeWidth={1.4} opacity={0.4 + 0.6 * spinal} />
      <rect x={WALL.x0 - 4} y={SPINE_Y - 54} width={WALL.x1 - WALL.x0 + 8} height={40} rx={8} fill={W.bone} stroke={W.boneDeep} strokeWidth={1.4} opacity={0.4 + 0.6 * spinal} />

      {/* Motor nerves: fibres from the nuclei out through the holes; tag = colour of the muscles' origin. */}
      {ROWS.map((r, k) => {
        const s = motor(k);
        const dim = rowDim(r);
        return (
          <g key={r.num} opacity={dim}>
            {r.fib.map((f) => (
              <path key={f} d={`M${COL_X[f]},${r.y + OFF[f]} H312`} stroke={FIB[f]} strokeWidth={2} opacity={s * shows(f)} />
            ))}
            <Part id={r.nerve} show={s} groups={['nerbio-kranialak']}>
              <Cable y={r.y} fib={r.fib.filter((f) => shows(f) > 0.5)} x0={312} x1={CHIP_X} show={1} k={s} />
              <Nerve pts={[[PLUG_X, r.y], [PLUG_X, r.y]]} plug={[PLUG_X, r.y]} color={r.color} num={r.num} show={s > 0.6 ? 1 : 0} />
            </Part>
            <Part id={r.target} show={s}>
              <rect x={CHIP_X} y={r.y - 15} width={384} height={30} rx={9} fill={r.color} fillOpacity={0.24} stroke={r.color} strokeWidth={1.3} />
              <rect x={CHIP_X} y={r.y - 15} width={44} height={30} rx={9} fill={r.color} />
            </Part>
            <text x={CHIP_X + 22} y={r.y + 4.5} textAnchor="middle" fontSize={12} fontWeight={800} fill="#10121c" opacity={s}>
              {r.from}
            </text>
            <Label id={r.nerve} x={PLUG_X + 22} y={r.y} align="start" text={r.name} show={s} small />
            <Label id={r.target} x={CHIP_X + 54} y={r.y} align="start" text={r.text} show={s} small />
          </g>
        );
      })}
      {/* V mixed, XII motor only: their own strands say it (V: motor + sensory, XII: one motor), the caption names it. */}

      {/* Sensory nerves I and II: the fibres come in, from the nose and from the retina. */}
      {SENS.map((r, i) => (
        <g key={r.num}>
          <Part id={r.nerve} show={0.25 + 0.75 * sens} groups={['nerbio-kranialak']}>
            <path d={`M${CHIP_X},${r.y} H300`} stroke="#1a1405" strokeWidth={10} strokeLinecap="round" />
            <path d={`M${CHIP_X},${r.y} H300`} stroke="#cbd5e1" strokeWidth={6.5} strokeLinecap="round" />
            <path d={`M${CHIP_X},${r.y} H300`} stroke={FIB.s} strokeWidth={1.6} />
            {[0.2, 0.5, 0.8].map((u) => {
              const x = CHIP_X - (CHIP_X - 300) * ((u + sens * 0.6) % 1);
              return <path key={u} d={`M${f1(x + 9)},${r.y - 7} L${f1(x)},${r.y} L${f1(x + 9)},${r.y + 7}`} fill="none" stroke="#e2e8f0" strokeWidth={2.4} opacity={sens} />;
            })}
            <circle cx={PLUG_X} cy={r.y} r={11} fill="#cbd5e1" stroke="#1a1405" strokeWidth={2} />
            <text x={PLUG_X} y={r.y + 4} textAnchor="middle" fontSize={10.5} fontWeight={800} fill="#10121c">
              {r.num}
            </text>
          </Part>
          <Label id={r.nerve} x={PLUG_X + 22} y={r.y} align="start" text={r.name} show={0.4 + 0.6 * sens} small />
          {i === 1 ? (
            <Label id="begia" x={CHIP_X + 54} y={r.y} align="start" text="Erretina (begia) → ikusmena" show={0.4 + 0.6 * sens} small />
          ) : (
            <Note x={CHIP_X + 54} y={r.y} size={12} align="start" show={0.4 + 0.6 * sens}>
              Sudurra → usaimena
            </Note>
          )}
        </g>
      ))}

      {/* The spinal nerve, for contrast: back muscles through its posterior ramus, body wall and limbs through its anterior ramus. */}
      <g opacity={0.25 + 0.75 * spinal}>
        <Part id="nerbio-espinalak" show={spinal}>
          <Cable y={SPINE_Y} fib={['m', 's', 'v']} x0={266} x1={PLUG_X} show={1} />
        </Part>
        <Part id="atzeko-adar-primarioa" show={spinal}>
          <path d={`M${PLUG_X},${SPINE_Y} Q${PLUG_X + 60},${SPINE_Y - 22} ${CHIP_X},${SPINE_Y - 22}`} fill="none" stroke={HUE.dorsalRamus} strokeWidth={5} strokeLinecap="round" />
          <rect x={CHIP_X} y={SPINE_Y - 36} width={384} height={28} rx={9} fill={HUE.dorsalRamus} fillOpacity={0.22} stroke={HUE.dorsalRamus} strokeWidth={1.2} />
        </Part>
        <Part id="aurreko-adar-primarioa" show={spinal}>
          <path d={`M${PLUG_X},${SPINE_Y} Q${PLUG_X + 60},${SPINE_Y + 22} ${CHIP_X},${SPINE_Y + 22}`} fill="none" stroke={HUE.ventralRamus} strokeWidth={5} strokeLinecap="round" />
          <rect x={CHIP_X} y={SPINE_Y + 8} width={384} height={28} rx={9} fill={HUE.ventralRamus} fillOpacity={0.22} stroke={HUE.ventralRamus} strokeWidth={1.2} />
        </Part>
      </g>
      <Label id="atzeko-adar-primarioa" x={CHIP_X + 12} y={SPINE_Y - 22} align="start" text="Atzeko adarra → bizkarreko muskuluak" show={spinal} small />
      <Label id="aurreko-adar-primarioa" x={CHIP_X + 12} y={SPINE_Y + 22} align="start" text="Aurreko adarra → paretak, gorputz-adarrak" show={spinal} small />
      <Label id="nerbio-espinalak" x={PLUG_X - 6} y={SPINE_Y + 46} align="middle" text="Nerbio espinala" show={0.4 + 0.6 * spinal} small />

      {/* All twelve pairs: coloured = motor to this topic's muscles; pale = sensory only (I, II, VIII); XI is not in the notes. */}
      <g opacity={twelve}>
        <Note x={262} y={600} size={12} tone="accent" align="end">
          12 bikote:
        </Note>
        {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((n, i) => {
          const r = ROWS.find((q) => q.num === n);
          const x = 290 + i * 33;
          return (
            <g key={n}>
              <rect x={x - 16} y={590} width={32} height={20} rx={6} fill={r ? r.color : n === 'XI' ? 'none' : '#cbd5e1'} stroke={r ? 'none' : '#94a3b8'} strokeWidth={1.2} opacity={r ? 1 : 0.7} />
              <text x={x} y={604} textAnchor="middle" fontSize={11} fontWeight={800} fill={r || n !== 'XI' ? '#10121c' : '#94a3b8'}>
                {n}
              </text>
            </g>
          );
        })}
        <Note x={690} y={600} size={11.5} tone="accent" align="start">
          Arkua ↔ nerbioa: 1.→V · 2.→VII · 3.→IX · 4/6→X
        </Note>
      </g>

      {/* The two sides' headings, on their own line above the names. */}
      <Note x={235} y={18} size={12} tone="dim">
        Burezurraren barruan
      </Note>
      <Note x={790} y={18} size={12} tone="dim">
        Kanpoan: muskuluak (kolorea = jatorria)
      </Note>
      <Label id="nerbio-kranialak" x={560} y={58} ax={PLUG_X + 8} ay={82} align="middle" small />
      {/* The skull base the fibres cross: named on its wall, between two holes. */}
      <Label id="neurokraneoa" x={(WALL.x0 + WALL.x1) / 2} y={512} ax={(WALL.x0 + WALL.x1) / 2} ay={478} align="middle" small />
      <Steps
        t={t}
        steps={[
          [0.38, 'Entzefalo enborreko nerbioak = nerbio kranialak: zuntz motoreak somitomeroen eta somiten muskuluetara'],
          [0.46, 'Zuntz sentsorialak ere bai: usaimena (I) eta ikusmen nerbioa (II, erretinatik) — barrura doaz'],
          [0.54, 'Nukleo motoreak, sentsorialak, begetatiboak · zuntzak burezurraren oinaldeko zuloetatik'],
          [0.62, 'Bizkarreko, paretetako eta gorputz-adarretako muskuluak: nerbio espinalen aurreko eta atzeko adarrak'],
          [0.68, '12 bikote kraneal; guztiek ez dute zuntz motorerik · arku bakoitzak bere nerbioa'],
          [0.92, 'Taulak ez du esan nahi zuntz bakarra: trigeminoa (3 adar) mistoa da; hipoglosoa motorea soilik'],
        ]}
        y={624}
      />

      <Label id="entzefalo-enborra" x={14} y={110} ax={166} ay={110} align="start" small />
      <Label id="nukleo-sentsorialak" x={14} y={232} ax={COL_X.s - 9} ay={232} align="start" show={kinds} small />
      <Label id="nukleo-begetatiboak" x={14} y={346} ax={COL_X.v - 9} ay={346} align="start" show={kinds} small />
      <Label id="nukleo-motoreak" x={14} y={438} ax={COL_X.m - 9} ay={438} align="start" small />
      <Label id="ornomuina" x={14} y={560} ax={206} ay={560} align="start" small />
      <Label id="burezurreko-zuloak" x={330} y={40} ax={392} ay={82} align="middle" show={holes > 0.01 ? 1 : 0.6} small />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* taula: the notes' table, built row by row                            */
/* ------------------------------------------------------------------ */

const TROWS: [string, string, string, string, string, number][] = [
  ['1.–2. somitomeroak · begia', 'begiaren-kanpoko-muskuluak', 'Begiaren goiko, beheko, erdiko zuzenak + beheko laprana', 'nerbio-begi-eragilea', 'III · begi eragilea', 0.74],
  ['3. somitomeroa · begia', 'begi-goiko-laprana', 'Begiaren goiko muskulu laprana', 'nerbio-troklearra', 'IV · troklearra (patetikoa)', 0.745],
  ['4. somitomeroa · 1. arkua', 'muskulu-murtsikatzaileak', 'Barailaren jasotzaileak (murtsikatzaileak)', 'nerbio-trigeminoa', 'V · trigeminoa (3 adar)', 0.75],
  ['5. somitomeroa · begia', 'begi-alboko-zuzena', 'Begiaren alboko muskulu zuzena', 'nerbio-aldentzailea', 'VI · aldentzailea', 0.755],
  ['6. somitomeroa · 2. arkua', 'muskulu-mimikoak', 'Barailaren jeistaileak + muskulu mimikoak', 'aurpegi-nerbioa', 'VII · aurpegi nerbioa', 0.84],
  ['7. somitomeroa · 3. arkua', 'muskulu-estilofaringeoa', 'Estilofaringeoa (faringearen muskulu bat)', 'nerbio-glosofaringeoa', 'IX · glosofaringeoa', 0.845],
  ['Somita okz. 1–2 · 4./6. arkuak', 'laringearen-muskuluak', 'Laringearen muskulu ildaskatuak', 'nerbio-bagoa', 'X · bagoa (vagus)', 0.85],
  ['Somita okzipitalak 2–5', 'mihiaren-muskuluak', 'Mihiaren muskulu ildaskatu guztiak', 'nerbio-hipoglosoa', 'XII · hipoglosoa', 0.855],
];
const TCOLOR = [SM_COLOR[0], SM_COLOR[2], SM_COLOR[3], SM_COLOR[4], SM_COLOR[5], SM_COLOR[6], HUE.os12, HUE.os25];

export function HeadTable({ t }: SceneProps) {
  const rows: TableRow[] = TROWS.map(([o, mid, mtext, nid, ntext, at], i) => ({
    at,
    cells: [{ id: i < 6 ? 'somitomeroak' : i === 6 ? 'laugarren-seigarren-arkuak' : 'somita-okzipitalak', text: o, color: TCOLOR[i] }, { id: mid, text: mtext, color: TCOLOR[i] }, { id: nid, text: ntext, color: TCOLOR[i] }],
  }));
  return (
    <g>
      <Defs9 />
      <Note x={500} y={40} size={13} tone="accent">
        Buruko muskuluen jatorria eta inerbazioa (kolorea = jatorria)
      </Note>
      <SummaryTable t={t} x={30} y={66} widths={[290, 380, 270]} rowH={42} head={['Jatorri mesodermikoa', 'Muskulu ildaskatuak', 'Inerbazioa (bikote kraniala)']} rows={rows} />
      <Note x={500} y={520} size={12.5} tone="dim" show={seg(t, 0.74, 0.78)}>
        Ez da beharrezkoa muskulu guztien izenak ikastea: jatorria → arkua → nerbioa da gakoa
      </Note>
      <Note x={500} y={556} size={12.5} tone="accent" show={seg(t, 0.92, 0.95)}>
        Taulak ez du esan nahi bakoitzak zuntz bakarra duenik: batzuk mistoak (V), beste batzuk motoreak soilik (XII)
      </Note>
      <Steps
        t={t}
        steps={[
          [0.74, 'Taula (1): somitomeroak 1–5 → begiaren muskuluak eta 1. arkua · III, IV, V, VI'],
          [0.84, 'Taula (2): 6, 7 eta somita okzipitalak → 2., 3. eta 4./6. arkuak, mihia · VII, IX, X, XII'],
        ]}
      />
    </g>
  );
}
