import { expandNotes } from '@/content/notes-text';
import { structures, weeks } from '@/content/registry';
import type { Answers } from '@/components/shell/answers';
import { evidenceOf, intentOf, numbersIn, passagesOfSentences, searchNotes, strongHit, warmNotes, type NotesContext, type NotesHit } from './notes';
import { boldName, followupsFor, fromSentence, lineageOf, notesTarget, offlineReply, SAYS_WHERE, sourceOf, targetsOf, type Evidence } from './offline';
import { pickPractice, wantsPractice } from './practice';
import { CONFIDENT, describeHere, factsFrom, GO, isFormationQuestion, nearestFrom, search, toTarget, wantsPlace, withFrom, type Hit } from './search';
import { detectLang, keyWords, match, queryTokens, type Lang } from './text';
import type { KimuAsk, KimuHere, KimuModelReply, KimuReply, KimuTurn } from './types';

/** "Explain this", "zer da hau?": the question is about what is on screen, not about a named thing. */
const DEICTIC = /\b(esto|esta|este|eso|aqu[ií]|ahora|hau|hori|hemen|orain|this|here|now)\b/i;
/** …and about the step itself rather than the selected structure. */
const STEP = /(urrats|pausu|paso|step|eszena|escena|scene|gertatzen|ocurre|happen)/i;

/** Resolve an unnamed follow-up before retrieval, so the model receives the right evidence. */
export function retrievalQuestion(question: string, history: KimuTurn[], here: KimuHere | null): string {
  if (!/(de d[oó]nde viene|qu[eé] origina|su origen|y (?:eso|esta|este)|de eso|de esto|nondik|honen|horren|where does it|its origin|what does it|\bit\b)/i.test(question) && !DEICTIC.test(question)) return question;
  const own = search(question, 1)[0];
  if (own?.doc.kind === 'structure' && own.score >= CONFIDENT * 1.5) return question;
  let id = here?.structure;
  if (!id) {
    for (const turn of [...history].reverse()) {
      if (turn.role !== 'user') continue;
      const hit = search(turn.text, 1)[0];
      if (hit?.doc.kind === 'structure' && hit.score >= CONFIDENT) { id = hit.doc.structure; break; }
    }
  }
  const structure = id && structures.get(id);
  return structure ? `${question} (${[structure.es, structure.name].filter(Boolean).join(' · ')})` : question;
}

/** Does the question name this structure (its first word, in any case ending or spelling)? */
export function namedIn(question: string, id: string): boolean {
  const st = structures.get(id);
  if (!st) return false;
  const q = queryTokens(question).flat();
  return [st.name, st.es ?? '', ...(st.aka ?? [])].filter(Boolean).some((n) => {
    // Every word that names it ("zeloma" in "Enbrioi barruko zeloma"; "hodi" and "neurala"), so
    // "zeloma" alone does not name "Heuser-en mintza (zeloma kanpoko mintza)".
    const own = keyWords(n);
    return own.length > 0 && own.every((key) => q.some((w) => match(w, key, true) >= 0.6));
  });
}

/** Where the student is, as the notes search uses it. */
function notesContext(here: KimuHere | null): NotesContext {
  if (!here) return {};
  const stage = weeks.find((w) => w.week === here.week)?.stages.find((s) => s.id === here.stage);
  if (!stage) return { week: here.week };
  const beat = stage.beats[here.beat];
  return { week: here.week, step: new Set(expandNotes(beat?.notes)), stage: new Set(stage.beats.flatMap((b) => expandNotes(b.notes))) };
}

/** The notes sentences of every reviewed step that shows this structure. */
function reviewedSentences(id: string): Set<string> {
  const out = new Set<string>();
  for (const w of weeks) for (const st of w.stages) for (const b of st.beats) if (b.focus?.includes(id)) for (const s of expandNotes(b.notes)) out.add(s);
  return out;
}

/** The notes sentences of a stage: where a structure is formed and explained. */
function stageSentences(week: number, stageId: string): Set<string> {
  const stage = weeks.find((w) => w.week === week)?.stages.find((st) => st.id === stageId);
  return new Set(stage ? stage.beats.flatMap((b) => expandNotes(b.notes)) : []);
}

/** Builds the indexes ahead of the first question (called when Kimu is about to be used). */
export function warmKimu() {
  search('notokorda', 1);
  warmNotes();
}

