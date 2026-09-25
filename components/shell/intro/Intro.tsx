'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cleavageFrame, cleavageStep } from './cleavage';
import { CleavageArt, CleavageDefs } from './CleavageArt';

export const INTRO_KEY = 'enbrioatlas:intro';

/** Seconds → cleavage progress (0..6), with short holds between divisions. */
const KEYS: [number, number][] = [
  [0.35, 0],
  [1.35, 1],
  [2.0, 2],
  [2.12, 2],
  [2.72, 3],
  [2.82, 3],
  [3.4, 4],
  [3.5, 4],
  [4.1, 5],
  [4.2, 5],
  [5.3, 6],
];
const TITLE_AT = 5.5;
const OUT_AT = 7.1;
const END = 7.8;

const progressAt = (s: number) => {
  if (s <= KEYS[0][0]) return 0;
  for (let i = 1; i < KEYS.length; i++) {
    const [s1, p1] = KEYS[i];
    const [s0, p0] = KEYS[i - 1];
    if (s <= s1) return p0 + ((p1 - p0) * (s - s0)) / (s1 - s0);
  }
  return 6;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};

/**
 * Opening title sequence: the zygote cleaves into a blastocyst under dark-field light, then the
 * wordmark resolves and the overlay lifts off the landing page. Once per session; any key skips.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [s, setS] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {}
    document.documentElement.dataset.intro = 'seen';
    cb.current();
  }, []);

  const skip = useCallback(() => {
    setLeaving(true);
    window.setTimeout(finish, 520);
  }, [finish]);

  useEffect(() => {
    // Already seen this session (flag set before paint in the root layout), or reduced motion.
    if (document.documentElement.dataset.intro === 'seen') {
      finish();
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      setS(t);
      if (t >= END) finish();
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish, skip]);

  const p = progressAt(s);
  const f = cleavageFrame(p, s);
  const step = cleavageStep(p);
  const born = smooth((s - 0.3) / 0.8);
  const title = smooth((s - TITLE_AT) / 0.9);
  const out = smooth((s - OUT_AT) / (END - OUT_AT));
  // Slow push-in while dividing; the embryo recedes behind the title.
  const scale = (0.94 + 0.08 * clamp(s / TITLE_AT)) * (1 - 0.52 * title);
  const lift = -15 * title;

  return (
    <div
      className={`intro${leaving ? ' is-leaving' : ''}`}
      style={{ opacity: 1 - out }}
      onClick={skip}
      role="dialog"
      aria-label="Sarrera"
    >
      <div className="intro-bars" style={{ ['--bar' as string]: `${(1 - out) * smooth(s / 0.5) * 7}vh` }} />

      <div className="intro-stage" style={{ transform: `translateY(${lift}vh) scale(${scale})`, opacity: born * (1 - 0.55 * title) }}>
        <svg viewBox="-215 -215 430 430" aria-hidden>
          <CleavageDefs id="in" />
          <CleavageArt f={f} id="in" polar={1 - clamp(p - 4)} />
        </svg>
      </div>

      <div className="intro-title" style={{ opacity: title, transform: `translateY(${(1 - title) * 14}px)` }}>
        <h1>
          Enbrio<span>Atlas</span>
        </h1>
        <p>Giza garapena, zelulaz zelula</p>
      </div>

      <div className="intro-hud" style={{ opacity: born * (1 - title) }}>
        <span className="intro-rec" />
        <span className="intro-tc">{step.day}</span>
        <span className="intro-step">{step.name}</span>
      </div>
      <p className="intro-src" style={{ opacity: born * (1 - title) * 0.8 }}>
        1. gaia · Zigotoaren segmentazioa eta blastozistoaren eraketa
      </p>

      <button
        className="intro-skip"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
      >
        Saltatu <kbd>Esc</kbd>
      </button>
      <div className="intro-progress" style={{ transform: `scaleX(${clamp(s / END)})` }} />
    </div>
  );
}
