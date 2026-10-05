'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Serosa, Sheet, f1, morph, offset, poly, resample, spline, vis } from './common';

/**
 * 7:pleura-perikardioa — apunteen 2.2 atala eta 24. orriko irudiak. Hasierako perikardio barrunbeak torax
 * osoa okupatzen du; hortik bi pleura barrunbe eta behin-betiko perikardio barrunbea sortzen dira.
 *  - `birika-hastapena` (aurretik ikusita): aurreko hestearen aurreko paretatik arnas hastapena; hodi
 *    laringotrakeala luzatzen da eta erpinetik bi birika hastapen sortzen dira.
 *  - `zeharkakoa` (toraxaren zeharkako mozketa, dortsala goian): birika hastapenak errai orria bultzatuz atze-
 *    alboko aldeetan sartzen dira; 5. astean mintz pleuroperikardikoak (nerbio frenikoa eta bena kardinal
 *    komuna barnean) erdirantz hazten dira eta elkarren artean eta hestegorri inguruko mesenkimarekin
 *    fusionatzen dira; birikek hazten jarraitzen dute eta mintzen oinaldeak aurrerantz eta alborantz doaz.
 *    Azkenik pleura (paretakoa/erraia) eta perikardioa (fibrosoa/serosoa), espazio birtualak.
 */

// ——— Transverse section of the thorax ———

const BODY = spline(
  [
    [500, 50], [640, 62], [742, 116], [792, 214], [798, 330], [774, 440], [706, 530], [604, 580], [500, 590], [396, 580], [294, 530], [226, 440],
    [202, 330], [208, 214], [258, 116], [360, 62],
  ],
  8,
  true,
);
const SKIN_IN = offset(BODY, -9, true);

/** Inner wall of the thoracic cavity, left half: from the ventral midline round to the dorsal midline. */
const WALL_L = spline(
  [[500, 560], [420, 550], [340, 514], [284, 450], [260, 362], [270, 278], [306, 212], [366, 186], [424, 200], [458, 228], [500, 236]],
  10,
);
const WALL_L_R = resample(WALL_L, 241);
const mirror = (p: Pt): Pt => [1000 - p[0], p[1]];
const WALL = [...WALL_L, ...[...WALL_L].reverse().slice(1, -1).map(mirror)];
/** Point and stretch of the left wall between fractions u0..u1 (0 = ventral midline, 1 = dorsal midline). */
const wallAt = (u: number): Pt => WALL_L_R[Math.round(Math.max(0, Math.min(1, u)) * 240)];
const wallCut = (u0: number, u1: number): Pt[] => {
  const a = Math.round(u0 * 240);
  const b = Math.round(u1 * 240);
  return a <= b ? WALL_L_R.slice(a, b + 1) : WALL_L_R.slice(b, a + 1).reverse();
};

/** Mesenchyme round the oesophagus (dorsal midline), where the membranes fuse. */
const MEDIA = spline([[452, 228], [500, 238], [548, 228], [552, 280], [536, 322], [500, 336], [464, 322], [448, 280]], 8, true);
const ESO: Pt = [500, 272];
const FUSE: Pt = [500, 338];
const AORTA: Pt = [500, 206];
const HEART: Pt = [500, 444];

// Left lung (viewer's left), key shapes: bud, growing lobe, crescent round the pericardium.
const LUNG_A = spline([[470, 264], [458, 268], [452, 280], [458, 292], [472, 294], [480, 282]], 6, true);
const LUNG_B = spline([[456, 246], [410, 222], [352, 232], [314, 268], [312, 302], [350, 318], [410, 314], [446, 298], [462, 274]], 6, true);
const LUNG_C = spline(
  [[448, 236], [392, 196], [318, 214], [278, 278], [272, 362], [292, 446], [342, 508], [404, 534], [394, 488], [380, 440], [384, 394], [414, 356], [446, 330], [454, 284]],
  6,
  true,
);

/** The lung once it fills its pleural cavity (the cavity is then a virtual space). */
const LUNG_D = spline(
  [[446, 234], [390, 192], [314, 208], [272, 276], [266, 362], [290, 450], [344, 514], [414, 544], [406, 500], [398, 452], [400, 404], [424, 368], [452, 338], [452, 284]],
  6,
  true,
);

