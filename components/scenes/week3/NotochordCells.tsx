'use client';

import { Arrow, C, Destination, FollowRing, Journey, Label, Note, OnTop, Part, clamp, lerp, lin, mix, rand, seg, type Pt, type SceneProps } from '@/components/kit';
import { useId } from 'react';
import { f1 } from './common';
import { Callout } from './gastroKit';

/**
 * 16–18. egunak — notochord, cell by cell, in two linked panels.
 * A (top): midline sagittal strip, cranial left. Prenotochordal cells leave the primitive pit one by
 *   one and the cord they form grows cranially between ectoderm and endoderm until it meets the
 *   prechordal plate. A thin orange plane (B) marks where panel B is cut.
 *   Two cells are followed (outlined in white, with their route from the pit): the first one out, which
 *   reaches the prechordal plate, and the one that settles at line B; a ghost shows the notochord
 *   they will form.
 * B (bottom): transverse close-up at that line. The cells arrive at the midline when the cord's front
 *   crosses the line; they intercalate in the endoderm (notochordal plate, the endoderm opening for
 *   them), proliferate and roll up into a solid cord that detaches (notochord), the endoderm closes
 *   underneath, and the notochord then signals to the ectoderm above (neural induction).
 */

/** Step windows of the 'notokorda' stage (shared with the sagittal and transverse views). */
export const NB = { migrate: 0.1, reach: 0.3, canal: 0.4, plate: 0.48, rod: 0.6, close: 0.72, extent: 0.8, induce: 0.88 } as const;

/* ——— A: sagittal strip ——— */
const SX0 = 204;
const SX1 = 884;
const ECTO_Y = 118;
const ENDO_Y = 196;
const MID_Y = (ECTO_Y + 10 + ENDO_Y - 7) / 2;
const X_BUCCO = 226;
const X_PRE = 262;
const X_HEAD = 290;
const X_NODE = 736;
const X_CUT = 470;
const N_CORD = 16;

const front = (t: number) => lerp(X_NODE - 16, X_HEAD, seg(t, NB.migrate, NB.canal - 0.04));
/** Cells emitted from the pit so far (continuous). */
const emitted = (t: number) => N_CORD * lin(t, NB.migrate, NB.canal - 0.04);

/** x of cord cell i (0 = first out, always at the front) along the growing cord. */
function cordX(i: number, t: number) {
  const n = emitted(t);
  if (i >= n) return null;
  const f = n <= 1 ? 1 : (n - i) / n;
  return lerp(X_NODE - 10, front(t), f);
}
const cordY = (i: number, t: number) => lerp(MID_Y + (i % 2 ? 4 : -4), ENDO_Y + 6, seg(t, NB.plate, NB.plate + 0.08));

/** Followed cord cells: the first one out (it reaches the prechordal plate) and the one that settles at line B. */
const FOLLOW_A = [0, 7];
/** Where a cord cell has been, from the pit to now (empty before it leaves the pit). */
function cordPath(i: number, t: number) {
  const pts: Pt[] = [];
  const out = NB.migrate + (i / N_CORD) * (NB.canal - 0.04 - NB.migrate);
  if (t <= out) return pts;
  pts.push([X_NODE, ECTO_Y + 8]);
  for (let s = out; ; s = Math.min(t, s + 0.003)) {
    const x = cordX(i, s);
    if (x !== null) pts.push([x, cordY(i, s)]);
    if (s >= t) break;
  }
  return pts;
}
const ellipseD = (x: number, y: number, rx: number, ry: number) => `M${f1(x - rx)},${f1(y)} a${f1(rx)},${f1(ry)} 0 1 0 ${f1(rx * 2)},0 a${f1(rx)},${f1(ry)} 0 1 0 ${f1(-rx * 2)},0 Z`;

/* ——— B: transverse close-up ——— */
const B_ECTO = 302;
const B_ECTO_H = 44;
const B_LANE = 390;
const B_ENDO = 454;
const B_ENDO_H = 26;
const TW = 26;
const TH = 30;
const BHALF = 290;
const MIDX = 500;
const N_PLATE = 6;
const N_ROD = 8;
/** The closed ring: radius of the rolled plate, and where the detached notochord settles. */
const ROD_R = ((N_ROD - 1) * 23) / (Math.PI * 2 * ((N_ROD - 1) / N_ROD));
const ROD_Y = B_LANE + 6;

/** Prenotochordal cells reach the cut once the cord's front has crossed it. */
const arriveAt = (t: number) => clamp((X_CUT + 20 - front(t)) / 60);

