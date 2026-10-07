'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import type { KimuReply, KimuTarget, Mood } from '@/lib/kimu/types';
import { IconClose, IconPlay } from '@/components/shell/icons';
import { KimuFace } from './KimuFace';
import { getKimuHere, kimuHost, onKimuOpen, openKimu, setKimuOpen, toggleKimu, useKimuHere, useKimuOpen } from './store';
import './kimu.css';

interface Msg {
  id: string;
  role: 'user' | 'kimu';
  text: string;
  targets?: KimuTarget[];
  followups?: string[];
  mood?: Mood;
  /** The question to ask again when the connection failed. */
  retry?: string;
}

const STORE = 'enbrioatlas:kimu';
const MET = 'enbrioatlas:kimu-met';
const MAX_MSGS = 20;

const WELCOME_ASKS = ['Noiz sortzen da notokorda?', 'Non ikusten da lerro primitiboa?', 'Zer dira somitak?', 'Nola ixten da hodi neurala?'];
const THINKING = ['Apunteak arakatzen…', 'Simulagailuan bila…', 'Pentsatzen…'];

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
  if (t.formation) { q.set('eraketa', t.formation); q.set('apunteak', '1'); }
  else if (t.structure) q.set('egitura', t.structure);
  if (t.view) q.set('ikuspegia', t.view);
  return `/astea/${t.week}?${q.toString()}`;
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
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
  </svg>
);

const Fresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
  </svg>
);

function GoCard({ t, primary, onGo }: { t: KimuTarget; primary: boolean; onGo: (t: KimuTarget) => void }) {
  return (
    <button type="button" className={`kimu-go${primary ? ' is-primary' : ''}`} onClick={() => onGo(t)}>
      <span className="kimu-go-ic">
        <IconPlay size={13} />
      </span>
      <span className="kimu-go-tx">
        <b>{t.label}</b>
        <small>{t.formation ? 'Eraketa ikusi · ' : 'Azalpena · '}{t.where}</small>
      </span>
      <span className="kimu-go-ar" aria-hidden>
        →
      </span>
    </button>
  );
}

