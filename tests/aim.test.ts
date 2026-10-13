import { describe, expect, it } from 'vitest';
import { aimCamera, blendCamera } from '@/lib/three-d/aim';
import { dot, len, norm, sub, type Camera3 } from '@/lib/three-d/math';

const cam: Camera3 = { eye: [0, 0, 10], target: [0, 0, 0], fov: 30 };
const dir = (c: Camera3) => norm(sub(c.eye, c.target));

describe('3D study camera', () => {
  it('turns towards the side a structure lies on, keeping up and down', () => {
    const c = aimCamera(cam, [4, 0, 0]);
    expect(dir(c)[0]).toBeGreaterThan(0.3);
    expect(Math.abs(dir(c)[1])).toBeLessThan(1e-6);
    // A little closer, re-centred towards the structure.
    expect(len(sub(c.eye, c.target))).toBeLessThan(10);
    expect(c.target[0]).toBeGreaterThan(0);
  });

  it('leaves a structure at the centre where it is', () => {
    expect(dot(dir(aimCamera(cam, [0.1, 0, 0])), dir(cam))).toBeCloseTo(1, 5);
  });

  it('never goes under or over the model', () => {
    expect(Math.asin(dir(aimCamera(cam, [0, -9, -1]))[1])).toBeGreaterThanOrEqual(-0.2501);
    expect(Math.asin(dir(aimCamera(cam, [0, 9, -1]))[1])).toBeLessThanOrEqual(1.1501);
  });

  it('glides round the target from one camera to the other', () => {
    const b = aimCamera(cam, [4, 0, 0]);
    expect(blendCamera(cam, b, 0)).toBe(cam);
    expect(blendCamera(cam, b, 1)).toBe(b);
    const mid = blendCamera(cam, b, 0.5);
    const r = len(sub(mid.eye, mid.target));
    expect(r).toBeGreaterThan(Math.min(len(sub(b.eye, b.target)), 10) - 1e-6);
  });
});
