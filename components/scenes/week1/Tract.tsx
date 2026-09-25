'use client';

import { C, Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
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
const ENDO = 46;

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
  u < 0.08 ? lerp(66, 52, u / 0.08) : u < 0.52 ? lerp(52, 46, (u - 0.08) / 0.44) : u < 0.66 ? lerp(46, 32, (u - 0.52) / 0.14) : u < 0.84 ? 32 : 26;

export const U = { ampulla: 0.2, isthmus: 0.74, interstitial: 0.92 };

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
  const T = tubePoints(reach);
  const TN = normals(T);
  const w = (i: number) => tubeWidth(i / (T.length - 1)) / 2;
  const tubeOuter = [...offset(T, TN, w), ...offset(T, TN, (i) => -w(i)).reverse()];
  const lum = (i: number) => w(i) * 0.62;
  const tubeLumen = [...offset(T, TN, lum), ...offset(T, TN, (i) => -lum(i)).reverse()];
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
  const glands = INNER.filter((_, i) => i % 3 === 1).map((p, k) => {
    const i = INNER.indexOf(p);
    const n = N_IN[i];
    const t: Pt = [-n[1], n[0]];
    const pts: Pt[] = [0, 1, 2, 3, 4, 5].map((j) => {
      const r = 5 + j * 6.2;
      const zz = (j % 2 ? 1 : -1) * (3 + (k % 3));
      return [p[0] + n[0] * r + t[0] * zz, p[1] + n[1] * r + t[1] * zz];
    });
    return line(pts);
  });
  const fol: Pt = [300, 338];
  return (
    <g>
      {/* Ovary */}
      <Part id="obulutegia">
        <ellipse cx={374} cy={292} rx={98} ry={60} transform="rotate(-12 374 292)" fill={C.ovary} stroke="rgba(60,30,20,0.55)" strokeWidth={1.4} />
        <ellipse cx={374} cy={292} rx={98} ry={60} transform="rotate(-12 374 292)" fill="url(#p-stroma)" opacity={0.25} />
        {[
          [420, 262, 9],
          [452, 300, 6],
          [396, 320, 7],
          [348, 262, 5],
          [440, 330, 5],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill="#fbe6d0" stroke="rgba(90,50,30,0.5)" strokeWidth={1} />
            <circle cx={x} cy={y} r={r * 0.35} fill={C.oocyte} stroke="#c0405e" strokeWidth={0.8} />
          </g>
        ))}
      </Part>
      {/* Mature follicle bulging at the surface → ruptured → corpus luteum */}
      <Part id="folikulu-heldua" show={1 - luteum}>
        <circle cx={fol[0]} cy={fol[1]} r={32} fill="#fbe6d0" stroke="rgba(90,50,30,0.6)" strokeWidth={1.3} opacity={1 - luteum} />
        <circle cx={fol[0]} cy={fol[1]} r={24} fill="#f3e9c6" opacity={(1 - rupture) * (1 - luteum)} />
        {oocyteIn > 0.01 && (
          <g opacity={oocyteIn}>
            <circle cx={fol[0] - 10} cy={fol[1] + 10} r={9} fill={C.oocyte} stroke="#c0405e" strokeWidth={2} />
          </g>
        )}
        {rupture > 0.01 && <path d={`M${fol[0] - 30},${fol[1] + 12} q-6,${10 * rupture} 4,${18 * rupture}`} stroke="#0b1220" strokeWidth={6 * rupture} fill="none" opacity={1 - luteum} />}
      </Part>
      <Part id="gorputz-luteoa" show={luteum}>
        <g opacity={luteum}>
          <circle cx={fol[0]} cy={fol[1]} r={30} fill="#f5d77e" stroke="rgba(120,80,20,0.6)" strokeWidth={1.3} />
          <path d={`M${fol[0] - 18},${fol[1] - 6} q8,-14 16,-2 t16,-4 M${fol[0] - 16},${fol[1] + 10} q8,-10 16,0 t14,-6`} stroke="#9a6b16" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      </Part>

      {/* Uterine wall */}
      <Part id="miometrioa">
        <path d={wall} fill={C.myometrium} />
        <path d={wall} fill="url(#p-muscle)" opacity={0.35} />
      </Part>
      <Part id="perimetrioa">
        <path d={peri} fill={C.perimetrium} opacity={0.9} />
      </Part>
      <Part id="endometrioa">
        <path d={endo} fill={C.stroma} />
        <g fill="none" stroke="#fdf2f4" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
          {glands.map((g, i) => (
            <path key={i} d={g} />
          ))}
        </g>
        <path d={line(INNER)} fill="none" stroke={C.epithelium} strokeWidth={3} />
      </Part>
      <Part id="umetokiaren-fundusa" quiet>
        <path d={line(OUTER.slice(0, 20))} fill="none" stroke="transparent" strokeWidth={30} />
      </Part>

      {/* Tube */}
      <Part id="umetoki-tronpa">
        <path d={poly(tubeOuter)} fill={C.tube} stroke="rgba(60,10,30,0.6)" strokeWidth={1.3} />
        <path d={poly(tubeLumen)} fill="#3a1b2e" />
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
    </g>
  );
}

