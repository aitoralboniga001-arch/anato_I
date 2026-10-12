'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneView } from '@/components/kit/columns';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { isSpace, partsOf, nameOf, spansOf, weeks } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';

/**
 * ?anchors=1&w=7[&s=0] — the leader-dot audit. A name's dot must sit well inside the structure it
 * names: the dot and 8 points on a ring of RING frame units around it must all land on that
 * structure (or a drawing inside it), never on a neighbour or on the background. Checked in every
 * view of every stage, at each step's finished frame. One JSON line per stage in #anchors, then DONE.
 * scripts/anchor-audit.mjs runs it for every week in headless Chrome and writes docs/anchor-audit.md.
 */

const RING = 4;
const noop = () => {};
const GEOM = 'path,circle,ellipse,rect,polygon,polyline,line';

/** Each step's finished frame (as the contact sheet and the tour hold it). */
const stepEnds = (st: StageDef) =>
  st.beats.map((b, k) => {
    const end = st.beats[k + 1]?.at ?? 1;
    return { k, t: k + 1 < st.beats.length ? end - Math.min(0.035, (end - b.at) * 0.25) - 1e-4 : 1, focus: b.focus ?? [] };
  });

function shownOpacity(el: Element) {
  let o = 1;
  for (let e: Element | null = el; e && e.tagName !== 'svg'; e = e.parentElement) {
    const a = e.getAttribute('opacity');
    if (a !== null) o *= Number(a);
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
    o *= Number(cs.opacity);
  }
  return o;
}

interface Shape {
  /** Every part the drawing belongs to: its own, the parts around it, and their scene groups. */
  ids: string[];
  el: SVGGeometryElement;
  inv: DOMMatrix;
  fill: boolean;
  stroke: boolean;
  clips: SVGGeometryElement[][];
}

function clipsOf(el: Element): SVGGeometryElement[][] {
  const out: SVGGeometryElement[][] = [];
  for (let e: Element | null = el; e && e.tagName !== 'svg'; e = e.parentElement) {
    const m = /url\(#([^)]+)\)/.exec(e.getAttribute('clip-path') ?? '');
    const cp = m ? e.ownerDocument.getElementById(m[1]) : null;
    if (cp) out.push([...cp.querySelectorAll<SVGGeometryElement>('path,circle,ellipse,rect,polygon')]);
  }
  return out;
}

function partIds(el: Element) {
  const ids: string[] = [];
  for (let p = el.closest('[data-part]'); p; p = p.parentElement?.closest('[data-part]') ?? null)
    ids.push(p.getAttribute('data-part')!, ...(p.getAttribute('data-groups')?.split(' ') ?? []));
  return ids;
}

/** Every drawn shape in paint order (later = on top); any drawing counts, so the background shows as such. */
function shapesOf(svg: SVGSVGElement): Shape[] {
  const out: Shape[] = [];
  for (const el of svg.querySelectorAll<SVGGeometryElement>(GEOM)) {
    if (el.closest('[data-label]') || el.closest('defs,clipPath,mask,pattern,marker')) continue;
    if (!(el instanceof SVGGeometryElement)) continue;
    // A process's pool of light, and the 3D view's drag surface, are not drawings of anything.
    if (el.classList.contains('mark-light') || el.closest('.stage3d-orbit')) continue;
    if (shownOpacity(el) < 0.05) continue;
    const cs = getComputedStyle(el);
    const ids = partIds(el);
    // Light over the picture, or a see-through shade: the eye reads the structure under it.
    if (cs.pointerEvents === 'none' && (!ids.length || Number(cs.opacity) < 0.6)) continue;
    const fill = cs.fill !== 'none' && cs.fill !== 'transparent' && Number(cs.fillOpacity) > 0.05;
    const stroke = cs.stroke !== 'none' && cs.stroke !== 'transparent' && Number(cs.strokeOpacity) > 0.05 && parseFloat(cs.strokeWidth) > 0;
    if (!fill && !stroke) continue;
    const ctm = el.getCTM();
    if (!ctm) continue;
    out.push({ ids, el, inv: ctm.inverse(), fill, stroke, clips: clipsOf(el) });
  }
  return out;
}

/** The drawing on top at a frame point: its parts ([] for a drawing that is no part), or null for bare background. */
function topAt(shapes: Shape[], svg: SVGSVGElement, x: number, y: number): Shape | null {
  const p = svg.createSVGPoint();
  p.x = x;
  p.y = y;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    const l = p.matrixTransform(s.inv);
    const dp = new DOMPoint(l.x, l.y);
    try {
      if (s.clips.some((c) => !c.some((g) => g.isPointInFill(dp)))) continue;
      if ((s.fill && s.el.isPointInFill(dp)) || (s.stroke && s.el.isPointInStroke(dp))) return s;
    } catch {
      /* shapes without geometry */
    }
  }
  return null;
}

