'use client';

import type { ReactNode } from 'react';
import { C, Part, clamp, lerp, mix, rand, type Pt } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';

/**
 * Realistic transverse section of the week-3 germ disc, drawn like the course figures (Langman,
 * w3 figs. 1–2): pseudostratified columnar epiblast/ectoderm continuous at the disc margin with the
 * squamous amnion (dome above), cuboidal hypoblast/endoderm continuous with the yolk-sac lining
 * (below), both sacs covered by extra-embryonic mesoderm, and stellate intra-embryonic mesenchyme
 * spreading between the two epithelia from the primitive streak.
 *
 * Local "disc space": x = distance from the midline (-W..W), d = depth under the dorsal surface.
 */
export interface DiscParams {
  cx?: number;
  y?: number;
  k?: number;
  w?: number;
  amnionH?: number;
  yolkH?: number;
  /** Midline epiblast thickening (lerro primitiboa). */
  streak?: number;
  /** Depth of the primitive groove. */
  groove?: number;
  /** Epiblast cells leaving the groove (bottle cells → invaginating cells). */
  invag?: number;
  /** Animation phase for the invaginating cells. */
  phase?: number;
  /** Fraction of the disc where endoderm has replaced the hypoblast (from the midline outwards). */
  endo?: number;
  /** Lateral spread of the intra-embryonic mesoderm. */
  meso?: number;
  /** Notochord level: prenotochordal cells → notochordal plate (in the endoderm) → notochord → endoderm closes. */
  pre?: number;
  plate?: number;
  rod?: number;
  close?: number;
  /** Epiblast is now called ectoderm. */
  ecto?: number;
  /** Sagittal sections: the streak runs along [x0, x1] instead of crossing the midline. */
  streakAt?: [number, number];
  /** Custom intra-embryonic mesoderm thickness profile (replaces the lateral spread). */
  gapFn?: (x: number) => number;
  /** Bucco-pharyngeal / cloacal membranes at these x: ectoderm and endoderm fused, no mesoderm. */
  membranes?: number[];
  /** Endoderm interrupted on these intervals (e.g. replaced by the notochordal plate). */
  endoGaps?: [number, number][];
  /** Keep mesenchyme cells out of here (e.g. where the notochord lies). */
  mesoMask?: (x: number, d: number) => boolean;
  /** Only draw intra-embryonic mesoderm on [x0, x1] (the rest of the gap is cell-free matrix). */
  mesoRange?: [number, number];
}

const ss = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
const f1 = (v: number) => Math.round(v * 10) / 10;
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));
const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

const MT = 40; // full mesoderm thickness
const TEN = 11; // endoderm (cuboidal)
const THY = 8; // hypoblast (flatter)
const R_ROD = 15;
const HYPO = '#c4a86e'; // hypoblast: paler, flatter than the endoderm that replaces it

