import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ThoraxSection } from '@/components/scenes/week7/Thorax';

/**
 * What the narration says happens must be seen happening, not only the structures it names
 * (owner, 2026-10-25, topic 7: "I don't really see how the lung buds push the visceral layer",
 * "I don't really see it is a fold"). These pin the three topic 7 thorax fixes.
 */
const at = (t: number) => renderToStaticMarkup(createElement('svg', null, createElement(ThoraxSection, { t, reduced: true })));

describe('topic 7 thorax: narrated actions are drawn', () => {
  it('the buds push the splanchnic layer: one unbroken line, and a close-up while they grow', () => {
    const svg = at(0.3);
    // The mediastinal lining is cut where a bud is, the bud's outline where it is still inside: their union.
    expect(svg).toContain('mask="url(#w7-th-outL)"');
    expect(svg).toContain('mask="url(#w7-th-outM)"');
    expect(svg).toContain('Hurbiletik');
    expect(svg).toContain('aurretik bultzatzen du');
    expect(at(0.2)).not.toContain('Hurbiletik');
    expect(at(0.4)).not.toContain('Hurbiletik');
  });

  it('the pleuropericardial membrane is a fold of the wall: the cavity lining runs round it', () => {
    const svg = at(0.5);
    expect(svg).toContain('mask="url(#w7-th-outF)"');
    expect(svg).toContain('mask="url(#w7-th-inW0)"');
    expect(svg).toContain('mask="url(#w7-th-inW1)"');
  });

  it('the visceral pericardium reflects into the parietal one: the heart-in-balloon comparison', () => {
    expect(at(0.8)).toContain('Ukabila puxikan sakatuta');
    const svg = at(0.89);
    expect(svg).toContain('Bihotza puxikan sakatuta');
    expect(svg).toContain('kanpoko orria → paretako perikardioa');
  });
});
