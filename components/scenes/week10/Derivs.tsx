'use client';

import { Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import type { V3 } from '@/lib/three-d/math';
import { Cells, Defs11 } from '@/components/scenes/week11/common';
import { H0, HK, HeartArt, hp, type HeartState } from '@/components/scenes/week11/heart';
import { vis } from './common';
import { HeartView, Trail, cameraAt, orbit, type CalloutSpec } from './Heart3D';
import { POSE0, heartModel, type HeartOpts, type HeartPose } from './model3d';

/**
 * Stages 7–9 of topic 10 (notes 3.2–3.4 p9): what the ventricular part, the atrial part and the sinus
 * venosus of the loop become. Two kinds of view, as in topic 11:
 * - the frontal section of topic 11 (week11/heart HeartArt), drawn earlier in development (AV canal over
 *   the left ventricle, bulboventricular ridge, no septa yet), so topics 10 and 11 share one picture;
 * - the looped 3D heart of stage 5 (model3d), where the planes matter (atria up and behind, ventricles in
 *   front and to the right; the sinus venosus behind, seen from behind as the notes' figure is).
 */

/** The looped heart at the end of the 4th week (stage 5's last pose), the start of every later stage. */
export const LOOPED: HeartPose = { ...POSE0, loop: 1, segs: 1, colour: 1, atriaFuse: 1, veins: 1, arches: 3, split: 1 };

const L = 232;
const R = 768;
/** A label whose anchor is given in the frontal heart's own coordinates. */
const A = (id: string, x: number, y: number, ax: number, ay: number, show = 1, extra: { small?: boolean; text?: string } = {}) => {
  const [px, py] = hp(ax, ay);
  return <Label key={`${id}:${x}:${y}`} id={id} x={x} y={y} ax={px} ay={py} show={show} {...extra} />;
};
/** Blood cells along a path given in the heart's coordinates. */
const flowOf = (pts: Pt[]) => pts.map(([x, y]) => hp(x, y) as Pt);
const IN_HEART = `translate(500 330) scale(${HK}) translate(-500 -330)`;

/** The early frontal section: canal over the left ventricle, a sharp bulboventricular ridge, no septa. */
const EARLY: HeartState = { ...H0, canal: 0, ridge: 1, cushions: 0, cushionFuse: 0, ivMuscle: 0, veins: 0, flow: 0, lvAlso: ['atal-bentrikularra'] };

// ———————————————————————————— stage 7: atal bentrikularra (3.2) ————————————————————————————

export const S7 = [0, 0.36, 0.66] as const;

/** 10:atal-bentrikularra `frontala`: trabeculae → primitive LV; the primary interventricular foramen; the AV canal. */
export function VentricleFrontal({ t }: SceneProps) {
  const trabL = seg(t, 0.04, 0.22);
  const s: HeartState = { ...EARLY, trabL, trabR: 1 };
  const foramen = vis(t, S7[1]);
  const canal = vis(t, S7[2]);
  return (
    <g>
      <Defs11 />
      <HeartArt s={s} t={t} />
      {/* The primary interventricular foramen: the whole communication between the two primitive ventricles. */}
      <g transform={IN_HEART}>
        <Part id="bentrikulu-arteko-zulo-primarioa">
          <ellipse cx={516} cy={470} rx={30} ry={86} fill="url(#w11-gap)" opacity={0.35 + 0.4 * foramen} />
        </Part>
      </g>
      <Cells pts={flowOf([[640, 440], [560, 480], [516, 470], [470, 470], [390, 470], [340, 420]])} t={t} n={7} speed={3} colors={['#e5484d', '#3b82f6']} show={foramen} seed={4} />
      <Cells pts={flowOf([[560, 150], [588, 250], [588, 330], [610, 400], [640, 440]])} t={t} n={6} speed={3} colors={['#e5484d', '#3b82f6']} show={canal} seed={8} />

      {A('hasierako-eskuineko-bentrikulua', L, 470, 352, 470, 1)}
      {A('hasierako-ezkerreko-bentrikulua', R, 452, 660, 452)}
      {/* The segment it comes from: the same chamber, under its first name. */}
      {A('atal-bentrikularra', R, 406, 684, 474, 1, { small: true })}
      {A('muskulu-trenkadak', R, 548, 690, 520, trabL, { small: true })}
      {A('ertz-bulbobentrikularra', L, 372, 446, 400, 1, { small: true })}
      {A('bentrikulu-arteko-zulo-primarioa', L, 560, 516, 520, foramen)}
      {A('erreten-aurikulubentrikularra', R, 358, 600, 326, canal)}
      {A('aurikula-komuna', R - 30, 250, 640, 180, canal, { text: 'Atal aurikularra (aurikula komuna)' })}

      <Note x={500} y={18} size={12.5} tone="dim">
        4.–5. asteak · bihotzaren mozketa frontala, aurretik ikusita (enbrioiaren eskuina zure ezkerrean)
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, 0, S7[1])}>
        Atal bentrikularreko paretan muskulu trenkadak → hasierako ezkerreko bentrikulua (atal trabekulatua)
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S7[1], S7[2])}>
        Bi hasierako bentrikuluak bentrikulu arteko zulo primarioaren bidez komunikatuta
      </Note>
      <Note x={500} y={616} tone="accent" show={canal}>
        Atal aurikularretik bentrikulura, erreten aurikulubentrikularraren bidez
      </Note>
    </g>
  );
}

