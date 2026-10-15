'use client';

import { useEffect, useRef } from 'react';
import type { ViewGuide } from '@/lib/sim/types';
import { IconClose } from './icons';
import styles from './model-guide.module.css';

/** Opt-in reading help for a 3D view. It lies over the step's text inside the dock, so neither the dock
 *  nor the scene changes size; the player pauses when it opens and closes it on play or a new step. */
export function ModelGuide({ guide, onClose }: { guide: ViewGuide; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => close.current?.focus({ preventScroll: true }), []);
  return (
    <section
      id="model-guide"
      className={styles.panel}
      aria-label="Irudia ulertu"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
    >
      <header className={styles.head}>
        <h2>Irudia ulertu</h2>
        <span>Non nago? · Zeri begiratu?</span>
        <button ref={close} className={styles.close} onClick={onClose} aria-label="Gida itxi" title="Gida itxi · Esc">
          <IconClose size={14} />
        </button>
      </header>
      <div className={styles.content}>
        <div><h3>01 · Kokatu</h3><p>{guide.orientation}</p></div>
        <div><h3>02 · Behatu</h3><p>{guide.observe}</p></div>
        <p className={styles.meaning}>{guide.meaning}</p>
        <details className={styles.check}>
          <summary>{guide.question}<span> Pentsatu, eta ireki erantzuna</span></summary>
          <p>{guide.answer}</p>
        </details>
      </div>
    </section>
  );
}
