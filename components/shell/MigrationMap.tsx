'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { appearances, getWeek, structures } from '@/content/registry';
import { EARLY, LAYERS, type LNode } from '@/content/lineage';
import { MIGRATIONS, SOURCES, flowIds, sourceIds, type Flow, type MNode } from '@/content/migrations';
import { categoryColor } from '@/lib/sim/palette';
import { Topic12Study } from './eratorriak/Topic12';
import { Topic13Study } from './eratorriak/Topic13';
import { Topic7Study } from './eratorriak/Topic7';
import { Topic8Study } from './eratorriak/Topic8';
import { Topic9Study } from './eratorriak/Topic9';
import { Topic10Study } from './eratorriak/Topic10';
import { Topic11Study } from './eratorriak/Topic11';
import { ReferenceTables, TABLE_TOPICS } from './eratorriak/ReferenceTables';

/** Topics with a study room above their schemes (tables, time diagram, 3D, flashcards). */
const STUDY: Record<number, () => ReactNode> = { 7: () => <Topic7Study />, 8: () => <Topic8Study />, 9: () => <Topic9Study />, 10: () => <Topic10Study />, 11: () => <Topic11Study />, 12: () => <Topic12Study />, 13: () => <Topic13Study /> };

/** A topic tab (week 0 = the topics 1–6 germ-layer trees), the arch-systems tab, or one origin followed across topics. */
type Mode = { week: number; part?: Part; source?: undefined; arch?: undefined } | { source: string; week?: undefined; part?: undefined; arch?: undefined } | { arch: true; week?: undefined; part?: undefined; source?: undefined };

/** Inside a topic tab only one part shows at a time, so the page never grows above and below. */
type Part = 'ikasgela' | 'taulak' | 'eskemak';

/** Topics 7+ in tab order: every topic with schemes or quick tables. */
const WEEKS = [...new Set([...MIGRATIONS.map((t) => t.week), ...TABLE_TOPICS])].sort((a, b) => a - b);
const SHORT: Record<number, string> = { 14: 'Digestioa' };

/** The parts a topic has, in reading order. */
const partsOf = (week: number) =>
  ([
    ['ikasgela', 'Ikasgela', !!STUDY[week]],
    ['taulak', 'Taula laburrak', TABLE_TOPICS.includes(week)],
    ['eskemak', 'Eskemak', MIGRATIONS.some((t) => t.week === week)],
  ] as const).filter(([, , has]) => has).map(([id, label]) => ({ id: id as Part, label }));

/** Self-test: the boxes a structure becomes stay hidden until tapped. */
interface Quiz {
  on: boolean;
  shown: ReadonlySet<string>;
  reveal: (key: string) => void;
}

/** What the chips link to, which of them glow and how the self-test treats them. */
interface Ctx {
  flow: string;
  week: number;
  stage: string;
  lit: Set<string> | null;
  quiz: Quiz;
}

/** The simulator stage for a structure: this flow's stage when it is drawn there, else its first stage in the topic, else its first. */
function hrefOf(id: string, week: number, stage: string): string | null {
  const all = appearances.get(id);
  if (!all?.length) return null;
  const here = all.find((a) => a.week.week === week && a.stage.id === stage) ?? all.find((a) => a.week.week === week) ?? all[0];
  return `/astea/${here.week.week}?etapa=${here.stage.id}&egitura=${id}`;
}

/** Whether the followed source is this box itself. */
const isHit = (node: MNode, ctx: Ctx) => !!(ctx.lit && node.id && ctx.lit.has(node.id));

/** A box; `path` marks it as an answer the self-test hides (origins have none and always show); `up` = it comes from the followed source. */
function Chip({ node, ctx, path, up }: { node: MNode; ctx: Ctx; path?: string; up?: boolean }) {
  const s = node.id ? structures.get(node.id) : undefined;
  const label = s?.name ?? node.label ?? node.id;
  const hit = isHit(node, ctx);
  const key = path ? `${ctx.flow}/${path}` : null;
  const hidden = !!key && ctx.quiz.on && !ctx.quiz.shown.has(key);
  const cls = `mg-chip${s ? '' : ' is-plain'}${node.gone ? ' is-gone' : ''}${hit ? ' is-hit' : up ? ' is-path' : ''}${ctx.lit && !hit && !up ? ' is-dim' : ''}${key ? ' is-q' : ''}${key && !hidden ? ' is-shown' : ''}`;
  const body = (
    <>
      {s ? <i style={{ background: s.color ?? categoryColor[s.category] }} /> : <i className={node.gone ? 'is-x' : 'is-o'} />}
      <span>
        {label}
        {node.note && <em>{node.note}</em>}
      </span>
    </>
  );
  if (hidden)
    return (
      <button type="button" className={cls} onClick={() => ctx.quiz.reveal(key!)} aria-label="Erakutsi erantzuna">
        {body}
      </button>
    );
  const href = s ? hrefOf(s.id, ctx.week, ctx.stage) : null;
  return href ? (
    <Link className={cls} href={href} title={s?.definition}>
      {body}
    </Link>
  ) : (
    <span className={cls} title={s?.definition}>
      {body}
    </span>
  );
}

