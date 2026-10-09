'use client';

import type { ReactNode } from 'react';
import { C, Journey, Label, Note, Part, clamp, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { LitCell, LitDefs, ellipsePath } from '@/components/scenes/week3/gastroKit';
import { Cells } from '@/components/scenes/section/Section';
import { AORTA, Aortae, NOTO, NeuralTube, Notochord, SOMITE, TE, TP, TUBE, TrunkSection, catmull, ellipsePts, f1, inPoly, off, placer, skinIn, trunkGeom, type Place, type Trunk } from './trunk';

/**
 * `somitaren-bereizketa` (Langman fig. 6-12 A–D, notes w4 §3.1).
 *  A  The somite is an epithelial ball (radial cells round a small cavity, the somitocoel).
 *  B  Its ventral and medial walls lose their epithelial arrangement: loose mesenchymal cells, the
 *     sclerotome, which multiply and migrate medially to surround the notochord and neural tube.
 *     The dorsal wall stays as an epithelial plate under the ectoderm: the dermomyotome.
 *  C  The plate's middle becomes the dermatome (→ dermis of the back); the cells of its two lips
 *     (dorsomedial and ventrolateral) slip under it and form the myotome (→ striated muscle). Some
 *     ventrolateral-lip cells migrate into the parietal layer of the body wall (limb / wall muscle).
 *  D  Sclerotome condenses into cartilage: vertebral body round the notochord, neural arches round
 *     the tube, costal processes growing into the body wall as ribs.
 * Drawn on the shared trunk-section model (trunk.tsx) at one folding stage.
 */

// Step windows (week4b.ts beats): each change happens INSIDE its own step, never before it.
export const SB = { sclero: 0.12, migrate: 0.26, dermomyo: 0.4, dermato: 0.56, myo: 0.72, fate: 0.88 };
const E6 = 0.42;

function timing(t: number) {
  return {
    uniform: 1 - seg(t, SB.sclero, SB.sclero + 0.08),
    sc: seg(t, SB.sclero, SB.sclero + 0.08),
    mg: seg(t, SB.migrate, SB.migrate + 0.12),
    dm: seg(t, SB.dermomyo, SB.dermomyo + 0.08),
    dt: seg(t, SB.dermato, SB.dermato + 0.06),
    my: seg(t, SB.myo, SB.myo + 0.08),
    mo: seg(t, SB.myo + 0.01, SB.myo + 0.12),
    fa: seg(t, SB.fate, SB.fate + 0.07),
  };
}
type Tm = ReturnType<typeof timing>;

const SOM = C.mesoParaxial;
const SCLERO = '#d27a52';
const SCLERO_NUC = '#5a200e';
const DERMA = '#e8ab98';
const MYO = '#f2a33a';
const MYO_NUC = '#7a3b06';
const CART = '#a9c2d2';
const CART_EDGE = '#5f8196';

const ss = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
const lerpP = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

// ---------------------------------------------------------------- somite geometry (model space, right side)

const { cx: SX, cy: SY, rx: SRX, ry: SRY } = SOMITE;
const WALL = 11;
/** Dorsal arc (→ dermomyotome), from dorsomedial round the top to lateral; the rest is the sclerotome arc. */
const D0 = -2.75;
const D1 = 0.25;
const outerE = (a: number): Pt => [SX + SRX * Math.cos(a), SY + SRY * Math.sin(a)];
const innerE = (a: number): Pt => [SX + (SRX - WALL) * Math.cos(a), SY + (SRY - WALL) * Math.sin(a)];
const midE = (a: number): Pt => [SX + (SRX - WALL / 2) * Math.cos(a), SY + (SRY - WALL / 2) * Math.sin(a)];

/**
 * The flattened dorsal plate: top surface at s (0 = dorsomedial lip … 1 = ventrolateral lip) and its
 * thickness. As the lips differentiate (`lip` 0..1) they thicken and curl a little ventrally.
 */
const PLATE_T = 10;
const PX0 = 46;
const PX1 = 104;
const MYO_T = 10;
const bump = (s: number) => ss((0.2 - s) / 0.2) + ss((s - 0.8) / 0.2);
function plateTop(s: number, lip: number): Pt {
  const x = lerp(PX0, PX1, s);
  return [x, skinIn(x) + 4 + 4 * s + lip * bump(s) * 1.5];
}
const plateThk = (s: number, lip: number) => PLATE_T * (1 + 0.6 * lip * bump(s));
function plateLines(lip: number, s0 = 0, s1 = 1, n = 24) {
  const ss_ = Array.from({ length: n + 1 }, (_, i) => lerp(s0, s1, i / n));
  const top = ss_.map((q) => plateTop(q, lip));
  const nrm = ss_.map((q): Pt => {
    const a = plateTop(q - 0.01, lip);
    const b = plateTop(q + 0.01, lip);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  return { top, nrm, thk: ss_.map((q) => plateThk(q, lip)), s: ss_ };
}
/** Ventral surface of plate + myotome at x (where sclerotome cells must stay below). */
const plateBottomY = (x: number) => skinIn(x) + 4 + 4 * clamp((x - PX0) / (PX1 - PX0)) + PLATE_T * 1.4 + MYO_T;

// ---------------------------------------------------------------- sclerotome cells

const NF = 18; // founders: 14 from the ventral/medial walls + 4 from the somitocoel
const NC = 58; // after proliferation
const INTER = { cx: 104, cy: 108, rx: 11, ry: 14 };

function okTarget(x: number, y: number) {
  if (x < 3 || x > 112 || y > 156) return false;
  if (((x - TUBE.cx) / (TUBE.rx + 3.5)) ** 2 + ((y - TUBE.cy) / (TUBE.ry + 3.5)) ** 2 < 1) return false;
  if (Math.hypot(x - NOTO.cx, y - NOTO.cy) < NOTO.r + 3.5) return false;
  if (Math.hypot(x - AORTA.cx, y - AORTA.cy) < AORTA.r + 4) return false;
  if (y < skinIn(x) + 4) return false;
  if (x > PX0 - 6 && y < plateBottomY(Math.min(PX1, Math.max(PX0, x))) + 5) return false;
  if (((x - INTER.cx) / (INTER.rx + 4)) ** 2 + ((y - INTER.cy) / (INTER.ry + 4)) ** 2 < 1) return false;
  return true;
}

interface SCell {
  o: Pt; // origin (founder) or birth parent (daughter)
  tg: Pt;
  parent: number;
  birth: number;
  delay: number;
  bow: number;
}

const SCELLS: SCell[] = (() => {
  // Targets: round the notochord, along the side of the tube, and a lateral (costal) group.
  const tg: Pt[] = [];
  let s = 3;
  const zone = (n: number, gen: (u: number, v: number) => Pt) => {
    let got = 0;
    for (let tries = 0; got < n && tries < 4000; tries++) {
      const p = gen(rand(s++ * 1.7), rand(s++ * 2.9));
      if (!okTarget(p[0], p[1])) continue;
      if (tg.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 7)) continue;
      tg.push(p);
      got++;
    }
  };
  zone(18, (u, v) => {
    const a = lerp(-1.35, 1.75, u);
    const r = lerp(NOTO.r + 4, NOTO.r + 22, v);
    return [NOTO.cx + r * Math.cos(a), NOTO.cy + r * Math.sin(a)];
  });
  zone(26, (u, v) => {
    const a = lerp(-1.5, 1.05, u);
    const d = lerp(4, 17, v);
    return [TUBE.cx + (TUBE.rx + d) * Math.cos(a), TUBE.cy + (TUBE.ry + d) * Math.sin(a)];
  });
  zone(NC - tg.length, (u, v) => [lerp(46, 108, u), lerp(78, 104, v)]);
  // Founders' origins round the ventral/medial arc and in the cavity.
  const orig: Pt[] = [];
  for (let j = 0; j < 14; j++) orig.push(midE(lerp(D1, D0 + Math.PI * 2, (j + 0.5) / 14)));
  orig.push([SX - 6, SY - 3], [SX + 5, SY + 2], [SX - 2, SY + 7], [SX + 7, SY - 6]);
  // Assign: founders and targets sorted by angle round the somite centre (non-crossing routes).
  const wrap = (a: number) => (a < -Math.PI / 2 ? a + Math.PI * 2 : a);
  const ang = (p: Pt) => wrap(Math.atan2(p[1] - SY, p[0] - SX + 1e-6));
  const sortedT = tg.map((p) => ({ p, a: ang(p) })).sort((a, b) => a.a - b.a);
  const fT = sortedT.filter((_, i) => i % 2 === 0).slice(0, NF);
  while (fT.length < NF) fT.push(sortedT[sortedT.length - 1 - (NF - fT.length)]);
  const rest = sortedT.filter((x) => !fT.includes(x));
  const fo = orig
    .map((p, i) => ({ p, i, a: ang(p) }))
    .sort((a, b) => a.a - b.a)
    .map((o) => o.p);
  const cells: SCell[] = fo.map((o, j) => ({ o, tg: fT[j].p, parent: -1, birth: 0, delay: 0.22 * rand(j * 4.1 + 1), bow: (rand(j * 6.7) - 0.5) * 14 }));
  rest.forEach((r, j) => {
    let pi = 0;
    let best = 1e9;
    cells.slice(0, NF).forEach((c, k) => {
      const d = Math.hypot(c.tg[0] - r.p[0], c.tg[1] - r.p[1]);
      if (d < best) {
        best = d;
        pi = k;
      }
    });
    cells.push({ o: cells[pi].o, tg: r.p, parent: pi, birth: 0.1 + 0.5 * rand(j * 3.7 + 9), delay: 0, bow: (rand(j * 8.3) - 0.5) * 12 });
  });
  return cells;
})();
/** Founders that come from the cavity (round cells, part of the somite from the start). */
const CORE = new Set(SCELLS.map((c, j) => (c.parent < 0 && Math.hypot(c.o[0] - SX, c.o[1] - SY) < 12 ? j : -1)).filter((j) => j >= 0));

/** Where founder j started (after loosening). */
const loosened = (j: number, sc: number): Pt => {
  const c = SCELLS[j];
  const a = rand(j * 5.3) * Math.PI * 2;
  return [c.o[0] + Math.cos(a) * 3 * sc, c.o[1] + Math.sin(a) * 3 * sc];
};
const quad = (a: Pt, c: Pt, b: Pt, u: number): Pt => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
function route(a: Pt, b: Pt, bow: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const c: Pt = [(a[0] + b[0]) / 2 - (dy / l) * bow, (a[1] + b[1]) / 2 + (dx / l) * bow];
  return (u: number) => quad(a, c, b, ss(u));
}
/** Position of sclerotome cell j (model) and its visibility. */
function scleroAt(j: number, tm: Tm): { p: Pt; o: number } {
  const c = SCELLS[j];
  if (c.parent < 0) {
    const a = loosened(j, tm.sc);
    const u = clamp((tm.mg - c.delay) / 0.75);
    return { p: route(a, c.tg, c.bow)(u), o: CORE.has(j) ? 1 : tm.sc };
  }
  if (tm.mg <= c.birth) return { p: [0, 0], o: 0 };
  const par = SCELLS[c.parent];
  const pa = loosened(c.parent, 1);
  const born = route(pa, par.tg, par.bow)(clamp((c.birth - par.delay) / 0.75));
  const u = clamp((tm.mg - c.birth) / (0.97 - c.birth));
  return { p: route(born, c.tg, c.bow)(u), o: clamp((tm.mg - c.birth) * 14) };
}
/** The cell we follow per side: the founder from the walls with the longest route. */
const FOLLOW = SCELLS.slice(0, NF).reduce((b, c, j) => (!CORE.has(j) && Math.hypot(c.tg[0] - c.o[0], c.tg[1] - c.o[1]) > Math.hypot(SCELLS[b].tg[0] - SCELLS[b].o[0], SCELLS[b].tg[1] - SCELLS[b].o[1]) ? j : b), 0);

// ---------------------------------------------------------------- cartilage (vertebra + ribs)

function vertebraR(): { body: Pt[]; arch: Pt[] } {
  const body = ellipsePts(NOTO.cx, NOTO.cy, 25, 16, -Math.PI / 2, Math.PI / 2, 20);
  const o = ellipsePts(TUBE.cx, TUBE.cy, TUBE.rx + 13, TUBE.ry + 11, -1.05, 1.1, 22);
  const i = ellipsePts(TUBE.cx, TUBE.cy, TUBE.rx + 5, TUBE.ry + 4, -1.05, 1.1, 22);
  return { body, arch: [...o, ...i.reverse()] };
}
function ribLine(g: Trunk): Pt[] {
  const mids: Pt[] = [];
  for (let i = g.iA + 3; i <= g.iA + 3 + 42; i += 3) mids.push(off(g.S[i], TE + TP * 0.5));
  return catmull([[24, 110], [56, 102], [86, 90], [108, 74], ...mids], 6);
}
function ribPoly(line: Pt[], w0: number, w1: number): Pt[] {
  const n = line.length;
  const L: Pt[] = [];
  const R: Pt[] = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]);
    R.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  return [...L, ...R.reverse()];
}
/** Chondrocytes in their lacunae over a screen polygon. */
function lacunae(pts: Pt[], step: number, seed: number, r: number): ReactNode[] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const out: ReactNode[] = [];
  let i = 0;
  for (let y = Math.min(...ys); y <= Math.max(...ys); y += step * 0.86)
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += step) {
      i++;
      const jx = x + (rand(seed + i * 1.9) - 0.5) * step * 0.7;
      const jy = y + (rand(seed + i * 4.3) - 0.5) * step * 0.6;
      if (!inPoly(pts, jx, jy)) continue;
      out.push(
        <g key={i}>
          <ellipse cx={f1(jx)} cy={f1(jy)} rx={f1(r * 1.35)} ry={f1(r)} fill="#f4f9fb" stroke="#9fb9c9" strokeWidth={0.5} />
          <circle cx={f1(jx)} cy={f1(jy)} r={f1(r * 0.5)} fill="#5f7d91" />
        </g>,
      );
    }
  return out;
}

