import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { ModelView, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { Intro3D, IntroView, Ventral3D, VentralView } from '@/components/scenes/week12/Embryo3D';
import { week12 } from '@/content/weeks/week12';
import { project, viewOf, type Camera3, type V3 } from '@/lib/three-d/math';
import { coverOf, visibleAnchor } from '@/lib/three-d/occlusion';
import type { Item3 } from '@/lib/three-d/scene';
import type { SceneComponent } from '@/lib/sim/types';

/**
 * A name's dot must sit on its own structure as the camera sees it, not on whatever lies in front of
 * it: from a front view the dorsal aortae hide behind the aortic sac, and a dot "on" them would land on
 * the sac. ModelView moves a covered anchor to the nearest point of the structure the eye does see
 * (lib/three-d/occlusion.ts). For every step's settled frame, each shown name's dot must end up seen
 * and inside the frame; a structure with nothing in sight needs another camera or another anchor.
 */

type ModelProps = { model: { items: Item3[]; pts: Record<string, V3> }; camera: Camera3; names: CalloutSpec[] };

/** The views that wait for geometry: their inner view, called directly (it builds the geometry at once). */
const UNGATED = new Map<unknown, SceneComponent>([
  [Intro3D, IntroView],
  [Ventral3D, VentralView],
]);

/** Unwrap a scene's element (ArtView, TrunkView…) down to the ModelView it draws. */
function modelOf(scene: SceneComponent, t: number): ModelProps | null {
  let el = ((UNGATED.get(scene) ?? scene) as (p: { t: number }) => ReactElement)({ t });
  for (let i = 0; i < 6 && el; i++) {
    if (el.type === ModelView) return el.props as ModelProps;
    if (typeof el.type !== 'function') return null;
    el = (el.type as (p: unknown) => ReactElement)(el.props);
  }
  return null;
}

describe('12. gaia: izenen puntuak beren egituraren gainean, ez aurrean dagoen beste baten gainean', () => {
  for (const stage of week12.stages) {
    it(stage.id, () => {
      const problems: string[] = [];
      stage.beats.forEach((b, i) => {
        const view = stage.views.find((v) => v.id === (b.view ?? stage.views[0].id)) ?? stage.views[0];
        const t = (stage.beats[i + 1]?.at ?? 1) - 0.035;
        const m = modelOf(view.scene, t);
        if (!m) return;
        const v3 = viewOf(m.camera);
        for (const n of m.names) {
          if (n.show < 0.5 || typeof n.p !== 'string') continue;
          const p = m.model.pts[n.p];
          if (!p) continue;
          const q = visibleAnchor(m.model.items, v3.eye, p, n.id, (r) => {
            const s = project(v3, r);
            return s.x > 30 && s.x < 970 && s.y > 30 && s.y < 610;
          });
          const hit = coverOf(m.model.items, v3.eye, q, n.id, q === p ? 0.3 : 0.12);
          const s = project(v3, q);
          const where = `${i}. urratsa (t=${t.toFixed(2)}): ${n.key ?? n.id} [${n.p}]`;
          if (hit) problems.push(`${where} → ${hit}-ren atzean, eta ez da ezer ikusten`);
          else if (s.x < 0 || s.x > 1000 || s.y < 0 || s.y > 640) problems.push(`${where} → ikusten den atala markotik kanpo (${Math.round(s.x)}, ${Math.round(s.y)})`);
        }
      });
      expect(problems).toEqual([]);
    });
  }
});
