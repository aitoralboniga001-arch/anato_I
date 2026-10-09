'use client';

import { C, Part, clamp, lerp, type Pt } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';

/**
 * Trunk-level transverse section of the lateral (transverse) fold — Langman fig. 6-19 A–C and the
 * notes' fig. 10 — built as a real, continuous morph of the germ layers.
 *
 * Like the week-4 mesoderm conceptus, the section is two continuous "spines":
 *  - TOP spine = the boundary of the amniotic cavity: the dorsal surface of the embryo from the
 *    midline out to the edge of the lateral body wall, a U-turn, then the inner surface of the amnion
 *    back over the embryo. Its bands: ectoderm → amnioblasts, parietal layer → extra-embryonic
 *    somatic mesoderm (the coat of the amnion).
 *  - BOTTOM spine = the boundary of the gut / yolk-sac cavity: the endoderm from the gut roof out to
 *    the portal, then the vitelline duct and the yolk sac. Bands: endoderm, visceral layer →
 *    extra-embryonic splanchnic mesoderm (the coat of the yolk sac).
 * Folding is curvature: the body wall (somatopleure) and the endoderm (splanchnopleure) bend
 * ventrally and medially by integrating a heading that grows with the fold, so every layer keeps
 * touching its neighbours at every moment. The intra-embryonic coelom opens between the parietal and
 * visceral layers and, until the walls meet, runs straight into the chorionic cavity.
 *
 * `f` is the fold (0 flat disc … 0.9 at the level of the midgut: walls at the vitelline duct);
 * `lam` slides the section just caudal to the umbilical region, where the walls fuse, the gut tube
 * closes and hangs from the dorsal mesentery, and the coelom is isolated (fig. 6-19 C).
 */

const W0 = 236; // half-width of the flat disc
const U_RIB = 134; // lateral edge of the intermediate mesoderm: where the coelom (and the body wall) begins
const TE = 10; // surface ectoderm
const TA = 5; // amnioblasts
const TP = 11; // parietal / visceral layer
const TC = 6; // extra-embryonic mesoderm coat
const TEN = 9; // endoderm
const TYE = 7; // yolk-sac endoderm
const DA = 122; // gut roof (lumen side of the endoderm) under the midline
const DL = 62; // lumen side of the endoderm under the flat lateral plate
const ARCH = 0.55; // dorsal arching at full fold (rad)
const RT = 8; // radius of the U-turn where the body wall becomes the amnion
const S0W = 9; // half-width of the gut roof (where the mesentery hangs it)
const RG = 26; // gut-tube radius
const HWD = 11; // half-width of the vitelline duct lumen
const STEP = 2;

const sm = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
const f1 = (v: number) => Math.round(v * 10) / 10;
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];
const mirror = (p: Pt): Pt => [-p[0], p[1]];

/** Target heading of the body wall at full fold, along its normalised length q: turn down, run down, turn medially, run to the midline. */
const H1 = (q: number) => ARCH + (Math.PI / 2 - ARCH) * sm(q / 0.3) + (Math.PI / 2) * sm((q - 0.38) / 0.36);

/** Heading of the top spine (dorsal surface → body wall) at arc length u, fold f, wall length lw. */
function topHeading(u: number, f: number, lw: number) {
  if (u <= U_RIB) return f * ARCH * (u / U_RIB);
  return f * ARCH + f * (H1((u - U_RIB) / lw) - ARCH);
}

/** Integrate a heading function into samples (p, tangent angle). */
function integrate(start: Pt, heading: (u: number) => number, L: number) {
  const n = Math.max(2, Math.ceil(L / STEP));
  const ds = L / n;
  const ps: Pt[] = [start];
  const hs: number[] = [heading(0)];
  for (let i = 0; i < n; i++) {
    const h0 = heading(i * ds);
    const h1 = heading((i + 1) * ds);
    const m = (h0 + h1) / 2;
    ps.push([ps[i][0] + Math.cos(m) * ds, ps[i][1] + Math.sin(m) * ds]);
    hs.push(h1);
  }
  return { ps, hs, ds, L };
}
type Track = ReturnType<typeof integrate>;
const at = (tr: Track, u: number) => {
  const x = clamp(u / tr.ds, 0, tr.ps.length - 1);
  const i = Math.min(tr.ps.length - 2, Math.floor(x));
  const r = x - i;
  return { p: [lerp(tr.ps[i][0], tr.ps[i + 1][0], r), lerp(tr.ps[i][1], tr.ps[i + 1][1], r)] as Pt, h: lerp(tr.hs[i], tr.hs[i + 1], r) };
};

