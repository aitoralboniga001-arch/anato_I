import { cuesOf, reached, type Cue, type NamesOf } from './cues';
import { doneAt } from '@/lib/sim/beat-completion';
import type { StageDef } from '@/lib/sim/types';
import type { BoardItem, Check, Chunk, Lesson, Line, Tone } from './types';
import { speakSeconds } from './voice';

/**
 * The class clock: pure and deterministic, like the timeline engine. The lesson is flattened into steps
 * (a line, or a check asked after a line); each line goes through
 *
 *   move (the scene glides to it) → speak → write (its board item, after the speech) → hold → next
 *
 * so only one thing changes at a time. While a line is said, the host reports how many of its cues (the
 * structures it names, in the order it names them: cues.ts) the voice has reached, and only those are lit,
 * named and pointed at. The host feeds back what happened (arrived, spoken, written,
 * held, answered) and turns `commandOf` into calls on the simulator, the voice and the board.
 */

/**
 * How long the scene plays on while a line is said (ms), within bounds: a little quicker than the speech,
 * so what the voice names has been drawn by the time it is named (seen, then named), never the other way.
 */
export const playMs = (text: string, rate = 1) => Math.max(1200, Math.min(9000, (speakSeconds(text, rate) * 0.7 + 0.4) * 1000));

/**
 * What the class knows of the topic beyond the lesson: the structures' names (to cue them as they are
 * said) and the stages' steps (to play the scene on while lines are said).
 */
export interface ClassWorld {
  namesOf?: NamesOf;
  beatsOf?: (stage: string) => StageDef['beats'] | undefined;
}

export type Step = { kind: 'line'; chunk: number; line: number } | { kind: 'check'; chunk: number; check: number };

export type Phase = 'move' | 'speak' | 'write' | 'hold' | 'wait' | 'ask' | 'feedback' | 'done';

export interface ClassState {
  step: number;
  phase: Phase;
  /** "Ez dut ulertu": the current line is being said in its plain wording. */
  plain: boolean;
  /** Chunks the student marked or missed, in the order they were met. */
  weak: string[];
  /** Cues of the line being said that the voice has reached. */
  heard?: number;
}

export type ClassEvent =
  | { type: 'start'; chunk?: number }
  | { type: 'arrived' }
  | { type: 'heard'; n: number }
  | { type: 'spoken' }
  | { type: 'written' }
  | { type: 'held' }
  | { type: 'answered'; ok: boolean; graded: boolean }
  | { type: 'continue' }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'chunk'; chunk: number }
  | { type: 'notUnderstood' };

export type Pose = 'listen' | 'talk' | 'emphasis' | 'caution' | 'think' | 'praise' | 'gentle' | 'look';
export type Gaze = 'specimen' | 'board' | 'student';

const cache = new WeakMap<Lesson, Step[]>();

/** Lines in order, each check slotted after the line it names (or at its chunk's end). */
export function stepsOf(lesson: Lesson): Step[] {
  const hit = cache.get(lesson);
  if (hit) return hit;
  const out: Step[] = [];
  lesson.chunks.forEach((c, ci) => {
    const checks = (c.checks ?? []).map((k, i) => ({ k, i, after: Math.min(k.after ?? c.lines.length - 1, c.lines.length - 1) }));
    if (!c.lines.length) checks.forEach(({ i }) => out.push({ kind: 'check', chunk: ci, check: i }));
    c.lines.forEach((_, li) => {
      out.push({ kind: 'line', chunk: ci, line: li });
      for (const { i, after } of checks) if (after === li) out.push({ kind: 'check', chunk: ci, check: i });
    });
  });
  cache.set(lesson, out);
  return out;
}

const firstPhase = (s: Step | undefined): Phase => (!s ? 'done' : s.kind === 'line' ? 'move' : 'ask');

export const initialState = (): ClassState => ({ step: 0, phase: 'move', plain: false, weak: [], heard: 0 });

const goTo = (lesson: Lesson, state: ClassState, step: number): ClassState => {
  const steps = stepsOf(lesson);
  const at = Math.max(0, Math.min(step, steps.length));
  return { ...state, step: at, phase: firstPhase(steps[at]), plain: false, heard: 0 };
};

