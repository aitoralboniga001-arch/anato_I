'use client';

import { Flow, Part, clamp } from '@/components/kit';
import {
  BASE,
  CellPaths,
  K,
  VesselSet,
  cumLen,
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
  pointAt,
  rand3,
  roundCell,
  runs,
  wallCells,
  xform,
  type Finger,
  type P,
} from './art';

/**
 * A finished villous tree (stem villi anchored in the cytotrophoblastic shell, free villi branching off
 * them, their capillary loops joined to the chorionic-plate vessels and, through the connecting stalk,
 * to the umbilical vessels). Pure geometry built once per layout, plus the drawing of its tissues and
 * vessels, so the week-3 and the week-6 scenes share one visual language (the same `art` kit).
 */

export interface TreeLayout {
  /** Bottom of the decidua / endometrium. */
  decB: number;
  /** Bottom of the outer cytotrophoblastic shell. */
  shellB: number;
  /** Bottom of the syncytial roof (top of the intervillous space). */
  roofB: number;
  plateSyn: number;
  plateCyto: number;
  plateMeso: number;
  /** Venous / arterial chorionic-plate vessel lines. */
  ven: number;
  art: number;
  plateB: number;
}

export interface TrunkSpec {
  x: number;
  hw: number;
  ts: number;
  tc: number;
  sway: number;
  lam: number;
  ph: number;
  /** Side of the arterial capillary leg (−1 left, 1 right). */
  outer: -1 | 1;
}

export interface BranchSpec {
  tr: number;
  /** Height of its root above the plate surface. */
  d: number;
  ang: number;
  len: number;
  hw: number;
}

export interface TreeSpec {
  Y: TreeLayout;
  trunks: TrunkSpec[];
  branches: BranchSpec[];
  /** Spiral arteries opening through the shell. */
  arteries: number[];
  /** Connecting stalk: centre line from the plate down (top point first). */
  stalk: P[];
  stalkHw: (u: number) => number;
  /** Free villi cut across, floating in the intervillous space. */
  sections?: { x: number; y: number; r: number; rot: number }[];
}

const FIL = { syn: 10, cyto: 18, meso: 26 };

