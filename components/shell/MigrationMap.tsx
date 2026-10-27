'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { appearances, getWeek, structures } from '@/content/registry';
import { EARLY, LAYERS, type LNode } from '@/content/lineage';
import { MIGRATIONS, SOURCES, flowIds, sourceIds, type Flow, type MNode } from '@/content/migrations';
import { categoryColor } from '@/lib/sim/palette';

/** A topic tab (week 0 = the topics 1–6 germ-layer trees) or one origin followed across topics. */
type Mode = { week: number; source?: undefined } | { source: string; week?: undefined };

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
  const w = /^gaia-(\d+)$/.exec(h);
  if (w && MIGRATIONS.some((t) => t.week === +w[1])) return { week: +w[1] };
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
      top.current?.scrollIntoView({ block: 'start' });
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const pick = (m: Mode) => {
    setMode(m);
    setShown(new Set());
    history.replaceState(null, '', `#${m.source ? `iturria-${m.source}` : m.week ? `gaia-${m.week}` : 'orriak'}`);
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

  const topic = mode.week ? MIGRATIONS.find((t) => t.week === mode.week)! : null;
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
          {MIGRATIONS.map((t) => (
            <button key={t.week} role="tab" aria-selected={mode.week === t.week} className={`mg-tab${mode.week === t.week ? ' is-on' : ''}`} onClick={() => pick({ week: t.week })}>
              <b>{t.week}</b>
              {t.short}
            </button>
          ))}
        </div>
        {!layersTab && (
          <button className={`mg-quiz${quizOn ? ' is-on' : ''}`} aria-pressed={quizOn} onClick={toggleQuiz} title="Eratorriak ezkutatu eta zeure burua probatu">
            <i aria-hidden />
            <span>Proba modua</span>
          </button>
        )}
      </div>

      <div className="mg-sources">
        <span className="mg-sources-k">Iturri bat jarraitu</span>
        {bySource.map((s) => {
          const st = structures.get(s.id);
          const on = mode.source === s.id;
          return (
            <button key={s.id} className={`mg-src${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => pick(on ? { week: s.groups[0]?.t.week ?? MIGRATIONS[0].week } : { source: s.id })}>
              <i style={{ background: st ? (st.color ?? categoryColor[st.category]) : undefined }} />
              {st?.name ?? s.id}
              <small>{s.count}</small>
            </button>
          );
        })}
      </div>

      {!layersTab && legend}

      <div className={`mg-list${quizOn ? ' is-quiz' : ''}`} key={mode.source ?? mode.week}>
        {layersTab && <div className="mg-early">{layers}</div>}
        {quizOn && !layersTab && (
          <p className="mg-quiz-hint" aria-live="polite">
            <b>Proba modua.</b> Iturriak ikusgai daude; sakatu lauki ezkutu bakoitza zer bihurtzen den ikusteko. {Math.min(shown.size, total)} / {total} agerian.
            {shown.size > 0 && (
              <button type="button" onClick={() => setShown(new Set())}>
                Berriro ezkutatu
              </button>
            )}
          </p>
        )}
        {topic && (
          <>
            <p className="mg-intro">
              <b>{getWeek(topic.week)?.title}</b> · {topic.flows.length} eskema
            </p>
            {topic.flows.map((f) => (
              <FlowCard key={f.id} flow={f} week={topic.week} lit={null} quiz={quiz} />
            ))}
          </>
        )}
        {src && (
          <>
            <p className="mg-intro">
              <b>{structures.get(src.id)?.name ?? src.id}</b> · {src.count} eskema {src.groups.map((g) => `${g.t.week}.`).join(', ')} gaietan. Iturritik datozen egiturak argituta.
            </p>
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
