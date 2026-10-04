'use client';

import { C, rand } from '@/components/kit';

/**
 * Drawing kit for the week-3 villi scenes (local; ids prefixed `w3b-`). Everything is computed from
 * plain geometry so the longitudinal and the transverse drawings share proportions:
 *  - a villus is a `Finger`: a gently swaying centre line rising from a base line, a half-width
 *    profile, and its tissue layers as offsets of the outer (syncytial) outline;
 *  - each tissue layer is ONE path (plate band + every villus finger), so villi and plate read as one
 *    tissue with soft fillets and no seams;
 *  - cytotrophoblast is drawn as real cells (cuboidal wall cells, packed core cells) batched into a
 *    couple of <path>s, so hundreds of cells stay cheap to re-render every frame.
 */

export type P = [number, number];
const r1 = (v: number) => (Math.round(v * 10) / 10).toString();
/** Deterministic noise from two numbers (positions). */
export const rand3 = (a: number, b: number) => rand(a * 12.9898 + b * 78.233);

export const pd = (pts: P[], close = false) => (pts.length ? 'M' + pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join('L') + (close ? 'Z' : '') : '');

/* ------------------------------------------------------------------ */
/* Colours and local defs                                              */
/* ------------------------------------------------------------------ */

export const K = {
  cell: C.cyto,
  cellEdge: 'rgba(16,74,42,0.62)',
  cellNuc: '#2c7a49',
  cellNucleolus: '#123d24',
  cytoGround: '#5cb174',
  synEdge: '#0b4a30',
  synRim: 'rgba(150,236,190,0.34)',
  fringe: 'rgba(120,214,166,0.55)',
  meso: C.mesoExtra,
  mesoEdge: '#cf6f52',
  angio: '#f6cbd5',
  angioEdge: '#a5566b',
  endo: '#f7bccb',
  endoNuc: '#b0576f',
  lumen: '#b81f3d',
  rbc: '#ec5068',
  rbcEdge: '#7c0f25',
  blood: '#8c1a2f',
  shadow: 'rgba(4,6,12,0.32)',
} as const;

