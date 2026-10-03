'use client';

import {
  C,
  Arrow,
  Cell,
  CellBand,
  Flow,
  Label,
  Note,
  Part,
  ellipseArc,
  ellipseD,
  lerp,
  lin,
  seg,
  smoothPath,
  zoom,
  type Pt,
  type SceneProps,
} from '@/components/kit';
import { CYTO, Endometrium, HYPO_BOTTOM, INNER, R, TrapBand, VESSELS, W2, discGeometry, f1, lensPath } from './common';

/**
 * 9. eguna — blastocyst almost completely embedded; lacunar period; Heuser's membrane.
 * Windows (shared by every view and by the stage beats in content/weeks/week2.ts):
 *   .00–.12 the blastocyst sinks deeper · .02–.12 the syncytium spreads round (almost) the whole blastocyst
 *   .14–.24 fibrin plug closes the epithelial gap
 *   .28–.38 vacuoles appear in the syncytium and enlarge · .42–.48 they fuse into lacunae (embryonic pole)
 *   .50–.54 "garai lakunarra" · .56–.64 hypoblast cells proliferate at the disc edges
 *   .60–.74 the new cells spread along the inner face of the cytotrophoblast → Heuser's membrane
 *   .78–.82 the membrane closes: blastocele → primitive yolk sac · .86–.96 vessels enlarge → sinusoids
 * Each window ends before its step's complete frame (next beat − 0.035).
 * Lacunae stay clear (no maternal blood): sinusoid erosion only happens on days 11–12.
 */
export const W = {
  sink: [0, 0.12],
  cover: [0.02, 0.12],
  fibrin: [0.14, 0.24],
  vacuoles: [0.28, 0.38],
  lacunae: [0.42, 0.48],
  period: [0.5, 0.54],
  prolif: [0.56, 0.64],
  heuser: [0.6, 0.74],
  rename: [0.78, 0.82],
  sinus: [0.86, 0.96],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);

/** End of day 8 → day 9 centre (the blastocyst sinks until the abembryonic trophoblast reaches the surface). */
const CY0 = 466;
const CY1 = 370;
/** The epithelial defect keeps the width it had at the end of day 8; the fibrin plug fills it. */
const GAP = Math.sqrt(R * R - (W2.surfaceY - CY0) ** 2) + 6;
const HEUSER = '#f7d98a';
const LACUNA = '#d3ebe6';
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Angle (from the horizontal) where the hypoblast's lower edge meets the cytotrophoblast. */
const EDGE_H = (Math.asin(-HYPO_BOTTOM / INNER) * 180) / Math.PI;
const HEUSER_L0 = 180 + EDGE_H;
const HEUSER_R0 = 360 - EDGE_H;

function geometry(t: number) {
  const g = discGeometry(W2.cx, lerp(CY0, CY1, s(t, W.sink)));
  return { ...g, cover: s(t, W.cover) };
}
type Geo = ReturnType<typeof geometry>;

/** Finger-like invasive fronts of the syncytium (same function as day 8, so t = 0 continues it). */
const fingers = (a: number) => 1 + 0.22 * Math.sin((a * Math.PI) / 11) + 0.12 * Math.sin((a * Math.PI) / 5.3);

/**
 * Syncytiotrophoblast thickness at angle `a` (degrees, 90 = abembryonic pole, 270 = embryonic pole, sampled 90..450).
 * cover = 0: day-8 profile (only 160°–380°); cover = 1: whole circle, thick at the embryonic pole, thin abembryonically.
 */
function synTh(a: number, cover: number) {
  const th8 = a > 160 && a < 380 ? 66 * Math.pow(Math.sin(((a - 160) / 220) * Math.PI), 0.8) * fingers(a) : 0;
  const p = Math.pow((1 - Math.sin(rad(a))) / 2, 0.9);
  const th9 = (7 + 63 * p) * (1 + (fingers(a) - 1) * p);
  return lerp(th8, th9, cover);
}
const norm = (a: number) => (a < 90 ? a + 360 : a);
/** Minimum and maximum thickness over [a - span, a + span]. */
function thRange(a: number, span: number, cover: number) {
  let lo = Infinity;
  let hi = 0;
  for (let d = -span; d <= span; d += 1) {
    const v = synTh(norm(a + d), cover);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return [lo, hi] as const;
}

const polar = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];