// ---------------------------------------------------------------- drawing

interface Ctx {
  t: number;
  tm: Tm;
  g: Trunk;
  pl: Place;
  M: (p: Pt, sd?: 1 | -1) => Pt;
  close: boolean;
  /** Other names for the same tissue (topic 8 calls the migrating sclerotome "mesenkima"). */
  ids?: SomiteIds;
}

export interface SomiteIds {
  /** The sclerotome once it has formed. */
  sclero?: string;
  /** The dorsal plate the somite leaves, once the sclerotome has formed (before the dermomyotome step). */
  plate?: string;
}

const sides = [1, -1] as const;

/** Epithelial somite, its ventral/medial walls (fading as they loosen) and the dorsal plate it leaves. */
function SomiteWalls({ c }: { c: Ctx }) {
  const { tm, M, close, t } = c;
  const n = (base: number) => Math.round(base * (close ? 1.5 : 1));
  const lip = tm.dt;
  const pl = plateLines(lip);
  const arcA = pl.s.map((q) => lerp(D0, D1, q));
  const plateIn = (i: number, d: number): Pt => [pl.top[i][0] + pl.nrm[i][0] * d, pl.top[i][1] + pl.nrm[i][1] * d];
  const morph = (sd: 1 | -1) => ({
    outer: arcA.map((a, i) => M(lerpP(outerE(a), pl.top[i], tm.dm), sd)),
    inner: arcA.map((a, i) => M(lerpP(innerE(a), plateIn(i, pl.thk[i]), tm.dm), sd)),
  });
  const sclA = Array.from({ length: 25 }, (_, i) => lerp(D1, D0 + Math.PI * 2, i / 24));
  const lumen = ellipsePts(SX, SY, SRX - WALL, SRY - WALL);
  const epiOp = 1 - tm.sc;
  /** Band of the plate over [s0, s1] between depth d0(s) and d1(s) (depths measured from the plate top). */
  const sub = (s0: number, s1: number, sd: 1 | -1, d0: (k: number) => number, d1: (k: number) => number, nn = 14) => {
    const p = plateLines(lip, s0, s1, nn);
    const at = (i: number, d: number): Pt => [p.top[i][0] + p.nrm[i][0] * d, p.top[i][1] + p.nrm[i][1] * d];
    return { outer: p.top.map((_, i) => M(at(i, d0(p.thk[i])), sd)), inner: p.top.map((_, i) => M(at(i, d1(p.thk[i])), sd)) };
  };
  const RED = { fill: SOM, nucleus: 'rgba(70,4,14,0.7)', edge: 'rgba(70,6,16,0.45)' };
  const ORANGE = { fill: MYO, nucleus: MYO_NUC, edge: 'rgba(122,59,6,0.45)' };
  const plateCells = (sd: 1 | -1, op = 1) => {
    const b = morph(sd);
    return <Cells outer={b.outer} inner={b.inner} n={n(15)} {...RED} seed={21 + sd} opacity={op} />;
  };
  const top0 = () => 0;
  const bottom = (k: number) => k;
  const somite = t < SB.dermomyo;
  return (
    <>
      {/* The somite while it is still one: the ball, then the plate its loosening walls leave behind. */}
      {somite && (
        <Part id="somitak">
          {sides.map((sd) => (
            <g key={sd}>
              {epiOp > 0.01 && <path d={smoothPath(lumen.map((p) => M(p, sd)), true, 0.4)} fill="#3a0c16" opacity={epiOp} />}
              {epiOp > 0.01 && <Cells outer={sclA.map((a) => M(outerE(a), sd))} inner={sclA.map((a) => M(innerE(a), sd))} n={n(15)} {...RED} seed={31 + sd} opacity={epiOp} />}
            </g>
          ))}
        </Part>
      )}
      {somite && (
        <Part id={c.ids?.plate && tm.sc > 0.5 ? c.ids.plate : 'somitak'}>
          {sides.map((sd) => (
            <g key={sd}>{plateCells(sd)}</g>
          ))}
        </Part>
      )}
      {/* Dermomyotome, then its middle: the dermatome (closest to the ectoderm). */}
      {!somite && (
        <Part id={t < SB.dermato ? 'dermatomiotoma' : 'dermatoma'}>
          {sides.map((sd) => {
            const b = sub(0.16, 0.84, sd, top0, bottom, 16);
            return (
              <g key={sd}>
                {plateCells(sd, 1 - tm.dt)}
                {tm.dt > 0.01 && <Cells outer={b.outer} inner={b.inner} n={n(11)} fill={DERMA} nucleus="rgba(110,40,30,0.6)" edge="rgba(110,40,30,0.35)" seed={41 + sd} opacity={tm.dt} />}
              </g>
            );
          })}
        </Part>
      )}
      {/* The two lips (dorsomedial, ventrolateral) become muscle precursors and slip under the dermatome: the myotome. */}
      {tm.dt > 0.01 && (
        <Part id="miotoma">
          {sides.map((sd) => {
            const G = 0.3 * tm.dt + 0.7 * tm.my;
            const myo = (s0: number, s1: number, seed: number) => {
              const b = sub(s0, s1, sd, (k) => k + 0.4, (k) => k + MYO_T, 14);
              return <Cells key={seed} outer={b.outer} inner={b.inner} n={Math.max(2, Math.round(((s1 - s0) / 0.76) * n(12)))} {...ORANGE} seed={seed + sd} />;
            };
            /** A lip: the rounded, thickened free end of the plate, packed with muscle-precursor nuclei. */
            const lipBulb = (end: 0 | 1, seed: number) => {
              const p = plateLines(lip, end ? 0.78 : 0, end ? 1 : 0.22, 10);
              const top = p.top;
              const inn = p.top.map((q, i): Pt => [q[0] + p.nrm[i][0] * p.thk[i], q[1] + p.nrm[i][1] * p.thk[i]]);
              const iE = end ? 10 : 0;
              const A = top[iE];
              const B = inn[iE];
              const C: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
              const r = Math.hypot(A[0] - B[0], A[1] - B[1]) / 2;
              const ux = (A[0] - C[0]) / r;
              const uy = (A[1] - C[1]) / r;
              const q0 = end ? top[9] : top[1];
              const tl = Math.hypot(A[0] - q0[0], A[1] - q0[1]) || 1;
              const tx = (A[0] - q0[0]) / tl;
              const ty = (A[1] - q0[1]) / tl;
              const cap = Array.from({ length: 7 }, (_, i): Pt => {
                const th = (Math.PI * (i + 1)) / 8;
                return [C[0] + r * (Math.cos(th) * ux + Math.sin(th) * tx), C[1] + r * (Math.cos(th) * uy + Math.sin(th) * ty)];
              });
              const outline = end ? [...top, ...cap, ...inn.slice().reverse()] : [...top.slice().reverse(), ...cap, ...inn];
              const scr = outline.map((q) => M(q, sd));
              const nN = close ? 5 : 3;
              const nuc = Array.from({ length: nN }, (_, i) => {
                const k = end ? 0.25 + (0.7 * (i + 0.5)) / nN : 0.05 + (0.7 * (i + 0.5)) / nN;
                const j = Math.round(k * 10);
                return M(lerpP(top[j], inn[j], 0.3 + 0.4 * rand(seed + i * 2.1)), sd);
              });
              const rr = Math.max(1.3, 1.2 * c.pl.k);
              return (
                <g key={seed}>
                  <path d={smoothPath(scr, true, 0.5)} fill={MYO} stroke="rgba(122,59,6,0.6)" strokeWidth={0.9} />
                  <path d={smoothPath(scr, true, 0.5)} fill="url(#g-shade)" opacity={0.3} />
                  {nuc.map((q, i) => (
                    <ellipse key={i} cx={f1(q[0])} cy={f1(q[1])} rx={f1(rr * 1.2)} ry={f1(rr * 0.85)} fill={MYO_NUC} opacity={0.75} transform={`rotate(${f1(rand(seed + i) * 60 - 30)} ${f1(q[0])} ${f1(q[1])})`} />
                  ))}
                </g>
              );
            };
            return (
              <g key={sd} opacity={tm.dt}>
                {G > 0.995 ? myo(0.12, 0.88, 61) : [myo(0.12, 0.12 + 0.38 * G, 63), myo(0.88 - 0.38 * G, 0.88, 65)]}
                {lipBulb(0, 51 + sd)}
                {lipBulb(1, 57 + sd)}
              </g>
            );
          })}
        </Part>
      )}
    </>
  );
}

