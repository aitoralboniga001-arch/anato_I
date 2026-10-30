import { describe, expect, it } from 'vitest';
import { CHANGES, FATES, GONE, PICKS, PITFALLS, SEG, SEGS, STAGE_COUNT, TABLE, aliveAt, items3Of, lifeAt, nameAt } from '@/content/eratorriak/arteries';
import { CARDS12 } from '@/content/eratorriak/cards12';
import { getWeek, structures } from '@/content/registry';
import { pathOf, labelOf } from '@/components/shell/eratorriak/ArchLadder';
import { ADULT, AP0, arteryModel } from '@/components/scenes/week12/arteries3d';

describe('Eratorriak · topic 12 study room', () => {
  it('has unique piece keys, six-moment lives and a drawing for every piece at every moment it is drawn', () => {
    expect(new Set(SEGS.map((s) => s.key)).size).toBe(SEGS.length);
    for (const s of SEGS) {
      expect(s.life.length, s.key).toBe(STAGE_COUNT);
      for (let i = 0; i < STAGE_COUNT; i++) if (lifeAt(s, i) > 0) expect(pathOf(s, i), `${s.key}@${i}`).toMatch(/^M/);
    }
  });

  it('never brings a piece back once it is gone', () => {
    for (const s of SEGS) {
      const goneAt = s.life.indexOf(3);
      if (goneAt >= 0) for (let i = goneAt; i < STAGE_COUNT; i++) expect(lifeAt(s, i), `${s.key}@${i}`).toBe(3);
    }
  });

  it('names real structures and fates', () => {
    for (const s of SEGS) {
      if (s.id3) expect(structures.has(s.id3), `${s.key} id3 ${s.id3}`).toBe(true);
      if (s.fate !== 'gone') expect(FATES[s.fate], s.key).toBeTruthy();
    }
    for (const f of Object.values(FATES)) if (f.structure) expect(structures.has(f.structure), f.id).toBe(true);
  });

  it('lights only pieces that exist (changes, picks, table, gone list, pitfalls, cards)', () => {
    const all = [...CHANGES.flat().flatMap((c) => c.keys), ...PICKS.flatMap((p) => p.keys), ...TABLE.flatMap((r) => r.keys), ...GONE.flatMap((g) => g.keys), ...PITFALLS.flatMap((p) => p.keys ?? []), ...CARDS12.flatMap((c) => c.keys ?? [])];
    expect(all.filter((k) => !SEG.has(k))).toEqual([]);
    expect(CHANGES.length).toBe(STAGE_COUNT);
  });

  it('every pick is there (alive) at the moment it jumps to', () => {
    for (const p of PICKS) expect(p.keys.some((k) => aliveAt(SEG.get(k)!, p.stage)), p.id).toBe(true);
  });

  it('every piece is a real item of the 3D model at the moment it is alive', () => {
    const keysAt = (pose: typeof AP0) => new Set(arteryModel(pose, { ghosts: 1 }).items.map((i) => i.key));
    const early = keysAt({ ...AP0 });
    const late = keysAt({ ...AP0, split: 1, eca: 1, is7: 1 });
    const adult = keysAt({ ...ADULT });
    for (const s of SEGS) {
      if (![0, 1, 2, 3, 4, 5].some((i) => aliveAt(s, i))) continue;
      const found = items3Of(s).filter((k) => early.has(k) || late.has(k) || adult.has(k));
      expect(found.length, `${s.key} → ${items3Of(s)}`).toBeGreaterThan(0);
    }
  });

  it('keeps the composite arteries the notes describe', () => {
    const parts = (fate: string, side?: string) => SEGS.filter((s) => s.fate === fate && (!side || s.side === side)).map((s) => s.key).sort();
    expect(parts('eskuineko-subklabioa')).toEqual(['a4R', 'daMidR', 'is7R']);
    expect(parts('ezkerreko-subklabioa')).toEqual(['is7L']);
    expect(parts('aortaren-makoa')).toEqual(['a4L', 'hornL']);
    expect(parts('barneko-karotida', 'R')).toEqual(['a3icaR', 'daCranR']);
    expect(parts('enbor-brakiozefalikoa')).toEqual(['hornR']);
    expect(SEGS.filter((s) => s.origin === 'a5').every((s) => s.fate === 'gone')).toBe(true);
    expect(nameAt(SEG.get('a6dL')!, 5)).toMatch(/Lotailu arteriosoa/);
  });

  it('labels every piece alive at the adult moment that is not an arch rung or a left part of a named whole', () => {
    const unnamed = SEGS.filter((s) => aliveAt(s, 5) && !labelOf(s, 5)).map((s) => s.key);
    expect(unnamed.sort()).toEqual(['daLowL', 'pulmL', 'pulmR', 'sac'].sort());
  });

  it('links each moment to a real stage of topic 12 in the simulator', async () => {
    const { STAGES } = await import('@/content/eratorriak/arteries');
    const ids = new Set(getWeek(12)!.stages.map((s) => s.id));
    for (const s of STAGES) expect(ids.has(s.sim), s.sim).toBe(true);
  });

  it('has unique flashcard ids', () => {
    expect(new Set(CARDS12.map((c) => c.id)).size).toBe(CARDS12.length);
  });
});
