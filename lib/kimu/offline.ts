import { firstSentence } from '@/content/generate';
import { ancestry, childrenOf } from '@/content/lineage';
import { structures, weeks } from '@/content/registry';
import type { StructureDef } from '@/lib/sim/types';
import { anchorOf, fairHit, headingOf, itemHead, joinBest, quoteOf, refOf, strongHit, type Intent, type NotesHit } from './notes';
import { CONFIDENT, SAMPLE_TOPICS, toTarget, type Hit } from './search';
import { fold, keyWord, match, queryTokens, tokens, type Lang } from './text';
import type { KimuReply, KimuSource, KimuTarget } from './types';

/**
 * Kimu's answer built from the notes alone: what most students get (no key, limit reached, no
 * connection), so it has to stand on its own. The body is the notes' own sentences, verbatim, with the
 * section they come from; the atlas card fills in only when the notes do not name the thing asked about.
 */
const COPY: Record<Lang, {
  lead: string;
  weak: (ref: string) => string;
  none: string;
  hello: string;
  ask: (name: string, many?: boolean) => string;
  from: (name: string, many?: boolean) => string;
  to: (name: string, many?: boolean) => string;
  practice: (name: string) => string;
}> = {
  eu: {
    lead: '',
    weak: (ref) => `Apunteek ez dute hori zuzenean esaten. Hurbilen dagoena: ${ref}.`,
    none: 'Apunteek ez dute horri buruz ezer esaten. Galdetu egitura edo prozesu bati buruz, adibidez:',
    hello: 'Kaixo, Kimu naiz. Galdetu apunteei buruz: zer den egitura bat, noiz sortzen den, nondik datorren edo zertan bihurtzen den. Apunteetatik erantzungo dizut, eta simulagailuan non ikusten den erakutsiko dizut.',
    ask: (n, many) => `Noiz sortzen ${many ? 'dira' : 'da'} ${n}?`,
    from: (n, many) => `Nondik ${many ? 'datoz' : 'dator'} ${n}?`,
    to: (n, many) => `Zertan bihurtzen ${many ? 'dira' : 'da'} ${n}?`,
    practice: (n) => `Galdetu niri: ${n}`,
  },
  es: {
    lead: 'En los apuntes (en euskera):',
    weak: (ref) => `Los apuntes no lo dicen directamente. Lo más cercano: ${ref}.`,
    none: 'Los apuntes no dicen nada sobre eso. Pregúntame por una estructura o un proceso, por ejemplo:',
    hello: 'Hola, soy Kimu. Pregúntame por los apuntes: qué es una estructura, cuándo se forma, de dónde viene o en qué se convierte. Te contesto con los apuntes y te enseño dónde se ve en el simulador.',
    ask: (n, many) => `¿Cuándo se ${many ? 'forman' : 'forma'} ${n}?`,
    from: (n, many) => `¿De dónde ${many ? 'vienen' : 'viene'} ${n}?`,
    to: (n, many) => `¿Qué ${many ? 'originan' : 'origina'} ${n}?`,
    practice: (n) => `Pregúntame: ${n}`,
  },
  en: {
    lead: 'From the notes (in Basque):',
    weak: (ref) => `The notes do not say that directly. The closest section: ${ref}.`,
    none: 'The notes say nothing about that. Ask me about a structure or a process, for example:',
    hello: "Hi, I'm Kimu. Ask me about the notes: what a structure is, when it forms, where it comes from or what it becomes. I answer from the notes and show you where the simulator explains it.",
    ask: (n, many) => `When ${many ? 'do' : 'does'} ${n} form?`,
    from: (n, many) => `Where ${many ? 'do' : 'does'} ${n} come from?`,
    to: (n, many) => `What ${many ? 'do' : 'does'} ${n} become?`,
    practice: (n) => `Quiz me: ${n}`,
  },
};

