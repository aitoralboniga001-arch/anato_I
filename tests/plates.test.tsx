import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { SceneView } from '@/components/kit/columns';
import { KEY_PLATES, PLATES, PLATE_GROUPS } from '@/content/plates';
import { isSpace, nameOf, partsOf, weeks } from '@/content/registry';
import type { SceneComponent } from '@/lib/sim/types';

/**
 * Image cards: every plate is a real view, draws enough names to number (as numbers, never as words),
 * and the key plates cover the figures students must read.
 */

const viewOf = (p: (typeof PLATES)[number]) => weeks.find((w) => w.week === p.week)?.stages.find((s) => s.id === p.stage)?.views.find((v) => v.id === p.view);

/** The names a plate numbers: rendered once with every number asked for (1 each). */
function numbered(p: (typeof PLATES)[number]) {
  const ctx: SceneContextValue = { selected: null, hovered: null, focus: [], showLabels: true, quiz: false, quizFlash: null, nameOf, isSpace, partsOf, numberOf: () => 1, onSelect() {}, onHover() {} };
  const html = renderToStaticMarkup(
    createElement(
      SceneContext.Provider,
      { value: ctx },
      createElement(LabelScaleContext.Provider, { value: { k: 1, left: false, right: false } }, createElement(SceneView, { Scene: viewOf(p)!.scene as SceneComponent, t: p.t, reduced: true })),
    ),
  );
  const ids = new Set([...html.matchAll(/data-label="([^"]+)" data-name="[^"]*" data-num="1"/g)].map((m) => m[1]));
  const led = new Set([...html.matchAll(/data-label="([^"]+)" data-name="[^"]*" data-num="1" data-lead=""/g)].map((m) => m[1]));
  return { ids, led, html };
}

describe('image cards (Irudi-fitxak)', () => {
  it('every plate is a real view of topics 7 onward, with a unique id', () => {
    expect(new Set(PLATES.map((p) => p.id)).size).toBe(PLATES.length);
    for (const p of PLATES) {
      expect(viewOf(p), p.id).toBeTruthy();
      expect(PLATE_GROUPS.some((g) => g.week === p.week), p.id).toBe(true);
      expect(p.t).toBeGreaterThanOrEqual(0);
      expect(p.t).toBeLessThanOrEqual(1);
    }
  });

  it('every plate numbers at least four names and shows no name as words', () => {
    for (const p of PLATES) {
      const { ids, led, html } = numbered(p);
      // A figure, not a summary table: most numbers point into it with a leader.
      expect(led.size, `${p.id}: ${led.size}/${ids.size} with a leader`).toBeGreaterThanOrEqual(Math.ceil(ids.size * 0.6));
      const want = p.only ? p.only.filter((id) => ids.has(id)) : [...ids];
      expect(want.length, `${p.id}: ${[...ids].join(', ')}`).toBeGreaterThanOrEqual(p.key ? 5 : 4);
      if (p.only) expect(want, p.id).toEqual(p.only);
      // Names are not printed as words on a plate, only numbers (the figure's CSS hides any other text).
      expect(html.includes('class="label-text"'), p.id).toBe(false);
    }
  }, 60_000);

  it('the key plates cover the figures to read first', () => {
    const covered = new Set(KEY_PLATES.flatMap((p) => [...numbered(p).ids]));
    for (const id of [
      // The primitive heart: its parts and the veins that reach it.
      'aorta-zakua',
      'atal-bulbarra',
      'atal-bentrikularra',
      'atal-aurikularra',
      'zain-sinua',
      'bitelo-zainak',
      'zilbor-zainak',
      'bena-kardinal-komuna',
      // The pericardioperitoneal canals.
      'erreten-perikardioperitonealak',
      'septum-transversum',
      // The aortic arches and what they become.
      'hirugarren-aorta-arkua',
      'laugarren-aorta-arkua',
      'seigarren-aorta-arkua',
      'enbor-brakiozefalikoa',
      'hodi-arteriosoa',
      // The venous system and the septa.
      'goiko-kaba-zaina',
      'beheko-kaba-zaina',
      'septum-primum',
      'septum-secundum',
      'zulo-obala',
      // The sphenoid.
      'esfenoidesaren-gorputza',
      'esfenoidesaren-hego-handia',
    ])
      expect(covered.has(id), id).toBe(true);
  }, 60_000);
});
