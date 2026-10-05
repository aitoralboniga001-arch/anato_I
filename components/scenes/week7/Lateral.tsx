'use client';

import { Arrow, C, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Sheet, f1, length, offset, poly, resample, spline, vis } from './common';

/**
 * Topic 7 sagittal view of the ~4–5 week embryo (apunteen 24. orriko irudiak: "Hasierako perikardio
 * barrunbea · Septum transversuma · Erreten perikardioperitonealak · Peritoneo barrunbea"). Ventral is on
 * the left, dorsal on the right, cranial at the top. One drawing serves two stages:
 *  - `zeloma` (§1): the intra-embryonic coelom is one continuous cavity from the future thorax to the
 *    future abdomen;
 *  - `septum-transversum` (§2): the septum transversum appears at C3–C5 as a mesenchymal plate between the
 *    heart and the gut, anchored ventrally/laterally on the body wall and dorsally on the mesenchyme round
 *    the foregut; it splits the coelom into the primitive pericardial cavity (above) and the peritoneal
 *    cavity (below), except for the two dorsolateral pericardioperitoneal canals.
 */

// Body outline (closed), clockwise from the top of the head: big head, neck notch (stomodeum), the
// cardiac prominence, the cord root, and the tail curling ventrally (apunteen 24. orriko irudia).
const BODY_KEYS: Pt[] = [
  [500, 42], [586, 52], [656, 96], [700, 166], [718, 246], [724, 336], [714, 426], [690, 500], [652, 556], [606, 594], [556, 614], [512, 612],
  [488, 592], [498, 568], [470, 548], [446, 512], [428, 470], [410, 428], [390, 392], [368, 350], [356, 300], [362, 250], [384, 212], [404, 188],
  [388, 160], [384, 124], [404, 86], [446, 56],
];
const BODY = spline(BODY_KEYS, 8, true);

/** The silhouette moved inward by d (towards the inside of the body). */
function inward(pts: Pt[], d: number) {
  const o = offset(pts, d, true);
  // Pick the side that moves towards the centre.
  const c: Pt = [560, 330];
  const toward = Math.hypot(o[0][0] - c[0], o[0][1] - c[1]) < Math.hypot(pts[0][0] - c[0], pts[0][1] - c[1]);
  return toward ? o : offset(pts, -d, true);
}

// Intra-embryonic coelom: ventral inner wall (cranial → caudal), then the gut / mesentery back up.
const COELOM = spline(
  [
    [420, 210], [396, 246], [386, 296], [394, 346], [414, 388], [434, 424], [452, 462], [468, 500], [488, 532], [508, 554],
    [540, 558], [566, 530], [580, 490], [584, 440], [584, 390], [584, 340], [580, 290], [568, 246], [540, 210], [496, 196], [456, 194],
  ],
  8,
  true,
);

// Gut (endoderm tube centre line): mouth → pharynx → oesophagus → stomach → midgut loop (to the yolk stalk) → hindgut → cloaca.
const FOREGUT = spline([[414, 184], [470, 178], [530, 184], [578, 206], [602, 246], [608, 290], [606, 330]], 8);
const GUT_REST = spline([[606, 330], [600, 370], [584, 404], [548, 430], [498, 454], [464, 482], [504, 494], [552, 494], [578, 520], [572, 556], [550, 580]], 8);
// Neural tube (centre line) and the somite row beside it.
const NEURAL = spline([[530, 72], [604, 78], [660, 126], [692, 200], [704, 290], [702, 390], [684, 470], [648, 536], [596, 580]], 10);
const SOMITE_LINE = spline([[650, 132], [668, 186], [677, 250], [680, 330], [674, 420], [650, 500], [608, 556]], 10);
const SOMITES = resample(SOMITE_LINE, 26);
/** Somite numbering: 4 occipital, 8 cervical (C1–C8)… so C3–C5 are indices 6–8. */
const C3 = 6;

