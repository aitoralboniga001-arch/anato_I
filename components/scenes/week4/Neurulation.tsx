'use client';

import { Arrow, C, Label, Note, Part, clamp, lerp, lin, seg, smoothPath, type SceneProps } from '@/components/kit';
import { SectionDrawing, makeSection } from '@/components/scenes/section/Section';
import { f1, type Pt } from './common';

/**
 * Stage `neurulazioa` — plaka neurala → ildo neurala → tolesdura neuralak → hodi neurala,
 * covered by azaleko ektodermoa (notes §2, figure 3). Two coherent views: a transverse
 * sequence (plate → groove → folds → tube) and a dorsal view of fusion + the two neuropores.
 */

// ---------------------------------------------------------------------------
// Transverse view — realistic section (cells, layers) from the shared section engine.
// ---------------------------------------------------------------------------

/**
 * Step windows (the stage beats): .00 induction → plate · .12 groove · .30 folds rise and approach ·
 * .44 fusion (zipping) · .62 crest cells leave the fold edges · .68 tube closed under the surface
 * ectoderm · .80 crest cells migrate · .90 neuropores. Each change starts at its beat and is finished
 * by the step's complete frame (next beat − 0.035), eased in and out (no speed jumps between steps).
 */
function neuralAt(t: number) {
  return 0.15 * seg(t, 0.12, 0.26) + 0.27 * seg(t, 0.3, 0.405) + 0.48 * seg(t, 0.44, 0.58) + 0.1 * seg(t, 0.68, 0.76);
}

function transverseSection(t: number) {
  return makeSection({
    fold: 0,
    neural: neuralAt(t),
    meso: lerp(0.3, 0.55, seg(t, 0.2, 1)),
    somite: lerp(0.15, 0.45, seg(t, 0.1, 0.6)),
    crest: 0.58 * seg(t, 0.8, 0.87),
    crestAppear: seg(t, 0.62, 0.655),
    aorta: seg(t, 0.3, 0.6),
    k: 1.5,
    oy: 60,
  });
}

function transverseLabels(t: number) {
  const s = transverseSection(t);
  const n = neuralAt(t);
  const groove = seg(t, 0.12, 0.16) * (1 - seg(t, 0.5, 0.56));
  const folds = seg(t, 0.3, 0.34) * (1 - seg(t, 0.52, 0.58));
  const tube = seg(t, 0.52, 0.58);
  const crest = seg(t, 0.62, 0.655);
  const ecto = s.map(-150, 4.5);
  const fold = s.at.folds;
  const tubeL = s.map(-s.neural.pt(Math.PI / 2, s.neural.rho)[0], s.neural.pt(Math.PI / 2, s.neural.rho)[1]);
  const crestR = s.map(s.neural.closed > 0.5 ? 14 : s.neural.crest[0] + 4, s.neural.closed > 0.5 ? s.neural.topBasal - 4 : s.neural.crest[1] - 4);
  return (
    <>
      <Label id="plaka-neurala" x={190} y={155} ax={s.at.plate[0] - 2 * (s.at.plate[0] - 500)} ay={s.at.plate[1]} show={1 - seg(t, 0.3, 0.45)} />
      <Label id="ildo-neurala" x={190} y={200} ax={s.at.groove[0]} ay={s.at.groove[1]} show={groove} />
      <Label id="azaleko-ektodermoa" x={190} y={110} ax={ecto[0]} ay={ecto[1]} />
      <Label id="somitak" x={190} y={480} ax={s.map(-s.somite.cx - 20, s.somite.cd)[0]} ay={s.map(-s.somite.cx - 20, s.somite.cd)[1]} show={seg(t, 0.15, 0.3)} />
      <Label id="notokorda" x={190} y={525} ax={s.at.notochord[0] - 14} ay={s.at.notochord[1]} />
      <Label id="tolesdura-neuralak" x={790} y={155} ax={fold[0] + 8} ay={fold[1] - 6} show={folds * (n > 0.2 ? 1 : 0)} />
      <Label id="hodi-neurala" x={810} y={110} ax={tubeL[0] + 2 * (500 - tubeL[0])} ay={tubeL[1]} show={tube} />
      <Label id="gandor-neurala" x={810} y={200} ax={crestR[0]} ay={crestR[1]} show={crest} />
      <Label id="aorta-dortsalak" x={810} y={500} ax={s.map(48, s.dAorta)[0] + 8} ay={s.map(48, s.dAorta)[1]} show={seg(t, 0.4, 0.6)} small />
    </>
  );
}