/** 10:atal-bentrikularra `3d`: the AV canal joins the ventricle to the common atrium left behind, up and back. */
export function VentricleScene({ t }: SceneProps) {
  const pose: HeartPose = { ...LOOPED, veins: 0.35, glass: 0.55 * vis(t, S7[2]) };
  const opts: HeartOpts = { cavity: 0.3, septum: 0.4, gut: 0.3, aortas: 0.3, flow: vis(t, S7[2]) > 0.01 ? { phase: t * 26, show: vis(t, S7[2]), mixed: true } : null };
  const camera = cameraAt(t, [
    [0, orbit(-30, 10, 9.6, [0, 0.15, 0], [40, 0])],
    [S7[2], orbit(56, 8, 9, [0, 0.15, -0.1], [40, 0])],
  ]);
  const m = heartModel(pose, opts);
  const way: V3[] = ['atal-aurikularra', 'erreten-aurikulubentrikularra', 'atal-bentrikularra'].map((k) => m.pts[k]).filter(Boolean);
  const late = vis(t, S7[2]);
  const names: CalloutSpec[] = [
    { id: 'atal-bentrikularra', p: 'atal-bentrikularra', show: 1, text: 'Atal bentrikularra (hasierako ezkerreko bentrikulua)' },
    { id: 'bulboaren-hurbileko-atala', p: 'bulboaren-hurbileko-atala', show: 1, text: 'Hurbileko atala (hasierako eskuineko bentrikulua)', small: true },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: late, text: 'Atal aurikularra (komuna)' },
    { id: 'erreten-aurikulubentrikularra', p: 'erreten-aurikulubentrikularra', show: late },
    { id: 'zain-sinua', p: 'zain-sinua', show: late, small: true },
  ];
  return (
    <HeartView
      pose={pose}
      opts={opts}
      camera={camera}
      names={names}
      caption="4.–5. asteak · bihotz lakioa (3D)"
      over={(at) => (
        <>
          {way.length === 3 && <Trail pts={way} at={at} show={late * 0.9} progress={seg(t, S7[2] + 0.02, S7[2] + 0.1)} color="#ffd27a" />}
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S7[2])}>
            Bi hasierako bentrikuluak lakioaren aurrealdean: hurbileko atala eskuinean, atal bentrikularra ezkerrean
          </Note>
          <Note x={500} y={612} tone="accent" show={late}>
            Atal aurikularra goi-atzekaldean geratu da: erreten aurikulubentrikularrak lotzen ditu
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— stage 8: atal aurikularra (3.3) ————————————————————————————

export const S8 = [0, 0.26, 0.5, 0.74] as const;

/** 10:atal-aurikularra `3d`: the truncus to the middle, the common atrium's two expansions, the planes, the sinus behind. */
export function AtriaScene({ t }: SceneProps) {
  const truncusMid = seg(t, 0.05, 0.18);
  const expand = seg(t, S8[1] + 0.03, S8[1] + 0.14);
  const pose: HeartPose = { ...LOOPED, truncusMid, expand, glass: 0.3 * vis(t, S8[3]) };
  const opts: HeartOpts = {
    cavity: lerp(0.8, 0.35, seg(t, S8[1], S8[1] + 0.03)),
    septum: 0.45,
    gut: lerp(0.3, 0.05, vis(t, S8[3])),
    aortas: lerp(0.5, 0.12, vis(t, S8[3])),
    ghost: t < S8[1] ? { ...pose, truncusMid: 0 } : null,
    flow: vis(t, S8[3]) > 0.01 ? { phase: t * 26, show: vis(t, S8[3]), mixed: true } : null,
  };
  const camera = cameraAt(t, [
    [0, orbit(0, 10, 10.4, [0, 0.2, 0], [40, 0])],
    [S8[1], orbit(10, 14, 9.6, [0, 0.35, -0.1], [40, 0])],
    [S8[2], orbit(-86, 8, 10.2, [0, 0.15, -0.1], [40, 0])],
    [S8[3], orbit(165, 20, 10.4, [0, 0, -0.3], [40, 0])],
  ]);
  const a0 = vis(t, 0, S8[1]);
  const a1 = vis(t, S8[1]);
  const planes = vis(t, S8[2], S8[3]);
  const back = vis(t, S8[3]);
  const names: CalloutSpec[] = [
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: a0 + planes * 0 },
    { id: 'perikardio-barrunbea', p: 'perikardio-barrunbea', show: a0, small: true },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: vis(t, S8[1], S8[2]), text: 'Aurikula komuna' },
    { id: 'hasierako-eskuineko-aurikula', p: 'hasierako-eskuineko-aurikula', show: vis(t, S8[1] + 0.08, S8[2]) },
    { id: 'hasierako-ezkerreko-aurikula', p: 'hasierako-ezkerreko-aurikula', show: vis(t, S8[1] + 0.08, S8[2]) },
    { id: 'atal-bentrikularra', p: 'atal-bentrikularra', show: planes, text: 'Bentrikuluak (aurre-eskuinean)' },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: vis(t, S8[2]), text: 'Aurikulak (goi-atzekaldean)', key: 'atal-aurikularra:planes' },
    { id: 'zain-sinua', p: 'zain-sinuaren-zeharkako-atala', show: back },
    { id: 'eskuineko-sinu-luzapena', p: 'eskuineko-sinu-luzapena', show: back, small: true },
    { id: 'ezkerreko-sinu-luzapena', p: 'ezkerreko-sinu-luzapena', show: back, small: true },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna0', show: back, small: true, key: 'bkk:r' },
    { id: 'zilbor-zainak', p: 'zilbor-zainak1', show: back, small: true, key: 'zz:l' },
    { id: 'bitelo-zainak', p: 'bitelo-zainak1', show: back, small: true, key: 'bz:l' },
  ];
  void a1;
  return (
    <HeartView
      pose={pose}
      opts={opts}
      camera={camera}
      names={names}
      caption={back > 0.5 ? '5. astea · bihotza atzetik (3D)' : planes > 0.5 ? '5. astea · bihotza eskuinetik (3D)' : '4.–5. asteak · bihotza aurretik (3D)'}
      over={() => (
        <>
          <Note x={500} y={612} tone="accent" show={a0}>
            Enbor arteriosoa barrunbe perikardikoaren eskuinetik erdira mugitzen da (zuri gardena: hasierako kokapena)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S8[1], S8[2])}>
            Aurikula komunean bi alboko zabalkuntza: hasierako eskuineko eta ezkerreko aurikulak, enborraren bi aldeetan
          </Note>
          <Note x={500} y={612} tone="accent" show={planes}>
            Plano ezberdinak: bentrikuluak aurre-eskuinaldean, aurikulak goi-atzekaldean
          </Note>
          <Note x={500} y={612} tone="accent" show={back}>
            Atzekaldean aurikulak zain sinuarekin komunikatuta: hortaz, zain guztiekin
          </Note>
        </>
      )}
    />
  );
}

