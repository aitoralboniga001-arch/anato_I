'use client';

import { Arrow, C, Flow, Part, clamp, lerp, mix, rand, smoothPath, type Pt } from '@/components/kit';
import { K } from '@/components/scenes/week3-villi/art';

/**
 * The placenta cut through, after Langman fig. 8-13: a slice of a disc, so the slab bows (its middle
 * higher than its ends). Maternal side on top — myometrium, dezidua basala with the endometrial veins,
 * deziduaren orria and the outer cytotrophoblastic shell — and the fetal side below: the chorionic plate
 * with the chorionic vessels, the amnion and the cord. Deziduaren trenkadak hang from the decidual plate
 * part of the way down and divide the intervillous space into kotiledoiak; each cotyledon holds a stem
 * (tertiary) villus tree whose free villi fill it, around the hollow centre where its spiral artery
 * spurts maternal blood in. Shared by the cotyledon view and the circulation close-up.
 */

const f1 = (v: number) => v.toFixed(1);

/** Fetal vessels by content: umbilical/chorionic arteries carry deoxygenated blood (blue-violet), the vein oxygenated (red). */
export const FA = '#5360d6';
export const FV = '#e0303f';

export const SX0 = 196;
export const SX1 = 804;
/** The slab bows: 0 in the middle, lower towards both ends (a slice of a disc). */
export const bow = (x: number) => 30 * ((x - 500) / 296) ** 2;
export const Y = {
  myo: 18,
  dec: 52,
  plt: 92,
  shell: 120,
  ivs: 129,
  plate: 448,
  plateB: 474,
  amn: 481,
};
export const yb = (y: number, x: number) => y + bow(x);
export const at = (x: number, y: number): Pt => [x, yb(y, x)];

export const SEPTA = [232, 411, 589, 768];
export const COTS = [321.5, 500, 678.5];
export const CORD_X = 690;
/** Full septum length: the septa stop well short of the chorionic plate. */
export const SEPT_L = (Y.plate - Y.ivs) * 0.6;

const xs = Array.from({ length: 41 }, (_, i) => lerp(SX0 - 40, SX1 + 40, i / 40));
/** A band of the slab between two (bowed) levels. */
export const band = (y0: number, y1: number) =>
  `M${xs.map((x) => `${f1(x)},${f1(yb(y0, x))}`).join('L')}L${[...xs]
    .reverse()
    .map((x) => `${f1(x)},${f1(yb(y1, x))}`)
    .join('L')}Z`;
const lineAt = (y: number, x0 = SX0 - 40, x1 = SX1 + 40) =>
  smoothPath(
    Array.from({ length: 25 }, (_, i) => at(lerp(x0, x1, i / 24), y)),
    false,
  );

/* ---------------------------------------------------------------------------------------------- */
/* Villous trees                                                                                   */
/* ---------------------------------------------------------------------------------------------- */

type Seg = { a: Pt; b: Pt; w: number };
type Tip = { p: Pt; r: number };

const quad = (p0: Pt, c: Pt, p1: Pt, u: number): Pt => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]];

/**
 * One cotyledon's tree: a stem villus rising from the plate, forking into two anchoring villi that
 * reach the shell either side of the spiral artery's opening, with free villi branching off outwards
 * and downwards — the centre stays open for the arterial jet (Langman 8-13).
 */
