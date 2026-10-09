'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Serosa, Sheet, f1, morph, offset, poly, resample, sm, spline, vis } from './common';

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

/** Outline of the ventricles cut across: a rounded oval with the interventricular groove underneath. */
function heartPts(s: number): Pt[] {
  const [x, y] = HEART;
  return Array.from({ length: 36 }, (_, k) => {
    const a = (k / 36) * Math.PI * 2;
    const groove = 7 * Math.exp(-((a - 1.75) ** 2) / 0.02) + 4 * Math.exp(-((a - 4.6) ** 2) / 0.03);
    const r = 1 - groove / 60;
    return [x + Math.cos(a) * 66 * s * r, y + 4 * s + Math.sin(a) * 54 * s * r] as Pt;
  });
}
function heartD(s: number) {
  return smoothPath(heartPts(s), true, 0.3);
}

/** The ventricles in cross-section: thin-walled right ventricle (a crescent), thick left ventricle, the muscular septum, trabeculae; beating. */
function HeartShape({ s = 1, beating }: { s?: number; beating: boolean }) {
  const [x, y] = HEART;
  const d = heartD(s);
  const lv = { cx: x + 18 * s, cy: y + 6 * s, rx: 24 * s, ry: 28 * s };
  const rv = `M${f1(x - 6 * s)},${f1(y - 30 * s)} C${f1(x - 40 * s)},${f1(y - 36 * s)} ${f1(x - 58 * s)},${f1(y - 6 * s)} ${f1(x - 48 * s)},${f1(y + 22 * s)} C${f1(x - 40 * s)},${f1(y + 40 * s)} ${f1(x - 18 * s)},${f1(y + 42 * s)} ${f1(x - 10 * s)},${f1(y + 32 * s)} C${f1(x - 22 * s)},${f1(y + 10 * s)} ${f1(x - 22 * s)},${f1(y - 14 * s)} ${f1(x - 6 * s)},${f1(y - 30 * s)}Z`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        {beating && <animateTransform attributeName="transform" type="scale" values="1;1.045;0.985;1" keyTimes="0;0.18;0.45;1" dur="0.9s" repeatCount="indefinite" />}
        <g transform={`translate(${-x} ${-y})`}>
          <path d={d} fill="url(#w7-th-myo)" stroke={P.heartDeep} strokeWidth={1.6} />
          {/* Blood in the two ventricles. */}
          <path d={rv} fill="#4a0a16" opacity={0.75} />
          <ellipse cx={lv.cx} cy={lv.cy} rx={lv.rx} ry={lv.ry} fill="#4a0a16" opacity={0.75} />
          {/* Trabeculae along the inner walls. */}
          <g stroke="#e8586e" strokeWidth={1.3} strokeLinecap="round" opacity={0.6}>
            {Array.from({ length: 10 }, (_, k) => {
              const a = (k / 10) * Math.PI * 2;
              return <line key={k} x1={f1(lv.cx + Math.cos(a) * lv.rx)} y1={f1(lv.cy + Math.sin(a) * lv.ry)} x2={f1(lv.cx + Math.cos(a) * (lv.rx - 6 * s))} y2={f1(lv.cy + Math.sin(a) * (lv.ry - 6 * s))} />;
            })}
          </g>
          <path d={`M${f1(x - 44 * s)},${f1(y + 12 * s)} l${f1(7 * s)},${f1(-3 * s)} M${f1(x - 40 * s)},${f1(y - 12 * s)} l${f1(7 * s)},${f1(2 * s)} M${f1(x - 26 * s)},${f1(y + 32 * s)} l${f1(4 * s)},${f1(-6 * s)}`} stroke="#e8586e" strokeWidth={1.3} strokeLinecap="round" opacity={0.6} />
          <ellipse cx={x - 26 * s} cy={y - 24 * s} rx={16 * s} ry={9 * s} fill="#fff" opacity={0.1} />
        </g>
      </g>
    </g>
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

/**
 * The textbook comparison, small in the corner: a fist pushed into a soft balloon. The balloon's wall
 * folds round the fist (inner layer = visceral pleura) and goes on as the outer wall (parietal pleura);
 * between them only the balloon's thin inside (the pleural cavity).
 */
function Balloon({ t }: { t: number }) {
  const show = vis(t, 0.745, 0.84);
  if (show <= 0.01) return null;
  const p = sm(seg(t, 0.75, 0.79));
  const cx = 70;
  const cy = 552;
  const R = 40;
  const depth = lerp(0, 46, p);
  const fr = 15;
  const fy = cy + R - depth + fr * 0.2;
  const gap = 6;
  const wr = fr + gap;
  // Where the inner layer meets the outer wall (the wrist; for the lung, its root).
  const a0 = Math.asin(Math.min(0.99, wr / R));
  const bx = (sgn: number) => cx + sgn * R * Math.sin(a0);
  const by = cy + R * Math.cos(a0);
  const outer = `M${f1(bx(-1))},${f1(by)} A${R},${R} 0 1 1 ${f1(bx(1))},${f1(by)}`;
  const iy = Math.min(fy, by);
  const inner = ` L${f1(cx + wr)},${f1(by)} L${f1(cx + wr)},${f1(iy)} A${wr},${wr} 0 0 0 ${f1(cx - wr)},${f1(iy)} L${f1(cx - wr)},${f1(by)} Z`;
  const fist = `M${f1(cx - fr)},${f1(fy)} A${fr},${fr} 0 1 1 ${f1(cx + fr)},${f1(fy)} L${f1(cx + fr - 2)},${cy + R + 22} L${f1(cx - fr + 2)},${cy + R + 22} Z`;
  return (
    <g opacity={show} pointerEvents="none">
      <path d={outer + inner} fill="rgba(110,180,255,0.3)" stroke="#9fd0ff" strokeWidth={2.6} strokeLinejoin="round" />
      <path d={fist} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.4} />
      <path d={`M${f1(cx - fr + 5)},${f1(fy - 4)}h${2 * fr - 10}M${f1(cx - fr + 4)},${f1(fy + 3)}h${2 * fr - 8}`} stroke={P.lungDeep} strokeWidth={1.2} opacity={0.8} />
      <text x={124} y={528} fontSize={15.5} fontWeight={700} fill="#ffb067">
        Ukabila puxikan sakatuta
      </text>
      <g fontSize={14} fill="rgba(232,238,252,0.94)" opacity={sm(seg(t, 0.77, 0.79))}>
        <text x={124} y={547}>
          ukabila → birika
        </text>
        <text x={124} y={564}>
          barneko orria → errai pleura
        </text>
        <text x={124} y={581}>
          kanpoko orria → paretako pleura
        </text>
        <text x={124} y={598}>
          tartea → pleura barrunbea
        </text>
      </g>
    </g>
  );
}

