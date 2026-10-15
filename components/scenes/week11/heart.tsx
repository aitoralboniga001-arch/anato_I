'use client';

import { Part, clamp, lerp, type Pt } from '@/components/kit';
import { Cells, Cushion, K, Tissue, Trabeculae, blob, curve, f1 } from './common';

/**
 * The embryonic heart in frontal section, seen from the front (the patient's right on the viewer's left),
 * as in the notes' figures: atria above, the atrioventricular canal, the two primitive ventricles below.
 * One drawing serves every septation stage; `HeartState` says how far each process has gone, so the same
 * heart grows from the common atrium to the four chambers and the student never meets a new picture.
 *
 * Coordinates are the 1000×640 frame. Interatrial plane at x = 500; septum secundum lies on its right side
 * (the viewer's left), septum primum on its left side (the viewer's right). Colours: see common.tsx.
 */
export interface HeartState {
  /** Septum primum: 0 = none, 1 = reaches the cushions. */
  primum: number;
  /** Ostium primum closed by the cushions' extensions (0 open … 1 closed). */
  closeOP: number;
  /** Ostium secundum: perforations in the upper septum primum (0 none … 1 one opening). */
  os2: number;
  /** The small upper part of septum primum above the ostium secundum disappears (0 … 1 gone). */
  stub: number;
  /** Septum secundum grown from the roof (0 … 1). */
  secundum: number;
  /** Birth: septum primum (the flap) pressed against septum secundum (0 … 1), and fused (0 … 1). */
  press: number;
  fuse: number;
  /** Patent foramen ovale: a slit stays open after birth. */
  patent?: boolean;
  /** AV canal: 0 = over the primitive left ventricle only, 1 = centred over both ventricles. */
  canal: number;
  /** Bulboventricular ridge: 1 = sharp, 0 = flattened. */
  ridge: number;
  /** AV cushions: growth of the lateral and of the superior/inferior cushions, and their fusion. */
  cushions: number;
  cushionFuse: number;
  /** Muscular interventricular septum grown from the apex (0 … 1). */
  ivMuscle: number;
  /** Membranous part closing the interventricular foramen (0 … 1). */
  ivMembrane: number;
  /** AV valves: 0 = mesenchymal swellings, 1 = thin leaflets with chordae and papillary muscles. */
  valves: number;
  /** Chordae: 0 muscular … 1 fibrous. */
  fibrous: number;
  /** Sinus venosus incorporated into the RA posterior wall (violet smooth part), 0 … 1. */
  smooth: number;
  /** Pulmonary veins incorporated into the LA posterior wall, 0 … 1. */
  pulm: number;
  /** Blood: fetal (RA blood crosses to the LA), born (lungs carry it), and its visibility. */
  blood: 'fetal' | 'born';
  flow: number;
  /** Venae cavae and pulmonary veins drawn. */
  veins: number;
  /** After birth: the atria are the definitive ones (their own ids). */
  adult?: boolean;
  /** Trabeculae of the right and left ventricles growing (0 … 1; default 1). */
  trabR?: number;
  trabL?: number;
  /** Earlier names the primitive left ventricle also answers to (topic 10: the ventricular segment). */
  lvAlso?: string[];
  /** After birth: how much blood the lungs return to the LA (0 … 1): its volume and pressure. */
  laFill?: number;
  /** Through a patent foramen ovale, venous blood mixes into the LA (0 … 1). */
  mixLA?: number;
}

export const H0: HeartState = {
  primum: 0,
  closeOP: 0,
  os2: 0,
  stub: 0,
  secundum: 0,
  press: 0,
  fuse: 0,
  canal: 1,
  ridge: 0,
  cushions: 0.5,
  cushionFuse: 0,
  ivMuscle: 0.25,
  ivMembrane: 0,
  valves: 0,
  fibrous: 0,
  smooth: 0,
  pulm: 0,
  blood: 'fetal',
  flow: 1,
  veins: 1,
};

/* ---------- fixed geometry ---------- */

const ROOF = 116; // inner roof of the atria at the interatrial groove
const FLOOR = 300; // atrial floor = top of the AV canal
const VTOP = 352; // ventricular cavity top = bottom of the AV canal

