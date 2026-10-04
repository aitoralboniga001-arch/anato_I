'use client';

import type { ReactNode } from 'react';
import { C, Part, clamp, lerp, rand, seg, smoothPath, type Pt } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';

/**
 * Whole-conceptus transverse section of days 17–20 (Langman fig. 6-9 A–C): the flat trilaminar disc
 * with the amnion dome over it and the yolk sac under it, the chorionic cavity around both.
 *
 * The section is built from two continuous "spines": the TOP spine runs along the dorsal surface
 * of the disc, turns up at the disc edge and goes round the amnion; the BOTTOM spine runs under the
 * endoderm, turns down at the edge and goes round the yolk sac. Every sheet is an offset band of
 * one spine, so the topology of the real embryo holds by construction:
 *  - ectoderm → amnioblasts (offset 0..te of the top spine);
 *  - parietal (somatic) layer of the lateral plate → extra-embryonic somatic coat of the amnion
 *    (offset te..te+tp of the top spine);
 *  - endoderm → yolk-sac endoderm, splanchnic layer → yolk-sac coat (bottom spine).
 * The intra-embryonic coelom opens between the two lateral-plate layers and, at the disc edge, runs
 * straight into the chorionic cavity (extra-embryonic coelom) — the same dark space, as the notes say.
 */

export const CX = 500;
export const W = 240; // half-width of the disc
export const Y0 = 248; // dorsal surface of the flat disc
const TE = 12; // surface ectoderm
const TN = 27; // neural plate (pseudostratified)
const TEN = 11; // endoderm
const TA = 6; // amnioblasts
const TYE = 8; // yolk-sac endoderm
const TC = 8; // extra-embryonic mesoderm coat
const TP = 15; // parietal / visceral layer
const M0 = 56; // thin intra-embryonic mesoderm sheet
const MP = 96; // paraxial block
const RN = 15; // notochord
const RT = 26; // corner radius where the disc turns into the amnion
const RB = 30; // … and into the yolk sac
const HD = 148; // amnion height over the disc
const HY = 196; // yolk-sac depth under the disc
export const U_PAR: [number, number] = [19, 100];
export const U_INT: [number, number] = [100, 126];
const U_RIB = 136; // where the lateral plate's two layers (and the coelom) begin

const ss = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
const f1 = (v: number) => Math.round(v * 10) / 10;
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));

/** Beats of `mesodermoa-banatzen` (week4b.ts): 0 · .1 · .24 · .38 · .5 · .62 · .74 · .86. */
export function mesoTiming(t: number) {
  return {
    par: seg(t, 0.1, 0.2),
    lat: seg(t, 0.24, 0.32),
    ves: seg(t, 0.38, 0.47),
    coel: seg(t, 0.5, 0.59),
    somato: seg(t, 0.62, 0.68),
    splanchno: seg(t, 0.74, 0.8),
    inter: seg(t, 0.86, 0.93),
    groove: 0.85 * seg(t, 0.3, 1),
    t,
  };
}
export type MesoT = ReturnType<typeof mesoTiming>;

/** Vacuoles of the lateral plate: position (u), when they start (from the edge inwards). */
const VAC = [
  { u: 150, d: 0.05 },
  { u: 168, d: 0.035 },
  { u: 185, d: 0.022 },
  { u: 201, d: 0.03 },
  { u: 214, d: 0.012 },
  { u: 226, d: 0 },
];

