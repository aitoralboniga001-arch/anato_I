import { describe, expect, it } from 'vitest';
import { blob } from '@/lib/three-d/mesh';
import { deform, deformBy, ellipsoid, surfaceMesh } from '@/lib/three-d/sdf';
import type { V3 } from '@/lib/three-d/math';

describe('deformation cache', () => {
  const mesh = () => blob({ center: [0, 0, 0], radii: [0.3, 0.4, 0.5], rings: 6, sides: 8 });
  it('reuses unchanged poses without running the vertex transform again', () => {
    const m = mesh();
    let calls = 0;
    const move = (p: V3): V3 => { calls++; return [p[0], p[1] + 0.2, p[2]]; };
    const a = deformBy(m, [0.2], move);
    const built = calls;
    expect(built).toBeGreaterThan(0);
    expect(deformBy(m, [0.2], move)).toBe(a);
    expect(calls).toBe(built);
    expect(a).toEqual(deform(m, p => [p[0], p[1] + 0.2, p[2]]));
  });
  it('scrubs backwards to the same geometry and keeps independent slots', () => {
    const m = mesh();
    const move = (k: number) => (p: V3): V3 => [p[0], p[1] * k, p[2]];
    const a = deformBy(m, [0.4], move(0.4), 'grow');
    const other = deformBy(m, [0.8], move(0.8), 'lift');
    deformBy(m, [0.9], move(0.9), 'grow');
    expect(deformBy(m, [0.8], move(0.8), 'lift')).toBe(other);
    const back = deformBy(m, [0.4], move(0.4), 'grow');
    expect(back).not.toBe(a); // Only the latest pose per slot is retained.
    expect(back).toEqual(a);
    expect(deformBy(mesh(), [0.4], move(0.4), 'grow')).not.toBe(back);
  });
});

describe('anisotropic surface sampling', () => {
  it('keeps scalar sampling identical, and a coarse extrusion remains on the surface', () => {
    const f = ellipsoid([0, 0, 0], [0.3, 0.4, 0.5]);
    const lo: V3 = [-0.5, -0.6, -0.7];
    const hi: V3 = [0.5, 0.6, 0.7];
    const fine = surfaceMesh(f, lo, hi, 0.04);
    expect(surfaceMesh(f, lo, hi, [0.04, 0.04, 0.04])).toEqual(fine);
    const coarse = surfaceMesh(f, lo, hi, [0.04, 0.04, 0.08]);
    expect(coarse.idx.length).toBeLessThan(fine.idx.length);
    for (let i = 0; i < coarse.pos.length; i += 3) {
      expect(Math.abs(f(coarse.pos[i], coarse.pos[i + 1], coarse.pos[i + 2]))).toBeLessThan(0.01);
    }
    expect([...coarse.nrm].every(Number.isFinite)).toBe(true);
  });
});