/** Point inside the syncytium at angle `a`, `frac` of the way from the cytotrophoblast to the surface. */
const synAt = (g: Geo, a: number, frac: number): Pt => polar(g, a, R + frac * synTh(norm(a), g.cover));

function syncytioPath(g: Geo) {
  const pts: Pt[] = [];
  for (let i = 0; i < 120; i++) {
    const a = 90 + i * 3;
    pts.push(polar(g, a, R + synTh(a, g.cover)));
  }
  return `${smoothPath(pts, true)}${ellipseD(g.cx, g.cy, R - 0.5, R - 0.5)}`;
}

/** Lacunae: mostly at the embryonic pole, separated by syncytial trabeculae. */
const LACUNAE = [188, 212, 236, 259, 282, 305, 328, 352];
/** Small vacuoles that stay vacuoles (thinner lateral syncytium, and between lacunae). */
const LOOSE_VACUOLES: [number, number][] = [
  [146, 0.5],
  [166, 0.5],
  [14, 0.5],
  [34, 0.5],
  [247, 0.86],
  [294, 0.86],
];

function lacunaShape(g: Geo, a: number, k: number, seed: number) {
  const [lo] = thRange(a, 9, 1);
  const [cx, cy] = synAt(g, a, 0.5);
  const tr = Math.min(17, (R + 30) * rad(7)) * k;
  const rr = 0.24 * lo * k;
  const tx = -Math.sin(rad(a));
  const ty = Math.cos(rad(a));
  const nx = Math.cos(rad(a));
  const ny = Math.sin(rad(a));
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const phi = (i / 12) * Math.PI * 2;
    const w = 1 + 0.16 * Math.sin(3 * phi + seed) + 0.08 * Math.cos(5 * phi + seed * 2.3);
    const u = tr * w * Math.cos(phi);
    const v = rr * w * Math.sin(phi);
    pts.push([cx + u * tx + v * nx, cy + u * ty + v * ny]);
  }
  return smoothPath(pts, true);
}

/**
 * Sinusoids: fixed maternal vessels around the implantation site, placed clear of the final syncytium, glands and
 * the other capillaries. `vessel` = index into VESSELS when the sinusoid is that capillary dilating in place.
 */
const G_END = geometry(1);
const SINUSOIDS = [
  { a: 165, len: 30, rr: 13 },
  { a: 211, len: 30, rr: 12, vessel: 3 },
  { a: 243, len: 46, rr: 16 },
  { a: 297, len: 46, rr: 16 },
  { a: 335, len: 36, rr: 14 },
  { a: 15, len: 30, rr: 13 },
].map(({ a, len, rr, vessel }, i) => {
  let x: number;
  let y: number;
  if (vessel !== undefined) [x, y] = VESSELS[vessel];
  else {
    const [, hi] = thRange(a, 25, 1);
    [x, y] = polar(G_END, a, R + hi + 10 + rr);
  }
  return { x, y, a, len, rr, vessel, seed: i + 1 };
});
type Sinusoid = (typeof SINUSOIDS)[number];
/** VESSELS entries that the advancing blastocyst grows over (they fade as the syncytium reaches them). */
const COVERED = VESSELS.map(([x, y]) => Math.hypot(x - G_END.cx, y - G_END.cy) < 215);

/** Capillary (k = 0) → dilated, irregular sinusoid (k = 1), elongated along the syncytial surface. */
function sinusoidPath(q: Sinusoid, k: number) {
  const tr = lerp(9, q.len, k);
  const rr = lerp(5.5, q.rr, k);
  const tx = -Math.sin(rad(q.a));
  const ty = Math.cos(rad(q.a));
  const nx = Math.cos(rad(q.a));
  const ny = Math.sin(rad(q.a));
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const phi = (i / 14) * Math.PI * 2;
    const w = 1 + 0.14 * k * Math.sin(3 * phi + q.seed) + 0.1 * k * Math.sin(2 * phi + q.seed * 1.7);
    const u = tr * w * Math.cos(phi);
    const v = rr * w * Math.sin(phi);
    pts.push([q.x + u * tx + v * nx, q.y + u * ty + v * ny]);
  }
  return smoothPath(pts, true);
}

