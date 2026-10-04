'use client';

import { C, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { useId, type ReactNode } from 'react';
import { Embryo28Outline, G28, onEll } from './BrainVesicles';
import { CrestGlyph } from './CrestGlyph';
import { CrestCell, Route, along, spline } from './crestRoute';
export { CrestSection as NeuralCrestSection } from './CrestSection';

/**
 * Stage `gandor-neurala`, derivatives view — an exam-style figure in two parts that stay on screen
 * together: the head and neck of the day-28 embryo (side view: cranial crest → face, skull,
 * meninges, cranial ganglia, pharyngeal arches, heart outflow) and a schematic trunk section
 * (trunk crest → ganglia, nerves, adrenal medulla, gut wall, skin). Each step sends teal crest
 * cells from their origin along a route that stays drawn (ventral routes turquoise, dorsolateral
 * route orange, cranial streams turquoise) to the place where the derivative sits; the derivative
 * then forms there. Groups follow the notes' list (w4 §2): .50 head · .65 non-neural ·
 * .78 peripheral and autonomic nervous system + adrenal medulla · .90 epidermis.
 * Positions are schematic: not every derivative exists by day 28.
 */

const TEAL = C.neuralCrest;
const VTEAL = '#5eead4';
const GOLD = '#ffba72';
const MELANIN = '#7a3f22';

const GROUP_AT = [0.5, 0.65, 0.78, 0.9];
const GROUP_TITLE = [
  'Gandor kraneala: burua eta aurpegia',
  'Nerbio-sistemarekin lotu gabeko eratorriak',
  'Nerbio sistema periferikoa eta begetatiboa',
  'Epidermisera: melanozitoak, ile-folikuluak, azazkalak',
];
const FADE = 0.02;
/** 0..1 weight of group g: in right after its beat, out right after the next one. */
const groupW = (t: number, g: number) => seg(t, GROUP_AT[g], GROUP_AT[g] + FADE) * (g + 1 < GROUP_AT.length ? 1 - seg(t, GROUP_AT[g + 1], GROUP_AT[g + 1] + FADE) : 1);
/** Once a group has had its step it stays in the figure (dimmer), so the last frame is the whole map. */
const groupOn = (t: number, g: number) => seg(t, GROUP_AT[g], GROUP_AT[g] + 0.006);

// ---------------------------------------------------------------------------
// Head and neck: the day-28 embryo outline (same as burmuin-bexikulak), magnified on the head.
// ---------------------------------------------------------------------------

const g = G28;
const HS = 1.2;
const H0: Pt = [495, 200];
const HC: Pt = [404, 266];
const hp = (q: Pt): Pt => [HC[0] + (q[0] - H0[0]) * HS, HC[1] + (q[1] - H0[1]) * HS];
const HEAD_VIEW = `translate(${HC[0]} ${HC[1]}) scale(${HS}) translate(${-H0[0]} ${-H0[1]})`;
const sp = (u: number, d: number): Pt => spineAt(g.S, u, d).p;
const mid = (a: Pt, b: Pt, k = 0.5): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** Neural tube, rostral → caudal: forebrain, midbrain (top of the head), hindbrain, cord down the back. */
const TUBE: Pt[] = [onEll(g.cran, 150, 0.42), onEll(g.cran, -150, 0.5), onEll(g.cran, -95, 0.55), mid(onEll(g.cran, -95, 0.55), sp(0, 34)), sp(0, 30), sp(0.05, 16), sp(0.1, 13), sp(0.16, 12)];
/** The cranial crest: a strip along the dorsal side of the tube (between tube and skin). */
const CREST_HEAD: Pt[] = [onEll(g.cran, -150, 0.8), onEll(g.cran, -125, 0.86), onEll(g.cran, -100, 0.88), onEll(g.cran, -78, 0.9), sp(0.0, 7), sp(0.04, 6), sp(0.08, 6), sp(0.12, 6), sp(0.16, 6)];
const crestHeadLine = spline(CREST_HEAD, 6);

interface Dest {
  id: string;
  group: number;
  /** route control points (embryo or section units), origin first */
  path: Pt[];
  /** glyph position */
  at: Pt;
  /** label */
  lx: number;
  ly: number;
}

const ORIGIN = {
  fore: onEll(g.cran, -140, 0.83),
  mid: onEll(g.cran, -100, 0.88),
  hind: sp(0.0, 7),
  vagal: sp(0.08, 6),
  cardiac: sp(0.11, 6),
};

const LX = 16;
const HEAD: Dest[] = [
  { id: 'buru-lepo-dermisa', group: 0, path: [ORIGIN.mid, onEll(g.cran, -122, 0.96), onEll(g.cran, -148, 0.98), onEll(g.cran, -165, 0.95)], at: onEll(g.cran, -165, 0.95), lx: LX, ly: 208 },
  { id: 'meningeak-kraneal', group: 0, path: [ORIGIN.fore, onEll(g.cran, -134, 0.7), onEll(g.cran, -122, 0.6)], at: onEll(g.cran, -122, 0.6), lx: LX, ly: 160 },
  { id: 'nerbio-kranialen-gongoilak', group: 0, path: [ORIGIN.hind, sp(0.0, 20), mid(g.bars[1].top, sp(0.0, 30), 0.45)], at: mid(g.bars[1].top, sp(0.0, 30), 0.45), lx: LX, ly: 112 },
  { id: 'buru-aurpegi-hezurrak', group: 0, path: [ORIGIN.fore, onEll(g.cran, -160, 0.8), onEll(g.cran, 175, 0.74), onEll(g.cran, 150, 0.6)], at: onEll(g.cran, 150, 0.6), lx: LX, ly: 256 },
  { id: 'odontoblastoak', group: 0, path: [ORIGIN.hind, sp(0.0, 26), g.bars[0].top, mid(g.bars[0].top, g.bars[0].bot, 0.72)], at: mid(g.bars[0].top, g.bars[0].bot, 0.72), lx: LX, ly: 304 },
  { id: 'aurpegi-hodi-muskulu-leuna', group: 1, path: [ORIGIN.fore, onEll(g.cran, -175, 0.6), onEll(g.cran, 140, 0.7), [g.face[0] - 12, g.face[1] - 2]], at: [g.face[0] - 12, g.face[1] - 2], lx: LX, ly: 352 },
  { id: 'tiroide-c-zelulak', group: 1, path: [ORIGIN.vagal, sp(0.08, 22), g.bars[3].top, mid(g.bars[3].top, g.bars[3].bot, 0.9)], at: mid(g.bars[3].top, g.bars[3].bot, 0.9), lx: LX, ly: 400 },
  { id: 'bihotz-trenkada-tronkokonala', group: 1, path: [ORIGIN.cardiac, sp(0.11, 24), mid(g.bars[2].top, g.bars[3].top), mid(g.bars[2].bot, g.bars[3].bot, 1.15), onEll(g.heart, -140, 0.55)], at: onEll(g.heart, -140, 0.55), lx: LX, ly: 448 },
];

// ---------------------------------------------------------------------------
// Trunk: a schematic transverse section (dorsal up), local units, body = ellipse rx 100 × ry 200.
// ---------------------------------------------------------------------------

const SS = 0.9;
const S0: Pt = [702, 328];
const spx = (q: Pt): Pt => [S0[0] + q[0] * SS, S0[1] + q[1] * SS];
const SEC_VIEW = `translate(${S0[0]} ${S0[1]}) scale(${SS})`;
const RX = 100;
const RY = 200;
/** A point on (k = 1) or inside (k < 1) the body outline at angle th (degrees from dorsal, clockwise). */
const rim = (th: number, k = 1): Pt => [RX * k * Math.sin((th * Math.PI) / 180), -RY * k * Math.cos((th * Math.PI) / 180)];
/** The dorsolateral path: just under the epidermis, from th0 to th1. */
const under = (th0: number, th1: number, n = 8): Pt[] => Array.from({ length: n + 1 }, (_, i) => rim(lerp(th0, th1, i / n), 0.9));

const SEC = {
  crest: [0, -178] as Pt,
  tube: [0, -130] as Pt,
  drg: [45, -128] as Pt,
  chain: [31, -84] as Pt,
  noto: [0, -82] as Pt,
  aorta: [0, -48] as Pt,
  pre: [0, -27] as Pt,
  adrenal: [42, -18] as Pt,
  gut: [0, 72] as Pt,
  limbTip: [136, 58] as Pt,
};
const NERVE: Pt[] = spline([[48, -113], [62, -88], [74, -48], [79, -8], [86, 22]], 8);
const MEL_TH = [27, 41];
const FOLL_TH = 146;
/** Bulb of the hair follicle: the epidermal peg grows ~17 units in from the surface. */
const folliclePt: Pt = (() => {
  const p = rim(FOLL_TH, 1);
  const n = Math.hypot(p[0], p[1]);
  return [p[0] - (p[0] / n) * 17, p[1] - (p[1] / n) * 17];
})();

const TRUNK: Dest[] = [
  { id: 'gongoil-errakideoak', group: 2, path: [SEC.crest, [16, -172], [32, -156], [42, -140]], at: SEC.drg, lx: 988, ly: 330 },
  { id: 'glia-zelulak', group: 2, path: [SEC.crest, [18, -176], [40, -160], [56, -138]], at: [57, -124], lx: 988, ly: 285 },
  { id: 'schwann-zelulak', group: 2, path: [[48, -113], [62, -88], [72, -58]], at: [70, -64], lx: 988, ly: 375 },
  { id: 'gongoil-sinpatikoak', group: 2, path: [SEC.crest, [14, -170], [26, -150], [27, -112], [30, -92]], at: SEC.chain, lx: 988, ly: 420 },
  { id: 'giltzurrun-gaineko-muina', group: 2, path: [[31, -76], [36, -50], [41, -26]], at: SEC.adrenal, lx: 988, ly: 510 },
  { id: 'gongoil-parasinpatikoak', group: 2, path: [[4, -22], [4, 10], [6, 40], [16, 56]], at: [18, 60], lx: 988, ly: 555 },
  { id: 'melanozitoak', group: 3, path: [SEC.crest, ...under(8, MEL_TH[1] - 3, 4), rim(MEL_TH[1], 0.965)], at: rim(MEL_TH[0], 0.965), lx: 988, ly: 240 },
  { id: 'ile-folikuluak', group: 3, path: [SEC.crest, ...under(8, FOLL_TH - 4, 14), folliclePt], at: folliclePt, lx: 988, ly: 600 },
  { id: 'azazkalak', group: 3, path: [SEC.crest, ...under(8, 84, 8), [104, 40], [124, 54]], at: SEC.limbTip, lx: 988, ly: 465 },
];

const ALL = [...HEAD, ...TRUNK];
const isHead = (d: Dest) => HEAD.includes(d);
const routeOf = (d: Dest) => spline(d.path, 8);
/** Travel window of one destination (the route grows with its lead cell; the derivative forms on arrival). */
function travel(d: Dest) {
  const i = ALL.filter((q) => q.group === d.group).indexOf(d);
  const step = d.group === 0 ? 0.008 : d.group === 1 ? 0.01 : d.group === 2 ? 0.006 : 0.006;
  const a = GROUP_AT[d.group] + 0.005 + step * i;
  return { a, b: a + (d.group === 2 ? 0.034 : 0.04) };
}
/** Route colour: dorsolateral (to the epidermis) orange, every other stream turquoise. */
const routeColor = (d: Dest) => (d.group === 3 ? GOLD : VTEAL);

// ---------------------------------------------------------------------------
// Drawings
// ---------------------------------------------------------------------------

const part = (id: string, node: ReactNode, show = 1) => (
  <Part id={id} show={show}>
    {node}
  </Part>
);

function Travellers({ d, t, k }: { d: Dest; t: number; k: number }) {
  const { a, b } = travel(d);
  const v = seg(t, a, b);
  if (v <= 0.005 || v >= 0.999) return null;
  const route = routeOf(d);
  return (
    <>
      {[0, 1, 2].map((i) => {
        const w = Math.max(0, v - i * 0.11);
        if (w <= 0.005) return null;
        const { p, ang } = along(route, w);
        return <CrestCell key={i} x={p[0]} y={p[1]} ang={ang} s={k * (1 - i * 0.12)} color={TEAL} opacity={1 - i * 0.18} />;
      })}
    </>
  );
}

function RouteOf({ d, t, u }: { d: Dest; t: number; u: number }) {
  const { a, b } = travel(d);
  const prog = seg(t, a, b);
  if (prog <= 0.01) return null;
  const on = groupOn(t, d.group);
  const now = groupW(t, d.group);
  return <Route pts={routeOf(d)} color={routeColor(d)} progress={prog} width={2.6} u={u} head={10} show={on * (0.42 + 0.58 * now)} />;
}

/** How formed a derivative is (0 before its cells arrive). */
const formed = (d: Dest, t: number) => {
  const { b } = travel(d);
  return seg(t, b - 0.004, b + 0.012);
};
/** Clickable from the start of its step (faint), fully drawn once formed, and kept afterwards. */
const destShow = (d: Dest, t: number) => groupOn(t, d.group) * (0.22 + 0.78 * formed(d, t));

function HeadDrawing({ t, uid }: { t: number; uid: string }) {
  const crestDim = lerp(1, 0.7, seg(t, GROUP_AT[0], GROUP_AT[0] + FADE));
  return (
    <g mask={`url(#${uid}-hm)`}>
      <g transform={HEAD_VIEW}>
        <Embryo28Outline />
        {part('hodi-neurala', <path d={smoothPath(TUBE, false, 0.5)} fill="none" stroke={C.neural} strokeWidth={15} strokeLinecap="round" opacity={0.55} />, 1)}
        {HEAD.map((d) => (
          <RouteOf key={d.id} d={d} t={t} u={1 / HS} />
        ))}
        {part(
          'gandor-neurala',
          <g>
            <path d={smoothPath(crestHeadLine, false, 0.5)} fill="none" stroke={TEAL} strokeWidth={7} strokeLinecap="round" opacity={0.28} />
            {Array.from({ length: 15 }, (_, i) => {
              const { p, ang } = along(crestHeadLine, (i + 0.5) / 15);
              return <CrestCell key={i} x={p[0]} y={p[1]} ang={ang} mes={0.75} s={0.62} color={TEAL} opacity={crestDim} />;
            })}
          </g>,
        )}
        {HEAD.map((d) => {
          const f = formed(d, t);
          return (
            <g key={d.id}>
              {part(
                d.id,
                <g transform={`translate(${d.at[0]} ${d.at[1]}) scale(${lerp(0.32, 0.5, f)}) translate(${-d.at[0]} ${-d.at[1]})`}>
                  <CrestGlyph id={d.id} at={d.at} color={VTEAL} />
                </g>,
                destShow(d, t),
              )}
              <Travellers d={d} t={t} k={1.05} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Melanocyte({ at, ang, s = 1 }: { at: Pt; ang: number; s?: number }) {
  return (
    <g transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${s})`}>
      {[[-7, -6], [-2, -8.5], [4, -7.5], [8, -3]].map(([x, y], i) => (
        <path key={i} d={`M0,0Q${x * 0.3},${y * 0.7} ${x},${y}`} fill="none" stroke={GOLD} strokeWidth={1.3} strokeLinecap="round" />
      ))}
      <ellipse rx={5} ry={3.6} fill={MELANIN} stroke={GOLD} strokeWidth={1} />
      {[[-2, 1], [2, -0.6], [0.5, 1.6]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.7} fill="#2a1206" />
      ))}
    </g>
  );
}

function Ganglion({ c, rx, ry, n }: { c: Pt; rx: number; ry: number; n: number }) {
  return (
    <g>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={TEAL} fillOpacity={0.26} stroke={VTEAL} strokeWidth={1.2} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.5;
        const r = n > 4 ? (i % 2 ? 0.55 : 0.25) : 0.4;
        return <circle key={i} cx={c[0] + Math.cos(a) * rx * r} cy={c[1] + Math.sin(a) * ry * r} r={2.6} fill="#1f9e8f" stroke={VTEAL} strokeWidth={0.6} />;
      })}
    </g>
  );
}

function TrunkDrawing({ t, uid }: { t: number; uid: string }) {
  const body = Array.from({ length: 73 }, (_, i) => rim(i * 5));
  // The upper limb bud: a paddle off the ventrolateral body wall (the future fingertips carry the nails).
  const limb = smoothPath([rim(78), [118, 18], [136, 38], [142, 60], [130, 82], [104, 96], rim(118)], false, 0.5);
  const sh = (d: Dest) => destShow(d, t);
  const D = Object.fromEntries(TRUNK.map((d) => [d.id, d])) as Record<string, Dest>;
  const crestDim = lerp(1, 0.7, seg(t, GROUP_AT[2], GROUP_AT[2] + FADE));
  return (
    <g transform={SEC_VIEW}>
      <defs>
        <radialGradient id={`${uid}-sb`} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#3a2622" />
          <stop offset="100%" stopColor="#24181a" />
        </radialGradient>
      </defs>
      {/* body: mesenchyme inside, epidermis (surface ectoderm) all round, limb bud on the right */}
      <path d={limb} fill="#2e1f1f" stroke={C.surfaceEcto} strokeWidth={6} strokeOpacity={0.75} />
      {part('azaleko-ektodermoa', <path d={smoothPath(body, true, 0.5)} fill={`url(#${uid}-sb)`} stroke={C.surfaceEcto} strokeWidth={7} strokeOpacity={0.75} />, 1)}
      <path d={smoothPath([rim(80, 0.97), [112, 22], [128, 40], [134, 60], [124, 78], [102, 90], rim(116, 0.97)], false, 0.5)} fill="#2e1f1f" />
      {/* peritoneal cavity with the gut hanging from its mesentery */}
      <ellipse cx={0} cy={64} rx={70} ry={62} fill="#170f12" />
      <path d="M-5,-38 L-5,48 L5,48 L5,-38Z" fill="#4a2a2c" />
      <ellipse cx={SEC.gut[0]} cy={SEC.gut[1]} rx={28} ry={24} fill="#5a2a2e" stroke="#8a4a4e" strokeWidth={1} />
      <ellipse cx={SEC.gut[0]} cy={SEC.gut[1]} rx={15} ry={12} fill={C.endoderm} opacity={0.85} />
      <ellipse cx={SEC.gut[0]} cy={SEC.gut[1]} rx={6} ry={4.5} fill="#1a1208" />
      {/* axial structures */}
      <circle cx={SEC.noto[0]} cy={SEC.noto[1]} r={8} fill={C.notochord} opacity={0.7} />
      <circle cx={SEC.aorta[0]} cy={SEC.aorta[1]} r={11} fill="#7f1d1d" stroke="#fca5a5" strokeWidth={1.4} />
      {part(
        'hodi-neurala',
        <g>
          <ellipse cx={SEC.tube[0]} cy={SEC.tube[1]} rx={23} ry={35} fill={C.neural} opacity={0.85} />
          <ellipse cx={SEC.tube[0]} cy={SEC.tube[1]} rx={3.5} ry={20} fill="#0b1226" />
          {/* roots: dorsal (into the tube from the ganglion) and ventral (out of the tube) */}
          {[-1, 1].map((s) => (
            <g key={s} stroke={C.neural} strokeWidth={2.4} strokeLinecap="round" opacity={0.8}>
              <path d={`M${s * 21},-118 L${s * 46},-110`} />
            </g>
          ))}
        </g>,
        1,
      )}

      {/* spinal nerves (both sides) */}
      {[-1, 1].map((s) => (
        <path key={s} d={smoothPath(NERVE.map(([x, y]): Pt => [s * x, y]), false, 0.5)} fill="none" stroke="#c7d2fe" strokeWidth={2.2} opacity={0.55} strokeLinecap="round" />
      ))}

      {/* routes (right side; the left side is the mirror image and shows the result only) */}
      {TRUNK.map((d) => (
        <RouteOf key={d.id} d={d} t={t} u={1 / SS} />
      ))}

      {/* crest origin over the tube */}
      {part(
        'gandor-neurala',
        <g>
          {[-9, 0, 9].map((x, i) => (
            <CrestCell key={i} x={x} y={SEC.crest[1] + (i === 1 ? -2 : 1)} ang={x < 0 ? 180 : 0} mes={0.7} s={0.95} color={TEAL} opacity={crestDim} />
          ))}
        </g>,
      )}

      {/* derivatives: drawn on both sides, the right side is the one named */}
      {part(
        'gongoil-errakideoak',
        <g>
          {[-1, 1].map((s) => (
            <Ganglion key={s} c={[s * SEC.drg[0], SEC.drg[1]]} rx={11} ry={15} n={5} />
          ))}
        </g>,
        sh(D['gongoil-errakideoak']),
      )}
      {part(
        'glia-zelulak',
        <g>
          {[-1, 1].map((s) =>
            [-60, -10, 40, 100, 160, 220].map((a, i) => {
              const r = (a * Math.PI) / 180;
              const c: Pt = [s * SEC.drg[0] + Math.cos(r) * 12.5, SEC.drg[1] + Math.sin(r) * 16.5];
              return (
                <g key={`${s}${i}`}>
                  <path d={`M${c[0] - 3.5},${c[1]}h7M${c[0]},${c[1] - 3.5}v7`} stroke="#a7f3d0" strokeWidth={1} strokeLinecap="round" />
                  <circle cx={c[0]} cy={c[1]} r={2} fill="#a7f3d0" />
                </g>
              );
            }),
          )}
        </g>,
        sh(D['glia-zelulak']),
      )}
      {part(
        'schwann-zelulak',
        <g>
          {[-1, 1].map((s) =>
            [0.22, 0.42, 0.62].map((v, i) => {
              const { p, ang } = along(NERVE, v);
              return (
                <g key={`${s}${i}`} transform={`translate(${s * p[0]} ${p[1]}) rotate(${s > 0 ? ang : 180 - ang})`}>
                  <rect x={-6} y={-3.6} width={12} height={7.2} rx={3.6} fill={TEAL} fillOpacity={0.55} stroke={VTEAL} strokeWidth={0.9} />
                  <circle cx={-1} cy={-1.4} r={1.4} fill="#0f4f49" />
                </g>
              );
            }),
          )}
        </g>,
        sh(D['schwann-zelulak']),
      )}
      {part(
        'gongoil-sinpatikoak',
        <g>
          {[-1, 1].map((s) => (
            <Ganglion key={s} c={[s * SEC.chain[0], SEC.chain[1]]} rx={8} ry={6.5} n={3} />
          ))}
          {/* preaortic ganglion, in front of the aorta */}
          <Ganglion c={SEC.pre} rx={9} ry={5} n={3} />
        </g>,
        sh(D['gongoil-sinpatikoak']),
      )}
      {/* adrenal: cortex (mesoderm) round a crest-derived medulla */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={s * SEC.adrenal[0]} cy={SEC.adrenal[1]} rx={15} ry={12} fill="#9a5b34" opacity={0.5 + 0.35 * groupOn(t, 2)} stroke="#d6a27a" strokeWidth={0.8} />
      ))}
      {part(
        'giltzurrun-gaineko-muina',
        <g>
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={s * SEC.adrenal[0]} cy={SEC.adrenal[1]} rx={7} ry={5.5} fill={TEAL} stroke={VTEAL} strokeWidth={0.9} />
          ))}
        </g>,
        sh(D['giltzurrun-gaineko-muina']),
      )}
      {part(
        'gongoil-parasinpatikoak',
        <g>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.3;
            return <circle key={i} cx={SEC.gut[0] + Math.cos(a) * 21} cy={SEC.gut[1] + Math.sin(a) * 18} r={2.8} fill={TEAL} stroke="#0f4f49" strokeWidth={0.6} />;
          })}
        </g>,
        sh(D['gongoil-parasinpatikoak']),
      )}
      {part(
        'melanozitoak',
        <g>
          {[-1, 1].flatMap((s) =>
            MEL_TH.map((th) => {
              const p = rim(th, 0.985);
              return <Melanocyte key={`${s}${th}`} at={[s * p[0], p[1]]} ang={s * th} s={1} />;
            }),
          )}
        </g>,
        sh(D['melanozitoak']),
      )}
      {part(
        'ile-folikuluak',
        <g>
          {[-1, 1].map((s) => {
            const p = rim(FOLL_TH, 1);
            const a = (Math.atan2(-p[1], -s * p[0]) * 180) / Math.PI - 90;
            return (
              <g key={s} transform={`translate(${s * p[0]} ${p[1]}) rotate(${a})`}>
                {/* epidermal peg growing in, with the bulb at its base */}
                <path d="M-5,0 L-4,16 Q0,22 4,16 L5,0" fill={C.surfaceEcto} fillOpacity={0.4} stroke={GOLD} strokeWidth={1.2} />
                <circle cx={0} cy={17} r={4} fill={GOLD} fillOpacity={0.65} />
                <path d="M0,15 L0,-6" stroke="#fde68a" strokeWidth={1.3} strokeLinecap="round" />
              </g>
            );
          })}
        </g>,
        sh(D['ile-folikuluak']),
      )}
      {part(
        'azazkalak',
        <g transform={`translate(${SEC.limbTip[0]} ${SEC.limbTip[1]}) rotate(60)`}>
          <path d="M-8,4 V-3 Q-8,-10 0,-10 T8,-3 V4 Z" fill={GOLD} fillOpacity={0.4} stroke={GOLD} strokeWidth={1.3} />
          <path d="M-5,-5 Q0,-7 5,-5" fill="none" stroke="#fde68a" strokeWidth={1} />
        </g>,
        sh(D['azazkalak']),
      )}

      {TRUNK.map((d) => (
        <Travellers key={d.id} d={d} t={t} k={1.3} />
      ))}
    </g>
  );
}

