'use client';

import Link from 'next/link';
import { weeks } from '@/content/registry';
import { spanOf } from '@/lib/sim/age';
import type { WeekDef } from '@/lib/sim/types';
import { isWip } from './LandNav';
import { useVisitedAll } from './progress';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The topic links of the top bar. Each number opens a card on hover/focus with what the topic is
 * (title, span, its stages) and how far the student has got in it, so "01 02 03…" is never cryptic.
 */
export function WeekNav({ current, stageId }: { current: WeekDef; stageId?: string }) {
  const visited = useVisitedAll();
  return (
    <nav className="tb-weeks" aria-label="Gaiak">
      {weeks.map((w) => {
        const on = w.week === current.week;
        const wip = isWip(w);
        const seen = new Set(visited[w.week] ?? []);
        const done = w.stages.filter((s) => seen.has(s.id)).length;
        const span = spanOf(w);
        return (
          <Link
            key={w.week}
            href={`/astea/${w.week}`}
            className={`tb-week${on ? ' is-on' : ''}${wip ? ' is-wip' : ''}`}
            aria-label={`${w.week}. gaia: ${w.title} (${span.long})${wip ? ' · prestatzen' : ''}`}
            aria-current={on ? 'page' : undefined}
          >
            <span className="tb-week-n">{pad(w.week)}</span>
            <span className="tb-week-d">{span.short}</span>
            <span className="tb-week-card" aria-hidden>
              <span className="twc-k">
                {w.week}. gaia · {span.long}
                {on && <em>Hemen zaude</em>}
              </span>
              <b className="twc-t">{w.title}</b>
              {wip ? (
                <span className="twc-wip">Prestatzen</span>
              ) : (
                <>
                  <span className="twc-stages">
                    {w.stages.map((s) => (
                      <span key={s.id} className={on && s.id === stageId ? 'is-cur' : seen.has(s.id) ? 'is-seen' : undefined}>
                        {s.title}
                      </span>
                    ))}
                  </span>
                  <span className="twc-foot">
                    <span className="twc-bar" style={{ '--p': w.stages.length ? done / w.stages.length : 0 } as React.CSSProperties} />
                    {done ? `${done}/${w.stages.length} etapa ikusita` : `${w.stages.length} etapa`}
                  </span>
                </>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
