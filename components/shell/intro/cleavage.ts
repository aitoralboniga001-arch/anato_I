/**
 * Geometry for the cleavage sequence (1. gaia, 4.3–4.4): zygote → 2 → 4 → 8 → morula (16 / 32) → blastocyst.
 * Pure functions of progress so the same drawing can be timed (intro) or scrubbed (simulator).
 *
 * The blastomeres are a mosaic inside the zona pellucida, as in Langman fig. 3-8: each cell is the
 * region of a weighted site (a power diagram clipped to the space inside the zona), so cells press
 * against each other with flat walls and round where they are free. A division moves two daughter
 * sites apart from their parent's: the parent first reads as one cell, then a cleavage furrow cuts in
 * from the surface where the new wall meets it, and the daughters settle with their own membranes.
 * Compaction tightens the ball; in the blastocyst the cavity (blastocoel) opens on one side, the
 * outer cells flatten into the trophoblast and the inner cell mass gathers at one pole.
 *
 * `cells` keep their old meaning (centre, radius, kind…) for simple renderers (the intro); `shape`
 * on each cell carries the mosaic outline for the atlas renderer (components/scenes/week1/conceptus).
 */

export type V2 = [number, number];

export interface CellShape {
  /** Closed outline (engine units). */
  pts: V2[];
  /** Membrane runs of the outline (the furrow wall of a dividing pair left out). */
  runs: V2[][];
  /** The new wall between two daughters while it forms (drawn with the division's `wall` opacity). */
  wall?: V2[];
  /** Centroid and the cell's principal axes (for the nucleus and the light). */
  cx: number;
  cy: number;
  /** Half-extents along / across the principal axis, and its direction (degrees). */
  ax: number;
  ay: number;
  rot: number;
  /** Clearance: distance from (cx, cy) to the outline (caps the nucleus in thin or curved cells). */
  clear?: number;
}

export interface Cell {
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Rotation in degrees. */
  rot: number;
  /** Pseudo depth, 0 (back) … 1 (front): drives draw order and shading in simple renderers. */
  z: number;
  /** Nucleus visibility 0..1. */
  nuc: number;
  /** Membrane contrast 0..1 (compaction blurs the borders between blastomeres). */
  rim: number;
  kind: 'blastomero' | 'trofoblasto' | 'enbrioblasto';
  /** What the cell will become (known from the last cleavage on): outer vs inner cell mass. */
  fate?: 'trofoblasto' | 'enbrioblasto';
  /** Mosaic outline (absent only if the cell has no room this frame). */
  shape?: CellShape;
}

/** One division under way: indices of the two daughters in `cells`. */
export interface Division {
  a: number;
  b: number;
  /** 0 the parent still reads as one cell … 1 two cells, each with its own outline. */
  furrow: number;
  /** Opacity of the new wall between the daughters. */
  wall: number;
  /** The parent's interphase nucleus (fades in prophase) and the two daughter nuclei (telophase). */
  nucP: number;
  nucD: number;
  /** Union centre and radius (for one light on the parent before it splits). */
  ux: number;
  uy: number;
  ur: number;
}

export interface Spindle {
  x: number;
  y: number;
  axis: number;
  len: number;
  /** 0 metaphase … 1 anaphase. */
  sep: number;
  /** Chromosomes / fibres opacity. */
  o: number;
  fibres: number;
  /** First cleavage: maternal and paternal chromosomes. */
  zygote: boolean;
}

/** A dividing pair is drawn with a goo filter so the cleavage furrow reads as a pinch (simple renderers). */
export interface Frame {
  cells: Cell[];
  /** Pairs of indices into `cells` that are mid-division. */
  pairs: [number, number][];
  /** The same divisions with their state (mosaic renderer). */
  divs: Division[];
  spindles: Spindle[];
  /** Inner radius of the zona pellucida; its opacity. */
  zonaR: number;
  zonaO: number;
  /** Blastocoel radius and opacity, its outline and the small fluid spaces that merge into it. */
  cavR: number;
  cavO: number;
  cav?: V2[];
  drops: { x: number; y: number; r: number; o: number }[];
  /** Compaction 0..1 (membranes between cells fade, the surface smooths). */
  compact: number;
  /** Pronuclei (zygote only): separation 0..1 and opacity. */
  pro: { sep: number; o: number };
}

export const ZONA = 132;

