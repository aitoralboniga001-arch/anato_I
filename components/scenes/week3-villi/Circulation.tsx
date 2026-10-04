'use client';

import { Arrow, C, Flow, Label, Note, Part, clamp, easeInOut, lerp, mix, rand, seg, zoom, type SceneProps } from '@/components/kit';
import {
  BASE,
  CellPaths,
  Chevron,
  Island,
  K,
  VesselSet,
  W3bDefs,
  chevrons,
  cumLen,
  ellipseSub,
  fingerOutline,
  fingerShape,
  fringe,
  fw,
  fx,
  islandStates,
  layerTop,
  loopOf,
  newBatch,
  offsetPoly,
  pd,
  planVessel,
  pointAt,
  rand3,
  roundCell,
  runs,
  subPoly,
  vesselSegments,
  wallCells,
  xform,
  type Finger,
  type P,
} from './art';

/**
 * Stage `zirkulazioa` — end of week 3 / week 4 (Langman fig. 5-13, the notes' p10). Vessels form in
 * situ in the intra-embryonic mesoderm, in the connecting stalk (umbilical vessels), in the chorionic
 * plate and in the tertiary villi; then they join, from the embryo outwards, into one circuit of the
 * embryo's own. When the heart starts beating (week 4) the embryo's blood reaches the villus
 * capillaries; across their wall (the placental barrier) it exchanges with the maternal blood of the
 * intervillous space, which it never touches.
 * Windows (shared by both views and content/weeks/week3b.ts; each starts at its beat and ends before
 * the beat's held frame = next beat − 0.035):
 */
export const W = {
  embryoStalk: [0.0, 0.11],
  stalkPlate: [0.15, 0.28],
  platevillus: [0.32, 0.46],
  circuit: [0.5, 0.6],
  heartbeat: [0.65, 0.7],
  /** Close-up only: push-in onto the barrier, then its four layers one by one (inside → out). */
  barrier: [0.74, 0.815],
  o2: [0.815, 0.86],
  co2: [0.9, 0.96],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);

/** Blood colours once it flows: towards the placenta (deoxygenated) and back to the embryo (oxygenated). */
const BLUE = '#3554b8';
const RED = '#d3283f';

/* ================================================================== */
/* Overview geometry (static: the villous tree of the previous stage)  */
/* ================================================================== */

const Y = { decB: 46, shellB: 64, roofB: 74, plateSyn: 296, plateCyto: 305, plateMeso: 316, ven: 332, art: 346, plateB: 362 };
const FIL = { syn: 10, cyto: 18, meso: 26 };
const ART_X = 500;

const TRUNKS = [
  { x: 372, hw: 30, ts: 7, tc: 8, sway: 4, lam: 64, ph: 1.0, outer: -1 },
  { x: 628, hw: 30, ts: 7, tc: 8, sway: 4, lam: 60, ph: 3.6, outer: 1 },
].map((d) => ({
  ...d,
  f: { x: d.x, base: Y.plateSyn, len: Y.plateSyn - Y.decB + 4, hw: d.hw, sway: d.sway, lam: d.lam, ph: d.ph } as Finger,
  mesoApex: Y.roofB + 36,
}));

/** Free villi branching off the stem villi; each is rooted on the capillary leg of its own side. */
const BRANCHES = [
  { tr: 0, d: 128, ang: -48, len: 76, hw: 14 },
  { tr: 0, d: 74, ang: 46, len: 82, hw: 14 },
  { tr: 1, d: 82, ang: -46, len: 80, hw: 14 },
  { tr: 1, d: 134, ang: 48, len: 74, hw: 14 },
].map((b, i) => {
  const tr = TRUNKS[b.tr];
  const by = Y.plateSyn - b.d;
  const wm = fw(tr.f, by, tr.ts + tr.tc);
  const side = b.ang > 0 ? 1 : -1;
  const f: Finger = { x: 0, base: 0, len: b.len, hw: b.hw, sway: 2.5, lam: 40, ph: i * 1.3 };
  return { ...b, i, by, bx: fx(tr.f, by) + side * wm * 0.46, f, ts: 5, tc: 5, arterial: side === tr.outer };
});
type Br = (typeof BRANCHES)[number];

function branchPts(b: Br, d: number): P[] {
  const sh = fingerShape(b.f, d, 0, 0, -b.len + d, 5);
  return sh ? xform(fingerOutline(sh), b.bx, b.by, b.ang) : [];
}
function branchSide(b: Br, d: number) {
  const sh = fingerShape(b.f, d, 0, 0, -b.len + d, 5)!;
  const T = (p: P[]) => xform(p, b.bx, b.by, b.ang);
  return { left: T(sh.left), right: T(sh.right), cap: T([sh.left[sh.left.length - 1], ...sh.cap, sh.right[sh.right.length - 1]]) };
}

/** Bottom of the syncytial roof, with fillets where the stem villi join it. */
function roofContour(r: number): P[] {
  const y = Y.roofB;
  const pts: P[] = [[-40, y]];
  for (const tr of TRUNKS) {
    const yy = y + r;
    const xl = fx(tr.f, yy) - fw(tr.f, yy, 0);
    const xr = fx(tr.f, yy) + fw(tr.f, yy, 0);
    for (let i = 0; i <= 5; i++) {
      const k = i / 5;
      pts.push([(1 - k) * (1 - k) * (xl - r) + 2 * (1 - k) * k * xl + k * k * xl, (1 - k) * (1 - k) * y + 2 * (1 - k) * k * y + k * k * yy]);
    }
    for (let i = 0; i <= 5; i++) {
      const k = i / 5;
      pts.push([(1 - k) * (1 - k) * xr + 2 * (1 - k) * k * xr + k * k * (xr + r), (1 - k) * (1 - k) * yy + 2 * (1 - k) * k * y + k * k * y]);
    }
  }
  pts.push([1040, y]);
  return pts;
}

const closeDown = (pts: P[], bottom = Y.plateB) => pd([...pts, [1040, bottom], [-40, bottom]], true);
const SYN_TOP = layerTop(TRUNKS.map((tr) => ({ f: tr.f, apex: Y.decB + 3, d: 0 })), Y.plateSyn, FIL.syn);
const CYTO_TOP = layerTop(TRUNKS.map((tr) => ({ f: tr.f, apex: Y.decB - 2, d: tr.ts })), Y.plateCyto, FIL.cyto);
const MESO_TOP = layerTop(TRUNKS.map((tr) => ({ f: tr.f, apex: tr.mesoApex, d: tr.ts + tr.tc })), Y.plateMeso, FIL.meso);
const ROOF = roofContour(12);
const ROOF_FILL = pd([[-40, Y.decB], [1040, Y.decB], ...[...ROOF].reverse()], true);
const BR_SYN = BRANCHES.map((b) => branchPts(b, 0));
const BR_CYTO = BRANCHES.map((b) => branchPts(b, b.ts));
const BR_MESO = BRANCHES.map((b) => branchPts(b, b.ts + b.tc));
const TRUNK_SH = TRUNKS.map((tr) => fingerShape(tr.f, 0, Y.plateSyn, FIL.syn, Y.decB + 3)!);
const TRUNK_SIDES = TRUNK_SH.map((sh) => pd(sh.left.filter((p) => p[1] >= Y.roofB + 6)) + pd(sh.right.filter((p) => p[1] >= Y.roofB + 6)));
const TRUNK_BODY = TRUNK_SH.map((sh) => pd([...sh.left.filter((p) => p[1] >= Y.roofB), ...[...sh.right.filter((p) => p[1] >= Y.roofB)].reverse()], true));

