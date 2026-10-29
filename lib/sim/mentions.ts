/**
 * The structures a step's text says by name: a structure of the stage counts when its name (or an aka)
 * starts a word in the text. Longest names win, so a name said only inside a longer one ("kloaka" in
 * "kloaka mintza") is not a mention of its own. Processes and body axes are never "drawn things".
 * The player names these on screen; tests/visibility.test.tsx checks the same list.
 */

interface Named {
  name: string;
  aka?: readonly string[];
  category: string;
}

/** Processes and body axes are named by the step, not drawn as a thing of their own. */
export const CONCEPT = new Set(['prozesua', 'ardatza']);

/** A structure's name as the text uses it (case and the final article aside). */
export const stem = (n: string) => n.toLowerCase().replace(/[()]/g, '').replace(/a$/, '');

export function mentionedIn(text: string, ids: readonly string[], get: (id: string) => Named | undefined): string[] {
  const said = text.toLowerCase();
  const spans = ids
    .flatMap((id) => {
      const s = get(id);
      // Processes take part (a longer process name hides the structure names inside it) but are not returned.
      if (!s) return [];
      // Names are plain words (letters, spaces, hyphens): safe to use as a pattern.
      return [s.name, ...(s.aka ?? [])]
        .map(stem)
        .filter((n) => n.length > 4)
        .flatMap((n) => [...said.matchAll(new RegExp('(?<!\\p{L})' + n, 'gu'))].map((m) => ({ id, a: m.index!, b: m.index! + n.length })));
    })
    .sort((p, q) => q.b - q.a - (p.b - p.a));
  const taken: { a: number; b: number }[] = [];
  const out: string[] = [];
  for (const sp of spans) {
    if (taken.some((q) => sp.a >= q.a && sp.b <= q.b)) continue;
    taken.push(sp);
    if (!out.includes(sp.id) && !CONCEPT.has(get(sp.id)!.category)) out.push(sp.id);
  }
  return out;
}
