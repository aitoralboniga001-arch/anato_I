'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext } from '@/components/kit/context';
import { getWeek } from '@/content/registry';
import type { SceneComponent } from '@/lib/sim/types';
import { QUIET_CTX } from './HeroFold';

/**
 * The simulator's own scenes, played back to back as a showreel: what the app does, shown rather than
 * told. Each has a name written for this strip (one or two words, never cut); it opens on topic 7.
 * A new topic joins with one line here.
 */
const PICKS: { week: number; stage: string; view: number; label: string }[] = [
  { week: 3, stage: 'gastrulazioa', view: 3, label: 'Gastrulazioa' },
  { week: 4, stage: 'tolespenak', view: 0, label: 'Tolespenak' },
  { week: 7, stage: 'diafragma-eraketa', view: 0, label: 'Diafragma' },
  { week: 8, stage: 'hezurtzapena', view: 0, label: 'Hezurtzapena' },
  { week: 9, stage: 'muskulu-motak', view: 0, label: 'Muskuluak' },
];
const FIRST_WEEK = 7;

interface Reel {
  week: number;
  n: string;
  topic: string;
  title: string;
  label: string;
  day: string;
  scene: SceneComponent;
  href: string;
}

const REEL: Reel[] = PICKS.flatMap((p) => {
  const w = getWeek(p.week);
  const s = w?.stages.find((x) => x.id === p.stage);
  const v = s?.views[p.view];
  if (!w || !s || !v) return [];
  return [{ week: p.week, n: String(p.week).padStart(2, '0'), topic: w.title, title: s.title, label: p.label, day: s.day, scene: v.scene, href: `/astea/${p.week}?etapa=${p.stage}&ikuspegia=${v.id}` }];
});
const START = Math.max(0, REEL.findIndex((r) => r.week === FIRST_WEEK));

/** Seconds each scene gets: it plays through, rests on its last frame, and dissolves into the next. */
const HOLD = 9.5;
const PLAY_FROM = 0.5;
const PLAY_FOR = 7;
const FADE = 1;
const FPS = 30;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

interface Frame {
  i: number;
  /** Seconds into the current scene, and into the dissolve from the previous one (null when none). */
  local: number;
  prev: number | null;
  fade: number;
}

/** The hero's viewfinder: real scenes of the simulator, with a camera frame, a slow tilt that follows the pointer and a chapter strip. */
export function HeroReel({ playing = true }: { playing?: boolean }) {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [f, setF] = useState<Frame>({ i: START, local: PLAY_FROM + PLAY_FOR * 0.62, prev: null, fade: 1 });
  const box = useRef<HTMLElement>(null);
  const live = useRef({ i: START, local: PLAY_FROM + PLAY_FOR * 0.62, prev: null as number | null, fade: 1 });

  useEffect(() => {
    if (reduced || !playing) return;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (box.current) io.observe(box.current);
    let last = performance.now();
    let acc = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      if (!visible || document.hidden) return;
      const s = live.current;
      s.local += dt;
      if (s.prev !== null) s.fade += dt / FADE;
      if (s.fade >= 1) {
        s.prev = null;
        s.fade = 1;
      }
      if (s.local >= HOLD) {
        s.prev = s.i;
        s.i = (s.i + 1) % REEL.length;
        s.local = 0;
        s.fade = 0;
      }
      acc += dt;
      if (acc < 1 / FPS) return;
      acc = 0;
      setF({ i: s.i, local: s.local, prev: s.prev, fade: s.fade });
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced, playing]);

  const go = (k: number) => {
    const s = live.current;
    if (k === s.i) {
      s.local = 0;
    } else {
      s.prev = s.i;
      s.i = k;
      s.local = 0;
      s.fade = 0;
    }
    setF({ i: s.i, local: s.local, prev: s.prev, fade: s.fade });
  };

  const tilt = (e: PointerEvent<HTMLElement>) => {
    const el = box.current;
    if (!el || reduced || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 3.2).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 4.4).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const untilt = () => {
    const el = box.current;
    if (!el) return;
    for (const k of ['--rx', '--ry']) el.style.removeProperty(k);
  };

  const cur = REEL[f.i];
  const Cur = cur.scene;
  const Prev = f.prev !== null ? REEL[f.prev].scene : null;
  const t = reduced ? 0.9 : ease((f.local - PLAY_FROM) / PLAY_FOR);
  const fadeIn = ease(f.fade);
  // Day counter: the span of the stage, as a clock that advances with the scene.
  return (
    <figure className="lp-reel" ref={box} onPointerMove={tilt} onPointerLeave={untilt}>
      <div className="lp-reel-tilt">
        <div className="lp-reel-glow" aria-hidden />
        <svg viewBox="0 0 1000 640" role="img" aria-label={`${cur.topic}: ${cur.title}`} className="lp-reel-svg">
          <Defs />
          {mounted && (
            <SceneContext.Provider value={QUIET_CTX}>
              {Prev && (
                <g opacity={1 - fadeIn}>
                  <Prev t={1} reduced={reduced} />
                </g>
              )}
              <g opacity={Prev ? fadeIn : 1}>
                <Cur t={t} reduced={reduced} />
              </g>
            </SceneContext.Provider>
          )}
        </svg>
        <span className="vf vf-tl" />
        <span className="vf vf-tr" />
        <span className="vf vf-bl" />
        <span className="vf vf-br" />
        <figcaption className="lp-reel-hud" key={f.i}>
          <span className="rec" />
          <span className="lp-reel-day">{cur.day}</span>
          {/* The topic's name where the frame has room for it; its number always. */}
          <span className="lp-reel-cap" title={cur.topic}>
            <b>{cur.n}</b> <span className="lp-reel-topic">{cur.topic}</span>
            <span className="lp-reel-gaia">gaia</span>
          </span>
        </figcaption>
        <div className="hv-scrub" aria-hidden>
          <span style={{ transform: `scaleX(${t})` }} />
        </div>
      </div>

      <nav className="lp-reel-strip" aria-label="Simulagailuko eszenak">
        {REEL.map((r, k) => (
          <button key={r.n + r.title} className={k === f.i ? 'is-on' : ''} onClick={() => go(k)} aria-current={k === f.i ? 'true' : undefined} aria-label={`${r.week}. gaia: ${r.title}`} title={`${r.week}. gaia · ${r.title}`}>
            <i aria-hidden>
              <span style={{ transform: `scaleX(${k === f.i ? clamp(f.local / HOLD) : k < f.i ? 1 : 0})` }} />
            </i>
            <small>{r.n}</small>
            <span>{r.label}</span>
          </button>
        ))}
        <Link className="lp-reel-open" href={cur.href}>
          Ireki simulagailuan <span aria-hidden>→</span>
        </Link>
      </nav>
    </figure>
  );
}
