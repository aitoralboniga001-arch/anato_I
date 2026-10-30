import { expect, it } from 'vitest';
import { CAVITIES } from '@/content/eratorriak/cavities';
import { CARDS7 } from '@/content/eratorriak/cards7';
import { w7 } from '@/content/notes-text/w7';
import { cavityGeometry } from '@/components/shell/eratorriak/CavityDiagram';
import { roomContract } from './eratorriak-contract';
import { MIGRATIONS } from '@/content/migrations';
roomContract(CAVITIES, CARDS7, w7, cavityGeometry);
it('keeps four diaphragm origins, bilateral closure and four final spaces', () => {
  const diaphragm = CAVITIES.pieces.filter((p) => p.fate === 'diaphragm');
  expect([...new Set(diaphragm.map((p) => p.origin))].sort()).toEqual(['eso', 'po', 'st', 'wall']);
  expect(diaphragm.map((p) => p.key).sort()).toEqual(['esophageal', 'peripheral', 'poL', 'poR', 'septum']);
  expect(CAVITIES.pieces.filter((p) => ['peri', 'pleura', 'perito'].includes(p.fate)).length).toBe(4);
  expect(CAVITIES.pieces.find((p) => p.key === 'canalL')!.life).toEqual([0, 1, 1, 2, 3, 3]);
});
it('keeps the revised prose dates in existing migration flows too', () => {
  const flows = MIGRATIONS.find((t) => t.week === 7)!.flows;
  expect(JSON.stringify(flows.find((f) => f.id === 'septum-jaitsi'))).toContain('T7 aurrean');
  expect(JSON.stringify(flows.find((f) => f.id === 'zeloma-banatu'))).toContain('7. astea');
});
