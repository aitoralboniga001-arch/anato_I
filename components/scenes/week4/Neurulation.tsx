'use client';

import { Arrow, C, Label, Note, Part, clamp, lerp, lin, seg, type SceneProps } from '@/components/kit';
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
 * ectoderm · .80 crest cells migrate · .90 neuropores. Each change happens inside its own step.
 */
const NEURAL_KEYS: [number, number][] = [
  [0, 0],
  [0.12, 0.15],
  [0.3, 0.42],
  [0.44, 0.72],
  [0.62, 0.9],
  [0.72, 1],
];
function neuralAt(t: number) {
  for (let i = 1; i < NEURAL_KEYS.length; i++) {
    const [t0, v0] = NEURAL_KEYS[i - 1];
    const [t1, v1] = NEURAL_KEYS[i];
    if (t <= t1) return lerp(v0, v1, clamp((t - t0) / (t1 - t0)));
  }
  return 1;
}

function transverseSection(t: number) {
  return makeSection({
    fold: 0,
    neural: neuralAt(t),
    meso: lerp(0.3, 0.55, seg(t, 0.2, 1)),
    somite: lerp(0.15, 0.45, seg(t, 0.1, 0.6)),
    crest: 0.58 * seg(t, 0.8, 0.9),
    crestAppear: seg(t, 0.62, 0.66),
    aorta: seg(t, 0.3, 0.6),
    k: 1.5,
    oy: 60,
  });
}

