'use client';

import { C, Cell, CellBand, Label, Note, Part, ellipseArc, lerp, lin, seg, zoom, type Pt, type SceneProps } from '@/components/kit';
import { CYTO, HYPO_BOTTOM, INNER, TrapBand, W2, arcAround, bandAround, conceptusAt, discGeometry, f1, lensPath, stalkBridge, toCyto } from './common';
import {
  BULGE,
  EndometriumBack,
  EndometriumFront,
  FibrinPlug,
  LACUNA_A,
  RC_END,
  ShellDecidua,
  ShellMaternal,
  ShellSyncytium,
  polar,
  surfaceAt,
  synBase,
  syncytioOuter,
  tube,
  type Shell,
} from './Day11_12';
import { CellRing, INK, radialPath } from './materials';

/** The implantation bulge into the lumen, a little more marked than on days 11–12 ("goragunea umetokiaren barrunbera begira"). */
const BULGE13 = BULGE + 5;

/**
 * 13. eguna — gainazaleko epitelioa sendatuta, biloxka primarioak, korion plaka, bitelo zaku
 * sekundarioa, kiste exozelomikoak eta finkapen pedikulua (Langman 4-6 irudia).
 * Windows (shared by every view and the stage beats in content/weeks/week2.ts):
 *   .00-.07 epitelioa erabat itxita (fibrina desagertuta) · .08-.18 biloxka primarioak: zito-zutabeak sinzitioan, laku odoltsuen artean
 *   .22-.28 biloxka bat zeharka moztuta (biloxkak ikuspegia)
 *   .14-.46 korion barrunbea handitzen jarraitzen du → korion plaka nabarmentzen da (.32-.46)
 *   .50-.55 hipoblasto-zelulak ugaldu eta Heuser-en mintzaren barruko aurpegia estaltzen dute
 *   .55-.585 estalitako zakua txikitzen da → bitelo zaku sekundarioa
 *   .56-.70 hasierako bitelo zakuaren hondarrak puskatu eta kiste exozelomiko gisa biribiltzen dira
 *   .74-.82 finkapen pedikulua nabarmentzen da · .86-.90 korioia (zito+sinzitio+mesodermo somatikoa)
 *   .94-.98 habiratze-guneko odol-jario txikia umetokiaren barrunbera
 * Every window ends before its step's complete frame (next beat − 0.035), so the paused frame
 * shows the finished state the caption describes.
 */
export const W = {
  heal: [0, 0.07],
  villi: [0.08, 0.18],
  cut: [0.22, 0.28],
  cavityGrow: [0.14, 0.46],
  plaka: [0.32, 0.46],
  lining: [0.5, 0.55],
  secondary: [0.55, 0.585],
  cysts: [0.56, 0.7],
  stalk: [0.74, 0.82],
  chorion: [0.86, 0.9],
  bleed: [0.94, 0.98],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Continues day 12's shell and keeps growing: the chorionic cavity widens around the embryo complex. */
const RC_MAX = 190;
const EDGE_H = (Math.asin(-HYPO_BOTTOM / INNER) * 180) / Math.PI;
const AMNION_L = 180 + EDGE_H;
const AMNION_R = 360 - EDGE_H;
const HEUSER = '#f7d98a';
const MESO_EDGE = '#c26a48';
/** Extra-embryonic mesoderm thickness: as at the end of days 11–12; the chorionic plate thickens a little. */
const BAND = 9;
/** New hypoblast cells per side lining Heuser's membrane. */
const N_LINE = 14;
/** Radius of the secondary yolk sac. */
const R_SEC = 60;
/** Day 12 ends with every phase complete: the shell helpers are evaluated at its last frame. */
const T12 = 1;

function geometry(t: number) {
  const expand = s(t, W.cavityGrow);
  const Rc = lerp(RC_END, RC_MAX, expand);
  const { cyC, cy } = conceptusAt(Rc);
  const core = discGeometry(W2.cx, cy);
  const villi = s(t, W.villi);
  return { ...core, cyC, Rc, grow: 1, villi };
}
type Geo = ReturnType<typeof geometry>;

/** Around the embryo-complex centre (amnion, yolk sac, mesoderm, stalk). */
const polarE = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];
const outR = (g: Geo, a: number) => toCyto(g.cy, g.cyC, g.Rc, a);
const synAt = (g: Shell, a: number, frac: number): Pt => polar(g, a, g.Rc + frac * synBase(g, a));

