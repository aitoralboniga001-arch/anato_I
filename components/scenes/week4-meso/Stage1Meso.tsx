'use client';

import { useId } from 'react';
import { C, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { discOutlinePath } from '@/components/scenes/week3/common';
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
 * Dorsal view of the trilaminar disc (ectoderm lifted off): mediolateral zones as cranio-caudal
 * stripes either side of the notochord, differentiating from cranial to caudal, with the node and the
 * shrinking primitive streak caudally and the two membranes (no mesoderm) at the ends. Seen from
 * above, the intraembryonic coelom is the horseshoe inside the lateral mesoderm (round the cranial
 * end, opening to the extraembryonic coelom at the sides). The somatic/splanchnic split itself is
 * dorsoventral, so a schematic cross-section inset shows that stack with its own clickable Parts.
 */
const DD = { cx: 500, cy: 318, rxTop: 172, rxBot: 124, ryTop: 196, ryBot: 176 };
const DISC_D = discOutlinePath(DD.cx, DD.cy, DD.rxTop, DD.rxBot, DD.ryTop, DD.ryBot);
const Y_BPM = 146; // bucco-pharyngeal membrane
const Y_PRE = 166; // prechordal plate
const Y_NODE = 420;
const Y_STREAK = 474;
const Y_CLOACA = 482;
const HORSESHOE = smoothPath(
  [[392, 468], [384, 390], [394, 280], [428, 196], [500, 168], [572, 196], [606, 280], [616, 390], [608, 468]],
  false,
  0.5,
);
// Vacuoles that coalesce into the horseshoe (points along it, mirrored).
const VACUOLES: Pt[] = [[390, 420], [388, 350], [398, 280], [418, 226], [452, 186], [500, 170]].flatMap(([x, y]): Pt[] => (x === 500 ? [[x, y]] : [[x, y], [1000 - x, y]]));

export function MesoSplitDorsal({ t }: SceneProps) {
  const { paraxial, lateral, vacuoles, coelom, somato, splanchno, intermediate } = geometry(t);
  const uid = useId().replace(/:/g, '');
  // Differentiation front, cranial → caudal (stops at the node: caudal to it the streak still feeds mesoderm).
  const front = lerp(Y_PRE + 40, Y_NODE + 20, seg(t, 0, 0.9));
  const stripe = (x0: number, x1: number, fill: string, op = 0.95) => (
    <>
      <rect x={DD.cx + x0} y={Y_PRE + 4} width={x1 - x0} height={Y_NODE + 30 - Y_PRE} rx={(x1 - x0) / 2} fill={fill} opacity={op} />
      <rect x={DD.cx - x1} y={Y_PRE + 4} width={x1 - x0} height={Y_NODE + 30 - Y_PRE} rx={(x1 - x0) / 2} fill={fill} opacity={op} />
    </>
  );
  const insetX = 836;
  const insetY = 392;
  const insetW = 64;
  const layer = (y: number, h: number, fill: string, stroke = 'none') => <rect x={insetX} y={y} width={insetW} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={1} />;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-disc`}>
          <path d={DISC_D} />
        </clipPath>
        <linearGradient id={`${uid}-front`} gradientUnits="userSpaceOnUse" x1={0} y1={front - 28} x2={0} y2={front + 28}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}-grow`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={0} y={0} width={1000} height={640} fill={`url(#${uid}-front)`} />
        </mask>
      </defs>

      {/* Disc rim (the amnion's attachment), then the thin intraembryonic mesoderm sheet seen from above */}
      <path d={DISC_D} fill="#171a26" stroke="#5b8def" strokeOpacity={0.55} strokeWidth={2} />
      <g clipPath={`url(#${uid}-disc)`}>
        {/* Stays under everything: caudal to the differentiation front the sheet is still undivided. */}
        <Part id="mesodermo-intraenbrionarioa" quiet={lateral > 0.5}>
          <path d={DISC_D} fill={C.mesoIntra} opacity={0.42} />
        </Part>
        {/* Lateral mesoderm: everything beside the axis, round the cranial end (cardiogenic area) to the rim */}
        {lateral > 0.02 && (
          <Part id="alboko-mesodermoa" show={lateral}>
            <g mask={`url(#${uid}-grow)`}>
              <path d={DISC_D} fill={C.mesoLateral} opacity={0.8} />
            </g>
          </Part>
        )}
        {intermediate > 0.02 && (
          <Part id="bitarteko-mesodermoa" show={intermediate}>
            <g mask={`url(#${uid}-grow)`}>{stripe(40, 58, C.mesoIntermediate)}</g>
          </Part>
        )}
        {paraxial > 0.02 && (
          <Part id="mesodermo-paraxiala" show={paraxial}>
            <g mask={`url(#${uid}-grow)`}>{stripe(8, 40, C.mesoParaxial)}</g>
          </Part>
        )}

        {/* Intraembryonic coelom: vacuoles in the lateral mesoderm that fuse into a horseshoe */}
        {vacuoles > 0.02 && (
          <g opacity={vacuoles}>
            {VACUOLES.map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx={3 + 5 * vacuoles} ry={2.5 + 4 * vacuoles} fill="#56202e" stroke="#ffb3b3" strokeOpacity={0.6} strokeWidth={1} />
            ))}
          </g>
        )}
        {coelom > 0.02 && (
          <Part id="enbrioi-barruko-zeloma" show={coelom}>
            <path d={HORSESHOE} fill="none" stroke="#ffb3b3" strokeOpacity={0.6} strokeWidth={6 + 11 * coelom} strokeLinecap="round" />
            <path d={HORSESHOE} fill="none" stroke="#56202e" strokeWidth={3 + 11 * coelom} strokeLinecap="round" />
          </Part>
        )}

        {/* Axis: membranes (no mesoderm), prechordal plate, notochord, node and the regressing streak */}
        <ellipse cx={DD.cx} cy={Y_BPM} rx={17} ry={9} fill="#171a26" />
        <ellipse cx={DD.cx} cy={Y_BPM} rx={13} ry={6} fill="rgba(223,230,247,0.45)" stroke="#dfe6f7" strokeWidth={1} />
        <ellipse cx={DD.cx} cy={Y_CLOACA} rx={13} ry={7} fill="#171a26" />
        <ellipse cx={DD.cx} cy={Y_CLOACA} rx={10} ry={5} fill="rgba(223,230,247,0.45)" stroke="#dfe6f7" strokeWidth={1} />
        <ellipse cx={DD.cx} cy={Y_PRE} rx={11} ry={6} fill={C.prechordal} stroke="#f5b8e2" strokeWidth={1} />
        <Part id="notokorda">
          <rect x={DD.cx - 5} y={Y_PRE + 5} width={10} height={Y_NODE - Y_PRE - 8} rx={5} fill={C.notochord} stroke="#d8b4fe" strokeWidth={1} />
        </Part>
        <path
          d={`M${DD.cx - 6},${Y_STREAK} Q${DD.cx - 8},${(Y_NODE + Y_STREAK) / 2} ${DD.cx - 3},${Y_NODE + 6} L${DD.cx + 3},${Y_NODE + 6} Q${DD.cx + 8},${(Y_NODE + Y_STREAK) / 2} ${DD.cx + 6},${Y_STREAK} Q${DD.cx},${Y_STREAK + 5} ${DD.cx - 6},${Y_STREAK}Z`}
          fill="#0c1730"
          stroke="#93a7d9"
          strokeWidth={1.2}
        />
        <ellipse cx={DD.cx} cy={Y_NODE} rx={10} ry={8} fill={C.ectoderm} stroke="#dbe4ff" strokeWidth={1.2} />
        <ellipse cx={DD.cx} cy={Y_NODE} rx={4} ry={3} fill="#02040a" />
      </g>
      <path d={DISC_D} fill="none" stroke="#5b8def" strokeOpacity={0.55} strokeWidth={2} />

      <Note x={500} y={100} tone="dim">
        Kraneala
      </Note>
      <Note x={500} y={532} tone="dim">
        Kaudala
      </Note>
      <Label id="mesodermo-intraenbrionarioa" x={190} y={250} ax={DD.cx - 90} ay={300} show={1 - lateral} />
      <Label id="mesodermo-paraxiala" x={190} y={200} ax={DD.cx - 24} ay={250} show={paraxial} />
      <Label id="bitarteko-mesodermoa" x={190} y={250} ax={DD.cx - 49} ay={290} show={intermediate} />
      <Label id="alboko-mesodermoa" x={190} y={420} ax={DD.cx - 120} ay={Math.min(front - 10, 330)} show={lateral} />
      <Label id="notokorda" x={190} y={470} ax={DD.cx - 4} ay={380} />
      <Label id="enbrioi-barruko-zeloma" x={790} y={250} ax={604} ay={262} show={Math.max(coelom, vacuoles)} />

      {/* Cross-section inset: the true dorsoventral stack of the lateral mesoderm once the coelom forms. */}
      <g opacity={coelom}>
        <rect x={insetX - 118} y={insetY - 48} width={insetW + 140} height={150} rx={10} fill="#141416" stroke="#3a3a40" strokeWidth={1} />
        <text x={insetX - 118 + (insetW + 140) / 2} y={insetY - 28} textAnchor="middle" fontSize={11} letterSpacing="0.06em" fill="#8a97b3">
          ZEHARKAKO MOZKETA
        </text>
        {layer(insetY - 12, 10, C.ectoderm)}
        <Part id="paretako-orria" show={coelom}>{layer(insetY + 2, 16, C.mesoLateral)}</Part>
        <Part id="enbrioi-barruko-zeloma" show={coelom}>{layer(insetY + 20, 14, '#56202e', 'rgba(255,179,179,0.6)')}</Part>
        <Part id="errai-orria" show={coelom}>{layer(insetY + 36, 16, C.mesoLateral)}</Part>
        {layer(insetY + 56, 10, C.endoderm)}
        {(
          [
            ['Ektodermoa', insetY - 7, '#8fb0f5', 1],
            ['Paretako orria', insetY + 10, '#efece6', 0.35 + 0.65 * somato],
            ['Zeloma', insetY + 27, '#ffb3b3', 1],
            ['Errai orria', insetY + 44, '#efece6', 0.35 + 0.65 * splanchno],
            ['Endodermoa', insetY + 61, '#f2d58a', 1],
          ] as const
        ).map(([txt, y, fill, o]) => (
          <text key={txt} x={insetX - 10} y={y} dy="0.35em" textAnchor="end" fontSize={11.5} fontWeight={600} fill={fill} opacity={o}>
            {txt}
          </text>
        ))}
        <text x={insetX + insetW / 2} y={insetY + 84} textAnchor="middle" fontSize={10} fill="#6b7280">
          dortsala ↑
        </text>
      </g>
    </g>
  );
}
