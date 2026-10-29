import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { SceneView } from '@/components/kit/columns';
import { LESSONS } from '@/content/klasea';
import { getWeek, partsOf, structures } from '@/content/registry';
import { worldOf } from '@/components/klasea/useKlasea';
import { commandOf, playMs, stepsOf } from '@/lib/klasea/engine';
import { speakSeconds } from '@/lib/klasea/voice';
import type { SceneComponent, StageDef } from '@/lib/sim/types';

/**
 * The class's views: each line is said over a view (its own, its chunk's, else the one its step shows)
 * while the scene plays on, and each structure it lights must be drawn there, with its name's dot inside
 * the picture, as the voice names it (cues.ts; or within GRACE after, while the scene fades it in: Kimu's
 * arm waits for the name) and as the line ends. When a line's view cannot,
 * the line names another view (`view`) or is said later in the step (`at`). The camera may still turn to
 * a structure the voice names (3D: aim.ts showCamera), but never has to look for it outside the view.
 */

const ctxFor = (focus: string[]): SceneContextValue => ({
  selected: null,
  hovered: null,
  focus,
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => structures.get(id)?.name ?? id,
  onSelect: () => {},
  onHover: () => {},
});

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr', 'source', 'col', 'area', 'embed', 'track']);

/** What a frame draws: each part's and label's opacity (its own × its ancestors'), and the name dots. */
function render(Scene: SceneComponent, t: number, focus: string[]) {
  const html = renderToStaticMarkup(
    createElement(SceneContext.Provider, { value: ctxFor(focus) }, createElement(LabelScaleContext.Provider, { value: { k: 1, left: false, right: false } }, createElement(SceneView, { Scene, t, reduced: true }))),
  );
  const parts = new Map<string, number>();
  const labels = new Map<string, number>();
  const dots: { id: string; x: number; y: number; o: number }[] = [];
  const stack: { tag: string; o: number; label?: string }[] = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, self] = m;
    if (close) {
      while (stack.length && stack.pop()!.tag !== tag);
      continue;
    }
    const parent = stack[stack.length - 1];
    const own = /\sopacity="([^"]+)"/.exec(attrs);
    const o = (parent?.o ?? 1) * (own ? Number(own[1]) : 1);
    const part = /data-part="([^"]+)"/.exec(attrs)?.[1];
    const label = /data-label="([^"]+)"/.exec(attrs)?.[1] ?? parent?.label;
    if (part) parts.set(part, Math.max(parts.get(part) ?? 0, o));
    for (const g of /data-groups="([^"]+)"/.exec(attrs)?.[1]?.split(' ') ?? []) parts.set(g, Math.max(parts.get(g) ?? 0, o));
    if (/data-label="/.test(attrs)) labels.set(label!, Math.max(labels.get(label!) ?? 0, o));
    const dot = /class="label-dot" cx="([^"]+)" cy="([^"]+)"/.exec(attrs);
    if (dot && label) dots.push({ id: label, x: Number(dot[1]), y: Number(dot[2]), o });
    if (!self && !VOID.has(tag)) stack.push({ tag, o, label });
  }
  return { parts, labels, dots };
}

/** The 1000×640 frame, less the tool column at the top right. */
const outside = (x: number, y: number) => x < 6 || x > 994 || y < 6 || y > 634 || (x > 932 && y < 222);
const CONCEPT = new Set(['prozesua', 'ardatza']);
/**
 * Lines no single view of their stage can show whole (topic/chunk#line/structure → why): the class says
 * them over the view that shows the rest, and Kimu's arm waits for a name that never comes.
 */
const EXCUSED: Record<string, string> = {
  '8/aurpegia#10/gandor-neurala': 'burezurra draws the frontal bone; the crest is drawn in arkuak only',
  '8/saihetsak#1/saihets-hezurra': 'the cut shows the sclerotome cells leaving; the rib is drawn once they arrive (next line)',
  '8/saihetsak#5/paretako-orria': 'the front view draws the sternal bars, not the layer they come from',
  '9/gaur#4/errai-orria': 'the tissue panel draws the three muscle types, not the layers',
  '9/gaur#5/errai-orria': 'the tissue panel draws the three muscle types, not the layers',
  '9/adarrak#5/aurreko-adar-primarioa': 'the table lists the muscles; the rami are drawn in other views without them',
  '9/adarrak#7/atzeko-adar-primarioa': 'the table lists the muscles; the rami are drawn in other views without them',
  '9/adarrak#8/aurreko-adar-primarioa': 'the table lists the muscles; the rami are drawn in other views without them',
};
/** Seconds of speech a named structure may take to fade in after its name is said. */
const GRACE = 1.2;

