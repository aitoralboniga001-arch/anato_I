'use client';

import { Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { Cells, Defs11, K, Tissue } from '@/components/scenes/week11/common';
import { FaceArt, FACE, type FaceState } from '@/components/scenes/week11/septal';
import { H0, HeartArt, hp, type HeartState } from '@/components/scenes/week11/heart';
import { Steps, SummaryTable, T, f1, vis } from './common';

/**
 * Stage 10 of topic 10 (notes 3.4 p10–p23): the right atrium.
 *
 * `RightAtriumInside` (view `barrutik`) — the right atrium opened from the front: we look at its posterior
 * wall. One drawing morphs through the notes: the sinoatrial orifice with the sinus behind it; the two
 * venous valves round it, fused at the top into septum spurium (up to the roof); the left valve and the
 * spurium go to the septum; the right valve vanishes above and leaves the valves of the IVC and of the
 * coronary sinus below; the sinus is taken into the back wall (the violet smooth part, where the cavae and
 * the coronary sinus open); the rest (orange) is the trabeculated part with the auricle and the pectinate
 * muscles; between the two, the crista terminalis with the sinus node at its top. The camera moves in to
 * each detail and out again; at the end the whole section's summary table.
 *
 * `SpuriumFace` (view `trenkada`) — topic 11's view of the septum from inside the right atrium: spurium and
 * the left venous valve merge into septum secundum; septum primum has just appeared.
 *
 * `RightAtriumFrontal` (view `frontala`) — topic 11's frontal section: the violet smooth part growing on the
 * right atrium's back and lateral wall.
 */

export const S10 = [0, 0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.8, 0.9] as const;

// ———————————————————————————— geometry (the right atrium opened from the front) ————————————————————————————

/** Cut edge of the anterior wall: the frame we look through. */
const FRAME: Pt[] = [
  [300, 100], [420, 72], [560, 76], [672, 110], [736, 196], [750, 330], [728, 462], [660, 558], [520, 598], [380, 590], [292, 538], [250, 440], [244, 320], [262, 204],
];
/** The auricle (belarritxoa): a pouch at the upper left. */
const AURICLE: Pt[] = [[318, 130], [250, 92], [184, 96], [150, 140], [160, 196], [214, 226], [262, 214]];
/** The septal (medial) wall on the right. */
const SEPTAL: Pt[] = [[640, 120], [700, 150], [728, 230], [736, 330], [722, 440], [676, 530], [626, 540], [640, 420], [646, 300], [636, 190]];

const O = { cx: 470, cy: 318, ry: 150 };
const ell = (cx: number, cy: number, rx: number, ry: number, a: number): Pt => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
const rad = (d: number) => (d * Math.PI) / 180;

/** The smooth part at the end (violet): most of the back wall, right of the crista terminalis. */
const BIG = { cx: 500, cy: 336, rx: 146, ry: 232 };
function bigPt(a: number): Pt {
  // A rounded rectangle (superellipse) so the smooth part fills the back wall.
  const c = Math.cos(a);
  const s = Math.sin(a);
  const e = 0.78;
  return [BIG.cx + BIG.rx * Math.sign(c) * Math.abs(c) ** e, BIG.cy + BIG.ry * Math.sign(s) * Math.abs(s) ** e];
}
const N = 40;
/** The smooth area: from the orifice (k = 0) to the whole back wall (k = 1). */
function smoothArea(k: number, rx: number) {
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const o = ell(O.cx, O.cy, rx, O.ry, a);
    const b = bigPt(a);
    return [lerp(o[0], b[0], k), lerp(o[1], b[1], k)] as Pt;
  });
  return smoothPath(pts, true, 0.5);
}
/** The crista terminalis: the left edge of the smooth part, top to bottom. */
const CRISTA: Pt[] = Array.from({ length: 13 }, (_, i) => bigPt(rad(lerp(240, 120, i / 12)))).map(([x, y]) => [x - 4, y] as Pt);

