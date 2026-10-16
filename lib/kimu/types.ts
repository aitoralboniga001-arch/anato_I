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
  /** Only a reviewed formation id can start a bounded movie. */
  formation?: string;
  view?: string;
  action?: 'formation' | 'explanation';
  /** Open the original notes beside the step, at this sentence. */
  notes?: boolean;
  sentence?: string;
  /** What the button says. */
  label: string;
  /** Where it is: "3. gaia · 16–18. egunak". */
  where: string;
  /** Where it is from the student's position (only when Kimu knows where the student is). */
  from?: KimuFrom;
}

/**
 * A place seen from where the student is: on screen now, later or earlier in this stage, the next
 * stage, further on or earlier in this topic, or another topic.
 */
export type KimuFrom = 'now' | 'ahead' | 'back' | 'next' | 'later' | 'earlier' | 'other';

/** A passage of the original notes an answer rests on. */
export interface KimuSource {
  week: number;
  /** "3.1" as numbered in the notes. */
  section: string;
  title: string;
  /** "7. gaia · 3.1 Diafragmaren atalen eraketa" */
  ref: string;
  /** One or two sentences, verbatim (empty when the answer itself is the quote). */
  quote: string;
  /** The step that shows it, with the notes open there. */
  open?: KimuTarget;
}

/** One practice question from the reviewed pool. */
export interface KimuPractice {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  why?: string[];
  concept?: string;
  week: number;
  stageId?: string;
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
  view?: string;
}

/** What the browser sends the server: the question, the evidence it found, and where the student is. */
export interface KimuAsk {
  question: string;
  history: KimuTurn[];
  /** Passages of the original notes, numbered n1, n2… by position. */
  notes: string[];
  /** Places in the simulator (with their atlas facts), numbered c1, c2… by position. */
  places: string[];
  here: { title: string; step: string; picked: string } | null;
  lang: 'eu' | 'es' | 'en';
}

/** The server's answer: the model's voice, or "not available" (then the browser answers from the notes). */
export type KimuModelReply =
  | { ok: true; reply: string; cite: string[]; go: string[]; followups: string[] }
  | { ok: false; reason: 'nokey' | 'limit' | 'error' };

export interface KimuReply {
  reply: string;
  /** The places Kimu sends the student to, most relevant first. */
  targets: KimuTarget[];
  /** The notes the answer rests on, best first. */
  sources: KimuSource[];
  /** "Nondik dator?": the chain of ancestors, oldest first; "Zertan bihurtzen da?": what it gives rise to. */
  lineage?: { kind: 'from' | 'to'; names: string[] };
  /** A short round of practice questions (from the reviewed pool only). */
  practice?: KimuPractice[];
  followups: string[];
  mood: Mood;
  /** 'ai' = the model answered, 'offline' = built from the notes alone (no key, limit reached, error). */
  source: 'ai' | 'offline';
}
