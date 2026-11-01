'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { gridSchemesFor, type GridCell, type GridScheme } from '@/content/eratorriak/grid-schemes';
import styles from './GridSchemes.module.css';

/** A placed cell: its grid position and the rows it covers. */
interface Placed {
  cell: GridCell;
  row: number;
  col: number;
  span: number;
  cols: number;
  tags: Set<string>;
}

function place(scheme: GridScheme): Placed[] {
  const out: Placed[] = [];
  scheme.rows.forEach((row, r) =>
    row.cells.forEach((cell, col) => {
      if (!cell) return;
      const span = cell.span ?? 1;
      const tags = new Set(scheme.rows.slice(r, r + span).flatMap((x) => x.tags ?? []));
      out.push({ cell, row: r, col, span, cols: cell.cols ?? 1, tags });
    }),
  );
  return out;
}

/** Rows [from, to) that light up together. */
type Range = [number, number];
const overlaps = (p: Placed, range: Range | null) => !!range && p.row < range[1] && p.row + p.span > range[0];

function Grid({ scheme }: { scheme: GridScheme }) {
  const cells = useMemo(() => place(scheme), [scheme]);
  const [focus, setFocus] = useState<Range | null>(null);
  const [pinned, setPinned] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [hide, setHide] = useState<number | null>(null);
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const hiddenTotal = hide === null ? 0 : cells.filter((p) => p.col === hide).length;
  const hiddenLeft = hide === null ? 0 : cells.filter((p) => p.col === hide && !shown.has(`${p.row}-${p.col}`)).length;
  const template = scheme.columns.map((c) => `minmax(${scheme.path ? 116 : 104}px, ${c.w ?? 1}fr)`).join(' ');

  const enter = (p: Placed) => !pinned && setFocus([p.row, p.row + p.span]);
  const tap = (p: Placed, key: string, hidden: boolean) => {
    if (hidden) {
      setShown((s) => new Set(s).add(key));
      return;
    }
    const same = focus && focus[0] === p.row && focus[1] === p.row + p.span;
    if (pinned && same) {
      setPinned(false);
      setFocus(null);
    } else {
      setPinned(true);
      setFocus([p.row, p.row + p.span]);
    }
  };

  return (
    <article className={`${styles.scheme}${scheme.optional ? ` ${styles.optional}` : ''}`} id={`eskema-int-${scheme.id}`}>
      <header className={styles.schemeHead}>
        <div>
          <p className={styles.section}>
            Apunteak · {scheme.section}
            {scheme.optional && <span className={styles.optTag}>ez da jakin beharra</span>}
          </p>
          <h3>{scheme.title}</h3>
          {scheme.lead && <p className={styles.lead}>{scheme.lead}</p>}
        </div>
        {scheme.stage && (
          <Link className={styles.open} href={`/astea/${scheme.week}?etapa=${scheme.stage}`}>
            Simulagailuan <span aria-hidden>→</span>
          </Link>
        )}
      </header>

      <div className={styles.tools}>
        {scheme.filters && (
          <div className={styles.filters} role="group" aria-label="Errenkadak iragazi">
            <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>
              Denak
            </button>
            {scheme.filters.map((f) => (
              <button key={f.tag} type="button" data-tone={f.tone} aria-pressed={filter === f.tag} onClick={() => setFilter(filter === f.tag ? null : f.tag)}>
                {f.tone && <i aria-hidden />}
                {f.label}
              </button>
            ))}
          </div>
        )}
        <label className={styles.quiz}>
          <span>Proba: ezkutatu</span>
          <select
            value={hide ?? ''}
            onChange={(e) => {
              setHide(e.target.value === '' ? null : +e.target.value);
              setShown(new Set());
            }}
          >
            <option value="">ezer ez</option>
            {scheme.columns.map((c, i) => (
              <option key={i} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {hide !== null && (
          <p className={styles.count} aria-live="polite">
            <span>
              {hiddenTotal - hiddenLeft} / {hiddenTotal}
            </span>
            <button type="button" onClick={() => setShown(new Set(cells.filter((p) => p.col === hide).map((p) => `${p.row}-${p.col}`)))}>
              Erakutsi denak
            </button>
            {shown.size > 0 && (
              <button type="button" onClick={() => setShown(new Set())}>
                Berriro
              </button>
            )}
          </p>
        )}
      </div>

      <div className={styles.scroll}>
        <div
          className={`${styles.grid}${scheme.path ? ` ${styles.isPath}` : ''}`}
          style={{ gridTemplateColumns: template }}
          onMouseLeave={() => !pinned && setFocus(null)}
        >
          {scheme.columns.map((c, i) => (
            <div key={`h${i}`} className={styles.colHead} data-tone={c.tone} style={{ gridColumn: i + 1, gridRow: 1 }}>
              <i aria-hidden />
              {c.label}
            </div>
          ))}
          {cells.map((p) => {
            const key = `${p.row}-${p.col}`;
            const hidden = hide === p.col && !shown.has(key);
            const on = overlaps(p, focus);
            const dim = (filter !== null && !p.tags.has(filter)) || (!!focus && !on);
            const cls = [
              styles.cell,
              scheme.path && p.col > 0 ? styles.arrow : '',
              p.cell.gone ? styles.gone : '',
              p.cols > 1 ? styles.wide : '',
              p.cell.move ? styles.move : '',
              on ? styles.on : '',
              dim ? styles.dim : '',
              hidden ? styles.hidden : '',
            ].join(' ');
            const style: CSSProperties = { gridColumn: `${p.col + 1} / span ${p.cols}`, gridRow: `${p.row + 2} / span ${p.span}` };
            return (
              <button
                key={key}
                type="button"
                className={cls}
                data-tone={p.cell.tone ?? scheme.columns[p.col].tone}
                style={style}
                aria-label={hidden ? `${scheme.columns[p.col].label}: erakutsi erantzuna` : undefined}
                aria-pressed={!hidden && pinned ? on : undefined}
                onMouseEnter={() => enter(p)}
                onFocus={() => enter(p)}
                onClick={() => tap(p, key, hidden)}
              >
                {hidden ? (
                  <span className={styles.ask}>?</span>
                ) : (
                  <>
                    <span className={styles.text}>{p.cell.text}</span>
                    {p.cell.note && <em className={styles.note}>{p.cell.note}</em>}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {(scheme.pitfalls?.length || scheme.links?.length) && (
        <footer className={styles.foot}>
          {scheme.pitfalls?.length ? (
            <div className={styles.kontuz}>
              <b>Kontuz</b>
              <ul>
                {scheme.pitfalls.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {scheme.links?.length ? (
            <ul className={styles.links}>
              {scheme.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>
                    {l.label} <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </footer>
      )}
    </article>
  );
}

/**
 * Integrated schemes for a topic: each grid puts origin, place, structure and nerve (or artery piece) on one
 * row, in the notes' order. Hover or tap a cell to light its whole path; a row filter narrows to one group;
 * hiding a column turns the grid into a self-test.
 */
export function GridSchemes({ week }: { week: number }) {
  const schemes = useMemo(() => gridSchemesFor(week), [week]);
  if (!schemes.length) return null;
  const go = (id: string) => document.getElementById(`eskema-int-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <section className={styles.root} aria-label="Eskema integratuak">
      <header className={styles.head}>
        <h3>Eskema integratuak</h3>
        <p>
          Apunteen ordenan, gai bakoitzaren bideak eskema bakarrean. Pasatu sagua edo sakatu lauki bat haren bide osoa argitzeko; ezkutatu zutabe bat zeure burua probatzeko.
        </p>
        <nav className={styles.toc} aria-label="Eskemen aurkibidea">
          {schemes.map((s) => (
            <button key={s.id} type="button" onClick={() => go(s.id)}>
              <span>{s.section}</span>
              {s.title.split(':')[0]}
            </button>
          ))}
        </nav>
      </header>
      {schemes.map((s) => (
        <Grid key={s.id} scheme={s} />
      ))}
    </section>
  );
}

export const hasGridSchemes = (week: number) => gridSchemesFor(week).length > 0;
