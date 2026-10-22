'use client';

import { Note, type SceneProps } from '@/components/kit';
import { seg } from '@/lib/sim/anim';
import type { V3 } from '@/lib/three-d/math';
import { AP0, leftOrigins, type ArtPose } from './arteries3d';
import { ArtView, ColourKey, ORIGIN_KEY, Trail, cameraAt, orbit, vis, type CalloutSpec } from './common';

/**
 * Topic 12, stages 2–9 (notes 2–2.4): the arch system in 3D, one model (arteries3d), one camera per step
 * gliding between them. Axes: x = the embryo's left, y cranial, z ventral; yaw 0 = from the front
 * (the embryo's left on the viewer's right), +90 = from the embryo's left side.
 */

const g6 = (a: number, b: number, c: number, d: number, e: number, f: number) => [a, b, c, d, e, f] as const;
/** Both sides' names of one structure (x < 0 is the embryo's right). */
const both = (id: string, p: string, show: number, more: Partial<CalloutSpec> = {}): CalloutSpec[] => [
  { id, p: `${p}R`, show, ...more, key: `${id}:R` },
  { id, p: `${p}L`, show, ...more, key: `${id}:L` },
];

// ———————————————————————————— stage 2: the arch system (notes 2) ————————————————————————————

export const S2 = [0, 0.17, 0.34, 0.6, 0.82] as const;

export function ArchSystem3D({ t }: SceneProps) {
  const a1 = seg(t, S2[1] + 0.02, S2[1] + 0.1);
  const grow = (k: number) => seg(t, S2[2] + 0.015 + k * 0.035, S2[2] + 0.05 + k * 0.035);
  const fuse = seg(t, S2[3] + 0.03, S2[3] + 0.14);
  const pose: ArtPose = { ...AP0, grow: g6(a1, grow(0), grow(1), grow(2), grow(3) * 0.8, grow(4)), fuse, is7: 0, pulm: 0 };
  const camera = cameraAt(t, [
    [0, orbit(22, 10, 14, [0, 0.55, 0.2], [30, 0])],
    [S2[1], orbit(48, 8, 11, [0, 2.4, 0.1], [30, 0])],
    [S2[2], orbit(32, 12, 11.5, [0, 2.2, 0.1], [30, 0])],
    [S2[3], orbit(12, 6, 16, [0, -1.6, -0.4], [30, 0]), 0.05],
    [S2[4], orbit(30, 10, 12.5, [0, 1.6, 0.1], [30, 0]), 0.05],
  ]);
  const archesOn = vis(t, S2[2] + 0.02);
  const names: CalloutSpec[] = [
    { id: 'aorta-zakua', p: 'aorta-zakua', show: 1 },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, 0, S2[3]) },
    ...both('aorta-dortsalak', 'aorta-dortsalak', 1, { small: true }),
    { id: 'lehen-aorta-arkua', p: 'lehen-aorta-arkuaL', show: vis(t, S2[1] + 0.03, S2[3]) + vis(t, S2[4] + 0.03), small: t > S2[2] },
    { id: 'bigarren-aorta-arkua', p: 'bigarren-aorta-arkuaL', show: archesOn * vis(t, S2[2] + 0.05, S2[3]), small: true },
    { id: 'hirugarren-aorta-arkua', p: 'hirugarren-aorta-arkuaL', show: vis(t, S2[2] + 0.08, S2[3]), small: true },
    { id: 'laugarren-aorta-arkua', p: 'laugarren-aorta-arkuaL', show: vis(t, S2[2] + 0.12, S2[3]), small: true },
    { id: 'bostgarren-aorta-arkua', p: 'bostgarren-aorta-arkuaL', show: vis(t, S2[2] + 0.16, S2[3]), small: true },
    { id: 'seigarren-aorta-arkua', p: 'seigarren-aorta-arkuaL', show: vis(t, S2[2] + 0.19, S2[3]), small: true },
    { id: 'aorta-arkuak', p: 'hirugarren-aorta-arkuaR', show: vis(t, S2[2] + 0.02, S2[3]) + vis(t, S2[4] + 0.03), text: 'Aorta arkuak (6 bikote)' },
    { id: 'beheranzko-aorta', p: 'aorta-dortsal-bakarra', show: vis(t, S2[3] + 0.08, S2[4]), text: 'Aorta dortsal bakarra' },
    { id: 'bihotza', p: 'bihotza', show: vis(t, 0, S2[1]), small: true },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 1, pharynx: 0.6, bars: 0, ghosts: 0, flow: { phase: t * 26, show: vis(t, S2[2] + 0.2, S2[3]) } }}
      camera={camera}
      names={names}
      caption={t < S2[3] ? '4. astea · aorta zakua, arkuak eta aorta dortsalak' : '4. astea · aorta dortsalak T4tik behera fusionatzen dira'}
      over={(at) => (
        <>
          <ColourKey items={ORIGIN_KEY.slice(0, 8)} show={vis(t, S2[2] + 0.02)} />
          <Note x={500} y={612} tone="accent" show={vis(t, S2[1], S2[2])}>
            Zeharkako tolespena: aorta dortsalak aorta zakuaren luzapenekin komunikatzen dira
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S2[2], S2[3])}>
            Komunikazio bakoitza aorta arku bat da: 6 bikote, bata bestearen ondoren
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S2[3], S2[4])}>
            T4tik behera bi aorta dortsalak bat egiten dute: aorta dortsal bakarra
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S2[4], 2)}>
            Alde zefalikoan (arkuen mailan) bi aorta dortsalak banatuta jarraitzen dute
          </Note>
          <Trail pts={zip(t)} at={at} show={vis(t, S2[3] + 0.02, S2[4]) * 0.9} progress={seg(t, S2[3] + 0.03, S2[3] + 0.14)} color="#ffd27a" />
        </>
      )}
    />
  );
}
/** The fusion runs from the tail end up to T4: drawn as an arrow beside the aorta. */
const zip = (_t: number): V3[] => Array.from({ length: 10 }, (_, i) => [0.62, -6.0 + (i / 9) * 4.9, -0.85] as V3);

