import { describe, expect, it } from 'vitest';
import { heartTube } from '@/components/scenes/week10/tube-geometry';
import { tube, curve3, type Mesh, type TubeOptions } from '@/lib/three-d/mesh';
import type { V3 } from '@/lib/three-d/math';

const maxDifference = (a: Float32Array, b: Float32Array) => a.reduce((d, x, i) => Math.max(d, Math.abs(x - b[i])), 0);
function sameMesh(actual: Mesh, expected: Mesh) {
  expect(actual.pos.length).toBe(expected.pos.length);
  expect(maxDifference(actual.pos, expected.pos)).toBe(0);
  expect(maxDifference(actual.nrm, expected.nrm)).toBe(0);
  expect(actual.uv).toEqual(expected.uv);
  expect(actual.idx).toEqual(expected.idx);
}

describe('Topic 10 tubes keep the reference anatomy and normals', () => {
  const paths: V3[][] = [
    [[-1, -2, -3], [0, 0, 0], [0, 1, 0]],
    curve3([[0, 0, 0], [-0.2, 0.1, 0.1], [0.1, 0.2, -0.1], [0, 0.3, 0]], 18),
    curve3([[0, 0, 0], [0.2, 1, -0.4], [-0.3, 2, 0.1]], 24),
    [[0, 0, 0], [0, 0, 0], [0, 1, 0], [0, 1, 0]],
  ];
  for (const [p, path] of paths.entries()) for (const sides of [8, 10, 22]) for (const caps of [0, 1, 2, 3]) {
    it(`matches path ${p}, ${sides} sides, caps ${caps}, including tight bends and coincident points`, () => {
      const o: TubeOptions = { radius: u => 0.31 * (1 - 0.75 * u), ref: [0, 0, 1], sides, capStart: !!(caps & 1), capEnd: !!(caps & 2) };
      sameMesh(heartTube(path, o), tube(path, o));
    });
  }

  it('preserves open angular parts and arbitrary around-functions', () => {
    const p = paths[2];
    const o: TubeOptions = { radius: u => 0.15 + u * 0.02, ref: [1, 0, 0], from: -0.8, to: 1.3, sides: 12, capStart: true, capEnd: true };
    sameMesh(heartTube(p, o), tube(p, o));
    const shaped = { ...o, around: (a: number) => 1 + 0.3 * Math.cos(a) };
    sameMesh(heartTube(p, shaped), tube(p, shaped));
  });

  it('shares topology but never overwrites an earlier pose; seeking backward gives the original mesh', () => {
    const path = paths[2];
    const options = (r: number): TubeOptions => ({ radius: u => r * (1 - 0.2 * u), ref: [0, 0, 1], sides: 10, capEnd: true });
    const a = heartTube(path, options(0.08)), snapshot = structuredClone(a);
    const b = heartTube(path, options(0.12));
    expect(b.uv).toBe(a.uv); expect(b.idx).toBe(a.idx);
    expect(b.pos).not.toBe(a.pos); expect(b.nrm).not.toBe(a.nrm);
    sameMesh(a, snapshot);
    expect(heartTube(path.map(p => [...p] as V3), options(0.08))).toBe(a);
    sameMesh(b, tube(path, options(0.12)));
  });
});
