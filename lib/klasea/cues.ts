import { spellNumbers, syllables } from './speak-eu';

/**
 * When in a spoken line each lit structure is named, so the class lights it, shows its name and Kimu
 * points at it as the voice says it (not all at once at the line's start). A line's place is measured in
 * syllables of what the voice says (numbers spelled out), the unit both the voice's word boundaries and
 * the reading-pace clock can be turned into. Pure: the tests pin every line's cues.
 */

export interface Cue {
  id: string;
  /** Where the name starts in the line's text; -1 when the line does not say it (its subject, lit from the start). */
  i: number;
  /** Where the name starts, as a fraction (0..1) of the syllables the voice says. */
  at: number;
}

/** The names a structure is said by (its name and other names). */
export type NamesOf = (id: string) => readonly string[];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A name as the text says it: lower case, without brackets, the final article dropped. */
const stem = (n: string) =>
  n
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[()]/g, '')
    .replace(/-/g, ' ')
    .replace(/a$/, '')
    .trim();

/**
 * Patterns for one name, strictest first: the name itself (any ending on its last word), then each word
 * by its stem with any ending (Basque declines every word of a name: "zilborreko zainek").
 */
function patterns(name: string): RegExp[] {
  const s = stem(name);
  if (s.length < 3) return [];
  const words = s.split(/\s+/).filter(Boolean);
  const out = [new RegExp(`(?<!\\p{L})${esc(s)}`, 'u')];
  const loose = words.map((w) => esc(w.length > 5 ? w.slice(0, -2) : w.length > 3 ? w.slice(0, -1) : w) + '\\p{L}*');
  out.push(new RegExp(`(?<!\\p{L})${loose.join('[\\s-]+')}`, 'u'));
  return out;
}

const memo = new Map<string, RegExp[]>();
const patternsOf = (name: string) => {
  let hit = memo.get(name);
  if (!hit) memo.set(name, (hit = patterns(name)));
  return hit;
};

/** Where the text first says a structure, by any of its names; -1 if it does not. */
export function namedAt(text: string, id: string, namesOf: NamesOf): number {
  const said = text.toLowerCase();
  const names = [...new Set([...namesOf(id), id.replace(/-/g, ' ')])];
  // Strict patterns of every name before any loose one: an exact name later in the line beats a loose
  // match of a shorter name earlier.
  for (const strict of [true, false]) {
    let best = -1;
    for (const n of names) {
      const ps = patternsOf(n);
      const p = strict ? ps[0] : ps[1];
      if (!p) continue;
      const m = p.exec(said);
      if (m && (best < 0 || m.index < best)) best = m.index;
    }
    if (best >= 0) return best;
  }
  return -1;
}

/** Syllables the voice says for a stretch of the text (numbers spelled out, as the voice gets them). */
const spoken = (text: string) => syllables(spellNumbers(text));

/** A word's stem (Basque declines it): the word less its last letters, never shorter than four. */
const wordStem = (w: string) => (w.length > 5 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w);

/** The words of a structure's names, by stem (words of five letters or more). */
const stemsOf = (id: string, namesOf: NamesOf) =>
  new Set([...namesOf(id), id.replace(/-/g, ' ')].flatMap((n) => stem(n).split(/\s+/)).filter((w) => w.length >= 5).map(wordStem));

/**
 * Where the text says one word that only this structure's names have among the structures the line
 * lights: a list says "zilborrekoak, bitelinoak eta kardinal komunak" for three veins, "eskumakoa" for
 * the right ventricle set against the left one. `shared`: any word of its names, also one it shares
 * ("zainek" for every vein the line lights).
 */
function wordAt(text: string, id: string, focus: readonly string[], namesOf: NamesOf, shared = false, taken: readonly number[] = []): number {
  const own = stemsOf(id, namesOf);
  const others = focus.filter((f) => f !== id).map((f) => stemsOf(f, namesOf));
  const said = text.toLowerCase();
  let best = -1;
  for (const s of own) {
    if (!shared && others.some((o) => [...o].some((x) => x.startsWith(s) || s.startsWith(x)))) continue;
    // A word already standing for another structure's name ("zain" in "zain sinuak") is not this one's.
    for (const m of said.matchAll(new RegExp(`(?<!\\p{L})${esc(s)}`, 'gu')))
      if (!taken.some((t) => Math.abs(t - m.index) < 3)) {
        if (best < 0 || m.index < best) best = m.index;
        break;
      }
  }
  return best;
}

/**
 * A line's cues, in the order they are said (the unsaid ones first, at 0). `given` names the words
 * where the automatic match would miss (a pronoun, a nickname): id → the words as the text says them.
 */
export function cuesOf(text: string, focus: readonly string[], namesOf?: NamesOf, given?: Readonly<Record<string, string>>): Cue[] {
  if (!focus.length) return [];
  const total = Math.max(1, spoken(text));
  const lower = text.toLowerCase();
  // Where another structure's own name is said: a shared word there is that name, not this one.
  const taken: number[] = [];
  const first = focus.map((id) => {
    const g = given?.[id];
    let i = g ? lower.indexOf(g.toLowerCase()) : -1;
    if (i < 0 && namesOf && (i = namedAt(text, id, namesOf)) >= 0) taken.push(i);
    if (i < 0 && namesOf) i = wordAt(text, id, focus, namesOf);
    return i;
  });
  return focus
    .map((id, k) => {
      const i = first[k] >= 0 || !namesOf ? first[k] : wordAt(text, id, focus, namesOf, true, taken);
      return { id, i, at: i > 0 ? Math.min(1, spoken(text.slice(0, i)) / total) : 0, k };
    })
    .sort((a, b) => a.at - b.at || a.k - b.k)
    .map(({ id, i, at }) => ({ id, i, at }));
}

/** How many cues the voice has reached at `progress` (0..1 of the line said). */
export const reached = (cues: readonly Cue[], progress: number) => cues.filter((c) => c.at <= progress + 1e-9).length;

/** How far through a line the voice is, from the character it has reached in what it was given to say. */
export const progressAt = (said: string, charIndex: number) => Math.min(1, syllables(said.slice(0, charIndex)) / Math.max(1, syllables(said)));
