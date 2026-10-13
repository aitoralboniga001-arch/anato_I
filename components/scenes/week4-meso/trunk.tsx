'use client';

import type { ReactNode } from 'react';
import { C, Part, clamp, lerp, rand, smoothPath, type Pt } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';

/**
 * Transverse section of the 4th-week trunk (Langman figs. 6-12 and 6-14), built so lateral folding
 * is one continuous parameter `e` (0 = day 21, flat-ish body wall over a wide yolk sac; 1 = end of
 * week 4, body wall closed ventrally, gut tube hung by the dorsal mesentery, coelom round it).
 *
 * Two spines carry every sheet as an offset band, so the topology holds at every e:
 *  - TOP spine S: the outer surface of the ectoderm, from the dorsal midline over the dorsal block,
 *    down the body wall, round a hairpin at the body-wall edge and up round the amnion. Offsets:
 *    ectoderm → amnioblasts (0..a), parietal (somatic) layer → amnion coat (a..a+b).
 *  - BOTTOM spine G: the luminal surface of the endoderm, from the gut roof round the yolk sac
 *    (or, folded, round the gut tube). Offsets: endoderm (0..a), visceral (splanchnic) layer (a..a+b).
 * The intra-embryonic coelom is what lies between the parietal and the visceral layers; until the
 * body wall closes it opens at the edge straight into the chorionic cavity (same dark space).
 * Model units: x from the midline (right half; the left is mirrored), y down from the dorsal skin.
 */

export const TE = 9; // surface ectoderm
export const TP = 12; // parietal layer
export const TEN = 8; // endoderm
export const TV = 11; // visceral layer
const TA = 5; // amnioblasts
const TC = 6; // extra-embryonic coat
export const U1 = 140; // where the body wall leaves the dorsal block (arclength along the skin)
const RG = 17; // gut lumen radius once folded
const LM = 44; // mesentery length once folded

export const TUBE = { cx: 0, cy: 58, rx: 30, ry: 46 };
export const NOTO = { cx: 0, cy: 119, r: 10 };
export const AORTA = { cx: 33, cy: 143, r: 9 };
export const SOMITE = { cx: 74, cy: 56, rx: 28, ry: 25 };
const TH1 = 0.9; // skin slope where the body wall leaves the block
const Y_ROOF = 166; // gut roof (lumen) under the block, flat stage
const X_ANGLE = 118; // medial angle of the coelom, flat stage

export const COL = {
  chorion: '#1b0d22',
  coelom: '#1b0d22',
  amnion: 'rgba(110,160,255,0.075)',
  block: '#8a2934',
  blockDots: 'rgba(70,6,18,0.7)',
  parietal: '#f37f7f',
  visceral: '#d9566a',
  mesentery: '#c84a5f',
  lining: '#f59a9a',
};

const ss = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
export const f1 = (v: number) => Math.round(v * 10) / 10;
const lerpP = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

export interface Spine {
  p: Pt;
  /** Unit normal pointing into the tissue the spine carries. */
  n: Pt;
  /** Inner sheet thickness (ectoderm / endoderm) and outer sheet thickness (parietal / visceral). */
  a: number;
  b: number;
}

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const m = 1 - t;
  return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
};

/** Open Catmull-Rom through the points, `per` samples per span. */
export function catmull(pts: Pt[], per = 8): Pt[] {
  const out: Pt[] = [];
  const g = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Numeric unit normals of a polyline, on the side `sgn` (+1 = right of travel in y-down space). */
function normalsOf(pts: Pt[], sgn: 1 | -1): Pt[] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [(-dy / l) * sgn, (dx / l) * sgn];
  });
}

/** Offset point of a spine sample. */
export const off = (s: Spine, d: number): Pt => [s.p[0] + s.n[0] * d, s.p[1] + s.n[1] * d];

/**
 * A band along spine samples [i0, i1], resampled evenly by arclength into `n` steps, between
 * offsets d0(s) and d1(s). Returns matched outer/inner polylines (model space).
 */
