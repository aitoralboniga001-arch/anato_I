'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { KimuPractice, KimuReply, KimuSource, KimuTarget } from '@/lib/kimu/types';
import { recordAnswer, useAnswers } from '@/components/shell/answers';
import { IconClose, IconPlay } from '@/components/shell/icons';
import { KimuFace } from './KimuFace';
import { getKimuHere, kimuHost, setKimuOpen, toggleKimu, useKimuHere, useKimuOpen } from './store';
import './kimu.css';

interface Msg {
  id: string;
  role: 'user' | 'kimu';
  text: string;
  targets?: KimuTarget[];
  sources?: KimuSource[];
  lineage?: KimuReply['lineage'];
  followups?: string[];
  practice?: KimuPractice[];
  /** The option picked for each practice question (null = not answered yet). */
  picked?: (number | null)[];
  from?: KimuReply['source'];
  /** The question to ask again when something failed. */
  retry?: string;
}

const STORE = 'enbrioatlas:kimu:v2';
const MAX_MSGS = 20;

/** First questions: what students actually ask, answered straight from the notes. */
const HOME_ASKS = ['Zein atalek osatzen dute diafragma?', 'Noiz ixten da hodi neurala?', 'Nondik datoz somitak?', 'Galdetu niri'];
const SIM_ASKS = ['Azaldu urrats hau', 'Zergatik gertatzen da hau?', 'Galdetu niri urrats honi buruz'];

const readSaved = (): Msg[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORE) ?? '[]') as Msg[];
    return Array.isArray(saved) ? saved.slice(-MAX_MSGS) : [];
  } catch {
    return [];
  }
};

const uid = () => Math.random().toString(36).slice(2, 9);

const deepLink = (t: KimuTarget) => {
  const q = new URLSearchParams({ etapa: t.stage, une: String(Math.min(1, t.at + 0.001)) });
  if (t.formation) {
    q.set('eraketa', t.formation);
    q.set('apunteak', '1');
  } else if (t.structure) q.set('egitura', t.structure);
  if (t.notes) q.set('apunteak', '1');
  if (t.view) q.set('ikuspegia', t.view);
  return `/astea/${t.week}?${q.toString()}`;
};

/** Load the engine and build its indexes before the first question, when the browser is idle. */
let warming: Promise<unknown> | null = null;
const warm = () => {
  warming ??= import('@/lib/kimu/engine').then((m) => {
    const run = () => m.warmKimu();
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 300);
  });
  return warming;
};

/** **bold** is the only formatting Kimu uses. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (
        <Fragment key={i}>{i % 2 ? <strong>{part}</strong> : part}</Fragment>
      ))}
    </>
  );
}

const Send = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
  </svg>
);

const Fresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
  </svg>
);

function GoCard({ t, primary, onGo }: { t: KimuTarget; primary: boolean; onGo: (t: KimuTarget) => void }) {
  return (
    <button type="button" className={`kimu-go${primary ? ' is-primary' : ''}`} onClick={() => onGo(t)}>
      <span className="kimu-go-ic">
        <IconPlay size={11} />
      </span>
      <span className="kimu-go-tx">
        <b>{t.label}</b>
        <small>
          {t.formation ? 'Eraketa ikusi' : t.notes ? 'Urratsa eta apunteak' : 'Azalpena'} · {t.where}
        </small>
      </span>
    </button>
  );
}

function Source({ s, onGo }: { s: KimuSource; onGo: (t: KimuTarget) => void }) {
  return (
    <figure className="kimu-src">
      <figcaption>
        <span className="kimu-src-k">Apunteak</span>
        <span className="kimu-src-ref">{s.ref}</span>
      </figcaption>
      {s.quote && <blockquote>{s.quote}</blockquote>}
      {s.open && (
        <button type="button" className="kimu-src-open" onClick={() => onGo(s.open!)}>
          Ireki apunteetan <span aria-hidden>→</span>
        </button>
      )}
    </figure>
  );
}

/** One practice question at a time; the answer goes to the same history as the Galderak panel. */
function Practice({ m, onPick, onMore }: { m: Msg; onPick: (msg: string, i: number, option: number) => void; onMore: () => void }) {
  const items = m.practice!;
  const picked = m.picked ?? items.map(() => null);
  const at = picked.findIndex((p) => p === null);
  const shown = at === -1 ? items.length - 1 : at;
  const right = picked.filter((p, i) => p !== null && p === items[i].answer).length;
  const [open, setOpen] = useState(shown);
  const i = Math.min(open, items.length - 1);
  const q = items[i];
  const choice = picked[i];
  const done = at === -1;
  return (
    <div className="kimu-quiz" aria-live="polite">
      <p className="kimu-quiz-k">
        Galdera {i + 1}/{items.length}
      </p>
      <p className="kimu-quiz-q">{q.question}</p>
      <div className="kimu-quiz-opts" role="group" aria-label="Aukerak">
        {q.options.map((o, k) => {
          const state = choice === null ? '' : k === q.answer ? ' is-right' : k === choice ? ' is-wrong' : ' is-dim';
          return (
            <button key={k} type="button" className={`kimu-opt${state}`} disabled={choice !== null} onClick={() => onPick(m.id, i, k)}>
              {o}
            </button>
          );
        })}
      </div>
      {choice !== null && (
        <div className={`kimu-quiz-why${choice === q.answer ? ' is-right' : ' is-wrong'}`}>
          <b>{choice === q.answer ? 'Ondo.' : 'Ez da hori.'}</b> {q.why?.[choice] && choice !== q.answer ? `${q.why[choice]} ` : ''}
          {q.why?.[q.answer] ?? q.explanation}
        </div>
      )}
      {choice !== null && i < items.length - 1 && (
        <button type="button" className="kimu-quiz-next" onClick={() => setOpen(i + 1)}>
          Hurrengo galdera <span aria-hidden>→</span>
        </button>
      )}
      {done && i === items.length - 1 && (
        <div className="kimu-quiz-end">
          <span>
            {right}/{items.length} ondo · Galderak ataleko errepasoan gordeta
          </span>
          <button type="button" onClick={onMore}>
            Beste hiru
          </button>
        </div>
      )}
    </div>
  );
}

