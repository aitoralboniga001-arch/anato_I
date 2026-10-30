'use client';

import Link from 'next/link';
import { useCallback, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  aliveAt,
  lifeAt,
  nameAt,
  originText,
  pickMatches,
  type ColourMode,
  type Pick as RoomPick,
  type RoomData,
  type StudyCard,
} from '@/content/eratorriak/model';
import { Flashcards } from './Flashcards';
import { MomentBar } from './MomentBar';
import { TestTable } from './TestTable';
import { TimelineLayout } from './TimelineLayout';
import styles from '../eratorriak.module.css';
import additions from './study.module.css';

export interface DiagramProps {
  stage: number;
  mode: ColourMode;
  lit: ReadonlySet<string>;
  labels: boolean;
  focus?: string | null;
  onPick?: (key: string) => void;
  mini?: boolean;
}
export interface RoomViewState extends DiagramProps {
  names: 'aldaketak' | 'guztiak' | 'gabe';
  /** The moments' titles and how to move between them (the enlarged 3D has its own moment buttons). */
  stages?: string[];
  onStage?: (stage: number) => void;
  onNames?: (names: RoomViewState['names']) => void;
}
export type ShowInTimeline = (keys: string[], stage: number) => void;
const LIFE = ['ez dago', 'badago', 'endekatzen', 'desagertua'];