/** Full-fold wall length chosen so the two walls meet at the ventral midline. */
const LW1 = (() => {
  const root = integrate([0, 0], (u) => ARCH * (u / U_RIB), U_RIB).ps.at(-1)!;
  let ix = 0;
  const N = 400;
  for (let i = 0; i < N; i++) ix += Math.cos(H1((i + 0.5) / N)) / N;
  return (0 - root[0]) / ix;
})();

/** Catmull-Rom through key points. */
function spline(keys: Pt[], per = 6): Pt[] {
  const k = keys.filter((q, i) => i === 0 || Math.hypot(q[0] - keys[i - 1][0], q[1] - keys[i - 1][1]) > 0.8);
  if (k.length < 3) return k;
  const out: Pt[] = [];
  for (let i = 0; i < k.length - 1; i++) {
    const p0 = k[Math.max(0, i - 1)];
    const p1 = k[i];
    const p2 = k[i + 1];
    const p3 = k[Math.min(k.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const u = j / per;
      const u2 = u * u;
      const u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  out.push(k[k.length - 1]);
  return out;
}

function smoothPts(pts: Pt[], k: number, keepEnds = true): Pt[] {
  return pts.map((q, i) => {
    if (keepEnds && (i === 0 || i === pts.length - 1)) return q;
    let x = 0;
    let y = 0;
    let w = 0;
    for (let j = -k; j <= k; j++) {
      const p = pts[clamp(i + j, 0, pts.length - 1)];
      x += p[0];
      y += p[1];
      w++;
    }
    return [x / w, y / w];
  });
}

/** Unit normals of a polyline, rotated from the tangent by `side` (+1: (−ty, tx); −1: (ty, −tx)). */
function normalsOf(pts: Pt[], side: 1 | -1): Pt[] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return side > 0 ? [-dy / l, dx / l] : [dy / l, -dx / l];
  });
}

export interface Spine {
  pts: Pt[];
  n: Pt[];
  a: number[];
  b: number[];
  /** index ranges */
  iBody: number; // top: last body sample (wall edge) / bottom: portal
  iTurn: number; // top: last U-turn sample / bottom: first sac sample
}

const offPt = (sp: Spine, i: number, d: number): Pt => add(sp.pts[i], sp.n[i], d);

