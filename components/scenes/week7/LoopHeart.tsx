'use client';

import { useId } from 'react';
import { lerp, smoothPath, type Pt } from '@/components/kit';
import { P, offset, spline } from './common';

/**
 * The looping heart of topic 7's side views (sinus venosus → atrium → ventricle → bulbus → truncus →
 * aortic sac), centred on HEART_C; each view places it with a transform. With the tube helpers it is
 * built from.
 */

export const cum = (pts: readonly Pt[]) => {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = out[out.length - 1] || 1;
  return out.map((v) => v / L);
};
/** Piecewise-linear lookup in a sorted [u, value] table. */
export function table(u: number, tab: readonly [number, number][]) {
  if (u <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++)
    if (u <= tab[i][0]) {
      const [a, va] = tab[i - 1];
      const [b, vb] = tab[i];
      return lerp(va, vb, (u - a) / (b - a || 1));
    }
  return tab[tab.length - 1][1];
}

/** A closed tube round a centre line, half-width per sample, with round caps. */
function tubePts(pts: readonly Pt[], hw: readonly number[], caps = true): Pt[] {
  const a = offset(pts, (i) => hw[i]);
  const b = offset(pts, (i) => -hw[i]);
  if (!caps) return [...a, ...b.reverse()];
  const cap = (p: Pt, q: Pt, r: number, from: Pt): Pt[] => {
    // Half circle round p, away from q, starting at `from`.
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
    const ux = (p[0] - q[0]) / d;
    const uy = (p[1] - q[1]) / d;
    const a0 = Math.atan2(from[1] - p[1], from[0] - p[0]);
    const cross = (from[0] - p[0]) * uy - (from[1] - p[1]) * ux;
    const dir = cross > 0 ? -1 : 1;
    return Array.from({ length: 7 }, (_, k) => {
      const ang = a0 + (dir * Math.PI * (k + 1)) / 8;
      return [p[0] + Math.cos(ang) * r, p[1] + Math.sin(ang) * r] as Pt;
    });
  };
  const n = pts.length - 1;
  const end = cap(pts[n], pts[n - 1], hw[n], a[n]);
  const start = cap(pts[0], pts[1], hw[0], b[0]);
  return [...a, ...end, ...b.reverse(), ...start];
}
export const tubeD = (pts: readonly Pt[], hw: readonly number[], caps = true) => smoothPath(tubePts(pts, hw, caps), true, 0.3);

// ——— Heart: sinus venosus (in the septum) → atrium → ventricle (ventral loop) → bulbus → truncus → aortic sac. ———
const HEART = spline([[606, 334], [588, 312], [562, 294], [532, 290], [506, 306], [486, 330], [462, 350], [430, 350], [408, 330], [402, 298], [418, 270], [452, 254], [490, 246]], 8);
const HEART_U = cum(HEART);
const HEART_HW = HEART_U.map((u) => table(u, [[0, 9], [0.12, 12], [0.22, 15], [0.32, 14], [0.4, 11], [0.5, 16], [0.6, 18], [0.7, 16], [0.8, 13], [0.9, 9], [1, 11]]));
const HEART_C: Pt = [500, 312];
/** The chambers swell out of the tube: atrium (dorsal, cranial), ventricle (ventral, caudal). */
const ATRIUM = { cx: 546, cy: 290, rx: 38, ry: 25, rot: -12 };
const VENTRICLE = { cx: 444, cy: 338, rx: 44, ry: 28, rot: 14 };

const HEART_D = tubeD(HEART, HEART_HW);
const HEART_LUMEN_D = tubeD(HEART, HEART_HW.map((h) => Math.max(2, h - 6)));
const HEART_PATH = smoothPath(HEART, false, 0.3);
/** Where the sinus venosus enters the septum, and the ventricle's centre (for names), in the heart's own frame. */
export const HEART_SINUS: Pt = HEART[0];
export const HEART_VENT: Pt = [VENTRICLE.cx, VENTRICLE.cy];
export { HEART_C };

