'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { structures } from '@/content/registry';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import { spanOf } from '@/lib/sim/age';
import { NOTES, sectionLabel, type NotesSection } from '@/content/notes';
import type { StageDef, WeekDef } from '@/lib/sim/types';
import { IconCalendar, IconCheck, IconChevron, IconClose, IconList, IconWarn } from './icons';
import { stageExamDates } from '@/content/examDates';
import { StageLineage, branchOf } from './StageLineage';

const pad = (n: number) => String(n).padStart(2, '0');

/** Sidebar glyph: a panel with an arrow pointing the way it will move. */
export function IconRail({ open, side = 'left' }: { open: boolean; side?: 'left' | 'right' }) {
  const x = side === 'left' ? 6.5 : 13.5;
  const dir = (side === 'left') === open ? -1 : 1;
  const c = side === 'left' ? 12.5 : 7.5;
  return (
    <svg width={16} height={16} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={2.5} y={3.5} width={15} height={13} rx={2.5} />
      <path d={`M${x} 3.5v13`} />
      <path d={`M${c - dir} 7.5L${c + dir} 10L${c - dir} 12.5`} />
    </svg>
  );
}

interface OutlineProps {
  week: WeekDef;
  current: number;
  visited: string[];
  onStage: (i: number) => void;
  /** Folded into a thin rail of the notes' sections, to give the scene the room. */
  collapsed: boolean;
  onToggle: () => void;
}

/** The notes' table of contents with this topic's stages under each heading (stages not listed go last). */
function groupsOf(week: WeekDef) {
  const index = new Map(week.stages.map((s, i) => [s.id, i]));
  const toc = NOTES[week.week] ?? [];
  const listed = new Set(toc.flatMap((sec) => sec.stages));
  const rest = week.stages.filter((s) => !listed.has(s.id)).map((s) => s.id);
  const groups: { sec: NotesSection; items: number[] }[] = toc.map((sec) => ({ sec, items: sec.stages.flatMap((id) => (index.has(id) ? [index.get(id)!] : [])) }));
  if (rest.length) groups.push({ sec: { n: '+', title: 'Gehigarriak', depth: 0, stages: rest }, items: rest.map((id) => index.get(id)!) });
  return groups;
}