export function foldXGeo(f: number, lam: number) {
  const ff = clamp(f + 0.1 * lam);
  // ---------------- top spine (right half; body part)
  const lw = lerp(W0 - U_RIB, LW1, ff ** 1.4);
  const LT = U_RIB + lw;
  const top = integrate([0, 0], (u) => topHeading(u, ff, lw), LT);
  const nT = (u: number): Pt => {
    const h = at(top, u).h;
    return [-Math.sin(h), Math.cos(h)];
  };
  /** Body coordinates (arc length along the dorsal surface, depth under it) → local plane. */
  const mapT = (u: number, d: number): Pt => add(at(top, u).p, nT(u), d);

  // ---------------- bottom spine (gut part)
  const mes = 30 * sm((ff - 0.62) / 0.33); // dorsal mesentery length
  const S0: Pt = mapT(0, DA + mes);
  const LB0 = W0 - 7;
  const LB1 = 2 * S0W + Math.PI * RG;
  const wG = ff ** 1.3;
  const LB = lerp(LB0, LB1, wG);
  const h0 = (u: number) => {
    const x = clamp((u - 92) / 80);
    return Math.atan((-(DA - DL) * 1.32 * 6 * x * (1 - x)) / 80);
  };
  const h1 = (u: number) => Math.PI * clamp((u - S0W) / (Math.PI * RG));
  const bot = integrate(S0, (u) => (1 - wG) * h0(u) + wG * h1(u), LB);
  // The two portals stop at the vitelline duct (midgut level) until the section moves caudally and the tube closes.
  const xMin = lerp(HWD + 1, 0, sm((ff - 0.9) / 0.1));
  const iCut = bot.ps.findIndex((p, i) => bot.hs[i] > Math.PI / 2 && p[0] <= xMin);
  if (iCut > 0) {
    const a0 = bot.ps[iCut - 1];
    const a1 = bot.ps[iCut];
    const r = (a0[0] - xMin) / (a0[0] - a1[0] || 1);
    bot.ps.splice(iCut, bot.ps.length, [xMin, lerp(a0[1], a1[1], r)]);
    bot.hs.splice(iCut, bot.hs.length, lerp(bot.hs[iCut - 1], bot.hs[iCut], r));
  }
  const Pr = bot.ps.at(-1)!;
  const hEnd = bot.hs.at(-1)!;

  // ---------------- vitelline duct + yolk sac (from the portal)
  const half = Math.max(0, Pr[0]);
  const hw = Math.min(half, lerp(half, HWD, sm((ff - 0.25) / 0.55)));
  const Ld = 118 * sm((ff - 0.3) / 0.55);
  const grow = sm(ff / 0.85);
  const rxs = lerp(W0 + 6, 72, grow);
  const rys = lerp(118, 68, grow);
  const dStart: Pt = [lerp(Pr[0], HWD, lam), Pr[1] + 4 * lam];
  const dHw = lerp(hw, HWD, lam);
  const mouthY = dStart[1];
  const Bc: Pt = [0, mouthY + Ld + rys * 0.9];
  const E = (a: number): Pt => [rxs * Math.sin(a), Bc[1] - rys * Math.cos(a)];
  const aj = Math.asin(clamp(dHw / rxs, 0, 0.999));
  const dir: Pt = [Math.cos(hEnd), Math.sin(hEnd)];
  const corner = 1 - sm(ff / 0.45);
  const duct = spline(
    [
      dStart,
      add(dStart, dir, 6 * corner * (1 - lam) + 0.01),
      [lerp(dStart[0] + 8, dHw, 1 - corner), mouthY + 12 + Ld * 0.3],
      add(E(aj), [0, -1], Math.min(12, 4 + Ld * 0.15)),
      E(aj),
    ],
    5,
  );
  const sac: Pt[] = [];
  for (let a = aj + 0.06; a <= Math.PI + 1e-6; a += 0.07) sac.push(E(a));
  sac.push(E(Math.PI));

  // ---------------- top spine (U-turn + amnion back to the dorsal midline)
  // Below the umbilical region the walls fuse: the U-turns shrink to a point at the ventral midline (the
  // section grazes the umbilical ring), then the amnion lets go and surrounds the body.
  const closeK = sm(lam / 0.6);
  const sepK = sm((lam - 0.6) / 0.4);
  const E0 = top.ps.at(-1)!;
  const hE = top.hs.at(-1)!;
  const tE: Pt = [Math.cos(hE), Math.sin(hE)];
  const nE = nT(LT);
  const rt = Math.max(0.01, RT * (1 - closeK));
  const Cu = add(E0, nE, -rt);
  const turn: Pt[] = [];
  const turnN: Pt[] = [];
  if (sepK <= 0)
    for (let i = 1; i <= 8; i++) {
      const ph = (i / 8) * Math.PI;
      const v = add(add([0, 0], nE, Math.cos(ph)), tE, Math.sin(ph));
      turn.push(add(Cu, v, rt));
      turnN.push(v);
    }
  const gapF = lerp(20, 30, ff);
  const gEnd = sepK > 0 ? gapF * sepK : 2 * rt;
  const domeH = lerp(150, 14, sm(ff / 0.9));
  const amnRaw: Pt[] = [];
  for (let u = sepK > 0 ? LT : LT - 2; u >= 0; u -= 3) {
    const e = LT - u;
    const g = gEnd + (gapF - gEnd) * sm(e / 60) + domeH * Math.sqrt(clamp(1 - (u / LT) ** 2)) * sm(e / 90);
    amnRaw.push(mapT(u, -g));
  }
  // The dome's top meets its mirror horizontally at the midline.
  const last = amnRaw.at(-1)!;
  amnRaw.push([0, last[1]]);
  const amn = smoothPts(amnRaw, 3);
  if (sepK > 0) amn[0] = [0, amn[0][1]];

  const topPts = [...top.ps, ...turn, ...amn];
  const iBodyT = top.ps.length - 1;
  const iTurnT = iBodyT + turn.length;
  const nTop: Pt[] = [...top.hs.map((h): Pt => [-Math.sin(h), Math.cos(h)]), ...turnN, ...normalsOf(amn, 1)];
  const aT: number[] = [];
  const bT: number[] = [];
  topPts.forEach((_, i) => {
    if (i <= iBodyT) {
      const u = i * top.ds;
      const tip = sm((u - (LT - 30)) / 30) * (1 - closeK);
      aT.push(lerp(TE, TA, tip));
      bT.push(sm((u - U_RIB) / 8) * lerp(TP, TC, tip));
    } else {
      aT.push(TA);
      bT.push(TC);
    }
  });
  const topSp: Spine = { pts: topPts, n: nTop, a: aT, b: bT, iBody: iBodyT, iTurn: iTurnT };

  // ---------------- bottom spine (gut → duct → sac)
  const uRoot = lerp(U_RIB, S0W + 1, sm((ff - 0.3) / 0.6));
  const bridge = Math.hypot(dStart[0] - Pr[0], dStart[1] - Pr[1]) > 1.5;
  const ductPts = bridge ? duct : duct.slice(1);
  const ductSac = [...ductPts, ...sac];
  const botPts = [...bot.ps, ...ductSac];
  const iPortal = bot.ps.length - 1;
  const iSac = iPortal + ductPts.length;
  const nBot: Pt[] = [...bot.hs.map((h): Pt => [Math.sin(h), -Math.cos(h)]), ...normalsOf(bridge ? ductSac : [Pr, ...ductSac], -1).slice(bridge ? 0 : 1)];
  const aB: number[] = [];
  const bB: number[] = [];
  botPts.forEach((_, i) => {
    if (i <= iPortal) {
      const u = i * bot.ds;
      aB.push(TEN);
      bB.push(TP * sm((u - uRoot) / 8));
    } else {
      const k = sm((i - iPortal) / 4);
      aB.push(lerp(TEN, TYE, k));
      bB.push(lerp(TP, TC, k));
    }
  });
  const botSp: Spine = { pts: botPts, n: nBot, a: aB, b: bB, iBody: iPortal, iTurn: iSac };

  // ---------------- axial structures (body coordinates of the top spine)
  const tubeC = mapT(0, 50);
  const noto = mapT(0, 101);
  const aorta = mapT(44, 101);
  const somite = mapT(84, 52);
  const somiteRot = (at(top, 84).h * 180) / Math.PI;
  const DB = lerp(DL - TEN - TP - 2, 114, sm((ff - 0.3) / 0.6));
  const iRoot = Math.round(uRoot / bot.ds);
  const coatAt = (i: number) => offPt(botSp, i, botSp.a[i] + botSp.b[i]);
  const ribTop = mapT(U_RIB, TE + TP);
  const wMed = sm((ff - 0.3) / 0.6);
  const closing = spline(
    [ribTop, mapT(U_RIB - 4, lerp(TE + TP + 10, DB - 6, wMed)), mapT(lerp(U_RIB - 8, 40, wMed), DB), mapT(lerp(U_RIB - 10, S0W + 1, wMed), lerp(DB, DB + 4, wMed)), coatAt(iRoot)],
    5,
  );

  return { bridge, sepK, ff, lam, LT, lw, top, mapT, nT, bot, S0, Pr, mes, topSp, botSp, iRoot, uRoot, closing, tubeC, noto, aorta, somite, somiteRot, hw: dHw, Ld, sacC: Bc, rxs, rys, duct, sac, E0, mouthY };
}
export type FoldX = ReturnType<typeof foldXGeo>;

