import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TopicList, WeekNav } from '@/components/shell/WeekNav';
import { weeks } from '@/content/registry';
import { isWip } from '@/components/shell/LandNav';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

describe('top-bar topic switcher', () => {
  const cur = weeks[Math.min(2, weeks.length - 1)];

  it('names the current topic by number and name, never a bare number', () => {
    const html = renderToStaticMarkup(createElement(WeekNav, { current: cur, stageId: cur.stages[0].id }));
    expect(html).toContain(`aria-label="${esc(`Gaia: ${cur.week}. ${cur.title}. Gaiak aldatu`)}`);
    expect(html).toContain(`>${esc(cur.title)}<`);
    expect(html).toContain('aria-haspopup="dialog"');
    // The tour's anchors stay on the switcher.
    expect(html).toContain('data-tour="gaiak"');
    expect(html).toContain('data-tour="gaia-hautatu"');
  });

  it('lists every topic with its name and span, and marks only the current one', () => {
    const html = renderToStaticMarkup(createElement(TopicList, { current: cur, stageId: cur.stages[0].id, visited: {} }));
    for (const w of weeks) {
      expect(html).toContain(`aria-label="${esc(`${w.week}. gaia: ${w.title}`)}`);
      expect(html).toContain(`href="/astea/${w.week}"`);
      expect(html).toContain(esc(w.title));
      if (isWip(w)) expect(html).toContain('Prestatzen');
    }
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/Hemen zaude/g)).toHaveLength(1);
    expect(html).toContain(esc(cur.stages[0].title));
  });
});
