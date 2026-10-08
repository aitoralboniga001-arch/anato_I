'use client';

import { Arrow, C, Journey, Label, Mark, Note, Part, clamp, lerp, polyline, rand, seg, tube, type SceneProps } from '@/components/kit';
import { useId, type ReactNode } from 'react';
import { Cells } from '@/components/scenes/section/Section';

/**
 * Realistic mid-sagittal section of the cephalocaudal fold (notes fig. 12 = Langman A–D; cranial
 * left, dorsal up). The embryo is built in "body coordinates" (σ along the neural axis, d depth
 * toward ventral) and bent by integrating a curvature that grows with the fold; the neural tube's
 * growth at both ends drives the curl (notes: the CNS's longitudinal growth causes the fold).
 *
 * Head and tail regions beyond the two membranes are modelled as "flaps" hinged at the membranes:
 * at t=0 they lie flat (cardiogenic area + pericardial coelom cranially; connecting stalk region
 * caudally) and rotate ~180° ventrally, so the heart tube and pericardial cavity end up ventral to
 * the foregut, the buccopharyngeal membrane faces the stomodeum, and the allantois + stalk move
 * to the ventral side. The endoderm is one continuous loop (gut + yolk sac), so the portals move
 * toward each other and the yolk sac narrows into the vitelline duct as folding proceeds.
 */

export type P2 = [number, number];
export const K = 0.8; // internal → screen scale
export const LH = 250; // half body length (internal px)
export const S_BM = -0.95 * LH; // buccopharyngeal membrane
export const S_CM = 0.92 * LH; // cloacal membrane
export const NT0 = 17; // neural tube half-thickness (trunk)
export const D_ROOF = 31; // gut roof: mesoderm/endoderm interface
export const ENDO = 7;
export const H0 = 5; // half lumen of the foregut
export const H0T = 7; // half lumen of the hindgut / cloaca
const PD = D_ROOF + ENDO + H0; // head hinge depth (foregut lumen centre)
const PDT = D_ROOF + ENDO + H0T;
const SMAX = 470;
const STEP = 2;

const ss = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const add = (a: P2, b: P2, k = 1): P2 => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const len = (a: P2) => Math.hypot(a[0], a[1]);
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const unit = (a: P2): P2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const f1 = (v: number) => v.toFixed(1);
const pathD = (pts: P2[], close = false) => pts.map((q, i) => `${i ? 'L' : 'M'}${f1(q[0])},${f1(q[1])}`).join('') + (close ? 'Z' : '');
const range = (a: number, b: number, step: number) => {
  const n = Math.max(1, Math.round(Math.abs(b - a) / step));
  return Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));
};
function polyLen(p: P2[]) {
  let s = 0;
  for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return s;
}
/** Offset a polyline along its right-hand normal (y-down screen: interior of a clockwise loop). */
function offset(pts: P2[], d: number): P2[] {
  return pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [q[0] - ((b[1] - a[1]) / l) * d, q[1] + ((b[0] - a[0]) / l) * d];
  });
}
/** Drop near-duplicate consecutive points (keeps offsets stable). */
function dedupe(pts: P2[], eps = 0.6) {
  const out: P2[] = [];
  for (const q of pts) if (!out.length || Math.hypot(q[0] - out[out.length - 1][0], q[1] - out[out.length - 1][1]) > eps) out.push(q);
  return out;
}
/** Catmull-Rom resampling through key points. */
function spline(keys: P2[], per = 8): P2[] {
  const k = dedupe(keys, 1);
  if (k.length < 3) return k;
  const out: P2[] = [];
  for (let i = 0; i < k.length - 1; i++) {
    const p0 = k[Math.max(0, i - 1)];
    const p1 = k[i];
    const p2 = k[i + 1];
    const p3 = k[Math.min(k.length - 1, i + 2)];
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
  out.push(k[k.length - 1]);
  return out;
}
const ring = (c: P2, rx: number, ry: number, rot: number, n = 28): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    return [c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot)];
  });

export function foldTiming(t: number) {
  return {
    hf: seg(t, 0.06, 0.5), // head fold (well under way during its own step)
    tf: seg(t, 0.26, 0.56), // tail fold
    mf: seg(t, 0.04, 0.85), // whole-body curvature
    nc: seg(t, 0.02, 0.45), // neural tube closing (lumen)
    duct: seg(t, 0.3, 0.82), // yolk sac neck → vitelline duct
    pit: seg(t, 0.86, 0.94),
  };
}