export function Kimu() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useKimuOpen();
  const here = useKimuHere();
  const inSim = pathname.startsWith('/astea');

  // This tab's conversation. Only rendered once Kimu is opened, so reading storage here cannot mismatch the server.
  const [msgs, setMsgs] = useState<Msg[]>(readSaved);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [think, setThink] = useState(0);
  const [reveal, setReveal] = useState<{ id: string; n: number; len: number } | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  // In the simulator the nudge hangs under Kimu's top-bar button instead of the floating launcher.
  const [nudgeAt, setNudgeAt] = useState<{ x: number; y: number; tip: number } | null>(null);
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

  // A first-time nudge, once per session, until Kimu has been opened once.
  useEffect(() => {
    let timer = 0;
    try {
      if (window.localStorage.getItem(MET) || window.sessionStorage.getItem('enbrioatlas:kimu-nudged')) return;
    } catch {
      return;
    }
    const show = window.setTimeout(() => {
      setNudge(true);
      try {
        window.sessionStorage.setItem('enbrioatlas:kimu-nudged', '1');
      } catch {}
      timer = window.setTimeout(() => setNudge(false), 8000);
    }, 4500);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(timer);
    };
  }, []);

  // The nudge hangs over the view tabs: the student's first click or key anywhere puts it away.
  useEffect(() => {
    if (!nudge) return;
    const away = (e: Event) => {
      // A click on the nudge itself opens Kimu (its own handler).
      if (e.target instanceof Element && e.target.closest('.kimu-nudge')) return;
      setNudge(false);
    };
    window.addEventListener('pointerdown', away, true);
    window.addEventListener('keydown', away, true);
    return () => {
      window.removeEventListener('pointerdown', away, true);
      window.removeEventListener('keydown', away, true);
    };
  }, [nudge]);

  // Keep the in-simulator nudge under the top-bar button (and on screen) while it shows.
  useEffect(() => {
    if (!nudge || !inSim) return;
    const place = () => {
      // On narrow screens Kimu lives in the Tresnak menu, so the nudge points there instead.
      const own = document.querySelector('.kimu-tool')?.getBoundingClientRect();
      const r = own && own.width > 0 ? own : document.querySelector('button[aria-label="Tresnak"]')?.getBoundingClientRect();
      if (!r || r.width === 0) return setNudgeAt(null);
      const mid = r.left + r.width / 2;
      const x = Math.min(window.innerWidth - 120, Math.max(120, mid));
      setNudgeAt({ x, y: r.bottom + 10, tip: mid - x });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [nudge, inSim]);

  // Opening Kimu dismisses the nudge and the toast, however it was opened.
  useEffect(
    () =>
      onKimuOpen(() => {
        setNudge(false);
        setPeek(null);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(MET, '1');
    } catch {}
    void import('@/lib/kimu/engine');
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

  // The little toast that follows a jump fades on its own.
  useEffect(() => {
    if (!peek) return;
    const id = window.setTimeout(() => setPeek(null), 9000);
    return () => window.clearTimeout(id);
  }, [peek]);

  // Typewriter for a fresh answer; a click on the bubble skips it.
  useEffect(() => {
    if (!reveal) return;
    const id = window.setInterval(() => setReveal((r) => (r && r.n + 3 < r.len ? { ...r, n: r.n + 3 } : null)), 22);
    return () => window.clearInterval(id);
  }, [reveal]);

  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => setThink((n) => (n + 1) % THINKING.length), 1800);
    return () => window.clearInterval(id);
  }, [busy]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced.current ? 'auto' : 'smooth' });
  }, [msgs, busy, reveal?.n, open]);

  const go = useCallback(
    (t: KimuTarget) => {
      setKimuOpen(false);
      const host = kimuHost();
      if (host) host.go(t);
      else router.push(deepLink(t));
      setPeek(t.label);
    },
    [router],
  );

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.replace(/\s+/g, ' ').trim().slice(0, 400);
      if (!question || busy) return;
      const history = msgs.filter((m) => !m.retry).map((m) => ({ role: m.role, text: m.text }));
      setMsgs((m) => [...m.filter((x) => !x.retry), { id: uid(), role: 'user', text: question }]);
      setDraft('');
      if (inputRef.current) inputRef.current.style.height = '';
      setBusy(true);
      try {
        const { askKimu } = await import('@/lib/kimu/engine');
        const data = await askKimu(question, history, getKimuHere());
        const id = uid();
        setMsgs((m) => [...m, { id, role: 'kimu', text: data.reply, targets: data.targets, followups: data.followups, mood: data.mood }]);
        if (!reduced.current) setReveal({ id, n: 0, len: data.reply.length });
      } catch {
        setMsgs((m) => [...m, { id: uid(), role: 'kimu', text: 'Ups! Zerbait gaizki atera da. Saiatuko gara berriro?', mood: 'sorry', retry: question }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs],
  );

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
    setReveal(null);
    inputRef.current?.focus();
  };

  const lastKimu = [...msgs].reverse().find((m) => m.role === 'kimu');
  const talking = !!reveal;
  const mood: Mood = busy ? 'thinking' : (lastKimu?.mood ?? 'happy');
  const last = msgs[msgs.length - 1];
  const idle = !busy && !reveal;
  const asks = here ? ['Azaldu urrats hau', ...WELCOME_ASKS.slice(0, 3)] : WELCOME_ASKS;

  return (
    <>
      {!open && !inSim && (
        <div className="kimu-fab-wrap">
          {nudge && (
            <button type="button" className="kimu-nudge" onClick={openKimu}>
              Kaixo! Galderarik? 🌱
            </button>
          )}
          <button type="button" className="kimu-fab" onClick={openKimu} aria-label="Ireki Kimu, enbriologia-laguna" data-tip="Kimu · K" data-tip-pos="left">
            <KimuFace size={54} mood="happy" />
          </button>
        </div>
      )}

      {!open && inSim && nudge && nudgeAt && (
        <button type="button" className="kimu-nudge is-sim" style={{ left: nudgeAt.x, top: nudgeAt.y, '--nudge-tip': `calc(50% + ${Math.round(nudgeAt.tip)}px)` } as CSSProperties} onClick={openKimu}>
          Zalantzarik? Galdetu niri 🌱
        </button>
      )}

      {!open && peek && (
        <div className="kimu-peek" role="status">
          <KimuFace size={34} mood="proud" still />
          <span>
            Hemen gaude! <b>{peek}</b>
          </span>
          <button type="button" onClick={openKimu}>
            Galdetu gehiago
          </button>
          <button type="button" className="kimu-peek-x" onClick={() => setPeek(null)} aria-label="Itxi">
            <IconClose size={14} />
          </button>
        </div>
      )}

      {open && (
        <section className={`kimu-panel${inSim ? ' is-sim' : ''}`} role="dialog" aria-label="Kimu, enbriologia-laguna">
          <header className="kimu-head">
            <span className="kimu-head-face">
              <KimuFace size={46} mood={mood} talking={talking} />
            </span>
            <div className="kimu-head-tx">
              <b>Kimu</b>
              <small>{busy ? THINKING[think] : 'Zure enbriologia-laguna'}</small>
            </div>
            {msgs.length > 0 && (
              <button type="button" className="kimu-icon" onClick={reset} aria-label="Elkarrizketa berria" data-tip="Berria" data-tip-pos="bottom">
                <Fresh />
              </button>
            )}
            <button type="button" className="kimu-icon" onClick={() => setKimuOpen(false)} aria-label="Itxi" data-tip="Itxi · Esc" data-tip-pos="bottom">
              <IconClose size={16} />
            </button>
          </header>

          <div className="kimu-body" ref={bodyRef} aria-live="polite">
            {msgs.length === 0 ? (
              <div className="kimu-welcome">
                <KimuFace size={112} mood="happy" />
                <h2>Kaixo! Kimu naiz 🌱</h2>
                <p>Galdetu zer edo noiz sortzen den, eta simulagailuan azalpena hasten den unera eramango zaitut. Euskaraz, castellano edo English.</p>
                <div className="kimu-chips">
                  {asks.map((q) => (
                    <button key={q} type="button" onClick={() => void ask(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m) => {
                const typing = reveal?.id === m.id;
                const text = typing ? m.text.slice(0, reveal.n) : m.text;
                return m.role === 'user' ? (
                  <div key={m.id} className="kimu-msg is-user">
                    <p>{m.text}</p>
                  </div>
                ) : (
                  <div key={m.id} className="kimu-msg is-kimu">
                    <span className="kimu-av">
                      <KimuFace size={32} mood={m.mood ?? 'happy'} talking={typing} still={!typing} />
                    </span>
                    <div className="kimu-col">
                      <p onClick={() => typing && setReveal(null)}>
                        <Rich text={text} />
                        {typing && <i className="kimu-caret" aria-hidden />}
                      </p>
                      {!typing && m.targets && m.targets.length > 0 && (
                        <div className="kimu-targets">
                          {m.targets.map((t, i) => (
                            <GoCard key={t.id} t={t} primary={i === 0} onGo={go} />
                          ))}
                        </div>
                      )}
                      {!typing && m.retry && (
                        <button type="button" className="kimu-retry" onClick={() => void ask(m.retry!)}>
                          <Fresh /> Saiatu berriro
                        </button>
                      )}
                      {idle && m === last && m.followups && m.followups.length > 0 && (
                        <div className="kimu-chips is-inline">
                          {m.followups.map((q) => (
                            <button key={q} type="button" onClick={() => void ask(q)}>
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {busy && (
              <div className="kimu-msg is-kimu">
                <span className="kimu-av">
                  <KimuFace size={32} mood="thinking" still />
                </span>
                <div className="kimu-col">
                  <p className="kimu-dots" aria-label="Kimu pentsatzen ari da">
                    <i />
                    <i />
                    <i />
                  </p>
                </div>
              </div>
            )}
          </div>

          <form className="kimu-form" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              maxLength={400}
              placeholder="Galdetu edozer…"
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
          <p className="kimu-foot">IAk akatsak egin ditzake: egiaztatu apunteekin.</p>
        </section>
      )}
    </>
  );
}
