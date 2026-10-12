'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { weeks } from '@/content/registry';
import { spanOf } from '@/lib/sim/age';
import type { WeekDef } from '@/lib/sim/types';
import { inPrep, isWip } from './LandNav';
import { useVisitedAll } from './progress';
import { IconCheck, IconChevron } from './icons';

/** The topic sheet is two columns that read down, then across (1–5 | 6–10; 11 topics: 1–6 | 7–11). */
const ROWS = Math.ceil(weeks.length / 2);

/**
 * The topic switcher of the top bar: the current topic by number and name (never a bare "03"), and
 * one click away, a sheet with every topic, its span, its stages and how far the student has got.
 * The sheet opens in place with no measuring (nothing jumps), takes the keyboard (arrows, Home/End,
 * Enter, Escape) and returns focus to the switcher when it closes.
 */
export function WeekNav({ current, stageId }: { current: WeekDef; stageId?: string }) {
  const visited = useVisitedAll();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const cur = new Set(visited[current.week] ?? []);
  const curDone = current.stages.filter((s) => cur.has(s.id)).length;

  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  };

  // The sheet owns its keys while open (the simulator's arrows and Space must not step the stage).
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    const items = Array.from(sheet.current?.querySelectorAll<HTMLElement>('.tsw-item') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, ArrowRight: ROWS, ArrowLeft: -ROWS };
    let to = -1;
    if (e.key in move) to = Math.min(items.length - 1, Math.max(0, (at < 0 ? 0 : at) + move[e.key]));
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = items.length - 1;
    if (to >= 0) {
      e.preventDefault();
      items[to]?.focus();
    }
    if (e.key !== 'Tab') e.stopPropagation();
  };

  return (
    <div className={`tsw${open ? ' is-open' : ''}`} ref={root} data-tour="gaiak">
      <button
        ref={btn}
        className="tsw-btn"
        data-tour="gaia-hautatu"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Gaia: ${current.week}. ${current.title}. Gaiak aldatu`}
        data-tip={open ? undefined : 'Gaiak: guztiak, beren etapekin'}
        data-tip-pos="bottom"
      >
        <span className="tsw-n">{current.week}</span>
        <span className="tsw-t">{current.title}</span>
        <IconChevron size={14} className="tsw-caret" />
      </button>
      {open && (
        <div className="tsw-sheet" ref={sheet} role="dialog" aria-label="Gaiak" onKeyDown={onKey}>
          <div className="tsw-head">
            <p className="kicker">Gaiak · garapenaren ordenan</p>
            <span className="tsw-here">
              Hemen: <b>{current.week}. gaia</b> · {curDone}/{current.stages.length} etapa ikusita
            </span>
          </div>
          <TopicList current={current} stageId={stageId} visited={visited} onPick={() => close(false)} />
        </div>
      )}
    </div>
  );
}

/** Every topic, in order: number, name, span, where the student is and how far they have got. */
export function TopicList({ current, stageId, visited, onPick }: { current: WeekDef; stageId?: string; visited: Record<number, string[] | undefined>; onPick?: () => void }) {
  return (
      <nav aria-label="Gaiak">
        <ol className="tsw-grid" style={{ '--rows': ROWS } as CSSProperties}>
          {weeks.map((w) => {
            const on = w.week === current.week;
            const wip = isWip(w);
            const prep = inPrep(w);
            const seen = new Set(visited[w.week] ?? []);
            const done = w.stages.filter((s) => seen.has(s.id)).length;
            const span = spanOf(w);
            const now = on ? w.stages.find((s) => s.id === stageId) : undefined;
            return (
              <li key={w.week}>
                <Link
                  href={`/astea/${w.week}`}
                  className={`tsw-item${on ? ' is-on' : ''}${wip ? ' is-wip' : ''}${done === w.stages.length && done > 0 ? ' is-done' : ''}`}
                  aria-current={on ? 'page' : undefined}
                  aria-label={`${w.week}. gaia: ${w.title} (${span.long})${prep ? ' · prestatzen' : ''}${wip ? '' : ` · ${done}/${w.stages.length} etapa ikusita`}`}
                  onClick={onPick}
                  title={w.subtitle}
                >
                  <span className="tsw-item-n">{w.week}</span>
                  <span className="tsw-item-body">
                    <b>{w.title}</b>
                    <span className="tsw-item-meta">
                      {span.long}
                      {now ? <em className="is-here">Hemen zaude · {now.title}</em> : prep ? <em className="is-prep">Prestatzen</em> : null}
                    </span>
                  </span>
                  {!wip && (
                    <span className="tsw-item-prog" aria-hidden>
                      {done === w.stages.length && done > 0 ? (
                        <IconCheck size={13} />
                      ) : (
                        <>
                          <span className="tsw-bar" style={{ '--p': w.stages.length ? done / w.stages.length : 0 } as CSSProperties} />
                          <small>
                            {done}/{w.stages.length}
                          </small>
                        </>
                      )}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
  );
}
