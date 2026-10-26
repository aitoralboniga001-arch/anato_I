'use client';

import { Note } from '@/components/kit';
import { SummaryTable } from '@/components/scenes/week10/common';
import { seg } from '@/lib/sim/anim';
import { ADULT, CARD_DONE, VC, spaceY, type VeinPose } from './veins3d';
import { ORIGIN_KEY13, orbit, veinStage, type Flow, type PoseTo } from './common';
import { UMB_END } from './Liver3D';

/**
 * Topic 13, stages 6–12 (notes 2.3, 3, 3.1, 3.2): the cardinal veins and the three new systems of weeks
 * 5–7, the azygos system, and the two venae cavae built from them, segment by segment, with every
 * anastomosis carrying the left veins' blood to the right. The same model as stages 2–5, seen mostly
 * from behind (the cardinals lie in the back wall) and turning to the front for the venae cavae.
 */

const SH: [number, number] = [30, 0];
const HEART = ['bihotza', 'zain-sinua', 'eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena', 'zain-sinuaren-zeharkako-atala', 'eskuineko-aurikula', 'atal-lisoa', 'sinu-koronarioa', 'ezkerreko-aurikularen-zain-laprana'];
const CARD = ['aurreko-zain-kardinalak', 'atzeko-zain-kardinalak', 'bena-kardinal-komuna', 'kardinal-azpiko-zainak', 'zain-sakrokardinalak', 'kardinal-gaineko-zainak', 'kardinal-gaineko-anastomosia', 'saihets-arteko-zainak', 'giltzurruna', 'gonadak', 'saihetsak', 'goiko-gorputz-adarraren-hasikina', 'beheko-gorputz-adarraren-hasikina', ...HEART];
const AZ = ['azigos-zaina', 'hemiazigos-zaina', 'hemiazigos-laguntzailea', 'kardinal-gaineko-zainak', 'kardinal-gaineko-anastomosia', 'saihets-arteko-zainak', 'lehen-saihets-arteko-enborra', 'zain-lunbarra', 'atzeko-zain-kardinalak', 'bena-kardinal-komuna', 'goiko-kaba-zaina', 'saihetsak', ...HEART];
const IVC = ['beheko-kaba-zaina', 'kabaren-gibel-segmentua', 'kabaren-giltzurrun-segmentua', 'kabaren-segmentu-sakrokardinala', 'kardinal-azpiko-zainak', 'kardinal-azpiko-anastomosia', 'ezkerreko-giltzurrun-zaina', 'ezkerreko-zain-gonadala', 'zain-sakrokardinalak', 'sakrokardinal-anastomosia', 'zain-iliako-primitiboak', 'kanpoko-zain-iliakoak', 'barneko-zain-iliakoak', 'beheko-zain-lunbarrak', 'porta-zaina', 'giltzurruna', 'gonadak', ...HEART];
const SVC = ['goiko-kaba-zaina', 'aurreko-zain-kardinalak', 'bena-kardinal-komuna', 'aurreko-kardinalen-anastomosia', 'zain-brakiozefalikoak', 'barneko-jugularrak', 'zain-subklabioak', 'kanpoko-jugularrak', 'goiko-gorputz-adarraren-hasikina', 'azigos-zaina', ...HEART];

const hornR = { id: 'eskuineko-sinu-luzapena', p: 'zain-sinua-R' };
const hornL = { id: 'ezkerreko-sinu-luzapena', p: 'zain-sinua-L' };

// Blood routes (centreline keys; '-' = against the drawn direction).
const AZ_UP: Flow = { path: ['-supLowR', '-supMidR', '-supUpR', '-supLinkR', '-pcUpR', '-commonR'], sat: 0.08, n: 14 };
const CARD_IN: Flow[] = [
  { path: ['-acTopR', '-acMidR', '-acLowR', '-commonR'], sat: 0.08, n: 10 },
  { path: ['-acTopL', '-acLowL', '-commonL'], sat: 0.08, n: 10 },
  { path: ['-pcLowR', '-pcUpR', '-commonR'], sat: 0.08, n: 10 },
  { path: ['-pcLowL', '-pcUpL', '-commonL'], sat: 0.08, n: 10 },
];
const IVC_R: Flow = { path: ['-sacroDistR', '-sacroProxR', '-subLowR', '-subUpR', 'hepSub', 'hcR'], sat: 0.08, n: 16 };
const IVC_L: Flow = { path: ['-sacroDistL', 'sacroAn', '-sacroProxR', '-subLowR', '-subUpR', 'hepSub', 'hcR'], sat: 0.08, n: 16 };
const PORTAL: Flow = { path: ['-smv', 'vitPeriR', 'vitHepR', 'hcR'], sat: 0.08, n: 12 };
const RENAL_L: Flow = { path: ['renalL', 'subAn'], sat: 0.08, n: 6 };

// ———————————————————————————— stage 6: the cardinal veins and the three new systems (notes 2.3 p3–p7) ————————————————————————————

export const S6 = [0, 0.1, 0.2, 0.3, 0.42, 0.54, 0.66, 0.79, 0.9] as const;

