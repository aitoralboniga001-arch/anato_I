'use client';

import { useState } from 'react';
import type { RoomData, TableRow } from '@/content/eratorriak/model';
import styles from '../eratorriak.module.css';
import roomStyles from './study.module.css';

export function TestTable({
  data,
  rows = data.table,
  columns = data.columns,
  onShow,
}: {
  data: RoomData;
  rows?: TableRow[];
  columns?: string[];
  onShow?: (keys: string[], stage: number) => void;
}) {
  const [test, setTest] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  return (
    <div className={`${styles.tableWrap} ${roomStyles.tableWrap}${onShow ? ` ${roomStyles.hasLinks}` : ''}`}>
      <div className={styles.figBar}>
        <button
          type="button"
          className={`${styles.btn}${test ? ` ${styles.on}` : ''}`}
          aria-pressed={test}
          onClick={() => {
            setTest((t) => !t);
            setOpen(new Set());
          }}
        >
          {test ? 'Erantzunak erakutsi' : 'Proba modua: eratorriak ezkutatu'}
        </button>
        {test && <span className={styles.hint}>Sakatu ? bakoitza erantzuna ikusteko.</span>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Jatorria / egitura</th>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
            {onShow && <th scope="col" aria-label="Eskeman" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <i style={{ background: data.origins[r.origin]?.color }} />
                {r.label}
              </th>
              {r.cells.map((c, i) => {
                const id = `${r.id}-${i}`;
                return (
                  <td key={id}>
                    {test && !open.has(id) ? (
                      <button
                        type="button"
                        className={styles.hiddenCell}
                        aria-label={`${r.label}: ${columns[i]} erakutsi`}
                        onClick={() => setOpen((o) => new Set(o).add(id))}
                      >
                        ?
                      </button>
                    ) : (
                      c
                    )}
                    {i === 0 && r.note && <small>{r.note}</small>}
                  </td>
                );
              })}
              {onShow && (
                <td>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => onShow(r.keys, r.stage)}
                    aria-label={`${r.label} eskeman ikusi`}
                  >
                    Eskeman
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
