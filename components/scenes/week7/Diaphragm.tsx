'use client';

import { useId } from 'react';
import { Arrow, Label, Mark, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Sheet, f1, offset, poly, resample, sm, spline, vis } from './common';

/**
 * 7:diafragma-eraketa — apunteen 3. atala eta 3.1en hasiera, 25.–26. orriko irudiak.
 *  - `jaitsiera` (albotik, bizkarrezurra eskuinean): septum transversuma C3–C5 mailan; haren mesenkiman
 *    mioblastoak → miozitoak; C3–C5 nerbio espinalen zuntzak iristen dira eta nerbio frenikoa osatzen dute;
 *    enbrioia atzetik gehiago hazten denez septuma jaisten da (aurrea T6, atzea T12) eta nerbioa luzatzen da.
 *  - `zeharkakoa` (diafragmaren mailako zeharkako mozketa, dortsala goian): erreten perikardioperitonealak
 *    zabalik; 5. astean mintz pleuroperitonealak atze-alboko paretetatik hazten dira eta hestegorri inguruko
 *    mesenkimarekin eta septumaren atzeko ertzarekin fusionatzen dira; gorputz paretako muskulua ertzean.
 */

// ——— Side view: the trunk with the vertebral column as a ruler that grows ———

const LEVELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3'];
const iOf = (name: string) => LEVELS.indexOf(name);
/**
 * Centre of vertebral level i at growth s (0 = 4th week, 1 = end of the 5th week). The dorsal side grows
 * much more than the ventral one: the column stretches and its cervical levels rise away from the septum.
 */
const levelAt = (i: number, s: number) => lerp(190 + 12 * i, 90 + 19 * i, s);
const VERT_X = 690;
const CORD_X = 738;
const BACK_X = 590;
const DORSAL_X = 780;
const gauss = (d: number, w: number) => Math.exp(-(d * d) / (2 * w * w));

interface Trunk {
  s: number;
  F: number;
  B: number;
  heartY: number;
  liverY: number;
  ct: number;
  cb: number;
}
function trunkAt(s: number): Trunk {
  const F = lerp(levelAt(iOf('C4'), 0), levelAt(iOf('T6'), 1), s);
  const B = lerp(levelAt(iOf('C4'), 0), levelAt(iOf('T12'), 1), s);
  return { s, F, B, heartY: F - lerp(58, 84, s), liverY: F + lerp(34, 62, s), ct: levelAt(0, s) - 40, cb: levelAt(iOf('L2'), s) };
}
/** Ventral surface: the heart and liver prominences bulge out of it. */
const ventralX = (T: Trunk, y: number) =>
  306 - 30 * gauss(y - T.heartY, 50) - lerp(12, 24, T.s) * gauss(y - T.liverY, 42) + 26 * gauss(y - (levelAt(0, T.s) - 36), 30);
/** Reference for the head (128 above C1): it rises as the back grows. */
const headY = (s: number) => levelAt(0, s) - 128;
/** The head outline, x and height against C1: hindbrain at the back, midbrain at the crown, forebrain and face in front. */
const HEAD: Pt[] = [[772, -70], [764, -150], [724, -218], [652, -262], [556, -266], [466, -236], [398, -182], [356, -120], [340, -66], [348, -38]];
/** The brain along the inside of the head, continuous with the spinal cord. */
const BRAIN: Pt[] = [[738, -24], [726, -84], [712, -160], [664, -210], [590, -228], [510, -214], [448, -180], [412, -132], [404, -92]];
function bodyOutline(T: Trunk): Pt[] {
  const l3 = levelAt(iOf('L3'), T.s);
  const hy = headY(T.s);
  const left: Pt[] = [];
  for (let y = hy + 104; y <= l3 + 4; y += 12) left.push([ventralX(T, y), y]);
  // The head, bent forward over the heart: from the back of the hindbrain over the midbrain at the crown,
  // then the forebrain bulging forward and down to the face.
  const c1 = hy + 128;
  const head: Pt[] = HEAD.map(([x, dy]) => [x, c1 + dy]);
  // The caudal end: the belly wall curves under the lumbar levels into the tail, which curls ventrally.
  const tail: Pt[] = [
    [ventralX(T, l3) + 22, l3 + 34], [430, l3 + 62], [560, l3 + 72], [614, l3 + 88], [644, l3 + 110], [652, l3 + 138], [640, l3 + 166], [620, l3 + 184],
    [640, l3 + 192], [672, l3 + 172], [702, l3 + 140], [728, l3 + 110], [758, l3 + 72], [DORSAL_X, l3 + 20],
  ];
  return spline([...left, ...tail, [DORSAL_X + 6, (l3 + c1) / 2], [DORSAL_X - 10, c1 - 26], ...head], 6, true);
}
/** Sacral and coccygeal levels below L3, running on into the tail (no names). */
const TAIL_LEVELS = [0, 1, 2, 3, 4, 5].map((k) => LEVELS.length + k);
/** The stage frames the whole embryo, head to tail: it pulls back as the back grows. */
function cameraAt(s: number) {
  const top = headY(s) - 150;
  const bottom = levelAt(iOf('L3'), s) + 200;
  const k = Math.min(1, 540 / (bottom - top));
  const X = (x: number) => 520 + (x - 520) * k;
  const Y = (y: number) => 58 + (y - top) * k;
  return { k, X, Y, at: (p: Pt): Pt => [X(p[0]), Y(p[1])], transform: `translate(${f1(520 - 520 * k)} ${f1(58 - top * k)}) scale(${k.toFixed(4)})` };
}
function cavityOutline(T: Trunk): Pt[] {
  const { ct, cb } = T;
  const left: Pt[] = [];
  for (let y = cb - 26; y >= ct + 26; y -= 12) left.push([ventralX(T, y) + 20, y]);
  return spline([...left, [ventralX(T, ct) + 34, ct + 4], [480, ct - 2], [634, ct + 4], [BACK_X, ct + 34], [BACK_X + 2, (ct + cb) / 2], [BACK_X, cb - 26], [620, cb + 2], [460, cb + 8], [ventralX(T, cb) + 34, cb - 6]], 6, true);
}
const frontX = (T: Trunk, y: number) => ventralX(T, y) + 8;
/** Point on the septum: u 0 (ventral wall) → 1 (dorsal wall), v −1 (upper surface) → 1 (lower). The plate domes a little as it descends. */
function onSlab(T: Trunk, u: number, v: number, h = 15): Pt {
  const x0 = frontX(T, T.F);
  const x = lerp(x0, BACK_X + 8, u);
  const mid = lerp(T.F, T.B, u) - 12 * Math.sin(Math.PI * u) * T.s;
  return [x, mid + v * h];
}
function slabPoly(T: Trunk): Pt[] {
  const us = Array.from({ length: 21 }, (_, i) => i / 20);
  return [...us.map((u) => onSlab(T, u, -1)), ...[...us].reverse().map((u) => onSlab(T, u, 1))];
}

