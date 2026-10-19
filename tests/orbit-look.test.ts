import { describe, expect, it } from 'vitest';
import { norm, sub, dot, type Camera3, type V3 } from '@/lib/three-d/math';
import { lookTurn, orbitCamera } from '@/lib/three-d/orbit';

const eyeDir = (c: Camera3) => norm(sub(c.eye, c.target));

describe('named views (lookTurn)', () => {
  const cams: Camera3[] = [
    { eye: [0.4, 0.3, 6], target: [0, 0.2, 0], fov: 30 },
    { eye: [-5, 2, -3], target: [0.5, 0, 0.2], fov: 30 },
    { eye: [2, -1, 4], target: [0, 0, 0], fov: 30, up: [0, 1, 0] },
  ];
  const dirs: V3[] = [
    [0, 0, 1],
    [0, 0, -1],
    [1, 0, 0],
    [-1, 0, 0],
    [0.6, 0.3, -0.74],
  ];
  it('puts the eye on the asked side', () => {
    for (const c of cams)
      for (const d of dirs) {
        const got = eyeDir(orbitCamera(c, lookTurn(c, d)));
        expect(dot(got, norm(d))).toBeGreaterThan(0.999);
      }
  });
  it('from above stays as high as the orbit allows, keeping its side', () => {
    const c = cams[0];
    const got = eyeDir(orbitCamera(c, lookTurn(c, [0, 1, 0])));
    expect(got[1]).toBeGreaterThan(0.99);
  });
  it('from above or below leans the asked way, so the front ends at the top', () => {
    for (const c of cams) {
      const above = eyeDir(orbitCamera(c, lookTurn(c, [0, 1, 0], [0, 0, -1])));
      expect(above[1]).toBeGreaterThan(0.99);
      expect(above[2]).toBeLessThan(0);
      expect(Math.abs(above[0])).toBeLessThan(1e-6);
      const below = eyeDir(orbitCamera(c, lookTurn(c, [0, -1, 0], [0, 0, 1])));
      expect(below[1]).toBeLessThan(-0.99);
      expect(below[2]).toBeGreaterThan(0);
    }
  });
});
