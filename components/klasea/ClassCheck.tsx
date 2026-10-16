'use client';

import { useState } from 'react';
import { recordAnswer } from '@/components/shell/answers';
import { POOL, imageId } from '@/content/pool';
import { nameOf } from '@/content/registry';
import type { BoardTable, Check, Lesson } from '@/lib/klasea/types';
import styles from './klasea.module.css';

/**
 * One check of the class, asked in the dock. Choice checks have a confidence switch ("Ez nago ziur"):
 * a right answer given unsure still comes back in the review. Predictions are never recorded; contrast
 * checks are pool questions; "Zer da hau?" counts for the structure's image competence; order and fill
 * only mark the chunk as one to review.
 */

/** A fixed shuffle per check (the right option is written first in the script). */
function order(n: number, seed: string): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i -= 1) {
    // murmur3's finaliser: every bit of the seed reaches the pick
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    const j = (h >>> 0) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export interface CheckProps {
  check: Check;
  lesson: Lesson;
  /** Answered: right or not, and whether it counts (predictions do not). */
  onAnswer: (ok: boolean, graded: boolean) => void;
  onContinue: () => void;
  /** Light structures in the scene (order chips, filled cells). */
  onLight: (ids: string[]) => void;
  answered: boolean;
}

export function ClassCheck(p: CheckProps) {
  const { check } = p;
  if (check.kind === 'predict') return <Choice {...p} kicker="Zer uste duzu?" q={check.q} options={check.options} answer={check.answer} why={check.why} seed={check.q} record={null} graded={false} />;
  if (check.kind === 'contrast') return <Choice {...p} kicker="Bereizi" q={check.q} options={check.options} answer={check.answer} why={check.why} seed={check.id} record={check.id} graded />;
  if (check.kind === 'pool') {
    const q = POOL.find((x) => x.id === check.id);
    if (!q) return null;
    return <Choice {...p} kicker="Galdera" q={q.question} options={q.options} answer={q.answer} why={q.why ?? q.options.map((_, k) => (k === q.answer ? q.explanation : ''))} seed={q.id} record={q.id} graded keepOrder />;
  }
  if (check.kind === 'zer-da-hau') {
    const right = check.options.indexOf(nameOf(check.structure));
    return (
      <Choice {...p} kicker="Zer da hau?" q="Argituta dagoen egitura: zein da?" options={check.options} answer={right} why={check.options.map((o, k) => (k === right ? `Bai: ${o}.` : `Ez: argituta dagoena ${nameOf(check.structure)} da.`))} seed={check.structure} record={imageId(check.structure)} graded />
    );
  }
  if (check.kind === 'order') return <Order {...p} check={check} />;
  if (check.kind === 'fill') return <Fill {...p} check={check} />;
  return null;
}

function Choice({ kicker, q, options, answer, why, seed, record, graded, keepOrder, onAnswer, onContinue, answered }: CheckProps & {
  kicker: string;
  q: string;
  options: string[];
  answer: number;
  why: string[];
  seed: string;
  record: string | null;
  graded: boolean;
  keepOrder?: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [unsure, setUnsure] = useState(false);
  const shown = keepOrder ? options.map((_, k) => k) : order(options.length, seed);
  const ok = picked === answer;
  return (
    <div className={styles.check} role="group" aria-label={kicker}>
      <div className={styles.checkTop}>
        <span className={styles.kicker}>{kicker}</span>
        {graded && picked === null && (
          <button className={`${styles.unsure}${unsure ? ` ${styles.on}` : ''}`} aria-pressed={unsure} onClick={() => setUnsure((u) => !u)} title="Asmatzen baduzu ere, errepasoan berriro aterako da">
            Ez nago ziur
          </button>
        )}
      </div>
      <p className="ask-q">{q}</p>
      <div className="ask-options">
        {shown.map((k, pos) => (
          <button
            key={k}
            disabled={picked !== null}
            className={picked === null ? '' : k === answer ? 'is-right' : k === picked ? 'is-wrong' : 'is-faded'}
            onClick={() => {
              setPicked(k);
              if (record) recordAnswer(record, k === answer, options[k], { unsure });
              onAnswer(k === answer, graded);
            }}
          >
            <span className="opt-letter">{String.fromCharCode(65 + pos)}</span>
            {options[k]}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={styles.checkFoot}>
          <p className={`ask-why${ok ? ' ok' : ' bad'}`}>
            <b>{!graded ? (ok ? 'Ondo asmatu duzu.' : 'Ikus dezagun.') : ok ? (unsure ? 'Bai! Errepasoan berriro aterako da.' : 'Bai!') : 'Ia.'}</b> {ok ? why[answer] : [why[picked], why[answer]].filter(Boolean).join(' ')}
          </p>
          {answered && (
            <button className="btn small primary" onClick={onContinue} autoFocus>
              Jarraitu <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Order({ check, onAnswer, onContinue, onLight, answered }: CheckProps & { check: Extract<Check, { kind: 'order' }> }) {
  const mixed = order(check.items.length, check.id);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const done = placed.length === check.items.length;
  const place = (k: number) => {
    if (done) return;
    if (k !== placed.length) {
      // Not the next one: it shakes, and the mistake counts.
      setWrong(k);
      setMisses((m) => m + 1);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    const next = [...placed, k];
    setPlaced(next);
    onLight(next.map((i) => check.items[i].structure));
    if (next.length === check.items.length) onAnswer(misses === 0, true);
  };
  return (
    <div className={styles.check} role="group" aria-label="Ordenatu">
      <div className={styles.checkTop}>
        <span className={styles.kicker}>Ordenatu</span>
      </div>
      <p className="ask-q">{check.q}</p>
      <ol className={styles.slots}>
        {check.items.map((it, i) => (
          <li key={it.label} className={i < placed.length ? styles.filled : ''}>
            <span>{i + 1}</span>
            {i < placed.length ? check.items[placed[i]].label : ''}
          </li>
        ))}
      </ol>
      <div className={styles.chips}>
        {mixed.map((k) =>
          placed.includes(k) ? null : (
            <button key={k} className={`${styles.chip}${wrong === k ? ` ${styles.shake}` : ''}`} onClick={() => place(k)}>
              {check.items[k].label}
            </button>
          ),
        )}
      </div>
      {done && (
        <div className={styles.checkFoot}>
          <p className={`ask-why${misses === 0 ? ' ok' : ' bad'}`}>
            <b>{misses === 0 ? 'Ezin hobeto!' : 'Ordena osatuta.'}</b> {misses === 0 ? 'Bide osoa ondo.' : `${misses} huts: zati hau errepasorako gordeko dut.`}
          </p>
          {answered && (
            <button className="btn small primary" onClick={onContinue} autoFocus>
              Jarraitu <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Fill({ check, lesson, onAnswer, onContinue, onLight, answered }: CheckProps & { check: Extract<Check, { kind: 'fill' }> }) {
  const table = lesson.chunks.flatMap((c) => c.board ?? []).find((b): b is BoardTable => b.id === check.table && b.kind === 'table');
  const rows = table?.rows.filter((r) => check.blanks.includes(r.id)) ?? [];
  const chips = order(rows.length, check.id).map((k) => rows[k]);
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const done = rows.length > 0 && rows.every((r) => filled[r.id]);
  if (!table) return null;
  const put = (rowId: string, chipId: string) => {
    if (filled[rowId]) return;
    if (rowId !== chipId) {
      setMisses((m) => m + 1);
      setWrong(rowId);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    const next = { ...filled, [rowId]: chipId };
    setFilled(next);
    setActive(null);
    const row = rows.find((r) => r.id === rowId)!;
    onLight(row.structures);
    if (rows.every((r) => next[r.id])) onAnswer(misses === 0, true);
  };
  return (
    <div className={styles.check} role="group" aria-label="Osatu taula">
      <div className={styles.checkTop}>
        <span className={styles.kicker}>Osatu taula, oroimenetik</span>
      </div>
      <p className="ask-q">Hautatu eratorri bat, eta gero bere atala.</p>
      <table className={styles.fill}>
        <tbody>
          {table.rows.map((r) => {
            const blank = check.blanks.includes(r.id);
            return (
              <tr key={r.id} className={`${blank && !filled[r.id] ? styles.blank : ''}${wrong === r.id ? ` ${styles.shake}` : ''}`}>
                <th scope="row">{r.cells[0]}</th>
                <td>
                  {!blank || filled[r.id] ? (
                    r.cells[1]
                  ) : (
                    <button className={styles.slot} disabled={!active} onClick={() => active && put(r.id, active)} aria-label={`${r.cells[0]}: hutsik`}>
                      {active ? 'Hemen?' : '…'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={styles.chips}>
        {chips.map((r) =>
          filled[r.id] ? null : (
            <button key={r.id} className={`${styles.chip}${active === r.id ? ` ${styles.on}` : ''}`} aria-pressed={active === r.id} onClick={() => setActive(active === r.id ? null : r.id)}>
              {r.cells[1]}
            </button>
          ),
        )}
      </div>
      {done && (
        <div className={styles.checkFoot}>
          <p className={`ask-why${misses === 0 ? ' ok' : ' bad'}`}>
            <b>{misses === 0 ? 'Taula osoa, hutsik gabe!' : 'Taula osatuta.'}</b> {misses ? `${misses} huts: laburpen-orrian duzu taula osoa.` : ''}
          </p>
          {answered && (
            <button className="btn small primary" onClick={onContinue} autoFocus>
              Jarraitu <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
