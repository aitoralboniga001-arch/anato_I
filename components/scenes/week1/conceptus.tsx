'use client';

import type { ReactNode } from 'react';
import { C, Part, mix } from '@/components/kit';
import type { Cell as CCell, Frame, V2 } from '@/components/shell/intro/cleavage';

/**
 * The conceptus of week 1 in the course-figure palette (Langman, as in the notes):
 * blastomeres salmon, zona pellucida pink, corona radiata lilac, and — once they separate —
 * trophoblast GREEN and embryoblast BLUE ("argazkian berdea / urdina").
 * Geometry comes from the shared cleavage engine (components/shell/intro/cleavage.ts): a mosaic of
 * cells pressed together inside the zona, drawn here with light from the top left — a soft drop
 * shadow, a volume gradient over the whole ball, fine cytoplasmic granules, a highlight per cell,
 * membranes with a light inner rim, and nuclei with a nucleolus.
 */

export function ConceptusDefs({ id = 'w1c' }: { id?: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-zona`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={150}>
        <stop offset={132 / 150} stopColor="#f6b3c3" stopOpacity="0.8" />
        <stop offset={137 / 150} stopColor={C.zona} stopOpacity="0.42" />
        <stop offset={145 / 150} stopColor={C.zona} stopOpacity="0.36" />
        <stop offset="1" stopColor="#e47c97" stopOpacity="0.82" />
      </radialGradient>
      {/* Blastocoel fluid: clear, a cool neutral (not the embryoblast's blue), a touch brighter at the rim. */}
      <radialGradient id={`${id}-cav`} cx="50%" cy="44%" r="58%">
        <stop offset="0" stopColor="#6c8691" stopOpacity="0.34" />
        <stop offset="0.7" stopColor="#84a0ab" stopOpacity="0.38" />
        <stop offset="0.93" stopColor="#b3cbd3" stopOpacity="0.5" />
        <stop offset="1" stopColor="#d8e9ee" stopOpacity="0.62" />
      </radialGradient>
      <radialGradient id={`${id}-ball`} gradientUnits="userSpaceOnUse" cx={-60} cy={-70} r={250}>
        <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
        <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.75" stopColor="#000" stopOpacity="0.06" />
        <stop offset="1" stopColor="#000" stopOpacity="0.24" />
      </radialGradient>
      <radialGradient id={`${id}-hl`}>
        <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-cor`} cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#e3dafd" />
        <stop offset="1" stopColor="#a592ea" />
      </radialGradient>
      <pattern id={`${id}-gran`} width="17" height="15" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="3" r="0.75" fill="#7a2a36" fillOpacity="0.22" />
        <circle cx="10" cy="7" r="0.55" fill="#7a2a36" fillOpacity="0.2" />
        <circle cx="14" cy="12.5" r="0.9" fill="#7a2a36" fillOpacity="0.16" />
        <circle cx="6" cy="11" r="0.45" fill="#7a2a36" fillOpacity="0.22" />
        <circle cx="13" cy="2" r="0.4" fill="#fff" fillOpacity="0.4" />
      </pattern>
    </defs>
  );
}

const TROPHO = C.trophoblast;
const EMBRYO = C.embryoblast;

/** Cell colour: blastomere salmon, tinted towards its fate by `mass` (0..1). */
function fill(c: CCell, mass: number) {
  if (c.kind === 'trofoblasto') return TROPHO;
  if (c.kind === 'enbrioblasto') return EMBRYO;
  if (c.fate && mass > 0) return mix(C.blastomere, c.fate === 'trofoblasto' ? TROPHO : EMBRYO, mass);
  return C.blastomere;
}

/** Nucleus colour, a deeper tone of the cell's own. */
function nucColor(c: CCell, mass: number) {
  const base = '#c4697c';
  if (c.kind === 'trofoblasto') return '#23784c';
  if (c.kind === 'enbrioblasto') return '#2f5fc4';
  if (c.fate && mass > 0) return mix(base, c.fate === 'trofoblasto' ? '#23784c' : '#2f5fc4', mass);
  return base;
}

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
const closed = (pts: V2[], every = 1) => {
  let d = '';
  for (let i = 0; i < pts.length; i += every) d += `${i ? 'L' : 'M'}${f1(pts[i][0])},${f1(pts[i][1])}`;
  return d + 'Z';
};
const open = (pts: V2[], every = 1) => {
  let d = '';
  for (let i = 0; i < pts.length; i += every) d += `${i ? 'L' : 'M'}${f1(pts[i][0])},${f1(pts[i][1])}`;
  const l = pts[pts.length - 1];
  if ((pts.length - 1) % every) d += `L${f1(l[0])},${f1(l[1])}`;
  return d;
};

