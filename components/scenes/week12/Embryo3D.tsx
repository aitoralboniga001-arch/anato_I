'use client';

import { Note, type SceneProps } from '@/components/kit';
import { Loading3D } from '@/components/kit/three/Stage3D';
import { ModelView } from '@/components/scenes/week10/Heart3D';
import { seg } from '@/lib/sim/anim';
import { EMBRYO5 } from '@/lib/three-d/embryo5';
import { useGeoReady } from '@/lib/three-d/offthread';
import { EC, EP0, embryoModel, type EmbryoPose } from './embryo-model';
import { ColourKey, cameraAt, orbit, vis, type CalloutSpec } from './common';
import { S11 } from './Trunk3D';

/**
 * Topic 12 in the 5-week embryo (embryo-model): the notes' first figure (stage 1, the circulation of the
 * embryo) and the figure of the ventral branches (stage 11: the vitelline arteries becoming the
 * coeliac trunk and the two mesenteric arteries). The body is the week-5 embryo of every topic, as glass.
 */

const CONT_E = 'enbrioia-12';

// ———————————————————————————— stage 1: the embryo's circulation (notes 1) ————————————————————————————

export const S1 = [0, 0.16, 0.32, 0.5, 0.68, 0.84] as const;

/** Exported for the anchor audit (tests/anchors3d.test.ts), which calls it without the geometry gate. */
export function IntroView({ t }: SceneProps) {
  const bars = seg(t, S1[4] + 0.02, S1[4] + 0.08);
  const pose: EmbryoPose = { ...EP0, arches: [0.15, 0.4, 1, 1, 0, 0.7] };
  const flow = vis(t, S1[3] + 0.01, S1[4] + 0.02) + 0.35 * vis(t, 0, S1[1]);
  const camera = cameraAt(t, [
    [0, orbit(84, 6, 17.5, [0, 0.1, 0.1], [30, 0])],
    [S1[1], orbit(60, 4, 8.5, [0, 1.4, -0.1], [30, 0])],
    [S1[2], orbit(78, -4, 9, [0, 0.9, -0.2], [30, 0])],
    [S1[3], orbit(90, 4, 16, [0, -0.2, 0.2], [30, 0])],
    // In to the loop while the narration says the two bloods mix there, then out again for the whole way.
    [S1[3] + 0.065, orbit(86, 2, 4.8, [0, 1.0, 0.05], [30, 0])],
    [S1[3] + 0.125, orbit(90, 4, 16, [0, -0.2, 0.2], [30, 0])],
    [S1[4], orbit(62, 10, 8.5, [0, 2.1, 0.3], [30, 0])],
    [S1[5], orbit(40, 14, 6.5, [0, 2.2, 0.4], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'bihotz-lakioa', p: 'bihotz-lakioa', show: vis(t, 0, S1[1]) + vis(t, S1[3], S1[4]) },
    { id: 'aorta-arkuak', p: 'aorta-arkuakL', show: vis(t, 0, S1[1]) + vis(t, S1[5]) },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalakL', show: vis(t, 0, S1[1]) + vis(t, S1[3], S1[4]) },
    // Out of the frame while the camera is in at the loop (step 4's close-up on the mixing).
    { id: 'zilbor-arteriak', p: 'zilbor-arteriak', show: vis(t, 0, S1[1]) + vis(t, S1[3], S1[3] + 0.06) + vis(t, S1[3] + 0.13, S1[4]) },
    { id: 'bitelo-arteriak', p: 'bitelo-arteriak', show: vis(t, 0, S1[1]), small: true },
    { id: 'atal-bulbarra', p: 'atal-bulbarra', show: vis(t, S1[1], S1[2]), text: 'Alde bulbarra' },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, S1[1], S1[2]), text: 'Arteria enborra', sub: '(arteria bulboa)' },
    { id: 'zain-sinua', p: 'zain-sinua', show: vis(t, S1[2], S1[4]) },
    { id: 'bitelo-zainak', p: 'bitelo-zainak', show: vis(t, S1[2], S1[4]) },
    { id: 'zilbor-zainak', p: 'zilbor-zainak', show: vis(t, S1[2], S1[4]) },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna', show: vis(t, S1[2], S1[4]) },
    { id: 'aurreko-bena-kardinalak', p: 'aurreko-bena-kardinalak', show: vis(t, S1[2], S1[3]), small: true },
    { id: 'atzeko-bena-kardinalak', p: 'atzeko-bena-kardinalak', show: vis(t, S1[2], S1[3]), small: true },
    { id: 'faringe-arkuak', p: 'faringe-arkuak', show: vis(t, S1[4] + 0.04) },
    { id: 'bitelo-zaku-sekundarioa', p: 'bitelo-zaku-sekundarioa', show: vis(t, 0, S1[1]), small: true, text: 'Bitelo zakua' },
  ];
  return (
    <ModelView
      model={embryoModel(pose, { flow: { phase: t * 30, show: flow }, bars })}
      continuity={CONT_E}
      camera={camera}
      names={names}
      caption="4.–5. asteak · enbrioiaren zirkulazio sistema (3D eredua)"
      over={() => (
        <>
          <ColourKey items={[{ color: EC.artery, text: 'odol oxigenatua' }, { color: EC.vein, text: 'oxigeno gutxikoa' }]} show={1} title="Kolorea = odola" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S1[1])}>
            Arteriak: bihotzetik gorputzeko beste ataletara odola eramaten duten odol-hodiak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[1], S1[2])}>
            Alde bulbarraren urrutiko atala (arteria enborra, arteria bulboa) → birika enborra eta aorta
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[2], S1[3])}>
            Zain muturrean zain sinua: bitelo zainak, zilborreko zainak eta kardinal komunak (bi aldeetatik)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[3], S1[4])}>
            Zilborreko zainetako odola oxigenatua · bitelo eta kardinal zainetakoa oxigeno gutxikoa · bihotz lakioan nahasten dira
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[4], S1[5])}>
            5. astean, lepoan, faringe arkuak (mesodermoa): 6 bikote
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[5], 2)}>
            Faringe arku bakoitzak bere arteria: aorta arkua
          </Note>
        </>
      )}
    />
  );
}