/** Cytotrophoblast: wall cells of stem villi, plate and free villi; solid column cells; the outer shell. */
const CELLS = (() => {
  const wall = newBatch();
  const xs: [number, number][] = [];
  for (const tr of TRUNKS) {
    const sh = fingerShape(tr.f, tr.ts, Y.plateCyto, FIL.cyto, Y.decB - 2)!;
    const below = (p: P) => p[1] > Y.roofB - 2;
    wallCells(wall, sh.left, tr.tc, 10.5, { keep: below });
    wallCells(wall, sh.right, tr.tc, 10.5, { flip: true, keep: below });
    xs.push([sh.left[0][0], sh.right[0][0]]);
  }
  let from = 150;
  for (const [a, z] of xs) {
    wallCells(wall, [[from, Y.plateCyto], [a, Y.plateCyto]], Y.plateMeso - Y.plateCyto, 10.5);
    from = z;
  }
  wallCells(wall, [[from, Y.plateCyto], [850, Y.plateCyto]], Y.plateMeso - Y.plateCyto, 10.5);
  for (const b of BRANCHES) {
    const sd = branchSide(b, b.ts);
    const tr = TRUNKS[b.tr];
    const keep = (p: P) => Math.abs(p[0] - fx(tr.f, p[1])) > fw(tr.f, p[1], 0) - 2;
    wallCells(wall, sd.left, b.tc, 8.5, { keep });
    wallCells(wall, sd.right, b.tc, 8.5, { flip: true, keep });
    wallCells(wall, sd.cap, b.tc, 8.5, { fit: true, keep });
  }
  const col = newBatch();
  for (const tr of TRUNKS) {
    const d = tr.ts + tr.tc;
    for (let j = 0; j < 12; j++) {
      const y = tr.mesoApex + 7 - j * 8.6;
      if (y < Y.decB + 6) break;
      const half = fw(tr.f, y, d) + (y < Y.roofB ? tr.tc * 0.5 : 0);
      const wi = half - 4.6;
      const n = Math.floor((2 * wi) / 8.8) + 1;
      const step = n > 1 ? (2 * wi) / (n - 1) : 0;
      for (let c = 0; c < n; c++) roundCell(col, fx(tr.f, y) - wi + c * step + (j % 2 ? 1 : -1), y, 4.3);
    }
  }
  const shell = newBatch();
  [Y.decB + 4.6, Y.decB + 13.4].forEach((y, j) => {
    for (let x = 160 + (j ? 4.6 : 0); x < 842; x += 9.2) {
      if (Math.abs(x - ART_X) < 9) continue;
      roundCell(shell, x + (rand3(x, y) - 0.5) * 1.1, y + (rand3(y, x) - 0.5) * 0.9, 4.4);
    }
  });
  return { wall, col, shell };
})();

/** Spiral artery coiling down through the decidua and opening through the shell. */
const ARTERY: P[] = (() => {
  const pts: P[] = [];
  for (let y = -6; y <= Y.roofB + 3; y += 3) pts.push([ART_X + 11 * Math.sin(y / 8) * clamp((Y.decB - y) / 26 + 0.15), y]);
  return pts;
})();
const MOUTH = ARTERY[ARTERY.length - 1];

/* ---------- Embryo, connecting stalk and the vessel network ---------- */

/** Mini sagittal embryo (cranial = left), amnion dorsal (towards the plate), yolk sac ventral. */
const EMB = { x0: 372, x1: 580, disc: 548, amRy: 38, ysRy: 40 };

const bez = (p0: P, p1: P, p2: P, p3: P, n: number): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const a = (1 - u) ** 3;
    const b = 3 * (1 - u) ** 2 * u;
    const c = 3 * (1 - u) * u * u;
    const d = u ** 3;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as P;
  });

/** Connecting stalk centre line, chorionic plate → caudal end of the embryo. */
const STALK_C = bez([548, Y.plateB - 12], [552, 420], [592, 450], [588, 530], 32);
const STALK_HW = (u: number) => 19 + 15 * Math.max(0, 1 - u / 0.16) ** 2 + 7 * Math.max(0, (u - 0.86) / 0.14) ** 2;
const STALK_BODY = (() => {
  const L = cumLen(STALK_C);
  const total = L[L.length - 1];
  const left: P[] = [];
  const right: P[] = [];
  STALK_C.forEach((p, i) => {
    const { n } = pointAt(STALK_C, L, L[i]);
    const w = STALK_HW(L[i] / total);
    right.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    left.push([p[0] - n[0] * w, p[1] - n[1] * w]);
  });
  return { left, right, d: pd([...left, ...[...right].reverse()], true) };
})();

/**
 * The vessels, every piece oriented the way the blood will run once the heart beats (embryo →
 * villi along the "arterial" pieces, villi → embryo along the "venous" ones).
 */
const NET = (() => {
  const { x0, x1, disc } = EMB;
  // Umbilical vessels: two lines inside the stalk (arterial on its left side, venous on its right).
  const umbA = [...offsetPoly(STALK_C, -5)].reverse();
  const umbV = offsetPoly(STALK_C, 5);
  // Intra-embryonic vessels in the disc's mesoderm, turning up into the stalk at the caudal end.
  const embA: P[] = [];
  for (let x = x0 + 16; x <= x1 - 18; x += 8) embA.push([x, disc - 4]);
  const embV: P[] = [];
  for (let x = x1 - 18; x >= x0 + 16; x -= 8) embV.push([x, disc + 5]);
  const a0 = umbA[0];
  const v1 = umbV[umbV.length - 1];
  const pathA: P[] = [...embA, ...bez(embA[embA.length - 1], [x1 - 2, disc - 4], [a0[0], a0[1] + 10], a0, 8).slice(1), ...umbA.slice(1)];
  const pathV: P[] = [...umbV, ...bez(v1, [v1[0], v1[1] + 14], [x1 + 4, disc + 5], embV[0], 8).slice(1), ...embV.slice(1)];
  // Heart: a short tube at the cranial end, receiving the venous line and giving off the arterial one.
  const heart = bez([x0 + 16, disc + 5], [x0 - 22, disc + 14], [x0 - 22, disc - 13], [x0 + 16, disc - 4], 14);
  // Chorionic plate vessels: the arterial one runs on to other villi; the venous one gathers the two stem villi.
  const plateA: P[] = [];
  for (let x = -30; x <= 1030; x += 9) plateA.push([x, Y.art + 1.5 * Math.sin(x / 29)]);
  const loops = TRUNKS.map((tr) => loopOf(tr.f, tr.ts, tr.tc, Y.plateMeso, tr.mesoApex + 6, Y.plateMeso));
  const legX = loops.map((l) => [l[0][0], l[l.length - 1][0]] as const);
  const innerL = legX[0][1];
  const innerR = legX[1][0];
  const plateVAt = (x: number) => Y.ven + 1.4 * Math.sin(x / 33 + 1);
  const plateAAt = (x: number) => Y.art + 1.5 * Math.sin(x / 29);
  const xA = umbA[umbA.length - 1][0];
  const xV = umbV[0][0];
  const lineX = (xa: number, xb: number, at: (x: number) => number): P[] => {
    const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / 8));
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = lerp(xa, xb, i / n);
      return [x, at(x)] as P;
    });
  };
  const plateV = [lineX(innerL, xV, plateVAt), lineX(innerR, xV, plateVAt)];
  // Links that close in sequence: stalk ↔ plate (beat 2), villus capillary ↔ plate (beat 3).
  const linkA: P[] = [umbA[umbA.length - 1], [xA, plateAAt(xA)]];
  const linkV: P[] = [[xV, plateVAt(xV)], umbV[0]];
  // Each stem villus: outer leg arterial (to the arterial plate vessel), inner leg venous.
  const legs = TRUNKS.map((tr, i) => {
    const outerX = tr.outer < 0 ? legX[i][0] : legX[i][1];
    const innerX = tr.outer < 0 ? legX[i][1] : legX[i][0];
    return {
      art: [[outerX, plateAAt(outerX)], [outerX, Y.plateMeso]] as P[],
      ven: [[innerX, Y.plateMeso], [innerX, plateVAt(innerX)]] as P[],
      outerX,
      innerX,
    };
  });
  // Loops oriented arterial leg first.
  const loopsOriented = loops.map((l, i) => (TRUNKS[i].outer < 0 ? l : [...l].reverse()));
  const branchLoops = BRANCHES.map((b) => xform(loopOf(b.f, b.ts, b.tc, 2, -b.len + b.ts + b.tc + 5, 0), b.bx, b.by, b.ang));
  return { pathA, pathV, heart, plateA, plateV, linkA, linkV, legs, loops: loopsOriented, branchLoops, xA, xV, plateAAt, plateVAt };
})();

/** Above this height the embryo's vessels are in the connecting stalk (umbilical vessels). */
const STALK_FROM = 528;

/** Split a polyline into runs inside / outside a region; consecutive runs share their boundary point. */
function splitBy(pts: P[], inA: (p: P) => boolean) {
  const a: P[][] = [];
  const b: P[][] = [];
  let cur: P[] = [];
  let curA: boolean | null = null;
  for (const p of pts) {
    const k = inA(p);
    if (curA === null || k === curA) cur.push(p);
    else {
      (curA ? a : b).push(cur);
      cur = [cur[cur.length - 1], p];
    }
    curA = k;
  }
  if (curA !== null && cur.length > 1) (curA ? a : b).push(cur);
  return { a, b };
}