export interface ConceptusProps {
  f: Frame;
  /** Centre and scale (the engine works around ±150 units). */
  x: number;
  y: number;
  s?: number;
  /** 0..1 corona radiata around the zona. */
  corona?: number;
  /** 0..1 polar bodies in the perivitelline space. */
  polar?: number;
  /** 0..1 tint of outer / inner cell masses before they separate. */
  mass?: number;
  id?: string;
  /** Draw a light outline when the conceptus is tiny (tract overview). */
  tiny?: boolean;
  /** Kept for callers: the mosaic is a section, so the inner cell mass always shows. */
  cut?: number;
  /** Rotation of the whole conceptus (degrees). */
  rot?: number;
  /**
   * Make its structures clickable/highlightable (zona, corona, polar bodies, blastocoel and each
   * cell with the id `cell` gives it). Leave out when a parent already wraps it in a <Part>.
   */
  parts?: { cell: (c: CCell) => string };
}

/** Wraps in a <Part> only when the conceptus is interactive (parts must not nest). */
const P = ({ on, id, children }: { on: boolean; id: string; children: ReactNode }) => (on ? <Part id={id}>{children}</Part> : <>{children}</>);

/** Corona radiata: radially arranged follicular cells around the zona. */
function Corona({ r, o, id }: { r: number; o: number; id: string }) {
  if (o <= 0.02) return null;
  const cells = [];
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 30 : 24;
    for (let i = 0; i < n; i++) {
      const a = ((i + ring * 0.5) / n) * Math.PI * 2;
      const rr = r + 18 + ring * 22;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      cells.push(
        <g key={`${ring}-${i}`} transform={`rotate(${((a * 180) / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`} opacity={0.95 - ring * 0.25}>
          <ellipse cx={x} cy={y} rx={12} ry={7.5} fill={`url(#${id}-cor)`} stroke="rgba(40,20,70,0.55)" strokeWidth={1} />
          <ellipse cx={x + 1.5} cy={y} rx={4} ry={2.8} fill="#5a3f97" opacity={0.7} />
        </g>,
      );
    }
  }
  return <g opacity={o}>{cells}</g>;
}

const INK = 'rgba(58,18,28,0.72)';
/** Relative lengths of the zona's pieces and of the gaps between them as it dissolves. */
const ZBREAK: [number, number][] = [
  [1.25, 0.7],
  [0.6, 1.3],
  [1.05, 0.9],
  [1.5, 0.55],
  [0.75, 1.4],
  [0.95, 1.0],
  [1.3, 0.8],
];
const PB: [number, number][] = [
  [-83, 7.2],
  [-98, 6],
];

