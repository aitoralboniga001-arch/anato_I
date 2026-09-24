'use client';

import { Arrow, C, Label, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { type Pt } from './common';
import { SectionDrawing, makeSection } from '@/components/scenes/section/Section';

/**
 * Stage `tolespenak` — transverse + cephalocaudal folding of the trilaminar disc into the
 * C-shaped cylindrical embryo (notes §1, figures 1, 2, 5).
 *
 * Both views share one `fold` progress (0 = flat trilaminar disc, 1 = day-28 C-shaped embryo),
 * so scrubbing `t` keeps the sagittal and transverse pictures at the same moment.
 */
const FOLD_A = 0.05;
const FOLD_B = 0.85;
function mainFold(t: number) {
  return seg(t, FOLD_A, FOLD_B);
}

export { FoldingSagittal } from './FoldSagittal';

// ---------------------------------------------------------------------------
// Transverse view: realistic trunk-level section (cells, layers) closing ventrally
// (notes figure: A flat disc → B lateral folds → C closed body wall, gut + vitelline duct).
// ---------------------------------------------------------------------------

function foldSection(t: number, foldOverride?: number) {
  const f = foldOverride ?? mainFold(t) * 0.93;
  return makeSection({
    fold: f,
    neural: 1,
    meso: lerp(0.55, 1, seg(t, 0.1, 0.4)),
    somite: 0.5,
    crest: 0,
    aorta: 1,
    k: 0.85,
    oy: lerp(30, -40, f / 0.93),
    ids: { ectoderm: 'ektodermoa' },
  });
}

function foldArrow(t: number, side: 1 | -1) {
  const f = mainFold(t) * 0.93;
  const a = foldSection(t, f).map(side * 505, -16);
  const b = foldSection(t, Math.min(0.93, f + 0.2)).map(side * 505, -16);
  return (
    <Arrow from={a} to={b} color="#fbbf24" show={seg(t, 0.15, 0.4) * (1 - seg(t, 0.62, 0.8))} bend={side * 0.12} />
  );
}

function transverseLabels(t: number) {
  const s = foldSection(t);
  const f = s.p.fold;
  const coelom = seg(t, 0.3, 0.5);
  const edge = s.map(-500, 8);
  const gut = s.map(0, s.dEndo(0) + 12);
  return (
    <>
      <Label id="amnios-barrunbea" x={190} y={80} ax={s.at.amnion[0]} ay={s.at.amnion[1]} />
      <Label id="ektodermoa" x={190} y={120} ax={s.map(-150, 4.5)[0]} ay={s.map(-150, 4.5)[1]} />
      <Label id="tolestura-laterala" x={190} y={160} ax={edge[0]} ay={edge[1]} show={seg(t, 0.2, 0.3)} />
      <Label id="paretako-orria" x={190} y={470} ax={s.map(-300, 16)[0]} ay={s.map(-300, 16)[1]} show={coelom} />
      <Label id="errai-orria" x={190} y={510} ax={s.map(-300, s.dEndo(300) - 6)[0]} ay={s.map(-300, s.dEndo(300) - 6)[1]} show={coelom} />
      <Label id="bitelo-zaku-sekundarioa" x={190} y={580} ax={s.at.yolk[0]} ay={s.at.yolk[1]} />
      <Label id="hodi-neurala" x={810} y={80} ax={s.at.tube[0]} ay={s.at.tube[1]} small />
      <Label id="enbrioi-barruko-zeloma" x={810} y={470} ax={s.map(330, (22 + s.dEndo(330) - 13) / 2)[0]} ay={s.map(330, (22 + s.dEndo(330) - 13) / 2)[1]} show={coelom} />
      <Label id={f > 0.8 ? 'erdiko-hestea' : 'endodermoa'} x={810} y={510} ax={gut[0] + 6} ay={gut[1]} />
      <Label id="hodi-onfalomesenterikoa" x={810} y={550} ax={s.at.vitelline[0] + 2 * (s.yolk.cx - s.at.vitelline[0])} ay={s.at.vitelline[1]} show={seg(t, 0.5, 0.6)} />
    </>
  );
}

export function FoldingTransverse({ t }: SceneProps) {
  return (
    <g>
      <SectionDrawing s={foldSection(t)} show={{ crest: 0 }} />
      {foldArrow(t, 1)}
      {foldArrow(t, -1)}
      {transverseLabels(t)}
    </g>
  );
}