// ---------------------------------------------------------------------------
// The journey

const piece = (tab: [number, number][], t: number) => {
  for (let i = 0; i < tab.length - 1; i++) if (t <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], seg(t, tab[i][0], tab[i + 1][0]));
  return tab[tab.length - 1][1];
};

// Stage time → position along the tube (u), then into the cavity.
const U_T: [number, number][] = [[0.14, 0], [0.22, U.ampulla], [0.36, U.ampulla + 0.04], [0.42, 0.34], [0.5, 0.66], [0.58, 0.86], [0.64, 1]];
// Stage time → cleavage progress (gens 5): zygote, 2 cells at 30 h, 16 on the 3rd day, ~32 on the 4th, blastocyst.
const P_T: [number, number][] = [[0.24, 0], [0.34, 0.99], [0.42, 2], [0.5, 5], [0.62, 5.999], [0.72, 6.4], [0.84, 7]];

const LOUPE: Pt = [520, 472];
const LR = 80;

function stageOf(t: number): { id: string; hud: [string, string] } {
  if (t < 0.12) return { id: 'obozito-sekundarioa', hud: ['14.', ' eguna'] };
  if (t < 0.24) return { id: 'obozito-sekundarioa', hud: ['14.', ' eguna'] };
  if (t < 0.36) return { id: 'zigotoa', hud: ['12–24', ' ordu'] };
  if (t < 0.5) return { id: 'blastomeroak', hud: ['30', ' ordu'] };
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

export function TractJourney({ t }: SceneProps) {
  const reach = seg(t, 0.08, 0.16) * (1 - seg(t, 0.32, 0.42));
  const rupture = seg(t, 0.13, 0.16);
  const luteum = seg(t, 0.28, 0.4);
  const T = tubePoints(reach);

  // Conceptus position.
  const fol: Pt = [290, 348];
  let pos: Pt;
  if (t < 0.14) pos = fol;
  else if (t < 0.64) {
    const u = piece(U_T, t);
    pos = t < 0.17 ? [lerp(fol[0], at(T, 0)[0], seg(t, 0.14, 0.17)), lerp(fol[1], at(T, 0)[1], seg(t, 0.14, 0.17))] : at(T, u);
  } else {
    const site = surfaceAt(430);
    const attach: Pt = [site.p[0] - site.n[0] * 12, site.p[1] - site.n[1] * 12];
    const route: Pt[] = [T[T.length - 1], [806, 250], [812, 340], attach];
    const k = piece([[0.64, 0], [0.74, 1], [0.86, 2], [0.94, 3]], t);
    const i = Math.min(2, Math.floor(k));
    const f = k - i;
    pos = [lerp(route[i][0], route[i + 1][0], f), lerp(route[i][1], route[i + 1][1], f)];
  }
  const p = piece(P_T, t);
  const f = cleavageFrame(p, 0, 5);
  if (t < 0.24) f.pro.o = 0;
  f.zonaO = Math.min(f.zonaO, 1 - seg(t, 0.64, 0.72));
  const corona = 1 - seg(t, 0.34, 0.44);
  const rot = lerp(0, -47, seg(t, 0.72, 0.84));
  const mass = seg(t, 0.56, 0.62);
  const out = seg(t, 0.14, 0.16);
  const st = stageOf(t);
  const cells = t < 0.36 ? 1 : 2 ** Math.min(5, Math.floor(p) - 1 + (p % 1 > 0.6 ? 1 : 0));

  // Loupe leader: from the loupe rim towards the conceptus.
  const dx = pos[0] - LOUPE[0];
  const dy = pos[1] - LOUPE[1];
  const L = Math.hypot(dx, dy) || 1;
  const rim: Pt = [LOUPE[0] + (dx / L) * LR, LOUPE[1] + (dy / L) * LR];
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
      <clipPath id="w1t-loupe">
        <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} />
      </clipPath>
      <Tract reach={reach} rupture={rupture} luteum={luteum} oocyteIn={1 - out} />
      <Sperm T={T} t={t} />

      {/* Stations already passed (as in the course figure). */}
      {[0.22, 0.34, 0.42, 0.5, 0.64].map((a) => {
        if (t < a + 0.02) return null;
        const q = a < 0.64 ? at(T, piece(U_T, a)) : T[T.length - 1];
        return <circle key={a} cx={q[0]} cy={q[1]} r={3} fill="#ffb86b" opacity={0.45} />;
      })}

      {/* The conceptus in the tract */}
      {t >= 0.14 && <Conceptus f={f} x={pos[0]} y={pos[1]} s={0.085} corona={corona} polar={t < 0.5 ? 1 : 0} mass={mass} rot={rot} id="w1t" tiny />}
      {t >= 0.14 && <circle cx={pos[0]} cy={pos[1]} r={20} fill="none" stroke="#ffb86b" strokeWidth={1.4} opacity={0.8} />}

      {/* Loupe */}
      {loupe > 0.01 && (
        <g opacity={loupe}>
          <line x1={rim[0]} y1={rim[1]} x2={pos[0] - (dx / L) * 20} y2={pos[1] - (dy / L) * 20} stroke="#ffb86b" strokeWidth={1} strokeDasharray="3 4" opacity={0.7} />
          <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} fill="#0d1526" />
          <g clipPath="url(#w1t-loupe)">
            {t < 0.14 ? (
              <g>
                <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} fill="#f3e9c6" opacity={0.25} />
              </g>
            ) : null}
            <Conceptus f={f} x={LOUPE[0]} y={LOUPE[1]} s={0.4} corona={corona} polar={t < 0.5 ? 1 : 0} mass={mass} rot={rot} id="w1t" />
          </g>
          <circle cx={LOUPE[0]} cy={LOUPE[1]} r={LR} fill="none" stroke="#ffb86b" strokeWidth={1.6} />
        </g>
      )}

      {/* Anatomy (first beat) */}
      <Label id="umetoki-tronpa" x={250} y={40} ax={tp(0.42)[0]} ay={tp(0.42)[1] - 20} show={anat} />
      <Label id="anpulua" x={140} y={236} ax={amp[0] - 20} ay={amp[1]} show={anat} />
      <Label id="infundibulua" x={140} y={392} ax={inf[0] - 16} ay={inf[1] - 10} show={anat} />
      <Label id="finbriak" x={140} y={470} ax={inf[0] - 18} ay={inf[1] + 34} show={Math.max(anat, vis(t, 0.1, 0.24))} />
      <Label id="istmoa" x={470} y={40} ax={ist[0]} ay={ist[1] - 12} show={Math.max(anat, vis(t, 0.5, 0.62))} />
      <Label id="atal-interstiziala" x={600} y={236} ax={inter[0]} ay={inter[1] + 6} show={anat} />
      <Label id="obulutegia" x={560} y={300} ax={466} ay={292} align="start" show={Math.max(anat, vis(t, 0.1, 0.24))} />
      <Label id="folikulu-heldua" x={140} y={316} ax={274} ay={330} show={Math.max(anat, vis(t, 0.1, 0.16))} />
      <Label id="gorputz-luteoa" x={140} y={316} ax={274} ay={330} show={vis(t, 0.4, 0.62)} />
      <Label id="umetokiaren-fundusa" x={790} y={196} ax={880} ay={80} align="start" show={anat} />
      <Label id="umetoki-barrunbea" x={810} y={262} ax={900} ay={300} align="start" show={anat} />
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