/** A name inside a sentence: "Notokorda" → "notokorda", but "Septum Transversuma" and "Heuser mintza" keep theirs. */
const inline = (n: string) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ-]+$/.test(n.split(' ')[0]) && !/[A-ZÑ]/.test(n.slice(1)) && !/^(Heuser|Reichert|Schwann|Meckel)/.test(n) ? n.charAt(0).toLowerCase() + n.slice(1) : n);
/** Spanish names take an article ("el tubo neural", "la notocorda", "los somitas"). */
const withArticle = (n: string) => {
  const w = n.split(' ')[0];
  return `${/as$/.test(w) ? 'las' : /[oe]s$/.test(w) ? 'los' : /a$/.test(w) ? 'la' : 'el'} ${n}`;
};
const displayName = (s: StructureDef, lang: Lang) => (lang === 'es' && s.es ? withArticle(s.es.toLowerCase()) : inline(s.name));
const plural = (s: StructureDef) => /(ak|ek)$/.test(s.name.split(' ').pop() ?? '');

/** Tappable examples using real structures (Spanish names for Spanish, Basque otherwise). */
export function sampleQuestions(lang: Lang, n = 3): string[] {
  return SAMPLE_TOPICS.slice(0, n).map((id) => {
    const s = structures.get(id);
    return COPY[lang].ask(s ? displayName(s, lang) : id, !!s && plural(s));
  });
}

const GREETING = /^\s*(hola|buenas|buenos d[ií]as|kaixo|egun on|arratsalde on|gabon|hi|hello|hey|ey|aupa)\b/i;
export const isGreeting = (q: string) => GREETING.test(q) && q.split(/\s+/).length <= 4;

/** The word stem of a name, to find it in a sentence whatever its Basque case ending. */
const stemOf = (name: string) => {
  const f = fold(name.split(/\s+/)[0]);
  return f.length > 6 ? f.slice(0, Math.max(5, f.length - 2)) : f;
};

/** No other content word than the structure's name (and the question words). */
function aboutItself(question: string, s: StructureDef): boolean {
  const names = [s.name, s.es ?? '', ...(s.aka ?? [])].flatMap(tokens);
  return queryTokens(question, true).every((alts) => alts.some((a) => names.some((n) => match(a, n, true) >= 0.6)) || /^(sort|agert|era|form|apar|surg|appear)/.test(alts[0]));
}

/** Does this passage talk about the structure? */
export function mentions(h: NotesHit, s: StructureDef): boolean {
  const stems = [s.name, s.es ?? '', ...(s.aka ?? [])].filter(Boolean).map(stemOf);
  const words = h.passage.sentences.flatMap((x) => x.tok);
  return stems.some((st) => words.some((w) => (st.length >= 6 ? w.includes(st) : w.startsWith(st))));
}

/** Bold the first appearance of the structure's name in a verbatim sentence. */
export function boldName(text: string, s: StructureDef | undefined): string {
  if (!s) return text;
  const stem = stemOf(s.name);
  const re = /[A-Za-zÀ-ÿñÑ][\wÀ-ÿñÑ-]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (fold(m[0]).startsWith(stem)) {
      // Take the following word too when the name has two ("septum transversuma", "hodi neurala").
      const two = s.name.includes(' ') ? /^\s+[\wÀ-ÿñÑ-]+/.exec(text.slice(m.index + m[0].length))?.[0] ?? '' : '';
      const end = m.index + m[0].length + two.length;
      return `${text.slice(0, m.index)}**${text.slice(m.index, end)}**${text.slice(end)}`;
    }
  }
  return text;
}

/** A list passage answered as a list (all its items). */
const isList = (h: NotesHit) => h.passage.kind === 'li' && !!h.passage.items?.length && h.best.length === h.passage.sentences.length;
/** What introduces a list: its lead-in sentence, or the section heading. */
const listLead = (h: NotesHit) => (h.passage.leadCount ? h.passage.sentences[h.passage.leadCount - 1].text : headingOf(h.passage));
/** A sentence that says what something is ("… da", "… deitzen da", "… izenarekin"). */
const DEFINES = /^[\wñ-]*\s*(?:\([^)]*\)\s*)?(?:[\wñ-]+\s+){0,3}(?:da|dira|deritzo|deritze|deitzen|izenarekin|esaten zaio|izena du)\b/;
/** The sentence says what the structure is: its name, then within a few words "da", "deitzen", "izenarekin"… */
function defines(text: string, s: StructureDef): boolean {
  const low = text.toLowerCase();
  const key = keyWord(s.name);
  const stem = key.length > 6 ? key.slice(0, Math.max(5, key.length - 2)) : key;
  const re = /[a-zà-ÿñ][\wà-ÿñ-]*/g;
  // "… badago hodi bat …: hodi neuroenterikoa." names it after a colon; otherwise the name comes first.
  for (let m = re.exec(low); m; m = re.exec(low)) if (fold(m[0]).startsWith(stem) && (DEFINES.test(low.slice(m.index)) || /:\s*(?:[\wà-ÿñ-]+\s+)?$/.test(low.slice(0, m.index)))) return true;
  return false;
}

