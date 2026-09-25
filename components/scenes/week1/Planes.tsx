'use client';

import { Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { EmbryoFigure, embryoGeom } from '@/components/scenes/week5/Embryo';
import { Standing } from '@/components/scenes/week5/Proportions';
import { spineAt } from '@/components/scenes/week5/skin';
import { vis } from './common';

/**
 * 1. Anatomiako terminoak (course figures "Kokapen terminoak" and "Planoak eta ardatzak").
 * Part A: a standing body with the three planes in oblique projection — sagittal (left | right),
 * coronal or frontal (front | back) and transverse or horizontal (top | bottom) — and the three
 * axes. Part B: position terms on an embryo; it then turns upside down and the terms stay with
 * the body ("KONTUZ buruz behera dagoenean").
 */

const CX = 500;
const TOP = 44;
const BOT = 566;
const WAIST = 318;
const HALF = 150;
/** Oblique depth vector (into the page goes up and to the right). */
const D: Pt = [74, -44];

const COL = { sag: '#a5b4fc', cor: '#f9a8d4', tra: '#fcd34d' };

const quad = (pts: Pt[]) => `M${pts.map((p) => `${p[0]},${p[1]}`).join(' L')}Z`;
const add = (p: Pt, k: number): Pt => [p[0] + D[0] * k, p[1] + D[1] * k];

function Plane({ id, d, color, on, dim }: { id: string; d: string; color: string; on: number; dim: number }) {
  const o = Math.max(on, dim);
  if (o <= 0.01) return null;
  return (
    <Part id={id}>
      <path d={d} fill={color} fillOpacity={0.08 + 0.2 * on} stroke={color} strokeOpacity={0.35 + 0.65 * on} strokeWidth={1.6} opacity={o} />
    </Part>
  );
}

function Axis({ a, b, color, show }: { a: Pt; b: Pt; color: string; show: number }) {
  if (show <= 0.01) return null;
  const head = (p: Pt, q: Pt) => {
    const L = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const ux = (p[0] - q[0]) / L;
    const uy = (p[1] - q[1]) / L;
    return `M${p[0] - ux * 12 - uy * 6},${p[1] - uy * 12 + ux * 6} L${p[0]},${p[1]} L${p[0] - ux * 12 + uy * 6},${p[1] - uy * 12 - ux * 6}`;
  };
  return (
    <g opacity={show} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} />
      <path d={head(a, b)} />
      <path d={head(b, a)} />
    </g>
  );
}

// ---------------------------------------------------------------------------

const DAY = 33;
const G = embryoGeom(DAY);
const E_C: Pt = [520, 330];
const E_S = 0.78;

