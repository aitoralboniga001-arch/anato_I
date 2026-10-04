'use client';

import { C, Flow, Label, Mark, Note, Part, bezier, clamp, lerp, rand, seg, smoothPath, tube, type Pt, type SceneProps } from '@/components/kit';
import type { Curve } from '@/lib/sim/geometry';
import { CellPaths, K, W3bDefs, newBatch, pd, wallCells, type P } from '@/components/scenes/week3-villi/art';

/**
 * Topic 6 — the chorionic sac as a whole (stage `biloxka-askeak`), drawn with the week-3 villus
 * tissue: every villus has a syncytial rim, a cytotrophoblast layer, a connective (extra-embryonic
 * mesoderm) core and a capillary loop. Stem villi run from the chorionic plate to the cytotrophoblastic
 * shell; their branches (free villi) get smaller generation by generation and fill the intervillous
 * space. From month 4 the free villi thin — the smallest first — while the stem villi never do.
 * Views: `korion-zakua` (ChorionicSac) and `zirkulazioa` (SacCirculation, same sac with the fetal
 * vessels picked out).
 * Beats: 0 stems branch · .16 free villi fill the space · .34 the barrier thins (small first) ·
 * .5 two layers (other view) · .66 stem villi never thin · .8 the extra-embryonic circulation.
 */
const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

const BLUE = '#3554b8';
const RED = '#d3283f';
const CX = 500;
const CY = 336;
const R4 = 132; // chorionic cavity
const R3 = 160; // chorionic plate (outer face)
const R1 = 232; // villi reach the shell here
const RS = 244; // shell outer face
const RA = R4 + 9; // arterial ring in the plate
const RV = R4 + 19; // venous ring in the plate
/** Stem villi (deg, 0 = right, clockwise): ten, the top pair leaving room for the spiral arteries. */
const STEMS = [-126, -54, -18, 18, 54, 90, 126, 162, 198, 234];