/** The looping heart of the sagittal drawings, centred on HEART_C; other views place it with a transform. */
export function LoopHeart({ beating }: { beating: boolean }) {
  const cid = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <radialGradient id={`w7-lh-heart${cid}`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f06a7e" />
          <stop offset="0.55" stopColor="#c62d42" />
          <stop offset="1" stopColor="#7d1527" />
        </radialGradient>
        <radialGradient id={`w7-lh-atrium${cid}`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#d9546a" />
          <stop offset="1" stopColor="#6e1222" />
        </radialGradient>
      </defs>
      <g transform={`translate(${HEART_C[0]} ${HEART_C[1]})`}>
        <g>
          {beating && <animateTransform attributeName="transform" type="scale" values="1;1.045;0.985;1" keyTimes="0;0.18;0.45;1" dur="0.9s" repeatCount="indefinite" />}
          <g transform={`translate(${-HEART_C[0]} ${-HEART_C[1]})`}>
            {/* Outline pass, then fill pass: tube and chambers read as one muscular wall. */}
            <g fill={P.heartDeep} stroke={P.heartDeep} strokeWidth={3}>
              <path d={HEART_D} />
              <ellipse cx={ATRIUM.cx} cy={ATRIUM.cy} rx={ATRIUM.rx} ry={ATRIUM.ry} transform={`rotate(${ATRIUM.rot} ${ATRIUM.cx} ${ATRIUM.cy})`} />
              <ellipse cx={VENTRICLE.cx} cy={VENTRICLE.cy} rx={VENTRICLE.rx} ry={VENTRICLE.ry} transform={`rotate(${VENTRICLE.rot} ${VENTRICLE.cx} ${VENTRICLE.cy})`} />
            </g>
            <ellipse cx={ATRIUM.cx} cy={ATRIUM.cy} rx={ATRIUM.rx} ry={ATRIUM.ry} transform={`rotate(${ATRIUM.rot} ${ATRIUM.cx} ${ATRIUM.cy})`} fill={`url(#w7-lh-atrium${cid})`} />
            <path d={HEART_D} fill={`url(#w7-lh-heart${cid})`} />
            <ellipse cx={VENTRICLE.cx} cy={VENTRICLE.cy} rx={VENTRICLE.rx} ry={VENTRICLE.ry} transform={`rotate(${VENTRICLE.rot} ${VENTRICLE.cx} ${VENTRICLE.cy})`} fill={`url(#w7-lh-heart${cid})`} />
            {/* Lumen (blood) inside each piece. */}
            <g fill="#4a0a16" opacity={0.5}>
              <path d={HEART_LUMEN_D} />
              <ellipse cx={ATRIUM.cx} cy={ATRIUM.cy} rx={ATRIUM.rx - 9} ry={ATRIUM.ry - 8} transform={`rotate(${ATRIUM.rot} ${ATRIUM.cx} ${ATRIUM.cy})`} />
              <ellipse cx={VENTRICLE.cx} cy={VENTRICLE.cy} rx={VENTRICLE.rx - 11} ry={VENTRICLE.ry - 10} transform={`rotate(${VENTRICLE.rot} ${VENTRICLE.cx} ${VENTRICLE.cy})`} />
            </g>
            {/* Trabeculae in the ventricle wall. */}
            <g stroke="#e8586e" strokeWidth={1.2} opacity={0.45} strokeLinecap="round">
              {[-28, -16, -4, 8, 20, 30].map((d, k) => (
                <line key={k} x1={VENTRICLE.cx + d} y1={VENTRICLE.cy + 12 - Math.abs(d) * 0.15} x2={VENTRICLE.cx + d * 1.08} y2={VENTRICLE.cy + 22 - Math.abs(d) * 0.3} />
              ))}
            </g>
            <path d={smoothPath(offset(HEART, (i) => HEART_HW[i] * 0.55), false, 0.3)} fill="none" stroke="#ffd0d6" strokeWidth={1.6} opacity={0.35} strokeLinecap="round" />
            {beating &&
              [0, 1, 2, 3, 4].map((k) => (
                <circle key={k} r={2.6} fill="#ff9aa8" opacity={0.85}>
                  <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${(-k * 0.36).toFixed(2)}s`} path={HEART_PATH} />
                </circle>
              ))}
          </g>
        </g>
      </g>
    </g>
  );
}