/** One stellate mesenchymal (sclerotome) cell. */
function SCellShape({ p, r, o, col = SCLERO, seed }: { p: Pt; r: number; o: number; col?: string; seed: number }) {
  if (o <= 0.02) return null;
  const a = f1(rand(seed * 3.1) * 180);
  return (
    <g transform={`translate(${f1(p[0])} ${f1(p[1])}) rotate(${a})`} opacity={f1(o)}>
      <path d={`M${f1(-r * 2.3)},${f1(-r * 0.6)}L${f1(r * 2.2)},${f1(r * 0.5)}M${f1(-r * 0.5)},${f1(r * 2)}L${f1(r * 0.4)},${f1(-r * 1.9)}`} stroke={col} strokeWidth={Math.max(0.8, r * 0.38)} strokeLinecap="round" />
      <ellipse rx={f1(r * 1.25)} ry={f1(r)} fill={col} stroke="rgba(60,20,8,0.6)" strokeWidth={0.6} />
      <circle r={f1(r * 0.5)} fill={SCLERO_NUC} />
    </g>
  );
}

function Sclerotome({ c }: { c: Ctx }) {
  const { tm, M, pl, t } = c;
  const r = Math.max(2, 1.9 * pl.k);
  const id = t < SB.sclero ? 'somitak' : (c.ids?.sclero ?? 'esklerotoma');
  const fade = 1 - 0.55 * tm.fa;
  return (
    <Part id={id}>
      {sides.map((sd) =>
        SCELLS.map((_, j) => {
          const s = scleroAt(j, tm);
          const red = CORE.has(j) && tm.sc < 0.5;
          return <SCellShape key={`${sd}${j}`} p={M(s.p, sd)} r={red ? r * 1.15 : r} o={s.o * fade} col={red ? SOM : SCLERO} seed={j + (sd > 0 ? 0 : 50)} />;
        }),
      )}
    </Part>
  );
}