const PLAN_A = planVessel(NET.pathA, 9, 31);
const PLAN_V = planVessel(NET.pathV, 9, 47);
const lenOf = (pts: P[]) => {
  const L = cumLen(pts);
  return L[L.length - 1];
};

/** Circuit distance (from the heart's outflow) at which each piece starts: drives the beat-4 pulse. */
const PIECES = (() => {
  const out: { pts: P[]; d0: number }[] = [];
  const LA = lenOf(NET.pathA);
  out.push({ pts: NET.pathA, d0: 0 });
  out.push({ pts: NET.linkA, d0: LA });
  const dPlate = LA + lenOf(NET.linkA);
  const iA = NET.plateA.findIndex((p) => p[0] >= NET.xA);
  out.push({ pts: [...NET.plateA.slice(0, iA)].reverse(), d0: dPlate });
  out.push({ pts: NET.plateA.slice(iA - 1), d0: dPlate });
  let back = 0;
  NET.legs.forEach((lg, i) => {
    const dLeg = dPlate + Math.abs(NET.xA - lg.outerX);
    out.push({ pts: lg.art, d0: dLeg });
    const dLoop = dLeg + lenOf(lg.art);
    const loop = NET.loops[i];
    const LL = lenOf(loop);
    out.push({ pts: loop, d0: dLoop });
    for (const b of BRANCHES.filter((q) => q.tr === i)) {
      const up = Y.plateMeso - b.by;
      out.push({ pts: NET.branchLoops[b.i], d0: dLoop + (b.arterial ? up : LL - up) });
    }
    const dVen = dLoop + LL;
    out.push({ pts: lg.ven, d0: dVen });
    const dPV = dVen + lenOf(lg.ven);
    out.push({ pts: NET.plateV[i], d0: dPV });
    back = Math.max(back, dPV + lenOf(NET.plateV[i]));
  });
  out.push({ pts: NET.linkV, d0: back });
  const dV = back + lenOf(NET.linkV);
  out.push({ pts: NET.pathV, d0: dV });
  const dH = dV + lenOf(NET.pathV);
  out.push({ pts: NET.heart, d0: dH });
  return { list: out, total: dH + lenOf(NET.heart) };
})();

/** Full routes for the heartbeat flow (one per stem villus): out to the loop tip, then back. */
const ROUTES = NET.legs.map((lg, i) => {
  const iA = NET.plateA.findIndex((p) => p[0] >= NET.xA);
  const plateToLeg = lg.outerX < NET.xA ? [...NET.plateA.slice(0, iA)].reverse().filter((p) => p[0] >= lg.outerX) : NET.plateA.slice(iA).filter((p) => p[0] <= lg.outerX);
  const loop = NET.loops[i];
  const L = cumLen(loop);
  const out = [...NET.pathA, NET.linkA[1], ...plateToLeg, ...lg.art, ...subPoly(loop, L, 0, 0.5)];
  const back = [...subPoly(loop, L, 0.5, 1), ...lg.ven, ...NET.plateV[i], NET.linkV[1], ...NET.pathV, ...NET.heart];
  return { out: pd(out), back: pd(back), outPts: out, backPts: back };
});

/** Chevron colours: towards the villi (blue blood) and back to the embryo (red blood); maternal blood. */
const CH_OUT = '#cfe0ff';
const CH_BACK = '#ffd2d9';
const CH_MAT = '#ffe1e6';

/** Maternal blood leaving the open spiral artery into the intervillous space (two spreading streams). */
const PLUME: P[][] = [-1, 1].map((sd) =>
  bez(MOUTH, [MOUTH[0] + sd * 20, MOUTH[1] + 50], [MOUTH[0] + sd * 44, MOUTH[1] + 110], [MOUTH[0] + sd * 40, MOUTH[1] + 190], 24),
);

/** A soft light where two vessels have just joined (bright as they meet, settling, gone once the circuit is whole). */
function joinGlow(t: number, at: number) {
  return seg(t, at - 0.03, at) * (1 - 0.6 * seg(t, at, at + 0.06)) * (1 - seg(t, W.circuit[0], W.circuit[1]));
}

function MiniEmbryo({ heartOn, beating }: { heartOn: number; beating: boolean }) {
  const { x0, x1, disc, amRy, ysRy } = EMB;
  const cx = (x0 + x1) / 2;
  const rx = (x1 - x0) / 2;
  const dome = `M${x0},${disc - 13} A${rx} ${amRy} 0 0 1 ${x1},${disc - 13}Z`;
  const yolk = `M${x0 + 8},${disc + 14} A${rx - 8} ${ysRy} 0 0 0 ${x1 - 8},${disc + 14}Z`;
  const band = (y0: number, y1: number, inset: number) => `M${x0 + inset},${y0} L${x1 - inset},${y0} L${x1 - inset},${y1} L${x0 + inset},${y1}Z`;
  return (
    <g pointerEvents="none">
      {/* Extra-embryonic mesoderm coat: outlines first (wide), then the fills, so only the union's rim shows. */}
      <g fill="none" stroke={K.meso} strokeWidth={8} strokeLinejoin="round">
        <path d={dome} />
        <path d={yolk} />
      </g>
      <path d={dome} fill="#22355f" />
      <path d={dome} fill="url(#w3b-ball)" />
      <path d={yolk} fill="#5a4a1f" />
      <path d={yolk} fill="rgba(242,193,78,0.32)" />
      <path d={yolk} fill="url(#w3b-ball)" />
      {/* Trilaminar disc: ectoderm, intra-embryonic mesoderm (thick: the vessels form in it), endoderm. */}
      <path d={band(disc - 13, disc - 8, 2)} fill={C.ectoderm} />
      <path d={band(disc - 8, disc + 10, 0)} fill={C.mesoIntra} />
      <path d={band(disc - 8, disc + 10, 0)} fill="url(#p-meso-extra)" opacity={0.35} />
      <path d={band(disc + 10, disc + 14, 3)} fill={C.endoderm} />
      <path d={band(disc - 13, disc + 14, 0)} fill="none" stroke="rgba(10,12,24,0.45)" strokeWidth={0.8} />
      {/* Heart tube at the cranial end: appears with the vessels, beats from week 4. */}
      <Part id="bihotz-hodia" show={heartOn}>
        <g>
          {beating && <animateTransform attributeName="transform" type="scale" values="1;1.12;1" keyTimes="0;0.25;1" dur="0.8s" repeatCount="indefinite" additive="sum" />}
          <VesselSet segs={[NET.heart]} w={11} lumen={beating ? '#8e3a72' : K.lumen} cells={false} />
        </g>
      </Part>
    </g>
  );
}

