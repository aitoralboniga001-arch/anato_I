'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { appearances, structures, weeks } from '@/content/registry';
import { atlasConfusions, atlasDerivatives, atlasHref, atlasOrigins, atlasPath, atlasRelations, atlasTopics, structureNamed as optionStructure, type AtlasRelation } from '@/content/structure-atlas';
import { POOL } from '@/content/pool';
import { isDue, isMastered, useAnswers, type Answers } from './answers';
import { AtlasFigure } from './AtlasFigure';
import { AtlasCards } from './AtlasCards';
import { categoryColor } from '@/lib/sim/palette';
import type { StructureDef } from '@/lib/sim/types';
import { LandFoot, LandNav } from './LandNav';
import styles from './structure-atlas.module.css';

const catalogue = [...structures.values()].sort((a, b) => a.name.localeCompare(b.name, 'eu'));
const relationLabels: Record<AtlasRelation['kind'], string> = {
  origin: 'Jatorria', transformation: 'Eraldaketa', composition: 'Osaketa', development: 'Garapena',
};
const relationHelp: Record<AtlasRelation['kind'], string> = {
  origin: 'Egitura batetik beste bat sortzen da.',
  transformation: 'Egitura bat beste batean eraldatzen da.',
  composition: 'Egitura bat beste baten osagaia da.',
  development: 'Garapeneko hurrengo egoera edo etapa; ez du berez zelula-jatorria adierazten.',
};
const edgeLabel = (edge: AtlasRelation) => edge.note?.startsWith('Egitura bera:') ? 'Egitura bera' : relationLabels[edge.kind];
/** In the schemes an unlabelled arrow is development (most links); only the other kinds are named. */
const treeLabel = (edge: AtlasRelation) => edge.kind === 'development' && !edge.note?.startsWith('Egitura bera:') ? null : edgeLabel(edge);

/** Question-bank items about each structure (the simulator's "Galderak", filtered to one concept). */
const QUESTIONS = new Map<string, string[]>();
for (const q of POOL) if (q.concept) QUESTIONS.set(q.concept, [...(QUESTIONS.get(q.concept) ?? []), q.id]);

/** Structures with questions waiting for review today (wrong last time, or their review date has come), most first. */
function dueToday(answers: Answers, now: number) {
  return [...QUESTIONS].map(([id, qs]) => ({ id, n: qs.filter((q) => isDue(answers[q], now)).length }))
    .filter((d) => d.n > 0 && structures.has(d.id)).sort((a, b) => b.n - a.n);
}

/** Basque genitive of a name: "esklerotomaren", "amniosen". */
const genitive = (name: string) => `${name.toLocaleLowerCase('eu')}${/[aeiou]$/i.test(name) ? 'ren' : 'en'}`;

/**
 * The viewer's own mix-ups with this structure, from the error log: a wrong option that is one
 * structure's name where the right answer is another's (options that only mention one don't count). `instead`: they picked the other where this was
 * the answer; `picked`: they picked this where the other was.
 */
function mixUps(id: string, answers: Answers) {
  const found = new Map<string, { id: string; instead: number; picked: number }>();
  const bump = (other: string, side: 'instead' | 'picked') => {
    const m = found.get(other) ?? { id: other, instead: 0, picked: 0 };
    m[side]++;
    found.set(other, m);
  };
  for (const q of POOL) {
    const errors = answers[q.id]?.errors ?? [];
    if (!errors.length) continue;
    const right = optionStructure(q.options[q.answer]);
    if (!right) continue;
    for (const e of errors) {
      const wrong = optionStructure(e);
      if (!wrong || wrong === right) continue;
      if (right === id) bump(wrong, 'instead');
      if (wrong === id) bump(right, 'picked');
    }
  }
  return [...found.values()].sort((x, y) => y.instead + y.picked - (x.instead + x.picked));
}