export function NeurulationTransverse({ t, reduced }: SceneProps) {
  const s = transverseSection(t);
  const induce = seg(t, 0, 0.03) * (1 - seg(t, 0.12, 0.16));
  const rise = seg(t, 0.3, 0.33) * (1 - seg(t, 0.44, 0.47));
  const fold = s.at.folds;
  return (
    <g>
      <SectionDrawing s={s} />
      {/* Induction: the notochord signals to the ectoderm above it, which thickens into the plate. */}
      {induce > 0.02 &&
        [-26, 0, 26].map((dx) => (
          <Arrow key={dx} from={[s.at.notochord[0] + dx * 0.3, s.at.notochord[1] - 14]} to={[s.at.notochord[0] + dx, s.at.plate[1] + 10]} bend={0} color="#e8eefc" width={2} head={7} show={induce} flow={!reduced} />
        ))}
      {/* Folds rising and approaching each other. */}
      {rise > 0.02 &&
        [-1, 1].map((sd) => (
          <Arrow key={sd} from={[500 + sd * (Math.abs(fold[0] - 500) + 34), fold[1] + 16]} to={[500 + sd * (Math.abs(fold[0] - 500) + 6), fold[1] - 26]} bend={sd * 0.25} color="#a9c3ff" width={2.2} head={8} show={rise} flow={!reduced} />
        ))}
      <Note x={500} y={590} show={induce} tone="accent">
        Notokorda → ektodermoa: indukzioa. Ektodermoaren eremu hau plaka neurala bihurtzen da.
      </Note>
      <Note x={500} y={590} show={seg(t, 0.62, 0.65) * (1 - seg(t, 0.68, 0.7))} tone="accent">
        Ertzetako zelulak askatzen dira: gandor neurala
      </Note>
      <Note x={500} y={590} show={seg(t, 0.8, 0.83) * (1 - seg(t, 0.9, 0.92))} tone="accent">
        Gandor neuraleko zelulak migratzen: azpitik (dortsala) eta hodiaren eta somitaren artetik (bentrala)
      </Note>
      {transverseLabels(t)}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Dorsal view: fusion zipping cranially and caudally from the future neck, with the two
// transient neuropores (notes: closure days are approximate — "inguruan").
// ---------------------------------------------------------------------------

const D_TOP = 120;
const D_BOTTOM = 540;
const ZIP_START = 0.44;

function yAt(frac: number) {
  return lerp(D_TOP, D_BOTTOM, frac);
}
function bodyHalfWidth(frac: number) {
  return 46 + 64 * Math.pow(Math.sin(Math.PI * clamp(frac, 0.02, 0.98)), 0.8);
}
function plateHalfWidth(frac: number) {
  return bodyHalfWidth(frac) * 0.52;
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
const ridgeX = (frac: number, spread: Zip, approach: number) => plateHalfWidth(frac) * (1 - approach * 0.3) * (1 - localClosure(frac, spread) * 0.94);

/** A fold's crest, optionally only over [a, b] (arc fractions). */
function ridgePath(side: -1 | 1, spread: Zip, approach = 0, n = 40, a = 0.03, b = 0.97) {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const frac = a + ((b - a) * i) / n;
    pts.push([500 + side * ridgeX(frac, spread, approach), yAt(frac)]);
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`).join('');
}

/** Where the folds have effectively met (a tube), from the zipper's two fronts. */
const FUSED = 0.75;
function fusedRange(spread: Zip): [number, number] | null {
  if (!spread) return null;
  const k = (1 - FUSED) * 0.1; // localClosure falls to FUSED this far beyond each front
  return [Math.max(0.03, ZIP_START - spread.cr - k), Math.min(0.97, ZIP_START + spread.ca + k)];
}

/** Neural tube half-width: broader where the brain will be, narrowing caudally. */
const tubeHW = (frac: number) => 10 + 6 * (1 - frac) ** 2;

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

function DorsalDrawing({ t }: SceneProps) {
  const spread = zipOf(t);
  const cranialOpen = 1 - localClosure(0.05, spread);
  const caudalOpen = 1 - localClosure(0.95, spread);
  const somiteShow = seg(t, 0.15, 0.4);
  // Folds rise and draw towards each other before they touch at the future neck.
  const approach = seg(t, 0.3, 0.4);

  // Body outline with rounded head and tail ends (a little beyond the plate).
  const bodyW = (frac: number) => {
    const u = (frac + 0.07) / 1.13;
    return 112 * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.55) * (1.04 - 0.08 * u);
  };
  const bf = Array.from({ length: 81 }, (_, i) => lerp(-0.07, 1.06, (1 - Math.cos((Math.PI * i) / 80)) / 2));
  // (the return side skips the two tips the sides share, so they stay round instead of a corner)
  const outlineD = smoothPath([...bf.map((q): Pt => [500 - bodyW(q), yAt(q)]), ...[...bf].reverse().slice(1, -1).map((q): Pt => [500 + bodyW(q), yAt(q)])], true, 0.5);

  // Only the stretch the zipper has already closed is tube; the rest is still open plate / folds.
  const fused = fusedRange(spread);
  const ridges = (side: -1 | 1) =>
    !fused
      ? [ridgePath(side, spread, approach)]
      : ([
          [0.03, fused[0] + 0.01],
          [fused[1] - 0.01, 0.97],
        ] as [number, number][])
          .filter(([a, b]) => b - a > 0.012)
          .map(([a, b]) => ridgePath(side, spread, approach, 16, a, b));
  // The plate between the folds, rounded at both ends.
  const openPlate = () => {
    const fr = Array.from({ length: 41 }, (_, i) => 0.03 + (0.94 * i) / 40);
    const side = (sd: number) => fr.map((q): Pt => [500 + sd * ridgeX(q, spread, approach), yAt(q)]);
    return smoothPath([[500, yAt(0.03) - 6], ...side(-1), [500, yAt(0.97) + 6], ...side(1).reverse()], true, 0.5);
  };

  return (
    <g>
      <path d={outlineD} fill="#101828" stroke="rgba(232,238,252,0.25)" strokeWidth={1.2} />

      {/* Somites: pairs appearing cranio-caudally beside the folds, drawn in with them as the tube closes. */}
      {somiteShow > 0 &&
        Array.from({ length: 7 }, (_, i) => {
          const frac = 0.3 + i * 0.062;
          const y = yAt(frac);
          const x = Math.max(ridgeX(frac, spread, approach) + 8, tubeHW(frac) + 5);
          const o = seg(somiteShow, i * 0.1, i * 0.1 + 0.4);
          return (
            <g key={i} opacity={o} fill={C.mesoParaxial} stroke="rgba(90,20,30,0.55)" strokeWidth={0.9}>
              <rect x={500 - x - 17} y={y - 10} width={17} height={20} rx={6} />
              <rect x={500 + x} y={y - 10} width={17} height={20} rx={6} />
            </g>
          );
        })}

      {/* Open neural plate / groove between the folds. */}
      <Part id={t < 0.12 ? 'plaka-neurala' : 'ildo-neurala'}>
        <path d={openPlate()} fill={C.neural} opacity={0.28 * (1 - seg(Math.min(localClosure(0.03, spread), localClosure(0.97, spread)), 0.6, 0.8))} />
        {t >= 0.12 && <path d={`M500,${f1(yAt(0.04))} L500,${f1(yAt(0.96))}`} stroke="#0c1730" strokeWidth={3} strokeDasharray="6 5" opacity={seg(t, 0.12, 0.16)} />}
      </Part>

      {/* Fused neural tube: only where the folds have met. */}
      {/* Open neural folds where fusion has not yet reached (under the tube, so they run into its ends). */}
      <Part id="tolesdura-neuralak">
        {([-1, 1] as const).flatMap((sd) => ridges(sd).map((d, i) => <path key={`${sd}${i}`} d={d} stroke={C.neural} strokeWidth={10} fill="none" strokeLinecap="round" />))}
      </Part>
      {fused && (
        <Part id="hodi-neurala" show={seg(t, 0.44, 0.47)}>
          <path d={tubeD(fused[0], fused[1], tubeHW)} fill={C.neural} stroke="#1e3a8a" strokeWidth={1.2} />
          <path d={tubeD(fused[0], fused[1], (q) => tubeHW(q) * 0.22)} fill="#1b2f7a" opacity={0.6} />
        </Part>
      )}

      {/* Neuropores. */}
      <Part id="neuroporo-kraneala" show={cranialOpen * poresOn(t)}>
        <ellipse cx={500} cy={yAt(0.05)} rx={22 * cranialOpen + 4} ry={12 * cranialOpen + 3} fill="#0c0c0e" stroke={C.neural} strokeWidth={2} />
      </Part>
      <Part id="neuroporo-kaudala" show={caudalOpen * poresOn(t)}>
        <ellipse cx={500} cy={yAt(0.95)} rx={16 * caudalOpen + 4} ry={20 * caudalOpen + 3} fill="#0c0c0e" stroke={C.neural} strokeWidth={2} />
      </Part>

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
  const x = (d: number) => lerp(70, 330, (d - 21) / 8);
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
          <text x={x(d)} y={588} textAnchor="middle" className="note note-dim" style={{ fontSize: 10.5 }}>
            ≈{d}. eguna
          </text>
          <text x={x(d)} y={620} textAnchor="middle" className="note note-dim" style={{ fontSize: 10 }}>
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
      <Label id="neuroporo-kraneala" x={790} y={150} ax={500 + 18} ay={yAt(0.05)} show={cranialOpen * poresOn(t)} />
      <Label id="neuroporo-kaudala" x={810} y={480} ax={500 + 14} ay={yAt(0.95)} show={caudalOpen * poresOn(t)} />
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
