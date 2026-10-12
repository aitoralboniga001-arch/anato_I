'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Conceptus, ConceptusDefs } from '@/components/scenes/week1/conceptus';
import { lerp, seg } from '@/lib/sim/anim';
import { cleavageFrame, cleavageStep } from './cleavage';

/** Seen this session (sessionStorage): the opening does not come back until the browser is reopened. */
export const INTRO_KEY = 'enbrioatlas:intro';
/** The full sequence has been seen once on this device (localStorage): later sessions get only the signature. */
export const INTRO_FULL_KEY = 'enbrioatlas:intro-full';

/**
 * The full opening, seconds. The zygote cleaves into a blastocyst under the microscope lamp; the
 * blastocyst turns and shrinks into the brand mark (its trophoblast ring becomes the mark's ring, the
 * inner cell mass its signal dot); the name slides out of the mark; and the lockup flies into its place
 * in the page's bar while the veil lifts — the opening ends exactly where the product begins.
 */
const FULL = {
  /**
   * Seconds → cleavage progress, on the topic-1 engine (gens 5): 0.5 zygote, 1 → 2 cells … 5 → 16
   * (morula), 6 → ~32 with outer and inner cell masses, 7 the finished blastocyst. Short holds
   * between divisions, and a beat on the finished blastocyst before it turns into the mark.
   */
  keys: [
    [0.15, 0.5],
    [0.9, 1],
    [1.35, 2],
    [1.45, 2],
    [1.85, 3],
    [1.93, 3],
    [2.3, 4],
    [2.38, 4],
    [2.75, 5],
    [2.85, 5],
    [3.2, 6],
    [3.3, 6],
    [3.95, 7],
  ] as [number, number][],
  morph: 4.15,
  morphLen: 0.95,
  draw: 4.75,
  slide: 5.0,
  tag: 5.3,
  fly: 6.2,
  end: 7.0,
};

