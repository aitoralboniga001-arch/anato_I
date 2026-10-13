'use client';

import { firstSentence } from '@/content/generate';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { Beat, MicroQuestion, StageDef, StructureDef } from '@/lib/sim/types';
import { structures } from '@/content/registry';
import { IconBolt, IconCalendar, IconChevron, IconQuiz, IconCaptions, IconGuide, IconLoop, IconNext, IconNotes, IconPause, IconPlay, IconPrev, IconRestart, IconSkipNext, IconSkipPrev, IconVoice, IconVoiceOff } from './icons';
import { Popover } from './Popover';
import { categoryColor } from '@/lib/sim/palette';
import type { AudioSnapshot } from './narrate';
import { setPref, usePref, type PlayMode } from './prefs';
import { recordAnswer } from './answers';
import { linkTerms, termsOf, type Term } from './terms';
import type { ExamDate } from '@/content/examDates';

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
  /** Guided mode's one-tap question at the end of each step: on, and the switch for it. */
  asks: boolean;
  onAsks: (v: boolean) => void;
  /** Guided mode: slower, holds each step until read, shows the step's new structures. */
  guided: boolean;
  voice: boolean;
  audioState: AudioSnapshot;
  voiceConfigured: boolean | null;
  onRepeat: () => void;
  /** The step's animation has finished and it is waiting for the reading time. */
  waiting: boolean;
  /** Seconds remaining before a timed mode advances this step. */
  waitSeconds: number | null;
  /** Structures introduced by the current step (only filled in guided mode). */
  fresh: StructureDef[];
  /** Every step's exam dates and new structures, so the caption can reserve the stage's tallest step. */
  stepExtras?: { dates: ExamDate[]; fresh: StructureDef[] }[];
  /** The stage preview over the scene: still playing (`running`) or read and waiting for "Hasi" (`ready`). */
  intro?: 'running' | 'ready' | null;
  onStart?: () => void;
  /** Guided micro-question in the dock: still open, or answered (the Next key then lights up). */
  askState?: 'open' | 'answered';
  onAskDone?: () => void;
  mode: PlayMode;
  onMode: (m: PlayMode) => void;
  onVoice: (v: boolean) => void;
  onContinue: () => void;
  onNextStage: () => void;
  /** The stage has not started: the play key names itself ("Erreproduzitu"), the one way in. */
  cue?: boolean;
  /** After the topic's last stage: where the study goes next (the next topic, or the questions). */
  finish?: { label: string; tip: string; onClick: () => void };
  onPick: (id: string) => void;
  /** Guided micro-question shown in place of the caption at the end of a step. */
  ask?: ReactNode;
  /** GOGORATU: watch again how an earlier structure formed (time machine, with a way back). */
  onRecall?: (id: string) => void;
  /** Exam dates the current step shows. */
  dates?: ExamDate[];
  /** A structure named in the caption is pointed at (lit in the scene) or let go. */
  onTermHover?: (id: string | null) => void;
  /** No caption links (the find quiz: a linked name would answer the question). */
  noTerms?: boolean;
}

const SPEEDS = [0.5, 1, 1.5, 2];
const NO_TERMS: Term[] = [];
const noop = () => {};
const pad = (n: number) => String(n).padStart(2, '0');

/** The step in one line: its IDEIA NAGUSIA, or the first sentence of its explanation ("15. eguna" is not a sentence end). */
export const ideaOf = (b: Beat | undefined) => b?.idea ?? b?.text.match(/^.+?(?<!\d)[.!?](?=\s|$)/)?.[0] ?? b?.text ?? '';

const MODES: { id: PlayMode; label: string; title: string; hint: string }[] = [
  {
    id: 'gidatua',
    label: 'Gidatua',
    title: 'Modu gidatua: mantso, urrats bakoitzean gelditu, egiturak aurkeztu eta galdera txikiak',
    hint: 'Mantso; urrats bakoitzean gelditzen da, egiturak aurkezten ditu eta galdera txikiak egiten ditu',
  },
  {
    id: 'arrunta',
    label: 'Arrunta',
    title: 'Modu arrunta: jarraian, urrats bakoitza irakurtzeko denborarekin',
    hint: 'Jarraian; urrats bakoitza irakurtzeko denborarekin',
  },
  {
    id: 'azkarra',
    label: 'Azkarra',
    title: 'Modu azkarra: prozesua 20–60 segundotan berriz ikusteko, ideia nagusiak soilik',
    hint: 'Errepasoa: prozesu osoa 20–60 segundotan, ideia nagusiak soilik',
  },
];