export function band(list: Spine[], i0: number, i1: number, d0: (s: Spine) => number, d1: (s: Spine) => number, n: number) {
  const sl = list.slice(Math.max(0, Math.min(i0, i1)), Math.max(i0, i1) + 1);
  if (i1 < i0) sl.reverse();
  const cum = [0];
  for (let i = 1; i < sl.length; i++) cum.push(cum[i - 1] + Math.hypot(sl[i].p[0] - sl[i - 1].p[0], sl[i].p[1] - sl[i - 1].p[1]));
  const L = cum[cum.length - 1] || 1;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const s = (k / n) * L;
    while (j < sl.length - 2 && cum[j + 1] < s) j++;
    const a = sl[j];
    const b = sl[Math.min(sl.length - 1, j + 1)];
    const w = cum[j + 1] > cum[j] ? clamp((s - cum[j]) / (cum[j + 1] - cum[j])) : 0;
    const nx = lerp(a.n[0], b.n[0], w);
    const ny = lerp(a.n[1], b.n[1], w);
    const nl = Math.hypot(nx, ny) || 1;
    const sp: Spine = { p: lerpP(a.p, b.p, w), n: [nx / nl, ny / nl], a: lerp(a.a, b.a, w), b: lerp(a.b, b.b, w) };
    outer.push(off(sp, d0(sp)));
    inner.push(off(sp, d1(sp)));
  }
  return { outer, inner };
}

/** Index of the first sample at or past x = X (searching from i0). */
const firstX = (list: Spine[], X: number, i0 = 0) => {
  for (let i = i0; i < list.length; i++) if (list[i].p[0] >= X) return i;
  return list.length - 1;
};

/** The dome of skin over the dorsal block (fixed): it wraps round the somites to where the body wall leaves. */
const thD = (u: number) => TH1 * (u / U1) ** 1.5;
const DORSAL: Pt[] = (() => {
  const out: Pt[] = [];
  let x = 0;
  let y = 0;
  for (let u = 0; u < U1; u += 2) {
    out.push([x, y]);
    const tm = thD(u + 1);
    x += 2 * Math.cos(tm);
    y += 2 * Math.sin(tm);
  }
  out.push([x, y]);
  return out;
})();
/** Inner surface of the dorsal skin (offset TE along the normal), as y at x. */
const SKIN_IN: Pt[] = DORSAL.map((p, i) => {
  const th = thD(i * 2);
  return [p[0] - Math.sin(th) * TE, p[1] + Math.cos(th) * TE];
});
const yAtX = (pts: Pt[], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++)
    if (pts[i][0] >= x) {
      const w = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1);
      return lerp(pts[i - 1][1], pts[i][1], w);
    }
  return pts[pts.length - 1][1];
};
/** y of the skin's outer surface at x (dorsal part). */
export const skinY = (x: number) => yAtX(DORSAL, x);
/** y of the skin's inner surface at x (dorsal part): what lies under the skin starts here. */
export const skinIn = (x: number) => yAtX(SKIN_IN, x);