/** The notes sentences that answer, as the reply body. */
function notesBody(h: NotesHit, intent: Intent, s: StructureDef | undefined): string {
  const p = h.passage;
  if (isList(h)) {
    const items = p.items!.map(itemHead);
    // The list's own lead-in (its last sentence, the one that ends in a colon), or the section heading.
    const intro = p.leadCount ? p.sentences[p.leadCount - 1].text : '';
    const lead = intro ? boldName(intro.replace(/:\s*$/, ''), s) : `**${headingOf(p)}**`;
    return `${lead}: ${items.join('; ')}.`;
  }
  return boldName(joinBest(h), s);
}

/** The step where a passage is shown, with the notes open at it. */
export function notesTarget(h: NotesHit): KimuTarget | undefined {
  const a = anchorOf(h);
  if (!a) return undefined;
  const week = weeks.find((w) => w.week === a.week);
  const stage = week?.stages.find((x) => x.id === a.stageId);
  const beat = stage?.beats[a.beat];
  if (!week || !stage || !beat) return undefined;
  return {
    id: `n:${h.passage.id}`,
    kind: 'beat',
    week: a.week,
    stage: a.stageId,
    at: beat.at,
    notes: true,
    sentence: a.sentence,
    action: 'explanation',
    label: stage.title,
    where: `${a.week}. gaia · ${stage.day}`,
  };
}

export function sourceOf(h: NotesHit, withQuote: boolean): KimuSource {
  const p = h.passage;
  return { week: p.week, section: p.section, title: p.title, ref: refOf(p), quote: withQuote ? quoteOf(h, 260) : '', open: notesTarget(h) };
}

export function lineageOf(s: StructureDef | undefined, intent: Intent): KimuReply['lineage'] {
  if (!s) return undefined;
  if (intent === 'nondik') {
    const chain = ancestry(s.id).map((c) => structures.get(c.id)?.name ?? c.id);
    return chain.length > 1 ? { kind: 'from', names: chain.slice(-5) } : undefined;
  }
  if (intent === 'patua') {
    const kids = childrenOf(s.id).map((id) => structures.get(id)?.name ?? id);
    return kids.length ? { kind: 'to', names: kids.slice(0, 6) } : undefined;
  }
  return undefined;
}

/** What to ask next, to go one step further on the same thing (only what the atlas can answer). */
export function followupsFor(lang: Lang, s: StructureDef | undefined, intent: Intent): string[] {
  if (!s) return [];
  const c = COPY[lang];
  const name = displayName(s, lang);
  const out: string[] = [];
  const many = plural(s);
  if (intent !== 'nondik' && (s.origin || ancestry(s.id).length > 1)) out.push(c.from(name, many));
  if (intent !== 'patua' && (s.fate || childrenOf(s.id).length)) out.push(c.to(name, many));
  out.push(c.practice(lang === 'es' && s.es ? s.es.toLowerCase() : inline(s.name)));
  return out.slice(0, 3);
}

export interface Evidence {
  question: string;
  lang: Lang;
  intent: Intent;
  /** The structure the question is about, when it names one. */
  structure?: StructureDef;
  notes: NotesHit[];
  places: Hit[];
}

/** The simulator destinations for an answer: the place of the thing asked about, then the notes' step. */
export function targetsOf(ev: Evidence): KimuTarget[] {
  const place = ev.places[0] && ev.places[0].score >= CONFIDENT ? toTarget(ev.places[0], 'c1') : undefined;
  const n = strongHit(ev.notes[0]) ? notesTarget(ev.notes[0]) : undefined;
  // The thing asked about first when the question names it; otherwise the step of the passage quoted.
  const order = ev.structure || place?.formation ? [place, n] : [n, place];
  const out: KimuTarget[] = [];
  for (const t of order) if (t && !out.some((o) => o.week === t.week && o.stage === t.stage)) out.push(t);
  return out.slice(0, 2);
}

