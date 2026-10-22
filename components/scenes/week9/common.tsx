'use client';

import { C, Label, Note, Part, clamp, lerp, rand, seg, type Pt } from '@/components/kit';
import { HUE } from '@/content/weeks/week9-structures';
import { f1, vis } from '@/components/scenes/week7/common';

export { arc, along, f1, length, mirror, morph, normals, offset, poly, resample, sm, spline, vis } from '@/components/scenes/week7/common';
export { inPoly, mesCells, MesCell } from '@/components/scenes/week8/common';
export { HUE };

/**
 * Shared language of topic 9 (muskulu-sistema). One colour per meaning in every view:
 * - germ layers as in topics 3–8 (ectoderm blue, neural tube deep blue, notochord violet, endoderm yellow,
 *   paraxial mesoderm red, parietal layer pale pink, visceral layer rose, neural crest teal);
 * - somite derivatives as in topic 4 (sclerotome brown, dermatome dark red, myotome rust);
 * - what the muscle becomes: striated crimson, smooth honey, cardiac magenta;
 * - head origins as a rainbow front → back (see HUE), domains blue/amber, rami magenta/emerald.
 */
export const W = {
  ...HUE,
  ecto: C.surfaceEcto,
  ectoDeep: '#4a74c9',
  neural: C.neural,
  neuralLumen: '#0f1530',
  noto: C.notochord,
  endo: C.endoderm,
  endoDeep: '#a7801f',
  paraxial: C.mesoParaxial,
  parietal: '#f9b4b4',
  visceral: '#e0707f',
  sclero: '#b4533c',
  dermato: '#9a3b2e',
  myo: '#c2410c',
  mesench: '#d9a066',
  mesDeep: '#7a4a1e',
  aorta: '#dc2626',
  aortaDeep: '#7f1d1d',
  blood: '#5a0f18',
  cavity: 'rgba(120,170,255,0.13)',
  space: '#120d16',
  frontier: '#4ade80',
  bone: '#efe3c4',
  boneDeep: '#b9a77e',
  cart: '#9a8fe0',
  cartDeep: '#5d52a8',
  skin: '#e9b8a0',
  skinDeep: '#b8826a',
  fat: '#f3d9a4',
  grey: '#9aa3b8',
  greyDeep: '#5b6478',
  white: '#e7ecf5',
  body: '#3a2a36',
  bodyEdge: '#6b5566',
  ink: '#e8eefc',
} as const;

/** One caption under the picture for each step of the scene (same slot, so it reads like subtitles). */
export function Steps({ t, steps, y = 624 }: { t: number; steps: [number, string][]; y?: number }) {
  return (
    <>
      {steps.map(([a, text], i) => (
        <Note key={i} x={500} y={y} tone="accent" show={vis(t, a, steps[i + 1]?.[0] ?? 2)}>
          {text}
        </Note>
      ))}
    </>
  );
}

/** Shared gradients and textures of topic 9 (light from the top left, muscle striations, fat). */
export function Defs9() {
  return (
    <defs>
      <linearGradient id="w9-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.26} />
      </linearGradient>
      <linearGradient id="w9-tube" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.28} />
        <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.32} />
      </linearGradient>
      <radialGradient id="w9-ball" cx="35%" cy="32%" r="70%">
        <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.35} />
      </radialGradient>
      <pattern id="w9-striae" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M1.5 0v7" stroke="rgba(255,255,255,0.22)" strokeWidth={1.4} />
        <path d="M5 0v7" stroke="rgba(0,0,0,0.18)" strokeWidth={0.8} />
      </pattern>
      <pattern id="w9-fibres" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
        <path d="M0 2.5h10M0 7.5h10" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      </pattern>
      <pattern id="w9-fibres-v" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(70)">
        <path d="M0 2.5h10M0 7.5h10" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      </pattern>
      <pattern id="w9-mes" width="22" height="20" patternUnits="userSpaceOnUse">
        <g fill="rgba(255,220,190,0.18)" stroke="rgba(255,220,190,0.13)" strokeWidth={0.8}>
          <circle cx="5" cy="5" r="1.5" />
          <path d="M5 5l-4-2M5 5l3-4M5 5l4 2" />
          <circle cx="16" cy="14" r="1.5" />
          <path d="M16 14l-4-1M16 14l2-4M16 14l3 3" />
        </g>
      </pattern>
      <pattern id="w9-bone" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.1" fill="rgba(120,100,60,0.35)" />
        <circle cx="9" cy="8" r="0.9" fill="rgba(120,100,60,0.3)" />
      </pattern>
    </defs>
  );
}

