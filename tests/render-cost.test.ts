import { describe, expect, it } from 'vitest';
import { blob, tube } from '@/lib/three-d/mesh';
import { cachedBlob, cachedMerge, cachedMesh, cachedTube } from '@/lib/three-d/mesh-cache';
import { createWaker } from '@/lib/three-d/waker';
import { A0, atriumModel } from '@/components/scenes/week10/atrium3d';
import { POSE0, centreline, heartModel, routeOf, type HeartOpts, type HeartPose } from '@/components/scenes/week10/model3d';
import { STREAM_ROUTE_N } from '@/lib/three-d/scene';
import type { V3 } from '@/lib/three-d/math';

/** A fake frame clock: frames run only when the test steps them. */
function clock() {
  let t = 0;
  let next = 1;
  const queue = new Map<number, (now: number) => void>();
  return {
    now: () => t,
    raf: (cb: (now: number) => void) => {
      queue.set(next, cb);
      return next++;
    },
    caf: (id: number) => void queue.delete(id),
    /** One display frame, `ms` later. */
    frame(ms = 16) {
      t += ms;
      const due = [...queue.values()];
      queue.clear();
      due.forEach((cb) => cb(t));
    },
    get pending() {
      return queue.size;
    },
  };
}

describe('the 3D layer sleeps when nothing changes', () => {
  it('stops asking for frames once a still picture has been drawn, and wakes on a kick', () => {
    const c = clock();
    let changes = 3;
    let ticks = 0;
    const w = createWaker(() => (ticks++, changes-- > 0), { keepMs: 100, now: c.now, raf: c.raf, caf: c.caf });
    expect(w.awake).toBe(false);
    w.kick();
    for (let i = 0; i < 30; i++) c.frame();
    // Three changing frames, then about 100 ms of quiet frames, then nothing.
    expect(ticks).toBeGreaterThan(3);
    expect(ticks).toBeLessThan(3 + 100 / 16 + 2);
    expect(w.awake).toBe(false);
    expect(c.pending).toBe(0);
    const before = ticks;
    for (let i = 0; i < 30; i++) c.frame();
    expect(ticks).toBe(before);
    w.kick();
    c.frame();
    expect(ticks).toBe(before + 1);
  });

  it('keeps drawing for as long as something keeps changing', () => {
    const c = clock();
    let ticks = 0;
    const w = createWaker(() => (ticks++, true), { keepMs: 100, now: c.now, raf: c.raf, caf: c.caf });
    w.kick();
    for (let i = 0; i < 200; i++) c.frame();
    expect(ticks).toBe(200);
    expect(w.awake).toBe(true);
  });

  it('a kick while awake does not schedule a second loop, and stop ends it for good', () => {
    const c = clock();
    const w = createWaker(() => true, { keepMs: 100, now: c.now, raf: c.raf, caf: c.caf });
    w.kick();
    w.kick();
    w.kick();
    expect(c.pending).toBe(1);
    w.stop();
    expect(c.pending).toBe(0);
    w.kick();
    expect(c.pending).toBe(0);
  });
});

const sameArrays = (a: { pos: Float32Array; nrm: Float32Array; uv: Float32Array; idx: Uint32Array }, b: typeof a) =>
  a.pos.length === b.pos.length && a.pos.every((v, i) => v === b.pos[i]) && a.nrm.every((v, i) => v === b.nrm[i]) && a.uv.every((v, i) => v === b.uv[i]) && a.idx.every((v, i) => v === b.idx[i]);

