'use client';

import { C, Label, Note, Part, clamp, lerp, seg, type SceneProps } from '@/components/kit';
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

const lin = (k: number) => k;

function transverseSection(t: number) {
  return makeSection({
    fold: 0,
    neural: seg(t, 0, 0.7, lin),
    meso: lerp(0.3, 0.55, seg(t, 0.2, 1)),
    somite: lerp(0.15, 0.45, seg(t, 0.1, 0.6)),
    crest: 0.5 * seg(t, 0.78, 1),
    aorta: seg(t, 0.3, 0.6),
    k: 1.5,
    oy: 60,
  });
}

function transverseLabels(t: number) {
  const s = transverseSection(t);
  const n = seg(t, 0, 0.7, lin);
  const groove = seg(t, 0.08, 0.28) * (1 - seg(t, 0.52, 0.62));
  const folds = seg(t, 0.22, 0.32) * (1 - seg(t, 0.56, 0.64));
  const tube = seg(t, 0.56, 0.66);
  const crest = seg(t, 0.55, 0.66);
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

export function NeurulationTransverse({ t }: SceneProps) {
  return (
    <g>
      <SectionDrawing s={transverseSection(t)} />
      <Note x={500} y={590} show={1 - seg(t, 0.1, 0.2)}>
        Notokordak eta plaka prekordalak plaka neurala induzitzen dute
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
function localClosure(frac: number, spread: number) {
  const from = ZIP_START - spread;
  const to = ZIP_START + spread;
  if (frac >= from && frac <= to) return 1;
  const d = frac < from ? from - frac : frac - to;
  return clamp(1 - d / 0.1);
}

function ridgePath(side: -1 | 1, spread: number, n = 40) {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const frac = 0.03 + (0.94 * i) / n;
    const closureHere = localClosure(frac, spread);
    const x = 500 + side * plateHalfWidth(frac) * (1 - closureHere * 0.94);
    pts.push([x, yAt(frac)]);
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`).join('');
}

function DorsalDrawing({ t }: SceneProps) {
  const spread = seg(t, 0.1, 0.92) * 0.52;
  const cranialOpen = 1 - localClosure(0.05, spread);
  const caudalOpen = 1 - localClosure(0.95, spread);
  const somiteShow = seg(t, 0.15, 0.4);

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

  const fusedBand = () => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const frac = 0.03 + (0.94 * i) / 40;
      pts.push([500, yAt(frac)]);
    }
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`).join('');
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

      {/* Fused neural tube (dorsal midline). */}
      <Part id="hodi-neurala">
        <path d={fusedBand()} stroke={C.neural} strokeWidth={26} fill="none" strokeLinecap="round" />
      </Part>

      {/* Open neural folds where fusion has not yet reached. */}
      <Part id="tolesdura-neuralak">
        <path d={ridgePath(-1, spread)} stroke={C.neural} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={ridgePath(1, spread)} stroke={C.neural} strokeWidth={10} fill="none" strokeLinecap="round" />
      </Part>

      {/* Neuropores. */}
      <Part id="neuroporo-kraneala" show={cranialOpen}>
        <ellipse cx={500} cy={yAt(0.05)} rx={22 * cranialOpen + 4} ry={12 * cranialOpen + 3} fill="#0c0c0e" stroke={C.neural} strokeWidth={2} />
      </Part>
      <Part id="neuroporo-kaudala" show={caudalOpen}>
        <ellipse cx={500} cy={yAt(0.95)} rx={16 * caudalOpen + 4} ry={20 * caudalOpen + 3} fill="#0c0c0e" stroke={C.neural} strokeWidth={2} />
      </Part>

      <Note x={500} y={100} tone="warn" show={seg(t, 0.75, 0.95) * (1 - seg(t, 0.97, 1))}>
        Neuroporoen itxiera-egunak gutxi gorabeherakoak dira (inguruan)
      </Note>
    </g>
  );
}

function dorsalLabels(t: number) {
  const spread = seg(t, 0.1, 0.92) * 0.52;
  const cranialOpen = 1 - localClosure(0.05, spread);
  const caudalOpen = 1 - localClosure(0.95, spread);
  return (
    <>
      <Label id="hodi-neurala" x={190} y={360} ax={500 - 14} ay={yAt(0.5)} />
      <Label id="tolesdura-neuralak" x={190} y={200} ax={500 - plateHalfWidth(0.2) * 0.5} ay={yAt(0.2)} show={1 - localClosure(0.2, spread)} />
      <Label id="neuroporo-kraneala" x={790} y={150} ax={500 + 18} ay={yAt(0.05)} show={cranialOpen} />
      <Label id="neuroporo-kaudala" x={810} y={480} ax={500 + 14} ay={yAt(0.95)} show={caudalOpen} />
      <Label id="somitak" x={810} y={260} ax={500 + plateHalfWidth(0.4) + 20} ay={yAt(0.4)} small />
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
