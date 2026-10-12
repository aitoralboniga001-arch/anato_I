'use client';

import { useContext, useId, type ReactNode } from 'react';
import { C, Part, clamp, lerp, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { SceneContext } from '@/components/kit/context';
import { EarlyEmbryo, earlyGeom } from '@/components/scenes/week5/EarlyEmbryo';
import { P, f1 } from './common';
import { HEART_C, LoopHeart } from './LoopHeart';

/**
 * Topic 7's embryo is topic 5's day-32 embryo (week5/EarlyEmbryo, traced from Langman: C-shaped, the
 * big head bent over the heart prominence, the pharyngeal arches, the limb buds, the somites along the
 * back, the tail curling in under the cord; face to the left = ventral, back to the right = dorsal), so
 * the student meets the same figure as in topics 5, 6 and 9. The trunk's skin turns see-through in the
 * middle, and the body cavities are seen inside it as tinted volumes, in their places in a side view:
 * the pericardial cavity in the heart prominence, the septum transversum as a plate under the heart,
 * the peritoneal cavity in the belly, and the pericardioperitoneal canals running dorsal to the septum
 * beside the foregut.
 */

export const SIDE_DAY = 32;
const g = earlyGeom(SIDE_DAY);

/** Where the embryo sits in the 1000 × 640 frame (its own drawing is in topic 5's coordinates). */
export const SIDE = { dx: -168, dy: 24, s: 1.04 };
export const sideXY = (p: Pt): Pt => [SIDE.dx + 500 + (p[0] - 500) * SIDE.s, SIDE.dy + 320 + (p[1] - 320) * SIDE.s];
/** Back from the frame to the embryo's coordinates (for the pointer). */
export const fromSide = (p: Pt): Pt => [500 + (p[0] - SIDE.dx - 500) / SIDE.s, 320 + (p[1] - SIDE.dy - 320) / SIDE.s];

// ——— The cavities, in the embryo's coordinates ———

/** The pericardial cavity: in the heart prominence, round the heart, reaching dorsally to the foregut. */
export const PERI: Pt[] = [
  [548, 258],
  [578, 246],
  [612, 254],
  [636, 276],
  [644, 310],
  [634, 346],
  [606, 370],
  [568, 376],
  [538, 362],
  [523, 330],
  [526, 290],
];
/** The septum transversum: a thick plate under the heart, from the ventral wall back to the foregut. */
export const SEPTUM: Pt[] = [
  [540, 372],
  [578, 378],
  [620, 374],
  [654, 366],
  [660, 376],
  [626, 388],
  [584, 400],
  [544, 404],
];
/** The peritoneal cavity: the belly, under the septum, following the curve of the lower trunk. */
export const PERITO: Pt[] = [
  [556, 410],
  [606, 404],
  [652, 398],
  [674, 418],
  [668, 452],
  [634, 484],
  [586, 500],
  [536, 500],
  [500, 486],
  [488, 460],
  [504, 432],
  [530, 418],
];
/** A pericardioperitoneal canal (seen from the side): dorsal to the septum, beside the foregut. */
export const CANAL: Pt[] = [
  [626, 258],
  [652, 278],
  [672, 316],
  [680, 360],
  [672, 404],
];
/** The foregut (pharynx → oesophagus) down the back of the cavities to the stomach. */
export const FOREGUT: Pt[] = [
  [664, 222],
  [670, 270],
  [686, 330],
  [688, 384],
];
export const STOMACH: Pt = [682, 400];
/**
 * The midgut, hung from the dorsal mesentery: a hairpin loop pointing ventrally at the yolk stalk
 * (cranial limb above, caudal limb below), then the hindgut on towards the cloaca.
 */
export const MIDGUT: Pt[] = [
  [686, 418],
  [688, 444],
  [664, 442],
  [624, 430],
  [584, 420],
  [556, 418],
  [572, 436],
  [614, 450],
  [652, 462],
  [672, 480],
  [652, 496],
  [612, 504],
];
/** The vitelline duct: from the loop's apex, under the septum's ventral end, into the cord. */
export const DUCT: Pt[] = [
  [556, 418],
  [534, 408],
  [516, 394],
  [500, 376],
  [470, 366],
];
/** The gut on from the foregut's end (where a view draws no stomach) into the midgut loop. */
const GUT_ON: Pt[] = [FOREGUT[FOREGUT.length - 1], [688, 402], ...MIDGUT];
/** The dorsal mesentery: from the dorsal body wall down to the gut. */
export const MESENTERY: Pt[] = [
  [692, 410],
  [708, 436],
  [700, 470],
  [682, 494],
  [664, 486],
  [672, 470],
  [652, 456],
  [670, 444],
  [690, 438],
];
/** The whole coelom as one space (a view that splits it itself, by its own septum line). */
export const COELOM_ALL: Pt[] = [
  [548, 258],
  [578, 246],
  [612, 254],
  [640, 276],
  [662, 304],
  [680, 340],
  [690, 380],
  [690, 424],
  [676, 458],
  [640, 490],
  [588, 506],
  [532, 504],
  [494, 488],
  [484, 460],
  [500, 432],
  [530, 414],
  [536, 392],
  [524, 350],
  [522, 300],
];
/** The looping heart of topic 7's sagittal drawings (Lateral.tsx), placed in the pericardial cavity with room round it. */
export const HEART_IN = { x: 582, y: 312, rot: 24, k: 0.5 };
export const HEART_T = `translate(${HEART_IN.x} ${HEART_IN.y}) rotate(${HEART_IN.rot}) scale(${HEART_IN.k}) translate(${-HEART_C[0]} ${-HEART_C[1]})`;

const BODY: Pt[] = [...g.spine, ...[...g.inner].reverse()];
/** Point on the back at spine parameter u (0 = hindbrain, 1 = tail tip), `d` units in from the dorsal skin. */
export const backAt = (u: number, d = 0) => spineAt(g.S, u, d);
/** The spinal cord, just under the dorsal skin, from below the hindbrain to the tail. */
const CORD_LINE: Pt[] = Array.from({ length: 36 }, (_, i) => backAt(0.12 + (0.8 * i) / 35, 6).p);


/**
 * The transverse plane at body level z, as the mapa's section draws it (0 = the low abdomen, 1 = the
 * neck; the thorax above 0.5, the septum between 0.44 and 0.5, the peritoneal cavity below): a line
 * across the trunk, square to the back, from the dorsal skin to the ventral skin. Fitted level by level
 * so the line crosses exactly what the section shows at that level.
 */
const PLANES: [number, Pt, Pt][] = [
  [0.08, [642, 515], [466, 428]],
  [0.26, [690, 467], [500, 410]],
  [0.44, [731, 384], [544, 404]],
  [0.47, [735, 370], [540, 389]],
  [0.5, [737, 356], [538, 372]],
  [0.7, [744, 300], [516, 312]],
  [0.9, [742, 240], [546, 250]],
  [0.92, [741, 232], [550, 244]],
];
export function planeAt(z: number): [Pt, Pt] {
  const k = clamp(z, PLANES[0][0], PLANES[PLANES.length - 1][0]);
  let i = 1;
  while (i < PLANES.length - 1 && PLANES[i][0] < k) i++;
  const [z0, a0, b0] = PLANES[i - 1];
  const [z1, a1, b1] = PLANES[i];
  const f = (k - z0) / (z1 - z0 || 1);
  return [
    [lerp(a0[0], a1[0], f), lerp(a0[1], a1[1], f)],
    [lerp(b0[0], b1[0], f), lerp(b0[1], b1[1], f)],
  ];
}
/** The body level whose plane passes nearest a point (for dragging the plane). */
export function zNear(p: Pt) {
  let best = 0.5;
  let bd = Infinity;
  for (let z = 0.08; z <= 0.921; z += 0.01) {
    const [a, b] = planeAt(z);
    const t = clamp(((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1));
    const d = Math.hypot(p[0] - lerp(a[0], b[0], t), p[1] - lerp(a[1], b[1], t));
    if (d < bd) {
      bd = d;
      best = z;
    }
  }
  return best;
}

export interface SideState {
  /** The cavity tints: upper (coelom → primitive pericardial → pericardial), lower (→ peritoneal), canal (→ pleural). */
  upper: string;
  lower: string;
  side: string;
  /** 0..1 the septum, the canals as their own channel, the lung buds, the pleuropericardial and pleuroperitoneal membranes. */
  sep: number;
  canal: number;
  lung: number;
  ppm: number;
  pom: number;
  /** Ids for the cavities as they are named at this step. */
  ids: { upper: string; lower: string; canal: string; gut: string };
}

const sp = (pts: readonly Pt[], closed = true) => smoothPath(pts as Pt[], closed, 0.42);

/**
 * The context dims every quiet part of a step; the embryo's outside is the frame of reference, so it
 * keeps its skin (a dimmed skin reads grey). Pointing at a structure still lights only that.
 */
function Undimmed({ children }: { children: ReactNode }) {
  const ctx = useContext(SceneContext);
  return <SceneContext.Provider value={{ ...ctx, focus: [], spotlight: undefined }}>{children}</SceneContext.Provider>;
}

/** Where a side view puts the embryo in the frame. */
export interface Place {
  dx: number;
  dy: number;
  s: number;
}
export const placeXY = (q: Place) => (p: Pt): Pt => [q.dx + 500 + (p[0] - 500) * q.s, q.dy + 320 + (p[1] - 320) * q.s];

export interface SideOpts {
  st: SideState;
  /** The transverse plane's level (see planeAt), drawn as a line; `planeColor` tints it. */
  plane?: number;
  planeColor?: string;
  beating?: boolean;
  /** 0..1 fluid passing down the canal. */
  flow?: number;
  reduced?: boolean;
  place?: Place;
  /** Leave out this module's cavities / septum / heart (a view that draws its own). */
  cavities?: boolean;
  septum?: boolean;
  heart?: boolean;
  /** Leave out topic 5's somite beads (a view that draws the vertebral levels itself). */
  hideSomites?: boolean;
  /** Leave out the foregut (a view that draws its own oesophagus). */
  gut?: boolean;
  /** Draw the stomach, the midgut loop with its mesentery and the vitelline duct. */
  stomach?: boolean;
  midgut?: boolean;
  /** 0..1 the coelom drawn as one cavity (`wholeId`, the upper tint) instead of its pieces. */
  whole?: number;
  wholeId?: string;
  /** 0..1 the cavity tints pouring from the cranial end to the caudal end. */
  pour?: number;
  /** Septum growth: `cells` gathering, `reach` of the plate from the ventral wall (1 = at the oesophageal mesenchyme), `solid` plate. */
  cells?: number;
  reach?: number;
  solid?: number;
  /** 0..1 the oesophageal mesenchyme shown; `anchors` glow at the plate's two ends. */
  meso?: number;
  anchors?: number;
  /** Drawn inside the embryo's coordinates: under the cavities (`under`) or on top (`children`). */
  under?: ReactNode;
  children?: ReactNode;
}

/** Mesenchymal cells gathering into the septum (u along the plate, v across it). */
const SEP_CELLS = Array.from({ length: 20 }, (_, i) => ({ u: 0.04 + 0.92 * ((i * 0.618 + 0.13) % 1), v: ((i * 0.383) % 1) - 0.5 }));
const alongPts = (pts: Pt[], u: number): Pt => {
  const f = clamp(u) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const k = f - i;
  return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
};
const onSeptum = (u: number, v: number): Pt => {
  const a = alongPts([SEPTUM[0], SEPTUM[1], SEPTUM[2], SEPTUM[3]], u);
  const b = alongPts([SEPTUM[7], SEPTUM[6], SEPTUM[5], SEPTUM[4]], u);
  return [lerp(a[0], b[0], 0.5 + v * 0.7), lerp(a[1], b[1], 0.5 + v * 0.7)];
};

/** The embryo, its see-through trunk and the cavities in it. */
export function SideEmbryo(o: SideOpts) {
  const { st, plane, planeColor = '#f4f7ff', beating, flow = 0, reduced, place = SIDE, cavities = true, septum = true, heart = true, gut = true, whole = 0, wholeId, hideSomites, stomach, midgut, pour = 1, cells = 0, reach = 1, solid, meso = 1, anchors = 0, under, children } = o;
  const uid = useId().replace(/:/g, '');
  const id = `w7side${uid}`;
  const vol = `url(#${id}-vol)`;
  const pourMask = pour < 0.999 ? `url(#${id}-pour)` : undefined;
  const cav = (pid: string, pts: readonly Pt[], col: string, show = 1) => (
    <Part id={pid} show={show}>
      <path d={sp(pts)} fill={P.space} opacity={0.55} />
      <path d={sp(pts)} fill={col} opacity={0.62} mask={pourMask} />
      <path d={sp(pts)} fill={vol} />
      <path d={sp(pts)} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.4} />
    </Part>
  );
  const pl = plane === undefined ? null : planeAt(plane);
  const canalW = lerp(9, 13, st.canal);
  // The lung buds grow from the foregut down into the canals.
  const lungPts: Pt[] = [
    [682, 256],
    [lerp(682, 670, st.lung), lerp(262, 292, st.lung)],
    [lerp(684, 662, st.lung), lerp(266, 326, st.lung)],
  ];
  const plate = solid ?? clamp(st.sep * 1.4);
  const reachX = lerp(552, 672, clamp(reach));
  const T = `translate(${place.dx + 500} ${place.dy + 320}) scale(${place.s}) translate(-500 -320)`;
  return (
    <g transform={T}>
      <defs>
        <filter id={`${id}-feather`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <clipPath id={`${id}-body`}>
          <path d={smoothPath(BODY, true, 0.5)} />
          <ellipse cx={g.heart[0]} cy={g.heart[1]} rx={g.heart[2]} ry={g.heart[3]} transform={`rotate(${g.heart[4] ?? 0} ${g.heart[0]} ${g.heart[1]})`} />
        </clipPath>
        <clipPath id={`${id}-reach`}>
          <rect x={400} y={300} width={reachX - 400} height={160} rx={8} />
        </clipPath>
        <mask id={`${id}-see`}>
          <path d={sp([[536, 252], [600, 236], [664, 244], [708, 300], [712, 380], [696, 446], [654, 500], [592, 524], [530, 520], [482, 498], [470, 462], [492, 424], [516, 398], [516, 330], [522, 280]])} fill="#fff" filter={`url(#${id}-feather)`} />
        </mask>
        <linearGradient id={`${id}-pourg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset={f1(Math.max(0, pour * 1.2 - 0.2))} stopColor="#fff" />
          <stop offset={f1(Math.min(1, pour * 1.2))} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-pour`} maskUnits="userSpaceOnUse" x={400} y={230} width={320} height={300}>
          <rect x={400} y={230} width={320} height={300} fill={`url(#${id}-pourg)`} />
        </mask>
        <radialGradient id={`${id}-vol`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffd9a0" stopOpacity={0.8} />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-film`} cx="0.3" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#fff4ee" stopOpacity={0.22} />
          <stop offset="0.6" stopColor="#fff4ee" stopOpacity={0.04} />
          <stop offset="1" stopColor="#f6b7a6" stopOpacity={0.1} />
        </radialGradient>
      </defs>
      <Undimmed>
        <EarlyEmbryo day={SIDE_DAY} beat={0} hideSomites={hideSomites} />
      </Undimmed>
      {/* The trunk seen through its thin wall: the skin fades out towards the middle, the inside is dark. */}
      <g clipPath={`url(#${id}-body)`} pointerEvents="none">
        <rect x={300} y={40} width={520} height={600} fill="#24101a" opacity={0.78} mask={`url(#${id}-see)`} />
      </g>
      {/* The spinal cord along the back (the neural tube, drawn once), seen through the dorsal skin. */}
      <Part id="hodi-neurala">
        <path d={sp(CORD_LINE, false)} fill="none" stroke="rgba(10,16,48,0.55)" strokeWidth={8} strokeLinecap="round" />
        <path d={sp(CORD_LINE, false)} fill="none" stroke={C.neural} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      </Part>
      {under}
      {/* The mesenchyme round the foregut (the dorsal mesentery of the oesophagus). */}
      {meso > 0.02 && (
        <Part id="hestegorri-inguruko-mesenkima" show={meso}>
          <path d={sp(FOREGUT, false)} fill="none" stroke={P.eso} strokeWidth={40} strokeLinecap="round" opacity={0.42} />
        </Part>
      )}
      {midgut && (
        <Part id="mesenterio-dortsala">
          <path d={sp(MESENTERY)} fill={P.serosa} opacity={0.26} />
          <path d={sp(MESENTERY)} fill="none" stroke={P.serosa} strokeWidth={1.2} opacity={0.6} />
        </Part>
      )}
      {/* One cavity, then two joined by the canals: the upper (pericardial), the lower (peritoneal). */}
      {cavities && whole > 0.01 && cav(wholeId ?? st.ids.upper, COELOM_ALL, st.upper, whole)}
      {cavities && whole < 0.99 && (
        <>
          {cav(st.ids.upper, PERI, st.upper, 1 - whole)}
          {cav(st.ids.lower, PERITO, st.lower, 1 - whole)}
          {/* Before the septum, the space under the heart is still the one coelom. */}
          {st.sep < 0.98 && cav(st.ids.upper, [[540, 360], [600, 368], [650, 360], [664, 390], [620, 408], [560, 410]], st.upper, (1 - st.sep) * (1 - whole))}
          <Part id={st.ids.canal} show={1 - whole}>
            <path d={sp(CANAL, false)} fill="none" stroke={P.space} strokeWidth={canalW + 4} strokeLinecap="round" opacity={0.7} />
            <path d={sp(CANAL, false)} fill="none" stroke={st.side} strokeWidth={canalW} strokeLinecap="round" opacity={0.9} mask={pourMask} />
            <path d={sp(CANAL, false)} fill="none" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" opacity={0.4} transform="translate(-2 -1)" />
          </Part>
        </>
      )}
      {/* The foregut down the back of the cavities, then the stomach and the midgut loop to the yolk stalk. */}
      {gut && (
        <Part id={st.ids.gut}>
          <path d={sp(FOREGUT, false)} fill="none" stroke="#8a6a1e" strokeWidth={11} strokeLinecap="round" />
          <path d={sp(FOREGUT, false)} fill="none" stroke={P.gut} strokeWidth={7.5} strokeLinecap="round" />
        </Part>
      )}
      {stomach && (
        <Part id="urdaila">
          <ellipse cx={STOMACH[0]} cy={STOMACH[1]} rx={12} ry={17} transform={`rotate(-24 ${STOMACH[0]} ${STOMACH[1]})`} fill={P.gut} stroke="#8a6a1e" strokeWidth={1.6} />
          <ellipse cx={STOMACH[0] - 2} cy={STOMACH[1] - 4} rx={4} ry={7} transform={`rotate(-24 ${STOMACH[0]} ${STOMACH[1]})`} fill="#fff6d8" opacity={0.45} />
        </Part>
      )}
      {midgut && (
        <>
          <Part id="erdiko-hestea">
            <path d={sp(GUT_ON, false)} fill="none" stroke="#8a6a1e" strokeWidth={10} strokeLinecap="round" />
            <path d={sp(GUT_ON, false)} fill="none" stroke={P.gut} strokeWidth={6.5} strokeLinecap="round" />
          </Part>
          <Part id="hodi-onfalomesenterikoa">
            <path d={sp(DUCT, false)} fill="none" stroke="#8a6a1e" strokeWidth={6.5} strokeLinecap="round" />
            <path d={sp(DUCT, false)} fill="none" stroke="#e5b84a" strokeWidth={4} strokeLinecap="round" />
          </Part>
        </>
      )}
      {/* Fluid passing from the upper cavity down the canal into the peritoneal cavity. */}
      {flow > 0.02 && (
        <g opacity={flow} pointerEvents="none">
          {reduced
            ? [0.25, 0.55, 0.85].map((k) => {
                const q = CANAL[Math.round(k * (CANAL.length - 1))];
                return <circle key={k} cx={q[0]} cy={q[1]} r={3.2} fill="#eef8ff" />;
              })
            : [0, 0.8, 1.6].map((b) => (
                <circle key={b} r={3.4} fill="#eef8ff">
                  <animateMotion dur="2.4s" begin={`${b}s`} repeatCount="indefinite" path={sp(CANAL, false)} />
                </circle>
              ))}
        </g>
      )}
      {st.lung > 0.02 && (
        <Part id={st.lung < 0.75 ? 'birika-hastapenak' : 'birikak'}>
          <path d={sp(lungPts, false)} fill="none" stroke={P.lungDeep} strokeWidth={lerp(6, 12, st.lung)} strokeLinecap="round" />
          <path d={sp(lungPts, false)} fill="none" stroke={P.lung} strokeWidth={lerp(4, 9, st.lung)} strokeLinecap="round" />
        </Part>
      )}
      {/* The heart in its cavity. */}
      {heart && (
        <Part id="bihotza">
          <g transform={HEART_T}>
            <LoopHeart beating={!!beating} />
          </g>
        </Part>
      )}
      {/* The septum: mesenchymal cells gathering, then a plate growing from the ventral wall back to the oesophageal mesenchyme. */}
      {septum && cells > 0.02 && plate < 0.98 && (
        <Part id="septum-transversum" show={clamp(cells) * (1 - plate)}>
          {SEP_CELLS.map((c, i) => {
            const q = onSeptum(c.u, c.v);
            return <circle key={i} cx={f1(q[0])} cy={f1(q[1])} r={3.4} fill={P.septum} stroke={P.septumDeep} strokeWidth={0.9} />;
          })}
        </Part>
      )}
      {septum && plate > 0.02 && (
        <Part id="septum-transversum" show={plate}>
          <g clipPath={reach < 0.999 ? `url(#${id}-reach)` : undefined}>
            <path d={sp(SEPTUM)} fill={P.septum} />
            <path d={sp(SEPTUM)} fill={vol} />
            <path d={sp(SEPTUM)} fill="none" stroke={P.septumDeep} strokeWidth={1.2} />
          </g>
        </Part>
      )}
      {anchors > 0.02 && (
        <g opacity={anchors} pointerEvents="none">
          <ellipse cx={548} cy={390} rx={24} ry={19} fill={`url(#${id}-glow)`} />
          <ellipse cx={666} cy={376} rx={26} ry={21} fill={`url(#${id}-glow)`} />
        </g>
      )}
      {st.pom > 0.02 && (
        <Part id="mintz-pleuroperitonealak" show={st.pom}>
          <path d="M664,404 Q676,398 690,402" fill="none" stroke={P.poMem} strokeWidth={6} strokeLinecap="round" />
        </Part>
      )}
      {st.ppm > 0.02 && (
        <Part id="mintz-pleuroperikardikoak" show={st.ppm}>
          <path d="M624,280 Q636,296 652,300" fill="none" stroke={P.ppMem} strokeWidth={6} strokeLinecap="round" />
        </Part>
      )}
      {/* A light film of skin over it all, so it still reads as seen through the wall. */}
      <g clipPath={`url(#${id}-body)`} pointerEvents="none">
        <rect x={300} y={40} width={520} height={600} fill={`url(#${id}-film)`} mask={`url(#${id}-see)`} />
      </g>
      {/* The upper limb bud stands on the lateral wall over the cavities: drawn as a see-through mound. */}
      <g pointerEvents="none">
        <ellipse cx={g.arm[0]} cy={g.arm[1]} rx={g.arm[2] * 0.95} ry={g.arm[3] * 0.95} transform={`rotate(${g.arm[4] ?? 0} ${g.arm[0]} ${g.arm[1]})`} fill="#f8cdbf" opacity={0.22} stroke="#fde6dc" strokeWidth={1.6} strokeOpacity={0.75} />
        <path d={`M${f1(g.arm[0] - g.arm[2] * 0.7)},${f1(g.arm[1] - g.arm[3] * 0.4)}Q${f1(g.arm[0] - g.arm[2] * 0.2)},${f1(g.arm[1] - g.arm[3] * 0.9)} ${f1(g.arm[0] + g.arm[2] * 0.5)},${f1(g.arm[1] - g.arm[3] * 0.75)}`} fill="none" stroke="#fffaf6" strokeWidth={2.2} strokeLinecap="round" opacity={0.6} />
      </g>
      {pl && (
        <g pointerEvents="none">
          <path d={`M${f1(pl[0][0])},${f1(pl[0][1])}L${f1(pl[1][0])},${f1(pl[1][1])}`} stroke={planeColor} strokeWidth={12} strokeLinecap="round" opacity={0.16} />
          <path d={`M${f1(pl[0][0])},${f1(pl[0][1])}L${f1(pl[1][0])},${f1(pl[1][1])}`} stroke={planeColor} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      )}
      {children}
    </g>
  );
}

/** A bare look at the embryo (dev contact sheets only): the septum stage with its canals. */
export function SideEmbryoDemo({ t }: SceneProps) {
  const st: SideState = {
    upper: t < 0.3 ? P.coelomSolid : P.periSolid,
    lower: t < 0.3 ? P.coelomSolid : P.peritoSolid,
    side: t < 0.3 ? P.coelomSolid : '#9ad0f0',
    sep: t < 0.3 ? 0 : 1,
    canal: t < 0.3 ? 0 : 1,
    lung: t > 0.7 ? 1 : 0,
    ppm: t > 0.7 ? 1 : 0,
    pom: t > 0.7 ? 1 : 0,
    ids: { upper: 'enbrioi-barruko-zeloma', lower: 'peritoneo-barrunbea', canal: 'erreten-perikardioperitonealak', gut: 'aurreko-hestea' },
  };
  return (
    <g>
      <rect width={1000} height={640} fill="#0c0c0f" />
      <SideEmbryo st={st} plane={0.7} midgut stomach />
    </g>
  );
}
