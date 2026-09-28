'use client';

import { firstSentence } from '@/content/generate';
import { useRef, useState, type ReactNode } from 'react';
import type { Beat, MicroQuestion, StageDef, StructureDef } from '@/lib/sim/types';
import { structures } from '@/content/registry';
import { IconBolt, IconGuide, IconLoop, IconNext, IconPause, IconPlay, IconPrev, IconSkipNext, IconSkipPrev, IconVoice } from './icons';
import { categoryColor } from '@/lib/sim/palette';
import { useCanNarrate } from './narrate';
import type { PlayMode } from './prefs';
import { recordAnswer } from './answers';

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
  /** Guided mode: slower, holds each step until read, shows the step's new structures. */
  guided: boolean;
  voice: boolean;
  /** The step's animation has finished and it is waiting for the reading time. */
  waiting: boolean;
  /** Structures introduced by the current step (only filled in guided mode). */
  fresh: StructureDef[];
  mode: PlayMode;
  onMode: (m: PlayMode) => void;
  onVoice: (v: boolean) => void;
  onContinue: () => void;
  onNextStage: () => void;
  onPick: (id: string) => void;
  /** Guided micro-question shown in place of the caption at the end of a step. */
  ask?: ReactNode;
  /** GOGORATU: watch again how an earlier structure formed (time machine, with a way back). */
  onRecall?: (id: string) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];
const pad = (n: number) => String(n).padStart(2, '0');

/** The step in one line: its IDEIA NAGUSIA, or the first sentence of its explanation ("15. eguna" is not a sentence end). */
export const ideaOf = (b: Beat | undefined) => b?.idea ?? b?.text.match(/^.+?(?<!\d)[.!?](?=\s|$)/)?.[0] ?? b?.text ?? '';

const MODES: { id: PlayMode; label: string; title: string }[] = [
  {
    id: 'gidatua',
    label: 'Gidatua',
    title: 'Modu gidatua: mantso, urrats bakoitzean gelditu, egiturak aurkeztu eta galdera txikiak',
  },
  {
    id: 'arrunta',
    label: 'Arrunta',
    title: 'Modu arrunta: jarraian, urrats bakoitza irakurtzeko denborarekin',
  },
  {
    id: 'azkarra',
    label: 'Azkarra',
    title: 'Modu azkarra: prozesua 20–60 segundotan berriz ikusteko, ideia nagusiak soilik',
  },
];

/** The step's caption: main idea, short explanation, key and trap, and optional detail folded away. */

function Caption({ beat, quick, stageId, k, extra, onRecall }: { beat: Beat | undefined; quick: boolean; stageId: string; k: number; extra?: ReactNode; onRecall?: (id: string) => void }) {
  const [openKey, setOpenKey] = useState('');
  if (!beat) return null;
  const key = `${stageId}-${k}`;
  if (quick)
    return (
      <p key={key} className="cap-idea is-quick">
        {ideaOf(beat)}
      </p>
    );
  const open = openKey === key;
  return (
    <div className={`cap-text${beat.idea ? ' has-idea' : ''}`} key={key}>
      {(beat.recall?.length ?? 0) > 1 && (
        // Several earlier structures: one line of names (definition on hover), each can be replayed.
        <p className="cap-recall is-many">
          <b>Gogoratu</b>
          <span>
            {beat.recall!.map((id, i) => {
              const r = structures.get(id);
              if (!r) return null;
              return (
                <span key={id} className="cap-recall-item">
                  {i > 0 && <span aria-hidden> · </span>}
                  {onRecall ? (
                    <button className="link-quiet" onClick={() => onRecall(id)} title={`${firstSentence(r.definition)} — Ikusi nola sortu zen (gero, bueltatu hona)`}>
                      <strong>{r.name}</strong> <span aria-hidden>↺</span>
                    </button>
                  ) : (
                    <strong title={r.definition}>{r.name}</strong>
                  )}
                </span>
              );
            })}
          </span>
        </p>
      )}
      {beat.recall?.length === 1 && beat.recall.map((id) => {
        const r = structures.get(id);
        return r ? (
          <p className="cap-recall" key={id} title={r.definition}>
            <b>Gogoratu</b>
            <span>
              <strong>{r.name}</strong> — {firstSentence(r.definition)}
            </span>
            {onRecall && (
              <button className="link-quiet" onClick={() => onRecall(id)} title="Ikusi nola sortu zen (gero, bueltatu hona)">
                Ikusi berriro <span aria-hidden>↺</span>
              </button>
            )}
          </p>
        ) : null;
      })}
      {beat.idea && <p className="cap-idea">{beat.idea}</p>}
      <p>{beat.text}</p>
      {extra && <div className="cap-extra">{extra}</div>}
      {(beat.key || beat.exam || beat.caution || beat.more) && (
        <div className="cap-notes">
          {beat.key && (
            <span className="cap-note is-key">
              <b>Ulertzeko gakoa</b>
              {beat.key}
            </span>
          )}
          {beat.exam && (
            <span className="cap-note is-exam">
              <b>Azterketarako gakoa</b>
              {beat.exam}
            </span>
          )}
          {beat.caution && (
            <span className="cap-note is-warn">
              <b>Kontuz</b>
              {beat.caution}
            </span>
          )}
          {beat.more && (
            <button className="cap-more-btn" aria-expanded={open} onClick={() => setOpenKey(open ? '' : key)}>
              {open ? 'Laburtu' : 'Sakondu'} <span aria-hidden>{open ? '−' : '+'}</span>
            </button>
          )}
        </div>
      )}
      {open && beat.more && <p className="cap-more">{beat.more}</p>}
    </div>
  );
}

