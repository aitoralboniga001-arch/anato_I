'use client';

import { Note, seg, type SceneProps } from '@/components/kit';
import type { Camera3 } from '@/lib/three-d/math';
import { ModelView, Trail, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { Steps, vis } from './common';
import { P1, P2, STEPS1, STEPS2, primumStage, secundumStage } from './Atria';
import { P3, STEPS3, birthStage } from './Birth';
import { AT0, YF, atriaModel, type AtriaFlow, type AtriaState } from './atria3d';

/**
 * The 3D main views of stages 2–4 of topic 11 (notes 2.1–2.2): both atria in one room opened from the
 * front (atria3d.ts), the septa growing between them, blood cells taking whichever way is open. Each step
 * has its camera; the camera glides between them, so the student always sees where the picture turned:
 * - from the front, the septa are the two lines of the notes' frontal section;
 * - from the right atrium (its lateral wall gone clear), the septum face on: the curtains and their holes,
 *   as the notes' view from the right atrium (the back on your left);
 * - from the left atrium, the septum primum's other face (the valve of the foramen ovale);
 * - from above into the canal, the cushions.
 * The timings are the 2D views' own (`primumStage`, `secundumStage`, `birthStage`): any moment shows the
 * same state in every view.
 */

const CONT = 'aurikulak-11';
/** Names on the right stay above the camera keys at the frame's bottom right. */
const RIGHT: [number, number] = [262, 505];

/** The cameras, named by where they look from. */
const CAM = {
  /** The whole room from the front (the right atrium on your left). */
  front: orbit(0, 10, 9.4, [0, -0.15, 0]),
  /** From the front and the right: the septum at an angle, the right atrium nearest. */
  rightFront: orbit(-52, 14, 8, [0, -0.05, -0.15]),
  /** From the right atrium, the septum face on (its lateral wall clear): the back on your left. */
  right: orbit(-90, 4, 6.9, [0, -0.15, -0.18]),
  /** From the left atrium, the septum face on (its lateral wall clear): the back on your right. */
  left: orbit(90, 6, 6.9, [0, -0.15, -0.18]),
  /** Down into the AV canal from the front and above. */
  canal: orbit(-14, 46, 6.2, [0, YF + 0.15, 0]),
  /** Close to the two septa from the front: the notes' frontal section, in depth. */
  section: orbit(-16, 12, 5, [-0.08, -0.15, -0.12]),
  /** The left atrium's back wall from the front and the left: the pulmonary veins. */
  leftBack: orbit(48, 14, 8.2, [0.35, 0, -0.25]),
} satisfies Record<string, Camera3>;

/** How clear a wall is while the camera looks through it (a step's key, fading in after the glide). */
const glass = (t: number, spans: [number, number][]) => Math.min(1, spans.reduce((a, [from, to]) => a + vis(t, from + 0.02, to, 0.03), 0));

// ———————————————————————————— 11:septum-primum ————————————————————————————

export function Primum3D({ t }: SceneProps) {
  const k = primumStage(t);
  const s: AtriaState = { ...AT0, ...k, glassRA: glass(t, [[P1[1], P1[3]], [P1[4], 2]]) };
  const flow: AtriaFlow = { phase: t, low: 1 - seg(k.closeOP, 0, 0.7), high: seg(k.os2, 0.6, 0.95), down: 1, born: 0, slit: 0 };
  const camera = cameraAt(t, [
    [0, CAM.front],
    [P1[1], CAM.rightFront],
    [P1[3], CAM.canal],
    [P1[4], CAM.right],
    // Closer to the top of the septum, where the small holes open and merge.
    [P1[5], orbit(-90, 8, 4.6, [0, 0.3, -0.24])],
    // Down to the ostium primum, as the cushions' extensions close it.
    [P1[6], orbit(-90, 2, 4.8, [0, -0.62, -0.08])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'hasierako-eskuineko-aurikula', p: 'hasierako-eskuineko-aurikula', show: vis(t, 0, P1[1]) + vis(t, P1[3], P1[4]) },
    { id: 'hasierako-ezkerreko-aurikula', p: 'hasierako-ezkerreko-aurikula', show: vis(t, 0, P1[1]) + vis(t, P1[3], P1[4]) },
    { id: 'goiko-kaba-zaina', p: 'goiko-kaba-zaina', show: vis(t, 0, P1[1]), small: true },
    { id: 'hasierako-eskuineko-bentrikulua', p: 'hasierako-eskuineko-bentrikulua', show: vis(t, 0, P1[1]), small: true },
    { id: 'hasierako-ezkerreko-bentrikulua', p: 'hasierako-ezkerreko-bentrikulua', show: vis(t, 0, P1[1]) + vis(t, P1[2], P1[3]), small: true },
    { id: 'beheko-kaba-zaina', p: 'beheko-kaba-zaina', show: vis(t, 0, P1[1]), small: true },
    { id: 'erreten-aurikulubentrikularra', p: 'erreten-aurikulubentrikularra', show: vis(t, 0, P1[1]) + vis(t, P1[2] + 0.04, P1[4]) },
    { id: 'septum-primum', p: 'septum-primum', show: vis(t, P1[1] + 0.03) },
    // Looking into the canal, the pair is named by its two members (the front one carries the pair's name).
    { id: 'beheko-kuxina', p: 'beheko-kuxina', show: vis(t, P1[3] + 0.03, P1[4]), small: true },
    { id: 'kuxin-aurikulubentrikularrak', p: 'kuxin-aurikulubentrikularrak', show: vis(t, 0, P1[1]) + vis(t, P1[2], P1[3]) + vis(t, P1[6]) },
    { id: 'kuxin-aurikulubentrikularrak', key: 'kuxinak-goikoa', p: 'goiko-kuxina', text: 'Kuxin AB: goikoa', show: vis(t, P1[3], P1[4]) },
    { id: 'ostium-primuma', p: 'ostium-primuma', show: vis(t, P1[4] + 0.03, P1[6] + 0.08) },
    { id: 'ostium-secunduma', p: 'ostium-secunduma', show: vis(t, P1[5] + 0.03) },
  ];
  return (
    <ModelView
      model={atriaModel(s, flow)}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(_, asked) => (
        <>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P1[1]) * asked}>
            4. aste bukaera · bi aurikulak aurretik irekita (enbrioiaren eskuina zure ezkerrean)
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P1[1], P1[3]) * asked}>
            Eskuinetik eta aurretik: eskuineko aurikularen pareta gardena, trenkada zeiharka
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P1[3], P1[4]) * asked}>
            Goitik, erreten aurikulubentrikularraren barrura: aurrean goiko kuxina, atzean behekoa
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P1[4]) * asked}>
            Eskuineko aurikulatik, trenkada aurrez aurre: atzea zure ezkerrean, aurrea eskuinean
          </Note>
          {Steps({ t, steps: STEPS1, y: 630 })}
        </>
      )}
    />
  );
}

