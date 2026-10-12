'use client';

import { C, Flow, Label, Mark, Note, Part, bezier, clamp, lerp, mix, rand, seg, smoothPath, tube, type Pt, type SceneProps } from '@/components/kit';
import type { Curve } from '@/lib/sim/geometry';
import { CellPaths, Chevron, K, W3bDefs, chevrons, newBatch, pd, wallCells, type P } from '@/components/scenes/week3-villi/art';
import { FetusFigure, fetusGeom, placeFetus } from '@/components/scenes/week5/FetusFigure';

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
const R4 = 124; // chorionic cavity
const R3 = 160; // chorionic plate (outer face)
const R1 = 232; // villi reach the shell here
const RS = 244; // shell outer face
/** The plate's two vessel rings run side by side (one band to point at), leaving a wide band of plate mesoderm outside. */
const RA = R4 + 10; // arterial ring in the plate
const RV = R4 + 16.4; // venous ring in the plate
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
    const b1 = branchOff(c, u, side, 0.86 + rand(s) * 0.2, (31 + rand(s + 1) * 12) * g1, 5, 1, s);
    out.push(b1);
    if (g2 <= 0.02) return;
    [0.42, 0.7].forEach((v, k) => {
      const s2 = s * 3 + k * 5;
      const b2 = branchOff(b1.c, v, k ? -side : side, 0.8 + rand(s2) * 0.3, (16 + rand(s2 + 2) * 6) * g2 * g1, 3.8, 2, s2);
      out.push(b2);
      if (g3 <= 0.02 || k) return;
      out.push(branchOff(b2.c, 0.4, -side, 0.9, (11 + rand(s2 + 4) * 4) * g3 * g2, 3, 3, s2 + 9));
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
const FLOATERS = Array.from({ length: 150 }, (_, k) => {
  const a = rand(k * 2.3 + 0.4) * 360;
  const near = STEMS.some((s) => Math.abs(((a - s + 540) % 360) - 180) < 6);
  const r = lerp(R3 + 14, R1 - 10, rand(k * 5.1 + 1));
  const p = polar(a, r);
  return { x: p[0], y: p[1], r: 5.4 + rand(k * 3.7) * 4.2, rot: rand(k * 1.9) * 180, near, at: rand(k * 7.3) };
}).filter((f) => !f.near && !(f.y < CY - R1 + 40 && Math.abs(f.x - CX) < 50));

/** The cytotrophoblastic shell: one ring of cells. */
const SHELL = (() => {
  const b = newBatch();
  wallCells(b, arcPts(RS - 0.5, -90, 270, 180), RS - R1 - 1, 9.5, { fit: true });
  return b;
})();

/**
 * Inside the chorionic cavity, months 2 → 4: the amnion grows round the fetus until it nearly fills the
 * cavity (the chorionic cavity is left as a thin crescent, about to be obliterated), the yolk sac is pushed
 * to the rim and shrinks, and the connecting stalk becomes the cord. `grow` 0..1.
 */
function inner(grow: number) {
  const amR = lerp(64, R4 - 24, grow);
  // it grows down and out from under the stalk, so the last of the cavity is a crescent, widest above
  const amC: Pt = [lerp(CX - 4, CX - 2, grow), lerp(CY - 18, CY + 10, grow)];
  const week = lerp(9, 14, grow);
  const crl = amR * lerp(1.22, 1.06, grow);
  const place = placeFetus(crl, 1, amC[0] - amR * 0.12, amC[1] + amR * 0.04);
  const fg = fetusGeom(week);
  const root = place.xf(fg.cordBase);
  const top: Pt = [CX - 2, CY - R4 + 1];
  // the cord: from the plate down the right of the head to the belly
  const c1: Pt = [CX + amR * 0.62, CY - R4 + 40];
  const c2: Pt = [root[0] + amR * 0.78, root[1] - amR * 0.16];
  // the yolk sac: beside the amnion at first, then squeezed into the crescent and shrinking
  const yolkR = lerp(17, 9, grow);
  const ya = (-20 * Math.PI) / 180;
  const early: Pt = [amC[0] + Math.cos(ya) * (amR + yolkR + 4), amC[1] + Math.sin(ya) * (amR + yolkR + 4)];
  const late: Pt = [CX + Math.cos(ya) * (R4 - yolkR - 4), CY + Math.sin(ya) * (R4 - yolkR - 4)];
  const yolk: Pt = [lerp(early[0], late[0], grow), lerp(early[1], late[1], grow)];
  return { amR, amC, week, place, fg, root, top, c1, c2, yolk, yolkR };
}
type Inner = ReturnType<typeof inner>;
/** Half-width of the stalk / cord (u from the plate): it flares where it meets the chorionic plate. */
const stalkHw = (grow: number) => (u: number) => lerp(6.5, 8, grow) + 13 * Math.max(0, 1 - u / 0.3) ** 2;
/** Umbilical vessel `side` (−1 artery, +1 vein) along the cord, from the fetus up to the plate ring; the two
 *  run side by side, touching, so together they make one band down the cord's axis. */
const UMB_O = 2.3;
const UMB_W = 4.6;
/** The vessel's centre line: offset from the cord's axis along its normal (so the two always touch, whatever
 *  the cord's slant), easing onto its own ring of the plate at the top. */
const umbPts = (q: Inner, side: number, ring: number): P[] => {
  const b = bezier(q.root, q.c2, q.c1, [q.top[0], CY - ring]);
  return Array.from({ length: 33 }, (_, i) => {
    const s = b(i / 32);
    const o = side * UMB_O * (1 - smooth01((i / 32 - 0.86) / 0.14));
    return [s.x + s.nx * o, s.y + s.ny * o] as P;
  });
};
const smooth01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
const umbD = (q: Inner, side: number, ring: number) => smoothPath(umbPts(q, side, ring), false, 0.5);

const artDeg = [-98, -82];
const veinDeg = -126 + 18;
/** A spiral artery from above the decidua to its opening in the shell. */
const artPath = (deg: number, i: number) => {
  const p0 = polar(deg, RS + 2);
  const top: Pt = [p0[0] + (i ? 14 : -14), 24];
  const pts: Pt[] = Array.from({ length: 9 }, (_, k) => {
    const u = k / 8;
    return [lerp(top[0], p0[0], u) + Math.sin(u * Math.PI * 3.2 + i) * 7 * (1 - u * 0.6), lerp(top[1], p0[1], u)];
  });
  return pts;
};
const VEIN: Pt[] = (() => {
  const p0 = polar(veinDeg, RS + 2);
  return [p0, [p0[0] - 10, p0[1] - 24], [p0[0] - 6, p0[1] - 48], [p0[0] - 16, 24]] as Pt[];
})();

/* ------------------------------------------------------------------ */
/* The sac                                                            */
/* ------------------------------------------------------------------ */

type Mode = 'sac' | 'circ';

/** Fetal vessels before the fetal blood reaches them (the circulation view fills them in, in order). */
const EMPTY = '#5b4352';

function SacDrawing({ t, reduced, mode, phase = 0, fill = 1, grow = 1 }: SceneProps & { mode: Mode; phase?: number; fill?: number; grow?: number }) {
  // Circulation view: the fetal blood goes up the umbilical arteries, round the chorionic plate, into the
  // villi, and back (each stretch takes its colour as the blood reaches it).
  const fUmb = seg(fill, 0, 0.28);
  const fRing = seg(fill, 0.22, 0.6);
  const fVilli = seg(fill, 0.55, 1);
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
  const meheketa = mode === 'sac' ? seg(t, 0.34, 0.4) * (1 - seg(t, 0.66, 0.7)) : 0;
  const villi = (L: Layers, wid: string, withFloats: boolean) => (
    <Part id={wid}>
      <path d={L.syn + (withFloats ? floatD(1) : '')} fill="url(#w3b-syn)" />
      <path d={L.cyto + (withFloats ? floatD(1 - lerp(0.3, 0.2, floatT)) : '')} fill={K.cytoGround} />
      <path d={L.meso + (withFloats ? floatD(lerp(0.42, 0.75, floatT)) : '')} fill={K.meso} />
      <path d={L.capA} fill="none" stroke={circ ? mix(EMPTY, BLUE, fVilli) : '#8f3a64'} strokeWidth={circ ? 2.3 : 1.1} strokeLinejoin="round" opacity={circ ? 1 : 0.85} />
      <path d={L.capV} fill="none" stroke={circ ? mix(EMPTY, RED, fVilli) : '#c2334d'} strokeWidth={circ ? 2.3 : 1.1} strokeLinejoin="round" opacity={circ ? 1 : 0.85} />
      <path d={L.edge + (withFloats ? floatD(1) : '')} fill="none" stroke={K.synEdge} strokeWidth={0.9} />
    </Part>
  );
  const q = inner(grow);
  const stalk = tube(bezier(q.top, q.c1, q.c2, q.root), stalkHw(grow), 0, 1, 28);
  const art = umbD(q, -1, RA);
  const ven = umbD(q, 1, RV);
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
              <path d={p} stroke="#5b1222" strokeWidth={11} />
              <path d={p} stroke="#c9314f" strokeWidth={8.6} />
              <path d={p} stroke="#f0566f" strokeWidth={3.6} />
            </g>
          );
        })}
      </Part>
      <Part id="endometrio-zainak">
        <path d={smoothPath(VEIN, false, 0.5)} fill="none" stroke="#1d2a5c" strokeWidth={11.5} strokeLinecap="round" />
        <path d={smoothPath(VEIN, false, 0.5)} fill="none" stroke={C.vein} strokeWidth={9} strokeLinecap="round" />
      </Part>

      <g fill={K.shadow} transform="translate(2.5 3)" pointerEvents="none">
        <path d={stems.shadow + free.shadow} />
      </g>
      {villi(free, freeId, true)}
      {villi(stems, stemId, false)}
      {meheketa > 0.01 && <path d={free.edge + floatD(1)} fill="none" stroke="#fde68a" strokeWidth={0.9} opacity={0.6 * meheketa} pointerEvents="none" />}
      {circ && <path d={stems.edge + free.edge + floatD(1)} fill="none" stroke="#7fe0ad" strokeWidth={1} opacity={0.55} pointerEvents="none" />}

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
            {circ ? (
              <>
                <circle cx={CX} cy={CY} r={v.r} stroke={EMPTY} strokeWidth={3} />
                {/* both halves of the ring fill from the top, where the umbilical vessels join it */}
                {fRing > 0.005 &&
                  [90, -270].map((end) => (
                    <path key={end} d={pd(arcPts(v.r, -90, end, 60))} pathLength={1} strokeDasharray={`${fRing.toFixed(4)} 2`} stroke={v.c} strokeWidth={3} />
                  ))}
              </>
            ) : (
              <circle cx={CX} cy={CY} r={v.r} stroke={v.c === BLUE ? '#8f3a64' : '#c2334d'} strokeWidth={2.2} />
            )}
          </g>
        ))}
      </Part>

      <Part id="korion-barrunbea">
        <circle cx={CX} cy={CY} r={R4} fill="#0f1729" />
        <circle cx={CX} cy={CY} r={R4} fill="url(#w6s-cavity)" />
        <circle cx={CX} cy={CY} r={R4 - 1} fill="none" stroke="#e9a084" strokeWidth={1.4} opacity={0.55} />
      </Part>

      {/* The yolk sac, pushed to the rim of the cavity as the amnion grows (its duct runs up the cord). */}
      <Part id="bitelo-zaku-sekundarioa">
        <path d={`M${q.root[0].toFixed(1)},${q.root[1].toFixed(1)} Q${((q.root[0] + q.yolk[0]) / 2 + 6).toFixed(1)},${((q.root[1] + q.yolk[1]) / 2 - 4).toFixed(1)} ${q.yolk[0].toFixed(1)},${(q.yolk[1] - q.yolkR).toFixed(1)}`} fill="none" stroke="#d9a63a" strokeWidth={2} />
        <circle cx={q.yolk[0]} cy={q.yolk[1]} r={q.yolkR} fill="#f2c14e" stroke="#b9862a" strokeWidth={1.4} />
        <circle cx={q.yolk[0]} cy={q.yolk[1]} r={q.yolkR} fill="url(#w3b-ball)" />
      </Part>
      {/* The amnion, growing round the fetus until only a crescent of chorionic cavity is left. */}
      <Part id="amnios-barrunbea">
        <circle cx={q.amC[0]} cy={q.amC[1]} r={q.amR} fill="#16233d" />
        <circle cx={q.amC[0]} cy={q.amC[1]} r={q.amR} fill={C.amnionCavity} opacity={0.55} />
        <circle cx={q.amC[0]} cy={q.amC[1]} r={q.amR} fill="none" stroke="#9fc3e6" strokeWidth={2} />
      </Part>
      {/* Connecting stalk → cord: chorionic plate down to the fetus's belly, its two vessels inside. */}
      <Part id="finkapen-pedikulua">
        <path d={stalk.d} fill={K.meso} />
        <path d={stalk.d} fill="url(#p-meso-extra)" opacity={0.6} />
        <g fill="none" stroke={K.mesoEdge} strokeWidth={1}>
          <path d={stalk.left} />
          <path d={stalk.right} />
        </g>
      </Part>
      <Part id="zilbor-hodiak">
        {/* drawn from the fetus up (the way the blood goes out), so the circulation view can fill them in */}
        <path d={art} fill="none" stroke={circ ? EMPTY : '#5360d6'} strokeWidth={UMB_W} />
        <path d={ven} fill="none" stroke={circ ? EMPTY : '#e0303f'} strokeWidth={UMB_W} />
        {circ && fUmb > 0.005 && (
          <g fill="none" strokeWidth={UMB_W}>
            <path d={art} pathLength={1} strokeDasharray={`${fUmb.toFixed(4)} 2`} stroke={BLUE} />
            <path d={ven} pathLength={1} strokeDasharray={`${fUmb.toFixed(4)} 2`} stroke={RED} />
          </g>
        )}
      </Part>
      {/* The fetus (same figure as topic 5 and the uterus view), months 2 → 4. */}
      <g pointerEvents="none" transform={q.place.transform}>
        <FetusFigure id={`w6sac${mode}`} week={q.week} s={q.place.s} hernia={1 - seg(q.week, 11, 12.5)} cord={<g />} />
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
          <Flow d={smoothPath([...VEIN].reverse(), false, 0.5)} n={2} dur={5} r={2} color="#93a8ff" reduced={reduced} />
          {circ && (
            <>
              <Flow d={art} n={2} dur={3} r={1.8} color="#b9c9ff" reduced={reduced} />
              <Flow d={pd([...umbPts(q, 1, RV)].reverse())} n={2} dur={3} r={1.8} color="#ffb3be" reduced={reduced} />
              <Flow d={pd(arcPts(RA, -90, 270, 72))} n={8} dur={14} r={1.8} color="#b9c9ff" reduced={reduced} />
              <Flow d={pd(arcPts(RV, 270, -90, 72))} n={8} dur={14} r={1.8} color="#ffb3be" reduced={reduced} />
            </>
          )}
        </g>
      )}

      {/* Direction of flow (readable in every still): maternal blood in through the spiral arteries and out
          through the veins; in the circulation view, the fetal blood up the umbilical artery, round the plate
          and back down the umbilical vein. */}
      <g pointerEvents="none">
        {artDeg.flatMap((d, i) => {
          const pts = artPath(d, i) as P[];
          const end = pts[pts.length - 1];
          const dir = i ? 1 : -1;
          const inn = polar(d + dir * 10, R3 + 22);
          const jet: P[] = Array.from({ length: 13 }, (_, k) => {
            const u = k / 12;
            const c: P = [end[0] + dir * 6, end[1] + 40];
            return [(1 - u) ** 2 * end[0] + 2 * (1 - u) * u * c[0] + u * u * inn[0], (1 - u) ** 2 * end[1] + 2 * (1 - u) * u * c[1] + u * u * inn[1]];
          });
          return [
            ...chevrons(pts.slice(2), 34, phase * 0.6, false).map((c, k) => <Chevron key={`a${i}-${k}`} {...c} color="#ffe1e6" size={0.7} />),
            ...chevrons(jet, 30, phase * 0.6 + 10, false).map((c, k) => <Chevron key={`j${i}-${k}`} {...c} color="#ffe1e6" size={0.75} />),
          ];
        })}
        {chevrons(VEIN as P[], 30, phase * 0.6, false).map((c, k) => (
          <Chevron key={`v${k}`} {...c} color="#d6deff" size={0.7} />
        ))}
        {circ &&
          [
            { pts: arcPts(RA, -90, 90, 60), c: '#cfe0ff' },
            { pts: arcPts(RA, -90, -270, 60), c: '#cfe0ff' },
            { pts: arcPts(RV, 90, -90, 60), c: '#ffd2d9' },
            { pts: arcPts(RV, 90, 270, 60), c: '#ffd2d9' },
            { pts: umbPts(q, -1, RA), c: '#cfe0ff' },
            { pts: [...umbPts(q, 1, RV)].reverse(), c: '#ffd2d9' },
          ].flatMap((r, i) => chevrons(r.pts, i < 4 ? 46 : 22, phase, false).map((c, k) => <Chevron key={`f${i}-${k}`} {...c} color={r.c} size={i < 4 ? 0.8 : 0.6} />))}
      </g>
    </g>
  );
}

