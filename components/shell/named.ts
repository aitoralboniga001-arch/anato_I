import type { Beat, StageDef } from '@/lib/sim/types';
import { firstSeenOf } from '@/content/chronology';
import { getWeek } from '@/content/registry';
import { termsOf, type Term } from './terms';

/**
 * Progressive names: a structure's name appears in the picture once the study has named it — focused,
 * toured, recalled or said in a step up to the current one — or when it was formed in an earlier stage
 * (it is known). Unnamed ones still show their name on hover, every name shows at the stage's last step,
 * and the viewer can ask for all of them ("Izen guztiak"). No name is ever removed: a step only adds.
 */

/** Every text of a step a student reads (the caption, its keys and its warnings). */
const textsOf = (b: Beat) => [b.idea, b.text, b.key, b.exam, b.caution].filter((x): x is string => !!x);

/** The structures a text names, by the caption's own matcher (inflected Basque names and aliases). */
export const mentionedIn = (text: string, terms: readonly Term[]) => terms.filter((t) => t.re.test(text)).map((t) => t.id);

const cache = new Map<string, Set<string>[]>();

/** The names each step of a stage has said so far (cumulative; index = step). */
export function namedSteps(week: number, stage: StageDef): Set<string>[] {
  const key = `${week}/${stage.id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const ids = [...stage.structures, ...stage.beats.flatMap((b) => [...(b.focus ?? []), ...(b.tour ?? []), ...(b.recall ?? [])])];
  const terms = termsOf(ids);
  const out: Set<string>[] = [];
  let acc = new Set<string>();
  for (const b of stage.beats) {
    acc = new Set(acc);
    for (const id of [...(b.focus ?? []), ...(b.tour ?? []), ...(b.recall ?? [])]) acc.add(id);
    for (const text of textsOf(b)) for (const id of mentionedIn(text, terms)) acc.add(id);
    out.push(acc);
  }
  cache.set(key, out);
  return out;
}

/** Was the structure formed (or listed) in a stage the study has already passed: an earlier topic, or earlier in this one? */
export function knownBefore(id: string, week: number, stage: StageDef): boolean {
  const f = firstSeenOf(id);
  if (!f) return false;
  if (f.week !== week) return f.week < week;
  const stages = getWeek(week)?.stages ?? [];
  const here = stages.findIndex((s) => s.id === stage.id);
  const there = stages.findIndex((s) => s.id === f.stage);
  return there >= 0 && here >= 0 && there < here;
}

/** The test the picture's names use at step k: null = every name (the last step, or "Izen guztiak"). */
export function namedAt(week: number, stage: StageDef, k: number): ((id: string) => boolean) | null {
  if (k >= stage.beats.length - 1) return null;
  const said = namedSteps(week, stage)[Math.max(0, k)];
  return (id) => said.has(id) || knownBefore(id, week, stage);
}
