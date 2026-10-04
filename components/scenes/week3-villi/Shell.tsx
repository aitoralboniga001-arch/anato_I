'use client';

import { Flow, Label, Note, Part, clamp, lerp, seg, type SceneProps } from '@/components/kit';
import {
  BASE,
  CellPaths,
  K,
  VesselSet,
  W3bDefs,
  fingerOutline,
  fingerShape,
  fringe,
  fw,
  fx,
  layerTop,
  loopOf,
  newBatch,
  offsetPoly,
  pd,
  rand3,
  roundCell,
  runs,
  wallCells,
  xform,
  type CellBatch,
  type Finger,
  type P,
} from './art';

/**
 * Stage `zorro-zitotrofoblastikoa` — end of week 3 (Langman fig. 5-12 / 5-13, the notes' figure p10).
 * The simple tertiary villi span the intervillous space from the chorionic plate to the syncytial
 * roof. The cytotrophoblast at their tips (cytotrophoblastic columns) pushes through the syncytium to
 * the decidua basalis and spreads sideways until the columns join: the outer cytotrophoblastic shell,
 * which anchors the chorionic sac to the decidua. The syncytium stays as the lining of the
 * intervillous space (under the shell and over every villus). Spiral arteries open through the shell.
 * The villi that run plate → shell are the stem (anchoring) villi; their branches, which float in
 * the maternal blood without reaching the decidua, are the free villi.
 * Windows (shared by both views and content/weeks/week3b.ts; each starts at its beat and ends
 * before the beat's held frame):
 */
export const W = {
  penetrate: [0.095, 0.24],
  shell: [0.275, 0.42],
  artery: [0.535, 0.6],
  anchor: [0.645, 0.7],
  freeA: [0.745, 0.83],
  freeB: [0.875, 0.96],
} as const;

const Y = { decB: 92, shellSplit: 112, roofB: 124, plateSyn: 480, plateCyto: 491, plateMeso: 504, vessel: 538, plateB: 566 };
const FIL = { syn: 10, cyto: 20, meso: 30 };
const ART_X = 500;

const TRUNKS = [
  { x: 350, hw: 32, ts: 9, tc: 11, sway: 5, lam: 70, ph: 1.0, seed: 4 },
  { x: 650, hw: 32, ts: 9, tc: 11, sway: 5, lam: 66, ph: 3.6, seed: 5 },
] as const;

const BRANCHES = [
  { tr: 0, d: 150, ang: -44, len: 108, hw: 17, set: 0 },
  { tr: 0, d: 250, ang: 40, len: 92, hw: 15, set: 0 },
  { tr: 1, d: 140, ang: 44, len: 112, hw: 17, set: 0 },
  { tr: 1, d: 255, ang: -40, len: 88, hw: 15, set: 0 },
  { tr: 0, d: 82, ang: 54, len: 74, hw: 13, set: 1 },
  { tr: 0, d: 292, ang: -56, len: 62, hw: 12.5, set: 1 },
  { tr: 1, d: 86, ang: -54, len: 78, hw: 13, set: 1 },
  { tr: 1, d: 296, ang: 56, len: 60, hw: 12.5, set: 1 },
] as const;