/** The arrow into a box; its label sits above the line, a hidden twin below keeps the line on the box's middle. */
function Edge({ via, move }: { via?: string; move?: boolean }) {
  return (
    <span className={`mg-edge${move ? ' is-move' : ''}`}>
      <span className="mg-via">{via}</span>
      <i className="mg-line" />
      <span className="mg-via is-twin" aria-hidden>
        {via}
      </span>
    </span>
  );
}

function Branch({ node, ctx, path, up }: { node: MNode; ctx: Ctx; path: string; up?: boolean }) {
  const root = !path.includes('.');
  const down = up || isHit(node, ctx);
  return (
    <div className="mg-b">
      {!root && <Edge via={node.via} move={node.move} />}
      <Chip node={node} ctx={ctx} path={root ? undefined : path} up={up} />
      {!!node.kids?.length && (
        <div className="mg-kids">
          {node.kids.map((k, i) => (
            <Branch key={(k.id ?? k.label ?? '') + i} node={k} ctx={ctx} path={`${path}.${i}`} up={down} />
          ))}
        </div>
      )}
    </div>
  );
}

const chainOf = (m: MNode): MNode[] => [m, ...(m.kids?.length ? chainOf(m.kids[0]) : [])];

/** Several origins whose arrows meet in one structure; each step of the chains sits in one column. */
function Merge({ flow, ctx }: { flow: Flow; ctx: Ctx }) {
  const chains = flow.roots.map(chainOf);
  const len = Math.max(...chains.map((c) => c.length));
  // Each box after the followed source in its chain, and the structure they meet in, come from it.
  const from = chains.map((c) => c.findIndex((m) => isHit(m, ctx)));
  return (
    <div className="mg-merge">
      <div className="mg-srcs" style={{ gridTemplateColumns: `${'auto auto '.repeat(len - 1)}auto minmax(18px, 1fr)` }}>
        {chains.map((chain, i) => (
          <div key={i} className="mg-row">
            {chain.map((m, j) => (
              <Fragment key={j}>
                {j > 0 && <Edge via={m.via} move={m.move} />}
                <span className="mg-cell">
                  <Chip node={m} ctx={ctx} path={j > 0 ? `r${i}.${j}` : undefined} up={from[i] >= 0 && j > from[i]} />
                  <i className="mg-fill" />
                </span>
              </Fragment>
            ))}
            <i className="mg-tail" style={{ gridColumn: `${2 * chain.length} / -1` }} />
          </div>
        ))}
      </div>
      <Branch node={{ ...flow.join!, via: flow.joinVia }} ctx={ctx} path="j.0" up={from.some((f) => f >= 0)} />
    </div>
  );
}