const firstOfChunk = (lesson: Lesson, chunk: number) => {
  const i = stepsOf(lesson).findIndex((s) => s.chunk === chunk);
  return i < 0 ? stepsOf(lesson).length : i;
};

const markWeak = (lesson: Lesson, state: ClassState, chunk: number): string[] => {
  const id = lesson.chunks[chunk]?.id;
  return id && !state.weak.includes(id) ? [...state.weak, id] : state.weak;
};

export function reduce(lesson: Lesson, state: ClassState, ev: ClassEvent, learnerPaced = false): ClassState {
  const steps = stepsOf(lesson);
  const step = steps[state.step];
  const line = step?.kind === 'line' ? lesson.chunks[step.chunk].lines[step.line] : null;
  const finishLine = (): ClassState => {
    const next = steps[state.step + 1];
    // Checks already wait for the learner. Group connective lines; stop at a completed teaching point.
    const boundary = line && (line.writes || line.hold || line.tone === 'caution' || line.tone === 'summary' || next?.chunk !== step?.chunk);
    return learnerPaced && boundary && next?.kind === 'line'
      ? { ...state, phase: 'wait' }
      : goTo(lesson, state, state.step + 1);
  };
  const after = (from: 'speak' | 'write'): ClassState => {
    if (from === 'speak' && line?.writes) return { ...state, phase: 'write' };
    if (line?.hold) return { ...state, phase: 'hold' };
    return finishLine();
  };
  switch (ev.type) {
    case 'start':
      return goTo(lesson, state, ev.chunk === undefined ? 0 : firstOfChunk(lesson, ev.chunk));
    case 'chunk':
      return goTo(lesson, state, firstOfChunk(lesson, ev.chunk));
    case 'arrived':
      return state.phase === 'move' ? { ...state, phase: 'speak', heard: 0 } : state;
    case 'heard':
      return state.phase === 'speak' && ev.n > (state.heard ?? 0) ? { ...state, heard: ev.n } : state;
    case 'spoken':
      return state.phase === 'speak' ? after('speak') : state;
    case 'written':
      return state.phase === 'write' ? after('write') : state;
    case 'held':
      return state.phase === 'hold' ? finishLine() : state;
    case 'answered':
      if (state.phase !== 'ask' || !step) return state;
      return { ...state, phase: 'feedback', weak: ev.graded && !ev.ok ? markWeak(lesson, state, step.chunk) : state.weak };
    case 'continue':
      return state.phase === 'feedback' || state.phase === 'wait' ? goTo(lesson, state, state.step + 1) : state;
    case 'next':
      return state.phase === 'done' || state.phase === 'ask' ? state : goTo(lesson, state, state.step + 1);
    case 'back': {
      // To the start of the line before this one (from a line's start), else of this one.
      let i = state.step;
      const started = state.phase !== 'move' && state.phase !== 'ask';
      if (!started || steps[i]?.kind !== 'line') i -= 1;
      while (i > 0 && steps[i]?.kind !== 'line') i -= 1;
      return goTo(lesson, state, Math.max(0, i));
    }
    case 'notUnderstood': {
      // On a check, the explanation it rests on is the line just before it.
      let i = Math.min(state.step, steps.length - 1);
      while (i > 0 && steps[i]?.kind !== 'line') i -= 1;
      const s = steps[i];
      if (!s || s.kind !== 'line') return state;
      return { ...state, step: i, phase: 'move', plain: true, heard: 0, weak: markWeak(lesson, state, s.chunk) };
    }
  }
}

export interface ClassCommand {
  chunk: Chunk;
  chunkIndex: number;
  stage: string;
  view?: string;
  /**
   * Stage time the scene should be at: the latest `at` met in this chunk; lines said at the same time
   * share out the step's play (see `placeOf`), so the scene moves on under each of them.
   */
  at: number;
  /** Where the scene plays to while the line is said (with the stages' steps known), else undefined. */
  playTo?: number;
  line: Line | null;
  check: Check | null;
  /** The sentence being said (plain wording after "Ez dut ulertu"). */
  text: string;
  tone: Tone;
  /** Lit now: what the line has named so far (the last line's, until it names its first). */
  focus: string[];
  /** The line's cues: what it names, in the order it names them, and where. */
  cues: Cue[];
  /** What Kimu points at now: the structure just named (null: nothing named yet). */
  point: string | null;
  /** Named so far by the line being said (all of it once said). */
  heardIds: string[];
  /** Named so far in this chunk (their names show); `allNames` at the chunk's last step. */
  said: string[];
  allNames: boolean;
  /** Board items and table cells written so far (the whole class). */
  written: string[];
  board: BoardItem[];
  pose: Pose;
  gaze: Gaze;
  /** Fraction of the class done, for the progress bar. */
  progress: number;
}

