'use client';

import { useId } from 'react';
import { C, Label, Mark, Part, lerp, lerpPt, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
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

/**
 * Vesicle growth: a first hint of all three swellings in step 1 ("agertzen hasten dira"), then each
 * one grows in its own step (week4.ts beats .08 / .24 / .4), complete before that step's done frame.
 */
function vesicles(t: number) {
  const hint = 0.15 * seg(t, 0, 0.06);
  return {
    prosA: hint + 0.85 * seg(t, 0.08, 0.2),
    mesA: hint + 0.85 * seg(t, 0.24, 0.36),
    rhombA: hint + 0.85 * seg(t, 0.4, 0.53),
    // Names arrive with their own step only (not with the first hint).
    prosL: seg(t, 0.08, 0.2),
    mesL: seg(t, 0.24, 0.36),
    rhombL: seg(t, 0.4, 0.53),
  };
}

/** Smooth maximum (soft union of two profiles, so the vesicles blend through real necks). */
const smax = (a: number, b: number, k = 0.22) => Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b) * k)) / k;

function DorsalDrawing({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const { prosA, mesA, rhombA } = vesicles(t);
  const cordA = 0.35 + 0.65 * seg(t, 0.1, 0.5);

  const prosR = lerp(20, 54, prosA);
  const mesR = lerp(17, 40, mesA);
  const rhombR = lerp(17, 46, rhombA);
  const prosY = D_TOP + 40;
  const mesY = prosY + prosR * 0.6 + mesR * 0.75;
  const rhombY = mesY + mesR * 0.6 + rhombR * 0.8;

  // Half-width of the tube along its length: three rounded swellings, then the tapering spinal cord.
  const bump = (y: number, c: number, rx: number, ry: number) => rx * Math.sqrt(Math.max(0, 1 - ((y - c) / ry) ** 2));
  const cord = (y: number) => {
    if (y < rhombY) return 0;
    const k = Math.min(1, (y - rhombY) / (D_BOTTOM - rhombY));
    return lerp(Math.max(12, rhombR * 0.5), 9, Math.pow(k, 0.6)) * cordA;
  };
  const yTop = prosY - prosR * 0.85;
  const hw = (y: number) => {
    let w = bump(y, prosY, prosR * 1.1, prosR * 0.85);
    w = smax(w, bump(y, mesY, mesR, mesR * 0.92));
    w = smax(w, bump(y, rhombY, rhombR * 1.05, rhombR));
    w = smax(w, cord(y));
    // Round both ends (the soft union never reaches 0 on its own).
    const cap = (d: number, r: number) => (d >= r ? 1 : Math.sqrt(Math.max(0, 1 - ((r - d) / r) ** 2)));
    return w * cap(y - yTop, 10) * cap(D_BOTTOM + 8 - y, 9);
  };
  const N = 140;
  // Denser towards both ends, so the rounded tips stay round.
  const ys = Array.from({ length: N + 1 }, (_, i) => lerp(yTop, D_BOTTOM + 8, (1 - Math.cos((Math.PI * i) / N)) / 2));
  const outline = (f: (y: number) => number) => smoothPath([...ys.map((y): Pt => [VX - f(y), y]), ...[...ys].reverse().slice(1, -1).map((y): Pt => [VX + f(y), y])], true, 0.5);
  const tube = outline(hw);
  // Ventricles and central canal: the lumen follows the swellings.
  const lumen = outline((y) => Math.max(0, hw(y) * 0.4 - 3));
  // Region boundaries at the necks (narrowest point between two centres).
  const neck = (a: number, b: number) => {
    let best = a;
    for (let y = a; y <= b; y += 0.5) if (hw(y) < hw(best)) best = y;
    return best;
  };
  const n1 = neck(prosY, mesY);
  const n2 = neck(mesY, rhombY);
  const n3 = rhombY + rhombR * 0.9;
  const regions: [string, number, number, number][] = [
    ['prosentzefaloa', yTop - 20, n1, prosA],
    ['mesentzefaloa', n1, n2, mesA],
    ['erronbentzefaloa', n2, n3, rhombA],
    ['ornomuina', n3, D_BOTTOM + 20, cordA],
  ];

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2a44b0" />
          <stop offset="0.38" stopColor={C.neural} />
          <stop offset="0.62" stopColor={C.neural} />
          <stop offset="1" stopColor="#2a44b0" />
        </linearGradient>
        {regions.map(([id, y0, y1]) => (
          <clipPath key={id} id={`${uid}-${id}`}>
            <rect x={VX - 200} y={y0} width={400} height={y1 - y0} />
          </clipPath>
        ))}
      </defs>
      {/* One unclipped copy underneath hides the hairlines where the regions' clips meet. */}
      <g opacity={0.45 + 0.55 * Math.min(prosA, mesA, rhombA, cordA)} pointerEvents="none">
        <path d={tube} fill={`url(#${uid}-g)`} />
        <path d={lumen} fill="#1b2f7a" opacity={0.45} />
      </g>
      {regions.map(([id, , , a]) => (
        <Part key={id} id={id} show={0.45 + 0.55 * a}>
          <g clipPath={`url(#${uid}-${id})`}>
            <path d={tube} fill={`url(#${uid}-g)`} />
            <path d={lumen} fill="#1b2f7a" opacity={0.45} />
          </g>
        </Part>
      ))}
      <path d={tube} fill="none" stroke="#1e3a8a" strokeWidth={1.4} pointerEvents="none" />
    </g>
  );
}