export function makeDisc(params: DiscParams) {
  const p = { cx: 500, y: 290, k: 1.15, w: 270, amnionH: 140, yolkH: 170, streak: 0, groove: 0, invag: 0, phase: 0, endo: 0, meso: 0, pre: 0, plate: 0, rod: 0, close: 0, ecto: 0, ...params };
  const W = p.w;
  const bow = (x: number) => 16 * (x / W) ** 2;
  const map = (x: number, d: number): Pt => [p.cx + p.k * x, p.y + p.k * (d + bow(x))];
  const box = (x: number, a: number, b: number, e: number) => ss((x - a) / e) * ss((b - x) / e);
  const sa = p.streakAt;
  const streakMid = sa ? (sa[0] + sa[1]) / 2 : 0;
  const thickProf = (x: number) => (sa ? box(x, sa[0], sa[1], 20) : Math.exp(-((x / 34) ** 2)));
  const grooveProf = (x: number) => (sa ? 0.55 * box(x, sa[0] + 8, sa[1] - 8, 10) : Math.exp(-((x / 15) ** 2)));
  const top = (x: number) => p.groove * 13 * grooveProf(x);
  const tEpi = (x: number) => 20 + p.streak * 10 * thickProf(x) - 11 * ss((Math.abs(x) - (W - 34)) / 30);
  const base = (x: number) => top(x) * 0.35 + tEpi(x);
  const spread = lerp(46, W - 6, clamp(p.meso));
  const noto = Math.max(p.pre, p.plate, p.rod) > 0.01;
  const memb = (x: number) => (p.membranes ?? []).reduce((m, xm) => m * ss((Math.abs(x - xm) - 12) / 18), 1);
  const gap = (x: number) => {
    if (p.gapFn) return p.gapFn(x) * memb(x);
    const sheet = MT * Math.min(1, p.meso * 2.5) * ss((spread - Math.abs(x)) / 60);
    const cluster = 14 * Math.max(p.invag, noto ? 1 : 0) * (sa ? box(x, sa[0] - 10, sa[1] + 10, 25) : Math.exp(-((x / 44) ** 2)));
    return Math.max(sheet, cluster) * memb(x);
  };
  const dEnd = (x: number) => base(x) + gap(x);
  const midGap = (base(0) + dEnd(0)) / 2;
  const rx = W * p.k;
  const cyA = map(W, tEpi(W) / 2)[1];
  // The yolk sac's rim follows the lining thickness smoothly (hypoblast → endoderm) instead of snapping at the end.
  const cyY = map(W, dEnd(W) + lerp(THY, TEN, ss((p.endo - 0.8) / 0.2)) / 2)[1];
  const arc = (cy: number, rX: number, rY: number, up: boolean, n = 64) =>
    range(0, Math.PI, n).map((a): Pt => [p.cx + rX * Math.cos(a), cy + (up ? -1 : 1) * rY * Math.sin(a)]);
  const eW = clamp(p.endo) * (W + 1);
  const at = {
    epiblast: map(-W * 0.55, tEpi(W * 0.55) / 2),
    groove: map(streakMid, top(streakMid) + 2),
    streak: map(streakMid, base(streakMid) - 5),
    meso: map(-W * 0.45, base(W * 0.45) + gap(W * 0.45) / 2),
    endo: map(-Math.min(eW * 0.6, W * 0.4), dEnd(Math.min(eW * 0.6, W * 0.4)) + TEN / 2),
    hypo: map(-lerp(W * 0.4, W * 0.92, clamp(p.endo)), dEnd(lerp(W * 0.4, W * 0.92, clamp(p.endo))) + TEN / 2),
    amnion: [p.cx + rx * 0.3, cyA - p.amnionH * p.k * 0.55] as Pt,
    amnionWall: [p.cx - rx * Math.cos(0.9), cyA - (p.amnionH * p.k + 3 * p.k) * Math.sin(0.9)] as Pt,
    yolk: [p.cx + rx * 0.3, cyY + p.yolkH * p.k * 0.55] as Pt,
    extraMeso: [p.cx + (rx + 8 * p.k) * Math.cos(0.5), cyA - (p.amnionH * p.k + 8 * p.k) * Math.sin(0.5)] as Pt,
    extraMesoYolk: [p.cx + (rx + 10 * p.k) * Math.cos(0.45), cyY + (p.yolkH * p.k + 10 * p.k) * Math.sin(0.45)] as Pt,
    noto: map(0, midGap),
    plate: map(0, dEnd(0) + 3),
    pre: map(0, lerp(midGap, dEnd(0) - 3, p.plate)),
    disc: map(W * 0.62, 0),
  };
  return { p, W, map, top, tEpi, base, gap, dEnd, midGap, spread, rx, cyA, cyY, arc, eW, at, k: p.k, streakMid };
}

export type Disc = ReturnType<typeof makeDisc>;

export interface DiscIds {
  epiblast?: string;
  meso?: string;
  endo?: string;
  hypo?: string;
  amnion?: string;
  /** The amnion's own wall (amnioblasts); defaults to the cavity id. */
  amnionWall?: string;
  yolk?: string;
  extraMeso?: string;
  groove?: string;
  streak?: string;
  pre?: string;
  plate?: string;
  rod?: string;
}

const DEFAULT_IDS: Required<Omit<DiscIds, 'amnionWall'>> = {
  epiblast: 'epiblastoa',
  meso: 'mesodermo-intraenbrionarioa',
  endo: 'endodermoa',
  hypo: 'hipoblastoa',
  amnion: 'amnios-barrunbea',
  yolk: 'bitelo-zaku-sekundarioa',
  extraMeso: 'enbrioi-kanpoko-mesodermoa',
  groove: 'ildo-primitiboa',
  streak: 'lerro-primitiboa',
  pre: 'zelula-prenotokordalak',
  plate: 'notokorda-plaka',
  rod: 'notokorda',
};

