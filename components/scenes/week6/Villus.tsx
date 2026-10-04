'use client';

import { Arrow, C, Flow, Label, Mark, Note, Part, clamp, easeInOut, lerp, rand, seg, zoom, type SceneProps } from '@/components/kit';
import { CellPaths, K, W3bDefs, cumLen, ellipseSub, fringe, fw, fx, newBatch, pd, pointAt, subPoly, wallCells, type P } from '@/components/scenes/week3-villi/art';
import { TreeDefs, TreeTissue, TreeVessels, buildTree, type Tree } from '@/components/scenes/week3-villi/tree';

/**
 * Topic 6 — the placenta of months 2–3 and its barrier (stage `karena-muga`), and the barrier thinning
 * from month 4 (view `karena-muga` of stage `biloxka-askeak`). Drawn with the week-3 villi kit, so the
 * villi are the same tissue the student watched grow: syncytium with microvilli, a row of
 * cytotrophoblast cells, connective (extra-embryonic mesoderm) core, capillary loops whose lumens are
 * coloured by direction (to the placenta / back to the fetus).
 * Stage beats (karena-muga): 0 tree · .16 maternal blood · .32 fetal blood path · .5 the two parts of
 * the placenta · .66 the layers of a villus · .82 the barrier, cut across.
 */

const BLUE = '#3554b8';
const RED = '#d3283f';
/** Neutral dark base drawn under layered tissue (see CrossSection). */
const BASE = '#1b2233';

/* ================================================================== */
/* Longitudinal: endometrium → villous tree → chorionic plate → stalk  */
/* ================================================================== */

const bez = (p0: P, p1: P, p2: P, p3: P, n: number): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const a = (1 - u) ** 3;
    const b = 3 * (1 - u) ** 2 * u;
    const c = 3 * (1 - u) * u * u;
    const d = u ** 3;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as P;
  });

const Y = { decB: 50, shellB: 68, roofB: 78, plateSyn: 420, plateCyto: 429, plateMeso: 440, ven: 456, art: 470, plateB: 492 };

const TREE: Tree = buildTree({
  Y,
  trunks: [
    { x: 318, hw: 28, ts: 7, tc: 8, sway: 4, lam: 66, ph: 1.0, outer: -1 },
    { x: 500, hw: 29, ts: 7, tc: 8, sway: 4, lam: 60, ph: 3.6, outer: -1 },
    { x: 682, hw: 28, ts: 7, tc: 8, sway: 4, lam: 70, ph: 5.2, outer: 1 },
  ],
  branches: [
    { tr: 0, d: 250, ang: -46, len: 70, hw: 13 },
    { tr: 0, d: 170, ang: 44, len: 84, hw: 14 },
    { tr: 0, d: 90, ang: -50, len: 64, hw: 12 },
    { tr: 1, d: 210, ang: -44, len: 80, hw: 14 },
    { tr: 1, d: 130, ang: 46, len: 86, hw: 14 },
    { tr: 1, d: 290, ang: 56, len: 56, hw: 12 },
    { tr: 2, d: 240, ang: -46, len: 78, hw: 14 },
    { tr: 2, d: 150, ang: 48, len: 72, hw: 13 },
    { tr: 2, d: 80, ang: -48, len: 66, hw: 12 },
  ],
  arteries: [409, 591],
  stalk: bez([430, Y.plateB - 12], [434, 540], [418, 592], [424, 660], 28),
  stalkHw: (u) => 20 + 14 * Math.max(0, 1 - u / 0.2) ** 2,
  sections: [
    { x: 404, y: 384, r: 14, rot: 0.3 },
    { x: 590, y: 372, r: 14, rot: -0.4 },
    { x: 258, y: 228, r: 12, rot: 0.9 },
    { x: 744, y: 326, r: 13, rot: 0.2 },
    { x: 430, y: 118, r: 12, rot: -0.2 },
  ],
});

/** Fetal blood path for beat 3: from the stalk up the umbilical arteries, along the plate, into every loop. */
const PATH = (() => {
  const v = TREE.vessels;
  const out: { pts: P[]; d0: number }[] = [];
  const len = (p: P[]) => {
    const L = cumLen(p);
    return L[L.length - 1];
  };
  const LU = len(v.umbA);
  out.push({ pts: v.umbA, d0: 0 }, { pts: v.linkA, d0: LU });
  const d0 = LU + len(v.linkA);
  const iA = v.plateA.findIndex((p) => p[0] >= v.xA);
  out.push({ pts: [...v.plateA.slice(0, iA)].reverse(), d0 }, { pts: v.plateA.slice(iA - 1), d0 });
  let end = 0;
  v.legs.forEach((lg, i) => {
    const dl = d0 + Math.abs(v.xA - lg.outerX);
    out.push({ pts: lg.art, d0: dl });
    const dLoop = dl + len(lg.art);
    out.push({ pts: v.loops[i], d0: dLoop });
    for (const b of TREE.branches.filter((q) => q.tr === i)) out.push({ pts: v.branchLoops[b.i], d0: dLoop + Y.plateMeso - b.by });
    end = Math.max(end, dLoop + len(v.loops[i]));
  });
  return { list: out, total: end };
})();

