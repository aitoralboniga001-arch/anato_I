'use client';

import { useState } from 'react';
import { COMPETENCES, KEY_IDS, POOL, compKey, competenceLabel, sourceLabel, type Competence, type PoolQuestion } from '@/content/pool';
import { firstSeenOf } from '@/content/chronology';
import { nameOf } from '@/content/registry';
import { IconCheck, IconClose } from './icons';
import { competenceLevel, isDue, recordAnswer, useAnswers, type Answers } from './answers';

interface QuestionsProps {
  week: number;
  onClose: () => void;
  onGoto: (week: number, stageId: string) => void;
  /** Re-test the same concept as an image: find it in the simulator (Aurkitu). */
  onFind?: (concept: string) => void;
  /** Open on one structure's questions (from its passport). */
  concept?: string;
}

type Mode = 'praktika' | 'errepasoa' | 'azterketa';
type Kind = 'denak' | Competence;
type Scope = 'gaia' | 'denak';
type Q = PoolQuestion;

const KINDS: [Kind, string][] = [['denak', 'Denak'], ...COMPETENCES.filter((c) => c.id !== 'irudia' && POOL.some((q) => q.comp === c.id)).map((c): [Kind, string] => [c.id, c.label])];

const EXAM_SIZE = 20;

const hash = (s: string, seed: number) => {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const lastTry = (answers: Answers, id: string) => answers[id]?.hist?.at(-1)?.[0] ?? 0;

function select(week: number, scope: Scope, kind: Kind, concept?: string) {
  return POOL.filter((q) => (concept ? q.concept === concept : scope === 'denak' || q.week === week) && (kind === 'denak' || q.comp === kind));
}

function build(mode: Mode, inScope: Q[], answers: Answers, seed: number): Q[] {
  const now = Date.now();
  const shuffled = [...inScope].sort((a, b) => hash(a.id, seed) - hash(b.id, seed));
  if (mode === 'errepasoa') {
    // One question per competence that needs review, preferably a DIFFERENT one from the one last
    // answered (another wording or another source), so the competence is tested, not the item.
    const keys = new Map<string, Q[]>();
    for (const q of shuffled) {
      const k = compKey(q.comp, q.concept);
      keys.set(k, [...(keys.get(k) ?? []), q]);
    }
    const out: Q[] = [];
    for (const qs of keys.values()) {
      if (!qs.some((q) => isDue(answers[q.id], now))) continue;
      const recent = [...qs].sort((a, b) => lastTry(answers, b.id) - lastTry(answers, a.id))[0];
      out.push(qs.find((q) => q.id !== recent.id && lastTry(answers, q.id) === 0) ?? qs.find((q) => q.id !== recent.id) ?? recent);
    }
    return out;
  }
  if (mode !== 'azterketa') return shuffled;
  // A mock exam: competences not yet mastered first, one question per competence, then the rest.
  const seen = new Set<string>();
  const firstPass: Q[] = [];
  for (const q of shuffled) {
    const k = compKey(q.comp, q.concept);
    if (seen.has(k) || competenceLevel(answers, KEY_IDS.get(k) ?? [q.id]) === 'menderatuta') continue;
    seen.add(k);
    firstPass.push(q);
  }
  return [...firstPass, ...shuffled.filter((q) => !firstPass.includes(q))].slice(0, EXAM_SIZE).sort((a, b) => hash(a.id, seed + 1) - hash(b.id, seed + 1));
}

/**
 * Exam practice on one pool (notes' questions, step micro-questions and generated ones), each tagged
 * with the competence it trains. Practise (feedback after each answer), review (competences that were
 * missed or are due, re-tested with a different question) and a mock exam (20, no help until the end).
 */
export function Questions({ week, onClose, onGoto, onFind, concept }: QuestionsProps) {
  const answers = useAnswers();
  const [mode, setMode] = useState<Mode>('praktika');
  const [scope, setScope] = useState<Scope>('gaia');
  const [kind, setKind] = useState<Kind>('denak');
  const [pool, setPool] = useState<Q[]>(() => build('praktika', select(week, 'gaia', 'denak', concept), answers, Math.floor(Math.random() * 1e6)));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [log, setLog] = useState<{ q: Q; picked: number }[]>([]);
  const [now] = useState(() => Date.now());
  const [only, setOnly] = useState(concept);

  const reset = (m: Mode, s: Scope, k: Kind, c = only) => {
    setMode(m);
    setScope(s);
    setKind(k);
    setOnly(c);
    setPool(build(m, select(week, s, k, c), answers, Math.floor(Math.random() * 1e6)));
    setI(0);
    setPicked(null);
    setLog([]);
  };

  const inScope = select(week, scope, kind, only);
  const keys = [...new Set(inScope.map((q) => compKey(q.comp, q.concept)))];
  const mastered = keys.filter((k) => competenceLevel(answers, KEY_IDS.get(k) ?? []) === 'menderatuta').length;
  const due = new Set(inScope.filter((q) => isDue(answers[q.id], now)).map((q) => compKey(q.comp, q.concept))).size;
  const q = pool[i];
  const finished = i >= pool.length;
  const exam = mode === 'azterketa';
  const ok = log.filter((l) => l.picked === l.q.answer).length;
  const canFind = (c?: string) => !!c && !!onFind && !!firstSeenOf(c);

  const choose = (k: number) => {
    setPicked(k);
    recordAnswer(q.id, k === q.answer, q.options[k]);
    setLog((l) => [...l, { q, picked: k }]);
    if (exam) {
      window.setTimeout(() => {
        setI((x) => x + 1);
        setPicked(null);
      }, 350);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal quiz-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Azterketa-galderak">
        <header className="drawer-head">
          <div>
            <p className="eyebrow">Azterketa prestatu</p>
            <h2>Galderak</h2>
          </div>
          {only ? (
            <div className="seg-toggle">
              <button className="is-on" title="Egitura honi buruzko galderak soilik">
                {nameOf(only)}
              </button>
              <button onClick={() => reset(mode, scope, kind, undefined)} title="Kendu iragazkia">
                ×
              </button>
            </div>
          ) : (
            <div className="seg-toggle">
              <button className={scope === 'gaia' ? 'is-on' : ''} onClick={() => reset(mode, 'gaia', kind)}>
                {week}. gaia
              </button>
              <button className={scope === 'denak' ? 'is-on' : ''} onClick={() => reset(mode, 'denak', kind)}>
                Gai guztiak
              </button>
            </div>
          )}
          <button className="icon-btn" onClick={onClose} aria-label="Itxi">
            <IconClose />
          </button>
        </header>

        <div className="qz-bar">
          <div className="qz-modes" role="tablist" aria-label="Modua">
            <button role="tab" aria-selected={mode === 'praktika'} className={mode === 'praktika' ? 'is-on' : ''} onClick={() => reset('praktika', scope, kind)} title="Erantzun bakoitzaren ondoren azalpena">
              Praktikatu
            </button>
            <button role="tab" aria-selected={mode === 'errepasoa'} className={mode === 'errepasoa' ? 'is-on' : ''} onClick={() => reset('errepasoa', scope, kind)} title="Huts egindako edo berriro lantzeko garaia iritsi zaien gaitasunak, BESTE galdera batekin">
              Errepasatu <small>{due}</small>
            </button>
            <button role="tab" aria-selected={exam} className={exam ? 'is-on' : ''} onClick={() => reset('azterketa', scope, kind)} title={`${EXAM_SIZE} galdera, laguntzarik gabe; emaitza bukaeran`}>
              Azterketa-simulakroa
            </button>
          </div>
          <p className="qz-stat" title="Gaitasun bat menderatuta dago azken 3 saiakerak zuzenak direnean, gutxienez 2 galdera desberdinekin eta 2 egun desberdinetan. Bi aldiz jarraian asmatzea ez da nahikoa.">
            <b>{mastered}</b>/{keys.length} gaitasun menderatuta
          </p>
        </div>
        <div className="qz-kinds" aria-label="Gaitasuna">
          {KINDS.map(([k, label]) => (
            <button key={k} className={kind === k ? 'is-on' : ''} onClick={() => reset(mode, scope, k)}>
              {label}
            </button>
          ))}
        </div>

        {pool.length === 0 ? (
          <p className="muted pad">{mode === 'errepasoa' ? 'Ez dago errepasatzeko gaitasunik orain. Ondo!' : 'Ez dago mota honetako galderarik hemen.'}</p>
        ) : finished ? (
          <div className="quiz-done">
            <p className="quiz-score">
              {ok}/{log.length}
            </p>
            <p>{ok / Math.max(1, log.length) >= 0.8 ? 'Bikain! Jarraitu horrela.' : 'Errepasatu hutsegiteak: azalpenak behean dituzu.'}</p>
            {log.some((l) => l.picked !== l.q.answer) && (
              <ol className="qz-review">
                {log
                  .filter((l) => l.picked !== l.q.answer)
                  .map(({ q: rq, picked: p }) => (
                    <li key={rq.id}>
                      <p className="qz-review-q">
                        {rq.question} <em className="qz-kind">{competenceLabel[rq.comp]}</em>
                      </p>
                      <p className="qz-review-bad">
                        Zure erantzuna: {rq.options[p]}
                        {rq.why?.[p] && <span> — {rq.why[p]}</span>}
                      </p>
                      <p className="qz-review-ok">Zuzena: {rq.options[rq.answer]}</p>
                      <span className="qz-review-go">
                        {rq.stageId && (
                          <button className="link-quiet" onClick={() => onGoto(rq.week, rq.stageId!)}>
                            Simulazioan ikusi <span aria-hidden>→</span>
                          </button>
                        )}
                        {canFind(rq.concept) && (
                          <button className="link-quiet" onClick={() => onFind!(rq.concept!)}>
                            Irudian aurkitu <span aria-hidden>→</span>
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
              </ol>
            )}
            <button className="btn primary" onClick={() => reset(mode, scope, kind)}>
              Berriro hasi
            </button>
          </div>
        ) : (
          <div className="quiz-q">
            <div className="quiz-progress">
              <span>
                {i + 1} / {pool.length}
                <em className="qz-kind" title={COMPETENCES.find((c) => c.id === q.comp)?.hint}>
                  {competenceLabel[q.comp]}
                </em>
                <em className="qz-src">{sourceLabel[q.source]}</em>
              </span>
              {!exam && (
                <span>
                  <IconCheck size={14} /> {ok}
                </span>
              )}
            </div>
            <p className="quiz-question">{q.question}</p>
            <div className="quiz-options">
              {q.options.map((o, k) => {
                const state = picked === null ? '' : exam ? (k === picked ? ' is-picked' : ' is-faded') : k === q.answer ? ' is-right' : k === picked ? ' is-wrong' : ' is-faded';
                return (
                  <button key={k} className={`quiz-option${state}`} disabled={picked !== null} onClick={() => choose(k)}>
                    <span className="opt-letter">{String.fromCharCode(65 + k)}</span>
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== null && !exam && (
              <div className={`quiz-expl${picked === q.answer ? ' ok' : ' bad'}`}>
                <strong>{picked === q.answer ? 'Zuzena!' : 'Ez da zuzena.'}</strong>
                {picked !== q.answer && q.why?.[picked] && (
                  <p className="qz-why">
                    <b>«{q.options[picked]}»:</b> {q.why[picked]}
                  </p>
                )}
                <p className="qz-why">{q.why ? q.why[q.answer] : q.explanation}</p>
              </div>
            )}
            {!exam && (
              <div className="quiz-actions">
                {picked !== null && picked !== q.answer && canFind(q.concept) && (
                  <button className="btn" onClick={() => onFind!(q.concept!)} title="Gaitasun bera, beste formatu batean: aurkitu egitura irudian">
                    Irudian aurkitu
                  </button>
                )}
                {picked !== null && q.stageId && (
                  <button className="btn" onClick={() => onGoto(q.week, q.stageId!)}>
                    Simulazioan ikusi
                  </button>
                )}
                <button
                  className="btn primary"
                  disabled={picked === null}
                  onClick={() => {
                    setI((x) => x + 1);
                    setPicked(null);
                  }}
                >
                  Hurrengoa →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