/**
 * Playback dock under the viewport: the current step as a subtitle, then transport controls and a
 * scrubber split into one chapter per step (like chapters on a video timeline).
 */
export function Player(p: PlayerProps) {
  const bar = useRef<HTMLDivElement>(null);
  const narrate = useCanNarrate();
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
    <div className={`dock${p.guided ? ' is-guided' : ''}${p.mode === 'azkarra' ? ' is-quick' : ''}`}>
      <div className="cap" aria-live="polite">
        <span className="cap-n">
          {pad(p.activeBeat + 1)}
          <i>/{pad(n)}</i>
        </span>
        <div className="cap-body">
          {p.ask ?? (
            <Caption
              beat={beat}
              quick={p.mode === 'azkarra'}
              stageId={p.stage.id}
              k={p.activeBeat}
              onRecall={p.onRecall}
              extra={
                p.fresh.length > 0 && (
                  <ul className="fresh" key={`f-${p.stage.id}-${p.activeBeat}`}>
                    <li className="fresh-tag">Berria</li>
                    {p.fresh.map((s, k) => (
                      <li key={s.id} style={{ animationDelay: `${0.25 + k * 0.2}s` }}>
                        <button onClick={() => p.onPick(s.id)} title={`${s.definition} — klik fitxa irekitzeko`}>
                          <i
                            style={{
                              background: s.color ?? categoryColor[s.category],
                            }}
                          />
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          )}
        </div>
        <div className="cap-nav">
          <button className="icon-btn" onClick={() => p.onBeat(-1)} aria-label="Aurreko urratsa" title="Aurreko urratsa (←)">
            <IconPrev />
          </button>
          {p.waiting && !p.ask && (
            <button className="btn small ghost cap-wait" onClick={p.onContinue} title="Irakurtzeko denbora: klik jarraitzeko">
              <span className="cap-wait-dot" aria-hidden />
              Jarraitu
            </button>
          )}
          {atEnd && p.nextTitle ? (
            <button className="btn btn-light" onClick={p.onNextStage} title={p.nextTitle}>
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
            setHover({
              x: Math.min(r.width - 150, Math.max(150, e.clientX - r.left)),
              k: beatAt(t),
            });
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
              <span
                key={k}
                className={`scrub-seg${k === p.activeBeat ? ' is-on' : ''}`}
                style={{
                  left: `${b.at * 100}%`,
                  width: `${(end - b.at) * 100}%`,
                }}
              >
                <i style={{ transform: `scaleX(${fill})` }} />
              </span>
            );
          })}
          <span className="scrub-head" style={{ left: `${p.t * 100}%` }} />
          {hover && (
            <span className="scrub-tip" style={{ left: hover.x }}>
              <b>{pad(hover.k + 1)}</b>
              <span>{ideaOf(beats[hover.k])}</span>
            </span>
          )}
        </div>

        <span className="tp-tc" title="Garapenaren eguna">
          {p.day}
        </span>

        <div className="tp-opts">
          <div className="tp-mode" role="radiogroup" aria-label="Erreprodukzio modua">
            {MODES.map((m) => (
              <button key={m.id} role="radio" aria-checked={p.mode === m.id} className={p.mode === m.id ? 'is-on' : ''} onClick={() => p.onMode(m.id)} title={m.title}>
                {m.id === 'gidatua' && <IconGuide size={14} />}
                {m.id === 'azkarra' && <IconBolt size={14} />}
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          {p.guided && narrate && (
            <button
              className={`icon-btn${p.voice ? ' is-on' : ''}`}
              onClick={() => p.onVoice(!p.voice)}
              title={p.voice ? 'Ahotsa: aktibatuta' : 'Ahotsa: azalpenak ozen irakurri'}
              aria-pressed={p.voice}
              aria-label="Azalpenak ozen irakurri"
            >
              <IconVoice size={16} />
            </button>
          )}
          <button className="tp-speed" onClick={() => p.onSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length])} title="Abiadura (klik aldatzeko)" aria-label={`Abiadura ${p.speed}×`}>
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

/**
 * Guided tour card, floating over the scene: the structure lit right now, in its colour, with its
 * definition. It sits on the viewport so the dock (and the scene size) does not jump while it runs.
 */
export function TourCard({ item, idx, n, onSkip, onPick }: { item: StructureDef; idx: number; n: number; onSkip: () => void; onPick: (id: string) => void }) {
  return (
    <div className="tour" role="status">
      <div className="tour-top">
        <span className="tour-kicker">
          Ezagutu egiturak · {idx + 1}/{n}
        </span>
        <span className="tour-dots" aria-hidden>
          {Array.from({ length: n }, (_, k) => (
            <i key={k} className={k < idx ? 'is-past' : k === idx ? 'is-on' : ''} />
          ))}
        </span>
        <button className="btn small ghost" onClick={onSkip} title="Egituren bira saltatu">
          Saltatu <span aria-hidden>→</span>
        </button>
      </div>
      <button className="tour-card" key={item.id} onClick={() => onPick(item.id)} title="Ireki fitxa">
        <i className="tour-swatch" style={{ background: item.color ?? categoryColor[item.category] }} />
        <span>
          <b>{item.name}</b>
          {item.es && <em>{item.es}</em>}
          <span className="tour-def">{item.definition}</span>
        </span>
      </button>
    </div>
  );
}

/**
 * Guided mode's check at the end of a step: one tap, then the reason, then on. It takes the caption's
 * place in the dock so the scene stays visible; answers are kept with the rest (`mikro:` ids).
 */
export function AskCard({ id, ask, onDone }: { id: string; ask: MicroQuestion; onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked === ask.answer;
  return (
    <div className="tour ask" role="dialog" aria-label="Galdera txikia">
      <div className="tour-top">
        <span className="tour-kicker">Egiaztatu · galdera txikia</span>
        <span className="tour-dots" />
        <button className="btn small ghost" onClick={onDone} title="Galdera saltatu eta jarraitu">
          {picked === null ? 'Saltatu' : 'Jarraitu'} <span aria-hidden>→</span>
        </button>
      </div>
      <p className="ask-q">{ask.q}</p>
      <div className="ask-options">
        {ask.options.map((o, k) => (
          <button
            key={k}
            disabled={picked !== null}
            className={picked === null ? '' : k === ask.answer ? 'is-right' : k === picked ? 'is-wrong' : 'is-faded'}
            onClick={() => {
              setPicked(k);
              recordAnswer(id, k === ask.answer, ask.options[k]);
            }}
          >
            <span className="opt-letter">{String.fromCharCode(65 + k)}</span>
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p className={`ask-why${ok ? ' ok' : ' bad'}`}>
          <b>{ok ? 'Bai!' : 'Ez horixe.'}</b> {ok ? ask.why[ask.answer] : `${ask.why[picked]} ${ask.why[ask.answer]}`}
        </p>
      )}
    </div>
  );
}