export function trunkGeom(e: number) {
  // ---- TOP spine: dorsal dome (fixed), body wall (Bézier driven by e), hairpin, amnion.
  const sp: Pt[] = DORSAL.slice(0, -1).map((p): Pt => [p[0], p[1]]);
  const th1 = TH1;
  const iU1 = sp.length;
  const P1: Pt = DORSAL[DORSAL.length - 1];
  const thE = lerp(1.2, Math.PI, e);
  const ang = lerp(-0.17, 1.95, e);
  const R = lerp(177, 162, e);
  const tip: Pt = [60 + R * Math.cos(ang), 150 + R * Math.sin(ang)];
  const h1 = lerp(45, 130, e);
  const h2 = lerp(40, 150, e);
  const B1: Pt = [P1[0] + h1 * Math.cos(th1), P1[1] + h1 * Math.sin(th1)];
  const B2: Pt = [tip[0] - h2 * Math.cos(thE), tip[1] - h2 * Math.sin(thE)];
  const NB = Math.round(lerp(40, 110, e));
  for (let i = 0; i <= NB; i++) sp.push(bez(P1, B1, B2, tip, i / NB));
  const iTip = sp.length - 1;
  const rh = 4;
  const dh = lerp(2.2, Math.PI, e);
  const cH: Pt = [tip[0] + rh * Math.sin(thE), tip[1] - rh * Math.cos(thE)];
  for (let i = 1; i <= 8; i++) {
    const th = thE - (dh * i) / 8;
    sp.push([cH[0] - rh * Math.sin(th), cH[1] + rh * Math.cos(th)]);
  }
  const iAm = sp.length - 1;
  const thH = thE - dh;
  const H = sp[iAm];
  const YA = lerp(92, 118, e);
  const hA = lerp(55, 320, e * e);
  const A1: Pt = [H[0] + hA * Math.cos(thH), H[1] + hA * Math.sin(thH)];
  const A2: Pt = [lerp(228, 330, e), -YA];
  const A3: Pt = [0, -YA];
  for (let i = 1; i <= 96; i++) sp.push(bez(H, A1, A2, A3, i / 96));
  const nS = normalsOf(sp, 1);
  const S: Spine[] = sp.map((p, i) => {
    const k = i <= iTip ? 0 : i >= iAm ? 1 : (i - iTip) / (iAm - iTip);
    return { p, n: nS[i], a: lerp(TE, TA, k), b: lerp(TP, TC, k) };
  });

  // ---- BOTTOM spine: gut roof → yolk sac (flat) … gut tube (folded).
  const yR = Y_ROOF + LM * e;
  const LG = lerp(600, Math.PI * RG, e);
  const tab: [number, number][] = [
    [0, 0],
    [0.19, 0],
    [0.28, 1.95],
    [0.38, 1.2],
    [0.52, 1.5],
    [1, Math.PI],
  ];
  const A = (s: number) => {
    for (let i = 0; i < tab.length - 1; i++) {
      const [s0, a0] = tab[i];
      const [s1, a1] = tab[i + 1];
      if (s <= s1) return lerp(a0, a1, ss((s - s0) / (s1 - s0)));
    }
    return Math.PI;
  };
  const thG = (s: number) => lerp(A(s), Math.PI * s, e);
  const NG = 150;
  const gp: Pt[] = [];
  let gx = 0;
  let gy = yR;
  for (let i = 0; i <= NG; i++) {
    gp.push([gx, gy]);
    const tm = thG((i + 0.5) / NG);
    gx += (LG / NG) * Math.cos(tm);
    gy += (LG / NG) * Math.sin(tm);
  }
  const xEnd = gp[NG][0];
  gp.forEach((p, i) => {
    p[0] -= xEnd * (i / NG) ** 2;
  });
  const nG = normalsOf(gp, -1);
  const G: Spine[] = gp.map((p, i) => ({ p, n: nG[i], a: TEN, b: TV }));

  // ---- where things meet
  const iV = firstX(G, lerp(X_ANGLE, 12, e));
  const tipIn = off(S[iTip], TE + TP);
  let iM = iV;
  let best = 1e9;
  for (let i = iV; i < G.length; i++) {
    const q = off(G[i], TEN + TV);
    const d = Math.hypot(q[0] - tipIn[0], q[1] - tipIn[1]);
    if (d < best) {
      best = d;
      iM = i;
    }
  }
  const iA = iU1 + 3;
  const Pa = off(S[iA], TE + TP);
  const Pc = lerpP([X_ANGLE + 2, 104], [104, 152], e);
  const Pg = off(G[iV], TEN + TV);
  const Pr = lerpP([Pg[0] + 3, Pg[1] - 3], [12, Y_ROOF - 4], ss(e / 0.7));
  const wall = catmull([Pa, Pc, Pr, Pg], 10);
  const iPr = 20; // index of Pr in `wall`

  return { e, S, G, iU1, iTip, iAm, iV, iM, iA, wall, iPr, Pa, Pc, Pr, Pg, yR, tip };
}
export type Trunk = ReturnType<typeof trunkGeom>;

/** Screen placement of the model: x' = ox + k·sd·x, y' = oy + k·y. */
export interface Place {
  k: number;
  ox: number;
  oy: number;
}
export const placer = (pl: Place) => (p: Pt, sd: 1 | -1 = 1): Pt => [pl.ox + pl.k * sd * p[0], pl.oy + pl.k * p[1]];

