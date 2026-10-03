import type { CSSProperties, ReactNode } from 'react';
import { structures } from '@/content/registry';
import { firstSentence } from '@/content/generate';
import { categoryColor } from '@/lib/sim/palette';

/** One structure name the caption can link: its own matcher (the inflected Basque word) and colour. */
export interface Term {
  id: string;
  name: string;
  color: string;
  definition: string;
  re: RegExp;
}

const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A name as a pattern that also catches its Basque endings: the article (-a / -ak) comes off the last
 * word and any ending may follow ("Epiblastoa" → epiblasto-ko, epiblasto-tik). Short words must match
 * whole, so a three-letter stem never lights a longer, unrelated word.
 */
function patternOf(name: string): string | null {
  const words = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim().split(/[\s-]+/).filter(Boolean);
  if (!words.length) return null;
  const last = words[words.length - 1];
  const stem = last.replace(/(ak|a)$/i, '');
  const inflects = stem.length >= 5 && stem !== last;
  const head = words.slice(0, -1).map(escape);
  const tail = inflects ? `${escape(stem)}\\p{L}*` : `${escape(last)}(?!\\p{L})`;
  if (!inflects && words.length === 1 && last.length < 4) return null;
  // Words may be joined by a space or a hyphen ("kloaka mintza" / "kloaka-mintza").
  return [...head, tail].join('[\\s\\u00a0-]+');
}

/** The stage's structures as caption terms, longest names first (so "Ildo primitiboa" wins over "Ildoa"). */
export function termsOf(ids: readonly string[]): Term[] {
  const out: Term[] = [];
  for (const id of new Set(ids)) {
    const s = structures.get(id);
    if (!s) continue;
    for (const name of [s.name, ...(s.aka ?? [])]) {
      const p = patternOf(name);
      if (!p) continue;
      out.push({ id, name: s.name, color: s.color ?? categoryColor[s.category], definition: firstSentence(s.definition ?? ''), re: new RegExp(`(?<![\\p{L}\\p{N}])${p}`, 'iu') });
    }
  }
  return out.sort((a, b) => b.re.source.length - a.re.source.length);
}

export interface TermHandlers {
  onPick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

/**
 * The text with the first mention of each structure turned into a quiet link in the structure's colour:
 * hovering lights it in the scene, clicking opens its card. The wording itself is never changed.
 * `used` is shared by the parts of one caption, so a name is linked once per step.
 */
export function linkTerms(text: string, terms: readonly Term[], used: Set<string>, h: TermHandlers): ReactNode {
  if (!terms.length || !text) return text;
  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (;;) {
    let best: { term: Term; at: number; len: number } | null = null;
    for (const term of terms) {
      if (used.has(term.id)) continue;
      const m = term.re.exec(rest);
      if (m && (!best || m.index < best.at || (m.index === best.at && m[0].length > best.len))) best = { term, at: m.index, len: m[0].length };
    }
    if (!best) break;
    const { term, at, len } = best;
    used.add(term.id);
    if (at > 0) out.push(rest.slice(0, at));
    out.push(
      // A span, not a button: a button cannot break across lines inside a sentence.
      <span
        key={key++}
        role="button"
        tabIndex={0}
        className="term"
        style={{ '--tc': term.color } as CSSProperties}
        onClick={() => h.onPick(term.id)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          // The page's own Space (play / pause) must not fire as well.
          e.preventDefault();
          e.stopPropagation();
          h.onPick(term.id);
        }}
        onMouseEnter={() => h.onHover?.(term.id)}
        onMouseLeave={() => h.onHover?.(null)}
        onFocus={() => h.onHover?.(term.id)}
        onBlur={() => h.onHover?.(null)}
        title={`${term.name}${term.definition ? ` — ${term.definition}` : ''} · Klik: fitxa ireki`}
      >
        {rest.slice(at, at + len)}
      </span>,
    );
    rest = rest.slice(at + len);
  }
  if (rest) out.push(rest);
  return out.length === 1 ? out[0] : out;
}
