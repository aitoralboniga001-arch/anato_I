import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrationIds, sourceIds, flowIds } from '@/content/migrations';
import { getWeek, structures, weeks } from '@/content/registry';

describe('migration maps (Leinuak, topics 7+)', () => {
  it('uses only structures that exist', () => {
    const missing = migrationIds().filter((id) => !structures.has(id));
    expect(missing).toEqual([]);
  });

  it('covers every built topic from 7 on (a new topic needs its schemes), each flow on a real stage of its topic', () => {
    const built = weeks.map((w) => w.week).filter((w) => w >= 7);
    expect(MIGRATIONS.map((t) => t.week)).toEqual(built);
    for (const t of MIGRATIONS) {
      const stages = new Set(getWeek(t.week)!.stages.map((s) => s.id));
      expect(t.flows.length, `topic ${t.week}`).toBeGreaterThan(3);
      for (const f of t.flows) expect(stages.has(f.stage), `${t.week}/${f.id} → ${f.stage}`).toBe(true);
    }
  });

  it('has unique flow ids and a converging scheme only with two or more origins', () => {
    const ids = MIGRATIONS.flatMap((t) => t.flows.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of MIGRATIONS.flatMap((t) => t.flows)) if (f.join) expect(f.roots.length, f.id).toBeGreaterThan(1);
  });

  it('keeps converging origins as single chains so their arrows can meet', () => {
    const chain = (m: { kids?: unknown[] }): boolean => !m.kids || (m.kids.length === 1 && chain(m.kids[0] as { kids?: unknown[] }));
    for (const f of MIGRATIONS.flatMap((t) => t.flows)) if (f.join) for (const r of f.roots) expect(chain(r), `${f.id}`).toBe(true);
  });

  it('follows the neural crest into the skull and the head connective tissue', () => {
    const lit = sourceIds('gandor-neurala');
    const hits = MIGRATIONS.flatMap((t) => t.flows.filter((f) => flowIds(f).some((id) => lit.has(id))).map((f) => `${t.week}/${f.id}`));
    expect(hits).toEqual(expect.arrayContaining(['8/gandor-neurokraneoa', '8/gandor-errai-kraneoa', '9/ehun-konektiboa']));
  });
});
