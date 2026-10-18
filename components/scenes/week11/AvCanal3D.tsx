'use client';

import { Note, seg, type SceneProps } from '@/components/kit';
import type { Camera3, V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { DIRS, DirArrows, ModelView, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { POSE0, heartModel, type HeartPose } from '@/components/scenes/week10/model3d';
import { Steps, vis } from './common';
import { CN0, canalModel, type CanalState } from './canal3d';

/**
 * Stages 6–7 of topic 11 (notes 3): the AV canal's septation and the AV valves, in one 3D model
 * (canal3d.ts): the two primitive ventricles cut open from the front, the canal opening in their back wall.
 * - Stage 6 follows the notes' three processes: the bulboventricular ridge flattens; the canal moves right
 *   until it opens over both ventricles; four cushions on its rim, the superior (dorsal) and inferior fusing
 *   into the septum that leaves the right and left AV orifices. Twice the camera turns to the side, with a
 *   frontal plane through the opening: the canal is frontal, not horizontal, which is why its cushions are
 *   superior and inferior. The loop of topic 10 comes back, from the side, to show why (atria behind and
 *   above, ventricles in front and below).
 * - Stage 7 grows the valves out of the swellings round each orifice: three leaflets on the right
 *   (tricuspid), two on the left (mitral), hollowed thin from the ventricular side; chordae tendineae from
 *   the leaflets to the papillary muscles, which open them as they contract.
 */

const CONT = 'erretena-11';
const RIGHT: [number, number] = [262, 505];

/** The loop of topic 10, above the canal (the camera goes up to it and comes back). */
const HEART_Y = 6.2;
const HEART_POSE: HeartPose = { ...POSE0, fuse: 1, segs: 1, colour: 1, loop: 1, loopTail: 1, atriaFuse: 1, arches: 1, veins: 1 };
const HEART_M = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, HEART_Y, 0, 1]);
const up = (p: V3): V3 => [p[0], p[1] + HEART_Y, p[2]];

const CAM = {
  /** From the front and the right, above: the atrium behind, the canal to it, the ventricles open in front. */
  overview: orbit(-48, 20, 9.6, [0, 0.05, -0.75]),
  /** Into the ventricles from the front, a little above: the floor and its ridge. */
  floor: orbit(-8, 24, 7, [0, -0.7, -0.15]),
  /** From the front: the back wall and the canal's opening in it. */
  back: orbit(0, 8, 7.4, [0, -0.35, -0.4]),
  /** From the embryo's right side, a little to the front (its front on your right): the opening in its frontal plane. */
  side: orbit(-74, 8, 9.2, [0, 0, -0.75]),
  /** Close to the opening from the front: its rim and cushions. */
  rim: orbit(-12, 6, 5.2, [0, -0.32, -0.75]),
  /** The loop from the right side (its front on your right). */
  loop: orbit(-90, 10, 10.4, [0, HEART_Y + 0.1, 0]),
  /** Down over the ridge: the way between the two ventricles. */
  foramen: orbit(-24, 30, 6.8, [0, -0.7, -0.2]),
  /** The valves from inside the ventricles (their ventricular side). */
  valves: orbit(-6, 10, 5.4, [0, -0.45, -0.55]),
  /** The right ventricle from the front and the left: tricuspid leaflets, chordae, papillary muscles. */
  rightV: orbit(24, 8, 5, [-0.55, -0.75, -0.4]),
  /** The left ventricle from the front and the right: mitral leaflets, chordae, papillary muscles. */
  leftV: orbit(-24, 8, 5, [0.55, -0.75, -0.4]),
  /** The right ventricle from the front and the left, low: the chordae at three levels of the leaflets. */
  chords: orbit(34, 2, 4.6, [-0.42, -0.72, -0.45]),
} satisfies Record<string, Camera3>;

// ———————————————————————————— 11:erreten-ab ————————————————————————————

export const P6 = [0, 0.1, 0.2, 0.31, 0.41, 0.52, 0.63, 0.74, 0.88] as const;

export const STEPS6: [number, string][] = [
  [P6[0], 'Erreten AB: atal bentrikularra ↔ aurikula komuna (goi-atzean)'],
  [P6[1], '(1) Ertz bulbobentrikularra txikitzen (zapaltzen) da'],
  [P6[2], '(2) Erretena eskuinera: bi bentrikuluak aurikularekin'],
  [P6[3], 'Albotik: erretena plano frontalean, ez horizontalean'],
  [P6[4], '(3) Ertzetan 4 kuxin: goikoa (dortsala), behekoa, bi alboetan'],
  [P6[5], 'Goikoa + behekoa fusionatu: eskuineko eta ezkerreko zulo AB'],
  [P6[6], 'Zuloak plano frontalean: horregatik kuxinak goikoa eta behekoa'],
  [P6[7], 'Gogoratu lakioa, albotik: bulboa aurrean, atal aurikularra atzean'],
  [P6[8], 'Bentrikulu arteko zulo primarioa: bi bentrikuluen artean'],
];

