'use client';

import type { At3 } from '@/components/kit/three/Stage3D';
import { endPose, orbit, poseStage, type StageSpec } from './common';
import { MC, MP0, midModel, rotArc, type MidOpts, type MidPose } from './midgut-model';

/**
 * Topic 14, stages 17–21, 23 and 24 (notes 4–5.1 and the summary): the midgut and the hindgut in the trunk,
 * one 3D model (midgut-model) posed per step on the finished foregut. Seen mostly from the front (the
 * embryo's left on the viewer's right, as the notes' frontal figures: the loop's rotation is counter-
 * clockwise from there), from the embryo's right for the loop in its sagittal plane, and from the left for
 * the descending colon and the rectum.
 */

const SH: [number, number] = [30, 0];
const mid = (spec: StageSpec<MidPose, MidOpts>) => poseStage(spec, (pose, opts) => midModel(pose, opts));

const FRONT = (target: [number, number, number], dist = 8.6, yaw = -6, elev = 4) => orbit(yaw, elev, dist, target, SH);

/** The degree readout at the rotation arrow's head (how far the loop has turned, counter-clockwise from the front). */
const arcOver = (_t: number, at: At3, pose: MidPose) => {
  const ra = rotArc(pose);
  if (!ra) return null;
  const q = at(ra.label);
  return (
    <text x={q.x} y={q.y + 7} textAnchor="middle" className="note note-accent" opacity={ra.k} style={{ fontSize: 21, fontWeight: 700 }} pointerEvents="none">
      {Math.round(ra.deg / 5) * 5}°
    </text>
  );
};

export const KEY_M = {
  regions: [
    { color: MC.fore, text: 'aurreko hestea (enbor zeliakoa)' },
    { color: MC.mid, text: 'bitarteko hestea (goiko a. mesenterikoa)' },
    { color: MC.hind, text: 'atzeko hestea (beheko a. mesenterikoa)' },
  ],
  limbs: [
    { color: MC.cephalic, text: 'adar zefalikoa' },
    { color: MC.caudal, text: 'adar kaudala' },
    { color: MC.yolk, text: 'hodi onfalomesenterikoa' },
  ],
  peri: [
    { color: MC.visceral, text: 'errai peritoneoa / mesoak' },
    { color: MC.parietal, text: 'paretako peritoneoa' },
  ],
  anal: [
    { color: MC.endo, text: 'endodermoa (atzeko hestea)' },
    { color: MC.ecto, text: 'ektodermoa (proktodeoa)' },
    { color: MC.rectal, text: 'arteria hemorroidalak' },
  ],
  place: [
    { color: MC.intra, text: 'peritoneo barrukoa' },
    { color: MC.retro, text: 'peritoneo atzekoa' },
    { color: MC.extra, text: 'peritoneo kanpokoa' },
  ],
} as const;

const SMALL = ['jejunoa', 'ileona'];
const MIDGUT = ['erdiko-hestea', 'duodenoaren-bigarren-atala', 'duodenoaren-hirugarren-atala', 'duodenoaren-laugarren-atala', 'jejunoa', 'ileona', 'kolon-itsua', 'goranzko-kolona', 'zeharkako-kolona'];
const HINDGUT = ['atzeko-hestea', 'beheranzko-kolona', 'kolon-sigmoideoa', 'ondestea', 'uzki-hodia'];

// ———————————————————————————— stage 17: the midgut (notes 4) ————————————————————————————

export const S17 = [0, 0.24, 0.48, 0.74] as const;

