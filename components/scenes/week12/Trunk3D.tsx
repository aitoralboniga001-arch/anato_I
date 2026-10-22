'use client';

import { Note, type SceneProps } from '@/components/kit';
import { seg } from '@/lib/sim/anim';
import { ADULT } from './arteries3d';
import { TC, TP0, trunkModel, type TrunkOpts, type TrunkPose } from './trunk-model';
import { ArtView, ColourKey, cameraAt, orbit, vis, type CalloutSpec } from './common';

/**
 * Topic 12, stages 11–14 (notes 2.5–2.7): the descending aorta and what it gives, in the adult frame of
 * the arch model (the same axes, the same continuity): the camera follows the aorta down from the arch.
 * Axes: x = the embryo's left, y cranial, z ventral; yaw 0 = from the front (left on the viewer's right).
 */

const ARCH_OPTS = { heart: 1, heartColour: 0, lungs: 0.3 } as const;
const GROUPS = [
  { color: TC.ventral, text: 'aurreko errai adarrak' },
  { color: TC.lateral, text: 'alboko errai adarrak' },
  { color: TC.interseg, text: 'segmentu arteko arteriak' },
];

function TrunkView({ pose, opts, ...rest }: { pose: TrunkPose; opts: TrunkOpts } & Omit<Parameters<typeof ArtView>[0], 'pose' | 'opts' | 'extra'>) {
  return <ArtView pose={ADULT} opts={ARCH_OPTS} extra={trunkModel(pose, opts)} {...rest} />;
}

// ———————————————————————————— stage 11: the descending aorta and its ventral branches (notes 2.5–2.5.1) ————————————————————————————

/** Steps 0–2 in the 5-week embryo (Embryo3D's Ventral3D), 3–5 in this adult frame. */
export const S11 = [0, 0.16, 0.32, 0.5, 0.66, 0.82] as const;

