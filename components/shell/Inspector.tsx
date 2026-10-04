'use client';

import { appearances, getWeek, structures } from '@/content/registry';
import { dayLabel, dayToX, firstSeenOf, lifeOf, periodOf, weekOfDay } from '@/content/chronology';
import { ancestry, childrenOf } from '@/content/lineage';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { WeekDef } from '@/lib/sim/types';
import { IconClose, IconWarn } from './icons';
import { COMPETENCES, KEY_IDS, compKey, imageId } from '@/content/pool';
import { competenceLevel, errorsOf, levelLabel, useAnswers, type Answers } from './answers';

const pad = (n: number) => String(n).padStart(2, '0');

interface InspectorProps {
  id: string;
  week: WeekDef;
  onClose: () => void;
  onSelect: (id: string) => void;
  onGoto: (week: number, stageId: string) => void;
  /** Time machine: play the step where the structure forms, keeping a way back. */
  onReplay: (week: number, stageId: string, at: number, id: string) => void;
  /** Open the questions about this structure. */
  onPractice?: (id: string) => void;
  /** Find this structure in an image (visual competence). */
  onFind?: (id: string) => void;
  currentStageId: string;
}

const barX = dayToX;
const TICKS: [number, string][] = [
  [0, '0'],
  [14, '14'],
  [28, '28'],
  [56, '56'],
  [266, 'jaiotza'],
];