// ———————————————————————————— 11:zulo-obala ————————————————————————————

export function Secundum3D({ t }: SceneProps) {
  const k = secundumStage(t);
  const s: AtriaState = { ...AT0, primum: 0.82, cushions: 1, cushionFuse: 1, os2: 1, closeOP: 1, ...k, glassRA: glass(t, [[0, P2[4]]]), glassLA: glass(t, [[P2[6], 2]]) };
  const flow: AtriaFlow = { phase: t, low: 0, high: 1, down: 1, born: 0, slit: 0 };
  const camera = cameraAt(t, [
    [0, CAM.right],
    // The spurium and the left venous valve: the right atrium's back wall, beside the septum.
    [P2[3], orbit(-112, 8, 6.2, [-0.2, 0.05, -0.35])],
    // The two septa side by side: the notes' frontal section, seen in depth.
    [P2[4], CAM.section],
    // The oblique path: a little more from the right, so the way between the septa opens up.
    [P2[5], orbit(-34, 16, 5.2, [-0.06, -0.05, -0.15])],
    // The valve: from the left atrium (the primum's other face), its upper part gone.
    [P2[6], CAM.left],
  ]);
  const names: CalloutSpec[] = [
    // The two atria are named with the way between them (the oblique path).
    { id: 'hasierako-eskuineko-aurikula', p: 'hasierako-eskuineko-aurikula', show: vis(t, P2[5], P2[6]) },
    { id: 'hasierako-ezkerreko-aurikula', p: 'hasierako-ezkerreko-aurikula', show: vis(t, P2[5], P2[6]) },
    { id: 'septum-primum', p: 'septum-primum', show: vis(t, 0, P2[6] + 0.04) },
    { id: 'ostium-secunduma', p: 'ostium-secunduma', show: vis(t, 0, P2[1]) + vis(t, P2[4], P2[6] + 0.06) },
    { id: 'septum-secundum', p: 'septum-secundum', show: vis(t, P2[1] + 0.02, P2[6]) },
    { id: 'zulo-obala', p: 'zulo-obala', show: vis(t, P2[2] + 0.04) },
    { id: 'septum-spurium', p: 'septum-spurium', show: vis(t, P2[3] + 0.02, P2[4]) },
    { id: 'ezkerreko-zain-balbula', p: 'ezkerreko-zain-balbula', show: vis(t, P2[3] + 0.02, P2[4]) },
    { id: 'beheko-kaba-zaina', p: 'beheko-kaba-zaina', show: vis(t, P2[5], P2[6]), small: true },
    { id: 'zulo-obalaren-balbula', p: 'zulo-obalaren-balbula', show: vis(t, P2[6] + 0.06) },
  ];
  return (
    <ModelView
      model={atriaModel(s, flow)}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(_, asked) => (
        <>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P2[4]) * asked}>
            5. astea · eskuineko aurikulatik, trenkada aurrez aurre: atzea zure ezkerrean
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P2[4], P2[6]) * asked}>
            Aurretik, bi trenkadetara hurbilduta: septum secunduma eskuinean (zure ezkerrean), primuma ezkerrean
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P2[6]) * asked}>
            Ezkerreko aurikulatik (180° biratuta): septum primumaren beste aurpegia, atzea zure eskuinean
          </Note>
          {Steps({ t, steps: STEPS2, y: 630 })}
        </>
      )}
    />
  );
}

