'use client';

import { C, Flow, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { fetusGeom, FetusFigure, placeFetus } from '@/components/scenes/week5/FetusFigure';
import { useId } from 'react';
import { CordRope } from './CordRope';

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

/* ---------------------------------------------------------------------------------------------- */
/* AmnioticFluid — stage `likido-amniotikoa`, view `bolumena`                                       */
/* ---------------------------------------------------------------------------------------------- */

const UTERUS: Pt[] = [
  [500, 66], [660, 90], [772, 190], [812, 340], [770, 480], [660, 566], [500, 592],
  [340, 566], [230, 480], [188, 340], [228, 190], [340, 90],
];

const PLACENTA_C: Pt = [652, 138];

/**
 * Amniotic-fluid volume (ml): 10 w. 30 ml → 30 w. 200–500 ml → 37–38 w. 800–1000 ml. The gauge
 * holds at 10 weeks until the volume step (.3), sweeps through the three reference points during it,
 * and stays at term afterwards.
 */
const VOL_MARKS = [
  { lo: 30, hi: 30, text: '10. a: 30 ml', at: 0.3 },
  { lo: 200, hi: 500, text: '30. a: 200–500 ml', at: 0.33 },
  { lo: 800, hi: 1000, text: '37.–38. a: 800–1000 ml', at: 0.39 },
];
function volumeAt(t: number) {
  const a = seg(t, 0.3, 0.35);
  const b = seg(t, 0.355, 0.405);
  const ml = t < 0.355 ? lerp(30, 350, a) : lerp(350, 900, b);
  const wk = t < 0.355 ? lerp(10, 30, a) : lerp(30, 37.5, b);
  return { ml: Math.round(ml), week: b > 0.98 ? '37.–38. asteak' : `${Math.round(wk)}. astea` };
}

export function AmnioticFluid({ t, reduced }: SceneProps) {
  const { ml, week } = volumeAt(t);
  const fill = (ml - 30) / 870; // amnios barrunbea filling out with the volume
  const cavRx = lerp(232, 258, fill);
  const cavRy = lerp(196, 220, fill);
  const cavC: Pt = [500, 330];

  const pose = {
    kick: 0.5 + 0.5 * Math.sin(t * 42),
    suck: 0.5 + 0.5 * Math.sin(t * 23 + 1),
    breathe: Math.sin(t * 31),
    nod: 6 * Math.sin(t * 17),
  };
  const week5 = 24;
  const place = placeFetus(19, 9, 560, 372);
  const g = fetusGeom(week5, pose);
  const mouth = place.xf(g.mouth);
  const cordBase = place.xf(g.cordBase);
  const hip = place.xf(g.hip);

  const sourcesA = seg(t, 0.14, 0.2) * (1 - seg(t, 0.3, 0.34));
  const functionsA = vis(t, 0.46, 0.58);
  const swallowA = vis(t, 0.58, 1);

  const gaugeH = 100;
  const gaugeFill = Math.min(1, ml / 1000) * gaugeH;

  // The cord leaves the belly, loops round in front of the knees and rises to the placenta's fetal
  // surface, which lies on the cavity wall right under the placenta.
  const ins = Math.atan2((PLACENTA_C[1] - cavC[1]) / cavRy, (PLACENTA_C[0] - cavC[0]) / cavRx);
  const insertion: Pt = [cavC[0] + (cavRx + 10) * Math.cos(ins), cavC[1] + (cavRy + 10) * Math.sin(ins)];
  const wallTan = (Math.atan2(cavRy * Math.cos(ins), -cavRx * Math.sin(ins)) * 180) / Math.PI;
  const plC: Pt = [cavC[0] + (cavRx + 6) * Math.cos(ins), cavC[1] + (cavRy + 6) * Math.sin(ins)];
  const cordPts: Pt[] = [cordBase, [cordBase[0] + 34, cordBase[1] + 22], [cordBase[0] + 92, cordBase[1] - 6], [cordBase[0] + 104, cordBase[1] - 96], [insertion[0] + 22, insertion[1] + 110], [insertion[0] + 2, insertion[1] + 36], insertion];
  const cordD = smoothPath(cordPts, false, 0.5);
  const cordMid = cordPts[3];
  const clipId = `${useId().replace(/:/g, '')}-wall`;

  return (
    <g>
      {/* Uterine wall */}
      <path d={smoothPath(UTERUS, true, 0.55)} fill="#7a2c34" stroke="#4a1a20" strokeWidth={2} opacity={0.92} />
      <path d={smoothPath(UTERUS, true, 0.55)} fill="none" stroke="#c88a90" strokeWidth={1} opacity={0.35} />


      {/* Amnios barrunbea: the fluid-filled cavity, its size a proxy for the growing volume */}
      <Part id="amnios-barrunbea">
        <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx} ry={cavRy} fill="#8ecae6" opacity={0.22} />
        <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx} ry={cavRy} fill={C.amnionCavity} />
      </Part>
      <Part id="likido-amniotikoa">
        <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx} ry={cavRy} fill="none" stroke="#8ecae6" strokeWidth={1.6} opacity={0.7} />
      </Part>
      <Part id="amniosa">
        <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx + 5} ry={cavRy + 5} fill="none" stroke="#bfe0f2" strokeWidth={1.4} strokeDasharray="2 5" opacity={0.6} />
      </Part>

      <Part id="fetu-aroa" quiet>
        <g transform={place.transform}>
          <FetusFigure
            id="w6af"
            week={week5}
            pose={pose}
            s={place.s}
            vernix={0.4}
            cord={
              <Part id="zilborrestea">
                <CordRope pts={cordPts.map(place.inv)} w={11 / place.s} turns={9} />
              </Part>
            }
          />
        </g>
      </Part>

      {/* Placenta: a lens in the uterine wall whose fetal surface is the cavity wall itself (drawn over the cord's insertion) */}
      <clipPath id={clipId}>
        <path d={`M0,0H1000V640H0Z M${cavC[0] - cavRx},${cavC[1]} a${cavRx},${cavRy} 0 1,0 ${cavRx * 2},0 a${cavRx},${cavRy} 0 1,0 ${-cavRx * 2},0Z`} clipRule="evenodd" />
      </clipPath>
      <clipPath id={`${clipId}-u`}>
        <path d={smoothPath(UTERUS, true, 0.55)} />
      </clipPath>
      <Part id="karena" quiet>
        <g clipPath={`url(#${clipId})`}>
          <g clipPath={`url(#${clipId}-u)`}>
            <ellipse cx={plC[0]} cy={plC[1]} rx={104} ry={44} transform={`rotate(${wallTan} ${plC[0]} ${plC[1]})`} fill="#c2415f" stroke="#7c1f36" strokeWidth={2} />
          </g>
        </g>
      </Part>

      {/* Sources: amnios wall, fetal urine, decidua, villous blood via the chorionic plate, lungs/gut */}
      {!reduced && sourcesA > 0.02 && (
        <g opacity={sourcesA}>
          {[
            [[cavC[0] - cavRx + 10, cavC[1] - 20], [cavC[0] - cavRx + 60, cavC[1] - 4]],
            [[hip[0] + 4, hip[1] + 18], [hip[0] - 10, hip[1] + 44]],
            [[220, 460], [280, 420]],
            [[PLACENTA_C[0] + 40, PLACENTA_C[1] + 30], [420, 220]],
            [[mouth[0] - 4, mouth[1] + 30], [mouth[0] - 14, mouth[1] + 8]],
          ].map(([from, to], i) => (
            <g key={i} stroke="#bfe0f2" strokeWidth={1.6} fill="none" markerEnd="none">
              <path d={`M${from[0]},${from[1]} L${to[0]},${to[1]}`} strokeDasharray="5 4" />
              <circle cx={to[0]} cy={to[1]} r={3} fill="#bfe0f2" />
            </g>
          ))}
        </g>
      )}

      {/* Swallowing cycle: mouth → gut → blood → placenta/kidneys → back to the cavity */}
      {!reduced && swallowA > 0.02 && (
        <g opacity={swallowA}>
          <Flow d={`M${mouth[0]},${mouth[1]} Q${cordBase[0] - 20},${cordBase[1] + 10} ${cordBase[0]},${cordBase[1]}`} n={3} dur={3.2} r={2.2} color="#8ecae6" />
          <Flow d={cordD} n={3} dur={3.6} r={2.2} color="#8ecae6" />
          <Flow d={`M${PLACENTA_C[0] - 20},${PLACENTA_C[1] + 20} Q${cavC[0] - 100},${cavC[1] - 120} ${mouth[0] - 40},${mouth[1] - 60}`} n={2} dur={5} r={2} color="#5fa8cc" />
        </g>
      )}
      <Part id="degluzioa" show={swallowA} quiet>
        <circle cx={mouth[0]} cy={mouth[1]} r={0.1} />
      </Part>

      {/* Volume gauge, bottom-left, clear of the toolbar/pill zones */}
      <g>
        <rect x={44} y={480 - gaugeH} width={26} height={gaugeH} fill="none" stroke="#8ecae6" strokeWidth={1.4} opacity={0.7} />
        <rect x={44} y={480 - gaugeFill} width={26} height={gaugeFill} fill="#8ecae6" opacity={0.8} />
        <text x={57} y={498} textAnchor="middle" fontSize={12} fill="#cfe6f5">
          {ml} ml
        </text>
        <text x={57} y={514} textAnchor="middle" fontSize={10} fill="#8fa3c4">
          {week}
        </text>
        {/* Reference volumes from the notes, ticked off as the gauge passes them */}
        {VOL_MARKS.map((m) => {
          const o = vis(t, m.at);
          const y0 = 480 - (m.hi / 1000) * gaugeH;
          const y1 = 480 - (m.lo / 1000) * gaugeH;
          return (
            <g key={m.text} opacity={o}>
              <path d={`M72,${y0} h6 V${Math.max(y1, y0 + 1)} h-6`} fill="none" stroke="#fbbf24" strokeWidth={1.2} />
              <text x={82} y={(y0 + y1) / 2 + 3.5} fontSize={10} fill="#fde68a">
                {m.text}
              </text>
            </g>
          );
        })}
      </g>

      {/* Labels — left gutter */}
      <Label id="likido-amniotikoa" x={200} y={100} ax={cavC[0] - cavRx * 0.5} ay={cavC[1] - cavRy * 0.6} />
      <Label id="amniosa" x={200} y={150} ax={cavC[0] - cavRx - 5} ay={cavC[1]} />
      <Label id="amnios-barrunbea" x={200} y={200} ax={cavC[0] - 60} ay={cavC[1] + 60} />
      <Label id="fetu-aroa" x={200} y={250} ax={place.xf([0, 40])[0]} ay={place.xf([0, 40])[1]} />
      <Label id="degluzioa" x={200} y={300} ax={mouth[0]} ay={mouth[1]} show={swallowA} />

      {/* Labels — right gutter */}
      <Label id="karena" x={800} y={150} ax={plC[0] + 30} ay={plC[1] - 18} />
      <Label id="zilborrestea" x={800} y={200} ax={cordMid[0]} ay={cordMid[1]} />

      <Note x={500} y={612} tone="dim" show={sourcesA > 0.02 ? 1 : 0}>
        Jatorria: amniosa, fetuaren gernua, dezidua, biloxka-odola, arnas/digestio aparatua
      </Note>
      <Note x={500} y={612} tone="dim" show={functionsA}>
        Funtzioak: hazkuntza, mugimenduak, astinketak baretu, itsaste-eragozpena
      </Note>
      <Note x={500} y={612} tone="accent" show={swallowA}>
        Degluzioa: ~400 ml/egun, hesteetatik odolera eta karena/giltzurrunetara
      </Note>
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* PrenatalTests — stage `likido-amniotikoa`, view `teknikak`                                       */
/* ---------------------------------------------------------------------------------------------- */