/** Muscle precursors in the septum: (u along, v across), when they appear and when they become myocytes. */
const CELLS = Array.from({ length: 20 }, (_, i) => {
  const u = 0.08 + 0.84 * ((i * 0.618 + 0.11) % 1);
  const v = (((i * 0.383) % 1) - 0.5) * 1.15;
  const born = 0.14 + 0.045 * ((i * 0.71) % 1);
  const turn = i % 2 === 0 ? 0.2 + 0.025 * ((i * 0.29) % 1) : 0.36 + 0.045 * ((i * 0.53) % 1);
  return { u, v, born, turn };
});

/** An embryonic heart (ventricle loop, atrium, outflow, sinus venosus into the septum), centred on c, scale k. */
function Heart4({ c, k, beating, septumY }: { c: Pt; k: number; beating: boolean; septumY: number }) {
  const [cx, cy] = c;
  const sinusEnd = (septumY - cy) / k - 4;
  const sinus = `M30,4 C40,${f1(sinusEnd * 0.5)} 46,${f1(sinusEnd * 0.8)} 44,${f1(sinusEnd)}`;
  const outflow = 'M-40,8 C-50,-14 -40,-40 -8,-46 C6,-48 18,-46 26,-42';
  return (
    <g transform={`translate(${f1(cx)} ${f1(cy)}) scale(${k.toFixed(3)})`}>
      <g>
        {beating && <animateTransform attributeName="transform" type="scale" values="1;1.05;0.985;1" keyTimes="0;0.18;0.45;1" dur="0.9s" repeatCount="indefinite" />}
        <g stroke={P.heartDeep} strokeWidth={3} fill={P.heartDeep}>
          <path d={sinus} fill="none" strokeWidth={18} strokeLinecap="round" />
          <ellipse cx={26} cy={-10} rx={28} ry={19} />
          <ellipse cx={-14} cy={18} rx={36} ry={23} transform="rotate(14 -14 18)" />
          <path d={outflow} fill="none" strokeWidth={22} strokeLinecap="round" />
        </g>
        <path d={sinus} fill="none" stroke="#a52238" strokeWidth={14} strokeLinecap="round" />
        <ellipse cx={26} cy={-10} rx={28} ry={19} fill="url(#w7-desc-atrium)" />
        <path d={outflow} fill="none" stroke="#d23a52" strokeWidth={18} strokeLinecap="round" />
        <ellipse cx={-14} cy={18} rx={36} ry={23} transform="rotate(14 -14 18)" fill="url(#w7-desc-heart)" />
        <g stroke="#ef6a80" strokeWidth={1.2} opacity={0.5} strokeLinecap="round">
          {[-36, -24, -12, 0, 12].map((d) => (
            <line key={d} x1={d} y1={26 + Math.abs(d + 12) * 0.08} x2={d + 2} y2={36 - Math.abs(d + 12) * 0.12} />
          ))}
        </g>
        <path d="M-30,-6 C-34,-24 -22,-38 0,-40" fill="none" stroke="#ffd0d6" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
      </g>
    </g>
  );
}