/** A polyline through a few points (linear, densified) for the chevron helper. */
function smoothPts(p: Pt[]): P[] {
  const out: P[] = [];
  for (let i = 0; i < p.length - 1; i++) for (let k = 0; k < 6; k++) out.push([lerp(p[i][0], p[i + 1][0], k / 6), lerp(p[i][1], p[i + 1][1], k / 6)]);
  out.push(p[p.length - 1] as P);
  return out;
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
  art: artPath(artDeg[0], 0)[3],
  vein: VEIN[1],
  basal: polar(-150, RS + 16),
  shell: polar(172, RS - 6),
  ter: (() => {
    const s = stemTree(198, 1, 1, 0).find((tw) => tw.gen === 1)!.c(0.55);
    return [s.x, s.y] as Pt;
  })(),
  stem: (() => {
    const tw = stemTree(198, 0, 0, 0)[0];
    const s = tw.c(0.55);
    return [s.x, s.y] as Pt;
  })(),
  plate: polar(150, 150),
  capsular: polar(40, RS + 6),
};

/** Names inside the cavity, from the same geometry the drawing uses. */
function innerAnchors(grow: number) {
  const q = inner(grow);
  // the chorionic cavity's widest free stretch: the crescent over the amnion, up and to the left of the stalk
  const ca = (-128 * Math.PI) / 180;
  const rIn = Math.hypot(Math.cos(ca) * q.amR + q.amC[0] - CX, Math.sin(ca) * q.amR + q.amC[1] - CY);
  const rc = (Math.max(rIn, 0) + R4) / 2;
  // the stalk where it flares into the plate, off its vessels' band
  const sa = bezier(q.top, q.c1, q.c2, q.root)(0.05);
  const sw = stalkHw(grow)(0.05) * 0.66;
  const stalkAt = { x: sa.x - sa.nx * sw, y: sa.y - sa.ny * sw };
  const ua = umbPts(q, -1, RA)[22];
  const uv = umbPts(q, 1, RV)[22];
  const ub = { x: (ua[0] + uv[0]) / 2, y: (ua[1] + uv[1]) / 2 };
  return {
    q,
    amnion: [q.amC[0] - q.amR * 0.62, q.amC[1] - q.amR * 0.42] as Pt,
    yolk: q.yolk,
    cavity: [CX + Math.cos(ca) * rc, CY + Math.sin(ca) * rc] as Pt,
    stalk: [stalkAt.x, stalkAt.y] as Pt,
    /** the umbilical vessels: on the seam of the two, the middle of their band */
    vessels: [ub.x, ub.y] as Pt,
  };
}

