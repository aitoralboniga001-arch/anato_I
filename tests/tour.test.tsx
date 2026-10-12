import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { advance, start, type Nav, type NavAction } from '@/components/shell/tour/nav';
import { findTargets, overlap, placeCard, type Box, type ElementLike, type RootLike } from '@/components/shell/tour/geometry';
import { HOME_STOPS, SIM_STOPS, resolveStop, type Stop } from '@/components/shell/tour/steps';
import { endTour, hideOffer, isTourBusy, resetTourStore, showOffer, startTour, tourState, wasOffered } from '@/components/shell/tour/store';
import { offerSpot } from '@/components/shell/tour/TourHost';
import { Help } from '@/components/shell/Help';

/* ——— A tiny fake page: elements with a box, found by their data-tour id ——— */
type Fake = ElementLike & { tour?: string; kids?: Fake[] };
const el = (tour: string | undefined, x: number, y: number, w: number, h: number, kids: Fake[] = []): Fake => ({
  tour,
  kids,
  children: kids,
  getBoundingClientRect: () => ({ left: x, top: y, width: w, height: h }),
});
const page = (...els: Fake[]): RootLike => ({
  querySelectorAll(sel: string) {
    const ids = [...sel.matchAll(/data-tour="([^"]+)"/g)].map((m) => m[1]);
    return els.filter((e) => e.tour && ids.includes(e.tour));
  },
});
const run = (n: number, ...acts: NavAction[]) => acts.reduce<Nav>((s, a) => advance(s, a, n), start(n));

describe('guide navigation', () => {
  it('starts on the first stop and finishes after the last', () => {
    expect(start(3)).toMatchObject({ idx: 0, done: false });
    expect(run(3, 'next', 'next')).toMatchObject({ idx: 2, done: false });
    expect(run(3, 'next', 'next', 'next')).toMatchObject({ done: true, finished: true });
  });

  it('skips with Esc (close) at any stop, without counting as finished', () => {
    expect(run(5, 'next', 'close')).toMatchObject({ done: true, finished: false });
    // Once done, nothing moves it.
    expect(run(5, 'close', 'next', 'prev')).toMatchObject({ done: true, finished: false });
  });

  it('goes back, but not before the first stop', () => {
    expect(run(4, 'next', 'next', 'prev')).toMatchObject({ idx: 1, dir: -1 });
    expect(run(4, 'prev')).toMatchObject({ idx: 0, done: false });
  });

  it('passes over a missing stop in the direction of travel', () => {
    expect(run(5, 'next', 'missing')).toMatchObject({ idx: 2, done: false });
    expect(run(5, 'next', 'next', 'next', 'prev', 'missing')).toMatchObject({ idx: 1, dir: -1 });
    // Missing while going back from the second stop past the first: turn round instead.
    expect(run(5, 'next', 'prev', 'missing')).toMatchObject({ idx: 1, dir: 1, done: false });
    // The last stop missing ends the tour.
    expect(run(2, 'next', 'missing')).toMatchObject({ done: true });
  });

  it('ends when no stop can be shown at all', () => {
    expect(start(0)).toMatchObject({ done: true, finished: false });
    expect(run(3, 'missing', 'missing', 'missing')).toMatchObject({ done: true, finished: false });
  });
});

