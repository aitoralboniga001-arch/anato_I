'use client';

import { Arrow, C, Label, Mark, Note, OnTop, Part, clamp, lerp, lin, seg, smoothPath, type SceneProps } from '@/components/kit';
import { useId, type ReactNode } from 'react';
import { f1, type Pt } from './common';
import { K, NS, NeuruDrawing, SX, TE, crestCells, neuruGeo, type NeuruParams } from './NeuruSection';

/**
 * Stage `neurulazioa` — plaka neurala → ildo neurala → tolesdura neuralak → hodi neurala,
 * covered by azaleko ektodermoa (notes §2, figure 3). Two coherent views: a transverse
 * sequence (plate → groove → folds → tube) and a dorsal view of fusion + the two neuropores.
 */

// ---------------------------------------------------------------------------
// Transverse view — one continuous neuroepithelium + surface ectoderm sheet (NeuruSection).
// ---------------------------------------------------------------------------

/**
 * Step windows (the stage beats): .00 induction → plate · .12 groove · .30 folds rise and approach ·
 * .44 folds meet (tube) · .62 crest cells leave the junction · .68 tube separates under a continuous
 * surface ectoderm · .80 crest cells migrate · .90 neuropores (dorsal view). Each change is finished by
 * the step's complete frame (next beat − 0.035).
 */
function neuruParams(t: number): NeuruParams {
  return {
    plate: seg(t, 0, 0.085),
    groove: seg(t, 0.12, 0.265),
    folds: seg(t, 0.3, 0.405),
    close: seg(t, 0.44, 0.585),
    detach: seg(t, 0.68, 0.765),
    oval: seg(t, 0.68, 0.78),
    somite: seg(t, 0.12, 0.4),
    lift: seg(t, 0.62, 0.655),
  };
}

/**
 * Camera: push in on the neural plate for the folding itself (plate → groove → folds → tube → covered tube),
 * so the student sees the sheet bend at a readable size; pull back to the whole section for the migration.
 */
function camera(t: number) {
  const z = seg(t, 0.01, 0.075) * (1 - seg(t, 0.795, 0.83));
  const s = lerp(1, 1.55, z);
  const fy = 235;
  const ty = lerp(fy, 282, z);
  const Z = (q: Pt): Pt => [500 + s * (q[0] - 500), ty + s * (q[1] - fy)];
  return { view: `translate(500 ${ty.toFixed(2)}) scale(${s.toFixed(4)}) translate(-500 ${(-fy).toFixed(2)})`, Z, U: 1 / s, z };
}

const part = (id: string, node: ReactNode, show = 1) => (
  <Part id={id} show={show}>
    {node}
  </Part>
);

