'use client';

import { useRef } from 'react';
import type { StageDef } from '@/lib/sim/types';
import { IconLoop, IconPause, IconPlay, IconRestart, IconSkipNext, IconSkipPrev } from './icons';

interface TimelineProps {
  stages: StageDef[];
  stageIndex: number;
  t: number;
  playing: boolean;
  speed: number;
  autoContinue: boolean;
  onSeek: (stageIndex: number, t: number) => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onStage: (delta: number) => void;
  onSpeed: (s: number) => void;
  onAutoContinue: (v: boolean) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

/** Week-long scrubber: one segment per stage (width ∝ duration) with beat ticks. */
export function Timeline(p: TimelineProps) {
  const bar = useRef<HTMLDivElement>(null);
  const total = p.stages.reduce((s, st) => s + st.duration, 0);

  const seekFromX = (clientX: number) => {
    const el = bar.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const secs = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * total;
    let acc = 0;
    for (let i = 0; i < p.stages.length; i++) {
      const d = p.stages[i].duration;
      if (secs <= acc + d || i === p.stages.length - 1) {
        p.onSeek(i, Math.min(1, Math.max(0, (secs - acc) / d)));
        return;
      }
      acc += d;
    }
  };

  return (
    <div className="timeline">
      <div className="transport">
        <button className="icon-btn" onClick={() => p.onStage(-1)} disabled={p.stageIndex === 0} title="Aurreko etapa (Shift + ←)" aria-label="Aurreko etapa">
          <IconSkipPrev />
        </button>
        <button className="play-btn" onClick={p.onTogglePlay} title="Erreproduzitu / pausatu (Zuriunea)" aria-label={p.playing ? 'Pausatu' : 'Erreproduzitu'}>
          {p.playing ? <IconPause size={20} /> : <IconPlay size={20} />}
        </button>
        <button className="icon-btn" onClick={() => p.onStage(1)} disabled={p.stageIndex === p.stages.length - 1} title="Hurrengo etapa (Shift + →)" aria-label="Hurrengo etapa">
          <IconSkipNext />
        </button>
        <button className="icon-btn" onClick={p.onRestart} title="Etapa berriro hasi" aria-label="Berriro hasi">
          <IconRestart />
        </button>
      </div>

      <div
        className="track"
        ref={bar}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          seekFromX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons & 1) seekFromX(e.clientX);
        }}
        role="slider"
        aria-label="Denbora-lerroa"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p.t * 100)}
        tabIndex={0}
      >
        {p.stages.map((st, i) => {
          const fill = i < p.stageIndex ? 1 : i === p.stageIndex ? p.t : 0;
          return (
            <div key={st.id} className={`track-seg${i === p.stageIndex ? ' is-current' : ''}`} style={{ flexGrow: st.duration }} title={`${i + 1}. ${st.title} · ${st.day}`}>
              <div className="track-fill" style={{ transform: `scaleX(${fill})` }} />
              {st.beats.map((b, j) => (j === 0 ? null : <span key={j} className="track-tick" style={{ left: `${b.at * 100}%` }} />))}
              <span className="track-day">{i + 1}</span>
              {i === p.stageIndex && <span className="track-head" style={{ left: `${p.t * 100}%` }} />}
            </div>
          );
        })}
      </div>

      <div className="speed">
        {SPEEDS.map((s) => (
          <button key={s} className={`chip${p.speed === s ? ' is-on' : ''}`} onClick={() => p.onSpeed(s)}>
            {s}×
          </button>
        ))}
        <button
          className={`chip${p.autoContinue ? ' is-on' : ''}`}
          onClick={() => p.onAutoContinue(!p.autoContinue)}
          title="Etapa bukatzean hurrengora automatikoki pasatu"
        >
          <IconLoop size={14} /> Jarraitu
        </button>
      </div>
    </div>
  );
}