// ———————————————————————————— stage 3: day 27 (notes 2.1) ————————————————————————————

export const S3 = [0, 0.15, 0.3, 0.46, 0.62, 0.78] as const;

export function Day27_3D({ t }: SceneProps) {
  const gone1 = seg(t, S3[1] + 0.03, S3[1] + 0.11);
  const gone2 = seg(t, S3[2] + 0.03, S3[2] + 0.11);
  const g4 = 0.35 + 0.65 * seg(t, S3[3] + 0.04, S3[3] + 0.1);
  const g5 = seg(t, S3[4] + 0.02, S3[4] + 0.05);
  const gone5 = seg(t, S3[4] + 0.07, S3[4] + 0.12);
  const g6_ = 0.3 + 0.7 * seg(t, S3[5] + 0.01, S3[5] + 0.06);
  const pulm = seg(t, S3[5] + 0.06, S3[5] + 0.13);
  const pose: ArtPose = { ...AP0, grow: g6(1, 1, 0.75 + 0.25 * seg(t, S3[3], S3[3] + 0.05), g4, g5 * 0.8, g6_), gone1, gone2, gone5, pulm, is7: 0 };
  const camera = cameraAt(t, [
    [0, orbit(70, 8, 11.5, [0, 2.2, 0.1], [30, 0])],
    [S3[1], orbit(62, 12, 8.5, [0, 3.3, 0.2], [30, 0])],
    [S3[2], orbit(66, 10, 8.5, [0, 2.9, 0.2], [30, 0])],
    [S3[3], orbit(72, 8, 10, [0, 2.1, 0.1], [30, 0])],
    [S3[4], orbit(76, 8, 9, [0, 1.5, 0.1], [30, 0])],
    [S3[5], orbit(58, 10, 10.5, [0, 0.8, 0.2], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'faringe-arkuak', p: 'faringe-arkuak', show: vis(t, 0, S3[1]) },
    { id: 'aorta-arkuak', p: 'hirugarren-aorta-arkuaR', show: vis(t, 0, S3[1]), text: 'Aorta arkuak' },
    { id: 'lehen-aorta-arkua', p: 'lehen-aorta-arkuaL', show: vis(t, S3[1], S3[2]) },
    { id: 'arteria-maxilarra', p: 'arteria-maxilarraL', show: vis(t, S3[1] + 0.08, S3[4]) },
    { id: 'bigarren-aorta-arkua', p: 'bigarren-aorta-arkuaL', show: vis(t, S3[2], S3[3]) },
    { id: 'hioide-arteria', p: 'hioide-arteriaL', show: vis(t, S3[2] + 0.08), small: true },
    { id: 'ointokiko-arteria', p: 'ointokiko-arteriaL', show: vis(t, S3[2] + 0.08), small: true },
    { id: 'hirugarren-aorta-arkua', p: 'hirugarren-aorta-arkuaL', show: vis(t, S3[3]) },
    { id: 'laugarren-aorta-arkua', p: 'laugarren-aorta-arkuaL', show: vis(t, S3[3] + 0.03) },
    { id: 'bostgarren-aorta-arkua', p: 'bostgarren-aorta-arkuaL', show: vis(t, S3[4] + 0.02, S3[5]) },
    { id: 'seigarren-aorta-arkua', p: 'seigarren-aorta-arkuaL', show: vis(t, S3[5]) },
    { id: 'hasierako-birika-arteriak', p: 'hasierako-birika-arteriakL', show: vis(t, S3[5] + 0.08) },
    { id: 'birika-hastapenak', p: 'birika-hastapenak', show: vis(t, S3[5] + 0.08), small: true },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, S3[5] + 0.08), small: true },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalakL', show: 1, small: true },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 1, pharynx: 0.7, bars: 1 - 0.6 * seg(t, S3[1], S3[1] + 0.05), lungs: seg(t, S3[5], S3[5] + 0.05), ghosts: 1 }}
      camera={camera}
      names={names}
      caption="27. eguna (4 mm) · arkuak eta faringe arkuak"
      over={() => (
        <>
          <ColourKey items={ORIGIN_KEY.slice(0, 8)} show={1} />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S3[1])}>
            Aorta arkuak faringe (brankia) arkuekin batera sortzen dira
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S3[1], S3[2])}>
            1. arkua: poliki endekatzen da · hondarra: arteria maxilarrak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S3[2], S3[3])}>
            2. arkua: gauza bera · hondarra: hioide arteriak eta ointokiko arteriak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S3[3], S3[4])}>
            3. arkuak handiak dira · 4. bikotea agertzen hasten da
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S3[4], S3[5])}>
            5. arkua ez da guztiz garatzen: laster desagertzen da (askotan ez da agertzen)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S3[5], 2)}>
            6. arkua: adartxoak, hasierako birika arteriak, birika hastapenetara
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 4: day 29 (notes 2.2) ————————————————————————————

