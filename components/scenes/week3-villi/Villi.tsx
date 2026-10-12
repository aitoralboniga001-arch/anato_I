'use client';

import { Destination, Flow, Label, Note, Part, clamp, lerp, rand, seg, zoom, type SceneProps } from '@/components/kit';
import type { ReactNode } from 'react';
import {
  BASE,
  CellPaths,
  Island,
  K,
  VesselSet,
  W3bDefs,
  fingerOutline,
  fingerShape,
  fringe,
  fw,
  fx,
  islandStates,
  layerTop,
  newBatch,
  offsetPoly,
  pd,
  planVessel,
  roundCell,
  vesselSegments,
  wallCells,
  type CellBatch,
  type Finger,
  type P,
} from './art';

/**
 * Stage `biloxkak` — primary → secondary → tertiary villus (day 13 → end of week 3), after Langman
 * fig. 5-11 / 5-13 and the notes' figure. Windows (shared by every view and the beats in week3b.ts):
 *   .000–.070 primary villi: a core of cytotrophoblast cells covered by syncytium
 *   .075–.250 the cytotrophoblast cells proliferate (mitoses) and the villi lengthen
 *   .305–.430 extra-embryonic mesoderm of the chorionic plate invades the core, pushing the core cells
 *             aside into a single wall layer → secondary villus
 *   .565–.630 angioblast clusters ("blood islands") condense in the mesoderm core (and in the plate)
 *   .675–.800 each island hollows and elongates; the pieces join into a capillary loop continuous with
 *             the chorionic-plate vessel → tertiary villus (no flow yet: the heart beats in week 4)
 *   .840–1    comparison of the three transverse sections: only the core changes
 * Each window starts at its beat and ends before the beat's held frame (next beat − 0.035).
 */
export const W = {
  grow: [0.075, 0.25],
  meso: [0.305, 0.43],
  islands: [0.565, 0.63],
  vessels: [0.675, 0.8],
} as const;

const PLATE = { syn: 470, cyto: 481, meso: 494, vessel: 528, bottom: 560 };
const ROOF = { top: 92, bottom: 124 };
const FIL = { syn: 10, cyto: 20, meso: 30 };

const DEF = [
  { x: 500, len0: 226, len1: 306, hw: 48, ts: 9, tc: 11, sway: 7, lam: 62, ph: 0.5, nIsl: 6, seed: 1 },
  { x: 300, len0: 148, len1: 220, hw: 35, ts: 8, tc: 10, sway: 6, lam: 50, ph: 2.2, nIsl: 4, seed: 2 },
  { x: 700, len0: 160, len1: 234, hw: 35, ts: 8, tc: 10, sway: 6, lam: 54, ph: 4.1, nIsl: 4, seed: 3 },
] as const;

const typeShow = (t: number) => {
  const toSecondary = seg(t, 0.31, 0.37);
  const toTertiary = seg(t, 0.7, 0.76);
  return { primary: 1 - toSecondary, secondary: toSecondary * (1 - toTertiary), tertiary: toTertiary };
};
const spaceShow = (t: number) => {
  const ivs = seg(t, 0.7, 0.78);
  return { ivs, lakuak: 1 - ivs };
};

function geometry(t: number) {
  const grow = seg(t, W.grow[0], W.grow[1]);
  const meso = seg(t, W.meso[0], W.meso[1]);
  const islands = seg(t, W.islands[0], W.islands[1]);
  const vessels = seg(t, W.vessels[0], W.vessels[1], (k) => k);
  const v = DEF.map((d) => {
    const len = lerp(d.len0, d.len1, grow);
    const f: Finger = { x: d.x, base: PLATE.syn, len, hw: d.hw, sway: d.sway, lam: d.lam, ph: d.ph };
    const apexSyn = PLATE.syn - len;
    const apexCyto = apexSyn + d.ts;
    const apexCore = apexCyto + d.tc;
    const front = lerp(PLATE.meso + 3, apexCore, meso);
    return { ...d, f, len, apexSyn, apexCyto, apexCore, front };
  });
  return { grow, meso, islands, vessels, v };
}
type Geo = ReturnType<typeof geometry>;
type Vil = Geo['v'][number];

/** Capillary loop of a villus core: up near one wall, round the tip, down the other, into the plate vessel. */
function loopPts(x: Vil): P[] {
  const d = x.ts + x.tc;
  const off = (y: number) => fw(x.f, Math.min(y, PLATE.meso), d) * 0.46;
  const top = x.apexCore + 6;
  const rl = off(top + 12);
  const cy = top + rl;
  const left: P[] = [];
  const right: P[] = [];
  const n = Math.ceil((PLATE.vessel - cy) / 6);
  for (let i = 0; i <= n; i++) {
    const y = PLATE.vessel - ((PLATE.vessel - cy) * i) / n;
    left.push([fx(x.f, y) - off(y), y]);
    right.push([fx(x.f, y) + off(y), y]);
  }
  const cx = fx(x.f, cy);
  const cap: P[] = [];
  for (let i = 1; i < 12; i++) {
    const a = Math.PI + (Math.PI * i) / 12;
    cap.push([cx + rl * Math.cos(a), cy + rl * Math.sin(a)]);
  }
  return [...left, ...cap, ...right.reverse()];
}

const PLATE_VESSEL: P[] = Array.from({ length: 61 }, (_, i) => {
  const x = 196 + i * 10.2;
  return [x, PLATE.vessel + 2.2 * Math.sin(x / 37)];
});

