import { describe, expect, it } from 'vitest';
import { weeks } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';
import { travelPlan } from '@/components/shell/ViewTravel';
import { hubPlan, zoomPlan } from '@/components/shell/ViewZoom';

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

/**
 * Never get lost: in the topics pinned here, every change between two body pictures in the guided order
 * is a camera move (travel between planes, a dive into a close-up or a cut, or a turn of the 3D model),
 * never a cut. Tables and close-up figures are left out, as above.
 */
const MOVED = [8];

describe('ikuspegi aldaketak: kamera mugitzen da', () => {
  for (const w of weeks.filter((x) => MOVED.includes(x.week)))
    for (const stage of w.stages)
      it(`${w.week}/${stage.id}: ikuspegi aldaketa bakoitza kamera mugimendu bat da`, () => {
        const seq = viewsOf(stage);
        const bad: string[] = [];
        for (let k = 1; k < seq.length; k++) {
          if (seq[k] === seq[k - 1]) continue;
          const a = stage.views.find((v) => v.id === seq[k - 1])!;
          const b = stage.views.find((v) => v.id === seq[k])!;
          const figure = (p: string) => p === 'eskema' || p === 'xehetasuna';
          if (figure(a.plane) || figure(b.plane)) continue;
          const at = stage.beats[k].at;
          const day = stage.dayRange[0] + (stage.dayRange[1] - stage.dayRange[0]) * at;
          const bodyOf = (v: typeof a) => (typeof v.age === 'number' ? v.age : (v.body ?? day));
          const moved = travelPlan(w.week, bodyOf(b), a, b, bodyOf(a)) ?? zoomPlan(a, b, stage.id, stage.id) ?? hubPlan(a, b, stage.views);
          if (!moved) bad.push(`${k + 1}. urratsa: ${a.id} → ${b.id}`);
        }
        expect(bad).toEqual([]);
      });
});
