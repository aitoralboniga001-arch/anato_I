import { offlineReply } from './offline';
import { CONFIDENT, describeHere, factsOf, search, toTarget } from './search';
import { detectLang } from './text';
import { structures } from '@/content/registry';
import type { KimuAsk, KimuHere, KimuModelReply, KimuReply, KimuTurn } from './types';

/** "Explain this", "zer da hau?": the question is about what is on screen, not about a named thing. */
const DEICTIC = /\b(esto|esta|este|eso|aqu[ií]|ahora|hau|hori|hemen|orain|this|here|now)\b/i;

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
  return structure ? `${question} (${structure.es ?? structure.name})` : question;
}

/**
 * One question, start to finish, in the browser: find the places in the notes, ask the model to put them
 * in Kimu's words, and only let it point at the places that were found. When the model is not available
 * (no key, limit reached, no connection) the same places are described from the notes alone.
 */
export async function askKimu(question: string, history: KimuTurn[], here: KimuHere | null): Promise<KimuReply> {
  const lang = detectLang(question);
  const hits = search(retrievalQuestion(question, history, here), 4);
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
  // A reviewed formation destination is determined by the question, not by the model's citation choice.
  if (hits[0]?.doc.formation && hits[0].score >= CONFIDENT) {
    const first = toTarget(hits[0], 'c1');
    targets.splice(0, targets.length, first, ...targets.filter(t => t.id !== first.id).slice(0, 1));
  }
  return { reply: model.reply, targets, followups: model.followups, mood: model.mood, source: 'ai' };
}