/** Vessel plans use the final villus length (vessels only form once growth is over). */
const FINAL = geometry(1);
const LOOPS = FINAL.v.map((x) => planVessel(loopPts(x), x.nIsl, x.seed));
const PLATE_PLAN = planVessel(PLATE_VESSEL, 8, 9);

/* ---------- Cells of the cytotrophoblast ---------- */

/** Wall cells (one row inside the syncytium) of every villus and of the plate band between them. */
function wallBatch(g: Geo, detail: boolean): CellBatch {
  const b = newBatch();
  const sp = 11.5;
  const xs: [number, number][] = [];
  for (const x of g.v) {
    const s = fingerShape(x.f, x.ts, PLATE.cyto, FIL.cyto, x.apexCyto);
    if (!s) continue;
    wallCells(b, s.left, x.tc, sp, { detail });
    wallCells(b, s.right, x.tc, sp, { flip: true, detail });
    wallCells(b, [s.left[s.left.length - 1], ...s.cap, s.right[s.right.length - 1]], x.tc, sp, { fit: true, detail });
    xs.push([s.left[0][0], s.right[0][0]]);
  }
  xs.sort((p, q) => p[0] - q[0]);
  let from = 150;
  for (const [a, z] of xs) {
    if (a - from > 6) wallCells(b, [[from, PLATE.cyto], [a, PLATE.cyto]], PLATE.meso - PLATE.cyto, sp, { detail });
    from = z;
  }
  wallCells(b, [[from, PLATE.cyto], [850, PLATE.cyto]], PLATE.meso - PLATE.cyto, sp, { detail });
  return b;
}

/** Interior half-width of a villus core (inside the wall cells) at height y, rounded at the tip. */
function coreHalf(x: Vil, y: number) {
  const d = x.ts + x.tc;
  const rc = fw(x.f, x.apexCore + 10, d);
  const cy = x.apexCore + rc;
  if (y >= cy) return fw(x.f, y, d);
  if (y <= x.apexCore) return 0;
  return Math.sqrt(Math.max(0, rc * rc - (cy - y) * (cy - y)));
}

/**
 * Core cells of the primary villus. They proliferate (mitoses) while the villus lengthens; new rows
 * bud at the tip. When the mesoderm arrives, the cells it reaches are pushed aside to the wall row.
 */
function coreBatch(g: Geo, t: number, detail: boolean): CellBatch {
  const b = newBatch();
  const r = 4.9;
  const row = 10.2;
  const dividing = t > W.grow[0] && t < W.grow[1] + 0.01;
  for (const x of g.v) {
    if (x.front <= x.apexCore + 1) continue;
    for (let j = 0; j < 40; j++) {
      const y = PLATE.meso - 5 - j * row;
      if (y < x.apexCore + 2) break;
      const half = coreHalf(x, y);
      const wi = half - r - 0.6;
      const appear = clamp((half - 3) / 7);
      if (appear <= 0.02) continue;
      const ncol = wi > 0 ? Math.floor((2 * wi) / 9.8) + 1 : 1;
      const step = ncol > 1 ? (2 * wi) / (ncol - 1) : 0;
      const cx0 = fx(x.f, y);
      for (let c = 0; c < ncol; c++) {
        const seed = x.seed * 1000 + j * 31 + c * 7;
        const jx = (rand(seed) - 0.5) * 1.6;
        const jy = (rand(seed + 1) - 0.5) * 1.6;
        let px = cx0 + (ncol > 1 ? -wi + c * step : 0) + jx + (j % 2 ? 1.2 : -1.2);
        let rr = r * appear;
        // The invading mesoderm front pushes the cells it reaches out to the wall row.
        const k = clamp((y - x.front + 3) / 18);
        if (k > 0) {
          const side = px >= cx0 ? 1 : -1;
          const target = cx0 + side * (half + 1);
          px = lerp(px, target, k);
          rr *= 1 - k;
        }
        if (rr < 0.6) continue;
        const near = (x.apexSyn + x.len * 0.0 - y) / x.len;
        const mit = dividing && near > -0.62 && rand(seed + Math.floor(t * 95 + rand(seed + 5) * 9) * 1.37) < 0.075 ? 1 : 0;
        roundCell(b, px, y + jy, rr, detail, mit);
      }
    }
  }
  return b;
}

/** Spindle-shaped mesoderm cells leading the invasion, just ahead of the front. */
function leaders(g: Geo) {
  const on = clamp(g.meso / 0.08) * clamp((1 - g.meso) / 0.1);
  if (on <= 0.02) return null;
  return g.v.flatMap((x) =>
    [0, 1, 2].map((i) => {
      const y = x.front - 4 - i * 7.5;
      if (y < x.apexCore + 3) return null;
      const px = fx(x.f, y) + (i - 1) * fw(x.f, y, x.ts + x.tc) * 0.45;
      return (
        <g key={`${x.seed}-${i}`} opacity={on}>
          <ellipse cx={px} cy={y} rx={2.3} ry={5.4} fill={K.meso} stroke={K.mesoEdge} strokeWidth={0.7} transform={`rotate(${(i - 1) * 14} ${px} ${y})`} />
          <ellipse cx={px} cy={y} rx={1.1} ry={2.2} fill="#a8492f" transform={`rotate(${(i - 1) * 14} ${px} ${y})`} />
        </g>
      );
    }),
  );
}

/** A layer drawn twice: in the chorionic plate as itself, and in the villi as itself and the villus type. */
function Split({ id, groups, children }: { id: string; groups: readonly string[]; children: ReactNode }) {
  return (
    <>
      <Part id={id}>
        <g clipPath="url(#w3b-plate)">{children}</g>
      </Part>
      <Part id={id} groups={[...groups]}>
        <g clipPath="url(#w3b-fingers)">{children}</g>
      </Part>
    </>
  );
}