export const S4 = [0, 0.15, 0.32, 0.5, 0.66, 0.83] as const;
const DAY29: ArtPose = { ...AP0, grow: g6(1, 1, 1, 1, 0, 1), gone1: 1, gone2: 1, gone5: 0, is7: 0, pulm: 1 };

export function Day29_3D({ t }: SceneProps) {
  const size34 = seg(t, S4[1] + 0.02, S4[1] + 0.08);
  const g5 = seg(t, S4[1] + 0.07, S4[1] + 0.1);
  const gone5 = seg(t, S4[1] + 0.11, S4[1] + 0.16);
  const split = seg(t, S4[2] + 0.03, S4[2] + 0.13);
  const pose: ArtPose = { ...DAY29, grow: g6(1, 1, 1, 1, g5 * 0.8, 1), gone5, size34, split };
  const camera = cameraAt(t, [
    [0, orbit(64, 10, 9.5, [0, 3.2, 0.1], [30, 0])],
    [S4[1], orbit(40, 8, 10.5, [0, 1.9, 0.2], [30, 0])],
    [S4[2], orbit(14, 6, 10.5, [0, 0.4, 0.6], [30, 0])],
    [S4[3], orbit(6, 16, 9, [0, 1.0, 0.7], [30, 0])],
    [S4[4], orbit(30, 14, 8.5, [0.2, 1.1, 0.7], [30, 0])],
    [S4[5], orbit(-24, 14, 8.5, [-0.2, 1.1, 0.7], [30, 0])],
  ]);
  const horns = vis(t, S4[3]);
  const names: CalloutSpec[] = [
    { id: 'arteria-maxilarra', p: 'arteria-maxilarraL', show: vis(t, 0, S4[2]) },
    { id: 'hioide-arteria', p: 'hioide-arteriaL', show: vis(t, 0, S4[2]), small: true },
    { id: 'ointokiko-arteria', p: 'ointokiko-arteriaL', show: vis(t, 0, S4[2]), small: true },
    { id: 'hirugarren-aorta-arkua', p: 'hirugarren-aorta-arkuaL', show: vis(t, S4[1]) },
    { id: 'laugarren-aorta-arkua', p: 'laugarren-aorta-arkuaL', show: vis(t, S4[1]) },
    { id: 'bostgarren-aorta-arkua', p: 'bostgarren-aorta-arkuaL', show: vis(t, S4[1] + 0.06, S4[1] + 0.15), small: true },
    { id: 'seigarren-aorta-arkua', p: 'seigarren-aorta-arkuaL', show: vis(t, S4[2]) },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, S4[2], S4[2] + 0.1) },
    { id: 'goranzko-aorta', p: 'goranzko-aorta', show: vis(t, S4[2] + 0.1) },
    { id: 'birika-arteria', p: 'birika-arteria', show: vis(t, S4[2] + 0.1), text: 'Birika enborra' },
    { id: 'aorta-zakua', p: 'aorta-zakua', show: vis(t, S4[3]) },
    { id: 'aortaren-makoa', p: 'luzapenaL', show: vis(t, S4[4]), text: 'Aortaren makoa', sub: 'ezkerreko luzapena' },
    { id: 'enbor-brakiozefalikoa', p: 'luzapenaR', show: vis(t, S4[5]), text: 'A. brakiozefalikoa', sub: 'eskuineko luzapena' },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalakL', show: vis(t, 0, S4[2]), small: true },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 1, pharynx: 0.5, lungs: 0.7, ghosts: 1, flow: { phase: t * 26, show: vis(t, S4[2] + 0.12, S4[3]) } }}
      camera={camera}
      names={names}
      caption="29. eguna (10 mm) · arkuak eta aorta zakua"
      over={() => (
        <>
          <ColourKey items={ORIGIN_KEY.slice(0, 8)} show={1} />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S4[1])}>
            1. eta 2. arkuak guztiz desagertu dira: haien arteriak geratzen dira
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S4[1], S4[2])}>
            3. eta 4. arkuak handitzen dira · 5.a agertu eta ia guztiz desagertzen da
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S4[2], S4[3])}>
            Enbor arteriosoa trenkadatzen da: goranzko aorta eta birika enborra · 6. arkua birika enborrarekin
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S4[3], S4[4])}>
            Aorta zakua → goranzko aorta · haren bi luzapenetatik arteria berriak, ez simetrikoki
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S4[4], S4[5]) * horns}>
            Ezkerreko luzapena (lodiagoa) → aorta makoaren hasierako zatia
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S4[5], 2)}>
            Eskuineko luzapena (estuagoa) → arteria brakiozefalikoa: eskuineko karotida komuna + subklabioa
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 5: 1st–3rd arches (notes 2.3.1) ————————————————————————————

