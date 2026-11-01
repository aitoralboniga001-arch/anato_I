'use client';

import { orbit, poseStage, type StageSpec } from './common';
import { AP0, LC, TP0, acinusModel, treeModel, type AcinusOpts, type AcinusPose, type TreeOpts, type TreePose } from './lung-model';

/**
 * Topic 14, stages 25–26 (the notes' "ARNAS APARATUA"): the bronchial tree branching generation by
 * generation, then a close-up of one terminal bronchiole growing its respiratory bronchioles, sacs and
 * capillaries. Seen from the front (the embryo's right on the viewer's left, as the notes' figures).
 */

const SH: [number, number] = [30, 0];
const FRONT = (target: [number, number, number], dist: number, yaw = -8, elev = 4) => orbit(yaw, elev, dist, target, SH);

export const KEY_TREE = [
  { color: LC.gut, text: 'aurreko hestea (endodermoa)' },
  { color: LC.resp, text: 'arnas aparatua (endodermoa)' },
  { color: LC.cartilage, text: 'kartilagoa' },
  { color: LC.lobeR, text: 'lobuluak' },
] as const;

export const S25 = [0, 0.18, 0.38, 0.58, 0.78] as const;

const spec25: StageSpec<TreePose, TreeOpts> = {
  S: S25,
  pose: TP0,
  opts: {},
  caption: 'Bronkio zuhaitza (3D eredua, aurretik: enbrioiaren eskuina zure ezkerrean)',
  key: KEY_TREE,
  keyTitle: 'Kolorea',
  steps: [
    {
      to: { bud: 0.45 },
      run: [0.1, 0.8],
      cam: orbit(-90, 4, 4.4, [0, 1.75, -0.1], SH),
      glide: 0.07,
      dim: ['arnas-hastapena', 'aurreko-hestea'],
      names: [
        { id: 'aurreko-hestea', sub: '(aurreko pareta)' },
        { id: 'arnas-hastapena', sub: 'ebaginazio endodermikoa (22. eguna)', from: 0.3 },
      ],
      note: '22. egunean (4. astearen hasieran) aurreko hestearen aurreko paretatik ebaginazio endodermiko bat: arnas aparatuaren hastapena',
    },
    {
      to: { bud: 1, primary: 1 },
      run: [0.05, 0.75],
      cam: FRONT([0, 1.2, 0], 5.2),
      glide: 0.06,
      dim: ['birika-hastapenak', 'arnas-hastapena'],
      names: [
        { id: 'arnas-hastapena', sub: 'luzatu egiten da' },
        { id: 'birika-hastapenak', sub: '= bronkio primarioen hastapenak', from: 0.45 },
      ],
      note: 'Luzatu egiten da, eta urrutiko ataletik bi alboko hastapen: birika hastapenak (bronkio primarioen hastapenak). Gero ≈16 aldiz adarkatzen dira',
    },
    {
      to: { secondary: 1, lobes: 1 },
      run: [0.05, 0.7],
      cam: FRONT([0, 0.55, 0.05], 5.6),
      glide: 0.06,
      dim: ['bronkio-lobarrak', 'birikak'],
      names: [
        { id: 'bronkio-lobarrak', text: 'Bronkio sekundarioak', sub: '5. astea: eskuinean 3, ezkerrean 2', from: 0.15 },
        { id: 'eskuineko-birika', sub: '3 lobulu', from: 0.5 },
        { id: 'ezkerreko-birika', sub: '2 lobulu', from: 0.6 },
      ],
      marks: [{ p: 'eskuineko-birika', text: '3', dy: -40 }, { p: 'ezkerreko-birika', text: '2', dy: -40 }],
      note: '5. astean bronkio sekundarioen hastapenak: eskuinean 3 (3 lobulu), ezkerrean 2 (2 lobulu)',
    },
    {
      to: { tertiary: 1, more: 1 },
      run: [0.05, 0.8],
      cam: FRONT([0, 0.4, 0.05], 5.8, 14, 8),
      glide: 0.06,
      dim: ['bronkio-segmentarioak', 'bronkio-zuhaitza'],
      names: [
        { id: 'bronkio-segmentarioak', text: 'Bronkio tertziarioak', sub: '6. astea: lobuluetako segmentuetara (bronkio segmentarioak)', from: 0.1 },
        { id: 'bronkio-zuhaitza', sub: '≈16 adarkadura', from: 0.6 },
      ],
      note: 'Aste bat beranduago (6. astea) bronkio tertziarioen hastapenak: lobuluetako segmentuetara hedatzen dira (bronkio segmentarioak)',
    },
    {
      to: { cartilage: 1 },
      run: [0.05, 0.5],
      cam: FRONT([0, 0.9, 0.05], 6.2),
      glide: 0.06,
      dim: ['laringea', 'trakea', 'kartilago-eraztunak', 'bronkio-nagusiak', 'bronkio-lobarrak', 'bronkio-segmentarioak'],
      names: [
        { id: 'laringea', sub: 'faringearen jarraipena', from: 0.25 },
        { id: 'trakea', text: 'Trakea (zintzurrestea)', from: 0.3 },
        { id: 'kartilago-eraztunak', text: 'C itxurako kartilagoak', from: 0.35 },
        { id: 'bronkio-nagusiak', sub: 'birika kanpokoak (eskuina, ezkerra)', from: 0.42 },
        { id: 'bronkio-lobarrak', small: true, from: 0.5 },
        { id: 'bronkio-segmentarioak', small: true, from: 0.58 },
      ],
      note: 'Laringea → trakea (C itxurako kartilagoak) → bronkio nagusiak (birika kanpoan) → bronkio lobarrak → bronkio segmentarioak (birika barruan)',
    },
  ],
};
export const Tree3D = poseStage(spec25, (pose, opts) => treeModel(pose, opts));