export function canalStage(t: number) {
  return {
    flatten: seg(t, P6[1] + 0.01, P6[1] + 0.08),
    shift: seg(t, P6[2] + 0.01, P6[2] + 0.09),
    cushions: seg(t, P6[4] + 0.005, P6[4] + 0.07),
    fuse: seg(t, P6[5] + 0.01, P6[5] + 0.08),
    frontal: vis(t, P6[3] + 0.02, P6[4], 0.025) + vis(t, P6[6] + 0.02, P6[7], 0.025),
    foramen: vis(t, P6[8] + 0.02, 2, 0.03),
    glassR: vis(t, P6[3] + 0.02, P6[4], 0.025) + vis(t, P6[6] + 0.02, P6[7], 0.025),
  };
}

export function Canal3D({ t }: SceneProps) {
  const s: CanalState = { ...CN0, ...canalStage(t) };
  const model = canalModel(s, { phase: t, show: 1 });
  const heartShow = vis(t, P6[7] - 0.02, P6[8] + 0.01, 0.025);
  const items: Item3[] = [...model.items];
  const pts = { ...model.pts };
  if (heartShow > 0.01) {
    const h = heartModel(HEART_POSE, { aortas: 0.35 });
    for (const it of h.items) if (!it.stream) items.push({ ...it, key: `h-${it.key}`, matrix: HEART_M, show: (it.show ?? 1) * heartShow });
    for (const [id, p] of Object.entries(h.pts)) pts[`h:${id}`] = up(p);
  }
  const camera = cameraAt(t, [
    [0, orbit(-62, 16, 10, [0, 0.05, -0.75])],
    [0.02, CAM.overview],
    [P6[1], CAM.floor],
    [P6[2], CAM.back],
    [P6[3], CAM.side],
    [P6[4], CAM.rim],
    [P6[5] + 0.04, orbit(10, 8, 5.2, [0, -0.32, -0.75])],
    [P6[6], CAM.side],
    [P6[7], CAM.loop],
    [P6[8], CAM.foramen],
  ]);
  const fused = t >= P6[5] + 0.045;
  const names: CalloutSpec[] = [
    { id: 'aurikula-komuna', p: 'aurikula-komuna', show: vis(t, 0, P6[1]) + vis(t, P6[3], P6[4]) },
    { id: 'erreten-aurikulubentrikularra', key: 'erretena-kanpoan', p: 'erreten-duct', show: vis(t, 0, P6[1]) + vis(t, P6[3], P6[4]) },
    { id: 'erreten-aurikulubentrikularra', p: 'erreten-aurikulubentrikularra', show: vis(t, P6[2], P6[3]) + vis(t, P6[4], P6[5] + 0.045) + vis(t, P6[8] + 0.04) },
    { id: 'hasierako-ezkerreko-bentrikulua', p: 'hasierako-ezkerreko-bentrikulua', show: vis(t, 0, P6[3]) + vis(t, P6[8] + 0.04), small: t >= P6[1] },
    { id: 'hasierako-eskuineko-bentrikulua', p: 'hasierako-eskuineko-bentrikulua', show: vis(t, 0, P6[3]) + vis(t, P6[8] + 0.04), small: t >= P6[1] },
    { id: 'arteria-konoa', p: 'arteria-konoa', show: vis(t, 0, P6[1]), small: true },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, 0, P6[1]), small: true },
    { id: 'ertz-bulbobentrikularra', p: 'ertz-bulbobentrikularra', show: vis(t, P6[1], P6[2]) + vis(t, P6[8] + 0.04) * 0.999, small: t >= P6[8] },
    { id: 'goiko-kuxina', p: 'goiko-kuxina', show: vis(t, P6[4] + 0.03, P6[5] + 0.045) + vis(t, P6[6], P6[7]) },
    { id: 'beheko-kuxina', p: 'beheko-kuxina', show: vis(t, P6[4] + 0.03, P6[5] + 0.045) + vis(t, P6[6], P6[7]) },
    { id: 'alboko-kuxinak', p: 'alboko-kuxinak', show: vis(t, P6[4] + 0.03, P6[5]) },
    { id: 'kuxin-aurikulubentrikularrak', key: 'kuxinak-fusionatuta', p: 'kuxin-aurikulubentrikularrak', text: 'Kuxinak fusionatuta (trenkada)', show: fused ? vis(t, P6[5] + 0.045, P6[6]) : 0, small: true },
    { id: 'eskuineko-zulo-ab', p: 'eskuineko-zulo-ab', show: fused ? vis(t, P6[5] + 0.045, P6[6]) : 0 },
    { id: 'ezkerreko-zulo-ab', p: 'ezkerreko-zulo-ab', show: fused ? vis(t, P6[5] + 0.045, P6[6]) : 0 },
    { id: 'zulo-aurikulubentrikularrak', p: 'zulo-aurikulubentrikularrak', show: vis(t, P6[6], P6[7]) },
    { id: 'atal-bulbarra', p: 'h:atal-bulbarra', show: vis(t, P6[7] + 0.01, P6[8]) },
    { id: 'atal-bentrikularra', p: 'h:atal-bentrikularra', show: vis(t, P6[7] + 0.01, P6[8]), small: true },
    { id: 'atal-aurikularra', p: 'h:atal-aurikularra', show: vis(t, P6[7] + 0.01, P6[8]) },
    { id: 'zain-sinua', p: 'h:zain-sinua', show: vis(t, P6[7] + 0.01, P6[8]), small: true },
    { id: 'bentrikulu-arteko-zulo-primarioa', p: 'bentrikulu-arteko-zulo-primarioa', show: vis(t, P6[8] + 0.01) },
  ];
  const G = '#7ee0a0';
  const O = '#ffb070';
  return (
    <ModelView
      model={{ items, pts }}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(at, asked) => {
        const loop = vis(t, P6[7] + 0.02, P6[8]);
        return (
          <>
            {pts['h:atal-bulbarra'] && (
              <DirArrows
                at={at}
                p={pts['h:atal-bulbarra']}
                show={loop}
                dirs={[
                  { v: DIRS.aurrera, text: 'aurrera', color: G },
                  { v: DIRS.behera, text: 'behera', color: G },
                  { v: DIRS.eskuinera, text: 'eskuinera', color: G },
                ]}
              />
            )}
            {pts['h:atal-aurikularra'] && (
              <DirArrows
                at={at}
                p={pts['h:atal-aurikularra']}
                show={loop}
                dirs={[
                  { v: DIRS.gora, text: 'gora', color: O },
                  { v: DIRS.atzera, text: 'atzera', color: O },
                  { v: DIRS.ezkerrera, text: 'ezkerrera', color: O },
                ]}
              />
            )}
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P6[1]) * asked}>
              Aurretik eta eskuinetik, goitik: aurikula komuna atzean, erretena, bentrikuluak aurretik irekita
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P6[1], P6[2]) * asked}>
              Bentrikuluen barrura, aurretik eta goitik: hondoko ertza bien artean
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P6[2], P6[3]) * asked}>
              Aurretik: atzeko paretako zuloa (erretena) zure ezkerrera mugitzen da, eskuineko bentrikulurantz
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={(vis(t, P6[3], P6[4]) + vis(t, P6[6], P6[7])) * asked}>
              ALBOTIK IKUSITA (eskuinetik, pareta gardena): aurrea zure eskuinean; plano urdina = plano frontala
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P6[4], P6[6]) * asked}>
              Aurretik, gertu: erretenaren ertza bentrikuluen atzeko paretan
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P6[7], P6[8]) * asked}>
              10. gaiko bihotz lakioa, albotik (eskuinetik): aurrea zure eskuinean
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P6[8]) * asked}>
              Goitik, ertzaren gainetik: bi bentrikuluen arteko bidea
            </Note>
            <Note x={500} y={600} size={13} tone="accent" show={loop}>
              Bulboa: aurrera, behera, eskuinera · atal aurikularra: gora, atzera, ezkerrera
            </Note>
            {Steps({ t, steps: STEPS6, y: 630 })}
          </>
        );
      }}
    />
  );
}