const A_OUT: Pt[] = [
  [292, 312],
  [262, 266],
  [244, 208],
  [248, 150],
  [276, 104],
  [326, 74],
  [392, 62],
  [452, 74],
  [500, 98],
  [548, 74],
  [612, 60],
  [680, 68],
  [730, 102],
  [756, 150],
  [760, 208],
  [744, 266],
  [712, 312],
];
/** Atrial cavity (both atria, the common atrium before septation). */
const A_IN: Pt[] = [
  [300, 300],
  [278, 258],
  [264, 206],
  [268, 156],
  [292, 120],
  [336, 94],
  [392, 84],
  [446, 96],
  [500, ROOF],
  [554, 96],
  [612, 82],
  [672, 90],
  [712, 116],
  [736, 158],
  [740, 206],
  [726, 256],
  [702, 300],
];
const RV_OUT: Pt[] = [
  [292, 312],
  [272, 356],
  [258, 414],
  [260, 476],
  [282, 534],
  [326, 580],
  [392, 610],
  [466, 624],
  [536, 624],
];
const LV_OUT: Pt[] = [
  [536, 624],
  [610, 614],
  [676, 584],
  [724, 536],
  [750, 476],
  [754, 412],
  [740, 356],
  [712, 312],
];
/** The interventricular plane: from the AV junction down to the notch at the apex. */
const IV_TOP: Pt = [505, 312];
const IV_BOT: Pt = [536, 624];
const V_IN: Pt[] = [
  [318, VTOP],
  [298, 410],
  [298, 470],
  [318, 526],
  [358, 566],
  [418, 592],
  [486, 602],
  [552, 600],
  [618, 588],
  [672, 558],
  [706, 512],
  [718, 456],
  [712, 400],
  [692, VTOP],
];

/** x of the interventricular plane at height y. */
const ivX = (y: number) => lerp(IV_TOP[0], IV_BOT[0], (y - IV_TOP[1]) / (IV_BOT[1] - IV_TOP[1]));

/** The AV canal's centre and half width for a given shift (0 = over the LV, 1 = centred). */
export const canalOf = (s: HeartState) => ({ cx: lerp(588, 500, s.canal), hw: lerp(52, 76, s.canal) });

/** Crest of the muscular septum (y) for its growth. */
export const ivCrest = (s: HeartState) => lerp(600, 404, s.ivMuscle);

