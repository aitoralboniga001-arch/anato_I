import { CONFIDENT, SAMPLE_TOPICS, blurbOf, toTarget, type Hit } from './search';
import { structures } from '@/content/registry';
import type { Lang } from './text';
import type { KimuReply } from './types';

/**
 * Kimu's voice when the model is unavailable (no key, limit reached, error): the same places, found
 * by the notes search alone, in a few warm sentences. It should feel like Kimu, not like an error.
 */
const COPY: Record<Lang, { found: (label: string, where: string, blurb: string) => string; tired: string; lost: string; hello: string; ask: (name: string) => string }> = {
  eu: {
    found: (label, where, blurb) => `Hara! **${label}** hemen azaltzen da (${where}). ${blurb} Sakatu botoia eta simulagailuan ikusiko dugu elkarrekin 🌱`,
    tired: 'Nire buru-argia (IA) une batez atseden hartzen ari da, baina apunteetan hau aurkitu dut.',
    hello: 'Kaixo! 🌱 Kimu naiz. Galdetu zer edo noiz sortzen den, eta azalpena hasten den lekura eramango zaitut.',
    lost: 'Mmm, hori ez dut apunteetan topatu. Beste hitz batekin saiatuko dugu? Adibidez:',
    ask: (n) => `Noiz sortzen da ${n}?`,
  },
  es: {
    found: (label, where, blurb) => `¡Mira! **${label}** se explica aquí (${where}). ${blurb} Pulsa el botón y lo vemos juntos en el simulador 🌱`,
    tired: 'Mi cabecita (la IA) está descansando un momento, pero en los apuntes he encontrado esto.',
    hello: '¡Hola! 🌱 Soy Kimu. Pregúntame qué es algo o cuándo se forma y te llevo al punto del simulador donde se explica.',
    lost: 'Mmm, eso no lo he encontrado en los apuntes. ¿Probamos con otra palabra? Por ejemplo:',
    ask: (n) => `¿Cuándo se forma ${n}?`,
  },
  en: {
    found: (label, where, blurb) => `Look! **${label}** is explained here (${where}). ${blurb} Tap the button and we'll watch it together in the simulator 🌱`,
    tired: 'My little brain (the AI) is resting for a moment, but I found this in the notes.',
    hello: "Hi! 🌱 I'm Kimu. Ask me what something is or when it forms and I'll take you to where the simulator explains it.",
    lost: "Hmm, I couldn't find that in the notes. Shall we try another word? For example:",
    ask: (n) => `When does ${n} form?`,
  },
};

/** Tappable examples using real structures (Spanish names for Spanish, Basque otherwise). */
export function sampleQuestions(lang: Lang, n = 3): string[] {
  return SAMPLE_TOPICS.slice(0, n).map((id) => {
    const s = structures.get(id);
    return COPY[lang].ask(lang === 'es' && s?.es ? s.es.toLowerCase() : (s?.name ?? id));
  });
}

const GREETING = /^\s*(hola|buenas|buenos d[ií]as|kaixo|egun on|arratsalde on|hi|hello|hey|ey)\b/i;

export function offlineReply(hits: Hit[], lang: Lang, tired: boolean, question = ''): KimuReply {
  const c = COPY[lang];
  const best = hits[0];
  if (!best && GREETING.test(question)) return { reply: c.hello, targets: [], followups: sampleQuestions(lang), mood: 'happy', source: 'offline' };
  if (!best || best.score < CONFIDENT * 0.7) {
    return { reply: c.lost, targets: [], followups: sampleQuestions(lang), mood: 'curious', source: 'offline' };
  }
  const targets = hits.slice(0, 2).map((h, i) => toTarget(h, `c${i + 1}`));
  const text = c.found(best.doc.label, best.doc.where, blurbOf(best));
  return { reply: tired ? `${c.tired} ${text}` : text, targets, followups: [], mood: 'happy', source: 'offline' };
}
