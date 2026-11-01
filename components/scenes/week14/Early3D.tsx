'use client';

import { GP0, type GutPose } from './gut3d';
import { KEY14, gutStage, orbit } from './common';

/**
 * Topic 14, stages 2–5 (notes 2.1–2.3), in the curled 5-week embryo of every topic seen from its LEFT (the
 * notes' sagittal figures p2–p3: face on the viewer's left, back on the right): the gut tube from the
 * oropharyngeal to the cloacal membrane and its three parts; the respiratory diverticulum budding from the
 * foregut's ventral wall, after which the gut has four parts; the three ventral arteries, one per part;
 * the peritoneal cavity, the visceral peritoneum and the two-layer dorsal mesentery named by organ, the
 * thoracic part gone in week 5, and the ventral mesogastrium from the septum transversum.
 */

const SH: [number, number] = [30, 0];
/** The whole embryo from its left. */
const WHOLE = orbit(88, 6, 15.5, [0, 0.0, -0.55], SH);

// ———————————————————————————— stage 2: the gut's first parts (notes 2.1, p3–p6) ————————————————————————————

export const S2 = [0, 0.2, 0.42, 0.62, 0.8] as const;

const FORE3 = ['aurreko-hestea', 'faringe-hestea', 'mintz-bukofaringeoa', 'urdaila', 'gibel-hastapena'];
const MID3 = ['erdiko-hestea', 'hodi-onfalomesenterikoa', 'bitelo-zaku-sekundarioa'];
const HIND3 = ['atzeko-hestea', 'kloaka', 'kloaka-mintza', 'alantoidea'];
const OPM = { id: 'mintz-bukofaringeoa', text: 'Mintz orofaringeoa', sub: '(bukofaringeoa)' };
const MID = { id: 'erdiko-hestea', text: 'Bitarteko hestea' };

export const GutParts3D = gutStage({
  S: S2,
  pose: { ...GP0 },
  opts: { body: 1, heart: 0.55, septum: 0 },
  caption: '4. astea · hasierako hestea, alde zefalikotik kaudalera (3D eredua, ezkerretik)',
  key: KEY14.endo,
  keyTitle: 'Kolorea = jatorria',
  steps: [
    {
      cam: WHOLE,
      names: [OPM, { id: 'kloaka-mintza', from: 0.3 }, { id: 'endodermoa', text: 'Hestea', sub: '(endodermoa)', p: 'erdiko-hestea', from: 0.15 }],
      note: 'Hasieran hestea mintz orofaringeoan hasi eta kloaka mintzan bukatzen da',
    },
    {
      to: { parts: 1 },
      run: [0.1, 0.55],
      cam: orbit(84, 8, 15, [0, 0.05, -0.55], SH),
      names: [{ id: 'aurreko-hestea', p: 'aurreko-hestea-3' }, { ...MID, from: 0.25 }, { id: 'atzeko-hestea', from: 0.45 }],
      note: 'Alde zefalikotik kaudalera hiru atal: aurreko hestea, bitarteko hestea eta atzeko hestea; bakoitza bere kabuz hazten da',
      key: KEY14.three,
      keyTitle: 'Kolorea = atala',
    },
    {
      cam: orbit(70, 10, 9.5, [0, 1.2, -0.7], SH),
      glide: 0.05,
      dim: FORE3,
      names: [{ id: 'aurreko-hestea', p: 'aurreko-hestea-3' }, OPM, { id: 'gibel-hastapena', from: 0.4 }],
      note: 'Aurreko hestea: alde zefalikoan, mintz bukofaringeoan hasten da; gibel hastaperaino',
      key: KEY14.three,
      keyTitle: 'Kolorea = atala',
    },
    {
      to: { narrow: 1 },
      run: [0.3, 0.85],
      cam: orbit(62, 4, 10.5, [0, -1.2, 0.0], SH),
      glide: 0.05,
      dim: MID3,
      names: [MID, 'hodi-onfalomesenterikoa', { id: 'bitelo-zaku-sekundarioa', text: 'Bitelo zakua', small: true }],
      note: 'Bitarteko hestea bitelo zakuarekin komunikatuta dago: hodi onfalomesenterikoa (bitelinoa), hasieran zabala, gero estua',
      key: KEY14.three,
      keyTitle: 'Kolorea = atala',
    },
    {
      cam: orbit(110, 6, 9.5, [0, -1.5, 0.4], SH),
      glide: 0.05,
      dim: HIND3,
      names: ['atzeko-hestea', 'kloaka-mintza', { id: 'alantoidea', from: 0.35 }, { id: 'kloaka', small: true }],
      note: 'Atzeko hestea: kloaka mintzan bukatzen da, eta alantoidea barneratzen du',
      key: KEY14.three,
      keyTitle: 'Kolorea = atala',
    },
  ],
});
const END2: GutPose = { ...GP0, parts: 1, narrow: 1 };

