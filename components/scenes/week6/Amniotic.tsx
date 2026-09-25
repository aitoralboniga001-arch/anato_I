'use client';

import { C, Flow, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { fetusGeom, FetusFigure, placeFetus } from '@/components/scenes/week5/FetusFigure';

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

/* ---------------------------------------------------------------------------------------------- */
/* AmnioticFluid — stage `likido-amniotikoa`, view `bolumena`                                       */
/* ---------------------------------------------------------------------------------------------- */

const UTERUS: Pt[] = [
  [500, 66], [660, 90], [772, 190], [812, 340], [770, 480], [660, 566], [500, 592],
  [340, 566], [230, 480], [188, 340], [228, 190], [340, 90],
];

const PLACENTA_C: Pt = [652, 138];

/** Amniotic-fluid volume (ml) across the stage: 10 w. 30 ml → 30 w. 200–500 ml → 37–38 w. 800–1000 ml. */
function volumeAt(t: number) {
  if (t < 0.3) return { ml: Math.round(lerp(30, 350, seg(t, 0, 0.3))), week: t < 0.06 ? '10. astea' : '~10.–30. asteak' };
  return { ml: Math.round(lerp(350, 900, seg(t, 0.3, 1))), week: t > 0.9 ? '37.–38. asteak' : '~30.–37. asteak' };
}

export function AmnioticFluid({ t, reduced }: SceneProps) {
  const { ml, week } = volumeAt(t);
  const fill = seg(t, 0, 1); // amnios barrunbea slowly filling out
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

  const sourcesA = seg(t, 0.14, 0.24) * (1 - seg(t, 0.42, 0.5));
  const functionsA = vis(t, 0.46, 0.58);
  const swallowA = vis(t, 0.58, 1);

  const gaugeH = 100;
  const gaugeFill = Math.min(1, ml / 1000) * gaugeH;

  const cordD = smoothPath([cordBase, [(cordBase[0] + PLACENTA_C[0]) / 2, (cordBase[1] + PLACENTA_C[1]) / 2 - 30], PLACENTA_C], false, 0.5);

  return (
    <g>
      {/* Uterine wall */}
      <path d={smoothPath(UTERUS, true, 0.55)} fill="#7a2c34" stroke="#4a1a20" strokeWidth={2} opacity={0.92} />
      <path d={smoothPath(UTERUS, true, 0.55)} fill="none" stroke="#c88a90" strokeWidth={1} opacity={0.35} />

      {/* Placenta patch on the wall */}
      <Part id="karena" quiet>
        <ellipse cx={PLACENTA_C[0]} cy={PLACENTA_C[1]} rx={78} ry={48} fill="#c2415f" stroke="#7c1f36" strokeWidth={2} />
      </Part>

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

      {/* Cord to the placenta */}
      <Part id="zilborrestea">
        <path d={cordD} fill="none" stroke="#d9a6b8" strokeWidth={7} strokeLinecap="round" />
        <path d={cordD} fill="none" stroke="#9c4a6d" strokeWidth={2} strokeDasharray="6 5" opacity={0.7} />
        <path d={cordD} fill="none" stroke="#6f78b8" strokeWidth={1.6} strokeDasharray="5 6" strokeDashoffset={4} opacity={0.65} />
      </Part>

      <Part id="fetu-aroa" quiet>
        <g transform={place.transform}>
          <FetusFigure id="w6af" week={week5} pose={pose} s={place.s} vernix={0.4} />
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
          <Flow d={`M${cordBase[0]},${cordBase[1]} Q${(cordBase[0] + PLACENTA_C[0]) / 2},${(cordBase[1] + PLACENTA_C[1]) / 2 - 20} ${PLACENTA_C[0]},${PLACENTA_C[1]}`} n={3} dur={3.6} r={2.2} color="#8ecae6" />
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
      </g>

      {/* Labels — left gutter */}
      <Label id="likido-amniotikoa" x={200} y={100} ax={cavC[0] - cavRx * 0.5} ay={cavC[1] - cavRy * 0.6} />
      <Label id="amniosa" x={200} y={150} ax={cavC[0] - cavRx - 5} ay={cavC[1]} />
      <Label id="amnios-barrunbea" x={200} y={200} ax={cavC[0] - 60} ay={cavC[1] + 60} />
      <Label id="fetu-aroa" x={200} y={250} ax={place.xf([0, 40])[0]} ay={place.xf([0, 40])[1]} />
      <Label id="degluzioa" x={200} y={300} ax={mouth[0]} ay={mouth[1]} show={swallowA} />

      {/* Labels — right gutter */}
      <Label id="karena" x={800} y={150} ax={PLACENTA_C[0] + 60} ay={PLACENTA_C[1]} />
      <Label id="zilborrestea" x={800} y={200} ax={(cordBase[0] + PLACENTA_C[0]) / 2} ay={(cordBase[1] + PLACENTA_C[1]) / 2 - 10} />

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
const NEEDLE_A: Pt = [560, 118];
const NEEDLE_B: Pt = [560, 340];
const VAGINA_A: Pt = [500, 546];
const VAGINA_B: Pt = [500, 604];

export function PrenatalTests({ t }: SceneProps) {
  const probeA = seg(t, 0.68, 0.76) * (1 - seg(t, 0.94, 1));
  const bloodA = vis(t, 0.78);
  const needleA = seg(t, 0.86, 0.94);
  const cvsA = seg(t, 0.9, 0.98);

  const needleTip: Pt = [lerp(NEEDLE_A[0], NEEDLE_B[0], needleA), lerp(NEEDLE_A[1], NEEDLE_B[1], needleA)];
  const catheterD = smoothPath([VAGINA_B, VAGINA_A, [430, 460], [PLAC2[0] + 30, PLAC2[1] + 40]], false, 0.5);
  const catheterLen = 1 - cvsA;

  return (
    <g>
      {/* Mother's abdominal wall */}
      <path d="M120,120 Q500,50 880,120" fill="none" stroke="#e3a7ac" strokeWidth={6} strokeLinecap="round" opacity={0.85} />

      {/* Uterus */}
      <path d={smoothPath(U2, true, 0.55)} fill="#7a2c34" stroke="#4a1a20" strokeWidth={2} opacity={0.92} />
      <ellipse cx={500} cy={352} rx={190} ry={170} fill={C.amnionCavity} />

      <Part id="karena" quiet>
        <ellipse cx={PLAC2[0]} cy={PLAC2[1]} rx={64} ry={40} fill="#c2415f" stroke="#7c1f36" strokeWidth={2} />
      </Part>

      <g transform={placeFetus(13, 6.5, 560, 380).transform}>
        <FetusFigure id="w6pt" week={22} s={placeFetus(13, 6.5, 560, 380).s} />
      </g>

      {/* Cervix / vaginal canal */}
      <path d={`M${VAGINA_A[0] - 26},${VAGINA_A[1]} L${VAGINA_B[0] - 14},${VAGINA_B[1]} L${VAGINA_B[0] + 14},${VAGINA_B[1]} L${VAGINA_A[0] + 26},${VAGINA_A[1]}Z`} fill="#7a2c34" stroke="#4a1a20" strokeWidth={2} opacity={0.9} />

      {/* Ekografia: probe on the abdomen, emitting an ultrasound fan */}
      <Part id="ekografia" show={probeA > 0.02 ? 1 : 0}>
        <rect x={540} y={92} width={40} height={20} rx={4} fill="#cbd5e1" stroke="#475569" strokeWidth={1.4} />
        {[0.55, 0.75, 0.95].map((k, i) => (
          <path
            key={i}
            d={`M540,112 A${120 * k},${120 * k} 0 0 1 620,${112 + 190 * k * 0.55}`}
            fill="none"
            stroke="#8ecae6"
            strokeWidth={1.6}
            opacity={probeA * (1 - i * 0.22)}
          />
        ))}
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
        <line x1={NEEDLE_A[0]} y1={NEEDLE_A[1]} x2={needleTip[0]} y2={needleTip[1]} stroke="#e2e8f0" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={needleTip[0]} cy={needleTip[1]} r={4} fill="#8ecae6" opacity={0.8} />
      </Part>

      {/* Biloxka korionikoen biopsia: catheter from the vagina, through the cervix, to the villi */}
      <Part id="biloxka-korionikoen-biopsia" show={cvsA > 0.02 ? 1 : 0}>
        <path d={catheterD} fill="none" stroke="#e2e8f0" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="600" strokeDashoffset={600 * catheterLen} />
      </Part>

      {/* Labels */}
      <Label id="ekografia" x={200} y={100} ax={560} ay={102} show={probeA} />
      <Label id="alfa-fetoproteina" x={800} y={300} ax={858} ay={300} show={bloodA} />
      <Label id="amniozentesia" x={200} y={400} ax={needleTip[0]} ay={needleTip[1]} show={needleA} />
      <Label id="biloxka-korionikoen-biopsia" x={200} y={460} ax={PLAC2[0] + 20} ay={PLAC2[1] + 40} show={cvsA} />
      <Label id="karena" x={200} y={200} ax={PLAC2[0]} ay={PLAC2[1]} />

      <Note x={500} y={612} tone="warn" show={needleA}>
        Amniozentesia: ez lehen 14 asteetan
      </Note>
    </g>
  );
}
