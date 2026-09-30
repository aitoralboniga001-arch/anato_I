import { offlineReply } from './offline';
import { CONFIDENT, describeHere, factsOf, search, toTarget } from './search';
import { detectLang } from './text';
import type { KimuAsk, KimuHere, KimuModelReply, KimuReply, KimuTurn } from './types';

/** "Explain this", "zer da hau?": the question is about what is on screen, not about a named thing. */
const DEICTIC = /\b(esto|esta|este|eso|aqu[ií]|ahora|hau|hori|hemen|orain|this|here|now)\b/i;

/**
 * One question, start to finish, in the browser: find the places in the notes, ask the model to put them
 * in Kimu's words, and only let it point at the places that were found. When the model is not available
 * (no key, limit reached, no connection) the same places are described from the notes alone.
 */
export async function askKimu(question: string, history: KimuTurn[], here: KimuHere | null): Promise<KimuReply> {
  const lang = detectLang(question);
  const hits = search(question, 4);
  const hereInfo = here && (DEICTIC.test(question) || hits.length === 0 || question.split(' ').length <= 3) ? describeHere(here) : null;

  const payload: KimuAsk = { question, history, notes: hits.map(factsOf), here: hereInfo, lang };
  let model: KimuModelReply = { ok: false, reason: 'error' };
  try {
    const res = await fetch('/api/kimu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) model = (await res.json()) as KimuModelReply;
  } catch {
    // No connection: answered from the notes below.
  }
  if (!model.ok) return offlineReply(hits, lang, model.reason !== 'nokey', question);

  // The model may only cite passages it was given; anything else is dropped.
  const targets = model.go.flatMap((id) => {
    const i = /^c(\d)$/.exec(id)?.[1];
    const h = i ? hits[Number(i) - 1] : undefined;
    return h ? [toTarget(h, id)] : [];
  });
  if (!targets.length && hits[0] && hits[0].score >= CONFIDENT * 1.5) targets.push(toTarget(hits[0], 'c1'));
  return { reply: model.reply, targets, followups: model.followups, mood: model.mood, source: 'ai' };
}
