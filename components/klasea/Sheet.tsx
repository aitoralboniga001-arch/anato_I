'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { nameOf } from '@/content/registry';
import type { Lesson } from '@/lib/klasea/types';
import styles from './klasea.module.css';

/**
 * The class's summary sheet ("Laburpen-orria"): the goals, the whole board, the cautions Kimu raised,
 * the words to know and the chunks to review. One page to print or keep open while studying.
 */
export function Sheet({ lesson, weak, onReview, onClose }: { lesson: Lesson; weak: string[]; onReview: (chunk: number) => void; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const cautions = lesson.chunks.flatMap((c) => c.lines.filter((l) => l.tone === 'caution').map((l) => l.say));
  const words = [...new Set(lesson.chunks.flatMap((c) => c.lines.filter((l) => l.tone === 'emphasis').flatMap((l) => l.focus ?? [])))].map(nameOf);

  const print = () => {
    document.body.classList.add('klasea-print');
    const done = () => {
      document.body.classList.remove('klasea-print');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  };

  return createPortal(
    <div className={styles.sheetScrim} data-klasea-sheet onClick={(e) => e.target === e.currentTarget && onClose()}>
      <article className={styles.sheet} role="dialog" aria-modal="true" aria-label="Laburpen-orria">
        <header className={styles.sheetHead}>
          <div>
            <span className={styles.kicker}>Laburpen-orria · {lesson.week}. gaia</span>
            <h2>{lesson.title}</h2>
          </div>
          <div className={styles.sheetActions}>
            <button className="btn small" onClick={print}>Inprimatu</button>
            <button className="btn small ghost" onClick={onClose} aria-label="Itxi">Itxi</button>
          </div>
        </header>

        {weak.length > 0 && (
          <section className={styles.sheetWeak}>
            <h3>Errepasatzeko</h3>
            <ul>
              {weak.map((id) => {
                const i = lesson.chunks.findIndex((c) => c.id === id);
                return (
                  <li key={id}>
                    <span>{lesson.chunks[i]?.title}</span>
                    <button className="btn small" onClick={() => onReview(i)}>Errepasatu zati hau</button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h3>Klasearen helburuak</h3>
          <ol className={styles.sheetGoals}>
            {lesson.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ol>
        </section>

        {lesson.chunks.map((c) =>
          c.board?.length ? (
            <section key={c.id}>
              <h3>{c.title}</h3>
              {c.board.map((b) =>
                b.kind === 'line' ? (
                  <p key={b.id} className={`${styles.item}${b.key ? ` ${styles.key}` : ''}`}>{b.text}</p>
                ) : (
                  <table key={b.id} className={styles.table}>
                    <thead>
                      <tr>
                        {b.head.map((h) => (
                          <th key={h} scope="col">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((r) => (
                        <tr key={r.id}>
                          <th scope="row">{r.cells[0]}</th>
                          {r.cells.slice(1).map((cell, k) => (
                            <td key={k}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ),
              )}
            </section>
          ) : null,
        )}

        {cautions.length > 0 && (
          <section>
            <h3>Kontuz</h3>
            <ul className={styles.cautions}>
              {cautions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3>Jakin beharreko hitzak</h3>
          <p className={styles.words}>{words.join(' · ')}</p>
        </section>
      </article>
    </div>,
    document.body,
  );
}
