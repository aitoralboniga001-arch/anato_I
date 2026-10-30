import { describe, expect, it } from 'vitest';
import { SEPTA } from '@/content/eratorriak/septa';
import { aliveAt } from '@/content/eratorriak/model';
import { anchorOf, isOf, lowerView, septaFrame } from '@/components/shell/eratorriak/Septa3D';

/** Topic 11's room 3D: every piece the room has at a moment is drawn and named in the view that holds it. */
describe('topic 11 room 3D', () => {
  const lowerOnly = (key: string) => lowerView(new Set([key]));

  it('draws and names every living piece at each moment, in its view, and nothing that is gone', () => {
    for (let s = 0; s < SEPTA.stages.length; s++) {
      for (const lower of [false, true]) {
        const { items, pts, vpts } = septaFrame(s, lower ? 1 : 0, 'origin');
        const drawn = items.filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.05);
        for (const p of SEPTA.pieces) {
          if (lowerOnly(p.key) !== lower && !(lower && ['cushionSup', 'cushionInf', 'rvTrab', 'lvTrab'].includes(p.key))) continue;
          const own = drawn.filter((it) => isOf(p.key, it));
          expect(own.length > 0, `${p.key} at ${s} (${lower ? 'lower' : 'atria'})`).toBe(aliveAt(p, s));
          if (aliveAt(p, s)) expect(anchorOf(p.key, items, pts, vpts, lower), `${p.key} name at ${s}`).not.toBeNull();
        }
      }
    }
  });

  it('turns to the lower heart only for pieces the atria do not have', () => {
    expect(lowerView(new Set(['valveR']))).toBe(true);
    expect(lowerView(new Set(['primum']))).toBe(false);
    expect(lowerView(new Set(['cushionSup']))).toBe(false);
    expect(lowerView(new Set(['valveR', 'primum']))).toBe(false);
  });
});