function geometry(t: number) {
  const penetrate = seg(t, W.penetrate[0], W.penetrate[1]);
  const shell = seg(t, W.shell[0], W.shell[1]);
  const artery = seg(t, W.artery[0], W.artery[1]);
  const anchor = seg(t, W.anchor[0], W.anchor[1]);
  const trunks = TRUNKS.map((d) => {
    const f: Finger = { x: d.x, base: Y.plateSyn, len: Y.plateSyn - Y.decB + 4, hw: d.hw, sway: d.sway, lam: d.lam, ph: d.ph };
    const cytoApex = lerp(Y.roofB, Y.decB - 2, penetrate);
    const mesoApex = Y.roofB + 44;
    return { ...d, f, cytoApex, mesoApex };
  });
  const branches = BRANCHES.map((b, i) => {
    const tr = trunks[b.tr];
    const yb = Y.plateSyn - b.d;
    const wm = fw(tr.f, yb, tr.ts + tr.tc);
    const side = b.ang > 0 ? 1 : -1;
    const bx = fx(tr.f, yb) + side * wm * 0.46;
    // Distance along the branch axis at which it leaves the trunk surface.
    const exit = (fw(tr.f, yb, 0) - wm * 0.46) / Math.sin((Math.abs(b.ang) * Math.PI) / 180);
    const w = b.set === 0 ? W.freeA : W.freeB;
    const stagger = (i % 4) * 0.012;
    const g = seg(t, w[0] + stagger, w[1]);
    const extra = b.set === 0 ? 1 + 0.12 * seg(t, W.freeB[0], W.freeB[1]) : 1;
    const len = lerp(exit * 0.8, b.len * extra, g);
    const f: Finger = { x: 0, base: 0, len, hw: b.hw, sway: 2.5, lam: 40, ph: i * 1.3 };
    return { ...b, i, tr, bx, by: yb, f, len, g, exit, ts: 6, tc: 7 };
  });
  return { penetrate, shell, artery, anchor, trunks, branches };
}
type Geo = ReturnType<typeof geometry>;
type Br = Geo['branches'][number];

/** Points of a branch layer in the frame (the finger is computed upright at the origin, then turned). */
function branchPts(b: Br, d: number): P[] | null {
  const s = fingerShape(b.f, d, 0, 0, -b.len + d, 5);
  return s ? xform(fingerOutline(s), b.bx, b.by, b.ang) : null;
}
function branchSide(b: Br, d: number) {
  const s = fingerShape(b.f, d, 0, 0, -b.len + d, 5);
  if (!s) return null;
  const T = (p: P[]) => xform(p, b.bx, b.by, b.ang);
  return { left: T(s.left), right: T(s.right), cap: T([s.left[s.left.length - 1], ...s.cap, s.right[s.right.length - 1]]) };
}

