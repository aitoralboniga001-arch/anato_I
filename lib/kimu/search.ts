/**
 * Finds where the simulator explains something. Runs in the browser (the scenes are client modules, so a
 * route handler cannot read the content). Deterministic and free: it reads the same content the
 * simulator plays (structures, stages, steps), so Kimu can only ever point at places that exist, and
 * still answers when the language model is unavailable.
 */

import { lifeOf, dayLabel, firstSeenOf, spanLabel } from '@/content/chronology';
import { firstSentence } from '@/content/generate';
import { structures, weeks } from '@/content/registry';
import { formationOf } from '@/content/formation';
import type { KimuFrom, KimuHere, KimuTarget } from './types';
import { match, queryTokens, spell, tokens, topicIn, withoutTopic } from './text';

interface Doc {
  kind: KimuTarget['kind'];
  week: number;
  stage: string;
  at: number;
  structure?: string;
  label: string;
  where: string;
  /** Strong fields: names of the thing (structure name, Spanish name, aliases, stage title). */
  names: string[];
  /** Medium: things the step is about (focused structures, stage title for steps). */
  about: string[];
  /** Weak: prose. */
  body: string[];
  /** Folded whole names, for phrase matches. */
  phrases: string[];
  nameTok: string[];
  aboutTok: string[];
  /** One sentence for a reply built without the model. */
  blurb: string;
  /** What the model gets to read (built once, short). */
  facts: string;
  view?: string;
  formation?: string;
  action?: KimuTarget['action'];
  /** An atlas entry the simulator does not draw on its own: where it is placed is a neighbour's step. */
  atlasOnly?: { near: string };
  /** The structure to select on arrival when it is not the entry itself (an atlas-only entry's neighbour). */
  go?: string;
}