const R = [112, 68, 54, 43, 34, 27];
const D = [0, 44, 38, 30, 24, 19];
/** The cells fill the zona up to here (a thin perivitelline space), with a pocket for the polar bodies. */
const RG = ZONA - 6;
const PB_DEG = -90;
const rimR = (deg: number, rg = RG, pocket = 1) => rg - 8 * pocket * bump(angDist(deg, PB_DEG), 26);
/** Embryonic pole of the blastocyst (scenes rotate it to face the endometrium). */
const POLE = { x: -0.68, y: -0.73 };
const RB = 138;
const TH = 14; // trophoblast thickness

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const sseg = (v: number, a: number, b: number) => ease((v - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixAng = (a: number, b: number, t: number) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
};
function angDist(a: number, b: number) {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}
function bump(d: number, w: number) {
  return d >= w ? 0 : 0.5 * (1 + Math.cos((Math.PI * d) / w));
}

// ---------------------------------------------------------------------------
// Mosaic geometry

interface Site {
  x: number;
  y: number;
  /** Power weight (radius). */
  w: number;
  /** Index of the sister cell while dividing (-1 none), and the gap to it (negative = overlap). */
  partner: number;
  pgap: number;
}

interface Poly {
  p: V2[];
  /** Tag of the edge starting at each vertex: -1 surface, -2 cavity, j neighbour j. */
  tag: number[];
}

function disc(rOf: (deg: number) => number, n = 96): Poly {
  const p: V2[] = [];
  const tag: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360;
    const r = rOf(a);
    p.push([r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)]);
    tag.push(-1);
  }
  return { p, tag };
}

/** Keep the part of a convex polygon with n·p ≤ h; the cut edge gets `cut` as its tag. */
function clip(poly: Poly, nx: number, ny: number, h: number, cut: number): Poly {
  const { p, tag } = poly;
  const n = p.length;
  if (!n) return poly;
  const out: V2[] = [];
  const otag: number[] = [];
  for (let i = 0; i < n; i++) {
    const A = p[i];
    const B = p[(i + 1) % n];
    const da = A[0] * nx + A[1] * ny - h;
    const db = B[0] * nx + B[1] * ny - h;
    if (da <= 0) {
      out.push(A);
      otag.push(tag[i]);
      if (db > 0) {
        const k = da / (da - db);
        out.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]);
        otag.push(cut);
      }
    } else if (db <= 0) {
      const k = da / (da - db);
      out.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]);
      otag.push(tag[i]);
    }
  }
  return { p: out, tag: otag };
}

function region(sites: Site[], i: number, base: Poly, gap: number): Poly {
  let poly = base;
  const s = sites[i];
  for (let j = 0; j < sites.length && poly.p.length; j++) {
    if (j === i) continue;
    const o = sites[j];
    let dx = o.x - s.x;
    let dy = o.y - s.y;
    let d = Math.hypot(dx, dy);
    if (d < 1e-6) {
      // Coincident sisters: split across the division axis they will move along.
      dx = 1;
      dy = 0;
      d = 1;
    }
    const nx = dx / d;
    const ny = dy / d;
    const h = (o.x * o.x + o.y * o.y - s.x * s.x - s.y * s.y - o.w * o.w + s.w * s.w) / (2 * d);
    const g = j === s.partner ? s.pgap : gap;
    poly = clip(poly, nx, ny, h - g / 2, j);
  }
  return poly;
}

function areaCentroid(p: V2[]): [number, number, number] {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[(i + 1) % p.length];
    const c = x0 * y1 - x1 * y0;
    a += c;
    cx += (x0 + x1) * c;
    cy += (y0 + y1) * c;
  }
  if (Math.abs(a) < 1e-6) return [0, p[0]?.[0] ?? 0, p[0]?.[1] ?? 0];
  return [a / 2, cx / (3 * a), cy / (3 * a)];
}

