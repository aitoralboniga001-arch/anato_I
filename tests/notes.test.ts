import { describe, expect, it } from 'vitest';
import { weeks } from '@/content/registry';
import { NOTES, sectionLabel, sectionOf } from '@/content/notes';
import { EXAM_DATES } from '@/content/examDates';

describe('notes table of contents', () => {
  it('puts every stage in exactly one section, in the order they are played', () => {
    for (const w of weeks) {
      const listed = (NOTES[w.week] ?? []).flatMap((s) => s.stages);
      expect(listed, `${w.week}. gaia`).toEqual(w.stages.map((s) => s.id));
    }
  });

  it('numbers sections as the notes do and explains the empty ones', () => {
    for (const [week, list] of Object.entries(NOTES)) {
      for (const s of list) {
        expect(s.n, `${week}/${s.title}`).toMatch(/^\d+(\.\d+)?(–\d+(\.\d+)?)?$/);
        expect(s.depth === 1, `${week}/${s.n}`).toBe(s.n.includes('.'));
        // A heading without stages either explains why, or is followed by its sub-headings.
        if (!s.stages.length) {
          const next = list[list.indexOf(s) + 1];
          expect(!!s.note || next?.depth === 1, `${week}/${s.n}`).toBe(true);
        }
      }
    }
  });

  it('finds the parent heading of a sub-heading', () => {
    const r = sectionOf(4, 'somitak');
    expect(r && sectionLabel(r.section)).toBe('3.1 Mesodermo paraxialean gertatutako aldaketak');
    expect(r?.parent && sectionLabel(r.parent)).toBe('3. Mesodermoaren eratorriak');
    expect(sectionOf(4, 'neurulazioa')?.section.title).toBe('Ektodermoaren eratorriak');
  });
});

describe('exam dates', () => {
  it('pin to real steps and take their numbers from the step itself', () => {
    for (const [key, byAt] of Object.entries(EXAM_DATES)) {
      const [wn, sid] = key.split('/');
      const stage = weeks.find((w) => w.week === Number(wn))?.stages.find((s) => s.id === sid);
      expect(stage, key).toBeDefined();
      for (const [at, list] of Object.entries(byAt)) {
        const beat = stage!.beats.find((b) => b.at === Number(at));
        expect(beat, `${key}@${at}`).toBeDefined();
        const source = [beat!.text, beat!.idea, beat!.exam, stage!.day].join(' ');
        for (const d of list) for (const num of d.when.match(/\d+(,\d+)?/g) ?? []) expect(source, `${key}@${at}: ${d.when}`).toContain(num);
      }
    }
  });
});