/** The side of the mediastinal mesenchyme that faces the cavity (lateral and ventral), lined by the splanchnic layer. */
const MEDIA_FACE = [...MEDIA.slice(16), MEDIA[0]];

/**
 * One pleura, traced as the single sheet it is (a fist pushed into a balloon): round the lung (visceral
 * layer) from its root, back to the root, where it turns and lines the whole cavity (parietal layer).
 */
function sheet(G: Geo): Pt[] {
  const lung = resample(G.lung, 120);
  const wall = resample(G.pleura, 220);
  const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let hi = 0;
  lung.forEach((q, i) => {
    if (d(q, [500, 288]) < d(lung[hi], [500, 288])) hi = i;
  });
  let pj = 0;
  wall.forEach((q, j) => {
    if (d(q, lung[hi]) < d(wall[pj], lung[hi])) pj = j;
  });
  return [...lung.slice(hi), ...lung.slice(0, hi + 1), ...wall.slice(pj), ...wall.slice(0, pj + 1)];
}

export function ThoraxSection({ t, reduced }: SceneProps) {
  const G = thorax(t);
  const both = <T,>(f: (side: 1 | -1) => T) => [f(1), f(-1)];
  const sideP = (q: Pt, s: 1 | -1): Pt => (s > 0 ? q : mirror(q));
  const fused = seg(t, 0.53, 0.555);
  const pleuraNamed = seg(t, 0.72, 0.76);
  const periNamed = seg(t, 0.84, 0.88);
  const memShow = G.m;
  const memCore = periNamed > 0.5 ? '#d9c7a4' : P.mesench;
  const nerve = along(G.mem, 0.12);
  const vein = along(G.mem, 0.34);
  const heartS = lerp(1, 1.1, G.virt);
  // The pleural cavity's name points into it wherever it is: between the wall and the lung, a little dorsal of the membrane's base.
  const wallQ = wallAt(lerp(lerp(0.46, 0.105, G.d), 1, 0.3));
  const lungQ = G.lung.reduce((a, q) => (Math.hypot(q[0] - wallQ[0], q[1] - wallQ[1]) < Math.hypot(a[0] - wallQ[0], a[1] - wallQ[1]) ? q : a));
  const pleuraAt: Pt = [lerp(wallQ[0], lungQ[0], 0.45), lerp(wallQ[1], lungQ[1], 0.45)];
  const serosaAt = heartPts(heartS * 1.02)[3];
  // The middle of the right lung (bud or lobe): an edge point would land on its coat or the tissue round it.
  const lungMid = G.lung.map((q) => sideP(q, 1)).reduce<Pt>((a, q, _, all) => [a[0] + q[0] / all.length, a[1] + q[1] / all.length], [0, 0]);
  // Cavity tints: one primitive pericardial cavity, then two pleural + one pericardial.
  const periTint = poly(G.peri);
  const pleuraTint = `${poly(G.pleura)}${poly(G.pleura.map(mirror))}`;
  const gap = 1 - 0.75 * G.virt;
  const trace = seg(t, 0.745, 0.82);
  const sheetShow = vis(t, 0.74, 0.84);
  const sheetPts = sheetShow > 0.01 ? sheet(G) : [];

  return (
    <g>
      <Defs7 />
      <defs>
        <radialGradient id="w7-th-myo" cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ec6378" />
          <stop offset="0.6" stopColor="#c62d42" />
          <stop offset="1" stopColor="#7d1527" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Part id="gorputz-pareta" quiet>
        <path d={poly(BODY)} fill={P.wall} />
        <path d={poly(BODY)} fill="url(#w7-mesench)" />
      </Part>
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
      {/* Under the tints: what the tints leave uncovered is still the cavity (the pleural parts once split). */}
      <Part id={fused > 0.5 ? 'pleura-barrunbea' : 'hasierako-perikardio-barrunbea'}>
        <path d={poly(WALL)} fill={P.space} />
      </Part>
      <Part id="hasierako-perikardio-barrunbea" show={1 - fused}>
        <path d={poly(WALL)} fill={P.peri} opacity={gap * 0.6} />
      </Part>
      <Part id="pleura-barrunbea" show={fused}>
        <path d={pleuraTint} fill={P.pleura} opacity={gap * 0.6} />
      </Part>
      <Part id="perikardio-barrunbea" show={fused}>
        <path d={periTint} fill={P.peri} opacity={gap * 0.6} />
      </Part>
      {/* The cavity's lining (mesothelium): a fine bright edge, so the wall and the space read apart. */}
      <path d={poly(WALL)} fill="none" stroke="rgba(255,200,190,0.4)" strokeWidth={1.6} pointerEvents="none" />

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
        <HeartShape s={heartS} beating={!reduced} />
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
        {/* The splanchnic layer lines the mediastinum; the buds push it ahead of them as their coat. */}
        <path d={poly(MEDIA_FACE, false)} fill="none" stroke="#ffd29a" strokeWidth={3} opacity={0.85} />
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
      <Part id="bena-kardinal-komuna" show={memShow}>
        {both((s) => {
          const q = sideP(vein, s);
          return <ellipse key={s} cx={q[0]} cy={q[1]} rx={7} ry={5.5} fill={P.ivc} stroke="#1c3c88" strokeWidth={1} />;
        })}
      </Part>
      <Part id="nerbio-frenikoa" show={memShow}>
        {both((s) => {
          const q = sideP(nerve, s);
          return <circle key={s} cx={q[0]} cy={q[1]} r={5.5} fill={P.nerve} stroke="#8a6d00" strokeWidth={1} />;
        })}
      </Part>

      {/* The two layers are one sheet: traced from the lung round its root onto the cavity wall. */}
      {sheetShow > 0.01 && (
        <g opacity={sheetShow} pointerEvents="none">
          {both((s) => {
            const pts = sheetPts.map((q) => sideP(q, s));
            const head = pts[Math.min(pts.length - 1, Math.round(trace * (pts.length - 1)))];
            return (
              <g key={s}>
                <path d={poly(pts, false)} fill="none" stroke="#ffd166" strokeWidth={9} strokeLinejoin="round" opacity={0.3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - trace} />
                <path d={poly(pts, false)} fill="none" stroke="#ffd166" strokeWidth={3.4} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - trace} />
                {trace < 0.995 && <circle cx={f1(head[0])} cy={f1(head[1])} r={6.5} fill="#ffffff" stroke="#ffd166" strokeWidth={2.5} />}
              </g>
            );
          })}
        </g>
      )}

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
      <Balloon t={t} />
      <Note x={500} y={612} tone="accent" show={vis(t, 0.84, 0.93)}>
        Mintzaren mesenkima → perikardio fibrosoa · somatopleura → perikardio serosoa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.93)}>
        Espazio birtualak: orriak elkarren ondoan, tartean espaziorik gabe
      </Note>

      {/* Left gutter: the lung side and the membrane. */}
      <Label id="errai-orria" x={190} y={150} ax={sideP(along(G.lung, 0.3), 1)[0]} ay={sideP(along(G.lung, 0.3), 1)[1]} show={1 - pleuraNamed} small />
      <Label id="errai-pleura" x={190} y={150} ax={sideP(along(G.lung, 0.3), 1)[0]} ay={sideP(along(G.lung, 0.3), 1)[1]} show={pleuraNamed} small />
      <Label id="birika-hastapenak" x={190} y={200} ax={lungMid[0]} ay={lungMid[1]} show={1 - G.d} />
      <Label id="birikak" x={190} y={200} ax={lungMid[0]} ay={lungMid[1]} show={G.d} />
      <Label id="mintz-pleuroperikardikoak" x={190} y={260} ax={along(G.mem, 0.62)[0]} ay={along(G.mem, 0.62)[1]} show={memShow * (1 - periNamed)} small />
      <Label id="perikardio-fibrosoa" x={190} y={260} ax={along(G.mem, 0.62)[0]} ay={along(G.mem, 0.62)[1]} show={periNamed} />
      <Label id="nerbio-frenikoa" x={190} y={360} ax={nerve[0]} ay={nerve[1]} show={memShow} />
      <Label id="bena-kardinal-komuna" x={190} y={400} ax={vein[0]} ay={vein[1]} show={memShow} small />
      <Label id="pleura-barrunbea" x={190} y={450} ax={pleuraAt[0]} ay={pleuraAt[1]} show={fused} />
      <Label id="paretako-pleura" x={190} y={492} ax={307} ay={487} show={pleuraNamed} />

      {/* Right gutter: midline and the pericardial side. */}
      <Label id="hodi-neurala" x={810} y={84} ax={526} ay={100} small />
      <Label id="aorta" x={810} y={128} ax={AORTA[0] + 12} ay={AORTA[1] - 4} small />
      <Label id="hestegorria" x={810} y={176} ax={ESO[0] + 12} ay={ESO[1] - 6} />
      <Label id="hestegorri-inguruko-mesenkima" x={780} y={250} ax={540} ay={300} small />
      <Label id="hasierako-perikardio-barrunbea" x={776} y={380} ax={580} ay={386} show={1 - fused} small />
      <Label id="perikardio-barrunbea" x={810} y={380} ax={553} ay={400} show={fused} />
      <Label id="bihotza" x={810} y={440} ax={HEART[0] + 40} ay={HEART[1]} />
      <Label id="perikardio-serosoa" x={810} y={500} ax={serosaAt[0]} ay={serosaAt[1]} show={periNamed} />
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
const fgWidth = (u: number) => (u < 0.2 ? lerp(54, 19, u / 0.2) : u > 0.82 ? lerp(19, 46, (u - 0.82) / 0.18) : 19);
const SIDE_X = 360;
const FRONT_X = 680;
const SIDE_GUT = spline([[SIDE_X + 6, 64], [SIDE_X, 200], [SIDE_X, 380], [SIDE_X + 4, 470], [SIDE_X + 20, 570]], 10);
const FRONT_GUT = spline([[FRONT_X, 64], [FRONT_X, 200], [FRONT_X, 380], [FRONT_X, 470], [FRONT_X + 12, 570]], 10);
const OUT_Y = 196;
/** Half-width of the oesophagus (side view). */
const ESO_HW = 19;

