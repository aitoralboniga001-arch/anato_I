'use client';

import { Note, seg, type SceneProps } from '@/components/kit';
import type { Camera3 } from '@/lib/three-d/math';
import { ModelView, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { Steps, vis } from './common';
import { CN0, canalModel, type CanalState } from './canal3d';

/**
 * Stages 8–9 of topic 11 (notes 4 and 5.1), on the same ventricles as stages 6–7 (canal3d.ts), with the
 * conus of outflow3d.ts on their roof:
 * - Stage 8: trabeculae on the walls; the heart turns a little (the right ventricle in front); where the
 *   ridge was, the muscular IV septum rises, its faces green and cyan, its crest leaving a gap at the back
 *   under the conus through which blood still crosses (right to left, as the notes say); the conus comes over
 *   the septum and its septum's lower end closes the gap: the membranous part.
 * - Stage 9: inside the conus (its wall clear, its top cut across) two ridges, dorsal-right and ventral-left,
 *   grow and fuse into the oblique conal septum; blood then goes up each infundibulum: the right one in
 *   front and to the right (to the pulmonary artery), the left one behind and to the left (to the aorta);
 *   last the septum grows down and closes the IV gap.
 */

const CONT = 'erretena-11';
const RIGHT: [number, number] = [262, 505];

/** The finished valves of stage 7, as these stages keep them. */
const VALVES: Partial<CanalState> = { flatten: 1, shift: 1, cushions: 1, fuse: 1, swell: 1, leaflets: 1, hollow: 1, papillary: 1, chordae: 1, fibrous: 1 };

const CAM = {
  /** Into both ventricles from the front. */
  front: orbit(-6, 14, 7.6, [0, -0.4, -0.2]),
  /** From above: the right ventricle a little in front of the left, the atrium behind. */
  above: orbit(-4, 70, 9, [0, -0.1, -0.6]),
  /** From the right ventricle (its wall clear), the septum face on: the crest and the gap behind, under the conus. */
  septum: orbit(-96, 8, 6.4, [0, -0.35, -0.3]),
  /** The conus from the front and the right, a little above. */
  conus: orbit(-30, 22, 5.6, [0.02, 0.85, 0.02]),
  /** Down into the conus, cut across at its top. */
  down: orbit(-14, 64, 4.4, [0.05, 1.05, 0.08]),
} satisfies Record<string, Camera3>;

// ———————————————————————————— 11:bentrikulu-arteko-trenkada ————————————————————————————

export const P8 = [0, 0.17, 0.34, 0.5, 0.72] as const;

export const STEPS8: [number, string][] = [
  [P8[0], 'Eskuinekoa hurbileko atal bulbarretik, ezkerrekoa atal bentrikularretik'],
  [P8[1], 'Aurikulak atzean; eskuineko bentrikulua pixka bat aurrerago'],
  [P8[2], '4. aste bukaera: muskulu trenkadak, muskulu papilarrak; trenkada bat'],
  [P8[3], 'Barneko paretak hurbildu: trenkada muskularra, EZ osoa'],
  [P8[4], 'Konoaren trenkadaren beheko aldea: mintzezko trenkada'],
];

export function septumStage(t: number) {
  return {
    trab: seg(t, P8[0] + 0.03, P8[0] + 0.1),
    turn: seg(t, P8[1] + 0.02, P8[1] + 0.09),
    septum: 0.3 * seg(t, P8[2] + 0.04, P8[2] + 0.1) + 0.7 * seg(t, P8[3] + 0.01, P8[3] + 0.09),
    foramen: vis(t, P8[3] + 0.04, 2, 0.03),
    glassR: vis(t, P8[3] + 0.02, 2, 0.03),
    align: seg(t, P8[4] + 0.005, P8[4] + 0.05),
    conusGlass: seg(t, P8[4] + 0.03, P8[4] + 0.06),
    conusRidges: t >= P8[4] + 0.06 ? 1 : 0,
    conusFuse: t >= P8[4] + 0.06 ? 1 : 0,
    membranous: seg(t, P8[4] + 0.08, P8[4] + 0.17),
  };
}

export function Ventricles3D({ t }: SceneProps) {
  const s: CanalState = { ...CN0, ...VALVES, ...septumStage(t) };
  const model = canalModel(s, { phase: t, show: 1 });
  const camera = cameraAt(t, [
    [0, orbit(-24, 12, 7.8, [0, -0.4, -0.2])],
    [0.03, CAM.front],
    [P8[1], CAM.above],
    [P8[2], CAM.front],
    // 88° round to the right: a longer glide.
    [P8[3], CAM.septum, 0.05],
    [P8[4], orbit(-70, 16, 6.8, [0, 0.05, -0.2])],
    // From the right and higher, closer to the gap at the back: the membranous part closing it.
    [P8[4] + 0.08, orbit(-62, 32, 5.2, [0, -0.22, -0.36])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'hasierako-eskuineko-bentrikulua', p: 'hasierako-eskuineko-bentrikulua', show: vis(t, 0, P8[3]) },
    { id: 'hasierako-ezkerreko-bentrikulua', p: 'hasierako-ezkerreko-bentrikulua', show: vis(t, 0, P8[3]) },
    { id: 'muskulu-trenkadak', p: 'muskulu-trenkadak', show: vis(t, 0.04, P8[1]) + vis(t, P8[2], P8[3]) },
    { id: 'aurikula-komuna', p: 'aurikula-komuna', show: vis(t, P8[1] + 0.02, P8[2]), small: true },
    { id: 'muskulu-papilarrak', p: 'pap-l', show: vis(t, P8[2] + 0.02, P8[3]), small: true },
    { id: 'trenkada-muskularra', p: 'trenkada-muskularra', show: vis(t, P8[3] + 0.05, P8[4]) + vis(t, P8[4] + 0.08) * 0.999 },
    { id: 'bentrikulu-arteko-zulo-primarioa', p: 'bentrikulu-arteko-zulo-primarioa', show: vis(t, P8[3] + 0.06, P8[4] + 0.1) },
    { id: 'arteria-konoa', p: 'arteria-konoa', show: vis(t, P8[4] + 0.02), small: true },
    { id: 'konoaren-trenkada', p: 'konoaren-trenkada', show: vis(t, P8[4] + 0.06, P8[4] + 0.1), small: true },
    { id: 'mintzezko-trenkada', p: 'mintzezko-trenkada', show: vis(t, P8[4] + 0.1) },
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
          <Note x={500} y={22} size={12.5} tone="dim" show={(vis(t, 0, P8[1]) + vis(t, P8[2], P8[3])) * asked}>
            Bentrikuluen barrura, aurretik (eskuinekoa zure ezkerrean)
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P8[1], P8[2]) * asked}>
            Goitik: aurikula atzean; bihotza biratzen da, eskuineko bentrikulua aurrerago
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P8[3], P8[4]) * asked}>
            Eskuineko bentrikulutik (pareta gardena): trenkada aurrez aurre, atzean zuloa konoaren azpian
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P8[4] + 0.08) * asked}>
            Eskuinetik eta goitik (pareta gardena): mintzezko zatiak trenkadaren gaineko zuloa ixten du
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P8[4], P8[4] + 0.08) * asked}>
            Eskuinetik eta goitik: arteria konoa trenkadaren gainera; barruan haren trenkada
          </Note>
          <Note x={500} y={600} size={13} show={vis(t, P8[3] + 0.06, P8[4])}>
            Trenkada muskularraren gainetik odola eskuineko bentrikulutik ezkerrekora pasa daiteke
          </Note>
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, P8[4] + 0.14)}>
            Bentrikulu arteko trenkada = zati muskularra + haren gainean mintzezkoa
          </Note>
          {Steps({ t, steps: STEPS8, y: 630 })}
        </>
      )}
    />
  );
}

