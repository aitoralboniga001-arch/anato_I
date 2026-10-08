'use client';

import { Label, Note, Part, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, mirror, offset, resample, spline, vis } from './common';

/**
 * 8:saihetsak — apunteen 5.4 (saihetsen eraketa) eta esternoia.
 * - `zeharkakoa`: toraxaren zeharkako ebakidura, goian atzea. Saihetsaren bi atalak (atzean hezurra, aurrean kartilagoa);
 *   esklerotomako zelulak alboetara, somitaren alboko muga gurutzatu eta paretako orriraino → saihets hezurra;
 *   saihets kartilagoa paretako orritik zuzenean.
 * - `aurretik`: toraxaren aurrealdea: esternoi barrak paretan goitik behera agertu, erdialdean fusionatu (goitik
 *   behera) eta hiru atal: kirtena, gorputza eta xifoide apofisia.
 */

export const RS_T = { parts: 0, cross: 0.14, wall: 0.28, cart: 0.42, bars: 0.56, sternum: 0.76 };

const RIB = Q.paraxial;
const RIB_DEEP = Q.paraxialDeep;
const CART = Q.lateral;
const CART_DEEP = Q.lateralDeep;

// ——— zeharkakoa ———
const E = (deg: number, k: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [500 + 300 * k * Math.cos(a), 330 + 250 * k * Math.sin(a)];
};
const OUTLINE = Array.from({ length: 73 }, (_, i) => E(i * 5, 1));
const range = (a: number, b: number, k: number, n = 40) => Array.from({ length: n + 1 }, (_, i) => E(a + ((b - a) * i) / n, k));
/** Right rib: from the transverse process, out through the paraxial tissue, then round the body wall to the front. */
const RIB_PATH: Pt[] = resample(spline([[586, 236], [630, 228], [676, 226], ...range(-24, 80, 0.85, 12)], 6), 120);
const U_BONE = 0.6;
/** Lateral somitic frontier (right): between the somite-derived tissue and the lateral plate body wall. */
const FRONTIER: Pt[] = spline([E(-38, 1.0), [716, 204], [690, 238], [656, 270], [626, 300]], 8);
const U_CROSS = 0.25;
const WALL = [...range(-30, 90, 0.93), ...range(90, -30, 0.77)];
const COELOM = spline([[500, 300], [580, 296], [660, 318], [712, 370], [714, 440], [670, 500], [580, 534], [500, 540], [420, 534], [330, 500], [286, 440], [288, 370], [340, 318], [420, 296]], 8, true);
const PARAXIAL = spline([[500, 92], [590, 92], [690, 118], [746, 176], [720, 210], [680, 250], [630, 296], [560, 286], [500, 286], [440, 286], [370, 296], [320, 250], [280, 210], [254, 176], [310, 118], [410, 92]], 8, true);

const sub = (pts: readonly Pt[], a: number, b: number) => {
  const n = pts.length - 1;
  const i0 = Math.max(0, Math.min(n, Math.round(a * n)));
  const i1 = Math.max(i0 + 1, Math.min(n, Math.round(b * n)));
  return pts.slice(i0, i1 + 1);
};
function bandPath(pts: readonly Pt[], w: number) {
  if (pts.length < 2) return '';
  const L = offset(pts, w / 2);
  const R = offset(pts, -w / 2).reverse();
  return smoothPath([...L, ...R], true, 0.15);
}

const RIB_CELLS = Array.from({ length: 96 }, (_, i) => ({
  side: (i % 2 ? 1 : -1) as 1 | -1,
  u: rand(i * 2.9) * (U_BONE - 0.02),
  j: (rand(i * 4.1) - 0.5) * 22,
  start: [586 + rand(i * 6.3) * 30, 244 + rand(i * 7.7) * 34] as Pt,
  a: rand(i * 8.1) * 360,
  r: 1.25 + rand(i * 9.3) * 0.3,
}));

