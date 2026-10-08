'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { isSpace, partsOf, nameOf, weeks } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';

const noop = () => {};

/** The frames the viewer actually sees: each step's end, in the view playback shows it in. */
function stepFrames(st: StageDef) {
  let view = st.views[0].id;
  return st.beats.map((b, k) => {
    if (b.view && st.views.some((v) => v.id === b.view)) view = b.view;
    const end = st.beats[k + 1]?.at ?? 1;
    const t = k + 1 < st.beats.length ? end - Math.min(0.035, (end - b.at) * 0.25) - 1e-4 : 1;
    return { k, t, view, focus: b.focus ?? [] };
  });
}

const GEOM = 'path,circle,ellipse,rect,polygon,polyline,line';

/** Opacity of an element as drawn: its own and every ancestor's, up to the frame. */
function shownOpacity(el: Element) {
  let o = 1;
  for (let e: Element | null = el; e && e.tagName !== 'svg'; e = e.parentElement) {
    const a = e.getAttribute('opacity');
    if (a !== null) o *= Number(a);
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
  }
  return o;
}

interface Shape {
  /** The part's own id, then the groups it belongs to in the scene. */
  ids: string[];
  el: SVGGeometryElement;
  inv: DOMMatrix;
  fill: boolean;
  stroke: boolean;
  /** Clip paths on the shape or its groups: a point outside any of them is not drawn. */
  clips: SVGGeometryElement[][];
}

/** The clip-path shapes that apply to an element (its own and its groups'). */
function clipsOf(el: Element): SVGGeometryElement[][] {
  const out: SVGGeometryElement[][] = [];
  for (let e: Element | null = el; e && e.tagName !== 'svg'; e = e.parentElement) {
    const ref = e.getAttribute('clip-path') ?? '';
    const m = /url\(#([^)]+)\)/.exec(ref);
    const cp = m ? e.ownerDocument.getElementById(m[1]) : null;
    if (cp) out.push([...cp.querySelectorAll<SVGGeometryElement>(GEOM)]);
  }
  return out;
}

const idsOf = (part: Element) => [part.getAttribute('data-part')!, ...(part.getAttribute('data-groups')?.split(' ') ?? [])];

/** Every drawn shape of the visible parts, in paint order (later = on top). */
function shapesOf(svg: SVGSVGElement): Shape[] {
  const out: Shape[] = [];
  for (const el of svg.querySelectorAll<SVGGeometryElement>(GEOM)) {
    const owner = el.closest('[data-part]');
    if (!owner || el.closest('[data-label]')) continue;
    if (shownOpacity(el) < 0.05) continue;
    const ctm = el.getCTM();
    if (!ctm) continue;
    // A mark's pool of light is see-through: it does not hide what is under it.
    if (el.classList.contains('mark-light')) continue;
    const cs = getComputedStyle(el);
    // A see-through shade the pointer passes through (the structure under it is the one seen and pointed at).
    if (cs.pointerEvents === 'none' && Number(cs.opacity) < 0.6) continue;
    const fill = cs.fill !== 'none' && cs.fill !== 'transparent' && Number(cs.fillOpacity) > 0.05;
    const stroke = cs.stroke !== 'none' && cs.stroke !== 'transparent' && Number(cs.strokeOpacity) > 0.05;
    if (!fill && !stroke) continue;
    out.push({ ids: idsOf(owner), el, inv: ctm.inverse(), fill, stroke, clips: clipsOf(el) });
  }
  return out;
}

/** The part drawn on top at frame point (x, y), if any. */
function topAt(shapes: Shape[], svg: SVGSVGElement, x: number, y: number): string[] | null {
  const p = svg.createSVGPoint();
  p.x = x;
  p.y = y;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    const l = p.matrixTransform(s.inv);
    const dp = new DOMPoint(l.x, l.y);
    try {
      // Clip shapes are drawn in the clipped element's user space (the scenes' clips carry no transform).
      const clipped = s.clips.some((c) => !c.some((g) => g.isPointInFill(dp)));
      if (!clipped && ((s.fill && s.el.isPointInFill(dp)) || (s.stroke && s.el.isPointInStroke(dp)))) return s.ids;
    } catch {
      /* shapes without geometry */
    }
  }
  return null;
}

/**
 * Where a leader ending at (x, y) lands: on its own part, on top (true); inside its own part but under
 * another one ('under'); or off its part altogether ('off'). The point or one within r counts.
 */
function lands(shapes: Shape[], svg: SVGSVGElement, ids: string[], x: number, y: number, r: number): { how: true | 'under' | 'off'; top: string } {
  const probes: [number, number][] = [[0, 0]];
  for (let a = 0; a < 8; a++) probes.push([Math.cos((a * Math.PI) / 4) * r, Math.sin((a * Math.PI) / 4) * r]);
  const top = topAt(shapes, svg, x, y)?.[0] ?? 'ezer ez';
  const mine = (p: string[] | null) => !!p?.some((q) => ids.includes(q));
  for (const [dx, dy] of probes) if (mine(topAt(shapes, svg, x + dx, y + dy))) return { how: true, top };
  const own = shapes.filter((s) => mine(s.ids));
  for (const [dx, dy] of probes) if (mine(topAt(own, svg, x + dx, y + dy))) return { how: 'under', top };
  return { how: 'off', top };
}

interface FrameReport {
  k: number;
  view: string;
  missed: string[];
  covered: string[];
  orphan: string[];
  visible: string[];
  labelled: string[];
}