/** Uniform resampling along the outline; each sample keeps the tag of its edge. */
function resample(poly: Poly, step: number): { p: V2[]; tag: number[] } {
  const { p, tag } = poly;
  const n = p.length;
  let per = 0;
  const len: number[] = [];
  for (let i = 0; i < n; i++) {
    const l = Math.hypot(p[(i + 1) % n][0] - p[i][0], p[(i + 1) % n][1] - p[i][1]);
    len.push(l);
    per += l;
  }
  const m = Math.max(18, Math.round(per / step));
  const ds = per / m;
  const out: V2[] = [];
  const otag: number[] = [];
  let e = 0;
  let acc = 0;
  for (let k = 0; k < m; k++) {
    const s = k * ds;
    while (e < n - 1 && acc + len[e] < s) {
      acc += len[e];
      e++;
    }
    const f = len[e] > 1e-9 ? (s - acc) / len[e] : 0;
    const A = p[e];
    const B = p[(e + 1) % n];
    out.push([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]);
    otag.push(tag[e]);
  }
  return { p: out, tag: otag };
}

interface ShapeOpts {
  step: number;
  /** Rounding radius of the cell's corners (arc length). */
  round: number;
  /** Partner (sister) tag and the rounding of the furrow corners. */
  partner: number;
  furrowR: number;
  /** Cavity: push points inside it onto its outline. */
  cav?: (x: number, y: number) => V2 | null;
}

function insidePoly(x: number, y: number, p: V2[]) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function shapeOf(poly: Poly, o: ShapeOpts): CellShape | undefined {
  if (poly.p.length < 3) return undefined;
  const [area] = areaCentroid(poly.p);
  if (area < 12) return undefined;
  const rs = resample(poly, o.step);
  const n = rs.p.length;
  if (o.cav)
    for (let i = 0; i < n; i++) {
      const q = o.cav(rs.p[i][0], rs.p[i][1]);
      if (q) rs.p[i] = q;
    }
  // Arc distance of every sample to the nearest end of the sister wall.
  const ends: number[] = [];
  if (o.partner >= 0)
    for (let i = 0; i < n; i++) {
      const a = rs.tag[i] === o.partner;
      const b = rs.tag[(i + 1) % n] === o.partner;
      if (a !== b) ends.push(i + 0.5);
    }
  const step = o.step;
  const k = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let dP = Infinity;
    for (const e of ends) {
      const d = Math.abs(i - e);
      dP = Math.min(dP, Math.min(d, n - d) * step);
    }
    let rho = Math.min(o.round, dP);
    if (o.furrowR > 0) rho = Math.max(rho, o.furrowR * clamp(1 - (dP - o.furrowR) / (o.furrowR + 1e-6)));
    k[i] = Math.max(0, Math.min(Math.floor(n / 2) - 1, Math.round(rho / step)));
  }
  // Moving average with a per-sample window rounds corners and keeps straight walls straight.
  const px = new Float64Array(3 * n + 1);
  const py = new Float64Array(3 * n + 1);
  for (let j = 0; j < 3 * n; j++) {
    px[j + 1] = px[j] + rs.p[j % n][0];
    py[j + 1] = py[j] + rs.p[j % n][1];
  }
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = n + i - k[i];
    const b = n + i + k[i] + 1;
    pts.push([(px[b] - px[a]) / (b - a), (py[b] - py[a]) / (b - a)]);
  }
  // Membrane runs: everything but the sister wall.
  const runs: V2[][] = [];
  let wall: V2[] | undefined;
  if (o.partner >= 0 && ends.length) {
    const isW = (i: number) => rs.tag[i] === o.partner;
    let start = 0;
    for (let i = 0; i < n; i++)
      if (isW(i) !== isW((i - 1 + n) % n)) {
        start = i;
        break;
      }
    let cur: V2[] = [pts[start]];
    let w0 = isW(start);
    for (let s = 1; s <= n; s++) {
      const i = (start + s) % n;
      cur.push(pts[i]);
      if (s === n || isW(i) !== w0) {
        if (w0) wall = cur;
        else runs.push(cur);
        cur = [pts[i]];
        w0 = isW(i);
      }
    }
  } else runs.push([...pts, pts[0]]);
  // Centroid and principal axes.
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p[0];
    cy += p[1];
  }
  cx /= n;
  cy /= n;
  // A curved sliver (e.g. a cell in the corner where the inner cell mass meets the trophoblast) can
  // have its centroid outside itself: take instead the inside point furthest from the outline, so
  // the nucleus and anything anchored on the cell stay in it.
  if (!insidePoly(cx, cy, pts)) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    let best = -1;
    for (let i = 0; i <= 12; i++)
      for (let j = 0; j <= 12; j++) {
        const x = x0 + ((x1 - x0) * i) / 12;
        const y = y0 + ((y1 - y0) * j) / 12;
        if (!insidePoly(x, y, pts)) continue;
        let d = Infinity;
        for (const q of pts) d = Math.min(d, (q[0] - x) ** 2 + (q[1] - y) ** 2);
        if (d > best) {
          best = d;
          cx = x;
          cy = y;
        }
      }
  }
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pts) {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  sxx /= n;
  syy /= n;
  sxy /= n;
  const tr = (sxx + syy) / 2;
  const det = Math.sqrt(Math.max(0, ((sxx - syy) / 2) ** 2 + sxy * sxy));
  const l1 = tr + det;
  const l2 = Math.max(0, tr - det);
  const rot = (Math.atan2(2 * sxy, sxx - syy) * 90) / Math.PI;
  // For an outline, σ ≈ half-extent / √2 (circle) … / √3 (thin bar): use √2.
  let clear = Infinity;
  for (const q of pts) clear = Math.min(clear, Math.hypot(q[0] - cx, q[1] - cy));
  return { pts, runs, wall, cx, cy, ax: Math.sqrt(2 * l1), ay: Math.sqrt(2 * l2), rot, clear };
}