function transverseLabels(t: number) {
  const s = transverseSection(t);
  const n = neuralAt(t);
  const groove = seg(t, 0.12, 0.16) * (1 - seg(t, 0.52, 0.62));
  const folds = seg(t, 0.3, 0.34) * (1 - seg(t, 0.56, 0.64));
  const tube = seg(t, 0.56, 0.66);
  const crest = seg(t, 0.62, 0.66);
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
const poresOn = (t: number) => seg(t, 0.6, 0.66);

/** The folds meet at the future neck in the fusion step (.44) and zip both ways until the neuropores close. */
type Zip = { cr: number; ca: number } | null;
/** Cranial front runs a little faster: the cranial neuropore (≈25th day) closes before the caudal one (≈28th). */
const zipOf = (t: number): Zip => (t < 0.44 ? null : { cr: lin(t, 0.44, 0.92) * 0.46, ca: Math.pow(lin(t, 0.44, 1), 1.4) * 0.56 });

function localClosure(frac: number, spread: Zip) {
  if (!spread) return 0;
  const from = ZIP_START - spread.cr;
  const to = ZIP_START + spread.ca;
  if (frac >= from && frac <= to) return 1;
  const d = frac < from ? from - frac : frac - to;
  return clamp(1 - d / 0.1);
}

function ridgePath(side: -1 | 1, spread: Zip, approach = 0, n = 40) {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const frac = 0.03 + (0.94 * i) / n;
    const closureHere = localClosure(frac, spread);
    const x = 500 + side * plateHalfWidth(frac) * (1 - approach * 0.3) * (1 - closureHere * 0.94);
    pts.push([x, yAt(frac)]);
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`).join('');
}

function DorsalDrawing({ t }: SceneProps) {
  const spread = zipOf(t);
  const cranialOpen = 1 - localClosure(0.05, spread);
  const caudalOpen = 1 - localClosure(0.95, spread);
  const somiteShow = seg(t, 0.15, 0.4);
  // Folds rise and draw towards each other before they touch at the future neck.
  const approach = seg(t, 0.3, 0.44);

  const outline: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const frac = i / 48;
    outline.push([500 - bodyHalfWidth(frac), yAt(frac)]);
  }
  for (let i = 48; i >= 0; i--) {
    const frac = i / 48;
    outline.push([500 + bodyHalfWidth(frac), yAt(frac)]);
  }
  const outlineD = outline.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`).join('') + 'Z';

  // Only the stretch the zipper has already closed is tube; the rest is still open plate.
  const fusedFrom = Math.max(0.03, ZIP_START - (spread?.cr ?? 0));
  const fusedTo = Math.min(0.97, ZIP_START + (spread?.ca ?? 0));
  const fusedBand = () => `M500,${f1(yAt(fusedFrom))} L500,${f1(yAt(fusedTo))}`;
  const openPlate = () => {
    const l = ridgePath(-1, spread, approach);
    const r = ridgePath(1, spread, approach)
      .split(/(?=[ML])/)
      .reverse()
      .map((c) => 'L' + c.slice(1))
      .join('');
    return `${l}${r}Z`;
  };

  return (
    <g>
      <path d={outlineD} fill="#101828" stroke="rgba(232,238,252,0.25)" strokeWidth={1.2} />

      {somiteShow > 0 &&
        Array.from({ length: 6 }, (_, i) => {
          const frac = 0.3 + i * 0.09;
          const y = yAt(frac);
          const w = plateHalfWidth(frac) + 16;
          return (
            <g key={i} opacity={somiteShow}>
              <rect x={500 - w - 14} y={y - 8} width={12} height={16} rx={3} fill={C.mesoParaxial} opacity={0.6} />
              <rect x={500 + w + 2} y={y - 8} width={12} height={16} rx={3} fill={C.mesoParaxial} opacity={0.6} />
            </g>
          );
        })}

      {/* Open neural plate / groove between the folds. */}
      <Part id={t < 0.12 ? 'plaka-neurala' : 'ildo-neurala'}>
        <path d={openPlate()} fill={C.neural} opacity={0.28} />
        {t >= 0.12 && <path d={`M500,${f1(yAt(0.04))} L500,${f1(yAt(0.96))}`} stroke="#0c1730" strokeWidth={3} strokeDasharray="6 5" opacity={seg(t, 0.12, 0.16)} />}
      </Part>

      {/* Fused neural tube: only where the folds have met. */}
      {spread && (
        <Part id="hodi-neurala" show={seg(t, 0.44, 0.47)}>
          <path d={fusedBand()} stroke={C.neural} strokeWidth={26} fill="none" strokeLinecap="round" />
        </Part>
      )}

      {/* Open neural folds where fusion has not yet reached. */}
      <Part id="tolesdura-neuralak">
        <path d={ridgePath(-1, spread, approach)} stroke={C.neural} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={ridgePath(1, spread, approach)} stroke={C.neural} strokeWidth={10} fill="none" strokeLinecap="round" />
      </Part>

      {/* Neuropores. */}
      <Part id="neuroporo-kraneala" show={cranialOpen * poresOn(t)}>
        <ellipse cx={500} cy={yAt(0.05)} rx={22 * cranialOpen + 4} ry={12 * cranialOpen + 3} fill="#0c0c0e" stroke={C.neural} strokeWidth={2} />
      </Part>
      <Part id="neuroporo-kaudala" show={caudalOpen * poresOn(t)}>
        <ellipse cx={500} cy={yAt(0.95)} rx={16 * caudalOpen + 4} ry={20 * caudalOpen + 3} fill="#0c0c0e" stroke={C.neural} strokeWidth={2} />
      </Part>

      <Note x={500} y={100} tone="warn" show={seg(t, 0.75, 0.95) * (1 - seg(t, 0.97, 1))}>
        Neuroporoen itxiera-egunak gutxi gorabeherakoak dira (inguruan)
      </Note>
      <DayRuler t={t} />
    </g>
  );
}

/** Day ruler for the zipper: fusion starts mid-embryo (≈22), cranial pore closes (≈25), caudal (≈28). */
const T_CRANIAL = 0.847; // localClosure(0.05) reaches 1
const T_CAUDAL = 0.964; // localClosure(0.95) reaches 1
function DayRuler({ t }: { t: number }) {
  const show = seg(t, ZIP_START, ZIP_START + 0.03);
  if (show <= 0.02) return null;
  const x = (d: number) => lerp(70, 330, (d - 21) / 8);
  const day = t < T_CRANIAL ? lerp(22, 25, lin(t, ZIP_START, T_CRANIAL)) : lerp(25, 28, lin(t, T_CRANIAL, T_CAUDAL));
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
      <Label id="tolesdura-neuralak" x={190} y={200} ax={500 - plateHalfWidth(0.2) * 0.5} ay={yAt(0.2)} show={1 - localClosure(0.2, spread)} />
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
