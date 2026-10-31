'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { REFERENCE_TABLES } from '@/content/eratorriak/reference-tables';
import styles from './ReferenceTables.module.css';

const TOPICS = [
  [7, 'Barrunbeak'], [8, 'Hezurrak'], [9, 'Muskuluak'], [10, 'Bihotz hodia'],
  [11, 'Bihotz trenkadak'], [12, 'Arkuak eta aurpegia'], [13, 'Zainak'], [14, 'Digestio aparatua'],
] as const;
const ACCENTS = ['#81c7af', '#b6bd7a', '#c0b7ac', '#79b5c5', '#d6a06b', '#ac95cf'];
const normalize = (value: string) => value.toLocaleLowerCase('eu').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
type Hide = 'none' | 'derivative' | 'origin';
const HIDE_MODES: [Hide, string][] = [['none', 'Biak ikusi'], ['derivative', 'Eratorria ezkutatu'], ['origin', 'Jatorria ezkutatu']];

export function ReferenceTables() {
  const [topic, setTopic] = useState<number | null>(10);
  const [query, setQuery] = useState('');
  const [hide, setHide] = useState<Hide>('none');
  const hidden = hide !== 'none';
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const tables = REFERENCE_TABLES.filter((table) => topic === null || table.topic === topic)
    .map((table) => ({
      ...table,
      rows: table.rows.filter((row) => terms.every((term) => normalize(
        `${table.title} ${row.origin} ${row.derivative} ${row.note ?? ''}`,
      ).includes(term))),
    })).filter((table) => table.rows.length > 0);
  const rowCount = tables.reduce((sum, table) => sum + table.rows.length, 0);
  const resetRevealed = () => setRevealed(new Set());

  function clearFilters() {
    setQuery('');
    setTopic(null);
    resetRevealed();
  }

  return (
    <section className={`land-section ${styles.section}`} id="eratorriak-taulak" aria-labelledby="reference-tables-title">
      <div className="section-head">
        <p className="eyebrow">7.–14. gaiak · Taula laburrak</p>
        <h2 id="reference-tables-title">Jatorria eta eratorria, parez pare</h2>
        <p>Erlazionatu egiturak, bereizi antzeko izenak eta ikusi garapenean gertatzen diren aldaketak. Bilatu jatorriaren edo eratorriaren izenarekin.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.topics} role="group" aria-label="Taulen gaia">
          <button type="button" aria-pressed={topic === null} onClick={() => { setTopic(null); resetRevealed(); }}>Denak</button>
          {TOPICS.map(([number, label]) => (
            <button key={number} type="button" aria-pressed={topic === number} onClick={() => { setTopic(number); resetRevealed(); }}>
              <span>{number}</span> {label}
            </button>
          ))}
        </div>
        <div className={styles.tools}>
          <label className={styles.search}>
            <span>Bilatu taula guztietan</span>
            <input type="search" value={query} placeholder="Adib. arteria konoa, timoa, mesogastrioa…" onChange={(event) => {
              setQuery(event.target.value);
              setTopic(null);
              resetRevealed();
            }} />
          </label>
          <div className={styles.recall} role="group" aria-label="Proba modua">
            {HIDE_MODES.map(([mode, label]) => (
              <button key={mode} type="button" aria-pressed={hide === mode} onClick={() => { setHide(mode); resetRevealed(); }}>{label}</button>
            ))}
          </div>
        </div>
        <div className={styles.status}>
          <p role="status">{tables.length} taula · {rowCount} erlazio{topic !== null ? ` · ${topic}. gaia` : ' · gai guztiak'}</p>
          {(query || topic !== null) && <button type="button" onClick={clearFilters}>Iragazkiak garbitu</button>}
        </div>
        {hidden && <p className={styles.hint}>{hide === 'derivative' ? 'Zer sortzen da hemendik? Pentsatu eratorria' : 'Nondik sortzen da? Pentsatu jatorria'}, eta sakatu «Erakutsi» erlazio bakoitza ikusteko.</p>}
      </div>

      <div className={styles.tables}>
        {tables.map((table) => (
          <article key={table.id} className={styles.sheet} aria-labelledby={`reference-${table.id}`}>
            <header className={styles.sheetHead}>
              <span>{table.topic}. gaia</span>
              <h3 id={`reference-${table.id}`}>{table.title}</h3>
              {table.lead && <p>{table.lead}</p>}
            </header>
            <table className={styles.table} aria-labelledby={`reference-${table.id}`}>
              <thead><tr><th scope="col">{table.originHeading}</th><th scope="col">{table.derivativeHeading}</th></tr></thead>
              <tbody>
                {table.rows.map((row, index) => {
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
                        onClick={() => setRevealed((current) => {
                          const next = new Set(current);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        })}
                      >{visible ? 'Ezkutatu' : 'Erakutsi'} <span aria-hidden="true">{visible ? '−' : '+'}</span></button>
                      <div id={answerId} hidden={!visible} className={styles.answer}>{content}</div>
                    </>
                  );
                  return (
                    <tr key={row.id} style={{ '--row-accent': ACCENTS[index % ACCENTS.length] } as CSSProperties}>
                      <th scope="row">{hide === 'origin' ? reveal(origin) : origin}</th>
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
      {tables.length === 0 && <div className={styles.empty}><p>Ez dago bilaketa horrekin bat datorren erlaziorik.</p><button type="button" onClick={clearFilters}>Taula guztiak erakutsi</button></div>}
    </section>
  );
}