export function Descending3D({ t }: SceneProps) {
  const aorta = seg(t, 0.03, 0.14);
  const groups = seg(t, S11[3] + 0.05, S11[3] + 0.1);
  const oeso = seg(t, S11[4] + 0.02, S11[4] + 0.08);
  const visc = (k: number) => seg(t, S11[5] + 0.02 + k * 0.025, S11[5] + 0.05 + k * 0.025);
  const pose: TrunkPose = {
    ...TP0,
    aorta,
    oeso,
    celiac: Math.max(groups, visc(0)),
    sma: Math.max(groups, visc(1)),
    ima: Math.max(groups, visc(2)),
    renal: groups,
    lumb: groups,
    thor: groups,
  };
  const lit = (a: number, b?: number) => vis(t, a, b ?? 2);
  const camera = cameraAt(t, [
    [0, orbit(20, 8, 14, [0, -0.5, 0.0], [30, 0])],
    [0.03, orbit(24, 6, 22, [0, -4.5, -0.3], [30, 0]), 0.1],
    [S11[3] + 0.03, orbit(28, 10, 13.5, [0.1, -6.4, -0.6], [30, 0]), 0.07],
    [S11[4], orbit(52, 10, 11, [0, -3.5, -0.5], [30, 0]), 0.07],
    [S11[5], orbit(34, 10, 14, [0.1, -6.2, -0.2], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'aortaren-makoa', p: 'aortaren-makoa', show: lit(0, S11[3] + 0.05), small: true },
    { id: 'beheranzko-aorta', p: 'aorta-torazikoa', show: lit(0.06, S11[3] + 0.03) },
    { id: 'beheranzko-aorta', p: 'aorta-abdominala', show: lit(S11[3] + 0.03, S11[4]), key: 'ao-abd' },
    { id: 'aurreko-errai-adarrak', p: 'goiko-arteria-mesenterikoa', show: lit(S11[3] + 0.08, S11[4]) },
    { id: 'alboko-errai-adarrak', p: 'giltzurrun-arteriak', show: lit(S11[3] + 0.08, S11[4]) },
    { id: 'segmentu-arteko-arteriak', p: 'arteria-lunbarrak', show: lit(S11[3] + 0.08, S11[4]), text: 'Atze alboko adarrak (segmentu arteko arteriak)' },
    { id: 'hestegorriko-arteriak', p: 'hestegorriko-arteriak', show: lit(S11[4] + 0.04) },
    { id: 'hestegorria', p: 'hestegorria', show: lit(S11[4] + 0.04, S11[5]), small: true },
    { id: 'enbor-zeliakoa', p: 'enbor-zeliakoa', show: lit(S11[5] + 0.03) },
    { id: 'goiko-arteria-mesenterikoa', p: 'goiko-arteria-mesenterikoa', show: lit(S11[5] + 0.05) },
    { id: 'beheko-arteria-mesenterikoa', p: 'beheko-arteria-mesenterikoa', show: lit(S11[5] + 0.08) },
    { id: 'aurreko-hestea', p: 'aurreko-hestea', show: lit(S11[5] + 0.03), small: true },
    { id: 'erdiko-hestea', p: 'erdiko-hestea', show: lit(S11[5] + 0.05), small: true },
    { id: 'atzeko-hestea', p: 'atzeko-hestea', show: lit(S11[5] + 0.08), small: true },
  ];
  return (
    <TrunkView
      pose={pose}
      opts={{ spine: 0.8 * groups, gut: Math.max(oeso, visc(0)) * 0.9, organs: 0.6 * groups, groupColour: vis(t, S11[3] + 0.04, S11[4] + 0.02) }}
      camera={camera}
      names={names}
      caption="Beheranzko aorta eta haren adarrak (3D eredua)"
      over={() => (
        <>
          <ColourKey items={GROUPS} show={vis(t, S11[3] + 0.06, S11[4])} title="Hiru adar talde" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S11[3] + 0.05)}>
            Aorta dortsalak torax mailatik behera fusionatuta: aorta bakarra, beheranzko aorta
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S11[3] + 0.05, S11[4])}>
            Hiru adar talde: aurrerantz (hestera), alboetara (abdomenean) eta atze-alboetara (maila guztietan)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S11[4], S11[5])}>
            Torax mailan: 5 arteria bikote, toraxeko aortaren aurreko paretatik, heste gorrira
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S11[5], 2)}>
            Abdomenean: enbor zeliakoa (aurreko hestea) · goiko a. mesenterikoa (bitarteko hestea) · beheko a. mesenterikoa (atzeko hestea)
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 12: lateral and posterolateral branches (notes 2.5.2–2.5.3) ————————————————————————————

export const S12 = [0, 0.13, 0.26, 0.4, 0.56, 0.74, 0.88] as const;

