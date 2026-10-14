import type { SceneComponent, SceneProps } from '@/lib/sim/types';

/**
 * The same scene played over the first `end` of the stage (0..end → 0..1) and held at its last frame
 * after that: a stage can then end with one more step in a new view without re-timing the old drawings.
 * Not a client module: the content calls it on the server too (it must not read anything off `Scene`).
 */
export function retime(Scene: SceneComponent, end: number): SceneComponent {
  function Retimed({ t, reduced }: SceneProps) {
    return <Scene t={Math.min(1, t / end)} reduced={reduced} />;
  }
  return Retimed;
}

/**
 * The same scene with the stage's time mapped onto its own through `[stage t, scene t]` knots (ascending,
 * piecewise linear): a stage can put its steps in a clearer order, or stretch one step over another's
 * time, without re-timing the drawing. Not a client module (see retime).
 */
export function remap(Scene: SceneComponent, knots: readonly [number, number][]): SceneComponent {
  function Remapped({ t, reduced }: SceneProps) {
    let u = knots[knots.length - 1][1];
    for (let i = 1; i < knots.length; i++) {
      const [a, sa] = knots[i - 1];
      const [b, sb] = knots[i];
      if (t <= b) {
        u = sa + (sb - sa) * (b > a ? (Math.max(a, t) - a) / (b - a) : 1);
        break;
      }
    }
    return <Scene t={u} reduced={reduced} />;
  }
  return Remapped;
}
