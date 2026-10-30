import { expect, it } from 'vitest';
import { MUSCLES, MUSCLE_FACTS } from '@/content/eratorriak/muscles';
import { CARDS9 } from '@/content/eratorriak/cards9';
import { muscleGeometry } from '@/components/shell/eratorriak/MuscleDiagram';
import { w9 } from '@/content/notes-text/w9';
import { roomContract } from './eratorriak-contract';
roomContract(MUSCLES, CARDS9, w9, muscleGeometry);
it('does not equate origin domain and motor ramus', () => {
  expect(MUSCLES.pieces.find((p) => p.key === 'intercostal')!.origin).toBe('prima');
  expect(MUSCLE_FACTS.intercostal.nerve).toContain('Aurreko');
  expect(MUSCLE_FACTS.deep.nerve).toContain('Atzeko');
  expect(MUSCLES.categorical).toBe(true);
  expect(MUSCLES.pieces.every((p) => !p.life)).toBe(true);
});
it('pins head muscle innervation, including lower oblique and mimics omitted from short tables', () => {
  expect(MUSCLES.pieces.find((p) => p.key === 'eye12')!.fateText).toContain('beheko laprana');
  expect(MUSCLES.pieces.find((p) => p.key === 'arch2')!.fateText).toContain('mimikoak');
  expect(
    ['eye12', 'eye3', 'arch1', 'eye5', 'arch2', 'arch3', 'larynx', 'tongue'].map((k) => MUSCLE_FACTS[k].nerve.split(' · ')[0]),
  ).toEqual(['III', 'IV', 'V', 'VI', 'VII', 'IX', 'X', 'XII']);
});