const U2: Pt[] = [
  [500, 150], [640, 168], [730, 250], [760, 360], [726, 466], [630, 528], [500, 546],
  [370, 528], [274, 466], [240, 360], [270, 250], [360, 168],
];
const PLAC2: Pt = [352, 230];
const CAV2: Pt = [500, 352];
const CAV2_R: Pt = [190, 170];
/** Where a placenta centred towards `toward` sits on the cavity wall: its centre, the wall's tangent (°) and the cord insertion (just inside the wall). */
function wallSpot(c: Pt, r: Pt, toward: Pt) {
  const a = Math.atan2((toward[1] - c[1]) / r[1], (toward[0] - c[0]) / r[0]);
  const at = (d: number): Pt => [c[0] + (r[0] + d) * Math.cos(a), c[1] + (r[1] + d) * Math.sin(a)];
  return { c: at(6), ins: at(10), tan: (Math.atan2(r[1] * Math.cos(a), -r[0] * Math.sin(a)) * 180) / Math.PI };
}
// Mother's abdominal wall: a quadratic whose x runs linearly, so its height at any x is closed-form.
const wallY = (x: number) => {
  const k = (x - 100) / 800;
  return 126 - 156 * k * (1 - k);
};
// Ultrasound-guided into a free pocket of fluid, well clear of the fetus and the placenta.
const NEEDLE_X = 468;
const NEEDLE_B: Pt = [NEEDLE_X, 318];
/** Needle length from hub to tip: at full depth the syringe barrel stays just above the skin. */
const NEEDLE_L = 250;
const VAGINA_A: Pt = [500, 546];
const VAGINA_B: Pt = [500, 604];
// Cervix: a narrow neck under the uterus (its top hides inside the uterine silhouette).
const CERVIX: Pt[] = [[452, 520], [480, 556], [482, 590], [490, 606], [510, 606], [518, 590], [520, 556], [548, 520]];
const PROBE: Pt = [566, wallY(566)];
const PROBE_TILT = (Math.atan2(-156 * (1 - 2 * ((566 - 100) / 800)), 800) * 180) / Math.PI;

