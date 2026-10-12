'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext } from '@/components/kit/context';
import { getWeek } from '@/content/registry';
import { QUIET_CTX } from './HeroFold';

/**
 * The picture on each topic card: a frame of the topic's own simulator scene (not a sketch), at the
 * moment it reads best. Hovering the card plays the scene from its start to that frame.
 */
const SHOTS: Record<number, { stage: string; view: string; rest: number }> = {
  1: { stage: 'blastozistoa', view: 'mozketa', rest: 0.9 },
  2: { stage: 'eguna-9', view: 'heuser', rest: 1 },
  3: { stage: 'gastrulazioa', view: 'zeharkakoa', rest: 0.8 },
  4: { stage: 'neurulazioa', view: 'zeharkakoa', rest: 0.9 },
  5: { stage: 'enbrioia-42-56', view: 'albokoa', rest: 0.9 },
  6: { stage: 'korion-hostotsua', view: 'sagitala', rest: 0.9 },
  7: { stage: 'diafragma-heldua', view: 'azpitik', rest: 0.9 },
  8: { stage: 'buru-ganga', view: 'albotik', rest: 0.9 },
  9: { stage: 'bihotz-muskulua', view: 'eroapena', rest: 0.66 },
};

const PLAY_S = 4.5;
const BACK_S = 0.5;
const ease = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};

const subscribeNothing = () => () => {};
const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

export function TopicShot({ week, hot }: { week: number; hot: boolean }) {
  const shot = SHOTS[week];
  const view = shot ? getWeek(week)?.stages.find((s) => s.id === shot.stage)?.views.find((v) => v.id === shot.view) : undefined;
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
  const box = useRef<HTMLSpanElement>(null);
  // Scenes are only drawn once the card is near the screen (eight of them at once is wasted work).
  const [near, setNear] = useState(false);
  const [t, setT] = useState(shot?.rest ?? 1);
  const cur = useRef(t);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shot || reduced || !near) return;
    let raf = 0;
    const t0 = performance.now();
    const from = cur.current;
    const step = (now: number) => {
      const s = (now - t0) / 1000;
      const v = hot ? 0.03 + (shot.rest - 0.03) * ease(s / PLAY_S) : from + (shot.rest - from) * ease(s / BACK_S);
      cur.current = v;
      setT(v);
      if (s < (hot ? PLAY_S : BACK_S)) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hot, near, reduced, shot]);

  if (!view) return <span className="lp-shot" ref={box} aria-hidden />;
  const Scene = view.scene;
  return (
    <span className="lp-shot" ref={box} aria-hidden>
      {mounted && near && (
        <svg viewBox="70 45 860 550">
          <Defs />
          <SceneContext.Provider value={QUIET_CTX}>
            <Scene t={t} reduced />
          </SceneContext.Provider>
        </svg>
      )}
    </span>
  );
}
