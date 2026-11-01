'use client';

import { FC, FP0, foreModel, type ForeOpts, type ForePose } from './foregut-model';
import { endPose, orbit, poseStage, type StageSpec } from './common';

/**
 * Topic 14, stages 6–16 (notes 3–3.6): the foregut's derivatives in the trunk, one 3D model (foregut-model) posed
 * per step. Seen mostly from the front (embryo's left on the viewer's right, as the notes' frontal figures),
 * from above for the transverse sections of the stomach and the omental bursa (dorsal up, embryo's left on
 * the viewer's right, as topic 7), and from the embryo's left for the sagittal ones.
 */

const SH: [number, number] = [30, 0];
const fore = (spec: StageSpec<ForePose, ForeOpts>) => poseStage(spec, (pose, opts) => foreModel(pose, opts));

/** From above (a transverse section seen from the head: dorsal up, embryo's left on the viewer's right). */
const TOP = (target: [number, number, number], dist = 6.4, yaw = 0) => orbit(yaw, 78, dist, target, SH);

export const KEY_F = {
  oeso: [
    { color: FC.endo, text: 'endodermoa (barneko geruza)' },
    { color: FC.striated, text: 'muskulu ilaskatua (goiko 2/3)' },
    { color: FC.smooth, text: 'muskulu lisoa (beheko 1/3)' },
  ],
  walls: [
    { color: FC.postWall, text: 'hasierako atzeko pareta' },
    { color: FC.antWall, text: 'hasierako aurreko pareta' },
  ],
  peri: [
    { color: FC.visceral, text: 'errai peritoneoa / mesoak' },
    { color: FC.parietal, text: 'paretako peritoneoa' },
    { color: FC.cavity, text: 'poltsa omentala (peritoneo barrunbea)' },
  ],
  ventral: [
    { color: FC.septum, text: 'septum transversuma → aurreko mesogastrioa' },
    { color: FC.visceral, text: 'atzeko mesogastrioa' },
    { color: FC.cavity, text: 'poltsa omentala' },
  ],
} as const;

// ———————————————————————————— stage 6: the oesophagus (notes 3, 3.1) ————————————————————————————

export const S6 = [0, 0.18, 0.36, 0.56, 0.78] as const;

const P6: ForePose = { ...FP0, thorax: 1, oeso: 0, dil: 0.2, duod: 1, liver: 0.22 };
const OESO = ['hestegorria', 'hestegorriko-muskulu-ilaskatua', 'hestegorriko-muskulu-lisoa', 'nerbio-bagoa', 'nerbio-sistema-begetatiboa'];

const spec6: StageSpec<ForePose, ForeOpts> = {
  S: S6,
  pose: P6,
  opts: { diaphragm: 0.34 },
  caption: 'Hestegorria: toraxetik abdomenera (3D eredua, aurretik)',
  steps: [
    {
      cam: orbit(28, 8, 11.5, [0.1, 2.0, -0.3], SH),
      glide: 0.07,
      names: [
        { id: 'aurreko-hestea', p: 'hestegorria', text: 'Aurreko hestea', sub: 'arnas hastapenetik gibel hastapeneraino' },
        { id: 'hestegorria', p: 'kardiasa', text: 'Hestegorria → urdaila', small: true, from: 0.25 },
        { id: 'gibel-hastapena', from: 0.45, small: true },
        { id: 'duodenoa', text: 'Duodenoaren hasiera', small: true, from: 0.6 },
      ],
      note: 'Aurreko hestetik: hestegorria → urdaila → duodenoaren hasierako atalak → gibela → area',
    },
    {
      cam: orbit(90, 6, 7, [0, 3.0, -0.1], SH),
      glide: 0.06,
      dim: ['hestegorria', 'trakea', 'birikak'],
      names: [
        { id: 'trakea', text: 'Arnas aparatua', sub: '(aurreko paretatik)' },
        { id: 'hestegorria', sub: '(atzeko aldea)', from: 0.3 },
      ],
      note: 'Aurreko hestearen aurreko paretatik arnas aparatuaren hastapena; atzeko aldea, hasierako ataltxoa, hestegorria da (ezkerretik ikusita)',
    },
    {
      to: { oeso: 1 },
      run: [0.1, 0.78],
      cam: orbit(62, 6, 12, [0, 2.1, -0.2], SH),
      glide: 0.05,
      dim: ['hestegorria', 'bihotza', 'birikak', 'diafragma', 'urdaila'],
      names: [
        { id: 'bihotza', sub: '(jaisten da)' },
        { id: 'birikak', sub: '(hazten dira)', from: 0.15 },
        { id: 'hestegorria', sub: '(luzatzen da)', from: 0.35 },
        { id: 'diafragma', small: true, from: 0.6 },
      ],
      note: 'Hasieran laburra; bihotza jaisten da eta birikak hazten dira: hestegorria askoz luzeagoa egiten da, diafragma zeharkatu eta abdomenean urdailarekin jarraitzen du',
    },
    {
      to: { musc: 1 },
      run: [0.1, 0.5],
      cam: orbit(58, 4, 7.4, [0, 2.75, -0.3], SH),
      glide: 0.05,
      dim: OESO,
      names: [
        { id: 'hestegorriko-muskulu-ilaskatua', sub: 'goiko 2/3', from: 0.1 },
        { id: 'nerbio-bagoa', sub: '(X. bikote kraneala)', from: 0.3 },
        { id: 'hestegorriko-muskulu-lisoa', sub: 'beheko 1/3', from: 0.5 },
        { id: 'nerbio-sistema-begetatiboa', text: 'Nerbio begetatiboa', sub: '(sinpatikoa + parasinpatikoa)', from: 0.68 },
      ],
      note: 'Barneko geruza endodermoa; muskulua inguruko mesenkimatik: goiko 2/3 ilaskatua (nerbio bagoa), beheko 1/3 lisoa (errai orritik; nerbio begetatiboa)',
      key: KEY_F.oeso,
      keyTitle: 'Hestegorriaren geruzak',
    },
    {
      cam: orbit(22, 6, 8, [0.15, 1.6, -0.3], SH),
      glide: 0.06,
      dim: ['hestegorria', 'diafragma', 'urdaila', 'hestegorriko-muskulu-lisoa'],
      names: [{ id: 'hestegorria', sub: '(toraxean)' }, { id: 'diafragma', from: 0.2 }, { id: 'urdaila', from: 0.45, small: true }],
      note: 'Hestegorria toraxean hasten da, diafragma zeharkatzen du, abdomenean ibilbide labur bat egin eta urdailarekin jarraitzen du',
      key: KEY_F.oeso,
      keyTitle: 'Hestegorriaren geruzak',
    },
  ],
};
export const Oesophagus3D = fore(spec6);
const END6 = endPose(spec6).pose;

