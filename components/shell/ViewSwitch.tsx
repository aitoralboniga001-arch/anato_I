'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ViewDef } from '@/lib/sim/types';
import { PlaneGlyph } from './icons';

/** Horizontal gap between two flex children, as the stylesheet sets it. */
const gapOf = (el: Element) => parseFloat(getComputedStyle(el).columnGap) || 0;

/** Width of a view key that shows only its plane glyph (matches `.view-switch.is-compact` in CSS). */
const ICON_W = 36;

type Fit = 'full' | 'compact' | 'icons';

/**
 * The stage's ways of looking at the specimen, as one segmented control that always fits its row.
 * The stage title has priority: when every name does not fit beside it, only the current view keeps
 * its name and the others shrink to their plane glyph; when even that is too wide, every key is a
 * glyph (the names show on hover and to screen readers; the scene's own line says what it shows).
 * It never scrolls and never pushes the title onto a second line.
 */
export function ViewSwitch({ views, current, onChoose }: { views: readonly ViewDef[]; current: string; onChoose: (id: string) => void }) {
  const seg = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit>('full');
  const uid = useId();
  const labels = views.map((v) => v.label).join('|');

  useLayoutEffect(() => {
    const el = seg.current;
    const full = ghost.current;
    const side = el?.parentElement;
    const bar = el?.closest('.stage-bar') as HTMLElement | null;
    if (!el || !full || !side || !bar) return;
    const measure = () => {
      const heading = bar.querySelector('.stage-heading') as HTMLElement | null;
      const h2 = bar.querySelector('.stage-title h2') as HTMLElement | null;
      const chip = bar.querySelector('.day-chip') as HTMLElement | null;
      // Siblings sharing the row (the "Non nago?" thumbnail), with the gaps between them.
      let others = 0;
      for (const c of Array.from(side.children)) if (c !== el && c !== full && (c as HTMLElement).offsetWidth) others += (c as HTMLElement).offsetWidth + gapOf(side);
      // Heading and views on separate rows (narrow layouts): the views have the whole row.
      const stacked = !!heading && side.getBoundingClientRect().top >= heading.getBoundingClientRect().bottom - 1;
      // The stage navigator shares the title's line on short screens.
      const nav = bar.querySelector('.snav') as HTMLElement | null;
      const navW = nav && h2 && nav.offsetWidth && Math.abs(nav.getBoundingClientRect().top - h2.getBoundingClientRect().top) < 24 ? nav.offsetWidth + 12 : 0;
      const title = stacked || !h2 ? 0 : h2.scrollWidth + (chip ? chip.offsetWidth + gapOf(h2.parentElement!) : 0) + gapOf(bar) + navW;
      const room = bar.clientWidth - title - others;
      const items = Array.from(full.children) as HTMLElement[];
      const frame = full.offsetWidth - items.reduce((w, it) => w + it.offsetWidth, 0);
      const active = items[Math.max(0, views.findIndex((v) => v.id === current))]?.offsetWidth ?? ICON_W;
      const compactW = frame + active + (items.length - 1) * ICON_W;
      setFit(full.offsetWidth <= room ? 'full' : compactW <= room ? 'compact' : 'icons');
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    const h2 = bar.querySelector('.stage-title h2');
    if (h2) ro.observe(h2);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
    // `views` is read through `labels`/`current`: the measure only changes when those do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, current]);

  return (
    <div ref={seg} data-tour="ebakiak" className={`seg view-switch${fit === 'full' ? '' : ' is-compact'}`} role="tablist" aria-label="Ikuspegiak">
      {views.map((v, k) => {
        const on = v.id === current;
        const iconOnly = fit === 'icons' || (fit === 'compact' && !on);
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={on}
            aria-label={iconOnly ? v.label : undefined}
            className={on ? 'is-on' : ''}
            onClick={() => onChoose(v.id)}
            aria-describedby={`${uid}-${k}`}
            data-tip={`${iconOnly ? `${v.label} · ` : ''}${v.description} (${k + 1})`}
            data-tip-pos="bottom-end"
          >
            <PlaneGlyph plane={v.plane} size={18} />
            {!iconOnly && <span>{v.label}</span>}
          </button>
        );
      })}
      {/* What each view shows, read with its tab (sighted users get it as the tab's tip). */}
      {views.map((v, k) => (
        <span key={v.id} id={`${uid}-${k}`} hidden>
          {v.description}
        </span>
      ))}
      {/* Every name at full width, measured off-screen to decide whether they fit. */}
      <div ref={ghost} className="seg view-switch-ghost" aria-hidden>
        {views.map((v) => (
          <span key={v.id} className="vs-ghost-item">
            <PlaneGlyph plane={v.plane} size={18} />
            <span>{v.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
