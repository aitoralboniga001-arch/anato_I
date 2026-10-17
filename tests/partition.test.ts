import { expect, it } from 'vitest';
import { partition } from '@/lib/three-d/sdf';
import type { Mesh } from '@/lib/three-d/mesh';

const square: Mesh = {
  pos: new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]),
  nrm: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
  uv: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  idx: new Uint32Array([0, 1, 2, 0, 2, 3]),
};
const area = (m: Mesh) => {
  let sum = 0;
  for (let i = 0; i < m.idx.length; i += 3) {
    const [a, b, c] = [...m.idx.slice(i, i + 3)].map(v => [m.pos[v * 3], m.pos[v * 3 + 1]]);
    const signed = ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
    expect(signed).toBeGreaterThan(0);
    sum += signed;
  }
  return sum;
};

it('cuts crossing triangles at one continuous shared border without gaps or overlaps', () => {
  const [right, left] = partition(square, p => p[0] > 0);
  expect(area(right)).toBeCloseTo(2, 3);
  expect(area(left)).toBeCloseTo(2, 3);
  expect(area(right) + area(left)).toBeCloseTo(4, 6);
  const border = (m: Mesh) => Array.from({ length: m.pos.length / 3 }, (_, i) => [...m.pos.slice(i * 3, i * 3 + 3)])
    .filter(p => Math.abs(p[0]) < 0.001).map(p => p.join(',')).sort();
  expect(border(right)).toEqual(border(left));
  expect(border(right)).toHaveLength(3); // The diagonal crossing is shared by both original triangles.
  for (const m of [right, left]) {
    for (let i = 0; i < m.pos.length / 3; i++) {
      expect(m.uv[i * 2]).toBeCloseTo((m.pos[i * 3] + 1) / 2, 5);
      expect(m.uv[i * 2 + 1]).toBeCloseTo((m.pos[i * 3 + 1] + 1) / 2, 5);
      expect([...m.nrm.slice(i * 3, i * 3 + 3)]).toEqual([0, 0, 1]);
    }
  }
});

it('keeps triangles entirely on one side unchanged', () => {
  const [all, empty] = partition(square, () => true);
  expect(all).toEqual(square);
  expect(empty.idx).toHaveLength(0);
});
