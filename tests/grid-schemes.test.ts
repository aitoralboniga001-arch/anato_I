import { describe, expect, it } from 'vitest';
import { GRID_SCHEMES } from '@/content/eratorriak/grid-schemes';
import { getWeek } from '@/content/registry';

describe('integrated grid schemes', () => {
  it('have unique ids', () => {
    expect(new Set(GRID_SCHEMES.map((s) => s.id)).size).toBe(GRID_SCHEMES.length);
  });

  for (const s of GRID_SCHEMES) {
    it(`${s.week}/${s.id}: every slot is filled exactly once`, () => {
      // covered[r][c] counts the cells that occupy that slot, spans included.
      const covered = s.rows.map(() => s.columns.map(() => 0));
      s.rows.forEach((row, r) => {
        expect(row.cells).toHaveLength(s.columns.length);
        row.cells.forEach((cell, c) => {
          if (!cell) return;
          const span = cell.span ?? 1;
          expect(span).toBeGreaterThanOrEqual(1);
          expect(r + span).toBeLessThanOrEqual(s.rows.length);
          const cols = cell.cols ?? 1;
          expect(c + cols).toBeLessThanOrEqual(s.columns.length);
          for (let k = r; k < r + span; k++) for (let j = c; j < c + cols; j++) covered[k][j]++;
        });
      });
      expect(covered.flat().every((n) => n === 1)).toBe(true);
    });

    it(`${s.week}/${s.id}: stage exists and filters match rows`, () => {
      if (s.stage) expect(getWeek(s.week)?.stages.some((st) => st.id === s.stage)).toBe(true);
      for (const f of s.filters ?? []) expect(s.rows.some((row) => row.tags?.includes(f.tag))).toBe(true);
      const tags = new Set(s.rows.flatMap((row) => row.tags ?? []));
      for (const t of tags) expect(s.filters?.some((f) => f.tag === t)).toBe(true);
    });
  }

  it('cover topic 9 end to end and topic 12 from §2.4 on', () => {
    const sections = (week: number) => GRID_SCHEMES.filter((s) => s.week === week).map((s) => s.section).join(' ');
    for (const sec of ['1', '2.1.1', '2.1.3', '2.2.1', '2.2.2', '3', '4']) expect(sections(9)).toContain(sec);
    for (const sec of ['2.4', '2.5', '2.6', '2.7']) expect(sections(12)).toContain(sec);
  });
});
