'use client';

import { C, CellBand, Flow, Label, Mark, Note, Part, ellipseArc, lerp, lin, mix, rand, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { SINUSOIDS, fibrinPlug, sinusoidPath } from './Day9';
import { ARTERIES, Backing, CYTO, GLANDS, HYPO_BOTTOM, INNER, R, StromaFill, TrapBand, VESSELS, W2, bandAround, conceptusAt, discGeometry, f1, inHalf, lensPath, outHalf, stalkBridge, synTh9, toCyto } from './common';
import { CellRing, Epithelium, Gland, SinusoidShape, SpiralArtery, SynFill, Vessel, W2Defs, radialPath } from './materials';

/**
 * 11-12. eguna — sare lakunarra, hasierako zirkulazio uteroplazentarioa, enbrioi kanpoko
 * mesodermoa eta korion barrunbea (Langman 4-4 irudia).
 * Windows (shared by every view and the stage beats in content/weeks/week2.ts):
 *   .00-.06 fibrina koagulu txikia oraindik han · .04-.20 lakuak handitu eta kanalen bidez elkartzen dira: sare lakunarra
 *   .16-.25 sinzitioa sinusoideetaraino sartu eta haien pareta urratzen du (odola kanaletan sartzen da)
 *   .26-.38 amaren odola laku sare osoan zehar hedatzen da: hasierako zirkulazio uteroplazentarioa
 *   .42-.50 bitelo zakuaren paretako zelulak ugaldu eta zitoraino betetzen dute: enbrioi kanpoko mesodermoa
 *   .42-.605 konzeptua hazten da (zitoa zelula-zatiketaz) · .54-.605 mesodermoan hutsuneak ireki (banan-banan),
 *   handitu eta fusionatzen dira — urratsaren amaierako irudirako (.605) korion barrunbea osatuta
 *   .82-.88 desidua erreakzioa habiratze-gunearen inguruan · .92-.965 endometrio osora hedatzen da
 */
export const W = {
  fibrin: [0, 0.06],
  network: [0.04, 0.2],
  erosion: [0.16, 0.28],
  circulation: [0.26, 0.4],
  mesoGrow: [0.42, 0.68],
  cavitate: [0.54, 0.605],
  decidua: [0.82, 0.88],
  cells: [0.83, 0.875],
  spread: [0.92, 0.965],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm = (a: number) => (a < 90 ? a + 360 : a);
/** Signed smallest difference between two angles (degrees). */
const dAng = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/** Half-width of the fibrin plug still sealing the entry point: small on day 11 ("txiki-txikia"), smaller by day 12 as the epithelium closes over it. */
const PLUG: [number, number] = [24, 13];
/** The implantation site bulges into the uterine lumen ("goragunea"); day 13 continues it. */
export const BULGE = 9;
/** Surface of the endometrium at x: flat, bulging into the lumen over the implantation site. */
export const surfaceAt = (x: number, bulge: number) => W2.surfaceY + bulge * Math.exp(-(((x - W2.cx) / 150) ** 2));
/** Trophoblast radius at the end of day 12; day 13 continues from here. */
export const RC_END = 175;
const CY0 = W2.surfaceY - 10 - R;
/** Angle where the hypoblast disc's edge meets the cytotrophoblast (amnion/disc side has no Heuser membrane). */
const EDGE_H = (Math.asin(-HYPO_BOTTOM / INNER) * 180) / Math.PI;
const AMNION_L = 180 + EDGE_H;
const AMNION_R = 360 - EDGE_H;
/** Fluid-filled space: darker than the amnion (blue) and the yolk sac (yellow), as in week 3. */
export const CAVITY = '#111a2e';
const HEUSER = '#f7d98a';
const MESO_EDGE = '#c26a48';
/** Clear lacunar fluid (solid, so overlapping lacunae and channels merge without seams). */
const LAC = '#c9e6dd';
const LAC_EDGE = '#0f5a3c';
const BLOOD_EDGE = '#5a0a1a';

/**
 * The trophoblast shell (centre cyC) grows much faster than the embryo complex (amnion + disc +
 * yolk sac, centre cy), which stays hung from the future connecting stalk at the embryonic pole.
 */
function geometry(t: number) {
  // Eased out: the gap opens at once (the mesoderm is seen budding into it), then slows as the cavity forms.
  const grow = 1 - (1 - lin(t, W.mesoGrow[0], W.cavitate[1])) ** 2;
  const Rc = lerp(R, RC_END, grow);
  const { cyC, cy, D } = conceptusAt(Rc);
  const core = discGeometry(W2.cx, cy);
  // Linear: the phases of the cavitation (appear, enlarge, merge) get even shares of the step.
  const cav = lin(t, W.cavitate[0], W.cavitate[1]);
  return {
    ...core,
    cyC,
    Rc,
    grow,
    cav,
    thickness: D,
    plug: lerp(PLUG[0], PLUG[1], s(t, W.fibrin)),
  };
}
type Geo = ReturnType<typeof geometry>;
/** What the trophoblast-shell helpers need: its centre, radius and how far the syncytium has thickened (0..1). Day 13 reuses them. */
export interface Shell {
  cx: number;
  cyC: number;
  Rc: number;
  grow: number;
}
/** The shell as day 12 leaves it, at radius Rc (day 13 keeps growing it). */
export const shellOf = (Rc: number): Shell => ({
  cx: W2.cx,
  cyC: conceptusAt(Rc).cyC,
  Rc,
  grow: 1,
});

/** Syncytium thickness without the tongues reaching the sinusoids: day 9's profile, thickening as the conceptus grows. */
export const synBase = (g: Shell, a: number) => synTh9(norm(a)) * (1 + 0.15 * g.grow);
/** Around the trophoblast centre (syncytio, lacunae, cyto). */
export const polar = (g: Shell, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cyC + r * Math.sin(rad(a))];
/** Around the embryo-complex centre (mesoderm, cavity, stalk). */
const polarE = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];
/** From the embryo-complex centre to the cytotrophoblast's inner face, along angle a. */
const outR = (g: Geo, a: number) => toCyto(g.cy, g.cyC, g.Rc, a);
const synAt = (g: Shell, a: number, frac: number): Pt => polar(g, a, g.Rc + frac * synBase(g, a));
function thLo(g: Shell, a: number, span: number) {
  let lo = Infinity;
  for (let d = -span; d <= span; d += 1) lo = Math.min(lo, synBase(g, a + d));
  return lo;
}

/* ---------- Sinusoids (day 9's, carried outwards by the growing shell) and their erosion ---------- */

const SIN = SINUSOIDS.map((q, i) => {
  const dx = q.x - W2.cx;
  const dy = q.y - CY0;
  // Each one is reached and opened in turn; the last ends just before the step's complete frame (.245).
  const t0 = W.erosion[0] + i * 0.007;
  const phi = norm(deg(Math.atan2(dy, dx)));
  const d0 = Math.hypot(dx, dy);
  /** Stroma between the syncytium and the sinusoid's wall at the end of day 9. */
  const gap0 = Math.max(0, d0 - q.rr - (R + synTh9(phi)));
  return { q, phi, d0, gap0, t0, t1: t0 + 0.05 };
});
/** Dilation: the sinusoids enlarge further with the decidual reaction. */
const sinDil = (t: number) => lerp(1, 1.2, s(t, W.decidua));
const erosionOf = (t: number, i: number) => seg(t, SIN[i].t0, SIN[i].t1);
/**
 * Sinusoid centre: carried out by the growing shell. While the syncytium erodes the stroma between
 * them it closes in (half the gap); the syncytium covers the rest and wraps the sinusoid's inner side.
 */
function sinusoidAt(g: Shell, i: number, t: number): Pt {
  const { phi, d0, gap0 } = SIN[i];
  const reach = seg(erosionOf(t, i), 0, 0.6);
  const r = d0 + (g.Rc - R) + (synBase(g, phi) - synTh9(phi)) - gap0 * 0.55 * reach;
  return polar(g, phi, r);
}
/** Point on the sinusoid's wall facing the conceptus. */
function sinusoidWall(g: Shell, i: number, t: number): Pt {
  const [x, y] = sinusoidAt(g, i, t);
  const rr = SIN[i].q.rr * sinDil(t);
  return [x - Math.cos(rad(SIN[i].phi)) * rr, y - Math.sin(rad(SIN[i].phi)) * rr];
}
/** Syncytial tongue pushing out to each sinusoid (px added to the outer radius at angle a). */
function bumps(g: Shell, t: number, a: number) {
  let b = 0;
  for (let i = 0; i < SIN.length; i++) {
    const e = erosionOf(t, i);
    if (e <= 0) continue;
    const { phi, q } = SIN[i];
    const c = sinusoidAt(g, i, t);
    const dist = Math.hypot(c[0] - g.cx, c[1] - g.cyC);
    // Reach the wall on a broad front, then wrap the inner half of the sinusoid once its wall is open.
    const toWall = Math.max(0, dist - q.rr * sinDil(t) - (g.Rc + synBase(g, phi)));
    const h = toWall * seg(e, 0, 0.6) + q.rr * sinDil(t) * 0.7 * seg(e, 0.5, 1);
    const sig = deg((q.len * 0.95) / dist);
    b += h * Math.exp(-((dAng(a, phi) / sig) ** 2));
  }
  return b;
}

/** Outer surface of the syncytium (with its tongues round the opened sinusoids). */
export function syncytioOuter(g: Shell, t: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < 240; i++) {
    const a = 90 + i * 1.5;
    pts.push(polar(g, a, g.Rc + synBase(g, a) + bumps(g, t, a)));
  }
  return smoothPath(pts, true);
}
const syncytioPath = (g: Shell, t: number) => `${syncytioOuter(g, t)}${radialPath(g.cx, g.cyC, () => g.Rc - 0.5, 6)}`;

