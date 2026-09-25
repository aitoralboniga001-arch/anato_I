'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { SceneContext, type QuizFlash, type SceneContextValue } from '@/components/kit/context';
import { getWeek, nameOf, structures, weeks } from '@/content/registry';
import { ageLabel, ageParts, spanOf } from '@/lib/sim/age';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { StructureCategory, WeekDef } from '@/lib/sim/types';
import { Glossary } from './Glossary';
import { IconBook, IconInfo, IconLayers, IconPlay, IconQuiz, IconTag, IconTarget, IconTree, PlaneGlyph } from './icons';
import { Wordmark, isWip } from './LandNav';
import { Player } from './Player';
import { Questions } from './Questions';
import { Inspector, Outline, StageInfo } from './SidePanel';
import { Viewport } from './Viewport';
import { markVisited, useVisited } from './progress';

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

const subscribeNothing = () => () => {};

/** False on the server and during hydration, true once rendering on the client. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** Deep link: ?etapa=<stageId>&ikuspegia=<viewId>&egitura=<structureId> */
function readDeepLink(week: WeekDef) {
  const params = new URLSearchParams(window.location.search);
  const sid = params.get('etapa');
  const vid = params.get('ikuspegia');
  const eg = params.get('egitura');
  const idx = sid ? week.stages.findIndex((s) => s.id === sid) : -1;
  return {
    stageIndex: idx >= 0 ? idx : null,
    viewId: idx >= 0 ? vid : null,
    structure: eg && structures.has(eg) ? eg : null,
  };
}

