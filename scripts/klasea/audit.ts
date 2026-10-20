/**
 * Writes docs/klasea/wN-audit.md: every line of a topic's class beside the notes sentences it rests on,
 * every board item with its sources, and the coverage numbers. Evidence for "where does this come
 * from?", not a review step (the guards in tests/klasea.test.ts are what keep it right).
 *
 *   npx tsx scripts/klasea/audit.ts 10
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { sentence, sentenceText } from '@/content/notes-text';
import { lessonOf } from '@/content/klasea';
import { IMPORTANCE_W7 } from '@/content/klasea/importance/w7';
import { IMPORTANCE_W9 } from '@/content/klasea/importance/w9';
import { IMPORTANCE_W10 } from '@/content/klasea/importance/w10';
import { IMPORTANCE_W11 } from '@/content/klasea/importance/w11';
import { speakSeconds } from '@/lib/klasea/voice';

const week = Number(process.argv[2] ?? 10);
const lesson = lessonOf(week);
if (!lesson) throw new Error(`No class for topic ${week}`);
const importance = { 7: IMPORTANCE_W7, 9: IMPORTANCE_W9, 10: IMPORTANCE_W10, 11: IMPORTANCE_W11 }[week] ?? {};

const tier = (id: string) => (importance[id]?.tier === 'funtsezkoa' ? '**F**' : importance[id] ? 'g' : '·');
const cite = (ids: string[]) => ids.map((id) => `  - ${tier(id)} \`${id}\` ${sentence(id) ? sentenceText(sentence(id)!).trim() : '(ez dago)'}`).join('\n');

const out: string[] = [`# ${week}. gaiko klasea: iturriak`, '', '_Sortua: `npx tsx scripts/klasea/audit.ts ' + week + '`. F = funtsezkoa, g = garrantzitsua._', ''];

let total = 0;
for (const [ci, c] of lesson.chunks.entries()) {
  const secs = c.lines.reduce((s, l) => s + speakSeconds(l.say) + (l.hold ?? 0), 0);
  total += secs;
  out.push(`## ${ci}. ${c.title}`, '', `Etapa: \`${c.stage}\` · ${c.lines.length} lerro · ~${Math.round(secs)} s hitz eginda`, '');
  for (const [li, l] of c.lines.entries()) {
    const meta = [l.stage && `etapa ${l.stage}`, l.at !== undefined && `t=${l.at}`, l.tone && l.tone !== 'explain' && l.tone, l.focus?.length && `argi: ${l.focus.join(', ')}`, l.writes && `arbelean: ${l.writes}`].filter(Boolean).join(' · ');
    out.push(`${li + 1}. «${l.say}»`, `  _${meta}_`);
    if (l.plain) out.push(`  - Ez dut ulertu: «${l.plain}»`);
    out.push(cite(l.notes), '');
  }
  for (const b of c.board ?? []) {
    if (b.kind === 'line') out.push(`- Arbela \`${b.id}\`: ${b.text}`, cite(b.notes));
    else for (const r of b.rows) out.push(`- Taula \`${r.id}\`: ${r.cells.join(' → ')}`, cite(r.notes));
  }
  for (const k of c.checks ?? []) out.push(`- Galdera (${k.kind})${'q' in k ? `: ${k.q}` : 'id' in k ? `: ${k.id}` : ''}`);
  out.push('');
}

const cited = new Set(lesson.chunks.flatMap((c) => c.lines.flatMap((l) => l.notes)));
const core = Object.entries(importance).filter(([, v]) => v.tier === 'funtsezkoa').map(([id]) => id);
out.push(
  '## Estaldura',
  '',
  `- Funtsezko esaldiak: ${core.length} / ${Object.keys(importance).length}; klaseak esaten ditu: ${core.filter((id) => cited.has(id)).length}.`,
  `- Klaseak aipatzen dituen esaldi guztiak: ${cited.size}.`,
  `- Hitz egiteko denbora: ~${Math.round(total / 60)} min (galderak aparte).`,
  '',
);

mkdirSync('docs/klasea', { recursive: true });
writeFileSync(`docs/klasea/w${week}-audit.md`, out.join('\n'));
console.log(`docs/klasea/w${week}-audit.md`);