function build(t: number, spMax = 5) {
  const { hf, tf, mf, nc, duct } = foldTiming(t);
  // Curvature per internal px: trunk arch + moderate curl under heart/hindgut + strong curl of the brain / tail bud.
  const kap = (s: number) => {
    const u = s / LH;
    return (u < 0 ? 1.1 * mf + hf * (0.5 * ss(-0.4, -0.72, u) + 1.8 * ss(-0.98, -1.08, u)) : 1.1 * mf + tf * (0.6 * ss(0.4, 0.7, u) + 2.8 * ss(0.94, 1.04, u))) / LH;
  };
  const n = Math.round((2 * SMAX) / STEP);
  const th = new Float64Array(n + 1);
  const ax = new Float64Array(n + 1);
  const ay = new Float64Array(n + 1);
  const i0 = n / 2;
  for (let i = i0; i < n; i++) {
    th[i + 1] = th[i] + kap(-SMAX + (i + 0.5) * STEP) * STEP;
    const m = (th[i] + th[i + 1]) / 2;
    ax[i + 1] = ax[i] + Math.cos(m) * STEP;
    ay[i + 1] = ay[i] + Math.sin(m) * STEP;
  }
  for (let i = i0; i > 0; i--) {
    th[i - 1] = th[i] - kap(-SMAX + (i - 0.5) * STEP) * STEP;
    const m = (th[i] + th[i - 1]) / 2;
    ax[i - 1] = ax[i] - Math.cos(m) * STEP;
    ay[i - 1] = ay[i] - Math.sin(m) * STEP;
  }
  const frame = (s: number) => {
    const f = clamp((s + SMAX) / STEP, 0, n);
    const i = Math.min(n - 1, Math.floor(f));
    const r = f - i;
    return { p: [lerp(ax[i], ax[i + 1], r), lerp(ay[i], ay[i + 1], r)] as P2, th: lerp(th[i], th[i + 1], r) };
  };
  /** Body coords → internal plane. Depth on the concave (ventral) side is softly kept inside the radius of curvature. */
  const map = (s: number, d: number): P2 => {
    const F = frame(s);
    const k = kap(s);
    if (d > 0 && k > 1e-5) {
      const a = 0.95 / k;
      d = d / Math.pow(1 + Math.pow(d / a, 6), 1 / 6);
    }
    return [F.p[0] - Math.sin(F.th) * d, F.p[1] + Math.cos(F.th) * d];
  };
  const tangent = (s: number): P2 => [Math.cos(frame(s).th), Math.sin(frame(s).th)];

  // ---- neural tube (brain grows dorsally; tube tapers to rounded tips) ----
  const sHT = Math.min(LH * lerp(-0.97, -1.24, hf), S_BM - 5);
  const sTT = Math.max(LH * lerp(0.95, 1.12, tf), S_CM + 5);
  const NT = (s: number) => {
    const u = s / LH;
    return u < 0 ? NT0 + 26 * lerp(0.35, 1, hf) * ss(-0.55, -0.95, u) : NT0 - 5 * ss(0.8, 1.1, u);
  };
  const cen = (s: number) => -(NT(s) - NT0);
  const NTe = (s: number) => NT(s) * Math.sqrt(clamp((s - sHT) / NT(s))) * Math.sqrt(clamp((sTT - s) / NT(s)));
  // mesenchyme of the future face under the forebrain, rostral to the stomodeum
  const faceBulk = (s: number) => 16 * hf * ss(S_BM - 4, S_BM - 26, s) * (NTe(s) / NT(s));
  const lum = (s: number) => NTe(s) * nc * lerp(0.3, 0.22, ss(-0.55, -0.95, s / LH));

  // ---- flaps hinged at the membranes ----
  const psiH = Math.PI * 0.97 * hf;
  const psiT = Math.PI * 0.95 * tf;
  const LF = lerp(80, 150, hf);
  const LFT = lerp(60, 120, tf);
  const sp = (v: number) => spMax * ss(4, 12, v); // splanchnic layer
  const cav = (v: number) => (39 - spMax) * ss(8, 26, v) + 9 * ss(14, 34, v) * (1 - ss(LF * 0.58, LF * 0.78, v)) - 12 * ss(LF - 30, LF, v); // coelom (deeper round the heart)
  const WH = (v: number) => H0 + ENDO + sp(v) + cav(v) + 5 * ss(4, 12, v) + 5; // outer ectoderm surface
  const mt = (v: number) => 26 * ss(5, 20, v); // tail-flap mesenchyme (carries the allantois)
  const WT = (v: number) => H0T + ENDO + mt(v) + 5;
  function flap(pivot: P2, alpha0: number, bend: number, side: 1 | -1, kOff: (v: number) => number, L: number) {
    const N = Math.ceil(L / 2) + 1;
    const qs: P2[] = [pivot];
    const al: number[] = [alpha0];
    for (let i = 0; i < N; i++) {
      const a = al[i] + bend * kOff(i * 2 + 1) * 2;
      const m = (al[i] + a) / 2;
      qs.push([qs[i][0] + Math.cos(m) * 2, qs[i][1] + Math.sin(m) * 2]);
      al.push(a);
    }
    return (v: number, w: number): P2 => {
      const f = clamp(v / 2, 0, N);
      const i = Math.min(N - 1, Math.floor(f));
      const r = f - i;
      const a = lerp(al[i], al[i + 1], r);
      return [lerp(qs[i][0], qs[i + 1][0], r) - side * Math.sin(a) * w, lerp(qs[i][1], qs[i + 1][1], r) + side * Math.cos(a) * w];
    };
  }
  const thBM = frame(S_BM).th;
  const thCM = frame(S_CM).th;
  const kOffH = (v: number) => {
    const k = kap(S_BM + v);
    return k / Math.max(0.2, 1 - k * PD);
  };
  const kOffT = (v: number) => {
    const k = kap(S_CM - v);
    return k / Math.max(0.2, 1 - k * PDT);
  };
  const fH = flap(map(S_BM, PD), thBM + Math.atan2(Math.sin(psiH), -Math.cos(psiH)), Math.pow(psiH / Math.PI, 3), 1, kOffH, LF + 4);
  const fT = flap(map(S_CM, PDT), thCM + Math.atan2(Math.sin(psiT), Math.cos(psiT)), -Math.pow(psiT / Math.PI, 3), -1, kOffT, LFT + 4);

  // ---- ectoderm: one open path from the head-flap edge, round the embryo, to the tail-flap edge ----
  const ecto: P2[] = [];
  for (const v of range(LF, 0, 3)) ecto.push(fH(v, WH(v)));
  const tBM = tangent(S_BM);
  ecto.push(add(fH(0, H0 + ENDO), tBM, -5));
  ecto.push(map(S_BM - 5, D_ROOF));
  if (sHT < S_BM - 9) for (const s of range(S_BM - 9, sHT, 3)) ecto.push(map(s, cen(s) + NTe(s) + 8 + faceBulk(s)));
  for (const a of range(90, 270, 15)) ecto.push(map(sHT + 6.5 * Math.cos((a * Math.PI) / 180), cen(sHT) + 1.5 + 6.5 * Math.sin((a * Math.PI) / 180)));
  for (const s of range(sHT, sTT, 3)) ecto.push(map(s, cen(s) - NTe(s) - 5));
  for (const a of range(-90, 90, 15)) ecto.push(map(sTT + 6.5 * Math.cos((a * Math.PI) / 180), cen(sTT) + 1.5 + 6.5 * Math.sin((a * Math.PI) / 180)));
  if (sTT > S_CM + 9) for (const s of range(sTT, S_CM + 9, 3)) ecto.push(map(s, cen(s) + NTe(s) + 8));
  ecto.push(map(S_CM + 5, D_ROOF));
  const tCM = tangent(S_CM);
  ecto.push(add(fT(0, H0T + ENDO), tCM, 5));
  for (const v of range(0, LFT, 3)) ecto.push(fT(v, WT(v)));

  // ---- endoderm loop (mesoderm-side surface): foregut → roof → hindgut → yolk sac ----
  const sAIP = S_BM + LF * Math.max(0, -Math.cos(psiH)) * 1.1;
  const sCIP = S_CM - LFT * Math.max(0, -Math.cos(psiT)) * 1.1;
  const fore: P2[] = [...range(LF, 0, 3).map((v) => fH(v, H0 + ENDO)), ...range(S_BM, Math.min(sAIP, sCIP - 6), 3).map((s) => map(s, D_ROOF))];
  const mid: P2[] = range(Math.min(sAIP, sCIP - 6), sCIP, 3).map((s) => map(s, D_ROOF));
  const hind: P2[] = [...range(sCIP, S_CM, 3).map((s) => map(s, D_ROOF)), ...range(0, LFT, 3).map((v) => fT(v, H0T + ENDO))];
  // yolk sac: funnel → vitelline duct → sac
  const PH = fH(LF, H0 + ENDO);
  const PT = fT(LFT, H0T + ENDO);
  const mouth: P2 = [(PH[0] + PT[0]) / 2, (PH[1] + PT[1]) / 2];
  const half = len(sub(PT, PH)) / 2;
  const tdir = unit(sub(PT, PH));
  let ndir: P2 = [-tdir[1], tdir[0]];
  if ((mouth[0] - map(0, 0)[0]) * ndir[0] + (mouth[1] - map(0, 0)[1]) * ndir[1] < 0) ndir = [-ndir[0], -ndir[1]];
  const Ld = lerp(0, 120, duct);
  const hw = Math.min(half, lerp(half, 9, Math.pow(duct, 0.7)));
  const rxb = lerp(half, 56, duct);
  const ryb = lerp(125, 56, duct);
  const Bc = add(mouth, ndir, Ld + ryb * 0.85);
  const E = (a: number): P2 => add(add(Bc, tdir, rxb * Math.sin(a)), ndir, -ryb * Math.cos(a));
  const aj = Math.asin(clamp(hw / rxb, 0, 1));
  const dT = add(add(mouth, tdir, hw), ndir, Ld * 0.2 + 4);
  const dH = add(add(mouth, tdir, -hw), ndir, Ld * 0.2 + 4);
  const ductT = spline([PT, add(PT, sub(dT, PT), 0.55), dT, add(E(aj), ndir, -Math.min(10, Ld * 0.1)), E(aj)], 5);
  const ball = range(aj, 2 * Math.PI - aj, 0.12).map(E);
  const ductH = spline([E(2 * Math.PI - aj), add(E(2 * Math.PI - aj), ndir, -Math.min(10, Ld * 0.1)), dH, add(PH, sub(dH, PH), 0.55), PH], 5);

  return { faceBulk, t, hf, tf, mf, nc, duct, map, frame, tangent, kap, NT, NTe, cen, lum, sHT, sTT, fH, fT, LF, LFT, WH, WT, sp, cav, mt, ecto, fore, mid, hind, ductT, ball, ductH, mouth, ndir, sAIP, sCIP, psiH, psiT };
}
type Geo = ReturnType<typeof build>;