/** The sclerotome journey: the followed cell, its route, and the ghost of the vertebra it will build. */
function ScleroJourney({ c }: { c: Ctx }) {
  const { tm, M, pl } = c;
  const follow = seg(c.t, SB.sclero + 0.06, SB.sclero + 0.1) * (1 - seg(c.t, SB.dermomyo, SB.dermomyo + 0.04));
  const ghost = seg(c.t, SB.migrate, SB.migrate + 0.04) * (1 - seg(c.t, SB.dermomyo, SB.dermomyo + 0.05));
  if (follow <= 0.02 && ghost <= 0.02) return null;
  const v = vertebraR();
  return (
    <g>
      <defs>
        <LitDefs />
      </defs>
      <g opacity={ghost * 0.13} pointerEvents="none">
        <path d={poly([...v.body.map((p) => M(p, 1)), ...v.body.slice().reverse().map((p) => M(p, -1))])} fill={CART} />
        {sides.map((sd) => (
          <path key={sd} d={poly(v.arch.map((p) => M(p, sd)))} fill={CART} />
        ))}
      </g>
      {sides.map((sd) => {
        const N = Math.round(tm.mg * 40);
        const pts = Array.from({ length: N + 1 }, (_, i) => M(scleroAt(FOLLOW, { ...tm, mg: i / 40 }).p, sd));
        const [x, y] = pts[pts.length - 1];
        return (
          <g key={sd}>
            <Journey pts={pts} color={SCLERO} show={follow} r={2.4 * pl.k} head={10} />
            <LitCell d={ellipsePath(x, y, 2.4 * pl.k, 2.4 * pl.k)} color={SCLERO} fate={SCLERO} show={follow} />
          </g>
        );
      })}
    </g>
  );
}