const spec17: StageSpec<MidPose, MidOpts> = {
  S: S17,
  pose: { ...MP0, loop: 0 },
  opts: { foreGlass: 0.45, liverGlass: 0.6, diaphragm: 0.2 },
  caption: 'Bitarteko hestea: hedadura eta eratorriak (3D eredua, aurretik; aurreko hestearen eratorriak gardenak)',
  steps: [
    {
      cam: orbit(-38, 6, 4.4, [0.1, -0.6, -0.6], SH),
      glide: 0.07,
      dim: ['erdiko-hestea', 'mesenterio-dortsala', 'paretako-peritoneoa'],
      names: [
        { id: 'erdiko-hestea', text: 'Bitarteko hestea', sub: '(peritoneo barrunbean; errai peritoneoz inguratua)' },
        { id: 'mesenterio-dortsala', text: 'Meso lotura laburra', sub: '→ atzeko paretako peritoneoa (5. astea)', from: 0.35 },
      ],
      note: 'Bitarteko hestea peritoneo barrunbean, errai peritoneoz inguratua; 5. astean meso lotura labur batek atzeko paretako peritoneoarekin lotzen du',
      key: KEY_M.peri,
      keyTitle: 'Kolorea',
    },
    {
      cam: FRONT([0.05, -0.55, -0.45], 7.2),
      glide: 0.05,
      dim: ['erdiko-hestea', 'koledokoa', 'atzeko-hestea'],
      names: [
        { id: 'koledokoa', sub: 'hasiera: koledokoaren alde distaletik', small: true },
        { id: 'erdiko-hestea', text: 'Bitarteko hestea', from: 0.2 },
        { id: 'atzeko-hestea', sub: 'zeharkako kolonaren 2/3 → 1/3 mugatik aurrera', small: true, from: 0.4 },
      ],
      marks: [{ p: 'bitarteko-muga', text: '2/3 | 1/3', dx: 46, dy: 0 }],
      note: 'Bitarteko hestea aurreko hestearen urrutiko ataletik hedatzen da: koledokoaren alde distaletik zeharkako kolonaren 2/3 eta 1/3 bat egiten diren mailaraino',
      key: KEY_M.regions,
      keyTitle: 'Kolorea = hestearen atala',
    },
    {
      // A glimpse of where the midgut ends up (the next stages show how).
      to: { loop: 1, rot: 1, ret: 1, cDesc: 1, parts: 1, vit: 0 },
      run: [0.05, 0.55],
      cam: FRONT([-0.05, -0.95, 0], 8.8),
      glide: 0.06,
      dim: MIDGUT,
      names: [
        { id: 'duodenoaren-hirugarren-atala', text: 'Duodenoa: 2.aren urrutikoa, 3.a, 4.a', small: true, from: 0.45 },
        { id: 'jejunoa', from: 0.55 },
        { id: 'ileona', from: 0.62 },
        { id: 'kolon-itsua', from: 0.7 },
        { id: 'goranzko-kolona', from: 0.76 },
        { id: 'zeharkako-kolona', sub: '(lehen 2/3)', from: 0.82 },
      ],
      note: 'Bitarteko hestetik: duodenoaren 2.aren urrutiko atala, 3.a eta 4.a; jejunoa eta ileona; kolon itsua, goranzko kolona eta zeharkako kolonaren lehen 2/3 (azken kokapena)',
      key: KEY_M.regions,
      keyTitle: 'Kolorea = hestearen atala',
    },
    {
      to: { sma: 1, celiac: 1 },
      run: [0.06, 0.5],
      cam: FRONT([-0.1, -0.7, -0.2], 8.2, -24, 8),
      glide: 0.06,
      dim: [...MIDGUT, 'goiko-arteria-mesenterikoa', 'enbor-zeliakoa', 'duodenoaren-lehen-atala'],
      names: [
        { id: 'goiko-arteria-mesenterikoa', sub: '→ bitarteko hesteko eratorri guztiak', from: 0.15 },
        { id: 'enbor-zeliakoa', sub: '→ duodenoaren 1. atala eta 2.aren hasiera', from: 0.4 },
      ],
      note: 'Bitarteko hesteko eratorri guztiak goiko arteria mesenterikoaren adarrek; duodenoak irrigazio bikoitza: hasiera enbor zeliakoak, gainerakoa goiko a. mesenterikoak',
      key: KEY_M.regions,
      keyTitle: 'Kolorea = hestearen atala',
    },
  ],
};
export const Midgut3D = mid(spec17);
const END17 = endPose(spec17);

// ———————————————————————————— stage 18: the primary loop (notes 4.1) ————————————————————————————

export const S18 = [0, 0.16, 0.32, 0.46, 0.6, 0.74] as const;

const SIDE = orbit(-84, 4, 8.6, [0, -1.05, 0.85], SH);

