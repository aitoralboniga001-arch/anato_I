'use client';

import { useId } from 'react';
import { Arrow, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, Q, f1, spline, vis } from './common';

/**
 * 8:buru-ganga — apunteen 3.1.1 atala eta 27. orriko irudiak (jaioberriaren burezurra goitik eta albotik).
 * Buru-gangako hezurrak mintzezko hezurtzapenez sortzen dira: hezurtzapen zentro bakoitzetik (goragune frontala,
 * parietala…) hezur espikulak erradialki hazten dira mintzaren barruan, eta hezurren artean ehun konektiboa
 * geratzen da: joskura estuak (bi hezurren artean) eta fontanela zabalagoak (bi hezur baino gehiago elkartzen
 * diren lekuan). Erditzean plakak gainjartzen dira; jaio ondoren atzeko fontanela (1–2. hil.) eta aurrekoa
 * (18. hil.) ixten dira, joskurak beranduago.
 */

export const CAL_T = {
  grow: 0.14,
  bones: 0.28,
  sutures: 0.42,
  fontanelles: 0.56,
  side: 0.68,
  birth: 0.8,
  after: 0.9,
};

export type Bone = { id: string; region: Pt[]; c: Pt; r: number; side?: 1 | -1 };

// ——— Top view (front at the top) ———
const CX = 500;
const OUT = spline(
  [
    [500, 64],
    [590, 78],
    [650, 140],
    [670, 260],
    [664, 380],
    [634, 480],
    [574, 552],
    [500, 574],
    [426, 552],
    [366, 480],
    [336, 380],
    [330, 260],
    [350, 140],
    [410, 78],
  ],
  10,
  true,
);
const AF: Pt = [500, 238];
const PF: Pt = [500, 480];
/** Coronal suture (left half, edge → bregma) and lambdoid (left half, edge → lambda). */
const CORONAL_L = spline(
  [
    [328, 262],
    [380, 248],
    [440, 240],
    [AF[0], AF[1]],
  ],
  8,
);
const LAMBDOID_L = spline(
  [
    [352, 444],
    [400, 452],
    [452, 466],
    [PF[0], PF[1]],
  ],
  8,
);
const mirX = (p: Pt): Pt => [2 * CX - p[0], p[1]];
const BIG = 900;
const regionTop = (side: 1 | -1): Pt[] => {
  const cor = side > 0 ? CORONAL_L.map(mirX) : CORONAL_L;
  return [[CX, -BIG], [CX + side * BIG, -BIG], [CX + side * BIG, cor[0][1]], ...cor];
};
const regionMid = (side: 1 | -1): Pt[] => {
  const cor = side > 0 ? CORONAL_L.map(mirX) : CORONAL_L;
  const lam = side > 0 ? LAMBDOID_L.map(mirX) : LAMBDOID_L;
  return [[CX + side * BIG, cor[0][1]], ...cor, [CX, AF[1]], ...lam.slice().reverse(), [CX + side * BIG, lam[0][1]]];
};
const regionBack: Pt[] = [[-BIG, LAMBDOID_L[0][1]], ...LAMBDOID_L, ...LAMBDOID_L.map(mirX).reverse(), [BIG + 1000, LAMBDOID_L[0][1]], [BIG + 1000, BIG], [-BIG, BIG]];
const TOP_BONES: Bone[] = [
  {
    id: 'hezur-frontala',
    region: regionTop(-1),
    c: [442, 150],
    r: 200,
    side: -1,
  },
  {
    id: 'hezur-frontala',
    region: regionTop(1),
    c: [558, 150],
    r: 200,
    side: 1,
  },
  {
    id: 'hezur-parietala',
    region: regionMid(-1),
    c: [410, 350],
    r: 210,
    side: -1,
  },
  {
    id: 'hezur-parietala',
    region: regionMid(1),
    c: [590, 350],
    r: 210,
    side: 1,
  },
  { id: 'okzipitalaren-ezkata', region: regionBack, c: [500, 532], r: 170 },
];
/** Parietals last: at birth they ride over the frontal and occipital plates. */
const DRAW_ORDER = [0, 1, 4, 2, 3];
const AF_SHAPE = (k: number): Pt[] => {
  const s = Math.max(0.001, k);
  return spline(
    [
      [AF[0], AF[1] - 62 * s],
      [AF[0] + 40 * s, AF[1] - 2 * s],
      [AF[0], AF[1] + 70 * s],
      [AF[0] - 40 * s, AF[1] - 2 * s],
    ],
    6,
    true,
  );
};
const PF_SHAPE = (k: number): Pt[] => {
  const s = Math.max(0.001, k);
  return spline(
    [
      [PF[0], PF[1] - 24 * s],
      [PF[0] + 26 * s, PF[1] + 12 * s],
      [PF[0] - 26 * s, PF[1] + 12 * s],
    ],
    6,
    true,
  );
};