function cotTree(c: number, seed: number, grow: number) {
  const base: Pt = [c + (rand(seed) - 0.5) * 10, Y.plate];
  const fork: Pt = [c + (rand(seed + 1) - 0.5) * 8, Y.plate - 118];
  const paths: { pts: Pt[]; w0: number; w1: number; out: number }[] = [
    { pts: [0, 0.25, 0.5, 0.75, 1].map((u) => [lerp(base[0], fork[0], u) + Math.sin(u * 3 + seed) * 3, lerp(base[1], fork[1], u)] as Pt), w0: 15, w1: 12.5, out: 0 },
  ];
  for (const side of [-1, 1]) {
    const end: Pt = [c + side * (56 + rand(seed + side) * 8), Y.shell + 2];
    const ctl: Pt = [c + side * 70, Y.plate - 190];
    paths.push({ pts: Array.from({ length: 7 }, (_, i) => quad(fork, ctl, end, i / 6)), w0: 12, w1: 8.5, out: side });
  }
  const stem: Seg[] = [];
  const free: Seg[] = [];
  const tips: Tip[] = [];
  const twig = (from: Pt, ang: number, L: number, w: number, depth: number, key: number) => {
    const end: Pt = [from[0] + Math.sin(ang) * L, from[1] - Math.cos(ang) * L];
    free.push({ a: from, b: end, w });
    tips.push({ p: end, r: w / 2 + 1.5 });
    if (depth === 0) return;
    [0.42, 0.74].forEach((u, j) => {
      const m: Pt = [lerp(from[0], end[0], u), lerp(from[1], end[1], u)];
      const sd = j % 2 ? 1 : -1;
      twig(m, ang + sd * (0.55 + rand(key * 5 + j) * 0.5), L * (0.44 + rand(key * 3 + j) * 0.2), Math.max(3.2, w - 1.5), depth - 1, key * 7 + j + 1);
    });
  };
  paths.forEach((p, k) => {
    for (let i = 0; i < p.pts.length - 1; i++) stem.push({ a: p.pts[i], b: p.pts[i + 1], w: lerp(p.w0, p.w1, i / (p.pts.length - 2 || 1)) });
    // Free villi along each stem: outwards (away from the cotyledon centre) and partly downwards.
    const n = k === 0 ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.6) / (n + 0.2);
      const g = clamp(grow * 1.6 - u * 0.5, 0, 1);
      if (g < 0.03) continue;
      const q = p.pts[Math.min(p.pts.length - 1, Math.floor(u * (p.pts.length - 1)))];
      const q2 = p.pts[Math.min(p.pts.length - 1, Math.floor(u * (p.pts.length - 1)) + 1)];
      const from: Pt = [lerp(q[0], q2[0], (u * (p.pts.length - 1)) % 1), lerp(q[1], q2[1], (u * (p.pts.length - 1)) % 1)];
      const sd = k === 0 ? (i % 2 ? 1 : -1) : p.out;
      // On the anchoring branches every third twig points inwards (the centre is not empty, just looser).
      const dir = k > 0 && i % 3 === 2 ? -sd : sd;
      const ang = dir * (0.9 + rand(seed * 11 + k * 5 + i) * 0.9) + (dir === sd ? 0.25 * sd : 0);
      const L = (30 + rand(seed * 3 + k * 7 + i) * 22) * g * (dir === sd ? 1 : 0.7);
      twig(from, ang, L, 6, 1, seed * 13 + k * 31 + i);
    }
  });
  return { stem, free, tips, paths };
}

/** Half-trees at both ends of the slab (the neighbouring cotyledons, cut off by the frame). */
function edgeTree(x: number, side: -1 | 1, seed: number, grow: number) {
  const t = cotTree(x + side * 50, seed, grow);
  return t;
}

const bowSeg = (s: Seg): Seg => ({ a: at(s.a[0], s.a[1]), b: at(s.b[0], s.b[1]), w: s.w });
const bowTip = (t: Tip): Tip => ({ p: at(t.p[0], t.p[1]), r: t.r });
const segD = (s: Seg[]) => s.map(({ a, b }) => `M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`).join('');
const dotD = (tips: Tip[], dr: number) =>
  tips.map(({ p, r }) => `M${f1(p[0] - r - dr)},${f1(p[1])}a${f1(r + dr)},${f1(r + dr)} 0 1,0 ${f1(2 * (r + dr))},0a${f1(r + dr)},${f1(r + dr)} 0 1,0 ${f1(-2 * (r + dr))},0Z`).join('');

/** Capillary pair inside each free villus: arterial (blue-violet) on one side, venous (red) on the other. */
function capD(segs: Seg[], side: 1 | -1) {
  return segs
    .map(({ a, b, w }) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const o = w * 0.24 * side;
      return `M${f1(a[0] + (-dy / l) * o)},${f1(a[1] + (dx / l) * o)}L${f1(b[0] + (-dy / l) * o)},${f1(b[1] + (dx / l) * o)}`;
    })
    .join('');
}