const spec18: StageSpec<MidPose, MidOpts> = {
  S: S18,
  pose: END17.pose,
  opts: END17.opts,
  over: arcOver,
  caption: 'Hasierako heste lakioa: bi adar, ardatza eta biraketa (3D eredua; eskuinetik eta aurretik)',
  steps: [
    {
      // Back to before the return: the midgut lengthens into the primary loop.
      to: { ret: 0, rot: 0, cDesc: 0, parts: 0, sma: 0, celiac: 0, vit: 1 },
      run: [0.04, 0.7],
      cam: SIDE,
      glide: 0.08,
      dim: ['heste-lakioa', 'erdiko-hestea', 'hodi-onfalomesenterikoa', 'bitelo-zaku-sekundarioa'],
      names: [{ id: 'heste-lakioa', text: 'Hasierako heste lakioa', sub: '(asko luzatzean)', from: 0.55 }],
      note: 'Garapenean bitarteko hestea asko luzatzen da, eta luzapen horrengatik hasierako heste lakioa sortzen da (eskuinetik ikusita; aurrea zure eskuinean)',
    },
    {
      to: { limbs: 1 },
      run: [0.05, 0.4],
      cam: SIDE,
      dim: ['adar-zefalikoa', 'adar-kaudala', 'hodi-onfalomesenterikoa', 'bitelo-zaku-sekundarioa'],
      names: [
        { id: 'adar-zefalikoa', sub: '(goian)', from: 0.1 },
        { id: 'adar-kaudala', sub: '(behean)', from: 0.25 },
        { id: 'hodi-onfalomesenterikoa', sub: 'bi adarren artean → zaku bitelinoa', from: 0.4 },
        { id: 'bitelo-zaku-sekundarioa', text: 'Bitelo zakua', small: true, from: 0.55 },
      ],
      note: 'Bi adar: zefalikoa eta kaudala. Bien artean hodi onfalomesenterikoa (bitelinoa), zaku bitelinoarekin komunikatzeko',
      key: KEY_M.limbs,
      keyTitle: 'Kolorea',
    },
    {
      cam: orbit(-70, 10, 7.2, [0, -0.6, 0.0], SH),
      glide: 0.05,
      dim: ['adar-zefalikoa'],
      names: [{ id: 'adar-zefalikoa', sub: 'duodenoaren urrutikoa (2.aren urrutikoa, 3.a, 4.a) · jejunoa · ileonaren hasierako lakioak' }],
      note: 'Adar zefalikotik: duodenoaren urrutiko atala (2.aren urrutikoa, 3.a eta 4.a), jejunoaren lakio guztiak eta ileonaren hasierako lakioak',
      key: KEY_M.limbs,
      keyTitle: 'Kolorea',
    },
    {
      cam: orbit(-100, 6, 6.6, [0, -0.98, 0.1], SH),
      glide: 0.05,
      dim: ['adar-kaudala', 'hodi-onfalomesenterikoa', 'kolon-itsuaren-hastapena'],
      names: [
        { id: 'adar-kaudala', sub: 'ileonaren urrutiko lakioak · kolon itsua · goranzko kolona · zeharkako kolonaren 2/3' },
        { id: 'kolon-itsuaren-hastapena', small: true, from: 0.3 },
        { id: 'hodi-onfalomesenterikoa', sub: '(ileonaren mailan)', small: true, from: 0.45 },
      ],
      note: 'Adar kaudaletik: ileonaren urrutiko lakioak, kolon itsua, goranzko kolona eta zeharkako kolonaren lehen 2/3. Hodi onfalomesenterikoa ileonaren mailan, bi lakio multzoen artean',
      key: KEY_M.limbs,
      keyTitle: 'Kolorea',
    },
    {
      to: { sma: 1 },
      run: [0.05, 0.5],
      cam: orbit(-60, 8, 7.6, [0, -0.85, -0.2], SH),
      glide: 0.05,
      dim: ['goiko-arteria-mesenterikoa', 'heste-lakioa', 'adar-zefalikoa', 'adar-kaudala'],
      names: [{ id: 'goiko-arteria-mesenterikoa', sub: '= lakioaren ardatza (adarrak bere inguruan biratzen dira)' }],
      note: 'Lakioaren ardatza goiko arteria mesenterikoa da: eratorriak sortzen diren bitartean bi adarrak arteria horren inguruan biratzen dira',
      key: KEY_M.limbs,
      keyTitle: 'Kolorea',
    },
    {
      // Out into the cord, turning the first 90° (counter-clockwise from the front).
      to: { hern: 1, rot: 1 / 3, cord: 1, front: 1, arc: 1 },
      run: [0.08, 0.8],
      // Three-quarter from the front and above: the loop's length and its turn round the SMA both read.
      cam: orbit(-30, 22, 9.6, [0, -1.0, 0.9], SH),
      glide: 0.08,
      dim: ['adar-zefalikoa', 'adar-kaudala', 'goiko-arteria-mesenterikoa', 'zilborrestea'],
      names: [
        { id: 'adar-zefalikoa', sub: '→ eskuinera', from: 0.5 },
        { id: 'adar-kaudala', sub: '→ ezkerrera', from: 0.55 },
        { id: 'zilborrestea', text: 'Zilbor hestea', small: true, from: 0.3 },
      ],
      note: 'Aurretik ikusita biraketa erlojuaren orratzen kontrakoa (antihorarioa): irtetean 90°, itzultzean 180°; guztira 270°',
      key: KEY_M.limbs,
      keyTitle: 'Kolorea',
    },
  ],
};
export const Loop3D = mid(spec18);
const END18 = endPose(spec18);

