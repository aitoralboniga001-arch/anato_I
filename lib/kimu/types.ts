/** Shared between the /api/kimu route and the chat UI. */

export type Mood = 'happy' | 'curious' | 'thinking' | 'proud' | 'sorry';

export const MOODS: readonly Mood[] = ['happy', 'curious', 'thinking', 'proud', 'sorry'];

/** A place in the simulator: the step where something is explained. */
export interface KimuTarget {
  /** Stable within one reply ("c1", "c2"…): what the model cites. */
  id: string;
  kind: 'structure' | 'beat' | 'stage';
  week: number;
  stage: string;
  /** Stage time (0..1) where the explanation starts. */
  at: number;
  /** Structure to select on arrival. */
  structure?: string;
  /** What the button says. */
  label: string;
  /** Where it is: "3. gaia · 16–18. egunak". */
  where: string;
}

export interface KimuTurn {
  role: 'user' | 'kimu';
  text: string;
}

/** Where the student is right now (ids: the browser looks the names up before asking). */
export interface KimuHere {
  week: number;
  stage: string;
  beat: number;
  structure?: string | null;
}

/** What the browser sends the server: the question, the passages it found, and where the student is. */
export interface KimuAsk {
  question: string;
  history: KimuTurn[];
  /** Passages of the notes the browser found, numbered c1, c2… by position. */
  notes: string[];
  here: { title: string; step: string; picked: string } | null;
  lang: 'eu' | 'es' | 'en';
}

/** The server's answer: the model's voice, or "not available" (then the browser answers from the notes). */
export type KimuModelReply = { ok: true; reply: string; go: string[]; followups: string[]; mood: Mood } | { ok: false; reason: 'nokey' | 'limit' | 'error' };

export interface KimuReply {
  reply: string;
  /** The places Kimu sends the student to, most relevant first. */
  targets: KimuTarget[];
  followups: string[];
  mood: Mood;
  /** 'ai' = the model answered, 'offline' = built from the notes alone (no key, limit reached, error). */
  source: 'ai' | 'offline';
}
