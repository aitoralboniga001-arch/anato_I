import { describe, expect, it } from 'vitest';
import { BONES } from '@/content/eratorriak/bones';
import { project, viewOf, FRAME_H, FRAME_W } from '@/lib/three-d/math';
import { anchorOf, boneFrame, isOf, ownStage, piecesAt } from '@/components/shell/eratorriak/Bone3D';

/** Topic 8's room 3D: each view draws and names its own pieces (and what it says), and only those. */
describe('topic 8 room 3D', () => {
  const frames = BONES.stages.map((_, s) => boneFrame(s, 'origin'));

  it('gives every piece a view', () => {
    for (const p of BONES.pieces) expect(ownStage(p.key), p.key).toBeGreaterThanOrEqual(0);
  });

  it('draws and names, in each view, its own pieces and the ones it says', () => {
    frames.forEach((f, s) => {
      const drawn = f.items.filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.05);
      for (const p of BONES.pieces) {
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

  it('keeps every name point in the picture', () => {
    frames.forEach((f, s) => {
      const v = viewOf(f.camera);
      for (const k of piecesAt(s)) {
        const q = project(v, anchorOf(k, f)!.p);
        expect(q.x > 40 && q.x < FRAME_W - 40 && q.y > 30 && q.y < FRAME_H - 30, `${k} in view ${s} at ${q.x | 0},${q.y | 0}`).toBe(true);
      }
    });
  });

  it('keeps the body’s halves apart: upper half from the segment above, lower half from the one below', () => {
    const f = frames[4];
    const up = anchorOf('vertebraCaudal', f)!.p;
    const down = anchorOf('vertebraCranial', f)!.p;
    expect(up[1]).toBeGreaterThan(down[1]);
    const c = (k: string) => f.items.find((it) => it.key === k)!.color;
    expect(c('a:v20u')).not.toBe(c('a:v20d'));
  });
});