/* ---------- Lacunar network ---------- */

/**
 * Lacunae around the shell (angles in the 90..450 range): day 9's eight at the embryonic pole
 * (same seeds, so day 11 starts where day 9 ended) plus the four lateral vacuoles, which now grow into lacunae too.
 */
const CHAIN: { a: number; seed: number; side: boolean }[] = [
  { a: 146, seed: 11.3, side: true },
  { a: 166, seed: 12.9, side: true },
  ...[188, 212, 236, 259, 282, 305, 328, 352].map((a, i) => ({
    a,
    seed: i * 1.9 + 0.7,
    side: false,
  })),
  { a: 374, seed: 14.1, side: true },
  { a: 394, seed: 15.7, side: true },
];
/** Angles of the lacunae (90..450): day 13 grows its villi between them. */
export const LACUNA_A = CHAIN.map((c) => c.a);
/** The lacuna each sinusoid is opened into. */
const ENTRY = SIN.map(({ phi }) => CHAIN.reduce((best, c, j) => (Math.abs(dAng(c.a, phi)) < Math.abs(dAng(CHAIN[best].a, phi)) ? j : best), 0));
/** Side branches: from a lacuna towards the surface (absorbing day 9's outer vacuoles) or towards the cyto. */
const SPURS: { from: number; a: number; frac: number }[] = [
  { from: 4, a: 247, frac: 0.86 },
  { from: 7, a: 294, frac: 0.86 },
  { from: 2, a: 181, frac: 0.88 },
  { from: 6, a: 276, frac: 0.14 },
  { from: 8, a: 337, frac: 0.88 },
  { from: 9, a: 361, frac: 0.16 },
  { from: 3, a: 205, frac: 0.14 },
  { from: 5, a: 266, frac: 0.9 },
];
/** When blood reaches lacuna j: first those next to an opened sinusoid, then outwards along the network. */
const BLOOD_AT = CHAIN.map((_, j) => Math.min(...ENTRY.map((e, i) => W.circulation[0] + 0.004 * i + 0.028 * Math.abs(j - e))));
const bloodOf = (t: number, j: number) => seg(t, BLOOD_AT[j], BLOOD_AT[j] + 0.05);

