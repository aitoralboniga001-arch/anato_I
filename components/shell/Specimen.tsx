'use client';

import type { ReactNode } from 'react';
import type { PlaneKind } from '@/lib/sim/types';

/**
 * A small 3-D sketch of what is being looked at at this age (the whole uterus, the implanted
 * conceptus, the embryo complex with amnion and yolk sac, the folding embryo, the C-shaped embryo…)
 * with the current section plane cutting it, and the section it leaves drawn on the plane. It is
 * the course-book "where is this cut?" inset: the same object every time, only the plane moves.
 *
 * World axes: x = cranial (−) → caudal (+) (for the C embryo: ventral (−) → dorsal (+)),
 * y = up (dorsal / endometrium side), z = depth (away from the viewer).
 */

export type V3 = [number, number, number];
export type Pt = [number, number];

export type SpecimenShape = 'umetokia' | 'blastozistoa' | 'habiratzea' | 'diskoa' | 'tolesten' | 'c' | 'fetua' | 'karena';

export const SHAPE_TEXT: Record<SpecimenShape, string> = {
  umetokia: 'umetokia eta tronpak (aurretik)',
  blastozistoa: 'blastozistoa',
  habiratzea: 'endometrioan habiratutako konzeptua',
  diskoa: 'korion zakua: barruan diskoa, amniosa eta bitelo zakua',
  tolesten: 'enbrioia tolesten, bitelo zakuaren gainean',
  c: 'C itxurako enbrioia',
  fetua: 'fetua',
  karena: 'fetua, amniosa, zilbor-hestea eta karena',
};

/** Which object the views of a week show. */
export function shapeFor(week: number, day: number, plane: PlaneKind): SpecimenShape {
  if (week === 1) return plane === 'koronala' ? 'umetokia' : day < 5.5 ? 'blastozistoa' : 'habiratzea';
  if (week === 2) return 'habiratzea';
  if (week === 3) return 'diskoa';
  if (week === 4) return 'tolesten';
  if (week === 5) return day < 57 ? 'c' : 'fetua';
  if (week === 7) return 'c';
  if (week === 8 || week === 9) return day < 57 ? 'c' : 'fetua';
  // Circulatory system: the cardiogenic area on the flat disc (as topic 3, days 13–21), the heart tube
  // while the embryo folds (topic 4, days 22–28), then the C-shaped embryo and the fetus (topics 5, 8, 9).
  if (week === 10) return day < 22 ? 'diskoa' : day < 28 ? 'tolesten' : day < 57 ? 'c' : 'fetua';
  if (week === 11) return day < 57 ? 'c' : 'fetua';
  return 'karena';
}

// Oblique projection: depth goes up and to the right.
const DX = 0.5;
const DY = 0.3;

export interface Blob {
  c: V3;
  r: V3;
  fill: string;
  stroke: string;
  /** Only the upper (+1) or lower (−1) half (amnion dome, yolk sac…). */
  half?: 1 | -1;
  dash?: boolean;
  /** Not cut by the plane (context only). */
  ghost?: boolean;
}

export interface Model {
  blobs: Blob[];
  /** Extra drawing in world coordinates (tubes, streak…), under the plane. */
  extra?: (p: (v: V3) => Pt) => ReactNode;
  /** Plane extents. */
  ext: { x: [number, number]; y: [number, number]; z: [number, number] };
  /** Direction tags at the ends of each axis (big sketch only). */
  tags: { at: V3; text: string }[];
  /** Transverse cut: along x (flat embryos) or along y (upright C embryo). */
  transverse: 'x' | 'y';
  /** Where the magnifier sits for a detail view. */
  spot: V3;
  /** Box drawn as context (the endometrium slab). */
  box?: { x: [number, number]; y: [number, number]; z: [number, number]; fill: string; stroke: string };
  /** A curved body drawn as a swept tube in the z = 0 plane (C embryo). */
  tube?: { pts: V3[]; w: number; fill: string; stroke: string; head?: { c: V3; r: number } };
}

const TROPHO = '#86dc9b';
const CHORION = '#b7824f';
const EMB = '#7aa7f5';
const AMN = 'rgba(109,155,230,0.45)';
const YOLK = 'rgba(242,193,78,0.5)';
const BODY = 'rgba(232,238,252,0.2)';
const EDGE = 'rgba(232,238,252,0.6)';