/* ---------- The longitudinal drawing (also used, zoomed, by the close-up) ---------- */

function VilliDrawing({ t, reduced, detail = false }: SceneProps & { detail?: boolean }) {
  const g = geometry(t);
  const { primary, secondary, tertiary } = typeShow(t);
  const { ivs, lakuak } = spaceShow(t);
  const synTop = layerTop(g.v.map((x) => ({ f: x.f, apex: x.apexSyn, d: 0 })), PLATE.syn, FIL.syn);
  const cytoPts = layerTop(g.v.map((x) => ({ f: x.f, apex: x.apexCyto, d: x.ts })), PLATE.cyto, FIL.cyto);
  const mesoPts = layerTop(g.v.map((x) => ({ f: x.f, apex: x.front, d: x.ts + x.tc })), PLATE.meso, FIL.meso);
  const close = (pts: P[]) => pd([...pts, [1040, PLATE.bottom], [-40, PLATE.bottom]], true);
  const fingers = g.v.map((x) => fingerShape(x.f, 0, PLATE.syn, FIL.syn, x.apexSyn)).filter((s) => !!s);
  const walls = wallBatch(g, detail);
  const core = coreBatch(g, t, detail);
  const vesselOn = g.vessels > 0.001;
  const islandOn = g.islands > 0.001;
  // The villus type is the whole villus (cover + core): its layers in the villi light, and are named, as it.
  const types = (['biloxka-primarioa', 'biloxka-sekundarioa', 'biloxka-tertziarioa'] as const).filter((_, i) => [primary, secondary, tertiary][i] > 0.02);

  return (
    <g mask="url(#m-slab)">
      <Part id="dezidua-basala">
        <rect x={0} y={0} width={1000} height={ROOF.top + 1} fill="url(#p-decidua)" />
        <rect x={0} y={0} width={1000} height={ROOF.top + 1} fill="url(#w3b-vshade)" />
        {[260, 430, 610, 760].map((x, i) => (
          <path key={i} d={`M${x},6 q${7 + i * 2},14 -2,26 q-10,12 3,26 q9,10 -1,24`} fill="none" stroke="#9e1f39" strokeWidth={3.2} strokeLinecap="round" opacity={0.55} />
        ))}
      </Part>

      <Part id="lakuak" show={lakuak}>
        <rect x={0} y={ROOF.bottom - 1} width={1000} height={PLATE.syn - ROOF.bottom + 14} fill="url(#w3b-blood)" />
      </Part>
      <Part id="biloxka-arteko-espazioa" show={ivs}>
        <rect x={0} y={ROOF.bottom - 1} width={1000} height={PLATE.syn - ROOF.bottom + 14} fill="url(#w3b-blood)" />
      </Part>
      <rect x={0} y={ROOF.bottom} width={1000} height={PLATE.syn - ROOF.bottom} fill="url(#w3b-vshade)" pointerEvents="none" />
      {!reduced &&
        ['M394,132 C380,250 410,360 392,462', 'M606,462 C620,360 590,250 608,132', 'M226,140 C236,280 214,380 230,462', 'M776,462 C766,340 790,250 772,140'].map((d, i) => (
          <Flow key={i} d={d} n={5} dur={8 + i} r={2.4} color="#e8566d" reduced={reduced} />
        ))}

      {/* Syncytial roof (faces the decidua): its blood-facing surface carries microvilli too. */}
      <Part id="sinzitiotrofoblastoa">
        <rect x={0} y={ROOF.top} width={1000} height={ROOF.bottom - ROOF.top} fill="url(#w3b-syn)" />
        <path d={fringe([[1000, ROOF.bottom], [0, ROOF.bottom]], 4.5, 3)} stroke={K.fringe} strokeWidth={0.9} />
        <path d={`M0,${ROOF.bottom}H1000`} stroke={K.synEdge} strokeWidth={1.4} />
      </Part>

      {/* Soft shadow of the villi on the blood behind them (depth). */}
      <path d={close(synTop)} transform="translate(6 8)" fill={K.shadow} pointerEvents="none" />

      {/* The villus type: outlined around every villus (the outline lights with the step). */}
      {(
        [
          ['biloxka-primarioa', primary],
          ['biloxka-sekundarioa', secondary],
          ['biloxka-tertziarioa', tertiary],
        ] as const
      ).map(([id, s]) => (
        <Part key={id} id={id} show={s}>
          {fingers.map((f, i) => (
            <path key={i} d={pd(fingerOutline(f!))} fill="none" stroke="#eef3ff" strokeWidth={4} opacity={0.34} strokeLinejoin="round" />
          ))}
        </Part>
      ))}

      <clipPath id="w3b-fingers">
        <rect x={-40} y={-40} width={1080} height={PLATE.syn + 40} />
      </clipPath>
      <clipPath id="w3b-plate">
        <rect x={-40} y={PLATE.syn} width={1080} height={640} />
      </clipPath>
      {/* Every layer is drawn twice: in the plate, and in the villi, where it is also the villus type. */}
      <Split id="sinzitiotrofoblastoa" groups={types}>
        <path d={close(synTop)} fill="url(#w3b-syn)" />
        <path d={fringe(synTop, 4.4, 3.2)} stroke={K.fringe} strokeWidth={0.9} />
        <path d={pd(offsetPoly(synTop, -2))} fill="none" stroke={K.synRim} strokeWidth={1.3} />
        <path d={pd(synTop)} fill="none" stroke={K.synEdge} strokeWidth={1.5} strokeLinejoin="round" />
      </Split>

      {/* Opaque bases under the inner layers, so a dimmed layer never shows the green below. */}
      <path d={close(cytoPts)} fill={BASE} pointerEvents="none" />
      <Split id="zitotrofoblastoa" groups={types}>
        <path d={close(cytoPts)} fill={K.cytoGround} />
        <CellPaths b={walls} />
      </Split>

      <path d={close(mesoPts)} fill={BASE} pointerEvents="none" />
      <Split id="enbrioi-kanpoko-mesodermoa" groups={types}>
        <path d={close(mesoPts)} fill={K.meso} />
        <path d={close(mesoPts)} fill="url(#p-meso-extra)" />
        <path d={pd(mesoPts)} fill="none" stroke={K.mesoEdge} strokeWidth={1.1} strokeLinejoin="round" />
        {leaders(g)}
      </Split>
      {/* The chorionic plate is the extra-embryonic mesoderm lining the cytotrophoblast: its band lights as itself. */}
      <Part id="korion-plaka" groups={['enbrioi-kanpoko-mesodermoa']}>
        <rect x={-40} y={PLATE.meso} width={1080} height={PLATE.bottom - PLATE.meso} fill={K.meso} />
        <rect x={-40} y={PLATE.meso} width={1080} height={PLATE.bottom - PLATE.meso} fill="url(#p-meso-extra)" />
      </Part>

      {/* Core cells of the primary villus (drawn over the advancing mesoderm, so the push is visible). */}
      {core.body.length > 0 && (
        <Part id="zitotrofoblastoa" groups={types}>
          <CellPaths b={core} />
        </Part>
      )}

      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={PLATE.bottom} width={1000} height={640 - PLATE.bottom} fill="#121a2c" />
        <rect x={0} y={PLATE.bottom} width={1000} height={640 - PLATE.bottom} fill="url(#g-shade)" opacity={0.35} />
        <path d={`M0,${PLATE.bottom}H1000`} stroke="#cf6f52" strokeWidth={1} opacity={0.7} />
      </Part>

      {/* Vessels of the chorionic plate (same process, in the plate mesoderm). */}
      <Part id="enbrioi-kanpoko-hodiak" show={vesselOn || islandOn ? 1 : 0}>
        {islandStates(PLATE_PLAN, g.islands, g.vessels).map(({ p, appear, gone, k }) => (
          <Island key={k} x={p[0]} y={p[1]} s={appear * (1 - gone)} seed={90 + k * 7} scale={1.4} />
        ))}
        <VesselSet segs={vesselSegments(PLATE_PLAN, g.vessels)} w={9} detail={detail} />
      </Part>

      <Part id="biloxka-kapilarrak" groups={types} show={vesselOn || islandOn ? 1 : 0}>
        {LOOPS.map((plan, vi) => (
          <g key={vi}>
            {islandStates(plan, g.islands, g.vessels).map(({ p, appear, gone, k }) => (
              <Island key={k} x={p[0]} y={p[1]} s={appear * (1 - gone)} seed={vi * 50 + k * 7} scale={vi === 0 ? 1.5 : 1.3} />
            ))}
            <VesselSet segs={vesselSegments(plan, g.vessels)} w={vi === 0 ? 9 : 7.6} detail={detail} />
          </g>
        ))}
      </Part>

      {/* Roundness of each villus and depth of the plate (light from the top left). */}
      <g pointerEvents="none">
        {fingers.map((f, i) => (
          <path key={i} d={pd(fingerOutline(f!), true)} fill="url(#w3b-cyl)" />
        ))}
        <rect x={0} y={PLATE.syn} width={1000} height={PLATE.bottom - PLATE.syn} fill="url(#w3b-vshade)" opacity={0.6} />
      </g>

    </g>
  );
}

