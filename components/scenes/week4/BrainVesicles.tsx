'use client';

import { useId } from 'react';
import { C, Label, Mark, Note, Part, lerp, lerpPt, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { G28 as G28_, spineAt } from './embryo28';

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
  // Ventricles and central canal (seen through the thin roof): wide in the vesicles, the rhomboid fossa of
  // the 4th ventricle in the rhombencephalon (thin roof plate: the diamond that names it), a narrow canal
  // in the spinal cord.
  const lumenW = (y: number) => {
    const base = hw(y) * (y < rhombY ? 0.55 : lerp(0.55, 0.26, Math.min(1, Math.max(0, (y - rhombY) / 60))));
    const dia = rhombR * 0.88 * Math.max(0, 1 - Math.abs(y - (rhombY + rhombR * 0.08)) / (rhombR * 0.98)) * rhombA;
    return Math.max(0, Math.max(base, dia) - 3);
  };
  const lumen = outline(lumenW);
  const fossa = outline((y) => rhombR * 0.8 * Math.max(0, 1 - Math.abs(y - (rhombY + rhombR * 0.08)) / (rhombR * 0.9)) * rhombA);
  const shadow = smoothPath([...ys.map((y): Pt => [VX - hw(y) + 5, y + 7]), ...[...ys].reverse().slice(1, -1).map((y): Pt => [VX + hw(y) + 5, y + 7])], true, 0.5);
  // context: somite pairs beside the spinal cord, on the embryo's back (dorsal view, amnion removed)
  const somY = Array.from({ length: 12 }, (_, i) => rhombY + rhombR * 1.1 + 14 + i * 21).filter((y) => y < D_BOTTOM - 6);
  // The body around the tube: the head folds a margin outside the vesicles, a trunk that narrows caudally.
  const bTop = yTop - 18;
  const bBot = D_BOTTOM + 24;
  const sm = (v: number) => {
    const k = Math.min(1, Math.max(0, v));
    return k * k * (3 - 2 * k);
  };
  const bodyHW = (y: number) => {
    // head folds: a margin round the vesicles (wider while they are still small); trunk fades in below them
    // parabolic dilation of the tube profile: one smooth head outline instead of a bump per vesicle
    let env = 0;
    for (let dy = -44; dy <= 44; dy += 4) env = Math.max(env, hw(y + dy) - (dy * dy) / 90);
    const head = y < rhombY + rhombR * 1.4 ? env + lerp(40, 20, Math.min(prosA, 1)) : 0;
    const f = (y - bTop) / (bBot - bTop);
    const trunk = lerp(76, 56, sm((f - 0.35) / 0.6)) * sm((y - prosY) / Math.max(1, rhombY - prosY));
    const cap = (d: number, r: number) => (d >= r ? 1 : Math.sqrt(Math.max(0, 1 - ((r - d) / r) ** 2)));
    return smax(head, trunk, 0.1) * cap(y - bTop, 30) * cap(bBot - y, 34);
  };
  const bys = Array.from({ length: 121 }, (_, i) => lerp(bTop, bBot, (1 - Math.cos((Math.PI * i) / 120)) / 2));
  // a few passes of a small moving average round off the neck where head folds meet the trunk
  let bw = bys.map(bodyHW);
  for (let pass = 0; pass < 3; pass++) bw = bw.map((w, i) => (i < 2 || i > bw.length - 3 ? w : (bw[i - 2] + bw[i - 1] + w + bw[i + 1] + bw[i + 2]) / 5));
  const bodyPath = smoothPath([...bys.map((y, i): Pt => [VX - bw[i], y]), ...bys.map((y, i): Pt => [VX + bw[i], y]).reverse().slice(1, -1)], true, 0.5);
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
      <defs>
        <radialGradient id={`${uid}-bd`} gradientUnits="userSpaceOnUse" cx={VX - 60} cy={D_TOP + 40} r={460}>
          <stop offset={0} stopColor="#4a342c" />
          <stop offset={0.55} stopColor="#33241f" />
          <stop offset={1} stopColor="#221714" />
        </radialGradient>
        <clipPath id={`${uid}-bc`}>
          <path d={bodyPath} />
        </clipPath>
      </defs>
      {/* the embryo's back: calm sculpted body (light from the upper left), dark rim + light rim */}
      <g pointerEvents="none">
        <path d={bodyPath} fill="none" stroke="#7a4a3d" strokeWidth={2.6} />
        <g clipPath={`url(#${uid}-bc)`}>
          <path d={bodyPath} fill="#7a5547" />
          <path d={bodyPath} fill={`url(#${uid}-bd)`} transform="translate(2.4 2.8)" />
          {/* somites: low beads either side of the cord, lit on their upper-left edge */}
          {somY.map((y, i) =>
            [-1, 1].map((sd) => (
              <g key={`${i}${sd}`} transform={`translate(${VX + sd * 37} ${y})`}>
                <ellipse rx={10.5} ry={8.6} fill="#1c120f" opacity={0.4} transform="translate(1.2 1.4)" />
                <ellipse rx={10.5} ry={8.6} fill="#4a332b" />
                <ellipse rx={5} ry={3.6} cx={-2.6} cy={-2.4} fill="#6a4a3e" opacity={0.6} />
              </g>
            )),
          )}
        </g>
      </g>
      <path d={shadow} fill="#000" opacity={0.35} pointerEvents="none" />
      {/* One unclipped copy underneath hides the hairlines where the regions' clips meet. */}
      <g opacity={0.45 + 0.55 * Math.min(prosA, mesA, rhombA, cordA)} pointerEvents="none">
        <path d={tube} fill={`url(#${uid}-g)`} />
        <path d={lumen} fill="#14245e" opacity={0.6} />
      </g>
      {regions.map(([id, , , a]) => (
        <Part key={id} id={id} show={0.45 + 0.55 * a}>
          <g clipPath={`url(#${uid}-${id})`}>
            <path d={tube} fill={`url(#${uid}-g)`} />
            <path d={lumen} fill="#14245e" opacity={0.6} />
            {id === 'erronbentzefaloa' && <path d={fossa} fill="#9db8ff" opacity={0.22} stroke="#b9ccff" strokeOpacity={0.5} strokeWidth={1} />}
          </g>
        </Part>
      ))}
      <path d={tube} fill="none" stroke="#1e3a8a" strokeWidth={1.4} pointerEvents="none" />
      {/* soft highlight down the dorsal surface (light from upper left) */}
      <path d={outline((y) => hw(y) * 0.16)} transform={`translate(${-0.0} 0)`} fill="#dfe8ff" opacity={0.13} pointerEvents="none" />
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
      <Note x={500} y={606} tone="dim" show={seg(t, 0.58, 0.62) * (1 - seg(t, 0.73, 0.75))}>
        Aurrerago, kurtsoan: prosentzefaloak telentzefaloa eta dientzefaloa emango ditu
      </Note>
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

export const G28 = G28_;
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
    const n = Math.max(2, Math.ceil(Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]) / 1.6));
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