/** The simulator's played-step easing (Simulator.tsx `steady`): steady speed, soft start and stop. */
const RAMP = 0.12;
const steady = (x: number) => {
  const v = 1 / (1 - RAMP);
  if (x < RAMP) return (v * x * x) / (2 * RAMP);
  if (x > 1 - RAMP) return 1 - (v * (1 - x) * (1 - x)) / (2 * RAMP);
  return v * (x - RAMP / 2);
};

/** The view the simulator shows a stage time in, when the class names none: its step's. */
const stepView = (stage: StageDef, t: number) => {
  const k = stage.beats.findLastIndex((b) => b.at <= t + 1e-9);
  const want = [...stage.beats.slice(0, k + 1)].reverse().find((b) => b.view && stage.views.some((v) => v.id === b.view))?.view;
  return stage.views.find((v) => v.id === want) ?? stage.views[0];
};

for (const [w, lesson] of Object.entries(LESSONS))
  describe(`topic ${w} class`, () => {
    const week = getWeek(Number(w))!;
    it('each line\'s view shows what it lights, as the voice names it and as the line ends', { timeout: 120000 }, () => {
      const bad: string[] = [];
      const steps = stepsOf(lesson);
      steps.forEach((s, i) => {
        if (s.kind !== 'line') return;
        const line = lesson.chunks[s.chunk].lines[s.line];
        const focus = (line.focus ?? []).filter((id) => !CONCEPT.has(structures.get(id)?.category ?? ''));
        if (!focus.length) return;
        const world = worldOf(Number(w));
        const cmd = commandOf(lesson, { step: i, phase: 'speak', plain: false, weak: [], heard: 0 }, undefined, world);
        const stage = week.stages.find((st) => st.id === cmd.stage)!;
        const view = (cmd.view && stage.views.find((v) => v.id === cmd.view)) || stepView(stage, cmd.at);
        // The scene plays on while it is said, to where the class stops it (the step's end or the next line).
        const to = cmd.playTo ?? cmd.at;
        const ms = playMs(line.say);
        const sceneAt = (said: number) => cmd.at + (to - cmd.at) * steady(Math.min(1, (said * speakSeconds(line.say) * 1000) / ms));
        const grace = GRACE / speakSeconds(line.say);
        const moments = [
          ...cmd.cues.filter((c) => focus.includes(c.id)).map((c) => ({ name: `said ${(c.at * 100).toFixed(0)}%`, t: sceneAt(c.at), late: sceneAt(Math.min(1, c.at + grace)), ids: [c.id] })),
          { name: 'end', t: to, late: to, ids: focus },
        ];
        const isDrawn = (seen: ReturnType<typeof render>, id: string) =>
          Math.max(seen.parts.get(id) ?? 0, seen.labels.get(id) ?? 0, ...partsOf(id).map((p) => seen.parts.get(p) ?? 0)) > 0.3;
        for (const m of moments) {
          const seen = render(view.scene, m.t, focus);
          for (const id of m.ids) {
            const where = `${lesson.chunks[s.chunk].id}#${s.line} [${stage.id}/${view.id} ${m.name} t=${m.t.toFixed(3)}] ${id}`;
            // As it ends, a structure may already be turning into the next one (its step's change).
            if (m.name !== 'end' && !EXCUSED[`${w}/${lesson.chunks[s.chunk].id}#${s.line}/${id}`] && !isDrawn(seen, id) && !isDrawn(render(view.scene, m.late, focus), id)) bad.push(`${where}: not drawn`);
            for (const d of seen.dots) if (d.id === id && d.o > 0.3 && outside(d.x, d.y)) bad.push(`${where}: name dot outside the picture`);
          }
        }
      });
      expect([...new Set(bad)]).toEqual([]);
    });
  });
