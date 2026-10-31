import { describe, expect, it } from 'vitest';
import { MIGRATIONS, type MNode } from '@/content/migrations';
import { LEARNING_MAPS, mergeBranches, overviewRoots } from '@/content/eratorriak/learning-maps';

const paths = (nodes: MNode[], prefix: string[] = []): string[] => nodes.flatMap((node) => {
  const { kids, ...metadata } = node;
  const path = [...prefix, JSON.stringify(metadata)];
  return [JSON.stringify(path), ...paths(kids ?? [], path)];
});

describe('fused learning maps', () => {
  it('assigns every existing scheme once, in its owning topic, keeping all original details', () => {
    const original = MIGRATIONS.flatMap((topic) => topic.flows.map((flow) => `${topic.week}/${flow.id}`));
    const assigned = LEARNING_MAPS.flatMap((map) => map.flowIds.map((id) => `${map.week}/${id}`));
    expect([...assigned].sort()).toEqual([...original].sort());
    expect(new Set(assigned).size).toBe(assigned.length);
    for (const map of LEARNING_MAPS) {
      expect(map.details.map((flow) => flow.id)).toEqual(map.flowIds);
      for (const flow of map.details) expect(flow).toBe(MIGRATIONS.find((t) => t.week === map.week)!.flows.find((f) => f.id === flow.id));
    }
    expect(LEARNING_MAPS.length).toBeLessThan(original.length / 2);
    expect(new Set(LEARNING_MAPS.map((map) => map.id)).size).toBe(LEARNING_MAPS.length);
  });

  it('retains every qualified branch path from every overview in the fused tree', () => {
    for (const map of LEARNING_MAPS) {
      const fusedPaths = new Set(paths(map.roots));
      for (const flow of map.details) for (const path of paths(overviewRoots(flow))) expect(fusedPaths.has(path), `${map.id}/${flow.id}: ${path}`).toBe(true);
    }
  });

  it('merges shared prefixes while keeping distinct notes and incoming relationships separate', () => {
    const source: MNode[] = [
      { id: 'origin', kids: [{ label: 'a', note: 'left', via: 'move', move: true }] },
      { id: 'origin', kids: [{ label: 'b', gone: true }, { label: 'a', note: 'right', via: 'move', move: true }] },
      { id: 'origin', note: 'other', kids: [{ label: 'c' }] },
    ];
    const copy = structuredClone(source);
    const merged = mergeBranches(source);
    expect(merged).toHaveLength(2);
    expect(merged[0].kids).toHaveLength(3);
    expect(source).toEqual(copy);
    expect(new Set(paths(merged))).toEqual(new Set(paths(source)));
  });

  it('preserves convergence origins and downstream derivatives without pretending they are a forward chain', () => {
    const flow = { id: 'convergence', title: '', stage: '', roots: [{ id: 'a', note: 'left' }, { id: 'b', kids: [{ id: 'c', move: true }] }], join: { id: 'whole', kids: [{ id: 'later' }] }, joinVia: 'fusionatu' };
    const before = structuredClone(flow);
    const roots = overviewRoots(flow);
    expect(roots[0].id).toBe('whole');
    expect(roots[0].kids?.[0]).toEqual({ id: 'later' });
    const origins = roots[0].kids!.filter((node) => node.via === 'osagaia');
    expect(origins.map((node) => node.kids![0])).toEqual(flow.roots);
    expect(flow).toEqual(before);
  });
});
