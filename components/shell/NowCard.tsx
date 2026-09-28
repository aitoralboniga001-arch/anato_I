'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LIFE, MILESTONES, TIMELINE_IDS, dayLabel, periodOf, presenceAt, weekOfDay, type Presence } from '@/content/chronology';
import { structures } from '@/content/registry';
import { categoryColor } from '@/lib/sim/palette';

export const PRESENCE_GROUPS: { key: Presence; title: string; hint: string }[] = [
  { key: 'berria', title: 'Berria', hint: 'Azken egunetan agertu da' },
  { key: 'badago', title: 'Orain dago', hint: 'Lehendik dago' },
  { key: 'desagertua', title: 'Jada desagertu / eraldatu', hint: 'Jada ez dago horrela' },
  { key: 'oraindik-ez', title: 'Oraindik ez dago', hint: 'Hurrengoak' },
];

/**
 * "Zer dago orain?" for the simulator's current moment: the temporal context behind the context bar
 * (period, week, the date milestones around it, and what is new / there / gone / still to come).
 */
export function NowCard({ day, stageDays, onPick, onClose }: { day: number; stageDays: string; onPick: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest?.('.day-chip')) onClose();
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [onClose]);

  const d = Math.round(day);
  const groups = new Map<Presence, string[]>(PRESENCE_GROUPS.map((g) => [g.key, []]));
  for (const id of TIMELINE_IDS) {
    const p = presenceAt(id, d, 3);
    if (p) groups.get(p)!.push(id);
  }
  groups.get('desagertua')!.sort((a, b) => (LIFE[b].to ?? 0) - (LIFE[a].to ?? 0));
  const limits: Record<Presence, number> = { berria: 8, badago: 10, desagertua: 6, 'oraindik-ez': 6 };
  const period = periodOf(d);
  const before = [...MILESTONES].reverse().find((m) => m.day <= d);
  const after = MILESTONES.find((m) => m.day > d && m.weight !== 'xehetasuna');

  return (
    <div className="now-card" ref={ref} role="dialog" aria-label="Zer dago orain?">
      <header>
        <div>
          <p className="kicker">Zer dago orain?</p>
          <h3>
            {d <= 56 ? `${d}. eguna` : `${weekOfDay(d)}. astea`} · {weekOfDay(d)}. astea · {period.name}
          </h3>
          <p className="now-note">
            Etapa honek {stageDays} hartzen ditu. {period.note}
          </p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Itxi">
          ×
        </button>
      </header>
      <ol className="now-miles">
        {before && (
          <li>
            <span>{dayLabel(before.day, before.to)}</span> {before.short} <em>(azkena)</em>
          </li>
        )}
        {after && (
          <li className="is-next">
            <span>{dayLabel(after.day, after.to)}</span> {after.short} <em>(hurrengoa)</em>
          </li>
        )}
      </ol>
      <div className="now-grid">
        {PRESENCE_GROUPS.map((g) => {
          const ids = groups.get(g.key)!;
          return (
            <section key={g.key} className={`now-group is-${g.key}`}>
              <h4 title={g.hint}>
                {g.title} <small>{ids.length}</small>
              </h4>
              <div className="now-chips">
                {ids.slice(0, limits[g.key]).map((id) => {
                  const s = structures.get(id)!;
                  const l = LIFE[id];
                  const sub = g.key === 'desagertua' && l.becomes?.length ? `→ ${l.becomes.map((b) => structures.get(b)?.name ?? b).join(', ')}` : g.key === 'oraindik-ez' ? dayLabel(l.from) : undefined;
                  return (
                    <button key={id} className="ln-chip" onClick={() => onPick(id)} title={l.note ?? s.definition}>
                      <i style={{ background: s.color ?? categoryColor[s.category] }} />
                      <span>{s.name}</span>
                      {sub && <em>{sub}</em>}
                    </button>
                  );
                })}
                {ids.length === 0 && <span className="now-empty">—</span>}
              </div>
            </section>
          );
        })}
      </div>
      <footer>
        <small>Egunak apunteetakoak dira; «≈» = gutxi gorabehera.</small>
        <Link className="btn small ghost" href={`/kronologia?eguna=${d}`}>
          Kronologia osoa →
        </Link>
      </footer>
    </div>
  );
}