/* ---------- Labels ---------- */

function labels(t: number, at: (x: number, y: number) => [number, number], close: false | { fy: number }) {
  const g = geometry(t);
  const [c, l, r] = g.v;
  const { primary, secondary, tertiary } = typeShow(t);
  const { ivs, lakuak } = spaceShow(t);
  const capShow = Math.max(g.islands, g.vessels > 0 ? 1 : 0);
  const L = (key: string, id: string, x: number, y: number, p: [number, number], show = 1, text?: string) => {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={ax} ay={ay} show={show} text={text} />;
  };
  // Before the vessels join, the name sits on the biggest island so far (a young one is still a gappy ring).
  const isl = (plan: (typeof LOOPS)[number], k: number) => {
    const all = islandStates(plan, 1, 0);
    if (g.vessels > 0.01) return all[k].p;
    const now = islandStates(plan, g.islands, 0);
    return all[now.reduce((m, x, i) => (x.appear > now[m].appear + 0.01 ? i : m), k)].p;
  };
  // A villus type is named inside the villus it outlines: on its axis, in the core that defines the type.
  const outline = (x: Vil, y: number): [number, number] => [fx(x.f, y), y];
  if (close) {
    const fy = close.fy;
    const yIn = (y: number) => clamp(y, fy - 120, fy + 120);
    const ySyn = yIn(fy - 40);
    const yCyto = yIn(fy + 12);
    const yType = yIn(fy + 82);
    // The mesoderm: in the plate while the camera is down there, then at the advancing front.
    const plateM: [number, number] = [c.x + 64, 508];
    const coreY = g.islands > 0.01 ? PLATE.syn - 12 : clamp(c.front + 22, c.apexCore + 14, PLATE.syn - 6);
    const coreM: [number, number] = [fx(c.f, coreY), coreY];
    const mAnchor: [number, number] = g.meso > 0.02 ? coreM : plateM;
    const mScreen = at(mAnchor[0], mAnchor[1]);
    const mShow = clamp((600 - mScreen[1]) / 30) * clamp((mScreen[1] - 40) / 30);
    return (
      <>
        {L('lk', 'lakuak', 180, 92, [c.x - c.hw - 34, Math.max(c.apexSyn + 46, fy - 110)], lakuak)}
        {L('ivs', 'biloxka-arteko-espazioa', 180, 122, [c.x - c.hw - 34, Math.max(c.apexSyn + 46, fy - 110)], ivs)}
        {L('sy', 'sinzitiotrofoblastoa', 180, 200, [fx(c.f, ySyn) - fw(c.f, ySyn, c.ts * 0.5), ySyn])}
        {L('cy', 'zitotrofoblastoa', 180, 290, [fx(c.f, yCyto) - fw(c.f, yCyto, c.ts + c.tc * 0.5), yCyto])}
        {L('b1', 'biloxka-primarioa', 180, 470, outline(c, yType), primary)}
        {L('b2', 'biloxka-sekundarioa', 180, 500, outline(c, yType), secondary)}
        {L('b3', 'biloxka-tertziarioa', 180, 530, outline(c, yType), tertiary)}
        {L('me', 'enbrioi-kanpoko-mesodermoa', 820, 300, mAnchor, mShow, 'Kanpoko mesodermoa')}
        {L('ka', 'biloxka-kapilarrak', 820, 400, isl(LOOPS[0], 3), capShow, 'Biloxka kapilarrak')}
      </>
    );
  }
  // Mesoderm: first in the chorionic plate (its source), then in the core of the right villus, behind the front.
  const plateM: [number, number] = [r.x + 46, 508];
  // In the core, between the two limbs of the capillary loop once it forms (they run near the walls).
  const coreY = g.islands > 0.01 ? PLATE.syn - 64 : r.front + (PLATE.syn - r.front) * 0.35;
  // Once the capillary runs up the axis, beside it: halfway between the vessel and the cytotrophoblast.
  const coreM: [number, number] = [fx(r.f, coreY) + (g.islands > 0.01 ? 10.5 : 0), coreY];
  const k = seg(g.meso, 0.12, 0.32);
  // Once the loop's limbs fill the narrow core, back in the plate (the same mesoderm, with room for the dot).
  const kk = k * (1 - seg(g.vessels, 0, 0.25));
  const mAnchor: [number, number] = [lerp(plateM[0], coreM[0], kk), lerp(plateM[1], coreM[1], kk)];
  const yType = 330;
  const yCyto = 400;
  return (
    <>
      {L('dz', 'dezidua-basala', 190, 52, [262, 52])}
      {L('sy', 'sinzitiotrofoblastoa', 190, 108, [250, 108])}
      {L('b1', 'biloxka-primarioa', 190, 165, outline(c, yType), primary)}
      {L('b2', 'biloxka-sekundarioa', 190, 195, outline(c, yType), secondary)}
      {L('b3', 'biloxka-tertziarioa', 190, 225, outline(c, yType), tertiary)}
      {L('cy', 'zitotrofoblastoa', 190, 400, [fx(l.f, yCyto) - fw(l.f, yCyto, l.ts + l.tc * 0.5), yCyto])}
      {L('kp', 'korion-plaka', 190, 515, [262, 508])}
      {L('kb', 'korion-barrunbea', 190, 598, [262, 598])}
      {L('lk', 'lakuak', 810, 236, [778, 250], lakuak)}
      {L('ivs', 'biloxka-arteko-espazioa', 810, 264, [778, 270], ivs)}
      {L('me', 'enbrioi-kanpoko-mesodermoa', 810, 330, mAnchor, 1, 'Kanpoko mesodermoa')}
      {L('ka', 'biloxka-kapilarrak', 810, 400, isl(LOOPS[2], 2), capShow, 'Biloxka kapilarrak')}
      {L('eh', 'enbrioi-kanpoko-hodiak', 810, 532, islandStates(PLATE_PLAN, 1, 0)[7].p, capShow, 'Enbrioi kanpoko hodiak')}
    </>
  );
}

