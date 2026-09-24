/** Timing helpers. Every scene value is derived from the stage progress `t` (0..1). */

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k * k;

/**
 * Progress of a sub-interval: 0 before `a`, 1 after `b`, eased in between.
 * `seg(t, .2, .5)` is the workhorse for "this happens between 20% and 50% of the stage".
 */
export const seg = (t: number, a: number, b: number, ease: (k: number) => number = easeInOut) =>
  ease(clamp((t - a) / (b - a)));

/** Linear version of `seg`, for counts and positions that must advance steadily. */
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/** Fade in over [a, a+d] and optionally out over [b-d, b]. */
export const fade = (t: number, a: number, b = Infinity, d = 0.06) =>
  Math.min(seg(t, a, a + d), b === Infinity ? 1 : 1 - seg(t, b - d, b));

/** Interpolate two [x, y] points. */
export const lerpPt = (p: readonly [number, number], q: readonly [number, number], k: number): [number, number] => [
  lerp(p[0], q[0], k),
  lerp(p[1], q[1], k),
];

/** Interpolate two point lists of equal length (for morphing outlines). */
export const lerpPts = (a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[], k: number) =>
  a.map((p, i) => lerpPt(p, b[i], k));

const hex = (c: string) => {
  const h = c.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mix two hex colours. */
export const mix = (c1: string, c2: string, k: number) => {
  const a = hex(c1);
  const b = hex(c2);
  const m = a.map((v, i) => Math.round(lerp(v, b[i], clamp(k))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

/** Deterministic pseudo-random in [0,1) so scattered cells never jump between renders. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