export const KEY_ACINUS = [
  { color: LC.resp, text: 'bronkioloak (endodermoa)' },
  { color: LC.pneumo1, text: 'I. mailako pneumozitoak' },
  { color: LC.pneumo2, text: 'II. mailako pneumozitoak' },
  { color: LC.capO2, text: 'kapilarrak (errai orria)' },
  { color: LC.surf, text: 'surfaktantea' },
] as const;

export const S26 = [0, 0.14, 0.28, 0.42, 0.56, 0.71, 0.86] as const;

const CLOSE = (target: [number, number, number] = [0, 0.75, 0], dist = 4.2, yaw = -10, elev = 6) => orbit(yaw, elev, dist, target, SH);

const spec26: StageSpec<AcinusPose, AcinusOpts> = {
  S: S26,
  pose: AP0,
  opts: {},
  caption: 'Bukaerazko bronkiolo bat eta haren adarrak (3D eredua, handitua)',
  key: KEY_ACINUS,
  keyTitle: 'Kolorea',
  steps: [
    {
      cam: CLOSE([0, 1.3, 0], 3.6),
      glide: 0.07,
      dim: ['bukaerazko-bronkioloa'],
      names: [{ id: 'bukaerazko-bronkioloa', sub: '16. asterako; kartilagorik gabe', from: 0.2 }],
      note: 'Bronkio tertziarioetatik (14 aldiz gehiago adarkatuta) 16. asterako bukaerazko bronkioloak; jada ez dago kartilagorik',
    },
    {
      to: { resp: 1 },
      run: [0.05, 0.7],
      cam: CLOSE([0, 0.95, 0], 3.8),
      glide: 0.06,
      dim: ['arnas-bronkioloak'],
      names: [{ id: 'arnas-bronkioloak', sub: '16. astetik 28. astera', from: 0.3 }],
      note: 'Bukaerazko bronkioloetatik arnas bronkioloak: 16. astetik 28. astera',
    },
    {
      to: { sacs: 1 },
      run: [0.05, 0.7],
      cam: CLOSE([0, 0.6, 0], 4.2),
      glide: 0.06,
      dim: ['bukaerazko-zakuak'],
      names: [{ id: 'bukaerazko-zakuak', text: 'Bukaerazko zakuak', sub: '= hasierako albeoloak (28.–36. astea)', from: 0.3 }],
      note: '28. astetik aurrera (36. asterarte) arnas bronkioloetatik adarkadura zapalak: bukaerazko zakuak edo hasierako albeoloak',
    },
    {
      to: { caps: 1 },
      run: [0.05, 0.75],
      cam: CLOSE([0.1, 0.5, 0], 3.8, 18),
      glide: 0.06,
      dim: ['kapilarrak', 'bukaerazko-zakuak'],
      names: [
        { id: 'bukaerazko-zakuak', small: true },
        { id: 'kapilarrak', sub: 'alboko mesodermoaren errai orritik (36. astea)', from: 0.3 },
      ],
      note: '36. astean zakuen inguruan kapilarrak agertzen dira (alboko mesodermoaren errai orritik) eta zakuekin kontaktatzen dute',
    },
    {
      to: { pneumo: 1, surf: 1 },
      run: [0.05, 0.7],
      cam: CLOSE([0.55, 0.2, 0.2], 2.2, 10),
      glide: 0.06,
      dim: ['pneumozitoak-1', 'pneumozitoak-2', 'surfaktantea'],
      names: [
        { id: 'pneumozitoak-1', text: 'I. mailako pneumozitoak', sub: 'zapalak', from: 0.1 },
        { id: 'pneumozitoak-2', text: 'II. mailako pneumozitoak', from: 0.3 },
        { id: 'surfaktantea', sub: '7. hilabetetik; fosfolipidoak → gainazal tentsioa ↓', from: 0.55 },
      ],
      note: 'Paretan bi zelula epitelial mota: I. eta II. mailako pneumozitoak. II. mailakoek 7. hilabetetik surfaktantea: gainazaleko tentsioa jaisten du, albeoloak ez kolapsatzeko',
    },
    {
      to: { mature: 1 },
      run: [0.05, 0.7],
      cam: CLOSE([0.3, 0.35, 0.1], 3.0, 4),
      glide: 0.06,
      dim: ['pneumozitoak-1', 'kapilarrak', 'albeoloak'],
      names: [
        { id: 'pneumozitoak-1', text: 'I. mailakoak meheago', from: 0.15 },
        { id: 'kapilarrak', sub: 'albeoloetara proiekzioak', from: 0.3 },
        { id: 'albeoloak', text: 'Albeolo helduak', sub: '36. astetik jaio ondoko 2–3 urtera', from: 0.5 },
      ],
      note: '36. astetik jaio ondoko 2–3 urtera arte heltze prozesua: I. mailako pneumozitoak mehetzen dira eta kapilarrek proiekzioak sortzen dituzte: albeolo helduak',
    },
    {
      to: { fluid: 1 },
      run: [0.05, 0.5],
      cam: CLOSE([0, 0.55, 0], 4.0),
      glide: 0.06,
      dim: ['albeoloetako-likidoa', 'surfaktantea'],
      names: [
        { id: 'albeoloetako-likidoa', text: 'Likidoa jaiotzean', sub: 'kloruroa, proteinak, mukia, surfaktantea', from: 0.15 },
        { id: 'surfaktantea', sub: 'bakarrik hau geratzen da', from: 0.5 },
      ],
      note: 'Jaiotzean albeoloak likidoz beteta: zirkulaziora pasatzen da, mukia trakeatik eta laringetik kanpora; surfaktantea bakarrik geratzen da (espirazioan kolapsoa ekiditeko)',
    },
  ],
};
export const Acinus3D = poseStage(spec26, (pose, opts) => acinusModel(pose, opts));