export const S5 = [0, 0.15, 0.3, 0.46, 0.64, 0.82] as const;

export function ThirdArch3D({ t }: SceneProps) {
  const gone1 = seg(t, 0.04, 0.11);
  const gone2 = seg(t, S5[1] + 0.03, S5[1] + 0.1);
  const eca = seg(t, S5[5] + 0.02, S5[5] + 0.1);
  const pose: ArtPose = { ...AP0, grow: g6(1, 1, 1, 1, 0, 1), gone1, gone2, gone5: 1, eca, split: 1, is7: 0, pulm: 1 };
  const camera = cameraAt(t, [
    [0, orbit(60, 12, 8.5, [0, 3.4, 0.2], [30, 0])],
    [S5[1], orbit(62, 10, 8.5, [0, 3.0, 0.2], [30, 0])],
    [S5[2], orbit(8, 10, 10, [0, 2.4, 0.3], [30, 0]), 0.05],
    [S5[3], orbit(30, 10, 9, [0, 2.4, 0.3], [30, 0])],
    [S5[4], orbit(62, 8, 9.5, [0, 3.0, 0.0], [30, 0])],
    [S5[5], orbit(30, 12, 8.5, [0, 2.9, 0.3], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'lehen-aorta-arkua', p: 'lehen-aorta-arkuaL', show: vis(t, 0, S5[1]) },
    { id: 'arteria-maxilarra', p: 'arteria-maxilarraL', show: vis(t, 0.08, S5[2]) },
    { id: 'bigarren-aorta-arkua', p: 'bigarren-aorta-arkuaL', show: vis(t, S5[1], S5[2]) },
    { id: 'hioide-arteria', p: 'hioide-arteriaL', show: vis(t, S5[1] + 0.07, S5[2]) },
    { id: 'ointokiko-arteria', p: 'ointokiko-arteriaL', show: vis(t, S5[1] + 0.07, S5[2]) },
    ...both('hirugarren-aorta-arkua', 'hirugarren-aorta-arkua', vis(t, S5[2], S5[3])),
    ...both('karotida-komuna', 'karotida-komuna', vis(t, S5[3])),
    ...both('barneko-karotida', 'barneko-karotida', vis(t, S5[3]), { text: 'Barneko karotida (hurbileko zatia)' }),
    { id: 'aorta-dortsalak', p: 'aorta-dortsalakL', show: vis(t, S5[4], S5[5]), small: true, text: 'Aorta dortsala' },
    { id: 'barneko-karotida', p: 'aorta-dortsalak-cranL', show: vis(t, S5[4] + 0.05), text: 'Barneko karotida (urrutiko atala)', key: 'barneko-karotida:dist' },
    ...both('kanpoko-karotida', 'kanpoko-karotida', vis(t, S5[5] + 0.05)),
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 0.6, pharynx: 0.5, ghosts: 1 }}
      camera={camera}
      names={names}
      caption="4.–7. asteak · lehen hiru arkuen garapena"
      over={() => (
        <>
          <ColourKey items={ORIGIN_KEY.slice(0, 8)} show={1} />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S5[1])}>
            1. eta 2. arkuak 28. egunean agertu, eta laster desagertzen dira · 1.etik: arteria maxilarrak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S5[1], S5[2])}>
            2. arkutik: hioide arteriak eta ointokiko arteriak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S5[2], S5[3])}>
            3. arkuak une berean garatzen dira, eta bi aldeetan berdin
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S5[3], S5[4])}>
            3. arkutik: karotida komunak, eta haietatik barneko karotiden hurbileko zatiak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S5[4], S5[5])}>
            Aorta dortsalen alde kranealetik: barneko karotiden urrutiko atala
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S5[5], 2)}>
            Kanpoko karotidak: karotida komunaren kimu bezala
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 6: 4th and 5th arches (notes 2.3.2–2.3.3) ————————————————————————————

