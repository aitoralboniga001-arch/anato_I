'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  ARCH_GRID, ARCH_SYSTEMS, ARCH_TABLE_IDS, REFERENCE_TABLES,
  type ReferenceLevel, type ReferenceTable,
} from '@/content/eratorriak/reference-tables';
import styles from './ReferenceTables.module.css';

export type TableScope = number | 'arkuak';
const LEVELS: { level: ReferenceLevel; label: string; color: string }[] = [
  { level: 1, label: 'Funtsezkoa', color: '#f0876a' },
  { level: 2, label: 'Garrantzitsua', color: '#e2c065' },
  { level: 3, label: 'Osagarria', color: '#7f97ba' },
];
const levelColor = (level: ReferenceLevel) => LEVELS[level - 1].color;
type Hide = 'none' | 'derivative' | 'origin';
const ASK_MODES: [Exclude<Hide, 'none'>, string][] = [['derivative', 'Eratorria'], ['origin', 'Jatorria']];

/** More essential rows first; the table with more of them comes first. */
const weight = (table: ReferenceTable) => table.rows.reduce((sum, row) => sum + (row.level === 1 ? 100 : row.level === 2 ? 1 : 0), 0);

/** Topics that have quick tables (the page shows a tab for each). */
export const TABLE_TOPICS = [...new Set(REFERENCE_TABLES.map((table) => table.topic))].sort((a, b) => a - b);

/**
 * One topic's quick tables (or the arch-systems view), placed inside that topic's tab.
 * The page's "Proba modua" switch drives `quiz`.
 */
