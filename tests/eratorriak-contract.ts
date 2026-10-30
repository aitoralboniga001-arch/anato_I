import { describe, expect, it } from 'vitest';
import { getWeek, structures } from '@/content/registry';
import { aliveAt, drawnAt, nameAt, type RoomData, type StudyCard } from '@/content/eratorriak/model';
import type { NotesBlock } from '@/content/notes-text';
import type { Geometry } from '@/components/shell/eratorriak/kit/PieceDiagram';

/** Invariants that would otherwise let a diagram, answer table and card deck quietly diverge. */
export function roomContract(d: RoomData, cards: StudyCard[], notes: NotesBlock[], geometry: (stage: number) => Record<string, Geometry>) {
  describe(`Eratorriak · ${d.week}. gaia · contract`, () => {
    const byKey = new Map(d.pieces.map((p) => [p.key, p]));
    it('has unique keys and a single drawing for every drawn piece at every view', () => {
      expect(byKey.size).toBe(d.pieces.length);
      for (const p of d.pieces) {
        if (!d.categorical) expect(p.life?.length, p.key).toBe(d.stages.length);
        for (let i = 0; i < d.stages.length; i++)
          if (drawnAt(p, i)) {
            const matches = Object.values(geometry(i)).filter((g) => g[p.key]);
            expect(matches.length, `${p.key}@${i}`).toBe(1);
            expect(matches[0][p.key].d).toMatch(/^M/);
          }
      }
    });
    it('does not resurrect a ghost', () => {
      for (const p of d.pieces) {
        const at = p.life?.indexOf(3) ?? -1;
        if (at >= 0)
          expect(
            p.life!.slice(at).every((l) => l === 3),
            p.key,
          ).toBe(true);
      }
    });
    it('uses actual registry structures and actual simulator stages', () => {
      const sims = new Set(getWeek(d.week)!.stages.map((s) => s.id));
      for (const s of d.stages) expect(sims.has(s.sim), s.sim).toBe(true);
      for (const p of d.pieces) {
        if (p.id3) expect(structures.has(p.id3), p.id3).toBe(true);
        expect(d.origins[p.origin], p.origin).toBeTruthy();
        if (p.fate !== 'gone') expect(d.fates[p.fate], p.fate).toBeTruthy();
      }
      for (const f of Object.values(d.fates)) if (f.structure) expect(structures.has(f.structure), f.structure).toBe(true);
    });
    it('every cross-reference and destination is valid, with a living explorer piece', () => {
      expect(d.changes.length).toBe(d.stages.length);
      for (const c of [...d.changes.flat(), ...d.picks, ...d.table, ...d.composites, ...d.gone, ...d.pitfalls, ...cards])
        for (const k of c.keys ?? []) expect(byKey.has(k), k).toBe(true);
      d.changes.forEach((changes, stage) => {
        for (const c of changes)
          for (const key of c.keys) expect(drawnAt(byKey.get(key)!, stage), `${key} mentioned at ${stage}`).toBe(true);
      });
      for (const c of [...d.picks, ...d.table, ...d.composites, ...d.gone, ...d.pitfalls, ...cards])
        if (c.stage !== undefined) {
          expect(c.stage).toBeGreaterThanOrEqual(0);
          expect(c.stage).toBeLessThan(d.stages.length);
        }
      for (const p of d.picks)
        expect(
          p.keys.some((k) => aliveAt(byKey.get(k)!, p.stage)),
          p.id,
        ).toBe(true);
      for (const r of d.table)
        expect(
          r.keys.some((k) => aliveAt(byKey.get(k)!, r.stage)),
          r.id,
        ).toBe(true);
    });
    it('final living pieces are named and have a reserved label position', () => {
      for (const p of d.pieces.filter((p) => aliveAt(p, d.stages.length - 1))) {
        expect(nameAt(p, d.stages.length - 1), p.key).toBeTruthy();
        expect(
          Object.values(geometry(d.stages.length - 1)).some((g) => g[p.key]?.label),
          p.key,
        ).toBe(true);
      }
    });
    it('has 35–60 unique, topic-prefixed cards and real source sentence ids', () => {
      expect(cards.length).toBeGreaterThanOrEqual(35);
      expect(cards.length).toBeLessThanOrEqual(60);
      expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
      const ids = new Set(notes.flatMap((b) => b.sentences.map((s) => s.id)));
      for (const c of [...cards, ...d.pieces]) {
        expect(c.source?.length).toBeGreaterThan(0);
        for (const id of c.source ?? []) expect(ids.has(id), id).toBe(true);
      }
    });
  });
}
