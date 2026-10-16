import { spokenText, syllables, type VoiceKind } from './speak-eu';

/**
 * The class's voice: the browser's own speech synthesis, no network and no key of ours. A Basque voice
 * when the browser has one (Edge's are online: if one fails or does not start, the class falls back for
 * the rest of the session), else a local Spanish one reading the respelled text (speak-eu.ts), seseo
 * voices first because Basque z is an s. Without any, the class runs on subtitles.
 *
 * Handled pitfalls: one utterance per sentence (long ones get cut), a short gap between cancel() and
 * speak() (back to back, the new one can be dropped), voices that load late (voiceschanged), speech that
 * must first be started inside a click (iPad), and a lost `end` event (a watchdog from `start`).
 */

export interface VoiceChoice {
  voice: SpeechSynthesisVoice;
  kind: VoiceKind;
}

export interface SpeakHandlers {
  /** Word boundary: the character offset in the spoken text and that word. */
  onWord?: (word: string) => void;
  onStart?: () => void;
  onEnd: () => void;
}

const KEY = 'enbrioatlas:klasea:ahotsa';

const synth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

export const voiceSupported = () => !!synth();

/** Rank: Basque, then Spanish with seseo, then Spanish from Spain; local before online within each. */
export function rankVoices(voices: SpeechSynthesisVoice[], offline = false): VoiceChoice[] {
  const score = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase().replace('_', '-');
    let s = lang.startsWith('eu') ? 300 : /^es-(us|mx|419|ar|co|cl|pe|ve)/.test(lang) ? 200 : lang.startsWith('es') ? 150 : -1;
    if (s < 0) return s;
    if (v.localService) s += 20;
    else if (offline) return -1;
    if (/natural|neural|online/i.test(v.name)) s += 10;
    return s;
  };
  return voices
    .map((v) => ({ v, s: score(v) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .map(({ v }) => ({ voice: v, kind: v.lang.toLowerCase().startsWith('eu') ? 'eu' : 'es' }));
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(s.getVoices());
    s.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

export const savedVoiceName = (): string | null => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const saveVoiceName = (name: string) => {
  try {
    window.localStorage.setItem(KEY, name);
  } catch {
    // Storage unavailable: the choice lasts for this page.
  }
};

/** Seconds a line takes at 1× (the class's timing and the watchdog): about 5.5 syllables a second. */
export const speakSeconds = (text: string, rate = 1) => syllables(text) / 5.5 / rate;

export class ClassVoice {
  private choice: VoiceChoice | null = null;
  private fallbacks: VoiceChoice[] = [];
  private token = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  rate = 1;
  stress = true;

  constructor(private readonly onFallback?: (choice: VoiceChoice | null) => void) {}

  get current() {
    return this.choice;
  }

  setRate(rate: number) {
    this.rate = rate;
  }

  async init(preferred?: string | null) {
    const ranked = rankVoices(await loadVoices(), typeof navigator !== 'undefined' && navigator.onLine === false);
    const pick = ranked.find((c) => c.voice.name === preferred) ?? ranked[0] ?? null;
    this.choice = pick;
    this.fallbacks = ranked.filter((c) => c !== pick && c.voice.localService);
    return ranked;
  }

  use(choice: VoiceChoice) {
    this.choice = choice;
    saveVoiceName(choice.voice.name);
  }

  /** Inside a click: an empty utterance unlocks speech for later timers (iPad). */
  prime() {
    const s = synth();
    if (!s) return;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      s.speak(u);
    } catch {
      // Nothing to unlock.
    }
  }

  private clear() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  cancel() {
    this.token += 1;
    this.clear();
    synth()?.cancel();
  }

  /** Says one sentence; `onEnd` fires exactly once (spoken, failed, or given up on). */
  speak(text: string, h: SpeakHandlers) {
    const s = synth();
    this.cancel();
    const token = this.token;
    let ended = false;
    const end = () => {
      if (ended || token !== this.token) return;
      ended = true;
      this.clear();
      h.onEnd();
    };
    if (!s || !this.choice) {
      // No voice: the subtitle is read instead, at reading pace.
      this.timers.push(setTimeout(end, (speakSeconds(text, this.rate) * 1.15 + 0.8) * 1000));
      return;
    }
    const choice = this.choice;
    const said = spokenText(text, choice.kind, this.stress);
    const u = new SpeechSynthesisUtterance(said);
    u.voice = choice.voice;
    u.lang = choice.voice.lang;
    u.rate = this.rate;
    let started = false;
    u.onstart = () => {
      started = true;
      h.onStart?.();
      this.clear();
      this.timers.push(setTimeout(end, (speakSeconds(text, this.rate) * 1.5 + 2) * 1000));
    };
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      const m = /\p{L}+/u.exec(said.slice(e.charIndex));
      if (m) h.onWord?.(m[0]);
    };
    u.onend = end;
    u.onerror = (e) => {
      if (token !== this.token || e.error === 'interrupted' || e.error === 'canceled') return;
      this.fallBack(text, h, token);
    };
    // A short gap after cancel(): spoken back to back, the new utterance can be dropped.
    this.timers.push(
      setTimeout(() => {
        if (token !== this.token) return;
        s.speak(u);
        this.timers.push(
          setTimeout(() => {
            if (!started && token === this.token) this.fallBack(text, h, token);
          }, 2500),
        );
      }, 50),
    );
  }

  private fallBack(text: string, h: SpeakHandlers, token: number) {
    if (token !== this.token) return;
    const next = this.fallbacks.shift() ?? null;
    if (next === this.choice) return;
    this.choice = next;
    this.onFallback?.(next);
    this.speak(text, h);
  }
}