export function conceptusGeometry(m: MesoT) {
  const { par, ves, coel, groove } = m;
  /** Mesoderm thickness: the paraxial strip thickens (proliferation); the lateral plate stays a thin sheet. */
  const M = (u: number) => M0 + (MP - M0) * par * (1 - ss((u - 88) / 40));
  const lift = (u: number) => 0.45 * (M(u) - M0);
  const yBase = (u: number) => Y0 - lift(u);
  const dip = (u: number) => groove * 12 * Math.max(0, 1 - (u / 50) ** 2) ** 1.6;
  const te = (u: number) => lerp(TN, TE, ss((u - 56) / 18));
  const yTop = (u: number) => yBase(u) + dip(u);
  const ectoBot = (u: number) => yTop(u) + te(u);
  const endoTop = (u: number) => yBase(u) + TE + M(u);
  const endoBot = (u: number) => endoTop(u) + TEN;
  const rib = (u: number) => ss((u - (U_RIB - 10)) / 10);
  /** Middle zone of the lateral plate (between its two layers). */
  const zTop = (u: number) => ectoBot(u) + TP * rib(u);
  const zBot = (u: number) => endoTop(u) - TP * rib(u);
  const noto: Pt = [CX, ectoBot(0) + RN + 1.5];

  /** Fraction (0..1) of the middle zone's height that is cavity at u. */
  const cav = (u: number) => {
    let acc = 0;
    VAC.forEach((v) => {
      const a = clamp((ves - v.d * 4) / (1 - v.d * 4));
      if (a <= 0 && coel <= 0) return;
      const r = 3 + 7 * a + 14 * coel;
      const h = lerp(0.72, 1, coel) * Math.min(1, a * 1.4 + coel);
      const q = 1 - ((u - v.u) / r) ** 2;
      if (q > 0) acc += (h * Math.sqrt(q)) ** 4;
    });
    const slit = coel * ss((u - (U_RIB - 2)) / 10);
    acc += slit ** 4;
    return Math.min(1, acc ** 0.25);
  };

  // ---- spines (right half; the left half is mirrored)
  type SP = { p: Pt; n: Pt; a: number; b: number };
  /** Top spine: a = ectoderm/amnioblast thickness, b = parietal/coat thickness. `dome` index = first amnion sample. */
  const top: SP[] = [];
  range(0, W, 48).forEach((u) => top.push({ p: [CX + u, yTop(u)], n: [0, 1], a: te(u), b: TP }));
  const topArc0 = top.length;
  range(Math.PI / 2, 0, 9)
    .slice(1)
    .forEach((th, i, arr) => {
      const k = (i + 1) / arr.length;
      top.push({ p: [CX + W + RT * Math.cos(th), Y0 - RT + RT * Math.sin(th)], n: [Math.cos(th), Math.sin(th)], a: lerp(TE, TA, k), b: lerp(TP, TC, k) });
    });
  const rxD = W + RT;
  const ryD = HD - RT;
  range(0, -Math.PI / 2, 30)
    .slice(1)
    .forEach((th) => {
      const nx = Math.cos(th) / rxD;
      const ny = Math.sin(th) / ryD;
      const l = Math.hypot(nx, ny);
      top.push({ p: [CX + rxD * Math.cos(th), Y0 - RT + ryD * Math.sin(th)], n: [nx / l, ny / l], a: TA, b: TC });
    });
  // Bottom spine: a = endoderm thickness, b = visceral layer / yolk coat.
  const bot: SP[] = [];
  range(0, W, 48).forEach((u) => bot.push({ p: [CX + u, endoBot(u)], n: [0, -1], a: TEN, b: TP }));
  const botArc0 = bot.length;
  const Ybe = endoBot(W);
  range(-Math.PI / 2, 0, 9)
    .slice(1)
    .forEach((th, i, arr) => {
      const k = (i + 1) / arr.length;
      bot.push({ p: [CX + W + RB * Math.cos(th), Ybe + RB + RB * Math.sin(th)], n: [Math.cos(th), Math.sin(th)], a: lerp(TEN, TYE, k), b: lerp(TP, TC, k) });
    });
  const rxY = W + RB;
  const ryY = HY - RB;
  range(0, Math.PI / 2, 30)
    .slice(1)
    .forEach((th) => {
      const nx = Math.cos(th) / rxY;
      const ny = Math.sin(th) / ryY;
      const l = Math.hypot(nx, ny);
      bot.push({ p: [CX + rxY * Math.cos(th), Ybe + RB + ryY * Math.sin(th)], n: [nx / l, ny / l], a: TYE, b: TC });
    });

  /** Offset of a spine sample: d along its normal (towards the mesoderm on the disc, outward on the sacs). */
  const off = (s: SP, d: number, side: 1 | -1): Pt => {
    const x = s.p[0] + s.n[0] * d;
    return [side > 0 ? x : 2 * CX - x, s.p[1] + s.n[1] * d];
  };

  return { M, yTop, ectoBot, endoTop, endoBot, zTop, zBot, rib, cav, noto, top, bot, topArc0, botArc0, off, te, Ybe };
}
export type Conceptus = ReturnType<typeof conceptusGeometry>;

