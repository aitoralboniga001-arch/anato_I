import { describe, expect, it } from 'vitest';
import { MUSCLES } from '@/content/eratorriak/muscles';
import { anchorOf, isOf, muscleFrame, ownStage, piecesAt } from '@/components/shell/eratorriak/Muscle3D';

/** Topic 9's room 3D: each view draws and names its own pieces (and what it says), and only those. */
describe('topic 9 room 3D', () => {
  const frames = MUSCLES.stages.map((_, s) => muscleFrame(s, 'origin'));

  it('gives every piece a view', () => {
    for (const p of MUSCLES.pieces) expect(ownStage(p.key), p.key).toBeGreaterThanOrEqual(0);
  });

  it('draws and names, in each view, its own pieces and the ones it says', () => {
    frames.forEach((f, s) => {
      const drawn = f.items.filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.05);
      for (const p of MUSCLES.pieces) {
        const mine = piecesAt(s).includes(p.key);
        expect(
          drawn.some((it) => isOf(p.key, it, s)),
          `${p.key} in view ${s}`,
        ).toBe(mine);
        if (mine) expect(anchorOf(p.key, f), `${p.key} name in view ${s}`).not.toBeNull();
        else expect(anchorOf(p.key, f), `${p.key} not named in view ${s}`).toBeNull();
      }
    });
  });

  it('names on the side the cameras face (the embryo’s left, x > 0)', () => {
    frames.forEach((f, s) => {
      for (const k of piecesAt(s)) expect(anchorOf(k, f)!.p[0], `${k} in view ${s}`).toBeGreaterThanOrEqual(-0.01);
    });
  });
});

describe('topic 9 long names', () => {
  it('wrap onto two lines without losing a word', async () => {
    const { twoLines } = await import('@/components/shell/eratorriak/Muscle3D');
    for (const p of MUSCLES.pieces) {
      const t = p.fateText;
      const w = twoLines(t);
      const words = (x: string) =>
        x
          .replace(/[;,·/]/g, ' ')
          .split(/\s+/)
          .filter(Boolean);
      expect(words(`${w.text} ${w.sub ?? ''}`), t).toEqual(words(t));
    }
  });
});
