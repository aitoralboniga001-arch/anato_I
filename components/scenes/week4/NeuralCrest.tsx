'use client';

import { C, Cell, Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { Embryo28Outline, G28, onEll } from './BrainVesicles';
import { CrestGlyph } from './CrestGlyph';
export { CrestSection as NeuralCrestSection } from './CrestSection';

const TEAL = C.neuralCrest;
const ORANGE = '#ffba72';
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Point at fraction u (by length) along a polyline, with its direction. */
function along(pts: Pt[], u: number): { p: Pt; ang: number } {
  const lens: number[] = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = dist(pts[i - 1], pts[i]);
    lens.push(l);
    tot += l;
  }
  let want = Math.min(1, Math.max(0, u)) * tot;
  for (let i = 0; i < lens.length; i++) {
    if (want <= lens[i] || i === lens.length - 1) {
      const k = lens[i] > 0 ? Math.min(1, want / lens[i]) : 0;
      const a = pts[i];
      const b = pts[i + 1];
      return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
    }
    want -= lens[i];
  }
  return { p: pts[pts.length - 1], ang: 0 };
}

interface Dest {
  id: string;
  at: Pt;
  /** where along the neural tube the cells leave (0 = cranial end … 1 = tail) */
  u: number;
  x: number;
  y: number;
  group: number;
}

const g = G28;
const sp = (u: number, d: number): Pt => spineAt(g.S, u, d).p;
const mid = (a: Pt, b: Pt, k = 0.5): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const L = 330;
const R = 740;

const DESTS: Dest[] = [
  // Head: skull/face bones, meninges, cranial ganglia, dermis, odontoblasts, facial vessel muscle
  { id: 'meningeak-kraneal', at: onEll(g.cran, -150, 0.78), u: 0.03, x: L, y: 145, group: 0 },
  { id: 'buru-aurpegi-hezurrak', at: onEll(g.cran, 175, 0.72), u: 0.05, x: L, y: 190, group: 0 },
  { id: 'nerbio-kranialen-gongoilak', at: mid(g.bars[1].top, sp(0.0, 30), 0.55), u: 0.04, x: L, y: 100, group: 0 },
  { id: 'buru-lepo-dermisa', at: sp(0.02, 3), u: 0.09, x: R, y: 80, group: 0 },
  { id: 'odontoblastoak', at: mid(g.bars[0].top, g.bars[0].bot, 0.75), u: 0.06, x: L, y: 235, group: 0 },
  { id: 'aurpegi-hodi-muskulu-leuna', at: [g.face[0] - 10, g.face[1]], u: 0.07, x: L, y: 280, group: 1 },
  { id: 'tiroide-c-zelulak', at: mid(g.bars[3].top, g.bars[3].bot, 0.8), u: 0.08, x: R, y: 200, group: 1 },
  { id: 'bihotz-trenkada-tronkokonala', at: onEll(g.heart, -150, 0.55), u: 0.05, x: L, y: 325, group: 1 },
  // Trunk: skin melanocytes, peripheral nerve glia, ganglia, adrenal medulla
  { id: 'melanozitoak', at: sp(0.36, 2), u: 0.36, x: R, y: 300, group: 3 },
  { id: 'ile-folikuluak', at: sp(0.47, 2), u: 0.47, x: R, y: 350, group: 3 },
  { id: 'azazkalak', at: sp(0.58, 2), u: 0.58, x: R, y: 400, group: 3 },
  { id: 'glia-zelulak', at: sp(0.3, 12), u: 0.3, x: R, y: 250, group: 2 },
  { id: 'schwann-zelulak', at: sp(0.62, 24), u: 0.62, x: R, y: 545, group: 2 },
  { id: 'gongoil-errakideoak', at: sp(0.42, 22), u: 0.42, x: R, y: 390, group: 2 },
  { id: 'gongoil-sinpatikoak', at: sp(0.46, 44), u: 0.46, x: R, y: 440, group: 2 },
  { id: 'giltzurrun-gaineko-muina', at: sp(0.55, 62), u: 0.55, x: R, y: 490, group: 2 },
  { id: 'gongoil-parasinpatikoak', at: sp(0.5, 78), u: 0.12, x: L, y: 420, group: 2 },
];