/** Where the structure's life sits on the whole of development; the embryonic period is shaded. */
function LifeBar({ from, to, color }: { from: number; to?: number; color: string }) {
  const a = barX(from);
  const b = to === undefined ? 1 : Math.max(barX(to), a + 0.012);
  return (
    <span className="lifebar" aria-hidden>
      <span className="lifebar-track">
        <i className="lifebar-emb" style={{ left: `${barX(15) * 100}%`, width: `${(barX(56) - barX(15)) * 100}%` }} />
        <i className={`lifebar-span${to === undefined ? ' is-open' : ''}`} style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%`, background: color }} />
      </span>
      {TICKS.map(([d, l]) => (
        <small key={d} style={{ left: `${barX(d) * 100}%` }}>
          {l}
        </small>
      ))}
    </span>
  );
}

function Chip({ id, onSelect, title }: { id: string; onSelect: (id: string) => void; title?: string }) {
  const rs = structures.get(id);
  if (!rs) return null;
  return (
    <button className="struct-chip" onClick={() => onSelect(id)} title={title ?? rs.definition}>
      <i style={{ background: rs.color ?? categoryColor[rs.category] }} />
      {rs.name}
    </button>
  );
}

/**
 * What the learner can already do with this structure, per competence (Noiz? Nondik? … Irudian), from
 * every question and image attempt about it; with the latest confusion and a way to practise.
 */
function CompetenceGrid({ id, answers, drawn, onPractice, onFind }: { id: string; answers: Answers; drawn: boolean; onPractice?: (id: string) => void; onFind?: (id: string) => void }) {
  const rows = COMPETENCES.map((c) => ({ c, ids: c.id === 'irudia' ? (drawn ? [imageId(id)] : []) : (KEY_IDS.get(compKey(c.id, id)) ?? []) })).filter((r) => r.ids.length);
  if (!rows.length) return null;
  const errors = errorsOf(
    answers,
    rows.flatMap((r) => r.ids),
  );
  const hasQuestions = rows.some((r) => r.c.id !== 'irudia');
  return (
    <section className="insp-sec comp">
      <h3 title="Menderatuta = azken 3 saiakerak zuzen, 2 galdera desberdinekin eta 2 egun desberdinetan">Zer dakizu egitura honi buruz?</h3>
      <ul className="comp-grid">
        {rows.map(({ c, ids }) => {
          const lv = competenceLevel(answers, ids);
          return (
            <li key={c.id} className={`comp-${lv}`} title={`${c.hint} · ${levelLabel[lv]}`}>
              <i aria-hidden />
              <span>{c.label}</span>
              <small>{levelLabel[lv]}</small>
            </li>
          );
        })}
      </ul>
      {errors.length > 0 && <p className="comp-err">Azken nahasketa: «{errors[0]}»</p>}
      <span className="comp-actions">
        {hasQuestions && onPractice && (
          <button className="btn small" onClick={() => onPractice(id)}>
            Praktikatu
          </button>
        )}
        {drawn && onFind && (
          <button className="btn small ghost" onClick={() => onFind(id)}>
            Irudian aurkitu
          </button>
        )}
      </span>
    </section>
  );
}

/**
 * Structure passport: the six questions an exam asks about any structure (zer da, noiz, non, nondik,
 * nola, zertan bihurtzen da), each answered from one canonical place, plus a jump to watch it form.
 */
export function Inspector({ id, week, onClose, onSelect, onGoto, onReplay, onPractice, onFind, currentStageId }: InspectorProps) {
  const answers = useAnswers();
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
  const life = lifeOf(id);
  const first = firstSeenOf(id);
  const chain = ancestry(id);
  const kids = [...new Set([...(life?.becomes ?? []), ...childrenOf(id)])].filter((k) => structures.has(k));
  const recall = seen[0] && seen[0].week.week < week.week ? seen[0] : null;
  const firstStage = first ? getWeek(first.week)?.stages.find((st) => st.id === first.stage) : undefined;
  const here = !!first && first.week === week.week && first.stage === currentStageId;

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
        {/* The colour key sits on the category line, so the name lines up with the text under it. */}
        <div className="insp-head">
          <p className="kicker insp-cat">
            <span className="insp-swatch" style={{ background: color }} />
            {categoryLabel[s.category]}
          </p>
          <h2 className="insp-name">{s.name}</h2>
          {s.es && <p className="insp-es">{s.es}</p>}
          {s.aka?.length ? <p className="insp-alt">Beste izenak: {s.aka.join(' · ')}</p> : null}
        </div>

        {recall && (
          <aside className="recall">
            <p className="recall-h">Gogoratu · {recall.week.week}. gaia{life ? ` · ${dayLabel(life.from)}` : ''}</p>
            <p>
              <b>{s.name}</b> {recall.week.week}. gaian ikasi zenuen: {recall.stage.title}.
            </p>
            {chain.length > 1 && (
              <p className="recall-chain">
                {chain.slice(-3).map((c, k) => (
                  <span key={c.id}>
                    {k > 0 && <i aria-hidden> › </i>}
                    {structures.get(c.id)?.name ?? c.id}
                  </span>
                ))}
              </p>
            )}
            {first && first.beat >= 0 ? (
              <button className="link-quiet" onClick={() => onReplay(first.week, first.stage, first.at, id)}>
                Ikusi berriro nola sortzen den <span aria-hidden>→</span>
              </button>
            ) : (
              <button className="link-quiet" onClick={() => onGoto(recall.week.week, recall.stage.id)}>
                Ikusi berriro {recall.week.week}. gaian <span aria-hidden>→</span>
              </button>
            )}
          </aside>
        )}

        <dl className="passport">
          <div>
            <dt>Zer da?</dt>
            <dd>{s.definition}</dd>
          </div>
          {life && (
            <div>
              <dt>Noiz?</dt>
              <dd>
                <b className="pp-when">
                  {dayLabel(life.from)}
                  {life.to !== undefined ? ` → ${dayLabel(life.to)}` : ' → aurrera'}
                </b>
                <span className="pp-sub">
                  {weekOfDay(life.from)}. astea · {periodOf(life.from).name}
                  {!life.exact && ' · gutxi gorabehera'}
                </span>
                <LifeBar from={life.from} to={life.to} color={color} />
                {life.note && <span className="pp-note">{life.note}</span>}
              </dd>
            </div>
          )}
          {s.location && (
            <div>
              <dt>Non?</dt>
              <dd>{s.location}</dd>
            </div>
          )}
          {(s.origin || chain.length > 0) && (
            <div>
              <dt>Nondik?</dt>
              <dd>
                {s.origin}
                {chain.length > 0 && (
                  <span className="pp-chain" title={chain.map((c) => structures.get(c.id)?.name ?? c.id).join(' › ')}>
                    {chain.length > 5 && <i aria-hidden>…</i>}
                    {chain.slice(-5).map((c, k) => (
                      <span key={c.id}>
                        {(k > 0 || chain.length > 5) && (
                          <i aria-hidden title={c.via}>
                            ›
                          </i>
                        )}
                        {c.id === id ? <b>{s.name}</b> : <Chip id={c.id} onSelect={onSelect} />}
                      </span>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          )}
          {first && first.beat >= 0 && first.text && (
            <div>
              <dt>Nola?</dt>
              <dd>
                <span className="pp-how">{first.text}</span>
                {!here && firstStage && (
                  <button className="pp-replay" onClick={() => onReplay(first.week, first.stage, first.at, id)}>
                    <span className="pp-replay-icon" aria-hidden>
                      ▶
                    </span>
                    <span>
                      Ikusi nola sortzen den
                      <small>
                        {first.week}. gaia · {firstStage.title}
                      </small>
                    </span>
                  </button>
                )}
              </dd>
            </div>
          )}
          {(s.fate || kids.length > 0) && (
            <div>
              <dt>Zertan bihurtzen da?</dt>
              <dd>
                {s.fate}
                {kids.length > 0 && (
                  <span className="chips pp-kids">
                    {kids.map((k) => (
                      <Chip key={k} id={k} onSelect={onSelect} />
                    ))}
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>

        <CompetenceGrid id={id} answers={answers} drawn={!!first} onPractice={onPractice} onFind={onFind} />

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
              {s.related.map((r) => (
                <Chip key={r} id={r} onSelect={onSelect} />
              ))}
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