/**
 * Fibrin plug sealing the epithelial gap: two lumpy masses creep in from the cut epithelial edges with
 * rounded fronts and fuse into one plug (no seam) that bulges a little into the uterine lumen.
 * `gap` is the defect's half-width (days 11–12 reuse it, smaller); `dy` moves it with a bulging surface.
 */
export function fibrinPlug(k: number, gap: number = GAP, dy = 0): string[] {
  const GAP = gap;
  const { cx, epiThickness } = W2;
  const surfaceY = W2.surfaceY + dy;
  const top = surfaceY - epiThickness - 2;
  const bottom = (x: number) => surfaceY + 2 + 7 * (1 - ((x - cx) / GAP) ** 2) + 1.3 * Math.sin(x * 0.31) * Math.cos(x * 0.13);
  const piece = (xs: number, xf: number, free: boolean) => {
    const dir = Math.sign(xf - xs) || 1;
    const n = Math.max(3, Math.round(Math.abs(xf - xs) / 7));
    const pts: Pt[] = [[xs, top], [xs, bottom(xs) - 2]];
    for (let i = 1; i <= n; i++) {
      const x = lerp(xs, xf, i / n);
      pts.push([x, bottom(x)]);
    }
    if (free) pts.push([xf + dir * (bottom(xf) - top) * 0.4, (top + bottom(xf)) / 2 + 1]);
    pts.push([xf, top]);
    return smoothPath(pts, true, 0.45);
  };
  if (k <= 0.004) return [];
  if (k >= 0.995) return [piece(cx - GAP, cx + GAP, false)];
  return [piece(cx - GAP, cx - GAP * (1 - k), true), piece(cx + GAP, cx + GAP * (1 - k), true)];
}

