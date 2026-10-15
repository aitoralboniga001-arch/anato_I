import type { StageDef } from './types';

/** A stable frame to read after the step's movement, without entering the next caption. */
export function doneAt(stage: Pick<StageDef, 'beats'>, k: number): number {
  const beat = stage.beats[k];
  const next = stage.beats[k + 1];
  if (!next) return 1;
  const fallback = next.at - Math.min(0.035, (next.at - beat.at) * 0.25) - 1e-4;
  return beat.completeAt === undefined
    ? fallback
    : Math.max(beat.at, Math.min(next.at - 1e-4, beat.completeAt));
}
