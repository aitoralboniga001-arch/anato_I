'use client';

import type { ReactNode } from 'react';
import { C, Label, Note, OnTop, Part, clamp, lerp, lin, rand, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { SOMITE_REGIONS, TOTAL_SOMITES } from './common';

/**
 * `somitak` — notes §3.1 (Langman fig. 6-3/6-4, 6-11). Cranially the paraxial mesoderm forms
 * somitomeres, which never become true somites; from the occipital level down it segments into
 * somites: the first (occipital) pair on day 20, then ~3 pairs a day craniocaudally until the end of
 * week 5 — 42–44 pairs (4 occipital, 8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 8–10 coccygeal).
 * The first occipital and the last 5–7 coccygeal pairs regress. Somite count gives the embryo's age.
 *
 * How it is shown: the embryo lengthens as it segments (the tail bud moves caudally with the
 * unsegmented paraxial mesoderm in front of it). In that unsegmented strip a wave travels
 * cranially; when it reaches the front, a cleft cuts across the strip and a block pinches off, then
 * rounds up into an epithelial ball (the somite). The camera pulls back as the embryo grows.
 */

const N = TOTAL_SOMITES;
const P = 8.9; // somite pitch (scene units)
const Y_S0 = 188; // centre of the first (occipital) somite
const GX = 19.5; // somite centre, distance from the midline
const SW = 16; // somite width
const Y_HEAD = 58;
const PSM_LEN = 6.2; // unsegmented paraxial mesoderm ahead of the tail bud, in somite lengths

/** Pairs formed (real-valued; the fraction is the progress of the next one) — follows the beats 0 · .12 · .3 · … · .84. */
function pairsAt(t: number) {
  return Math.min(N, lin(t, 0.12, 0.2) + 0.6 * lin(t, 0.2, 0.3) + 42.4 * lin(t, 0.3, 0.84));
}
/** Day from the pair count (notes: 1st pair on day 20, then ~3 pairs/day). */
const dayOf = (f: number) => 20 + (Math.max(f, 0) - 1) / 3;
const yS = (i: number) => Y_S0 + i * P;
/** Pairs per unit of t (to hide the clock wave when segmentation runs too fast to follow). */
const rateAt = (t: number) => (pairsAt(t + 0.002) - pairsAt(t - 0.002)) / 0.004;

const REGION_COL = ['#e2414b', '#ec6a6f', '#d93340', '#ee7b62', '#cf5068', '#ad5172'];
const REGION_NAME = ['okzipital', 'zerbikal', 'toraziko', 'lunbar', 'sakro', 'kokzigeo'];
const REGIONS = (() => {
  let idx = 0;
  return SOMITE_REGIONS.map((r, k) => {
    const start = idx;
    idx += r.n;
    return { start, n: r.n, color: REGION_COL[k], name: REGION_NAME[k], label: k === 5 ? '8-10' : String(r.n) };
  });
})();
const regionOf = (i: number) => REGIONS.findIndex((r) => i >= r.start && i < r.start + r.n);
/** The first occipital and the last 6 coccygeal pairs regress. */
const transient = (i: number) => i === 0 || i >= N - 6;

const ss = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
const f1 = (v: number) => v.toFixed(1);

function stateAt(t: number) {
  const f = pairsAt(t);
  const n = Math.floor(f + 1e-9);
  const phase = f - n;
  const tailFill = ss((f - 34) / 10);
  const yTail = Y_S0 + P * (Math.min(f, N) + lerp(PSM_LEN, 1.4, tailFill)) + 4;
  const clock = clamp((36 - rateAt(t)) / 18) * (n < N ? 1 : 0);
  const regress = seg(t, 0.88, 0.935);
  return { f, n, phase, yTail, clock, regress, day: dayOf(f) };
}
type St = ReturnType<typeof stateAt>;

/** Closed outline symmetric about x = 500 from a half-width profile over [y0, y1]. */
function profileD(y0: number, y1: number, hw: (y: number) => number, n = 80) {
  const ys = Array.from({ length: n + 1 }, (_, i) => lerp(y0, y1, (1 - Math.cos((Math.PI * i) / n)) / 2));
  return smoothPath([...ys.map((y): Pt => [500 - hw(y), y]), ...[...ys].reverse().slice(1, -1).map((y): Pt => [500 + hw(y), y])], true, 0.5);
}
const cap = (d: number, r: number) => (d >= r ? 1 : Math.sqrt(Math.max(0, 1 - ((r - d) / r) ** 2)));

function bodyHW(st: St) {
  const y1 = st.yTail + 8;
  return {
    y0: Y_HEAD - 6,
    y1,
    hw: (y: number) => {
      const head = 46 * Math.exp(-(((y - 104) / 56) ** 2));
      const trunk = 37 - 6 * ss((y - (y1 - 120)) / 120);
      const w = Math.max(head, trunk);
      return w * cap(y - (Y_HEAD - 6), 40) * cap(y1 - y, 16);
    },
  };
}

function Body({ st }: { st: St }) {
  const b = bodyHW(st);
  return (
    <g>
      <path d={profileD(b.y0, b.y1, b.hw)} fill="url(#w4b-body)" stroke="rgba(150,180,240,0.38)" strokeWidth={1.2} />
      <path d={profileD(b.y0 + 3, b.y1 - 3, (y) => Math.max(0, b.hw(y) - 3))} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
    </g>
  );
}

function NeuralTube({ st }: { st: St }) {
  const y0 = Y_HEAD + 6;
  const y1 = st.yTail - 6;
  const hw = (y: number) => {
    const brain = 25 * Math.exp(-(((y - 92) / 30) ** 2)) + 17 * Math.exp(-(((y - 140) / 26) ** 2));
    return Math.max(brain, lerp(7.2, 4.6, ss((y - 300) / 260))) * cap(y - y0, 14) * cap(y1 - y, 6);
  };
  return (
    <Part id="hodi-neurala" quiet>
      <path d={profileD(y0, y1, hw)} fill={C.neural} stroke="#1e3a8a" strokeWidth={0.8} />
      <path d={profileD(y0 + 6, y1 - 4, (y) => hw(y) * 0.26)} fill="#14204d" opacity={0.75} />
      <path d={profileD(y0 + 2, y1 - 2, (y) => hw(y) * 0.8)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
    </Part>
  );
}

/**
 * Cranial somitomeres: the paraxial mesoderm beside the hindbrain only gathers into loose whorls —
 * a continuous strip with soft bulges and no clefts (never cut into true somites).
 */
function Somitomeres({ detail }: { detail?: boolean }) {
  const y0 = Y_S0 - 13 - 6 * 9.4 - 6;
  const y1 = Y_S0 - 6;
  const strip = (sd: number) => {
    const ys = Array.from({ length: 57 }, (_, j) => lerp(y0, y1, j / 56));
    const bulge = (y: number) => 1.6 * Math.cos(((y - (Y_S0 - 13)) / 9.4) * Math.PI * 2);
    const tip = (y: number) => cap(y - y0, 5) * cap(y1 - y, 3);
    const outer = ys.map((y): Pt => [500 + sd * (GX + (SW / 2 + 1 + bulge(y)) * tip(y)), y]);
    const inner = ys.map((y): Pt => [500 + sd * (GX - (SW / 2 - 0.5 + bulge(y) * 0.5) * tip(y)), y]);
    return smoothPath([...outer, ...inner.reverse()], true, 0.3);
  };
  return (
    <Part id="somitomeroak">
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={strip(sd)} fill={C.mesoParaxial} opacity={0.38} />
          {Array.from({ length: 7 }, (_, i) => {
            const y = Y_S0 - 13 - (6 - i) * 9.4;
            return <ellipse key={i} cx={500 + sd * GX} cy={y} rx={4.2} ry={2.6} fill="url(#w4b-whorl)" />;
          })}
          {detail &&
            Array.from({ length: 60 }, (_, j) => {
              const y = y0 + 3 + j * ((y1 - y0 - 6) / 60);
              return <circle key={`d${j}`} cx={f1(500 + sd * (GX + (rand(j * 3.3 + sd) - 0.5) * SW * 0.75))} cy={f1(y)} r={0.75} fill="rgba(80,6,18,0.55)" />;
            })}
        </g>
      ))}
    </Part>
  );
}