/**
 * A long striated muscle fibre (or a row of fusing myoblasts) along a horizontal axis: the cells are
 * drawn individually until `fuse` (0..1) merges them into one multinucleated fibre; `fibrils` grows the
 * myofibrils, `striae` the cross bands. Pure drawing: the caller wraps it in its Part.
 */
export function Fibre({ x0, x1, y, h, n, fuse, fibrils = 0, striae = 0, color = W.striated, seed = 1 }: { x0: number; x1: number; y: number; h: number; n: number; fuse: number; fibrils?: number; striae?: number; color?: string; seed?: number }) {
  const w = (x1 - x0) / n;
  const gap = lerp(7, 0, clamp(fuse * 1.4));
  const cells = Array.from({ length: n }, (_, i) => {
    const cx = x0 + w * (i + 0.5) + (rand(seed + i) - 0.5) * 4 * (1 - fuse);
    const cy = y + (rand(seed + i * 3.3) - 0.5) * 10 * (1 - fuse);
    return { cx, cy };
  });
  const tube = fuse > 0.55;
  // Nuclei: central in single myoblasts, pushed to the edge of the fused fibre.
  const nuc = (i: number): Pt => {
    const c = cells[i];
    const edge = seg(fuse, 0.6, 1);
    return [c.cx + (rand(seed + i * 5.1) - 0.5) * w * 0.4 * edge, lerp(c.cy, y + (i % 2 ? 1 : -1) * h * 0.32, edge)];
  };
  return (
    <g>
      {tube ? (
        <rect x={f1(x0)} y={f1(y - h / 2)} width={f1(x1 - x0)} height={f1(h)} rx={h / 2} fill={color} stroke="rgba(60,6,16,0.75)" strokeWidth={1.2} opacity={seg(fuse, 0.55, 0.7)} />
      ) : null}
      {cells.map((c, i) => (
        <ellipse key={i} cx={f1(c.cx)} cy={f1(c.cy)} rx={f1(w / 2 - gap / 2 + 1)} ry={f1(h * lerp(0.42, 0.5, fuse))} fill={color} stroke="rgba(60,6,16,0.75)" strokeWidth={1} opacity={tube ? 1 - seg(fuse, 0.55, 0.7) : 1} />
      ))}
      {fibrils > 0.01 &&
        [-0.22, 0, 0.22].map((k) => (
          <path key={k} d={`M${f1(x0 + h * 0.4)},${f1(y + k * h)} H${f1(x0 + h * 0.4 + (x1 - x0 - h * 0.8) * fibrils)}`} stroke="#ffc0c8" strokeWidth={h * 0.12} strokeLinecap="round" opacity={0.75} />
        ))}
      {striae > 0.01 && (
        <rect x={f1(x0 + h * 0.3)} y={f1(y - h * 0.38)} width={f1(x1 - x0 - h * 0.6)} height={f1(h * 0.76)} rx={h * 0.3} fill="url(#w9-striae)" opacity={striae} />
      )}
      {cells.map((_, i) => {
        const p = nuc(i);
        return <ellipse key={`n${i}`} cx={f1(p[0])} cy={f1(p[1])} rx={lerp(4.2, 5.4, fuse)} ry={lerp(3.4, 2.2, seg(fuse, 0.6, 1))} fill="#4a0a18" stroke="rgba(255,200,210,0.35)" strokeWidth={0.6} />;
      })}
      <rect x={f1(x0)} y={f1(y - h / 2)} width={f1(x1 - x0)} height={f1(h)} rx={h / 2} fill="url(#w9-tube)" opacity={seg(fuse, 0.6, 0.8) * 0.8} pointerEvents="none" />
    </g>
  );
}