function lacunaShape(g: Shell, a: number, k: number, seed: number) {
  const lo = thLo(g, a, 9);
  // Each lacuna its own size, shape and tilt (as on day 9), growing with the shell.
  const size = 0.8 + 0.4 * Math.sin(seed * 3.1);
  const tilt = rad(28 * Math.sin(seed * 2.3));
  const [cx, cy] = synAt(g, a + 3 * Math.sin(seed * 1.3), 0.5 + 0.08 * Math.cos(seed * 1.9));
  const tr = 17 * (g.Rc / R) * k * size;
  const rr = 0.26 * lo * k * (1.25 - 0.3 * size);
  const ang = rad(a) + tilt;
  const tx = -Math.sin(ang);
  const ty = Math.cos(ang);
  const nx = Math.cos(ang);
  const ny = Math.sin(ang);
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const phi = (i / 14) * Math.PI * 2;
    const w = 1 + 0.24 * Math.sin(3 * phi + seed) + 0.12 * Math.cos(5 * phi + seed * 2.3) + 0.1 * Math.sin(2 * phi + seed * 0.7);
    const u = tr * w * Math.cos(phi);
    const v = rr * w * Math.sin(phi);
    pts.push([cx + u * tx + v * nx, cy + u * ty + v * ny]);
  }
  return smoothPath(pts, true);
}
const lacunaCentre = (g: Shell, j: number): Pt => {
  const { a, seed } = CHAIN[j];
  return synAt(g, a + 3 * Math.sin(seed * 1.3), 0.5 + 0.08 * Math.cos(seed * 1.9));
};
const poly = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}`;
/** Points along a quadratic curve p0 → (control c) → p1, from u = u0 to u1. */
export function quad(p0: Pt, c: Pt, p1: Pt, u0 = 0, u1 = 1, n = 9): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const u = lerp(u0, u1, i / (n - 1));
    const v = 1 - u;
    return [v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]] as Pt;
  });
}
/** Closed outline of a tube along `pts` whose width varies along it (w(u), u 0..1), with rounded ends. */
export function tube(pts: Pt[], w: (u: number) => number) {
  const n = pts.length;
  const L: Pt[] = [];
  const Rt: Pt[] = [];
  const dirAt = (i: number): Pt => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  for (let i = 0; i < n; i++) {
    const [dx, dy] = dirAt(i);
    const h = Math.max(0.2, w(i / (n - 1)) / 2);
    L.push([pts[i][0] - dy * h, pts[i][1] + dx * h]);
    Rt.push([pts[i][0] + dy * h, pts[i][1] - dx * h]);
  }
  const [ex, ey] = dirAt(n - 1);
  const [sx, sy] = dirAt(0);
  const he = w(1) / 2;
  const hs = w(0) / 2;
  const tip: Pt = [pts[n - 1][0] + ex * he, pts[n - 1][1] + ey * he];
  const tail: Pt = [pts[0][0] - sx * hs, pts[0][1] - sy * hs];
  return smoothPath([...L, tip, ...Rt.reverse(), tail], true, 0.5);
}

interface Blob {
  key: string;
  d: string;
  blood: number;
}
interface Stroke {
  key: string;
  d: string;
  w: number;
  blood: number;
}

/** Everything that makes the lacunar system at time t: lacunae, channels between them, side branches and the breaches into the sinusoids. */
function lacunarSystem(g: Shell, t: number, boost = 0) {
  const network = s(t, W.network);
  const blobs: Blob[] = CHAIN.map((c, j) => {
    // Side lacunae start as day 9's small vacuoles; the pole ones enlarge as they connect.
    const k = (c.side ? lerp(0.22, 0.72, seg(network, 0, 0.7)) : lerp(1, 1.28, network)) * (1 + 0.32 * boost);
    return {
      key: `l${j}`,
      d: lacunaShape(g, c.a, k, c.seed),
      blood: bloodOf(t, j),
    };
  });
  // Day 9's outer vacuoles, swallowed by the branches that reach them.
  const spurOpen = (i: number) => {
    const d0 = 0.3 + 0.35 * rand(i * 3.1 + 5);
    return seg(network, d0, d0 + 0.4);
  };
  for (const [i, sp] of SPURS.slice(0, 2).entries()) {
    const [x, y] = synAt(g, sp.a, sp.frac);
    const r = 3 * (1 - seg(spurOpen(i), 0.6, 1));
    if (r < 0.3) continue;
    blobs.push({
      key: `v${i}`,
      d: `M${f1(x - r)},${f1(y)} a${f1(r)},${f1(r * 0.8)} 0 1 0 ${f1(2 * r)},0 a${f1(r)},${f1(r * 0.8)} 0 1 0 ${f1(-2 * r)},0Z`,
      blood: bloodOf(t, sp.from),
    });
  }
  const channels: Stroke[] = [];
  for (let j = 0; j < CHAIN.length - 1; j++) {
    const a0 = CHAIN[j].a;
    const a1 = CHAIN[j + 1].a;
    const d0 = 0.42 * rand(j * 7.3 + 1);
    const open = seg(network, d0, d0 + 0.5);
    if (open < 0.02) continue;
    // A winding channel through the syncytium, dipping towards the cyto or the surface alternately.
    const sgn = j % 2 ? 1 : -1;
    const pts: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const a = lerp(a0, a1, u);
      pts.push(synAt(g, a, 0.5 + sgn * 0.17 * Math.sin(Math.PI * u) + 0.05 * Math.sin(u * 9 + j)));
    }
    pts[0] = lacunaCentre(g, j);
    pts[10] = lacunaCentre(g, j + 1);
    const lo = Math.min(thLo(g, a0, 2), thLo(g, a1, 2), thLo(g, (a0 + a1) / 2, 4));
    const w = Math.min(9, 0.26 * lo) * open * (1 + 0.45 * boost);
    // Irregular calibre: narrow necks and wider pools along the way.
    const d = tube(pts, (u) => w * (0.72 + 0.4 * Math.sin(Math.PI * (2 * u + 0.3 * j)) ** 2));
    channels.push({
      key: `c${j}`,
      d,
      w,
      blood: Math.min(bloodOf(t, j), bloodOf(t, j + 1)) * 0.5 + Math.max(bloodOf(t, j), bloodOf(t, j + 1)) * 0.5,
    });
  }
  for (const [i, sp] of SPURS.entries()) {
    const open = spurOpen(i);
    if (open < 0.02) continue;
    const p0 = lacunaCentre(g, sp.from);
    const p1 = synAt(g, sp.a, sp.frac);
    const c = synAt(g, (CHAIN[sp.from].a + sp.a) / 2 + 3 * Math.sin(i * 2.3), (0.5 + sp.frac) / 2);
    const lo = thLo(g, sp.a, 3);
    const w = Math.min(7, 0.2 * lo) * Math.min(1, open * 1.5);
    // Grows out of the lacuna and tapers to a blind end.
    channels.push({
      key: `s${i}`,
      d: tube(quad(p0, c, p1, 0, open, 7), (u) => w * (1 - 0.3 * u)),
      w,
      blood: seg(t, BLOOD_AT[sp.from] + 0.02, BLOOD_AT[sp.from] + 0.07),
    });
  }
  // Breaches: a lacunar branch grows out to the sinusoid; when it touches it, the wall gives way and blood runs in.
  const breaches = SIN.map((_, i) => {
    const e = erosionOf(t, i);
    if (e <= 0.02) return null;
    const j = ENTRY[i];
    const p0 = lacunaCentre(g, j);
    const wall = sinusoidWall(g, i, t);
    const c = sinusoidAt(g, i, t);
    const end: Pt = [lerp(wall[0], c[0], 0.35), lerp(wall[1], c[1], 0.35)];
    // A gently curved branch, widening into a funnel where it opens into the sinusoid.
    const sg = i % 2 ? 1 : -1;
    const ctrl: Pt = [(p0[0] + end[0]) / 2 - (end[1] - p0[1]) * 0.18 * sg, (p0[1] + end[1]) / 2 + (end[0] - p0[0]) * 0.18 * sg];
    const reach = seg(e, 0, 0.6);
    const lo = thLo(g, SIN[i].phi, 3);
    const w = Math.min(8, 0.22 * lo + 2);
    const wf = (u: number) => w * (0.7 + 0.7 * u * u);
    // Blood enters from the sinusoid end once the wall is open, then the lacuna fills (circulation).
    const run = seg(e, 0.6, 1);
    const d = reach > 0.02 ? tube(quad(p0, ctrl, end, 0, reach), (u) => wf(u * reach)) : '';
    const bloodD = run > 0.02 ? tube(quad(p0, ctrl, end, 1 - run, 1), (u) => wf(lerp(1 - run, 1, u))) : '';
    const flow: Pt[] = [c, ...quad(p0, ctrl, end, 0, 1, 5).reverse()];
    return { key: `b${i}`, i, d, w, open: run, bloodD, end, c, wall, flow };
  }).filter((b): b is NonNullable<typeof b> => b !== null);
  return { blobs, channels, breaches };
}

/* ---------- Extra-embryonic mesoderm spaces ---------- */

/** Spaces opening in the extra-embryonic mesoderm: [angle°, radial position 0..1, opening delay, relative size]. None in the stalk (251–269°). */
const SPACES: [number, number, number, number][] = [
  [285, 0.5, 0.0, 0.8],
  [312, 0.45, 0.12, 0.6],
  [338, 0.55, 0.05, 0.9],
  [4, 0.5, 0.16, 0.7],
  [30, 0.4, 0.02, 0.85],
  [56, 0.55, 0.1, 0.6],
  [82, 0.42, 0.06, 0.9],
  [108, 0.58, 0.14, 0.7],
  [134, 0.45, 0.03, 0.8],
  [160, 0.55, 0.11, 0.65],
  [186, 0.5, 0.07, 0.85],
  [212, 0.45, 0.15, 0.6],
  [236, 0.5, 0.09, 0.75],
  // A second row where the mesoderm is thickest (abembryonic side, below the yolk sac).
  [44, 0.78, 0.08, 0.6],
  [70, 0.22, 0.13, 0.55],
  [96, 0.8, 0.04, 0.65],
  [122, 0.24, 0.1, 0.55],
  [148, 0.78, 0.15, 0.5],
  [18, 0.22, 0.12, 0.5],
];
/** Half-width (°) each space reaches when they merge: more than half the spacing, so they overlap. */
const SPACE_W = 16;

/* ---------- Stroma: vessels pushed aside, decidual cells ---------- */

/** Day 9 turned VESSELS[3] into a sinusoid and grew over 4, 5 and 7: the others stay as capillaries. */
const CAPILLARIES = [0, 1, 2, 6];
/** A stromal structure stays in the stroma: pushed out radially ahead of the growing syncytium. */
function pushed(g: Shell, [x, y]: Pt, clear: number): Pt {
  const dx = x - g.cx;
  const dy = y - g.cyC;
  const d = Math.hypot(dx, dy) || 1;
  const need = g.Rc + synBase(g, deg(Math.atan2(dy, dx))) + clear;
  return d >= need ? [x, y] : [g.cx + (dx / d) * need, g.cyC + (dy / d) * need];
}
const vesselAt = (g: Shell, i: number): Pt => pushed(g, [VESSELS[i][0], VESSELS[i][1]], 13 * VESSELS[i][2] + 8);

/** Stromal cells that become decidual cells: `near` ones (around the implantation site) first, the rest when the reaction spreads. */
const DECIDUAL_CELLS: { p: Pt; near: boolean }[] = [
  { p: [340, 180], near: true },
  { p: [660, 165], near: true },
  { p: [300, 90], near: true },
  { p: [700, 95], near: true },
  { p: [380, 140], near: true },
  { p: [620, 220], near: true },
  { p: [262, 214], near: true },
  { p: [742, 204], near: true },
  { p: [440, 70], near: true },
  { p: [560, 75], near: true },
  { p: [300, 300], near: true },
  { p: [712, 300], near: true },
  { p: [232, 62], near: false },
  { p: [772, 58], near: false },
  { p: [226, 330], near: false },
  { p: [776, 360], near: false },
  { p: [228, 440], near: false },
  { p: [780, 452], near: false },
];
const decidualAt = (g: Shell, p: Pt) => pushed(g, p, 16);

/** A stromal (spindle) cell turning into a plump polyhedral decidual cell full of glycogen and lipid (k 0..1). */
function DecidualCell({ x, y, k, seed }: { x: number; y: number; k: number; seed: number }) {
  const n = 7;
  const rot = rad(rand(seed) * 180);
  const pts: Pt[] = [];
  for (let j = 0; j < n; j++) {
    const th = (j / n) * Math.PI * 2 + (rand(seed + j * 1.7) - 0.5) * 0.5;
    const rp = 11 * (0.86 + 0.28 * rand(seed + j * 2.3));
    const rs = (12 * 3.2) / Math.hypot(3.2 * Math.cos(th), 12 * Math.sin(th));
    const r = lerp(rs, rp, k);
    pts.push([x + r * Math.cos(th + rot), y + r * Math.sin(th + rot)]);
  }
  const d = `${poly(pts)}Z`;
  return (
    <g>
      <path d={d} fill={mix('#d9909f', '#efd3b9', k)} stroke={mix('#b26478', '#c48a7e', k)} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={d} fill="url(#w2-g-cell)" opacity={0.8} />
      {k > 0.05 && (
        <g opacity={k}>
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} cx={f1(x + 6 * Math.cos(rot + j * 1.6 + 0.4))} cy={f1(y + 6 * Math.sin(rot + j * 1.6 + 0.4))} r={1.1} fill="#fffaf0" opacity={0.9} />
          ))}
          <circle cx={f1(x - 4 * Math.sin(rot))} cy={f1(y + 4 * Math.cos(rot))} r={1.7} fill="#fff1bf" stroke="#d9b56a" strokeWidth={0.5} />
        </g>
      )}
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(lerp(2.6, 3.1, k))} ry={f1(lerp(1.3, 2.9, k))} transform={`rotate(${f1(deg(rot))} ${f1(x)} ${f1(y)})`} fill={mix('#9b4560', '#a35467', k)} />
      <circle cx={f1(x + 0.6)} cy={f1(y - 0.6)} r={0.8} fill="#4a1426" opacity={k} />
    </g>
  );
}

/** A mesenchymal cell budding off the yolk-sac wall: small body, a few processes. */
function MesoCell({ x, y, a, o }: { x: number; y: number; a: number; o: number }) {
  const arms = [0, 1.9, 3.6, 5.0].map((b, i) => {
    const th = rad(a) + b;
    const l = 6 + 2 * Math.sin(i * 2.1 + a);
    return `M${f1(x)},${f1(y)} L${f1(x + l * Math.cos(th))},${f1(y + l * Math.sin(th))}`;
  });
  return (
    <g opacity={o}>
      <path d={arms.join(' ')} stroke={MESO_EDGE} strokeWidth={1.1} strokeLinecap="round" />
      <ellipse cx={f1(x)} cy={f1(y)} rx={4.2} ry={3.1} transform={`rotate(${f1(a)} ${f1(x)} ${f1(y)})`} fill="#f6b597" stroke={MESO_EDGE} strokeWidth={0.8} />
      <ellipse cx={f1(x)} cy={f1(y)} rx={1.9} ry={1.4} transform={`rotate(${f1(a)} ${f1(x)} ${f1(y)})`} fill="#a94f33" />
    </g>
  );
}

function Day1112Drawing({ t, reduced, slab = 'm-slab' }: SceneProps & { slab?: string }) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo, Rc, cav, thickness } = g;
  const lens = lensPath(g);

  // Mesoderm between the embryo complex and the cyto. It buds off the yolk-sac wall and fills the
  // space out to the cyto (front), then hollows into two thin layers joined by the stalk.
  const front = lerp(0.3, 1, seg(t, 0.42, 0.5));
  const width = (a: number) => Math.max(0, outR(g, a) - INNER);
  const bandTh = (a: number) => Math.max(4, lerp(width(a) / 2, 9, cav));
  const inner = () => INNER;
  const innerB = (a: number) => INNER + bandTh(a);
  const outer = (a: number) => outR(g, a);
  const outerB = (a: number) => Math.max(innerB(a), outR(g, a) - bandTh(a));
  // Connecting stalk: a short neck at the embryonic pole whose sides fillet into both layers.
  const STALK_A = 260;
  const stalk = stalkBridge(cx, cy, STALK_A, INNER + bandTh(STALK_A) / 2, innerB(STALK_A), outerB(STALK_A), outer(STALK_A) - bandTh(STALK_A) / 2, 22, 14);
  // The solid tissue stays between the spaces until they have merged; only then are the two layers left.
  const genericShow = thickness > 3 ? 1 - seg(cav, 0.84, 0.97) : 0;
  const layerShow = seg(cav, 0.84, 0.97);
  const cavityShow = seg(cav, 0.86, 0.98);
  const mesoOuter = (a: number) => INNER + width(a) * front * (1 + 0.1 * (1 - front) * Math.sin(rad(a) * 7 + 1.3));
  // Small spaces open at scattered points of the mesoderm (organic, lens-shaped), grow and merge into
  // one cavity; the connecting stalk never hollows. Three readable phases: they appear one by one
  // (cav 0–.31), all enlarge (.2–.52), then merge (.46–.9) — the cavity is whole before the step's held frame.
  const merge = seg(cav, 0.46, 0.9);
  const enlarge = seg(cav, 0.2, 0.52);
  const spaces = SPACES.map(([a, fr, delay, rr0], i) => {
    const appear = seg(cav, 0.01 + delay, 0.15 + delay);
    if (appear <= 0.01) return null;
    // Round little lenses from the start (never hair-thin slits), then swelling.
    const open = appear * lerp(0.55, 1, enlarge);
    const rr = Math.max(rr0, 0.7);
    const wHalf = lerp(lerp(2.5, 9, open) * (0.7 + 0.5 * rr0), SPACE_W, merge);
    const prof = lerp(0.5, 0.04, merge);
    const mid = (b: number) => lerp(INNER, outR(g, b), fr);
    const half = (b: number) => Math.max(0, Math.min(width(b) * fr, width(b) * (1 - fr)) - 4);
    const shape = (b: number) => Math.pow(Math.max(0, 1 - ((b - a) / wHalf) ** 2), prof);
    const wob = (b: number) => 1 + 0.1 * (1 - merge) * Math.sin(((b - a) / wHalf) * Math.PI * 1.4 + i * 2.7);
    const r0 = (b: number) => lerp(mid(b) - half(b) * rr * open * shape(b) * wob(b), innerB(b), merge);
    const r1 = (b: number) => lerp(mid(b) + half(b) * rr * open * shape(b) * wob(b + 1.3), outerB(b), merge);
    return {
      key: i,
      d: bandAround(cx, cy, (b) => Math.min(r0(b), r1(b) - 0.3), r1, a - wHalf, a + wHalf, 1.5),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const rY = INNER - 4.5;
  const wY = Math.sqrt(rY * rY - HYPO_BOTTOM * HYPO_BOTTOM);
  const yolk = `M${f1(cx - wY)},${f1(hypoBottom)} A${rY} ${rY} 0 1 0 ${f1(cx + wY)},${f1(hypoBottom)} Z`;
  const amnEdge = (Math.asin(72 / INNER) * 180) / Math.PI;

  return (
    <g>
      <ShellMaternal g={g} t={t} slab={slab} />
      <Backing d={syncytioOuter(g, t)} />

      {/* Inside the shell: fluid first (what the mesoderm has not reached yet), then the embryo complex. */}
      <circle cx={cx} cy={g.cyC} r={Rc - CYTO + 0.5} fill="#1b2437" pointerEvents="none" />
      <Part id="hasierako-bitelo-zakua">
        <path d={yolk} fill="url(#w2-g-yolk)" />
        <CellBand
          curve={ellipseArc(cx, cy, INNER, INNER, AMNION_R, AMNION_L + 360)}
          n={34}
          thickness={5.5}
          color={HEUSER}
          nucleus="rgba(120,80,10,0.75)"
          stroke="rgba(90,60,10,0.7)"
          inward
          shape="squamous"
        />
      </Part>

      {/* Mesoderm ring: solid tissue first, then hollows into somatopleura / esplaknopleura / korion barrunbea. */}
      {thickness > 3 && (
        <>
          <Part id="enbrioi-kanpoko-mesodermoa" show={genericShow}>
            <path
              d={`${radialPath(cx, cy, mesoOuter, 3)}${radialPath(cx, cy, () => INNER - 0.5, 6)}`}
              fill="url(#w2-p-meso)"
              fillRule="evenodd"
              stroke={MESO_EDGE}
              strokeWidth={front < 0.995 ? 1.1 : 0}
            />
            <path d={`${radialPath(cx, cy, mesoOuter, 3)}${radialPath(cx, cy, () => INNER - 0.5, 6)}`} fill="url(#w2-g-sheen)" fillRule="evenodd" />
            {/* Cells budding off the yolk-sac wall ahead of the front (the mesoderm's origin in the notes). */}
            {front < 1 &&
              [28, 52, 76, 100, 124, 148, 172, 8, 196].map((a, i) => {
                const wa = width(a);
                const o = seg(t, 0.42 + i * 0.004, 0.445 + i * 0.004) * (1 - seg(front, 0.85, 1)) * seg(wa, 8, 14);
                if (o <= 0.01) return null;
                const [x, y] = polarE(g, a + 4 * Math.sin(i * 1.7), mesoOuter(a) + 5);
                return <MesoCell key={i} x={x} y={y} a={a + 90} o={o} />;
              })}
          </Part>
          {/* The merged cavity, then the spaces as they open (outline pass, then fill pass: one seamless outline as they merge). */}
          <Part id="korion-barrunbea" show={cavityShow}>
            <path d={bandAround(cx, cy, innerB, outerB, STALK_A, STALK_A + 360)} fill="url(#w2-g-coelom)" />
            <path d={bandAround(cx, cy, innerB, outerB, STALK_A, STALK_A + 360)} fill="url(#w2-p-coelom)" />
          </Part>
          {spaces.length > 0 && cavityShow < 0.99 && (
            <Part id="korion-barrunbea">
              <g opacity={1 - cavityShow}>
                {spaces.map((sp) => (
                  <path key={sp.key} d={sp.d} fill={MESO_EDGE} stroke={MESO_EDGE} strokeWidth={2.4} strokeLinejoin="round" />
                ))}
                {spaces.map((sp) => (
                  <path key={sp.key} d={sp.d} fill="url(#w2-g-coelom)" stroke="url(#w2-g-coelom)" strokeWidth={0.6} strokeLinejoin="round" />
                ))}
                {spaces.map((sp) => (
                  <path key={sp.key} d={sp.d} fill="url(#w2-p-coelom)" />
                ))}
              </g>
            </Part>
          )}
          <Part id="somatopleura-kanpokoa" show={layerShow}>
            <path d={bandAround(cx, cy, outerB, outer, 0, 360)} fill="url(#w2-p-meso)" stroke={MESO_EDGE} strokeWidth={1} />
            <path d={bandAround(cx, cy, inner, innerB, AMNION_L, AMNION_R)} fill="url(#w2-p-meso)" stroke={MESO_EDGE} strokeWidth={1} />
          </Part>
          <Part id="esplaknopleura-kanpokoa" show={layerShow}>
            <path d={bandAround(cx, cy, inner, innerB, AMNION_R, AMNION_L + 360)} fill="url(#w2-p-meso)" stroke={MESO_EDGE} strokeWidth={1} />
          </Part>
          <Part id="finkapen-pedikulua" show={1}>
            <path d={stalk.d} fill="url(#w2-p-meso)" />
            <g fill="none" stroke={MESO_EDGE} strokeWidth={1.1} opacity={layerShow}>
              <path d={stalk.left} />
              <path d={stalk.right} />
            </g>
          </Part>
        </>
      )}

      <ShellSyncytium g={g} t={t} reduced={reduced} />

      <Part id="zitotrofoblastoa">
        <CellRing cx={cx} cy={g.cyC} r={Rc} th={CYTO} n={44} seed={8} divide={g.grow} />
      </Part>

      <Part id="amnios-barrunbea">
        <path d={lens} fill="#2a3f6e" />
        <path d={lens} fill="url(#w2-g-amnion)" />
        {/* Amnion roof (amnioblasts): once the mesoderm separates it from the cyto it is a wall of its own. */}
        <CellBand curve={ellipseArc(cx, cy, INNER, INNER, 180 + amnEdge, 360 - amnEdge)} n={14} thickness={5} color={C.amnioblast} shape="squamous" inward />
      </Part>
      <Part id="epiblastoa">
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
      </Part>
      <Part id="bi-orriko-diskoa">
        <path
          d={`M${f1(cx - wEpiTop)},${f1(epiTop)} L${f1(cx + wEpiTop)},${f1(epiTop)} L${f1(cx + wHypo)},${f1(hypoBottom)} L${f1(cx - wHypo)},${f1(hypoBottom)}Z`}
          fill="none"
          stroke="#e8eefc"
          strokeWidth={1}
          opacity={0.55}
        />
      </Part>

      <ShellDecidua g={g} t={t} slab={slab} />
    </g>
  );
}

/** Maternal vessels round the shell: capillaries pushed aside and the sinusoids the syncytium has opened. */
export function ShellMaternal({ g, t, slab = 'm-slab' }: { g: Shell; t: number; slab?: string }) {
  // Capillaries pushed aside, then the sinusoids (drawn under the syncytium that erodes them).
  return (
    <g mask={`url(#${slab})`}>
      <Part id="amaren-odol-hodiak" quiet>
        {CAPILLARIES.map((i) => {
          const [x, y] = vesselAt(g, i);
          const sc = VESSELS[i][2] * 1.45;
          return <Vessel key={i} x={x} y={y} rx={11 * sc} ry={7 * sc} rot={((i * 37) % 60) - 30} />;
        })}
      </Part>
      <Part id="sinusoideak">
        {SIN.map(({ q }, i) => (
          <SinusoidShape key={i} d={sinusoidPath(q, 1, sinusoidAt(g, i, t), sinDil(t))} />
        ))}
      </Part>
    </g>
  );
}