/** Lung (right of the picture; the other is its mirror) and its budding bronchial tree, in the pleural cavity. */
const LUNG = spline([[566, 316], [626, 316], [676, 344], [700, 400], [694, 458], [660, 500], [612, 512], [588, 486], [584, 430], [568, 372]], 8, true);
const BRONCHI: Pt[][] = [
  [[566, 352], [600, 372], [630, 360], [660, 352]],
  [[600, 372], [622, 404], [656, 410], [680, 402]],
  [[622, 404], [628, 440], [652, 470]],
  [[628, 440], [610, 480]],
  [[630, 360], [646, 334]],
];
const MEDIASTINUM = spline([[468, 300], [532, 300], [552, 356], [584, 410], [594, 470], [566, 526], [500, 538], [434, 526], [406, 470], [416, 410], [448, 356]], 8, true);
const HEART = spline([[436, 446], [470, 424], [512, 422], [556, 432], [578, 462], [566, 498], [528, 518], [482, 516], [446, 496], [430, 470]], 8, true);

/**
 * What fills the thorax (context, unlabelled): the mediastinum with oesophagus and aorta behind and the heart in its
 * pericardial cavity in front; a lung in each pleural cavity, still a tree of budding bronchi.
 */
function ThoraxContents() {
  const lungs: Pt[][] = [LUNG, LUNG.map((p) => mirror(p))];
  return (
    <g opacity={0.85} pointerEvents="none">
      <defs>
        <radialGradient id="w8-rs-lung" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#e2a3a8" />
          <stop offset="1" stopColor="#9a5560" />
        </radialGradient>
        <radialGradient id="w8-rs-heart" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#d9505a" />
          <stop offset="1" stopColor="#7a1820" />
        </radialGradient>
      </defs>
      {lungs.map((pts, i) => (
        <g key={i}>
          <path d={smoothPath(pts, true, 0.25)} fill="url(#w8-rs-lung)" stroke="#e8c3c6" strokeWidth={1.4} />
          {BRONCHI.map((b, j) => {
            const q = i ? b.map((p) => mirror(p)) : b;
            return (
              <g key={j}>
                <path d={smoothPath(q, false, 0.3)} fill="none" stroke="#f6e0d8" strokeWidth={j < 2 ? 3.4 : 2.4} strokeLinecap="round" opacity={0.85} />
                <circle cx={q[q.length - 1][0]} cy={q[q.length - 1][1]} r={4.5} fill="#f6e0d8" opacity={0.8} />
              </g>
            );
          })}
        </g>
      ))}
      <path d={smoothPath(MEDIASTINUM, true, 0.25)} fill="#3e2c3c" stroke="#5a4a58" strokeWidth={1.2} />
      {/* Pericardial cavity round the heart, its septum between the ventricles. */}
      <path d={smoothPath(offset(HEART, -9), true, 0.25)} fill="#160f18" stroke="#e8c3c6" strokeWidth={1.2} opacity={0.9} />
      <path d={smoothPath(HEART, true, 0.25)} fill="url(#w8-rs-heart)" stroke="#5a1016" strokeWidth={1.4} />
      {/* Thick-walled round left ventricle, thin crescent of the right one wrapped in front of it. */}
      <ellipse cx={538} cy={462} rx={17} ry={21} fill="#4a0e14" opacity={0.6} transform="rotate(-20 538 462)" />
      <path d="M454,452 Q478,436 506,446 Q496,472 510,502 Q480,506 458,490 Q448,470 454,452Z" fill="#4a0e14" opacity={0.5} />
      {/* Oesophagus and aorta behind, in front of the vertebral body. */}
      <circle cx={490} cy={322} r={12} fill="#c58a7a" stroke="#7a4a40" strokeWidth={1.2} />
      <path d="M484,318L490,322L496,317M490,322L489,329" fill="none" stroke="#6a3a30" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={526} cy={314} r={13} fill="#c0392b" stroke="#6b1d14" strokeWidth={1.4} />
      <circle cx={526} cy={314} r={7} fill="#5a0f0f" />
    </g>
  );
}