/** Closed region over u ∈ [u0, u1] between two profiles, on one side. */
function region(u0: number, u1: number, topF: (u: number) => number, botF: (u: number) => number, side: 1 | -1, n = 24): Pt[] {
  const us = range(u0, u1, n);
  return [...us.map((u): Pt => [CX + side * u, topF(u)]), ...us.reverse().map((u): Pt => [CX + side * u, botF(u)])];
}
const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

/** Cavity islands of the coelom on one side (each a closed polygon). */
function cavityPolys(g: Conceptus, side: 1 | -1): Pt[][] {
  const out: Pt[][] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length > 1) {
      const topPts = run.map((u): Pt => {
        const mid = (g.zTop(u) + g.zBot(u)) / 2;
        const h = (g.zBot(u) - g.zTop(u)) * g.cav(u) * 0.5;
        return [CX + side * u, mid - h];
      });
      const botPts = run
        .slice()
        .reverse()
        .map((u): Pt => {
          const mid = (g.zTop(u) + g.zBot(u)) / 2;
          const h = (g.zBot(u) - g.zTop(u)) * g.cav(u) * 0.5;
          return [CX + side * u, mid + h];
        });
      out.push([...topPts, ...botPts]);
    }
    run = [];
  };
  for (let u = U_RIB - 14; u <= W + 0.01; u += 1.5) {
    if (g.cav(u) > 0.02) run.push(Math.min(u, W));
    else flush();
  }
  flush();
  return out;
}

/** Stellate mesenchymal cells over a region (deterministic jittered grid). */
function mesenchyme(inside: (x: number, y: number) => boolean, x0: number, x1: number, y0: number, y1: number, step: number, seed: number, color: string, show = 1, r = 1.9): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  for (let y = y0; y <= y1; y += step * 0.82)
    for (let x = x0; x <= x1; x += step) {
      i++;
      const jx = x + (rand(seed + i * 2.3) - 0.5) * step * 0.9;
      const jy = y + (rand(seed + i * 5.9) - 0.5) * step * 0.6;
      if (!inside(jx, jy)) continue;
      const appear = clamp(show * 1.6 - rand(seed + i * 7.7) * 0.6);
      if (appear <= 0.02) continue;
      const a = f1(rand(seed + i * 9.1) * 180);
      out.push(
        <g key={`${seed}-${i}`} transform={`translate(${f1(jx)} ${f1(jy)}) rotate(${a})`} opacity={f1(appear)}>
          <path d={`M${f1(-r * 2.7)},0L${f1(r * 2.7)},0M0,${f1(-r * 1.8)}L0,${f1(r * 1.8)}`} stroke={color} strokeWidth={0.7} opacity={0.5} />
          <ellipse rx={f1(r * 1.3)} ry={f1(r)} fill={color} />
        </g>,
      );
    }
  return out;
}

const COL = {
  coelom: '#1b0d22',
  coelomRim: 'rgba(255,170,170,0.28)',
  parietal: '#f37f7f',
  visceral: '#d9566a',
  ecm: '#55202b',
};