export function buildTree(spec: TreeSpec) {
  const { Y } = spec;
  const trunks = spec.trunks.map((d) => ({
    ...d,
    f: { x: d.x, base: Y.plateSyn, len: Y.plateSyn - Y.decB + 4, hw: d.hw, sway: d.sway, lam: d.lam, ph: d.ph } as Finger,
    mesoApex: Y.roofB + 36,
  }));
  const branches = spec.branches.map((b, i) => {
    const tr = trunks[b.tr];
    const by = Y.plateSyn - b.d;
    const wm = fw(tr.f, by, tr.ts + tr.tc);
    const side = b.ang > 0 ? 1 : -1;
    const f: Finger = { x: 0, base: 0, len: b.len, hw: b.hw, sway: 2.5, lam: 40, ph: i * 1.3 };
    const ts = Math.max(4, b.hw * 0.34);
    const tc = Math.max(4, b.hw * 0.34);
    return { ...b, i, by, bx: fx(tr.f, by) + side * wm * 0.46, f, ts, tc, arterial: side === tr.outer };
  });
  type Br = (typeof branches)[number];
  const branchShape = (b: Br, d: number) => fingerShape(b.f, d, 0, 0, -b.len + d, 5);
  const branchPts = (b: Br, d: number): P[] => {
    const sh = branchShape(b, d);
    return sh ? xform(fingerOutline(sh), b.bx, b.by, b.ang) : [];
  };

  // Roof contour with fillets where the stem villi join it.
  const r = 12;
  const roof: P[] = [[-40, Y.roofB]];
  for (const tr of trunks) {
    const yy = Y.roofB + r;
    const xl = fx(tr.f, yy) - fw(tr.f, yy, 0);
    const xr = fx(tr.f, yy) + fw(tr.f, yy, 0);
    for (let i = 0; i <= 5; i++) {
      const k = i / 5;
      roof.push([(1 - k) * (1 - k) * (xl - r) + 2 * (1 - k) * k * xl + k * k * xl, (1 - k) * (1 - k) * Y.roofB + 2 * (1 - k) * k * Y.roofB + k * k * yy]);
    }
    for (let i = 0; i <= 5; i++) {
      const k = i / 5;
      roof.push([(1 - k) * (1 - k) * xr + 2 * (1 - k) * k * xr + k * k * (xr + r), (1 - k) * (1 - k) * yy + 2 * (1 - k) * k * Y.roofB + k * k * Y.roofB]);
    }
  }
  roof.push([1040, Y.roofB]);

  const synTop = layerTop(trunks.map((tr) => ({ f: tr.f, apex: Y.decB + 3, d: 0 })), Y.plateSyn, FIL.syn);
  const cytoTop = layerTop(trunks.map((tr) => ({ f: tr.f, apex: Y.decB - 2, d: tr.ts })), Y.plateCyto, FIL.cyto);
  const mesoTop = layerTop(trunks.map((tr) => ({ f: tr.f, apex: tr.mesoApex, d: tr.ts + tr.tc })), Y.plateMeso, FIL.meso);
  const trunkSh = trunks.map((tr) => fingerShape(tr.f, 0, Y.plateSyn, FIL.syn, Y.decB + 3)!);

  // Cells: stem-villus and plate walls, free-villus walls, solid column cells, the outer shell.
  const wall = newBatch();
  const xs: [number, number][] = [];
  for (const tr of trunks) {
    const sh = fingerShape(tr.f, tr.ts, Y.plateCyto, FIL.cyto, Y.decB - 2)!;
    const below = (p: P) => p[1] > Y.roofB - 2;
    wallCells(wall, sh.left, tr.tc, 10.5, { keep: below });
    wallCells(wall, sh.right, tr.tc, 10.5, { flip: true, keep: below });
    xs.push([sh.left[0][0], sh.right[0][0]]);
  }
  xs.sort((p, q) => p[0] - q[0]);
  let from = 150;
  for (const [a, z] of xs) {
    wallCells(wall, [[from, Y.plateCyto], [a, Y.plateCyto]], Y.plateMeso - Y.plateCyto, 10.5);
    from = z;
  }
  wallCells(wall, [[from, Y.plateCyto], [850, Y.plateCyto]], Y.plateMeso - Y.plateCyto, 10.5);
  for (const b of branches) {
    const sh = branchShape(b, b.ts)!;
    const T = (p: P[]) => xform(p, b.bx, b.by, b.ang);
    const tr = trunks[b.tr];
    const keep = (p: P) => Math.abs(p[0] - fx(tr.f, p[1])) > fw(tr.f, p[1], 0) - 2;
    wallCells(wall, T(sh.left), b.tc, 8.5, { keep });
    wallCells(wall, T(sh.right), b.tc, 8.5, { flip: true, keep });
    wallCells(wall, T([sh.left[sh.left.length - 1], ...sh.cap, sh.right[sh.right.length - 1]]), b.tc, 8.5, { fit: true, keep });
  }
  const col = newBatch();
  for (const tr of trunks) {
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
  const shellH = Y.shellB - Y.decB;
  [Y.decB + shellH * 0.26, Y.decB + shellH * 0.74].forEach((y, j) => {
    for (let x = 160 + (j ? 4.6 : 0); x < 842; x += 9.2) {
      if (spec.arteries.some((ax) => Math.abs(x - ax) < 9)) continue;
      roundCell(shell, x + (rand3(x, y) - 0.5) * 1.1, y + (rand3(y, x) - 0.5) * 0.9, Math.min(4.4, shellH * 0.25));
    }
  });

  const arteries = spec.arteries.map((ax, k) => {
    const pts: P[] = [];
    for (let y = -6; y <= Y.roofB + 3; y += 3) pts.push([ax + 11 * Math.sin(y / 8 + k * 1.7) * clamp((Y.decB - y) / 26 + 0.15), y]);
    return pts;
  });

  // Connecting stalk.
  const SL = cumLen(spec.stalk);
  const stalkTotal = SL[SL.length - 1];
  const sLeft: P[] = [];
  const sRight: P[] = [];
  spec.stalk.forEach((p, i) => {
    const { n } = pointAt(spec.stalk, SL, SL[i]);
    const w = spec.stalkHw(SL[i] / stalkTotal);
    sRight.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    sLeft.push([p[0] - n[0] * w, p[1] - n[1] * w]);
  });
  const stalkBody = pd([...sLeft, ...[...sRight].reverse()], true);

  // Vessels, each piece oriented the way the blood runs (umbilical arteries → plate → arterial leg → loop →
  // venous leg → plate → umbilical vein).
  const plateAAt = (x: number) => Y.art + 1.5 * Math.sin(x / 29);
  const plateVAt = (x: number) => Y.ven + 1.4 * Math.sin(x / 33 + 1);
  const umbA = [...offsetPoly(spec.stalk, -5)].reverse();
  const umbV = offsetPoly(spec.stalk, 5);
  const xA = umbA[umbA.length - 1][0];
  const xV = umbV[0][0];
  const lineX = (xa: number, xb: number, at: (x: number) => number): P[] => {
    const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / 8));
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = xa + ((xb - xa) * i) / n;
      return [x, at(x)] as P;
    });
  };
  const plateA = lineX(-30, 1030, plateAAt);
  const loopsRaw = trunks.map((tr) => loopOf(tr.f, tr.ts, tr.tc, Y.plateMeso, tr.mesoApex + 6, Y.plateMeso));
  const legs = trunks.map((tr, i) => {
    const l = loopsRaw[i];
    const outerX = tr.outer < 0 ? l[0][0] : l[l.length - 1][0];
    const innerX = tr.outer < 0 ? l[l.length - 1][0] : l[0][0];
    return {
      art: [[outerX, plateAAt(outerX)], [outerX, Y.plateMeso]] as P[],
      ven: [[innerX, Y.plateMeso], [innerX, plateVAt(innerX)]] as P[],
      plateV: lineX(innerX, xV, plateVAt),
      outerX,
      innerX,
    };
  });
  const loops = loopsRaw.map((l, i) => (trunks[i].outer < 0 ? l : [...l].reverse()));
  const branchLoops = branches.map((b) => xform(loopOf(b.f, b.ts, b.tc, 2, -b.len + b.ts + b.tc + 5, 0), b.bx, b.by, b.ang));
  const linkA: P[] = [umbA[umbA.length - 1], [xA, plateAAt(xA)]];
  const linkV: P[] = [[xV, plateVAt(xV)], umbV[0]];

  return {
    Y,
    trunks,
    branches,
    roof,
    roofFill: pd([[-40, Y.decB], [1040, Y.decB], ...[...roof].reverse()], true),
    synTop,
    cytoTop,
    mesoTop,
    brSyn: branches.map((b) => branchPts(b, 0)),
    brCyto: branches.map((b) => branchPts(b, b.ts)),
    brMeso: branches.map((b) => branchPts(b, b.ts + b.tc)),
    trunkSides: trunkSh.map((sh) => pd(sh.left.filter((p) => p[1] >= Y.roofB + 6)) + pd(sh.right.filter((p) => p[1] >= Y.roofB + 6))),
    trunkBody: trunkSh.map((sh) => pd([...sh.left.filter((p) => p[1] >= Y.roofB), ...[...sh.right.filter((p) => p[1] >= Y.roofB)].reverse()], true)),
    cells: { wall, col, shell },
    arteries,
    stalk: { body: stalkBody, left: sLeft, right: sRight },
    vessels: { umbA, umbV, plateA, legs, loops, branchLoops, linkA, linkV, xA, xV, plateAAt, plateVAt },
    sections: (spec.sections ?? []).map((s, k) => sectionGeom(s.x, s.y, s.r, s.rot, k)),
  };
}
export type Tree = ReturnType<typeof buildTree>;