/** A venous valve along one rim of the orifice (angles in degrees), as a fold: a band with a free edge. */
function valveBand(rx: number, a0: number, a1: number, w: number) {
  const n = 16;
  const outer = Array.from({ length: n + 1 }, (_, i) => ell(O.cx, O.cy, rx + 3, O.ry + 3, rad(lerp(a0, a1, i / n))));
  const inner = Array.from({ length: n + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / n);
    const taper = Math.sin(Math.PI * (i / n)) ** 0.6;
    return ell(O.cx, O.cy, rx - w * taper, O.ry - w * 0.6 * taper, rad(a));
  }).reverse();
  return `${smoothPath(outer, false, 0.5)}L${f1(inner[0][0])},${f1(inner[0][1])}${smoothPath(inner, false, 0.5).replace(/^M[^C]*/, '')}Z`;
}

/** Openings in the smooth wall (as dark holes with a rim). */
const SVC = { cx: 478, cy: 128, rx: 50, ry: 28 };
const IVC = { cx: 448, cy: 534, rx: 56, ry: 30 };
const CS = { cx: 588, cy: 486, rx: 22, ry: 15 };

// ———————————————————————————— camera ————————————————————————————

type Cam = { fx: number; fy: number; s: number; tx?: number };
const WHOLE: Cam = { fx: 470, fy: 330, s: 0.98 };
const TOP: Cam = { fx: 470, fy: 238, s: 1.32 };
const LOW: Cam = { fx: 510, fy: 470, s: 1.55 };
const LAT: Cam = { fx: 320, fy: 250, s: 1.35 };
const NODE: Cam = { fx: 400, fy: 190, s: 1.75 };
const TABLE: Cam = { fx: 470, fy: 330, s: 0.5, tx: 176 };
const S = S10;
const KEYS: [number, Cam][] = [
  [0, WHOLE],
  [S[1] + 0.01, WHOLE],
  [S[1] + 0.035, TOP],
  [S[2] - 0.01, TOP],
  [S[2], WHOLE],
  [S[3] + 0.005, WHOLE],
  [S[3] + 0.03, LOW],
  [S[4] - 0.01, LOW],
  [S[4] + 0.015, WHOLE],
  [S[6] + 0.005, WHOLE],
  [S[6] + 0.03, LAT],
  [S[7] - 0.005, LAT],
  [S[7] + 0.025, NODE],
  [S[8] - 0.005, NODE],
  [S[8] + 0.03, TABLE],
];
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));
function camAt(t: number): Required<Cam> {
  const full = (c: Cam): Required<Cam> => ({ ...c, tx: c.tx ?? 500 });
  if (t <= KEYS[0][0]) return full(KEYS[0][1]);
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, c1] = KEYS[i];
    if (t <= t1) {
      const [t0, c0] = KEYS[i - 1];
      const k = ease((t - t0) / (t1 - t0 || 1));
      const a = full(c0);
      const b = full(c1);
      const s = a.s * Math.pow(b.s / a.s, k);
      const w = a.s === b.s ? k : (1 / a.s - 1 / s) / (1 / a.s - 1 / b.s || 1);
      return { fx: lerp(a.fx, b.fx, w), fy: lerp(a.fy, b.fy, w), s, tx: lerp(a.tx, b.tx, k) };
    }
  }
  return full(KEYS[KEYS.length - 1][1]);
}

// ———————————————————————————— the scene ————————————————————————————

const VALVE = { fill: '#a78bfa', deep: '#5b3fb8' };
const SPUR = { fill: '#e9d5ff', deep: '#7c5fd6' };

