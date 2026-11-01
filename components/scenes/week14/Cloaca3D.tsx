'use client';

import { orbit, poseStage, type StageSpec } from './common';
import { CC, CP0, cloacaModel, type CloacaOpts, type CloacaPose } from './cloaca-model';

/**
 * Topic 14, stage 22 (notes 5, p6 and p12–p18): the cloaca and its division by the urorectal septum, a 3D
 * close-up seen from the embryo's right (ventral on the viewer's right), as the notes' sagittal figure.
 */

const SH: [number, number] = [30, 0];
const SIDE = (dist = 4.6, target: [number, number, number] = [0, 0.3, 0.05], yaw = -90, elev = 4) => orbit(yaw, elev, dist, target, SH);

export const KEY_C = [
  { color: CC.endo, text: 'endodermoa' },
  { color: CC.ecto, text: 'ektodermoa (azalekoa, proktodeoa)' },
  { color: CC.septum, text: 'mesodermoa (trenkada uroerrektala)' },
  { color: CC.sinus, text: 'sinu urogenitala (apunteetan urdina)' },
] as const;

export const S22 = [0, 0.2, 0.4, 0.6, 0.8] as const;

const spec22: StageSpec<CloacaPose, CloacaOpts> = {
  S: S22,
  pose: CP0,
  opts: {},
  caption: 'Kloaka eta trenkada uroerrektala (3D eredua, eskuinetik: aurrea zure eskuinean)',
  key: KEY_C,
  keyTitle: 'Kolorea = jatorria',
  steps: [
    {
      cam: SIDE(5.2, [0, 0.55, 0.1]),
      glide: 0.07,
      dim: ['atzeko-hestea', 'kloaka', 'kloaka-mintza', 'alantoidea'],
      names: [
        { id: 'atzeko-hestea', sub: '→ kloakaraino' },
        { id: 'kloaka', from: 0.15 },
        { id: 'kloaka-mintza', from: 0.3 },
        { id: 'alantoidea', sub: '(endodermoa; tolespenengatik gorputz barruan)', from: 0.45 },
      ],
      note: 'Atzeko hestea kloakaraino iristen da, kloaka mintzarekin. Bere bukaeratik alantoidea irteten da (endodermikoa), tolespenengatik enbrioi barruan geratzen dena',
    },
    {
      to: { sept: 1 },
      run: [0.08, 0.8],
      cam: SIDE(4.4),
      glide: 0.05,
      dim: ['trenkada-uroerrektala', 'kloaka', 'kloaka-mintza'],
      names: [{ id: 'trenkada-uroerrektala', sub: 'alantoidearen eta atzeko hestearen artetik → kloaka mintzeraino', from: 0.2 }],
      note: 'Alantoidearen hurbileko atalaren eta atzeko hestearen artean mesodermozko trenkada uroerrektala; hazten da kloaka mintzeraino eta kloaka bitan banatzen du',
    },
    {
      to: { split: 1 },
      run: [0.06, 0.45],
      cam: SIDE(4.2, [0, 0.2, 0.2], -80),
      glide: 0.05,
      dim: ['sinu-urogenitala', 'mintz-urogenitala', 'alantoidea'],
      names: [
        { id: 'sinu-urogenitala', text: 'Hasierako sinu urogenitala', sub: '(aurrean; alantoidetik) → gernu maskuria, uretra', from: 0.3 },
        { id: 'mintz-urogenitala', from: 0.5 },
      ],
      note: '1. Aurreko atala: hasierako sinu urogenitala (urdina), kloaka mintzetik sortutako mintz urogenitalaz inguratua; alantoidetik. Hemendik gernu maskuria eta uretra',
    },
    {
      to: { procto: 1, origins: 1 },
      run: [0.06, 0.6],
      cam: SIDE(4.2, [0, -0.15, -0.15], -100),
      glide: 0.05,
      dim: ['hodi-anoerrektala', 'uzki-mintza', 'proktodeoa'],
      names: [
        { id: 'hodi-anoerrektala', sub: '(atzean) = ondestearen bukaera' },
        { id: 'hodi-anoerrektala', p: 'hurbileko-atala', text: 'Hurbileko atala', sub: 'endodermikoa (atzeko hestetik)', key: 'hurbil', from: 0.2 },
        { id: 'uzki-mintza', from: 0.35 },
        { id: 'proktodeoa', text: 'Urrutiko atala: proktodeoa', sub: 'ektodermikoa (uzki hobitxoa)', from: 0.5 },
      ],
      note: '2. Atzeko atala: hodi anoerrektala (uzki hodia), uzki mintzaz inguratua. Hurbileko atala endodermikoa; urrutikoa ektodermikoa, proktodeotik (uzki hobitxotik)',
    },
    {
      to: { open: 1, bladder: 1 },
      run: [0.08, 0.7],
      cam: SIDE(4.6, [0, 0.0, 0.05]),
      glide: 0.05,
      dim: ['uzki-mintza', 'proktodeoa', 'perineoa', 'gernu-maskuria', 'uretra'],
      names: [
        { id: 'perineoa', sub: 'sinu urogenitalaren eta hodi anoerrektalaren artean', from: 0.2 },
        { id: 'proktodeoa', text: 'Uzki zuloa', sub: '(uzki mintza desagertu da)', from: 0.45 },
        { id: 'gernu-maskuria', small: true, from: 0.6 },
        { id: 'uretra', small: true, from: 0.7 },
      ],
      note: 'Bi atalen artean uzki mintza, gero desagertu eta uzki zuloa bihurtzen dena. Sinu urogenitalaren eta hodi anoerrektalaren arteko eremua (trenkadak sortua): perineoa',
    },
  ],
};
export const Cloaca3D = poseStage(spec22, (pose, opts) => cloacaModel(pose, opts));