export function PrenatalTests({ t }: SceneProps) {
  const probeA = seg(t, 0.68, 0.76) * (1 - seg(t, 0.94, 1));
  const bloodA = vis(t, 0.78);
  const needleA = seg(t, 0.86, 0.94);
  const cvsA = seg(t, 0.9, 0.98);

  // The syringe slides in from above: the tip crosses the skin early and ends in a free pocket of fluid.
  const needleTip: Pt = [NEEDLE_X, lerp(wallY(NEEDLE_X) + 6, NEEDLE_B[1], needleA)];
  const hubY = needleTip[1] - NEEDLE_L;
  const draw = seg(needleA, 0.85, 1);
  // Through the cervix and up between the uterine wall and the membranes (never through the amniotic cavity) to the villi.
  const inWall = (deg: number, d: number): Pt => [CAV2[0] + (CAV2_R[0] + d) * Math.cos((deg * Math.PI) / 180), CAV2[1] + (CAV2_R[1] + d) * Math.sin((deg * Math.PI) / 180)];
  const cvsEnd = inWall(212, 12);
  const catheterD = smoothPath([VAGINA_B, VAGINA_A, inWall(100, 9), inWall(140, 10), inWall(180, 10), cvsEnd], false, 0.5);
  const catheterLen = 1 - cvsA;
  const place = placeFetus(13, 6.5, 560, 380);
  const cordBase = place.xf(fetusGeom(22).cordBase);
  const pl = wallSpot(CAV2, CAV2_R, PLAC2);
  const cordPts: Pt[] = [cordBase, [cordBase[0] + 6, cordBase[1] + 30], [cordBase[0] - 60, cordBase[1] + 52], [412, 372], [pl.ins[0] + 16, pl.ins[1] + 60], pl.ins];
  const clipId = `${useId().replace(/:/g, '')}-wall2`;
  // Ultrasound pulses: rings leaving the probe, pure functions of t.
  const pulses = [0, 1, 2].map((i) => (t * 24 + i / 3) % 1);
  const fanS = Math.sin((24 * Math.PI) / 180);
  const fanC = Math.cos((24 * Math.PI) / 180);

  return (
    <g>
      <defs>
        {/* The abdominal wall fades out at both ends instead of stopping in round caps. */}
        <linearGradient id={`${clipId}-abd`} gradientUnits="userSpaceOnUse" x1={100} y1={0} x2={900} y2={0}>
          <stop offset="0" stopColor="#e3a7ac" stopOpacity="0" />
          <stop offset="0.14" stopColor="#e3a7ac" stopOpacity="0.9" />
          <stop offset="0.86" stopColor="#e3a7ac" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e3a7ac" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${clipId}-abd-d`} gradientUnits="userSpaceOnUse" x1={100} y1={0} x2={900} y2={0}>
          <stop offset="0" stopColor="#5a2a30" stopOpacity="0" />
          <stop offset="0.14" stopColor="#5a2a30" />
          <stop offset="0.86" stopColor="#5a2a30" />
          <stop offset="1" stopColor="#5a2a30" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${clipId}-fan`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={230}>
          <stop offset="0" stopColor="#8ecae6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8ecae6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${clipId}-myo`} gradientUnits="userSpaceOnUse" cx={CAV2[0]} cy={CAV2[1]} r={270}>
          <stop offset="0.62" stopColor="#82303a" />
          <stop offset="1" stopColor="#5e2129" />
        </radialGradient>
      </defs>

      {/* Mother's abdominal wall: skin over a thin dark layer, fading at the ends */}
      <path d="M100,126 Q500,48 900,126" fill="none" stroke={`url(#${clipId}-abd-d)`} strokeWidth={11} />
      <path d="M100,126 Q500,48 900,126" fill="none" stroke={`url(#${clipId}-abd)`} strokeWidth={7} />

      {/* Uterus and cervix as one organ: both outlines first, then both fills, so no seam shows */}
      <g fill="none" stroke="#4a1a20" strokeWidth={4} strokeLinejoin="round">
        <path d={smoothPath(U2, true, 0.55)} />
        <path d={smoothPath(CERVIX, true, 0.5)} />
      </g>
      <path d={smoothPath(CERVIX, true, 0.5)} fill="#6a252d" />
      <path d={smoothPath(U2, true, 0.55)} fill={`url(#${clipId}-myo)`} />
      {/* Cervical canal, opening at the external os */}
      <path d={`M${VAGINA_A[0]},${VAGINA_A[1] - 4} L${VAGINA_B[0]},${VAGINA_B[1] + 1}`} stroke="#2a0c10" strokeWidth={3} strokeLinecap="round" />

      <ellipse cx={CAV2[0]} cy={CAV2[1]} rx={CAV2_R[0]} ry={CAV2_R[1]} fill={C.amnionCavity} />
      <ellipse cx={CAV2[0]} cy={CAV2[1]} rx={CAV2_R[0]} ry={CAV2_R[1]} fill="none" stroke="#8ecae6" strokeWidth={1.4} opacity={0.5} />
      <ellipse cx={CAV2[0]} cy={CAV2[1]} rx={CAV2_R[0] + 5} ry={CAV2_R[1] + 5} fill="none" stroke="#bfe0f2" strokeWidth={1.2} strokeDasharray="2 5" opacity={0.45} />

      <g transform={place.transform}>
        <FetusFigure
          id="w6pt"
          week={22}
          s={place.s}
          cord={
            <Part id="zilborrestea" quiet>
              <CordRope pts={cordPts.map(place.inv)} w={7 / place.s} turns={8} />
            </Part>
          }
        />
      </g>

      {/* Placenta as a lens in the wall; its fetal surface is the cavity wall (over the cord's insertion) */}
      <clipPath id={clipId}>
        <path d={`M0,0H1000V640H0Z M${CAV2[0] - CAV2_R[0]},${CAV2[1]} a${CAV2_R[0]},${CAV2_R[1]} 0 1,0 ${CAV2_R[0] * 2},0 a${CAV2_R[0]},${CAV2_R[1]} 0 1,0 ${-CAV2_R[0] * 2},0Z`} clipRule="evenodd" />
      </clipPath>
      <clipPath id={`${clipId}-u`}>
        <path d={smoothPath(U2, true, 0.55)} />
      </clipPath>
      <Part id="karena" quiet>
        <g clipPath={`url(#${clipId})`}>
          <g clipPath={`url(#${clipId}-u)`}>
            <ellipse cx={pl.c[0]} cy={pl.c[1]} rx={84} ry={36} transform={`rotate(${pl.tan} ${pl.c[0]} ${pl.c[1]})`} fill="#c2415f" stroke="#7c1f36" strokeWidth={2} />
          </g>
        </g>
      </Part>

      {/* Ekografia: transducer resting on the abdomen, its beam a fan of pulses into the uterus */}
      <Part id="ekografia" show={probeA > 0.02 ? 1 : 0}>
        <g transform={`translate(${PROBE[0]} ${PROBE[1]}) rotate(${PROBE_TILT})`} opacity={probeA}>
          <path d={`M0,2 L${-fanS * 230},${2 + fanC * 230} A230,230 0 0 0 ${fanS * 230},${2 + fanC * 230} Z`} fill={`url(#${clipId}-fan)`} />
          {pulses.map((ph, i) => {
            const r = 24 + 200 * ph;
            return (
              <path
                key={i}
                d={`M${-fanS * r},${2 + fanC * r} A${r},${r} 0 0 0 ${fanS * r},${2 + fanC * r}`}
                fill="none"
                stroke="#8ecae6"
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={0.85 * (1 - ph)}
              />
            );
          })}
          <path d="M3,-50 C8,-74 30,-84 56,-92" fill="none" stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
          <path d="M-13,-6 L-9,-48 Q0,-55 9,-48 L13,-6 Z" fill="#cbd5e1" stroke="#475569" strokeWidth={1.4} strokeLinejoin="round" />
          <rect x={-20} y={-9} width={40} height={10} rx={4} fill="#94a3b8" stroke="#475569" strokeWidth={1.4} />
        </g>
      </Part>

      {/* Amaren serumaren azterketa: blood tube, α-fetoproteina */}
      <Part id="alfa-fetoproteina" show={bloodA}>
        <g transform="translate(858 290)">
          <rect x={-9} y={0} width={18} height={40} rx={5} fill="#cbd5e1" stroke="#475569" strokeWidth={1.2} />
          <rect x={-9} y={18} width={18} height={22} rx={5} fill="#b91c3c" opacity={0.85} />
          <rect x={-12} y={-8} width={24} height={9} rx={2} fill="#94a3b8" />
        </g>
      </Part>

      {/* Amniozentesia: needle through the abdominal/uterine wall */}
      <Part id="amniozentesia" show={needleA > 0.02 ? 1 : 0}>
        <g opacity={seg(needleA, 0, 0.15)}>
          <line x1={NEEDLE_X} y1={hubY} x2={needleTip[0]} y2={needleTip[1]} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
          {/* Syringe: hub, barrel (filling with fluid once the tip is in the pocket) and plunger drawn back */}
          <rect x={NEEDLE_X - 4} y={hubY - 8} width={8} height={9} rx={1.5} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
          <rect x={NEEDLE_X - 8} y={hubY - 48} width={16} height={41} rx={3} fill="rgba(226,232,240,0.22)" stroke="#cbd5e1" strokeWidth={1.3} />
          {draw > 0.01 && <rect x={NEEDLE_X - 6.5} y={hubY - 9 - 30 * draw} width={13} height={30 * draw} rx={2} fill="#8ecae6" opacity={0.75} />}
          <rect x={NEEDLE_X - 6.5} y={hubY - 12 - 30 * draw} width={13} height={4} rx={1} fill="#475569" />
          <path d={`M${NEEDLE_X},${hubY - 11 - 30 * draw} V${hubY - 60 - 30 * draw} M${NEEDLE_X - 9},${hubY - 60 - 30 * draw} H${NEEDLE_X + 9}`} stroke="#cbd5e1" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={needleTip[0]} cy={needleTip[1]} r={4} fill="#8ecae6" opacity={0.8 * draw} />
        </g>
      </Part>

      {/* Biloxka korionikoen biopsia: catheter from the vagina, through the cervix, to the villi */}
      <Part id="biloxka-korionikoen-biopsia" show={cvsA > 0.02 ? 1 : 0}>
        <path d={catheterD} fill="none" stroke="#e2e8f0" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="600" strokeDashoffset={600 * catheterLen} />
      </Part>

      {/* Labels */}
      <Label id="ekografia" x={200} y={100} ax={PROBE[0] - 12} ay={PROBE[1] - 30} show={probeA} />
      <Label id="alfa-fetoproteina" x={800} y={300} ax={858} ay={300} show={bloodA} />
      <Label id="amniozentesia" x={200} y={400} ax={needleTip[0]} ay={needleTip[1]} show={needleA} />
      <Label id="biloxka-korionikoen-biopsia" x={200} y={460} ax={cvsEnd[0]} ay={cvsEnd[1]} show={cvsA} />
      <Label id="karena" x={200} y={200} ax={pl.c[0] - 14} ay={pl.c[1] - 10} />

      <Note x={500} y={612} tone="warn" show={needleA}>
        Amniozentesia: ez lehen 14 asteetan
      </Note>
    </g>
  );
}