function Foregut({ c }: { c: Pt[] }) {
  return (
    <>
      <path d={tube(c, fgWidth)} fill="#8a6a2c" stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
      <path d={tube(c, (u) => fgWidth(u) - 7)} fill={P.gut} opacity={0.55} />
      <path d={tube(c, (u) => fgWidth(u) * 0.4)} fill="#3a2a0e" opacity={0.8} />
      <path d={tube(c, fgWidth)} fill="url(#w7-light)" />
    </>
  );
}

/** An endodermal tube (epithelium round a lumen). */
function Endo({ c, hw, lumen = 0.42 }: { c: Pt[]; hw: (u: number) => number; lumen?: number }) {
  return (
    <>
      <path d={tube(c, hw)} fill={P.gut} stroke="rgba(90,60,10,0.75)" strokeWidth={1.2} />
      <path d={tube(c, (u) => hw(u) * lumen)} fill="#3a2a0e" opacity={0.75} />
      <path d={tube(c, hw)} fill="url(#w7-light)" />
    </>
  );
}

/** Half-width of the front view's body at height y: neck with the arches, then the chest widening. */
const frontHalf = (y: number) => (y < 180 ? 98 - 10 * gaussY(y - 180, 40) : lerp(98, 150, Math.min(1, (y - 180) / 220)));
const gaussY = (d: number, w: number) => Math.exp(-(d * d) / (2 * w * w));
const SIDE_BODY: Pt[] = spline(
  [[300, 40], [284, 90], [288, 130], [280, 172], [252, 212], [214, 256], [202, 304], [214, 352], [236, 392], [226, 440], [216, 480], [226, 530], [244, 572], [250, 610], [496, 610], [494, 420], [492, 220], [484, 110], [470, 40]],
  8,
);
const FRONT_BODY: Pt[] = (() => {
  const ys = Array.from({ length: 29 }, (_, k) => 40 + k * 20);
  return [...ys.map((y) => [FRONT_X + frontHalf(y), y] as Pt), ...[...ys].reverse().map((y) => [FRONT_X - frontHalf(y), y] as Pt)];
})();
/** The two pericardioperitoneal canals beside the foregut, where the buds grow. */
const CANALS: { c: Pt; rx: number; ry: number }[] = [
  { c: [FRONT_X - 76, 486], rx: 52, ry: 118 },
  { c: [FRONT_X + 84, 476], rx: 54, ry: 116 },
];