/**
 * Syncytiotrophoblast with its lacunar network: outlines of everything first, then the fluid, then the
 * blood, so overlapping lacunae and channels read as one network with a single outline. `boost` 0..1
 * enlarges the lacunae (day 13, as the villi grow into them).
 */
/** `mute` (0..1) sets the lacunar network back (translucent) so structures drawn on top — the day-13 villi — read first. */
export function ShellSyncytium({ g, t, reduced, boost = 0, mute = 0 }: { g: Shell; t: number; reduced?: boolean; boost?: number; mute?: number }) {
  const circ = s(t, W.circulation);
  const sys = lacunarSystem(g, t, boost);
  const bloodMean = sys.blobs.reduce((a, b) => a + b.blood, 0) / sys.blobs.length;
  const edge = mix(LAC_EDGE, BLOOD_EDGE, bloodMean);
  return (
    <>
      <Part id="sinzitiotrofoblastoa">
        <SynFill d={syncytioPath(g, t)} />
      </Part>

      {/* Lacunar system: outlines of everything first, then the fluid, then the blood — overlapping
          lacunae and channels read as one continuous network with a single outline. */}
      <g opacity={1 - 0.55 * mute}>
      <Part id="sare-lakunarra">
        <g fill={edge} stroke={edge} strokeWidth={2.4} strokeLinejoin="round">
          {[...sys.channels, ...sys.breaches].map((c) => c.w > 0.3 && c.d && <path key={c.key} d={c.d} />)}
        </g>
      </Part>
      <Part id="lakuak">
        {sys.blobs.map((b) => (
          <path key={b.key} d={b.d} fill={edge} stroke={edge} strokeWidth={2.4} strokeLinejoin="round" />
        ))}
        {sys.blobs.map((b) => (
          <path key={b.key} d={b.d} fill={LAC} />
        ))}
        {sys.blobs.map((b) => (
          <path key={b.key} d={b.d} fill="url(#w2-g-lacuna)" opacity={0.75} />
        ))}
      </Part>
      <Part id="sare-lakunarra">
        <g fill={LAC}>{sys.channels.map((c) => c.w > 0.3 && <path key={c.key} d={c.d} />)}</g>
      </Part>
      {/* Where the syncytium has opened a sinusoid: the branch that reached it, blood running in from the torn wall. */}
      {sys.breaches.length > 0 && (
        <Part id="sinusoideak">
          {sys.breaches.map((b) => (
            <g key={b.key}>
              {b.d && <path d={b.d} fill={LAC} />}
              {b.bloodD && <path d={b.bloodD} fill="url(#w2-p-rbc)" />}
              {/* The wall facing the syncytium is gone: the sinusoid's blood is continuous with the branch. */}
              {b.open > 0.01 && <SinusoidShape d={sinusoidPath(SIN[b.i].q, 1, b.c, sinDil(t) * 0.88)} rim="none" opacity={seg(b.open, 0, 0.4)} />}
            </g>
          ))}
        </Part>
      )}
      {/* Hasierako zirkulazio uteroplazentarioa: maternal blood spreading through the whole network. */}
      <Part id="zirkulazio-uteroplazentarioa">
        {sys.blobs.map((b) => b.blood > 0.01 && <path key={b.key} d={b.d} fill="url(#w2-p-rbc)" opacity={b.blood} />)}
        {sys.blobs.map((b) => b.blood > 0.01 && <path key={b.key} d={b.d} fill="url(#w2-g-blood)" opacity={b.blood * 0.8} />)}
        <g fill="url(#w2-p-rbc)">
          {sys.channels.map((c) => c.w > 0.3 && c.blood > 0.01 && <path key={c.key} d={c.d} opacity={c.blood} />)}
          {sys.breaches.map((b) => b.d && b.open > 0.99 && <path key={b.key} d={b.d} />)}
        </g>
        {circ > 0.15 &&
          !reduced &&
          sys.breaches.map((b) => {
            const j = ENTRY[b.i];
            const nb = j + (j < CHAIN.length / 2 ? 1 : -1);
            return <Flow key={b.key} d={smoothPath([...b.flow, lacunaCentre(g, nb)], false)} n={3} dur={3.4} r={1.7} color="#ffd6dc" reduced={reduced} />;
          })}
      </Part>
      </g>
    </>
  );
}