const polar = (deg: number, r: number): Pt => [CX + Math.cos((deg * Math.PI) / 180) * r, CY + Math.sin((deg * Math.PI) / 180) * r];
const circleD = (r: number) => `M${CX - r},${CY}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
const ringD = (r0: number, r1: number) => circleD(r1) + circleD(r0);
const arcPts = (r: number, a0: number, a1: number, n = 48): P[] => Array.from({ length: n + 1 }, (_, i) => polar(a0 + ((a1 - a0) * i) / n, r) as P);

/* ------------------------------------------------------------------ */
/* Villus geometry                                                    */
/* ------------------------------------------------------------------ */

interface Twig {
  /** Centre line, u = 0 at the free tip (or the shell end of a stem), u = 1 at the base. */
  c: Curve;
  hw: (u: number) => number;
  gen: 0 | 1 | 2 | 3;
  cap: boolean;
  side: number;
  seed: number;
}

const tangent = (s: { nx: number; ny: number }): Pt => [-s.ny, s.nx];

/** A branch leaving curve `c` at u, `side` ±1, angle `ang` (rad) off the tangent towards the tip. */
function branchOff(parent: Curve, u: number, side: number, ang: number, len: number, hw: number, gen: 1 | 2 | 3, seed: number): Twig {
  const q = parent(u);
  const T = tangent(q); // points towards u = 0 of the parent, i.e. the parent's tip
  const tx = -T[0];
  const ty = -T[1];
  const dx = tx * Math.cos(ang) + q.nx * side * Math.sin(ang);
  const dy = ty * Math.cos(ang) + q.ny * side * Math.sin(ang);
  const base: Pt = [q.x, q.y];
  const tip: Pt = [q.x + dx * len, q.y + dy * len];
  const bend = (rand(seed * 1.7) - 0.5) * len * 0.22;
  const c = bezier(tip, [lerp(tip[0], base[0], 0.33) - dy * bend, lerp(tip[1], base[1], 0.33) + dx * bend], [lerp(tip[0], base[0], 0.68) - dy * bend * 0.5, lerp(tip[1], base[1], 0.68) + dx * bend * 0.5], base);
  return { c, hw: (v) => hw * (0.86 + 0.14 * v) + hw * 0.5 * Math.max(0, (v - 0.82) / 0.18) ** 2, gen, cap: true, side, seed };
}

/** The villous tree of one stem: generations grow in with g1, g2, g3 (0..1). */
function stemTree(deg: number, g1: number, g2: number, g3: number): Twig[] {
  const base = polar(deg, R3 - 3);
  const tip = polar(deg, R1 + 4);
  const bend = (rand(deg * 0.37 + 2) - 0.5) * 18;
  const px = -Math.sin((deg * Math.PI) / 180);
  const py = Math.cos((deg * Math.PI) / 180);
  const c = bezier(
    tip,
    [lerp(tip[0], base[0], 0.33) + px * bend, lerp(tip[1], base[1], 0.33) + py * bend],
    [lerp(tip[0], base[0], 0.66) - px * bend * 0.6, lerp(tip[1], base[1], 0.66) - py * bend * 0.6],
    base,
  );
  const stem: Twig = { c, hw: (u) => 6.4 + 3.6 * Math.max(0, (u - 0.75) / 0.25) ** 2 + 3.4 * Math.max(0, 1 - u / 0.16) ** 2, gen: 0, cap: false, side: 0, seed: deg };
  const out: Twig[] = [stem];
  if (g1 <= 0.02) return out;
  const first = rand(deg * 3.1) > 0.5 ? 1 : -1;
  [0.3, 0.52, 0.72].forEach((u, i) => {
    const side = i % 2 ? -first : first;
    const s = deg * 7 + i * 13;
    const b1 = branchOff(c, u, side, 0.86 + rand(s) * 0.2, (25 + rand(s + 1) * 10) * g1, 4.8, 1, s);
    out.push(b1);
    if (g2 <= 0.02) return;
    [0.42, 0.7].forEach((v, k) => {
      const s2 = s * 3 + k * 5;
      const b2 = branchOff(b1.c, v, k ? -side : side, 0.8 + rand(s2) * 0.3, (12 + rand(s2 + 2) * 5) * g2 * g1, 3.6, 2, s2);
      out.push(b2);
      if (g3 <= 0.02 || k) return;
      out.push(branchOff(b2.c, 0.4, -side, 0.9, (8 + rand(s2 + 4) * 3) * g3 * g2, 2.8, 3, s2 + 9));
    });
  });
  return out;
}

/** Thinning of one villus (0..1): the smallest generation first, stem villi never. */
const thinOf = (gen: number, t: number) => (gen === 0 ? 0 : gen >= 2 ? seg(t, 0.34, 0.44) : seg(t, 0.4, 0.52));

interface Layers {
  shadow: string;
  syn: string;
  cyto: string;
  meso: string;
  edge: string;
  capA: string;
  capV: string;
}
const emptyLayers = (): Layers => ({ shadow: '', syn: '', cyto: '', meso: '', edge: '', capA: '', capV: '' });

/** Add one villus (nested tubes + its capillary loop) to the layer strings. */
function addTwig(L: Layers, tw: Twig, thin: number) {
  const n = tw.gen === 0 ? 28 : 14;
  const synT = lerp(tw.gen === 0 ? 1.7 : 1.15, 0.7, thin);
  const cytoT = lerp(tw.gen === 0 ? 1.6 : 1.0, 0, thin);
  const outer = tube(tw.c, tw.hw, 0, 1, n, tw.cap);
  L.shadow += outer.d;
  L.syn += outer.d;
  L.edge += outer.d;
  L.cyto += tube(tw.c, (u) => Math.max(0.4, tw.hw(u) - synT), 0, 1, n, tw.cap).d;
  L.meso += tube(tw.c, (u) => Math.max(0.3, tw.hw(u) - synT - cytoT), 0, 1, n, tw.cap).d;
  // Capillary loop: arterial leg on one side, venous on the other; from month 4 they dilate and press
  // against the thinned wall.
  const k = lerp(0.36, 0.5, thin);
  const u0 = tw.cap ? 0.07 : 0;
  const leg = (sgn: number) =>
    Array.from({ length: 11 }, (_, i) => {
      const u = 1 - ((1 - u0) * i) / 10;
      const s = tw.c(u);
      const w = tw.hw(Math.min(u, 0.8)) * k;
      return [s.x + s.nx * w * sgn, s.y + s.ny * w * sgn] as Pt;
    });
  const a = leg(tw.side >= 0 ? 1 : -1);
  const v = leg(tw.side >= 0 ? -1 : 1);
  if (tw.cap) {
    const s = tw.c(0.035);
    a.push([s.x, s.y]);
    v.push([s.x, s.y]);
  }
  if (tw.gen === 0) {
    // Stems: the legs carry on down to the plate vessels.
    const s1 = tw.c(1);
    const T = tangent(s1);
    const dir = [-T[0], -T[1]];
    const ext = (p: Pt, r: number): Pt => {
      const d = Math.hypot(p[0] - CX, p[1] - CY);
      return [p[0] + dir[0] * (d - r), p[1] + dir[1] * (d - r)];
    };
    a.unshift(ext(a[0], RA));
    v.unshift(ext(v[0], RV));
  }
  L.capA += smoothPath(a, false, 0.5);
  L.capV += smoothPath(v, false, 0.5);
}

/** Free villi cut across, floating in the intervillous space (they leave the plane of section). */
const FLOATERS = Array.from({ length: 44 }, (_, k) => {
  const a = rand(k * 2.3 + 0.4) * 360;
  const near = STEMS.some((s) => Math.abs(((a - s + 540) % 360) - 180) < 7);
  const r = lerp(R3 + 14, R1 - 10, rand(k * 5.1 + 1));
  const p = polar(a, r);
  return { x: p[0], y: p[1], r: 4 + rand(k * 3.7) * 2.4, rot: rand(k * 1.9) * 180, near, at: rand(k * 7.3) };
}).filter((f) => !f.near && !(f.y < CY - R1 + 40 && Math.abs(f.x - CX) < 50));

/** The cytotrophoblastic shell: one ring of cells. */
const SHELL = (() => {
  const b = newBatch();
  wallCells(b, arcPts(RS - 0.5, -90, 270, 180), RS - R1 - 1, 9.5, { fit: true });
  return b;
})();

/* ------------------------------------------------------------------ */
/* The sac                                                            */
/* ------------------------------------------------------------------ */

type Mode = 'sac' | 'circ';

function SacDrawing({ t, reduced, mode }: SceneProps & { mode: Mode }) {
  const g1 = mode === 'circ' ? 1 : seg(t, 0, 0.1);
  const g2 = mode === 'circ' ? 1 : seg(t, 0.05, 0.15);
  const g3 = mode === 'circ' ? 1 : seg(t, 0.16, 0.3);
  const stems = emptyLayers();
  const free = emptyLayers();
  for (const deg of STEMS) {
    for (const tw of stemTree(deg, g1, g2, g3)) addTwig(tw.gen === 0 ? stems : free, tw, thinOf(tw.gen, t));
  }
  const floatT = thinOf(2, t);
  const floats = FLOATERS.map((f) => ({ ...f, s: clamp((g3 - f.at * 0.6) / 0.4) }))
    .filter((f) => f.s > 0.05)
    .map((f) => ({ ...f, R: f.r * f.s }));
  const floatD = (k: number) => floats.map((f) => `M${f.x - f.R * k},${f.y}a${f.R * k},${f.R * k} 0 1,0 ${2 * f.R * k},0a${f.R * k},${f.R * k} 0 1,0 ${-2 * f.R * k},0Z`).join('');
  const circ = mode === 'circ';
  // In the circulation view every villus is simply a tertiary villus (vessels inside).
  const freeId = circ || t < 0.16 ? 'biloxka-tertziarioa' : 'biloxka-askea';
  const stemId = circ ? 'biloxka-tertziarioa' : 'biloxka-enborra';
  const meheketa = mode === 'sac' ? seg(t, 0.34, 0.4) * (1 - seg(t, 0.62, 0.66)) : 0;
  const villi = (L: Layers, wid: string, withFloats: boolean) => (
    <Part id={wid}>
      <path d={L.syn + (withFloats ? floatD(1) : '')} fill="url(#w3b-syn)" />
      <path d={L.cyto + (withFloats ? floatD(1 - lerp(0.3, 0.2, floatT)) : '')} fill={K.cytoGround} />
      <path d={L.meso + (withFloats ? floatD(lerp(0.42, 0.75, floatT)) : '')} fill={K.meso} />
      <path d={L.capA} fill="none" stroke={circ ? BLUE : '#8f3a64'} strokeWidth={circ ? 1.5 : 1.1} strokeLinejoin="round" opacity={circ ? 1 : 0.85} />
      <path d={L.capV} fill="none" stroke={circ ? RED : '#c2334d'} strokeWidth={circ ? 1.5 : 1.1} strokeLinejoin="round" opacity={circ ? 1 : 0.85} />
      <path d={L.edge + (withFloats ? floatD(1) : '')} fill="none" stroke={K.synEdge} strokeWidth={0.9} />
    </Part>
  );
  const artDeg = [-98, -82];
  const veinDeg = -126 + 18;
  const artPath = (deg: number, i: number) => {
    const p0 = polar(deg, RS + 2);
    const top: Pt = [p0[0] + (i ? 14 : -14), 24];
    const pts: Pt[] = Array.from({ length: 9 }, (_, k) => {
      const u = k / 8;
      return [lerp(top[0], p0[0], u) + Math.sin(u * Math.PI * 3.2 + i) * 7 * (1 - u * 0.6), lerp(top[1], p0[1], u)];
    });
    return pts;
  };
  const vein = (() => {
    const p0 = polar(veinDeg, RS + 2);
    return [p0, [p0[0] - 10, p0[1] - 24], [p0[0] - 6, p0[1] - 48], [p0[0] - 16, 24]] as Pt[];
  })();
  const stalkTop = polar(-90, R4 - 1);
  const stalk = tube(bezier([stalkTop[0], stalkTop[1]], [CX, stalkTop[1] + 18], [CX - 4, CY - 92], [CX - 2, CY - 70]), (u) => 7 + 9 * Math.max(0, 1 - u / 0.35) ** 2, 0, 1, 24);
  return (
    <g>
      {/* Endometrium round the sac: basal decidua over the embryonic pole, capsular decidua over the rest. */}
      <Part id="dezidua-basala">
        <path d={pd([...arcPts(RS + 30, -164, -16), ...arcPts(RS, -16, -164)], true)} fill="url(#p-decidua)" />
        <path d={pd([...arcPts(RS + 30, -164, -16), ...arcPts(RS, -16, -164)], true)} fill="#000" opacity={0.12} />
      </Part>
      <Part id="dezidua-kapsularra">
        <path d={pd([...arcPts(RS + 11, -16, 196), ...arcPts(RS, 196, -16)], true)} fill="url(#p-decidua)" />
        <path d={pd(arcPts(RS + 11, -16, 196))} fill="none" stroke="#e7a3a3" strokeWidth={1.2} opacity={0.6} />
      </Part>

      <Part id="biloxka-arteko-espazioa">
        <path d={ringD(R3 - 4, R1 + 2)} fill="url(#w3b-blood)" fillRule="evenodd" />
        <path d={ringD(R3 - 4, R1 + 2)} fill="url(#w6s-ivs)" fillRule="evenodd" />
      </Part>
      <Part id="kanpoko-zorro-zitotrofoblastikoa">
        <path d={ringD(R1, RS)} fill={K.cytoGround} fillRule="evenodd" />
        <CellPaths b={SHELL} />
      </Part>

      {/* maternal blood: spiral arteries open into the intervillous space, veins drain it */}
      <Part id="arteria-espiralak">
        {artDeg.map((d, i) => {
          const p = smoothPath(artPath(d, i), false, 0.5);
          return (
            <g key={i} fill="none" strokeLinecap="round">
              <path d={p} stroke="#5b1222" strokeWidth={8} />
              <path d={p} stroke="#c9314f" strokeWidth={6} />
              <path d={p} stroke="#f0566f" strokeWidth={2.6} />
            </g>
          );
        })}
      </Part>
      <Part id="endometrio-zainak">
        <path d={smoothPath(vein, false, 0.5)} fill="none" stroke="#1d2a5c" strokeWidth={9} strokeLinecap="round" />
        <path d={smoothPath(vein, false, 0.5)} fill="none" stroke={C.vein} strokeWidth={7} strokeLinecap="round" />
      </Part>

      <g fill={K.shadow} transform="translate(2.5 3)" pointerEvents="none">
        <path d={stems.shadow + free.shadow} />
      </g>
      {villi(free, freeId, true)}
      {villi(stems, stemId, false)}
      {meheketa > 0.01 && (
        <Part id="karena-mugaren-meheketa">
          <path d={free.edge + floatD(1)} fill="none" stroke="#fde68a" strokeWidth={0.9} opacity={0.6 * meheketa} />
        </Part>
      )}
      {circ && (
        <Part id="sinzitiotrofoblastoa">
          <path d={stems.edge + free.edge + floatD(1)} fill="none" stroke="#7fe0ad" strokeWidth={1} opacity={0.55} />
        </Part>
      )}

      {/* Chorionic plate: mesoderm with the chorionic vessels, its villous face lined by trophoblast. */}
      <Part id="korion-plaka">
        <path d={ringD(R4, R3)} fill={K.meso} fillRule="evenodd" />
        <path d={ringD(R4, R3)} fill="url(#p-meso-extra)" fillRule="evenodd" opacity={0.8} />
        <circle cx={CX} cy={CY} r={R3 - 2.2} fill="none" stroke={K.cytoGround} strokeWidth={2.6} />
        <circle cx={CX} cy={CY} r={R3 - 0.4} fill="none" stroke={C.syncytio} strokeWidth={2.2} />
      </Part>
      <Part id={circ ? 'enbrioi-kanpoko-zirkulazioa' : 'korion-plaka'}>
        {[
          { r: RA, c: BLUE },
          { r: RV, c: RED },
        ].map((v) => (
          <g key={v.r} fill="none">
            <circle cx={CX} cy={CY} r={v.r} stroke="#5e1d2f" strokeWidth={circ ? 6.4 : 5} />
            <circle cx={CX} cy={CY} r={v.r} stroke={K.endo} strokeWidth={circ ? 5 : 3.8} />
            <circle cx={CX} cy={CY} r={v.r} stroke={circ ? v.c : v.c === BLUE ? '#8f3a64' : '#c2334d'} strokeWidth={circ ? 3 : 2.2} />
          </g>
        ))}
      </Part>

      <Part id="korion-barrunbea">
        <circle cx={CX} cy={CY} r={R4} fill="#0f1729" />
        <circle cx={CX} cy={CY} r={R4} fill="url(#w6s-cavity)" />
        <circle cx={CX} cy={CY} r={R4 - 1} fill="none" stroke="#e9a084" strokeWidth={1.4} opacity={0.55} />
      </Part>

      {/* Embryo in its amnion, hanging from the connecting stalk; the yolk sac below. */}
      <Part id="finkapen-pedikulua">
        <path d={stalk.d} fill={K.meso} />
        <g fill="none" stroke={K.mesoEdge} strokeWidth={1}>
          <path d={stalk.left} />
          <path d={stalk.right} />
        </g>
      </Part>
      <Part id="zilbor-hodiak">
        <path d={`M${CX - 2.4},${CY - RA} C${CX - 2.4},${CY - 110} ${CX - 6},${CY - 92} ${CX - 4.4},${CY - 64}`} fill="none" stroke={circ ? BLUE : '#8f3a64'} strokeWidth={circ ? 2.2 : 1.6} />
        <path d={`M${CX + 2.4},${CY - RV} C${CX + 2.4},${CY - 110} ${CX - 1},${CY - 92} ${CX + 0.4},${CY - 64}`} fill="none" stroke={circ ? RED : '#c2334d'} strokeWidth={circ ? 2.2 : 1.6} />
      </Part>
      <Part id="bitelo-zaku-sekundarioa">
        <path d={`M${CX + 10},${CY - 18} Q${CX + 18},${CY + 8} ${CX + 22},${CY + 22}`} fill="none" stroke="#d9a63a" strokeWidth={2} />
        <circle cx={CX + 26} cy={CY + 36} r={17} fill="#f2c14e" stroke="#b9862a" strokeWidth={1.4} />
        <circle cx={CX + 26} cy={CY + 36} r={17} fill="url(#w3b-ball)" />
      </Part>
      <Part id="amnios-barrunbea">
        <ellipse cx={CX - 4} cy={CY - 36} rx={30} ry={36} fill="#16233d" stroke="#9fc3e6" strokeWidth={2} />
      </Part>
      {/* the embryo (C-shaped, 2nd month) */}
      <g pointerEvents="none">
        <path d={`M${CX - 2},${CY - 62} C${CX + 18},${CY - 60} ${CX + 20},${CY - 30} ${CX + 8},${CY - 14} C${CX - 2},${CY - 2} ${CX - 22},${CY - 8} ${CX - 22},${CY - 26} C${CX - 22},${CY - 34} ${CX - 14},${CY - 38} ${CX - 10},${CY - 32} C${CX - 6},${CY - 26} ${CX - 2},${CY - 34} ${CX - 8},${CY - 44} C${CX - 12},${CY - 52} ${CX - 10},${CY - 62} ${CX - 2},${CY - 62}Z`} fill="#f2b3a6" stroke="#b9786a" strokeWidth={1.2} />
        <circle cx={CX - 4} cy={CY - 52} r={2.2} fill="#5b2f2a" opacity={0.7} />
      </g>

      {!reduced && (
        <g pointerEvents="none">
          {artDeg.map((d, i) => {
            const pts = artPath(d, i);
            const end = pts[pts.length - 1];
            const dir = i ? 1 : -1;
            const inn = polar(d + dir * 10, R3 + 22);
            return (
              <g key={i}>
                <Flow d={smoothPath(pts, false, 0.5)} n={3} dur={4} r={2} color="#ffc2cc" reduced={reduced} />
                <Flow d={`M${end[0]},${end[1]} Q${end[0] + dir * 6},${end[1] + 40} ${inn[0]},${inn[1]}`} n={3} dur={3.6} r={2.2} color="#ff8a9b" reduced={reduced} />
              </g>
            );
          })}
          <Flow d={smoothPath([...vein].reverse(), false, 0.5)} n={2} dur={5} r={2} color="#93a8ff" reduced={reduced} />
          {circ && (
            <>
              <Flow d={`M${CX - 4.4},${CY - 64} C${CX - 6},${CY - 92} ${CX - 2.4},${CY - 110} ${CX - 2.4},${CY - RA}`} n={2} dur={3} r={1.8} color="#b9c9ff" reduced={reduced} />
              <Flow d={`M${CX + 2.4},${CY - RV} C${CX + 2.4},${CY - 110} ${CX - 1},${CY - 92} ${CX + 0.4},${CY - 64}`} n={2} dur={3} r={1.8} color="#ffb3be" reduced={reduced} />
              <Flow d={pd(arcPts(RA, -90, 270, 72))} n={8} dur={14} r={1.8} color="#b9c9ff" reduced={reduced} />
              <Flow d={pd(arcPts(RV, 270, -90, 72))} n={8} dur={14} r={1.8} color="#ffb3be" reduced={reduced} />
            </>
          )}
        </g>
      )}
    </g>
  );
}

function SacDefs() {
  return (
    <defs>
      <radialGradient id="w6s-ivs" cx="50%" cy="50%" r="50%">
        <stop offset="0.6" stopColor="#000" stopOpacity="0.3" />
        <stop offset="0.8" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </radialGradient>
      <radialGradient id="w6s-cavity" cx="50%" cy="45%" r="55%">
        <stop offset="0" stopColor="#24375c" stopOpacity="0.5" />
        <stop offset="1" stopColor="#24375c" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Anchors shared by the two views. */
const A = {
  art: polar(-98, RS + 50),
  vein: polar(-108, RS + 40),
  basal: polar(-150, RS + 16),
  shell: polar(-168, RS - 6),
  stem: (() => {
    const tw = stemTree(198, 0, 0, 0)[0];
    const s = tw.c(0.55);
    return [s.x, s.y] as Pt;
  })(),
  plate: polar(150, R3 - 12),
  cavity: polar(52, R4 - 22),
  capsular: polar(40, RS + 6),
};

export function ChorionicSac({ t, reduced }: SceneProps) {
  const branch = seg(t, 0, 0.16);
  // a free villus of the right-hand stem (generation 2) for the free-villus / thinning names
  const fv = stemTree(-18, 1, 1, 1).find((tw) => tw.gen === 2)!.c(0.3);
  const ivs = polar(-36, R1 - 14);
  return (
    <g>
      <W3bDefs />
      <SacDefs />
      <SacDrawing t={t} reduced={reduced} mode="sac" />
      <Label id="arteria-espiralak" x={190} y={40} ax={A.art[0] - 6} ay={A.art[1]} text="Arteria kiribila" />
      <Label id="endometrio-zainak" x={190} y={72} ax={A.vein[0] - 6} ay={A.vein[1]} text="Itzulera benosoa" />
      <Label id="dezidua-basala" x={190} y={160} ax={A.basal[0]} ay={A.basal[1]} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={210} ax={A.shell[0]} ay={A.shell[1]} text="Zorro zitotrofoblastikoa" />
      <Label id="biloxka-enborra" x={190} y={400} ax={A.stem[0]} ay={A.stem[1]} text="Enborrezko biloxka" />
      <Label id="korion-plaka" x={190} y={460} ax={A.plate[0]} ay={A.plate[1]} />
      <Label id="biloxka-tertziarioa" x={190} y={300} ax={polar(186, R1 - 30)[0]} ay={polar(186, R1 - 30)[1]} show={vis(t, 0, 0.2)} />
      <Label id="finkapen-pedikulua" x={190} y={112} ax={CX - 9} ay={CY - 108} />
      <Label id="biloxka-askea" x={810} y={240} ax={fv.x} ay={fv.y} show={Math.max(0.4, branch)} />
      <Label id="biloxka-arteko-espazioa" x={810} y={272} ax={ivs[0]} ay={ivs[1]} show={vis(t, 0.16)} />
      <Label id="karena-mugaren-meheketa" x={810} y={304} ax={fv.x + 2} ay={fv.y + 4} show={seg(t, 0.34, 0.4) * (1 - seg(t, 0.62, 0.66))} small />
      <Label id="amnios-barrunbea" x={810} y={346} ax={CX + 22} ay={CY - 40} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={378} ax={CX + 40} ay={CY + 36} />
      <Label id="korion-barrunbea" x={810} y={410} ax={A.cavity[0]} ay={A.cavity[1]} />
      <Label id="dezidua-kapsularra" x={810} y={500} ax={A.capsular[0]} ay={A.capsular[1]} />

      <Note x={500} y={616} show={1 - seg(t, 0.12, 0.16)} tone="dim">
        Biloxka enborrak adarkatzen dira: adarkadurak geroz eta txikiagoak
      </Note>
      <Note x={500} y={616} show={vis(t, 0.16, 0.34)} tone="accent">
        Biloxka askeek biloxka arteko espazioa betetzen dute
      </Note>
      <Note x={500} y={616} show={vis(t, 0.34, 0.66)} tone="accent">
        Mehetzea: lehenik adarkadura txikiko biloxka askeetan, gero handiagoetan
      </Note>
      {/* Stem villi never thin: they take no part in the exchange. */}
      <Mark id="biloxka-enborra" x={A.stem[0]} y={A.stem[1]} rx={22} color="#fbbf24" show={vis(t, 0.66)} />
      <Note x={500} y={616} show={vis(t, 0.66)} tone="warn">
        Enborrezko (aingura) biloxkak ez dira mehetzen: ez dute trukerik egiten
      </Note>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* SacCirculation — fetal vessels vs. maternal blood, never touching  */
/* ------------------------------------------------------------------ */

export function SacCirculation({ t, reduced }: SceneProps) {
  const sep = seg(t, 0.8, 0.86);
  const ivs = polar(-36, R1 - 14);
  const tv = stemTree(-18, 1, 1, 1)[0].c(0.4);
  const syn = polar(200, R1 - 6);
  const plateV = polar(160, RA);
  return (
    <g>
      <W3bDefs />
      <SacDefs />
      <SacDrawing t={1} reduced={reduced} mode="circ" />
      <Label id="finkapen-pedikulua" x={190} y={250} ax={CX - 10} ay={CY - 104} />
      <Label id="zilbor-hodiak" x={190} y={290} ax={CX - 4} ay={CY - 92} />
      <Label id="enbrioi-kanpoko-zirkulazioa" x={196} y={340} ax={plateV[0]} ay={plateV[1]} text="Enbrioi kanpoko zirkulazioa" small />
      <Label id="korion-plaka" x={190} y={390} ax={A.plate[0]} ay={A.plate[1]} text="Korion-orria" />
      <Label id="sinzitiotrofoblastoa" x={190} y={440} ax={syn[0]} ay={syn[1]} text="Sinzitioa" />
      <Label id="biloxka-tertziarioa" x={810} y={240} ax={tv.x} ay={tv.y} />
      <Label id="biloxka-arteko-espazioa" x={810} y={272} ax={ivs[0]} ay={ivs[1]} />
      <Label id="amnios-barrunbea" x={810} y={346} ax={CX + 22} ay={CY - 40} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={378} ax={CX + 40} ay={CY + 36} />
      <Label id="korion-barrunbea" x={810} y={410} ax={A.cavity[0]} ay={A.cavity[1]} />
      <Note x={500} y={616} show={1 - sep} tone="dim">
        Fetuaren odola: zilbor-hodiak → korion orriko odol-hodiak → biloxketako kapilarrak
      </Note>
      <Note x={500} y={616} show={sep} tone="warn">
        Amaren eta fetuaren odolak ez dute inoiz kontakturik
      </Note>
    </g>
  );
}