/** 10:atal-aurikularra `frontala`: the common atrium and its two lateral expansions, in the frontal section. */
export function AtriaFrontal({ t }: SceneProps) {
  const k = seg(t, S8[1] + 0.03, S8[1] + 0.14);
  const s: HeartState = { ...EARLY, canal: 0.25 * k, ridge: 1 - 0.2 * k };
  const two = vis(t, S8[1] + 0.08);
  return (
    <g>
      <Defs11 />
      <HeartArt s={s} t={t} />
      {A('aurikula-komuna', R, 70, 560, 160, 1)}
      {A('hasierako-eskuineko-aurikula', L, 170, 300, 200, two)}
      {A('hasierako-ezkerreko-aurikula', R, 244, 700, 210, two)}
      {A('erreten-aurikulubentrikularra', R, 358, 600, 326, 1, { small: true })}
      {A('hasierako-eskuineko-bentrikulua', L, 470, 352, 470, 1, { small: true })}
      {A('hasierako-ezkerreko-bentrikulua', R, 470, 660, 470, 1, { small: true })}
      <Note x={500} y={18} size={12.5} tone="dim">
        5. astea · mozketa frontala, aurretik ikusita
      </Note>
      <Note x={500} y={616} tone="accent" show={1}>
        Aurikula komunaren bi alboko zabalkuntzak: hasierako eskuineko eta ezkerreko aurikulak (oraindik trenkadarik gabe)
      </Note>
    </g>
  );
}

