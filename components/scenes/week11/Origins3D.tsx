'use client';

import { Note, seg, type SceneProps } from '@/components/kit';
import type { V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { T } from '@/components/scenes/week10/common';
import { ModelView, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { POSE0, blobParts, heartModel, mixHex, tubeParts, type HeartPose } from '@/components/scenes/week10/model3d';
import { SummaryTable } from '@/components/scenes/week9/common';
import { K, Steps, vis } from './common';
import { CN0, canalModel, type CanalState } from './canal3d';
import { DONE, valvesStage } from './SpiralSeptum3D';
import { TR0 } from './truncus3d';

/**
 * Topic 11's last stage (notes 1 p3, 2.2, 3, 4, 5.1, 5.2 p10): where each part of the finished heart comes
 * from, in the one colour code of topics 10–11 (sinus violet, atrial part orange, ventricular part cyan,
 * proximal bulbus green, conus lime, truncus ivory).
 *
 * The heart the stage before left rewinds to the straight tube of topic 10, drawn where the heart is and
 * at its size; the tube loops (the bulbus forward, down and to the right; the atrial part and the sinus up,
 * back and to the left); and the loop dissolves into the septated heart in place, each part where its
 * segment was and in its segment's colour. Then the camera visits each origin in turn: the trabeculated
 * ventricles (proximal bulbus → right, ventricular part → left), the smooth outflows (conus → the two
 * infundibula), the great arteries (truncus → aorta and pulmonary trunk), and, from behind, the atria
 * (smooth back walls from the sinus and the pulmonary veins, trabeculated rest from the atrial part).
 */

const CONT = 'erretena-11';
const RIGHT: [number, number] = [262, 505];

export const Q = [0, 0.15, 0.3, 0.46, 0.6, 0.73, 0.87] as const;

export const STEPS_Q: [number, string][] = [
  [Q[0], 'Bihotz hodia (10. gaia): atal bakoitza bere kolorez'],
  [Q[1], 'Tolestu: bulboa aurrera, behera eta eskuinera; atal aurikularra eta sinua gora, atzera eta ezkerrera'],
  [Q[2], 'Bihotz osoa, kolore berberekin: trabekulatuak hasierako bentrikuluetatik'],
  [Q[3], 'Bi infundibuluak (atal lisoak) arteria konotik'],
  [Q[4], 'Aorta eta birika enborra enbor arteriosotik'],
  [Q[5], 'Atzetik: aurikulen atal lisoak zain sinutik eta birika zainetatik; trabekulatuak atal aurikularretik'],
  [Q[6], 'Laburpena: atal bakoitza nondik dator'],
];

// ———————————————————————————— the tube where the heart is ————————————————————————————

/**
 * The loop of topic 10 laid on the septated heart: turned 28° about the vertical, twice its size and moved
 * so that its segments lie on what they become (least squares over the proximal bulbus ↔ right ventricle,
 * ventricular part ↔ left ventricle, conus, truncus and atrial part).
 */
const FIT = (() => {
  const a = (28 * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = 1.99;
  const pm: V3 = [-0.016, 0.34, 0.42];
  const qm: V3 = [-0.157, 0.381, -0.144];
  const rot = (p: V3): V3 => [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
  const r = rot(pm);
  const tr: V3 = [qm[0] - k * r[0], qm[1] - k * r[1], qm[2] - k * r[2]];
  const matrix = new Float32Array([k * c, 0, -k * s, 0, 0, k, 0, 0, k * s, 0, k * c, 0, tr[0], tr[1], tr[2], 1]);
  const place = (p: V3): V3 => {
    const q = rot(p);
    return [k * q[0] + tr[0], k * q[1] + tr[1], k * q[2] + tr[2]];
  };
  return { matrix, place };
})();

/** The tube's pose at stage time t: straight, then looping (the caudal end a little after the cranial). */
function tubePose(t: number): HeartPose {
  const loop = seg(t, Q[1] + 0.01, Q[1] + 0.1);
  return { ...POSE0, segs: 1, colour: 1, split: 1, arches: 0, veins: 0, loop, loopTail: seg(t, Q[1] + 0.025, Q[1] + 0.115), atriaFuse: seg(t, Q[1] + 0.05, Q[1] + 0.12) };
}

// ———————————————————————————— the heart in the origins' colours ————————————————————————————

const AORTA_IV = mixHex(T.truncus, T.o2, 0.16);
const PULM_IV = mixHex(T.truncus, T.deo2, 0.16);

/** Each part of the finished heart takes its segment's colour (k = 0: as the stages before drew it). */
function tintOrigins(items: Item3[], k: number): Item3[] {
  if (k <= 0.001) return items;
  const to = (it: Item3, color: string, deep: string): Item3 => ({ ...it, color: mixHex(it.color, color, k), deep: mixHex(it.deep ?? it.color, deep, k) });
  return items.map((it) => {
    const key = it.key;
    if (key === 'vessel-a' || key === 'vessel-lip-a' || key === 'vessel-above-a') return to(it, AORTA_IV, '#7a6a48');
    if (key === 'vessel-p' || key === 'vessel-lip-p' || key === 'vessel-above-p') return to(it, PULM_IV, '#6a6a5a');
    if (key === 'vessel-in-a' || key === 'vessel-in-p') return to(it, mixHex(T.truncus, '#2a2418', 0.35), '#4a4030');
    // The atrial mass: its trabeculated walls (the smooth back walls are drawn on it at the atria's step).
    if (key === 'atrium') return { ...to(it, T.atrium, T.atriumDeep), groups: [...(it.groups ?? []), 'atal-trabekulatua'] };
    // The muscle shading darkens lime towards the ventricles' green: lifted, so the conus reads as its own segment.
    if (key === 'conus' || key === 'conus-lip') return to(it, mixHex(T.conus, '#ffffff', 0.3), T.conus);
    if (key === 'conus-in-r') return to(it, mixHex(T.conus, '#1d2a08', 0.2), '#3a500e');
    if (key === 'conus-in-l') return to(it, mixHex('#b9dc6e', '#1d2a08', 0.2), '#3a500e');
    return it;
  });
}

/** The heart turned as stages 8–9 left it (18° about the vertical): the atria's own pieces turn with it. */
const TURN = (() => {
  const a = (18 * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { matrix: new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]), at: (p: V3): V3 => [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]] };
})();

/** The atrial mass of the canal model (canal3d `ATRIUM`, radii 1.45 × 0.62 × 0.55) and its two smooth back walls. */
const ATRIUM: V3 = [0.12, 0.92, -2.0];
const RA_SMOOTH: V3 = [ATRIUM[0] - 0.7, ATRIUM[1], -2.44];
const LA_SMOOTH: V3 = [ATRIUM[0] + 0.7, ATRIUM[1], -2.44];

let backWalls: { ra: ReturnType<typeof blobParts>; la: ReturnType<typeof blobParts>; cavae: ReturnType<typeof tubeParts>; pulm: ReturnType<typeof tubeParts>[] } | null = null;
function walls() {
  if (backWalls) return backWalls;
  const vein = (pts: V3[], r: number) => tubeParts(pts, { radius: () => r, ref: [1, 0, 0], sides: 14, capStart: true, capEnd: true });
  const x = RA_SMOOTH[0];
  backWalls = {
    ra: blobParts({ center: RA_SMOOTH, radii: [0.46, 0.44, 0.13], rings: 14, sides: 22 }),
    la: blobParts({ center: LA_SMOOTH, radii: [0.46, 0.44, 0.13], rings: 14, sides: 22 }),
    // The two cavae open into the right smooth part (the sinus taken into the wall): one from above, one from below.
    cavae: vein([[x, 2.15, -2.42], [x, 1.6, -2.48], [x, 1.18, -2.47], [x, 0.66, -2.47], [x, 0.2, -2.48], [x, -0.35, -2.42]], 0.14),
    // Four pulmonary veins open into the left smooth part, two from each lung.
    pulm: [-1, 1].flatMap((sx) => [-1, 1].map((sy) => vein([[LA_SMOOTH[0] + 0.17 * sx, LA_SMOOTH[1] + 0.15 * sy, -2.5], [LA_SMOOTH[0] + 0.42 * sx, LA_SMOOTH[1] + 0.3 * sy, -2.82], [LA_SMOOTH[0] + 0.78 * sx, LA_SMOOTH[1] + 0.42 * sy, -3.02]], 0.075))),
  };
  return backWalls;
}

function atriaItems(show: number): Item3[] {
  if (show <= 0.01) return [];
  const w = walls();
  const m = TURN.matrix;
  return [
    { key: 'o-ra-smooth', id: 'atal-lisoa', groups: ['zain-sinua'], ...w.ra, matrix: m, color: K.smoothRA, deep: K.smoothDeep, tissue: 'muscle', show },
    { key: 'o-la-smooth', id: 'ezkerreko-aurikularen-atal-lisoa', groups: ['birika-zainak'], ...w.la, matrix: m, color: mixHex(T.o2, '#5a1820', 0.12), deep: T.o2Deep, tissue: 'muscle', show },
    { key: 'o-cavae', id: 'goiko-kaba-zaina', groups: ['beheko-kaba-zaina'], ...w.cavae, matrix: m, color: mixHex(K.smoothRA, T.deo2, 0.45), deep: K.smoothDeep, tissue: 'vessel', show },
    ...w.pulm.map((p, i): Item3 => ({ key: `o-pulm-${i}`, id: 'birika-zainak', ...p, matrix: m, color: K.pulmV, deep: T.o2Deep, tissue: 'vessel', show })),
  ];
}

// ———————————————————————————— the stage ————————————————————————————

/** The heart as the stage before left it (valves and coronaries done); from Q[2] in the origins' colours. */
const FINISHED: CanalState = { ...CN0, ...DONE, truncus: valvesStage(1) };
const CLEAN: CanalState = { ...CN0, ...DONE, truncus: { ...TR0, ridges: 1, fuse: 1, split: 1, cut: 1, tubercles: 1, hollow: 1 } };

export function Origins3D({ t }: SceneProps) {
  // The finished heart gives way to the tube (rewind), and comes back from the loop.
  const before = 1 - seg(t, 0.012, 0.05);
  const after = seg(t, Q[2] + 0.012, Q[2] + 0.065);
  const tube = seg(t, 0.02, 0.055) * (1 - after);
  const heart = Math.max(before, after);
  const tint = seg(t, Q[2], Q[2] + 0.04);
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  if (heart > 0.01) {
    const m = canalModel(t < Q[1] ? FINISHED : CLEAN, { phase: t, show: 0 });
    for (const it of tintOrigins(m.items, tint)) if (!it.stream) items.push(heart < 0.999 ? { ...it, show: (it.show ?? 1) * heart } : it);
    Object.assign(pts, m.pts);
    items.push(...atriaItems(after * vis(t, Q[5] - 0.02, 2, 0.03)));
  }
  if (tube > 0.01) {
    const h = heartModel(tubePose(t), { cavity: 0, septum: 0, gut: 0, aortas: 0, noto: 0 });
    for (const it of h.items) if (!it.stream) items.push({ ...it, key: `h-${it.key}`, matrix: FIT.matrix, show: (it.show ?? 1) * tube });
    for (const [id, p] of Object.entries(h.pts)) pts[`h:${id}`] = FIT.place(p);
  }
  const back = (p: V3) => TURN.at(p);
  pts['o-ra'] = back([RA_SMOOTH[0] - 0.12, RA_SMOOTH[1] + 0.12, RA_SMOOTH[2] - 0.12]);
  pts['o-la'] = back([LA_SMOOTH[0] + 0.12, LA_SMOOTH[1] - 0.12, LA_SMOOTH[2] - 0.12]);
  pts['o-trab'] = back([ATRIUM[0] + 1.18, ATRIUM[1] + 0.22, ATRIUM[2] - 0.2]);
  pts['o-cava-up'] = back([RA_SMOOTH[0], 1.95, -2.44]);
  pts['o-cava-down'] = back([RA_SMOOTH[0], -0.15, -2.44]);
  pts['o-pulm'] = back([LA_SMOOTH[0] + 0.62, LA_SMOOTH[1] + 0.38, -2.95]);

  // The tube's middle (the camera's target while it is drawn) and the heart's.
  const tubeMid = FIT.place([0, 0.1, 0.1]);
  const loopMid = FIT.place([-0.1, 0.25, 0.1]);
  const camera = cameraAt(t, [
    // From where the stage before ended (the coronaries, from in front and the left) out to the whole heart.
    [0, orbit(-22, 18, 6.6, [0.1, 0.55, 0.15])],
    [0.02, orbit(0, 6, 13.2, tubeMid)],
    // The loop forms from the front and the right: the bulbus comes forward, the atrial part goes back.
    [Q[1], orbit(-34, 10, 12, loopMid)],
    [Q[1] + 0.12, orbit(-16, 10, 11, loopMid)],
    // The heart in its place: from the front and a little above, both ventricles open.
    [Q[2], orbit(-16, 14, 10.4, [0, 0.55, -0.2])],
    [Q[2] + 0.07, orbit(-8, 16, 8.6, [0, -0.3, -0.1])],
    // The conus over the septum: the two smooth outflows.
    [Q[3], orbit(-20, 24, 6.2, [0.05, 0.85, 0.3])],
    // The truncus and the two arteries, from the front and the left.
    [Q[4], orbit(14, 10, 7.4, [0.15, 1.95, 0.1])],
    // Round to the back: the atria's back walls.
    [Q[5], orbit(150, 14, 7.6, back([ATRIUM[0], 0.85, -2.2]))],
    [Q[5] + 0.06, orbit(172, 12, 7.2, back([ATRIUM[0], 0.85, -2.2]))],
    // The heart on the right, the table on the left between the side pill and the camera keys (on tablets the
    // orientation key, the drag hint, the side pills and the keys take the frame's edges).
    [Q[6], orbit(-20, 14, 14.6, [-4.2, 0.3, -0.3])],
  ]);

  const names: CalloutSpec[] = [
    // The tube, then the loop: the six segments.
    { id: 'enbor-arteriosoa', key: 't-truncus', p: 'h:enbor-arteriosoa', show: vis(t, 0.045, Q[2] + 0.02) },
    { id: 'arteria-konoa', key: 't-conus', p: 'h:arteria-konoa', show: vis(t, 0.045, Q[2] + 0.02) },
    { id: 'bulboaren-hurbileko-atala', key: 't-prox', p: 'h:bulboaren-hurbileko-atala', show: vis(t, 0.045, Q[2] + 0.02) },
    { id: 'atal-bentrikularra', key: 't-vent', p: 'h:atal-bentrikularra', show: vis(t, 0.045, Q[2] + 0.02) },
    { id: 'atal-aurikularra', key: 't-atr', p: 'h:atal-aurikularra', show: vis(t, 0.045, Q[2] + 0.02) },
    { id: 'zain-sinua', key: 't-sinus', p: 'h:zain-sinua', show: vis(t, 0.045, Q[2] + 0.02) },
    { id: 'atal-bulbarra', key: 't-bulbus', p: 'h:atal-bulbarra', show: vis(t, Q[1] + 0.02, Q[2] + 0.02), small: true },
    // The ventricles: trabeculated parts.
    { id: 'hasierako-eskuineko-bentrikulua', p: 'hasierako-eskuineko-bentrikulua', text: 'Eskuineko bentrikulua', sub: '← hurbileko atala', show: vis(t, Q[2] + 0.06, Q[3]) },
    { id: 'hasierako-ezkerreko-bentrikulua', p: 'hasierako-ezkerreko-bentrikulua', text: 'Ezkerreko bentrikulua', sub: '← atal bentrikularra', show: vis(t, Q[2] + 0.06, Q[3]) },
    // The smooth outflows.
    { id: 'eskuineko-infundibulua', p: 'eskuineko-infundibulua', text: 'Eskuineko infundibulua', sub: '← konoa', show: vis(t, Q[3] + 0.02, Q[4]) },
    { id: 'ezkerreko-infundibulua', p: 'ezkerreko-infundibulua', text: 'Ezkerreko infundibulua', sub: '← konoa', show: vis(t, Q[3] + 0.02, Q[4]) },
    { id: 'konoaren-trenkada', p: 'konoaren-trenkada', show: vis(t, Q[3] + 0.04, Q[4]), small: true },
    // The great arteries.
    { id: 'aorta', key: 'aorta-hodia', p: 'aorta-vessel', text: 'Aorta', sub: '← enbor arteriosoa', show: vis(t, Q[4] + 0.02, Q[5]) },
    { id: 'birika-arteria', key: 'birika-hodia', p: 'birika-arteria-vessel', text: 'Birika enborra', sub: '← enbor arteriosoa', show: vis(t, Q[4] + 0.02, Q[5]) },
    { id: 'trenkada-aortikopulmonarra', p: 'trenkada-aortikopulmonarra', show: vis(t, Q[4] + 0.04, Q[5]), small: true },
    // The atria, from behind.
    { id: 'atal-lisoa', key: 'o-ra', p: 'o-ra', text: 'Eskuineko aurikula, atal lisoa', sub: '← zain sinua', show: vis(t, Q[5] + 0.03, Q[6]) },
    { id: 'ezkerreko-aurikularen-atal-lisoa', key: 'o-la', p: 'o-la', text: 'Ezkerreko aurikula, atal lisoa', sub: '← birika zainak', show: vis(t, Q[5] + 0.03, Q[6]) },
    { id: 'atal-trabekulatua', key: 'o-trab', p: 'o-trab', text: 'Atal trabekulatuak', sub: '← atal aurikularra', show: vis(t, Q[5] + 0.05, Q[6]) },
    { id: 'goiko-kaba-zaina', p: 'o-cava-up', show: vis(t, Q[5] + 0.06, Q[6]), small: true },
    { id: 'beheko-kaba-zaina', p: 'o-cava-down', show: vis(t, Q[5] + 0.06, Q[6]), small: true },
    { id: 'birika-zainak', p: 'o-pulm', show: vis(t, Q[5] + 0.06, Q[6]), small: true },
  ];
  const table = vis(t, Q[6] + 0.03);
  const row = (k: number) => Q[6] + 0.03 + 0.006 * k;
  return (
    <ModelView
      model={{ items, pts }}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(_, asked) => (
        <>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0.02, Q[1]) * asked}>
            Aurretik (enbrioiaren eskuina zure ezkerrean): bihotz hodia, bihotza dagoen lekuan eta haren neurrian
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, Q[1], Q[2]) * asked}>
            Aurretik eta eskuinetik: bulboa aurrera eta eskuinera, atal aurikularra atzera
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, Q[2], Q[5]) * asked}>
            Kolore bakoitza: bihotz hodiaren atal bat (10. gaiko kode berbera)
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, Q[5], Q[6]) * asked}>
            Atzetik: eskuina zure eskuinean (ez dago aldatuta)
          </Note>
          {table > 0.01 && (
            <g opacity={table}>
              <rect x={122} y={146} width={512} height={300} rx={12} fill="#120c16" opacity={0.92} />
              <SummaryTable
                t={t}
                x={130}
                y={154}
                widths={[180, 316]}
                rowH={32}
                head={['Bihotz hodiaren atala', 'Bihotz osoan']}
                rows={[
                  { at: row(0), cells: [{ id: 'enbor-arteriosoa', text: 'Enbor arteriosoa', color: T.truncus }, { id: 'aorta', text: 'Aorta eta birika enborra' }] },
                  { at: row(1), cells: [{ id: 'arteria-konoa', text: 'Arteria konoa', color: T.conus }, { id: 'eskuineko-infundibulua', text: 'Infundibuluak (zati lisoak)' }] },
                  { at: row(2), cells: [{ id: 'bulboaren-hurbileko-atala', text: 'Hurbileko atala', color: T.proximal }, { id: 'hasierako-eskuineko-bentrikulua', text: 'Eskuineko bentrikulua, trabekulatua' }] },
                  { at: row(3), cells: [{ id: 'atal-bentrikularra', text: 'Atal bentrikularra', color: T.ventricle }, { id: 'hasierako-ezkerreko-bentrikulua', text: 'Ezkerreko bentrikulua, trabekulatua' }] },
                  { at: row(4), cells: [{ id: 'atal-aurikularra', text: 'Atal aurikularra', color: T.atrium }, { id: 'atal-trabekulatua', text: 'Aurikulen atal trabekulatuak' }] },
                  { at: row(5), cells: [{ id: 'zain-sinua', text: 'Zain sinua', color: T.sinus }, { id: 'atal-lisoa', text: 'Eskuineko aurikularen atal lisoa' }] },
                  { at: row(6), cells: [{ id: 'birika-zainak', text: 'Birika zainak', color: mixHex(T.o2, '#5a1820', 0.12) }, { id: 'ezkerreko-aurikularen-atal-lisoa', text: 'Ezkerreko aurikularen atal lisoa' }] },
                ]}
              />
            </g>
          )}
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, Q[2] + 0.07, Q[3])}>
            Atal bakoitza bere segmentuaren lekuan eta kolorean
          </Note>
          {Steps({ t, steps: STEPS_Q, y: 630 })}
        </>
      )}
    />
  );
}
