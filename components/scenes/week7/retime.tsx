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