/**
 * Notochord cell j of panel B: cluster (arrival) → slot in the endoderm row (plate) → place on the
 * rolled ring (rod), lifted off. The two daughter cells (j ≥ N_PLATE) are born mid-row, so their
 * neighbours slide outward instead of the row jumping when proliferation starts.
 */
function bCell(j: number, t: number): Pt {
  const plate = seg(t, NB.plate, NB.plate + 0.09);
  const fold = seg(t, NB.rod, NB.rod + 0.08);
  const lift = seg(t, NB.rod + 0.07, NB.close);
  const ang = (j / N_PLATE) * Math.PI * 2 + 0.4;
  const cl: Pt = [MIDX + Math.cos(ang) * 15, B_LANE + Math.sin(ang) * 11];
  const slot: Pt = [MIDX + (j - (N_PLATE - 1) / 2) * TH, B_ENDO];
  const p: Pt = [lerp(cl[0], slot[0], plate), lerp(cl[1], slot[1], plate)];
  if (fold <= 0) return p;
  // Roll the row (now N_ROD cells) up into a closed ring: the arc bends until it closes.
  const half = N_PLATE / 2;
  const k = j >= N_PLATE ? half + (j - N_PLATE) : j < half ? j : j + (N_ROD - N_PLATE);
  const L = (N_ROD - 1) * 23;
  const theta = Math.max(0.001, fold * Math.PI * 2 * ((N_ROD - 1) / N_ROD));
  const R = L / theta;
  const phi = -theta / 2 + (theta * k) / (N_ROD - 1);
  const cy = lerp(B_ENDO - R, ROD_Y, lift);
  const ring: Pt = fold < 0.02 ? [MIDX + (k - (N_ROD - 1) / 2) * 23, B_ENDO] : [MIDX + R * Math.sin(phi), cy + R * Math.cos(phi)];
  if (j >= N_PLATE) return ring;
  const m = seg(fold, 0, 0.3);
  return [lerp(p[0], ring[0], m), lerp(p[1], ring[1], m)];
}
/** The followed cell of panel B (it ends on the right of the ring). */
const FOLLOW_B = N_PLATE - 1;
function bPath(t: number) {
  const pts: Pt[] = [];
  for (let s: number = NB.plate; ; s = Math.min(t, s + 0.003)) {
    pts.push(bCell(FOLLOW_B, s));
    if (s >= t) break;
  }
  return pts;
}

const STEPS: [number, string, string][] = [
  [0, 'Nodoa eta hobitxoa', '#dbe4ff'],
  [NB.migrate, 'Zelulak kranealerantz', C.notochord],
  [NB.reach, 'Plaka prekordaleraino', C.prechordal],
  [NB.canal, 'Hodi neuroenterikoa', '#9fb6e8'],
  [NB.plate, 'Notokorda-plaka', C.notochord],
  [NB.rod, 'Notokorda askatzen', C.notochord],
  [NB.close, 'Endodermoa ixten', C.endoderm],
  [NB.extent, 'Nodotik gora soilik', '#ffb86b'],
  [NB.induce, 'Indukzioa', '#e8eefc'],
];

