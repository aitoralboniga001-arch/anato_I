'use client';

import { C, Label, Mark, Note, OnTop, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { useId } from 'react';
import { cleavageFrame } from '@/components/shell/intro/cleavage';
import { Hud, vis } from './common';
import { Conceptus, ConceptusDefs } from './conceptus';

/**
 * 4.1 Emakumearen ugal aparatua — the posterior half of the tract cut in the frontal (coronal)
 * plane, seen from inside and behind (course figure "ibilbidea"): ovary with its mature follicle,
 * the tube (interstitial part → isthmus → ampulla → infundibulum → fimbriae) and the uterine
 * wall (perimetrium, myometrium, endometrium). The conceptus travels the route with the timings
 * of the figure: ovulation, fertilization in the ampulla (12–24 h), 2 cells (30 h), morula (3rd
 * day), uterine cavity (4th day), blastocyst (4.5–5) and implantation (5.5–6).
 */

// ---------------------------------------------------------------------------
// Geometry helpers

/** Dense Catmull-Rom samples through the control points. */
function sample(pts: Pt[], per = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const s = k / per;
      const s2 = s * s;
      const s3 = s2 * s;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Unit normal (left of the direction of travel) at each sample. */
function normals(s: Pt[]): Pt[] {
  return s.map((_, i) => {
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(s.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  });
}

const offset = (s: Pt[], n: Pt[], d: number | ((i: number) => number)): Pt[] =>
  s.map((p, i) => {
    const k = typeof d === 'number' ? d : d(i);
    return [p[0] + n[i][0] * k, p[1] + n[i][1] * k];
  });

const poly = (pts: Pt[]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}Z`;
const line = (pts: Pt[]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}`;

/** Point at arc-length fraction u (0..1) of a sampled polyline. */
function at(s: Pt[], u: number): Pt {
  const k = Math.max(0, Math.min(s.length - 1.0001, u * (s.length - 1)));
  const i = Math.floor(k);
  const f = k - i;
  return [lerp(s[i][0], s[i + 1][0], f), lerp(s[i][1], s[i + 1][1], f)];
}

// ---------------------------------------------------------------------------
// The tract

/** Uterine wall: outer border (perimetrium) and luminal surface (endometrium). */
const OUTER = sample([[1000, 30], [770, 38], [652, 80], [600, 150], [610, 300], [638, 460], [666, 640]], 16);
const INNER = sample([[1000, 138], [836, 146], [764, 166], [730, 206], [734, 300], [754, 460], [778, 640]], 16);
const N_IN = normals(INNER); // points into the wall
const N_OUT = normals(OUTER); // points away from the wall
const ENDO = 56;

/** x of a wall border (sampled top → bottom, y increasing) at height y. */
function xAtY(s: Pt[], y: number): number {
  for (let i = 1; i < s.length; i++) if (s[i][1] >= y) return lerp(s[i - 1][0], s[i][0], (y - s[i - 1][1]) / (s[i][1] - s[i - 1][1] || 1));
  return s[s.length - 1][0];
}

/** Point on the endometrial surface closest to height y. */
export function surfaceAt(y: number): { p: Pt; n: Pt } {
  let best = 0;
  INNER.forEach((q, i) => {
    if (Math.abs(q[1] - y) < Math.abs(INNER[best][1] - y)) best = i;
  });
  return { p: INNER[best], n: N_IN[best] };
}

/** Tube centreline from the fimbrial end (u = 0) to the uterine cavity (u = 1). */
function tubePoints(reach: number): Pt[] {
  const mouth: Pt = [lerp(250, 276, reach), lerp(430, 398, reach)];
  const neck: Pt = [lerp(206, 216, reach), lerp(376, 360, reach)];
  return sample([mouth, neck, [177, 300], [178, 214], [212, 146], [282, 106], [372, 94], [462, 108], [540, 132], [602, 152], [666, 168], [742, 190]], 12);
}

/** Outer diameter along the tube: wide infundibulum and ampulla, narrow isthmus and interstitial part. */
const tubeWidth = (u: number) =>
  u < 0.08 ? lerp(66, 52, u / 0.08) : u < 0.52 ? lerp(52, 46, (u - 0.08) / 0.44) : u < 0.66 ? lerp(46, 32, (u - 0.52) / 0.14) : lerp(32, 26, seg(u, 0.8, 0.9));

export const U = { ampulla: 0.2, isthmus: 0.74, interstitial: 0.92 };

/** Parts of the tube along its length (arc fractions from the fimbrial end). */
const TUBE_PARTS: [string, number, number][] = [
  ['infundibulua', 0, 0.08],
  ['anpulua', 0.08, 0.58],
  ['istmoa', 0.58, 0.84],
  ['atal-interstiziala', 0.84, 1],
];

/** Ovarian follicles in growth (inside the ovary, away from the mature follicle). */
const PRIMORDIAL: Pt[] = [[352, 250], [460, 288], [472, 270], [430, 324], [322, 300], [392, 302]];
const PRIMARY: Pt[] = [[446, 262], [338, 280], [404, 332]];
const ANTRAL: [number, number, number][] = [[420, 296, 14], [374, 262, 9]];

/** Closed wavy outline (a folded wall) around c: radius r ± a, k folds, phase ph. */
export function wavy(c: Pt, r: number, a: number, k: number, ph: number) {
  const pts: Pt[] = Array.from({ length: 96 }, (_, i) => {
    const th = (i / 96) * Math.PI * 2;
    const rr = r + a * (0.55 * Math.sin(th * k + ph) + 0.35 * Math.sin(th * (k + 4) + ph * 2.3) + 0.45 * Math.sin(th * 3 + ph * 3.1));
    return [c[0] + Math.cos(th) * rr, c[1] + Math.sin(th) * rr];
  });
  return poly(pts);
}

export interface TractProps {
  /** 0..1 infundibulum and fimbriae sweeping over the ovary (ovulation). */
  reach?: number;
  /** 0 intact mature follicle → 1 ruptured; `luteum` 0..1 corpus luteum. */
  rupture?: number;
  luteum?: number;
  /** Draw the oocyte inside the follicle. */
  oocyteIn?: number;
}

export function Tract({ reach = 0, rupture = 0, luteum = 0, oocyteIn = 1 }: TractProps) {
  const uid = useId().replace(/:/g, '');
  const T = tubePoints(reach);
  const TN = normals(T);
  const w = (i: number) => tubeWidth(i / (T.length - 1)) / 2;
  const tubeOuter = [...offset(T, TN, w), ...offset(T, TN, (i) => -w(i)).reverse()];
  const lum = (i: number) => w(i) * 0.62;
  const tubeLumen = [...offset(T, TN, lum), ...offset(T, TN, (i) => -lum(i)).reverse()];
  // One piece of the tube between arc fractions u0..u1 (its parts, so each can be lit on its own).
  const tubePiece = (u0: number, u1: number) => {
    const n = T.length - 1;
    const a = Math.round(u0 * n);
    const b = Math.round(u1 * n) + 1;
    const s = T.slice(a, b);
    const sn = TN.slice(a, b);
    const wi = (i: number) => w(i + a);
    const li = (i: number) => lum(i + a);
    return {
      walls: [poly([...offset(s, sn, wi), ...offset(s, sn, li).reverse()]), poly([...offset(s, sn, (i) => -li(i)), ...offset(s, sn, (i) => -wi(i)).reverse()])],
      lumen: poly([...offset(s, sn, li), ...offset(s, sn, (i) => -li(i)).reverse()]),
      sides: [line(offset(s, sn, wi)), line(offset(s, sn, (i) => -wi(i)))],
      hi: line(offset(s, sn, (i) => -wi(i) * 0.8)),
    };
  };
  // Pieces are drawn as wall bands + lumen over the whole tube (same colours), so their joins leave no seam.
  const pieces = TUBE_PARTS.filter(([id]) => id !== 'atal-interstiziala').map(([id, u0, u1]) => ({ id, ...tubePiece(u0, u1) }));
  const tubeSides = [line(offset(T, TN, w)), line(offset(T, TN, (i) => -w(i)))];
  // Interstitial part: a canal through the uterine wall (the tube runs under the wall up to its outer
  // surface), its mucosa continuous with the endometrium and its lumen widening into the uterine ostium.
  const iIn = Math.max(0, T.findIndex((p) => p[0] > xAtY(OUTER, p[1])) - 1);
  const iEnd = T.length - 1;
  // Carried a little past the tube's end so the wall clip cuts the ostium along the cavity surface.
  const [ex, ey] = [TN[iEnd][1], -TN[iEnd][0]];
  const CS = [...T.slice(iIn), ...[8, 16, 24].map((d): Pt => [T[iEnd][0] + ex * d, T[iEnd][1] + ey * d])];
  const CN = [...TN.slice(iIn), TN[iEnd], TN[iEnd], TN[iEnd]];
  const k = (i: number) => Math.min(1, i / (iEnd - iIn)); // 0 at the outer surface → 1 at the cavity
  const flare = (i: number) => Math.max(0, (k(i) - 0.62) / 0.38) ** 2;
  const canLum = (i: number) => lum(Math.min(i + iIn, iEnd)) + 9 * flare(i);
  const canMuc = (i: number) => canLum(i) + 4 + 6 * flare(i);
  const canal = {
    muc: poly([...offset(CS, CN, canMuc), ...offset(CS, CN, (i) => -canMuc(i)).reverse()]),
    lum: poly([...offset(CS, CN, canLum), ...offset(CS, CN, (i) => -canLum(i)).reverse()]),
    sides: [line(offset(CS, CN, canLum)), line(offset(CS, CN, (i) => -canLum(i)))],
  };
  // Fimbriae: finger-like fringes around the mouth, spreading over the ovary at ovulation.
  const m = T[0];
  const d = [T[0][0] - T[3][0], T[0][1] - T[3][1]];
  const base = Math.atan2(d[1], d[0]);
  const fingers = Array.from({ length: 9 }, (_, i) => {
    const a = base + (i - 4) * 0.3 * (1 + 0.25 * reach);
    const L = 30 + ((i * 7) % 5) * 5 + 12 * reach;
    const bend = (i % 2 ? 1 : -1) * 6;
    const s: Pt = [m[0] + Math.cos(a) * 18, m[1] + Math.sin(a) * 18];
    const e: Pt = [m[0] + Math.cos(a) * (18 + L), m[1] + Math.sin(a) * (18 + L)];
    const c: Pt = [(s[0] + e[0]) / 2 - Math.sin(a) * bend, (s[1] + e[1]) / 2 + Math.cos(a) * bend];
    return `M${s[0]},${s[1]} Q${c[0]},${c[1]} ${e[0]},${e[1]}`;
  });
  // Uterine layers.
  const wall = poly([...OUTER, ...[...INNER].reverse()]);
  const endoBack = offset(INNER, N_IN, ENDO);
  const endo = poly([...INNER, ...[...endoBack].reverse()]);
  const periIn = offset(OUTER, N_OUT, -8);
  const peri = poly([...OUTER, ...[...periIn].reverse()]);
  // Progestational (secretory) endometrium, as in the course figure: tortuous, corkscrew glands
  // opening on the surface, spiral arteries between them and a darker basal layer.
  const glands = INNER.map((p, i) => ({ p, i }))
    .filter(({ i }) => i % 3 === 1)
    .map(({ p, i }, k) => {
      const n = N_IN[i];
      const tg: Pt = [-n[1], n[0]];
      const depth = ENDO * (0.78 + 0.1 * ((k * 5) % 3));
      const pts: Pt[] = Array.from({ length: 25 }, (_, j) => {
        const s = j / 24;
        const r = 3 + s * depth;
        const zz = Math.sin(s * Math.PI * 6.5 + k * 1.7) * (1.4 + 4.2 * s);
        return [p[0] + n[0] * r + tg[0] * zz, p[1] + n[1] * r + tg[1] * zz];
      });
      return line(pts);
    });
  const arteries = INNER.map((p, i) => ({ p, i }))
    .filter(({ i }) => i % 6 === 4)
    .map(({ p, i }, k) => {
      const n = N_IN[i];
      const tg: Pt = [-n[1], n[0]];
      const pts: Pt[] = Array.from({ length: 31 }, (_, j) => {
        const s = j / 30;
        const r = ENDO + 4 - s * (ENDO - 10);
        const zz = Math.sin(s * Math.PI * 9 + k) * 2.2;
        return [p[0] + n[0] * r + tg[0] * zz, p[1] + n[1] * r + tg[1] * zz];
      });
      return line(pts);
    });
  const basal = poly([...offset(INNER, N_IN, ENDO - 11), ...[...endoBack].reverse()]);
  const fol: Pt = [300, 338];
  const fundus = poly([...OUTER.filter((p) => p[1] < 170), ...INNER.filter((p) => p[1] < 170).reverse()]);
  return (
    <g>
      {/* Uterine cavity (lumen), behind everything else */}
      <Part id="umetoki-barrunbea">
        <path d={poly([...INNER, [1000, 640]])} fill="rgba(255, 214, 226, 0.07)" />
      </Part>

      {/* Ovary: follicles at every stage of growth (primordial → primary → antral), lit from the top left */}
      <radialGradient id={`${uid}-ov`} cx="36%" cy="30%" r="78%">
        <stop offset="0" stopColor="#fff" stopOpacity={0.24} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#2a140a" stopOpacity={0.32} />
      </radialGradient>
      <Part id="obulutegia">
        <ellipse cx={374} cy={292} rx={98} ry={60} transform="rotate(-12 374 292)" fill={C.ovary} stroke="rgba(60,30,20,0.55)" strokeWidth={1.4} />
        <ellipse cx={374} cy={292} rx={98} ry={60} transform="rotate(-12 374 292)" fill="url(#p-stroma)" opacity={0.25} />
        <ellipse cx={374} cy={292} rx={98} ry={60} transform="rotate(-12 374 292)" fill={`url(#${uid}-ov)`} />
        {PRIMORDIAL.map(([x, y], i) => (
          <g key={`p${i}`}>
            <circle cx={x} cy={y} r={3.4} fill="#fbe6d0" stroke="rgba(90,50,30,0.45)" strokeWidth={0.8} />
            <circle cx={x} cy={y} r={1.4} fill={C.oocyte} />
          </g>
        ))}
        {PRIMARY.map(([x, y], i) => (
          <g key={`q${i}`}>
            <circle cx={x} cy={y} r={6.6} fill="#f6dcc0" stroke="rgba(90,50,30,0.5)" strokeWidth={0.9} />
            <circle cx={x} cy={y} r={2.8} fill={C.oocyte} stroke="#c0405e" strokeWidth={0.7} />
          </g>
        ))}
        {ANTRAL.map(([x, y, r], i) => (
          <g key={`a${i}`}>
            <circle cx={x} cy={y} r={r} fill="#f4d9bd" stroke="rgba(90,50,30,0.55)" strokeWidth={1} />
            <circle cx={x + r * 0.14} cy={y - r * 0.1} r={r * 0.64} fill="#fbf3d9" />
            <circle cx={x - r * 0.5} cy={y + r * 0.3} r={r * 0.25} fill={C.oocyte} stroke="#c0405e" strokeWidth={0.8} />
          </g>
        ))}
      </Part>
      {/* Mature follicle bulging at the surface → ruptured → corpus luteum */}
      <Part id="folikulu-heldua" show={1 - luteum}>
        <circle cx={fol[0]} cy={fol[1]} r={32} fill="#fbe6d0" stroke="rgba(90,50,30,0.6)" strokeWidth={1.3} opacity={1 - luteum} />
        <circle cx={fol[0] + 3} cy={fol[1] - 3} r={24} fill="#f7efcf" opacity={(1 - rupture) * (1 - luteum)} />
        <circle cx={fol[0] - 6} cy={fol[1] - 8} r={13} fill="#fff" opacity={0.18 * (1 - rupture) * (1 - luteum)} />
        {oocyteIn > 0.01 && (
          <g opacity={oocyteIn}>
            <circle cx={fol[0] - 13} cy={fol[1] + 13} r={13} fill="#f1d3b4" opacity={0.9} />
            <circle cx={fol[0] - 13} cy={fol[1] + 13} r={9} fill={C.oocyte} stroke="#c0405e" strokeWidth={2} />
          </g>
        )}
        {rupture > 0.01 && <path d={`M${fol[0] - 30},${fol[1] + 12} q-6,${10 * rupture} 4,${18 * rupture}`} stroke="#0b1220" strokeWidth={6 * rupture} fill="none" opacity={1 - luteum} />}
      </Part>
      {/* Corpus luteum: the folded, golden wall of the emptied follicle around its central clot */}
      <Part id="gorputz-luteoa" show={luteum}>
        <g opacity={luteum}>
          <path d={wavy(fol, 29, 1.6, 7, 0)} fill="#efc860" stroke="rgba(120,80,20,0.65)" strokeWidth={1.3} />
          <path d={wavy(fol, 20, 3.2, 9, 0.6)} fill="none" stroke="#b07f22" strokeWidth={1.4} opacity={0.7} />
          <path d={wavy(fol, 11, 2.2, 5, 1.3)} fill="#8f4630" stroke="#6d2f1f" strokeWidth={1} />
          <ellipse cx={fol[0] - 9} cy={fol[1] - 11} rx={10} ry={6} fill="#fff" opacity={0.16} />
        </g>
      </Part>

      {/* Tube: the whole tube, then each of its parts on top (same look, lit one by one in the tour). It runs
          under the uterine wall; its interstitial part is drawn as a canal through the wall further down. */}
      <Part id="umetoki-tronpa">
        <path d={poly(tubeOuter)} fill={C.tube} />
        <path d={poly(tubeLumen)} fill="#3a1b2e" />
        <path d={line(offset(T, TN, (i) => -w(i) * 0.8))} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
        <g fill="none" stroke="rgba(60,10,30,0.6)" strokeWidth={1.3}>
          {tubeSides.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </Part>
      {pieces.map((q) => (
        <Part key={q.id} id={q.id}>
          {q.walls.map((d, i) => (
            <path key={i} d={d} fill={C.tube} />
          ))}
          <path d={q.lumen} fill="#3a1b2e" />
          <path d={q.hi} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
          <g fill="none" stroke="rgba(60,10,30,0.45)" strokeWidth={1}>
            {q.sides.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </Part>
      ))}
      <Part id="finbriak">
        <g fill="none" stroke={C.tube} strokeWidth={8} strokeLinecap="round">
          {fingers.map((f, i) => (
            <path key={i} d={f} />
          ))}
        </g>
        <g fill="none" stroke="rgba(60,10,30,0.45)" strokeWidth={1} strokeLinecap="round">
          {fingers.map((f, i) => (
            <path key={i} d={f} />
          ))}
        </g>
      </Part>

      {/* Uterine wall */}
      <Part id="miometrioa">
        <path d={wall} fill={C.myometrium} />
        <path d={wall} fill="url(#p-muscle)" opacity={0.35} />
      </Part>
      {/* Fundus: the top of the uterine body, above the openings of the tubes */}
      <Part id="umetokiaren-fundusa">
        <path d={fundus} fill={C.myometrium} />
        <path d={fundus} fill="url(#p-muscle)" opacity={0.35} />
      </Part>
      <Part id="perimetrioa">
        <path d={peri} fill={C.perimetrium} opacity={0.9} />
      </Part>
      <Part id="endometrioa">
        <path d={endo} fill={C.stroma} />
        <path d={endo} fill="url(#p-stroma)" opacity={0.18} />
        <path d={basal} fill="rgba(130,40,62,0.2)" />
        <g fill="none" stroke="#c23f5b" strokeWidth={1.6} strokeLinecap="round" opacity={0.85}>
          {arteries.map((g, i) => (
            <path key={i} d={g} />
          ))}
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {glands.map((g, i) => (
            <g key={i}>
              <path d={g} stroke="#b9566f" strokeWidth={7} opacity={0.35} />
              <path d={g} stroke="#fdf2f4" strokeWidth={5.2} />
              <path d={g} stroke="#d27f95" strokeWidth={1.9} />
            </g>
          ))}
        </g>
        <path d={line(INNER)} fill="none" stroke={C.epithelium} strokeWidth={3} />
        <path d={line(offset(INNER, N_IN, 1.2))} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.9} />
      </Part>
      <clipPath id={`${uid}-wall`}>
        {/* 2 px past the outer surface, so the canal overlaps the tube there (no hairline at the join) */}
        <path d={poly([...offset(OUTER, N_OUT, 2), ...[...INNER].reverse()])} />
      </clipPath>
      <Part id="atal-interstiziala">
        <g clipPath={`url(#${uid}-wall)`}>
        <path d={canal.muc} fill={C.tube} opacity={0.92} />
        <path d={canal.lum} fill="#3a1b2e" />
        <g fill="none" stroke="rgba(60,10,30,0.4)" strokeWidth={1}>
          {canal.sides.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        </g>
      </Part>
    </g>
  );
}

// ---------------------------------------------------------------------------
// The journey

export const piece = (tab: [number, number][], t: number) => {
  for (let i = 0; i < tab.length - 1; i++) if (t <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], seg(t, tab[i][0], tab[i + 1][0]));
  return tab[tab.length - 1][1];
};

// Stage time → position along the tube (u), then into the cavity.
export const U_T: [number, number][] = [[0.14, 0], [0.22, U.ampulla], [0.36, U.ampulla + 0.04], [0.42, 0.34], [0.5, 0.66], [0.58, 0.86], [0.64, 1]];
// Stage time → cleavage progress (gens 5), held on each step's number while its caption is read: zygote,
// 2 cells at 30 h (the whole step), 16 on the 3rd day (notes: 12–16), ~32 on the 4th, then the blastocyst.
const P_T: [number, number][] = [[0.24, 0], [0.34, 0.99], [0.42, 2], [0.5, 2], [0.585, 5], [0.62, 5], [0.7, 6], [0.76, 6.15], [0.84, 7]];

const LOUPE: Pt = [520, 472];
const LR = 80;

export function stageOf(t: number): { id: string; hud: [string, string] } {
  if (t < 0.12) return { id: 'obozito-sekundarioa', hud: ['14.', ' eguna'] };
  if (t < 0.24) return { id: 'obozito-sekundarioa', hud: ['14.', ' eguna'] };
  if (t < 0.41) return { id: 'zigotoa', hud: ['12–24', ' ordu'] };
  if (t < 0.5) return { id: 'blastomeroak', hud: ['30', ' ordu'] };
  if (t < 0.56) return { id: 'blastomeroak', hud: ['3.', ' eguna'] };
  if (t < 0.62) return { id: 'morula', hud: ['3.', ' eguna'] };
  if (t < 0.74) return { id: 'morula', hud: ['4.', ' eguna'] };
  if (t < 0.86) return { id: 'blastozistoa', hud: ['4,5–5.', ' egunak'] };
  return { id: 'blastozistoa', hud: ['5,5–6.', ' egunak'] };
}

/** Sperm wait in the isthmus until ovulation, then swim to the ampulla. */
function Sperm({ T, t }: { T: Pt[]; t: number }) {
  const show = Math.min(seg(t, 0.04, 0.08), 1 - seg(t, 0.3, 0.36));
  if (show <= 0.01) return null;
  const go = seg(t, 0.16, 0.28);
  return (
    <g opacity={show} pointerEvents="none">
      {Array.from({ length: 9 }, (_, i) => {
        const u0 = 0.68 + ((i * 37) % 11) * 0.008;
        const u1 = U.ampulla + 0.02 + ((i * 13) % 7) * 0.012;
        const u = lerp(u0, u1, Math.min(1, go * (1 + (i % 3) * 0.12)));
        const p = at(T, u);
        const q = at(T, u + 0.012);
        const a = Math.atan2(p[1] - q[1], p[0] - q[0]);
        const off = ((i % 3) - 1) * 5;
        const x = p[0] - Math.sin(a) * off;
        const y = p[1] + Math.cos(a) * off;
        const wig = Math.sin(t * 90 + i) * 2.4;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI})`}>
            <path d={`M-2,0 q-5,${wig} -10,0 t-8,0`} stroke="#dbe7ff" strokeWidth={1} fill="none" opacity={0.8} />
            <ellipse cx={0} cy={0} rx={2.6} ry={1.7} fill="#dbe7ff" />
          </g>
        );
      })}
    </g>
  );
}

/** The conceptus as it is at stage time t (the live one, and the frozen milestones of the trail). */
function conceptusAt(t: number) {
  const p = piece(P_T, t);
  const f = cleavageFrame(p, 0, 5);
  if (t < 0.24) f.pro.o = 0;
  f.zonaO = Math.min(f.zonaO, 1 - seg(t, 0.64, 0.72));
  return { p, f, corona: 1 - seg(t, 0.34, 0.44), polar: t < 0.5 ? 1 : 0, mass: seg(t, 0.56, 0.62), rot: lerp(0, -47, seg(t, 0.72, 0.84)) };
}

const SITE = surfaceAt(430);
const ATTACH: Pt = [SITE.p[0] - SITE.n[0] * 12, SITE.p[1] - SITE.n[1] * 12];
/** Route through the uterine cavity: from the uterine ostium, free in the cavity, to the wall. */
const CAVITY: Pt[] = [[742, 190], [806, 250], [812, 340], ATTACH];

/**
 * Milestones of the course figure (Langman 3-12): where the conceptus is at each time. Each one is
 * stamped (number + time) on arrival and leaves a frozen copy of itself when the conceptus moves on.
 */
const STATIONS: { time: string; arrive: number; leave: number; snap: number; u?: number; at?: Pt; chip: [number, number, 'start' | 'middle' | 'end'] }[] = [
  { time: '14. eguna', arrive: 0.17, leave: 0.2, snap: 0.18, u: 0.04, chip: [214, 432, 'end'] },
  { time: '12–24 h', arrive: 0.26, leave: 0.37, snap: 0.32, u: U.ampulla, chip: [207, 283, 'start'] },
  { time: '30 h', arrive: 0.42, leave: 0.45, snap: 0.46, u: 0.34, chip: [222, 186, 'start'] },
  { time: '3. eguna', arrive: 0.585, leave: 0.63, snap: 0.6, u: 0.87, chip: [636, 190, 'middle'] },
  { time: '4. eguna', arrive: 0.74, leave: 0.76, snap: 0.74, at: CAVITY[1], chip: [806, 226, 'middle'] },
  { time: '4,5–5 egun', arrive: 0.86, leave: 0.88, snap: 0.86, at: CAVITY[2], chip: [834, 340, 'start'] },
  { time: '5,5–6 egun', arrive: 0.92, leave: 2, snap: 1, at: ATTACH, chip: [786, 470, 'start'] },
];

/** A milestone stamp: its number in a disc and its time; bright while current, quiet once passed. */
function Stamp({ n, time, x, y, align, show, now }: { n: number; time: string; x: number; y: number; align: 'start' | 'middle' | 'end'; show: number; now: number }) {
  if (show <= 0.01) return null;
  const w = 26 + time.length * 6.3;
  const x0 = align === 'start' ? x : align === 'end' ? x - w : x - w / 2;
  return (
    <OnTop>
      <g opacity={show} pointerEvents="none" transform={`translate(${x0} ${y})`}>
        <rect x={0} y={-10} width={w} height={20} rx={10} fill="rgba(10,14,24,0.86)" stroke={`rgba(255,184,107,${0.28 + 0.5 * now})`} strokeWidth={1} />
        <circle cx={10} cy={0} r={7} fill={now > 0.5 ? '#ffb86b' : 'rgba(255,184,107,0.18)'} stroke="#ffb86b" strokeWidth={1} />
        <text x={10} y={3.6} textAnchor="middle" fontSize={10} fontWeight={700} fill={now > 0.5 ? '#1a1206' : '#ffcf99'}>
          {n}
        </text>
        <text x={21} y={4} fontSize={11} fontWeight={600} fill={now > 0.5 ? '#fff4e6' : '#d9cbb8'} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </text>
      </g>
    </OnTop>
  );
}

export function TractJourney({ t }: SceneProps) {
  const reach = seg(t, 0.08, 0.16) * (1 - seg(t, 0.32, 0.42));
  const rupture = seg(t, 0.13, 0.16);
  const luteum = seg(t, 0.28, 0.4);
  const T = tubePoints(reach);

  // Conceptus position.
  const fol: Pt = [287, 351];
  let pos: Pt;
  if (t < 0.14) pos = fol;
  else if (t < 0.64) {
    const u = piece(U_T, t);
    pos = t < 0.17 ? [lerp(fol[0], at(T, 0)[0], seg(t, 0.14, 0.17)), lerp(fol[1], at(T, 0)[1], seg(t, 0.14, 0.17))] : at(T, u);
  } else {
    const route: Pt[] = [T[T.length - 1], CAVITY[1], CAVITY[2], ATTACH];
    const k = piece([[0.64, 0], [0.74, 1], [0.86, 2], [0.94, 3]], t);
    const i = Math.min(2, Math.floor(k));
    const f = k - i;
    pos = [lerp(route[i][0], route[i + 1][0], f), lerp(route[i][1], route[i + 1][1], f)];
  }
  const { p, f, corona, polar, mass, rot } = conceptusAt(t);
  const out = seg(t, 0.14, 0.16);
  const st = stageOf(t);
  const cells = t < 0.36 ? 1 : 2 ** Math.min(5, Math.floor(p) - 1 + (p % 1 > 0.6 ? 1 : 0));
  // Route already travelled through the cavity (drawn as it goes).
  const cavRoute = seg(t, 0.64, 0.94);

  // Magnifier: two tangents from the conceptus to the loupe's rim (a soft cone, no pointer line).
  const dx = pos[0] - LOUPE[0];
  const dy = pos[1] - LOUPE[1];
  const L = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);
  const half = Math.acos(Math.min(1, LR / L));
  const tan1: Pt = [LOUPE[0] + Math.cos(ang + half) * LR, LOUPE[1] + Math.sin(ang + half) * LR];
  const tan2: Pt = [LOUPE[0] + Math.cos(ang - half) * LR, LOUPE[1] + Math.sin(ang - half) * LR];
  const tip: Pt = [pos[0] - (dx / L) * 14, pos[1] - (dy / L) * 14];
  const loupe = seg(t, 0.12, 0.16);

  const anat = vis(t, 0, 0.13);
  const tp = (u: number) => at(T, u);
  const amp = tp(0.16);
  const ist = tp(0.66);
  const inter = tp(0.93);
  const inf = tp(0.035);
  const wallY = (y: number) => surfaceAt(y);
  const endoA = wallY(520);
  const myoA: Pt = [endoA.p[0] + endoA.n[0] * 80, endoA.p[1] + endoA.n[1] * 80 + 36];
  const periA = wallY(588);

  return (
    <g>
      <ConceptusDefs id="w1t" />
      <defs>
        <radialGradient id="w1t-glow">
          <stop offset="0" stopColor="#ffb86b" stopOpacity={0.55} />
          <stop offset="0.45" stopColor="#ffb86b" stopOpacity={0.18} />
          <stop offset="1" stopColor="#ffb86b" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="w1t-lens" cx="42%" cy="36%" r="70%">
          <stop offset="0" stopColor="#16223a" />
          <stop offset="1" stopColor="#0a1120" />
        </radialGradient>
        <linearGradient id="w1t-cone" gradientUnits="userSpaceOnUse" x1={pos[0]} y1={pos[1]} x2={LOUPE[0]} y2={LOUPE[1]}>
          <stop offset="0" stopColor="#ffb86b" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ffb86b" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <clipPath id="w1t-loupe">
        <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} />
      </clipPath>
      <Tract reach={reach} rupture={rupture} luteum={luteum} oocyteIn={1 - out} />
      <Sperm T={T} t={t} />

      {/* Route through the cavity, drawn as the conceptus travels it */}
      {cavRoute > 0.001 && (
        <path d={`M${CAVITY.map((q) => q.join(',')).join(' L')}`} pathLength={1} strokeDasharray={`${cavRoute} 1`} fill="none" stroke="#ffb86b" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} pointerEvents="none" />
      )}

      {/* Milestones already passed: frozen copies of the conceptus where it was (course figure 1-7) */}
      {STATIONS.map((s0, i) => {
        const g = seg(t, s0.leave, s0.leave + 0.03);
        if (g <= 0.01) return null;
        const q = s0.at ?? at(T, s0.u ?? 0);
        const c = conceptusAt(s0.snap);
        return (
          <g key={i} opacity={0.72 * g} pointerEvents="none">
            <Conceptus f={c.f} x={q[0]} y={q[1]} s={0.085} corona={c.corona} polar={c.polar} mass={c.mass} rot={c.rot} id="w1t" tiny />
          </g>
        );
      })}

      {/* The conceptus in the tract, on a soft warm light */}
      {t >= 0.14 && <circle cx={pos[0]} cy={pos[1]} r={30} fill="url(#w1t-glow)" pointerEvents="none" />}
      {t >= 0.14 && (
        <Part id={st.id}>
          <Conceptus f={f} x={pos[0]} y={pos[1]} s={0.085} corona={corona} polar={polar} mass={mass} rot={rot} id="w1t" tiny />
        </Part>
      )}

      {/* Loupe */}
      {loupe > 0.01 && (
        <g opacity={loupe}>
          {L > LR + 30 && (
            <g pointerEvents="none">
              <path d={`M${tip[0]},${tip[1]} L${tan1[0]},${tan1[1]} L${tan2[0]},${tan2[1]}Z`} fill="url(#w1t-cone)" opacity={0.5} />
              <path d={`M${tip[0]},${tip[1]} L${tan1[0]},${tan1[1]} M${tip[0]},${tip[1]} L${tan2[0]},${tan2[1]}`} stroke="#ffb86b" strokeWidth={0.8} opacity={0.32} fill="none" />
            </g>
          )}
          <circle cx={LOUPE[0]} cy={LOUPE[1] + 4} r={LR + 2} fill="#000" opacity={0.35} filter="url(#f-soft)" />
          <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} fill="url(#w1t-lens)" />
          <g clipPath="url(#w1t-loupe)">
            {t < 0.14 ? (
              <g>
                <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} fill="#f3e9c6" opacity={0.25} />
              </g>
            ) : null}
            <Part id={st.id}>
              <Conceptus f={f} x={LOUPE[0]} y={LOUPE[1]} s={0.4} corona={corona} polar={polar} mass={mass} rot={rot} id="w1t" />
            </Part>
            <ellipse cx={LOUPE[0] - 26} cy={LOUPE[1] - 40} rx={44} ry={20} transform={`rotate(-28 ${LOUPE[0] - 26} ${LOUPE[1] - 40})`} fill="#fff" opacity={0.07} pointerEvents="none" />
          </g>
          <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} fill="none" stroke="#ffb86b" strokeWidth={1.6} />
          <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR - 3} fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.12} />
        </g>
      )}

      {/* Milestone stamps: number + time, on arrival */}
      {STATIONS.map((s0, i) => (
        <Stamp key={i} n={i + 1} time={s0.time} x={s0.chip[0]} y={s0.chip[1]} align={s0.chip[2]} show={seg(t, s0.arrive, s0.arrive + 0.025)} now={1 - seg(t, s0.leave, s0.leave + 0.03)} />
      ))}

      {/* Marks: ovulation (the follicle and the fimbriae over it) and implantation */}
      <Mark id="obulazioa" x={292} y={338} rx={78} ry={56} show={vis(t, 0.1, 0.26)} />
      <Mark id="ernalkuntza" x={pos[0]} y={pos[1]} rx={34} color="#fbbf24" show={vis(t, 0.24, 0.4)} />
      <Mark id="habiratzea" x={pos[0] + 6} y={pos[1]} rx={30} show={seg(t, 0.9, 0.94)} />

      {/* Anatomy (first beat) */}
      <Label id="umetoki-tronpa" x={250} y={40} ax={tp(0.42)[0]} ay={tp(0.42)[1] - 20} show={anat} />
      <Label id="anpulua" x={140} y={236} ax={amp[0] - 20} ay={amp[1]} show={Math.max(anat, vis(t, 0.24, 0.36))} />
      <Label id="infundibulua" x={140} y={392} ax={inf[0] - 16} ay={inf[1] - 10} show={anat} />
      <Label id="finbriak" x={140} y={470} ax={inf[0] - 18} ay={inf[1] + 34} show={Math.max(anat, vis(t, 0.1, 0.24))} />
      <Label id="istmoa" x={470} y={40} ax={ist[0]} ay={ist[1] - 12} show={Math.max(anat, vis(t, 0.5, 0.62))} />
      <Label id="atal-interstiziala" x={600} y={236} ax={inter[0]} ay={inter[1] + 6} show={anat} />
      <Label id="obulutegia" x={560} y={300} ax={466} ay={292} align="start" show={Math.max(anat, vis(t, 0.1, 0.24))} />
      <Label id="folikulu-heldua" x={140} y={316} ax={274} ay={330} show={Math.max(anat, vis(t, 0.1, 0.16))} />
      {/* The follicle has just burst: the step's event is named where it happened. */}
      <Label id="obulazioa" x={140} y={316} ax={274} ay={330} show={vis(t, 0.16, 0.24)} />
      <Label id="ernalkuntza" x={140} y={160} ax={pos[0] - 8} ay={pos[1] - 6} show={vis(t, 0.26, 0.36)} />
      <Label id="gorputz-luteoa" x={140} y={316} ax={274} ay={330} show={vis(t, 0.4, 0.62)} />
      <Label id="umetokiaren-fundusa" x={790} y={196} ax={880} ay={80} align="start" show={anat} />
      <Label id="umetoki-barrunbea" x={810} y={262} ax={900} ay={300} align="start" show={Math.max(anat, vis(t, 0.62, 0.74))} />
      <Label id="endometrioa" x={830} y={520} ax={endoA.p[0] + endoA.n[0] * 20} ay={endoA.p[1]} show={Math.max(anat, vis(t, 0.86))} />
      <Label id="miometrioa" x={830} y={556} ax={myoA[0]} ay={myoA[1]} show={anat} />
      <Label id="perimetrioa" x={830} y={592} ax={periA.p[0] + periA.n[0] * 122} ay={periA.p[1]} show={anat} />

      {/* Current stage under the loupe */}
      {t >= 0.12 && <Label id={st.id} x={LOUPE[0]} y={LOUPE[1] + LR + 20} align="middle" show={loupe} />}
      {t >= 0.86 && <Label id="habiratzea" x={830} y={440} ax={pos[0] + 14} ay={pos[1]} align="start" show={seg(t, 0.9, 0.94)} />}

      <Note x={410} y={618} show={vis(t, 0, 0.12)}>Mozketa koronala: umetokia barrutik eta atzetik ikusita</Note>
      <Note x={410} y={618} tone="accent" show={vis(t, 0.12, 0.24)}>Obulazioa: finbriek obulutegia estaltzen dute</Note>
      <Note x={410} y={618} tone="accent" show={vis(t, 0.24, 0.36)}>Ernalkuntza tronparen anpuluan</Note>
      <Note x={410} y={618} tone="accent" show={vis(t, 0.36, 0.5)}>Zatiketak tronpan zehar</Note>
      <Note x={410} y={618} tone="accent" show={vis(t, 0.5, 0.62)}>Morula tronparen istmoan</Note>
      <Note x={410} y={618} tone="accent" show={vis(t, 0.62, 0.74)}>Umetokiaren barrunbean: mintz peluzidoa galtzen du</Note>
      <Note x={410} y={618} tone="accent" show={vis(t, 0.74, 0.86)}>Umetokiaren barrunbean, mintz peluzidorik gabe</Note>
      <Note x={410} y={618} tone="warn" show={vis(t, 0.86)}>Irudian alboko paretan; normalean atzeko (edo aurreko) paretan</Note>

      <Hud value={st.hud[0]} unit={st.hud[1]} caption={t < 0.24 ? 'Ziklo obarikoa' : t < 0.36 ? 'Obulaziotik' : 'Ernalkuntzatik'} second={t >= 0.24 ? ['Zelulak', cells, ''] : undefined} />
    </g>
  );
}

// ---------------------------------------------------------------------------

/** A blastocyst at an implantation site, on a soft light: green = usual place, red = ectopic. */
function Blast({ f, p, show, ok }: { f: ReturnType<typeof cleavageFrame>; p: Pt; show: number; ok?: boolean }) {
  if (show <= 0.01) return null;
  return (
    <g opacity={show}>
      <circle cx={p[0]} cy={p[1]} r={28} fill={ok ? 'url(#w1e-ok)' : 'url(#w1e-bad)'} pointerEvents="none" />
      <Conceptus f={f} x={p[0]} y={p[1]} s={0.11} rot={ok ? -47 : 0} mass={1} id="w1e" tiny />
    </g>
  );
}

/** A tubal pregnancy distends the tube where it implants: a swelling along the tube's direction. */
function Swelling({ T, u, show }: { T: Pt[]; u: number; show: number }) {
  if (show <= 0.01) return null;
  const p = at(T, u);
  const q = at(T, u + 0.02);
  const a = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
  const k = 0.6 + 0.4 * show;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${a}) scale(${k})`} opacity={show} pointerEvents="none">
      <ellipse rx={34} ry={tubeWidth(u) / 2 + 9} fill={C.tube} stroke="rgba(60,10,30,0.6)" strokeWidth={1.3} />
      <ellipse rx={27} ry={tubeWidth(u) / 2 + 2} fill="#4a1c2c" />
      <ellipse rx={27} ry={tubeWidth(u) / 2 + 2} fill="#b4233c" opacity={0.25} />
    </g>
  );
}

/**
 * 4.6 Ezohiko habiratze lekuak: normally the blastocyst implants in the endometrium; sometimes
 * outside the uterus — in the tube, the ovary or the peritoneal cavity (e.g. falling through
 * the abdominal opening of the tube into the pouch of Douglas).
 */
export function EctopicSites({ t: stageT }: SceneProps) {
  // The stage's first steps are about the usual site (shown here too); the ectopic sites are
  // revealed in the step that names them (from .84), so this view never runs ahead of the caption.
  const t = stageT < 0.84 ? (stageT / 0.84) * 0.26 : 0.26 + ((stageT - 0.84) / 0.16) * 0.74;
  const f = cleavageFrame(7, 0, 5);
  f.zonaO = 0;
  const site = surfaceAt(430);
  const T = tubePoints(0);
  const normal: Pt = [site.p[0] - site.n[0] * 12, site.p[1] - site.n[1] * 12];
  const amp = at(T, 0.24);
  const ist = at(T, 0.6);
  const ov: Pt = [420, 300];
  const mouth = at(T, 0);
  const douglas: Pt = [300, 560];
  const fall = seg(t, 0.62, 0.8);
  const fallPos: Pt = [lerp(mouth[0], douglas[0], fall), lerp(mouth[1] + 20, douglas[1], fall)];
  const s1 = seg(t, 0.3, 0.36);
  const s2 = seg(t, 0.42, 0.48);
  const s3 = seg(t, 0.54, 0.6);
  const s4 = seg(t, 0.62, 0.66);
  return (
    <g>
      <ConceptusDefs id="w1e" />
      <defs>
        <radialGradient id="w1e-ok">
          <stop offset="0" stopColor="#86dc9b" stopOpacity={0.55} />
          <stop offset="1" stopColor="#86dc9b" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="w1e-bad">
          <stop offset="0" stopColor="#fb7185" stopOpacity={0.6} />
          <stop offset="1" stopColor="#fb7185" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="w1e-pouch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2b8c6" stopOpacity={0} />
          <stop offset="1" stopColor="#f2b8c6" stopOpacity={0.16} />
        </linearGradient>
      </defs>
      <Tract luteum={1} oocyteIn={0} />
      {/* Peritoneal cavity: the pouch of Douglas lies behind the uterus, below this plane. */}
      <Part id="douglas-zokogunea">
        <g opacity={seg(t, 0.56, 0.62)}>
          <path d="M150,532 C196,604 424,616 474,552 L474,532Z" fill="url(#w1e-pouch)" />
          <path d="M150,532 C196,604 424,616 474,552" fill="none" stroke="rgba(242,184,198,0.55)" strokeWidth={1.6} />
        </g>
      </Part>
      {fall > 0.01 && (
        <path d={`M${mouth[0]},${mouth[1] + 20} Q${mouth[0] + 30},${(mouth[1] + douglas[1]) / 2} ${douglas[0]},${douglas[1]}`} pathLength={1} strokeDasharray={`${fall} 1`} fill="none" stroke="#fb7185" strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
      )}
      <Swelling T={T} u={0.24} show={s1} />
      <Swelling T={T} u={0.6} show={s2} />
      <Blast f={f} p={normal} show={seg(t, 0.14, 0.2)} ok />
      <Mark id="ezohiko-habiratzea" x={amp[0]} y={amp[1]} rx={30} color="#fb7185" show={s1} />
      <Mark id="ezohiko-habiratzea" x={ist[0]} y={ist[1]} rx={30} color="#fb7185" show={s2} />
      <Mark id="ezohiko-habiratzea" x={ov[0]} y={ov[1]} rx={30} color="#fb7185" show={s3} />
      <Mark id="ezohiko-habiratzea" x={fallPos[0]} y={fallPos[1]} rx={30} color="#fb7185" show={s4} />
      <Blast f={f} p={amp} show={s1} />
      <Blast f={f} p={ist} show={s2} />
      <Blast f={f} p={ov} show={s3} />
      <Blast f={f} p={fallPos} show={s4} />

      <Label id="habiratzea" text="Ohiko lekua: endometrioa" x={796} y={440} ax={normal[0] + 22} ay={normal[1]} align="start" show={seg(t, 0.16, 0.2)} />
      <Label id="endometrioa" x={830} y={520} ax={surfaceAt(520).p[0] + 20} ay={520} align="start" show={vis(t, 0, 0.3)} />
      <Label id="anpulua" x={140} y={200} ax={amp[0] - 22} ay={amp[1]} show={s1} />
      <Label id="istmoa" x={470} y={40} ax={ist[0]} ay={ist[1] - 22} show={s2} />
      <Label id="obulutegia" x={560} y={300} ax={ov[0] + 22} ay={ov[1]} align="start" show={s3} />
      <Label id="douglas-zokogunea" text="Peritoneo-barrunbea (Douglas-en zokogunea)" x={252} y={500} ax={douglas[0] - 8} ay={douglas[1] - 16} show={seg(t, 0.8, 0.84)} />
      <Label id="ezohiko-habiratzea" x={40} y={40} align="start" show={seg(t, 0.28, 0.32)} />

      <Note x={410} y={618} show={vis(t, 0, 0.28)}>Normalean blastozistoa umetokiaren endometrioan habiratzen da</Note>
      <Note x={410} y={618} tone="warn" show={vis(t, 0.28, 0.62)}>Ezohikoa: umetokitik kanpo — tronpan edo obulutegian</Note>
      <Note x={410} y={618} tone="warn" show={vis(t, 0.62)}>Tronparen zulotik peritoneo-barrunbera eror daiteke</Note>
    </g>
  );
}