export function Lateral3D({ t }: SceneProps) {
  // All three appear together (the group), then each pair is lit in its own step.
  const supra = seg(t, 0.02, 0.06);
  const renal = seg(t, 0.04, 0.08);
  const gonadal = seg(t, 0.06, 0.1);
  const dim =
    t < S12[1] ? null
    : t < S12[2] ? { ids: ['giltzurrun-gaineko-arteriak', 'giltzurrun-arteriak'], k: seg(t, S12[1], S12[1] + 0.03) }
    : t < S12[3] ? { ids: ['arteria-gonadalak'], k: 1 }
    : { ids: [], k: 0 };
  const segs = seg(t, S12[3] + 0.02, S12[3] + 0.09);
  const anast = seg(t, S12[4] + 0.03, S12[4] + 0.08);
  const cervLoss = seg(t, S12[4] + 0.08, S12[4] + 0.14);
  const pose: TrunkPose = { ...TP0, celiac: 1, sma: 1, ima: 1, supra, renal, gonadal, cerv: segs, thor: segs, lumb: segs, sacr: segs, anast, cervLoss };
  const camera = cameraAt(t, [
    [0, orbit(6, 14, 9, [0, -7.6, -0.6], [30, 0])],
    [S12[1], orbit(-14, 10, 7.5, [0, -7.2, -0.8], [30, 0])],
    [S12[2], orbit(16, 8, 8, [0, -8.3, -0.6], [30, 0])],
    [S12[3], orbit(128, 14, 20, [0, -3.6, -0.8], [30, 0]), 0.08],
    [S12[4], orbit(120, 10, 9, [0.4, 2.1, -0.9], [30, 0]), 0.06],
    [S12[5], orbit(124, 12, 21.5, [0, -5.0, -0.8], [30, 0]), 0.06],
    [S12[6], orbit(48, 10, 10.5, [0.9, 0.2, -0.3], [30, 0]), 0.07],
  ]);
  const names: CalloutSpec[] = [
    { id: 'alboko-errai-adarrak', p: 'giltzurrun-arteriak', show: vis(t, 0, S12[1]), text: 'Alboko errai adarrak (abdomenean)' },
    { id: 'giltzurrun-gaineko-guruinak', p: 'giltzurrun-gaineko-guruinak', show: vis(t, 0, S12[3]), small: true },
    { id: 'giltzurruna', p: 'giltzurruna', show: vis(t, 0, S12[3]), small: true },
    { id: 'gonadak', p: 'gonadak', show: vis(t, 0, S12[1]) + vis(t, S12[2], S12[3]), small: true },
    { id: 'giltzurrun-gaineko-arteriak', p: 'giltzurrun-gaineko-arteriak', show: vis(t, S12[1] + 0.02, S12[3]) },
    { id: 'giltzurrun-arteriak', p: 'giltzurrun-arteriak', show: vis(t, S12[1] + 0.04, S12[3]) },
    { id: 'arteria-gonadalak', p: 'arteria-gonadalak', show: vis(t, S12[2] + 0.04, S12[3]) },
    { id: 'segmentu-arteko-arteriak', p: 'saihets-arteko-arteriak', show: vis(t, S12[3] + 0.04, S12[4]), text: 'Segmentu arteko arteriak (maila guztietan)' },
    { id: 'ornoak', p: 'ornoak', show: vis(t, S12[3] + 0.04, S12[4]), small: true },
    { id: 'segmentu-arteko-arteriak', p: 'lepoko-segmentu-arteko-arteriak', show: vis(t, S12[4], S12[5]), text: 'Lepoko segmentu arteko arteriak', key: 'cerv' },
    { id: 'luzetarako-anastomosiak', p: 'luzetarako-anastomosiak', show: vis(t, S12[4] + 0.05, S12[5]) },
    { id: 'orno-arteria', p: 'orno-arteria', show: vis(t, S12[4] + 0.12, S12[5]) + vis(t, S12[6] + 0.07) },
    { id: 'saihets-arteko-arteriak', p: 'saihets-arteko-arteriak', show: vis(t, S12[5], S12[6]) },
    { id: 'arteria-lunbarrak', p: 'arteria-lunbarrak', show: vis(t, S12[5], S12[6]) },
    { id: 'alboko-arteria-sakroak', p: 'alboko-arteria-sakroak', show: vis(t, S12[5], S12[6]) },
    { id: 'ezkerreko-subklabioa', p: 'ezkerreko-subklabioa', show: vis(t, S12[6]) },
    { id: 'zazpigarren-segmentu-arteko-arteria', p: 'zazpigarren-segmentu-arteko-arteriaL', show: vis(t, S12[6]), small: true, text: '7. mailako segmentu arteko arteria' },
  ];
  return (
    <TrunkView
      pose={pose}
      opts={{ spine: 0.4 + 0.5 * seg(t, S12[3], S12[3] + 0.05), gut: 0.25 * (1 - seg(t, S12[3], S12[3] + 0.05)), organs: 1 - 0.6 * seg(t, S12[3], S12[3] + 0.05), ghosts: 1, dim, groupColour: vis(t, S12[3], S12[6]) }}
      camera={camera}
      names={names}
      caption={t < S12[3] ? 'Abdomena aurretik · alboko errai adarrak' : 'Atzetik eta ezkerretik · segmentu arteko arteriak'}
      over={() => (
        <>
          <ColourKey items={GROUPS} show={vis(t, S12[3], S12[6])} title="Hiru adar talde" />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S12[1])}>
            Abdomenean alboko errai adarrak: gehiago daude, baina hiru ikasi behar ditugu
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S12[1], S12[2])}>
            Giltzurrun gaineko arteriak (adrenalak) → guruinak · giltzurrun arteriak → giltzurrunak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S12[2], S12[3])}>
            Arteria gonadalak: obulutegi-arteriak edo arteria espermatikoak (luzeagoak, beherago daudelako)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S12[3], S12[4])}>
            Segmentu arteko arteriak maila guztietan: bizkarreko muskuluak, orno muina eta larruazala irrigatzen dituzte
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S12[4], S12[5])}>
            Lepoan: luzetarako anastomosiak, eta aortarekiko komunikazioa galtzen da → orno arteriak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S12[5], S12[6])}>
            Toraxean saihets arteko arteriak · gerrian arteria lunbarrak · sakroan alboko arteria sakroak
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S12[6], 2)}>
            Ez ahaztu: 7. mailan garatzen dira arteria subklabioak
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 13: umbilical and iliac arteries (notes 2.6) ————————————————————————————

