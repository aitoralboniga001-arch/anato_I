import { firstSeenOf } from '@/content/chronology';
import { firstSentence } from '@/content/generate';
import { ancestry, childrenOf } from '@/content/lineage';
import { structures, weeks } from '@/content/registry';
import type { StructureDef } from '@/lib/sim/types';
import { anchorOf, CUE, fairHit, headingOf, itemHead, joinBest, quoteOf, refOf, strongHit, type Intent, type NotesHit, type SectionHit } from './notes';
import { CONFIDENT, confident, SAMPLE_TOPICS, toTarget, type Hit } from './search';
import { fold, keyWord, match, queryTokens, tokens, type Lang } from './text';
import type { KimuFrom, KimuHere, KimuReply, KimuSource, KimuTarget } from './types';

/**
 * Kimu's answer built from the notes alone: what most students get (no key, limit reached, no
 * connection), so it has to stand on its own. The body is the notes' own sentences, verbatim, with the
 * section they come from; the atlas card fills in only when the notes do not name the thing asked about.
 */
const COPY: Record<Lang, {
  lead: string;
  weak: (ref: string) => string;
  none: (week?: number) => string;
  /** The atlas says it, the notes do not (and the structure may not be drawn on its own). */
  atlasOnly: (near?: string) => string;
  hello: string;
  ask: (name: string, many?: boolean) => string;
  from: (name: string, many?: boolean) => string;
  to: (name: string, many?: boolean) => string;
  practice: (name: string) => string;
  /** A question that is a section's heading: where it is in the notes, and its parts. */
  section: (week: number, n: string) => string;
  parts: (k: number) => string;
}> = {
  eu: {
    lead: '',
    weak: (ref) => `Apunteek ez dute hori zuzenean esaten. Hurbilen dagoena: ${ref}.`,
    none: (w) => `Ez dut hori apunteetan aurkitu${w ? ` (${w}. gaian ere ez)` : ''}. Saiatu egituraren izen osoarekin edo beste hitz batekin; behean, hemengo gaiari buruzko galdera batzuk.`,
    atlasOnly: (near) => `Ez dut apunteetan aurkitu; atlasaren definizioa${near ? ` (simulagailuan ez du urrats propiorik: ${near} ikusten da)` : ''}:`,
    hello: 'Kaixo, Kimu naiz. Galdetu apunteei buruz: zer den egitura bat, noiz sortzen den, nondik datorren edo zertan bihurtzen den. Apunteetatik erantzungo dizut, eta simulagailuan non ikusten den erakutsiko dizut.',
    ask: (n, many) => `Noiz sortzen ${many ? 'dira' : 'da'} ${n}?`,
    from: (n, many) => `Nondik ${many ? 'datoz' : 'dator'} ${n}?`,
    to: (n, many) => `Zertan bihurtzen ${many ? 'dira' : 'da'} ${n}?`,
    practice: (n) => `Galdetu niri: ${n}`,
    section: (w, n) => `(${w}. gaia, ${n}. atala)`,
    parts: (k) => `Apunteetan ${k} zatitan azaltzen da:`,
  },
  es: {
    lead: 'En los apuntes (en euskera):',
    weak: (ref) => `Los apuntes no lo dicen directamente. Lo más cercano: ${ref}.`,
    none: (w) => `No lo encuentro en los apuntes${w ? ` (tampoco en el tema ${w})` : ''}. Prueba con el nombre completo de la estructura u otra palabra; abajo, algunas preguntas sobre este tema.`,
    atlasOnly: (near) => `No lo encuentro en los apuntes; la definición del atlas${near ? ` (en el simulador no tiene paso propio: se ve ${near})` : ''}:`,
    hello: 'Hola, soy Kimu. Pregúntame por los apuntes: qué es una estructura, cuándo se forma, de dónde viene o en qué se convierte. Te contesto con los apuntes y te enseño dónde se ve en el simulador.',
    ask: (n, many) => `¿Cuándo se ${many ? 'forman' : 'forma'} ${n}?`,
    from: (n, many) => `¿De dónde ${many ? 'vienen' : 'viene'} ${n}?`,
    to: (n, many) => `¿Qué ${many ? 'originan' : 'origina'} ${n}?`,
    practice: (n) => `Pregúntame: ${n}`,
    section: (w, n) => `(tema ${w}, apartado ${n})`,
    parts: (k) => `Los apuntes lo explican en ${k} partes:`,
  },
  en: {
    lead: 'From the notes (in Basque):',
    weak: (ref) => `The notes do not say that directly. The closest section: ${ref}.`,
    none: (w) => `I cannot find that in the notes${w ? ` (not in topic ${w} either)` : ''}. Try the structure's full name or another word; below, a few questions about this topic.`,
    atlasOnly: (near) => `I cannot find it in the notes; the atlas definition${near ? ` (the simulator has no step of its own for it: ${near} is shown)` : ''}:`,
    hello: "Hi, I'm Kimu. Ask me about the notes: what a structure is, when it forms, where it comes from or what it becomes. I answer from the notes and show you where the simulator explains it.",
    ask: (n, many) => `When ${many ? 'do' : 'does'} ${n} form?`,
    from: (n, many) => `Where ${many ? 'do' : 'does'} ${n} come from?`,
    to: (n, many) => `What ${many ? 'do' : 'does'} ${n} become?`,
    practice: (n) => `Quiz me: ${n}`,
    section: (w, n) => `(topic ${w}, section ${n})`,
    parts: (k) => `The notes explain it in ${k} parts:`,
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

/** Structures of the step and stage the student is on (the picked one first), to ask about them. */
function hereTopics(here: KimuHere): string[] {
  const stage = weeks.find((w) => w.week === here.week)?.stages.find((x) => x.id === here.stage);
  if (!stage) return [];
  const beat = stage.beats[here.beat];
  const ids = [here.structure ?? '', ...(beat?.focus ?? []), ...stage.beats.flatMap((b) => b.focus ?? []), ...stage.structures];
  return ids.filter((id, i) => !!id && ids.indexOf(id) === i && !!structures.get(id) && !!firstSeenOf(id)).slice(0, 3);
}

/** Tappable examples using real structures (Spanish names for Spanish, Basque otherwise). */
export function sampleQuestions(lang: Lang, n = 3, here?: KimuHere | null): string[] {
  const ids = here ? hereTopics(here) : [];
  return [...ids, ...SAMPLE_TOPICS].filter((id, i, all) => all.indexOf(id) === i).slice(0, n).map((id) => {
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

/** A word's stem, to find it whatever its Basque case ending ("muturra" → "mutur"). */
const stemWord = (w: string) => {
  const f = fold(w);
  return f.length > 6 ? f.slice(0, Math.max(5, f.length - 2)) : f.length > 4 ? f.slice(0, f.length - 1) : f;
};

/**
 * Does this sentence say the structure's name: every word of it, close together ("zain muturra", not the
 * "arteria muturra" beside it; "kanpoko arteria iliakoa", not "arteria iliako primitiboak")?
 */
export function says(tok: readonly string[], s: StructureDef): boolean {
  return [s.name, s.es ?? '', ...(s.aka ?? [])].filter(Boolean).some((n) => {
    const stems = tokens(n.replace(/\([^)]*\)/g, ' ')).map(stemWord);
    if (!stems.length) return false;
    for (let i = 0; i < tok.length; i++) {
      if (!tok[i].startsWith(stems[0])) continue;
      // The name's words side by side, one other word allowed between ("bena kabaren segmentu hepatiko" is
      // not "bena hepatikoa").
      const near = tok.slice(Math.max(0, i - stems.length), i + stems.length + 1);
      if (stems.every((st) => near.some((w) => w.startsWith(st)))) return true;
    }
    return false;
  });
}

/** Does this passage talk about the structure (one of its sentences says its name)? */
export function mentions(h: NotesHit, s: StructureDef): boolean {
  return h.passage.sentences.some((x) => says(x.tok, s));
}

/** The passage's sentences that say the structure's name, when the chosen ones do not (one, or two when short). */
function sayingIt(h: NotesHit | undefined, s: StructureDef | undefined): NotesHit | undefined {
  if (!h || !s || isList(h) || h.best.some((x) => says(x.tok, s))) return h;
  const all = h.passage.sentences;
  const i = all.findIndex((x) => says(x.tok, s));
  if (i < 0) return h;
  return { ...h, best: all[i].text.length < 90 && all[i + 1] ? [all[i], all[i + 1]] : [all[i]] };
}

/** Bold the first appearance of the structure's name in a verbatim sentence. */
export function boldName(text: string, s: StructureDef | undefined): string {
  if (!s) return text;
  const stem = stemOf(s.name);
  const re = /[A-Za-zÀ-ÿñÑ][\wÀ-ÿñÑ-]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (fold(m[0]).startsWith(stem)) {
      // Take the name's following words too ("septum transversuma", "kanpoko arteria iliakoa"): the first
      // always, the others while they are the name's own.
      const rest = s.name.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/).slice(1).map((w) => stemWord(w));
      let end = m.index + m[0].length;
      for (let i = 0; i < rest.length; i++) {
        const next = /^\s+([\wÀ-ÿñÑ-]+)/.exec(text.slice(end));
        if (!next || (i > 0 && !fold(next[1]).startsWith(rest[i]))) break;
        end += next[0].length;
      }
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
  /**
   * "Take me to X" from where the student is: places[0] is the nearest place that shows it at or after
   * the student's position, and places[1] its usual place (when that is another stage).
   */
  going?: boolean;
  /** Where the student is, and the topic the question names (when it does): to word fallbacks and pick chips. */
  here?: KimuHere | null;
  asked?: number | null;
  /** The question is a section's heading: answered as that section (its opening and its parts). */
  section?: SectionHit | null;
}

/** Where a place is from the student, said in one sentence (stage titles are the notes' own Basque). */
const FROM: Record<Lang, Record<KimuFrom, (title: string, step: number, week: number) => string>> = {
  eu: {
    now: () => 'Orain bertan pantailan duzu.',
    ahead: (_, k) => `Etapa honetan bertan ikusten da, aurrerago: ${k}. urratsa.`,
    back: (_, k) => `Etapa honetan bertan ikusten da, lehenago: ${k}. urratsa.`,
    next: (t) => `Hurrengo etapan ikusten da: ${t}.`,
    later: (t) => `Gai honetan aurrerago ikusten da: ${t}.`,
    earlier: (t) => `Gai honetan lehenago ikusten da: ${t}.`,
    other: (t, _, w) => `${w}. gaian ikusten da: ${t}.`,
  },
  es: {
    now: () => 'Lo tienes ahora mismo en pantalla.',
    ahead: (_, k) => `Se ve en esta misma etapa, un poco más adelante: paso ${k}.`,
    back: (_, k) => `Se ve en esta misma etapa, un poco antes: paso ${k}.`,
    next: (t) => `Se ve en la siguiente etapa: ${t}.`,
    later: (t) => `Se ve más adelante en este tema: ${t}.`,
    earlier: (t) => `Se ve antes en este tema: ${t}.`,
    other: (t, _, w) => `Se ve en el tema ${w}: ${t}.`,
  },
  en: {
    now: () => 'It is on screen right now.',
    ahead: (_, k) => `It is shown later in this same stage: step ${k}.`,
    back: (_, k) => `It is shown earlier in this same stage: step ${k}.`,
    next: (t) => `It is shown in the next stage: ${t}.`,
    later: (t) => `It is shown later in this topic: ${t}.`,
    earlier: (t) => `It is shown earlier in this topic: ${t}.`,
    other: (t, _, w) => `It is shown in topic ${w}: ${t}.`,
  },
};

/** "Hurrengo etapan ikusten da: …": where a destination is from the student, or '' when unknown. */
export function fromSentence(lang: Lang, t: KimuTarget | undefined): string {
  if (!t?.from) return '';
  const stage = weeks.find((w) => w.week === t.week)?.stages.find((s) => s.id === t.stage);
  if (!stage) return '';
  let k = 0;
  stage.beats.forEach((b, i) => { if (b.at <= t.at + 1e-6) k = i; });
  return FROM[lang][t.from](stage.title, k + 1, t.week);
}

/** A reply that already says where the place is (the model's own words), so the sentence is not repeated. */
export const SAYS_WHERE = /(hurrengo|aurrerago|lehenago|pantailan|etapa honetan|gai honetan|\d+\. gaian|siguiente|m[aá]s adelante|antes|en pantalla|misma etapa|este tema|el tema \d|\bnext\b|\blater\b|\bearlier\b|on screen|same stage|this topic|topic \d)/i;

/** The simulator destinations for an answer: the place of the thing asked about, then the notes' step. */
export function targetsOf(ev: Evidence): KimuTarget[] {
  // The structure asked about, called by its full name, is the place even when other words of the question
  // lower its cover ("Notokorda noiz agertzen da?").
  const at = confident(ev.places[0]) ? ev.places[0] : ev.structure ? ev.places.find((h) => h.doc.structure === ev.structure!.id && h.score >= CONFIDENT) : undefined;
  const place = at ? toTarget(at, 'c1') : undefined;
  // A structure asked about: only a passage that says its name is a place to go (not one that merely shares a word).
  const n = strongHit(ev.notes[0]) && (!ev.structure || mentions(ev.notes[0], ev.structure)) ? notesTarget(ev.notes[0]) : undefined;
  // "Take me to X": the nearest place first, then X's usual place when that is another stage.
  const usual = ev.going && place && ev.places[1]?.doc.structure === place.structure ? toTarget(ev.places[1], 'c2') : undefined;
  // The thing asked about first when the question names it; otherwise the step of the passage quoted.
  const order = ev.going ? [place, usual, n] : ev.structure || place?.formation ? [place, n] : [n, place];
  const out: KimuTarget[] = [];
  for (const t of order) if (t && !out.some((o) => o.week === t.week && o.stage === t.stage)) out.push(t);
  return out.slice(0, 2);
}

export function offlineReply(ev: Evidence): KimuReply {
  const c = COPY[ev.lang];
  if (ev.section) return sectionReply(ev, ev.section);
  const { structure: s, intent } = ev;
  // "What is it / how does it form": the passage whose chosen sentence introduces the structure
  // ("… hodi neural izenarekin") answers better than one that only mentions it.
  const intro = s && (intent === 'zer' || intent === 'nola') ? ev.notes.find((h, i) => i > 0 && fairHit(h) && h.score >= ev.notes[0].score * 0.7 && !isList(h) && h.best.some((x) => defines(x.text, s))) : undefined;
  const first = intro && !ev.notes[0].best.some((x) => defines(x.text, s!)) ? intro : ev.notes[0];
  // The question names a structure: quote a sentence that says its name, from the best passage that has
  // one (the top passage may share the most words yet be about its neighbour).
  const saying = s ? ev.notes.map((h) => sayingIt(h, s)).find((h) => fairHit(h) && (isList(h!) ? mentions(h!, s) : h!.best.some((x) => says(x.tok, s)))) : undefined;
  const best = s && first && !(isList(first) ? mentions(first, s) : first.best.some((x) => says(x.tok, s))) ? (saying ?? first) : first;
  const place = ev.places[0];
  const lead = c.lead ? `${c.lead} ` : '';

  if (!best && !place && isGreeting(ev.question)) return { reply: c.hello, targets: [], sources: [], followups: sampleQuestions(ev.lang, 3, ev.here), mood: 'happy', source: 'offline' };

  const strong = strongHit(best);
  // About the structure in what the student will read (a list shows only its items' heads).
  const onTopic = strong && (!s || (mentions(best, s) && says(tokens(notesBody(best, intent, s)), s)));
  // A date from the atlas timeline only when the question is about the structure itself ("Noiz sortzen da X?"),
  // not about something that happens to it ("Noiz habiratzen da blastozistoa?").
  const when = s && place?.doc.structure === s.id && !place.doc.atlasOnly && aboutItself(ev.question, s) ? place.doc.where.replace(/^\d+\. gaia · /, '') : '';
  // "How does it form?" with no notes passage about it: where it comes from (or what it is) says the most.
  const card = s && ((intent === 'nondik' && s.origin) || (intent === 'patua' && s.fate) || (intent === 'zer' && s.definition) || (intent === 'noiz' && when) || (intent === 'nola' && (s.origin || s.definition)));
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
  // "When?" answered by a passage that gives no time at all: the atlas timeline answers it better.
  const cardFirst = !!card && ((intent === 'nondik' || intent === 'patua') ? !listAbout : intent === 'zer' ? !said : intent === 'noiz' ? !!best && !best.best.some((x) => CUE.noiz!.test(x.text)) : false);
  if (onTopic && !cardFirst) {
    // The notes' own words are the answer.
    const body = notesBody(best, intent, s);
    reply = `${lead}${body}`;
    // "When?" answered by a sentence without a date: the atlas's timeline adds it.
    if (intent === 'noiz' && when && !/\d/.test(body)) reply += ` (${atlasWhen}: ${when}.)`;
    sources = [sourceOf(best, false)];
  } else if (s && card) {
    // The atlas card (worded from the notes), with the closest notes passage quoted under it.
    const text = intent === 'nondik' || (intent === 'nola' && s.origin) ? s.origin! : intent === 'patua' ? s.fate! : intent === 'noiz' ? `${when} (${atlasWhen.toLowerCase()}).` : firstSentence(s.definition);
    reply = `**${s.name}**: ${text.replace(/^\s+/, '')}`;
    // The passage of the topic that explains it comes first (topic 7 for the mediastinum, not topic 13's
    // thoracic duct that only climbs through it), even when it is a list.
    const cands = ev.notes.filter((h) => fairHit(h) && mentions(h, s));
    const home = (h: NotesHit) => h.passage.week === place?.doc.week;
    const pick = cands.find((h) => home(h) && !isList(h)) ?? cands.find(home) ?? cands.find((h) => !isList(h));
    sources = pick ? [sourceOf(pick, true)] : [];
    // Nothing in the notes mentions it (not even a list item): the card is the atlas's own wording, and says so.
    if (!ev.notes.some((h) => fairHit(h) && mentions(h, s))) reply = `${c.atlasOnly(place?.doc.atlasOnly?.near)} ${reply}`;
  } else if (fairHit(best) && best.score >= 4.5 && (!ev.asked || best.passage.week === ev.asked)) {
    reply = c.weak(refOf(best.passage));
    unsure = true;
    sources = [sourceOf(best, true)];
  } else if (confident(place)) {
    const st = place.doc.structure ? structures.get(place.doc.structure) : undefined;
    reply = st ? `${c.atlasOnly(place.doc.atlasOnly?.near)} **${st.name}**: ${firstSentence(st.definition)}` : place.doc.blurb;
    sources = [];
  } else {
    return { reply: c.none(ev.asked ?? ev.here?.week), targets: [], sources: [], followups: sampleQuestions(ev.lang, 3, ev.here), mood: 'curious', source: 'offline' };
  }
  return {
    reply: reply.replace(/\s+/g, ' ').trim(),
    targets: unsure ? [] : targetsOf(ev),
    sources,
    lineage: lineageOf(s, intent),
    followups: unsure && !s ? sampleQuestions(ev.lang, 3, ev.here) : followupsFor(ev.lang, s, intent).concat(s ? [] : sampleQuestions(ev.lang, 3, ev.here)).slice(0, 3),
    mood: 'happy',
    source: 'offline',
  };
}

/**
 * "Atal bulbarraren trenkadatze prozesua": the section as a whole. Its own opening sentence (or its first
 * part's), then each part by its number and title with its opening sentence; the stages that show them.
 */
function sectionReply(ev: Evidence, sec: SectionHit): KimuReply {
  const c = COPY[ev.lang];
  const [first, ...rest] = sec.parts;
  const own = first.passage.section === sec.section;
  const subs = own ? rest : sec.parts;
  const say = (h: NotesHit) => clipText(h.best.map((x) => x.text).join(' '), 230);
  const lead = `${c.lead ? `${c.lead} ` : ''}**${sec.title}** ${c.section(sec.week, sec.section)}${own ? `: ${say(first)}` : '.'}`;
  const parts = subs.length > 1 ? ` ${c.parts(subs.length)} ${subs.map((h) => `**${h.passage.section} ${h.passage.title}**: ${say(h)}`).join(' ')}` : subs.length ? ` ${say(subs[0])}` : '';
  const targets: KimuTarget[] = [];
  for (const h of sec.parts) {
    const t = notesTarget(h);
    if (t && !targets.some((o) => o.week === t.week && o.stage === t.stage)) targets.push(t);
  }
  return {
    reply: `${lead}${parts}`.replace(/\s+/g, ' ').trim(),
    targets: targets.slice(0, 2),
    sources: sec.parts.slice(0, 2).map((h) => sourceOf(h, false)),
    followups: sampleQuestions(ev.lang, 3, ev.here),
    mood: 'happy',
    source: 'offline',
  };
}

const clipText = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n - 1)).trimEnd()}…`);