function CirculationDrawing({ t, reduced }: SceneProps) {
  const v1 = s(t, W.embryoStalk);
  const v2 = s(t, W.stalkPlate);
  const v3 = s(t, W.platevillus);
  const circuit = s(t, W.circuit);
  const hb = s(t, W.heartbeat);
  const beating = t >= W.heartbeat[0];
  // Chevrons creep forward ~34 px per second of playback (24 s stage) once the heart beats.
  const phase = Math.max(0, t - W.heartbeat[0]) * 24 * 34;
  const exchange = Math.max(s(t, W.o2), 0);
  const ka = clamp(hb * 1.7);
  const kv = clamp(hb * 1.7 - 0.7);
  const cA = mix(K.lumen, BLUE, ka);
  const cV = mix(K.lumen, RED, kv);

  // Vessels forming in the embryo and the stalk (beat 1), split where the stalk begins.
  const grow = (pts: P[], k: number) => (k > 0.01 ? subPoly(pts, cumLen(pts), 0, k) : []);
  const stalkPart = (p: P) => p[1] < STALK_FROM;
  const formA = vesselSegments(PLAN_A, v1).map((p) => splitBy(p, stalkPart));
  const formV = vesselSegments(PLAN_V, v1).map((p) => splitBy(p, stalkPart));
  const umb = [...formA.flatMap((q) => q.a.map((p) => ({ p, c: cA }))), ...formV.flatMap((q) => q.a.map((p) => ({ p, c: cV })))];
  umb.push({ p: grow(NET.linkA, v2), c: cA }, { p: grow(NET.linkV, v2), c: cV });
  const intra = [...formA.flatMap((q) => q.b.map((p) => ({ p, c: cA }))), ...formV.flatMap((q) => q.b.map((p) => ({ p, c: cV })))];
  const plate = [{ p: NET.plateA, c: cA }, ...NET.plateV.map((p) => ({ p, c: cV }))];
  const caps: { p: P[]; c: string }[] = [];
  NET.loops.forEach((loop, i) => {
    const L = cumLen(loop);
    caps.push({ p: subPoly(loop, L, 0, 0.5), c: cA }, { p: subPoly(loop, L, 0.5, 1), c: cV });
    const lg = NET.legs[i];
    caps.push({ p: [...grow([...lg.art].reverse(), v3)].reverse(), c: cA }, { p: grow(lg.ven, v3), c: cV });
  });
  BRANCHES.forEach((b) => caps.push({ p: NET.branchLoops[b.i], c: b.arterial ? cA : cV }));
  // Mouths where a vessel enters the side of a plate vessel drawn over it: re-open them (no wall across).
  const stubs: { a: P; b: P; w: number; c: string; id: string }[] = [];
  if (v2 > 0.98) stubs.push({ a: [NET.xA, NET.plateAAt(NET.xA) + 6], b: [NET.xA, NET.plateAAt(NET.xA) + 1.6], w: 6.2, c: cA, id: 'zilbor-hodiak' });
  if (v2 > 0.98) stubs.push({ a: [NET.xV, NET.plateVAt(NET.xV) + 6], b: [NET.xV, NET.plateVAt(NET.xV) + 1.6], w: 6.2, c: cV, id: 'zilbor-hodiak' });
  if (v3 > 0.98)
    for (const lg of NET.legs) {
      stubs.push({ a: [lg.outerX, NET.plateAAt(lg.outerX) - 6], b: [lg.outerX, NET.plateAAt(lg.outerX) - 1.6], w: 6.4, c: cA, id: 'biloxka-kapilarrak' });
      stubs.push({ a: [lg.innerX, NET.plateVAt(lg.innerX) - 6], b: [lg.innerX, NET.plateVAt(lg.innerX) - 1.6], w: 6.4, c: cV, id: 'biloxka-kapilarrak' });
    }
  const islA = islandStates(PLAN_A, 1, v1);
  const islV = islandStates(PLAN_V, 1, v1);
  // Beat 4: a light running once round the whole circuit.
  const D = circuit * (PIECES.total + 90);
  const pulse = circuit > 0 && circuit < 1
    ? PIECES.list
        .map(({ pts, d0 }) => {
          const L = cumLen(pts);
          const tot = L[L.length - 1];
          const a = (D - d0 - 70) / tot;
          const b = (D - d0) / tot;
          return b > 0 && a < 1 ? pd(subPoly(pts, L, Math.max(0, a), Math.min(1, b))) : '';
        })
        .join('')
    : '';
  const g1 = joinGlow(t, W.embryoStalk[1]);
  const g2 = joinGlow(t, W.stalkPlate[1]);
  const g3 = joinGlow(t, W.platevillus[1]);
  const junction1 = NET.pathA[Math.round(NET.pathA.length * 0.48)];

  return (
    <g mask="url(#m-slab)">
      <Part id="dezidua-basala" quiet>
        <rect x={0} y={0} width={1000} height={Y.decB + 1} fill="url(#p-decidua)" />
        <rect x={0} y={0} width={1000} height={Y.decB + 1} fill="url(#w3b-vshade)" />
      </Part>

      <Part id="biloxka-arteko-espazioa">
        <rect x={0} y={Y.roofB - 1} width={1000} height={Y.plateSyn - Y.roofB + 14} fill="url(#w3b-blood)" />
      </Part>
      <rect x={0} y={Y.roofB} width={1000} height={Y.plateSyn - Y.roofB} fill="url(#w3b-vshade)" pointerEvents="none" />
      <ellipse cx={ART_X} cy={Y.roofB + 30} rx={84} ry={58} fill="url(#w3c-plume)" pointerEvents="none" />
      {!reduced && (
        <>
          {['M226,110 C236,200 214,250 230,286', 'M776,286 C766,230 790,160 772,110'].map((d, i) => (
            <Flow key={i} d={d} n={3} dur={8 + i} r={2.2} color="#e8566d" reduced={reduced} />
          ))}
          <Flow d={`M${MOUTH[0]},${MOUTH[1]} C${MOUTH[0] - 18},${MOUTH[1] + 50} ${MOUTH[0] - 40},${MOUTH[1] + 110} ${MOUTH[0] - 36},${MOUTH[1] + 190}`} n={4} dur={4} r={2.3} color="#ff8a9b" />
          <Flow d={`M${MOUTH[0]},${MOUTH[1]} C${MOUTH[0] + 20},${MOUTH[1] + 50} ${MOUTH[0] + 42},${MOUTH[1] + 110} ${MOUTH[0] + 38},${MOUTH[1] + 190}`} n={4} dur={4.4} r={2.3} color="#ff8a9b" />
        </>
      )}

      {/* Shadows of the villous tree on the maternal blood. */}
      <g transform="translate(5 7)" fill={K.shadow} pointerEvents="none">
        <path d={closeDown(SYN_TOP)} />
        {BR_SYN.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>

      <Part id="biloxka-tertziarioa">
        {TRUNK_SIDES.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#eef3ff" strokeWidth={3.4} opacity={0.24} />
        ))}
        {BR_SYN.map((p, i) => (
          <path key={`b${i}`} d={pd(p)} fill="none" stroke="#eef3ff" strokeWidth={3.4} opacity={0.24} />
        ))}
      </Part>

      <Part id="sinzitiotrofoblastoa" quiet>
        <g fill="none">
          <path d={fringe(SYN_TOP, 4.4, 3)} stroke={K.fringe} strokeWidth={0.9} />
          <path d={fringe([...ROOF].reverse(), 4.4, 3)} stroke={K.fringe} strokeWidth={0.9} />
          {BR_SYN.map((p, i) => (
            <path key={i} d={fringe(p, 4.4, 2.8)} stroke={K.fringe} strokeWidth={0.9} />
          ))}
          <path d={pd(SYN_TOP)} stroke={K.synEdge} strokeWidth={3} />
          <path d={pd(ROOF)} stroke={K.synEdge} strokeWidth={3} />
          {BR_SYN.map((p, i) => (
            <path key={i} d={pd(p)} stroke={K.synEdge} strokeWidth={3} />
          ))}
        </g>
        <path d={ROOF_FILL} fill="url(#w3b-syn)" />
        <path d={closeDown(SYN_TOP)} fill="url(#w3b-syn)" />
        {BR_SYN.map((p, i) => (
          <path key={i} d={pd(p, true)} fill="url(#w3b-syn)" />
        ))}
        <path d={runs(offsetPoly(SYN_TOP, -2), (p) => p[1] > Y.roofB + 4).map((r) => pd(r)).join('')} fill="none" stroke={K.synRim} strokeWidth={1.2} />
      </Part>

      {/* Opaque bases under the inner layers, so a dimmed layer never shows the green below. */}
      <g fill={BASE} pointerEvents="none">
        <path d={closeDown(CYTO_TOP)} />
        {BR_CYTO.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>
      <Part id="zitotrofoblastoa" quiet>
        <path d={closeDown(CYTO_TOP)} fill={K.cytoGround} />
        {BR_CYTO.map((p, i) => (
          <path key={i} d={pd(p, true)} fill={K.cytoGround} />
        ))}
        <CellPaths b={CELLS.wall} />
        <CellPaths b={CELLS.col} />
      </Part>
      <Part id="kanpoko-zorro-zitotrofoblastikoa" quiet>
        <rect x={0} y={Y.decB} width={1000} height={Y.shellB - Y.decB} fill={K.cytoGround} />
        <CellPaths b={CELLS.shell} />
      </Part>

      <g fill={BASE} pointerEvents="none">
        <path d={closeDown(MESO_TOP)} />
        {BR_MESO.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>
      <Part id="enbrioi-kanpoko-mesodermoa" quiet>
        <path d={closeDown(MESO_TOP)} fill={K.meso} />
        {BR_MESO.map((p, i) => (
          <path key={i} d={pd(p, true)} fill={K.meso} />
        ))}
        <path d={closeDown(MESO_TOP)} fill="url(#p-meso-extra)" />
      </Part>

      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={Y.plateB} width={1000} height={640 - Y.plateB} fill="#121a2c" />
        <rect x={0} y={Y.plateB} width={1000} height={640 - Y.plateB} fill="url(#g-shade)" opacity={0.35} />
      </Part>
      <rect x={0} y={Y.plateSyn} width={1000} height={Y.plateB - Y.plateSyn} fill="url(#w3b-vshade)" opacity={0.6} pointerEvents="none" />

      {/* Connecting stalk: extra-embryonic mesoderm cord from the plate to the embryo's caudal end. */}
      <Part id="finkapen-pedikulua">
        <path d={STALK_BODY.d} fill={K.meso} />
        <path d={STALK_BODY.d} fill="url(#p-meso-extra)" opacity={0.7} />
        <path d={STALK_BODY.d} fill="url(#w3b-cyl)" />
        <g fill="none" stroke={K.mesoEdge} strokeWidth={1.1}>
          <path d={pd(STALK_BODY.left.slice(5))} />
          <path d={pd(STALK_BODY.right.slice(5))} />
        </g>
      </Part>

      <MiniEmbryo heartOn={seg(t, 0.04, 0.1)} beating={beating && !reduced} />

      {/* Blood islands in the embryo and the stalk, turning into vessels that grow until they meet. */}
      <g pointerEvents="none">
        {[...islA, ...islV].map((st, i) => (
          <Island key={i} x={st.p[0]} y={st.p[1]} s={st.appear * (1 - st.gone)} seed={i * 7 + 3} scale={0.95} />
        ))}
      </g>

      {/* Vessels, each anatomical piece its own part. Drawn stalk → embryo → villi → plate, so every piece
          meets the next without a wall across the junction (mouths re-opened below). */}
      <Part id="zilbor-hodiak" show={v1 > 0.02 ? 1 : 0}>
        <VesselSet segs={umb.map((q) => q.p)} lumens={umb.map((q) => q.c)} w={6.2} />
      </Part>
      <VesselSet segs={intra.map((q) => q.p)} lumens={intra.map((q) => q.c)} w={6.2} linecap="butt" />
      <Part id="biloxka-kapilarrak">
        <VesselSet segs={caps.map((q) => q.p)} lumens={caps.map((q) => q.c)} w={6.4} />
      </Part>
      <Part id="enbrioi-kanpoko-hodiak">
        <VesselSet segs={plate.map((q) => q.p)} lumens={plate.map((q) => q.c)} w={7} />
      </Part>
      {stubs.map((q, i) => (
        <Part key={i} id={q.id}>
          <g fill="none" strokeLinecap="butt">
            <path d={pd([q.a, q.b])} stroke={K.endo} strokeWidth={q.w} />
            <path d={pd([q.a, [q.b[0], q.b[1] + Math.sign(q.b[1] - q.a[1]) * 1.4]])} stroke={q.c} strokeWidth={q.w * 0.6} />
          </g>
        </Part>
      ))}

      {/* Junctions lighting up as they close. */}
      <g pointerEvents="none">
        {g1 > 0.01 && <circle cx={junction1[0]} cy={junction1[1]} r={16} fill="url(#w3c-join)" opacity={g1} />}
        {g2 > 0.01 && <circle cx={(NET.xA + NET.xV) / 2} cy={Y.plateB - 8} r={18} fill="url(#w3c-join)" opacity={g2} />}
        {g3 > 0.01 &&
          NET.legs.flatMap((lg, i) => [
            <circle key={`a${i}`} cx={lg.outerX} cy={Y.plateMeso + 12} r={14} fill="url(#w3c-join)" opacity={g3} />,
            <circle key={`v${i}`} cx={lg.innerX} cy={Y.plateMeso + 8} r={14} fill="url(#w3c-join)" opacity={g3} />,
          ])}
        {pulse && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={pulse} stroke="#fff2c2" strokeWidth={10} opacity={0.22} />
            <path d={pulse} stroke="#fff6dc" strokeWidth={3} opacity={0.95} />
          </g>
        )}
      </g>

      {beating &&
        !reduced &&
        ROUTES.flatMap((r, i) => [
          <Flow key={`o${i}`} d={r.out} n={9} dur={7.5} r={2} color="#9db8ff" />,
          <Flow key={`b${i}`} d={r.back} n={9} dur={7.5} r={2} color="#ff9aa8" />,
        ])}
      {/* Direction of the embryo's blood once the heart beats: out along the blue vessels, back along the red. */}
      {hb > 0.01 && (
        <g pointerEvents="none" opacity={hb}>
          {ROUTES.flatMap((r, i) => [
            ...chevrons(r.outPts, 62, phase, false).map((c, k) => <Chevron key={`o${i}-${k}`} {...c} color={CH_OUT} />),
            ...chevrons(r.backPts, 62, phase, true).map((c, k) => <Chevron key={`b${i}-${k}`} {...c} color={CH_BACK} />),
          ])}
        </g>
      )}

      {/* Spiral artery opening through the shell. */}
      <Part id="arteria-espiralak">
        <path d={pd(ARTERY)} fill="none" stroke="#5b1222" strokeWidth={11} strokeLinecap="round" />
        <path d={pd(ARTERY)} fill="none" stroke="#c9314f" strokeWidth={8.5} strokeLinecap="round" />
        <path d={pd(ARTERY)} fill="none" stroke="#f0566f" strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={MOUTH[0]} cy={MOUTH[1] + 1} rx={8} ry={3.6} fill="#f0566f" />
      </Part>
      {!reduced && <Flow d={pd(ARTERY)} n={4} dur={4.5} r={2} color="#ffc2cc" reduced={reduced} />}
      {/* Maternal blood: down the spiral artery and out into the intervillous space (it never enters a villus). */}
      <g pointerEvents="none" opacity={0.9}>
        {chevrons(ARTERY.slice(Math.floor(ARTERY.length * 0.3)), 40, t * 24 * 20, false).map((c, k) => (
          <Chevron key={`a${k}`} {...c} color={CH_MAT} size={0.85} />
        ))}
        {PLUME.flatMap((pl, i) => chevrons(pl, 58, 20 + t * 24 * 20, false).map((c, k) => <Chevron key={`p${i}-${k}`} {...c} color={CH_MAT} size={0.9} />))}
      </g>

      {/* Roundness of the stem villi. */}
      <g pointerEvents="none">
        {TRUNK_BODY.map((d, i) => (
          <path key={i} d={d} fill="url(#w3b-cyl)" />
        ))}
      </g>

      {/* Placental barrier: the wall between maternal blood and capillary, lit where the exchange is shown. */}
      <Part id="karena-muga" show={exchange > 0.02 ? exchange : 0}>
        <path d={BARRIER_BAND} fill="url(#w3c-barrier)" />
        <path d={BARRIER_EDGE} fill="none" stroke="#fde68a" strokeWidth={2.2} opacity={0.85} />
      </Part>
      <Arrow from={[738, 196]} to={[642, 196]} bend={0} color="#fbbf24" show={s(t, W.o2)} progress={s(t, W.o2)} width={3} />
      <Arrow from={[642, 232]} to={[738, 232]} bend={0} color="#60a5fa" show={s(t, W.co2)} progress={s(t, W.co2)} width={3} />

      <Part id="korion-plaka">
        <path d={`M233,${Y.plateSyn + 1} h-7 v${Y.plateB - Y.plateSyn - 2} h7`} fill="none" stroke="#eef3ff" strokeWidth={1.8} opacity={0.85} strokeLinejoin="round" />
      </Part>
    </g>
  );
}