/** Heart-driven flow (one route per stem villus): out along the arterial pieces, back along the venous ones. */
const ROUTES = TREE.vessels.legs.map((lg, i) => {
  const v = TREE.vessels;
  const iA = v.plateA.findIndex((p) => p[0] >= v.xA);
  const toLeg = lg.outerX < v.xA ? [...v.plateA.slice(0, iA)].reverse().filter((p) => p[0] >= lg.outerX) : v.plateA.slice(iA).filter((p) => p[0] <= lg.outerX);
  const loop = v.loops[i];
  const L = cumLen(loop);
  return {
    out: pd([...v.umbA, v.linkA[1], ...toLeg, ...lg.art, ...subPoly(loop, L, 0, 0.5)]),
    back: pd([...subPoly(loop, L, 0.5, 1), ...lg.ven, ...lg.plateV, v.linkV[1], ...v.umbV]),
  };
});

/** Fetal tissue (trophoblast + extra-embryonic mesoderm) for the "fetal part" wash. */
const FETAL_D = [
  TREE.roofFill,
  pd([...TREE.synTop, [1040, Y.plateB], [-40, Y.plateB]], true),
  ...TREE.brSyn.map((p) => pd(p, true)),
  ...TREE.sections.map((s) => pd(s.outer, true)),
].join('');

/** Flat endothelial nuclei along the capillary walls (they line every fetal vessel of the villi). */
const ENDO_NUC = (() => {
  const v = TREE.vessels;
  let d = '';
  const all = [...v.loops, ...v.branchLoops.filter(Boolean), ...v.legs.flatMap((lg) => [lg.art, lg.ven])];
  for (const pts of all) {
    const L = cumLen(pts);
    const total = L[L.length - 1];
    for (let s = 6; s < total - 4; s += 15) {
      const { p, n, a } = pointAt(pts, L, s);
      const side = Math.round(s / 15) % 2 ? 1 : -1;
      d += ellipseSub(p[0] + n[0] * side * 2.7, p[1] + n[1] * side * 2.7, 2.7, 1, (a * 180) / Math.PI);
    }
  }
  return d;
})();

/** Outline of the fetal tissue facing the maternal blood (trophoblast surface), for the "fetal part". */
const FETAL_EDGE = [pd(TREE.synTop), pd(TREE.roof), ...TREE.brSyn.map((p) => pd(p)), ...TREE.sections.map((s) => pd(s.outer, true))].join('');

function LongDrawing({ t, reduced }: SceneProps) {
  const path = seg(t, 0.335, 0.45);
  const parts = seg(t, 0.5, 0.56) * (1 - seg(t, 0.64, 0.68));
  const D = path * (PATH.total + 80);
  const pulse =
    path > 0 && path < 1
      ? PATH.list
          .map(({ pts, d0 }) => {
            const L = cumLen(pts);
            const tot = L[L.length - 1];
            const a = (D - d0 - 90) / tot;
            const b = (D - d0) / tot;
            return b > 0 && a < 1 ? pd(subPoly(pts, L, Math.max(0, a), Math.min(1, b))) : '';
          })
          .join('')
      : '';
  return (
    <g>
      <TreeTissue tree={TREE} ids={{ decidua: 'endometrioa', shell: 'kanpoko-zorro-zitotrofoblastikoa', meso: 'ehun-konektiboa', arteries: 'amaren-odol-hodiak', villus: 'biloxka-tertziarioa' }} reduced={reduced} />
      <g mask="url(#m-slab)">
        <TreeVessels tree={TREE} cA={BLUE} cV={RED} plateId="korioneko-odol-hodiak" />
        {pulse && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
            <path d={pulse} stroke="#fff2c2" strokeWidth={10} opacity={0.22} />
            <path d={pulse} stroke="#fff6dc" strokeWidth={3} opacity={0.95} />
          </g>
        )}
        {!reduced &&
          ROUTES.flatMap((r, i) => [
            <Flow key={`o${i}`} d={r.out} n={8} dur={7} r={2} color="#9db8ff" />,
            <Flow key={`b${i}`} d={r.back} n={8} dur={7} r={2} color="#ff9aa8" />,
          ])}
        <Part id="endotelioa">
          <path d={ENDO_NUC} fill={K.endoNuc} />
        </Part>
        {/* The two parts of the placenta (beat 4): maternal = endometrium, fetal = trophoblast + mesoderm. */}
        {parts > 0.01 && (
          <g pointerEvents="none" opacity={parts}>
            <Part id="karenaren-ama-atala">
              <rect x={0} y={0} width={1000} height={Y.decB} fill="#ffb3c1" opacity={0.26} />
              <path d={`M0,${Y.decB - 1}H1000`} stroke="#ffd1da" strokeWidth={2.4} opacity={0.9} />
            </Part>
            <Part id="karenaren-fetu-atala">
              <path d={FETAL_D} fill="#c9f7da" opacity={0.14} />
              <path d={FETAL_EDGE} fill="none" stroke="#d9ffe6" strokeWidth={2} opacity={0.75} />
            </Part>
          </g>
        )}
        {/* Chorionic plate: its two faces picked out lightly (fetal vessels run inside it). */}
        <Part id="korion-plaka">
          <path d={`M0,${Y.plateSyn - 1}H1000M0,${Y.plateB - 1}H1000`} fill="none" stroke="#f3f7ff" strokeWidth={1.4} opacity={0.32} />
        </Part>
      </g>
    </g>
  );
}

const atY = (pts: P[], y: number): [number, number] => {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];
  }
  return [pts[0][0], pts[0][1]];
};