function area(pts: readonly Pt[]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/** A closed outline moved inward by d. */
function inset(pts: Pt[], d: number): Pt[] {
  const a = offset(pts, d, true);
  return Math.abs(area(a)) < Math.abs(area(pts)) ? a : offset(pts, -d, true);
}

interface Geo {
  base: Pt;
  tip: Pt;
  mem: Pt[];
  peri: Pt[];
  pleura: Pt[];
  lung: Pt[];
}

/** Section geometry for the left half (the right is its mirror). */
function thorax(t: number): Geo & { grow: number; p: number; d: number; virt: number; m: number } {
  const g1 = seg(t, 0.24, 0.34);
  const g2 = seg(t, 0.6, 0.7);
  const m = seg(t, 0.36, 0.42);
  const p = 0.12 * m + 0.88 * seg(t, 0.48, 0.545);
  const d = seg(t, 0.6, 0.7);
  const virt = seg(t, 0.93, 0.99);
  const ub = lerp(0.46, 0.105, d);
  const base = wallAt(ub);
  // The membrane: from its base on the wall to its tip, which reaches the oesophageal mesenchyme (FUSE).
  const start: Pt = [base[0] + 18, base[1] - 4];
  const tip: Pt = [lerp(start[0], FUSE[0], p), lerp(start[1], FUSE[1], p)];
  const mid0: Pt = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2 + 8];
  const mid: Pt = [lerp(mid0[0], 408, d), lerp(mid0[1], 432, d)];
  const mem = spline([base, mid, tip], 14);
  // Pericardial region: both membranes + the ventral wall between their bases.
  const memR = mem.map(mirror);
  const peri = [...mem, ...[...memR].reverse(), ...wallCut(ub, 0).map(mirror).reverse().slice(1), ...wallCut(0, ub).slice(1)];
  // Left pleural region: wall from the base round to the dorsal midline, the mediastinum, the membrane back.
  const pleura = [...wallCut(ub, 1), ...resample(MEDIA, 60).filter((q) => q[0] <= 500 && q[1] > 236).reverse(), ...[...mem].reverse()];
  const lung0 = g2 > 0 ? morph(LUNG_B, LUNG_C, g2, 80) : morph(LUNG_A, LUNG_B, g1, 80);
  const lung = virt > 0 ? morph(lung0, LUNG_D, virt, 80) : lung0;
  return { base, tip, mem, peri, pleura, lung, grow: g1, p, d, virt, m };
}

function Lung({ pts, coat }: { pts: Pt[]; coat: number }) {
  const d = smoothPath(pts, true, 0.3);
  return (
    <>
      <path d={d} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.2} />
      <path d={d} fill="url(#w7-lung)" />
      <path d={d} fill="url(#w7-light)" />
      {coat > 0.01 && <path d={d} fill="none" stroke="#ffd29a" strokeWidth={3} opacity={coat} />}
    </>
  );
}

function heartD(s: number) {
  const [x, y] = HEART;
  return `M${f1(x)},${f1(y - 46 * s)} C${f1(x + 40 * s)},${f1(y - 70 * s)} ${f1(x + 78 * s)},${f1(y - 30 * s)} ${f1(x + 62 * s)},${f1(y + 12 * s)} C${f1(x + 48 * s)},${f1(y + 46 * s)} ${f1(x + 14 * s)},${f1(y + 60 * s)} ${f1(x)},${f1(y + 64 * s)} C${f1(x - 14 * s)},${f1(y + 60 * s)} ${f1(x - 48 * s)},${f1(y + 46 * s)} ${f1(x - 62 * s)},${f1(y + 12 * s)} C${f1(x - 78 * s)},${f1(y - 30 * s)} ${f1(x - 40 * s)},${f1(y - 70 * s)} ${f1(x)},${f1(y - 46 * s)}Z`;
}

function HeartShape({ s = 1 }: { s?: number }) {
  const [x, y] = HEART;
  const d = heartD(s);
  return (
    <>
      <path d={d} fill={P.heart} stroke={P.heartDeep} strokeWidth={1.4} />
      <path d={`M${f1(x)},${f1(y - 40 * s)}Q${f1(x - 6 * s)},${f1(y + 10 * s)} ${f1(x)},${f1(y + 58 * s)}`} fill="none" stroke={P.heartDeep} strokeWidth={2} opacity={0.6} />
      <ellipse cx={x - 24 * s} cy={y - 18 * s} rx={16 * s} ry={10 * s} fill="#fff" opacity={0.14} />
    </>
  );
}