export function DiaphragmDescent({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const mb = seg(t, 0.14, 0.2);
  const mz = seg(t, 0.2, 0.23);
  const late = seg(t, 0.36, 0.42);
  const n = seg(t, 0.3, 0.4);
  const s = sm(seg(t, 0.47, 0.6));
  const T = trunkAt(s);
  const { F, B, ct, cb } = T;
  const body = bodyOutline(T);
  const cav = cavityOutline(T);
  const sep = slabPoly(T);
  const split: Pt[] = [[0, F], ...Array.from({ length: 11 }, (_, i) => onSlab(T, i / 10, 0)), [1000, B]];
  const heartC: Pt = [452, T.heartY];
  const gapOf = (i: number) => levelAt(i + 1, s) - levelAt(i, s);
  // Spinal nerves C3–C5 leave the cord between the vertebrae, join into the phrenic nerve, which enters the septum.
  const J: Pt = [624, levelAt(iOf('C5'), s) + lerp(30, 42, s)];
  const entry = onSlab(T, 0.56, -1);
  const roots = ['C3', 'C4', 'C5'].map((c) => {
    const i = iOf(c);
    const y = levelAt(i, s) + gapOf(i) / 2;
    return spline([[CORD_X - 9, y], [VERT_X - 26, y + 1], [(VERT_X - 26 + J[0]) / 2 + 4, (y + J[1]) / 2 + 2], J], 8);
  });
  const trunk = spline([J, [lerp(J[0], entry[0], 0.5) + 26, lerp(J[1], entry[1], 0.5)], [entry[0] + 6, entry[1] - 18], entry], 12);
  const branches = [0.3, 0.48, 0.7, 0.86].map((u) => spline([entry, onSlab(T, (u + 0.56) / 2, -0.3), onSlab(T, u, 0.1)], 6));
  const cut = (pts: Pt[], k: number) => resample(pts, 40).slice(0, Math.max(2, Math.round(40 * k)));
  const line = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
  const impulsePath = line([...roots[1], ...trunk.slice(1)]);
  const slabAngle = (Math.atan2(B - F, BACK_X - frontX(T, F)) * 180) / Math.PI;
  // The oesophagus runs down the dorsal side, through the septum's dorsal part, into the stomach.
  const esoX = 622;
  const esoHit: Pt = [esoX, B + 6];
  const stomach: Pt = [598, B + 40];
  const liverC: Pt = [lerp(400, 420, s), T.liverY];
  const esoD = `M${esoX},${f1(headY(s) + 60)} C${esoX + 4},${f1((ct + esoHit[1]) / 2)} ${esoX + 2},${f1(esoHit[1] - 10)} ${stomach[0] + 8},${f1(stomach[1] - 22)}`;
  const hy = headY(s);
  // Brain: a thick tube along the inside of the head, continuous with the spinal cord.
  const brainD = smoothPath(
    BRAIN.map(([x, dy]) => [x, hy + 128 + dy] as Pt),
    false,
    0.3,
  );
  const start = levelAt(iOf('C4'), 0);
  const cam = cameraAt(s);
  const { X, Y } = cam;
  const A = cam.at;
  const c1 = levelAt(0, s);
  const l3 = levelAt(iOf('L3'), s);
  // The umbilical cord leaves the belly below the liver; the limb buds lie on the near flank, opposite their levels.
  const cordY = lerp(levelAt(iOf('T10'), s), levelAt(iOf('L1'), s), 0.5);
  const cordX = ventralX(T, cordY);
  const cordD = `M${f1(cordX + 30)},${f1(cordY - 4)} C${f1(cordX - 10)},${f1(cordY - 2)} ${f1(cordX - 40)},${f1(cordY + 10)} ${f1(cordX - 70)},${f1(cordY + 30)}`;
  const cordEnd: Pt = [cordX - 70, cordY + 30];
  const eye: Pt = [470, c1 - 128];
  const vertebrae = [...LEVELS.map((l, i) => ({ l, i })), ...TAIL_LEVELS.map((i) => ({ l: '', i }))];
  const KEY = ['C3', 'C4', 'C5', 'T6', 'T12'];

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id={`w7-desc-up${cid}`}>
          <path d={poly([...split, [1000, 0], [0, 0]])} />
        </clipPath>
        <clipPath id={`w7-desc-dn${cid}`}>
          <path d={poly([...split, [1000, 640], [0, 640]])} />
        </clipPath>
        <radialGradient id="w7-desc-heart" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f06a7e" />
          <stop offset="0.6" stopColor="#c62d42" />
          <stop offset="1" stopColor="#7d1527" />
        </radialGradient>
        <radialGradient id="w7-desc-atrium" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#d9546a" />
          <stop offset="1" stopColor="#6e1222" />
        </radialGradient>
        <radialGradient id={`w7-desc-liver${cid}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#b2524a" />
          <stop offset="1" stopColor="#6d2622" />
        </radialGradient>
        <linearGradient id={`w7-desc-vert${cid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a99d84" />
          <stop offset="0.45" stopColor="#f1eadb" />
          <stop offset="1" stopColor="#9c917a" />
        </linearGradient>
        <linearGradient id={`w7-desc-key${cid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c99a3a" />
          <stop offset="0.45" stopColor="#fff1c4" />
          <stop offset="1" stopColor="#b98a2e" />
        </linearGradient>
      </defs>

      <g transform={cam.transform}>
        {/* The umbilical cord, behind the body wall it leaves; its cut end shows the vessels. */}
        <Part id="hasierako-zilbor-hestea" quiet>
          <path d={cordD} fill="none" stroke="#3a2230" strokeWidth={38} strokeLinecap="round" />
          <path d={cordD} fill="none" stroke="#9a6f7c" strokeWidth={34} strokeLinecap="round" />
          <path d={cordD} fill="none" stroke="#c49aa4" strokeWidth={14} strokeLinecap="round" opacity={0.5} transform="translate(-3 -6)" />
          <ellipse cx={f1(cordEnd[0])} cy={f1(cordEnd[1])} rx={13} ry={17} transform={`rotate(-34 ${f1(cordEnd[0])} ${f1(cordEnd[1])})`} fill="#e3c4c6" stroke="#5a3442" strokeWidth={1.4} />
          <circle cx={f1(cordEnd[0] - 3)} cy={f1(cordEnd[1] - 6)} r={4.6} fill={P.ivc} />
          <circle cx={f1(cordEnd[0] - 1)} cy={f1(cordEnd[1] + 6)} r={3} fill={P.aorta} />
          <circle cx={f1(cordEnd[0] + 6)} cy={f1(cordEnd[1] + 2)} r={3} fill={P.aorta} />
        </Part>

        {/* Body: body wall, skin. */}
        <Part id="gorputz-pareta" quiet>
          <path d={smoothPath(body, true, 0.3)} fill={P.wall} />
          <path d={smoothPath(body, true, 0.3)} fill="url(#w7-mesench)" />
        </Part>
        <Part id="azaleko-ektodermoa" quiet>
          <Sheet outer={body} inner={offset(body, -8, true)} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={9} />
        </Part>

        {/* Brain in the head: the cranial end of the neural tube. */}
        <Part id="hodi-neurala" quiet>
          <path d={brainD} fill="none" stroke="rgba(10,16,48,0.8)" strokeWidth={48} strokeLinecap="round" />
          <path d={brainD} fill="none" stroke={P.neural} strokeWidth={44} strokeLinecap="round" opacity={0.85} />
          <path d={brainD} fill="none" stroke="#101a3a" strokeWidth={18} strokeLinecap="round" />
        </Part>
        {/* The eye on the side of the face, and the pharyngeal arches under it, ventral to the neck. */}
        <Part id="begia" quiet>
          <circle cx={eye[0]} cy={f1(eye[1])} r={24} fill="#1e1218" stroke="#8a5560" strokeWidth={2.4} />
          <circle cx={eye[0] - 5} cy={f1(eye[1] - 2)} r={10} fill="#d4a79c" />
          <circle cx={eye[0] - 8} cy={f1(eye[1] - 6)} r={3} fill="#fff1ea" opacity={0.8} />
        </Part>
        <Part id="faringe-arkuak" quiet>
          {[0, 1, 2].map((k) => {
            const d = `M${510 - k * 8},${f1(c1 - 92 + k * 19)} Q${452 - k * 4},${f1(c1 - 64 + k * 19)} ${384 + k * 14},${f1(c1 - 66 + k * 21)}`;
            return (
              <g key={k}>
                <path d={d} fill="none" stroke="#5a2c36" strokeWidth={15 - k * 2} strokeLinecap="round" />
                <path d={d} fill="none" stroke="#dd9e90" strokeWidth={11 - k * 2} strokeLinecap="round" />
              </g>
            );
          })}
        </Part>

        {/* Coelom: above the septum the primitive pericardial cavity, below it the peritoneal cavity. */}
        <path d={smoothPath(cav, true, 0.3)} fill={P.space} pointerEvents="none" />
        <Part id="hasierako-perikardio-barrunbea">
          <path d={smoothPath(cav, true, 0.3)} fill={P.peri} clipPath={`url(#w7-desc-up${cid})`} />
        </Part>
        <Part id="peritoneo-barrunbea">
          <path d={smoothPath(cav, true, 0.3)} fill={P.perito} clipPath={`url(#w7-desc-dn${cid})`} />
        </Part>
        <path d={smoothPath(cav, true, 0.3)} fill="none" stroke="rgba(255,200,190,0.3)" strokeWidth={1.3} pointerEvents="none" />

        {/* Oesophagus → stomach (dorsal), and the liver growing in the septum's ventral mesenchyme. */}
        <Part id="hestegorria">
          <path d={esoD} fill="none" stroke="#6a4c16" strokeWidth={12} strokeLinecap="round" />
          <path d={esoD} fill="none" stroke="#d9ab3c" strokeWidth={8.5} strokeLinecap="round" />
        </Part>
        <Part id="urdaila">
          <ellipse cx={stomach[0]} cy={stomach[1]} rx={22} ry={30} transform={`rotate(-14 ${stomach[0]} ${f1(stomach[1])})`} fill={P.gut} stroke="#7a5a1c" strokeWidth={2} />
        </Part>
        <Part id="gibela" quiet>
          <ellipse cx={liverC[0]} cy={liverC[1]} rx={lerp(56, 104, s)} ry={lerp(20, 40, s)} fill={`url(#w7-desc-liver${cid})`} stroke="#4d1714" strokeWidth={1.4} />
          <ellipse cx={liverC[0]} cy={liverC[1]} rx={lerp(56, 104, s)} ry={lerp(20, 40, s)} fill="url(#w7-lung)" opacity={0.6} />
        </Part>

        {/* The vertebral column as a ruler (it stretches as the back grows), the spinal cord behind it, a spinal nerve at each level. */}
        <Part id="hodi-neurala">
          <rect x={CORD_X - 9} y={f1(hy + 100)} width={18} height={f1(levelAt(LEVELS.length + 2, s) - hy - 100)} rx={9} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
          <rect x={CORD_X - 1.5} y={f1(hy + 100)} width={3} height={f1(levelAt(LEVELS.length + 2, s) - 4 - hy - 100)} rx={1.5} fill="#0c1428" />
        </Part>
        <g stroke={P.nerve} strokeWidth={1.4} opacity={0.28} pointerEvents="none">
          {LEVELS.map((l, i) =>
            ['C3', 'C4', 'C5'].includes(l) ? null : <line key={l} x1={CORD_X - 9} y1={f1(levelAt(i, s) + gapOf(i) / 2)} x2={VERT_X - 22} y2={f1(levelAt(i, s) + gapOf(i) / 2 + 2)} />,
          )}
        </g>
        <Part id="ornoak" quiet>
          {vertebrae.map(({ l, i }) => {
            const y = levelAt(i, s);
            const tail = l ? 0 : i - LEVELS.length + 1;
            const h = lerp(8.5, 14, s) * (1 - tail * 0.1);
            const w = 34 - tail * 4;
            const key = KEY.includes(l);
            return (
              <rect
                key={i}
                x={f1(VERT_X - w / 2)}
                y={f1(y - h / 2)}
                width={f1(w)}
                height={f1(h)}
                rx={f1(Math.min(5, h / 2))}
                fill={`url(#${key ? `w7-desc-key${cid}` : `w7-desc-vert${cid}`})`}
                stroke={key ? '#7a5a1c' : '#5e5646'}
                strokeWidth={1}
                opacity={l ? (key ? 1 : 0.82) : 0.6 - tail * 0.07}
              />
            );
          })}
        </Part>

        <Part id="bihotza">
          <Heart4 c={heartC} k={lerp(0.78, 1.04, s)} beating={!reduced} septumY={onSlab(T, 0.42, -1)[1]} />
        </Part>

        {/* The septum transversum: mesenchyme in which the muscle cells differentiate. */}
        <Part id="septum-transversum">
          <path d={smoothPath(sep, true, 0.25)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
          <path d={smoothPath(sep, true, 0.25)} fill="url(#w7-mesench)" />
          <path d={smoothPath(sep, true, 0.25)} fill="url(#w7-light)" />
        </Part>
        <Part id="mioblastoak" show={mb * (1 - late)}>
          {CELLS.map((c, i) => {
            const pop = seg(t, c.born, c.born + 0.03);
            const k = seg(t, c.turn, c.turn + 0.03);
            if (pop <= 0.01 || k >= 0.5) return null;
            const q = onSlab(T, c.u, c.v * 0.75);
            return (
              <g key={i}>
                <ellipse cx={f1(q[0])} cy={f1(q[1])} rx={lerp(4.6, 8, k * 2) * pop} ry={lerp(4.6, 3.8, k * 2) * pop} transform={`rotate(${f1(slabAngle)} ${f1(q[0])} ${f1(q[1])})`} fill="#ff8a8a" stroke="#8e1b2e" strokeWidth={1} />
                <circle cx={f1(q[0])} cy={f1(q[1])} r={1.7 * pop} fill="#7a1020" />
              </g>
            );
          })}
        </Part>
        <Part id="miozitoak" show={mz}>
          {CELLS.map((c, i) => {
            const k = seg(t, c.turn, c.turn + 0.03);
            if (k < 0.5) return null;
            const q = onSlab(T, c.u, c.v * 0.75);
            const rx = lerp(8, 13, (k - 0.5) * 2);
            return (
              <g key={i} transform={`rotate(${f1(slabAngle)} ${f1(q[0])} ${f1(q[1])})`}>
                <ellipse cx={f1(q[0])} cy={f1(q[1])} rx={rx} ry={3.4} fill="#e0566f" stroke="#7a0f1e" strokeWidth={0.9} />
                {[-0.5, -0.17, 0.17, 0.5].map((d) => (
                  <line key={d} x1={f1(q[0] + d * rx * 1.4)} y1={f1(q[1] - 2.6)} x2={f1(q[0] + d * rx * 1.4)} y2={f1(q[1] + 2.6)} stroke="#ffc2cc" strokeWidth={0.7} opacity={0.7} />
                ))}
                <circle cx={f1(q[0] - rx * 0.35)} cy={f1(q[1])} r={1.3} fill="#5a0a16" />
                <circle cx={f1(q[0] + rx * 0.35)} cy={f1(q[1])} r={1.3} fill="#5a0a16" />
              </g>
            );
          })}
        </Part>

        {/* Nerve fibres: C3–C5 → phrenic nerve; it is stretched as the septum's level drops. */}
        <Part id="lepoko-nerbio-espinalak" show={n > 0.01 ? 1 : 0}>
          {roots.map((r, i) => (
            <path key={i} d={line(cut(r, Math.min(1, n * 2)))} fill="none" stroke={P.nerve} strokeWidth={2.6} strokeLinecap="round" />
          ))}
        </Part>
        <Part id="nerbio-frenikoa" show={n > 0.5 ? 1 : 0}>
          <path d={line(cut(trunk, seg(n, 0.5, 1)))} fill="none" stroke={P.nerve} strokeWidth={3.4} strokeLinecap="round" />
          {n > 0.98 && branches.map((b, i) => <path key={i} d={line(b)} fill="none" stroke={P.nerve} strokeWidth={1.6} opacity={0.85} strokeLinecap="round" />)}
        </Part>
        {/* Impulses along the phrenic nerve to the new muscle. */}
        {n > 0.99 && !reduced && (
          <g pointerEvents="none">
            {[0, 1, 2].map((k) => (
              <circle key={k} r={3.2} fill="#fff6c2">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin={`${(-k * 0.5).toFixed(1)}s`} path={impulsePath} />
              </circle>
            ))}
          </g>
        )}

        <path d={smoothPath(body, true, 0.3)} fill="url(#w7-light)" pointerEvents="none" />
      </g>

      {/* How far each edge went: the front a little (to T6), the back much more (to T12). */}
      <Arrow from={A([frontX(T, F) + 30, start - 6])} to={A([frontX(T, F) + 30, F - 20])} color="#fbbf24" width={2.4} show={vis(t, 0.5, 0.62) * (F - start > 30 ? 1 : 0)} bend={0.02} />
      <Arrow from={A([BACK_X - 24, start - 6])} to={A([BACK_X - 24, B - 22])} color="#fbbf24" width={2.4} show={vis(t, 0.5, 0.62) * (B - start > 30 ? 1 : 0)} bend={-0.02} />

      <Note x={X(liverC[0])} y={Y(liverC[1]) + 4} size={12.5} tone="dim">
        gibela
      </Note>
      {LEVELS.map((l, i) =>
        ['C1', 'C3', 'C4', 'C5', 'C8', 'T6', 'T12', 'L3'].includes(l) && (s > 0.3 || !['C3', 'C5'].includes(l)) ? (
          <Note key={l} x={X(CORD_X + 30)} y={Y(levelAt(i, s))} size={11.5} tone={KEY.includes(l) ? 'accent' : 'dim'}>
            {l}
          </Note>
        ) : null,
      )}
      <Note x={330} y={24} size={12.5}>
        aurrea (bentrala)
      </Note>
      <Note x={660} y={24} size={12.5}>
        atzea (dortsala)
      </Note>
      <Note x={850} y={40} size={13} tone="accent">
        {s < 0.5 ? '4. astea' : '5. astearen bukaera'}
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0, 0.14)}>
        Diafragma: torax eta abdomenaren arteko trenkada muskulu-aponeurotikoa, kupula itxurakoa
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.14, 0.3)}>
        C3–C5 mailan: mesenkiman mioblastoak → miozitoak
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.3, 0.46)}>
        C3, C4 eta C5 nerbio espinalen zuntzak elkartu: nerbio frenikoa
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.46)}>
        Atzea gehiago hazten da: septuma aurrean T6, atzean T12 mailara; nerbio frenikoa luzatzen da
      </Note>

      <Label id="hasierako-perikardio-barrunbea" x={226} y={Math.max(60, Y(Math.min(ct + 20, T.heartY - 40)))} ax={X(ventralX(T, ct + 34) + 30)} ay={Y(ct + 34)} small />
      <Label id="bihotza" x={190} y={Y(T.heartY - 6)} ax={X(heartC[0] - 36)} ay={Y(heartC[1] + 6)} small />
      <Label id="septum-transversum" x={190} y={Y(F + 2)} ax={X(frontX(T, F) + 14)} ay={Y(F)} />
      <Label id="mioblastoak" x={190} y={Y(F) + 68} ax={X(onSlab(T, CELLS[1].u, CELLS[1].v * 0.75)[0] - 14)} ay={Y(onSlab(T, CELLS[1].u, CELLS[1].v * 0.75)[1] + 2)} show={mb * (1 - late)} />
      <Label id="miozitoak" x={190} y={Y(F) + lerp(100, 42, s)} ax={X(onSlab(T, CELLS[0].u, CELLS[0].v * 0.75)[0])} ay={Y(onSlab(T, CELLS[0].u, CELLS[0].v * 0.75)[1])} show={mz} />
      <Label id="peritoneo-barrunbea" x={190} y={Math.min(570, Y(cb - 16))} ax={X(ventralX(T, cb - 16) + 34)} ay={Y(cb - 16)} small />
      <Label id="hestegorria" x={810} y={Math.max(70, Y(hy + 120))} ax={X(esoX + 5)} ay={Y(hy + 120)} small />
      <Label id="urdaila" x={810} y={Y(stomach[1]) + lerp(60, 4, s)} ax={X(stomach[0] + 20)} ay={Y(stomach[1] + 4)} small />
      <Label id="hodi-neurala" x={810} y={Y(levelAt(iOf('T9'), s))} ax={X(CORD_X + 9)} ay={Y(levelAt(iOf('T9'), s))} small />
      <Label id="lepoko-nerbio-espinalak" x={810} y={290} ax={X(668)} ay={Y(levelAt(iOf('C4'), s) + gapOf(iOf('C4')) / 2 + 1)} show={n > 0.01 ? 1 : 0} />
      <Label id="nerbio-frenikoa" x={810} y={356} ax={X(along(trunk, 0.6)[0])} ay={Y(along(trunk, 0.6)[1])} show={seg(n, 0.6, 1)} />
      <Label id="ornoak" x={810} y={Math.min(596, Y(l3) + 36)} ax={X(VERT_X + 17)} ay={Y(l3)} small />
    </g>
  );
}

