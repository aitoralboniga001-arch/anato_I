'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { CARD_TAGS, type Card, type CardTag } from '@/content/eratorriak/cards12';
import { ArchLadder } from './ArchLadder';
import styles from './eratorriak.module.css';

/**
 * Anki-like cards: question, think, turn, grade. Each card sits in a box (0–4): "Ez nekien" sends it back
 * to box 0 and a few cards later in this round; "Banekien" moves it up and out of the round. The boxes are
 * a per-browser convenience (localStorage), so a fresh browser simply starts every card at box 0.
 */

const KEY = 'enbrioatlas:fitxak-12';
const MAX_BOX = 4;

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}
function save(b: Record<string, number>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    // Private window or blocked storage: the round still works, it is just not remembered.
  }
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const subscribeNothing = () => () => {};

/** A round: the weakest cards first (box 0, then 1…), shuffled inside each box, at most 15. */
const roundOf = (pool: Card[], b: Record<string, number>) => [0, 1, 2, 3, 4].flatMap((n) => shuffle(pool.filter((c) => (b[c.id] ?? 0) === n))).slice(0, 15).map((c) => c.id);

export function Flashcards({ cards }: { cards: Card[] }) {
  // Boxes live in this browser only: read on the client, the server renders an empty shell.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [boxes, setBoxes] = useState<Record<string, number>>(() => (typeof window === 'undefined' ? {} : load()));
  const [tag, setTag] = useState<CardTag | 'all'>('all');
  const [round, setRound] = useState<string[] | null>(null);
  const [done, setDone] = useState(0);
  const [flip, setFlip] = useState(false);

  const poolOf = useCallback((t: CardTag | 'all') => cards.filter((c) => t === 'all' || c.tag === t), [cards]);
  const pool = useMemo(() => poolOf(tag), [poolOf, tag]);
  // The first round is dealt once, on the client; later ones by the buttons.
  const first = useMemo(() => (mounted ? roundOf(poolOf('all'), boxes) : []), [mounted]); // eslint-disable-line react-hooks/exhaustive-deps
  const queue = round ?? first;
  const setQueue = (f: (q: string[]) => string[]) => setRound((r) => f(r ?? first));
  const start = (b: Record<string, number> = boxes, t: CardTag | 'all' = tag) => {
    setRound(roundOf(poolOf(t), b));
    setDone(0);
    setFlip(false);
  };
  const chooseTag = (t: CardTag | 'all') => {
    setTag(t);
    start(boxes, t);
  };

  const card = cards.find((c) => c.id === queue[0]);
  const grade = useCallback(
    (knew: boolean) => {
      if (!card) return;
      const nb = { ...boxes, [card.id]: knew ? Math.min(MAX_BOX, (boxes[card.id] ?? 0) + 1) : 0 };
      setBoxes(nb);
      save(nb);
      setQueue((q) => {
        const rest = q.slice(1);
        if (knew) return rest;
        // Again in three cards (or at the end of a short round).
        const at = Math.min(3, rest.length);
        return [...rest.slice(0, at), card.id, ...rest.slice(at)];
      });
      if (knew) setDone((d) => d + 1);
      setFlip(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card, boxes, first],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest('input, textarea, select') || t.isContentEditable)) return;
      if (!document.activeElement?.closest(`.${styles.cards}`)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlip((f) => !f);
      } else if (flip && e.key === '1') grade(false);
      else if (flip && e.key === '2') grade(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip, grade]);

  const dist = [0, 1, 2, 3, 4].map((n) => pool.filter((c) => (boxes[c.id] ?? 0) === n).length);
  const total = done + queue.length;

  if (!mounted) return <div className={styles.cards} aria-busy="true" />;

  return (
    <div className={styles.cards} tabIndex={-1}>
      <div className={styles.cardTags} role="tablist" aria-label="Fitxa sortak">
        <button role="tab" aria-selected={tag === 'all'} className={tag === 'all' ? styles.on : ''} onClick={() => chooseTag('all')}>
          Denak <small>{cards.length}</small>
        </button>
        {CARD_TAGS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tag === t.id} className={tag === t.id ? styles.on : ''} onClick={() => chooseTag(t.id)}>
            {t.label} <small>{cards.filter((c) => c.tag === t.id).length}</small>
          </button>
        ))}
      </div>

      <div className={styles.cardStage}>
        {card ? (
          <button type="button" className={`${styles.card}${flip ? ` ${styles.cardFlip}` : ''}`} onClick={() => setFlip((f) => !f)} aria-label={flip ? 'Galdera ikusi' : 'Erantzuna ikusi'}>
            <span className={styles.cardFace}>
              <small>{CARD_TAGS.find((t) => t.id === card.tag)?.label}</small>
              <b>{card.q}</b>
              <em>Pentsatu erantzuna, gero sakatu (edo zuriune tekla)</em>
            </span>
            <span className={`${styles.cardFace} ${styles.cardBack}`}>
              <small>{card.q}</small>
              <b>{card.a}</b>
              {card.keys && (
                <span className={styles.cardFig}>
                  <ArchLadder stage={card.stage ?? 5} mode="origin" lit={new Set(card.keys)} mini glow={false} />
                </span>
              )}
            </span>
          </button>
        ) : (
          <div className={styles.cardDone}>
            <b>Saioa amaituta</b>
            <p>{done} fitxa jakinda. Kutxa ahulenetako fitxak lehenik datoz hurrengo saioan.</p>
            <button type="button" className={styles.btn} onClick={() => start()}>
              Beste saio bat
            </button>
          </div>
        )}
        {card && (
          <div className={styles.cardActions}>
            {flip ? (
              <>
                <button type="button" className={`${styles.btn} ${styles.btnBad}`} onClick={() => grade(false)}>
                  Ez nekien <kbd>1</kbd>
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOk}`} onClick={() => grade(true)}>
                  Banekien <kbd>2</kbd>
                </button>
              </>
            ) : (
              <button type="button" className={styles.btn} onClick={() => setFlip(true)}>
                Erantzuna ikusi <kbd>␣</kbd>
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.cardMeta}>
        <span>
          Saioa: {done} / {total}
        </span>
        <span className={styles.boxes} aria-label="Fitxak kutxaka (0 = ahulena)">
          {dist.map((n, i) => (
            <i key={i} title={`${i}. kutxa: ${n} fitxa`} style={{ flexGrow: Math.max(n, 0.0001) }} data-box={i} />
          ))}
        </span>
        <span className={styles.boxKey}>
          {dist[0]} berri/ahul · {dist[4]} ondo ikasita
        </span>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => {
            const nb = { ...boxes };
            for (const c of pool) delete nb[c.id];
            setBoxes(nb);
            save(nb);
            start(nb);
          }}
        >
          Hasieratik
        </button>
      </div>
    </div>
  );
}
