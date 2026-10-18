import { describe, expect, it } from 'vitest';
import { createRenderCircuit, GPU_FAILURE_KEY, renderRatio, RENDER_FRAME_MS, RENDER_PIXEL_BUDGET } from '@/lib/three-d/render-policy';
import { sameGLFrame } from '@/components/kit/three/frame-state';
import { geometryOf, updateGeometry } from '@/components/kit/three/geometry';
import type { GLFrame } from '@/components/kit/three/gl';
import { blob } from '@/lib/three-d/mesh';
import { identity } from '@/lib/three-d/math';

describe('shared rendering limits and failure circuit', () => {
  it('bounds retina, fullscreen, portrait, extreme-aspect and device-limited buffers', () => {
    for (const [w, h, dpr, limit] of [[1536, 960, 2, 16384], [7680, 4320, 4, 16384], [390, 844, 3, 8192], [60000, 100, 2, 4096], [100, 60000, 2, 4096], [0, 0, 1, 8192]]) {
      const ratio = renderRatio(w, h, dpr, limit);
      const width = Math.floor(Math.max(1, w) * ratio), height = Math.floor(Math.max(1, h) * ratio);
      expect(width * height).toBeLessThanOrEqual(RENDER_PIXEL_BUDGET);
      expect(Math.max(width, height)).toBeLessThanOrEqual(limit);
      expect(ratio).toBeLessThanOrEqual(Math.min(2, dpr));
    }
    expect(renderRatio(390, 844, 2)).toBe(2);
    expect(RENDER_FRAME_MS).toBeCloseTo(1000 / 30);
  });

  it('notifies once and persists failure across renderer/module reloads', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const circuit = createRenderCircuit(storage);
    let calls = 0;
    const unsubscribe = circuit.subscribe(() => calls++);
    expect(circuit.blocked).toBe(false);
    circuit.trip();
    circuit.trip();
    expect(calls).toBe(1);
    expect(values.get(GPU_FAILURE_KEY)).toBe('1');
    expect(createRenderCircuit(storage).blocked).toBe(true);
    unsubscribe();
  });

  it('still protects the current document if storage is denied', () => {
    const circuit = createRenderCircuit({ getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } });
    let calls = 0;
    const unsubscribe = circuit.subscribe(() => calls++);
    unsubscribe();
    expect(() => circuit.trip()).not.toThrow();
    expect(circuit.blocked).toBe(true);
    expect(calls).toBe(0);
  });
});

const mesh = blob({ center: [0, 0, 0], radii: [1, 1, 1], rings: 4, sides: 6 });
function frame(): GLFrame {
  return { view: identity(), proj: identity(), light: [0, 1, 1], items: [{ key: 'body', mesh, matrix: identity(), color: '#fff', deep: '#123', tissue: 'muscle', opacity: 1, outline: true, state: 'idle', quiet: false, thin: 0,
    clip: { o: [0, 0, 0], grow: { dir: [0, 1, 0], cos: 0.4, spicules: 1 }, holes: [{ c: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], front: 0.1, back: 0.2, side: 0.3 }] },
  }] };
}

describe('unchanged pictures do not need GPU work', () => {
  it('compares fresh React values, without hiding a first frame or a changed item', () => {
    expect(sameGLFrame(null, frame())).toBe(false);
    expect(sameGLFrame(frame(), frame())).toBe(true);
    const a = frame(), b = frame();
    b.items.push({ ...b.items[0], key: 'second' });
    expect(sameGLFrame(a, b)).toBe(false);
  });

  const edits: Record<string, (f: GLFrame) => void> = {
    view: f => { f.view[0] = 2; }, projection: f => { f.proj[1] = 2; }, light: f => { f.light = [1, 1, 1]; },
    key: f => { f.items[0].key = 'other'; }, mesh: f => { f.items[0].mesh = { ...mesh }; },
    matrix: f => { f.items[0].matrix![12] = 2; }, color: f => { f.items[0].color = '#f00'; }, deep: f => { f.items[0].deep = '#000'; },
    tissue: f => { f.items[0].tissue = 'bone'; }, opacity: f => { f.items[0].opacity = 0.5; }, outline: f => { f.items[0].outline = false; },
    highlight: f => { f.items[0].state = 'active'; }, quiet: f => { f.items[0].quiet = true; }, thin: f => { f.items[0].thin = 1; },
    origin: f => { f.items[0].clip!.o = [1, 0, 0]; }, direction: f => { f.items[0].clip!.grow!.dir = [1, 1, 0]; },
    growth: f => { f.items[0].clip!.grow!.cos = 0.2; }, spicules: f => { f.items[0].clip!.grow!.spicules = 0; },
    hole: f => { f.items[0].clip!.holes![0].side = 0.5; }, tangent: f => { f.items[0].clip!.holes![0].u = [2, 0, 0]; },
    keep: f => { f.items[0].clip!.keep = f.items[0].clip!.holes![0]; }, removeClip: f => { f.items[0].clip = undefined; },
  };
  it.each(Object.entries(edits))('draws when %s changes', (_name, edit) => {
    const a = frame(), b = frame();
    edit(b);
    expect(sameGLFrame(a, b)).toBe(false);
  });

  it('notices each blood stream change, but accepts fresh wrappers of the same immutable buffers', () => {
    const stream = { cells: new Float32Array(4), gates: new Float32Array(1), route: new Float32Array(96), phase: 0.1, grow: 1 };
    const a = frame(); a.items[0].stream = stream;
    for (const key of ['cells', 'gates', 'route', 'phase', 'grow'] as const) {
      const b = frame(); b.items[0].stream = { ...stream };
      expect(sameGLFrame(a, b)).toBe(true);
      if (key === 'phase' || key === 'grow') b.items[0].stream[key] += 0.1;
      else b.items[0].stream[key] = stream[key].slice();
      expect(sameGLFrame(a, b), key).toBe(false);
    }
  });
});

describe('GPU buffer updates preserve cached poses', () => {
  it('can scrub forwards and backwards without overwriting the earlier mesh, including topology and UVs', () => {
    const a = { pos: mesh.pos.slice(), nrm: mesh.nrm.slice(), uv: mesh.uv.slice(), idx: mesh.idx.slice() };
    const original = structuredClone(a);
    const b = structuredClone(a);
    b.pos[0] += 1; b.nrm[1] = 0.123; b.uv[0] = 0.7;
    [b.idx[0], b.idx[1]] = [b.idx[1], b.idx[0]];
    const g = geometryOf(a);
    expect(updateGeometry(g, b)).toBe(true);
    expect(a).toEqual(original);
    expect(g.getAttribute('position').array).toBe(b.pos);
    expect(g.getAttribute('normal').array).toBe(b.nrm);
    expect(g.getAttribute('uv').array).toBe(b.uv);
    expect(g.index!.array).toBe(b.idx);
    expect(updateGeometry(g, a)).toBe(true);
    expect(g.getAttribute('position').array).toBe(a.pos);
    const version = g.index!.version;
    expect(updateGeometry(g, a)).toBe(false);
    expect(g.index!.version).toBe(version);
    g.dispose();
  });
});