/** Label anchors (local plane, right half; mirror for the left gutter). */
export function foldXAnchors(g: FoldX) {
  const { topSp, botSp, mapT, lw } = g;
  const wallU = (q: number) => U_RIB + q * lw;
  const iWall = (q: number) => Math.round(wallU(q) / g.top.ds);
  // Amniotic cavity: halfway between the dorsal surface and the amnion, over the somites.
  const iA = Math.round(70 / g.top.ds);
  const amnStart = topSp.iTurn + 1;
  let best = amnStart;
  for (let i = amnStart; i < topSp.pts.length; i++)
    if (Math.hypot(topSp.pts[i][0] - topSp.pts[iA][0], topSp.pts[i][1] - topSp.pts[iA][1]) < Math.hypot(topSp.pts[best][0] - topSp.pts[iA][0], topSp.pts[best][1] - topSp.pts[iA][1])) best = i;
  const amnion: Pt = [(topSp.pts[iA][0] + topSp.pts[best][0]) / 2, (topSp.pts[iA][1] + topSp.pts[best][1]) / 2];
  // Coelom: from the parietal coat a third of the way down the wall, halfway to the nearest visceral coat.
  const iw = iWall(0.32);
  const pc = offPt(topSp, iw, topSp.a[iw] + topSp.b[iw]);
  let near = g.iRoot;
  let dn = 1e9;
  for (let i = g.iRoot; i <= botSp.iBody; i++) {
    const q = offPt(botSp, i, botSp.a[i] + botSp.b[i]);
    const d = Math.hypot(q[0] - pc[0], q[1] - pc[1]);
    if (d < dn) {
      dn = d;
      near = i;
    }
  }
  const vc = offPt(botSp, near, botSp.a[near] + botSp.b[near]);
  const coelom: Pt = dn > 6 ? [(pc[0] + vc[0]) / 2, (pc[1] + vc[1]) / 2] : pc;
  const iv = Math.round(lerp(g.iRoot, botSp.iBody, 0.55));
  const ig = Math.round(botSp.iBody * 0.62);
  const iD = Math.round((botSp.iBody + botSp.iTurn) / 2);
  const iS = Math.round(lerp(botSp.iTurn, botSp.pts.length - 1, 0.3));
  // Chorionic cavity: beside the yolk sac's neck, under the edge of the body (outside amnion and sac).
  const sh = botSp.pts[botSp.iTurn];
  const chorion: Pt = [sh[0] + 26, sh[1] - 4];
  return {
    amnion,
    ecto: offPt(topSp, iWall(0.08), 4.5),
    edge: g.E0,
    parietal: offPt(topSp, iWall(0.42), topSp.a[iWall(0.42)] + topSp.b[iWall(0.42)] * 0.5),
    visceral: offPt(botSp, iv, botSp.a[iv] + botSp.b[iv] * 0.5),
    coelom,
    gut: offPt(botSp, ig, botSp.a[ig] * 0.5),
    duct: offPt(botSp, iD, botSp.a[iD] * 0.5),
    yolk: offPt(botSp, iS, botSp.a[iS] * 0.5),
    chorion,
    tube: mapT(26, 48),
    somite: mapT(84, 40),
    noto: g.noto,
    aorta: g.aorta,
    meso: mapT(118, 70),
    mesentery: mapT(0, DA + g.mes * 0.45),
    wallMid: offPt(topSp, iWall(0.32), 12),
  };
}

