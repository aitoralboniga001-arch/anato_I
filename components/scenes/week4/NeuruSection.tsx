'use client';

import { C, clamp, lerp, rand } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { useId, type ReactNode } from 'react';
import { f1, type Pt } from './common';

/**
 * Transverse section of the trunk during neurulation (Langman figs. 6-2, 6-6; notes §2, fig. 3), drawn as
 * one continuous sheet: the neuroepithelium is a strip of fixed width whose curvature is integrated
 * (median hinge → groove, dorsolateral hinges → folds, then a circle → tube), and the surface ectoderm
 * continues from the fold tip (the junction where the neural crest arises), so plate, folds, tube and
 * covering ectoderm never come apart or overlap. Disc space: x across (0 = midline), d depth (0 = the
 * flat ectoderm surface, + towards ventral).
 */

export const NA = 62; // half-width of the neural plate (apical arc length)
export const TN = 20; // neuroepithelium (pseudostratified)
export const TE = 8; // surface ectoderm
const ss = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
export const DEN = 124; // top of the endoderm (axial region)
/** The body thins laterally: the endoderm rises under the lateral plate. */
export const den = (x: number) => DEN - 50 * ss((Math.abs(x) - 150) / 100);
const TEN = 8;
const L = 420; // half-width drawn
export const NS = 44; // samples per half plate
export const K = 1.48; // disc → screen
export const OY = 248; // screen y of d = 0

const bend = (s: number, s0: number, w: number) => ss((s - s0) / w + 0.5);

export type NeuruParams = {
  /** plate thickening 0..1 (induction) */
  plate: number;
  /** median hinge (groove) 0..1 */
  groove: number;
  /** dorsolateral hinges (folds elevate) 0..1 */
  folds: number;
  /** folds meet: shape → circle 0..1 */
  close: number;
  /** tube separates from the surface ectoderm 0..1 */
  detach: number;
  /** closed tube becomes a tall oval with slit lumen 0..1 */
  oval: number;
  /** somites epithelialise 0..1 */
  somite: number;
};

export type NeuruGeo = ReturnType<typeof neuruGeo>;

