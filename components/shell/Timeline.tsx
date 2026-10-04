'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LIFE, MILESTONES, PERIODS, TIMELINE_IDS, dayLabel, dayToX, firstSeenOf, periodOf, presenceAt, weekOfDay, xToDay, type Presence } from '@/content/chronology';
import { structures } from '@/content/registry';
import { categoryColor } from '@/lib/sim/palette';
import { LandFoot, LandNav } from './LandNav';
import { PRESENCE_GROUPS } from './NowCard';

const TICKS = [0, 7, 14, 21, 28, 35, 42, 56, 84, 140, 266];
/** Tick labels that crowd their neighbour on narrower rulers (12 weeks sits right after day 56). */
const MINOR_TICKS = [84];
const tickLabel = (d: number) => (d === 266 ? 'jaiotza' : d <= 56 ? String(d) : `${d / 7}. a.`);

const GROUPS = PRESENCE_GROUPS;

const subscribeNothing = () => () => {};

function Chip({ id, sub }: { id: string; sub?: string }) {
  const s = structures.get(id);
  if (!s) return null;
  const f = firstSeenOf(id);
  const body = (
    <>
      <i style={{ background: s.color ?? categoryColor[s.category] }} />
      <span>{s.name}</span>
      {sub && <em>{sub}</em>}
    </>
  );
  return f ? (
    <Link className="ln-chip" href={`/astea/${f.week}?etapa=${f.stage}&egitura=${id}`} title={s.definition}>
      {body}
    </Link>
  ) : (
    <span className="ln-chip is-plain">{body}</span>
  );
}

/**
 * Chronology: one ruler for the whole of development and, for the chosen day, what is there, what is
 * new, what has gone (or turned into something else) and what has not appeared yet.
 */