/** The stage list grouped under the notes' headings (the steps of a stage live in the scrubber and the caption). */
function NotesList({ week, current, visited, onStage }: Omit<OutlineProps, 'collapsed' | 'onToggle'>) {
  const groups = groupsOf(week);
  const curSec = groups.find((g) => g.items.includes(current))?.sec;
  return (
    <ol className="nt">
      {groups.map(({ sec, items }) => {
        const on = sec === curSec;
        const cls = `nt-sec d${sec.depth}${on ? ' is-cur' : ''}${items.length ? '' : ' is-empty'}`;
        const tip = [sec.covers, sec.note].filter(Boolean).join(' · ') || undefined;
        // One stage under the heading: a single row, named as the notes name it.
        if (items.length === 1) {
          const i = items[0];
          const s = week.stages[i];
          const done = visited.includes(s.id) && !on;
          const same = s.title.toLowerCase() === sec.title.toLowerCase();
          return (
            <li key={sec.n + sec.title} className={`${cls} is-one`}>
              <div className={`ol-item${on ? ' is-cur' : ''}${done ? ' is-done' : ''}`}>
                <button className="ol-stage" onClick={() => onStage(i)} aria-current={on ? 'step' : undefined} title={tip}>
                  <span className="ol-n nt-n">{sec.n}</span>
                  <span className="ol-body">
                    <span className="ol-title">{sec.title}</span>
                    {!same && <span className="nt-stage">{s.title}</span>}
                    <span className="ol-day">
                      {s.day}
                      {s.optional && <em> · gaitegitik kanpo</em>}
                      {done && <IconCheck size={11} />}
                    </span>
                  </span>
                </button>
              </div>
            </li>
          );
        }
        return (
          <li key={sec.n + sec.title} className={cls}>
            <p className="nt-h" title={tip}>
              <span className="nt-n">{sec.n}</span>
              <span className="nt-t">{sec.title}</span>
            </p>
            {!items.length && sec.note && <p className="nt-note">{sec.note}</p>}
            {items.length > 0 && (
              <ol className="nt-stages">
                {items.map((i) => {
                  const s = week.stages[i];
                  const cur = i === current;
                  const done = visited.includes(s.id) && !cur;
                  return (
                    <li key={s.id} className={`ol-item${cur ? ' is-cur' : ''}${done ? ' is-done' : ''}`}>
                      <button className="ol-stage" onClick={() => onStage(i)} aria-current={cur ? 'step' : undefined}>
                        <span className="ol-n" aria-hidden>
                          {done ? <IconCheck size={12} /> : <i className="nt-dot" />}
                        </span>
                        <span className="ol-body">
                          <span className="ol-title">{s.title}</span>
                          <span className="ol-day">
                            {s.day}
                            {s.optional && <em> · gaitegitik kanpo</em>}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Left column: the topic's notes (AURKIBIDEA) with the stages under each heading, so the student reads
 * the simulation in the order and with the numbering of the notes. Folded, it is gone (no cryptic rail):
 * the stage navigator in the stage heading opens the same list.
 */
export function Outline(p: OutlineProps) {
  const { week, current, visited, collapsed, onToggle } = p;
  const seen = week.stages.filter((s) => visited.includes(s.id)).length;
  // Folded, the column is gone: the stage navigator in the stage heading lists the same index.
  if (collapsed) return null;
  return (
    <aside className="outline" aria-label="Apunteen aurkibidea">
      <button className="icon-btn rail-toggle" onClick={onToggle} data-tip="Aurkibidea tolestu · [" data-tip-pos="bottom-end" aria-label="Tolestu aurkibidea" aria-expanded>
        <IconRail open />
      </button>
      <div className="outline-head">
        <p className="kicker">
          {week.week}. gaia · {spanOf(week).long}
        </p>
        <h1>{week.title}</h1>
        <div className="outline-meter" aria-label={`${seen}/${week.stages.length} etapa ikusita`}>
          {week.stages.map((s, i) => (
            <i key={s.id} className={i === current ? 'is-cur' : visited.includes(s.id) ? 'is-on' : ''} />
          ))}
          <small>
            {seen}/{week.stages.length}
          </small>
        </div>
      </div>
      <p className="kicker nt-kicker">Apunteen aurkibidea</p>
      <NotesList {...p} />
    </aside>
  );
}

/**
 * The stage navigator of the stage heading: where this stage sits in the notes ("3.2 Notokorda ·
 * Etapa 3/8") as one key that opens the notes' index with every stage named, its days and a seen
 * tick. It is the outline's job when the column is folded, and it takes the keyboard (arrows, Home/End,
 * Enter, Escape back to the key).
 */
export function StageNav({ week, current, visited, onStage, label, outlineShown, onToggleOutline }: Omit<OutlineProps, 'collapsed' | 'onToggle'> & { label: string; outlineShown: boolean; onToggleOutline: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const seen = week.stages.filter((s) => visited.includes(s.id)).length;
  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>('.ol-stage[aria-current]')?.focus();
    sheet.current?.querySelector<HTMLElement>('.ol-stage[aria-current]')?.scrollIntoView({ block: 'nearest' });
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
      return;
    }
    const items = Array.from(sheet.current?.querySelectorAll<HTMLElement>('.ol-stage') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    let to = -1;
    if (e.key === 'ArrowDown') to = Math.min(items.length - 1, at + 1);
    else if (e.key === 'ArrowUp') to = Math.max(0, at - 1);
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = items.length - 1;
    if (to >= 0) {
      e.preventDefault();
      items[to]?.focus();
    }
    // The simulator's keys (Space, arrows, numbers) must not act on the stage while the list is open.
    if (e.key !== 'Tab') e.stopPropagation();
  };
  return (
    <div className={`snav${open ? ' is-open' : ''}`} ref={root}>
      <button
        ref={btn}
        className="snav-btn"
        data-tour="etapak"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${label}. Etapa ${current + 1}/${week.stages.length}. Etapen zerrenda ireki`}
        title={open ? undefined : 'Apunteen aurkibidea: etapa guztiak'}
      >
        <IconList size={14} />
        <span className="snav-sec">{label}</span>
        {week.stages.length > 1 && (
          <span className="snav-count">
            Etapa <b>{current + 1}</b>/{week.stages.length}
          </span>
        )}
        <IconChevron size={12} className="snav-caret" />
      </button>
      {open && (
        <div className="snav-sheet" ref={sheet} role="dialog" aria-label="Apunteen aurkibidea" onKeyDown={onKey}>
          <div className="snav-head">
            <p className="kicker">
              {week.week}. gaia · Apunteen aurkibidea
            </p>
            <span className="snav-seen">
              {seen}/{week.stages.length} etapa ikusita
            </span>
            <button
              className="btn small ghost snav-pin"
              onClick={() => {
                setOpen(false);
                onToggleOutline();
              }}
              title={outlineShown ? 'Aurkibidearen zutabea itxi · [' : 'Aurkibidea zutabe gisa ireki, beti ikusgai · ['}
            >
              <IconRail open={outlineShown} /> {outlineShown ? 'Zutabea itxi' : 'Zutabean ireki'} <kbd>[</kbd>
            </button>
          </div>
          <div className="snav-list">
            <NotesList
              week={week}
              current={current}
              visited={visited}
              onStage={(i) => {
                setOpen(false);
                onStage(i);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoProps {
  week: number;
  stage: StageDef;
  /** The step being played, to light its date in the list. */
  activeBeat: number;
  /** Jumps to a stage time (the start of a dated step). */
  onSeek: (t: number) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Closes the panel when it is shown as a drawer (narrow screens). */
  onDismiss: () => void;
  /** A topic's own guide at the top of the summary (topic 7: the cavity road). */
  guide?: ReactNode;
}

type Tab = 'gakoak' | 'egiturak' | 'eratorriak';

/** Which summary sections the student folded, remembered per browser (all open by default). */
const FOLD_KEY = 'enbrioatlas:info-folded';
const foldListeners = new Set<() => void>();
let foldCache: string | null = null;
const readFolds = () => {
  if (foldCache === null) {
    try {
      foldCache = window.localStorage.getItem(FOLD_KEY) ?? '';
    } catch {
      foldCache = '';
    }
  }
  return foldCache;
};
const setFold = (id: string, folded: boolean) => {
  const ids = new Set(readFolds().split(',').filter(Boolean));
  if (folded) ids.add(id);
  else ids.delete(id);
  foldCache = [...ids].join(',');
  try {
    window.localStorage.setItem(FOLD_KEY, foldCache);
  } catch {
    // Storage unavailable: the fold lasts for this page only.
  }
  foldListeners.forEach((l) => l());
};
const subscribeFolds = (cb: () => void) => {
  foldListeners.add(cb);
  return () => {
    foldListeners.delete(cb);
  };
};

/** The notes' file name as a title: no extensions, revision tags or underscores. */
const sourceName = (file: string) =>
  file
    .replace(/(\.(docx|pdf))+$/i, '')
    .replace(/\s*\((zuzenduta|zuzendu gabe)\)\s*/i, ' ')
    .replace(/_\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();

/** A summary section with a heading that folds it away (kicker, count, chevron). */
function InfoSection({ id, title, icon, count, tone, children }: { id: string; title: string; icon: ReactNode; count?: number; tone?: 'date' | 'key' | 'warn'; children: ReactNode }) {
  const folded = useSyncExternalStore(subscribeFolds, () => readFolds().split(',').includes(id), () => false);
  const bodyId = `info-sec-${id}`;
  return (
    <section className={`info-sec${tone ? ` is-${tone}` : ''}${folded ? ' is-folded' : ''}`}>
      <h3 className="info-sec-h">
        <button aria-expanded={!folded} aria-controls={bodyId} onClick={() => setFold(id, !folded)} title={folded ? 'Zabaldu' : 'Tolestu'}>
          {icon}
          <span>{title}</span>
          {count !== undefined && <small>{count}</small>}
          <IconChevron size={14} className="info-sec-chev" />
        </button>
      </h3>
      {!folded && (
        <div className="info-sec-body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  );
}

/** Right column: key dates and key points, the structures of the stage, and where they come from. */
export function StageInfo({ week, stage, activeBeat, onSeek, onSelect, onHover, onDismiss, guide }: InfoProps) {
  const [picked, setTab] = useState<Tab>('gakoak');
  const dates = stageExamDates(week, stage);
  const branch = branchOf(stage.structures);
  const tab = picked === 'eratorriak' && !branch ? 'gakoak' : picked;
  return (
    <div className="info-body">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'gakoak'} className={tab === 'gakoak' ? 'is-on' : ''} onClick={() => setTab('gakoak')} title="Gakoak eta data garrantzitsuak">
          Gakoak
        </button>
        <button role="tab" aria-selected={tab === 'egiturak'} className={tab === 'egiturak' ? 'is-on' : ''} onClick={() => setTab('egiturak')}>
          Egiturak <small>{stage.structures.length}</small>
        </button>
        {branch && (
          <button role="tab" aria-selected={tab === 'eratorriak'} className={tab === 'eratorriak' ? 'is-on' : ''} onClick={() => setTab('eratorriak')} title="Nondik datoz eta zer bihurtzen dira etapa honetako egiturak">
            Eratorriak
          </button>
        )}
        <button className="icon-btn info-close" onClick={onDismiss} aria-label="Itxi panela" data-tip="Panela itxi · ]" data-tip-pos="bottom-end">
          <IconClose size={16} />
        </button>
      </div>

      {tab === 'eratorriak' && branch ? (
        <StageLineage ids={stage.structures} root={branch} onSelect={onSelect} />
      ) : tab === 'gakoak' ? (
        <div className="info-scroll">
          {guide}
          {dates.length > 0 && (
            <InfoSection id="datak" title="Data garrantzitsuak" icon={<IconCalendar size={14} />} count={dates.length} tone="date">
              <ol className="xd">
                {dates.map((d, i) => (
                  <li key={i} className={d.k === activeBeat ? 'is-on' : ''}>
                    <button onClick={() => onSeek(stage.beats[d.k].at + 0.001)} title="Joan urrats honetara">
                      <b>{d.when}</b>
                      <span>{d.what}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </InfoSection>
          )}
          {stage.keyPoints.length > 0 ? (
            <InfoSection id="gakoak" title="Gakoak" icon={<IconList size={14} />} count={stage.keyPoints.length} tone="key">
              <ol className="keypoints">
                {stage.keyPoints.map((k, i) => (
                  <li key={i}>
                    <span>{pad(i + 1)}</span>
                    <p>{k}</p>
                  </li>
                ))}
              </ol>
            </InfoSection>
          ) : (
            <p className="muted">Etapa honetarako ez dago gakorik.</p>
          )}
          {!!stage.cautions?.length && (
            <InfoSection id="kontuz" title="Kontuz" icon={<IconWarn size={14} />} count={stage.cautions.length} tone="warn">
              <ul className="cautions">
                {stage.cautions.map((c, i) => (
                  <li key={i} className="caution">
                    <p>{c}</p>
                  </li>
                ))}
              </ul>
            </InfoSection>
          )}
          <p className="source">
            Iturria: {sourceName(stage.source.file)} (apunteak) · {stage.source.section}
          </p>
        </div>
      ) : (
        <div className="info-scroll">
          <p className="info-hint">Pasatu sagua izen baten gainetik irudian non dagoen ikusteko; klikatu fitxa irekitzeko.</p>
          <ul className="struct-list">
            {stage.structures.map((id) => {
              const s = structures.get(id);
              return (
                <li key={id}>
                  <button onClick={() => onSelect(id)} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(id)} onBlur={() => onHover(null)}>
                    <i style={{ background: s?.color ?? (s ? categoryColor[s.category] : '#888') }} />
                    <span>{s?.name ?? id}</span>
                    <small>{s ? categoryLabel[s.category] : ''}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