/** Strip A: midline sagittal section (cranial left). */
function Strip({ t, reduced }: { t: number; reduced?: boolean }) {
  const plate = seg(t, NB.plate, NB.plate + 0.08);
  const rod = seg(t, NB.rod, NB.rod + 0.08);
  const close = seg(t, NB.close, NB.close + 0.07);
  const canal = seg(t, NB.canal, NB.canal + 0.05) * (1 - seg(t, NB.close, NB.close + 0.06));
  const extent = seg(t, NB.extent, NB.extent + 0.03) * (1 - seg(t, NB.induce, NB.induce + 0.03));
  const induce = seg(t, NB.induce, NB.induce + 0.04);
  const cut = seg(t, NB.migrate, NB.migrate + 0.03);
  const crossing = clamp(1 - Math.abs(front(t) - X_CUT) / 40) * (t < NB.canal ? 1 : 0);
  const cordOn = t >= NB.migrate;
  // Followed cells are outlined while they are cells (they melt into the rod); their routes stay
  // drawn once they have arrived, until the plate drops into the endoderm.
  const follow = seg(t, NB.migrate, NB.migrate + 0.02) * (1 - rod);
  const route = 0.6 * seg(t, NB.reach, NB.reach + 0.04) * (1 - seg(t, NB.plate, NB.plate + 0.06));
  const ghost = seg(t, NB.migrate, NB.migrate + 0.04) * (1 - rod);
  // Endoderm segment under the cord: replaced by the plate, then open, then closed again.
  const gapOpen = plate * (1 - close);
  return (
    <g>
      <rect x={SX0 - 8} y={82} width={SX1 - SX0 + 16} height={160} rx={12} fill="rgba(12,12,16,0.55)" stroke="rgba(232,238,252,0.12)" />
      {/* Amniotic cavity above, yolk sac below: a faint tint so the strip reads as a cut through the disc. */}
      <rect x={SX0} y={100} width={SX1 - SX0} height={ECTO_Y - 104} rx={6} fill="url(#nc-amn)" pointerEvents="none" />
      <rect x={SX0} y={ENDO_Y + 14} width={SX1 - SX0} height={22} rx={6} fill="url(#nc-yolk)" pointerEvents="none" />
      <Note x={SX0 + 4} y={96} align="start" size={10.5}>
        A · Erdiko mozketa sagitala · ◀ kraneala
      </Note>
      <Note x={SX1 - 4} y={96} align="end" size={10.5}>
        kaudala ▶
      </Note>
      {/* Ectoderm */}
      <Part id="ektodermoa">
        {Array.from({ length: Math.floor((SX1 - SX0) / 13) }, (_, i) => {
          const x = SX0 + 6 + i * 13;
          const node = Math.exp(-(((x - X_NODE) / 16) ** 2));
          const groove = x > X_NODE + 18 ? 8 * Math.exp(-(((x - (X_NODE + 70)) / 60) ** 2)) : 0;
          const lit = induce * clamp((x - X_HEAD + 10) / 20) * clamp((X_NODE - 20 - x) / 20);
          const y = ECTO_Y - 6 * node + groove;
          const h = 20 + 6 * node;
          return (
            <g key={i}>
              <rect x={f1(x - 5.5)} y={f1(y)} width={11} height={f1(h)} rx={3} fill={mix(C.ectoderm, '#a9c3ff', lit)} stroke="rgba(10,14,28,0.5)" strokeWidth={0.7} />
              <rect x={f1(x - 5.5)} y={f1(y)} width={11} height={f1(h)} rx={3} fill="url(#nc-shine)" />
              <ellipse cx={f1(x)} cy={f1(y + h * 0.62)} rx={2.6} ry={3.2} fill="rgba(22,30,74,0.5)" />
            </g>
          );
        })}
      </Part>
      {/* Endoderm */}
      <Part id="endodermoa">
        {Array.from({ length: Math.floor((SX1 - SX0) / 13) }, (_, i) => {
          const x = SX0 + 6 + i * 13;
          const under = x > X_HEAD - 4 && x < X_NODE - 14;
          const y = x < X_BUCCO + 10 ? ENDO_Y - 50 * clamp((X_BUCCO + 10 - x) / 16) : ENDO_Y;
          const o = under ? 1 - gapOpen * 0.85 : 1;
          return (
            <g key={i} opacity={o}>
              <rect x={f1(x - 5.5)} y={f1(y)} width={11} height={12} rx={3} fill={C.endoderm} stroke="rgba(10,14,28,0.5)" strokeWidth={0.7} />
              <rect x={f1(x - 5.5)} y={f1(y)} width={11} height={12} rx={3} fill="url(#nc-shine)" />
              <circle cx={f1(x)} cy={f1(y + 6.5)} r={2.2} fill="rgba(110,70,10,0.5)" />
            </g>
          );
        })}
      </Part>
      <Part id="mintz-bukofaringeoa">
        {/* Ectoderm pressed on endoderm with no mesoderm between: a pale, solid sheet. */}
        <rect x={X_BUCCO - 7} y={ECTO_Y + 2} width={14} height={ENDO_Y - ECTO_Y + 8} rx={6} fill="rgba(238,242,255,0.32)" stroke="#eef2ff" strokeWidth={1.1} />
      </Part>
      <Part id="plaka-prekordala">
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <circle cx={f1(X_PRE - 12 + (i % 4) * 8 + rand(i) * 3)} cy={f1(MID_Y - 10 + Math.floor(i / 4) * 12 + rand(i + 9) * 4)} r={5.2} fill={C.prechordal} stroke="rgba(10,14,28,0.5)" strokeWidth={0.7} />
            <circle cx={f1(X_PRE - 13.5 + (i % 4) * 8 + rand(i) * 3)} cy={f1(MID_Y - 11.5 + Math.floor(i / 4) * 12 + rand(i + 9) * 4)} r={1.8} fill="rgba(255,255,255,0.4)" />
          </g>
        ))}
      </Part>
      {/* Node, pit, groove */}
      <Part id="nodo-primitiboa">
        {/* The node is the thickened, raised ectoderm round the pit: lit from above like a mound. */}
        <ellipse cx={X_NODE} cy={ECTO_Y + 4} rx={21} ry={16} fill="url(#nc-node)" />
        <path d={`M${X_NODE - 20},${ECTO_Y - 4} Q${X_NODE},${ECTO_Y - 17} ${X_NODE + 20},${ECTO_Y - 4}`} fill="none" stroke="#d6e2ff" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
      </Part>
      <Part id="hobitxo-primitiboa">
        <path d={`M${X_NODE - 7},${ECTO_Y - 7} L${X_NODE},${ECTO_Y + 10} L${X_NODE + 7},${ECTO_Y - 7} Z`} fill="#0c1730" />
      </Part>
      <Part id="hodi-neuroenterikoa" show={canal}>
        <rect x={X_NODE - 4} y={ECTO_Y - 8} width={8} height={ENDO_Y - ECTO_Y + 24} rx={3} fill="#2a3a5c" stroke="#9fb6e8" strokeWidth={1.1} />
      </Part>
      <Part id="ildo-primitiboa" quiet>
        <path d={`M${X_NODE + 16},${ECTO_Y - 1} Q${X_NODE + 70},${ECTO_Y + 6} ${SX1 - 20},${ECTO_Y + 1}`} fill="none" stroke="#0c1730" strokeWidth={2.6} strokeLinecap="round" opacity={0.75} />
        <path d={`M${X_NODE + 16},${ECTO_Y - 3} Q${X_NODE + 70},${ECTO_Y + 4} ${SX1 - 20},${ECTO_Y - 1}`} fill="none" stroke="#b9cdfb" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      </Part>

      {/* What the moving cells will form: the notochord, from the node to the prechordal plate. */}
      <Destination x={X_HEAD} y={MID_Y - 8} w={X_NODE - 14 - X_HEAD} h={18} rx={8} color={C.notochord} show={ghost} />
      {/* The cord: prenotochordal cells → plate (in the endoderm row) → rod */}
      {cordOn && (
        <Part id={rod > 0.5 ? 'notokorda' : plate > 0.5 ? 'notokorda-plaka' : 'zelula-prenotokordalak'}>
          {rod > 0.02 && (
            <g opacity={rod}>
              <rect x={X_HEAD} y={f1(lerp(ENDO_Y, MID_Y - 8, rod))} width={X_NODE - 14 - X_HEAD} height={f1(lerp(12, 18, rod))} rx={8} fill={C.notochord} stroke="rgba(40,10,70,0.7)" />
              <rect x={X_HEAD} y={f1(lerp(ENDO_Y, MID_Y - 8, rod))} width={X_NODE - 14 - X_HEAD} height={f1(lerp(12, 18, rod))} rx={8} fill="url(#nc-shine)" />
            </g>
          )}
          {Array.from({ length: N_CORD }, (_, i) => {
            const x = cordX(i, t);
            if (x === null) return null;
            const y = lerp(MID_Y + (i % 2 ? 4 : -4), ENDO_Y + 6, plate);
            return <ellipse key={i} cx={f1(x)} cy={f1(y)} rx={lerp(9, 6, plate)} ry={lerp(6.5, 5.5, plate)} fill={C.notochord} opacity={1 - rod} stroke="rgba(40,10,70,0.7)" strokeWidth={0.8} />;
          })}
        </Part>
      )}
      {FOLLOW_A.map((i) => {
        const pts = cordPath(i, t);
        if (pts.length < 2) return null;
        const [x, y] = pts[pts.length - 1];
        return (
          <g key={i}>
            <Journey pts={pts} color={C.notochord} head={14} width={2.4} route={route} r={7} show={follow} />
            <FollowRing d={ellipseD(x, y, lerp(9, 6, plate) + 1.6, lerp(6.5, 5.5, plate) + 1.6)} show={follow} />
          </g>
        );
      })}
      <Note x={X_HEAD + 64} y={MID_Y + 1} size={10} show={ghost * clamp((front(t) - X_HEAD - 170) / 40)}>
        notokorda izango dena
      </Note>
      {extent > 0.02 && (
        <g opacity={extent} pointerEvents="none">
          <path d={`M${X_HEAD},${MID_Y + 22} L${X_NODE - 14},${MID_Y + 22}`} stroke="#ffb86b" strokeWidth={2} />
          <path d={`M${X_HEAD},${MID_Y + 16} v12 M${X_NODE - 14},${MID_Y + 16} v12`} stroke="#ffb86b" strokeWidth={2} />
          {/* Caudal to the node: no notochord (a muted bar with a stop at the node). */}
          <path d={`M${X_NODE + 30},${MID_Y + 22} L${SX1 - 30},${MID_Y + 22}`} stroke="#fca5a5" strokeWidth={2} opacity={0.55} />
          <path d={`M${X_NODE + 30},${MID_Y + 16} v12`} stroke="#fca5a5" strokeWidth={2} opacity={0.8} />
        </g>
      )}
      {induce > 0.02 &&
        [0.25, 0.5, 0.75].map((k) => {
          const x = lerp(X_HEAD + 20, X_NODE - 40, k);
          return <Arrow key={k} from={[x, MID_Y - 8]} to={[x, ECTO_Y + 22]} bend={0} color="#e8eefc" width={1.8} head={6} show={induce} flow={!reduced} />;
        })}

      {/* Cut line for panel B */}
      <g opacity={cut} pointerEvents="none">
        <rect x={X_CUT - 4} y={110} width={8} height={122} rx={4} fill="#ffb86b" opacity={0.1 + crossing * 0.12} />
        <line x1={X_CUT} y1={112} x2={X_CUT} y2={232} stroke="#ffb86b" strokeWidth={1.2 + crossing * 1.4} opacity={0.75} />
        <circle cx={X_CUT} cy={104} r={9} fill="#ffb86b" />
        <text x={X_CUT} y={104} dy="0.35em" textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#0f0f11">
          B
        </text>
      </g>
    </g>
  );
}

