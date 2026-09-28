'use client';

import { useState } from 'react';
import { structures } from '@/content/registry';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import { spanOf } from '@/lib/sim/age';
import type { StageDef, WeekDef } from '@/lib/sim/types';
import { IconCheck, IconClose, IconWarn } from './icons';

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
  t: number;
  activeBeat: number;
  visited: string[];
  onStage: (i: number) => void;
  onBeat: (k: number) => void;
  /** Folded into a thin rail of stage numbers, to give the scene the room. */
  collapsed: boolean;
  onToggle: () => void;
}

/** Left column: the topic as a table of contents; the current stage unfolds into its steps. */
export function Outline({ week, current, t, activeBeat, visited, onStage, onBeat, collapsed, onToggle }: OutlineProps) {
  const seen = week.stages.filter((s) => visited.includes(s.id)).length;
  if (collapsed)
    return (
      <aside className="outline is-rail" aria-label="Etapak">
        <button className="icon-btn rail-toggle" onClick={onToggle} title="Zabaldu etapen zerrenda ([)" aria-label="Zabaldu etapen zerrenda" aria-expanded={false}>
          <IconRail open={false} />
        </button>
        <ol className="rail">
          {week.stages.map((s, i) => {
            const cur = i === current;
            const done = visited.includes(s.id) && !cur;
            return (
              <li key={s.id}>
                <button className={`rail-n${cur ? ' is-cur' : ''}${done ? ' is-done' : ''}`} onClick={() => onStage(i)} title={`${s.title} · ${s.day}`} aria-current={cur ? 'step' : undefined}>
                  {pad(i + 1)}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    );
  return (
    <aside className="outline" aria-label="Etapak">
      <button className="icon-btn rail-toggle" onClick={onToggle} title="Tolestu etapen zerrenda ([)" aria-label="Tolestu etapen zerrenda" aria-expanded>
        <IconRail open />
      </button>
      <div className="outline-head">
        <p className="kicker">
          {week.week}. gaia · {spanOf(week).long}
        </p>
        <h1>{week.title}</h1>
        <p className="outline-sub">{week.subtitle}</p>
        <div className="outline-meter" aria-label={`${seen}/${week.stages.length} etapa ikusita`}>
          {week.stages.map((s, i) => (
            <i key={s.id} className={i === current ? 'is-cur' : visited.includes(s.id) ? 'is-on' : ''} />
          ))}
          <small>
            {seen}/{week.stages.length}
          </small>
        </div>
      </div>
      <ol className="ol">
        {week.stages.map((s, i) => {
          const cur = i === current;
          const done = visited.includes(s.id) && !cur;
          return (
            <li key={s.id} className={`ol-item${cur ? ' is-cur' : ''}${done ? ' is-done' : ''}`}>
              <button className="ol-stage" onClick={() => onStage(i)} aria-current={cur ? 'step' : undefined}>
                <span className="ol-n">{done ? <IconCheck size={12} /> : pad(i + 1)}</span>
                <span className="ol-body">
                  <span className="ol-title">{s.title}</span>
                  <span className="ol-day">
                    {s.day}
                    {s.optional && <em> · azterketatik kanpo</em>}
                  </span>
                </span>
              </button>
              {cur && (
                <ol className="ol-beats">
                  {s.beats.map((b, k) => (
                    <li key={k} className={k === activeBeat ? 'is-on' : k < activeBeat || t >= 1 ? 'is-past' : ''}>
                      <button onClick={() => onBeat(k)} title={b.text}>
                        <span className="ol-dot" />
                        <span className="ol-beat">{b.text}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

interface InfoProps {
  stage: StageDef;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Closes the panel when it is shown as a drawer (narrow screens). */
  onDismiss: () => void;
}

type Tab = 'gakoak' | 'egiturak';

/** Right column: exam key points and the structures of the stage. */
export function StageInfo({ stage, onSelect, onHover, onDismiss }: InfoProps) {
  const [tab, setTab] = useState<Tab>('gakoak');
  return (
    <div className="info-body">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'gakoak'} className={tab === 'gakoak' ? 'is-on' : ''} onClick={() => setTab('gakoak')}>
          Azterketarako gakoak
        </button>
        <button role="tab" aria-selected={tab === 'egiturak'} className={tab === 'egiturak' ? 'is-on' : ''} onClick={() => setTab('egiturak')}>
          Egiturak <small>{stage.structures.length}</small>
        </button>
        <button className="icon-btn info-close" onClick={onDismiss} aria-label="Itxi panela">
          <IconClose size={16} />
        </button>
      </div>

      {tab === 'gakoak' ? (
        <div className="info-scroll">
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