/** A scene that draws the structure: the step that focuses it, else the stage's first view. */
function sceneOf(id: string) {
  const appearance = appearances.get(id)?.find((a) => a.stage.views.length > 0);
  if (!appearance) return null;
  const { week, stage } = appearance;
  const view = stage.beats.find((b) => b.focus?.includes(id) && stage.views.some((v) => v.id === b.view))?.view ?? stage.views[0].id;
  return { week: week.week, stage: stage.id, view };
}
const sceneHref = (scene: NonNullable<ReturnType<typeof sceneOf>>, extra: Record<string, string>) =>
  `/astea/${scene.week}?${new URLSearchParams({ etapa: scene.stage, ikuspegia: scene.view, ...extra })}`;
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('eu').trim();

function matches(query: string, topic: number) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return catalogue.filter((structure) => {
    const haystack = normalize([structure.name, structure.es, ...(structure.aka ?? [])].filter(Boolean).join(' '));
    return (!topic || atlasTopics(structure.id).includes(topic)) && terms.every((term) => haystack.includes(term));
  });
}

function Swatch({ structure }: { structure: StructureDef }) {
  return <i className={styles.swatch} style={{ background: structure.color ?? categoryColor[structure.category] }} aria-hidden="true" />;
}

/** Preserve the paths to matching structures, including ancestors from earlier topics. */
function TopicScheme({ topic, targets, selectedId, onChoose, searching, onPath }: {
  topic: (typeof weeks)[number]; targets: StructureDef[]; selectedId?: string;
  onChoose: (id: string) => void; searching: boolean; onPath: Set<string>;
}) {
  const targetIds = new Set(targets.map((structure) => structure.id));
  const connected = new Set(atlasRelations.flatMap((edge) => [edge.from, edge.to]));
  const shown = new Set(targets.filter((structure) => connected.has(structure.id)).map((structure) => structure.id));
  const pending = [...shown];
  while (pending.length) {
    for (const edge of atlasOrigins(pending.pop()!)) {
      if (!shown.has(edge.from)) { shown.add(edge.from); pending.push(edge.from); }
    }
  }
  const edges = atlasRelations.filter((edge) => shown.has(edge.from) && shown.has(edge.to));
  const roots = [...shown].filter((id) => !edges.some((edge) => edge.to === id));
  const independent = targets.filter((structure) => !connected.has(structure.id));
  function chip(id: string, context = false) {
    const structure = structures.get(id)!;
    return <button type="button" className={styles.treeChip} data-atlas-node={id} data-context={context || undefined}
      data-match={(searching && targetIds.has(id)) || undefined} data-path={(onPath.has(id) && selectedId !== id) || undefined} aria-pressed={selectedId === id}
      onClick={() => onChoose(id)}><Swatch structure={structure} /><span>{structure.name}</span></button>;
  }
  function branch(id: string, path: Set<string>, edge?: AtlasRelation) {
    if (path.has(id)) return null;
    // Earlier topics' structures that only lead here fold into one line ("Zigotoa › … ›"), so each
    // topic shows its own structures instead of repeating the whole road from the zygote.
    const chain = [id];
    let nextPath = new Set(path).add(id);
    for (;;) {
      const at = chain[chain.length - 1];
      if (targetIds.has(at)) break;
      const out = edges.filter((relation) => relation.from === at && !nextPath.has(relation.to));
      if (out.length !== 1 || treeLabel(out[0]) || (out[0].note && out[0].source !== 'content/lineage.ts')) break;
      chain.push(out[0].to);
      nextPath = new Set(nextPath).add(out[0].to);
    }
    const last = chain[chain.length - 1];
    const children = edges.filter((relation) => relation.from === last && !nextPath.has(relation.to));
    const label = edge && treeLabel(edge);
    return <li key={`${id}-${edge?.kind ?? 'root'}`}>
      {label && <span className={styles.edgeLabel}>{label} <span aria-hidden="true">→</span></span>}
      {chain.length > 1 && <p className={styles.crumbs}>
        <span className={styles.crumbsHead}>Aurreko gaietatik</span>
        {chain.slice(0, -1).map((cid) => <span key={cid} className={styles.crumb}>
          <button type="button" data-atlas-node={cid} data-context data-path={onPath.has(cid) || undefined} onClick={() => onChoose(cid)}>{structures.get(cid)!.name}</button>
          <span aria-hidden="true">›</span>
        </span>)}
      </p>}
      {chip(last, !targetIds.has(last))}
      {edge?.note && edge.source !== 'content/lineage.ts' && <p className={styles.edgeNote}>{edge.note}</p>}
      {children.length > 0 && <ul className={styles.tree}>{children.map((relation) => branch(relation.to, nextPath, relation))}</ul>}
    </li>;
  }
  return <section className={styles.topicSection} aria-labelledby={`atlas-topic-${topic.week}`}>
    <header><p className="eyebrow">{topic.week}. gaia · {targets.length} egitura</p><h2 id={`atlas-topic-${topic.week}`}>{topic.title}</h2></header>
    {roots.length > 0 && <ul className={`${styles.tree} ${styles.rootTree}`}>{roots.map((id) => branch(id, new Set()))}</ul>}
    {independent.length > 0 && <details className={styles.independent} open={searching || roots.length === 0}>
      <summary>Beste egiturak <span>{independent.length}</span></summary>
      <p>Egitura hauetarako ez dago lotura espliziturik jasota eskema honetan. Hautatu bat apunteetako azalpena ikusteko.</p>
      <ul>{independent.map((structure) => <li key={structure.id}>{chip(structure.id)}</li>)}</ul>
    </details>}
  </section>;
}

