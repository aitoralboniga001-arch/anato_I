import type { Beat, WeekDef } from '@/lib/sim/types';
import { expandNotes, notesOf, sentenceText } from '@/content/notes-text';

/**
 * Which sentences of a topic's notes the class must teach (funtsezkoa), may say in passing
 * (garrantzitsua) or leaves to the full simulator (anything else). Decided by fixed rules over the notes
 * and the steps already curated from them, never by hand and never from past exams: the checked-in
 * table (content/klasea/importance/wN.ts) must equal what these rules compute (tests/klasea.test.ts).
 *
 *  R1 it is one of the (at most two) sentences a step cites that best carry that step's FUNTSEZKOA (`exam`);
 *  R2 the notes flag it, or the paragraph it is in, themselves ("Kontuan hartu", "KONTUZ", "garrantzi…");
 *  R3 a step's micro-question cites it and it carries the right answer;
 *  R4 it gives a cause and a step with a key or a FUNTSEZKOA cites it;
 *  R5 it says where a part lies (in a step with a KONTUZ or a view change) or which side the picture is seen from;
 *  R6 it opens a stage: the first sentence its first step cites (the stage's "why");
 *  R7 it heads an item of a bulleted list another item of which is core (lists are taught whole).
 */

export type Tier = 'funtsezkoa' | 'garrantzitsua';
export type Rule = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7';
export interface Importance { tier: Tier; rules: Rule[] }

const FLAG = /kontuan hartu|kontuz|garrantzi/i;
const HEAD_FLAG = /^\s*(kontuan hartu|kontuz)/i;
const CAUSE = /ondorioz|dela eta|\p{L}+[ae]?ngatik|\p{L}+gatik|horregatik|beraz|eragin/iu;
const PLACE = /perikardio[\s-]?barrunbe|barrunbe perikardiko|septum transversum|eskuin|eskum|ezker|aurre|atze|goi|behe/i;
const LIES = /kokatu|kokatzen|dago|daude|geratu|geratzen|mugitu|mugitzen|abiatu|abiatzen|jaitsi|jaisten/i;
const SIDE = /(aurretik|atzetik)\s+(ikus|begira)/i;
const NUMBER = /\d+/g;

/** Content-word stems (five letters, as the notes test does), for "does this sentence carry that answer". */
const stems = (text: string) =>
  new Set((text.toLowerCase().match(/\p{L}{5,}/gu) ?? []).map((w) => w.slice(0, 5)));

const numbers = (text: string) => new Set(text.match(NUMBER) ?? []);

/**
 * The prose sentences of a topic, in notes order (headings, contents and captions are not taught as such,
 * nor is a "sentence" with no word in it, such as a dashed rule between list items).
 */
export function proseOf(week: number): { id: string; text: string }[] {
  return notesOf(week)
    .filter((b) => b.kind === 'p' || b.kind === 'li')
    .flatMap((b) => b.sentences.map((s) => ({ id: s.id, text: sentenceText(s) })))
    .filter((s) => /\p{L}/u.test(s.text));
}

export function computeImportance(week: WeekDef): Map<string, Importance> {
  const prose = proseOf(week.week);
  const order = new Map(prose.map((s, i) => [s.id, i]));
  const textOf = new Map(prose.map((s) => [s.id, s.text]));

  const core = new Map<string, Set<Rule>>();
  const support = new Set<string>();
  const add = (id: string, rule: Rule) => {
    if (!textOf.has(id)) return;
    const set = core.get(id) ?? new Set<Rule>();
    set.add(rule);
    core.set(id, set);
  };

  /**
   * The fewest of a step's cited sentences that carry a fact: taken greedily, the one that adds the most
   * of the fact's words (and numbers) first, until most of the fact is carried or nothing adds two more.
   */
  const carriers = (fact: string, cited: string[]): string[] => {
    const want = new Set([...stems(fact), ...numbers(fact)]);
    const left = new Set(want);
    const picked: string[] = [];
    const pool = [...cited];
    while (left.size > want.size * 0.5 && pool.length && picked.length < 2) {
      let best = -1;
      let gain = 0;
      pool.forEach((id, i) => {
        const have = new Set([...stems(textOf.get(id)!), ...numbers(textOf.get(id)!)]);
        const g = [...left].filter((w) => have.has(w)).length;
        if (g > gain) [best, gain] = [i, g];
      });
      if (best < 0 || gain < 2) break;
      const [id] = pool.splice(best, 1);
      picked.push(id);
      const have = new Set([...stems(textOf.get(id)!), ...numbers(textOf.get(id)!)]);
      for (const w of [...left]) if (have.has(w)) left.delete(w);
    }
    return picked;
  };

  // R2: a flag flags its sentence; one that opens a paragraph ("Kontuan hartu:", "KONTUZ!") flags the paragraph.
  for (const b of notesOf(week.week)) {
    if (b.kind !== 'p' && b.kind !== 'li') continue;
    const texts = b.sentences.map(sentenceText);
    if (HEAD_FLAG.test(texts[0] ?? '')) for (const s of b.sentences) add(s.id, 'R2');
    else b.sentences.forEach((s, i) => FLAG.test(texts[i]) && add(s.id, 'R2'));
  }

  for (const s of prose) {
    if (SIDE.test(s.text)) add(s.id, 'R5');
  }

  for (const stage of week.stages) {
    stage.beats.forEach((beat: Beat, k) => {
      const cited = expandNotes(beat.notes).filter((id) => textOf.has(id));
      const viewChange = k > 0 && !!beat.view && beat.view !== stage.beats[k - 1].view;
      if (beat.exam) for (const id of carriers(beat.exam, cited)) add(id, 'R1');
      if (beat.ask) {
        const right = `${beat.ask.options[beat.ask.answer]}. ${beat.ask.why[beat.ask.answer] ?? ''}`;
        for (const id of carriers(right, cited).slice(0, 1)) add(id, 'R3');
      }
      for (const id of cited) {
        const text = textOf.get(id)!;
        if ((beat.key || beat.exam) && CAUSE.test(text)) add(id, 'R4');
        if ((beat.caution || viewChange) && PLACE.test(text) && LIES.test(text)) add(id, 'R5');
        if (beat.idea || beat.key) support.add(id);
      }
      if (k === 0 && cited.length) {
        const first = [...cited].sort((a, b) => order.get(a)! - order.get(b)!)[0];
        add(first, 'R6');
      }
    });
  }

  // R7: a list is taught whole. When one item of a run of bullet points is core, the heads of its siblings
  // are too (half of "the three veins" or "the three sub-parts" is a wrong picture, not a shorter one).
  let run: string[][] = [];
  const flush = () => {
    if (run.some((item) => item.some((id) => core.has(id)))) for (const item of run) add(item[0], 'R7');
    run = [];
  };
  let section = '';
  for (const b of notesOf(week.week)) {
    if (b.kind === 'li' && b.section === section) run.push(b.sentences.map((s) => s.id));
    else {
      flush();
      if (b.kind === 'li') run.push(b.sentences.map((s) => s.id));
    }
    section = b.section;
  }
  flush();

  const out = new Map<string, Importance>();
  for (const s of prose) {
    const rules = core.get(s.id);
    if (rules) out.set(s.id, { tier: 'funtsezkoa', rules: [...rules].sort() });
    else if (support.has(s.id)) out.set(s.id, { tier: 'garrantzitsua', rules: [] });
  }
  return out;
}
