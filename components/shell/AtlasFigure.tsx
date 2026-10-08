'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Defs } from '@/components/kit/Defs';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { appearances, isSpace, partsOf, nameOf } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';
import { IconClose, IconExpand } from './icons';
import styles from './structure-atlas.module.css';

interface Shot {
  week: number;
  stage: StageDef;
  view: string;
  t: number;
}

/**
 * Frames that may show the structure, best first: late in each step that focuses it (where its tour
 * would hold), in that step's own view and then the others; then every view near the stage's end.
 */
export function shotsOf(id: string): Shot[] {
  const out: Shot[] = [];
  for (const { week, stage } of appearances.get(id) ?? []) {
    const ids = stage.views.map((v) => v.id);
    stage.beats.forEach((b, k) => {
      if (!b.focus?.includes(id)) return;
      const end = k + 1 < stage.beats.length ? stage.beats[k + 1].at : 1;
      const t = b.tourAt ?? b.at + (end - b.at) * 0.75;
      for (const view of [...(b.view && ids.includes(b.view) ? [b.view] : []), ...ids.filter((v) => v !== b.view)]) out.push({ week: week.week, stage, view, t });
    });
    for (const view of ids) out.push({ week: week.week, stage, view, t: 0.95 });
  }
  return out.slice(0, 16);
}

const subscribeNothing = () => () => {};
const noop = () => {};
const W = 1000;
const H = 640;

export type Box = [number, number, number, number];
const area = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]);

/** Frame around a box: padded, in the scene's proportions, never closer than half the frame (the surroundings explain it). */
export function frameAround([x0, y0, x1, y1]: Box): Box {
  const pad = 40;
  let w = Math.max(x1 - x0 + 2 * pad, W / 2);
  let h = Math.max(y1 - y0 + 2 * pad, H / 2);
  if (w / h > W / H) h = (w * H) / W;
  else w = (h * W) / H;
  w = Math.min(w, W);
  h = Math.min(h, H);
  return [Math.min(Math.max(0, (x0 + x1 - w) / 2), W - w), Math.min(Math.max(0, (y0 + y1 - h) / 2), H - h), w, h];
}

/**
 * The structure as the simulator draws it: of the frames that show it, the one where it is drawn
 * largest, lit (the rest shaded, as in the guided tour) and framed around it and its name, with the
 * names grown to stay readable at this size. Links to that moment in the simulator.
 * Render with `key={id}` so a new structure starts its search afresh.
 */
export function AtlasFigure({ id }: { id: string }) {
  const [shots] = useState(() => shotsOf(id));
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<{ vb: Box; k: number } | null>(null);
  // Enlarged over the page (the panel's drawing is small on a tablet); the same drawing, no new search.
  const [big, setBig] = useState(false);
  const seen = useRef<{ i: number; size: number; box: Box }[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const shot = shots[i];

  const measure = useEffectEvent(() => {
    const root = svg.current;
    const ctm = root?.getScreenCTM();
    if (!root || !ctm || !shot || pick) return;
    const inv = ctm.inverse();
    const boxOf = (attr: string): Box | null => {
      let b: Box = [Infinity, Infinity, -Infinity, -Infinity];
      for (const g of root.querySelectorAll<SVGGElement>(`[${attr}="${CSS.escape(id)}"]`)) {
        if (Number(g.getAttribute('opacity') ?? 1) <= 0.3) continue;
        const r = g.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        for (const [cx, cy] of [[r.left, r.top], [r.right, r.bottom]]) {
          const q = new DOMPoint(cx, cy).matrixTransform(inv);
          b = [Math.min(b[0], q.x), Math.min(b[1], q.y), Math.max(b[2], q.x), Math.max(b[3], q.y)];
        }
      }
      return Number.isFinite(b[0]) ? b : null;
    };
    const part = boxOf('data-part');
    const label = boxOf('data-label');
    if (part || label) {
      const box = [part, label].filter((b): b is Box => !!b).reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])]);
      seen.current.push({ i, size: part ? area(part) : 0, box });
    }
    if (i + 1 < shots.length) {
      setI(i + 1);
      return;
    }
    // Largest drawing wins; among near-equals (80%) the earliest frame, the step that introduces it.
    const max = Math.max(0, ...seen.current.map((c) => c.size));
    const best = seen.current.find((c) => c.size >= 0.8 * max);
    if (!best) {
      setI(shots.length);
      return;
    }
    const vb = frameAround(best.box);
    // Names drawn at ~11 px on screen whatever the zoom (the label kit caps them inside the frame).
    const k = Math.min(2.2, Math.max(1, (0.815 * vb[2]) / Math.max(1, root.clientWidth)));
    setI(best.i);
    setPick({ vb, k });
  });
  useEffect(() => {
    if (!mounted) return;
    const r = requestAnimationFrame(() => measure());
    return () => cancelAnimationFrame(r);
  }, [mounted, i]);

  // Esc closes the enlarged figure before anything else on the page reacts to it.
  useEffect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      setBig(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [big]);

  if (!shot) return null;
  const view = shot.stage.views.find((v) => v.id === shot.view)!;
  const Scene = view.scene;
  const ctx: SceneContextValue = {
    selected: null,
    hovered: null,
    focus: [],
    spotlight: id,
    showLabels: true,
    quiz: false,
    quizFlash: null,
    nameOf,
    isSpace,
    partsOf,
    onSelect: noop,
    onHover: noop,
  };
  const href = `/astea/${shot.week}?${new URLSearchParams({ etapa: shot.stage.id, ikuspegia: shot.view, egitura: id })}`;
  const figure = (
    <figure className={styles.figure} data-ready={!!pick || undefined} data-big={big || undefined} onClick={big ? (e) => e.target === e.currentTarget && setBig(false) : undefined}>
      {pick && (
        <button type="button" className={styles.figureZoom} onClick={() => setBig((v) => !v)} aria-pressed={big} aria-label={big ? 'Irudia txikitu' : 'Irudia handitu'} title={big ? 'Itxi (Esc)' : 'Handitu'}>
          {big ? <IconClose size={16} /> : <IconExpand size={15} />}
        </button>
      )}
      <Link href={href} aria-label={`${nameOf(id)} simulagailuan ikusi: ${shot.stage.title}`}>
        <svg ref={svg} viewBox={pick ? pick.vb.map((v) => v.toFixed(0)).join(' ') : `0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">
          <Defs />
          {mounted && (
            <SceneContext.Provider value={ctx}>
              <LabelScaleContext.Provider value={{ k: big ? 1 : (pick?.k ?? 1), left: false, right: false }}>
                <Scene t={shot.t} reduced />
              </LabelScaleContext.Provider>
            </SceneContext.Provider>
          )}
        </svg>
      </Link>
      <figcaption>
        {shot.week}. gaia · {shot.stage.title}
        {shot.stage.views.length > 1 && <> · {view.label}</>}
      </figcaption>
    </figure>
  );
  // Enlarged, the figure moves to the page's top layer (the panel is a sticky box that would keep it
  // under the page header); its place in the panel is held so nothing below jumps.
  if (big)
    return (
      <>
        <div className={styles.figure} aria-hidden>
          <span className={styles.figureHold} />
        </div>
        {createPortal(figure, document.body)}
      </>
    );
  return figure;
}