/* ---------- Progression tracker: primary → secondary → tertiary, one sequence ---------- */

/** A tiny cross-section of a villus of type k (0 primary, 1 secondary, 2 tertiary): only the core differs. */
function MiniSection({ x, y, r, k }: { x: number; y: number; r: number; k: 0 | 1 | 2 }) {
  const rc = r * 0.56;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={K.synEdge} />
      <circle cx={x} cy={y} r={r - 1.2} fill="url(#w3b-syn)" />
      <circle cx={x} cy={y} r={r * 0.78} fill={K.cytoGround} stroke={K.cellEdge} strokeWidth={0.6} />
      {k === 0 ? (
        <g>
          <circle cx={x} cy={y} r={rc} fill={K.cell} />
          {[
            [-0.45, -0.3],
            [0.42, -0.36],
            [0, 0.42],
            [-0.05, -0.02],
          ].map(([dx, dy], i) => (
            <circle key={i} cx={x + dx * rc} cy={y + dy * rc} r={rc * 0.2} fill={K.cellNuc} />
          ))}
        </g>
      ) : (
        <circle cx={x} cy={y} r={rc} fill={K.meso} stroke={K.mesoEdge} strokeWidth={0.6} />
      )}
      {k === 2 &&
        [
          [-0.42, -0.25],
          [0.4, -0.3],
          [0.05, 0.45],
        ].map(([dx, dy], i) => (
          <g key={i}>
            <circle cx={x + dx * rc} cy={y + dy * rc} r={rc * 0.3} fill={K.endo} />
            <circle cx={x + dx * rc} cy={y + dy * rc} r={rc * 0.19} fill={K.lumen} />
          </g>
        ))}
      <circle cx={x} cy={y} r={r} fill="url(#w3b-ball)" />
    </g>
  );
}