/** Roof contour (bottom of the syncytial roof) with fillets where each stem villus joins it. */
function roofContour(g: Geo, d: number, r: number): P[] {
  const y = Y.roofB + d;
  const pts: P[] = [[-40, y]];
  for (const tr of g.trunks) {
    const yy = y + r;
    const xl = fx(tr.f, yy) - fw(tr.f, yy, d);
    const xr = fx(tr.f, yy) + fw(tr.f, yy, d);
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

const PLATE_VESSEL: P[] = Array.from({ length: 61 }, (_, i) => {
  const x = 196 + i * 10.2;
  return [x, Y.vessel + 2.2 * Math.sin(x / 37)];
});

/** Every capillary of the villous tree (stem loops + branch loops) and the plate vessel. */
function vessels(g: Geo) {
  const trunkLoops = g.trunks.map((tr) => loopOf(tr.f, tr.ts, tr.tc, Y.vessel, tr.mesoApex + 6, Y.plateMeso));
  const branchLoops = g.branches
    .filter((b) => b.len > b.exit + 16)
    .map((b) => xform(loopOf(b.f, b.ts, b.tc, 2, -b.len + b.ts + b.tc + 5, 0), b.bx, b.by, b.ang));
  return { trunkLoops, branchLoops };
}

/** Shell cells: two rows under the decidua, spreading sideways from each column until they meet. */
function shellBatch(g: Geo, detail: boolean) {
  const b = newBatch();
  const ext = g.trunks.map((tr) => fw(tr.f, Y.decB + 10, tr.ts) * g.penetrate + g.shell * 190);
  const rows = [Y.decB + 5.2, Y.decB + 14.8];
  const grounds: [number, number][] = [];
  g.trunks.forEach((tr, i) => {
    if (ext[i] > 1) grounds.push([tr.x - ext[i], tr.x + ext[i]]);
  });
  rows.forEach((y, j) => {
    for (let x = 160 + (j ? 5.1 : 0); x < 842; x += 10.2) {
      let s = 0;
      g.trunks.forEach((tr, i) => {
        s = Math.max(s, clamp((ext[i] - Math.abs(x - tr.x) + 2) / 9));
      });
      if (g.artery > 0.3 && Math.abs(x - ART_X) < 9) continue;
      if (s > 0.05) roundCell(b, x + (rand3(x, y) - 0.5) * 1.2, y + (rand3(y, x) - 0.5) * 1, 4.9 * s, detail);
    }
  });
  return { b, grounds, ext };
}

/** Column core cells: the solid cytotrophoblast at the stem-villus tip, above its mesoderm core. */
function columnBatch(g: Geo, detail: boolean) {
  const b = newBatch();
  for (const tr of g.trunks) {
    const d = tr.ts + tr.tc;
    for (let j = 0; j < 12; j++) {
      const y = tr.mesoApex + 8 - j * 9.6;
      if (y < tr.cytoApex + 8) break;
      const half = fw(tr.f, y, d) + (y < Y.roofB ? tr.tc * 0.5 : 0);
      const wi = half - 5.4;
      const n = Math.floor((2 * wi) / 9.8) + 1;
      const step = n > 1 ? (2 * wi) / (n - 1) : 0;
      for (let c = 0; c < n; c++) roundCell(b, fx(tr.f, y) - wi + c * step + (j % 2 ? 1 : -1), y, 4.8, detail);
    }
  }
  return b;
}

function walls(g: Geo, detail: boolean): CellBatch {
  const b = newBatch();
  const sp = 11.5;
  const xs: [number, number][] = [];
  for (const tr of g.trunks) {
    const s = fingerShape(tr.f, tr.ts, Y.plateCyto, FIL.cyto, tr.cytoApex);
    if (!s) continue;
    // Above the roof the column has no syncytium on its sides: its wall cells stop at the roof.
    const below = (p: P) => p[1] > Y.roofB - 2;
    wallCells(b, s.left, tr.tc, sp, { detail, keep: below });
    wallCells(b, s.right, tr.tc, sp, { flip: true, detail, keep: below });
    xs.push([s.left[0][0], s.right[0][0]]);
  }
  xs.sort((p, q) => p[0] - q[0]);
  let from = 150;
  for (const [a, z] of xs) {
    wallCells(b, [[from, Y.plateCyto], [a, Y.plateCyto]], Y.plateMeso - Y.plateCyto, sp, { detail });
    from = z;
  }
  wallCells(b, [[from, Y.plateCyto], [850, Y.plateCyto]], Y.plateMeso - Y.plateCyto, sp, { detail });
  for (const br of g.branches) {
    if (br.len < br.exit * 0.85) continue;
    const s = branchSide(br, br.ts);
    if (!s) continue;
    const tr = br.tr;
    const keep = (p: P) => Math.abs(p[0] - fx(tr.f, p[1])) > fw(tr.f, p[1], 0) - 2;
    wallCells(b, s.left, br.tc, 9.5, { detail, keep });
    wallCells(b, s.right, br.tc, 9.5, { flip: true, detail, keep });
    wallCells(b, s.cap, br.tc, 9.5, { fit: true, detail, keep });
  }
  return b;
}

/** Spiral artery: coils down through the decidua; it then opens through the shell into the intervillous space. */
function arteryPts(open: number): P[] {
  const yEnd = lerp(Y.decB - 4, Y.roofB + 3, open);
  const pts: P[] = [];
  for (let y = -6; y <= yEnd; y += 3) pts.push([ART_X + 13 * Math.sin(y / 8.5) * clamp((Y.decB - y) / 30 + 0.15), y]);
  return pts;
}

function ShellDrawing({ t, reduced, detail = false, framed = true }: SceneProps & { detail?: boolean; framed?: boolean }) {
  const g = geometry(t);
  const close = (pts: P[], bottom = Y.plateB) => pd([...pts, [1040, bottom], [-40, bottom]], true);
  const synTop = layerTop(g.trunks.map((tr) => ({ f: tr.f, apex: Y.decB + 3, d: 0 })), Y.plateSyn, FIL.syn);
  const cytoTop = layerTop(g.trunks.map((tr) => ({ f: tr.f, apex: tr.cytoApex, d: tr.ts })), Y.plateCyto, FIL.cyto);
  const mesoTop = layerTop(g.trunks.map((tr) => ({ f: tr.f, apex: tr.mesoApex, d: tr.ts + tr.tc })), Y.plateMeso, FIL.meso);
  const roof = roofContour(g, 0, 12);
  const roofFill = pd([[-40, Y.decB], [1040, Y.decB], ...[...roof].reverse()], true);
  const live = g.branches.filter((b) => b.len > b.exit * 0.85);
  const brSyn = live.map((b) => branchPts(b, 0)).filter((p): p is P[] => !!p);
  const brCyto = live.map((b) => branchPts(b, b.ts)).filter((p): p is P[] => !!p);
  const brMeso = live.map((b) => branchPts(b, b.ts + b.tc)).filter((p): p is P[] => !!p);
  const trunkFingers = g.trunks.map((tr) => fingerShape(tr.f, 0, Y.plateSyn, FIL.syn, Y.decB + 3)).filter((s) => !!s);
  // Stem villi run on into the roof: their outline is the two sides only, up to the roof.
  const trunkSides = trunkFingers.map((sh) => `${pd(sh!.left.filter((p) => p[1] >= Y.roofB + 6))}${pd(sh!.right.filter((p) => p[1] >= Y.roofB + 6))}`);
  const trunkBody = trunkFingers.map((sh) => pd([...sh!.left.filter((p) => p[1] >= Y.roofB), ...[...sh!.right.filter((p) => p[1] >= Y.roofB)].reverse()], true));
  const anchorRim = g.anchor * (1 - 0.55 * seg(t, W.freeA[0], W.freeA[0] + 0.04));
  const freeRim = seg(t, W.freeA[0] + 0.03, W.freeA[1]);
  const shell = shellBatch(g, detail);
  const wallB = walls(g, detail);
  const col = columnBatch(g, detail);
  const { trunkLoops, branchLoops } = vessels(g);
  const art = arteryPts(g.artery);
  const mouth = art[art.length - 1];

  return (
    <g mask={framed ? 'url(#m-slab)' : undefined}>
      <Part id="dezidua-basala">
        <rect x={0} y={0} width={1000} height={Y.decB + 1} fill="url(#p-decidua)" />
        <rect x={0} y={0} width={1000} height={Y.decB + 1} fill="url(#w3b-vshade)" />
      </Part>

      <Part id="biloxka-arteko-espazioa">
        <rect x={0} y={Y.roofB - 1} width={1000} height={Y.plateSyn - Y.roofB + 14} fill="url(#w3b-blood)" />
      </Part>
      <rect x={0} y={Y.roofB} width={1000} height={Y.plateSyn - Y.roofB} fill="url(#w3b-vshade)" pointerEvents="none" />
      {/* Fresh maternal blood spreading from the open spiral artery. */}
      {g.artery > 0.02 && <ellipse cx={ART_X} cy={Y.roofB + 34 * g.artery} rx={86 * g.artery} ry={62 * g.artery} fill="url(#w3b-plume)" pointerEvents="none" />}
      {!reduced &&
        ['M226,140 C236,280 214,380 230,462', 'M500,200 C520,300 484,380 500,462', 'M776,462 C766,340 790,250 772,140'].map((d, i) => (
          <Flow key={i} d={d} n={4} dur={8 + i} r={2.3} color="#e8566d" reduced={reduced} />
        ))}

      {/* Shadows of the villous tree on the blood. */}
      <g transform="translate(6 8)" fill={K.shadow} pointerEvents="none">
        <path d={close(synTop)} />
        {brSyn.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>

      {/* Stem / free villus outlines (light with their steps). */}
      <Part id="biloxka-tertziarioa">
        {trunkSides.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#eef3ff" strokeWidth={3.6} opacity={0.26} />
        ))}
        {brSyn.map((p, i) => (
          <path key={`b${i}`} d={pd(p)} fill="none" stroke="#eef3ff" strokeWidth={3.6} opacity={0.26} />
        ))}
      </Part>
      <Part id="biloxka-enborra" show={Math.max(0.001, anchorRim)}>
        {trunkSides.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#fff6e8" strokeWidth={5.5} opacity={0.85} />
        ))}
      </Part>
      <Part id="biloxka-askea" show={Math.max(0.001, freeRim)}>
        {brSyn.map((p, i) => (
          <path key={i} d={pd(p)} fill="none" stroke="#fff6e8" strokeWidth={5.5} opacity={0.85} />
        ))}
      </Part>

      {/* Syncytium: roof lining + plate + every villus as one layer (outlines and microvilli first, then fills). */}
      <Part id="sinzitiotrofoblastoa">
        <g fill="none">
          <path d={fringe(synTop, 4.4, 3.2)} stroke={K.fringe} strokeWidth={0.9} />
          <path d={fringe([...roof].reverse(), 4.4, 3.2)} stroke={K.fringe} strokeWidth={0.9} />
          {brSyn.map((p, i) => (
            <path key={i} d={fringe(p, 4.4, 3)} stroke={K.fringe} strokeWidth={0.9} />
          ))}
          <path d={pd(synTop)} stroke={K.synEdge} strokeWidth={3} />
          <path d={pd(roof)} stroke={K.synEdge} strokeWidth={3} />
          {brSyn.map((p, i) => (
            <path key={i} d={pd(p)} stroke={K.synEdge} strokeWidth={3} />
          ))}
        </g>
        <path d={roofFill} fill="url(#w3b-syn)" />
        <path d={close(synTop)} fill="url(#w3b-syn)" />
        {brSyn.map((p, i) => (
          <path key={i} d={pd(p, true)} fill="url(#w3b-syn)" />
        ))}
        <path d={runs(offsetPoly(synTop, -2), (p) => p[1] > Y.roofB + 4).map((r) => pd(r)).join('')} fill="none" stroke={K.synRim} strokeWidth={1.2} />
      </Part>

      {/* Opaque bases under the inner layers, so a dimmed layer never shows the green below. */}
      <g fill={BASE} pointerEvents="none">
        <path d={close(cytoTop)} />
        {brCyto.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>
      <Part id="zitotrofoblastoa">
        <path d={close(cytoTop)} fill={K.cytoGround} />
        {brCyto.map((p, i) => (
          <path key={i} d={pd(p, true)} fill={K.cytoGround} />
        ))}
        <CellPaths b={wallB} />
        <CellPaths b={col} />
      </Part>

      {/* The outer cytotrophoblastic shell: the columns' cells spread under the decidua and join. */}
      <Part id="kanpoko-zorro-zitotrofoblastikoa" show={g.penetrate > 0.6 || g.shell > 0 ? 1 : 0}>
        {shell.grounds.map(([a, z], i) => (
          <rect key={i} x={a + 3} y={Y.decB} width={Math.max(0, z - a - 6)} height={Y.shellSplit - Y.decB} rx={9} fill={K.cytoGround} />
        ))}
        <CellPaths b={shell.b} />
      </Part>

      <g fill={BASE} pointerEvents="none">
        <path d={close(mesoTop)} />
        {brMeso.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>
      <Part id="enbrioi-kanpoko-mesodermoa">
        <path d={close(mesoTop)} fill={K.meso} />
        {brMeso.map((p, i) => (
          <path key={i} d={pd(p, true)} fill={K.meso} />
        ))}
        <path d={close(mesoTop)} fill="url(#p-meso-extra)" />
        {brMeso.map((p, i) => (
          <path key={`p${i}`} d={pd(p, true)} fill="url(#p-meso-extra)" />
        ))}
      </Part>

      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={Y.plateB} width={1000} height={640 - Y.plateB} fill="#121a2c" />
        <rect x={0} y={Y.plateB} width={1000} height={640 - Y.plateB} fill="url(#g-shade)" opacity={0.35} />
      </Part>

      <Part id="enbrioi-kanpoko-hodiak">
        <VesselSet segs={[PLATE_VESSEL]} w={9} detail={detail} />
      </Part>
      <Part id="biloxka-kapilarrak">
        <VesselSet segs={[...trunkLoops, ...branchLoops]} w={7.6} detail={detail} />
      </Part>

      {/* Spiral artery: through the decidua, then (beat 5) through the shell, opening into the space. */}
      <Part id="arteria-espiralak">
        <path d={pd(art)} fill="none" stroke="#5b1222" strokeWidth={12} strokeLinecap="round" />
        <path d={pd(art)} fill="none" stroke="#c9314f" strokeWidth={9.5} strokeLinecap="round" />
        <path d={pd(art)} fill="none" stroke="#f0566f" strokeWidth={4.5} strokeLinecap="round" />
        {g.artery > 0.6 && <ellipse cx={mouth[0]} cy={mouth[1] + 1} rx={9 * g.artery} ry={4} fill="#f0566f" />}
      </Part>
      {!reduced && <Flow d={pd(art)} n={4} dur={4.5} r={2.1} color="#ffc2cc" reduced={reduced} />}
      {!reduced && g.artery > 0.7 && (
        <>
          <Flow d={`M${mouth[0]},${mouth[1]} C${mouth[0] - 20},${mouth[1] + 60} ${mouth[0] - 50},${mouth[1] + 120} ${mouth[0] - 46},${mouth[1] + 220}`} n={4} dur={4} r={2.4} color="#ff8a9b" />
          <Flow d={`M${mouth[0]},${mouth[1]} C${mouth[0] + 24},${mouth[1] + 60} ${mouth[0] + 52},${mouth[1] + 120} ${mouth[0] + 48},${mouth[1] + 220}`} n={4} dur={4.4} r={2.4} color="#ff8a9b" />
        </>
      )}

      {/* Roundness and depth (light from the top left). */}
      <g pointerEvents="none">
        {trunkBody.map((d, i) => (
          <path key={i} d={d} fill="url(#w3b-cyl)" />
        ))}
        <rect x={0} y={Y.plateSyn} width={1000} height={Y.plateB - Y.plateSyn} fill="url(#w3b-vshade)" opacity={0.6} />
      </g>

      <Part id="korion-plaka">
        <path d={`M233,${Y.plateSyn + 1} h-7 v${Y.plateB - Y.plateSyn - 2} h7`} fill="none" stroke="#eef3ff" strokeWidth={1.8} opacity={0.85} strokeLinejoin="round" />
      </Part>
    </g>
  );
}

function shows(t: number) {
  const g = geometry(t);
  return {
    g,
    shellShown: g.penetrate > 0.6 || g.shell > 0 ? 1 : 0,
    anchorLabel: seg(t, W.anchor[0], W.anchor[0] + 0.03),
    free: (k: number) => clamp((g.branches[k].g - 0.35) / 0.25),
  };
}

const along = (b: Br, k: number): [number, number] => xform([[0, -b.len * k]], b.bx, b.by, b.ang)[0] as [number, number];

function labels(t: number) {
  const { g, shellShown, anchorLabel, free } = shows(t);
  const [l, r] = g.trunks;
  const art = arteryPts(g.artery);
  const yZ = 267;
  const yE = 208;
  const yT = 305;
  return (
    <>
      <Label id="dezidua-basala" x={190} y={54} ax={300} ay={54} />
      <Label id="arteria-espiralak" x={810} y={54} ax={art[18][0] + 4} ay={art[18][1]} />
      <Label id="biloxka-arteko-espazioa" x={190} y={200} ax={262} ay={232} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={146} ax={272} ay={Y.decB + 10} show={shellShown} text="Zorro zitotrofoblastikoa" />
      <Label id="zitotrofoblastoa" x={190} y={250} ax={fx(l.f, yZ) - fw(l.f, yZ, l.ts + l.tc / 2)} ay={yZ} />
      <Label id="biloxka-enborra" x={190} y={330} ax={fx(l.f, yE) - fw(l.f, yE, 0) - 1} ay={yE} show={anchorLabel} text="Enborrezko biloxka" />
      <Label id="biloxka-askea" x={190} y={400} ax={along(g.branches[0], 0.78)[0]} ay={along(g.branches[0], 0.78)[1]} show={free(0)} />
      <Label id="sinzitiotrofoblastoa" x={190} y={460} ax={fx(l.f, 440) - fw(l.f, 440, l.ts / 2)} ay={440} />
      <Label id="korion-plaka" x={190} y={515} ax={226} ay={515} />
      <Label id="korion-barrunbea" x={190} y={598} ax={262} ay={598} />
      <Label id="biloxka-tertziarioa" x={810} y={250} ax={fx(r.f, yT) + fw(r.f, yT, 0) + 1} ay={yT} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={810} y={330} ax={r.x + 70} ay={Y.plateMeso + 16} text="Kanpoko mesodermoa" />
      <Label id="biloxka-kapilarrak" x={810} y={400} ax={fx(r.f, 400) + fw(r.f, 400, r.ts + r.tc) * 0.46} ay={400} text="Biloxka kapilarrak" />
      <Label key="askea-r" id="biloxka-askea" x={810} y={452} ax={along(g.branches[2], 0.78)[0]} ay={along(g.branches[2], 0.78)[1]} show={free(2)} />
      <Label id="enbrioi-kanpoko-hodiak" x={810} y={540} ax={762} ay={Y.vessel + 2.2 * Math.sin(762 / 37)} text="Enbrioi kanpoko hodiak" />
    </>
  );
}

export function ShellSection(props: SceneProps) {
  return (
    <g>
      <W3bDefs />
      <PlumeDef />
      <ShellDrawing {...props} />
      {labels(props.t)}
    </g>
  );
}

function PlumeDef() {
  return (
    <defs>
      <radialGradient id="w3b-plume" cx="50%" cy="30%" r="60%">
        <stop offset="0" stopColor="#ff6b81" stopOpacity="0.55" />
        <stop offset="0.6" stopColor="#ef4a62" stopOpacity="0.22" />
        <stop offset="1" stopColor="#ef4a62" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Close-up of the left stem villus where it meets the decidua: the column breaking through and spreading. */
export function ShellClose({ t, reduced }: SceneProps) {
  const { g, shellShown } = shows(t);
  const tr = g.trunks[0];
  const cx = tr.x + 18;
  const cy = 150;
  const s = 2.2;
  const tx = 500;
  const ty = 300;
  const at = (x: number, y: number): [number, number] => [tx + (x - cx) * s, ty + (y - cy) * s];
  const yZ = 150;
  const ySyn = 205;
  const yE = 232;
  return (
    <g>
      <W3bDefs />
      <PlumeDef />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={`translate(${tx} ${ty}) scale(${s}) translate(${-cx} ${-cy})`}>
        <ShellDrawing t={t} reduced={reduced} detail framed={false} />
      </g>
      <Label id="dezidua-basala" x={180} y={80} ax={at(318, 52)[0]} ay={at(318, 52)[1]} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={180} y={180} ax={at(300, Y.decB + 10)[0]} ay={at(300, Y.decB + 10)[1]} show={shellShown} text="Zorro zitotrofoblastikoa" />
      <Label id="zitotrofoblastoa" x={180} y={300} ax={at(fx(tr.f, yZ) - fw(tr.f, yZ, tr.ts + tr.tc / 2), yZ)[0]} ay={at(fx(tr.f, yZ) - fw(tr.f, yZ, tr.ts + tr.tc / 2), yZ)[1]} />
      <Label id="sinzitiotrofoblastoa" x={180} y={420} ax={at(fx(tr.f, ySyn) - fw(tr.f, ySyn, tr.ts / 2), ySyn)[0]} ay={at(fx(tr.f, ySyn) - fw(tr.f, ySyn, tr.ts / 2), ySyn)[1]} />
      <Label id="biloxka-enborra" x={180} y={520} ax={at(fx(tr.f, yE) - fw(tr.f, yE, 0) - 1, yE)[0]} ay={at(fx(tr.f, yE) - fw(tr.f, yE, 0) - 1, yE)[1]} text="Enborrezko biloxka" />
      <Label id="biloxka-arteko-espazioa" x={820} y={420} ax={at(440, 215)[0]} ay={at(440, 215)[1]} />
      <Note x={500} y={612} tone="accent" show={seg(t, W.penetrate[0], W.penetrate[0] + 0.05) * (1 - seg(t, W.shell[0] - 0.01, W.shell[0] + 0.02))}>
        Zitotrofoblasto-zelulek sinzitioa zeharkatu eta dezidua basalera iristen dira
      </Note>
      <Note x={500} y={612} tone="accent" show={seg(t, W.shell[0], W.shell[0] + 0.04) * (1 - seg(t, 0.5, 0.53))}>
        Zutabeetako zelulak alboetara zabaldu eta elkartzen dira: kanpoko zorroa
      </Note>
    </g>
  );
}