// ———————————————————————————— stage 19: the physiological hernia and the return (notes 4.2) ————————————————————————————

export const S19 = [0, 0.18, 0.36, 0.54, 0.72, 0.86] as const;

const spec19: StageSpec<MidPose, MidOpts> = {
  S: S19,
  pose: END18.pose,
  opts: END18.opts,
  over: arcOver,
  caption: 'Heste lakioen hernia fisiologikoa eta itzulera (3D eredua, aurretik; enbrioiaren ezkerra zure eskuinean)',
  key: KEY_M.limbs,
  keyTitle: 'Kolorea',
  steps: [
    {
      cam: orbit(62, 6, 10.2, [0, -0.45, 0.6], SH),
      glide: 0.08,
      dim: ['heste-lakioa', 'adar-zefalikoa', 'adar-kaudala', 'zilborrestea', 'enbrioi-kanpoko-zeloma', 'gibela'],
      names: [
        { id: 'zilborrestea', text: 'Zilbor hestea', sub: '(hurbileko atalean goragunea)' },
        { id: 'enbrioi-kanpoko-zeloma', sub: '(lakioak hemen)', from: 0.25 },
        { id: 'gibela', sub: '(hazten ari da: tokirik ez)', small: true, from: 0.45 },
      ],
      note: '6. astean abdomena txikia da eta gibela hazten ari da: lakioentzat tokirik ez. Zilbor hestera irteten dira, enbrioi kanpoko zelomara: hernia fisiologikoa (ezkerretik)',
    },
    {
      to: { ret: 0.25, rot: 0.55, hern: 0.6 },
      run: [0.1, 0.9],
      cam: FRONT([0, -1.0, 0.5], 9.2),
      glide: 0.08,
      dim: ['adar-zefalikoa', 'adar-kaudala', 'zilborrestea'],
      names: [
        { id: 'zilborrestea', text: 'Zilbor hestea', small: true },
        { id: 'adar-zefalikoa', sub: '← itzultzen hasten da (biratuz)', from: 0.3 },
      ],
      note: '12. aste inguruan abdomena handiagoa da (mesonefrosa endekatzen da, gibelaren hazkuntza moteltzen da): lakioak itzultzen hasten dira, biratzen diren bitartean',
    },
    {
      to: { ret: 0.55, rot: 0.78, hern: 0.3, parts: 1 },
      run: [0.06, 0.8],
      // Follow the jejunum in: the upper left of the abdomen (on your right).
      cam: FRONT([0.4, -0.85, 0.35], 7.6, -4, 6),
      glide: 0.05,
      dim: ['jejunoa'],
      names: [{ id: 'jejunoa', sub: 'lehena itzultzen; goi-ezkerrean (L2aren ezkerrean)', from: 0.55 }],
      note: 'Itzultzen den lehen atala jejunoaren hasierakoa: abdomenaren goi-ezkerrean, II. orno lunbarraren ezkerrean (ezkerreko hipokondrioa, gutxi gorabehera)',
    },
    {
      to: { ret: 1, rot: 1, hern: 0, cord: 0.35 },
      run: [0.06, 0.8],
      // Then the caecal bud, last, under the liver (upper right: on your left).
      cam: FRONT([-0.45, -0.5, 0.2], 7.4, -16, 6),
      glide: 0.05,
      dim: ['kolon-itsua'],
      names: [{ id: 'kolon-itsua', text: 'Kolon itsuaren hastapena', sub: 'azkena; goi-eskuinean, gibelaren azpian', from: 0.6 }],
      note: 'Azkena kolon itsuaren hastapena (konikoa): hasieran abdomenaren goi-eskuinean geratzen da, gibelaren beheko aldean (eskuineko hipokondrioan)',
    },
    {
      to: { cDesc: 1, cord: 0, front: 0, arc: 0 },
      run: [0.06, 0.75],
      cam: FRONT([-0.35, -0.9, 0.0], 8.6, -12),
      glide: 0.05,
      dim: ['kolon-itsua', 'goranzko-kolona', 'zeharkako-kolona'],
      names: [
        { id: 'kolon-itsua', sub: '→ eskuineko hobi iliakoa', from: 0.1 },
        { id: 'goranzko-kolona', sub: '(eskuinean)', from: 0.5 },
        { id: 'zeharkako-kolona', sub: 'gibel angelutik; lehen 2/3 bitarteko hestetik', from: 0.6 },
        { id: 'gibela', small: true, from: 0.4 },
      ],
      note: 'Kolon itsua jaisten da eskuineko hobi iliakoraino; goranzko kolona eskuinean geratzen da eta eskuineko hipokondrioan tolesten da (gibel angelua) zeharkako kolonarekin jarraitzeko',
    },
    {
      cam: FRONT([0, -0.95, 0.05], 9),
      glide: 0.05,
      dim: MIDGUT,
      names: [
        { id: 'duodenoaren-laugarren-atala', text: 'Duodenoa (2.aren urrutikoa, 3.a, 4.a)', small: true },
        { id: 'jejunoa', small: true },
        { id: 'ileona', sub: '→ eskuineko hobi iliakoa', small: true },
        { id: 'kolon-itsua', small: true },
        { id: 'goranzko-kolona', small: true },
        { id: 'zeharkako-kolona', sub: '(lehen 2/3)', small: true },
      ],
      note: 'Bitarteko hestetik sortutako atal guztiak: duodenoaren 2.aren urrutikoa, 3.a eta 4.a (gora eta ezkerrera, angelu batekin jejunora), jejunoa, ileona, kolon itsua, goranzko kolona eta zeharkako kolonaren lehen 2/3',
      key: KEY_M.regions,
      keyTitle: 'Kolorea = hestearen atala',
    },
  ],
};
export const Hernia3D = mid(spec19);
const END19 = endPose(spec19);