/** Stromal cells turning into decidual cells: around the implantation site first, then everywhere. */
export function ShellDecidua({ g, t, slab = 'm-slab' }: { g: Shell; t: number; slab?: string }) {
  const cells = s(t, W.cells);
  const spread = s(t, W.spread);
  return (
    <g mask={`url(#${slab})`}>
      <Part id="desidua-zelulak" quiet>
        {DECIDUAL_CELLS.map(({ p, near }, i) => {
          const [x, y] = decidualAt(g, p);
          const k = near ? seg(cells, i * 0.05, 0.45 + i * 0.05) : spread;
          return <DecidualCell key={i} x={x} y={y} k={k} seed={i * 4.3 + 2} />;
        })}
      </Part>
    </g>
  );
}

type At = (x: number, y: number) => [number, number];
/** 1 well inside the frame, fading to 0 as a point reaches its edge (a name whose spot the camera leaves goes with it). */
const inFrame = ([x, y]: Pt) => seg(Math.min(x - 12, 988 - x, y - 12, 628 - y), 0, 24);
function makeL(at: At) {
  return function label(id: string, x: number, y: number, p: Pt, show = 1, key = id) {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={ax} ay={ay} show={show * inFrame([ax, ay])} />;
  };
}

/** A soft glow at a point of the drawing, for what a step names but has no outline of its own. */
function makeM(at: At) {
  return function mark(id: string, p: Pt, rx: number, show = 1) {
    const [x, y] = at(p[0], p[1]);
    return <Mark key={`m-${id}`} id={id} x={x} y={y} rx={rx} show={show} />;
  };
}

