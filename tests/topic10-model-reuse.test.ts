import { afterEach, describe, expect, it, vi } from 'vitest';
import { centreline, heartModel, POSE0, type HeartPose } from '@/components/scenes/week10/model3d';
import { A0, atriumModel } from '@/components/scenes/week10/atrium3d';

afterEach(() => vi.unstubAllGlobals());
describe('Topic 10 model snapshots preserve blood routes and seek history', () => {
  it('reuses an unchanged atrium, invalidates for valves/visibility, and survives seeking through evictions', () => {
    const s = { ...A0, valves: 0.7, secundum: 0.4, pect: 0.8 };
    const a = atriumModel(s), snapshot = structuredClone(a);
    expect(atriumModel({ ...s })).toBe(a);
    expect(atriumModel({ ...s, lateralGlass: 0.5 })).not.toEqual(a);
    expect(atriumModel({ ...s, valves: 0.8 })).not.toEqual(a);
    atriumModel({ ...s, pect: 0.9 });
    expect(atriumModel(s)).toEqual(snapshot);
    expect(a).toEqual(snapshot);
  });

  it.each([0, 0.42, 1])('reuses static anatomy at obliteration %s while applying the exact per-route phase', (closed) => {
    const pose: HeartPose = { ...POSE0, loop: 1, atriaFuse: 1, shift: 0.4, arches: 3, obliterate: [closed, closed], anast: 1 };
    const opts = { aortas: 1, flow: { phase: 0.13, show: 1, vessels: 1, mixed: true, arteries: true } };
    const first = heartModel(pose, opts), oldPhases = first.items.map(it => it.stream?.phase);
    const next = heartModel({ ...pose }, { ...opts, flow: { ...opts.flow, phase: 1.37 } });
    // An explicitly absent context gives a different snapshot key with identical output. It forces
    // a fresh full build so this compares cached-phase handling with the builder's own calculation.
    const direct = heartModel(pose, { ...opts, gut: 0, flow: { ...opts.flow, phase: 1.37 } });
    expect(next).toEqual(direct);
    expect(first.items.map(it => it.stream?.phase)).toEqual(oldPhases);
    expect(next.pts).toBe(first.pts);
    for (const [i, item] of next.items.entries()) {
      expect(item.mesh).toBe(first.items[i].mesh);
      if (item.stream) {
        expect(item.stream.route).toBe(first.items[i].stream!.route);
        expect(item.stream.phase).toBe(direct.items[i].stream!.phase);
      }
    }
    const backward = heartModel(pose, opts);
    expect(backward).toEqual(first);
  });

  it('reuses unchanged complete inputs but rebuilds for appearance, geometry and stream-visibility changes', () => {
    const counters: Record<string, number> = {}; vi.stubGlobal('__perf', counters);
    const pose = { ...POSE0, loop: 0.731, colour: 0.4 };
    const a = heartModel(pose, { gut: 0.231 });
    expect(heartModel({ ...pose }, { gut: 0.231 })).toBe(a);
    const count = counters.heartModelBuild;
    const changed = heartModel({ ...pose, glass: 0.7 }, { gut: 0.231 });
    expect(changed).not.toBe(a);
    expect(counters.heartModelBuild).toBe(count + 1);
    const flow = { phase: 0.1, show: 0.3, vessels: 0.2 };
    const b = heartModel(pose, { flow });
    expect(heartModel(pose, { flow: { ...flow, show: 0.4 } })).not.toEqual(b);
    expect(heartModel({ ...pose, loop: 0.732 }, { flow })).not.toEqual(b);
  });

  it('keeps a centreline through colour/venous changes, but honours both loop ends, truncus and sample count', () => {
    const p = { ...POSE0, loop: 0.6 };
    const a = centreline(p);
    expect(centreline({ ...p, shift: 0.8, colour: 1, obliterate: [1, 1] })).toBe(a);
    for (const q of [{ ...p, loop: 0.61 }, { ...p, loopTail: 0.9 }, { ...p, truncusMid: 1 }]) expect(centreline(q)).not.toEqual(a);
    expect(centreline(p, 60)).toHaveLength(61);
    expect(centreline(p)).toBe(a);
  });
});
