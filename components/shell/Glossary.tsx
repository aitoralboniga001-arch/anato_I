'use client';

import { useMemo, useState } from 'react';
import { appearances, structures } from '@/content/registry';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import { IconClose, IconSearch } from './icons';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

interface GlossaryProps {
  onClose: () => void;
  onPick: (id: string) => void;
}

/** Searchable list of every structure across the four weeks. */
export function Glossary({ onClose, onPick }: GlossaryProps) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const all = [...structures.values()].sort((a, b) => a.name.localeCompare(b.name, 'eu'));
    if (!q.trim()) return all;
    const n = norm(q);
    return all.filter((s) => [s.name, s.es ?? '', ...(s.aka ?? []), s.definition].some((x) => norm(x).includes(n)));
  }, [q]);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      {/* Escape closes it like every other window, even while typing in its search box. */}
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
        aria-label="Glosarioa"
      >
        <header className="drawer-head">
          <div>
            <p className="eyebrow">Glosarioa</p>
            <h2>{structures.size} egitura eta kontzeptu</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Itxi">
            <IconClose />
          </button>
        </header>
        <label className="search">
          <IconSearch size={16} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bilatu (euskaraz edo gaztelaniaz)…" />
        </label>
        <ul className="gloss-list">
          {list.map((s) => {
            const first = appearances.get(s.id)?.[0];
            return (
              <li key={s.id}>
                <button onClick={() => onPick(s.id)}>
                  <i style={{ background: s.color ?? categoryColor[s.category] }} />
                  <span className="gloss-main">
                    <strong>{s.name}</strong>
                    <span className="gloss-def">{s.definition}</span>
                  </span>
                  <span className="gloss-meta">
                    {categoryLabel[s.category]}
                    {first && (
                      <>
                        <br />
                        {first.week.week}. gaia · {first.stage.day}
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          {list.length === 0 && <li className="muted">Ez da ezer aurkitu.</li>}
        </ul>
      </aside>
    </div>
  );
}
