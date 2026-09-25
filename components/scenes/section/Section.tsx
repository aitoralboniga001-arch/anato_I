'use client';

import type { ReactNode } from 'react';
import { C, Part, clamp, lerp, rand, smoothPath, type Pt } from '@/components/kit';

/**
 * Realistic transverse section of the embryo for weeks 3–4, drawn the way the course figures
 * (Langman) draw it: every germ layer is made of cells — pseudostratified columnar neuroepithelium,
 * cuboidal surface ectoderm and endoderm, stellate mesenchyme — instead of flat coloured bands.
 *
 * One parametric model covers the whole sequence of the notes (w3 fig. 6, w4 figs. 1–10):
 *  - `neural`: flat neural plate (0) → neural groove + folds rising (≈.3–.6) → folds meet (.85)
 *    → neural tube sinks under the re-closed surface ectoderm (1).
 *  - `meso`:   thin mesoderm sheet (0) → paraxial / intermediate / lateral (≈.3) → vesicles in the
 *    lateral plate (≈.45) → one intra-embryonic coelom splitting parietal and visceral layers (1).
 *  - `somite`: paraxial block (0) → epithelial somite (.3–.55) → sclerotome + dermomyotome (.55–.8)
 *    → dermatome + myotome (1).
 *  - `crest`:  neural-crest cells leave the fold tips and migrate on the dorsal (→ melanocytes)
 *    and ventral (→ spinal and sympathetic ganglia, adrenal medulla) routes.
 *  - `fold`:   lateral folding: the flat disc (amnion dome above, yolk sac below) curls ventrally
 *    until the body wall and the gut tube close, the gut staying open to the yolk sac.
 *
 * Geometry lives in "disc space": x = distance from the midline along the disc (-L..L),
 * d = depth under the dorsal surface. `map` curls that space (lateral folding) and zooms it.
 */

export interface SectionParams {
  fold: number;
  neural: number;
  meso: number;
  somite: number;
  crest: number;
  /** Zoom around the canvas centre. */
  k: number;
  /** Offsets after zoom (svg units). */
  oy?: number;
  ox?: number;
  /** Show the paired dorsal aortae (0..1). */
  aorta?: number;
  /** Show the amnion (0..1). */
  amnion?: number;
  /** Show the yolk sac (0..1). */
  yolk?: number;
  /** Structure ids to use for the epiblast-era names (week 3) instead of the germ-layer names. */
  ids?: Partial<Record<LayerId, string>>;
}

export type LayerId =
  | 'ectoderm'
  | 'plate'
  | 'groove'
  | 'folds'
  | 'tube'
  | 'notochord'
  | 'meso'
  | 'paraxial'
  | 'intermediate'
  | 'lateral'
  | 'parietal'
  | 'visceral'
  | 'coelom'
  | 'endoderm'
  | 'amnion'
  | 'yolk'
  | 'extraMeso'
  | 'crest'
  | 'somite'
  | 'sclerotome'
  | 'dermomyotome'
  | 'dermatome'
  | 'myotome'
  | 'aorta'
  | 'gut'
  | 'mesentery'
  | 'vitelline'
  | 'melanocytes'
  | 'drg'
  | 'sympathetic';

const DEFAULT_IDS: Record<LayerId, string> = {
  ectoderm: 'azaleko-ektodermoa',
  plate: 'plaka-neurala',
  groove: 'ildo-neurala',
  folds: 'tolesdura-neuralak',
  tube: 'hodi-neurala',
  notochord: 'notokorda',
  meso: 'mesodermo-intraenbrionarioa',
  paraxial: 'mesodermo-paraxiala',
  intermediate: 'bitarteko-mesodermoa',
  lateral: 'alboko-mesodermoa',
  parietal: 'paretako-orria',
  visceral: 'errai-orria',
  coelom: 'enbrioi-barruko-zeloma',
  endoderm: 'endodermoa',
  amnion: 'amnios-barrunbea',
  yolk: 'bitelo-zaku-sekundarioa',
  extraMeso: 'enbrioi-kanpoko-mesodermoa',
  crest: 'gandor-neurala',
  somite: 'somitak',
  sclerotome: 'esklerotoma',
  dermomyotome: 'dermatomiotoma',
  dermatome: 'dermatoma',
  myotome: 'miotoma',
  aorta: 'aorta-dortsalak',
  gut: 'erdiko-hestea',
  mesentery: 'mesenterio-dortsala',
  vitelline: 'hodi-onfalomesenterikoa',
  melanocytes: 'melanozitoak',
  drg: 'gongoil-errakideoak',
  sympathetic: 'gongoil-sinpatikoak',
};

// ---- constants (disc space, svg units before zoom) ----
const L = 520;
const TE = 9; // surface ectoderm (cuboidal)
const TN = 24; // neuroepithelium (pseudostratified columnar)
const TEN = 9; // endoderm (cuboidal)
const A_PLATE = 92; // half-width of the neural plate
const X_PAR = [44, 152] as const;
const X_INT = [152, 186] as const;
const T_PAR = 13; // parietal (somatic) layer thickness
const T_VIS = 13; // visceral (splanchnic) layer thickness
const R_NOTO = 11;

const ss = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
const f1 = (v: number) => Math.round(v * 10) / 10;

export interface Section {
  p: Required<Omit<SectionParams, 'ids'>>;
  id: (l: LayerId) => string;
  /** disc space → screen */
  map: (x: number, d: number) => Pt;
  /** depth of the top of the endoderm at x */
  dEndo: (x: number) => number;
  neural: NeuralGeom;
  dNoto: number;
  dAorta: number;
  somite: { cx: number; cd: number; rx: number; rd: number };
  yolk: { A_R: Pt; A_L: Pt; c: number; Rys: number; neck: number; cx: number; cy: number; ring: (r: number) => Pt[] };
  /** Screen anchors for labels. */
  at: Record<string, Pt>;
  /** Screen radius scale (zoom × local curl stretch ≈ zoom). */
  k: number;
}