describe('finding the live element of a stop', () => {
  const stop: Stop = {
    id: 'x',
    title: 'Izenburua',
    text: 'Testua.',
    targets: [{ ids: ['zabala'], min: 2 }, { ids: ['estua'], text: 'Bestela.' }],
  };

  it('takes the first variant on screen, else the next (another layout)', () => {
    const wide = page(el('zabala', 0, 0, 40, 20), el('zabala', 50, 0, 40, 20), el('estua', 0, 40, 40, 20));
    expect(resolveStop(stop, wide, 1024, 768)?.variant.ids).toEqual(['zabala']);
    // Only one of the two the first variant needs: fall back.
    const narrow = page(el('zabala', 0, 0, 40, 20), el('estua', 0, 40, 40, 20));
    expect(resolveStop(stop, narrow, 768, 1024)?.variant.text).toBe('Bestela.');
  });

  it('treats hidden, zero-sized or off-screen elements as missing', () => {
    expect(resolveStop(stop, page(), 1024, 768)).toBeNull();
    expect(resolveStop(stop, page(el('estua', 0, 0, 0, 0)), 1024, 768)).toBeNull();
    expect(resolveStop(stop, page(el('estua', 1030, 10, 300, 600)), 1024, 768)).toBeNull(); // a closed drawer
    expect(resolveStop(stop, page(el('estua', 10, 10, 30, 30)), 1024, 768, false, () => false)).toBeNull();
  });

  it('on a scrolling page, finds what is below the fold (it is scrolled to)', () => {
    const below = page(el('estua', 10, 1800, 300, 200));
    expect(resolveStop(stop, below, 1440, 900)).toBeNull();
    expect(resolveStop(stop, below, 1440, 900, true)).not.toBeNull();
  });

  it('can light a container’s children (generated labels), the first of them only when asked', () => {
    const layer = el('etiketak', 0, 0, 0, 0, [el(undefined, 0, 0, 0, 0), el(undefined, 100, 100, 80, 20), el(undefined, 200, 100, 80, 20)]);
    const one = findTargets(page(layer), { ids: ['etiketak'], children: true, max: 1 }, 1024, 768);
    expect(one).toHaveLength(1);
    expect(one[0].getBoundingClientRect().left).toBe(100);
    expect(findTargets(page(layer), { ids: ['etiketak'], children: true }, 1024, 768)).toHaveLength(2);
  });

  it('a stop about a structure falls back to the whole picture when no name is drawn', () => {
    const egitura = SIM_STOPS.find((s) => s.id === 'egitura')!;
    const noLabels = page(el('etiketak', 0, 0, 0, 0, []), el('eszena', 68, 124, 1012, 596));
    const got = resolveStop(egitura, noLabels, 1440, 900)!;
    expect(got.variant.ids).toEqual(['eszena']);
    // The words still fit the fallback: they ask to click any structure.
    expect(egitura.text).toMatch(/edozein egitura/);
  });
});

describe('where the card goes', () => {
  const vw = 1440;
  const vh = 900;
  const card = { w: 340, h: 180 };
  const inside = (p: { x: number; y: number }) => p.x >= 16 && p.y >= 16 && p.x + card.w <= vw - 16 && p.y + card.h <= vh - 16;

  it('never on the lit element when there is room beside it', () => {
    const targets: Box[][] = [
      [{ x: 183, y: 6, w: 438, h: 40 }], // the topic links
      [{ x: 66, y: 820, w: 1016, h: 68 }], // the transport bar
      [{ x: 1389, y: 6, w: 40, h: 40 }], // the help key in the corner
      [{ x: 947, y: 49, w: 496, h: 854 }], // the notes column
      [{ x: 80, y: 134, w: 105, h: 28 }, { x: 963, y: 685, w: 105, h: 28 }], // two orientation chips
    ];
    for (const t of targets) {
      const p = placeCard(t, card, vw, vh);
      expect(inside(p)).toBe(true);
      for (const b of t) expect(overlap({ ...p, ...card }, b)).toBe(0);
    }
  });

  it('keeps clear of the specimen when it can', () => {
    const scene = { x: 68, y: 124, w: 1012, h: 596 };
    const p = placeCard([{ x: 1065, y: 8, w: 222, h: 36 }], card, vw, vh, [scene]);
    expect(overlap({ ...p, ...card }, scene)).toBe(0);
  });

  it('explains a top-bar key near it, even if that covers part of the dimmed specimen', () => {
    // 1024: the picture spans the window; the only clear spot is the far bottom corner.
    const scene = { x: 16, y: 114, w: 992, h: 331 };
    const keys = { x: 640, y: 8, w: 180, h: 34 };
    const p = placeCard([keys], { w: 320, h: 150 }, 1024, 768, [scene]);
    expect(p.y).toBeLessThan(keys.y + keys.h + 60);
  });

  it('the first-visit offer sits under the help key, or above the bottom bar, never on the picture', () => {
    const offer = { w: 330, h: 56 };
    const help = { x: 1392, y: 9, w: 34, h: 34 };
    // 1440: the right column is open, under "?" is clear.
    const wide = offerSpot(offer, 1440, 900, help, { x: 69, y: 823, w: 1010, h: 62 }, { x: 68, y: 124, w: 1012, h: 596 });
    expect(wide.y).toBeLessThan(80);
    expect(overlap({ ...wide, ...offer }, { x: 68, y: 124, w: 1012, h: 596 })).toBe(0);
    // A view switch under "?" that the card would cover: it docks elsewhere rather than hide it.
    const views = { x: 774, y: 50, w: 400, h: 40 };
    const shy = offerSpot(offer, 1440, 900, help, { x: 69, y: 823, w: 1010, h: 62 }, { x: 68, y: 124, w: 1012, h: 596 }, [views]);
    expect(overlap({ ...shy, ...offer }, views)).toBe(0);
    // 1024: the picture reaches the right edge; dock to the bottom bar instead.
    const scene = { x: 68, y: 114, w: 940, h: 481 };
    const mid = offerSpot(offer, 1024, 768, { x: 976, y: 9, w: 34, h: 34 }, { x: 69, y: 697, w: 938, h: 60 }, scene);
    expect(overlap({ ...mid, ...offer }, scene)).toBe(0);
    expect(mid.y + offer.h).toBeLessThanOrEqual(697);
    // 768: no help key in the bar; the bottom bar still holds it.
    const narrow = offerSpot(offer, 768, 1024, null, { x: 0, y: 939, w: 758, h: 85 }, { x: 12, y: 229, w: 734, h: 526 });
    expect(overlap({ ...narrow, ...offer }, { x: 12, y: 229, w: 734, h: 526 })).toBe(0);
  });
});