/** Fit the body into the viewport (cranial left, dorsal up). */
function screen(g: Geo, zoom = 0) {
  const pts = [...g.ecto, ...g.ball];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  // `zoom` (own scene only) enlarges the folded embryo as it compacts, never beyond the drawing area.
  const fit = Math.min(596 / (Math.max(...xs) - Math.min(...xs) + 72), 540 / (Math.max(...ys) - Math.min(...ys) + 40)); // + amnion margin
  const k = Math.max(lerp(K, 1, g.mf), Math.min(lerp(K, 1, g.mf) * (1 + zoom * 0.3 * g.mf), fit));
  return (p: P2): P2 => [500 + k * (p[0] - cx), 318 + k * (p[1] - cy)];
}

function cellsFor(outer: P2[], inner: P2[], w: number) {
  return Math.max(2, Math.round(polyLen(outer) / w));
}

function smooth(pts: P2[], k: number): P2[] {
  return pts.map((_, i) => {
    let x = 0;
    let y = 0;
    let w = 0;
    for (let j = -k; j <= k; j++) {
      const q = pts[clamp(i + j, 0, pts.length - 1)];
      x += q[0];
      y += q[1];
      w++;
    }
    return [x / w, y / w];
  });
}
/** Amnion: smoothed outward offset of the ectoderm, tapering to the two attachments (the ventral body-wall margins); domed while the disc is flat. */
function amnionPath(ecto: P2[], gap: number, dome: number): P2[] {
  const sm = smooth(smooth(ecto, 10), 10);
  const acc = [0];
  for (let i = 1; i < sm.length; i++) acc.push(acc[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]));
  const L = acc[acc.length - 1] || 1;
  const out = sm.map((q, i) => {
    const a = sm[Math.max(0, i - 2)];
    const b = sm[Math.min(sm.length - 1, i + 2)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const e = Math.min(acc[i], L - acc[i]);
    const d = (gap + dome * Math.sin((Math.PI * acc[i]) / L)) * ss(0, 70, e);
    return [q[0] + ((b[1] - a[1]) / l) * d, q[1] - ((b[0] - a[0]) / l) * d] as P2;
  });
  out[0] = ecto[0];
  out[out.length - 1] = ecto[ecto.length - 1];
  return smooth(out, 3);
}