export function StructureAtlas() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const requestedTopic = Number(searchParams.get('gaia'));
  const topic = requestedTopic >= 1 && requestedTopic <= 6 && Number.isInteger(requestedTopic) ? requestedTopic : 0;
  const results = matches(query, topic);
  // Two ways to browse: cards (each structure with its drawing) or the development schemes.
  const schemesView = searchParams.get('ikusi') === 'eskemak';
  const requestedId = searchParams.get('egitura') ?? '';
  const selected = results.find((structure) => structure.id === requestedId);
  const returnTarget = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const answers = useAnswers();
  useEffect(() => {
    if (selected) {
      const detail = document.getElementById('egitura-xehetasuna');
      detail?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 820px)').matches) {
        detail?.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else {
        // Show where it sits in the schemes: its own chip (not a grey copy), if it is off screen.
        const nodes = [...document.querySelectorAll<HTMLElement>('#atlas-zerrenda [data-atlas-node]')].filter((node) => node.dataset.atlasNode === selected.id);
        const node = nodes.find((n) => n.dataset.context === undefined) ?? nodes[0];
        const r = node?.getBoundingClientRect();
        if (node && r && (r.top < 80 || r.bottom > window.innerHeight)) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      if (returnTarget.current?.isConnected) {
        returnTarget.current.focus({ preventScroll: true });
        returnTarget.current.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
    }
  }, [selected]);

  function update(next: { id?: string; query?: string; topic?: number; schemes?: boolean }, replace = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.schemes !== undefined) {
      if (next.schemes) params.set('ikusi', 'eskemak'); else params.delete('ikusi');
    }
    if (next.id !== undefined) {
      if (next.id) params.set('egitura', next.id); else params.delete('egitura');
    }
    if (next.query !== undefined) {
      if (next.query) params.set('q', next.query); else params.delete('q');
    }
    if (next.topic !== undefined) {
      if (next.topic) params.set('gaia', String(next.topic)); else params.delete('gaia');
    }
    const url = `/egiturak${params.size ? `?${params.toString()}` : ''}`;
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }

  function filter(nextQuery: string, nextTopic: number) {
    const nextResults = matches(nextQuery, nextTopic);
    const id = nextResults.find((structure) => structure.id === selected?.id)?.id ?? '';
    update({ query: nextQuery, topic: nextTopic, id }, true);
  }

  function choose(id: string) {
    if (selected?.id === id) return;
    const active = document.activeElement;
    returnTarget.current = active instanceof HTMLElement && active.dataset.atlasNode === id ? active : null;
    const inResults = results.some((structure) => structure.id === id);
    update({ id, ...(!inResults ? { query: '', topic: 0 } : {}) });
  }

  function closeDetail() {
    if (!returnTarget.current?.isConnected || returnTarget.current.dataset.atlasNode !== selected?.id) {
      returnTarget.current = [...document.querySelectorAll<HTMLElement>('[data-atlas-node]')]
        .find((node) => node.dataset.atlasNode === selected?.id) ?? null;
    }
    restoreFocus.current = true;
    update({ id: '' });
  }
  const escape = useEffectEvent(() => closeDetail());

  // "/" jumps to the search box; Esc closes the explanation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (!!e.target.closest('input, select, textarea') || e.target.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === 'Escape' && selected && !typing) escape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  function relationNode(edge: AtlasRelation, side: 'from' | 'to') {
    const structure = structures.get(edge[side]);
    if (!structure) return null;
    return (
      <li key={`${edge.from}-${edge.to}-${edge.kind}`} className={styles.branch}>
        <button type="button" className={styles.node} onClick={() => choose(structure.id)} aria-label={`${structure.name}: egitura aztertu`}>
          <Swatch structure={structure} /><span>{structure.name}</span>
        </button>
        <span className={styles.kind} data-kind={edge.kind}>{edgeLabel(edge)}</span>
        {edge.note && <p className={styles.note}>{edge.note}</p>}
      </li>
    );
  }

  const origins = selected ? atlasOrigins(selected.id) : [];
  const derivatives = selected ? atlasDerivatives(selected.id) : [];
  const seen = selected ? appearances.get(selected.id) ?? [] : [];
  const owners = selected ? weeks.filter((week) => week.structures.some((structure) => structure.id === selected.id)) : [];
  const href = selected ? atlasHref(selected.id) : null;
  const source = seen[0]?.stage.source ?? owners[0]?.source;
  const lineage = selected ? atlasPath(selected.id) : [];
  const onPath = new Set(lineage);
  const scene = selected ? sceneOf(selected.id) : null;
  const asked = selected ? QUESTIONS.get(selected.id) ?? [] : [];
  const tried = asked.filter((id) => answers[id]).length;
  const mastered = asked.filter((id) => isMastered(answers[id])).length;
  const confusions = selected ? atlasConfusions(selected.id) : [];
  // One warning per pair of structures (the notes repeat some across topics); the others are counted.
  const pairs: ((typeof confusions)[number] & { more: number })[] = [];
  for (const c of confusions) {
    const key = c.ids.filter((x) => x !== selected?.id).join(' ');
    const seen = pairs.find((p) => p.ids.filter((x) => x !== selected?.id).join(' ') === key);
    if (seen) seen.more++;
    else pairs.push({ ...c, more: 0 });
  }
  const mine = selected ? mixUps(selected.id, answers) : [];
  // eslint-disable-next-line react-hooks/purity -- review dates are compared with "now" on each render, on purpose
  const now = Date.now();
  const due = dueToday(answers, now);
  const practiceHref = selected && asked.length
    ? scene ? sceneHref(scene, { galderak: selected.id }) : `/astea/${POOL.find((q) => q.concept === selected.id)!.week}?galderak=${selected.id}`
    : null;

  return (
    <div className="landing">
      <LandNav current="egiturak" />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className="eyebrow">1.–6. gaiak · Egituren atlasa</p>
          <h1>Egituren garapena, eskema batean</h1>
          <p>Gai guztietako egiturak eta haien garapen-loturak, adarrez adar.</p>
          <Link href="/leinuak" className={styles.related}>Ernetze orrien leinuak ikusi <span aria-hidden="true">↗</span></Link>
        </header>
          <section className={styles.filters} aria-label="Eskemen iragazkiak">
            <label className={styles.field}>
              <span>Bilatu euskaraz edo gaztelaniaz</span>
              <input ref={searchRef} type="search" value={query} onChange={(event) => filter(event.target.value, topic)} placeholder="Adib. epiblastoa, placenta…"
                onKeyDown={(event) => { if (event.key === 'Enter' && results.length) { event.preventDefault(); choose(results[0].id); } }} aria-describedby="atlas-search-hint" />
              <small id="atlas-search-hint" className={styles.hint}>
                {query && results.length ? <>Enter: <b>{results[0].name}</b> ireki</> : <>Laster-tekla: <kbd>/</kbd></>}
              </small>
            </label>
            <div className={styles.field}>
              <span id="atlas-topic-label">Gaia</span>
              <div className={styles.topics} role="group" aria-labelledby="atlas-topic-label">
                <button type="button" aria-pressed={topic === 0} onClick={() => filter(query, 0)}>Denak</button>
                {weeks.map((week) => <button key={week.week} type="button" aria-pressed={topic === week.week} title={`${week.week}. gaia · ${week.title}`}
                  aria-label={`${week.week}. gaia · ${week.title}`} onClick={() => filter(query, week.week)}>{week.week}</button>)}
              </div>
            </div>
            <div className={styles.filterFoot}>
            <div className={styles.viewToggle} role="group" aria-label="Nola ikusi">
              <button type="button" aria-pressed={!schemesView} onClick={() => update({ schemes: false }, true)}>Txartelak</button>
              <button type="button" aria-pressed={schemesView} onClick={() => update({ schemes: true }, true)}>Eskemak</button>
            </div>
            <div className={styles.resultHead}>
              <p role="status">{results.length} / {catalogue.length} egitura</p>
              {(query || topic > 0) && <button type="button" onClick={() => filter('', 0)}>Garbitu</button>}
            </div>
            <details className={styles.typeHelp}><summary>Lotura motak</summary><p>Geziaren etiketak lotura mota adierazten du; etiketarik gabeko lotura garapena da. Grisez: aurreko gaietako egiturak. Hautatu egitura bat haren azalpena eta garapena ikusteko.</p><dl>{(Object.keys(relationLabels) as AtlasRelation['kind'][]).map((kind) => <div key={kind}><dt>{relationLabels[kind]}</dt><dd>{relationHelp[kind]}</dd></div>)}</dl></details>
            </div>
          </section>
        {due.length > 0 && <section className={styles.review} aria-labelledby="atlas-review-title">
          <h2 id="atlas-review-title">Gaur errepasatzeko <span>{due.length}</span></h2>
          <p>Azken aldiz huts egin zenituen edo errepaso-eguna iritsi zaien galderak dituzten egiturak.</p>
          <ul>{due.slice(0, 12).map((d) => <li key={d.id}>
            <button type="button" aria-pressed={selected?.id === d.id} onClick={() => choose(d.id)}><Swatch structure={structures.get(d.id)!} />{structures.get(d.id)!.name}<span className={styles.count} title="Errepasatzeko galderak">{d.n}</span></button>
          </li>)}</ul>
        </section>}
        <div className={`${styles.layout} ${selected ? styles.hasDetail : ''}`}>
          <div className={schemesView ? styles.schemes : styles.cardList} id="atlas-zerrenda">
            {selected && <a href="#egitura-xehetasuna" className={styles.skip}>Hautatutako egiturara <span aria-hidden="true">↓</span></a>}
            {results.length && !schemesView ? <AtlasCards items={results} topic={topic} selectedId={selected?.id} onChoose={choose} />
            : results.length ? weeks.filter((week) => !topic || week.week === topic).map((week) => {
              const targets = results.filter((structure) => atlasTopics(structure.id).includes(week.week));
              return targets.length ? <TopicScheme key={week.week} topic={week} targets={targets} selectedId={selected?.id} onChoose={choose} searching={!!query} onPath={onPath} /> : null;
            }) : <p className={styles.empty}>Ez da egiturarik aurkitu. Saiatu beste izen batekin edo garbitu iragazkiak.</p>}
          </div>
          {selected && (
            <article className={styles.detail} id="egitura-xehetasuna" aria-labelledby="atlas-structure-title" tabIndex={-1}>
              <header className={styles.detailHead}>
                <button type="button" className={styles.closeDetail} onClick={closeDetail}>Itxi azalpena <span aria-hidden="true">×</span></button>
                <p className={styles.meta}><Swatch structure={selected} />{selected.category.replaceAll('-', ' ')} · {atlasTopics(selected.id).map((number) => `${number}. gaia`).join(' / ')}</p>
                <h2 id="atlas-structure-title">{selected.name}</h2>
                {selected.es && <p className={styles.translation}>{selected.es}</p>}
                <AtlasFigure key={selected.id} id={selected.id} />
                <p>{selected.definition}</p>
                <div className={styles.study}>
                  {href && <Link href={href} className="btn btn-light small">Simulagailuan ikusi <span aria-hidden="true">↗</span></Link>}
                  {scene && <Link href={sceneHref(scene, { aurkitu: selected.id })} className={styles.studyBtn} title="Zuk bilatu eta seinalatu behar duzu irudian">Aurkitu irudian</Link>}
                  {practiceHref && <Link href={practiceHref} className={styles.studyBtn}>Galderak <span className={styles.count}>{asked.length}</span></Link>}
                </div>
                {asked.length > 0 && <div className={styles.progress}>
                  <span className={styles.progressBar} aria-hidden="true">
                    <i style={{ width: `${(mastered / asked.length) * 100}%` }} />
                    <i style={{ width: `${((tried - mastered) / asked.length) * 100}%` }} />
                  </span>
                  <span>{tried ? `${mastered}/${asked.length} menderatuta · ${tried} erantzunda` : 'Oraindik ez duzu galderarik erantzun egitura honi buruz.'}</span>
                </div>}
                {lineage.length > 1 && <nav className={styles.lineage} aria-label="Nondik dator">
                  <span className={styles.lineageHead}>Nondik dator</span>
                  <ol>{lineage.map((id) => <li key={id}>{id === selected.id
                    ? <b aria-current="true"><Swatch structure={selected} />{selected.name}</b>
                    : <button type="button" onClick={() => choose(id)}><Swatch structure={structures.get(id)!} />{structures.get(id)!.name}</button>}</li>)}</ol>
                </nav>}
              </header>
              {(pairs.length > 0 || mine.length > 0) && <section className={styles.confuse} aria-labelledby="atlas-confuse-title">
                <h3 id="atlas-confuse-title">Ez nahastu</h3>
                {pairs.length > 0 && <ul>{pairs.map((c) => <li key={c.text}>
                  <p className={styles.confusePair}>
                    {c.ids.filter((x) => x !== selected.id).map((x) => <button key={x} type="button" onClick={() => choose(x)}><Swatch structure={structures.get(x)!} />{structures.get(x)!.name}</button>)}
                  </p>
                  <blockquote>{c.text}</blockquote>
                  <small>{c.where}{c.more > 0 && ` · apunteetan beste ${c.more} aldiz`}</small>
                </li>)}</ul>}
                {mine.length > 0 && <div className={styles.mine}>
                  <p>Zure erantzunetan</p>
                  <ul>{mine.map((m) => <li key={m.id}>
                    <button type="button" onClick={() => choose(m.id)}><Swatch structure={structures.get(m.id)!} />{structures.get(m.id)!.name}</button>
                    <span>{[m.instead && `${m.instead}× aukeratu duzu ${genitive(selected.name)} ordez`, m.picked && `${m.picked}× ${selected.name.toLocaleLowerCase('eu')} aukeratu duzu haren ordez`].filter(Boolean).join(' · ')}</span>
                  </li>)}</ul>
                </div>}
              </section>}
              <section className={styles.map} aria-labelledby="atlas-relations-title">
                <h3 id="atlas-relations-title">Loturak</h3>
                <p className={styles.mapIntro}>Geziak goitik behera irakurtzen dira. Hautatu egitura bat haren loturak ikusteko.</p>
                {origins.length > 0 && <div className={styles.originGroup}>
                  <h4>Aurretik</h4><ul className={styles.branches}>{origins.map((edge) => relationNode(edge, 'from'))}</ul>
                  <span className={styles.arrow} aria-hidden="true">↓</span>
                </div>}
                <div className={styles.center}><Swatch structure={selected} /><strong>{selected.name}</strong><small>Hautatutako egitura</small></div>
                {derivatives.length > 0 && <div className={styles.derivativeGroup}>
                  <span className={styles.arrow} aria-hidden="true">↓</span>
                  <h4>Ondoren / osatutako egiturak</h4><ul className={styles.branches}>{derivatives.map((edge) => relationNode(edge, 'to'))}</ul>
                </div>}
                {origins.length === 0 && derivatives.length === 0 && <p className={styles.empty}>Ez dago lotura espliziturik jasota. Jatorriari edo patuari buruzko azalpenak behean dituzu, apunteetan jasota badaude.</p>}
                <details className={styles.legend}><summary>Lotura motak</summary><dl>{(Object.keys(relationLabels) as AtlasRelation['kind'][]).map((kind) => <div key={kind}><dt>{relationLabels[kind]}</dt><dd>{relationHelp[kind]}</dd></div>)}</dl></details>
              </section>
              <section className={styles.explanation} aria-labelledby="atlas-notes-title">
                <h3 id="atlas-notes-title">Apunteetako azalpena</h3>
                <dl>
                  {selected.aka && <div><dt>Beste izen batzuk</dt><dd>{selected.aka.join(', ')}</dd></div>}
                  {selected.origin && <div><dt>Jatorria</dt><dd>{selected.origin}</dd></div>}
                  {selected.fate && <div><dt>Patua</dt><dd>{selected.fate}</dd></div>}
                  {selected.location && <div><dt>Kokapena</dt><dd>{selected.location}</dd></div>}
                  {selected.caution && !confusions.some((c) => c.text === selected.caution) && <div className={styles.caution}><dt>Kontuz</dt><dd>{selected.caution}</dd></div>}
                </dl>
                {source && <p className={styles.source}>Iturria: {seen[0]?.week.week ?? owners[0]?.week}. gaiko apunteak · {source.section}</p>}
              </section>
              <section className={styles.appearances} aria-labelledby="atlas-appearances-title">
                <h3 id="atlas-appearances-title">Gaietan zehar</h3>
                <p className={styles.mapIntro}>Egitura hau simulagailuko etapa hauetan agertzen da.</p>
                {seen.length ? <ul>{seen.map(({ week, stage }) => <li key={`${week.week}-${stage.id}`}>
                  <Link href={`/astea/${week.week}?etapa=${stage.id}&egitura=${selected.id}`}><span>{week.week}. gaia · {stage.day}</span><b>{stage.title}</b><span aria-hidden="true">↗</span></Link>
                </li>)}</ul> : <p className={styles.empty}>Egitura katalogoan jasota dago; ez du oraindik simulagailuko etapa loturik.</p>}
              </section>
            </article>
          )}
        </div>
      </main>
      <LandFoot />
    </div>
  );
}