// ---------------------------------------------------------------------------
// Layouts: generation k (0..5: 1 → 32 cells); each child keeps the index of its parent.

interface Node {
  x: number;
  y: number;
  r: number;
  z: number;
  axis: number;
  parent: number;
}

function lloyd(nodes: Node[], iters: number) {
  const base = disc((a) => rimR(a), 72);
  for (let it = 0; it < iters; it++) {
    const sites: Site[] = nodes.map((n) => ({ x: n.x, y: n.y, w: n.r, partner: -1, pgap: 0 }));
    nodes.forEach((n, i) => {
      const reg = region(sites, i, base, 0);
      if (reg.p.length < 3) return;
      const [, cx, cy] = areaCentroid(reg.p);
      n.x = mix(n.x, cx, 0.7);
      n.y = mix(n.y, cy, 0.7);
    });
  }
}

const GENS: Node[][] = (() => {
  const gens: Node[][] = [[{ x: 0, y: 0, r: R[0], z: 0.5, axis: 0, parent: -1 }]];
  for (let k = 1; k <= 5; k++) {
    const prev = gens[k - 1];
    const next: Node[] = [];
    prev.forEach((p, pi) => {
      // Cleavage planes rotate each round: meridional (first, through the polar bodies), at right
      // angles to it (second), then oblique.
      const axis = k === 1 ? 0 : k === 2 ? p.axis + 90 : p.axis + 45 + hash(pi + k * 7) * 50;
      const a = (axis * Math.PI) / 180;
      for (const s of [-1, 1]) {
        next.push({
          x: p.x + Math.cos(a) * D[k] * s,
          y: p.y + Math.sin(a) * D[k] * s,
          r: R[k],
          z: Math.min(1, Math.max(0, p.z + s * (k === 3 ? 0.35 : k === 5 ? 0.12 : 0.18) + (hash(pi * 3 + k) - 0.5) * 0.3)),
          axis,
          parent: pi,
        });
      }
    });
    if (k >= 3) lloyd(next, 6);
    // Simple renderers draw each cell as a circle of radius r: keep those inside the zona.
    for (const n of next) {
      const d = Math.hypot(n.x, n.y);
      const max = ZONA - n.r * 0.9 - 2;
      if (d > max) {
        n.x *= max / d;
        n.y *= max / d;
      }
    }
    gens.push(next);
  }
  return gens;
})();

// ---------------------------------------------------------------------------
// Blastocyst targets: outer cells flatten into a ring (trophoblast), the inner cell mass — the
// morula's centre (notes: "erdian") — gathers at the embryonic pole under the polar trophoblast.

interface Target {
  x: number;
  y: number;
  kind: 'trofoblasto' | 'enbrioblasto';
}

