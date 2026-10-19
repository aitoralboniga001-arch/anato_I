/**
 * The original lecture notes (content/notes-text, extracted verbatim from the PDFs) as passages Kimu can
 * quote. This is the source of truth: an answer is built from these sentences, and every quote carries
 * its topic and section number so the student can find it in their own notes.
 *
 * A passage is one paragraph, or one bulleted list together with the sentence that introduces it.
 * Captions (figure legends) are indexed too, but rank below prose: when the notes' prose and their
 * figures disagree, the prose wins.
 */

import { NOTES } from '@/content/notes';
import { notesOf, sentenceAnchors, sentenceText, type NotesBlock } from '@/content/notes-text';
import { weeks } from '@/content/registry';
import { match, queryTokens, tokens } from './text';

export interface NotesSentenceRef {
  id: string;
  text: string;
  tok: string[];
}

export interface Passage {
  /** Id of the first block ("w7/3.1/p3"). */
  id: string;
  week: number;
  /** Section number as in the notes ("3.1"); '' before the first heading. */
  section: string;
  /** Section title, worded as in the notes' table of contents. */
  title: string;
  /** The heading as printed above the passage (it may word the section differently from the TOC). */
  heading: string;
  kind: 'p' | 'li' | 'caption';
  /** For a list: the paragraph that introduces it (its sentences come first in `sentences`). */
  lead?: string;
  leadCount?: number;
  sentences: NotesSentenceRef[];
  /** List items (a list passage only), verbatim. */
  items?: string[];
  tok: Set<string>;
  headTok: Set<string>;
}

export type Intent = 'noiz' | 'nondik' | 'patua' | 'zergatik' | 'zerrenda' | 'nola' | 'non' | 'zer';

/** What kind of answer the question wants, from its wording (Basque, Spanish or English). */
export function intentOf(question: string): Intent {
  const q = question.toLowerCase();
  if (/(nondik|jatorri|de d[oó]nde|origen|come from|origin|zein orritatik|qu[eé] capa)/.test(q)) return 'nondik';
  if (/(zertan bihur|zer sortzen du|zer ematen du|eratorri|qu[eé] origina|da lugar|deriva|become|give rise|fate|derivative)/.test(q)) return 'patua';
  if (/(zergatik|zerk eragiten|por qu[eé]|why)/.test(q)) return 'zergatik';
  if (/(\bnoiz\b|cu[aá]ndo|\bwhen\b|zein egun|zein astetan|zenbatgarren|which day|which week)/.test(q)) return 'noiz';
  if (/(zein(?:tzuk)? (?:dira|egitur|atal|osagai|zati)|osatzen|zeharkatzen|cu[aá]les|componentes|partes|qu[eé] estructuras|which (?:structures|parts)|components|parts of|zerrend)/.test(q)) return 'zerrenda';
  if (/(\bnola\b|c[oó]mo|\bhow\b)/.test(q)) return 'nola';
  if (/(\bnon\b|d[oó]nde|\bwhere\b)/.test(q)) return 'non';
  return 'zer';
}

/** Sentences that carry the kind of fact a question asks for. */
const CUE: Record<Intent, RegExp | null> = {
  noiz: /(\d+\s*\.?\s*(?:-?\s*\d+\.?\s*)?(?:egun|aste|hilabete))|egunean|astean|astearen|hilabetean/i,
  nondik: /(tik\b|sortzen|sortu|eratorri|jatorri|datoz|dator|bereizten)/i,
  patua: /(bihurtu|bihurtzen|emango|garatuko|sortuko|eratorri|osatuko|osatzen)/i,
  zergatik: /(ondorioz|horregatik|eraginez|delako|direlako|eragiten|induk|zeren|beharrezko|gatik\b)/i,
  zerrenda: null,
  nola: /(prozesu|ondoren|gero|lehenik|hasten|bitartez|eraldatu)/i,
  non: /(kokatzen|kokatuta|artean|mailan|aldean|inguruan|azpian|gainean|paretan|barrunbean|horman)/i,
  zer: /(\bda\b|dira|deitzen|esaten zaio)/i,
};

const clean = (s: string) => s.replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\s+/g, ' ').replace(/^[●○•➔\-–]\s*/, '').trim();

/** "3.1. DIAFRAGMAREN ERAKETA" → the TOC wording ("Diafragmaren eraketa") when there is one. */
function titleOf(week: number, section: string, heading: string): string {
  const toc = NOTES[week]?.find((s) => s.n === section)?.title;
  if (toc) return toc.replace(/[:.]\s*$/, '');
  const bare = heading.replace(/^\s*[\d.]+\s*/, '').trim();
  const t = bare.replace(/[:.]\s*$/, '');
  if (t && t === t.toUpperCase()) return t.charAt(0) + t.slice(1).toLowerCase();
  return t;
}

