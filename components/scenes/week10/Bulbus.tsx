'use client';

import { Label, Note, Part, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import type { V3 } from '@/lib/three-d/math';
import { Defs10, Stream, T, f1, spline, vis } from './common';
import { HeartView, Trail, cameraAt, orbit, type CalloutSpec } from './Heart3D';
import { POSE0, centreline, type HeartPose } from './model3d';

/**
 * Stage 6 of topic 10 (notes 3.1, atal bulbarra).
 *
 * `BulbusScene` (view `3d`) — the looped heart of stage 5, from the front and a little from the right: the
 * aortic sac at the top of the bulbus sends the blood through the aortic arches to the dorsal aortas behind
 * (p3); then the bulbus shows its three sub-parts in their own colours — proximal part (widest), conus,
 * truncus — the colours every later derivative keeps.
 *
 * `BulbusMap` (view `eratorriak`) — one sub-part at a time, what it becomes: the proximal part's wall grows
 * trabeculae (the primitive right ventricle); the conus is divided by a ridge into two smooth outflow
 * spaces (the infundibula of both ventricles); the truncus is divided in the same way into the roots of the
 * pulmonary trunk (from the right infundibulum) and of the aorta (from the left one). Each division is shown
 * in a cross-section beside the tube.
 */

export const S6 = [0, 0.2, 0.42, 0.62, 0.8] as const;

const LOOPED: HeartPose = { ...POSE0, loop: 1, segs: 1, colour: 1, atriaFuse: 0.7, veins: 0.35, arches: 3 };

export function BulbusScene({ t }: SceneProps) {
  const split = seg(t, S6[1] + 0.02, S6[1] + 0.09);
  const pose: HeartPose = { ...LOOPED, split, glass: 0.5 * vis(t, 0, S6[1]) };
  const camera = cameraAt(t, [
    [0, orbit(-24, 16, 10, [-0.15, 0.6, -0.3], [40, 8])],
    [S6[1], orbit(-38, 8, 8.6, [-0.35, 0.55, 0.3], [40, 6])],
  ]);
  const line = centreline(pose, 60);
  const sac = line[0];
  // The way out (p3): aortic sac → an arch → the dorsal aorta behind, on the embryo's right.
  const out: V3[] = [sac, [-0.22, sac[1] + 0.12, sac[2] - 0.05], [-0.38, sac[1] + 0.2, -0.55], [-0.4, sac[1] + 0.1, -1.12], [-0.4, sac[1] - 0.05, -1.38], [-0.4, -0.6, -1.42]];
  const early = vis(t, 0, S6[1]);
  const names: CalloutSpec[] = [
    { id: 'aorta-zakua', p: 'aorta-zakua', show: early },
    { id: 'aorta-arkuak', p: 'aorta-arkuak-1', show: early },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalak-1', show: early, small: true },
    { id: 'atal-bulbarra', p: 'atal-bulbarra', show: early * 0.9 },
    { id: 'arteria-muturra', p: 'aorta-zakua', show: 0 },
    { id: 'bulboaren-hurbileko-atala', p: 'bulboaren-hurbileko-atala', show: vis(t, S6[1] + 0.04), text: 'Hurbileko atala' },
    { id: 'arteria-konoa', p: 'arteria-konoa', show: vis(t, S6[1] + 0.05) },
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, S6[1] + 0.06) },
    { id: 'atal-bentrikularra', p: 'atal-bentrikularra', show: vis(t, S6[1] + 0.1), small: true },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: vis(t, S6[1] + 0.1), small: true },
  ];
  return (
    <HeartView
      pose={pose}
      opts={{ cavity: 0.35, septum: 0, gut: 0.5, aortas: 1, flow: early > 0.01 ? { phase: t * 26, show: early, mixed: true } : null }}
      camera={camera}
      names={names}
      caption="5. astea · bihotz lakioa aurretik eta eskuinetik (3D)"
      over={(at) => (
        <>
          <Trail pts={out} at={at} show={early * 0.9} progress={seg(t, 0.02, 0.09)} color="#ff8a8a" />
          <Note x={500} y={612} tone="accent" show={early}>
            Arteria muturra: aorta zakutik aorta arkuetara, eta atzeko aorta dortsaletara
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S6[1])}>
            Arteria bulboan hiru azpiatal: hurbileko atala (zabalena), arteria konoa eta enbor arteriosoa
          </Note>
        </>
      )}
    />
  );
}

// ———————————————————————————— the derivation map ————————————————————————————

