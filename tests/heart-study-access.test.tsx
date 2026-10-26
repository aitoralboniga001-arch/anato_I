import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Player } from '@/components/shell/Player';
import { StudyMap } from '@/components/shell/StudyMap';
import { getWeek } from '@/content/registry';

describe('whole-topic cardiovascular study maps', () => {
  const html = renderToStaticMarkup(createElement(StudyMap));
  const card = (week: number) => html.match(new RegExp(`<a[^>]*href="/astea/${week}"[^>]*>([\\s\\S]*?)</a>`))?.[1] ?? '';

  it('covers formation, looping and derivatives instead of stopping at tube formation', () => {
    expect(card(10)).toContain('3.–10. asteak');
    for (const concept of ['Eskualde kardiogenikoa', 'Lehen zirkulazioa', 'bihotz lakioa', 'Atalen eratorriak']) expect(card(10)).toContain(concept);
  });

  it('connects the atrial, atrioventricular and ventricular partitions with birth', () => {
    for (const concept of ['bi septum', 'aurikulubentrikularra', 'Bentrikuluak', 'konoa', 'enborra', 'Jaiotza']) expect(card(11)).toContain(concept);
  });

  it('continues past the early arches to asymmetry, recurrent nerves and body arteries', () => {
    for (const concept of ['eskuina ≠ ezkerra', 'Nerbio atzerakariak', 'Beheranzko aorta', 'ardatz arteriak']) expect(card(12)).toContain(concept);
  });

  it.each([10, 11, 12])('gives topic %i five concise steps and its own destination', (week) => {
    expect(card(week).match(/<i>/g)).toHaveLength(5);
  });
});

const noop = () => {};
const stage = getWeek(10)!.stages[0];
const props: ComponentProps<typeof Player> = {
  stage, stageIndex: 0, stageCount: 10, t: 0.2, activeBeat: 0,
  playing: false, speed: 1, autoContinue: false, day: '',
  onSeek: noop, onTogglePlay: noop, onStage: noop, onBeat: noop,
  onSpeed: noop, onAutoContinue: noop, asks: false, onAsks: noop,
  guided: true, voice: true,
  audioState: { status: 'idle', text: '', focus: [], segment: 0, count: 1, fraction: 0, error: '' },
  voiceConfigured: true, onRepeat: noop, waiting: false, waitSeconds: null,
  fresh: [], mode: 'gidatua', onMode: noop, onVoice: noop,
  onContinue: noop, onNextStage: noop, onPick: noop,
  modelGuide: { key: 'test-view', content: stage.views[0].guide!, onOpen: noop },
};
const player = (overrides: Partial<typeof props> = {}) => renderToStaticMarkup(createElement(Player, { ...props, ...overrides }));

describe('picture guide access with narration enabled', () => {
  it.each([false, true])('offers the guide with voice on and playing=%s', (playing) => {
    expect(player({ playing })).toContain('aria-label="Irudia ulertu"');
  });

  it('also remains available in reading mode', () => {
    expect(player({ voice: false })).toContain('aria-label="Irudia ulertu"');
  });

  it.each([
    { intro: 'ready' as const },
    { ask: createElement('p', null, 'Question') },
    { tourCard: createElement('p', null, 'Tour') },
    { modelGuide: undefined },
  ])('does not compete with another learning panel (%j)', (overrides) => {
    expect(player(overrides)).not.toContain('aria-label="Irudia ulertu"');
  });
});
