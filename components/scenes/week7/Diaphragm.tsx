'use client';

import { useId } from 'react';
import { Arrow, C, Label, Mark, Note, Part, clamp, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { CavityKey, Defs7, KEY7, P, Sheet, f1, offset, poly, resample, sm, spline, vis } from './common';
import { COELOM_ALL, SideEmbryo, backAt, placeXY, type Place, type SideState } from './SideEmbryo';

/**
 * 7:diafragma-eraketa — apunteen 3. atala eta 3.1en hasiera, 25.–26. orriko irudiak.
 *  - `jaitsiera` (albotik, bizkarrezurra eskuinean): septum transversuma C3–C5 mailan; haren mesenkiman
 *    mioblastoak → miozitoak; C3–C5 nerbio espinalen zuntzak iristen dira eta nerbio frenikoa osatzen dute;
 *    enbrioia atzetik gehiago hazten denez septuma jaisten da (aurrea T6, atzea T12) eta nerbioa luzatzen da.
 *  - `zeharkakoa` (diafragmaren mailako zeharkako mozketa, dortsala goian): erreten perikardioperitonealak
 *    zabalik; 5. astean mintz pleuroperitonealak atze-alboko paretetatik hazten dira eta hestegorri inguruko
 *    mesenkimarekin eta septumaren atzeko ertzarekin fusionatzen dira; gorputz paretako muskulua ertzean.
 */

// ——— Side view: topic 5's day-32 embryo, the vertebral column a ruler along its back ———

const LEVELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3'];
const iOf = (name: string) => LEVELS.indexOf(name);
/** Sacral and coccygeal levels below L3, running on into the tail (no names). */
const ALL_LEVELS = LEVELS.length + 6;
/** Only the levels the notes name: C3–C5 where the septum forms (4th week), T6 in front and T12 behind at the end of the 5th. */
const EARLY = ['C3', 'C4', 'C5'];
const LATE = ['T6', 'T12'];
/** Above this bead the back is the head's (no vertebrae): the levels that slide up there fade out. */
const NECK = 7.5;

/** The embryo in the frame: left of centre, so the level tags and the descent arrows fit behind its back. */
const PLACE: Place = { dx: -62, dy: 6, s: 1.04 };
const A = placeXY(PLACE);
/** Bead k (0..35) along the back, where topic 5 draws its somites; d = depth in from the dorsal skin. */
const bead = (k: number, d = 0) => backAt(0.06 + (0.9 * k) / 35, d);
/**
 * The back grows much more than the front, so the column's levels slide past the septum: level L sits at
 * bead L + off(s). At 4 weeks (s = 0) C4 faces the septum; at the end of the 5th week T6 faces its ventral
 * end and T12 its dorsal end.
 */
const offAt = (s: number) => lerp(12, 1, s);
const kOf = (name: string, s: number) => iOf(name) + offAt(s);
/** The septum's ventral end stays on the ventral wall under the heart; its dorsal end is pulled caudally to T12. */
const VENTRAL: Pt = [544, 388];
const dorsalEnd = (s: number): Pt => {
  const b = bead(kOf('T12', 1), 40).p;
  return [lerp(668, b[0], s), lerp(378, b[1], s)];
};
interface Plate {
  s: number;
  D: Pt;
  dir: Pt;
  up: Pt;
  len: number;
  angle: number;
  /** Point on the plate: u 0 (ventral end) → 1 (dorsal end), v −1 (cranial surface) → 1 (caudal surface). */
  on: (u: number, v: number) => Pt;
}
function plateAt(s: number): Plate {
  const D = dorsalEnd(s);
  const len = Math.hypot(D[0] - VENTRAL[0], D[1] - VENTRAL[1]);
  const dir: Pt = [(D[0] - VENTRAL[0]) / len, (D[1] - VENTRAL[1]) / len];
  const up: Pt = [dir[1], -dir[0]];
  const on = (u: number, v: number): Pt => {
    // Rounded ends (a thick mesenchymal mass, not a cut bar); it domes a little as it descends.
    const e = Math.max(0, Math.abs(u - 0.5) - 0.44) / 0.06;
    const lift = 9 * Math.sin(Math.PI * u) * s - v * 10 * Math.sqrt(Math.max(0, 1 - e * e));
    return [VENTRAL[0] + dir[0] * len * u + up[0] * lift, VENTRAL[1] + dir[1] * len * u + up[1] * lift];
  };
  return { s, D, dir, up, len, angle: (Math.atan2(dir[1], dir[0]) * 180) / Math.PI, on };
}
const platePoly = (pl: Plate) => {
  const us = Array.from({ length: 61 }, (_, i) => i / 60);
  return [...us.map((u) => pl.on(u, -1)), ...[...us].reverse().map((u) => pl.on(u, 1))];
};

/** Muscle precursors in the septum: (u along, v across), when they appear and when they become myocytes. */
const CELLS = Array.from({ length: 18 }, (_, i) => {
  const u = 0.1 + 0.8 * ((i * 0.618 + 0.11) % 1);
  const v = (((i * 0.383) % 1) - 0.5) * 1.1;
  const born = 0.14 + 0.045 * ((i * 0.71) % 1);
  const turn = i % 2 === 0 ? 0.2 + 0.025 * ((i * 0.29) % 1) : 0.36 + 0.045 * ((i * 0.53) % 1);
  return { u, v, born, turn };
});

const ptsD = (pts: readonly Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
const along = (pts: Pt[], u: number): Pt => resample(pts, 101)[Math.round(u * 100)];
/** An arrow along the back (outside the skin), bead k0 → k1, `d` outside, with its head. */
function backArrow(k0: number, k1: number, d: number) {
  const n = Math.max(2, Math.round((k1 - k0) * 2));
  const pts = Array.from({ length: n + 1 }, (_, i) => A(bead(lerp(k0, k1, i / n), -d).p));
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / L;
  const uy = (b[1] - a[1]) / L;
  const head = `M${f1(b[0] + ux * 7)},${f1(b[1] + uy * 7)}L${f1(b[0] - uy * 6)},${f1(b[1] + ux * 6)}L${f1(b[0] + uy * 6)},${f1(b[1] - ux * 6)}Z`;
  return { line: ptsD(pts.slice(0, -1).concat([[b[0] - ux * 2, b[1] - uy * 2]])), head };
}

// ——— The right column: names in the anchors' order, their leaders clear of the level tags and the arrows ———

/** A name in the right column: its anchor, how visible, small type. */
interface Item {
  id: string;
  a: Pt;
  show?: number;
  small?: boolean;
}
/** A box no leader may pass through (a level tag, a descent arrow). */
interface Band {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
/** The box round a level tag (a Note centred on x, y), with room for its halo. */
const tagBand = (x: number, y: number): Band => ({ x0: x - 17, x1: x + 17, y0: y - 12, y1: y + 12 });
/** Where a right-column leader is at x: the Label's plate edge (lx) → horizontal to the elbow (35 %) → the anchor. */
function leaderY(y: number, a: Pt, x: number, lx: number) {
  const ex = lx + (a[0] - lx) * 0.35;
  if (x >= ex) return y;
  if (x <= a[0]) return null;
  return y + ((a[1] - y) * (ex - x)) / (ex - a[0]);
}
const crosses = (y: number, a: Pt, bands: Band[], lx: number) =>
  bands.some((b) =>
    Array.from({ length: 9 }, (_, i) => b.x0 + ((b.x1 - b.x0) * i) / 8).some((x) => {
      const ly = leaderY(y, a, x, lx);
      return ly !== null && ly > b.y0 && ly < b.y1;
    }),
  );
const cut = (p: Pt, q: Pt, r: Pt, s: Pt) => {
  const d = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return d(p, q, r) * d(p, q, s) < 0 && d(r, s, p) * d(r, s, q) < 0;
};
/** How many pairs of right-column leaders cross. */
function crossings(out: { y: number; a: Pt }[], lx: number) {
  const legs = out.map((r) => {
    const ex = lx + (r.a[0] - lx) * 0.35;
    return [[lx, r.y], [ex, r.y], r.a] as Pt[];
  });
  let n = 0;
  for (let i = 0; i < legs.length; i++)
    for (let j = i + 1; j < legs.length; j++)
      if ([0, 1].some((a) => [0, 1].some((b) => cut(legs[i][a], legs[i][a + 1], legs[j][b], legs[j][b + 1])))) n++;
  return n;
}
/**
 * The names follow their anchors down the column, in an order whose leaders do not cross (anchors further from
 * the column come first at about the same height: their leaders pass over the nearer anchors), each clear of the
 * bands. The names keep these places (noArrange): the view's label layer would not know the bands.
 */
function column(items: Item[], top = 64, bottom = 560, gap = 34, x = 790, bands: Band[] = []) {
  const lx = x - 6;
  let best: ReturnType<typeof columnAt> = [];
  let bestN = Infinity;
  const live = items.filter((r) => (r.show ?? 1) > 0);
  const score = (order: Item[]) => {
    const out = columnAt(order, top, bottom, gap, x, bands);
    return { out, n: crossings(out, lx) * 10 + out.filter((r) => crosses(r.y, r.a, bands, lx)).length };
  };
  for (const f of [0.5, 0.3, 0.15, 0, 0.75]) {
    let order = [...live].sort((p, q) => p.a[1] + f * (p.a[0] - x) - (q.a[1] + f * (q.a[0] - x)));
    let cur = score(order);
    // Neighbours trade places while that untangles more leaders.
    for (let pass = 0; pass < 4 && cur.n > 0; pass++)
      for (let i = 0; i + 1 < order.length; i++) {
        const o = [...order];
        [o[i], o[i + 1]] = [o[i + 1], o[i]];
        const c = score(o);
        if (c.n < cur.n) [order, cur] = [o, c];
      }
    if (cur.n < bestN) [best, bestN] = [cur.out, cur.n];
    if (bestN === 0) break;
  }
  return best;
}
function columnAt(order: Item[], top: number, bottom: number, gap: number, x: number, bands: Band[]) {
  const out = order.map((r) => ({ ...r, y: 0 }));
  const lx = x - 6;
  // A name's right end (the rules' estimate): long ones keep out of the orientation pill and the toolbar.
  const ok = (r: Item, y: number) => {
    const x1 = x + r.id.length * (r.small ? 6.4 : 7.1);
    if (x1 > 891 && y > 290 && y < 352) return false;
    if (x1 > 932 && y < 232) return false;
    return !crosses(y, r.a, bands, lx);
  };
  // The nearest height at or below `from` (or, failing that, above it down to `floor`) that is clear.
  const clear = (r: Item, from: number, floor: number, ceil: number) => {
    for (let d = 0; d <= 240; d += 2) {
      if (from + d <= ceil && ok(r, from + d)) return from + d;
      if (from - d >= floor && ok(r, from - d)) return from - d;
    }
    return from;
  };
  out.forEach((r, i) => {
    const floor = i ? out[i - 1].y + gap : top;
    r.y = clear(r, Math.max(r.a[1], floor), floor, bottom);
  });
  // Too low at the bottom: pushed back up, each still clear of the bands where it can be.
  for (let i = out.length - 1; i >= 0; i--) {
    const ceil = i === out.length - 1 ? bottom : out[i + 1].y - gap;
    if (out[i].y > ceil) out[i].y = clear(out[i], ceil, i ? out[i - 1].y + gap : top, ceil);
  }
  return out;
}

/** Inside the pericardial cavity (dorsal to the heart, clear of it) and on the heart's tube, in the embryo's coordinates. */
const PERI_AT: Pt = [626, 336];
const HEART_AT: Pt = [590, 330];

export function DiaphragmDescent({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const mb = seg(t, 0.14, 0.2);
  const mz = seg(t, 0.2, 0.23);
  const late = seg(t, 0.36, 0.42);
  const n = seg(t, 0.3, 0.4);
  const s = sm(seg(t, 0.47, 0.6));
  const pl = plateAt(s);
  const { D, dir, up } = pl;
  const off = offAt(s);
  // Above the septum the primitive pericardial cavity, below it the peritoneal cavity (one coelom, split along the plate).
  const far = (p: Pt, k: number): Pt => [p[0] + dir[0] * k, p[1] + dir[1] * k];
  const P1 = far(VENTRAL, -400);
  const P2 = far(D, 400);
  const lift = (p: Pt, k: number): Pt => [p[0] + up[0] * k, p[1] + up[1] * k];
  const upper = poly([P1, P2, lift(P2, 1200), lift(P1, 1200)]);
  const lower = poly([P1, P2, lift(P2, -1200), lift(P1, -1200)]);
  const coelom = smoothPath(COELOM_ALL, true, 0.42);
  // The oesophagus down the back, through the septum's dorsal part, to the stomach just under it.
  const stomach = lift(far(D, -6), -20);
  const ESO = spline([[664, 222], [671, 272], [686, 334], [lerp(683, 688, s), lerp(362, 420, s)], far(D, 6), lift(stomach, 12)], 8);
  const liver = lift(pl.on(0.3, 1), -lerp(16, 22, s));
  // Spinal nerves C3–C5 leave the cord between the vertebrae, join into the phrenic nerve, which enters the septum's cranial surface.
  // The roots leave the neck: as the levels slide cranially they stop at the neck (never on the head).
  const rootK = (j: number) => Math.max(kOf(EARLY[j], s) + 0.5, NECK + j);
  const kJ = lerp(rootK(1) - 0.9, rootK(2) + 1.2, s);
  const J = bead(kJ, 40).p;
  const E = pl.on(0.7, -1);
  const roots = [0, 1, 2].map((j) => {
    const k = rootK(j);
    return spline([bead(k, 6).p, bead(k, 24).p, bead(lerp(k, kJ, 0.6), 34).p, J], 8);
  });
  const mids = [1, 2, 3, 4].map((i) => bead(lerp(kJ, Math.max(kJ, 13.5), i / 5), 42).p);
  const trunk = spline([J, ...mids, [lerp(bead(14, 42).p[0], E[0], 0.5) + 10, lerp(bead(14, 42).p[1], E[1], 0.4)], E], 8);
  const branches = [0.3, 0.5, 0.88].map((u) => spline([E, pl.on((u + 0.7) / 2, -0.4), pl.on(u, 0.2)], 6));
  const cut = (pts: Pt[], k: number) => resample(pts, 40).slice(0, Math.max(2, Math.round(40 * k)));
  const impulsePath = ptsD([...roots[1], ...trunk.slice(1)]);
  const st: SideState = { upper: P.periSolid, lower: P.peritoSolid, side: P.periSolid, sep: 0, canal: 0, lung: 0, ppm: 0, pom: 0, ids: { upper: 'hasierako-perikardio-barrunbea', lower: 'peritoneo-barrunbea', canal: 'erreten-perikardioperitonealak', gut: 'hestegorria' } };
  const cellAt = (c: (typeof CELLS)[number]) => pl.on(c.u, c.v * 0.75);
  const levels = Array.from({ length: ALL_LEVELS }, (_, i) => ({ i, l: LEVELS[i] ?? '', k: i + off })).filter((q) => q.k <= 35.4);
  // The tags: C3–C5 while the septum faces them, fading before they would leave the neck; T6 and T12 at the end.
  const early = 1 - seg(s, 0.25, 0.5);
  const lateOn = seg(s, 0.6, 0.9);
  const goldOf = (l: string) => (EARLY.includes(l) ? early : LATE.includes(l) ? lateOn : 0);
  // Short gold arrows just outside the back, down to the level each end of the septum reached.
  const arrowsOn = vis(t, 0.5) * lateOn;
  const front = backArrow(kOf('T6', s) - 1.8, kOf('T6', s) - 0.4, 10);
  const back = backArrow(kOf('T12', s) - 1.8, kOf('T12', s) - 0.4, 10);
  const tagAt = (k: number) => A(bead(k, -26).p);
  const tags = [...EARLY.map((l) => ({ l, show: early })), ...LATE.map((l) => ({ l, show: lateOn }))]
    .filter((q) => q.show > 0.02)
    .map((q) => {
      const p = tagAt(kOf(q.l, s) - (LATE.includes(q.l) ? 1.1 : 0));
      return { ...q, x: p[0] + 4, y: p[1] };
    });
  // No leader runs through a tag or an arrow.
  const arrowBand = (k0: number, k1: number): Band => {
    const ps = [k0, (k0 + k1) / 2, k1].map((k) => A(bead(k, -10).p));
    return { x0: Math.min(...ps.map((q) => q[0])) - 9, x1: Math.max(...ps.map((q) => q[0])) + 9, y0: Math.min(...ps.map((q) => q[1])) - 9, y1: Math.max(...ps.map((q) => q[1])) + 9 };
  };
  const bands: Band[] = [
    ...tags.map((q) => tagBand(q.x, q.y)),
    ...(arrowsOn > 0.02 ? [arrowBand(kOf('T6', s) - 1.8, kOf('T6', s) + 0.2), arrowBand(kOf('T12', s) - 1.8, kOf('T12', s) + 0.2)] : []),
  ];
  const at = (p: Pt) => A(p);
  const cord = (k: number) => A(bead(k, 6).p);
  // The plate's name level with its ventral end; a myoblast on its cranial surface, a myocyte on its caudal one.
  const sepA = at(pl.on(0.08, 0));
  const sepY = sepA[1];
  const pick = (odd: boolean, top: boolean) => CELLS.filter((c, i) => i % 2 === (odd ? 1 : 0) && (top ? c.v < -0.1 : c.v > 0.1)).sort((p, q) => p.u - q.u)[0];
  const mbCell = pick(true, true);
  const mzCell = pick(false, false);
  // The right column follows its anchors down the back (the nerve roots climb the neck as the back grows): names in
  // the order of their anchors, never crossing, clear of the level tags and the arrows. The heart and the pericardial
  // cavity are named from the dorsal side too: from the ventral side the face is in the way.
  const right = column(
    [
      { id: 'hasierako-perikardio-barrunbea', a: at(PERI_AT), small: true },
      { id: 'bihotza', a: at(HEART_AT), small: true },
      { id: 'hodi-neurala', a: cord(10.5), small: true },
      // A vertebra between the tagged levels, so its name never sits on a tag.
      { id: 'ornoak', a: A(bead(kOf('T9', s), 19).p), small: true },
      { id: 'hestegorria', a: at([677, 304]), small: true },
      { id: 'lepoko-nerbio-espinalak', a: at(along(roots[1], 0.75)), show: n > 0.01 ? 1 : 0 },
      { id: 'nerbio-frenikoa', a: at(along(trunk, 0.62)), show: seg(n, 0.6, 1) },
      { id: 'urdaila', a: [at(stomach)[0] + 6, at(stomach)[1]] as Pt, small: true },
    ],
    64,
    612,
    34,
    800,
    bands,
  );

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id={`w7-desc-up${cid}`}>
          <path d={upper} />
        </clipPath>
        <clipPath id={`w7-desc-dn${cid}`}>
          <path d={lower} />
        </clipPath>
        <radialGradient id={`w7-desc-vol${cid}`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </radialGradient>
        <radialGradient id={`w7-desc-liver${cid}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#b2524a" />
          <stop offset="1" stopColor="#6d2622" />
        </radialGradient>
      </defs>

      <SideEmbryo
        st={st}
        place={PLACE}
        cavities={false}
        septum={false}
        gut={false}
        meso={0}
        hideSomites
        beating={!reduced}
        reduced={reduced}
        under={
          <>
            {/* The coelom, split by the septum's line: the primitive pericardial cavity above, the peritoneal cavity below. */}
            <path d={coelom} fill={P.space} opacity={0.55} pointerEvents="none" />
            <Part id="hasierako-perikardio-barrunbea">
              <path d={coelom} fill={P.periSolid} opacity={0.62} clipPath={`url(#w7-desc-up${cid})`} />
            </Part>
            <Part id="peritoneo-barrunbea">
              <path d={coelom} fill={P.peritoSolid} opacity={0.62} clipPath={`url(#w7-desc-dn${cid})`} />
            </Part>
            <path d={coelom} fill={`url(#w7-desc-vol${cid})`} pointerEvents="none" />
            <path d={coelom} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.4} pointerEvents="none" />

            {/* The vertebral column, faint, a ruler along the back; the levels named by the tags are gold. */}
            <Part id="ornoak" quiet>
              {levels.map(({ i, l, k }) => {
                const head = clamp((k - NECK + 1.5) / 1.5);
                if (head <= 0.01) return null;
                const q = bead(k, 19);
                const ang = (Math.atan2(q.t[1], q.t[0]) * 180) / Math.PI;
                const gold = goldOf(l);
                const tail = Math.max(0, i - LEVELS.length + 1);
                const box = {
                  x: f1(q.p[0] - 6.5 + tail * 0.4),
                  y: f1(q.p[1] - 8 + tail * 0.4),
                  width: f1(13 - tail * 0.8),
                  height: f1(16 - tail * 0.8),
                  rx: 4,
                  transform: `rotate(${f1(ang + 90)} ${f1(q.p[0])} ${f1(q.p[1])})`,
                  strokeWidth: 1,
                };
                return (
                  <g key={i} opacity={head}>
                    <rect {...box} fill={P.bone} stroke="#6b6350" opacity={l ? 0.42 : 0.3 - tail * 0.03} />
                    {gold > 0.01 && <rect {...box} fill="#f6d27a" stroke="#8a6418" opacity={0.95 * gold} />}
                  </g>
                );
              })}
            </Part>
            {/* A spinal nerve at each level (faint), the cervical ones drawn in full below. */}
            <g stroke={P.nerve} strokeWidth={1.3} opacity={0.26} pointerEvents="none">
              {levels.map(({ i, k }) =>
                k < NECK || [0, 1, 2].some((j) => Math.abs(k + 0.5 - rootK(j)) < 0.6) ? null : <path key={i} d={ptsD([bead(k + 0.5, 6).p, bead(k + 0.5, 30).p])} />,
              )}
            </g>

            {/* The oesophagus, the stomach under the septum's dorsal part, the liver in its ventral part. */}
            <Part id="hestegorria">
              <path d={smoothPath(ESO, false, 0.3)} fill="none" stroke="#8a6a1e" strokeWidth={10} strokeLinecap="round" />
              <path d={smoothPath(ESO, false, 0.3)} fill="none" stroke={P.gut} strokeWidth={6.5} strokeLinecap="round" />
            </Part>
            <Part id="urdaila">
              <ellipse cx={f1(stomach[0])} cy={f1(stomach[1])} rx={11} ry={15} transform={`rotate(${f1(pl.angle - 30)} ${f1(stomach[0])} ${f1(stomach[1])})`} fill={P.gut} stroke="#8a6a1e" strokeWidth={1.6} />
              <ellipse cx={f1(stomach[0] - 2)} cy={f1(stomach[1] - 4)} rx={3.5} ry={6} transform={`rotate(${f1(pl.angle - 30)} ${f1(stomach[0])} ${f1(stomach[1])})`} fill="#fff6d8" opacity={0.45} />
            </Part>
            <Part id="gibela" quiet>
              <ellipse cx={f1(liver[0])} cy={f1(liver[1])} rx={lerp(22, 30, s)} ry={lerp(11, 15, s)} transform={`rotate(${f1(pl.angle)} ${f1(liver[0])} ${f1(liver[1])})`} fill={`url(#w7-desc-liver${cid})`} stroke="#4d1714" strokeWidth={1.3} />
            </Part>

            {/* The septum transversum: mesenchyme in which the muscle cells differentiate. */}
            <Part id="septum-transversum">
              <path d={smoothPath(platePoly(pl), true, 0.25)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
              <path d={smoothPath(platePoly(pl), true, 0.25)} fill={`url(#w7-desc-vol${cid})`} />
            </Part>
          </>
        }
      >
        <Part id="mioblastoak" show={mb * (1 - late)}>
          {CELLS.map((c, i) => {
            const pop = seg(t, c.born, c.born + 0.03);
            const k = seg(t, c.turn, c.turn + 0.03);
            if (pop <= 0.01 || k >= 0.5) return null;
            const q = cellAt(c);
            return (
              <g key={i}>
                <ellipse cx={f1(q[0])} cy={f1(q[1])} rx={lerp(3.6, 6, k * 2) * pop} ry={lerp(3.6, 3, k * 2) * pop} transform={`rotate(${f1(pl.angle)} ${f1(q[0])} ${f1(q[1])})`} fill="#ff8a8a" stroke="#8e1b2e" strokeWidth={0.9} />
                <circle cx={f1(q[0])} cy={f1(q[1])} r={1.4 * pop} fill="#7a1020" />
              </g>
            );
          })}
        </Part>
        <Part id="miozitoak" show={mz}>
          {CELLS.map((c, i) => {
            const k = seg(t, c.turn, c.turn + 0.03);
            if (k < 0.5) return null;
            const q = cellAt(c);
            const rx = lerp(6, 9.5, (k - 0.5) * 2);
            return (
              <g key={i} transform={`rotate(${f1(pl.angle)} ${f1(q[0])} ${f1(q[1])})`}>
                <ellipse cx={f1(q[0])} cy={f1(q[1])} rx={rx} ry={2.8} fill="#e0566f" stroke="#7a0f1e" strokeWidth={0.8} />
                {[-0.5, -0.17, 0.17, 0.5].map((d) => (
                  <line key={d} x1={f1(q[0] + d * rx * 1.4)} y1={f1(q[1] - 2.1)} x2={f1(q[0] + d * rx * 1.4)} y2={f1(q[1] + 2.1)} stroke="#ffc2cc" strokeWidth={0.6} opacity={0.7} />
                ))}
              </g>
            );
          })}
        </Part>
        {/* Nerve fibres: C3–C5 → phrenic nerve; it is stretched as the levels slide past the septum. */}
        <Part id="lepoko-nerbio-espinalak" show={n > 0.01 ? 1 : 0}>
          {roots.map((r, i) => (
            <path key={i} d={ptsD(cut(r, Math.min(1, n * 2)))} fill="none" stroke={P.nerve} strokeWidth={2.2} strokeLinecap="round" />
          ))}
        </Part>
        <Part id="nerbio-frenikoa" show={n > 0.5 ? 1 : 0}>
          <path d={ptsD(cut(trunk, seg(n, 0.5, 1)))} fill="none" stroke="rgba(60,40,0,0.6)" strokeWidth={4.6} strokeLinecap="round" />
          <path d={ptsD(cut(trunk, seg(n, 0.5, 1)))} fill="none" stroke={P.nerve} strokeWidth={2.8} strokeLinecap="round" />
          {n > 0.98 && branches.map((b, i) => <path key={i} d={ptsD(b)} fill="none" stroke={P.nerve} strokeWidth={1.4} opacity={0.85} strokeLinecap="round" />)}
        </Part>
        {n > 0.99 && !reduced && (
          <g pointerEvents="none">
            {[0, 1, 2].map((k) => (
              <circle key={k} r={2.8} fill="#fff6c2">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin={`${(-k * 0.5).toFixed(1)}s`} path={impulsePath} />
              </circle>
            ))}
          </g>
        )}
      </SideEmbryo>

      {/* How far each edge went against the column: the front to T6, the back much further, to T12. */}
      <g opacity={arrowsOn} pointerEvents="none">
        {[front, back].map((a, i) => (
          <g key={i}>
            <path d={a.line} fill="none" stroke="#fbbf24" strokeWidth={2.4} strokeLinecap="round" />
            <path d={a.head} fill="#fbbf24" />
          </g>
        ))}
      </g>
      <Note x={at(liver)[0]} y={at(liver)[1] + 4} size={11.5} tone="dim">
        gibela
      </Note>
      {tags.map((q) => (
        <Note key={q.l} x={q.x} y={q.y} size={12} tone="accent" show={q.show}>
          {q.l}
        </Note>
      ))}
      <CavityKey rows={[KEY7.hperi, KEY7.perito, KEY7.septum]} />
      <Note x={250} y={52} size={12.5}>
        aurrea (bentrala)
      </Note>
      <Note x={720} y={52} size={12.5}>
        atzea (dortsala)
      </Note>
      <Note x={880} y={26} size={13} tone="accent">
        {s < 0.5 ? '4. astea' : '5. astearen bukaera'}
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0, 0.14)}>
        Diafragma: torax eta abdomenaren arteko trenkada muskulu-aponeurotikoa, kupula itxurakoa
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.14, 0.3)}>
        C3–C5 mailan: mesenkiman mioblastoak → miozitoak
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.3, 0.46)}>
        C3, C4 eta C5 nerbio espinalen zuntzak elkartu: nerbio frenikoa
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.46)}>
        Atzea gehiago hazten da: septuma aurrean T6, atzean T12 mailara; nerbio frenikoa luzatzen da
      </Note>

      {/* The plate and its cells: the cells' names above and below the plate's, their leaders to the upper and lower surface. */}
      <Label id="mioblastoak" x={190} y={sepY - 38} ax={at(cellAt(mbCell))[0]} ay={at(cellAt(mbCell))[1]} show={mb * (1 - late)} />
      <Label id="septum-transversum" x={190} y={sepY} ax={sepA[0]} ay={sepA[1]} />
      <Label id="miozitoak" x={190} y={sepY + 38} ax={at(cellAt(mzCell))[0]} ay={at(cellAt(mzCell))[1]} show={mz} />
      <Label id="peritoneo-barrunbea" x={190} y={540} ax={at([522, 470])[0]} ay={at([522, 470])[1]} small />
      {right.map((r) => (
        <Label key={r.id} id={r.id} x={800} y={r.y} ax={r.a[0]} ay={r.a[1]} show={r.show} small={r.small} noArrange />
      ))}
    </g>
  );
}

