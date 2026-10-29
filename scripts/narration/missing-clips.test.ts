import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { weeks } from '@/content/registry';
import { getNarrationSegments, type NarrationKind, type NarrationOptions } from '@/lib/sim/narration';
import manifest from '@/public/narration/manifest.json';

/**
 * Which narration segments have no recorded clip (their text changed since the recording); the app says
 * them with the browser voice until they are re-recorded. Lists only: never calls a speech provider.
 * Run: npx vitest run --config scripts/narration/vitest.config.ts missing-clips
 */
test('list narration segments without a recorded clip', () => {
  const entries = manifest.entries as Record<string, unknown>;
  const missing: { week: number; stage: string; kind: NarrationKind; segment: number; hash: string; text: string }[] = [];
  const perWeek = new Map<number, { missing: number; total: number }>();
  for (const week of weeks) for (const stage of week.stages) {
    const add = (kind: NarrationKind, options: NarrationOptions = {}) => {
      getNarrationSegments(week, stage, kind, options).forEach(({ text }, segment) => {
        const hash = createHash('sha256').update(text, 'utf8').digest('hex');
        const count = perWeek.get(week.week) ?? { missing: 0, total: 0 };
        count.total++;
        if (!entries[hash]) { count.missing++; missing.push({ week: week.week, stage: stage.id, kind, ...options, segment, hash, text }); }
        perWeek.set(week.week, count);
      });
    };
    add('intro');
    stage.beats.forEach((_, beat) => add('beat', { beat }));
    stage.structures.forEach((structure) => add('structure', { structure }));
    stage.views.forEach(({ id: view }) => add('bridge', { view }));
  }
  expect(perWeek.size).toBeGreaterThanOrEqual(10);
  const output = resolve(process.env.NARRATION_MISSING_PATH ?? '.narration-tools/missing.json');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ version: 1, distinct: new Set(missing.map((m) => m.hash)).size, missing }, null, 2) + '\n');
  const rows = [...perWeek].map(([week, c]) => `  week ${String(week).padStart(2)}: ${String(c.missing).padStart(4)} / ${c.total}`);
  process.stdout.write(`Segments without a recorded clip: ${missing.length} (${new Set(missing.map((m) => m.hash)).size} distinct texts) → ${output}\n${rows.join('\n')}\n`);
});