// ———————————————————————————— stage 7: the stomach's two rotations (notes 3.2, p3–p7) ————————————————————————————

export const S7 = [0, 0.13, 0.3, 0.46, 0.62, 0.72, 0.86] as const;

const STOM = ['urdaila', 'makurdura-handia', 'makurdura-txikia'];
const FRONT = orbit(0, 6, 6.6, [0.2, 0.7, -0.3], SH);

const spec7: StageSpec<ForePose, ForeOpts> = {
  S: S7,
  pose: END6,
  opts: { diaphragm: 0.34 },
  caption: 'Urdaila: bi biraketa (3D eredua, aurretik; enbrioiaren ezkerra zure eskuinean)',
  key: KEY_F.walls,
  keyTitle: 'Urdailaren paretak',
  steps: [
    {
      to: { dil: 1, musc: 0, thorax: 0.35 },
      run: [0.08, 0.7],
      cam: orbit(52, 10, 6.4, [0.1, 0.75, -0.4], SH),
      glide: 0.06,
      dim: [...STOM, 'hestegorria'],
      names: [
        { id: 'urdaila', sub: '(zabalkuntza bat)', from: 0.35 },
        { id: 'urdaila', key: 'post', p: 'urdail-atzeko-pareta', text: 'Atzeko pareta', small: true, from: 0.6 },
        { id: 'urdaila', key: 'ant', p: 'urdail-aurreko-pareta', text: 'Aurreko pareta', small: true, from: 0.7 },
      ],
      note: 'Urdaila aurreko hestetik sortzen da: hasieran zabalkuntza bat; bi biraketaren ondorioz itxura eta posizioa aldatzen ditu',
    },
    {
      to: { rotL: 1 },
      run: [0.12, 0.8],
      opts: { topCut: 1 },
      cam: TOP([0.15, 0.7, -0.4], 3.6),
      glide: 0.07,
      dim: STOM,
      names: [
        { id: 'urdaila', key: 'post', p: 'urdail-atzeko-pareta', text: 'Hasierako atzeko pareta', sub: '→ ezkerrera', from: 0.2 },
        { id: 'urdaila', key: 'ant', p: 'urdail-aurreko-pareta', text: 'Hasierako aurreko pareta', sub: '→ eskuinera', from: 0.3 },
      ],
      marks: [{ p: [0.15, 0.7, 0.55], text: 'aurrea ↓', dy: 0 }],
      note: '1. biraketa: luzetarako ardatzaren inguruan 90º eskuinera; hasierako atzeko pareta ezkerrean, aurrekoa eskuinean (goitik ikusita)',
    },
    {
      to: { grow: 1, curv: 1 },
      run: [0.1, 0.7],
      opts: { topCut: 0 },
      cam: FRONT,
      glide: 0.07,
      dim: STOM,
      names: [
        { id: 'makurdura-handia', sub: '(ezkerreko pareta: gehiago hazten da)', from: 0.35 },
        { id: 'makurdura-txikia', sub: '(eskuinekoa)', from: 0.5 },
      ],
      note: 'Ezkerreko pareta (hasierako atzekoa) eskuinekoa baino askoz gehiago hazten da: makurdura handia; eskuinekoa makurdura txikia',
    },
    {
      to: { rotAP: 1 },
      run: [0.1, 0.75],
      cam: orbit(0, 6, 6.8, [0.3, 0.65, -0.25], SH),
      glide: 0.05,
      dim: [...STOM, 'kardiasa', 'piloroa'],
      names: [
        { id: 'kardiasa', sub: '→ behera eta ezkerrera', from: 0.2 },
        { id: 'piloroa', sub: '→ gora eta eskuinera', from: 0.3 },
        { id: 'makurdura-handia', small: true },
      ],
      note: '2. biraketa: aurretik atzera doan ardatzaren inguruan; kardiasa behera eta ezkerrera, piloroa kontrako noranzkoan, gora eta eskuinera',
    },
    {
      cam: orbit(0, 6, 6.8, [0.3, 0.65, -0.25], SH),
      warn: true,
      names: [{ id: 'urdaila', small: true }],
      note: '* Apunteetako oharra (2. atala): heste lakioek 90º hernia fisiologikoan + 180º abdomenean = 270º',
    },
    {
      cam: orbit(12, 10, 7.4, [0.3, 0.7, -0.25], SH),
      glide: 0.05,
      dim: [...STOM, 'kardiasa', 'piloroa', 'hestegorria'],
      names: [{ id: 'urdaila', sub: '(laprana, oblikuoa)' }, { id: 'kardiasa', small: true }, { id: 'piloroa', small: true }],
      marks: [
        { p: 'kardiasa', text: 'goian, ezkerrean', dx: 52, dy: -14 },
        { p: 'piloroa', text: 'behean, eskuinean', dx: -54, dy: 16 },
      ],
      note: 'Ondorioz ardatz nagusia goitik behera eta ezkerretik eskuinera: urdaila lapranki kokatuta dago abdomenean',
    },
    {
      to: { meso: 1 },
      run: [0.1, 0.6],
      cam: orbit(48, -14, 7.2, [0.35, 0.55, -0.6], SH),
      glide: 0.06,
      dim: ['urdaila', 'mesogastrio-dortsala', 'paretako-peritoneoa', 'errai-peritoneoa'],
      names: [
        { id: 'errai-peritoneoa', p: 'urdaila', text: 'Errai peritoneoa', sub: '(urdaila inguratzen du)', small: true },
        { id: 'mesogastrio-dortsala', text: 'Atzeko mesogastrioa', sub: '(bi orri)', from: 0.35 },
        { id: 'paretako-peritoneoa', text: 'Atzeko paretako peritoneoa', small: true, from: 0.55 },
      ],
      note: 'Urdaila peritoneo barrukoa da: bere errai peritoneoa atzeko paretako peritoneoarekin lotzen da atzeko mesogastrioaren bidez (bi orri)',
      key: KEY_F.peri,
      keyTitle: 'Kolorea',
    },
  ],
};
export const Stomach3D = fore(spec7);
const END7 = endPose(spec7).pose;

// ———————————————————————————— stage 8: the omental bursa (notes 3.2, p8–p9) ————————————————————————————

export const S8 = [0, 0.24, 0.48, 0.72] as const;

const TOP8 = TOP([0.1, 0.65, -0.72], 4.4);