// ———————————————————————————— 11:balbula-ab ————————————————————————————

export const P7 = [0, 0.15, 0.31, 0.47, 0.65, 0.81] as const;

export const STEPS7: [number, string][] = [
  [P7[0], 'Zuloen inguruan mesenkima goraguneak (kuxinetatik)'],
  [P7[1], 'Eskuinean balbula trikuspidea (3 balba), ezkerrean mitrala (2)'],
  [P7[2], 'Odolak azalera bentrikularra zulatzen du: balbak meheago'],
  [P7[3], 'Soka tendinosoak (muskularrak → fibrotsuak) muskulu papilarretara'],
  [P7[4], 'Muskulu papilarrak uzkurtu: sokek balbak mugitzen dituzte'],
  [P7[5], 'Hiru soka mota: lehen, bigarren eta hirugarren mailakoak'],
];

export function valveStage(t: number) {
  const beat = vis(t, P7[4] + 0.01, P7[5], 0.02);
  return {
    swell: seg(t, P7[0] + 0.02, P7[0] + 0.1),
    leaflets: seg(t, P7[1] + 0.01, P7[1] + 0.09),
    hollow: seg(t, P7[2] + 0.01, P7[2] + 0.11),
    papillary: seg(t, P7[3] + 0.005, P7[3] + 0.05),
    chordae: seg(t, P7[3] + 0.04, P7[3] + 0.1),
    fibrous: seg(t, P7[3] + 0.11, P7[3] + 0.16),
    pull: beat * (0.5 - 0.5 * Math.cos(((t - P7[4]) / 0.05) * Math.PI * 2)),
    // The three kinds in turn (the notes say only that there are three, by where they insert).
    order: t >= P7[5] + 0.02 ? 1 + (Math.floor((t - P7[5] - 0.02) / 0.04) % 3) : 0,
  };
}