function Day9Drawing({ t, reduced }: SceneProps) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo } = g;
  const fib = s(t, W.fibrin);
  const vac = s(t, W.vacuoles);
  const merge = s(t, W.lacunae);
  const prolif = seg(t, W.prolif[0], W.prolif[0] + 0.03) * (1 - seg(t, W.heuser[1], W.heuser[1] + 0.04));
  const spread = s(t, W.heuser);
  const rename = s(t, W.rename);
  const sin = s(t, W.sinus);
  const lens = lensPath(g);
  const edge = (Math.asin(72 / INNER) * 180) / Math.PI;
  const fade = s(t, [0.04, 0.16]);
  const sinOn = seg(t, W.sinus[0], W.sinus[0] + 0.05);

  // Heuser's membrane: whole cells are added one by one behind a leading cell that creeps along the wall.
  const N_HEUSER = 18;
  const done = Math.min(N_HEUSER, Math.floor(N_HEUSER * spread + 1e-6));
  const lead = N_HEUSER * spread - done;
  // The leading cell creeps from the end of the last whole cell to the centre of the next slot, where it is replaced.
  const leadU = (done + 0.5 * lead) / N_HEUSER;
  const leaders = [lerp(HEUSER_L0, 90, leadU), lerp(HEUSER_R0, 450, leadU)];

  // Hypoblast cells dividing at both edges of the disc (the source of the new cells).
  const phase = (lin(t, W.prolif[0], W.heuser[1]) * 5) % 1;
  const dividing = [-1, 1].map((side) => {
    const x = cx + side * (wHypo - 9);
    const y = hypoBottom + 5;
    const sep = 4.5 * phase;
    return { a: [x - side * sep * 0.4, y - sep * 0.3] as Pt, b: [x + side * sep * 0.4, y + sep * 0.9] as Pt, o: prolif * Math.sin(Math.PI * phase) };
  });

  const rY = INNER - 4.5;
  const wY = Math.sqrt(rY * rY - HYPO_BOTTOM * HYPO_BOTTOM);
  const yolk = `M${f1(cx - wY)},${f1(hypoBottom)} A${rY} ${rY} 0 1 0 ${f1(cx + wY)},${f1(hypoBottom)} Z`;

  return (
    <g>
      <Endometrium gap={GAP} secretion={1} vesselScale={1.45} vesselFade={COVERED.map((c, i) => (c ? 1 - fade : SINUSOIDS.some((q) => q.vessel === i) ? 1 - sinOn : 1))}>
        {/* Oedematous stroma (as at the end of day 8). */}
        <rect x={0} y={0} width={1000} height={W2.surfaceY} fill="#fff" opacity={0.13} pointerEvents="none" />
        {/* Capillaries near the implantation site that dilate into sinusoids. */}
        <Part id="amaren-odol-hodiak" show={1 - sinOn}>
          {SINUSOIDS.filter((q) => q.vessel === undefined).map((q) => (
            <path key={q.seed} d={sinusoidPath(q, 0)} fill="url(#p-blood)" stroke="#8d1024" strokeWidth={1.4} />
          ))}
        </Part>
        <Part id="sinusoideak" show={sinOn}>
          {SINUSOIDS.map((q) => (
            <g key={q.seed}>
              <path d={sinusoidPath(q, sin)} fill="url(#p-blood)" stroke="#f3b3c0" strokeWidth={2.2} />
              <path d={sinusoidPath(q, sin)} fill="none" stroke="#8d1024" strokeWidth={1} />
            </g>
          ))}
        </Part>
        {sin > 0.5 && (
          <g opacity={seg(sin, 0.5, 1)}>
            {SINUSOIDS.map((q) => {
              const d = q.len * 0.8;
              const tx = -Math.sin(rad(q.a));
              const ty = Math.cos(rad(q.a));
              return <Flow key={q.seed} d={`M${f1(q.x - tx * d)},${f1(q.y - ty * d)} L${f1(q.x + tx * d)},${f1(q.y + ty * d)}`} n={3} dur={3.2} r={2} reduced={reduced} />;
            })}
          </g>
        )}
      </Endometrium>

      {/* Fibrin plug where the epithelium should be (drawn under the blastocyst it abuts). */}
      <Part id="fibrina-koagulua" show={seg(fib, 0, 0.15)}>
        {fibrinPlug(fib).map((d, i) => (
          <path key={i} d={d} fill="url(#p-fibrin)" stroke="#b9ae95" strokeWidth={1} />
        ))}
      </Part>

      {/* Cavity background (not interactive), then the cavity that is renamed when Heuser's membrane closes. */}
      <circle cx={cx} cy={cy} r={INNER} fill="#1b2437" pointerEvents="none" />
      <Part id="blastozelea" show={1 - rename}>
        <circle cx={cx} cy={cy} r={INNER} fill={C.blastocele} />
      </Part>
      <Part id="hasierako-bitelo-zakua" show={rename}>
        <path d={yolk} fill={C.yolkCavity} />
        <path d={yolk} fill="rgba(242,193,78,0.12)" />
        <path d={yolk} fill="url(#g-cavity)" />
      </Part>

      <Part id="sinzitiotrofoblastoa">
        <path d={syncytioPath(g)} fill="url(#p-syncytio)" fillRule="evenodd" stroke={C.syncytioDeep} strokeWidth={1.4} />
      </Part>

      {/* Vacuoles between syncytial "cells": appear, enlarge, then move together and fuse into lacunae. */}
      <Part id="bakuolak" show={vac}>
        {LACUNAE.flatMap((a, li) =>
          [
            [-6, 0.36],
            [0, 0.64],
            [6, 0.42],
          ].map(([da, fr], vi) => {
            const p = synAt(g, a + da, fr);
            const c = synAt(g, a, 0.5);
            const k = seg(merge, 0, 0.8);
            const r = lerp(0.8, 4.4, vac) + 1.6 * merge;
            return (
              <ellipse
                key={`${li}-${vi}`}
                cx={f1(lerp(p[0], c[0], k * 0.7))}
                cy={f1(lerp(p[1], c[1], k * 0.7))}
                rx={f1(r)}
                ry={f1(r * 0.8)}
                fill={LACUNA}
                stroke={C.syncytioDeep}
                strokeWidth={0.7}
                opacity={1 - seg(merge, 0.45, 1)}
              />
            );
          }),
        )}
        {LOOSE_VACUOLES.map(([a, fr], i) => {
          const [x, y] = synAt(g, a, fr);
          return <ellipse key={`l${i}`} cx={f1(x)} cy={f1(y)} rx={f1(lerp(0.8, 3, vac))} ry={f1(lerp(0.6, 2.4, vac))} fill={LACUNA} stroke={C.syncytioDeep} strokeWidth={0.7} />;
        })}
      </Part>

      <Part id="lakuak" show={seg(merge, 0, 0.35)}>
        {LACUNAE.map((a, i) => (
          <path key={i} d={lacunaShape(g, a, lerp(0.35, 1, merge), i * 1.9 + 0.7)} fill={LACUNA} stroke={C.syncytioDeep} strokeWidth={1} />
        ))}
      </Part>

      <Part id="zitotrofoblastoa">
        <CellBand curve={ellipseArc(cx, cy, R, R, 0, 360)} n={44} thickness={CYTO} color={C.cyto} inward shape="cuboidal" />
      </Part>

      <Part id="heuser-mintza" show={seg(spread, 0, 0.04)}>
        <CellBand curve={ellipseArc(cx, cy, INNER, INNER, HEUSER_L0, 90)} n={N_HEUSER} grow={done / N_HEUSER} thickness={4.5} color={HEUSER} inward shape="squamous" />
        <CellBand curve={ellipseArc(cx, cy, INNER, INNER, HEUSER_R0, 450)} n={N_HEUSER} grow={done / N_HEUSER} thickness={4.5} color={HEUSER} inward shape="squamous" />
        {done < N_HEUSER &&
          leaders.map((a, i) => {
            const [x, y] = polar(g, a, INNER - 2.4);
            return <Cell key={i} x={x} y={y} r={3} rx={5.4} ry={2.6} rotate={a + 90} color={HEUSER} nucleusScale={0.5} opacity={seg(lead, 0, 0.3)} />;
          })}
      </Part>

      <Part id="amnios-barrunbea">
        <path d={lens} fill="#6d9be6" opacity={0.42} />
        <path d={lens} fill="url(#g-cavity)" />
      </Part>
      <Part id="amnioblastoak">
        <CellBand curve={ellipseArc(cx, cy, INNER, INNER, 180 + edge, 360 - edge)} n={14} thickness={5} color={C.amnioblast} shape="squamous" inward />
      </Part>

      <Part id="epiblastoa">
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
        {dividing.map((d, i) => (
          <g key={i} opacity={d.o}>
            <Cell x={d.a[0]} y={d.a[1]} r={3.6} color="#fbe3a0" nucleus="rgba(90,60,10,0.8)" nucleusScale={0.45} />
            <Cell x={d.b[0]} y={d.b[1]} r={3.6} color="#fbe3a0" nucleus="rgba(90,60,10,0.8)" nucleusScale={0.45} />
          </g>
        ))}
      </Part>

      <Part id="bi-orriko-diskoa">
        <path
          d={`M${f1(cx - wEpiTop)},${f1(epiTop)} L${f1(cx + wEpiTop)},${f1(epiTop)} L${f1(cx + wHypo)},${f1(hypoBottom)} L${f1(cx - wHypo)},${f1(hypoBottom)}Z`}
          fill="none"
          stroke="#e8eefc"
          strokeWidth={1.1}
          strokeDasharray="3 3"
          opacity={0.75}
        />
      </Part>
    </g>
  );
}