/** A free villus cut across: syncytial rim, a ring of cytotrophoblast cells, connective core, 2 capillaries. */
function sectionGeom(x: number, y: number, r: number, rot: number, k: number) {
  const ring = (rr: number, n = 40): P[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.05 * Math.sin(a * 3 + k) + 0.03 * Math.sin(a * 5 + k * 2);
      return [x + Math.cos(a + rot) * rr * wob * 1.22, y + Math.sin(a + rot) * rr * wob * 0.82] as P;
    });
  const outer = ring(r);
  const cyto = ring(r - r * 0.24);
  const meso = ring(r - r * 0.46);
  const cells = newBatch();
  // Walk the cyto outline clockwise in screen space so the cells sit inside it.
  wallCells(cells, [...cyto].reverse(), r * 0.22, Math.max(6.5, r * 0.42), { fit: true });
  const caps = [
    { x: x - r * 0.24 * Math.cos(rot), y: y - r * 0.18, a: true },
    { x: x + r * 0.28 * Math.cos(rot), y: y + r * 0.12, a: false },
  ];
  return { outer, cyto, meso, cells, caps, r, x, y };
}

export interface TreeIds {
  decidua: string;
  shell: string;
  meso: string;
  arteries: string;
  villus?: string;
}

/** Everything but the fetal vessels: decidua, shell, maternal blood, the villous tree, plate, cavity, stalk. */
/** Optional scene groups: the maternal tissue (decidua, its arteries) and the fetal tissue (trophoblast,
 *  mesoderm, villi) can be named as wholes, e.g. the two parts of the placenta. */
