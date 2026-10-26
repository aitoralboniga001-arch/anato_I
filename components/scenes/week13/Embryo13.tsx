'use client';

import { Note, type SceneProps } from '@/components/kit';
import { Loading3D } from '@/components/kit/three/Stage3D';
import { ModelView } from '@/components/scenes/week10/Heart3D';
import { EC, EP0, embryoModel, type EmbryoPose } from '@/components/scenes/week12/embryo-model';
import { EMBRYO5 } from '@/lib/three-d/embryo5';
import { useGeoReady } from '@/lib/three-d/offthread';
import { ColourKey, cameraAt, orbit, vis, type CalloutSpec } from './common';

/**
 * Topic 13, stage 1 (notes 1, the notes' first figure): the 5-week embryo of every topic, as glass, with the
 * three pairs of veins that reach the sinus venosus — vitelline (from the yolk sac), umbilical (from the
 * placenta) and cardinal (anterior + posterior → common) — and the blood mixing in the sinus venosus.
 */

const CONT_E = 'enbrioia-13';

export const S1 = [0, 0.18, 0.38, 0.58, 0.78] as const;

export function IntroView({ t }: SceneProps) {
  const pose: EmbryoPose = { ...EP0, arches: [0.15, 0.4, 1, 1, 0, 0.7], vitelline: 0.35, interseg: 0 };
  const flow = vis(t, 0.02, S1[1]) + vis(t, S1[1]) * 0.85;
  const camera = cameraAt(t, [
    [0, orbit(84, 6, 17.5, [0, 0.1, 0.1], [30, 0])],
    [S1[1], orbit(62, -8, 12, [0, -1.3, 0.8], [30, 0]), 0.06],
    [S1[2], orbit(100, -2, 12, [0, -1.1, 0.7], [30, 0]), 0.06],
    [S1[3], orbit(128, 8, 14, [0, 0.4, -0.4], [30, 0]), 0.06],
    [S1[4], orbit(70, 6, 7.5, [0, 0.0, 0.3], [30, 0]), 0.06],
  ]);
  const names: CalloutSpec[] = [
    { id: 'zain-sinua', p: 'zain-sinua', show: vis(t, 0, S1[1]) + vis(t, S1[4]) },
    { id: 'bitelo-zainak', p: 'bitelo-zainak', show: vis(t, 0, S1[2]) },
    { id: 'zilbor-zainak', p: 'zilbor-zainak', show: vis(t, 0, S1[1]) + vis(t, S1[2], S1[3]) },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna', show: vis(t, 0, S1[1]) + vis(t, S1[3]) },
    { id: 'bitelo-zaku-sekundarioa', p: 'bitelo-zaku-sekundarioa', show: vis(t, S1[1], S1[2]), text: 'Bitelo zakua', small: true },
    { id: 'aurreko-bena-kardinalak', p: 'aurreko-bena-kardinalak', show: vis(t, S1[3], S1[4]), text: 'Aurreko kardinalak' },
    { id: 'atzeko-bena-kardinalak', p: 'atzeko-bena-kardinalak', show: vis(t, S1[3], S1[4]), text: 'Atzeko kardinalak' },
    { id: 'bihotz-lakioa', p: 'bihotz-lakioa', show: vis(t, S1[4]), small: true },
  ];
  return (
    <ModelView
      model={embryoModel(pose, { flow: { phase: t * 30, show: Math.min(1, flow) } })}
      continuity={CONT_E}
      camera={camera}
      names={names}
      caption="5. astea · zain sinura heltzen diren zainak (3D eredua, ezkerretik)"
      over={() => (
        <>
          <ColourKey items={[{ color: EC.umbVein, text: 'odol oxigenatua' }, { color: EC.vein, text: 'oxigeno gutxikoa' }]} show={1} title="Kolorea = odola" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S1[1])}>
            5. astean hiru zain mota heltzen dira zain sinura, denak bikoitzak (eskuinekoa eta ezkerrekoa)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[1], S1[2])}>
            Zain bitelinoak (onfalomesenterikoak): bitelo zakutik, oxigeno gutxiko odola
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[2], S1[3])}>
            Zilborreko zainak: karenatik, odol oxigenatua
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[3], S1[4])}>
            Aurreko kardinalak (alde zefalikotik) + atzeko kardinalak (alde kaudaletik) → kardinal komuna; oxigeno gutxiko odola
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[4], 2)}>
            Zain bakoitza bere aldeko luzapenera; zain sinuan odol oxigenatua eta oxigeno gutxikoa nahasten dira
          </Note>
        </>
      )}
    />
  );
}

export function Intro13(props: SceneProps) {
  return useGeoReady([EMBRYO5]) ? <IntroView {...props} /> : <Loading3D />;
}
Intro13.geo = ['embryo5'];