export function ReferenceTables({ scope, quiz }: { scope: TableScope; quiz: boolean }) {
  const [ask, setAsk] = useState<Exclude<Hide, 'none'>>('derivative');
  const hide: Hide = quiz ? ask : 'none';
  const [levels, setLevels] = useState<ReadonlySet<ReferenceLevel>>(new Set([1, 2, 3]));
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const hidden = hide !== 'none';
  const arch = scope === 'arkuak';
  const inView = REFERENCE_TABLES.filter((table) => (arch ? ARCH_TABLE_IDS.includes(table.id) : table.topic === scope));
  const counts = LEVELS.map(({ level }) => inView.reduce((sum, table) => sum + table.rows.filter((row) => row.level === level).length, 0));
  const tables = inView
    .map((table) => ({ ...table, rows: table.rows.filter((row) => levels.has(row.level)).sort((a, b) => a.level - b.level) }))
    .filter((table) => table.rows.length > 0)
    .sort((a, b) => weight(b) - weight(a));
  const resetRevealed = () => setRevealed(new Set());
  const toggleRevealed = (key: string) => setRevealed((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  function toggleLevel(level: ReferenceLevel) {
    setLevels((current) => {
      const next = new Set(current);
      if (next.has(level) && next.size > 1) next.delete(level);
      else next.add(level);
      return next;
    });
    resetRevealed();
  }

  const id = arch ? 'arku-sistemak' : `a${scope}-laburrak`;
  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-title`}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{arch ? '8., 9. eta 12. gaiak' : `${scope}. gaia`} · Taula laburrak</p>
        <h2 id={`${id}-title`}>{arch ? 'Arku sistemak' : 'Taula laburrak'}</h2>
        <p>{arch
          ? 'Arku bakoitzaren nerbioa, muskuluak, hezurrak, arteria eta poltsa, taula bakarrean; gero, egituratik arkura.'
          : 'Jatorria eta eratorria parez pare. Garrantzitsuenak lehenengo, kolorez markatuta.'}</p>
        <div className={styles.tools}>
          <div className={styles.legend} role="group" aria-label="Garrantzia">
            {LEVELS.map(({ level, label, color }, index) => (
              <button key={level} type="button" aria-pressed={levels.has(level)} style={{ '--level': color } as CSSProperties} onClick={() => toggleLevel(level)}>
                <i aria-hidden="true" />{label} <span>{counts[index]}</span>
              </button>
            ))}
          </div>
          {quiz && (
            <div className={styles.ask} role="group" aria-label="Zer ezkutatu">
              <span>Ezkutatu:</span>
              {ASK_MODES.map(([mode, label]) => (
                <button key={mode} type="button" aria-pressed={ask === mode} onClick={() => { setAsk(mode); resetRevealed(); }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className={styles.tables}>
        {arch && <ArchGrid hidden={hidden} levels={levels} revealed={revealed} onToggle={toggleRevealed} />}
        {tables.map((table) => (
          <article key={table.id} className={styles.sheet} aria-labelledby={`reference-${table.id}`}>
            <header className={styles.sheetHead}>
              {arch && <span>{table.topic}. gaia</span>}
              <h3 id={`reference-${table.id}`}>{table.title}</h3>
              {table.lead && <p>{table.lead}</p>}
            </header>
            <table className={styles.table} aria-labelledby={`reference-${table.id}`}>
              <thead><tr><th scope="col">{table.originHeading}</th><th scope="col">{table.derivativeHeading}</th></tr></thead>
              <tbody>
                {table.rows.map((row) => {
                  const key = `${table.id}-${row.id}`;
                  const answerId = `reference-answer-${key}`;
                  const visible = !hidden || revealed.has(key);
                  // The note is the trap line and can give the answer away, so it shows only once the row is answered.
                  const note = row.note && (!hidden || visible) ? <small>{row.note}</small> : null;
                  const origin = <span>{row.origin}</span>;
                  const derivative = <><span>{row.derivative}</span>{hide !== 'origin' && note}</>;
                  const cue = hide === 'origin' ? row.derivative : row.origin;
                  const reveal = (content: ReactNode) => (
                    <>
                      <button
                        type="button"
                        className={styles.reveal}
                        aria-label={`${cue}: ${hide === 'origin' ? 'jatorria' : 'eratorria'} ${visible ? 'ezkutatu' : 'erakutsi'}`}
                        aria-expanded={visible}
                        aria-controls={answerId}
                        onClick={() => toggleRevealed(key)}
                      >{visible ? 'Ezkutatu' : 'Erakutsi'} <span aria-hidden="true">{visible ? '−' : '+'}</span></button>
                      <div id={answerId} hidden={!visible} className={styles.answer}>{content}</div>
                    </>
                  );
                  return (
                    <tr key={row.id} data-level={row.level} style={{ '--row-accent': levelColor(row.level) } as CSSProperties}>
                      <th scope="row">
                        <span className={styles.srOnly}>{LEVELS[row.level - 1].label}: </span>
                        {hide === 'origin' ? reveal(origin) : origin}
                      </th>
                      <td>
                        {hide === 'derivative' ? reveal(derivative) : derivative}
                        {hide === 'origin' && note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArchGrid({ hidden, levels, revealed, onToggle }: {
  hidden: boolean;
  levels: ReadonlySet<ReferenceLevel>;
  revealed: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <article className={`${styles.sheet} ${styles.archSheet}`} aria-labelledby="reference-arku-sistemak">
      <header className={styles.sheetHead}>
        <h3 id="reference-arku-sistemak">Taula nagusia</h3>
        <p>Zutabe bat = arku bat osorik. Errenkada bat = sistema bat arku guztietan. 5. arkua ez da garatzen.</p>
      </header>
      <div className={styles.gridScroll}>
        <table className={`${styles.table} ${styles.archTable}`} aria-labelledby="reference-arku-sistemak">
          <thead>
            <tr>
              <th scope="col"><span className={styles.srOnly}>Sistema</span></th>
              {ARCH_GRID.map((column) => <th key={column.arch} scope="col">{column.arch}</th>)}
            </tr>
          </thead>
          <tbody>
            {ARCH_SYSTEMS.map((system) => (
              <tr key={system.id}>
                <th scope="row">{system.label}</th>
                {ARCH_GRID.map((column) => {
                  const cell = column.cells[system.id];
                  if (!cell) return <td key={column.arch} className={styles.archEmpty}>—</td>;
                  const key = `arku-${column.arch}-${system.id}`;
                  const visible = !hidden || revealed.has(key);
                  return (
                    <td
                      key={column.arch}
                      data-level={cell.level}
                      className={levels.has(cell.level) ? undefined : styles.archMuted}
                      style={{ '--row-accent': levelColor(cell.level) } as CSSProperties}
                    >
                      <span className={styles.srOnly}>{LEVELS[cell.level - 1].label}: </span>
                      {hidden && (
                        <button
                          type="button"
                          className={styles.reveal}
                          aria-label={`${column.arch}, ${system.label}: ${visible ? 'ezkutatu' : 'erakutsi'}`}
                          aria-expanded={visible}
                          onClick={() => onToggle(key)}
                        >{visible ? 'Ezkutatu' : '?'} <span aria-hidden="true">{visible ? '−' : '+'}</span></button>
                      )}
                      {visible && <div className={hidden ? styles.answer : undefined}><span>{cell.text}</span>{cell.note && <small>{cell.note}</small>}</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