function cCurve(big: boolean): V3[] {
  // Head up, back to the right (+x), tail curling forward under the belly.
  const pts: V3[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (-150 + (i / 40) * 280) * (Math.PI / 180);
    const r = big ? 25 : 26 - i * 0.18;
    pts.push([Math.cos(a) * r * 0.9, -Math.sin(a) * r, 0]);
  }
  return pts;
}

export function modelOf(shape: SpecimenShape, day: number): Model {
  switch (shape) {
    case 'umetokia':
      return {
        blobs: [
          { c: [0, 2, 0], r: [17, 24, 10], fill: 'rgba(240,195,204,0.28)', stroke: '#e4a3b2' },
          { c: [-44, -4, 0], r: [7, 5, 5], fill: 'rgba(243,233,198,0.45)', stroke: '#e9d9a6' },
          { c: [44, -4, 0], r: [7, 5, 5], fill: 'rgba(243,233,198,0.45)', stroke: '#e9d9a6' },
        ],
        extra: (p) => (
          <g fill="none" stroke="#e4a3b2" strokeWidth={3} strokeLinecap="round">
            <path d={`M${p([-13, 18, 0]).join(' ')} Q${p([-30, 26, 0]).join(' ')} ${p([-46, 6, 0]).join(' ')}`} />
            <path d={`M${p([13, 18, 0]).join(' ')} Q${p([30, 26, 0]).join(' ')} ${p([46, 6, 0]).join(' ')}`} />
          </g>
        ),
        ext: { x: [-54, 54], y: [-30, 32], z: [-18, 18] },
        tags: [
          { at: [0, 36, 0], text: 'Kr' },
          { at: [0, -32, 0], text: 'Ka' },
        ],
        transverse: 'y',
        spot: [0, 10, 0],
      };
    case 'blastozistoa':
      return {
        blobs: [
          { c: [0, 0, 0], r: [26, 26, 26], fill: 'rgba(134,220,155,0.22)', stroke: TROPHO },
          { c: [0, -2, 0], r: [21, 21, 21], fill: 'rgba(29,42,68,0.55)', stroke: 'rgba(134,220,155,0.4)' },
          { c: [0, 15, 0], r: [12, 7, 10], fill: EMB, stroke: '#a9c6fb' },
        ],
        ext: { x: [-36, 36], y: [-32, 32], z: [-32, 32] },
        tags: [{ at: [0, 32, 0], text: 'Enb' }],
        transverse: 'x',
        spot: [0, 15, 0],
      };
    case 'habiratzea': {
      const deep = day >= 9;
      const cy = deep ? 14 : 6;
      const R = day >= 11 ? 20 : 17;
      return {
        box: { x: [-50, 50], y: [-2, 34], z: [-30, 30], fill: 'rgba(240,195,204,0.16)', stroke: 'rgba(228,163,178,0.7)' },
        blobs: [
          { c: [0, cy, 0], r: [R, R, R], fill: 'rgba(134,220,155,0.2)', stroke: TROPHO },
          ...(day >= 11 ? [{ c: [0, cy + 5, 0] as V3, r: [12, 12, 12] as V3, fill: 'rgba(17,26,46,0.6)', stroke: 'rgba(244,160,127,0.8)' }] : []),
          { c: [0, cy + 8, 0], r: [8, 4, 6], fill: AMN, stroke: '#8fb4f7', half: 1 },
          { c: [0, cy + 8, 0], r: [8, 1.4, 6], fill: EMB, stroke: '#a9c6fb' },
          ...(day >= 9 ? [{ c: [0, cy + 2, 0] as V3, r: [8, 6, 6] as V3, fill: YOLK, stroke: '#f2c14e', half: -1 as const }] : []),
        ],
        ext: { x: [-44, 44], y: [-14, 40], z: [-26, 26] },
        tags: [
          { at: [0, 40, 0], text: 'Endometrioa' },
          { at: [0, -16, 0], text: 'Barrunbea' },
        ],
        transverse: 'x',
        spot: [0, cy + 8, 0],
      };
    }
    case 'diskoa':
      return {
        blobs: [
          { c: [4, 0, 0], r: [42, 36, 34], fill: 'rgba(20,28,48,0.5)', stroke: CHORION },
          { c: [-4, 6, 0], r: [22, 9, 15], fill: AMN, stroke: '#8fb4f7', half: 1 },
          { c: [-4, -4, 0], r: [16, 10, 12], fill: YOLK, stroke: '#f2c14e' },
          { c: [-4, 6, 0], r: [22, 1.6, 15], fill: EMB, stroke: '#a9c6fb' },
        ],
        extra: (p) => (
          <g>
            <path d={`M${p([16, 10, 0]).join(' ')} L${p([40, 16, 0]).join(' ')}`} stroke="#f4a07f" strokeWidth={5} strokeLinecap="round" />
            {day >= 15 && <path d={`M${p([0, 7.8, 0]).join(' ')} L${p([15, 7.8, 0]).join(' ')}`} stroke="#ef4b4b" strokeWidth={1.6} strokeLinecap="round" />}
          </g>
        ),
        ext: { x: [-50, 52], y: [-40, 40], z: [-38, 38] },
        tags: [
          { at: [-32, 6, 0], text: 'Kr' },
          { at: [28, 3, 0], text: 'Ka' },
          { at: [-4, 22, 0], text: 'Dor' },
        ],
        transverse: 'x',
        spot: [-4, 6, 0],
      };
    case 'tolesten':
      return {
        blobs: [
          { c: [0, 4, 0], r: [46, 22, 22], fill: 'rgba(109,155,230,0.08)', stroke: 'rgba(143,180,247,0.5)', dash: true, ghost: true },
          { c: [0, 6, 0], r: [34, 7, 10], fill: BODY, stroke: EDGE },
          { c: [4, -8, 0], r: [12, 8, 10], fill: YOLK, stroke: '#f2c14e' },
        ],
        extra: (p) => (
          <g>
            <path d={`M${p([-30, 13, 0]).join(' ')} L${p([30, 13, 0]).join(' ')}`} stroke="#7aa7f5" strokeWidth={2.4} strokeLinecap="round" />
            {[-16, -9, -2, 5, 12].map((x) => (
              <circle key={x} cx={p([x, 12, -6])[0]} cy={p([x, 12, -6])[1]} r={1.6} fill="rgba(239,75,75,0.8)" />
            ))}
          </g>
        ),
        ext: { x: [-44, 44], y: [-22, 28], z: [-24, 24] },
        tags: [
          { at: [-40, 6, 0], text: 'Kr' },
          { at: [40, 6, 0], text: 'Ka' },
          { at: [0, 20, 0], text: 'Dor' },
        ],
        transverse: 'x',
        spot: [-10, 12, 0],
      };
    case 'c':
    case 'fetua':
    case 'karena': {
      const big = shape !== 'c';
      const s = shape === 'karena' ? 0.62 : 1;
      const pts = cCurve(big).map(([x, y, z]) => [x * s, y * s, z] as V3);
      const blobs: Blob[] = [];
      if (shape === 'karena') {
        blobs.push({ c: [0, 0, 0], r: [34, 34, 30], fill: 'rgba(109,155,230,0.12)', stroke: '#8fb4f7', ghost: false });
      }
      return {
        blobs,
        tube: { pts, w: big ? 13 * s : 12, fill: BODY, stroke: EDGE, head: big ? { c: [pts[0][0] + 2 * s, pts[0][1] + 6 * s, 0], r: 12 * s } : undefined },
        extra:
          shape === 'karena'
            ? (p) => (
                <g>
                  <path d={`M${p([-2, -6, 0]).join(' ')} Q${p([-30, -6, 0]).join(' ')} ${p([-26, 22, 0]).join(' ')}`} fill="none" stroke="#f4a07f" strokeWidth={2.4} />
                  <path d={`M${p([-40, 10, 0]).join(' ')} Q${p([-36, 32, 0]).join(' ')} ${p([-14, 38, 0]).join(' ')}`} fill="none" stroke="#b3303f" strokeWidth={6} strokeLinecap="round" />
                </g>
              )
            : undefined,
        ext: { x: [-40, 40], y: [-38, 40], z: [-26, 26] },
        tags: [
          { at: [0, 42, 0], text: 'Kr' },
          { at: [0, -40, 0], text: 'Ka' },
          { at: [36, 0, 0], text: 'Dor' },
          { at: [-36, 0, 0], text: 'Ben' },
        ],
        transverse: 'y',
        spot: [-8, 6, 0],
      };
    }
  }
}

