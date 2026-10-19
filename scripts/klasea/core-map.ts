/**
 * Prints a topic's core sentences (funtsezkoa) under the stage step that cites them, with the step's time,
 * focus and the sentence: the map a class is written from. Run: npx tsx scripts/klasea/core-map.ts 11
 */
import { expandNotes, sentence, sentenceText } from '@/content/notes-text';
import { getWeek } from '@/content/registry';
import { computeImportance } from '@/lib/klasea/importance';

const n = Number(process.argv[2] ?? 11);
const week = getWeek(n);
if (!week) throw new Error(`No topic ${n}`);
const imp = computeImportance(week);
const seen = new Set<string>();
for (const st of week.stages) {
  console.log(`\n=== ${st.id} [${st.structures.join(' ')}]`);
  st.beats.forEach((b, k) => {
    const ids = expandNotes(b.notes);
    console.log(`  -- #${k} at=${b.at.toFixed(3)} view=${b.view ?? ''} focus=${(b.focus ?? []).join(',')}${b.exam ? ` | F: ${b.exam}` : ''}`);
    for (const id of ids) {
      const v = imp.get(id);
      const mark = v?.tier === 'funtsezkoa' ? '**' : v ? ' .' : '  ';
      console.log(`   ${mark} ${id}${v?.rules.length ? ` (${v.rules.join(',')})` : ''}${seen.has(id) ? ' [again]' : ''}: ${sentenceText(sentence(id)!)}`);
      seen.add(id);
    }
  });
}
const missing = [...imp].filter(([id, v]) => v.tier === 'funtsezkoa' && !seen.has(id)).map(([id]) => id);
if (missing.length) console.log('\nCore but not cited by a step:', missing.join(' '));
