'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { changedAt, colourOf, lifeAt, nameAt, type RoomData } from '@/content/eratorriak/model';
import type { DiagramProps } from './StudyRoom';
import styles from './study.module.css';

export interface Shape {
  d: string;
  label: [number, number];
  anchor?: 'start' | 'end' | 'middle';
  width?: number;
  fill?: boolean;
  /** A dark edge under the line, so it reads on top of a same-coloured piece (a pathway along a wall). */
  casing?: boolean;
}
export type Geometry = Record<string, Shape>;

/** Where a name ends up: its column edge and line, and the point of its piece the short leader ends on. */
interface Placed {
  x: number;
  anchor: 'start' | 'end';
  dy: number;
  edge: [number, number];
  at: [number, number] | null;
}

/** A point of the piece for the leader: on a vessel's line, or well inside a filled region (never on its rim). */
function anchorOf(el: SVGPathElement, fill: boolean, toward: [number, number]): [number, number] | null {
  const score = (x: number, y: number) => Math.abs(x - toward[0]) + 0.35 * Math.abs(y - toward[1]);
  let best: [number, number] | null = null;
  let bestScore = Infinity;
  if (fill) {
    const b = el.getBBox();
    const inside = (x: number, y: number) => el.isPointInFill(new DOMPoint(x, y));
    const step = Math.max(4, Math.min(b.width, b.height) / 14);
    const m = Math.min(12, Math.min(b.width, b.height) / 4);
    for (let x = b.x + m; x <= b.x + b.width - m; x += step)
      for (let y = b.y + m; y <= b.y + b.height - m; y += step) {
        if (!inside(x, y) || !inside(x - m, y) || !inside(x + m, y) || !inside(x, y - m) || !inside(x, y + m)) continue;
        const sc = score(x, y);
        if (sc < bestScore) [best, bestScore] = [[x, y], sc];
      }
    if (best) return best;
  }
  const len = el.getTotalLength();
  if (!len) return null;
  // Not the very ends: a dot on a vessel's tip reads as a cap.
  for (let i = 1; i < 40; i++) {
    const pt = el.getPointAtLength((len * i) / 40);
    const sc = score(pt.x, pt.y);
    if (sc < bestScore) [best, bestScore] = [[pt.x, pt.y], sc];
  }
  return best;
}

/**
 * Names stand in two columns hugging the drawing (left of it and right of it), each at the height of its
 * piece, with a short leader to a dot on that piece; the columns stay clear of the pieces and names in one
 * column never overlap. The geometry's label point only says which side, and roughly how high.
 */
function placeNames(svg: SVGSVGElement, height: number): Record<string, Placed> {
  const paths = [...svg.querySelectorAll<SVGPathElement>('path[data-piece-path]')];
  if (!paths.length) return {};
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const el of paths) {
    const b = el.getBBox();
    x0 = Math.min(x0, b.x);
    x1 = Math.max(x1, b.x + b.width);
  }
  const W = svg.viewBox.baseVal.width;
  const items = [...svg.querySelectorAll<SVGGElement>('g[data-label]')].map((g) => {
    const key = g.dataset.label!;
    const b = g.querySelector('text')!.getBBox();
    const left = b.x + b.width / 2 < W / 2;
    const el = svg.querySelector<SVGPathElement>(`path[data-piece-path="${key}"]`);
    const edgeX = left ? Math.max(b.width + 12, x0 - 18) : Math.min(W - b.width - 12, x1 + 18);
    const at = el ? anchorOf(el, el.dataset.fill === '1', [edgeX, b.y + b.height / 2]) : null;
    return { key, b, left, edgeX, at, want: (at?.[1] ?? b.y + b.height / 2) - b.height / 2, top: 0 };
  });
  const out: Record<string, Placed> = {};
  const gap = 8;
  for (const left of [true, false]) {
    const col = items.filter((i) => i.left === left).sort((a, b) => a.want - b.want);
    if (!col.length) continue;
    let y = 40;
    for (const i of col) {
      i.top = Math.max(i.want, y);
      y = i.top + i.b.height + gap;
    }
    // Pushed past the bottom: slide the column back up.
    let floor = height - 8;
    for (const i of [...col].reverse()) {
      i.top = Math.min(i.top, floor - i.b.height);
      floor = i.top - gap;
    }
    const edge = left ? Math.min(...col.map((i) => i.edgeX)) : Math.max(...col.map((i) => i.edgeX));
    for (const i of col) {
      const ey = i.top + i.b.height / 2;
      const ex = left ? edge + 6 : edge - 6;
      const far = i.at && Math.hypot(i.at[0] - ex, i.at[1] - ey) > 10;
      out[i.key] = { x: edge, anchor: left ? 'end' : 'start', dy: i.top - i.b.y, edge: [ex, ey], at: far ? i.at : null };
    }
  }
  return out;
}