// Septum transversum at full size: a thick mesenchymal mass under the heart, from the ventral body wall
// (low) to the mesenchyme round the oesophagus (high, at the C3–C5 somites).
const SEPTUM_TOP: Pt[] = [[370, 338], [430, 322], [490, 306], [546, 290], [594, 272]];
const SEPTUM_BOT: Pt[] = [[388, 406], [440, 394], [500, 372], [556, 344], [596, 314]];
const SEPTUM_X: [number, number] = [370, 596];
/** Midline of the septum, for the two cavity halves. */
const SPLIT_LINE: Pt[] = [[0, 372], [378, 370], [440, 358], [500, 339], [556, 317], [604, 290], [1000, 120]];

// Umbilical cord stump with the vitelline (yolk) duct inside.
const CORD = spline([[440, 478], [390, 492], [330, 506], [270, 520]], 8);
const DUCT = spline([[464, 482], [430, 488], [380, 496], [330, 506], [276, 518]], 8);

// Mesenchyme round the foregut (oesophagus), from the dorsal wall: the septum is anchored on it dorsally.
const ESO_MES: Pt[] = spline([[584, 232], [622, 236], [644, 268], [644, 310], [626, 336], [596, 338], [582, 310], [578, 264]], 6, true);

const HEART = spline([[524, 216], [482, 220], [446, 236], [438, 260], [464, 276], [500, 272], [494, 290], [456, 300]], 8);

interface Look {
  /** 0..1 growth of the septum from the ventral wall. */
  septum: number;
  /** 0..1: the coelom tint changes from one cavity to the two (pericardial / peritoneal). */
  split: number;
  /** 0..1 visibility of the canals and their flow. */
  canals: number;
  /** Highlight of the C3–C5 somites. */
  levels: number;
  /** Visibility of the oesophageal mesenchyme. */
  eso: number;
  reduced: boolean;
}

function septumPoly(s: number): Pt[] {
  const reach = (pts: Pt[]) => {
    const cut = lerp(SEPTUM_X[0], SEPTUM_X[1], s);
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      if (pts[i][0] <= cut) out.push(pts[i]);
      else if (i === 0) {
        out.push([cut, pts[0][1]]);
        break;
      } else {
        const a = pts[i - 1];
        const b = pts[i];
        const r = (cut - a[0]) / (b[0] - a[0] || 1);
        out.push([cut, lerp(a[1], b[1], r)]);
        break;
      }
    }
    return out;
  };
  const top = reach(SEPTUM_TOP);
  const bot = reach(SEPTUM_BOT);
  const e0 = top[top.length - 1];
  const e1 = bot[bot.length - 1];
  const tip: Pt = [Math.max(e0[0], e1[0]) + 8 * s, (e0[1] + e1[1]) / 2];
  return [...spline(top, 6), tip, ...spline(bot, 6).reverse()];
}

const CANAL: Pt = [566, 300];

