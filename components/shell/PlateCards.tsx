'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { SceneView } from '@/components/kit';
import { firstSentence } from '@/content/generate';
import { KEY_PLATES, PLATES, PLATE_GROUPS, platesOf, type Plate } from '@/content/plates';
import { imageId } from '@/content/pool';
import { isSpace, nameOf, partsOf, structures, weeks } from '@/content/registry';
import { recordAnswer } from './answers';
import { LandFoot, LandNav } from './LandNav';

/**
 * Image cards: the atlas's own figures as numbered plates, the way a printed figure is read. Study mode
 * shows the legend beside the figure (names can be covered and uncovered one by one); question mode
 * asks "what is 4?" and "where is X?" until every number has been answered right once.
 */

type Group = 'funtsezkoak' | number;
type Mode = 'ikasi' | 'galdetu';

interface Found {
  key: string;
  /** In number order. */
  items: { id: string; name: string }[];
}

interface Quiz {
  key: string;
  queue: string[];
  /** Asked again after a miss (once). */
  retried: string[];
  kind: 'zer' | 'non';
  options: string[];
  picked: string | null;
  ok: number;
  n: number;
  missed: string[];
}

const BEST_KEY = 'enbrioatlas:fitxak';
const readBest = (): Record<string, number> => {
  try {
    return JSON.parse(window.localStorage.getItem(BEST_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
};
const saveBest = (id: string, pct: number) => {
  try {
    const all = readBest();
    if ((all[id] ?? -1) < pct) window.localStorage.setItem(BEST_KEY, JSON.stringify({ ...all, [id]: pct }));
  } catch {
    // Without storage the score is only lost; the cards still work.
  }
};

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const viewOf = (p: Plate) => weeks.find((w) => w.week === p.week)?.stages.find((s) => s.id === p.stage)?.views.find((v) => v.id === p.view);
const groupOf = (g: Group): Plate[] => (g === 'funtsezkoak' ? KEY_PLATES : platesOf(g));
const subscribeNothing = () => () => {};

export function PlateCards() {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [group, setGroup] = useState<Group>('funtsezkoak');
  const [plateId, setPlateId] = useState(KEY_PLATES[0].id);
  const [mode, setMode] = useState<Mode>('ikasi');
  const [found, setFound] = useState<Found | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cover, setCover] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [names, setNames] = useState(false);
  const [gray, setGray] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const svg = useRef<SVGSVGElement>(null);

  const plate = PLATES.find((p) => p.id === plateId) ?? KEY_PLATES[0];
  const list = groupOf(group);
  const at = list.findIndex((p) => p.id === plate.id);
  const view = viewOf(plate);
  const stage = weeks.find((w) => w.week === plate.week)?.stages.find((s) => s.id === plate.stage);
  const ready = found?.key === plate.id;
  const numbers = useMemo(() => new Map((ready ? (found?.items ?? []) : []).map((it, i) => [it.id, i + 1])), [found, ready]);
  const nameIn = (id: string) => found?.items.find((it) => it.id === id)?.name ?? nameOf(id);

  // The open plate's chip stays in sight in the strip.
  const strip = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = strip.current;
    const on = ol?.querySelector<HTMLElement>('.is-on');
    if (ol && on) ol.scrollTo({ left: on.offsetLeft - ol.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' });
  }, [plate.id, group]);

  // The plate in the URL (a way back from the simulator), and the scores kept in this browser.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setBest(readBest());
      const want = new URLSearchParams(window.location.search).get('fitxa');
      const p = PLATES.find((x) => x.id === want);
      if (p) {
        setPlateId(p.id);
        setGroup(p.key ? 'funtsezkoak' : p.week);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const open = (p: Plate, g: Group = group) => {
    setGroup(g);
    setPlateId(p.id);
    // Kept in the URL: a reload and the simulator's way back return to this plate.
    const url = new URL(window.location.href);
    url.searchParams.set('fitxa', p.id);
    window.history.replaceState(null, '', url);
    setFound(null);
    setQuiz(null);
    setRevealed(new Set());
    setHovered(null);
    setNames(false);
  };

  // Numbering: read the names the figure draws and where they sit, then number them in reading order
  // (the left column top to bottom, then the right one), so the numbers run down the figure.
  // A 3D view's shapes (and so its names) can arrive a moment later: the names are read once they have
  // stopped changing, so no number is given out before every name is drawn.
  const measure = useEffectEvent((last: number, final: boolean): number => {
    const root = svg.current;
    if (!root || ready) return -1;
    const seen = new Map<string, { name: string; x: number; y: number }>();
    for (const g of root.querySelectorAll<SVGGElement>('[data-label][data-name]')) {
      const id = g.dataset.label!;
      if (seen.has(id) || (plate.only && !plate.only.includes(id))) continue;
      seen.set(id, { name: g.dataset.name!, x: Number(g.dataset.x ?? 500), y: Number(g.dataset.y ?? 320) });
    }
    if (!final && (!seen.size || seen.size !== last)) return seen.size;
    const side = (x: number) => (x < 500 ? 0 : 1);
    const items = [...seen.entries()]
      .sort(([, a], [, b]) => side(a.x) - side(b.x) || a.y - b.y || a.x - b.x)
      .map(([id, v]) => ({ id, name: v.name }));
    setFound({ key: plate.id, items });
    return seen.size;
  });

  useEffect(() => {
    if (!hydrated || ready) return;
    let timer = 0;
    let last = -1;
    let tries = 0;
    const poll = () => {
      tries++;
      last = measure(last, tries > 60);
      if (tries <= 60) timer = window.setTimeout(poll, 150);
    };
    timer = window.setTimeout(poll, 60);
    return () => window.clearTimeout(timer);
  }, [hydrated, ready, plate.id]);

  // ——— Question mode ———
  const askedId = quiz && quiz.key === plate.id ? quiz.queue[0] : undefined;
  const optionsFor = (id: string): string[] => {
    const own = found?.items.map((it) => it.id).filter((x) => x !== id) ?? [];
    const more = (stage?.structures ?? []).filter((x) => x !== id && !own.includes(x) && structures.get(x)?.category !== 'prozesua');
    return shuffle([id, ...[...shuffle(own), ...shuffle(more)].slice(0, 3)]);
  };
  const ask = (queue: string[], base: Omit<Quiz, 'queue' | 'kind' | 'options' | 'picked'>): Quiz => ({
    ...base,
    queue,
    kind: Math.random() < 0.3 ? 'non' : 'zer',
    options: queue.length ? optionsFor(queue[0]) : [],
    picked: null,
  });
  const startQuiz = () => {
    if (!ready) return;
    setMode('galdetu');
    setHovered(null);
    setQuiz(ask(shuffle(found!.items.map((it) => it.id)), { key: plate.id, retried: [], ok: 0, n: 0, missed: [] }));
  };
  const answer = (value: string) => {
    if (!quiz || !askedId || quiz.picked) return;
    const ok = value === askedId;
    recordAnswer(imageId(askedId), ok, nameIn(value));
    setQuiz({ ...quiz, picked: value, ok: quiz.ok + (ok ? 1 : 0), n: quiz.n + 1, missed: ok || quiz.missed.includes(askedId) ? quiz.missed : [...quiz.missed, askedId] });
  };
  const nextQuestion = () => {
    if (!quiz || !askedId) return;
    const missed = quiz.picked !== askedId && !quiz.retried.includes(askedId);
    // A miss comes back once, after the others.
    const queue = [...quiz.queue.slice(1), ...(missed ? [askedId] : [])];
    const next = ask(queue, { key: quiz.key, retried: missed ? [...quiz.retried, askedId] : quiz.retried, ok: quiz.ok, n: quiz.n, missed: quiz.missed });
    if (!queue.length) {
      const total = found?.items.length ?? 1;
      const pct = Math.round((100 * (total - quiz.missed.length)) / total);
      saveBest(plate.id, pct);
      setBest(readBest());
    }
    setQuiz(next);
  };
  const done = !!quiz && quiz.key === plate.id && !quiz.queue.length;

  // Keyboard: 1–4 answer, Enter next; ← → change plate.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (mode === 'galdetu' && quiz && askedId) {
      if (quiz.picked && (e.key === 'Enter' || e.key === 'ArrowRight')) nextQuestion();
      else if (!quiz.picked && quiz.kind === 'zer' && /^[1-4]$/.test(e.key)) {
        const o = quiz.options[Number(e.key) - 1];
        if (o) answer(o);
      }
      return;
    }
    if (e.key === 'ArrowRight' && at < list.length - 1) open(list[at + 1]);
    else if (e.key === 'ArrowLeft' && at > 0) open(list[at - 1]);
  });
  useEffect(() => {
    const l = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', l);
    return () => window.removeEventListener('keydown', l);
  }, []);

  const quizOn = mode === 'galdetu' && !!quiz && quiz.key === plate.id;
  const answered = quizOn && !!quiz.picked;
  const ctx: SceneContextValue = {
    selected: null,
    hovered: quizOn && !answered ? null : hovered,
    focus: [],
    showLabels: true,
    quiz: false,
    quizFlash: answered && askedId ? { id: askedId, ok: true } : null,
    numberOf: names && !quizOn ? null : (id) => numbers.get(id),
    asked: quizOn && quiz.kind === 'zer' ? askedId : answered ? askedId : null,
    nameOf,
    isSpace,
    partsOf,
    onSelect: (id) => {
      if (quizOn && quiz.kind === 'non' && !quiz.picked && numbers.has(id)) answer(id);
      else if (!quizOn && cover && numbers.has(id)) setRevealed((r) => new Set(r).add(id));
    },
    onHover: (id) => setHovered(id && numbers.has(id) ? id : null),
  };

  const Scene = view?.scene;
  const simHref = `/astea/${plate.week}?${new URLSearchParams({ etapa: plate.stage, ikuspegia: plate.view, une: String(Math.max(0.001, plate.t)) }).toString()}`;
  const toSim = () => {
    try {
      window.sessionStorage.setItem(
        'enbrioatlas:back',
        JSON.stringify({ week: 0, stage: '', t: 0, selected: null, title: 'fitxara', href: `/fitxak?fitxa=${encodeURIComponent(plate.id)}`, at: Date.now(), to: `${plate.week}/${plate.stage}` }),
      );
    } catch {
      // Without storage the link still opens the simulator; only the way back is lost.
    }
  };

  const groupLabel = (g: Group) => (g === 'funtsezkoak' ? 'Funtsezkoak' : `${g}. gaia`);
  const right = quizOn && askedId ? askedId : null;
  const ok = answered && quiz.picked === right;

  return (
    <div className="landing">
      <LandNav current="fitxak" />
      <section className="ln-hero lab-hero plate-hero">
        <p className="eyebrow">Irudi-fitxak · 7. gaitik aurrera</p>
        <h1>Irudiak zenbakiekin</h1>
        <p className="hero-lead">
          Irudi bakoitzak zenbakiak ditu, liburuko irudi batek bezala. <b>Ikasi</b>: zenbaki bakoitzaren izena alboan duzu; estali izenak eta galdetu zeure buruari. <b>Galdetu</b>: zer da 4.a? non dago
          aorta zakua? Zenbaki guztiak asmatu arte.
        </p>
      </section>

      <section className="lab plates">
        <div className="lab-controls">
          <div className="qz-kinds" role="group" aria-label="Fitxa multzoa">
            {(['funtsezkoak', ...PLATE_GROUPS.map((g) => g.week)] as Group[]).map((g) => (
              <button
                key={g}
                className={group === g ? 'is-on' : ''}
                title={g === 'funtsezkoak' ? 'Ondo irakurtzen jakin behar diren irudiak, gai guztietakoak' : PLATE_GROUPS.find((x) => x.week === g)?.title}
                onClick={() => open(groupOf(g)[0], g)}
              >
                {g === 'funtsezkoak' && <span className="plate-star" aria-hidden>★</span>}
                {groupLabel(g)}
              </button>
            ))}
          </div>
        </div>

        <ol className="plate-strip" aria-label="Fitxak" ref={strip}>
          {list.map((p, i) => (
            <li key={p.id}>
              <button className={p.id === plate.id ? 'is-on' : ''} onClick={() => open(p)} title={p.title}>
                <span className="plate-strip-n">{i + 1}</span>
                <span className="plate-strip-t">{p.title}</span>
                {p.key && group !== 'funtsezkoak' && (
                  <span className="plate-star" aria-label="Funtsezkoa">
                    ★
                  </span>
                )}
                {best[p.id] !== undefined && <span className={`plate-best${best[p.id] === 100 ? ' is-full' : ''}`}>{best[p.id]}%</span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="lab-main">
          <div className={`lab-fig plate-fig${gray ? ' is-print' : ''}${names && !quizOn ? ' is-named' : ''}${quizOn && quiz.kind === 'non' && !answered ? ' is-pointing' : ''}`}>
            {hydrated && Scene && (
              <svg ref={svg} viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet" className={`lab-svg plate-svg${ready ? '' : ' is-fitting'}`} style={{ ['--lab-ar' as string]: '1.5625' }} role="img" aria-label={plate.title}>
                <Defs />
                <SceneContext.Provider value={ctx}>
                  <g key={plate.id} className="scene-enter">
                    <SceneView Scene={Scene} t={plate.t} reduced />
                  </g>
                </SceneContext.Provider>
              </svg>
            )}
            {!ready && <p className="plate-loading">Irudia prestatzen…</p>}
          </div>

          <aside className="lab-side plate-side">
            <p className="kicker">
              {plate.week}. gaia{plate.key ? ' · ' : ''}
              {plate.key && <span className="plate-key">★ Funtsezkoa</span>}
            </p>
            <h2 className="lab-q plate-title">{plate.title}</h2>

            <div className="seg plate-modes" role="group" aria-label="Modua">
              <button className={mode === 'ikasi' ? 'is-on' : ''} onClick={() => (setMode('ikasi'), setQuiz(null))}>
                Ikasi
              </button>
              <button className={mode === 'galdetu' ? 'is-on' : ''} onClick={startQuiz} disabled={!ready || !found?.items.length}>
                Galdetu
              </button>
            </div>

            {mode === 'ikasi' && (
              <>
                {plate.hint && <p className="muted plate-hint">{plate.hint}</p>}
                <ol className="plate-legend" onPointerLeave={() => setHovered(null)}>
                  {(ready ? (found?.items ?? []) : []).map((it, i) => {
                    const hidden = cover && !revealed.has(it.id);
                    return (
                      <li key={it.id} className={`${hovered === it.id ? 'is-on' : ''}${hidden ? ' is-covered' : ''}`} onPointerEnter={() => setHovered(it.id)}>
                        <button
                          onClick={() => {
                            if (hidden) setRevealed((r) => new Set(r).add(it.id));
                            setHovered(it.id);
                          }}
                          aria-label={hidden ? `${i + 1}: estalita, sakatu ikusteko` : `${i + 1}: ${it.name}`}
                        >
                          <span className="num-chip">{i + 1}</span>
                          <span className="plate-legend-name">{hidden ? 'Sakatu ikusteko' : it.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <div className="lab-actions">
                  <button
                    className={`btn small ghost${cover ? ' is-on' : ''}`}
                    aria-pressed={cover}
                    onClick={() => {
                      setCover((v) => !v);
                      setRevealed(new Set());
                    }}
                    title="Izenak estali: zenbakiak bakarrik; sakatu bakoitza ikusteko"
                  >
                    Estali izenak
                  </button>
                  <button className={`btn small ghost${names ? ' is-on' : ''}`} aria-pressed={names} onClick={() => setNames((v) => !v)} title="Izenak irudian, zenbakien ordez">
                    Izenak irudian
                  </button>
                  <button className={`btn small ghost${gray ? ' is-on' : ''}`} aria-pressed={gray} onClick={() => setGray((v) => !v)} title="Koloreak ala zuri-beltza">
                    Zuri-beltza
                  </button>
                </div>
              </>
            )}

            {quizOn && !done && askedId && (
              <>
                <p className="plate-progress">
                  {quiz.ok}/{quiz.n} zuzen · {quiz.queue.length} falta
                </p>
                <h3 className="plate-ask">
                  {quiz.kind === 'zer' ? (
                    <>
                      Zer da <span className="num-chip is-asked">{numbers.get(askedId)}</span>?
                    </>
                  ) : (
                    <>Non dago «{nameIn(askedId)}»? Sakatu haren zenbakia irudian.</>
                  )}
                </h3>
                {quiz.kind === 'zer' && (
                  <div className="quiz-options">
                    {quiz.options.map((id, k) => {
                      const state = !answered ? '' : id === right ? ' is-right' : id === quiz.picked ? ' is-wrong' : ' is-faded';
                      return (
                        <button key={id} className={`quiz-option${state}`} disabled={answered} onClick={() => answer(id)}>
                          <span className="opt-letter">{k + 1}</span>
                          {nameIn(id)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {answered && (
                  <div className={`quiz-expl${ok ? ' ok' : ' bad'}`}>
                    <p>
                      <b>{ok ? 'Bai!' : 'Ez.'}</b> {numbers.get(right!)}. zenbakia: <b>{nameIn(right!)}</b>.
                      {!ok && quiz.kind === 'non' && quiz.picked && ` Sakatutakoa (${numbers.get(quiz.picked)}) ${nameIn(quiz.picked)} da.`}
                    </p>
                    {structures.get(right!)?.definition && <p className="muted">{firstSentence(structures.get(right!)!.definition)}</p>}
                  </div>
                )}
                {answered && (
                  <div className="lab-actions">
                    <button className="btn primary" onClick={nextQuestion} autoFocus>
                      Hurrengoa →
                    </button>
                  </div>
                )}
                <p className="lab-keys">Teklak: 1–4 erantzun · Enter hurrengoa</p>
              </>
            )}

            {quizOn && done && (
              <div className="plate-done">
                <p className="plate-score">
                  {(found?.items.length ?? 0) - quiz.missed.length}/{found?.items.length ?? 0} <small>lehen saiakeran</small>
                </p>
                {quiz.missed.length > 0 ? (
                  <>
                    <p className="muted">Berriz begiratu:</p>
                    <ul className="plate-missed">
                      {quiz.missed.map((id) => (
                        <li key={id}>
                          <span className="num-chip">{numbers.get(id)}</span> {nameIn(id)}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="muted">Zenbaki guztiak lehen aldian. Bikain.</p>
                )}
                <div className="lab-actions">
                  <button className="btn small" onClick={startQuiz}>
                    Berriz
                  </button>
                  {at < list.length - 1 && (
                    <button className="btn primary small" onClick={() => (open(list[at + 1]), setMode('galdetu'))}>
                      Hurrengo fitxa →
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'galdetu' && !quizOn && ready && (
              <button className="btn primary" onClick={startQuiz}>
                Hasi galderak
              </button>
            )}

            <div className="plate-foot">
              <div className="plate-nav">
                <button className="btn small ghost" disabled={at <= 0} onClick={() => open(list[at - 1])} aria-label="Aurreko fitxa">
                  ←
                </button>
                <span>
                  {at + 1} / {list.length}
                </span>
                <button className="btn small ghost" disabled={at >= list.length - 1} onClick={() => open(list[at + 1])} aria-label="Hurrengo fitxa">
                  →
                </button>
              </div>
              <Link className="btn small" href={simHref} onClick={toSim}>
                Ikusi simulazioan
              </Link>
            </div>
            <p className="lab-where">
              {stage?.title} · {view?.label}
            </p>
          </aside>
        </div>
      </section>
      <LandFoot>
        <p>Fitxa hauetako irudiak atlasaren eszenak dira (geureak), zenbakiekin. Zuzen eta oker erantzundakoak «Irudian» gaitasunera gehitzen dira.</p>
      </LandFoot>
    </div>
  );
}