const TRACK = { y: 584, xs: [318, 490, 662], r: 12.5, names: ['Primarioa', 'Sekundarioa', 'Tertziarioa'] } as const;

/**
 * Persistent milestone strip under the drawing: the three villus types as mini cross-sections. Each one
 * lights when the villus becomes that type; the joining line grows while the change is happening
 * (mesoderm invading the core; blood islands → capillaries), so the three read as one progression.
 */
function Tracker({ t }: { t: number }) {
  const { primary, secondary, tertiary } = typeShow(t);
  const reached = [1, seg(t, 0.31, 0.37), seg(t, 0.7, 0.76)];
  const current = [primary, secondary, tertiary];
  const links = [seg(t, W.meso[0], 0.37), seg(t, W.islands[0], 0.76)];
  const { y, xs, r } = TRACK;
  return (
    <g pointerEvents="none">
      <rect x={xs[0] - r - 16} y={y - r - 5} width={xs[2] - xs[0] + r + 126} height={2 * r + 10} rx={r + 5} fill="rgba(9,13,24,0.78)" stroke="rgba(232,238,252,0.1)" />
      {links.map((k, i) => {
        const a = xs[i] + r + 98;
        const b = xs[i + 1] - r - 6;
        return (
          <g key={i}>
            <path d={`M${a},${y}H${b}`} stroke="rgba(232,238,252,0.18)" strokeWidth={2.4} strokeLinecap="round" />
            {k > 0.001 && <path d={`M${a},${y}H${lerp(a, b, k)}`} stroke="#f0c48a" strokeWidth={2.4} strokeLinecap="round" />}
            <path d={`M${b - 4},${y - 4} L${b},${y} L${b - 4},${y + 4}`} fill="none" stroke={k > 0.98 ? '#f0c48a' : 'rgba(232,238,252,0.3)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
      {xs.map((x, i) => (
        <g key={x} opacity={0.3 + 0.7 * reached[i]}>
          {current[i] > 0.01 && <circle cx={x} cy={y} r={r + 3} fill="none" stroke="#f0c48a" strokeWidth={1.6} opacity={current[i]} />}
          <MiniSection x={x} y={y} r={r} k={i as 0 | 1 | 2} />
        </g>
      ))}
    </g>
  );
}

function TrackerNames({ t }: { t: number }) {
  const { primary, secondary, tertiary } = typeShow(t);
  const reached = [1, seg(t, 0.31, 0.37), seg(t, 0.7, 0.76)];
  const current = [primary, secondary, tertiary];
  return (
    <>
      {TRACK.xs.map((x, i) => (
        <Note key={x} x={x + TRACK.r + 7} y={TRACK.y} align="start" size={12} tone={current[i] > 0.5 ? 'accent' : 'dim'} show={Math.max(0.4, reached[i])}>
          {TRACK.names[i]}
        </Note>
      ))}
    </>
  );
}

export function VilliLongitudinal(props: SceneProps) {
  const id = (x: number, y: number): [number, number] => [x, y];
  return (
    <g>
      <W3bDefs />
      <VilliDrawing {...props} />
      <Tracker t={props.t} />
      {labels(props.t, id, false)}
      <TrackerNames t={props.t} />
    </g>
  );
}

/** Close-up camera: on the tip of the central villus, panning down to follow the mesoderm front up. */
function closeCam(t: number) {
  const g = geometry(t);
  const c = g.v[0];
  const tipCam = c.apexSyn + 128;
  const frontCam = Math.max(tipCam, Math.min(430, c.front + 34));
  // Pan after beat 2's held frame (0.265) and before the mesoderm sets off (0.305).
  return lerp(tipCam, frontCam, seg(t, 0.272, 0.304));
}

export function VilliTip(props: SceneProps) {
  const fy = closeCam(props.t);
  const z = zoom(500, fy, 2.3, 500, 330);
  return (
    <g>
      <W3bDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <VilliDrawing {...props} detail />
      </g>
      <Tracker t={props.t} />
      {labels(props.t, z.at, { fy })}
      <TrackerNames t={props.t} />
    </g>
  );
}

/* ---------- Transverse sections (Langman fig. 5-11, the notes' figure) ---------- */

const SEC = { R: 106, ts: 19, tc: 23, y: 262 };
const SLOTS = [278, 500, 722] as const;
const LUMENS: [number, number, number, number, number][] = [
  // angle (deg), radius (fraction of the core), rx, ry, rotation
  [-128, 0.55, 9, 6.5, 30],
  [-38, 0.6, 7, 9.5, -20],
  [36, 0.5, 10, 7, 15],
  [118, 0.58, 7.5, 6, -35],
  [196, 0.5, 6.5, 8.5, 10],
];
const HEX: [number, number][] = (() => {
  const out: [number, number][] = [];
  const s = 10.6;
  for (let j = -6; j <= 6; j++)
    for (let i = -6; i <= 6; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * s;
      const y = j * s * 0.88;
      if (Math.hypot(x, y) < SEC.R - SEC.ts - SEC.tc - 5) out.push([x, y]);
    }
  return out;
})();

interface SecState {
  meso: number;
  islands: number;
  vessels: number;
}

function VillusSection({ cx, cy, s, seed }: { cx: number; cy: number; s: SecState; seed: number }) {
  const { R, ts, tc } = SEC;
  const rin = R - ts;
  const rc = rin - tc;
  const rm = rc * s.meso;
  const ring: P[] = Array.from({ length: 73 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    return [cx + rin * Math.cos(a), cy + rin * Math.sin(a)];
  });
  const outer: P[] = Array.from({ length: 97 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  const walls = newBatch();
  wallCells(walls, ring, tc, 15.5, { fit: true });
  const core = newBatch();
  HEX.forEach(([hx, hy], i) => {
    const d = Math.hypot(hx, hy);
    const a = d > 0.5 ? Math.atan2(hy, hx) : rand(seed + i) * Math.PI * 2;
    const k = clamp((rm + 7 - d) / 14);
    const dist = lerp(d, rc - 3, k);
    const r = 5 * (1 - k);
    roundCell(core, cx + Math.cos(a) * dist + (rand(seed + i * 3) - 0.5) * 1.4, cy + Math.sin(a) * dist + (rand(seed + i * 5) - 0.5) * 1.4, r);
  });
  const annulus = `${pd(outer, true)}${pd([...ring].reverse(), true)}`;
  return (
    <g>
      <circle cx={cx + 5} cy={cy + 7} r={R} fill={K.shadow} pointerEvents="none" />
      <Part id="sinzitiotrofoblastoa">
        <path d={fringe(outer, 4.2, 3.6)} stroke={K.fringe} strokeWidth={1} />
        <path d={annulus} fill="url(#w3b-syn)" fillRule="evenodd" />
        <circle cx={cx} cy={cy} r={R - 2} fill="none" stroke={K.synRim} strokeWidth={1.3} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={K.synEdge} strokeWidth={1.5} />
      </Part>
      <circle cx={cx} cy={cy} r={rin} fill={BASE} pointerEvents="none" />
      <Part id="zitotrofoblastoa">
        <circle cx={cx} cy={cy} r={rin} fill={K.cytoGround} />
        <CellPaths b={walls} />
        <CellPaths b={core} />
      </Part>
      {rm > 0.5 && <circle cx={cx} cy={cy} r={rm} fill={BASE} pointerEvents="none" />}
      {rm > 0.5 && (
        <Part id="enbrioi-kanpoko-mesodermoa">
          <circle cx={cx} cy={cy} r={rm} fill={K.meso} />
          <circle cx={cx} cy={cy} r={rm} fill="url(#p-meso-extra)" stroke={K.mesoEdge} strokeWidth={1} />
        </Part>
      )}
      {(s.islands > 0.01 || s.vessels > 0.01) && (
        <Part id="biloxka-kapilarrak">
          {LUMENS.map(([deg, fr, rx, ry, rot], i) => {
            const a = (deg * Math.PI) / 180;
            const x = cx + Math.cos(a) * rc * fr;
            const y = cy + Math.sin(a) * rc * fr;
            const v = clamp((s.vessels - i * 0.06) / 0.5);
            return (
              <g key={i}>
                <Island x={x} y={y} s={s.islands * (1 - v)} seed={seed + i * 11} scale={1.15} />
                {v > 0.01 && (
                  <g transform={`rotate(${rot} ${x} ${y})`}>
                    <ellipse cx={x} cy={y} rx={lerp(3, rx, v) + 3} ry={lerp(3, ry, v) + 3} fill={K.endo} stroke="#7a2d43" strokeWidth={0.8} />
                    <ellipse cx={x} cy={y} rx={lerp(2, rx, v)} ry={lerp(2, ry, v)} fill={K.lumen} />
                    <ellipse cx={x - rx * 0.3} cy={y} rx={2.1 * v} ry={1.4 * v} fill={K.rbc} stroke={K.rbcEdge} strokeWidth={0.4} />
                    <ellipse cx={x + rx * 0.35} cy={y + ry * 0.2} rx={2 * v} ry={1.3 * v} fill={K.rbc} stroke={K.rbcEdge} strokeWidth={0.4} />
                  </g>
                )}
              </g>
            );
          })}
        </Part>
      )}
      <circle cx={cx} cy={cy} r={R} fill="url(#w3b-ball)" pointerEvents="none" />
    </g>
  );
}

/** Which section stands in each slot: the live villus moves on (primary → secondary → tertiary), leaving a snapshot behind. */
function slots(t: number) {
  const g = geometry(t);
  const toSecond = seg(t, W.meso[0], W.meso[0] + 0.035);
  const toThird = seg(t, W.islands[0], W.islands[0] + 0.035);
  const liveX = lerp(lerp(SLOTS[0], SLOTS[1], toSecond), SLOTS[2], toThird);
  const live: SecState = { meso: g.meso, islands: g.islands, vessels: g.vessels };
  return { g, liveX, live, firstLeft: toSecond > 0.001, secondLeft: toThird > 0.001 };
}

export function VilliTransverse({ t, reduced }: SceneProps) {
  const { g, liveX, live, firstLeft, secondLeft } = slots(t);
  const { ivs, lakuak } = spaceShow(t);
  const named = [1, seg(g.meso, 0.45, 0.7), seg(t, W.vessels[0], W.vessels[0] + 0.06)];
  const ids = ['biloxka-primarioa', 'biloxka-sekundarioa', 'biloxka-tertziarioa'] as const;
  const days = ['13. eguna', '3. astearen hasiera–erdia', '3. astearen amaiera'];
  // A section is "of" a type in its slot; the live one carries the current type's outline.
  const typeAt = [SLOTS[0], firstLeft ? SLOTS[1] : -1, secondLeft ? SLOTS[2] : -1];
  const ghost = [0, 1 - seg(t, W.meso[0], W.meso[0] + 0.03), 1 - seg(t, W.islands[0], W.islands[0] + 0.03)];
  const tl = { y: 448, x0: SLOTS[0], x1: SLOTS[2] };
  const head = liveX;
  const reached = [1, named[1], named[2]];
  const capShow = Math.max(g.islands, g.vessels > 0 ? 1 : 0);
  const lum = (i: number): [number, number] => {
    const [deg, fr] = LUMENS[i];
    const a = (deg * Math.PI) / 180;
    return [SLOTS[2] + Math.cos(a) * (SEC.R - SEC.ts - SEC.tc) * fr, SEC.y + Math.sin(a) * (SEC.R - SEC.ts - SEC.tc) * fr];
  };
  return (
    <g>
      <W3bDefs />
      <g mask="url(#m-slab-wide)">
        <Part id="lakuak" quiet show={lakuak}>
          <rect x={0} y={0} width={1000} height={640} fill="url(#w3b-blood)" opacity={0.62} />
        </Part>
        <Part id="biloxka-arteko-espazioa" quiet show={ivs}>
          <rect x={0} y={0} width={1000} height={640} fill="url(#w3b-blood)" opacity={0.62} />
        </Part>
        <rect x={0} y={0} width={1000} height={640} fill="url(#w3b-field)" pointerEvents="none" />
        
      </g>
      {!reduced && (
        <>
          <Flow d="M190,160 C320,140 680,180 810,150" n={7} dur={11} r={2.2} color="#e8566d" />
          <Flow d="M810,384 C680,404 320,370 190,392" n={7} dur={12} r={2.2} color="#e8566d" />
        </>
      )}

      {/* Slots still to come: a faint ghost of the section that will stand there. */}
      {[1, 2].map((i) => (
        <Destination key={i} x={SLOTS[i] - SEC.R} y={SEC.y - SEC.R} w={SEC.R * 2} h={SEC.R * 2} oval color="#8fd5a6" show={ghost[i] * 0.22} />
      ))}

      {/* Snapshots left behind, then the live villus on top. */}
      {firstLeft && <VillusSection cx={SLOTS[0]} cy={SEC.y} s={{ meso: 0, islands: 0, vessels: 0 }} seed={11} />}
      {secondLeft && <VillusSection cx={SLOTS[1]} cy={SEC.y} s={{ meso: 1, islands: 0, vessels: 0 }} seed={23} />}
      {ids.map((id, i) =>
        typeAt[i] >= 0 || i === 0 ? (
          <Part key={id} id={id} show={named[i]}>
            <circle cx={i === 0 ? SLOTS[0] : typeAt[i]} cy={SEC.y} r={SEC.R + 1.2} fill="none" stroke="#eef3ff" strokeWidth={3.6} opacity={0.3} />
          </Part>
        ) : null,
      )}
      <VillusSection cx={liveX} cy={SEC.y} s={live} seed={37} />

      {/* Timeline under the sections: milestones fill as each stage is reached. */}
      <g pointerEvents="none">
        <path d={`M${tl.x0},${tl.y}H${tl.x1}`} stroke="rgba(232,238,252,0.22)" strokeWidth={3} strokeLinecap="round" />
        <path d={`M${tl.x0},${tl.y}H${head}`} stroke="#f0c48a" strokeWidth={3} strokeLinecap="round" />
        {SLOTS.map((x, i) => (
          <circle key={x} cx={x} cy={tl.y} r={6} fill={reached[i] > 0.5 ? '#f0c48a' : '#1a2132'} stroke="#f0c48a" strokeWidth={1.6} opacity={0.5 + 0.5 * Math.max(reached[i], i === 0 ? 1 : 0)} />
        ))}
        <circle cx={head} cy={tl.y} r={3} fill="#fff" />
      </g>

      {ids.map((id, i) => (
        <Label key={id} id={id} x={SLOTS[i]} y={SEC.y + SEC.R + 30} align="middle" show={named[i]} />
      ))}
      {days.map((d, i) => (
        <Note key={d} x={SLOTS[i]} y={tl.y + 24} show={Math.max(0.35, named[i])}>
          {d}
        </Note>
      ))}
      <Label id="sinzitiotrofoblastoa" x={190} y={162} ax={SLOTS[0] - (SEC.R - SEC.ts / 2) * 0.7071} ay={SEC.y - (SEC.R - SEC.ts / 2) * 0.7071} />
      <Label id="zitotrofoblastoa" x={190} y={350} ax={SLOTS[0] + Math.cos((140 * Math.PI) / 180) * (SEC.R - SEC.ts - SEC.tc / 2)} ay={SEC.y + Math.sin((140 * Math.PI) / 180) * (SEC.R - SEC.ts - SEC.tc / 2)} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={500} y={134} ax={SLOTS[1]} ay={SEC.y - 14} align="middle" show={firstLeft ? clamp((g.meso - 0.35) / 0.15) : 0} text="Kanpoko mesodermoa" />
      <Label id="biloxka-kapilarrak" x={810} y={372} ax={lum(2)[0]} ay={lum(2)[1]} show={secondLeft ? capShow : 0} text="Biloxka kapilarrak" />
      <Label id="lakuak" x={810} y={520} ax={792} ay={500} small show={lakuak} />
      <Label id="biloxka-arteko-espazioa" x={810} y={546} ax={792} ay={512} small show={ivs} />
      <Note x={500} y={590} tone="accent" show={seg(t, 0.84, 0.9)}>
        Kanpoko bi geruzak berdinak dira hiruretan: erdigunea da aldatzen dena
      </Note>
    </g>
  );
}
