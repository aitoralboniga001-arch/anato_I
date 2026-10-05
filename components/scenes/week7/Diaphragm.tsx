'use client';

import { Arrow, Label, Mark, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Sheet, f1, offset, poly, resample, spline, vis } from './common';

/**
 * 7:diafragma-eraketa — apunteen 3. atala eta 3.1en hasiera, 25.–26. orriko irudiak.
 *  - `jaitsiera` (albotik, bizkarrezurra eskuinean): septum transversuma C3–C5 mailan; haren mesenkiman
 *    mioblastoak → miozitoak; C3–C5 nerbio espinalen zuntzak iristen dira eta nerbio frenikoa osatzen dute;
 *    enbrioia atzetik gehiago hazten denez septuma jaisten da (aurrea T6, atzea T12) eta nerbioa luzatzen da.
 *  - `zeharkakoa` (diafragmaren mailako zeharkako mozketa, dortsala goian): erreten perikardioperitonealak
 *    zabalik; 5. astean mintz pleuroperitonealak atze-alboko paretetatik hazten dira eta hestegorri inguruko
 *    mesenkimarekin eta septumaren atzeko ertzarekin fusionatzen dira; gorputz paretako muskulua ertzean.
 */

// ——— Side view with the vertebral column as a ruler ———

const LEVELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3'];
const levelY = (name: string) => 70 + 22 * LEVELS.indexOf(name);
const VERT_X = 690;
const CORD_X = 738;
const FRONT_X = 300;
const BACK_X = 650;
const TRUNK = spline(
  [[330, 44], [520, 36], [700, 40], [764, 64], [776, 300], [766, 556], [706, 604], [520, 610], [340, 602], [288, 560], [262, 430], [258, 300], [272, 160], [296, 80]],
  8,
  true,
);
const CAVITY = spline([[310, 76], [520, 70], [652, 76], [656, 300], [652, 560], [520, 574], [330, 566], [298, 470], [294, 300], [300, 150]], 8, true);

/** The septum as a slab between the ventral wall (front) and the dorsal wall (back), each at its own level. */
function slab(front: number, back: number, h = 14): Pt[] {
  const top = spline([[FRONT_X - 4, front - h], [(FRONT_X + BACK_X) / 2, (front + back) / 2 - h - 4], [BACK_X + 4, back - h]], 10);
  const bot = spline([[FRONT_X - 4, front + h], [(FRONT_X + BACK_X) / 2, (front + back) / 2 + h - 4], [BACK_X + 4, back + h]], 10);
  return [...top, ...bot.reverse()];
}
const onSlab = (front: number, back: number, u: number, v: number, h = 14): Pt => {
  const x = lerp(FRONT_X, BACK_X, u);
  const mid = lerp(front, back, u) - 4 * Math.sin(Math.PI * u);
  return [x, mid + v * h];
};

/** Muscle precursors scattered in the septum: fixed positions (u along, v across). */
const CELLS: [number, number, number][] = Array.from({ length: 16 }, (_, i) => {
  const u = 0.1 + 0.8 * ((i * 0.618) % 1);
  const v = (((i * 0.383) % 1) - 0.5) * 1.1;
  return [u, v, (i * 37) % 360];
});

