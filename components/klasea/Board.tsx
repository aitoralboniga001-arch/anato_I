'use client';

import { useEffect, useRef } from 'react';
import type { ClassCommand } from '@/lib/klasea/engine';
import type { BoardItem, Lesson } from '@/lib/klasea/types';
import styles from './klasea.module.css';

/**
 * The class's board: what Kimu writes, one item after each line that names it, under the heading of the
 * chunk it was taught in. Only key facts go up (the notes stay in the simulator). The chunk headings are
 * also the class's menu. While the table is being filled from memory, its blanked cells are hidden here.
 */

const itemsOf = (lesson: Lesson, chunk: number) => lesson.chunks[chunk].board ?? [];

/** The rows of a table written so far (a table's rows can be written over several chunks). */
const rowsWritten = (t: Extract<BoardItem, { kind: 'table' }>, written: string[]) => t.rows.filter((r) => written.includes(r.id));

export function Board({ lesson, cmd, running, weak, onChunk, compact }: {
  lesson: Lesson;
  cmd: ClassCommand;
  running: boolean;
  /** Chunks the student missed or marked: flagged in the menu. */
  weak: string[];
  onChunk: (i: number) => void;
  /** Narrow screens: one strip with the last item written. */
  compact?: boolean;
}) {
  const fresh = cmd.line?.writes && cmd.written.includes(cmd.line.writes) ? cmd.line.writes : null;
  const hidden = cmd.check?.kind === 'fill' ? cmd.check.blanks : [];
  const freshRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    freshRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [fresh]);

  if (compact) {
    const last = [...cmd.written].reverse()[0];
    const item = lesson.chunks.flatMap((c) => c.board ?? []).find((b) => b.id === last);
    const row = !item ? lesson.chunks.flatMap((c) => c.board ?? []).flatMap((b) => (b.kind === 'table' ? b.rows : [])).find((r) => r.id === last) : null;
    if (!item && !row) return null;
    return (
      <p className={`${styles.strip}${last === fresh ? ` ${styles.fresh}` : ''}`} aria-live="polite">
        <span className={styles.stripK}>Arbelean</span>
        {item?.kind === 'line' ? item.text : row ? `${row.cells[0]} → ${row.cells.slice(1).join(' · ')}` : ''}
      </p>
    );
  }

  return (
    <section className={styles.board} aria-label="Arbela">
      <header className={styles.boardHead}>
        <span className={styles.kicker}>Arbela</span>
        <h2>{lesson.title}</h2>
      </header>

      <div className={styles.goals}>
        <b>Gaur</b>
        <ol>
          {lesson.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ol>
      </div>

      <ol className={styles.chunks}>
        {lesson.chunks.map((c, i) => {
          const here = running && i === cmd.chunkIndex;
          const items = itemsOf(lesson, i);
          const shown = items.filter((b) => (b.kind === 'line' ? cmd.written.includes(b.id) : rowsWritten(b, cmd.written).length > 0 || here));
          return (
            <li key={c.id} className={`${styles.chunk}${here ? ` ${styles.here}` : ''}${i < cmd.chunkIndex || !running ? '' : i > cmd.chunkIndex ? ` ${styles.later}` : ''}`}>
              <button className={styles.chunkBtn} onClick={() => onChunk(i)} aria-current={here ? 'step' : undefined} title={here ? 'Zati hau berriro hasi' : 'Joan zati honetara'}>
                <span className={styles.chunkN}>{i + 1}</span>
                <span>{c.title}</span>
                {weak.includes(c.id) && <em className={styles.weakTag}>errepasatu</em>}
              </button>
              {shown.length > 0 && (
                <div className={styles.items}>
                  {shown.map((b) =>
                    b.kind === 'line' ? (
                      <p key={b.id} ref={b.id === fresh ? (el) => { freshRef.current = el; } : undefined} className={`${styles.item}${b.key ? ` ${styles.key}` : ''}${b.id === fresh ? ` ${styles.fresh}` : ''}`}>
                        {b.text}
                      </p>
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
                          {b.rows.map((r) => {
                            const on = cmd.written.includes(r.id);
                            const blank = hidden.includes(r.id);
                            return (
                              <tr key={r.id} ref={r.id === fresh ? (el) => { freshRef.current = el; } : undefined} className={`${on ? '' : styles.unwritten}${r.id === fresh ? ` ${styles.fresh}` : ''}`}>
                                <th scope="row">{r.cells[0]}</th>
                                {r.cells.slice(1).map((cell, k) => (
                                  <td key={k}>{on && !blank ? cell : blank ? '?' : ''}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ),
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