/** Paraxial cells caught dividing during the proliferation step (two daughter nuclei pulling apart). */
const MITOSES = [
  { u: 34, y: 0.35, d: 0 },
  { u: 72, y: 0.62, d: 0.012 },
  { u: 52, y: 0.22, d: 0.024 },
  { u: 88, y: 0.4, d: 0.036 },
  { u: 26, y: 0.7, d: 0.048 },
  { u: 62, y: 0.82, d: 0.06 },
];

export interface ConceptusIds {
  sheet: string;
  lateral: string;
  amnionCoat: string;
  yolkCoat: string;
}

export function idsAt(t: number): ConceptusIds {
  const sheet = t < 0.24 ? 'mesodermo-intraenbrionarioa' : 'alboko-mesodermoa';
  return {
    sheet: t < 0.1 ? 'mesodermo-intraenbrionarioa' : 'mesodermo-paraxiala',
    lateral: sheet,
    amnionCoat: t < 0.5 ? 'enbrioi-kanpoko-mesodermoa' : 'somatopleura-kanpokoa',
    yolkCoat: t < 0.5 ? 'enbrioi-kanpoko-mesodermoa' : 'esplaknopleura-kanpokoa',
  };
}

/**
 * The drawing. `lite` drops the mesenchyme and the per-cell outlines (for small insets).
 */