/** Stellate mesenchymal cells scattered where `inside(x, d)`. */
function Mesenchyme({ s, inside, color, seed = 5, step = 13 }: { s: Disc; inside: (x: number, d: number) => boolean; color: string; seed?: number; step?: number }) {
  const out: ReactNode[] = [];
  let i = 0;
  for (let x = -s.W; x <= s.W; x += step)
    for (let d = 0; d <= 90; d += step * 0.72) {
      i++;
      const jx = x + (rand(seed + i * 2.3) - 0.5) * step * 0.9;
      const jd = d + (rand(seed + i * 5.9) - 0.5) * step * 0.6;
      if (!inside(jx, jd)) continue;
      const [X, Y] = s.map(jx, jd);
      const a = rand(seed + i * 9.1) * 180;
      const r = 2 * s.k;
      out.push(
        <g key={i} transform={`translate(${f1(X)} ${f1(Y)}) rotate(${f1(a)})`}>
          <path d={`M${f1(-r * 2.7)},0L${f1(r * 2.7)},0M0,${f1(-r * 1.8)}L0,${f1(r * 1.8)}`} stroke={color} strokeWidth={0.8} opacity={0.6} />
          <ellipse rx={f1(r * 1.3)} ry={f1(r)} fill={color} stroke="rgba(60,8,12,0.5)" strokeWidth={0.5} />
        </g>,
      );
    }
  return <g>{out}</g>;
}

