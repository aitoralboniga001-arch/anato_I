'use client';

import type { ReactNode } from 'react';
import { Label, Mark, Note, OnTop, Part, clamp, easeOut, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { EmbryoFigure, embryoGeom } from '@/components/scenes/week5/Embryo';
import { Standing } from '@/components/scenes/week5/Proportions';
import { spineAt } from '@/components/scenes/week5/skin';

/**
 * 1. Anatomiako terminoak (course figures "Kokapen terminoak" and "Planoak eta ardatzak").
 * Part A: a standing body in oblique projection. Each plane glides into place as a pane of glass
 * that really passes through the body (the part of the pane behind the body is hidden by it), then
 * the body parts along the cut so the two halves it separates are seen and named: sagittal
 * (right | left), coronal or frontal (front | back) and transverse or horizontal (top | bottom).
 * The three axes then draw outwards from the centre. Part B: position terms on an embryo, with
 * body-fixed cranio-caudal and dorso-ventral arrows; it turns upside down and the terms turn with
 * the body while the room's "up" stays put ("KONTUZ buruz behera dagoenean").
 */

const CX = 500;
const TOP = 44;
const BOT = 566;
const WAIST = 318;
const HALF = 150;
/** Oblique depth vector (into the page goes up and to the right). */
const D: Pt = [74, -44];

const COL = { sag: '#a5b4fc', cor: '#f9a8d4', tra: '#fcd34d' };

const quad = (pts: Pt[]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}Z`;
const add = (p: Pt, k: number): Pt => [p[0] + D[0] * k, p[1] + D[1] * k];

/** The steps of part A: [start, end] of each beat. */
const S = { sag: [0, 0.16], cor: [0.16, 0.32], tra: [0.32, 0.48], axes: [0.48, 0.66] } as const;

/** Local progress through a step and its phases: enter (glide in), part (halves separate), close (next step). */
function phase(t: number, [a, b]: readonly [number, number]) {
  const len = b - a;
  return {
    enter: seg(t, a + len * 0.02, a + len * 0.38),
    part: seg(t, a + len * 0.36, a + len * 0.62) * (1 - seg(t, b, b + len * 0.16)),
    // The first step is already lit at t = 0 (the stage opens on it).
    lit: (a <= 0 ? 1 : seg(t, a, a + len * 0.12)) * (1 - seg(t, b, b + len * 0.12)),
    seen: seg(t, b, b + len * 0.12),
  };
}

/** A pane of glass: tinted gradient, a bright rim and a faint grid so it reads as a sheet. */
function Pane({ d, grid, color, lit, front }: { d: string; grid?: string; color: string; lit: number; front?: boolean }) {
  const id = `w1pl-${color.slice(1)}`;
  return (
    <g>
      <path d={d} fill={`url(#${id})`} opacity={front ? 0.55 + 0.25 * lit : 0.75 + 0.25 * lit} />
      {grid && <path d={grid} fill="none" stroke={color} strokeOpacity={0.12 + 0.14 * lit} strokeWidth={0.8} />}
      <path d={d} fill="none" stroke={color} strokeOpacity={0.4 + 0.6 * lit} strokeWidth={1.2 + 0.6 * lit} strokeLinejoin="round" />
    </g>
  );
}

/** Grid lines across a quad (p0→p1 along u, p0→p3 along v). */
function quadGrid(q: Pt[], nu: number, nv: number) {
  const L = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const segs: string[] = [];
  for (let i = 1; i < nu; i++) {
    const a = L(q[0], q[1], i / nu);
    const b = L(q[3], q[2], i / nu);
    segs.push(`M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`);
  }
  for (let j = 1; j < nv; j++) {
    const a = L(q[0], q[3], j / nv);
    const b = L(q[1], q[2], j / nv);
    segs.push(`M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`);
  }
  return segs.join('');
}