/** The bulbus drawn upright on the left: aortic sac at the top, then truncus, conus, proximal part, the ventricle below. */
const BX = 230;
const Y = { sac: 92, truncus: [112, 218] as const, conus: [218, 316] as const, proximal: [316, 452] as const, vent: [452, 560] as const };
const HW = { truncus: 22, conus: 30, proximal: 56, vent: 70 };

function tubeSeg(y0: number, y1: number, w0: number, w1: number) {
  const k = 0.45;
  return `M${BX - w0},${y0} C${BX - w0},${y0 + (y1 - y0) * k} ${BX - w1},${y1 - (y1 - y0) * k} ${BX - w1},${y1} L${BX + w1},${y1} C${BX + w1},${y1 - (y1 - y0) * k} ${BX + w0},${y0 + (y1 - y0) * k} ${BX + w0},${y0} Z`;
}

/** A cross-section of a tube divided by a ridge into two lumens (k = how far the ridge has grown). */
function Section({ cx, cy, r, k, fill, deep, lumL, lumR, idL, idR, ridgeId, show }: { cx: number; cy: number; r: number; k: number; fill: string; deep: string; lumL: string; lumR: string; idL: string; idR: string; ridgeId?: string; show: number }) {
  if (show <= 0.01) return null;
  const ri = r * 0.68;
  // One lumen (a half disc), pulled a little apart from the other as the ridge closes the middle.
  const half = (side: -1 | 1) => {
    const x = cx + side * k * 5;
    return `M${f1(x)},${f1(cy - ri)} A${f1(ri)},${f1(ri)} 0 0 ${side < 0 ? 0 : 1} ${f1(x)},${f1(cy + ri)} Z`;
  };
  return (
    <g opacity={show}>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={deep} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r} fill="url(#w10-ball)" />
      {k < 0.98 && <circle cx={cx} cy={cy} r={ri} fill={T.blood} opacity={1 - k} />}
      {k > 0.02 && (
        <>
          <Part id={idL} show={k}>
            <path d={half(-1)} fill={lumL} opacity={0.9} stroke="rgba(0,0,0,0.4)" />
          </Part>
          <Part id={idR} show={k}>
            <path d={half(1)} fill={lumR} opacity={0.9} stroke="rgba(0,0,0,0.4)" />
          </Part>
          {/* The ridge growing in from both sides of the wall and meeting in the middle. */}
          <Part id={ridgeId ?? idL} quiet={!ridgeId}>
            <rect x={cx - 4} y={cy - r * 0.98} width={8} height={r * 0.98 * k} rx={3} fill={fill} stroke={deep} strokeWidth={1} />
            <rect x={cx - 4} y={cy + r * 0.98 - r * 0.98 * k} width={8} height={r * 0.98 * k} rx={3} fill={fill} stroke={deep} strokeWidth={1} />
          </Part>
        </>
      )}
    </g>
  );
}

/** Trabeculae growing on a wall (short muscle cords), inside an ellipse. */
function Trabeculae({ cx, cy, rx, ry, k, color, seed = 1 }: { cx: number; cy: number; rx: number; ry: number; k: number; color: string; seed?: number }) {
  if (k <= 0.01) return null;
  return (
    <g opacity={Math.min(1, k * 1.4)} stroke={color} strokeLinecap="round">
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 + rand(seed + i) * 0.2;
        const x0 = cx + Math.cos(a) * rx * 0.92;
        const y0 = cy + Math.sin(a) * ry * 0.92;
        const L = (10 + 10 * rand(seed + i * 3)) * k;
        const x1 = x0 - Math.cos(a + (rand(i + 7) - 0.5) * 0.6) * L;
        const y1 = y0 - Math.sin(a + (rand(i + 7) - 0.5) * 0.6) * L;
        return <line key={i} x1={f1(x0)} y1={f1(y0)} x2={f1(x1)} y2={f1(y1)} strokeWidth={3 + 2 * rand(i + 11)} />;
      })}
    </g>
  );
}