// ——— Side view (a newborn skull, face to the right): a big vault over a small face ———
export const SOUT = spline(
  [
    [700, 296],
    [712, 252],
    [716, 200],
    [704, 150],
    [676, 108],
    [630, 80],
    [574, 64],
    [510, 60],
    [446, 68],
    [388, 90],
    [336, 126],
    [296, 176],
    [270, 240],
    [264, 300],
    [276, 360],
    [304, 410],
    [344, 446],
    [392, 466],
    [440, 462],
    [490, 440],
    [548, 414],
    [604, 388],
    [652, 358],
    [688, 326],
  ],
  10,
  true,
);
/** Sphenoidal (pterion) and mastoid (asterion) fontanelles. */
const SAF: Pt = [594, 300];
const SPF: Pt = [374, 396];
const SCORONAL = spline(
  [
    [578, 40],
    [588, 140],
    [598, 222],
    [SAF[0], SAF[1]],
  ],
  8,
);
const SLAMBDOID = spline(
  [
    [352, 92],
    [326, 190],
    [336, 300],
    [SPF[0], SPF[1]],
  ],
  8,
);
/** The squamous suture: the arched top of the temporal squama. */
const SSQUAMOUS = spline(
  [
    [SAF[0] - 10, SAF[1] + 4],
    [544, 270],
    [480, 260],
    [422, 282],
    [388, 330],
    [SPF[0] + 4, SPF[1] - 4],
  ],
  8,
);
const SSPHENO = spline(
  [
    [SAF[0] - 4, SAF[1] + 10],
    [586, 352],
    [578, 410],
  ],
  6,
);
/** Greater wing ↔ frontal and zygomatic (the front edge of the wing). */
const SFRONT = spline([[SAF[0] + 6, SAF[1] + 4], [614, 330], [618, 372], [612, 404]], 6);
/** Occipital ↔ temporal, from the mastoid fontanelle down to the base. */
const SOCCMAST = spline([[SPF[0] + 4, SPF[1] + 6], [386, 432], [398, 470]], 6);
export const SIDE_BONES: Bone[] = [
  {
    id: 'hezur-frontala',
    region: [...SCORONAL, ...SFRONT.slice(1), [640, 440], [BIG, 440], [BIG, -BIG], [SCORONAL[0][0], -BIG]],
    c: [668, 168],
    r: 220,
  },
  {
    id: 'hezur-parietala',
    region: [...SCORONAL, ...SSQUAMOUS, ...SLAMBDOID.slice().reverse(), [352, -BIG], [SCORONAL[0][0], -BIG]],
    c: [470, 162],
    r: 240,
  },
  {
    id: 'okzipitalaren-ezkata',
    region: [[352, -BIG], ...SLAMBDOID, ...SOCCMAST, [398, BIG], [-BIG, BIG], [-BIG, -BIG]],
    c: [300, 290],
    r: 220,
  },
  {
    id: 'tenporalaren-ezkata',
    region: [...SSQUAMOUS, ...SOCCMAST, [398, 520], [578, 520], ...SSPHENO.slice().reverse()],
    c: [478, 338],
    r: 150,
  },
  {
    id: 'esfenoidesaren-hego-handia',
    region: [...SSPHENO, [612, 420], ...SFRONT.slice().reverse()],
    c: [598, 352],
    r: 80,
  },
];
const SAF_SHAPE = (k: number): Pt[] => {
  const s = Math.max(0.001, k);
  return spline(
    [
      [SAF[0] - 6 * s, SAF[1] - 24 * s],
      [SAF[0] + 16 * s, SAF[1] - 2 * s],
      [SAF[0] + 4 * s, SAF[1] + 20 * s],
      [SAF[0] - 20 * s, SAF[1] + 4 * s],
    ],
    6,
    true,
  );
};
const SPF_SHAPE = (k: number): Pt[] => {
  const s = Math.max(0.001, k);
  return spline(
    [
      [SPF[0] - 4 * s, SPF[1] - 24 * s],
      [SPF[0] + 20 * s, SPF[1] - 4 * s],
      [SPF[0] + 6 * s, SPF[1] + 20 * s],
      [SPF[0] - 18 * s, SPF[1] + 2 * s],
    ],
    6,
    true,
  );
};
// The face (viscerocranium): small at birth, under a big orbit. One mass (nasal, maxilla, zygomatic and the arch)
// with its sutures drawn in, the mandible apart below it.
/** The orbit: big at birth, a rounded square seen a little from the front. */
export const ORBIT = spline([[640, 300], [662, 290], [688, 296], [701, 316], [699, 342], [683, 358], [656, 361], [636, 347], [630, 322]], 8, true);
/**
 * The face (nasal, maxilla, zygomatic and the zygomatic arch back to the temporal root): nasion, nasal bone,
 * the edge of the piriform aperture, anterior nasal spine, alveolar process, maxillary tuberosity, the arch
 * (lower border back, upper border forward), the zygomatic's frontal process up the lateral orbital rim.
 */