export const S6 = [0, 0.14, 0.3, 0.48, 0.64, 0.82] as const;
const LATE: ArtPose = { ...AP0, grow: g6(1, 1, 1, 1, 1, 1), gone1: 1, gone2: 1, gone5: 1, eca: 1, split: 1, pulm: 1 };

export function FourthArch3D({ t }: SceneProps) {
  const g5 = seg(t, S6[5] - 0.02, S6[5] + 0.02);
  const gone5 = seg(t, S6[5] + 0.05, S6[5] + 0.11);
  const pose: ArtPose = { ...LATE, grow: g6(1, 1, 1, 1, Math.max(g5, 0) * 0.8, 1), gone5: t < S6[5] - 0.02 ? 1 : gone5 };
  const camera = cameraAt(t, [
    [0, orbit(10, 10, 10.5, [0, 1.3, 0.2], [30, 0])],
    [S6[1], orbit(55, 10, 9, [0.3, 1.4, 0.1], [30, 0])],
    [S6[2], orbit(80, 6, 10, [0.3, 0.9, -0.2], [30, 0])],
    [S6[3], orbit(-50, 10, 9, [-0.3, 1.4, 0.1], [30, 0]), 0.06],
    [S6[4], orbit(-80, 6, 10, [-0.3, 0.9, -0.2], [30, 0])],
    [S6[5], orbit(30, 10, 10, [0, 1.4, 0.1], [30, 0]), 0.05],
  ]);
  const L4 = vis(t, S6[1], S6[3]);
  const R4 = vis(t, S6[3], S6[5]);
  const o = leftOrigins(0);
  const names: CalloutSpec[] = [
    ...both('laugarren-aorta-arkua', 'laugarren-aorta-arkua', vis(t, 0, S6[1])),
    { id: 'makoaren-urrutiko-atala', p: 'laugarren-aorta-arkuaL', show: L4, text: 'Ezk. 4. arkua → aorta makoaren urrutiko atala' },
    { id: 'karotida-komuna', p: 'karotida-komunaL', show: L4, small: true, key: 'karotida-komuna:L' },
    { id: 'ezkerreko-subklabioa', p: 'zazpigarren-segmentu-arteko-arteriaL', show: vis(t, S6[2], S6[3]), text: 'Ezk. 7. segmentu arteko a. → ezkerreko subklabioa' },
    { id: 'eskuineko-subklabioa', p: 'laugarren-aorta-arkuaR', show: R4, text: 'Eskuineko subklabioa: hasierako atala (4. arkua)' },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalakR', show: vis(t, S6[4], S6[5]), text: 'Bitarteko atala (eskuineko aorta dortsala)' },
    { id: 'zazpigarren-segmentu-arteko-arteria', p: 'zazpigarren-segmentu-arteko-arteriaR', show: vis(t, S6[4], S6[5]), text: 'Urrutiko atala (eskuineko 7. segmentu arteko a.)' },
    ...both('bostgarren-aorta-arkua', 'bostgarren-aorta-arkua', vis(t, S6[5], S6[5] + 0.1), { small: true }),
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 0.5, pharynx: 0.35, ghosts: 1 }}
      camera={camera}
      names={names}
      caption="5.–7. asteak · 4. eta 5. arkuak"
      over={(at) => (
        <>
          <ColourKey items={ORIGIN_KEY} show={1} />
          <Trail pts={[o.subclavian, [0.6, 0.6, -0.55], [0.55, 1.0, -0.2], [0.42, 1.3, 0.3]] as V3[]} at={at} show={vis(t, S6[2] + 0.04, S6[3]) * 0.9} progress={seg(t, S6[2] + 0.05, S6[2] + 0.12)} color="#5eead4" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S6[1])}>
            Ezkerreko eta eskuineko 4. arkuek garapen desberdina dute
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S6[1], S6[2])}>
            Ezkerreko 4. arkua → aorta makoaren urrutiko atala (ezk. karotida komunaren eta ezk. subklabioaren artean)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S6[2], S6[3])}>
            Ezkerreko subklabioa ezk. 7. segmentu arteko arteriatik · gero askoz gorago kokatzen da
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S6[3], S6[4])}>
            Eskuineko 4. arkua → eskuineko subklabioaren hasierako (hurbileko) atala
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S6[4], S6[5])}>
            Eskuineko subklabioa: 4. arkua + eskuineko aorta dortsala + eskuineko 7. segmentu arteko arteria
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S6[5], 2)}>
            5. arkuak guztiz desagertzen dira: ez dute ezer sortzen
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 7: the 6th arches (notes 2.3.4) ————————————————————————————

