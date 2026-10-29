'use client';

import { useEffect, useRef, useState } from 'react';
import { getWeek, structures } from '@/content/registry';
import { reached, type NamesOf } from '@/lib/klasea/cues';
import { commandOf, initialState, playMs, reduce, stepsOf, type ClassEvent, type ClassState, type ClassWorld } from '@/lib/klasea/engine';
import type { Lesson } from '@/lib/klasea/types';
import { savedClassPlace, type SavedClassPlace } from '@/lib/klasea/resume';
import { ClassVoice, savedVoiceName, voiceSupported, type VoiceChoice } from '@/lib/klasea/voice';

/**
 * The class's host logic: the engine's state, the voice, and the scene moves, kept out of the simulator.
 * The simulator hands over a driver (its own glide, place and camera moves, so every view change still
 * moves the camera) and renders what this returns: the dock, the board and Kimu.
 */

export interface ClassDriver {
  /** Move the scene to this stage and time (gliding when it is ahead, `rate` times faster); `then` once there and still. */
  go: (stage: string, t: number, then: () => void, view?: string, rate?: number) => void;
  /** Play the current step on to its finished frame over `ms` (never past `until`, where the next line
   *  of this stage starts): its change, seen while it is said. */
  play: (ms: number, until?: number) => void;
  /** Stop any scene motion. */
  halt: () => void;
}

export type ClassStatus = 'card' | 'running' | 'done';

/** Where a link opened the topic: the class offers to start at the chunk that teaches it. */
export interface ClassLink {
  stage: string;
  t: number;
  /** `klasea=<chunk id>` in the link: the class was running there. */
  chunk?: string | null;
}

const RATES = [0.8, 1, 1.25, 1.5, 1.75, 2];
/** A rate saved by an older build (1.15, 1.3) becomes the nearest one offered now. */
const nearestRate = (r: number) => RATES.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
const RATE_KEY = 'enbrioatlas:klasea:abiadura';
const PACING_KEY = 'enbrioatlas:klasea:learner-paced';
const placeKey = (week: number) => `enbrioatlas:klasea:${week}`;

/** A structure's names as a line may say them (its name and other names). */
export const namesOf: NamesOf = (id) => {
  const s = structures.get(id);
  return s ? [s.name, ...(s.aka ?? [])] : [];
};

/** The topic as the class needs it: the names it cues, the steps it plays on under its lines. */
export const worldOf = (week: number): ClassWorld => ({ namesOf, beatsOf: (id) => getWeek(week)?.stages.find((s) => s.id === id)?.beats });

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const writeJson = (key: string, v: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Storage unavailable: the place lasts for this page.
  }
};

/** The chunk that teaches a place: the last one on that stage whose lines start at or before it. */
export function chunkAt(lesson: Lesson, stage: string, t: number): number | null {
  let best: number | null = null;
  lesson.chunks.forEach((c, i) => {
    let st = c.stage;
    let at = 0;
    for (const l of c.lines) {
      if (l.stage) st = l.stage;
      if (l.at !== undefined) at = l.at;
      if (st === stage && at <= t + 1e-6) {
        best = i;
        break;
      }
    }
  });
  return best;
}