export interface AnchorMiss {
  view: string;
  step: number;
  id: string;
  /**
   * dot: the dot or its ring lands off the structure (a seam or a neighbour). span: a bracket end, or a
   * point along it, is not on the whole's layers. needs-span: a layered whole named with a dot.
   * whole: a whole (registry `parts`) named with a dot inside just one of its parts.
   */
  kind: 'dot' | 'span' | 'needs-span' | 'whole';
  /** Where the dot (or the bracket's middle) is, in frame units. */
  at: [number, number];
  /** How many probes land elsewhere (of 9), and on what. */
  off: number;
  centre: boolean;
  on: string[];
}

const describe = (top: Shape | null) => (top === null ? '(hondoa)' : (top.ids[0] ?? `(${top.el.tagName}${top.el.getAttribute('class') ? '.' + top.el.getAttribute('class') : ''})`));

function inspect(svg: SVGSVGElement, view: string, step: number): AnchorMiss[] {
  const shapes = shapesOf(svg);
  const unit = svg.getBoundingClientRect().width / 1000;
  const out: AnchorMiss[] = [];
  const toScreen = (el: SVGGraphicsElement, x: number, y: number) => {
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    return p.matrixTransform(el.getCTM()!);
  };
  for (const g of svg.querySelectorAll('g[data-label]')) {
    const dot = g.querySelector<SVGCircleElement>(':scope > circle.label-dot');
    const tick = g.querySelector<SVGPathElement>(':scope > .label-span > path.label-leader');
    if ((!dot && !tick) || shownOpacity(g) < 0.3) continue;
    const id = g.getAttribute('data-label')!;
    const layers = spansOf(id);
    const mine = new Set([id, ...partsOf(id)]);
    // A process (a pool of light) or a name with nothing of its own drawn here is another audit's business.
    if (!shapes.some((s) => s.ids.some((q) => mine.has(q)))) continue;
    const isMine = (top: Shape | null, set: ReadonlySet<string> = mine) => !!top?.ids.some((q) => set.has(q));
    if (tick) {
      // Bracket: its ends on the outer layers, every point between on the whole.
      const n = (tick.getAttribute('d') ?? '').match(/-?[\d.]+/g)?.map(Number) ?? [];
      const a = toScreen(tick, n[2], n[3]);
      const b = toScreen(tick, n[4], n[5]);
      const on = new Set<string>();
      let off = 0;
      const first = new Set(layers.length ? [layers[0]] : mine);
      const last = new Set(layers.length ? [layers[layers.length - 1]] : mine);
      // The ends may be given either way round.
      const flip = layers.length > 1 && !isMine(topAt(shapes, svg, a.x, a.y), first) && isMine(topAt(shapes, svg, a.x, a.y), last);
      for (let i = 0; i <= 8; i++) {
        const u = 0.02 + (0.96 * i) / 8;
        const top = topAt(shapes, svg, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
        const want = i === 0 ? (flip ? last : first) : i === 8 ? (flip ? first : last) : mine;
        if (isMine(top, want)) continue;
        off++;
        on.add(describe(top));
      }
      if (off) out.push({ view, step, id, kind: 'span', at: [Math.round((a.x + b.x) / 2 / unit), Math.round((a.y + b.y) / 2 / unit)], off, centre: false, on: [...on] });
      continue;
    }
    const c = toScreen(dot!, dot!.cx.baseVal.value, dot!.cy.baseVal.value);
    const at: [number, number] = [Math.round(c.x / unit), Math.round(c.y / unit)];
    if (layers.length) {
      out.push({ view, step, id, kind: 'needs-span', at, off: 9, centre: true, on: [] });
      continue;
    }
    const r = RING * unit;
    const probes: [number, number][] = [[0, 0]];
    for (let k = 0; k < 8; k++) probes.push([Math.cos((k * Math.PI) / 4) * r, Math.sin((k * Math.PI) / 4) * r]);
    const on = new Set<string>();
    const landed = new Set<string>();
    let off = 0;
    let centre = false;
    probes.forEach(([dx, dy], i) => {
      const top = topAt(shapes, svg, c.x + dx, c.y + dy);
      if (isMine(top)) {
        for (const q of top!.ids) if (mine.has(q) && q !== id) landed.add(q);
        return;
      }
      off++;
      if (i === 0) centre = true;
      on.add(describe(top));
    });
    if (off) out.push({ view, step, id, kind: 'dot', at, off, centre, on: [...on] });
    else if (partsOf(id).length > 1 && landed.size === 1) out.push({ view, step, id, kind: 'whole', at, off: 0, centre: false, on: [...landed] });
  }
  return out;
}

type Pt = [number, number];
const side = (p: Pt, q: Pt, r: Pt) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
const cross = (a: Pt, b: Pt, c: Pt, d: Pt) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;

/** Pairs of shown names whose leaders cross, as drawn (after the label layer's seating). */
function crossings(svg: SVGSVGElement): [string, string][] {
  const ls: { id: string; pts: Pt[] }[] = [];
  for (const g of svg.querySelectorAll('g[data-label]')) {
    const path = g.querySelector(':scope > path.label-casing');
    if (!path || shownOpacity(g) < 0.3) continue;
    const n = (path.getAttribute('d') ?? '').match(/-?[\d.]+/g)?.map(Number) ?? [];
    const pts: Pt[] = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    ls.push({ id: g.getAttribute('data-label')!, pts });
  }
  const out: [string, string][] = [];
  for (let i = 0; i < ls.length; i++)
    for (let j = i + 1; j < ls.length; j++)
      if (ls[i].pts.slice(1).some((b, a) => ls[j].pts.slice(1).some((d, c) => cross(ls[i].pts[a], b, ls[j].pts[c], d)))) out.push([ls[i].id, ls[j].id]);
  return out;
}

export function Anchors({ q }: { q: URLSearchParams }) {
  const w = weeks.find((x) => x.week === Number(q.get('w') ?? 1)) ?? weeks[0];
  const s = q.get('s');
  const list = s === null ? w.stages : [w.stages[Number(s)] ?? w.stages[0]];
  const [lines, setLines] = useState<string[]>([]);
  const at = lines.length;
  return (
    <div style={{ background: '#000' }}>
      <pre id="anchors" style={{ color: '#ddd', fontSize: 12, whiteSpace: 'pre-wrap' }}>
        {[...lines, ...(at >= list.length ? ['DONE'] : [])].join('\n')}
      </pre>
      {at < list.length && <StageAnchors key={list[at].id} week={w.week} st={list[at]} onDone={(l) => setLines((x) => [...x, l])} />}
    </div>
  );
}

function StageAnchors({ week, st, onDone }: { week: number; st: StageDef; onDone: (line: string) => void }) {
  const frames = useMemo(() => st.views.flatMap((v) => stepEnds(st).map((f) => ({ ...f, v }))), [st]);
  const refs = useRef<(SVGSVGElement | null)[]>([]);
  useEffect(() => {
    const id = setTimeout(() => {
      const misses = frames.flatMap((f, i) => inspect(refs.current[i]!, f.v.id, f.k + 1));
      const crossed = frames.flatMap((f, i) => crossings(refs.current[i]!).map(([a, b]) => ({ view: f.v.id, step: f.k + 1, a, b })));
      onDone(JSON.stringify({ stage: `${week}/${st.id}`, misses, crossed }));
    }, 200);
    return () => clearTimeout(id);
    // Runs once per stage (the component is keyed by stage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      {frames.map((f, i) => {
        const ctx: SceneContextValue = {
          selected: null,
          hovered: null,
          focus: f.focus,
          dimContext: !f.v.ownFocus,
          showLabels: true,
          quiz: false,
          quizFlash: null,
          nameOf,
          isSpace,
          partsOf,
          onSelect: noop,
          onHover: noop,
        };
        return (
          <svg
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            viewBox="0 0 1000 640"
            style={{ width: 1000, display: 'block' }}
          >
            <Defs />
            <SceneContext.Provider value={ctx}>
              <SceneView Scene={f.v.scene} t={f.t} reduced />
            </SceneContext.Provider>
          </svg>
        );
      })}
    </div>
  );
}
