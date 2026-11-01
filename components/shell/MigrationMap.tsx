'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { appearances, getWeek, structures } from '@/content/registry';
import { EARLY, LAYERS, type LNode } from '@/content/lineage';
import { MIGRATIONS, SOURCES, flowIds, sourceIds, type Flow, type MNode } from '@/content/migrations';
import { categoryColor } from '@/lib/sim/palette';
import { ReferenceTables, TABLE_TOPICS } from './eratorriak/ReferenceTables';
import { hasRoom } from './eratorriak/roomWeeks';
import { LearningMaps } from './eratorriak/LearningMaps';
import { GridSchemes, hasGridSchemes } from './eratorriak/GridSchemes';

/** A topic tab (week 0 = the topics 1–6 germ-layer trees), the arch-systems tab, or one origin followed across topics. */
type Mode = { week: number; part?: Part; source?: undefined; arch?: undefined } | { source: string; week?: undefined; part?: undefined; arch?: undefined } | { arch: true; week?: undefined; part?: undefined; source?: undefined };

/** Inside a topic only one part shows at a time; the short tables come first and open by default. Study rooms live at /ikasgela/N. */
type Part = 'taulak' | 'eskemak';

/** Topics 7+ in tab order: every topic with schemes or quick tables. */
const WEEKS = [...new Set([...MIGRATIONS.map((t) => t.week), ...TABLE_TOPICS])].sort((a, b) => a - b);
const SHORT: Record<number, string> = { 14: 'Digestioa' };
const resolveStructureName = (id: string) => structures.get(id)?.name ?? id;