function build(): { passages: Passage[]; idf: Map<string, number>; vocab: string[] } {
  const passages: Passage[] = [];
  for (const w of weeks) {
    const blocks: NotesBlock[] = notesOf(w.week);
    let heading = '';
    let headSection = '';
    const titleFor = (section: string) => (section === headSection && heading ? titleOf(w.week, section, heading) : titleOf(w.week, section, ''));
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.kind === 'title' || b.kind === 'toc') continue;
      if (b.kind === 'h1' || b.kind === 'h2') {
        heading = b.sentences.map(sentenceText).join(' ');
        headSection = b.section;
        continue;
      }
      const sentences = b.sentences.map((s) => ({ id: s.id, text: clean(sentenceText(s)), tok: tokens(sentenceText(s)) })).filter((s) => s.text.length > 1);
      if (!sentences.length) continue;
      if (b.kind === 'li') {
        const prev = passages[passages.length - 1];
        const listOf = prev && prev.week === w.week && prev.section === b.section && (prev.kind === 'li' || (prev.kind === 'p' && /:\s*$/.test(prev.sentences[prev.sentences.length - 1].text))) ? prev : null;
        const item = sentences.map((s) => s.text).join(' ');
        if (listOf && (listOf.items?.length ?? 0) < 14) {
          if (listOf.kind === 'p') {
            listOf.kind = 'li';
            listOf.lead = listOf.sentences.map((s) => s.text).join(' ');
            listOf.leadCount = listOf.sentences.length;
            listOf.items = [];
          }
          listOf.items!.push(item);
          listOf.sentences.push(...sentences);
          continue;
        }
        passages.push({ id: b.id, week: w.week, section: b.section, title: titleFor(b.section), heading: b.section === headSection ? heading : '', kind: 'li', items: [item], sentences, tok: new Set(), headTok: new Set() });
        continue;
      }
      passages.push({ id: b.id, week: w.week, section: b.section, title: titleFor(b.section), heading: b.section === headSection ? heading : '', kind: b.kind === 'caption' ? 'caption' : 'p', sentences, tok: new Set(), headTok: new Set() });
    }
  }
  const df = new Map<string, number>();
  for (const p of passages) {
    p.tok = new Set(p.sentences.flatMap((s) => s.tok));
    // A list with its own lead sentence is about that sentence; the section heading speaks for the rest.
    p.headTok = new Set(tokens(p.kind === 'li' && p.lead ? p.lead : `${p.title} ${p.heading}`));
    for (const t of new Set([...p.tok, ...p.headTok])) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [t, n] of df) idf.set(t, Math.log(1 + passages.length / (1 + n)));
  return { passages, idf, vocab: [...df.keys()] };
}

let built: ReturnType<typeof build> | null = null;
const index = () => (built ??= build());
/** Builds the index ahead of the first question (Kimu calls it when idle). */
export const warmNotes = () => void index();
export const allPassages = () => index().passages;

/** For each query word: the notes words it matches, and how well (computed once per question). */
function expand(question: string) {
  const { vocab, idf, passages } = index();
  return queryTokens(question, true).map((alts) => {
    const m = new Map<string, number>();
    for (const alt of alts) {
      const fuzzy = alt.length >= 6;
      for (const w of vocab) {
        if (w[0] !== alt[0] && (!fuzzy || Math.abs(w.length - alt.length) > 3)) continue;
        const s = match(alt, w, fuzzy);
        if (s > 0 && s * (idf.get(w) ?? 0) > (m.get(w) ?? 0)) m.set(w, s * (idf.get(w) ?? 0));
      }
    }
    return { m, top: Math.log(1 + passages.length) };
  });
}

type Expanded = ReturnType<typeof expand>;

function scoreTokens(q: Expanded, tok: Set<string>, head: Set<string>): { score: number; covered: number } {
  let score = 0;
  let covered = 0;
  for (const { m } of q) {
    let best = 0;
    for (const [w, s] of m) {
      if (head.has(w)) best = Math.max(best, s * 1.5);
      if (tok.has(w)) best = Math.max(best, s);
    }
    if (best > 0) covered += 1;
    score += best;
  }
  return { score, covered };
}

/** Where the student is, to prefer passages of the topic and the step on screen. */
export interface NotesContext {
  week?: number;
  /** The student named this topic ("7. gaian"): only its passages are searched. */
  only?: number;
  /** Sentence ids of the step on screen (strongest) and of its stage. */
  step?: ReadonlySet<string>;
  stage?: ReadonlySet<string>;
  /** The structure asked about is explained in this topic and stage: its passages come first. */
  focus?: { week: number; sentences?: ReadonlySet<string>; home?: ReadonlySet<string> };
}