const spec8: StageSpec<ForePose, ForeOpts> = {
  S: S8,
  pose: END7,
  opts: { diaphragm: 0.34 },
  caption: 'Poltsa omentala: zeharkako ebaketa, goitik (bizkarra goian; enbrioiaren ezkerra zure eskuinean)',
  key: KEY_F.peri,
  keyTitle: 'Kolorea',
  steps: [
    {
      // Back to before the rotations, to watch the mesogastrium follow the stomach.
      to: { rotL: 0, grow: 0, rotAP: 0, curv: 0 },
      run: [0.05, 0.5],
      opts: { topCut: 1 },
      cam: TOP8,
      glide: 0.07,
      dim: ['urdaila', 'mesogastrio-dortsala', 'paretako-peritoneoa'],
      names: [
        { id: 'urdaila', sub: '(errai peritoneoz inguratuta)', from: 0.5 },
        { id: 'mesogastrio-dortsala', text: 'Atzeko mesogastrioa', sub: '(erdian)', from: 0.6 },
        { id: 'paretako-peritoneoa', text: 'Atzeko paretako peritoneoa', small: true, from: 0.7 },
      ],
      note: 'Biraketen aurretik, goitik: urdaila erdian, errai peritoneoz; erdiko lotura (atzeko mesogastrioa) atzeko paretako peritoneoraino',
    },
    {
      to: { rotL: 1 },
      run: [0.1, 0.8],
      cam: TOP8,
      dim: ['urdaila', 'mesogastrio-dortsala'],
      names: [
        { id: 'urdaila', key: 'post', p: 'urdail-atzeko-pareta', text: 'Hasierako atzeko pareta', sub: '→ ezkerrera', small: true },
        { id: 'mesogastrio-dortsala', text: 'Atzeko mesogastrioa', sub: '→ ezkerrera', from: 0.35 },
      ],
      note: 'Urdaila eskuinera biratzen denean ez da bakarrik biratzen: bere atzeko mesogastrioa ere ezkerrera abiatzen da',
      key: KEY_F.walls,
      keyTitle: 'Urdailaren paretak',
    },
    {
      to: { bursa: 1 },
      run: [0.1, 0.6],
      cam: TOP([0.0, 0.62, -0.72], 4.2, -8),
      glide: 0.05,
      dim: ['poltsa-omentala', 'urdaila', 'mesogastrio-dortsala'],
      names: [{ id: 'poltsa-omentala', sub: '(epiploiaren trans kabitatea)', from: 0.3 }, { id: 'mesogastrio-dortsala', text: 'Atzeko mesogastrioa', small: true }],
      note: 'Urdailaren atzean peritoneo barrunbeak zakuondo bat du: poltsa omentala edo epiploiaren trans kabitatea',
    },
    {
      to: { grow: 1, curv: 1, rotAP: 1 },
      run: [0.08, 0.6],
      opts: { topCut: 0.4 },
      cam: orbit(18, 40, 7.2, [0.2, 0.6, -0.45], SH),
      glide: 0.06,
      dim: ['poltsa-omentala', 'urdaila', 'mesogastrio-dortsala', 'makurdura-handia'],
      names: [{ id: 'poltsa-omentala', sub: '(urdailaren atzean)' }, { id: 'urdaila', small: true }],
      note: 'Biraketak bukatuta, poltsa omentala urdailaren atzean geratzen da (aurretik eta goitik)',
    },
  ],
};
export const Bursa3D = fore(spec8);
const END8 = endPose(spec8);

// ———————————————————————————— stage 9: the dorsal mesogastrium — spleen, ligaments, greater omentum (notes 3.2, p8, p10–p13) ————————————————————————————

export const S9 = [0, 0.17, 0.34, 0.53, 0.7, 0.85] as const;

const spec9: StageSpec<ForePose, ForeOpts> = {
  S: S9,
  pose: END8.pose,
  opts: { ...END8.opts, diaphragm: 0.3 },
  caption: 'Atzeko mesogastrioa: barea, bi lotailu eta epiploi handia (3D eredua)',
  key: KEY_F.peri,
  keyTitle: 'Kolorea',
  steps: [
    {
      to: { spleen: 1 },
      run: [0.1, 0.7],
      opts: { topCut: 1 },
      cam: TOP([0.55, 0.7, -0.6], 6.4, 6),
      glide: 0.06,
      dim: ['barea', 'mesogastrio-dortsala', 'urdaila'],
      names: [{ id: 'mesogastrio-dortsala', text: 'Atzeko mesogastrioa', sub: '(bi orri, ezkerrean)' }, { id: 'barea', sub: '(bi orrien artean)', from: 0.4 }],
      note: 'Atzeko mesogastrioak bi orri ditu eta ezkerrean dago; bi orrien artean barearen hastapena: barea, errai peritoneoz inguratuta',
    },
    {
      cam: TOP([0.55, 0.7, -0.6], 6.0, 6),
      dim: ['lotailu-gastroesplenikoa', 'lotailu-esplenoerrenala', 'barea', 'urdaila', 'paretako-peritoneoa'],
      names: [
        { id: 'lotailu-gastroesplenikoa', sub: 'urdaila ↔ barea', from: 0.1 },
        { id: 'lotailu-esplenoerrenala', sub: 'barea ↔ atzeko pareta (laburra)', from: 0.35 },
        { id: 'barea', small: true },
      ],
      note: 'Barearekin bi lotailu: gastroesplenikoa (gastrolienala), urdaila ↔ barea; esplenoerrenala, barea ↔ atzeko paretako peritoneoa (oso laburra)',
    },
    {
      to: { bowel: 1, omentum: 1 },
      run: [0.06, 0.8],
      opts: { topCut: 0 },
      cam: orbit(32, 8, 10, [0.2, -0.55, 0.1], SH),
      glide: 0.07,
      dim: ['epiploi-handia', 'zeharkako-kolona', 'jejunoa', 'makurdura-handia', 'mesogastrio-dortsala'],
      names: [
        { id: 'epiploi-handia', sub: '(epiploiaren amantala)', from: 0.35 },
        { id: 'zeharkako-kolona', small: true, from: 0.15 },
        { id: 'jejunoa', text: 'Heste meharraren lakioak', small: true, from: 0.25 },
        { id: 'makurdura-handia', small: true },
      ],
      note: 'Atzeko mesogastrioa makurdura handi osotik behera luzatzen da, zeharkako kolonaren eta heste meharraren aurretik: epiploi handia',
    },
    {
      cam: orbit(90, 4, 8.6, [0.2, -0.9, 0.15], SH),
      glide: 0.06,
      dim: ['epiploi-handia', 'poltsa-omentala', 'zeharkako-kolona'],
      names: [
        { id: 'epiploi-handia', sub: '(aurreko eta atzeko orriak)' },
        { id: 'poltsa-omentala', p: 'poltsa-omentala-beheko', text: 'Poltsa omentalaren beheranzko luzapena', from: 0.3 },
      ],
      note: 'Albotik (ezkerretik): epiploi handiaren aurreko eta atzeko orrien artean poltsa omentalaren beheranzko luzapena',
    },
    {
      to: { omFuse: 1 },
      run: [0.1, 0.7],
      cam: orbit(90, 4, 8.6, [0.2, -0.9, 0.15], SH),
      dim: ['epiploi-handia', 'zeharkako-kolona', 'mesokolon-dortsala'],
      names: [
        { id: 'epiploi-handia', sub: '(bi orriak fusionatzen dira)' },
        { id: 'zeharkako-kolona', small: true, from: 0.3 },
        { id: 'mesokolon-dortsala', text: 'Zeharkako kolonaren mesoa', small: true, from: 0.45 },
      ],
      note: 'Luzapena desagertzen da: epiploi handiaren bi orriak fusionatzen dira, baita zeharkako kolonaren errai peritoneoarekin eta mesoarekin ere',
    },
    {
      cam: orbit(14, 10, 10, [0.35, -0.3, 0.0], SH),
      glide: 0.07,
      dim: ['barea', 'epiploi-handia', 'mesogastrio-dortsala', 'urdaila'],
      names: [{ id: 'barea', small: true }, { id: 'epiploi-handia' }, { id: 'urdaila', small: true }],
      note: 'Laburki: urdailaren biraketagatik atzeko mesogastrioa ezkerrera eta behera: barea, bi lotailuak eta epiploi handia',
    },
  ],
};
export const DorsalMeso3D = fore(spec9);
const END9 = endPose(spec9).pose;

