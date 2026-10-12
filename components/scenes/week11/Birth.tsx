'use client';

import { Label, Note, dual, lerp, seg, type SceneProps } from '@/components/kit';
import { Defs11, Steps } from './common';
import { FaceArt, FACE, FO_CENTER, type FaceState } from './septal';
import { H0, HeartArt, SEC_X, foBox, hp, primumAxis, secundumBottom, type HeartState } from './heart';

/** Which pane of a dual view a scene is drawn in (left or right); unset when it is the whole view. */
type Pane = 'L' | 'R';

/**
 * 11:jaiotza — section 2.2 of the notes, last part: at birth the lungs return blood to the left atrium,
 * its pressure presses septum primum (the valve) against septum secundum, and they fuse over the first
 * year; in 20 % of cases a slit stays open and venous blood mixes into the left atrium.
 */

/** Beat starts of the stage (content/weeks/week11.ts uses the same values). */
export const P3 = [0, 0.13, 0.27, 0.41, 0.55, 0.71, 0.85] as const;

function birthStage(t: number) {
  const born = t >= P3[0] + 0.05;
  const laFill = lerp(0.15, 0.5, seg(t, P3[1], P3[2] - 0.02)) + lerp(0, 0.5, seg(t, P3[2], P3[3] - 0.02));
  const press = lerp(0, 0.3, seg(t, P3[2] + 0.03, P3[3] - 0.02)) + lerp(0, 0.7, seg(t, P3[3], P3[4] - 0.03));
  const fuse = seg(t, P3[4], P3[5] - 0.03);
  // From the 20 % step on: the same heart with the fusion left incomplete (a slit under septum secundum).
  const patent = t >= P3[5];
  const mixLA = seg(t, P3[6], 0.97);
  return { born, laFill, press: patent ? lerp(1, 0.8, seg(t, P3[5], P3[5] + 0.06)) : press, fuse: patent ? 0.55 : fuse, patent, mixLA };
}

const heart = (t: number): HeartState => {
  const k = birthStage(t);
  return {
    ...H0,
    primum: 0.8,
    closeOP: 1,
    os2: 1,
    stub: 1,
    secundum: 1,
    cushions: 1,
    cushionFuse: 1,
    ivMuscle: 1,
    ivMembrane: 1,
    valves: 0,
    fibrous: 0,
    smooth: 0.6,
    press: k.press,
    fuse: k.fuse,
    patent: k.patent,
    blood: k.born ? 'born' : 'fetal',
    laFill: k.laFill,
    mixLA: k.mixLA,
    adult: true,
    flow: 1,
  };
};
const face = (t: number): FaceState => {
  const k = birthStage(t);
  return { primum: 0.8, closeOP: 1, os2: 1, stub: 1, secundum: 1, spurium: 1, cushions: 1, press: k.press, fuse: k.fuse, patent: k.patent, flow: 1, adult: true };
};

const STEPS: [number, string][] = [
  [P3[0], 'Jaiotza: birika zirkulazioa eratzen da'],
  [P3[1], 'Odol oxigenatua birika zainetatik ezkerreko aurikulara'],
  [P3[2], 'Odol gehiago → ezkerreko aurikulako presioa handitzen da'],
  [P3[3], 'Septum primuma septum secundumaren aurka presionatzen da'],
  [P3[4], 'Fusionatzen hasten dira: jaio ondoren eta 1. urtean zehar'],
  [P3[5], '%20 kasuetan fusioa ez da osoa: arraildura txiki bat'],
  [P3[6], 'Odola ezkerreko aurikulan nahasten da: jaioberria zianotikoa'],
];

export function BirthFrontal({ t, pane }: SceneProps & { pane?: Pane }) {
  const s = heart(t);
  return (
    <g>
      <Defs11 />
      <HeartArt s={s} t={t} />
      {BirthLabels({ s, pane })}
      {!pane && (
        <Note x={500} y={18} size={12.5} tone="dim">
          Jaiotza · bihotzaren mozketa frontala, aurretik ikusita
        </Note>
      )}
      {/* In a dual view the left pane gives the step caption (lifted as a note), the right pane none. */}
      {pane !== 'R' && Steps({ t, steps: STEPS, y: 630 })}
    </g>
  );
}

export function BirthFace({ t, pane }: SceneProps & { pane?: Pane }) {
  const s = face(t);
  return (
    <g>
      <Defs11 />
      <FaceArt s={s} t={t} />
      {BirthFaceLabels({ s, pane })}
      {!pane && (
        <Note x={500} y={18} size={12.5} tone="dim">
          Aurikula arteko trenkada, eskuineko aurikularen barrutik ikusita
        </Note>
      )}
      {/* In a dual view the left pane gives the step caption (lifted as a note), the right pane none. */}
      {pane !== 'R' && Steps({ t, steps: STEPS, y: 630 })}
    </g>
  );
}

function BirthLabels({ s, pane }: { s: HeartState; pane?: Pane }) {
  const secB = secundumBottom(s);
  const L = 232;
  const R = 768;
  const A = (id: string, x: number, y: number, ax: number, ay: number) => {
    const [px, py] = hp(ax, ay);
    return <Label key={id} id={id} x={x} y={y} ax={px} ay={py} />;
  };
  return (
    <>
      {!pane && A('goiko-kaba-zaina', L, 50, 341, 40)}
      {pane !== 'R' && A('eskuineko-aurikula', L, 176, 254, 200)}
      {pane !== 'L' && A('septum-secundum', L, 224, SEC_X, secB - 40)}
      {pane !== 'L' && A('zulo-obala', L, 268, SEC_X, foBox(s).cy)}
      {!pane && A('beheko-kaba-zaina', L, 560, 224, 560)}
      {!pane && s.blood === 'born' && A('birika-zainak', R, 100, 782, 132)}
      {pane !== 'L' && A('zulo-obalaren-balbula', R, 268, primumAxis(s, 250), 250)}
      {/* In the magnifier the left atrium is named next to the septum (its own side of the picture). */}
      {!pane && A('ezkerreko-aurikula-jaiotakoan', R, 236, 750, 208)}
      {pane === 'R' && A('ezkerreko-aurikula-jaiotakoan', R, 236, 578, 170)}
    </>
  );
}

function BirthFaceLabels({ pane }: { s: FaceState; pane?: Pane }) {
  const L = 232;
  const R = 768;
  return (
    <>
      {!pane && <Label id="goiko-kaba-zaina" x={L} y={40} ax={262} ay={40} />}
      <Label id="eskuineko-aurikula" x={L} y={430} ax={FACE.X0 - 50} ay={430} />
      {!pane && <Label id="beheko-kaba-zaina" x={L} y={600} ax={240} ay={600} />}
      <Label id="septum-secundum" x={R} y={92} ax={640} ay={FACE.ROOF + 90} />
      <Label id="zulo-obala" x={R} y={362} ax={FO_CENTER[0]} ay={FO_CENTER[1]} />
      <Label id="zulo-obalaren-balbula" x={R} y={430} ax={600} ay={420} />
    </>
  );
}

/** The whole heart beside a magnifier on the two septa: the flap pressing and fusing is a few units wide. */
export const BirthBoth = dual(
  { scene: (p: SceneProps) => BirthFrontal({ ...p, pane: 'L' }), title: 'Mozketa frontala · aurretik', fx: 500, fy: 300, s: 0.64 },
  { scene: (p: SceneProps) => BirthFrontal({ ...p, pane: 'R' }), title: 'Lupa: bi trenkadak, aurretik', fx: 492, fy: 228, s: 1.55 },
  { split: 500 },
);
