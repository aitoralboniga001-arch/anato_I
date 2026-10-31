'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  ARCH_GRID, ARCH_SYSTEMS, ARCH_TABLE_IDS, REFERENCE_TABLES,
  type ReferenceLevel, type ReferenceTable,
} from '@/content/eratorriak/reference-tables';
import styles from './ReferenceTables.module.css';

type View = number | 'arkuak' | null;
const TOPICS = [
  [7, 'Barrunbeak'], [8, 'Hezurrak'], [9, 'Muskuluak'], [10, 'Bihotz hodia'],
  [11, 'Trenkadak'], [12, 'Arkuak'], [13, 'Zainak'], [14, 'Digestioa'],
] as const;
const LEVELS: { level: ReferenceLevel; label: string; color: string }[] = [
  { level: 1, label: 'Funtsezkoa', color: '#f0876a' },
  { level: 2, label: 'Garrantzitsua', color: '#e2c065' },
  { level: 3, label: 'Osagarria', color: '#7f97ba' },
];
const levelColor = (level: ReferenceLevel) => LEVELS[level - 1].color;
const normalize = (value: string) => value.toLocaleLowerCase('eu').normalize('NFD').replace(/[̀-ͯ]/g, '');
type Hide = 'none' | 'derivative' | 'origin';
const ASK_MODES: [Exclude<Hide, 'none'>, string][] = [['derivative', 'Eratorria'], ['origin', 'Jatorria']];

/** More essential rows first; the table with more of them comes first. */
const weight = (table: ReferenceTable) => table.rows.reduce((sum, row) => sum + (row.level === 1 ? 100 : row.level === 2 ? 1 : 0), 0);

export function ReferenceTables() {
  const [view, setView] = useState<View>('arkuak');
  const [query, setQuery] = useState('');
  const [quiz, setQuiz] = useState(false);
  const [ask, setAsk] = useState<Exclude<Hide, 'none'>>('derivative');
  const hide: Hide = quiz ? ask : 'none';
  const [levels, setLevels] = useState<ReadonlySet<ReferenceLevel>>(new Set([1, 2, 3]));
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const hidden = hide !== 'none';
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const inView = REFERENCE_TABLES.filter((table) => view === null
    || (view === 'arkuak' ? ARCH_TABLE_IDS.includes(table.id) : table.topic === view));
  const matching = inView.map((table) => ({
    ...table,
    rows: table.rows.filter((row) => terms.every((term) => normalize(
      `${table.title} ${row.origin} ${row.derivative} ${row.note ?? ''}`,
    ).includes(term))),
  }));
  const counts = LEVELS.map(({ level }) => matching.reduce((sum, table) => sum + table.rows.filter((row) => row.level === level).length, 0));
  const tables = matching
    .map((table) => ({ ...table, rows: table.rows.filter((row) => levels.has(row.level)).sort((a, b) => a.level - b.level) }))
    .filter((table) => table.rows.length > 0)
    .sort((a, b) => (view === null ? a.topic - b.topic : 0) || weight(b) - weight(a));
  const rowCount = tables.reduce((sum, table) => sum + table.rows.length, 0);
  const showGrid = terms.length === 0 && (view === 'arkuak' || view === 12 || view === 9 || view === null);
  const resetRevealed = () => setRevealed(new Set());
  const toggleRevealed = (key: string) => setRevealed((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  function pick(next: View) {
    setView(next);
    resetRevealed();
  }

  function toggleLevel(level: ReferenceLevel) {
    setLevels((current) => {
      const next = new Set(current);
      if (next.has(level) && next.size > 1) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  function clearFilters() {
    setQuery('');
    setView(null);
    setLevels(new Set([1, 2, 3]));
    resetRevealed();
  }

  return (
    <section className={`land-section ${styles.section}`} id="eratorriak-taulak" aria-labelledby="reference-tables-title">
      <div className="section-head">
        <p className="eyebrow">7.–14. gaiak</p>
        <h2 id="reference-tables-title">Taula laburrak</h2>
        <p>Jatorria eta eratorria parez pare. Garrantzitsuenak lehenengo, kolorez markatuta.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.topics} role="group" aria-label="Taulen gaia">
          <button type="button" className={styles.featured} aria-pressed={view === 'arkuak'} onClick={() => pick('arkuak')}>
            <span aria-hidden="true">★</span> Arku sistemak
          </button>
          {TOPICS.map(([number, label]) => (
            <button key={number} type="button" aria-pressed={view === number} onClick={() => pick(number)}>
              <span>{number}</span> {label}
            </button>
          ))}
          <button type="button" aria-pressed={view === null} onClick={() => pick(null)}>Denak</button>
        </div>
        <div className={styles.tools}>
          <input
            type="search"
            className={styles.search}
            aria-label="Bilatu taula guztietan"
            value={query}
            placeholder="Bilatu: timoa, arteria konoa…"
            onChange={(event) => {
              setQuery(event.target.value);
              setView(null);
              resetRevealed();
            }}
          />
          <div className={styles.legend} role="group" aria-label="Garrantzia">
            {LEVELS.map(({ level, label, color }, index) => (
              <button key={level} type="button" aria-pressed={levels.has(level)} style={{ '--level': color } as CSSProperties} onClick={() => { toggleLevel(level); resetRevealed(); }}>
                <i aria-hidden="true" />{label} <span>{counts[index]}</span>
              </button>
            ))}
          </div>
          <button type="button" className={`mg-quiz${quiz ? ' is-on' : ''}`} aria-pressed={quiz} onClick={() => { setQuiz(!quiz); resetRevealed(); }}>
            <i aria-hidden="true" />
            <span>Proba modua</span>
          </button>
        </div>
        {(quiz || query || levels.size < 3) && (
          <div className={styles.status}>
            {quiz && (
              <div className={styles.ask} role="group" aria-label="Zer ezkutatu">
                <span>Ezkutatu:</span>
                {ASK_MODES.map(([mode, label]) => (
                  <button key={mode} type="button" aria-pressed={ask === mode} onClick={() => { setAsk(mode); resetRevealed(); }}>{label}</button>
                ))}
              </div>
            )}
            {(query || levels.size < 3) && <button type="button" className={styles.clear} onClick={clearFilters}>Iragazkiak garbitu</button>}
          </div>
        )}
        <p role="status" className={styles.srOnly}>{tables.length} taula, {rowCount} erlazio</p>
      </div>

      <div className={styles.tables}>
        {showGrid && (
          <ArchGrid hidden={hidden} levels={levels} revealed={revealed} onToggle={toggleRevealed} />
        )}
        {tables.map((table) => (
          <article key={table.id} className={styles.sheet} aria-labelledby={`reference-${table.id}`}>
            <header className={styles.sheetHead}>
              {typeof view !== 'number' && <span>{table.topic}. gaia</span>}
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
      {tables.length === 0 && !showGrid && <div className={styles.empty}><p>Ez dago bilaketa horrekin bat datorren erlaziorik.</p><button type="button" onClick={clearFilters}>Taula guztiak erakutsi</button></div>}
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
        <span>8., 9. eta 12. gaiak</span>
        <h3 id="reference-arku-sistemak">Arku sistemak</h3>
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