// ———————————————————————————— stage 3: the respiratory diverticulum and four parts (notes 2.1, p7–p15) ————————————————————————————

export const S3 = [0, 0.15, 0.31, 0.47, 0.64, 0.84] as const;

const RESP = ['arnas-hastapena', 'hodi-laringotrakeala', 'birika-hastapenak', 'aurreko-hestea', 'faringe-hestea'];
const CLOSE = orbit(76, 8, 6.2, [0, 1.75, -0.2], SH);

export const Respiratory3D = gutStage({
  S: S3,
  pose: END2,
  opts: { body: 1, heart: 0.45, septum: 0.6 },
  caption: '4. astea · arnas aparatuaren hastapena eta hestearen lau atalak (3D eredua, ezkerretik)',
  key: KEY14.three,
  keyTitle: 'Kolorea = atala',
  steps: [
    {
      to: { resp: 0.35 },
      run: [0.15, 0.85],
      cam: CLOSE,
      glide: 0.06,
      dim: RESP,
      names: [{ id: 'aurreko-hestea', p: 'aurreko-hestea-3' }, { id: 'arnas-hastapena', from: 0.45, sub: '(aurreko paretatik)' }],
      note: '4. astean aurreko hestearen aurreko paretatik ebaginazio endodermiko bat: arnas aparatuaren hastapena',
    },
    {
      to: { resp: 0.7 },
      run: [0.08, 0.7],
      cam: orbit(80, 6, 5.6, [0, 1.6, -0.35], SH),
      glide: 0.05,
      dim: RESP,
      names: [
        { id: 'arnas-hastapena', small: true },
        { id: 'hodi-laringotrakeala', from: 0.2 },
        { id: 'laringea', text: '→ laringea', small: true, from: 0.45 },
        { id: 'trakea', text: '→ zintzurrestea (trakea)', small: true, from: 0.55 },
      ],
      note: 'Hurbileko atala (hodi laringotrakeala): laringea eta zintzurrestea (trakea)',
    },
    {
      to: { resp: 1 },
      run: [0.06, 0.6],
      cam: orbit(34, 12, 6, [0, 1.35, -0.4], SH),
      glide: 0.07,
      dim: RESP,
      names: [{ id: 'birika-hastapenak', from: 0.35, sub: '→ birikak' }, { id: 'hodi-laringotrakeala', small: true }],
      note: 'Urrutiko atalean bi birika hastapen agertzen dira: hauetatik birikak (aurretik eta ezkerretik ikusita)',
    },
    {
      to: { four: 1, pouches: 1 },
      run: [0.08, 0.7],
      // From the front and left: the paired pouches stand out on both side walls.
      cam: orbit(26, 12, 7, [0, 1.6, -0.1], SH),
      glide: 0.06,
      dim: ['faringe-hestea', 'faringe-poltsak', 'mintz-bukofaringeoa', 'arnas-hastapena'],
      names: [{ id: 'faringe-hestea', from: 0.2 }, { id: 'faringe-poltsak', from: 0.5 }, { ...OPM, small: true }],
      note: 'Orain lau atal: faringe hestea, mintz orofaringeotik arnas hastapeneraino; bere alboko paretetatik faringe-poltsak',
      key: KEY14.four,
    },
    {
      cam: orbit(88, 6, 15, [0, 0.0, -0.55], SH),
      glide: 0.07,
      names: [
        { id: 'faringe-hestea', small: true },
        { id: 'aurreko-hestea', sub: 'arnas hastapena → gibel hastapena' },
        { ...MID, sub: 'gibel hastapena → zeharkako kolonaren 2/3' },
        { id: 'atzeko-hestea', sub: 'kolonaren 2/3 → kloaka mintza' },
      ],
      marks: [
        { p: 'st-resp', text: 'arnas h.', dx: -34, dy: -6 },
        { p: 'st-liver', text: 'gibel h.', dx: -30, dy: -4 },
        { p: 'st-colon', text: '2/3 | 1/3', dx: 30, dy: 4 },
      ],
      note: 'Aurreko hestea arnas hastapenetik gibel hastapeneraino; bitarteko hestea zeharkako kolonaren 2/3 eta 1/3 artera arte; atzekoa kloaka mintzeraino',
      key: KEY14.four,
    },
    {
      cam: orbit(70, 10, 9.5, [0, 1.3, -0.6], SH),
      glide: 0.05,
      warn: true,
      dim: ['faringe-hestea', 'aurreko-hestea', 'mintz-bukofaringeoa', 'arnas-hastapena'],
      names: [{ id: 'aurreko-hestea', sub: '(orain arnas hastapenetik)' }, { ...OPM, small: true }, { id: 'faringe-hestea', small: true }],
      note: 'KONTUZ: hiru atalekin aurreko hestea mintz orofaringeoan hasten zen; arnas hastapenaren ondoren hortik faringe hestea da, eta aurrekoa arnas hastapenetik hasten da',
      key: KEY14.four,
    },
  ],
});
const END3: GutPose = { ...END2, resp: 1, four: 1, pouches: 1 };

