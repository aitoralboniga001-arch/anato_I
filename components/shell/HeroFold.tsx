'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { FoldBody, computeFold, foldTiming } from '@/components/scenes/week4/FoldSagittal';
import { nameOf } from '@/content/registry';

const noop = () => {};
const CTX: SceneContextValue = { selected: null, hovered: null, focus: [], showLabels: false, quiz: false, quizFlash: null, nameOf, onSelect: noop, onHover: noop };
const PERIOD = 14; // seconds per loop
const FPS = 20;

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

/** Looping cephalocaudal fold (the real week-4 scene, without labels) for the landing page. */
export function HeroFold() {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [t, setT] = useState(0.95);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (box.current) io.observe(box.current);
    const t0 = performance.now() - 0.72 * PERIOD * 1000; // open on the folded embryo
    let last = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!visible || document.hidden || now - last < 1000 / FPS) return;
      last = now;
      // 0→1 fold, hold at the C-shaped embryo, then rewind quickly.
      const u = ((now - t0) / 1000 / PERIOD) % 1;
      setT(u < 0.72 ? u / 0.72 : u < 0.9 ? 1 : 1 - (u - 0.9) / 0.1);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  const shown = reduced ? 0.95 : t;
  const day = Math.round(22 + 6 * foldTiming(shown).mf);
  return (
    <div className="hero-visual" ref={box}>
      <svg viewBox="175 60 650 470" role="img" aria-label="Enbrioiaren tolespen zefalokaudala, ebaki sagitalean">
        <Defs />
        {mounted && (
          <SceneContext.Provider value={CTX}>
            <FoldBody f={computeFold(shown)} kloakaShow={0} />
          </SceneContext.Provider>
        )}
      </svg>
      <div className="hero-visual-cap">
        <span className="dot" />
        <span>
          <b>Tolespen zefalokaudala</b> · ebaki sagitala
        </span>
        <span className="hero-visual-day">{day}. eguna</span>
      </div>
      <div className="hero-visual-bar">
        <span style={{ transform: `scaleX(${shown})` }} />
      </div>
    </div>
  );
}