export function W3bDefs() {
  return (
    <defs>
      {/* Syncytiotrophoblast: one cytoplasm with many nuclei, no cell borders. */}
      <pattern id="w3b-syn" width="26" height="22" patternUnits="userSpaceOnUse">
        <rect width="26" height="22" fill={C.syncytio} />
        <rect width="26" height="22" fill="#0e5a3b" opacity="0.25" />
        <ellipse cx="5" cy="5" rx="2.4" ry="1.8" fill="#0c4630" />
        <ellipse cx="18" cy="8" rx="2.2" ry="1.7" fill="#0c4630" />
        <ellipse cx="10" cy="16" rx="2.4" ry="1.8" fill="#0c4630" />
        <ellipse cx="23" cy="19" rx="1.9" ry="1.5" fill="#0c4630" />
        <circle cx="4.4" cy="4.4" r="0.7" fill="#3ea877" />
        <circle cx="9.4" cy="15.4" r="0.7" fill="#3ea877" />
      </pattern>
      {/* Maternal blood (intervillous space): plasma with biconcave red cells (pale centre). */}
      <pattern id="w3b-blood" width="34" height="30" patternUnits="userSpaceOnUse">
        <rect width="34" height="30" fill={K.blood} />
        <g fill="#c8304a" stroke="#6e0f22" strokeWidth="0.5">
          <ellipse cx="7" cy="7" rx="4.2" ry="3" transform="rotate(20 7 7)" />
          <ellipse cx="24" cy="10" rx="4.2" ry="3" transform="rotate(-35 24 10)" />
          <ellipse cx="14" cy="22" rx="4.2" ry="3" transform="rotate(60 14 22)" />
          <ellipse cx="30" cy="26" rx="3.6" ry="2.6" transform="rotate(5 30 26)" />
        </g>
        <g fill="#de6277">
          <ellipse cx="7" cy="7" rx="1.7" ry="1.1" transform="rotate(20 7 7)" />
          <ellipse cx="24" cy="10" rx="1.7" ry="1.1" transform="rotate(-35 24 10)" />
          <ellipse cx="14" cy="22" rx="1.7" ry="1.1" transform="rotate(60 14 22)" />
          <ellipse cx="30" cy="26" rx="1.4" ry="0.9" transform="rotate(5 30 26)" />
        </g>
      </pattern>
      {/* Roundness of a villus (light from the top left). */}
      <linearGradient id="w3b-cyl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="0.32" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.68" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
      </linearGradient>
      {/* Depth of a horizontal slab (light from above). */}
      <linearGradient id="w3b-vshade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
      </linearGradient>
      {/* Roundness of a cross-section (sphere-like light from the top left). */}
      <radialGradient id="w3b-ball" cx="38%" cy="32%" r="72%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
      </radialGradient>
      {/* Blood field depth: darker towards the edges. */}
      <radialGradient id="w3b-field" cx="50%" cy="45%" r="65%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
      </radialGradient>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* Polyline tools                                                      */
/* ------------------------------------------------------------------ */

export function cumLen(pts: P[]) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return L;
}

/** Point and unit left-hand normal at arc length s (left-hand of the direction of travel). */
export function pointAt(pts: P[], L: number[], s: number): { p: P; n: P; a: number } {
  const total = L[L.length - 1];
  const d = Math.max(0, Math.min(total, s));
  let i = 1;
  while (i < L.length - 1 && L[i] < d) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const segL = L[i] - L[i - 1] || 1;
  const k = (d - L[i - 1]) / segL;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return { p: [a[0] + dx * k, a[1] + dy * k], n: [dy / l, -dx / l], a: Math.atan2(dy, dx) };
}

/** Part of a polyline between arc fractions u0 and u1. */
export function subPoly(pts: P[], L: number[], u0: number, u1: number): P[] {
  const total = L[L.length - 1];
  const s0 = Math.max(0, u0) * total;
  const s1 = Math.min(1, u1) * total;
  if (s1 - s0 < 0.5) return [];
  const out: P[] = [pointAt(pts, L, s0).p];
  for (let i = 1; i < pts.length - 1; i++) if (L[i] > s0 && L[i] < s1) out.push(pts[i]);
  out.push(pointAt(pts, L, s1).p);
  return out;
}

/** Microvilli: short ticks along the outward (left-hand) normal of a polyline, every `step`. */
export function fringe(pts: P[], step = 4.5, len = 3.2, flip = false) {
  const L = cumLen(pts);
  const total = L[L.length - 1];
  let d = '';
  for (let s = step / 2; s < total; s += step) {
    const { p, n } = pointAt(pts, L, s);
    const k = flip ? -1 : 1;
    d += `M${r1(p[0])},${r1(p[1])}l${r1(n[0] * len * k)},${r1(n[1] * len * k)}`;
  }
  return d;
}

/** Offset a closed or open polyline along its left-hand normals (negative = to the right). */
export function offsetPoly(pts: P[], d: number): P[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [p[0] + (dy / l) * d, p[1] - (dx / l) * d] as P;
  });
}

/* ------------------------------------------------------------------ */
/* Villus fingers                                                      */
/* ------------------------------------------------------------------ */

export interface Finger {
  /** Centre of the base. */
  x: number;
  /** y of the base line (the plate surface the finger rises from). */
  base: number;
  /** Length from base to the outer tip. */
  len: number;
  /** Outer half-width (syncytial surface). */
  hw: number;
  sway: number;
  lam: number;
  ph: number;
}

/** Centre line x at height y (the sway grows in from the base, so growth just extends the same curve). */
export const fx = (f: Finger, y: number) => {
  const s = f.base - y;
  return f.x + f.sway * (Math.sin(s / f.lam + f.ph) - Math.sin(f.ph)) * Math.min(1, Math.max(0, s) / 80);
};
/** Half-width at height y of the layer `d` inside the outer surface. */
export const fw = (f: Finger, y: number, d: number) => f.hw * (1 + 0.05 * Math.sin((f.base - y) / 38 + f.ph * 1.3)) - d;

