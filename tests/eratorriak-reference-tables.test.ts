import { describe, expect, it } from 'vitest';
import { REFERENCE_TABLES, type ReferenceRow } from '@/content/eratorriak/reference-tables';
import { w7 } from '@/content/notes-text/w7';
import { w8 } from '@/content/notes-text/w8';
import { w9 } from '@/content/notes-text/w9';
import { w10 } from '@/content/notes-text/w10';
import { w11 } from '@/content/notes-text/w11';
import { w12 } from '@/content/notes-text/w12';
import { w13 } from '@/content/notes-text/w13';
import { w14 } from '@/content/notes-text/w14';

const sentenceIds = new Set([w7, w8, w9, w10, w11, w12, w13, w14]
  .flatMap((blocks) => blocks.flatMap((block) => block.sentences.map((sentence) => sentence.id))));
const rowsOf = (topic: number) => REFERENCE_TABLES.filter((table) => table.topic === topic).flatMap((table) => table.rows);
const textOf = (row: ReferenceRow) => `${row.origin} ${row.derivative} ${row.note ?? ''}`;
const findRow = (topic: number, origin: RegExp) => {
  const row = rowsOf(topic).find((candidate) => origin.test(candidate.origin));
  expect(row, `Missing topic ${topic} relationship: ${origin}`).toBeDefined();
  return row!;
};

describe('Eratorriak · reference relationships', () => {
  it('covers every requested topic with unique, nonempty table and row identifiers', () => {
    expect([...new Set(REFERENCE_TABLES.map((table) => table.topic))].sort((a, b) => a - b)).toEqual([7, 8, 9, 10, 11, 12, 13, 14]);
    expect(new Set(REFERENCE_TABLES.map((table) => table.id)).size).toBe(REFERENCE_TABLES.length);
    for (const table of REFERENCE_TABLES) {
      for (const value of [table.id, table.title, table.originHeading, table.derivativeHeading]) expect(value.trim(), table.id).not.toBe('');
      expect(table.rows.length, table.id).toBeGreaterThan(0);
      expect(new Set(table.rows.map((row) => row.id)).size, table.id).toBe(table.rows.length);
      for (const row of table.rows) {
        for (const value of [row.id, row.origin, row.derivative]) expect(value.trim(), `${table.id}/${row.id}`).not.toBe('');
      }
    }
  });

  it('resolves every local sentence citation and requires an explicit source for every relationship', () => {
    for (const table of REFERENCE_TABLES) for (const row of table.rows) {
      expect(row.sources.length, `${table.id}/${row.id}`).toBeGreaterThan(0);
      for (const source of row.sources) {
        if (source.startsWith('https://')) {
          const url = new URL(source);
          expect(url.hostname, source).not.toBe('');
          expect(url.pathname, source).not.toBe('/');
        } else {
          expect(sentenceIds.has(source), `${table.id}/${row.id}: ${source}`).toBe(true);
        }
      }
    }
  });

  it('keeps assessment provenance out of the app-facing text', () => {
    const visibleText = REFERENCE_TABLES.map((table) => [
      table.title, table.originHeading, table.derivativeHeading, table.lead ?? '', ...table.rows.map(textOf),
    ].join(' ')).join(' ');
    expect(visibleText).not.toMatch(/azterketa|partzialetako|\bpartzialak\b|ez[ -/]ohiko/iu);
  });

  it('distinguishes the smooth ventricular outflows from the arterial trunks', () => {
    const conus = findRow(10, /^Arteria konoa$/i).derivative;
    expect(conus).toMatch(/bi bentrikuluen atal leun/i);
    expect(conus).toMatch(/eskuineko infundibulua/i);
    expect(conus).toMatch(/ezkerreko.*aortiko/i);
    const truncus = findRow(10, /^Enbor arteriosoa$/i).derivative;
    expect(truncus).toMatch(/goranzko aorta/i);
    expect(truncus).toMatch(/birika.enbor/i);
    expect(truncus).not.toMatch(/trabekulatu|infundibulu/i);
  });

  it('preserves the postnatal pressure directions and separates functional closure from fibrosis', () => {
    const pressure = rowsOf(13).find((row) => /presioa/.test(row.derivative));
    expect(pressure).toBeDefined();
    expect(pressure!.derivative).toMatch(/eskuineko.*presioa jaisten.*ezkerrekoa igotzen/i);
    expect(pressure!.derivative).toMatch(/funtzionalki ixten/i);
    const arterialDuct = rowsOf(13).find((row) => /^Hodi arteriosoa$/i.test(row.origin) && /lotailu arteriosoa/i.test(row.derivative));
    expect(arterialDuct).toBeDefined();
    expect(arterialDuct!.derivative).toMatch(/itxiera funtzionalaren ondoren.*fibrosi/i);
  });

  it('preserves the mixed duodenal origin and the ectodermal lower anal canal exception', () => {
    const duodenum = findRow(14, /^Duodenoa$/i).derivative;
    expect(duodenum).toMatch(/aurreko eta bitarteko heste/i);
    const lowerCanal = findRow(14, /proktodeoko ektodermo/i);
    expect(lowerCanal.derivative).toMatch(/uzki.hodiaren beheko atala/i);
    expect(lowerCanal.derivative).toMatch(/lerro pektinatuaren azpitik/i);
  });
});
