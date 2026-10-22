import { describe, expect, it } from 'vitest';
import { getWeek } from '@/content/registry';
import { guides10, guides11, guides12 } from '@/content/heart-guides';

/** Topics 10–12: every picture has its "Irudia ulertu" reading aid, and no aid points at a view that is gone. */
describe.each([
  [10, guides10],
  [11, guides11],
  [12, guides12],
] as const)('topic %i reading aids', (week, guides) => {
  const views = getWeek(week)!.stages.flatMap((s) => s.views.map((v) => ({ key: `${s.id}/${v.id}`, guide: v.guide })));

  it('every view has a guide with all five parts', () => {
    for (const { key, guide } of views) {
      expect(guide, key).toBeDefined();
      for (const part of ['orientation', 'observe', 'meaning', 'question', 'answer'] as const) {
        const text = guide![part];
        expect(text.trim().length, `${key} ${part}`).toBeGreaterThan(10);
        expect(text.length, `${key} ${part} is too long to read at a glance`).toBeLessThanOrEqual(240);
      }
      expect(guide!.question.trim().endsWith('?'), `${key} question`).toBe(true);
    }
  });

  it('every guide belongs to a view', () => {
    const keys = new Set(views.map((v) => v.key));
    for (const key of Object.keys(guides)) expect(keys.has(key), key).toBe(true);
  });
});