export function offlineReply(ev: Evidence): KimuReply {
  const c = COPY[ev.lang];
  const { structure: s, intent } = ev;
  // "What is it / how does it form": the passage whose chosen sentence introduces the structure
  // ("… hodi neural izenarekin") answers better than one that only mentions it.
  const intro = s && (intent === 'zer' || intent === 'nola') ? ev.notes.find((h, i) => i > 0 && fairHit(h) && h.score >= ev.notes[0].score * 0.7 && !isList(h) && h.best.some((x) => defines(x.text, s))) : undefined;
  const best = intro && !ev.notes[0].best.some((x) => defines(x.text, s!)) ? intro : ev.notes[0];
  const place = ev.places[0];
  const lead = c.lead ? `${c.lead} ` : '';

  if (!best && !place && isGreeting(ev.question)) return { reply: c.hello, targets: [], sources: [], followups: sampleQuestions(ev.lang), mood: 'happy', source: 'offline' };

  const strong = strongHit(best);
  const onTopic = strong && (!s || mentions(best, s));
  // A date from the atlas timeline only when the question is about the structure itself ("Noiz sortzen da X?"),
  // not about something that happens to it ("Noiz habiratzen da blastozistoa?").
  const when = s && place?.doc.structure === s.id && aboutItself(ev.question, s) ? place.doc.where.replace(/^\d+\. gaia · /, '') : '';
  const card = s && ((intent === 'nondik' && s.origin) || (intent === 'patua' && s.fate) || (intent === 'zer' && s.definition) || (intent === 'noiz' && when));
  const atlasWhen = { eu: 'Atlaseko kronologian', es: 'En la cronología del atlas', en: 'In the atlas timeline' }[ev.lang];

  let reply: string;
  let sources: KimuSource[];
  let unsure = false;
  // The atlas card answers "what is it / where from / what does it become" unless the notes say it as
  // directly: a list introduced by the thing itself ("gandor neuralaren eratorriak hauek dira:"), or, for
  // "what is it", a sentence that defines it.
  const list = !!best && isList(best);
  const listAbout = list && !!s && fold(listLead(best)).includes(stemOf(s.name));
  const said = !!best && !!s && !list && best.best.some((x) => defines(x.text, s));
  const cardFirst = !!card && ((intent === 'nondik' || intent === 'patua') ? !listAbout : intent === 'zer' ? !said : false);
  if (onTopic && !cardFirst) {
    // The notes' own words are the answer.
    const body = notesBody(best, intent, s);
    reply = `${lead}${body}`;
    // "When?" answered by a sentence without a date: the atlas's timeline adds it.
    if (intent === 'noiz' && when && !/\d/.test(body)) reply += ` (${atlasWhen}: ${when}.)`;
    sources = [sourceOf(best, false)];
  } else if (s && card) {
    // The atlas card (worded from the notes), with the closest notes passage quoted under it.
    const text = intent === 'nondik' ? s.origin! : intent === 'patua' ? s.fate! : intent === 'noiz' ? `${when} (${atlasWhen.toLowerCase()}).` : firstSentence(s.definition);
    reply = `**${s.name}**: ${text.replace(/^\s+/, '')}`;
    sources = ev.notes.filter((h) => fairHit(h) && mentions(h, s) && !isList(h)).slice(0, 1).map((h) => sourceOf(h, true));
  } else if (fairHit(best)) {
    reply = c.weak(refOf(best.passage));
    unsure = true;
    sources = [sourceOf(best, true)];
  } else if (place && place.score >= CONFIDENT) {
    const st = place.doc.structure ? structures.get(place.doc.structure) : undefined;
    reply = st ? `**${st.name}**: ${firstSentence(st.definition)}` : place.doc.blurb;
    sources = [];
  } else {
    return { reply: c.none, targets: [], sources: [], followups: sampleQuestions(ev.lang), mood: 'curious', source: 'offline' };
  }
  return {
    reply: reply.replace(/\s+/g, ' ').trim(),
    targets: unsure ? [] : targetsOf(ev),
    sources,
    lineage: lineageOf(s, intent),
    followups: unsure && !s ? sampleQuestions(ev.lang) : followupsFor(ev.lang, s, intent),
    mood: 'happy',
    source: 'offline',
  };
}
