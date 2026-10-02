import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { atlasDerivatives, atlasHref, atlasOrigins, atlasPath, atlasRelations, atlasTopics } from '@/content/structure-atlas';
import { appearances, structures, weeks } from '@/content/registry';
import { formationOf } from '@/content/formation';

describe('global structure atlas', () => {
  it('has valid endpoints, unique directed pairs, and course evidence for every relation', () => {
    const pairs = new Set<string>();
    for (const r of atlasRelations) {
      expect(structures.has(r.from), r.from).toBe(true);
      expect(structures.has(r.to), r.to).toBe(true);
      expect(r.from).not.toBe(r.to);
      const key = `${r.from}>${r.to}`;
      expect(pairs.has(key), key).toBe(false);
      pairs.add(key);
      const [file, record] = r.source.split('#');
      expect(existsSync(file), r.source).toBe(true);
      if (record) expect(readFileSync(file, 'utf8'), r.source).toContain(`id: '${record.split('.')[0]}'`);
    }
  });

  it('contains no origin/transformation cycles', () => {
    const visit = (id: string, path: Set<string>) => {
      expect(path.has(id), [...path, id].join(' > ')).toBe(false);
      const next = new Set([...path, id]);
      for (const r of atlasDerivatives(id).filter(r => r.kind === 'origin' || r.kind === 'transformation')) visit(r.to, next);
    };
    for (const id of structures.keys()) visit(id, new Set());
  });

  it('records placenta fetal/maternal parts as composition, with multiple tissue origins', () => {
    const parts = atlasOrigins('karena');
    expect(parts).toHaveLength(2);
    expect(parts.map(r => [r.from, r.kind])).toEqual([['korion-hostotsua', 'composition'], ['dezidua-basala', 'composition']]);
    expect(atlasOrigins('karenaren-fetu-atala').filter(r => r.kind === 'origin').map(r => r.from)).toEqual(['trofoblastoa', 'enbrioi-kanpoko-mesodermoa']);
    for (const [from, to] of [['korion-hostotsua', 'karenaren-fetu-atala'], ['dezidua-basala', 'karenaren-ama-atala']]) {
      expect(atlasOrigins(to)).toContainEqual(expect.objectContaining({ from, kind: 'development', note: expect.stringContaining('Egitura bera:') }));
    }
    expect(atlasOrigins('karena-muga').every(r => r.kind === 'composition')).toBe(true);
    expect(atlasDerivatives('deziduaren-orria')).toContainEqual(expect.objectContaining({ to: 'dezidua-basala', kind: 'composition' }));
  });

  it('preserves the distinction between a lens placode, the entire eye and hypoblast replacement', () => {
    expect(atlasDerivatives('kristalinoaren-plaka')).toContainEqual(expect.objectContaining({ to: 'kristalinoaren-hobitxoa', kind: 'transformation' }));
    expect(atlasDerivatives('kristalinoaren-plaka').some(r => r.to === 'begia')).toBe(false);
    expect(atlasRelations.some(r => r.from === 'hipoblastoa' && r.to === 'endodermoa')).toBe(false);
    expect(atlasOrigins('endodermoa')).toContainEqual(expect.objectContaining({ from: 'epiblastoa', kind: 'origin' }));
    expect(structures.get('endodermoa')?.origin).toContain('ez hipoblastotik');
  });

  it('keeps the explicitly different peripheral/central glia sources and omitted neural development', () => {
    const glia = atlasOrigins('glia-zelulak');
    expect(glia.map(r => r.from)).toEqual(['gandor-neurala', 'hodi-neurala']);
    expect(glia.every(r => r.kind === 'origin' && r.note)).toBe(true);
    expect(atlasOrigins('ildo-neurala')).toContainEqual(expect.objectContaining({ from: 'plaka-neurala', kind: 'development' }));
    expect(atlasOrigins('mesenterio-dortsala')).toContainEqual(expect.objectContaining({ from: 'errai-orria', kind: 'origin' }));
  });

  it('includes every declared topic and appearance for every catalog structure, including unillustrated records', () => {
    for (const id of structures.keys()) {
      const expected = new Set([
        ...weeks.filter(w => w.structures.some(s => s.id === id)).map(w => w.week),
        ...(appearances.get(id) ?? []).map(a => a.week.week),
      ]);
      expect(atlasTopics(id), id).toEqual([...expected].sort((a, b) => a - b));
    }
    for (const topic of weeks) expect(topic.structures.some(s => atlasTopics(s.id).includes(topic.week))).toBe(true);
    // A future catalog record may have no scene; ownership must still retain it.
    const record = weeks[5].structures[0];
    const saved = appearances.get(record.id);
    appearances.delete(record.id);
    try {
      expect(atlasTopics(record.id)).toContain(weeks[5].week);
    } finally {
      if (saved) appearances.set(record.id, saved);
    }
  });

  it('links to a reviewed formation or an actual appearance with a valid stage/view', () => {
    for (const id of structures.keys()) {
      const href = atlasHref(id);
      const f = formationOf(id);
      if (!href) {
        expect(f, id).toBeUndefined();
        expect(appearances.get(id) ?? [], id).toHaveLength(0);
        continue;
      }
      const url = new URL(href, 'http://atlas.test');
      const week = weeks.find(w => url.pathname === `/astea/${w.week}`);
      const stage = week?.stages.find(s => s.id === url.searchParams.get('etapa'));
      expect(stage?.structures.includes(id), href).toBe(true);
      expect(stage?.views.some(v => v.id === url.searchParams.get('ikuspegia')), href).toBe(true);
      if (f) {
        expect(url.searchParams.get('eraketa')).toBe(id);
        expect(url.pathname).toBe(`/astea/${f.week}`);
        expect(url.searchParams.get('etapa')).toBe(f.stage);
        expect(url.searchParams.get('ikuspegia')).toBe(f.view);
      } else expect(url.searchParams.get('egitura')).toBe(id);
    }
  });

  it('traces each structure back to a root through recorded relations only', () => {
    for (const id of structures.keys()) {
      const path = atlasPath(id);
      expect(path[path.length - 1], id).toBe(id);
      expect(atlasOrigins(path[0]).filter(r => !path.includes(r.from)), id).toEqual([]);
      for (let i = 1; i < path.length; i++) expect(atlasRelations.some(r => r.from === path[i - 1] && r.to === path[i]), path.join(' > ')).toBe(true);
      expect(new Set(path).size, id).toBe(path.length);
    }
    expect(atlasPath('notokorda')[0]).toBe('zigotoa');
    expect(atlasPath('missing')).toEqual([]);
  });

  it('handles unknown ids without inventing topics, links or relationships', () => {
    expect(atlasOrigins('missing')).toEqual([]);
    expect(atlasDerivatives('missing')).toEqual([]);
    expect(atlasTopics('missing')).toEqual([]);
    expect(atlasHref('missing')).toBeNull();
  });
});