interface NeuralGeom {
  psi: number;
  rho: number;
  cy: number;
  sx: number;
  sy: number;
  closed: number;
  /** point on the plate at angle a (0 = floor), radius r from the arc centre, in disc space */
  pt: (a: number, r: number) => Pt;
  /** crest (fold tip) centre-line point, right side */
  crest: Pt;
  floorBasal: number;
  topBasal: number;
}

function neuralGeom(n: number): NeuralGeom {
  const nc = clamp(n / 0.85);
  const psi = Math.max(nc * Math.PI, 0.02);
  const rho = A_PLATE / psi;
  const closed = ss((n - 0.85) / 0.15);
  const sx = lerp(1, 0.8, closed);
  const sy = lerp(1, 1.28, closed);
  const elev = 24 * Math.sin(Math.PI * nc);
  let cy: number;
  if (n <= 0.85) {
    const dEdge = TN / 2 - elev;
    cy = dEdge - rho * Math.cos(psi);
  } else {
    const topBasal = lerp(0, TE + 9, closed);
    cy = topBasal + (rho + TN / 2) * sy;
  }
  const pt = (a: number, r: number): Pt => [r * Math.sin(a) * sx, cy + r * Math.cos(a) * sy];
  const crest = pt(psi, rho);
  return {
    psi,
    rho,
    cy,
    sx,
    sy,
    closed,
    pt,
    crest,
    floorBasal: cy + (rho + TN / 2) * sy,
    topBasal: n <= 0.85 ? Math.min(crest[1] - TN / 2, 0) : cy - (rho + TN / 2) * sy,
  };
}

export function makeSection(params: SectionParams): Section {
  const p = { oy: 0, ox: 0, aorta: 0, amnion: 1, yolk: 1, ...params } as Required<Omit<SectionParams, 'ids'>>;
  const ids = { ...DEFAULT_IDS, ...params.ids };
  const f = clamp(p.fold);
  const Phi = Math.max(f * Math.PI, 1e-4);
  const rhoC = L / Phi;
  const yTop = lerp(212, 150, f);
  const map = (x: number, d: number): Pt => {
    const phi = (x / L) * Phi;
    const X = 500 + (rhoC - d) * Math.sin(phi);
    const Y = yTop + rhoC - (rhoC - d) * Math.cos(phi);
    return [500 + p.k * (X - 500) + p.ox, 320 + p.k * (Y - 320) + p.oy];
  };
  const ng = neuralGeom(p.neural);
  const dNoto = Math.max(ng.floorBasal + 3 + R_NOTO, TN + 3 + R_NOTO);
  const dMid = Math.max(lerp(54, 128, clamp(p.meso)), dNoto + R_NOTO + 3);
  const dLat = lerp(dMid * 0.62, dMid, f);
  const dEndo = (x: number) => lerp(dMid, dLat, ss((Math.abs(x) - 170) / 110));
  const dAorta = dMid - 14;
  const somite = { cx: 104, cd: (TE + dMid) / 2 + 2, rx: 46, rd: Math.max(22, (dMid - TE) / 2 - 8) };
  // Yolk sac (screen space), hanging from the disc edges; the neck becomes the vitelline duct.
  const yolk = (() => {
    const dE = dEndo(L) + TEN / 2;
    const A_R = map(L, dE);
    const A_L = map(-L, dE);
    const c = Math.max(4, (A_R[0] - A_L[0]) / 2);
    const Rys = lerp(c * 1.04, 96 * p.k, ss((f - 0.35) / 0.55));
    const neck = f * (dEndo(L) + 30) * p.k;
    const h = Math.sqrt(Math.max(0, Rys * Rys - c * c));
    const cx = (A_R[0] + A_L[0]) / 2;
    const cy = A_R[1] + neck + h;
    const th0 = Math.atan2(-h, c);
    const th1 = Math.atan2(-h, -c) + 2 * Math.PI;
    const ring = (r: number) => range(th0, th1, 48).map((a): Pt => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    return { A_R, A_L, c, Rys, neck, cx, cy, ring };
  })();
  const at: Record<string, Pt> = {
    ectoderm: map(300, TE / 2),
    plate: map(ng.pt(0.25 * ng.psi, ng.rho)[0], ng.pt(0.25 * ng.psi, ng.rho)[1]),
    groove: map(0, ng.pt(0, ng.rho - TN / 2)[1] - 6),
    folds: map(ng.crest[0], ng.crest[1]),
    tube: map(ng.pt(Math.PI / 2, ng.rho)[0], ng.pt(Math.PI / 2, ng.rho)[1]),
    notochord: map(0, dNoto),
    meso: map(250, (TE + dEndo(250)) / 2),
    paraxial: map(somite.cx, somite.cd),
    intermediate: map((X_INT[0] + X_INT[1]) / 2, (TE + dEndo(170)) / 2),
    lateral: map(360, (TE + dEndo(360)) / 2),
    parietal: map(380, TE + T_PAR / 2),
    visceral: map(380, dEndo(380) - T_VIS / 2),
    coelom: map(330, (TE + T_PAR + dEndo(330) - T_VIS) / 2),
    endoderm: map(-260, dEndo(-260) + TEN / 2),
    amnion: map(-140, -lerp(125, 60, f) * 0.7),
    aorta: map(-48, dAorta),
    crest: map(ng.crest[0] + 6, ng.crest[1] - 4),
    somite: map(-somite.cx, somite.cd),
    sclerotome: map(-somite.cx + 20, somite.cd + somite.rd * 0.55),
    dermomyotome: map(-somite.cx - 16, somite.cd - somite.rd * 0.62),
    dermatome: map(-somite.cx - 20, somite.cd - somite.rd * 0.8),
    myotome: map(-somite.cx - 14, somite.cd - somite.rd * 0.42),
    gut: map(0, dMid + TEN / 2),
    mesentery: map(0, dMid - 5),
    drg: map(62, (ng.cy + ng.floorBasal) / 2),
    sympathetic: map(-66, dAorta - 16),
    melanocytes: map(-240, TE + 6),
    yolk: [yolk.cx - yolk.Rys * 0.72, yolk.cy + yolk.Rys * 0.35],
    vitelline: [yolk.cx - Math.min(yolk.c, 14 * p.k), yolk.A_R[1] + yolk.neck * 0.55],
  };
  return { p, id: (l) => ids[l], map, dEndo, neural: ng, dNoto, dAorta, somite, yolk, at, k: p.k };
}

// ---------------------------------------------------------------- drawing helpers

/** Normal of a polyline at i (disc-space, pointing to the +d side for left→right curves). */
function normals(pts: Pt[]): Pt[] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
}

