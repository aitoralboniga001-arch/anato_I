import { expect, it } from 'vitest';
import { SEPTA } from '@/content/eratorriak/septa';
import { CARDS11 } from '@/content/eratorriak/cards11';
import { septaGeometry } from '@/components/shell/eratorriak/SeptaDiagram';
import { w11 } from '@/content/notes-text/w11';
import { roomContract } from './eratorriak-contract';
roomContract(SEPTA, CARDS11, w11, septaGeometry);
it('pins two origins for every chamber and two IV septal parts', () => {
  const keys = (f: string) =>
    SEPTA.pieces
      .filter((p) => p.fate === f)
      .map((p) => p.key)
      .sort();
  expect(keys('ra')).toEqual(['raSmooth', 'raTrab']);
  expect(keys('la')).toEqual(['laSmooth', 'laTrab']);
  expect(keys('rv')).toEqual(['rvSmooth', 'rvTrab']);
  expect(keys('lv')).toEqual(['lvSmooth', 'lvTrab']);
  expect(keys('iv')).toEqual(['ivMembrane', 'ivMuscle']);
});
it('keeps a continuous atrial route: ostium secundum precedes ostium primum closure', () => {
  const p = (key: string) => SEPTA.pieces.find((p) => p.key === key)!;
  expect(p('ostium2').life![2]).toBe(1);
  expect(p('ostium1').life![2]).toBe(1);
  expect(p('ostium1').life![4]).toBe(3);
  expect(p('foramen').life!.slice(4)).toEqual([1, 1, 2, 3]);
});