export interface NotesHit {
  passage: Passage;
  score: number;
  /** Share of the question's words the passage contains (0..1). */
  cover: number;
  /** The sentences that answer best, in reading order (one or two). */
  best: NotesSentenceRef[];
}

/** A notes hit that answers on its own: most of the question's words, and a real match. */
export const strongHit = (h: NotesHit | undefined): h is NotesHit => !!h && h.cover >= 0.6 && h.score >= 4.5;
/** Close enough to name as "the nearest section". */
export const fairHit = (h: NotesHit | undefined): h is NotesHit => !!h && h.cover >= 0.5 && h.score >= 3;

/** Ranks the passages of the notes for a question, best first. */
export function searchNotes(question: string, ctx: NotesContext = {}, limit = 3): NotesHit[] {
  const q = expand(question);
  if (!q.length) return [];
  const intent = intentOf(question);
  const cue = CUE[intent];
  const out: NotesHit[] = [];
  for (const p of index().passages) {
    if (ctx.only && p.week !== ctx.only) continue;
    const { score: raw, covered } = scoreTokens(q, p.tok, p.headTok);
    if (raw <= 0) continue;
    let score = raw * (0.15 + 0.85 * (covered / q.length));
    if (p.kind === 'caption') score *= 0.55;
    if (intent === 'zerrenda' && p.kind === 'li') score *= 1.45;
    if (cue && p.sentences.some((s) => cue.test(s.text))) score *= intent === 'noiz' ? 1.35 : 1.15;
    if (ctx.week === p.week) score *= 1.2;
    if (ctx.step && p.sentences.some((s) => ctx.step!.has(s.id))) score *= 1.5;
    else if (ctx.stage && p.sentences.some((s) => ctx.stage!.has(s.id))) score *= 1.15;
    if (ctx.focus && ctx.focus.week === p.week) score *= 1.5;
    // The sentences the simulator's reviewed steps link to this structure.
    if (ctx.focus?.sentences && p.sentences.some((s) => ctx.focus!.sentences!.has(s.id))) score *= 1.35;
    // The stage where it is formed and explained ("Nola eratzen da hodi neurala?" → neurulation, not the
    // somites sentence that only places them beside it).
    if (ctx.focus?.home && p.sentences.some((s) => ctx.focus!.home!.has(s.id))) score *= 1.4;
    out.push({ passage: p, score, cover: covered / q.length, best: [] });
  }
  out.sort((a, b) => b.score - a.score);
  const top = out.slice(0, limit);
  for (const h of top) h.best = bestSentences(h.passage, q, cue, intent);
  return top;
}

/** The one or two sentences of a passage that answer the question (adjacent, in reading order). */
/** Opens by pointing back: "Komunikazio hauek…", "Hori dela eta…", "Horiek…". */
const ANAPHOR = /^\s*(?:\S+\s+)?(?:hau|hauek|hori|horiek|hauei|horiei|honek|horrek|hauen|horien|honen\w*|horren\w*|hauet\w*|horiet\w*)\b/i;

function bestSentences(p: Passage, q: Expanded, cue: RegExp | null, intent: Intent): NotesSentenceRef[] {
  // A list answers "which…?"; otherwise its introducing paragraph may hold the sentence asked for.
  if (p.kind === 'li' && (intent === 'zerrenda' || !p.leadCount || p.leadCount < 2)) return p.sentences;
  const pool = p.kind === 'li' ? p.sentences.slice(0, p.leadCount) : p.sentences;
  const scored = pool.map((s, i) => {
    const { score, covered } = scoreTokens(q, new Set(s.tok), new Set());
    return { s, i, v: score * (0.4 + 0.6 * (covered / q.length)) * (cue && cue.test(s.text) ? (cue === CUE.noiz ? 2 : 1.35) : 1) };
  });
  // "When…?" is answered by the sentence that gives the time and shares a word with the question,
  // even when another sentence repeats more of the question's words.
  const timed = cue && cue === CUE.noiz ? scored.filter((x) => x.v > 0 && cue.test(x.s.text)) : [];
  const first = (timed.length ? timed : scored).reduce((a, b) => (b.v > a.v ? b : a));
  const picked = [first];
  if (p.kind === 'li' && first.i === pool.length - 1) return p.sentences;
  // A sentence that starts by pointing back ("Komunikazio hauek…") needs what it points to: the
  // passage's opening sentence, which names the subject.
  if (first.i > 0 && p.kind !== 'li' && ANAPHOR.test(first.s.text) && pool[0].text.length + first.s.text.length < 330) return [pool[0], first.s];
  // "When…?" with two times in a row ("first pair on day 20 … until the end of week 5"): keep both.
  const prev = scored[first.i - 1];
  if (timed.length && prev && timed.includes(prev) && prev.s.text.length + first.s.text.length < 330) return [prev.s, first.s];
  const next = scored[first.i + 1];
  // A sentence that opens a list ("…honela antolatuak:") is not said without the list.
  if (next && /:\s*$/.test(next.s.text)) return picked.map((x) => x.s);
  // A short sentence rarely stands alone: keep its neighbour when it continues the same point.
  const carries = (x: typeof first) => x.v > 0 || (!!cue && cue.test(x.s.text) && !(cue.test(first.s.text)));
  if (next && (next.v >= first.v * 0.5 || ((first.s.text.length < 90 || (cue && !cue.test(first.s.text))) && carries(next))) && first.s.text.length + next.s.text.length < 330) picked.push(next);
  return picked.map((x) => x.s);
}