// ———————————————————————————— stage 9: zain sinua (3.4 p3–p9) ————————————————————————————

export const S9 = [0, 0.16, 0.34, 0.52, 0.7, 0.86] as const;

/** 10:zain-sinua `3d`: the back of the heart (as the notes' figure): horns, veins, orifice, the left side closing. */
export function SinusBack({ t }: SceneProps) {
  const hole = vis(t, S9[1] - 0.01);
  const anast = seg(t, S9[2] + 0.02, S9[2] + 0.08);
  const ob0 = seg(t, S9[2] + 0.07, S9[2] + 0.12);
  const ob1 = seg(t, S9[2] + 0.12, S9[2] + 0.16);
  const coronary = seg(t, S9[3] + 0.02, S9[3] + 0.1);
  const shift = lerp(0, 0.55, seg(t, S9[2] + 0.09, S9[2] + 0.16)) + lerp(0, 0.45, seg(t, S9[4] + 0.02, S9[4] + 0.1));
  const pose: HeartPose = {
    ...LOOPED,
    truncusMid: 1,
    expand: 1,
    arches: 3,
    shift,
    obliterate: [ob0, ob1],
    anast,
    coronary,
    hole,
    glass: 0.45 * vis(t, S9[1], S9[2]),
  };
  const mixing = vis(t, S9[1], S9[2]);
  // While the anastomoses form and the left veins close: the blood in the veins, the left side's crossing
  // to the right horn as each of its veins closes.
  const rerouting = vis(t, S9[2], S9[3]);
  const opts: HeartOpts = {
    cavity: 0.15,
    septum: 0.35,
    gut: 0.2,
    aortas: 0.35,
    flow: mixing > 0.01 || rerouting > 0.01 ? { phase: t * 26, show: mixing, mixed: true, vessels: rerouting } : null,
  };
  const camera = cameraAt(t, [
    // Stage 8 ends seen from behind (and says so): start there, then settle straight behind.
    [0, orbit(165, 20, 10.4, [0, 0, -0.3], [40, 0])],
    [0.03, orbit(180, 14, 10.2, [0, -0.1, -0.3], [40, 0])],
    [S9[1], orbit(180, 8, 8.2, [0, 0.05, -0.35], [40, 0])],
    [S9[2], orbit(186, 24, 11.2, [0, -0.45, -0.4], [40, 0])],
    [S9[3], orbit(140, 14, 8.8, [0.25, 0.1, -0.35], [40, 0])],
    [S9[4], orbit(200, 12, 9.4, [-0.1, 0, -0.35], [40, 0])],
  ]);
  const b0 = vis(t, 0.03, S9[2]);
  const b2 = vis(t, S9[2], S9[3]);
  const b3 = vis(t, S9[3], S9[4]);
  const b4 = vis(t, S9[4]);
  const names: CalloutSpec[] = [
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: vis(t, 0.03, S9[1]), text: 'Aurikula komuna' },
    { id: 'zain-sinuaren-zeharkako-atala', p: 'zain-sinuaren-zeharkako-atala', show: vis(t, 0.04, S9[1]) },
    { id: 'eskuineko-sinu-luzapena', p: 'eskuineko-sinu-luzapena', show: vis(t, 0.05, S9[2]) + b4 },
    { id: 'ezkerreko-sinu-luzapena', p: 'ezkerreko-sinu-luzapena', show: vis(t, 0.05, S9[2]) + b2 },
    { id: 'zilbor-zainak', p: 'zilbor-zainak0', show: b0 * vis(t, 0.07), small: true, key: 'zz:r' },
    { id: 'zilbor-zainak', p: 'zilbor-zainak1', show: b0 * vis(t, 0.07), small: true, key: 'zz:l' },
    { id: 'bitelo-zainak', p: 'bitelo-zainak0', show: b0 * vis(t, 0.08), small: true, key: 'bz:r' },
    { id: 'bitelo-zainak', p: 'bitelo-zainak1', show: b0 * vis(t, 0.08), small: true, key: 'bz:l' },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna0', show: b0 * vis(t, 0.09), small: true, key: 'bkk:r' },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna1', show: b0 * vis(t, 0.09), small: true, key: 'bkk:l' },
    { id: 'zulo-sinoaurikularra', p: 'zulo-sinoaurikularra', show: vis(t, S9[1], S9[2]) + b4 },
    { id: 'anastomosiak', p: 'anastomosiak', show: b2 * vis(t, S9[2] + 0.03) },
    { id: 'eskuineko-zilbor-zaina', p: 'eskuineko-zilbor-zaina', show: b2 * vis(t, S9[2] + 0.02, S9[2] + 0.12), small: true },
    { id: 'ezkerreko-zain-bitelinoa', p: 'ezkerreko-zain-bitelinoa', show: b2 * vis(t, S9[2] + 0.02, S9[2] + 0.12), small: true },
    { id: 'ezkerreko-kardinal-komuna', p: 'ezkerreko-kardinal-komuna', show: b2 * vis(t, S9[2] + 0.02, S9[2] + 0.165), small: true },
    { id: 'sinu-koronarioa', p: 'sinu-koronarioa', show: b3 * vis(t, S9[3] + 0.06) },
    { id: 'ezkerreko-aurikularen-zain-laprana', p: 'ezkerreko-aurikularen-zain-laprana', show: b3 * vis(t, S9[3] + 0.07) },
    { id: 'hasierako-eskuineko-aurikula', p: 'hasierako-eskuineko-aurikula', show: b4, small: true },
  ];
  return (
    <HeartView
      pose={pose}
      opts={opts}
      camera={camera}
      names={names}
      caption="4. astea → · bihotza ATZETIK (3D): enbrioiaren eskuina zure eskuinean"
      over={(_, asked) => (
        <>
          <Note x={500} y={62} size={13} tone="warn" show={vis(t, 0.03, S9[1]) * asked}>
            KONTUZ! Atzetik ikusita: eskuina eta ezkerra ez dira alderantzizkatu behar
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, 0.03, S9[1])}>
            Zain sinua: zeharkako atala eta bi luzapen; bakoitzean hiru zain (bitelinoa, zilborrekoa, kardinal komuna)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S9[1], S9[2])}>
            Zulo sinoaurikularra (hasieran oso zabala): zilborreko odol oxigenatua eta bitelinoen odola nahasten dira
          </Note>
          <Note x={500} y={612} tone="accent" show={b2}>
            Anastomosiak: ezkerreko odola eskuinera · 4. asterako eskuineko zilbor zaina eta ezkerreko bitelinoa, ≈10. astean ezkerreko kardinal komuna
          </Note>
          <Note x={500} y={612} tone="accent" show={b3}>
            Ezkerreko luzapena txikitzen da: sinu koronarioa eta ezkerreko aurikularen zain laprana bakarrik geratzen dira
          </Note>
          <Note x={500} y={612} tone="accent" show={b4}>
            Eskuineko luzapena handitzen da, eta zulo sinoaurikularra eskuinera (hasierako eskuineko aurikulara) mugitzen da
          </Note>
        </>
      )}
    />
  );
}