/** "Garai lakunarra" is a period, not a tissue: a clickable badge. */
function PeriodBadge({ x, y, show }: { x: number; y: number; show: number }) {
  return (
    <Part id="garai-lakunarra" show={show}>
      <rect x={x - 74} y={y - 13} width={148} height={26} rx={13} fill="rgba(24,18,8,0.88)" stroke="#fbbf24" strokeWidth={1.3} strokeDasharray="4 3" />
      <text x={x} y={y} dy="0.35em" textAnchor="middle" fill="#fcd34d" fontSize={13} fontWeight={700}>
        Garai lakunarra
      </text>
    </Part>
  );
}

type At = (x: number, y: number) => [number, number];

function makeL(at: At) {
  return function label(id: string, x: number, y: number, p: Pt, show = 1, key = id) {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={ax} ay={ay} show={show} />;
  };
}

/** Anchors shared by the views, computed from the geometry so they stay inside their structure. */
function anchors(t: number) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom } = g;
  const merge = s(t, W.lacunae);
  const spread = s(t, W.heuser);
  const heuserAngleL = lerp(HEUSER_L0, 90, spread);
  return {
    g,
    vac: s(t, W.vacuoles),
    merge,
    spread,
    rename: s(t, W.rename),
    fib: s(t, W.fibrin),
    sinOn: seg(t, W.sinus[0], W.sinus[0] + 0.05),
    heuserAngleL,
    amnioblast: polar(g, 292, INNER - 2.5),
    cavity: [cx - 20, (cy - INNER + epiTop) / 2 + 4] as Pt,
    epi: [cx + 40, (epiTop + discY) / 2] as Pt,
    hypo: [cx + 52, (discY + hypoBottom) / 2] as Pt,
    cyto: (a: number) => polar(g, a, R - CYTO / 2),
    heuser: (a: number) => polar(g, a, INNER - 2.2),
    yolk: [cx - 14, cy + 62] as Pt,
    lacuna: (a: number) => synAt(g, a, 0.5),
    syn: (a: number) => synAt(g, a, 0.5),
    fibrinPt: (dx: number) => [cx + dx, W2.surfaceY - 2] as Pt,
  };
}

