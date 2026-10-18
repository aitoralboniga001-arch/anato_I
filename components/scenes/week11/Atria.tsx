'use client';

import { Label, Note, dual, lerp, seg, type SceneProps } from '@/components/kit';
import { Defs11, Steps } from './common';
import { FaceArt, FACE, FO_CENTER, os2Holes, type FaceState } from './septal';
import { FLOOR, H0, HeartArt, ROOF, SEC_X, canalOf, foBox, hp, primumAxis, primumGeom, secundumBottom, type HeartState } from './heart';

/** Which pane of a dual view a scene is drawn in (left or right); unset when it is the whole view. */
type Pane = 'L' | 'R';

/**
 * 11:septum-primum and 11:zulo-obala — section 2 of the notes. Two views of the same moment: the heart in
 * frontal section (where the blood goes) and the interatrial septum seen from inside the right atrium
 * (what shape each septum and opening has). Shown side by side by default.
 */

/* ---------- 11:septum-primum (2.1) ---------- */

/** Beat starts of the stage (content/weeks/week11.ts uses the same values). */
export const P1 = [0, 0.14, 0.3, 0.46, 0.58, 0.7, 0.84] as const;

export function primumStage(t: number) {
  const primum = lerp(0, 0.3, seg(t, P1[1], P1[2] - 0.02)) + lerp(0, 0.44, seg(t, P1[2], P1[3] - 0.02)) + lerp(0, 0.08, seg(t, P1[4], P1[5] - 0.02));
  const cushions = lerp(0.35, 1, seg(t, P1[3], P1[4] - 0.02));
  const cushionFuse = seg(t, P1[3] + 0.04, P1[4] - 0.01);
  const os2 = seg(t, P1[5], P1[6] - 0.02);
  const closeOP = seg(t, P1[6], 0.98);
  return { primum, cushions, cushionFuse, os2, closeOP };
}

const heart1 = (t: number): HeartState => {
  const k = primumStage(t);
  return { ...H0, ...k, ivMuscle: 0.35, canal: 1, flow: 1 };
};
const face1 = (t: number): FaceState => {
  const k = primumStage(t);
  return { ...k, stub: 0, secundum: 0, spurium: 0, press: 0, fuse: 0, flow: 1 };
};

export const STEPS1: [number, string][] = [
  [P1[0], 'Aurikula komuna: bi alboko zabalkuntza, baina trenkadarik ez'],
  [P1[1], '4. astearen amaiera: sabaian septum primuma'],
  [P1[2], 'Septum primuma behera hazten da, erreten AB-rantz'],
  [P1[3], 'Erretenaren inguruan endokardio kuxinak: goikoa eta behekoa'],
  [P1[4], 'Ostium primuma: septum primumaren eta kuxinen artean'],
  [P1[5], 'Itxi aurretik, septum primumaren goiko aldean: ostium secunduma'],
  [P1[6], 'Kuxinen luzapenek ostium primuma ixten dute'],
];

/** 11:septum-primum `frontala`: the heart in frontal section. */
export function PrimumFrontal({ t, pane }: SceneProps & { pane?: Pane }) {
  const s = heart1(t);
  return (
    <g>
      <Defs11 />
      <HeartArt s={s} t={t} />
      {SectionLabels({ s, t, pane })}
      {!pane && (
        <Note x={500} y={18} size={12.5} tone="dim">
          4.–5. asteak · bihotzaren mozketa frontala, aurretik ikusita
        </Note>
      )}
      {/* In a dual view the left pane gives the step caption (lifted as a note), the right pane none. */}
      {pane !== 'R' && Steps({ t, steps: STEPS1, y: 630 })}
    </g>
  );
}

/** 11:septum-primum `eskuinetik`: the septum from inside the right atrium. */
export function PrimumFace({ t, pane }: SceneProps & { pane?: Pane }) {
  const s = face1(t);
  return (
    <g>
      <Defs11 />
      <FaceArt s={s} t={t} />
      {FaceLabels({ s, pane })}
      {!pane && (
        <Note x={500} y={18} size={12.5} tone="dim">
          Aurikula arteko trenkada, eskuineko aurikularen barrutik ikusita
        </Note>
      )}
      {/* In a dual view the left pane gives the step caption (lifted as a note), the right pane none. */}
      {pane !== 'R' && Steps({ t, steps: STEPS1, y: 630 })}
    </g>
  );
}

/* ---------- 11:zulo-obala (2.2: septum secundum, foramen ovale, the oblique path) ---------- */

export const P2 = [0, 0.12, 0.27, 0.42, 0.55, 0.67, 0.82] as const;