// ———————————————————————————— stage 4: the three arteries (notes 2.2) ————————————————————————————

export const S4 = [0, 0.24, 0.48, 0.72] as const;

export const Arteries3D = gutStage({
  S: S4,
  pose: END3,
  opts: { body: 1, heart: 0.4, septum: 0.4, vessels: 0.8 },
  caption: 'Hestearen hiru arteriak: kolorea = arteria (3D eredua, ezkerretik)',
  key: KEY14.arteries,
  keyTitle: 'Kolorea = arteria',
  steps: [
    {
      to: { arteries: 1 },
      run: [0.1, 0.6],
      cam: orbit(92, 4, 13, [0, -0.1, -0.9], SH),
      glide: 0.05,
      names: [{ id: 'enbor-zeliakoa', from: 0.25 }, { id: 'goiko-arteria-mesenterikoa', from: 0.4 }, { id: 'beheko-arteria-mesenterikoa', from: 0.55 }, { id: 'aorta-dortsalak', text: 'Aorta', small: true }],
      note: 'Atal guztietatik sortutako eratorriak irrigatzeko hiru arteria daude, aortatik',
    },
    {
      cam: orbit(80, 6, 7.5, [0, 1.0, -1.4], SH),
      glide: 0.05,
      dim: ['enbor-zeliakoa', 'aurreko-hestea', 'urdaila', 'gibel-hastapena'],
      names: ['enbor-zeliakoa', { id: 'aurreko-hestea', sub: '(abdomenaren mailan)' }],
      note: 'Enbor zeliakoa: aurreko hestetik, abdomenaren mailan, sortzen diren eratorri guztiak',
    },
    {
      cam: orbit(70, 2, 8.5, [0, -0.6, -1.2], SH),
      glide: 0.05,
      dim: ['goiko-arteria-mesenterikoa', 'erdiko-hestea', 'hodi-onfalomesenterikoa'],
      names: ['goiko-arteria-mesenterikoa', MID],
      note: 'Goiko arteria mesenterikoa: bitarteko hestetik sortzen diren eratorriak',
    },
    {
      cam: orbit(108, 4, 8.5, [0, -1.6, -0.5], SH),
      glide: 0.05,
      dim: ['beheko-arteria-mesenterikoa', 'atzeko-hestea', 'kloaka'],
      names: ['beheko-arteria-mesenterikoa', 'atzeko-hestea'],
      note: 'Beheko arteria mesenterikoa: atzeko hestearen eratorriak',
    },
  ],
});
const END4: GutPose = { ...END3, arteries: 1 };

// ———————————————————————————— stage 5: the peritoneum and the mesenteries (notes 2.3) ————————————————————————————

export const S5 = [0, 0.13, 0.27, 0.42, 0.57, 0.72, 0.86] as const;

const MESO = ['mesenterio-dortsala', 'mesogastrio-dortsala', 'mesoduodeno-dortsala', 'mesenterioa', 'mesokolon-dortsala'];