/** Villi in the tissue of the whole atlas: dark syncytial rim, salmon connective core, fetal capillaries, a soft shadow behind. */
function Branches({ segs, tips = [], caps = true }: { segs: Seg[]; tips?: Tip[]; caps?: boolean }) {
  const widths = [...new Set(segs.map((s) => s.w))];
  const by = (wd: number) => segD(segs.filter((s) => s.w === wd));
  return (
    <g>
      <g transform="translate(3 4)">
        {widths.map((wd) => (
          <path key={`s${wd}`} d={by(wd)} stroke={K.shadow} strokeWidth={wd + 4} strokeLinecap="round" fill="none" />
        ))}
      </g>
      {widths.map((wd) => (
        <path key={`e${wd}`} d={by(wd)} stroke={K.synEdge} strokeWidth={wd + 5} strokeLinecap="round" fill="none" />
      ))}
      {tips.length > 0 && <path d={dotD(tips, 2.5)} fill={K.synEdge} />}
      {widths.map((wd) => (
        <path key={`o${wd}`} d={by(wd)} stroke={C.syncytio} strokeWidth={wd + 3.4} strokeLinecap="round" fill="none" />
      ))}
      {tips.length > 0 && <path d={dotD(tips, 1.7)} fill={C.syncytio} />}
      {widths.map((wd) => (
        <path key={`i${wd}`} d={by(wd)} stroke={K.meso} strokeWidth={wd} strokeLinecap="round" fill="none" />
      ))}
      {tips.length > 0 && <path d={dotD(tips, 0)} fill={K.meso} />}
      {/* light from the top left on each villus */}
      {widths.map((wd) => (
        <path key={`h${wd}`} d={by(wd)} stroke="#ffe4d6" strokeWidth={Math.max(1, wd * 0.22)} strokeLinecap="round" fill="none" opacity={0.35} transform={`translate(${-wd * 0.18} ${-wd * 0.18})`} />
      ))}
      {caps && (
        <g fill="none" strokeLinecap="round" strokeWidth={1.2} opacity={0.95}>
          <path d={capD(segs, 1)} stroke={FA} />
          <path d={capD(segs, -1)} stroke={FV} />
        </g>
      )}
    </g>
  );
}

/** Coiled spiral artery from the myometrium down through the decidua, opening into the intervillous space at (x, shell). */
export const spiralPts = (x: number): Pt[] =>
  Array.from({ length: 31 }, (_, i) => {
    const u = i / 30;
    const y = lerp(Y.myo - 30, Y.ivs, u);
    return at(x + Math.sin(i * 1.25) * 7.5 * (1 - 0.6 * u), y);
  });

/** Septum outline (decidual tissue hanging from the decidual plate), length L. */
function septumPath(x: number, L: number) {
  const top = Y.shell - 2;
  const n = 14;
  const hw = (u: number) => lerp(17, 8.5, u ** 0.8) + 12 * (1 - u) ** 8;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const y = top + u * L;
    left.push(at(x - hw(u), y));
    right.push(at(x + hw(u), y));
  }
  const tip = at(x, top + L + 8.5);
  const lEnd = left[n];
  const rEnd = right[n];
  return `M${left.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')} Q${f1(lEnd[0])},${f1(tip[1])} ${f1(tip[0])},${f1(tip[1])} Q${f1(rEnd[0])},${f1(tip[1])} ${f1(rEnd[0])},${f1(rEnd[1])} L${[...right]
    .reverse()
    .map((p) => `${f1(p[0])},${f1(p[1])}`)
    .join('L')}Z`;
}

/** Endometrial vein openings: either side of each septum, where the blood leaves the intervillous space. */
export const VEIN_X = SEPTA.flatMap((s) => [s - 27, s + 27]).filter((x) => x > SX0 - 10 && x < SX1 + 10);

export interface SectionProps {
  id: string;
  /** Free-villus branching, 0..1. */
  branch: number;
  /** Decidual septa grown, 0..1. */
  septa: number;
  /** Cotyledon compartments tinted, 0..1. */
  tint: number;
  /** Blood passing between cotyledons under the septa, 0..1. */
  cross: number;
  /** Arterial jets into the intervillous space, 0..1. */
  jets: number;
  /** Venous return to the endometrial veins, 0..1. */
  veins: number;
  /** Structure id for the cord stub. */
  cordId: string;
  reduced: boolean;
  /** Cotyledons whose jets get kit arrows (the circulation close-up). */
  arrowCots?: number[];
}

