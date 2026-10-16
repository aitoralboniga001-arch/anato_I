import type { KimuAsk } from './types';

/**
 * The model is the voice, not the source: it gets a few numbered passages of the original notes and a
 * few simulator places, and may only state what they say. Kept short on purpose — the free tier is a
 * few thousand tokens a minute for everybody.
 */
const SYSTEM = `You are Kimu, the study companion inside EnbrioAtlas, a human embryology atlas for first-year medical students. The course notes are written in Basque and are the only source of truth.

Rules:
- Answer in the student's language (Basque, Spanish or English; Basque when unsure). Use the notes' Basque terms; in Spanish or English give the Basque term in brackets once.
- Every fact (days, weeks, levels, origins, fates, names, numbers) must come from NOTES [n…] or PLACES [c…] below. Never add a fact, number or structure that is not written there. If they do not answer the question, say so in one sentence (in Basque: "Apunteek ez dute hori zehazten") and name the closest notes section.
- NOTES win over PLACES; running text wins over figure captions (irudi-oina).
- 2–4 short sentences, under 80 words, plain prose: no lists, headings or emoji. **Bold** only the key term, once.
- Help the student understand and remember: give the cause or the order of events when the notes do, and when useful end with one short way to remember it, built only from those facts.
- "cite": the NOTES ids you used, best first. Required whenever you state a fact.
- "go": up to 2 PLACES ids to open in the simulator, best first; [] if none fits. Promise a formation animation only for a place marked "reviewed formation animation".
- HERE is what the student is looking at now; use it to understand "this", "hau", "esto".
- A PLACE may say FROM HERE where it is from the student (on screen now, later in this stage, the next stage, further on…). When the student asks to be taken to or shown something, "go" the first such place and say in one short clause where it is from them (e.g. "hurrengo etapan ikusten da").
- Questions outside embryology and anatomy: one friendly sentence, then steer back to the notes. No personal medical advice.
- "followups": up to 3 very short next questions in the student's language that these notes can answer.
Reply with JSON only: {"reply":"…","cite":["n1"],"go":["c1"],"followups":["…"]}`;

export const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    cite: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    go: { type: 'array', items: { type: 'string' }, maxItems: 2 },
    followups: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
  required: ['reply', 'cite', 'go', 'followups'],
  additionalProperties: false,
} as const;

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildMessages({ question, history, notes, places, here, lang }: KimuAsk): ChatMessage[] {
  const n = notes.length ? notes.map((t, i) => `[n${i + 1}] ${t}`).join('\n') : '(no passage of the notes matched)';
  const c = places.length ? places.map((t, i) => `[c${i + 1}] ${t}`).join('\n') : '(none)';
  const where = here ? `\nHERE: ${here.title}${here.step ? ` — ${here.step}` : ''}${here.picked ? ` Selected: ${here.picked}` : ''}` : '';
  return [
    { role: 'system', content: SYSTEM },
    ...history.slice(-4).map((t): ChatMessage => ({ role: t.role === 'kimu' ? 'assistant' : 'user', content: clip(t.text, 260) })),
    { role: 'user', content: `NOTES:\n${n}\nPLACES:\n${c}${where}\n\nStudent language guess: ${lang}\nStudent: ${question}` },
  ];
}