export function RightAtriumInside({ t }: SceneProps) {
  const cam = camAt(t);
  const z = zoom(cam.fx, cam.fy, cam.s, cam.tx, 320);

  // Timeline of the morph (each step at its beat).
  const valves = seg(t, S[1] + 0.01, S[1] + 0.05);
  const spur = seg(t, S[1] + 0.05, S[1] + 0.1);
  const toSeptum = seg(t, S[2] + 0.02, S[2] + 0.1);
  const rightTopGone = seg(t, S[3] + 0.03, S[3] + 0.07);
  const lowSplit = seg(t, S[3] + 0.06, S[3] + 0.11);
  const incorp = seg(t, S[4] + 0.015, S[4] + 0.1);
  const pect = seg(t, S[6] + 0.01, S[6] + 0.08);
  const crista = seg(t, S[7] + 0.005, S[7] + 0.05);
  const node = seg(t, S[7] + 0.04, S[7] + 0.07);
  const table = seg(t, S[8], S[8] + 0.03);

  // The orifice narrows a little once the valves grow, and is taken into the wall with the sinus.
  const rx = lerp(64, 50, valves);
  const orificeShow = 1 - seg(t, S[4] + 0.02, S[4] + 0.08);
  const holes = seg(t, S[3] + 0.04, S[3] + 0.09);
  const svc = seg(t, S[4] + 0.05, S[4] + 0.1);
  const smoothK = incorp;
  // Smooth (violet) area: at first just the sinus seen through the orifice.
  const smoothD = smoothArea(smoothK, rx);
  const spurTop = lerp(O.cy - O.ry, 84, spur);

  const a = (x: number, y: number) => z.at(x, y);
  const lab = (id: string, x: number, y: number, ax: number, ay: number, show: number, extra: { small?: boolean; text?: string } = {}) => {
    const [px, py] = a(ax, ay);
    // Two columns at the frame's edges, the names facing the drawing; the right one steps in under the tools.
    const left = x === Lx;
    const cx = left ? 24 : y < 232 ? 926 : 976;
    return <Label key={`${id}:${y}`} id={id} x={cx} y={y} align={left ? 'start' : 'end'} ax={px} ay={py} show={show * (1 - table)} {...extra} />;
  };
  const Lx = 0;
  const Rx = 1;

  // Blood: mixed through the orifice early; then venous blood from each opening (all body veins end here).
  const early = vis(t, 0, S[4] + 0.04);
  const late = vis(t, S[5]);

  return (
    <g>
      <Defs11 />
      <g transform={z.transform}>
        {/* The right atrium: trabeculated wall (orange), its auricle, the septal wall on the right. */}
        <Part id={incorp > 0.5 ? 'atal-trabekulatua' : 'hasierako-eskuineko-aurikula'} groups={['eskuineko-aurikula']}>
          <Tissue d={smoothPath(FRAME, true, 0.5)} fill={K.atrium} deep={K.atriumDeep} pattern="w11-atrial" />
          <path d={smoothPath(FRAME, true, 0.5)} fill="#1b0d13" opacity={0.1} />
        </Part>
        <Part id="belarritxoa" groups={['atal-trabekulatua']}>
          <Tissue d={smoothPath(AURICLE, true, 0.5)} fill={K.atrium} deep={K.atriumDeep} pattern="w11-atrial" />
          <path d={smoothPath(AURICLE, true, 0.5)} fill="#1b0d13" opacity={0.06} />
        </Part>
        <Part id="aurikula-arteko-trenkada" quiet>
          <Tissue d={smoothPath(SEPTAL, true, 0.5)} fill="#c45f33" deep={K.atriumDeep} pattern="w11-atrial" />
        </Part>
        <Part id="septum-secundum" show={vis(t, S[2])}>
          <Tissue d={`M652,124 C676,190 682,300 664,420 Q656,446 648,420 C660,300 652,200 634,130 Z`} fill={K.secundum} deep={K.secundumDeep} opacity={vis(t, S[2])} />
        </Part>

        {/* Pectinate muscles: fine parallel ridges on the trabeculated wall and in the auricle. */}
        <Part id="muskulu-pektinioak" show={pect}>
          <g opacity={pect} strokeLinecap="round">
            {[{ c: '#7a2e10', w: 7.5, dx: 1.5, dy: 2 }, { c: '#ffa765', w: 5, dx: 0, dy: 0 }].map((st, k) => (
              <g key={k} stroke={st.c} transform={`translate(${st.dx} ${st.dy})`}>
                {CRISTA.slice(1, 12).map(([x, y], i) => {
                  const len = 66 + 22 * Math.sin(i * 1.7);
                  const ang = rad(192 + i * 3.2);
                  return <line key={i} x1={f1(x - 8)} y1={f1(y)} x2={f1(x - 8 + Math.cos(ang) * len * pect)} y2={f1(y + Math.sin(ang) * len * pect * 0.55)} strokeWidth={st.w} />;
                })}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={`a${i}`} x1={f1(176 + i * 22)} y1={f1(118 + i * 3)} x2={f1(186 + i * 20)} y2={f1(118 + i * 3 + 78 * pect)} strokeWidth={st.w * 0.85} />
                ))}
              </g>
            ))}
          </g>
        </Part>

        {/* The smooth part / the sinus behind the orifice (violet). */}
        <Part id={incorp > 0.5 ? 'atal-lisoa' : 'zain-sinua'} groups={incorp > 0.5 ? ['eskuineko-sinu-luzapena', 'eskuineko-aurikula'] : ['eskuineko-sinu-luzapena']}>
          <Tissue d={smoothD} fill={K.smoothRA} deep={K.smoothDeep} light />
          <path d={smoothD} fill="#1b0d13" opacity={0.45 * orificeShow} />
        </Part>
        {/* The sinoatrial orifice: its rim (while it is an orifice). */}
        {orificeShow > 0.02 && (
          <Part id="zulo-sinoaurikularra">
            <ellipse cx={O.cx} cy={O.cy} rx={rx} ry={O.ry} fill="none" stroke="#1a0710" strokeWidth={6} opacity={orificeShow} />
          </Part>
        )}

        {/* Openings of the veins in the smooth wall. */}
        <Part id="goiko-kaba-zaina" show={svc}>
          <ellipse cx={SVC.cx} cy={SVC.cy} rx={SVC.rx * svc} ry={SVC.ry * svc} fill="#12070c" stroke={K.smoothDeep} strokeWidth={3} opacity={svc} />
        </Part>
        <Part id="beheko-kaba-zaina" show={holes}>
          <ellipse cx={IVC.cx} cy={IVC.cy} rx={IVC.rx * holes} ry={IVC.ry * holes} fill="#12070c" stroke={K.smoothDeep} strokeWidth={3} opacity={holes} />
        </Part>
        <Part id="sinu-koronarioa" show={holes}>
          <ellipse cx={CS.cx} cy={CS.cy} rx={CS.rx * holes} ry={CS.ry * holes} fill="#12070c" stroke={K.smoothDeep} strokeWidth={2.5} opacity={holes} />
        </Part>

        {/* Crista terminalis, and the sinus node at its upper end. */}
        <Part id="gandor-terminala" show={crista}>
          <path d={smoothPath(CRISTA, false, 0.5)} fill="none" stroke="#7a2e10" strokeWidth={15} strokeLinecap="round" opacity={crista} />
          <path d={smoothPath(CRISTA, false, 0.5)} fill="none" stroke="#f08a4b" strokeWidth={10} strokeLinecap="round" opacity={crista} strokeDasharray={`${f1(900 * crista)} 900`} />
        </Part>
        <Part id="nodulu-sinusala" show={node}>
          <ellipse cx={CRISTA[0][0] + 18} cy={CRISTA[0][1] + 18} rx={16 * node} ry={10 * node} fill="#ffd27a" stroke="#a36a00" strokeWidth={1.5} opacity={node} />
        </Part>

        {/* The venous valves: right (lateral, on your left) and left (septal side, on your right). */}
        {valves > 0.01 && (
          <>
            <Part id="eskuineko-zain-balbula" show={1 - lowSplit * 0.999}>
              <g opacity={valves * (1 - rightTopGone)}>
                <Tissue d={valveBand(rx, 186, 250, 18 * valves)} fill={VALVE.fill} deep={VALVE.deep} />
              </g>
              <g opacity={valves * (1 - lowSplit)}>
                <Tissue d={valveBand(rx, 110, 186, 18 * valves)} fill={VALVE.fill} deep={VALVE.deep} />
              </g>
            </Part>
            <g transform={`translate(${f1(170 * toSeptum)} 0)`} opacity={1 - 0.85 * toSeptum}>
              <Part id="ezkerreko-zain-balbula">
                <Tissue d={valveBand(rx, -70, 70, 18 * valves)} fill={VALVE.fill} deep={VALVE.deep} opacity={valves} />
              </Part>
              {spur > 0.01 && (
                <Part id="septum-spurium">
                  <Tissue d={`M${O.cx - 9},${f1(O.cy - O.ry + 8)} L${O.cx - 7},${f1(spurTop + 6)} Q${O.cx},${f1(spurTop - 6)} ${O.cx + 7},${f1(spurTop + 6)} L${O.cx + 9},${f1(O.cy - O.ry + 8)} Z`} fill={SPUR.fill} deep={SPUR.deep} />
                </Part>
              )}
            </g>
          </>
        )}
        {/* From the right valve's lower part: the valves of the IVC and of the coronary sinus. */}
        {lowSplit > 0.01 && (
          <>
            <Part id="beheko-kabaren-balbula">
              <path d={`M${IVC.cx - IVC.rx - 6},${IVC.cy - 4} Q${IVC.cx},${IVC.cy - IVC.ry - 26 * lowSplit} ${IVC.cx + IVC.rx + 6},${IVC.cy - 6}`} fill="none" stroke={VALVE.deep} strokeWidth={11} strokeLinecap="round" opacity={lowSplit} />
              <path d={`M${IVC.cx - IVC.rx - 6},${IVC.cy - 4} Q${IVC.cx},${IVC.cy - IVC.ry - 26 * lowSplit} ${IVC.cx + IVC.rx + 6},${IVC.cy - 6}`} fill="none" stroke={VALVE.fill} strokeWidth={7} strokeLinecap="round" opacity={lowSplit} />
            </Part>
            <Part id="sinu-koronarioaren-balbula">
              <path d={`M${CS.cx - CS.rx - 5},${CS.cy - 2} Q${CS.cx},${CS.cy - CS.ry - 16 * lowSplit} ${CS.cx + CS.rx + 5},${CS.cy - 2}`} fill="none" stroke={VALVE.deep} strokeWidth={8} strokeLinecap="round" opacity={lowSplit} />
              <path d={`M${CS.cx - CS.rx - 5},${CS.cy - 2} Q${CS.cx},${CS.cy - CS.ry - 16 * lowSplit} ${CS.cx + CS.rx + 5},${CS.cy - 2}`} fill="none" stroke={VALVE.fill} strokeWidth={5} strokeLinecap="round" opacity={lowSplit} />
            </Part>
          </>
        )}
      </g>

      {/* Blood: mixed through the orifice; later venous blood from the cavae and the coronary sinus. */}
      <Cells pts={[a(O.cx, O.cy - 40), a(O.cx - 20, O.cy + 20), a(O.cx - 80, O.cy + 120)]} t={t} n={6} speed={3} colors={['#e5484d', '#3b82f6']} show={early * orificeShow} seed={3} />
      <Cells pts={[a(SVC.cx, SVC.cy), a(SVC.cx - 30, SVC.cy + 110), a(400, 360)]} t={t} n={5} speed={3} colors={['#3b82f6']} show={late * (1 - table)} seed={5} />
      <Cells pts={[a(IVC.cx, IVC.cy), a(IVC.cx - 20, IVC.cy - 110), a(410, 340)]} t={t} n={5} speed={3} colors={['#3b82f6']} show={late * (1 - table)} seed={7} />
      <Cells pts={[a(CS.cx, CS.cy), a(CS.cx - 50, CS.cy - 60), a(470, 380)]} t={t} n={3} speed={3} colors={['#3b82f6']} show={late * (1 - table)} seed={9} />

      {/* Names, step by step. */}
      {lab('zain-sinua', Rx, 284, O.cx + 10, O.cy + 40, vis(t, 0, S[4] + 0.02), { text: 'Zain sinua (atzean)' })}
      {lab('zulo-sinoaurikularra', Rx, 240, O.cx + rx - 8, O.cy - 40, vis(t, 0, S[1] + 0.02) + vis(t, S[4], S[4] + 0.04))}
      {lab('hasierako-eskuineko-aurikula', Lx, 236, 300, 420, vis(t, 0, S[4] + 0.03))}
      {lab('eskuineko-zain-balbula', Lx, 356, O.cx - rx - 4, O.cy + 40, vis(t, S[1] + 0.02, S[2]) + vis(t, S[3], S[3] + 0.08))}
      {lab('ezkerreko-zain-balbula', Rx, 360, O.cx + rx + 4 + 170 * toSeptum, O.cy + 30, vis(t, S[1] + 0.02, S[3]))}
      {lab('septum-spurium', Rx, 130, O.cx + 170 * toSeptum, (spurTop + O.cy - O.ry) / 2 + 4, vis(t, S[1] + 0.03, S[3]))}
      {lab('septum-secundum', Rx, 200, 660, 300, vis(t, S[2], S[3]))}
      {lab('beheko-kabaren-balbula', Lx, 560, IVC.cx - 20, IVC.cy - IVC.ry - 10, vis(t, S[3] + 0.07, S[4]))}
      {lab('sinu-koronarioaren-balbula', Rx, 520, CS.cx + 10, CS.cy - CS.ry - 6, vis(t, S[3] + 0.07, S[4]))}
      {lab('atal-lisoa', Rx, 284, 540, 300, vis(t, S[4] + 0.06, S[6]) + vis(t, S[7], S[8]))}
      {lab('eskuineko-aurikula', Lx, 470, 290, 470, vis(t, S[4] + 0.06, S[5]), { text: 'Behin betiko eskuineko aurikula' })}
      {lab('goiko-kaba-zaina', Rx, 90, SVC.cx + 20, SVC.cy, vis(t, S[5], S[6]))}
      {lab('beheko-kaba-zaina', Lx, 600, IVC.cx - 10, IVC.cy + 4, vis(t, S[5], S[6]))}
      {lab('sinu-koronarioa', Rx, 470, CS.cx, CS.cy, vis(t, S[5], S[6]))}
      {lab('atal-trabekulatua', Lx, 380, 290, 400, vis(t, S[6], S[7] + 0.02))}
      {lab('atal-trabekulatua', Lx, 400, CRISTA[4][0] - 40, CRISTA[4][1], vis(t, S[7] + 0.02, S[8]))}
      {lab('belarritxoa', Lx, 120, 200, 160, vis(t, S[6], S[7]))}
      {lab('muskulu-pektinioak', Lx, 250, 260, 290, vis(t, S[6] + 0.03, S[7]))}
      {lab('gandor-terminala', Lx, 284, CRISTA[6][0], CRISTA[6][1], vis(t, S[7], S[8]))}
      {lab('nodulu-sinusala', Lx, 160, CRISTA[0][0] + 18, CRISTA[0][1] + 18, vis(t, S[7] + 0.04, S[8]))}

      <Steps
        t={t}
        y={22}
        steps={[
          [S[0], 'Eskuineko aurikula aurretik irekita: atzeko pareta'],
          [S[1], 'Zain balbulak eta septum spuriuma'],
          [S[2], 'Ezkerreko balbula eta spuriuma → septum secunduma'],
          [S[3], 'Eskuineko balbula: beheko kabaren eta sinu koronarioaren balbulak'],
          [S[4], 'Zain sinua atzeko paretan inkorporatzen da'],
          [S[5], 'Atal lisoa (zain sinutik): kabak eta sinu koronarioa'],
          [S[6], 'Atal trabekulatua (hasierako aurikulatik): belarritxoa'],
          [S[7], 'Gandor terminala eta nodulu sinusala'],
          [S[8], 'Laburpena: bihotz lakioaren atalak eta haien eratorriak'],
        ]}
      />
      <Note x={500} y={616} tone="accent" show={vis(t, 0, S[1])}>
        Zulo sinoaurikularra: eskuin-atzeko aurikula paretan, zain sinuarekin komunikazioa
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[1], S[2])}>
        Zuloaren ertzetan bi zain balbula; goikaldean fusionatu → septum spurium, sabairaino
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[2], S[3])}>
        Septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[3], S[4])}>
        Eskuineko zain balbula: goian desagertu; behean bitan → beheko kabaren eta sinu koronarioaren balbulak
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[4], S[5])}>
        Zain sinua atzeko paretan inkorporatzen da: hasierako eskuineko aurikula → behin betiko eskuineko aurikula
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[5], S[6])}>
        Atzeko pareta lisoa (eskuineko luzapenetik, atalik handiena): bertan goiko eta beheko kabak eta sinu koronarioa
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[6], S[7])}>
        Gainerako pareta trabekulatua (hasierako eskuineko aurikulatik): belarritxoa eta muskulu pektinioak
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, S[7], S[8])}>
        Bi atalen artean gandor terminala; haren goiko muturrean nodulu sinusala (bihotzaren markapasoa)
      </Note>

      {table > 0.01 && (
        <g opacity={table}>
          <rect x={292} y={58} width={606} height={420} rx={12} fill="#120c16" opacity={0.92} />
          <SummaryTable
            t={t}
            x={300}
            y={66}
            widths={[278, 312]}
            rowH={30}
            head={['Bihotz lakioaren atala', 'Eratorria']}
            rows={[
              { at: S[8] + 0.01, cells: [{ id: 'bulboaren-hurbileko-atala', text: 'Bulboaren hurbileko atala', color: T.proximal }, { id: 'hasierako-eskuineko-bentrikulua', text: 'Hasierako eskuineko bentrikulua' }] },
              { at: S[8] + 0.015, cells: [{ id: 'arteria-konoa', text: 'Arteria konoa', color: T.conus }, { id: 'infundibuluak', text: 'Bi infundibuluak (lisoak)' }] },
              { at: S[8] + 0.02, cells: [{ id: 'enbor-arteriosoa', text: 'Enbor arteriosoa', color: T.truncus }, { id: 'aortaren-sustraiak', text: 'Birika enborraren + aortaren sustraiak' }] },
              { at: S[8] + 0.025, cells: [{ id: 'atal-bentrikularra', text: 'Atal bentrikularra', color: T.ventricle }, { id: 'hasierako-ezkerreko-bentrikulua', text: 'Hasierako ezkerreko bentrikulua' }] },
              { at: S[8] + 0.03, cells: [{ id: 'atal-aurikularra', text: 'Atal aurikularra', color: T.atrium }, { id: 'atal-trabekulatua', text: 'Atal trabekulatua eta belarritxoa' }] },
              { at: S[8] + 0.035, cells: [{ id: 'eskuineko-sinu-luzapena', text: 'Sinuaren eskuineko luzapena', color: T.sinus }, { id: 'atal-lisoa', text: 'Eskuineko aurikularen atal lisoa' }] },
              { at: S[8] + 0.04, cells: [{ id: 'ezkerreko-sinu-luzapena', text: 'Sinuaren ezkerreko luzapena', color: T.sinus }, { id: 'sinu-koronarioa', text: 'Sinu koronarioa + zain laprana' }] },
              { at: S[8] + 0.045, cells: [{ id: 'eskuineko-zain-balbula', text: 'Eskuineko zain balbula', color: VALVE.fill }, { id: 'beheko-kabaren-balbula', text: 'Kaba eta sinu koronarioaren balbulak' }] },
              { at: S[8] + 0.05, cells: [{ id: 'ezkerreko-zain-balbula', text: 'Ezkerreko zain balbula', color: VALVE.fill }, { id: 'septum-secundum', text: 'Septum secundumarekin fusionatzen da' }] },
            ]}
          />
        </g>
      )}
    </g>
  );
}

