'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { nameOf, structures } from '@/content/registry';
import { imageId } from '@/content/pool';
import { recordAnswer } from './answers';

/**
 * The course's own figures, only when this computer has them in `private-images/` (see
 * `lib/privateImages.ts`). Nothing here is published: on the public site the list is empty and the
 * tab does not even show.
 */
interface Hotspot {
  id: string;
  label?: string;
  x: number;
  y: number;
  r: number;
}
interface Item {
  i: number;
  title?: string;
  source?: string;
  hotspots: Hotspot[];
}

// One request per page load, shared by the tab and the panel.
let listing: Promise<Item[]> | null = null;
const load = () =>
  (listing ??= fetch('/api/irudiak')
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((d: { items?: Item[] }) => (d.items ?? []).filter((it) => it.hotspots.length))
    .catch(() => []));

function usePrivate() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    let live = true;
    load().then((xs) => live && setItems(xs));
    return () => {
      live = false;
    };
  }, []);
  return items;
}

const nameOfSpot = (h: Hotspot) => h.label ?? (structures.has(h.id) ? nameOf(h.id) : h.id);
const pickOne = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** The tab, shown only when the private figures exist. */
export function PrivateTab({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const items = usePrivate();
  if (!items?.length) return null;
  return (
    <button role="tab" aria-selected={active} className={active ? 'is-on' : ''} onClick={onOpen} title="Zure ordenagailuan bakarrik: ez dira argitaratzen">
      Ikasgaiko irudiak <small>(pribatuak · {items.length})</small>
    </button>
  );
}

type Q = { item: Item; spot: Hotspot; kind: 'seinalatu' | 'gezia'; options: string[] };

function newQ(items: Item[]): Q {
  const item = pickOne(items);
  const spot = pickOne(item.hotspots);
  const kind = Math.random() < 0.5 ? 'seinalatu' : 'gezia';
  const names = [...new Set(items.flatMap((it) => it.hotspots.map(nameOfSpot)))].filter((n) => n !== nameOfSpot(spot));
  const near = item.hotspots.map(nameOfSpot).filter((n) => n !== nameOfSpot(spot));
  const others = [...new Set([...near.sort(() => Math.random() - 0.5), ...names.sort(() => Math.random() - 0.5)])].slice(0, 3);
  const options = [nameOfSpot(spot), ...others].sort(() => Math.random() - 0.5);
  return { item, spot, kind, options };
}

const subscribeNothing = () => () => {};

export function PrivateImages() {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const items = usePrivate();
  const [q, setQ] = useState<Q | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [clicked, setClicked] = useState<{ x: number; y: number } | null>(null);

  if (hydrated && items?.length && !q) setQ(newQ(items));
  if (!items) return <p className="muted pad">Kargatzen…</p>;
  if (!items.length || !q) return <p className="muted pad">Ez dago irudi pribaturik ordenagailu honetan.</p>;

  const right = nameOfSpot(q.spot);
  const answered = picked !== null;
  const ok = picked === right;
  const record = (name: string) => {
    setPicked(name);
    if (structures.has(q.spot.id)) recordAnswer(imageId(q.spot.id), name === right, name);
  };
  const next = () => {
    setPicked(null);
    setClicked(null);
    setQ(newQ(items));
  };

  const onClickImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (q.kind !== 'seinalatu' || answered) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setClicked({ x, y });
    // The nearest hotspot that contains the click names what was clicked.
    const hit = q.item.hotspots
      .map((h) => ({ h, d: Math.hypot(h.x - x, (h.y - y) * (r.height / r.width)) }))
      .filter(({ h, d }) => d <= h.r)
      .sort((a, b) => a.d - b.d)[0];
    record(hit ? nameOfSpot(hit.h) : '(ezer ez)');
  };

  return (
    <div className="lab-main">
      <div className="lab-fig is-private" onClick={onClickImage}>
        <div className="pv-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element -- local, private file served by our own route */}
          <img src={`/api/irudiak/${q.item.i}`} alt={q.item.title ?? 'Ikasgaiko irudia'} draggable={false} />
          {q.kind === 'gezia' && <span className="pv-arrow" style={{ left: `${q.spot.x * 100}%`, top: `${q.spot.y * 100}%` }} aria-hidden />}
          {answered && <span className={`pv-spot${ok ? ' is-ok' : ''}`} style={{ left: `${q.spot.x * 100}%`, top: `${q.spot.y * 100}%`, width: `${q.spot.r * 200}%` }} aria-hidden />}
          {clicked && <span className="pv-click" style={{ left: `${clicked.x * 100}%`, top: `${clicked.y * 100}%` }} aria-hidden />}
        </div>
      </div>
      <aside className="lab-side">
        <p className="kicker">{q.kind === 'seinalatu' ? 'Seinalatu' : 'Gezia'} · pribatua</p>
        <h2 className="lab-q">{q.kind === 'seinalatu' ? `Seinalatu irudian: ${right}` : 'Zer seinalatzen du geziak?'}</h2>
        {q.kind === 'gezia' && (
          <div className="quiz-options">
            {q.options.map((o, k) => {
              const state = !answered ? '' : o === right ? ' is-right' : o === picked ? ' is-wrong' : ' is-faded';
              return (
                <button key={o} className={`quiz-option${state}`} disabled={answered} onClick={() => record(o)}>
                  <span className="opt-letter">{k + 1}</span>
                  {o}
                </button>
              );
            })}
          </div>
        )}
        {answered && (
          <div className={`quiz-expl${ok ? ' ok' : ' bad'}`}>
            <p>
              <b>{ok ? 'Bai!' : 'Ez.'}</b> {ok ? `Hori da ${right}.` : `${right} zirkuluan markatuta dago.`}
            </p>
            {structures.get(q.spot.id)?.definition && <p className="muted">{structures.get(q.spot.id)!.definition}</p>}
          </div>
        )}
        <p className="lab-where">{[q.item.title, q.item.source].filter(Boolean).join(' · ')}</p>
        <div className="lab-actions">
          <button className={answered ? 'btn primary' : 'btn ghost small'} onClick={next}>
            {answered ? 'Hurrengoa →' : 'Beste irudi bat'}
          </button>
        </div>
      </aside>
    </div>
  );
}