const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

/** Model-space polygons of the trunk (right half). */
export function trunkRegions(g: Trunk) {
  const { S, G, iTip, iV, iM, iA, wall, iPr } = g;
  const blockR: Pt[] = [
    ...S.slice(0, iA + 1).map((s) => off(s, s.a)),
    ...wall,
    ...G.slice(0, iV + 1)
      .reverse()
      .map((s) => off(s, s.a)),
  ];
  const coelomR: Pt[] = [
    ...S.slice(iA, iTip + 1).map((s) => off(s, s.a + s.b)),
    ...G.slice(iV, iM + 1)
      .reverse()
      .map((s) => off(s, s.a + s.b)),
    ...wall.slice().reverse(),
  ];
  const mesR: Pt[] = [
    ...wall.slice(iPr),
    ...G.slice(0, iV + 1)
      .reverse()
      .map((s) => off(s, s.a + s.b)),
  ];
  return { blockR, coelomR, mesR, liningR: wall.slice(0, iPr + 1) };
}

/** Both halves of a right-half polygon that touches the midline, as one closed outline. */
const both = (R: Pt[], map: (p: Pt, sd: 1 | -1) => Pt) => [...R.map((p) => map(p, 1)), ...R.slice().reverse().map((p) => map(p, -1))];

/** Mesenchymal cells over a region (deterministic jittered grid, screen space): small rotated ovals. */
export function mesenchyme(inside: (x: number, y: number) => boolean, box: [number, number, number, number], step: number, seed: number, color: string, r = 1.9): ReactNode {
  // Every cell is a turned ellipse, all in one path (two half-arcs each): hundreds of cells, one element.
  let d = '';
  let i = 0;
  const [x0, y0, x1, y1] = box;
  const rx = f1(r * 1.5);
  const ry = f1(r * 0.8);
  const f2 = (v: number) => Math.round(v * 100) / 100;
  for (let y = y0; y <= y1; y += step * 0.84)
    for (let x = x0; x <= x1; x += step) {
      i++;
      const jx = f1(x + (rand(seed + i * 2.3) - 0.5) * step * 0.9);
      const jy = f1(y + (rand(seed + i * 5.9) - 0.5) * step * 0.7);
      if (!inside(jx, jy)) continue;
      const deg = f1(rand(seed + i * 9.1) * 180);
      const ex = rx * Math.cos((deg * Math.PI) / 180);
      const ey = rx * Math.sin((deg * Math.PI) / 180);
      const arc = `A${rx} ${ry} ${deg} 1 0 `;
      d += `M${f2(jx + ex)},${f2(jy + ey)}${arc}${f2(jx - ex)},${f2(jy - ey)}${arc}${f2(jx + ex)},${f2(jy + ey)}Z`;
    }
  return d ? <path d={d} /> : null;
}

/** Point-in-polygon (even-odd). */
export function inPoly(pts: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = Math.PI * 2, n = 40): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / n);
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

export interface TrunkIds {
  ectoderm?: string;
  parietal?: string;
  visceral?: string;
  coelom?: string;
  block?: string;
  mesentery?: string;
}

interface TrunkProps {
  g: Trunk;
  pl: Place;
  /** 0 = lite, 1 = normal, 2 = close-up (more, smaller cells). */
  detail?: number;
  ids?: TrunkIds;
  /** Drawn over the dorsal block, under the neural tube / notochord / aortae / skin. */
  mid?: ReactNode;
  /** Drawn over everything (still under the labels). */
  over?: ReactNode;
  /** Lumen fill of the gut (0 = yolk, 1 = gut lumen). */
  gut?: number;
}

