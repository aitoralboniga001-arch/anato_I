/**
 * One question pool for the whole atlas: the notes' own questions, the generated ones and the
 * micro-questions of the guided steps. Every question is tagged with the structure it is about
 * (concept) and the competence it trains, so progress is measured per competence, not per item,
 * and a review can re-test the same competence with a different question.
 */
import { generated, type Skill } from './generate';
import { structures, weeks } from './registry';
import type { Competence } from '@/lib/sim/types';

export type { Competence };

export const COMPETENCES: { id: Competence; label: string; hint: string }[] = [
  { id: 'noiz', label: 'Noiz?', hint: 'Kronologia: eguna, astea, ordena, zer dagoen eta zer ez' },
  { id: 'jatorria', label: 'Nondik?', hint: 'Jatorria: zein egitura edo ernetze orritatik dator' },
  { id: 'eraketa', label: 'Nola sortzen da?', hint: 'Eraketa: prozesuaren urratsak' },
  { id: 'kokapena', label: 'Non?', hint: 'Kokapena: non dagoen eta zeren artean' },
  { id: 'erlazioak', label: 'Erlazioak', hint: 'Zer den zer, zerekin jarraitzen duen, zer osatzen duten' },
  { id: 'patua', label: 'Zertan bihurtzen da?', hint: 'Patua: eratorriak eta helmuga' },
  { id: 'kausa', label: 'Zergatik?', hint: 'Kausalitatea: zerk eragiten duen' },
  { id: 'irudia', label: 'Irudian', hint: 'Irudi batean ezagutzea (Aurkitu)' },
];
export const competenceLabel = Object.fromEntries(COMPETENCES.map((c) => [c.id, c.label])) as Record<Competence, string>;

export type Source = 'apunteak' | 'urratsa' | 'sortua';
export const sourceLabel: Record<Source, string> = { apunteak: 'Apunteak', urratsa: 'Urratsa', sortua: 'Sortua' };

export interface PoolQuestion {
  id: string;
  source: Source;
  comp: Competence;
  concept?: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  why?: string[];
  week: number;
  stageId?: string;
}

const SKILL_COMP: Record<Skill, Competence> = { kronologia: 'noiz', ordena: 'noiz', jatorria: 'jatorria', eratorria: 'patua', definizioa: 'erlazioak', kokapena: 'kokapena' };

/** Competence from the wording of a hand-written question (Basque question words). */
export function inferCompetence(text: string): Competence {
  const t = text.toLowerCase();
  if (/zergatik|zerk eragiten|eragiten du|induzitzen|eragilea|kausa|beharrezkoa/.test(t)) return 'kausa';
  if (/^noiz|noiz|zein egun|zein astetan|astetarako|zenbat egun|zenbat irauten|zein hilabete|ordena/.test(t)) return 'noiz';
  if (/zertan|eratorri|emango|sortuko|garatuko|bihurtzen/.test(t)) return 'patua';
  if (/nondik|jatorri|zein orritatik|zein ernetze/.test(t)) return 'jatorria';
  if (/\bnon\b|kokatu|kokatzen|zeren artean|alde/.test(t)) return 'kokapena';
  if (/nola|zer gertatzen|prozesu|sortzen da|eratzen da/.test(t)) return 'eraketa';
  return 'erlazioak';
}