function TrapBox({ t }: { t: number }) {
  const show = seg(t, GROUP_AT[3], GROUP_AT[3] + FADE);
  if (show <= 0.01) return null;
  return (
    <g opacity={show}>
      <rect x={16} y={482} width={372} height={92} rx={12} fill="#251f1b" stroke={GOLD} strokeOpacity={0.55} />
      <Note x={30} y={503} align="start" tone="accent" size={14.5}>
        Epidermisera iristen direnak (apunteak):
      </Note>
      <Note x={30} y={527} align="start" size={14}>
        Melanozitoak, ile-folikuluak, azazkalak
      </Note>
      <Note x={30} y={552} align="start" tone="dim" size={13}>
        Oharra: liburuetan, ile-folikuluak eta azazkalak azaleko ektodermotik.
      </Note>
    </g>
  );
}

function labels(t: number) {
  return (
    <>
      {(() => {
        // The name points where the crest cells are leaving in this step: the head first, then the trunk.
        const o = spx(SEC.crest);
        const h = hp(along(crestHeadLine, 0.62).p);
        const trunk = groupOn(t, 2);
        return (
          <>
            <Label id="gandor-neurala" x={586} y={98} ax={h[0]} ay={h[1]} align="middle" small show={1 - trunk} />
            <Label id="gandor-neurala" x={586} y={98} ax={o[0] + 4} ay={o[1] - 4} align="middle" small show={trunk} />
          </>
        );
      })()}
      {ALL.map((d) => {
        const w = groupOn(t, d.group) * seg(t, travel(d).b - 0.01, travel(d).b + 0.004);
        if (w <= 0.01) return null;
        const [ax, ay] = isHead(d) ? hp(d.at) : spx(d.at);
        // Trunk names in full size (one ordered column, spaced so no leader crosses another); head names stay small to clear the face.
        return <Label key={d.id} id={d.id} x={d.lx} y={d.ly} ax={ax} ay={ay} align={isHead(d) ? 'start' : 'end'} small={isHead(d)} show={w} />;
      })}
    </>
  );
}