export const S13 = [0, 0.17, 0.36, 0.56, 0.78] as const;

export function Iliac3D({ t }: SceneProps) {
  const umb = seg(t, 0.03, 0.12);
  const common = seg(t, S13[1] + 0.02, S13[1] + 0.08);
  const ext = seg(t, S13[2] + 0.02, S13[2] + 0.07);
  const femoral = seg(t, S13[2] + 0.06, S13[2] + 0.12);
  const int = seg(t, S13[3] + 0.02, S13[3] + 0.06);
  const umbShift = seg(t, S13[3] + 0.07, S13[3] + 0.14);
  const birth = seg(t, S13[4] + 0.03, S13[4] + 0.09);
  const pose: TrunkPose = { ...TP0, celiac: 1, sma: 1, ima: 1, renal: 1, umb, common, ext, int, umbShift, birth, femoral, leg: 1, lumb: 1, sacr: 1 };
  const camera = cameraAt(t, [
    [0, orbit(56, 10, 10, [0, -9.2, 0.3], [30, 0])],
    [S13[1], orbit(24, 12, 8.5, [0.3, -9.4, -0.5], [30, 0])],
    [S13[2], orbit(40, 8, 10, [0.9, -10.3, 0.1], [30, 0])],
    [S13[3], orbit(64, 12, 8.5, [0.5, -9.9, -0.2], [30, 0])],
    [S13[4], orbit(22, 10, 9, [0.2, -9.4, 0.7], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'zilbor-arteriak', p: 'zilbor-arteriak', show: vis(t, 0, S13[4]) },
    { id: 'beheranzko-aorta', p: 'aorta-abdominala', show: vis(t, 0, S13[2]), small: true, text: 'Aorta' },
    { id: 'arteria-iliako-primitiboak', p: 'arteria-iliako-primitiboak', show: vis(t, S13[1] + 0.04) },
    { id: 'arteria-lunbarrak', p: 'arteria-lunbarrak', show: vis(t, S13[1], S13[2]), small: true, text: 'Gerriko segmentu arteko arteriak' },
    { id: 'kanpoko-arteria-iliakoa', p: 'kanpoko-arteria-iliakoa', show: vis(t, S13[2] + 0.03) },
    { id: 'arteria-femorala', p: 'arteria-femorala', show: vis(t, S13[2] + 0.08, S13[4]) },
    { id: 'beheko-gorputz-adarra', p: 'beheko-gorputz-adarra', show: vis(t, S13[2] + 0.04, S13[3]), small: true },
    { id: 'barneko-arteria-iliakoa', p: 'barneko-arteria-iliakoa', show: vis(t, S13[3] + 0.03) },
    { id: 'gernu-maskuria', p: 'gernu-maskuria', show: vis(t, S13[3]), small: true },
    { id: 'erdialdeko-zilbor-lotailua', p: 'erdialdeko-zilbor-lotailua', show: vis(t, S13[4] + 0.07) },
    { id: 'goiko-gernu-maskuri-arteria', p: 'goiko-gernu-maskuri-arteria', show: vis(t, S13[4] + 0.07) },
  ];
  return (
    <TrunkView
      pose={pose}
      opts={{ spine: 0.5, gut: 0.15, organs: 0.4, bladder: 1, limbs: seg(t, S13[2], S13[2] + 0.05), ghosts: 1 }}
      camera={camera}
      names={names}
      caption={t < S13[4] ? 'Pelbisa · zilborreko eta iliako arteriak (3D eredua)' : 'Jaio ondoren'}
      over={() => (
        <>
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S13[1])}>
            Zilborreko arteriak aortaren aurreko ataletik (sakro mailan) karenara: oxigeno gutxiko odola
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S13[1], S13[2])}>
            Gerriko V. segmentu arteko arteriatik: arteria iliako primitiboak (aorta dortsalarekin lotuta), bi adarrekin
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S13[2], S13[3])}>
            Kanpoko arteria iliakoa → iztai lotailuaren azpitik: arteria femorala
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S13[3], S13[4])}>
            Bigarren konexioa: zilborreko arteriak aorta utzi eta barneko arteria iliakoari lotzen zaizkio
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S13[4], 2)}>
            Jaio ondoren: urrutiko atala → erdialdeko zilbor lotailuak · hurbileko atala → goiko gernu maskuriaren arteria
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 14: the limbs' arteries (notes 2.7) ————————————————————————————

