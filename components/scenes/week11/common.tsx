'use client';

import { lerp, rand, smoothPath, type Pt } from '@/components/kit';
import { T } from '@/components/scenes/week10/common';
import { f1 } from '@/components/scenes/week7/common';

export { arc, along, f1, length, mirror, morph, normals, offset, poly, resample, sm, spline, vis } from '@/components/scenes/week7/common';
export { Steps } from '@/components/scenes/week9/common';

/**
 * Shared language of topic 11 (bihotzaren trenkadak). It continues topic 10 exactly:
 * - each heart-tube segment keeps its colour in what it becomes (T from week10/common): zain sinua violet
 *   (eskuineko aurikularen atal lisoa), atal aurikularra orange (atal trabekulatuak, belarritxoak), atal
 *   bentrikularra cyan (ezkerreko bentrikuluaren atal trabekulatua), hurbileko atala green (eskuineko
 *   bentrikuluarena), arteria konoa lime (infundibuluak), enbor arteriosoa ivory (aorta eta birika enborra);
 * - blood by its oxygen: oxygenated red, poorly oxygenated blue; mixing = red and blue cells side by side;
 * - every endocardial cushion and what it builds (AV septum, conal and aorticopulmonary septa, the
 *   membranous interventricular septum, valve leaflets) is the topic 10 cardiac-jelly mint with a thin
 *   endocardium-pink rim, because the notes define a cushion as extracellular matrix covered by endocardium;
 * - the muscular interventricular septum is two-tone (green | cyan): both ventricles' walls build it;
 * - septum primum is a pale cream membrane (thin, it becomes the flap); septum secundum rose and thick.
 */
export const K = {
  ...T,
  lumen: '#1b0d13',
  lumenEdge: '#3a1622',
  cushion: '#a9e4dc',
  cushionDeep: '#3d8f84',
  cushionRim: '#f9a8d4',
  primum: '#f4ecd8',
  primumDeep: '#a8926a',
  secundum: '#ec8fbf',
  secundumDeep: '#93356a',
  chord: '#f1efe6',
  epi: '#f3b5c4',
  smoothRA: T.sinus,
  smoothDeep: T.sinusDeep,
  pulmV: '#e5484d',
  ink: '#e8eefc',
} as const;

/** Gradients and textures of topic 11 (light from the top left, as in topics 1–10). */
export function Defs11() {
  return (
    <defs>
      <linearGradient id="w11-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.2} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.3} />
      </linearGradient>
      {/* The inside of a chamber opened towards the viewer: its walls darken as they recede to the back. */}
      <radialGradient id="w11-recess" cx="50%" cy="48%" r="58%">
        <stop offset="0.55" stopColor="#000" stopOpacity={0.55} />
        <stop offset="0.8" stopColor="#000" stopOpacity={0.25} />
        <stop offset="1" stopColor="#000" stopOpacity={0} />
      </radialGradient>
      {/* An opening between two cavities: a soft passage, a little warmer than the lumen around it. */}
      <radialGradient id="w11-gap">
        <stop offset="0" stopColor="#4a1d30" stopOpacity={0.95} />
        <stop offset="0.7" stopColor="#35142a" stopOpacity={0.7} />
        <stop offset="1" stopColor="#22101a" stopOpacity={0.15} />
      </radialGradient>
      <radialGradient id="w11-lumen" cx="50%" cy="45%" r="65%">
        <stop offset="0" stopColor="#2a1119" />
        <stop offset="1" stopColor="#12070c" />
      </radialGradient>
      <linearGradient id="w11-tubeH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity={0.35} />
        <stop offset="0.3" stopColor="#fff" stopOpacity={0.22} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.4} />
      </linearGradient>
      {/* Cut myocardium: fine wavy fibres. */}
      <pattern id="w11-myo" width="14" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
        <path d="M0 3q3.5-2 7 0t7 0" stroke="rgba(255,255,255,0.22)" fill="none" strokeWidth={0.9} />
        <path d="M0 8q3.5-2 7 0t7 0" stroke="rgba(0,0,0,0.22)" fill="none" strokeWidth={0.8} />
        <circle cx="4" cy="5.5" r="0.9" fill="rgba(20,10,30,0.35)" />
      </pattern>
      {/* Endocardial cushion: matrix with scattered mesenchymal cells (cardiac jelly of topic 10). */}
      <pattern id="w11-jelly" width="16" height="15" patternUnits="userSpaceOnUse">
        <g fill="rgba(20,90,80,0.42)" stroke="rgba(20,90,80,0.3)" strokeWidth={0.7}>
          <circle cx="4" cy="4" r="1.3" />
          <path d="M4 4l-3-1.5M4 4l2-3M4 4l3 1.6" />
          <circle cx="12" cy="11" r="1.2" />
          <path d="M12 11l-3-1M12 11l1.5-3M12 11l2.5 2" />
        </g>
      </pattern>
      {/* Thin atrial wall and septum secundum: muscle. */}
      <pattern id="w11-atrial" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <path d="M0 2.5h9M0 7h9" stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
        <ellipse cx="4.5" cy="4.8" rx="1.3" ry="0.8" fill="rgba(60,20,0,0.35)" />
      </pattern>
      {/* Septum primum: a thin membrane. */}
      <pattern id="w11-membrane" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(70)">
        <path d="M0 5h10" stroke="rgba(120,90,40,0.25)" strokeWidth={0.7} />
      </pattern>
      <filter id="w11-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>
  );
}