export function NeuralCrestDerivatives({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        {/* The head figure fades out where the body continues (to the right and downwards). */}
        <linearGradient id={`${uid}-hx`} gradientUnits="userSpaceOnUse" x1={548} x2={590} y1={0} y2={0}>
          <stop offset={0} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        <linearGradient id={`${uid}-hy`} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={430} y2={474}>
          <stop offset={0} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}-hmx`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={0} y={0} width={1000} height={640} fill={`url(#${uid}-hx)`} />
        </mask>
        <mask id={`${uid}-hm`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect x={0} y={0} width={1000} height={640} fill={`url(#${uid}-hy)`} mask={`url(#${uid}-hmx)`} />
        </mask>
      </defs>
      <Note x={500} y={43} tone="accent" size={16} show={1 - seg(t, GROUP_AT[0], GROUP_AT[0] + FADE)}>
        Gandor neurala: hodi neuralaren luzeran, buruan eta enborrean
      </Note>
      {GROUP_TITLE.map((title, i) => (
        <Note key={title} x={500} y={43} tone="accent" size={16} show={groupW(t, i)}>
          {title}
        </Note>
      ))}
      <HeadDrawing t={t} uid={uid} />
      <TrunkDrawing t={t} uid={uid} />
      <Note x={404} y={470} tone="dim" size={13}>
        Burua eta lepoa (albotik)
      </Note>
      <Note x={702} y={530} tone="dim" size={13}>
        Enborra (ebaki zeharkakoa)
      </Note>
      {labels(t)}
      <TrapBox t={t} />
      <Note x={500} y={598} size={14}>
        Eratorrien helmugak, eskematikoki: ez dira denak 28. egunean helduak.
      </Note>
      <Note x={500} y={622} size={13} show={groupOn(t, 2)}>
        Gongoil enterikoak: gandor bagal eta sakraletik; muina: zelula endokrinoak.
      </Note>
    </g>
  );
}
