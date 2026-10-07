'use client';

import { useEffect, useState, type RefObject } from 'react';

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Scroll reveal for the landing: everything marked `data-rv` inside `root` rises into place the first
 * time it comes into view. The hiding is armed from here (`data-armed`), so without script nothing is hidden.
 */
export function useReveal(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el || !enabled) return;
    if (prefersReduced()) return;
    const items = [...el.querySelectorAll<HTMLElement>('[data-rv]')];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    // Whatever is already on screen is shown at once (no flash of hidden content); the rest waits for the scroll.
    for (const it of items) {
      const r = it.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) it.classList.add('is-in');
      else io.observe(it);
    }
    // eslint-disable-next-line react-hooks/immutability -- a DOM attribute on the page's own root, outside React's props
    el.dataset.armed = '1';
    return () => {
      io.disconnect();
      delete el.dataset.armed;
    };
  }, [root, enabled]);
}

const easeOut = (v: number) => 1 - (1 - Math.min(1, Math.max(0, v))) ** 4;

/** A number that counts up to `to` when `go` turns true. */
export function CountUp({ to, go, ms = 1500, delay = 0 }: { to: number; go: boolean; ms?: number; delay?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return;
    if (prefersReduced()) {
      const id = requestAnimationFrame(() => setV(to));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = (now: number) => {
      const k = (now - t0) / ms;
      setV(Math.round(to * easeOut(k)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [go, to, ms, delay]);
  return <>{v}</>;
}