// ———————————————————————————— stage 10: the ventral mesogastrium (notes 3.2, p14) ————————————————————————————

export const S10 = [0, 0.26, 0.52, 0.76] as const;

const VM = ['mesogastrio-bentrala', 'epiploi-txikia', 'lotailu-faltziformea', 'gibela', 'septum-transversum', 'diafragma', 'makurdura-txikia'];
const UNDER = orbit(-22, -22, 6.6, [-0.15, 0.7, 0.05], SH);

const spec10: StageSpec<ForePose, ForeOpts> = {
  S: S10,
  pose: END9,
  opts: { diaphragm: 0.34 },
  caption: 'Aurreko mesogastrioa: epiploi txikia eta lotailu faltziformea (3D eredua)',
  key: KEY_F.ventral,
  keyTitle: 'Kolorea',
  steps: [
    {
      // The liver grows inside the septum transversum (which stays, see-through, till the liver's own stage).
      to: { liver: 0.85, vmeso: 1, falc: 1, front: 1 },
      run: [0.06, 0.7],
      cam: orbit(-18, 6, 8.4, [-0.1, 0.85, 0.25], SH),
      glide: 0.07,
      dim: VM,
      names: [
        { id: 'septum-transversum', text: 'Septum transversuma', sub: '→ diafragma, gibela, 2 lotailu' },
        { id: 'gibela', from: 0.3 },
        { id: 'mesogastrio-bentrala', sub: '(makurdura txikitik)', from: 0.45 },
      ],
      note: 'Aurrean septum transversumeko mesodermoa: hortik diafragma, gibela eta aurreko mesogastrioaren bi lotailuak; makurdura txikitik sortzen da',
    },
    {
      to: { lesser: 1 },
      run: [0.5, 0.75],
      opts: { liverGlass: 0.5 },
      cam: UNDER,
      glide: 0.06,
      dim: ['epiploi-txikia', 'urdaila', 'gibela', 'poltsa-omentala'],
      names: [
        { id: 'epiploi-txikia', sub: 'urdaila ↔ gibela' },
        { id: 'poltsa-omentala', text: 'Atzean: poltsa omentala', small: true, from: 0.25 },
        { id: 'lotailu-gastroepatikoa', small: true, from: 0.55 },
        { id: 'lotailu-duodenoepatikoa', small: true, from: 0.62 },
      ],
      note: '1) Epiploi txikia: urdailaren eta gibelaren errai peritoneoen artean; bi atal (gastroepatikoa eta duodenoepatikoa); atzean poltsa omentala',
    },
    {
      to: { edge: 1 },
      run: [0.08, 0.5],
      cam: orbit(-78, -6, 4.6, [-0.35, 0.55, -0.05], SH),
      glide: 0.07,
      dim: ['winslow-hiatoa', 'gibel-arteria', 'porta-zaina', 'koledokoa', 'lotailu-duodenoepatikoa', 'gibela', 'poltsa-omentala'],
      names: [
        { id: 'winslow-hiatoa', sub: '(ertz librearen atzean)', from: 0.1 },
        { id: 'gibel-arteria', small: true, from: 0.25 },
        { id: 'porta-zaina', text: 'Zain porta', sub: '(hemen apunteek: "bena korda")', small: true, from: 0.32 },
        { id: 'koledokoa', sub: '(ateratzen da)', small: true, from: 0.4 },
      ],
      note: 'Eskuinean ertz libre bat, eta haren atzean poltsa omentalaren sarrera: Winslow hiatoa. Ertzean: gibel arteria eta zain porta (sartzen), koledokoa (irteten)',
    },
    {
      opts: { liverGlass: 0 },
      cam: orbit(-34, 8, 7.4, [-0.1, 0.4, 0.6], SH),
      glide: 0.07,
      dim: ['lotailu-faltziformea', 'gibela', 'paretako-peritoneoa'],
      names: [{ id: 'lotailu-faltziformea', sub: '(igitai formako lotailua)' }, { id: 'gibela', small: true }, { id: 'paretako-peritoneoa', text: 'Aurreko paretako peritoneoa', small: true, from: 0.3 }],
      note: '2) Lotailu faltziformea (igitai formako lotailua): gibelaren errai peritoneoa ↔ aurreko paretako peritoneoa',
    },
  ],
};
export const VentralMeso3D = fore(spec10);
export const END10 = endPose(spec10);

// ———————————————————————————— stage 11: the duodenum (notes 3.3; 3.2, p15) ————————————————————————————

export const S11 = [0, 0.15, 0.32, 0.5, 0.66, 0.84] as const;

const KEY_DUO = [
  { color: FC.fore, text: 'aurreko hestea (enbor zeliakoa)' },
  { color: FC.mid, text: 'bitarteko hestea (goiko a. mesenterikoa)' },
] as const;
const DUO = ['duodenoa', 'duodenoaren-lehen-atala', 'duodenoaren-bigarren-atala', 'duodenoaren-hirugarren-atala', 'duodenoaren-laugarren-atala', 'jejunoa'];
const DUO_FRONT = orbit(-12, -8, 5.6, [-0.25, -0.2, -0.55], SH);

