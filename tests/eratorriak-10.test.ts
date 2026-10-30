import { expect, it } from 'vitest';
import { HEART_TUBE } from '@/content/eratorriak/heart-tube';
import { CARDS10 } from '@/content/eratorriak/cards10';
import { heartTubeGeometry } from '@/components/shell/eratorriak/HeartTubeDiagram';
import { w10 } from '@/content/notes-text/w10';
import { roomContract } from './eratorriak-contract';
roomContract(HEART_TUBE, CARDS10, w10, heartTubeGeometry);
it('pins the two ventricular sources and two RA walls', () => {
  const keys = (f: string) =>
    HEART_TUBE.pieces
      .filter((p) => p.fate === f)
      .map((p) => p.key)
      .sort();
  expect(keys('rv')).toEqual(['conusR', 'proximal']);
  expect(keys('lv')).toEqual(['conusL', 'ventricle']);
  expect(keys('ra')).toEqual(['atriumR', 'sinusR']);
});
it('preserves both left sinus remnants and the two secundum contributions', () => {
  expect(HEART_TUBE.pieces.filter((p) => p.fate === 'septum').map((p) => p.key)).toEqual(['valveL', 'spurium']);
  expect(HEART_TUBE.pieces.find((p) => p.key === 'sinusCor')!.fate).toBe('coronary');
  expect(HEART_TUBE.pieces.find((p) => p.key === 'sinusOblique')!.fate).toBe('oblique');
});