export function secundumStage(t: number) {
  const secundum = lerp(0, 0.45, seg(t, P2[1], P2[2] - 0.02)) + lerp(0, 0.55, seg(t, P2[2], P2[3] - 0.02));
  const spurium = seg(t, P2[3], P2[4] - 0.02);
  const stub = seg(t, P2[6], 0.97);
  return { secundum, spurium, stub };
}
const heart2 = (t: number): HeartState => {
  const k = secundumStage(t);
  return { ...H0, primum: 0.8, closeOP: 1, os2: 1, cushions: 1, cushionFuse: 1, secundum: k.secundum, stub: k.stub, ivMuscle: 0.55, smooth: lerp(0.15, 0.6, seg(t, 0, P2[1])), flow: 1 };
};
const face2 = (t: number): FaceState => {
  const k = secundumStage(t);
  return { primum: 0.8, closeOP: 1, os2: 1, cushions: 1, secundum: k.secundum, spurium: k.spurium, stub: k.stub, press: 0, fuse: 0, flow: 1 };
};

export const STEPS2: [number, string][] = [
  [P2[0], 'Abiapuntua: septum primuma, ostium secunduma goian; ostium primuma itxita'],
  [P2[1], 'Septum primumaren eskuinaldean, sabaitik: septum secunduma'],
  [P2[2], 'Septum secunduma ere ez da osoa: beheko aldean zulo obala'],
  [P2[3], 'Septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira'],
  [P2[4], 'Bi trenkada: aurikula arteko trenkada'],
  [P2[5], 'Ibilbide laprana: zulo obala → bi trenkaden artean gora → ostium secunduma'],
  [P2[6], 'Septum primumaren goiko ataltxoa desagertu: beheko atala = zulo obalaren balbula'],
];

export function SecundumFrontal({ t, pane }: SceneProps & { pane?: Pane }) {
  const s = heart2(t);
  return (
    <g>
      <Defs11 />
      <HeartArt s={s} t={t} />
      {SectionLabels({ s, t, pane })}
      {!pane && (
        <Note x={500} y={18} size={12.5} tone="dim">
          5. astea · bihotzaren mozketa frontala, aurretik ikusita
        </Note>
      )}
      {/* In a dual view the left pane gives the step caption (lifted as a note), the right pane none. */}
      {pane !== 'R' && Steps({ t, steps: STEPS2, y: 630 })}
    </g>
  );
}

export function SecundumFace({ t, pane }: SceneProps & { pane?: Pane }) {
  const s = face2(t);
  return (
    <g>
      <Defs11 />
      <FaceArt s={s} t={t} />
      {FaceLabels({ s, pane })}
      {!pane && (
        <Note x={500} y={18} size={12.5} tone="dim">
          Aurikula arteko trenkada, eskuineko aurikularen barrutik ikusita
        </Note>
      )}
      {/* In a dual view the left pane gives the step caption (lifted as a note), the right pane none. */}
      {pane !== 'R' && Steps({ t, steps: STEPS2, y: 630 })}
    </g>
  );
}

/* ---------- labels ---------- */

/** Names of the frontal section, shared by the atrial stages. In a dual pane the ventricles stay unnamed. */
function SectionLabels({ s, pane }: { s: HeartState; t: number; pane?: Pane }) {
  const p = primumGeom(s);
  const secB = secundumBottom(s);
  const { cx } = canalOf(s);
  const hole = p.holes[p.holes.length - 1];
  const lowTop = s.os2 > 0.3 ? Math.max(hole[1], ROOF) : ROOF;
  const primumY = Math.min(p.bottom - 8, (Math.max(lowTop, ROOF) + p.bottom) / 2);
  const opTop = p.bottom + 4;
  const showOP = s.primum > 0.05 && s.closeOP < 0.8;
  const L = 232;
  const R = 768;
  // Anchors are given in the heart's own coordinates and drawn where the scaled heart puts them.
  const A = (id: string, x: number, y: number, ax: number, ay: number) => {
    const [px, py] = hp(ax, ay);
    return <Label key={id} id={id} x={x} y={y} ax={px} ay={py} />;
  };
  return (
    <>
      {A('goiko-kaba-zaina', L, 50, 341, 40)}
      {A('hasierako-eskuineko-aurikula', L, 176, 254, 200)}
      {s.secundum > 0.15 && A('septum-secundum', L, 224, SEC_X, Math.max(ROOF + 10, secB - 30))}
      {s.secundum > 0.6 && A('zulo-obala', L, 266, SEC_X, foBox(s).cy)}
      {!pane && A('hasierako-eskuineko-bentrikulua', L, 470, 278, 470)}
      {!pane && A('beheko-kaba-zaina', L, 560, 224, 560)}
      {s.primum > 0.05 && (s.stub > 0.5 ? A('zulo-obalaren-balbula', R, 262, primumAxis(s, (p.bottom + Math.max(lowTop, 214)) / 2), (p.bottom + Math.max(lowTop, 214)) / 2) : A('septum-primum', R, 120, p.x, Math.min(primumY, ROOF + 12)))}
      {s.os2 > 0.35 && A('ostium-secunduma', R, 152, p.x + 1, (hole[0] + hole[1]) / 2)}
      {!pane && A('hasierako-ezkerreko-aurikula', R, 236, 750, 208)}
      {showOP && A('ostium-primuma', R, 284, p.x + 12, opTop + Math.max(3, ((FLOOR - 6 - opTop) * (1 - s.closeOP)) / 2))}
      {A('kuxin-aurikulubentrikularrak', R, 364, cx, 330)}
      {!pane && A('hasierako-ezkerreko-bentrikulua', R, 470, 730, 470)}
    </>
  );
}