export function Day9Section(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const L = makeL((x, y) => [x, y]);
  const { cx, cy } = k.g;
  const sL = SINUSOIDS[2];
  return (
    <g>
      <Day9Drawing {...props} />
      <PeriodBadge x={cx} y={568} show={s(t, W.period)} />
      {L('endometrio-estroma', 190, 50, [300, 60])}
      {L('amaren-odol-hodiak', 190, 105, [330, 118])}
      {L('sinusoideak', 190, 160, [sL.x, sL.y], k.sinOn)}
      {L('umetoki-guruina', 190, 215, [266, 250])}
      {L('lakuak', 190, 262, k.lacuna(212), seg(k.merge, 0, 0.35))}
      {L('sinzitiotrofoblastoa', 190, 305, k.syn(200))}
      {L('zitotrofoblastoa', 190, 345, k.cyto(184))}
      {L('bakuolak', 190, 385, k.syn(166), k.vac)}
      {L('heuser-mintza', 190, 425, k.heuser(150), seg(k.spread, 0.5, 0.62))}
      {L('blastozelea', 190, 462, [cx - 30, cy + 30], 1 - k.rename)}
      {L('hasierako-bitelo-zakua', 190, 462, k.yolk, k.rename)}
      {L('endometrio-epitelioa', 190, 505, [300, W2.surfaceY - 8])}
      {L('fibrina-koagulua', 190, 548, k.fibrinPt(-70), seg(k.fib, 0.3, 0.7))}
      {L('mutur-enbrionarioa', 810, 250, k.cyto(276))}
      {L('amnioblastoak', 810, 290, k.amnioblast)}
      {L('amnios-barrunbea', 810, 330, k.cavity)}
      {L('epiblastoa', 810, 370, k.epi)}
      {L('hipoblastoa', 810, 410, k.hypo)}
      {L('blastozistoa', 810, 460, k.cyto(40))}
      {L('mutur-anenbrionarioa', 810, 530, [cx + 26, cy + R - 4])}
      {L('umetoki-barrunbea', 810, 598, [720, 598])}
    </g>
  );
}