const spec11: StageSpec<ForePose, ForeOpts> = {
  S: S11,
  pose: END10.pose,
  opts: { ...END10.opts, diaphragm: 0.3 },
  caption: 'Duodenoa: lau atal, jatorri bikoitza eta fusioa (3D eredua, aurretik; aurrealdeko egiturak gardenak)',
  steps: [
    {
      to: { liver: 1 },
      opts: { clear: 1, liverGlass: 0.65 },
      run: [0.05, 0.6],
      cam: DUO_FRONT,
      glide: 0.07,
      dim: [...DUO, 'urdaila', 'piloroa'],
      names: [{ id: 'duodenoa', sub: '(urdailaren jarraian)', from: 0.3 }, { id: 'jejunoa', small: true, from: 0.45 }, { id: 'piloroa', small: true }],
      note: 'Urdailaren ostean heste meharra: duodenoa, jejunoa eta ileona. Duodenoa abdomenaren mailan, urdailaren jarraian; jatorri bikoitza du',
    },
    {
      to: { duodParts: 1 },
      run: [0.05, 0.3],
      cam: DUO_FRONT,
      dim: DUO,
      names: [
        { id: 'duodenoaren-lehen-atala', text: '1. atala', sub: 'horizontala, eskuinera (bulboa)', from: 0.1 },
        { id: 'duodenoaren-bigarren-atala', text: '2. atala', sub: 'beheranzkoa', from: 0.25 },
        { id: 'duodenoaren-hirugarren-atala', text: '3. atala', sub: 'horizontala, ezkerrera', from: 0.4 },
        { id: 'duodenoaren-laugarren-atala', text: '4. atala', sub: 'goranzkoa, ezkerrera → jejunoa', from: 0.55 },
        { id: 'jejunoa', small: true, from: 0.7 },
      ],
      note: 'Lau azpiatal: 1. horizontala eskuinera (bulboa), 2. beheranzkoa, 3. horizontala ezkerrera, 4. goranzkoa eta ezkerrera (L3 ezkerrean jejunoarekin jarraitzen du)',
    },
    {
      to: { origin: 1 },
      run: [0.08, 0.5],
      cam: orbit(-34, 2, 5.4, [-0.2, -0.1, -0.7], SH),
      glide: 0.05,
      dim: [...DUO, 'enbor-zeliakoa', 'goiko-arteria-mesenterikoa'],
      names: [
        { id: 'enbor-zeliakoa', sub: '→ aurreko hesteko atala', from: 0.3 },
        { id: 'goiko-arteria-mesenterikoa', sub: '→ bitarteko hesteko atala', from: 0.42 },
        { id: 'duodenoaren-bigarren-atala', text: '2. atala', sub: 'bi jatorrien muga', small: true },
      ],
      marks: [{ p: 'duodeno-jatorri-muga', text: 'aurreko | bitarteko', dx: -60, dy: 0 }],
      note: '1. atala eta 2.aren hurbilekoa aurreko hestetik; 2.aren urrutikoa, 3.a eta 4.a bitarteko hestetik: bi arteria (enbor zeliakoa, goiko a. mesenterikoa)',
      key: KEY_DUO,
      keyTitle: 'Kolorea = jatorria',
    },
    {
      cam: orbit(-72, 2, 5.6, [-0.35, -0.25, -0.8], SH),
      glide: 0.06,
      dim: ['mesoduodeno-dortsala', 'paretako-peritoneoa', ...DUO],
      names: [{ id: 'mesoduodeno-dortsala', sub: 'duodenoa ↔ atzeko pareta' }, { id: 'paretako-peritoneoa', text: 'Atzeko paretako peritoneoa', small: true, from: 0.3 }],
      note: 'Hasieran mesoduodeno dortsalak duodenoa peritoneo barrunbearen (abdomenaren) atzeko paretarekin lotzen du (eskuinetik)',
      key: KEY_F.peri,
      keyTitle: 'Kolorea',
    },
    {
      to: { duodRot: 1, fuse: 1 },
      run: [0.06, 0.8],
      cam: orbit(-52, 12, 6, [-0.3, -0.2, -0.7], SH),
      glide: 0.05,
      dim: ['mesoduodeno-dortsala', 'paretako-peritoneoa', ...DUO],
      names: [{ id: 'duodenoa', sub: '→ eskuinera biratzen da' }, { id: 'mesoduodeno-dortsala', sub: '→ atzeko paretarekin fusionatzen da', from: 0.45 }],
      note: 'Duodenoa eskuinera biratzen da, eta mesoduodenoa atzeko paretako peritoneoarekin guztiz fusionatzen da: duodeno ia osoa peritoneo kanpoan',
      key: KEY_F.peri,
      keyTitle: 'Kolorea',
    },
    {
      to: { veil: 1 },
      run: [0.06, 0.4],
      cam: orbit(-22, 4, 6, [-0.25, -0.3, -0.6], SH),
      glide: 0.05,
      dim: [...DUO, 'paretako-peritoneoa'],
      names: [
        { id: 'duodenoaren-lehen-atala', text: 'Bulboa', sub: 'peritoneo barrukoa' },
        { id: 'duodenoaren-hirugarren-atala', text: '2.–4. atalak', sub: 'peritoneo atzekoak', from: 0.2 },
        { id: 'jejunoa', sub: 'berriz peritoneo barrukoa', from: 0.4 },
      ],
      note: 'Lehen atala (bulboa) bakarrik mantentzen da errai peritoneoz inguratuta; 2., 3. eta 4. atalak peritoneo atzekoak; jejunoa berriz peritoneo barrukoa',
      key: KEY_F.peri,
      keyTitle: 'Kolorea',
    },
  ],
};
export const Duodenum3D = fore(spec11);
const END11 = endPose(spec11);

// ———————————————————————————— stage 12: the liver (notes 3.4, p3–p10) ————————————————————————————

export const S12 = [0, 0.18, 0.4, 0.62, 0.82] as const;

const LIVER = ['gibela', 'gibel-hastapena', 'septum-transversum', 'gibel-hodia'];

