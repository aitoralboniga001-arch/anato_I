import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { weeks } from '@/content/registry';
import { getNarrationSegments, type NarrationKind, type NarrationOptions } from '@/lib/sim/narration';

/** Run: npx vitest run --config scripts/narration/vitest.config.ts */
test('export exact canonical narration for offline synthesis', () => {
  const entries = new Map<string, { hash: string; text: string; refs: object[] }>();
  let referenceCount = 0;
  for (const week of weeks) for (const stage of week.stages) {
    const add = (kind: NarrationKind, options: NarrationOptions = {}) => {
      getNarrationSegments(week, stage, kind, options).forEach(({ text }, segment) => {
        const hash = createHash('sha256').update(text, 'utf8').digest('hex');
        const entry = entries.get(hash) ?? { hash, text, refs: [] };
        entry.refs.push({ week: week.week, stage: stage.id, kind, ...options, segment });
        entries.set(hash, entry);
        referenceCount++;
      });
    };
    add('intro');
    stage.beats.forEach((_, beat) => add('beat', { beat }));
    stage.structures.forEach((structure) => add('structure', { structure }));
    stage.views.forEach(({ id: view }) => add('bridge', { view }));
  }
  expect(weeks).toHaveLength(8);
  expect(entries.size).toBeGreaterThan(1000);
  const output = resolve(process.env.NARRATION_CATALOG_PATH ?? '.narration-tools/catalog.json');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ version: 1, referenceCount, entries: [...entries.values()] }, null, 2) + '\n');
  console.log(`Exported ${referenceCount} references / ${entries.size} exact text fragments to ${output}`);
});