export function ChorionicSac({ t, reduced }: SceneProps) {
  const branch = seg(t, 0, 0.16);
  // a free villus of the right-hand stem (generation 2) for the free-villus / thinning names
  const fv = stemTree(-18, 1, 1, 1).find((tw) => tw.gen === 2)!.c(0.62);
  const mk = stemTree(-54, 1, 1, 1).find((tw) => tw.gen === 2)!.c(0.4);
  const ivs = polar(-36, R1 - 14);
  // Months 2 → 4: the amnion grows round the fetus (it ends nearly filling the chorionic cavity).
  const grow = seg(t, 0.02, 0.76);
  const IN = innerAnchors(grow);
  return (
    <g>
      <W3bDefs />
      <SacDefs />
      <SacDrawing t={t} reduced={reduced} mode="sac" phase={t * 34 * 30} grow={grow} />
      <Label id="arteria-espiralak" x={190} y={40} ax={A.art[0]} ay={A.art[1]} text="Arteria kiribila" />
      <Label id="endometrio-zainak" x={190} y={72} ax={A.vein[0]} ay={A.vein[1]} text="Itzulera benosoa" />
      <Label id="dezidua-basala" x={190} y={A.basal[1]} ax={A.basal[0]} ay={A.basal[1]} />
      <Label id="biloxka-enborra" x={190} y={A.stem[1]} ax={A.stem[0]} ay={A.stem[1]} text="Enborrezko biloxka" />
      <Label id="biloxka-tertziarioa" x={190} y={318} ax={A.ter[0]} ay={A.ter[1]} show={vis(t, 0, 0.2)} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={386} ax={A.shell[0]} ay={A.shell[1]} text="Zorro zitotrofoblastikoa" />
      <Label id="korion-plaka" x={190} y={422} ax={A.plate[0]} ay={A.plate[1]} />
      {/* Right column starts below the scene tools (y ≥ 230), in the anchors' top-to-bottom order. */}
      <Label id="finkapen-pedikulua" x={810} y={232} ax={IN.stalk[0]} ay={IN.stalk[1]} />
      <Label id="biloxka-arteko-espazioa" x={810} y={Math.max(ivs[1], 292)} ax={ivs[0]} ay={ivs[1]} show={vis(t, 0.16)} />
      <Label id="biloxka-askea" x={810} y={Math.max(fv.y, 324)} ax={fv.x} ay={fv.y} show={Math.max(0.4, branch)} />
      {/* Thinning is a process: a pool of light on the free villi, not a structure's outline. */}
      <Mark id="karena-mugaren-meheketa" show={seg(t, 0.34, 0.4) * (1 - seg(t, 0.66, 0.7))}>
        {/* Only the pool of light (no rim): the thinning is on the free villus under it, where its name points. */}
        <radialGradient id="w6s-thin-glow">
          <stop offset="0" stopColor="#ffb86b" stopOpacity={0.42} />
          <stop offset="0.5" stopColor="#ffb86b" stopOpacity={0.24} />
          <stop offset="1" stopColor="#ffb86b" stopOpacity={0} />
        </radialGradient>
        <ellipse className="mark-light" cx={mk.x} cy={mk.y} rx={34} ry={34} fill="url(#w6s-thin-glow)" pointerEvents="none" />
      </Mark>
      <Label id="karena-mugaren-meheketa" x={810} y={262} ax={mk.x} ay={mk.y} show={seg(t, 0.34, 0.4) * (1 - seg(t, 0.66, 0.7))} small />
      <Label id="korion-barrunbea" x={190} y={246} ax={IN.cavity[0]} ay={IN.cavity[1]} />
      <Label id="amnios-barrunbea" x={190} y={352} ax={IN.amnion[0]} ay={IN.amnion[1]} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={IN.yolk[1] + 60} ax={IN.yolk[0]} ay={IN.yolk[1]} />
      <Label id="dezidua-kapsularra" x={810} y={500} ax={A.capsular[0]} ay={A.capsular[1]} />

      <Note x={500} y={616} show={1 - seg(t, 0.12, 0.16)} tone="dim">
        Biloxka enborrak adarkatzen dira: adarkadurak geroz eta txikiagoak
      </Note>
      <Note x={500} y={616} show={vis(t, 0.16, 0.34)} tone="accent">
        Biloxka askeek biloxka arteko espazioa betetzen dute
      </Note>
      <Note x={500} y={616} show={vis(t, 0.34, 0.7)} tone="accent">
        Mehetzea: lehenik adarkadura txikiko biloxka askeetan, gero handiagoetan
      </Note>
      {/* Stem villi never thin: they take no part in the exchange. */}
      <Mark id="biloxka-enborra" x={A.stem[0]} y={A.stem[1]} rx={22} color="#fbbf24" show={vis(t, 0.7)} />
      <Note x={500} y={616} show={vis(t, 0.7)} tone="warn">
        Enborrezko (aingura) biloxkak ez dira mehetzen: ez dute trukerik egiten
      </Note>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* SacCirculation — fetal vessels vs. maternal blood, never touching  */
/* ------------------------------------------------------------------ */

export function SacCirculation({ t, reduced }: SceneProps) {
  const ivs = polar(-36, R1 - 14);
  const tv = stemTree(-18, 1, 1, 1)[0].c(0.4);
  const plateV = polar(160, (RA + RV) / 2);
  const IN = innerAnchors(1);
  const umbA = IN.vessels;
  return (
    <g>
      <W3bDefs />
      <SacDefs />
      {/* Filled in during its own step (.8 on); seen at any other time, the whole circuit is shown. */}
      <SacDrawing t={1} reduced={reduced} mode="circ" phase={t * 34 * 30} fill={t < 0.795 ? 1 : seg(t, 0.8, 0.95)} />
      <Label id="finkapen-pedikulua" x={810} y={232} ax={IN.stalk[0]} ay={IN.stalk[1]} />
      <Label id="zilbor-hodiak" x={810} y={262} ax={umbA[0]} ay={umbA[1]} />
      <Label id="enbrioi-kanpoko-zirkulazioa" x={196} y={390} ax={plateV[0]} ay={plateV[1]} text="Enbrioi kanpoko zirkulazioa" small />
      <Label id="korion-plaka" x={190} y={426} ax={A.plate[0]} ay={A.plate[1]} text="Korion-orria" />
      <Label id="biloxka-arteko-espazioa" x={810} y={294} ax={ivs[0]} ay={ivs[1]} />
      <Label id="biloxka-tertziarioa" x={810} y={Math.max(tv.y, 326)} ax={tv.x} ay={tv.y} />
      <Label id="korion-barrunbea" x={190} y={IN.cavity[1]} ax={IN.cavity[0]} ay={IN.cavity[1]} />
      <Label id="amnios-barrunbea" x={190} y={352} ax={IN.amnion[0]} ay={IN.amnion[1]} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={IN.yolk[1] + 60} ax={IN.yolk[0]} ay={IN.yolk[1]} />
      {/* Caption hand-off in two halves: never two captions on one spot. */}
      <Note x={500} y={616} show={1 - seg(t, 0.8, 0.83)} tone="dim">
        Fetuaren odola: zilbor-hodiak → korion orriko odol-hodiak → biloxketako kapilarrak
      </Note>
      <Note x={500} y={616} show={seg(t, 0.83, 0.86)} tone="warn">
        Amaren eta fetuaren odolak ez dute inoiz kontakturik
      </Note>
    </g>
  );
}
