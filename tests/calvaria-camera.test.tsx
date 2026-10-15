import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { At3 } from '@/components/kit/three/Stage3D';
import type { V3, View3 } from '@/lib/three-d/math';
import { Calvaria3D } from '@/components/scenes/week8/Calvaria3D';

const probe = vi.hoisted(() => ({ eye: [4, 3, 4] as V3, labels: [] as { id: string; show?: number; at: { x: number; y: number; z?: number } }[] }));

vi.mock('@/components/kit/three/Stage3D', async () => {
  const { viewOf } = await import('@/lib/three-d/math');
  return {
    Loading3D: () => null,
    Stage3D: ({ children }: { children: (at: At3, view: View3) => ReactNode }) =>
      children((p) => ({ x: p[0], y: p[1], z: p[2] }), viewOf({ eye: probe.eye, target: [0, 0, 0], fov: 30 })),
  };
});
vi.mock('@/components/kit', async (original) => ({
  ...await original<typeof import('@/components/kit')>(),
  Callouts: ({ items }: { items: typeof probe.labels }) => { probe.labels = items; return null; },
}));

function labelsFrom(eye: V3) {
  probe.eye = eye;
  renderToStaticMarkup(createElement('svg', null, createElement(Calvaria3D, { t: 0.74, reduced: true })));
  return new Map(probe.labels.map((label) => [label.id, label]));
}

describe('calvaria labels follow the displayed camera', () => {
  it('switches paired temporal labels to the near side when the learner orbits', () => {
    const left = labelsFrom([5, 2, 0]);
    const right = labelsFrom([-5, 2, 0]);
    expect(left.get('tenporalaren-ezkata')!.at.x).toBeGreaterThan(0);
    expect(right.get('tenporalaren-ezkata')!.at.x).toBeLessThan(0);
    expect(left.get('tenporalaren-ezkata')!.show).toBeGreaterThan(0);
    expect(right.get('tenporalaren-ezkata')!.show).toBeGreaterThan(0);
  });
  it('hides the far occipital label from the front, reveals it from behind', () => {
    expect(labelsFrom([0, 1, 6]).get('okzipitalaren-ezkata')!.show).toBe(0);
    expect(labelsFrom([0, 1, -6]).get('okzipitalaren-ezkata')!.show).toBeGreaterThan(0);
  });
});