// ———————————————————————————— 11:arteria-konoa ————————————————————————————

export const P9 = [0, 0.16, 0.34, 0.52, 0.74] as const;

export const STEPS9: [number, string][] = [
  [P9[0], 'Bentrikuluak: atal trabekulatua eta atal lisoa (infundibulua)'],
  [P9[1], 'Konoan bi gandor: atze-eskuinean eta aurre-ezkerrean'],
  [P9[2], 'Hazi eta fusionatu: konoaren trenkada laprana'],
  [P9[3], 'Aurre-eskuinean eskuineko infundibulua, atze-ezkerrean ezkerrekoa'],
  [P9[4], 'Behetik hazi: trenkada muskularrarekin eta beheko kuxinarekin → mintzezkoa'],
];

export function conusStage(t: number) {
  return {
    // Clear from the side; from above, cut across with its wall solid (a section).
    conusGlass: 1 - 0.75 * vis(t, P9[1], P9[3], 0.03) - 0.75 * vis(t, P9[3] + 0.1, P9[4], 0.03),
    conusCut: t >= P9[1] ? 1 : 0,
    conusRidges: seg(t, P9[1] + 0.01, P9[1] + 0.08) * 0.42 + seg(t, P9[2] + 0.01, P9[2] + 0.1) * 0.58,
    conusFuse: t >= P9[2] + 0.11 ? 1 : 0,
    split: seg(t, P9[3], P9[3] + 0.05),
    membranous: seg(t, P9[4] + 0.04, P9[4] + 0.13),
    glassR: vis(t, P9[4] + 0.02, 2, 0.03),
    foramen: vis(t, P9[4] + 0.02, 2, 0.03),
  };
}

