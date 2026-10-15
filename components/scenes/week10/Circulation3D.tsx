'use client';

import { Note, type SceneProps } from '@/components/kit';
import { seg } from '@/lib/sim/anim';
import type { V3 } from '@/lib/three-d/math';
import { vis } from './common';
import { S3 } from './Circulation';
import { HeartView, Trail, cameraAt, orbit, type CalloutSpec } from './Heart3D';
import { POSE0, caudal, centreline, type HeartOpts, type HeartPose } from './model3d';

/**
 * 10:zirkulazio-goiztiarra `3d` — the same straight heart tube as stage 4 (model3d), from the front, with
 * the vessels of both sides: what the side view cannot show. Step 3: the arterial end (arterial bulb,
 * aortic sac, arches to the dorsal aortas), the segments named top to bottom, then the camera drops to
 * look up at the sinus venosus and its two horns, each taking its three veins. Step 11: the walls turn
 * to glass and the blood of the three veins meets in the atrium (red and blue cells side by side).
 */

export function CirculationFront({ t }: SceneProps) {
  const a = S3[2];
  const cBulb = seg(t, a + 0.015, a + 0.03);
  const cVent = seg(t, a + 0.045, a + 0.055);
  const cAtr = seg(t, a + 0.055, a + 0.065);
  const cSin = seg(t, a + 0.065, a + 0.075);
  const mix = vis(t, S3[10]);
  const pose: HeartPose = {
    ...POSE0,
    segs: 0.6,
    colour: 0,
    colourBy: { bulbus: cBulb, ventricle: cVent, atrium: cAtr, sinus: cSin },
    arches: 2,
    veins: 1,
    glass: 0.85 * seg(t, S3[10], S3[10] + 0.02),
  };
  const opts: HeartOpts = {
    cavity: 0.7,
    septum: 1,
    gut: 0.45,
    aortas: 1,
    flow: mix > 0 ? { phase: t * 26, show: mix, mixed: true } : null,
  };
  const camera = cameraAt(t, [
    [0, orbit(8, 6, 12.2, [0, -0.15, -0.2], [40, 4])],
    [a + 0.08, orbit(4, -30, 11.4, [0, -0.9, -0.2], [40, 0])],
    [S3[10] - 0.01, orbit(14, 4, 8.4, [0, -1.05, -0.1], [30, 0])],
    [S3[10] + 0.04, orbit(0, 8, 14.5, [0, -0.45, -0.5], [30, 4])],
  ]);
  const early = vis(t, 0, S3[3]);
  const late = vis(t, S3[10]);
  const horns = vis(t, a + 0.06, S3[3]);
  const names: CalloutSpec[] = [
    { id: 'arteria-muturra', p: 'aorta-zakua', show: early },
    { id: 'aorta-arkuak', p: 'aorta-arkuak1', show: early },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalak1', show: vis(t, 0, a + 0.03) + late, small: true, key: 'aorta-dortsalak:l' },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalak-1', show: late, small: true, key: 'aorta-dortsalak:r' },
    { id: 'atal-bulbarra', p: 'atal-bulbarra', show: cBulb * early },
    { id: 'aorta-zakua', p: 'aorta-zakua', show: vis(t, a + 0.03, S3[3]) },
    { id: 'atal-bentrikularra', p: 'atal-bentrikularra', show: cVent * early },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: cAtr * early + late },
    { id: 'zain-sinua', p: 'zain-sinua', show: cSin * early + late },
    { id: 'eskuineko-sinu-luzapena', p: 'eskuineko-sinu-luzapena', show: horns, text: 'Zain sinuaren eskuineko adarra' },
    { id: 'ezkerreko-sinu-luzapena', p: 'ezkerreko-sinu-luzapena', show: horns, text: 'Zain sinuaren ezkerreko adarra' },
    { id: 'zilbor-zainak', p: 'zilbor-zainak0', show: late, small: true, key: 'zilbor-zainak:r' },
    { id: 'zilbor-zainak', p: 'zilbor-zainak1', show: late, small: true, key: 'zilbor-zainak:l' },
    { id: 'bitelo-zainak', p: 'bitelo-zainak0', show: late, small: true, key: 'bitelo-zainak:r' },
    { id: 'bitelo-zainak', p: 'bitelo-zainak1', show: late, small: true, key: 'bitelo-zainak:l' },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna0', show: late, small: true, key: 'bena-kardinal-komuna:r' },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna1', show: late, small: true, key: 'bena-kardinal-komuna:l' },
  ];
  return (
    <HeartView
      pose={pose}
      opts={opts}
      camera={camera}
      names={names}
      caption="4. astea · bihotz hodia eta haren hodiak aurretik (3D)"
      over={(at) => {
        const line = centreline(pose, 60);
        const cd = caudal(pose, line);
        // The arterial way out (p24): aortic sac → first arch → dorsal aorta, on the embryo's left.
        const out: V3[] = [line[0], [0.22, line[0][1] + 0.4, line[0][2] - 0.05], [0.38, line[0][1] + 0.5, -0.55], [0.4, line[0][1] + 0.4, -1.12], [0.42, line[0][1] + 0.1, -1.4], [0.42, -0.6, -1.42]];
        // The venous way in (p23, p36): a horn → the atrium.
        const inn: V3[] = [cd.horn[1], cd.sinusIn[1], cd.atrium[1], cd.end];
        return (
          <>
            <Trail pts={out} at={at} show={vis(t, a + 0.005, a + 0.045) * 0.9} progress={seg(t, a + 0.005, a + 0.03)} color="#ff8a8a" />
            <Trail pts={inn} at={at} show={vis(t, S3[10] + 0.005, 2) * 0.85} progress={seg(t, S3[10] + 0.005, S3[10] + 0.025)} color="#ffd27a" />
            <Note x={500} y={612} tone="accent" show={vis(t, 0, a + 0.045)}>
              Arteria muturra: aorta zakutik arku aortikoetara, eta handik aorta dortsaletara
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, a + 0.045, a + 0.08)}>
              Aorta zakua → bentrikulua → aurikula → zain sinua
            </Note>
            <Note x={500} y={612} tone="accent" show={horns}>
              Zain sinuak bi adar: bakoitzera hiru zain (aurretik: enbrioiaren eskuina zure ezkerrean)
            </Note>
            <Note x={500} y={612} tone="accent" show={late}>
              Atrio primitiboan odolak nahasten dira: zelula gorriak eta urdinak elkarren ondoan · hodi guztiak bikoitiak
            </Note>
          </>
        );
      }}
    />
  );
}
