import { describe, expect, it } from 'vitest';
import { VEINS, PIECES } from '@/content/eratorriak/veins';
import { CARDS13 } from '@/content/eratorriak/cards13';
import { VEIN_GEOMETRY } from '@/components/shell/eratorriak/VeinDiagram';
import { BIRTH13 } from '@/components/shell/eratorriak/figures13';
import { aliveAt, lifeAt, nameAt } from '@/content/eratorriak/model';
import { structures, getWeek } from '@/content/registry';
import { w13 } from '@/content/notes-text/w13';

describe('Eratorriak · 13. gaia', () => {
  const d = VEINS,
    keys = new Set(PIECES.map((p) => p.key));
  it('has unique keys, six states and one drawable path per piece', () => {
    expect(keys.size).toBe(PIECES.length);
    for (const p of PIECES) {
      expect(p.life?.length, p.key).toBe(d.stages.length);
      for (let i = 0; i < d.stages.length; i++)
        if (lifeAt(p, i) > 0) {
          const found = Object.values(VEIN_GEOMETRY).filter((g) => g[p.key]);
          expect(found.length, p.key).toBe(1);
          expect(found[0][p.key].d).toMatch(/^M/);
        }
    }
  });
  it('does not resurrect a regressed piece', () => {
    for (const p of PIECES) {
      const at = p.life!.indexOf(3);
      if (at >= 0)
        expect(
          p.life!.slice(at).every((l) => l === 3),
          p.key,
        ).toBe(true);
    }
  });
  it('uses real simulator ids and registry fates', () => {
    const ids = new Set(getWeek(13)!.stages.map((s) => s.id));
    for (const s of d.stages) expect(ids.has(s.sim), s.sim).toBe(true);
    for (const p of PIECES) {
      expect(d.origins[p.origin], p.key).toBeTruthy();
      if (p.id3) expect(structures.has(p.id3), p.id3).toBe(true);
      if (p.fate !== 'gone') expect(d.fates[p.fate], p.key).toBeTruthy();
    }
    for (const f of Object.values(d.fates)) if (f.structure) expect(structures.has(f.structure), f.structure).toBe(true);
  });
  it('all content links and card backs use valid keys and stages', () => {
    expect(d.changes.length).toBe(d.stages.length);
    for (const r of [...d.picks, ...d.table, ...d.gone, ...d.pitfalls, ...d.composites, ...CARDS13, ...BIRTH13]) {
      for (const k of r.keys ?? []) expect(keys.has(k), k).toBe(true);
      if (r.stage !== undefined) {
        expect(r.stage).toBeGreaterThanOrEqual(0);
        expect(r.stage).toBeLessThan(d.stages.length);
      }
    }
    for (const c of d.changes.flat()) for (const k of c.keys) expect(keys.has(k), k).toBe(true);
  });
  it('every explorer destination has alive pieces at its jump moment', () => {
    for (const p of d.picks)
      expect(
        p.keys.some((k) => aliveAt(PIECES.find((s) => s.key === k)!, p.stage)),
        p.id,
      ).toBe(true);
  });
  it('pins the prose: three IVC segments, two SVC pieces, two azygos sources', () => {
    const of = (f: string) =>
      PIECES.filter((p) => p.fate === f)
        .map((p) => p.key)
        .sort();
    expect(of('ivc')).toEqual(['hcR', 'sacroR', 'subR']);
    expect(of('svc')).toEqual(['acR', 'ccR']);
    expect(of('azygos')).toEqual(['pcR', 'supR']);
    expect(nameAt(PIECES.find((p) => p.key === 'umbL')!, 5)).toBe('Gibelaren lotailu borobila');
    expect(nameAt(PIECES.find((p) => p.key === 'dv')!, 5)).toBe('Gibelaren lotailu benosoa');
  });
  it('labels every final living piece', () => {
    for (const p of PIECES.filter((p) => aliveAt(p, 5))) {
      expect(nameAt(p, 5).length, p.key).toBeGreaterThan(3);
      expect(
        Object.values(VEIN_GEOMETRY).some((g) => g[p.key]?.label),
        p.key,
      ).toBe(true);
    }
  });
  it('has 35–60 unique cards grounded in actual notes sentences', () => {
    expect(CARDS13.length).toBeGreaterThanOrEqual(35);
    expect(CARDS13.length).toBeLessThanOrEqual(60);
    expect(new Set(CARDS13.map((c) => c.id)).size).toBe(CARDS13.length);
    const ids = new Set(w13.flatMap((b) => b.sentences.map((s) => s.id)));
    for (const c of [...CARDS13, ...PIECES]) {
      expect(c.source?.length).toBeGreaterThan(0);
      for (const id of c.source ?? []) expect(ids.has(id), id).toBe(true);
    }
  });
});