function blastTargets(gen: number) {
  const morula = GENS[gen];
  const nIn = gen === 4 ? 5 : 12;
  const order = morula.map((c, i) => ({ i, d: Math.hypot(c.x - POLE.x * 14, c.y - POLE.y * 14) })).sort((a, b) => a.d - b.d);
  const inner = new Set(order.slice(0, nIn).map((o) => o.i));
  const ring = morula
    .map((c, i) => ({ i, ang: Math.atan2(c.y, c.x) }))
    .filter((o) => !inner.has(o.i))
    .sort((a, b) => a.ang - b.ang);
  const targets = new Map<number, Target>();
  const off = ring[0].ang;
  ring.forEach((o, k) => {
    const ang = off + (k / ring.length) * Math.PI * 2;
    targets.set(o.i, { x: Math.cos(ang) * (RB - 7), y: Math.sin(ang) * (RB - 7), kind: 'trofoblasto' });
  });
  // Inner cell mass: two rows across the pole, inside the rounded cluster the cavity wraps around
  // (see icmR), assigned in tangential order so paths do not cross. Slots: [tangential, along pole].
  const slots: [number, number][] =
    gen === 4
      ? [
          [-20, 110],
          [20, 110],
          [-27, 88],
          [0, 86],
          [27, 88],
        ]
      : [
          // Three rows: a cluster several cells thick bulging into the cavity (Langman fig. 3-10).
          [-48, 110],
          [-24, 113],
          [0, 114],
          [24, 113],
          [48, 110],
          [-37, 90],
          [-12, 91],
          [12, 91],
          [37, 90],
          [-21, 70],
          [0, 68],
          [21, 70],
        ];
  const tx = -POLE.y;
  const ty = POLE.x; // tangential direction
  const tan = (x: number, y: number) => x * tx + y * ty;
  const pos = slots.map(([tg, al]) => [POLE.x * al + tx * tg, POLE.y * al + ty * tg] as V2);
  const cellsT = [...inner].sort((a, b) => tan(morula[a].x, morula[a].y) - tan(morula[b].x, morula[b].y));
  const slotT = pos.map((p, k) => ({ p, k })).sort((a, b) => tan(a.p[0], a.p[1]) - tan(b.p[0], b.p[1]));
  cellsT.forEach((ci, k) => targets.set(ci, { x: slotT[k].p[0], y: slotT[k].p[1], kind: 'enbrioblasto' }));
  return targets;
}
const BLAST = [4, 5].map((g) => blastTargets(g));