/**
 * The day-28 embryo as a calm sculpted body (light from the upper left): one silhouette with a soft
 * gradient, a dark rim and a light rim on the lit edges, a heart bulge, pharyngeal arches in relief
 * with clefts between them, and a row of somite beads along the back. Kept low in contrast so the
 * neural tube drawn over it stays the subject.
 */
function Embryo28Body() {
  const uid = useId().replace(/:/g, '');
  const g = G28;
  const body = smoothPath([...g.spine, ...[...g.inner].reverse().slice(1)], true, 0.5);
  const lobe = (e: readonly number[], k: string | number) => (
    <ellipse key={k} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} transform={`rotate(${e[4]} ${e[0]} ${e[1]})`} />
  );
  const lobes = [g.hind, g.cran, g.face, g.heart];
  const silhouette = (
    <>
      <path d={body} />
      {lobes.map((e, i) => lobe(e, i))}
    </>
  );
  const [hx, hy, hrx, hry, hrot] = g.heart;
  // pharyngeal arches: rounded bars (dorsal → ventral), clefts between neighbours
  const bar = (a: Pt, b: Pt, w: number) => {
    const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const q = th - Math.PI / 2 + (Math.PI * i) / 8;
      pts.push([b[0] + Math.cos(q) * w, b[1] + Math.sin(q) * w]);
    }
    for (let i = 0; i <= 8; i++) {
      const q = th + Math.PI / 2 + (Math.PI * i) / 8;
      pts.push([a[0] + Math.cos(q) * w, a[1] + Math.sin(q) * w]);
    }
    return smoothPath(pts, true, 0.4);
  };
  const clefts = g.bars.slice(0, -1).map((b, i) => {
    const n = g.bars[i + 1];
    const top = lerpPt(b.top, n.top, 0.5);
    const bot = lerpPt(b.bot, n.bot, 0.5);
    return { top, bot };
  });
  // somite beads along the back, ventral to the spinal cord (which is drawn over the body)
  const somites = Array.from({ length: 26 }, (_, i) => {
    const u = 0.07 + (0.8 * i) / 25;
    const s = spineAt(g.S, u, lerp(44, 22, u));
    return { p: s.p, ang: (Math.atan2(s.t[1], s.t[0]) * 180) / Math.PI, r: lerp(8, 4.2, u) };
  });
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={`${uid}-b`} gradientUnits="userSpaceOnUse" x1={380} y1={70} x2={780} y2={600}>
          <stop offset={0} stopColor="#4a342c" />
          <stop offset={0.55} stopColor="#33241f" />
          <stop offset={1} stopColor="#221714" />
        </linearGradient>
        <radialGradient id={`${uid}-l`} gradientUnits="userSpaceOnUse" cx={470} cy={150} r={330}>
          <stop offset={0} stopColor="#ffe2cf" stopOpacity={0.09} />
          <stop offset={1} stopColor="#ffe2cf" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-h`} cx={0.38} cy={0.34} r={0.75}>
          <stop offset={0} stopColor="#6b3a33" />
          <stop offset={0.6} stopColor="#43261f" />
          <stop offset={1} stopColor="#2a1915" />
        </radialGradient>
        <linearGradient id={`${uid}-a`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor="#5e3f35" />
          <stop offset={1} stopColor="#3a2620" />
        </linearGradient>
        <clipPath id={`${uid}-c`}>{silhouette}</clipPath>
      </defs>
      {/* dark rim: every outline at double width first, then the fills, so only the union's edge shows */}
      <g fill="none" stroke="#7a4a3d" strokeWidth={2.6}>
        {silhouette}
      </g>
      <g clipPath={`url(#${uid}-c)`}>
        {/* light rim on the lit (upper-left) edges: a pale copy, the body fill offset down-right over it */}
        <g fill="#7a5547">{silhouette}</g>
        <g fill={`url(#${uid}-b)`} transform="translate(2.2 2.6)">
          {silhouette}
        </g>
        {/* heart prominence: a rounded bulge with its own light and a soft shadow below-right */}
        <ellipse cx={hx + 5} cy={hy + 6} rx={hrx} ry={hry} transform={`rotate(${hrot} ${hx + 5} ${hy + 6})`} fill="#140c0a" opacity={0.35} />
        <ellipse cx={hx} cy={hy} rx={hrx * 0.97} ry={hry * 0.97} transform={`rotate(${hrot} ${hx} ${hy})`} fill={`url(#${uid}-h)`} />
        {/* somites: low beads with a lit upper edge */}
        {somites.map((q, i) => (
          <g key={i} transform={`translate(${q.p[0].toFixed(1)} ${q.p[1].toFixed(1)}) rotate(${q.ang.toFixed(1)})`}>
            <ellipse rx={q.r} ry={q.r * 1.12} fill="#1c120f" opacity={0.35} transform="translate(1 1.2)" />
            <ellipse rx={q.r} ry={q.r * 1.12} fill="#4a332b" />
            <ellipse rx={q.r * 0.4} ry={q.r * 0.5} cx={-q.r * 0.18} cy={-q.r * 0.25} fill="#6a4a3e" opacity={0.6} />
          </g>
        ))}
        {/* pharyngeal arches in relief, clefts between them */}
        {clefts.map((c, i) => (
          <line key={`c${i}`} x1={c.top[0]} y1={c.top[1]} x2={c.bot[0]} y2={c.bot[1]} stroke="#160d0b" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
        ))}
        {g.bars.map((b, i) => (
          <g key={i}>
            <path d={bar(b.top, b.bot, b.w * 0.36)} fill="#150d0b" opacity={0.35} transform="translate(1.6 1.8)" />
            <path d={bar(b.top, b.bot, b.w * 0.36)} fill={`url(#${uid}-a)`} />
            <path d={bar([b.top[0] - b.w * 0.12, b.top[1] + 3], [b.bot[0] - b.w * 0.12, b.bot[1] - 3], b.w * 0.1)} fill="#d98a72" opacity={0.18} />
          </g>
        ))}
        {/* soft light pool from the upper left over the head and back */}
        <rect x={0} y={0} width={1000} height={640} fill={`url(#${uid}-l)`} />
      </g>
    </g>
  );
}