/** Each group is explained by its own step: head (.50), non-neural (.65), nerves and ganglia (.78), melanocytes (.90). */
const GROUP_AT = [0.5, 0.65, 0.78, 0.9];
const GROUP_COLOR = ['#2dd4bf', '#c4b5fd', '#7dd3fc', ORANGE];
const GROUP_TITLE = [
  'Gandor kraneala: burua eta aurpegia',
  'Nerbio-sistemarekin lotu gabeko eratorriak',
  'Nerbio sistema periferikoa eta begetatiboa',
  'Epidermisera: melanozitoak, ile-folikuluak, azazkalak',
];

function groupIndex(d: Dest) {
  return DESTS.filter((q) => q.group === d.group).indexOf(d);
}
/** Travel window of one destination. */
function travel(d: Dest) {
  const a = GROUP_AT[d.group] + 0.004 * groupIndex(d);
  return { a, b: a + 0.046 };
}

const originOf = (d: Dest): Pt => sp(d.u, 8);
function routeOf(d: Dest): Pt[] {
  const o = originOf(d);
  const e = d.at;
  const dx = e[0] - o[0];
  const dy = e[1] - o[1];
  const bend = d.group === 3 ? 0.06 : 0.16;
  const c: Pt = [o[0] + dx / 2 - dy * bend, o[1] + dy / 2 + dx * bend];
  return Array.from({ length: 21 }, (_, i): Pt => {
    const k = i / 20;
    return [(1 - k) * (1 - k) * o[0] + 2 * (1 - k) * k * c[0] + k * k * e[0], (1 - k) * (1 - k) * o[1] + 2 * (1 - k) * k * c[1] + k * k * e[1]];
  });
}

// Group changes happen at beat boundaries; every trip + differentiation finishes BEFORE the hold.
const activeGroup = (t: number) => t < 0.5 ? -1 : t < 0.65 ? 0 : t < 0.78 ? 1 : t < 0.9 ? 2 : 3;
/** Whole embryo first; then the head for the cranial and non-neural groups, then the trunk for nerves and skin. */
const ZOOMS: [number, number, number, number, number][] = [
  [520, 325, 1.08, 505, 317],
  [490, 195, 1.8, 555, 320],
  [630, 390, 1.5, 545, 330],
];
function mapZoomAt(t: number) {
  const k = seg(t, 0.488, 0.512) * 0.5 + seg(t, 0.768, 0.792) * 0.5;
  const [A, B] = k < 0.5 ? [ZOOMS[0], ZOOMS[1]] : [ZOOMS[1], ZOOMS[2]];
  const u = k < 0.5 ? k * 2 : (k - 0.5) * 2;
  const m = (i: number) => lerp(A[i], B[i], u);
  return zoom(m(0), m(1), m(2), m(3), m(4));
}

