import type { Lesson } from './types';

export interface SavedClassPlace { chunk: string; line: number }

/** Older bookmarks only named the chunk. Never resume outside the current lesson. */
export function savedClassPlace(lesson: Lesson, value: unknown): SavedClassPlace | null {
  if (!value || typeof value !== 'object' || !('chunk' in value)) return null;
  const chunk = lesson.chunks.find((c) => c.id === value.chunk);
  if (!chunk?.lines.length) return null;
  const line = 'line' in value ? value.line : 0;
  return { chunk: chunk.id, line: typeof line === 'number' && Number.isInteger(line) && line >= 0 && line < chunk.lines.length ? line : 0 };
}

/** An intentional link to another chunk wins over a previously saved place. */
export function canResumeClass(lesson: Lesson, saved: SavedClassPlace | null, linked: number | null): boolean {
  const index = saved ? lesson.chunks.findIndex((c) => c.id === saved.chunk) : -1;
  return index >= 0 && (linked === null || linked === index);
}
