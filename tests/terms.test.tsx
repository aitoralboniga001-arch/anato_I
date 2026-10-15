import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { linkTerms, termsOf } from '@/components/shell/terms';
import { weeks } from '@/content/registry';

const noop = () => {};

/** The caption as markup, and the words it linked (in order). */
function link(text: string, ids: string[], used = new Set<string>()) {
  const html = renderToStaticMarkup(createElement(Fragment, null, linkTerms(text, termsOf(ids), used, { onPick: noop })));
  const words = [...html.matchAll(/<span[^>]*class="term"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]);
  return { html, words, plain: html.replace(/<[^>]+>/g, '') };
}

describe('caption terms', () => {
  it('links the inflected Basque word, not just the dictionary form', () => {
    expect(link('Epiblastoko zelulak ildorantz hurbiltzen dira.', ['epiblastoa']).words).toEqual(['Epiblastoko']);
    expect(link('Trofoblastotik sortzen da.', ['trofoblastoa']).words).toEqual(['Trofoblastotik']);
  });

  it('never matches inside a longer word', () => {
    // "trofoblasto" is inside "zitotrofoblastoa": only the real structure is linked.
    expect(link('Zitotrofoblastoa barruan dago.', ['trofoblastoa']).words).toEqual([]);
    expect(link('Zitotrofoblastoa barruan dago.', ['trofoblastoa', 'zitotrofoblastoa']).words).toEqual(['Zitotrofoblastoa']);
  });

  it('accepts a hyphen between the words of a name and prefers the longer name', () => {
    expect(link('Buztanaren tolespenak kloaka-mintza bentralera eramaten du.', ['kloaka', 'kloaka-mintza']).words).toEqual(['kloaka-mintza']);
  });

  it('links each structure once per caption (the parts of one caption share the set)', () => {
    const used = new Set<string>();
    expect(link('Epiblastoa eta epiblastoa.', ['epiblastoa'], used).words).toEqual(['Epiblastoa']);
    expect(link('Berriro epiblastoa.', ['epiblastoa'], used).words).toEqual([]);
  });

  // Renders every step of every topic: slow on a loaded machine, so it gets more than the default 5 s.
  it('never changes the wording of any step', { timeout: 30000 }, () => {
    for (const w of weeks)
      for (const s of w.stages) {
        const ids = [...s.structures, ...s.beats.flatMap((b) => b.focus ?? [])];
        for (const b of s.beats) {
          const used = new Set<string>();
          for (const text of [b.idea, b.text].filter((x): x is string => !!x)) {
            const escaped = renderToStaticMarkup(createElement(Fragment, null, text)).replace(/<[^>]+>/g, '');
            expect(link(text, ids, used).plain, `${w.week}/${s.id}`).toBe(escaped);
          }
        }
      }
  });
});