export const Mesentery3D = gutStage({
  S: S5,
  pose: END4,
  opts: { body: 1, heart: 0.35, septum: 0.55 },
  caption: 'Peritoneo barrunbea eta mesenterioa (3D eredua)',
  key: KEY14.peritoneum,
  keyTitle: 'Kolorea',
  steps: [
    {
      to: { cavity: 1 },
      run: [0.1, 0.6],
      cam: orbit(88, 6, 12, [0, -0.2, -0.9], SH),
      glide: 0.05,
      dim: ['peritoneo-barrunbea', 'paretako-peritoneoa', 'septum-transversum'],
      names: [{ id: 'peritoneo-barrunbea', from: 0.3 }, { id: 'septum-transversum', text: 'Septum transversuma', sub: '(diafragma)', small: true }],
      note: 'Enbrioi barruko zeloma, diafragmaren azpian dagoena, peritoneo barrunbea da',
    },
    {
      to: { visceral: 1 },
      run: [0.1, 0.6],
      cam: orbit(72, 8, 10.5, [0, -0.5, -0.7], SH),
      glide: 0.05,
      dim: ['errai-peritoneoa', 'aurreko-hestea', 'erdiko-hestea', 'atzeko-hestea', 'urdaila'],
      names: [{ id: 'errai-peritoneoa', from: 0.3, sub: '(alboko mesodermoaren errai orria)' }],
      note: 'Hesteen eratorri guztiak errai peritoneoz (alboko mesodermoaren errai orriz) inguratuta daude',
    },
    {
      to: { meso: 1 },
      run: [0.1, 0.6],
      cam: orbit(38, 14, 9.5, [0, -0.4, -0.9], SH),
      glide: 0.08,
      dim: [...MESO, 'errai-peritoneoa', 'paretako-peritoneoa'],
      names: [{ id: 'mesenterio-dortsala', p: 'mesenterioa', text: 'Mesenterio dortsala', sub: '(bi orri; hasieran "mesenterioa")', from: 0.35 }, { id: 'paretako-peritoneoa', text: 'Atzeko paretako peritoneoa', small: true, from: 0.5 }],
      note: 'Errai peritoneoa atzeko paretako peritoneoarekin lotzen da bi orriko atzeko lotura baten bidez: hasieran mesenterio du izena (aurretik eta ezkerretik)',
    },
    {
      cam: orbit(84, 6, 11.5, [0, -0.3, -0.9], SH),
      glide: 0.07,
      dim: MESO,
      names: [{ id: 'mesogastrio-dortsala', from: 0.05 }, { id: 'mesoduodeno-dortsala', from: 0.2 }, { id: 'mesenterioa', from: 0.35 }, { id: 'mesokolon-dortsala', from: 0.5 }],
      note: 'Atzeko lotura horrek organoaren arabera izen propioa du: mesogastrio dortsala, mesoduodeno dortsala, mesenterioa, mesokolon dortsala',
    },
    {
      to: { retro: 1 },
      run: [0.1, 0.55],
      cam: orbit(128, 10, 9.5, [0, -0.6, -1.4], SH),
      glide: 0.06,
      dim: ['giltzurruna', 'aorta-dortsalak', 'beheko-kaba-zaina', 'paretako-peritoneoa'],
      names: [{ id: 'giltzurruna', from: 0.25, text: 'Giltzurrunak' }, { id: 'aorta-dortsalak', p: 'aorta', text: 'Aorta', from: 0.35 }, { id: 'beheko-kaba-zaina', from: 0.45 }],
      note: 'Hasieran egitura guztiak peritoneo barrukoak dira; atzeko paretako peritoneoaren atzean: giltzurrunak, aorta, beheko bena kaba (atzetik eta ezkerretik)',
    },
    {
      to: { thorGone: 1 },
      run: [0.15, 0.7],
      cam: orbit(84, 6, 11, [0, 0.4, -1.2], SH),
      glide: 0.06,
      dim: [...MESO, 'septum-transversum'],
      names: [{ id: 'mesenterio-dortsala', p: 'mesenterio-dortsala', text: 'Toraxeko mesenterioa', sub: '(desagertzen da)' }, { id: 'mesogastrio-dortsala', text: 'Abdomenekoa', sub: '(mantentzen da)', small: true }],
      note: '5. astetik aurrera toraxeko mesenterioa desagertzen da; abdomenean lotura mantentzen da',
    },
    {
      to: { ventral: 1 },
      run: [0.1, 0.6],
      cam: orbit(64, 8, 7.5, [0, 1.0, -1.3], SH),
      glide: 0.05,
      dim: ['mesogastrio-bentrala', 'mesogastrio-dortsala', 'urdaila', 'septum-transversum', 'gibel-hastapena'],
      names: [{ id: 'mesogastrio-bentrala', from: 0.3, sub: '(septum transversumeko mesodermotik)' }, { id: 'mesogastrio-dortsala', small: true }, { id: 'urdaila', small: true }],
      note: 'Urdailak aurreko meso bat ere badu, septum transversumeko mesodermotik: abdomenaren aurreko paretarekin lotzen du (aurreko mesogastrioa)',
    },
  ],
});