/** Defs for the section (ids from the caller, unique per instance). */
function SectionDefs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-jet`} cx="0.5" cy="0.1" r="0.9">
        <stop offset="0" stopColor="#ff9aab" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#f0566f" stopOpacity="0.5" />
        <stop offset="1" stopColor="#e0344f" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-cot`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="1" />
        <stop offset="0.75" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-cav`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#1a2440" />
        <stop offset="1" stopColor="#0d1222" />
      </linearGradient>
      <radialGradient id={`${id}-ven`} cx="0.5" cy="0.15" r="0.85">
        <stop offset="0" stopColor="#8aa0ff" stopOpacity="0.85" />
        <stop offset="0.5" stopColor="#5b74d8" stopOpacity="0.4" />
        <stop offset="1" stopColor="#3b4fa8" stopOpacity="0" />
      </radialGradient>
      {[0, 1].map((i) => (
        <linearGradient key={i} id={`${id}-mix${i}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={TINT[i]} stopOpacity="0" />
          <stop offset="0.3" stopColor={TINT[i]} />
          <stop offset="0.7" stopColor={TINT[i + 1]} />
          <stop offset="1" stopColor={TINT[i + 1]} stopOpacity="0" />
        </linearGradient>
      ))}
      <linearGradient id={`${id}-cord`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
        <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.7" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  );
}

const TINT = ['#ffc27a', '#8fd0ff', '#ff9ccc'];