export function Valves3D({ t }: SceneProps) {
  const s: CanalState = { ...CN0, flatten: 1, shift: 1, cushions: 1, fuse: 1, ...valveStage(t) };
  // Fewer cells while the chordae are compared.
  const model = canalModel(s, { phase: t, show: 1 - 0.75 * vis(t, P7[5] + 0.01) });
  const camera = cameraAt(t, [
    [0, CAM.rim],
    [0.02, CAM.valves],
    [P7[1] + 0.06, orbit(-14, 4, 5, [0, -0.45, -0.6])],
    [P7[2], orbit(10, 2, 4.8, [0, -0.5, -0.55])],
    [P7[3], CAM.rightV],
    [P7[3] + 0.08, CAM.leftV],
    [P7[4], orbit(-14, 6, 5.6, [0, -0.7, -0.4])],
    [P7[5], CAM.chords],
  ]);
  const mitral = vis(t, P7[1] + 0.03, P7[3]) + vis(t, P7[3] + 0.08, P7[4]);
  const names: CalloutSpec[] = [
    { id: 'eskuineko-zulo-ab', p: 'eskuineko-zulo-ab', show: vis(t, 0, P7[1]), small: true },
    { id: 'ezkerreko-zulo-ab', p: 'ezkerreko-zulo-ab', show: vis(t, 0, P7[1]), small: true },
    { id: 'balbula-aurikulubentrikularrak', key: 'goraguneak', p: 'balbula-aurikulubentrikularrak', text: 'Mesenkima goraguneak (balbulak)', show: vis(t, 0.03, P7[1]) },
    { id: 'balbula-trikuspidea', p: 'balbula-trikuspidea', show: vis(t, P7[1] + 0.03, P7[3] + 0.08) },
    { id: 'balbula-mitrala', p: 'balbula-mitrala', show: mitral },
    { id: 'soka-tendinosoak', p: 'soka-tendinosoak', show: vis(t, P7[3] + 0.05, P7[3] + 0.08) },
    { id: 'soka-tendinosoak', key: 'sokak-ezkerrean', p: 'chord-l-1', show: vis(t, P7[3] + 0.08) * (t < P7[5] ? 1 : 0) },
    { id: 'muskulu-papilarrak', p: 'muskulu-papilarrak', show: vis(t, P7[3] + 0.02, P7[3] + 0.08) + vis(t, P7[5]) },
    { id: 'muskulu-papilarrak', key: 'papilarrak-ezkerrean', p: 'pap-l', show: vis(t, P7[3] + 0.08, P7[5]) },
    { id: 'soka-tendinosoak', key: 'sokak-1', p: 'chord-r-1', text: 'Soka tendinosoak: 3 mota', show: vis(t, P7[5] + 0.01) },
  ];
  return (
    <ModelView
      model={model}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(_, asked) => (
        <>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P7[3]) * asked}>
            Bentrikuluen barrutik, aurretik: zuloak atzeko paretan (eskuinekoa zure ezkerrean)
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P7[3], P7[3] + 0.08) * asked}>
            Eskuineko bentrikulua, aurretik eta ezkerretik
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P7[3] + 0.08, P7[4]) * asked}>
            Ezkerreko bentrikulua, aurretik eta eskuinetik
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P7[4], P7[5]) * asked}>
            Aurretik: muskulu papilarrak uzkurtu eta lasaitu, balbak irekiz
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P7[5]) * asked}>
            Eskuineko bentrikulua, aurretik eta ezkerretik, behetik: sokak balbaren hiru mailatan (bakoitza txandaka)
          </Note>
          <Note x={500} y={600} size={13} show={vis(t, P7[2] + 0.02, P7[3])}>
            Odolak azalera bentrikularra zulatzen du: goragune lodiak → balba meheak
          </Note>
          <Note x={500} y={600} size={13} show={vis(t, P7[5] + 0.02)}>
            Balbetan non insertatzen diren, hiru mota (apunteek ez dute zehazten non)
          </Note>
          {Steps({ t, steps: STEPS7, y: 630 })}
        </>
      )}
    />
  );
}
