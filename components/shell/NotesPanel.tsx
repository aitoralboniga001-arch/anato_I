'use client';

import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { getWeek } from '@/content/registry';
import { blockText, expandNotes, firstAnchorInSection, notesOf, sectionConfig, sentenceAnchors, type NotesAnchor, type NotesBlock, type NotesPart } from '@/content/notes-text';
import type { StageDef } from '@/lib/sim/types';
import { IconClose, IconList, IconMoon, IconSun } from './icons';

/* ——— Reading preferences (text size, paper/dark), remembered per browser ——— */

const PREFS_KEY = 'enbrioatlas:notes-reading';
interface Reading {
  font: number;
  paper: boolean;
}
const DEFAULT_READING: Reading = { font: 16, paper: false };
const readingListeners = new Set<() => void>();
let reading: Reading | undefined;
const readReading = (): Reading => {
  if (!reading) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? 'null') as Partial<Reading> | null;
      reading = { font: Math.min(22, Math.max(13, Number(saved?.font) || 16)), paper: !!saved?.paper };
    } catch {
      reading = DEFAULT_READING;
    }
  }
  return reading;
};
const setReading = (next: Partial<Reading>) => {
  reading = { ...readReading(), ...next };
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(reading));
  } catch {
    // Storage unavailable: the setting lasts for this page only.
  }
  readingListeners.forEach((fn) => fn());
};
const subscribeReading = (fn: () => void) => {
  readingListeners.add(fn);
  return () => {
    readingListeners.delete(fn);
  };
};

/* ——— The document ——— */

const isHeading = (b: NotesBlock) => b.kind === 'h1' || b.kind === 'h2';
// List glyphs of the originals (kept verbatim, only hung in the margin).
const BULLET = /^([●•○◦▪➔\-–]​?\s*)/;

function Parts({ parts, hang }: { parts: NotesPart[]; hang?: boolean }) {
  return parts.map((p, i) => {
    let text: ReactNode = p.text;
    if (hang && i === 0) {
      const m = BULLET.exec(p.text);
      if (m) text = (
        <>
          <span className="notes-bullet">{m[1]}</span>
          {p.text.slice(m[1].length)}
        </>
      );
    }
    if (p.i) text = <em>{text}</em>;
    return p.b ? <strong key={i}>{text}</strong> : <span key={i}>{text}</span>;
  });
}

interface DocProps {
  week: number;
  blocks: NotesBlock[];
  /** Sentences of the current stage, the current step and the sentence being "read" now. */
  stageIds: Set<string>;
  activeKey: string;
  current: string | undefined;
  /** First sentence of each step of this stage → step numbers (shown as markers in the text). */
  markers: Map<string, number[]>;
  activeBeat: number;
}

/**
 * The original text, verbatim. Memoised and free of handlers (the panel delegates clicks and hovers),
 * so playback frames don't re-render ~200 sentences; it re-renders only when the step or the lit
 * sentence changes. DOM data attributes carry the sentence ids the sync uses.
 */
const NotesDoc = memo(function NotesDoc({ week, blocks, stageIds, activeKey, current, markers, activeBeat }: DocProps) {
  const active = new Set(activeKey ? activeKey.split('|') : []);
  return blocks.map((b) => {
    const config = sectionConfig(week, b.section);
    const uncovered = !!config?.note && !config.stages.length;
    const passage = b.sentences.some((s) => stageIds.has(s.id));
    const now = b.sentences.some((s) => active.has(s.id));
    const Tag = b.kind === 'title' ? 'h1' : b.kind === 'h1' ? 'h2' : b.kind === 'h2' ? 'h3' : 'p';
    const linked = b.kind === 'caption' && b.sentences.some((s) => sentenceAnchors.has(s.id));
    return (
      <div
        key={b.id}
        className={`notes-block notes-${b.kind}${passage ? ' is-passage' : ''}${now ? ' is-now' : ''}${uncovered ? ' is-uncovered' : ''}${b.kind === 'toc' && b.section.includes('.') ? ' is-sub' : ''}`}
        data-heading-section={isHeading(b) ? b.section : undefined}
      >
        {isHeading(b) && uncovered && <span className="notes-section-note">{config.note}</span>}
        <Tag>
          {b.kind === 'toc' && b.section !== 'intro' ? (
            <button className="notes-toc-link" data-goto-section={b.section}>
              <Parts parts={b.sentences.flatMap((s) => s.parts)} />
            </button>
          ) : (
            b.sentences.map((s) => {
              const steps = markers.get(s.id);
              const cls = `notes-s${sentenceAnchors.has(s.id) ? ' is-linked' : ''}${active.has(s.id) ? ' is-active' : ''}${s.id === current ? ' is-current' : ''}`;
              return (
                <span key={s.id} className={cls} data-sentence={s.id}>
                  {steps?.map((k) => (
                    <button key={k} className={`notes-step${k === activeBeat ? ' is-on' : ''}`} data-beat={k} aria-label={`${k + 1}. urratsa`}>
                      {String(k + 1).padStart(2, '0')}
                    </button>
                  ))}
                  <Parts parts={s.parts} hang={b.kind === 'li'} />
                </span>
              );
            })
          )}
          {linked && <span className="notes-caption-go">Simulazioan ikusi</span>}
        </Tag>
      </div>
    );
  });
});

