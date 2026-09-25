'use client';

import { useRef, useState } from 'react';
import type { StageDef } from '@/lib/sim/types';
import { IconLoop, IconNext, IconPause, IconPlay, IconPrev, IconSkipNext, IconSkipPrev } from './icons';

interface PlayerProps {
  stage: StageDef;
  stageIndex: number;
  stageCount: number;
  nextTitle?: string;
  t: number;
  activeBeat: number;
  playing: boolean;
  speed: number;
  autoContinue: boolean;
  day: string;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onStage: (delta: number) => void;
  onBeat: (delta: number) => void;
  onSpeed: (s: number) => void;
  onAutoContinue: (v: boolean) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Playback dock under the viewport: the current step as a subtitle, then transport controls and a
 * scrubber split into one chapter per step (like chapters on a video timeline).
 */
export function Player(p: PlayerProps) {
  const bar = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; k: number } | null>(null);
  const beats = p.stage.beats;
  const n = beats.length;
  const beat = beats[p.activeBeat];
  const atEnd = p.t >= 1;

  const tAt = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const beatAt = (t: number) => {
    let k = 0;
    beats.forEach((b, i) => {
      if (b.at <= t + 1e-6) k = i;
    });
    return k;
  };

  return (
    <div className="dock">
      <div className="cap" aria-live="polite">
        <span className="cap-n">
          {pad(p.activeBeat + 1)}
          <i>/{pad(n)}</i>
        </span>
        <p key={`${p.stage.id}-${p.activeBeat}`}>{beat?.text}</p>
        <div className="cap-nav">
          <button className="icon-btn" onClick={() => p.onBeat(-1)} aria-label="Aurreko urratsa" title="Aurreko urratsa (←)">
            <IconPrev />
          </button>
          {atEnd && p.nextTitle ? (
            <button className="btn btn-light" onClick={() => p.onStage(1)} title={p.nextTitle}>
              Hurrengo etapa <span aria-hidden>→</span>
            </button>
          ) : (
            <button className="icon-btn" onClick={() => p.onBeat(1)} aria-label="Hurrengo urratsa" title="Hurrengo urratsa (→)">
              <IconNext />
            </button>
          )}
        </div>
      </div>

      <div className="transport">
        <div className="tp-buttons">
          <button className="icon-btn" onClick={() => p.onStage(-1)} disabled={p.stageIndex === 0} title="Aurreko etapa (Shift + ←)" aria-label="Aurreko etapa">
            <IconSkipPrev size={16} />
          </button>
          <button className={`play${p.playing ? ' is-playing' : ''}`} onClick={p.onTogglePlay} title="Erreproduzitu / pausatu (Zuriunea)" aria-label={p.playing ? 'Pausatu' : 'Erreproduzitu'}>
            {p.playing ? <IconPause size={16} /> : <IconPlay size={16} />}
          </button>
          <button className="icon-btn" onClick={() => p.onStage(1)} disabled={p.stageIndex === p.stageCount - 1} title="Hurrengo etapa (Shift + →)" aria-label="Hurrengo etapa">
            <IconSkipNext size={16} />
          </button>
        </div>

        <div
          className="scrub"
          ref={bar}
          role="slider"
          tabIndex={0}
          aria-label="Etaparen denbora-lerroa"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p.t * 100)}
          aria-valuetext={`${p.activeBeat + 1}. urratsa`}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            p.onSeek(tAt(e.clientX));
          }}
          onPointerMove={(e) => {
            const t = tAt(e.clientX);
            const r = bar.current!.getBoundingClientRect();
            setHover({ x: Math.min(r.width - 150, Math.max(150, e.clientX - r.left)), k: beatAt(t) });
            if (e.buttons & 1) p.onSeek(t);
          }}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === 'Home') p.onSeek(0);
            if (e.key === 'End') p.onSeek(1);
          }}
        >
          {beats.map((b, k) => {
            const end = k < n - 1 ? beats[k + 1].at : 1;
            const fill = Math.min(1, Math.max(0, (p.t - b.at) / Math.max(1e-6, end - b.at)));
            return (
              <span key={k} className={`scrub-seg${k === p.activeBeat ? ' is-on' : ''}`} style={{ left: `${b.at * 100}%`, width: `${(end - b.at) * 100}%` }}>
                <i style={{ transform: `scaleX(${fill})` }} />
              </span>
            );
          })}
          <span className="scrub-head" style={{ left: `${p.t * 100}%` }} />
          {hover && (
            <span className="scrub-tip" style={{ left: hover.x }}>
              <b>{pad(hover.k + 1)}</b>
              <span>{beats[hover.k].text}</span>
            </span>
          )}
        </div>

        <span className="tp-tc" title="Garapenaren eguna">
          {p.day}
        </span>

        <div className="tp-opts">
          <button
            className="tp-speed"
            onClick={() => p.onSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length])}
            title="Abiadura (klik aldatzeko)"
            aria-label={`Abiadura ${p.speed}×`}
          >
            {p.speed}×
          </button>
          <button
            className={`icon-btn${p.autoContinue ? ' is-on' : ''}`}
            onClick={() => p.onAutoContinue(!p.autoContinue)}
            title={p.autoContinue ? 'Jarraian: aktibatuta — etapa bukatzean hurrengora pasatzen da' : 'Jarraian: desaktibatuta — etapa bakoitzaren amaieran gelditzen da'}
            aria-pressed={p.autoContinue}
            aria-label="Etapak jarraian erreproduzitu"
          >
            <IconLoop size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