/** Screen placement: fit the embryo + amnion into the frame (the yolk sac may run off the bottom while it is huge). */
export function foldXScreen(g: FoldX) {
  const pts = [...g.topSp.pts, ...g.botSp.pts.slice(0, g.botSp.iTurn)];
  const xs = pts.map((p) => Math.abs(p[0]));
  const ys = pts.map((p) => p[1]);
  const wHalf = Math.max(...xs) + 8;
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys, g.sacC[1] + g.rys * lerp(1, 0.25, g.lam)) + 8;
  const k = clamp(Math.min(290 / wHalf, 518 / (y1 - y0)), 0.7, 1.35);
  const cy = 40 + 4 + ((y1 - y0) * k) / 2;
  const my = (y0 + y1) / 2;
  return { k, X: (p: Pt): Pt => [500 + k * p[0], Math.max(cy, 300) + k * (p[1] - my)] };
}

const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

/** A cell band of a spine between offsets d0(i)..d1(i), over samples [i0, i1], both sides. */
function band(sp: Spine, i0: number, i1: number, d0: (i: number) => number, d1: (i: number) => number, X: (p: Pt) => Pt, side: 1 | -1) {
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = i0; i <= i1; i++) {
    const o = offPt(sp, i, d0(i));
    const n = offPt(sp, i, d1(i));
    outer.push(X(side > 0 ? o : mirror(o)));
    inner.push(X(side > 0 ? n : mirror(n)));
  }
  return { outer, inner };
}
const bandLen = (pts: Pt[]) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
};

export interface FoldXIds {
  ectoderm: string;
  coelom: string;
}