export function VilliLongSection(props: SceneProps) {
  const { t } = props;
  const [t0, , t2] = TREE.trunks;
  const wall = (tr: (typeof TREE.trunks)[number], y: number, d: number, side: number): [number, number] => [fx(tr.f, y) + side * fw(tr.f, y, d), y];
  const syn = wall(t0, 252, t0.ts / 2, -1);
  const cyto = wall(t0, 282, t0.ts + t0.tc / 2, -1);
  const core: [number, number] = [fx(t0.f, 312), 312];
  const ter = wall(t2, 318, 0, 1);
  const capX = fx(t2.f, 352) + fw(t2.f, 352, t2.ts + t2.tc) * 0.46;
  const parts = seg(t, 0.5, 0.53) * (1 - seg(t, 0.64, 0.67));
  const art = TREE.arteries[0];
  const umb = atY(TREE.vessels.umbV, 548);
  const stalk = atY(TREE.stalk.left, 548);
  return (
    <g>
      <W3bDefs />
      <TreeDefs />
      <LongDrawing {...props} />
      <Label id="endometrioa" x={190} y={32} ax={300} ay={24} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={58} ax={262} ay={Y.decB + 7} text="Zorro zitotrofoblastikoa" small />
      <Label id="amaren-odol-hodiak" x={190} y={86} ax={art[art.length - 1][0] - 5} ay={Y.roofB - 6} />
      <Label id="biloxka-arteko-espazioa" x={190} y={150} ax={236} ay={170} />
      <Label id="sinzitiotrofoblastoa" x={190} y={246} ax={syn[0]} ay={syn[1]} />
      <Label id="zitotrofoblastoa" x={190} y={282} ax={cyto[0]} ay={cyto[1]} />
      <Label id="ehun-konektiboa" x={190} y={318} ax={core[0]} ay={core[1]} />
      <Label id="korion-plaka" x={190} y={456} ax={262} ay={Y.plateMeso + 6} />
      <Label id="finkapen-pedikulua" x={190} y={548} ax={stalk[0]} ay={stalk[1]} />
      <Label id="korion-barrunbea" x={190} y={598} ax={300} ay={590} />
      <Label id="karenaren-ama-atala" x={810} y={240} ax={772} ay={30} show={parts} small />
      <Label id="biloxka-tertziarioa" x={810} y={270} ax={ter[0]} ay={ter[1]} />
      <Label id="biloxka-kapilarrak" x={810} y={300} ax={capX} ay={352} text="Biloxka kapilarrak" />
      <Label id="endotelioa" x={810} y={330} ax={capX + 3.4} ay={384} />
      <Label id="karenaren-fetu-atala" x={810} y={370} ax={786} ay={446} show={parts} small />
      <Label id="karena" x={810} y={400} ax={788} ay={478} show={parts} />
      <Label id="korioneko-odol-hodiak" x={810} y={470} ax={740} ay={TREE.vessels.plateAAt(740)} />
      <Label id="zilbor-hodiak" x={810} y={548} ax={umb[0]} ay={umb[1]} />
      <Note x={500} y={614} tone="accent" show={parts}>
        Karena: fetu-osagaia (trofoblastoa) + ama-osagaia (endometrioa)
      </Note>
      <Note x={500} y={614} show={seg(t, 0.335, 0.36) * (1 - seg(t, 0.49, 0.5))}>
        Zilbor-hodiak → korion plakako odol-hodiak → biloxka tertziarioetako odol-hodiak
      </Note>
    </g>
  );
}

/* ================================================================== */
/* Cross-section of a free villus: the barrier, four layers → two      */
/* ================================================================== */

const CX = 500;
const CY = 316;
const R = 186;

/** Wobbly closed ring (deterministic). */
const ring = (r: number, k = 0, n = 96): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + 0.035 * Math.sin(a * 3 + 0.7) + 0.02 * Math.sin(a * 7 + 1.9 + k);
    return [CX + Math.cos(a) * r * w * 1.12, CY + Math.sin(a) * r * w * 0.9] as P;
  });
/** Point at angle a (rad) and radius r on the same wobbly shape. */
const at = (a: number, r: number): P => {
  const w = 1 + 0.035 * Math.sin(a * 3 + 0.7) + 0.02 * Math.sin(a * 7 + 1.9);
  return [CX + Math.cos(a) * r * w * 1.12, CY + Math.sin(a) * r * w * 0.9];
};

/** Capillaries: two in the core at month 3, five dilated against the syncytium from month 4. */
const CAPS = [
  { a: -2.2, r0: 0.36, rad0: 24, rad1: 30, art: true, late: false },
  { a: 0.9, r0: 0.3, rad0: 22, rad1: 28, art: false, late: false },
  { a: -0.6, r0: 0.62, rad0: 0, rad1: 24, art: true, late: true },
  { a: 2.5, r0: 0.6, rad0: 0, rad1: 26, art: false, late: true },
  { a: -1.35, r0: 0.6, rad0: 0, rad1: 20, art: false, late: true },
];

const SECTION = (() => {
  const synNuc: { a: number; f: number; k: number }[] = Array.from({ length: 34 }, (_, k) => ({ a: (k / 34) * Math.PI * 2 + rand(k * 2.1) * 0.12, f: rand(k * 5.7), k }));
  const spindles = Array.from({ length: 22 }, (_, k) => {
    const a = rand(k * 3.3) * Math.PI * 2;
    const rr = Math.sqrt(rand(k * 7.9)) * 0.62;
    return { a, rr, deg: rand(k * 1.7) * 180, k };
  });
  const fibres = Array.from({ length: 10 }, (_, k) => {
    const a0 = rand(k * 4.1) * Math.PI * 2;
    const pts: P[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const rr = R * 0.1 + u * R * 0.55;
      pts.push(at(a0 + u * 0.9 + 0.12 * Math.sin(u * 7 + k), rr));
    }
    return pts;
  });
  return { synNuc, spindles, fibres };
})();

