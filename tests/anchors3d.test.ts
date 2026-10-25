import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { SceneView } from '@/components/kit/columns';
import { structures, weeks } from '@/content/registry';
import { project, viewOf, type V3, type View3 } from '@/lib/three-d/math';
import { coverOf, visibleAnchor } from '@/lib/three-d/occlusion';
import { Birth3D, Secundum3D } from '@/components/scenes/week11/Septa3D';
import type { Item3, Scene3 } from '@/lib/three-d/scene';
import type { SceneComponent } from '@/lib/sim/types';

/**
 * A name's dot must sit on its own structure as the camera sees it, not on whatever lies in front of
 * it: from a front view the dorsal aortae hide behind the aortic sac, and a dot "on" them would land on
 * the sac. ModelView moves a covered anchor to the nearest point of the structure the eye does see
 * (lib/three-d/occlusion.ts); the other 3D views place theirs by hand. For every 3D step's settled
 * frame (topics 7–12), each shown name's dot must be seen and inside the frame: a structure with
 * nothing in sight needs another camera or another anchor.
 *
 * The 3D stage and the names are stood in for: the stage projects with the step's own camera and
 * remembers which 3D point each screen point came from; the names record what they were given.
 */

interface Taken {
  items: Item3[];
  view: View3;
  world: WeakMap<object, V3>;
}
type Named = { id: string; at: object; show: number; key?: string };
const probe: { stage: Taken | null; names: { stage: Taken; items: Named[] }[] } = { stage: null, names: [] };

vi.mock('@/components/kit/three/Stage3D', async (load) => {
  const real = await load<typeof import('@/components/kit/three/Stage3D')>();
  function Stage3D({ scene, children }: { scene: Scene3; children?: (at: unknown, view: View3) => ReactNode }) {
    const view = viewOf(scene.camera);
    const taken: Taken = { items: scene.items, view, world: new WeakMap() };
    probe.stage = taken;
    const at = (p: V3) => {
      const r = project(view, p);
      const s = { x: r.x, y: r.y, z: r.z };
      taken.world.set(s, p);
      return s;
    };
    return createElement('g', null, children?.(at, view));
  }
  return { ...real, Stage3D };
});

vi.mock('@/components/kit/callouts', async (load) => {
  const real = await load<typeof import('@/components/kit/callouts')>();
  function Callouts({ items }: { items: Named[] }) {
    if (probe.stage) probe.names.push({ stage: probe.stage, items });
    return null;
  }
  return { ...real, Callouts };
});

const ctx: SceneContextValue = {
  selected: null,
  hovered: null,
  focus: [],
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => structures.get(id)?.name ?? id,
  onSelect: () => {},
  onHover: () => {},
};

function named(Scene: SceneComponent, t: number) {
  probe.stage = null;
  probe.names = [];
  renderToStaticMarkup(
    createElement(
      SceneContext.Provider,
      { value: ctx },
      createElement(LabelScaleContext.Provider, { value: { k: 1, left: false, right: false } }, createElement(SceneView, { Scene, t, reduced: true })),
    ),
  );
  return probe.names;
}

for (const [w, week] of weeks.entries()) {
  if (w + 1 < 7) continue;
  describe(`${w + 1}. gaia: izenen puntuak beren egituraren gainean, ez aurrean dagoen beste baten gainean`, () => {
    for (const stage of week.stages) {
      it(stage.id, () => {
        const problems: string[] = [];
        stage.beats.forEach((b, i) => {
          const view = stage.views.find((v) => v.id === (b.view ?? stage.views[0].id)) ?? stage.views[0];
          const t = (stage.beats[i + 1]?.at ?? 1) - 0.035;
          for (const { stage: s, items } of named(view.scene, t))
            for (const n of items) {
              const p = s.world.get(n.at);
              if (n.show < 0.5 || !p) continue;
              const where = `${i}. urratsa (${view.id}, t=${t.toFixed(2)}): ${n.key ?? n.id}`;
              // As ModelView judges its anchors: a vessel's width short of the point (it sits inside its own tube).
              const hit = coverOf(s.items, s.view.eye, p, n.id, 0.3);
              const q = project(s.view, p);
              if (hit) problems.push(`${where} → ${hit}-ren atzean`);
              else if (q.x < 0 || q.x > 1000 || q.y < 0 || q.y > 640) problems.push(`${where} → markotik kanpo (${Math.round(q.x)}, ${Math.round(q.y)})`);
            }
        });
        expect(problems).toEqual([]);
      });
    }
  });
}

it('reconsiders a cached anchor when the frame changes without moving the eye', () => {
  const mesh = { pos: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), idx: new Uint32Array([0, 1, 2]) };
  const items = [{ id: 'own', mesh }] as Item3[];
  const eye: V3 = [0, 0, 5];
  const p: V3 = [0, 0, 0];
  expect(visibleAnchor(items, eye, p, 'own')).toEqual(p);
  expect(visibleAnchor(items, eye, p, 'own', (q) => q[1] > 0.5)).toEqual([0, 1, 0]);
});

it('the oblique-path ostium dot is clear of the unnamed atrial rim too', () => {
  const s = named(Secundum3D, 0.78).find(({ items }) => items.some((n) => n.id === 'ostium-secunduma'))!;
  const n = s.items.find((n) => n.id === 'ostium-secunduma')!;
  const p = s.stage.world.get(n.at)!;
  const items = s.stage.items.map((item) => item.key === 'rim' ? { ...item, id: 'atrial-rim' } : item);
  expect(coverOf(items, s.stage.view.eye, p, n.id, 0.04)).toBeNull();
});

for (const t of [0.81, 0.96]) {
  it(`birth t=${t}: the patent opening's dot sits on the drawn residual slit`, () => {
    const samples = named(Birth3D, t);
    const s = samples.find(({ items }) => items.some((n) => n.id === 'zulo-obala' && n.show >= 0.5))!;
    const n = s.items.find((n) => n.id === 'zulo-obala' && n.show >= 0.5)!;
    const p = s.stage.world.get(n.at)!;
    const slit = s.stage.items.find((item) => item.key === 'slit')!;
    expect(slit).toBeDefined();
    let distance = Infinity;
    for (let i = 0; i < slit.mesh.pos.length; i += 3) {
      distance = Math.min(distance, Math.hypot(p[0] - slit.mesh.pos[i], p[1] - slit.mesh.pos[i + 1], p[2] - slit.mesh.pos[i + 2]));
    }
    expect(distance).toBeLessThan(0.04);
    expect(coverOf(s.stage.items, s.stage.view.eye, p, n.id, 0.12)).toBeNull();
  });
}