/** The barrier stretch on the right stem villus (outer surface → capillary leg) where the exchange arrows cross. */
const BARRIER_Y = [176, 252] as const;
const { BARRIER_BAND, BARRIER_EDGE } = (() => {
  const tr = TRUNKS[1];
  const outer: P[] = [];
  const inner: P[] = [];
  for (let y = BARRIER_Y[0]; y <= BARRIER_Y[1]; y += 4) {
    outer.push([fx(tr.f, y) + fw(tr.f, y, 0), y]);
    inner.push([fx(tr.f, y) + fw(tr.f, y, tr.ts + tr.tc) * 0.46 + 3.4, y]);
  }
  return { BARRIER_BAND: pd([...outer, ...[...inner].reverse()], true), BARRIER_EDGE: pd(outer) };
})();

function OverviewDefs() {
  return (
    <defs>
      <radialGradient id="w3c-plume" cx="50%" cy="30%" r="60%">
        <stop offset="0" stopColor="#ff6b81" stopOpacity="0.5" />
        <stop offset="0.6" stopColor="#ef4a62" stopOpacity="0.2" />
        <stop offset="1" stopColor="#ef4a62" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="w3c-join">
        <stop offset="0" stopColor="#fff4c8" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#ffd27a" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffb86b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="w3c-barrier" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fde68a" stopOpacity="0" />
        <stop offset="0.25" stopColor="#fde68a" stopOpacity="0.38" />
        <stop offset="0.75" stopColor="#fde68a" stopOpacity="0.38" />
        <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/** Where a polyline crosses height y (first crossing). */
function atY(pts: P[], y: number): [number, number] {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) {
      const k = (y - a[1]) / (b[1] - a[1]);
      return [a[0] + (b[0] - a[0]) * k, y];
    }
  }
  return [pts[0][0], pts[0][1]];
}