const FACE = spline(
  [
    [700, 288], [712, 304], [724, 328], [730, 344], [722, 350], [718, 362], [732, 378], [734, 384], [729, 398], [723, 414],
    [706, 423], [686, 425], [664, 425], [644, 423], [633, 410], [612, 404], [584, 405], [556, 407], [530, 409], [512, 409],
    [505, 401], [514, 393], [544, 391], [574, 389], [604, 385], [618, 371], [622, 348], [624, 322], [628, 296], [636, 284],
    [662, 276], [688, 279],
  ],
  8,
  true,
);
/** Sutures of the face: nasal ↔ maxilla, zygomatic ↔ maxilla, zygomatic ↔ temporal (in the arch). */
const FACE_SUTURES = 'M702,292 C710,310 716,330 720,348 M652,360 C645,378 639,392 633,406 M567,389 L563,406';
/** The newborn mandible: rounded chin, long body, short ramus at an open angle, condyle at the joint, coronoid under the arch. */
export const MANDIBLE = spline(
  [
    [722, 417], [729, 444], [725, 468], [712, 488], [680, 500], [640, 504], [600, 498], [568, 486], [548, 471], [536, 453],
    [528, 433], [519, 422], [511, 416], [512, 406], [522, 404], [531, 411], [539, 424], [550, 430], [559, 418], [566, 401],
    [575, 398], [581, 412], [594, 422], [614, 419], [642, 418], [672, 418], [700, 418],
  ],
  8,
  true,
);
export const EAM: Pt = [482, 420];
/** Tooth germs in their crypts (maxilla, mandible): the teeth have not erupted at birth. */
const TEETH: Pt[] = [[706, 408], [686, 411], [664, 410], [700, 446], [678, 452], [654, 455], [628, 452]];
/**
 * The orbit as a deep socket: dark at the back, its walls catching light inside, a bright rim. `flip` mirrors it
 * (face to the left).
 */
export function Orbit({ flip = false }: { flip?: boolean }) {
  const gid = useId().replace(/:/g, '');
  const pts = flip ? ORBIT.map(([x, y]) => [1000 - x, y] as Pt) : ORBIT;
  const d = smoothPath(pts, true, 0.3);
  const fx = (x: number) => (flip ? 1000 - x : x);
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`w8-orb${gid}`} cx={flip ? '0.6' : '0.4'} cy="0.55" r="0.62">
          <stop offset="0" stopColor="#030304" />
          <stop offset="0.55" stopColor="#141010" />
          <stop offset="0.85" stopColor="#5a4e3c" />
          <stop offset="1" stopColor="#a8987a" />
        </radialGradient>
        <clipPath id={`w8-orbc${gid}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#w8-orb${gid})`} />
      <g clipPath={`url(#w8-orbc${gid})`}>
        {/* Orbital floor and the greater wing at the back, lit from above; the superior orbital fissure between them. */}
        <path d={`M${fx(628)},350 Q${fx(664)},330 ${fx(704)},346 L${fx(704)},366 L${fx(628)},366Z`} fill="#c9b994" opacity={0.28} />
        <path d={`M${fx(640)},318 Q${fx(650)},300 ${fx(664)},302`} fill="none" stroke="#000" strokeWidth={3} opacity={0.6} strokeLinecap="round" />
        <circle cx={fx(668)} cy={322} r={3.2} fill="#000" />
      </g>
      <path d={d} fill="none" stroke={Q.boneDeep} strokeWidth={2.4} />
      <path d={d} fill="none" stroke="#fffaf0" strokeWidth={1.4} opacity={0.5} transform={`translate(${flip ? 1.5 : -1.5} -1.5)`} />
    </g>
  );
}