export function Conceptus({ f, x, y, s = 1, corona = 0, polar = 0, mass = 0, id = 'w1c', tiny, rot = 0, parts }: ConceptusProps) {
  const on = !!parts;
  const zo = f.zonaO;
  const zr = f.zonaR;
  const every = tiny ? 3 : 1;
  const inDiv = new Map<number, Frame['divs'][number]>();
  for (const d of f.divs) {
    inDiv.set(d.a, d);
    inDiv.set(d.b, d);
  }
  // Group cells by the structure they belong to, so each group is one interactive part.
  const groups = new Map<string, number[]>();
  f.cells.forEach((c, i) => {
    if (!c.shape) return;
    const g = parts ? parts.cell(c) : '';
    groups.set(g, [...(groups.get(g) ?? []), i]);
  });
  const shadow = f.cells.map((c) => (c.shape ? closed(c.shape.pts, 2) : '')).join('');
  const rimO = 0.42 + 0.45 * (1 - f.compact);
  const sw = tiny ? 5 : 1.25;
  // Lost in the uterine cavity: the zona thins and breaks up as it dissolves.
  const zw = 18 * (0.35 + 0.65 * zo);
  const segL = (2 * Math.PI * (zr + 9)) / 24;
  const zk = Math.min(1, 0.3 + zo);
  // …and its fragments drift a little away from the cells.
  const zr9 = zr + 9 + (1 - zo) * 14;
  // Irregular pieces (not an even dashed ring) as it breaks up.
  const dash = zo > 0.97 ? undefined : ZBREAK.map(([on, off]) => `${(segL * zk * on).toFixed(1)} ${(segL * (1 - zk) * off).toFixed(1)}`).join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <P on={on && corona * zo > 0.02} id="koroa-erradiatua">
        <Corona r={zr} o={corona * zo} id={id} />
      </P>
      {zo > 0.01 && (
        <P on={on} id="mintz-peluzidoa">
          <g opacity={Math.min(1, zo * 1.25)}>
            <circle r={zr9} fill="none" stroke={`url(#${id}-zona)`} strokeWidth={zw} strokeDasharray={dash} />
            {!tiny && <circle r={zr9 + zw / 2} fill="none" stroke="#c4506d" strokeWidth={1.3} strokeDasharray={dash} />}
            {!tiny && <circle r={zr9 - zw / 2} fill="none" stroke="#c4506d" strokeOpacity={0.7} strokeWidth={0.9} strokeDasharray={dash} />}
            {tiny && <circle r={zr + 18} fill="none" stroke="#c4506d" strokeWidth={4} />}
          </g>
        </P>
      )}
      {polar > 0.01 && (
        <P on={on} id="gorpuskulu-polarrak">
          <g opacity={polar * zo}>
            {PB.map(([deg, r], i) => {
              const a = (deg * Math.PI) / 180;
              const px = Math.cos(a) * (zr - 7.5);
              const py = Math.sin(a) * (zr - 7.5);
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r={r} fill={C.blastomere} stroke={INK} strokeWidth={1.1} />
                  {!tiny && <circle cx={px - r * 0.3} cy={py - r * 0.35} r={r * 0.45} fill={`url(#${id}-hl)`} />}
                  {!tiny && <circle cx={px + 0.6} cy={py + 0.6} r={r * 0.32} fill="#a8326a" opacity={0.65} />}
                </g>
              );
            })}
          </g>
        </P>
      )}
      {f.cavO > 0.01 && (
        <P on={on && f.cavO > 0.3} id="blastozelea">
          <g opacity={f.cavO}>
            {/* A cool dark base under the clear fluid, so what lies behind does not tint it. */}
            {f.cav ? <path d={closed(f.cav)} fill="#151d23" opacity={0.85} /> : <circle r={f.cavR} fill="#151d23" opacity={0.85} />}
            {f.cav ? <path d={closed(f.cav)} fill={`url(#${id}-cav)`} /> : <circle r={f.cavR} fill={`url(#${id}-cav)`} />}
            {f.cav && !tiny && <path d={closed(f.cav)} fill="none" stroke="#e3eef0" strokeOpacity={0.45} strokeWidth={1.2} />}
          </g>
        </P>
      )}
      {/* Soft shadow of the whole cell mass (light from the top left). */}
      {!tiny && <path d={shadow} transform="translate(2.2 3.4)" fill="#000" opacity={0.3} pointerEvents="none" />}
      {[...groups].map(([gid, idx]) => {
        const all = idx.map((i) => closed(f.cells[i].shape!.pts, every)).join('');
        const runs = idx.flatMap((i) => f.cells[i].shape!.runs.map((r) => open(r, every))).join('');
        const divs = f.divs.filter((d) => idx.includes(d.a));
        return (
          <P key={gid || 'cells'} on={on} id={gid}>
            <g>
              {idx.map((i) => (
                <path key={i} d={closed(f.cells[i].shape!.pts, every)} fill={fill(f.cells[i], mass)} />
              ))}
              {!tiny && <path d={all} fill={`url(#${id}-gran)`} pointerEvents="none" />}
              <path d={all} fill={`url(#${id}-ball)`} pointerEvents="none" />
              {!tiny &&
                idx.map((i) => {
                  const sh = f.cells[i].shape!;
                  const dv = inDiv.get(i);
                  const r = Math.sqrt(sh.ax * sh.ay);
                  const o = dv ? dv.furrow : 1;
                  const hx = sh.cx - r * 0.28;
                  const hy = sh.cy - r * 0.34;
                  return o > 0.02 ? <ellipse key={`h${i}`} cx={hx} cy={hy} rx={r * 0.5} ry={r * 0.34} transform={`rotate(-28 ${f1(hx)} ${f1(hy)})`} fill={`url(#${id}-hl)`} opacity={0.75 * o} pointerEvents="none" /> : null;
                })}
              {!tiny &&
                divs
                  .filter((d) => d.furrow < 0.98)
                  .map((d) => {
                    const hx = d.ux - d.ur * 0.3;
                    const hy = d.uy - d.ur * 0.36;
                    return <ellipse key={`u${d.a}`} cx={hx} cy={hy} rx={d.ur * 0.52} ry={d.ur * 0.36} transform={`rotate(-28 ${f1(hx)} ${f1(hy)})`} fill={`url(#${id}-hl)`} opacity={0.75 * (1 - d.furrow)} pointerEvents="none" />;
                  })}
              <path d={runs} fill="none" stroke={INK} strokeOpacity={rimO} strokeWidth={sw} strokeLinejoin="round" />
              {!tiny && <path d={runs} transform="translate(-0.7 -0.8)" fill="none" stroke="#fff" strokeOpacity={0.22 * rimO} strokeWidth={0.8} pointerEvents="none" />}
              {/* The new wall between two daughters, drawn in as the furrow cuts through. */}
              {divs.map((d) => {
                const wa = f.cells[d.a].shape?.wall;
                const wb = f.cells[d.b].shape?.wall;
                return d.wall > 0.02 ? <path key={`w${d.a}`} d={(wa ? open(wa, every) : '') + (wb ? open(wb, every) : '')} fill="none" stroke={INK} strokeOpacity={rimO * d.wall} strokeWidth={sw} /> : null;
              })}
              {!tiny &&
                idx.map((i) => {
                  const c = f.cells[i];
                  const sh = c.shape!;
                  const dv = inDiv.get(i);
                  const o = dv ? dv.nucD : c.nuc;
                  const flat = c.kind === 'trofoblasto' && sh.ax > sh.ay * 1.6;
                  const cap = sh.clear !== undefined ? Math.max(1.5, sh.clear * 0.72) : Infinity;
                  // A flat cell keeps its long nucleus; only the short axis is held inside.
                  const r = flat ? Math.min(sh.ax * 0.42, 9) : Math.min(cap, Math.min(sh.ax, sh.ay) * 0.36);
                  const ry = Math.min(cap, flat ? Math.max(2, sh.ay * 0.5) : r);
                  return <NucleusArt key={`n${i}`} x={sh.cx} y={sh.cy} r={r} ry={ry} rot={flat ? sh.rot : 0} color={nucColor(c, mass)} o={o} seed={i + 1} />;
                })}
              {!tiny && divs.filter((d) => d.nucP > 0.02).map((d) => <NucleusArt key={`p${d.a}`} x={d.ux} y={d.uy} r={d.ur * 0.3} color={nucColor(f.cells[d.a], mass)} o={d.nucP} seed={d.a + 50} />)}
            </g>
          </P>
        );
      })}
      {!tiny && f.drops.some((d) => d.o > 0.02) && (
        <P on={on} id="blastozelea">
          {/* Rims under the fluid, so spaces that touch read as one merging space. */}
          <g pointerEvents="none">
            {f.drops.map((d, i) => (d.o > 0.02 ? <circle key={`r${i}`} cx={d.x} cy={d.y} r={d.r + 0.7} fill="#d5e2e6" opacity={0.5 * d.o} /> : null))}
            {f.drops.map((d, i) => (d.o > 0.02 ? <circle key={`f${i}`} cx={d.x} cy={d.y} r={d.r} fill="#6c8691" opacity={0.62 * d.o} /> : null))}
            {f.drops.map((d, i) => (d.o > 0.02 ? <ellipse key={`h${i}`} cx={d.x - d.r * 0.32} cy={d.y - d.r * 0.38} rx={d.r * 0.34} ry={d.r * 0.22} transform={`rotate(-30 ${f1(d.x - d.r * 0.32)} ${f1(d.y - d.r * 0.38)})`} fill="#f2f8f9" opacity={0.25 * d.o} /> : null))}
          </g>
        </P>
      )}
      {!tiny &&
        f.spindles.map((sp, i) => (
          <Spindle
            key={i}
            x={sp.x}
            y={sp.y}
            axis={sp.axis}
            len={sp.len}
            sep={sp.sep}
            o={sp.o}
            fibres={sp.fibres}
            asters
            colors={sp.zygote ? [C.pronucleusF, C.pronucleusM, C.pronucleusF, C.pronucleusM, C.pronucleusF, C.pronucleusM] : ['#9b2f5a', '#a8366a', '#9b2f5a', '#a8366a']}
          />
        ))}
      {f.pro.o > 0.01 && (
        <g opacity={f.pro.o}>
          {[-1, 1].map((sg) =>
            tiny ? (
              <circle key={sg} cx={sg * (15 + 26 * f.pro.sep)} cy={sg * -6 * f.pro.sep} r={17} fill={sg < 0 ? C.pronucleusM : C.pronucleusF} fillOpacity={0.6} />
            ) : (
              <NucleusArt key={sg} x={sg * (15 + 26 * f.pro.sep)} y={sg * -6 * f.pro.sep} r={17} color={sg < 0 ? C.pronucleusM : C.pronucleusF} seed={sg + 5} />
            ),
          )}
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Shared cell-biology art (fertilization and cleavage): chromosomes, the mitotic / meiotic
// spindle and interphase nuclei, in the flat Langman style with a little light from the top left.

const deg2rad = (d: number) => (d * Math.PI) / 180;

/** One condensed chromosome: an X (two sister chromatids) or, once they separate, a single bar. */
function Chromo({ x, y, rot, size, color, single }: { x: number; y: number; rot: number; size: number; color: string; single?: boolean }) {
  const a = size;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)})`}>
      {single ? (
        <path d={`M${-a * 0.25},${-a} Q${a * 0.25},0 ${-a * 0.25},${a}`} fill="none" stroke={color} strokeWidth={a * 0.62} strokeLinecap="round" />
      ) : (
        <>
          <path d={`M${-a * 0.55},${-a} Q0,0 ${-a * 0.55},${a}`} fill="none" stroke={color} strokeWidth={a * 0.56} strokeLinecap="round" />
          <path d={`M${a * 0.55},${-a} Q0,0 ${a * 0.55},${a}`} fill="none" stroke={color} strokeWidth={a * 0.56} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

export interface SpindleProps {
  x: number;
  y: number;
  /** Direction of the spindle axis (pole to pole), degrees. The metaphase plate is perpendicular to it. */
  axis: number;
  /** Pole-to-pole length. */
  len: number;
  /** 0 = metaphase (chromosomes on the plate), 1 = late anaphase (chromatids at the poles). */
  sep?: number;
  o?: number;
  /** Chromosome colours, one per chromosome on the plate (e.g. maternal pink / paternal blue). */
  colors: string[];
  /** Draw the asters (centrosomes) at the poles — the first mitotic spindle has them, the oocyte MII spindle not. */
  asters?: boolean;
  /** Hide the half of the chromatids that went to the `-1` (inner) or `+1` (outer) pole. */
  only?: -1 | 1;
  /** Opacity of the fibres and asters alone (they dissolve before the chromatids decondense). */
  fibres?: number;
}

/** Barrel-shaped spindle: fibres from pole to pole, chromosomes on the plate, splitting in anaphase. */
export function Spindle({ x, y, axis, len, sep = 0, o = 1, colors, asters, only, fibres = 1 }: SpindleProps) {
  if (o <= 0.02) return null;
  const h = len / 2;
  const n = colors.length;
  const plate = len * 0.62;
  const cs = Math.max(1.6, len * 0.075);
  const fib: string[] = [];
  for (let i = 0; i < 7; i++) {
    const v = (i / 6 - 0.5) * plate * 1.05;
    fib.push(`M${-h},0 Q0,${(v * 1.5).toFixed(2)} ${h},0`);
  }
  const off = sep * h * 0.78;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${axis.toFixed(1)})`} opacity={o} pointerEvents="none">
      {fibres > 0.02 && <path d={fib.join(' ')} fill="none" stroke="#6e2a48" strokeOpacity={0.5 * fibres} strokeWidth={Math.max(0.45, len * 0.011)} />}
      {asters && fibres > 0.02 &&
        [-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * h} 0)`} opacity={fibres}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = deg2rad(i * 30 + 15);
              return <line key={i} x1={0} y1={0} x2={Math.cos(a) * len * 0.16} y2={Math.sin(a) * len * 0.16} stroke="#6e2a48" strokeOpacity={0.45} strokeWidth={Math.max(0.45, len * 0.011)} />;
            })}
            <circle r={Math.max(1.2, len * 0.035)} fill="#6e2a48" opacity={0.75} />
          </g>
        ))}
      {colors.map((c, i) => {
        const v = n === 1 ? 0 : (i / (n - 1) - 0.5) * plate;
        const lean = (i % 2 ? 1 : -1) * 8;
        if (sep <= 0.02) return <Chromo key={i} x={0} y={v} rot={lean} size={cs} color={c} />;
        // Anaphase: sister chromatids pulled to opposite poles (V shapes trailing the centromere).
        return (
          <g key={i}>
            {only !== -1 && <Chromo x={off} y={v * (1 - sep * 0.35)} rot={lean * 0.5} size={cs} color={c} single />}
            {only !== 1 && <Chromo x={-off} y={v * (1 - sep * 0.35)} rot={180 + lean * 0.5} size={cs} color={c} single />}
          </g>
        );
      })}
    </g>
  );
}

/** Interphase nucleus (or pronucleus): pale nucleoplasm, a double-line envelope, chromatin threads and a nucleolus. */
export function NucleusArt({ x, y, r, ry, rot = 0, color, o = 1, seed = 1, envelope = 1, replicate = 0 }: { x: number; y: number; r: number; ry?: number; rot?: number; color: string; o?: number; seed?: number; envelope?: number; replicate?: number }) {
  if (o <= 0.02 || r < 0.6) return null;
  const R = ry ?? r;
  const rnd = (k: number) => {
    const s = Math.sin((seed * 31.7 + k) * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  const threads: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = rnd(i) * Math.PI * 2;
    const d = rnd(i + 9) * 0.55;
    const x0 = Math.cos(a) * r * d;
    const y0 = Math.sin(a) * R * d;
    const b = a + 1.2 + rnd(i + 3);
    const l = 0.35 + rnd(i + 5) * 0.25;
    threads.push(`M${x0.toFixed(2)},${y0.toFixed(2)} q${(Math.cos(b) * r * l).toFixed(2)},${(Math.sin(b) * R * l).toFixed(2)} ${(Math.cos(b + 0.9) * r * l * 1.4).toFixed(2)},${(Math.sin(b + 0.9) * R * l * 1.4).toFixed(2)}`);
  }
  const ink = mix(color, '#1a0f1e', 0.55);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)})`} opacity={o} pointerEvents="none">
      <ellipse rx={r} ry={R} fill={mix(color, '#ffffff', 0.55)} fillOpacity={0.85 * envelope + 0.15} />
      <ellipse rx={r} ry={R} fill={color} fillOpacity={0.28 * envelope} />
      <path d={threads.join(' ')} fill="none" stroke={ink} strokeOpacity={0.55} strokeWidth={Math.max(0.5, r * 0.07)} strokeLinecap="round" />
      {replicate > 0.02 && (
        <path d={threads.join(' ')} transform={`translate(${(r * 0.09).toFixed(2)} ${(r * 0.06).toFixed(2)})`} fill="none" stroke={ink} strokeOpacity={0.5 * replicate} strokeWidth={Math.max(0.5, r * 0.07)} strokeLinecap="round" />
      )}
      <circle cx={r * 0.22} cy={-R * 0.18} r={Math.max(0.8, Math.min(r, R) * 0.2)} fill={ink} fillOpacity={0.8 * envelope + 0.2} />
      <ellipse rx={r} ry={R} fill="none" stroke={ink} strokeOpacity={0.7 * envelope} strokeWidth={Math.max(0.5, r * 0.07)} />
      <ellipse rx={r * 0.86} ry={R * 0.86} fill="none" stroke="#ffffff" strokeOpacity={0.35 * envelope} strokeWidth={Math.max(0.4, r * 0.04)} />
      <ellipse cx={-r * 0.35} cy={-R * 0.4} rx={r * 0.32} ry={R * 0.18} transform={`rotate(-30 ${-r * 0.35} ${-R * 0.4})`} fill="#ffffff" opacity={0.28 * envelope} />
    </g>
  );
}