export function ConceptusSection({ m, lite = false }: { m: MesoT; lite?: boolean }) {
  const g = conceptusGeometry(m);
  const ids = idsAt(m.t);
  const { par, lat, coel, inter } = m;
  const sides = [1, -1] as const;
  const latFill = lat > 0.99 ? C.mesoLateral : undefined;
  const uLat0 = inter > 0.001 ? U_INT[1] : U_PAR[1];

  // Spine bands as matched point lists.
  const band = (list: typeof g.top, i0: number, i1: number, d0: (s: (typeof g.top)[number]) => number, d1: (s: (typeof g.top)[number]) => number, side: 1 | -1) => {
    const sl = list.slice(i0, i1 + 1);
    return { outer: sl.map((s) => g.off(s, d0(s), side)), inner: sl.map((s) => g.off(s, d1(s), side)) };
  };
  const nT = g.top.length - 1;
  const nB = g.bot.length - 1;
  const iRib = Math.round(((U_RIB - 10) / W) * 48);

  // Outer contour of the whole conceptus (amnion coat · disc edge · yolk coat), both sides.
  const outerRight: Pt[] = [
    ...g.top
      .slice(g.topArc0 - 1)
      .reverse()
      .map((s) => g.off(s, s.a + s.b, 1)),
    ...g.bot.slice(g.botArc0 - 1).map((s) => g.off(s, s.a + s.b, 1)),
  ];
  const outerLeft = outerRight.map((q): Pt => [2 * CX - q[0], q[1]]).reverse();
  const outer = [...outerRight, ...outerLeft];

  // Cavities.
  const amnionCav = [...g.top.map((s) => g.off(s, 0, 1)), ...g.top.map((s) => g.off(s, 0, -1)).reverse()];
  const yolkCav = [...g.bot.map((s) => g.off(s, 0, 1)), ...g.bot.map((s) => g.off(s, 0, -1)).reverse()];

  const cavR = coel > 0 || m.ves > 0 ? cavityPolys(g, 1) : [];
  const cavL = cavR.map((pl) => pl.map((q): Pt => [2 * CX - q[0], q[1]]));
  const cavD = [...cavR, ...cavL].map((pl) => smoothPath(pl, true, 0.3)).join('');
  const latD = (sd: 1 | -1) => poly(latPts(sd)) + (sd > 0 ? cavR : cavL).map((pl) => smoothPath(pl, true, 0.3)).join('');

  // Mesoderm regions (one side each; mirrored).
  const parPts = (sd: 1 | -1) => region(U_PAR[0] - 2 * (1 - par), U_PAR[1] + 1.5, (u) => g.ectoBot(u) + par, (u) => g.endoTop(u) - par, sd, 14);
  const intPts = (sd: 1 | -1) => region(U_INT[0], U_INT[1], g.ectoBot, g.endoTop, sd, 8);
  const latPts = (sd: 1 | -1) => region(uLat0 - 1, W, (u) => g.zTop(u), (u) => g.zBot(u), sd, 40);
  const ribTop = (sd: 1 | -1) => band(g.top, iRib, g.topArc0 - 1, (s) => s.a, (s) => s.a + s.b * g.rib(s.p[0] - CX), sd);
  const ribBot = (sd: 1 | -1) => band(g.bot, iRib, g.botArc0 - 1, (s) => s.a, (s) => s.a + s.b * g.rib(s.p[0] - CX), sd);
  const bandPoly = (b: { outer: Pt[]; inner: Pt[] }) => poly([...b.outer, ...b.inner.slice().reverse()]);

  const inLat = (x: number, y: number) => {
    const u = Math.abs(x - CX);
    if (u < uLat0 || u > W - 2) return false;
    const top = coel > 0.4 ? g.zTop(u) : g.ectoBot(u);
    const bot = coel > 0.4 ? g.zBot(u) : g.endoTop(u);
    if (y < top + 2 || y > bot - 2) return false;
    const c = g.cav(u);
    if (c > 0.02) {
      const mid = (g.zTop(u) + g.zBot(u)) / 2;
      const h = (g.zBot(u) - g.zTop(u)) * c * 0.5;
      if (Math.abs(y - mid) < h + 2.5) return false;
    }
    return true;
  };
  const inPar = (x: number, y: number) => {
    const u = Math.abs(x - CX);
    return u > U_PAR[0] + 2 && u < U_PAR[1] && y > g.ectoBot(u) + 2 && y < g.endoTop(u) - 2;
  };
  const inInt = (x: number, y: number) => {
    const u = Math.abs(x - CX);
    return u >= U_INT[0] && u < U_INT[1] && y > g.ectoBot(u) + 2 && y < g.endoTop(u) - 2;
  };

  const parColorOp = par;
  const yMesTop = Y0 - 20;
  const yMesBot = Y0 + 100;
  const parContent = (
    <>
        {sides.map((sd) => (
          <g key={sd}>
            <path d={smoothPath(parPts(sd), true, 0.32 * par)} fill={C.mesoIntra} />
            <path d={smoothPath(parPts(sd), true, 0.32 * par)} fill={C.mesoParaxial} opacity={parColorOp} />
            <path d={smoothPath(parPts(sd), true, 0.32 * par)} fill="url(#g-shade)" opacity={0.4 * par} />
          </g>
        ))}
        {!lite && mesenchyme(inPar, CX - U_PAR[1], CX + U_PAR[1], yMesTop, yMesBot, 13, 3, 'rgba(96,8,22,0.78)')}
        {!lite && par > 0.02 && mesenchyme(inPar, CX - U_PAR[1] + 4, CX + U_PAR[1], yMesTop + 5, yMesBot, 11, 29, 'rgba(96,8,22,0.78)', par)}
        {!lite &&
          MITOSES.flatMap((mi, j) =>
            sides.map((sd) => {
              const k = seg(m.t, 0.105 + mi.d, 0.17 + mi.d);
              if (k <= 0.01 || k >= 0.99) return null;
              const u = mi.u + (sd < 0 ? 7 : 0);
              const x = CX + sd * u;
              const y = lerp(g.ectoBot(u) + 6, g.endoTop(u) - 6, mi.y);
              const apart = 6.5 * ss((k - 0.25) / 0.6);
              const ang = 30 + 70 * rand(j * 3.1 + sd);
              return (
                <g key={`mi${j}${sd}`} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})`} opacity={f1(Math.min(1, 4 * k, 4 * (1 - k)))}>
                  <ellipse rx={f1(4.6 + apart * 0.6)} ry={3.6} fill="#ff9c9c" opacity={0.35} />
                  <ellipse cx={f1(-apart / 2)} rx={2.4} ry={1.9} fill="#5a0612" />
                  <ellipse cx={f1(apart / 2)} rx={2.4} ry={1.9} fill="#5a0612" />
                </g>
              );
            }),
          )}
          </>
  );

  return (
    <g>
      {/* Chorionic cavity (extra-embryonic coelom): the space round the amnion and the yolk sac. */}
      <Part id="korion-barrunbea" quiet>
        <path d={`M${CX - 470},${Y0 - 250}H${CX + 470}V${Y0 + 360}H${CX - 470}Z${poly(outer)}`} fillRule="evenodd" fill="url(#w4b-chorion)" />
      </Part>
      <defs>
        <radialGradient id="w4b-chorion" cx="50%" cy="48%" r="58%">
          <stop offset="0.55" stopColor={COL.coelom} />
          <stop offset="1" stopColor={COL.coelom} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="w4b-yolk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3115" />
          <stop offset="1" stopColor="#1d180a" />
        </linearGradient>
      </defs>

      {/* Amniotic cavity and yolk-sac cavity. */}
      <Part id="amnios-barrunbea" quiet>
        <path d={smoothPath(amnionCav, true, 0.15)} fill="rgba(120,170,255,0.12)" />
      </Part>
      <Part id="bitelo-zaku-sekundarioa" quiet>
        <path d={smoothPath(yolkCav, true, 0.15)} fill="url(#w4b-yolk)" />
        <path d={smoothPath(yolkCav, true, 0.15)} fill="url(#g-cavity)" />
        {sides.map((sd) => {
          const b = band(g.bot, g.botArc0 - 1, nB, () => 0, (s) => s.a, sd);
          return <Cells key={sd} outer={b.outer} inner={b.inner} n={lite ? 8 : 34} fill={C.endoderm} nk={0.5} seed={sd > 0 ? 111 : 113} opacity={lite ? 0.9 : 1} />;
        })}
      </Part>

      {/* Extra-embryonic mesoderm: the coat of the amnion and the coat of the yolk sac. */}
      <Part id={ids.amnionCoat}>
        {sides.map((sd) => {
          const b = band(g.top, g.topArc0 - 1, nT, (s) => s.a, (s) => s.a + s.b, sd);
          return <Cells key={sd} outer={b.outer} inner={b.inner} n={lite ? 8 : 30} fill={C.mesoExtra} nucleus="rgba(140,62,40,0.6)" edge="rgba(140,62,40,0.28)" seed={sd > 0 ? 121 : 123} />;
        })}
      </Part>
      <Part id={ids.yolkCoat}>
        {sides.map((sd) => {
          const b = band(g.bot, g.botArc0 - 1, nB, (s) => s.a, (s) => s.a + s.b, sd);
          return <Cells key={sd} outer={b.outer} inner={b.inner} n={lite ? 8 : 34} fill={C.mesoExtra} nucleus="rgba(140,62,40,0.6)" edge="rgba(140,62,40,0.28)" seed={sd > 0 ? 131 : 133} />;
        })}
      </Part>

      {/* Midline extracellular matrix round the notochord (no mesoderm there). */}
      <path d={poly(region(0, W, g.ectoBot, g.endoTop, 1, 40)) + poly(region(0, W, g.ectoBot, g.endoTop, -1, 40))} fill={COL.ecm} />

      {/* Lateral plate (single sheet, then the middle zone between its two layers) with the coelom cut out. */}
      <Part id={ids.lateral}>
        {sides.map((sd) => (
          <g key={sd}>
            <path d={latD(sd)} fillRule="evenodd" fill={C.mesoIntra} />
            {latFill ? null : <path d={latD(sd)} fillRule="evenodd" fill={C.mesoLateral} opacity={lat} />}
            {latFill && <path d={latD(sd)} fillRule="evenodd" fill={latFill} />}
            {coel < 0.5 &&
              [ribTop(sd), ribBot(sd)].map((b, i) => (
                <g key={i}>
                  <path d={bandPoly(b)} fill={C.mesoIntra} />
                  <path d={bandPoly(b)} fill={C.mesoLateral} opacity={lat} />
                </g>
              ))}
          </g>
        ))}
        {!lite && mesenchyme(inLat, CX - W, CX + W, yMesTop, yMesBot, 13, 7, 'rgba(110,14,30,0.72)')}
        {ids.sheet === ids.lateral && parContent}
      </Part>

      {/* Intra-embryonic coelom: vacuoles first, then one cavity opening at the disc edge into the chorionic cavity. */}
      {cavD && (
        <Part id="enbrioi-barruko-zeloma">
          <path d={cavD} fill={COL.coelom} />
          <path d={cavD} fill="none" stroke={COL.coelomRim} strokeWidth={0.9} />
        </Part>
      )}

      {/* The two layers of the lateral plate, once the coelom separates them: epithelial linings. */}
      {coel > 0.02 &&
        (
          [
            ['paretako-orria', ribTop, COL.parietal, 'rgba(110,14,26,0.7)', 141],
            ['errai-orria', ribBot, COL.visceral, 'rgba(80,8,20,0.75)', 151],
          ] as const
        ).map(([id, bf, fill, nuc, seed]) => (
          <Part key={id} id={coel < 0.5 ? ids.lateral : id}>
            {sides.map((sd) => {
              const b = bf(sd);
              return (
                <g key={sd}>
                  <path d={bandPoly(b)} fill={C.mesoLateral} opacity={1 - coel} />
                  <Cells outer={b.outer} inner={b.inner} n={lite ? 5 : 15} fill={fill} nucleus={nuc} edge="rgba(90,10,24,0.32)" seed={seed + sd} opacity={coel} />
                </g>
              );
            })}
          </Part>
        ))}

      {/* Intermediate mesoderm: the strip between paraxial and lateral condenses later (step 8). */}
      {inter > 0.001 && (
        <Part id="bitarteko-mesodermoa" show={inter}>
          {sides.map((sd) => (
            <path key={sd} d={poly(intPts(sd))} fill={C.mesoIntermediate} />
          ))}
          {!lite && mesenchyme(inInt, CX - U_INT[1], CX + U_INT[1], yMesTop, yMesBot, 8.5, 17, 'rgba(120,30,16,0.75)')}
        </Part>
      )}

      {/* Paraxial mesoderm: the strip beside the notochord thickens and fills with dividing cells. */}
      {ids.sheet !== ids.lateral && <Part id={ids.sheet}>{parContent}</Part>}

      {/* Notochord: rod of vacuolated cells in the midline, between the neural plate and the endoderm. */}
      <Part id="notokorda">
        {(() => {
          const [x, y] = g.noto;
          return (
            <g>
              <circle cx={x} cy={y} r={RN} fill={C.notochord} stroke="#5b21b6" strokeWidth={1} />
              {[0, 1, 2, 3, 4, 5].map((j) => {
                const a = (j / 6) * Math.PI * 2;
                return <circle key={j} cx={f1(x + Math.cos(a) * RN * 0.55)} cy={f1(y + Math.sin(a) * RN * 0.55)} r={RN * 0.22} fill="#4c1d95" opacity={0.7} />;
              })}
              <circle cx={x - 3} cy={y - 3} r={RN * 0.35} fill="#e9d5ff" opacity={0.35} />
            </g>
          );
        })()}
      </Part>

      {/* Endoderm of the disc (continuous with the yolk-sac endoderm at the edge). */}
      <Part id="endodermoa">
        {sides.map((sd) => {
          const b = band(g.bot, 0, g.botArc0 - 1, () => 0, (s) => s.a, sd);
          return <Cells key={sd} outer={b.outer} inner={b.inner} n={lite ? 10 : 30} fill={C.endoderm} nk={0.5} seed={sd > 0 ? 5 : 6} />;
        })}
      </Part>

      {/* Ectoderm: neural plate (pseudostratified) in the middle, surface ectoderm to the edge; amnioblasts beyond. */}
      <Part id="ektodermoa">
        {sides.map((sd) => {
          const iPl = Math.round((66 / W) * 48);
          const pl = band(g.top, 0, iPl, () => 0, (s) => s.a, sd);
          const su = band(g.top, iPl, g.topArc0 - 1, () => 0, (s) => s.a, sd);
          return (
            <g key={sd}>
              <Cells outer={pl.outer} inner={pl.inner} n={lite ? 4 : 13} fill={C.neural} pseudo seed={sd > 0 ? 21 : 22} nucleus="rgba(10,16,48,0.7)" />
              <Cells outer={su.outer} inner={su.inner} n={lite ? 8 : 18} fill={C.surfaceEcto} nk={0.5} seed={sd > 0 ? 31 : 32} />
            </g>
          );
        })}
      </Part>
      <Part id="amnioblastoak" quiet>
        {sides.map((sd) => {
          const b = band(g.top, g.topArc0 - 1, nT, () => 0, (s) => s.a, sd);
          return <Cells key={sd} outer={b.outer} inner={b.inner} n={lite ? 10 : 38} fill={C.amnioblast} nk={0.5} seed={sd > 0 ? 43 : 44} />;
        })}
      </Part>
    </g>
  );
}

/** Label anchors (screen points) computed from the same geometry as the drawing. */
export function conceptusAnchors(m: MesoT) {
  const g = conceptusGeometry(m);
  const mid = (u: number) => (g.ectoBot(u) + g.endoTop(u)) / 2;
  const iA = g.topArc0 + 18;
  const iY = g.botArc0 + 16;
  const ribMidTop = (u: number) => g.ectoBot(u) + TP / 2;
  const ribMidBot = (u: number) => g.endoTop(u) - TP / 2;
  return {
    paraxial: [CX - 60, mid(60)] as Pt,
    intermediate: [CX - 111, mid(111)] as Pt,
    lateral: [CX - 180, (g.zTop(180) + g.zBot(180)) / 2] as Pt,
    sheet: [CX - 175, mid(175)] as Pt,
    coelom: [CX + 196, (g.zTop(196) + g.zBot(196)) / 2] as Pt,
    vacuole: [CX + 201, (g.zTop(201) + g.zBot(201)) / 2] as Pt,
    parietal: [CX + 214, ribMidTop(214)] as Pt,
    visceral: [CX + 214, ribMidBot(214)] as Pt,
    amnionCoatL: g.off(g.top[iA], g.top[iA].a + g.top[iA].b / 2, -1),
    amnionCoatR: g.off(g.top[iA], g.top[iA].a + g.top[iA].b / 2, 1),
    yolkCoatL: g.off(g.bot[iY], g.bot[iY].a + g.bot[iY].b / 2, -1),
    yolkCoatR: g.off(g.bot[iY], g.bot[iY].a + g.bot[iY].b / 2, 1),
    notochord: [g.noto[0] - 6, g.noto[1]] as Pt,
    ectoderm: [CX + 150, g.yTop(150) + g.te(150) / 2] as Pt,
    plate: [CX + 30, g.yTop(30) + g.te(30) / 2] as Pt,
    endoderm: [CX + 140, g.endoTop(140) + TEN / 2] as Pt,
    chorion: [CX + W + 44, Y0 + 30] as Pt,
    amnion: [CX - 120, Y0 - 90] as Pt,
    yolk: [CX - 110, Y0 + 170] as Pt,
  };
}
