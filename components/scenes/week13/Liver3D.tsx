'use client';

import { VP0, type VeinPose } from './veins3d';
import { ORIGIN_KEY13, orbit, veinStage } from './common';

/**
 * Topic 13, stages 2–5 (notes 2, 2.1.1–2.1.3, 2.2): the three vein pairs of the 5th week at topic 10's
 * sinus venosus, then the vitelline veins round the duodenum and into the liver (the portal vein, the
 * hepatocardiac channels) and the umbilical veins (the ductus venosus, on the liver's surface).
 */

const SH: [number, number] = [30, 0];
const HEART = ['bihotza', 'zain-sinua', 'eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena', 'zain-sinuaren-zeharkako-atala'];
const VIT = ['bitelo-zainak', 'zain-plexu-periduodenala', 'gibeleko-sinusoideak', 'hodi-hepatokardiakoak', 'porta-zaina', 'zain-esplenikoa', 'goiko-zain-mesenterikoa', 'zain-hepatikoak', 'barea', 'duodenoa', 'gibel-hastapena', 'gibela', 'septum-transversum', 'bitelo-zaku-sekundarioa', 'hodi-onfalomesenterikoa', ...HEART];
const UMB = ['zilbor-zainak', 'hodi-benosoa', 'gibela', 'gibeleko-sinusoideak', 'eskuineko-hodi-hepatokardiakoa', ...HEART];
const hornR = { id: 'eskuineko-sinu-luzapena', p: 'zain-sinua-R' };
const hornL = { id: 'ezkerreko-sinu-luzapena', p: 'zain-sinua-L' };

// ———————————————————————————— stage 2: the main veins (notes 2) ————————————————————————————

export const S2 = [0, 0.3, 0.64] as const;

const ALL_IN = [
  { path: ['vitDistR', 'vitPeriR', 'vitHepR', 'hcR'], sat: 0.08 },
  { path: ['vitDistL', 'vitPeriL', 'vitHepL', 'hcL'], sat: 0.08 },
  { path: ['umbDistR', 'umbLiverR', 'umbProxR'], sat: 0.85 },
  { path: ['umbDistL', 'umbLiverL', 'umbProxL'], sat: 0.85 },
  { path: ['-acTopR', '-acMidR', '-acLowR', '-commonR'], sat: 0.08, n: 10 },
  { path: ['-acTopL', '-acLowL', '-commonL'], sat: 0.08, n: 10 },
  { path: ['-pcLowR', '-pcUpR', '-commonR'], sat: 0.08, n: 10 },
  { path: ['-pcLowL', '-pcUpL', '-commonL'], sat: 0.08, n: 10 },
];

