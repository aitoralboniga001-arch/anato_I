import { expect, it } from 'vitest';
import { BONES, RESEGMENT8 } from '@/content/eratorriak/bones';
import { CARDS8 } from '@/content/eratorriak/cards8';
import { boneGeometry } from '@/components/shell/eratorriak/BoneDiagram';
import { w8 } from '@/content/notes-text/w8';
import { roomContract } from './eratorriak-contract';
roomContract(BONES, CARDS8, w8, boneGeometry);
it('pins the two resegmented halves and two disc sources', () => {
  const keys = (f: string) =>
    BONES.pieces
      .filter((p) => p.fate === f)
      .map((p) => p.key)
      .sort();
  expect(keys('vertebra')).toEqual(['vertebraCaudal', 'vertebraCranial']);
  expect(keys('disc')).toEqual(['annulus', 'nucleus']);
  expect(BONES.pieces.find((p) => p.key === 'nucleus')!.origin).toBe('noto');
  expect(RESEGMENT8.lives.notoBody).toEqual([1, 1, 2, 3]);
  for (const [k, life] of Object.entries(RESEGMENT8.lives)) {
    expect(BONES.pieces.some((p) => p.key === k)).toBe(true);
    expect(life).toHaveLength(RESEGMENT8.stages.length);
  }
});
it('preserves occipital parts and distinguishes Meckel from surrounding mesenchyme', () => {
  expect(BONES.pieces.filter((p) => p.fate === 'occipital').map((p) => p.key)).toEqual(['occScale', 'occBaseOcc', 'occBaseNeck']);
  expect(BONES.pieces.find((p) => p.key === 'mandible')!.emb).toContain('inguruko');
  expect(BONES.pieces.find((p) => p.key === 'malleus')!.emb).not.toContain('inguruko');
  expect(BONES.pieces.find((p) => p.key === 'ribCart')!.origin).toBe('parietal');
});