/** The section drawing. */
export function TrunkSection({ g, pl, detail = 1, ids = {}, mid, over, gut }: TrunkProps) {
  const M = placer(pl);
  const { S, G, iTip, iV, iM, iU1 } = g;
  const reg = trunkRegions(g);
  const sides = [1, -1] as const;
  const k = pl.k;
  const dens = detail >= 2 ? 1.35 : 1;
  const nOf = (len: number, cell: number) => Math.max(3, Math.round((len * k * dens) / (cell * Math.max(1, k * 0.6))));
  const scr = (pts: Pt[], sd: 1 | -1) => pts.map((p) => M(p, sd));
  const gutK = gut ?? ss((g.e - 0.55) / 0.4);

  const amnionCav = [...S.map((s) => M(s.p, 1)), ...S.slice().reverse().map((s) => M(s.p, -1))];
  const lumen = [...G.map((s) => M(s.p, 1)), ...G.slice().reverse().map((s) => M(s.p, -1))];
  const blockD = poly(both(reg.blockR, M));
  const blockS = both(reg.blockR, M);
  const coelD = sides.map((sd) => poly(scr(reg.coelomR, sd))).join('');
  const mesD = poly(both(reg.mesR, M));
  const mesShow = ss((g.e - 0.25) / 0.4);

  const bandS = (i0: number, i1: number, d0: (s: Spine) => number, d1: (s: Spine) => number, cell: number) => {
    // True arclength: the amnion's samples are far apart once it balloons round the folded body, and an
    // estimate from the sample count gave it too few points (a faceted outline).
    let len = 0;
    for (let i = Math.min(i0, i1) + 1; i <= Math.max(i0, i1); i++) len += Math.hypot(S[i].p[0] - S[i - 1].p[0], S[i].p[1] - S[i - 1].p[1]);
    const n = nOf(len, cell);
    const b = band(S, i0, i1, d0, d1, Math.max(8, n * 2));
    return { b, n };
  };
  const bandG = (i0: number, i1: number, d0: (s: Spine) => number, d1: (s: Spine) => number, cell: number) => {
    let len = 0;
    for (let i = Math.min(i0, i1) + 1; i <= Math.max(i0, i1); i++) len += Math.hypot(G[i].p[0] - G[i - 1].p[0], G[i].p[1] - G[i - 1].p[1]);
    const n = nOf(len, cell);
    const b = band(G, i0, i1, d0, d1, Math.max(8, n * 2));
    return { b, n };
  };
  /** Only the stretch of a band that is on screen (close-ups draw a small part of a big section). */
  const onScreen = (p: Pt) => p[0] > -30 && p[0] < 1030 && p[1] > -30 && p[1] < 670;
  const cellsS = (key: string, sd: 1 | -1, r: { b: { outer: Pt[]; inner: Pt[] }; n: number }, fill: string, extra: Partial<Parameters<typeof Cells>[0]> = {}) => {
    const o = scr(r.b.outer, sd);
    const i = scr(r.b.inner, sd);
    let a = -1;
    let z = -1;
    o.forEach((p, j) => {
      if (onScreen(p) || onScreen(i[j])) {
        if (a < 0) a = j;
        z = j;
      }
    });
    if (a < 0) return null;
    a = Math.max(0, a - 1);
    z = Math.min(o.length - 1, z + 1);
    const frac = (z - a) / Math.max(1, o.length - 1);
    return <Cells key={key} outer={o.slice(a, z + 1)} inner={i.slice(a, z + 1)} n={Math.max(1, Math.round(r.n * frac))} fill={fill} {...extra} />;
  };

  const ecto = bandS(0, iTip, () => 0, (s) => s.a, 12);
  const amnio = bandS(iTip, S.length - 1, () => 0, (s) => s.a, 24);
  const pari = bandS(iU1 - 2, iTip, (s) => s.a, (s) => s.a + s.b, 13);
  const coat = bandS(iTip, S.length - 1, (s) => s.a, (s) => s.a + s.b, 26);
  const endo = bandG(0, iM, () => 0, (s) => s.a, 11);
  const yolkE = bandG(iM, G.length - 1, () => 0, (s) => s.a, 22);
  const visc = bandG(iV, iM, (s) => s.a, (s) => s.a + s.b, 12);
  const yolkC = bandG(iM, G.length - 1, (s) => s.a, (s) => s.a + s.b, 26);

  const bb: [number, number, number, number] = [Math.max(-10, Math.min(...blockS.map((p) => p[0]))), Math.max(-10, Math.min(...blockS.map((p) => p[1]))), Math.min(1010, Math.max(...blockS.map((p) => p[0]))), Math.min(650, Math.max(...blockS.map((p) => p[1])))];
  const step = detail >= 2 ? 30 : 12 * Math.max(0.8, k);

  return (
    <g>
      <defs>
        <radialGradient id="w4b-tr-chorion" cx="50%" cy="45%" r="62%">
          <stop offset="0.5" stopColor={COL.chorion} />
          <stop offset="1" stopColor={COL.chorion} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="w4b-tr-yolk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3115" />
          <stop offset="1" stopColor="#1d180a" />
        </linearGradient>
      </defs>
      <Part id="korion-barrunbea" quiet>
        <rect x={-20} y={-20} width={1040} height={680} fill="url(#w4b-tr-chorion)" />
      </Part>
      <Part id="amnios-barrunbea" quiet>
        <path d={poly(amnionCav)} fill={COL.amnion} />
      </Part>
      {/* The yolk sac's cavity becomes the gut's lumen as the folds close. */}
      <Part id={gutK > 0.5 ? 'erdiko-hestea' : 'bitelo-zaku-sekundarioa'} quiet>
        <path d={poly(lumen)} fill="url(#w4b-tr-yolk)" opacity={1 - gutK * 0.55} />
        {gutK > 0.01 && <path d={poly(lumen)} fill="#120f0a" opacity={gutK * 0.7} />}
      </Part>

      {/* Extra-embryonic sheets: amnion (amnioblasts + somatic coat) and yolk sac (endoderm + splanchnic coat). */}
      <g opacity={0.92}>
        {sides.map((sd) => (
          <g key={sd}>
            <Part id="amniosa" quiet>
              {cellsS(`co${sd}`, sd, coat, C.mesoExtra, { nucleus: 'rgba(140,62,40,0.6)', edge: 'rgba(140,62,40,0.28)', seed: 61 + sd })}
              {cellsS(`am${sd}`, sd, amnio, C.amnioblast, { seed: 71 + sd })}
            </Part>
            {g.iM < G.length - 2 && (
              <Part id="bitelo-zaku-sekundarioa" quiet>
                {cellsS(`yc${sd}`, sd, yolkC, C.mesoExtra, { nucleus: 'rgba(140,62,40,0.6)', edge: 'rgba(140,62,40,0.28)', seed: 81 + sd })}
                {cellsS(`ye${sd}`, sd, yolkE, C.endoderm, { seed: 91 + sd })}
              </Part>
            )}
          </g>
        ))}
      </g>

      {/* Intra-embryonic coelom (the same dark space as the chorionic cavity, open at the edge until the wall closes). */}
      <Part id={ids.coelom ?? 'enbrioi-barruko-zeloma'}>
        <path d={coelD} fill={COL.coelom} />
      </Part>

      {/* Dorsal block: mesenchyme round the neural tube, notochord, somites and intermediate mesoderm. */}
      <Part id={ids.block ?? 'mesodermo-paraxiala'} quiet>
        <path d={blockD} fill={COL.block} />
        <path d={blockD} fill="url(#g-shade)" opacity={0.3} />
        {detail > 0 && <g fill={COL.blockDots}>{mesenchyme((x, y) => inPoly(blockS, x, y), bb, step, 5, COL.blockDots, detail >= 2 ? 1.2 + 0.45 * k : 1.6)}</g>}
      </Part>
      {/* Lining of the coelom's dorsal wall (parietal, running on into the mesentery). */}
      {sides.map((sd) => (
        <path key={sd} d={smoothPath(scr(reg.liningR, sd), false, 0.4)} fill="none" stroke={COL.lining} strokeWidth={Math.max(1.4, 2.6 * k)} strokeOpacity={0.55} strokeLinecap="round" pointerEvents="none" />
      ))}

      {mid}

      {/* Dorsal mesentery: splanchnic mesoderm hanging the gut from the dorsal wall. */}
      {mesShow > 0.01 && (
        <Part id={ids.mesentery ?? 'mesenterio-dortsala'} show={mesShow}>
          <path d={mesD} fill={COL.mesentery} />
          <path d={mesD} fill="url(#g-shade)" opacity={0.3} />
        </Part>
      )}

      {/* Parietal (somatic) layer of the body wall and visceral (splanchnic) layer round the gut. */}
      <Part id={ids.parietal ?? 'paretako-orria'}>
        {sides.map((sd) => cellsS(`pa${sd}`, sd, pari, COL.parietal, { nucleus: 'rgba(110,14,26,0.7)', edge: 'rgba(90,10,24,0.32)', seed: 41 + sd }))}
      </Part>
      <Part id={ids.visceral ?? 'errai-orria'}>
        {sides.map((sd) => cellsS(`vi${sd}`, sd, visc, COL.visceral, { nucleus: 'rgba(80,8,20,0.75)', edge: 'rgba(90,10,24,0.32)', seed: 51 + sd }))}
      </Part>
      <Part id="endodermoa">
        {sides.map((sd) => cellsS(`en${sd}`, sd, endo, C.endoderm, { seed: 31 + sd }))}
      </Part>
      <Part id={ids.ectoderm ?? 'ektodermoa'}>
        {sides.map((sd) => cellsS(`ec${sd}`, sd, ecto, C.surfaceEcto, { seed: 21 + sd }))}
      </Part>
      {over}
    </g>
  );
}