/** The views wait (without freezing the page) until the embryo's body has been built off the main thread. */
export function Intro3D(props: SceneProps) {
  return useGeoReady([EMBRYO5]) ? <IntroView {...props} /> : <Loading3D />;
}
Intro3D.geo = ['embryo5'];

// ———————————————————————————— stage 11: the ventral branches in the embryo (notes 2.5–2.5.1) ————————————————————————————

export function VentralView({ t }: SceneProps) {
  const reduce = seg(t, S11[2] + 0.03, S11[2] + 0.11);
  const pose: EmbryoPose = { ...EP0, arches: [0, 0, 1, 1, 0, 1], reduce, veins: 0.35, cardinal: 0.25 };
  const camera = cameraAt(t, [
    [0, orbit(84, 6, 17, [0, 0.0, 0.1], [30, 0])],
    [0.04, orbit(70, -6, 11, [0, -1.0, 0.6], [30, 0]), 0.08],
    [S11[1], orbit(80, 2, 10, [0, -0.2, -0.6], [30, 0])],
    [S11[2], orbit(86, 4, 10, [0, -0.2, -0.6], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'zilbor-arteriak', p: 'zilbor-arteriak', show: vis(t, 0.04, S11[1]) },
    { id: 'aorta-dortsalak', p: 'aorta-dortsal-bakarra', show: vis(t, 0, S11[2] + 0.08), text: 'Aorta dortsala (fusionatuta)', small: true },
    { id: 'bitelo-arteriak', p: 'bitelo-arteriak', show: vis(t, S11[1], S11[2] + 0.06) },
    { id: 'bitelo-zaku-sekundarioa', p: 'bitelo-zaku-sekundarioa', show: vis(t, S11[1], S11[3]), small: true, text: 'Bitelo zakua' },
    { id: 'enbor-zeliakoa', p: 'enbor-zeliakoa', show: vis(t, S11[2] + 0.08) },
    { id: 'goiko-arteria-mesenterikoa', p: 'goiko-arteria-mesenterikoa', show: vis(t, S11[2] + 0.08) },
    { id: 'beheko-arteria-mesenterikoa', p: 'beheko-arteria-mesenterikoa', show: vis(t, S11[2] + 0.08) },
    { id: 'urdaila', p: 'urdaila', show: vis(t, S11[2] + 0.08), small: true },
    { id: 'erdiko-hestea', p: 'erdiko-hestea', show: vis(t, S11[2] + 0.08), small: true },
    { id: 'atzeko-hestea', p: 'atzeko-hestea', show: vis(t, S11[2] + 0.08), small: true },
  ];
  return (
    <ModelView
      model={embryoModel(pose, { flow: { phase: t * 30, show: vis(t, 0.04, S11[1]) } })}
      continuity={CONT_E}
      camera={camera}
      names={names}
      caption={t < S11[2] + 0.05 ? '5. astea · enbrioia ezkerretik: aortaren aurreko adarrak' : 'Bitelo arteriak → enbor zeliakoa eta bi arteria mesenterikoak'}
      over={() => (
        <>
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S11[1])}>
            Aorta dortsalak fusionatuta · abdomen mailan, aortaren aurreko paretatik zilborreko bi arteria: oxigeno gutxiko odola karenara
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S11[1], S11[2])}>
            Hasieran aurreko adarrak bitelo arteriak dira, bitelo plexuetatik
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S11[2], 2)}>
            Bitelo zakua endekatzean bitelo arteriak ere bai: enbor zeliakoa, goiko eta beheko arteria mesenterikoak
          </Note>
        </>
      )}
    />
  );
}

export function Ventral3D(props: SceneProps) {
  return useGeoReady([EMBRYO5]) ? <VentralView {...props} /> : <Loading3D />;
}
Ventral3D.geo = ['embryo5'];