const spec12: StageSpec<ForePose, ForeOpts> = {
  S: S12,
  pose: { ...END11.pose, veil: 0 },
  opts: { ...END11.opts, liverGlass: 0 },
  caption: 'Gibela: hastapena septum transversumean (3D eredua, aurretik; enbrioiaren ezkerra zure eskuinean)',
  key: KEY_F.ventral,
  keyTitle: 'Kolorea',
  steps: [
    {
      cam: orbit(-6, 6, 8.2, [-0.1, 0.4, 0.0], SH),
      glide: 0.07,
      dim: ['gibela'],
      names: [{ id: 'gibela', sub: 'goi-eskuin koadrantea (eskumako hipokondrioa)' }],
      note: 'Aurreko hestea gibel hastapenaren mailaraino; gibela peritoneo barrukoa, abdomenaren goi-eskuin koadrantean (eskumako hipokondrioa)',
    },
    {
      // Back to the beginning: the bud of the foregut's distal part, growing and branching into the septum.
      to: { liver: 0.32 },
      run: [0.05, 0.75],
      cam: orbit(-30, 4, 5.2, [-0.25, 0.65, 0.1], SH),
      glide: 0.06,
      dim: LIVER,
      names: [
        { id: 'gibel-hastapena', sub: '(aurreko hestearen urrutiko ataletik)', from: 0.45 },
        { id: 'septum-transversum', sub: '(torax eta abdomen artean)', from: 0.6 },
      ],
      note: 'Aurreko hestearen urrutiko ataletik ebaginazio endodermiko bat: gibel hastapena. Hazi eta adarkatu egiten da, septum transversumaren mesodermoan sartuz',
    },
    {
      to: { liver: 0.72 },
      run: [0.05, 0.6],
      cam: orbit(-30, 4, 5.4, [-0.3, 0.75, 0.1], SH),
      dim: LIVER,
      names: [
        { id: 'gibel-hodia', sub: '(hastapena ↔ aurreko hestea)', from: 0.35 },
        { id: 'gibela', text: 'Hepatozitoak', sub: '(hastapenaren adarkaduratik)', from: 0.55 },
      ],
      note: 'Hastapena aurreko hestearekin komunikatuta mantentzen da gibel hodiaren bidez; adarkaduratik hepatozitoak, gibeleko zelula garrantzitsuenak',
    },
    {
      to: { liver: 0.87 },
      run: [0.05, 0.5],
      cam: orbit(-20, 6, 6.2, [-0.35, 0.85, 0.2], SH),
      glide: 0.05,
      dim: ['gibela', 'septum-transversum'],
      names: [{ id: 'septum-transversum', sub: '→ gibelaren gainontzeko zelulak' }, { id: 'gibela', small: true }],
      note: 'Septum transversumaren mesodermotik gainontzeko zelulak: hematopoietikoak, kapsula konektiboarena, sistema erretikulu endotelialekoak eta Kupffer zelulak',
    },
    {
      to: { liver: 1 },
      run: [0.05, 0.5],
      cam: orbit(-14, 6, 7.4, [-0.25, 0.7, 0.2], SH),
      glide: 0.05,
      dim: ['gibela', 'lotailu-faltziformea', 'epiploi-txikia', 'errai-peritoneoa'],
      names: [{ id: 'gibela', sub: '(errai peritoneoz inguratua)' }, { id: 'lotailu-faltziformea', small: true, from: 0.35 }, { id: 'epiploi-txikia', small: true, from: 0.45 }],
      note: 'Septumeko zelula horiek gibelaren errai peritoneoa osatzen dute; gibela peritoneo barrukoa da, eta lotailuek (septumetik) aldameneko egiturekin lotzen dute',
    },
  ],
};
export const Liver3D = fore(spec12);
const END12 = endPose(spec12);

// ———————————————————————————— stage 13: the liver's ligaments (notes 3.4, p11–p15) ————————————————————————————

export const S13 = [0, 0.2, 0.38, 0.6, 0.78] as const;

const spec13: StageSpec<ForePose, ForeOpts> = {
  S: S13,
  pose: END12.pose,
  opts: END12.opts,
  caption: 'Gibelaren lotailuak (3D eredua)',
  key: KEY_F.ventral,
  keyTitle: 'Kolorea',
  steps: [
    {
      to: { round: 1 },
      run: [0.2, 0.6],
      cam: orbit(-32, 8, 7.2, [-0.1, 0.25, 0.6], SH),
      glide: 0.06,
      dim: ['lotailu-faltziformea', 'gibeleko-lotailu-borobila', 'gibela', 'diafragma'],
      names: [
        { id: 'lotailu-faltziformea', sub: 'gibela ↔ diafragma eta aurreko pareta' },
        { id: 'gibeleko-lotailu-borobila', sub: '(beheko ertz librean; zilbor zainetik)', from: 0.4 },
      ],
      note: 'Septumeko mesodermotik lotailu faltziformea (igitai formakoa): gibelaren errai peritoneoa ↔ aurreko paretako peritoneoa; beheko ertz librean lotailu borobila',
    },
    {
      opts: { liverGlass: 0.5 },
      cam: orbit(-22, -22, 6.4, [-0.15, 0.7, 0.05], SH),
      glide: 0.06,
      dim: ['epiploi-txikia', 'urdaila', 'gibela'],
      names: [{ id: 'epiploi-txikia', sub: '(mesodermoa argaltzean)' }],
      note: 'Urdailaren eta gibelaren arteko mesodermoa argaldu egiten da: epiploi txikia, bi errai peritoneoak lotzen dituena',
    },
    {
      to: { coron: 1 },
      run: [0.1, 0.55],
      opts: { liverGlass: 0, diaphragm: 0.16 },
      cam: orbit(-150, 42, 5.2, [-0.5, 1.35, 0.05], SH),
      glide: 0.08,
      dim: ['area-biluzia', 'lotailu-koronarioak', 'gibela', 'diafragma'],
      names: [{ id: 'lotailu-koronarioak', sub: 'gibela ↔ diafragma azpiko peritoneoa', from: 0.2 }, { id: 'area-biluzia', sub: '(peritoneorik gabe)', from: 0.4 }],
      note: 'Goi atzeko aurpegian peritoneorik gabeko eskualdea: area biluzia, bi lotailu koronarioen artean (gibela ↔ diafragma azpiko paretako peritoneoa)',
    },
    {
      opts: { diaphragm: 0.3 },
      cam: orbit(-26, 8, 7.6, [-0.15, 0.6, 0.35], SH),
      glide: 0.08,
      dim: ['epiploi-txikia', 'lotailu-faltziformea', 'gibela', 'mesogastrio-bentrala'],
      names: [{ id: 'mesogastrio-bentrala', text: 'Aurreko mesogastrioa', sub: '= epiploi txikia + lotailu faltziformea' }, { id: 'epiploi-txikia', small: true }, { id: 'lotailu-faltziformea', small: true }],
      note: 'Laburbilduz: gibela peritoneo barrukoa; epiploi txikiak urdailarekin eta lotailu faltziformeak aurreko paretarekin lotzen du. Biak aurreko mesogastrioa',
    },
    {
      opts: { liverGlass: 0.5 },
      cam: orbit(-78, -6, 4.8, [-0.35, 0.55, -0.1], SH),
      glide: 0.07,
      dim: ['lotailu-gastroepatikoa', 'lotailu-duodenoepatikoa', 'winslow-hiatoa', 'poltsa-omentala', 'gibel-arteria', 'porta-zaina', 'koledokoa'],
      names: [
        { id: 'lotailu-duodenoepatikoa', sub: '(eskuinean)' },
        { id: 'lotailu-gastroepatikoa', sub: '(ezkerrean)', small: true },
        { id: 'winslow-hiatoa', sub: '→ poltsa omentala', from: 0.25 },
        { id: 'porta-zaina', text: 'Zain porta', small: true, from: 0.4 },
      ],
      note: 'Epiploi txikia: gastroepatikoa (ezkerrean) eta duodenoepatikoa (eskuinean). Eskumako ertz librean Winslow hiatoa → poltsa omentala; ertzean gibel arteria, zain porta, koledokoa',
    },
  ],
};
export const LiverLigaments3D = fore(spec13);
const END13 = endPose(spec13);