// ———————————————————————————— 11:jaiotza ————————————————————————————

export function Birth3D({ t }: SceneProps) {
  const k = birthStage(t);
  const s: AtriaState = {
    ...AT0,
    primum: 0.82,
    cushions: 1,
    cushionFuse: 1,
    os2: 1,
    closeOP: 1,
    secundum: 1,
    spurium: 1,
    stub: 1,
    press: k.press,
    fuse: k.fuse,
    patent: k.patent,
    pulmonary: 1,
    adult: true,
  };
  const born = k.born ? 1 : 0;
  const flow: AtriaFlow = {
    phase: t,
    low: 0,
    high: k.born ? 1 - seg(k.press, 0.2, 0.75) : 1,
    down: 1,
    born: born * Math.min(1, 0.25 + k.laFill),
    slit: k.patent ? seg(t, P3[5] + 0.04, P3[5] + 0.08) : 0,
  };
  const camera = cameraAt(t, [
    [0, CAM.front],
    // The pulmonary veins fill the left atrium.
    [P3[1], CAM.leftBack],
    // Its pressure on the valve: close to the two septa from the front and the left, the valve's left face
    // against septum secundum.
    [P3[3], orbit(30, 10, 4.4, [-0.08, -0.2, -0.14])],
    // The seam along the valve's upper edge, where they fuse (and where a slit may stay open).
    [P3[4], orbit(34, 12, 3, [-0.08, 0.12, -0.17])],
    [P3[6], CAM.front],
  ]);
  const names: CalloutSpec[] = [
    { id: 'eskuineko-aurikula', p: 'eskuineko-aurikula', show: vis(t, 0, P3[1]) + vis(t, P3[6]) },
    // Close to the septa its wall is out of the picture: named again when the camera steps back.
    { id: 'ezkerreko-aurikula-jaiotakoan', p: 'ezkerreko-aurikula-jaiotakoan', show: vis(t, 0, P3[3]) + vis(t, P3[6]) },
    { id: 'birika-zainak', p: 'birika-zainak', show: vis(t, 0, P3[3]) + vis(t, P3[6]) },
    { id: 'septum-secundum', p: 'septum-secundum', show: vis(t, 0, P3[1]) + vis(t, P3[3]) },
    { id: 'zulo-obala', p: 'zulo-obala', show: vis(t, 0, P3[1]) + vis(t, P3[3]) },
    { id: 'zulo-obalaren-balbula', p: 'zulo-obalaren-balbula', show: vis(t, 0, P3[1]) + vis(t, P3[3]) },
    { id: 'beheko-kaba-zaina', p: 'beheko-kaba-zaina', show: vis(t, P3[6]), small: true },
  ];
  return (
    <ModelView
      model={atriaModel(s, flow)}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(at, asked) => (
        <>
          {/* The left atrium's pressure, pushing the valve towards the right atrium. */}
          <Trail pts={[[0.95, -0.25, -0.2], [0.55, -0.3, -0.18], [0.12, -0.38, -0.14]]} at={at} show={vis(t, P3[2] + 0.01, P3[4])} progress={seg(t, P3[2] + 0.01, P3[2] + 0.06)} color="#ffd27a" />
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P3[1]) * asked}>
            Jaiotza · bi aurikulak aurretik (eskuina zure ezkerrean): lau birika zainak ezkerrekoaren atzeko paretan
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P3[1], P3[3]) * asked}>
            Aurretik eta ezkerretik: ezkerreko aurikularen atzeko pareta, lau birika zainak
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P3[3], P3[6]) * asked}>
            Aurretik eta ezkerretik, bi trenkadetara hurbilduta: balbula (krema) septum secundumaren (arrosa) aurka
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P3[6]) * asked}>
            Aurretik: odol urdinak (gutxi oxigenatua) ezkerreko aurikulan nahasten dira
          </Note>
          {Steps({ t, steps: STEPS3, y: 630 })}
        </>
      )}
    />
  );
}