/**
 * Primary villi: columns of cytotrophoblast pushing into the syncytium between the blood-filled
 * lacunae (one between each pair), each with its syncytial covering (Langman 4-6).
 */
const VILLI_A = [...LACUNA_A.slice(0, -1).map((a, i) => (a + LACUNA_A[i + 1]) / 2), 414, 440, 466, 492, 126];
/** Villus i at progress v (0..1): its axis (base in the cyto, tip in the syncytium) and widths. */
function villus(g: Shell, i: number, v: number) {
  const a = VILLI_A[i];
  const th = synBase(g, a);
  const vi = seg(v, i * 0.035, 0.62 + i * 0.035);
  const len = Math.max(6, 0.52 * th) * vi;
  const r0 = g.Rc - 4;
  const bend = 1.5 * Math.sin(i * 2.3);
  const pts: Pt[] = Array.from({ length: 7 }, (_, j) => {
    const u = j / 6;
    return polar(g, a + bend * Math.sin(Math.PI * u * 0.9), r0 + (len + 4) * u);
  });
  const core = Math.min(12, 6 + th * 0.08);
  return { a, pts, len, core, vi };
}

/** Exocoelomic cysts: [angle around the embryo complex, radius] — what remains of the primary yolk sac's wall. */
const CYSTS: [number, number][] = [
  [398, 7.5],
  [452, 11.5],
  [506, 6.5],
];
/** The old wall (AMNION_R → AMNION_L + 360) split into one piece per cyst; each piece gathers into its cyst. */
const PIECES: [number, number][] = [
  [AMNION_R, (398 + 452) / 2],
  [(398 + 452) / 2, (452 + 506) / 2],
  [(452 + 506) / 2, AMNION_L + 360],
];
const cystAt = (g: Geo, i: number): Pt => polarE(g, CYSTS[i][0], INNER - 2.5);

/** Transverse cut through one villus: syncytial coat round a cytotrophoblast core, in a pool of maternal blood. */
function VillusSection({ x, y, r, seed }: { x: number; y: number; r: number; seed: number }) {
  const outline = (rr: number, k: number) => radialPath(x, y, (a) => rr * (1 + k * Math.sin(rad(a) * 3 + seed) + 0.5 * k * Math.sin(rad(a) * 5 + seed * 2)), 10);
  const n = 7;
  return (
    <g>
      <Part id="sinzitiotrofoblastoa">
        <path d={outline(r, 0.07)} fill="url(#w2-p-syn)" />
        <path d={outline(r, 0.07)} fill="url(#w2-g-sheen)" />
        <path d={outline(r, 0.07)} fill="none" stroke={INK.synEdge} strokeWidth={1.4} />
      </Part>
      <Part id="biloxka-primarioa">
        <path d={outline(r * 0.58, 0.05)} fill={C.cyto} stroke={INK.cytoEdge} strokeWidth={1} />
        {/* Cytotrophoblast cells: borders from the centre, a nucleus in each. */}
        {Array.from({ length: n }, (_, j) => {
          const a = (j / n) * Math.PI * 2 + seed;
          const b = a + Math.PI / n;
          return (
            <g key={j}>
              <path d={`M${f1(x + r * 0.12 * Math.cos(a))},${f1(y + r * 0.12 * Math.sin(a))} L${f1(x + r * 0.57 * Math.cos(a))},${f1(y + r * 0.57 * Math.sin(a))}`} stroke={INK.cytoEdge} strokeWidth={0.8} />
              <ellipse cx={f1(x + r * 0.36 * Math.cos(b))} cy={f1(y + r * 0.36 * Math.sin(b))} rx={f1(r * 0.08)} ry={f1(r * 0.06)} fill={INK.cytoNucleus} opacity={0.8} />
            </g>
          );
        })}
        <path d={outline(r * 0.58, 0.05)} fill="url(#w2-g-cell)" />
      </Part>
    </g>
  );
}