/**
 * Where the outgrowth is: a faint embryo round both views. Side view: the pharyngeal arches and the heart
 * in front, the notochord and neural tube behind, the septum transversum and liver below the heart.
 * Front view: the neck with its arches and the chest with the two canals the buds grow into.
 */
function BudContext() {
  const sideD = smoothPath(SIDE_BODY, true, 0.3);
  const frontD = smoothPath(FRONT_BODY, true, 0.3);
  return (
    <g>
      <defs>
        <linearGradient id="w7-bud-fade" x1="0" y1="40" x2="0" y2="610" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={P.wall} stopOpacity={0} />
          <stop offset="0.12" stopColor={P.wall} stopOpacity={0.55} />
          <stop offset="0.86" stopColor={P.wall} stopOpacity={0.55} />
          <stop offset="1" stopColor={P.wall} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="w7-bud-edge" x1="0" y1="40" x2="0" y2="610" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c99aa8" stopOpacity={0} />
          <stop offset="0.12" stopColor="#c99aa8" stopOpacity={0.55} />
          <stop offset="0.86" stopColor="#c99aa8" stopOpacity={0.55} />
          <stop offset="1" stopColor="#c99aa8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Part id="gorputz-pareta" quiet>
        {[sideD, frontD].map((d, i) => (
          <g key={i}>
            <path d={d} fill="url(#w7-bud-fade)" />
            <path d={d} fill="url(#w7-mesench)" opacity={0.5} />
            <path d={d} fill="none" stroke="url(#w7-bud-edge)" strokeWidth={2} />
          </g>
        ))}
      </Part>

      {/* Side view, behind the gut: notochord and neural tube. */}
      <Part id="notokorda" quiet>
        <rect x={407} y={150} width={9} height={440} rx={4.5} fill="#9fb4d8" opacity={0.75} />
      </Part>
      <Part id="hodi-neurala" quiet>
        <rect x={436} y={56} width={30} height={540} rx={15} fill={P.neural} opacity={0.7} />
        <rect x={449} y={60} width={4} height={530} rx={2} fill="#0c1428" opacity={0.8} />
      </Part>
      {/* In front: the arches under the pharynx, the heart, the septum transversum and the liver below it. */}
      <Part id="faringe-arkuak" quiet>
        {[0, 1, 2].map((k) => {
          const y = 92 + k * 32;
          return (
            <g key={k}>
              <path d={`M${SIDE_X - 46 + k * 6},${y} Q${SIDE_X - 62},${y + 12} ${292 + k * 2},${y + 10}`} fill="none" stroke="#5a2c36" strokeWidth={15 - k * 2} strokeLinecap="round" />
              <path d={`M${SIDE_X - 46 + k * 6},${y} Q${SIDE_X - 62},${y + 12} ${292 + k * 2},${y + 10}`} fill="none" stroke="#dd9e90" strokeWidth={11 - k * 2} strokeLinecap="round" opacity={0.8} />
              {[-1, 1].map((sd) => {
                const d = `M${FRONT_X + sd * 48},${y + 2} Q${FRONT_X + sd * 70},${y - 6} ${FRONT_X + sd * (88 - k * 4)},${y + 6}`;
                return (
                  <g key={sd}>
                    <path d={d} fill="none" stroke="#5a2c36" strokeWidth={15 - k * 2} strokeLinecap="round" opacity={0.7} />
                    <path d={d} fill="none" stroke="#dd9e90" strokeWidth={11 - k * 2} strokeLinecap="round" opacity={0.6} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </Part>
      <Part id="bihotza" quiet>
        <g opacity={0.85}>
          <path d="M262,236 C246,214 262,190 284,184" fill="none" stroke={P.heartDeep} strokeWidth={20} strokeLinecap="round" />
          <path d="M262,236 C246,214 262,190 284,184" fill="none" stroke="#d23a52" strokeWidth={15} strokeLinecap="round" />
          <circle cx={274} cy={262} r={20} fill="#7d1527" stroke={P.heartDeep} strokeWidth={2} />
          <ellipse cx={244} cy={304} rx={30} ry={42} fill={P.heart} stroke={P.heartDeep} strokeWidth={2.4} />
          <path d="M228,282 C224,300 230,320 244,332" fill="none" stroke="#ffd0d6" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
        </g>
      </Part>
      <Part id="septum-transversum" quiet>
        <path d="M222,412 C250,404 282,404 304,410 L304,436 C280,430 250,430 220,438 Z" fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} opacity={0.85} />
      </Part>
      <Part id="gibela" quiet>
        <ellipse cx={262} cy={486} rx={38} ry={34} fill="#8d3a34" stroke="#4d1714" strokeWidth={1.4} opacity={0.8} />
      </Part>

      {/* Front view: the canals on each side of the foregut. */}
      <Part id="erreten-perikardioperitonealak" quiet>
        {CANALS.map(({ c, rx, ry }, i) => (
          <ellipse key={i} cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={P.space} stroke={P.canal} strokeWidth={1.6} />
        ))}
        {CANALS.map(({ c, rx, ry }, i) => (
          <ellipse key={`f${i}`} cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={P.canal} opacity={0.5} />
        ))}
      </Part>
    </g>
  );
}

export function LungBudFront({ t }: SceneProps) {
  const e = seg(t, 0.1, 0.17);
  const b = seg(t, 0.16, 0.23);
  const later = seg(t, 0.24, 0.6);
  const lobes = seg(t, 0.26, 0.4);
  const len = lerp(8, 170, e);
  const grow = b * lerp(1, 1.25, later);
  // Side view: the outgrowth leaves the ventral (left) wall as an open groove, then a mesenchymal septum
  // separates it from the oesophagus from below upwards; only its top stays open into the pharynx.
  const zip = seg(t, 0.15, 0.225);
  const sep = (u: number) => Math.max(0, Math.min(1, (zip * 1.25 - (1 - u)) / 0.25)) * seg(u, 0.06, 0.18);
  const N = 24;
  const sidePts: Pt[] = Array.from({ length: N + 1 }, (_, k) => {
    const u = k / N;
    const off = lerp(ESO_HW + 9, ESO_HW + 36, sep(u)) + (u > 0.8 ? 4 * (u - 0.8) * 5 * b : 0);
    return [SIDE_X - off, OUT_Y + 6 + len * u];
  });
  const sideTube = spline(sidePts, 2);
  const sTip = sidePts[N];
  const sBud = 12 + 20 * grow;
  const septum: Pt[] = [];
  const back: Pt[] = [];
  sidePts.forEach((p, k) => {
    const sv = sep(k / N);
    if (sv < 0.04 || k === N) return;
    septum.push([p[0] + 13, p[1]]);
    back.push([SIDE_X - ESO_HW + 1, p[1]]);
  });

  // Front view: trachea in front of the oesophagus, splitting at its tip into the right and left buds.
  const fTop: Pt = [FRONT_X, OUT_Y];
  const fork: Pt = [FRONT_X, OUT_Y + 14 + len];
  const trachea = spline([fTop, [FRONT_X, (OUT_Y + fork[1]) / 2], fork], 10);
  // Embryo's right (viewer's left) bud runs more vertically and is larger than the left.
  const budR = spline([fork, [fork[0] - 24 * grow, fork[1] + 36 * grow], [fork[0] - 60 * grow, fork[1] + 108 * grow]], 10);
  const budL = spline([fork, [fork[0] + 32 * grow, fork[1] + 28 * grow], [fork[0] + 80 * grow, fork[1] + 86 * grow]], 10);
  const end = (c: Pt[]) => c[c.length - 1];
  const tipR = end(budR);
  const tipL = end(budL);
  const rBud = 16 + 16 * b;
  const lBud = 14 + 14 * b;

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <Note x={SIDE_X - 10} y={28} tone="accent">
        Albotik
      </Note>
      <Note x={FRONT_X} y={28} tone="accent">
        Aurretik
      </Note>
      <Note x={SIDE_X - 110} y={54} size={12.5}>
        bentrala
      </Note>
      <Note x={SIDE_X + 100} y={54} size={12.5}>
        dortsala
      </Note>
      <Note x={FRONT_X - 120} y={54} size={12.5}>
        eskuina
      </Note>
      <Note x={FRONT_X + 120} y={54} size={12.5}>
        ezkerra
      </Note>
      <path d="M512,60L512,580" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <BudContext />

      {/* Splanchnic mesoderm round the outgrowth: pushed ahead by the buds, later the visceral pleura. */}
      <Part id="errai-orria">
        <path d={tube(sideTube, (u) => 13 + 14 + (u > 0.8 ? (sBud - 13) * (u - 0.8) * 5 : 0))} fill="#e39a8c" opacity={0.32} />
        <path d={tube(sideTube, (u) => 13 + 14 + (u > 0.8 ? (sBud - 13) * (u - 0.8) * 5 : 0))} fill="url(#w7-mesench)" />
        <path d={tube(trachea, () => 13 + 14)} fill="#e39a8c" opacity={0.32} />
        {b > 0.02 && (
          <>
            {[budR, budL].map((c, i) => (
              <path key={i} d={tube(c, (u) => 13 + 14 + 16 * u * b)} fill="#e39a8c" opacity={0.32} />
            ))}
            <circle cx={tipR[0]} cy={tipR[1]} r={rBud + 16} fill="#e39a8c" opacity={0.32} />
            <circle cx={tipL[0]} cy={tipL[1]} r={lBud + 16} fill="#e39a8c" opacity={0.32} />
            <circle cx={tipR[0]} cy={tipR[1]} r={rBud + 16} fill="url(#w7-mesench)" />
            <circle cx={tipL[0]} cy={tipL[1]} r={lBud + 16} fill="url(#w7-mesench)" />
          </>
        )}
      </Part>

      <Part id="aurreko-hestea">
        <Foregut c={SIDE_GUT} />
        <g opacity={0.5}>
          <Foregut c={FRONT_GUT} />
        </g>
      </Part>

      {/* The mesenchyme that grows up between the two tubes and separates them (side view). */}
      {septum.length > 1 && (
        <g pointerEvents="none">
          <path d={poly([...septum, ...back.reverse()])} fill="#8a3f50" />
          <path d={poly([...septum, ...[...back].reverse().reverse()])} fill="url(#w7-mesench)" />
        </g>
      )}

      {/* Where it starts: the endodermal outpouching of the ventral wall. */}
      <Part id="arnas-hastapena">
        <ellipse cx={SIDE_X - ESO_HW - 6} cy={OUT_Y + 4} rx={14} ry={16} fill={P.gut} stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
        <ellipse cx={SIDE_X - ESO_HW - 4} cy={OUT_Y + 4} rx={5} ry={7} fill="#3a2a0e" opacity={0.75} />
        <ellipse cx={fTop[0]} cy={fTop[1]} rx={20} ry={12} fill={P.gut} stroke="rgba(90,60,10,0.7)" strokeWidth={1.2} />
      </Part>
      <Part id="hodi-laringotrakeala" show={seg(e, 0.2, 0.6)}>
        <Endo c={sideTube} hw={() => 13} />
        <Endo c={trachea} hw={() => 14} />
      </Part>
      <Part id="birika-hastapenak" show={b > 0.02 ? 1 : 0}>
        <circle cx={sTip[0]} cy={sTip[1]} r={sBud} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.4} />
        <circle cx={sTip[0]} cy={sTip[1]} r={sBud * 0.55} fill="#7a2a40" opacity={0.55} />
        <circle cx={sTip[0]} cy={sTip[1]} r={sBud} fill="url(#w7-light)" />
        {[budR, budL].map((c, i) => (
          <g key={i}>
            <path d={tube(c, (u) => 12 + 12 * u * b)} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.4} />
            <path d={tube(c, (u) => (12 + 12 * u * b) * 0.4)} fill="#7a2a40" opacity={0.55} />
          </g>
        ))}
        {[
          { c: budR, tip: tipR, r: rBud, side: -1, n: 3 },
          { c: budL, tip: tipL, r: lBud, side: 1, n: 2 },
        ].map(({ c, tip, r, side, n }, i) => {
          // Lobar buds: one from the stem's lateral side (upper lobe), the rest from the tip.
          const dx = tip[0] - fork[0];
          const dy = tip[1] - fork[1];
          const L = Math.hypot(dx, dy) || 1;
          const ux = dx / L;
          const uy = dy / L;
          const mid = c[Math.min(c.length - 1, Math.round(c.length * 0.55))];
          const at = (q: Pt, a: number, d: number): Pt => {
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            return [q[0] + (ux * ca - uy * sa) * d, q[1] + (ux * sa + uy * ca) * d];
          };
          const spots: Pt[] = [at(mid, -side * 1.45, 22 * b + 6), ...(n === 3 ? [at(tip, -side * 0.5, r * 1.05), at(tip, side * 0.6, r * 1.05)] : [at(tip, side * 0.35, r * 1.05)])];
          return (
            <g key={i}>
              {lobes > 0.01 &&
                spots.map((q, k) => (
                  <g key={k}>
                    <circle cx={f1(q[0])} cy={f1(q[1])} r={f1(r * 0.5 * lobes)} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.2} />
                    <circle cx={f1(q[0])} cy={f1(q[1])} r={f1(r * 0.24 * lobes)} fill="#7a2a40" opacity={0.55} />
                  </g>
                ))}
              <circle cx={tip[0]} cy={tip[1]} r={r} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.4} />
              <circle cx={tip[0]} cy={tip[1]} r={r * 0.55} fill="#7a2a40" opacity={0.55} />
              <circle cx={tip[0]} cy={tip[1]} r={r} fill="url(#w7-light)" />
            </g>
          );
        })}
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

      <Label id="arnas-hastapena" x={190} y={196} ax={SIDE_X - ESO_HW - 18} ay={OUT_Y + 2} />
      <Label id="hodi-laringotrakeala" x={190} y={292} ax={sidePts[12][0] - 12} ay={sidePts[12][1]} show={seg(e, 0.3, 0.7)} />
      {/* Before the outgrowth has length, the coat is only round the front view's tube. */}
      <Label id="errai-orria" x={190} y={372} ax={len < 40 ? FRONT_X - 22 : sidePts[18][0] - 24} ay={len < 40 ? OUT_Y + 12 : sidePts[18][1]} small />
      <Label id="aurreko-hestea" x={830} y={130} ax={FRONT_X + 24} ay={130} />
      <Note x={204} y={232} size={12} tone="dim">
        bihotza
      </Note>
      <Note x={262} y={490} size={12} tone="dim">
        gibela
      </Note>
      <Label id="erreten-perikardioperitonealak" x={790} y={588} ax={FRONT_X + 84 - 26} ay={584} small />
      <Label id="birika-hastapenak" x={830} y={470} ax={tipL[0] + lBud - 2} ay={tipL[1]} show={seg(b, 0.2, 0.5)} />
    </g>
  );
}
