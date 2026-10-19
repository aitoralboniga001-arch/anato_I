import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// "Clearly seen" (owner, 2026-10-19, topic 7 canals): a lit structure glows by its own shape. A `Mark` (a pool
// of light) is only for things with no outline (a process, a direction): an id the same scene also draws as
// a `Part` must light that shape, not a pool over it.
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : []));

describe('clear structures (topics 7–9)', () => {
  it('lights shaped structures by their shape, never by a Mark pool', () => {
    const both: string[] = [];
    for (const week of ['week7', 'week8', 'week9'])
      for (const f of files(join('components', 'scenes', week))) {
        const src = readFileSync(f, 'utf8');
        const marks = new Set([...src.matchAll(/<Mark\s+id="([^"]+)"/g)].map((m) => m[1]));
        const parts = new Set([...src.matchAll(/<Part\s+id="([^"]+)"/g)].map((m) => m[1]));
        for (const id of marks) if (parts.has(id)) both.push(`${f}: ${id}`);
      }
    expect(both).toEqual([]);
  });

  it('keeps the pericardioperitoneal canals two passages, named only on their own shapes', () => {
    const src = readFileSync(join('components', 'scenes', 'week7', 'Diaphragm.tsx'), 'utf8');
    // The open cavity behind the septum is not the canals.
    expect(src).not.toMatch(/<Part id="erreten-perikardioperitonealak">\s*<path d=\{poly\(CAV_X\)\}/);
    expect(src).not.toMatch(/<Mark id="erreten-perikardioperitonealak"/);
  });
});
