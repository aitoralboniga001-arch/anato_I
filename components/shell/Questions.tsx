'use client';

import { useMemo, useState } from 'react';
import { weeks } from '@/content/registry';
import { rand } from '@/lib/sim/anim';
import type { QuizQuestion } from '@/lib/sim/types';
import { IconCheck, IconClose } from './icons';

interface QuestionsProps {
  week: number;
  onClose: () => void;
  onGoto: (week: number, stageId: string) => void;
}

type Scope = 'astea' | 'denak';

/** Multiple-choice exam practice drawn from the notes. */
export function Questions({ week, onClose, onGoto }: QuestionsProps) {
  const [scope, setScope] = useState<Scope>('astea');
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const pool = useMemo(() => {
    const qs: (QuizQuestion & { week: number })[] = [];
    for (const w of weeks) if (scope === 'denak' || w.week === week) for (const q of w.quiz) qs.push({ ...q, week: w.week });
    return qs
      .map((q, i) => ({ q, k: rand(seed + i * 13.7) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.q);
  }, [scope, week, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, done: 0 });
  const q = pool[i];
  const finished = i >= pool.length;

  const reset = (s: Scope) => {
    setScope(s);
    setI(0);
    setPicked(null);
    setScore({ ok: 0, done: 0 });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal quiz-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Azterketa-galderak">
        <header className="drawer-head">
          <div>
            <p className="eyebrow">Azterketa prestatu</p>
            <h2>Galdera-sorta</h2>
          </div>
          <div className="seg-toggle">
            <button className={scope === 'astea' ? 'is-on' : ''} onClick={() => reset('astea')}>
              {week}. astea
            </button>
            <button className={scope === 'denak' ? 'is-on' : ''} onClick={() => reset('denak')}>
              Aste guztiak
            </button>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Itxi">
            <IconClose />
          </button>
        </header>

        {pool.length === 0 ? (
          <p className="muted pad">Aste honetako galderak prestatzen ari dira.</p>
        ) : finished ? (
          <div className="quiz-done">
            <p className="quiz-score">
              {score.ok}/{score.done}
            </p>
            <p>{score.ok / Math.max(1, score.done) >= 0.8 ? 'Bikain! Azterketarako prest zaude.' : 'Errepasatu hutsegiteak eta saiatu berriro.'}</p>
            <button className="btn primary" onClick={() => reset(scope)}>
              Berriro hasi
            </button>
          </div>
        ) : (
          <div className="quiz-q">
            <div className="quiz-progress">
              <span>
                {i + 1} / {pool.length}
              </span>
              <span>
                <IconCheck size={14} /> {score.ok}
              </span>
            </div>
            <p className="quiz-question">{q.question}</p>
            <div className="quiz-options">
              {q.options.map((o, k) => {
                const state = picked === null ? '' : k === q.answer ? ' is-right' : k === picked ? ' is-wrong' : ' is-faded';
                return (
                  <button
                    key={k}
                    className={`quiz-option${state}`}
                    disabled={picked !== null}
                    onClick={() => {
                      setPicked(k);
                      setScore((s) => ({ ok: s.ok + (k === q.answer ? 1 : 0), done: s.done + 1 }));
                    }}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + k)}</span>
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className={`quiz-expl${picked === q.answer ? ' ok' : ' bad'}`}>
                <strong>{picked === q.answer ? 'Zuzena!' : 'Ez da zuzena.'}</strong> {q.explanation}
              </div>
            )}
            <div className="quiz-actions">
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
          </div>
        )}
      </div>
    </div>
  );
}
