'use client';

import { Note, type SceneProps } from '@/components/kit';
import { seg } from '@/lib/sim/anim';
import { ADULT, type ArtPose } from './arteries3d';
import { ArtView, ColourKey, ORIGIN_KEY, cameraAt, orbit, vis, type CalloutSpec } from './common';

/**
 * Topic 12, stage 10 (notes 2.3.4 p11, 2.4 p14–p21): the adult aorta and its branches, drawn by blood
 * first (red, the pulmonary arteries blue), then by origin: the colours come back and the whole system
 * winds back to the embryo's arches and forward again, so every adult piece is seen arriving from its arch.
 */

export const S10 = [0, 0.1, 0.22, 0.34, 0.48, 0.62, 0.76, 0.88] as const;

export function Adult3D({ t }: SceneProps) {
  const colour = seg(t, S10[7] + 0.002, S10[7] + 0.012);
  const rewind = seg(t, S10[7] + 0.012, S10[7] + 0.03);
  const forward = seg(t, S10[7] + 0.055, S10[7] + 0.08);
  const descend = 1 - rewind + rewind * forward;
  const pose: ArtPose = { ...ADULT, colour, descend, ductCar: descend, rLow: descend, r6dist: descend, gone5: 1 };
  const camera = cameraAt(t, [
    [0, orbit(18, 8, 16.5, [0, -0.6, 0.1], [30, 0])],
    [S10[1], orbit(-30, 6, 9.5, [-0.1, -1.6, 0.6], [30, 0])],
    [S10[2], orbit(-12, 22, 9, [0, -0.5, 0.3], [30, 0])],
    [S10[3], orbit(62, 10, 13, [0.3, -1.6, -0.3], [30, 0]), 0.06],
    [S10[4], orbit(-40, 12, 10, [-0.6, 0.3, 0.3], [30, 0]), 0.07],
    [S10[5], orbit(38, 12, 10, [0.5, 0.0, 0.2], [30, 0]), 0.06],
    [S10[6], orbit(8, 18, 9, [0.1, -1.4, 0.5], [30, 0])],
    [S10[7], orbit(24, 8, 15, [0, 0.8, 0.1], [30, 0])],
  ]);
  const adult = descend > 0.5;
  const names: CalloutSpec[] = [
    { id: 'aorta', p: 'goranzko-aorta', show: vis(t, 0, S10[1]), text: 'Aorta' },
    { id: 'goranzko-aorta', p: 'goranzko-aorta', show: vis(t, S10[1]) * (adult ? 1 : 0) },
    { id: 'aortaren-makoa', p: 'aortaren-makoa', show: vis(t, S10[2]) * (adult ? 1 : 0) },
    { id: 'beheranzko-aorta', p: 'beheranzko-aorta', show: vis(t, S10[3]) * (adult ? 1 : 0) },
    { id: 'enbor-brakiozefalikoa', p: 'enbor-brakiozefalikoa', show: vis(t, S10[4]) * (adult ? 1 : 0) },
    { id: 'eskuineko-subklabioa', p: 'eskuineko-subklabioa', show: vis(t, S10[4]) * (adult ? 1 : 0) },
    { id: 'karotida-komuna', p: 'karotida-komunaR', show: (vis(t, S10[4] + 0.06, S10[5]) + vis(t, S10[7] + 0.085)) * (adult ? 1 : 0), text: 'Eskuineko karotida komuna', key: 'cca:R' },
    { id: 'karotida-komuna', p: 'karotida-komunaL', show: (vis(t, S10[5] + 0.05, S10[6]) + vis(t, S10[7] + 0.085)) * (adult ? 1 : 0), text: 'Ezkerreko karotida komuna', key: 'cca:L' },
    { id: 'ezkerreko-subklabioa', p: 'ezkerreko-subklabioa', show: vis(t, S10[5]) * (adult ? 1 : 0) },
    { id: 'birika-arteria', p: 'birika-arteria', show: vis(t, S10[6]) * (adult ? 1 : 0), text: 'Birika enborra' },
    { id: 'eskuineko-birika-arteria', p: 'eskuineko-birika-arteria', show: vis(t, S10[6]) * (adult ? 1 : 0) },
    { id: 'ezkerreko-birika-arteria', p: 'ezkerreko-birika-arteria', show: vis(t, S10[6]) * (adult ? 1 : 0) },
    { id: 'bihotza', p: 'bihotza', show: vis(t, 0, S10[2]), small: true },
    // Winding back: the arches named by origin.
    { id: 'hirugarren-aorta-arkua', p: 'hirugarren-aorta-arkuaL', show: adult ? 0 : 1, small: true },
    { id: 'laugarren-aorta-arkua', p: 'laugarren-aorta-arkuaL', show: adult ? 0 : 1, small: true },
    { id: 'seigarren-aorta-arkua', p: 'seigarren-aorta-arkuaL', show: adult ? 0 : 1, small: true },
    { id: 'aorta-zakua', p: 'aorta-zakua', show: adult ? 0 : 1, small: true },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 1, heartColour: 0, lungs: 0.45, ghosts: 0 }}
      camera={camera}
      names={names}
      caption={t < S10[7] ? 'Heldua · aorta eta haren adarrak (odolaren kolorea)' : adult ? 'Heldua · kolorea = jatorria' : 'Atzera: 29. eguneko arkuak (kolore bera)'}
      over={() => (
        <>
          <ColourKey items={ORIGIN_KEY} show={colour} />
          <ColourKey items={[{ color: '#e5484d', text: 'odol oxigenatua' }, { color: '#3b82f6', text: 'oxigeno gutxikoa' }]} show={1 - colour} title="Kolorea = odola" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S10[1])}>
            Ezkerreko bentrikulutik aorta irteten da: goranzko aorta, makoa eta beheranzko aorta
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S10[1], S10[2])}>
            Goranzko aorta: hurbileko atala, enbor arteriosotik
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S10[2], S10[3])}>
            Aortaren makoa: hasierako zatia aorta zakuaren ezkerreko luzapenetik
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S10[3], S10[4])}>
            Beheranzko aorta: toraxetik jaitsi, diafragma zeharkatu eta abdomenera
          </Note>
          <Note x={500} y={612} tone="warn" show={vis(t, S10[4], S10[5])}>
            Lehen adarra: arteria brakiozefalikoa (bakarra!) → eskuineko karotida komuna + eskuineko subklabioa
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S10[5], S10[6])}>
            Ezkerrean ez dago enbor komunik: ezkerreko karotida komuna eta subklabioa makotik zuzenean
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S10[6], S10[7])}>
            Eskuineko bentrikulutik birika enborra: eskuineko eta ezkerreko birika arteriak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S10[7], 2)}>
            Atal bakoitzak bere arkuaren kolorea gordetzen du: zakua, 3., 4., 6. arkuak, aorta dortsalak, 7. segmentu arteko arteriak
          </Note>
        </>
      )}
    />
  );
}