const along = (pts: Pt[], u: number): Pt => resample(pts, 101)[Math.round(u * 100)];

// ——— Transverse section at the level of the diaphragm (dorsal at the top) ———

const BODY_X = spline(
  [[500, 50], [640, 62], [742, 116], [792, 214], [798, 330], [774, 440], [706, 530], [604, 580], [500, 590], [396, 580], [294, 530], [226, 440], [202, 330], [208, 214], [258, 116], [360, 62]],
  8,
  true,
);
const CAV_X = spline(
  [[500, 228], [430, 214], [360, 202], [300, 228], [264, 292], [252, 372], [276, 462], [336, 532], [420, 566], [500, 574], [580, 566], [664, 532], [724, 462], [748, 372], [736, 292], [700, 228], [640, 202], [570, 214]],
  8,
  true,
);
const SEPT_EDGE: Pt[] = [[250, 396], [300, 356], [370, 334], [440, 342], [500, 354], [560, 342], [630, 334], [700, 356], [750, 396]];
const SEPTUM_X = [...spline(SEPT_EDGE, 8), ...spline([[750, 396], [724, 466], [664, 534], [580, 568], [500, 576], [420, 568], [336, 534], [276, 466], [250, 396]], 8)];
const MES = spline([[468, 222], [532, 222], [540, 262], [556, 300], [552, 340], [500, 356], [448, 340], [446, 300], [460, 262]], 8, true);
const ESO_X: Pt = [520, 296];
const IVC_X: Pt = [462, 378];
const AORTA_X: Pt = [500, 196];
/** Generous outline of the left canal (clipped to the cavity; the septum and the mesentery cover the rest). */
const CANAL_L = spline([[472, 186], [300, 176], [226, 250], [222, 430], [320, 384], [440, 352], [450, 300], [462, 246]], 6, true);
const FOCUS_L: Pt = [432, 336];
const CANAL_MID: Pt = [334, 272];
const mx = (p: Pt): Pt => [1000 - p[0], p[1]];