/** The name of a half the plane separates, on a plate in the plane's colour (top text layer). */
function Tag({ x, y, color, show, children, align = 'middle' }: { x: number; y: number; color: string; show: number; children: ReactNode; align?: 'start' | 'middle' | 'end' }) {
  if (show <= 0.02) return null;
  const w = String(children).length * 8.4 + 22;
  const x0 = align === 'middle' ? x - w / 2 : align === 'end' ? x - w : x;
  const lift = (1 - easeOut(show)) * 6;
  return (
    <OnTop>
      <g opacity={show} transform={`translate(0 ${lift.toFixed(2)})`} pointerEvents="none">
        <rect x={x0} y={y - 12} width={w} height={24} rx={12} fill="rgba(11,12,15,0.86)" stroke={color} strokeOpacity={0.55} strokeWidth={1} />
        <text x={x0 + w / 2} y={y} dy="0.35em" textAnchor="middle" fill={color} fontSize={12} fontWeight={700} letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>
          {children}
        </text>
      </g>
    </OnTop>
  );
}

/** Double-headed axis that draws outwards from its middle. */
function Axis({ a, b, color, grow }: { a: Pt; b: Pt; color: string; grow: number }) {
  if (grow <= 0.01) return null;
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const A: Pt = [lerp(m[0], a[0], grow), lerp(m[1], a[1], grow)];
  const B: Pt = [lerp(m[0], b[0], grow), lerp(m[1], b[1], grow)];
  const head = (p: Pt, q: Pt) => {
    const L = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
    const ux = (p[0] - q[0]) / L;
    const uy = (p[1] - q[1]) / L;
    return `M${p[0] - ux * 13 - uy * 6.5},${p[1] - uy * 13 + ux * 6.5} L${p[0]},${p[1]} L${p[0] - ux * 13 + uy * 6.5},${p[1] - uy * 13 - ux * 6.5}`;
  };
  const d = `M${A[0]},${A[1]} L${B[0]},${B[1]}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke="rgba(6,8,14,0.8)" strokeWidth={5.4}>
        <path d={d} />
        <path d={head(A, B)} />
        <path d={head(B, A)} />
      </g>
      <g stroke={color} strokeWidth={2.2}>
        <path d={d} />
        <path d={head(A, B)} />
        <path d={head(B, A)} />
      </g>
      <circle cx={m[0]} cy={m[1]} r={3.4} fill={color} stroke="rgba(6,8,14,0.8)" strokeWidth={1.5} />
    </g>
  );
}

/** The standing body, optionally clipped to one side of a cut and shifted along it. */
function Body({ clip, dx = 0, dy = 0, shade = 0, id }: { clip?: string; dx?: number; dy?: number; shade?: number; id: string }) {
  return (
    // The cut moves with its half: translate outside, clip inside.
    <g transform={dx || dy ? `translate(${dx.toFixed(2)} ${dy.toFixed(2)})` : undefined} style={shade ? { filter: `brightness(${(1 - shade).toFixed(3)})` } : undefined}>
      <g clipPath={clip ? `url(#${clip})` : undefined}>
        <Standing id={id} cx={CX} h={0.25} />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------

const DAY = 33;
const G = embryoGeom(DAY);
const E_C: Pt = [520, 330];
const E_S = 0.78;

export function PlanesAxes({ t, reduced }: SceneProps) {
  const sP = phase(t, S.sag);
  const cP = phase(t, S.cor);
  const tP = phase(t, S.tra);
  const axes = seg(t, S.axes[0] + 0.01, S.axes[0] + 0.07);
  const axesLit = seg(t, S.axes[0], S.axes[0] + 0.02);
  const axT = seg(t, S.axes[0] + 0.025, S.axes[0] + 0.085);
  const axDV = seg(t, S.axes[0] + 0.04, S.axes[0] + 0.1);
  const partA = 1 - seg(t, 0.655, 0.69);

  // Sagittal: sweeps in from a parasagittal position, leaving the parallel planes behind.
  const sagX = CX + lerp(150, 0, easeOut(sP.enter));
  const sagOn = Math.max(sP.lit, 0.22 * sP.seen);
  const sagQ = (x: number, k0: number, k1: number): Pt[] => [add([x, TOP], k0), add([x, TOP], k1), add([x, BOT], k1), add([x, BOT], k0)];
  // Coronal: comes forward from behind the body.
  const corK = lerp(0.9, 0, easeOut(cP.enter));
  const corOn = cP.enter > 0.001 ? Math.max(cP.lit, 0.22 * cP.seen) : 0;
  const corQ: Pt[] = [add([CX - HALF, TOP + 20], corK), add([CX + HALF, TOP + 20], corK), add([CX + HALF, BOT], corK), add([CX - HALF, BOT], corK)];
  // Transverse: descends from above the head to the waist.
  const traY = lerp(TOP - 20, WAIST, easeOut(tP.enter));
  const traOn = tP.enter > 0.001 ? Math.max(tP.lit, 0.22 * tP.seen) : 0;
  const traQ = (y: number, k0: number, k1: number): Pt[] => [add([CX - HALF, y], k0), add([CX + HALF, y], k0), add([CX + HALF, y], k1), add([CX - HALF, y], k1)];

  // Halves part along the active cut (one cut at a time).
  const gapS = 16 * sP.part;
  const gapC = sP.part > 0.001 ? 0 : cP.part;
  const gapT = 14 * tP.part;
  const split = gapS > 0.05 ? 'sag' : gapC > 0.002 ? 'cor' : gapT > 0.05 ? 'tra' : null;

  // Part B: embryo, then upside down.
  const partB = seg(t, 0.665, 0.71);
  const flip = seg(t, 0.82, 0.93);
  const rot = 180 * flip;
  const ang = (rot * Math.PI) / 180;
  const grow = lerp(0.9, 1, easeOut(partB));
  const R = (p: Pt): Pt => {
    const x = (p[0] - E_C[0]) * E_S * grow;
    const y = (p[1] - E_C[1]) * E_S * grow;
    return [500 + x * Math.cos(ang) - y * Math.sin(ang), 320 + x * Math.sin(ang) + y * Math.cos(ang)];
  };
  // Label positions turn with the body; text stays upright.
  const RL = (p: Pt): Pt => {
    const x = p[0] - 500;
    const y = p[1] - 320;
    return [500 + x * Math.cos(ang) - y * Math.sin(ang), 320 + x * Math.sin(ang) + y * Math.cos(ang)];
  };
  const { b, S: spine } = G;
  const head = R([b.cran[0], b.cran[1] - b.cran[3] * 0.97]);
  const tail = R(spineAt(spine, 0.985, 2).p);
  const back = R(spineAt(spine, 0.42, -2).p);
  const belly = R([b.heart[0] - b.heart[2] * 0.82, b.heart[1]]);
  const terms = seg(t, 0.69, 0.73) * (1 - seg(t, 0.82, 0.84)) + seg(t, 0.93, 0.96);
  // Body-fixed direction arrows: they turn with the embryo during the flip.
  const dirs = seg(t, 0.7, 0.76);
  const L1 = RL([230, 70]);
  const L2 = RL([230, 560]);
  const L3 = RL([230, 360]);
  const L4 = RL([770, 290]);
  // Room reference: "goian" stays where it is while the body turns.
  const room = seg(t, 0.8, 0.84);

  const clipGap = 0.4;
  return (
    <g>
      <defs>
        {Object.values(COL).map((c) => (
          <linearGradient key={c} id={`w1pl-${c.slice(1)}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c} stopOpacity={0.34} />
            <stop offset="0.5" stopColor={c} stopOpacity={0.14} />
            <stop offset="1" stopColor={c} stopOpacity={0.26} />
          </linearGradient>
        ))}
        <clipPath id="w1pl-left">
          <rect x={0} y={0} width={CX - clipGap} height={640} />
        </clipPath>
        <clipPath id="w1pl-right">
          <rect x={CX + clipGap} y={0} width={1000} height={640} />
        </clipPath>
        <clipPath id="w1pl-top">
          <rect x={0} y={0} width={1000} height={WAIST - clipGap} />
        </clipPath>
        <clipPath id="w1pl-bottom">
          <rect x={0} y={WAIST + clipGap} width={1000} height={640} />
        </clipPath>
      </defs>

      {partA > 0.01 && (
        <g opacity={partA}>
          {/* Parasagittal planes: parallel to the sagittal one, left behind as it sweeps in. */}
          {[-1, 1].map((sgn) => {
            const o = sP.enter > 0.001 ? (sgn === 1 ? seg(t, 0.03, 0.08) : seg(t, 0.06, 0.1)) * Math.max(0.65 * sP.lit, 0.18 * sP.seen) : 0;
            if (o < 0.01) return null;
            const q = sagQ(CX + sgn * 92, -0.42, 0.42).map((p): Pt => [p[0], p[1] + (p[1] > 300 ? -24 : 50)]);
            return (
              <g key={sgn} opacity={o}>
                <Pane d={quad(q)} color={COL.sag} lit={0} />
              </g>
            );
          })}

          {/* Back halves of the panes (behind the body). */}
          {sagOn > 0.01 && (
            <Part id="plano-sagitala">
              <g opacity={sagOn}>
                <Pane d={quad(sagQ(sagX, 0, 0.5))} grid={quadGrid(sagQ(sagX, 0, 0.5), 2, 6)} color={COL.sag} lit={sP.lit} />
              </g>
            </Part>
          )}
          {traOn > 0.01 && (
            <Part id="zeharkako-planoa">
              <g opacity={traOn}>
                <Pane d={quad(traQ(traY, 0, 0.5))} grid={quadGrid(traQ(traY, 0, 0.5), 6, 2)} color={COL.tra} lit={tP.lit} />
              </g>
            </Part>
          )}

          {/* Coronal cut: the back half slides back along the depth axis, behind the pane. */}
          {split === 'cor' && <Body id="w1p-back" dx={D[0] * 0.55 * gapC} dy={D[1] * 0.55 * gapC} shade={0.35 * gapC} />}
          {corOn > 0.01 && (
            <Part id="plano-koronala">
              <g opacity={corOn}>
                <Pane d={quad(corQ)} grid={quadGrid(corQ, 4, 6)} color={COL.cor} lit={cP.lit} />
              </g>
            </Part>
          )}

          {/* The body, whole or in two halves along the active cut. */}
          {split === 'sag' ? (
            <>
              <Body id="w1p-l" clip="w1pl-left" dx={-gapS} />
              <Body id="w1p-r" clip="w1pl-right" dx={gapS} />
            </>
          ) : split === 'tra' ? (
            <>
              <Body id="w1p-t" clip="w1pl-top" dy={-gapT} />
              <Body id="w1p-b" clip="w1pl-bottom" dy={gapT * 0.5} />
            </>
          ) : (
            <Body id="w1p" />
          )}

          {/* Front halves of the panes, over the body (lighter, so the body shows through). */}
          {sagOn > 0.01 && (
            <Part id="plano-sagitala">
              <g opacity={sagOn}>
                <Pane d={quad(sagQ(sagX, -0.5, 0))} grid={quadGrid(sagQ(sagX, -0.5, 0), 2, 6)} color={COL.sag} lit={sP.lit} front />
              </g>
            </Part>
          )}
          {traOn > 0.01 && (
            <Part id="zeharkako-planoa">
              <g opacity={traOn}>
                <Pane d={quad(traQ(traY, -0.5, 0))} grid={quadGrid(traQ(traY, -0.5, 0), 6, 2)} color={COL.tra} lit={tP.lit} front />
              </g>
            </Part>
          )}

          {/* Axes, drawn outwards from the centre of the body. */}
          <Part id="ardatz-longitudinala">
            <Axis a={[CX, TOP - 14]} b={[CX, BOT + 14]} color="#e8eefc" grow={axes} />
          </Part>
          <Part id="zeharkako-ardatza">
            <Axis a={[CX - HALF - 50, WAIST]} b={[CX + HALF + 50, WAIST]} color="#e8eefc" grow={axT} />
          </Part>
          <Part id="ardatz-dortsobentrala">
            <Axis a={add([CX, WAIST], -1.15)} b={add([CX, WAIST], 1.15)} color="#e8eefc" grow={axDV} />
          </Part>

          {/* The halves each plane separates (the body faces us: its right is on our left). */}
          <Tag x={CX - 120} y={BOT + 34} color={COL.sag} show={sP.part}>Eskuina</Tag>
          <Tag x={CX + 120} y={BOT + 34} color={COL.sag} show={sP.part}>Ezkerra</Tag>
          <Tag x={CX - HALF - 70} y={470} color={COL.cor} show={cP.part}>Aurrekoa</Tag>
          <Tag x={CX + HALF + 92} y={150} color={COL.cor} show={cP.part}>Atzekoa</Tag>
          <Tag x={CX - HALF - 96} y={WAIST - 54} color={COL.tra} show={tP.part}>Goikoa</Tag>
          <Tag x={CX - HALF - 96} y={WAIST + 56} color={COL.tra} show={tP.part}>Behekoa</Tag>
          <Note x={CX - 92 - D[0] * 0.42 - 10} y={TOP + 60 - D[1] * 0.42} align="end" tone="accent" show={sP.lit * seg(t, 0.06, 0.1)}>
            plano parasagitalak (paraleloak)
          </Note>

          <Label id="plano-sagitala" x={770} y={70} ax={add([sagX, TOP], 0.5)[0]} ay={add([sagX, TOP], 0.5)[1]} show={sagOn > 0.01 ? Math.max(sP.lit, 0.5 * sP.seen) * sP.enter : 0} />
          <Label id="plano-koronala" x={236} y={120} ax={corQ[0][0]} ay={corQ[0][1] + 76} show={corOn > 0.01 ? Math.max(cP.lit, 0.5 * cP.seen) * cP.enter : 0} />
          <Label id="zeharkako-planoa" x={770} y={250} ax={traQ(traY, 0, 0.5)[2][0]} ay={traQ(traY, 0, 0.5)[2][1]} show={traOn > 0.01 ? Math.max(tP.lit, 0.5 * tP.seen) * tP.enter : 0} />
          <Label id="ardatz-longitudinala" x={236} y={40} ax={CX - 2} ay={TOP - 8} show={axes ** 3} />
          <Label id="zeharkako-ardatza" x={236} y={WAIST + 40} ax={CX - HALF - 50} ay={WAIST} show={axT ** 3} />
          <Label id="ardatz-dortsobentrala" x={770} y={170} ax={add([CX, WAIST], 1.15)[0]} ay={add([CX, WAIST], 1.15)[1]} show={axDV ** 3} />

          <Note x={CX} y={616} tone="accent" show={sP.lit}>Plano sagitala: ezkerreko eta eskuineko zatiak · paraleloak = parasagitalak</Note>
          <Note x={CX} y={616} tone="accent" show={cP.lit}>Plano koronala (frontala): aurreko eta atzeko zatiak</Note>
          <Note x={CX} y={616} tone="accent" show={tP.lit}>Zeharkako planoa (horizontala): goiko eta beheko zatiak</Note>
          <Note x={CX} y={616} show={axesLit * partA}>Luzetarakoa: goitik behera · zeharkakoa: alde batetik bestera · dortsobentrala: aurretik atzera</Note>
        </g>
      )}

      {partB > 0.01 && (
        <g opacity={partB}>
          <g transform={`translate(500 320) rotate(${rot.toFixed(2)}) scale(${(E_S * grow).toFixed(4)}) translate(${-E_C[0]} ${-E_C[1]})`} pointerEvents="none">
            <EmbryoFigure day={DAY} />
          </g>
          {/* Body-fixed directions: cranial ↔ caudal and dorsal ↔ ventral. */}
          {dirs > 0.01 && (
            <g opacity={dirs * 0.9} pointerEvents="none">
              <BodyArrow a={head} b={tail} grow={dirs} color="#ffb86b" />
              <BodyArrow a={back} b={belly} grow={dirs} color="#9ad8ff" />
            </g>
          )}
          <Mark id="kraneala" x={head[0]} y={head[1]} rx={22} show={terms} />
          <Mark id="kaudala" x={tail[0]} y={tail[1]} rx={22} show={terms} />
          <Mark id="bentrala" x={belly[0]} y={belly[1]} rx={22} show={terms} />
          <Mark id="dortsala" x={back[0]} y={back[1]} rx={22} show={terms} />
          <Label id="kraneala" x={L1[0]} y={L1[1]} ax={head[0]} ay={head[1]} show={terms} />
          <Label id="kaudala" x={L2[0]} y={L2[1]} ax={tail[0]} ay={tail[1]} show={terms} />
          <Label id="bentrala" x={L3[0]} y={L3[1]} ax={belly[0]} ay={belly[1]} show={terms} />
          <Label id="dortsala" x={L4[0]} y={L4[1]} ax={back[0]} ay={back[1]} show={terms} />
          {/* The turn itself, and the room's "up" that does not turn. */}
          {flip > 0.01 && flip < 0.99 && !reduced && <TurnArrow k={flip} />}
          <RoomUp show={room} />
          <Note x={500} y={616} show={seg(t, 0.68, 0.72) * (1 - seg(t, 0.8, 0.83))}>Kokapen terminoak gorputzari lotuta daude</Note>
          <Note x={500} y={616} tone="warn" show={seg(t, 0.82, 0.86)}>KONTUZ buruz behera dagoenean: kraneala burezurretik gertu dago, ez goian</Note>
        </g>
      )}
      <text x={40} y={606} fill="#8a857c" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }} opacity={partB} pointerEvents="none">
        {flip > 0.5 ? 'Buruz behera' : 'Ohiko posizioa'}
      </text>
    </g>
  );
}

/** A soft double arrow fixed to the embryo, inset from the two points it joins. */
function BodyArrow({ a, b, grow, color }: { a: Pt; b: Pt; grow: number; color: string }) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L;
  const uy = (b[1] - a[1]) / L;
  const inset = 30;
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const half = (L / 2 - inset) * grow;
  const A: Pt = [m[0] - ux * half, m[1] - uy * half];
  const B: Pt = [m[0] + ux * half, m[1] + uy * half];
  const head = (p: Pt, s: number) => `M${p[0] - s * ux * 12 - uy * 6},${p[1] - s * uy * 12 + ux * 6} L${p[0]},${p[1]} L${p[0] - s * ux * 12 + uy * 6},${p[1] - s * uy * 12 - ux * 6}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke="rgba(6,8,14,0.7)" strokeWidth={5.6}>
        <path d={`M${A[0]},${A[1]}L${B[0]},${B[1]}`} />
        <path d={head(A, -1)} />
        <path d={head(B, 1)} />
      </g>
      <g stroke={color} strokeWidth={2.2}>
        <path d={`M${A[0]},${A[1]}L${B[0]},${B[1]}`} />
        <path d={head(A, -1)} />
        <path d={head(B, 1)} />
      </g>
    </g>
  );
}

/** A curved arrow round the embryo while it turns over. */
function TurnArrow({ k }: { k: number }) {
  const r = 250;
  const a0 = -100;
  const a1 = a0 + 150 * clamp(k * 1.15);
  const p = (a: number): Pt => [500 + r * Math.cos((a * Math.PI) / 180), 320 + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const tang = ((a1 + 90) * Math.PI) / 180;
  const tip = `M${x1},${y1} L${x1 - 12 * Math.cos(tang) + 6 * Math.sin(tang)},${y1 - 12 * Math.sin(tang) - 6 * Math.cos(tang)} L${x1 - 12 * Math.cos(tang) - 6 * Math.sin(tang)},${y1 - 12 * Math.sin(tang) + 6 * Math.cos(tang)}Z`;
  const o = Math.min(1, k * 6, (1 - k) * 6);
  return (
    <g opacity={o * 0.75} pointerEvents="none">
      <path d={`M${x0},${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" />
      <path d={tip} fill="rgba(255,255,255,0.7)" />
    </g>
  );
}

/** The room's vertical: up stays up while the embryo turns (so "kraneala" is not "goian"). */
function RoomUp({ show }: { show: number }) {
  if (show <= 0.02) return null;
  const x = 88;
  return (
    <g opacity={show} pointerEvents="none">
      <path d={`M${x},420 L${x},214`} stroke="rgba(255,255,255,0.35)" strokeWidth={1.6} />
      <path d={`M${x - 7},226 L${x},212 L${x + 7},226`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.8} strokeLinejoin="round" />
      <OnTop>
        <g opacity={show} pointerEvents="none">
          <text x={x} y={196} textAnchor="middle" fill="#cfcbc2" fontSize={12} fontWeight={700} letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>Goia</text>
          <text x={x} y={442} textAnchor="middle" fill="#8a857c" fontSize={12} fontWeight={700} letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>Behea</text>
          <text x={x} y={460} textAnchor="middle" fill="#8a857c" fontSize={10.5} letterSpacing="0.04em">(gela, ez gorputza)</text>
        </g>
      </OnTop>
    </g>
  );
}