const resample = (pts: Pt[], u: number): Pt => {
  const x = u * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x));
  const k = x - i;
  return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
};

interface CellsOpts {
  fill: string;
  edge?: string;
  nucleus?: string;
  /** nucleus position between outer (0) and inner (1) */
  nk?: number;
  /** pseudostratified: nuclei at random heights */
  pseudo?: boolean;
  seed?: number;
  opacity?: number;
}

/** A sheet of cells between two matched screen polylines (outer[i] ↔ inner[i]). */
export function Cells({ outer, inner, n, fill, edge = 'rgba(8,12,26,0.55)', nucleus = 'rgba(16,20,44,0.62)', nk = 0.5, pseudo, seed = 1, opacity = 1 }: CellsOpts & { outer: Pt[]; inner: Pt[]; n: number }) {
  const cells: ReactNode[] = [];
  const base = `M${outer.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}L${inner
    .slice()
    .reverse()
    .map((q) => `${f1(q[0])},${f1(q[1])}`)
    .join('L')}Z`;
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const u1 = (i + 1) / n;
    const o0 = resample(outer, u0);
    const o1 = resample(outer, u1);
    const i0 = resample(inner, u0);
    const i1 = resample(inner, u1);
    const om: Pt = [(o0[0] + o1[0]) / 2, (o0[1] + o1[1]) / 2];
    const im: Pt = [(i0[0] + i1[0]) / 2, (i0[1] + i1[1]) / 2];
    const h = Math.hypot(im[0] - om[0], im[1] - om[1]);
    const w = Math.hypot(o1[0] - o0[0], o1[1] - o0[1]) * 0.5 + Math.hypot(i1[0] - i0[0], i1[1] - i0[1]) * 0.5;
    const kk = pseudo ? 0.2 + 0.6 * rand(seed + i * 1.37) : nk;
    const c: Pt = [lerp(om[0], im[0], kk), lerp(om[1], im[1], kk)];
    const ang = (Math.atan2(im[1] - om[1], im[0] - om[0]) * 180) / Math.PI;
    const rA = Math.max(1.2, Math.min(h * (pseudo ? 0.16 : 0.28), 6));
    const rW = Math.max(1, Math.min(w * 0.3, rA * (pseudo ? 0.75 : 1)));
    cells.push(
      <g key={i}>
        <path d={`M${f1(o0[0])},${f1(o0[1])}L${f1(o1[0])},${f1(o1[1])}L${f1(i1[0])},${f1(i1[1])}L${f1(i0[0])},${f1(i0[1])}Z`} fill="none" stroke={edge} strokeWidth={0.7} />
        <ellipse cx={f1(c[0])} cy={f1(c[1])} rx={f1(rA)} ry={f1(rW)} fill={nucleus} transform={`rotate(${f1(ang)} ${f1(c[0])} ${f1(c[1])})`} />
      </g>,
    );
  }
  return (
    <g opacity={opacity}>
      <path d={base} fill={fill} />
      <path d={base} fill="url(#g-shade)" opacity={0.35} />
      {cells}
      <path d={base} fill="none" stroke={edge} strokeWidth={1} />
    </g>
  );
}

/** Band along a disc-space centre-line with thickness t (outer = -d side). */
function bandPts(s: Section, line: Pt[], t0: number, t1: number): { outer: Pt[]; inner: Pt[] } {
  const nm = normals(line);
  const outer = line.map((q, i) => s.map(q[0] + nm[i][0] * t0, q[1] + nm[i][1] * t0));
  const inner = line.map((q, i) => s.map(q[0] + nm[i][0] * t1, q[1] + nm[i][1] * t1));
  return { outer, inner };
}

const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));