/** A spindle-shaped smooth muscle cell (one central nucleus, no striation). */
export function Spindle({ x, y, len, h, rot = 0, color = W.smooth }: { x: number; y: number; len: number; h: number; rot?: number; color?: string }) {
  const d = `M${f1(-len / 2)},0 Q${f1(-len / 4)},${f1(-h / 2)} 0,${f1(-h / 2)} Q${f1(len / 4)},${f1(-h / 2)} ${f1(len / 2)},0 Q${f1(len / 4)},${f1(h / 2)} 0,${f1(h / 2)} Q${f1(-len / 4)},${f1(h / 2)} ${f1(-len / 2)},0Z`;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`}>
      <path d={d} fill={color} stroke="rgba(90,50,6,0.7)" strokeWidth={0.9} />
      <ellipse cx={0} cy={0} rx={len * 0.13} ry={h * 0.2} fill="#5a3206" />
    </g>
  );
}

/** A table cell that is a structure: its swatch is clickable and lights up with the step. */
export interface TableRow {
  cells: { id?: string; text: string; color?: string }[];
  /** Stage time when the row is filled in. */
  at: number;
}

/**
 * A summary table of the notes built live, row by row: each cell that names a structure is a Part (it
 * lights with the step and opens its card), and its text is the structure's Label set inside the cell,
 * so the table and the pictures share one set of names.
 */
export function SummaryTable({ t, x, y, widths, rowH, head, rows, headColor = '#2b2333' }: { t: number; x: number; y: number; widths: number[]; rowH: number; head: string[]; rows: TableRow[]; headColor?: string }) {
  const xs = widths.reduce<number[]>((acc, w) => [...acc, acc[acc.length - 1] + w], [x]);
  const total = xs[xs.length - 1] - x;
  return (
    <g>
      <rect x={x} y={y} width={total} height={rowH} rx={8} fill={headColor} stroke="rgba(255,255,255,0.18)" />
      {head.map((h, i) => (
        <Note key={i} x={xs[i] + widths[i] / 2} y={y + rowH / 2} size={12.5} tone="accent" fixed>
          {h}
        </Note>
      ))}
      {rows.map((r, j) => {
        const show = seg(t, r.at, r.at + 0.04);
        const ry = y + rowH * (j + 1) + 4 * (j + 1);
        return (
          <g key={j} opacity={show > 0.01 ? 1 : 0}>
            {r.cells.map((c, i) => {
              const cx = xs[i];
              const w = widths[i];
              const fill = c.color ?? '#3a3040';
              const body = (
                <g>
                  <rect x={f1(cx + 2)} y={f1(ry)} width={f1(w - 4)} height={rowH} rx={7} fill={fill} fillOpacity={0.24 * show} stroke={fill} strokeOpacity={0.7 * show} strokeWidth={1.2} />
                  <rect x={f1(cx + 2)} y={f1(ry)} width={6} height={rowH} rx={3} fill={fill} opacity={show} />
                </g>
              );
              return (
                <g key={i}>
                  {c.id ? (
                    <Part id={c.id} show={show}>
                      {body}
                    </Part>
                  ) : (
                    <g opacity={show}>{body}</g>
                  )}
                  {c.id ? (
                    <Label id={c.id} x={cx + w / 2} y={ry + rowH / 2} align="middle" text={c.text} show={show} small />
                  ) : (
                    <Note x={cx + w / 2} y={ry + rowH / 2} size={12.5} show={show} tone="dim">
                      {c.text}
                    </Note>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
