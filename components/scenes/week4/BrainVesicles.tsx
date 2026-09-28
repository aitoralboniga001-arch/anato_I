'use client';

import { C, Label, Part, lerp, lerpPt, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { earlyGeom } from '@/components/scenes/week5/EarlyEmbryo';
import { spineAt } from '@/components/scenes/week5/skin';

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
  const cordA = 0.35 + 0.65 * seg(t, 0.1, 0.5);

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
      <Part id="ornomuina" show={0.45 + 0.55 * cordA}>
        <path d={smoothPath(cordPts, true, 0.35)} fill={C.neural} opacity={0.85} />
      </Part>
      <Part id="erronbentzefaloa" show={0.45 + 0.55 * rhombA}>
        <ellipse cx={VX} cy={rhombY} rx={rhombR * 1.05} ry={rhombR} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>
      <Part id="mesentzefaloa" show={0.45 + 0.55 * mesA}>
        <ellipse cx={VX} cy={mesY} rx={mesR} ry={mesR * 0.92} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.4} />
      </Part>
      <Part id="prosentzefaloa" show={0.45 + 0.55 * prosA}>
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
      {/* Before the vesicles bulge, it is one continuous tube. */}
      <Label id="hodi-neurala" x={810} y={360} ax={VX + 14} ay={(D_TOP + D_BOTTOM) / 2} show={1 - seg(t, 0.1, 0.14)} />
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
// Lateral view: the folded day-28 embryo (Langman outline, as in topic 5), seen through, with a
// continuous neural tube along its back whose cranial end swells into the three vesicles.
// ---------------------------------------------------------------------------

export const G28 = earlyGeom(28);
export const onEll = (e: readonly number[], deg: number, f: number): Pt => {
  const a = ((deg + (e[4] ?? 0)) * Math.PI) / 180;
  return [e[0] + Math.cos(a) * e[2] * f, e[1] + Math.sin(a) * e[3] * f];
};
// Centreline, rostral → caudal: forebrain (above the face) → midbrain (cephalic flexure, top of
// the head) → hindbrain (over the pharyngeal arches) → spinal cord along the back to the tail.
const P_PROS = onEll(G28.cran, 150, 0.42);
const P_MES = onEll(G28.cran, -95, 0.55);
const P_RHOMB: Pt = spineAt(G28.S, 0.0, 34).p;
const CORD_U = Array.from({ length: 24 }, (_, i) => 0.06 + (0.91 * i) / 23);
const CORD_PTS = CORD_U.map((u) => spineAt(G28.S, u, lerp(14, 6, u)).p);

type Node = { p: Pt; r: number; part: 'prosentzefaloa' | 'mesentzefaloa' | 'erronbentzefaloa' | 'ornomuina' };