describe('meshes are kept while their inputs are unchanged', () => {
  const path: V3[] = [[0, 0, 0], [0.2, 1, 0.1], [0.5, 2, 0.3], [0.4, 3, 0.2]];

  it('gives back the very mesh the builder would make, and the same object for the same inputs', () => {
    const o = { radius: (u: number) => 0.2 + 0.1 * u, ref: [0, 0, 1] as V3, sides: 12, capStart: true };
    const a = cachedTube(path, o);
    expect(cachedTube(path.map((p) => [...p] as V3), { ...o, radius: (u: number) => 0.2 + 0.1 * u })).toBe(a);
    expect(sameArrays(a, tube(path, o))).toBe(true);
    const b = cachedBlob({ center: [1, 2, 3], radii: [0.3, 0.2, 0.1], rings: 8, sides: 10 });
    expect(cachedBlob({ center: [1, 2, 3], radii: [0.3, 0.2, 0.1], rings: 8, sides: 10 })).toBe(b);
    expect(sameArrays(b, blob({ center: [1, 2, 3], radii: [0.3, 0.2, 0.1], rings: 8, sides: 10 }))).toBe(true);
    expect(cachedMerge([a, b])).toBe(cachedMerge([a, b]));
    expect(cachedMesh('t', [1, 2], () => a)).toBe(cachedMesh('t', [1, 2], () => b));
  });

  it('builds anew when any input changes, however little', () => {
    const o = { radius: () => 0.2, ref: [0, 0, 1] as V3, sides: 12 };
    const a = cachedTube(path, o);
    expect(cachedTube(path, { ...o, radius: () => 0.2 + 1e-12 })).not.toBe(a);
    expect(cachedTube(path, { ...o, sides: 13 })).not.toBe(a);
    expect(cachedTube(path, { ...o, capEnd: true })).not.toBe(a);
    expect(cachedTube([...path.slice(0, 3), [0.4, 3, 0.2 + 1e-12]], o)).not.toBe(a);
    // A shape function cannot be fingerprinted: without a name for it, never shared.
    const shaped = { center: [0, 0, 0] as V3, radii: [1, 1, 1] as V3, shape: () => 1 };
    expect(cachedBlob(shaped)).not.toBe(cachedBlob(shaped));
  });

  const ids = <I extends { key: string }>(m: { items: I[] }) => new Map(m.items.map((it) => [it.key, it]));

  it('a heart pose drawn again (a played frame where only the cells move) reuses every mesh, the cells too', () => {
    const pose: HeartPose = { ...POSE0, segs: 1, colour: 1, loop: 0.6, arches: 2, veins: 1 };
    const opts = (phase: number, show = 1): HeartOpts => ({ cavity: 1, septum: 1, gut: 0.5, aortas: 1, flow: { phase, show, mixed: true } });
    const a = ids(heartModel(pose, opts(0.1)));
    const b = ids(heartModel(pose, opts(0.3, 0.5)));
    expect(a.size).toBeGreaterThan(10);
    for (const [key, it] of a) {
      expect(b.get(key)?.mesh, key).toBe(it.mesh);
      expect(b.get(key)?.hit, key).toBe(it.hit);
    }
    // The cells move by their phase alone: same route and cells (sent to the GPU once), new phase and growth.
    for (const key of ['flow', 'flowO2']) {
      const [sa, sb] = [a.get(key)?.stream, b.get(key)?.stream];
      expect(sa, key).toBeDefined();
      expect(sb!.route, key).toBe(sa!.route);
      expect(sb!.cells, key).toBe(sa!.cells);
      expect([sa!.phase, sb!.phase, sa!.grow, sb!.grow]).toEqual([0.1, 0.3, 1, 0.5]);
    }
  });

  it('the blood cells: 26 in all, a third oxygenated, along the centreline from the atrial end to the sac', () => {
    const pose: HeartPose = { ...POSE0, segs: 1, loop: 0.6 };
    const m = ids(heartModel(pose, { flow: { phase: 0, show: 1, mixed: true } }));
    const [deo2, o2] = [m.get('flow')!.stream!, m.get('flowO2')!.stream!];
    expect([deo2.gates.length, o2.gates.length]).toEqual([17, 9]);
    expect(deo2.cells.length).toBe(17 * 4);
    for (const g of [...deo2.gates, ...o2.gates]) {
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(0.85);
    }
    const line = centreline(pose);
    const r = routeOf(line);
    expect(r.length).toBe(STREAM_ROUTE_N * 3);
    expect(routeOf(centreline(pose))).toBe(r);
    const end = (i: number) => [r[i * 3], r[i * 3 + 1], r[i * 3 + 2]];
    end(0).forEach((x, k) => expect(x).toBeCloseTo(line[line.length - 1][k], 5));
    end(STREAM_ROUTE_N - 1).forEach((x, k) => expect(x).toBeCloseTo(line[0][k], 5));
    // Without mixing, every cell is venous.
    const plain = ids(heartModel(pose, { flow: { phase: 0, show: 1 } }));
    expect(plain.get('flow')!.stream!.gates.length).toBe(26);
    expect(plain.has('flowO2')).toBe(false);
  });

  it('colours, highlights and see-through walls change no mesh; the shape changing does', () => {
    const base: HeartPose = { ...POSE0, segs: 1, colour: 0, loop: 0.3 };
    const a = ids(heartModel(base, { aortas: 1 }));
    const recoloured = ids(heartModel({ ...base, colour: 1, colourBy: { bulbus: 0.5 }, glass: 0.8 }, { aortas: 1 }));
    for (const [key, it] of a) expect(recoloured.get(key)?.mesh, key).toBe(it.mesh);
    const looped = ids(heartModel({ ...base, loop: 0.31 }, { aortas: 1 }));
    expect(looped.get('myo-ventricle')?.mesh).not.toBe(a.get('myo-ventricle')?.mesh);
  });

  it('every heart and atrium item has a coarse copy for pointing, smaller than the mesh drawn', () => {
    const heart = heartModel({ ...POSE0, segs: 1, colour: 1, loop: 1, atriaFuse: 1, expand: 1, veins: 1, anast: 1, derive: { trab: 1, conus: 1, truncus: 1 } }, { cavity: 1, septum: 1, gut: 1, aortas: 1, noto: 1 });
    const atrium = atriumModel({ ...A0, valves: 1, spur: 1, secundum: 1, primum: 1, lowSplit: 1, holes: 1, svc: 1, crista: 1, node: 1, pect: 1 });
    for (const it of [...heart.items, ...atrium.items]) {
      if (it.key === 'primum' || it.key === 'secundum' || it.key.endsWith('-hole') || it.key === 'smooth') continue;
      expect(it.hit, it.key).toBeDefined();
      expect(it.hit!.idx.length, it.key).toBeLessThan(it.mesh.idx.length);
    }
  });

  it('in the atrium room, the thin parts let light through (membrane, valves) and the muscular walls do not', () => {
    const room = atriumModel({ ...A0, valves: 1, spur: 1, secundum: 1, primum: 1, lowSplit: 0.5, holes: 1, crista: 1, pect: 1 });
    const thin = room.items.filter((it) => it.thin).map((it) => it.key);
    expect(thin).toEqual(expect.arrayContaining(['primum', 'rv-top', 'rv-low', 'lv', 'ivc-valve', 'cs-valve']));
    for (const it of room.items) if (it.thin) expect(['membrane', 'epithelium'], it.key).toContain(it.tissue);
    for (const key of ['secundum', 'crista', 'pect']) expect(room.items.find((it) => it.key === key)?.thin, key).toBeFalsy();
  });

  it('the atrium room drawn again with the same state reuses every mesh', () => {
    const s = { ...A0, valves: 0.7, secundum: 0.5, primum: 0.4, holes: 1, crista: 0.6, pect: 0.8 };
    const a = ids(atriumModel(s));
    const b = ids(atriumModel({ ...s }));
    for (const [key, it] of a) expect(b.get(key)?.mesh, key).toBe(it.mesh);
  });
});