export const S7 = [0, 0.22, 0.46, 0.7] as const;

export function SixthArch3D({ t }: SceneProps) {
  const pulm = seg(t, 0.04, 0.14);
  const r6dist = seg(t, S7[3] + 0.04, S7[3] + 0.13);
  const pose: ArtPose = { ...LATE, pulm, r6dist };
  const camera = cameraAt(t, [
    [0, orbit(14, 12, 9.5, [0, 0.5, 0.3], [30, 0])],
    [S7[1], orbit(58, 12, 8.5, [0.3, 0.6, 0.2], [30, 0])],
    [S7[2], orbit(84, 6, 9, [0.4, 0.8, -0.1], [30, 0])],
    [S7[3], orbit(-62, 12, 8.5, [-0.3, 0.7, 0.2], [30, 0]), 0.06],
  ]);
  const names: CalloutSpec[] = [
    ...both('seigarren-aorta-arkua', 'seigarren-aorta-arkua', vis(t, 0, S7[1])),
    ...both('hasierako-birika-arteriak', 'hasierako-birika-arteriak', vis(t, 0.1, S7[1]), { small: true }),
    { id: 'birika-arteria', p: 'birika-arteria', show: 1, text: 'Birika enborra', small: true },
    { id: 'ezkerreko-birika-arteria', p: 'ezkerreko-birika-arteria', show: vis(t, S7[1]) },
    { id: 'hasierako-birika-arteriak', p: 'hasierako-birika-arteriakL', show: vis(t, S7[1], S7[2]), small: true, key: 'hbaL2' },
    { id: 'hodi-arteriosoa', p: 'hodi-arteriosoa', show: vis(t, S7[2]) },
    { id: 'beheranzko-aorta', p: 'aorta-dortsalak-lowL', show: vis(t, S7[2], S7[3]), small: true, text: 'Aorta' },
    { id: 'eskuineko-birika-arteria', p: 'eskuineko-birika-arteria', show: vis(t, S7[3]) },
    { id: 'seigarren-aorta-arkua', p: 'seigarren-distala-R', show: vis(t, S7[3], S7[3] + 0.1), text: 'Urrutiko atala: desagertzen da', key: 'r6dist' },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 0.6, lungs: 1, ghosts: 1, flow: { phase: t * 24, show: 0, ductus: vis(t, S7[2] + 0.05, S7[3]) } }}
      camera={camera}
      names={names}
      caption="5.–7. asteak · 6. arkuak eta birika arteriak"
      over={() => (
        <>
          <ColourKey items={ORIGIN_KEY} show={1} />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S7[1])}>
            6. arkuak: hasieratik adartxoak (hasierako birika arteriak) · eskuinean eta ezkerrean desberdin
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S7[1], S7[2])}>
            Ezkerrean: hurbileko atala + hasierako birika arteria → ezkerreko birika arteria
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S7[2], S7[3])}>
            Ezkerreko urrutiko atala → hodi arteriosoa: ezkerreko birika arteria ↔ aorta
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S7[3], 2)}>
            Eskuinean: urrutiko atala desagertzen da · hurbileko atala → eskuineko birika arteria
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 8: the other changes (notes 2.4 p3–p4) ————————————————————————————

export const S8 = [0, 0.12, 0.28, 0.44, 0.68, 0.86] as const;