export function RibSection({ t }: SceneProps) {
  // overview first: the finished rib, then it is built again from the start
  const back = seg(t, RS_T.cross - 0.035, RS_T.cross - 0.005);
  const front = lerp(0, U_CROSS + 0.1, seg(t, RS_T.cross + 0.01, RS_T.cross + 0.08)) + lerp(0, U_BONE - U_CROSS - 0.1, seg(t, RS_T.wall + 0.005, RS_T.wall + 0.06));
  const cellsOn = seg(t, RS_T.cross, RS_T.cross + 0.02) * (1 - seg(t, RS_T.cart - 0.02, RS_T.cart + 0.02) * 0.7);
  const bone = t < RS_T.cross ? U_BONE * (1 - back) : Math.max(0, front - 0.04) * seg(t, RS_T.wall, RS_T.wall + 0.02);
  const cart = t < RS_T.cross ? 1 - back * (1 - U_BONE) : lerp(U_BONE, 1, seg(t, RS_T.cart + 0.01, RS_T.cart + 0.07));
  const cartOn = t < RS_T.cross ? 1 : cart > U_BONE + 0.01 ? 1 : 0;
  const crossing = vis(t, RS_T.cross + 0.03, RS_T.wall);
  const sides: [1 | -1, (p: Pt) => Pt][] = [
    [1, (p) => p],
    [-1, (p) => mirror(p)],
  ];
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      {/* Body, coelom and the two domains (somite-derived behind, lateral plate in the wall). */}
      <path d={smoothPath(OUTLINE, true, 0.2)} fill={Q.body} stroke={Q.skin} strokeWidth={3} />
      <path d={smoothPath(PARAXIAL, true, 0.2)} fill="rgba(239,107,91,0.10)" />
      <path d={smoothPath(COELOM, true, 0.2)} fill={Q.space} stroke="#5a4a58" strokeWidth={1.5} />
      <ThoraxContents />
      <Part id="paretako-orria">
        {sides.map(([s, m]) => (
          <path key={s} d={smoothPath(WALL.map(m), true, 0.15)} fill="rgba(230,162,60,0.30)" stroke={CART_DEEP} strokeWidth={1.2} />
        ))}
      </Part>
      {/* Neural tube, vertebra and the back muscles (context). */}
      <ellipse cx={500} cy={150} rx={30} ry={44} fill={Q.neural} stroke="#8fa7ff" strokeWidth={2} />
      <path d="M500,128V172" stroke="#0d1640" strokeWidth={3} strokeLinecap="round" />
      {[1, -1].map((s) => (
        <path key={s} d={smoothPath([[500 + s * 62, 120], [500 + s * 116, 136], [500 + s * 126, 176], [500 + s * 92, 196], [500 + s * 58, 176]], true, 0.3)} fill="#a8443e" stroke="#6e2420" strokeWidth={1.4} />
      ))}
      <Part id="ornoak">
        <path d="M466,150A34,44 0 0 1 534,150" fill="none" stroke={Q.bone} strokeWidth={12} opacity={0.9} />
        <path d="M462,152L470,214M538,152L530,214" stroke={Q.bone} strokeWidth={10} />
        <circle cx={500} cy={236} r={40} fill={Q.bone} stroke="#a8946a" strokeWidth={2} />
        <circle cx={500} cy={236} r={40} fill="url(#w8-bone)" />
        <circle cx={500} cy={236} r={5} fill={Q.noto} />
        <path d="M534,226L588,236M466,226L412,236" stroke={Q.bone} strokeWidth={14} strokeLinecap="round" />
      </Part>
      {/* The lateral somitic frontier. */}
      <Part id="somitaren-alboko-muga">
        {sides.map(([s, m]) => (
          <g key={s}>
            <path d={`M${FRONTIER.map((p) => `${f1(m(p)[0])},${f1(m(p)[1])}`).join('L')}`} fill="none" stroke="#fff1c9" strokeWidth={6} opacity={0.18 + 0.4 * crossing} strokeLinecap="round" />
            <path d={`M${FRONTIER.map((p) => `${f1(m(p)[0])},${f1(m(p)[1])}`).join('L')}`} fill="none" stroke="#fff1c9" strokeWidth={2} strokeLinecap="round" />
          </g>
        ))}
      </Part>
      {/* Rib: bone behind (from sclerotome), cartilage in front (from the parietal layer). */}
      <Part id="saihets-hezurra" show={bone > 0.01 ? 1 : 0}>
        {sides.map(([s, m]) => {
          const pts = sub(RIB_PATH, 0, bone).map(m);
          return (
            <g key={s}>
              <path d={bandPath(pts, 22)} fill={RIB_DEEP} stroke={RIB_DEEP} strokeWidth={3} strokeLinejoin="round" />
              <path d={bandPath(pts, 18)} fill={RIB} />
              <path d={bandPath(pts, 18)} fill="url(#w8-bone)" />
            </g>
          );
        })}
      </Part>
      <Part id="saihets-kartilagoa" show={cartOn}>
        {sides.map(([s, m]) => {
          const pts = sub(RIB_PATH, U_BONE, cart).map(m);
          if (cart <= U_BONE + 0.01) return null;
          return (
            <g key={s}>
              <path d={bandPath(pts, 22)} fill={CART_DEEP} stroke={CART_DEEP} strokeWidth={3} strokeLinejoin="round" />
              <path d={bandPath(pts, 18)} fill={CART} />
              <path d={bandPath(pts, 18)} fill="url(#w8-cart)" opacity={0.6} />
            </g>
          );
        })}
      </Part>
      {/* Sclerotome cells: out sideways, over the frontier, into the wall. */}
      {cellsOn > 0.01 && (
        <Part id="esklerotoma">
          {RIB_CELLS.map((c, i) => {
            const u = Math.min(c.u, front);
            const p = RIB_PATH[Math.round(u * (RIB_PATH.length - 1))];
            const q: Pt = [p[0] + c.j * 0.4, p[1] + c.j];
            const k = seg(front, 0, 0.05 + c.u * 0.2);
            const pos: Pt = [lerp(c.start[0], q[0], k), lerp(c.start[1], q[1], k)];
            return <MesCell key={i} p={c.side > 0 ? pos : mirror(pos)} r={c.r} a={c.a + u * 300} opacity={cellsOn} />;
          })}
        </Part>
      )}

      <Note x={250} y={30} size={12.5} tone="accent">
        Toraxaren zeharkako ebakidura (goian atzea)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, RS_T.cross)}>
        Saihetsa: atzeko atala hezurrezkoa (saihets hezurra), aurrekoa kartilagozkoa (saihets kartilagoa)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, RS_T.cross, RS_T.wall)}>
        Esklerotomako zelula batzuk alboetara: somitaren alboko muga gurutzatzen dute
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, RS_T.wall, RS_T.cart)}>
        Alboko mesodermoaren paretako orriraino iritsi, eta bertan saihets hezurra sortzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, RS_T.cart)}>
        Saihets kartilagoa paretako orritik zuzenean sortzen da
      </Note>

      <Label id="ornoak" x={190} y={110} ax={470} ay={226} show={0.9} small />
      <Label id="esklerotoma" x={190} y={250} ax={mirror(RIB_PATH[Math.round(Math.min(0.1, front) * 119)])[0]} ay={RIB_PATH[Math.round(Math.min(0.1, front) * 119)][1] + 10} show={cellsOn} />
      <Label id="paretako-orria" x={190} y={420} ax={mirror(E(30, 0.8))[0]} ay={E(30, 0.8)[1]} />
      <Label id="somitaren-alboko-muga" x={770} y={110} ax={FRONTIER[3][0] + 4} ay={FRONTIER[3][1]} />
      <Label id="saihets-hezurra" x={840} y={300} ax={E(8, 0.85)[0] + 8} ay={E(8, 0.85)[1]} show={seg(bone, 0.3, 0.45)} />
      <Label id="saihets-kartilagoa" x={810} y={540} ax={E(66, 0.85)[0] + 6} ay={E(66, 0.85)[1] + 6} show={seg(cart, U_BONE + 0.15, U_BONE + 0.3)} />
    </g>
  );
}

