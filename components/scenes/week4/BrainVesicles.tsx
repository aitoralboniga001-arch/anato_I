'use client';

import { C, Label, Note, Part, lerp, seg, smoothPath, type SceneProps } from '@/components/kit';
import { dorsalPt, ribbon, type Pt } from './common';

/**
 * Stage `burmuin-bexikulak` — the cranial end of the neural tube dilates into three primary
 * vesicles (prosentzefaloa, mesentzefaloa, erronbentzefaloa); the rest becomes the ornomuina.
 */

const VX = 500;
const D_TOP = 130;
const D_JUNCTION = 300;
const D_BOTTOM = 560;

function DorsalDrawing({ t }: SceneProps) {
  const prosA = seg(t, 0.05, 0.42);
  const mesA = seg(t, 0.2, 0.56);
  const rhombA = seg(t, 0.35, 0.72);
  const cordA = seg(t, 0.1, 0.5);

  const prosR = lerp(20, 54, prosA);
  const mesR = lerp(17, 40, mesA);
  const rhombR = lerp(17, 46, rhombA);
  const prosY = D_TOP + 40;
  const mesY = prosY + prosR * 0.6 + mesR * 0.75;
  const rhombY = mesY + mesR * 0.6 + rhombR * 0.8;

  const cordPts: Pt[] = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const y = lerp(rhombY + rhombR * 0.7, D_BOTTOM, k);
    const w = lerp(rhombR * 0.62, 10, Math.pow(k, 0.6)) * cordA;
    cordPts.push([VX - w, y]);
  }
  for (let i = n; i >= 0; i--) {
    const k = i / n;
    const y = lerp(rhombY + rhombR * 0.7, D_BOTTOM, k);
    const w = lerp(rhombR * 0.62, 10, Math.pow(k, 0.6)) * cordA;
    cordPts.push([VX + w, y]);
  }

  return (
    <g>
      <Part id="ornomuina" show={cordA}>
        <path d={smoothPath(cordPts, true, 0.35)} fill={C.neural} opacity={0.85} />
      </Part>
      <Part id="erronbentzefaloa" show={rhombA}>
        <ellipse cx={VX} cy={rhombY} rx={rhombR * 1.05} ry={rhombR} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>
      <Part id="mesentzefaloa" show={mesA}>
        <ellipse cx={VX} cy={mesY} rx={mesR} ry={mesR * 0.92} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>
      <Part id="prosentzefaloa" show={prosA}>
        <ellipse cx={VX - 4} cy={prosY} rx={prosR * 1.1} ry={prosR * 0.85} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
        <ellipse cx={VX - prosR * 0.55} cy={prosY - prosR * 0.15} rx={prosR * 0.52} ry={prosR * 0.42} fill="#7a9cf2" opacity={0.55 * prosA} />
        <ellipse cx={VX + prosR * 0.55} cy={prosY - prosR * 0.15} rx={prosR * 0.52} ry={prosR * 0.42} fill="#7a9cf2" opacity={0.55 * prosA} />
      </Part>
    </g>
  );
}

function dorsalLabels(t: number) {
  const prosA = seg(t, 0.05, 0.42);
  const mesA = seg(t, 0.2, 0.56);
  const rhombA = seg(t, 0.35, 0.72);
  const cordA = seg(t, 0.1, 0.5);
  const prosY = D_TOP + 40;
  const mesY = prosY + lerp(20, 54, prosA) * 0.6 + lerp(17, 40, mesA) * 0.75;
  const rhombY = mesY + lerp(17, 40, mesA) * 0.6 + lerp(17, 46, rhombA) * 0.8;
  return (
    <>
      <Label id="prosentzefaloa" x={190} y={170} ax={VX - 40} ay={prosY} show={prosA} />
      <Label id="mesentzefaloa" x={190} y={230} ax={VX - 24} ay={mesY} show={mesA} />
      <Label id="erronbentzefaloa" x={190} y={290} ax={VX - 30} ay={rhombY} show={rhombA} />
      <Label id="ornomuina" x={810} y={420} ax={VX + 14} ay={D_BOTTOM - 60} show={cordA} />
    </>
  );
}

export function BrainVesiclesDorsal(props: SceneProps) {
  return (
    <g>
      <DorsalDrawing {...props} />
      {dorsalLabels(props.t)}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Lateral view: the already-folded (day-28) embryo, cranial end zoomed in on the tube.
// ---------------------------------------------------------------------------

function LateralDrawing({ t }: SceneProps) {
  const prosA = seg(t, 0.05, 0.42);
  const mesA = seg(t, 0.2, 0.56);
  const rhombA = seg(t, 0.35, 0.72);

  const pPros = dorsalPt(0.05, 1, 6);
  const pMes = dorsalPt(0.15, 1, 6);
  const pRhomb = dorsalPt(0.24, 1, 6);

  return (
    <g opacity={0.96}>
      <path d={ribbon('dorsal', 1, -4, 30, 0, 1)} fill="rgba(255,255,255,0.04)" stroke="rgba(232,238,252,0.2)" strokeWidth={1} />
      <path d={ribbon('ventral', 1, -4, 30, 0, 1)} fill="rgba(255,255,255,0.03)" stroke="rgba(232,238,252,0.15)" strokeWidth={1} />

      <Part id="ornomuina">
        <path d={ribbon('dorsal', 1, 4, 18, 0.28, 1)} fill={C.neural} opacity={0.85} />
      </Part>
      <Part id="erronbentzefaloa" show={rhombA}>
        <circle cx={pRhomb[0]} cy={pRhomb[1]} r={20 + 18 * rhombA} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>
      <Part id="mesentzefaloa" show={mesA}>
        <circle cx={pMes[0]} cy={pMes[1]} r={16 + 16 * mesA} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>
      <Part id="prosentzefaloa" show={prosA}>
        <circle cx={pPros[0]} cy={pPros[1]} r={18 + 20 * prosA} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>

      <Part id="mintz-bukofaringeoa" quiet>
        <circle cx={dorsalPt(0.015, 1)[0]} cy={dorsalPt(0.015, 1)[1]} r={5} fill="#dfe7ff" stroke="#3a5fd9" strokeWidth={1.2} />
      </Part>
    </g>
  );
}

function lateralLabels(t: number) {
  const prosA = seg(t, 0.05, 0.42);
  const mesA = seg(t, 0.2, 0.56);
  const rhombA = seg(t, 0.35, 0.72);
  return (
    <>
      <Label id="prosentzefaloa" x={810} y={140} ax={dorsalPt(0.05, 1, 6)[0]} ay={dorsalPt(0.05, 1, 6)[1]} show={prosA} />
      <Label id="mesentzefaloa" x={810} y={190} ax={dorsalPt(0.15, 1, 6)[0]} ay={dorsalPt(0.15, 1, 6)[1]} show={mesA} />
      <Label id="erronbentzefaloa" x={810} y={240} ax={dorsalPt(0.24, 1, 6)[0]} ay={dorsalPt(0.24, 1, 6)[1]} show={rhombA} />
      <Label id="ornomuina" x={190} y={450} ax={dorsalPt(0.6, 1, 10)[0]} ay={dorsalPt(0.6, 1, 10)[1]} />
      <Label id="mintz-bukofaringeoa" x={810} y={372} ax={dorsalPt(0.015, 1)[0]} ay={dorsalPt(0.015, 1)[1]} small />
    </>
  );
}

export function BrainVesiclesLateral(props: SceneProps) {
  return (
    <g>
      <LateralDrawing {...props} />
      {lateralLabels(props.t)}
    </g>
  );
}