function LateralDrawing({ septum, split, canals, levels, eso, reduced }: Look) {
  const skinIn = inward(BODY, 8);
  const sep = septumPoly(septum);
  const wallTint = 'url(#w7-mesench)';
  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id="w7-lat-up">
          <path d={poly([...SPLIT_LINE, [1000, 0], [0, 0]])} />
        </clipPath>
        <clipPath id="w7-lat-dn">
          <path d={poly([...SPLIT_LINE, [1000, 640], [0, 640]])} />
        </clipPath>
      </defs>

      {/* Umbilical cord stump (behind the body wall), with the vitelline duct running out of the midgut loop. */}
      <path d={tubeD(CORD, (u) => lerp(22, 15, u))} fill="#cdb9a8" stroke="rgba(60,40,30,0.5)" strokeWidth={1} />
      <path d={tubeD(CORD, (u) => lerp(22, 15, u))} fill="url(#w7-light)" />

      {/* Body: body wall and dorsal mesenchyme, skin (surface ectoderm) as a sheet of cells. */}
      <Part id="gorputz-paretako-mesodermoa" quiet>
        <path d={poly(BODY)} fill={P.wall} />
        <path d={poly(BODY)} fill={wallTint} />
      </Part>
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY} inner={skinIn} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={3} />
      </Part>

      {/* Neural tube along the back; brain in the head. */}
      <Part id="hodi-neurala">
        <path d={tubeD(NEURAL, (u) => lerp(26, 9, Math.min(1, u * 2.4)))} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <path d={`M${resample(NEURAL, 40).map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`} fill="none" stroke="#0c1428" strokeWidth={2.2} strokeLinecap="round" />
      </Part>

      {/* Somites: the C3–C5 pair lights up when the septum's level is the point. */}
      <Part id="somitak">
        {SOMITES.map((p, i) => {
          const q = SOMITES[Math.min(SOMITES.length - 1, i + 1)];
          const a = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
          const lit = i >= C3 && i <= C3 + 2 ? levels : 0;
          return (
            <g key={i} transform={`rotate(${f1(a)} ${f1(p[0])} ${f1(p[1])})`}>
              <rect x={p[0] - 7.5} y={p[1] - 6.5} width={15} height={13} rx={4} fill={lit > 0.5 ? '#ff6b6b' : C.mesoParaxial} stroke={lit > 0.5 ? '#ffd2a8' : 'rgba(80,6,18,0.7)'} strokeWidth={lit > 0.5 ? 1.6 : 0.9} />
              <circle cx={p[0]} cy={p[1]} r={2.2} fill="rgba(80,6,18,0.7)" />
            </g>
          );
        })}
      </Part>

      {/* Coelom: dark space, tinted as one cavity, then as its two halves. */}
      <path d={poly(COELOM)} fill={P.space} />
      <Part id="enbrioi-barruko-zeloma" show={1 - split}>
        <path d={poly(COELOM)} fill={P.coelom} />
      </Part>
      <Part id="hasierako-perikardio-barrunbea" show={split}>
        <path d={poly(COELOM)} fill={P.peri} clipPath="url(#w7-lat-up)" />
      </Part>
      <Part id="peritoneo-barrunbea" show={split}>
        <path d={poly(COELOM)} fill={P.perito} clipPath="url(#w7-lat-dn)" />
      </Part>

      {/* Dorsal mesentery: the gut hangs from the dorsal wall below the septum. */}
      <Part id="mesenterio-dortsala">
        <path d={smoothPath(mesentery(), true, 0.3)} fill="#e98f8f" opacity={0.42} />
        <path d={smoothPath(mesentery(), true, 0.3)} fill="url(#w7-mesench)" />
      </Part>

      {/* Mesenchyme round the oesophagus: where the septum anchors dorsally. */}
      <Part id="hestegorri-inguruko-mesenkima" show={eso}>
        <path d={poly(ESO_MES)} fill={P.eso} opacity={0.55} />
        <path d={poly(ESO_MES)} fill="url(#w7-mesench)" />
      </Part>

      {/* Gut tube (endoderm). */}
      <Part id="aurreko-hestea">
        <path d={tubeD(FOREGUT, () => 8)} fill={P.gut} stroke="rgba(90,60,10,0.6)" strokeWidth={1} />
      </Part>
      <Part id="erdiko-hestea">
        <path d={tubeD(GUT_REST, () => 8)} fill={P.gut} stroke="rgba(90,60,10,0.6)" strokeWidth={1} />
      </Part>
      <Part id="hodi-onfalomesenterikoa">
        <path d={tubeD(DUCT, () => 4.5)} fill="#e5b84a" stroke="rgba(90,60,10,0.6)" strokeWidth={0.8} />
      </Part>

      {/* Heart: the looped tube in the cranial (pericardial) part of the coelom. */}
      <Part id="bihotza">
        <path d={tubeD(HEART, (u) => 11 + 3 * Math.sin(u * Math.PI))} fill={P.heart} stroke={P.heartDeep} strokeWidth={1.2} />
        <path d={tubeD(HEART, () => 4)} fill="#ff6b7d" opacity={0.45} />
      </Part>

      {/* Septum transversum: a mesenchymal plate, from the ventral body wall to the foregut mesenchyme. */}
      {septum > 0.01 && (
        <Part id="septum-transversum">
          <path d={smoothPath(sep, true, 0.25)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
          <path d={smoothPath(sep, true, 0.25)} fill="url(#w7-mesench)" />
          <path d={smoothPath(sep, true, 0.25)} fill="url(#w7-light)" />
        </Part>
      )}

      {/* The canal: a passage left at the dorsal edge of the septum, on each side of the oesophagus. */}
      <Part id="erreten-perikardioperitonealak" show={canals}>
        <ellipse cx={CANAL[0]} cy={CANAL[1]} rx={22} ry={15} fill={P.space} stroke="#7fc8e8" strokeWidth={1.4} />
        <ellipse cx={CANAL[0]} cy={CANAL[1]} rx={22} ry={15} fill={P.canal} />
      </Part>
      <Arrow from={[CANAL[0] - 6, 232]} to={[CANAL[0] - 4, 380]} color="#7fc8e8" width={2.6} show={canals} bend={0.04} flow={!reduced} />
      <Arrow from={[CANAL[0] + 12, 380]} to={[CANAL[0] + 10, 236]} color="#7fc8e8" width={2.2} show={canals * 0.8} bend={0.04} flow={!reduced} />

      {/* Light from the top left over the whole body. */}
      <path d={poly(BODY)} fill="url(#w7-light)" pointerEvents="none" />
    </g>
  );
}