/** The brain the vault is built round (only while the box is being explained). */
const BRAIN = spline([[700, 286], [706, 200], [676, 124], [600, 86], [500, 80], [400, 100], [322, 150], [288, 230], [290, 320], [330, 392], [400, 430], [480, 420], [540, 396], [610, 366], [668, 330]], 8, true);
const GYRI = [
  'M640,120 C600,150 610,200 650,220',
  'M560,96 C530,140 560,190 520,230',
  'M470,90 C450,140 490,180 460,240',
  'M380,120 C400,170 360,210 390,260',
  'M320,200 C350,230 330,280 360,320',
  'M420,300 C470,280 520,300 560,330',
  'M600,260 C630,240 660,260 680,240',
];

const line = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;

/** A membrane bone: its region of the vault, grown out from its centre as a disc of radiating spicules. */
function BoneGrow({ b, uid, grow, fill = Q.bone }: { b: Bone; uid: string; grow: number; fill?: string }) {
  const cid = useId().replace(/:/g, '');
  const r = Math.max(0.5, b.r * grow);
  const spikes = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    return `M${f1(b.c[0])},${f1(b.c[1])}L${f1(b.c[0] + Math.cos(a) * r)},${f1(b.c[1] + Math.sin(a) * r)}`;
  }).join('');
  return (
    <g>
      <clipPath id={`${uid}${cid}-reg`}>
        <path d={`M${b.region.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`} />
      </clipPath>
      <g clipPath={`url(#${uid}${cid}-reg)`}>
        <circle cx={b.c[0]} cy={b.c[1]} r={r} fill={fill} opacity={0.92} />
        <circle cx={b.c[0]} cy={b.c[1]} r={r} fill="url(#w8-boneshade)" />
        {/* Each plate bulges at its centre (the parietal and frontal eminences): light there, shade at the edges. */}
        <circle cx={b.c[0]} cy={b.c[1]} r={r} fill="url(#w8-boss)" />
        <path d={spikes} stroke="rgba(150,120,70,0.38)" strokeWidth={1.4} />
        <circle cx={b.c[0]} cy={b.c[1]} r={7} fill="rgba(150,110,50,0.5)" />
        <path d={`M${b.region.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`} fill="none" stroke={Q.boneDeep} strokeWidth={3} opacity={Math.min(1, grow * 3)} />
      </g>
    </g>
  );
}

