'use client';

import { appearances, structures } from '@/content/registry';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { StageDef, WeekDef } from '@/lib/sim/types';
import { IconClose, IconWarn } from './icons';

interface StagePanelProps {
  stage: StageDef;
  activeBeat: number;
  onBeat: (i: number) => void;
  onSelect: (id: string) => void;
}

export function StagePanel({ stage, activeBeat, onBeat, onSelect }: StagePanelProps) {
  return (
    <div className="panel-body">
      <section>
        <h3 className="panel-h">Prozesua urratsez urrats</h3>
        <ol className="beats">
          {stage.beats.map((b, i) => (
            <li key={i} className={i === activeBeat ? 'is-active' : i < activeBeat ? 'is-done' : ''}>
              <button onClick={() => onBeat(i)}>
                <span className="beat-n">{i + 1}</span>
                <span className="beat-text">{b.text}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {stage.keyPoints.length > 0 && (
        <section>
          <h3 className="panel-h">Azterketarako gakoak</h3>
          <ul className="keypoints">
            {stage.keyPoints.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </section>
      )}

      {stage.cautions && stage.cautions.length > 0 && (
        <section className="caution">
          <h3 className="panel-h">
            <IconWarn size={15} /> Kontuz!
          </h3>
          {stage.cautions.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
        </section>
      )}

      {stage.structures.length > 0 && (
        <section>
          <h3 className="panel-h">Etapa honetako egiturak</h3>
          <div className="chips">
            {stage.structures.map((id) => {
              const s = structures.get(id);
              return (
                <button key={id} className="struct-chip" onClick={() => onSelect(id)}>
                  <i style={{ background: s?.color ?? (s ? categoryColor[s.category] : '#888') }} />
                  {s?.name ?? id}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <p className="source">
        Iturria: {stage.source.file} · {stage.source.section}
      </p>
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

export function Inspector({ id, week, onClose, onSelect, onGoto, currentStageId }: InspectorProps) {
  const s = structures.get(id);
  if (!s) {
    return (
      <div className="panel-body">
        <p className="muted">«{id}» ez dago glosarioan.</p>
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
    <div className="panel-body inspector">
      <div className="insp-head">
        <span className="insp-swatch" style={{ background: color, boxShadow: `0 0 24px ${color}66` }} />
        <div>
          <p className="insp-cat">{categoryLabel[s.category]}</p>
          <h2 className="insp-name">{s.name}</h2>
          {s.aka?.length ? <p className="insp-alt">Beste izenak: {s.aka.join(' · ')}</p> : null}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Itxi" title="Itxi (Esc)">
          <IconClose />
        </button>
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
        <section className="caution">
          <h3 className="panel-h">
            <IconWarn size={15} /> Kontuz!
          </h3>
          <p>{s.caution}</p>
        </section>
      )}

      {s.related && s.related.length > 0 && (
        <section>
          <h3 className="panel-h">Lotutako egiturak</h3>
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
        <section>
          <h3 className="panel-h">Non ikusi simulazioan</h3>
          <ul className="seen">
            {seen.map(({ week: w, stage }) => (
              <li key={`${w.week}-${stage.id}`}>
                <button
                  className={w.week === week.week && stage.id === currentStageId ? 'is-here' : ''}
                  onClick={() => onGoto(w.week, stage.id)}
                >
                  <span className="seen-week">{w.week}. astea</span>
                  <span className="seen-day">{stage.day}</span>
                  <span className="seen-title">{stage.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