/** Ventrolateral-lip cells migrating into the parietal (somatic) layer of the body wall. */
const NMO = 7;
function myoRoute(g: Trunk, j: number): Pt[] {
  const lip = plateTop(0.97, 1);
  const start: Pt = [lip[0] - 2, lip[1] + plateThk(0.97, 1) * 0.7];
  const mids: Pt[] = [];
  const end = g.iA + 6 + j * 6;
  for (let i = g.iA + 1; i <= end; i += 2) mids.push(off(g.S[i], TE + TP * 0.5));
  return catmull([start, [start[0] + 10, start[1] - 4], ...mids], 4);
}
const along = (pts: Pt[], u: number): Pt => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const s = clamp(u) * cum[cum.length - 1];
  let i = 0;
  while (i < pts.length - 2 && cum[i + 1] < s) i++;
  const w = cum[i + 1] > cum[i] ? (s - cum[i]) / (cum[i + 1] - cum[i]) : 0;
  return lerpP(pts[i], pts[i + 1], w);
};
function MyoMigration({ c }: { c: Ctx }) {
  const { tm, g, M, pl } = c;
  if (tm.mo <= 0.01) return null;
  const r = Math.max(1.8, 1.7 * pl.k);
  return (
    <Part id="miotoma">
      {sides.map((sd) =>
        Array.from({ length: NMO }, (_, j) => {
          const rt = myoRoute(g, j);
          const u = clamp((tm.mo - j * 0.06) / 0.62);
          if (u <= 0) return null;
          const p = M(along(rt, u), sd);
          const q = M(along(rt, Math.min(1, u + 0.02)), sd);
          const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
          const trail = j === NMO - 1 ? Array.from({ length: Math.round(u * 30) + 1 }, (_, i) => M(along(rt, i / 30), sd)) : null;
          return (
            <g key={`${sd}${j}`}>
              {trail && trail.length > 2 && <Journey pts={trail} color={MYO} show={1 - tm.fa} r={r} head={8} origin={false} width={2.2} />}
              <g transform={`translate(${f1(p[0])} ${f1(p[1])}) rotate(${f1(ang)})`}>
                <ellipse rx={f1(r * 2)} ry={f1(r * 0.95)} fill={MYO} stroke={MYO_NUC} strokeWidth={0.6} />
                <ellipse rx={f1(r * 0.8)} ry={f1(r * 0.45)} fill={MYO_NUC} />
              </g>
            </g>
          );
        }),
      )}
    </Part>
  );
}