/** The notes sentences of a step, grouped as passages (for "explain this step"). */
export function passagesOfSentences(ids: readonly string[]): NotesHit[] {
  const want = new Set(ids);
  const out: NotesHit[] = [];
  for (const p of index().passages) {
    const best = p.sentences.filter((s) => want.has(s.id));
    if (best.length) out.push({ passage: p, score: 20, cover: 1, best: p.kind === 'li' ? p.sentences : best });
  }
  return out;
}

/** The chosen sentences in the notes' order; a skipped sentence between two shows as " … ". */
export function joinBest(h: NotesHit): string {
  const at = (id: string) => h.passage.sentences.findIndex((x) => x.id === id);
  return h.best.map((x, i) => (i && at(x.id) - at(h.best[i - 1].id) > 1 ? `… ${x.text}` : x.text)).join(' ');
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n - 1) > n * 0.6 ? s.lastIndexOf(' ', n - 1) : n - 1).trimEnd()}…`);

/** "7. gaia · 3.1 Diafragmaren eraketan…" */
export const refOf = (p: Passage) => `${p.week}. gaia${p.section && p.section !== 'intro' ? ` · ${p.section}` : ''}${p.title ? ` ${p.title}` : ''}`;

/** The heading as printed, in sentence case and without its number ("3.1. DIAFRAGMAREN…" → "Diafragmaren…"). */
export function headingOf(p: Passage): string {
  const bare = p.heading.replace(/^\s*[\d.]+\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/[:.]\s*$/, '').trim();
  if (!bare) return p.title;
  return bare === bare.toUpperCase() ? bare.charAt(0) + bare.slice(1).toLowerCase() : bare;
}

/** A list item's own name: what comes before its colon ("Septum Transversuma: …" → "Septum Transversuma"). */
export const itemHead = (item: string) => {
  const c = item.indexOf(':');
  const head = c > 2 && c < 90 ? item.slice(0, c) : item.split(/(?<=[a-zñ)])\.\s+(?=[A-ZÑ])/)[0];
  return clip(head.replace(/[.;:]\s*$/, '').trim(), 110);
};

/** The short verbatim quote shown under an answer: one or two sentences, or a list's items. */
export function quoteOf(h: NotesHit, max = 300): string {
  const p = h.passage;
  if (p.kind === 'li' && p.items?.length) {
    const lead = p.lead ? `${clip(p.lead, 140)} ` : '';
    return clip(`${lead}${p.items.map(itemHead).join(' · ')}`, max);
  }
  return clip(joinBest(h), max);
}

/** The step of the simulator that shows a passage (from the reviewed beat → sentence links). */
export function anchorOf(h: NotesHit) {
  const ids = [...h.best, ...h.passage.sentences].map((s) => s.id);
  for (const id of ids) {
    const a = sentenceAnchors.get(id)?.[0];
    if (a) return { ...a, sentence: id };
  }
  return null;
}

/** Plain text for the model: the reference and the passage, trimmed around the best sentences. */
export function evidenceOf(h: NotesHit, max = 520): string {
  const p = h.passage;
  const body = p.kind === 'li' && p.items ? `${p.lead ?? ''} ${p.items.map((i) => `• ${i}`).join(' ')}` : joinBest(h);
  return `(${refOf(p)}${p.kind === 'caption' ? ', irudi-oina' : ''}) ${clip(body.replace(/\s+/g, ' ').trim(), max)}`;
}

/** Every number written in the notes and facts given, to check that an answer does not add one. */
export const numbersIn = (text: string) => new Set(text.match(/\d+(?:[.,]\d+)?/g) ?? []);
