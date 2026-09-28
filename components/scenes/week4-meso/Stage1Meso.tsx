'use client';

import { Arrow, C, Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { bandPathT, midT } from './common';
import { SectionDrawing, makeSection } from '@/components/scenes/section/Section';

/**
 * `mesodermoa-banatzen` — ~day 17: the thin sheet of intraembryonic mesoderm next to the
 * notochord thickens into the paraxial mesoderm. The lateral mesoderm (still a single sheet,
 * continuous with the extraembryonic mesoderm at the disc edge) then develops small cavities
 * that coalesce into the intraembryonic coelom, splitting it into the somatic (paretako orria)
 * and splanchnic (errai orria) layers. ONLY LATER does a third population appear between the
 * paraxial and lateral mesoderm: the intermediate mesoderm (notes, w4 lines ~157-158: "Gerora...").
 * Kept as a shallow (constant foldK) transverse trough: real folding is week 4A's stage.
 *
 * Depth bands are contiguous across the whole thickness (ectoderm 0-14, mesoderm 14-90, endoderm
 * 90-110) so adjacent tissues always touch — no background gap between layers.
 */
const FOLD = 0.22;
const D = { ecto0: -16, ecto1: 14, meso0: 14, meso1: 90, endo0: 90, endo1: 112 };

// Each change happens INSIDE its own step (week4b.ts beats: 0, .1, .24, .38, .5, .62, .74, .86):
// the text announces it and the student watches it happen, instead of it being done already.
function geometry(t: number) {
  const paraxial = seg(t, 0.1, 0.18);
  const lateral = seg(t, 0.24, 0.3);
  const vacuoles = seg(t, 0.38, 0.44) * (1 - seg(t, 0.5, 0.56));
  const coelom = seg(t, 0.5, 0.58);
  const somato = seg(t, 0.62, 0.68);
  const splanchno = seg(t, 0.74, 0.8);
  const intermediate = seg(t, 0.86, 0.92);
  return { paraxial, lateral, vacuoles, coelom, somato, splanchno, intermediate };
}

function mesoSection(t: number) {
  const g = geometry(t);
  const s = makeSection({
    fold: 0,
    neural: 0,
    // .33 = paraxial block drawn, no vesicles yet; .48 = vesicles; .72 = one coelom.
    meso: 0.1 + 0.23 * g.paraxial + 0.15 * seg(t, 0.38, 0.46) + 0.24 * g.coelom,
    somite: 0,
    crest: 0,
    aorta: 0,
    k: 1.15,
    oy: 90,
    ids: { ectoderm: 'ektodermoa', plate: 'ektodermoa' },
  });
  return { s, g };
}

function labels(t: number) {
  const { s, g } = mesoSection(t);
  const at = (x: number, d: number) => s.map(x, d);
  const mid = (x: number) => (9 + s.dEndo(x)) / 2;
  const cTop = 22;
  const cBot = (x: number) => s.dEndo(x) - 13;
  const extra = at(-380, -95);
  const par = at(-98, mid(98));
  const int = at(-169, mid(169));
  const lat = g.coelom > 0.5 ? at(-196, mid(196)) : at(-330, mid(330));
  const coel = at(330, (cTop + cBot(330)) / 2);
  const pari = at(400, cTop - 4);
  const visc = at(400, cBot(400) + 5);
  const noto = s.at.notochord;
  const ecto = at(250, 4.5);
  const endo = at(250, s.dEndo(250) + 4.5);
  return (
    <>
      <Label id="enbrioi-kanpoko-mesodermoa" x={190} y={110} ax={extra[0]} ay={extra[1]} small show={g.lateral} />
      <Label id="mesodermo-intraenbrionarioa" x={190} y={250} ax={at(-250, mid(250))[0]} ay={at(-250, mid(250))[1]} show={1 - g.paraxial} />
      <Label id="mesodermo-paraxiala" x={190} y={200} ax={par[0]} ay={par[1]} show={g.paraxial} />
      <Label id="bitarteko-mesodermoa" x={190} y={240} ax={int[0]} ay={int[1]} show={g.intermediate} />
      <Label id="notokorda" x={190} y={450} ax={noto[0] - 10} ay={noto[1]} />
      <Label id="alboko-mesodermoa" x={190} y={490} ax={lat[0]} ay={lat[1]} show={g.lateral} />
      <Label id="ektodermoa" x={810} y={205} ax={ecto[0]} ay={ecto[1]} small />
      <Label id="paretako-orria" x={810} y={250} ax={pari[0]} ay={pari[1]} show={g.somato} />
      <Label id="enbrioi-barruko-zeloma" x={810} y={450} ax={coel[0]} ay={coel[1]} show={Math.max(g.coelom, g.vacuoles)} />
      <Label id="errai-orria" x={810} y={490} ax={visc[0]} ay={visc[1]} show={g.splanchno} />
      <Label id="endodermoa" x={810} y={530} ax={endo[0]} ay={endo[1]} small />
    </>
  );
}

export function MesoSplitSection({ t }: SceneProps) {
  const { s, g } = mesoSection(t);
  return (
    <g>
      <SectionDrawing s={s} show={{ intermediate: g.intermediate, parietal: g.somato, visceral: g.splanchno }} />
      {labels(t)}
    </g>
  );
}

/**
 * Dorsal view of the trilaminar disc: mediolateral zones as cranio-caudal stripes either side of
 * the axis. Once the coelom appears, the somatic/coelom/splanchnic split is dorsoventral (not
 * mediolateral) so it CANNOT be shown as adjacent stripes in a top-down view — instead the lateral
 * band stays a single "alboko mesodermoa" region here, and a small schematic cross-section inset
 * (mirroring the transverse view) shows the true dorsoventral stacking with its own clickable Parts,
 * so beats 6-8 stay visible/labelled from this view too.
 */
export function MesoSplitDorsal({ t }: SceneProps) {
  const { paraxial, lateral, coelom, intermediate } = geometry(t);
  const yTop = 140;
  const yBot = 500;
  const grow = seg(t, 0, 0.9);
  const yEnd = lerp(yTop + 20, yBot, grow);
  const band = (x0: number, x1: number, id: string, color: string, show: number, quiet = false) =>
    show > 0.02 && (
      <Part id={id} show={show} quiet={quiet}>
        <rect x={500 + x0} y={yTop} width={x1 - x0} height={yEnd - yTop} rx={10} fill={color} opacity={quiet ? 0.55 : 0.9} />
        <rect x={500 - x1} y={yTop} width={x1 - x0} height={yEnd - yTop} rx={10} fill={color} opacity={quiet ? 0.55 : 0.9} />
      </Part>
    );
  const insetX = 700;
  const insetY = 420;
  const insetW = 40;
  return (
    <g>
      <rect x={200} y={yTop - 20} width={600} height={yBot - yTop + 40} rx={40} fill="#131b2e" opacity={0.5} />
      {band(0, 10, 'notokorda', C.notochord, 1, true)}
      {band(10, 40, 'mesodermo-paraxiala', C.mesoParaxial, paraxial)}
      {band(40, 58, 'bitarteko-mesodermoa', C.mesoIntermediate, intermediate)}
      {band(40, 130, 'alboko-mesodermoa', C.mesoLateral, lateral * (1 - coelom))}
      {band(40, 130, 'alboko-mesodermoa', C.mesoLateral, lateral * coelom, true)}
      <Note x={500} y={110} tone="dim">
        Kraneala
      </Note>
      <Note x={500} y={560} tone="dim">
        Kaudala
      </Note>
      <Label id="mesodermo-paraxiala" x={190} y={190} ax={500 + 24} ay={yTop + 34} show={paraxial} />
      <Label id="bitarteko-mesodermoa" x={190} y={250} ax={500 + 48} ay={yTop + 60} show={intermediate} />
      <Label id="alboko-mesodermoa" x={190} y={420} ax={500 + 90} ay={yTop + 90} show={lateral * (1 - coelom)} />

      {/* Cross-section inset: shows the true dorsoventral stack (dortsala top) once the coelom forms. */}
      <g opacity={coelom}>
        <rect x={insetX - insetW - 14} y={insetY - 70} width={2 * insetW + 28} height={150} rx={10} fill="#141416" stroke="#3a3a40" strokeWidth={1} />
        <text x={insetX} y={insetY - 78} textAnchor="middle" fontSize={11} fill="#8a97b3">Zeharkako mozketa (eskema)</text>
        <Part id="paretako-orria" show={coelom}>
          <rect x={insetX - insetW} y={insetY - 55} width={2 * insetW} height={26} rx={4} fill={C.mesoLateral} />
        </Part>
        <Part id="enbrioi-barruko-zeloma" show={coelom}>
          <rect x={insetX - insetW} y={insetY - 29} width={2 * insetW} height={18} fill={C.coelom} stroke="rgba(255,150,150,0.4)" strokeWidth={0.8} />
        </Part>
        <Part id="errai-orria" show={coelom}>
          <rect x={insetX - insetW} y={insetY - 11} width={2 * insetW} height={26} rx={4} fill={C.mesoLateral} />
        </Part>
        <text x={insetX - insetW - 8} y={insetY - 42} textAnchor="end" fontSize={10} fill="#cbd5f5">paretakoa</text>
        <text x={insetX - insetW - 8} y={insetY - 20} textAnchor="end" fontSize={10} fill="#ffb3b3">zeloma</text>
        <text x={insetX - insetW - 8} y={insetY + 3} textAnchor="end" fontSize={10} fill="#cbd5f5">erraia</text>
      </g>
    </g>
  );
}
