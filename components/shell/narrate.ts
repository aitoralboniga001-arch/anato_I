import { useSyncExternalStore } from 'react';

/** Read-aloud narration for guided mode (Web Speech API). Prefers a Basque voice, then Spanish. */

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

const pickVoice = () => {
  const vs = synth()?.getVoices() ?? [];
  const by = (p: string) => vs.find((v) => v.lang.toLowerCase().startsWith(p));
  return by('eu') ?? by('es') ?? null;
};

export const canNarrate = () => !!synth();

const noop = () => () => {};
/** Speech support, false on the server and during hydration so both renders agree. */
export const useCanNarrate = () => useSyncExternalStore(noop, canNarrate, () => false);

/** Speak `text`, cancelling anything in progress; `onEnd` fires when it finishes (or at once if unsupported). */
export function speak(text: string, onEnd: () => void) {
  const s = synth();
  if (!s) {
    onEnd();
    return;
  }
  s.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/→/g, ', ').replace(/\s+·\s+/g, '. '));
  const v = pickVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else u.lang = 'eu-ES';
  u.rate = 0.95;
  u.onend = onEnd;
  u.onerror = onEnd;
  s.speak(u);
}

export const hush = () => synth()?.cancel();