/** All the section's geometry in disc space. */
export function neuruGeo(p: NeuruParams) {
  const TNt = lerp(TE + 3, TN, p.plate);
  const aM = 0.5 * p.groove;
  const aD = 1.28 * p.folds;
  const c = p.close;
  const theta = (s: number) => (1 - c) * (aM * bend(s, 6, 12) + aD * bend(s, 0.56 * NA, 16)) + c * ((Math.PI * s) / NA);
  // thickness: tapers to the ectoderm at the junction until the folds fuse; then lateral walls thicken,
  // floor and roof plates stay thin
  const th = (s: number) => {
    const u = s / NA;
    const taper = ss((s - (NA - 13)) / 13) * (1 - p.detach);
    const base = TNt - (TNt - TE) * taper;
    return base * (1 + 0.32 * p.oval * Math.sin(Math.PI * u)) * (1 - 0.16 * p.oval * (1 - ss(s / 14))) * (1 - 0.14 * p.oval * ss((s - (NA - 14)) / 14));
  };
  // apical (groove / lumen) surface of the right half, from the midline outwards
  const ap: Pt[] = [[0, 0]];
  const hs: number[] = [theta(0)];
  const ds = NA / NS;
  for (let i = 0; i < NS; i++) {
    const h = theta((i + 0.5) * ds);
    const q = ap[i];
    ap.push([q[0] + ds * Math.cos(h), q[1] - ds * Math.sin(h)]);
    hs.push(theta((i + 1) * ds));
  }
  const ss_ = ap.map((_, i) => i * ds);
  let bas: Pt[] = ap.map((q, i) => [q[0] + Math.sin(hs[i]) * th(ss_[i]), q[1] + Math.cos(hs[i]) * th(ss_[i])]);
  let apT = ap;
  if (p.oval > 0) {
    const ov = p.oval;
    apT = ap.map(([x, d]) => [x * (1 - 0.42 * ov), d < 0 ? d * (1 + 0.28 * ov) : d]);
    bas = bas.map(([x, d]) => [x * (1 - 0.16 * ov), d < 0 ? d * (1 + 0.24 * ov) : d]);
  }
  const tipA = apT[NS];
  const thetaTip = hs[NS];
  const roofBasal = Math.min(...bas.map((q) => q[1]));

  // surface ectoderm (apical/amniotic surface) from the junction outwards: a hairpin over the fold crest,
  // down the outside of the fold, then flat. After detachment it starts at the midline above the tube.
  const gap = 16 * p.detach;
  const P0: Pt = [lerp(tipA[0], 0, p.detach), lerp(tipA[1], roofBasal - gap - TE, p.detach)];
  const h0 = Math.min(thetaTip, Math.PI / 2) * (1 - p.detach);
  const hDown = lerp(-Math.min(1.1, 0.75 * thetaTip), -0.72, p.detach);
  const rT = lerp(10, 80, p.detach);
  const R2 = lerp(44, 110, p.detach);
  const eA: Pt[] = [P0];
  const eH: number[] = [h0];
  {
    let h = h0;
    let q = P0;
    let phase = h0 > hDown + 1e-3 ? 1 : 2;
    const st = 1.6;
    for (let i = 0; i < 900 && q[0] < L; i++) {
      if (phase === 1) {
        h -= st / rT;
        if (h <= hDown) {
          h = hDown;
          phase = 2;
        }
      } else if (phase === 2) {
        if (h > -1e-4) phase = 4;
        else if (q[1] >= -R2 * (1 - Math.cos(h))) phase = 3;
      }
      if (phase === 3) {
        h += st / R2;
        if (h >= 0) {
          h = 0;
          phase = 4;
        }
      }
      if (phase === 4 && Math.abs(q[1]) > 0.05) h = clamp(-q[1] * 0.08, -0.1, 0.1); // settle exactly on the flat level
      q = [q[0] + st * Math.cos(h), q[1] - st * Math.sin(h)];
      eA.push(q);
      eH.push(h);
    }
  }
  const eB: Pt[] = eA.map((q, i) => [q[0] + Math.sin(eH[i]) * TE, q[1] + Math.cos(eH[i]) * TE]);
  /** depth of the underside of the surface ectoderm at |x| */
  const ectoUnder = (x: number) => {
    const ax = Math.abs(x);
    for (let i = 1; i < eB.length; i++) if (eB[i][0] >= ax && eB[i - 1][0] <= ax) return lerp(eB[i - 1][1], eB[i][1], (ax - eB[i - 1][0]) / Math.max(1e-6, eB[i][0] - eB[i - 1][0]));
    return TE;
  };

  // mesoderm and the rest
  const somC: Pt = [102, lerp(60, 44, ss(c * 1.2 - 0.1))];
  const somR: Pt = [lerp(34, 38, p.somite), lerp(30, 34, p.somite)];
  const noto: Pt = [0, TN + 15];
  const aorta: Pt = [42, DEN - 18];
  const mirror = (q: Pt): Pt => [-q[0], q[1]];

  return { p, ap: apT, bas, hs, tipA, thetaTip, roofBasal, eA, eB, ectoUnder, somC, somR, noto, aorta, mirror, gap, TNt };
}

/** Screen mapping. */
export const SX = (q: Pt): Pt => [500 + K * q[0], OY + K * q[1]];