export interface FingerShape {
  /** Fillet start on the plate → up the left side → cap start. */
  left: P[];
  /** Over the tip, left → right. */
  cap: P[];
  /** Fillet start on the plate → up the right side → cap start (bottom → top). */
  right: P[];
  /** Cap centre and radii. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * One layer of a finger: the outline `d` inside the outer surface, rising from the plate line `topY`
 * (with a concave fillet of radius `r`) to its apex at `apex`. A short finger (a bud just starting)
 * gets a flattened cap and a smaller fillet, so it grows out of the plate smoothly.
 */
export function fingerShape(f: Finger, d: number, topY: number, r: number, apex: number, step = 6): FingerShape | null {
  const h = topY - apex;
  if (h <= 0.6) return null;
  const rc0 = Math.max(1, fw(f, apex, d));
  const rf = Math.min(r, h * 0.45);
  const ry = Math.max(0.4, Math.min(rc0, h - rf));
  const cy = apex + ry;
  const ys = topY - rf;
  const xl0 = fx(f, ys) - fw(f, ys, d);
  const xr0 = fx(f, ys) + fw(f, ys, d);
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= 5; i++) {
    const k = i / 5;
    const q = (a: number, c: number, b: number) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * c + k * k * b;
    left.push([q(xl0 - rf, xl0, xl0), q(topY, topY, ys)]);
    right.push([q(xr0 + rf, xr0, xr0), q(topY, topY, ys)]);
  }
  const n = Math.max(1, Math.ceil((ys - cy) / step));
  for (let i = 1; i <= n; i++) {
    const y = ys - ((ys - cy) * i) / n;
    left.push([fx(f, y) - fw(f, y, d), y]);
    right.push([fx(f, y) + fw(f, y, d), y]);
  }
  const cx = fx(f, cy);
  const rx = fw(f, cy, d);
  const cap: P[] = [];
  const m = 16;
  for (let i = 1; i < m; i++) {
    const a = Math.PI + (Math.PI * i) / m;
    cap.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return { left, cap, right, cx, cy, rx, ry };
}

/** The finger's own outline (left side, cap, right side), closed across its base. */
export const fingerOutline = (s: FingerShape): P[] => [...s.left, ...s.cap, ...[...s.right].reverse()];

/**
 * Top boundary of one tissue layer across the whole field: the plate line at `topY` with every
 * finger's layer rising out of it (left → right). Fill it down to the slab bottom for the layer.
 */
export function layerTop(fs: { f: Finger; apex: number; d: number }[], topY: number, r: number, x0 = -40, x1 = 1040): P[] {
  const pts: P[] = [[x0, topY]];
  for (const { f, apex, d } of [...fs].sort((a, b) => a.f.x - b.f.x)) {
    const s = fingerShape(f, d, topY, r, apex);
    if (s) pts.push(...fingerOutline(s));
  }
  pts.push([x1, topY]);
  return pts;
}

/** Rotate points by `deg` (clockwise, 0 = unchanged) about the origin, then move them to (ox, oy). */
export const xform = (pts: P[], ox: number, oy: number, deg: number): P[] => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [ox + x * c - y * s, oy + x * s + y * c] as P);
};

/* ------------------------------------------------------------------ */
/* Cells                                                               */
/* ------------------------------------------------------------------ */

/** Batched cell geometry: bodies and nuclei as one path each. */
export interface CellBatch {
  body: string[];
  nuc: string[];
  nucleoli: string[];
}
export const newBatch = (): CellBatch => ({ body: [], nuc: [], nucleoli: [] });

