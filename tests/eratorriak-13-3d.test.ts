import { describe, expect, it } from 'vitest';
import { VEINS } from '@/content/eratorriak/veins';
import { aliveAt } from '@/content/eratorriak/model';
import { anchorOf, isOf, veinFrame } from '@/components/shell/eratorriak/Vein3D';

/** Topic 13's room 3D: the simulator's vein model shows every piece the room says is there, and nothing that is gone. */
describe('topic 13 room 3D', () => {
  it('draws and names every living piece at each moment, and nothing that is gone', () => {
    for (let s = 0; s < VEINS.stages.length; s++) {
      const { items, pts } = veinFrame(s, 'origin');
      const drawn = items.filter((it) => !it.key.startsWith('ghost-') && (it.show ?? 1) * (it.opacity ?? 1) > 0.05);
      for (const p of VEINS.pieces) {
        const own = drawn.filter((it) => isOf(p.key, it.key));
        // The oblique vein shares the left horn until the coronary sinus: it is there whenever the horn is.
        if (p.key !== 'oblique') expect(own.length > 0, `${p.key} at ${s}`).toBe(aliveAt(p, s));
        if (aliveAt(p, s)) expect(anchorOf(p.key, items, pts), `${p.key} name at ${s}`).not.toBeNull();
      }
    }
  });

  it('gives the room pieces the room colours', () => {
    const { items } = veinFrame(4, 'fate');
    const hc = items.find((it) => it.key === 'hcR')!;
    expect(hc.color.toLowerCase()).toBe(VEINS.fates[VEINS.pieces.find((p) => p.key === 'hcR')!.fate].color.toLowerCase());
  });
});