// ———————————————————————————— stage 20: peritoneal relations of the midgut (notes 4.4) ————————————————————————————

export const S20 = [0, 0.2, 0.4, 0.55, 0.74] as const;

const spec20: StageSpec<MidPose, MidOpts> = {
  S: S20,
  pose: { ...END19.pose, sma: 0 },
  opts: END19.opts,
  caption: 'Bitarteko hestea eta peritoneoa: barrukoak eta atzekoak (3D eredua)',
  key: KEY_M.peri,
  keyTitle: 'Kolorea',
  steps: [
    {
      to: { veil: 1 },
      run: [0.08, 0.5],
      cam: orbit(-22, 4, 6.6, [-0.25, -0.2, -0.6], SH),
      glide: 0.07,
      dim: ['duodenoaren-lehen-atala', 'duodenoaren-bigarren-atala', 'duodenoaren-hirugarren-atala', 'duodenoaren-laugarren-atala', 'paretako-peritoneoa'],
      names: [
        { id: 'duodenoaren-lehen-atala', text: 'Bulboa', sub: 'peritoneo barrukoa' },
        { id: 'duodenoaren-hirugarren-atala', text: '2.–4. atalak', sub: 'peritoneo atzekoak (mesoduodenoa fusionatuta)', from: 0.25 },
      ],
      note: 'Duodeno osoa, bulboa izan ezik, peritoneo atzekoa: eskuinera biratzean mesoduodenoa atzeko paretako peritoneoarekin fusionatu eta desagertzen da',
    },
    {
      to: { veil: 0 },
      cam: orbit(-36, 6, 7.6, [0.1, -1.0, -0.2], SH),
      glide: 0.06,
      dim: ['mesenterioa', ...SMALL],
      names: [
        { id: 'mesenterioa', sub: 'jejunoa eta ileona ↔ atzeko pareta' },
        { id: 'jejunoa', sub: '(angelu duodenojejunalean barrunbera itzultzen da)', small: true, from: 0.3 },
        { id: 'ileona', small: true, from: 0.45 },
      ],
      note: 'Angelu duodenojejunalean hestea peritoneo barrunbera itzultzen da: jejunoa eta ileona peritoneo barrukoak, mesenterioaren bidez atzeko paretako peritoneoari lotuta',
    },
    {
      cam: orbit(-30, -4, 6.4, [-0.6, -1.7, 0], SH),
      glide: 0.05,
      dim: ['kolon-itsua'],
      names: [{ id: 'kolon-itsua', sub: 'peritoneo barrukoa' }],
      note: 'Heste lodia: kolon itsua peritoneo barruko egitura da',
    },
    {
      to: { fuseA: 1 },
      run: [0.08, 0.75],
      cam: orbit(-66, 6, 7, [-0.8, -0.9, -0.5], SH),
      glide: 0.06,
      dim: ['goranzko-kolona', 'paretako-peritoneoa'],
      names: [{ id: 'goranzko-kolona', sub: 'atzeko mesorik ez → peritoneo atzekoa' }],
      note: 'Goranzko kolonak ez du atzeko mesorik (paretarekin fusionatzen da): peritoneo atzeko egitura da',
    },
    {
      to: { sma: 1 },
      run: [0.3, 0.7],
      cam: orbit(-14, 22, 8, [0.1, -0.6, -0.1], SH),
      glide: 0.06,
      dim: ['zeharkako-kolona', 'zeharkako-mesokolona', 'goiko-arteria-mesenterikoa'],
      names: [
        { id: 'zeharkako-mesokolona', sub: 'meso horizontala → atzeko pareta' },
        { id: 'zeharkako-kolona', sub: 'peritoneo barrukoa (azken 1/3 ere, baina atzeko hestetik)', from: 0.25 },
        { id: 'goiko-arteria-mesenterikoa', small: true, from: 0.55 },
      ],
      note: 'Zeharkako kolonaren lehen 2/3 peritoneo barrukoak, meso horizontal batekin atzeko paretari lotuta; azken herena ere barrukoa, baina atzeko hestetik. Guztiak goiko a. mesenterikoak',
    },
  ],
};
export const MidPeritoneum3D = mid(spec20);
const END20 = endPose(spec20);