function LateralDrawing({ t }: SceneProps) {
  const g = G28;
  const nodes = tubeNodes(t);
  const parts = ['ornomuina', 'erronbentzefaloa', 'mesentzefaloa', 'prosentzefaloa'] as const;
  const b0 = g.bars[0];
  // Ventricles (wide in the vesicles) and the narrow central canal of the cord, seen through the wall.
  const lumenR = (n: Node) => Math.max(1.4, n.r * (n.part === 'ornomuina' ? 0.3 : 0.56) - 1.5);
  // Each layer is a union of discs drawn opaque inside a group, so overlaps never stack up.
  return (
    <g>
      <Embryo28Body />
      <g fill="#14286b" pointerEvents="none">
        {nodes.map((n, i) => (
          <circle key={i} cx={n.p[0]} cy={n.p[1]} r={n.r + 2.2} />
        ))}
      </g>
      {parts.map((id) => (
        <Part key={id} id={id}>
          <g fill={C.neural}>
            {nodes
              .filter((n) => n.part === id)
              .map((n, i) => (
                <circle key={i} cx={n.p[0]} cy={n.p[1]} r={n.r} />
              ))}
          </g>
        </Part>
      ))}
      {/* the ventricular system is one continuous cavity: lumens after all the walls */}
      {parts.map((id) => (
        <Part key={`l-${id}`} id={id}>
          <g fill="#14245e" opacity={0.72}>
            {nodes
              .filter((n) => n.part === id)
              .map((n, i) => (
                <circle key={i} cx={n.p[0]} cy={n.p[1]} r={lumenR(n)} />
              ))}
          </g>
        </Part>
      ))}
      {/* light from the upper left: a soft sheen along the dorsal side of the wall */}
      <g fill="#dbe6ff" opacity={0.16} pointerEvents="none">
        {nodes.map((n, i) => (
          <circle key={i} cx={n.p[0] - n.r * 0.38} cy={n.p[1] - n.r * 0.42} r={n.r * 0.3} />
        ))}
      </g>
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
      <Note x={500} y={606} tone="dim" show={seg(t, 0.58, 0.62) * (1 - seg(t, 0.73, 0.75))}>
        Hodia tolestuta: flexura zefalikoa (mesentzefaloan) eta zerbikala (erronbentzefaloa → ornomuina)
      </Note>
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
