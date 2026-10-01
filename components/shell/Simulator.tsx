'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import { SceneContext, type QuizFlash, type SceneContextValue } from '@/components/kit/context';
import { getWeek, isSpace, nameOf, structures, weeks } from '@/content/registry';
import { firstSeenOf, periodOf, weekOfDay } from '@/content/chronology';
import { ageLabel, spanOf } from '@/lib/sim/age';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { StageDef, StructureCategory, StructureDef, WeekDef } from '@/lib/sim/types';
import { Glossary } from './Glossary';
import { IconBook, IconCalendar, IconNotes, IconClock, IconExpand, IconImage, IconLayers, IconMore, IconPlay, IconQuiz, IconTag, IconTarget, IconTree, PlaneGlyph } from './icons';
import { Popover } from './Popover';
import { Wordmark, isWip } from './LandNav';
import { AskCard, Player, TourCard, ideaOf } from './Player';
import { Help, useHelpOnce } from './Help';
import { Questions } from './Questions';
import { Inspector } from './Inspector';
import { NotesPanel } from './NotesPanel';
import type { NotesAnchor } from '@/content/notes-text';
import { NowCard } from './NowCard';
import { Locator } from './Locator';
import { ViewBridge, needsBridge, type ViewSnap } from './ViewBridge';
import { IconRail, Outline, StageInfo } from './SidePanel';
import { Viewport } from './Viewport';
import { KimuFace } from '@/components/kimu/KimuFace';
import { registerKimuHost, setKimuHere, toggleKimu, useKimuOpen } from '@/components/kimu/store';
import { hush, speak } from './narrate';
import { getPref, setPlayMode, setPref, usePref, type PlayMode } from './prefs';
import { markVisited, useVisited } from './progress';
import { recordAnswer } from './answers';
import { imageId } from '@/content/pool';
import { sectionLabel, sectionOf } from '@/content/notes';
import { examDatesAt } from '@/content/examDates';
import { formationFrame, formationOf, type Formation } from '@/content/formation';
import type { KimuTarget } from '@/lib/kimu/types';

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

const LAST_VIEW_KEY = 'enbrioatlas:last-view';
/** The view shown last in ANOTHER week (so the first view of this week can be bridged from it). */
const readLastView = (week: number): ViewSnap | null => {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(LAST_VIEW_KEY) ?? 'null') as (ViewSnap & { at: number }) | null;
    return v && v.week !== week && Date.now() - v.at < 30 * 60 * 1000 ? v : null;
  } catch {
    return null;
  }
};


/** Minimum caption dwell in normal playback, with extra time for longer explanations. */
const captionDwellMs = (stage: StageDef, k: number) => Math.max(5500, (stage.beats[k]?.text.length ?? 0) * 80);

/** Quick replay dwell: just long enough to read the step's main idea. */
const quickDwellMs = (stage: StageDef, k: number) => Math.max(1600, ideaOf(stage.beats[k]).length * 38);

/** Stage time before a step boundary where a reading hold rests (scenes cross-fade steps over ~0.03). */
const HOLD_LEAD = 0.035;

/** The frame where a step's change is complete: just before the next step's cross-fade (where reading holds rest). */
const doneAt = (stage: StageDef, k: number) => {
  const b = stage.beats[k];
  if (k + 1 >= stage.beats.length) return 1;
  const end = stage.beats[k + 1].at;
  return end - Math.min(HOLD_LEAD, (end - b.at) * 0.25) - 1e-4;
};

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

