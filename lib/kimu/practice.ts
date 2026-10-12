/**
 * "Galdetu niri": a short round of practice inside the conversation. Kimu never writes a question of its
 * own: every item comes from the atlas's reviewed pool (content/pool.ts, which takes the generated
 * questions from content/generate.ts after its hand review), and every answer is recorded through the
 * same answer history as the Galderak panel, so the spaced review there counts it.
 */

import { POOL, type PoolQuestion } from '@/content/pool';
import { isDue, isMastered, type Answers } from '@/components/shell/answers';
import type { KimuHere, KimuPractice } from './types';

/** "Galdetu niri", "pregúntame", "quiz me"…: the student wants to practise, not to read. */
const WANTS = /(galdetu niri|galde(?:ra|tu) (?:batzuk|bat)? ?egin|egidazu galdera|proba(?:tu)? nazazu|neure burua proba|errepas|pract?i(?:ca|ce|katu)|preg[uú]nta?me|hazme (?:unas )?preguntas|ponme a prueba|repaso|quiz me|test me|ask me)/i;
export const wantsPractice = (question: string) => WANTS.test(question);

const usable = (q: PoolQuestion) => q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length && q.question.trim().length > 4;

/** The questions a round may use, nearest to what the student is studying first. */
export function practiceScope(here: KimuHere | null, concept?: string | null, conceptWeek?: number): PoolQuestion[][] {
  const pool = POOL.filter(usable);
  const tiers: PoolQuestion[][] = [];
  if (concept) {
    tiers.push(pool.filter((q) => q.concept === concept));
    // Then what the notes explain around it: the same stage, then the same topic.
    const home = pool.find((q) => q.concept === concept && q.stageId);
    if (home) tiers.push(pool.filter((q) => q.week === home.week && q.stageId === home.stageId));
    if (conceptWeek) tiers.push(pool.filter((q) => q.week === conceptWeek));
    return tiers;
  }
  if (here) {
    if (here.structure && here.structure !== concept) tiers.push(pool.filter((q) => q.concept === here.structure));
    tiers.push(pool.filter((q) => q.week === here.week && q.stageId === here.stage));
    tiers.push(pool.filter((q) => q.week === here.week));
  }
  tiers.push(pool);
  return tiers;
}

/**
 * Three questions: within the nearest scope that has enough, the ones due for review first, then the
 * ones never tried, then the rest (never one already mastered while others remain).
 */
export function pickPractice(here: KimuHere | null, answers: Answers, concept?: string | null, conceptWeek?: number, n = 3, now = Date.now(), rand = Math.random): KimuPractice[] {
  const out: PoolQuestion[] = [];
  const taken = new Set<string>();
  for (const tier of practiceScope(here, concept, conceptWeek)) {
    const rank = (q: PoolQuestion) => (isDue(answers[q.id], now) ? 0 : !answers[q.id] ? 1 : isMastered(answers[q.id]) ? 3 : 2);
    const sorted = tier
      .filter((q) => !taken.has(q.id))
      .map((q) => ({ q, r: rank(q), k: rand() }))
      .sort((a, b) => a.r - b.r || a.k - b.k)
      .map((x) => x.q);
    for (const q of sorted) {
      if (out.length >= n) break;
      out.push(q);
      taken.add(q.id);
    }
    if (out.length >= n) break;
  }
  return out.map((q) => ({ id: q.id, question: q.question, options: q.options, answer: q.answer, explanation: q.explanation, why: q.why, concept: q.concept, week: q.week, stageId: q.stageId }));
}