function Vertebra({ c }: { c: Ctx }) {
  const { tm, M, pl } = c;
  if (tm.fa <= 0.01) return null;
  const v = vertebraR();
  const body = [...v.body.map((p) => M(p, 1)), ...v.body.slice().reverse().map((p) => M(p, -1))];
  const step = Math.max(5, 3.4 * pl.k);
  return (
    <Part id="ornoak" show={tm.fa}>
      {[body, ...sides.map((sd) => v.arch.map((p) => M(p, sd)))].map((pts, i) => (
        <g key={i}>
          <path d={smoothPath(pts, true, 0.3)} fill={CART} opacity={0.82} stroke={CART_EDGE} strokeWidth={1.1} />
          {lacunae(pts, step, 17 + i * 13, Math.max(0.9, 0.75 * pl.k))}
        </g>
      ))}
    </Part>
  );
}
function Ribs({ c }: { c: Ctx }) {
  const { tm, g, M, pl } = c;
  if (tm.fa <= 0.01) return null;
  const line = ribLine(g);
  const grow = ss(tm.fa * 1.25);
  const cut = line.slice(0, Math.max(3, Math.round(line.length * lerp(0.35, 1, grow))));
  const step = Math.max(5, 3.4 * pl.k);
  return (
    <Part id="saihetsak" show={tm.fa}>
      {sides.map((sd) => {
        const pts = ribPoly(cut, 9, 5.5).map((p) => M(p, sd));
        return (
          <g key={sd}>
            <path d={smoothPath(pts, true, 0.25)} fill={CART} opacity={0.82} stroke={CART_EDGE} strokeWidth={1.1} />
            {lacunae(pts, step, 71 + sd, Math.max(0.8, 0.7 * pl.k))}
          </g>
        );
      })}
    </Part>
  );
}