export const ellipseSub = (cx: number, cy: number, rx: number, ry: number, deg = 0) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x0 = cx - rx * c;
  const y0 = cy - rx * s;
  const x1 = cx + rx * c;
  const y1 = cy + rx * s;
  return `M${r1(x0)},${r1(y0)}A${r1(rx)} ${r1(ry)} ${r1(deg)} 1 0 ${r1(x1)},${r1(y1)}A${r1(rx)} ${r1(ry)} ${r1(deg)} 1 0 ${r1(x0)},${r1(y0)}Z`;
};

/**
 * Cuboidal cells lining a polyline (one row, `th` deep, on the side opposite to the normal: inside
 * the tissue). `flip` uses the right-hand normal instead (for a side traced bottom → top on the right).
 * With `fit`, the cells are resized to tile the line exactly (caps); otherwise they keep `spacing`
 * from the line's start, so a growing line adds cells at its end instead of re-tiling (no swimming).
 */
export function wallCells(out: CellBatch, pts: P[], th: number, spacing: number, opts: { flip?: boolean; fit?: boolean; detail?: boolean; scale?: number; keep?: (p: P) => boolean } = {}) {
  const L = cumLen(pts);
  const total = L[L.length - 1];
  if (total < 2) return;
  const k = opts.flip ? -1 : 1;
  const n = opts.fit ? Math.max(1, Math.round(total / spacing)) : Math.ceil(total / spacing);
  const sp = opts.fit ? total / n : spacing;
  for (let i = 0; i < n; i++) {
    const s0 = i * sp;
    const s1 = Math.min(total, s0 + sp);
    if (s1 - s0 < sp * 0.3) break;
    const A = pointAt(pts, L, s0);
    const B = pointAt(pts, L, s1);
    const M = pointAt(pts, L, (s0 + s1) / 2);
    if (opts.keep && !opts.keep(M.p)) continue;
    const inn = (q: { p: P; n: P }, t: number): P => [q.p[0] - q.n[0] * k * t, q.p[1] - q.n[1] * k * t];
    const ctrl = (a: P, m: P, b: P): P => [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
    const a1 = inn(A, th);
    const b1 = inn(B, th);
    const m1 = inn(M, th);
    const c0 = ctrl(A.p, M.p, B.p);
    const c1 = ctrl(b1, m1, a1);
    out.body.push(
      `M${r1(A.p[0])},${r1(A.p[1])}Q${r1(c0[0])},${r1(c0[1])} ${r1(B.p[0])},${r1(B.p[1])}L${r1(b1[0])},${r1(b1[1])}Q${r1(c1[0])},${r1(c1[1])} ${r1(a1[0])},${r1(a1[1])}Z`,
    );
    const nc = inn(M, th * 0.52);
    const w = s1 - s0;
    const deg = (M.a * 180) / Math.PI;
    out.nuc.push(ellipseSub(nc[0], nc[1], Math.min(w * 0.3, th * 0.34), th * 0.24, deg));
    if (opts.detail) out.nucleoli.push(ellipseSub(nc[0] + 0.6, nc[1] - 0.4, 0.8 * (opts.scale ?? 1), 0.8 * (opts.scale ?? 1)));
  }
}

/** One round cell into a batch (core cells): radius r, nucleus ratio. */
export function roundCell(out: CellBatch, x: number, y: number, r: number, detail = false, mitosis = 0) {
  if (r < 0.6) return;
  if (mitosis > 0) {
    // Metaphase: the cell rounds up a little and its chromosomes line up as a dark plate.
    out.body.push(ellipseSub(x, y, r * 1.08, r * 0.96));
    out.nuc.push(ellipseSub(x, y, r * 0.16, r * 0.5, 8));
    return;
  }
  out.body.push(ellipseSub(x, y, r, r * 0.92));
  out.nuc.push(ellipseSub(x + r * 0.06, y + r * 0.04, r * 0.42, r * 0.38));
  if (detail) out.nucleoli.push(ellipseSub(x + r * 0.16, y - r * 0.06, r * 0.11, r * 0.11));
}

export function CellPaths({ b, fill = K.cell, edge = K.cellEdge, nuc = K.cellNuc, sw = 0.8 }: { b: CellBatch; fill?: string; edge?: string; nuc?: string; sw?: number }) {
  return (
    <>
      {b.body.length > 0 && <path d={b.body.join('')} fill={fill} stroke={edge} strokeWidth={sw} strokeLinejoin="round" />}
      {b.nuc.length > 0 && <path d={b.nuc.join('')} fill={nuc} />}
      {b.nucleoli.length > 0 && <path d={b.nucleoli.join('')} fill={K.cellNucleolus} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Vessels forming in situ (vasculogenesis)                            */
/* ------------------------------------------------------------------ */

export interface VesselPlan {
  pts: P[];
  L: number[];
  /** Island centres (arc fractions) with their own start delays. */
  isl: { c: number; delay: number }[];
}

export function planVessel(pts: P[], n: number, seed: number): VesselPlan {
  const isl = Array.from({ length: n }, (_, k) => ({ c: (k + 0.5) / n, delay: rand(seed * 13.7 + k * 3.3) * 0.32 }));
  return { pts, L: cumLen(pts), isl };
}

/** Grown segments of a vessel at formation progress `v` (each island elongates both ways until they join). */
export function vesselSegments(plan: VesselPlan, v: number): P[][] {
  const n = plan.isl.length;
  const H = 0.5 / n + 0.006;
  const segs: P[][] = [];
  for (const { c, delay } of plan.isl) {
    const k = Math.max(0, Math.min(1, (v - delay) / 0.55));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    if (e <= 0.01) continue;
    const h = H * e;
    const p = subPoly(plan.pts, plan.L, c - h, c + h);
    if (p.length > 1) segs.push(p);
  }
  return segs;
}

/** Where each island sits, how far it has condensed (0..1) and how far it has turned into vessel. */
export function islandStates(plan: VesselPlan, isl: number, v: number) {
  return plan.isl.map(({ c, delay }, k) => {
    const { p } = pointAt(plan.pts, plan.L, c * plan.L[plan.L.length - 1]);
    const appear = Math.max(0, Math.min(1, (isl - delay * 0.8) / 0.55));
    const gone = Math.max(0, Math.min(1, (v - delay) / 0.3));
    return { p, appear, gone, k };
  });
}

/** A blood island: angioblasts in a ring around the first blood cells. */
export function Island({ x, y, s, seed, scale = 1 }: { x: number; y: number; s: number; seed: number; scale?: number }) {
  if (s <= 0.02) return null;
  const R = 4.6 * scale * (0.5 + 0.5 * s);
  return (
    <g opacity={Math.min(1, s * 1.4)}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + rand(seed + i) * 0.6;
        const cx = x + Math.cos(a) * R;
        const cy = y + Math.sin(a) * R;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={2.5 * scale * s} fill={K.angio} stroke={K.angioEdge} strokeWidth={0.5 * scale} />
            <circle cx={cx + 0.3 * scale} cy={cy} r={1.05 * scale * s} fill={K.endoNuc} />
          </g>
        );
      })}
      <circle cx={x - 1.3 * scale} cy={y} r={1.7 * scale * s} fill={K.rbc} stroke={K.rbcEdge} strokeWidth={0.4 * scale} />
      <circle cx={x + 1.6 * scale} cy={y + 0.8 * scale} r={1.5 * scale * s} fill={K.rbc} stroke={K.rbcEdge} strokeWidth={0.4 * scale} />
    </g>
  );
}