interface Tour {
  key: string;
  items: string[];
  idx: number;
  /** When the current item was lit (0 = not yet, e.g. after a pause). */
  start: number;
  said: boolean;
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

const subscribeNothing = () => () => {};

/** False on the server and during hydration, true once rendering on the client. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** Deep link: ?etapa=<stageId>&ikuspegia=<viewId>&egitura=<structureId>&une=<0..1>&jolastu=1&aurkitu=<structureId> */
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
  const [showLabels, setShowLabels] = useState(true);
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
  // Exam-style image: the find quiz in black and white, like the printed exam figures.
  const [print, setPrint] = useState(false);
  const [back, setBack] = useState<Back | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [helpOpen, setHelpOpen, firstVisit] = useHelpOnce();
  const [nowOpen, setNowOpen] = useState(false);
  const guidedPref = usePref('guided');
  const quick = usePref('quick');
  const guided = guidedPref && !quick;
  const mode: PlayMode = quick ? 'azkarra' : guided ? 'gidatua' : 'arrunta';
  const voice = usePref('voice');
  // Micro-questions already answered or skipped on this visit (stage:step).
  const [asked, setAsked] = useState<string[]>([]);
  const outlineOpen = usePref('outline');
  const infoOpen = usePref('panel');
  const notesOpen = usePref('notes');
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
  // Guided tour of the current step: the loop owns `tourRef`; `tour` mirrors it for rendering.
  const tourRef = useRef<Tour | null>(null);
  const bridgeHold = useRef(false);
  const toured = useRef('');
  const [tour, setTour] = useState<{ items: string[]; idx: number } | null>(null);
  // Scenes use floating-point geometry; render them only on the client to avoid hydration mismatches.
  const mounted = useHydrated();
  const visited = useVisited(week.week);

  const [manualView, setManualView] = useState<Record<string, boolean>>({});
  // "Irudian aurkitu": a structure to ask for in the find quiz once the scene is drawn.
  const [pendingFind, setPendingFind] = useState<string | null>(null);
  const [questionsConcept, setQuestionsConcept] = useState<string | undefined>(undefined);

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
    if (link.structure) setSelected(link.structure);
    if (link.find) setPendingFind(link.find);
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
  const [pickedView, setPickedView] = useState('');
  /** The view-change card (see ViewBridge), set when the simulation itself moves to another view. */
  const [bridge, setBridge] = useState<{ from: ViewSnap; to: ViewSnap } | null>(null);
  const chooseView = (id: string) => {
    if (formation) { setFormation(null); setPlaying(false); }
    setPickedView(`${week.week}/${stage.id}/${id}`);
    setManualView((m) => ({ ...m, [stage.id]: true }));
    setViewByStage((m) => ({ ...m, [stage.id]: id }));
  };
  // Guided mode asks the step's micro-question once its animation is done, before moving on.
  const askNow = !formation && guided && playing && waiting && intro === null && !tour && !!beat?.ask && !asked.includes(askKey);

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
  useEffect(() => {
    if (!ghost) return;
    const id = window.setTimeout(() => setGhost(null), 1000);
    return () => window.clearTimeout(id);
  }, [ghost]);
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
    for (const k of ['egitura', 'une', 'jolastu', 'eraketa']) url.searchParams.delete(k);
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

  // Pausing silences the narration and restarts the current step's reading clock on resume.
  useEffect(() => {
    if (playing) return;
    hush();
    speaking.current = false;
    clock.current.key = '';
    if (tourRef.current) {
      tourRef.current.start = 0;
      tourRef.current.said = false;
    }
    introClock.current = 0;
  }, [playing]);

  // Playback loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(step);

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
          if (guided && voice && introRef.current === 0) {
            speaking.current = true;
            speak(`${st.title}. ${st.intro ?? st.subtitle ?? ''}`, () => {
              speaking.current = false;
            });
          }
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

      // 2) Detailed playback, step by step (on hold while the view bridge is being read).
      if (bridgeHold.current) return;
      const p = live.current;
      const st = week.stages[p.i];
      let t = p.t + (dt * speed * NORMAL_RATE * (guided ? GUIDED_RATE : quick ? QUICK_RATE : 1)) / st.duration;
      const k = beatIndexAt(st, p.t);

