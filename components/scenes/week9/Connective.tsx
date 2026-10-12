'use client';

import { Label, Note, Part, clamp, lerp, rand, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { LimbBudsDrawing, LimbRotation, limbBudsScreen } from '@/components/scenes/week8/Limbs';
import { MesCell, Q } from '@/components/scenes/week8/common';
import { Defs9, Fibre, HUE, Steps, W, f1, inPoly, vis } from './common';
import { BARS, EYE, SMT, SOM_N, SomiteBead, WindowEmbryo, g32, myotomeStrip, somU, somite } from './EmbryoWindow';
import { retell } from './Somite';

/**
 * Topic 9, stage `ehun-konektiboa` (2.1.4 Ehun konektibozko patroiak · 2.1.3/p5 gorputz-adarrak).
 * - `patroiak`: topic 5's embryo with its window again; each region gets the connective-tissue pattern its
 *   muscles need — head from the neural crest (teal, as in topic 4), neck from the somites (paraxial red),
 *   body wall and limbs from the parietal layer (pale pink) — and the myoblasts (crimson) come into it.
 * - `gorputz-adarra`: topic 8's limb buds (same drawing); the myoblasts leave the somites, enter the bud
 *   (abaxial domain), split into a dorsal (extensor) and a ventral (flexor) mass, and fuse into fibres.
 * - `biraketa`: topic 8's rotation view, where the flexors end up in front (upper) or behind (lower).
 */

const S = g32.S;
const dIn = (u: number) => lerp(40, 17, u) + lerp(70, 34, u);
/** A band ventral to somites i0..i1, between depth d0 and (most of) the window's depth. */
function bandPoly(i0: number, i1: number, d0: number, k = 0.9): Pt[] {
  const n = 18;
  const us = Array.from({ length: n + 1 }, (_, j) => lerp(somU(i0), somU(i1), j / n));
  return [...us.map((u) => spineAt(S, u, d0).p), ...us.reverse().map((u) => spineAt(S, u, dIn(u) * k).p)];
}
const NECK = bandPoly(0, 9.5, 24);
const WALL = bandPoly(9.5, SOM_N - 2, 22);
const ARM: Pt = [g32.arm[0], g32.arm[1]];
const LEG: Pt = [g32.leg[0], g32.leg[1]];
const archMid = (i: number): Pt => [(BARS[i].top[0] + BARS[i].bot[0]) / 2, (BARS[i].top[1] + BARS[i].bot[1]) / 2];
/** The face below and in front of the eye (frontonasal region and maxillary part of arch 1). */
const FACE: Pt = [EYE[0] + 4, EYE[1] + 26];
/** Camera a little closer than topic 5's whole-embryo framing, so the head patterns read. */
const PZ = zoom(575, 318, 1.15, 520, 322);
const pz = (x: number, y: number) => ({ ax: PZ.at(x, y)[0], ay: PZ.at(x, y)[1] });

/** Myoblasts on their way: each from a source to a spot in its pattern (no route drawn, just the cells moving). */
type Trip = { from: Pt; to: Pt; d: number };
function trips(from: Pt[], inside: (x: number, y: number) => boolean, box: [number, number, number, number], n: number, seed: number): Trip[] {
  const out: Trip[] = [];
  for (let i = 0; out.length < n && i < 400; i++) {
    const p: Pt = [lerp(box[0], box[2], rand(seed + i * 1.7)), lerp(box[1], box[3], rand(seed + i * 2.9 + 3))];
    if (inside(p[0], p[1])) out.push({ from: from[out.length % from.length], to: p, d: rand(seed + i * 4.1) * 0.35 });
  }
  return out;
}
const ellIn = (c: Pt, rx: number, ry: number) => (x: number, y: number) => ((x - c[0]) / rx) ** 2 + ((y - c[1]) / ry) ** 2 < 1;
const HEAD_TRIPS = [0, 1, 2].flatMap((a) => trips([SMT[[3, 5, 6][a]]], ellIn(archMid(a), BARS[a].w * 0.3, (BARS[a].bot[1] - BARS[a].top[1]) * 0.36), [archMid(a)[0] - 14, BARS[a].top[1], archMid(a)[0] + 14, BARS[a].bot[1]], 4, 11 + a * 7));
const NECK_TRIPS = trips([0, 1, 2, 3, 5, 7].map((i) => somite(i).c), (x, y) => inPoly(NECK, x, y), [520, 90, 760, 300], 12, 41);
const WALL_TRIPS = trips(Array.from({ length: 12 }, (_, j) => somite(12 + j * 2).c), (x, y) => inPoly(WALL, x, y), [380, 200, 760, 580], 16, 77);
const LIMB_TRIPS = [
  ...trips([9, 10, 11, 12].map((i) => somite(i).c), ellIn(ARM, g32.arm[2] * 0.7, g32.arm[3] * 0.7), [ARM[0] - 30, ARM[1] - 30, ARM[0] + 30, ARM[1] + 30], 7, 91),
  ...trips([25, 26, 27, 28].map((i) => somite(i).c), ellIn(LEG, g32.leg[2] * 0.7, g32.leg[3] * 0.7), [LEG[0] - 30, LEG[1] - 30, LEG[0] + 30, LEG[1] + 30], 7, 97),
];

function tripAt(c: Trip, k: number): Pt {
  const u = clamp((k - c.d) / (1 - c.d));
  const e = u * u * (3 - 2 * u);
  return [lerp(c.from[0], c.to[0], e), lerp(c.from[1], c.to[1], e)];
}

function Myoblasts({ list, k }: { list: Trip[]; k: number }) {
  if (k <= 0.01) return null;
  return (
    <g>
      {list.map((c, i) => {
        const u = clamp((k - c.d) / (1 - c.d));
        if (u <= 0) return null;
        const e = u * u * (3 - 2 * u);
        const p: Pt = [lerp(c.from[0], c.to[0], e), lerp(c.from[1], c.to[1], e)];
        return (
          <g key={i} transform={`translate(${f1(p[0])} ${f1(p[1])}) rotate(${f1(rand(i * 3.3) * 180)})`}>
            <ellipse rx={5.2} ry={2.6} fill={W.striated} stroke="#4a0a18" strokeWidth={0.7} />
            <ellipse rx={1.8} ry={1.2} fill="#4a0a18" />
          </g>
        );
      })}
    </g>
  );
}

export function ConnectivePatterns({ t }: SceneProps) {
  const all = seg(t, 0.02, 0.07);
  const head = seg(t, 0.12, 0.16);
  const neck = seg(t, 0.24, 0.28);
  const wall = seg(t, 0.36, 0.4);
  // All three show faintly from the start (every region needs a pattern); each lights up in its own step and stays lit.
  const hL = all * (0.4 + 0.6 * head);
  const nL = all * (0.4 + 0.6 * neck);
  const wL = all * (0.4 + 0.6 * wall);
  // At first every group of myoblasts just starts to leave its source; each completes its trip in its own step.
  const pre = 0.42 * seg(t, 0.03, 0.08);
  const kHead = Math.max(pre, seg(t, 0.15, 0.22));
  const kNeck = Math.max(pre, seg(t, 0.27, 0.34));
  const kWall = Math.max(pre, seg(t, 0.39, 0.46));
  const lead = LIMB_TRIPS.slice(7).reduce((a, c) => (c.d < a.d ? c : a));
  const myoAt = tripAt(lead, kWall);
  const crest = seg(t, 0.12, 0.18) * (1 - seg(t, 0.2, 0.23));
  return (
    <g>
      <Defs9 />
      <g transform={PZ.transform}>
      <WindowEmbryo widen={1}>
        {/* Neck: the pattern is made by the somites' own mesoderm. */}
        <Part id="somitak" show={nL} groups={['ehun-konektibozko-patroiak']}>
          <path d={smoothPath(NECK, true, 0.2)} fill={W.paraxial} opacity={0.42} />
          <path d={smoothPath(NECK, true, 0.2)} fill="url(#w9-mes)" />
        </Part>
        {/* Body wall: the parietal layer of the lateral mesoderm. */}
        <Part id="paretako-orria" show={wL} groups={['ehun-konektibozko-patroiak']}>
          <path d={smoothPath(WALL, true, 0.2)} fill={W.parietal} opacity={0.5} />
          <path d={smoothPath(WALL, true, 0.2)} fill="url(#w9-mes)" />
        </Part>
        <Part id="miotoma" show={0.6}>
          {Array.from({ length: SOM_N - 6 }, (_, j) => {
            const k = j + 4;
            return <path key={k} d={myotomeStrip(k, 0.55)} stroke={W.myo} strokeWidth={lerp(9, 3, somite(k).u)} strokeLinecap="round" opacity={0.7} />;
          })}
        </Part>
        <Part id="somita-okzipitalak" groups={['mesodermo-paraxiala']}>
          {[0, 1, 2, 3].map((i) => (
            <SomiteBead key={i} i={i} fill={i === 0 ? HUE.os12 : HUE.os25} />
          ))}
        </Part>
        <Part id="somitak" groups={['mesodermo-paraxiala']}>
          {Array.from({ length: SOM_N - 4 }, (_, j) => (
            <SomiteBead key={j} i={j + 4} fill={W.paraxial} />
          ))}
        </Part>
        <Part id="somitomeroak" groups={['mesodermo-paraxiala']}>
          {SMT.map((p, i) => (
            <ellipse key={i} cx={p[0]} cy={p[1]} rx={9.5} ry={10.5} fill={W.paraxial} opacity={0.75} />
          ))}
        </Part>
      </WindowEmbryo>

      {/* Head: the neural crest fills the arches and the face; its cells come from the neural folds (topic 4). */}
      <Part id="gandor-neurala" show={hL} groups={['ehun-konektibozko-patroiak']}>
        {BARS.map((b, i) => (
          <ellipse key={i} cx={archMid(i)[0]} cy={archMid(i)[1]} rx={b.w * 0.34} ry={(b.bot[1] - b.top[1]) * 0.4} fill={HUE.crest} opacity={0.55} />
        ))}
        <ellipse cx={FACE[0]} cy={FACE[1]} rx={22} ry={13} fill={HUE.crest} opacity={0.5} />
      </Part>
      {crest > 0.01 &&
        BARS.map((b, i) =>
          [0, 1, 2].map((j) => {
            const from: Pt = [g32.hind[0] + 10 + i * 8, g32.hind[1] + 14];
            const u = clamp(crest * 1.3 - j * 0.15);
            const p: Pt = [lerp(from[0], archMid(i)[0], u), lerp(from[1], archMid(i)[1], u)];
            return <circle key={`${i}${j}`} cx={f1(p[0])} cy={f1(p[1])} r={3.4} fill={HUE.crest} stroke="#0f5a52" strokeWidth={0.8} opacity={u > 0.02 ? 1 : 0} />;
          }),
        )}
      {/* Limb buds: the same parietal-layer pattern inside them. */}
      <Part id="gorputz-adarren-mesenkima" show={wL} groups={['ehun-konektibozko-patroiak', 'paretako-orria']}>
        <ellipse cx={ARM[0]} cy={ARM[1]} rx={g32.arm[2] * 0.82} ry={g32.arm[3] * 0.82} fill={W.parietal} opacity={0.55} />
        <ellipse cx={LEG[0]} cy={LEG[1]} rx={g32.leg[2] * 0.82} ry={g32.leg[3] * 0.82} fill={W.parietal} opacity={0.55} />
      </Part>

      {/* The myoblasts come into each pattern (somitomeres → arches; occipital and cervical somites → neck; myotomes → wall; somites → buds). */}
      <Part id="mioblastoak" show={seg(t, 0.03, 0.06)}>
        <Myoblasts list={HEAD_TRIPS} k={kHead} />
        <Myoblasts list={NECK_TRIPS} k={kNeck} />
        <Myoblasts list={[...WALL_TRIPS, ...LIMB_TRIPS]} k={kWall} />
      </Part>
      </g>

      <Note x={500} y={46} size={12} tone="dim">
        5. asteko enbrioia (5. gaiko irudia) · kolorea = ehun konektiboaren jatorria
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Eskualde bakoitzak ehun konektibozko patroia behar du; bertara iristen diren mioblastoek muskuluak sortzen dituzte'],
          [0.12, 'Buruan: patroiak gandor neuraleko zelulek osatzen dituzte'],
          [0.24, 'Lepoan: somiten mesodermoko zelulek'],
          [0.36, 'Gorputz paretetan eta gorputz-adarretan: alboko mesodermoaren paretako orriak'],
        ]}
      />

      <Label id="ehun-konektibozko-patroiak" x={500} y={22} align="middle" show={all} />
      <Label id="gandor-neurala" x={14} y={190} align="start" {...pz(archMid(1)[0] - 6, archMid(1)[1])} show={all} />
      <Label id="faringe-arkuak" x={14} y={250} align="start" {...pz(archMid(0)[0] - 10, archMid(0)[1] + 20)} small />
      <Label id="gorputz-adarren-mesenkima" x={14} y={410} align="start" {...pz(LEG[0] - 8, LEG[1] - 8)} show={wL} small />
      <Label id="beheko-gorputz-adarraren-hasikina" x={14} y={470} align="start" {...pz(LEG[0] - g32.leg[2] * 0.9, LEG[1] + 10)} small />
      <Label id="mioblastoak" x={14} y={540} align="start" {...pz(myoAt[0], myoAt[1])} show={seg(t, 0.03, 0.06)} />
      <Label id="somitomeroak" x={810} y={70} {...pz(SMT[5][0] + 8, SMT[5][1] - 6)} small />
      <Label id="somitak" x={810} y={236} text="Somiten mesodermoa" {...pz(spineAt(S, somU(6), 36).p[0], spineAt(S, somU(6), 36).p[1])} show={all} />
      <Label id="goiko-gorputz-adarraren-hasikina" x={990} y={350} align="end" {...pz(ARM[0] + g32.arm[2] * 0.8, ARM[1] - 10)} small />
      <Label id="paretako-orria" x={810} y={400} {...pz(spineAt(S, somU(17), 40).p[0], spineAt(S, somU(17), 40).p[1])} show={all} />
      <Label id="miotoma" x={810} y={480} {...pz(myoTip(22)[0], myoTip(22)[1])} small />
    </g>
  );
}
function myoTip(i: number): Pt {
  const s = somite(i);
  const L = lerp(22, 62, 1 - s.u) * 0.4;
  return [s.c[0] + s.n[0] * L, s.c[1] + s.n[1] * L];
}

