'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneView } from '@/components/kit';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import {
  BIRTH,
  END_DAY,
  LIFE,
  ORDERED,
  PERIODS,
  SYSTEMS,
  changesBetween,
  dayLabel,
  dayToX,
  milestoneAt,
  momentAt,
  momentOf,
  periodOf,
  simHref,
  statusAt,
  structureHref,
  systemOf,
  systemOfStructure,
  TIMELINE_IDS,
  weekOfDay,
  whenOf,
  xToDay,
  type Milestone,
  type SimMoment,
  type SystemId,
} from '@/content/chronology';
import { getWeek, isSpace, nameOf, partsOf, structures } from '@/content/registry';
import { categoryColor } from '@/lib/sim/palette';
import { LandFoot, LandNav } from './LandNav';
import { IconCheck, IconNext, IconPrev, IconRestart } from './icons';
import './timeline.css';

/** A notes sentence a milestone cites, resolved on the server (the notes text is not shipped to the page). */
export interface Source {
  topic: number;
  section: string;
  text: string;
}

const subscribeNothing = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribeNothing, () => true, () => false);
const noop = () => {};
const clampDay = (d: number) => Math.min(END_DAY, Math.max(0, Math.round(d)));
/** Ablative of a day, for "… -tik hona": "21. egunetik", "12. astetik". */
const sinceLabel = (d: number) => (d <= 56 ? `${d}. egunetik` : d <= BIRTH ? `${weekOfDay(d)}. astetik` : `jaio ondorengo ${Math.max(1, Math.round((d - BIRTH) / 30.4))}. hilabetetik`);

/** Distinct milestone days, in order (optionally of one system): the stops of the step buttons. */
const stopsOf = (system: SystemId | null) => [...new Set(ORDERED.filter((m) => !system || m.system === system).map((m) => m.day))];
export const stepDay = (day: number, dir: 1 | -1, system: SystemId | null) => {
  const stops = stopsOf(system);
  return dir > 0 ? (stops.find((d) => d > day) ?? day) : ([...stops].reverse().find((d) => d < day) ?? day);
};

/** Topic numbers a system's milestones come from ("7", "1·2·3·4"), derived, never typed. */
const topicsOf = (s: SystemId) => [...new Set(ORDERED.filter((m) => m.system === s).map((m) => m.week))].sort((a, b) => a - b);

const LANES = SYSTEMS.filter((s) => ORDERED.some((m) => m.system === s.id));

/** The readout of a day: "22. eguna" up to day 56, then weeks, then months after birth. */
export function dayParts(day: number): [string, string] {
  if (day <= 56) return [String(day), '. eguna'];
  if (day <= BIRTH) return [String(weekOfDay(day)), '. astea'];
  const m = Math.max(1, Math.round((day - BIRTH) / 30.4));
  return [String(m), '. hil. jaio ondoren'];
}

// ——— The live specimen: the real simulator scene of that day ———