/** The membrane as a three-layered band: two serous layers round a mesenchymal core. */
function Membrane({ pts, core, show }: { pts: Pt[]; core: string; show: number }) {
  if (show <= 0.01) return null;
  const d = `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
  return (
    <g opacity={show}>
      <path d={d} fill="none" stroke={P.ppMem} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={core} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const along = (pts: Pt[], u: number): Pt => resample(pts, 101)[Math.round(u * 100)];

export function ThoraxSection({ t }: SceneProps) {
  const G = thorax(t);
  const both = <T,>(f: (side: 1 | -1) => T) => [f(1), f(-1)];
  const sideP = (q: Pt, s: 1 | -1): Pt => (s > 0 ? q : mirror(q));
  const fused = seg(t, 0.53, 0.555);
  const pleuraNamed = seg(t, 0.72, 0.76);
  const periNamed = seg(t, 0.84, 0.88);
  const memShow = G.m;
  const memCore = periNamed > 0.5 ? '#d9c7a4' : P.mesench;
  const nerve = along(G.mem, 0.16);
  const vein = along(G.mem, 0.3);
  const heartS = lerp(1, 1.1, G.virt);
  // Cavity tints: one primitive pericardial cavity, then two pleural + one pericardial.
  const periTint = poly(G.peri);
  const pleuraTint = `${poly(G.pleura)}${poly(G.pleura.map(mirror))}`;
  const gap = 1 - 0.75 * G.virt;

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <path d={poly(BODY)} fill={P.wall} />
      <path d={poly(BODY)} fill="url(#w7-mesench)" />
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY} inner={SKIN_IN} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={7} />
      </Part>
      <Part id="hodi-neurala">
        <ellipse cx={500} cy={100} rx={26} ry={32} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <ellipse cx={500} cy={100} rx={3} ry={9} fill="#0c1428" />
      </Part>
      <Part id="ornoak" quiet>
        <ellipse cx={500} cy={160} rx={36} ry={22} fill={P.bone} opacity={0.85} />
      </Part>
      <Part id="aorta">
        <circle cx={AORTA[0]} cy={AORTA[1]} r={14} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.2} />
      </Part>

      {/* The thoracic cavity. */}
      <path d={poly(WALL)} fill={P.space} />
      <Part id="hasierako-perikardio-barrunbea" show={1 - fused}>
        <path d={poly(WALL)} fill={P.peri} opacity={gap} />
      </Part>
      <Part id="pleura-barrunbea" show={fused}>
        <path d={pleuraTint} fill={P.pleura} opacity={gap} />
      </Part>
      <Part id="perikardio-barrunbea" show={fused}>
        <path d={periTint} fill={P.peri} opacity={gap} />
      </Part>

      {/* Parietal pleura along the wall of each pleural cavity. */}
      <Part id="paretako-pleura" show={pleuraNamed}>
        {both((s) => (
          <Serosa key={s} pts={resample(G.pleura, 90).map((q) => sideP(q, s))} d={s > 0 ? 5 : -5} color="#9fd0ff" seed={s > 0 ? 3 : 4} cell={11} />
        ))}
      </Part>

      {/* Mediastinum: mesenchyme round the oesophagus. */}
      <Part id="hestegorri-inguruko-mesenkima">
        <path d={poly(MEDIA)} fill={P.eso} opacity={0.55} />
        <path d={poly(MEDIA)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="hestegorria">
        <circle cx={ESO[0]} cy={ESO[1]} r={15} fill="#7a3b48" stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
        <circle cx={ESO[0]} cy={ESO[1]} r={9} fill={P.gut} />
        <circle cx={ESO[0]} cy={ESO[1]} r={3.5} fill="#1a1208" />
      </Part>

      {/* Heart in the (pericardial) cavity; its serous coat once the pericardium is named. */}
      <Part id="bihotza">
        <HeartShape s={heartS} />
      </Part>

      {/* Lungs: buds, then lobes covered by the visceral layer they push ahead of them. */}
      <Part id="birika-hastapenak" show={1 - G.d}>
        {both((s) => (
          <Lung key={s} pts={G.lung.map((q) => sideP(q, s))} coat={0} />
        ))}
      </Part>
      <Part id="birikak" show={G.d}>
        {both((s) => (
          <Lung key={s} pts={G.lung.map((q) => sideP(q, s))} coat={0} />
        ))}
      </Part>
      <Part id="errai-orria" show={1 - pleuraNamed}>
        {both((s) => (
          <path key={s} d={smoothPath(G.lung.map((q) => sideP(q, s)), true, 0.3)} fill="none" stroke="#ffd29a" strokeWidth={3.4} />
        ))}
      </Part>
      <Part id="errai-pleura" show={pleuraNamed}>
        {both((s) => (
          <path key={s} d={smoothPath(G.lung.map((q) => sideP(q, s)), true, 0.3)} fill="none" stroke="#9fd0ff" strokeWidth={3.4} />
        ))}
      </Part>

      {/* Pleuropericardial membranes, carrying the phrenic nerve and the common cardinal vein. */}
      <Part id="mintz-pleuroperikardikoak" show={memShow * (1 - periNamed)}>
        {both((s) => (
          <Membrane key={s} pts={G.mem.map((q) => sideP(q, s))} core={P.mesench} show={1} />
        ))}
      </Part>
      <Part id="perikardio-fibrosoa" show={periNamed}>
        {both((s) => (
          <Membrane key={s} pts={G.mem.map((q) => sideP(q, s))} core={memCore} show={1} />
        ))}
      </Part>
      <Part id="perikardio-serosoa" show={periNamed}>
        <path d={smoothPath(inset(resample(G.peri, 120), 9), true, 0.3)} fill="none" stroke="#ffb3c4" strokeWidth={2.6} />
        <path d={heartD(heartS * 1.02)} fill="none" stroke="#ffb3c4" strokeWidth={2.6} />
      </Part>
      <Part id="nerbio-frenikoa" show={memShow}>
        {both((s) => {
          const q = sideP(nerve, s);
          return <circle key={s} cx={q[0]} cy={q[1]} r={5.5} fill={P.nerve} stroke="#8a6d00" strokeWidth={1} />;
        })}
      </Part>
      <Part id="bena-kardinal-komuna" show={memShow}>
        {both((s) => {
          const q = sideP(vein, s);
          return <ellipse key={s} cx={q[0]} cy={q[1]} rx={7} ry={5.5} fill={P.ivc} stroke="#1c3c88" strokeWidth={1} />;
        })}
      </Part>

      <path d={poly(BODY)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={500} y={612} tone="accent" show={vis(t, 0, 0.24)}>
        Hasierako perikardio barrunbea: torax osoa · bihotza aurrean, hestegorria atzean
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.24, 0.36)}>
        Birika hastapenak atze-alboetan sartzen dira, errai orria aurretik bultzatuz
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.36, 0.48)}>
        5. astea: alboko paretetatik mintz pleuroperikardikoak (3 geruza)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.48, 0.6)}>
        Erdirantz: elkarren artean eta hestegorri inguruko mesenkimarekin fusionatzen dira
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.6, 0.72)}>
        Birikak hazi ahala, mintzen oinaldeak aurrerantz eta alborantz
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.72, 0.84)}>
        Pleura barrunbe bakoitza: paretako pleura + errai pleura
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.84, 0.93)}>
        Mintzaren mesenkima → perikardio fibrosoa · somatopleura → perikardio serosoa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.93)}>
        Espazio birtualak: orriak elkarren ondoan, tartean espaziorik gabe
      </Note>

      {/* Left gutter: the lung side and the membrane. */}
      <Label id="errai-orria" x={190} y={150} ax={sideP(along(G.lung, 0.3), 1)[0]} ay={sideP(along(G.lung, 0.3), 1)[1]} show={1 - pleuraNamed} small />
      <Label id="errai-pleura" x={190} y={150} ax={sideP(along(G.lung, 0.3), 1)[0]} ay={sideP(along(G.lung, 0.3), 1)[1]} show={pleuraNamed} small />
      <Label id="birika-hastapenak" x={190} y={200} ax={sideP(along(G.lung, 0.62), 1)[0] + 6} ay={sideP(along(G.lung, 0.62), 1)[1]} show={1 - G.d} />
      <Label id="birikak" x={190} y={200} ax={sideP(along(G.lung, 0.62), 1)[0] + 10} ay={sideP(along(G.lung, 0.62), 1)[1]} show={G.d} />
      <Label id="mintz-pleuroperikardikoak" x={190} y={260} ax={along(G.mem, 0.62)[0]} ay={along(G.mem, 0.62)[1]} show={memShow * (1 - periNamed)} small />
      <Label id="perikardio-fibrosoa" x={190} y={260} ax={along(G.mem, 0.62)[0]} ay={along(G.mem, 0.62)[1]} show={periNamed} />
      <Label id="nerbio-frenikoa" x={190} y={360} ax={nerve[0]} ay={nerve[1]} show={memShow} />
      <Label id="bena-kardinal-komuna" x={190} y={400} ax={vein[0]} ay={vein[1]} show={memShow} small />
      <Label id="pleura-barrunbea" x={190} y={450} ax={286} ay={456} show={fused} />
      <Label id="paretako-pleura" x={190} y={500} ax={300} ay={494} show={pleuraNamed} />

      {/* Right gutter: midline and the pericardial side. */}
      <Label id="aorta" x={810} y={128} ax={AORTA[0] + 12} ay={AORTA[1] - 4} small />
      <Label id="hestegorria" x={810} y={176} ax={ESO[0] + 12} ay={ESO[1] - 6} />
      <Label id="hestegorri-inguruko-mesenkima" x={780} y={250} ax={540} ay={300} small />
      <Label id="hasierako-perikardio-barrunbea" x={776} y={380} ax={580} ay={386} show={1 - fused} small />
      <Label id="perikardio-barrunbea" x={810} y={380} ax={556} ay={386} show={fused} />
      <Label id="bihotza" x={810} y={440} ax={HEART[0] + 40} ay={HEART[1]} />
      <Label id="perikardio-serosoa" x={810} y={500} ax={HEART[0] + 56} ay={HEART[1] + 26} show={periNamed} />
    </g>
  );
}

// ——— The respiratory outgrowth: side view (from the ventral wall) and front view (the two buds) ———

function tube(c: Pt[], hw: (u: number) => number) {
  const n = c.length;
  const a = offset(c, (i) => hw(i / (n - 1)));
  const b = offset(c, (i) => -hw(i / (n - 1)));
  return smoothPath([...a, ...b.reverse()], true, 0.3);
}

/** Foregut width along its length: wide pharynx, narrow oesophagus, the stomach's swelling. */
const fgWidth = (u: number) => (u < 0.2 ? lerp(46, 16, u / 0.2) : u > 0.82 ? lerp(16, 38, (u - 0.82) / 0.18) : 16);
const SIDE_X = 380;
const FRONT_X = 650;
const SIDE_GUT = spline([[SIDE_X + 6, 70], [SIDE_X, 200], [SIDE_X, 380], [SIDE_X + 4, 470], [SIDE_X + 18, 560]], 10);
const FRONT_GUT = spline([[FRONT_X, 70], [FRONT_X, 200], [FRONT_X, 380], [FRONT_X, 470], [FRONT_X + 10, 560]], 10);
const OUT_Y = 206;

function Foregut({ c }: { c: Pt[] }) {
  return (
    <>
      <path d={tube(c, fgWidth)} fill="#8a6a2c" stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
      <path d={tube(c, (u) => fgWidth(u) * 0.42)} fill="#4a3712" opacity={0.7} />
      <path d={tube(c, fgWidth)} fill="url(#w7-light)" />
    </>
  );
}

export function LungBudFront({ t }: SceneProps) {
  const e = seg(t, 0.1, 0.17);
  const b = seg(t, 0.16, 0.23);
  const later = seg(t, 0.24, 0.6);
  const len = lerp(10, 150, e);
  const coat = 11;
  const grow = b * lerp(1, 1.3, later);

  // Side view: the outgrowth leaves the ventral (left) wall and runs down in front of the oesophagus.
  const sTop: Pt = [SIDE_X - 16, OUT_Y];
  const sTip: Pt = [SIDE_X - 46, OUT_Y + 14 + len];
  const sideTube = spline([sTop, [SIDE_X - 40, OUT_Y + 12], [SIDE_X - 46, OUT_Y + 14 + len * 0.5], sTip], 8);
  const sBud = 10 + 16 * grow;

  // Front view: trachea in front of the oesophagus, splitting at its tip into the right and left buds.
  const fTop: Pt = [FRONT_X, OUT_Y];
  const fork: Pt = [FRONT_X, OUT_Y + 14 + len];
  const trachea = spline([fTop, [FRONT_X, (OUT_Y + fork[1]) / 2], fork], 10);
  // Embryo's right (viewer's left) bud runs more vertically than the left.
  const budR = spline([fork, [fork[0] - 22 * grow, fork[1] + 34 * grow], [fork[0] - 62 * grow, fork[1] + 102 * grow]], 10);
  const budL = spline([fork, [fork[0] + 30 * grow, fork[1] + 28 * grow], [fork[0] + 84 * grow, fork[1] + 86 * grow]], 10);
  const end = (c: Pt[]) => c[c.length - 1];

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Note x={SIDE_X - 10} y={40} tone="accent">
        Albotik
      </Note>
      <Note x={FRONT_X} y={40} tone="accent">
        Aurretik
      </Note>
      <Note x={SIDE_X - 74} y={92} size={11}>
        bentrala
      </Note>
      <Note x={SIDE_X + 64} y={92} size={11}>
        dortsala
      </Note>
      <Note x={FRONT_X - 104} y={92} size={11}>
        eskuina
      </Note>
      <Note x={FRONT_X + 104} y={92} size={11}>
        ezkerra
      </Note>
      <path d="M515,60L515,580" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      <Part id="aurreko-hestea">
        <Foregut c={SIDE_GUT} />
        <g opacity={0.55}>
          <Foregut c={FRONT_GUT} />
        </g>
      </Part>

      {/* Splanchnic mesoderm round the outgrowth: pushed ahead by the buds, later the visceral pleura. */}
      <Part id="errai-orria">
        <path d={tube(sideTube, (u) => 12 + coat + (u > 0.8 ? (sBud - 12) * (u - 0.8) * 5 : 0))} fill="#e39a8c" opacity={0.45} />
        <path d={tube(trachea, () => 12 + coat)} fill="#e39a8c" opacity={0.45} />
        {b > 0.02 && (
          <>
            <path d={tube(budR, (u) => 11 + coat + 13 * u * b)} fill="#e39a8c" opacity={0.45} />
            <path d={tube(budL, (u) => 11 + coat + 13 * u * b)} fill="#e39a8c" opacity={0.45} />
          </>
        )}
      </Part>

      {/* Where it starts: the endodermal outpouching of the ventral wall. */}
      <Part id="arnas-hastapena">
        <ellipse cx={sTop[0] - 2} cy={sTop[1] + 2} rx={12} ry={14} fill={P.gut} stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
        <ellipse cx={fTop[0]} cy={fTop[1]} rx={18} ry={11} fill={P.gut} stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
      </Part>
      <Part id="hodi-laringotrakeala" show={seg(e, 0.2, 0.6)}>
        <path d={tube(sideTube, () => 11)} fill={P.gut} stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
        <path d={tube(sideTube, () => 4)} fill="#4a3712" opacity={0.6} />
        <path d={tube(trachea, () => 12)} fill={P.gut} stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
        <path d={tube(trachea, () => 4.5)} fill="#4a3712" opacity={0.6} />
      </Part>
      <Part id="birika-hastapenak" show={b > 0.02 ? 1 : 0}>
        <circle cx={sTip[0]} cy={sTip[1]} r={sBud} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.2} />
        <circle cx={sTip[0]} cy={sTip[1]} r={sBud} fill="url(#w7-lung)" />
        {[budR, budL].map((c, i) => (
          <g key={i}>
            <path d={tube(c, (u) => 10 + 12 * u * b)} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.2} />
            <circle cx={end(c)[0]} cy={end(c)[1]} r={14 + 12 * b} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.2} />
            <circle cx={end(c)[0]} cy={end(c)[1]} r={14 + 12 * b} fill="url(#w7-lung)" />
          </g>
        ))}
      </Part>

      <Note x={500} y={606} tone="accent" show={vis(t, 0, 0.14)}>
        Aurreko hestearen aurreko paretan ebaginazio endodermikoa: arnas hastapena
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.14, 0.2)}>
        Luzatzen da: hurbileko atala, hodi laringotrakeala
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.2)}>
        Erpinetik bi birika hastapen (eskuinekoa eta ezkerrekoa): behera, alborantz eta aurrera
      </Note>

      <Label id="arnas-hastapena" x={190} y={200} ax={sTop[0] - 12} ay={sTop[1]} />
      <Label id="hodi-laringotrakeala" x={190} y={290} ax={SIDE_X - 56} ay={OUT_Y + 14 + len * 0.5} show={seg(e, 0.3, 0.7)} />
      <Label id="errai-orria" x={190} y={360} ax={SIDE_X - 46 - 12 - coat + 4} ay={OUT_Y + 14 + len * 0.7} small />
      <Label id="aurreko-hestea" x={810} y={130} ax={FRONT_X + 22} ay={130} />
      <Label id="birika-hastapenak" x={810} y={470} ax={end(budL)[0] + 14} ay={end(budL)[1]} show={seg(b, 0.2, 0.5)} />
    </g>
  );
}