const path = (pts: readonly Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;
/** A smooth outline along `pts`, closed with a straight edge (used where two tissues meet on a plane). */
const openClosed = (pts: readonly Pt[]) => `${curve(pts, 0.5)}Z`;

/* ---------- septa geometry (shared with the labels of each stage) ---------- */

/** Septum primum in the section: x range (it moves left when pressed at birth) and its lower edge. */
export function primumGeom(s: HeartState) {
  const x = lerp(503, 492, s.press);
  const bottom = lerp(ROOF + 6, FLOOR, s.primum);
  // Ostium secundum: three perforations that merge into one opening (y range).
  const holes = [150, 176, 202].map((c, i) => {
    const r = clamp(s.os2 * 1.6 - i * 0.25) * 16;
    return [c - r, c + r] as [number, number];
  });
  const merged = s.os2 > 0.85 ? [[134, 214] as [number, number]] : holes;
  return { x, w: 10, bottom, holes: merged, press: s.press };
}
/**
 * One piece of septum primum between y = a and y = b: a thin flap that flares where it springs from the
 * atrial roof, tapers towards its free edge and bows slightly; every cut edge (a perforation, the free
 * edge) is rounded.
 */
function primumOutline(p: ReturnType<typeof primumGeom>, a: number, b: number) {
  const half = (y: number) => (p.w / 2) * lerp(1.15, 0.75, clamp((y - ROOF) / (FLOOR - ROOF))) + 9 * Math.exp(-(y - ROOF + 6) / 9);
  // Pressed at birth, its lower part (the valve) bulges into the foramen ovale, towards the right atrium.
  const bow = (y: number) => p.x + 2.2 * Math.sin(Math.PI * clamp((y - ROOF) / (FLOOR - ROOF))) * (1 - p.press) - 10 * p.press * Math.exp(-(((y - 262) / 24) ** 2));
  const n = Math.max(2, Math.ceil((b - a) / 12));
  const ys = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  const left = ys.map((y): Pt => [bow(y) - half(y), y]);
  const right = ys.map((y): Pt => [bow(y) + half(y), y]).reverse();
  const r = Math.min(5, (b - a) / 2);
  const capB = `Q${f1(bow(b))},${f1(b + r)} ${f1(right[0][0])},${f1(right[0][1])}`;
  const capA = a > ROOF + 2 ? `Q${f1(bow(a))},${f1(a - r)} ${f1(left[0][0])},${f1(left[0][1])}` : '';
  return `M${left.map(([x, y]) => `${f1(x)},${f1(y)}`).join('L')}${capB}L${right.map(([x, y]) => `${f1(x)},${f1(y)}`).join('L')}${capA}Z`;
}

/** x of septum primum's mid-line at height y (it bows, and bulges into the foramen ovale when pressed). */
export const primumAxis = (s: HeartState, y: number) => {
  const p = primumGeom(s);
  return p.x + 2.2 * Math.sin(Math.PI * clamp((y - ROOF) / (FLOOR - ROOF))) * (1 - p.press) - 10 * p.press * Math.exp(-(((y - 262) / 24) ** 2));
};

/** The foramen ovale in the section: centre height and opening (0 when it is pressed shut). */
export function foBox(s: HeartState) {
  const secB = secundumBottom(s);
  const h = s.secundum > 0.6 ? Math.max(0, FLOOR - 8 - (secB + 4)) * (1 - (s.patent ? 0.75 : 1) * s.press) : 0;
  return { cy: secB + 4 + h / 2, h };
}

/** Septum secundum: its lower free edge. */
export const secundumBottom = (s: HeartState) => lerp(ROOF, 236, s.secundum);
export const SEC_X = 474;
export const SEC_W = 18;

/* ---------- the drawing ---------- */

/**
 * The heart is drawn at HK of its coordinates about (500, 330), so names of any length fit the side
 * columns (x < 232 and x > 768). Label anchors go through `hp`.
 */
export const HK = 0.86;
export const hp = (x: number, y: number): [number, number] => [500 + (x - 500) * HK, 330 + (y - 330) * HK];

export function HeartArt({ s, t }: { s: HeartState; t: number }) {
  const { cx, hw } = canalOf(s);
  const p = primumGeom(s);
  const crest = ivCrest(s);
  const secB = secundumBottom(s);

  // Atrial cavity with the AV canal opening at the floor.
  const canalL = cx - hw;
  const canalR = cx + hw;
  const atrial = blob(A_IN, 0.5);
  const canalPath = `M${f1(canalL)},${FLOOR - 14}C${f1(canalL + 6)},${FLOOR + 10} ${f1(canalL + 4)},${VTOP - 20} ${f1(canalL - 4)},${VTOP + 10}L${f1(canalR + 4)},${VTOP + 10}C${f1(canalR - 4)},${VTOP - 20} ${f1(canalR - 6)},${FLOOR + 10} ${f1(canalR)},${FLOOR - 14}Z`;
  const ventr = openClosed(V_IN);

  // Muscular IV septum: a wedge from the floor, two-tone (right ventricle's half | left ventricle's half).
  const sx = ivX(crest);
  const sepL = `M${f1(ivX(604) - 34)},604Q${f1(sx - 22)},${f1(crest + 70)} ${f1(sx - 9)},${f1(crest + 6)}Q${f1(sx)},${f1(crest - 8)} ${f1(sx)},${f1(crest - 8)}L${f1(ivX(604))},604Z`;
  const sepR = `M${f1(ivX(604) + 34)},604Q${f1(sx + 22)},${f1(crest + 70)} ${f1(sx + 9)},${f1(crest + 6)}Q${f1(sx)},${f1(crest - 8)} ${f1(sx)},${f1(crest - 8)}L${f1(ivX(604))},604Z`;

  // AV cushions in the section: lateral ones at the canal's sides, the superior + inferior pair as one
  // mass in the middle that grows until it splits the canal in two (as the notes' figures draw it).
  const cg = clamp(s.cushions);
  const lat = (side: -1 | 1) => {
    const ex = side < 0 ? canalL : canalR;
    const r = 10 + 16 * cg;
    return blob(
      [
        [ex - side * 2, FLOOR - 4],
        [ex + side * r * 0.2, FLOOR + 10],
        [ex - side * r, (FLOOR + VTOP) / 2],
        [ex + side * r * 0.2, VTOP - 6],
        [ex - side * 2, VTOP + 8],
        [ex + side * 14, (FLOOR + VTOP) / 2],
      ],
      0.6,
    );
  };
  const midW = lerp(10, 40, cg) * (1 - 0.15 * s.cushionFuse);
  const midTop = lerp(FLOOR + 16, FLOOR - 6, s.cushionFuse);
  const midBot = lerp(VTOP - 12, VTOP + 10, s.cushionFuse);
  const mid = blob(
    [
      [cx, midTop],
      [cx + midW, (midTop + midBot) / 2 - 6],
      [cx + midW * 0.8, midBot - 4],
      [cx, midBot],
      [cx - midW * 0.8, midBot - 4],
      [cx - midW, (midTop + midBot) / 2 - 6],
    ],
    0.5,
  );
  // Extensions of the cushions closing the ostium primum: up from the mass to septum primum's edge.
  const extTop = lerp(midTop, p.bottom - 4, s.closeOP);
  const ext = `M${f1(p.x - 7)},${f1(midTop + 6)}L${f1(p.x - 5)},${f1(extTop)}Q${f1(p.x)},${f1(extTop - 6)} ${f1(p.x + 5)},${f1(extTop)}L${f1(p.x + 7)},${f1(midTop + 6)}Z`;

  // Septum primum: segments of a thin membrane between its holes.
  const stubTop = ROOF - 4;
  const pieces: [number, number][] = [];
  if (s.primum > 0.01) {
    let y0 = stubTop;
    for (const [a, b] of p.holes) {
      if (b - a < 1) continue;
      pieces.push([y0, Math.min(a, p.bottom)]);
      y0 = Math.max(y0, b);
    }
    pieces.push([y0, p.bottom]);
  }
  const live = pieces.filter(([a, b]) => b - a > 2);
  const primumPiece = ([a, b]: [number, number], i: number) => {
    // The upper stub (above the ostium secundum) fades away when it disappears.
    const isStub = i === 0 && live.length > 1 && b < 150;
    const o = isStub ? 1 - s.stub : 1;
    if (o <= 0.02) return null;
    return <Tissue key={i} d={primumOutline(p, a, b)} fill={K.primum} deep={K.primumDeep} pattern="w11-membrane" width={1.1} opacity={o} />;
  };

  // Septum secundum: a thick crescent from the roof, on the right side of septum primum (viewer's left).
  const secD = `M${SEC_X - SEC_W / 2 - 4},${ROOF - 8}C${SEC_X - SEC_W / 2},${ROOF + 20} ${SEC_X - SEC_W / 2 + 1},${f1(secB - 30)} ${SEC_X - 3},${f1(secB)}Q${SEC_X + 4},${f1(secB + 6)} ${SEC_X + SEC_W / 2},${f1(secB - 8)}C${SEC_X + SEC_W / 2},${f1(secB - 40)} ${SEC_X + SEC_W / 2 + 1},${ROOF + 16} ${SEC_X + SEC_W / 2 + 8},${ROOF - 8}Z`;

  // Bulboventricular ridge: hangs from the ventricular roof between the canal (over the LV) and the RV.
  const rx = lerp(446, 420, s.canal);
  const rh = 70 * s.ridge;
  const ridge = `M${f1(rx - 26)},${VTOP - 4}Q${f1(rx - 6)},${f1(VTOP + rh * 0.4)} ${f1(rx)},${f1(VTOP + rh)}Q${f1(rx + 6)},${f1(VTOP + rh * 0.4)} ${f1(rx + 26)},${VTOP - 4}Z`;

  // Smooth posterior RA wall from the sinus venosus (violet): grows along the RA's lateral wall.
  const smoothD = s.smooth > 0.01 ? smoothBand(s.smooth) : '';
  // LA smooth wall from the incorporated pulmonary veins.
  const pulmD = s.pulm > 0.01 ? pulmBand(s.pulm) : '';

  // Valve leaflets and the papillary muscles they hang from (in each orifice).
  const vk = clamp(s.valves);

  return (
    <g transform={`translate(500 330) scale(${HK}) translate(-500 -330)`}>
      {/* Veins: superior and inferior venae cavae into the RA; pulmonary veins into the LA. */}
      {s.veins > 0.01 && (
        <g opacity={s.veins}>
          <Part id="goiko-kaba-zaina">
            <path d="M320,0L320,70Q320,92 330,104L352,104Q362,92 362,70L362,0Z" fill={K.deo2} />
            <path d="M320,0L320,70Q320,92 330,104L352,104Q362,92 362,70L362,0Z" fill="url(#w11-tubeH)" />
            <path d="M320,0L320,70Q320,92 330,104M362,0L362,70Q362,92 352,104" fill="none" stroke={K.deo2Deep} strokeWidth={1.3} />
          </Part>
          <Part id="beheko-kaba-zaina">
            <path d="M206,640L208,470Q210,372 238,318Q252,292 280,276L292,296Q268,312 256,334Q240,380 240,470L242,640Z" fill={K.deo2} />
            <path d="M206,640L208,470Q210,372 238,318Q252,292 280,276L292,296Q268,312 256,334Q240,380 240,470L242,640Z" fill="url(#w11-tubeH)" />
            <path d="M206,640L208,470Q210,372 238,318Q252,292 280,276M292,296Q268,312 256,334Q240,380 240,470L242,640" fill="none" stroke={K.deo2Deep} strokeWidth={1.3} />
          </Part>
          {s.pulm > 0.01 || s.blood === 'born' ? (
            <Part id="birika-zainak">
              {[132, 210].map((y, i) => (
                <g key={i}>
                  <path d={`M800,${y - 11}L752,${y - 9}L752,${y + 9}L800,${y + 11}Z`} fill={K.o2} />
                  <path d={`M800,${y - 11}L752,${y - 9}L752,${y + 9}L800,${y + 11}Z`} fill="url(#w11-light)" />
                  <path d={`M800,${y - 11}L752,${y - 9}M752,${y + 9}L800,${y + 11}`} fill="none" stroke={K.o2Deep} strokeWidth={1.2} />
                </g>
              ))}
            </Part>
          ) : null}
        </g>
      )}

      {/* Atrial walls: trabeculated (orange, from the atrial part of the loop). */}
      <Part id={s.adult ? 'eskuineko-aurikula' : 'hasierako-eskuineko-aurikula'}>
        <Tissue d={`${curve(A_OUT.slice(0, 9), 0.5)}L500,${ROOF}L500,${FLOOR + 8}L292,312Z`} fill={K.atrium} deep={K.atriumDeep} pattern="w11-atrial" />
      </Part>
      <Part id={s.adult ? 'ezkerreko-aurikula-jaiotakoan' : 'hasierako-ezkerreko-aurikula'}>
        <Tissue d={`M500,98${curve(A_OUT.slice(8), 0.5).replace(/^M[^C]*/, '')}L500,${FLOOR + 8}L500,${ROOF}Z`} fill={K.atrium} deep={K.atriumDeep} pattern="w11-atrial" />
      </Part>
      {smoothD && (
        <Part id="atal-lisoa" groups={[...(s.smooth < 0.7 ? ['zain-sinua'] : []), s.adult ? 'eskuineko-aurikula' : 'hasierako-eskuineko-aurikula']}>
          <Tissue d={smoothD} fill={K.smoothRA} deep={K.smoothDeep} />
        </Part>
      )}
      {pulmD && (
        <Part id="ezkerreko-aurikularen-atal-lisoa">
          <Tissue d={pulmD} fill={K.o2} deep={K.o2Deep} />
        </Part>
      )}

      {/* Ventricular walls: right (green, proximal bulbus) and left (cyan, ventricular part). */}
      <Part id="hasierako-eskuineko-bentrikulua">
        <Tissue d={`M${IV_TOP[0]},${IV_TOP[1]}L292,312${curve(RV_OUT, 0.5).replace(/^M[^C]*/, '')}L${IV_TOP[0]},${IV_TOP[1]}Z`} fill={K.proximal} deep={K.bulbusDeep} pattern="w11-myo" />
      </Part>
      <Part id="hasierako-ezkerreko-bentrikulua" groups={s.lvAlso}>
        <Tissue d={`M${IV_TOP[0]},${IV_TOP[1]}L${IV_BOT[0]},${IV_BOT[1]}${curve(LV_OUT, 0.5).replace(/^M[^C]*/, '')}Z`} fill={K.ventricle} deep={K.ventricleDeep} pattern="w11-myo" />
      </Part>

      {/* Cavities, lined by endocardium (pink rim of the union). */}
      <g pointerEvents="none">
        <path d={atrial} fill="none" stroke={K.cushionRim} strokeWidth={5} />
        <path d={canalPath} fill="none" stroke={K.cushionRim} strokeWidth={5} />
        <path d={ventr} fill="none" stroke={K.cushionRim} strokeWidth={5} />
        <path d={atrial} fill="url(#w11-lumen)" />
        <path d={canalPath} fill="url(#w11-lumen)" />
        <path d={ventr} fill="url(#w11-lumen)" />
      </g>
      {/* The atrial cavity and the AV canal are spaces of their own (they glow when named). */}
      <Part id="aurikula-komuna">
        <path d={atrial} fill="url(#w11-lumen)" />
      </Part>
      <Part id="erreten-aurikulubentrikularra">
        <path d={canalPath} fill="url(#w11-lumen)" />
      </Part>

      {/* Trabeculae of both ventricles (they become the trabeculated parts). */}
      <Part id="muskulu-trenkadak" quiet>
        <Trabeculae pts={V_IN.slice(1, 7)} inward={[440, 440]} fill={K.proximal} deep={K.bulbusDeep} n={18} len={22 * (0.3 + 0.7 * (s.trabR ?? 1))} seed={3} show={s.trabR ?? 1} />
        <Trabeculae pts={V_IN.slice(7, 13)} inward={[600, 450]} fill={K.ventricle} deep={K.ventricleDeep} n={18} len={24 * (0.3 + 0.7 * (s.trabL ?? 1))} seed={9} show={s.trabL ?? 1} />
      </Part>

      {/* Bulboventricular ridge (flattens as the canal moves). */}
      {s.ridge > 0.02 && (
        <Part id="ertz-bulbobentrikularra">
          <Tissue d={ridge} fill={K.proximal} deep={K.bulbusDeep} pattern="w11-myo" />
        </Part>
      )}

      {/* Muscular interventricular septum: built by both ventricles' walls. */}
      {s.ivMuscle > 0.01 && (
        <Part id="trenkada-muskularra">
          <Tissue d={sepL} fill={K.proximal} deep={K.bulbusDeep} pattern="w11-myo" />
          <Tissue d={sepR} fill={K.ventricle} deep={K.ventricleDeep} pattern="w11-myo" />
        </Part>
      )}

      {/* Membranous part: closes the interventricular foramen above the muscular crest. */}
      {s.ivMembrane > 0.01 && (
        <Part id="mintzezko-trenkada">
          <Cushion d={membrane(s, crest)} />
        </Part>
      )}

      {/* AV cushions. */}
      <Part id="alboko-kuxinak" groups={['kuxin-aurikulubentrikularrak']}>
        <Cushion d={lat(-1)} />
        <Cushion d={lat(1)} />
      </Part>
      <Part id="kuxin-aurikulubentrikularrak">
        <Cushion d={mid} />
        {s.closeOP > 0.01 && s.primum > 0.5 && <Cushion d={ext} />}
      </Part>

      {/* AV valves: from the cushions' mesenchyme, hollowed by the blood; chordae to papillary muscles. */}
      {vk > 0.01 && <Valves s={s} />}

      {/* The openings, as spaces of their own (they glow when named). */}
      <Openings s={s} midTop={midTop} />

      {/* Septum secundum (right side), then septum primum (left side) over the cavity. */}
      {s.secundum > 0.01 && (
        <Part id="septum-secundum">
          <Tissue d={secD} fill={K.secundum} deep={K.secundumDeep} pattern="w11-atrial" />
        </Part>
      )}
      {s.primum > 0.01 && (
        <Part id={s.stub > 0.5 ? 'zulo-obalaren-balbula' : 'septum-primum'} groups={s.stub > 0.5 ? ['septum-primum'] : undefined}>
          {live.map(primumPiece)}
        </Part>
      )}
      {s.fuse > 0.01 && (
        <path
          d={`M${f1(SEC_X + SEC_W / 2 - 3)},${f1(secB - 44)}Q${f1(p.x)},${f1(secB - 50)} ${f1(p.x + 2)},${f1(secB - 40)}L${f1(p.x + 2)},${f1(secB + 4)}Q${f1(p.x - 6)},${f1(secB + 10)} ${f1(SEC_X + SEC_W / 2 - 3)},${f1(secB + 4)}Z`}
          fill={K.secundum}
          opacity={s.fuse * (s.patent ? 0.55 : 0.9)}
          pointerEvents="none"
        />
      )}

      <Blood s={s} t={t} />
    </g>
  );
}

/** Ostium primum, ostium secundum and foramen ovale in the section: the gaps between the septa. */
function Openings({ s, midTop }: { s: HeartState; midTop: number }) {
  const p = primumGeom(s);
  const secB = secundumBottom(s);
  const op = midTop - 4 - (p.bottom + 4);
  const opOpen = op * (1 - s.closeOP);
  const hole = p.holes[p.holes.length - 1];
  const os2 = s.os2 > 0.3 && hole[1] - hole[0] > 10;
  const fo = foBox(s).h;
  return (
    <g>
      {s.primum > 0.05 && opOpen > 6 && (
        <Part id="ostium-primuma">
          <ellipse cx={p.x} cy={p.bottom + 4 + opOpen / 2} rx={24} ry={opOpen / 2 + 2} fill="url(#w11-gap)" />
        </Part>
      )}
      {os2 && (
        <Part id="ostium-secunduma">
          <ellipse cx={p.x + 1} cy={(hole[0] + hole[1]) / 2} rx={15} ry={(hole[1] - hole[0]) / 2} fill="url(#w11-gap)" />
        </Part>
      )}
      {fo > 8 && (
        <Part id="zulo-obala">
          <ellipse cx={SEC_X} cy={secB + 4 + fo / 2} rx={16} ry={fo / 2 + 1} fill="url(#w11-gap)" />
        </Part>
      )}
    </g>
  );
}

/** Membranous IV septum: fills the foramen between the muscular crest and the cushions. */
function membrane(s: HeartState, crest: number) {
  const top = VTOP + 4;
  const x = ivX(crest);
  const h = (crest - top) * clamp(s.ivMembrane);
  const y1 = top + h;
  return `M${f1(x - 13)},${top - 4}L${f1(x + 13)},${top - 4}Q${f1(x + 15)},${f1(top + h / 2)} ${f1(x + 9)},${f1(y1 + 4)}Q${f1(x)},${f1(y1 + 10)} ${f1(x - 9)},${f1(y1 + 4)}Q${f1(x - 15)},${f1(top + h / 2)} ${f1(x - 13)},${top - 4}Z`;
}

/** RA posterior smooth wall (from the sinus venosus): a band along the RA's lateral wall, around the caval openings. */
function smoothBand(k: number) {
  const outer: Pt[] = [
    [380, 66],
    [326, 76],
    [278, 104],
    [250, 150],
    [246, 208],
    [262, 264],
    [290, 310],
  ];
  const n = Math.max(2, Math.round(2 + 5 * k));
  const o = outer.slice(0, n);
  const inner = o.map(([x, y]): Pt => [x + (440 - x) * 0.09 + 8, y + (190 - y) * 0.09 + 6]).reverse();
  return `${curve(o, 0.5)}L${f1(inner[0][0])},${f1(inner[0][1])}${curve(inner, 0.5).replace(/^M[^C]*/, '')}Z`;
}

/** LA smooth wall from the incorporated pulmonary veins: a band on its posterolateral wall. */
function pulmBand(k: number) {
  const outer: Pt[] = [
    [758, 120],
    [762, 160],
    [762, 210],
    [756, 244],
  ];
  const span = clamp(k);
  const o = outer.map(([x, y]): Pt => [x, lerp(176, y, span)]);
  const inner = o.map(([x, y]): Pt => [x - 18, y]).reverse();
  return `${curve(o, 0.5)}L${f1(inner[0][0])},${f1(inner[0][1])}${curve(inner, 0.5).replace(/^M[^C]*/, '')}Z`;
}

/** Leaflets, chordae and papillary muscles of both AV orifices. */
function Valves({ s }: { s: HeartState }) {
  const { cx, hw } = canalOf(s);
  const v = clamp(s.valves);
  // Each orifice has two leaflets in the section: one at the canal side, one at the central cushion.
  const orifices = [
    { l: cx - hw, r: cx - 22, wall: K.proximal, deep: K.bulbusDeep, papX: cx - hw + 30 },
    { l: cx + 22, r: cx + hw, wall: K.ventricle, deep: K.ventricleDeep, papX: cx + hw - 30 },
  ];
  const leaflet = (x: number, dir: 1 | -1) => {
    // Thick swelling → thin leaflet (hollowed on its ventricular side).
    const len = lerp(18, 58, v);
    const th = lerp(13, 4.5, v);
    const top = VTOP - 6;
    const tip = top + len;
    return `M${f1(x)},${top}Q${f1(x + dir * (th + 8))},${f1(top + len * 0.5)} ${f1(x + dir * 14)},${f1(tip)}L${f1(x + dir * (14 - th))},${f1(tip - 2)}Q${f1(x + dir * 2)},${f1(top + len * 0.45)} ${f1(x - dir * 2)},${f1(top + 4)}Z`;
  };
  const papTop = (x: number) => [x, 470] as Pt;
  return (
    <g>
      {orifices.map((o, i) => (
        <Part key={i} id={i === 0 ? 'balbula-trikuspidea' : 'balbula-mitrala'} groups={['balbula-aurikulubentrikularrak']}>
          <Cushion d={leaflet(o.l + 4, 1)} />
          <Cushion d={leaflet(o.r - 4, -1)} />
        </Part>
      ))}
      {v > 0.35 && (
        <>
          <Part id="muskulu-papilarrak">
            {orifices.map((o, i) => {
              const [x, y] = papTop(o.papX);
              const k = clamp((v - 0.35) / 0.4);
              const d = `M${f1(x - 15)},${f1(y + 95)}Q${f1(x - 12)},${f1(y + 20 + 40 * (1 - k))} ${f1(x)},${f1(y + 50 * (1 - k))}Q${f1(x + 12)},${f1(y + 20 + 40 * (1 - k))} ${f1(x + 15)},${f1(y + 95)}Z`;
              return <Tissue key={i} d={d} fill={o.wall} deep={o.deep} pattern="w11-myo" />;
            })}
          </Part>
          <Part id="soka-tendinosoak">
            {orifices.map((o, i) => {
              const k = clamp((v - 0.35) / 0.4);
              const [x, y] = papTop(o.papX);
              const tipY = VTOP - 6 + lerp(18, 58, v);
              const ends = [o.l + 4 + 14, o.r - 4 - 14];
              const col = s.fibrous > 0.5 ? K.chord : o.wall;
              return (
                <g key={i} opacity={k}>
                  {ends.flatMap((ex, j) =>
                    [-5, 0, 5].map((dx) => (
                      <path
                        key={`${j}${dx}`}
                        d={`M${f1(x + dx * 0.6)},${f1(y + 50 * (1 - k) + 2)}L${f1(ex + dx * 0.8)},${f1(tipY - 2)}`}
                        stroke={col}
                        strokeWidth={lerp(3.2, 1.6, s.fibrous)}
                        strokeLinecap="round"
                      />
                    )),
                  )}
                </g>
              );
            })}
          </Part>
        </>
      )}
    </g>
  );
}

/* ---------- blood ---------- */

/** Paths blood takes through the heart in the section, for the state's openings. */
export function bloodPaths(s: HeartState) {
  const { cx, hw } = canalOf(s);
  const p = primumGeom(s);
  const secB = secundumBottom(s);
  const out: { pts: Pt[]; colors: string[]; n: number; seed: number }[] = [];
  const mixed = [K.o2, K.deo2];
  const venous = [K.deo2];
  const arterial = [K.o2];
  const raBlood = s.blood === 'fetal' ? mixed : venous;
  // Caval inflow into the RA.
  out.push({ pts: [[341, 30], [341, 104], [356, 170], [392, 240]], colors: raBlood, n: 6, seed: 3 });
  out.push({ pts: [[224, 600], [226, 430], [250, 330], [300, 282], [380, 262]], colors: raBlood, n: 7, seed: 5 });
  // RA → RV through the right part of the canal.
  out.push({ pts: [[390, 220], [cx - hw * 0.55, FLOOR - 4], [cx - hw * 0.55, VTOP + 30], [400, 470], [380, 540]], colors: raBlood, n: 7, seed: 7 });
  // LA → LV.
  const fill = s.blood === 'born' ? (s.laFill ?? 1) : 0;
  const laBlood = s.blood === 'born' ? ((s.mixLA ?? 0) > 0.3 ? mixed : arterial) : mixed;
  out.push({ pts: [[630, 200], [cx + hw * 0.55, FLOOR - 4], [cx + hw * 0.55, VTOP + 30], [610, 470], [630, 540]], colors: laBlood, n: s.blood === 'born' ? Math.round(5 + 6 * fill) : 7, seed: 9 });
  // Pulmonary return into the LA: more of it as the lungs fill (the LA pressure rises).
  if (s.blood === 'born' || s.pulm > 0.5)
    for (const [i, y] of [132, 210].entries()) out.push({ pts: [[800, y], [748, y], [690, y + 20 - i * 20], [650, 214]], colors: arterial, n: s.blood === 'born' ? Math.round(2 + 6 * fill) : 4, seed: 11 + i });
  // The LA fills: blood swirling in it, denser as its pressure rises.
  if (s.blood === 'born' && fill > 0.05)
    out.push({ pts: [[560, 140], [690, 130], [720, 220], [620, 262], [540, 220], [560, 140]], colors: laBlood, n: Math.round(3 + 12 * fill), seed: 15 });

  // Right-to-left shunt through the interatrial openings (fetal heart, or a patent foramen ovale).
  const open = s.blood === 'fetal' || s.patent;
  if (open && s.primum > 0.05) {
    const pathPts: Pt[] = [];
    const closedLow = s.closeOP > 0.95;
    if (s.secundum < 0.05) {
      // Through the ostium primum, under the free edge of septum primum (while it is open)…
      if (!closedLow) {
        const y = (p.bottom + FLOOR - 8) / 2 + (FLOOR - 8 - p.bottom) * 0.25 * s.closeOP;
        out.push({ pts: [[400, y + 4], [p.x, y], [600, y + 2]], colors: mixed, n: Math.max(2, Math.round(8 * (1 - s.closeOP))), seed: 19 });
      }
      // …and through the ostium secundum, high in septum primum, once it opens.
      const hole = p.holes[p.holes.length - 1];
      if (s.os2 > 0.3 && hole[1] - hole[0] > 8) {
        const y = (hole[0] + hole[1]) / 2;
        pathPts.push([410, y + 30], [p.x, y], [600, y + 10]);
      }
    } else {
      // The oblique path: under septum secundum (foramen ovale), up between the septa, through the ostium secundum.
      const gap = s.patent ? 1 : 1 - s.press;
      if (gap > 0.05) {
        pathPts.push([392, 268], [SEC_X - 4, secB + 22], [SEC_X + SEC_W / 2 + 6, secB + 4], [SEC_X + SEC_W / 2 + 6, 172], [p.x + 12, 150], [600, 166]);
      }
    }
    if (pathPts.length) out.push({ pts: pathPts, colors: s.blood === 'born' ? venous : mixed, n: s.patent ? 3 : 8, seed: 21 });
  }
  return out;
}

function Blood({ s, t }: { s: HeartState; t: number }) {
  if (s.flow <= 0.01) return null;
  return (
    <g>
      {bloodPaths(s).map((b, i) => (
        <Cells key={i} pts={b.pts} t={t} n={b.n} speed={b.pts.length > 4 ? 3 : 4} colors={b.colors} show={s.flow} seed={b.seed} />
      ))}
    </g>
  );
}

export { ROOF, FLOOR, VTOP, ivX, path };