/** Shared skeleton; each topic owns its anatomy, figures and any specialised tables. */
export function StudyRoom({
  data: d,
  cards,
  tags,
  diagram,
  Figures,
  view3d,
}: {
  data: RoomData;
  cards: StudyCard[];
  tags: { id: string; label: string }[];
  diagram: (props: DiagramProps) => ReactNode;
  Figures?: ComponentType<{ onShow: ShowInTimeline }>;
  /** The room's 3D model (see kit/Room3D): it follows the moment, colours, lit pieces and names. */
  view3d?: (state: RoomViewState) => ReactNode;
}) {
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState<ColourMode>('origin');
  const [labels, setLabels] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<string[]>([]);
  const [pickId, setPickId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [show3d, setShow3d] = useState(true);
  const [names, setNames] = useState<RoomViewState['names']>('aldaketak');
  const timeline = useRef<HTMLElement>(null);
  const go = useCallback((n: number) => setStage(Math.max(0, Math.min(d.stages.length - 1, n))), [d.stages.length]);
  const lit = new Set(hover.length ? hover : selected);
  const byKey = new Map(d.pieces.map((p) => [p.key, p]));
  const focused = focus ? byKey.get(focus) : undefined;
  const show: ShowInTimeline = (keys, at) => {
    setSelected(keys);
    setHover([]);
    setPickId(null);
    setFocus(keys.length === 1 ? keys[0] : null);
    go(at);
    timeline.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const onPick = (key: string) => {
    setSelected([key]);
    setFocus(key);
    setPickId(null);
    setHover([]);
  };
  const pickButton = (p: RoomPick) => (
    <button
      type="button"
      key={p.id}
      aria-pressed={pickId === p.id}
      className={`${styles.pick}${pickId === p.id ? ` ${styles.on}` : ''}`}
      onClick={() => {
        if (pickId === p.id) {
          setSelected([]);
          setPickId(null);
          setFocus(null);
          return;
        }
        setSelected(p.keys);
        setPickId(p.id);
        setFocus(null);
        setHover([]);
        if (!p.keys.every((k) => aliveAt(byKey.get(k)!, stage))) go(p.stage);
      }}
    >
      {p.label}
    </button>
  );
  const sections = [
    ['mapa', 'Mapa'],
    ['denbora', d.schemaTitle],
    ['taula', 'Taula'],
    ['helduak', 'Osagaiak'],
    ['desagertu', 'Aldaketak eta aztarnak'],
    ['irudiak', 'Irudiak'],
    ['nahasketak', 'Nahasketak'],
    ['fitxak', 'Fitxak'],
  ];
  const heading = (n: number) => (
    <h3 className={styles.h3}>
      <b>{n + 1}</b>
      {sections[n][1]}
    </h3>
  );
  const viewState: RoomViewState = {
    stage,
    mode,
    lit,
    labels,
    focus,
    onPick,
    names,
    stages: d.stages.map((m) => m.title),
    onStage: go,
    onNames: setNames,
  };
  return (
    <section
      className={`${styles.room} ${additions.room}`}
      aria-labelledby={`a${d.week}-title`}
      data-room={d.week}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setFocus(null);
          setSelected([]);
          setPickId(null);
          setHover([]);
        }
      }}
    >
      <header className={styles.roomHead}>
        <p className={styles.eyebrow}>{d.week}. gaia · Ikasgela</p>
        <h2 id={`a${d.week}-title`}>{d.title}</h2>
        <p className={styles.lead}>{d.lead}</p>
        <nav className={styles.subnav} aria-label="Ikasgelaren atalak">
          {sections.map(([id, label], i) => (
            <a key={id} href={`#a${d.week}-${id}`}>
              <b>{i + 1}</b>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <section id={`a${d.week}-mapa`} className={styles.block}>
        {heading(0)}
        <div className={styles.overview}>
          {d.overview.map((o, i) => (
            <article key={o.title}>
              <span className={styles.ovNum}>{String.fromCharCode(65 + i)}</span>
              <h4>{o.title}</h4>
              <p className={styles.ovWhere}>Apunteak {o.sec}</p>
              <p>{o.text}</p>
              <p className={styles.ovOut}>{o.out}</p>
              <a className={styles.linkBtn} href={`#a${d.week}-denbora`}>
                Eskeman ikusi →
              </a>
            </article>
          ))}
        </div>
        <ol className={styles.howto}>
          <li>
            <b>Jatorriak</b>: kolore bakoitza nondik datorren.
          </li>
          <li>
            <b>{d.categorical ? 'Egitura eta mekanismoa' : 'Uneak'}</b>: zer aldatzen den, pausoz pauso.
          </li>
          <li>
            <b>Alderantziz</b>: azken egituraren osagaiak bilatu.
          </li>
          <li>
            <b>Oroimenez</b>: taula estali eta fitxekin errepasatu.
          </li>
        </ol>
      </section>
      <section id={`a${d.week}-denbora`} className={styles.block} ref={timeline}>
        {heading(1)}
        <p className={styles.blockLead}>
          {d.categorical
            ? 'Ikuspegi hauek sailkapenak dira: ez dira egitura baten bizitzako uneak.'
            : 'Pieza bakoitzak bere gakoa eta jatorriaren kolorea gordetzen ditu. Mehetzea: endekapena; itzal argia: desagertua.'}{' '}
          Sakatu egitura bat bere izenak eta eratorriak ikusteko.
        </p>
        <MomentBar stages={d.stages} stage={stage} onStage={go} categorical={d.categorical} />
        <div className={styles.tools}>
          <div className={styles.seg2} role="group" aria-label="Kolorea">
            <span>Kolorea</span>
            {(['origin', 'fate'] as const).map((m) => (
              <button key={m} type="button" className={mode === m ? styles.on : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m === 'origin' ? 'Jatorria' : 'Eratorria'}
              </button>
            ))}
          </div>
          <div className={styles.seg2} role="group" aria-label="Izenak">
            <span>Izenak</span>
            <button type="button" aria-pressed={labels} className={labels ? styles.on : ''} onClick={() => setLabels(true)}>
              Bai
            </button>
            <button type="button" aria-pressed={!labels} className={!labels ? styles.on : ''} onClick={() => setLabels(false)}>
              Proba
            </button>
          </div>
          {view3d && (
            <div className={styles.seg2} role="group" aria-label="3D eredua">
              <span>3D</span>
              <button type="button" aria-pressed={show3d} onClick={() => setShow3d(true)}>
                Ondoan
              </button>
              <button type="button" aria-pressed={!show3d} onClick={() => setShow3d(false)}>
                Ezkutatu
              </button>
            </div>
          )}
          <Link className={styles.linkBtn} href={`/astea/${d.week}?etapa=${d.stages[stage].sim}`}>
            Simulagailuan ({d.stages[stage].title}) →
          </Link>
        </div>
        <div className={styles.explore}>
          <label className={styles.exploreK} htmlFor={`a${d.week}-bilatu`}>
            Esploratu egitura bat:
          </label>
          <input
            id={`a${d.week}-bilatu`}
            value={search}
            placeholder="Egitura edo izena bilatu…"
            onChange={(e) => setSearch(e.target.value)}
          />
          {(['enbrioia', 'heldua'] as const).map((g) => (
            <div className={styles.pickRow} key={g}>
              <small>{g === 'enbrioia' ? 'Enbrioian' : 'Eratorriak'}</small>
              {d.picks.filter((p) => !p.detail && p.group === g && pickMatches(d, p, search)).map(pickButton)}
            </div>
          ))}
          <details open={!!search}>
            <summary className={styles.hint}>Enbrioiko piezak, banan-banan</summary>
            <div className={styles.pickRow}>{d.picks.filter((p) => p.detail && pickMatches(d, p, search)).map(pickButton)}</div>
          </details>
          {!d.picks.some((p) => pickMatches(d, p, search)) && (
            <p className={styles.hint}>Ez da izen hori aurkitu. Saiatu beste izen batekin.</p>
          )}
        </div>
        <TimelineLayout
          diagram={
            <div className={styles.ladderBox}>
              {diagram({ stage, mode, lit, labels, focus, onPick })}
              <ul className={styles.legend} aria-label="Kolore gakoa">
                {Object.entries(mode === 'origin' ? d.origins : d.fates).map(([id, o]) => (
                  <li key={id}>
                    <i style={{ background: o.color }} />
                    {o.name}
                  </li>
                ))}
                {!d.categorical && (
                  <li>
                    <i className={styles.legendGhost} />
                    desagertua
                  </li>
                )}
              </ul>
            </div>
          }
          view3d={view3d?.(viewState)}
          show3d={show3d}
          tools3d={
            view3d && (
              <div className={styles.tools3d}>
                {(['aldaketak', 'guztiak', 'gabe'] as const).map((n) => (
                  <button type="button" key={n} className={styles.pick} aria-pressed={names === n} onClick={() => setNames(n)}>
                    {n === 'aldaketak' ? 'Aldaketak' : n === 'guztiak' ? 'Guztiak' : 'Gabe'}
                  </button>
                ))}
              </div>
            )
          }
        >
          {selected.length ? (
            <div className={styles.info}>
              <button
                type="button"
                className={styles.infoClose}
                aria-label="Itxi"
                onClick={() => {
                  setSelected([]);
                  setFocus(null);
                  setPickId(null);
                }}
              >
                ×
              </button>
              <p className={styles.eyebrow}>{focused ? 'Pieza hautatua' : 'Egitura hautatua'}</p>
              <h4>{focused?.emb ?? d.picks.find((p) => p.id === pickId)?.label ?? 'Hautatutako piezak'}</h4>
              {selected.map((k) => {
                const p = byKey.get(k)!;
                return (
                  <div key={k}>
                    <div className={styles.flow}>
                      <span className={styles.flowFrom}>
                        <i style={{ background: d.origins[p.origin].color }} />
                        <span>
                          <small>Jatorria</small>
                          {p.emb}
                          <em> · {originText(p, d)}</em>
                        </span>
                      </span>
                      <span className={styles.flowArrow}>↓</span>
                      <span className={styles.flowTo}>
                        <i style={{ background: d.fates[p.fate]?.color ?? '#77737f' }} />
                        <span>
                          <small>Eratorria / patua</small>
                          {p.fateText}
                          {p.late && <em> · gero: {p.late.text}</em>}
                        </span>
                      </span>
                    </div>
                    <p className={styles.infoNow}>
                      Orain: <b>{nameAt(p, stage)}</b>
                      {!d.categorical && ` — ${LIFE[lifeAt(p, stage)]}`}
                    </p>
                    {p.life && (
                      <div className={styles.lifeRow} aria-label="Bizitza uneka">
                        {d.stages.map((s, i) => (
                          <span
                            key={s.id}
                            data-life={lifeAt(p, i)}
                            className={i === stage ? styles.lifeNow : ''}
                            title={`${s.title}: ${LIFE[lifeAt(p, i)]}`}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className={additions.source}>
                      Apunteak {p.sec} · {p.source.join(', ')}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.changes}>
              <h4>
                {stage + 1}. {d.stages[stage].title} <small>apunteak {d.stages[stage].sec}</small>
              </h4>
              <ul>
                {d.changes[stage].map((c, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onPointerEnter={() => setHover(c.keys)}
                      onPointerLeave={() => setHover([])}
                      onFocus={() => setHover(c.keys)}
                      onBlur={() => setHover([])}
                      onClick={() => setSelected(c.keys)}
                    >
                      {c.text}
                    </button>
                  </li>
                ))}
              </ul>
              <p className={styles.hint}>Lerro baten gainetik pasatzean, haren piezak argitzen dira.</p>
            </div>
          )}
        </TimelineLayout>
      </section>
      <section id={`a${d.week}-taula`} className={styles.block}>
        {heading(2)}
        <TestTable data={d} onShow={show} />
      </section>
      <section id={`a${d.week}-helduak`} className={styles.block}>
        {heading(3)}
        <p className={styles.blockLead}>Egitura bakoitza, bere jatorrien koloreekin. Sakatu eskeman aurkitzeko.</p>
        <div className={styles.composites}>
          {d.composites.map((c) => {
            const f = d.fates[c.fate];
            return (
              <button key={c.fate} type="button" className={styles.composite} onClick={() => show(c.keys, c.stage)}>
                <span className={styles.compHead}>
                  <i style={{ background: f.color }} />
                  <b>{f.name}</b>
                  <em>
                    {new Set(c.keys.map((k) => byKey.get(k)!.origin)).size} jatorri · {c.keys.length} zati
                  </em>
                </span>
                <span className={styles.bar} aria-label="Jatorrien koloreak">
                  {c.keys.map((k) => (
                    <span key={k} style={{ background: d.origins[byKey.get(k)!.origin].color, flex: 1 }} />
                  ))}
                </span>
                <span className={styles.compParts}>
                  {c.keys.map((k) => {
                    const p = byKey.get(k)!;
                    return (
                      <span key={k}>
                        <i style={{ background: d.origins[p.origin].color }} />
                        <span>
                          {p.emb}
                          <em> → {p.fateText}</em>
                        </span>
                      </span>
                    );
                  })}
                </span>
                <span className={styles.compHook}>{f.hook}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section id={`a${d.week}-desagertu`} className={styles.block}>
        {heading(4)}
        <ol className={styles.gone}>
          {d.gone.map((g) => (
            <li key={g.what}>
              <div>
                <b>{g.what}</b>
                <small>{g.when}</small>
                <p>{g.why}</p>
              </div>
              <button type="button" className={styles.linkBtn} onClick={() => show(g.keys, g.stage)}>
                Eskeman ikusi →
              </button>
            </li>
          ))}
        </ol>
      </section>
      <section id={`a${d.week}-irudiak`} className={styles.block}>
        {heading(5)}
        {Figures && <Figures onShow={show} />}
      </section>
      <section id={`a${d.week}-nahasketak`} className={styles.block}>
        {heading(6)}
        <div className={styles.pitfalls}>
          {d.pitfalls.map((p) => (
            <article key={p.wrong}>
              <p className={styles.wrong}>
                <span>✗</span> {p.wrong}
              </p>
              <p className={styles.right}>
                <span>✓</span> {p.right}
              </p>
              <button type="button" className={styles.linkBtn} onClick={() => show(p.keys, p.stage)}>
                Eskeman ikusi →
              </button>
            </article>
          ))}
        </div>
      </section>
      <section id={`a${d.week}-fitxak`} className={styles.block}>
        {heading(7)}
        <p className={styles.blockLead}>
          Galdera irakurri, erantzuna buruan esan eta biratu. Ez nekien: berriz saio honetan; Banekien: hurrengo kutxara. Aurrerapena
          nabigatzaile honetan gordetzen da.
        </p>
        <Flashcards
          key={d.week}
          cards={cards}
          tags={tags}
          storeKey={`enbrioatlas:fitxak-${d.week}`}
          renderFigure={(c) =>
            diagram({ stage: c.stage ?? d.stages.length - 1, mode: 'origin', lit: new Set(c.keys), labels: true, mini: true })
          }
        />
      </section>
    </section>
  );
}
