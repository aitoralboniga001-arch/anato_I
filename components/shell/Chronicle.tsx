'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ORDERED, milestoneAt, momentAt, momentOf, simHref, systemOf, whenOf, type SimMoment } from '@/content/chronology';
import { AgeScene, DayChart, dayParts } from './Timeline';
import { IconNext, IconPause, IconPlay, IconPrev } from './icons';
import './timeline.css';

/** The key dates of the notes, in order: the chapters the home page plays through. */
const KEYS = ORDERED.filter((m) => m.weight === 'gakoa');
const STEP_MS = 3600;
const GROW_MS = 2200;

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const useReduced = () => useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true);
const ease = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};

/**
 * The home page's chronology: one screen. The real simulator scene of each key date of the notes, played
 * in order (or scrubbed on the ruler), with what happens that day; the full chronology is one click away.
 */
export function Chronicle() {
  const reduced = useReduced();
  const ref = useRef<HTMLElement>(null);
  const [day, setDay] = useState(KEYS[0].day);
  const [playing, setPlaying] = useState(true);
  const [seen, setSeen] = useState(false);
  const [grow, setGrow] = useState(1);

  const key = milestoneAt(day);
  const index = Math.max(0, KEYS.findLastIndex((m) => m.day <= day));
  const main = KEYS[index];
  const exact = main && main.day === day;
  const base: SimMoment | null = (exact ? momentOf(main) : null) ?? momentAt(day);
  // The scene grows into the moment (the process plays), unless motion is reduced.
  const at: SimMoment | null = base && grow < 1 ? { ...base, une: Math.max(0, base.une - 0.3 * (1 - ease(grow))) } : base;

  // Plays only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio >= 0.45), { threshold: [0, 0.45, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const live = playing && seen && !reduced;
  useEffect(() => {
    if (!live) return;
    const id = window.setTimeout(() => setDay(KEYS[(index + 1) % KEYS.length].day), STEP_MS);
    return () => window.clearTimeout(id);
  }, [live, index]);

  useEffect(() => {
    if (reduced || !seen) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const g = Math.min(1, (now - t0) / GROW_MS);
      setGrow(g);
      if (g < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [day, reduced, seen]);

  const go = (d: number) => {
    setPlaying(false);
    setDay(d);
  };
  const [n, unit] = dayParts(day);
  const view = at ? (at.stage.views.find((v) => v.id === at.view) ?? at.stage.views[0]) : null;

  return (
    <section ref={ref} id="kronologia" className="land-section chr" aria-labelledby="chr-h">
      <header className="section-head chr-head">
        <p className="kicker">Kronologia</p>
        <h2 id="chr-h">Egunez egun, ernalkuntzatik jaiotzara</h2>
        <p>
          Apunteetako {KEYS.length} gako-data, simulagailuaren irudi berarekin.{' '}
          <Link className="link-arrow" href={`/kronologia?eguna=${day}`}>
            Kronologia osoa <span aria-hidden>→</span>
          </Link>
        </p>
      </header>

      <div className="chr-stage">
        <figure className="tl-figure chr-figure">
          {at && <AgeScene at={at} />}
          {at && view && (
            <figcaption>
              <span>
                <b>{at.week}. gaia</b> · {at.stage.title}
              </span>
              <span className="tl-fig-view">{view.label}</span>
              <Link className="btn small primary tl-fig-go" href={simHref(base!)}>
                Ireki simulagailuan <span aria-hidden>→</span>
              </Link>
            </figcaption>
          )}
        </figure>

        <div className="chr-side">
          <p className="tl-day chr-day" aria-live="polite">
            {n}
            <small>{unit}</small>
          </p>
          {key && (
            <article className="chr-event" key={key.short}>
              <p className="tl-when">
                {whenOf(key)}
                <span className="tl-sys">{systemOf(key.system).name}</span>
              </p>
              <h3>{key.short}</h3>
              <p>{key.text}.</p>
            </article>
          )}
          <div className="chr-ctl">
            <button className="icon-btn" onClick={() => go(KEYS[Math.max(0, index - (exact ? 1 : 0))].day)} disabled={index === 0 && exact} aria-label="Aurreko gako-data" data-tip="Aurreko gako-data" data-tip-pos="top">
              <IconPrev size={15} />
            </button>
            {!reduced && (
              <button className="icon-btn chr-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pausatu' : 'Erreproduzitu'} data-tip={playing ? 'Pausatu' : 'Erreproduzitu'} data-tip-pos="top">
                {playing ? <IconPause size={15} /> : <IconPlay size={15} />}
              </button>
            )}
            <button className="icon-btn" onClick={() => go(KEYS[Math.min(KEYS.length - 1, index + 1)].day)} disabled={index === KEYS.length - 1} aria-label="Hurrengo gako-data" data-tip="Hurrengo gako-data" data-tip-pos="top">
              <IconNext size={15} />
            </button>
            <span className="chr-count">
              {String(index + 1).padStart(2, '0')} / {KEYS.length}
            </span>
          </div>
        </div>
      </div>

      <div className="chr-ruler">
        <DayChart day={day} onDay={go} system={null} lanes={false} anchor={key?.day ?? null} />
      </div>
    </section>
  );
}
