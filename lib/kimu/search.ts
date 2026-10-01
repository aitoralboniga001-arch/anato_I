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
import type { KimuTarget } from './types';
import { dice, queryTokens, tokens } from './text';

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
}

export interface Hit {
  doc: Doc;
  score: number;
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

/** How well a query word matches a document word (1 = same, 0 = unrelated). */
function match(q: string, w: string, fuzzy: boolean): number {
  if (q === w) return 1;
  const [short, long] = q.length <= w.length ? [q, w] : [w, q];
  if (short.length >= 4 && long.startsWith(short) && short.length / long.length >= 0.6) return 0.85;
  if (fuzzy && short.length >= 5) {
    const d = dice(q, w);
    if (d >= 0.6) return d * 0.8;
  }
  return 0;
}

const FORMATION = /(noiz|nola|sort|erak|forma|cuando|cuándo|como|cómo|when|how|aparec|surge|empie|hasi)/i;
export const isFormationQuestion = (question: string) => FORMATION.test(question);

/** Ranks where the simulator explains what the student asked about, best first. */
export function search(question: string, limit = 4): Hit[] {
  const { docs, idf } = index();
  const q = queryTokens(question);
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
    if (score <= 0) continue;
    score *= 0.4 + 0.6 * (covered / q.length);
    for (const p of doc.phrases) if (p && qFlat.includes(p)) score += 6;
    if (doc.kind === 'structure') score *= wantsFormation ? 1.3 : 1.15;
    else if (doc.kind === 'stage') score *= 0.95;
    const f = doc.kind === 'structure' ? formationOf(doc.structure) : undefined;
    const destination = wantsFormation && f ? {
      ...doc, at: f.start, formation: f.structure, action: 'formation' as const,
      facts: `${doc.facts} SIMULATOR: reviewed formation animation, ${f.beat + 1}. urratsa, ${f.view}; pauses at the end.`,
    } : {
      ...doc, action: 'explanation' as const,
      facts: `${doc.facts} SIMULATOR: explanation only; no reviewed formation animation for this destination. Do not promise to show it forming.`,
    };
    scored.push({ doc: destination, score });
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

export const toTarget = (h: Hit, id: string): KimuTarget => ({
  id,
  kind: h.doc.kind,
  week: h.doc.week,
  stage: h.doc.stage,
  at: h.doc.at,
  structure: h.doc.structure,
  formation: h.doc.formation,
  view: h.doc.view,
  action: h.doc.action,
  label: h.doc.label,
  where: h.doc.where,
});

export const factsOf = (h: Hit) => h.doc.facts;
export const blurbOf = (h: Hit) => h.doc.blurb;

/** The step the student is looking at, described for the model. */
export function describeHere(here: { week: number; stage: string; beat: number; structure?: string | null }) {
  const week = weeks.find((w) => w.week === here.week);
  const stage = week?.stages.find((s) => s.id === here.stage);
  if (!week || !stage) return null;
  const beat = stage.beats[Math.max(0, Math.min(stage.beats.length - 1, here.beat))];
  const picked = here.structure ? structures.get(here.structure) : null;
  return {
    title: `${week.week}. gaia · ${stage.title}`,
    step: beat ? clip(oneLine(`${beat.idea ?? ''} ${beat.text}`), 320) : '',
    picked: picked ? clip(oneLine(`${picked.name}${picked.es ? ` (${picked.es})` : ''}: ${picked.definition}`), 260) : '',
  };
}

/** Real names for the welcome chips and the "I did not find it" fallback. */
export const SAMPLE_TOPICS = ['notokorda', 'lerro-primitiboa', 'somitak', 'hodi-neurala', 'blastozistoa', 'gandor-neurala'] as const;