export function OtherChanges3D({ t }: SceneProps) {
  const ductCar = seg(t, S8[1] + 0.03, S8[1] + 0.11);
  const rLow = seg(t, S8[2] + 0.03, S8[2] + 0.11);
  // The descent; replayed in the 4th step to watch the left subclavian climb.
  const d1 = seg(t, S8[3] + 0.03, S8[3] + 0.2);
  const back = seg(t, S8[4] + 0.01, S8[4] + 0.04);
  const again = seg(t, S8[4] + 0.06, S8[4] + 0.15);
  const descend = t < S8[4] ? d1 : 1 - back + again * back;
  const pose: ArtPose = { ...LATE, r6dist: 1, ductCar, rLow, descend };
  const camera = cameraAt(t, [
    [0, orbit(18, 10, 11.5, [0, 1.5, 0.1], [30, 0])],
    [S8[1], orbit(62, 8, 9.5, [0, 2.2, -0.1], [30, 0])],
    [S8[2], orbit(-58, 6, 12, [0, 0.0, -0.4], [30, 0]), 0.06],
    [S8[3], orbit(-28, 8, 13, [0, 0.4, 0.1], [30, 0])],
    [S8[3] + 0.06, orbit(-14, 8, 18, [0, -0.6, 0.1], [30, 0]), 0.12],
    [S8[4], orbit(62, 8, 10, [0.4, 0.2, -0.1], [30, 0])],
    [S8[5], orbit(16, 6, 14, [0, -1.2, 0.4], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'aorta-arkuak', p: 'laugarren-aorta-arkuaL', show: vis(t, 0, S8[1]), text: 'Aorta arkuak (29. eguna)' },
    ...both('hodi-karotideoa', 'hodi-karotideoa', vis(t, S8[1], S8[1] + 0.1)),
    { id: 'aorta-dortsalak', p: 'aorta-dortsalak-lowR', show: vis(t, S8[2], S8[2] + 0.1), text: 'Eskuineko aorta dortsalaren ataltxoa' },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalakL', show: vis(t, S8[2] + 0.08, S8[3]), text: 'Ezkerreko aorta dortsala', key: 'daL8' },
    { id: 'beheranzko-aorta', p: 'aorta-dortsalak-lowL', show: vis(t, S8[2] + 0.08), text: 'Beheranzko aorta' },
    ...both('karotida-komuna', 'karotida-komuna', vis(t, S8[3] + 0.12, S8[4])),
    { id: 'enbor-brakiozefalikoa', p: 'enbor-brakiozefalikoa', show: vis(t, S8[3] + 0.12, S8[4]) },
    { id: 'ezkerreko-subklabioa', p: 'ezkerreko-subklabioa', show: vis(t, S8[4], S8[5]) },
    { id: 'karotida-komuna', p: 'karotida-komunaL', show: vis(t, S8[4], S8[5]), small: true, key: 'cca-l2' },
    { id: 'aortaren-makoa', p: 'aortaren-makoa', show: vis(t, S8[4] + 0.12, S8[5]), small: true },
    { id: 'bihotza', p: 'bihotza', show: vis(t, S8[5]) },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 1, pharynx: 0.4, lungs: 0.5 * seg(t, S8[3], S8[3] + 0.1), ghosts: 1 }}
      camera={camera}
      names={names}
      caption={descend < 0.5 ? '6.–7. asteak · aorta arku-sistemaren beste aldaketak' : 'Bihotza toraxera jaitsi da · arteria handiak luzatu dira'}
      over={(at) => {
        const path = Array.from({ length: 12 }, (_, i) => leftOrigins(i / 11).subclavian);
        return (
          <>
            <ColourKey items={ORIGIN_KEY} show={1} />
            <Trail pts={path} at={at} show={vis(t, S8[4] + 0.06, S8[5]) * 0.9} progress={again} color="#5eead4" />
            <Note x={500} y={612} tone="accent" show={vis(t, 0, S8[1])}>
              Arkuen aldaketez gain, arteria arku-sisteman beste aldaketa batzuk ere badaude
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S8[1], S8[2])}>
              1. III. eta IV. arkuen arteko aorta dortsalen atal txikiak desagertzen dira: hodi karotideoak
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S8[2], S8[3])}>
              2. Eskuineko 7. segmentu arteko arteriaren eta aorta dortsal komunaren arteko atala desagertzen da
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S8[3], S8[4])}>
              3. Bihotza lepotik toraxera jaisten da: karotida komunak eta arteria brakiozefalikoa asko luzatzen dira
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S8[4], S8[5])}>
              4. Ezkerreko subklabioak bere jatorria galdu eta gorago kokatzen da: makotik irteten da
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S8[5], 2)}>
              Lepo mailan sortutako bihotza toraxeko perikardio barrunbera jaisten da
            </Note>
          </>
        );
      }}
    />
  );
}

// ———————————————————————————— stage 9: the recurrent laryngeal nerves (notes 2.4 p5–p13) ————————————————————————————

export const S9 = [0, 0.13, 0.27, 0.4, 0.55, 0.72, 0.86] as const;