export function CalvariaTop({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const grow = seg(t, CAL_T.grow + 0.01, CAL_T.bones + 0.03);
  const mold = seg(t, CAL_T.birth + 0.01, CAL_T.birth + 0.05) * (1 - seg(t, CAL_T.after, CAL_T.after + 0.02));
  const pfClose = seg(t, CAL_T.after + 0.015, CAL_T.after + 0.04);
  const afClose = seg(t, CAL_T.after + 0.07, CAL_T.after + 0.098);
  const growth = seg(t, CAL_T.after, CAL_T.after + 0.09);
  const scale = 1 + 0.05 * growth - 0.06 * mold;
  const sutW = lerp(7, 4, growth);
  const sutures = vis(t, CAL_T.sutures - 0.01);
  // Heights inside the growing skull (it is scaled about y = 320).
  const sy = (y: number) => 320 + (y - 320) * (1 + 0.05 * growth);
  const mon = afClose > 0.5 ? '18. hilabetea' : pfClose > 0.5 ? '1.–2. hilabetea' : 'jaiotzean';
  void reduced;
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={`translate(${CX},320) scale(${scale.toFixed(3)},${(1 + 0.05 * growth).toFixed(3)}) translate(${-CX},-320)`}>
        {/* The membrane (connective tissue) the bones grow in. */}
        <Part id="buru-ganga" quiet>
          <path d={smoothPath(OUT, true, 0.3)} fill="#16323f" stroke={Q.suture} strokeWidth={2} opacity={0.95} />
        </Part>
        <clipPath id={`w8-top-out${cid}`}>
          <path d={smoothPath(OUT, true, 0.3)} />
        </clipPath>
        {DRAW_ORDER.map((i) => TOP_BONES[i]).map((b, k) => {
          const i = DRAW_ORDER[k];
          return (
            <Part key={i} id={b.id} show={grow > 0.01 ? 1 : 0}>
              <g clipPath={`url(#w8-top-out${cid})`}>
                <g transform={b.id === 'hezur-parietala' && b.side ? `translate(${f1(-b.side * 7 * mold)},${f1(-16 * mold)})` : b.id === 'okzipitalaren-ezkata' ? `translate(0,${f1(-26 * mold)})` : undefined}>
                  <BoneGrow b={b} uid={`w8-top-${i}`} grow={grow} />
                </g>
              </g>
            </Part>
          );
        })}
        {/* Sutures: the narrow connective strips between two bones (each named below; "joskurak" names them all). */}
        <path
          d={`${line(CORONAL_L)}${line(CORONAL_L.map(mirX))}${line(LAMBDOID_L)}${line(LAMBDOID_L.map(mirX))}M${CX},70L${CX},${AF[1]}M${CX},${AF[1]}L${CX},${PF[1]}`}
          fill="none"
          stroke={Q.suture}
          strokeWidth={sutW}
          strokeLinecap="round"
          opacity={0.75 * sutures}
          pointerEvents="none"
        />
        <Part id="joskura-metopikoa" show={sutures}>
          <path d={`M${CX},68L${CX},${AF[1] - 50}`} stroke={Q.suture} strokeWidth={sutW} strokeLinecap="round" />
        </Part>
        <Part id="joskura-koronala" show={sutures}>
          <path d={`${line(CORONAL_L)}${line(CORONAL_L.map(mirX))}`} fill="none" stroke={Q.suture} strokeWidth={sutW} strokeLinecap="round" />
        </Part>
        <Part id="joskura-sagitala" show={sutures}>
          <path d={`M${CX},${AF[1] + 60}L${CX},${PF[1] - 20}`} stroke={Q.suture} strokeWidth={sutW} strokeLinecap="round" />
        </Part>
        <Part id="joskura-lanbdoidea" show={sutures}>
          <path d={`${line(LAMBDOID_L)}${line(LAMBDOID_L.map(mirX))}`} fill="none" stroke={Q.suture} strokeWidth={sutW} strokeLinecap="round" />
        </Part>
        {/* Fontanelles: wide where more than two bones meet ("fontanelak" names them all). */}
        <Part id="aurreko-fontanela" show={vis(t, CAL_T.sutures - 0.01) * (1 - afClose)}>
          <path d={smoothPath(AF_SHAPE((1 - afClose) * (1 - 0.35 * mold)), true, 0.3)} fill={Q.suture} stroke="#9ad8f8" strokeWidth={1.4} />
        </Part>
        <Part id="atzeko-fontanela" show={vis(t, CAL_T.sutures - 0.01) * (1 - pfClose)}>
          <path d={smoothPath(PF_SHAPE((1 - pfClose) * (1 - 0.4 * mold)), true, 0.3)} fill={Q.suture} stroke="#9ad8f8" strokeWidth={1.4} />
        </Part>
        {/* Ossification centres while the bones grow. */}
        <Part id="hezurtzapen-zentroak" show={vis(t, CAL_T.grow, CAL_T.bones + 0.04)}>
          {TOP_BONES.map((b, i) => (
            <circle key={i} cx={b.c[0]} cy={b.c[1]} r={9} fill={Q.centre} stroke={Q.osteo} strokeWidth={1.4} />
          ))}
        </Part>
        <Part id="hezur-espikulak" show={vis(t, CAL_T.grow, CAL_T.bones + 0.04)}>
          {TOP_BONES.map((b, i) => (
            <circle key={i} cx={b.c[0]} cy={b.c[1]} r={Math.max(1, b.r * grow * 0.55)} fill="none" stroke="rgba(239,227,196,0.0)" strokeWidth={1} />
          ))}
          {TOP_BONES.map((b, i) =>
            Array.from({ length: 10 }, (_, j) => {
              const a = (j / 10) * Math.PI * 2 + i;
              const r = b.r * grow * 0.5;
              return <path key={`${i}${j}`} d={`M${f1(b.c[0])},${f1(b.c[1])}L${f1(b.c[0] + Math.cos(a) * r)},${f1(b.c[1] + Math.sin(a) * r)}`} stroke={Q.bone} strokeWidth={2.4} strokeLinecap="round" />;
            }),
          )}
        </Part>
        <path d={smoothPath(OUT, true, 0.3)} fill="url(#w8-light)" pointerEvents="none" />
        <path d={smoothPath(OUT, true, 0.3)} fill="url(#w8-dome)" pointerEvents="none" />
      </g>

      {/* Birth: the head is squeezed through the canal. */}
      {[-1, 1].map((sd) => (
        <Arrow key={sd} from={[CX + sd * 268, 300]} to={[CX + sd * 196, 300]} bend={0} color="#f0c674" width={4} show={mold} />
      ))}
      <Note x={CX} y={612} tone="accent" show={vis(t, 0, CAL_T.grow)}>
        Neurokraneoa kutxa bat: goian eta alboetan buru-ganga (mintzezkoa), zoruan kondrokraneoa
      </Note>
      <Note x={CX} y={612} tone="accent" show={vis(t, CAL_T.grow, CAL_T.bones)}>
        Mintzezko hezurtzapena: zentro bakoitzetik hezur espikulak, zuzenean
      </Note>
      <Note x={CX} y={612} tone="accent" show={vis(t, CAL_T.bones, CAL_T.sutures)}>
        2 hezur frontal · 2 hezur parietal · okzipitalaren ezkata: hezur lau eta zapalak
      </Note>
      <Note x={CX} y={612} tone="accent" show={vis(t, CAL_T.sutures, CAL_T.fontanelles)}>
        Joskurak: bi hezurren arteko ehun konektibozko ildo estuak
      </Note>
      <Note x={CX} y={612} tone="accent" show={vis(t, CAL_T.fontanelles, CAL_T.birth)}>
        Fontanelak: bi hezur baino gehiago elkartzen diren lekuan, zabalagoak
      </Note>
      <Note x={CX} y={612} tone="accent" show={vis(t, CAL_T.birth, CAL_T.after)}>
        Erditzean hezur plakak gainjartzen dira: kraneoa txikiagoa
      </Note>
      <Note x={CX} y={612} tone="accent" show={vis(t, CAL_T.after)}>
        Jaio ondoren: atzeko fontanela 1.–2. hilabetean, aurrekoa 18. hilabetean; joskurak beranduago
      </Note>
      <Note x={CX} y={36} size={13} tone="accent" show={vis(t, CAL_T.after + 0.01)}>
        {mon}
      </Note>

      <Label id="hezur-frontala" x={190} y={150} ax={420} ay={150} show={grow} />
      <Label id="joskura-koronala" x={190} y={250} ax={CORONAL_L[3][0]} ay={CORONAL_L[3][1]} show={sutures} />
      <Label id="hezur-parietala" x={190} y={370} ax={404} ay={370} show={grow} />
      <Label id="joskura-lanbdoidea" x={190} y={450} ax={LAMBDOID_L[3][0]} ay={LAMBDOID_L[3][1]} show={sutures} />
      <Label id="okzipitalaren-ezkata" x={190} y={540} ax={470} ay={535} show={grow} />
      <Label id="buru-ganga" x={190} y={86} ax={402} ay={92} show={vis(t, 0, CAL_T.sutures)} small />
      <Label id="hezurtzapen-zentroak" x={810} y={356} ax={TOP_BONES[1].c[0] + 8} ay={TOP_BONES[1].c[1]} show={vis(t, CAL_T.grow, CAL_T.bones + 0.04)} text="Hezurtzapen zentroak" small />
      <Label id="hezur-espikulak" x={810} y={190} ax={TOP_BONES[3].c[0] + 30} ay={TOP_BONES[3].c[1] - 20} show={vis(t, CAL_T.grow, CAL_T.bones + 0.04)} small />
      <Label id="joskura-metopikoa" x={810} y={150} ax={CX} ay={sy(130)} show={sutures} />
      <Label id="aurreko-fontanela" x={810} y={250} ax={AF[0] + 20} ay={AF[1]} show={vis(t, CAL_T.sutures) * (1 - afClose)} />
      <Label id="joskurak" x={810} y={420} ax={CX} ay={sy(430)} show={vis(t, CAL_T.sutures, CAL_T.fontanelles) + vis(t, CAL_T.birth, CAL_T.after)} small />
      <Label id="fontanelak" x={810} y={290} ax={AF[0] + 30} ay={AF[1] + 10} show={vis(t, CAL_T.fontanelles) * (1 - afClose)} small />
      <Label id="joskura-sagitala" x={810} y={380} ax={CX} ay={sy(380)} show={sutures} />
      <Label id="atzeko-fontanela" x={810} y={480} ax={PF[0] + 16} ay={PF[1]} show={vis(t, CAL_T.sutures) * (1 - pfClose)} />
    </g>
  );
}