/** A blastocyst at an implantation site: green ring = usual place, dashed red = ectopic. */
function Mark({ f, p, show, ok }: { f: ReturnType<typeof cleavageFrame>; p: Pt; show: number; ok?: boolean }) {
  if (show <= 0.01) return null;
  return (
    <g opacity={show}>
      <circle cx={p[0]} cy={p[1]} r={21} fill="none" stroke={ok ? '#86dc9b' : '#fb7185'} strokeWidth={2} strokeDasharray={ok ? undefined : '4 3'} />
      <Conceptus f={f} x={p[0]} y={p[1]} s={0.11} rot={ok ? -47 : 0} mass={1} id="w1e" tiny />
    </g>
  );
}

/**
 * 4.6 Ezohiko habiratze lekuak: normally the blastocyst implants in the endometrium; sometimes
 * outside the uterus — in the tube, the ovary or the peritoneal cavity (e.g. falling through
 * the abdominal opening of the tube into the pouch of Douglas).
 */
export function EctopicSites({ t }: SceneProps) {
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
      <Tract luteum={1} oocyteIn={0} />
      {/* Peritoneal cavity: the pouch of Douglas lies behind the uterus, below this plane. */}
      <Part id="douglas-zokogunea">
        <path d="M150,540 C200,600 420,612 470,560" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} strokeDasharray="5 6" opacity={seg(t, 0.56, 0.62)} />
      </Part>
      {fall > 0.01 && fall < 0.99 && (
        <path d={`M${mouth[0]},${mouth[1] + 20} Q${mouth[0] + 30},${(mouth[1] + douglas[1]) / 2} ${douglas[0]},${douglas[1]}`} fill="none" stroke="#fb7185" strokeWidth={1.4} strokeDasharray="3 5" opacity={0.7} />
      )}
      <Mark f={f} p={normal} show={seg(t, 0.14, 0.2)} ok />
      <Mark f={f} p={amp} show={s1} />
      <Mark f={f} p={ist} show={s2} />
      <Mark f={f} p={ov} show={s3} />
      <Mark f={f} p={fallPos} show={s4} />

      <Label id="habiratzea" text="Ohiko lekua: endometrioa" x={796} y={440} ax={normal[0] + 22} ay={normal[1]} align="start" show={seg(t, 0.16, 0.2)} />
      <Label id="endometrioa" x={830} y={520} ax={surfaceAt(520).p[0] + 20} ay={520} align="start" show={vis(t, 0, 0.3)} />
      <Label id="anpulua" x={140} y={200} ax={amp[0] - 22} ay={amp[1]} show={s1} />
      <Label id="istmoa" x={470} y={40} ax={ist[0]} ay={ist[1] - 22} show={s2} />
      <Label id="obulutegia" x={560} y={300} ax={ov[0] + 22} ay={ov[1]} align="start" show={s3} />
      <Label id="douglas-zokogunea" text="Peritoneo-barrunbea (Douglas-en zokogunea)" x={40} y={500} ax={douglas[0] - 10} ay={douglas[1] - 18} align="start" show={seg(t, 0.8, 0.84)} />
      <Label id="ezohiko-habiratzea" x={40} y={40} align="start" show={seg(t, 0.28, 0.32)} />

      <Note x={410} y={618} show={vis(t, 0, 0.28)}>Normalean blastozistoa umetokiaren endometrioan habiratzen da</Note>
      <Note x={410} y={618} tone="warn" show={vis(t, 0.28, 0.62)}>Ezohikoa: umetokitik kanpo — tronpan edo obulutegian</Note>
      <Note x={410} y={618} tone="warn" show={vis(t, 0.62)}>Tronparen zulotik peritoneo-barrunbera eror daiteke</Note>
    </g>
  );
}