/** 10:zain-sinua `frontala` (the notes' p9 caption): an anterior section, the common atrium from the front; through the orifice, the sinus behind. */
export function SinusFrontal({ t }: SceneProps) {
  const k = seg(t, S9[4] + 0.02, S9[5] + 0.06);
  const s: HeartState = { ...EARLY, canal: 0.3, ridge: 0.8 };
  // The orifice in the atrium's back wall: wide in the middle, then narrower and to the right (viewer's left).
  const cx = lerp(500, 360, k);
  const rx = lerp(78, 40, k);
  const ry = lerp(46, 56, k);
  const cy = 190;
  return (
    <g>
      <Defs11 />
      <defs>
        <radialGradient id="w10-sinus-through" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#b9a2ff" />
          <stop offset="0.7" stopColor="#7b5bd6" />
          <stop offset="1" stopColor="#2b1a55" />
        </radialGradient>
      </defs>
      <HeartArt s={s} t={t} />
      <g transform={IN_HEART}>
        <Part id="zain-sinua">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#w10-sinus-through)" />
        </Part>
        <Part id="zulo-sinoaurikularra">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#1a0710" strokeWidth={7} />
          <ellipse cx={cx} cy={cy} rx={rx + 4} ry={ry + 4} fill="none" stroke="#ffd0dc" strokeWidth={1.5} opacity={0.6} />
        </Part>
      </g>
      <Cells pts={flowOf([[cx - 10, cy], [cx - 20, cy + 60], [cx - 40, 260], [k > 0.5 ? 400 : 520, 290]])} t={t} n={6} speed={3} colors={['#e5484d', '#3b82f6']} seed={6} />
      {A('zulo-sinoaurikularra', R, 120, cx + rx * 0.5, cy - ry * 0.4)}
      {A('zain-sinua', L + 14, 96, cx - rx * 0.3, cy + 6, 1, { text: 'Zain sinua (atzean, zulotik ikusita)', small: true })}
      {A('hasierako-eskuineko-aurikula', L, 230, 290, 230)}
      {A('hasierako-ezkerreko-aurikula', R, 230, 710, 230)}
      {A('aurikula-komuna', R, 290, 560, 250, 1, { small: true })}
      <Note x={500} y={18} size={12.5} tone="dim">
        Aurreko mozketa · aurikula komunaren aurreko ikuspegia (enbrioiaren eskuina zure ezkerrean)
      </Note>
      <Note x={500} y={616} tone="accent">
        {k < 0.5 ? 'Zulo sinoaurikularra erdian eta zabala, aurikula komunaren atzeko paretan' : 'Zuloa eskuinerantz: hasierako eskuineko aurikularen atzeko paretan geratzen da'}
      </Note>
    </g>
  );
}