export function Nerves3D({ t }: SceneProps) {
  const sup = seg(t, S9[1] + 0.02, S9[1] + 0.08);
  const rec = seg(t, S9[1] + 0.05, S9[1] + 0.11);
  const gone5 = seg(t, S9[4] + 0.02, S9[4] + 0.06);
  const r6dist = seg(t, S9[4] + 0.04, S9[4] + 0.09);
  const rHook = seg(t, S9[4] + 0.08, S9[4] + 0.15);
  const ligament = seg(t, S9[6] + 0.02, S9[6] + 0.06);
  const descend = seg(t, S9[6] + 0.05, S9[6] + 0.11);
  const pose: ArtPose = { ...LATE, grow: g6(1, 1, 1, 1, 0.8, 1), gone5, r6dist, rHook, ligament, descend, ductCar: descend, rLow: descend };
  const camera = cameraAt(t, [
    [0, orbit(30, 8, 15, [0, 1.6, 0.0], [30, 0])],
    [S9[1], orbit(36, 10, 10.5, [0, 1.6, 0.1], [30, 0])],
    [S9[2], orbit(4, 14, 10.5, [0, 1.3, 0.2], [30, 0])],
    [S9[3], orbit(70, 10, 8.5, [0.5, 1.1, 0.0], [30, 0])],
    [S9[4], orbit(-70, 10, 8.5, [-0.5, 1.4, 0.0], [30, 0]), 0.07],
    [S9[5], orbit(62, 10, 8.5, [0.5, 1.0, 0.0], [30, 0]), 0.07],
    [S9[6], orbit(10, 10, 12, [0, 0.4, 0.2], [30, 0]), 0.06],
  ]);
  const names: CalloutSpec[] = [
    { id: 'nerbio-bagoa', p: 'nerbio-bagoaL', show: 1 },
    { id: 'nerbio-bagoa', p: 'nerbio-bagoaR', show: vis(t, 0, S9[1]), key: 'bagoa:R' },
    { id: 'laugarren-aorta-arkua', p: 'laugarren-aorta-arkuaL', show: vis(t, 0, S9[2]), small: true },
    { id: 'seigarren-aorta-arkua', p: 'seigarren-aorta-arkuaL', show: vis(t, 0, S9[2]), small: true },
    { id: 'goiko-nerbio-laringeoa', p: 'goiko-nerbio-laringeoaL', show: vis(t, S9[1] + 0.06, S9[3]) },
    { id: 'nerbio-laringeo-atzerakaria', p: 'ezkerreko-nerbio-atzerakaria', show: vis(t, S9[1] + 0.08, S9[3]) },
    { id: 'laringea', p: 'laringea', show: vis(t, S9[1] + 0.08, S9[3]), small: true },
    { id: 'eskuineko-nerbio-atzerakaria', p: 'eskuineko-nerbio-atzerakaria', show: vis(t, S9[2], S9[3]) + vis(t, S9[4]) },
    { id: 'ezkerreko-nerbio-atzerakaria', p: 'ezkerreko-nerbio-atzerakaria', show: vis(t, S9[2], S9[4]) + vis(t, S9[5]) },
    { id: 'hodi-arteriosoa', p: 'hodi-arteriosoa', show: vis(t, S9[3], S9[4]) + vis(t, S9[5], S9[6]) },
    { id: 'eskuineko-subklabioa', p: 'laugarren-aorta-arkuaR', show: vis(t, S9[4], S9[5]) },
    { id: 'lotailu-arteriosoa', p: 'lotailu-arteriosoa', show: vis(t, S9[6] + 0.04) },
    { id: 'eskuineko-subklabioa', p: 'eskuineko-subklabioa', show: vis(t, S9[6] + 0.08), small: true, key: 'subR2' },
  ];
  return (
    <ArtView
      pose={pose}
      opts={{ heart: 0.5, pharynx: 0.6, lungs: 0.4, ghosts: 0.6, vagus: 1, superior: sup, recurrent: rec, flow: { phase: t * 24, show: 0, ductus: vis(t, S9[5] + 0.03, S9[6]) } }}
      camera={camera}
      names={names}
      caption={descend < 0.5 ? '5.–7. asteak · nerbio bagoa eta haren adar laringeoak' : 'Jaio ondoren · bi nerbio atzerakariak'}
      over={() => (
        <>
          <ColourKey items={[...ORIGIN_KEY.slice(3, 7), { color: '#facc15', text: 'nerbioak' }]} show={1} title="Kolorea" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S9[1])}>
            Nerbio bagoa (X. garezur bikotea, IV. eta VI. arkuak): lepotik eta toraxetik jaitsi, diafragma zeharkatzen du
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[1], S9[2])}>
            Muskulu laringeoetarako bi adar: goiko nerbio laringeoa eta nerbio laringeo atzerakaria
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[2], S9[3])}>
            Arterien aldaketen ondorioz, bi nerbio atzerakariek kokapen desberdina izango dute
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[3], S9[4])}>
            Ezkerrean: 6. arkuaren urrutiko atala (hodi arteriosoa) inguratu eta gora doa
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[4], S9[5])}>
            Eskuinean: 5.a ez da garatzen eta 6.aren urrutiko atala desagertzen da → 4. arkuko subklabioa inguratzen du
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[5], S9[6])}>
            Hodi arteriosoa: birika arteriako odola aortara pasatzen da
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[6], 2)}>
            Jaio ostean hodi arteriosoa → lotailu arteriosoa · ezkerreko nerbio atzerakariak hura inguratzen du
          </Note>
        </>
      )}
    />
  );
}