/** Points along a polyline at arc-length fraction u (0..1). */
export function at(pts: readonly Pt[], u: number): Pt {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const want = Math.min(1, Math.max(0, u)) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < want) i++;
  const k = (want - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
}

/**
 * Blood cells carried along a path, as a pure function of t (a still frame shows where the blood is).
 * `colors` cycles per cell: one colour = one kind of blood; red and blue together = mixed blood.
 */
export function Cells({ pts, t, n = 10, speed = 5, colors, r = 3.4, show = 1, seed = 1 }: { pts: readonly Pt[]; t: number; n?: number; speed?: number; colors: readonly string[]; r?: number; show?: number; seed?: number }) {
  if (show <= 0.01 || pts.length < 2) return null;
  return (
    <g opacity={show} pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const u = ((((i + rand(seed + i * 7) * 0.5) / n + t * speed) % 1) + 1) % 1;
        const p = at(pts, u);
        const q = at(pts, Math.min(1, u + 0.01));
        const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
        const o = Math.min(1, u * 7, (1 - u) * 7);
        const c = colors[i % colors.length];
        return (
          <g key={i} transform={`translate(${f1(p[0])} ${f1(p[1])}) rotate(${f1(ang)})`} opacity={o}>
            <ellipse rx={r * 1.25} ry={r * 0.85} fill={c} stroke="rgba(0,0,0,0.55)" strokeWidth={0.7} />
            <ellipse rx={r * 0.5} ry={r * 0.3} fill="rgba(0,0,0,0.22)" />
          </g>
        );
      })}
    </g>
  );
}

/** A tissue shape: base colour, a texture, the shared light, and an edge. Pure drawing. */
export function Tissue({ d, fill, deep, pattern, light = true, width = 1.2, opacity = 1 }: { d: string; fill: string; deep: string; pattern?: string; light?: boolean; width?: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill={fill} />
      {pattern && <path d={d} fill={`url(#${pattern})`} />}
      {light && <path d={d} fill="url(#w11-light)" />}
      <path d={d} fill="none" stroke={deep} strokeWidth={width} strokeLinejoin="round" />
    </g>
  );
}

/** A cushion (or what it builds): mint matrix, its cells, the light and a thin endocardial rim. */
export function Cushion({ d, opacity = 1 }: { d: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill={K.cushion} />
      <path d={d} fill="url(#w11-jelly)" />
      <path d={d} fill="url(#w11-light)" />
      <path d={d} fill="none" stroke={K.cushionRim} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={K.cushionDeep} strokeWidth={0.6} strokeLinejoin="round" />
    </g>
  );
}