export function useKlasea({ lesson, enabled, driver, hold, link }: { lesson: Lesson; enabled: boolean; driver: ClassDriver; hold: boolean; link: ClassLink | null }) {
  const [state, setState] = useState<ClassState>(initialState);
  const [status, setStatus] = useState<ClassStatus>('card');
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastOk, setLastOk] = useState<boolean | undefined>(undefined);
  /** The word being said (Kimu's mouth), and whether the voice is sounding. */
  const [word, setWord] = useState('');
  const [speaking, setSpeaking] = useState(false);
  /** What a check lights by itself (an order chip, a filled cell). */
  const [checkFocus, setCheckFocus] = useState<string[]>([]);
  /** "Ez dut ulertu" already pressed on this step: the next press opens Kimu. */
  const [plainOn, setPlainOn] = useState<number | null>(null);
  const [voices, setVoices] = useState<VoiceChoice[]>([]);
  const [choice, setChoice] = useState<VoiceChoice | null>(null);
  const [fellBack, setFellBack] = useState(false);
  const [rate, setRateState] = useState(1);
  const [learnerPaced, setLearnerPaced] = useState(true);
  const [saved, setSaved] = useState<SavedClassPlace | null>(null);

  const [voice] = useState(() => new ClassVoice((c) => {
    setChoice(c);
    setFellBack(true);
  }));
  const driverRef = useRef(driver);
  useEffect(() => {
    driverRef.current = driver;
  });

  const paused = userPaused || hidden || hold;
  const running = enabled && status === 'running';
  const [world] = useState(() => worldOf(lesson.week));
  const cmd = commandOf(lesson, state, lastOk, world);
  const steps = stepsOf(lesson);
  const step = steps[Math.min(state.step, steps.length - 1)];

  // Saved place and rate, read once on the client.
  useEffect(() => {
    const r = readJson<number>(RATE_KEY);
    const p = readJson<unknown>(placeKey(lesson.week));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage only exists after mount
    if (typeof r === 'number' && r > 0) setRateState(nearestRate(r));
    setSaved(savedClassPlace(lesson, p));
    const pacing = readJson<unknown>(PACING_KEY);
    if (typeof pacing === 'boolean') setLearnerPaced(pacing);
  }, [lesson]);

  useEffect(() => {
    voice.setRate(rate);
  }, [voice, rate]);

  // A hidden tab pauses the class.
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  // Leaving the class (another mode, another topic): silence.
  useEffect(() => {
    if (running) return;
    voice.cancel();
  }, [running, voice]);
  useEffect(() => () => voice.cancel(), [voice]);

  const dispatch = (ev: ClassEvent) => setState((s) => reduce(lesson, s, ev, learnerPaced));

  // The class clock: each phase does its one thing, then reports back.
  const phaseKey = `${state.step}/${state.phase}/${state.plain ? 'p' : ''}`;
  useEffect(() => {
    if (!running || paused) return;
    const d = driverRef.current;
    if (state.phase === 'done') {
      writeJson(placeKey(lesson.week), null);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the in-page bookmark in sync with this storage write
      setSaved(null);
      return;
    }
    if (state.phase === 'move') {
      if (step?.kind === 'line') {
        const place = { chunk: lesson.chunks[step.chunk].id, line: step.line };
        writeJson(placeKey(lesson.week), place);
        setSaved(place);
      }
      let live = true;
      d.go(cmd.stage, cmd.at, () => live && dispatch({ type: 'arrived' }), cmd.view, rate);
      return () => {
        live = false;
      };
    }
    if (state.phase === 'speak') {
      const text = cmd.text;
      // The scene plays on under the line, to where the next line said on this stage starts.
      // Each structure lights, shows its name and is pointed at as the voice reaches it.
      const cues = cmd.cues;
      let heard = 0;
      d.play(playMs(text, rate), cmd.playTo);
      voice.speak(text, {
        onStart: () => setSpeaking(true),
        onWord: setWord,
        onProgress: (p) => {
          const n = reached(cues, p);
          if (n <= heard) return;
          heard = n;
          dispatch({ type: 'heard', n });
        },
        onEnd: () => {
          setSpeaking(false);
          setWord('');
          dispatch({ type: 'spoken' });
        },
      });
      return () => {
        voice.cancel();
        setSpeaking(false);
      };
    }
    if (state.phase === 'write') {
      const id = window.setTimeout(() => dispatch({ type: 'written' }), 800 / rate);
      return () => window.clearTimeout(id);
    }
    if (state.phase === 'hold') {
      const id = window.setTimeout(() => dispatch({ type: 'held' }), ((cmd.line?.hold ?? 0) * 1000) / rate);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one run per phase; cmd and step follow the phase key
  }, [running, paused, phaseKey, learnerPaced]);

  // Paused: the scene stops where it is; the line starts again from its beginning on resume.
  useEffect(() => {
    if (!running || !paused) return;
    voice.cancel();
    driverRef.current.halt();
  }, [running, paused, voice]);

  // A new step clears what the last check lit.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset per step
    setCheckFocus([]);
  }, [state.step]);

  const start = (chunk?: number) => {
    // Inside the click: unlocks speech for the timers that follow (iPad), and picks the voice once.
    voice.prime();
    if (!voices.length && voiceSupported())
      void voice.init(savedVoiceName()).then((ranked) => {
        setVoices(ranked);
        setChoice(voice.current);
      });
    setState(reduce(lesson, chunk === undefined ? initialState() : state, { type: 'start', chunk }));
    setLastOk(undefined);
    setUserPaused(false);
    setPlainOn(null);
    setStatus('running');
  };
  const resumeSaved = () => {
    if (!saved) return start();
    const ci = lesson.chunks.findIndex((c) => c.id === saved.chunk);
    voice.prime();
    if (!voices.length && voiceSupported())
      void voice.init(savedVoiceName()).then((ranked) => {
        setVoices(ranked);
        setChoice(voice.current);
      });
    const at = steps.findIndex((s) => s.kind === 'line' && s.chunk === ci && s.line === saved.line);
    setState({ ...initialState(), step: Math.max(0, at), phase: 'move' });
    setLastOk(undefined);
    setPlainOn(null);
    setUserPaused(false);
    setStatus('running');
  };

  return {
    lesson,
    /** The class's end is its last phase: the end card shows until it is started again. */
    status: status === 'running' && state.phase === 'done' ? ('done' as const) : status,
    state,
    cmd,
    step,
    paused,
    userPaused,
    word,
    speaking,
    checkFocus,
    setCheckFocus,
    voices,
    choice,
    fellBack,
    rate,
    learnerPaced,
    setLearnerPaced: (value: boolean) => {
      setLearnerPaced(value);
      writeJson(PACING_KEY, value);
      if (!value && state.phase === 'wait') dispatch({ type: 'continue' });
    },
    rates: RATES,
    saved,
    /** Where a link opened the topic: the chunk to offer ("Klasea hemendik"). */
    linkChunk: link && !link.chunk ? chunkAt(lesson, link.stage, link.t) : null,
    linkSaved: link?.chunk ? lesson.chunks.findIndex((c) => c.id === link.chunk) : -1,
    start,
    resumeSaved,
    togglePause: () => {
      if (state.phase === 'wait' && !userPaused) dispatch({ type: 'continue' });
      else setUserPaused((p) => !p);
    },
    pause: () => setUserPaused(true),
    next: () => {
      voice.cancel();
      dispatch({ type: 'next' });
    },
    back: () => {
      voice.cancel();
      dispatch({ type: 'back' });
    },
    chunk: (i: number) => {
      voice.cancel();
      if (status !== 'running') start(i);
      else dispatch({ type: 'chunk', chunk: i });
      setUserPaused(false);
    },
    /** "Ez dut ulertu": the plain wording and the scene again; a second press on the same line asks Kimu. */
    notUnderstood: (): 'replay' | 'kimu' => {
      if (plainOn === state.step && state.plain) return 'kimu';
      voice.cancel();
      const next = reduce(lesson, state, { type: 'notUnderstood' });
      setState(next);
      setPlainOn(next.step);
      setUserPaused(false);
      return 'replay';
    },
    answered: (ok: boolean, graded: boolean) => {
      setLastOk(graded ? ok : undefined);
      dispatch({ type: 'answered', ok, graded });
    },
    cont: () => dispatch({ type: 'continue' }),
    restart: () => {
      writeJson(placeKey(lesson.week), null);
      setSaved(null);
      setStatus('card');
      setState(initialState());
    },
    useVoice: (c: VoiceChoice) => {
      voice.use(c);
      setChoice(c);
      setFellBack(false);
    },
    setRate: (r: number) => {
      setRateState(r);
      writeJson(RATE_KEY, r);
    },
    /** One speed up or down (the dock's button and the + / − keys); `wrap` goes from the fastest back to the slowest. */
    shiftRate: (dir: 1 | -1, wrap = false) => {
      const i = RATES.indexOf(rate) + dir;
      const r = RATES[wrap ? (i + RATES.length) % RATES.length : Math.max(0, Math.min(RATES.length - 1, i))];
      setRateState(r);
      writeJson(RATE_KEY, r);
    },
    /** For Kimu: the line being taught and the sentences it rests on. */
    here: running && cmd.line ? { chunk: cmd.chunk.id, line: step?.kind === 'line' ? step.line : 0, notes: cmd.line.notes } : null,
  };
}

export type Klasea = ReturnType<typeof useKlasea>;