// ——— aurretik ———
const BAR_TOP = 150;
const BAR_BOT = 470;
const RIB_Y = Array.from({ length: 7 }, (_, i) => 176 + i * 40);
const BAR_W = 24;
const CHEST: Pt[] = [[420, 40], [580, 40], [590, 100], [760, 128], [800, 200], [790, 420], [740, 560], [500, 590], [260, 560], [210, 420], [200, 200], [240, 128], [410, 100]];

export function SternumFront({ t }: SceneProps) {
  const grow = seg(t, RS_T.bars + 0.01, RS_T.bars + 0.07); // bars appear top → bottom
  const fz = seg(t, RS_T.bars + 0.08, RS_T.bars + 0.17); // fuse in the midline, top first
  const parts = seg(t, RS_T.sternum + 0.01, RS_T.sternum + 0.07);
  const barEnd = lerp(BAR_TOP, BAR_BOT, grow);
  const fuseAt = (y: number) => seg(fz, ((y - BAR_TOP) / (BAR_BOT - BAR_TOP)) * 0.6, ((y - BAR_TOP) / (BAR_BOT - BAR_TOP)) * 0.6 + 0.4);
  const off = (y: number) => lerp(78, BAR_W / 2 - 1, fuseAt(y));
  const ys = Array.from({ length: 33 }, (_, i) => lerp(BAR_TOP, barEnd, i / 32));
  const bar = (s: 1 | -1) => {
    const inner = ys.map((y): Pt => [500 + s * (off(y) - BAR_W / 2), y]);
    const outer = ys.map((y): Pt => [500 + s * (off(y) + BAR_W / 2), y]).reverse();
    return smoothPath([...inner, ...outer], true, 0.2);
  };
  // the three parts, once fused
  const MAN = spline([[500, 152], [522, 142], [548, 146], [556, 176], [540, 214], [500, 220], [460, 214], [444, 176], [452, 146], [478, 142]], 6, true);
  const BODY = spline([[500, 226], [530, 228], [536, 300], [534, 380], [524, 418], [500, 424], [476, 418], [466, 380], [464, 300], [470, 228]], 6, true);
  const XIPH = spline([[500, 430], [516, 434], [512, 458], [500, 478], [488, 458], [484, 434]], 6, true);
  const edge = (y: number) => (parts > 0.5 ? (y < 220 ? 46 : 34) : off(y) + BAR_W / 2);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      {/* Chest wall seen from the front. */}
      <defs>
        <linearGradient id="w8-rs-chest" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#22181f" />
          <stop offset="0.5" stopColor="#40303d" />
          <stop offset="1" stopColor="#22181f" />
        </linearGradient>
      </defs>
      <path d={smoothPath(CHEST, true, 0.2)} fill="url(#w8-rs-chest)" stroke={Q.skin} strokeWidth={2.4} />
      {/* Ribs: bone laterally, costal cartilage reaching the sternal bar. */}
      {RIB_Y.map((y, i) =>
        [1, -1].map((s) => {
          const reach = vis(t, RS_T.bars);
          const x0 = 500 + s * edge(y);
          const xc = 500 + s * (150 + i * 12);
          const cartPts: Pt[] = [
            [x0, y],
            [lerp(x0, xc, 0.5), y - 2],
            [xc, y - 8],
          ];
          const bonePts = spline([[xc, y - 8], [500 + s * 236, y - 30], [500 + s * 268, y - 62]], 6);
          return (
            <g key={`${i}${s}`}>
              <Part id="saihets-hezurra">
                <path d={bandPath(bonePts, 16)} fill={RIB} stroke={RIB_DEEP} strokeWidth={1.4} />
                <path d={bandPath(bonePts, 16)} fill="url(#w8-bone)" />
                {/* Round in section: lit along the upper border, the costal groove shadowed below. */}
                <path d={smoothPath(offset(bonePts, -4), false, 0.2)} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={2.4} strokeLinecap="round" />
                <path d={smoothPath(offset(bonePts, 5), false, 0.2)} fill="none" stroke={RIB_DEEP} strokeOpacity={0.55} strokeWidth={2.4} strokeLinecap="round" />
              </Part>
              <Part id="saihets-kartilagoa">
                <path d={bandPath(spline(cartPts, 4), 13)} fill={CART} stroke={CART_DEEP} strokeWidth={1.2} opacity={0.6 + 0.4 * reach} />
                <path d={bandPath(spline(cartPts, 4), 13)} fill="url(#w8-cart)" opacity={0.4} />
              </Part>
            </g>
          );
        }),
      )}
      {/* Sternal bars: two cartilages in the wall, appearing top → bottom, then fusing in the midline. */}
      <Part id="esternoi-barrak" show={grow > 0.01 ? 1 - parts : 0}>
        {[1, -1].map((s) => (
          <g key={s}>
            <path d={bar(s as 1 | -1)} fill={CART} stroke={CART_DEEP} strokeWidth={1.6} />
            <path d={bar(s as 1 | -1)} fill="url(#w8-cart)" opacity={0.5} />
          </g>
        ))}
      </Part>
      <Part id="kirtena" show={parts}>
        <path d={smoothPath(MAN, true, 0.2)} fill={CART} stroke={CART_DEEP} strokeWidth={2} />
        <path d={smoothPath(MAN, true, 0.2)} fill="url(#w8-cart)" opacity={0.5} />
        <path d={smoothPath(MAN, true, 0.2)} fill="url(#w8-boneshade)" />
      </Part>
      <Part id="esternoiaren-gorputza" show={parts}>
        <path d={smoothPath(BODY, true, 0.2)} fill={CART} stroke={CART_DEEP} strokeWidth={2} />
        <path d={smoothPath(BODY, true, 0.2)} fill="url(#w8-cart)" opacity={0.5} />
        <path d={smoothPath(BODY, true, 0.2)} fill="url(#w8-boneshade)" />
        {[290, 350].map((y) => (
          <path key={y} d={`M${470},${y}H${530}`} stroke={CART_DEEP} strokeWidth={1} opacity={0.5} />
        ))}
      </Part>
      <Part id="apofisi-xifoidea" show={parts}>
        <path d={smoothPath(XIPH, true, 0.2)} fill={CART} stroke={CART_DEEP} strokeWidth={2} />
        <path d={smoothPath(XIPH, true, 0.2)} fill="url(#w8-boneshade)" />
      </Part>

      {/* The sternum as a whole: its outline, first round the bars, then round the three parts. */}
      <Part id="esternoia" quiet show={grow > 0.01 ? 1 : 0}>
        {parts < 0.5
          ? [1, -1].map((s) => <path key={s} d={bar(s as 1 | -1)} fill="none" stroke={CART_DEEP} strokeWidth={1.2} />)
          : [MAN, BODY, XIPH].map((p, i) => <path key={i} d={smoothPath(p, true, 0.2)} fill="none" stroke={CART_DEEP} strokeWidth={1.2} />)}
      </Part>

      <Note x={250} y={22} size={12.5} tone="accent">
        Toraxaren aurrealdea
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, RS_T.bars, RS_T.bars + 0.08)}>
        Esternoia: paretako orritik kartilagoak agertzen dira, goitik behera
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, RS_T.bars + 0.08, RS_T.sternum)}>
        Esternoi barrak erdialdean fusionatzen dira, goitik behera
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, RS_T.sternum)}>
        Hiru atal: kirtena, gorputza eta xifoide apofisia
      </Note>

      <Label id="esternoi-barrak" x={190} y={300} ax={500 - off(300) - BAR_W / 2 + 2} ay={300} show={grow * (1 - parts)} />
      <Label id="saihets-kartilagoa" x={190} y={420} ax={500 - 150 - 4 * 12 + 30} ay={RIB_Y[4] - 6} />
      <Label id="saihets-hezurra" x={190} y={540} ax={500 - 262} ay={RIB_Y[6] - 46} />
      <Label id="kirtena" x={810} y={176} ax={552} ay={178} show={parts} />
      <Label id="esternoiaren-gorputza" x={810} y={330} ax={535} ay={330} show={parts} />
      <Label id="apofisi-xifoidea" x={810} y={470} ax={513} ay={450} show={parts} />
    </g>
  );
}