export function PlacentaSection({ id, branch, septa, tint, cross, jets, veins, cordId, reduced, arrowCots = [] }: SectionProps) {
  const trees = [...COTS.map((c, i) => cotTree(c, i * 3 + 2, branch)), edgeTree(SX0 - 8, -1, 17, branch), edgeTree(SX1 + 8, 1, 23, branch)];
  const L = SEPT_L * septa;
  const stems = trees.map((tr) => tr.stem.map(bowSeg));
  const frees = trees.map((tr) => tr.free.map(bowSeg));
  const tipsB = trees.map((tr) => tr.tips.map(bowTip));
  // Plate vessel levels.
  const yA = Y.plate + 9;
  const yV = Y.plate + 18;

  return (
    <g>
      <SectionDefs id={id} />
      {/* ——— Maternal side ——— */}
      <path d={band(Y.myo - 60, Y.dec)} fill="url(#p-muscle)" />
      <path d={band(Y.myo - 60, Y.dec)} fill="#2a0d12" opacity={0.25} />
      <Part id="dezidua-basala">
        <path d={band(Y.dec, Y.plt)} fill="url(#p-decidua)" />
        <path d={band(Y.dec, Y.plt)} fill="#5a2232" opacity={0.28} />
      </Part>
      <Part id="deziduaren-orria">
        <path d={band(Y.plt, Y.shell)} fill="url(#p-decidua)" />
        <path d={band(Y.plt, Y.shell)} fill="#fff1f4" opacity={0.14} />
        <path d={lineAt(Y.plt)} fill="none" stroke="#c98a98" strokeWidth={1} opacity={0.7} />
      </Part>

      {/* Intervillous space: maternal blood */}
      <Part id="biloxka-arteko-espazioa" quiet>
        <path d={band(Y.ivs - 2, Y.plate + 2)} fill="url(#w3b-blood)" />
        <path d={band(Y.ivs - 2, Y.plate + 2)} fill="url(#w3b-vshade)" />
      </Part>
      {tint > 0.02 && (
        <Part id="kotiledoiak" show={tint}>
          {COTS.map((c, i) => {
            const x0 = SEPTA[i] + 14;
            const x1 = SEPTA[i + 1] - 14;
            const pts: Pt[] = [...Array.from({ length: 9 }, (_, k) => at(lerp(x0, x1, k / 8), Y.ivs + 2)), ...Array.from({ length: 9 }, (_, k) => at(lerp(x1, x0, k / 8), Y.plate - 4))];
            return <path key={c} d={smoothPath(pts, true, 0.12)} fill={TINT[i]} opacity={0.2} />;
          })}
          {COTS.map((c, i) => {
            const x0 = SEPTA[i] + 14;
            const x1 = SEPTA[i + 1] - 14;
            const pts: Pt[] = [...Array.from({ length: 9 }, (_, k) => at(lerp(x0, x1, k / 8), Y.ivs + 2)), ...Array.from({ length: 9 }, (_, k) => at(lerp(x1, x0, k / 8), Y.plate - 4))];
            return <path key={`g${c}`} d={smoothPath(pts, true, 0.12)} fill={`url(#${id}-cot)`} opacity={0.1} />;
          })}
          {/* Under the septa (which never reach the plate) the blood of two cotyledons runs together: their colours mix. */}
          {cross > 0.02 &&
            SEPTA.slice(1, 3).map((sx, i) => {
              const y0 = Y.shell + L + 6;
              const y1 = Y.plate - 8;
              const w = 70 + 40 * cross;
              const pts: Pt[] = [...Array.from({ length: 7 }, (_, k) => at(lerp(sx - w, sx + w, k / 6), y0)), ...Array.from({ length: 7 }, (_, k) => at(lerp(sx + w, sx - w, k / 6), y1))];
              return <path key={sx} d={smoothPath(pts, true, 0.15)} fill={`url(#${id}-mix${i})`} opacity={0.55 * cross} />;
            })}
        </Part>
      )}

      {/* Spiral arteries and their jets (behind the villi: the blood washes round them) */}
      <Part id="arteria-espiralak">
        {COTS.map((c, i) => {
          const m = at(c, Y.ivs);
          return <ellipse key={`j${c}`} cx={m[0]} cy={m[1] + 40 + 80 * jets} rx={14 + 34 * jets} ry={24 + 92 * jets} fill={`url(#${id}-jet)`} opacity={(0.28 + 0.62 * jets) * (arrowCots.length && !arrowCots.includes(i) ? 0.6 : 1)} />;
        })}
        {COTS.map((c) => {
          const d = smoothPath(spiralPts(c), false, 0.5);
          const m = at(c, Y.ivs);
          return (
            <g key={c}>
              <path d={d} fill="none" stroke="#4a0d1b" strokeWidth={9} strokeLinecap="round" />
              <path d={d} fill="none" stroke="#c9314f" strokeWidth={6.4} strokeLinecap="round" />
              {/* narrow lumen: high pressure */}
              <path d={d} fill="none" stroke="#ff8095" strokeWidth={2} strokeLinecap="round" />
              <ellipse cx={m[0]} cy={m[1] + 1} rx={7} ry={3.2} fill="#ff8095" />
            </g>
          );
        })}
      </Part>

      {/* Venous return: blood that has given up its oxygen gathers at the vein openings beside the septa. */}
      <g pointerEvents="none">
        {VEIN_X.map((x) => {
          const m = at(x, Y.ivs);
          return <ellipse key={x} cx={m[0]} cy={m[1] + 14 + 30 * veins} rx={10 + 18 * veins} ry={14 + 46 * veins} fill={`url(#${id}-ven)`} opacity={0.12 + 0.7 * veins} />;
        })}
      </g>
      {/* Outer cytotrophoblastic shell under the decidual plate */}
      <Part id="kanpoko-zorro-zitotrofoblastikoa">
        <path d={band(Y.shell, Y.ivs)} fill={K.cytoGround} />
        <g fill={K.cellNuc}>
          {Array.from({ length: 70 }, (_, i) => {
            const x = SX0 - 30 + i * 9.6;
            if (COTS.some((c) => Math.abs(x - c) < 9) || VEIN_X.some((v) => Math.abs(x - v) < 7)) return null;
            const p = at(x, (Y.shell + Y.ivs) / 2);
            return <circle key={i} cx={f1(p[0])} cy={f1(p[1])} r={1.7} />;
          })}
        </g>
        <path d={lineAt(Y.ivs)} fill="none" stroke={K.synEdge} strokeWidth={1.6} />
      </Part>

      {/* Endometrial veins: wide lacunae in the basal decidua, opening into the intervillous space near the septa */}
      <Part id="endometrio-zainak">
        {VEIN_X.map((x, i) => {
          const top = at(x, Y.dec + 14);
          const bot = at(x, Y.ivs + 1);
          const lumen = mix('#34488f', '#6f8cff', veins);
          return (
            <g key={x}>
              <path d={`M${f1(top[0])},${f1(top[1])} L${f1(bot[0])},${f1(bot[1])}`} stroke="#1d2a5c" strokeWidth={9} strokeLinecap="round" />
              <path d={`M${f1(top[0])},${f1(top[1])} L${f1(bot[0])},${f1(bot[1])}`} stroke={lumen} strokeWidth={6} strokeLinecap="round" />
              <path d={lineAt(Y.dec + 14 + (i % 2) * 6, x - 34, x + 34)} fill="none" stroke="#1d2a5c" strokeWidth={10} strokeLinecap="round" />
              <path d={lineAt(Y.dec + 14 + (i % 2) * 6, x - 34, x + 34)} fill="none" stroke={lumen} strokeWidth={7} strokeLinecap="round" />
            </g>
          );
        })}
      </Part>

      {/* Decidual septa: from the decidual plate part of the way down, lined by a syncytial layer */}
      {L > 1 && (
        <Part id="deziduaren-trenkadak">
          {SEPTA.map((s) => (
            <g key={s}>
              <path d={septumPath(s, L)} fill="url(#p-decidua)" stroke={C.syncytio} strokeWidth={3} strokeLinejoin="round" />
              <path d={septumPath(s, L)} fill="#5a2232" opacity={0.12} />
            </g>
          ))}
        </Part>
      )}

      {/* Villous trees: free villi, then the stem (tertiary, anchoring) villi over them */}
      <Part id="biloxka-askea">
        {frees.map((f, i) => (
          <Branches key={i} segs={f} tips={tipsB[i]} />
        ))}
      </Part>
      <Part id="biloxka-tertziarioa">
        {stems.map((s, i) => (
          <Branches key={i} segs={s} caps={false} />
        ))}
        {/* stem vessels: arterial and venous, continuous with the chorionic plate vessels */}
        {trees.map((tr, i) =>
          tr.paths.map((p, k) => (
            <g key={`${i}-${k}`} fill="none" strokeLinecap="round">
              {[
                { off: -2.8, c: FA },
                { off: 2.8, c: FV },
              ].map((v) => {
                const pts = p.pts.map(([x, y]) => at(x + v.off, y));
                return (
                  <g key={v.off}>
                    <path d={smoothPath(pts, false)} stroke={K.endo} strokeWidth={3.6} />
                    <path d={smoothPath(pts, false)} stroke={v.c} strokeWidth={2} />
                  </g>
                );
              })}
            </g>
          )),
        )}
      </Part>

      {/* ——— Fetal side ——— */}
      <Part id="korion-plaka">
        <path d={band(Y.plate, Y.plateB)} fill={K.meso} />
        <path d={band(Y.plate, Y.plateB)} fill="url(#p-meso-extra)" opacity={0.75} />
        <path d={band(Y.plate - 3, Y.plate + 1)} fill={C.syncytio} />
        <path d={band(Y.plate, Y.plateB)} fill="url(#w3b-vshade)" />
      </Part>
      <Part id="korioneko-odol-hodiak">
        {[
          { y: yA, w: 6, c: FA },
          { y: yV, w: 7, c: FV },
        ].map((v) => (
          <g key={v.y} fill="none" strokeLinecap="round">
            <path d={lineAt(v.y)} stroke="#5e1d2f" strokeWidth={v.w + 2} />
            <path d={lineAt(v.y)} stroke={K.endo} strokeWidth={v.w} />
            <path d={lineAt(v.y)} stroke={v.c} strokeWidth={v.w * 0.62} />
          </g>
        ))}
        {trees.map((tr, i) => {
          const b = tr.paths[0].pts[0];
          return (
            <g key={i} strokeLinecap="round">
              <path d={`M${f1(at(b[0] - 2.8, Y.plate)[0])},${f1(at(b[0] - 2.8, Y.plate - 2)[1])} L${f1(at(b[0] - 2.8, yA)[0])},${f1(at(b[0] - 2.8, yA)[1])}`} stroke={FA} strokeWidth={2} />
              <path d={`M${f1(at(b[0] + 2.8, Y.plate)[0])},${f1(at(b[0] + 2.8, Y.plate - 2)[1])} L${f1(at(b[0] + 2.8, yV)[0])},${f1(at(b[0] + 2.8, yV)[1])}`} stroke={FV} strokeWidth={2} />
            </g>
          );
        })}
      </Part>
      <Part id="amniosa">
        <path d={band(Y.plateB, Y.amn)} fill="#9fc3e6" />
        <path d={lineAt(Y.amn)} fill="none" stroke="#5f86b8" strokeWidth={1} />
      </Part>
      <path d={band(Y.amn, 700)} fill={`url(#${id}-cav)`} />

      {/* The cord: Wharton's jelly under the amnion, two arteries (blue-violet) coiling round the vein (red) */}
      <Part id={cordId}>
        {(() => {
          const top = at(CORD_X, Y.plate + 4)[1];
          const bot = 660;
          const helix = (ph: number, amp: number) =>
            smoothPath(
              Array.from({ length: 31 }, (_, i) => {
                const y = lerp(Y.plateB + 4, bot, i / 30);
                return [CORD_X + amp * Math.sin(i * 0.62 + ph), y] as Pt;
              }),
              false,
            );
          return (
            <g>
              <rect x={CORD_X - 24} y={top} width={48} height={bot - top} rx={12} fill="#efe3c4" />
              <path d={helix(Math.PI, 7)} fill="none" stroke={FV} strokeWidth={8} strokeLinecap="round" />
              <path d={helix(0, 11)} fill="none" stroke={FA} strokeWidth={5} strokeLinecap="round" />
              <path d={helix(Math.PI * 0.5, 11)} fill="none" stroke={FA} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
              <rect x={CORD_X - 24} y={top} width={48} height={bot - top} rx={12} fill={`url(#${id}-cord)`} />
              <path d={`M${CORD_X - 24},${Y.plateB + 6} V${bot} M${CORD_X + 24},${Y.plateB + 6} V${bot}`} stroke="#9fc3e6" strokeWidth={2} />
              {/* the cord vessels join the chorionic vessels */}
              <path d={`M${CORD_X - 6},${yb(yA, CORD_X)} V${Y.plateB + 14}`} stroke={FA} strokeWidth={4.4} />
              <path d={`M${CORD_X + 6},${yb(yV, CORD_X)} V${Y.plateB + 14}`} stroke={FV} strokeWidth={5.4} />
            </g>
          );
        })()}
      </Part>

      {/* Blood flow: jets down into each cotyledon's open centre, round the villi and back up to the veins */}
      <g opacity={jets}>
        {COTS.flatMap((c) =>
          [-1, 1].map((d) => {
            const o = at(c, Y.ivs + 2);
            const deep = at(c + d * 20, Y.ivs + 230);
            const turn = at(c + d * 62, Y.ivs + 210);
            const up = at(c + d * 64, Y.ivs + 70);
            const v = at(c + d * (SEPTA[1] - SEPTA[0]) * 0.5 - d * 27, Y.ivs + 2);
            return (
              <Flow
                key={`${c}${d}`}
                d={`M${f1(o[0])},${f1(o[1])} C${f1(deep[0])},${f1(deep[1])} ${f1(turn[0])},${f1(turn[1])} ${f1(up[0])},${f1(up[1])} S${f1(v[0])},${f1(v[1] + 30)} ${f1(v[0])},${f1(v[1])}`}
                n={5}
                dur={3.8}
                r={2.6}
                color="#ffa3b1"
                reduced={reduced}
              />
            );
          }),
        )}
      </g>
      {arrowCots.map((i) => {
        const c = COTS[i];
        const o = at(c, Y.ivs + 14);
        return (
          <g key={`a${i}`} opacity={jets}>
            {[-0.34, 0.34].map((k) => (
              <Arrow key={k} from={[o[0] + k * 16, o[1] + 6]} to={[o[0] + k * 120, o[1] + 150 - Math.abs(k) * 40]} bend={k * 0.18} color="#ffb3bf" width={2.2} head={9} />
            ))}
          </g>
        );
      })}
      <g opacity={veins}>
        {VEIN_X.map((x) => {
          const a = at(x, Y.ivs + 34);
          const b = at(x, Y.dec + 14);
          return <Flow key={x} d={`M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`} n={3} dur={2.4} r={2.4} color="#9fb2ff" reduced={reduced} />;
        })}
      </g>
      {cross > 0.02 &&
        SEPTA.slice(1, 3).map((s) => {
          const y = Y.shell + L + 34;
          const p0 = at(s - 70, y);
          const p1 = at(s + 70, y);
          const m = at(s, y + 40);
          return (
            <g key={s} opacity={cross}>
              <Flow d={`M${f1(p0[0])},${f1(p0[1] - 30)} Q${f1(m[0])},${f1(m[1] + 30)} ${f1(p1[0])},${f1(p1[1] - 30)}`} n={5} dur={3} r={2.8} color="#ffd166" reduced={reduced} />
              <Arrow from={p0} to={p1} bend={0.3} color="#ffd166" width={2.4} head={10} />
            </g>
          );
        })}
    </g>
  );
}