/** The dorsal mesentery: a fan from its root on the dorsal wall to the abdominal gut (and its loop). */
const MES_ROOT = spline([[640, 336], [646, 400], [640, 460], [622, 510], [592, 548]], 8);
function mesentery(): Pt[] {
  const gut = resample(GUT_REST, 40).slice(1);
  return [...gut, ...resample(MES_ROOT, 40).reverse()];
}

/** A tube of variable half-width round a centre line (closed path string). */
function tubeD(pts: Pt[], hw: (u: number) => number) {
  const L = length(pts);
  let acc = 0;
  const us = pts.map((p, i) => {
    if (i) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    return acc / (L || 1);
  });
  const a = offset(pts, (i) => hw(us[i]));
  const b = offset(pts, (i) => -hw(us[i]));
  return smoothPath([...a, ...b.reverse()], true, 0.3);
}

const ORIENT_LABELS = { left: 'Bentrala', right: 'Dortsala' };
export const lateralOrientation = { top: 'Kraneala', bottom: 'Kaudala', ...ORIENT_LABELS };

/** Positions of the C3–C5 tags beside the somites. */
function Levels({ show }: { show: number }) {
  if (show <= 0.02) return null;
  return (
    <>
      {['C3', 'C4', 'C5'].map((n, j) => {
        const p = SOMITES[C3 + j];
        return (
          <Note key={n} x={p[0] + 52} y={p[1]} size={11.5} tone="accent" show={show}>
            {n}
          </Note>
        );
      })}
    </>
  );
}

