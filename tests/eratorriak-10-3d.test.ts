import { describe, expect, it } from 'vitest';
import { CHANGES10, HEART_TUBE } from '@/content/eratorriak/heart-tube';
import { aliveAt } from '@/content/eratorriak/model';
import { anchorOf, insetView, isOf, layerView, tubeFrame } from '@/components/shell/eratorriak/Tube3D';

const LAYERS = ['endoR', 'endoL', 'myocard', 'epicard', 'mesocard'];
const VALVES = ['valveUpper', 'valveIvc', 'valveCor', 'valveL', 'spurium'];
const VIEWS = [
  { name: 'tube', wL: 0, wA: 0, has: (k: string) => !VALVES.includes(k) && !['endoR', 'endoL', 'epicard'].includes(k) },
  { name: 'layers', wL: 1, wA: 0, has: (k: string) => !VALVES.includes(k) },
  { name: 'close-up', wL: 0, wA: 1, has: (k: string) => VALVES.includes(k) },
];

/** Topic 10's room 3D: every piece the room has at a moment is drawn and named in the view that holds it. */
describe('topic 10 room 3D', () => {
  it('draws and names every living piece at each moment, in its view, and nothing that is not there', () => {
    for (let s = 0; s < HEART_TUBE.stages.length; s++) {
      for (const v of VIEWS) {
        const f = tubeFrame(s, v.wL, v.wA, 'origin');
        const drawn = f.items.filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.05);
        for (const p of HEART_TUBE.pieces.filter((q) => v.has(q.key))) {
          const own = drawn.filter((it) => isOf(p.key, it, s) && (v.wA ? it.key.startsWith('a:') : !it.key.startsWith('a:')));
          expect(own.length > 0, `${p.key} at ${s} (${v.name})`).toBe(aliveAt(p, s));
          if (aliveAt(p, s)) expect(anchorOf(p.key, f, v.wL, v.wA), `${p.key} name at ${s} (${v.name})`).not.toBeNull();
        }
      }
    }
  });

  it('names what each moment says in the view the moment opens with', () => {
    for (let s = 0; s < HEART_TUBE.stages.length; s++) {
      const none = new Set<string>();
      const wL = layerView(s, none) ? 1 : 0;
      const wA = insetView(s, none) ? 1 : 0;
      const f = tubeFrame(s, wL, wA, 'origin');
      for (const k of CHANGES10[s].flatMap((c) => c.keys)) {
        const p = HEART_TUBE.pieces.find((q) => q.key === k)!;
        if (aliveAt(p, s)) expect(anchorOf(k, f, wL, wA), `${k} at ${s}`).not.toBeNull();
      }
    }
  });

  it('keeps the sides: right pieces on the embryo’s right (x < 0), left ones on its left', () => {
    const f = tubeFrame(4, 0, 0, 'origin');
    const x = (k: string) => anchorOf(k, f, 0, 0)!.p[0];
    for (const k of ['proximal', 'atriumR', 'sinusR']) expect(x(k) < 0, k).toBe(true);
    for (const k of ['ventricle', 'atriumL', 'sinusCor', 'sinusOblique']) expect(x(k) > 0, k).toBe(true);
    // The whole conus lies right of the midline after the loop: its two ways keep their sides of it.
    expect(x('conusR') < x('conusL')).toBe(true);
  });

  it('opens the layers for a layer and the close-up for a valve', () => {
    expect(layerView(1, new Set())).toBe(true);
    expect(layerView(3, new Set(['epicard']))).toBe(true);
    expect(layerView(3, new Set(['epicard', 'ventricle']))).toBe(false);
    expect(insetView(5, new Set())).toBe(true);
    expect(insetView(2, new Set(['valveL']))).toBe(true);
    expect(insetView(5, new Set(['sinusOblique']))).toBe(false);
  });
});
