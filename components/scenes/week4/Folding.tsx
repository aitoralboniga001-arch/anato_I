'use client';

import { Arrow, Label, Mark, Note, lerp, seg, type SceneProps } from '@/components/kit';
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
    meso: 1, // the coelom already exists before folding (mesoderm stage); folding only encloses it
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
    <Arrow from={a} to={b} color="#fbbf24" show={seg(t, 0.44, 0.48) * (1 - seg(t, 0.6, 0.64))} bend={side * 0.12} />
  );
}

function transverseLabels(t: number) {
  const s = foldSection(t);
  const f = s.p.fold;
  // The coelom, parietal and visceral layers already exist (mesoderm stage): labelled from the start.
  const coelom = 1;
  const edge = s.map(-500, 8);
  const edgeR = s.map(500, 8);
  const lat = seg(t, 0.44, 0.48) * (1 - seg(t, 0.8, 0.83));
  const gut = s.map(0, s.dEndo(0) + 12);
  return (
    <>
      <Mark id="tolestura-laterala" x={edge[0]} y={edge[1]} rx={30} show={lat} />
      <Mark id="tolestura-laterala" x={edgeR[0]} y={edgeR[1]} rx={30} show={lat} />
      <Label id="amnios-barrunbea" x={190} y={80} ax={s.at.amnion[0]} ay={s.at.amnion[1]} />
      <Label id="ektodermoa" x={190} y={120} ax={s.map(-150, 4.5)[0]} ay={s.map(-150, 4.5)[1]} />
      <Label id="tolestura-laterala" x={190} y={160} ax={edge[0]} ay={edge[1]} show={seg(t, 0.44, 0.48)} />
      <Label id="paretako-orria" x={190} y={470} ax={s.map(-300, 16)[0]} ay={s.map(-300, 16)[1]} show={coelom} />
      <Label id="errai-orria" x={190} y={510} ax={s.map(-300, s.dEndo(300) - 6)[0]} ay={s.map(-300, s.dEndo(300) - 6)[1]} show={coelom} />
      <Label id="bitelo-zaku-sekundarioa" x={190} y={580} ax={s.at.yolk[0]} ay={s.at.yolk[1]} />
      <Label id="hodi-neurala" x={810} y={80} ax={s.at.tube[0]} ay={s.at.tube[1]} small />
      <Label id="enbrioi-barruko-zeloma" x={810} y={470} ax={s.map(330, (22 + s.dEndo(330) - 13) / 2)[0]} ay={s.map(330, (22 + s.dEndo(330) - 13) / 2)[1]} show={coelom} />
      {/* The endoderm is renamed midgut as it closes into a tube: the two names cross-fade (no swap). */}
      <Label id="endodermoa" x={810} y={510} ax={gut[0] + 6} ay={gut[1]} show={1 - seg(f, 0.76, 0.84)} />
      <Label id="erdiko-hestea" x={810} y={510} ax={gut[0] + 6} ay={gut[1]} show={seg(f, 0.76, 0.84)} />
      <Label id="hodi-onfalomesenterikoa" x={810} y={550} ax={s.at.vitelline[0] + 2 * (s.yolk.cx - s.at.vitelline[0])} ay={s.at.vitelline[1]} show={seg(t, 0.66, 0.7)} />
    </>
  );
}

/** Cause (somite growth pushes the edges) and fusion (the two edges meet → ventral body wall). */
function causeAndFusion(t: number) {
  const s = foldSection(t);
  const cause = seg(t, 0.44, 0.48) * (1 - seg(t, 0.54, 0.56));
  const fuse = seg(t, 0.72, 0.75) * (1 - seg(t, 0.8, 0.83));
  const a = s.map(-505, -16);
  const b = s.map(505, -16);
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return (
    <>
      {([1, -1] as const).map((side) => (
        <Arrow key={side} from={s.map(side * 120, 40)} to={s.map(side * 250, 52)} color="#f97316" width={2.4} show={cause} bend={side * 0.1} />
      ))}
      <Note x={985} y={606} align="end" tone="accent" show={cause}>
        Eragilea: somitak hazi eta ertzak behera eta erdirantz bultzatzen dituzte
      </Note>
      {fuse > 0.02 && <ellipse cx={m[0]} cy={m[1]} rx={46} ry={26} fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" opacity={fuse} />}
      <Note x={985} y={606} align="end" tone="accent" show={fuse}>
        Ertzak elkartzen dira → gorputz-horma bentrala; zeloma barruan geratzen da
      </Note>
      <Note x={985} y={606} align="end" show={seg(t, 0.82, 0.86)}>
        Zilbor-eskualdean ez da ixten: hodi onfalomesenterikoa kanpora doa
      </Note>
    </>
  );
}

export function FoldingTransverse({ t }: SceneProps) {
  return (
    <g>
      <SectionDrawing s={foldSection(t)} show={{ crest: 0 }} />
      {foldArrow(t, 1)}
      {foldArrow(t, -1)}
      {causeAndFusion(t)}
      {transverseLabels(t)}
    </g>
  );
}