function dorsalLabels(t: number) {
  const { prosA, mesA, rhombA, prosL, mesL, rhombL } = vesicles(t);
  const prosY = D_TOP + 40;
  const mesY = prosY + lerp(20, 54, prosA) * 0.6 + lerp(17, 40, mesA) * 0.75;
  const rhombY = mesY + lerp(17, 40, mesA) * 0.6 + lerp(17, 46, rhombA) * 0.8;
  return (
    <>
      <Mark id="hodi-neurala" x={VX} y={(D_TOP + D_BOTTOM) / 2} rx={26} ry={(D_BOTTOM - D_TOP) / 2 + 12} color="#7ad9a3" show={1 - seg(t, 0.1, 0.14)} />
      <Label id="prosentzefaloa" x={190} y={170} ax={VX - 40} ay={prosY} show={prosL} />
      <Label id="mesentzefaloa" x={190} y={230} ax={VX - 24} ay={mesY} show={mesL} />
      <Label id="erronbentzefaloa" x={190} y={290} ax={VX - 30} ay={rhombY} show={rhombL} />
      <Label id="ornomuina" x={810} y={420} ax={VX + 14} ay={D_BOTTOM - 60} show={seg(t, 0.4, 0.46)} />
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
  const { prosA, mesA, rhombA } = vesicles(t);
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
  const body = smoothPath([...g.spine, ...[...g.inner].reverse().slice(1)], true, 0.5);
  const lobes = [g.hind, g.cran, g.face, g.heart].map((e, i) => (
    <ellipse key={i} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} transform={`rotate(${e[4]} ${e[0]} ${e[1]})`} />
  ));
  // One silhouette (body ∪ head, face and heart prominences): every outline first at double width,
  // then every fill on top, so only the union's outline shows instead of overlapping circles.
  return (
    <g pointerEvents="none">
      <g fill="none" stroke="#855043" strokeWidth={2.8}>
        <path d={body} />
        {lobes}
      </g>
      <g fill="#32231f">
        <path d={body} />
        {lobes}
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
  const { prosA, mesA, rhombA, prosL, mesL, rhombL } = vesicles(t);
  const b0 = G28.bars[0];
  const cord = spineAt(G28.S, 0.5, 10).p;
  return (
    <>
      <Label id="prosentzefaloa" x={190} y={250} ax={P_PROS[0]} ay={P_PROS[1]} show={prosL} />
      <Label id="mesentzefaloa" x={190} y={110} ax={P_MES[0]} ay={P_MES[1]} show={mesL} />
      <Label id="erronbentzefaloa" x={810} y={110} ax={P_RHOMB[0]} ay={P_RHOMB[1]} show={rhombL} />
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