export interface TreeGroups {
  maternal?: string[];
  fetal?: string[];
}

export function TreeTissue({ tree, ids, reduced, framed = true, groups = {} }: { tree: Tree; ids: TreeIds; reduced?: boolean; framed?: boolean; groups?: TreeGroups }) {
  const { Y } = tree;
  const { maternal: gm, fetal: gf } = groups;
  const closeDown = (pts: P[]) => pd([...pts, [1040, Y.plateB], [-40, Y.plateB]], true);
  return (
    <g mask={framed ? 'url(#m-slab)' : undefined}>
      <Part id={ids.decidua} groups={gm} quiet>
        <rect x={0} y={0} width={1000} height={Y.decB + 1} fill="url(#p-decidua)" />
        <rect x={0} y={0} width={1000} height={Y.decB + 1} fill="url(#w3b-vshade)" />
      </Part>
      <Part id="biloxka-arteko-espazioa">
        <rect x={0} y={Y.roofB - 1} width={1000} height={Y.plateSyn - Y.roofB + 14} fill="url(#w3b-blood)" />
      </Part>
      <rect x={0} y={Y.roofB} width={1000} height={Y.plateSyn - Y.roofB} fill="url(#w3b-vshade)" pointerEvents="none" />
      {tree.arteries.map((a, i) => {
        const m = a[a.length - 1];
        return <ellipse key={i} cx={m[0]} cy={Y.roofB + 30} rx={70} ry={52} fill="url(#w3t-plume)" pointerEvents="none" />;
      })}

      <g transform="translate(5 7)" fill={K.shadow} pointerEvents="none">
        <path d={closeDown(tree.synTop)} />
        {tree.brSyn.map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
        {tree.sections.map((s, i) => (
          <path key={`s${i}`} d={pd(s.outer, true)} />
        ))}
      </g>

      {ids.villus && (
        <Part id={ids.villus} groups={gf}>
          {tree.trunkSides.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#eef3ff" strokeWidth={3.4} opacity={0.24} />
          ))}
          {tree.brSyn.map((p, i) => (
            <path key={`b${i}`} d={pd(p)} fill="none" stroke="#eef3ff" strokeWidth={3.4} opacity={0.24} />
          ))}
        </Part>
      )}

      <Part id="sinzitiotrofoblastoa" groups={gf} quiet>
        <g fill="none">
          <path d={fringe(tree.synTop, 4.4, 3)} stroke={K.fringe} strokeWidth={0.9} />
          <path d={fringe([...tree.roof].reverse(), 4.4, 3)} stroke={K.fringe} strokeWidth={0.9} />
          {tree.brSyn.map((p, i) => (
            <path key={i} d={fringe(p, 4.4, 2.8)} stroke={K.fringe} strokeWidth={0.9} />
          ))}
          {tree.sections.map((s, i) => (
            <path key={`s${i}`} d={fringe([...s.outer].reverse(), 4.4, 2.6)} stroke={K.fringe} strokeWidth={0.9} />
          ))}
          <path d={pd(tree.synTop)} stroke={K.synEdge} strokeWidth={3} />
          <path d={pd(tree.roof)} stroke={K.synEdge} strokeWidth={3} />
          {[...tree.brSyn, ...tree.sections.map((s) => s.outer)].map((p, i) => (
            <path key={i} d={pd(p)} stroke={K.synEdge} strokeWidth={3} />
          ))}
        </g>
        <path d={tree.roofFill} fill="url(#w3b-syn)" />
        <path d={closeDown(tree.synTop)} fill="url(#w3b-syn)" />
        {[...tree.brSyn, ...tree.sections.map((s) => s.outer)].map((p, i) => (
          <path key={i} d={pd(p, true)} fill="url(#w3b-syn)" />
        ))}
        <path d={runs(offsetPoly(tree.synTop, -2), (p) => p[1] > Y.roofB + 4).map((q) => pd(q)).join('')} fill="none" stroke={K.synRim} strokeWidth={1.2} />
      </Part>

      {/* Opaque bases under the inner layers: a dimmed (context) layer then darkens instead of showing the green below. */}
      <g fill={BASE} pointerEvents="none">
        <path d={closeDown(tree.cytoTop)} />
        {[...tree.brCyto, ...tree.sections.map((s) => s.cyto)].map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>
      <Part id="zitotrofoblastoa" groups={gf} quiet>
        <path d={closeDown(tree.cytoTop)} fill={K.cytoGround} />
        {[...tree.brCyto, ...tree.sections.map((s) => s.cyto)].map((p, i) => (
          <path key={i} d={pd(p, true)} fill={K.cytoGround} />
        ))}
        <CellPaths b={tree.cells.wall} />
        <CellPaths b={tree.cells.col} />
        {tree.sections.map((s, i) => (
          <CellPaths key={i} b={s.cells} />
        ))}
      </Part>
      <Part id={ids.shell} groups={gf} quiet>
        <rect x={0} y={Y.decB} width={1000} height={Y.shellB - Y.decB} fill={K.cytoGround} />
        <CellPaths b={tree.cells.shell} />
      </Part>

      <g fill={BASE} pointerEvents="none">
        <path d={closeDown(tree.mesoTop)} />
        {[...tree.brMeso, ...tree.sections.map((s) => s.meso)].map((p, i) => (
          <path key={i} d={pd(p, true)} />
        ))}
      </g>
      <Part id={ids.meso} groups={gf} quiet>
        <path d={closeDown(tree.mesoTop)} fill={K.meso} />
        {[...tree.brMeso, ...tree.sections.map((s) => s.meso)].map((p, i) => (
          <path key={i} d={pd(p, true)} fill={K.meso} />
        ))}
        <path d={closeDown(tree.mesoTop)} fill="url(#p-meso-extra)" />
      </Part>

      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={Y.plateB} width={1000} height={640 - Y.plateB} fill="#121a2c" />
        <rect x={0} y={Y.plateB} width={1000} height={640 - Y.plateB} fill="url(#g-shade)" opacity={0.35} />
      </Part>
      <rect x={0} y={Y.plateSyn} width={1000} height={Y.plateB - Y.plateSyn} fill="url(#w3b-vshade)" opacity={0.6} pointerEvents="none" />

      <Part id="finkapen-pedikulua">
        <path d={tree.stalk.body} fill={K.meso} />
        <path d={tree.stalk.body} fill="url(#p-meso-extra)" opacity={0.7} />
        <path d={tree.stalk.body} fill="url(#w3b-cyl)" />
        <g fill="none" stroke={K.mesoEdge} strokeWidth={1.1}>
          <path d={pd(tree.stalk.left.slice(5))} />
          <path d={pd(tree.stalk.right.slice(5))} />
        </g>
      </Part>

      <Part id={ids.arteries} groups={gm}>
        {tree.arteries.map((a, i) => {
          const m = a[a.length - 1];
          return (
            <g key={i}>
              <path d={pd(a)} fill="none" stroke="#5b1222" strokeWidth={11} strokeLinecap="round" />
              <path d={pd(a)} fill="none" stroke="#c9314f" strokeWidth={8.5} strokeLinecap="round" />
              <path d={pd(a)} fill="none" stroke="#f0566f" strokeWidth={4} strokeLinecap="round" />
              <ellipse cx={m[0]} cy={m[1] + 1} rx={8} ry={3.6} fill="#f0566f" />
            </g>
          );
        })}
      </Part>

      <g pointerEvents="none">
        {tree.trunkBody.map((d, i) => (
          <path key={i} d={d} fill="url(#w3b-cyl)" />
        ))}
        {tree.sections.map((s, i) => (
          <path key={i} d={pd(s.outer, true)} fill="url(#w3b-ball)" />
        ))}
      </g>
      {!reduced && <TreeFlows tree={tree} />}
    </g>
  );
}