/** One somite (or the block about to become one): `r` = epithelialisation (block → rounded epithelial ball). */
function Somite({ x, y, i, r, detail, o, ghost = 0 }: { x: number; y: number; i: number; r: number; detail?: boolean; o: number; ghost?: number }) {
  const k = lerp(1, 0.78, ss((i - 30) / 14)) * lerp(1, 0.62, ghost);
  const w = SW * k * lerp(1, 0.94, r);
  const h = (P - 1.25) * lerp(1, 0.97, r) * (0.9 + 0.1 * k);
  const rx = lerp(1.4, Math.min(w, h) * 0.5, r);
  const col = REGION_COL[Math.max(0, regionOf(i))];
  const cells: ReactNode[] = [];
  if (detail) {
    // Radial epithelial cells round a small lumen (somitocoel) — appear as the block rounds up.
    const nC = 12;
    for (let j = 0; j < nC; j++) {
      const a = (j / nC) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      cells.push(
        <g key={j} opacity={f1(r)}>
          <path d={`M${f1(x + ca * w * 0.16)},${f1(y + sa * h * 0.16)}L${f1(x + ca * w * 0.5)},${f1(y + sa * h * 0.5)}`} stroke="rgba(70,6,16,0.45)" strokeWidth={0.35} />
          <ellipse cx={f1(x + Math.cos(a + 0.26) * w * 0.36)} cy={f1(y + Math.sin(a + 0.26) * h * 0.36)} rx={0.85} ry={0.6} fill="rgba(70,6,16,0.75)" />
        </g>,
      );
    }
    // Before it rounds up it is loose mesenchyme, like the strip it came from.
    for (let j = 0; j < 7; j++)
      cells.push(<circle key={`m${j}`} cx={f1(x + (rand(i * 7.3 + j) - 0.5) * w * 0.8)} cy={f1(y + (rand(i * 3.1 + j * 1.9) - 0.5) * h * 0.7)} r={0.8} fill="rgba(80,6,18,0.7)" opacity={f1(1 - r)} />);
  }
  return (
    <g opacity={f1(o)}>
      <rect x={f1(x - w / 2)} y={f1(y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(rx)} fill={col} fillOpacity={f1(1 - 0.86 * ghost)} stroke={ghost > 0.02 ? '#ffb4b4' : 'rgba(40,4,12,0.55)'} strokeOpacity={ghost > 0.02 ? f1(0.75 * ghost) : 1} strokeWidth={0.55} />
      <rect x={f1(x - w / 2)} y={f1(y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(rx)} fill="url(#g-cell)" opacity={f1(0.75 * (1 - ghost))} />
      {detail && r > 0.05 && <ellipse cx={f1(x)} cy={f1(y)} rx={f1(w * 0.13 * r)} ry={f1(h * 0.14 * r)} fill="#3a0812" opacity={0.8} />}
      {cells}
    </g>
  );
}

function SomitePairs({ st, detail, from = 0, to = N }: { st: St; detail?: boolean; from?: number; to?: number }) {
  const out: ReactNode[] = [];
  for (let i = Math.max(0, from); i < Math.min(st.n, to); i++) {
    const age = st.f - (i + 1);
    const r = ss(age / 1.4);
    const gone = transient(i) ? st.regress : 0;
    for (const sd of [-1, 1]) out.push(<Somite key={`${i}${sd}`} x={500 + sd * GX} y={yS(i)} i={i} r={r} detail={detail} o={1} ghost={gone} />);
  }
  return (
    <Part id="somitak" quiet>
      {out}
    </Part>
  );
}

/** Unsegmented paraxial mesoderm: from the somite being cut off down to the tail bud, with the clock wave and the forming cleft. */
function Unsegmented({ st, detail }: { st: St; detail?: boolean }) {
  if (st.n >= N) return null;
  const top = yS(st.n) - (P - 1.25) / 2;
  const bot = st.yTail - 10;
  if (bot <= top + 2) return null;
  const cleftY = yS(st.n) + P / 2;
  const cleft = ss((st.phase - 0.55) / 0.45);
  // The wave runs from the tail bud to the forming boundary within each period.
  const wk = ss(st.phase / 0.85);
  const wy = lerp(bot - 6, cleftY + 1, wk);
  const wOp = Math.sin(Math.PI * Math.min(1, st.phase / 0.92)) * st.clock;
  const strip = (sd: number) => {
    const xIn = 500 + sd * (GX - SW / 2);
    const xOut = 500 + sd * (GX + SW / 2);
    const taper = (y: number) => 1 - 0.45 * ss((y - (bot - 26)) / 26);
    const ys = Array.from({ length: 24 }, (_, j) => lerp(top, bot, j / 23));
    const mid = 500 + sd * GX;
    const outer = ys.map((y): Pt => [mid + (xOut - mid) * taper(y), y]);
    const inner = ys.map((y): Pt => [mid + (xIn - mid) * taper(y), y]);
    return smoothPath([...outer, ...inner.reverse()], true, 0.25);
  };
  const dots: ReactNode[] = [];
  if (detail)
    for (let j = 0; j < 420; j++) {
      const y = Y_S0 - 6 + j * 1.45;
      if (y < top + 1 || y > bot - 2) continue;
      for (const sd of [-1, 1]) {
        const x = 500 + sd * (GX + (rand(j * 2.7 + sd) - 0.5) * SW * 0.8);
        dots.push(<circle key={`${j}${sd}`} cx={f1(x)} cy={f1(y)} r={0.8} fill="rgba(80,6,18,0.7)" />);
      }
    }
  return (
    <Part id="mesodermo-paraxiala">
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={strip(sd)} fill={C.mesoParaxial} opacity={0.62} />
          <path d={strip(sd)} fill="url(#g-shade)" opacity={0.4} />
          {wOp > 0.02 && (
            <ellipse cx={500 + sd * GX} cy={f1(wy)} rx={SW * 0.5} ry={f1(lerp(9, 3.4, wk))} fill="url(#w4b-wave)" opacity={f1(wOp)} />
          )}
          {/* The cleft cuts in from both edges of the strip until the block is free. */}
          {cleft > 0.01 && (
            <>
              <rect x={f1(500 + sd * GX + (sd > 0 ? SW / 2 - (SW / 2) * cleft : -SW / 2))} y={f1(cleftY - 0.9)} width={f1((SW / 2) * cleft)} height={1.8} rx={0.9} fill="#0d0f1c" />
              <rect x={f1(500 + sd * GX + (sd > 0 ? -SW / 2 : SW / 2 - (SW / 2) * cleft))} y={f1(cleftY - 0.9)} width={f1((SW / 2) * cleft)} height={1.8} rx={0.9} fill="#0d0f1c" />
            </>
          )}
        </g>
      ))}
      {dots}
    </Part>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="w4b-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#24324f" />
        <stop offset="1" stopColor="#141c30" />
      </linearGradient>
      <radialGradient id="w4b-whorl">
        <stop offset="0" stopColor="#ff9a9a" stopOpacity={0.35} />
        <stop offset="1" stopColor="#ff9a9a" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="w4b-wave">
        <stop offset="0" stopColor="#fff1c9" stopOpacity={0.95} />
        <stop offset="0.6" stopColor="#ffd28a" stopOpacity={0.45} />
        <stop offset="1" stopColor="#ffd28a" stopOpacity={0} />
      </radialGradient>
    </defs>
  );
}