/** The section drawing (no labels). */
export function FoldXDrawing({ g, X, k, ghost }: { g: FoldX; X: (p: Pt) => Pt; k: number; ghost: number }) {
  const { topSp, botSp } = g;
  const both = (pts: Pt[]) => [pts.map(X), pts.map((p) => X(mirror(p)))];
  const loop = (right: Pt[]) => [...right.map(X), ...right.slice().reverse().map((p) => X(mirror(p)))];

  // Amniotic cavity: the whole top spine and its mirror.
  const amnCav = loop(topSp.pts);
  // Gut lumen (closed tube once the walls fuse) and the duct + yolk-sac lumen.
  const gutPts = botSp.pts.slice(0, botSp.iBody + 1);
  const sacPts = botSp.pts.slice(botSp.iBody + 1);
  const lumen = g.lam < 0.5 ? loop(botSp.pts) : loop(gutPts);
  const sacLumen = loop(sacPts);

  // Axial mesenchyme (right half): under the dorsal ectoderm to the intermediate mesoderm, down the coelom's medial wall, back along the gut roof.
  const iRib = Math.round(U_RIB / g.top.ds);
  const axialR: Pt[] = [
    ...Array.from({ length: iRib + 1 }, (_, i) => offPt(topSp, i, topSp.a[i])),
    ...g.closing,
    ...Array.from({ length: g.iRoot + 1 }, (_, j) => offPt(botSp, g.iRoot - j, botSp.a[g.iRoot - j])),
  ];
  const axial = loop(axialR);

  // Intra-embryonic coelom (right half): parietal coat → (opening | midline) → visceral coat → medial wall.
  const iTE = topSp.iBody;
  const coelR: Pt[] = [
    ...Array.from({ length: iTE - iRib + 1 }, (_, j) => offPt(topSp, iRib + j, topSp.a[iRib + j] + topSp.b[iRib + j])),
    ...Array.from({ length: botSp.iBody - g.iRoot + 1 }, (_, j) => {
      const i = botSp.iBody - j;
      return offPt(botSp, i, botSp.a[i] + botSp.b[i]);
    }),
    ...g.closing.slice().reverse(),
  ];

  const ghostO = 1 - 0.72 * ghost;
  // The yolk sac's neck becomes the vitelline duct: same cells, the name (and the part) changes over.
  const ductK = sm((g.ff - 0.45) / 0.25);

  const cellsN = (pts: Pt[], w: number) => Math.max(2, Math.round(bandLen(pts) / (w * k)));
  const sides = [1, -1] as const;

  return (
    <g>
      {/* Chorionic cavity (extra-embryonic coelom) around everything: the same dark space as the intra-embryonic coelom. */}
      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={0} width={1000} height={640} fill="#160f1c" />
        <rect x={0} y={0} width={1000} height={640} fill="url(#w4x-vignette)" />
      </Part>
      <defs>
        <radialGradient id="w4x-vignette" cx="50%" cy="46%" r="62%">
          <stop offset="55%" stopColor="#0f0f11" stopOpacity={0} />
          <stop offset="100%" stopColor="#0f0f11" stopOpacity={0.92} />
        </radialGradient>
        <linearGradient id="w4x-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.18} />
        </linearGradient>
      </defs>

      {/* Yolk sac + vitelline duct (beyond the plane once the section has moved caudally). */}
      <g opacity={ghostO}>
        <Part id="bitelo-zaku-sekundarioa">
          <path d={poly(g.lam < 0.5 ? lumen : sacLumen)} fill="#2b2413" />
          <path d={poly(g.lam < 0.5 ? lumen : sacLumen)} fill="url(#g-cavity)" />
          {sides.map((s) => {
            const i0 = ductK > 0.98 ? botSp.iTurn - 1 : g.bridge ? botSp.iBody + 1 : botSp.iBody;
            const e = band(botSp, i0, botSp.pts.length - 1, () => 0, (i) => botSp.a[i], X, s);
            const c = band(botSp, i0, botSp.pts.length - 1, (i) => botSp.a[i], (i) => botSp.a[i] + botSp.b[i], X, s);
            return (
              <g key={s}>
                <Cells outer={c.inner} inner={c.outer} n={cellsN(c.outer, 13)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.55)" edge="rgba(150,70,50,0.25)" seed={70 + s} />
                <Cells outer={e.inner} inner={e.outer} n={cellsN(e.outer, 8)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={72 + s} />
              </g>
            );
          })}
        </Part>
        <Part id="hodi-onfalomesenterikoa" show={ductK}>
          {sides.map((s) => {
            const i0 = g.bridge ? botSp.iBody + 1 : botSp.iBody;
            const i1 = botSp.iTurn;
            const e = band(botSp, i0, i1, () => 0, (i) => botSp.a[i], X, s);
            const c = band(botSp, i0, i1, (i) => botSp.a[i], (i) => botSp.a[i] + botSp.b[i], X, s);
            return (
              <g key={s}>
                <Cells outer={c.inner} inner={c.outer} n={cellsN(c.outer, 11)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.55)" edge="rgba(150,70,50,0.25)" seed={74 + s} />
                <Cells outer={e.inner} inner={e.outer} n={cellsN(e.outer, 7)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={76 + s} />
              </g>
            );
          })}
        </Part>
      </g>

      {/* Amniotic cavity (fluid between the embryo and the amnion). */}
      <Part id="amnios-barrunbea" quiet>
        <path d={poly(amnCav)} fill="rgba(110,170,255,0.13)" />
      </Part>

      {/* Gut lumen once closed (its own tube). */}
      {g.lam >= 0.5 && (
        <Part id="erdiko-hestea">
          <path d={poly(lumen)} fill="#2b2413" />
        </Part>
      )}

      {/* Intra-embryonic mesoderm of the axis (mesenchyme) — somites, aortae, notochord and tube sit in it. */}
      <Part id="mesodermo-intraenbrionarioa" quiet>
        <path d={poly(axial)} fill="#6b2833" />
        <path d={poly(axial)} fill="url(#p-meso-intra)" opacity={0.28} />
      </Part>

      {/* Intra-embryonic coelom: dark like the chorionic cavity it opens into; isolated once the walls fuse. */}
      <Part id="enbrioi-barruko-zeloma">
        {sides.map((s) => (
          <path key={s} d={poly(coelR.map((p) => X(s > 0 ? p : mirror(p))))} fill="#160f1c" />
        ))}
      </Part>

      {/* Dorsal mesentery: the two visceral layers back to back, hanging the gut from the dorsal body wall. */}
      {g.mes > 1 && (
        <Part id="mesenterio-dortsala" show={sm((g.mes - 2) / 14)}>
          {(() => {
            // Double sheet of splanchnic mesoderm: waisted in the middle, flaring into the body wall and onto the gut.
            const top = g.mapT(S0W + 1, 112);
            const bot = offPt(botSp, g.iRoot, TEN + TP);
            const ctl: Pt = [3.2, (top[1] + bot[1]) / 2];
            const side = Array.from({ length: 11 }, (_, i) => {
              const u = i / 10;
              return [(1 - u) * (1 - u) * top[0] + 2 * (1 - u) * u * ctl[0] + u * u * bot[0], (1 - u) * (1 - u) * top[1] + 2 * (1 - u) * u * ctl[1] + u * u * bot[1]] as Pt;
            });
            const outline = [...side, ...side.slice().reverse().map(mirror)].map(X);
            return (
              <>
                <path d={poly(outline)} fill={C.mesoLateral} opacity={0.82} />
                <path d={poly(outline)} fill="url(#p-meso-intra)" opacity={0.25} />
                <path d={`M${f1(X([0, top[1] + 3])[0])},${f1(X([0, top[1] + 3])[1])}L${f1(X([0, bot[1] - 3])[0])},${f1(X([0, bot[1] - 3])[1])}`} stroke="rgba(90,20,24,0.5)" strokeWidth={0.8} />
              </>
            );
          })()}
        </Part>
      )}

      {/* Somites (epithelial balls of paraxial mesoderm): their growth pushes the walls down. */}
      <Part id="somitak">
        {sides.map((s) => {
          const c = X(s > 0 ? g.somite : mirror(g.somite));
          const rot = s * g.somiteRot;
          const ringPts = (rx: number, ry: number) =>
            Array.from({ length: 33 }, (_, i): Pt => {
              const a = (i / 32) * Math.PI * 2;
              const x = rx * Math.cos(a);
              const y = ry * Math.sin(a);
              const r = (rot * Math.PI) / 180;
              return [c[0] + k * (x * Math.cos(r) - y * Math.sin(r)), c[1] + k * (x * Math.sin(r) + y * Math.cos(r))];
            });
          return <Cells key={s} outer={ringPts(34, 29)} inner={ringPts(14, 11)} n={22} fill={C.mesoParaxial} nucleus="rgba(80,6,18,0.7)" pseudo seed={60 + s} />;
        })}
      </Part>

      <Part id="aorta-dortsalak">
        {sides.map((s) => {
          const [x, y] = X(s > 0 ? g.aorta : mirror(g.aorta));
          return (
            <g key={s}>
              <circle cx={x} cy={y} r={10 * k} fill="#f3d4d8" />
              <circle cx={x} cy={y} r={7.6 * k} fill="#b3122a" />
              <circle cx={x - 2 * k} cy={y - 2 * k} r={2.6 * k} fill="#ff6b7d" opacity={0.7} />
            </g>
          );
        })}
      </Part>

      <Part id="notokorda">
        {(() => {
          const [x, y] = X(g.noto);
          const r = 9 * k;
          return (
            <g>
              <circle cx={x} cy={y} r={r} fill={C.notochord} stroke="#5b21b6" strokeWidth={1} />
              {[0, 1, 2, 3, 4].map((j) => {
                const a = (j / 5) * Math.PI * 2 + 0.4;
                return <circle key={j} cx={x + Math.cos(a) * r * 0.52} cy={y + Math.sin(a) * r * 0.52} r={r * 0.24} fill="#4c1d95" opacity={0.7} />;
              })}
              <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.25} fill="#e9d5ff" opacity={0.55} />
            </g>
          );
        })()}
      </Part>

      {/* Neural tube (already closed at trunk level): pseudostratified wall round the central canal. */}
      <Part id="hodi-neurala">
        {(() => {
          const c = X(g.tubeC);
          const ring = (rx: number, ry: number) => Array.from({ length: 41 }, (_, i): Pt => [c[0] + k * rx * Math.sin((i / 40) * Math.PI * 2), c[1] - k * ry * Math.cos((i / 40) * Math.PI * 2)]);
          return (
            <g>
              <path d={poly(ring(29, 37))} fill={C.neural} />
              <Cells outer={ring(29, 37)} inner={ring(6, 17)} n={30} fill={C.neural} nucleus="rgba(10,16,48,0.7)" pseudo seed={41} />
              <path d={poly(ring(6, 17))} fill="#0c1428" />
            </g>
          );
        })()}
      </Part>

      {/* Visceral (splanchnic) layer on the gut, then the endoderm. */}
      <Part id="errai-orria">
        {sides.map((s) => {
          const c = band(botSp, g.iRoot, botSp.iBody, (i) => botSp.a[i], (i) => botSp.a[i] + botSp.b[i], X, s);
          return <Cells key={s} outer={c.inner} inner={c.outer} n={cellsN(c.outer, 11)} fill={C.mesoLateral} nucleus="rgba(120,20,20,0.6)" edge="rgba(110,20,30,0.4)" seed={80 + s} />;
        })}
      </Part>
      <Part id={g.ff > 0.68 ? 'erdiko-hestea' : 'endodermoa'}>
        {sides.map((s) => {
          const e = band(botSp, 0, botSp.iBody, () => 0, (i) => botSp.a[i], X, s);
          return <Cells key={s} outer={e.inner} inner={e.outer} n={cellsN(e.outer, 8)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={82 + s} />;
        })}
      </Part>

      {/* Body wall (somatopleure): parietal layer under the surface ectoderm. */}
      <Part id="paretako-orria">
        {sides.map((s) => {
          const i0 = Math.round(U_RIB / g.top.ds);
          const c = band(topSp, i0, topSp.iBody, (i) => topSp.a[i], (i) => topSp.a[i] + topSp.b[i], X, s);
          return <Cells key={s} outer={c.outer} inner={c.inner} n={cellsN(c.outer, 11)} fill={C.mesoLateral} nucleus="rgba(120,20,20,0.6)" edge="rgba(110,20,30,0.4)" seed={84 + s} />;
        })}
      </Part>
      <Part id="ektodermoa">
        {sides.map((s) => {
          const e = band(topSp, 0, topSp.iBody, () => 0, (i) => topSp.a[i], X, s);
          return <Cells key={s} outer={e.outer} inner={e.inner} n={cellsN(e.outer, 8)} fill={C.surfaceEcto} nucleus="rgba(20,40,110,0.7)" seed={86 + s} />;
        })}
      </Part>

      {/* Amnion: amnioblasts lining the cavity, extra-embryonic somatic mesoderm outside (continuous with the parietal layer at the wall's edge). */}
      <Part id="enbrioi-kanpoko-mesodermoa" quiet>
        {sides.map((s) => {
          const c = band(topSp, topSp.iBody + (g.sepK > 0 ? 1 : 0), topSp.pts.length - 1, (i) => topSp.a[i], (i) => topSp.a[i] + topSp.b[i], X, s);
          return <Cells key={s} outer={c.outer} inner={c.inner} n={cellsN(c.outer, 14)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.55)" edge="rgba(150,70,50,0.25)" seed={88 + s} />;
        })}
      </Part>
      <Part id="amnios-barrunbea">
        {sides.map((s) => {
          const e = band(topSp, topSp.iBody + (g.sepK > 0 ? 1 : 0), topSp.pts.length - 1, () => 0, (i) => topSp.a[i], X, s);
          return <Cells key={s} outer={e.outer} inner={e.inner} n={cellsN(e.outer, 10)} fill={C.amnioblast} nucleus="rgba(30,60,140,0.6)" seed={90 + s} />;
        })}
      </Part>

      {/* Light from the top left over the whole embryo (one cheap gradient, no filter). */}
      <path d={poly(loop([...topSp.pts.slice(0, topSp.iBody + 1), ...botSp.pts.slice(0, botSp.iBody + 1).reverse()]))} fill="url(#w4x-light)" pointerEvents="none" />
    </g>
  );
}