export function Day9Lacunae(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  const z = zoom(cx, cy - 150, 2, 500, 290);
  const L = makeL(z.at);
  const sL = SINUSOIDS[2];
  const sR = SINUSOIDS[3];
  const vacShow = k.vac * (1 - seg(k.merge, 0.4, 0.8));
  // The camera follows the sinking blastocyst: the capillaries come into the picture just after t = 0.
  const vesselsIn = seg(t, 0.03, 0.06);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <Day9Drawing {...props} />
      </g>
      <PeriodBadge x={112} y={572} show={s(t, W.period)} />
      {L('endometrio-estroma', 180, 64, [cx - 110, cy - 250])}
      {L('amaren-odol-hodiak', 180, 180, [sL.x, sL.y], (1 - k.sinOn) * vesselsIn, 'vessel-l')}
      {L('sinusoideak', 180, 180, [sL.x, sL.y], k.sinOn)}
      {L('bakuolak', 180, 250, synAt(k.g, 236, 0.64), vacShow, 'bakuolak-early')}
      {L('bakuolak', 180, 250, synAt(k.g, 247, 0.86), k.vac * seg(k.merge, 0.4, 0.8))}
      {L('lakuak', 180, 300, k.lacuna(236), seg(k.merge, 0, 0.35))}
      {L('sinzitiotrofoblastoa', 180, 350, k.syn(224))}
      {L('zitotrofoblastoa', 180, 420, k.cyto(242))}
      {L('amaren-odol-hodiak', 800, 330, [sR.x, sR.y], (1 - k.sinOn) * vesselsIn, 'vessel-r')}
      {L('sinusoideak', 800, 330, [sR.x, sR.y], k.sinOn, 'sinus-r')}
      {L('lakuak', 800, 375, k.lacuna(305), seg(k.merge, 0, 0.35), 'lakuak-r')}
      {L('amnioblastoak', 800, 420, k.amnioblast)}
      {L('amnios-barrunbea', 800, 470, k.cavity)}
      {L('epiblastoa', 800, 520, k.epi)}
      {L('hipoblastoa', 800, 565, k.hypo)}
      <Note x={500} y={584} tone="warn" show={seg(k.merge, 0.3, 0.7)}>
        Lakuetan oraindik ez dago amaren odolik (sinusoideak 11–12. egunean urratzen dira)
      </Note>
    </g>
  );
}

export function Day9Heuser(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  const z = zoom(cx, cy + 45, 1.9, 500, 320);
  const L = makeL(z.at);
  const arrowShow = seg(t, W.prolif[0], W.prolif[0] + 0.04) * (1 - seg(t, W.heuser[1], W.heuser[1] + 0.05));
  const arrowP = seg(t, W.heuser[0] - 0.02, W.heuser[1] - 0.04);
  const pt = (a: number, r: number) => z.at(...polar(k.g, a, r));
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <Day9Drawing {...props} />
      </g>
      <Arrow from={pt(196, 88)} to={pt(112, 88)} bend={0.39} color={HEUSER} show={arrowShow} progress={arrowP} />
      <Arrow from={pt(344, 88)} to={pt(68, 88)} bend={-0.39} color={HEUSER} show={arrowShow} progress={arrowP} />
      {L('zitotrofoblastoa', 180, 200, k.cyto(192))}
      {L('heuser-mintza', 180, 290, k.heuser(Math.max(160, k.heuserAngleL + 6)), seg(k.spread, 0.2, 0.32))}
      {L('blastozelea', 180, 360, [cx - 30, cy + 40], 1 - k.rename)}
      {L('hasierako-bitelo-zakua', 180, 360, [cx - 30, cy + 40], k.rename)}
      {L('sinzitiotrofoblastoa', 180, 420, k.syn(140))}
      {L('endometrio-epitelioa', 180, 470, [cx - GAP - 26, W2.surfaceY - 8])}
      {L('fibrina-koagulua', 180, 530, k.fibrinPt(-80), seg(k.fib, 0.3, 0.7))}
      {L('epiblastoa', 800, 100, k.epi)}
      {L('hipoblastoa', 800, 175, k.hypo)}
      {L('heuser-mintza', 800, 300, k.heuser(Math.min(380, lerp(HEUSER_R0, 450, k.spread) - 6)), seg(k.spread, 0.2, 0.32), 'heuser-r')}
      {L('mutur-anenbrionarioa', 800, 430, [cx + 26, cy + R - 6])}
      {L('umetoki-barrunbea', 800, 535, [cx + 120, W2.surfaceY + 30])}
      <Note x={500} y={588} tone="accent" show={k.rename}>
        Blastozelea → hasierako bitelo zakua (barrunbe exozelomikoa)
      </Note>
    </g>
  );
}