function Scheme({ flow, ctx }: { flow: Flow; ctx: Ctx }) {
  const box = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // A soft fade on the right while part of the scheme is still off-screen.
    const check = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    el.addEventListener('scroll', check, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', check);
    };
  }, []);
  return (
    <div className={`mg-scroll${more ? ' is-more' : ''}`} ref={box}>
      {flow.join ? (
        <Merge flow={flow} ctx={ctx} />
      ) : (
        <div className="mg-stack">
          {flow.roots.map((r, i) => (
            <Branch key={i} node={r} ctx={ctx} path={String(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FlowCard({ flow, week, lit, quiz }: { flow: Flow; week: number; lit: Set<string> | null; quiz: Quiz }) {
  const stage = getWeek(week)?.stages.find((s) => s.id === flow.stage);
  return (
    <article className="mg-flow" id={`eskema-${flow.id}`}>
      <header>
        <div>
          <h3>{flow.title}</h3>
          {flow.lead && <p>{flow.lead}</p>}
        </div>
        {stage && (
          <Link className="mg-open" href={`/astea/${week}?etapa=${flow.stage}`} title={stage.title}>
            Simulagailuan <span aria-hidden>→</span>
          </Link>
        )}
      </header>
      <Scheme flow={flow} ctx={{ flow: flow.id, week, stage: flow.stage, lit, quiz }} />
    </article>
  );
}

function findLineage(id: string): LNode | null {
  const walk = (node: LNode): LNode | null => {
    if (node.id === id) return node;
    for (const k of node.kids ?? []) {
      const f = walk(k);
      if (f) return f;
    }
    return null;
  };
  return walk(EARLY) ?? LAYERS.map((l) => walk({ id: l.id, kids: l.kids })).find(Boolean) ?? null;
}

/** How many boxes the self-test hides in these flows. */
const answersIn = (flows: Flow[]) =>
  flows.reduce((a, f) => {
    const count = (m: MNode): number => (m.kids ?? []).reduce((s, k) => s + 1 + count(k), 0);
    return a + (f.join ? f.roots.reduce((s, r) => s + chainOf(r).length - 1, 0) + 1 + count(f.join) : f.roots.reduce((s, r) => s + count(r), 0));
  }, 0);

const legend = (
  <ul className="mg-legend" aria-label="Eskemen irakurketa">
    <li>
      <Edge /> bihurtzen da
    </li>
    <li>
      <Edge move /> migratzen da / lekuz aldatzen da
    </li>
    <li>
      <span className="mg-legend-merge" /> fusionatzen dira
    </li>
    <li>
      <span className="mg-chip is-plain is-gone">
        <i className="is-x" />
        <span>desagertzen da</span>
      </span>
    </li>
  </ul>
);

const parseHash = (): Mode | null => {
  const h = decodeURIComponent(window.location.hash.slice(1));
  if (h === 'orriak') return { week: 0 };
  if (h === 'arku-sistemak') return { arch: true };
  const w = /^gaia-(\d+)$/.exec(h);
  if (w && WEEKS.includes(+w[1])) return { week: +w[1] };
  // A topic's quick tables or schemes ("a14-laburrak", "a7-eskemak"), or a section of its study room ("a12-taula").
  const room = /^a(\d+)-(.+)$/.exec(h);
  if (room && WEEKS.includes(+room[1])) return { week: +room[1], part: room[2] === 'laburrak' ? 'taulak' : room[2] === 'eskemak' ? 'eskemak' : 'ikasgela' };
  const s = /^iturria-(.+)$/.exec(h);
  if (s && SOURCES.some((x) => x.id === s[1])) return { source: s[1] };
  return null;
};

/**
 * "Migrazioak eta bilakaerak": for topics 7 onwards, every structure's path from where it comes from to
 * what it becomes, as left-to-right schemes, one topic at a time or following one origin across topics.
 * A self-test switch hides every derivative until it is tapped. The first tab holds the topics 1–6
 * germ-layer trees (`layers`), so nothing from them shows under a later topic.
 */
export function MigrationMap({ layers }: { layers: ReactNode }) {
  const [mode, setMode] = useState<Mode>({ week: MIGRATIONS[0].week });
  const [quizOn, setQuizOn] = useState(false);
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => {
      const m = parseHash();
      if (!m) return;
      setMode(m);
      // A study-room section scrolls itself into view (its own anchor); a tab or part goes to the top of the map.
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (m.part === 'ikasgela' && /^a\d+-/.test(id)) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
      else top.current?.scrollIntoView({ block: 'start' });
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const pick = (m: Mode) => {
    setMode(m);
    setShown(new Set());
    const hash = m.arch
      ? 'arku-sistemak'
      : m.source
        ? `iturria-${m.source}`
        : !m.week
          ? 'orriak'
          : m.part === 'taulak'
            ? `a${m.week}-laburrak`
            : m.part === 'eskemak'
              ? `a${m.week}-eskemak`
              : `gaia-${m.week}`;
    history.replaceState(null, '', `#${hash}`);
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  };

  const bySource = useMemo(
    () =>
      SOURCES.map((s) => {
        const lit = sourceIds(s.id);
        const groups = MIGRATIONS.map((t) => ({ t, flows: t.flows.filter((f) => flowIds(f).some((id) => lit.has(id))) })).filter((g) => g.flows.length);
        return { id: s.id, lit, groups, count: groups.reduce((a, g) => a + g.flows.length, 0) };
      }),
    [],
  );

  const topic = mode.week ? (MIGRATIONS.find((t) => t.week === mode.week) ?? null) : null;
  const parts = mode.week ? partsOf(mode.week) : [];
  const part: Part | null = mode.week ? (parts.find((p) => p.id === mode.part) ?? parts[0])?.id ?? null : null;
  const src = mode.source ? bySource.find((s) => s.id === mode.source)! : null;
  const early = src ? findLineage(src.id) : null;
  const layersTab = mode.week === 0;
  const flows = topic ? topic.flows : (src?.groups.flatMap((g) => g.flows) ?? []);
  const total = answersIn(flows);
  const quiz: Quiz = { on: quizOn, shown, reveal: (k) => setShown((s) => new Set(s).add(k)) };
  const toggleQuiz = (e: MouseEvent) => {
    e.preventDefault();
    setQuizOn((q) => !q);
    setShown(new Set());
  };

  return (
    <div className="mg" ref={top}>
      <div className="mg-bar">
        <div className="mg-tabs" role="tablist" aria-label="Gaiak">
          <button role="tab" aria-selected={layersTab} className={`mg-tab${layersTab ? ' is-on' : ''}`} onClick={() => pick({ week: 0 })}>
            <b>1–6</b>
            Ernetze orriak
          </button>
          {WEEKS.map((week) => (
            <button key={week} role="tab" aria-selected={mode.week === week} className={`mg-tab${mode.week === week ? ' is-on' : ''}`} onClick={() => pick({ week })}>
              <b>{week}</b>
              {MIGRATIONS.find((t) => t.week === week)?.short ?? SHORT[week] ?? `${week}. gaia`}
            </button>
          ))}
          <button role="tab" aria-selected={!!mode.arch} className={`mg-tab is-featured${mode.arch ? ' is-on' : ''}`} onClick={() => pick({ arch: true })}>
            <b aria-hidden>★</b>
            Arku sistemak
          </button>
        </div>
        <select
          className={`mg-follow${src ? ' is-on' : ''}`}
          aria-label="Iturri bat jarraitu gai guztietan"
          value={mode.source ?? ''}
          onChange={(e) => pick(e.target.value ? { source: e.target.value } : { week: MIGRATIONS[0].week })}
        >
          <option value="">Iturri bat jarraitu…</option>
          {bySource.map((s) => (
            <option key={s.id} value={s.id}>
              {structures.get(s.id)?.name ?? s.id} ({s.count})
            </option>
          ))}
        </select>
        {!layersTab && (
          <button className={`mg-quiz${quizOn ? ' is-on' : ''}`} aria-pressed={quizOn} onClick={toggleQuiz} title="Erantzunak ezkutatu eta zeure burua probatu">
            <i aria-hidden />
            <span>Proba modua</span>
          </button>
        )}
        {parts.length > 1 && (
          <div className="mg-parts" role="tablist" aria-label={`${mode.week}. gaiaren atalak`}>
            {parts.map((p, i) => (
              <button key={p.id} role="tab" aria-selected={part === p.id} className={part === p.id ? 'is-on' : undefined} onClick={() => pick({ week: mode.week!, part: p.id })}>
                <b>{i + 1}</b>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>


      <div className={`mg-list${quizOn ? ' is-quiz' : ''}`} key={mode.arch ? 'arch' : (mode.source ?? `${mode.week}-${part}`)}>
        {layersTab && <div className="mg-early">{layers}</div>}
        {mode.arch && <ReferenceTables scope="arkuak" quiz={quizOn} />}
        {part === 'ikasgela' && STUDY[mode.week!]?.()}
        {part === 'taulak' && <ReferenceTables scope={mode.week!} quiz={quizOn} />}
        {((topic && part === 'eskemak') || src) && (
          <header className="mg-schemes-head" id={topic ? `a${topic.week}-eskemak` : undefined}>
            <p className="mg-intro">
              <span className="mg-intro-k">Eskemak · </span>
              {topic ? (
                <>
                  <b>{getWeek(topic.week)?.title}</b> · {topic.flows.length} eskema
                </>
              ) : (
                <>
                  <b>{structures.get(src!.id)?.name ?? src!.id}</b> · {src!.count} eskema {src!.groups.map((g) => `${g.t.week}.`).join(', ')} gaietan. Iturritik datozen egiturak argituta.
                </>
              )}
            </p>
            {legend}
            {quizOn && (
              <p className="mg-quiz-hint" aria-live="polite">
                Sakatu lauki ezkutu bakoitza zer bihurtzen den ikusteko. {Math.min(shown.size, total)} / {total} agerian.
                {shown.size > 0 && (
                  <button type="button" onClick={() => setShown(new Set())}>
                    Berriro ezkutatu
                  </button>
                )}
              </p>
            )}
          </header>
        )}
        {topic && part === 'eskemak' && topic.flows.map((f) => <FlowCard key={f.id} flow={f} week={topic.week} lit={null} quiz={quiz} />)}
        {src && (
          <>
            {early?.kids?.length ? (
              <article className="mg-flow is-early">
                <header>
                  <div>
                    <span className="mg-topic">1.–6. gaiak</span>
                    <h3>Ernetze orrien leinuan</h3>
                  </div>
                </header>
                <Scheme flow={{ id: 'early', title: '', stage: '', roots: [early as MNode] }} ctx={{ flow: 'early', week: 0, stage: '', lit: src.lit, quiz: { ...quiz, on: false } }} />
              </article>
            ) : null}
            {src.groups.map((g) => (
              <section key={g.t.week} className="mg-group">
                <h4>
                  <b>{g.t.week}. gaia</b> {g.t.short}
                </h4>
                {g.flows.map((f) => (
                  <FlowCard key={f.id} flow={f} week={g.t.week} lit={src.lit} quiz={quiz} />
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
