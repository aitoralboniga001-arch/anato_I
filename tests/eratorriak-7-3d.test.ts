import { describe, expect, it } from 'vitest';
import { CAVITIES } from '@/content/eratorriak/cavities';
import { aliveAt, colourOf } from '@/content/eratorriak/model';
import { CAV_POSES, cavityModel } from '@/components/scenes/week7/cavities3d';

/** Topic 7's room 3D: the same pieces as the room, drawn and named whenever the room says they are there. */
describe('topic 7 room 3D', () => {
  const byKey = new Map(CAVITIES.pieces.map((p) => [p.key, p]));
  const at = (stage: number) =>
    cavityModel(
      CAV_POSES[stage],
      (k) => colourOf(byKey.get(k)!, 'origin', CAVITIES),
      (k) => (aliveAt(byKey.get(k)!, stage) ? 1 : 0),
    );

  it('has one pose per moment', () => {
    expect(CAV_POSES).toHaveLength(CAVITIES.stages.length);
  });

  it('draws and names every living piece at each moment, and nothing that is gone', () => {
    for (let s = 0; s < CAV_POSES.length; s++) {
      const m = at(s);
      const drawn = new Set(m.items.filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.02).map((it) => it.key));
      for (const p of CAVITIES.pieces) {
        expect(drawn.has(p.key), `${p.key} at ${s}`).toBe(aliveAt(p, s));
        if (aliveAt(p, s)) expect(m.pts[p.key], `${p.key} name point`).toBeDefined();
      }
    }
  });

  it('keeps the sides: the right-hand pieces lie on the embryo’s right (x < 0)', () => {
    const m = at(4);
    for (const p of CAVITIES.pieces.filter((q) => q.side !== 'C' && aliveAt(q, 4))) {
      const x = m.pts[p.key][0];
      expect(p.side === 'R' ? x < 0 : x > 0, p.key).toBe(true);
    }
  });
});