export const MainVeins3D = veinStage({
  S: S2,
  pose: VP0,
  opts: { heart: 1, heartGlass: 0.25, stalk: 1, ghosts: 1 },
  caption: '5. astea · zain sinua eta hiru zain bikoteak (3D eredua, aurretik)',
  key: [
    { color: '#a78bfa', text: 'zain sinua' },
    { color: '#22c3b0', text: 'bitelinoak' },
    { color: '#f0609a', text: 'zilborrekoak' },
    { color: '#2f6fe0', text: 'aurreko kard.' },
    { color: '#7dd3fc', text: 'kard. komuna' },
    { color: '#84cc16', text: 'atzeko kard.' },
  ],
  steps: [
    {
      cam: orbit(-14, 10, 24, [0, -0.7, 0.1], SH),
      names: [hornR, hornL, { id: 'bitelo-zainak', p: 'bitelo-zainakR' }, { id: 'zilbor-zainak', p: 'zilbor-zainakL' }, { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komunaR' }, { id: 'aurreko-zain-kardinalak', p: 'aurreko-zain-kardinalak-topL', small: true }, { id: 'atzeko-zain-kardinalak', p: 'atzeko-zain-kardinalakL', small: true }],
      note: 'Zain sinuaren bi luzapenetara hiru zain motak: kardinal komunak, zain bitelinoak eta zilborreko zainak',
      flows: ALL_IN,
    },
    {
      to: { plexus: 1, acAn: 1 },
      run: [0.1, 0.55],
      cam: orbit(-12, 8, 17, [0, -0.4, 0.1], SH),
      glide: 0.06,
      names: [{ id: 'anastomosiak', p: 'aurreko-kardinalen-anastomosia' }, { id: 'zain-plexu-periduodenala', text: 'Anastomosiak (bitelinoen artean)', small: true }],
      note: 'Aurretik begiratzen dugu: zainen artean anastomosiak sortzen dira, eta ezkerreko zainetako odola eskuinera doa',
      flows: [
        { path: ['acAn', '-acMidR', '-acLowR', '-commonR'], sat: 0.08, from: 0.55, n: 10 },
        { path: ['pUp', 'vitHepR', 'hcR'], sat: 0.08, from: 0.55, n: 10 },
        { path: ['pLow', 'vitPeriR', 'vitHepR', 'hcR'], sat: 0.08, from: 0.55, n: 10 },
      ],
    },
    {
      to: { shift: 1 },
      run: [0.1, 0.7],
      cam: orbit(-25, 14, 9, [0, 0.0, -0.3], SH),
      glide: 0.06,
      names: [hornR, { id: 'ezkerreko-sinu-luzapena', p: 'zain-sinua-L', sub: '(gero eta txikiagoa)' }],
      note: 'Zain sinuaren ezkerreko luzapenak gero eta garrantzi gutxiago du: odola eskuineko luzapenera doa',
      flows: [
        { path: ['acAn', '-acMidR', '-acLowR', '-commonR'], sat: 0.08, n: 10 },
        { path: ['-pcLowR', '-pcUpR', '-commonR'], sat: 0.08, n: 10 },
        { path: ['vitPeriR', 'vitHepR', 'hcR'], sat: 0.08, n: 10 },
      ],
    },
  ],
});

// ———————————————————————————— stage 3: the vitelline veins (notes 2.1.1) ————————————————————————————

export const S3 = [0, 0.1, 0.22, 0.35, 0.48, 0.6, 0.73, 0.87] as const;

const VIT_FLOW = [
  { path: ['vitDistR', 'vitPeriR', 'vitHepR', 'hcR'], sat: 0.08 },
  { path: ['vitDistL', 'vitPeriL', 'vitHepL', 'hcL'], sat: 0.08 },
];

export const Vitelline3D = veinStage({
  S: S3,
  pose: VP0,
  opts: { heart: 1, heartGlass: 0.3, stalk: 1, gut: 1, ghosts: 1, liverOp: 0.3 },
  caption: '5. astea · zain bitelinoak, bitelo zakutik zain sinura',
  key: ORIGIN_KEY13.liver,
  steps: [
    {
      cam: orbit(-14, 8, 16.5, [0, -2.9, 0.6], SH),
      dim: VIT,
      names: [{ id: 'bitelo-zainak', p: 'bitelo-zainak-distR' }, { id: 'bitelo-zaku-sekundarioa', text: 'Bitelo zakua', small: true }, hornR, hornL],
      note: 'Zain bitelinoek bitelo zakuko odola dakarte, eta zain sinuaren eskuineko eta ezkerreko luzapenetan irekitzen dira',
      flows: VIT_FLOW,
    },
    {
      to: { plexus: 1 },
      cam: orbit(-28, 10, 8.5, [0, -3.1, 0.45], SH),
      glide: 0.06,
      dim: VIT,
      names: ['duodenoa', { id: 'zain-plexu-periduodenala', from: 0.5 }, { id: 'bitelo-zainak', p: 'bitelo-zainakL', small: true }],
      note: 'Duodenoaren inguruan adarkatu eta elkarren artean lotzen dira (anastomosiak): zain sare edo plexu bat',
    },
    {
      to: { liver: 0.42 },
      opts: { septum: 1 },
      cam: orbit(-22, 12, 9.5, [0, -2.0, 0.45], SH),
      glide: 0.06,
      dim: VIT,
      names: ['septum-transversum', { id: 'gibel-hastapena', from: 0.4 }, { id: 'gibela', from: 0.65, small: true }, { id: 'duodenoa', small: true }],
      note: 'Septum transversumaren mesodermoan gibela garatzen da: aurreko hestetik ebaginazio endodermiko bat, gibel hastapena',
    },
    {
      to: { liver: 1, sinus: 1 },
      run: [0.06, 0.75],
      cam: orbit(-16, 12, 10, [0, -1.7, 0.4], SH),
      glide: 0.06,
      dim: VIT,
      names: ['gibela', { id: 'gibeleko-sinusoideak', from: 0.55 }, { id: 'bitelo-zainak', p: 'bitelo-zainak-hepR', small: true }],
      note: 'Zain bitelinoak gibelera sartu, barnean adarkatu eta beste plexu bat sortzen dute: gibeleko sinusoideak',
      flows: VIT_FLOW,
    },
    {
      cam: orbit(-8, 10, 11.5, [0, -0.9, 0.0], SH),
      glide: 0.06,
      dim: VIT,
      names: ['eskuineko-hodi-hepatokardiakoa', 'ezkerreko-hodi-hepatokardiakoa', { id: 'gibeleko-sinusoideak', small: true }],
      note: 'Gibeletik irtetean, odola bi hodi hepatokardiakoetatik (zain bitelinoen azken atalak) zain sinura',
      flows: [
        { path: ['vitHepR', 'hcR'], sat: 0.08, n: 8 },
        { path: ['vitHepL', 'hcL'], sat: 0.08, n: 8 },
      ],
    },
    {
      cam: orbit(-40, 8, 10.5, [-0.5, -0.8, -0.1], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'eskuineko-hodi-hepatokardiakoa', sub: '→ beheko kabaren gibel atala' }, hornR],
      note: 'Eskuineko hodi hepatokardiakoa garrantzitsua da: beheko bena kabaren gibel atala izango da',
      flows: [{ path: ['vitHepR', 'hcR'], sat: 0.08, n: 8 }],
    },
    {
      to: { lDist: 1, lProx: 1, rDist: 1 },
      run: [0.08, 0.75],
      cam: orbit(-6, 8, 14, [0, -2.2, 0.3], SH),
      glide: 0.06,
      dim: VIT,
      names: [
        { id: 'ezkerreko-zain-bitelinoa', p: 'bitelo-zainak-distL', text: 'Ezkerreko urrutiko atala' },
        { id: 'ezkerreko-hodi-hepatokardiakoa', text: 'Ezkerreko hurbileko atala', sub: '(ezkerreko hodi hepatokardiakoa)' },
        { id: 'eskuineko-zain-bitelinoa', p: 'bitelo-zainak-distR', text: 'Eskuineko urrutiko atala' },
      ],
      note: 'Desagertzen dira: ezkerreko zain bitelinoaren urrutiko eta hurbileko atalak, eta eskuinekoaren urrutiko atala',
    },
    {
      to: { remodel: 1, names: { portal: 1 } },
      run: [0.06, 0.6],
      cam: orbit(-20, 10, 10, [0, -2.4, 0.3], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'porta-zaina', from: 0.45 }, { id: 'duodenoa', small: true }, { id: 'eskuineko-hodi-hepatokardiakoa', small: true }],
      note: 'Duodenoaren inguruan geratzen den eskuineko zain bitelinoaren ataletik porta zaina: abdomeneko errai batzuetako odola',
      flows: [{ path: ['vitPeriR', 'vitHepR', 'hcR'], sat: 0.08, from: 0.6, n: 10 }],
    },
  ],
});