function Intermediate({ c }: { c: Ctx }) {
  const { M } = c;
  const pts = ellipsePts(INTER.cx, INTER.cy, INTER.rx, INTER.ry, 0, Math.PI * 2, 24).slice(0, -1);
  return (
    <Part id="bitarteko-mesodermoa">
      {sides.map((sd) => (
        <g key={sd}>
          <path d={smoothPath(pts.map((p) => M(p, sd)), true, 0.5)} fill={C.mesoIntermediate} stroke="rgba(110,20,10,0.5)" strokeWidth={0.8} />
          <path d={smoothPath(pts.map((p) => M(p, sd)), true, 0.5)} fill="url(#g-shade)" opacity={0.35} />
        </g>
      ))}
    </Part>
  );
}

function scene(t: number, pl: Place, close: boolean, sids?: SomiteIds) {
  const tm = timing(t);
  const g = trunkGeom(E6);
  const M = placer(pl);
  const c: Ctx = { t, tm, g, pl, M, close, ids: sids };
  const ids = close ? {} : { parietal: 'alboko-mesodermoa', visceral: 'alboko-mesodermoa' };
  return {
    c,
    drawing: (
      <TrunkSection
        g={g}
        pl={pl}
        detail={close ? 2 : 1}
        ids={ids}
        mid={
          <>
            <Intermediate c={c} />
            <Sclerotome c={c} />
            <Vertebra c={c} />
            <SomiteWalls c={c} />
          </>
        }
        over={
          <>
            <Ribs c={c} />
            <MyoMigration c={c} />
            <NeuralTube pl={pl} detail={close ? 2 : 1} />
            <Notochord pl={pl} />
            <Aortae pl={pl} />
            <ScleroJourney c={c} />
          </>
        }
      />
    ),
  };
}

// ---------------------------------------------------------------- label anchors and views

function anchors(c: Ctx): Record<string, Pt> {
  const { tm, g, M } = c;
  const pl = plateLines(tm.dt);
  const myoIn: Pt = [pl.top[15][0] + pl.nrm[15][0] * (pl.thk[15] + MYO_T / 2), pl.top[15][1] + pl.nrm[15][1] * (pl.thk[15] + MYO_T / 2)];
  const rib = ribLine(g);
  const scl = scleroAt(FOLLOW, tm).p;
  const mod: Record<string, Pt> = {
    somitak: [SX + SRX * 0.7, SY - SRY * 0.55],
    dermatomiotoma: [pl.top[14][0], pl.top[14][1] + PLATE_T / 2],
    dermatoma: [pl.top[14][0], pl.top[14][1] + PLATE_T / 2],
    miotoma: myoIn,
    esklerotoma: tm.mg > 0.6 ? [TUBE.rx + 10, TUBE.cy + 30] : scl,
    notokorda: [NOTO.cx + NOTO.r * 0.4, NOTO.cy + NOTO.r * 0.3],
    'hodi-neurala': [TUBE.cx + TUBE.rx * 0.75, TUBE.cy - TUBE.ry * 0.45],
    ornoak: [TUBE.cx + TUBE.rx + 10, TUBE.cy + 20],
    saihetsak: rib[Math.round(rib.length * 0.4)],
    ektodermoa: off(g.S[Math.round(g.iU1 * 0.82)], TE / 2),
    'alboko-mesodermoa': off(g.S[g.iA + 48], TE + TP / 2),
    'paretako-orria': off(g.S[g.iA + 6], TE + TP / 2),
    'bitarteko-mesodermoa': [INTER.cx, INTER.cy],
    endodermoa: off(g.G[Math.round(g.iV * 0.5)], 4),
    'aorta-dortsalak': [AORTA.cx + AORTA.r * 0.6, AORTA.cy],
  };
  const out: Record<string, Pt> = {};
  for (const [id, p] of Object.entries(mod)) out[id] = M(p, 1);
  return out;
}

const CTX: Place = { k: 1.16, ox: 500, oy: 190 };

