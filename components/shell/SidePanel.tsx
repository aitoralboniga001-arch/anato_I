'use client';

import { useEffect, useRef, useState } from 'react';
import { structures } from '@/content/registry';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import { spanOf } from '@/lib/sim/age';
import { NOTES, sectionLabel, type NotesSection } from '@/content/notes';
import type { StageDef, WeekDef } from '@/lib/sim/types';
import { IconCalendar, IconCheck, IconClose, IconWarn } from './icons';
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
                      {s.optional && <em> · azterketatik kanpo</em>}
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
                            {s.optional && <em> · azterketatik kanpo</em>}
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
 * the simulation in the order and with the numbering of the notes. Folded, it keeps the headings'
 * numbers with one dot per stage, and shows the whole list while the pointer rests on it.
 */
export function Outline(p: OutlineProps) {
  const { week, current, visited, onStage, collapsed, onToggle } = p;
  const [peek, setPeek] = useState(false);
  const timer = useRef<number | null>(null);
  const later = (v: boolean, ms: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(v), ms);
  };
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const seen = week.stages.filter((s) => visited.includes(s.id)).length;
  if (collapsed) {
    const groups = groupsOf(week).filter((g) => g.items.length);
    return (
      <aside
        className={`outline is-rail${peek ? ' is-peek' : ''}`}
        aria-label="Apunteen aurkibidea"
        onPointerEnter={(e) => e.pointerType === 'mouse' && later(true, 260)}
        onPointerLeave={() => later(false, 180)}
      >
        <button className="icon-btn rail-toggle" onClick={onToggle} title="Zabaldu aurkibidea ([)" aria-label="Zabaldu aurkibidea" aria-expanded={false}>
          <IconRail open={false} />
        </button>
        <ol className="rail">
          {groups.map(({ sec, items }) => (
            <li key={sec.n + sec.title} className={`rail-sec${items.includes(current) ? ' is-cur' : ''}${sec.depth ? ' is-sub' : ''}`}>
              <button className="rail-n" onClick={() => onStage(items[0])} title={sectionLabel(sec)}>
                {sec.n}
              </button>
              <span className="rail-dots">
                {items.map((i) => {
                  const s = week.stages[i];
                  const cur = i === current;
                  const done = visited.includes(s.id) && !cur;
                  return (
                    <button
                      key={s.id}
                      className={`rail-dot${cur ? ' is-cur' : ''}${done ? ' is-done' : ''}`}
                      onClick={() => onStage(i)}
                      title={`${s.title} · ${s.day}`}
                      aria-label={s.title}
                      aria-current={cur ? 'step' : undefined}
                    />
                  );
                })}
              </span>
            </li>
          ))}
        </ol>
        {peek && (
          <div className="rail-peek">
            <p className="kicker nt-kicker">{week.week}. gaia · Apunteen aurkibidea</p>
            <NotesList
              {...p}
              onStage={(i) => {
                setPeek(false);
                onStage(i);
              }}
            />
          </div>
        )}
      </aside>
    );
  }
  return (
    <aside className="outline" aria-label="Apunteen aurkibidea">
      <button className="icon-btn rail-toggle" onClick={onToggle} title="Tolestu aurkibidea ([)" aria-label="Tolestu aurkibidea" aria-expanded>
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
}

type Tab = 'gakoak' | 'egiturak' | 'leinuak';

/** Right column: exam dates and key points, the structures of the stage, and where they come from. */
export function StageInfo({ week, stage, activeBeat, onSeek, onSelect, onHover, onDismiss }: InfoProps) {
  const [picked, setTab] = useState<Tab>('gakoak');
  const dates = stageExamDates(week, stage);
  const branch = branchOf(stage.structures);
  const tab = picked === 'leinuak' && !branch ? 'gakoak' : picked;
  return (
    <div className="info-body">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'gakoak'} className={tab === 'gakoak' ? 'is-on' : ''} onClick={() => setTab('gakoak')} title="Azterketarako gakoak eta datak">
          Gakoak
        </button>
        <button role="tab" aria-selected={tab === 'egiturak'} className={tab === 'egiturak' ? 'is-on' : ''} onClick={() => setTab('egiturak')}>
          Egiturak <small>{stage.structures.length}</small>
        </button>
        {branch && (
          <button role="tab" aria-selected={tab === 'leinuak'} className={tab === 'leinuak' ? 'is-on' : ''} onClick={() => setTab('leinuak')} title="Nondik datoz eta zer bihurtzen dira etapa honetako egiturak">
            Leinuak
          </button>
        )}
        <button className="icon-btn info-close" onClick={onDismiss} aria-label="Itxi panela">
          <IconClose size={16} />
        </button>
      </div>

      {tab === 'leinuak' && branch ? (
        <StageLineage ids={stage.structures} root={branch} onSelect={onSelect} />
      ) : tab === 'gakoak' ? (
        <div className="info-scroll">
          {dates.length > 0 && (
            <section className="xd" aria-label="Azterketarako datak">
              <p className="xd-h">
                <IconCalendar size={14} /> Azterketarako datak
              </p>
              <ol>
                {dates.map((d, i) => (
                  <li key={i} className={d.k === activeBeat ? 'is-on' : ''}>
                    <button onClick={() => onSeek(stage.beats[d.k].at + 0.001)} title="Joan urrats honetara">
                      <b>{d.when}</b>
                      <span>{d.what}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {stage.keyPoints.length > 0 ? (
            <ol className="keypoints">
              {stage.keyPoints.map((k, i) => (
                <li key={i}>
                  <span>{pad(i + 1)}</span>
                  <p>{k}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Etapa honetarako ez dago gakorik.</p>
          )}
          {stage.cautions?.map((c, i) => (
            <aside key={i} className="caution">
              <p className="caution-h">
                <IconWarn size={14} /> Kontuz
              </p>
              <p>{c}</p>
            </aside>
          ))}
          <p className="source">
            Iturria: {stage.source.file} · {stage.source.section}
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
