import { MOODS, type KimuAsk } from './types';

/**
 * The model is the voice, not the source: it gets a few numbered passages from the course notes and
 * may only send the student to one of those. Kept short on purpose — the free tier is a few
 * thousand tokens a minute for everybody.
 */
const SYSTEM = `You are Kimu, the warm little sprout-embryo who guides students through EnbrioAtlas, an interactive human embryology simulator for first-year medical students. The course notes are in Basque.

Personality: kind, curious, encouraging, a bit playful, like a friendly older classmate. Celebrate curiosity, never talk down. At most one emoji (🌱 is yours).

Rules:
- Answer in the student's language (Basque, Spanish or English; Basque if unclear). 1–4 short sentences, under 70 words. No lists, no headings. **Bold** only the key term.
- Use ONLY the NOTES below for facts (dates, origins, fates). Never invent. If they don't cover the question, say so honestly and offer the closest place.
- Use the notes' Basque term, adding the Spanish name in brackets when you answer in Spanish.
- To take the student somewhere in the simulator, put the passage ids in "go" (max 2, best first) and say you are taking them there. If nothing fits or the question is general, "go" is [].
- Respect each passage's SIMULATOR metadata: promise a formation movie only for a reviewed formation animation. Otherwise offer the explanation and say that a reviewed formation movie is unavailable. The app fixes the view and playback range; never invent a destination or animation.
- Off-topic: answer in one friendly line and steer back to embryology. No personal medical advice.
- "followups": up to 3 very short questions the student may tap next, in their language.
- "mood": happy, curious, thinking, proud or sorry.
Reply with JSON only: {"reply":"…","go":["c1"],"followups":["…"],"mood":"happy"}`;

export const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    go: { type: 'array', items: { type: 'string' }, maxItems: 2 },
    followups: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    mood: { type: 'string', enum: [...MOODS] },
  },
  required: ['reply', 'go', 'followups', 'mood'],
  additionalProperties: false,
} as const;

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildMessages({ question, history, notes, here, lang }: KimuAsk): ChatMessage[] {
  const list = notes.length ? notes.map((n, i) => `[c${i + 1}] ${n}`).join('\n') : '(nothing in the notes matched)';
  const where = here ? `\nHERE (what the student is looking at now, not a destination): ${here.title}${here.step ? ` — ${here.step}` : ''}${here.picked ? ` Selected: ${here.picked}` : ''}` : '';
  return [
    { role: 'system', content: SYSTEM },
    ...history.slice(-4).map((t): ChatMessage => ({ role: t.role === 'kimu' ? 'assistant' : 'user', content: clip(t.text, 260) })),
    { role: 'user', content: `NOTES:\n${list}${where}\n\nStudent language guess: ${lang}\nStudent: ${question}` },
  ];
}