// ———————————————————————————— stage 14: the gallbladder (notes 3.5) ————————————————————————————

export const S14 = [0, 0.34, 0.66] as const;

const BILE = ['behazun-xixkua', 'hodi-zistikoa', 'gibel-hodia', 'koledokoa', 'duodenoaren-bigarren-atala'];
/** A point well inside the liver's right lobe, low enough to stay in frame from below. */
const LIVER_LOW: [number, number, number] = [-0.8, 0.8, 0.3];
const BILE_CAM = orbit(-38, -16, 4.4, [-0.32, 0.38, 0.0], SH);

const spec14: StageSpec<ForePose, ForeOpts> = {
  S: S14,
  pose: { ...END13.pose, gall: 0 },
  opts: { ...END13.opts, liverGlass: 0.7 },
  caption: 'Behazun-xixkua eta behazun hodiak (3D eredua, aurretik, eskuinetik eta behetik; gibela gardena)',
  steps: [
    {
      to: { gall: 1 },
      run: [0.1, 0.8],
      cam: BILE_CAM,
      glide: 0.07,
      dim: BILE,
      names: [{ id: 'koledokoa', sub: '(gibel hastapenaren hurbileko atala)' }, { id: 'behazun-xixkua', sub: '(hastapen berri batetik)', from: 0.5 }, { id: 'gibela', p: LIVER_LOW, small: true, from: 0.7 }],
      note: 'Gibel hastapenaren hurbileko ataletik (koledokotik) beste hastapen bat: behazun-xixkuaren hastapena; bertatik behazun-xixkua',
    },
    {
      cam: BILE_CAM,
      dim: BILE,
      names: [
        { id: 'hodi-zistikoa', sub: '(behazun-xixkutik)' },
        { id: 'gibel-hodia', sub: '(gibeletik: behazun hodia)', from: 0.2 },
        { id: 'koledokoa', sub: '= zistikoa + gibel hodia', from: 0.4 },
        { id: 'gibela', p: LIVER_LOW, small: true, from: 0.6 },
      ],
      note: 'Behazun-xixkutik hodi zistikoa; gibeletik datorren gibel hodiarekin (behazun hodia) lotzen da, eta biek batera hodi koledokoa',
    },
    {
      cam: orbit(-50, -8, 4.8, [-0.4, 0.2, -0.3], SH),
      glide: 0.05,
      dim: BILE,
      names: [{ id: 'koledokoa' }, { id: 'duodenoaren-bigarren-atala', text: 'Duodenoaren 2. zatia', from: 0.3 }],
      note: 'Hodi koledokoa duodenoaren bigarren zatira irekitzen da',
    },
  ],
};
export const Gallbladder3D = fore(spec14);
const END14 = endPose(spec14);

// ———————————————————————————— stage 15: the pancreas — buds, rotation, fusion, parts (notes 3.6, p3–p10) ————————————————————————————

export const S15 = [0, 0.18, 0.38, 0.62, 0.8] as const;

const KEY_PANC = [
  { color: FC.pancV, text: 'arearen aurreko hastapena' },
  { color: FC.pancD, text: 'arearen atzeko hastapena' },
] as const;
const PANC = ['area', 'arearen-aurreko-hastapena', 'arearen-atzeko-hastapena', 'area-burua', 'area-gorputza', 'area-buztana', 'apofisi-untziformea', 'duodenoa', 'koledokoa'];
const PANC_FRONT = orbit(-8, 2, 5.6, [0.15, 0.1, -0.75], SH);

