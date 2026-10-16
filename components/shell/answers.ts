import { useSyncExternalStore } from 'react';

/**
 * Answer history per question, kept in this browser. Each question keeps its streak, a spaced review
 * date (1, 3, 7, 14 days; a wrong answer brings it back at once), its recent attempts and the wrong
 * options chosen (the error log). Mastery is measured per competence, across questions: see
 * `competenceLevel`.
 */
export interface Record_ {
  /** Right answers in a row. */
  streak: number;
  right: number;
  wrong: number;
  /** When it should be reviewed again (ms since epoch). */
  due: number;
  /** Recent attempts: [time, 1 = right / 0 = wrong], oldest first (last 10). */
  hist?: [number, 0 | 1][];
  /** Recent wrong choices (the option text), newest last (last 5). */
  errors?: string[];
}

export type Answers = Record<string, Record_>;

const KEY = 'enbrioatlas:answers';
const DAY = 86_400_000;
const GAPS = [1, 3, 7, 14];
/** Per question: right twice in a row. (Competence mastery is stricter: see `competenceLevel`.) */
export const MASTERED = 2;

let cache: Answers | null = null;
const EMPTY: Answers = {};
const listeners = new Set<() => void>();

const read = (): Answers => {
  if (!cache) {
    try {
      cache = JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Answers;
    } catch {
      cache = {};
    }
  }
  return cache;
};

/**
 * `unsure`: right, but the learner said "Ez nago ziur". It counts as right in the history (it is not an
 * error), yet the streak restarts and it is due at once, so the review brings it back.
 */
export function recordAnswer(id: string, ok: boolean, picked?: string, opts?: { unsure?: boolean }) {
  const prev = read()[id] ?? { streak: 0, right: 0, wrong: 0, due: 0 };
  const unsure = ok && !!opts?.unsure;
  const streak = ok && !unsure ? prev.streak + 1 : 0;
  const now = Date.now();
  const next: Record_ = {
    streak,
    right: prev.right + (ok ? 1 : 0),
    wrong: prev.wrong + (ok ? 0 : 1),
    due: ok && !unsure ? now + GAPS[Math.min(streak, GAPS.length) - 1] * DAY : now,
    hist: [...(prev.hist ?? []), [now, ok ? 1 : 0] as [number, 0 | 1]].slice(-10),
    errors: !ok && picked ? [...(prev.errors ?? []), picked].slice(-5) : prev.errors,
  };
  cache = { ...read(), [id]: next };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage unavailable: the history lasts for this page only.
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** The answer history; empty on the server and during hydration. */
export const useAnswers = () => useSyncExternalStore(subscribe, read, () => EMPTY);

/** Needs review: answered wrong last time, or its review date has come. */
export const isDue = (r: Record_ | undefined, now: number) => !!r && (r.streak === 0 || r.due <= now);
export const isMastered = (r: Record_ | undefined) => !!r && r.streak >= MASTERED;

export type Level = 'berria' | 'lantzen' | 'sendotzen' | 'menderatuta';
export const levelLabel: Record<Level, string> = { berria: 'Landu gabe', lantzen: 'Lantzen', sendotzen: 'Sendotzen', menderatuta: 'Menderatuta' };

/**
 * Mastery of one competence, from every attempt at the questions (and images) that train it.
 * Two right answers in a row are not enough: it takes the last three attempts right, with at least
 * two different questions (or a question and an image) among the right ones when more than one
 * exists, on at least two different days.
 */
export function competenceLevel(answers: Answers, ids: string[]): Level {
  const tries = ids.flatMap((id) => (answers[id]?.hist ?? []).map(([t, ok]) => ({ id, t, ok })));
  if (!tries.length) return ids.some((id) => answers[id]) ? 'lantzen' : 'berria';
  tries.sort((a, b) => a.t - b.t);
  const last = tries.slice(-3);
  const rights = tries.filter((x) => x.ok);
  const formats = new Set(rights.map((x) => x.id)).size;
  const days = new Set(rights.map((x) => Math.floor(x.t / DAY))).size;
  if (last.length === 3 && last.every((x) => x.ok) && (formats >= 2 || ids.length === 1) && days >= 2) return 'menderatuta';
  if (last.length >= 2 && last.slice(-2).every((x) => x.ok)) return 'sendotzen';
  return 'lantzen';
}

/** The wrong options chosen for these questions, newest first (what the learner confuses). */
export const errorsOf = (answers: Answers, ids: string[]) => ids.flatMap((id) => answers[id]?.errors ?? []).reverse();