export interface Hit {
  doc: Doc;
  score: number;
  /** Share of the question's words the place matches (0..1). */
  cover: number;
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();


/**
 * Where a structure is best explained: the start of the stage named after it when there is one
 * ("Notokordaren eraketa", "Somitomeroak eta somiten agerpena"), otherwise the step that first shows it.
 */
function bestSpot(id: string, first: NonNullable<ReturnType<typeof firstSeenOf>>) {
  const reviewed = formationOf(id);
  if (reviewed) return { week: reviewed.week, stage: reviewed.stage, at: reviewed.end };
  const st = structures.get(id);
  const fallback = { week: first.week, stage: first.stage, at: Math.max(0, first.at) };
  if (!st) return fallback;
  const forms = [st.name, st.es ?? ''].map((n) => tokens(n).filter((t) => t.length >= 3)).filter((t) => t.length);
  for (const w of weeks)
    for (const s of w.stages) {
      if (!s.structures.includes(id)) continue;
      const title = tokens(`${s.title} ${s.subtitle ?? ''}`);
      if (!forms.some((f) => f.every((n) => title.some((t) => match(n, t, false) >= 0.85)))) continue;
      // The whole stage is the explanation, so it plays from its start.
      return { week: w.week, stage: s.id, at: 0 };
    }
  return fallback;
}

function build(): { docs: Doc[]; idf: Map<string, number> } {
  const docs: Doc[] = [];
  const stageWhere = (week: number, day: string) => `${week}. gaia · ${day}`;

  for (const w of weeks) {
    for (const s of w.stages) {
      const where = stageWhere(w.week, s.day);
      docs.push({
        kind: 'stage',
        week: w.week,
        stage: s.id,
        at: 0,
        label: s.title,
        where,
        names: [s.title, s.subtitle ?? ''],
        about: [],
        body: tokens([s.intro ?? '', ...s.keyPoints].join(' ')),
        phrases: [tokens(s.title).join(' ')],
        nameTok: [],
        aboutTok: [],
        blurb: clip(oneLine(s.intro ?? s.subtitle ?? s.title), 220),
        facts: clip(oneLine(`${s.title} (${where}). ${s.intro ?? ''} ${s.keyPoints.slice(0, 2).join(' ')}`), 340),
      });
      s.beats.forEach((b, k) => {
        const idea = oneLine(b.idea ?? firstSentence(b.text));
        const focus = (b.focus ?? []).map((id) => structures.get(id)?.name ?? '').filter(Boolean);
        docs.push({
          kind: 'beat',
          week: w.week,
          stage: s.id,
          at: b.at,
          structure: b.focus?.[0],
          label: clip(idea, 70),
          where,
          names: [],
          about: [s.title, ...focus],
          body: tokens(`${idea} ${b.text} ${b.key ?? ''}`),
          phrases: [],
          nameTok: [],
          aboutTok: [],
          blurb: clip(idea, 220),
          facts: clip(oneLine(`${s.title}, ${k + 1}. urratsa (${where}): ${idea} ${b.text}`), 340),
        });
      });
    }
  }

  for (const st of structures.values()) {
    const f = firstSeenOf(st.id);
    if (!f) continue;
    const spot = bestSpot(st.id, f);
    const week = weeks.find((w) => w.week === spot.week);
    const stage = week?.stages.find((s) => s.id === spot.stage);
    if (!week || !stage) continue;
    const life = lifeOf(st.id);
    const when = life ? `Noiz: ${spanLabel(life.from, life.to)}.` : `Noiz: ${dayLabel(Math.round(f.day))}.`;
    const bits = [
      `${st.name}${st.es ? ` (${st.es})` : ''}: ${st.definition}`,
      when,
      life?.note ? life.note : '',
      st.origin ? `Jatorria: ${st.origin}` : '',
      st.fate ? `Patua: ${st.fate}` : '',
      st.caution ? `Kontuz: ${st.caution}` : '',
    ];
    const names = [st.name, st.es ?? '', ...(st.aka ?? [])].filter(Boolean);
    docs.push({
      kind: 'structure',
      week: spot.week,
      stage: spot.stage,
      at: spot.at,
      structure: st.id,
      view: formationOf(st.id)?.view,
      label: st.name,
      where: stageWhere(spot.week, stage.day),
      names,
      about: [],
      body: tokens(`${st.definition} ${st.location ?? ''} ${st.origin ?? ''} ${st.fate ?? ''}`),
      phrases: names.map((n) => tokens(n).join(' ')).filter(Boolean),
      nameTok: [],
      aboutTok: [],
      blurb: clip(oneLine(firstSentence(st.definition)), 220),
      facts: clip(oneLine(bits.filter(Boolean).join(' ')), 520),
    });
  }

  // Atlas entries no step shows (a "Mediastinoa" card): searchable too, placed at the step of the
  // neighbour they are related to, and marked so the answer says they are not drawn on their own.
  for (const w of weeks) {
    for (const st of w.structures) {
      if (firstSeenOf(st.id)) continue;
      const seen = new Set<string>([st.id]);
      let near: { id: string; f: NonNullable<ReturnType<typeof firstSeenOf>> } | null = null;
      const queue = [...(st.related ?? [])];
      while (queue.length && !near) {
        const id = queue.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const f = firstSeenOf(id);
        if (f) near = { id, f };
        else queue.push(...(structures.get(id)?.related ?? []));
      }
      if (!near) continue;
      const spot = bestSpot(near.id, near.f);
      const stage = weeks.find((x) => x.week === spot.week)?.stages.find((x) => x.id === spot.stage);
      if (!stage) continue;
      const nearName = structures.get(near.id)?.name ?? near.id;
      const names = [st.name, st.es ?? '', ...(st.aka ?? [])].filter(Boolean);
      docs.push({
        kind: 'structure',
        week: spot.week,
        stage: spot.stage,
        at: spot.at,
        structure: st.id,
        go: near.id,
        atlasOnly: { near: nearName },
        label: st.name,
        where: stageWhere(spot.week, stage.day),
        names,
        about: [],
        body: tokens(`${st.definition} ${st.location ?? ''} ${st.origin ?? ''} ${st.fate ?? ''}`),
        phrases: names.map((n) => tokens(n).join(' ')).filter(Boolean),
        nameTok: [],
        aboutTok: [],
        blurb: clip(oneLine(firstSentence(st.definition)), 220),
        facts: clip(oneLine(`${st.name}${st.es ? ` (${st.es})` : ''}: ${st.definition} ATLAS ONLY: the simulator has no step of its own for it; ${nearName} is shown in ${stage.title} (${stageWhere(spot.week, stage.day)}).`), 520),
      });
    }
  }

  const df = new Map<string, number>();
  for (const d of docs) {
    d.nameTok = d.names.flatMap(tokens);
    d.aboutTok = d.about.flatMap(tokens);
    for (const t of new Set([...d.nameTok, ...d.aboutTok, ...d.body])) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [t, n] of df) idf.set(t, Math.log(1 + docs.length / (1 + n)));
  return { docs, idf };
}

let built: ReturnType<typeof build> | null = null;
const index = () => (built ??= build());

const FORMATION = /(noiz|nola|sort|erak|forma|cuando|cuándo|como|cómo|when|how|aparec|surge|empie|hasi)/i;
export const isFormationQuestion = (question: string) => FORMATION.test(question);

/** Every word the atlas uses, with its idf (for spelling a misspelt question). */
export const vocabulary = () => index().idf;

/** Ranks where the simulator explains what the student asked about, best first. */
export function search(raw: string, limit = 4, week?: number): Hit[] {
  const { docs, idf } = index();
  // A topic named in the question ("7. gaian") is a filter on where to look, not words to match.
  const asked = topicIn(raw);
  const question = withoutTopic(raw);
  const prefer = asked ?? week;
  const q = queryTokens(question).map((alts) => spell(alts, idf));
  if (!q.length) return [];
  const qFlat = q.map((alts) => alts[0]).join(' ');
  const wantsFormation = isFormationQuestion(question);

  const scored: Hit[] = [];
  for (const doc of docs) {
    const { nameTok: names, aboutTok: about } = doc;
    let score = 0;
    let covered = 0;
    for (const alts of q) {
      let best = 0;
      for (const alt of alts) {
        const weight = idf.get(alt) ?? Math.log(1 + docs.length);
        let field = 0;
        for (const w of names) field = Math.max(field, match(alt, w, true) * 5);
        for (const w of about) field = Math.max(field, match(alt, w, true) * (doc.kind === 'beat' ? 2.2 : 3));
        if (field < 4) for (const w of doc.body) field = Math.max(field, match(alt, w, false));
        best = Math.max(best, field * weight);
      }
      if (best > 0) covered += 1;
      score += best;
    }
    if (score <= 0 || (asked && doc.week !== asked)) continue;
    const cover = covered / q.length;
    score *= 0.4 + 0.6 * (covered / q.length);
    for (const p of doc.phrases) if (p && qFlat.includes(p)) score += 6;
    if (doc.kind === 'structure') score *= wantsFormation ? 1.3 : 1.15;
    else if (doc.kind === 'stage') score *= 0.95;
    if (prefer && doc.week === prefer) score *= asked ? 2 : 1.25;
    const f = doc.kind === 'structure' ? formationOf(doc.structure) : undefined;
    const destination = wantsFormation && f ? {
      ...doc, at: f.start, formation: f.structure, action: 'formation' as const,
      facts: `${doc.facts} SIMULATOR: reviewed formation animation, ${f.beat + 1}. urratsa, ${f.view}; pauses at the end.`,
    } : {
      ...doc, action: 'explanation' as const,
      facts: `${doc.facts} SIMULATOR: explanation only; no reviewed formation animation for this destination. Do not promise to show it forming.`,
    };
    scored.push({ doc: destination, score, cover });
  }
  scored.sort((a, b) => b.score - a.score);

  // One place once: a structure and the step that forms it often coincide.
  const seen = new Set<string>();
  const perStage = new Map<string, number>();
  const out: Hit[] = [];
  for (const h of scored) {
    const key = `${h.doc.week}/${h.doc.stage}/${h.doc.at.toFixed(2)}`;
    const stageKey = `${h.doc.week}/${h.doc.stage}`;
    if (seen.has(key) || (perStage.get(stageKey) ?? 0) >= 2) continue;
    seen.add(key);
    perStage.set(stageKey, (perStage.get(stageKey) ?? 0) + 1);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

/** A hit worth showing without a model's help. */
export const CONFIDENT = 14;
/** …and one that matches most of what was asked ("mesenterio ventrala" must not settle for "ventrala"). */
export const confident = (h: Hit | undefined): h is Hit => !!h && h.score >= CONFIDENT && h.cover >= 0.6;

export const toTarget = (h: Hit, id: string): KimuTarget => ({
  id,
  kind: h.doc.kind,
  week: h.doc.week,
  stage: h.doc.stage,
  at: h.doc.at,
  structure: h.doc.go ?? h.doc.structure,
  formation: h.doc.formation,
  view: h.doc.view,
  action: h.doc.action,
  label: h.doc.label,
  where: h.doc.where,
});

export const factsOf = (h: Hit) => h.doc.facts;
export const blurbOf = (h: Hit) => h.doc.blurb;

/** "Take me to X", "llévame a X", "where is X": the student wants to see it, not to read about it. */
export const GO = /(eraman|eramadazu|eramaidazu|erakutsi|erakuts|\bnon (?:dago|daude|ikus|aurki)|ikusi nahi|joan nahi|ll[eé]v(?:a|ame|arme)|mu[eé]str|ens[eé][nñ]|d[oó]nde (?:est|se ve|lo veo|la veo|los veo|aparec|sale|hay)|quiero ver|\bir a\b|take me|show me|bring me|go to|where (?:is|are|can i see|do i see))/i;
export const wantsPlace = (question: string) => GO.test(question);

/** The step of a stage at stage time `at`. */
const beatAt = (beats: { at: number }[], at: number) => {
  let k = 0;
  beats.forEach((b, i) => { if (b.at <= at + 1e-6) k = i; });
  return k;
};

/** Where a place is from the student's position. */
export function fromHere(here: KimuHere, week: number, stageId: string, at: number): KimuFrom {
  if (week !== here.week) return 'other';
  const stages = weeks.find((w) => w.week === week)?.stages ?? [];
  const si = stages.findIndex((s) => s.id === stageId);
  const hi = stages.findIndex((s) => s.id === here.stage);
  if (si < 0 || hi < 0) return 'other';
  if (si > hi) return si === hi + 1 ? 'next' : 'later';
  if (si < hi) return 'earlier';
  const k = beatAt(stages[si].beats, at);
  return k === here.beat ? 'now' : k > here.beat ? 'ahead' : 'back';
}

/** Marks a destination with where it is from the student (unchanged when Kimu does not know). */
export const withFrom = (t: KimuTarget, here: KimuHere | null): KimuTarget => (here ? { ...t, from: fromHere(here, t.week, t.stage, t.at) } : t);

const FROM_FACT: Record<KimuFrom, string> = {
  now: 'on screen now',
  ahead: 'later in the stage on screen',
  back: 'earlier in the stage on screen',
  next: 'the next stage after the one on screen',
  later: 'further on in the topic on screen',
  earlier: 'earlier in the topic on screen',
  other: 'in another topic',
};

/**
 * The nearest place, at or after where the student is and in the same topic, where a structure is shown:
 * a later step of this stage that lights or names it, else the first later stage that does (or that
 * draws it). Built on the structure's own hit, so it carries the same facts and confidence.
 */
export function nearestFrom(here: KimuHere, hit: Hit): Hit | null {
  const id = hit.doc.structure;
  const week = weeks.find((w) => w.week === here.week);
  const hi = week?.stages.findIndex((s) => s.id === here.stage) ?? -1;
  if (!id || !week || hi < 0) return null;
  const shows = (b: { focus?: string[]; tour?: string[] }) => !!b.focus?.includes(id) || !!b.tour?.includes(id);
  for (let si = hi; si < week.stages.length; si++) {
    const stage = week.stages[si];
    let k = stage.beats.findIndex((b, i) => (si > hi || i >= here.beat) && shows(b));
    if (k < 0 && si > hi && stage.structures.includes(id)) k = 0;
    if (k < 0) continue;
    const beat = stage.beats[k];
    const where = `${week.week}. gaia · ${stage.day}`;
    const from = fromHere(here, week.week, stage.id, beat.at);
    return {
      score: hit.score,
      cover: hit.cover,
      doc: {
        ...hit.doc,
        kind: 'structure',
        week: week.week,
        stage: stage.id,
        at: beat.at,
        structure: id,
        view: beat.view,
        formation: undefined,
        action: 'explanation',
        where,
        facts: `${hit.doc.facts.replace(/ SIMULATOR:.*$/, '')} SIMULATOR: shown in ${stage.title} (${where}), ${k + 1}. urratsa; FROM HERE: ${FROM_FACT[from]}. Explanation only.`,
      },
    };
  }
  return null;
}

/** The structure's place with its position from the student, for the model. */
export const factsFrom = (h: Hit, here: KimuHere | null) =>
  here && !/FROM HERE:/.test(h.doc.facts) ? `${h.doc.facts} FROM HERE: ${FROM_FACT[fromHere(here, h.doc.week, h.doc.stage, h.doc.at)]}.` : h.doc.facts;

/** The step the student is looking at, described for the model. */
export function describeHere(here: { week: number; stage: string; beat: number; structure?: string | null; view?: string }) {
  const week = weeks.find((w) => w.week === here.week);
  const stage = week?.stages.find((s) => s.id === here.stage);
  if (!week || !stage) return null;
  const beat = stage.beats[Math.max(0, Math.min(stage.beats.length - 1, here.beat))];
  const picked = here.structure ? structures.get(here.structure) : null;
  const view = here.view ? stage.views.find((v) => v.id === here.view)?.label : undefined;
  return {
    title: `${week.week}. gaia · ${stage.title}${view ? ` (${view})` : ''}`,
    step: beat ? clip(oneLine(`${beat.idea ?? ''} ${beat.text}`), 320) : '',
    picked: picked ? clip(oneLine(`${picked.name}${picked.es ? ` (${picked.es})` : ''}: ${picked.definition}`), 260) : '',
  };
}

/** Real names for the welcome chips and the "I did not find it" fallback. */
export const SAMPLE_TOPICS = ['notokorda', 'lerro-primitiboa', 'somitak', 'hodi-neurala', 'blastozistoa', 'gandor-neurala'] as const;
