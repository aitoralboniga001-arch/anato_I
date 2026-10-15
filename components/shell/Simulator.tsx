'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import { SceneContext, type QuizFlash, type SceneContextValue } from '@/components/kit/context';
import { getWeek, isSpace, partsOf, nameOf, structures, weeks } from '@/content/registry';
import { firstSeenOf, periodOf, weekOfDay } from '@/content/chronology';
import { clockLabel, spanOf } from '@/lib/sim/age';
import { doneAt } from '@/lib/sim/beat-completion';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { PlaneKind, StageDef, StructureCategory, StructureDef, WeekDef } from '@/lib/sim/types';
import { Glossary } from './Glossary';
import { IconBook, IconCalendar, IconChevron, IconNotes, IconClock, IconExpand, IconHelp, IconImage, IconLayers, IconMore, IconQuiz, IconShrink, IconTag, IconTarget, IconTree } from './icons';
import { Popover } from './Popover';
import { Wordmark, isWip } from './LandNav';
import { AskCard, Player, TourCard, ideaOf } from './Player';
import { namedAt } from './named';
import { Help, useHelp } from './Help';
import { TourHost } from './tour/TourHost';
import { useTourBusy } from './tour/store';
import { Questions } from './Questions';
import { Inspector } from './Inspector';
import { NotesPanel } from './NotesPanel';
import type { NotesAnchor } from '@/content/notes-text';
import { NowCard } from './NowCard';
import { Locator, type CutStop, type Crumb } from './Locator';
import { shapeFor } from './Specimen';
import { warmGeo } from '@/lib/three-d/geo-client';
import type { ViewSnap } from './ViewBridge';
import { ViewTravel, revealPlan, travelPlan, type TravelPlan } from './ViewTravel';
import { ViewZoom, zoomPlan, type ZoomPlan } from './ViewZoom';
import { CavityRoad } from './CavityRoad';
import { IconRail, Outline, StageInfo, StageNav } from './SidePanel';
import { Viewport } from './Viewport';
import { ViewSwitch } from './ViewSwitch';
import { WeekNav } from './WeekNav';
import { KimuFace } from '@/components/kimu/KimuFace';
import { registerKimuHost, setKimuHere, toggleKimu, useKimuOpen } from '@/components/kimu/store';
import { NarrationTransport, type AudioSnapshot } from './narrate';
import { getNarrationSegments, narratedFrame, needsStageRestart, type NarrationKind } from '@/lib/sim/narration';
import { getPref, setPlayMode, setPref, usePref, type PlayMode } from './prefs';
import { markVisited, useVisited } from './progress';
import { recordAnswer } from './answers';
import { imageId } from '@/content/pool';
import { sectionLabel, sectionOf } from '@/content/notes';
import { examDatesAt } from '@/content/examDates';
import { formationFrame, formationOf, type Formation } from '@/content/formation';
import type { KimuTarget } from '@/lib/kimu/types';
import { SceneView } from '@/components/kit';

interface Pos {
  i: number;
  t: number;
}

interface FindQuiz {
  target: string | null;
  ok: number;
  tries: number;
  message: string | null;
}

/** Quick preview of a whole stage before the detailed playback (seconds). */
const PREVIEW_S = 8;
/** Guided mode plays the animation slower and holds each step until it has had time to be read. */
const NORMAL_RATE = 0.8;
const GUIDED_RATE = 0.4;
/** Quick replay: a whole stage in well under a minute, main ideas only. */
const QUICK_RATE = 1.7;

const beatIndexAt = (stage: StageDef, t: number) => {
  let k = 0;
  stage.beats.forEach((b, i) => {
    if (b.at <= t + 1e-6) k = i;
  });
  return k;
};

/** Was the structure first shown forming in an earlier stage (of this or an earlier week)? */
const formedBefore = (id: string, week: number, stage: StageDef) => {
  const f = firstSeenOf(id);
  return !!f && (f.week !== week || f.stage !== stage.id);
};

/** Structures a step brings into focus for the first time in the whole course. */
const freshAt = (stage: StageDef, k: number, week: number): StructureDef[] => {
  const seen = new Set<string>();
  stage.beats.slice(0, k).forEach((b) => b.focus?.forEach((id) => seen.add(id)));
  // What the step asks to remember ("Gogoratu") is old by definition, not new.
  stage.beats[k]?.recall?.forEach((id) => seen.add(id));
  return (stage.beats[k]?.focus ?? []).filter((id) => !seen.has(id) && structures.has(id) && !formedBefore(id, week, stage)).map((id) => structures.get(id)!);
};


/**
 * The stage as the caption shows it: a step that focuses on something formed in an earlier WEEK
 * says so ("Gogoratu"), with a button to watch it form, so the student never meets it as if new.
 */
const recallCache = new Map<string, StageDef>();
const withRecall = (week: number, stage: StageDef): StageDef => {
  const key = `${week}/${stage.id}`;
  const hit = recallCache.get(key);
  if (hit) return hit;
  const beats = stage.beats.map((b) => {
    const earlier = (b.focus ?? []).filter((id) => {
      const f = firstSeenOf(id);
      return !!f && f.beat >= 0 && f.week < week && !b.recall?.includes(id);
    });
    return earlier.length ? { ...b, recall: [...(b.recall ?? []), ...earlier] } : b;
  });
  const out = { ...stage, beats };
  recallCache.set(key, out);
  return out;
};

/** Every step's dates and new structures, so the caption can reserve the stage's tallest step. */
const extrasCache = new Map<string, { dates: ReturnType<typeof examDatesAt>; fresh: StructureDef[] }[]>();
const stepExtrasOf = (week: number, stage: StageDef, guided: boolean) => {
  const key = `${week}/${stage.id}/${guided ? 'g' : ''}`;
  let hit = extrasCache.get(key);
  if (!hit) {
    hit = stage.beats.map((b, k) => ({ dates: examDatesAt(week, stage.id, b.at), fresh: guided ? freshAt(stage, k, week) : [] }));
    extrasCache.set(key, hit);
  }
  return hit;
};



/** Minimum caption dwell in normal playback, with extra time for longer explanations. */
const captionDwellMs = (stage: StageDef, k: number) => Math.max(5500, (stage.beats[k]?.text.length ?? 0) * 80);

/** Quick replay dwell: just long enough to read the step's main idea. */
const quickDwellMs = (stage: StageDef, k: number) => Math.max(1600, ideaOf(stage.beats[k]).length * 38);

/** How long a paused step takes to play itself out when stepped to (ms): its own pace, kept brief. */
const glideMs = (stage: StageDef, from: number, to: number) => Math.min(2200, Math.max(550, (Math.abs(to - from) * stage.duration * 1000) / NORMAL_RATE));

/** The preview card stays up until it has had time to be read (ms at 1×). */
const previewMs = (stage: StageDef) => 2500 + ((stage.intro ?? '').length + stage.keyPoints.slice(0, 3).join('').length) * 40;

/** Structure spotlight time (ms at 1×); guided mode gives longer definitions more reading time. */
const tourMs = (id: string, guided: boolean) => {
  const length = structures.get(id)?.definition.length ?? 0;
  return guided ? Math.min(8000, 2800 + length * 55) : Math.min(5200, 1600 + length * 28);
};

/**
 * Stage time the animation holds at while a step's tour runs: by default three quarters into the
 * step, when its new structures have formed but before step-bound elements fade out.
 */
const tourAtOf = (stage: StageDef, k: number) => {
  const b = stage.beats[k];
  const end = k + 1 < stage.beats.length ? stage.beats[k + 1].at : 1;
  return b.tourAt ?? b.at + (end - b.at) * 0.75;
};

/** Is the structure visibly drawn (as a part or a label) in the scene right now? */
const drawnIn = (svg: SVGSVGElement | null, id: string) =>
  !!svg && [...svg.querySelectorAll(`[data-part="${CSS.escape(id)}"], [data-label="${CSS.escape(id)}"]`)].some((el) => Number(el.getAttribute('opacity') ?? 1) > 0.3);