export function Simulator({ weekNumber }: { weekNumber: number }) {
  const week = getWeek(weekNumber) ?? weeks[0];
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);

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
  // Scenes use floating-point geometry; render them only on the client to avoid hydration mismatches.
  const mounted = useHydrated();
  const visited = useVisited(week.week);

  // Deep links are applied once per week, on the first client render (the server can't see the query).
  // The URL-sync effect below waits for this, so it can't rewrite the query before it has been read.
  const [linkedWeek, setLinkedWeek] = useState<number | null>(null);
  if (mounted && linkedWeek !== week.week) {
    setLinkedWeek(week.week);
    const link = readDeepLink(week);
    if (link.stageIndex !== null) {
      setPos({ i: link.stageIndex, t: 0 });
      const sid = week.stages[link.stageIndex].id;
      const vid = link.viewId;
      if (vid) setViewByStage((m) => ({ ...m, [sid]: vid }));
    }
    if (link.structure) setSelected(link.structure);
  }

  const stage = week.stages[pos.i];
  const view = stage.views.find((v) => v.id === viewByStage[stage.id]) ?? stage.views[0];
  const Scene = view.scene;
  const activeBeat = useMemo(() => {
    let k = 0;
    stage.beats.forEach((b, i) => {
      if (b.at <= pos.t + 1e-6) k = i;
    });
    return k;
  }, [stage, pos.t]);
  const beat = stage.beats[activeBeat];

  useEffect(() => {
    if (linkedWeek !== week.week) return;
    const url = new URL(window.location.href);
    url.searchParams.set('etapa', stage.id);
    url.searchParams.set('ikuspegia', view.id);
    url.searchParams.delete('egitura');
    window.history.replaceState(null, '', url);
    markVisited(week.week, stage.id);
  }, [linkedWeek, week.week, stage.id, view.id]);

  // Playback loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setPos((p) => {
        const st = week.stages[p.i];
        const t = p.t + (dt * speed) / st.duration;
        if (t < 1) return { i: p.i, t };
        if (autoContinue && p.i < week.stages.length - 1) return { i: p.i + 1, t: 0 };
        return { i: p.i, t: 1 };
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, autoContinue, week]);

  // Auto-stop at the end of the stage (or of the week, when auto-continuing).
  if (playing && pos.t >= 1 && (!autoContinue || pos.i === week.stages.length - 1)) setPlaying(false);

  // Plain functions: nothing downstream depends on their identity (no memo'd children), and the
  // React Compiler lint can't preserve manual useCallback here, so memoization is left to it.
  const seek = (i: number, t: number) => setPos({ i, t });
  const togglePlay = () => {
    if (!playing && pos.t >= 1) setPos((p) => ({ ...p, t: 0 }));
    setPlaying(!playing);
  };
  const gotoStage = (delta: number) => {
    setPos((p) => ({ i: Math.min(week.stages.length - 1, Math.max(0, p.i + delta)), t: 0 }));
    setSelected(null);
  };
  const gotoBeat = (k: number) => {
    const b = stage.beats[Math.max(0, Math.min(stage.beats.length - 1, k))];
    setPos((p) => ({ i: p.i, t: b.at + 0.001 }));
  };
  const stepBeat = (delta: number) => {
    const k = activeBeat + delta;
    if (k < 0) {
      if (pos.i > 0) setPos({ i: pos.i - 1, t: 0.999 });
      return;
    }
    if (k >= stage.beats.length) {
      if (pos.t < 0.999) setPos({ i: pos.i, t: 1 });
      else if (pos.i < week.stages.length - 1) setPos({ i: pos.i + 1, t: 0 });
      return;
    }
    gotoBeat(k);
  };

  const gotoWeekStage = (w: number, stageId: string, structureId?: string) => {
    if (w === week.week) {
      const idx = week.stages.findIndex((s) => s.id === stageId);
      if (idx >= 0) setPos({ i: idx, t: 1 });
      setQuestionsOpen(false);
      return;
    }
    const q = new URLSearchParams({ etapa: stageId });
    if (structureId) q.set('egitura', structureId);
    router.push(`/astea/${w}?${q.toString()}`);
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

  const startFind = () => {
    setPlaying(false);
    setSelected(null);
    setFind({ target: nextTarget(null), ok: 0, tries: 0, message: null });
  };

  const answerFind = (id: string) => {
    if (!find?.target) return;
    const ok = id === find.target;
    setFlash({ id, ok });
    setFind((f) =>
      f && {
        ...f,
        ok: f.ok + (ok ? 1 : 0),
        tries: f.tries + 1,
        message: ok ? `Bai! Hori da ${nameOf(id)}.` : `Ez: hori ${nameOf(id)} da.`,
      },
    );
    window.setTimeout(() => {
      setFlash(null);
      if (ok) setFind((f) => f && { ...f, target: nextTarget(f.target), message: null });
    }, ok ? 900 : 1100);
  };

  const revealFind = () => {
    if (!find?.target) return;
    const id = find.target;
    setFlash({ id, ok: true });
    setFind((f) => f && { ...f, tries: f.tries + 1, message: `Hemen dago: ${nameOf(id)}.` });
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
    pick(id);
    setPanelOpen(true);
  };

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
    else if (e.key === 'Escape') {
      setSelected(null);
      setFind(null);
      setGlossaryOpen(false);
      setQuestionsOpen(false);
      setPanelOpen(false);
    } else if (/^[1-9]$/.test(e.key)) {
      const v = stage.views[Number(e.key) - 1];
      if (v) setViewByStage((m) => ({ ...m, [stage.id]: v.id }));
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
    focus: find ? [] : beat?.focus ?? [],
    showLabels,
    quiz: !!find,
    quizFlash: flash,
    nameOf,
    onSelect,
    onHover: setHovered,
  };

  // Legend: categories present in this stage.
  const legend = useMemo(() => {
    const seen = new Map<StructureCategory, string>();
    for (const id of stage.structures) {
      const s = structures.get(id);
      if (s && !seen.has(s.category)) seen.set(s.category, categoryColor[s.category]);
    }
    return [...seen.entries()];
  }, [stage]);

  const day = lerpDay(stage.dayRange, pos.t);
  const nextStage = week.stages[pos.i + 1];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="tb-brand" title="Hasiera">
          <Wordmark size={20} />
        </Link>
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
              <span className="tb-week-d">
                {spanOf(w).short}
              </span>
            </Link>
          ))}
        </nav>
        <DayRuler day={day} index={weeks.indexOf(week)} />
        <div className="tb-tools">
          <button className={`tool${find ? ' is-on' : ''}`} onClick={() => (find ? setFind(null) : startFind())} title="Aurkitu egitura irudian">
            <IconTarget size={16} /> <span>Aurkitu</span>
          </button>
          <button className="tool" onClick={() => setQuestionsOpen(true)} title="Azterketa-galderak">
            <IconQuiz size={16} /> <span>Galderak</span>
          </button>
          <button className="tool" onClick={() => setGlossaryOpen(true)} title="Glosarioa">
            <IconBook size={16} /> <span>Glosarioa</span>
          </button>
          <Link className="tool" href="/leinuak" title="Ernetze orrien leinuak">
            <IconTree size={16} /> <span>Leinuak</span>
          </Link>
          <button className={`tool tool-panel${panelOpen ? ' is-on' : ''}`} onClick={() => setPanelOpen((v) => !v)} title="Azalpen-panela" aria-expanded={panelOpen}>
            <IconInfo size={16} /> <span>Azalpena</span>
          </button>
        </div>
      </header>

      <div className={`workspace${panelOpen ? ' panel-open' : ''}`}>
        <Outline
          week={week}
          current={pos.i}
          t={pos.t}
          activeBeat={activeBeat}
          visited={visited}
          onStage={(i) => {
            setPos({ i, t: 0 });
            setSelected(null);
          }}
          onBeat={gotoBeat}
        />

        <main className="stage">
          <div className="stage-bar">
            <div className="stage-heading">
              <p className="kicker">
                {pad(pos.i + 1)} / {pad(week.stages.length)} · {stage.day}
              </p>
              <h2>{stage.title}</h2>
            </div>
            {stage.views.length > 1 && (
              <div className="seg" role="tablist" aria-label="Ikuspegiak">
                {stage.views.map((v, k) => (
                  <button
                    key={v.id}
                    role="tab"
                    aria-selected={v.id === view.id}
                    className={v.id === view.id ? 'is-on' : ''}
                    onClick={() => setViewByStage((m) => ({ ...m, [stage.id]: v.id }))}
                    title={`${v.description} (${k + 1})`}
                  >
                    <PlaneGlyph plane={v.plane} size={18} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <SceneContext.Provider value={ctx}>
            <Viewport
              ref={svgRef}
              orientation={view.orientation}
              resetKey={`${stage.id}/${view.id}`}
              onBackgroundClick={() => !find && setSelected(null)}
              overlay={
                <>
                  <div className="view-tools">
                    <button className={`icon-btn${showLabels ? ' is-on' : ''}`} onClick={() => setShowLabels((v) => !v)} title="Etiketak (L)" aria-label="Etiketak" aria-pressed={showLabels}>
                      <IconTag size={16} />
                    </button>
                    <button className={`icon-btn${legendOpen ? ' is-on' : ''}`} onClick={() => setLegendOpen((v) => !v)} title="Kolore-kodea" aria-label="Kolore-kodea" aria-pressed={legendOpen}>
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
                    </div>
                  )}
                  <p key={`${stage.id}/${view.id}`} className="view-desc">
                    <PlaneGlyph plane={view.plane} size={14} /> {view.description}
                  </p>
                  {!playing && pos.t === 0 && !find && (
                    <button className="start" onClick={togglePlay}>
                      <span className="start-icon">
                        <IconPlay size={14} />
                      </span>
                      Erreproduzitu etapa
                      <kbd>Zuriunea</kbd>
                    </button>
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
                {mounted && <Scene t={pos.t} reduced={reduced} />}
              </g>
            </Viewport>
          </SceneContext.Provider>

          <Player
            stage={stage}
            stageIndex={pos.i}
            stageCount={week.stages.length}
            nextTitle={nextStage?.title}
            t={pos.t}
            activeBeat={activeBeat}
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
          />
        </main>

        <aside className="info" aria-label="Azalpena">
          {selected ? (
            <Inspector
              id={selected}
              week={week}
              currentStageId={stage.id}
              onClose={() => setSelected(null)}
              onSelect={pick}
              onGoto={(w, sid) => gotoWeekStage(w, sid, selected)}
            />
          ) : (
            <StageInfo key={stage.id} stage={stage} onSelect={onSelect} onDismiss={() => setPanelOpen(false)} onHover={(id) => setHovered(id && inScene(id) ? id : null)} />
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
      {questionsOpen && <Questions week={week.week} onClose={() => setQuestionsOpen(false)} onGoto={(w, sid) => gotoWeekStage(w, sid)} />}
    </div>
  );
}

const lerpDay = (r: [number, number], t: number) => r[0] + (r[1] - r[0]) * t;

/** One equal segment per topic (they span very different numbers of days); the head sits inside the current one. */
function DayRuler({ day, index }: { day: number; index: number }) {
  const n = weeks.length;
  const [a, b] = weeks[index].dayRange;
  const head = (index + Math.min(1, Math.max(0, (day - a) / Math.max(1, b - a)))) / n;
  return (
    <div className="day-ruler" title={`Garapenaren ${ageLabel(day)}`}>
      <div className="day-ruler-track">
        {weeks.map((w, i) => (
          <span key={w.week} className={`day-ruler-week${i < index ? ' is-past' : ''}`} style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }} />
        ))}
        <span className="day-ruler-head" style={{ left: `${head * 100}%` }} />
      </div>
      <span className="day-ruler-label">
        <b>{ageParts(day)[0]}</b>
        {ageParts(day)[1]}
      </span>
    </div>
  );
}