function anchors(t: number) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY } = g;
  return {
    g,
    network: s(t, W.network),
    erosion: s(t, W.erosion),
    circ: s(t, W.circulation),
    cav: g.cav,
    decidua: s(t, W.decidua),
    spread: s(t, W.spread),
    cells: s(t, W.cells),
    generic: g.thickness > 3 ? 1 - seg(g.cav, 0.84, 0.97) : 0,
    layer: seg(g.cav, 0.84, 0.97),
    cavity: seg(g.cav, 0.6, 0.85),
    syn: (a: number) => synAt(g, a, 0.5),
    /** Centre of lacuna j (CHAIN index). */
    lacuna: (j: number) => lacunaCentre(g, j),
    /** A point on the channel between lacunae j and j+1. */
    channel: (j: number) => synAt(g, (CHAIN[j].a + CHAIN[j + 1].a) / 2, 0.5 + (j % 2 ? 1 : -1) * 0.17),
    sinusoid: (i: number) => sinusoidAt(g, i, t),
    capillary: (i: number) => vesselAt(g, i),
    cyto: (a: number) => polar(g, a, g.Rc - CYTO / 2),
    /** A point in the mesoderm: fraction f of the way from the embryo complex to the cyto (+ offset px). */
    meso: (a: number, f: number, off = 0) => polarE(g, a, lerp(INNER, outR(g, a), f) + off),
    /** The mesoderm's name: mid-tissue while it is solid, then on the outer sheet the cavity leaves (never in the cavity). */
    mesoName: (a: number) => {
      const l = seg(g.cav, 0.5, 0.9);
      return polarE(g, a, lerp(lerp(INNER, outR(g, a), 0.5), outR(g, a) - 5, l));
    },
    amnios: [cx - 22, (cy - INNER + epiTop) / 2 + 2] as Pt,
    epi: [cx + 38, (epiTop + discY) / 2] as Pt,
    yolk: [cx - 14, cy + 60] as Pt,
    stalk: polarE(g, 260, (INNER + outR(g, 260)) / 2),
    decidualCell: (i: number) => decidualAt(g, DECIDUAL_CELLS[i].p),
  };
}