/** Names of the view from the right atrium. */
function FaceLabels({ s, pane }: { s: FaceState; pane?: Pane }) {
  const holes = os2Holes(s.os2);
  const h = holes[0];
  const showOP = s.primum > 0.05 && s.closeOP < 0.8;
  const edgeY = lerp(FACE.ROOF + 24, FACE.CUSH - 6, s.primum);
  const L = 232;
  const R = 768;
  return (
    <>
      {s.spurium > 0.3 && <Label id="septum-spurium" x={L} y={110} ax={FACE.X0 + 60} ay={FACE.ROOF + 26} />}
      {s.spurium > 0.3 && <Label id="ezkerreko-zain-balbula" x={L} y={262} ax={FACE.X0 + 34} ay={290} />}
      {!pane && <Label id="goiko-kaba-zaina" x={L} y={40} ax={262} ay={40} />}
      <Label id="hasierako-eskuineko-aurikula" x={L} y={430} ax={FACE.X0 - 50} ay={430} />
      {!pane && <Label id="beheko-kaba-zaina" x={L} y={600} ax={240} ay={600} />}
      {s.secundum > 0.15 && <Label id="septum-secundum" x={R} y={92} ax={640} ay={FACE.ROOF + 30 + 60 * s.secundum} />}
      {s.primum > 0.05 && s.stub < 0.5 && <Label id="septum-primum" x={R} y={s.secundum > 0.3 ? 404 : 140} ax={s.secundum > 0.3 ? 560 : 600} ay={s.secundum > 0.3 ? 420 : s.primum > 0.4 ? 300 : FACE.ROOF + 14} />}
      {s.os2 > 0.35 && h.rx > 10 && <Label id="ostium-secunduma" x={R} y={196} ax={h.c[0]} ay={h.c[1]} />}
      {s.secundum > 0.6 && <Label id="zulo-obala" x={R} y={362} ax={FO_CENTER[0]} ay={FO_CENTER[1]} />}
      {s.stub >= 0.5 && <Label id="zulo-obalaren-balbula" x={R} y={430} ax={600} ay={420} />}
      {showOP && <Label id="ostium-primuma" x={R} y={430} ax={FACE.CX} ay={(edgeY + FACE.CUSH) / 2 + 4} />}
      <Label id="kuxin-aurikulubentrikularrak" x={R} y={520} ax={560} ay={512} />
    </>
  );
}

/* ---------- side by side ---------- */

export const PrimumBoth = dual(
  { scene: (p: SceneProps) => PrimumFrontal({ ...p, pane: 'L' }), title: 'Mozketa frontala · aurretik', fx: 500, fy: 300, s: 0.64 },
  { scene: (p: SceneProps) => PrimumFace({ ...p, pane: 'R' }), title: 'Eskuineko aurikulatik · ezkerrean atzekoa', fx: 500, fy: 316, s: 0.6 },
  { split: 500 },
);
export const SecundumBoth = dual(
  { scene: (p: SceneProps) => SecundumFrontal({ ...p, pane: 'L' }), title: 'Mozketa frontala · aurretik', fx: 500, fy: 300, s: 0.64 },
  { scene: (p: SceneProps) => SecundumFace({ ...p, pane: 'R' }), title: 'Eskuineko aurikulatik · ezkerrean atzekoa', fx: 500, fy: 316, s: 0.6 },
  { split: 500 },
);