/** Live day / pair counter (top left) and, at the age step, the rule that turns one into the other. */
function Counter({ st, t }: { st: St; t: number }) {
  const pairs = Math.max(0, Math.min(N, st.n));
  const lost = st.regress > 0.15 ? Math.round(7 * st.regress) : 0;
  const rule = seg(t, 0.95, 0.985);
  return (
    <OnTop>
      <g pointerEvents="none">
        <rect x={22} y={44} width={168} height={rule > 0.02 ? 104 : 78} rx={10} fill="rgba(12,14,22,0.88)" stroke="rgba(232,238,252,0.16)" />
        <text x={36} y={64} fontSize={10.5} letterSpacing="0.08em" fill="#8a97b3">
          EGUNA
        </text>
        <text x={36} y={92} fontSize={26} fontWeight={700} fill="#e8eefc">
          {st.f < 1 ? '19' : String(Math.floor(st.day + 1e-6))}
        </text>
        <text x={98} y={64} fontSize={10.5} letterSpacing="0.08em" fill="#8a97b3">
          BIKOTEAK
        </text>
        <text x={98} y={92} fontSize={26} fontWeight={700} fill="#ffb4b4">
          {String(pairs)}
          <tspan fontSize={13} fill="#8a97b3" fontWeight={500}>{` / ${N}`}</tspan>
        </text>
        {lost > 0 && (
          <text x={36} y={112} fontSize={11.5} fill="#ffb3b3">
            {`−${lost} bikote desagertzen dira`}
          </text>
        )}
        {rule > 0.02 && (
          <text x={36} y={136} fontSize={11.5} fontWeight={600} fill="#ffd28a" opacity={rule}>
            Adina ≈ 20 + (bikoteak − 1) / 3
          </text>
        )}
      </g>
    </OnTop>
  );
}