function MapDrawing({ t }: SceneProps) {
  const active = activeGroup(t);
  const mapZoom = mapZoomAt(t);
  const crestLine = Array.from({ length: 30 }, (_, i) => sp(0.02 + (0.93 * i) / 29, 8));
  return <g transform={mapZoom.transform}>
    <g opacity={0.55}><Embryo28Outline /></g>
    <Part id="hodi-neurala" show={0.4}>
      <path d={smoothPath(crestLine.map(([x, y]): Pt => [x - 7, y]), false)} fill="none" stroke={C.neural} strokeWidth={12} strokeLinecap="round" />
    </Part>
    <Part id="gandor-neurala">
      <path d={smoothPath(crestLine, false)} fill="none" stroke="transparent" strokeWidth={18} />
      {Array.from({ length: 21 }, (_, i) => {
        const p = sp(0.03 + (0.92 * i) / 20, 8);
        return <Cell key={i} x={p[0]} y={p[1]} r={4} rx={3.5} ry={5} color={TEAL} nucleus="#155e59" opacity={active < 0 ? 1 : 0.42} />;
      })}
    </Part>
    {DESTS.map(d => {
      const { a, b } = travel(d);
      const col = GROUP_COLOR[d.group];
      const route = routeOf(d);
      const u = seg(t, a, b);
      const arrive = seg(t, b - 0.002, b + 0.014);
      const current = active === d.group;
      const opacity = current ? 1 : 0.16;
      if (t < GROUP_AT[d.group]) return null;
      return <g key={d.id} opacity={opacity}>
        <path d={smoothPath(route, false, 0.5)} fill="none" stroke={col} strokeWidth={2.5} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - u} opacity={0.6} pointerEvents="none" />
        <Part id="gandor-neurala" show={1 - arrive}>
          {[0, 1, 2].map(i => {
            const { p, ang } = along(route, Math.max(0, u - i * 0.12));
            return <Cell key={i} x={p[0]} y={p[1]} r={5.5} rx={7 - i} ry={5 - i * 0.5} color={col} nucleus="#153e44" rotate={ang} />;
          })}
        </Part>
        {/* A faint destination outline is already clickable as the step begins. */}
        <Part id={d.id} show={0.25 + 0.75 * arrive}>
          <g transform={`translate(${d.at[0]} ${d.at[1]}) scale(${lerp(0.5, 0.85, arrive)}) translate(${-d.at[0]} ${-d.at[1]})`}>
            <CrestGlyph id={d.id} at={d.at} color={col} />
          </g>
        </Part>
      </g>;
    })}
  </g>;
}

function TrapBox({ t }: { t: number }) {
  if (t < 0.9) return null;
  return <g>
    <rect x={35} y={330} width={370} height={132} rx={13} fill="#251f1b" stroke={ORANGE} strokeOpacity={0.6} />
    <Note x={53} y={358} align="start" tone="accent" size={16}>Epidermisera iristen direnak (apunteak):</Note>
    <Note x={53} y={387} align="start" size={15}>Melanozitoak, ile-folikuluak, azazkalak</Note>
    <Note x={53} y={418} align="start" tone="dim" size={14}>Oharra: liburuetan, ile-folikuluak eta</Note>
    <Note x={53} y={440} align="start" tone="dim" size={14}>azazkalak azaleko ektodermotik datoz.</Note>
  </g>;
}

function mapLabels(t: number) {
  const mapZoom = mapZoomAt(t);
  const first = DESTS.find((q) => q.group === activeGroup(t));
  const [ox, oy] = mapZoom.at(...(first ? originOf(first) : sp(0.14, 8)));
  return <>
    <Label id="gandor-neurala" x={740} y={140} ax={ox} ay={oy} small />
    {DESTS.map(d => {
      if (activeGroup(t) !== d.group) return null;
      const [ax, ay] = mapZoom.at(...d.at);
      return <Label key={d.id} id={d.id} x={d.x} y={d.y} ax={ax} ay={ay} small />;
    })}
  </>;
}

export function NeuralCrestDerivatives(props: SceneProps) {
  const gi = activeGroup(props.t);
  return <g>
    <Note x={500} y={43} tone="accent" size={16}>{gi < 0 ? 'Gandor neurala: hodi neuralaren luzeran' : GROUP_TITLE[gi]}</Note>
    <MapDrawing {...props} />
    {mapLabels(props.t)}
    <TrapBox t={props.t} />
    <Note x={500} y={598} size={14}>Eratorrien helmugak, eskematikoki: ez dira denak 28. egunean helduak.</Note>
    {gi === 2 && <Note x={500} y={622} size={13}>Gongoil enterikoak: gandor bagal eta sakraletik; muina: zelula endokrinoak.</Note>}
  </g>;
}