function catmull(p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt {
  const u2 = u * u;
  const u3 = u2 * u;
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

function tubeNodes(t: number): Node[] {
  const prosA = seg(t, 0.05, 0.42);
  const mesA = seg(t, 0.2, 0.56);
  const rhombA = seg(t, 0.35, 0.72);
  const neck = 13;
  const ctrl: Node[] = [
    { p: lerpPt(P_PROS, G28.face.slice(0, 2) as unknown as Pt, 0.35), r: lerp(neck, 30, prosA), part: 'prosentzefaloa' },
    { p: P_PROS, r: lerp(neck, 46, prosA), part: 'prosentzefaloa' },
    { p: lerpPt(P_PROS, P_MES, 0.5), r: lerp(neck, 22, Math.min(prosA, mesA)), part: 'mesentzefaloa' },
    { p: P_MES, r: lerp(neck, 36, mesA), part: 'mesentzefaloa' },
    { p: lerpPt(P_MES, P_RHOMB, 0.5), r: lerp(neck, 20, Math.min(mesA, rhombA)), part: 'erronbentzefaloa' },
    { p: P_RHOMB, r: lerp(neck, 40, rhombA), part: 'erronbentzefaloa' },
    ...CORD_PTS.map((p, i) => ({ p, r: lerp(i === 0 ? lerp(neck, 20, rhombA) : 11, 4, i / (CORD_PTS.length - 1)), part: 'ornomuina' as const })),
  ];
  const out: Node[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = ctrl[i];
    const b = ctrl[i + 1];
    const n = Math.max(2, Math.ceil(Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]) / 3));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const e = u * u * (3 - 2 * u);
      const p0 = ctrl[Math.max(0, i - 1)].p;
      const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)].p;
      out.push({ p: catmull(p0, a.p, b.p, p3, u), r: lerp(a.r, b.r, e), part: u < 0.5 ? a.part : b.part });
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/** The day-28 embryo seen through: the outline of the topic-5 (Langman) figure, no parts. */
export function Embryo28Outline() {
  const g = G28;
  return (
    <g pointerEvents="none">
      <g fill="rgba(229,134,108,0.16)" stroke="rgba(229,134,108,0.55)" strokeWidth={1.4}>
        <path d={smoothPath([...g.spine, ...[...g.inner].reverse().slice(1)], true, 0.5)} />
        {[g.hind, g.cran, g.face, g.heart].map((e, i) => (
          <ellipse key={i} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} transform={`rotate(${e[4]} ${e[0]} ${e[1]})`} />
        ))}
      </g>
      {g.bars.map((b, i) => (
        <line key={i} x1={b.top[0]} y1={b.top[1]} x2={b.bot[0]} y2={b.bot[1]} stroke="rgba(229,134,108,0.4)" strokeWidth={b.w * 0.7} strokeLinecap="round" />
      ))}
    </g>
  );
}

function LateralDrawing({ t }: SceneProps) {
  const g = G28;
  const nodes = tubeNodes(t);
  const parts = ['ornomuina', 'erronbentzefaloa', 'mesentzefaloa', 'prosentzefaloa'] as const;
  const b0 = g.bars[0];
  return (
    <g>
      <Embryo28Outline />
      {/* Neural tube: outline pass, then fill pass, one Part per region */}
      <g fill="#1e3a8a">
        {nodes.map((n, i) => (
          <circle key={i} cx={n.p[0]} cy={n.p[1]} r={n.r + 2} />
        ))}
      </g>
      {parts.map((id) => (
        <Part key={id} id={id}>
          {nodes
            .filter((n) => n.part === id)
            .map((n, i) => (
              <circle key={i} cx={n.p[0]} cy={n.p[1]} r={n.r} fill={C.neural} />
            ))}
        </Part>
      ))}
      <Part id="mintz-bukofaringeoa" quiet>
        <circle cx={b0.bot[0] - b0.w * 0.55} cy={b0.bot[1] - b0.w * 0.3} r={5} fill="#dfe7ff" stroke="#3a5fd9" strokeWidth={1.2} />
      </Part>
    </g>
  );
}

function lateralLabels(t: number) {
  const prosA = seg(t, 0.05, 0.42);
  const mesA = seg(t, 0.2, 0.56);
  const rhombA = seg(t, 0.35, 0.72);
  const b0 = G28.bars[0];
  const cord = spineAt(G28.S, 0.5, 10).p;
  return (
    <>
      <Label id="prosentzefaloa" x={190} y={250} ax={P_PROS[0]} ay={P_PROS[1]} show={prosA} />
      <Label id="mesentzefaloa" x={190} y={110} ax={P_MES[0]} ay={P_MES[1]} show={mesA} />
      <Label id="erronbentzefaloa" x={810} y={110} ax={P_RHOMB[0]} ay={P_RHOMB[1]} show={rhombA} />
      <Label id="ornomuina" x={810} y={400} ax={cord[0]} ay={cord[1]} />
      <Label id="mintz-bukofaringeoa" x={190} y={380} ax={b0.bot[0] - b0.w * 0.55} ay={b0.bot[1] - b0.w * 0.3} small />
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