const pathOf = (pts: Pt[], close = false) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}${close ? 'Z' : ''}`;

function ringPts(c: Pt, rx: number, ry: number, n = 36): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)];
  });
}

/** Full-width neural band (left tip → floor → right tip) in screen space, over |s| ≤ s1 or a lateral stretch. */
export function neuralBand(g: NeuruGeo, i0: number, i1: number) {
  const idx = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const side = (pts: Pt[], sd: 1 | -1, ids: number[]) => ids.map((i) => SX(sd > 0 ? pts[i] : g.mirror(pts[i])));
  if (i0 === 0) {
    const ids = idx(0, i1);
    const rev = ids.slice().reverse();
    return { outer: [...side(g.bas, -1, rev), ...side(g.bas, 1, ids.slice(1))], inner: [...side(g.ap, -1, rev), ...side(g.ap, 1, ids.slice(1))] };
  }
  const ids = idx(i0, i1);
  return { right: { outer: side(g.bas, 1, ids), inner: side(g.ap, 1, ids) }, left: { outer: side(g.bas, -1, ids), inner: side(g.ap, -1, ids) } };
}

type Parts = {
  /** wraps a drawing in the right <Part> */
  part: (id: string, node: ReactNode, show?: number) => ReactNode;
  plateId: string;
  /** id of the lateral stretches of the plate (the folds) */
  foldId: string;
  tube: boolean;
  aortaShow: number;
  /** extra content drawn in the mesenchyme, under the neural band and ectoderm */
  under?: ReactNode;
  /** extra content drawn on top */
  over?: ReactNode;
  /** optional magnification (an SVG transform) applied inside the feathered frame, to the drawing and `over` */
  view?: string;
  /** draw the amnion along the top (default true) */
  amnion?: boolean;
};

/** The whole section (no labels). */
export function NeuruDrawing({ g, part, plateId, foldId, tube, aortaShow, under, over, view, amnion = true }: { g: NeuruGeo } & Parts) {
  const uid = useId().replace(/:/g, '');
  const { p, eA, eB, ap, bas, somC, somR, noto, aorta, mirror } = g;
  const Lp = (pts: Pt[]) => pts.map(SX);
  const eBl = eB.map(mirror);
  const eAl = eA.map(mirror);
  // mesenchyme: under the ectoderm (and, while attached, the neural plate's basal face) down to the endoderm
  const top: Pt[] =
    p.detach > 0.001
      ? [...eBl.slice().reverse(), ...eB]
      : [...eBl.slice().reverse(), ...bas.map(mirror).reverse(), ...bas.slice(1), ...eB];
  const endoLine = Array.from({ length: 81 }, (_, i): Pt => [lerp(L, -L, i / 80), den(lerp(L, -L, i / 80))]);
  const meso = [...top, ...endoLine] as Pt[];
  // groove (amniotic fluid between the folds) / lumen
  const grooveP = [...ap.map(mirror).reverse(), ...ap.slice(1)];

  const somO = ringPts(somC, somR[0], somR[1]);
  const somI = ringPts(somC, somR[0] - lerp(6, 13, p.somite), somR[1] - lerp(6, 12, p.somite));

  // lateral plate: somatic (parietal) layer under the ectoderm, splanchnic (visceral) layer on the endoderm, coelom between
  // The lateral plate splits medially-to-laterally: its two layers meet at the medial tip of the coelom.
  const xL0 = 168;
  const xs = Array.from({ length: 49 }, (_, i) => lerp(xL0, L, (i / 48) ** 1.6));
  const cMid = (x: number) => (g.ectoUnder(x) + 12 + den(x) - 12) / 2;
  const cHalf = (x: number) => ((den(x) - 12 - (g.ectoUnder(x) + 12)) / 2) * Math.sqrt(ss((x - xL0) / 46));
  const cTopAt = (x: number) => cMid(x) - cHalf(x);
  const cBotAt = (x: number) => cMid(x) + cHalf(x);
  const parTop = xs.map((x): Pt => [x, cTopAt(x) - 12]);
  const parBot = xs.map((x): Pt => [x, cTopAt(x)]);
  const visTop = xs.map((x): Pt => [x, cBotAt(x)]);
  const visBot = xs.map((x): Pt => [x, cBotAt(x) + 12]);
  const coelom = (sd: 1 | -1) => {
    const m = (q: Pt): Pt => (sd > 0 ? q : mirror(q));
    const cTop = xs.map((x): Pt => [x, cTopAt(x)]);
    const cBot = xs.map((x): Pt => [x, cBotAt(x)]);
    return pathOf([...cTop, ...cBot.reverse()].map(m).map(SX), true);
  };
  const sides = [1, -1] as const;
  const neural = neuralBand(g, 0, NS) as { outer: Pt[]; inner: Pt[] };
  const mid = neuralBand(g, 0, Math.round(NS * 0.56)) as { outer: Pt[]; inner: Pt[] };
  const lat = neuralBand(g, Math.round(NS * 0.56), NS) as { right: { outer: Pt[]; inner: Pt[] }; left: { outer: Pt[]; inner: Pt[] } };
  const bandLen = (pts: Pt[]) => pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
  const nCells = (pts: Pt[], w: number) => Math.max(3, Math.round(bandLen(pts) / w));
  const ectoR = { outer: Lp(eA), inner: Lp(eB) };
  const ectoL = { outer: Lp(eAl), inner: Lp(eBl) };
  const ectoFull = { outer: [...ectoL.outer.slice().reverse(), ...ectoR.outer.slice(1)], inner: [...ectoL.inner.slice().reverse(), ...ectoR.inner.slice(1)] };
  const endoTopL = endoLine.slice().reverse();
  const endoBotL = endoTopL.map((q): Pt => [q[0], q[1] + TEN]);

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-am`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={OY + 60}>
          <stop offset={0} stopColor="#16223c" />
          <stop offset={1} stopColor="#0d1424" />
        </linearGradient>
        <linearGradient id={`${uid}-lt`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset={0} stopColor="#fff" stopOpacity={0.07} />
          <stop offset={0.5} stopColor="#fff" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={0.16} />
        </linearGradient>
        <linearGradient id={`${uid}-yk`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#3a3115" />
          <stop offset={1} stopColor="#17140a" />
        </linearGradient>
      </defs>
      <g mask="url(#m-slab-wide)">
        <g transform={view}>
        {/* amniotic cavity above the embryo; amnion (amnioblasts + extra-embryonic mesoderm) along the top */}
        <rect x={-400} y={-300} width={1800} height={OY + 360} fill={`url(#${uid}-am)`} />
        {amnion && (() => {
          const arc = Array.from({ length: 61 }, (_, i): Pt => {
            const x = lerp(-L, L, i / 60);
            return [x, -136 + 22 * (x / L) ** 2];
          });
          const inner = arc.map((q): Pt => [q[0], q[1] + 4]);
          const outer = arc.map((q): Pt => [q[0], q[1] - 6]);
          return (
            <g opacity={0.9}>
              <Cells outer={Lp(outer)} inner={Lp(arc)} n={44} fill={C.mesoExtra} nucleus="rgba(150,70,50,0.5)" edge="rgba(150,70,50,0.2)" seed={601} />
              <Cells outer={Lp(arc)} inner={Lp(inner)} n={64} fill={C.amnioblast} nk={0.5} seed={602} />
            </g>
          );
        })()}
        {/* yolk sac below the endoderm */}
        <path d={pathOf(Lp([...endoBotL, [L, 400], [-L, 400]]), true)} fill={`url(#${uid}-yk)`} />

        {/* mesenchyme */}
        <path d={pathOf(Lp(meso), true)} fill="#5a2630" />
        <path d={pathOf(Lp(meso), true)} fill="url(#p-meso-intra)" opacity={0.3} />

        {/* lateral plate: coelom between the somatic and splanchnic layers; intermediate mesoderm medial to it */}
        {sides.map((sd) => {
          const m = (pts: Pt[]) => Lp(sd > 0 ? pts : pts.map(mirror));
          return (
            <g key={sd}>
              <path d={coelom(sd)} fill="#160f1c" />
              <Cells outer={m(parTop)} inner={m(parBot)} n={22} fill={C.mesoLateral} nucleus="rgba(120,20,20,0.6)" seed={610 + sd} />
              <Cells outer={m(visTop)} inner={m(visBot)} n={22} fill={C.mesoLateral} nucleus="rgba(120,20,20,0.6)" seed={612 + sd} />
              <ellipse cx={SX([sd * 150, 66])[0]} cy={SX([sd * 150, 66])[1]} rx={11 * K} ry={15 * K} fill="#a8323d" opacity={0.55} />
              <ellipse cx={SX([sd * 150, 66])[0]} cy={SX([sd * 150, 66])[1]} rx={11 * K} ry={15 * K} fill="url(#p-meso-intra)" opacity={0.35} />
            </g>
          );
        })}

        {/* paraxial mesoderm → somites (epithelial balls round a small somitocoel) */}
        {part(
          'somitak',
          <g>
            {sides.map((sd) => {
              const o = Lp(sd > 0 ? somO : somO.map(mirror));
              const i = Lp(sd > 0 ? somI : somI.map(mirror));
              return (
                <g key={sd}>
                  <path d={pathOf(o, true)} fill={C.mesoParaxial} opacity={lerp(0.55, 0.9, p.somite)} />
                  <path d={pathOf(o, true)} fill="url(#p-meso-intra)" opacity={0.35 * (1 - p.somite)} />
                  {p.somite > 0.05 && (
                    <g opacity={p.somite}>
                      <Cells outer={o} inner={i} n={22} fill={C.mesoParaxial} nucleus="rgba(90,10,20,0.7)" pseudo seed={620 + sd} />
                      <path d={pathOf(i, true)} fill="#7a1f2a" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>,
        )}

        {/* dorsal aortae (paired, on the splanchnic mesoderm above the endoderm) */}
        {aortaShow > 0.02 &&
          part(
            'aorta-dortsalak',
            <g>
              {sides.map((sd) => {
                const c = SX(sd > 0 ? aorta : mirror(aorta));
                return (
                  <g key={sd}>
                    <circle cx={c[0]} cy={c[1]} r={9 * K} fill="#7f1d1d" stroke="#fca5a5" strokeWidth={1.4} />
                    <circle cx={c[0] - 2} cy={c[1] + 1} r={2} fill="#f87171" />
                    <circle cx={c[0] + 3} cy={c[1] - 2} r={1.8} fill="#f87171" />
                  </g>
                );
              })}
            </g>,
            aortaShow,
          )}

        {/* notochord: vacuolated cells under the floor of the plate */}
        {part(
          'notokorda',
          <g>
            <Cells outer={Lp(ringPts(noto, 11, 11))} inner={Lp(ringPts(noto, 4, 4))} n={9} fill={C.notochord} nucleus="rgba(60,20,90,0.7)" seed={630} />
            <circle cx={SX(noto)[0]} cy={SX(noto)[1]} r={4 * K} fill="#c4a5f5" opacity={0.85} />
          </g>,
        )}

        {/* endoderm (roof of the yolk sac) */}
        <Cells outer={Lp(endoTopL)} inner={Lp(endoBotL)} n={96} fill={C.endoderm} nucleus="rgba(90,60,10,0.7)" seed={640} />

        {under}

        {/* groove (amniotic fluid between the folds) */}
        {!tube &&
          p.groove > 0.03 &&
          part(
            'ildo-neurala',
            <g>
              <linearGradient id={`${uid}-gv`} gradientUnits="userSpaceOnUse" x1={0} y1={SX(g.tipA)[1]} x2={0} y2={SX([0, 0])[1]}>
                <stop offset={0} stopColor="#96beff" stopOpacity={0} />
                <stop offset={1} stopColor="#96beff" stopOpacity={0.2} />
              </linearGradient>
              <path d={pathOf(Lp(grooveP), true)} fill={`url(#${uid}-gv)`} />
            </g>,
            ss((p.groove - 0.03) / 0.2),
          )}

        {/* neuroepithelium: plate (middle) + folds (lateral stretches), or the closed tube with its canal */}
        {tube ? (
          part(
            'hodi-neurala',
            <g>
              <path d={pathOf(Lp(grooveP), true)} fill="#0b1226" />
              <Cells outer={neural.outer} inner={neural.inner} n={nCells(neural.outer, 5.2)} fill={C.neural} pseudo nucleus="rgba(10,16,48,0.7)" seed={650} />
            </g>,
          )
        ) : (
          <>
            {part(plateId, <Cells outer={mid.outer} inner={mid.inner} n={nCells(mid.outer, 5.2)} fill={C.neural} pseudo nucleus="rgba(10,16,48,0.7)" seed={651} />)}
            {part(
              foldId,
              <g>
                {[lat.right, lat.left].map((b, i) => (
                  <Cells key={i} outer={b.outer} inner={b.inner} n={nCells(b.outer, 5.2)} fill={foldId === plateId ? C.neural : '#4a6fe0'} pseudo nucleus="rgba(10,16,48,0.7)" seed={652 + i} />
                ))}
              </g>,
            )}
          </>
        )}

        {/* surface ectoderm (cuboidal), continuous with the neuroepithelium at the junction until it separates */}
        {part(
          'azaleko-ektodermoa',
          p.detach > 0.001 ? (
            <Cells outer={ectoFull.outer} inner={ectoFull.inner} n={nCells(ectoFull.outer, 9)} fill={C.surfaceEcto} nk={0.5} seed={660} />
          ) : (
            <g>
              <Cells outer={ectoR.outer} inner={ectoR.inner} n={nCells(ectoR.outer, 9)} fill={C.surfaceEcto} nk={0.5} seed={661} />
              <Cells outer={ectoL.outer} inner={ectoL.inner} n={nCells(ectoL.outer, 9)} fill={C.surfaceEcto} nk={0.5} seed={662} />
            </g>
          ),
        )}

        </g>
        {/* soft light from the upper left */}
        <rect x={0} y={0} width={1000} height={640} fill={`url(#${uid}-lt)`} pointerEvents="none" />
      </g>
      <g transform={view}>{over}</g>
    </g>
  );
}

/** Neural crest cell positions (disc space) for the EMT and migration steps. */
export function crestCells(g: NeuruGeo, appear: number, gather: number, migrate: number, n = 9) {
  const out: { q: Pt; side: 1 | -1; route: 'dl' | 'v'; o: number }[] = [];
  const top = g.roofBasal;
  for (const sd of [1, -1] as const) {
    for (let i = 0; i < n; i++) {
      const r1 = rand(i * 7.1 + sd * 3.3);
      const r2 = rand(i * 2.9 + sd * 11.7);
      // 1) at the junction, on the outside of the fold tip
      const ang = lerp(0.18, 0.62, i / (n - 1));
      const a: Pt = [Math.sin(ang) * (Math.abs(g.bas[NS - 6][0]) + 6), top + 4 + (1 - Math.cos(ang)) * 30 + r1 * 3];
      // 2) gathered in the space between the tube roof and the separated ectoderm
      const row = i < 5 ? 0 : 1;
      const b: Pt = [3.5 + 6.6 * (row ? i - 5 + 0.5 : i) + r1 * 1.2, top - 4.2 - row * 6.4 - (row ? 0 : (i / 5) * 1.5)];
      // 3) two routes: dorsolateral under the ectoderm (future melanocytes) / ventral between tube and somite
      const route: 'dl' | 'v' = i % 2 === 0 ? 'dl' : 'v';
      const k = (i >> 1) / Math.ceil(n / 2);
      const pathDL: Pt[] = [b, [46, g.ectoUnder(46) + 6], [100, g.ectoUnder(100) + 6], [lerp(130, 190, k), g.ectoUnder(lerp(130, 190, k)) + 5]];
      const pathV: Pt[] = [b, [40, top + 24], [56, 30], [lerp(58, 52, k), lerp(46, 92, k)]];
      const pth = route === 'dl' ? pathDL : pathV;
      const u = clamp((migrate - 0.25 * r2) / 0.75);
      const along = (pts: Pt[], v: number): Pt => {
        const segs = pts.length - 1;
        const f = clamp(v) * segs;
        const j = Math.min(segs - 1, Math.floor(f));
        return [lerp(pts[j][0], pts[j + 1][0], f - j), lerp(pts[j][1], pts[j + 1][1], f - j)];
      };
      let q: Pt = gather > 0 ? [lerp(a[0], b[0], gather), lerp(a[1], b[1], gather)] : a;
      if (migrate > 0) q = along(pth, u);
      out.push({ q: [sd * q[0], q[1]], side: sd, route, o: appear });
    }
  }
  return out;
}
