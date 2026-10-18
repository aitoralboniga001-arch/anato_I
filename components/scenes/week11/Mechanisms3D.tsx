'use client';

import { Note, seg, type SceneProps } from '@/components/kit';
import type { Camera3, V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { ModelView, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { POSE0, heartModel, type HeartPose } from '@/components/scenes/week10/model3d';
import { Steps, vis } from './common';
import { MECH0, SPECIMEN_X, mechanismModel, type MechState } from './mechanism3d';

/**
 * Stage 1 of topic 11 (notes 1, Sarrera): where the septa grow and the two ways they grow.
 * - First the heart loop of topic 10 (same model, same colours): its segments become the chambers, and
 *   the chambers get septa.
 * - The camera goes down to three small chambers cut open from the front (mechanism3d.ts): A and B for
 *   mechanism 1 (endocardial cushions: two on opposite walls, or one that reaches the opposite wall), C for
 *   mechanism 2 (two muscular walls that grow together). Blood cells cross while a way is open: in A and
 *   B they stop once the septum is complete; in C they keep passing over the incomplete muscular septum.
 * - The stage ends on the three side by side: complete, complete, incomplete.
 */

/** Step starts. */
export const P0 = [0, 0.11, 0.22, 0.35, 0.5, 0.63, 0.75] as const;

export const STEPS0: [number, string][] = [
  [P0[0], 'Bihotz lakioaren ataletatik barrunbeak; haietan trenkadak'],
  [P0[1], '27.–37. egunak: trenkadak sortzeko bi mekanismo'],
  [P0[2], '1. mekanismoa: endokardio kuxinak (matrizea + endokardioa)'],
  [P0[3], 'Aurkako paretetako bi kuxinak fusionatu: trenkada osoa'],
  [P0[4], 'Edo kuxin bakarra, kontrako paretara iritsi arte'],
  [P0[5], '2. mekanismoa: bi hasierako bentrikulu'],
  [P0[6], 'Bi barneko pareta muskularrak fusionatu: trenkada ez osoa'],
];

export function mechanismStage(t: number) {
  const a = 0.42 * seg(t, P0[2] + 0.005, P0[2] + 0.035) + 0.58 * seg(t, P0[3] + 0.01, P0[3] + 0.08);
  const aFuse = seg(t, P0[3] + 0.08, P0[3] + 0.11);
  const b = 2 * seg(t, P0[4] + 0.01, P0[4] + 0.08);
  const bFuse = seg(t, P0[4] + 0.08, P0[4] + 0.11);
  const c = seg(t, P0[6] + 0.01, P0[6] + 0.06);
  const cFuse = seg(t, P0[6] + 0.06, P0[6] + 0.09);
  return { a, aFuse, b, bFuse, c, cFuse };
}

/** The heart loop of topic 10, above the three chambers (the camera comes down from it). */
const HEART_Y = 5.8;
const HEART_POSE: HeartPose = { ...POSE0, fuse: 1, segs: 1, colour: 1, loop: 1, loopTail: 1, atriaFuse: 1, arches: 1, veins: 1 };
const HEART_M = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, HEART_Y, 0, 1]);
const up = (p: V3): V3 => [p[0], p[1] + HEART_Y, p[2]];

const CAM = {
  heart: orbit(0, 6, 9.8, [0, HEART_Y + 0.1, 0]),
  /** The three side by side, from the front and a little above: each chamber's depth shows. */
  all: orbit(0, 18, 12.2, [0, -0.12, -0.1]),
  /** Close to one chamber, from the front and a little to its right: the cut face and the depth behind it. */
  near: (x: number) => orbit(-20, 14, 5.2, [x, -0.02, -0.05]),
  /** From the front and the left, a little above: the septum's face, back wall to cut. */
  turned: (x: number) => orbit(26, 20, 5.4, [x, -0.02, -0.12]),
} satisfies Record<string, Camera3 | ((x: number) => Camera3)>;