/** 7:zeloma:sagitala — the coelom runs inside the whole body, from the future thorax to the future abdomen. */
export function CoelomExtent({ t, reduced }: SceneProps) {
  const sweep = seg(t, 0.08, 0.6);
  return (
    <g>
      <LateralDrawing septum={0} split={0} canals={0} levels={0} eso={0} reduced={reduced} />
      {/* The plane of the transverse view (midgut level, at the yolk stalk). */}
      <path d="M380,470L720,470" stroke="#0f0f11" strokeWidth={4.4} strokeLinecap="round" opacity={0.8} />
      <path d="M380,470L720,470" stroke="#ffb86b" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      <Note x={640} y={458} size={11.5}>
        zeharkako ebakiaren maila
      </Note>
      <Arrow from={[440, 404]} to={[lerp(440, 424, sweep), lerp(404, 236, sweep)]} color="#c4a8ff" width={2.4} show={vis(t, 0.08, 0.95) * (sweep > 0.05 ? 1 : 0)} bend={0.02} />
      <Arrow from={[456, 424]} to={[lerp(456, 512, sweep), lerp(424, 540, sweep)]} color="#c4a8ff" width={2.4} show={vis(t, 0.08, 0.95) * (sweep > 0.05 ? 1 : 0)} bend={-0.02} />
      <Note x={300} y={200} tone="accent" show={seg(t, 0.4, 0.5)}>
        geroko toraxa
      </Note>
      <Note x={300} y={560} tone="accent" show={seg(t, 0.4, 0.5)}>
        geroko abdomena
      </Note>

      <Label id="enbrioi-barruko-zeloma" x={236} y={420} ax={432} ay={420} />
      <Label id="bihotza" x={236} y={262} ax={436} ay={276} small />
      <Label id="hodi-onfalomesenterikoa" x={236} y={556} ax={320} ay={508} small />
      <Label id="hodi-neurala" x={760} y={80} ax={640} ay={104} />
      <Label id="somitak" x={760} y={132} ax={SOMITES[1][0] + 6} ay={SOMITES[1][1]} small />
      <Label id="aurreko-hestea" x={760} y={186} ax={578} ay={206} />
      <Label id="mesenterio-dortsala" x={760} y={430} ax={628} ay={420} small />
      <Label id="erdiko-hestea" x={760} y={480} ax={552} ay={494} />
    </g>
  );
}

/** 7:septum-transversum:sagitala — the septum appears at C3–C5 and splits the coelom, except the canals. */
export function SeptumLateral({ t, reduced }: SceneProps) {
  const septum = seg(t, 0.2, 0.34);
  const eso = seg(t, 0.36, 0.42);
  const split = seg(t, 0.54, 0.62);
  const canals = seg(t, 0.72, 0.78);
  const levels = vis(t, 0.18, 0.54);
  return (
    <g>
      <LateralDrawing septum={septum} split={split} canals={canals} levels={levels} eso={eso} reduced={reduced} />
      <Levels show={levels} />
      <Note x={500} y={612} tone="accent" show={vis(t, 0.2, 0.36)}>
        4. astea: lepo mailan (C3–C5) mesodermo-trenkada horizontala
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.36, 0.54)}>
        Aurrean eta alboetan gorputz paretan finkatuta; atzean, hestegorri inguruko mesenkiman
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.54, 0.72)}>
        Goian hasierako perikardio barrunbea · behean peritoneo barrunbea
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.72)}>
        Banaketa partziala: atze-alboetako bi erretenek goiko eta beheko barrunbeak lotzen dituzte
      </Note>

      <Label id="enbrioi-barruko-zeloma" x={236} y={440} ax={460} ay={452} show={1 - split} />
      <Label id="hasierako-perikardio-barrunbea" x={250} y={214} ax={414} ay={236} show={split} />
      <Label id="bihotza" x={236} y={262} ax={436} ay={276} />
      <Label id="septum-transversum" x={236} y={372} ax={404} ay={372} show={seg(t, 0.2, 0.24)} />
      <Label id="peritoneo-barrunbea" x={236} y={440} ax={460} ay={452} show={split} />
      <Label id="hodi-onfalomesenterikoa" x={236} y={556} ax={320} ay={508} small />

      <Label id="hodi-neurala" x={760} y={80} ax={640} ay={104} />
      <Label id="somitak" x={760} y={132} ax={SOMITES[1][0] + 6} ay={SOMITES[1][1]} small />
      <Label id="aurreko-hestea" x={760} y={186} ax={578} ay={206} />
      <Label id="hestegorri-inguruko-mesenkima" x={760} y={244} ax={634} ay={262} show={eso} small />
      <Label id="erreten-perikardioperitonealak" x={760} y={282} ax={CANAL[0] + 16} ay={CANAL[1] - 4} show={canals} small />
      <Label id="mesenterio-dortsala" x={760} y={430} ax={628} ay={420} small />
      <Label id="erdiko-hestea" x={760} y={480} ax={552} ay={494} />
    </g>
  );
}