// ———————————————————————————— stage 21: the hindgut (notes 5) ————————————————————————————

export const S21 = [0, 0.22, 0.46, 0.7] as const;

const spec21: StageSpec<MidPose, MidOpts> = {
  S: S21,
  pose: { ...END20.pose, sma: 0 },
  opts: END20.opts,
  caption: 'Atzeko hestea: eratorriak, irrigazioa eta peritoneoa (3D eredua)',
  key: KEY_M.regions,
  keyTitle: 'Kolorea = hestearen atala',
  steps: [
    {
      cam: FRONT([0.3, -1.85, -0.3], 10.4),
      glide: 0.07,
      dim: [...HINDGUT, 'zeharkako-kolona'],
      names: [
        { id: 'zeharkako-kolona', p: 'zeharkako-kolona-urruna', text: 'Zeharkako kolonaren 1/3', small: true },
        { id: 'beheranzko-kolona', sub: '(ezkerrean)', from: 0.2 },
        { id: 'kolon-sigmoideoa', text: 'Kolon sigmoideoa (sigma)', from: 0.35 },
        { id: 'ondestea', from: 0.5 },
        { id: 'uzki-hodia', sub: '(atal endodermikoa)', from: 0.62 },
      ],
      note: 'Atzeko hestea: zeharkako kolonaren 2/3aren urrutitik kloaka mintzeraino. Eratorri guztiak heste lodikoak: zeharkako 1/3, beheranzko kolona, sigma, ondestea, uzki hodia',
    },
    {
      cam: FRONT([0.45, -1.2, -0.3], 8.8, 10),
      glide: 0.05,
      dim: HINDGUT,
      names: [
        { id: 'beheranzko-kolona', sub: 'toledura esplenikotik behera' },
        { id: 'kolon-sigmoideoa', small: true, from: 0.25 },
        { id: 'ondestea', small: true, from: 0.4 },
        { id: 'uzki-hodia', text: 'Uzki hodiaren hurbileko atala', small: true, from: 0.55 },
      ],
      note: 'Zeharkako kolonaren urrutiko herena toledura esplenikoan tolestu eta beheranzko kolonarekin jarraitzen du; gero sigma, ondestea eta uzki hodiaren hurbileko atala',
    },
    {
      to: { ima: 1 },
      run: [0.06, 0.5],
      cam: orbit(18, 6, 8.6, [0.3, -1.7, -0.5], SH),
      glide: 0.06,
      dim: [...HINDGUT, 'beheko-arteria-mesenterikoa'],
      names: [{ id: 'beheko-arteria-mesenterikoa', sub: '→ atzeko hesteko eratorri guztiak', from: 0.2 }],
      note: 'Atzeko hesteko eratorri guztietara iristen diren adarrak beheko arteria mesenterikotik: atzeko hestearen arteria',
    },
    {
      to: { fuseD: 1 },
      run: [0.06, 0.7],
      cam: orbit(48, 6, 8.4, [0.5, -1.7, -0.4], SH),
      glide: 0.07,
      warn: true,
      dim: ['zeharkako-kolona', 'beheranzko-kolona', 'kolon-sigmoideoa', 'mesokolon-sigmoideoa', 'ondestea', 'paretako-peritoneoa'],
      names: [
        { id: 'zeharkako-kolona', p: 'zeharkako-kolona-urruna', text: 'Zeharkako 1/3', sub: 'peritoneo barrukoa', small: true },
        { id: 'beheranzko-kolona', sub: 'peritoneo kanpokoa (barrunbearen atzean)', from: 0.25 },
        { id: 'mesokolon-sigmoideoa', text: 'Sigma + bere atzeko mesoa', sub: 'peritoneo barrukoa', from: 0.45 },
        { id: 'ondestea', sub: 'peritoneo kanpokoa', from: 0.6 },
      ],
      note: 'Zeharkako 1/3: barrukoa · beheranzkoa: "peritoneo kanpokoa" (barrunbearen atzean; laburpenean "atzekoa") · sigma: barrukoa, mesoarekin · ondestea: kanpokoa',
      key: KEY_M.peri,
      keyTitle: 'Kolorea',
    },
  ],
};
export const Hindgut3D = mid(spec21);
const END21 = endPose(spec21);