export function AgeScene({ at, labels = true, className = 'tl-scene' }: { at: SimMoment; labels?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const ref = useRef<SVGSVGElement>(null);
  const [k, setK] = useState(1.3);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Labels keep their on-screen size when the 1000-wide frame is drawn smaller (as in the simulator).
    const ro = new ResizeObserver(([e]) => setK(Math.min(2, Math.max(1, 1000 / Math.max(1, e.contentRect.width)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const view = at.stage.views.find((v) => v.id === at.view) ?? at.stage.views[0];
  const beat = [...at.stage.beats].reverse().find((b) => b.at <= at.une + 1e-6);
  const focus = labels ? (beat?.focus ?? []) : [];
  const ctx: SceneContextValue = {
    selected: null,
    hovered,
    focus,
    dimContext: focus.length > 0 && !view.ownFocus,
    showLabels: labels,
    quiz: false,
    quizFlash: null,
    nameOf,
    isSpace,
    partsOf,
    onSelect: noop,
    onHover: setHovered,
  };
  return (
    <svg ref={ref} viewBox="0 0 1000 640" className={className} role="img" aria-label={`${at.stage.title} · ${view.label}`}>
      <Defs />
      {hydrated && (
        <SceneContext.Provider value={ctx}>
          <LabelScaleContext.Provider value={{ k, left: false, right: false }}>
            <SceneView key={`${at.week}-${at.stage.id}-${view.id}`} Scene={view.scene} t={at.une} reduced />
          </LabelScaleContext.Provider>
        </SceneContext.Provider>
      )}
    </svg>
  );
}

// ——— The chart: periods, one lane per body system, the day axis and the playhead ———

// In priority order: a tick is drawn only where it does not touch one already drawn.
const TICKS: { d: number; t: string }[] = [
  { d: 0, t: '0' },
  { d: BIRTH, t: 'jaiotza' },
  { d: END_DAY, t: '2 urte' },
  ...[28, 56, 14, 42, 7, 21, 35, 49].map((d) => ({ d, t: String(d) })),
  { d: 140, t: '20. a.' },
  { d: 84, t: '12. a.' },
  { d: 196, t: '28. a.' },
];
/** Rough text widths (px) for layout without measuring: mono 11px, UI 11.5px. */
const MONO = 6.7;
const UI = 6.4;
type Side = 'r' | 'l';
const tickAlign = (d: number) => (d === 0 ? 'is-first' : d >= BIRTH ? 'is-last' : undefined);

function placeTicks(w: number) {
  const taken: [number, number][] = [];
  const out: typeof TICKS = [];
  for (const t of TICKS) {
    const x = dayToX(t.d) * w;
    const len = t.t.length * MONO;
    const a = tickAlign(t.d) === 'is-first' ? x : tickAlign(t.d) === 'is-last' ? x - len : x - len / 2;
    if (taken.some(([p, q]) => a < q + 10 && a + len > p - 10)) continue;
    taken.push([a, a + len]);
    out.push(t);
  }
  return out;
}

/**
 * Which events of a lane get their name written, and on which side: the day's events first, then key
 * dates, then basic ones; a name never covers another name or another event's dot.
 */
function placeNames(list: Milestone[], anchor: number | null, w: number) {
  const dots = list.map((m) => dayToX(m.day) * w);
  const out = new Map<Milestone, Side>();
  const names: [number, number][] = [];
  const order = [...list.filter((m) => m.day === anchor), ...list.filter((m) => m.day !== anchor && m.weight === 'gakoa'), ...list.filter((m) => m.day !== anchor && m.weight === 'oinarria')];
  for (const m of order) {
    const x = dayToX(m.day) * w;
    const end = dayToX(m.to ?? m.day) * w;
    const len = m.short.length * UI + (m.day === anchor ? 16 : 8);
    const sides: [number, number, Side][] = [
      [end + 8, end + 8 + len, 'r'],
      [x - 8 - len, x - 8, 'l'],
    ];
    for (const [a, b, side] of sides) {
      if (a < 0 || b > w) continue;
      const hit = names.some(([p, q]) => a < q + 6 && b > p - 6) || dots.some((d, i) => list[i].day !== m.day && d + 5 > a && d - 5 < b);
      if (hit) continue;
      out.set(m, side);
      names.push([a, b]);
      break;
    }
  }
  return out;
}

export function DayChart({
  day,
  onDay,
  system,
  onSystem,
  hide,
  lanes = true,
  anchor,
}: {
  day: number;
  onDay: (d: number) => void;
  system: SystemId | null;
  onSystem?: (s: SystemId | null) => void;
  /** Recall: no dates in the tooltips. */
  hide?: boolean;
  /** One lane per system (the chronology page) or a single track of key dates (home). */
  lanes?: boolean;
  /** The milestone day the readout is at (its events are named on their lane). */
  anchor: number | null;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const x = dayToX(day);
  const dayAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const px = clientX - r.left;
    // Magnetic: within 7 px of a milestone, land exactly on it.
    let best: number | null = null;
    let dist = 7;
    for (const m of ORDERED) {
      if (!lanes && m.weight !== 'gakoa') continue;
      const dd = Math.abs(dayToX(m.day) * r.width - px);
      if (dd < dist) {
        dist = dd;
        best = m.day;
      }
    }
    return best ?? clampDay(xToDay(Math.min(1, Math.max(0, px / r.width))));
  };
  const onPointer = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointerdown') {
      if ((e.target as HTMLElement).closest('.tl-lane-name')) return;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } else if (!(e.buttons & 1)) return;
    onDay(dayAt(e.clientX));
  };
  const events = (list: Milestone[]) => {
    const named = lanes && w > 0 ? placeNames(list, anchor, w) : new Map<Milestone, Side>();
    return list.map((m, i) => {
      const past = m.day <= day;
      const now = anchor !== null && m.day === anchor;
      const left = dayToX(m.day) * 100;
      const w = m.to !== undefined ? (dayToX(m.to) - dayToX(m.day)) * 100 : 0;
      return (
        <span key={i} className={`tl-ev is-${m.weight}${past ? ' is-past' : ''}${now ? ' is-now' : ''}`} style={{ left: `${left}%`, '--w': `${w}` } as CSSProperties}>
          {w > 0 && <i className="tl-ev-span" />}
          <b
            className="tl-ev-dot"
            role="button"
            tabIndex={-1}
            aria-label={hide ? m.short : `${whenOf(m)}: ${m.short}`}
            data-tip={hide ? m.short : `${whenOf(m)} · ${m.short}`}
            data-tip-pos="top"
          />
          {named.has(m) && <em className={`tl-ev-name${named.get(m) === 'l' ? ' is-left' : ''}`}>{m.short}</em>}
        </span>
      );
    });
  };

  return (
    <div
      className={`tl-chart${lanes ? '' : ' is-compact'}`}
      style={{ '--x': x } as CSSProperties}
      role="slider"
      tabIndex={0}
      aria-label="Garapenaren eguna"
      aria-valuemin={0}
      aria-valuemax={END_DAY}
      aria-valuenow={day}
      aria-valuetext={dayLabel(day)}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onKeyDown={(e) => {
        const k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowLeft') onDay(clampDay(day + (k === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 7 : 1)));
        else if (k === 'PageDown' || k === ']') onDay(stepDay(day, 1, system));
        else if (k === 'PageUp' || k === '[') onDay(stepDay(day, -1, system));
        else if (k === 'Home') onDay(0);
        else if (k === 'End') onDay(BIRTH);
        else return;
        e.preventDefault();
      }}
    >
      <div className="tl-row tl-bands" aria-hidden>
        <span />
        <div className="tl-track">
          {PERIODS.map((p) => {
            const a = dayToX(p.from === 0 ? 0 : p.from - 1);
            const span = (dayToX(p.to) - a) * w;
            // The full name where it fits, the short one where only that does, none on a sliver.
            const fits = (t: string) => t.length * 7.4 + 16 <= span;
            const name = !w || fits(p.name) ? p.name : p.short && fits(p.short) ? p.short : '';
            return (
              <span key={p.id} className={`tl-band${p.id === periodOf(day).id ? ' is-on' : ''}`} style={{ left: `${a * 100}%`, width: `${(dayToX(p.to) - a) * 100}%` }} title={`${p.name}: ${p.note}`}>
                <span>{name}</span>
              </span>
            );
          })}
        </div>
      </div>
      {lanes ? (
        LANES.map((s) => (
          <div key={s.id} className={`tl-row tl-lane${system === s.id ? ' is-on' : system ? ' is-dim' : ''}`}>
            <button className="tl-lane-name" onClick={() => onSystem?.(system === s.id ? null : s.id)} aria-pressed={system === s.id} data-tip={`${s.note} Sakatu: sistema honi bakarrik begiratu.`} data-tip-pos="right">
              <span>{s.name}</span>
              <small>{topicsOf(s.id).join('·')}</small>
            </button>
            <div className="tl-track">{events(ORDERED.filter((m) => m.system === s.id))}</div>
          </div>
        ))
      ) : (
        <div className="tl-row tl-lane">
          <span />
          <div className="tl-track">{events(ORDERED.filter((m) => m.weight === 'gakoa'))}</div>
        </div>
      )}
      <div className="tl-row tl-axis" aria-hidden>
        <span />
        <div className="tl-track" ref={track}>
          {(w ? placeTicks(w) : []).map((t) => (
            <small key={t.d} style={{ left: `${dayToX(t.d) * 100}%` }} className={tickAlign(t.d)}>
              {t.t}
            </small>
          ))}
        </div>
      </div>
      <div className="tl-play" aria-hidden>
        <span className="tl-past" />
        <span className="tl-head" />
      </div>
    </div>
  );
}

// ——— Recall: put six events in order ———

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function dealDeck(system: SystemId | null): Milestone[] {
  const pool = ORDERED.filter((m) => !system || m.system === system);
  const main = pool.filter((m) => m.weight !== 'xehetasuna');
  const from = new Set(main.map((m) => m.day)).size >= 6 ? main : pool;
  const byDay = new Map<number, Milestone[]>();
  for (const m of from) byDay.set(m.day, [...(byDay.get(m.day) ?? []), m]);
  const days = shuffle([...byDay.keys()]).slice(0, 6);
  return shuffle(days.map((d) => shuffle(byDay.get(d)!)[0]));
}

function OrderGame({ system, onShow }: { system: SystemId | null; onShow: (m: Milestone) => void }) {
  const [deck, setDeck] = useState<Milestone[]>(() => dealDeck(system));
  const [picked, setPicked] = useState<Milestone[]>([]);
  const [checked, setChecked] = useState(false);
  const [dealtFor, setDealtFor] = useState(system);
  if (dealtFor !== system) {
    setDealtFor(system);
    setDeck(dealDeck(system));
    setPicked([]);
    setChecked(false);
  }
  const truth = [...deck].sort((a, b) => a.day - b.day);
  const right = picked.filter((m, i) => truth[i] === m).length;
  const redeal = () => {
    setDeck(dealDeck(system));
    setPicked([]);
    setChecked(false);
  };
  if (deck.length < 3) return <p className="tl-empty">Sistema honek ez du ordenatzeko adina mugarri.</p>;
  return (
    <div className="tl-game">
      <p className="tl-game-q">
        {checked ? (
          <>
            <b>
              {right}/{deck.length}
            </b>{' '}
            ordena zuzenean. {right === deck.length ? 'Bikain.' : 'Zenbakiak: zure ordena · benetakoa.'}
          </>
        ) : (
          <>Sakatu mugarriak gertatu ziren ordenan, lehenengotik azkenera.</>
        )}
      </p>
      <ol className="tl-cards">
        {deck.map((m) => {
          const at = picked.indexOf(m);
          const ok = checked && truth[at] === m;
          return (
            <li key={m.short}>
              <button
                className={`tl-card${at >= 0 ? ' is-picked' : ''}${checked ? (ok ? ' is-ok' : ' is-bad') : ''}`}
                disabled={checked}
                onClick={() => setPicked((p) => (p.includes(m) ? p.slice(0, p.indexOf(m)) : [...p, m]))}
              >
                <span className="tl-card-n">{at >= 0 ? at + 1 : ''}</span>
                <span className="tl-card-t">
                  <b>{m.short}</b>
                  <small>{systemOf(m.system).name}</small>
                </span>
                {checked && (
                  <span className="tl-card-a">
                    <i>{truth.indexOf(m) + 1}.</i> {whenOf(m)}
                  </span>
                )}
              </button>
              {checked && (
                <button className="tl-card-go link-quiet" onClick={() => onShow(m)}>
                  Erregelan ikusi
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <div className="tl-game-bar">
        {checked ? (
          <button className="btn small primary" onClick={redeal}>
            <IconRestart size={13} /> Beste sei
          </button>
        ) : (
          <>
            <button className="btn small primary" disabled={picked.length < deck.length} onClick={() => setChecked(true)}>
              <IconCheck size={13} /> Egiaztatu
            </button>
            <button className="btn small ghost" disabled={!picked.length} onClick={() => setPicked([])}>
              Hasieratik
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ——— The page ———

type Mode = 'zerrenda' | 'estalita' | 'ordenatu';
const MODES: { id: Mode; label: string; tip: string }[] = [
  { id: 'zerrenda', label: 'Zerrenda', tip: 'Mugarri guztiak, datarekin' },
  { id: 'estalita', label: 'Datak estalita', tip: 'Datak ezkutuan: gogoratu eta sakatu egiaztatzeko' },
  { id: 'ordenatu', label: 'Ordenatu', tip: 'Sei mugarri nahastuta: jarri ordenan' },
];

/** A structure, named, opening the simulator on the step that first shows it. */
function Chip({ id, sub, moved }: { id: string; sub?: string; moved?: boolean }) {
  const s = structures.get(id);
  if (!s) return null;
  const href = structureHref(id);
  const body = (
    <>
      <i style={{ background: s.color ?? categoryColor[s.category] }} />
      <span>{s.name}</span>
      {sub && <em>{sub}</em>}
    </>
  );
  const cls = `ln-chip tl-chip${moved ? ' is-moved' : ''}`;
  const tip = LIFE[id]?.note ?? s.definition;
  return href ? (
    <Link className={cls} href={href} title={tip}>
      {body}
    </Link>
  ) : (
    <span className={cls} title={tip}>
      {body}
    </span>
  );
}

type Column = 'desagertua' | 'berria' | 'oraindik-ez';
const AHEAD = 10;

/** Chips grouped by body system (the chart's lanes), in the lanes' order. */
function BySystem({ ids, sub, moved }: { ids: string[]; sub?: (id: string) => string | undefined; moved: (id: string) => boolean }) {
  return (
    <div className="tl-groups">
      {SYSTEMS.map((sys) => {
        const mine = ids.filter((id) => systemOfStructure(id) === sys.id);
        if (!mine.length) return null;
        return (
          <div key={sys.id} className="tl-group">
            <span className="tl-group-k">{sys.name}</span>
            <div className="tl-chips">
              {mine.map((id) => (
                <Chip key={id} id={id} sub={sub?.(id)} moved={moved(id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The day's inventory by name: what has just gone or turned into something else, what is new and what comes
 * next (since the previous milestone), then everything that is there, by system. Moving the day lights up the
 * names that changed column.
 */
function PresenceMap({ day, since, system }: { day: number; since: number; system: SystemId | null }) {
  const [trail, setTrail] = useState({ day, prev: day });
  if (trail.day !== day) setTrail({ day, prev: trail.day });
  const [allGone, setAllGone] = useState(false);
  const moved = (id: string) => trail.prev !== day && statusAt(id, trail.prev) !== statusAt(id, day);

  const ids = TIMELINE_IDS.filter((id) => !system || systemOfStructure(id) === system);
  const { born, gone } = changesBetween(since, day);
  const fresh = new Set(born);
  const goneAll = ids.filter((id) => statusAt(id, day) === 'desagertua').sort((a, b) => (LIFE[b].to ?? 0) - (LIFE[a].to ?? 0));
  const goneNow = gone.filter((id) => ids.includes(id));
  const ahead = ids.filter((id) => statusAt(id, day) === 'oraindik-ez');
  const present = ids.filter((id) => statusAt(id, day) === 'badago');
  const from = since >= 0 ? `${sinceLabel(since)} hona` : 'Hasieran';
  const becomes = (id: string) => (LIFE[id].becomes?.length ? `→ ${LIFE[id].becomes!.map(nameOf).join(', ')}` : 'desagertzen da');

  const cols: { key: Column; title: string; hint: string; ids: string[]; sub?: (id: string) => string | undefined; empty: string; more?: ReactNode }[] = [
    {
      key: 'desagertua',
      title: 'Bihurtu / desagertu',
      hint: allGone ? 'Lehenagotik hona, guztiak' : from,
      ids: allGone ? goneAll : goneNow,
      sub: becomes,
      empty: goneAll.length ? 'Ezer ez egun hauetan.' : 'Oraindik ez da ezer desagertu edo bihurtu.',
      more:
        goneAll.length > goneNow.length || allGone ? (
          <button className="tl-more" onClick={() => setAllGone((v) => !v)} aria-pressed={allGone}>
            {allGone ? 'Azkenak bakarrik' : `Guztiak · ${goneAll.length}`}
          </button>
        ) : null,
    },
    { key: 'berria', title: 'Berria', hint: from, ids: present.filter((id) => fresh.has(id)), sub: (id) => dayLabel(LIFE[id].from), empty: 'Ez da egitura berririk agertu egun hauetan.' },
    { key: 'oraindik-ez', title: 'Hurrengoak', hint: 'Oraindik ez dago', ids: ahead.slice(0, AHEAD), sub: (id) => dayLabel(LIFE[id].from), empty: 'Dena agertu da jada.', more: ahead.length > AHEAD ? <span className="tl-more-n">eta beste {ahead.length - AHEAD}</span> : null },
  ];
  const stay = present.filter((id) => !fresh.has(id));

  return (
    <section className="tl-map" aria-label="Egun honetako egiturak">
      <div className="tl-map-cols">
        {cols.map((c) => (
          <div key={c.key} className={`tl-col is-${c.key}`}>
            <header>
              <h3>
                {c.title} <b>{c.ids.length}</b>
              </h3>
              <small>{c.hint}</small>
            </header>
            {c.ids.length ? <BySystem ids={c.ids} sub={c.sub} moved={moved} /> : <p className="tl-col-empty">{c.empty}</p>}
            {c.more}
          </div>
        ))}
      </div>
      <div className="tl-col is-badago">
        <header>
          <h3>
            Lehendik dago <b>{stay.length}</b>
          </h3>
          <small>
            Orain guztira {present.length} · sakatu izen bat simulagailuan ikusteko
          </small>
        </header>
        {stay.length ? <BySystem ids={stay} moved={moved} /> : <p className="tl-col-empty">Oraindik ez dago egiturarik.</p>}
      </div>
    </section>
  );
}

function Cite({ ids, sources }: { ids: string[]; sources: Record<string, Source> }) {
  const first = sources[ids[0]];
  if (!first) return null;
  return (
    <details className="tl-cite">
      <summary>
        Apunteetan · {first.topic}. gaia{first.section ? `, ${first.section}` : ''}
      </summary>
      {ids.map((id) => sources[id] && <blockquote key={id}>{sources[id].text}</blockquote>)}
    </details>
  );
}

const rankOf = (m: Milestone) => (m.weight === 'gakoa' ? 0 : m.weight === 'oinarria' ? 1 : 2);

export function Timeline({ sources, initial }: { sources: Record<string, Source>; initial: { day: number; system: SystemId | null } }) {
  const [day, setDayRaw] = useState(initial.day);
  const [system, setSystem] = useState<SystemId | null>(initial.system);
  const [mode, setMode] = useState<Mode>('zerrenda');
  const [pick, setPick] = useState<Milestone | null>(null);
  const [shown, setShown] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('eguna', String(day));
    if (system) url.searchParams.set('sistema', system);
    else url.searchParams.delete('sistema');
    window.history.replaceState(null, '', url);
  }, [day, system]);

  const setDay = (d: number) => {
    setDayRaw(clampDay(d));
    setPick(null);
  };
  const chart = useRef<HTMLDivElement>(null);
  const showOnRuler = (m: Milestone) => {
    setDayRaw(m.day);
    setPick(m);
    chart.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const anchor = milestoneAt(day, system);
  // Same-day events, the key date first.
  const todays = anchor ? ORDERED.filter((m) => m.day === anchor.day && (!system || m.system === system)).sort((a, b) => rankOf(a) - rankOf(b)) : [];
  const main = pick && todays.includes(pick) ? pick : (todays[0] ?? null);
  const at = (main && main.day === day ? momentOf(main) : null) ?? momentAt(day, system);
  const view = at ? (at.stage.views.find((v) => v.id === at.view) ?? at.stage.views[0]) : null;
  const prevDay = anchor ? ([...stopsOf(null)].reverse().find((d) => d < anchor.day) ?? -1) : -1;
  const next = ORDERED.find((m) => m.day > day && (!system || m.system === system));
  const [n, unit] = dayParts(day);
  const list = ORDERED.filter((m) => !system || m.system === system);
  const sys = system ? systemOf(system) : null;

  return (
    <div className="landing tl-page">
      <LandNav current="kronologia" />
      <header className="ln-hero tl-hero">
        <p className="eyebrow">Kronologia</p>
        <h1>Zer dago orain?</h1>
        <p className="hero-lead">Mugitu garapenaren eguna: zer gertatzen den, zer bihurtu edo desagertu den, zer den berria eta zer datorren, egitura bakoitza bere izenez eta sistemaka. Egun bakoitzaren eszena simulagailukoa da.</p>
      </header>

      <section className="tl" aria-label="Garapenaren eguna">
        <div className="tl-top" ref={chart}>
          <div className="tl-now">
            <p className="tl-day" aria-live="polite">
              {n}
              <small>{unit}</small>
            </p>
            <p className="tl-meta">
              {day <= 56 ? `${weekOfDay(day)}. astea · ` : day <= BIRTH ? `${day}. eguna · ` : ''}
              <b>{periodOf(day).name}</b>
            </p>
            <div className="tl-steps" role="group" aria-label="Mugarriz mugarri">
              <button className="icon-btn" onClick={() => setDay(stepDay(day, -1, system))} disabled={day <= 0} aria-label="Aurreko mugarria" data-tip="Aurreko mugarria · [" data-tip-pos="bottom">
                <IconPrev size={15} />
              </button>
              <button className="icon-btn" onClick={() => setDay(stepDay(day, 1, system))} disabled={!next} aria-label="Hurrengo mugarria" data-tip="Hurrengo mugarria · ]" data-tip-pos="bottom">
                <IconNext size={15} />
              </button>
              {sys && (
                <button className="tl-sys-off" onClick={() => setSystem(null)} data-tip="Sistema guztiak erakutsi" data-tip-pos="bottom">
                  {sys.name} ×
                </button>
              )}
            </div>
          </div>
          <DayChart day={day} onDay={setDay} system={system} onSystem={setSystem} hide={mode !== 'zerrenda'} anchor={anchor?.day ?? null} />
        </div>

        <PresenceMap day={day} since={prevDay} system={system} />

        <div className="tl-stage">
          <figure className="tl-figure">
            {at && <AgeScene at={at} />}
            {at && view && (
              <figcaption>
                <span>
                  <b>{at.week}. gaia</b> · {at.stage.title}
                </span>
                <span className="tl-fig-view">{view.label}</span>
                <Link className="btn small primary tl-fig-go" href={simHref(at)}>
                  Ireki simulagailuan <span aria-hidden>→</span>
                </Link>
              </figcaption>
            )}
          </figure>

          <aside className="tl-card-now">
            {main ? (
              <article className="tl-event">
                <p className="tl-when">
                  {mode === 'zerrenda' || main.day === day ? whenOf(main) : 'Azken mugarria'}
                  {main.day !== day && <em> · {day - main.day} egun lehenago</em>}
                  <span className="tl-sys">{systemOf(main.system).name}</span>
                </p>
                <h2>{main.short}</h2>
                <p>{main.text}.</p>
                <Cite ids={main.notes} sources={sources} />
                {todays.length > 1 && (
                  <ul className="tl-also" aria-label="Egun berean">
                    {todays
                      .filter((m) => m !== main)
                      .map((m) => (
                        <li key={m.short}>
                          <button onClick={() => setPick(m)}>
                            <span>{systemOf(m.system).name}</span> {m.short}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </article>
            ) : (
              <p className="tl-empty">Ernalkuntza baino lehen ez dago ezer.</p>
            )}

            {next && (
              <button className="tl-next" onClick={() => setDay(next.day)}>
                <span>Hurrengoa</span>
                <b>{next.short}</b>
                <em>{mode === 'zerrenda' ? whenOf(next) : '?'}</em>
              </button>
            )}
          </aside>
        </div>
      </section>

      <section className="land-section tl-seq" aria-labelledby="tl-seq-h">
        <header className="tl-seq-head">
          <div>
            <p className="eyebrow">Sekuentzia{sys ? ` · ${sys.name}` : ''}</p>
            <h2 id="tl-seq-h">Ikasi ordena</h2>
          </div>
          <div className="seg" role="tablist" aria-label="Nola ikasi">
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} className={mode === m.id ? 'is-on' : ''} onClick={() => setMode(m.id)} data-tip={m.tip} data-tip-pos="top">
                {m.label}
              </button>
            ))}
          </div>
        </header>

        {mode === 'ordenatu' ? (
          <OrderGame system={system} onShow={showOnRuler} />
        ) : (
          <ol className={`tl-list${mode === 'estalita' ? ' is-hidden' : ''}`}>
            {list.map((m) => {
              const open = mode === 'zerrenda' || shown.has(m.short);
              const target = momentOf(m);
              return (
                <li key={m.short} className={`is-${m.weight}${anchor && m.day === anchor.day ? ' is-now' : ''}`}>
                  {open ? (
                    <button className="tl-list-day" onClick={() => showOnRuler(m)} data-tip="Erregelan kokatu" data-tip-pos="right">
                      {whenOf(m)}
                    </button>
                  ) : (
                    <button className="tl-list-day is-veiled" onClick={() => setShown((s) => new Set(s).add(m.short))} aria-label={`Erakutsi ${m.short}-ren data`}>
                      Noiz?
                    </button>
                  )}
                  <p>
                    <b>{m.short}</b> <span>{m.text}</span>
                  </p>
                  <span className="tl-list-sys">{systemOf(m.system).name}</span>
                  {target && (
                    <Link className="link-quiet" href={simHref(target)} aria-label={`${m.short} simulagailuan`}>
                      Ikusi <span aria-hidden>→</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {mode === 'estalita' && shown.size > 0 && (
          <p className="tl-veil-bar">
            <button className="link-quiet" onClick={() => setShown(new Set())}>
              Datak berriro estali ({shown.size})
            </button>
          </p>
        )}
      </section>
      <LandFoot />
    </div>
  );
}

/** For Chronicle: the topic a key date belongs to, with its title (derived from the registry). */
export const topicTitle = (week: number) => getWeek(week)?.title ?? `${week}. gaia`;