/** Panel B: transverse close-up at the cut line. */
function Section({ t, reduced }: { t: number; reduced?: boolean }) {
  const arrive = arriveAt(t);
  const plate = seg(t, NB.plate, NB.plate + 0.09);
  const fold = seg(t, NB.rod, NB.rod + 0.08);
  const bud = seg(t, NB.rod, NB.rod + 0.04);
  const glowId = useId();
  const lift = seg(t, NB.rod + 0.07, NB.close);
  const close = seg(t, NB.close, NB.close + 0.07);
  const induce = seg(t, NB.induce, NB.induce + 0.04);

  // Endoderm opens a gap for the plate cells, keeps it while the plate rolls up, then closes.
  const gap = (N_PLATE / 2) * plate * (1 - close);
  const endo: { x: number; key: string; o: number }[] = [];
  for (const s of [-1, 1])
    for (let h = 0; h < 11; h++) {
      const x = MIDX + s * (h + 0.5 + gap) * TH;
      if (Math.abs(x - MIDX) <= BHALF) endo.push({ x, key: `${s}:${h}`, o: clamp((BHALF - Math.abs(x - MIDX)) / 16) });
    }

  // Notochord cells: cluster → row in the endoderm (plate) → rolled cord (rod) lifted off. Two
  // daughter cells appear as the plate starts rolling (proliferation).
  const cells: { x: number; y: number; r: number; o: number }[] = [];
  const count = fold > 0 ? N_ROD : N_PLATE;
  for (let j = 0; j < count; j++) {
    const [x, y] = bCell(j, t);
    cells.push({ x, y, r: lerp(10, 11.5, plate), o: j >= N_PLATE ? bud : arrive });
  }
  const rodC: Pt = [MIDX, lerp(B_ENDO - ROD_R, ROD_Y, lift)];
  // Once the ring closes, its core fills with cells: the notochord is a solid cord, not a tube.
  const core = seg(t, NB.rod + 0.06, NB.rod + 0.1);
  if (core > 0)
    [
      [0, 0],
      [-11, -8],
      [11, -8],
      [-11, 9],
      [11, 9],
    ].forEach(([dx, dy]) => cells.push({ x: rodC[0] + dx, y: rodC[1] + dy, r: 9, o: core }));
  const sheath = seg(t, NB.close - 0.02, NB.close + 0.04);
  const followB = seg(t, NB.plate - 0.02, NB.plate) * (1 - seg(t, NB.extent, NB.extent + 0.03));
  const fb = bCell(FOLLOW_B, t);

  return (
    <g>
      <rect x={MIDX - BHALF - 18} y={262} width={BHALF * 2 + 36} height={320} rx={12} fill="rgba(12,12,16,0.35)" stroke="rgba(232,238,252,0.12)" />
      <Note x={MIDX - BHALF - 6} y={278} align="start" size={10.5}>
        B · Zeharkako mozketa, goiko marra etenaren mailan
      </Note>
      <Part id="amnios-barrunbea" quiet>
        <rect x={MIDX - BHALF} y={286} width={BHALF * 2} height={B_ECTO - 286} fill="rgba(143,180,247,0.06)" />
      </Part>
      <Part id="bitelo-zaku-sekundarioa" quiet>
        <rect x={MIDX - BHALF} y={B_ENDO + B_ENDO_H / 2 + 2} width={BHALF * 2} height={110} fill="rgba(242,193,78,0.05)" />
      </Part>
      <Part id="ektodermoa">
        {Array.from({ length: Math.floor((BHALF * 2) / TW) }, (_, i) => {
          const x = MIDX - BHALF + TW / 2 + i * TW;
          const lit = induce * Math.exp(-(((x - MIDX) / 70) ** 2));
          return (
            <g key={i}>
              <rect x={f1(x - TW / 2 + 1)} y={f1(B_ECTO - lit * 6)} width={TW - 2} height={f1(B_ECTO_H + lit * 6)} rx={4} fill={mix(C.ectoderm, '#a9c3ff', lit)} stroke="rgba(10,14,28,0.55)" strokeWidth={0.9} />
              <rect x={f1(x - TW / 2 + 1)} y={f1(B_ECTO - lit * 6)} width={TW - 2} height={f1(B_ECTO_H + lit * 6)} rx={4} fill="url(#nc-shine)" />
              <ellipse cx={f1(x)} cy={f1(B_ECTO + 14 + rand(i) * 16)} rx={5.5} ry={6} fill="rgba(30,20,50,0.55)" />
            </g>
          );
        })}
      </Part>
      <Part id="mesodermo-intraenbrionarioa">
        {[-1, 1].flatMap((s) =>
          Array.from({ length: 5 }, (_, i) => {
            const x = MIDX + s * (78 + i * 46 + rand(i + (s > 0 ? 7 : 0)) * 10);
            const y = B_LANE + (i % 2 ? 11 : -9);
            return (
              <g key={`${s}:${i}`}>
                {[0, 1, 2, 3].map((a) => {
                  const ang = (a / 4) * Math.PI * 2 + rand(i * 4 + a) * 0.8;
                  return <line key={a} x1={f1(x)} y1={f1(y)} x2={f1(x + Math.cos(ang) * 17)} y2={f1(y + Math.sin(ang) * 12)} stroke={C.mesoIntra} strokeWidth={2.2} strokeLinecap="round" />;
                })}
                <ellipse cx={f1(x)} cy={f1(y)} rx={8.5} ry={7} fill={C.mesoIntra} stroke="rgba(10,14,28,0.5)" strokeWidth={0.8} />
                <circle cx={f1(x - 2.5)} cy={f1(y - 2)} r={2.6} fill="rgba(255,255,255,0.32)" />
              </g>
            );
          }),
        )}
      </Part>
      <Part id="endodermoa">
        {endo.map((c) => (
          <g key={c.key} opacity={c.o}>
            <rect x={f1(c.x - TH / 2 + 1)} y={B_ENDO - B_ENDO_H / 2} width={TH - 2} height={B_ENDO_H} rx={5} fill={C.endoderm} stroke="rgba(10,14,28,0.5)" strokeWidth={0.9} />
            <rect x={f1(c.x - TH / 2 + 1)} y={B_ENDO - B_ENDO_H / 2} width={TH - 2} height={B_ENDO_H} rx={5} fill="url(#nc-shine)" />
            <circle cx={f1(c.x)} cy={B_ENDO + 1} r={4.4} fill="rgba(30,20,50,0.5)" />
          </g>
        ))}
      </Part>
      {arrive > 0.01 && (
        <Part id={fold > 0.5 ? 'notokorda' : plate > 0.5 ? 'notokorda-plaka' : 'zelula-prenotokordalak'}>
          {sheath > 0.02 && <circle cx={rodC[0]} cy={f1(rodC[1])} r={36} fill="rgba(168,85,247,0.12)" stroke={C.notochord} strokeWidth={1.6} opacity={sheath} />}
          {cells.map((c, j) => (
            <g key={j} opacity={c.o}>
              <ellipse cx={f1(c.x)} cy={f1(c.y)} rx={f1(c.r * lerp(0.6, 1, c.o))} ry={f1(c.r * 0.86 * lerp(0.6, 1, c.o))} fill={C.notochord} stroke="rgba(40,10,70,0.75)" strokeWidth={0.9} />
              <ellipse cx={f1(c.x)} cy={f1(c.y)} rx={f1(c.r * lerp(0.6, 1, c.o))} ry={f1(c.r * 0.86 * lerp(0.6, 1, c.o))} fill="url(#nc-ball)" />
              <circle cx={f1(c.x + 0.5)} cy={f1(c.y + 0.5)} r={3.8} fill="rgba(20,6,40,0.6)" />
            </g>
          ))}
        </Part>
      )}
      {/* Followed cell: from the arrival cluster into the endoderm row, then onto the rolled ring (only its moves leave a trail; the short way needs no route). */}
      {followB > 0.02 && (
        <g>
          <Journey pts={bPath(t)} color={C.notochord} head={12} width={2.6} route={0} origin={false} show={followB} />
          <FollowRing x={fb[0]} y={fb[1]} r={12.5} show={followB} />
        </g>
      )}
      {/* Arrival from the cord, perpendicular to this plane: a soft light where they come in. */}
      {arrive > 0.01 && arrive < 1 && (
        <g opacity={Math.sin(arrive * Math.PI)} pointerEvents="none" style={{ mixBlendMode: 'screen' }}>
          <defs>
            <radialGradient id={glowId}>
              <stop offset="0" stopColor={C.notochord} stopOpacity={0.55} />
              <stop offset="1" stopColor={C.notochord} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={MIDX} cy={B_LANE} r={46} fill={`url(#${glowId})`} />
        </g>
      )}
      {/* Endoderm closing under the rod. */}
      {close > 0.02 && close < 0.99 && (
        <g pointerEvents="none">
          <Arrow from={[MIDX - 170, B_ENDO + 34]} to={[MIDX - 40, B_ENDO + 34]} bend={0} color={C.endoderm} width={2} head={7} flow={!reduced} />
          <Arrow from={[MIDX + 170, B_ENDO + 34]} to={[MIDX + 40, B_ENDO + 34]} bend={0} color={C.endoderm} width={2} head={7} flow={!reduced} />
        </g>
      )}
      {induce > 0.02 &&
        [-40, 0, 40].map((dx) => <Arrow key={dx} from={[MIDX + dx * 0.5, rodC[1] - 30]} to={[MIDX + dx, B_ECTO + B_ECTO_H + 4]} bend={0} color="#e8eefc" width={2} head={7} show={induce} flow={!reduced} />)}
    </g>
  );
}