/**
 * Region ruler beside the body: a bracket in the region's colour that grows as its somites form, and
 * the count + name (the exam numbers) level with the middle of the region.
 */
function Regions({ st, at, x0, regress = 0 }: { st: St; at: (x: number, y: number) => Pt; x0: number; regress?: number }) {
  return (
    <>
      {REGIONS.map((r, j) => {
        if (st.n <= r.start) return null;
        const last = Math.min(st.n, r.start + r.n) - 1;
        const [, y0] = at(500, yS(r.start) - P * 0.4);
        const [, y1] = at(500, yS(last) + P * 0.4);
        const show = clamp((st.f - r.start - 0.6) * 2);
        return (
          <g key={j} opacity={f1(show)} pointerEvents="none">
            <path d={`M${f1(x0)},${f1(y0 + 1)}h5V${f1(y1 - 1)}h-5`} fill="none" stroke={r.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            <rect x={f1(x0 + 5)} y={f1(y0 + 1)} width={3} height={f1(Math.max(0, y1 - y0 - 2))} rx={1.5} fill={r.color} opacity={0.35} />
          </g>
        );
      })}
      {REGIONS.map((r, j) => {
        if (st.n <= r.start) return null;
        const last = Math.min(st.n, r.start + r.n) - 1;
        const [, ym] = at(500, (yS(r.start) + yS(last)) / 2);
        const show = clamp((st.f - r.start - 0.6) * 2);
        return (
          <g key={`n${j}`}>
            <Note x={x0 + 16} y={ym} align="start" tone="accent" size={13.5} show={show}>
              {`${r.label} ${r.name}`}
            </Note>
            {/* Which pairs regress: written under their own region's count, clear of every leader. */}
            {(j === 0 || j === REGIONS.length - 1) && (
              <Note x={x0 + 16} y={ym + 17} align="start" tone="warn" size={12} show={regress}>
                {j === 0 ? '1. okzipitala desagertzen da' : 'azken 5-7 kokzigeoak desagertzen dira'}
              </Note>
            )}
          </g>
        );
      })}
    </>
  );
}

/** The overview is stretched sideways (schematic) so the somite pairs stay legible once all 44 exist. */
const KX = 1.6;

export function SomiteDorsal({ t }: SceneProps) {
  const st = stateAt(t);
  const b = bodyHW(st);
  const len = b.y1 - b.y0;
  const s = Math.min(1.75, 520 / len);
  const cy = (b.y0 + b.y1) / 2;
  const TY = 330;
  const transform = `translate(500 ${TY}) scale(${(s * KX).toFixed(4)} ${s.toFixed(4)}) translate(-500 ${f1(-cy)})`;
  const at = (x: number, y: number): Pt => [500 + (x - 500) * s * KX, TY + (y - cy) * s];
  const psmMid = lerp(yS(Math.min(st.n, N - 1)), st.yTail - 10, 0.5);
  const psmShow = st.n < N ? clamp((st.yTail - 10 - yS(st.n)) / 20) : 0;
  const newest = Math.max(0, Math.min(st.n, N) - 1);
  const somAt = at(500 - GX - 4, yS(Math.min(newest, 4)));
  const rulerX = at(500 + 44, 0)[0];
  const tubeAt = at(500, Math.max(Y_S0 + 8, Math.min(yS(14), st.yTail - 30)));
  return (
    <g>
      <Defs />
      <g transform={transform}>
        <Body st={st} />
        <Somitomeres />
        <Unsegmented st={st} />
        <SomitePairs st={st} />
        <NeuralTube st={st} />
      </g>
      <Regions st={st} at={at} x0={rulerX} regress={st.regress} />
      <Counter st={st} t={t} />
      <Note x={500} y={at(500, Y_HEAD - 20)[1]} tone="dim">
        Kraneala
      </Note>
      <Note x={500} y={Math.min(598, at(500, b.y1 + 14)[1])} tone="dim">
        Kaudala
      </Note>
      <Label id="somitomeroak" x={190} y={162} ax={at(500 - GX - 6, Y_S0 - 40)[0]} ay={at(500 - GX - 6, Y_S0 - 40)[1]} />
      <Label id="somitak" x={190} y={270} ax={somAt[0]} ay={somAt[1]} show={clamp(st.f * 2 - 1.2)} />
      <Label id="mesodermo-paraxiala" x={190} y={430} ax={at(500 - GX, psmMid)[0]} ay={at(500 - GX, psmMid)[1]} show={psmShow} small={st.f > 3} />
      <Label id="hodi-neurala" x={190} y={350} ax={tubeAt[0]} ay={tubeAt[1]} small />
    </g>
  );
}

/** Close-up on the caudal growth zone: the clock wave, the cleft and the new somite rounding up. */
export function SomiteBud({ t }: SceneProps) {
  const st = stateAt(t);
  const front = Math.min(yS(Math.min(st.f, N - 0.5)) + P * 0.5, yS(N - 1));
  const camY = front - P * 0.4;
  const s = 3.1;
  const z = zoom(500, camY, s, 470, 330);
  const at = z.at;
  const lo = Math.floor((camY - 330 / s - Y_S0) / P) - 1;
  const hi = Math.ceil((camY + 330 / s - Y_S0) / P) + 1;
  const newest = Math.min(st.n, N) - 1;
  const nAt = newest >= 0 ? at(500 - GX - SW / 2 + 2, yS(newest)) : at(500 - GX, Y_S0);
  const psmY = lerp(Math.max(yS(Math.min(st.n, N - 1)), camY - 20), Math.min(st.yTail - 12, camY + 90), 0.45);
  const psmShow = st.n < N ? 1 : 0;
  const cranial = clamp((Y_S0 + 40 - (camY - 330 / s)) / 30);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0e1322" />
      <Defs />
      <g transform={z.transform}>
        <Body st={st} />
        {cranial > 0.02 && <Somitomeres detail />}
        <Unsegmented st={st} detail />
        <SomitePairs st={st} detail from={lo} to={hi} />
        <NeuralTube st={st} />
      </g>
      <Counter st={st} t={t} />
      {/* Caption in the free space beside the body (not across it). */}
      <Note x={644} y={528} align="start" tone="accent" size={13}>
        Hazkuntza-gunea: uhin bakoitzak
      </Note>
      <Note x={644} y={548} align="start" tone="accent" size={13}>
        somita-bikote berri bat mozten du
      </Note>
      <Note x={644} y={568} align="start" tone="dim" size={12}>
        (~8 orduro)
      </Note>
      <Label id="somitak" x={190} y={250} ax={nAt[0]} ay={nAt[1]} show={clamp(st.f * 2 - 1.2)} />
      <Label id="mesodermo-paraxiala" x={190} y={430} ax={at(500 - GX - 4, psmY)[0]} ay={at(500 - GX - 4, psmY)[1]} show={psmShow * clamp((st.yTail - 12 - yS(st.n)) / 10)} />
      <Label id="somitomeroak" x={190} y={170} ax={at(500 - GX - 8, Y_S0 - 22)[0]} ay={at(500 - GX - 8, Y_S0 - 22)[1]} show={cranial * (at(500, Y_S0 - 22)[1] > 40 ? 1 : 0)} small={st.f > 1} />
      <Label id="hodi-neurala" x={810} y={300} ax={at(503, camY + 6)[0]} ay={at(503, camY + 6)[1]} small />
    </g>
  );
}
