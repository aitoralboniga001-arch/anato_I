'use client';

import { C, Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { BODY, bandPathT, gutCenter, midT } from './common';
import { SectionDrawing, makeSection } from '@/components/scenes/section/Section';

/**
 * `bitarteko-eta-alboko-mesodermoa` — intermediate mesoderm: nephrotomes (cervical/upper
 * thoracic, segmented) and the nephrogenic cord (caudal, unsegmented) -> nephrons/kidney, gonads.
 * Lateral mesoderm is ALREADY split (from stage 1): somatic layer (+ ectoderm) -> body-wall
 * dermis, limb bones, sternum; splanchnic layer (+ endoderm) -> gut wall + covering of the
 * viscera; the coelom -> pleural, pericardial and peritoneal cavities (at different craniocaudal
 * levels — shown as a caption, not as three spots in one transverse section); the dorsal
 * mesentery keeps the folded gut tube suspended.
 *
 * Before ~t=0.6 the section is drawn with the same touching-band ("shell") model used in stages
 * 1 and 3. From t=0.6 the view switches to the POST-FOLDING topology: a closed body-wall ring
 * (ectoderm + somatic mesoderm), a dorsal mesenchyme block (notochord/neural tube/paraxial/
 * intermediate mesoderm), a small free-floating gut tube (endoderm + splanchnic mesoderm) hung
 * from the dorsal wall by the dorsal mesentery, and the coelom filling the space around it — NOT
 * a set of concentric rings sharing the endoderm across the whole circumference.
 */
// Fade-in windows end exactly at each beat's `at` (week4b.ts: 0, .14, .28, .42, .54, .66, .78, .9).
function geometry(t: number) {
  const fold = lerp(0.25, 0.93, seg(t, 0.04, 0.7));
  const nephro = seg(t, 0, 0.03);
  const split = seg(t, 0.2, 0.28); // already split from stage 1 — just fades the labels in
  const fateUro = seg(t, 0.34, 0.42);
  const fateWall = seg(t, 0.46, 0.54);
  const folded = seg(t, 0.62, 0.7);
  const fateCoelom = seg(t, 0.7, 0.78);
  const mesentery = seg(t, 0.82, 0.9);
  return { fold, nephro, split, fateUro, fateWall, folded, fateCoelom, mesentery };
}

function interSection(t: number) {
  const g = geometry(t);
  const s = makeSection({
    fold: g.fold,
    neural: 1,
    meso: 1,
    somite: 0.7,
    crest: 0,
    aorta: 1,
    k: lerp(0.9, 1.15, (g.fold - 0.25) / 0.68),
    oy: lerp(30, 0, (g.fold - 0.25) / 0.68),
    ids: { ectoderm: 'ektodermoa' },
  });
  return { s, g };
}

type P2 = [number, number];

/**
 * Transverse section (realistic engine) through the midgut level while lateral folding closes the body:
 * intermediate mesoderm (→ kidney + gonads), the already-split lateral mesoderm and, once folded,
 * the gut tube hanging from the dorsal wall by the dorsal mesentery, the coelom around it.
 */
export function IntermediateSection({ t }: SceneProps) {
  const { s, g } = interSection(t);
  const mid = (x: number) => (9 + s.dEndo(x)) / 2;
  const kid = (sd: number) => s.map(sd * 169, mid(169) - 6);
  const gon = (sd: number) => s.map(sd * 176, s.dEndo(176) - 12);
  const stern = (sd: number) => s.map(sd * 440, 15);
  const cTop = 22;
  const cBot = (x: number) => s.dEndo(x) - 13;
  const coel = s.map(330, (cTop + cBot(330)) / 2);
  const pari = s.map(400, cTop - 4);
  const visc = s.map(400, cBot(400) + 5);
  const inter = s.map(-169, mid(169) + 8);
  const mesA = s.at.mesentery;
  const icon = (p: P2, r: number, fill: string) => <circle cx={p[0]} cy={p[1]} r={r * s.k} fill={fill} stroke="#a8552f" strokeWidth={1} />;
  return (
    <g>
      <SectionDrawing s={s} show={{ crest: 0 }} />
      {/* Fate icons sit inside their source tissue. */}
      <Part id="giltzurruna" show={g.fateUro}>
        {icon(kid(1), 8, '#f2986b')}
        {icon(kid(-1), 8, '#f2986b')}
      </Part>
      <Part id="gonadak" show={g.fateUro}>
        {icon(gon(1), 6, '#fca5a5')}
        {icon(gon(-1), 6, '#fca5a5')}
      </Part>
      <Part id="esternoia" show={g.fateWall}>
        {[1, -1].map((sd) => (
          <rect key={sd} x={stern(sd)[0] - 8 * s.k} y={stern(sd)[1] - 5 * s.k} width={16 * s.k} height={10 * s.k} rx={2} fill="#e8eefc" stroke="#7a86a8" strokeWidth={1} />
        ))}
      </Part>

      {/* The three coelom-derived cavities are at different craniocaudal levels: shown as a caption, not spots here. */}
      <g opacity={g.fateCoelom}>
        <rect x={700} y={128} width={216} height={112} rx={10} fill="#0c1322" stroke="#33415c" strokeWidth={1} />
        <text x={710} y={114} fontSize={11} fill="#8a97b3">
          Maila kraneokaudal desberdinetan:
        </text>
        {[
          { id: 'pleura-barrunbea', y: 152 },
          { id: 'perikardio-barrunbea', y: 176 },
          { id: 'peritoneo-barrunbea', y: 200 },
        ].map((it) => (
          <Part key={it.id} id={it.id} show={g.fateCoelom}>
            <circle cx={718} cy={it.y} r={6} fill={C.coelom} stroke="#ff9d9d" strokeWidth={1} />
          </Part>
        ))}
        <Label id="pleura-barrunbea" x={732} y={152} ax={718} ay={152} align="start" show={g.fateCoelom} small />
        <Label id="perikardio-barrunbea" x={732} y={176} ax={718} ay={176} align="start" show={g.fateCoelom} small />
        <Label id="peritoneo-barrunbea" x={732} y={200} ax={718} ay={200} align="start" show={g.fateCoelom} small />
      </g>

      <Note x={500} y={610} tone={g.folded > 0.5 ? 'accent' : 'dim'}>
        {g.folded > 0.5 ? 'Tolestura zeharkakoa amaituta: heste-hodia zintzilik, zeloma inguruan' : 'Tolestura zeharkakoa gertatzen ari da'}
      </Note>

      <Label id="bitarteko-mesodermoa" x={190} y={110} ax={inter[0]} ay={inter[1]} show={g.nephro} />
      <Label id="giltzurruna" x={190} y={150} ax={kid(-1)[0] - 6} ay={kid(-1)[1]} show={g.fateUro} small />
      <Label id="gonadak" x={190} y={190} ax={gon(-1)[0] - 5} ay={gon(-1)[1]} show={g.fateUro} small />
      <Label id="mesenterio-dortsala" x={190} y={500} ax={mesA[0]} ay={mesA[1]} show={g.mesentery} small />
      <Label id="esternoia" x={190} y={540} ax={stern(-1)[0]} ay={stern(-1)[1]} show={g.fateWall} small />
      <Label id="paretako-orria" x={810} y={440} ax={pari[0]} ay={pari[1]} show={g.split} />
      <Label id="enbrioi-barruko-zeloma" x={810} y={480} ax={coel[0]} ay={coel[1]} show={g.split} />
      <Label id="errai-orria" x={810} y={520} ax={visc[0]} ay={visc[1]} show={g.split} />
    </g>
  );
}

/** Craniocaudal schematic: nephrotomes (segmented) cervically vs the nephrogenic cord (unsegmented) caudally. */
export function IntermediateLongitudinal({ t }: SceneProps) {
  // Fade-in windows end exactly at each beat's `at` (week4b.ts: 0, .14, .28, .42, ...). Beat 0's
  // focus (nefrotomak) has no room to fade in before t=0, so it is always fully shown instead.
  const nephro = 1;
  const cord = seg(t, 0.04, 0.14);
  const kidneyGonad = seg(t, 0.34, 0.42);
  const yTop = 150;
  const yBot = 500;
  const cordTop = yTop + 9 * 18 + 6;
  return (
    <g>
      <rect x={260} y={yTop - 30} width={480} height={yBot - yTop + 60} rx={30} fill="#131b2e" opacity={0.5} />
      <Note x={500} y={yTop - 50} tone="dim">Kraneala</Note>
      <Note x={500} y={yBot + 40} tone="dim">Kaudala</Note>
      <Note x={500} y={yTop - 10} tone="dim" size={12}>Lepoa / goiko toraxa</Note>
      <Note x={330} y={(cordTop + yBot) / 2} tone="dim" size={12}>Beheragoko atala</Note>

      <Part id="nefrotomak" show={nephro}>
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <rect x={462} y={yTop + i * 18} width={26} height={12} rx={3} fill={C.mesoIntermediate} opacity={0.5 + 0.5 * nephro} />
            <rect x={512} y={yTop + i * 18} width={26} height={12} rx={3} fill={C.mesoIntermediate} opacity={0.5 + 0.5 * nephro} />
          </g>
        ))}
      </Part>

      <Part id="kordoi-nefrogenoa" show={cord}>
        <rect x={462} y={cordTop} width={26} height={yBot - cordTop} rx={13} fill={C.mesoIntermediate} opacity={0.85} />
        <rect x={512} y={cordTop} width={26} height={yBot - cordTop} rx={13} fill={C.mesoIntermediate} opacity={0.85} />
      </Part>

      <Part id="giltzurruna" show={kidneyGonad}>
        <circle cx={500} cy={yBot - 40} r={10} fill="#f2986b" stroke="#a8552f" strokeWidth={1} />
      </Part>
      <Part id="gonadak" show={kidneyGonad}>
        <circle cx={500} cy={yBot - 12} r={7} fill="#fca5a5" stroke="#a8552f" strokeWidth={1} />
      </Part>

      <Label id="nefrotomak" x={190} y={220} ax={462} ay={yTop + 40} show={nephro} />
      <Label id="kordoi-nefrogenoa" x={810} y={400} ax={538} ay={cordTop + 60} show={cord} />
      <Label id="giltzurruna" x={190} y={440} ax={500} ay={yBot - 40} show={kidneyGonad} small />
      <Label id="gonadak" x={810} y={470} ax={500} ay={yBot - 12} show={kidneyGonad} small />
    </g>
  );
}