/** Everything the folded-embryo drawing needs, in screen space (shared with the week-4 gut views). */
export function computeFold(t: number, spMax = 5, zoom = 0) {
  const g = build(t, spMax);
  const X = screen(g, zoom);
  const S = (pts: P2[]) => pts.map(X);
  const { map, fH, fT, LF, LFT } = g;
  const pit = foldTiming(t).pit;

  // --- screen polylines ---
  const ecto = dedupe(S(g.ecto));
  const ectoIn = offset(ecto, 4.2 * K);
  const pieces = [g.fore, g.mid, g.hind, g.ductT, g.ball, g.ductH].map((p) => dedupe(S(p)));
  const loop = dedupe(pieces.flat());
  const loopIn = offset(loop, ENDO * K);
  const pieceIn = (p: P2[]) => offset(p, ENDO * K);
  // Continuous underlays for the yolk-sac neck: the per-piece cell bands end square where the duct turns
  // into the sac or the gut, leaving dark notches; these fill them with the right tissue.
  const neck = dedupe([...pieces[2].slice(-6), ...pieces[3], ...pieces[4], ...pieces[5], ...pieces[0].slice(0, 6)]);
  const neckEndo = [...neck, ...offset(neck, ENDO * K).reverse()];
  const neckMeso = [...offset(neck, -5 * K), ...neck.slice().reverse()];
  const bodyGut = dedupe(S([...g.fore, ...g.mid, ...g.hind]));
  const meso = [...ecto, ...bodyGut.slice().reverse()];

  // neural tube
  const sN = range(g.sHT, g.sTT, 2.5);
  const ntTop = S(sN.map((s) => map(s, g.cen(s) - g.NTe(s))));
  const ntBot = S(sN.map((s) => map(s, g.cen(s) + g.NTe(s))));
  const lumTop = S(sN.map((s) => map(s, g.cen(s) - g.lum(s))));
  const lumBot = S(sN.map((s) => map(s, g.cen(s) + g.lum(s))));
  // notochord (cranial end just caudal to the prechordal plate/buccopharyngeal membrane)
  const sNo = range(-0.86 * LH, Math.min(0.98 * LH, g.sTT - 12), 3);
  const noTop = S(sNo.map((s) => map(s, NT0 + 1.5)));
  const noBot = S(sNo.map((s) => map(s, NT0 + 1.5 + 7 * Math.min(1, (s + 0.86 * LH) / 12, (0.98 * LH - s) / 20 + 0.4))));

  // head flap layers
  const vH = range(0, LF, 3);
  const splO = S(vH.map((v) => fH(v, H0 + ENDO + g.sp(v))));
  const splI = S(vH.map((v) => fH(v, H0 + ENDO)));
  const somO = S(vH.map((v) => fH(v, g.WH(v) - 5)));
  const somI = S(vH.map((v) => fH(v, g.WH(v) - 5 - 5 * ss(4, 12, v))));
  const cavPoly = (a: number, b: number) => {
    const vs = range(a, b, 3);
    return S([...vs.map((v) => fH(v, H0 + ENDO + g.sp(v))), ...vs.slice().reverse().map((v) => fH(v, H0 + ENDO + g.sp(v) + g.cav(v)))]);
  };
  const vSplit = LF * 0.72;
  // heart tube in the pericardial cavity, hanging from the splanchnic layer (dorsal mesocardium)
  const hs = lerp(0.5, 1, g.hf);
  const hv = LF * 0.42;
  const hw0 = H0 + ENDO + g.sp(hv);
  const heartC = X(fH(hv, hw0 + 1.5 + 16 * hs));
  const hA = X(fH(hv + 1, hw0 + 1.5 + 16 * hs));
  const heartRot = Math.atan2(hA[1] - heartC[1], hA[0] - heartC[0]);
  const heartO = ring(heartC, 31 * hs * K, 15.5 * hs * K, heartRot);
  const heartI = ring(heartC, 21 * hs * K, 7.5 * hs * K, heartRot);
  // dorsal mesocardium: the heart hangs from the splanchnic layer under the foregut
  const meso1 = X(fH(hv - 7, hw0 - 1));
  const meso2 = X(fH(hv + 7, hw0 - 1));
  const meso3 = X(fH(hv + 4, hw0 + 9));
  const meso4 = X(fH(hv - 4, hw0 + 9));
  const mesocardium: P2[] = [meso1, meso2, meso3, meso4];

  // tail: allantois from the cloacal floor into the connecting stalk
  const wm = (H0T + ENDO + g.WT(LFT)) / 2;
  const B = fT(LFT, wm);
  const es = unit(sub(fT(LFT, wm), fT(LFT - 8, wm)));
  const a0 = Math.atan2(es[1], es[0]) - 0.4;
  let a1 = Math.atan2(g.ndir[1], g.ndir[0]) - 0.2;
  while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  while (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
  const sa = lerp(a0, a1, g.tf);
  const sd: P2 = [Math.cos(sa), Math.sin(sa)];
  const c1 = add(B, unit(add(es, sd, lerp(0.3, 2, g.tf))), 34);
  const stalkEnd = add(c1, sd, lerp(40, 150, g.tf));
  const stalkC = range(0, 1, 1 / 24).map((u): P2 => [
    (1 - u) * (1 - u) * B[0] + 2 * (1 - u) * u * c1[0] + u * u * stalkEnd[0],
    (1 - u) * (1 - u) * B[1] + 2 * (1 - u) * u * c1[1] + u * u * stalkEnd[1],
  ]);
  const stalkS = S(stalkC);
  // Organic tube: flares where it leaves the ventral body wall; its far end (towards the chorion,
  // outside this view) fades out instead of ending in a square cut.
  const stalkW = (u: number) => (17 + 13 * Math.max(0, 1 - u / 0.3) ** 2 - 2 * u) * K;
  const stalkTube = tube(polyline(stalkS), stalkW, 0, 1, 48);
  const allC = dedupe(S([fT(8, H0T - 2), fT(18, H0T + ENDO + 10), ...range(26, LFT, 4).map((v) => fT(v, H0T + ENDO + 11)), ...stalkC.slice(1, 14)]));
  const allO1 = offset(allC, -6 * K);
  const allI1 = offset(allC, -2.6 * K);
  const allO2 = offset(allC, 6 * K);
  const allI2 = offset(allC, 2.6 * K);

  // amnion
  const amn = amnionPath(ecto, 26, lerp(70, 8, g.mf));
  const amnIn = offset(amn, 3.6 * K);
  const amnOut = offset(amn, -3 * K);

  // mesenchyme dots
  const dots: P2[] = [];
  for (const s of range(S_BM + 10, S_CM - 6, 9)) for (const d of [NT0 + 11, D_ROOF - 4]) dots.push(X(map(s + (rand(s * 1.3 + d) - 0.5) * 6, d + (rand(s + d * 7) - 0.5) * 3)));
  for (const v of range(18, LFT - 4, 8)) for (const w of [H0T + ENDO + 5, H0T + ENDO + 20]) dots.push(X(fT(v, w + (rand(v + w) - 0.5) * 3)));
  for (const s of range(g.sHT + 12, S_BM - 10, 9)) dots.push(X(map(s, g.cen(s) + g.NTe(s) + 3 + g.faceBulk(s) * 0.5)));

  // anchors
  const bmMid = X(map(S_BM - 2, D_ROOF + 6 + (PD + H0 + 12 - D_ROOF) * Math.max(0, -Math.cos(g.psiH)) * 0.4));
  const cmMid = X(map(S_CM + 2, D_ROOF + 6 + (PDT + H0T + 12 - D_ROOF) * Math.max(0, -Math.cos(g.psiT)) * 0.4));
  // Membranes: where ectoderm and endoderm touch with no mesoderm between — the bilaminar plate across
  // the end of the foregut (buccopharyngeal) and of the hindgut (cloacal).
  const plate = (r1: P2, r2: P2, tan: P2, out: number) => {
    const a = X(r1);
    const b = X(r2);
    const tv = unit(sub(X(add(r1, tan, 1)), a));
    return [a, b, add(b, tv, out * 8.5), add(a, tv, out * 8.5)] as P2[];
  };
  const bmPlate = plate(map(S_BM + 0.5, D_ROOF - 0.5), fH(0, H0 + ENDO + 0.5), g.tangent(S_BM), -1);
  const cmPlate = plate(map(S_CM - 0.5, D_ROOF - 0.5), fT(0, H0T + ENDO + 0.5), g.tangent(S_CM), 1);
  const kloakaC = X(fT(12, 0));
  const kloakaRing = ring(kloakaC, 15 * K, 9 * K, 0);
  // Cloaca: the dilated end of the hindgut (lumen between its roof and floor), which the allantois enters.
  const kloakaLumen = [...range(S_CM - 30, S_CM, 3).map((s) => X(map(s, D_ROOF + ENDO + 0.5))), ...range(0, 28, 3).map((v) => X(fT(v, H0T - 0.5)))];
  // Stomodeum / proctodeum: the pits of the surface ectoderm in front of each membrane (cavity side of the ectoderm).
  const pitPoly = (deep: P2, reach: number) => {
    let ib = 0;
    let bd = 1e9;
    ecto.forEach((q, i) => {
      const d = Math.hypot(q[0] - deep[0], q[1] - deep[1]);
      if (d < bd) {
        bd = d;
        ib = i;
      }
    });
    let i0 = ib;
    let acc = 0;
    while (i0 > 0 && acc < reach) {
      acc += Math.hypot(ecto[i0][0] - ecto[i0 - 1][0], ecto[i0][1] - ecto[i0 - 1][1]);
      i0--;
    }
    let i1 = ib;
    acc = 0;
    while (i1 < ecto.length - 1 && acc < reach) {
      acc += Math.hypot(ecto[i1 + 1][0] - ecto[i1][0], ecto[i1 + 1][1] - ecto[i1][1]);
      i1++;
    }
    const pts = ecto.slice(i0, i1 + 1);
    const c: P2 = [(pts[0][0] + pts[pts.length - 1][0] + 2 * ecto[ib][0]) / 4, (pts[0][1] + pts[pts.length - 1][1] + 2 * ecto[ib][1]) / 4];
    return { pts, c };
  };
  const stom = pitPoly(X(map(S_BM - 5, D_ROOF)), 30 * K);
  const prok = pitPoly(X(map(S_CM + 5, D_ROOF)), 24 * K);
  const pits = [
    { id: 'estomodeoa', c: stom.c, pts: stom.pts },
    { id: 'proktodeoa', c: prok.c, pts: prok.pts },
  ];

  // Primitive umbilical cord: from the umbilical ring the amnion starts to sheathe the vitelline duct and
  // the connecting stalk together (notes fig. 2 D; Langman 6-18 D).
  const cordK = ss(0.6, 0.9, t);
  /** From the body-wall margin `from`, follow `path` (starting at its point nearest the margin) for arc length L. */
  const sheath = (from: P2, path: P2[], L: number) => {
    let ib = 0;
    path.forEach((q, i) => {
      if (Math.hypot(q[0] - from[0], q[1] - from[1]) < Math.hypot(path[ib][0] - from[0], path[ib][1] - from[1])) ib = i;
    });
    // run away from the body (towards the chorion)
    const body = X(map(0, D_ROOF));
    const far = (i: number) => Math.hypot(path[clamp(i, 0, path.length - 1)][0] - body[0], path[clamp(i, 0, path.length - 1)][1] - body[1]);
    const dir = far(ib + 4) > far(ib - 4) ? 1 : -1;
    const out: P2[] = [from];
    let acc = 0;
    for (let i = ib; i >= 0 && i < path.length && acc < L; i += dir) {
      const last = out[out.length - 1];
      acc += Math.hypot(path[i][0] - last[0], path[i][1] - last[1]);
      out.push(path[i]);
    }
    return out;
  };
  const ductOut = offset(pieces[5], -5 * K - 1.8);
  const cordCran = cordK > 0.01 ? sheath(ecto[0], ductOut, polyLen(pieces[5]) * 0.6 * cordK) : [];
  const stalkSide = (sgn: 1 | -1) =>
    stalkS.map((q, i) => {
      const a = stalkS[Math.max(0, i - 1)];
      const b = stalkS[Math.min(stalkS.length - 1, i + 1)];
      const n = unit([-(b[1] - a[1]), b[0] - a[0]]);
      return add(q, n, sgn * (stalkW(i / (stalkS.length - 1)) + 2.6));
    });
  const sideA = stalkSide(1);
  const sideB = stalkSide(-1);
  const dDuct = (pts: P2[]) => Math.hypot(pts[6][0] - pieces[5][0][0], pts[6][1] - pieces[5][0][1]);
  const stalkOut = dDuct(sideA) > dDuct(sideB) ? sideA : sideB;
  const cordCaud = cordK > 0.01 ? sheath(ecto[ecto.length - 1], stalkOut, polyLen(stalkS) * 0.5 * cordK) : [];
  const cordAt = X(fT(LFT, g.WT(LFT) + 6));

  return { g, X, S, map, fH, fT, LF, LFT, pit, ecto, ectoIn, pieces, loopIn, pieceIn, meso, ntTop, ntBot, lumTop, lumBot, noTop, noBot, splO, splI, somO, somI, cavPoly, vSplit, heartC, heartO, heartI, stalkS, stalkTube, neckEndo, neckMeso, allC, allO1, allI1, allO2, allI2, amn, amnIn, amnOut, dots, bmMid, cmMid, kloakaC, kloakaRing, pits, bmPlate, cmPlate, kloakaLumen, mesocardium, cordK, cordCran, cordCaud, cordAt };
}
export type Fold = ReturnType<typeof computeFold>;

/** The cellular folded-embryo section (no labels). `children` are drawn over the gut, under the surface ectoderm. */
export function FoldBody({ f, kloakaShow, children, bare = false, endoName = false }: { f: Fold; kloakaShow: number; children?: ReactNode; bare?: boolean; endoName?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const { g, LF, pit, ecto, ectoIn, pieces, loopIn, pieceIn, meso, ntTop, ntBot, lumTop, lumBot, noTop, noBot, splO, splI, somO, somI, cavPoly, vSplit, heartO, heartI, stalkS, stalkTube, neckEndo, neckMeso, allC, allO1, allI1, allO2, allI2, amn, amnIn, amnOut, dots, kloakaLumen, pits, bmPlate, cmPlate, mesocardium, heartC, cordK, cordCran, cordCaud } = f;
  return (
    <g>
      {!bare && <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />}
      {/* amniotic cavity */}
      <Part id="amnios-barrunbea" quiet>
        <path d={pathD([...amn, ...ecto.slice().reverse()], true)} fill={C.amnionCavity} />
      </Part>

      <Part id="finkapen-pedikulua">
        <defs>
          <linearGradient id={`${uid}-sg`} gradientUnits="userSpaceOnUse" x1={stalkS[16][0]} y1={stalkS[16][1]} x2={stalkS[24][0]} y2={stalkS[24][1]}>
            <stop offset={0} stopColor="#fff" />
            <stop offset={1} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`${uid}-sm`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
            <rect x={0} y={0} width={1000} height={640} fill={`url(#${uid}-sg)`} />
          </mask>
        </defs>
        <g mask={`url(#${uid}-sm)`}>
          <path d={stalkTube.d} fill={C.mesoExtra} />
          {stalkS.slice(3, -1).map((q, i) => (
            <ellipse key={i} cx={q[0] + (rand(i * 3.1) - 0.5) * 16} cy={q[1] + (rand(i * 5.7) - 0.5) * 16} rx={2.2} ry={1.6} fill="rgba(150,70,50,0.7)" />
          ))}
          <g fill="none" stroke="#c96b45" strokeWidth={1.1}>
            <path d={stalkTube.left} />
            <path d={stalkTube.right} />
          </g>
        </g>
      </Part>

      {/* gut + yolk-sac lumen */}
      <path d={pathD(loopIn, true)} fill="#2a2413" />
      <path d={pathD(neckMeso, true)} fill={C.mesoExtra} />
      <path d={pathD(neckEndo, true)} fill={C.endoderm} />
      {/* extra-embryonic splanchnic mesoderm around the yolk sac and vitelline duct */}
      <Part id="bitelo-zaku-sekundarioa" show={1}>
        <Cells outer={offset(pieces[4], -5 * K)} inner={pieces[4]} n={cellsFor(pieces[4], pieces[4], 9)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={401} />
        <Cells outer={pieces[4]} inner={pieceIn(pieces[4])} n={cellsFor(pieces[4], pieces[4], 6.5)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={402} />
      </Part>
      <Part id="hodi-onfalomesenterikoa">
        {[pieces[3], pieces[5]].map((p, i) => (
          <g key={i}>
            <Cells outer={offset(p, -5 * K)} inner={p} n={cellsFor(p, p, 9)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.6)" edge="rgba(150,70,50,0.25)" seed={403 + i} />
            <Cells outer={p} inner={pieceIn(p)} n={cellsFor(p, p, 6.5)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={405 + i} />
          </g>
        ))}
      </Part>

      {/* intra-embryonic mesoderm (mesenchyme) */}
      <Part id="mesodermo-intraenbrionarioa" quiet>
        <path d={pathD(meso, true)} fill="#5a2630" />
        <path d={pathD(meso, true)} fill={C.mesoIntra} opacity={0.22} />
        {dots.map((q, i) => (
          <g key={i}>
            <ellipse cx={q[0]} cy={q[1]} rx={2} ry={1.5} fill="rgba(239,75,75,0.8)" />
            <path d={`M${f1(q[0] - 4)},${f1(q[1] + 1.5)}L${f1(q[0] + 4)},${f1(q[1] - 1.5)}`} stroke="rgba(239,75,75,0.45)" strokeWidth={0.7} />
          </g>
        ))}
      </Part>

      {/* coelom of the head flap: pericardial cavity (cranial) opening caudally into the rest of the intra-embryonic coelom */}
      <Part id="barrunbe-perikardikoa">
        <path d={pathD(cavPoly(8, vSplit), true)} fill="#1a1020" />
      </Part>
      <Part id="enbrioi-barruko-zeloma">
        <path d={pathD(cavPoly(vSplit - 1, LF), true)} fill="#1a1020" />
      </Part>
      <Part id="errai-orria">
        <Cells outer={splO} inner={splI} n={cellsFor(splO, splI, 8)} fill={C.mesoLateral} nucleus="rgba(120,20,20,0.6)" seed={410} />
      </Part>
      <Part id="paretako-orria">
        <Cells outer={somO} inner={somI} n={cellsFor(somO, somI, 8)} fill={C.mesoLateral} nucleus="rgba(120,20,20,0.6)" seed={411} />
      </Part>
      <Part id="bihotz-hodia">
        {/* dorsal mesocardium, then myocardium (cells) round cardiac jelly and the endocardial tube */}
        <path d={pathD(mesocardium, true)} fill={C.mesoLateral} opacity={0.85} />
        <Cells outer={heartO} inner={heartI} n={18} fill="#e0363f" nucleus="rgba(90,10,10,0.7)" seed={412} />
        <path d={pathD(heartI, true)} fill="#7a2a36" />
        <path d={pathD(heartI.map((q) => lerp2(heartC, q, 0.62)), true)} fill="#3a0a12" stroke="#fca5a5" strokeWidth={1.1} strokeOpacity={0.8} />
        {[0.32, 0.68].map((k, i) => (
          <ellipse key={i} cx={lerp(heartI[3][0], heartI[17][0], k)} cy={lerp(heartI[3][1], heartI[17][1], k)} rx={2} ry={1.4} fill="#f87171" />
        ))}
      </Part>

      <Part id="notokorda">
        <Cells outer={noTop} inner={noBot} n={cellsFor(noTop, noBot, 7)} fill={C.notochord} nucleus="rgba(60,20,90,0.7)" seed={413} />
      </Part>

      <Part id="hodi-neurala">
        <path d={pathD([...ntTop, ...ntBot.slice().reverse()], true)} fill={C.neural} />
        <Cells outer={ntTop} inner={lumTop} n={cellsFor(ntTop, lumTop, 5.5)} fill={C.neural} nucleus="rgba(10,20,70,0.7)" pseudo seed={414} />
        <Cells outer={ntBot} inner={lumBot} n={cellsFor(ntBot, lumBot, 5.5)} fill={C.neural} nucleus="rgba(10,20,70,0.7)" pseudo seed={415} />
        {g.nc > 0.02 && <path d={pathD([...lumTop, ...lumBot.slice().reverse()], true)} fill="#0f1733" opacity={Math.min(1, g.nc * 3)} />}
      </Part>

      {/* Cloaca: the dilated terminal hindgut lumen (allantois opens into it), lit warm under the endoderm cells. */}
      <Part id="kloaka" show={kloakaShow}>
        <path d={pathD(kloakaLumen, true)} fill="#6b5420" />
        <path d={pathD(kloakaLumen, true)} fill="url(#g-cavity)" />
      </Part>

      {/* endoderm: foregut, midgut, hindgut (the loop continues into the vitelline duct and yolk sac above) */}
      {(
        [
          ['aurreko-hestea', 0],
          ['erdiko-hestea', 1],
          ['atzeko-hestea', 2],
        ] as const
      ).map(([id, i]) =>
        pieces[i].length > 1 ? (
          // Until the midgut is named (`endoName`) the middle stretch is simply the endoderm being folded in.
          <Part id={id === 'erdiko-hestea' && endoName ? 'endodermoa' : id} key={id}>
            <Cells outer={pieces[i]} inner={pieceIn(pieces[i])} n={cellsFor(pieces[i], pieces[i], 6.5)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={420 + i} />
          </Part>
        ) : null,
      )}

      <Part id="alantoidea">
        {/* Blind, rounded tip: the endoderm wraps round the end of the lumen. */}
        <circle cx={allC[allC.length - 1][0]} cy={allC[allC.length - 1][1]} r={6 * K} fill={C.endoderm} stroke="rgba(8,12,26,0.55)" strokeWidth={1} />
        <path d={pathD(allC)} stroke="#2a2413" strokeWidth={5 * K} fill="none" strokeLinecap="round" />
        <Cells outer={allO1} inner={allI1} n={cellsFor(allO1, allI1, 6)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={430} />
        <Cells outer={allO2} inner={allI2} n={cellsFor(allO2, allI2, 6)} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={431} />
      </Part>

      {children}

      <Part id="ektodermoa">
        <Cells outer={ecto} inner={ectoIn} n={cellsFor(ecto, ectoIn, 6)} fill={C.surfaceEcto} nucleus="rgba(20,40,110,0.7)" seed={440} />
      </Part>

      {/* Membranes: ectoderm directly on endoderm, no mesoderm between (bilaminar plates closing each end of the gut). */}
      {(
        [
          ['mintz-bukofaringeoa', bmPlate],
          ['kloaka-mintza', cmPlate],
        ] as const
      ).map(([id, q]) => {
        const m1 = lerp2(q[0], q[3], 0.5);
        const m2 = lerp2(q[1], q[2], 0.5);
        return (
          <Part id={id} key={id}>
            <path d={pathD([q[0], q[1], m2, m1], true)} fill={C.endoderm} />
            <path d={pathD([m1, m2, q[2], q[3]], true)} fill={C.surfaceEcto} />
            <path d={pathD([q[0], q[1], q[2], q[3]], true)} fill="none" stroke="rgba(8,12,26,0.55)" strokeWidth={0.9} />
            {[0.25, 0.75].map((k) => (
              <g key={k}>
                <circle cx={lerp(lerp2(q[0], m1, 0.5)[0], lerp2(q[1], m2, 0.5)[0], k)} cy={lerp(lerp2(q[0], m1, 0.5)[1], lerp2(q[1], m2, 0.5)[1], k)} r={1.2} fill="rgba(90,60,10,0.75)" />
                <circle cx={lerp(lerp2(m1, q[3], 0.5)[0], lerp2(m2, q[2], 0.5)[0], k)} cy={lerp(lerp2(m1, q[3], 0.5)[1], lerp2(m2, q[2], 0.5)[1], k)} r={1.2} fill="rgba(20,40,110,0.75)" />
              </g>
            ))}
          </Part>
        );
      })}
      {/* Stomodeum / proctodeum: the ectodermal pits in front of each membrane (tinted hollow + brighter lining). */}
      {pits.map((p) => (
        <Part id={p.id} key={p.id} show={pit}>
          <path d={pathD(p.pts, true)} fill="rgba(122,167,245,0.26)" />
          <path d={pathD(p.pts)} fill="none" stroke="#a9c6ff" strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
        </Part>
      ))}

      <Part id="amnios-barrunbea">
        <Cells outer={amn} inner={amnIn} n={cellsFor(amn, amnIn, 9)} fill={C.amnioblast} nucleus="rgba(30,60,140,0.6)" seed={450} />
        <Cells outer={amnOut} inner={amn} n={cellsFor(amnOut, amn, 12)} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.5)" edge="rgba(150,70,50,0.25)" seed={451} opacity={0.9} />
      </Part>
      {/* Primitive umbilical cord: the amnion, continuing from the body-wall margins, sheathes duct and stalk together. */}
      <Part id="hasierako-zilbor-hestea" show={cordK}>
        {[cordCran, cordCaud].map((c, i) =>
          c.length > 1 ? (
            <g key={i}>
              <path d={pathD(c)} fill="none" stroke={C.mesoExtra} strokeWidth={5.2} strokeLinecap="round" opacity={0.9} />
              <path d={pathD(c)} fill="none" stroke={C.amnioblast} strokeWidth={2.6} strokeLinecap="round" />
            </g>
          ) : null,
        )}
      </Part>

    </g>
  );
}

/** Screen positions of the structures whose relations change, cached per t (trails sample many t). */
type Anchors = Record<'heart' | 'bm' | 'cm' | 'all' | 'stalk', P2>;
const anchorCache = new Map<number, Anchors>();
function anchorsAt(t: number): Anchors {
  const key = Math.round(t * 100);
  let a = anchorCache.get(key);
  if (!a) {
    const f = computeFold(key / 100, 5, 1);
    a = { heart: f.heartC, bm: f.bmMid, cm: f.cmMid, all: f.allC[Math.floor(f.allC.length * 0.8)], stalk: f.stalkS[18] };
    anchorCache.set(key, a);
  }
  return a;
}

/** Relation tracking: a start dot where the structure was at t=0, the route it has travelled, a dot where it is now. */
/** `tag`: the "hasieran" word beside the start dot, placed per track where no leader passes, shown only in its own step. */
type TrackTag = { dx: number; dy: number; align: 'start' | 'middle' | 'end'; show: number };
function Track({ t, id, k, from, color, show, tag }: { t: number; id: string; k: keyof Anchors; from: number; color: string; show: number; tag?: TrackTag }) {
  if (show <= 0.02) return null;
  const pts: P2[] = [];
  for (let u = 0; u <= t + 1e-6; u += 0.02) pts.push(anchorsAt(u)[k]);
  const now = anchorsAt(t)[k];
  pts.push(now);
  const g0 = pts[0];
  const moved = Math.hypot(now[0] - g0[0], now[1] - g0[1]) > 6;
  return (
    <g opacity={show} pointerEvents="none" data-track={id}>
      {moved && t > from ? (
        <Journey pts={pts} color={color} head={6} width={2.4} route={0.6} r={4} />
      ) : (
        <circle cx={g0[0]} cy={g0[1]} r={3.4} fill={color} stroke="rgba(6,8,14,0.62)" strokeWidth={1.8} />
      )}
      {/* A Note, not raw text: it grows with the stage's label scale, so it stays legible on a short tablet stage. */}
      {tag && (
        <Note x={g0[0] + tag.dx} y={g0[1] + tag.dy} align={tag.align} size={11} show={Math.min(show, tag.show)}>
          hasieran
        </Note>
      )}
      {moved && <circle cx={now[0]} cy={now[1]} r={4.5} fill={color} stroke="rgba(6,8,14,0.62)" strokeWidth={1.6} />}
    </g>
  );
}

/**
 * Link to the transverse view: during the lateral-fold steps, the plane of the transverse section (the same
 * line as the key in that view) crosses the embryo at the midgut, then slides just caudal to the umbilicus.
 */
function SectionPlane({ f, t }: { f: Fold; t: number }) {
  const show = 0.85 * seg(t, 0.44, 0.47) * (1 - seg(t, 0.86, 0.9));
  if (show <= 0.02) return null;
  const { g, X } = f;
  const lam = seg(t, 0.72, 0.785);
  const sMid = (g.sAIP + g.sCIP) / 2 + 46 * lam;
  const a = X(g.map(sMid, -NT0 - 20));
  const b = X(g.map(sMid, D_ROOF + ENDO + 36));
  const u = unit(sub(a, b));
  // short caps across each end: the cut-line convention of textbook figures
  const cap = (p: P2) => `M${f1(p[0] - u[1] * 7)},${f1(p[1] + u[0] * 7)}L${f1(p[0] + u[1] * 7)},${f1(p[1] - u[0] * 7)}`;
  const d = `M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}${cap(a)}${cap(b)}`;
  return (
    <>
      <g opacity={show} pointerEvents="none">
        <path d={d} stroke="#0f0f11" strokeWidth={4.6} strokeLinecap="round" />
        <path d={d} stroke="#ffb86b" strokeWidth={2.1} strokeLinecap="round" />
      </g>
      <Note x={500} y={588} tone="dim" show={show}>
        Marra laranja: ebaki zeharkakoaren maila (ikus «Ebaki zeharkakoa» ikuspegia)
      </Note>
    </>
  );
}

/** Before/after of the relations (one line per beat), in the words of the notes. */
const RELATIONS: [number, number, string][] = [
  [0.08, 0.3, 'Hasieran bihotz-eremua mintz bukofaringeoaren AURREAN (kranealean) → tolestu ondoren haren AZPIAN (bentralean)'],
  [0.3, 0.44, 'Hasieran alantoidea eta pedikulua kloaka-mintzaren ATZEAN (kaudalean) → tolestu ondoren alde BENTRALEAN'],
  [0.66, 0.72, 'Pedikulua eta hodi onfalomesenterikoa alde bentralean elkartzen dira: zilbor-hestearen hasiera'],
];

export function FoldingSagittal({ t }: SceneProps) {
  const f = computeFold(t, 5, 1);
  const { g, X, map, fH, fT, LF, LFT, pit, pieces, heartC, stalkS, allC, bmMid, cmMid, kloakaC, pits } = f;
  const L = (id: string, x: number, y: number, p: P2, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  // Labels arrive with the step that talks about them (a beginner meets ~6 names first, not 22).
  const at = (a: number) => seg(t, a, a + 0.04);
  // Two label layouts, so no leader crosses another in any held frame: the head/tail-fold steps (heart and
  // membranes still cranial) and the folded embryo (heart and membranes ventral). At the start of the
  // lateral-fold step the labels that change place fade out, jump, and fade back in (never two at one spot).
  const mv = seg(t, 0.44, 0.47);
  const late = mv >= 0.5;
  const sw = (early: number, lateY: number) => (late ? lateY : early);
  const swO = late ? seg(mv, 0.5, 1) : 1 - seg(mv, 0, 0.5);
  const inL = seg(mv, 0.5, 1);
  const head = at(0.08);
  const tail = at(0.3);
  const layers = at(0.44);
  const gut = at(0.56);
  const kloakaShow = seg(t, 0.7, 0.8);
  // Trails: strong in their own step, faint afterwards (the path stays readable), gone by the stomodeum step.
  const trail = (a: number, b: number) => Math.max(seg(t, a, a + 0.03) * (1 - seg(t, b, b + 0.03)), 0.35 * seg(t, a, a + 0.03) * (1 - seg(t, 0.86, 0.9)));
  const headTr = trail(0.08, 0.3);
  // The "hasieran" words only in their own step: in the faint phase the later leaders run through that spot.
  const headStep = seg(t, 0.08, 0.11) * (1 - seg(t, 0.3, 0.33));
  const tailStep = seg(t, 0.3, 0.33) * (1 - seg(t, 0.44, 0.47));
  const tailTr = trail(0.3, 0.44);
  const stalkTr = Math.max(tailTr, seg(t, 0.66, 0.69) * (1 - seg(t, 0.72, 0.75)));
  const cause = seg(t, 0.08, 0.11) * (1 - seg(t, 0.42, 0.44));
  const tipH = X(map(g.sHT + 4, g.cen(g.sHT)));
  const tipT = X(map(g.sTT - 4, g.cen(g.sTT)));
  const fold = seg(t, 0.08, 0.11) * (1 - seg(t, 0.86, 0.9));
  const tH = g.tangent(g.sHT);
  const tT = g.tangent(g.sTT);

  return (
    <g>
      <FoldBody f={f} kloakaShow={kloakaShow} endoName={gut < 0.5} />
      <Note x={500} y={612} tone="warn" show={seg(t, 0, 0.03) * (1 - seg(t, 0.09, 0.12))}>
        Zeharkako tolespena eta tolespen zefalokaudala aldi berean gertatzen dira
      </Note>
      {RELATIONS.map(([a, b, txt]) => (
        <Note key={a} x={500} y={612} tone="accent" show={seg(t, a, a + 0.02) * (1 - seg(t, b - 0.01, b))}>
          {txt}
        </Note>
      ))}

      {/* cause: longitudinal growth of the CNS pushes both ends (notes) */}
      {cause > 0.02 && (
        <g>
          <Arrow from={tipH} to={[tipH[0] - tH[0] * 46, tipH[1] - tH[1] * 46]} color="#f97316" width={2.6} show={cause} />
          <Arrow from={tipT} to={[tipT[0] + tT[0] * 46, tipT[1] + tT[1] * 46]} color="#f97316" width={2.6} show={cause} />
          <Note x={500} y={588} tone="accent" show={cause}>
            Eragilea: nerbio-sistema zentrala luzetara hazten da → muturrak bentralera makurtzen dira
          </Note>
        </g>
      )}

      {/* the cephalocaudal fold happens at both ends: ringed while the ends curl */}
      <Mark id="tolestura-kraneokaudala" x={tipH[0]} y={tipH[1]} rx={30} show={fold} />
      <Mark id="tolestura-kraneokaudala" x={tipT[0]} y={tipT[1]} rx={30} show={fold} />
      <Label id="tolestura-kraneokaudala" x={190} y={sw(215, 390)} ax={tipH[0]} ay={tipH[1]} show={fold * swO} />

      <SectionPlane f={f} t={t} />

      <Track t={t} id="bihotz-hodia" k="heart" from={0.08} tag={{ dx: 0, dy: -18, align: 'middle', show: headStep }} color="#f87171" show={headTr} />
      <Track t={t} id="mintz-bukofaringeoa" k="bm" from={0.08} color="#e8eefc" show={headTr} />
      <Track t={t} id="kloaka-mintza" k="cm" from={0.3} color="#e8eefc" show={tailTr} />
      <Track t={t} id="alantoidea" k="all" from={0.3} tag={{ dx: 9, dy: 0, align: 'start', show: tailStep }} color="#fde68a" show={tailTr} />
      <Track t={t} id="finkapen-pedikulua" k="stalk" from={0.3} color="#f0a27a" show={stalkTr} />

      {L('amnios-barrunbea', 190, 62, X(map(-0.35 * LH, -NT0 - 40)))}
      {L('ektodermoa', 190, 110, X(map(-0.25 * LH, g.cen(-0.25 * LH) - g.NTe(-0.25 * LH) - 3)))}
      {L('enbrioi-barruko-zeloma', 190, 145, X(fH(LF * 0.88, H0 + ENDO + g.sp(LF) + g.cav(LF * 0.88) * 0.5)), layers * inL, true)}
      {L('hodi-neurala', 190, 180, X(map(-0.6 * LH, g.cen(-0.6 * LH))))}
      {L('paretako-orria', 190, 215, X(fH(LF * 0.85, g.WH(LF * 0.85) - 7.5)), layers * inL, true)}
      {L('aurreko-hestea', 190, sw(390, 250), X(fH(LF * (late ? 0.3 : 0.9), 0)), head * swO)}
      {L('bihotz-hodia', 190, sw(355, 285), heartC, head * swO)}
      {L('errai-orria', 190, 320, X(fH(LF * 0.15, H0 + ENDO + 2.5)), layers * inL, true)}
      {L('estomodeoa', 190, 355, pits[0].c, pit)}
      {L('barrunbe-perikardikoa', 190, sw(285, 470), X(fH(LF * 0.22, H0 + ENDO + g.sp(LF * 0.22) + g.cav(LF * 0.22) * 0.55)), head * swO, true)}
      {L('mintz-bukofaringeoa', 190, sw(250, 430), bmMid, swO)}
      {L('hodi-onfalomesenterikoa', 190, 530, pieces[5][Math.floor(pieces[5].length * 0.12)], at(0.66))}
      {L('bitelo-zaku-sekundarioa', 190, 562, pieces[4][Math.floor(pieces[4].length * 0.62)])}

      {L('notokorda', 810, 150, X(map(0.3 * LH, NT0 + 5)))}
      {L('endodermoa', 810, 110, X(map(lerp(-0.05 * LH, (g.sAIP + g.sCIP) / 2, mv), D_ROOF + 9)), 1 - gut)}
      {L('erdiko-hestea', 810, 110, X(map((g.sAIP + g.sCIP) / 2, D_ROOF + 9)), gut)}
      {/* The long mesoderm name must sit below the toolbar band (y > 234), so it points at the caudal mesoderm. */}
      {L('mesodermo-intraenbrionarioa', 810, 238, X(map(0.7 * LH, NT0 + 9)), layers * inL, true)}
      {L('atzeko-hestea', 810, lerp(214, 190, inL), X(fT(LFT * 0.45, 0)), tail)}
      {L('alantoidea', 810, 265, allC[Math.floor(allC.length * 0.8)], tail)}
      {L('kloaka', 810, 318, X(fT(24, 0)), kloakaShow)}
      {L('proktodeoa', 810, 355, pits[1].c, pit)}
      {L('kloaka-mintza', 810, sw(187, 395), cmMid, swO)}
      {f.cordCran.length > 2 && L('hasierako-zilbor-hestea', 810, 440, f.cordCran[Math.floor(f.cordCran.length * 0.5)], f.cordK, true)}
      {L('finkapen-pedikulua', 810, 490, stalkS[18], tail)}
    </g>
  );
}