function labels(t: number) {
  const v1 = s(t, W.embryoStalk);
  const v2 = s(t, W.stalkPlate);
  const exchange = s(t, W.o2);
  const [l, r] = TRUNKS;
  const wallAt = (tr: (typeof TRUNKS)[number], y: number, d: number, side: number): [number, number] => [fx(tr.f, y) + side * fw(tr.f, y, d), y];
  const syn = wallAt(l, 236, l.ts / 2, -1);
  const cyto = wallAt(l, 262, l.ts + l.tc / 2, -1);
  const ter = wallAt(r, 264, 0, 1);
  const cap: [number, number] = [fx(r.f, 288) + fw(r.f, 288, r.ts + r.tc) * 0.46, 288];
  const bar = wallAt(r, 214, r.ts / 2, 1);
  const umbL = atY(NET.pathA.slice(Math.floor(NET.pathA.length * 0.45)), 456);
  const umbR = atY(NET.pathV, 450);
  const stalk = atY(STALK_BODY.left, 410);
  return (
    <>
      <Label id="dezidua-basala" x={190} y={32} ax={300} ay={22} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={56} ax={262} ay={Y.decB + 7} text="Zorro zitotrofoblastikoa" />
      <Label id="arteria-espiralak" x={190} y={84} ax={MOUTH[0] - 5} ay={Y.roofB - 6} />
      <Label id="biloxka-arteko-espazioa" x={190} y={128} ax={256} ay={150} />
      <Label id="sinzitiotrofoblastoa" x={190} y={196} ax={syn[0]} ay={syn[1]} />
      <Label id="zitotrofoblastoa" x={190} y={240} ax={cyto[0]} ay={cyto[1]} />
      <Label id="korion-plaka" x={190} y={318} ax={226} ay={318} />
      <Label id="finkapen-pedikulua" x={190} y={404} ax={stalk[0]} ay={stalk[1]} />
      <Label id="zilbor-hodiak" x={190} y={456} ax={umbL[0]} ay={umbL[1]} show={v1} />
      <Label id="korion-barrunbea" x={190} y={500} ax={300} ay={470} />
      <Label id="bihotz-hodia" x={190} y={566} ax={EMB.x0 - 6} ay={EMB.disc + 1} show={seg(t, 0.06, 0.1)} />
      <Label id="karena-muga" x={810} y={214} ax={bar[0]} ay={bar[1]} show={exchange} />
      <Label id="biloxka-tertziarioa" x={810} y={262} ax={ter[0]} ay={ter[1]} />
      <Label id="biloxka-kapilarrak" x={810} y={292} ax={cap[0]} ay={cap[1]} text="Biloxka kapilarrak" />
      <Label id="enbrioi-kanpoko-mesodermoa" x={810} y={322} ax={742} ay={325} text="Kanpoko mesodermoa" />
      <Label id="enbrioi-kanpoko-hodiak" x={810} y={354} ax={736} ay={NET.plateAAt(736)} text="Enbrioi kanpoko hodiak" />
      <Label key="zh-r" id="zilbor-hodiak" x={810} y={450} ax={umbR[0]} ay={umbR[1]} show={Math.max(v1, v2)} />
    </>
  );
}

export function CirculationOverview(props: SceneProps) {
  const { t } = props;
  return (
    <g>
      <W3bDefs />
      <OverviewDefs />
      <CirculationDrawing {...props} />
      {labels(t)}
      <Note x={352} y={528} align="end" show={seg(t, 0.0, 0.04)}>
        Enbrioi barruko odol-hodiak
      </Note>
      <Note x={752} y={196} align="start" show={s(t, W.o2)}>
        O2
      </Note>
      <Note x={752} y={232} align="start" show={s(t, W.co2)}>
        CO2
      </Note>
      {/* Key to the chevrons (the embryo's blood once it flows). */}
      {s(t, W.heartbeat) > 0.01 && (
        <g pointerEvents="none" opacity={s(t, W.heartbeat)}>
          <path d="M804,528 H828" stroke={K.endo} strokeWidth={7} strokeLinecap="round" />
          <path d="M804,528 H828" stroke={BLUE} strokeWidth={4} strokeLinecap="round" />
          <Chevron x={817} y={528} a={0} o={1} color={CH_OUT} size={0.9} />
          <path d="M804,554 H828" stroke={K.endo} strokeWidth={7} strokeLinecap="round" />
          <path d="M804,554 H828" stroke={RED} strokeWidth={4} strokeLinecap="round" />
          <Chevron x={815} y={554} a={180} o={1} color={CH_BACK} size={0.9} />
        </g>
      )}
      <Note x={834} y={528} align="start" show={s(t, W.heartbeat)}>
        Enbrioitik biloxketara
      </Note>
      <Note x={834} y={554} align="start" show={s(t, W.heartbeat)}>
        Biloxketatik enbrioira
      </Note>
      <Note x={500} y={614} tone="accent" show={s(t, W.heartbeat) * (1 - seg(t, W.o2[0], W.o2[0] + 0.03))}>
        Bihotzak taupada egiten hasten du (4. astea): odola zirkulatzen hasten da
      </Note>
    </g>
  );
}

/* ================================================================== */
/* Placental barrier close-up (karena-muga): maternal ← wall → fetal   */
/* ================================================================== */

/**
 * The wall of a tertiary villus cut across and magnified: maternal blood (left) | syncytiotrophoblast
 * (one cytoplasm, many nuclei, microvilli towards the mother) | cytotrophoblast (one row of cells) |
 * connective tissue (extra-embryonic mesoderm) | capillary endothelium | fetal blood (right).
 */
const BX = [372, 434, 478, 584, 598];
const wave = (y: number) => 7 * Math.sin(y / 96 + 0.6) + 3 * Math.sin(y / 41 + 1.7);
const bx = (i: number, y: number) => BX[i] + wave(y) + 1.4 * Math.sin(y / 23 + i * 1.7);
const BND: P[][] = BX.map((_, i) => {
  const pts: P[] = [];
  for (let y = -12; y <= 652; y += 8) pts.push([bx(i, y), y]);
  return pts;
});
const between = (i: number, j: number) => pd([...BND[i], ...[...BND[j]].reverse()], true);

