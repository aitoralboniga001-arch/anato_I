'use client';

import { useState } from 'react';
import { appearances, structures } from '@/content/registry';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import { spanOf } from '@/lib/sim/age';
import type { StageDef, WeekDef } from '@/lib/sim/types';
import { IconCheck, IconClose, IconWarn } from './icons';

const pad = (n: number) => String(n).padStart(2, '0');

interface OutlineProps {
  week: WeekDef;
  current: number;
  t: number;
  activeBeat: number;
  visited: string[];
  onStage: (i: number) => void;
  onBeat: (k: number) => void;
}

/** Left column: the week as a table of contents; the current stage unfolds into its steps. */
export function Outline({ week, current, t, activeBeat, visited, onStage, onBeat }: OutlineProps) {
  const seen = week.stages.filter((s) => visited.includes(s.id)).length;
  return (
    <aside className="outline" aria-label="Etapak">
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

interface InspectorProps {
  id: string;
  week: WeekDef;
  onClose: () => void;
  onSelect: (id: string) => void;
  onGoto: (week: number, stageId: string) => void;
  currentStageId: string;
}

/** Structure card: what it is, where it comes from, what it becomes, and where to see it. */
export function Inspector({ id, week, onClose, onSelect, onGoto, currentStageId }: InspectorProps) {
  const s = structures.get(id);
  if (!s) {
    return (
      <div className="info-body">
        <p className="muted pad">«{id}» ez dago glosarioan.</p>
      </div>
    );
  }
  const color = s.color ?? categoryColor[s.category];
  const seen = appearances.get(id) ?? [];
  const rows: [string, string | undefined][] = [
    ['Non dago', s.location],
    ['Jatorria', s.origin],
    ['Zer bihurtzen da', s.fate],
  ];
  return (
    <div className="info-body inspector">
      <div className="insp-top">
        <button className="link-quiet" onClick={onClose} title="Itxi (Esc)">
          ← Etaparen informazioa
        </button>
        <button className="icon-btn" onClick={onClose} aria-label="Itxi" title="Itxi (Esc)">
          <IconClose size={16} />
        </button>
      </div>
      <div className="info-scroll">
        <div className="insp-head">
          <span className="insp-swatch" style={{ background: color }} />
          <div>
            <p className="kicker">{categoryLabel[s.category]}</p>
            <h2 className="insp-name">{s.name}</h2>
            {s.aka?.length ? <p className="insp-alt">Beste izenak: {s.aka.join(' · ')}</p> : null}
          </div>
        </div>

        <p className="insp-def">{s.definition}</p>

        <dl className="insp-rows">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>

        {s.caution && (
          <aside className="caution">
            <p className="caution-h">
              <IconWarn size={14} /> Kontuz
            </p>
            <p>{s.caution}</p>
          </aside>
        )}

        {s.related && s.related.length > 0 && (
          <section className="insp-sec">
            <h3>Lotutako egiturak</h3>
            <div className="chips">
              {s.related
                .filter((r) => structures.has(r))
                .map((r) => {
                  const rs = structures.get(r)!;
                  return (
                    <button key={r} className="struct-chip" onClick={() => onSelect(r)}>
                      <i style={{ background: rs.color ?? categoryColor[rs.category] }} />
                      {rs.name}
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {seen.length > 0 && (
          <section className="insp-sec">
            <h3>Non ikusi simulazioan</h3>
            <ul className="seen">
              {seen.map(({ week: w, stage }) => (
                <li key={`${w.week}-${stage.id}`}>
                  <button className={w.week === week.week && stage.id === currentStageId ? 'is-here' : ''} onClick={() => onGoto(w.week, stage.id)}>
                    <span className="seen-week">{pad(w.week)}</span>
                    <span className="seen-title">{stage.title}</span>
                    <span className="seen-day">{stage.day}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