/** The parts a topic has, in reading order. */
const partsOf = (week: number) =>
  ([
    ['taulak', 'Taulak', TABLE_TOPICS.includes(week)],
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
      <Edge via="erlazioa" /> lotura anatomikoa
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
  // A topic's quick tables or schemes ("a14-laburrak", "a7-eskemak"); an old link into a study room ("a12-taula") goes to its page.
  const room = /^a(\d+)-(.+)$/.exec(h);
  if (room && WEEKS.includes(+room[1])) {
    if (room[2] === 'laburrak' || room[2] === 'eskemak') return { week: +room[1], part: room[2] === 'eskemak' ? 'eskemak' : 'taulak' };
    if (hasRoom(+room[1])) {
      window.location.replace(`/ikasgela/${room[1]}${room[2] === 'ikasgela' ? '' : `#${h}`}`);
      return null;
    }
    return { week: +room[1] };
  }
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
  const [menu, setMenu] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLElement>(null);

  // The topic list opens as a panel on tablets; a click outside or Escape closes it.
  useEffect(() => {
    if (!menu) return;
    const out = (e: PointerEvent) => {
      if (!side.current?.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', out);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  useEffect(() => {
    const read = () => {
      const m = parseHash();
      if (!m) return;
      setMode(m);
      // A topic or part goes to the top of the map.
      requestAnimationFrame(() => {
        if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ block: 'start' });
      });
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
          : m.part === 'eskemak'
              ? `a${m.week}-eskemak`
              : `gaia-${m.week}`;
    history.replaceState(null, '', `#${hash}`);
    setMenu(false);
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
  // Topics with integrated grids show them first; the trees and their legend follow.
  const grids = !!topic && part === 'eskemak' && hasGridSchemes(topic.week);
  const quiz: Quiz = { on: quizOn, shown, reveal: (k) => setShown((s) => new Set(s).add(k)) };
  const nameOf = (week: number) => MIGRATIONS.find((t) => t.week === week)?.short ?? SHORT[week] ?? `${week}. gaia`;
  const mark = mode.arch ? '★' : src ? '→' : layersTab ? '1–6' : String(mode.week);
  const short = mode.arch ? 'Arku sistemak' : src ? (structures.get(src.id)?.name ?? src.id) : layersTab ? 'Ernetze orriak' : nameOf(mode.week!);
  const eyebrow = mode.arch ? '8., 9. eta 12. gaiak' : src ? 'Iturri bat gai guztietan' : layersTab ? '1.–6. gaiak' : `${mode.week}. gaia`;
  const follow = (
    <select
      className={`mg-follow${src ? ' is-on' : ''}`}
      aria-label="Iturri bat jarraitu gai guztietan"
      value={mode.source ?? ''}
      onChange={(e) => pick(e.target.value ? { source: e.target.value } : { week: MIGRATIONS[0].week, part: 'eskemak' })}
    >
      <option value="">Iturri bat gai guztietan jarraitu…</option>
      {bySource.map((s) => (
        <option key={s.id} value={s.id}>
          {structures.get(s.id)?.name ?? s.id} ({s.count})
        </option>
      ))}
    </select>
  );
  const toggleQuiz = (e: MouseEvent) => {
    e.preventDefault();
    setQuizOn((q) => !q);
    setShown(new Set());
  };

  return (
    <div className={`mg${menu ? ' is-menu' : ''}`} ref={top}>
      <aside className="mg-side" ref={side}>
        <button type="button" className="mg-side-toggle" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <b aria-hidden>{mark}</b>
          {short}
          <span aria-hidden>▾</span>
        </button>
        <nav className="mg-nav" aria-label="Gaiak">
          <button type="button" className={`mg-nav-arch${mode.arch ? ' is-on' : ''}`} aria-current={mode.arch ? 'page' : undefined} onClick={() => pick({ arch: true })}>
            <b aria-hidden>★</b>
            <span>
              Arku sistemak
              <small>8., 9. eta 12. gaiak, taula bakarrean</small>
            </span>
          </button>
          <p className="mg-nav-k">Gaiak</p>
          <button type="button" className={layersTab ? 'is-on' : undefined} aria-current={layersTab ? 'page' : undefined} onClick={() => pick({ week: 0 })}>
            <b>1–6</b>
            Ernetze orriak
          </button>
          {WEEKS.map((week) => (
            <button key={week} type="button" className={mode.week === week ? 'is-on' : undefined} aria-current={mode.week === week ? 'page' : undefined} onClick={() => pick({ week })}>
              <b>{week}</b>
              {nameOf(week)}
            </button>
          ))}
        </nav>
      </aside>

      <div className="mg-main">
        <header className="mg-head">
          <div>
            <p className="mg-eyebrow">{eyebrow}</p>
            <h2>{short}</h2>
          </div>
          {!layersTab && !(topic && part === 'eskemak') && (
            <button className={`mg-quiz${quizOn ? ' is-on' : ''}`} aria-pressed={quizOn} onClick={toggleQuiz} title="Erantzunak ezkutatu eta zeure burua probatu">
              <i aria-hidden />
              <span>Proba modua</span>
            </button>
          )}
        </header>
        {(parts.length > 1 || (mode.week && hasRoom(mode.week))) && (
          <div className="mg-parts">
            <div role="tablist" aria-label={`${mode.week}. gaiaren atalak`}>
              {parts.length > 1 &&
                parts.map((p) => (
                  <button key={p.id} role="tab" aria-selected={part === p.id} className={part === p.id ? 'is-on' : undefined} onClick={() => pick({ week: mode.week!, part: p.id })}>
                    {p.label}
                  </button>
                ))}
            </div>
            {mode.week && hasRoom(mode.week) ? (
              <Link className="mg-room" href={`/ikasgela/${mode.week}`}>
                Ikasgela: 3D eredua eta fitxak <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        )}

      <div className={`mg-list${quizOn && !(topic && part === 'eskemak') ? ' is-quiz' : ''}`} key={mode.arch ? 'arch' : (mode.source ?? `${mode.week}-${part}`)}>
        {layersTab && <div className="mg-early">{layers}</div>}
        {mode.arch && <ReferenceTables scope="arkuak" quiz={quizOn} />}
        {part === 'taulak' && <ReferenceTables scope={mode.week!} quiz={quizOn} />}
        {((topic && part === 'eskemak') || src) && (
          <header className="mg-schemes-head" id={topic ? `a${topic.week}-eskemak` : undefined}>
            <p className="mg-intro">
              <span className="mg-intro-k">Eskemak · </span>
              {topic ? (
                <>
                  <b>{getWeek(topic.week)?.title}</b>
                </>
              ) : (
                <>
                  <b>{structures.get(src!.id)?.name ?? src!.id}</b> · {src!.count} eskema {src!.groups.map((g) => `${g.t.week}.`).join(', ')} gaietan. Iturritik datozen egiturak argituta.
                </>
              )}
            </p>
            {follow}
            {!grids && legend}
            {quizOn && !topic && (
              <p className="mg-quiz-hint" aria-live="polite">
                Sakatu lauki ezkutu bakoitza eratorria edo erlazioa ikusteko. {Math.min(shown.size, total)} / {total} agerian.
                {shown.size > 0 && (
                  <button type="button" onClick={() => setShown(new Set())}>
                    Berriro ezkutatu
                  </button>
                )}
              </p>
            )}
          </header>
        )}
        {topic && part === 'eskemak' && grids && (
          <>
            <GridSchemes week={topic.week} />
            <header className="mg-trees-head">
              <h3>Zuhaitzak eta errepasoa</h3>
              <p>Egitura bakoitzaren bilakaera urratsez urrats, eta bi noranzkoetako errepasoa.</p>
              {legend}
            </header>
          </>
        )}
        {topic && part === 'eskemak' && <LearningMaps
          key={topic.week}
          week={topic.week}
          resolveName={resolveStructureName}
          renderScheme={(flow) => <Scheme flow={flow} ctx={{ flow: flow.id, week: topic.week, stage: flow.stage, lit: null, quiz: { ...quiz, on: false } }} />}
          renderDetail={(flow) => <FlowCard flow={flow} week={topic.week} lit={null} quiz={{ ...quiz, on: false }} />}
        />}
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
    </div>
  );
}