/** A closed smooth outline through key points (tension as the kit's smoothPath). */
export const blob = (pts: readonly Pt[], tension = 0.5) => smoothPath(pts, true, tension);
/** An open smooth curve through key points. */
export const curve = (pts: readonly Pt[], tension = 0.5) => smoothPath(pts, false, tension);

/**
 * Trabeculae along an inner wall (from `pts`, pointing towards `inward`), in wall colour: rounded muscle
 * columns of uneven length, some joined near their tips, so the wall reads as a sponge, not a comb.
 */
export function Trabeculae({ pts, inward, fill, deep, n, len, seed = 1, show = 1 }: { pts: readonly Pt[]; inward: Pt; fill: string; deep: string; n: number; len: number; seed?: number; show?: number }) {
  if (show <= 0.01) return null;
  const cols = Array.from({ length: n }, (_, i) => {
    const p = at(pts, (i + 0.25 + 0.5 * rand(seed + i * 7)) / n);
    const dx = inward[0] - p[0];
    const dy = inward[1] - p[1];
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const l = len * show * (0.45 + 0.85 * rand(seed + i * 3));
    const w = 3.4 + 3 * rand(seed + i * 5);
    const bend = (rand(seed + i * 11) - 0.5) * 0.5;
    const nx = -uy;
    const ny = ux;
    const tip: Pt = [p[0] + ux * l + nx * l * bend, p[1] + uy * l + ny * l * bend];
    const m: Pt = [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2];
    // Wide foot on the wall, a waist, a rounded head.
    const path = `M${f1(p[0] + nx * w * 1.5)},${f1(p[1] + ny * w * 1.5)}C${f1(m[0] + nx * w * 0.5)},${f1(m[1] + ny * w * 0.5)} ${f1(tip[0] + nx * w * 0.9 - ux * 2)},${f1(tip[1] + ny * w * 0.9 - uy * 2)} ${f1(tip[0] + nx * w * 0.6)},${f1(tip[1] + ny * w * 0.6)}Q${f1(tip[0] + ux * w * 0.9)},${f1(tip[1] + uy * w * 0.9)} ${f1(tip[0] - nx * w * 0.6)},${f1(tip[1] - ny * w * 0.6)}C${f1(tip[0] - nx * w * 0.9 - ux * 2)},${f1(tip[1] - ny * w * 0.9 - uy * 2)} ${f1(m[0] - nx * w * 0.5)},${f1(m[1] - ny * w * 0.5)} ${f1(p[0] - nx * w * 1.5)},${f1(p[1] - ny * w * 1.5)}Z`;
    return { path, tip, w, l };
  });
  return (
    <g>
      {cols.map((c, i) => (
        <path key={i} d={c.path} fill={fill} stroke={deep} strokeWidth={0.8} strokeLinejoin="round" />
      ))}
      {/* Bridges between neighbours that both reach far: the trabecular network. */}
      {cols.slice(0, -1).map((c, i) => {
        const nb = cols[i + 1];
        if (rand(seed + i * 13) < 0.55 || Math.min(c.l, nb.l) < len * show * 0.6) return null;
        return <path key={`b${i}`} d={`M${f1(c.tip[0])},${f1(c.tip[1])}Q${f1((c.tip[0] + nb.tip[0]) / 2)},${f1((c.tip[1] + nb.tip[1]) / 2 + 3)} ${f1(nb.tip[0])},${f1(nb.tip[1])}`} fill="none" stroke={fill} strokeWidth={Math.min(c.w, nb.w) * 0.8} strokeLinecap="round" />;
      })}
      {cols.map((c, i) => (
        <path key={`l${i}`} d={c.path} fill="url(#w11-light)" opacity={0.7} pointerEvents="none" />
      ))}
    </g>
  );
}