const POSE: Record<Tone, Pose> = { explain: 'talk', emphasis: 'emphasis', caution: 'caution', why: 'talk', recall: 'talk', summary: 'talk' };

/** A line's cues, as said now (its plain wording after "Ez dut ulertu"). */
export function lineCues(line: Line, plain: boolean, namesOf?: NamesOf): Cue[] {
  const text = plain && line.plain ? line.plain : line.say;
  return cuesOf(text, line.focus ?? [], namesOf, line.cues);
}

/** Each step's stage and stage time as written (lines inherit both, as `commandOf` reads them). */
const written = new WeakMap<Lesson, ({ stage: string; at: number } | null)[]>();
function writtenPlaces(lesson: Lesson) {
  const hit = written.get(lesson);
  if (hit) return hit;
  const out = stepsOf(lesson).map((s) => {
    if (s.kind !== 'line') return null;
    const c = lesson.chunks[s.chunk];
    let stage = c.stage;
    let at = 0;
    for (const l of c.lines.slice(0, s.line + 1)) {
      if (l.stage && l.stage !== stage) [stage, at] = [l.stage, 0];
      if (l.at !== undefined) at = l.at;
    }
    return { stage, at };
  });
  written.set(lesson, out);
  return out;
}

/**
 * Where a line is said and how far the scene plays on under it. A step's lines said at the same stage
 * time share out the step's play in proportion to how long each is said: each starts where the last
 * stopped, so the scene never sits on the step's first frame for several lines (naming what it has not
 * drawn yet) and never jumps back. The last plays to the step's finished frame, or to the next line.
 */
export function placeOf(lesson: Lesson, step: number, beatsOf: NonNullable<ClassWorld['beatsOf']>): { at: number; to: number } | null {
  const steps = stepsOf(lesson);
  const places = writtenPlaces(lesson);
  const here = places[step];
  if (!here) return null;
  const same = (i: number) => {
    const p = places[i];
    return !!p && p.stage === here.stage && Math.abs(p.at - here.at) < 1e-6;
  };
  // The run of lines said at this time (checks in between do not break it).
  let a = step;
  for (let i = step - 1; i >= 0 && (steps[i].kind === 'check' || same(i)); i--) if (same(i)) a = i;
  let b = step;
  for (let i = step + 1; i < steps.length && (steps[i].kind === 'check' || same(i)); i++) if (same(i)) b = i;
  const run = steps.map((_, i) => i).filter((i) => i >= a && i <= b && places[i]);
  const nextAt = (() => {
    for (let i = b + 1; i < steps.length; i++) if (places[i]) return places[i]!.stage === here.stage && places[i]!.at > here.at ? places[i]!.at : undefined;
    return undefined;
  })();
  const beats = beatsOf(here.stage);
  const k = beats ? Math.max(0, beats.findLastIndex((x) => x.at <= here.at + 1e-9)) : -1;
  const end = Math.max(here.at, Math.min(beats && k >= 0 ? doneAt({ beats }, k) : 1, nextAt ?? 1));
  const said = (i: number) => {
    const s = steps[i];
    return s.kind === 'line' ? speakSeconds(lesson.chunks[s.chunk].lines[s.line].say) : 0;
  };
  const total = run.reduce((n, i) => n + said(i), 0) || 1;
  const before = run.filter((i) => i < step).reduce((n, i) => n + said(i), 0);
  return { at: here.at + ((end - here.at) * before) / total, to: here.at + ((end - here.at) * (before + said(step))) / total };
}