/** "Explain this step": the step's own notes sentences, its key idea, and nothing guessed. */
function stepReply(here: KimuHere, lang: Lang): { reply: KimuReply; notes: NotesHit[] } | null {
  const stage = weeks.find((w) => w.week === here.week)?.stages.find((s) => s.id === here.stage);
  const beat = stage?.beats[here.beat];
  if (!stage || !beat) return null;
  const notes = passagesOfSentences(expandNotes(beat.notes));
  const picked = here.structure ? structures.get(here.structure) : undefined;
  const said = notes.slice(0, 2).map((h) => h.best.slice(0, 2).map((x) => x.text).join(' ')).join(' ');
  const lead = { eu: '', es: 'En los apuntes (en euskera): ', en: 'From the notes (in Basque): ' }[lang];
  const key = beat.key ? ` ${{ eu: 'Gakoa', es: 'La clave', en: 'The key' }[lang]}: ${beat.key}` : '';
  const body = said ? `${lead}${boldName(said, picked)}${key}` : `**${beat.idea ?? stage.title}**${key || ` ${beat.text}`}`;
  return {
    notes,
    reply: {
      reply: body.replace(/\s+/g, ' ').trim(),
      targets: [],
      sources: notes.slice(0, 1).map((h) => sourceOf(h, false)),
      followups: followupsFor(lang, picked ?? (beat.focus?.[0] ? structures.get(beat.focus[0]) : undefined), 'zer'),
      mood: 'happy',
      source: 'offline',
    },
  };
}

const PRACTICE = {
  eu: { start: (scope: string) => `Ados, hiru galdera (${scope}). Aukeratu erantzuna; bakoitzaren ondoren apunteekin azalduko dizut.`, none: 'Ez dut galdera berrikusirik hemen. Galdetu niri beste gai bati buruz.', all: 'atlas osoa' },
  es: { start: (scope: string) => `Vale, tres preguntas (${scope}). Elige la respuesta; después de cada una te la explico con los apuntes.`, none: 'No tengo preguntas revisadas aquí. Pídemelas sobre otro tema.', all: 'todo el atlas' },
  en: { start: (scope: string) => `Okay, three questions (${scope}). Pick an answer; after each one I explain it with the notes.`, none: 'I have no reviewed questions here. Ask me about another topic.', all: 'the whole atlas' },
};

function practiceReply(question: string, here: KimuHere | null, answers: Answers, lang: Lang): KimuReply {
  const rest = question.replace(/galdetu niri|preg[uú]ntame|quiz me|test me|buruz|sobre|about/gi, ' ');
  const named = search(rest, 4).find((h) => h.doc.kind === 'structure' && h.score >= CONFIDENT && !!h.doc.structure && namedIn(rest, h.doc.structure));
  const concept = named?.doc.structure ?? null;
  const items = pickPractice(here, answers, concept, named?.doc.week);
  const c = PRACTICE[lang];
  if (!items.length) return { reply: c.none, targets: [], sources: [], followups: [], mood: 'curious', source: 'offline' };
  const stage = here && weeks.find((w) => w.week === here.week)?.stages.find((s) => s.id === here.stage);
  const scopeName = concept ? structures.get(concept)?.name : items.every((q) => q.week === items[0].week && q.stageId === here?.stage) && stage ? stage.title : here ? `${here.week}. gaia` : null;
  return { reply: c.start(scopeName ?? c.all), targets: [], sources: [], practice: items, followups: [], mood: 'happy', source: 'offline' };
}

/** The numbers an answer may use: every number written in the evidence it was given. */
const allowedNumbers = (ask: KimuAsk) => numbersIn([ask.question, ...ask.notes, ...ask.places, ask.here?.title ?? '', ask.here?.step ?? '', ask.here?.picked ?? ''].join(' '));

/** True when the model's reply states no number the evidence does not contain. */
export function grounded(reply: string, ask: KimuAsk): boolean {
  const allowed = allowedNumbers(ask);
  return [...numbersIn(reply.replace(/\b[cn]\d\b/g, ''))].every((n) => allowed.has(n));
}

export interface AskOptions {
  /** The answer history (for practice rounds: what is due comes first). */
  answers?: Answers;
  /** How long to wait for the model before answering from the notes alone. */
  timeoutMs?: number;
}

/**
 * One question, start to finish, in the browser: find the passages of the notes and the places of the
 * simulator, ask the model to put them in Kimu's words, and only let it cite and point at what was found.
 * When the model is not available (no key, limit reached, no connection, slow, or it states a number
 * the notes do not), the answer is built from the notes alone.
 */