/** Maternal blood: spurting from each spiral artery and washing round the villi. */
function TreeFlows({ tree }: { tree: Tree }) {
  const { Y } = tree;
  const h = (Y.plateSyn - Y.roofB) * 0.62;
  return (
    <g pointerEvents="none">
      {tree.arteries.map((a, i) => {
        const m = a[a.length - 1];
        return (
          <g key={i}>
            <Flow d={pd(a)} n={3} dur={4.5} r={2} color="#ffc2cc" />
            <Flow d={`M${m[0]},${m[1]} C${m[0] - 18},${m[1] + h * 0.3} ${m[0] - 40},${m[1] + h * 0.6} ${m[0] - 34},${m[1] + h}`} n={4} dur={4} r={2.2} color="#ff8a9b" />
            <Flow d={`M${m[0]},${m[1]} C${m[0] + 20},${m[1] + h * 0.3} ${m[0] + 42},${m[1] + h * 0.6} ${m[0] + 36},${m[1] + h}`} n={4} dur={4.4} r={2.2} color="#ff8a9b" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * The fetal vessels of a finished tree (umbilical → plate → capillary loops and back), lumen colours by
 * direction. Pieces are drawn stalk → villi → plate so every junction meets without a wall across it.
 */
export function TreeVessels({ tree, cA, cV, plateId, detail = false, groups }: { tree: Tree; cA: string; cV: string; plateId: string; detail?: boolean; groups?: string[] }) {
  const v = tree.vessels;
  const umb = [
    { p: v.umbA, c: cA },
    { p: v.umbV, c: cV },
    { p: v.linkA, c: cA },
    { p: v.linkV, c: cV },
  ];
  const caps: { p: P[]; c: string }[] = [];
  v.loops.forEach((loop, i) => {
    const L = cumLen(loop);
    const total = L[L.length - 1];
    const mid = loop.findIndex((_, k) => L[k] >= total / 2);
    caps.push({ p: loop.slice(0, mid + 1), c: cA }, { p: loop.slice(mid), c: cV });
    caps.push({ p: v.legs[i].art, c: cA }, { p: v.legs[i].ven, c: cV });
  });
  tree.branches.forEach((b) => caps.push({ p: v.branchLoops[b.i], c: b.arterial ? cA : cV }));
  const plate = [{ p: v.plateA, c: cA }, ...v.legs.map((lg) => ({ p: lg.plateV, c: cV }))];
  const stubs: { a: P; b: P; w: number; c: string; id: string }[] = [
    { a: [v.xA, v.plateAAt(v.xA) + 6], b: [v.xA, v.plateAAt(v.xA) + 1.6], w: 6.2, c: cA, id: 'zilbor-hodiak' },
    { a: [v.xV, v.plateVAt(v.xV) + 6], b: [v.xV, v.plateVAt(v.xV) + 1.6], w: 6.2, c: cV, id: 'zilbor-hodiak' },
    ...v.legs.flatMap((lg) => [
      { a: [lg.outerX, v.plateAAt(lg.outerX) - 6] as P, b: [lg.outerX, v.plateAAt(lg.outerX) - 1.6] as P, w: 6.4, c: cA, id: 'biloxka-kapilarrak' },
      { a: [lg.innerX, v.plateVAt(lg.innerX) - 6] as P, b: [lg.innerX, v.plateVAt(lg.innerX) - 1.6] as P, w: 6.4, c: cV, id: 'biloxka-kapilarrak' },
    ]),
  ];
  return (
    <g>
      <Part id="zilbor-hodiak">
        <VesselSet segs={umb.map((q) => q.p)} lumens={umb.map((q) => q.c)} w={6.2} detail={detail} />
      </Part>
      <Part id="biloxka-kapilarrak" groups={groups}>
        <VesselSet segs={caps.map((q) => q.p)} lumens={caps.map((q) => q.c)} w={6.4} detail={detail} />
        {tree.sections.map((s, i) => (
          <g key={i}>
            {s.caps.map((c, k) => (
              <g key={k}>
                <circle cx={c.x} cy={c.y} r={s.r * 0.17 + 1} fill="#5e1d2f" />
                <circle cx={c.x} cy={c.y} r={s.r * 0.17} fill={K.endo} />
                <circle cx={c.x} cy={c.y} r={s.r * 0.11} fill={c.a ? cA : cV} />
              </g>
            ))}
          </g>
        ))}
      </Part>
      <Part id={plateId} groups={groups}>
        <VesselSet segs={plate.map((q) => q.p)} lumens={plate.map((q) => q.c)} w={7} detail={detail} />
      </Part>
      {stubs.map((q, i) => (
        <Part key={i} id={q.id} groups={q.id === 'biloxka-kapilarrak' ? groups : undefined}>
          <g fill="none" strokeLinecap="butt">
            <path d={pd([q.a, q.b])} stroke={K.endo} strokeWidth={q.w} />
            <path d={pd([q.a, [q.b[0], q.b[1] + Math.sign(q.b[1] - q.a[1]) * 1.4]])} stroke={q.c} strokeWidth={q.w * 0.6} />
          </g>
        </Part>
      ))}
    </g>
  );
}

export function TreeDefs() {
  return (
    <defs>
      <radialGradient id="w3t-plume" cx="50%" cy="30%" r="60%">
        <stop offset="0" stopColor="#ff6b81" stopOpacity="0.45" />
        <stop offset="0.6" stopColor="#ef4a62" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ef4a62" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

