import { describe, expect, it } from 'vitest';
import { blob, tube } from '@/lib/three-d/mesh';
import { cachedBlob, cachedMerge, cachedMesh, cachedTube } from '@/lib/three-d/mesh-cache';
import { createWaker } from '@/lib/three-d/waker';
import { A0, atriumModel } from '@/components/scenes/week10/atrium3d';
import { POSE0, centreline, heartModel, routeLength, routeOf, vesselRouteOf, type HeartOpts, type HeartPose } from '@/components/scenes/week10/model3d';
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
  it('caps moving pictures at 30 draws per second even on a 120 Hz display', () => {
    const c = clock();
    let ticks = 0;
    const w = createWaker(() => (ticks++, true), { minFrameMs: 1000 / 30, now: c.now, raf: c.raf, caf: c.caf });
    w.kick();
    for (let i = 0; i < 240; i++) c.frame(1000 / 120);
    expect(ticks).toBe(60);
    w.stop();
  });

  it('suspends all ticks when disabled and draws the latest picture on resume', () => {
    const c = clock();
    let ticks = 0;
    const w = createWaker(() => (ticks++, true), { minFrameMs: 1000 / 30, now: c.now, raf: c.raf, caf: c.caf });
    w.kick(); c.frame();
    w.setEnabled(false);
    w.kick();
    for (let i = 0; i < 120; i++) c.frame();
    expect(ticks).toBe(1);
    expect(c.pending).toBe(0);
    w.setEnabled(true);
    expect(c.pending).toBe(1);
    c.frame();
    expect(ticks).toBe(2);
    w.stop();
    w.setEnabled(false); w.setEnabled(true); w.kick();
    expect(c.pending).toBe(0);
  });

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

  it('blood in the vessels: veins into their horn, arteries out, the left blood rerouted right once its veins close', () => {
    const pose: HeartPose = { ...POSE0, segs: 1, arches: 2, veins: 1 };
    const keysOf = (p: HeartPose, f: HeartOpts['flow']) => heartModel(p, { aortas: 1, flow: f }).items.filter((it) => it.stream).map((it) => it.key);
    const open = keysOf(pose, { phase: 0.2, show: 1, mixed: true, vessels: 1, arteries: true });
    expect(open).toEqual(expect.arrayContaining(['flow-umb0O2', 'flow-umb1O2', 'flow-vit0', 'flow-vit1', 'flow-ant0', 'flow-post1', 'flow-art-1O2', 'flow-art1']));
    expect(open.some((k) => k.endsWith('x') || k.endsWith('xO2'))).toBe(false);
    // Without `arteries`, no arterial cells; without `vessels`, only the tube's.
    expect(keysOf(pose, { phase: 0.2, show: 1, vessels: 1 }).some((k) => k.startsWith('flow-art'))).toBe(false);
    expect(keysOf(pose, { phase: 0.2, show: 1 })).toEqual(['flow']);
    // Both closings done and the anastomoses there: the right umbilical and the left veins' old ways carry
    // nothing; the left blood crosses to the right horn.
    const closed: HeartPose = { ...pose, obliterate: [1, 1], anast: 1 };
    const m = heartModel(closed, { aortas: 1, flow: { phase: 0.2, show: 0, vessels: 1 } });
    const ks = m.items.filter((it) => it.stream).map((it) => it.key);
    expect(ks).toEqual(expect.arrayContaining(['flow-umb1xO2', 'flow-vit1x', 'flow-ant1x', 'flow-vit0']));
    for (const gone of ['flow-umb0O2', 'flow-umb1O2', 'flow-vit1', 'flow-ant1', 'flow-post1', 'flow']) expect(ks, gone).not.toContain(gone);
    // A rerouted way ends in the right atrium, like the right veins' own.
    const r = m.items.find((it) => it.key === 'flow-vit1x')!.stream!.route;
    const r0 = m.items.find((it) => it.key === 'flow-vit0')!.stream!.route;
    const last = (x: Float32Array) => Array.from(x.slice(-3));
    last(r).forEach((v, k) => expect(v).toBeCloseTo(last(r0)[k], 5));
  });

  it('smooth normals: coincident vertices welded through the integer grid give the string-keyed result', () => {
    // The previous welding, keyed on each coordinate's toFixed(4); except that "-0.0000" now counts as
    // "0.0000": the old key split a point lying on a plane of symmetry in two, giving it two normals (a crease).
    const reference = (m: { pos: Float32Array; idx: Uint32Array }) => {
      const p = m.pos;
      const n = new Float64Array(p.length);
      for (let i = 0; i < m.idx.length; i += 3) {
        const [a, b, c] = [m.idx[i] * 3, m.idx[i + 1] * 3, m.idx[i + 2] * 3];
        const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
        const e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        const f = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        for (const v of [a, b, c]) for (let k = 0; k < 3; k++) n[v + k] += f[k];
      }
      const fx = (x: number) => x.toFixed(4).replace(/^-(0\.0000)$/, '$1');
      const key = (i: number) => `${fx(p[i])},${fx(p[i + 1])},${fx(p[i + 2])}`;
      const acc = new Map<string, number[]>();
      for (let i = 0; i < p.length; i += 3) {
        const s0 = acc.get(key(i)) ?? [0, 0, 0];
        for (let k = 0; k < 3; k++) s0[k] += n[i + k];
        acc.set(key(i), s0);
      }
      return Array.from({ length: p.length }, (_, i) => {
        const s0 = acc.get(key(i - (i % 3)))!;
        return s0[i % 3] / (Math.hypot(s0[0], s0[1], s0[2]) || 1);
      });
    };
    const heart = heartModel({ ...POSE0, segs: 1, colour: 1, loop: 0.6, arches: 2, veins: 1 }, { cavity: 1, septum: 1, gut: 1, aortas: 1 });
    const meshes = [tube([[0, 0, 0], [0.5, 1, 0.2], [1, 2.5, -0.3]], { radius: () => 0.3, ref: [0, 0, 1], capStart: true, capEnd: true }), blob({ center: [0.2, -0.1, 0.3], radii: [1, 0.6, 0.8] }), ...heart.items.map((it) => it.mesh)];
    for (const m of meshes) {
      const want = reference(m);
      for (let i = 0; i < want.length; i++) expect(Math.abs(m.nrm[i] - want[i])).toBeLessThan(1e-6);
    }
  });

  it('a vessel route is resampled evenly by length, so the cells keep one speed', () => {
    const pts: V3[] = [[0, 0, 0], [0.1, 0, 0], [3, 0, 0]];
    const r = vesselRouteOf(pts);
    const step = (j: number) => r[(j + 1) * 3] - r[j * 3];
    for (let j = 0; j < STREAM_ROUTE_N - 1; j++) expect(step(j)).toBeCloseTo(3 / (STREAM_ROUTE_N - 1), 5);
    expect(routeLength(r)).toBeCloseTo(3, 5);
    expect(vesselRouteOf(pts.map((p) => [...p] as V3))).toBe(r);
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
