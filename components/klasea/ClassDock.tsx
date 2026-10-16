'use client';

import { useState } from 'react';
import { MODES, ModeIcon } from '@/components/shell/Player';
import { Popover } from '@/components/shell/Popover';
import { IconChevron, IconNext, IconPause, IconPlay, IconPrev } from '@/components/shell/icons';
import type { PlayMode } from '@/components/shell/prefs';
import { stepsOf } from '@/lib/klasea/engine';
import type { Lesson, Tone } from '@/lib/klasea/types';
import { speakSeconds, voiceSupported } from '@/lib/klasea/voice';
import { ClassCheck } from './ClassCheck';
import { Board } from './Board';
import { Sheet } from './Sheet';
import type { Klasea } from './useKlasea';
import styles from './klasea.module.css';

/**
 * The class's dock, in place of the player: the line being said (the subtitle), the check when one is
 * asked, and the controls. Kimu itself is in the scene (KimuWalker), not here. Before the class, the
 * start card; after it, the end card with the chunks to review and the summary sheet.
 */

const TONE: Partial<Record<Tone, string>> = { emphasis: 'Garrantzitsua', caution: 'Kontuz', why: 'Zergatik', recall: 'Gogoratu', summary: 'Laburpena' };

const VOICE_KIND: Record<string, string> = { eu: 'euskarazko ahotsa', es: 'gaztelaniazkoa, euskaraz irakurtzen' };

/** About how long the class takes: its speech, its pauses, and some 20 s per check. */
export const classMinutes = (lesson: Lesson) => {
  const secs = lesson.chunks.reduce((s, c) => s + c.lines.reduce((a, l) => a + speakSeconds(l.say) + 0.6 + (l.hold ?? 0), 0) + (c.checks?.length ?? 0) * 20, 0);
  return Math.round(secs / 60);
};