export function DiaphragmDescent({ t, reduced }: SceneProps) {
  const mb = seg(t, 0.14, 0.2);
  // Differentiation is gradual: half the myoblasts are myocytes by the end of the step, the rest follow.
  const mz = seg(t, 0.2, 0.23);
  const late = seg(t, 0.36, 0.42);
  const n = seg(t, 0.3, 0.4);
  const s = seg(t, 0.46, 0.58);
  const front = lerp(levelY('C4'), levelY('T6'), s);
  const back = lerp(levelY('C4'), levelY('T12'), s);
  const sep = slab(front, back);
  const split: Pt[] = [[0, front], [FRONT_X, front], [BACK_X, back], [1000, back]];
  const heart: Pt = [430, front - 62];
  // Spinal nerves C3–C5 leave the cord, join into the phrenic nerve, which enters the septum.
  const J: Pt = [630, lerp(118, 200, s)];
  const entry = onSlab(front, back, 0.6, -1);
  const roots = ['C3', 'C4', 'C5'].map((c) => {
    const y = levelY(c);
    return spline([[CORD_X - 8, y], [VERT_X - 24, y + 2], [(VERT_X - 24 + J[0]) / 2, (y + J[1]) / 2 + 3], J], 8);
  });
  const trunk = spline([J, [lerp(J[0], entry[0], 0.5) + 12, lerp(J[1], entry[1], 0.5)], entry], 12);
  const branches = [0.38, 0.6, 0.82].map((u) => [entry, onSlab(front, back, u, 0)] as const);
  const cut = (pts: Pt[], k: number) => resample(pts, 40).slice(0, Math.max(2, Math.round(40 * k)));
  const line = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id="w7-desc-up">
          <path d={poly([...split, [1000, 0], [0, 0]])} />
        </clipPath>
        <clipPath id="w7-desc-dn">
          <path d={poly([...split, [1000, 640], [0, 640]])} />
        </clipPath>
      </defs>
      <path d={poly(TRUNK)} fill={P.wall} />
      <path d={poly(TRUNK)} fill="url(#w7-mesench)" />
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={TRUNK} inner={offset(TRUNK, -8, true)} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={9} />
      </Part>
      <path d={poly(CAVITY)} fill={P.space} />
      <Part id="hasierako-perikardio-barrunbea">
        <path d={poly(CAVITY)} fill={P.peri} clipPath="url(#w7-desc-up)" />
      </Part>
      <Part id="peritoneo-barrunbea">
        <path d={poly(CAVITY)} fill={P.perito} clipPath="url(#w7-desc-dn)" />
      </Part>

      {/* The vertebral column as a ruler, and the spinal cord behind it. */}
      <Part id="ornoak" quiet>
        {LEVELS.map((l, i) => (
          <rect key={l} x={VERT_X - 17} y={70 + 22 * i - 8} width={34} height={16} rx={4} fill={P.bone} opacity={['C3', 'C4', 'C5', 'T6', 'T12'].includes(l) ? 0.95 : 0.6} />
        ))}
      </Part>
      <Part id="hodi-neurala">
        <rect x={CORD_X - 9} y={48} width={18} height={540} rx={9} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
      </Part>
      {LEVELS.map((l, i) =>
        ['C1', 'C3', 'C4', 'C5', 'C8', 'T6', 'T12', 'L3'].includes(l) ? (
          <Note key={l} x={CORD_X + 30} y={70 + 22 * i} size={11} tone={['C3', 'C4', 'C5', 'T6', 'T12'].includes(l) ? 'accent' : 'dim'}>
            {l}
          </Note>
        ) : null,
      )}

      <Part id="bihotza">
        <path d={`M${f1(heart[0])},${f1(heart[1] - 22)}c30,-28 66,4 40,36c-14,18 -30,26 -40,32c-10,-6 -26,-14 -40,-32c-26,-32 10,-64 40,-36Z`} fill={P.heart} stroke={P.heartDeep} strokeWidth={1.2} />
      </Part>

      {/* The septum transversum: mesenchyme in which the muscle cells differentiate. */}
      <Part id="septum-transversum">
        <path d={smoothPath(sep, true, 0.25)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
        <path d={smoothPath(sep, true, 0.25)} fill="url(#w7-mesench)" />
        <path d={smoothPath(sep, true, 0.25)} fill="url(#w7-light)" />
      </Part>
      <Part id="mioblastoak" show={mb * (1 - late)}>
        {CELLS.map(([u, v], i) => {
          if (i % 2 === 0 && mz > 0.5) return null;
          const q = onSlab(front, back, u, v * 0.8);
          return <circle key={i} cx={q[0]} cy={q[1]} r={4.2} fill="#ff8a8a" stroke="#8e1b2e" strokeWidth={1} />;
        })}
      </Part>
      <Part id="miozitoak" show={mz}>
        {CELLS.map(([u, v], i) => {
          if (i % 2 === 1 && late < 0.5) return null;
          const q = onSlab(front, back, u, v * 0.8);
          const a = (Math.atan2(back - front, BACK_X - FRONT_X) * 180) / Math.PI;
          return <ellipse key={i} cx={q[0]} cy={q[1]} rx={11} ry={3} transform={`rotate(${f1(a)} ${f1(q[0])} ${f1(q[1])})`} fill="#e0566f" stroke="#7a0f1e" strokeWidth={0.9} />;
        })}
      </Part>

      {/* Nerve fibres: C3–C5 → phrenic nerve, which lengthens as the septum descends. */}
      <Part id="lepoko-nerbio-espinalak" show={n > 0.01 ? 1 : 0}>
        {roots.map((r, i) => (
          <path key={i} d={line(cut(r, Math.min(1, n * 2)))} fill="none" stroke={P.nerve} strokeWidth={2.6} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="nerbio-frenikoa" show={n > 0.5 ? 1 : 0}>
        <path d={line(cut(trunk, seg(n, 0.5, 1)))} fill="none" stroke={P.nerve} strokeWidth={3.4} strokeLinecap="round" />
        {n > 0.98 &&
          branches.map(([a, b], i) => <path key={i} d={`M${f1(a[0])},${f1(a[1])}Q${f1((a[0] + b[0]) / 2)},${f1((a[1] + b[1]) / 2 + 6)} ${f1(b[0])},${f1(b[1])}`} fill="none" stroke={P.nerve} strokeWidth={1.6} opacity={0.85} />)}
      </Part>
      <Arrow from={[FRONT_X + 30, levelY('C5') + 20]} to={[FRONT_X + 30, levelY('T5')]} color="#fbbf24" width={2.4} show={vis(t, 0.46, 0.62)} bend={0.04} flow={!reduced} />
      <Arrow from={[BACK_X - 26, levelY('C5') + 20]} to={[BACK_X - 26, levelY('T11')]} color="#fbbf24" width={2.4} show={vis(t, 0.46, 0.62)} bend={-0.04} flow={!reduced} />

      <path d={poly(TRUNK)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={330} y={24} size={11}>
        aurrea (bentrala)
      </Note>
      <Note x={660} y={24} size={11}>
        atzea (dortsala)
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
        5. astearen bukaera: aurrea T6 mailan, atzea T12 mailan; nerbio frenikoa luzatzen da
      </Note>

      <Label id="bihotza" x={190} y={front - 70 < 60 ? 60 : front - 70} ax={heart[0] - 36} ay={heart[1] - 6} small />
      <Label id="septum-transversum" x={190} y={lerp(170, 360, s)} ax={FRONT_X + 18} ay={front} />
      <Label id="mioblastoak" x={190} y={lerp(214, 410, s)} ax={onSlab(front, back, CELLS[3][0], CELLS[3][1] * 0.8)[0] - 4} ay={onSlab(front, back, CELLS[3][0], CELLS[3][1] * 0.8)[1]} show={mb * (1 - late)} />
      <Label id="miozitoak" x={190} y={lerp(254, 450, s)} ax={onSlab(front, back, CELLS[0][0], CELLS[0][1] * 0.8)[0] - 8} ay={onSlab(front, back, CELLS[0][0], CELLS[0][1] * 0.8)[1]} show={mz} />
      <Label id="hasierako-perikardio-barrunbea" x={226} y={Math.max(36, front - 110)} ax={334} ay={Math.max(84, front - 96)} small show={vis(t, 0.46)} />
      <Label id="peritoneo-barrunbea" x={190} y={520} ax={360} ay={520} small show={vis(t, 0.46)} />
      <Label id="lepoko-nerbio-espinalak" x={810} y={250} ax={668} ay={levelY('C4') + 12} show={n > 0.01 ? 1 : 0} />
      <Label id="nerbio-frenikoa" x={810} y={330} ax={along(trunk, 0.6)[0] + 4} ay={along(trunk, 0.6)[1]} show={seg(n, 0.6, 1)} />
      <Label id="ornoak" x={810} y={560} ax={VERT_X + 17} ay={levelY('L3')} small />
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

function shrink(pts: Pt[], f: Pt, k: number): Pt[] {
  return pts.map(([x, y]) => [f[0] + (x - f[0]) * k, f[1] + (y - f[1]) * k]);
}

export function DiaphragmSection({ t, reduced }: SceneProps) {
  const c = seg(t, 0.74, 0.84);
  const mus = seg(t, 0.88, 0.95);
  const hole = Math.pow(1 - c, 1.5);
  const rim = lerp(0, 30, mus);
  const inner = offset(CAV_X, rim, true);
  const canalsOpen = 1 - seg(c, 0.85, 1);
  const holeL = shrink(CANAL_L, FOCUS_L, hole);
  const migrate = vis(t, 0.88);

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <path d={poly(BODY_X)} fill={P.wall} />
      <path d={poly(BODY_X)} fill="url(#w7-mesench)" />
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY_X} inner={offset(BODY_X, -9, true)} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={11} />
      </Part>
      <Part id="hodi-neurala">
        <ellipse cx={500} cy={100} rx={26} ry={32} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <ellipse cx={500} cy={100} rx={3} ry={9} fill="#0c1428" />
      </Part>
      <Part id="ornoak" quiet>
        <ellipse cx={500} cy={158} rx={36} ry={20} fill={P.bone} opacity={0.85} />
      </Part>
      <Part id="aorta">
        <circle cx={AORTA_X[0]} cy={AORTA_X[1]} r={14} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.2} />
      </Part>

      <path d={poly(CAV_X)} fill={P.space} />
      <clipPath id="w7-dia-cav">
        <path d={poly(CAV_X)} />
      </clipPath>

      {/* Canals (dorsolateral openings) closed by the pleuroperitoneal membranes from the posterolateral wall. */}
      <Part id="mintz-pleuroperitonealak" show={seg(t, 0.72, 0.76)}>
        <path d={poly(CAV_X)} fill={P.poMem} />
        <path d={poly(CAV_X)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="erreten-perikardioperitonealak" show={canalsOpen}>
        {[holeL, holeL.map(mx)].map((pts, i) => (
          <g key={i} clipPath="url(#w7-dia-cav)">
            <path d={smoothPath(pts, true, 0.3)} fill={P.space} />
            <path d={smoothPath(pts, true, 0.3)} fill={P.canal} />
          </g>
        ))}
      </Part>
      <Mark id="erreten-perikardioperitonealak" x={360} y={276} rx={46} ry={40} show={vis(t, 0.62, 0.74)} />
      <Mark id="erreten-perikardioperitonealak" x={640} y={276} rx={46} ry={40} show={vis(t, 0.62, 0.74)} />

      {/* Septum transversum: the large ventral plate (the IVC runs through it). */}
      <Part id="septum-transversum">
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
        <path d={smoothPath(SEPTUM_X, true, 0.2)} fill="url(#w7-mesench)" />
      </Part>
      <Part id="beheko-kaba-zaina">
        <circle cx={IVC_X[0]} cy={IVC_X[1]} r={13} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
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
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={14} fill="#7a3b48" stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={8} fill={P.gut} />
        <circle cx={ESO_X[0]} cy={ESO_X[1]} r={3} fill="#1a1208" />
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

      <Label id="mintz-pleuroperitonealak" x={202} y={196} ax={300} ay={250} show={seg(t, 0.72, 0.76)} />
      <Label id="erreten-perikardioperitonealak" x={226} y={300} ax={lerp(FOCUS_L[0], CANAL_MID[0], hole)} ay={lerp(FOCUS_L[1], CANAL_MID[1], hole)} show={canalsOpen} small />
      <Label id="miozitoak" x={190} y={352} ax={370} ay={372} show={migrate} small />
      <Label id="beheko-kaba-zaina" x={190} y={400} ax={IVC_X[0] - 12} ay={IVC_X[1]} small />
      <Label id="gorputz-paretako-mesodermoa" x={206} y={462} ax={262 + rim * 0.4} ay={462} show={mus} small />
      <Label id="septum-transversum" x={190} y={540} ax={380} ay={500} />
      <Label id="aorta" x={810} y={150} ax={AORTA_X[0] + 12} ay={AORTA_X[1] - 4} small />
      <Label id="hestegorria" x={810} y={196} ax={ESO_X[0] + 12} ay={ESO_X[1] - 6} />
      <Label id="hestegorri-inguruko-mesenkima" x={780} y={250} ax={550} ay={300} small />
    </g>
  );
}
