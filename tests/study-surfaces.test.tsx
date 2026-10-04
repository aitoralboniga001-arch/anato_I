import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { stepOf } from '@/components/shell/Questions';
import { AtlasCards } from '@/components/shell/AtlasCards';
import { POOL } from '@/content/pool';
import { appearances, structures } from '@/content/registry';
import { atlasTopics } from '@/content/structure-atlas';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

describe('question feedback leads back to the scene', () => {
  it('finds the stage of every question that names one', () => {
    for (const q of POOL.filter((x) => x.stageId)) expect(stepOf(q.week, q.stageId!, q.concept), q.id).not.toBeNull();
  });

  it('lands on a step that shows the question’s structure when the stage has one', () => {
    let landed = 0;
    for (const q of POOL.filter((x) => x.stageId && x.concept)) {
      const w = stepOf(q.week, q.stageId!, q.concept)!;
      const focusing = w.stage.beats.some((b) => b.focus?.includes(q.concept!));
      expect(!!w.step, q.id).toBe(focusing);
      if (w.step) {
        expect(w.stage.beats[w.step - 1].focus).toContain(q.concept);
        landed++;
      }
    }
    expect(landed).toBeGreaterThan(0);
  });
});

describe('structure atlas cards', () => {
  const items = [...structures.values()].filter((s) => atlasTopics(s.id).length);
  const html = renderToStaticMarkup(createElement(AtlasCards, { items, topic: 0, onChoose: () => {} }));

  it('shows every structure once, with its notes’ name and definition', () => {
    for (const s of items) {
      expect(html.split(`data-atlas-node="${s.id}"`).length - 1, s.id).toBe(1);
      expect(html).toContain(esc(s.name));
      expect(html).toContain(esc(s.definition));
    }
  });

  it('says where each structure first appears in the simulator', () => {
    const first = items.filter((s) => appearances.get(s.id)?.length);
    expect(first.length).toBeGreaterThan(0);
    for (const s of first) {
      const a = appearances.get(s.id)![0];
      expect(html).toContain(esc(`${a.week.week}. gaia · ${a.stage.title} · ${a.stage.day}`));
    }
  });
});