export const Cardinal3D = veinStage({
  S: S6,
  pose: UMB_END,
  opts: { heart: 1, heartGlass: 0.35, liverOp: 0.16, gut: 0.3, ghosts: 1 },
  caption: '5.–7. asteak · kardinal zainak eta hiru zain sistema berriak',
  key: ORIGIN_KEY13.cardinal,
  steps: [
    {
      cam: orbit(-38, 10, 22, [0, -0.4, -0.5], SH),
      dim: CARD,
      names: [{ id: 'aurreko-zain-kardinalak', p: 'aurreko-zain-kardinalak-topR' }, { id: 'atzeko-zain-kardinalak', p: 'atzeko-zain-kardinalakR' }],
      note: '5. astera arte bi kardinal mota: aurrekoak (alde zefalikoko paretak) eta atzekoak (alde kaudaleko paretak)',
      flows: CARD_IN,
    },
    {
      cam: orbit(-30, 10, 12, [-0.4, 0.4, -0.5], SH),
      glide: 0.06,
      dim: CARD,
      names: [{ id: 'bena-kardinal-komuna', p: 'bena-kardinal-komunaR' }, { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komunaL', key: 'cc:L' }, hornR, hornL],
      note: 'Elkartuta kardinal komunak (ezkerrekoa eta eskuinekoa), zain sinuaren alboetako luzapenetan irekitzen direnak',
      flows: CARD_IN,
    },
    {
      cam: orbit(0, 8, 22, [0, -0.4, -0.6], SH),
      glide: 0.06,
      dim: CARD,
      names: [
        { id: 'aurreko-zain-kardinalak', p: 'aurreko-zain-kardinalak-topR', small: true },
        { id: 'aurreko-zain-kardinalak', p: 'aurreko-zain-kardinalak-topL', small: true, key: 'ac:L' },
        { id: 'atzeko-zain-kardinalak', p: 'atzeko-zain-kardinalakR', small: true },
        { id: 'atzeko-zain-kardinalak', p: 'atzeko-zain-kardinalakL', small: true, key: 'pc:L' },
      ],
      note: 'Hasieran sistema simetrikoa: bi aldeak oso antzekoak',
    },
    {
      to: { sub: 1 },
      opts: { kidneys: 1 },
      cam: orbit(-24, 8, 12, [0, -3.0, -0.5], SH),
      glide: 0.06,
      dim: CARD,
      names: [{ id: 'kardinal-azpiko-zainak', p: 'kardinal-azpiko-zainakR', from: 0.4 }, { id: 'giltzurruna', small: true }],
      note: '5.–7. asteetan hiru sistema berri, bilateralak · 1. kardinal azpiko zainak: giltzurrunetako zain odola',
    },
    {
      to: { sacro: 1 },
      opts: { limbs: 1 },
      cam: orbit(-24, 8, 12, [0, -4.8, -0.5], SH),
      glide: 0.06,
      dim: CARD,
      names: [{ id: 'zain-sakrokardinalak', p: 'zain-sakrokardinalakR', from: 0.4 }, { id: 'beheko-gorputz-adarraren-hasikina', small: true }],
      note: '2. zain sakrokardinalak (abdomenean): beheko gorputz adarretako zain odola',
    },
    {
      to: { supra: 1 },
      cam: orbit(152, 10, 14, [0, -1.8, -0.9], SH),
      glide: 0.08,
      dim: CARD,
      names: [{ id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakL', from: 0.3 }, { id: 'atzeko-zain-kardinalak', p: 'atzeko-zain-kardinalakL', small: true }],
      note: '3. kardinal gaineko zainak (horiak): goian atzeko kardinalen hurbileko atalekin jarraiak',
    },
    {
      to: { intercostal: 1 },
      opts: { ribs: 1 },
      cam: orbit(180, 8, 14, [0, -1.2, -1.0], SH),
      glide: 0.06,
      dim: CARD,
      names: [{ id: 'saihets-arteko-zainak', p: 'saihets-arteko-zainakL', from: 0.3 }, { id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakR', small: true }, { id: 'saihetsak', small: true }],
      note: 'Gorputz paretako zain odola saihets arteko zainetatik kardinal gaineko zainetara',
    },
    {
      to: { pcGone: 1 },
      cam: orbit(200, 8, 15, [0, -1.6, -1.0], SH),
      glide: 0.06,
      dim: CARD,
      names: [{ id: 'atzeko-zain-kardinalak', p: 'atzeko-zain-kardinalakL', sub: '(atal gehienak desagertzen dira)' }, { id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakR' }],
      note: 'Atzeko kardinal zainen atal gehienak desagertzen dira: haien lana kardinal gaineko zainek egiten dute',
      flows: [{ ...AZ_UP, from: 0.5 }],
    },
    {
      to: { supraAn: 1 },
      cam: orbit(180, 8, 12, [0, -2.0, -1.0], SH),
      glide: 0.06,
      dim: CARD,
      names: [{ id: 'kardinal-gaineko-anastomosia', from: 0.35 }, { id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakL', small: true }],
      note: 'Kardinal gaineko zainak euren artean anastomosi baten bidez lotuta',
      flows: [{ path: ['supAnLow'], sat: 0.08, n: 6, from: 0.5 }, AZ_UP],
    },
  ],
});

// ———————————————————————————— stage 7: the azygos system (notes 2.3 p8–p11) ————————————————————————————

export const S7 = [0, 0.11, 0.25, 0.37, 0.49, 0.61, 0.75, 0.88] as const;

const CARD6: VeinPose = { ...UMB_END, sub: 1, sacro: 1, supra: 1, intercostal: 1, pcGone: 1, supraAn: 1 };
const icMarks = (ks: number[], side: -1 | 1, text: string) => [{ p: [side * 1.75, spaceY(ks[Math.floor(ks.length / 2)]) - 0.15, -0.75] as [number, number, number], text }];

export const Azygos3D = veinStage({
  S: S7,
  pose: CARD6,
  opts: { heart: 1, heartGlass: 0.35, liverOp: 0.1, gut: 0.15, kidneys: 0.5, ribs: 1, ghosts: 1 },
  caption: '6.–8. asteak · azigos sistema (atzetik ikusita)',
  key: ORIGIN_KEY13.cardinal,
  steps: [
    {
      cam: orbit(172, 8, 12, [-0.2, -0.6, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: [{ id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakR' }, { id: 'atzeko-zain-kardinalak', p: 'azigos-arkua', text: 'Eskuineko atzeko kardinalaren hurbileko atala' }],
      note: 'Eskuineko kardinal gaineko zaina eskuineko atzeko kardinalaren hurbileko atalarekin lotzen da',
    },
    {
      to: { dc: 1, names: { azygos: 1 } },
      run: [0.08, 0.7],
      cam: orbit(196, 10, 12, [-0.4, 0.0, -0.9], SH),
      glide: 0.06,
      dim: AZ,
      warn: true,
      names: [{ id: 'azigos-zaina', from: 0.5 }, { id: 'goiko-kaba-zaina', p: 'bena-kardinal-komunaR', text: 'Goiko bena kaba', sub: '(eskuineko kardinal komunetik)', from: 0.5 }],
      note: 'Bi atal horietatik azigos zaina · KONTUZ: goiko bena kaban bukatzen da (esaldi batek «beheko» dio)',
      flows: [{ ...AZ_UP, from: 0.65 }],
    },
    {
      cam: orbit(186, 8, 13, [-0.3, -0.4, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: [{ id: 'saihets-arteko-zainak', p: 'saihets-arteko-zainakR' }, 'azigos-zaina', { id: 'goiko-kaba-zaina', p: 'bena-kardinal-komunaR', text: 'Goiko bena kaba' }],
      note: 'Eskuineko saihets arteko zainak azigos zainera, eta handik odola goiko bena kabara',
      flows: [AZ_UP, { path: ['ic5R'], sat: 0.08, n: 5 }, { path: ['ic7R'], sat: 0.08, n: 5 }, { path: ['ic9R'], sat: 0.08, n: 5 }],
    },
    {
      cam: orbit(196, 4, 14, [-0.3, -2.8, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: ['zain-lunbarra', { id: 'azigos-zaina', p: 'azigos-behea', small: true }],
      note: 'Maila lunbarretik igotzen den zain lunbarrak azigos zainarekin bat egiten du, eta goiko bena kabaraino',
      flows: [{ path: ['lumbar', '-supLowR', '-supMidR', '-supUpR', '-supLinkR', '-pcUpR', '-commonR'], sat: 0.08, n: 16 }],
    },
    {
      cam: orbit(206, 8, 10, [-0.5, 0.8, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: ['lehen-saihets-arteko-enborra', { id: 'azigos-zaina', small: true }],
      marks: icMarks([1, 2, 3], -1, '1.–3.'),
      note: 'Hasierako hiru saihets arteko espazioetako zainek beste enbor benoso bat: zuzenean azigos zainera',
      flows: [{ path: ['trunk3'], sat: 0.08, n: 6 }],
    },
    {
      to: { supraGap: 1 },
      cam: orbit(168, 8, 14, [0.3, -1.2, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: [{ id: 'hemiazigos-zaina', from: 0.45 }, { id: 'hemiazigos-laguntzailea', from: 0.45 }, { id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakL', text: 'Ezkerreko kardinal gaineko zaina', small: true }],
      note: 'Ezkerreko kardinal gaineko zainetik bi enbor: hemiazigos zaina eta, haren gainean, hemiazigos laguntzailea',
    },
    {
      cam: orbit(164, 6, 12, [0.2, -1.9, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: ['hemiazigos-zaina', { id: 'kardinal-gaineko-anastomosia', small: true }, { id: 'azigos-zaina', p: 'azigos-behea', small: true }],
      marks: icMarks([9, 10, 11], 1, '9.–11.'),
      note: 'Hemiazigos: 9., 10. eta 11. saihets arteko espazioetako odola, anastomosi batetik eskuineko azigos zainera',
      flows: [{ path: ['ic10L'], sat: 0.08, n: 5 }, { path: ['ic9L'], sat: 0.08, n: 5 }, { path: ['supAnLow'], sat: 0.08, n: 6 }],
    },
    {
      to: { accAn: 1 },
      cam: orbit(164, 8, 12, [0.2, -0.4, -1.0], SH),
      glide: 0.06,
      dim: AZ,
      names: ['hemiazigos-laguntzailea', { id: 'kardinal-gaineko-anastomosia', p: 'kardinal-gaineko-anastomosia-goi', from: 0.4, small: true }, { id: 'azigos-zaina', small: true }],
      marks: icMarks([4, 5, 6, 7, 8], 1, '4.–8.'),
      note: 'Hemiazigos laguntzailea: 4.–8. saihets arteko espazioetako odola, beste enbor batetik azigos zainera',
      flows: [{ path: ['ic6L'], sat: 0.08, n: 5 }, { path: ['supAnUp'], sat: 0.08, n: 6, from: 0.5 }, AZ_UP],
    },
  ],
});

// ———————————————————————————— stage 8: the two venae cavae (notes 3) ————————————————————————————

export const S8 = [0, 0.24, 0.5, 0.74] as const;

const CARD7: VeinPose = { ...UMB_END, ...CARD_DONE, names: { ...UMB_END.names, azygos: 1 } };
/** Everything the adult pattern adds to week 7 (the rewind of stage 9 and the preview of stage 8). */
const TO_ADULT: PoseTo = { dv: 1, subAn: 1, lSubProx: 1, hepSub: 1, sacroAn: 1, lSacroProx: 1, iliacs: 1, acAn: 1, lAcLow: 1, lCommon: 1, subcl: 1, extJug: 1, shift: 1, coronary: 1, names: { ren: 1, sac: 1, svc: 1 } };
const TO_CARD7: PoseTo = { dv: 0, subAn: 0, lSubProx: 0, hepSub: 0, sacroAn: 0, lSacroProx: 0, iliacs: 0, acAn: 0, lAcLow: 0, lCommon: 0, subcl: 0, extJug: 0, shift: 0, coronary: 0, names: { ren: 0, sac: 0, svc: 0 } };

export const Cavae3D = veinStage({
  S: S8,
  pose: CARD7,
  opts: { heart: 1, heartGlass: 0.35, liverOp: 0.14, gut: 0.2, kidneys: 0.7, limbs: 1, ghosts: 0.6 },
  caption: '7. astetik aurrera · goiko eta beheko kaba zainak',
  key: ORIGIN_KEY13.all,
  steps: [
    {
      cam: orbit(-22, 8, 17, [0, -1.6, -0.4], SH),
      glide: 0.06,
      dim: ['kardinal-gaineko-zainak', 'kardinal-azpiko-zainak', 'zain-sakrokardinalak', ...HEART],
      names: [{ id: 'kardinal-gaineko-zainak', p: 'kardinal-gaineko-zainakR' }, { id: 'kardinal-azpiko-zainak', p: 'kardinal-azpiko-zainakL' }, { id: 'zain-sakrokardinalak', p: 'zain-sakrokardinalakL' }],
      note: 'Hiru sistema hauetatik (kardinal gainekoak, azpikoak eta sakrokardinalak) bi zain sistema nagusi sortzen dira',
    },
    {
      to: TO_ADULT,
      run: [0.06, 0.62],
      cam: orbit(-14, 8, 17.5, [0, -1.4, -0.3], SH),
      glide: 0.06,
      dim: ['goiko-kaba-zaina', 'beheko-kaba-zaina', 'eskuineko-aurikula', ...HEART],
      names: [{ id: 'goiko-kaba-zaina', p: 'goiko-kabaren-hasierako-atala', from: 0.55 }, { id: 'beheko-kaba-zaina', p: 'kabaren-giltzurrun-segmentua', from: 0.55 }],
      note: 'Aurretik begiratzen dugu: goiko kaba zaina (goiko bena kaba) eta beheko kaba zaina (beheko bena kaba)',
    },
    {
      opts: { heartGlass: 0.6 },
      cam: orbit(-70, 12, 8, [-0.9, 0.0, -0.35], SH),
      glide: 0.06,
      dim: ['goiko-kaba-zaina', 'beheko-kaba-zaina', 'eskuineko-aurikula', 'atal-lisoa'],
      names: [{ id: 'goiko-kaba-zaina', p: 'goiko-kabaren-bukaerako-atala' }, { id: 'beheko-kaba-zaina', p: 'kabaren-gibel-segmentua' }, { id: 'atal-lisoa', text: 'Eskuineko aurikularen atzeko pareta lisoa' }],
      note: 'Biak bihotzaren eskuineko aurikulan irekitzen dira: goikoa atzeko pareta lisotik, behekoa behetik',
      flows: [{ path: ['-acLowR', '-commonR'], sat: 0.08, n: 8 }, { path: ['-subUpR', 'hepSub', 'hcR'], sat: 0.08, n: 8 }],
    },
    {
      cam: orbit(-6, 6, 17, [0, -1.4, -0.4], SH),
      glide: 0.06,
      dim: ['anastomosiak', 'aurreko-kardinalen-anastomosia', 'kardinal-azpiko-anastomosia', 'sakrokardinal-anastomosia', 'kardinal-gaineko-anastomosia', 'zain-brakiozefalikoak', 'ezkerreko-giltzurrun-zaina', 'zain-iliako-primitiboak', 'hemiazigos-zaina', 'hemiazigos-laguntzailea', 'goiko-kaba-zaina', 'beheko-kaba-zaina', 'azigos-zaina', ...HEART],
      names: [
        { id: 'aurreko-kardinalen-anastomosia', sub: '→ ezkerreko brakiozefalikoa' },
        { id: 'kardinal-gaineko-anastomosia', sub: '→ hemiazigosetik azigosera' },
        { id: 'kardinal-azpiko-anastomosia', sub: '→ ezkerreko giltzurrun zaina' },
        { id: 'sakrokardinal-anastomosia', sub: '→ ezkerreko iliako primitiboa' },
      ],
      note: 'Gogoratu: prozesu nagusia ezkerreko zainetako odola eskuinekoetara pasatzea da, anastomosien bidez',
      flows: [
        { path: ['acAn', '-acLowR', '-commonR'], sat: 0.08, n: 10 },
        { ...RENAL_L, n: 8 },
        { path: ['-sacroDistL', 'sacroAn'], sat: 0.08, n: 8 },
        { path: ['supAnLow'], sat: 0.08, n: 6 },
      ],
    },
  ],
});

// ———————————————————————————— stage 9: the inferior vena cava (notes 3.1 p3–p9 s11) ————————————————————————————

export const S9 = [0, 0.09, 0.19, 0.29, 0.39, 0.49, 0.59, 0.69, 0.79, 0.89] as const;

export const Inferior3D = veinStage({
  S: S9,
  pose: ADULT,
  opts: { heart: 1, heartGlass: 0.35, liverOp: 0.14, gut: 0.2, kidneys: 1, limbs: 1, ghosts: 1 },
  caption: 'Beheko kaba zaina · atal bakoitza bere jatorritik',
  key: ORIGIN_KEY13.all,
  steps: [
    {
      cam: orbit(-26, 8, 15, [-0.3, -2.6, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: ['kabaren-gibel-segmentua', 'kabaren-giltzurrun-segmentua', 'kabaren-segmentu-sakrokardinala', { id: 'beheko-kaba-zaina', p: 'hepSub', text: 'Beheko bena kaba', small: true }],
      note: 'Beheko kaba zaina: abdomeneko zainik garrantzitsuena; atal bakoitzak bere jatorria du, eta fusionatzen dira',
      flows: [IVC_R],
    },
    {
      to: TO_CARD7,
      run: [0.02, 0.32],
      cam: orbit(-30, 8, 12, [-0.3, -1.4, -0.2], SH),
      glide: 0.06,
      dim: IVC,
      caption: 'Atzera, 7. astera: beheko kaba eratu aurretik',
      names: [{ id: 'kabaren-gibel-segmentua', from: 0.4 }, { id: 'porta-zaina', small: true, from: 0.4 }, { id: 'eskuineko-aurikula', p: 'atal-lisoa', small: true, from: 0.4 }],
      note: 'Goiko segmentua: gibel segmentua (eskuineko hodi hepatokardiakotik), eskuineko aurikulara irekitzen dena; porta zainaren odola gibeletik hara',
      flows: [{ ...PORTAL, from: 0.4 }],
    },
    {
      to: { subAn: 1 },
      cam: orbit(-18, 8, 11, [0, -2.9, -0.4], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'kardinal-azpiko-zainak', p: 'kardinal-azpiko-zainakR' }, { id: 'kardinal-azpiko-zainak', p: 'kardinal-azpiko-zainakL', key: 'sub:L' }, { id: 'kardinal-azpiko-anastomosia', from: 0.4 }],
      note: 'Kardinal azpiko zainen artean anastomosi bat: ezkerreko odola eskuinera',
      flows: [{ path: ['subAn'], sat: 0.08, n: 6, from: 0.5 }],
    },
    {
      to: { lSubProx: 1, names: { ren: 1 } },
      cam: orbit(8, 8, 11, [0.2, -3.1, -0.4], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'ezkerreko-giltzurrun-zaina', from: 0.3 }, { id: 'ezkerreko-zain-gonadala', from: 0.3 }, { id: 'kardinal-azpiko-zainak', p: 'kardinal-azpiko-zainakL', text: 'Ezkerreko kardinal azpikoaren hurbileko atala', sub: '(desagertzen da)', small: true }],
      note: 'Anastomositik ezkerreko giltzurrun zaina; ezkerreko urrutiko ataletik zain gonadala (haren behetik); ezkerreko hurbileko atala desagertzen da',
      flows: [{ ...RENAL_L, from: 0.4 }, { path: ['-subLowL', 'subAn'], sat: 0.08, n: 6, from: 0.4 }],
    },
    {
      to: { hepSub: 1 },
      cam: orbit(-30, 6, 11, [-0.3, -2.2, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'kabaren-giltzurrun-segmentua', from: 0.3 }, 'kabaren-gibel-segmentua'],
      note: 'Eskuineko kardinal azpiko zainetik giltzurrun segmentua: goitik gibel segmentuarekin fusionatzen da',
      flows: [{ path: ['-subUpR', 'hepSub', 'hcR'], sat: 0.08, n: 10, from: 0.6 }],
    },
    {
      to: { sacroAn: 1 },
      cam: orbit(-14, 6, 11, [0, -5.2, -0.4], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'zain-sakrokardinalak', p: 'zain-sakrokardinalakR' }, { id: 'zain-sakrokardinalak', p: 'zain-sakrokardinalakL', key: 'sacro:L' }, { id: 'sakrokardinal-anastomosia', from: 0.4 }],
      note: 'Zain sakrokardinalen artean beste anastomosi bat',
      flows: [{ path: ['sacroAn'], sat: 0.08, n: 6, from: 0.5 }],
    },
    {
      to: { lSacroProx: 1, names: { sac: 1 } },
      cam: orbit(-6, 6, 11, [0, -5.3, -0.4], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'ezkerreko-zain-iliako-primitiboa', from: 0.3 }, { id: 'eskuineko-zain-iliako-primitiboa', from: 0.3 }, { id: 'kabaren-segmentu-sakrokardinala', from: 0.3 }],
      note: 'Urrutiko ataletatik zain iliako primitiboak; eskuinekoaren hurbileko ataletik beheko kabaren segmentu sakrokardinala',
      flows: [{ ...IVC_L, from: 0.5 }],
    },
    {
      to: { iliacs: 1 },
      cam: orbit(-10, 4, 12, [0, -5.6, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'zain-iliako-primitiboak', p: 'ezkerreko-zain-iliako-primitiboa' }, { id: 'kanpoko-zain-iliakoak', p: 'kanpoko-zain-iliakoakL', from: 0.4 }, { id: 'barneko-zain-iliakoak', p: 'barneko-zain-iliakoakR', from: 0.4 }, { id: 'kabaren-segmentu-sakrokardinala', small: true }],
      note: 'Bi zain iliako primitiboak elkartuta beheko kabara (segmentu sakrokardinala); haietara kanpoko eta barneko zain iliakoak',
      flows: [IVC_L, IVC_R],
    },
    {
      to: { dv: 1 },
      run: [0.06, 0.6],
      cam: orbit(-20, 8, 17, [-0.2, -2.8, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'kabaren-gibel-segmentua', from: 0.5 }, { id: 'kabaren-giltzurrun-segmentua', from: 0.5 }, { id: 'kabaren-segmentu-sakrokardinala', from: 0.5 }, { id: 'beheko-kaba-zaina', p: 'hepSub', text: 'Behin betiko beheko bena kaba', from: 0.6 }],
      note: 'Fusionatuta, behin betiko beheko bena kaba: hiru atal nagusi (gibel, giltzurrun eta sakrokardinala)',
      flows: [IVC_R, IVC_L],
    },
    {
      cam: orbit(-34, 8, 17, [-0.3, -2.6, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'zain-iliako-primitiboak', p: 'eskuineko-zain-iliako-primitiboa' }, 'ezkerreko-giltzurrun-zaina', 'beheko-zain-lunbarrak', 'porta-zaina', { id: 'atal-lisoa', text: 'Eskuineko aurikularen atzeko pareta lisoa', small: true }],
      note: 'Beheko kabara: zain iliako primitiboak, errai batzuen odola (giltzurrunak), beheko zain lunbarrak; porta zainaren odola gibeletik pasata',
      flows: [IVC_R, IVC_L, RENAL_L, PORTAL],
    },
  ],
});

// ———————————————————————————— stage 10: the coronary sinus (notes 3.1 p9 s12–s16) ————————————————————————————

export const S10 = [0, 0.36, 0.7] as const;

const IVC_DONE: VeinPose = { ...CARD7, dv: 1, subAn: 1, lSubProx: 1, hepSub: 1, sacroAn: 1, lSacroProx: 1, iliacs: 1, names: { ...CARD7.names, ren: 1, sac: 1 } };

/** The back of the heart only: the trunk's veins fade so the sinus horns and the coronary sinus read. */
const CORO = ['zain-sinua', 'eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena', 'sinu-koronarioa', 'ezkerreko-aurikularen-zain-laprana', 'bena-kardinal-komuna', 'ezkerreko-kardinal-komuna', 'goiko-kaba-zaina', 'beheko-kaba-zaina', 'kabaren-gibel-segmentua', 'eskuineko-aurikula', 'atal-lisoa', ...HEART];

export const Coronary3D = veinStage({
  S: S10,
  pose: IVC_DONE,
  opts: { heart: 1, heartGlass: 0.3, liverOp: 0.14, gut: 0.15, kidneys: 0.6, ghosts: 1 },
  caption: 'Zain sinuaren ezkerreko luzapena → sinu koronarioa',
  key: ORIGIN_KEY13.liver,
  steps: [
    {
      to: { shift: 1, lCommon: 1 },
      run: [0.1, 0.75],
      cam: orbit(160, 18, 8.5, [0, 0.0, -0.4], SH),
      glide: 0.08,
      dim: CORO,
      names: [hornL, hornR, { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komunaL', text: 'Ezkerreko kardinal komuna', small: true }],
      note: 'Anastomosien ondorioz ezkerreko luzapenak garrantzia galtzen du: odol osoa eskuineko luzapenera',
      flows: CARD_IN.slice(0, 1),
    },
    {
      to: { coronary: 1 },
      run: [0.1, 0.65],
      cam: orbit(176, 22, 6.5, [0.25, 0.0, -0.4], SH),
      glide: 0.06,
      dim: CORO,
      names: [{ id: 'sinu-koronarioa', from: 0.45 }, { id: 'ezkerreko-aurikularen-zain-laprana', from: 0.55 }],
      note: 'Ez da guztiz desagertzen: sinu koronarioa (bihotzaren atzeko paretan) eta ezkerreko aurikularen zain laprana',
    },
    {
      cam: orbit(-110, 10, 7.5, [-0.8, 0.0, -0.4], SH),
      glide: 0.08,
      dim: CORO,
      names: ['sinu-koronarioa', { id: 'beheko-kaba-zaina', p: 'kabaren-gibel-segmentua', text: 'Beheko bena kaba' }, { id: 'eskuineko-aurikula', p: 'atal-lisoa' }],
      note: 'Eskuineko aurikulan, beheko bena kabaren balbula eta sinu koronarioaren balbula (eskuineko balbula benosotik); sinu koronarioa ere hor irekitzen da',
      flows: [{ path: ['-subUpR', 'hepSub', 'hcR'], sat: 0.08, n: 8 }],
    },
  ],
});

// ———————————————————————————— stage 11: the superior vena cava (notes 3.2 p3–p13) ————————————————————————————

export const S11 = [0, 0.12, 0.24, 0.37, 0.5, 0.63, 0.76, 0.88] as const;

const COR_DONE: VeinPose = { ...IVC_DONE, shift: 1, lCommon: 1, coronary: 1 };
const SVC_IN: Flow[] = [
  { path: ['-acTopR', '-acMidR', '-acLowR', '-commonR'], sat: 0.08, n: 12 },
  { path: ['-acTopL', 'acAn', '-acLowR', '-commonR'], sat: 0.08, n: 12 },
];

export const Superior3D = veinStage({
  S: S11,
  pose: COR_DONE,
  opts: { heart: 1, heartGlass: 0.35, liverOp: 0.12, gut: 0.1, limbs: 1, ghosts: 1 },
  caption: 'Goiko kaba zaina eta zain brakiozefalikoak (aurretik)',
  key: ORIGIN_KEY13.cardinal,
  steps: [
    {
      cam: orbit(-14, 8, 12, [-0.2, 1.4, -0.4], SH),
      glide: 0.06,
      dim: SVC,
      names: [{ id: 'bena-kardinal-komuna', p: 'bena-kardinal-komunaR', text: 'Eskuineko kardinal komuna' }, { id: 'aurreko-zain-kardinalak', p: 'goiko-kabaren-hasierako-atala', text: 'Eskuineko aurreko kardinalaren hurbileko atala' }],
      note: 'Goiko kaba zaina: eskuineko kardinal komunetik eta eskuineko aurreko kardinalaren hurbileko ataletik',
      flows: SVC_IN.slice(0, 1),
    },
    {
      to: { acAn: 1 },
      cam: orbit(-8, 10, 11, [0, 1.9, -0.4], SH),
      glide: 0.06,
      dim: SVC,
      names: [{ id: 'aurreko-kardinalen-anastomosia', from: 0.4 }, { id: 'aurreko-zain-kardinalak', p: 'aurreko-zain-kardinalak-topL', small: true }],
      note: 'Ezkerreko eta eskuineko aurreko kardinalen artean beste anastomosi bat',
      flows: [{ ...SVC_IN[1], from: 0.5 }],
    },
    {
      to: { lAcLow: 1, names: { svc: 1 } },
      cam: orbit(-6, 8, 11, [0, 1.7, -0.4], SH),
      glide: 0.06,
      dim: SVC,
      names: [{ id: 'ezkerreko-zain-brakiozefalikoa', from: 0.3 }, { id: 'eskuineko-zain-brakiozefalikoa', from: 0.3 }, { id: 'goiko-kaba-zaina', p: 'goiko-kabaren-hasierako-atala', from: 0.4 }],
      note: 'Anastomositik ezkerreko zain brakiozefalikoa: odola ezkerretik eskuinera, eskuineko brakiozefalikoarekin bat; biak goiko bena kaban',
      flows: SVC_IN,
    },
    {
      to: { subcl: 1 },
      cam: orbit(18, 8, 10, [0.9, 2.4, -0.5], SH),
      glide: 0.06,
      dim: SVC,
      names: [{ id: 'barneko-jugularrak', p: 'barneko-jugularrakL', text: 'Ezkerreko barneko jugularra' }, { id: 'zain-subklabioak', p: 'zain-subklabioakL', text: 'Ezkerreko subklabioa', from: 0.4 }, { id: 'goiko-gorputz-adarraren-hasikina', small: true }],
      note: 'Ezkerreko brakiozefalikora: ezkerreko barneko jugularra (ezkerreko aurreko kardinalaren urrutiko atala) eta ezkerreko subklabioa (goiko gorputz adarretik)',
      flows: [{ path: ['-acTopL', 'acAn'], sat: 0.08, n: 8 }, { path: ['subclL', 'acAn'], sat: 0.08, n: 8, from: 0.6 }],
    },
    {
      cam: orbit(-26, 8, 10, [-0.9, 2.3, -0.5], SH),
      glide: 0.06,
      dim: SVC,
      names: [{ id: 'barneko-jugularrak', p: 'barneko-jugularrakR', text: 'Eskuineko barruko jugularra' }, { id: 'zain-subklabioak', p: 'zain-subklabioakR', text: 'Eskuineko subklabioa' }, { id: 'eskuineko-zain-brakiozefalikoa' }],
      note: 'Eskuineko brakiozefalikoa: eskuineko barruko jugularra (eskuineko aurreko kardinaletik) eta eskuineko subklabioa, jugularrera heltzen dena',
      flows: [{ path: ['-acTopR', '-acMidR'], sat: 0.08, n: 8 }, { path: ['subclR', '-acMidR'], sat: 0.08, n: 8 }],
    },
    {
      cam: orbit(-10, 8, 11, [-0.4, 1.5, -0.4], SH),
      glide: 0.06,
      dim: SVC,
      names: ['ezkerreko-zain-brakiozefalikoa', 'eskuineko-zain-brakiozefalikoa', { id: 'goiko-kaba-zaina', p: 'goiko-kabaren-hasierako-atala' }],
      note: 'Bi zain brakiozefalikoak elkartzean goiko bena kaba: enborra eskuineko kardinal komunetik eta eskuineko aurreko kardinalaren hurbileko ataletik',
      flows: SVC_IN,
    },
    {
      to: { extJug: 1 },
      cam: orbit(-34, 10, 12, [0, 2.9, -0.2], SH),
      glide: 0.06,
      dim: SVC,
      names: [{ id: 'kanpoko-jugularrak', p: 'kanpoko-jugularrakR', from: 0.4 }, { id: 'kanpoko-jugularrak', p: 'kanpoko-jugularrakL', from: 0.4, key: 'ej:L' }, { id: 'zain-subklabioak', p: 'zain-subklabioakR', small: true }],
      note: 'Kanpoko zain jugularrak aurpegiko zain sare batetik (ezkerrekoa eta eskuinekoa); subklabioetan bukatzen dira',
      flows: [{ path: ['extJugR'], sat: 0.08, n: 6, from: 0.5 }, { path: ['extJugL'], sat: 0.08, n: 6, from: 0.5 }],
    },
    {
      cam: orbit(-40, 8, 9, [-0.8, 1.0, -0.4], SH),
      glide: 0.06,
      dim: SVC,
      names: ['goiko-kabaren-hasierako-atala', 'goiko-kabaren-bukaerako-atala', { id: 'eskuineko-aurikula', p: 'atal-lisoa', small: true }],
      note: 'Goiko bena kabaren bi atal: hasierakoa eskuineko aurreko kardinaletik, bukaerakoa eskuineko kardinal komunetik',
      flows: SVC_IN.slice(0, 1),
    },
  ],
});

// ———————————————————————————— stage 12: the summary (notes 3.2 p14–p18) ————————————————————————————

export const S12 = [0, 0.24, 0.48, 0.7] as const;

const TABLE_AT = S12[3];
const ROWS: { at: number; cells: { id?: string; text: string; color?: string }[] }[] = [
  ['goiko-kabaren-bukaerako-atala', 'Goiko kaba (bukaera)', 'Eskuineko kardinal komuna', VC.common],
  ['goiko-kabaren-hasierako-atala', 'Goiko kaba (hasiera)', 'Eskuineko aurreko kardinala', VC.ant],
  ['ezkerreko-zain-brakiozefalikoa', 'Ezk. brakiozefalikoa', 'Aurreko kardinalen anastomosia', VC.ant],
  ['barneko-jugularrak', 'Barneko jugularrak', 'Aurreko kardinalak (urrutikoa)', VC.ant],
  ['azigos-zaina', 'Azigos zaina', 'Esk. kardinal gainekoa + atzekoa', VC.supra],
  ['hemiazigos-zaina', 'Hemiazigosak', 'Ezk. kardinal gaineko zaina', VC.supra],
  ['kabaren-gibel-segmentua', 'Kaba: gibel atala', 'Esk. hodi hepatokardiakoa', VC.vit],
  ['kabaren-giltzurrun-segmentua', 'Kaba: giltzurrun atala', 'Esk. kardinal azpiko zaina', VC.sub],
  ['kabaren-segmentu-sakrokardinala', 'Kaba: atal sakrokard.', 'Esk. sakrokardinala (hurbilekoa)', VC.sacro],
  ['zain-iliako-primitiboak', 'Iliako primitiboak', 'Sakrokardinalak (urrutikoa)', VC.sacro],
  ['ezkerreko-giltzurrun-zaina', 'Ezk. giltzurrun zaina', 'Kardinal azpikoen anastomosia', VC.sub],
  ['porta-zaina', 'Porta zaina', 'Eskuineko zain bitelinoa', VC.vit],
  ['hodi-benosoa', 'Hodi benosoa', 'Ezkerreko zilborreko zaina', VC.umb],
  ['sinu-koronarioa', 'Sinu koronarioa', 'Zain sinuaren ezk. luzapena', VC.hornL],
].map(([id, adult, origin, color], i) => ({ at: TABLE_AT + 0.03 + i * 0.012, cells: [{ id, text: adult, color }, { text: origin, color }] }));

export const Summary3D = veinStage({
  S: S12,
  pose: { ...ADULT, venosum: 0 },
  opts: { heart: 1, heartGlass: 0.3, liverOp: 0.14, gut: 0.15, kidneys: 0.8, limbs: 1, ghosts: 0 },
  caption: 'Laburpena · zainik garrantzitsuenak (heldua)',
  key: ORIGIN_KEY13.all,
  steps: [
    {
      cam: orbit(-14, 8, 12, [-0.3, 1.4, -0.4], SH),
      glide: 0.06,
      dim: [...SVC, 'zain-brakiozefalikoak'],
      names: ['goiko-kaba-zaina', 'ezkerreko-zain-brakiozefalikoa', 'eskuineko-zain-brakiozefalikoa', { id: 'azigos-zaina', p: 'azigos-arkua' }],
      note: 'Goiko bena kabara: eskuineko eta ezkerreko zain brakiozefalikoak, eta azigos zaina',
      flows: [...SVC_IN, { path: ['-supUpR', '-supLinkR', '-pcUpR', '-commonR'], sat: 0.08, n: 10 }],
    },
    {
      cam: orbit(-22, 6, 18, [-0.2, -3.2, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: [{ id: 'beheko-kaba-zaina', p: 'kabaren-giltzurrun-segmentua' }, { id: 'zain-iliako-primitiboak', p: 'ezkerreko-zain-iliako-primitiboa' }, 'porta-zaina', { id: 'ezkerreko-giltzurrun-zaina', small: true }],
      note: 'Beheko bena kabara: beheko gorputz adarretako zain odol guztia (iliakoak), porta, abdomeneko errai ezberdinetakoa…',
      flows: [IVC_R, IVC_L, PORTAL, RENAL_L],
    },
    {
      cam: orbit(-30, 8, 15, [-0.3, -2.8, -0.3], SH),
      glide: 0.06,
      dim: IVC,
      names: ['kabaren-segmentu-sakrokardinala', 'kabaren-gibel-segmentua', 'kabaren-giltzurrun-segmentua', { id: 'zain-iliako-primitiboak', p: 'eskuineko-zain-iliako-primitiboa', small: true }],
      note: 'Behin betiko beheko bena kaba: atal sakrokardinala (hortik iliako primitiboak), gibel atala, giltzurrun atala',
      flows: [IVC_R],
    },
    {
      cam: orbit(-12, 8, 21, [-0.6, -1.2, -0.3], [300, 0]),
      glide: 0.08,
      names: [{ id: 'goiko-kaba-zaina', small: true }, { id: 'beheko-kaba-zaina', small: true }],
      caption: 'Heldu zaina ← jatorria (kolore bera)',
    },
  ],
  over: (t) => {
    const show = seg(t, TABLE_AT + 0.01, TABLE_AT + 0.03);
    if (show <= 0.01) return null;
    return (
      <g className="zoom-fade" opacity={show}>
        <rect x={34} y={112} width={404} height={470} rx={14} fill="#120d17" opacity={0.92} stroke="rgba(255,255,255,0.1)" />
        <Note x={236} y={132} size={13.5} tone="accent" fixed>
          Heldu zaina ← jatorria
        </Note>
        <SummaryTable t={t} x={42} y={156} widths={[180, 208]} rowH={26} head={['Heldutan', 'Jatorria (enbrioia)']} rows={ROWS} />
      </g>
    );
  },
});
