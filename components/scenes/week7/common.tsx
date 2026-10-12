'use client';

import { C, Part, clamp, lerp, seg, type Pt } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';

/**
 * Shared language of topic 7 (gorputzaren barrunbeak). Every view uses the same tints for the same
 * cavity, so a student recognises a cavity by its colour from the folded disc to the adult diaphragm:
 * undivided coelom violet, (primitive) pericardial rose, pleural blue, peritoneal green. The four
 * components of the diaphragm keep their colour from the moment they appear until the adult muscle.
 */
export const P = {
  /** Open space (dark) under every cavity tint. */
  space: '#140e18',
  coelom: 'rgba(170,120,255,0.20)',
  peri: 'rgba(255,120,150,0.24)',
  pleura: 'rgba(110,180,255,0.24)',
  perito: 'rgba(120,220,140,0.20)',
  canal: 'rgba(127,200,232,0.30)',
  /** The same cavities as solid key colours (legend swatches, strong fills, edges). */
  coelomSolid: '#a77cff',
  coelomEdge: '#cdb4ff',
  periSolid: '#ff7d9c',
  pleuraSolid: '#6fb6ff',
  peritoSolid: '#7bdc8e',
  skin: C.surfaceEcto,
  wall: '#5a3644',
  wallDeep: '#46293a',
  mesench: '#6b2f3f',
  septum: '#f2a65a',
  septumDeep: '#c97a34',
  ppMem: '#e58bd0',
  poMem: '#b57cf0',
  eso: '#5ec2b0',
  bodyMuscle: '#c06c94',
  nerve: '#fde047',
  aorta: '#d8203a',
  ivc: '#3b6fd8',
  heart: '#c62d42',
  heartDeep: '#8e1b2e',
  lung: '#f4a6b8',
  lungDeep: '#d97a93',
  gut: C.endoderm,
  serosa: '#ffb3a1',
  neural: C.neural,
  bone: '#e8e1cf',
} as const;

export const f1 = (v: number) => v.toFixed(1);

/** Visible from a (fading in) until b (fading out). */
export const vis = (t: number, a: number, b = 2, d = 0.03) => Math.min(a <= 0 ? 1 : seg(t, a, a + d), 1 - seg(t, b - d, b));

export const sm = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};