/** Fluid spaces first appear where cells meet, on the side away from the pole. */
const DROPS: V2[] = (() => {
  const out: V2[] = [];
  const nodes = GENS[5];
  const sites: Site[] = nodes.map((n) => ({ x: n.x, y: n.y, w: n.r, partner: -1, pgap: 0 }));
  const base = disc((a) => rimR(a), 72);
  const seen: V2[] = [];
  nodes.forEach((_, i) => {
    const reg = region(sites, i, base, 0);
    reg.p.forEach((p, k) => {
      const t0 = reg.tag[k];
      const t1 = reg.tag[(k - 1 + reg.p.length) % reg.p.length];
      if (t0 < 0 || t1 < 0) return;
      if (seen.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 6)) return;
      seen.push(p);
    });
  });
  for (const p of seen) {
    const along = p[0] * POLE.x + p[1] * POLE.y;
    if (along < 18 && Math.hypot(p[0], p[1]) < 100) out.push(p);
  }
  return out
    .map((p, i) => ({ p, h: hash(i * 5.3 + 1) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, 9)
    .map((o) => o.p);
})();

const toCell = (n: Node, nuc = 1): Cell => ({ x: n.x, y: n.y, rx: n.r, ry: n.r, rot: n.axis, z: n.z, nuc, rim: 1, kind: 'blastomero' });

/** Membrane gap between neighbouring cells, and the rounding of their corners, by generation. */
const GAP = [0, 3.2, 3, 2.8, 2.6, 2.4];
const ROUND = [0, 20, 16, 13, 11, 9];

/**
 * Progress p in 0..(gens + 2), `gens` = 4 (morula of 16) or 5 (32 cells, 4th day):
 *  0..1  zygote (pronuclei meet; the first spindle forms)
 *  1..2  first cleavage, 2..3 second, … up to generation `gens`
 *  gens+1..gens+2  compaction and cavitation (blastocyst)
 * `wobble` (seconds) adds a faint living jitter.
 */
export function cleavageFrame(p: number, wobble = 0, gens: 4 | 5 = 4): Frame {
  const f: Frame = { cells: [], pairs: [], divs: [], spindles: [], zonaR: ZONA, zonaO: 1, cavR: 0, cavO: 0, drops: [], compact: 0, pro: { sep: 0, o: 0 } };
  const STEP = 2.6;

  if (p < 1) {
    const u = clamp(p);
    const c = toCell(GENS[0][0], 0);
    const base = disc((a) => rimR(a), 96);
    c.shape = shapeOf(base, { step: STEP, round: 0, partner: -1, furrowR: 0 });
    f.cells = [c];
    f.pro = { sep: 1 - ease(u / 0.8), o: 1 - clamp((u - 0.86) / 0.1) };
    // The pronuclear envelopes break down and the chromosomes gather on the first spindle.
    const o = clamp((u - 0.86) / 0.12);
    if (o > 0) f.spindles.push({ x: 0, y: 0, axis: 0, len: R[0] * 0.55, sep: 0, o, fibres: o, zygote: true });
  } else if (p < gens + 1) {
    const k = Math.floor(p);
    const u = p - k;
    const prev = GENS[k - 1];
    const next = GENS[k];
    const sites: Site[] = [];
    const meta: { u: number; nucP: number; nucD: number; furrowR: number; wall: number; furrow: number }[] = [];
    next.forEach((n, idx) => {
      const par = prev[n.parent];
      // Not every cell divides at once (the 2 → 4 step is the most nearly synchronous).
      const lag = k === 1 ? 0 : hash(n.parent * 13 + k * 3) * (k === 2 ? 0.08 : 0.2);
      const ui = clamp((u - lag) / (1 - lag));
      const sis = next[idx ^ 1];
      const mx = (n.x + sis.x) / 2;
      const my = (n.y + sis.y) / 2;
      const e = sseg(ui, 0.16, 0.86);
      const hx = (n.x - sis.x) / 2;
      const hy = (n.y - sis.y) / 2;
      const hl = Math.hypot(hx, hy) || 1;
      const sep = Math.max(0.4, hl * e);
      const cx = mix(par.x, mx, e);
      const cy = mix(par.y, my, e);
      sites.push({
        x: cx + (hx / hl) * sep,
        y: cy + (hy / hl) * sep,
        w: mix(par.r, n.r, e),
        partner: idx ^ 1,
        // The cleft opens wide at the height of cytokinesis, then the daughters press together again.
        pgap: mix(-1.4, GAP[k], sseg(ui, 0.4, 0.6)) + par.r * 0.07 * sseg(ui, 0.4, 0.6) * (1 - sseg(ui, 0.66, 0.95)),
      });
      const furrow = sseg(ui, 0.2, 0.6);
      meta.push({
        u: ui,
        nucP: k === 1 ? 0 : 1 - sseg(ui, 0, 0.1),
        nucD: sseg(ui, 0.44, 0.62),
        // The furrow cuts in from the surface (both ends of the new wall), deepest mid-cytokinesis.
        furrowR: Math.max(ROUND[k], par.r * 0.62) * furrow * (1 - 0.7 * sseg(ui, 0.64, 1)),
        wall: sseg(ui, 0.36, 0.66),
        furrow,
      });
    });
    const base = disc((a) => rimR(a), 96);
    const gap = GAP[k];
    next.forEach((n, idx) => {
      const m = meta[idx];
      const s = sites[idx];
      const c: Cell = {
        x: s.x,
        y: s.y,
        rx: s.w,
        ry: s.w,
        rot: n.axis,
        z: n.z,
        nuc: Math.max(m.nucP, m.nucD),
        rim: 1,
        kind: 'blastomero',
        fate: k === gens ? BLAST[gens - 4].get(idx)!.kind : undefined,
      };
      const done = m.u >= 1;
      c.shape = shapeOf(region(sites, idx, base, gap), {
        step: STEP,
        round: ROUND[k],
        partner: done ? -1 : idx ^ 1,
        furrowR: done ? 0 : m.furrowR,
      });
      f.cells.push(c);
    });
    for (let i = 0; i < next.length; i += 2) {
      const m = meta[i];
      if (m.u >= 1) continue;
      const a = sites[i];
      const b = sites[i + 1];
      const par = prev[next[i].parent];
      f.pairs.push([i, i + 1]);
      const ux = (a.x + b.x) / 2;
      const uy = (a.y + b.y) / 2;
      f.divs.push({ a: i, b: i + 1, furrow: m.furrow, wall: m.wall, nucP: m.nucP, nucD: m.nucD, ux, uy, ur: mix(par.r, next[i].r, sseg(m.u, 0.16, 0.86)) });
      // Mitosis: nuclei divide first (spindle, anaphase, telophase), then the cytoplasm.
      const so = (k === 1 ? 1 : sseg(m.u, 0.02, 0.12)) * (1 - sseg(m.u, 0.5, 0.62));
      if (so > 0.01)
        f.spindles.push({
          x: ux,
          y: uy,
          axis: (Math.atan2(next[i + 1].y - next[i].y, next[i + 1].x - next[i].x) * 180) / Math.PI,
          len: par.r * 0.55,
          sep: sseg(m.u, 0.14, 0.42),
          o: so,
          fibres: 1 - sseg(m.u, 0.4, 0.54),
          zygote: k === 1,
        });
    }
  } else {
    const u = clamp(p - gens - 1);
    const BL = BLAST[gens - 4];
    const nodes = GENS[gens];
    let nRing = 0;
    BL.forEach((t) => (nRing += t.kind === 'trofoblasto' ? 1 : 0));
    const compact = sseg(u, 0, 0.28);
    // Cavitation in two phases: the small fluid spaces gather into a first cavity on the
    // anembryonic side (fuse), then that cavity swells into the blastocoel and the cells take
    // their places (cv).
    const fuse = sseg(u, 0.36, 0.55);
    const cv = sseg(u, 0.55, 0.95);
    const pv = { x: POLE.x, y: POLE.y };
    // The cavity opens off-centre (away from the pole), grows and leaves the inner cell mass as a
    // lens at the pole.
    const ccx = -pv.x * mix(46, 0, cv);
    const ccy = -pv.y * mix(46, 0, cv);
    const rg = mix(RG, RB, cv);
    const RF = 28;
    const rc0 = RF * fuse + (rg - TH - RF) * cv;
    // The inner cell mass stays at the pole as a compact rounded cluster (a disc centred on the
    // surface): the swelling cavity wraps around it.
    const icmX = pv.x * rg;
    const icmY = pv.y * rg;
    const icmR = gens === 4 ? 60 : 84;
    const rcAt = (deg: number) => {
      const ux = Math.cos((deg * Math.PI) / 180);
      const uy = Math.sin((deg * Math.PI) / 180);
      const wx = icmX - ccx;
      const wy = icmY - ccy;
      const b = wx * ux + wy * uy;
      const disc = b * b - (wx * wx + wy * wy - icmR * icmR);
      if (b <= 0 || disc <= 0) return rc0;
      const hit = b - Math.sqrt(disc);
      // Soft minimum: the cluster meets the trophoblast with a small rounded corner.
      const k = 10;
      return -k * Math.log(Math.exp(-rc0 / k) + Math.exp(-hit / k));
    };
    const cavIn = (x: number, y: number, m: number): V2 | null => {
      if (rc0 < 2) return null;
      const dx = x - ccx;
      const dy = y - ccy;
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const rr = rcAt(deg) + m;
      const d = Math.hypot(dx, dy);
      if (d >= rr) return null;
      const k2 = d < 1e-6 ? 0 : rr / d;
      return d < 1e-6 ? [ccx + rr, ccy] : [ccx + dx * k2, ccy + dy * k2];
    };
    const sites: Site[] = nodes.map((n, i) => {
      const t = BL.get(i)!;
      const cx = n.x * (1 - 0.05 * compact);
      const cy = n.y * (1 - 0.05 * compact);
      let x = mix(cx, t.x, cv);
      let y = mix(cy, t.y, cv);
      const q = cavIn(x, y, 8);
      if (q) [x, y] = q;
      return { x, y, w: mix(n.r * (1 + 0.1 * compact), 22, cv), partner: -1, pgap: 0 };
    });
    // The notch the polar bodies left smooths out as the ball compacts.
    const base = disc((a) => rimR(a, rg, (1 - compact) * (1 - cv)), 96);
    const gap = mix(GAP[gens], 1.1, compact) + 0.6 * cv;
    const round = mix(ROUND[gens], ROUND[gens] * 0.4, compact) * (1 - 0.3 * cv);
    f.cells = nodes.map((n, i) => {
      const t = BL.get(i)!;
      const s = sites[i];
      let reg = region(sites, i, base, gap);
      // The cavity is not a site of the mosaic: cut each cell along the cavity outline facing it
      // (a chord just inside it; the samples left inside are then laid onto the outline), so no cell
      // reaches across the blastocoel.
      if (rc0 > 2) {
        const dx = s.x - ccx;
        const dy = s.y - ccy;
        const d = Math.hypot(dx, dy) || 1;
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        const h = rcAt(deg) + 1.2 - 3;
        reg = clip(reg, -dx / d, -dy / d, -(ccx * dx + ccy * dy) / d - h, -2);
      }
      const shape = shapeOf(reg, { step: STEP, round, partner: -1, furrowR: 0, cav: (x, y) => cavIn(x, y, 1.2) });
      const kind = cv > 0.5 ? t.kind : 'blastomero';
      // For renderers that draw each cell as an ellipse (intro, chronicle): ease from the round
      // blastomere to its place in the blastocyst — a flat cell of the trophoblast ring, or a round
      // cell of the inner cluster. (The mosaic `shape` is what the scenes draw.)
      const k = sseg(cv, 0.3, 0.8);
      const tro = t.kind === 'trofoblasto';
      const ang = (Math.atan2(t.y, t.x) * 180) / Math.PI;
      return {
        x: mix(s.x, t.x, k),
        y: mix(s.y, t.y, k),
        rx: mix(s.w, tro ? (Math.PI * (RB - 7)) / nRing : gens === 4 ? 17 : 14, k),
        ry: mix(s.w, tro ? 8.5 : gens === 4 ? 17 : 14, k),
        rot: k > 0 ? (tro ? ang + 90 : 0) : mixAng(n.axis, 0, cv),
        z: t.kind === 'trofoblasto' ? mix(n.z, 0.5, cv) : mix(n.z, 0.8, cv),
        nuc: 1,
        rim: mix(1, 0.4, compact) + 0.5 * cv,
        kind,
        fate: t.kind,
        shape,
      };
    });
    f.compact = compact * (1 - 0.5 * cv);
    // Notes 4.4: the zona is lost in the uterine cavity, before the fluid enters between the cells.
    f.zonaO = 1 - sseg(u, 0.04, 0.3);
    f.cavR = rc0;
    f.cavO = clamp((rc0 - 8) / 22);
    if (rc0 > 2) {
      const pts: V2[] = [];
      for (let a = 0; a < 360; a += 4) {
        const r = rcAt(a);
        pts.push([ccx + r * Math.cos((a * Math.PI) / 180), ccy + r * Math.sin((a * Math.PI) / 180)]);
      }
      f.cav = pts;
    }
    // Small fluid spaces between the cells: appear, swell, and merge into the cavity as it reaches them.
    // Each is absorbed smoothly as the cavity's edge reaches it.
    DROPS.forEach(([x0, y0], i) => {
      const lag = hash(i * 7.1) * 0.08;
      const a = sseg(u, 0.14 + lag, 0.3 + lag);
      if (a <= 0.01) return;
      const grow = sseg(u, 0.24 + lag * 0.5, 0.42);
      const r = 2 + 3.5 * a + 4.5 * grow;
      const k = 0.55 * sseg(u, 0.32 + lag, 0.56);
      const x = mix(x0, ccx, k);
      const y = mix(y0, ccy, k);
      let o = a * (1 - sseg(cv, 0, 0.35));
      if (rc0 > 2) {
        const dx = x - ccx;
        const dy = y - ccy;
        const d = Math.hypot(dx, dy);
        const rr = rcAt((Math.atan2(dy, dx) * 180) / Math.PI);
        o *= 1 - clamp((rr + r - d) / (2 * r));
      }
      if (o > 0.01) f.drops.push({ x, y, r, o });
    });
  }

  if (wobble) {
    f.cells.forEach((c, i) => {
      c.x += Math.sin(wobble * 1.3 + i * 1.7) * 0.7;
      c.y += Math.cos(wobble * 1.1 + i * 2.3) * 0.7;
    });
  }
  return f;
}

/** Caption for each phase, as in the notes. */
export function cleavageStep(p: number): { name: string; day: string } {
  if (p < 1) return { name: 'Zigotoa', day: '0. eguna' };
  if (p < 2) return { name: 'Segmentazioa · 2 blastomero', day: '1.–3. egunak' };
  if (p < 3) return { name: 'Segmentazioa · 4 blastomero', day: '1.–3. egunak' };
  if (p < 4) return { name: 'Segmentazioa · 8 blastomero', day: '1.–3. egunak' };
  if (p < 5) return { name: 'Morula · 16 zelula inguru', day: '3. eguna' };
  return { name: 'Blastozistoa', day: '4.–5. egunak' };
}