export function DiscDrawing({ s, ids = {} }: { s: Disc; ids?: DiscIds }) {
  const id = { ...DEFAULT_IDS, ...ids };
  const { p, W, map, top, base, gap, dEnd, rx, cyA, cyY, arc, k } = s;
  const A = p.amnionH * k;
  const Y = p.yolkH * k;
  const cellN = (len: number, w: number) => Math.max(3, Math.round((len * k) / w));
  const lower = (x: number) => dEnd(x) + (Math.abs(x) < s.eW ? TEN : THY);

  // --- sacs
  const amnionIn = arc(cyA, rx, A, true);
  const amnionMid = arc(cyA, rx + 5 * k, A + 5 * k, true);
  const amnionOut = arc(cyA, rx + 11 * k, A + 11 * k, true);
  const yolkIn = arc(cyY, rx, Y, false);
  const yolkMid = arc(cyY, rx + 7 * k, Y + 7 * k, false);
  const yolkOut = arc(cyY, rx + 13 * k, Y + 13 * k, false);
  const xs = range(-W, W, 80);
  const amnionCavity = poly([...amnionIn, ...xs.map((x) => map(x, top(x) - 0.5))]);
  const yolkCavity = poly([...xs.map((x) => map(x, lower(x) - 0.5)), ...yolkIn.slice().reverse()]);
  const margin = (sd: 1 | -1) =>
    poly([
      [p.cx + sd * (rx - 1), cyA],
      [p.cx + sd * (rx + 11 * k), cyA],
      [p.cx + sd * (rx + 13 * k), cyY],
      [p.cx + sd * (rx - 1), cyY],
    ]);

  // --- epithelia of the disc
  const band = (x0: number, x1: number, d0: (x: number) => number, d1: (x: number) => number, n = 40) => {
    const r = range(x0, x1, n);
    return { outer: r.map((x) => map(x, d0(x))), inner: r.map((x) => map(x, d1(x))) };
  };
  const epi = band(-W, W, top, base, 120);
  const epiColor = mix(C.epiblast, C.ectoderm, ss((p.ecto - 0.25) / 0.5));
  const plateOn = p.plate > 0.01 && p.rod < 0.99;
  const pw = plateOn ? 18 : 18 * (1 - ss(p.close)) * (p.rod > 0.01 ? 1 : 0);
  const bulge = (x: number) => 9 * p.plate * (1 - p.rod) * Math.exp(-((x / 12) ** 2));
  const eW = s.eW;
  // Endoderm spans [-eW, eW] minus the midline plate gap and any extra gaps.
  let endoPieces: [number, number][] = eW > 1 ? [[-eW, eW]] : [];
  for (const [g0, g1] of [...(pw > 0.5 ? [[-pw, pw] as [number, number]] : []), ...(p.endoGaps ?? [])])
    endoPieces = endoPieces.flatMap(([a, b]): [number, number][] => (g1 <= a || g0 >= b ? [[a, b]] : ([[a, Math.max(a, g0)], [Math.min(b, g1), b]] as [number, number][]).filter(([u, v]) => v - u > 2)));
  const hypoPieces: [number, number][] = eW < W ? [[-W, -Math.max(eW, 0)], [Math.max(eW, 0), W]] : [];
  const endoBot = (x: number) => dEnd(x) + TEN;
  const hypoBot = (x: number) => dEnd(x) + THY;

  // --- mesoderm
  const hole = 20 * Math.min(1, 2 * Math.max(p.pre, p.plate, p.rod));
  const mesoOn = p.meso > 0.01 || p.invag > 0.01;
  const [m0, m1] = p.mesoRange ?? [-W, W];
  const mesoIn = (x: number, d: number) => Math.hypot(x, (d - s.midGap) * 1.3) >= hole && d > base(x) + 2.5 && d < dEnd(x) - 2.5 && gap(x) > 7 && x > m0 + 4 && x < m1 - 4 && !p.mesoMask?.(x, d);
  const mesoRegion = (x0: number, x1: number) => poly(range(x0, x1, 40).map((x) => map(x, base(x))).concat(range(x1, x0, 40).map((x) => map(x, dEnd(x)))));
  const mesoRegions = [mesoRegion(Math.max(-W, m0), Math.min(W, m1))];

  // --- invaginating cells: bottle cells leave the groove floor, some to the endoderm, the rest into the mesoderm
  const moving: { pt: Pt; c: string; o: number; r: number }[] = [];
  if (p.invag > 0.02)
    for (let j = 0; j < 14; j++) {
      const sd = j % 2 ? 1 : -1;
      const u = (((p.phase * 1.6 + j * 0.083) % 1) + 1) % 1;
      const toEndo = j % 3 === 0 && p.endo > 0.02;
      const reach = lerp(0.25, 1, Math.max(p.endo, p.meso));
      const xo = p.streakAt ? lerp(p.streakAt[0] + 10, p.streakAt[1] - 10, rand(j * 1.7)) : 0;
      // Sagittal: cells leave the plane laterally, so they only drift a little along the streak.
      const far = p.streakAt ? 46 : toEndo ? Math.max(24, Math.min(s.eW, W) * 0.7) : Math.max(30, s.spread * 0.75);
      const x1 = clamp(xo + sd * lerp(p.streakAt ? 8 : 18, far, (0.35 + 0.65 * rand(j * 3.1)) * reach), -W + 30, W - 30);
      const d1 = toEndo ? dEnd(x1) + TEN / 2 : base(x1) + gap(x1) * (0.3 + 0.4 * rand(j * 7.7));
      const d0 = base(xo) - 3;
      const x = lerp(xo + sd * 3, x1, ss(u));
      const d = lerp(d0, d1, Math.min(1, u * 1.6));
      moving.push({
        pt: map(x, d),
        c: u < 0.22 ? C.epiblast : toEndo ? C.endoderm : C.mesoIntra,
        o: p.invag * Math.min(1, u * 8) * (1 - ss((u - 0.8) / 0.2)),
        r: 4.2 * k,
      });
    }

  // --- notochord
  const [nx, ny] = s.at.noto;
  const rodR = R_ROD * k * lerp(0.6, 1, p.rod);

  return (
    <g>
      {/* Yolk sac: cavity, hypoblast-derived lining, extra-embryonic mesoderm. */}
      <Part id={id.yolk} quiet>
        <path d={yolkCavity} fill="#3a3218" />
        <path d={yolkCavity} fill="url(#g-cavity)" opacity={0.6} />
      </Part>
      <Part id={id.amnion} quiet>
        <path d={amnionCavity} fill="#15294a" />
        <path d={amnionCavity} fill="url(#g-cavity)" opacity={0.5} />
      </Part>
      <Part id={id.extraMeso}>
        <path d={margin(1)} fill={C.mesoExtra} opacity={0.85} />
        <path d={margin(-1)} fill={C.mesoExtra} opacity={0.85} />
        <Cells outer={amnionOut} inner={amnionMid} n={cellN(Math.PI * (rx / k + A / k) * 0.5, 30)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={21} />
        <Cells outer={yolkOut} inner={yolkMid} n={cellN(Math.PI * (rx / k + Y / k) * 0.5, 30)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={22} />
      </Part>
      <Part id={ids.amnionWall ?? id.amnion}>
        <Cells outer={amnionMid} inner={amnionIn} n={cellN(Math.PI * (rx / k + A / k) * 0.5, 22)} fill={C.amnioblast} nk={0.5} seed={23} />
      </Part>
      <Part id={id.yolk}>
        <Cells outer={yolkMid} inner={yolkIn} n={cellN(Math.PI * (rx / k + Y / k) * 0.5, 16)} fill={HYPO} nucleus="rgba(90,70,20,0.6)" seed={24} />
      </Part>

      {/* Cell-free matrix between the epithelia wherever they are apart. */}
      <path d={mesoRegion(-W, W)} fill="#22182a" pointerEvents="none" />
      {/* Intra-embryonic mesoderm: loose mesenchyme between epiblast and hypoblast/endoderm. */}
      {mesoOn && (
        <Part id={id.meso} show={Math.max(ss(p.meso * 3), ss(p.invag))}>
          {mesoRegions.map((d, i) => (
            <path key={i} d={d} fill={C.mesoIntra} opacity={0.3} />
          ))}
          <Mesenchyme s={s} inside={mesoIn} color="#f25555" />
        </Part>
      )}

      {/* Hypoblast (lateral, being displaced) and endoderm (medial, replacing it). */}
      {hypoPieces.length > 0 && (
        <Part id={id.hypo}>
          {hypoPieces.map(([a, b], i) => {
            const bd = band(a, b, dEnd, hypoBot, 30);
            return <Cells key={i} outer={bd.inner} inner={bd.outer} n={cellN(b - a, 10)} fill={HYPO} nucleus="rgba(90,70,20,0.6)" nk={0.5} seed={30 + i} />;
          })}
        </Part>
      )}
      {endoPieces.length > 0 && (
        <Part id={id.endo}>
          {endoPieces.map(([a, b], i) => {
            const bd = band(a, b, dEnd, endoBot, 30);
            return <Cells key={i} outer={bd.inner} inner={bd.outer} n={cellN(b - a, 10)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" nk={0.45} seed={40 + i} />;
          })}
        </Part>
      )}

      {/* Notochord level. */}
      {p.pre > 0.01 && p.plate < 0.99 && (
        <Part id={id.pre} show={p.pre * (1 - p.plate)}>
          {[-7, 0, 7, -3.5, 3.5].map((dx, i) => {
            const [X, Yy] = s.at.pre;
            return <ellipse key={i} cx={X + dx * k * 1.2} cy={Yy + (i < 3 ? -3 : 4) * k} rx={4.2 * k} ry={3.6 * k} fill={C.notochord} stroke="rgba(40,10,70,0.7)" strokeWidth={0.8} />;
          })}
        </Part>
      )}
      {plateOn && (
        <Part id={id.plate} show={ss(p.plate) * (1 - p.rod)}>
          {(() => {
            const bd = band(-18, 18, (x) => dEnd(x) - bulge(x), endoBot, 10);
            return <Cells outer={bd.outer} inner={bd.inner} n={5} fill={C.notochord} nucleus="rgba(40,10,70,0.7)" nk={0.55} seed={50} />;
          })()}
        </Part>
      )}
      {p.rod > 0.01 && (
        <Part id={id.rod} show={ss(p.rod)}>
          <circle cx={nx} cy={ny} r={rodR} fill={C.notochord} stroke="rgba(40,10,70,0.8)" strokeWidth={1.2} />
          {range(0, 1, 7)
            .slice(0, 7)
            .map((u, i) => {
              const a = u * Math.PI * 2;
              return <ellipse key={i} cx={nx + Math.cos(a) * rodR * 0.55} cy={ny + Math.sin(a) * rodR * 0.55} rx={rodR * 0.22} ry={rodR * 0.16} transform={`rotate(${f1((a * 180) / Math.PI)} ${f1(nx + Math.cos(a) * rodR * 0.55)} ${f1(ny + Math.sin(a) * rodR * 0.55)})`} fill="rgba(40,10,70,0.65)" />;
            })}
        </Part>
      )}

      {/* Epiblast / ectoderm: pseudostratified columnar, continuous with the amnion at the margin. */}
      <Part id={id.epiblast}>
        <Cells outer={epi.outer} inner={epi.inner} n={cellN(2 * W, 8.5)} fill={epiColor} pseudo seed={7} />
      </Part>
      {p.streak > 0.01 && (
        <Part id={id.streak} show={ss(p.streak)}>
          {range(-1, 1, p.streakAt ? 14 : 6).map((u, i) => {
            const x = p.streakAt ? lerp(p.streakAt[0] + 8, p.streakAt[1] - 8, (u + 1) / 2) : u * 16;
            const [X, Yy] = map(x, base(x) - 4 - (i % 2) * 5);
            return <ellipse key={i} cx={X} cy={Yy} rx={3.2 * k} ry={3 * k} fill="#7ea6f5" stroke="rgba(10,20,50,0.6)" strokeWidth={0.6} opacity={0.85} />;
          })}
        </Part>
      )}
      {p.groove > 0.01 && (
        <Part id={id.groove} show={ss(p.groove)}>
          {(() => {
            const [g0, g1] = p.streakAt ? [p.streakAt[0] - 4, p.streakAt[1] + 4] : [-24, 24];
            return (
              <>
                <path d={poly(range(g0, g1, 40).map((x) => map(x, top(x) - 0.6)).concat([map(g1, -3), map(g0, -3)]))} fill="#15294a" />
                <path d={`M${range(g0, g1, 40).map((x) => map(x, top(x)).map(f1).join(',')).join('L')}`} fill="none" stroke="#0b1530" strokeWidth={1.6} />
              </>
            );
          })()}
        </Part>
      )}
      <g pointerEvents="none">
        {moving.map((c, i) => (
          <g key={i} opacity={c.o}>
            <ellipse cx={c.pt[0]} cy={c.pt[1]} rx={c.r} ry={c.r * 0.85} fill={c.c} stroke="rgba(10,14,28,0.65)" strokeWidth={0.7} />
            <circle cx={c.pt[0]} cy={c.pt[1]} r={c.r * 0.38} fill="rgba(16,20,44,0.65)" />
          </g>
        ))}
      </g>
    </g>
  );
}

/** Outline over a membrane (bucco-pharyngeal / cloacal): ectoderm + endoderm fused, no mesoderm. */
export function membranePath(s: Disc, xm: number) {
  const xs = range(xm - 16, xm + 16, 12);
  return poly([...xs.map((x) => s.map(x, s.top(x) - 2)), ...xs.reverse().map((x) => s.map(x, s.dEnd(x) + TEN + 2))]);
}

export function MembraneMark({ s, x }: { s: Disc; x: number }) {
  return <path d={membranePath(s, x)} fill="rgba(226,232,240,0.16)" stroke="#e2e8f0" strokeWidth={1.3} strokeDasharray="4 3" />;
}

/** A compact cluster of round cells centred in the ecto–endo gap at x (e.g. the prechordal plate). */
export function CellCluster({ s, x, n = 9, color, span = 16 }: { s: Disc; x: number; n?: number; color: string; span?: number }) {
  const cells: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const row = i % 2;
    const xx = x + lerp(-span, span, n > 1 ? i / (n - 1) : 0.5);
    const [X, Y] = s.map(xx, (s.base(xx) + s.dEnd(xx)) / 2 + (row ? 4.5 : -4.5));
    cells.push(<ellipse key={i} cx={f1(X)} cy={f1(Y)} rx={f1(4.4 * s.k)} ry={f1(3.8 * s.k)} fill={color} stroke="rgba(50,10,50,0.7)" strokeWidth={0.8} />);
  }
  return <g>{cells}</g>;
}

/** Sagittal notochord: a solid rod of cells lying in the ecto–endo gap over [x0, x1]. */
export function NotochordRod({ s, x0, x1, th = 17 }: { s: Disc; x0: number; x1: number; th?: number }) {
  const xs = range(x0, x1, 40);
  const c = (x: number) => (s.base(x) + s.dEnd(x)) / 2;
  const outer = xs.map((x) => s.map(x, c(x) - th / 2));
  const inner = xs.map((x) => s.map(x, c(x) + th / 2));
  return <Cells outer={outer} inner={inner} n={Math.max(3, Math.round(((x1 - x0) * s.k) / 9))} fill={C.notochord} nucleus="rgba(40,10,70,0.7)" pseudo seed={61} />;
}

/** Sagittal notochordal plate: notochord cells intercalated in the endoderm over [x0, x1]. */
export function NotochordPlate({ s, x0, x1 }: { s: Disc; x0: number; x1: number }) {
  const xs = range(x0, x1, 40);
  const outer = xs.map((x) => s.map(x, s.dEnd(x) - 3));
  const inner = xs.map((x) => s.map(x, s.dEnd(x) + TEN));
  return <Cells outer={outer} inner={inner} n={Math.max(3, Math.round(((x1 - x0) * s.k) / 10))} fill={C.notochord} nucleus="rgba(40,10,70,0.7)" nk={0.5} seed={62} />;
}
