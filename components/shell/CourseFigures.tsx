'use client';

import { useEffect, useState } from 'react';
import styles from './CourseFigures.module.css';

const documents = [
  { title: 'Hezur-sistema', pages: 4 },
  { title: 'Muskulu-sistema', pages: 3 },
  { title: 'Enbriologia · muskulu-sistema', pages: 2 },
  { title: 'Enbriologia · hezur-sistema', pages: 4 },
  { title: 'Enbriologia · gorputz-barrunbeak', pages: 4 },
  { title: 'Enbriologia · liseri-aparatua', pages: 8 },
  { title: 'Enbriologia · zirkulazio-sistema', pages: 13 },
];
type Line = { text: string; x: number; y: number; w: number; h: number };
type Marks = Record<string, 1 | 2>;
const key = 'irudiak-pdf-marks-v1';

/** Join short, closely aligned OCR lines, such as “Hodi” / “neurala”. */
function groupLines(lines: Line[]): Line[] {
  const remaining = [...lines].sort((a, b) => a.y - b.y || a.x - b.x);
  const grouped: Line[] = [];
  while (remaining.length) {
    const first = remaining.shift()!;
    let result = { ...first };
    let last = first;
    for (let count = 1; count < 3 && result.text.length < 50; count++) {
      if (last.text.trim().split(/\s+/).length > 3) break;
      const index = remaining.findIndex(next => {
        const gap = next.y - (last.y + last.h);
        const height = Math.max(last.h, next.h);
        return gap >= 0 && gap <= height * 0.55 && Math.abs(next.x - last.x) <= 0.012 &&
          next.text.trim().split(/\s+/).length <= 3 && Math.abs(next.h - last.h) < height * 0.45;
      });
      if (index < 0) break;
      const next = remaining.splice(index, 1)[0];
      const x = Math.min(result.x, next.x);
      const right = Math.max(result.x + result.w, next.x + next.w);
      result = { text: `${result.text} ${next.text}`, x, y: result.y, w: right - x, h: next.y + next.h - result.y };
      last = next;
    }
    grouped.push(result);
  }
  return grouped;
}

export function CourseFigures() {
  const [doc, setDoc] = useState(0);
  const [page, setPage] = useState(1);
  const [pageLines, setPageLines] = useState<{ id: string; lines: Line[] }>({ id: '', lines: [] });
  const [marks, setMarks] = useState<Marks>(() => {
    try { return typeof window === 'undefined' ? {} : JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  });
  const [available, setAvailable] = useState(true);
  const id = `${doc + 1}-${page}`;

  useEffect(() => {
    let active = true;
    fetch(`/api/irudi-orriak/${id}.json`).then(r => {
      if (!r.ok) throw new Error('unavailable');
      return r.json();
    }).then(data => { if (active) { setPageLines({ id, lines: Array.isArray(data.lines) ? groupLines(data.lines) : [] }); setAvailable(true); } })
      .catch(() => { if (active) { setPageLines({ id, lines: [] }); setAvailable(false); } });
    return () => { active = false; };
  }, [id]);
  function mark(index: number) {
    const markId = `${id}-${index}`;
    setMarks(current => {
      const next = { ...current };
      if (!next[markId]) next[markId] = 1;
      else if (next[markId] === 1) next[markId] = 2;
      else delete next[markId];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }
  return <div className={styles.root}>
    <p>Irudietako izenak sakatu: <strong>gorria → laranja → kendu</strong>. Markak gailu honetan gordetzen dira.</p>
    <p className={styles.note}>Testua automatikoki detektatu da; baliteke izen batzuk ez antzematea. Irudiak ordenagailu honetan bakarrik daude.</p>
    <label htmlFor="figure-doc">Dokumentua</label>{' '}
    <select id="figure-doc" value={doc} onChange={e => { setDoc(Number(e.target.value)); setPage(1); }}>
      {documents.map((d, i) => <option key={d.title} value={i}>{d.title}</option>)}
    </select>
    <div className={styles.paging}>
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>← Aurrekoa</button>
      <span>{page} / {documents[doc].pages}</span>
      <button type="button" disabled={page === documents[doc].pages} onClick={() => setPage(page + 1)}>Hurrengoa →</button>
    </div>
    {available ? <div className={styles.figure}>
      {/* Source page is kept as an image so the original figure remains unchanged. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/irudi-orriak/${id}.jpg`} alt={`${documents[doc].title}, ${page}. orria`} />
      {(pageLines.id === id ? pageLines.lines : []).map((line, i) => <button key={i} type="button" className={`${styles.spot} ${marks[`${id}-${i}`] === 1 ? styles.red : marks[`${id}-${i}`] === 2 ? styles.orange : ''}`} style={{ left: `${line.x * 100}%`, top: `${line.y * 100}%`, width: `${line.w * 100}%`, height: `${line.h * 100}%` }} aria-label={`${line.text}: ${marks[`${id}-${i}`] === 1 ? 'gorria' : marks[`${id}-${i}`] === 2 ? 'laranja' : 'markatu gabe'}`} onClick={() => mark(i)} />)}
    </div> : <p>Irudi pribatuak ez daude eskuragarri ordenagailu honetan.</p>}
  </div>;
}