// ———————————————————————————— the septum from inside the right atrium (topic 11's view) ————————————————————————————

export function SpuriumFace({ t }: SceneProps) {
  const k = seg(t, S[2] + 0.01, S[2] + 0.1);
  const s: FaceState = { primum: lerp(0.05, 0.3, k), closeOP: 0, os2: 0, stub: 0, secundum: lerp(0.15, 0.55, k), spurium: lerp(0.4, 1, k), cushions: 0.4, press: 0, fuse: 0, flow: 0 };
  const L = 232;
  const R = 768;
  return (
    <g>
      <Defs11 />
      <FaceArt s={s} t={t} />
      <Label id="septum-spurium" x={L} y={110} ax={FACE.X0 + 60} ay={FACE.ROOF + 26} />
      <Label id="ezkerreko-zain-balbula" x={L} y={262} ax={FACE.X0 + 34} ay={290} />
      <Label id="goiko-kaba-zaina" x={L} y={40} ax={262} ay={40} small />
      <Label id="hasierako-eskuineko-aurikula" x={L} y={430} ax={FACE.X0 - 50} ay={430} />
      <Label id="beheko-kaba-zaina" x={L} y={566} ax={240} ay={590} small />
      <Label id="septum-secundum" x={R} y={92} ax={640} ay={FACE.ROOF + 30 + 60 * s.secundum} />
      <Label id="septum-primum" x={R} y={140} ax={600} ay={FACE.ROOF + 14} />
      <Label id="kuxin-aurikulubentrikularrak" x={R} y={520} ax={560} ay={512} small />
      <Note x={500} y={18} size={12.5} tone="dim">
        5. astea · aurikula arteko trenkada, eskuineko aurikularen barrutik ikusita (11. gaiko ikuspegia)
      </Note>
      <Note x={500} y={616} tone="accent">
        Septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira; septum primuma ere orain agertzen da
      </Note>
    </g>
  );
}