export function commandOf(lesson: Lesson, state: ClassState, lastOk?: boolean, world: ClassWorld = {}): ClassCommand {
  const { namesOf } = world;
  const steps = stepsOf(lesson);
  const done = state.phase === 'done';
  const idx = Math.min(state.step, steps.length - 1);
  const step = steps[idx];
  const chunkIndex = step?.chunk ?? 0;
  const chunk = lesson.chunks[chunkIndex];
  const line = !done && step?.kind === 'line' ? chunk.lines[step.line] : null;
  const check = !done && step?.kind === 'check' ? chunk.checks?.[step.check] ?? null : null;
  const upTo = step?.kind === 'line' ? step.line : step ? lastLineBefore(steps, idx) : -1;
  const spokenYet = state.phase !== 'move';
  const met = chunk.lines.slice(0, upTo + 1);
  const shown = met.filter((_, i) => i < upTo || spokenYet || step?.kind !== 'line');

  let at = 0;
  let stage = chunk.stage;
  let view = chunk.view;
  for (const l of met) {
    if (l.stage && l.stage !== stage) [stage, at, view] = [l.stage, 0, undefined];
    if (l.at !== undefined) at = l.at;
    if (l.view) view = l.view;
  }

  // The line's place in the step's play, when the stages' steps are known.
  const place = world.beatsOf && step?.kind === 'line' && !done ? placeOf(lesson, idx, world.beatsOf) : null;
  if (place && place.at >= at - 1e-9) at = place.at;

  const written: string[] = [];
  steps.forEach((s, i) => {
    if (s.kind !== 'line') return;
    const w = lesson.chunks[s.chunk].lines[s.line].writes;
    if (!w) return;
    if (done || i < state.step || (i === state.step && (state.phase === 'write' || state.phase === 'hold' || state.phase === 'wait'))) written.push(w);
  });

  // While the scene moves to a line, and until it names its first structure, the last line's structures
  // stay lit (no flicker between lines).
  const prev = (state.phase === 'move' || state.phase === 'speak') && step?.kind === 'line' ? steps[idx - 1] : undefined;
  const held = prev?.kind === 'line' && prev.chunk === chunkIndex ? chunk.lines[prev.line].focus ?? [] : [];

  // Cues: while it is said, only what the voice has reached; all of it once said.
  const cues = line ? lineCues(line, state.plain, namesOf) : [];
  const upToCue = state.phase === 'move' ? 0 : state.phase === 'speak' ? Math.min(Math.max(state.heard ?? 0, reached(cues, 0)), cues.length) : cues.length;
  const heardIds = [...new Set(cues.slice(0, upToCue).map((c) => c.id))];
  const zer = check?.kind === 'zer-da-hau' ? check.structure : null;

  const lastInChunk = steps.findLastIndex((s) => s.chunk === chunkIndex);
  const pose: Pose =
    done ? 'praise'
    : state.phase === 'speak' ? POSE[line?.tone ?? 'explain']
    : state.phase === 'ask' ? 'think'
    : state.phase === 'feedback' ? (lastOk === false ? 'gentle' : 'praise')
    : state.phase === 'move' || state.phase === 'hold' ? 'look'
    : 'listen';
  const gaze: Gaze = state.phase === 'write' ? 'board' : state.phase === 'ask' || state.phase === 'feedback' || done ? 'student' : 'specimen';

  return {
    chunk,
    chunkIndex,
    stage,
    view,
    at,
    playTo: place?.to,
    line,
    check,
    text: line ? (state.plain && line.plain ? line.plain : line.say) : '',
    tone: line?.tone ?? 'explain',
    focus: line ? (state.phase !== 'move' && heardIds.length ? heardIds : held) : zer ? [zer] : [],
    cues,
    point: line ? (upToCue ? cues[upToCue - 1].id : null) : zer,
    heardIds,
    said: [...new Set([...shown.slice(0, line ? upTo : shown.length).flatMap((l) => l.focus ?? []), ...heardIds])],
    allNames: done || (state.step >= lastInChunk && state.phase !== 'move'),
    written,
    board: lesson.chunks.flatMap((c) => c.board ?? []),
    pose,
    gaze,
    progress: steps.length ? Math.min(1, state.step / steps.length) : 1,
  };
}

function lastLineBefore(steps: Step[], i: number): number {
  for (let k = i; k >= 0; k -= 1) {
    const s = steps[k];
    if (s.kind === 'line' && s.chunk === steps[i].chunk) return s.line;
    if (s.chunk !== steps[i].chunk) break;
  }
  return -1;
}