export function CalvariaSide({ t }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const grow = seg(t, CAL_T.grow + 0.01, CAL_T.bones + 0.03);
  const sutures = vis(t, CAL_T.sutures - 0.01);
  const boxes = vis(t, 0, CAL_T.grow);
  const brain = vis(t, 0, CAL_T.grow + 0.04);
  const faceFill = '#dccfb2';
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="buru-ganga" quiet>
        <path d={smoothPath(SOUT, true, 0.3)} fill="#16323f" stroke={Q.suture} strokeWidth={2} />
      </Part>
      <clipPath id={`w8-side-out${cid}`}>
        <path d={smoothPath(SOUT, true, 0.3)} />
      </clipPath>
      {/* The brain inside, seen through the still-membranous vault. */}
      {brain > 0.01 && (
        <g opacity={0.5 * brain * (1 - grow)} clipPath={`url(#w8-side-out${cid})`} pointerEvents="none">
          <path d={smoothPath(BRAIN, true, 0.3)} fill="#c98a96" />
          <path d={GYRI.join('')} fill="none" stroke="#8a4b58" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {SIDE_BONES.map((b, i) => (
        <Part key={i} id={b.id} show={grow > 0.01 ? 1 : 0}>
          <g clipPath={`url(#w8-side-out${cid})`}>
            <BoneGrow b={b} uid={`w8-side-${i}`} grow={grow} />
          </g>
        </Part>
      ))}
      <g clipPath={`url(#w8-side-out${cid})`}>
        <path
          d={`${line(SCORONAL)}${line(SLAMBDOID)}${line(SSQUAMOUS)}${line(SSPHENO)}${line(SFRONT)}${line(SOCCMAST)}`}
          fill="none"
          stroke={Q.suture}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={sutures * 0.85}
        />
      </g>
      <Part id="fontanela-esfenoidala" show={vis(t, CAL_T.sutures - 0.01)}>
        <path d={smoothPath(SAF_SHAPE(1), true, 0.3)} fill={Q.suture} stroke="#9ad8f8" strokeWidth={1.4} />
      </Part>
      <Part id="fontanela-mastoidea" show={vis(t, CAL_T.sutures - 0.01)}>
        <path d={smoothPath(SPF_SHAPE(1), true, 0.3)} fill={Q.suture} stroke="#9ad8f8" strokeWidth={1.4} />
      </Part>
      {/* Neurocranium (the box round the brain): vault on top and sides, floor = chondrocranium. */}
      <Part id="neurokraneoa" show={boxes}>
        <path d={smoothPath(SOUT, true, 0.3)} fill="rgba(255,255,255,0.03)" stroke="#f0c674" strokeWidth={3} />
      </Part>
      {/* Neurocranium floor: the chondrocranium (cranial base), under the face; on top so it can be pointed at. */}
      <Part id="kondrokraneoa" show={boxes}>
        <path d="M318,430 C380,470 450,466 510,436 C570,410 630,384 690,330" fill="none" stroke={Q.cart} strokeWidth={12} strokeLinecap="round" opacity={0.9} />
        <path d="M318,430 C380,470 450,466 510,436 C570,410 630,384 690,330" fill="none" stroke="url(#w8-cart)" strokeWidth={12} strokeLinecap="round" />
      </Part>
      <path d={smoothPath(SOUT, true, 0.3)} fill="url(#w8-light)" pointerEvents="none" />
      <path d={smoothPath(SOUT, true, 0.3)} fill="url(#w8-dome)" pointerEvents="none" />
      {/* The face (viscerocranium), small at birth, in front of the vault's lower edge. */}
      <g pointerEvents="none">
        <path d={smoothPath(MANDIBLE, true, 0.3)} fill="#0f0f11" />
        <path d={smoothPath(FACE, true, 0.3)} fill="#0f0f11" />
      </g>
      <Part id="errai-kraneoa">
        <path d={smoothPath(MANDIBLE, true, 0.3)} fill={faceFill} stroke={Q.boneDeep} strokeWidth={1.3} />
        <path d={smoothPath(MANDIBLE, true, 0.3)} fill="url(#w8-boneshade)" />
        <path d={smoothPath(FACE, true, 0.3)} fill={faceFill} stroke={Q.boneDeep} strokeWidth={1.3} />
        <path d={smoothPath(FACE, true, 0.3)} fill="url(#w8-boneshade)" />
        <path d={FACE_SUTURES} fill="none" stroke={Q.boneDeep} strokeWidth={1.2} opacity={0.8} />
        {TEETH.map((p, i) => (
          <ellipse key={i} cx={p[0]} cy={p[1]} rx={6} ry={4.6} fill="#f7f0de" stroke={Q.boneDeep} strokeWidth={0.9} opacity={0.5} />
        ))}
        {/* Infraorbital and mental foramina. */}
        <ellipse cx={676} cy={378} rx={3.2} ry={2.4} fill="#2a2418" />
        <ellipse cx={682} cy={474} rx={3.2} ry={2.4} fill="#2a2418" />
        <Orbit />
        {/* External acoustic meatus in its tympanic ring (open above at birth; no mastoid process yet). */}
        <circle cx={EAM[0]} cy={EAM[1]} r={10} fill="#08080a" />
        <path d={`M${EAM[0] - 8},${EAM[1] - 9}A13,13 0 1 0 ${EAM[0] + 8},${EAM[1] - 9}`} fill="none" stroke={faceFill} strokeWidth={4.5} strokeLinecap="round" />
      </Part>

      <Note x={470} y={250} size={12} tone="dim" show={brain * (1 - grow)}>
        entzefaloa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, CAL_T.grow)}>
        Neurokraneoa (entzefaloa babesten du) · errai kraneoa (aurpegia)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.grow, CAL_T.side)}>
        Albotik: buru-gangako hezurrak eta haien arteko joskurak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CAL_T.side)}>
        Bi fontanela bilateral: aurre-albokoa (esfenoidala) eta atze-albokoa (mastoidea)
      </Note>

      <Label id="neurokraneoa" x={190} y={130} ax={338} ay={124} show={boxes} />
      <Label id="hezur-parietala" x={190} y={190} ax={430} ay={160} show={grow} />
      <Label id="okzipitalaren-ezkata" x={190} y={250} ax={290} ay={262} show={grow} />
      <Label id="fontanela-mastoidea" x={190} y={410} ax={SPF[0] - 14} ay={SPF[1]} show={vis(t, CAL_T.sutures - 0.01)} />
      <Label id="tenporalaren-ezkata" x={190} y={470} ax={446} ay={340} show={grow} />
      <Label id="kondrokraneoa" x={190} y={530} ax={420} ay={460} show={boxes} />
      <Label id="hezur-frontala" x={810} y={130} ax={690} ay={170} show={grow} />
      <Label id="fontanela-esfenoidala" x={810} y={250} ax={SAF[0] + 14} ay={SAF[1] - 6} show={vis(t, CAL_T.sutures - 0.01)} />
      <Label id="esfenoidesaren-hego-handia" x={810} y={400} ax={602} ay={342} show={grow} small />
      <Label id="errai-kraneoa" x={810} y={500} ax={708} ay={482} />
    </g>
  );
}
