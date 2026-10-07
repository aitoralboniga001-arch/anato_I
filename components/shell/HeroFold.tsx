'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { FoldBody, computeFold, foldTiming } from '@/components/scenes/week4/FoldSagittal';
import { nameOf } from '@/content/registry';

const noop = () => {};
export const QUIET_CTX: SceneContextValue = { selected: null, hovered: null, focus: [], showLabels: false, quiz: false, quizFlash: null, nameOf, onSelect: noop, onHover: noop };
const PERIOD = 13; // seconds per loop
const FPS = 24;

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

/** Looping cephalocaudal fold (the real week-4 scene, without labels), framed like a camera viewfinder. */
export function HeroFold({ playing = true }: { playing?: boolean }) {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  // The loop opens on the folding embryo (see t0 below): start there too, so playback begins without a pop.
  const [t, setT] = useState(0.62 / 0.7);
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduced || !playing) return;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (box.current) io.observe(box.current);
    const t0 = performance.now() - 0.62 * PERIOD * 1000; // open on the folding embryo
    let last = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!visible || document.hidden || now - last < 1000 / FPS) return;
      last = now;
      // 0→1 fold, hold on the C-shaped embryo, then rewind.
      const u = ((now - t0) / 1000 / PERIOD) % 1;
      setT(u < 0.7 ? u / 0.7 : u < 0.9 ? 1 : 1 - (u - 0.9) / 0.1);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced, playing]);

  const shown = reduced ? 0.95 : t;
  const day = Math.round(22 + 6 * foldTiming(shown).mf);
  return (
    <figure className="hv" ref={box}>
      <svg viewBox="150 40 700 540" role="img" aria-label="Enbrioiaren tolespen zefalokaudala, ebaki sagitalean">
        <Defs />
        {mounted && (
          <SceneContext.Provider value={QUIET_CTX}>
            <FoldBody f={computeFold(shown)} kloakaShow={0} bare />
          </SceneContext.Provider>
        )}
      </svg>
      <span className="vf vf-tl" />
      <span className="vf vf-tr" />
      <span className="vf vf-bl" />
      <span className="vf vf-br" />
      <figcaption className="hv-hud">
        <span className="rec" />
        <span className="tc">{day}. eguna</span>
        <span className="hv-cap">Tolespen zefalokaudala · ebaki sagitala</span>
      </figcaption>
      <div className="hv-scrub" aria-hidden>
        <span style={{ transform: `scaleX(${shown})` }} />
      </div>
    </figure>
  );
}