/* ------------------------------------------------------------------ */
/* gorputz-adarra: topic 8's buds + a cross-section of each             */
/* ------------------------------------------------------------------ */

const T8 = 0.1;
const BUDS = limbBudsScreen(T8);
const DISC_X = 500;
const DISC_R = 78;
const centroid = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
/** Cells from the somites (left column of topic 8's wall) into each bud. */
function budTrips(outline: Pt[], ay: number, seed: number): Trip[] {
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  return trips([[48, ay - 40], [48, ay], [48, ay + 40]], (x, y) => inPoly(outline, x, y), [Math.min(...xs) + 12, Math.min(...ys), Math.max(...xs), Math.max(...ys)], 10, seed);
}
const UP_TRIPS = budTrips(BUDS.up, BUDS.upY, 5);
const LOW_TRIPS = budTrips(BUDS.low, BUDS.lowY, 9);
const DISC_CELLS = Array.from({ length: 40 }, (_, i) => {
  const a = rand(i * 2.1) * Math.PI * 2;
  const r = Math.sqrt(rand(i * 3.7 + 1)) * DISC_R * 0.42;
  return { p: [Math.cos(a) * r, Math.sin(a) * r] as Pt, r: 3.2 + rand(i) * 1.4, a: rand(i * 5.3) * 180 };
});

