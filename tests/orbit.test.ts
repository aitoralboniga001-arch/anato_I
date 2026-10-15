import { describe, expect, it } from 'vitest';
import { orbitCamera } from '@/lib/three-d/orbit';
import { dot, len, norm, sub, type Camera3 } from '@/lib/three-d/math';

describe('learner-controlled 3D camera', () => {
  it('resets to the exact scripted camera without changing the developmental frame', () => {
    const camera: Camera3 = { eye: [3, 8, 2], target: [0, 0.2, 0], fov: 30 };
    expect(orbitCamera(camera, { yaw: 0, pitch: 0 })).toBe(camera);
  });
  it.each([0, 1.2, -1.2])('preserves distance and prevents flipping at initial elevation %s', (elevation) => {
    const camera: Camera3 = { eye: [0, Math.sin(elevation) * 6, Math.cos(elevation) * 6], target: [0, 0, 0], fov: 30 };
    for (const pitch of [-1.1, 0, 1.1]) {
      const turned = orbitCamera(camera, { yaw: 0.8, pitch });
      const offset = sub(turned.eye, turned.target);
      expect(len(offset)).toBeCloseTo(6, 6);
      expect(Math.abs(dot(norm(offset), [0, 1, 0]))).toBeLessThan(0.998);
      // Horizontal heading remains on the same side of the pole.
      expect(offset[2]).toBeGreaterThan(0);
      expect(turned.target).toBe(camera.target);
    }
  });
  it('respects an explicit anatomical up vector', () => {
    const camera: Camera3 = { eye: [0, 6, 1], target: [0, 0, 0], up: [0, 0, 1], fov: 30 };
    const turned = orbitCamera(camera, { yaw: 0.4, pitch: 1.1 });
    expect(len(sub(turned.eye, turned.target))).toBeCloseTo(Math.sqrt(37));
    expect(turned.eye.every(Number.isFinite)).toBe(true);
  });
});
