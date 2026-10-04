import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WeekNav } from '@/components/shell/WeekNav';
import { weeks } from '@/content/registry';
import { isWip } from '@/components/shell/LandNav';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

describe('top-bar topic links', () => {
  const cur = weeks[Math.min(2, weeks.length - 1)];
  const html = renderToStaticMarkup(createElement(WeekNav, { current: cur, stageId: cur.stages[0].id }));

  it('names every topic and its stages, not only its number', () => {
    for (const w of weeks) {
      expect(html).toContain(`aria-label="${esc(`${w.week}. gaia: ${w.title}`)}`);
      expect(html).toContain(esc(w.title));
      if (!isWip(w)) for (const s of w.stages) expect(html).toContain(esc(s.title));
    }
  });

  it('marks the current topic and stage', () => {
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/Hemen zaude/g)).toHaveLength(1);
    expect(html).toContain(`class="is-cur">${esc(cur.stages[0].title)}`);
  });
});