/** A transverse section of the bud: ectoderm, the parietal-layer pattern in the core, a dorsal (extensor) and a ventral (flexor) mass. */
function Disc({ cy, arrive, split, fuse, lower }: { cy: number; arrive: number; split: number; fuse: number; lower: boolean }) {
  const cx = DISC_X;
  const ring = (r0: number, r1: number, a0: number, a1: number) => {
    const n = 24;
    const arc = (r: number, rev: boolean) => Array.from({ length: n + 1 }, (_, i) => {
      const a = ((rev ? a1 - ((a1 - a0) * i) / n : a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
    });
    return smoothPath([...arc(r1, false), ...arc(r0, true)], true, 0.1);
  };
  const slide = (1 - arrive) * -90;
  return (
    <g>
      <Part id={lower ? 'beheko-gorputz-adarraren-hasikina' : 'goiko-gorputz-adarraren-hasikina'} quiet>
        <circle cx={cx} cy={cy} r={DISC_R} fill="#e9c6a8" stroke="#9a7056" strokeWidth={1.5} />
      </Part>
      <Part id="ehun-konektibozko-patroiak" groups={['gorputz-adarren-mesenkima', 'paretako-orria']}>
        {DISC_CELLS.map((c, i) => (
          <MesCell key={i} p={[cx + c.p[0], cy + c.p[1]]} r={c.r} a={c.a} fill={Q.lateral} opacity={0.85} />
        ))}
      </Part>
      <Part id="muskulu-hedatzaileak" show={split} groups={['domeinu-abaxiala']}>
        <path d={ring(DISC_R * 0.5, DISC_R * 0.9, 205, 335)} fill={HUE.extensor} opacity={0.55} />
      </Part>
      <Part id="muskulu-tolestatzaileak" show={split} groups={['domeinu-abaxiala']}>
        <path d={ring(DISC_R * 0.5, DISC_R * 0.9, 25, 155)} fill={HUE.flexor} opacity={0.55} />
      </Part>
      {/* Myoblasts slide in from the body-wall side and line up; then they fuse into multinucleated fibres. */}
      {arrive > 0.01 && (
        <g transform={`translate(${f1(slide)} 0)`} opacity={arrive}>
          <Part id={fuse > 0.5 ? 'zuntz-muskularrak' : 'mioblastoak'} groups={fuse > 0.5 ? ['muskulu-ildaskatuak'] : ['domeinu-abaxiala']}>
          {[-0.74, -0.6, 0.6, 0.74].map((k, i) => {
            const y = cy + k * DISC_R;
            const half = Math.sqrt(DISC_R * 0.9 * DISC_R * 0.9 - (k * DISC_R) ** 2) - 8;
            return <Fibre key={i} x0={cx - half} x1={cx + half} y={y} h={9} n={4} fuse={fuse} seed={i * 7 + (lower ? 3 : 0)} color={k < 0 ? HUE.extensor : HUE.flexor} />;
          })}
          </Part>
        </g>
      )}
      <circle cx={cx} cy={cy} r={DISC_R} fill="none" stroke={Q.skin} strokeWidth={2.4} />
      <Note x={cx} y={cy - DISC_R - 12} size={11.5} tone="dim">
        dortsala
      </Note>
      <Note x={cx} y={cy + DISC_R + 13} size={11.5} tone="dim">
        bentrala
      </Note>
    </g>
  );
}

export function LimbMuscles({ t }: SceneProps) {
  const go = seg(t, 0.48, 0.53);
  const arrive = seg(t, 0.5, 0.54);
  const split = seg(t, 0.54, 0.56);
  const fuse = seg(t, 0.61, 0.69);
  const upC = centroid(BUDS.up);
  const lowC = centroid(BUDS.low);
  return (
    <g>
      <Defs9 />
      <LimbBudsDrawing t={T8} reduced />
      <Part id="mioblastoak" show={go}>
        <Myoblasts list={UP_TRIPS} k={go} />
        <Myoblasts list={LOW_TRIPS} k={go} />
      </Part>
      <Part id="domeinu-abaxiala" show={seg(t, 0.48, 0.5)} groups={['gorputz-adarren-mesenkima']}>
        <path d={smoothPath(BUDS.up, true, 0.25)} fill="none" stroke={HUE.abaxial} strokeWidth={3} opacity={0.8} />
        <path d={smoothPath(BUDS.low, true, 0.25)} fill="none" stroke={HUE.abaxial} strokeWidth={3} opacity={0.8} />
      </Part>
      <Disc cy={BUDS.upY} arrive={arrive} split={split} fuse={fuse} lower={false} />
      <Disc cy={BUDS.lowY} arrive={arrive} split={split} fuse={fuse} lower />

      <Note x={24} y={24} size={12.5} align="start">
        8. gaiko hasikinak (bizkarretik) · ondoan: zeharkako ebakidura
      </Note>
      <Note x={DISC_X} y={(BUDS.upY + BUDS.lowY) / 2 - 26} size={12.5} tone="accent" show={vis(t, 0.66, 0.72) * seg(fuse, 0.8, 1)}>
        Ildaskatu = mugimendu
      </Note>
      <Steps
        t={t}
        steps={[
          [0.48, 'Gorputz-adarretako muskuluak: domeinu abaxialera (hasikinera) heldutako zelula aintzindarietatik'],
          [0.54, 'Bi masa: atzekoa (dortsala) → hedatzaileak · aurrekoa (bentrala) → tolestatzaileak'],
          [0.6, 'Aintzindariak → mioblastoak → fusionatu: nukleo ugariko zuntzak, miofibrillak, ildaskak'],
        ]}
      />

      <Label id="domeinu-abaxiala" x={300} y={272} align="middle" ax={upC[0] + 10} ay={upC[1] + 20} show={seg(t, 0.48, 0.5)} />
      <Label id="goiko-gorputz-adarraren-hasikina" x={640} y={60} ax={BUDS.up[0][0]} ay={BUDS.up[0][1]} small />
      <Label id="muskulu-hedatzaileak" x={640} y={128} ax={DISC_X + DISC_R * 0.55} ay={BUDS.upY - DISC_R * 0.62} show={split} />
      <Label id="ehun-konektibozko-patroiak" x={640} y={190} ax={DISC_X + DISC_R * 0.3} ay={BUDS.upY + 6} />
      <Label id="muskulu-tolestatzaileak" x={640} y={252} ax={DISC_X + DISC_R * 0.55} ay={BUDS.upY + DISC_R * 0.62} show={split} />
      <Label id="paretako-orria" x={640} y={330} ax={BUDS.wallX - 18} ay={330} small />
      <Label id="muskulu-hedatzaileak" x={640} y={388} ax={DISC_X + DISC_R * 0.55} ay={BUDS.lowY - DISC_R * 0.62} show={split} />
      <Label id="zuntz-muskularrak" x={640} y={450} ax={DISC_X + DISC_R * 0.45} ay={BUDS.lowY + DISC_R * 0.6} show={seg(fuse, 0.6, 1)} />
      <Label id="muskulu-tolestatzaileak" x={640} y={512} ax={DISC_X + DISC_R * 0.55} ay={BUDS.lowY + DISC_R * 0.74} show={split} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={640} y={576} ax={lowC[0]} ay={lowC[1] + 30} small />
      <Label id="somitak" x={300} y={600} ax={48} ay={BUDS.lowY + 80} small />
      <Label id="mioblastoak" x={330} y={306} align="middle" ax={tripAt(LOW_TRIPS[2], go)[0]} ay={tripAt(LOW_TRIPS[2], go)[1]} show={go} />
    </g>
  );
}

/** 9:ehun-konektiboa `biraketa` — topic 8's rotation view itself, on topic 9's clock. */
export function LimbTurn({ t, reduced }: SceneProps) {
  return <LimbRotation t={retell(t, [[0.72, 0.74], [0.8, 0.86], [0.82, 0.87], [0.9, 1]])} reduced={reduced} />;
}