// Structure names (and alternative names) as word-initial stems: Basque adds case endings to the
// name ("trofoblasto-tik", "kotiledoi-ei"), so the final -a / -ak is dropped when the stem is long enough.
const stem = (n: string) => {
  const b = n.replace(/(ak|a)$/, '');
  return b.length >= 6 ? b : n;
};
const NAMES: [RegExp, number, string][] = [...structures.values()]
  .flatMap((s) => [s.name, ...(s.aka ?? [])].map((n) => [stem(n.toLowerCase()), s.id] as const))
  .filter(([n]) => n.length >= 5)
  .map(([n, id]): [RegExp, number, string] => [new RegExp(`(^|[^a-zñ])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), n.length, id]);

/** The structure a question is about: the first one named in the question (longest on a tie), else in its answer. */
export function inferConcept(question: string, answer = ''): string | undefined {
  for (const text of [question.toLowerCase(), answer.toLowerCase()]) {
    let best: { at: number; len: number; id: string } | null = null;
    for (const [re, len, id] of NAMES) {
      const m = re.exec(text);
      if (!m) continue;
      const at = m.index + m[1].length;
      if (!best || at < best.at || (at === best.at && len > best.len)) best = { at, len, id };
    }
    if (best) return best.id;
  }
  return undefined;
}

/** Hand-checked tags where the wording misleads the inference (manual audit of the pool). */
const TAGS: Record<string, { comp?: Competence; concept?: string }> = {
  'w1-q-trofoblastoa': { comp: 'patua', concept: 'trofoblastoa' },
  'w1-q-obulazioa': { concept: 'obozito-sekundarioa' },
  'w1-q-kortikala': { concept: 'erreakzio-kortikala' },
  'w3a-q-hazkundea-kraneala': { concept: 'gastrulazioa' },
  'w5-q-goiko-hasikina': { concept: 'goiko-gorputz-adarraren-hasikina' },
  'w5-q-somitak-28': { comp: 'noiz', concept: 'somitak' },
  'w6-q-kapsularra': { concept: 'dezidua-kapsularra' },
  'w1-q-ezohikoa': { comp: 'kokapena', concept: 'habiratzea' },
  'w2-q-heuser-jatorria': { comp: 'jatorria', concept: 'heuser-mintza' },
  'w2-q-amnioblastoak': { comp: 'jatorria', concept: 'amnioblastoak' },
  'w3a-q-bukaera-diskoa': { concept: 'bi-orriko-diskoa' },
  'w3a-q-endodermo-jatorria': { concept: 'endodermoa' },
  'w3b-q-zirkulazio-funtzionala': { concept: 'zirkulazio-uteroplazentarioa' },
  'w4-q-fusio-hasiera': { comp: 'kausa', concept: 'tolesdura-neuralak' },
  'w4-q-neuroporoak-amnios': { comp: 'erlazioak', concept: 'neuroporo-kraneala' },
  'w4-q-ile-azazkalak': { comp: 'jatorria', concept: 'melanozitoak' },
  'w5-q-sudur-plaka': { concept: 'sudur-plaka' },
  'w6-q-muga-lau': { comp: 'erlazioak' },
  'w6-q-muga-bi': { comp: 'erlazioak' },
  'w6-q-kotiledoiak': { concept: 'kotiledoiak' },
  'w6-q-likidoa': { comp: 'erlazioak', concept: 'likido-amniotikoa' },
  'mikro:4/neurulazioa:3': { comp: 'eraketa', concept: 'tolesdura-neuralak' },
  'mikro:4/mesodermoa-banatzen:6': { concept: 'errai-orria' },
};

const notes: PoolQuestion[] = weeks.flatMap((w) =>
  w.quiz.map((q): PoolQuestion => ({
    ...q,
    source: 'apunteak',
    comp: q.comp ?? TAGS[q.id]?.comp ?? inferCompetence(q.question),
    concept: q.concept ?? TAGS[q.id]?.concept ?? inferConcept(q.question, q.options[q.answer]),
    week: w.week,
  })),
);

const micro: PoolQuestion[] = weeks.flatMap((w) =>
  w.stages.flatMap((st) =>
    st.beats.flatMap((b, k): PoolQuestion[] => {
      const id = `mikro:${w.week}/${st.id}:${k}`;
      return b.ask
        ? [
            {
              // Same id the guided dock records under, so both places share one history.
              id,
              source: 'urratsa',
              comp: b.ask.comp ?? TAGS[id]?.comp ?? inferCompetence(b.ask.q),
              concept: b.ask.concept ?? TAGS[id]?.concept ?? inferConcept(b.ask.q, b.ask.options[b.ask.answer]) ?? b.focus?.[0],
              question: b.ask.q,
              options: b.ask.options,
              answer: b.ask.answer,
              why: b.ask.why,
              explanation: b.ask.why[b.ask.answer],
              week: w.week,
              stageId: st.id,
            },
          ]
        : [];
    }),
  ),
);

const gen: PoolQuestion[] = generated.map((g) => ({ ...g, source: 'sortua', comp: SKILL_COMP[g.skill] }));

export const POOL: PoolQuestion[] = [...notes, ...micro, ...gen];

/** Competence key: what "mastering" is measured on (a structure × a competence, or a competence alone). */
export const compKey = (comp: Competence, concept?: string) => `${comp}:${concept ?? '*'}`;
/** The id under which an image-recognition attempt ("Aurkitu") is recorded. */
export const imageId = (concept: string) => `irudia:${concept}`;

/** Every recorded id that feeds a competence key (questions + image attempts). */
export const KEY_IDS: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const q of POOL) {
    const k = compKey(q.comp, q.concept);
    m.set(k, [...(m.get(k) ?? []), q.id]);
  }
  return m;
})();

export const keyOfId = (id: string): string | undefined => {
  if (id.startsWith('irudia:')) return compKey('irudia', id.slice(7));
  const q = POOL.find((x) => x.id === id);
  return q && compKey(q.comp, q.concept);
};