// ———————————————————————————— stage 23: the gut's arteries; the rectal arteries (notes 5.1) ————————————————————————————

export const S23 = [0, 0.3, 0.62] as const;

const RECT_CAM = orbit(34, 4, 4.6, [0.05, -3.05, -0.8], SH);

const spec23: StageSpec<MidPose, MidOpts> = {
  S: S23,
  pose: { ...END21.pose, celiac: 0, sma: 0 },
  opts: END21.opts,
  caption: 'Hestearen irrigazioa eta uzki hodiaren arteriak (3D eredua)',
  steps: [
    {
      to: { celiac: 1, sma: 1 },
      run: [0.06, 0.5],
      cam: FRONT([0.05, -0.9, -0.4], 10.2, -8, 6),
      glide: 0.07,
      dim: ['enbor-zeliakoa', 'goiko-arteria-mesenterikoa', 'beheko-arteria-mesenterikoa'],
      names: [
        { id: 'enbor-zeliakoa', sub: '→ aurreko hestea' },
        { id: 'goiko-arteria-mesenterikoa', sub: '→ bitarteko hestea', from: 0.15 },
        { id: 'beheko-arteria-mesenterikoa', sub: '→ atzeko hestea', from: 0.3 },
      ],
      note: 'Aurreko hestea enbor zeliakoaren adarrek, bitarteko hestea goiko arteria mesenterikoarenek eta atzeko hestea beheko arteria mesenterikoarenek irrigatzen dute',
      key: KEY_M.regions,
      keyTitle: 'Kolorea = hestearen atala',
    },
    {
      to: { anal: 1, rectal: 1 },
      run: [0.06, 0.5],
      opts: { foreGlass: 0.8 },
      cam: RECT_CAM,
      glide: 0.08,
      dim: ['uzki-hodia', 'ondestea', 'goiko-arteria-hemorroidala', 'erdiko-arteria-hemorroidala', 'beheko-arteria-hemorroidala'],
      names: [
        { id: 'uzki-hodia', p: 'uzki-hodia-hurbila', text: 'Hurbileko atala', sub: 'endodermikoa → goiko a. hemorroidala', from: 0.2 },
        { id: 'uzki-hodia', p: 'uzki-hodia-urruna', text: 'Urrutiko atala', sub: 'ektodermikoa → erdiko eta beheko a. hemorroidalak', key: 'uzkiUrrun', from: 0.35 },
        { id: 'goiko-arteria-hemorroidala', small: true, from: 0.5 },
        { id: 'erdiko-arteria-hemorroidala', small: true, from: 0.6 },
        { id: 'beheko-arteria-hemorroidala', small: true, from: 0.7 },
      ],
      note: 'Uzki hodiaren irrigazioa bikoitza: hurbileko atala (endodermikoa) goiko a. hemorroidalak; urrutiko atala (ektodermikoa) erdiko eta beheko a. hemorroidalek',
      key: KEY_M.anal,
      keyTitle: 'Kolorea',
    },
    {
      cam: orbit(20, 0, 5.2, [0.05, -3.0, -0.85], SH),
      glide: 0.05,
      dim: ['goiko-arteria-hemorroidala', 'beheko-arteria-mesenterikoa', 'erdiko-arteria-hemorroidala', 'barneko-arteria-iliakoa', 'beheko-arteria-hemorroidala', 'barneko-pudenda-arteria'],
      names: [
        { id: 'goiko-arteria-hemorroidala', sub: '← beheko a. mesenterikoa' },
        { id: 'erdiko-arteria-hemorroidala', sub: '← barneko a. iliakoa', from: 0.2 },
        { id: 'beheko-arteria-hemorroidala', sub: '← barneko pudenda arteria', from: 0.4 },
        { id: 'barneko-pudenda-arteria', sub: '(barneko iliakoaren adarra)', small: true, from: 0.55 },
        { id: 'barneko-arteria-iliakoa', small: true, from: 0.65 },
        { id: 'beheko-arteria-mesenterikoa', small: true, from: 0.7 },
      ],
      note: 'Jatorriak: goiko arteria hemorroidala beheko a. mesenterikotik; erdikoa barneko a. iliakotik; behekoa barneko pudenda arteriatik (barneko iliakoaren adarra)',
      key: KEY_M.anal,
      keyTitle: 'Kolorea',
    },
  ],
};
export const Arteries3D14 = mid(spec23);
const END23 = endPose(spec23);