export function Timeline() {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [day, setDay] = useState(14);
  const [linked, setLinked] = useState(false);
  if (hydrated && !linked) {
    setLinked(true);
    const d = Number(new URLSearchParams(window.location.search).get('eguna'));
    if (d >= 0 && d <= 266 && new URLSearchParams(window.location.search).has('eguna')) setDay(Math.round(d));
  }
  useEffect(() => {
    if (!linked) return;
    const url = new URL(window.location.href);
    url.searchParams.set('eguna', String(day));
    window.history.replaceState(null, '', url);
  }, [day, linked]);

  const ruler = useRef<HTMLDivElement>(null);
  const dayAt = (clientX: number) => {
    const r = ruler.current!.getBoundingClientRect();
    return Math.round(xToDay(Math.min(1, Math.max(0, (clientX - r.left) / r.width))));
  };
  const nudge = (delta: number) => setDay((d) => Math.min(266, Math.max(0, d + delta)));

  const groups = new Map<Presence, string[]>(GROUPS.map((g) => [g.key, []]));
  for (const id of TIMELINE_IDS) {
    const p = presenceAt(id, day);
    if (p) groups.get(p)!.push(id);
  }
  groups.set('oraindik-ez', groups.get('oraindik-ez')!.slice(0, 10));
  // Most recently gone first: that is what the day just changed.
  groups.get('desagertua')!.sort((a, b) => (LIFE[b].to ?? 0) - (LIFE[a].to ?? 0));
  const period = periodOf(day);
  const lastMilestone = [...MILESTONES].reverse().find((m) => m.day <= day);

  return (
    <div className="landing">
      <LandNav />
      <section className="ln-hero kr-hero">
        <p className="eyebrow">Kronologia</p>
        <h1>Zer dago orain?</h1>
        <p className="hero-lead">
          Aukeratu garapenaren egun bat: zer dagoen, zer den berria, zer desagertu edo bihurtu den eta zer ez den oraindik agertu. Azterketako «zein egunetan?» eta «zer EZ da X. astean gertatzen?» galderak hemen ebazten dira.
        </p>
      </section>

      <section className="kr">
        <div className="kr-now">
          <div>
            <p className="kicker">Garapenaren eguna (ernalkuntzatik)</p>
            <p className="kr-day">
              {day <= 56 ? (
                <>
                  {day}
                  <small>. eguna</small>
                </>
              ) : (
                <>
                  {weekOfDay(day)}
                  <small>. astea</small>
                </>
              )}
            </p>
            <p className="kr-meta">
              {weekOfDay(day)}. astea · <b>{period.name}</b>
              {day > 0 && ` · ${day} egun`}
            </p>
          </div>
          <div className="kr-steps" role="group" aria-label="Eguna aldatu">
            <button className="btn small ghost" onClick={() => nudge(-7)} aria-label="Aste bat atzera">
              −7
            </button>
            <button className="btn small ghost" onClick={() => nudge(-1)} aria-label="Egun bat atzera">
              −1
            </button>
            <button className="btn small ghost" onClick={() => nudge(1)} aria-label="Egun bat aurrera">
              +1
            </button>
            <button className="btn small ghost" onClick={() => nudge(7)} aria-label="Aste bat aurrera">
              +7
            </button>
          </div>
        </div>

        <div
          className="kr-ruler"
          ref={ruler}
          role="slider"
          tabIndex={0}
          aria-label="Garapenaren eguna"
          aria-valuemin={0}
          aria-valuemax={266}
          aria-valuenow={day}
          aria-valuetext={dayLabel(day)}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            setDay(dayAt(e.clientX));
          }}
          onPointerMove={(e) => {
            if (e.buttons & 1) setDay(dayAt(e.clientX));
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') nudge(e.shiftKey ? 7 : 1);
            else if (e.key === 'ArrowLeft') nudge(e.shiftKey ? -7 : -1);
            else return;
            e.preventDefault();
          }}
        >
          <div className="kr-bands">
            {PERIODS.map((p) => (
              <span key={p.id} className={`kr-band${p.id === period.id ? ' is-on' : ''}`} style={{ left: `${dayToX(p.from) * 100}%`, width: `${(dayToX(p.to) - dayToX(p.from)) * 100}%` }} title={p.note}>
                {p.name}
              </span>
            ))}
          </div>
          <div className="kr-track">
            {MILESTONES.map((m, k) => (
              <i key={k} className={`kr-mile is-${m.weight}${m.day <= day ? ' is-past' : ''}`} style={{ left: `${dayToX(m.day) * 100}%` }} />
            ))}
            <span className="kr-fill" style={{ width: `${dayToX(day) * 100}%` }} />
            <span className="kr-head" style={{ left: `${dayToX(day) * 100}%` }} />
          </div>
          <div className="kr-ticks" aria-hidden>
            {TICKS.map((d) => (
              <small key={d} className={MINOR_TICKS.includes(d) ? 'is-minor' : undefined} style={{ left: `${dayToX(d) * 100}%` }}>
                {tickLabel(d)}
              </small>
            ))}
          </div>
        </div>

        {/* Key dates as markers under the ruler: each jumps the ruler to its day. */}
        <div className="kr-marks" role="group" aria-label="Gako-datak">
          {MILESTONES.filter((m) => m.weight === 'gakoa').map((m) => (
            <button
              key={`${m.day}-${m.short}`}
              className={`kr-mark${lastMilestone === m ? ' is-on' : ''}`}
              style={{ left: `${dayToX(m.day) * 100}%` }}
              onClick={() => setDay(m.day)}
              aria-label={`${dayLabel(m.day, m.to)}: ${m.short}`}
              data-tip={`${dayLabel(m.day, m.to)} · ${m.short}`}
              data-tip-pos="bottom"
            />
          ))}
        </div>

        {lastMilestone && (
          <p className="kr-last">
            <span>{dayLabel(lastMilestone.day, lastMilestone.to)}</span> {lastMilestone.text}
            <Link className="kr-last-go" href={`/astea/${lastMilestone.week}?etapa=${lastMilestone.stage}`}>
              Simulagailuan ikusi <span aria-hidden>→</span>
            </Link>
          </p>
        )}

        <div className="kr-grid">
          {GROUPS.map((g) => {
            const ids = groups.get(g.key)!;
            return (
              <section key={g.key} className={`kr-group is-${g.key}`}>
                <header>
                  <h2>{g.title}</h2>
                  <small>
                    {g.hint} · {ids.length}
                  </small>
                </header>
                {ids.length ? (
                  <div className="kr-chips">
                    {ids.map((id) => {
                      const l = LIFE[id];
                      const sub =
                        g.key === 'desagertua' && l.becomes?.length
                          ? `→ ${l.becomes.map((b) => structures.get(b)?.name ?? b).join(', ')}`
                          : g.key === 'oraindik-ez'
                            ? dayLabel(l.from)
                            : g.key === 'berria'
                              ? dayLabel(l.from)
                              : undefined;
                      return <Chip key={id} id={id} sub={sub} />;
                    })}
                  </div>
                ) : (
                  <p className="muted">—</p>
                )}
              </section>
            );
          })}
        </div>
      </section>

      <section className="land-section kr-list">
        <div className="section-head">
          <p className="eyebrow">Mugarriak</p>
          <h2>Egunez egun</h2>
          <p>Azterketan behin eta berriz galdetzen diren datak. Klikatu bat erregelan kokatzeko; «Ikusi» sakatuta, simulagailuan irekitzen da.</p>
        </div>
        <ol className="kr-miles">
          {MILESTONES.map((m, k) => (
            <li key={k} className={`${m.day <= day && (!MILESTONES[k + 1] || MILESTONES[k + 1].day > day) ? 'is-now' : ''} is-${m.weight}`}>
              <button className="kr-mile-day" onClick={() => setDay(m.day)}>
                {dayLabel(m.day, m.to)}
              </button>
              <p>
                {m.text}
                {m.weight === 'gakoa' && <em className="kr-key">Gakoa</em>}
              </p>
              <Link className="link-quiet" href={`/astea/${m.week}?etapa=${m.stage}`}>
                Ikusi <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <LandFoot />
    </div>
  );
}
