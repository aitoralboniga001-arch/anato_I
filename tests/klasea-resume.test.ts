import { describe, expect, it } from 'vitest';
import { canResumeClass, savedClassPlace } from '@/lib/klasea/resume';
import { stepsOf } from '@/lib/klasea/engine';
import type { Lesson } from '@/lib/klasea/types';

const lesson: Lesson = {
  week: 10, title: 'Proba', goals: [],
  chunks: ['first', 'second'].map((id) => ({ id, title: id, stage: id, lines: [{ say: 'Bat', notes: [] }, { say: 'Bi', notes: [] }] })),
};

describe('class saved positions', () => {
  it('keeps the exact line, including within the first chunk', () => {
    const saved = savedClassPlace(lesson, { chunk: 'first', line: 1 });
    expect(saved).toEqual({ chunk: 'first', line: 1 });
    expect(canResumeClass(lesson, saved, null)).toBe(true);
    expect(canResumeClass(lesson, saved, 0)).toBe(true);
    expect(stepsOf(lesson).findIndex((s) => s.kind === 'line' && s.chunk === 0 && s.line === saved?.line)).toBe(1);
  });

  it('resumes a matching link but respects an intentional different chunk', () => {
    const saved = savedClassPlace(lesson, { chunk: 'second', line: 1 });
    expect(canResumeClass(lesson, saved, 1)).toBe(true);
    expect(canResumeClass(lesson, saved, 0)).toBe(false);
  });

  it.each([undefined, -1, 20, 0.5, '1', null, Infinity])('falls back to the known chunk start for legacy or invalid line %s', (line) => {
    expect(savedClassPlace(lesson, { chunk: 'second', line })).toEqual({ chunk: 'second', line: 0 });
  });

  it.each([null, 'first', 3, {}, { chunk: 'removed', line: 1 }])('ignores invalid or removed chunk %j', (saved) => {
    expect(savedClassPlace(lesson, saved)).toBeNull();
  });
});