export function Kimu() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useKimuOpen();
  const here = useKimuHere();
  const answers = useAnswers();
  const inSim = pathname.startsWith('/astea');

  // This tab's conversation. Only rendered once Kimu is opened, so reading storage here cannot mismatch the server.
  const [msgs, setMsgs] = useState<Msg[]>(readSaved);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-MAX_MSGS)));
    } catch {}
  }, [msgs]);

  // In the simulator Kimu is one key away: get the notes ready while the student watches.
  useEffect(() => {
    if (!inSim) return;
    const id = window.setTimeout(() => void warm(), 4000);
    return () => window.clearTimeout(id);
  }, [inSim]);

  useEffect(() => {
    if (!open) return;
    void warm();
    const id = window.setTimeout(() => {
      if (!window.matchMedia('(pointer: coarse)').matches) inputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(id);
  }, [open]);

  // K opens and closes Kimu, Esc closes it.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
      if (e.key === 'Escape' && !typing) setKimuOpen(false);
      else if (e.key.toLowerCase() === 'k' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleKimu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced.current ? 'auto' : 'smooth' });
  }, [msgs, busy, open]);

  const go = useCallback(
    (t: KimuTarget) => {
      setKimuOpen(false);
      const host = kimuHost();
      if (host) host.go(t);
      else router.push(deepLink(t));
    },
    [router],
  );

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.replace(/\s+/g, ' ').trim().slice(0, 400);
      if (!question || busy) return;
      const history = msgs.filter((m) => !m.retry && !m.practice).map((m) => ({ role: m.role, text: m.text }));
      setMsgs((m) => [...m.filter((x) => !x.retry), { id: uid(), role: 'user', text: question }]);
      setDraft('');
      if (inputRef.current) inputRef.current.style.height = '';
      setBusy(true);
      try {
        const { askKimu } = await import('@/lib/kimu/engine');
        const r = await askKimu(question, history, getKimuHere(), { answers });
        setMsgs((m) => [
          ...m,
          { id: uid(), role: 'kimu', text: r.reply, targets: r.targets, sources: r.sources, lineage: r.lineage, followups: r.followups, practice: r.practice, picked: r.practice?.map(() => null), from: r.source },
        ]);
      } catch {
        setMsgs((m) => [...m, { id: uid(), role: 'kimu', text: 'Ezin izan dut erantzuna prestatu. Saiatu berriro?', retry: question }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs, answers],
  );

  const pick = (id: string, i: number, option: number) => {
    setMsgs((all) =>
      all.map((m) => {
        if (m.id !== id || !m.practice) return m;
        const q = m.practice[i];
        const picked = [...(m.picked ?? m.practice.map(() => null))];
        if (picked[i] !== null) return m;
        picked[i] = option;
        recordAnswer(q.id, option === q.answer, q.options[option]);
        return { ...m, picked };
      }),
    );
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    void ask(draft);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(96, el.scrollHeight)}px`;
  };
  const reset = () => {
    setMsgs([]);
    inputRef.current?.focus();
  };

  const last = msgs[msgs.length - 1];
  const asks = inSim && here ? SIM_ASKS : HOME_ASKS;
  const usedModel = msgs.some((m) => m.from === 'ai');

  return (
    <>
      {!open && !inSim && (
        <button type="button" className="kimu-launch" data-tour="kimu" onClick={() => setKimuOpen(true)} onPointerEnter={() => void warm()} onFocus={() => void warm()} aria-label="Galdetu Kimuri (K)">
          <KimuFace size={16} still />
          <span>Galdetu</span>
          <kbd aria-hidden>K</kbd>
        </button>
      )}

      {open && (
        <section className={`kimu-panel${inSim ? ' is-sim' : ''}`} role="dialog" aria-label="Kimu, apunteetako laguna">
          <header className="kimu-head">
            <span className="kimu-head-mark">
              <KimuFace size={18} mood={busy ? 'thinking' : 'happy'} />
            </span>
            <div className="kimu-head-tx">
              <b>Kimu</b>
              <small>{busy ? 'Apunteak arakatzen…' : 'Apunteetatik erantzuten du'}</small>
            </div>
            {msgs.length > 0 && (
              <button type="button" className="kimu-icon" onClick={reset} aria-label="Elkarrizketa berria" data-tip="Berria" data-tip-pos="bottom">
                <Fresh />
              </button>
            )}
            <button type="button" className="kimu-icon" onClick={() => setKimuOpen(false)} aria-label="Itxi" data-tip="Itxi · Esc" data-tip-pos="bottom">
              <IconClose size={15} />
            </button>
          </header>

          <div className="kimu-body" ref={bodyRef} aria-live="polite">
            {msgs.length === 0 ? (
              <div className="kimu-welcome">
                <h2>Galdetu apunteei</h2>
                <p>
                  Erantzuna zure apunteetatik dator, gaiaren eta atalaren zenbakiarekin, eta simulagailuan non ikusten den erakusten dizut. {inSim ? 'Pantailan duzun urratsa ere badakit.' : ''}
                </p>
                <div className="kimu-chips">
                  {asks.map((q) => (
                    <button key={q} type="button" onClick={() => void ask(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="kimu-msg is-user">
                    <p>{m.text}</p>
                  </div>
                ) : (
                  <div key={m.id} className="kimu-msg is-kimu">
                    <p className="kimu-answer">
                      <Rich text={m.text} />
                    </p>
                    {m.practice && m.practice.length > 0 && <Practice m={m} onPick={pick} onMore={() => void ask(inSim ? 'Galdetu niri urrats honi buruz' : 'Galdetu niri')} />}
                    {m.lineage && (
                      <p className="kimu-line">
                        <span>{m.lineage.kind === 'from' ? 'Leinua' : 'Eratorriak'}</span>
                        {m.lineage.names.join(m.lineage.kind === 'from' ? ' → ' : ' · ')}
                      </p>
                    )}
                    {m.sources?.map((s) => <Source key={`${s.ref}${s.quote}`} s={s} onGo={go} />)}
                    {m.targets && m.targets.length > 0 && (
                      <div className="kimu-targets">
                        {m.targets.map((t, i) => (
                          <GoCard key={t.id} t={t} primary={i === 0} onGo={go} />
                        ))}
                      </div>
                    )}
                    {m.retry && (
                      <button type="button" className="kimu-retry" onClick={() => void ask(m.retry!)}>
                        <Fresh /> Saiatu berriro
                      </button>
                    )}
                    {!busy && m === last && m.followups && m.followups.length > 0 && (
                      <div className="kimu-chips is-inline">
                        {m.followups.map((q) => (
                          <button key={q} type="button" onClick={() => void ask(q)}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )
            )}
            {busy && (
              <div className="kimu-msg is-kimu">
                <p className="kimu-dots" aria-label="Kimu apunteak arakatzen ari da">
                  <i />
                  <i />
                  <i />
                </p>
              </div>
            )}
          </div>

          <form className="kimu-form" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              maxLength={400}
              placeholder="Galdetu apunteei buruz…"
              aria-label="Zure galdera Kimuri"
              onChange={(e) => {
                setDraft(e.target.value);
                grow(e.target);
              }}
              onKeyDown={onKeyDown}
            />
            <button type="submit" className="kimu-send" disabled={busy || !draft.trim()} aria-label="Bidali">
              <Send />
            </button>
          </form>
          <p className="kimu-foot">{usedModel ? 'IAk apunteetan oinarrituta idazten du: egiaztatu iturria.' : 'Euskaraz, gaztelaniaz edo ingelesez · K irekitzeko eta ixteko'}</p>
        </section>
      )}
    </>
  );
}