export function PlanesAxes({ t }: SceneProps) {
  // Part A
  const partA = 1 - seg(t, 0.58, 0.64);
  const sOn = vis(t, 0, 0.16);
  const cOn = vis(t, 0.16, 0.32);
  const tOn = vis(t, 0.32, 0.48);
  const axes = seg(t, 0.48, 0.52);
  const seenC = t >= 0.16 ? 0.35 : 0;
  const seenT = t >= 0.32 ? 0.35 : 0;
  const sag = quad([add([CX, TOP], -0.5), add([CX, TOP], 0.5), add([CX, BOT], 0.5), add([CX, BOT], -0.5)]);
  const cor = quad([[CX - HALF, TOP + 20], [CX + HALF, TOP + 20], [CX + HALF, BOT], [CX - HALF, BOT]]);
  const tra = quad([add([CX - HALF, WAIST], -0.5), add([CX + HALF, WAIST], -0.5), add([CX + HALF, WAIST], 0.5), add([CX - HALF, WAIST], 0.5)]);
  const dv: [Pt, Pt] = [add([CX, WAIST], -1.1), add([CX, WAIST], 1.1)];

  // Part B: embryo, then upside down.
  const partB = seg(t, 0.6, 0.66);
  const flip = seg(t, 0.8, 0.9);
  const rot = 180 * flip * flip * (3 - 2 * flip);
  const ang = (rot * Math.PI) / 180;
  const R = (p: Pt): Pt => {
    const x = (p[0] - E_C[0]) * E_S;
    const y = (p[1] - E_C[1]) * E_S;
    return [500 + x * Math.cos(ang) - y * Math.sin(ang), 320 + x * Math.sin(ang) + y * Math.cos(ang)];
  };
  // Label positions turn with the body; text stays upright.
  const RL = (p: Pt): Pt => {
    const x = p[0] - 500;
    const y = p[1] - 320;
    return [500 + x * Math.cos(ang) - y * Math.sin(ang), 320 + x * Math.sin(ang) + y * Math.cos(ang)];
  };
  const { b, S } = G;
  const head = R([b.cran[0], b.cran[1] - b.cran[3] * 0.97]);
  const tail = R(spineAt(S, 0.985, 2).p);
  const back = R(spineAt(S, 0.42, -2).p);
  const belly = R([b.heart[0] - b.heart[2] * 0.82, b.heart[1]]);
  const terms = seg(t, 0.66, 0.7) * (1 - seg(t, 0.79, 0.81)) + seg(t, 0.9, 0.93);
  const L1 = RL([230, 70]);
  const L2 = RL([230, 560]);
  const L3 = RL([230, 360]);
  const L4 = RL([770, 290]);

  return (
    <g>
      {partA > 0.01 && (
        <g opacity={partA}>
          {/* Planes behind the body */}
          <Plane id="plano-koronala" d={cor} color={COL.cor} on={cOn} dim={seenC} />
          <g opacity={0.95}>
            <Standing id="w1p" cx={CX} h={0.25} />
          </g>
          <Plane id="plano-sagitala" d={sag} color={COL.sag} on={sOn} dim={t >= 0.16 ? 0.35 : 0} />
          {/* Parasagittal planes */}
          {[-1, 1].map((sgn) => (
            <path
              key={sgn}
              d={quad([add([CX + sgn * 70, TOP + 60], -0.5), add([CX + sgn * 70, TOP + 60], 0.5), add([CX + sgn * 70, BOT - 20], 0.5), add([CX + sgn * 70, BOT - 20], -0.5)])}
              fill="none"
              stroke={COL.sag}
              strokeDasharray="4 5"
              strokeWidth={1.2}
              opacity={0.55 * vis(t, 0.06, 0.16)}
            />
          ))}
          <Plane id="zeharkako-planoa" d={tra} color={COL.tra} on={tOn} dim={seenT} />

          {/* Axes */}
          <Part id="ardatz-longitudinala">
            <Axis a={[CX, TOP - 14]} b={[CX, BOT + 14]} color="#e8eefc" show={axes} />
          </Part>
          <Part id="zeharkako-ardatza">
            <Axis a={[CX - HALF - 50, WAIST]} b={[CX + HALF + 50, WAIST]} color="#e8eefc" show={axes} />
          </Part>
          <Part id="ardatz-dortsobentrala">
            <Axis a={dv[0]} b={dv[1]} color="#e8eefc" show={axes} />
          </Part>

          {/* Halves each plane separates (the body faces us: its right is on our left). */}
          <g fontSize={13} fontWeight={600} letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>
            <text x={CX - 64} y={BOT + 32} textAnchor="end" fill={COL.sag} opacity={sOn}>Eskuina</text>
            <text x={CX + 64} y={BOT + 32} textAnchor="start" fill={COL.sag} opacity={sOn}>Ezkerra</text>
            <text x={CX - HALF - 100} y={WAIST - 40} textAnchor="middle" fill={COL.tra} opacity={tOn}>Goikoa</text>
            <text x={CX - HALF - 100} y={WAIST + 50} textAnchor="middle" fill={COL.tra} opacity={tOn}>Behekoa</text>
          </g>

          <Label id="plano-sagitala" x={770} y={70} ax={add([CX, TOP], 0.5)[0]} ay={add([CX, TOP], 0.5)[1]} show={sOn} />
          <Label id="plano-koronala" x={236} y={120} ax={CX - HALF} ay={120} show={cOn} />
          <Label id="zeharkako-planoa" x={770} y={250} ax={add([CX + HALF, WAIST], 0.5)[0]} ay={add([CX + HALF, WAIST], 0.5)[1]} show={tOn} />
          <Label id="ardatz-longitudinala" x={236} y={40} ax={CX - 2} ay={TOP - 8} show={axes} />
          <Label id="zeharkako-ardatza" x={236} y={WAIST} ax={CX - HALF - 50} ay={WAIST} show={axes} />
          <Label id="ardatz-dortsobentrala" x={770} y={170} ax={dv[1][0]} ay={dv[1][1]} show={axes} />

          <Note x={CX} y={612} tone="accent" show={sOn}>Plano sagitala: ezkerreko eta eskuineko zatiak · paraleloak = parasagitalak</Note>
          <Note x={CX} y={612} tone="accent" show={cOn}>Plano koronala (frontala): aurreko eta atzeko zatiak</Note>
          <Note x={CX} y={612} tone="accent" show={tOn}>Zeharkako planoa (horizontala): goiko eta beheko zatiak</Note>
          <Note x={CX} y={612} show={axes}>Luzetarakoa: goitik behera · zeharkakoa: alde batetik bestera · dortsobentrala: aurretik atzera</Note>
        </g>
      )}

      {partB > 0.01 && (
        <g opacity={partB}>
          <g transform={`translate(500 320) rotate(${rot}) scale(${E_S}) translate(${-E_C[0]} ${-E_C[1]})`} pointerEvents="none">
            <EmbryoFigure day={DAY} />
          </g>
          <Label id="kraneala" x={L1[0]} y={L1[1]} ax={head[0]} ay={head[1]} show={terms} />
          <Label id="kaudala" x={L2[0]} y={L2[1]} ax={tail[0]} ay={tail[1]} show={terms} />
          <Label id="bentrala" x={L3[0]} y={L3[1]} ax={belly[0]} ay={belly[1]} show={terms} />
          <Label id="dortsala" x={L4[0]} y={L4[1]} ax={back[0]} ay={back[1]} show={terms} />
          <Note x={500} y={612} show={vis(t, 0.66, 0.8)}>Kokapen terminoak gorputzari lotuta daude</Note>
          <Note x={500} y={612} tone="warn" show={vis(t, 0.82)}>KONTUZ buruz behera dagoenean: kraneala burezurretik gertu dago, ez goian</Note>
        </g>
      )}
      <text x={40} y={606} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }} opacity={lerp(0, 1, partB)} pointerEvents="none">
        {flip > 0.5 ? 'Buruz behera' : 'Ohiko posizioa'}
      </text>
    </g>
  );
}