export function ClassDock({ k, mode, onMode, holdReason, onAskKimu }: {
  k: Klasea;
  mode: PlayMode;
  onMode: (m: PlayMode) => void;
  /** Why the class is held (a structure opened, Kimu's chat open), shown while it waits. */
  holdReason: string | null;
  onAskKimu: () => void;
}) {
  const { lesson, cmd, state } = k;
  const [sheet, setSheet] = useState(false);

  const minutes = classMinutes(lesson);
  const steps = stepsOf(lesson);
  const checkCount = steps.filter((s) => s.kind === 'check').length;

  const sheetEl = sheet && (
    <Sheet
      lesson={lesson}
      weak={state.weak}
      onClose={() => setSheet(false)}
      onReview={(i) => {
        setSheet(false);
        k.chunk(i);
      }}
    />
  );

  if (k.status === 'card') {
    const saved = k.saved ? lesson.chunks.findIndex((c) => c.id === k.saved!.chunk) : -1;
    const linked = k.linkSaved >= 0 ? k.linkSaved : k.linkChunk;
    return (
      <section className={`dock ${styles.dock} ${styles.card}`} aria-label="Klasea">
        <div className={styles.cardBody}>
          <span className={styles.kicker}>Klasea · Kimu irakasle</span>
          <h2>{lesson.title}</h2>
          <p>Kimuk funtsezkoa azalduko dizu ahoz, eszenari begira, eta arbelean idatziko du. Bidean {checkCount} galdera labur. Ohar guztiak Simulazioan daude.</p>
          <div className={styles.cardActions}>
            {linked !== null && linked > 0 && (
              <button className="btn primary" onClick={() => k.start(linked)} autoFocus>
                Klasea hemendik · {linked + 1}. {lesson.chunks[linked].title}
              </button>
            )}
            {saved > 0 && linked === null && (
              <button className="btn primary" onClick={k.resumeSaved} autoFocus>
                Jarraitu · {saved + 1}. {lesson.chunks[saved].title}
              </button>
            )}
            <button className={`btn${(saved > 0 && linked === null) || (linked !== null && linked > 0) ? '' : ' primary'}`} onClick={() => k.start()}>
              Hasi klasea · {minutes} min
            </button>
            <button className="btn ghost" onClick={() => onMode('arrunta')} title="Simulazioa ohar guztiekin, klaserik gabe">
              Simulazioa bakarrik
            </button>
          </div>
          {!voiceSupported() && <p className={styles.note}>Nabigatzaile honek ez du ahotsik: azpitituluekin jarraituko duzu.</p>}
        </div>
      </section>
    );
  }

  if (k.status === 'done') {
    return (
      <section className={`dock ${styles.dock} ${styles.card}`} aria-label="Klasea amaituta">
        <div className={styles.cardBody}>
          <span className={styles.kicker}>Klasea amaituta</span>
          <h2>Ondo egina!</h2>
          {state.weak.length ? (
            <>
              <p>Zati hauek berriro ikustea merezi du:</p>
              <ul className={styles.weakList}>
                {state.weak.map((id) => {
                  const i = lesson.chunks.findIndex((c) => c.id === id);
                  return (
                    <li key={id}>
                      <span>{i + 1}. {lesson.chunks[i]?.title}</span>
                      <button className="btn small" onClick={() => k.chunk(i)}>Errepasatu zati hau</button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p>Galdera guztiak lehen saiakeran. Bihar errepasatu: Galderak atalean berriro aterako zaizkizu.</p>
          )}
          <div className={styles.cardActions}>
            <button className="btn primary" onClick={() => setSheet(true)}>Laburpen-orria</button>
            <button className="btn" onClick={k.restart}>Berriro hasi</button>
            <button className="btn ghost" onClick={() => onMode('arrunta')}>Simulazioa libre</button>
          </div>
        </div>
        {sheetEl}
      </section>
    );
  }

  const asking = state.phase === 'ask' || state.phase === 'feedback';
  const tone = cmd.line ? TONE[cmd.tone] : null;
  const paused = k.paused && !asking;

  return (
    <section className={`dock ${styles.dock}${asking ? ` ${styles.asking}` : ''}`} aria-label="Klasea" data-tone={cmd.line ? cmd.tone : undefined}>
      <div className={styles.progress} aria-hidden>
        <span style={{ transform: `scaleX(${cmd.progress})` }} />
      </div>
      <div className={styles.main}>
        <div className={styles.say}>
          <div className={styles.sayTop}>
            <span className={styles.chunkTag}>
              {cmd.chunkIndex + 1}/{lesson.chunks.length} · {cmd.chunk.title}
            </span>
            {tone && !asking && <span className={`${styles.tone} ${styles[`tone_${cmd.tone}`] ?? ''}`}>{tone}</span>}
            {state.plain && cmd.line && !asking && <span className={styles.tone}>Errazago</span>}
            {paused && <span className={styles.pausedTag}>{holdReason ?? 'Pausatuta · Zuriunea'}</span>}
          </div>
          {asking && cmd.check ? (
            <ClassCheck
              key={state.step}
              check={cmd.check}
              lesson={lesson}
              answered={state.phase === 'feedback'}
              onAnswer={k.answered}
              onContinue={k.cont}
              onLight={k.setCheckFocus}
            />
          ) : (
            <p key={`${state.step}/${state.plain}`} className={`${styles.subtitle}${state.phase === 'move' ? ` ${styles.coming}` : ''}`} aria-live="polite">
              {cmd.text}
            </p>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.transport}>
          <button className={styles.icon} onClick={k.back} aria-label="Aurreko esaldia" data-tip="Aurreko esaldia · ←" data-tip-pos="top">
            <IconPrev size={16} />
          </button>
          <button className={`${styles.icon} ${styles.play}`} onClick={k.togglePause} disabled={asking} aria-label={k.userPaused ? 'Jarraitu' : 'Pausatu'} data-tip={`${k.userPaused ? 'Jarraitu' : 'Pausatu'} · Zuriunea`} data-tip-pos="top">
            {k.userPaused ? <IconPlay size={14} /> : <IconPause size={14} />}
          </button>
          <button className={styles.icon} onClick={k.next} disabled={asking && state.phase === 'ask'} aria-label="Hurrengoa" data-tip="Hurrengoa · →" data-tip-pos="top">
            <IconNext size={16} />
          </button>
        </div>
        <button
          className={`btn small${state.plain ? ' primary' : ''}`}
          onClick={() => {
            if (k.notUnderstood() === 'kimu') onAskKimu();
          }}
          disabled={!cmd.line && !asking}
          data-tip={state.plain ? 'Oraindik ez? Galdetu Kimuri txatean' : 'Errazago esan eta eszena berriro erakutsi'}
          data-tip-pos="top"
        >
          {state.plain ? 'Galdetu Kimuri' : 'Ez dut ulertu'}
        </button>
        <span className={styles.grow} />
        <button className="btn small ghost" onClick={() => { k.pause(); setSheet(true); }}>
          Laburpen-orria
        </button>
        <Popover
          up
          align="end"
          trigger={({ open, toggle }) => (
            <button className={`tp-set-btn${open ? ' is-on' : ''}`} onClick={toggle} aria-expanded={open} aria-haspopup="dialog" data-tip="Modua, abiadura eta ahotsa · G" data-tip-pos="top-end">
              <ModeIcon mode={mode} />
              <span>Klasea</span>
              {k.rate !== 1 && <em>{k.rate}×</em>}
              <IconChevron size={12} className="tp-set-caret" />
            </button>
          )}
        >
          {() => (
            <div className="menu tp-menu">
              <p className="menu-h">Erreprodukzio modua</p>
              <div role="radiogroup" aria-label="Erreprodukzio modua" className="tp-modes">
                {MODES.map((m) => (
                  <button key={m.id} role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'is-on' : ''} onClick={() => onMode(m.id)} title={m.title}>
                    <ModeIcon mode={m.id} />
                    <span>
                      <b>{m.id === 'gidatua' ? 'Gidatua: klasea' : m.label}</b>
                      <small>{m.id === 'gidatua' ? 'Kimuk funtsezkoa azaltzen du ahoz, arbelarekin eta galdera laburrekin' : m.hint}</small>
                    </span>
                  </button>
                ))}
              </div>
              <hr />
              <div className="tp-row">
                <span>Abiadura</span>
                <span className="tp-speeds" role="radiogroup" aria-label="Abiadura">
                  {k.rates.map((v) => (
                    <button key={v} role="radio" aria-checked={k.rate === v} className={k.rate === v ? 'is-on' : ''} onClick={() => k.setRate(v)}>
                      {v}×
                    </button>
                  ))}
                </span>
              </div>
              {k.voices.length > 0 && (
                <>
                  <hr />
                  <p className="menu-h">Ahotsa</p>
                  <div role="radiogroup" aria-label="Ahotsa" className="tp-modes">
                    {k.voices.slice(0, 6).map((c) => (
                      <button key={c.voice.name} role="radio" aria-checked={k.choice?.voice.name === c.voice.name} className={k.choice?.voice.name === c.voice.name ? 'is-on' : ''} onClick={() => k.useVoice(c)}>
                        <span>
                          <b>{c.voice.name.replace(/^Microsoft\s+/, '').replace(/\s+-\s+.*$/, '')}</b>
                          <small>
                            {VOICE_KIND[c.kind] ?? c.kind}
                            {c.voice.localService ? '' : ' · sarean'}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {k.fellBack && <p className={styles.note}>Aurreko ahotsak huts egin du; {k.choice ? k.choice.voice.name : 'azpitituluak'} erabiltzen.</p>}
            </div>
          )}
        </Popover>
      </div>

      <div className={styles.stripWrap}>
        <Board lesson={lesson} cmd={cmd} running weak={state.weak} onChunk={k.chunk} compact />
      </div>
      {sheetEl}
    </section>
  );
}