// ---- geometry helpers -------------------------------------------------------

export function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export const poly = (pts: Pt[]) => (pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')}Z` : '');

/** Outline of an ellipsoid (or its upper/lower half) as seen by the oblique camera. */
export function silhouette(b: Blob, P: (v: V3) => Pt) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 14; i++) {
    const u = -Math.PI / 2 + (i / 14) * Math.PI;
    if (b.half && Math.sign(Math.sin(u)) === -b.half && Math.abs(Math.sin(u)) > 1e-6) continue;
    for (let j = 0; j < 24; j++) {
      const v = (j / 24) * Math.PI * 2;
      pts.push(P([b.c[0] + b.r[0] * Math.cos(u) * Math.cos(v), b.c[1] + b.r[1] * Math.sin(u), b.c[2] + b.r[2] * Math.cos(u) * Math.sin(v)]));
    }
  }
  return poly(hull(pts));
}

export type Axis = 0 | 1 | 2;
/** The ellipse an axis-aligned plane cuts from an ellipsoid (null when it misses it). */
function sectionOf(b: Blob, axis: Axis, at: number, P: (v: V3) => Pt) {
  const d = (at - b.c[axis]) / b.r[axis];
  if (Math.abs(d) >= 1) return null;
  const k = Math.sqrt(1 - d * d);
  const [a1, a2] = ([0, 1, 2] as Axis[]).filter((a) => a !== axis);
  const pts: Pt[] = [];
  for (let i = 0; i < 48; i++) {
    const v = (i / 48) * Math.PI * 2;
    const q: V3 = [...b.c] as V3;
    q[axis] = at;
    q[a1] = b.c[a1] + b.r[a1] * k * Math.cos(v);
    q[a2] = b.c[a2] + b.r[a2] * k * Math.sin(v);
    if (b.half && Math.sign(q[1] - b.c[1]) === -b.half) q[1] = b.c[1];
    pts.push(P(q));
  }
  return poly(pts);
}