/**
 * Vessel pieces (forming or formed): endothelial wall, lumen and the first blood cells. Every piece's
 * wall is drawn before any lumen, so overlapping pieces join without seams. Static: no heartbeat yet.
 */
export function VesselSet({
  segs,
  w = 6.6,
  lumen = K.lumen,
  lumens,
  cells = true,
  detail = false,
  scale = 1,
  linecap = 'round',
}: {
  segs: P[][];
  w?: number;
  lumen?: string;
  /** Per-piece lumen colours (same order as `segs`), e.g. deoxygenated / oxygenated legs of one network. */
  lumens?: string[];
  cells?: boolean;
  detail?: boolean;
  scale?: number;
  /** 'butt' for pieces that must end flush against another set drawn before them. */
  linecap?: 'round' | 'butt';
}) {
  const keep = segs.map((p, i) => ({ p, c: lumens?.[i] ?? lumen })).filter((s) => s.p.length > 1);
  const live = keep.map((s) => s.p);
  if (!live.length) return null;
  const d = live.map((p) => pd(p)).join('');
  const byColour = new Map<string, string>();
  for (const s of keep) byColour.set(s.c, (byColour.get(s.c) ?? '') + pd(s.p));
  let rbc = '';
  let nuc = '';
  for (const pts of live) {
    const L = cumLen(pts);
    const total = L[L.length - 1];
    if (cells)
      for (let s = 5 * scale; s < total - 3 * scale; s += 9.5 * scale) {
        const { p, a } = pointAt(pts, L, s);
        rbc += ellipseSub(p[0], p[1], 1.9 * scale, 1.25 * scale, (a * 180) / Math.PI + 30);
      }
    if (detail)
      for (let s = 7 * scale; s < total - 4 * scale; s += 17 * scale) {
        const { p, n, a } = pointAt(pts, L, s);
        const side = Math.round(s / (17 * scale)) % 2 ? 1 : -1;
        nuc += ellipseSub(p[0] + n[0] * side * w * 0.42, p[1] + n[1] * side * w * 0.42, 2.2 * scale, 0.75 * scale, (a * 180) / Math.PI);
      }
  }
  return (
    <g fill="none" strokeLinecap={linecap} strokeLinejoin="round">
      <path d={d} stroke="#5e1d2f" strokeWidth={w + 2 * scale} />
      <path d={d} stroke={K.endo} strokeWidth={w} />
      {[...byColour].map(([c, dd]) => (
        <path key={c} d={dd} stroke={c} strokeWidth={w * 0.6} />
      ))}
      {rbc && <path d={rbc} fill={K.rbc} stroke={K.rbcEdge} strokeWidth={0.35 * scale} />}
      {nuc && <path d={nuc} fill={K.endoNuc} stroke="none" />}
    </g>
  );
}