export function PieceDiagram({
  data,
  geometry,
  title,
  caption,
  children,
  overlay,
  viewHeight = 730,
  ...props
}: DiagramProps & {
  data: RoomData;
  geometry: Geometry;
  title: string;
  caption?: string;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  viewHeight?: number;
}) {
  const id = useId().replace(/:/g, '');
  const { stage, mode, lit, labels, focus, onPick, mini } = props;
  const ps = data.pieces.filter((p) => geometry[p.key] && lifeAt(p, stage) > 0);
  const svgRef = useRef<SVGSVGElement>(null);
  const [placed, setPlaced] = useState<{ sig: string; at: Record<string, Placed> } | null>(null);
  // Measured after paint (text widths and path points need the DOM); redone whenever what is drawn changes.
  const sig = `${stage}|${labels}|${mini}|${viewHeight}|${ps.map((p) => `${p.key}:${geometry[p.key].d}:${geometry[p.key].label}:${nameAt(p, stage)}`).join(';')}`;
  useLayoutEffect(() => {
    const t = window.setTimeout(() => {
      if (svgRef.current && labels) setPlaced({ sig, at: placeNames(svgRef.current, viewHeight) });
    }, 0);
    return () => window.clearTimeout(t);
  }, [sig, labels, viewHeight]);
  const at = placed?.sig === sig ? placed.at : null;
  const names = ps.map((p) => nameAt(p, stage));
  const twice = new Set(names.filter((n, i) => names.indexOf(n) !== i));
  const words = (text: string, max = 30) => {
    const lines: string[] = [];
    for (const word of text.split(' ')) {
      const last = lines.length - 1;
      if (last >= 0 && lines[last].length + word.length < max) lines[last] += ' ' + word;
      else lines.push(word);
    }
    return lines;
  };
  return (
    <figure style={{ margin: 0 }}>
      <svg ref={svgRef} className={styles.diagram} viewBox={`0 0 960 ${viewHeight}`} role="img" aria-label={title}>
        <defs>
          <filter id={`${id}-glow`} filterUnits="userSpaceOnUse" x="-50" y="-50" width="1060" height="830">
            <feGaussianBlur stdDeviation="4" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {children}
        {labels &&
          at &&
          ps.map((p) => {
            const a = at[p.key];
            if (!a?.at) return null;
            const on = !lit.size || lit.has(p.key);
            return (
              <line
                key={`lead-${p.key}`}
                x1={a.edge[0]}
                y1={a.edge[1]}
                x2={a.at[0]}
                y2={a.at[1]}
                stroke={colourOf(p, mode, data)}
                strokeWidth={1.6}
                opacity={on ? (lifeAt(p, stage) === 3 ? 0.35 : 0.8) : 0.15}
              />
            );
          })}
        {ps.map((p) => {
          const s = geometry[p.key],
            life = lifeAt(p, stage),
            on = !lit.size || lit.has(p.key);
          return (
            <g
              key={p.key}
              data-key={p.key}
              role={onPick ? 'button' : undefined}
              tabIndex={onPick ? 0 : undefined}
              aria-label={`${p.emb} → ${p.fateText}`}
              aria-pressed={onPick ? focus === p.key : undefined}
              onClick={() => onPick?.(p.key)}
              onKeyDown={(e) => {
                if (onPick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onPick(p.key);
                }
              }}
              opacity={on ? (life === 3 ? 0.2 : 1) : 0.16}
            >
              {focus === p.key && (
                <path
                  d={s.d}
                  stroke="white"
                  strokeWidth={(s.width ?? 11) + 7}
                  fill={s.fill ? 'white' : 'none'}
                  fillRule="evenodd"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {s.casing && life !== 3 && (
                <path d={s.d} fill="none" stroke="#16141c" strokeWidth={(s.width ?? 11) + 5} strokeLinecap="round" strokeLinejoin="round" />
              )}
              <path
                d={s.d}
                data-piece-path={p.key}
                data-fill={s.fill ? '1' : undefined}
                fill={s.fill ? colourOf(p, mode, data) : 'none'}
                fillRule="evenodd"
                stroke={life === 3 ? '#d8d2e6' : colourOf(p, mode, data)}
                strokeWidth={life === 3 ? 2 : life === 2 ? 4 : (s.width ?? 11)}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={!lit.size && changedAt(p, stage) && life !== 3 ? `url(#${id}-glow)` : undefined}
              />
              <path d={s.d} fill="none" stroke="transparent" strokeWidth={Math.max(22, (s.width ?? 11) + 10)}>
                <title>{nameAt(p, stage)}</title>
              </path>
            </g>
          );
        })}
        {overlay}
        {labels &&
          at &&
          ps.map((p) => {
            const a = at[p.key];
            if (!a?.at) return null;
            const on = !lit.size || lit.has(p.key);
            return (
              <circle
                key={`dot-${p.key}`}
                cx={a.at[0]}
                cy={a.at[1]}
                r={3.6}
                fill={colourOf(p, mode, data)}
                stroke="#16141c"
                strokeWidth={1.4}
                opacity={on ? (lifeAt(p, stage) === 3 ? 0.4 : 1) : 0.2}
                pointerEvents="none"
              />
            );
          })}
        {labels &&
          ps.map((p) => {
            const s = geometry[p.key];
            const a = at?.[p.key];
            const x = a ? a.x : s.label[0];
            // Two pieces with one name (two sources of one tissue): say which source.
            const text = twice.has(nameAt(p, stage)) ? `${nameAt(p, stage)} · ${data.origins[p.origin].name}` : nameAt(p, stage);
            const lines = words(text, mini ? 27 : 30);
            return (
              <g
                key={`label-${p.key}`}
                data-label={p.key}
                data-key={p.key}
                role={onPick ? 'button' : undefined}
                tabIndex={onPick ? 0 : undefined}
                onClick={() => onPick?.(p.key)}
                onKeyDown={(e) => {
                  if (onPick && ['Enter', ' '].includes(e.key)) {
                    e.preventDefault();
                    onPick(p.key);
                  }
                }}
                opacity={!lit.size || lit.has(p.key) ? (lifeAt(p, stage) === 3 ? 0.4 : 1) : 0.25}
                transform={a ? `translate(0 ${a.dy})` : undefined}
              >
                <text
                  x={x}
                  y={s.label[1]}
                  textAnchor={a ? a.anchor : (s.anchor ?? 'start')}
                  style={{ fill: colourOf(p, mode, data), fontSize: mini ? 18 : 16, fontWeight: 600 }}
                >
                  {lines.map((line, i) => (
                    <tspan key={i} x={x} dy={i === 0 ? 0 : 20}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
      </svg>
      {caption && !mini && <figcaption className={styles.source}>{caption}</figcaption>}
    </figure>
  );
}