export async function askKimu(question: string, history: KimuTurn[], here: KimuHere | null, opts: AskOptions = {}): Promise<KimuReply> {
  const lang = detectLang(question);
  if (wantsPractice(question)) return practiceReply(question, here, opts.answers ?? {}, lang);

  const intent = intentOf(question);
  // "Eraman nazazu X-ra", "llévame a X": where to see it from here, not how it forms.
  const going = !!here && wantsPlace(question) && !isFormationQuestion(question.replace(GO, ' '));
  const aboutStep = !going && !!here && DEICTIC.test(question) && (!here.structure || STEP.test(question)) && !(search(question, 1)[0]?.score >= CONFIDENT * 1.5);
  const step = aboutStep ? stepReply(here!, lang) : null;

  const rq = retrievalQuestion(question, history, here);
  let places = step ? [] : search(rq, 3);
  // The structure the question names: the best place that is one (not always the first place found).
  const named = places.find((h) => h.doc.kind === 'structure' && h.score >= CONFIDENT && !!h.doc.structure && namedIn(rq, h.doc.structure));
  // "Take me to X": the nearest place that shows X at or after the student's position comes first, and
  // X's usual place second when it is in another stage (the same stage: the usual place says it best).
  const near = going && named ? nearestFrom(here!, named) : null;
  const sameStage = (a: Hit, b: Hit) => a.doc.week === b.doc.week && a.doc.stage === b.doc.stage;
  if (going && named) places = [near && !sameStage(near, named) ? near : named, ...(near && !sameStage(near, named) ? [named] : []), ...places.filter((h) => h !== named)].slice(0, 3);
  const top = places[0];
  const s = named ? structures.get(named.doc.structure!) : undefined;
  const ctx = notesContext(here);
  if (named) ctx.focus = { week: named.doc.week, sentences: reviewedSentences(named.doc.structure!), home: stageSentences(named.doc.week, named.doc.stage) };
  const notes = step ? step.notes : searchNotes(rq, ctx, 3);
  const ev: Evidence = { question, lang, intent, structure: s, notes, places, going: going && !!named };
  const offline = located(step ? step.reply : offlineReply(ev), here, ev.going ? lang : null);

  // Nothing the notes really answer: the model would have nothing to stand on, so it is not asked.
  if (!step && !strongHit(notes[0]) && !(places[0]?.score >= CONFIDENT)) return offline;

  const hereInfo = here ? describeHere(here) : null;
  const ask: KimuAsk = { question, history, notes: notes.map((h) => evidenceOf(h)), places: places.slice(0, 2).map((h) => factsFrom(h, here)), here: hereInfo, lang };
  let model: KimuModelReply = { ok: false, reason: 'error' };
  try {
    const res = await fetch('/api/kimu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ask), signal: AbortSignal.timeout(opts.timeoutMs ?? 6000) });
    if (res.ok) model = (await res.json()) as KimuModelReply;
  } catch {
    // No connection or too slow: answered from the notes below.
  }
  if (!model.ok || !grounded(model.reply, ask)) return offline;

  // The model may only cite passages and places it was given; anything else is dropped.
  const pick = <T,>(ids: string[], prefix: 'n' | 'c', list: T[]) =>
    ids.flatMap((id) => {
      const i = new RegExp(`^${prefix}(\\d)$`).exec(id)?.[1];
      const x = i ? list[Number(i) - 1] : undefined;
      return x ? [{ id, x }] : [];
    });
  const cited = pick(model.cite, 'n', notes).map((c) => c.x);
  const sources = (cited.length ? cited : notes.filter(strongHit).slice(0, 1)).slice(0, 2).map((h) => sourceOf(h, true));

  let targets = step ? [] : pick(model.go, 'c', places).map(({ id, x }) => toTarget(x, id));
  if (!step) {
    if (!targets.length) targets = targetsOf(ev);
    // A reviewed formation destination is determined by the question, not by the model's citation choice.
    if (top?.doc.formation && top.score >= CONFIDENT) {
      const first = toTarget(top, 'c1');
      targets = [first, ...targets.filter((t) => t.id !== first.id)].slice(0, 2);
    }
    const n = cited[0] ? notesTarget(cited[0]) : undefined;
    if (n && targets.length < 2 && !targets.some((t) => t.week === n.week && t.stage === n.stage)) targets.push(n);
  }
  return located({
    reply: model.reply,
    targets,
    sources,
    lineage: step ? undefined : lineageOf(s, intent),
    followups: model.followups.length ? model.followups : offline.followups,
    mood: 'happy',
    source: 'ai',
  }, here, ev.going ? lang : null, true);
}

/**
 * Marks every destination with where it is from the student; for "take me to X" (`tell` = the
 * reply's language) also says where the first one is, unless the model's reply already does (the
 * offline reply quotes the notes, whose "lehenago" or "hurrengo" are about something else).
 */
function located(r: KimuReply, here: KimuHere | null, tell: Lang | null, model = false): KimuReply {
  if (!here || !r.targets.length) return r;
  const targets = r.targets.map((t) => withFrom(t, here));
  const said = tell && !(model && SAYS_WHERE.test(r.reply)) ? fromSentence(tell, targets[0]) : '';
  return { ...r, targets, reply: said ? `${r.reply} ${said}` : r.reply };
}