export function Mechanisms3D({ t }: SceneProps) {
  const k = mechanismStage(t);
  const shown = vis(t, P0[1] - 0.01, 2, 0.03);
  const s: MechState = { ...MECH0, ...k, showA: shown, showB: shown, showC: shown };
  const model = mechanismModel(s, t);
  const heartShow = 1 - seg(t, P0[1] + 0.03, P0[1] + 0.06);
  const items: Item3[] = [...model.items];
  const pts = { ...model.pts };
  if (heartShow > 0.01) {
    const h = heartModel(HEART_POSE, { aortas: 0.35 });
    for (const it of h.items) if (!it.stream) items.push({ ...it, key: `h-${it.key}`, matrix: HEART_M, show: (it.show ?? 1) * heartShow });
    for (const [id, p] of Object.entries(h.pts)) pts[`h:${id}`] = up(p);
  }
  const X = SPECIMEN_X;
  /** Back to the three side by side, to compare what each mechanism gave. */
  const end = P0[6] + 0.13;
  const camera = cameraAt(t, [
    // The loop turns a little as it is recalled: its segments one behind the other, then face on.
    [0, orbit(-38, 10, 9.8, [0, HEART_Y + 0.1, 0])],
    [0.02, CAM.heart],
    [P0[1], CAM.all],
    [P0[2], CAM.near(X.a)],
    [P0[3] + 0.04, CAM.turned(X.a)],
    [P0[4], CAM.near(X.b)],
    [P0[4] + 0.08, CAM.turned(X.b)],
    [P0[5], CAM.near(X.c)],
    [P0[6] + 0.04, CAM.turned(X.c)],
    [end, CAM.all],
  ]);
  const loop = vis(t, 0, P0[1]);
  const near = (from: number, to: number) => vis(t, from, to);
  const names: CalloutSpec[] = [
    { id: 'atal-bulbarra', p: 'h:atal-bulbarra', show: loop },
    { id: 'atal-bentrikularra', p: 'h:atal-bentrikularra', show: loop },
    { id: 'atal-aurikularra', p: 'h:atal-aurikularra', show: loop },
    { id: 'zain-sinua', p: 'h:zain-sinua', show: loop },
    // A: what a cushion is (its cut), then the two fused.
    { id: 'endokardio-kuxinak', key: 'kuxinak-a', p: 'a-cush', show: near(P0[2] + 0.03, P0[4]) },
    { id: 'kuxinaren-matrizea', p: 'a-core', show: near(P0[2] + 0.03, P0[3]) },
    { id: 'endokardioa', p: 'a-cover', show: near(P0[2] + 0.03, P0[3]), small: true },
    { id: 'miokardioa', p: 'a-wall', show: near(P0[2] + 0.03, P0[3]), small: true },
    // B: the single cushion.
    { id: 'endokardio-kuxinak', key: 'kuxinak-b', p: 'b-cush', show: near(P0[4] + 0.01, P0[5]) },
    // C: the two primitive ventricles and their inner walls.
    { id: 'hasierako-eskuineko-bentrikulua', p: 'c-rv', show: near(P0[5], end), small: true },
    { id: 'hasierako-ezkerreko-bentrikulua', p: 'c-lv', show: near(P0[5], end), small: true },
    { id: 'trenkada-muskularra', key: 'paretak', p: 'c-wall-r', text: 'Barneko pareta muskularrak', show: near(P0[6], P0[6] + 0.075) },
    { id: 'trenkada-muskularra', p: 'c-septum', show: near(P0[6] + 0.075, 2) },
  ];
  const label = (x: number, y: number, z = 0): V3 => [x, y, z];
  return (
    <ModelView
      model={{ items, pts }}
      continuity="mekanismoak-11"
      right={[262, 505]}
      camera={camera}
      names={names}
      over={(at, asked) => {
        // Headings over the chambers and what each mechanism gives, while all three are in the picture.
        const all = vis(t, P0[1] + 0.03, P0[2]) + vis(t, end + 0.025, 2);
        const result = vis(t, end + 0.025, 2);
        const head = (x: number) => at(label(x, 1.25));
        const foot = (x: number) => at(label(x, -1.2, 0.1));
        const h1 = at(label((X.a + X.b) / 2, 1.25));
        return (
          <>
            <Note x={h1.x} y={h1.y} size={14} tone="accent" show={all}>
              1. mekanismoa: endokardio kuxinak
            </Note>
            <Note x={head(X.c).x} y={head(X.c).y} size={14} tone="accent" show={all}>
              2. mekanismoa: pareta muskularrak
            </Note>
            <Note x={foot(X.a).x} y={foot(X.a).y} size={13} show={result}>
              Bi kuxin → trenkada osoa
            </Note>
            <Note x={foot(X.b).x} y={foot(X.b).y} size={13} show={result}>
              Kuxin bat → trenkada osoa
            </Note>
            <Note x={foot(X.c).x} y={foot(X.c).y} size={13} show={result}>
              Bi pareta → trenkada ez osoa
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P0[1]) * asked}>
              10. gaiko bihotz lakioa, aurretik (enbrioiaren eskuina zure ezkerrean)
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P0[1], P0[2]) * asked}>
              Hiru barrunbe txiki, aurretik irekita: trenkada bakoitza erdian hazten da
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={(near(P0[2], P0[3] + 0.04) + near(P0[4], P0[4] + 0.08) + near(P0[5], P0[6] + 0.04)) * asked}>
              Aurretik eta eskuinetik: aurreko mozketa (kuxinaren barrua) eta atzeko pareta
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={(near(P0[3] + 0.04, P0[4]) + near(P0[4] + 0.08, P0[5]) + near(P0[6] + 0.04, end)) * asked}>
              Ezkerretik eta goitik: trenkadaren aurpegia, atzeko paretatik mozketaraino
            </Note>
            <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, end) * asked}>
              Hiru barrunbeak berriro: 1. mekanismoak trenkada osoa, 2.ak ez osoa (odola gainetik)
            </Note>
            {Steps({ t, steps: STEPS0, y: 630 })}
          </>
        );
      }}
    />
  );
}