export function NeurulationTransverse({ t, reduced }: SceneProps) {
  const g = neuruGeo(neuruParams(t));
  const { view, Z, U, z } = camera(t);
  const ZX = (q: Pt) => Z(SX(q));
  const tube = g.p.close > 0.9;
  const foldsOn = t >= 0.3;
  const induce = seg(t, 0, 0.03) * (1 - seg(t, 0.12, 0.16));
  const rise = seg(t, 0.3, 0.33) * (1 - seg(t, 0.44, 0.47));
  const zip = seg(t, 0.44, 0.47) * (1 - seg(t, 0.56, 0.6));
  const appear = seg(t, 0.62, 0.655);
  const migrate = seg(t, 0.8, 0.865);
  const routes = seg(t, 0.8, 0.83) * (1 - seg(t, 0.9, 0.93));
  const cells = appear > 0.01 ? crestCells(g, appear, g.p.detach, migrate) : [];
  const tipR = SX(g.tipA);
  const tipL = SX(g.mirror(g.tipA));
  const midOf = (i: number, sd: 1 | -1): Pt => {
    const q: Pt = [(g.ap[i][0] + g.bas[i][0]) / 2, (g.ap[i][1] + g.bas[i][1]) / 2];
    return sd > 0 ? q : g.mirror(q);
  };
  const crestR = cells.find((c) => c.side > 0);
  const foldAt = (sd: 1 | -1) => midOf(NS - 6, sd);

  // Drawn inside the camera (pre-zoom screen space); strokes divided by the magnification keep their weight.
  const over = (
    <g>
      {/* Induction: the notochord signals to the ectoderm above it, which thickens into the plate. */}
      {induce > 0.02 &&
        ([-1, 1] as const).map((sd) => (
          <Arrow key={sd} from={SX([sd * 10, g.noto[1] - 6])} to={SX([sd * 34, g.TNt - 4])} bend={sd * -0.35} color="#e8eefc" width={2.4 * U} head={8 * U} show={induce} flow={!reduced} />
        ))}
      {/* Folds rising and approaching each other. */}
      {rise > 0.02 &&
        ([-1, 1] as const).map((sd) => {
          const tp = sd > 0 ? tipR : tipL;
          return <Arrow key={sd} from={[tp[0] + sd * 52, tp[1] + 34]} to={[tp[0] + sd * 22, tp[1] - 20]} bend={sd * 0.3} color="#a9c3ff" width={2.6 * U} head={9 * U} show={rise} flow={!reduced} />;
        })}
      {/* The folds meet in the midline. */}
      {zip > 0.02 &&
        ([-1, 1] as const).map((sd) => {
          const tp = sd > 0 ? tipR : tipL;
          return <Arrow key={sd} from={[tp[0] + sd * 34, tp[1] - 20]} to={[500 + sd * 10, tp[1] - 16]} bend={sd * 0.2} color="#a9c3ff" width={2.4 * U} head={8 * U} show={zip * clamp(Math.abs(tp[0] - 500) / 20)} />;
        })}
      {/* The folds: lit where they rise (no drawn ring). */}
      <Mark id="tolesdura-neuralak" x={SX(foldAt(1))[0]} y={SX(foldAt(1))[1]} rx={24} show={rise} />
      <Mark id="tolesdura-neuralak" x={SX(foldAt(-1))[0]} y={SX(foldAt(-1))[1]} rx={24} show={rise} />

      {/* Migration routes: dorsolateral (under the ectoderm) and ventral (between tube and somite). */}
      {routes > 0.02 &&
        ([-1, 1] as const).map((sd) => (
          <g key={sd}>
            <Arrow from={SX([sd * 18, g.roofBasal - 8])} to={SX([sd * 170, g.ectoUnder(170) + 10])} bend={sd * 0.12} color="#2dd4bf" width={2.2 * U} head={8 * U} show={routes} flow={!reduced} />
            <Arrow from={SX([sd * 30, g.roofBasal + 10])} to={SX([sd * 54, 96])} bend={sd * -0.15} color="#2dd4bf" width={2.2 * U} head={8 * U} show={routes} flow={!reduced} />
          </g>
        ))}

      {/* Neural crest cells: released at the junction (EMT), then migrating. */}
      {cells.length > 0 &&
        part(
          'gandor-neurala',
          <g>
            {cells.map((c, i) => {
              const [X, Y] = SX(c.q);
              const moving = migrate > 0.02 && migrate < 0.98;
              const rot = moving ? (c.route === 'dl' ? c.side * 10 : c.side * 70) : 0;
              return (
                <g key={i}>
                  <ellipse cx={X} cy={Y} rx={(moving ? 5.6 : 4.6) * K} ry={3.4 * K} transform={`rotate(${rot} ${f1(X)} ${f1(Y)})`} fill={C.neuralCrest} stroke="#0f766e" strokeWidth={1 * U} />
                  <circle cx={X} cy={Y} r={1.6 * K} fill="#0f4f49" />
                </g>
              );
            })}
          </g>,
          appear,
        )}
    </g>
  );

  // Label anchors, mapped through the camera; the ectoderm anchor slides inward while zoomed so it stays in frame.
  const ecto = ZX([-lerp(210, 132, z), g.ectoUnder(lerp(210, 132, z)) - TE / 2]);
  const plate = ZX(midOf(10, -1));
  const groove = ZX([0, g.tipA[1] * 0.35 - 2]);
  const som = ZX(g.mirror(g.somC));
  const noto = ZX(g.noto);
  const wall = ZX(midOf(NS >> 1, 1));
  const fold = ZX(foldAt(1));
  const ao = ZX(g.aorta);
  return (
    <g>
      <NeuruDrawing g={g} part={part} plateId="plaka-neurala" foldId={foldsOn ? 'tolesdura-neuralak' : 'plaka-neurala'} tube={tube} aortaShow={seg(t, 0.3, 0.6)} over={over} view={view} />
      <Note x={500} y={612} show={induce} tone="accent">
        Notokorda → ektodermoa: indukzioa. Ektodermoaren eremu hau plaka neurala bihurtzen da.
      </Note>
      <Note x={500} y={612} show={seg(t, 0.62, 0.65) * (1 - seg(t, 0.68, 0.7))} tone="accent">
        Fusio-lekuko zelulak askatzen dira (epitelio → mesenkima): gandor neurala
      </Note>
      <Note x={500} y={612} show={seg(t, 0.8, 0.83) * (1 - seg(t, 0.9, 0.92))} tone="accent">
        Bi bide: ektodermoaren azpitik (dortsolaterala) eta hodiaren eta somitaren artetik (bentrala)
      </Note>
      <Label id="azaleko-ektodermoa" x={190} y={110} ax={ecto[0]} ay={ecto[1]} />
      <Label id="plaka-neurala" x={190} y={160} ax={plate[0]} ay={plate[1]} show={1 - seg(t, 0.3, 0.45)} />
      <Label id="ildo-neurala" x={190} y={205} ax={groove[0]} ay={groove[1]} show={seg(t, 0.12, 0.16) * (1 - seg(t, 0.5, 0.56))} />
      <Label id="somitak" x={190} y={470} ax={som[0]} ay={som[1]} show={seg(t, 0.15, 0.3)} />
      <Label id="notokorda" x={190} y={520} ax={noto[0] - 8} ay={noto[1] + 4} />
      <Label id="hodi-neurala" x={810} y={110} ax={wall[0]} ay={wall[1]} show={seg(t, 0.52, 0.58)} />
      <Label id="tolesdura-neuralak" x={810} y={242} ax={fold[0]} ay={fold[1]} show={seg(t, 0.3, 0.34) * (1 - seg(t, 0.54, 0.58))} />
      {crestR && <Label id="gandor-neurala" x={810} y={205} ax={ZX(crestR.q)[0]} ay={ZX(crestR.q)[1]} show={appear} />}
      <Label id="aorta-dortsalak" x={810} y={500} ax={ao[0] + 10} ay={ao[1]} show={seg(t, 0.4, 0.6)} small />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Dorsal view: fusion zipping cranially and caudally from the future neck, with the two
// transient neuropores (notes: closure days are approximate — "inguruan").
// ---------------------------------------------------------------------------

const D_TOP = 112;
const D_BOTTOM = 548;
const ZIP_START = 0.44;

function yAt(frac: number) {
  return lerp(D_TOP, D_BOTTOM, frac);
}
const sm = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
/** Embryo half-width (Langman 6-3/6-4): broad head folds, a waist at the future neck, slender trunk, tapering tail. */
function bodyHalfWidth(frac: number) {
  const head = 30 * sm((0.3 - frac) / 0.22);
  const tail = 38 * sm((frac - 0.72) / 0.3);
  return (100 + head - tail) * Math.pow(Math.sin(Math.PI * clamp((frac + 0.065) / 1.13, 0, 1)), 0.42);
}
/** Neural plate half-width: wide brain plates cranially, narrow over the spinal cord, a little wider at the caudal end. */
function plateHalfWidth(frac: number) {
  return (24 + 50 * sm((0.36 - frac) / 0.3) + 8 * sm((frac - 0.86) / 0.12)) * (0.5 + 0.5 * sm(frac / 0.16));
}
/** Neuropores exist once fusion has left just two open ends. */
const poresOn = (t: number) => seg(t, 0.52, 0.58);

/** The folds meet at the future neck in the fusion step (.44) and zip both ways until the neuropores close. */
type Zip = { cr: number; ca: number } | null;
/**
 * The fusion step zips the folds from the neck until only the two ends are open (the neuropores);
 * they stay open until the neuropore step (.9), which closes the cranial one (≈25th day) and then
 * the caudal one (≈28th).
 */
const zipOf = (t: number): Zip =>
  t < 0.44 ? null : { cr: 0.3 * seg(t, 0.44, 0.58) + 0.09 * seg(t, 0.9, 0.95), ca: 0.4 * seg(t, 0.44, 0.58) + 0.11 * seg(t, 0.95, 0.995) };

function localClosure(frac: number, spread: Zip) {
  if (!spread) return 0;
  const from = ZIP_START - spread.cr;
  const to = ZIP_START + spread.ca;
  if (frac >= from && frac <= to) return 1;
  const d = frac < from ? from - frac : frac - to;
  return clamp(1 - d / 0.1);
}

/** Distance of a neural fold's crest from the midline. */
const ridgeX = (frac: number, spread: Zip, approach: number) => plateHalfWidth(frac) * (1 - approach * 0.32) * (1 - localClosure(frac, spread) * 0.92);

/** A fold's crest over [a, b] (arc fractions). */
function ridgePts(side: -1 | 1, spread: Zip, approach = 0, n = 40, a = 0.03, b = 0.97) {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const frac = a + ((b - a) * i) / n;
    pts.push([500 + side * ridgeX(frac, spread, approach), yAt(frac)]);
  }
  return pts;
}
const polyD = (pts: Pt[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`).join('');

/** Where the folds have effectively met (a tube), from the zipper's two fronts. */
const FUSED = 0.75;
function fusedRange(spread: Zip): [number, number] | null {
  if (!spread) return null;
  const k = (1 - FUSED) * 0.1; // localClosure falls to FUSED this far beyond each front
  return [Math.max(0.03, ZIP_START - spread.cr - k), Math.min(0.97, ZIP_START + spread.ca + k)];
}

/** Neural tube half-width: broad where the brain will be, narrow over the spinal cord. */
const tubeHW = (frac: number) => 9 + 16 * sm((0.34 - frac) / 0.28) + 2 * sm((frac - 0.88) / 0.1);

/** Filled tube between two arc fractions, with rounded ends. */
function tubeD(a: number, b: number, f: (frac: number) => number) {
  const n = 48;
  const fr = Array.from({ length: n + 1 }, (_, i) => lerp(a, b, (1 - Math.cos((Math.PI * i) / n)) / 2));
  const L = yAt(b) - yAt(a);
  const w = (frac: number) => {
    const y = yAt(frac) - yAt(a);
    const r = Math.min(f(frac), L / 2);
    const cap = (d: number) => (d >= r ? 1 : Math.sqrt(Math.max(0, 1 - ((r - d) / r) ** 2)));
    return Math.min(f(frac), L / 2 + 0.5) * cap(y) * cap(L - y);
  };
  return smoothPath([...fr.map((q): Pt => [500 - w(q), yAt(q)]), ...[...fr].reverse().slice(1, -1).map((q): Pt => [500 + w(q), yAt(q)])], true, 0.5);
}

/** Somite pairs present at t: about 4 when the folds rise, 7 when they meet (≈22 days), ~16 by the neuropores. */
const somiteCount = (t: number) => 3 + 4 * seg(t, 0.15, 0.44) + 9 * seg(t, 0.44, 1);

function DorsalDrawing({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const spread = zipOf(t);
  const cranialOpen = 1 - localClosure(0.05, spread);
  const caudalOpen = 1 - localClosure(0.95, spread);
  // Folds rise and draw towards each other before they touch at the future neck.
  const approach = seg(t, 0.3, 0.4);
  const rise = seg(t, 0.12, 0.4); // how raised the folds look
  const streak = 1 - seg(t, 0.3, 0.6); // the primitive streak remnant at the caudal end, regressing

  // Body outline with rounded head and tail ends; the cut edge of the amnion just outside it.
  const bf = Array.from({ length: 81 }, (_, i) => lerp(-0.065, 1.065, (1 - Math.cos((Math.PI * i) / 80)) / 2));
  const outline = (grow: number) =>
    smoothPath([...bf.map((q): Pt => [500 - bodyHalfWidth(q) - grow, yAt(q) + (q < 0.5 ? -grow : grow) * 0.6]), ...[...bf].reverse().slice(1, -1).map((q): Pt => [500 + bodyHalfWidth(q) + grow, yAt(q) + (q < 0.5 ? -grow : grow) * 0.6])], true, 0.5);

  // Only the stretch the zipper has already closed is tube; the rest is still open plate / folds.
  const fused = fusedRange(spread);
  const spans: [number, number][] = !fused
    ? [[0.03, 0.97]]
    : ([
        [0.03, fused[0] + 0.01],
        [fused[1] - 0.01, 0.97],
      ] as [number, number][]).filter(([a, b]) => b - a > 0.012);
  const ridges = (side: -1 | 1) => spans.map(([a, b]) => ridgePts(side, spread, approach, fused ? 18 : 44, a, b));
  // The open plate / groove between the folds, rounded at both ends.
  const openPlate = () => {
    const fr = Array.from({ length: 49 }, (_, i) => 0.03 + (0.94 * i) / 48);
    const side = (sd: number) => fr.map((q): Pt => [500 + sd * ridgeX(q, spread, approach), yAt(q)]);
    return smoothPath([[500, yAt(0.03) - 6], ...side(-1), [500, yAt(0.97) + 6], ...side(1).reverse()], true, 0.5);
  };
  const plateFade = 1 - seg(Math.min(localClosure(0.03, spread), localClosure(0.97, spread)), 0.6, 0.8);

  const nSom = somiteCount(t);
  const somites = Array.from({ length: 16 }, (_, i) => {
    const frac = 0.31 + i * 0.034;
    const o = clamp(nSom - i);
    return { frac, o };
  }).filter((s) => s.o > 0.01);

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-body`} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#24375f" />
          <stop offset="100%" stopColor="#111b30" />
        </radialGradient>
        <linearGradient id={`${uid}-ridge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2c4fc4" />
          <stop offset="50%" stopColor="#8fb0ff" />
          <stop offset="100%" stopColor="#2c4fc4" />
        </linearGradient>
        <linearGradient id={`${uid}-tube`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2546b0" />
          <stop offset="42%" stopColor="#5a7ff0" />
          <stop offset="58%" stopColor="#5a7ff0" />
          <stop offset="100%" stopColor="#2546b0" />
        </linearGradient>
        <linearGradient id={`${uid}-som`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0606a" />
          <stop offset="100%" stopColor="#b52a35" />
        </linearGradient>
      </defs>

      {/* cut edge of the amnion, then the embryo's dorsal surface (surface ectoderm) */}
      <path d={outline(10)} fill="none" stroke={C.mesoExtra} strokeWidth={5} opacity={0.55} />
      <path d={outline(10)} fill="none" stroke={C.amnioblast} strokeWidth={1.6} opacity={0.6} />
      <path d={outline(0)} fill={`url(#${uid}-body)`} stroke="rgba(122,167,245,0.5)" strokeWidth={1.4} />

      {/* primitive streak remnant at the caudal end (regresses as the folds form) */}
      {streak > 0.02 && <path d={`M500,${f1(yAt(0.99))}L500,${f1(yAt(1.05))}`} stroke="#c9d6f5" strokeWidth={3} strokeLinecap="round" opacity={0.45 * streak} />}

      {/* Somites: pairs appearing cranio-caudally beside the neural folds. */}
      <Part id="somitak" show={seg(t, 0.15, 0.2)}>
        {somites.map(({ frac, o }, i) => {
          const y = yAt(frac);
          const x = Math.max(ridgeX(frac, spread, approach) + 9, tubeHW(frac) + 6);
          const h = 13.5;
          const w = 19 - i * 0.25;
          return (
            <g key={i} opacity={o}>
              {[-1, 1].map((sd) => (
                <rect key={sd} x={sd > 0 ? 500 + x : 500 - x - w} y={y - h / 2} width={w} height={h} rx={5.5} fill={`url(#${uid}-som)`} stroke="rgba(90,20,30,0.6)" strokeWidth={0.9} />
              ))}
            </g>
          );
        })}
      </Part>

      {/* Open neural plate / groove between the folds. */}
      <Part id={t < 0.12 ? 'plaka-neurala' : 'ildo-neurala'}>
        <path d={openPlate()} fill={C.neural} opacity={lerp(0.55, 0.3, rise) * plateFade} />
        <path d={openPlate()} fill="#0a1430" opacity={0.55 * rise * plateFade} />
        {t >= 0.12 && <path d={`M500,${f1(yAt(0.04))} L500,${f1(yAt(0.96))}`} stroke="#050a18" strokeWidth={2.4} strokeLinecap="round" opacity={0.85 * seg(t, 0.12, 0.16) * plateFade} />}
      </Part>

      {/* Open neural folds where fusion has not yet reached: raised ridges, lit along their crest. */}
      <Part id="tolesdura-neuralak">
        {([-1, 1] as const).flatMap((sd) =>
          ridges(sd).map((pts, i) => (
            <g key={`${sd}${i}`}>
              <path d={polyD(pts.map((q) => [q[0] + sd * 2.5, q[1] + 2]))} stroke="#060b1a" strokeWidth={lerp(7, 13, rise)} fill="none" strokeLinecap="round" opacity={0.6} />
              <path d={polyD(pts)} stroke={C.neural} strokeWidth={lerp(6, 11, rise)} fill="none" strokeLinecap="round" />
              <path d={polyD(pts.map((q) => [q[0] - sd * 1.2, q[1]]))} stroke="#a9c3ff" strokeWidth={lerp(1, 2.6, rise)} fill="none" strokeLinecap="round" opacity={0.85} />
            </g>
          )),
        )}
      </Part>
      {/* Fused neural tube: only where the folds have met; a soft highlight along its length reads as a cylinder under the skin. */}
      {fused && (
        <Part id="hodi-neurala" show={seg(t, 0.44, 0.47)}>
          <path d={tubeD(fused[0], fused[1], tubeHW)} fill={`url(#${uid}-tube)`} stroke="#1e3a8a" strokeWidth={1.2} />
          <path d={tubeD(fused[0], fused[1], (q) => tubeHW(q) * 0.18)} fill="#c7d6ff" opacity={0.35} />
        </Part>
      )}

      {/* Neuropores: the still-open ends, looking down into the tube. Once closed, the sealed site stays
          marked (a short lit seam + its closure day), so the held frame of the neuropore step still shows both. */}
      <Part id="neuroporo-kraneala" show={poresOn(t)}>
        <ellipse cx={500} cy={yAt(0.05)} rx={20 * cranialOpen + 4} ry={11 * cranialOpen + 3} fill="#05070d" stroke="#8fb0ff" strokeWidth={1.6} opacity={seg(cranialOpen, 0, 0.25)} />
        <path d={`M${f1(500 - 10 * (1 - cranialOpen))},${f1(yAt(0.05))}L${f1(500 + 10 * (1 - cranialOpen))},${f1(yAt(0.05))}`} stroke="#c7d6ff" strokeWidth={2.4} strokeLinecap="round" opacity={1 - seg(cranialOpen, 0, 0.25)} />
      </Part>
      <Part id="neuroporo-kaudala" show={poresOn(t)}>
        <ellipse cx={500} cy={yAt(0.95)} rx={10 * caudalOpen + 3} ry={18 * caudalOpen + 3} fill="#05070d" stroke="#8fb0ff" strokeWidth={1.6} opacity={seg(caudalOpen, 0, 0.25)} />
        <path d={`M500,${f1(yAt(0.95) - 9 * (1 - caudalOpen))}L500,${f1(yAt(0.95) + 9 * (1 - caudalOpen))}`} stroke="#c7d6ff" strokeWidth={2.4} strokeLinecap="round" opacity={1 - seg(caudalOpen, 0, 0.25)} />
      </Part>
      {/* closure day beside each sealed pore */}
      <OnTop>
        <text x={466} y={yAt(0.05) + 4} textAnchor="end" className="note note-accent" style={{ fontSize: 12.5 }} opacity={1 - seg(cranialOpen, 0, 0.3)}>
          ≈25. eguna
        </text>
        <text x={470} y={yAt(0.95) + 4} textAnchor="end" className="note note-accent" style={{ fontSize: 12.5 }} opacity={1 - seg(caudalOpen, 0, 0.3)}>
          ≈28. eguna
        </text>
      </OnTop>

      <Note x={500} y={74} tone="warn" show={seg(t, 0.9, 0.93)}>
        Neuroporoen itxiera-egunak gutxi gorabeherakoak dira (inguruan)
      </Note>
      <DayRuler t={t} />
    </g>
  );
}

/** Day ruler for the zipper: fusion starts mid-embryo (≈22), cranial pore closes (≈25), caudal (≈28). */
const T_OPEN = 0.9; // the pores start closing
const T_CRANIAL = 0.95; // localClosure(0.05) reaches 1
const T_CAUDAL = 0.995; // localClosure(0.95) reaches 1
function DayRuler({ t }: { t: number }) {
  const show = seg(t, ZIP_START, ZIP_START + 0.03);
  if (show <= 0.02) return null;
  const x = (d: number) => lerp(56, 352, (d - 21) / 8);
  const day = t < T_OPEN ? lerp(22, 24.5, lin(t, ZIP_START, T_OPEN)) : t < T_CRANIAL ? lerp(24.5, 25, lin(t, T_OPEN, T_CRANIAL)) : lerp(25, 28, lin(t, T_CRANIAL, T_CAUDAL));
  const ticks: [number, string][] = [
    [22, 'fusioa hasi'],
    [25, 'kraneala itxi'],
    [28, 'kaudala itxi'],
  ];
  return (
    <g opacity={show} pointerEvents="none">
      <line x1={x(21)} x2={x(29)} y1={600} y2={600} stroke="rgba(232,238,252,0.3)" strokeWidth={1.5} />
      {ticks.map(([d, txt]) => (
        <g key={d}>
          <line x1={x(d)} x2={x(d)} y1={594} y2={606} stroke={day >= d - 0.05 ? '#fbbf24' : 'rgba(232,238,252,0.45)'} strokeWidth={1.5} />
          <text x={x(d)} y={586} textAnchor="middle" className={day >= d - 0.05 ? 'note note-accent' : 'note note-dim'} style={{ fontSize: 12.5 }}>
            ≈{d}. eguna
          </text>
          <text x={x(d)} y={621} textAnchor="middle" className="note note-dim" style={{ fontSize: 11.5 }}>
            {txt}
          </text>
        </g>
      ))}
      <circle cx={x(day)} cy={600} r={5} fill="#fbbf24" />
    </g>
  );
}

function dorsalLabels(t: number) {
  const spread = zipOf(t);
  const cranialOpen = 1 - localClosure(0.05, spread);
  const caudalOpen = 1 - localClosure(0.95, spread);
  return (
    <>
      <Label id="hodi-neurala" x={190} y={360} ax={500 - 14} ay={yAt(0.5)} show={spread ? seg(t, 0.44, 0.47) : 0} />
      <Label id={t < 0.12 ? 'plaka-neurala' : 'ildo-neurala'} x={810} y={400} ax={500 + 6} ay={yAt(0.7)} show={1 - localClosure(0.7, spread)} />
      <Label id="tolesdura-neuralak" x={190} y={200} ax={500 - plateHalfWidth(0.2) * 0.5} ay={yAt(0.2)} show={seg(t, 0.3, 0.34) * (1 - localClosure(0.2, spread))} />
      <Label id="neuroporo-kraneala" x={790} y={150} ax={500 + 4 + 14 * cranialOpen} ay={yAt(0.05)} show={poresOn(t)} />
      <Label id="neuroporo-kaudala" x={810} y={480} ax={500 + 3 + 11 * caudalOpen} ay={yAt(0.95)} show={poresOn(t)} />
      <Label id="somitak" x={810} y={260} ax={500 + plateHalfWidth(0.4) + 20} ay={yAt(0.4)} small show={seg(t, 0.2, 0.3)} />
    </>
  );
}

export function NeurulationDorsal(props: SceneProps) {
  return (
    <g>
      <DorsalDrawing {...props} />
      {dorsalLabels(props.t)}
    </g>
  );
}