// ———————————————————————————— stage 4: the portal vein and the hepatocardiac channels (notes 2.1.2–2.1.3) ————————————————————————————

export const S4 = [0, 0.14, 0.28, 0.44, 0.6, 0.75, 0.88] as const;

const VIT_END: VeinPose = { ...VP0, plexus: 1, liver: 1, sinus: 1, lDist: 1, lProx: 1, rDist: 1, remodel: 1, names: { ...VP0.names, portal: 1 } };
const PORTAL_FLOW = { path: ['-smv', 'vitPeriR', 'vitHepR', 'hcR'], sat: 0.08, n: 14 };

export const Portal3D = veinStage({
  S: S4,
  pose: VIT_END,
  opts: { heart: 1, heartGlass: 0.3, stalk: 0.4, gut: 1, ghosts: 1, liverOp: 0.3 },
  caption: '6.–7. asteak · porta zaina eta haren adarrak',
  key: ORIGIN_KEY13.liver,
  steps: [
    {
      cam: orbit(-18, 10, 10, [0, -2.6, 0.3], SH),
      dim: VIT,
      names: ['porta-zaina', { id: 'duodenoa', small: true }, { id: 'eskuineko-zain-bitelinoa', p: 'porta-zaina', text: 'Eskuineko zain bitelinoa', small: true, from: 0.3 }],
      note: 'Porta zaina duodenoaren inguruko plexutik, eskuineko zain bitelinotik; bi zain nagusi heltzen zaizkio',
    },
    {
      to: { portal: 0.5 },
      cam: orbit(-34, 6, 9.5, [-0.2, -3.5, 0.3], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'goiko-zain-mesenterikoa', from: 0.4 }, { id: 'porta-zaina', small: true }],
      note: 'Goiko zain mesenterikoa (portaren eskuinean): eskuineko zain bitelinotik hau ere',
      flows: [{ path: ['-smv', 'vitPeriR'], sat: 0.08, from: 0.5, n: 8 }],
    },
    {
      to: { portal: 1 },
      cam: orbit(18, 14, 10, [0.5, -3.1, 0.1], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'zain-esplenikoa', p: 'zain-esplenikoa', from: 0.3 }, { id: 'barea', from: 0.4 }, { id: 'porta-zaina', small: true }],
      note: 'Zain esplenikoa (portaren ezkerrean): baretik, bi zain bitelinoen arteko anastomosi batetik sortua',
      flows: [{ path: ['-spleenV', 'pMid', 'vitPeriR'], sat: 0.08, from: 0.5, n: 10 }],
    },
    {
      to: { hepV: 1 },
      cam: orbit(-14, 10, 11, [0, -1.9, 0.2], SH),
      glide: 0.06,
      dim: VIT,
      names: ['porta-zaina', { id: 'gibeleko-sinusoideak', small: true }, { id: 'zain-hepatikoak', from: 0.4, small: true }, 'eskuineko-hodi-hepatokardiakoa', hornR],
      note: 'Biak elkartu eta porta zainera; porta gibelean adarkatzen da, eta gibeletik eskuineko hodi hepatokardiakora, eskuineko luzapenera',
      flows: [PORTAL_FLOW, { path: ['-spleenV', 'pMid', 'vitPeriR', 'vitHepR', 'hcR'], sat: 0.08, n: 12 }],
    },
    {
      cam: orbit(4, 10, 9, [0, -0.9, 0.0], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'ezkerreko-hodi-hepatokardiakoa', text: 'Ezkerreko hodi hepatokardiakoa', sub: '(desagertu da)' }, 'eskuineko-hodi-hepatokardiakoa'],
      note: 'Hasieran bi hodi hepatokardiako; ezkerrekoa desagertzen da, eskuinekoa bakarrik geratzen da',
    },
    {
      cam: orbit(-26, 8, 11, [-0.1, -1.9, 0.2], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'porta-zaina', sub: '(behetik)' }, { id: 'gibeleko-sinusoideak', text: 'Gibel barneko zain plexua' }, { id: 'eskuineko-hodi-hepatokardiakoa', sub: '(goian)' }, hornR],
      note: 'Bidea: porta zaina (behetik) → gibel barneko zain plexua → eskuineko hodi hepatokardiakoa (goian) → eskuineko luzapena',
      flows: [PORTAL_FLOW],
    },
    {
      to: { names: { hep: 1 } },
      run: [0.2, 0.5],
      cam: orbit(-38, 8, 8.5, [-0.3, -0.8, -0.1], SH),
      glide: 0.06,
      dim: VIT,
      names: [{ id: 'eskuineko-hodi-hepatokardiakoa', p: 'eskuineko-hodi-hepatokardiakoa', text: 'Eskuineko hodi hepatokardiakoa', sub: '→ beheko kabaren gibel segmentua' }],
      note: 'Eskuineko hodi hepatokardiakoa garapenean beheko bena kabaren gibel segmentua izango da',
      flows: [PORTAL_FLOW],
    },
  ],
});