/** A disc of radius r round c, cut off below y = h (the decidual reaction stays in the stroma). */
function discAbove(c: Pt, r: number, h: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    pts.push([c[0] + r * Math.cos(a), Math.min(h, c[1] + r * Math.sin(a))]);
  }
  return `${poly(pts)}Z`;
}

/** Radius of the decidual reaction around the implantation site: near the conceptus first, then the whole endometrium. */
const decidualReach = (decidua: number, spread: number) => 330 * decidua + 650 * spread;

export function Day1112Section(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const L = makeL((x, y) => [x, y]);
  const M = makeM((x, y) => [x, y]);
  const nIn = seg(t, W.network[0] + 0.02, W.network[0] + 0.04);
  const cIn = seg(t, 0.18, 0.2);
  const back = seg(t, 0.42, 0.44);
  const baseNote = Math.max(1 - outHalf(nIn), inHalf(back));
  const networkNote = inHalf(nIn) * (1 - outHalf(cIn));
  const circNote = inHalf(cIn) * (1 - outHalf(back));
  return (
    <g>
      <EndometriumBack decidua={k.decidua} spread={k.spread} bulge={BULGE} />
      <Day1112Drawing {...props} />
      <EndometriumFront gap={k.g.plug - 7} bulge={BULGE} />
      <FibrinPlug half={k.g.plug} />
      {M('desidua-erreakzioa', [340, 130], 56, k.decidua)}
      {L('endometrio-estroma', 190, 50, [300, 60])}
      {L('amaren-odol-hodiak', 190, 100, k.capillary(0))}
      {L('umetoki-guruina', 190, 150, GLANDS[0][30])}
      {L('desidua-erreakzioa', 190, 200, [340, 130], k.decidua)}
      {L('sare-lakunarra', 190, 250, k.channel(2), k.network)}
      {L('lakuak', 190, 380, k.lacuna(1))}
      {L('zirkulazio-uteroplazentarioa', 238, 430, k.lacuna(0), k.circ)}
      {L('sinzitiotrofoblastoa', 190, 470, k.syn(150))}
      {L('zitotrofoblastoa', 190, 515, k.cyto(140))}
      {L('endometrio-epitelioa', 190, 560, [300, surfaceAt(300, BULGE) - 4])}
      {/* Right under the plug, in the lumen: the step names it, so it is named where it is. */}
      <Label id="fibrina-koagulua" x={500} y={549} ax={500} ay={W2.surfaceY + BULGE + 8} align="middle" small />
      {L('mutur-enbrionarioa', 810, 250, k.cyto(276))}
      {L('sinusoideak', 810, 315, k.sinusoid(4), seg(t, 0.14, 0.18))}
      {/* Still named while it hollows out (step "Hasieran ehun betea da…"), then its two sheets take over. */}
      {L('enbrioi-kanpoko-mesodermoa', 778, 380, k.mesoName(300), Math.max(k.generic, seg(t, 0.42, 0.46) * (1 - seg(t, 0.62, 0.64))))}
      {L('korion-barrunbea', 810, 430, k.meso(12, 0.5), k.cavity)}
      {L('finkapen-pedikulua', 810, 470, k.stalk, k.layer)}
      {L('amnios-barrunbea', 810, 515, k.amnios)}
      {L('epiblastoa', 810, 560, k.epi)}
      {L('hasierako-bitelo-zakua', 810, 598, k.yolk)}
      {/* One caption line, handed over (never two at once): implantation site → lacunar network → maternal blood in it → back. */}
      <Note x={500} y={585} tone="dim" show={baseNote}>
        Endometrioaren paretan goragune bat antzematen da: habiratze-gunea
      </Note>
      <Note x={500} y={585} tone="accent" show={networkNote}>
        Lakuak handitu eta haien artean komunikatzen hasten dira: laku sarea
      </Note>
      <Note x={500} y={585} tone="warn" show={circNote}>
        Sinusoideak urratuta: amaren odola laku sarean zirkulatzen hasten da
      </Note>
    </g>
  );
}

/**
 * Stroma (with the decidual reaction spreading from the implantation site), spiral arteries and
 * corkscrew glands. Exported so day 13 (which continues this implantation site) can reuse it.
 */
export function EndometriumBack({ decidua, spread = decidua, bulge = 0, site = [500, 330], slab = 'm-slab' }: { decidua: number; spread?: number; bulge?: number; site?: Pt; slab?: string }) {
  const h = W2.surfaceY + bulge;
  const reach = decidualReach(decidua, spread);
  return (
    <g mask={`url(#${slab})`}>
      <W2Defs />
      <Part id="endometrio-estroma" quiet>
        {/* Down to the bottom of the bulge; the lumen (EndometriumFront) covers what lies below the surface. */}
        <StromaFill h={h} oedema={0.35 + 0.5 * Math.max(decidua, spread)} />
      </Part>
      {reach > 1 && (
        <Part id="desidua-erreakzioa" quiet>
          {/* The reaction front: plump decidual cells replace the spindle stroma, with a soft edge. */}
          {/* Eight thin layers stacked: a soft front with no visible steps. */}
          {[7, 6, 5, 4, 3, 2, 1, 0].map((j) => (
            <path key={j} d={discAbove(site, reach + j * 11, h)} fill="url(#w2-p-decidua)" opacity={0.17} />
          ))}
          <path d={discAbove(site, reach + 40, h)} fill="url(#w2-g-light)" />
        </Part>
      )}
      <Part id="amaren-odol-hodiak" quiet>
        {ARTERIES.map((a, i) => (
          <SpiralArtery key={i} pts={a} w={4.6} />
        ))}
      </Part>
      <Part id="umetoki-guruina">
        {GLANDS.map((gl, i) => (
          <Gland key={i} pts={gl} secretion={1} scale={1.12} />
        ))}
      </Part>
    </g>
  );
}