const spec15: StageSpec<ForePose, ForeOpts> = {
  S: S15,
  pose: END14.pose,
  opts: { ...END14.opts, liverGlass: 0.75, clear: 1 },
  caption: 'Area: bi hastapen, biraketa eta fusioa (3D eredua; urdaila eta gibela gardenak)',
  key: KEY_PANC,
  keyTitle: 'Kolorea = hastapena',
  steps: [
    {
      // Back to before the duodenum's rotation: the pancreas comes with it.
      to: { duodRot: 0, fuse: 0, veil: 0 },
      run: [0.05, 0.6],
      cam: orbit(-30, 6, 5.4, [-0.15, 0.1, -0.35], SH),
      glide: 0.07,
      dim: ['duodenoa', 'koledokoa', 'urdaila'],
      warn: true,
      names: [{ id: 'duodenoa', sub: '(biratu aurretik)' }, { id: 'koledokoa', small: true }],
      note: 'Area aurreko hestearen azken eratorria; peritoneo atzekoa bihurtzen da. KONTUZ: apunteek hemen "gibelak egiten duen biraketagatik"; 3.6ko p7an: duodenoaren biraketa',
    },
    {
      to: { pancD: 1, pancV: 1 },
      run: [0.08, 0.7],
      cam: orbit(-40, 8, 5.0, [-0.25, 0.0, -0.32], SH),
      glide: 0.05,
      dim: PANC,
      names: [
        { id: 'arearen-aurreko-hastapena', sub: '(koledokoaren hasieratik)', from: 0.3 },
        { id: 'arearen-atzeko-hastapena', sub: '(duodenoaren atzekaldetik)', from: 0.45 },
      ],
      note: 'Bi hastapen: aurrekoa gibel hastapenaren hurbileko ataletik (koledokoaren hasieratik); atzekoa aurreko hestearen atzeko paretatik, duodenoaren atzetik',
    },
    {
      to: { duodRot: 1, fuse: 1, pancRot: 1 },
      run: [0.06, 0.85],
      cam: orbit(-14, 58, 5.2, [-0.1, 0.1, -0.6], SH),
      glide: 0.07,
      dim: PANC,
      names: [{ id: 'arearen-aurreko-hastapena', sub: '→ atzerantz, duodenoarekin' }, { id: 'arearen-atzeko-hastapena', small: true, from: 0.3 }],
      note: 'Duodenoa eskuinera biratzean aurreko hastapena atzerantz abiatzen da, eta atzeko hastapenarekin fusionatzen da behe atzekaldean (goitik ikusita)',
    },
    {
      to: { pancParts: 1 },
      run: [0.05, 0.3],
      cam: PANC_FRONT,
      glide: 0.07,
      dim: PANC,
      names: [
        { id: 'area-burua', sub: '(eskuinean)', from: 0.1 },
        { id: 'area-gorputza', from: 0.25 },
        { id: 'area-buztana', sub: '(ezkerrean)', from: 0.4 },
      ],
      note: 'Bi hastapenak fusionatuta, areak hiru atal ditu eskuinetik ezkerrera: burua, gorputza eta buztana',
    },
    {
      cam: orbit(-26, -10, 4.6, [-0.2, -0.05, -0.75], SH),
      glide: 0.05,
      dim: PANC,
      names: [
        { id: 'apofisi-untziformea', sub: '(area txikia; arearen gakoa)' },
        { id: 'arearen-aurreko-hastapena', text: 'Aurreko hastapenetik', sub: 'buruaren beheko aldea + gakoa', small: true, from: 0.2 },
        { id: 'arearen-atzeko-hastapena', text: 'Atzeko hastapenetik', sub: 'buruaren goiko aldea, gorputza, buztana', from: 0.35 },
        { id: 'area-burua', small: true, from: 0.5 },
      ],
      note: 'Aurreko hastapenetik: buruaren beheko aldea eta apofisi untziformea (funtziformea, gakoa). Atzekotik: buruaren goiko aldea, gorputza eta buztana',
    },
  ],
};
export const Pancreas3D = fore(spec15);
const END15 = endPose(spec15);

// ———————————————————————————— stage 16: the pancreas — tissues, ducts, place (notes 3.6, p11–p19) ————————————————————————————

export const S16 = [0, 0.18, 0.38, 0.56, 0.76] as const;

const DUCTS = ['wirsung-hodia', 'santorini-hodia', 'koledokoa', 'karunkula-handia', 'duodenoaren-bigarren-atala'];
const DUCT_CAM = orbit(-22, 6, 3.8, [-0.35, 0.02, -0.72], SH);

const spec16: StageSpec<ForePose, ForeOpts> = {
  S: S16,
  pose: END15.pose,
  opts: END15.opts,
  caption: 'Area: ehunak, iraizpen hodiak eta kokapena (3D eredua)',
  key: KEY_PANC,
  keyTitle: 'Kolorea = hastapena',
  steps: [
    {
      cam: PANC_FRONT,
      glide: 0.06,
      dim: ['area', 'area-burua', 'area-gorputza', 'area-buztana', 'apofisi-untziformea'],
      names: [{ id: 'area', text: 'Area', sub: 'exokrinoa (urin pankreatikoa) + endokrinoa (irlatxoak)' }],
      note: 'Arean bi ehun: exokrinoa (urin pankreatikoak jariatzen ditu) eta endokrinoa (Langerhans irlatxoetan)',
    },
    {
      to: { ducts: 1 },
      run: [0.06, 0.5],
      cam: DUCT_CAM,
      glide: 0.06,
      dim: DUCTS,
      names: [
        { id: 'wirsung-hodia', sub: 'nagusia: atzekoaren urrutikoa + aurrekoa', from: 0.25 },
        { id: 'koledokoa', small: true, from: 0.4 },
        { id: 'karunkula-handia', sub: '(duodenoaren 2. zatia)', from: 0.5 },
      ],
      note: 'Iraizpen hodi nagusia (Wirsung): atzeko hastapeneko hodiaren urrutiko atala + aurrekoaren hodia. Koledokoarekin batera, karunkula handian bukatzen da',
    },
    {
      cam: DUCT_CAM,
      dim: DUCTS,
      names: [{ id: 'santorini-hodia', sub: 'laguntzailea: laburragoa, ez beti' }, { id: 'wirsung-hodia', small: true }, { id: 'duodenoaren-bigarren-atala', text: 'Duodenoaren 2. zatia', small: true, from: 0.3 }],
      note: 'Hodi laguntzailea (Santorini): atzeko hastapeneko hodiaren hurbileko ataletik; askoz laburragoa, ez da beti agertzen. Biak duodenoaren 2. zatira',
    },
    {
      to: { islets: 1, ducts: 0.3 },
      run: [0.06, 0.45],
      cam: orbit(-8, 4, 4.4, [0.3, 0.15, -0.75], SH),
      glide: 0.06,
      dim: ['langerhans-irlatxoak', 'area', 'area-burua', 'area-gorputza', 'area-buztana', 'apofisi-untziformea'],
      names: [{ id: 'langerhans-irlatxoak', sub: 'α glukagoia · β intsulina · somatostatina', from: 0.25 }, { id: 'area', small: true, from: 0.5 }],
      note: 'Atal endokrinoa: Langerhans irlatxoak. Alfa zelulak glukagoia, beta zelulak intsulina, beste batzuk somatostatina; hormonak zuzenean odolera (gluzemia)',
    },
    {
      to: { islets: 0, veil: 1 },
      run: [0.06, 0.5],
      cam: orbit(26, 10, 6.2, [0.55, 0.35, -0.7], SH),
      glide: 0.07,
      dim: ['area', 'area-burua', 'area-gorputza', 'area-buztana', 'apofisi-untziformea', 'lotailu-esplenoerrenala', 'barea', 'paretako-peritoneoa'],
      names: [
        { id: 'area', sub: '(peritoneo atzekoa, ia guztiz)' },
        { id: 'area-buztana', small: true, from: 0.25 },
        { id: 'lotailu-esplenoerrenala', sub: '(batzuetan buztana bere orrien artean)', from: 0.35 },
      ],
      note: 'Mesoduodenoan garatzen da, baina duodenoaren biraketarekin mesoduodenoa desagertzen da: area ia guztiz peritoneo atzean. Batzuetan buztana lotailu esplenoerrenalean',
    },
  ],
};
export const PancreasDucts3D = fore(spec16);