function planeQuad(axis: Axis, at: number, ext: Model['ext'], P: (v: V3) => Pt) {
  const [a1, a2] = ([0, 1, 2] as Axis[]).filter((a) => a !== axis);
  const e = [ext.x, ext.y, ext.z];
  const corner = (s1: 0 | 1, s2: 0 | 1): Pt => {
    const q: V3 = [0, 0, 0];
    q[axis] = at;
    q[a1] = e[a1][s1];
    q[a2] = e[a2][s2];
    return P(q);
  };
  return poly([corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)]);
}

/** Axis and position of a plane in the model (null for views that are not cuts). */
export function cutOf(plane: PlaneKind, m: Model, level: number): { axis: Axis; at: number } | null {
  const lerp = (a: number, b: number) => a + (b - a) * level;
  if (plane === 'sagitala') return { axis: 2, at: 0 };
  if (plane === 'zeharkakoa') {
    if (m.box) return { axis: 2, at: 0 };
    return m.transverse === 'x' ? { axis: 0, at: lerp(m.ext.x[0] * 0.6, m.ext.x[1] * 0.6) } : { axis: 1, at: lerp(m.ext.y[1] * 0.6, m.ext.y[0] * 0.6) };
  }
  // Coronal: for the upright C body, the vertical plane across it through the trunk (the back's arc); for a flat embryo, parallel to its surface.
  if (plane === 'koronala') return m.tube ? { axis: 0, at: m.ext.x[1] * 0.5 } : m.transverse === 'y' && !m.box ? { axis: 2, at: 0 } : { axis: 1, at: m.spot[1] };
  return null;
}