/** Neural tube (pseudostratified wall round a slit lumen). */
export function NeuralTube({ pl, detail = 1, id = 'hodi-neurala' }: { pl: Place; detail?: number; id?: string }) {
  const M = placer(pl);
  const { cx, cy, rx, ry } = TUBE;
  const n = 64;
  const outer = ellipsePts(cx, cy, rx, ry, -Math.PI / 2, (3 * Math.PI) / 2, n).map((p) => M(p));
  const inner = ellipsePts(cx, cy, 5.5, ry - 9, -Math.PI / 2, (3 * Math.PI) / 2, n).map((p) => M(p));
  return (
    <Part id={id}>
      <Cells outer={outer} inner={inner} n={detail >= 2 ? 40 : 26} fill={C.neural} pseudo seed={7} nucleus="rgba(10,16,48,0.7)" />
      <path d={smoothPath(inner.slice(0, -1), true, 0.5)} fill="#0b1026" />
    </Part>
  );
}

export function Notochord({ pl, id = 'notokorda' }: { pl: Place; id?: string }) {
  const [x, y] = placer(pl)([NOTO.cx, NOTO.cy]);
  const r = NOTO.r * pl.k;
  return (
    <Part id={id}>
      <circle cx={f1(x)} cy={f1(y)} r={f1(r)} fill={C.notochord} stroke="#5b21b6" strokeWidth={1} />
      {[0, 1, 2, 3, 4, 5].map((j) => {
        const a = (j / 6) * Math.PI * 2 + 0.3;
        return <circle key={j} cx={f1(x + Math.cos(a) * r * 0.55)} cy={f1(y + Math.sin(a) * r * 0.55)} r={f1(r * 0.22)} fill="#4c1d95" opacity={0.7} />;
      })}
      <circle cx={f1(x - r * 0.3)} cy={f1(y - r * 0.3)} r={f1(r * 0.35)} fill="#e9d5ff" opacity={0.35} />
    </Part>
  );
}

export function Aortae({ pl, id = 'aorta-dortsalak' }: { pl: Place; id?: string }) {
  const M = placer(pl);
  const r = AORTA.r * pl.k;
  return (
    <Part id={id}>
      {([1, -1] as const).map((sd) => {
        const [x, y] = M([AORTA.cx, AORTA.cy], sd);
        return (
          <g key={sd}>
            <circle cx={f1(x)} cy={f1(y)} r={f1(r)} fill="#3a0a10" stroke="#e05252" strokeWidth={Math.max(1.2, 0.22 * r)} />
            {[0, 1, 2, 3].map((j) => (
              <ellipse key={j} cx={f1(x + (rand(j * 3.3 + sd) - 0.5) * r)} cy={f1(y + (rand(j * 7.1 + sd) - 0.5) * r)} rx={f1(r * 0.2)} ry={f1(r * 0.14)} fill="#dc2626" />
            ))}
          </g>
        );
      })}
    </Part>
  );
}