/** Loose mesenchyme: stellate cells scattered over a disc-space region. */
function Mesenchyme({ s, inside, color, seed = 3, step = 15, r = 1.9 }: { s: Section; inside: (x: number, d: number) => boolean; color: string; seed?: number; step?: number; r?: number }) {
  const out: ReactNode[] = [];
  let i = 0;
  for (let x = -L; x <= L; x += step)
    for (let d = -10; d <= 150; d += step * 0.8) {
      i++;
      const jx = x + (rand(seed + i * 2.3) - 0.5) * step * 0.9;
      const jd = d + (rand(seed + i * 5.9) - 0.5) * step * 0.7;
      if (!inside(jx, jd)) continue;
      const [X, Y] = s.map(jx, jd);
      const a = rand(seed + i * 9.1) * 180;
      const rr = r * s.k;
      out.push(
        <g key={i} transform={`translate(${f1(X)} ${f1(Y)}) rotate(${f1(a)})`}>
          <path d={`M${f1(-rr * 2.6)},0L${f1(rr * 2.6)},0M0,${f1(-rr * 1.8)}L0,${f1(rr * 1.8)}`} stroke={color} strokeWidth={0.7} opacity={0.55} />
          <ellipse rx={f1(rr * 1.25)} ry={f1(rr)} fill={color} />
        </g>,
      );
    }
  return <g>{out}</g>;
}

