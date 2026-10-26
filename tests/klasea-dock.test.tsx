import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ClassDock } from '@/components/klasea/ClassDock';
import type { Klasea } from '@/components/klasea/useKlasea';
import { commandOf, initialState } from '@/lib/klasea/engine';
import { LESSONS } from '@/content/klasea';

const lesson = LESSONS[10];
const noop = () => {};
const card = (saved: Klasea['saved'], linkSaved: number) => renderToStaticMarkup(createElement(ClassDock, {
  k: {
    lesson, state: initialState(), cmd: commandOf(lesson, initialState()),
    status: 'card', rate: 1, saved, linkSaved, linkChunk: null,
    start: noop, resumeSaved: noop,
  } as unknown as Klasea,
  mode: 'gidatua', onMode: noop, onAskKimu: noop, holdReason: null,
}));

describe('class start choices', () => {
  it.each([-1, 0])('offers first-chunk exact-line resume for link %i', (link) => {
    const html = card({ chunk: lesson.chunks[0].id, line: 1 }, link);
    expect(html).toContain('Jarraitu · 1.');
    expect(html).toContain('Hasieratik hasi');
    expect(html).not.toContain('Klasea hemendik');
  });

  it('offers a different linked chunk instead of resuming elsewhere', () => {
    const html = card({ chunk: lesson.chunks[0].id, line: 1 }, 2);
    expect(html).toContain('Klasea hemendik · 3.');
    expect(html).not.toContain('Jarraitu · 1.');
  });

  it('offers a fresh start without a bookmark', () => {
    expect(card(null, -1)).toContain('Hasi klasea');
    expect(card(null, -1)).not.toContain('Hasieratik hasi');
  });
});