/** Later sessions: only the signature (the mark draws itself, the name slides out, it flies home). */
const SHORT = { draw: 0.05, slide: 0.5, tag: 99, fly: 1.15, end: 1.8 };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
const outCubic = (v: number) => 1 - (1 - clamp(v)) ** 3;
const inOut = (v: number) => {
  const x = clamp(v);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

const progressAt = (keys: [number, number][], s: number) => {
  if (s <= keys[0][0]) return 0;
  for (let i = 1; i < keys.length; i++) {
    const [s1, p1] = keys[i];
    const [s0, p0] = keys[i - 1];
    if (s <= s1) return p0 + ((p1 - p0) * (s - s0)) / (s1 - s0);
  }
  return keys[keys.length - 1][1];
};

/**
 * The conceptus exactly as topic 1 draws it (same engine, same palette: blastomeres, zona pellucida,
 * green trophoblast, blue inner cell mass), staged as the Segmentation and Blastocyst scenes stage it:
 * loose round blastomeres that compact into a mulberry morula (flat contacts, no bridges), then the
 * zona is lost and the blastocoel opens inside a closed trophoblast with the inner cell mass at one pole.
 */
const ROT = 43; // embryonic pole up, as in the Blastocyst scene
const conceptusAt = (p: number, wobble: number) => {
  const f = cleavageFrame(p, wobble, 5);
  const blast = clamp(p - 6);
  const morula = 1 - seg(p, 6, 6.3);
  if (p > 6) f.zonaO = (1 - 0.62 * seg(blast, 0.01, 0.11)) * (1 - seg(blast, 0.155, 0.2));
  const press = seg(p, 3.83, 4.36);
  return {
    f,
    relief: lerp(0.6, 1, seg(p, 2.71, 3.83)) * morula,
    press: press * morula,
    bumps: Math.max(0, 12 * seg(p, 3, 3.83) - 9 * press + 6 * seg(p, 4.43, 5) - 2 * seg(p, 5.57, 6)) * morula,
    mass: p > 6 ? 1 : seg(p, 5.57, 6),
    polar: 1 - seg(p, 4.83, 5.29),
  };
};

/** The HUD line, in the notes' words. */
const stepAt = (p: number) => (p < 5 ? cleavageStep(p) : p < 6 ? { name: 'Morula · 32 zelula inguru', day: '4. eguna' } : { name: 'Blastozistoa', day: '4.–5. egunak' });

/** The blastocyst's outer edge (engine units), if the engine gives no outline. */
const BLASTO_R = 142;
/** The brand mark (32-unit box): ring radius and the signal dot, as in icons.tsx BrandMark. */
const MARK_RING = 14;
const DOT_ANGLE = (Math.atan2(21.3 - 16, 22.3 - 16) * 180) / Math.PI;

const readFull = () => {
  try {
    return window.localStorage.getItem(INTRO_FULL_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Opening title sequence. Full once per device, a 2-second signature in later sessions, nothing again
 * in the same session, nothing at all with reduced motion (flag set before paint in the root layout).
 * Any key or click skips.
 */
export function Intro({ onDone, onOut, full: forceFull }: { onDone: () => void; /** The veil starts to lift: the page can begin its own reveal underneath (a cross-dissolve, not a gap). */ onOut?: () => void; /** Replay asked for: always the full sequence. */ full?: boolean }) {
  const [s, setS] = useState(0);
  const [leaving, setLeaving] = useState(false);
  // Decided once, on the client, before the first frame runs (the overlay paints black until then).
  const [full, setFull] = useState<boolean | null>(null);
  // Where the lockup lands: the page bar's wordmark (measured when the flight starts).
  const [home, setHome] = useState<{ x: number; y: number; k: number } | null>(null);
  const lock = useRef<HTMLDivElement>(null);
  // Layout the motion needs (read after mount, and again if the window changes size).
  const [geo, setGeo] = useState<{ lockW: number; markW: number; stage: number } | null>(null);
  // The bar wordmark's own proportions (mark and gap per em of its type, which change with the page
  // width): the lockup copies them, so the flight's one uniform scale lands it exactly on it.
  const [prop, setProp] = useState<{ mark: number; gap: number } | null>(null);
  const done = useRef(false);
  const cb = useRef(onDone);
  const outCb = useRef(onOut);
  const outSent = useRef(false);
  useEffect(() => {
    cb.current = onDone;
    outCb.current = onOut;
  });
  const lift = useCallback(() => {
    if (outSent.current) return;
    outSent.current = true;
    outCb.current?.();
  }, []);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
      // Seen (or skipped) once: from the next session on, only the signature.
      window.localStorage.setItem(INTRO_FULL_KEY, '1');
    } catch {}
    document.documentElement.dataset.intro = 'seen';
    cb.current();
  }, []);

  const skip = useCallback(() => {
    lift();
    setLeaving(true);
    window.setTimeout(finish, 420);
  }, [finish, lift]);

  // The flight's target, from the real layout: the lockup and the bar's wordmark share proportions,
  // so one uniform scale lands it pixel on pixel.
  const measure = useCallback(() => {
    const a = lock.current?.getBoundingClientRect();
    const b = document.querySelector('.land-nav .wordmark')?.getBoundingClientRect();
    if (!a || !b || !a.width || !b.width) return null;
    return { x: b.left - a.left, y: b.top + b.height / 2 - (a.top + a.height / 2), k: b.width / a.width };
  }, []);

  useEffect(() => {
    // Already seen this session, or reduced motion.
    if (document.documentElement.dataset.intro === 'seen') {
      finish();
      return;
    }
    const isFull = forceFull || !readFull();
    const T = isFull ? FULL : SHORT;
    let raf = 0;
    let flying = false;
    let started = false;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      if (!started) {
        started = true;
        setFull(isFull);
        const w = document.querySelector('.land-nav .wordmark');
        const fs = w ? parseFloat(getComputedStyle(w).fontSize) : 0;
        const mk = w?.querySelector('svg')?.getBoundingClientRect().width ?? 0;
        if (w && fs && mk) setProp({ mark: mk / fs, gap: (parseFloat(getComputedStyle(w).columnGap) || 0) / fs });
      }
      setS(t);
      if (t >= T.fly && !flying) {
        flying = true;
        setHome(measure());
        lift();
      }
      if (t >= T.end) finish();
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
  }, [finish, skip, lift, measure, forceFull]);

  useEffect(() => {
    if (full === null) return;
    const read = () => {
      const el = lock.current;
      if (!el) return;
      setGeo({ lockW: el.offsetWidth, markW: el.querySelector('svg')?.getBoundingClientRect().width ?? 0, stage: Math.min(window.innerHeight * 0.76, window.innerWidth * 0.88) });
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [full, prop]);

  // The inner cell mass's bearing in the finished blastocyst: the turn brings it onto the mark's dot.
  // …and its outer edge, which lands on the mark's ring.
  const blastoR = useMemo(() => {
    let r = 0;
    for (const c of cleavageFrame(7, 0, 5).cells) for (const q of c.shape?.pts ?? []) r = Math.max(r, Math.hypot(q[0], q[1]));
    return r || BLASTO_R;
  }, []);
  const turn = useMemo(() => {
    const f = cleavageFrame(7, 0, 5);
    const icm = f.cells.filter((c) => c.fate === 'enbrioblasto' || c.kind === 'enbrioblasto');
    if (!icm.length) return 0;
    const x = icm.reduce((n, c) => n + (c.shape?.cx ?? c.x), 0) / icm.length;
    const y = icm.reduce((n, c) => n + (c.shape?.cy ?? c.y), 0) / icm.length;
    let d = DOT_ANGLE - ((Math.atan2(y, x) * 180) / Math.PI + ROT);
    while (d <= -180) d += 360;
    while (d > 180) d -= 360;
    // Always turn the same way, and enough to read as a gesture.
    return d < 60 ? d + 360 : d;
  }, []);

  const T = full ? FULL : SHORT;
  const fly = inOut((s - T.fly) / (T.end - T.fly - 0.05));
  // The veil goes with the flight; the lockup itself stays solid until it has landed.
  const veil = 1 - smooth((s - T.fly - 0.1) / (T.end - T.fly - 0.1));

  // Microscope phase (full only).
  const p = full ? progressAt(FULL.keys, s) : 7;
  const m = full ? inOut((s - FULL.morph) / FULL.morphLen) : 1;
  const art = full && m < 1 ? conceptusAt(p, s) : null;
  const cstep = stepAt(p);
  const lamp = full ? outCubic(s / 0.8) : 1;
  const hud = full ? smooth(s / 0.5) * (1 - smooth((s - FULL.morph) / 0.4)) : 0;

  // Signature: ring, then the C drawn in one stroke, then the dot.
  const ring = full ? smooth((m - 0.55) / 0.45) : smooth((s - T.draw) / 0.35);
  const arc = outCubic((s - T.draw) / 0.55);
  const dot = full ? smooth((m - 0.7) / 0.3) : smooth((s - T.draw - 0.35) / 0.25);
  const bump = Math.sin(Math.PI * clamp((s - T.draw - (full ? 0 : 0.35)) / 0.45));
  const pop = 1 + 0.35 * bump;
  // The inner cell mass lands as the signal dot with one soft flare of light.
  const glow = dot > 0 ? Math.sin(Math.PI * clamp((s - T.draw - (full ? 0.05 : 0.35)) / 0.9)) : 0;
  const slide = inOut((s - T.slide) / 0.6);
  const tag = smooth((s - T.tag) / 0.5) * (1 - smooth((s - T.fly) / 0.3));

  // The mark is centred on screen first, then the lockup slides left as the name comes out of it.
  const markW = geo?.markW ?? 0;
  const centre = (((geo?.lockW ?? 0) - markW) / 2) * (1 - slide);
  const lockTf = home
    ? `translate(${home.x * fly}px, ${home.y * fly}px) scale(${1 + (home.k - 1) * fly})`
    : fly > 0
      ? undefined
      : `translateX(${centre}px)`;
  const lockOpacity = !home && fly > 0 ? 1 - fly : 1;

  // The blastocyst turns and shrinks onto the mark (its outer ring onto the mark's ring).
  const target = geo ? ((MARK_RING / 32) * geo.markW) / ((blastoR / 430) * geo.stage) : 0.2;
  const push = 0.94 + 0.08 * clamp(s / FULL.morph);
  const scale = push * Math.pow(target / push, m);

  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}${full === false ? ' is-short' : ''}`} onClick={skip} role="dialog" aria-label="Sarrera">
      <div className="intro-veil" style={{ opacity: veil }} />

      {art && (
        <div
          className="intro-stage"
          style={{
            transform: `rotate(${turn * m}deg) scale(${scale})`,
            opacity: smooth(s / 0.35) * (1 - smooth((m - 0.62) / 0.38)),
            clipPath: lamp < 1 ? `circle(${8 + 63 * lamp}% at 50% 50%)` : undefined,
          }}
        >
          <svg viewBox="-215 -215 430 430" aria-hidden>
            <ConceptusDefs id="inc" />
            <defs>
              {/* The microscope lamp: a warm pool of light that falls off into the dark field. */}
              <radialGradient id="inc-lamp">
                <stop offset="0" stopColor="#f3dcc2" stopOpacity="0.1" />
                <stop offset="0.6" stopColor="#f3dcc2" stopOpacity="0.03" />
                <stop offset="1" stopColor="#f3dcc2" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle r={214} fill="url(#inc-lamp)" />
            <Conceptus f={art.f} x={0} y={0} s={1} rot={ROT} id="inc" polar={art.polar} mass={art.mass} relief={art.relief} press={art.press} bumps={art.bumps} />
          </svg>
        </div>
      )}

      <div className="intro-lock" ref={lock} style={{ transform: lockTf, opacity: lockOpacity, ...(prop ? { gap: `${prop.gap}em`, ['--mark-em' as string]: `${prop.mark}em` } : null) }}>
        <svg viewBox="0 0 32 32" aria-hidden className="intro-mark">
          <circle cx="16" cy="16" r={MARK_RING} fill="none" stroke="currentColor" strokeOpacity={0.35 * ring} strokeWidth="1.2" />
          <path d="M21.2 10.4a7.4 7.4 0 1 0 0.9 10.6" pathLength={1} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - arc} opacity={arc > 0 ? 1 : 0} />
          <defs>
            <radialGradient id="intro-glow">
              <stop offset="0" stopColor="var(--signal, #ff6a3d)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--signal, #ff6a3d)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {glow > 0.01 && <circle cx="22.3" cy="21.3" r={5 + 5 * glow} fill="url(#intro-glow)" opacity={glow} />}
          <circle cx="22.3" cy="21.3" r={2 * dot * (dot < 1 ? pop : 1)} fill="var(--signal, #ff6a3d)" />
        </svg>
        <span className="intro-name" style={{ clipPath: slide < 1 ? `inset(-0.3em ${(1 - slide) * 100}% -0.3em 0)` : undefined }}>
          <span style={{ transform: slide < 1 ? `translateX(${-(1 - slide) * 0.6}em)` : undefined, opacity: smooth(slide * 1.6) }}>
            Enbrio<b>Atlas</b>
          </span>
        </span>
      </div>
      {full && (
        <p className="intro-tag" style={{ opacity: tag, transform: `translateY(${(1 - smooth((s - T.tag) / 0.5)) * 6}px)` }}>
          Giza garapena, zelulaz zelula
        </p>
      )}

      {full && (
        <>
          <div className="intro-hud" style={{ opacity: hud }}>
            <span className="rec intro-rec" />
            <span className="intro-tc">{cstep.day}</span>
            <span className="intro-step">{cstep.name}</span>
          </div>
          <p className="intro-src" style={{ opacity: hud }}>
            1. gaia · Zigotoaren segmentazioa eta blastozistoaren eraketa
          </p>
        </>
      )}

      <button
        className="intro-skip"
        style={{ opacity: veil }}
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
      >
        Saltatu <kbd>Esc</kbd>
      </button>
      <div className="intro-progress" style={{ transform: `scaleX(${clamp(s / T.end)})`, opacity: veil }} />
    </div>
  );
}
