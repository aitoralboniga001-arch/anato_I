import { describe, expect, it } from 'vitest';
import { visibleFrom } from '@/lib/three-d/visibility';
import { rotateAbout } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';

const wall: Item3 = {
  key: 'wall', color: '#fff',
  mesh: {
    pos: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]),
    nrm: new Float32Array(9), uv: new Float32Array(6), idx: new Uint32Array([0, 1, 2]),
  },
};
describe('3D label occlusion', () => {
  it('rejects a point behind tissue, but not one in front or on its surface', () => {
    expect(visibleFrom([0, 0, -1], [0, 0, 5], [wall])).toBe(false);
    expect(visibleFrom([0, 0, 1], [0, 0, 5], [wall])).toBe(true);
    expect(visibleFrom([0, 0, 0], [0, 0, 5], [wall])).toBe(true);
    expect(visibleFrom([2, 0, -1], [2, 0, 5], [wall])).toBe(true);
  });
  it('accounts for an occluder rotating around an offset limb root', () => {
    const moved = { ...wall, matrix: rotateAbout([1, 0, 0], [0, 1, 0], Math.PI / 2) };
    expect(visibleFrom([0, 0, 1], [5, 0, 1], [moved])).toBe(false);
    expect(visibleFrom([2, 0, 1], [5, 0, 1], [moved])).toBe(true);
  });
});