function Legend() {
  const rows: [string, string][] = [
    ['follow', 'Jarraitutako zelula'],
    [C.notochord, 'Zelula prenotokordalak → notokorda'],
    [C.prechordal, 'Plaka prekordala'],
    [C.ectoderm, 'Ektodermoa'],
    [C.mesoIntra, 'Mesodermo intraenbrionarioa'],
    [C.endoderm, 'Endodermoa'],
  ];
  const x = 772;
  const y = 492;
  return (
    <OnTop>
    <g pointerEvents="none">
      <rect x={x - 12} y={y - 22} width={222} height={150} rx={12} fill="rgba(12,12,16,0.82)" stroke="rgba(232,238,252,0.14)" />
      {rows.map(([c, text], i) => (
        <g key={text} transform={`translate(${x} ${y + i * 22})`}>
          {c === 'follow' ? <circle cx={6} cy={0} r={5.5} fill={C.notochord} stroke="#fff" strokeWidth={2} /> : <rect x={0} y={-6} width={12} height={12} rx={3} fill={c} />}
          <text x={20} y={0} dy="0.35em" fontSize={11} fill="#e8eefc">
            {text}
          </text>
        </g>
      ))}
    </g>
    </OnTop>
  );
}

export function NotochordCells({ t, reduced }: SceneProps) {
  const stepIdx = STEPS.reduce((acc, st, i) => (t >= st[0] - 1e-6 ? i : acc), 0);
  const step = STEPS[stepIdx];
  const on = (a: number, b: number) => seg(t, a, a + 0.02) * (1 - seg(t, b - 0.01, b + 0.01));
  const cordSlot = t >= NB.rod + 0.04 ? 'notokorda' : t >= NB.plate + 0.04 ? 'notokorda-plaka' : 'zelula-prenotokordalak';
  const f = front(t);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <linearGradient id="nc-shine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.32} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.24} />
        </linearGradient>
        <radialGradient id="nc-ball" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.38} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </radialGradient>
        <radialGradient id="nc-node" cx="50%" cy="30%" r="65%">
          <stop offset="0" stopColor="#dbe6ff" stopOpacity={0.6} />
          <stop offset="0.7" stopColor="#8fb0f5" stopOpacity={0.18} />
          <stop offset="1" stopColor="#8fb0f5" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="nc-amn" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8fb4f7" stopOpacity={0} />
          <stop offset="1" stopColor="#8fb4f7" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="nc-yolk" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2c14e" stopOpacity={0.12} />
          <stop offset="1" stopColor="#f2c14e" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Strip t={t} reduced={reduced} />
      <Section t={t} reduced={reduced} />
      <Legend />

      {/* Step chip */}
      <OnTop>
        <g pointerEvents="none">
          <rect x={450} y={40} width={200} height={26} rx={13} fill="rgba(12,12,16,0.86)" stroke="rgba(232,238,252,0.16)" />
          <circle cx={466} cy={53} r={5} fill={step[2]} />
          <text x={556} y={53} dy="0.35em" textAnchor="middle" fontSize={12.5} fontWeight={650} fill="#e8eefc">
            {step[1]}
          </text>
        </g>
      </OnTop>

      {/* Call-outs */}
      <Callout x={560} y={252} text="nodotik kranealerantz, ektodermoaren eta endodermoaren artean" show={on(NB.migrate, NB.reach)} color="#d8b4fe" to={[Math.min(X_NODE - 40, f + 40), MID_Y]} />
      <Callout x={420} y={252} text="plaka prekordalaraino iristen dira" show={on(NB.reach, NB.canal)} color="#d8b4fe" to={[X_HEAD + 6, MID_Y]} />
      <Callout x={560} y={252} text="amnios barrunbea ↔ bitelo zakua, aldi baterako" show={on(NB.canal, NB.plate)} color="#9fb6e8" to={[X_NODE, MID_Y]} />
      <Callout x={MIDX} y={530} text="endodermoko zelulen artean tartekatzen dira: notokorda-plaka" show={on(NB.plate, NB.rod)} color="#d8b4fe" to={[MIDX, B_ENDO]} />
      <Callout x={MIDX} y={530} text="ugaldu, tolestu eta endodermotik askatu: notokorda" show={on(NB.rod, NB.close)} color="#d8b4fe" />
      <Callout x={MIDX} y={530} text="endodermoa berriz jarraitu egiten da notokordaren azpian" show={on(NB.close, NB.extent)} color={C.endoderm} />
      <Callout x={560} y={252} text="notokorda: hobitxotik plaka prekordalera · kaudalean EZ" show={on(NB.extent, NB.induce)} color="#ffb86b" />
      <Callout x={MIDX} y={530} text="notokorda → ektodermoa: indukzioa (plaka neurala)" show={seg(t, NB.induce, NB.induce + 0.03)} />

      <Label id={cordSlot} x={190} y={140} ax={cordSlot === 'zelula-prenotokordalak' ? Math.max(lerp(X_HEAD + 40, X_NODE - 60, 0.3), f + 4) : lerp(X_HEAD + 40, X_NODE - 60, 0.3)} ay={cordSlot === 'notokorda-plaka' ? ENDO_Y + 6 : cordSlot === 'notokorda' ? lerp(ENDO_Y + 6, MID_Y + 1, seg(t, NB.rod, NB.rod + 0.08)) : MID_Y} show={seg(t, NB.migrate + 0.04, NB.migrate + 0.07)} small />
      <Label id="plaka-prekordala" x={190} y={172} ax={X_PRE - 6} ay={MID_Y} small />
      <Label id="mintz-bukofaringeoa" x={190} y={204} ax={X_BUCCO - 6} ay={ENDO_Y - 20} small />
      <Label id="nodo-primitiboa" x={690} y={75} ax={X_NODE - 14} ay={ECTO_Y - 8} align="end" small />
      <Label id="hobitxo-primitiboa" x={780} y={75} ax={X_NODE + 3} ay={ECTO_Y - 4} align="start" small />
      <Label id="hodi-neuroenterikoa" x={890} y={250} ax={X_NODE + 4} ay={ENDO_Y + 10} align="end" small show={seg(t, NB.canal, NB.canal + 0.04) * (1 - seg(t, NB.close, NB.close + 0.06))} />

      <Label id="ektodermoa" x={190} y={B_ECTO + 20} ax={MIDX - BHALF + 10} ay={B_ECTO + 20} small />
      <Label id="mesodermo-intraenbrionarioa" x={190} y={B_LANE} ax={MIDX - BHALF + 30} ay={B_LANE} small />
      <Label id="endodermoa" x={190} y={B_ENDO} ax={MIDX - BHALF + 10} ay={B_ENDO} small />
      <Label id={cordSlot} x={810} y={410} ax={MIDX + 30} ay={t >= NB.rod + 0.04 ? B_LANE + 10 : t >= NB.plate + 0.04 ? B_ENDO : B_LANE} align="start" small show={arriveAt(t)} />
    </g>
  );
}