/** Closed polygon of a disc-space region bounded by two depth profiles over x ∈ [x0, x1]. */
function regionPath(s: Section, x0: number, x1: number, top: (x: number) => number, bot: (x: number) => number, n = 40) {
  const xs = range(x0, x1, n);
  const pts = [...xs.map((x) => s.map(x, top(x))), ...xs.reverse().map((x) => s.map(x, bot(x)))];
  return `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
}

const ellipseIn = (cx: number, cd: number, rx: number, rd: number) => (x: number, d: number) => ((x - cx) / rx) ** 2 + ((d - cd) / rd) ** 2 < 1;

// ---------------------------------------------------------------- the drawing

export function SectionDrawing({ s, show = {} }: { s: Section; show?: Partial<Record<LayerId, number>> }) {
  const { p, map, dEndo, neural: ng, dNoto, dAorta, somite: so } = s;
  const vis = (l: LayerId, v = 1) => (show[l] ?? 1) * v;
  const f = clamp(p.fold);
  const m = clamp(p.meso);
  const Ham = lerp(125, 62, f);
  const amnionH = (x: number) => Ham * Math.sqrt(Math.max(0, 1 - (x / L) ** 2)) ** 0.8;

  // Coelom opening: vesicles first, then one cavity.
  const coelomK = ss((m - 0.5) / 0.22);
  const vesK = ss((m - 0.34) / 0.14) * (1 - coelomK);
  const cTop = TE + T_PAR;
  const cBot = (x: number) => dEndo(x) - T_VIS;
  // Once the body wall closes, the midline mesoderm hanging the gut tube is the dorsal mesentery.
  const mesK = ss((f - 0.75) / 0.15);
  const cXm = lerp(L, 200, coelomK);
  const inCoelom = (x: number, d: number) => {
    const ax = Math.abs(x);
    if (coelomK > 0.02 && ax > cXm && d > cTop && d < cBot(x)) return true;
    if (vesK > 0.02)
      for (let j = 0; j < 5; j++) {
        const vx = 230 + j * 62;
        if (((ax - vx) / (18 * vesK)) ** 2 + ((d - (cTop + cBot(vx)) / 2) / (7 * vesK + 1)) ** 2 < 1) return true;
      }
    return false;
  };

  // Somite geometry (right and left).
  const sK = clamp(p.somite);
  const epith = ss((sK - 0.22) / 0.15);
  const scler = ss((sK - 0.55) / 0.2);
  const myo = ss((sK - 0.8) / 0.15);
  const somIn = (x: number, d: number) => m > 0.25 && ellipseIn(so.cx, so.cd, so.rx, so.rd)(Math.abs(x), d);
  const tubeIn = (x: number, d: number) => {
    const [cx, cy] = [0, ng.cy];
    if (ng.closed > 0.01 || p.neural > 0.6) return ((x - cx) / ((ng.rho + TN / 2) * ng.sx + 3)) ** 2 + ((d - cy) / ((ng.rho + TN / 2) * ng.sy + 3)) ** 2 < 1;
    return Math.abs(x) < A_PLATE && d < ng.floorBasal + 3;
  };
  const notoIn = (x: number, d: number) => Math.hypot(x, d - dNoto) < R_NOTO + 3;
  const aortaIn = (x: number, d: number) => p.aorta > 0.05 && Math.hypot(Math.abs(x) - 48, d - dAorta) < 13;

  // --- amnion + cavity
  const amnionOuter = range(-L, L, 60).map((x): Pt => [x, -amnionH(x) - 6]);
  const amnionInner = range(-L, L, 60).map((x): Pt => [x, -amnionH(x) + 4]);
  const cavity = `M${[...range(-L, L, 60).map((x) => map(x, -amnionH(x) + 3)), ...range(L, -L, 60).map((x) => map(x, 1))].map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

  const ys = s.yolk;
  const yolkPath = (dr: number) => {
    const pts: Pt[] = [
      [ys.A_R[0] + dr, ys.A_R[1]],
      [ys.A_R[0] + dr, ys.A_R[1] + ys.neck * 0.9],
      ...ys.ring(ys.Rys + dr).slice(1, -1),
      [ys.A_L[0] - dr, ys.A_L[1] + ys.neck * 0.9],
      [ys.A_L[0] - dr, ys.A_L[1]],
    ];
    return pts;
  };

  // Yolk-sac cavity: under the whole endoderm of the disc (the gut roof) and inside the sac.
  const yolkCavity = `M${[...yolkPath(0), ...range(-L, L, 60).map((x) => map(x, dEndo(x) + TEN - 1))].map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

  // --- neural plate / tube
  const plateArc = (r: number) => range(-ng.psi, ng.psi, 44).map((a) => ng.pt(a, r));
  const plateOuterD = plateArc(ng.rho + TN / 2);
  const plateInnerD = plateArc(ng.rho - TN / 2);
  const plateOuter = plateOuterD.map((q) => map(q[0], q[1]));
  const plateInner = plateInnerD.map((q) => map(q[0], q[1]));
  // Groove lumen: the apical arc, closed a little above the fold tips so it meets the amniotic cavity without a seam.
  const tipD = Math.min(plateInnerD[plateInnerD.length - 1][1], 0) - 3;
  const grooveD: Pt[] = [...plateInnerD, [plateInnerD[plateInnerD.length - 1][0], tipD], [plateInnerD[0][0], tipD]];
  const grooveOpen = p.neural < 0.86;
  const foldK = ss((p.neural - 0.25) / 0.2) * (1 - ss((p.neural - 0.8) / 0.1));

  // --- surface ectoderm (right half centre-line; mirrored for the left)
  const ectoLine = (side: 1 | -1): Pt[] => {
    const cr = ng.crest;
    const closedK = ng.closed;
    const x0 = lerp(cr[0], 0, closedK);
    const d0 = lerp(cr[1], TE / 2, closedK);
    return range(0, 1, 60).map((u): Pt => {
      const x = lerp(x0, L, u);
      const g = ss(((x - x0) / 70) * (1 - closedK) + closedK);
      return [side * x, lerp(d0, TE / 2, g)];
    });
  };
  const ectoR = ectoLine(1);
  const ectoL = ectoLine(-1).reverse();

  // --- crest cells
  const crestShow = ss((p.neural - 0.55) / 0.2);
  const cr = clamp(p.crest);
  const crestCells: { side: 1 | -1; pt: Pt; kind: 'home' | 'dorsal' | 'ventral' }[] = [];
  if (crestShow > 0.02)
    for (const side of [1, -1] as const) {
      const home: Pt = ng.closed > 0.5 ? [side * 14, ng.topBasal - 4] : [side * ng.crest[0], ng.crest[1] - 2];
      const dorsal: Pt[] = [home, [side * 60, TE + 8], [side * 150, TE + 9], [side * 250, TE + 9]];
      const ventral: Pt[] = [home, [side * ((ng.rho + TN / 2) * ng.sx + 10), ng.cy - 10], [side * ((ng.rho + TN / 2) * ng.sx + 14), ng.cy + 22], [side * 58, dAorta - 22], [side * 70, dEndo(70) - 8]];
      for (let j = 0; j < 7; j++) {
        const lag = j * 0.06;
        const u = clamp((cr - lag) / (1 - lag));
        if (cr < 0.02 || u <= 0) {
          crestCells.push({ side, pt: [home[0] + side * (j % 3) * 5, home[1] - Math.floor(j / 3) * 5], kind: 'home' });
          continue;
        }
        const path = j % 2 === 0 ? dorsal : ventral;
        const ku = j % 2 === 0 ? u * (0.6 + 0.4 * rand(j)) : u * (0.45 + 0.55 * rand(j + 3));
        crestCells.push({ side, pt: resample(path, ku), kind: j % 2 === 0 ? 'dorsal' : 'ventral' });
      }
    }
  const drgK = ss((cr - 0.55) / 0.3);

  const amnionShow = vis('amnion', p.amnion);
  const yolkShow = vis('yolk', p.yolk);

  return (
    <g>
      {/* Yolk sac: endoderm lining + extra-embryonic splanchnic mesoderm; cavity shaded. */}
      {yolkShow > 0.01 && (
        <Part id={s.id('yolk')} show={yolkShow}>
          <path d={yolkCavity} fill="#3a3218" />
          <path d={yolkCavity} fill="url(#g-cavity)" opacity={0.6} />
          <Cells outer={yolkPath(TEN * p.k)} inner={yolkPath(0)} n={Math.round((ys.Rys * 5) / (11 * p.k)) + 8} fill={C.endoderm} nk={0.5} seed={11} />
          <Cells outer={yolkPath((TEN + 7) * p.k)} inner={yolkPath(TEN * p.k)} n={Math.round((ys.Rys * 5) / (26 * p.k)) + 6} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={12} />
        </Part>
      )}
      {yolkShow > 0.01 && f > 0.55 && (
        <Part id={s.id('vitelline')} show={yolkShow * ss((f - 0.55) / 0.25)}>
          <path
            d={`M${f1(ys.A_L[0] - (TEN + 7) * p.k)},${f1(ys.A_L[1])}L${f1(ys.A_R[0] + (TEN + 7) * p.k)},${f1(ys.A_R[1])}L${f1(ys.A_R[0] + (TEN + 7) * p.k)},${f1(ys.A_R[1] + ys.neck * 0.9)}L${f1(ys.A_L[0] - (TEN + 7) * p.k)},${f1(ys.A_L[1] + ys.neck * 0.9)}Z`}
            fill="#fff"
            opacity={0.001}
          />
        </Part>
      )}

      {/* Amniotic cavity (fluid) between the amnion and the dorsal surface. */}
      {amnionShow > 0.01 && (
        <Part id={s.id('amnion')} show={amnionShow}>
          <path d={cavity} fill="rgba(120,170,255,0.13)" />
        </Part>
      )}

      {/* Intra-embryonic mesoderm: paraxial (darker), intermediate, lateral plate. */}
      <Part id={s.id(m < 0.25 ? 'meso' : 'lateral')}>
        <path d={regionPath(s, -L, L, () => TE - 1, (x) => dEndo(x) + 1, 80)} fill={m < 0.25 ? C.mesoIntra : C.mesoLateral} />
      </Part>
      {m >= 0.25 && (
        <>
          <Part id={s.id('paraxial')} show={vis('paraxial', ss((m - 0.25) / 0.1))}>
            <path d={regionPath(s, X_PAR[0], X_PAR[1], () => TE - 1, (x) => dEndo(x) + 1, 12)} fill={C.mesoParaxial} />
            <path d={regionPath(s, -X_PAR[1], -X_PAR[0], () => TE - 1, (x) => dEndo(x) + 1, 12)} fill={C.mesoParaxial} />
          </Part>
          <Part id={s.id('intermediate')} show={vis('intermediate', ss((m - 0.25) / 0.1))}>
            <path d={regionPath(s, X_INT[0], X_INT[1], () => TE - 1, (x) => dEndo(x) + 1, 6)} fill={C.mesoIntermediate} />
            <path d={regionPath(s, -X_INT[1], -X_INT[0], () => TE - 1, (x) => dEndo(x) + 1, 6)} fill={C.mesoIntermediate} />
          </Part>
        </>
      )}
      {/* Coelom: first isolated vesicles, then one cavity separating parietal and visceral layers. */}
      {(coelomK > 0.02 || vesK > 0.02) && (
        <Part id={s.id('coelom')}>
          {coelomK > 0.02 && (
            <>
              {[1, -1].map((sd) => {
                const x0 = cXm;
                const top = range(L, x0 + 10, 36).map((x): Pt => [x, cTop + 1]);
                const bot = range(x0 + 10, L, 36).map((x): Pt => [x, cBot(x) - 1]);
                const pts = [...top, [x0, (cTop + cBot(x0)) / 2] as Pt, ...bot].map((q) => map(sd * q[0], q[1]));
                return <path key={sd} d={smoothPath(pts, true, 0.25)} fill="#1a0c22" stroke="rgba(255,160,160,0.25)" strokeWidth={1} />;
              })}
            </>
          )}
          {vesK > 0.02 &&
            [230, 292, 354, 416, 478].flatMap((vx) =>
              [1, -1].map((sd) => {
                const [X, Y] = map(sd * vx, (cTop + cBot(vx)) / 2);
                return <ellipse key={`${vx}${sd}`} cx={X} cy={Y} rx={18 * vesK * p.k} ry={(7 * vesK + 1) * p.k} fill="#12091a" />;
              }),
            )}
        </Part>
      )}
      {m >= 0.5 && coelomK > 0.3 && (
        <>
          <Part id={s.id('parietal')} show={vis('parietal', coelomK)}>
            {[1, -1].map((sd) => {
              const x0 = lerp(L, 200, coelomK) + 14;
              const xs = range(x0, L, 30);
              const outer = xs.map((x) => map(sd * x, cTop - 3));
              const inner = xs.map((x) => map(sd * x, cTop + 1.5));
              return (
                <g key={sd}>
                  <path d={regionPath(s, sd > 0 ? x0 : -L, sd > 0 ? L : -x0, () => TE, () => cTop, 30)} fill="#ffc2c2" opacity={0.22} />
                  <Cells outer={outer} inner={inner} n={Math.max(3, Math.round((L - x0) / 12))} fill="#f9b4b4" nucleus="rgba(120,20,30,0.7)" edge="rgba(120,20,30,0.35)" nk={0.5} seed={81 + sd} />
                </g>
              );
            })}
          </Part>
          <Part id={s.id('visceral')} show={vis('visceral', coelomK)}>
            {[1, -1].map((sd) => {
              const x0 = cXm + 14;
              const xs = range(x0, L, 30);
              const outer = xs.map((x) => map(sd * x, cBot(x) - 1.5));
              const inner = xs.map((x) => map(sd * x, cBot(x) + 3));
              return (
                <g key={sd}>
                  <path d={regionPath(s, sd > 0 ? x0 : -L, sd > 0 ? L : -x0, cBot, (x) => dEndo(x), 30)} fill="#b91c3c" opacity={0.22} />
                  <Cells outer={outer} inner={inner} n={Math.max(3, Math.round((L - x0) / 12))} fill="#e0707f" nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" nk={0.5} seed={91 + sd} />
                </g>
              );
            })}
          </Part>
        </>
      )}
      {/* Dorsal mesentery: the thin midline sheet left between the two coelom halves, hanging the gut tube. */}
      {mesK > 0.02 && coelomK > 0.5 && (
        <Part id={s.id('mesentery')} show={vis('mesentery', mesK)}>
          <path d={regionPath(s, -26, 26, () => dAorta + 4, () => dEndo(0) + 1, 8)} fill="#fda4af" opacity={0.16} />
        </Part>
      )}
      {/* Mesenchyme filling the core of the elevated neural folds (between neuroepithelium and surface ectoderm). */}
      {p.neural > 0.05 && ng.closed < 0.99 &&
        [1, -1].map((sd) => {
          const half = plateOuterD.slice(Math.floor(plateOuterD.length / 2));
          const ecto = ectoLine(1).filter((q) => q[0] < ng.crest[0] + 110);
          const xFar = ecto[ecto.length - 1][0];
          const pts: Pt[] = [[0, TE + 2], [xFar, TE + 2], ...ecto.slice().reverse().map((q): Pt => [q[0], q[1] + TE / 2]), ...half.slice().reverse()];
          return <path key={sd} d={`M${pts.map((q) => map(sd * q[0], q[1])).map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`} fill={m < 0.25 ? C.mesoIntra : C.mesoParaxial} />;
        })}
      <Mesenchyme
        s={s}
        color="rgba(110,14,30,0.75)"
        inside={(x, d) => Math.abs(x) < L && d > TE + 2 && d < dEndo(x) - 2 && !inCoelom(x, d) && !tubeIn(x, d) && !notoIn(x, d) && !(epith > 0.3 && somIn(x, d)) && !aortaIn(x, d)}
      />

      {/* Somites: paraxial block → epithelial ball → sclerotome + dermomyotome → dermatome + myotome. */}
      {m >= 0.25 && sK > 0 && <Somites s={s} epith={epith} scler={scler} myo={myo} />}

      {/* Paired dorsal aortae. */}
      {p.aorta > 0.02 && (
        <Part id={s.id('aorta')} show={vis('aorta', p.aorta)}>
          {[1, -1].map((sd) => {
            const [X, Y] = map(sd * 48, dAorta);
            return (
              <g key={sd}>
                <circle cx={X} cy={Y} r={10 * p.k} fill="#f3e9ea" />
                <circle cx={X} cy={Y} r={7.5 * p.k} fill="#b3122a" />
                {[0, 1, 2].map((j) => (
                  <circle key={j} cx={X + (j - 1) * 3 * p.k} cy={Y + ((j % 2) - 0.5) * 3 * p.k} r={1.6 * p.k} fill="#ff6b7d" />
                ))}
              </g>
            );
          })}
        </Part>
      )}

      {/* Notochord: rod of vacuolated cells ventral to the neural plate/tube. */}
      <Part id={s.id('notochord')}>
        {(() => {
          const [X, Y] = map(0, dNoto);
          const r = R_NOTO * p.k;
          return (
            <g>
              <circle cx={X} cy={Y} r={r} fill={C.notochord} stroke="#5b21b6" strokeWidth={1} />
              {[0, 1, 2, 3, 4, 5].map((j) => {
                const a = (j / 6) * Math.PI * 2;
                return <circle key={j} cx={X + Math.cos(a) * r * 0.55} cy={Y + Math.sin(a) * r * 0.55} r={r * 0.22} fill="#4c1d95" opacity={0.7} />;
              })}
              <circle cx={X} cy={Y} r={r * 0.25} fill="#e9d5ff" opacity={0.6} />
            </g>
          );
        })()}
      </Part>

      {/* Endoderm: one layer of cuboidal cells (gut lining after folding). */}
      <Part id={s.id(f > 0.8 ? 'gut' : 'endoderm')}>
        {(() => {
          const line = range(-L, L, 120).map((x): Pt => [x, dEndo(x)]);
          const { outer, inner } = bandPts(s, line, 0, TEN);
          return <Cells outer={outer} inner={inner} n={96} fill={C.endoderm} nk={0.5} seed={5} />;
        })()}
      </Part>

      {/* Neural groove (amniotic fluid inside the U) and the neuroepithelium. */}
      {grooveOpen && amnionShow > 0.01 && (
        <Part id={s.id('groove')} show={ss((p.neural - 0.08) / 0.15)}>
          <path d={smoothPath(grooveD.map((q) => map(q[0], q[1])), true, 0.2)} fill="#0c0c0e" />
          <path d={smoothPath(grooveD.map((q) => map(q[0], q[1])), true, 0.2)} fill="rgba(120,170,255,0.13)" />
        </Part>
      )}
      <Part id={s.id(p.neural >= 0.84 ? 'tube' : 'plate')}>
        {p.neural >= 0.84 && (
          <path d={smoothPath(plateInner, true, 0.3)} fill="#0c1428" />
        )}
        <Cells outer={plateOuter} inner={plateInner} n={Math.max(26, Math.round(ng.psi * 16))} fill={C.neural} pseudo seed={21} nucleus="rgba(10,16,48,0.7)" />
      </Part>
      {foldK > 0.02 && (
        <Part id={s.id('folds')} show={foldK}>
          {[1, -1].map((sd) => {
            const tip = map(sd * ng.crest[0], ng.crest[1]);
            return <circle key={sd} cx={tip[0]} cy={tip[1]} r={15 * p.k} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} strokeDasharray="3 3" />;
          })}
        </Part>
      )}

      {/* Surface ectoderm (cuboidal) — continuous with the neuroepithelium at the fold tips. */}
      <Part id={s.id('ectoderm')}>
        {(() => {
          const r = bandPts(s, ectoR, -TE / 2, TE / 2);
          const l = bandPts(s, ectoL, -TE / 2, TE / 2);
          return (
            <>
              <Cells outer={r.outer} inner={r.inner} n={Math.round((L - Math.max(0, ng.crest[0] * (1 - ng.closed))) / 11)} fill={C.surfaceEcto} nk={0.5} seed={31} />
              <Cells outer={l.outer} inner={l.inner} n={Math.round((L - Math.max(0, ng.crest[0] * (1 - ng.closed))) / 11)} fill={C.surfaceEcto} nk={0.5} seed={37} />
            </>
          );
        })()}
      </Part>

      {/* Amnion wall: amnioblasts (squamous) + extra-embryonic somatic mesoderm. */}
      {amnionShow > 0.01 && (
        <g opacity={amnionShow}>
          <Part id={s.id('extraMeso')} quiet>
            {(() => {
              const outer = amnionOuter.map((q) => map(q[0], q[1] - 1));
              const inner = amnionOuter.map((q) => map(q[0], q[1] + 6));
              return <Cells outer={outer} inner={inner} n={46} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.55)" edge="rgba(150,70,50,0.2)" seed={41} />;
            })()}
          </Part>
          <Part id={s.id('amnion')}>
            {(() => {
              const outer = amnionInner.map((q) => map(q[0], q[1] - 4));
              const inner = amnionInner.map((q) => map(q[0], q[1]));
              return <Cells outer={outer} inner={inner} n={70} fill={C.amnioblast} nk={0.5} seed={43} />;
            })()}
          </Part>
        </g>
      )}

      {/* Neural crest cells and what they become. */}
      {crestShow > 0.02 && (
        <Part id={s.id('crest')} show={vis('crest', crestShow)}>
          {crestCells.map((c, i) => {
            const [X, Y] = map(c.pt[0], c.pt[1]);
            return <ellipse key={i} cx={X} cy={Y} rx={4.6 * p.k} ry={3.4 * p.k} fill={C.neuralCrest} stroke="#0f766e" strokeWidth={0.9} />;
          })}
        </Part>
      )}
      {drgK > 0.02 && (
        <>
          <Part id={s.id('drg')} show={vis('drg', drgK)}>
            {[1, -1].map((sd) => {
              const [X, Y] = map(sd * ((ng.rho + TN / 2) * ng.sx + 16), ng.cy + 14);
              return <ellipse key={sd} cx={X} cy={Y} rx={10 * p.k} ry={15 * p.k} fill={C.neuralCrest} opacity={0.85} stroke="#0f766e" />;
            })}
          </Part>
          <Part id={s.id('sympathetic')} show={vis('sympathetic', ss((cr - 0.75) / 0.2))}>
            {[1, -1].map((sd) => {
              const [X, Y] = map(sd * 64, dAorta - 16);
              return <ellipse key={sd} cx={X} cy={Y} rx={7 * p.k} ry={6 * p.k} fill={C.neuralCrest} opacity={0.85} stroke="#0f766e" />;
            })}
          </Part>
        </>
      )}
    </g>
  );
}

function Somites({ s, epith, scler, myo }: { s: Section; epith: number; scler: number; myo: number }) {
  const { map, somite: so, dNoto, neural: ng } = s;
  const out: ReactNode[] = [];
  for (const sd of [1, -1] as const) {
    const ring = (rx: number, rd: number, a0 = 0, a1 = Math.PI * 2, n = 40) =>
      range(a0, a1, n).map((a): Pt => [sd * (so.cx + rx * Math.cos(a)), so.cd + rd * Math.sin(a)]);
    // Epithelial somite: radial columnar cells around a small cavity (somitocoel).
    if (epith > 0.02 && scler < 0.98) {
      // Before the sclerotome leaves, the whole ring; afterwards only the dorsolateral arc remains epithelial.
      const a0 = lerp(0, -Math.PI * 0.95, scler);
      const a1 = lerp(Math.PI * 2, -Math.PI * 0.05, scler);
      const outer = ring(so.rx, so.rd, a0, a1).map((q) => map(q[0], q[1]));
      const inner = ring(so.rx * 0.46, so.rd * 0.46, a0, a1).map((q) => map(q[0], q[1]));
      out.push(
        <Part key={`som${sd}`} id={s.id('somite')} show={epith * (1 - scler)}>
          <Cells outer={outer} inner={inner} n={26} fill={C.mesoParaxial} pseudo seed={51 + sd} nucleus="rgba(80,6,18,0.7)" />
        </Part>,
      );
    }
    if (scler > 0.02) {
      // Sclerotome: ventromedial cells become mesenchyme and move towards the notochord / tube.
      const cells: ReactNode[] = [];
      for (let j = 0; j < 26; j++) {
        const a = Math.PI * (0.2 + 0.9 * rand(j * 3.3 + sd));
        const r0 = 0.9 * Math.sqrt(rand(j * 7.1 + sd));
        const start: Pt = [sd * (so.cx + so.rx * r0 * Math.cos(a)), so.cd + so.rd * r0 * Math.sin(a)];
        const goal: Pt = [sd * (14 + 26 * rand(j * 1.7)), lerp(ng.cy, dNoto + 10, rand(j * 2.9))];
        const q = lerp(0, 0.75, ss((scler - 0.2) / 0.8) * rand(j * 4.4 + 1));
        const [X, Y] = map(lerp(start[0], goal[0], q), lerp(start[1], goal[1], q));
        cells.push(<ellipse key={j} cx={X} cy={Y} rx={3.6 * s.k} ry={2.6 * s.k} fill="#b4533c" stroke="#6b2413" strokeWidth={0.6} />);
      }
      out.push(
        <Part key={`scl${sd}`} id={s.id('sclerotome')} show={scler}>
          {cells}
        </Part>,
      );
      // Dermomyotome: dorsolateral epithelial plate under the ectoderm.
      const arc = ring(so.rx * 0.95, so.rd * 0.85, -Math.PI * 0.95, -Math.PI * 0.08, 24);
      const outer = arc.map((q) => map(q[0], q[1]));
      const inner = ring(so.rx * 0.95 - 11, so.rd * 0.85 - 11, -Math.PI * 0.95, -Math.PI * 0.08, 24).map((q) => map(q[0], q[1]));
      out.push(
        <Part key={`dm${sd}`} id={s.id(myo > 0.5 ? 'dermatome' : 'dermomyotome')} show={scler}>
          <Cells outer={outer} inner={inner} n={14} fill="#9a3b2e" pseudo seed={61 + sd} nucleus="rgba(50,8,8,0.7)" />
        </Part>,
      );
      if (myo > 0.02) {
        const mo = ring(so.rx * 0.95 - 13, so.rd * 0.85 - 13, -Math.PI * 0.85, -Math.PI * 0.18, 18).map((q) => map(q[0], q[1]));
        const mi = ring(so.rx * 0.95 - 25, so.rd * 0.85 - 25, -Math.PI * 0.85, -Math.PI * 0.18, 18).map((q) => map(q[0], q[1]));
        out.push(
          <Part key={`my${sd}`} id={s.id('myotome')} show={myo}>
            <Cells outer={mo} inner={mi} n={10} fill="#c2410c" seed={71 + sd} nk={0.5} nucleus="rgba(60,20,8,0.75)" />
          </Part>,
        );
      }
    }
  }
  return <g>{out}</g>;
}
