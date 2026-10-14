import { describe, expect, it } from 'vitest';
import { weeks } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';

/**
 * A study that flows: the camera never moves to another place in the body on two steps running. A
 * table or summary (plane `eskema`), a close-up (plane `xehetasuna`) or a zoom into the drawing it came
 * from is not a move in the body: those may follow one another. Pinned for the showcase topics (7, 9);
 * the others are back-ported as they are reworked.
 */

const SHOWCASE = [7, 9];

/** The view each step is shown in (a step without one keeps the previous step's). */
const viewsOf = (stage: StageDef) => {
  let cur = stage.views[0].id;
  return stage.beats.map((b) => {
    if (b.view && stage.views.some((v) => v.id === b.view)) cur = b.view;
    return cur;
  });
};

/** Does going from one view to the other move the camera to another place or plane of the body? */
const moves = (stage: StageDef, a: string, b: string) => {
  if (a === b) return false;
  const x = stage.views.find((v) => v.id === a)!;
  const y = stage.views.find((v) => v.id === b)!;
  const figure = (p: string) => p === 'eskema' || p === 'xehetasuna';
  if (figure(x.plane) || figure(y.plane)) return false;
  return x.zoom?.from !== b && y.zoom?.from !== a;
};

describe('ikuspegi aldaketak', () => {
  for (const w of weeks.filter((x) => SHOWCASE.includes(x.week)))
    for (const stage of w.stages)
      it(`${w.week}/${stage.id}: kamera ez da bi urratsetan jarraian lekuz aldatzen`, () => {
        const seq = viewsOf(stage);
        const bad: string[] = [];
        for (let k = 2; k < seq.length; k++) if (moves(stage, seq[k - 2], seq[k - 1]) && moves(stage, seq[k - 1], seq[k])) bad.push(`${k}–${k + 1}. urratsak: ${seq[k - 2]} → ${seq[k - 1]} → ${seq[k]}`);
        expect(bad).toEqual([]);
      });
});