// ———————————————————————————— stage 24: the summary (intra / retro / extraperitoneal) ————————————————————————————

export const S24 = [0, 0.3, 0.55, 0.76] as const;

const INTRA = ['urdaila', 'duodenoaren-lehen-atala', 'jejunoa', 'ileona', 'kolon-itsua', 'zeharkako-kolona', 'kolon-sigmoideoa', 'barea'];
const RETRO = ['duodenoaren-bigarren-atala', 'duodenoaren-hirugarren-atala', 'duodenoaren-laugarren-atala', 'area', 'goranzko-kolona', 'beheranzko-kolona'];
const EXTRA = ['hestegorria', 'ondestea', 'uzki-hodia'];
const SUM_CAM = FRONT([0.05, -0.6, -0.2], 11.6, -8, 8);

const spec24: StageSpec<MidPose, MidOpts> = {
  S: S24,
  pose: { ...END23.pose, rectal: 0, anal: 0, celiac: 0, sma: 0, ima: 0 },
  opts: { ...END23.opts, foreGlass: 0, liverGlass: 0.7 },
  caption: 'Eratorrien kokapena laburbilduta: peritoneo barrukoak, atzekoak eta kanpokoak (3D eredua, aurretik)',
  key: KEY_M.place,
  keyTitle: 'Kolorea = kokapena',
  steps: [
    {
      to: { summary: 1 },
      run: [0.05, 0.4],
      cam: SUM_CAM,
      glide: 0.08,
      dim: INTRA,
      names: [
        { id: 'urdaila', small: true, from: 0.15 },
        { id: 'duodenoaren-lehen-atala', text: 'Bulboa', small: true, from: 0.21 },
        { id: 'jejunoa', small: true, from: 0.27 },
        { id: 'ileona', small: true, from: 0.33 },
        { id: 'kolon-itsua', sub: '(+ apendize bermiformea)', small: true, from: 0.39 },
        { id: 'zeharkako-kolona', small: true, from: 0.45 },
        { id: 'kolon-sigmoideoa', small: true, from: 0.51 },
        { id: 'barea', small: true, from: 0.57 },
      ],
      note: 'Peritoneo barrukoak (errai orriz inguratuak, meso batez atzeko paretari lotuak): urdaila, bulboa, jejunoa, ileona, kolon itsua, zeharkako kolona, sigma, barea',
    },
    {
      cam: SUM_CAM,
      dim: RETRO,
      names: [
        { id: 'duodenoaren-hirugarren-atala', text: 'Duodenoa 2.–4.', small: true },
        { id: 'area', small: true, from: 0.2 },
        { id: 'goranzko-kolona', small: true, from: 0.4 },
        { id: 'beheranzko-kolona', small: true, from: 0.6 },
      ],
      note: 'Peritoneo atzekoak (barrunbearen kanpoan, atzean): duodenoaren 2., 3. eta 4. atalak, area, goranzko kolona eta beheranzko kolona',
    },
    {
      cam: orbit(-30, 14, 9.2, [0, -1.0, -0.4], SH),
      glide: 0.06,
      dim: ['zeharkako-mesokolona', 'mesenterioa'],
      names: [
        { id: 'zeharkako-mesokolona', sub: '(2 orri) → atzeko pareta' },
        { id: 'mesenterioa', sub: 'jejunoa + ileona; 2 orri, inserzio lerroa', from: 0.3 },
      ],
      note: 'Zeharkako mesokolona (2 orri) atzeko paretarekin jarraitzen da. Jejunoa eta ileona meso batez (bi orri) atzeko paretari lotuak: mesenterioa',
    },
    {
      to: { fore: 1 },
      cam: orbit(20, 4, 13.2, [0, -0.2, -0.6], SH),
      glide: 0.07,
      warn: true,
      dim: EXTRA,
      names: [
        { id: 'hestegorria', small: true },
        { id: 'ondestea', small: true, from: 0.25 },
        { id: 'uzki-hodia', sub: 'hurbilekoa endodermikoa · urrutikoa ektodermikoa', small: true, from: 0.45 },
      ],
      note: 'Peritoneo kanpokoak (aurrean barrunbearen pareta bat): hestegorria, ondestea, uzki hodia. KONTUZ: 5. atalean beheranzko kolona "kanpokoa"; hemen "atzekoa"',
    },
  ],
};
export const Summary3D = mid(spec24);