/** Maternal red cells round the villus (anucleate, biconcave). */
const MATERNAL = Array.from({ length: 70 }, (_, k) => {
  const a = rand(k * 1.3) * Math.PI * 2;
  const d = R * 1.16 + rand(k * 4.7) * 190;
  return { x: CX + Math.cos(a) * d * 1.12, y: CY + Math.sin(a) * d * 0.9, rot: rand(k * 9.1) * 180 };
});

function CrossSection({ thin, o2, co2, reduced }: { thin: number; o2: number; co2: number; reduced?: boolean }) {
  const synTh = lerp(20, 9, thin);
  const cytoTh = lerp(24, 0, thin);
  const outer = ring(R);
  const synIn = ring(R - synTh);
  const cytoIn = ring(R - synTh - Math.max(0.5, cytoTh));
  // Cytotrophoblast cells: a complete row at month 3, fewer and smaller until none (month 4).
  const cyto = newBatch();
  if (cytoTh > 1) {
    const all = newBatch();
    wallCells(all, synIn, cytoTh, 26, { fit: true, detail: true, scale: 1.6 });
    all.body.forEach((b, k) => {
      if (rand(k * 3.9 + 1) > thin * 1.3) {
        cyto.body.push(b);
        cyto.nuc.push(all.nuc[k]);
        if (all.nucleoli[k]) cyto.nucleoli.push(all.nucleoli[k]);
      }
    });
  }
  // Syncytial nuclei; from month 4 they gather into knots, leaving thin stretches over the capillaries.
  let nuc = '';
  for (const n of SECTION.synNuc) {
    const knot = Math.floor(n.k / 7) * ((Math.PI * 2) / 5) + 0.4;
    const a = lerp(n.a, knot + (n.f - 0.5) * 0.18, thin * 0.85);
    const rr = R - synTh * lerp(0.5, 0.4 + n.f * 0.25, thin) + (thin * 6 * (n.k % 2));
    const p = at(a, rr);
    nuc += ellipseSub(p[0], p[1], 6, lerp(4.2, 4.8, thin), (a * 180) / Math.PI + 90);
  }
  const spindleB = newBatch();
  for (const s of SECTION.spindles) {
    if (rand(s.k * 6.3 + 2) < thin * 0.75) continue;
    const p = at(s.a, s.rr * (R - synTh - cytoTh));
    spindleB.body.push(ellipseSub(p[0], p[1], 15, 4.2, s.deg));
    spindleB.nuc.push(ellipseSub(p[0], p[1], 6, 2.4, s.deg));
  }
  const caps = CAPS.map((c) => {
    const rad = c.late ? c.rad1 * thin : lerp(c.rad0, c.rad1, thin);
    const target = R - synTh - rad - 3;
    const rr = c.late ? target : lerp(R * c.r0, target, thin);
    const p = at(c.a, rr);
    return { ...c, rad, p };
  }).filter((c) => c.rad > 1);
  const capA = caps[0];
  // Barrier band over capillary A: from the syncytial surface to its lumen.
  const ua: P = [Math.cos(capA.a), Math.sin(capA.a)];
  const surf = at(capA.a, R + 2);
  const lumenEdge: P = [capA.p[0] + ua[0] * capA.rad * 0.62, capA.p[1] + ua[1] * capA.rad * 0.62];
  const mol = (k: number, i: number, dir: 1 | -1) => {
    const p = clamp((k - i * 0.16) / 0.5);
    const e = easeInOut(p);
    const from: P = [surf[0] + ua[0] * 70, surf[1] + ua[1] * 70];
    const to: P = [capA.p[0] - ua[0] * capA.rad * 0.2, capA.p[1] - ua[1] * capA.rad * 0.2];
    const [a, b] = dir > 0 ? [from, to] : [to, from];
    const side = (i - 1) * 12;
    return { x: lerp(a[0], b[0], e) - ua[1] * side, y: lerp(a[1], b[1], e) + ua[0] * side, show: clamp(k * 5 - i * 0.6) };
  };
  return (
    <g>
      {/* Maternal blood of the intervillous space, fading into the background. */}
      <Part id="biloxka-arteko-espazioa">
        <rect x={0} y={0} width={1000} height={640} fill={K.blood} />
        <g stroke="#6e0f22" strokeWidth={0.7}>
          {MATERNAL.map((m, i) => (
            <g key={i} transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${m.rot.toFixed(0)})`}>
              <ellipse rx={9} ry={6} fill="#c8304a" />
              <ellipse rx={3.6} ry={2.2} fill="#e0687c" stroke="none" />
            </g>
          ))}
        </g>
        <rect x={0} y={0} width={1000} height={640} fill="url(#w6c-field)" />
      </Part>
      {!reduced && <Flow d={`M${CX - 330},${CY + 230} C${CX - 300},${CY - 40} ${CX - 120},${CY - 250} ${CX + 160},${CY - 250}`} n={5} dur={10} r={3} color="#ff8a9b" />}

      <Part id="sinzitiotrofoblastoa">
        <path d={fringe([...outer].reverse(), 5, 7)} fill="none" stroke={K.fringe} strokeWidth={1.3} />
        <path d={pd(outer, true)} fill={C.syncytio} stroke={K.synEdge} strokeWidth={2.4} />
        <path d={nuc} fill="#0c4630" stroke="#06301f" strokeWidth={0.7} />
      </Part>
      {/* Opaque base under each inner layer, so a dimmed layer never shows the green of the one below. */}
      <path d={pd(synIn, true)} fill={BASE} pointerEvents="none" />
      <Part id="zitotrofoblastoa" show={1 - thin * 0.999}>
        <path d={pd(synIn, true)} fill={K.cytoGround} opacity={1 - thin} />
        <CellPaths b={cyto} sw={1.1} />
      </Part>
      <path d={pd(cytoIn, true)} fill={BASE} pointerEvents="none" />
      <Part id="ehun-konektiboa">
        <path d={pd(cytoIn, true)} fill={K.meso} />
        <path d={SECTION.fibres.map((f) => pd(f)).join('')} fill="none" stroke="#e58c6c" strokeWidth={0.9} opacity={0.7} />
        <CellPaths b={spindleB} fill="#f8bba1" edge="#c9694d" nuc="#a8503a" sw={0.8} />
        <path d={pd(cytoIn, true)} fill="none" stroke="#ffe0c2" strokeWidth={1.4} opacity={0.55} />
      </Part>
      <Part id="endotelioa">
        {caps.map((c, i) => (
          <g key={i}>
            <circle cx={c.p[0]} cy={c.p[1]} r={c.rad + 1.2} fill="#7c2c43" />
            <circle cx={c.p[0]} cy={c.p[1]} r={c.rad} fill={K.endo} />
            {[0.4, 2.2, 4.1].map((a, k) => (
              <ellipse key={k} cx={c.p[0] + Math.cos(a + i) * (c.rad - 3)} cy={c.p[1] + Math.sin(a + i) * (c.rad - 3)} rx={5} ry={2} transform={`rotate(${((a + i) * 180) / Math.PI + 90} ${c.p[0] + Math.cos(a + i) * (c.rad - 3)} ${c.p[1] + Math.sin(a + i) * (c.rad - 3)})`} fill={K.endoNuc} />
            ))}
          </g>
        ))}
      </Part>
      <Part id="biloxka-kapilarrak">
        {caps.map((c, i) => (
          <g key={i}>
            <circle cx={c.p[0]} cy={c.p[1]} r={c.rad * 0.72} fill={c.art ? BLUE : RED} />
            {[0, 1, 2].map((k) => (
              <ellipse key={k} cx={c.p[0] + (k - 1) * c.rad * 0.36} cy={c.p[1] + ((k % 2) - 0.4) * c.rad * 0.3} rx={c.rad * 0.2} ry={c.rad * 0.14} fill={K.rbc} stroke={K.rbcEdge} strokeWidth={0.5} />
            ))}
          </g>
        ))}
      </Part>
      <path d={pd(outer, true)} fill="url(#w6c-ball)" pointerEvents="none" />

      {/* The barrier over one capillary: outlined on both its faces. */}
      <Part id="karena-muga">
        <path d={pd([surf, lumenEdge])} stroke="#fde68a" strokeWidth={Math.max(14, capA.rad * 0.9)} strokeLinecap="round" opacity={0.16} />
        <path d={pd(subArc(capA.a, R + 1.5, 0.22))} fill="none" stroke="#fde68a" strokeWidth={2.4} opacity={0.9} />
        <path d={`M${capA.p[0]},${capA.p[1]}m${-capA.rad * 0.72},0a${capA.rad * 0.72},${capA.rad * 0.72} 0 1,0 ${capA.rad * 1.44},0a${capA.rad * 0.72},${capA.rad * 0.72} 0 1,0 ${-capA.rad * 1.44},0`} fill="none" stroke="#fde68a" strokeWidth={1.8} opacity={0.8} />
      </Part>
      {o2 > 0 &&
        [0, 1, 2].map((i) => {
          const m = mol(o2, i, 1);
          return (
            <g key={`o${i}`} opacity={m.show} stroke="#6b4a06" strokeWidth={1}>
              <circle cx={m.x - 3.4} cy={m.y} r={4} fill="#fbbf24" />
              <circle cx={m.x + 3.4} cy={m.y} r={4} fill="#fbbf24" />
            </g>
          );
        })}
      {co2 > 0 &&
        [0, 1, 2].map((i) => {
          const m = mol(co2, i, -1);
          return (
            <g key={`c${i}`} opacity={m.show} stroke="#123a66" strokeWidth={1}>
              <circle cx={m.x - 6} cy={m.y + 14} r={3.4} fill="#93c5fd" />
              <circle cx={m.x} cy={m.y + 14} r={4} fill="#3b82f6" />
              <circle cx={m.x + 6} cy={m.y + 14} r={3.4} fill="#93c5fd" />
            </g>
          );
        })}
    </g>
  );
}

/** Arc of the outer surface around angle a (± half), as points. */
function subArc(a: number, r: number, half: number): P[] {
  return Array.from({ length: 13 }, (_, i) => at(a - half + (2 * half * i) / 12, r));
}

function CrossDefs() {
  return (
    <defs>
      <radialGradient id="w6c-field" cx="50%" cy="50%" r="50%">
        <stop offset="0.5" stopColor="#101828" stopOpacity="0" />
        <stop offset="0.85" stopColor="#101828" stopOpacity="0.6" />
        <stop offset="1" stopColor="#101828" stopOpacity="0.92" />
      </radialGradient>
      <radialGradient id="w6c-ball" cx="40%" cy="34%" r="66%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.9" stopColor="#000000" stopOpacity="0.18" />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Where to point at each layer in the whole section (left side, at height y). */
function layerAnchors(thin: number) {
  const synTh = lerp(20, 9, thin);
  const cytoTh = lerp(24, 0, thin);
  const a = Math.PI + 0.42;
  const syn = at(a, R - synTh / 2);
  const cyto = at(Math.PI + 0.12, R - synTh - cytoTh / 2);
  const core = at(Math.PI - 0.2, (R - synTh - cytoTh) * 0.55);
  return { syn, cyto, core };
}

/* ---- The barrier over capillary A, pushed in on and named layer by layer -------------------- */

/** Half-angle of the wedge of wall over the capillary that is lit as "the barrier". */
const H = 0.18;
const ZS = 2.3;
/** Close-up: a point of maternal blood above the wall, top left (screen), for the intervillous space's name. */
const IVS_NEAR: P = [270, 70];

/** Barrier geometry over capillary A (same formulas as CrossSection). */
function barrierGeo(thin: number) {
  const synTh = lerp(20, 9, thin);
  const cytoTh = lerp(24, 0, thin);
  const c = CAPS[0];
  const rad = lerp(c.rad0, c.rad1, thin);
  const rr = lerp(R * c.r0, R - synTh - rad - 3, thin);
  const p = at(c.a, rr);
  const surf = at(c.a, R);
  return { a: c.a, synTh, cytoTh, rad, rr, p, surf, inner: R - synTh - cytoTh, capOut: rr + rad + 3 };
}
type Geo = ReturnType<typeof barrierGeo>;

/** Camera: from the whole section to the wall over capillary A. */
function barrierCam(g: Geo, push: number) {
  const f: P = [(g.surf[0] + g.p[0]) / 2, (g.surf[1] + g.p[1]) / 2];
  return zoom(lerp(CX, f[0], push), lerp(320, f[1], push), lerp(1, ZS, push), lerp(CX, 470, push), lerp(320, 312, push));
}

const band = (a: number, r1: number, r2: number, h: number) => pd([...subArc(a, r2, h), ...subArc(a, r1, h).reverse()], true);
const circ = (p: P, r: number) => `M${p[0] - r},${p[1]}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;

/** Layer k (1 endothelium, 2 connective tissue, 3 cytotrophoblast, 4 syncytium) as a lit shape, or null when gone. */
function layerShape(g: Geo, k: number): string | null {
  if (k === 1) return circ(g.p, g.rad + 1.2) + circ(g.p, g.rad * 0.72);
  const [r1, r2] = k === 2 ? [g.capOut, g.inner] : k === 3 ? [g.inner, R - g.synTh] : [R - g.synTh, R + 1];
  if (r2 - r1 < 2) return null;
  return band(g.a, r1, r2, k === 2 ? H * 0.8 : H);
}

/** Inside the camera group: the layer being named glows; named layers keep a faint rim. */
function LayerGlow({ g, cur, rim, sc }: { g: Geo; cur: (k: number) => number; rim: (k: number) => number; sc: number }) {
  return (
    <g pointerEvents="none">
      {[1, 2, 3, 4].map((k) => {
        const d = layerShape(g, k);
        const c = cur(k);
        const o = Math.max(c, 0.4 * rim(k));
        if (!d || o < 0.01) return null;
        return (
          <g key={k}>
            <path d={d} fill="#fde68a" fillRule="evenodd" opacity={0.3 * c} />
            <path d={d} fill="none" stroke="#fff4c2" strokeWidth={2.2 / sc} opacity={o} />
          </g>
        );
      })}
    </g>
  );
}

/** Where each name points in the close-up (section coordinates): the lower-left face of each layer. */
function barrierAnchors(g: Geo) {
  const side = g.a - H * 0.62;
  const u: P = [Math.cos(g.a), Math.sin(g.a)];
  const ll: P = [u[1], -u[0]];
  const d = Math.hypot(u[0] * 0.6 + ll[0], u[1] * 0.6 + ll[1]);
  const e: P = [(u[0] * 0.6 + ll[0]) / d, (u[1] * 0.6 + ll[1]) / d];
  return {
    syn: at(side, R - g.synTh / 2),
    cyto: at(side, R - g.synTh - Math.max(g.cytoTh, 1) / 2),
    ct: at(g.a - H * 0.5, (g.inner + g.capOut) / 2),
    endo: [g.p[0] + e[0] * g.rad * 0.86, g.p[1] + e[1] * g.rad * 0.86] as P,
    kar: at(g.a + H * 0.9, R - g.synTh * 0.8),
    cap: [g.p[0] + g.rad * 0.35, g.p[1] + g.rad * 0.2] as P,
  };
}

/** Exchange across the wall (screen space): O2 into the capillary, CO2 back out. */
function ExchangeArrows({ g, z, k }: { g: Geo; z: ReturnType<typeof zoom>; k: number }) {
  if (k <= 0.01) return null;
  const o0 = z.at(...at(g.a + 0.05, R + 46));
  const o1 = z.at(...at(g.a + 0.05, g.capOut + 2));
  const c0 = z.at(...at(g.a - 0.08, g.capOut + 2));
  const c1 = z.at(...at(g.a - 0.08, R + 46));
  const tO = z.at(...at(g.a + 0.17, R + 50));
  const tC = z.at(...at(g.a - 0.21, R + 50));
  return (
    <g>
      <Arrow from={o0} to={o1} bend={0} color="#fbbf24" show={k} progress={k} width={3.4} head={13} />
      <Arrow from={c0} to={c1} bend={0} color="#60a5fa" show={k} progress={k} width={3.4} head={13} />
      <Note x={tO[0]} y={tO[1]} show={k} tone="accent" size={13}>
        O2
      </Note>
      <Note x={tC[0]} y={tC[1]} show={k} size={13}>
        CO2
      </Note>
    </g>
  );
}

/** Label rows top to bottom: each at its anchor's height, at least `gap` below the previous one; a
 *  fading name (vis → 0) gives its room back smoothly. */
function rows(ys: number[], vis: number[] = [], gap = 32) {
  const out: number[] = [];
  ys.forEach((y, i) => {
    if (!i) return out.push(y);
    const v = vis[i] ?? 1;
    out.push(lerp(out[i - 1], Math.max(y, out[i - 1] + gap), v));
  });
  return out;
}

export function VillusCross({ t, reduced }: SceneProps) {
  const g = barrierGeo(0);
  const push = easeInOut(seg(t, 0.82, 0.845));
  const z = barrierCam(g, push);
  const sc = lerp(1, ZS, push);
  const pre = 1 - seg(t, 0.82, 0.828);
  // Inside → out, as the notes list them: endothelium, connective tissue, cytotrophoblast, syncytium.
  const rv = (k: number) => seg(t, 0.845 + (k - 1) * 0.018, 0.86 + (k - 1) * 0.018);
  const done = seg(t, 0.914, 0.925);
  const cur = (k: number) => rv(k) * (1 - (k < 4 ? rv(k + 1) : done));
  const exch = seg(t, 0.915, 0.935);
  const mols = seg(t, 0.92, 0.99);
  // Names: the whole section (before) → the wall over capillary A (after).
  const { syn, cyto, core } = layerAnchors(0);
  const cap = CAPS[0];
  const A = barrierAnchors(g);
  const s = (p: P) => z.at(p[0], p[1]);
  const [aS, aC, aT, aE] = [s(A.syn), s(A.cyto), s(A.ct), s(A.endo)];
  const [yS, yC, yT, yE] = rows([aS[1], aC[1], aT[1], aE[1]]);
  const mixP = (p: P, q: P): P => [lerp(p[0], q[0], push), lerp(p[1], q[1], push)];
  const pS = mixP(syn, aS);
  const pC = mixP(cyto, aC);
  const pT = mixP(core, aT);
  // Whole section: the lower capillary's lining, so its name sits below the connective tissue's.
  const capB = at(CAPS[1].a, R * CAPS[1].r0);
  const pE = mixP([capB[0] - CAPS[1].rad0 + 1, capB[1] + 4], aE);
  const ivsA: P = push > 0.5 ? IVS_NEAR : [760, 220];
  const capL = mixP([capB[0] + 10, capB[1]], s(A.cap));
  const kar = s(A.kar);
  const karA = push > 0.5 ? kar : at(cap.a, R + 2);
  return (
    <g>
      <W3bDefs />
      <CrossDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <CrossSection thin={0} o2={mols} co2={mols} reduced={reduced} />
        <LayerGlow g={g} cur={cur} rim={rv} sc={sc} />
      </g>
      <ExchangeArrows g={g} z={z} k={exch} />
      <Label id="sinzitiotrofoblastoa" x={190} y={lerp(170, yS, push)} ax={pS[0]} ay={pS[1]} text="4. Sinzitiotrofoblastoa" show={Math.max(pre, rv(4))} />
      <Label id="zitotrofoblastoa" x={190} y={lerp(250, yC, push)} ax={pC[0]} ay={pC[1]} text="3. Zitotrofoblastoa" show={Math.max(pre, rv(3))} />
      <Label id="ehun-konektiboa" x={190} y={lerp(330, yT, push)} ax={pT[0]} ay={pT[1]} text="2. Ehun konektiboa" show={Math.max(pre, rv(2))} />
      <Label id="endotelioa" x={190} y={lerp(410, yE, push)} ax={pE[0]} ay={pE[1]} text="1. Endotelioa" show={Math.max(pre, rv(1))} />
      <Label id="karena-muga" x={push > 0.5 ? 810 : 190} y={push > 0.5 ? kar[1] : 92} ax={karA[0]} ay={karA[1]} show={Math.max(pre, done)} />
      <Label id="biloxka-arteko-espazioa" x={push > 0.5 ? 190 : 810} y={push > 0.5 ? 70 : 250} ax={ivsA[0]} ay={ivsA[1]} show={Math.max(pre, done)} />
      <Label id="biloxka-kapilarrak" x={810} y={lerp(380, Math.max(capL[1], kar[1] + 40), push)} ax={capL[0]} ay={capL[1]} />
      <Note x={500} y={600} tone="accent" show={seg(t, 0.82, 0.86)}>
        Karena muga (barrutik kanpora): endotelioa → ehun konektiboa → zitotrofoblastoa → sinzitiotrofoblastoa
      </Note>
      <Note x={500} y={600} show={1 - seg(t, 0.8, 0.82)}>
        Biloxka tertziarioaren zeharkako mozketa
      </Note>
    </g>
  );
}

export function VillusThinning({ t, reduced }: SceneProps) {
  // The view opens (.5) on month 3: push-in, the four layers named inside → out, then the wall thins to two.
  const push = easeInOut(seg(t, 0.5, 0.52));
  const rv = (k: number) => seg(t, 0.52 + (k - 1) * 0.012, 0.532 + (k - 1) * 0.012);
  const fourDone = seg(t, 0.568, 0.576);
  const thin = seg(t, 0.578, 0.62);
  const g = barrierGeo(thin);
  // The camera stays on the month-3 wall: the capillary is seen moving up under the thinned surface.
  const z = barrierCam(barrierGeo(0), push);
  const sc = lerp(1, ZS, push);
  const pre = 1 - seg(t, 0.5, 0.506);
  const cur = (k: number) => rv(k) * (1 - (k < 4 ? rv(k + 1) : fourDone));
  // The two layers that stay light up again once the others are gone.
  const two = seg(t, 0.62, 0.632) * (1 - 0.5 * seg(t, 0.66, 0.67));
  const curT = (k: number) => Math.max(cur(k), k === 1 || k === 4 ? two : 0);
  const gone = seg(t, 0.584, 0.6);
  const renum = seg(t, 0.604, 0.618);
  const exch = seg(t, 0.632, 0.65);
  const mols = seg(t, 0.636, 0.7);
  const meheketa = seg(t, 0.578, 0.59) * (1 - seg(t, 0.63, 0.645));
  const { syn, cyto, core } = layerAnchors(thin);
  const A = barrierAnchors(g);
  const s = (p: P) => z.at(p[0], p[1]);
  const [aS, aC, aT, aE] = [s(A.syn), s(A.cyto), s(A.ct), s(A.endo)];
  const [yS, yC, yT, yE] = rows([aS[1], aC[1], aT[1], aE[1]], [1, clamp((1 - gone) * 3), clamp((1 - gone) * 3), 1]);
  const mixP = (p: P, q: P): P => [lerp(p[0], q[0], push), lerp(p[1], q[1], push)];
  const pS = mixP(syn, aS);
  const pC = mixP(cyto, aC);
  const pT = mixP(core, aT);
  const capB = at(CAPS[1].a, lerp(R * CAPS[1].r0, R - lerp(20, 9, thin) - lerp(CAPS[1].rad0, CAPS[1].rad1, thin) - 3, thin));
  const pE = mixP([capB[0] - lerp(CAPS[1].rad0, CAPS[1].rad1, thin) + 1, capB[1] + 4], aE);
  const wallTh = lerp(46, 12, thin);
  const mk = s(at(g.a, R - 14));
  const kar = s(A.kar);
  const karA = push > 0.5 ? kar : at(g.a, R + 2);
  const ivsA: P = push > 0.5 ? IVS_NEAR : [770, 500];
  const synShow = Math.max(pre, rv(4)) * Math.abs(1 - 2 * renum);
  return (
    <g>
      <W3bDefs />
      <CrossDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <CrossSection thin={thin} o2={mols} co2={mols} reduced={reduced} />
        <LayerGlow g={g} cur={curT} rim={(k) => rv(k) * (k === 2 || k === 3 ? 1 - gone : 1)} sc={sc} />
      </g>
      <ExchangeArrows g={g} z={z} k={exch} />
      <Mark id="karena-mugaren-meheketa" x={mk[0]} y={mk[1]} rx={34 * sc} show={meheketa} />
      <Label id="sinzitiotrofoblastoa" x={190} y={lerp(170, yS, push)} ax={pS[0]} ay={pS[1]} text={renum < 0.5 ? '4. Sinzitiotrofoblastoa' : '2. Sinzitiotrofoblastoa'} show={synShow} />
      <Label id="zitotrofoblastoa" x={190} y={lerp(250, yC, push)} ax={pC[0]} ay={pC[1]} text="3. Zitotrofoblastoa" show={Math.max(pre, rv(3)) * (1 - gone)} />
      <Label id="ehun-konektiboa" x={190} y={lerp(330, yT, push)} ax={pT[0]} ay={pT[1]} text="2. Ehun konektiboa" show={Math.max(pre, rv(2)) * (1 - gone)} />
      <Label id="endotelioa" x={190} y={lerp(410, yE, push)} ax={pE[0]} ay={pE[1]} text="1. Endotelioa" show={Math.max(pre, rv(1))} />
      <Label id="karena-muga" x={push > 0.5 ? 810 : 190} y={push > 0.5 ? kar[1] : 60} ax={karA[0]} ay={karA[1]} show={Math.max(pre, fourDone)} />
      <Label id="karena-mugaren-meheketa" x={810} y={Math.max(kar[1] + 34, 240)} ax={mk[0] + 10} ay={mk[1] + 4} show={meheketa} small />
      <Label id="biloxka-arteko-espazioa" x={push > 0.5 ? 190 : 810} y={push > 0.5 ? 70 : 470} ax={ivsA[0]} ay={ivsA[1]} show={Math.max(pre, fourDone)} />
      {/* Barrier thickness gauge. */}
      <g pointerEvents="none">
        <rect x={864} y={560 - wallTh} width={12} height={wallTh} rx={3} fill="#fde68a" opacity={0.85} />
        <path d="M858,560 H882" stroke="#e8eefc" strokeWidth={1.4} opacity={0.7} />
      </g>
      <Note x={870} y={578} size={12}>
        Muga lodiera
      </Note>
      <Note x={500} y={606} show={1 - seg(t, 0.58, 0.6)}>
        3. hilabetea: lau geruza
      </Note>
      <Note x={500} y={606} tone="accent" show={seg(t, 0.604, 0.622)}>
        4. hilabetetik aurrera: bi geruza (endotelioa + sinzitiotrofoblastoa)
      </Note>
    </g>
  );
}