/** `villiView`: maternal side and lacunae set back so the primary villi (the subject of that view) read first. */
function Day13Drawing({ t, reduced, slab = 'm-slab', villiView = false }: SceneProps & { slab?: string; villiView?: boolean }) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo, Rc, villi } = g;
  const plaka = s(t, W.plaka);
  const lining = s(t, W.lining);
  const secondary = s(t, W.secondary);
  const cysts = s(t, W.cysts);
  const chorion = s(t, W.chorion);
  const lens = lensPath(g);

  // New hypoblast cells: they divide at both edges of the disc and creep down the inner face of
  // Heuser's membrane, whole cells added behind a leading cell (as Heuser's membrane itself on day 9).
  const done = Math.min(N_LINE, Math.floor(N_LINE * lining + 1e-6));
  const lead = N_LINE * lining - done;
  const phase = (lin(t, W.lining[0], W.lining[1]) * 5) % 1;
  const prolif = seg(t, W.lining[0], W.lining[0] + 0.01) * (1 - seg(t, W.lining[1] - 0.01, W.lining[1]));
  const dividing = [-1, 1].map((side) => {
    const x = cx + side * (wHypo - 9);
    const y = hypoBottom + 5;
    const sep = 4.5 * phase;
    return { a: [x - side * sep * 0.4, y - sep * 0.3] as Pt, b: [x + side * sep * 0.4, y + sep * 0.9] as Pt, o: prolif * Math.sin(Math.PI * phase) };
  });

  const plateTh = lerp(BAND, BAND + 3, plaka);
  const innerOuter = INNER + BAND;
  const outer = (a: number) => outR(g, a);
  const outerB = (a: number) => outR(g, a) - plateTh;
  const STALK_A = 260;
  const stalk = stalkBridge(cx, cy, STALK_A, INNER + BAND / 2, innerOuter, outerB(STALK_A), outer(STALK_A) - plateTh / 2, 22, 14);

  const rYPrim = INNER - 4.5;
  const rYSec = lerp(rYPrim, R_SEC, secondary);
  const edgeAt = (r: number) => (Math.asin(Math.min(1, -HYPO_BOTTOM / r)) * 180) / Math.PI;
  const eLine = edgeAt(rYSec);
  const lineL: [number, number] = [180 + eLine, 90];
  const lineR: [number, number] = [360 - eLine, 450];
  const leadU = (done + 0.5 * lead) / N_LINE;
  const wY = (rY: number) => Math.sqrt(Math.max(1, rY * rY - HYPO_BOTTOM * HYPO_BOTTOM));
  const yolkPath = (rY: number) => `M${f1(cx - wY(rY))},${f1(hypoBottom)} A${rY} ${rY} 0 1 0 ${f1(cx + wY(rY))},${f1(hypoBottom)} Z`;
  // Splanchnopleure hugs the yolk sac as it shrinks; the chorionic cavity takes the freed space.
  const eY = edgeAt(rYSec + BAND);
  const wUp = Math.sqrt(Math.max(1, INNER * INNER - HYPO_BOTTOM * HYPO_BOTTOM));
  const cavity = bandAround(cx, cy, () => 0.5, outerB, STALK_A, STALK_A + 360);

  return (
    <g>
      <g opacity={villiView ? 0.45 : 1}>
        <ShellMaternal g={g} t={T12} slab={slab} />
      </g>

      {/* Chorionic cavity: one space round amnion + yolk sac, interrupted only by the connecting stalk. */}
      <Part id="korion-barrunbea">
        <path d={cavity} fill="url(#w2-g-coelom)" />
        <path d={cavity} fill="url(#w2-p-coelom)" />
      </Part>
      {/* Above the disc: the amniotic side (cap of the old blastocyst interior). */}
      <path d={`M${f1(cx - wUp)},${f1(hypoBottom)} A${INNER} ${INNER} 0 0 1 ${f1(cx + wUp)},${f1(hypoBottom)} Z`} fill="#1b2437" pointerEvents="none" />

      {/* The primary yolk sac's content clears once the new, smaller sac has closed inside it. */}
      <Part id="hasierako-bitelo-zakua" show={1 - secondary}>
        <path d={yolkPath(rYPrim)} fill="url(#w2-g-yolk)" />
      </Part>
      {/* Its old wall (Heuser's membrane) breaks into pieces that gather and round up: exocoelomic cysts. */}
      <Part id="heuser-mintza" show={1 - seg(cysts, 0.75, 1)}>
        {PIECES.map(([a0, a1], i) => {
          const ac = CYSTS[i][0];
          const k = seg(cysts, 0, 0.85);
          const b0 = lerp(a0, ac, k);
          const b1 = lerp(a1, ac, k);
          if (b1 - b0 < 0.5) return null;
          return <CellBand key={i} curve={ellipseArc(cx, cy, INNER, INNER, b0, b1)} n={Math.max(1, Math.round((b1 - b0) / 6.5))} thickness={5.5} color={HEUSER} nucleus="rgba(120,80,10,0.75)" stroke="rgba(90,60,10,0.7)" inward shape="squamous" />;
        })}
      </Part>
      <Part id="kiste-exozelomikoak" show={seg(cysts, 0.15, 0.4)}>
        {CYSTS.map(([a, r], i) => {
          const [x, y] = cystAt(g, i);
          const rr = r * seg(cysts, 0.2 + i * 0.05, 0.8 + i * 0.05);
          if (rr < 0.5) return null;
          return (
            <g key={i} transform={`rotate(${f1(a + 90)} ${f1(x)} ${f1(y)})`}>
              <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rr * 1.18)} ry={f1(rr * 0.9)} fill="url(#w2-g-yolk)" stroke={HEUSER} strokeWidth={2.2} />
              <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rr * 1.18)} ry={f1(rr * 0.9)} fill="url(#w2-g-cavity)" />
            </g>
          );
        })}
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={secondary}>
        <path d={yolkPath(rYSec)} fill="url(#w2-g-yolk)" />
      </Part>

      <Part id="korion-plaka">
        <g opacity={lerp(0.7, 1, plaka)}>
          <path d={bandAround(cx, cy, outerB, outer, STALK_A, STALK_A + 360)} fill="url(#w2-p-meso)" />
          <path d={bandAround(cx, cy, outerB, outer, STALK_A, STALK_A + 360)} fill="url(#w2-g-sheen)" />
          <g fill="none" stroke={MESO_EDGE} strokeWidth={1}>
            <path d={arcAround(cx, cy, outerB, STALK_A, STALK_A + 360)} />
          </g>
        </g>
      </Part>
      <Part id="somatopleura-kanpokoa">
        <path d={bandAround(cx, cy, () => INNER, () => innerOuter, AMNION_L, AMNION_R)} fill="url(#w2-p-meso)" stroke={MESO_EDGE} strokeWidth={1} />
      </Part>
      <Part id="esplaknopleura-kanpokoa">
        <path d={bandAround(cx, cy, () => rYSec, () => rYSec + BAND, 360 - eY, 540 + eY)} fill="url(#w2-p-meso)" stroke={MESO_EDGE} strokeWidth={1} />
      </Part>
      <Part id="finkapen-pedikulua">
        <path d={stalk.d} fill="url(#w2-p-meso)" />
        <g fill="none" stroke={MESO_EDGE} strokeWidth={1.1}>
          <path d={stalk.left} />
          <path d={stalk.right} />
        </g>
      </Part>

      {/* Syncytium with its blood-filled lacunar network (as day 12 left it); the lacunae widen round the growing villi. */}
      <ShellSyncytium g={g} t={T12} reduced={reduced} boost={villi} mute={villiView ? 1 : 0} />

      <Part id="biloxka-primarioa" show={seg(villi, 0, 0.1)}>
        {VILLI_A.map((_, i) => {
          const v = villus(g, i, villi);
          if (v.len < 1.5) return null;
          const sheath = tube(v.pts, (u) => (v.core + 7) * (1 - 0.25 * u));
          const core = tube(v.pts, (u) => v.core * (1 - 0.2 * u));
          // Cell borders across the column and one nucleus per cell.
          const cells = Math.max(1, Math.floor(v.len / 8));
          return (
            <g key={i}>
              {/* Syncytial covering (same tissue as the shell, so it merges with it where there is no lacuna). */}
              <path d={sheath} fill="url(#w2-p-syn)" stroke={villiView ? INK.synEdge : 'none'} strokeWidth={0.8} />
              <path d={sheath} fill="url(#w2-p-syn2)" />
              <path d={core} fill={C.cyto} stroke={villiView ? '#e9fff0' : INK.cytoEdge} strokeWidth={villiView ? 1.1 : 0.8} />
              <path d={core} fill="url(#w2-g-cell)" />
              {Array.from({ length: cells }, (_, j) => {
                const r = g.Rc + 4 + j * 8;
                const [x, y] = polar(g, v.a, r);
                const [x2, y2] = polar(g, v.a, r + 4);
                const n: Pt = [-Math.sin(rad(v.a)), Math.cos(rad(v.a))];
                const h = v.core * 0.42;
                return (
                  <g key={j}>
                    {j > 0 && <path d={`M${f1(x - n[0] * h)},${f1(y - n[1] * h)} L${f1(x + n[0] * h)},${f1(y + n[1] * h)}`} stroke={INK.cytoEdge} strokeWidth={0.7} />}
                    <ellipse cx={f1(x2)} cy={f1(y2)} rx={f1(Math.min(2.6, v.core * 0.28))} ry={1.8} transform={`rotate(${f1(v.a + 90)} ${f1(x2)} ${f1(y2)})`} fill={INK.cytoNucleus} opacity={0.8} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </Part>

      <Part id="zitotrofoblastoa">
        <CellRing cx={cx} cy={g.cyC} r={Rc} th={CYTO} n={44} seed={8} divide={1} />
      </Part>

      {/* Korioia: syncytium + cytotrophoblast + chorionic plate — the three layers light up together. */}
      <Part id="korioia" show={chorion}>
        <path d={`${syncytioOuter(g, T12)}${radialPath(cx, cy, outerB, 4)}`} fill="rgba(255,236,214,0.1)" fillRule="evenodd" />
      </Part>

      <Part id="amnios-barrunbea">
        <path d={lens} fill="#2a3f6e" />
        <path d={lens} fill="url(#w2-g-amnion)" />
        <CellBand curve={ellipseArc(cx, cy, INNER, INNER, 180 + (Math.asin(72 / INNER) * 180) / Math.PI, 360 - (Math.asin(72 / INNER) * 180) / Math.PI)} n={14} thickness={5} color={C.amnioblast} shape="squamous" inward />
      </Part>
      <Part id="epiblastoa">
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
        {/* The new population lines Heuser's membrane from inside and, once closed, is the wall of the secondary yolk sac. */}
        {[lineL, lineR].map(([a0, a1], i) => (
          <CellBand key={i} curve={ellipseArc(cx, cy, rYSec, rYSec, a0, a1)} n={N_LINE} grow={done / N_LINE} thickness={5} color={C.hypoblast} inward shape="cuboidal" />
        ))}
        {done < N_LINE &&
          [lineL, lineR].map(([a0, a1], i) => {
            const a = lerp(a0, a1, leadU);
            const [x, y] = polarE(g, a, rYSec - 2.6);
            return <Cell key={i} x={x} y={y} r={3.2} rx={5.2} ry={3} rotate={a + 90} color="#fbe3a0" nucleus="rgba(90,60,10,0.8)" nucleusScale={0.5} opacity={seg(lead, 0, 0.3) * seg(t, W.lining[0], W.lining[0] + 0.004)} />;
          })}
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
          strokeWidth={1}
          opacity={0.55}
        />
      </Part>

      <g opacity={villiView ? 0.45 : 1}>
        <ShellDecidua g={g} t={T12} slab={slab} />
      </g>
    </g>
  );
}

/** Surface and lumen; the fibrin plug's last trace goes as the epithelium closes; a small bleed at the end. */
function Surface({ t, slab = 'm-slab' }: { t: number; slab?: string }) {
  const heal = s(t, W.heal);
  const bulge = lerp(BULGE, BULGE13, heal);
  const bleed = s(t, W.bleed);
  const y0 = surfaceAt(W2.cx, bulge);
  return (
    <>
      <EndometriumFront gap={lerp(6, 0, heal)} bulge={bulge} slab={slab} />
      <FibrinPlug half={lerp(13, 4, heal)} bulge={bulge} show={1 - heal} />
      {bleed > 0.01 && (
        <Part id="endometrio-epitelioa">
          {/* Blood seeping out at the implantation site (more blood reaches the lacunae): a thin trickle and a small pool. */}
          <path d={tube([[W2.cx - 4, y0 - 10], [W2.cx - 2, y0 + 4], [W2.cx + 3, y0 + 4 + 22 * bleed]], (u) => 3.2 - 1.4 * u)} fill="url(#w2-p-rbc)" />
          <ellipse cx={W2.cx + 6} cy={f1(y0 + 34)} rx={f1(26 * bleed)} ry={f1(6 * bleed)} fill="url(#w2-p-rbc)" opacity={seg(bleed, 0.3, 1)} />
          <ellipse cx={W2.cx + 6} cy={f1(y0 + 34)} rx={f1(26 * bleed)} ry={f1(6 * bleed)} fill="url(#w2-g-blood)" opacity={seg(bleed, 0.3, 1)} />
        </Part>
      )}
    </>
  );
}

type At = (x: number, y: number) => [number, number];
/** 1 well inside the frame, fading to 0 as a point reaches its edge. */
const inFrame = ([x, y]: Pt) => seg(Math.min(x - 12, 988 - x, y - 12, 628 - y), 0, 24);
function makeL(at: At) {
  return function label(id: string, x: number, y: number, p: Pt, show = 1, key = id) {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={ax} ay={ay} show={show * inFrame([ax, ay])} />;
  };
}

function anchors(t: number) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY } = g;
  const secondary = s(t, W.secondary);
  const lining = s(t, W.lining);
  const rYSec = lerp(INNER - 4.5, R_SEC, secondary);
  const plateTh = lerp(BAND, BAND + 3, s(t, W.plaka));
  return {
    g,
    lining,
    /** On the new hypoblast lining (inner face of Heuser's membrane / wall of the secondary sac). */
    line: (a: number) => polarE(g, a, rYSec - 2.5),
    /** On the splanchnopleure, which follows the yolk sac as it shrinks. */
    splanch: (a: number) => polarE(g, a, rYSec + BAND / 2),
    /** On Heuser's membrane. */
    heuser: (a: number) => polarE(g, a, INNER - 2.2),
    /** On the chorionic plate, mid-thickness. */
    plate: (a: number) => polarE(g, a, outR(g, a) - plateTh / 2),
    villi: g.villi,
    plaka: s(t, W.plaka),
    secondary,
    cysts: s(t, W.cysts),
    chorion: s(t, W.chorion),
    bleed: s(t, W.bleed),
    cyto: (a: number) => polar(g, a, g.Rc - CYTO / 2),
    syn: (a: number) => synAt(g, a, 0.5),
    /** On villus i, at fraction f of its length. */
    villus: (i: number, f = 0.6) => polar(g, VILLI_A[i], g.Rc + villus(g, i, g.villi).len * f),
    /** A point in the mesoderm/cavity: fraction f from the embryo complex to the cyto (+ offset px). */
    meso: (a: number, f: number, off = 0) => polarE(g, a, lerp(INNER, outR(g, a), f) + off),
    amnios: [cx - 22, (cy - INNER + epiTop) / 2 + 2] as Pt,
    epi: [cx + 38, (epiTop + discY) / 2] as Pt,
    yolk: [cx - 12, g.hypoBottom + 40] as Pt,
    stalk: polarE(g, 260, (INNER + outR(g, 260)) / 2),
    cyst: (i: number) => cystAt(g, i),
  };
}

export function Day13Section(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  // Pulled back a little: on day 13 the whole conceptus (shell, lacunae, sinusoids) fits in the picture, as in Langman 4-6.
  const z = zoom(500, 290, 0.88, 500, 312);
  const L = makeL(z.at);
  // The chorionic plate's own step (named here; its window W.plaka), then back to the general note.
  const plateNote = seg(t, W.plaka[0], W.plaka[0] + 0.02) * (1 - seg(t, 0.5, 0.52));
  const bleedNote = seg(t, W.bleed[0], W.bleed[0] + 0.02);
  return (
    <g>
      <g transform={z.transform}>
        <EndometriumBack decidua={1} spread={1} bulge={BULGE13} />
        <Day13Drawing {...props} />
        <Surface t={t} />
      </g>
      {L('endometrio-estroma', 190, 50, [300, 60])}
      {L('umetoki-guruina', 190, 100, [236, 250])}
      {L('endometrio-epitelioa', 190, 150, [300, surfaceAt(300, BULGE13) - 4])}
      {L('finkapen-pedikulua', 190, 250, k.stalk)}
      {L('sinzitiotrofoblastoa', 190, 380, k.syn(150))}
      {L('biloxka-primarioa', 190, 430, k.villus(1), k.villi)}
      {L('zitotrofoblastoa', 190, 475, k.cyto(136))}
      {L('korion-plaka', 190, 520, k.plate(158), k.plaka)}
      {L('mutur-enbrionarioa', 810, 250, k.cyto(276))}
      {L('korioia', 810, 315, polar(k.g, 345, k.g.Rc + 4), k.chorion)}
      {L('korion-barrunbea', 810, 380, k.meso(8, 0.5))}
      {L('amnios-barrunbea', 810, 430, k.amnios)}
      {L('epiblastoa', 810, 475, k.epi)}
      {L('bitelo-zaku-sekundarioa', 810, 520, k.yolk, k.secondary)}
      {L('kiste-exozelomikoak', 810, 565, k.cyst(0), k.cysts)}
      <Note x={500} y={585} tone="dim" show={(1 - plateNote) * (1 - bleedNote)}>
        Blastozistoa guztiz sartuta dago; umetokiaren paretan goragunea antzematen da
      </Note>
      <Note x={500} y={585} tone="accent" show={plateNote}>
        Zitotrofoblastoaren barruko aurpegia estaltzen duen enbrioi kanpoko mesodermoa = korion plaka
      </Note>
      <Note x={500} y={585} tone="warn" show={bleedNote}>
        Habiratze-guneko odol-jario txikia: ez nahastu hilekoarekin
      </Note>
    </g>
  );
}

export function Day13Villi(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const c = polar(k.g, 286, k.g.Rc + 18);
  const z = zoom(c[0], c[1], 2.05, 500, 245);
  const L = makeL(z.at);
  // The transverse cut belongs to its own step (.22): an inset over a darkened scene, gone again before the next step.
  const cut = s(t, W.cut) * (1 - seg(t, 0.3, 0.315));
  // Labels hand over without overlapping: the whole-view names leave before the cut's names arrive.
  const rest = 1 - seg(cut, 0, 0.5);
  const cutL = seg(cut, 0.5, 1);
  const px = 610;
  const py = 300;
  const lens = (r0: number, a1: number, a2: number, k1: number, k2: number) => radialPath(px, py, (a) => r0 * (1 + k1 * Math.sin(rad(a) * 4 + a1) + k2 * Math.sin(rad(a) * 7 + a2)) * lerp(0.85, 1, cut), 8);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        {/* Maternal tissue sits back in this view: the cytotrophoblast columns are the subject. */}
        <g opacity={0.5}>
          <EndometriumBack decidua={1} spread={1} bulge={BULGE13} />
        </g>
        <Day13Drawing {...props} villiView />
      </g>
      {cut > 0.01 && (
        <g opacity={cut}>
          <rect x={0} y={0} width={1000} height={640} fill="#0b1120" opacity={0.72} />
          {/* Inset (round, like a microscope field): a pool of maternal blood (lacuna) with three primary villi cut across. */}
          <circle cx={px} cy={py} r={f1(168 * lerp(0.85, 1, cut))} fill="#0d1424" stroke="#dbe7ff" strokeOpacity={0.55} strokeWidth={1.4} />
          <path d={lens(134, 2, 1, 0.07, 0.04)} fill="url(#w2-p-rbc)" />
          <path d={lens(134, 2, 1, 0.07, 0.04)} fill="url(#w2-g-blood)" />
          <VillusSection x={px - 40} y={py - 16} r={60 * lerp(0.85, 1, cut)} seed={0.6} />
          <VillusSection x={px + 62} y={py + 50} r={34 * lerp(0.85, 1, cut)} seed={2.1} />
          <VillusSection x={px + 64} y={py - 62} r={26 * lerp(0.85, 1, cut)} seed={4.0} />
        </g>
      )}
      {L('zitotrofoblastoa', 180, 120, k.cyto(262), rest)}
      {L('biloxka-primarioa', 180, 180, k.villus(6), k.villi * rest, 'villus-long')}
      {L('sinzitiotrofoblastoa', 180, 240, k.syn(276), rest, 'syn-long')}
      {L('finkapen-pedikulua', 180, 300, k.stalk, rest)}
      {L('amnios-barrunbea', 180, 360, k.amnios, rest)}
      {L('epiblastoa', 180, 420, k.epi, rest)}
      {L('hipoblastoa', 180, 480, [k.g.cx - 30, (k.g.discY + k.g.hypoBottom) / 2], rest)}
      {/* In the cut: core = cytotrophoblast (light), coat = syncytiotrophoblast (dark). */}
      <Label key="syn-cut" id="sinzitiotrofoblastoa" x={180} y={230} ax={px - 40} ay={py - 16 - 54} show={cutL} />
      <Label key="cyto-cut" id="zitotrofoblastoa" x={180} y={310} ax={px - 40 + 14} ay={py - 4} show={cutL} />
      <Label key="villus-cut" id="biloxka-primarioa" x={180} y={390} ax={px + 62} ay={py + 50 + 34} show={cutL} />
      {L('korioia', 810, 250, polar(k.g, 300, k.g.Rc + 4), k.chorion * rest)}
      {L('korion-plaka', 810, 330, k.meso(300, 1, -3), k.plaka * rest)}
      {L('korion-barrunbea', 810, 400, k.meso(305, 0.5), rest)}
      {L('bitelo-zaku-sekundarioa', 810, 470, [k.g.cx + 20, k.g.hypoBottom + 14], k.secondary * rest)}
      <Note x={500} y={600} tone="accent" show={k.villi * rest}>
        Zitotrofoblastoaren zelulak sinzitiotrofoblastoaren erdian sartzen dira: biloxka primarioak
      </Note>
      <Note x={500} y={600} tone="accent" show={cut}>
        Zeharkako mozketa: erdian zitotrofoblastoa (argia), kanpoan sinzitiotrofoblastoa (iluna)
      </Note>
    </g>
  );
}

export function Day13Yolk(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  // Wide enough to keep the connecting stalk (top) and the pinched-off cysts (bottom) in the picture.
  const z = zoom(cx - 10, cy + 12, 1.7, 500, 320);
  const L = makeL(z.at);
  const liningNote = seg(t, W.lining[0], W.lining[0] + 0.01) * (1 - k.secondary);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={1} spread={1} bulge={BULGE13} />
        <Day13Drawing {...props} />
        <Surface t={t} />
      </g>
      {L('hasierako-bitelo-zakua', 180, 150, [cx - 30, k.g.hypoBottom + 40], 1 - k.secondary)}
      {L('bitelo-zaku-sekundarioa', 198, 200, k.yolk, k.secondary)}
      {L('kiste-exozelomikoak', 180, 260, k.cyst(2), k.cysts)}
      {L('hipoblastoa', 180, 400, k.lining > 0.12 ? k.line(194) : [cx - k.g.wHypo + 8, k.g.hypoBottom - 4])}
      {L('esplaknopleura-kanpokoa', 800, 300, k.splanch(14))}
      {L('heuser-mintza', 800, 400, k.heuser(28), 1 - seg(k.cysts, 0.3, 0.6))}
      {L('kiste-exozelomikoak', 800, 460, k.cyst(1), k.cysts, 'cyst-r')}
      {L('finkapen-pedikulua', 800, 150, k.stalk)}
      {L('korion-barrunbea', 800, 200, k.meso(310, 0.5))}
      <Note x={500} y={585} tone="accent" show={liningNote}>
        Hipoblastoko zelulak ugaldu eta migratu egiten dira: Heuser-en mintzaren barruko aurpegia estaltzen dute
      </Note>
      <Note x={500} y={585} tone="accent" show={k.secondary * (1 - seg(t, 0.6, 0.62))}>
        Hasierako bitelo zakua txikituz doa: bitelo zaku sekundarioa (behin betikoa) sortzen da
      </Note>
      <Note x={500} y={585} tone="accent" show={seg(t, 0.6, 0.62)}>
        Hasierako bitelo zakuaren hondarrak korion barrunbean: kiste exozelomikoak
      </Note>
    </g>
  );
}