// ———————————————————————————— the frontal section (topic 11's view) ————————————————————————————

export function RightAtriumFrontal({ t }: SceneProps) {
  const smooth = seg(t, S[4] + 0.015, S[5] + 0.02);
  const s: HeartState = { ...H0, canal: 0.6, ridge: 0.4, cushions: 0.5, ivMuscle: 0.3, primum: 0.3, secundum: 0.3, smooth, veins: vis(t, S[4]), flow: 0 };
  const [x1, y1] = hp(268, 210);
  const [x2, y2] = hp(341, 40);
  const [x3, y3] = hp(226, 520);
  const [x4, y4] = hp(560, 160);
  return (
    <g>
      <Defs11 />
      <HeartArt s={s} t={t} />
      <Label id="atal-lisoa" x={232} y={210} ax={x1} ay={y1} show={vis(t, S[4] + 0.04)} />
      <Label id="hasierako-eskuineko-aurikula" x={232} y={150} ax={hp(300, 160)[0]} ay={hp(300, 160)[1]} show={vis(t, 0, S[4] + 0.06)} />
      <Label id="eskuineko-aurikula" x={232} y={150} ax={hp(300, 160)[0]} ay={hp(300, 160)[1]} show={vis(t, S[4] + 0.06)} text="Behin betiko eskuineko aurikula" />
      <Label id="goiko-kaba-zaina" x={232} y={40} ax={x2} ay={y2} show={vis(t, S[4])} small />
      <Label id="beheko-kaba-zaina" x={232} y={520} ax={x3} ay={y3} show={vis(t, S[4])} small />
      <Label id="hasierako-ezkerreko-aurikula" x={768} y={240} ax={x4} ay={y4} small />
      <Note x={500} y={18} size={12.5} tone="dim">
        Mozketa frontala, aurretik · atal lisoa (morea, zain sinutik) eskuineko aurikularen atzeko paretan
      </Note>
    </g>
  );
}