/* ——— Panel ——— */

interface Props {
  week: number;
  stage: StageDef;
  activeBeat: number;
  /** 0..1 progress through the active step (which of its sentences is being read). */
  progress: number;
  /** Kimu keeps the reviewed formation passage visible while precursor steps play. */
  sourceBeat?: number;
  onGoto: (anchor: NotesAnchor) => void;
  onDismiss: () => void;
}

export function NotesPanel({ week, stage, activeBeat: playbackBeat, progress, sourceBeat, onGoto, onDismiss }: Props) {
  const activeBeat = sourceBeat ?? playbackBeat;
  const blocks = notesOf(week);
  const scroller = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const placed = useRef(false);
  const [follow, setFollow] = useState(true);
  // null until measured; '' while reading above the first heading (title page, index).
  const [readingSection, setReadingSection] = useState<string | null>(null);
  const [away, setAway] = useState<'up' | 'down' | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const { font, paper } = useSyncExternalStore(subscribeReading, readReading, () => DEFAULT_READING);

  const stageIds = useMemo(() => new Set(stage.beats.flatMap((b) => expandNotes(b.notes))), [stage]);
  const markers = useMemo(() => {
    // Each step is marked once, at its first sentence in reading order.
    const order = new Map(blocks.flatMap((b) => b.sentences).map((s, i) => [s.id, i] as const));
    const m = new Map<string, number[]>();
    stage.beats.forEach((b, k) => {
      const first = expandNotes(b.notes).sort((x, y) => (order.get(x) ?? 0) - (order.get(y) ?? 0))[0];
      if (first) m.set(first, [...(m.get(first) ?? []), k]);
    });
    return m;
  }, [blocks, stage]);
  const activeIds = useMemo(() => expandNotes(stage.beats[activeBeat]?.notes), [stage, activeBeat]);
  // The sentence the reader clicked (reading starts there, not at the top of the step).
  const [picked, setPicked] = useState<{ stageId: string; beat: number; id: string } | null>(null);
  // Sentences are lit in reading order as the step plays, never behind the one the reader picked.
  const current = (() => {
    if (!activeIds.length) return undefined;
    const played = sourceBeat !== undefined ? 0 : Math.min(activeIds.length - 1, Math.floor(Math.max(0, Math.min(0.999, progress)) * activeIds.length));
    const from = picked && picked.stageId === stage.id && picked.beat === activeBeat ? activeIds.indexOf(picked.id) : -1;
    return activeIds[Math.max(played, from)];
  })();
  const target = current ?? activeIds[0];
  const headings = useMemo(() => blocks.filter(isHeading), [blocks]);
  const activeSection = useMemo(() => blocks.find((b) => b.sentences.some((s) => s.id === activeIds[0]))?.section, [blocks, activeIds]);
  const section = readingSection ?? activeSection ?? '';

  const nodeOf = (id: string) => scroller.current?.querySelector<HTMLElement>(`[data-sentence="${CSS.escape(id)}"]`) ?? null;
  const offsetOf = (node: HTMLElement) => {
    const root = scroller.current!;
    return root.scrollTop + node.getBoundingClientRect().top - root.getBoundingClientRect().top;
  };
  const scrollToNode = (node: HTMLElement, smooth: boolean) => {
    const root = scroller.current;
    if (root) root.scrollTo({ top: Math.max(0, offsetOf(node) - root.clientHeight / 3), behavior: smooth ? 'smooth' : 'instant' });
  };

  // The measure runs a frame later, so it reads the lit sentence from a ref, never a stale render.
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  });

  /** On scroll: which section the reading line is in, and whether the lit passage is out of view. */
  const onScroll = () => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const root = scroller.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const line = box.top + root.clientHeight / 3 + 4;
      let seen = '';
      for (const el of root.querySelectorAll<HTMLElement>('[data-heading-section]')) {
        if (el.getBoundingClientRect().top <= line) seen = el.dataset.headingSection ?? '';
        else break;
      }
      setReadingSection(seen);
      const id = targetRef.current;
      const node = id ? root.querySelector<HTMLElement>(`[data-sentence="${CSS.escape(id)}"]`) : null;
      if (!node) return setAway(null);
      const r = node.getBoundingClientRect();
      setAway(r.bottom < box.top + 8 ? 'up' : r.top > box.bottom - 8 ? 'down' : null);
    });
  };
  const pauseFollow = () => setFollow(false);
  const resume = () => {
    setFollow(true);
    const node = target ? nodeOf(target) : null;
    if (node) scrollToNode(node, true);
  };

  // Follow the lit sentence: instantly when the panel opens, smoothly from step to step.
  useEffect(() => {
    if (!target) return;
    const node = nodeOf(target);
    if (!node) return;
    if (follow) {
      scrollToNode(node, placed.current);
      placed.current = true;
    }
    onScroll(); // re-check the section and whether the new step is out of view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, follow, stage]);
  // A reflow (window resize, focus mode, font size) moves the text: put the lit sentence back.
  const followRef = useRef(follow);
  useEffect(() => {
    followRef.current = follow;
  });
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    // Reflow = the text column changes height (width or font size); the panel's own height does not count.
    const doc = root.firstElementChild;
    let height = doc?.clientHeight ?? 0;
    const ro = new ResizeObserver(() => {
      if (!doc || doc.clientHeight === height) return;
      height = doc.clientHeight;
      const id = targetRef.current;
      const node = id ? root.querySelector<HTMLElement>(`[data-sentence="${CSS.escape(id)}"]`) : null;
      if (node && followRef.current) scrollToNode(node, false);
      onScroll();
    });
    if (doc) ro.observe(doc);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null; // a remount (Strict Mode, HMR) must be able to measure again
    },
    [],
  );

  // The index closes on Escape or a click anywhere outside it.
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setTocOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setTocOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [tocOpen]);

  const anchorOf = (id: string): NotesAnchor | undefined => {
    const refs = sentenceAnchors.get(id) ?? [];
    return refs.find((r) => r.week === week && r.stageId === stage.id && r.beat === activeBeat) ?? refs.find((r) => r.week === week && r.stageId === stage.id) ?? refs[0];
  };
  const describe = (ref: NotesAnchor) => {
    const s = getWeek(ref.week)?.stages.find((x) => x.id === ref.stageId);
    if (!s) return null;
    return ref.stageId === stage.id ? `${ref.beat + 1}/${s.beats.length}. urratsa` : `${s.title} · ${ref.beat + 1}/${s.beats.length}`;
  };
  const gotoSection = (to: string) => {
    setTocOpen(false);
    setFollow(false);
    const node = scroller.current?.querySelector<HTMLElement>(`[data-heading-section="${CSS.escape(to)}"]`);
    if (node) scroller.current!.scrollTo({ top: Math.max(0, offsetOf(node) - 12), behavior: 'smooth' });
    const ref = firstAnchorInSection(week, to);
    if (ref) onGoto(ref);
  };

  // Delegated handlers: the document itself stays memoised.
  const onClick = (e: ReactMouseEvent) => {
    const el = e.target as HTMLElement;
    const step = el.closest<HTMLElement>('[data-beat]');
    if (step) {
      setFollow(true);
      setPicked(null);
      return onGoto({ week, stageId: stage.id, beat: Number(step.dataset.beat) });
    }
    const sec = el.closest<HTMLElement>('[data-goto-section]');
    if (sec) return gotoSection(sec.dataset.gotoSection!);
    if (window.getSelection()?.toString()) return; // selecting text to copy, not jumping
    const s = el.closest<HTMLElement>('[data-sentence]');
    const ref = s && anchorOf(s.dataset.sentence!);
    if (ref) {
      setFollow(true);
      setPicked({ stageId: ref.stageId, beat: ref.beat, id: s.dataset.sentence! });
      onGoto(ref);
    }
  };
  const onOver = (e: ReactMouseEvent) => {
    const el = e.target as HTMLElement;
    const step = el.closest<HTMLElement>('[data-beat]');
    if (step) return setHint(`Joan ${Number(step.dataset.beat) + 1}. urratsera`);
    if (el.closest('[data-goto-section]')) return setHint('Joan atal honetara');
    const s = el.closest<HTMLElement>('[data-sentence]');
    const ref = s && anchorOf(s.dataset.sentence!);
    setHint(ref ? describe(ref) : null);
  };

  const crumbs = (() => {
    const top = headings.find((h) => h.kind === 'h1' && h.section === section.split('.')[0]);
    const sub = section.includes('.') ? headings.find((h) => h.section === section) : undefined;
    return [top, sub].filter((h): h is NotesBlock => !!h).map(blockText);
  })();

  return (
    <div className={`notes-panel${paper ? ' is-paper' : ''}`} style={{ '--notes-font': `${font}px` } as CSSProperties}>
      <div className="notes-head">
        <div className="notes-name">
          <strong>Apunteak</strong>
          <small>{week}. gaia · jatorrizko testua</small>
        </div>
        <div className="notes-tools">
          <button className="icon-btn notes-size" onClick={() => setReading({ font: font - 1 })} disabled={font <= 13} aria-label="Letra txikiagoa" data-tip="Letra txikiagoa" data-tip-pos="bottom">
            A<sup>−</sup>
          </button>
          <button className="icon-btn notes-size" onClick={() => setReading({ font: font + 1 })} disabled={font >= 22} aria-label="Letra handiagoa" data-tip="Letra handiagoa" data-tip-pos="bottom">
            A<sup>+</sup>
          </button>
          <button className="icon-btn" onClick={() => setReading({ paper: !paper })} aria-pressed={paper} aria-label={paper ? 'Itxura iluna' : 'Paper itxura'} data-tip={paper ? 'Itxura iluna' : 'Paper itxura'} data-tip-pos="bottom">
            {paper ? <IconMoon size={16} /> : <IconSun size={16} />}
          </button>
          <button className="icon-btn" onClick={onDismiss} aria-label="Apunteak itxi" data-tip="Apunteak itxi · N" data-tip-pos="bottom-end">
            <IconClose size={16} />
          </button>
        </div>
      </div>

      <div className="notes-bar" ref={bar}>
        <button className={`notes-toc-btn${tocOpen ? ' is-on' : ''}`} onClick={() => setTocOpen((v) => !v)} aria-expanded={tocOpen} aria-label="Aurkibidea">
          <IconList size={15} />
        </button>
        <p className="notes-crumbs" title={crumbs.join(' › ')}>
          {crumbs.length ? crumbs.map((c, i) => <span key={i}>{c}</span>) : <span>{week}. gaia</span>}
        </p>
        {tocOpen && (
          <nav className="notes-toc-pop" aria-label="Apunteen aurkibidea">
            {headings.map((h) => {
              const config = sectionConfig(week, h.section);
              const off = !!config?.note && !config.stages.length;
              return (
                <button key={h.id} className={`${h.kind === 'h2' ? 'is-sub' : ''}${h.section === section ? ' is-on' : ''}${off ? ' is-off' : ''}`} onClick={() => gotoSection(h.section)}>
                  {blockText(h)}
                  {h.section === activeSection && <i aria-label="Simulazioa hemen dago" />}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {!activeIds.length && <p className="notes-unmapped">Urrats honen xehetasuna ez dago gai honetako jatorrizko apunteetan.</p>}

      <div
        ref={scroller}
        className="notes-scroll"
        onScroll={onScroll}
        onScrollEnd={onScroll}
        onWheel={pauseFollow}
        onTouchMove={pauseFollow}
        onClick={onClick}
        onMouseOver={onOver}
        onMouseLeave={() => setHint(null)}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) pauseFollow(); // scrollbar drag
        }}
        onKeyDown={(e) => {
          if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
            e.stopPropagation();
            pauseFollow();
          }
        }}
        tabIndex={0}
        aria-label="Jatorrizko apunteak"
      >
        <div className="notes-doc">
          <NotesDoc week={week} blocks={blocks} stageIds={stageIds} activeKey={activeIds.join('|')} current={current} markers={markers} activeBeat={activeBeat} />
        </div>
      </div>

      {!follow && away && (
        <button className="notes-follow" onClick={resume}>
          <span aria-hidden>{away === 'up' ? '↑' : '↓'}</span> Unekora itzuli
        </button>
      )}
      <p className={`notes-hint${hint ? ' is-on' : ''}`} aria-live="polite">
        {hint ? (
          <>
            <span aria-hidden>▶</span> {hint}
          </>
        ) : (
          'Klikatu esaldi bat simulazioan ikusteko'
        )}
      </p>
    </div>
  );
}