const ModeIcon = ({ mode, size = 15 }: { mode: PlayMode; size?: number }) => (mode === 'gidatua' ? <IconGuide size={size} /> : mode === 'azkarra' ? <IconBolt size={size} /> : <IconPlay size={size - 3} />);

/** The date tag in front of the step's idea (exam dates, "HITO-DATAK"). */
function DateTag({ dates }: { dates: ExamDate[] }) {
  if (!dates.length) return null;
  return (
    <span className="cap-date" title={dates.map((d) => `${d.when}: ${d.what}`).join(' · ')}>
      <IconCalendar size={12} />
      {dates.map((d) => d.when).join(' · ')}
    </span>
  );
}

/**
 * The step's caption. What to read comes first, in one column (date, main idea, explanation); the
 * study notes (key, exam, trap, earlier structures, new structures) sit in the margin beside it.
 */
function Caption({
  beat,
  quick,
  stageId,
  k,
  dates,
  extra,
  onRecall,
  terms,
  onPick,
  onTermHover,
}: {
  beat: Beat | undefined;
  quick: boolean;
  stageId: string;
  k: number;
  dates: ExamDate[];
  extra?: ReactNode;
  onRecall?: (id: string) => void;
  terms: readonly Term[];
  onPick: (id: string) => void;
  onTermHover?: (id: string | null) => void;
}) {
  const [openKey, setOpenKey] = useState('');
  if (!beat) return null;
  const key = `${stageId}-${k}`;
  // The structures the step names, each linked once (hover: lit in the scene; click: its card).
  const used = new Set<string>();
  const link = (text: string) => linkTerms(text, terms, used, { onPick, onHover: onTermHover });
  if (quick)
    return (
      <p key={key} className="cap-idea is-quick">
        <DateTag dates={dates} />
        {link(ideaOf(beat))}
      </p>
    );
  const open = openKey === key;
  const recall = (beat.recall ?? []).map((id) => structures.get(id)).filter((r): r is StructureDef => !!r);
  const side = recall.length > 0 || !!(beat.key || beat.exam || beat.caution || beat.more) || !!extra;
  return (
    <div className={`cap-text cap-v2${side ? ' has-side' : ''}`} key={key}>
      <div className="cap-main">
        {beat.idea ? (
          <p className="cap-idea">
            <DateTag dates={dates} />
            {link(beat.idea)}
          </p>
        ) : (
          dates.length > 0 && (
            <p className="cap-idea is-date">
              <DateTag dates={dates} />
            </p>
          )
        )}
        <p>{link(beat.text)}</p>
        {open && beat.more && <p className="cap-more">{beat.more}</p>}
      </div>
      {side && (
        <div className="cap-side">
          {beat.key && (
            <p className="cap-note is-key">
              <b>Ulertzeko gakoa</b>
              {beat.key}
            </p>
          )}
          {beat.exam && (
            <p className="cap-note is-exam">
              <b>Funtsezkoa</b>
              {beat.exam}
            </p>
          )}
          {beat.caution && (
            <p className="cap-note is-warn">
              <b>Kontuz</b>
              {beat.caution}
            </p>
          )}
          {recall.length > 0 && (
            <p className="cap-note is-recall">
              <b>Gogoratu</b>
              <span>
                {recall.map((r, i) => (
                  <span key={r.id} className="cap-recall-item">
                    {i > 0 && <span aria-hidden> · </span>}
                    {onRecall ? (
                      <button className="link-quiet" onClick={() => onRecall(r.id)} title={`${firstSentence(r.definition)} — Ikusi nola sortu zen (gero, bueltatu hona)`}>
                        {r.name} <span aria-hidden>↺</span>
                      </button>
                    ) : (
                      <span title={r.definition}>{r.name}</span>
                    )}
                  </span>
                ))}
              </span>
            </p>
          )}
          {extra && <div className="cap-extra">{extra}</div>}
          {beat.more && (
            <button className="cap-more-btn" aria-expanded={open} onClick={() => setOpenKey(open ? '' : key)}>
              {open ? 'Laburtu' : 'Sakondu'} <span aria-hidden>{open ? '−' : '+'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** At most this many "Berria" chips before a "+N" chip: a long list would squeeze the scene. */
const FRESH_CAP = 5;

/** The "BERRIA" chips of a step: its new structures, easing in one after the other. */
function FreshList({ items, onPick, k }: { items: StructureDef[]; onPick: (id: string) => void; k: string }) {
  return <FreshChips key={k} items={items} onPick={onPick} />;
}

function FreshChips({ items, onPick }: { items: StructureDef[]; onPick: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const folded = !all && items.length > FRESH_CAP + 1;
  const shown = folded ? items.slice(0, FRESH_CAP) : items;
  return (
    <ul className="fresh">
      <li className="fresh-tag">Berria</li>
      {shown.map((s, i) => (
        <li key={s.id} style={{ animationDelay: `${0.25 + i * 0.2}s` }}>
          <button onClick={() => onPick(s.id)} title={`${s.definition} — klik fitxa irekitzeko`}>
            <i style={{ background: s.color ?? categoryColor[s.category] }} />
            {s.name}
          </button>
        </li>
      ))}
      {folded && (
        <li style={{ animationDelay: `${0.25 + FRESH_CAP * 0.2}s` }}>
          <button className="fresh-more" onClick={() => setAll(true)} title={items.slice(FRESH_CAP).map((s) => s.name).join(', ')}>
            +{items.length - FRESH_CAP} gehiago
          </button>
        </li>
      )}
    </ul>
  );
}

const VOICE_STATE: Record<AudioSnapshot['status'], string> = {
  idle: 'Prest',
  loading: 'Prestatzen…',
  playing: 'Azaltzen',
  paused: 'Pausatuta',
  observing: 'Begiratu lasai',
  done: 'Urratsa entzunda',
  error: 'Etenda',
};

/**
 * Narrated step: the step's idea, a live strip that says what the voice is doing (speaking, loading,
 * paused, letting you look) and which sentence of the step it is on, the reading tools, and the
 * spoken sentence as a subtitle when asked for (off by default: narration with identical on-screen
 * text competes with the image).
 */
function SpokenCaption({ beat, audio, configured, fullText, onFullText, onRepeat, onOff }: { beat: Beat; audio: AudioSnapshot; configured: boolean | null; fullText: boolean; onFullText: (v: boolean) => void; onRepeat: () => void; onOff: () => void }) {
  const subtitles = usePref('subtitles');
  const status = configured === false ? 'error' : audio.status;
  const count = Math.max(1, audio.count);
  const active = status === 'playing' || status === 'loading' || status === 'paused';
  return (
    <div className={`spoken-caption is-${status}`}>
      <p className="cap-idea">{ideaOf(beat)}</p>
      <div className="voice-strip">
        <div className="voice-status" role="status" aria-live="polite">
          <span className="voice-eq" aria-hidden>
            <i /><i /><i /><i />
          </span>
          <span className="voice-state">{configured === false ? 'Ahotsa ez dago erabilgarri' : status === 'error' ? audio.error || VOICE_STATE.error : VOICE_STATE[status]}</span>
          {count > 1 && configured !== false && status !== 'error' && (
            <span className="voice-pips" aria-label={`${Math.min(audio.segment + 1, count)}. esaldia ${count}etik`}>
              {Array.from({ length: count }, (_, i) => (
                <i key={i} className={i < audio.segment || (!active && status !== 'idle') ? 'is-done' : i === audio.segment && active ? 'is-now' : undefined} />
              ))}
            </span>
          )}
          {status === 'error' && configured !== false && <button className="voice-retry" onClick={onRepeat}>Saiatu berriro</button>}
        </div>
        <div className="voice-tools">
          <button className="voice-tool" onClick={() => setPref('subtitles', !subtitles)} aria-pressed={subtitles} title="Esaten ari den esaldia idatzita">
            <IconCaptions size={15} /> Azpitituluak
          </button>
          <button className="voice-tool" onClick={() => onFullText(!fullText)} aria-pressed={fullText} title="Urratsaren testu osoa, ulertzeko gakoak eta gogoratzekoak">
            <IconNotes size={15} /> Azalpen osoa
          </button>
          <button className="voice-tool" onClick={onRepeat} title="Urrats hau hasieratik entzun">
            <IconRestart size={15} /> Errepikatu
          </button>
          <button className="voice-tool is-off" onClick={onOff} title="Ahotsa itzali eta testuarekin jarraitu">
            <IconVoiceOff size={15} /> Itzali
          </button>
        </div>
      </div>
      {subtitles && audio.text && configured !== false && <p className="spoken-subtitle" key={audio.text}>{audio.text}</p>}
    </div>
  );
}

/**
 * Playback dock under the viewport: the current step as a subtitle, then transport controls and a
 * scrubber split into one chapter per step (like chapters on a video timeline).
 */
export function Player(p: PlayerProps) {
  const bar = useRef<HTMLDivElement>(null);
  const [fullText, setFullText] = useState(false);
  const [hover, setHover] = useState<{ x: number; k: number } | null>(null);
  const beats = p.stage.beats;
  const n = beats.length;
  const beat = beats[p.activeBeat];
  const atEnd = p.t >= 1;
  const allTerms = useMemo(() => termsOf([...p.stage.structures, ...p.stage.beats.flatMap((b) => b.focus ?? [])]), [p.stage]);
  const terms = p.noTerms ? NO_TERMS : allTerms;
  const showText = !p.voice || fullText;

  // The one Next key: whatever moves the study on right now (start after the preview, skip or leave the
  // question, go on after a step, the next stage), always in the same place. `go` lights it up: the app
  // is waiting for this press.
  const next: { tone: 'plain' | 'go' | 'timed' | 'stage'; label: string; tip: string; onClick: () => void; seconds?: number; disabled?: boolean } =
    p.intro && p.onStart
      ? { tone: p.intro === 'ready' ? 'go' : 'plain', label: 'Hasi', tip: p.intro === 'ready' ? 'Hasi urratsez urrats · →' : 'Aurrebista saltatu eta hasi · →', onClick: p.onStart }
      : p.ask && p.askState && p.onAskDone
        ? p.askState === 'answered'
          ? { tone: 'go', label: 'Jarraitu', tip: 'Hurrengo urratsera · →', onClick: p.onAskDone }
          : { tone: 'plain', label: 'Saltatu', tip: 'Galdera saltatu eta jarraitu · →', onClick: p.onAskDone }
        : atEnd && p.nextTitle
          ? { tone: 'stage', label: 'Hurrengo etapa', tip: `Hurrengo etapa: ${p.nextTitle} · Shift + →`, onClick: p.onNextStage }
          : atEnd && p.finish
            ? { tone: 'stage', label: p.finish.label, tip: p.finish.tip, onClick: p.finish.onClick }
            : p.waiting && p.guided
              ? { tone: 'go', label: 'Jarraitu', tip: 'Urratsa ikusita: sakatu hurrengora pasatzeko · →', onClick: p.onContinue }
              : p.waiting
                ? { tone: 'timed', label: 'Hurrengoa', tip: 'Berez aurreratzen da; sakatu orain aurreratzeko · →', onClick: p.onContinue, seconds: p.waitSeconds ?? 1 }
                : { tone: 'plain', label: 'Hurrengoa', tip: 'Hurrengo urratsa · →', onClick: () => p.onBeat(1), disabled: atEnd };

  // Every step of the stage, invisible in the caption's cell so it keeps the stage's tallest height.
  // Built once per stage (the dock re-renders on every animation frame).
  const quick = p.mode === 'azkarra';
  const recall = !!p.onRecall;
  const extras = p.stepExtras;
  const sizers = useMemo(
    () =>
      showText &&
      beats.map((b, k) => (
        <div className="cap-sizer" key={k} aria-hidden inert>
          <Caption
            beat={b}
            quick={quick}
            stageId={p.stage.id}
            k={k}
            dates={extras?.[k]?.dates ?? []}
            onRecall={recall ? noop : undefined}
            terms={terms}
            onPick={noop}
            extra={(extras?.[k]?.fresh.length ?? 0) > 0 && <FreshChips items={extras![k].fresh} onPick={noop} />}
          />
        </div>
      )),
    [showText, beats, quick, p.stage.id, extras, recall, terms],
  );

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
      {/* The step's text takes the card's whole width: the pager lives in the control row below, so it
          never moves and the text wraps (and reserves) fewer lines. */}
      <div className="cap" aria-live="polite">
        <div className="cap-body">
          {!p.voice && p.voiceConfigured !== false && (
            <button className="voice-cta" onClick={() => p.onVoice(true)} title="Urrats bakoitza ahoz azaldu, irudiari begira">
              <IconVoice size={15} /> Ahotsarekin ikasi
            </button>
          )}
          {p.voice && !p.ask && <SpokenCaption beat={beat} audio={p.audioState} configured={p.voiceConfigured} fullText={fullText} onFullText={setFullText} onRepeat={p.onRepeat} onOff={() => p.onVoice(false)} />}
          {(p.ask || showText) && (
            // Every step of the stage sits invisibly in the same cell, so the card keeps the stage's
            // tallest height: the scene and the pager stay put from step to step.
            <div className="cap-stack" key={p.stage.id}>
              {sizers}
              {p.ask ?? (
                <Caption
                  beat={beat}
                  quick={quick}
                  stageId={p.stage.id}
                  k={p.activeBeat}
                  dates={p.dates ?? []}
                  onRecall={p.onRecall}
                  terms={terms}
                  onPick={p.onPick}
                  onTermHover={p.onTermHover}
                  extra={p.fresh.length > 0 && <FreshList items={p.fresh} onPick={p.onPick} k={`f-${p.stage.id}-${p.activeBeat}`} />}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="transport" data-tour="erreprodukzioa">
        {/* The stage's chapters run along the card's seam, one per step (like chapters on a video). */}
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
                className={`scrub-seg${k === p.activeBeat ? ' is-on' : k < p.activeBeat ? ' is-past' : ''}${hover?.k === k ? ' is-hover' : ''}`}
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
              <b>
                {pad(hover.k + 1)}
                <i>/{pad(n)}</i>
              </b>
              <span>{ideaOf(beats[hover.k])}</span>
            </span>
          )}
        </div>

        <div className="tp-bar">
          <div className="tp-buttons">
            <button className="tp-stage" onClick={() => p.onStage(-1)} disabled={p.stageIndex === 0} data-tip="Aurreko etapa · Shift + ←" data-tip-pos="top" aria-label="Aurreko etapa">
              <IconSkipPrev size={15} />
              <span>Etapa</span>
            </button>
            {/* Before the stage has started, the play key names itself: the one way in, never over the specimen. */}
            <button data-tour="play" className={`play${p.playing ? ' is-playing' : ''}${p.cue ? ' is-cue' : ''}`} onClick={p.onTogglePlay} data-tip={p.playing ? 'Pausatu · Zuriunea' : 'Erreproduzitu etapa · Zuriunea'} data-tip-pos="top" aria-label={p.playing ? 'Pausatu' : 'Erreproduzitu'}>
              {p.playing ? <IconPause size={16} /> : <IconPlay size={16} />}
              {p.cue && <span className="play-l">Erreproduzitu</span>}
            </button>
            <button className="tp-stage" onClick={() => p.onStage(1)} disabled={p.stageIndex === p.stageCount - 1} data-tip="Hurrengo etapa · Shift + →" data-tip-pos="top" aria-label="Hurrengo etapa">
              <span>Etapa</span>
              <IconSkipNext size={15} />
            </button>
          </div>

          {/* Where the playhead is: the step (the only step counter on screen) and the embryo's age. */}
          <p className="tp-read">
            <span className="tp-step" title={`${p.activeBeat + 1}. urratsa ${n}etik`}>
              Urratsa{' '}
              <b key={p.activeBeat} className="cap-tick">
                {p.activeBeat + 1}
              </b>
              <i>/{n}</i>
            </span>
            <span className="tp-tc" title="Garapenaren eguna">
              {p.day}
            </span>
          </p>

          <div className="tp-end">
            {/* How the stage plays, as one group: the voice on/off key and the mode sheet (mode, speed,
                voice, auto-continue, mini-questions). */}
            <div className="tp-group" role="group" aria-label="Erreprodukzioa">
            {p.voiceConfigured !== false && (
              <button
                className={`tp-voice${p.voice ? ' is-on' : ''}`}
                onClick={() => p.onVoice(!p.voice)}
                aria-pressed={p.voice}
                aria-label="Ahotsarekin ikasi"
                data-tip={p.voice ? 'Ahotsa itzali eta testuarekin jarraitu' : 'Ahotsarekin ikasi: urrats bakoitza ahoz azaldu, irudiari begira'}
                data-tip-pos="top"
              >
                <IconVoice size={15} />
                <span className="tp-voice-l">Ahotsa</span>
              </button>
            )}
            <Popover
              up
              className="tp-set"
              trigger={({ open, toggle }) => (
                <button className={`tp-set-btn${open ? ' is-on' : ''}`} onClick={toggle} aria-expanded={open} aria-haspopup="dialog" data-tip="Erreprodukzio modua, abiadura eta ahotsa · G" data-tip-pos="top-end">
                  <ModeIcon mode={p.mode} />
                  <span>{MODES.find((m) => m.id === p.mode)?.label}</span>
                  {p.speed !== 1 && <em>{p.speed}×</em>}
                  <IconChevron size={12} className="tp-set-caret" />
                </button>
              )}
            >
              {() => (
                <div className="menu tp-menu">
                  <p className="menu-h">Erreprodukzio modua</p>
                  <div role="radiogroup" aria-label="Erreprodukzio modua" className="tp-modes">
                    {MODES.map((m) => (
                      <button key={m.id} role="radio" aria-checked={p.mode === m.id} className={p.mode === m.id ? 'is-on' : ''} onClick={() => p.onMode(m.id)} title={m.title}>
                        <ModeIcon mode={m.id} />
                        <span>
                          <b>{m.label}</b>
                          <small>{m.hint}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <hr />
                  <div className="tp-row">
                    <span>Abiadura</span>
                    <span className="tp-speeds" role="radiogroup" aria-label="Abiadura">
                      {SPEEDS.map((v) => (
                        <button key={v} role="radio" aria-checked={p.speed === v} className={p.speed === v ? 'is-on' : ''} onClick={() => p.onSpeed(v)}>
                          {v}×
                        </button>
                      ))}
                    </span>
                  </div>
                  <button className="tp-row tp-switch" role="switch" aria-checked={p.voice} onClick={() => p.onVoice(!p.voice)}>
                    <span>
                      <IconVoice size={15} /> Ahotsarekin ikasi
                    </span>
                    <i aria-hidden />
                  </button>
                  <button className="tp-row tp-switch" role="switch" aria-checked={p.autoContinue} onClick={() => p.onAutoContinue(!p.autoContinue)} title="Etapa bukatzean hurrengora pasatzen da">
                    <span>
                      <IconLoop size={15} /> Etapak jarraian
                    </span>
                    <i aria-hidden />
                  </button>
                  {p.guided && (
                    <button className="tp-row tp-switch" role="switch" aria-checked={p.asks} onClick={() => p.onAsks(!p.asks)} title="Urrats bakoitzaren amaierako galdera txikia: piztuta, erantzun edo saltatu dezakezu; itzalita, urratsak jarraian doaz">
                      <span>
                        <IconQuiz size={15} /> Galdera txikiak
                      </span>
                      <i aria-hidden />
                    </button>
                  )}
                </div>
              )}
            </Popover>
            </div>

            {/* Step pager: one Next key whose state says what happens next, in the card's bottom-right
                corner at a fixed width, so it never moves under the pointer. */}
            <div className="tp-pager" role="group" aria-label="Urratsak">
              <button className="tp-prev" onClick={() => p.onBeat(-1)} aria-label="Aurreko urratsa" data-tip="Aurreko urratsa · ←" data-tip-pos="top">
                <IconPrev />
              </button>
              <button
                className={`cap-next${next.tone === 'go' ? ' is-wait' : next.tone === 'timed' ? ' is-timed' : next.tone === 'stage' ? ' is-stage' : ''}`}
                onClick={next.onClick}
                disabled={next.disabled}
                aria-label={next.seconds ? `${next.label} (${next.seconds} s barru)` : next.label}
                data-tip={next.tip}
                data-tip-pos="top-end"
              >
                {next.tone === 'go' && <span className="cap-wait-dot" aria-hidden />}
                <span>{next.label}</span>
                {next.seconds !== undefined && <em>{next.seconds} s</em>}
                <IconNext size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <nav className="mobile-study-nav" aria-label="Urratsen nabigazioa" data-tour="erreprodukzioa-mugikorra">
        <div className="mobile-study-status">
          <span>Urratsa {p.activeBeat + 1}/{n}</span>
          {p.ask && p.askState === 'open' && <span>Erantzun edo saltatu galdera</span>}
        </div>
        <div className="mobile-study-actions">
          <button className="btn" onClick={() => p.onBeat(-1)} disabled={p.activeBeat === 0 && p.t === 0}>
            <IconPrev size={15} /> Atzera
          </button>
          <button className="btn mobile-study-play" onClick={p.onTogglePlay} aria-label={p.playing ? 'Pausatu' : 'Erreproduzitu'}>
            {p.playing ? <IconPause size={16} /> : <IconPlay size={16} />}
            <span>{p.playing ? 'Pausatu' : 'Hasi'}</span>
          </button>
          <button className={`btn mobile-study-next${next.tone === 'go' ? ' is-go' : ''}`} disabled={next.disabled} onClick={next.onClick}>
            {next.label} <IconNext size={15} />
          </button>
        </div>
      </nav>
    </div>
  );
}

/**
 * Guided tour card, floating over the scene: the structure lit right now, in its colour, with its
 * definition. It sits on the viewport so the dock (and the scene size) does not jump while it runs.
 */
export function TourCard({ item, idx, n, onSkip, onPick, compact = false, side = 'left', kicker = 'Ezagutu egiturak' }: { item: StructureDef; idx: number; n: number; onSkip: () => void; onPick: (id: string) => void; compact?: boolean; side?: 'left' | 'right'; kicker?: string }) {
  return (
    <div className={`tour is-${side}`} role="status">
      <div className="tour-top">
        <span className="tour-kicker">
          {kicker} · {idx + 1}/{n}
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
          {!compact && item.es && <em>{item.es}</em>}
          {!compact && <span className="tour-def">{item.definition}</span>}
        </span>
      </button>
    </div>
  );
}

/**
 * Guided mode's check at the end of a step: one tap, then the reason, then on. It takes the caption's
 * place in the dock so the scene stays visible; answers are kept with the rest (`mikro:` ids). Skipping
 * one and going on are the pager's Next key ("Saltatu", then a lit "Jarraitu"); "Saltatu guztiak" turns
 * the questions off for every step at once.
 */
export function AskCard({ id, ask, onAnswer, onSkipAll }: { id: string; ask: MicroQuestion; onAnswer: () => void; onSkipAll?: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked === ask.answer;
  return (
    <div className="tour ask" role="dialog" aria-label="Galdera txikia">
      <div className="tour-top">
        <span className="tour-kicker">Egiaztatu · galdera txikia</span>
        {/* One press stops them all (not one "Saltatu" per step); the mode menu turns them back on. */}
        {onSkipAll && picked === null && (
          <button className="btn small ghost ask-skip-all" onClick={onSkipAll} title="Galdera txikirik gabe jarraitu urrats guztietan (moduaren menuan berriro piztu daitezke)">
            Saltatu guztiak <span aria-hidden>→</span>
          </button>
        )}
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
              onAnswer();
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