/** Split a polyline into the runs of points that pass `keep`. */
export function runs(pts: P[], keep: (p: P) => boolean): P[][] {
  const out: P[][] = [];
  let cur: P[] = [];
  for (const p of pts) {
    if (keep(p)) cur.push(p);
    else if (cur.length) {
      if (cur.length > 1) out.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/**
 * Capillary loop inside a finger: up the left of the mesodermal core from `y0`, over a round top at
 * `top`, down the right. Legs sit at 46 % of the core half-width (`yClamp`: widths below it are taken
 * at `yClamp`, so the legs stay parallel where the finger flares into the plate).
 */
export function loopOf(f: Finger, ts: number, tc: number, y0: number, top: number, yClamp: number, k = 0.46): P[] {
  const d = ts + tc;
  const off = (y: number) => fw(f, Math.min(y, yClamp), d) * k;
  const rl = off(top + 10);
  const cy = top + rl;
  const left: P[] = [];
  const right: P[] = [];
  const n = Math.max(2, Math.ceil((y0 - cy) / 6));
  for (let i = 0; i <= n; i++) {
    const y = y0 - ((y0 - cy) * i) / n;
    left.push([fx(f, y) - off(y), y]);
    right.push([fx(f, y) + off(y), y]);
  }
  const cx = fx(f, cy);
  const cap: P[] = [];
  for (let i = 1; i < 12; i++) {
    const a = Math.PI + (Math.PI * i) / 12;
    cap.push([cx + rl * Math.cos(a), cy + rl * Math.sin(a)]);
  }
  return [...left, ...cap, ...right.reverse()];
}