describe('starting, skipping and re-opening', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    (globalThis as { window?: unknown }).window = {
      localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
    };
    resetTourStore();
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('offers the tour once on the first visit, quietly', () => {
    expect(showOffer('sim')).toBe(true);
    expect(tourState().offer).toBe('sim');
    expect(isTourBusy()).toBe(true);
    hideOffer();
    expect(isTourBusy()).toBe(false);
    // Next visit: no offer again.
    resetTourStore();
    expect(showOffer('sim')).toBe(false);
    expect(tourState().offer).toBeNull();
    // Each place offers its own once.
    expect(showOffer('home')).toBe(true);
  });

  it('starts from the offer or from the button, and the offer gives way', () => {
    showOffer('sim');
    startTour('sim');
    expect(tourState()).toMatchObject({ active: 'sim', offer: null });
    endTour();
    expect(tourState().active).toBeNull();
    expect(wasOffered('sim')).toBe(true);
  });

  it('re-opens any time, from the first stop (a fresh run)', () => {
    startTour('sim');
    const first = tourState().run;
    endTour();
    startTour('sim');
    expect(tourState().active).toBe('sim');
    expect(tourState().run).toBe(first + 1);
  });

  it('without storage, never nags', () => {
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    };
    expect(wasOffered('sim')).toBe(true);
    expect(showOffer('sim')).toBe(false);
    startTour('sim');
    expect(tourState().active).toBe('sim');
  });
});

/* ——— The words and the hooks in the pages ——— */
const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sources(p) : /\.tsx?$/.test(f) ? [readFileSync(p, 'utf8')] : [];
  });
const code = [...sources('components'), ...sources('app')].join('\n');
const has = (id: string) => code.includes(`data-tour="${id}"`);

describe('guide copy', () => {
  const all = [...SIM_STOPS, ...HOME_STOPS].flatMap((s) => [s.title, s.text, ...s.targets.flatMap((v) => [v.title ?? '', v.text ?? ''])]);

  it('is short: one sentence, at most two, per stop', () => {
    for (const s of [...SIM_STOPS, ...HOME_STOPS])
      for (const t of [s.text, ...s.targets.map((v) => v.text ?? '')].filter(Boolean)) {
        expect(t.split(/[.!?](?:\s|$)/).filter((x) => x.trim()).length, t).toBeLessThanOrEqual(2);
        expect(t.length, t).toBeLessThanOrEqual(170);
      }
  });

  it('has no emoji and no past-exam talk', () => {
    for (const t of all) {
      expect(t, t).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(t.toLowerCase(), t).not.toMatch(/azterketa|exam/);
    }
  });

  it('every stop is hooked to the page (its data-tour element exists in the shell)', () => {
    for (const s of [...SIM_STOPS, ...HOME_STOPS]) {
      const ok = s.targets.some((v) => v.ids.every(has));
      expect(ok, `${s.id}: ${s.targets.map((v) => v.ids.join('+')).join(' | ')}`).toBe(true);
      if (s.open) expect(has(s.open), s.open).toBe(true);
    }
    expect(has('play')).toBe(true);
    expect(has('laguntza')).toBe(true);
  });
});

describe('one help system', () => {
  const html = renderToStaticMarkup(createElement(Help, { onClose: () => {} }));
  it('the help sheet leads with the guide, and the old welcome is gone', () => {
    expect(html).toContain('Hasi gida');
    expect(html.indexOf('Hasi gida')).toBeLessThan(html.indexOf('role="tablist"'));
    expect(html).not.toContain('Hiru gauza');
    expect(html).toContain('Nola erabili EnbrioAtlas');
  });
});