export function DiaphragmSection({ t, reduced }: SceneProps) {
  const c = seg(t, 0.74, 0.84);
  const mus = seg(t, 0.88, 0.95);
  const rim = lerp(0, 30, mus);
  const inner = offset(CAV_X, rim, true);
  const canalsOpen = 1 - seg(c, 0.85, 1);
  // The membrane grows from the posterolateral wall towards the middle: its free edge sweeps medially across the canal.
  const front = lerp(212, 476, Math.pow(c, 0.85));
  const cid = useId().replace(/:/g, '');
  const migrate = vis(t, 0.88);

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="gorputz-pareta" quiet>
        <path d={poly(BODY_X)} fill={P.wall} />
        <path d={poly(BODY_X)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY_X} inner={offset(BODY_X, -9, true)} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={11} />
      </Part>
      {/* The body wall's own muscle layer, under the skin: later it adds the diaphragm's outer rim. */}
      <defs>
        <linearGradient id={`w7-dia-wallfade${cid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.22" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.4" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
        <mask id={`w7-dia-wall${cid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={0} y={0} width={1000} height={640} fill={`url(#w7-dia-wallfade${cid})`} />
        </mask>
        <radialGradient id={`w7-dia-hole${cid}`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#05070c" stopOpacity={0.95} />
          <stop offset="0.7" stopColor="#0d1824" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7fc8e8" stopOpacity={0.25} />
        </radialGradient>
        <radialGradient id={`w7-dia-lung${cid}`} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#f6b6c4" stopOpacity={0.55} />
          <stop offset="1" stopColor="#f6b6c4" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`w7-dia-dome${cid}`} cx="0.5" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </radialGradient>
      </defs>
      <Part id="gorputz-paretako-mesodermoa" quiet>
        <g mask={`url(#w7-dia-wall${cid})`}>
          <path d={`${poly(offset(BODY_X, -12, true))}${poly([...offset(BODY_X, -32, true)].reverse())}`} fill={P.bodyMuscle} opacity={0.45} fillRule="evenodd" />
          <path d={`${poly(offset(BODY_X, -12, true))}${poly([...offset(BODY_X, -32, true)].reverse())}`} fill="url(#w7-muscle)" opacity={0.6} fillRule="evenodd" />
        </g>
      </Part>
      {/* The back: muscle masses from the somites either side, the spinal cord in its forming vertebra. */}
      <Part id="somitak" quiet>
        {[1, -1].map((k) => (
          <g key={k}>
            <ellipse cx={500 + k * 72} cy={116} rx={40} ry={30} fill="#6e2a40" opacity={0.75} />
            <ellipse cx={500 + k * 72} cy={116} rx={40} ry={30} fill="url(#w7-muscle)" opacity={0.45} />
          </g>
        ))}
      </Part>
      <Part id="ornoak" quiet>
        <path d="M466,150 C458,112 470,70 500,62 C530,70 542,112 534,150" fill="none" stroke={P.bone} strokeWidth={9} strokeLinecap="round" opacity={0.7} />
        <ellipse cx={500} cy={158} rx={36} ry={20} fill={P.bone} opacity={0.9} />
        <ellipse cx={500} cy={158} rx={36} ry={20} fill="url(#w7-light)" />
        <circle cx={500} cy={158} r={4.5} fill="#dfe9ff" stroke="#9fb2d8" strokeWidth={1} />
      </Part>
      <Part id="hodi-neurala">
        <ellipse cx={500} cy={100} rx={26} ry={32} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <path d="M486,86 C494,96 494,104 486,114 M514,86 C506,96 506,104 514,114" fill="none" stroke="#c4cdf7" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
        <ellipse cx={500} cy={100} rx={3} ry={9} fill="#0c1428" />
      </Part>
      <Part id="aorta">
        <circle cx={AORTA_X[0]} cy={AORTA_X[1]} r={15} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.4} />
        <circle cx={AORTA_X[0]} cy={AORTA_X[1]} r={9} fill="#9e1228" />
        <circle cx={AORTA_X[0] - 4} cy={AORTA_X[1] - 5} r={3.5} fill="#ff8a9a" opacity={0.55} />
      </Part>

      {/* Open cavity between the septum and the mesentery: the canals' way through until the membranes fill it. */}
      <Part id="erreten-perikardioperitonealak">
        <path d={poly(CAV_X)} fill={P.space} />
      </Part>
      <clipPath id="w7-dia-cav">
        <path d={poly(CAV_X)} />
      </clipPath>

      {/* Canals (dorsolateral openings) closed by the pleuroperitoneal membranes from the posterolateral wall. */}
      <Part id="mintz-pleuroperitonealak" show={seg(t, 0.72, 0.76)}>
        <path d={poly(CAV_X)} fill={P.poMem} />
        <path d={poly(CAV_X)} fill="url(#w7-mesench)" />
      </Part>
      <defs>
        <clipPath id={`w7-dia-open${cid}`}>
          <rect x={front} y={0} width={1000 - 2 * front} height={640} />
        </clipPath>
      </defs>
      <Part id="erreten-perikardioperitonealak" show={canalsOpen}>
        {[CANAL_L, CANAL_L.map(mx)].map((pts, i) => (
          <g key={i} clipPath="url(#w7-dia-cav)">
            <g clipPath={`url(#w7-dia-open${cid})`}>
              <path d={smoothPath(pts, true, 0.3)} fill={P.space} />
              <path d={smoothPath(pts, true, 0.3)} fill={P.canal} />
              {/* Looking up the open canal: a deep passage, the lung bud glimpsed in the cavity above. */}
              <path d={smoothPath(pts, true, 0.3)} fill={`url(#w7-dia-hole${cid})`} />
              <ellipse cx={i ? 1000 - 330 : 330} cy={262} rx={58} ry={46} fill={`url(#w7-dia-lung${cid})`} />
            </g>
          </g>
        ))}
      </Part>
      {/* The membranes' free edges (a fold of tissue) moving medially. */}
      {c > 0.01 && c < 0.99 && (
        <Part id="mintz-pleuroperitonealak">
        <g clipPath="url(#w7-dia-cav)">
          {[1, -1].map((k) => {
            const x = k > 0 ? front : 1000 - front;
            return (
              <g key={k}>
                <path d={`M${f1(x)},150 C${f1(x + 10 * k)},260 ${f1(x + 10 * k)},340 ${f1(x)},440`} fill="none" stroke={P.poMem} strokeWidth={9} strokeLinecap="round" />
                <path d={`M${f1(x)},150 C${f1(x + 10 * k)},260 ${f1(x + 10 * k)},340 ${f1(x)},440`} fill="none" stroke="#f4d7ff" strokeWidth={2} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
        </Part>
      )}
      <Mark id="erreten-perikardioperitonealak" x={360} y={276} rx={46} ry={40} show={vis(t, 0.62, 0.74)} />
      <Mark id="erreten-perikardioperitonealak" x={640} y={276} rx={46} ry={40} show={vis(t, 0.62, 0.74)} />

      {/* Septum transversum: the large ventral plate (the IVC runs through it). */}
      <Part id="septum-transversum">
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill="url(#w7-mesench)" />
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill={`url(#w7-dia-dome${cid})`} />
        <path d={smoothPath(SEPT_EDGE, false, 0.3)} fill="none" stroke="#ffd9a8" strokeWidth={2} opacity={0.55} strokeLinecap="round" />
      </Part>
      <Part id="beheko-kaba-zaina">
        <circle cx={IVC_X[0]} cy={IVC_X[1]} r={13} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
        <ellipse cx={IVC_X[0]} cy={IVC_X[1] + 1} rx={8} ry={7} fill="#1d3f8a" />
        <circle cx={IVC_X[0] - 4} cy={IVC_X[1] - 4} r={3} fill="#9fbcff" opacity={0.5} />
      </Part>

      {/* Muscle from the body wall: a rim growing in from the periphery. */}
      <Part id="gorputz-paretako-mesodermoa" show={mus > 0.01 ? 1 : 0}>
        <path d={`${poly(CAV_X)}${poly([...inner].reverse())}`} fill={P.bodyMuscle} fillRule="evenodd" />
        <path d={`${poly(CAV_X)}${poly([...inner].reverse())}`} fill="url(#w7-muscle)" fillRule="evenodd" />
      </Part>

      {/* Dorsal mesentery of the oesophagus. */}
      <Part id="hestegorri-inguruko-mesenkima">
        <path d={poly(MES)} fill={P.eso} />
        <path d={poly(MES)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="hestegorria">
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={15} fill="#7a3b48" stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={15} fill="url(#w7-muscle)" opacity={0.5} />
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={8.5} fill={P.gut} />
        {/* The folded lumen of the oesophagus. */}
        <path d={`M${ESO_X[0] - 4},${ESO_X[1]} L${ESO_X[0] + 4},${ESO_X[1]} M${ESO_X[0]},${ESO_X[1] - 4} L${ESO_X[0]},${ESO_X[1] + 4} M${ESO_X[0] - 3},${ESO_X[1] - 3} L${ESO_X[0] + 3},${ESO_X[1] + 3}`} stroke="#1a1208" strokeWidth={1.8} strokeLinecap="round" />
      </Part>

      {/* Myocytes from the septum migrate into the pleuroperitoneal membranes. */}
      <Arrow from={[400, 430]} to={[332, 300]} color="#ff8a8a" width={2.4} show={migrate} bend={0.15} flow={!reduced} />
      <Arrow from={[600, 430]} to={[668, 300]} color="#ff8a8a" width={2.4} show={migrate} bend={-0.15} flow={!reduced} />
      <Part id="miozitoak" show={migrate}>
        {[0, 1, 2].map((i) => {
          const u = reduced ? 0.2 + i * 0.3 : (i / 3 + seg(t, 0.88, 1) * 0.9) % 1;
          const p: Pt = [lerp(392, 340, u), lerp(420, 312, u)];
          return [p, mx(p)].map((q, j) => (
            <ellipse key={`${i}${j}`} cx={q[0]} cy={q[1]} rx={11} ry={5.5} transform={`rotate(${j ? 62 : -62} ${q[0]} ${q[1]})`} fill="#ff98a6" stroke="#7a1f2e" strokeWidth={1} />
          ));
        })}
      </Part>

      <path d={poly(BODY_X)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={500} y={612} tone="accent" show={vis(t, 0, 0.74)}>
        Erretenak zabalik: goiko barrunbea (pleura) ↔ beheko barrunbea (peritoneoa)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.74, 0.88)}>
        5. astea: mintz pleuroperitonealak hestegorri inguruko mesenkimarekin eta septumarekin fusionatzen dira
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.88)}>
        Lau osagai: septuma · mintz pleuroperitonealak · hestegorri inguruko mesenkima · gorputz pareta
      </Note>

      <Label id="mintz-pleuroperitonealak" x={202} y={196} ax={345} ay={250} show={seg(t, 0.72, 0.76)} />
      <Label id="erreten-perikardioperitonealak" x={226} y={300} ax={Math.max(CANAL_MID[0], front + 24)} ay={lerp(CANAL_MID[1], FOCUS_L[1] - 30, c)} show={canalsOpen} small />
      <Label id="miozitoak" x={190} y={352} ax={366} ay={366} show={migrate} small />
      <Label id="beheko-kaba-zaina" x={190} y={400} ax={IVC_X[0] - 12} ay={IVC_X[1]} small />
      <Label id="gorputz-paretako-mesodermoa" x={206} y={462} ax={258 + rim * 0.4} ay={462} show={mus} small />
      <Label id="septum-transversum" x={190} y={540} ax={380} ay={500} />
      <Label id="hodi-neurala" x={810} y={96} ax={524} ay={100} small />
      <Label id="aorta" x={810} y={150} ax={AORTA_X[0] + 12} ay={AORTA_X[1] - 4} small />
      <Label id="hestegorria" x={810} y={196} ax={ESO_X[0] + 12} ay={ESO_X[1] - 6} />
      <Label id="hestegorri-inguruko-mesenkima" x={780} y={250} ax={550} ay={300} small />
    </g>
  );
}