/** A structure tour, opened from the caption (never by playback): `auto` walks on by itself. */
interface Tour {
  items: string[];
  idx: number;
  auto?: boolean;
}

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (cb: () => void) => {
  const m = window.matchMedia(REDUCED_MOTION);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Mid-size screens, where the notes column only fits beside the specimen if the outline folds. */
const MID_SCREEN = '(min-width: 1321px) and (max-width: 1559px)';

const subscribeMidScreen = (cb: () => void) => {
  const m = window.matchMedia(MID_SCREEN);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

function useMidScreen() {
  return useSyncExternalStore(
    subscribeMidScreen,
    () => window.matchMedia(MID_SCREEN).matches,
    () => false,
  );
}

/** Screens where the explanation column is a drawer (it shows only while `panelOpen`). */
const NARROW_SCREEN = '(max-width: 1320px)';

const subscribeNarrowScreen = (cb: () => void) => {
  const m = window.matchMedia(NARROW_SCREEN);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

function useNarrowScreen() {
  return useSyncExternalStore(
    subscribeNarrowScreen,
    () => window.matchMedia(NARROW_SCREEN).matches,
    () => false,
  );
}

const subscribeNothing = () => () => {};

/** False on the server and during hydration, true once rendering on the client. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** Deep link: ?etapa=<stageId>&ikuspegia=<viewId>&egitura=<structureId>&une=<0..1>&jolastu=1&aurkitu=<structureId>&galderak=<structureId> */
function readDeepLink(week: WeekDef) {
  const params = new URLSearchParams(window.location.search);
  const sid = params.get('etapa');
  const vid = params.get('ikuspegia');
  const eg = params.get('egitura');
  const une = Number(params.get('une'));
  const idx = sid ? week.stages.findIndex((s) => s.id === sid) : -1;
  const reviewed = formationOf(params.get('eraketa'));
  const formation = reviewed?.week === week.week && reviewed.stage === sid ? reviewed : undefined;
  return {
    stageIndex: idx >= 0 ? idx : null,
    viewId: formation?.view ?? (idx >= 0 ? vid : null),
    structure: !formation && eg && structures.has(eg) ? eg : null,
    t: formation?.start ?? (idx >= 0 && une > 0 && une <= 1 ? une : 0),
    play: !!formation || (idx >= 0 && params.get('jolastu') === '1'),
    formation,
    find: idx >= 0 && structures.has(params.get('aurkitu') ?? '') ? params.get('aurkitu') : null,
    /** Open the question bank on one structure (from the structure atlas). */
    questions: structures.has(params.get('galderak') ?? '') ? params.get('galderak') : null,
    /** Open the question bank on what is due for review, every topic (from Home). */
    review: params.get('galderak') === 'errepasoa',
  };
}

/** Where "Bueltatu" returns to after the time machine jumped to where a structure forms. */
interface Back {
  week: number;
  stage: string;
  t: number;
  /** The view the viewer was looking at (a return must land on the same picture). */
  view?: string;
  selected: string | null;
  title: string;
  /** Another page to return to (the image lab), instead of a stage. */
  href?: string;
  /** When it was written: a return older than half an hour is stale. */
  at?: number;
}
const BACK_KEY = 'enbrioatlas:back';

const readBack = (week: number, stage: string): Back | null => {
  try {
    const raw = window.sessionStorage.getItem(BACK_KEY);
    const b = raw ? (JSON.parse(raw) as Back & { to: string }) : null;
    return b && b.to === `${week}/${stage}` && (!b.at || Date.now() - b.at < 1_800_000) ? b : null;
  } catch {
    return null;
  }
};

/** The tissue categories drawn in a stage, with their colours (the legend). */
function legendOf(ids: readonly string[]) {
  const seen = new Map<StructureCategory, string>();
  for (const id of ids) {
    const s = structures.get(id);
    if (s && !seen.has(s.category)) seen.set(s.category, categoryColor[s.category]);
  }
  return [...seen.entries()];
}

/** Full screen was accepted earlier in this tab: later playbacks enter it without asking. */
const FS_ACCEPTED = 'enbrioatlas:fs-accepted';
/** The viewer has turned a 3D view once: the shell no longer explains how. */
const TURNED_KEY = 'enbrioatlas:turned-3d';
const readTurned = () => {
  try {
    return window.localStorage.getItem(TURNED_KEY) === '1';
  } catch {
    return false;
  }
};
const fsAccepted = () => {
  try {
    return window.sessionStorage.getItem(FS_ACCEPTED) === '1';
  } catch {
    return false;
  }
};

export function Simulator({ weekNumber }: { weekNumber: number }) {
  const week = getWeek(weekNumber) ?? weeks[0];
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState<Pos>({ i: 0, t: 0 });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [autoContinue, setAutoContinue] = useState(false);
  const [viewByStage, setViewByStage] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  // Only highlight (and dim the rest) when the picked structure is actually drawn in this view.
  const [selectedLit, setSelectedLit] = useState(false);
  // Names in the picture: step by step as the study names them (default), all of them, or none.
  const [labelMode, setLabelMode] = useState<'urratsez' | 'guztiak' | 'ez'>('urratsez');
  const showLabels = labelMode !== 'ez';
  const cycleLabels = () => setLabelMode((m) => (m === 'urratsez' ? 'guztiak' : m === 'guztiak' ? 'ez' : 'urratsez'));
  const [legendOpen, setLegendOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [find, setFind] = useState<FindQuiz | null>(null);
  const [flash, setFlash] = useState<QuizFlash>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  // Offer of full screen when an explanation starts; `autoFs` = we entered it for this playback, so we leave it at the end.
  const [fsOffer, setFsOffer] = useState(false);
  const autoFs = useRef(false);
  // Plain image: the find quiz in black and white, like a printed textbook figure.
  const [print, setPrint] = useState(false);
  const [back, setBack] = useState<Back | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [helpOpen, setHelpOpen] = useHelp();
  const tourBusy = useTourBusy();
  const [nowOpen, setNowOpen] = useState(false);
  const guidedPref = usePref('guided');
  const quick = usePref('quick');
  const guided = guidedPref && !quick;
  const mode: PlayMode = quick ? 'azkarra' : guided ? 'gidatua' : 'arrunta';
  const voice = usePref('voice');
  const [audioState, setAudioState] = useState<AudioSnapshot>({ status: 'idle', text: '', focus: [], segment: 0, count: 1, fraction: 0, error: '' });
  const [transport] = useState(() => new NarrationTransport(setAudioState));
  const [voiceConfigured, setVoiceConfigured] = useState<boolean | null>(null);
  const [voiceStarted, setVoiceStarted] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    void fetch('/api/narration', { signal: abort.signal }).then((r) => r.json()).then((status) => setVoiceConfigured(status.configured === true)).catch(() => { if (!abort.signal.aborted) setVoiceConfigured(false); });
    return () => { abort.abort(); transport.dispose(); };
  }, [transport]);
  useEffect(() => { transport.setSpeed(speed); }, [transport, speed]);
  useEffect(() => { if (!voice) transport.cancel(); }, [voice, transport]);
  useEffect(() => { transport.cancel(); }, [week.week, pos.i, transport]);

  // Micro-questions already answered or skipped on this visit (stage:step).
  const [asked, setAsked] = useState<string[]>([]);
  /** The micro-question answered just now (its key), so the Next key lights up to go on. */
  const [answered, setAnswered] = useState('');
  const outlineOpen = usePref('outline');
  const infoOpen = usePref('panel');
  const notesOpen = usePref('notes');
  const asksOn = usePref('asks');
  // Stage preview progress (0..1 + rest) while the quick overview animation runs; null otherwise.
  const [intro, setIntro] = useState<number | null>(null);
  // Guided mode: the step's animation is done but its text is still being read.
  const [waiting, setWaiting] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState<number | null>(null);
  const waitSecondsRef = useRef<number | null>(null);
  // The playback loop owns these between frames; `live` mirrors the committed position.
  const live = useRef<Pos>({ i: 0, t: 0 });
  const introRef = useRef<number | null>(null);
  const clock = useRef({ key: '', start: 0 });
  const speaking = useRef(false);
  const skipHold = useRef(false);
  const introClock = useRef(0);
  const bridgeHold = useRef(false);
  const [tour, setTour] = useState<Tour | null>(null);
  // Scenes use floating-point geometry; render them only on the client to avoid hydration mismatches.
  const mounted = useHydrated();
  const visited = useVisited(week.week);

  const [manualView, setManualView] = useState<Record<string, boolean>>({});
  // "Irudian aurkitu": a structure to ask for in the find quiz once the scene is drawn.
  const [pendingFind, setPendingFind] = useState<string | null>(null);
  const [questionsConcept, setQuestionsConcept] = useState<string | undefined>(undefined);
  const [questionsReview, setQuestionsReview] = useState(false);

  // Deep links are applied once per week, on the first client render (the server can't see the query).
  // The URL-sync effect below waits for this, so it can't rewrite the query before it has been read.
  const [linkedWeek, setLinkedWeek] = useState<number | null>(null);
  // A "play" deep link hands its position to the loop before the loop's first frame.
  const [linkPos, setLinkPos] = useState<Pos | null>(null);
  // After a client-side navigation the first render can come before the router has written the new
  // URL: wait for it (a few frames at most), or the link would be read from the previous page.
  const [urlWaits, setUrlWaits] = useState(0);
  const urlHere = mounted && window.location.pathname.replace(/\/$/, '') === `/astea/${week.week}`;
  useEffect(() => {
    if (!mounted || linkedWeek === week.week || urlHere || urlWaits >= 3) return;
    const raf = requestAnimationFrame(() => setUrlWaits((n) => n + 1));
    return () => cancelAnimationFrame(raf);
  });
  if (mounted && linkedWeek !== week.week && (urlHere || urlWaits >= 3)) {
    setLinkedWeek(week.week);
    const link = readDeepLink(week);
    setFormation(link.formation ?? null);
    if (link.formation) setSelected(null);
    if (link.stageIndex !== null) {
      setPos({ i: link.stageIndex, t: link.t });
      const sid = week.stages[link.stageIndex].id;
      const vid = link.viewId;
      if (vid) {
        setViewByStage((m) => ({ ...m, [sid]: vid }));
        setManualView((m) => ({ ...m, [sid]: true }));
      }
      if (link.play) {
        setLinkPos({ i: link.stageIndex, t: link.t });
        setPlaying(true);
      }
      setBack(readBack(week.week, sid));
    }
    if (link.structure) {
      setSelected(link.structure);
      // Where the column is a drawer, the structure's card is inside it: open it, or the link shows nothing.
      if (window.matchMedia(NARROW_SCREEN).matches) setPanelOpen(true);
    }
    if (link.find) setPendingFind(link.find);
    if (link.questions) {
      setQuestionsConcept(link.questions);
      setQuestionsOpen(true);
    } else if (link.review) {
      setQuestionsReview(true);
      setQuestionsOpen(true);
    }
  }

  const stage = week.stages[pos.i];
  const view = stage.views.find((v) => v.id === viewByStage[stage.id]) ?? stage.views[0];
  const Scene = view.scene;
  const activeBeat = beatIndexAt(stage, pos.t);
  const beat = stage.beats[activeBeat];
  /** Where the stage sits in the notes, and the exam dates the current step shows. */
  const notesAt = sectionOf(week.week, stage.id);
  const dates = examDatesAt(week.week, stage.id, beat?.at);
  const fresh = freshAt(stage, activeBeat, week.week);
  const askKey = `${stage.id}:${activeBeat}`;

  // Each step opens in the view where it is best seen, unless the viewer chose a view for this stage.
  const [autoViewKey, setAutoViewKey] = useState('');
  if (mounted && autoViewKey !== askKey) {
    setAutoViewKey(askKey);
    const want = beat?.view;
    if (want && !manualView[stage.id] && stage.views.some((v) => v.id === want) && view.id !== want) setViewByStage((m) => ({ ...m, [stage.id]: want }));
  }
  const chooseView = (id: string) => {
    transport.cancel();
    if (formation) { setFormation(null); setPlaying(false); }
    setManualView((m) => ({ ...m, [stage.id]: true }));
    setViewByStage((m) => ({ ...m, [stage.id]: id }));
  };
  // Guided mode asks the step's micro-question once its animation is done, before moving on.
  const askNow = !formation && guided && playing && waiting && intro === null && asksOn && !!beat?.ask && !asked.includes(askKey);

  // Cross-fade: when the scene changes (stage or view), the previous one fades out over the new one.
  const sceneKey = `${week.week}/${stage.id}/${view.id}`;
  const [shown, setShown] = useState<{
    key: string;
    w: number;
    i: number;
    view: string;
  } | null>(null);
  const [ghost, setGhost] = useState<{
    key: string;
    i: number;
    view: string;
    t: number;
  } | null>(null);
  if (mounted && shown?.key !== sceneKey) {
    if (shown && shown.w === week.week)
      setGhost({
        key: shown.key,
        i: shown.i,
        view: shown.view,
        t: shown.i === pos.i ? pos.t : shown.i < pos.i ? 1 : 0,
      });
    setShown({ key: sceneKey, w: week.week, i: pos.i, view: view.id });
  }
  /** The camera move between two views (see ViewTravel), while it plays; playback waits for it. */
  const [travel, setTravel] = useState<{ key: string; plan?: TravelPlan; zoom?: ZoomPlan } | null>(null);
  const travelRef = useRef(false);
  useEffect(() => {
    travelRef.current = !!travel;
  }, [travel]);
  /** The view a camera move arrived at: it is already on screen, so it does not fade in again. */
  const [arrived, setArrived] = useState('');
  useEffect(() => {
    if (!ghost || travel) return;
    const id = window.setTimeout(() => setGhost(null), 1000);
    return () => window.clearTimeout(id);
  }, [ghost, travel]);
  const ghostStage = ghost ? week.stages[ghost.i] : undefined;
  const GhostScene = ghost && ghostStage ? (ghostStage.views.find((v) => v.id === ghost.view) ?? ghostStage.views[0]).scene : null;

  useEffect(() => {
    if (!formation) return;
    setPref('notes', true);
    setPref('panel', true);
    const raf = requestAnimationFrame(() => setPanelOpen(!window.matchMedia('(max-width: 1320px)').matches));
    return () => cancelAnimationFrame(raf);
  }, [formation]);
  const notesLinked = useRef<number | null>(null);
  useEffect(() => {
    if (linkedWeek !== week.week || notesLinked.current === week.week) return;
    notesLinked.current = week.week;
    const linked = new URLSearchParams(window.location.search).get('apunteak') === '1';
    if (linked) { setPref('notes', true); setPref('panel', true); }
    if (!formation && (linked || getPref('notes'))) {
      const raf = requestAnimationFrame(() => setPanelOpen(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [linkedWeek, week.week, formation]);
  useEffect(() => {
    if (linkedWeek !== week.week) return;
    const url = new URL(window.location.href);
    url.searchParams.set('etapa', stage.id);
    url.searchParams.set('ikuspegia', view.id);
    if (getPref('notes')) url.searchParams.set('apunteak', '1');
    else url.searchParams.delete('apunteak');
    for (const k of ['egitura', 'une', 'jolastu', 'eraketa', 'galderak']) url.searchParams.delete(k);
    window.history.replaceState(null, '', url);
    markVisited(week.week, stage.id);
  }, [linkedWeek, week.week, stage.id, view.id]);

  // While paused, the loop's position follows the committed one (deep links, scrubbing). While
  // playing, the loop owns it and every other move goes through `place`, so a late commit can't
  // drag it back to an older frame.
  useEffect(() => {
    if (!playing) live.current = pos;
  }, [pos, playing]);

  useEffect(() => {
    if (linkPos) live.current = linkPos;
  }, [linkPos]);

  // The topic's 3D views: their geometry is built off the main thread as soon as the topic opens (the
  // current stage first), and the WebGL layer's code is fetched while the page is idle, so opening one
  // never freezes the page.
  useEffect(() => {
    const order = [week.stages[pos.i], ...week.stages.filter((_, i) => i !== pos.i)];
    const keys = order.flatMap((s) => s.views.flatMap((v) => (v.scene as { geo?: string[] }).geo ?? []));
    if (!keys.length) return;
    warmGeo(keys);
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1500));
    idle(() => void import('@/components/kit/three/gl').catch(() => {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per topic; the stage only orders the queue
  }, [week]);

  // Narrated pauses retain the current audio sample and observation interval.
  useEffect(() => {
    if (voice && voiceStarted) { if (playing) transport.resume(); else transport.pause(); return; }
    if (playing) return;
    transport.cancel();
    speaking.current = false;
    clock.current.key = '';
    introClock.current = 0;
  }, [playing, voice, voiceStarted, transport]);

  // Playback loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      // A frame's timestamp is when the frame began, which can be earlier than `last` when the loop
      // restarts after a long render (a view change): never step backwards, or the time slips back
      // under the step's start, the previous view returns, and the two views take turns for ever.
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = Math.max(last, now);
      raf = requestAnimationFrame(step);

      // Speech samples drive scene movement; observation time only advances while playing.
      if (voice && !formation && !find) {
        if (!voiceStarted || voiceConfigured !== true || travelRef.current) return;
        const p = live.current;
        const st = week.stages[p.i];
        const k = beatIndexAt(st, p.t);
        const kind: NarrationKind = introRef.current !== null ? 'intro' : 'beat';
        const options = kind === 'beat' ? { beat: k } : {};
        const key = `${week.week}/${st.id}/${kind}/${k}/${view.id}`;
        if (transport.key !== key) {
          transport.start(key, { week: week.week, stage: st.id, kind, ...options }, getNarrationSegments(week, st, kind, options), speed);
          skipHold.current = false; setWaiting(false);
        }
        transport.tick(dt);
        const audio = transport.snapshot();
        if (audio.status === 'error' || audio.status === 'loading' || audio.status === 'paused') return;
        const fraction = audio.status === 'observing' || audio.status === 'done' ? 1 : audio.fraction;
        if (kind === 'intro') {
          const it = narratedFrame(0, 1, audio.segment, audio.count, fraction);
          introRef.current = it; setIntro(it);
          if (audio.status === 'done') { introRef.current = null; setIntro(null); transport.cancel(); }
          return;
        }
        const t = narratedFrame(st.beats[k].at, doneAt(st, k), audio.segment, audio.count, fraction);
        live.current = { i: p.i, t }; setPos(live.current);
        if (audio.status !== 'done') return;
        setWaiting(true);
        if (!skipHold.current && guided) return;
        transport.cancel(); setWaiting(false);
        if (k + 1 < st.beats.length) {
          live.current = { i: p.i, t: st.beats[k + 1].at + .000001 }; setPos(live.current);
        } else if (autoContinue && p.i + 1 < week.stages.length) {
          live.current = { i: p.i + 1, t: 0 }; setPos(live.current);
          introRef.current = 0; setIntro(0);
        } else setPlaying(false);
        return;
      }

      // Kimu's reviewed clip owns its range; it cannot enter a tour, a reading hold or another stage.
      if (formation) {
        const p = live.current;
        const st = week.stages[p.i];
        if (formation.week !== week.week || formation.stage !== st.id) { setPlaying(false); return; }
        const t = formationFrame(formation, p.t, dt, speed);
        live.current = { i: p.i, t };
        setPos(live.current);
        if (t >= formation.end) setPlaying(false);
        return;
      }

      // 1) Quick overview of the whole stage; the card then stays until it has been read
      //    (in guided mode, until the viewer presses "Hasi").
      if (introRef.current !== null && quick) {
        introRef.current = null;
        clock.current.key = '';
        setIntro(null);
      }
      if (introRef.current !== null) {
        const st = week.stages[live.current.i];
        if (!introClock.current) {
          introClock.current = now;

        }
        const it = Math.min(1, introRef.current + dt / PREVIEW_S);
        introRef.current = it;
        setIntro(it);
        const read = now - introClock.current >= previewMs(st) / speed && !speaking.current;
        if (it >= 1 && !guided && read) {
          introRef.current = null;
          clock.current.key = '';
          setIntro(null);
        }
        return;
      }

      // 2) Detailed playback, step by step (on hold while the camera moves to another view).
      if (bridgeHold.current) return;
      const p = live.current;
      const st = week.stages[p.i];
      let t = p.t + (dt * speed * NORMAL_RATE * (guided ? GUIDED_RATE : quick ? QUICK_RATE : 1)) / st.duration;
      const k = beatIndexAt(st, p.t);

      const key = `${st.id}:${k}`;
      if (clock.current.key !== key) {
        clock.current = { key, start: now };
        skipHold.current = false;

      }
      // Playback, narrated observation and manual steps must all show the same completed frame.
      const boundary = doneAt(st, k);
      const elapsed = now - clock.current.start;
      const dwell = quick ? quickDwellMs(st, k) : captionDwellMs(st, k);
      const hold = t >= boundary && (guided ? !skipHold.current : elapsed < dwell && !skipHold.current);
      const remainingSeconds = hold && !guided ? Math.max(1, Math.ceil((dwell - elapsed) / 1000)) : null;
      if (waitSecondsRef.current !== remainingSeconds) {
        waitSecondsRef.current = remainingSeconds;
        setWaitSeconds(remainingSeconds);
      }
      if (hold) t = Math.max(p.t, boundary);
      setWaiting(hold);
      let next: Pos = { i: p.i, t: Math.min(t, 1) };
      if (t >= 1 && autoContinue && p.i < week.stages.length - 1) {
        next = { i: p.i + 1, t: 0 };
        if (!quick) {
          introRef.current = 0;
          introClock.current = 0;
          setIntro(0);
        }
      }
      live.current = next;
      setPos(next);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, autoContinue, week, guided, quick, voice, formation, find, voiceStarted, voiceConfigured, transport, view.id]);

  // Auto-stop at the end of the stage (or of the week, when auto-continuing).
  if (playing && !voice && intro === null && pos.t >= 1 && (!autoContinue || pos.i === week.stages.length - 1)) setPlaying(false);

  // Glide: while paused, a step the viewer moves to plays itself out (from its start to its complete
  // frame) instead of cutting, so what the caption describes is seen happening.
  const glideRef = useRef<{ w: number; i: number; from: number; to: number; ms: number; start: number; then?: () => void } | null>(null);
  const [glideRun, setGlideRun] = useState(0);
  // The step being glided to: the caption shows it at once, before the frame reaches it.
  const [glideAim, setGlideAim] = useState<{ w: number; i: number; k: number } | null>(null);
  const glideBeat = glideAim && glideAim.w === week.week && glideAim.i === pos.i ? glideAim.k : null;
  const notesBeatIndex = glideBeat ?? activeBeat;
  const notesBeat = stage.beats[notesBeatIndex];
  const notesProgress = (pos.t - notesBeat.at) / Math.max(.0001, (stage.beats[notesBeatIndex + 1]?.at ?? 1) - notesBeat.at);
  useEffect(() => {
    if (!glideRun) return;
    let raf = 0;
    const tick = (now: number) => {
      const g = glideRef.current;
      if (!g || g.w !== week.week) return;
      // A step that changes the view starts once the camera has arrived.
      if (travelRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!g.start) g.start = now;
      const x = Math.min(1, (now - g.start) / g.ms);
      const next = { i: g.i, t: g.from + (g.to - g.from) * easeInOut(x) };
      live.current = next;
      setPos(next);
      if (x < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      glideRef.current = null;
      setGlideAim(null);
      g.then?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [glideRun, week.week]);
  const stopGlide = () => {
    if (!glideRef.current) return;
    glideRef.current = null;
    setGlideAim(null);
  };

  // Plain functions: nothing downstream depends on their identity (no memo'd children), and the
  // React Compiler lint can't preserve manual useCallback here, so memoization is left to it.
  const place = (next: Pos) => {
    transport.cancel();
    if (formation) { setFormation(null); setPlaying(false); }
    stopGlide();
    live.current = next;
    setPos(next);
  };
  const glideTo = (k: number, from: number, to: number, then?: () => void) => {
    if (reduced || to - from < 0.002) {
      place({ i: pos.i, t: to });
      then?.();
      return;
    }
    place({ i: pos.i, t: from });
    glideRef.current = { w: week.week, i: pos.i, from, to, ms: glideMs(stage, from, to), start: 0, then };
    setGlideAim({ w: week.week, i: pos.i, k });
    setGlideRun((n) => n + 1);
  };
  const clearTour = () => setTour(null);
  const startIntro = () => {
    if (quick || formation) return;
    introRef.current = 0;
    introClock.current = 0;
    clearTour();
    setIntro(0);
  };
  const endIntro = () => {
    if (introRef.current !== null && speaking.current) {
      transport.cancel();
      speaking.current = false;
    }
    introRef.current = null;
    clock.current.key = '';
    setIntro(null);
  };
  const seek = (i: number, t: number) => {
    endIntro();
    clearTour();
    place({ i, t });
  };
  /**
   * The step's structures one at a time, lit in the scene, each with its card in the caption's place.
   * Only the learner opens it (from the caption): playback and the Next key never run through it. The
   * animation pauses on the step's tour frame, where its structures have formed.
   */
  const startTour = (items: string[], idx = 0, auto = false) => {
    endIntro();
    stopGlide();
    setPlaying(false);
    setBira(false);
    const k = glideBeat ?? activeBeat;
    const at = tourAtOf(stage, k);
    if (stage.beats[k]?.tourAt !== undefined || pos.t < at || beatIndexAt(stage, pos.t) !== k) place({ i: pos.i, t: at });
    // The frame first, then what it draws: a structure not drawn there is left out of the walk.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const shown = items.filter((id) => structures.has(id) && drawnIn(svgRef.current, id));
        if (!shown.length) return;
        setTour({ items: shown, idx: Math.max(0, shown.indexOf(items[idx])), auto });
      }),
    );
  };
  const skipTour = () => {
    setTour(null);
    setBira(false);
  };
  /** Focus mode + browser full screen (inside the click/key gesture, as browsers require). */
  const enterFull = () => {
    try {
      window.sessionStorage.setItem(FS_ACCEPTED, '1');
    } catch {
      // Storage unavailable: it will simply be offered again next time.
    }
    autoFs.current = true;
    setFsOffer(false);
    setFocusMode(true);
    const el = appRef.current;
    if (el?.requestFullscreen && !document.fullscreenElement) void el.requestFullscreen().catch(() => {});
  };
  /**
   * An explanation is starting: go full screen if accepted before, else offer it (unless turned off).
   * The stage preview carries the offer in its own header, so only a start without a preview (quick
   * replay) shows the separate card: never two cards over the specimen at once.
   */
  const offerFull = () => {
    if (focusMode) return;
    if (fsAccepted()) enterFull();
    else if (getPref('fsAsk') && quick) setFsOffer(true);
  };
  const togglePlay = () => {
    const continuingNarration = voice && !!transport.key;
    setVoiceStarted(true);
    if (voice && !playing) transport.resume();
    if (formation) {
      if (pos.t >= formation.end) place({ ...pos, t: formation.start });
      setFormation(formation);
      setPlaying(!playing);
      return;
    }
    stopGlide();
    if (playing) setFsOffer(false);
    else if (!continuingNarration && intro === null && (pos.t <= 0.001 || pos.t >= 1)) offerFull();
    // The preview has finished and is waiting to be read: start the step-by-step playback.
    if (!voice && playing && intro !== null && intro >= 1) {
      endIntro();
      return;
    }
    if (needsStageRestart(playing, pos.t, continuingNarration)) {
      clearTour();
      place({ ...pos, t: 0 });
    }
    if (!playing && !continuingNarration && intro === null && !find && (pos.t <= 0.001 || pos.t >= 1)) startIntro();
    setPlaying(!playing);
  };
  /** Advance from a reading hold; in guided mode this also lets the learner stop narration. */
  const continueHold = () => {
    skipHold.current = true;
    if (voice) return;
    transport.cancel();
    speaking.current = false;
  };
  const openStage = (i: number) => {
    if (playing) startIntro();
    else endIntro();
    clearTour();
    place({ i, t: 0 });
    setSelected(null);
  };
  const gotoStage = (delta: number) => {
    // While playing, a new stage opens with its quick preview.
    if (playing && pos.i + delta >= 0 && pos.i + delta < week.stages.length) startIntro();
    else endIntro();
    clearTour();
    place({
      i: Math.min(week.stages.length - 1, Math.max(0, pos.i + delta)),
      t: 0,
    });
    setSelected(null);
  };
  /** "Hurrengo etapa" at the end of a stage: move on and keep playing, preview first. */
  const continueNext = () => {
    if (pos.i >= week.stages.length - 1) return;
    gotoStage(1);
    startIntro();
    setPlaying(true);
    offerFull();
  };
  const gotoBeat = (k: number) => {
    endIntro();
    clearTour();
    const kk = Math.max(0, Math.min(stage.beats.length - 1, k));
    const b = stage.beats[kk];
    if (playing || voice) {
      place({ i: pos.i, t: b.at + 0.001 });
      return;
    }
    // Paused: the step plays out up to its complete frame, continuing from here when "here" is on the
    // way (the previous step, or earlier in this one), else replaying it from its start.
    const to = doneAt(stage, kk);
    const onTheWay = pos.t < to && pos.t >= (stage.beats[kk - 1]?.at ?? 0);
    glideTo(kk, onTheWay ? pos.t : b.at + 0.001, to);
  };
  /**
   * Paused with the current step's change not yet seen (the stage not started, a scrub into the middle of
   * a step): the Next key then plays it out first, and says so ("Hasi", "Ikusi urratsa") instead of
   * "Hurrengoa", so a press is never a surprise.
   */
  const unseen = !playing && intro === null && glideBeat === null && !find && !formation && !tour && pos.t < doneAt(stage, activeBeat) - 0.004;
  /** The micro-question is done (answered or skipped): on to the next step. */
  const doneAsk = () => {
    setAsked((a) => [...a, askKey]);
    continueHold();
  };
  const stepBeat = (delta: number) => {
    // → during the preview starts step 1 (the Next key's "Hasi"); it no longer skips over it.
    if (delta > 0 && intro !== null) {
      endIntro();
      return;
    }
    // → on the micro-question leaves it the same way as the Next key ("Saltatu" / "Jarraitu").
    if (delta > 0 && askNow) {
      doneAsk();
      return;
    }
    const shownBeat = glideBeat ?? activeBeat;
    if (delta > 0 && unseen) {
      gotoBeat(activeBeat);
      return;
    }
    endIntro();
    const k = shownBeat + delta;
    if (k < 0) {
      if (pos.i > 0) place({ i: pos.i - 1, t: 0.999 });
      return;
    }
    if (k >= stage.beats.length) {
      if (pos.t < 0.999) place({ i: pos.i, t: 1 });
      else if (pos.i < week.stages.length - 1) place({ i: pos.i + 1, t: 0 });
      return;
    }
    gotoBeat(k);
  };

  const gotoWeekStage = (w: number, stageId: string, structureId?: string) => {
    // With a structure: the step that shows it (late in the step, where its tour would hold), lit.
    const target = getWeek(w)?.stages.find((s) => s.id === stageId);
    const k = structureId && target ? target.beats.findIndex((b) => b.focus?.includes(structureId)) : -1;
    const t = target && k >= 0 ? (target.beats[k].tourAt ?? target.beats[k].at + ((target.beats[k + 1]?.at ?? 1) - target.beats[k].at) * 0.75) : 1;
    if (w === week.week) {
      const idx = week.stages.findIndex((s) => s.id === stageId);
      if (idx >= 0) {
        endIntro();
        clearTour();
        setPlaying(false);
        place({ i: idx, t });
        if (structureId && structures.has(structureId)) pick(structureId);
      }
      setQuestionsOpen(false);
      return;
    }
    const q = new URLSearchParams({ etapa: stageId });
    if (structureId) q.set('egitura', structureId);
    if (k >= 0) q.set('une', t.toFixed(3));
    router.push(`/astea/${w}?${q.toString()}`);
  };

  /** Time machine: jump to the step where a structure forms and play it, remembering where we were. */
  const replay = (w: number, stageId: string, at: number, id?: string) => {
    const here: Back = {
      week: week.week,
      stage: stage.id,
      t: pos.t,
      view: view.id,
      selected,
      title: stage.title,
    };
    if (w === week.week) {
      const idx = week.stages.findIndex((s) => s.id === stageId);
      if (idx < 0) return;
      endIntro();
      clearTour();
      setBack(here);
      place({ i: idx, t: at + 0.001 });
      setSelected(id ?? null);
      setPlaying(true);
      return;
    }
    try {
      window.sessionStorage.setItem(BACK_KEY, JSON.stringify({ ...here, to: `${w}/${stageId}` }));
    } catch {
      // Without storage the jump still works; only the way back is lost.
    }
    const q = new URLSearchParams({ etapa: stageId, une: String(at + 0.001), jolastu: '1' });
    if (id) q.set('egitura', id);
    router.push(`/astea/${w}?${q.toString()}`);
  };

  // The model supplies only a search hit; formation timing is looked up again in reviewed content.
  const kimuGo = useEffectEvent((t: KimuTarget) => {
    const destination = getWeek(t.week)?.stages.find(s => s.id === t.stage);
    if (!destination) return;
    const reviewed = formationOf(t.formation);
    const f = reviewed?.week === t.week && reviewed.stage === t.stage ? reviewed : undefined;
    setQuestionsOpen(false);
    setGlossaryOpen(false);
    setFind(null);
    setHovered(null);
    transport.cancel();
    speaking.current = false;
    endIntro();
    clearTour();
    setPlaying(false);
    const origin: Back = { week: week.week, stage: stage.id, t: pos.t, view: view.id, selected, title: stage.title };
    if (t.week !== week.week) {
      try { window.sessionStorage.setItem(BACK_KEY, JSON.stringify({ ...origin, to: `${t.week}/${t.stage}` })); } catch {}
      const q = new URLSearchParams({ etapa: t.stage, une: String(f?.start ?? t.at) });
      if (f) { q.set('eraketa', f.structure); q.set('apunteak', '1'); }
      else if (t.structure) q.set('egitura', t.structure);
      if (f?.view ?? t.view) q.set('ikuspegia', (f?.view ?? t.view)!);
      if (t.notes) q.set('apunteak', '1');
      router.push(`/astea/${t.week}?${q}`);
      return;
    }
    if (t.notes) setPref('notes', true);
    setBack(origin);
    place({ i: week.stages.indexOf(destination), t: f?.start ?? t.at });
    const vid = f?.view ?? t.view;
    if (vid && destination.views.some(v => v.id === vid)) {
      setViewByStage(m => ({ ...m, [t.stage]: vid }));
      setManualView(m => ({ ...m, [t.stage]: true }));
    }
    setSelected(f ? null : t.structure ?? null);
    setFormation(f ?? null);
    setPlaying(!!f);
  });
  useEffect(() => registerKimuHost({ go: (t) => kimuGo(t) }), []);
  useEffect(() => {
    setKimuHere({ week: week.week, stage: stage.id, beat: activeBeat, structure: selected ?? formation?.structure, view: view.id });
    return () => setKimuHere(null);
  }, [week.week, stage.id, activeBeat, selected, formation, view.id]);
  const kimuOpen = useKimuOpen();

  const goBack = () => {
    if (!back) return;
    setFormation(null);
    setPlaying(false);
    setBack(null);
    try {
      window.sessionStorage.removeItem(BACK_KEY);
    } catch {}
    if (back.href) {
      router.push(back.href);
      return;
    }
    if (back.week === week.week) {
      const idx = week.stages.findIndex((s) => s.id === back.stage);
      endIntro();
      clearTour();
      setPlaying(false);
      if (idx >= 0) place({ i: idx, t: back.t });
      if (back.view) {
        const bv = back.view;
        setViewByStage((m) => ({ ...m, [back.stage]: bv }));
        setManualView((m) => ({ ...m, [back.stage]: true }));
      }
      setSelected(back.selected);
      return;
    }
    const q = new URLSearchParams({
      etapa: back.stage,
      une: String(Math.max(0.001, back.t)),
    });
    if (back.view) q.set('ikuspegia', back.view);
    if (back.selected) q.set('egitura', back.selected);
    router.push(`/astea/${back.week}?${q.toString()}`);
  };

  /** The explanation panel: a column on wide screens (remembered), a drawer on narrow ones. */
  const narrow = () => focusMode || window.matchMedia(NARROW_SCREEN).matches;
  // What the right column shows right now (the switch in the top bar says exactly this): on a drawer
  // screen only while the drawer is open, whatever the wide-screen preference says.
  const drawer = useNarrowScreen() || focusMode;
  const columnShown = drawer ? panelOpen : infoOpen || notesOpen || panelOpen;
  const summaryShown = columnShown && !notesOpen;
  const notesShown = columnShown && notesOpen;
  const openPanel = () => {
    if (narrow()) setPanelOpen(true);
    else if (!infoOpen) setPref('panel', true);
  };
  const setNotesUrl = (on: boolean) => {
    const url = new URL(window.location.href);
    if (on) url.searchParams.set('apunteak', '1');
    else url.searchParams.delete('apunteak');
    window.history.replaceState(null, '', url);
  };
  // On mid-size screens the notes need the room: the outline folds while they are open (nothing saved:
  // closing the notes or widening the window gives it back), unless the viewer opens it themselves.
  const midScreen = useMidScreen();
  const [outlineKept, setOutlineKept] = useState(false);
  const notesFold = notesOpen && midScreen && !focusMode && !outlineKept;
  const outlineShown = outlineOpen && !notesFold;
  const toggleOutline = () => {
    if (notesFold) {
      setOutlineKept(true);
      setPref('outline', true);
    } else setPref('outline', !outlineOpen);
  };
  const togglePanel = () => {
    // The summary and the notes share the right column: from the notes, "Laburpena" swaps to the summary.
    if (notesOpen) {
      setPref('notes', false);
      setNotesUrl(false);
      setPref('panel', true);
      if (narrow()) setPanelOpen(true);
      return;
    }
    if (narrow()) setPanelOpen((v) => !v);
    else setPref('panel', !infoOpen);
  };
  const toggleNotes = () => {
    // Notes chosen but the drawer is shut: bring them back instead of switching them off.
    if (notesOpen && narrow() && !panelOpen) {
      setSelected(null);
      setPanelOpen(true);
      return;
    }
    const next = !notesOpen;
    setPref('notes', next);
    setSelected(null);
    if (next) {
      setPref('panel', true);
      setPanelOpen(true);
      setOutlineKept(false);
    } else setPanelOpen(false);
    setNotesUrl(next);
  };
  const gotoNote = (ref: NotesAnchor) => {
    const target = getWeek(ref.week)?.stages.find(s => s.id === ref.stageId);
    const targetBeat = target?.beats[ref.beat];
    if (!targetBeat) return;
    setSelected(null);
    setPlaying(false);
    if (ref.week === week.week) {
      const i = week.stages.findIndex(s => s.id === ref.stageId);
      seek(i, targetBeat.at + .00001);
    } else {
      const q = new URLSearchParams({ etapa: ref.stageId, une: String(targetBeat.at + .00001), apunteak: '1' });
      router.push(`/astea/${ref.week}?${q}`);
    }
  };

  // ——— "Aurkitu" (find the structure) quiz ———
  const presentIds = () => {
    const svg = svgRef.current;
    if (!svg) return [] as string[];
    const ids = new Set<string>();
    svg.querySelectorAll<SVGGElement>('[data-part]').forEach((g) => {
      const id = g.dataset.part!;
      const op = Number(g.getAttribute('opacity') ?? 1);
      if (op > 0.5 && structures.has(id)) ids.add(id);
    });
    return [...ids];
  };

  const nextTarget = (prev: string | null) => {
    const ids = presentIds().filter((id) => id !== prev);
    return ids.length ? ids[Math.floor(Math.random() * ids.length)] : null;
  };

  const startFind = (want?: string) => {
    setFormation(null);
    setPlaying(false);
    setSelected(null);
    setFind({ target: want && presentIds().includes(want) ? want : nextTarget(null), ok: 0, tries: 0, message: null });
  };

  // A requested find target waits for its scene to be drawn (after a stage jump or a deep link).
  const runPendingFind = useEffectEvent(() => {
    if (!pendingFind) return;
    startFind(pendingFind);
    setPendingFind(null);
  });
  useEffect(() => {
    if (!pendingFind || !mounted) return;
    const raf = requestAnimationFrame(() => runPendingFind());
    return () => cancelAnimationFrame(raf);
  }, [pendingFind, mounted, pos.i]);

  /** Re-test a concept as an image: go where it is drawn and ask for it in the find quiz. */
  const findConcept = (id: string) => {
    const f = firstSeenOf(id);
    setQuestionsOpen(false);
    if (!f) return;
    if (f.week === week.week) {
      const idx = week.stages.findIndex((s) => s.id === f.stage);
      endIntro();
      clearTour();
      setPlaying(false);
      place({ i: idx, t: 1 });
      setPendingFind(id);
      return;
    }
    router.push(`/astea/${f.week}?${new URLSearchParams({ etapa: f.stage, une: '1', aurkitu: id }).toString()}`);
  };

  const answerFind = (id: string) => {
    if (!find?.target) return;
    const ok = id === find.target;
    recordAnswer(imageId(find.target), ok, nameOf(id));
    setFlash({ id, ok });
    setFind(
      (f) =>
        f && {
          ...f,
          ok: f.ok + (ok ? 1 : 0),
          tries: f.tries + 1,
          message: ok ? `Bai! Hori da ${nameOf(id)}.` : `Ez: hori ${nameOf(id)} da.`,
        },
    );
    window.setTimeout(
      () => {
        setFlash(null);
        if (ok) setFind((f) => f && { ...f, target: nextTarget(f.target), message: null });
      },
      ok ? 900 : 1100,
    );
  };

  const revealFind = () => {
    if (!find?.target) return;
    const id = find.target;
    setFlash({ id, ok: true });
    setFind(
      (f) =>
        f && {
          ...f,
          tries: f.tries + 1,
          message: `Hemen dago: ${nameOf(id)}.`,
        },
    );
    window.setTimeout(() => {
      setFlash(null);
      setFind((f) => f && { ...f, target: nextTarget(id), message: null });
    }, 1500);
  };

  // Re-check after the scene renders (deep links, view switches): is the selection drawn here?
  useEffect(() => {
    if (!selected) return;
    const raf = requestAnimationFrame(() => setSelectedLit(!!svgRef.current?.querySelector(`[data-part="${CSS.escape(selected)}"]`)));
    return () => cancelAnimationFrame(raf);
  }, [selected, stage.id, view.id, mounted]);

  // Cognitive focus: shade the context only when the step's own structures are drawn in this view.
  const [focusLit, setFocusLit] = useState(false);
  const focusKey = `${stage.id}/${view.id}/${activeBeat}`;
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFocusLit(!!beat?.focus?.some((id) => drawnIn(svgRef.current, id))));
    return () => cancelAnimationFrame(raf);
  }, [focusKey, beat, mounted]);

  // 3D views turn by dragging: said once, as a chip in the view corner, until the viewer has done it.
  const [turned3d, setTurned3d] = useState<boolean | null>(null);
  if (mounted && turned3d === null) setTurned3d(readTurned());
  const [turnable, setTurnable] = useState('');
  useEffect(() => {
    // A 3D view's geometry is built off the main thread: look again until it is there (a few seconds at most).
    let tries = 0;
    const look = () => {
      const found = !!svgRef.current?.querySelector('.stage3d-orbit');
      setTurnable(found ? sceneKey : '');
      return found;
    };
    const raf = requestAnimationFrame(look);
    const id = window.setInterval(() => {
      if (look() || ++tries > 30) window.clearInterval(id);
    }, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [sceneKey, mounted]);
  // 3D bira: every structure of the 3D model in turn, each named with its card while the camera turns to
  // the side it is best seen from (Stage3D aims at the lit structure). Runs paused too, at the tour's pace.
  const [bira, setBira] = useState(false);
  const startBira = () => {
    const svg = svgRef.current;
    if (!svg) return;
    // The step's own structures first (what it is about), then the rest of the model as the stage lists it.
    const focus = stage.beats[activeBeat]?.focus ?? [];
    const order = (id: string) => {
      const f = focus.indexOf(id);
      if (f >= 0) return f;
      const i = stage.structures.indexOf(id);
      return 100 + (i < 0 ? 999 : i);
    };
    const ids = [...new Set([...svg.querySelectorAll('.stage3d [data-part]')].map((el) => el.getAttribute('data-part') ?? ''))]
      .filter((id) => structures.has(id) && drawnIn(svg, id))
      .sort((a, b) => order(a) - order(b));
    if (!ids.length) return;
    transport.cancel();
    speaking.current = false;
    setPlaying(false);
    setBira(true);
    setTour({ items: ids, idx: 0, auto: false });
  };
  if (bira && !tour) setBira(false);
  // Playback and a tour never run together: pressing play closes it.
  if (playing && tour) setTour(null);
  useEffect(() => {
    if (!tour?.auto || playing) return;
    // A 3D bira adds the camera's turn (about a second) to the reading time.
    const id = window.setTimeout(
      () => setTour((tr) => (!tr ? tr : tr.idx + 1 < tr.items.length ? { ...tr, idx: tr.idx + 1 } : null)),
      tourMs(tour.items[tour.idx], guided) / speed + (bira ? 1200 : 0),
    );
    return () => window.clearTimeout(id);
  }, [bira, tour, playing, guided, speed]);
  const tourStep = (d: number) => setTour((tr) => (!tr ? tr : { ...tr, idx: Math.max(0, Math.min(tr.items.length - 1, tr.idx + d)), auto: false }));
  const onTurn = () => {
    setTurned3d(true);
    try {
      window.localStorage.setItem(TURNED_KEY, '1');
    } catch {}
  };

  const inScene = (id: string) => !!svgRef.current?.querySelector(`[data-part="${CSS.escape(id)}"]`);
  const pick = (id: string) => {
    setSelected(id);
    setSelectedLit(inScene(id));
  };

  const onSelect = (id: string) => {
    if (find) {
      answerFind(id);
      return;
    }
    if (formation) setPlaying(false);
    pick(id);
    openPanel();
  };

  // Focus mode and full screen go together: leaving one (the F key, the button) leaves the other.
  useEffect(() => {
    if (focusMode) return;
    autoFs.current = false;
    if (document.fullscreenElement && document.fullscreenElement === appRef.current) void document.exitFullscreen?.().catch(() => {});
  }, [focusMode]);

  // The full-screen offer steps aside on its own after a while.
  useEffect(() => {
    if (!fsOffer) return;
    const id = window.setTimeout(() => setFsOffer(false), 10000);
    return () => window.clearTimeout(id);
  }, [fsOffer]);

  // The explanation has ended (playback stopped at the end): leave the full screen we entered for it.
  useEffect(() => {
    if (playing || !focusMode || pos.t < 1 || !autoFs.current) return;
    const id = window.setTimeout(() => setFocusMode(false), 1800);
    return () => window.clearTimeout(id);
  }, [playing, focusMode, pos.t]);

  // Keyboard shortcuts. The listener is subscribed once; the effect event always sees fresh state.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    // The question window has its own keys (1–4, Enter): only Escape reaches the simulator.
    if (questionsOpen && e.key !== 'Escape') return;
    if (e.key === ' ') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey) gotoStage(1);
      else stepBeat(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey) gotoStage(-1);
      else stepBeat(-1);
    } else if (e.key.toLowerCase() === 'l') cycleLabels();
    else if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) setPlayMode(mode === 'gidatua' ? 'arrunta' : mode === 'arrunta' ? 'azkarra' : 'gidatua');
    else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) setFocusMode((v) => !v);
    else if (e.key === '[') toggleOutline();
    else if (e.key === ']') togglePanel();
    else if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleNotes(); }
    else if (e.key === '?') setHelpOpen(true);
    else if (e.key === 'Escape') {
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (focusMode && !selected && !find) {
        setFocusMode(false);
        return;
      }
      setSelected(null);
      setFind(null);
      setGlossaryOpen(false);
      setQuestionsOpen(false);
      setPanelOpen(false);
      setNowOpen(false);
    } else if (/^[1-9]$/.test(e.key)) {
      const v = stage.views[Number(e.key) - 1];
      if (v) chooseView(v.id);
    }
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const ctx: SceneContextValue = {
    selected: find || !selectedLit ? null : selected,
    hovered: find ? hovered : hovered,
    focus: find || intro !== null ? [] : formation ? (formation.highlight ?? [formation.structure]) : voice && audioState.focus.length ? audioState.focus : (beat?.focus ?? []),
    dimContext: !formation && focusLit && !view.ownFocus && !find && intro === null,
    spotlight: !find && intro === null && tour ? tour.items[tour.idx] : null,
    showLabels: showLabels && intro === null,
    named: labelMode === 'urratsez' && !formation && !find ? namedAt(week.week, stage, glideBeat ?? activeBeat) : null,
    quiz: !!find,
    quizFlash: flash,
    nameOf,
    isSpace,
    partsOf,
    onSelect,
    onHover: setHovered,
  };

  // Rings for step structures drawn too small to notice: the tour's current one, else the selection, else the step's.
  const spot = !find && intro === null && tour ? tour.items[tour.idx] : null;
  const marks = find || intro !== null ? [] : formation ? [formation.structure] : spot ? [spot] : selected && selectedLit ? [selected] : voice && audioState.focus.length ? audioState.focus : (beat?.focus ?? []);

  // Legend: categories present in this stage.
  const legend = legendOf(stage.structures);

  const day = lerpDay(stage.dayRange, pos.t);

  // A view change: the camera moves (travel or zoom) when it can; the live map in the stage bar shows
  // the old and the new plane on the body either way, so no card covers the picture.
  const snap: ViewSnap = { key: sceneKey, week: week.week, stageTitle: stage.title, label: view.label, plane: view.plane, day, level: view.locator?.level, orientation: view.orientation };
  const [seenView, setSeenView] = useState<ViewSnap | null>(null);
  // Only once the deep link has been applied: the view a link replaces was never on screen.
  if (mounted && linkedWeek === week.week && seenView?.key !== sceneKey) {
    setSeenView(snap);
    // When the view of the same body changes (by the simulation or by the viewer), the camera travels from the old plane to the new one.
    const [fw, fs, fv] = seenView?.key.split('/') ?? [];
    const fromView = Number(fw) === week.week ? week.stages.find((x) => x.id === fs)?.views.find((x) => x.id === fv) : undefined;
    const may = !formation && !reduced && !travel && intro === null && fromView && seenView;
    const plan = may ? travelPlan(week.week, day, fromView, view, seenView.day) : null;
    // A close-up of the same stage's other view: the camera dives into where it is (or pulls back out).
    const zoom = may && !plan && fs === stage.id ? zoomPlan(fromView, view) : null;
    if (plan) setTravel({ key: sceneKey, plan });
    else if (zoom) setTravel({ key: sceneKey, zoom });
    else if (travel) setTravel(null);
  }
  // Playback waits while the camera moves.
  useEffect(() => {
    bridgeHold.current = !!travel;
  }, [travel]);
  /** "Non nago?": out to the whole body (the plane on it) and back in, on the same view. */
  const reveal = revealPlan(week.week, day, view);
  const startReveal = () => {
    if (!reveal || travel || reduced) return;
    setPlaying(false);
    endIntro();
    clearTour();
    setGhost({ key: sceneKey, i: pos.i, view: view.id, t: pos.t });
    setTravel({ key: sceneKey, plan: reveal });
  };
  /** The topic's transverse cuts of the modelled body: the live map's plane snaps to them (one per level). */
  const cutStops: CutStop[] = (() => {
    const all = week.stages.flatMap((s) =>
      s.views.filter((v) => v.plane === 'zeharkakoa' && v.locator?.level !== undefined && v.travel !== false).map((v): CutStop => ({ level: v.locator!.level ?? 0.5, stage: s.id, view: v.id, note: v.locator!.note ?? '', title: s.title })),
    );
    const out: CutStop[] = [];
    for (const c of all) {
      const twin = out.findIndex((o) => Math.abs(o.level - c.level) < 0.04);
      if (twin < 0) out.push(c);
      else if (c.stage === stage.id && c.view === view.id) out[twin] = c;
    }
    return out.sort((a, b) => a.level - b.level);
  })();
  /** The plane let go on another cut: that view, at the step that shows it (with the way back when it is another stage). */
  const gotoCut = (c: CutStop) => {
    if (c.stage === stage.id) {
      chooseView(c.view);
      return;
    }
    const idx = week.stages.findIndex((s) => s.id === c.stage);
    if (idx < 0) return;
    const target = week.stages[idx];
    let k = -1;
    let shownView = target.views[0].id;
    target.beats.forEach((b, j) => {
      if (b.view && target.views.some((v) => v.id === b.view)) shownView = b.view;
      if (k < 0 && shownView === c.view) k = j;
    });
    setBack({ week: week.week, stage: stage.id, t: pos.t, view: view.id, selected, title: stage.title });
    endIntro();
    clearTour();
    setPlaying(false);
    if (k < 0) {
      setManualView((m) => ({ ...m, [c.stage]: true }));
      setViewByStage((m) => ({ ...m, [c.stage]: c.view }));
    }
    place({ i: idx, t: k >= 0 ? doneAt(target, k) : 0 });
    setSelected(null);
  };
  // The path from the whole body to this view: the body (out and back), the region or the drawing a close-up came from, this view.
  const parentView = view.zoom ? stage.views.find((v) => v.id === view.zoom!.from) : undefined;
  const crumbs: Crumb[] = [
    { label: shapeFor(week.week, day, view.plane) === 'fetua' ? 'Fetua' : 'Enbrioia', tip: reveal ? 'Kamera atzera: gorputz osoa eta planoa, eta berriro hona' : undefined, onClick: reveal && !reduced ? startReveal : undefined },
    ...(parentView ? [{ label: parentView.label, tip: `Itzuli ${parentView.label.toLowerCase()} ikuspegira`, onClick: () => chooseView(parentView.id) }] : view.locator?.note ? [{ label: view.locator.note }] : []),
    { label: view.label, tip: view.description },
  ];

  const nextStage = week.stages[pos.i + 1];
  // The topic's last stage ends on the next topic (or, after the last one, on the questions): no dead end.
  const nextTopic = nextStage ? undefined : weeks.find((w) => w.week > week.week && !isWip(w));
  const finish = nextStage
    ? undefined
    : nextTopic
      ? { label: 'Hurrengo gaia', tip: `Hurrengo gaia: ${nextTopic.week}. ${nextTopic.title}`, onClick: () => router.push(`/astea/${nextTopic.week}`) }
      : { label: 'Galderak', tip: 'Gaiak amaituta: frogatu zure burua galderekin', onClick: () => { setQuestionsConcept(undefined); setQuestionsOpen(true); } };
  const prevWeek = weeks[weeks.indexOf(week) - 1];
  const prevStage = week.stages[pos.i - 1] ?? prevWeek?.stages[prevWeek.stages.length - 1];
  const sceneT = intro !== null ? easeInOut(Math.min(1, intro)) : pos.t;

  return (
    <div ref={appRef} className={`app${focusMode ? ' is-focus' : ''}${voice ? ' is-narrated' : ''}`}>
      <header className="topbar">
        <Link href="/" className="tb-brand" title="Hasiera">
          <Wordmark size={20} />
        </Link>
        <WeekNav current={week} stageId={stage.id} />
        <div className="tb-tools">
          {/* Test yourself (Aurkitu, Galderak) · ask (Kimu) · what the right column shows · more · the one help. */}
          <div className="tb-group" role="group" aria-label="Frogatu">
            <button data-tour="aurkitu" className={`tool tool-main mobile-tool-hidden${find ? ' is-on' : ''}`} aria-label={find ? 'Aurkitu amaitu' : 'Aurkitu'} aria-pressed={!!find} onClick={() => (find ? setFind(null) : startFind())} data-tip={find ? 'Aurkitzeko jokoa amaitu · Esc' : 'Frogatu: irudian galdetzen zaizun egitura klikatu'} data-tip-pos="bottom">
              <IconTarget size={16} /> <span>Aurkitu</span>
            </button>
            <button
              className="tool tool-main mobile-questions"
              data-tour="galderak"
              aria-label="Galderak"
              onClick={() => {
                setQuestionsConcept(undefined);
                setQuestionsOpen(true);
              }}
              data-tip="Frogatu: aukera anitzeko galderak, azalpenarekin"
              data-tip-pos="bottom"
            >
              <IconQuiz size={16} /> <span>Galderak</span>
            </button>
          </div>
          <button data-tour="kimu" className={`tool tool-main kimu-tool mobile-tool-hidden${kimuOpen ? ' is-on' : ''}`} onClick={toggleKimu} aria-label="Galdetu Kimuri" aria-expanded={kimuOpen} data-tip="Galdetu Kimuri: lekura eramango zaitu · K" data-tip-pos="bottom">
            <KimuFace size={26} mood="happy" still /> <span className="tb-l">Galdetu Kimuri</span>
            <span className="tb-s" aria-hidden>Kimu</span>
          </button>
          <span className="tb-sep mobile-tool-hidden" aria-hidden />
          {/* The right column shows the stage summary or the original notes (or nothing): one switch. */}
          <div className="tb-panels" role="group" aria-label="Eskuineko zutabea">
            <button className={`tool mobile-tool-hidden${summaryShown ? ' is-on' : ''}`} aria-label="Laburpena" onClick={togglePanel} data-tip={summaryShown ? 'Laburpena ezkutatu · ]' : 'Etaparen laburpena: gakoak, datak eta egiturak · ]'} data-tip-pos="bottom" aria-pressed={summaryShown}>
              <IconRail open={summaryShown} side="right" /> <span>Laburpena</span>
            </button>
            <button data-tour="apunteak" className={`tool mobile-notes${notesShown ? ' is-on' : ''}`} aria-label="Apunteak" onClick={toggleNotes} aria-pressed={notesShown} data-tip={notesShown ? 'Apunteak ezkutatu · N' : 'Jatorrizko apunteak, simulazioarekin batera · N'} data-tip-pos="bottom-end">
              <IconNotes size={16} /> <span>Apunteak</span>
            </button>
          </div>
          <Popover
            trigger={({ open, toggle }) => (
              <button data-tour="tresnak" className={`tool${open ? ' is-on' : ''}`} aria-label="Tresnak" onClick={toggle} aria-expanded={open} aria-haspopup="menu" data-tip="Glosarioa, kronologia, leinuak, irudiak…" data-tip-pos="bottom">
                <IconMore size={16} /> <span>Tresnak</span>
              </button>
            )}
          >
            {(close) => (
              <div className="menu" role="menu">
                <button className="mobile-menu-item" role="menuitem" onClick={() => { close(); toggleKimu(); }}>
                  <KimuFace size={22} mood="happy" still /> Galdetu Kimuri
                </button>
                <button className="mobile-menu-item" role="menuitem" onClick={() => { close(); if (find) setFind(null); else startFind(); }}>
                  <IconTarget size={16} /> {find ? 'Aurkitu amaitu' : 'Aurkitu'}
                </button>
                <button className="mobile-menu-item" role="menuitem" onClick={() => { close(); setQuestionsConcept(undefined); setQuestionsOpen(true); }}>
                  <IconQuiz size={16} /> Galderak
                </button>
                <button className="mobile-menu-item" role="menuitem" onClick={() => { close(); toggleNotes(); }}>
                  <IconNotes size={16} /> Apunteak
                </button>
                <button className="mobile-menu-item" role="menuitem" onClick={() => { close(); togglePanel(); }}>
                  <IconRail open={summaryShown} side="right" /> Laburpena
                </button>
                <button className="mobile-menu-item" role="menuitem" onClick={() => { close(); toggleOutline(); }}>
                  <IconRail open={outlineShown} side="left" /> Aurkibidea
                </button>
                <hr className="mobile-menu-item" />
                <button
                  role="menuitem"
                  onClick={() => {
                    close();
                    setGlossaryOpen(true);
                  }}
                >
                  <IconBook size={16} /> Glosarioa
                </button>
                <Link role="menuitem" href={`/kronologia?eguna=${Math.round(day)}`} onClick={close}>
                  <IconClock size={16} /> Kronologia <small>zer dago egun honetan?</small>
                </Link>
                <Link role="menuitem" href="/leinuak" onClick={close}>
                  <IconTree size={16} /> Leinuak <small>ernetze orrien zuhaitza</small>
                </Link>
                <Link role="menuitem" href="/irudiak" onClick={close}>
                  <IconImage size={16} /> Irudiak <small>etiketarik gabe</small>
                </Link>
                <hr />
                <button
                  role="menuitem"
                  onClick={() => {
                    close();
                    setFocusMode(true);
                  }}
                >
                  <IconExpand size={16} /> Foku modua <kbd>F</kbd>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    close();
                    setHelpOpen(true);
                  }}
                >
                  <IconHelp size={16} /> Laguntza <kbd>?</kbd>
                </button>
              </div>
            )}
          </Popover>
          <button className="tool tool-icon tb-help mobile-tool-hidden" data-tour="laguntza" aria-label="Laguntza" onClick={() => setHelpOpen(true)} data-tip="Laguntza: gida laburra, botoiak, teklak eta koloreak · ?" data-tip-pos="bottom-end">
            <IconHelp size={17} />
          </button>
        </div>
      </header>

      <div className={`workspace${notesOpen ? ' notes-mode' : ''}${panelOpen ? ' panel-open' : ''}${outlineShown ? '' : ' no-outline'}${infoOpen || notesOpen ? '' : ' no-info'}${selected ? ' has-sel' : ''}`}>
        <Outline
          collapsed={!outlineShown}
          onToggle={toggleOutline}
          week={week}
          current={pos.i}
          visited={visited}
          onStage={openStage}
        />

        <main className={`stage${formation ? ' has-formation' : ''}${find && print ? ' is-print' : ''}`}>
          <div className="stage-bar">
            <div className="stage-heading">
              {/* Where this stage sits in the notes: topic › heading, numbered as the notes number it. */}
              <div className="crumbs-row">
                {/* Where this stage sits in the notes and among the topic's stages: one key that opens the
                    notes' index (the outline's job when its column is folded). */}
                <StageNav
                  week={week}
                  current={pos.i}
                  visited={visited}
                  onStage={openStage}
                  label={notesAt ? sectionLabel(notesAt.section) : `${week.week}. gaia`}
                  outlineShown={outlineShown}
                  onToggleOutline={toggleOutline}
                />
                {/* After a jump to where something formed: the way back, beside "where am I", never over the picture. */}
                {back && (
                  <button className="back-chip" onClick={goBack} title={`Itzuli: ${back.title}`}>
                    <span aria-hidden>←</span> Bueltatu <b>{back.title}</b>
                  </button>
                )}
              </div>
              <div className="stage-title">
                <h2 title={stage.title}>{stage.title}</h2>
                <button className="day-chip" data-tour="eguna" onClick={() => setNowOpen((v) => !v)} aria-expanded={nowOpen} title={`${weekOfDay(day)}. astea · ${periodOf(day).name} — zer dago orain, zer den berria, zer desagertu den`}>
                  <IconCalendar size={13} />
                  <span>{stage.day}</span>
                  <IconChevron size={12} className="day-chip-caret" />
                </button>
              </div>
              {nowOpen && (
                <NowCard
                  day={day}
                  stageDays={stage.day}
                  onClose={() => setNowOpen(false)}
                  onPick={(id) => {
                    setNowOpen(false);
                    pick(id);
                    openPanel();
                  }}
                />
              )}
            </div>
            <div className="stage-side">
              {/* Its first-time explanation waits while anything else holds the eye (playback and its preview,
                  the find quiz, the day card, Kimu, a window), so two cards never cover the specimen at once. */}
              <Locator
                plane={view.plane}
                week={week.week}
                day={day}
                level={view.locator?.level}
                orientation={view.orientation}
                note={view.locator?.note}
                view={view.description}
                label={view.label}
                crumbs={crumbs}
                stops={cutStops}
                onStop={gotoCut}
                viewKey={sceneKey}
                hold={(drawer && panelOpen) || helpOpen || tourBusy || questionsOpen || glossaryOpen || !!travel || playing || intro !== null || !!find || nowOpen || kimuOpen || !!formation}
                onOpen={() => setNowOpen(false)}
              />
              {stage.views.length > 1 && <ViewSwitch views={stage.views} current={view.id} onChoose={chooseView} />}
            </div>
          </div>

          <SceneContext.Provider value={ctx}>
            <Viewport
              interactive3d={turnable === sceneKey && !travel && intro === null && !find}
              ref={svgRef}
              orientation={travel ? undefined : view.orientation}
              resetKey={`${stage.id}/${view.id}`}
              onBackgroundClick={() => !find && setSelected(null)}
              marks={travel ? [] : marks}
              reveal={travel || find || intro !== null || formation ? undefined : beat?.focus}
              revealKey={focusKey}
              nameOf={nameOf}
              fullscreenRef={appRef}
              onFullscreenChange={setFocusMode}
              makeRoom={intro !== null}
              hoverNames={showLabels && !find && intro === null && !travel}
              onTurn={turned3d ? undefined : onTurn}
              overlay={
                <>
                  <div className="view-tools">
                    <button
                      className={`icon-btn label-mode is-${labelMode}${labelMode === 'guztiak' ? ' is-on' : ''}`}
                      onClick={cycleLabels}
                      data-tip={labelMode === 'urratsez' ? 'Izenak urratsez urrats (aipatu ahala) · sakatu: izen guztiak · L' : labelMode === 'guztiak' ? 'Izen guztiak · sakatu: izenik gabe · L' : 'Izenik gabe · sakatu: urratsez urrats · L'}
                      data-tip-pos="left"
                      aria-label={labelMode === 'urratsez' ? 'Izenak: urratsez urrats' : labelMode === 'guztiak' ? 'Izenak: guztiak' : 'Izenak: ezkutatuta'}
                    >
                      <IconTag size={16} />
                      {labelMode !== 'urratsez' && <i className="label-mode-pip" aria-hidden>{labelMode === 'guztiak' ? '∀' : '–'}</i>}
                    </button>
                    <button className={`icon-btn${legendOpen ? ' is-on' : ''}`} onClick={() => setLegendOpen((v) => !v)} data-tip="Koloreen esanahia" data-tip-pos="left" aria-label="Kolore-kodea" aria-pressed={legendOpen}>
                      <IconLayers size={16} />
                    </button>
                  </div>
                  {legendOpen && (
                    <div className="legend">
                      {legend.map(([cat, color]) => (
                        <span key={cat}>
                          <i style={{ background: color }} />
                          {categoryLabel[cat]}
                        </span>
                      ))}
                      <span className="legend-space" title="Barrunbea espazio bat da (hutsunea, likidoa); ehuna, berriz, zelulez osatuta dago.">
                        <i aria-hidden />
                        <em>Etzana</em> = barrunbea (espazioa, ez ehuna)
                      </span>
                    </div>
                  )}
                  {back && focusMode && (
                    // Focus mode hides the stage heading, so the way back floats at the top of the picture.
                    <button className="back-chip is-float" onClick={goBack} title={`Itzuli: ${back.title}`}>
                      <span aria-hidden>←</span> Bueltatu <b>{back.title}</b>
                    </button>
                  )}
                  {focusMode && !tour && !fsOffer && (
                    // Says where we are, then steps out of the way: the bottom-left corner holds names.
                    <p className="focus-title" key={`ft-${stage.id}`}>
                      <span>
                        {week.week}. gaia{notesAt ? ` › ${sectionLabel(notesAt.section)}` : ''}
                      </span>
                      <b>{stage.title}</b>
                    </p>
                  )}
                  {focusMode && (
                    // Under the scene tools, in the strip the scenes keep clear of names (a bottom corner covered labels).
                    <div className="focus-exit" role="group" aria-label="Foku modua">
                      <button className={`icon-btn${panelOpen ? ' is-on' : ''}`} onClick={togglePanel} aria-label="Laburpena" aria-pressed={panelOpen} data-tip={panelOpen ? 'Laburpena ezkutatu · ]' : 'Laburpena eta datak erakutsi · ]'} data-tip-pos="left">
                        <IconRail open={panelOpen} side="right" />
                      </button>
                      <button className="icon-btn" onClick={() => setFocusMode(false)} aria-label="Irten foku modutik" data-tip="Irten: aurkibidea eta tresnak berriro · F" data-tip-pos="left">
                        <IconShrink />
                      </button>
                    </div>
                  )}
                  {turnable === sceneKey && !tour && intro === null && !find && !travel && (
                    <button className="bira-btn" key={`bira-${sceneKey}`} onClick={startBira} data-tip="Egitura bakoitza bere aldetik: kamera bakoitzera biratzen da" data-tip-pos="bottom-end">
                      <span className="turn-hint-i" aria-hidden>↻</span>
                      <b>3D bira</b>
                    </button>
                  )}
                  {turnable === sceneKey && turned3d === false && intro === null && !find && !travel && (
                    <p className="turn-hint" key={`turn-${sceneKey}`} role="status">
                      <span className="turn-hint-i" aria-hidden>↻</span>
                      <b>Arrastatu biratzeko</b>
                      <small>klik bikoitza: hasierara</small>
                    </p>
                  )}
                  {intro !== null && (
                    <div className="pv-card" key={`intro-${stage.id}`}>
                      <div className="pv-top">
                        <span className="pv-kicker">Aurrebista · {stage.day}</span>
                        <span className="pv-actions">
                          {!focusMode && (
                            <button className="icon-btn pv-fs" onClick={enterFull} aria-label="Pantaila osoa" data-tip="Pantaila osoan ikusi (azalpena amaitzean berez irtengo da)" data-tip-pos="bottom-end">
                              <IconExpand size={15} />
                            </button>
                          )}
                          {intro < 1 && (
                            <button className="btn small ghost" onClick={endIntro}>
                              Saltatu <span aria-hidden>→</span>
                            </button>
                          )}
                        </span>
                      </div>
                      {notesAt && (
                        <p className="pv-prev pv-notes">
                          <span>Apunteetan</span> {week.week}. gaia › {sectionLabel(notesAt.section)}
                        </p>
                      )}
                      {prevStage && pos.i === 0 && (
                        <p className="pv-prev">
                          <span>Aurreko gaia</span> {prevStage.title}
                        </p>
                      )}
                      <h3>{stage.title}</h3>
                      {stage.subtitle && <p className="pv-sub">{stage.subtitle}</p>}
                      {stage.intro && <p className="pv-desc">{stage.intro}</p>}
                      {stage.keyPoints.length > 0 && (
                        <ul className="pv-keys">
                          {stage.keyPoints.slice(0, 3).map((k) => (
                            <li key={k}>{k}</li>
                          ))}
                        </ul>
                      )}
                      <div className="pv-foot">
                        <span className="pv-bar">
                          <i
                            style={{
                              transform: `scaleX(${Math.min(1, intro)})`,
                            }}
                          />
                        </span>
                        <small>{intro < 1 ? 'Aurrebista: prozesu osoa' : guided ? 'Irakurri lasai; prest zaudenean, hasi' : 'Orain, urratsez urrats'}</small>
                        {intro >= 1 && (
                          <button className="btn small btn-light pv-go" onClick={endIntro} title="Hasi urratsez urrats (Zuriunea)">
                            Hasi <span aria-hidden>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {fsOffer && playing && !focusMode && !tour && (
                    <div className="fs-offer is-left" role="group" aria-label="Pantaila osoa">
                      <span className="fs-offer-icon" aria-hidden>
                        <IconExpand size={15} />
                      </span>
                      <span className="fs-offer-text">
                        <b>Pantaila osoan hobeto ikusten da</b>
                        <small>Azalpena amaitzean, berez irtengo da</small>
                      </span>
                      <span className="fs-offer-actions">
                        <button className="btn small btn-light" onClick={enterFull}>
                          Pantaila osoa
                        </button>
                        <button className="btn small ghost" onClick={() => setFsOffer(false)}>
                          Orain ez
                        </button>
                        <button
                          className="fs-offer-never"
                          onClick={() => {
                            setPref('fsAsk', false);
                            setFsOffer(false);
                          }}
                        >
                          Ez galdetu berriro
                        </button>
                      </span>
                    </div>
                  )}
                  {find && (
                    <div className="find-bar">
                      <IconTarget size={16} />
                      <div className="find-text">
                        {find.target ? (
                          <>
                            <small>Klikatu irudian</small>
                            <strong>{nameOf(find.target)}</strong>
                          </>
                        ) : (
                          <strong>Ez dago egiturarik ikuspegi honetan.</strong>
                        )}
                        {find.message && <span className={`find-msg${flash?.ok ? ' ok' : ' bad'}`}>{find.message}</span>}
                      </div>
                      <span className="find-score">
                        {find.ok}/{find.tries}
                      </span>
                      <button className={`btn small ghost${print ? ' is-on' : ''}`} onClick={() => setPrint((v) => !v)} aria-pressed={print} title="Zuri-beltzean, etiketarik gabe">
                        Zuri-beltza
                      </button>
                      <button className="btn small" onClick={revealFind} disabled={!find.target}>
                        Erakutsi
                      </button>
                      <button className="btn small ghost" onClick={() => setFind(null)}>
                        Irten
                      </button>
                    </div>
                  )}
                </>
              }
            >
              {travel?.key === sceneKey && travel.zoom && ghost && GhostScene ? (
                <ViewZoom
                  key={`zoom-${travel.key}`}
                  plan={travel.zoom}
                  old={<SceneView Scene={GhostScene} t={ghost.t} reduced={reduced} />}
                  onDone={() => {
                    setTravel(null);
                    setGhost(null);
                    setArrived(sceneKey);
                  }}
                >
                  {mounted && <SceneView Scene={Scene} t={sceneT} reduced={reduced} />}
                </ViewZoom>
              ) : travel?.key === sceneKey && travel.plan && ghost && GhostScene ? (
                <ViewTravel
                  key={`travel-${travel.key}`}
                  plan={travel.plan}
                  old={<SceneView Scene={GhostScene} t={ghost.t} reduced={reduced} />}
                  onDone={() => {
                    setTravel(null);
                    setGhost(null);
                    setArrived(sceneKey);
                  }}
                >
                  {mounted && <SceneView Scene={Scene} t={sceneT} reduced={reduced} />}
                </ViewTravel>
              ) : (
                <>
                  <g key={`${stage.id}/${view.id}`} className={arrived === sceneKey ? 'scene-arrived' : 'scene-enter'}>
                    {mounted && <SceneView Scene={Scene} t={sceneT} reduced={reduced} />}
                  </g>
                  {ghost && GhostScene && (
                    <g key={`ghost-${ghost.key}`} className="scene-ghost" pointerEvents="none" aria-hidden>
                      <SceneView Scene={GhostScene} t={ghost.t} reduced={reduced} />
                    </g>
                  )}
                </>
              )}
            </Viewport>
          </SceneContext.Provider>

          {formation && (
            <section className="formation-card" aria-label="Kimuren eraketa" data-formation={formation.structure} data-complete={pos.t >= formation.end}>
              <span className="formation-face" aria-hidden>
                <KimuFace size={30} mood="happy" still />
              </span>
              <div className="formation-text">
                <p className="kicker">Kimu · {pos.t >= formation.end ? 'Amaituta — zure erritmoan jarraitu' : playing ? 'Eraketa ikusten' : 'Pausatuta'}</p>
                <strong>{nameOf(formation.structure)}</strong>
                <p>{stage.beats[formation.beat].idea ?? stage.beats[formation.beat].text}</p>
              </div>
              <div className="formation-actions">
                <button className="btn small" onClick={() => {
                  place({ i: pos.i, t: formation.start });
                  setFormation(formation); setSelected(null); setPlaying(true);
                }}>Errepikatu</button>
                <button className={`btn small${pos.t >= formation.end ? ' primary' : ''}`} onClick={() => {
                  setFormation(null); setSelected(null); setPlaying(false);
                  endIntro(); clearTour();
                  if (activeBeat + 1 < stage.beats.length) gotoBeat(activeBeat + 1);
                  else if (pos.i + 1 < week.stages.length) gotoStage(1);
                }}>Jarraitu</button>
                <button className="btn small ghost" onClick={() => { setPlaying(false); pick(formation.structure); openPanel(); }}>Xehetasunak</button>
                <button className="btn small ghost" onClick={() => { setPlaying(false); setSelected(null); setPref('notes', true); openPanel(); }}>Apunteak</button>
              </div>
            </section>
          )}
          <Player
            modelGuide={view.guide && !find ? { key: sceneKey, content: view.guide, onOpen: () => { transport.cancel(); speaking.current = false; setPlaying(false); } } : undefined}
            stage={withRecall(week.week, stage)}
            stageIndex={pos.i}
            stageCount={week.stages.length}
            nextTitle={nextStage?.title}
            t={pos.t}
            activeBeat={glideBeat ?? activeBeat}
            playing={playing}
            speed={speed}
            autoContinue={autoContinue}
            day={clockLabel(day, stage.day, view.age, stage.beats[glideBeat ?? activeBeat]?.age)}
            onSeek={(t) => seek(pos.i, t)}
            onTogglePlay={togglePlay}
            onStage={gotoStage}
            onBeat={stepBeat}
            onSpeed={setSpeed}
            onAutoContinue={setAutoContinue}
            asks={asksOn}
            onAsks={(v) => setPref('asks', v)}
            guided={guided}
            mode={mode}
            onMode={setPlayMode}
            voice={voice}
            audioState={audioState}
            voiceConfigured={voiceConfigured}
            onRepeat={() => { endIntro(); clearTour(); place({ i: pos.i, t: beat.at + .000001 }); setVoiceStarted(true); setPlaying(true); }}
            waiting={!formation && waiting && playing && intro === null}
            waitSeconds={!formation && waiting && playing && intro === null ? waitSeconds : null}
            fresh={!formation && guided && intro === null ? fresh : []}
            travelling={!!travel}
            unseen={unseen ? (activeBeat === 0 && pos.t <= stage.beats[0].at + 0.002 ? 'start' : 'step') : undefined}
            onTour={formation || find ? undefined : startTour}
            tourCard={
              tour && intro === null && structures.get(tour.items[tour.idx]) ? (
                <TourCard item={structures.get(tour.items[tour.idx])!} idx={tour.idx} n={tour.items.length} auto={!!tour.auto} onStep={tourStep} onClose={skipTour} onPick={onSelect} kicker={bira ? '3D bira' : undefined} manual={bira} />
              ) : undefined
            }
            stepExtras={stepExtrasOf(week.week, stage, guided)}
            intro={formation || intro === null ? null : intro >= 1 ? 'ready' : 'running'}
            onStart={endIntro}
            askState={askNow ? (answered === askKey ? 'answered' : 'open') : undefined}
            onAskDone={doneAsk}
            onVoice={(v) => { transport.cancel(); setVoiceStarted(true); setPref('voice', v); if (v) { setPlayMode('gidatua'); setPref('panel', false); setPanelOpen(false); setSelected(null); endIntro(); place({ i: pos.i, t: beat.at + .000001 }); setPlaying(true); } }}
            onContinue={continueHold}
            onNextStage={continueNext}
            cue={!playing && pos.t === 0 && !find && intro === null && !formation}
            finish={finish}
            onPick={onSelect}
            onTermHover={(id) => setHovered(id && inScene(id) ? id : null)}
            noTerms={!!find}
            dates={intro === null && !find ? dates : []}
            onRecall={(id) => {
              const f = firstSeenOf(id);
              if (f && f.beat >= 0) replay(f.week, f.stage, f.at, id);
              else {
                pick(id);
                openPanel();
              }
            }}
            ask={
              askNow && beat.ask ? (
                <AskCard key={askKey} id={`mikro:${week.week}/${askKey}`} ask={beat.ask} onAnswer={() => setAnswered(askKey)} onSkipAll={() => { setPref('asks', false); doneAsk(); }} />
              ) : undefined
            }
          />
        </main>

        <aside className="info" aria-label="Azalpena" data-tour="eskuineko-zutabea">
          {notesOpen && selected && <button className="notes-back" onClick={() => setSelected(null)}>← Apunteak</button>}
          {selected ? (
            <Inspector id={selected} week={week} currentStageId={stage.id} onClose={() => setSelected(null)} onSelect={pick} onGoto={(w, sid) => gotoWeekStage(w, sid, selected)} onReplay={replay}
              onPractice={(id) => {
                setQuestionsConcept(id);
                setQuestionsOpen(true);
              }}
              onFind={findConcept}
            />
          ) : notesOpen ? (
            <NotesPanel key={`${week.week}/${formation?.structure ?? 'notes'}`} week={week.week} stage={stage} activeBeat={notesBeatIndex}
              progress={notesProgress}
              sourceBeat={formation?.beat}
              onGoto={gotoNote} onDismiss={toggleNotes} />
          ) : (
            <StageInfo
              key={stage.id}
              week={week.week}
              stage={stage}
              activeBeat={glideBeat ?? activeBeat}
              onSeek={(t) => seek(pos.i, t)}
              onSelect={onSelect}
              onDismiss={() => (narrow() ? setPanelOpen(false) : setPref('panel', false))}
              onHover={(id) => setHovered(id && inScene(id) ? id : null)}
              guide={
                week.week === 7 ? (
                  <CavityRoad week={week} stage={stage.id} focus={stage.beats[glideBeat ?? activeBeat]?.focus ?? []} onStage={openStage} onHover={(id) => setHovered(id && inScene(id) ? id : null)} />
                ) : undefined
              }
            />
          )}
        </aside>
        {panelOpen && <button className="info-scrim" aria-label="Itxi panela" onClick={() => setPanelOpen(false)} />}
      </div>

      {glossaryOpen && (
        <Glossary
          onClose={() => setGlossaryOpen(false)}
          onPick={(id) => {
            setGlossaryOpen(false);
            pick(id);
            setPanelOpen(true);
          }}
        />
      )}
      {helpOpen && <Help onClose={() => setHelpOpen(false)} />}
      <TourHost tour="sim" />
      {questionsOpen && <Questions week={week.week} concept={questionsConcept} review={questionsReview} onClose={() => { setQuestionsOpen(false); setQuestionsReview(false); }} onGoto={(w, sid, c) => gotoWeekStage(w, sid, c)} onFind={findConcept} />}
    </div>
  );
}

const lerpDay = (r: [number, number], t: number) => r[0] + (r[1] - r[0]) * t;