const BARRIER = (() => {
  const cyto = newBatch();
  wallCells(cyto, BND[1], BX[2] - BX[1] - 1, 34, { flip: true, detail: true, scale: 2.4 });
  // Syncytial nuclei: scattered, no cell borders.
  let synNuc = '';
  let synNucleoli = '';
  for (let k = 0; k < 15; k++) {
    const y = 18 + k * 44 + (rand(k * 3.1) - 0.5) * 16;
    const x = lerp(bx(0, y) + 14, bx(1, y) - 12, rand(k * 7.7));
    synNuc += ellipseSub(x, y, 7.5, 5, 70 + rand(k) * 40);
    synNucleoli += ellipseSub(x + 1.5, y - 1, 1.4, 1.4);
  }
  // Connective tissue: spindle-shaped mesenchymal cells and fine fibres.
  const spindle = newBatch();
  for (let k = 0; k < 16; k++) {
    const y = 10 + k * 40 + (rand(k * 5.3) - 0.5) * 18;
    const x = lerp(bx(2, y) + 20, bx(3, y) - 18, rand(k * 9.1));
    const deg = 80 + (rand(k * 2.9) - 0.5) * 60;
    spindle.body.push(ellipseSub(x, y, 17, 4.6, deg));
    spindle.nuc.push(ellipseSub(x, y, 7, 2.6, deg));
  }
  let fibres = '';
  for (let k = 0; k < 9; k++) {
    const x0 = lerp(BX[2] + 12, BX[3] - 10, k / 8);
    const pts: P[] = [];
    for (let y = -10; y <= 650; y += 14) pts.push([x0 + wave(y) + 5 * Math.sin(y / 31 + k * 2.1), y]);
    fibres += pd(pts);
  }
  // Endothelium: thin flattened cells, their nuclei bulging into the lumen; junctions between cells.
  let endoNuc = '';
  let junctions = '';
  for (let y = 30; y < 640; y += 92) {
    const xm = (bx(3, y) + bx(4, y)) / 2 + 3;
    endoNuc += ellipseSub(xm, y, 15, 4.2, 90 + wave(y) * 0.6);
  }
  for (let y = 76; y < 640; y += 92) junctions += `M${bx(3, y).toFixed(1)},${y}L${bx(4, y).toFixed(1)},${y + 3}`;
  // Maternal blood: anucleate biconcave red cells.
  const maternal: { x: number; y: number; a: number }[] = [];
  for (let k = 0; k < 44; k++) maternal.push({ x: 236 + (k % 4) * 34 + rand(k * 1.7) * 14, y: Math.floor(k / 4) * 62 + rand(k * 4.3) * 26, a: rand(k * 8.1) * 180 });
  // Fetal blood: primitive (nucleated) red cells; the first few come from the villus's own blood islands.
  // Jittered 3 × 6 grid; the order (which cells are already there, which arrive) is shuffled.
  const grid = Array.from({ length: 18 }, (_, k) => ({
    x: 648 + (k % 3) * 50 + (Math.floor(k / 3) % 2) * 22 + (rand(k * 2.3) - 0.5) * 16,
    y: Math.floor(k / 3) * 120 + (k % 3) * 40 + (rand(k * 6.1) - 0.5) * 30,
    o: [0, 10, 14, 7, 3, 16, 9, 1, 12, 5, 17, 2, 8, 15, 4, 11, 6, 13][k],
  }));
  const fetal = grid.sort((p, q) => p.o - q.o).map(({ x, y }) => ({ x, y }));
  return { cyto, synNuc, synNucleoli, spindle, fibres, endoNuc, junctions, maternal, fetal };
})();

const wrap = (y: number) => ((((y + 40) % 720) + 720) % 720) - 40;

/** Molecules crossing the barrier: O2 (pairs) and nutrients (hexagons) → fetus, CO2 (triplets) → mother. */
function molecules(k: number, dir: 1 | -1, n: number, yTop: number, seed: number, squeeze = 1) {
  // squeeze < 1 pulls the start and end points toward the barrier, so they stay in frame when pushed in.
  const sq = (x: number) => 485 + (x - 485) * squeeze;
  return Array.from({ length: n }, (_, i) => {
    const p = clamp((k - (i / n) * 0.42) / 0.5);
    const e = easeInOut(p);
    const xa = sq(dir > 0 ? 270 + rand(seed + i) * 60 : 676 + rand(seed + i) * 70);
    const xb = sq(dir > 0 ? 652 + rand(seed + i * 3) * 100 : 262 + rand(seed + i * 3) * 80);
    const y0 = yTop + i * (150 / n) + rand(seed + i * 5) * 12;
    return { x: lerp(xa, xb, e), y: y0 + 8 * Math.sin(e * Math.PI * 3 + i), show: clamp(k * 6 - (i / n) * 2.5), i };
  });
}