// ——— Transverse section at the level of the diaphragm (dorsal at the top) ———

export const BODY_X = spline(
  [[500, 50], [640, 62], [742, 116], [792, 214], [798, 330], [774, 440], [706, 530], [604, 580], [500, 590], [396, 580], [294, 530], [226, 440], [202, 330], [208, 214], [258, 116], [360, 62]],
  8,
  true,
);
export const CAV_X = spline(
  [[500, 228], [430, 214], [360, 202], [300, 228], [264, 292], [252, 372], [276, 462], [336, 532], [420, 566], [500, 574], [580, 566], [664, 532], [724, 462], [748, 372], [736, 292], [700, 228], [640, 202], [570, 214]],
  8,
  true,
);
export const SEPT_EDGE: Pt[] = [[250, 396], [300, 356], [370, 334], [440, 342], [500, 354], [560, 342], [630, 334], [700, 356], [750, 396]];
export const SEPTUM_X = [...spline(SEPT_EDGE, 8), ...spline([[750, 396], [724, 466], [664, 534], [580, 568], [500, 576], [420, 568], [336, 534], [276, 466], [250, 396]], 8)];
export const MES = spline([[468, 222], [532, 222], [540, 262], [556, 300], [552, 340], [500, 356], [448, 340], [446, 300], [460, 262]], 8, true);
export const ESO_X: Pt = [520, 296];
export const IVC_X: Pt = [462, 378];
export const AORTA_X: Pt = [500, 196];
/** Generous outline of the left canal (clipped to the cavity; the septum and the mesentery cover the rest). */
export const CANAL_L = spline([[472, 186], [300, 176], [226, 250], [222, 430], [320, 384], [440, 352], [450, 300], [462, 246]], 6, true);
const FOCUS_L: Pt = [432, 336];
const CANAL_MID: Pt = [334, 272];
const mx = (p: Pt): Pt => [1000 - p[0], p[1]];