export function EndometriumFront({ gap, bulge = 0, slab = 'm-slab' }: { gap: number; bulge?: number; slab?: string }) {
  const { epiThickness, cx, surfaceY } = W2;
  const dy = (x: number) => surfaceAt(x, bulge) - surfaceY;
  const line = (x0: number, x1: number) => {
    const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 10));
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = lerp(x0, x1, i / n);
      return `${i ? 'L' : 'M'}${f1(x)},${f1(surfaceAt(x, bulge) + 1)}`;
    }).join('');
  };
  const lumen = `${line(0, 1000)}L1000,640L0,640Z`;
  return (
    <g mask={`url(#${slab})`}>
      <Part id="umetoki-barrunbea" quiet>
        <path d={lumen} fill="#1a1426" />
        <path d={lumen} fill="url(#g-shade)" opacity={0.4} />
      </Part>
      {/* The surface follows the bulge of the implantation site; `gap` is the half-width still open (the fibrin plug). */}
      <Part id="endometrio-epitelioa">
        {gap > 3 ? (
          <>
            <Epithelium x0={0} x1={cx - gap} y={surfaceY} th={epiThickness} w={16} dy={dy} />
            <Epithelium x0={cx + gap} x1={1000} y={surfaceY} th={epiThickness} w={16} dy={dy} />
          </>
        ) : (
          <Epithelium x0={0} x1={1000} y={surfaceY} th={epiThickness} w={16} dy={dy} />
        )}
      </Part>
    </g>
  );
}

/** What is left of the fibrin plug: in the epithelial gap, on the bulge, over the lumen. */
export function FibrinPlug({ half, bulge = BULGE, show = 1 }: { half: number; bulge?: number; show?: number }) {
  return (
    <Part id="fibrina-koagulua" show={show}>
      {fibrinPlug(1, half, bulge).map((d, i) => (
        <g key={i}>
          <path d={d} fill="url(#w2-g-fibrin)" stroke="#b9ae95" strokeWidth={1} />
          <path d={d} fill="url(#p-fibrin)" opacity={0.55} />
        </g>
      ))}
    </Part>
  );
}

export function Day1112Meso(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  // Fixed frame (centred where the shell ends up), so the growth of the chorionic cavity is seen.
  const z = zoom(W2.cx, W2.surfaceY - 10 - RC_END, 1.45, 500, 320);
  const L = makeL(z.at);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={k.decidua} spread={k.spread} />
        <Day1112Drawing {...props} />
      </g>
      {L('zitotrofoblastoa', 180, 90, k.cyto(200))}
      {L('enbrioi-kanpoko-mesodermoa', 776, 335, k.mesoName(338), Math.max(k.generic, seg(t, 0.42, 0.46) * (1 - seg(t, 0.62, 0.64))))}
      {L('somatopleura-kanpokoa', 188, 210, k.meso(212, 1, -5), k.layer)}
      {L('korion-barrunbea', 180, 400, k.meso(215, 0.5), k.cavity)}
      {L('esplaknopleura-kanpokoa', 780, 400, k.meso(22, 0, 4), k.layer)}
      {L('hasierako-bitelo-zakua', 180, 520, k.yolk)}
      {L('finkapen-pedikulua', 800, 150, k.stalk, k.layer)}
      {L('amnios-barrunbea', 800, 210, k.amnios)}
      {L('epiblastoa', 800, 260, k.epi)}
      {L('sinzitiotrofoblastoa', 800, 460, k.syn(15))}
      <Note x={500} y={585} tone="accent" show={k.cavity}>
        Korion barrunbeak amnios barrunbea eta bitelo zakua inguratzen ditu, finkapen pedikulua izan ezik
      </Note>
    </g>
  );
}

export function Day1112Desidua(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx } = k.g;
  // Framed on where it happens: the stroma over the conceptus (decidual cells, sinusoids) down to the
  // syncytium's lacunae. For the decidual reaction (.82) it widens to the whole stroma around the grown
  // conceptus, still with the endometrial slab (x 205–795) filling the frame edge to edge.
  // Then, for the decidual reaction (.82), it closes in on the stroma beside the conceptus, where the
  // stromal cells turn into decidual cells; for the spread (.92) it pulls back to the whole endometrium.
  // The wide slab mask keeps stroma under the close-up's left edge; at the overview a dark veil
  // brings the frame back to the usual slab (names in clear gutters).
  const close = seg(t, 0.82, 0.85);
  const wide = seg(t, 0.92, 0.95);
  const fx = lerp(lerp(cx, 255, close), cx, wide);
  const fy = lerp(lerp(236, 140, close), 320, wide);
  const zs = lerp(lerp(1.85, 2.3, close), 1, wide);
  const z = zoom(fx, fy, zs, 500, 320);
  const L = makeL(z.at);
  const xl = z.at(205, 0)[0];
  const xr = z.at(795, 0)[0];
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={k.decidua} spread={k.spread} slab="m-slab-wide" />
        <Day1112Drawing {...props} slab="m-slab-wide" />
        <EndometriumFront gap={k.g.plug - 7} bulge={BULGE} slab="m-slab-wide" />
        <FibrinPlug half={k.g.plug} />
      </g>
      {wide > 0.01 && (
        <g pointerEvents="none" opacity={wide}>
          <defs>
            <linearGradient id="w2-veil-l" x1="0" x2="1">
              <stop offset="0.6" stopColor="#101828" />
              <stop offset="1" stopColor="#101828" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="w2-veil-r" x1="1" x2="0">
              <stop offset="0.6" stopColor="#101828" />
              <stop offset="1" stopColor="#101828" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={Math.max(0, xl + 12)} height={640} fill="url(#w2-veil-l)" />
          <rect x={Math.min(1000, xr - 12)} y={0} width={Math.max(0, 1000 - xr + 12)} height={640} fill="url(#w2-veil-r)" />
        </g>
      )}
      {L('endometrio-estroma', 180, 60, [280, 120])}
      {L('desidua-erreakzioa', 180, 110, k.decidualCell(6), k.decidua)}
      {L('desidua-zelulak', 180, 160, k.decidualCell(4), k.cells)}
      {L('umetoki-guruina', 180, 400, GLANDS[0][34])}
      {L('amaren-odol-hodiak', 800, 60, k.capillary(1))}
      {L('sinusoideak', 800, 110, k.sinusoid(3))}
      {L('sare-lakunarra', 180, 210, k.channel(3), k.network)}
      {L('zirkulazio-uteroplazentarioa', 756, 400, k.lacuna(7), k.circ)}
      {L('sinzitiotrofoblastoa', 800, 250, k.syn(320))}
      {L('bi-orriko-diskoa', 800, 460, [cx + 12, k.g.discY], seg(t, 0.9, 0.93))}
      <Note x={500} y={588} tone="warn" show={seg(k.erosion, 0.5, 1) * (1 - seg(t, 0.8, 0.82))}>
        Sinzitiotrofoblastoak sinusoideen pareta urratu du: amaren odola laku sarean zirkulatzen hasten da
      </Note>
      <Note x={500} y={588} tone="accent" show={seg(t, 0.83, 0.85) * (1 - seg(t, 0.9, 0.92))}>
        Desidua erreakzioa: endometrio edematosoa eta estroma-zelula poliedrikoak (glukogenoa, lipidoak)
      </Note>
    </g>
  );
}
