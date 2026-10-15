import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LimbRotation3D, buildLimbRotation } from '@/components/scenes/week8/LimbRotation3D';
import type { At3 } from '@/components/kit/three/Stage3D';
import type { V3, View3 } from '@/lib/three-d/math';

const probe = vi.hoisted(() => ({ eye: [0, 0, 6] as V3, labels: [] as { id: string; key?: string; show: number; at: { x: number; y: number; z: number } }[] }));
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
function lowerLabels(eye: V3) {
  probe.eye = eye;
  renderToStaticMarkup(createElement('svg', null, createElement(LimbRotation3D, { t: 1, reduced: false })));
  return Object.fromEntries(probe.labels.filter((l) => l.key).map((l) => [l.id, l.show]));
}

describe('limb muscle labels respect the visible side', () => {
  it('does not label the blue front of a leg as a hidden posterior flexor', () => {
    // Seen from the front-left (where the legs start turning), the posterior flexors are out of sight.
    const labels = lowerLabels([5.8, 0.94, 4.01]);
    expect(labels['muskulu-tolestatzaileak']).toBe(0);
    expect(labels['muskulu-hedatzaileak']).toBe(1);
  });
  it('ends the leg turn on a view that shows both masses', () => {
    const labels = lowerLabels(buildLimbRotation(1).scene.camera.eye);
    expect(labels['muskulu-tolestatzaileak']).toBe(1);
    expect(labels['muskulu-hedatzaileak']).toBe(1);
  });
  it('reveals the flexor label when the learner turns to the back', () => {
    const labels = lowerLabels([0, -0.3, -7]);
    expect(labels['muskulu-tolestatzaileak']).toBeGreaterThan(0.5);
  });
});