      // 2a) Tour: light the step's structures one at a time while the animation holds.
      const tkey = `${p.i}:${k}`;
      let tr = tourRef.current;
      if (tr && tr.key !== tkey) {
        tr = null;
        tourRef.current = null;
        setTour(null);
      }
      const tourAt = tourAtOf(st, k);
      if (!tr && !quick && toured.current !== tkey && t >= tourAt) {
        toured.current = tkey;
        const b = st.beats[k];
        const items = (b.tour ?? (guided ? freshAt(st, k, week.week).map((s) => s.id) : [])).filter((id) => drawnIn(svgRef.current, id));
        if (items.length >= (b.tour ? 1 : 2)) {
          tr = { key: tkey, items, idx: 0, start: 0, said: false };
          tourRef.current = tr;
          setTour({ items, idx: 0 });
        }
      }
      if (tr) {
        t = Math.max(p.t, Math.min(t, tourAt));
        // With narration, let the step's caption finish before naming the first structure.
        if (!(speaking.current && !tr.said)) {
          if (!tr.start) tr.start = now;
          const id = tr.items[tr.idx];
          if (guided && voice && !tr.said) {
            tr.said = true;
            const s = structures.get(id);
            if (s) {
              speaking.current = true;
              speak(`${s.name}. ${s.definition}`, () => {
                speaking.current = false;
              });
            }
          }
          if (now - tr.start >= tourMs(id, guided) / speed && !speaking.current) {
            if (tr.idx + 1 < tr.items.length) {
              tr.idx += 1;
              tr.start = now;
              tr.said = false;
              setTour({ items: tr.items, idx: tr.idx });
            } else {
              tourRef.current = null;
              setTour(null);
            }
          }
        }
        setWaiting(false);
        if (waitSecondsRef.current !== null) {
          waitSecondsRef.current = null;
          setWaitSeconds(null);
        }
        const held = { i: p.i, t };
        live.current = held;
        setPos(held);
        return;
      }