/** An arrow from a part of the bulbus to what it becomes. */
function Becomes({ from, to, show, color }: { from: Pt; to: Pt; show: number; color: string }) {
  if (show <= 0.01) return null;
  const mid: Pt = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 18];
  const d = `M${f1(from[0])},${f1(from[1])} Q${f1(mid[0])},${f1(mid[1])} ${f1(to[0])},${f1(to[1])}`;
  const ang = Math.atan2(to[1] - mid[1], to[0] - mid[0]);
  const h = 11;
  const head = `M${f1(to[0])},${f1(to[1])}L${f1(to[0] - h * Math.cos(ang - 0.45))},${f1(to[1] - h * Math.sin(ang - 0.45))}L${f1(to[0] - h * Math.cos(ang + 0.45))},${f1(to[1] - h * Math.sin(ang + 0.45))}Z`;
  return (
    <g opacity={show} pointerEvents="none">
      <path d={d} fill="none" stroke="rgba(10,6,12,0.8)" strokeWidth={6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeDasharray={`${f1(400 * show)} 400`} />
      <path d={head} fill={color} stroke="rgba(10,6,12,0.8)" strokeWidth={1.2} />
    </g>
  );
}

export function BulbusMap({ t }: SceneProps) {
  const prox = vis(t, S6[2] - 0.02);
  const trab = seg(t, S6[2] + 0.02, S6[2] + 0.1);
  const conus = vis(t, S6[3] - 0.02);
  const conusK = seg(t, S6[3] + 0.02, S6[3] + 0.1);
  const trunc = vis(t, S6[3] + 0.1);
  const truncK = seg(t, S6[4] + 0.02, S6[4] + 0.09);
  const own = (a: number, b: number) => (t >= a && t < b ? 1 : 0.55);
  const yMid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;

  // The two primitive ventricles side by side (right one from the proximal part; the left one, next stage,
  // faint), each with its smooth outflow (infundibulum) and, above it, the root of its great artery: one
  // continuous way out per ventricle, as the blood will take it.
  const RV = { cx: 600, cy: 492, rx: 80, ry: 60 };
  const LV = { cx: 790, cy: 492, rx: 80, ry: 60 };
  const inf = (x: number, lean: number) => spline([[x, 440], [x + lean * 0.4, 390], [x + lean, 336]], 8);
  const roots = (x: number, lean: number) => spline([[x + lean, 326], [x + lean * 1.4, 262], [x + lean * 1.8, 196]], 8);
  const RX = 600;
  const LX = 790;
  return (
    <g>
      <Defs10 />
      {/* The bulbus, upright: aortic sac with its arches, truncus, conus, proximal part; the ventricle below. */}
      <g>
        <Part id="aorta-arkuak" quiet>
          {[-1, 1].map((s) => (
            <path key={s} d={`M${BX + s * 10},${Y.sac} C${BX + s * 40},${Y.sac - 30} ${BX + s * 72},${Y.sac - 26} ${BX + s * 84},${Y.sac + 6}`} fill="none" stroke={T.o2} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          ))}
        </Part>
        <Part id="aorta-zakua">
          <ellipse cx={BX} cy={Y.sac + 6} rx={26} ry={16} fill={T.truncus} stroke={T.truncusDeep} strokeWidth={2} />
        </Part>
        <Part id="enbor-arteriosoa" show={0.5 + 0.5 * own(S6[4] - 0.02, 2)}>
          <path d={tubeSeg(Y.truncus[0], Y.truncus[1], HW.truncus, HW.truncus + 2)} fill={T.truncus} stroke={T.truncusDeep} strokeWidth={2} />
        </Part>
        <Part id="arteria-konoa" show={0.5 + 0.5 * own(S6[3] - 0.02, S6[4] - 0.02)}>
          <path d={tubeSeg(Y.conus[0], Y.conus[1], HW.truncus + 2, HW.conus)} fill={T.conus} stroke={T.conusDeep} strokeWidth={2} />
        </Part>
        <Part id="bulboaren-hurbileko-atala" show={0.5 + 0.5 * own(S6[2] - 0.02, S6[3] - 0.02)}>
          <path d={tubeSeg(Y.proximal[0], Y.proximal[1], HW.conus, HW.proximal)} fill={T.proximal} stroke={T.bulbusDeep} strokeWidth={2} />
          <Trabeculae cx={BX} cy={yMid(Y.proximal)} rx={HW.proximal * 0.8} ry={50} k={trab} color="#1d7a44" seed={3} />
        </Part>
        <Part id="atal-bentrikularra" show={0.45}>
          <path d={tubeSeg(Y.vent[0], Y.vent[1], HW.proximal, HW.vent * 0.6)} fill={T.ventricle} stroke={T.ventricleDeep} strokeWidth={2} />
        </Part>
        <path d={`M${BX - 10},${Y.sac + 20} L${BX - 10},${Y.vent[1] - 16}`} stroke="#fff" strokeWidth={3} opacity={0.18} strokeLinecap="round" />
      </g>

      {/* Proximal part → the primitive right ventricle (its trabeculated part). */}
      <g opacity={prox}>
        <Part id="hasierako-eskuineko-bentrikulua">
          <ellipse cx={RV.cx} cy={RV.cy} rx={RV.rx} ry={RV.ry} fill={T.proximal} stroke={T.bulbusDeep} strokeWidth={2.4} />
          <ellipse cx={RV.cx} cy={RV.cy} rx={RV.rx} ry={RV.ry} fill="url(#w10-ball)" />
          <ellipse cx={RV.cx} cy={RV.cy} rx={RV.rx * 0.62} ry={RV.ry * 0.58} fill={T.blood} opacity={0.75} />
        </Part>
        <Part id="muskulu-trenkadak">
          <Trabeculae cx={RV.cx} cy={RV.cy} rx={RV.rx * 0.66} ry={RV.ry * 0.62} k={trab} color="#7be3a6" seed={9} />
        </Part>
      </g>
      <g opacity={0.5 * prox}>
        <Part id="hasierako-ezkerreko-bentrikulua">
          <ellipse cx={LV.cx} cy={LV.cy} rx={LV.rx} ry={LV.ry} fill={T.ventricle} stroke={T.ventricleDeep} strokeWidth={2.4} />
          <ellipse cx={LV.cx} cy={LV.cy} rx={LV.rx} ry={LV.ry} fill="url(#w10-ball)" />
          <ellipse cx={LV.cx} cy={LV.cy} rx={LV.rx * 0.62} ry={LV.ry * 0.58} fill={T.blood} opacity={0.75} />
        </Part>
      </g>
      <Becomes from={[BX + HW.proximal + 6, yMid(Y.proximal)]} to={[RV.cx - RV.rx - 10, RV.cy]} show={prox * seg(t, S6[2], S6[2] + 0.03)} color={T.proximal} />

      {/* Conus → divided by a ridge → the two infundibula (smooth outflow parts of both ventricles). */}
      <Section cx={410} cy={yMid(Y.conus)} r={44} k={conusK} fill={T.conus} deep={T.conusDeep} lumL="#0e1c3f" lumR="#3a0d14" idL="infundibuluak" idR="infundibuluak" show={conus} />
      <Becomes from={[BX + HW.conus + 6, yMid(Y.conus)]} to={[358, yMid(Y.conus)]} show={conus * seg(t, S6[3], S6[3] + 0.03)} color={T.conus} />
      <g opacity={conus * seg(t, S6[3] + 0.08, S6[3] + 0.12)}>
        <Part id="infundibuluak">
          {[[RX, -8], [LX, 8]].map(([x, lean]) => (
            <path key={x} d={smoothPath(inf(x, lean), false)} fill="none" stroke={T.conusDeep} strokeWidth={40} strokeLinecap="round" />
          ))}
          {[[RX, -8], [LX, 8]].map(([x, lean]) => (
            <path key={x} d={smoothPath(inf(x, lean), false)} fill="none" stroke={T.conus} strokeWidth={36} strokeLinecap="round" />
          ))}
        </Part>
        <Note x={RX - 46} y={404} size={11.5} tone="dim" align="end">eskuinekoa</Note>
        <Note x={LX + 46} y={404} size={11.5} tone="dim" align="start">ezkerrekoa</Note>
      </g>
      <Becomes from={[456, yMid(Y.conus)]} to={[RX - 26, 372]} show={conus * seg(t, S6[3] + 0.08, S6[3] + 0.11)} color={T.conus} />

      {/* Truncus → divided the same way → the roots of the pulmonary trunk and of the aorta. */}
      <Section cx={410} cy={yMid(Y.truncus)} r={36} k={truncK} fill={T.truncus} deep={T.truncusDeep} lumL="#0e1c3f" lumR="#3a0d14" idL="birika-enborraren-sustraiak" idR="aortaren-sustraiak" show={trunc} />
      <Becomes from={[BX + HW.truncus + 6, yMid(Y.truncus)]} to={[366, yMid(Y.truncus)]} show={trunc * seg(t, S6[4], S6[4] + 0.03)} color={T.truncus} />
      <g opacity={trunc * Math.max(0.6 * seg(t, S6[3] + 0.1, S6[3] + 0.13), seg(t, S6[4] + 0.07, S6[4] + 0.11))}>
        <Part id="birika-enborraren-sustraiak">
          <path d={smoothPath(roots(RX, -8), false)} fill="none" stroke={T.truncusDeep} strokeWidth={28} strokeLinecap="round" />
          <path d={smoothPath(roots(RX, -8), false)} fill="none" stroke={T.truncus} strokeWidth={24} strokeLinecap="round" />
          <path d={smoothPath(roots(RX, -8), false)} fill="none" stroke={T.deo2} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        </Part>
        <Part id="aortaren-sustraiak">
          <path d={smoothPath(roots(LX, 8), false)} fill="none" stroke={T.truncusDeep} strokeWidth={28} strokeLinecap="round" />
          <path d={smoothPath(roots(LX, 8), false)} fill="none" stroke={T.truncus} strokeWidth={24} strokeLinecap="round" />
          <path d={smoothPath(roots(LX, 8), false)} fill="none" stroke={T.o2} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        </Part>
      </g>
      <Becomes from={[448, yMid(Y.truncus)]} to={[RX - 26, 250]} show={trunc * seg(t, S6[4] + 0.07, S6[4] + 0.1)} color={T.truncus} />
      {/* Blood through each outflow: venous through the right one, oxygenated through the left one. */}
      <Stream pts={[[RX, RV.cy], ...inf(RX, -8), ...roots(RX, -8)]} t={t} n={6} speed={5} color={T.deo2} r={3} show={trunc * seg(t, S6[4] + 0.1, S6[4] + 0.13)} seed={2} />
      <Stream pts={[[LX, LV.cy], ...inf(LX, 8), ...roots(LX, 8)]} t={t} n={6} speed={5} color={T.o2} r={3} show={trunc * seg(t, S6[4] + 0.1, S6[4] + 0.13)} seed={5} />

      <Label id="aorta-zakua" x={160} y={Y.sac + 6} ax={BX - 20} ay={Y.sac + 6} small />
      <Label id="enbor-arteriosoa" x={160} y={yMid(Y.truncus)} ax={BX - 12} ay={yMid(Y.truncus)} />
      <Label id="arteria-konoa" x={160} y={yMid(Y.conus)} ax={BX - 16} ay={yMid(Y.conus)} />
      <Label id="bulboaren-hurbileko-atala" x={160} y={yMid(Y.proximal)} ax={BX - 30} ay={yMid(Y.proximal)} text="Hurbileko atala" />
      <Label id="atal-bentrikularra" x={160} y={yMid(Y.vent)} ax={BX - 30} ay={yMid(Y.vent)} small />
      <Label id="hasierako-eskuineko-bentrikulua" x={480} y={574} ax={RV.cx - RV.rx * 0.4} ay={RV.cy + RV.ry * 0.45} show={prox} />
      <Label id="muskulu-trenkadak" x={420} y={472} ax={RV.cx - RV.rx * 0.5} ay={RV.cy + RV.ry * 0.05} show={prox * trab} small />
      <Label id="hasierako-ezkerreko-bentrikulua" x={976} y={578} align="end" ax={LV.cx + LV.rx * 0.4} ay={LV.cy + LV.ry * 0.3} show={0.6 * prox} small />
      <Label id="infundibuluak" x={976} y={384} align="end" ax={LX + 6} ay={384} show={conus * seg(t, S6[3] + 0.08, S6[3] + 0.12)} />
      <Label id="birika-enborraren-sustraiak" x={RX + 14} y={150} align="middle" ax={RX - 6} ay={210} show={trunc * seg(t, S6[4] + 0.07, S6[4] + 0.11)} />
      <Label id="aortaren-sustraiak" x={LX + 40} y={262} align="start" ax={LX + 14} ay={262} show={trunc * seg(t, S6[4] + 0.07, S6[4] + 0.11)} />

      <Note x={24} y={24} size={12.5} align="start" tone="dim">
        Arteria bulboaren hiru azpiatalak eta haien eratorriak (kolore bera gordetzen dute)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, S6[2] - 0.02, S6[3] - 0.02)}>
        Hurbileko atala (zabalena): paretan muskulu trenkadak → hasierako eskuineko bentrikulua
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, S6[3] - 0.02, S6[4] - 0.02)}>
        Arteria konoa: trenkada batek bitan banatzen du → bi bentrikuluen infundibuluak (atal lisoak)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, S6[4] - 0.02, 2)}>
        Enbor arteriosoa: trenkadatu → birika enborraren sustraiak (eskuinetik) eta aortaren sustraiak (ezkerretik)
      </Note>
    </g>
  );
}