export function BarrierClose({ t, reduced }: SceneProps) {
  const pv = s(t, W.platevillus);
  const hb = s(t, W.heartbeat);
  const o2 = s(t, W.o2);
  const co2 = s(t, W.co2);
  const drift = Math.max(0, t - W.heartbeat[0]) * 900;
  const maternalDrift = t * 300;
  const fetalLumen = mix('#5a1f36', '#6e2640', pv);
  const [g0, g4] = [BND[0], BND[4]];
  // Push-in onto the four-layer band, then its layers lit one by one from the capillary outwards.
  const b0 = W.barrier[0];
  const push = easeInOut(seg(t, b0, b0 + 0.02));
  const sc = lerp(1, 1.5, push);
  const z = zoom(485, 320, sc, lerp(485, 500, push), 320);
  const rv = (i: number) => seg(t, b0 + 0.02 + i * 0.014, b0 + 0.032 + i * 0.014);
  const done = seg(t, W.barrier[1], W.barrier[1] + 0.015);
  const cur = (i: number) => rv(i) * (1 - (i < 3 ? rv(i + 1) : done));
  const settle = (i: number) => rv(i) * (1 - seg(t, W.o2[1], W.o2[1] + 0.04));
  const pre = 1 - seg(t, b0, b0 + 0.008);
  // Content point at the height that lands on screen row Y (leaders stay level through the push-in).
  const rowY = (Y: number) => 320 + (Y - 320) / sc;
  const mid = (i: number, j: number, Y: number) => z.at((bx(i, rowY(Y)) + bx(j, rowY(Y))) / 2, rowY(Y));
  const LAYERS: [number, number][] = [
    [3, 4],
    [2, 3],
    [1, 2],
    [0, 1],
  ];
  const aSyn = mid(0, 1, 226);
  const aCyto = mid(1, 2, 290);
  const aMeso = mid(2, 3, 372);
  const aEndo = mid(3, 4, 262);
  const aIvs = z.at(lerp(300, 340, push), rowY(lerp(172, 150, push)));
  const aCap = z.at(lerp(712, bx(4, rowY(400)) + 34, push), rowY(400));
  const aKar = z.at(bx(0, rowY(462)), rowY(462));
  const squeeze = lerp(1, 0.7, push);

  return (
    <g>
      <W3bDefs />
      <BarrierDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>

      {/* Maternal blood in the intervillous space. */}
      <Part id="biloxka-arteko-espazioa">
        <path d={pd([[0, -12], ...g0, [0, 652]], true)} fill={K.blood} />
        <g stroke="#6e0f22" strokeWidth={0.8}>
          {BARRIER.maternal.map((c, i) => {
            const y = wrap(c.y + maternalDrift);
            if (c.x + 11 > bx(0, y) - 4) return null;
            return (
              <g key={i} transform={`translate(${c.x.toFixed(1)} ${y.toFixed(1)}) rotate(${c.a.toFixed(0)})`}>
                <ellipse rx={11} ry={7.4} fill="#c8304a" />
                <ellipse rx={4.6} ry={2.8} fill="#e0687c" stroke="none" />
              </g>
            );
          })}
        </g>
      </Part>
      {!reduced && ['M276,-10 L290,650', 'M334,-10 L342,650'].map((d, i) => <Flow key={i} d={d} n={5} dur={9 + i * 2} r={3} color="#ff8a9b" reduced={reduced} />)}

      <Part id="sinzitiotrofoblastoa">
        <path d={fringe([...g0].reverse(), 5, 8)} fill="none" stroke={K.fringe} strokeWidth={1.4} />
        <path d={between(0, 1)} fill={C.syncytio} />
        <path d={between(0, 1)} fill="url(#w3c-syn-deep)" />
        <path d={BARRIER.synNuc} fill="#0c4630" stroke="#06301f" strokeWidth={0.8} />
        <path d={BARRIER.synNucleoli} fill="#3ea877" />
        <path d={pd(g0)} fill="none" stroke={K.synEdge} strokeWidth={2.4} />
      </Part>

      <path d={between(1, 3)} fill={BASE} pointerEvents="none" />
      <Part id="zitotrofoblastoa">
        <path d={between(1, 2)} fill={K.cytoGround} />
        <CellPaths b={BARRIER.cyto} sw={1.2} />
      </Part>

      <Part id="enbrioi-kanpoko-mesodermoa">
        <path d={between(2, 3)} fill={K.meso} />
        <path d={BARRIER.fibres} fill="none" stroke="#e58c6c" strokeWidth={1} opacity={0.75} />
        <CellPaths b={BARRIER.spindle} fill="#f8bba1" edge="#c9694d" nuc="#a8503a" sw={0.9} />
        {/* Basement membranes (trophoblast / endothelium). */}
        <path d={pd(offsetPoly(BND[2], -1.5)) + pd(offsetPoly(BND[3], 1.5))} fill="none" stroke="#ffe0c2" strokeWidth={1.6} opacity={0.7} />
      </Part>

      <Part id="biloxka-kapilarrak">
        <path d={pd([...g4, [1000, 652], [1000, -12]], true)} fill={fetalLumen} />
        <path d={pd([...g4, [1000, 652], [1000, -12]], true)} fill="url(#w3c-lumen)" />
        <g>
          {BARRIER.fetal.map((c, k) => {
            const base = k < 5 ? 1 : clamp((pv - ((k - 5) / 13) * 0.6) / 0.4);
            if (base <= 0.01) return null;
            const y = k < 5 ? wrap(c.y - drift) : lerp(690, wrap(c.y - drift), easeInOut(base));
            return (
              <g key={k} opacity={k < 5 ? 1 : Math.min(1, base * 2)}>
                <circle cx={c.x} cy={y} r={10} fill="#c63a55" stroke="#7a1830" strokeWidth={0.9} />
                <circle cx={c.x - 2.5} cy={y - 2.5} r={5} fill="#e0627a" opacity={0.45} />
                <circle cx={c.x + 1} cy={y - 0.5} r={3.4} fill="#5e1026" />
              </g>
            );
          })}
        </g>
      </Part>
      <Part id="endotelioa">
        <path d={between(3, 4)} fill={K.endo} />
        <path d={BARRIER.endoNuc} fill={K.endoNuc} />
        <path d={BARRIER.junctions} fill="none" stroke="#8a3a52" strokeWidth={1.2} />
        <path d={pd(g4)} fill="none" stroke="#a5566b" strokeWidth={1.2} />
      </Part>
      {hb > 0 && !reduced && ['M680,650 L668,-10', 'M742,650 L736,-10'].map((d, i) => <Flow key={i} d={d} n={5} dur={4 + i} r={3.4} color="#e0506c" reduced={reduced} />)}

      {/* The barrier itself, lit from both of its faces (maternal surface and capillary lining). */}
      <Part id="karena-muga">
        <path d={between(0, 4)} fill="#fde68a" opacity={0.07} />
        <path d={pd(g0) + pd(g4)} fill="none" stroke="#fde68a" strokeWidth={9} opacity={0.12} />
        <path d={pd(g0) + pd(g4)} fill="none" stroke="#fde68a" strokeWidth={1.8} opacity={0.8} />
      </Part>
      {/* The layer being named glows, outlined on its own boundaries; named layers keep a faint rim. */}
      <g pointerEvents="none">
        {LAYERS.map(([i, j], k) => {
          const c = cur(k);
          const o = Math.max(c, 0.35 * settle(k));
          if (o < 0.01) return null;
          return (
            <g key={k}>
              <path d={between(i, j)} fill="#fde68a" opacity={0.26 * c} />
              <path d={pd(BND[i]) + pd(BND[j])} fill="none" stroke="#fff4c2" strokeWidth={2.2 / sc} opacity={o} />
            </g>
          );
        })}
      </g>

      {/* Exchange: molecules cross every layer, the bloods themselves never do. */}
      <g pointerEvents="none">
        {o2 > 0 &&
          molecules(o2, 1, 9, lerp(132, 168, push), 11, squeeze).map((m) =>
            m.i % 3 === 2 ? (
              <path key={m.i} d={hex(m.x, m.y, 5.2)} fill="#fef3c7" stroke="#7a5a12" strokeWidth={1} opacity={m.show} />
            ) : (
              <g key={m.i} opacity={m.show} stroke="#6b4a06" strokeWidth={1}>
                <circle cx={m.x - 3.4} cy={m.y} r={4.2} fill="#fbbf24" />
                <circle cx={m.x + 3.4} cy={m.y} r={4.2} fill="#fbbf24" />
              </g>
            ),
          )}
        {co2 > 0 &&
          molecules(co2, -1, 8, lerp(352, 330, push), 23, squeeze).map((m) => (
            <g key={m.i} opacity={m.show} stroke="#123a66" strokeWidth={1}>
              <circle cx={m.x - 6.4} cy={m.y} r={3.6} fill="#93c5fd" />
              <circle cx={m.x} cy={m.y} r={4.2} fill="#3b82f6" />
              <circle cx={m.x + 6.4} cy={m.y} r={3.6} fill="#93c5fd" />
            </g>
          ))}
      </g>
      </g>
      <Arrow from={[236, 104]} to={[748, 104]} bend={0} color="#fbbf24" show={o2} progress={o2} width={3.2} />
      <Arrow from={[748, 540]} to={[236, 540]} bend={0} color="#60a5fa" show={co2} progress={co2} width={3.2} />

      {/* Frame: the close-up fades into the background at its edges. */}
      <g pointerEvents="none">
        <rect x={0} y={0} width={240} height={640} fill="url(#w3c-fade-l)" />
        <rect x={760} y={0} width={240} height={640} fill="url(#w3c-fade-r)" />
        <rect x={0} y={0} width={1000} height={60} fill="url(#w3c-fade-t)" />
        <rect x={0} y={566} width={1000} height={74} fill="url(#w3c-fade-b)" />
      </g>

      <Label id="biloxka-arteko-espazioa" x={190} y={150} ax={aIvs[0]} ay={aIvs[1]} />
      <Label id="sinzitiotrofoblastoa" x={190} y={226} ax={aSyn[0]} ay={aSyn[1]} text="4. Sinzitiotrofoblastoa" show={Math.max(pre, rv(3))} />
      <Label id="zitotrofoblastoa" x={190} y={278} ax={aCyto[0] + 4} ay={aCyto[1]} text="3. Zitotrofoblastoa" show={Math.max(pre, rv(2))} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={190} y={372} ax={aMeso[0]} ay={aMeso[1]} text="2. Kanpoko mesodermoa" show={Math.max(pre, rv(1))} />
      <Label id="karena-muga" x={190} y={462} ax={aKar[0]} ay={aKar[1]} show={Math.max(pre, done)} />
      <Label id="endotelioa" x={810} y={262} ax={aEndo[0]} ay={aEndo[1]} text="1. Endotelioa" show={Math.max(pre, rv(0))} />
      <Label id="biloxka-kapilarrak" x={810} y={400} ax={aCap[0]} ay={aCap[1]} />
      <Note x={500} y={76} show={o2}>
        O2 eta elikagaiak: amaren odoletik fetuarenera
      </Note>
      <Note x={500} y={572} tone="accent" show={co2}>
        CO2 eta hondakinak: fetuaren odoletik amarenera
      </Note>
      <Note x={500} y={606} tone="warn" show={Math.max(o2, co2)}>
        Bi odolak ez dira inoiz nahasten: karena mugak beti bereizten ditu
      </Note>
      <Note x={500} y={606} show={Math.max(1 - seg(t, W.heartbeat[0] - 0.04, W.heartbeat[0]), seg(t, b0, b0 + 0.02) * (1 - seg(t, W.o2[0] - 0.01, W.o2[0] + 0.01)))}>
        Karena muga: biloxka tertziarioen paretetan dauden zelula geruzak
      </Note>
      <Note x={500} y={572} tone="accent" show={hb * (1 - seg(t, b0, b0 + 0.015))}>
        Bihotzak taupada egiten hasten du: fetuaren odola kapilarrean mugitzen da
      </Note>
    </g>
  );
}

const hex = (x: number, y: number, r: number) =>
  'M' +
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
  }).join('L') +
  'Z';

function BarrierDefs() {
  const bg = '#101828';
  return (
    <defs>
      <linearGradient id="w3c-syn-deep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.18" />
      </linearGradient>
      <linearGradient id="w3c-lumen" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="scale(1000 1)">
        <stop offset="0.58" stopColor="#000" stopOpacity="0.28" />
        <stop offset="0.64" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="0.8" stopColor="#000" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="w3c-fade-l" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.75" stopColor={bg} stopOpacity="1" />
        <stop offset="1" stopColor={bg} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="w3c-fade-r" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0.75" stopColor={bg} stopOpacity="1" />
        <stop offset="1" stopColor={bg} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="w3c-fade-t" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={bg} stopOpacity="0.95" />
        <stop offset="1" stopColor={bg} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="w3c-fade-b" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0.2" stopColor={bg} stopOpacity="0.95" />
        <stop offset="1" stopColor={bg} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