function inspect(svg: SVGSVGElement): Omit<FrameReport, 'k' | 'view'> {
  const parts = new Map<string, Element[]>();
  for (const p of svg.querySelectorAll('[data-part]')) {
    if (shownOpacity(p) < 0.1) continue;
    for (const id of idsOf(p)) parts.set(id, [...(parts.get(id) ?? []), p]);
  }
  const shapes = shapesOf(svg);
  const missed: string[] = [];
  const covered: string[] = [];
  const orphan: string[] = [];
  const labelled = new Set<string>();
  for (const g of svg.querySelectorAll('g[data-label]')) {
    if (shownOpacity(g) < 0.1) continue;
    const id = g.getAttribute('data-label')!;
    labelled.add(id);
    // A whole (e.g. lateral mesoderm) is drawn as its members.
    const ids = [id, ...partsOf(id)];
    const own = ids.flatMap((m) => parts.get(m) ?? []);
    if (!own.length) {
      orphan.push(id);
      continue;
    }
    // A quiet part barely reacts to its name being pointed at.
    if (own.every((e) => e.querySelector(':scope > .part-quiet'))) orphan.push(`${id}(quiet)`);
    const dot = g.querySelector<SVGCircleElement>('circle.label-dot');
    // A mark (a process: a pool of light) has no outline for the leader to land on.
    if (!dot || own.every((e) => e.querySelector('.mark-light'))) continue;
    const ctm = dot.getCTM();
    if (!ctm) continue;
    const p = svg.createSVGPoint();
    p.x = dot.cx.baseVal.value;
    p.y = dot.cy.baseVal.value;
    const at = p.matrixTransform(ctm);
    const got = lands(shapes, svg, ids, at.x, at.y, 5);
    const where = `${id}@${Math.round(at.x * 2)},${Math.round(at.y * 2)}→${got.top}`;
    if (got.how === 'off') missed.push(where);
    else if (got.how === 'under') covered.push(where);
  }
  const visible = [...parts.entries()]
    .filter(([id, els]) =>
      els.some((e) => {
        // A group is not drawn on its own: its members are.
        if (e.getAttribute('data-part') !== id || e.querySelector('.part-quiet')) return false;
        const b = (e as SVGGraphicsElement).getBBox();
        return b.width * b.height > 120;
      }),
    )
    .map(([id]) => id);
  return { missed: [...new Set(missed)], covered: [...new Set(covered)], orphan: [...new Set(orphan)], visible, labelled: [...labelled] };
}

/**
 * ?audit=1&w=7[&s=0] — machine-checks the frames of one stage (or every stage of the week, one after
 * the other); the result is one JSON line per stage in #audit, then "DONE".
 */
export function Audit({ q }: { q: URLSearchParams }) {
  const w = weeks.find((x) => x.week === Number(q.get('w') ?? 1)) ?? weeks[0];
  const s = q.get('s');
  const list = s === null ? w.stages : [w.stages[Number(s)] ?? w.stages[0]];
  const [lines, setLines] = useState<string[]>([]);
  const at = lines.length;
  return (
    <div style={{ background: '#000' }}>
      <pre id="audit" style={{ color: '#ddd', fontSize: 12, whiteSpace: 'pre-wrap' }}>
        {[...lines, ...(at >= list.length ? ['DONE'] : [])].join('\n')}
      </pre>
      {at < list.length && <StageAudit key={list[at].id} week={w.week} st={list[at]} onDone={(l) => setLines((x) => [...x, l])} />}
    </div>
  );
}

function StageAudit({ week, st, onDone }: { week: number; st: StageDef; onDone: (line: string) => void }) {
  const frames = useMemo(() => stepFrames(st), [st]);
  const refs = useRef<(SVGSVGElement | null)[]>([]);
  useEffect(() => {
    const id = setTimeout(() => {
      const reps: FrameReport[] = frames.map((f, i) => ({ k: f.k, view: f.view, ...inspect(refs.current[i]!) }));
      // Per stage: shown somewhere but never named anywhere in it; appearing in a step without being named there.
      const named = new Set(reps.flatMap((r) => r.labelled));
      const unnamed = [...new Set(reps.flatMap((r) => r.visible))].filter((id) => !named.has(id));
      const popIn = reps.flatMap((r, i) => {
        const prev = reps[i - 1];
        if (!prev || prev.view !== r.view) return [];
        return r.visible.filter((id) => !prev.visible.includes(id) && !r.labelled.includes(id)).map((id) => `${r.k + 1}:${id}`);
      });
      const steps = reps
        .map((r) => ({ step: r.k + 1, view: r.view, missed: r.missed, covered: r.covered, orphan: r.orphan, bare: r.visible.filter((id) => !r.labelled.includes(id)) }))
        .filter((r) => r.missed.length || r.covered.length || r.orphan.length || r.bare.length);
      onDone(JSON.stringify({ stage: `${week}/${st.id}`, steps, unnamed, popIn }));
    }, 200);
    return () => clearTimeout(id);
    // Runs once per stage (the component is keyed by stage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      {frames.map((f, i) => {
        const v = st.views.find((x) => x.id === f.view) ?? st.views[0];
        const Scene = v.scene;
        const ctx: SceneContextValue = {
          selected: null,
          hovered: null,
          focus: f.focus,
          dimContext: !v.ownFocus,
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
            style={{ width: 500, display: 'inline-block' }}
          >
            <Defs />
            <SceneContext.Provider value={ctx}>
              <Scene t={f.t} reduced />
            </SceneContext.Provider>
          </svg>
        );
      })}
    </div>
  );
}