      const key = `${st.id}:${k}`;
      if (clock.current.key !== key) {
        clock.current = { key, start: now };
        skipHold.current = false;
        if (guided && voice) {
          speaking.current = true;
          const b = st.beats[k];
          speak(b.idea ? `${b.idea} ${b.text}` : b.text, () => {
            speaking.current = false;
          });
        }
      }
      const end = k + 1 < st.beats.length ? st.beats[k + 1].at : 1;
      // Rest just before the next step's cross-fade begins, so the frame being read shows this step complete.
      const boundary = k + 1 < st.beats.length ? end - Math.min(HOLD_LEAD, (end - st.beats[k].at) * 0.25) : 1;
      const elapsed = now - clock.current.start;
      const dwell = quick ? quickDwellMs(st, k) : captionDwellMs(st, k);
      const hold = t >= boundary - 1e-4 && (guided ? !skipHold.current : elapsed < dwell && !skipHold.current);
      const remainingSeconds = hold && !guided ? Math.max(1, Math.ceil((dwell - elapsed) / 1000)) : null;
      if (waitSecondsRef.current !== remainingSeconds) {
        waitSecondsRef.current = remainingSeconds;
        setWaitSeconds(remainingSeconds);
      }
      if (hold) t = Math.max(p.t, boundary - 1e-4);
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
  }, [playing, speed, autoContinue, week, guided, quick, voice, formation]);

  // Auto-stop at the end of the stage (or of the week, when auto-continuing).
  if (playing && intro === null && pos.t >= 1 && (!autoContinue || pos.i === week.stages.length - 1)) setPlaying(false);

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
  const clearTour = () => {
    tourRef.current = null;
    toured.current = '';
    setTour(null);
  };
  const startIntro = () => {
    if (quick || formation) return;
    introRef.current = 0;
    introClock.current = 0;
    clearTour();
    setIntro(0);
  };
  const endIntro = () => {
    if (introRef.current !== null && speaking.current) {
      hush();
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
  const skipTour = () => {
    tourRef.current = null;
    setTour(null);
    hush();
    speaking.current = false;
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
  /** An explanation is starting: go full screen if accepted before, else offer it (unless turned off). */
  const offerFull = () => {
    if (focusMode) return;
    if (fsAccepted()) enterFull();
    else if (getPref('fsAsk')) setFsOffer(true);
  };
  const togglePlay = () => {
    if (formation) {
      if (pos.t >= formation.end) place({ ...pos, t: formation.start });
      setFormation(formation);
      setPlaying(!playing);
      return;
    }
    stopGlide();
    if (playing) setFsOffer(false);
    else if (intro === null && (pos.t <= 0.001 || pos.t >= 1)) offerFull();
    // The preview has finished and is waiting to be read: start the step-by-step playback.
    if (playing && intro !== null && intro >= 1) {
      endIntro();
      return;
    }
    if (!playing && pos.t >= 1) {
      clearTour();
      place({ ...pos, t: 0 });
    }
    if (!playing && intro === null && !find && (pos.t <= 0.001 || pos.t >= 1)) startIntro();
    // Pressing play is the answer to the view-change card: it would otherwise sit behind the preview.
    if (!playing) setBridge(null);
    setPlaying(!playing);
  };
  /** Advance from a reading hold; in guided mode this also lets the learner stop narration. */
  const continueHold = () => {
    skipHold.current = true;
    hush();
    speaking.current = false;
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
    if (playing) {
      place({ i: pos.i, t: b.at + 0.001 });
      return;
    }
    // Paused: the step plays out up to its complete frame, continuing from here when "here" is on the
    // way (the previous step, or earlier in this one), else replaying it from its start.
    const tours = !!b.tour?.length;
    const to = tours ? tourAtOf(stage, kk) : doneAt(stage, kk);
    const onTheWay = pos.t < to && pos.t >= (stage.beats[kk - 1]?.at ?? 0);
    glideTo(kk, onTheWay ? pos.t : b.at + 0.001, to, () => {
      // A step with a tour then shows its first structure; the arrows walk through the rest.
      if (!tours || !b.tour) return;
      const key = `${pos.i}:${kk}`;
      toured.current = key;
      tourRef.current = { key, items: b.tour, idx: 0, start: 0, said: false };
      setTour({ items: b.tour, idx: 0 });
    });
  };
  /** Paused, the current step's change not yet seen: → first plays it out. */
  const stepUnseen = () => {
    if (playing || intro !== null || glideRef.current) return false;
    const to = stage.beats[activeBeat]?.tour?.length ? tourAtOf(stage, activeBeat) : doneAt(stage, activeBeat);
    return pos.t < to - 0.004;
  };
  const stepBeat = (delta: number) => {
    const tr = tourRef.current;
    if (tr && intro === null && tr.key === `${pos.i}:${activeBeat}`) {
      const j = tr.idx + delta;
      if (j >= tr.items.length) {
        skipTour();
        return;
      }
      if (j >= 0) {
        tr.idx = j;
        tr.start = 0;
        tr.said = false;
        hush();
        speaking.current = false;
        setTour({ items: tr.items, idx: j });
        return;
      }
    }
    const shownBeat = glideBeat ?? activeBeat;
    if (delta > 0 && glideBeat === null && stepUnseen()) {
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
    if (w === week.week) {
      const idx = week.stages.findIndex((s) => s.id === stageId);
      if (idx >= 0) {
        clearTour();
        place({ i: idx, t: 1 });
      }
      setQuestionsOpen(false);
      return;
    }
    const q = new URLSearchParams({ etapa: stageId });
    if (structureId) q.set('egitura', structureId);
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
    setBridge(null);
    hush();
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
      router.push(`/astea/${t.week}?${q}`);
      return;
    }
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
    setKimuHere({ week: week.week, stage: stage.id, beat: activeBeat, structure: selected ?? formation?.structure });
    return () => setKimuHere(null);
  }, [week.week, stage.id, activeBeat, selected, formation]);
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
  const narrow = () => focusMode || window.matchMedia('(max-width: 1320px)').matches;
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
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
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
    } else if (e.key.toLowerCase() === 'l') setShowLabels((v) => !v);
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
    focus: find || intro !== null ? [] : formation ? (formation.highlight ?? [formation.structure]) : (beat?.focus ?? []),
    dimContext: !formation && focusLit && !view.ownFocus && !find && intro === null,
    spotlight: !find && intro === null && tour ? tour.items[tour.idx] : null,
    showLabels: showLabels && intro === null,
    quiz: !!find,
    quizFlash: flash,
    nameOf,
    isSpace,
    onSelect,
    onHover: setHovered,
  };

  // Rings for step structures drawn too small to notice: the tour's current one, else the selection, else the step's.
  const spot = !find && intro === null && tour ? tour.items[tour.idx] : null;
  const marks = find || intro !== null ? [] : formation ? [formation.structure] : spot ? [spot] : selected && selectedLit ? [selected] : (beat?.focus ?? []);

  // Legend: categories present in this stage.
  const legend = legendOf(stage.structures);

  const day = lerpDay(stage.dayRange, pos.t);

  // View bridge: when the simulation (not the student) moves to another way of looking at the
  // specimen — next step, next stage, next week — it says so on the same 3-D sketch.
  const snap: ViewSnap = { key: sceneKey, week: week.week, stageTitle: stage.title, label: view.label, plane: view.plane, day, level: view.locator?.level, orientation: view.orientation };
  const [seenView, setSeenView] = useState<ViewSnap | null>(null);
  if (mounted && seenView?.key !== sceneKey) {
    const from = seenView ?? readLastView(week.week);
    setSeenView(snap);
    if (!formation && from && pickedView !== sceneKey && needsBridge(from, snap)) setBridge({ from, to: snap });
    else if (bridge) setBridge(null);
  }
  const saveView = useEffectEvent(() => {
    try {
      window.sessionStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ ...snap, at: Date.now() }));
    } catch {}
  });
  useEffect(() => {
    if (mounted) saveView();
  }, [sceneKey, mounted]);
  // Guided playback waits while the bridge is up.
  useEffect(() => {
    bridgeHold.current = !!bridge && guided;
  }, [bridge, guided]);

  const nextStage = week.stages[pos.i + 1];
  const prevWeek = weeks[weeks.indexOf(week) - 1];
  const prevStage = week.stages[pos.i - 1] ?? prevWeek?.stages[prevWeek.stages.length - 1];
  const sceneT = intro !== null ? easeInOut(Math.min(1, intro)) : pos.t;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div ref={appRef} className={`app${focusMode ? ' is-focus' : ''}`}>
      <header className="topbar">
        <Link href="/" className="tb-brand" title="Hasiera">
          <Wordmark size={20} />
        </Link>
        <span className="tb-weeks-l" aria-hidden>
          Gaia
        </span>
        <nav className="tb-weeks" aria-label="Gaiak">
          {weeks.map((w) => (
            <Link
              key={w.week}
              href={`/astea/${w.week}`}
              className={`tb-week${w.week === week.week ? ' is-on' : ''}${isWip(w) ? ' is-wip' : ''}`}
              title={`${w.week}. gaia — ${w.title} (${spanOf(w).long})${isWip(w) ? ' · prestatzen' : ''}`}
              aria-current={w.week === week.week ? 'page' : undefined}
            >
              <span className="tb-week-n">{pad(w.week)}</span>
              <span className="tb-week-d">{spanOf(w).short}</span>
            </Link>
          ))}
        </nav>
        <div className="tb-tools">
          <button className={`tool tool-main kimu-tool${kimuOpen ? ' is-on' : ''}`} onClick={toggleKimu} aria-expanded={kimuOpen} data-tip="Galdetu Kimuri: lekura eramango zaitu · K" data-tip-pos="bottom">
            <KimuFace size={26} mood="happy" still /> <span>Galdetu Kimuri</span>
          </button>
          <button className={`tool tool-main${find ? ' is-on' : ''}`} onClick={() => (find ? setFind(null) : startFind())} data-tip="Irudian galdetzen zaizun egitura klikatu" data-tip-pos="bottom">
            <IconTarget size={16} /> <span>Aurkitu</span>
          </button>
          <button
            className="tool tool-main"
            onClick={() => {
              setQuestionsConcept(undefined);
              setQuestionsOpen(true);
            }}
            data-tip="Azterketa-motako galderak, azalpenarekin"
            data-tip-pos="bottom"
          >
            <IconQuiz size={16} /> <span>Galderak</span>
          </button>
          <Popover
            trigger={({ open, toggle }) => (
              <button className={`tool${open ? ' is-on' : ''}`} onClick={toggle} aria-expanded={open} aria-haspopup="menu" data-tip="Glosarioa, kronologia, leinuak, irudiak…" data-tip-pos="bottom">
                <IconMore size={16} /> <span>Tresnak</span>
              </button>
            )}
          >
            {(close) => (
              <div className="menu" role="menu">
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
                  <span className="menu-q" aria-hidden>
                    ?
                  </span>{' '}
                  Laguntza <kbd>?</kbd>
                </button>
              </div>
            )}
          </Popover>
          <button className={`tool${(panelOpen || infoOpen) && !notesOpen ? ' is-on' : ''}`} onClick={togglePanel} data-tip="Laburpena, datak eta egiturak erakutsi / ezkutatu · ]" data-tip-pos="bottom" aria-expanded={(panelOpen || infoOpen) && !notesOpen}>
            <IconRail open={(infoOpen || panelOpen) && !notesOpen} side="right" /> <span>Laburpena</span>
          </button>
          <button className={`tool${notesOpen ? ' is-on' : ''}`} onClick={toggleNotes} aria-pressed={notesOpen} data-tip="Jatorrizko apunteak, simulazioarekin batera · N" data-tip-pos="bottom-end">
            <IconNotes size={16} /> <span>Apunteak</span>
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
          onStage={(i) => {
            if (playing) startIntro();
            else endIntro();
            clearTour();
            place({ i, t: 0 });
            setSelected(null);
          }}
        />

        <main className={`stage${formation ? ' has-formation' : ''}${find && print ? ' is-print' : ''}`}>
          <div className="stage-bar">
            <div className="stage-heading">
              {/* Where this stage sits in the notes: topic › heading, numbered as the notes number it. */}
              <p className="kicker crumbs" title={[notesAt?.parent && sectionLabel(notesAt.parent), notesAt?.section.covers].filter(Boolean).join(' · ') || undefined}>
                <span>{week.week}. gaia</span>
                {notesAt && <span className="crumb-sec">{sectionLabel(notesAt.section)}</span>}
              </p>
              <div className="stage-title">
                <h2 title={stage.title}>{stage.title}</h2>
                <button className="day-chip" onClick={() => setNowOpen((v) => !v)} aria-expanded={nowOpen} title={`${weekOfDay(day)}. astea · ${periodOf(day).name} — zer dago orain, zer den berria, zer desagertu den`}>
                  <IconCalendar size={13} />
                  {stage.day}
                  <i aria-hidden>▾</i>
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
              <Locator plane={view.plane} week={week.week} day={day} level={view.locator?.level} orientation={view.orientation} note={view.locator?.note} viewKey={`${stage.id}/${view.id}`} hold={helpOpen || questionsOpen || glossaryOpen || !!bridge} />
              {stage.views.length > 1 && (
                <div className="seg" role="tablist" aria-label="Ikuspegiak">
                  {stage.views.map((v, k) => (
                    <button key={v.id} role="tab" aria-selected={v.id === view.id} className={v.id === view.id ? 'is-on' : ''} onClick={() => chooseView(v.id)} title={`${v.description} (${k + 1})`}>
                      <PlaneGlyph plane={v.plane} size={18} />
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SceneContext.Provider value={ctx}>
            <Viewport
              ref={svgRef}
              orientation={view.orientation}
              resetKey={`${stage.id}/${view.id}`}
              onBackgroundClick={() => !find && setSelected(null)}
              marks={marks}
              nameOf={nameOf}
              fullscreenRef={appRef}
              onFullscreenChange={setFocusMode}
              makeRoom={intro !== null}
              overlay={
                <>
                  <div className="view-tools">
                    <button className={`icon-btn${showLabels ? ' is-on' : ''}`} onClick={() => setShowLabels((v) => !v)} data-tip={showLabels ? 'Etiketak ezkutatu · L' : 'Etiketak erakutsi · L'} data-tip-pos="left" aria-label="Etiketak" aria-pressed={showLabels}>
                      <IconTag size={16} />
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
                  {back && (
                    <button className="back-chip" onClick={goBack} title={`Itzuli: ${back.title}`}>
                      <span aria-hidden>←</span> Bueltatu <b>{back.title}</b>
                    </button>
                  )}
                  {focusMode && (
                    <p className="focus-title">
                      <span>
                        {week.week}. gaia{notesAt ? ` › ${sectionLabel(notesAt.section)}` : ''}
                      </span>
                      <b>{stage.title}</b>
                    </p>
                  )}
                  {focusMode && (
                    <div className="focus-exit">
                      <button className={`btn small ghost${panelOpen ? ' is-on' : ''}`} onClick={togglePanel} data-tip="Laburpena eta datak erakutsi · ]" data-tip-pos="bottom">
                        Laburpena <kbd>]</kbd>
                      </button>
                      <button className="btn small ghost" onClick={() => setFocusMode(false)} data-tip="Aurkibidea eta tresnak berriro erakutsi" data-tip-pos="bottom">
                        Irten <kbd>F</kbd>
                      </button>
                    </div>
                  )}
                  {bridge && intro === null && <ViewBridge key={bridge.to.key} from={bridge.from} to={bridge.to} onClose={() => setBridge(null)} />}
                  {tour && intro === null && structures.get(tour.items[tour.idx]) && (
                    <TourCard item={structures.get(tour.items[tour.idx])!} idx={tour.idx} n={tour.items.length} onSkip={skipTour} onPick={onSelect} />
                  )}
                  {intro === null && (
                    <p key={`${stage.id}/${view.id}`} className="view-desc">
                      <PlaneGlyph plane={view.plane} size={14} /> {view.description}
                    </p>
                  )}
                  {intro !== null && (
                    <div className="pv-card" key={`intro-${stage.id}`}>
                      <div className="pv-top">
                        <span className="pv-kicker">Aurrebista · {stage.day}</span>
                        {intro < 1 && (
                          <button className="btn small ghost" onClick={endIntro}>
                            Saltatu <span aria-hidden>→</span>
                          </button>
                        )}
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
                  {!playing && pos.t === 0 && !find && intro === null && (
                    <button className="start" onClick={togglePlay}>
                      <span className="start-icon">
                        <IconPlay size={14} />
                      </span>
                      Erreproduzitu etapa
                      <kbd>Zuriunea</kbd>
                    </button>
                  )}
                  {fsOffer && playing && !focusMode && (
                    <div className="fs-offer" role="group" aria-label="Pantaila osoa">
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
                      <button className={`btn small ghost${print ? ' is-on' : ''}`} onClick={() => setPrint((v) => !v)} aria-pressed={print} title="Azterketako irudiak bezala: zuri-beltzean">
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
              <g key={`${stage.id}/${view.id}`} className="scene-enter">
                {mounted && <Scene t={sceneT} reduced={reduced} />}
              </g>
              {ghost && GhostScene && (
                <g key={`ghost-${ghost.key}`} className="scene-ghost" pointerEvents="none" aria-hidden>
                  <GhostScene t={ghost.t} reduced={reduced} />
                </g>
              )}
            </Viewport>
          </SceneContext.Provider>

          {formation && (
            <section className="formation-card" aria-label="Kimuren eraketa" data-formation={formation.structure} data-complete={pos.t >= formation.end}>
              <div>
                <p className="kicker">Kimu · {pos.t >= formation.end ? 'Amaituta — zure erritmoan jarraitu' : playing ? 'Eraketa ikusten' : 'Pausatuta'}</p>
                <strong>{nameOf(formation.structure)}</strong>
                <p>{stage.beats[formation.beat].idea ?? stage.beats[formation.beat].text}</p>
              </div>
              <div className="formation-actions">
                <button className="btn small" onClick={() => {
                  place({ i: pos.i, t: formation.start });
                  setFormation(formation); setSelected(null); setPlaying(true);
                }}>Errepikatu</button>
                <button className="btn small" onClick={() => {
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
            stage={withRecall(week.week, stage)}
            stageIndex={pos.i}
            stageCount={week.stages.length}
            nextTitle={nextStage?.title}
            t={pos.t}
            activeBeat={glideBeat ?? activeBeat}
            playing={playing}
            speed={speed}
            autoContinue={autoContinue}
            day={ageLabel(day)}
            onSeek={(t) => seek(pos.i, t)}
            onTogglePlay={togglePlay}
            onStage={gotoStage}
            onBeat={stepBeat}
            onSpeed={setSpeed}
            onAutoContinue={setAutoContinue}
            guided={guided}
            mode={mode}
            onMode={setPlayMode}
            voice={voice}
            waiting={!formation && waiting && playing && intro === null}
            waitSeconds={!formation && waiting && playing && intro === null ? waitSeconds : null}
            fresh={!formation && guided && intro === null && !tour ? fresh : []}
            onVoice={(v) => setPref('voice', v)}
            onContinue={continueHold}
            onNextStage={continueNext}
            onPick={onSelect}
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
                <AskCard
                  key={askKey}
                  id={`mikro:${week.week}/${askKey}`}
                  ask={beat.ask}
                  onDone={() => {
                    setAsked((a) => [...a, askKey]);
                    continueHold();
                  }}
                />
              ) : undefined
            }
          />
        </main>

        <aside className="info" aria-label="Azalpena">
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
      {helpOpen && <Help welcome={firstVisit} onClose={() => setHelpOpen(false)} />}
      {questionsOpen && <Questions week={week.week} concept={questionsConcept} onClose={() => setQuestionsOpen(false)} onGoto={(w, sid) => gotoWeekStage(w, sid)} onFind={findConcept} />}
    </div>
  );
}

const lerpDay = (r: [number, number], t: number) => r[0] + (r[1] - r[0]) * t;