export const poly = (pts: readonly Pt[], closed = true) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}${closed ? 'Z' : ''}`;

/** Points on an ellipse arc, degrees (0 = right, 90 = down), a0 → a1 inclusive. */
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

export const mirror = (p: Pt, cx = 500): Pt => [2 * cx - p[0], p[1]];

/** Catmull-Rom through key points (open), `per` samples per span. */
export function spline(keys: readonly Pt[], per = 8, closed = false): Pt[] {
  const k = keys.filter((q, i) => i === 0 || Math.hypot(q[0] - keys[i - 1][0], q[1] - keys[i - 1][1]) > 0.5);
  const n = k.length;
  if (n < 3) return [...k];
  const at = (i: number) => (closed ? k[(i + n) % n] : k[Math.max(0, Math.min(n - 1, i))]);
  const out: Pt[] = [];
  const spans = closed ? n : n - 1;
  for (let i = 0; i < spans; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
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
  if (!closed) out.push(k[n - 1]);
  return out;
}

/** Unit normals of a polyline (left of the direction of travel in screen coordinates: (dy, −dx)). */
export function normals(pts: readonly Pt[], closed = false): Pt[] {
  const n = pts.length;
  return pts.map((_, i) => {
    const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    const b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [dy / l, -dx / l];
  });
}

/** The polyline moved by d along its normals (d may vary along it). */
export function offset(pts: readonly Pt[], d: number | ((i: number) => number), closed = false): Pt[] {
  const ns = normals(pts, closed);
  return pts.map((p, i) => {
    const k = typeof d === 'number' ? d : d(i);
    return [p[0] + ns[i][0] * k, p[1] + ns[i][1] * k];
  });
}

/** Length of a polyline. */
export function length(pts: readonly Pt[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

/** Same polyline, resampled to n points evenly along its length. */
export function resample(pts: readonly Pt[], n: number): Pt[] {
  if (pts.length < 2) return Array.from({ length: n }, () => pts[0] ?? [0, 0]);
  const L = length(pts);
  const out: Pt[] = [];
  let i = 0;
  let acc = 0;
  for (let j = 0; j < n; j++) {
    const want = (L * j) / (n - 1);
    while (i < pts.length - 2 && acc + Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) < want) {
      acc += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      i++;
    }
    const seg = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 1;
    const r = clamp((want - acc) / seg);
    out.push([lerp(pts[i][0], pts[i + 1][0], r), lerp(pts[i][1], pts[i + 1][1], r)]);
  }
  return out;
}

/** Point a fraction u along a polyline. */
export function along(pts: readonly Pt[], u: number): Pt {
  return resample(pts, 201)[Math.round(clamp(u) * 200)];
}

/** Morph two point lists of possibly different length (both resampled to n). */
export function morph(a: readonly Pt[], b: readonly Pt[], k: number, n = 64): Pt[] {
  const ra = resample(a, n);
  const rb = resample(b, n);
  return ra.map((p, i) => [lerp(p[0], rb[i][0], k), lerp(p[1], rb[i][1], k)]);
}

/** A thin serous sheet (mesothelium) along a line: one row of flat cells of thickness d, on the line's left (d > 0) or right. */
export function Serosa({ pts, d, color = P.serosa, seed = 1, cell = 11, opacity = 1 }: { pts: readonly Pt[]; d: number; color?: string; seed?: number; cell?: number; opacity?: number }) {
  if (pts.length < 2 || opacity <= 0.01) return null;
  const inner = offset(pts, d);
  const n = Math.max(2, Math.round(length(pts) / cell));
  return <Cells outer={[...pts]} inner={inner} n={n} fill={color} nucleus="rgba(120,40,40,0.55)" edge="rgba(90,30,40,0.35)" seed={seed} opacity={opacity} />;
}

/** A cell sheet between two lines (outer and inner of the same length in samples). */
export function Sheet({ outer, inner, color, nucleus = 'rgba(40,20,40,0.55)', cell = 10, seed = 1, pseudo, opacity = 1 }: { outer: readonly Pt[]; inner: readonly Pt[]; color: string; nucleus?: string; cell?: number; seed?: number; pseudo?: boolean; opacity?: number }) {
  if (outer.length < 2 || opacity <= 0.01) return null;
  const n = Math.max(2, Math.round(length(outer) / cell));
  return <Cells outer={[...outer]} inner={[...inner]} n={n} fill={color} nucleus={nucleus} seed={seed} pseudo={pseudo} opacity={opacity} />;
}

/** Shared gradients of topic 7 (light from the top left, soft cavity glow). */
export function Defs7() {
  return (
    <defs>
      <linearGradient id="w7-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.12} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.22} />
      </linearGradient>
      <radialGradient id="w7-vignette" cx="50%" cy="48%" r="64%">
        <stop offset="58%" stopColor="#0f0f11" stopOpacity={0} />
        <stop offset="100%" stopColor="#0f0f11" stopOpacity={0.9} />
      </radialGradient>
      <pattern id="w7-mesench" width="22" height="20" patternUnits="userSpaceOnUse">
        <g fill="rgba(255,190,200,0.16)" stroke="rgba(255,190,200,0.12)" strokeWidth={0.8}>
          <circle cx="5" cy="5" r="1.5" />
          <path d="M5 5l-4-2M5 5l3-4M5 5l4 2" />
          <circle cx="16" cy="14" r="1.5" />
          <path d="M16 14l-4-1M16 14l2-4M16 14l3 3" />
        </g>
      </pattern>
      <pattern id="w7-muscle" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
        <path d="M0 2h9M0 6.5h9" stroke="rgba(255,255,255,0.16)" strokeWidth={1.1} />
      </pattern>
      <pattern id="w7-tendon" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <path d="M0 3h12M0 9h12" stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />
      </pattern>
      <pattern id="w7-lung" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.2" fill="rgba(140,40,70,0.28)" />
        <circle cx="11" cy="10" r="2" fill="rgba(140,40,70,0.24)" />
      </pattern>
    </defs>
  );
}

/** The rows of topic 7's colour key: each cavity (and the septum) with the one colour it has in every view. */
export const KEY7 = {
  zeloma: { id: 'enbrioi-barruko-zeloma', color: P.coelomSolid, text: 'zeloma' },
  hperi: { id: 'hasierako-perikardio-barrunbea', color: P.periSolid, text: 'hasierako perikardioa' },
  peri: { id: 'perikardio-barrunbea', color: P.periSolid, text: 'perikardioa' },
  pleura: { id: 'pleura-barrunbea', color: P.pleuraSolid, text: 'pleura' },
  canal: { id: 'erreten-perikardioperitonealak', color: '#7fc8e8', text: 'erretenak' },
  perito: { id: 'peritoneo-barrunbea', color: P.peritoSolid, text: 'peritoneoa' },
  septum: { id: 'septum-transversum', color: P.septum, text: 'septuma' },
} as const;
export type KeyRow = (typeof KEY7)[keyof typeof KEY7];

/**
 * Topic 7's colour key, the same in every view: one row across the top left, a swatch and a name per
 * cavity. Each row is the cavity itself (resting on it names and lights it in the drawing); `quiet`
 * draws the rows without that (a view whose parts carry other ids).
 */
export function CavityKey({ rows, x = 24, y = 22, show = 1, quiet }: { rows: (KeyRow | false | null | undefined)[]; x?: number; y?: number; show?: number; quiet?: boolean }) {
  if (show <= 0.02) return null;
  const live = rows.filter((r): r is KeyRow => !!r);
  const items = live.map((r, i) => ({ r, x: x + live.slice(0, i).reduce((w, q) => w + 26 + q.text.length * 6.9, 0) }));
  return (
    <g data-key opacity={show} fontSize={12.5} fontWeight={600} fill="rgba(244,247,255,0.95)" style={{ paintOrder: 'stroke' }} stroke="rgba(11,12,15,0.9)" strokeWidth={3}>
      {items.map(({ r, x: rx }) => {
        const row = (
          <g transform={`translate(${f1(rx)} ${y})`}>
            <rect x={-3} y={-10} width={22 + r.text.length * 6.9} height={20} fill="transparent" stroke="none" />
            <rect x={0} y={-6} width={14} height={12} rx={3} fill={r.color} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
            <text x={20} y={4.5}>
              {r.text}
            </text>
          </g>
        );
        return quiet ? (
          <g key={r.text} pointerEvents="none">
            {row}
          </g>
        ) : (
          <Part key={r.text} id={r.id}>
            {row}
          </Part>
        );
      })}
    </g>
  );
}
