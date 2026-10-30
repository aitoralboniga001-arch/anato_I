'use client';

import { useEffect, useRef, useState } from 'react';
import type { Moment } from '@/content/eratorriak/model';
import styles from '../eratorriak.module.css';

export function MomentBar({
  stages,
  stage,
  onStage,
  categorical,
}: {
  stages: Moment[];
  stage: number;
  onStage: (n: number) => void;
  categorical?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing || stage >= stages.length - 1) return;
    const id = window.setTimeout(() => {
      onStage(stage + 1);
      if (stage + 1 >= stages.length - 1) setPlaying(false);
    }, 3400);
    return () => window.clearTimeout(id);
  }, [playing, stage, stages.length, onStage]);
  useEffect(() => {
    tabs.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [stage]);
  return (
    <div className={styles.stageBar}>
      <button type="button" className={styles.iconBtn} disabled={stage === 0} aria-label="Aurreko unea" onClick={() => onStage(stage - 1)}>
        ←
      </button>
      <div
        ref={tabs}
        className={styles.stages}
        role="tablist"
        aria-label={categorical ? 'Ikuspegiak' : 'Uneak'}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            onStage(Math.max(0, Math.min(stages.length - 1, stage + (e.key === 'ArrowRight' ? 1 : -1))));
          }
        }}
      >
        {stages.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={stage === i}
            tabIndex={stage === i ? 0 : -1}
            className={`${styles.stageBtn}${stage === i ? ` ${styles.on}` : ''}${i < stage ? ` ${styles.past}` : ''}`}
            onClick={() => onStage(i)}
          >
            <b>{i + 1}</b>
            <span>
              {s.title}
              <small>{s.when}</small>
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.iconBtn}
        disabled={stage === stages.length - 1}
        aria-label="Hurrengo unea"
        onClick={() => onStage(stage + 1)}
      >
        →
      </button>
      {!categorical && (
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            if (!playing && stage === stages.length - 1) onStage(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? '❚❚ Gelditu' : '▶ Erreproduzitu'}
        </button>
      )}
    </div>
  );
}