export function Conus3D({ t }: SceneProps) {
  const s: CanalState = { ...CN0, ...VALVES, trab: 1, turn: 1, septum: 1, align: 1, ...conusStage(t) };
  const model = canalModel(s, { phase: t, show: 1 });
  const camera = cameraAt(t, [
    [0, orbit(-60, 10, 7.4, [0, 0.1, -0.2])],
    [0.03, orbit(-36, 14, 7, [0, 0.25, -0.15])],
    [P9[1], CAM.down],
    [P9[2] + 0.06, orbit(16, 66, 4.2, [0.05, 1.05, 0.08])],
    [P9[3], CAM.conus],
    [P9[3] + 0.1, CAM.down],
    [P9[4], CAM.septum, 0.05],
  ]);
  const names: CalloutSpec[] = [
    { id: 'muskulu-trenkadak', p: 'muskulu-trenkadak', show: vis(t, 0.03, P9[1]), small: true },
    { id: 'arteria-konoa', p: 'arteria-konoa', show: vis(t, 0.03, P9[1]) },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, 0.03, P9[1]), small: true },
    { id: 'hasierako-eskuineko-bentrikulua', p: 'hasierako-eskuineko-bentrikulua', show: vis(t, 0.03, P9[1]), small: true },
    { id: 'konoaren-gandorrak', key: 'gandorra-atze-eskuin', p: 'konoaren-gandorrak', text: 'Gandorra: atze-eskuinean', show: vis(t, P9[1] + 0.04, P9[2] + 0.11) },
    { id: 'konoaren-gandorrak', key: 'gandorra-aurre-ezker', p: 'konoaren-gandorra-aurre-ezker', text: 'Gandorra: aurre-ezkerrean', show: vis(t, P9[1] + 0.04, P9[2] + 0.11) },
    { id: 'konoaren-trenkada', p: 'konoaren-trenkada', show: vis(t, P9[2] + 0.11, P9[3] + 0.1) },
    { id: 'eskuineko-infundibulua', p: 'eskuineko-infundibulua', show: vis(t, P9[3] + 0.01, P9[4]) },
    { id: 'ezkerreko-infundibulua', p: 'ezkerreko-infundibulua', show: vis(t, P9[3] + 0.01, P9[4]) },
    { id: 'trenkada-muskularra', p: 'trenkada-muskularra', show: vis(t, P9[4] + 0.03) },
    { id: 'beheko-kuxina', key: 'kuxinak-behekoa', p: 'beheko-kuxina', text: 'Beheko kuxina (AB)', show: vis(t, P9[4] + 0.03), small: true },
    { id: 'mintzezko-trenkada', p: 'mintzezko-trenkada', show: vis(t, P9[4] + 0.08) },
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
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P9[1]) * asked}>
            Eskuinetik eta aurretik: arteria konoa (gardena) bentrikuluen gainean, enbor arteriosoa haren gainean
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={(vis(t, P9[1], P9[3]) + vis(t, P9[3] + 0.1, P9[4])) * asked}>
            Goitik, konoaren barrura (goian zeharka moztuta): aurrea behean, eskuina zure ezkerrean
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P9[3], P9[3] + 0.1) * asked}>
            Aurretik eta eskuinetik: bi infundibuluak, bakoitza bere bentrikulutik
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P9[4]) * asked}>
            Eskuineko bentrikulutik (pareta gardena): trenkadaren gaineko zuloa ixten da
          </Note>
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, P9[3] + 0.04, P9[4])}>
            Eskuineko infundibulua → birika arteria · ezkerrekoa → aorta
          </Note>
          {Steps({ t, steps: STEPS9, y: 630 })}
        </>
      )}
    />
  );
}