export const S14 = [0, 0.13, 0.27, 0.41, 0.56, 0.72, 0.86] as const;

export function Limbs3D({ t }: SceneProps) {
  const arm = 0.5 * seg(t, S14[2] + 0.02, S14[2] + 0.08) + 0.5 * seg(t, S14[3] + 0.02, S14[3] + 0.08);
  const armBranches = 0.5 * seg(t, S14[2] + 0.05, S14[2] + 0.1) + 0.5 * seg(t, S14[3] + 0.04, S14[3] + 0.09);
  const leg = seg(t, S14[5] + 0.01, S14[5] + 0.07);
  const femoral = seg(t, S14[5] + 0.05, S14[5] + 0.11);
  const legTake = seg(t, S14[6] + 0.04, S14[6] + 0.1);
  const pose: TrunkPose = {
    ...TP0,
    renal: 1,
    lumb: 1,
    umb: 1,
    umbShift: 1,
    common: 1,
    int: 1,
    ext: 1,
    arm,
    armAxial: seg(t, 0.02, 0.08),
    armBranches,
    leg,
    legAxial: seg(t, 0.02, 0.08),
    femoral,
    legTake,
  };
  const camera = cameraAt(t, [
    [0, orbit(24, 6, 26, [0.6, -5.4, 0.0], [30, 0])],
    [S14[1], orbit(44, 6, 7.5, [2.55, -0.6, 0.0], [30, 0]), 0.07],
    [S14[2], orbit(40, 6, 8.5, [2.65, -1.2, 0.2], [30, 0])],
    [S14[3], orbit(36, 6, 10, [2.7, -1.8, 0.4], [30, 0])],
    [S14[4], orbit(26, 10, 9, [1.8, -0.6, 0.0], [30, 0])],
    [S14[5], orbit(52, 6, 10, [1.4, -11.0, 0.4], [30, 0]), 0.08],
    [S14[6], orbit(72, 4, 9.5, [1.3, -11.0, 0.3], [30, 0])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'ardatz-arteria', p: 'ardatz-arteria', show: vis(t, 0, S14[2]) },
    { id: 'goiko-gorputz-adarra', p: 'goiko-gorputz-adarra', show: vis(t, 0, S14[2]), small: true },
    { id: 'ezkerreko-subklabioa', p: 'ezkerreko-subklabioa', show: vis(t, 0, S14[1]) + vis(t, S14[4], S14[5]), small: true },
    { id: 'arteria-femorala', p: 'arteria-femorala', show: vis(t, S14[5] + 0.08) },
    { id: 'beheko-gorputz-adarra', p: 'beheko-gorputz-adarra', show: vis(t, 0, S14[1]) + vis(t, S14[5] + 0.07, S14[6]), small: true },
    { id: 'arteria-brakiala', p: 'arteria-brakiala', show: vis(t, S14[2], S14[4]) },
    { id: 'hezur-arteko-arteria', p: 'hezur-arteko-arteria', show: vis(t, S14[2], S14[4]) },
    { id: 'eskuaurreko-arku-sakona', p: 'eskuaurreko-arku-sakona', show: vis(t, S14[2], S14[4]) },
    { id: 'arteria-erradiala', p: 'arteria-erradiala', show: vis(t, S14[2] + 0.06, S14[4]) },
    { id: 'arteria-kubitala', p: 'arteria-kubitala', show: vis(t, S14[2] + 0.06, S14[4]) },
    { id: 'kanpoko-arteria-iliakoa', p: 'kanpoko-arteria-iliakoa', show: vis(t, S14[5] + 0.07, S14[6]) },
    { id: 'barneko-arteria-iliakoa', p: 'barneko-arteria-iliakoa', show: vis(t, S14[6]) },
    { id: 'arteria-ziatikoa', p: 'arteria-ziatikoa', show: vis(t, S14[6] + 0.03) },
    { id: 'arteria-popliteoa', p: 'arteria-popliteoa', show: vis(t, S14[6] + 0.03) },
    { id: 'arteria-peroneoa', p: 'arteria-peroneoa', show: vis(t, S14[6] + 0.03) },
  ];
  const age = t < S14[2] ? '30 egun' : t < S14[3] ? '41 egun' : '46 egun';
  return (
    <TrunkView
      pose={pose}
      opts={{ spine: 0.3, organs: 0.2, limbs: 1, ghosts: 1 }}
      camera={camera}
      names={names}
      caption={t < S14[5] ? `Goiko gorputz adarra · ${age}` : 'Beheko gorputz adarra'}
      over={() => (
        <>
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S14[1])}>
            Gorputz adarren hastapen guztietan: hasierako ardatz arteriak (mesodermotik)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S14[1], S14[2])}>
            30 egun: hasierako ardatz arteria, hastapenaren erditik
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S14[2], S14[3])}>
            41 egun: arteria brakiala → hezur arteko arteria → eskuaurreko arku sakona
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S14[3], S14[4])}>
            46 egun: arteria guztiak ardatz arteriatik (brakiala, hezur artekoa, arku sakona, kubitala, erradiala)
          </Note>
          <Note x={500} y={612} tone="warn" show={vis(t, S14[4], S14[5])}>
            Subklabioak konektatu bakarrik egiten dira: besoko arteriak ez dira haietatik eratortzen
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S14[5], S14[6])}>
            Kanpoko arteria iliakoa jaitsi eta iztai eskualdean arteria femorala bihurtzen da
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S14[6], 2)}>
            Ardatz arteria barneko iliakoarekin: ziatikoa, popliteoa eta peroneoaren ataltxo bat · gehienak femoraletik
          </Note>
        </>
      )}
    />
  );
}