// ———————————————————————————— stage 5: the umbilical veins (notes 2.2) ————————————————————————————

export const S5 = [0, 0.12, 0.25, 0.38, 0.52, 0.68, 0.84] as const;

const PORTAL_END: VeinPose = { ...VIT_END, portal: 1, hepV: 1, names: { ...VIT_END.names, hep: 1 } };
const UMB_RED = (side: 'L' | 'R') => ({ path: [`umbDist${side}`, `umbLiver${side}`, `umbProx${side}`], sat: 0.85, n: 12 });

export const Umbilical3D = veinStage({
  S: S5,
  pose: PORTAL_END,
  opts: { heart: 1, heartGlass: 0.3, stalk: 0.4, gut: 0.5, ghosts: 1, liverOp: 0.3 },
  caption: '5.–7. asteak · zilborreko zainak eta hodi benosoa',
  key: ORIGIN_KEY13.liver,
  steps: [
    {
      cam: orbit(0, 6, 14, [0, -2.2, 0.4], SH),
      glide: 0.06,
      dim: UMB,
      names: [{ id: 'ezkerreko-zilbor-zaina', p: 'zilbor-zainakL' }, { id: 'eskuineko-zilbor-zaina', p: 'zilbor-zainakR' }, { id: 'gibela', small: true }, hornR, hornL],
      note: 'Hasieran zilborreko bi zainak gibelaren bi aldeetatik pasatzen dira, zain sinuaren bi luzapenetara',
      flows: [UMB_RED('L'), UMB_RED('R')],
    },
    {
      cam: orbit(-30, 10, 9, [-0.6, -1.4, 0.4], SH),
      glide: 0.06,
      dim: UMB,
      names: [{ id: 'gibeleko-sinusoideak', text: 'Gibel barneko zain plexua' }, { id: 'zilbor-zainak', p: 'zilbor-zainak-liverR', small: true }],
      note: 'Bidean gibel barneko zain plexuarekin (zain sarearekin) kontaktatzen dute',
      flows: [UMB_RED('L'), UMB_RED('R')],
    },
    {
      to: { umbProx: 1 },
      cam: orbit(0, 12, 10, [0, -0.6, 0.0], SH),
      glide: 0.06,
      dim: UMB,
      names: [
        { id: 'eskuineko-zilbor-zaina', p: 'zilbor-zainak-proxR', text: 'Eskuineko hurbileko atala' },
        { id: 'ezkerreko-zilbor-zaina', p: 'zilbor-zainak-proxL', text: 'Ezkerreko hurbileko atala' },
        { id: 'bihotza', small: true },
      ],
      note: 'Bi zilborreko zainen hurbileko atalak (bihotzetik hurbilen daudenak) desagertzen dira',
    },
    {
      to: { umbR: 1 },
      cam: orbit(-26, 6, 13, [-0.4, -2.4, 0.4], SH),
      glide: 0.06,
      dim: UMB,
      names: [{ id: 'eskuineko-zilbor-zaina', p: 'zilbor-zainakR', sub: '(osoa desagertzen da)' }],
      note: 'Gero, eskuineko zilborreko zain osoa desagertzen da',
    },
    {
      to: { dv0: 1 },
      run: [0.08, 0.7],
      cam: orbit(20, 4, 12, [0.2, -1.9, 0.2], SH),
      glide: 0.06,
      dim: UMB,
      names: [{ id: 'ezkerreko-zilbor-zaina', p: 'zilbor-zainakL', text: 'Ezkerreko zilborreko zaina' }, { id: 'hodi-benosoa', from: 0.45 }, 'eskuineko-hodi-hepatokardiakoa'],
      note: 'Ezkerreko zilborreko zainaren urrutiko atalak lotura zuzena egiten du eskuineko hodi hepatokardiakoarekin: hodi benosoa',
      flows: [{ path: ['umbDistL', 'dv', 'hcUpR'], sat: 0.85, from: 0.6, n: 14 }],
    },
    {
      cam: orbit(-10, 6, 12, [0, -1.8, 0.2], SH),
      glide: 0.06,
      dim: [...UMB, 'porta-zaina'],
      names: [{ id: 'ezkerreko-zilbor-zaina', p: 'zilbor-zainakL', text: 'Ezkerreko zilborreko zaina' }, 'hodi-benosoa', { id: 'eskuineko-hodi-hepatokardiakoa', sub: '(gero, beheko kabaren gibel segmentua)' }, { id: 'porta-zaina', small: true }],
      note: 'Karenako odol oxigenatua: ezkerreko zilborreko zaina → hodi benosoa → eskuineko hodi hepatokardiakoa; ez da gibel barneko plexuko odolarekin nahasten',
      flows: [{ path: ['umbDistL', 'dv', 'hcUpR'], sat: 0.85, n: 14 }, PORTAL_FLOW],
    },
    {
      opts: { liverOp: 0.62 },
      run: [0.05, 0.4],
      cam: orbit(168, -32, 10, [0, -1.8, -0.1], SH),
      glide: 0.08,
      dim: UMB,
      warn: true,
      names: [{ id: 'hodi-benosoa', sub: '(gibelaren azalean)' }, { id: 'gibela', small: true }, { id: 'ezkerreko-zilbor-zaina', p: 'zilbor-zainakL', text: 'Ezkerreko zilborreko zaina', sub: '(zaina, ez arteria)', small: true }],
      note: 'KONTUZ: hodi benosoa gibelaren azaleran dago, ez barruan · eta ezkerreko zilborreko ZAINA da, ez arteria',
      flows: [{ path: ['umbDistL', 'dv', 'hcUpR'], sat: 0.85, n: 14 }],
    },
  ],
});

/** For the anchor audit and the circulation stages. */
export const UMB_END: VeinPose = { ...PORTAL_END, umbProx: 1, umbR: 1, dv0: 1 };