export function DiaphragmSection({ t, reduced }: SceneProps) {
  const c = seg(t, 0.74, 0.84);
  const mus = seg(t, 0.88, 0.95);
  const rim = lerp(0, 30, mus);
  const inner = offset(CAV_X, rim, true);
  const canalsOpen = 1 - seg(c, 0.85, 1);
  // The membrane grows from the posterolateral wall towards the middle: its free edge sweeps medially across the canal.
  const front = lerp(212, 476, Math.pow(c, 0.85));
  const cid = useId().replace(/:/g, '');
  const migrate = vis(t, 0.88);

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="gorputz-pareta" quiet>
        <path d={poly(BODY_X)} fill={P.wall} />
        <path d={poly(BODY_X)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY_X} inner={offset(BODY_X, -9, true)} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={11} />
      </Part>
      {/* The body wall's own muscle layer, under the skin: later it adds the diaphragm's outer rim. */}
      <defs>
        <linearGradient id={`w7-dia-wallfade${cid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.22" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.4" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
        <mask id={`w7-dia-wall${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={0} y={0} width={1000} height={640} fill={`url(#w7-dia-wallfade${cid})`} />
        </mask>
        <radialGradient id={`w7-dia-hole${cid}`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#05070c" stopOpacity={0.95} />
          <stop offset="0.7" stopColor="#0d1824" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7fc8e8" stopOpacity={0.25} />
        </radialGradient>
        <radialGradient id={`w7-dia-dome${cid}`} cx="0.5" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </radialGradient>
      </defs>
      <Part id="gorputz-paretako-mesodermoa" quiet>
        <g mask={`url(#w7-dia-wall${cid})`}>
          <path d={`${poly(offset(BODY_X, -12, true))}${poly([...offset(BODY_X, -32, true)].reverse())}`} fill={P.bodyMuscle} opacity={0.45} fillRule="evenodd" />
          <path d={`${poly(offset(BODY_X, -12, true))}${poly([...offset(BODY_X, -32, true)].reverse())}`} fill="url(#w7-muscle)" opacity={0.6} fillRule="evenodd" />
        </g>
      </Part>
      {/* The back: muscle masses from the somites either side, the spinal cord in its forming vertebra. */}
      <Part id="somitak" quiet>
        {[1, -1].map((k) => (
          <g key={k}>
            <ellipse cx={500 + k * 72} cy={116} rx={40} ry={30} fill="#6e2a40" opacity={0.75} />
            <ellipse cx={500 + k * 72} cy={116} rx={40} ry={30} fill="url(#w7-muscle)" opacity={0.45} />
          </g>
        ))}
      </Part>
      <Part id="ornoak" quiet>
        <path d="M466,150 C458,112 470,70 500,62 C530,70 542,112 534,150" fill="none" stroke={P.bone} strokeWidth={9} strokeLinecap="round" opacity={0.7} />
        <ellipse cx={500} cy={158} rx={36} ry={20} fill={P.bone} opacity={0.9} />
        <ellipse cx={500} cy={158} rx={36} ry={20} fill="url(#w7-light)" />
        <circle cx={500} cy={158} r={4.5} fill="#dfe9ff" stroke="#9fb2d8" strokeWidth={1} />
      </Part>
      <Part id="hodi-neurala">
        <ellipse cx={500} cy={100} rx={26} ry={32} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <path d="M486,86 C494,96 494,104 486,114 M514,86 C506,96 506,104 514,114" fill="none" stroke="#c4cdf7" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
        <ellipse cx={500} cy={100} rx={3} ry={9} fill="#0c1428" />
      </Part>
      <Part id="aorta">
        <circle cx={AORTA_X[0]} cy={AORTA_X[1]} r={15} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.4} />
        <circle cx={AORTA_X[0]} cy={AORTA_X[1]} r={9} fill="#9e1228" />
        <circle cx={AORTA_X[0] - 4} cy={AORTA_X[1] - 5} r={3.5} fill="#ff8a9a" opacity={0.55} />
      </Part>

      {/* Open cavity between the septum and the mesentery: the canals' way through until the membranes fill it. */}
      {/* Once the membranes have closed them there are no canals: the space under the membranes is no longer one. */}
      {canalsOpen > 0.5 ? (
        <Part id="erreten-perikardioperitonealak">
          <path d={poly(CAV_X)} fill={P.space} />
        </Part>
      ) : (
        <path d={poly(CAV_X)} fill={P.space} pointerEvents="none" />
      )}
      <clipPath id="w7-dia-cav">
        <path d={poly(CAV_X)} />
      </clipPath>

      {/* Canals (dorsolateral openings) closed by the pleuroperitoneal membranes from the posterolateral wall. */}
      <Part id="mintz-pleuroperitonealak" show={seg(t, 0.72, 0.76)}>
        <path d={poly(CAV_X)} fill={P.poMem} />
        <path d={poly(CAV_X)} fill="url(#w7-mesench)" />
      </Part>
      <defs>
        <clipPath id={`w7-dia-open${cid}`}>
          <rect x={front} y={0} width={1000 - 2 * front} height={640} />
        </clipPath>
      </defs>
      <Part id="erreten-perikardioperitonealak" show={canalsOpen}>
        {[CANAL_L, CANAL_L.map(mx)].map((pts, i) => (
          <g key={i} clipPath="url(#w7-dia-cav)">
            <g clipPath={`url(#w7-dia-open${cid})`}>
              <path d={smoothPath(pts, true, 0.3)} fill={P.space} />
              <path d={smoothPath(pts, true, 0.3)} fill={P.canal} />
              {/* Looking up the open canal: a deep passage towards the cavity above. */}
              <path d={smoothPath(pts, true, 0.3)} fill={`url(#w7-dia-hole${cid})`} />
            </g>
          </g>
        ))}
      </Part>
      {/* The membranes' free edges (a fold of tissue) moving medially. */}
      {c > 0.01 && c < 0.99 && (
        <Part id="mintz-pleuroperitonealak">
        <g clipPath="url(#w7-dia-cav)">
          {[1, -1].map((k) => {
            const x = k > 0 ? front : 1000 - front;
            return (
              <g key={k}>
                <path d={`M${f1(x)},150 C${f1(x + 10 * k)},260 ${f1(x + 10 * k)},340 ${f1(x)},440`} fill="none" stroke={P.poMem} strokeWidth={9} strokeLinecap="round" />
                <path d={`M${f1(x)},150 C${f1(x + 10 * k)},260 ${f1(x + 10 * k)},340 ${f1(x)},440`} fill="none" stroke="#f4d7ff" strokeWidth={2} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
        </Part>
      )}
      <Mark id="erreten-perikardioperitonealak" x={360} y={276} rx={46} ry={40} show={vis(t, 0.62, 0.74)} />
      <Mark id="erreten-perikardioperitonealak" x={640} y={276} rx={46} ry={40} show={vis(t, 0.62, 0.74)} />

      {/* Septum transversum: the large ventral plate (the IVC runs through it). */}
      <Part id="septum-transversum">
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill="url(#w7-mesench)" />
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill={`url(#w7-dia-dome${cid})`} />
        <path d={smoothPath(SEPT_EDGE, false, 0.3)} fill="none" stroke="#ffd9a8" strokeWidth={2} opacity={0.55} strokeLinecap="round" />
      </Part>
      <Part id="beheko-kaba-zaina">
        <circle cx={IVC_X[0]} cy={IVC_X[1]} r={13} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
        <ellipse cx={IVC_X[0]} cy={IVC_X[1] + 1} rx={8} ry={7} fill="#1d3f8a" />
        <circle cx={IVC_X[0] - 4} cy={IVC_X[1] - 4} r={3} fill="#9fbcff" opacity={0.5} />
      </Part>

      {/* Muscle from the body wall: a rim growing in from the periphery. */}
      <Part id="gorputz-paretako-mesodermoa" show={mus > 0.01 ? 1 : 0}>
        <path d={`${poly(CAV_X)}${poly([...inner].reverse())}`} fill={P.bodyMuscle} fillRule="evenodd" />
        <path d={`${poly(CAV_X)}${poly([...inner].reverse())}`} fill="url(#w7-muscle)" fillRule="evenodd" />
      </Part>

      {/* Dorsal mesentery of the oesophagus. */}
      <Part id="hestegorri-inguruko-mesenkima">
        <path d={poly(MES)} fill={P.eso} />
        <path d={poly(MES)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="hestegorria">
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={15} fill="#7a3b48" stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={15} fill="url(#w7-muscle)" opacity={0.5} />
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={8.5} fill={P.gut} />
        {/* The folded lumen of the oesophagus. */}
        <path d={`M${ESO_X[0] - 4},${ESO_X[1]} L${ESO_X[0] + 4},${ESO_X[1]} M${ESO_X[0]},${ESO_X[1] - 4} L${ESO_X[0]},${ESO_X[1] + 4} M${ESO_X[0] - 3},${ESO_X[1] - 3} L${ESO_X[0] + 3},${ESO_X[1] + 3}`} stroke="#1a1208" strokeWidth={1.8} strokeLinecap="round" />
      </Part>

      {/* Myocytes from the septum migrate into the pleuroperitoneal membranes. */}
      <Arrow from={[400, 430]} to={[332, 300]} color="#ff8a8a" width={2.4} show={migrate} bend={0.15} flow={!reduced} />
      <Arrow from={[600, 430]} to={[668, 300]} color="#ff8a8a" width={2.4} show={migrate} bend={-0.15} flow={!reduced} />
      <Part id="miozitoak" show={migrate}>
        {[0, 1, 2].map((i) => {
          const u = reduced ? 0.2 + i * 0.3 : (i / 3 + seg(t, 0.88, 1) * 0.9) % 1;
          const p: Pt = [lerp(392, 340, u), lerp(420, 312, u)];
          return [p, mx(p)].map((q, j) => (
            <ellipse key={`${i}${j}`} cx={q[0]} cy={q[1]} rx={11} ry={5.5} transform={`rotate(${j ? 62 : -62} ${q[0]} ${q[1]})`} fill="#ff98a6" stroke="#7a1f2e" strokeWidth={1} />
          ));
        })}
      </Part>

      <path d={poly(BODY_X)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={500} y={612} tone="accent" show={vis(t, 0, 0.74)}>
        Erretenak zabalik: goiko barrunbea (pleura) ↔ beheko barrunbea (peritoneoa)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.74, 0.88)}>
        5. astea: mintz pleuroperitonealak hestegorri inguruko mesenkimarekin eta septumarekin fusionatzen dira
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.88)}>
        Lau osagai: septuma · mintz pleuroperitonealak · hestegorri inguruko mesenkima · gorputz pareta
      </Note>

      <CavityKey rows={[canalsOpen > 0.5 && KEY7.canal, KEY7.septum]} quiet />
      <Label id="mintz-pleuroperitonealak" x={202} y={196} ax={345} ay={250} show={seg(t, 0.72, 0.76)} />
      <Label id="erreten-perikardioperitonealak" x={226} y={300} ax={Math.max(CANAL_MID[0], front + 24)} ay={lerp(CANAL_MID[1], FOCUS_L[1] - 30, c)} show={canalsOpen} small />
      <Label id="miozitoak" x={190} y={352} ax={366} ay={366} show={migrate} small />
      <Label id="beheko-kaba-zaina" x={190} y={400} ax={IVC_X[0] - 12} ay={IVC_X[1]} small />
      <Label id="gorputz-paretako-mesodermoa" x={228} y={470} ax={262 + rim * 0.4} ay={466} show={mus} small />
      <Label id="septum-transversum" x={190} y={540} ax={380} ay={500} />
      <Label id="hodi-neurala" x={810} y={96} ax={524} ay={100} small />
      <Label id="aorta" x={810} y={150} ax={AORTA_X[0] + 12} ay={AORTA_X[1] - 4} small />
      <Label id="hestegorria" x={810} y={196} ax={ESO_X[0] + 12} ay={ESO_X[1] - 6} />
      <Label id="hestegorri-inguruko-mesenkima" x={780} y={250} ax={550} ay={300} small />
    </g>
  );
}