export function Specimen({
  plane,
  week,
  day,
  level = 0.5,
  flip,
  prev,
  big,
  className = 'loc-svg',
}: {
  plane: PlaneKind;
  week: number;
  day: number;
  level?: number;
  /** Mirror left–right so the sketch faces the same way as the drawing. */
  flip?: boolean;
  /** The plane shown just before (drawn faint), when it was a cut of the same object. */
  prev?: PlaneKind | null;
  big?: boolean;
  className?: string;
}) {
  const shape = shapeFor(week, day, plane);
  const m = modelOf(shape, day);
  // Fit the plane's box (the largest thing drawn) to the 120×88 frame, centred.
  const raw = (v: V3): Pt => [(flip ? -v[0] : v[0]) + DX * v[2], -(v[1] + DY * v[2])];
  const corners = m.ext.x.flatMap((x) => m.ext.y.flatMap((y) => m.ext.z.map((z) => raw([x, y, z]))));
  const [x0, x1] = [Math.min(...corners.map((c) => c[0])), Math.max(...corners.map((c) => c[0]))];
  const [y0, y1] = [Math.min(...corners.map((c) => c[1])), Math.max(...corners.map((c) => c[1]))];
  const S = Math.min(112 / (x1 - x0), (big ? 76 : 84) / (y1 - y0));
  const ox = 60 - ((x0 + x1) / 2) * S;
  const oy = (big ? 46 : 44) - ((y0 + y1) / 2) * S;
  const P = (v: V3): Pt => {
    const [x, y] = raw(v);
    return [ox + x * S, oy + y * S];
  };
  const cut = cutOf(plane, m, level);
  const before = prev && prev !== plane ? cutOf(prev, m, level) : null;
  const Y = '#fbbf24';
  const faded = cut ? 0.55 : 1;

  // The swept C body: a thick stroke along its centre line; its cut is a disc where the plane meets it.
  const tubeD = m.tube ? `M${m.tube.pts.map((q) => P(q).map((n) => n.toFixed(1)).join(',')).join(' L')}` : '';
  const tubeCuts: string[] = [];
  if (m.tube && cut) {
    const w = m.tube.w / 2;
    if (cut.axis === 2) tubeCuts.push(tubeD);
    else {
      const pts = m.tube.pts;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1][cut.axis] - cut.at;
        const b = pts[i][cut.axis] - cut.at;
        if (a === 0 || a * b < 0) {
          const f = a / (a - b);
          const c: V3 = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f, 0];
          const blob: Blob = { c, r: [w, w, w], fill: '', stroke: '' };
          const s = sectionOf(blob, cut.axis, cut.at, P);
          if (s) tubeCuts.push(s);
        }
      }
    }
  }

  const eye = (at: V3, to: V3) => {
    const [ex, ey] = P(at);
    const [tx, ty] = P(to);
    return (
      <g className="loc-cut" stroke={Y} fill="none" strokeWidth={1.5}>
        <path d={`M${ex - 6} ${ey}q6-6 12 0q-6 6-12 0Z`} fill="rgba(15,15,17,0.8)" />
        <circle cx={ex} cy={ey} r={1.7} fill={Y} />
        <path d={`M${(ex + (tx - ex) * 0.22).toFixed(1)} ${(ey + (ty - ey) * 0.22).toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}`} strokeDasharray="2.5 2" markerEnd="url(#spec-arrow)" />
      </g>
    );
  };
  const top = m.ext.y[1];
  const t = { fontSize: big ? 6.5 : 0, fill: 'rgba(232,238,252,0.75)', fontFamily: 'var(--font-mono)' } as const;

  return (
    <svg viewBox="0 0 120 88" className={className} aria-hidden>
      <defs>
        <marker id="spec-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L6 3L0 6Z" fill={Y} />
        </marker>
      </defs>
      <g opacity={faded}>
        {m.box && (
          <>
            {(() => {
              const b = m.box;
              const c = (x: 0 | 1, y: 0 | 1, z: 0 | 1) => P([b.x[x], b.y[y], b.z[z]]);
              const faces = [
                [c(0, 1, 0), c(1, 1, 0), c(1, 1, 1), c(0, 1, 1)],
                [c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0)],
                [c(1, 0, 0), c(1, 0, 1), c(1, 1, 1), c(1, 1, 0)],
              ];
              return faces.map((f, i) => <path key={i} d={poly(f)} fill={b.fill} stroke={b.stroke} strokeWidth={0.8} />);
            })()}
          </>
        )}
        {m.blobs.map((b, i) => (
          <path key={i} d={silhouette(b, P)} fill={b.fill} stroke={b.stroke} strokeWidth={0.9} strokeDasharray={b.dash ? '3 2' : undefined} />
        ))}
        {m.tube && (
          <g>
            <path d={tubeD} fill="none" stroke={m.tube.stroke} strokeWidth={m.tube.w * S + 1.6} strokeLinecap="round" strokeLinejoin="round" />
            <path d={tubeD} fill="none" stroke="#2a3040" strokeWidth={m.tube.w * S} strokeLinecap="round" strokeLinejoin="round" />
            <path d={tubeD} fill="none" stroke={m.tube.fill} strokeWidth={m.tube.w * S} strokeLinecap="round" strokeLinejoin="round" />
            {m.tube.head && <path d={silhouette({ c: m.tube.head.c, r: [m.tube.head.r, m.tube.head.r, m.tube.head.r], fill: '', stroke: '' }, P)} fill="#3a4153" stroke={m.tube.stroke} strokeWidth={0.9} />}
          </g>
        )}
        {m.extra?.(P)}
      </g>

      {before && <path d={planeQuad(before.axis, before.at, m.ext, P)} fill="none" stroke="rgba(232,238,252,0.55)" strokeWidth={0.9} strokeDasharray="3 2.5" />}
      {cut && (
        <g className="loc-cut">
          <path d={planeQuad(cut.axis, cut.at, m.ext, P)} fill="rgba(251,191,36,0.16)" stroke={Y} strokeWidth={1.1} />
          {m.box && cut.axis === 2 && <path d={poly([P([m.box.x[0], m.box.y[0], 0]), P([m.box.x[1], m.box.y[0], 0]), P([m.box.x[1], m.box.y[1], 0]), P([m.box.x[0], m.box.y[1], 0])])} fill="rgba(240,195,204,0.35)" stroke="#e4a3b2" strokeWidth={0.8} />}
          {m.blobs
            .filter((b) => !b.ghost)
            .map((b, i) => {
              const d = sectionOf(b, cut.axis, cut.at, P);
              // The cut face is more opaque than the outside view, but a thin wall (amnion) stays see-through.
              const fill = b.fill.replace(/([\d.]+)\)$/, (_, al: string) => `${Math.min(0.9, Number(al) * 2.5 + 0.15).toFixed(2)})`);
              return d ? <path key={i} d={d} fill={fill} stroke={b.stroke} strokeWidth={1.1} /> : null;
            })}
          {tubeCuts.map((d, i) =>
            cut.axis === 2 ? (
              <path key={i} d={d} fill="none" stroke={Y} strokeWidth={m.tube!.w * S * 0.5} strokeLinecap="round" opacity={0.7} />
            ) : (
              <path key={i} d={d} fill="rgba(232,238,252,0.75)" stroke={Y} strokeWidth={1} />
            ),
          )}
        </g>
      )}
      {plane === 'dortsala' && (m.tube ? eye([m.ext.x[1] - 2, 10, 0], [18, 4, 0]) : eye([m.spot[0], top - 3, 0], [m.spot[0], m.spot[1] + 4, 0]))}
      {plane === 'kanpokoa' && eye([m.ext.x[0] + 6, -8, m.ext.z[0]], [-8, 0, -6])}
      {plane === 'xehetasuna' && (
        <g className="loc-cut" stroke={Y} fill="none" strokeWidth={1.6}>
          <circle cx={P(m.spot)[0]} cy={P(m.spot)[1]} r={8} />
          <path d={`M${P(m.spot)[0] + 6} ${P(m.spot)[1] + 6}l7 7`} strokeLinecap="round" />
        </g>
      )}
      {big &&
        m.tags.map((g) => {
          const [x, y] = P(g.at);
          return (
            <text key={g.text} x={x} y={y + 2} textAnchor="middle" {...t}>
              {g.text}
            </text>
          );
        })}
    </svg>
  );
}
