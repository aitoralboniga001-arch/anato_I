import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { SceneView } from '@/components/kit/columns';
import { structures, weeks } from '@/content/registry';
import { namedAt, namedSteps } from '@/components/shell/named';
import type { SceneComponent, StageDef } from '@/lib/sim/types';

/**
 * Progressive names: a name never shows in the picture before the study has said it (focused, toured,
 * recalled, written in a step so far) unless it was formed in an earlier stage; a step only adds names;
 * the stage's last step shows them all.
 */

const base: SceneContextValue = {
  selected: null,
  hovered: null,
  focus: [],
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => structures.get(id)?.name ?? id,
  onSelect: () => {},
  onHover: () => {},
};

const viewOf = (stage: StageDef, k: number) => {
  const want = [...stage.beats.slice(0, k + 1)].reverse().find((b) => b.view && stage.views.some((v) => v.id === b.view))?.view;
  return stage.views.find((v) => v.id === want) ?? stage.views[0];
};

/** The names drawn (visibly) in a scene's server-rendered markup. */
function labelsDrawn(Scene: SceneComponent, t: number, ctx: SceneContextValue): string[] {
  const html = renderToStaticMarkup(
    createElement(SceneContext.Provider, { value: ctx }, createElement(LabelScaleContext.Provider, { value: { k: 1, left: false, right: false } }, createElement(SceneView, { Scene, t, reduced: true }))),
  );
  const out = new Set<string>();
  for (const m of html.matchAll(/<g[^>]*data-label="([^"]+)"[^>]*>\s*<rect class="label-plate"/g)) {
    const op = /opacity="([^"]+)"/.exec(m[0])?.[1];
    if (!op || Number(op) > 0.3) out.add(m[1]);
  }
  return [...out];
}

describe('izenak urratsez urrats', () => {
  for (const w of weeks)
    for (const stage of w.stages)
      it(`${w.week}/${stage.id}: urrats batek izenak gehitu baino ez du egiten; azkenak denak`, () => {
        const steps = namedSteps(w.week, stage);
        steps.forEach((s, k) => {
          if (k > 0) for (const id of steps[k - 1]) expect(s.has(id), `${k + 1}. urratsa: ${id} desagertu da`).toBe(true);
          for (const id of stage.beats[k].focus ?? []) expect(s.has(id), `${k + 1}. urratsa: fokua ${id}`).toBe(true);
        });
        expect(namedAt(w.week, stage, stage.beats.length - 1)).toBeNull();
      });

  // The showcase topics, drawn: no name in the picture before its first mention.
  for (const w of weeks.filter((x) => x.week === 7 || x.week === 9))
    for (const stage of w.stages)
      it(`${w.week}/${stage.id}: izenik ez aipatu aurretik`, () => {
        const problems: string[] = [];
        stage.beats.forEach((b, k) => {
          const named = namedAt(w.week, stage, k);
          if (!named) return;
          const end = k + 1 < stage.beats.length ? stage.beats[k + 1].at : 1;
          const view = viewOf(stage, k);
          const focus = b.focus ?? [];
          for (const id of labelsDrawn(view.scene, Math.max(b.at, end - 0.035), { ...base, focus, named }))
            if (!named(id) && !focus.includes(id)) problems.push(`${k + 1}. urratsa [${view.id}]: ${id} aipatu aurretik izendatuta`);
        });
        expect(problems).toEqual([]);
      });
});