/** The close-up drawing and its label anchors, for other topics that retell the somite (topic 8: bone origins). */
export function somiteClose(t: number, sids?: SomiteIds, pl: Place = CLOSE) {
  const { c, drawing } = scene(t, pl, true, sids);
  return { drawing, anchors: anchors(c), tm: c.tm, M: c.M, rib: ribLine(c.g).map((p) => c.M(p)) };
}
/** The same for the two-sided context view. */
export function somiteContext(t: number, sids?: SomiteIds) {
  const { c, drawing } = scene(t, CTX, false, sids);
  return { drawing, anchors: anchors(c), tm: c.tm, M: c.M, rib: ribLine(c.g).map((p) => c.M(p)), ox: CTX.ox };
}
const CLOSE: Place = { k: 3.4, ox: 270, oy: 40 };

/** Wide context: the somite pair within the whole transverse section. */
export function SomiteContext({ t }: SceneProps) {
  const { c, drawing } = scene(t, CTX, false);
  const tm = c.tm;
  const a = anchors(c);
  const mir = (id: string): Pt => [2 * CTX.ox - a[id][0], a[id][1]];
  const L = (id: string, x: number, y: number, show = 1, small = false, at?: Pt) => <Label key={id} id={id} x={x} y={y} ax={(at ?? a[id])[0]} ay={(at ?? a[id])[1]} show={show} small={small} />;
  return (
    <g>
      {drawing}
      <Note x={500} y={612} tone="dim" size={11}>
        Odol-hodiak mesodermotik sortzen dira (hemangioblastoak), somiten inguruan barne
      </Note>
      {L('hodi-neurala', 190, 96, 1, false, mir('hodi-neurala'))}
      {L('ektodermoa', 190, 136, 1, true, mir('ektodermoa'))}
      {L('ornoak', 190, 330, tm.fa, true, mir('ornoak'))}
      {L('notokorda', 190, 380, 1, false, mir('notokorda'))}
      {L('aorta-dortsalak', 190, 440, 1, true, mir('aorta-dortsalak'))}
      {L('somitak', 810, 96, tm.uniform)}
      {L('dermatomiotoma', 810, 136, seg(t, SB.dermomyo, SB.dermomyo + 0.06) * (1 - seg(t, SB.dermato, SB.dermato + 0.03)))}
      {L('dermatoma', 810, 136, seg(t, SB.dermato + 0.03, SB.dermato + 0.06))}
      {L('miotoma', 810, 176, tm.my)}
      {L('esklerotoma', 810, 236, tm.sc)}
      {L('bitarteko-mesodermoa', 810, 320, 1, true)}
      {L('saihetsak', 810, 400, tm.fa, true, c.M(ribLine(c.g)[Math.round(ribLine(c.g).length * 0.72)]))}
      {L('alboko-mesodermoa', 810, 460, 1, true)}
      {L('endodermoa', 810, 540, 1, true)}
    </g>
  );
}

/** Close-up of the right somite (neural tube and notochord at its medial side). */
export function SomiteClose({ t }: SceneProps) {
  const { c, drawing } = scene(t, CLOSE, true);
  const tm = c.tm;
  const a = anchors(c);
  const M = c.M;
  const L = (id: string, x: number, y: number, show = 1, small = false, at?: Pt) => <Label key={id} id={id} x={x} y={y} ax={(at ?? a[id])[0]} ay={(at ?? a[id])[1]} show={show} small={small} />;
  const dml = M(plateTop(0, 1));
  const vll = M(plateTop(1, 1));
  return (
    <g>
      {drawing}
      <Note x={dml[0] + 12} y={dml[1] + 108} tone="dim" size={12} show={tm.dt * (1 - tm.fa)}>
        Ertz dortsomediala
      </Note>
      <Note x={vll[0] - 24} y={vll[1] + 58} tone="dim" size={12} show={tm.dt * (1 - tm.fa)}>
        Ertz bentrolaterala
      </Note>
      {L('hodi-neurala', 190, 170)}
      {L('esklerotoma', 190, 330, tm.sc)}
      {L('notokorda', 190, 400)}
      {L('ornoak', 190, 450, tm.fa, true)}
      {L('aorta-dortsalak', 190, 500, 1, true)}
      {L('ektodermoa', 810, 96, 1, true)}
      {L('somitak', 810, 150, tm.uniform)}
      {L('dermatomiotoma', 810, 150, seg(t, SB.dermomyo, SB.dermomyo + 0.06) * (1 - seg(t, SB.dermato, SB.dermato + 0.03)))}
      {L('dermatoma', 810, 150, seg(t, SB.dermato + 0.03, SB.dermato + 0.06))}
      {L('miotoma', 810, 200, tm.my)}
      {L('paretako-orria', 810, 290, tm.mo)}
      {L('saihetsak', 810, 400, tm.fa, true)}
      {L('bitarteko-mesodermoa', 810, 560, 1, true)}
    </g>
  );
}

/** The somite's derivatives at a finished state (dermatome, myotome, migrated sclerotome), for later sections. */
export function ParaxialDerivatives({ g, pl, t = 0.84 }: { g: Trunk; pl: Place; t?: number }) {
  const c: Ctx = { t, tm: timing(t), g, pl, M: placer(pl), close: false };
  return (
    <>
      <Sclerotome c={c} />
      <SomiteWalls c={c} />
    </>
  );
}
