import type { ContrastCheck, Lesson } from '@/lib/klasea/types';
import { LESSON_W10 } from './w10';

/** Topics that have a class: their guided mode is the class (docs/klasea-plan.md §2). */
export const LESSONS: Record<number, Lesson> = { 10: LESSON_W10 };

export const lessonOf = (week: number): Lesson | undefined => LESSONS[week];
export const hasClass = (week: number) => !!LESSONS[week];

/**
 * The class's own contrast checks, with the stage of the chunk they are asked in: they join the question
 * pool (source "klasea"), so a wrong or unsure answer comes back in the review like any other.
 */
export function contrastChecks(): { week: number; stage: string; check: ContrastCheck }[] {
  return Object.values(LESSONS).flatMap((lesson) =>
    lesson.chunks.flatMap((c) => (c.checks ?? []).flatMap((k) => (k.kind === 'contrast' ? [{ week: lesson.week, stage: c.stage, check: k }] : []))),
  );
}
