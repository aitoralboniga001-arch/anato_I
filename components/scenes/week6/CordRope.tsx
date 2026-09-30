'use client';

import { C, polyline, smoothPath, tube, type Pt } from '@/components/kit';

const f1 = (v: number) => v.toFixed(1);

/** Dense Catmull-Rom samples through the key points (so the tube's normals turn smoothly). */
function spline(keys: Pt[], per = 14): Pt[] {
  const out: Pt[] = [];
  const get = (i: number) => keys[Math.max(0, Math.min(keys.length - 1, i))];
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let j = 0; j < per; j++) {
      const u = j / per;
      const u2 = u * u;
      const u3 = u2 * u;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(keys[keys.length - 1]);
  return out;
}

/**
 * The umbilical cord as a soft rope from the fetus (first point) to the placenta (last point): a
 * tube of width `w` that flares slightly at its placental insertion, with the two arteries and the
 * vein coiling round each other along it (the cord's typical helix).
 */
export function CordRope({ pts, w, turns = 7, opacity = 1 }: { pts: Pt[]; w: number; turns?: number; opacity?: number }) {
  const c = polyline(spline(pts));
  const hw = (u: number) => (w / 2) * (1 + 0.6 * Math.max(0, (u - 0.9) / 0.1) ** 2);
  const T = tube(c, hw, 0, 1, 80);
  const N = 140;
  const vessel = (phase: number) =>
    smoothPath(
      Array.from({ length: N + 1 }, (_, i) => {
        const u = 0.01 + (0.97 * i) / N;
        const s = c(u);
        const o = (w / 2) * 0.48 * Math.sin(2 * Math.PI * turns * u + phase);
        return [s.x + s.nx * o, s.y + s.ny * o] as Pt;
      }),
      false,
    );
  return (
    <g opacity={opacity}>
      <path d={T.d} fill="#e2b3c3" />
      <path d={vessel(Math.PI)} fill="none" stroke={C.vein} strokeWidth={f1(w * 0.26)} strokeLinecap="round" opacity={0.85} />
      {[0, Math.PI * 0.5].map((ph) => (
        <path key={ph} d={vessel(ph)} fill="none" stroke={C.artery} strokeWidth={f1(w * 0.17)} strokeLinecap="round" opacity={0.85} />
      ))}
      {/* Wharton's jelly sheen over the vessels, then the amnion-covered surface */}
      <path d={T.d} fill="#f6e3ea" opacity={0.28} />
      <g fill="none" stroke="#9c4a6d" strokeWidth={0.9} opacity={0.8}>
        <path d={T.left} />
        <path d={T.right} />
      </g>
    </g>
  );
}
