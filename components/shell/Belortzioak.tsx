'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BEL_ITEMS, BEL_PLATES, BEL_SYSTEMS, matchesName, sameKey, type BelItem, type BelPlate, type BelSystem } from '@/content/belortzioak';
import { LandFoot, LandNav } from './LandNav';
import { arrange, H, type Placed } from '@/lib/belortzioakLayout';
import s from './belortzioak.module.css';

/**
 * Belortzioak: the course's figures where an arrow points at a structure and the name is asked.
 *
 * - Esploratu: every name in two tidy columns, a leader to its structure; hovering a name (or the
 *   structure) lights that structure and dims the rest. Names can be covered and turned one by one,
 *   or shown as the figure's own numbers with the legend beside it.
 * - Zer da? one arrow, as on paper: pick, recall-and-flip, or type the name.
 * - Non dago? a name: tap where it is.
 * - Errepasoa: a spaced review across every figure (what is due first, then new ones), mixing both
 *   kinds of question. Progress lives in this browser.
 */

type Mode = 'esploratu' | 'zer' | 'non';
type Style = 'aukerak' | 'buruz' | 'idatzi';
type Scope = BelSystem | 'denak';
type Pt = [number, number];

interface Card {
  /** Leitner box: 0 new … 5 well known. */
  b: number;
  due: number;
  ok: number;
  bad: number;
}
type Cards = Record<string, Card>;

interface Q {
  plate: string;
  key: string;
  kind: 'zer' | 'non';
}
interface Quiz {
  review: boolean;
  queue: Q[];
  /** Asked again once after a miss. */
  retried: string[];
  options: string[];
  /** Answer state of the current question. */
  done: boolean;
  right: boolean;
  revealed: boolean;
  typed: string;
  picked: string | null;
  tap: Pt | null;
  ok: number;
  n: number;
  missed: Q[];
  total: number;
}

const STORE = 'enbrioatlas:belortzioak';
const STYLE_KEY = 'enbrioatlas:belortzioak:style';
const MIN = 60_000;
const DAY = 86_400_000;
const INTERVAL = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY];
const KNOWN = 2;
/** Read only from event handlers (grading), never while rendering. */
const clock = () => Date.now();

const readCards = (): Cards => {
  try {
    return JSON.parse(window.localStorage.getItem(STORE) ?? '{}') as Cards;
  } catch {
    return {};
  }
};
const writeCards = (c: Cards) => {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(c));
  } catch {
    // Without storage the progress is only lost; studying still works.
  }
};
const grade = (c: Card | undefined, ok: boolean, now: number): Card => {
  const prev = c ?? { b: 0, due: 0, ok: 0, bad: 0 };
  const b = ok ? Math.min(5, prev.b + 1) : 1;
  return { b, due: now + (ok ? INTERVAL[b] : MIN), ok: prev.ok + (ok ? 1 : 0), bad: prev.bad + (ok ? 0 : 1) };
};

const shuffle = <T,>(xs: readonly T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const plateOf = (id: string) => BEL_PLATES.find((p) => p.id === id) ?? BEL_PLATES[0];
const itemOf = (plate: BelPlate, key: string) => plate.items.find((i) => i.key === key);
const findItem = (key: string) => BEL_ITEMS.find((x) => x.item.key === key);
const SAME = new Map<string, { plate: BelPlate; item: BelItem }[]>();
for (const x of BEL_ITEMS) {
  const k = sameKey(x.item.name);
  SAME.set(k, [...(SAME.get(k) ?? []), x]);
}

// ---- stage geometry: a 1000-unit tall figure between two label columns ----------------------------

const COL = 330;
const GAP = 28;

interface Stage {
  fw: number;
  tw: number;
  /** Figure origin in stage units. */
  fx: number;
  /** Figure fraction → stage units. */
  at: (p: Pt) => Pt;
  /** Spotlight radius in stage units. */
  rad: (r: number) => number;
}
const stageOf = (plate: BelPlate): Stage => {
  const fw = (H * plate.size[0]) / plate.size[1];
  const fx = COL + GAP;
  const side = Math.max(fw, H);
  return { fw, tw: fw + 2 * (COL + GAP), fx, at: ([x, y]) => [fx + x * fw, y * H], rad: (r) => Math.max(34, r * side) };
};

// ---- the figure ------------------------------------------------------------------------------------

interface FigureProps {
  plate: BelPlate;
  mode: Mode;
  numbers: boolean;
  covered: (key: string) => boolean;
  active: string | null;
  onHover: (key: string | null) => void;
  onPick: (key: string) => void;
  /** The asked item (quiz). */
  asked: BelItem | null;
  answered: boolean;
  tap: Pt | null;
  onTap: (p: Pt) => void;
  missing: boolean;
}

function Figure({ plate, mode, numbers, covered, active, onHover, onPick, asked, answered, tap, onTap, missing }: FigureProps) {
  const st = stageOf(plate);
  const svg = useRef<SVGSVGElement>(null);
  const placed = useMemo(() => arrange(plate.items), [plate]);
  const explore = mode === 'esploratu';
  const lit = explore ? (active ? itemOf(plate, active) : undefined) : answered ? (asked ?? undefined) : undefined;
  const pct = (u: number, of: number) => `${(u / of) * 100}%`;

  // Pointer → the structure under it (nearest arrow tip within its light), so the figure itself answers hover too.
  const toFig = (e: ReactPointerEvent<SVGSVGElement>): Pt | null => {
    const el = svg.current;
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const ux = ((e.clientX - b.left) / b.width) * st.tw;
    const uy = ((e.clientY - b.top) / b.height) * H;
    const x = (ux - st.fx) / st.fw;
    const y = uy / H;
    return x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02 ? null : [x, y];
  };
  const nearest = (p: Pt): string | null => {
    let best: { key: string; d: number } | null = null;
    for (const it of plate.items) {
      it.targets.forEach((t, i) => {
        const [ax, ay] = st.at(t);
        const [bx, by] = st.at(p);
        const d = Math.hypot(ax - bx, ay - by);
        if (d <= st.rad(it.r[i] ?? 0.05) * 0.8 && (!best || d < best.d)) best = { key: it.key, d };
      });
    }
    return (best as { key: string } | null)?.key ?? null;
  };

  const lineEnd = (pl: Placed): Pt => [pl.side === 'l' ? COL : st.fx + st.fw + GAP, pl.y];
  // A long answer chip near the plate's edge grows inwards instead of off the plate.
  const edge = (x: number) => (x < st.tw * 0.3 ? { transform: 'translate(-12%, -50%)' } : x > st.tw * 0.7 ? { transform: 'translate(-88%, -50%)' } : {});
  // Where a question's chip sits: where the number was printed, or — when it was printed on the
  // structure itself — a short way outwards, with an arrow, so the chip does not hide what is asked.
  const chipAt = (it: BelItem): Pt => {
    const [tx, ty] = st.at(it.targets[0]);
    if (it.arrow) return st.at(it.label);
    const cx = st.fx + st.fw / 2;
    let dx = tx - cx;
    let dy = ty - H / 2;
    const len = Math.hypot(dx, dy);
    if (len < 40) [dx, dy] = [-1, 0];
    else [dx, dy] = [dx / len, dy / len];
    const d = 95;
    return [Math.min(st.tw - 30, Math.max(30, tx + dx * d)), Math.min(H - 24, Math.max(24, ty + dy * d))];
  };

  return (
    <div className={`${s.stage}${missing ? ` ${s.isMissing}` : ''}${mode === 'non' && !answered ? ` ${s.isPointing}` : ''}`} style={{ aspectRatio: `${st.tw} / ${H}`, ['--ar' as string]: st.tw / H }}>
      <svg
        ref={svg}
        className={s.svg}
        viewBox={`0 0 ${st.tw} ${H}`}
        role="img"
        aria-label={plate.title}
        onPointerMove={(e) => {
          if (!explore || e.pointerType === 'touch') return;
          const p = toFig(e);
          const k = p ? nearest(p) : null;
          if (k !== active) onHover(k);
        }}
        onPointerLeave={() => explore && onHover(null)}
        onClick={(e) => {
          const p = toFig(e as unknown as ReactPointerEvent<SVGSVGElement>);
          if (!p) return;
          if (mode === 'non' && !answered) onTap(p);
          else if (explore) {
            const k = nearest(p);
            if (k) onPick(k);
          }
        }}
      >
        <defs>
          <radialGradient id="bel-hole">
            <stop offset="0" stopColor="#000" />
            <stop offset="0.62" stopColor="#000" />
            <stop offset="1" stopColor="#fff" />
          </radialGradient>
          <mask id={`bel-mask-${plate.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={st.tw} height={H}>
            <rect width={st.tw} height={H} fill="#fff" />
            {lit?.targets.map((t, i) => {
              const [cx, cy] = st.at(t);
              const r = st.rad(lit.r[i] ?? 0.05) * 1.35;
              return <circle key={i} className={s.hole} cx={cx} cy={cy} r={r} fill="url(#bel-hole)" />;
            })}
          </mask>
          <marker id="bel-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="strokeWidth">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>

        <rect className={s.paper} width={st.tw} height={H} rx="18" />
        {/* keyed: a new element per figure (Chrome may keep painting the old bitmap when only href changes) */}
        {!missing && <image key={plate.id} href={`/api/belortzioak/${plate.id}`} x={st.fx} y={0} width={st.fw} height={H} className={s.img} />}

        {/* the light: everything but the structure dims */}
        <rect className={`${s.dim}${lit ? ` ${s.isOn}` : ''}`} width={st.tw} height={H} rx="18" mask={`url(#bel-mask-${plate.id})`} />

        {explore && !numbers && (
          <g className={s.leaders}>
            {placed.map((pl) => {
              const it = itemOf(plate, pl.key)!;
              const [x1, y1] = lineEnd(pl);
              const on = active === pl.key;
              return (
                <g key={pl.key} className={`${s.leader}${on ? ` ${s.isOn}` : ''}${active && !on ? ` ${s.isFaded}` : ''}`}>
                  {it.targets.map((t, i) => {
                    const [x2, y2] = st.at(t);
                    return (
                      <Fragment key={i}>
                        <line className={s.halo} x1={x1} y1={y1} x2={x2} y2={y2} />
                        <line className={s.core} x1={x1} y1={y1} x2={x2} y2={y2} />
                        <circle className={s.tip} cx={x2} cy={y2} r={on ? 5.5 : 4} />
                      </Fragment>
                    );
                  })}
                </g>
              );
            })}
          </g>
        )}

        {explore && numbers && (
          <g className={s.leaders}>
            {plate.items.map((it) => {
              const [lx, ly] = st.at(it.label);
              const on = active === it.key;
              return (
                <g key={it.key} className={`${s.leader} ${s.isNum}${on ? ` ${s.isOn}` : ''}${active && !on ? ` ${s.isFaded}` : ''}`}>
                  {it.targets.map((t, i) => {
                    const [x2, y2] = st.at(t);
                    if (Math.hypot(x2 - lx, y2 - ly) < 8) return null;
                    return (
                      <Fragment key={i}>
                        <line className={s.halo} x1={lx} y1={ly} x2={x2} y2={y2} />
                        <line className={s.core} x1={lx} y1={ly} x2={x2} y2={y2} />
                      </Fragment>
                    );
                  })}
                </g>
              );
            })}
          </g>
        )}

        {/* quiz arrow: from where the number sat to the structure, the way the figure is printed */}
        {mode === 'zer' && asked && (
          <g className={s.qArrow}>
            {asked.targets.map((t, i) => {
              const [lx, ly] = chipAt(asked);
              const [x2, y2] = st.at(t);
              if (Math.hypot(x2 - lx, y2 - ly) < 8) return null;
              const k = 1 - 10 / Math.hypot(x2 - lx, y2 - ly);
              return (
                <Fragment key={i}>
                  <line className={s.halo} x1={lx} y1={ly} x2={lx + (x2 - lx) * k} y2={ly + (y2 - ly) * k} />
                  <line className={s.core} x1={lx} y1={ly} x2={lx + (x2 - lx) * k} y2={ly + (y2 - ly) * k} markerEnd="url(#bel-head)" />
                </Fragment>
              );
            })}
          </g>
        )}
        {mode === 'non' && answered && asked && (
          <g className={s.qArrow}>
            {asked.targets.map((t, i) => {
              const [lx, ly] = chipAt(asked);
              const [x2, y2] = st.at(t);
              if (Math.hypot(x2 - lx, y2 - ly) < 8) return null;
              return (
                <Fragment key={i}>
                  <line className={s.halo} x1={lx} y1={ly} x2={x2} y2={y2} />
                  <line className={s.core} x1={lx} y1={ly} x2={x2} y2={y2} />
                </Fragment>
              );
            })}
          </g>
        )}
        {tap && (
          <g className={s.tap} transform={`translate(${st.at(tap)[0]} ${st.at(tap)[1]})`}>
            <path d="M-9 -9 L9 9 M9 -9 L-9 9" />
          </g>
        )}
      </svg>

      {/* names (explore) */}
      {explore && !numbers &&
        placed.map((pl) => {
          const it = itemOf(plate, pl.key)!;
          const hidden = covered(it.key);
          const on = active === it.key;
          const style = pl.side === 'l' ? { right: pct(st.tw - COL, st.tw), top: pct(pl.y, H), maxWidth: pct(COL - 8, st.tw) } : { left: pct(st.fx + st.fw + GAP, st.tw), top: pct(pl.y, H), maxWidth: pct(COL - 8, st.tw) };
          return (
            <button
              key={it.key}
              className={`${s.name} ${pl.side === 'l' ? s.isLeft : s.isRight}${on ? ` ${s.isOn}` : ''}${active && !on ? ` ${s.isFaded}` : ''}${hidden ? ` ${s.isCovered}` : ''}`}
              style={style}
              onPointerEnter={(e) => e.pointerType !== 'touch' && onHover(it.key)}
              onPointerLeave={(e) => e.pointerType !== 'touch' && onHover(null)}
              onFocus={() => onHover(it.key)}
              onBlur={() => onHover(null)}
              onClick={() => onPick(it.key)}
              aria-label={hidden ? `${it.n}: estalita, sakatu ikusteko` : it.name}
            >
              {hidden ? <span className={s.cover}>?</span> : it.name}
            </button>
          );
        })}

      {/* numbers where the figure printed them (explore, "zenbakiak") */}
      {explore && numbers &&
        plate.items.map((it) => {
          const [lx, ly] = st.at(it.label);
          const on = active === it.key;
          return (
            <button
              key={it.key}
              className={`${s.num}${on ? ` ${s.isOn}` : ''}`}
              style={{ left: pct(lx, st.tw), top: pct(ly, H) }}
              onPointerEnter={(e) => e.pointerType !== 'touch' && onHover(it.key)}
              onPointerLeave={(e) => e.pointerType !== 'touch' && onHover(null)}
              onClick={() => onPick(it.key)}
              aria-label={`${it.n}`}
            >
              {it.n}
            </button>
          );
        })}

      {mode === 'zer' && asked && (
        <span className={`${s.num} ${s.isAsked}${answered ? ` ${s.isAnswered}` : ''}`} style={{ left: pct(chipAt(asked)[0], st.tw), top: pct(chipAt(asked)[1], H), ...edge(chipAt(asked)[0]) }}>
          {answered ? asked.name : '?'}
        </span>
      )}
      {mode === 'non' && answered && asked && (
        <span className={`${s.num} ${s.isAsked} ${s.isAnswered}`} style={{ left: pct(chipAt(asked)[0], st.tw), top: pct(chipAt(asked)[1], H), ...edge(chipAt(asked)[0]) }}>
          {asked.name}
        </span>
      )}

      {missing && (
        <div className={s.missing}>
          <p>
            <b>Irudiak ez daude ordenagailu honetan.</b>
          </p>
          <p>Ikasgaiko irudiak dira (egile-eskubideak): ez dira argitaratzen. Zure ordenagailuan sortzeko, PDFa izanda:</p>
          <code>python -I scripts/belortzioak/extract.py &quot;Belortzioak zuzenduta.pdf&quot;</code>
        </div>
      )}
    </div>
  );
}

// ---- the page --------------------------------------------------------------------------------------

export function Belortzioak() {
  const [scope, setScope] = useState<Scope>('denak');
  const [plateId, setPlateId] = useState(BEL_PLATES[0].id);
  const [mode, setMode] = useState<Mode>('esploratu');
  const [style, setStyle] = useState<Style>('aukerak');
  const [numbers, setNumbers] = useState(false);
  const [cover, setCover] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [cards, setCards] = useState<Cards>({});
  const [now, setNow] = useState(0);
  const [missing, setMissing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const strip = useRef<HTMLOListElement>(null);

  const q = quiz && !quiz.total ? null : quiz?.queue[0] ?? null;
  const shown = plateOf(q?.plate ?? plateId);
  const asked = q ? (itemOf(shown, q.key) ?? null) : null;
  const list = scope === 'denak' ? BEL_PLATES : BEL_PLATES.filter((p) => p.system === scope);
  const at = list.findIndex((p) => p.id === shown.id);
  const active = hovered ?? pinned;
  const activeItem = active ? itemOf(shown, active) : undefined;
  const quizMode: Mode = q ? q.kind : mode;

  // Progress and preferences kept in this browser; whether this computer has the figures.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setCards(readCards());
      setNow(clock());
      try {
        const st = window.localStorage.getItem(STYLE_KEY);
        if (st === 'aukerak' || st === 'buruz' || st === 'idatzi') setStyle(st);
      } catch {
        // Defaults are fine.
      }
      const want = new URLSearchParams(window.location.search).get('irudia');
      if (want && BEL_PLATES.some((p) => p.id === want)) setPlateId(want);
    });
    fetch(`/api/belortzioak/${BEL_PLATES[0].id}`, { method: 'HEAD' })
      .then((r) => setMissing(!r.ok))
      .catch(() => setMissing(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // The next figure is fetched ahead, so stepping through does not flash.
  useEffect(() => {
    if (missing) return;
    const next = list[at + 1];
    if (next) new Image().src = `/api/belortzioak/${next.id}`;
  }, [at, list, missing]);

  useEffect(() => {
    const ol = strip.current;
    const on = ol?.querySelector<HTMLElement>('[aria-current="true"]');
    if (ol && on) ol.scrollTo({ left: on.offsetLeft - ol.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' });
  }, [shown.id, scope]);

  const known = (p: BelPlate) => p.items.filter((it) => (cards[it.key]?.b ?? 0) >= KNOWN).length;
  const pctKnown = (p: BelPlate) => Math.round((100 * known(p)) / Math.max(1, p.items.length));
  const inScope = (sys: BelSystem) => scope === 'denak' || scope === sys;
  const due = BEL_ITEMS.filter((x) => inScope(x.plate.system) && cards[x.item.key] && cards[x.item.key].due <= now);

  const open = (p: BelPlate, keep?: string) => {
    setPlateId(p.id);
    setQuiz(null);
    setRevealed(new Set());
    setHovered(null);
    setPinned(keep ?? null);
    const url = new URL(window.location.href);
    url.searchParams.set('irudia', p.id);
    window.history.replaceState(null, '', url);
  };

  const optionsFor = (plate: BelPlate, item: BelItem): string[] => {
    const pool = shuffle(plate.items.filter((i) => i.key !== item.key && sameKey(i.name) !== sameKey(item.name)));
    // Siblings under the same heading first: they are the ones confused with each other.
    pool.sort((a, b) => Number(b.group === item.group && !!item.group) - Number(a.group === item.group && !!item.group));
    const names = new Set([item.name]);
    for (const i of pool) {
      if (names.size >= 4) break;
      names.add(i.name);
    }
    for (const x of shuffle(BEL_ITEMS.filter((x) => x.plate.system === plate.system))) {
      if (names.size >= 4) break;
      if (sameKey(x.item.name) !== sameKey(item.name)) names.add(x.item.name);
    }
    return shuffle([...names]);
  };

  const fresh = (queue: Q[], review: boolean): Quiz | null => {
    if (!queue.length) return null;
    const first = queue[0];
    const p = plateOf(first.plate);
    return { review, queue, retried: [], options: optionsFor(p, itemOf(p, first.key)!), done: false, right: false, revealed: false, typed: '', picked: null, tap: null, ok: 0, n: 0, missed: [], total: queue.length };
  };

  const startPlate = (kind: 'zer' | 'non', only?: Q[]) => {
    setMode(kind);
    setHovered(null);
    setPinned(null);
    setQuiz(fresh(only ?? shuffle(shown.items).map((it) => ({ plate: shown.id, key: it.key, kind })), false));
  };

  const startReview = () => {
    const t = clock();
    setNow(t);
    const scoped = BEL_ITEMS.filter((x) => inScope(x.plate.system));
    const dueNow = scoped.filter((x) => cards[x.item.key] && cards[x.item.key].due <= t).sort((a, b) => cards[a.item.key].due - cards[b.item.key].due);
    const weak = scoped.filter((x) => cards[x.item.key] && cards[x.item.key].due > t && cards[x.item.key].b < 3).sort((a, b) => cards[a.item.key].b - cards[b.item.key].b);
    const unseen = shuffle(scoped.filter((x) => !cards[x.item.key]));
    const pick = [...dueNow.slice(0, 20)];
    for (const x of [...weak, ...unseen]) {
      if (pick.length >= 15) break;
      if (!pick.includes(x)) pick.push(x);
    }
    const queue = shuffle(pick).map((x, i) => ({ plate: x.plate.id, key: x.item.key, kind: (i % 3 === 2 ? 'non' : 'zer') as 'zer' | 'non' }));
    setHovered(null);
    setPinned(null);
    setQuiz(fresh(queue, true));
  };

  const settle = (right: boolean, patch: Partial<Quiz> = {}) => {
    if (!quiz || !q || quiz.done) return;
    const t = clock();
    const next = { ...cards, [q.key]: grade(cards[q.key], right, t) };
    setCards(next);
    writeCards(next);
    setNow(t);
    const firstTry = !quiz.retried.includes(q.key);
    setQuiz({
      ...quiz,
      ...patch,
      done: true,
      right,
      ok: quiz.ok + (right && firstTry ? 1 : 0),
      n: quiz.n + (firstTry ? 1 : 0),
      missed: !right && firstTry ? [...quiz.missed, q] : quiz.missed,
    });
  };

  /** A wrong mark the student knows was right (a typo, a synonym): counts as right after all. */
  const overrule = () => {
    if (!quiz || !q || !quiz.done || quiz.right) return;
    const t = clock();
    const prev = cards[q.key];
    const fixed = grade(prev ? { ...prev, b: Math.max(0, prev.b), bad: Math.max(0, prev.bad - 1) } : undefined, true, t);
    const next = { ...cards, [q.key]: fixed };
    setCards(next);
    writeCards(next);
    setQuiz({ ...quiz, right: true, ok: quiz.ok + 1, missed: quiz.missed.filter((m) => m.key !== q.key) });
  };

  const nextQuestion = () => {
    if (!quiz || !q) return;
    const rest = quiz.queue.slice(1);
    let retried = quiz.retried;
    // A miss comes back once, a few questions later.
    if (!quiz.right && !retried.includes(q.key)) {
      rest.splice(Math.min(rest.length, 3), 0, q);
      retried = [...retried, q.key];
    }
    const head = rest[0];
    const p = head ? plateOf(head.plate) : null;
    setQuiz({ ...quiz, queue: rest, retried, options: head && p ? optionsFor(p, itemOf(p, head.key)!) : [], done: false, right: false, revealed: false, typed: '', picked: null, tap: null });
  };

  const tapAt = (p: Pt) => {
    if (!quiz || !q || !asked) return;
    const st = stageOf(shown);
    const dist = (t: Pt) => Math.hypot(st.at(t)[0] - st.at(p)[0], st.at(t)[1] - st.at(p)[1]);
    const right = asked.targets.some((t, i) => dist(t) <= Math.max(st.rad(asked.r[i] ?? 0.05), 46));
    // A tap on another structure of the figure is named, so the miss teaches something too.
    let other: string | null = null;
    if (!right) {
      let best = Infinity;
      for (const it of shown.items) {
        if (it.key === asked.key) continue;
        it.targets.forEach((t, i) => {
          const d = dist(t);
          if (d <= st.rad(it.r[i] ?? 0.05) && d < best) {
            best = d;
            other = it.key;
          }
        });
      }
    }
    settle(right, { tap: p, picked: other });
  };

  const chooseStyle = (v: Style) => {
    setStyle(v);
    try {
      window.localStorage.setItem(STYLE_KEY, v);
    } catch {
      // Not kept; fine.
    }
  };

  // Keys: ←/→ figures, L names ↔ numbers; in questions 1–4, space to turn, Enter next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (quiz && q) {
        if (quiz.done && e.key === 'Enter') {
          e.preventDefault();
          nextQuestion();
          return;
        }
        if (typing) return;
        if (q.kind === 'zer' && !quiz.done && style === 'aukerak' && /^[1-4]$/.test(e.key)) {
          const name = quiz.options[Number(e.key) - 1];
          if (name) settle(name === asked?.name, { picked: name });
        }
        if (q.kind === 'zer' && style === 'buruz' && !quiz.done) {
          if (!quiz.revealed && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            setQuiz({ ...quiz, revealed: true });
          } else if (quiz.revealed && (e.key === '1' || e.key === '2')) settle(e.key === '1');
        }
        return;
      }
      if (typing) return;
      if (e.key === 'ArrowRight' && at < list.length - 1) open(list[at + 1]);
      if (e.key === 'ArrowLeft' && at > 0) open(list[at - 1]);
      if ((e.key === 'l' || e.key === 'L') && mode === 'esploratu') setNumbers((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (quiz && q?.kind === 'zer' && style === 'idatzi' && !quiz.done) input.current?.focus();
  }, [quiz, q, style]);

  const covered = (key: string) => cover && !revealed.has(key);
  const pick = (key: string) => {
    if (covered(key)) setRevealed((r) => new Set(r).add(key));
    setPinned((p) => (p === key ? null : key));
  };
  const elsewhere = activeItem ? (SAME.get(sameKey(activeItem.name)) ?? []).filter((x) => x.plate.id !== shown.id) : [];
  const finished = quiz && !q;

  return (
    <div className="landing">
      <LandNav current="belortzioak" />
      <section className={`ln-hero lab-hero plate-hero ${s.hero}`}>
        <p className="eyebrow">Belortzioak · azaletik digestio-aparatura · {BEL_PLATES.length} irudi, {BEL_ITEMS.length} egitura</p>
        <h1>Gezia → izena</h1>
        <p className="hero-lead">
          <b>Esploratu</b>: pasatu sagua izen baten gainetik, eta haren egitura argituko da. <b>Zer da?</b> eta <b>Non dago?</b>: galdetu zeure buruari. <b>Errepasoa</b>: irudi guztiak nahasian, ahazten hasten
          zarenean.
        </p>
      </section>

      <section className="lab plates">
        <div className={`lab-controls ${s.controls}`}>
          <div className="qz-kinds" role="group" aria-label="Sistema">
            {(['denak', ...BEL_SYSTEMS.map((x) => x.id)] as Scope[]).map((sc) => (
              <button
                key={sc}
                className={scope === sc ? 'is-on' : ''}
                onClick={() => {
                  setScope(sc);
                  const first = sc === 'denak' ? BEL_PLATES[0] : BEL_PLATES.find((p) => p.system === sc)!;
                  if (sc !== 'denak' && shown.system !== sc) open(first);
                }}
              >
                {sc === 'denak' ? 'Denak' : BEL_SYSTEMS.find((x) => x.id === sc)!.short}
              </button>
            ))}
          </div>
          <button className={`btn small ${s.reviewBtn}`} onClick={startReview} title="Irudi guztietako galderak nahasian: lehenik ahazten ari zarenak, gero berriak">
            Errepasoa
            {due.length > 0 && <span className={s.due}>{due.length}</span>}
          </button>
        </div>

        <ol className={`plate-strip ${s.strip}`} aria-label="Irudiak" ref={strip}>
          {list.map((p, i) => {
            const pc = pctKnown(p);
            return (
              <li key={p.id}>
                <button className={p.id === shown.id ? 'is-on' : ''} aria-current={p.id === shown.id} onClick={() => open(p)} title={`${p.title} · ${p.items.length} egitura`} disabled={!!quiz?.review && !finished}>
                  <span className="plate-strip-n">{i + 1}</span>
                  <span className="plate-strip-t">{p.title}</span>
                  {pc > 0 && <span className={`plate-best${pc === 100 ? ' is-full' : ''}`}>{pc}%</span>}
                </button>
              </li>
            );
          })}
        </ol>

        <div className={`lab-main ${s.main}`}>
          <Figure
            plate={shown}
            mode={quizMode}
            numbers={numbers}
            covered={covered}
            active={quiz ? null : active}
            onHover={setHovered}
            onPick={pick}
            asked={asked}
            answered={!!quiz?.done || !!quiz?.revealed}
            tap={quiz?.tap ?? null}
            onTap={tapAt}
            missing={missing}
          />

          <aside className={`lab-side ${s.side}`}>
            <p className="kicker">
              {BEL_SYSTEMS.find((x) => x.id === shown.system)?.short} · {shown.sub}
              {quiz?.review && !finished && <span className={s.reviewTag}>Errepasoa</span>}
            </p>
            <h2 className="lab-q">{shown.title}</h2>

            <div className={`seg ${s.modes}`} role="group" aria-label="Modua">
              <button className={!quiz && mode === 'esploratu' ? 'is-on' : ''} onClick={() => (setMode('esploratu'), setQuiz(null))}>
                Esploratu
              </button>
              <button className={(quiz ? q?.kind === 'zer' && !quiz.review : mode === 'zer') ? 'is-on' : ''} onClick={() => startPlate('zer')}>
                Zer da?
              </button>
              <button className={(quiz ? q?.kind === 'non' && !quiz.review : mode === 'non') ? 'is-on' : ''} onClick={() => startPlate('non')}>
                Non dago?
              </button>
            </div>

            {!quiz && mode === 'esploratu' && (
              <>
                <ol className={s.legend} onPointerLeave={() => setHovered(null)}>
                  {shown.items.map((it, i) => {
                    const hidden = covered(it.key);
                    const head = it.group && it.group !== shown.items[i - 1]?.group ? it.group : null;
                    const b = cards[it.key]?.b ?? 0;
                    return (
                      <Fragment key={it.key}>
                        {head && <li className={s.groupHead}>{head}</li>}
                        <li className={`${active === it.key ? s.isOn : ''}${hidden ? ` ${s.isCovered}` : ''}`} onPointerEnter={() => setHovered(it.key)}>
                          <button onClick={() => pick(it.key)} aria-label={hidden ? `${it.n}: estalita, sakatu ikusteko` : `${it.n}: ${it.name}`}>
                            <span className="num-chip">{it.n}</span>
                            <span className={s.legendName}>{hidden ? 'Sakatu ikusteko' : it.name}</span>
                            {cards[it.key] && <span className={`${s.meter} ${b >= KNOWN ? s.isKnown : s.isWeak}`} title={b >= KNOWN ? 'Badakizu' : 'Errepasatzeko'} />}
                          </button>
                        </li>
                      </Fragment>
                    );
                  })}
                </ol>
                {elsewhere.length > 0 && activeItem && (
                  <div className={s.elsewhere}>
                    <span>«{activeItem.name}» beste irudietan:</span>
                    {elsewhere.map((x) => (
                      <button key={x.item.key} className="btn small ghost" onClick={() => open(x.plate, x.item.key)}>
                        {x.plate.title}
                      </button>
                    ))}
                  </div>
                )}
                <div className="lab-actions">
                  <button className={`btn small ghost${cover ? ' is-on' : ''}`} aria-pressed={cover} onClick={() => (setCover((v) => !v), setRevealed(new Set()))} title="Izenak estali; sakatu bakoitza ikusteko">
                    Estali izenak
                  </button>
                  <button className={`btn small ghost${numbers ? ' is-on' : ''}`} aria-pressed={numbers} onClick={() => setNumbers((v) => !v)} title="Izenak irudiaren alboan, ala zenbakiak irudian (L)">
                    {numbers ? 'Izenak alboan' : 'Zenbakiak irudian'}
                  </button>
                </div>
                <p className="lab-keys">Teklak: ← → irudiak · L izenak/zenbakiak · sakatu izen bat finkatzeko</p>
              </>
            )}

            {!quiz && mode !== 'esploratu' && (
              <button className="btn primary" onClick={() => startPlate(mode as 'zer' | 'non')}>
                Hasi
              </button>
            )}

            {quiz && !quiz.total && <p className="muted">Ez dago errepasatzeko ezer oraindik.</p>}

            {quiz && q && asked && (
              <>
                <p className="plate-progress">
                  {quiz.ok}/{quiz.n} zuzen · {quiz.queue.length} falta
                </p>
                {q.kind === 'zer' && (
                  <div className={`seg ${s.styles}`} role="group" aria-label="Erantzuteko era">
                    {(
                      [
                        ['aukerak', 'Aukerak', 'Lau aukeren artean'],
                        ['buruz', 'Buruz', 'Pentsatu izena, ikusi eta esan asmatu duzun'],
                        ['idatzi', 'Idatzi', 'Idatzi izena'],
                      ] as [Style, string, string][]
                    ).map(([v, label, title]) => (
                      <button key={v} className={style === v ? 'is-on' : ''} title={title} onClick={() => chooseStyle(v)} disabled={quiz.done || quiz.revealed}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <h3 className="plate-ask">{q.kind === 'zer' ? 'Zer seinalatzen du geziak?' : <>Non dago «{asked.name}»? Sakatu irudian.</>}</h3>

                {q.kind === 'zer' && style === 'aukerak' && (
                  <div className="quiz-options">
                    {quiz.options.map((name, k) => {
                      const state = !quiz.done ? '' : name === asked.name ? ' is-right' : name === quiz.picked ? ' is-wrong' : ' is-faded';
                      return (
                        <button key={name} className={`quiz-option${state}`} disabled={quiz.done} onClick={() => settle(name === asked.name, { picked: name })}>
                          <span className="opt-letter">{k + 1}</span>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.kind === 'zer' && style === 'buruz' && !quiz.done && (
                  <div className="lab-actions">
                    {!quiz.revealed ? (
                      <button className="btn primary" onClick={() => setQuiz({ ...quiz, revealed: true })} autoFocus>
                        Erakutsi izena
                      </button>
                    ) : (
                      <>
                        <p className={s.flip}>{asked.name}</p>
                        <button className={`btn ${s.yes}`} onClick={() => settle(true)}>
                          Banekien
                        </button>
                        <button className={`btn ${s.no}`} onClick={() => settle(false)}>
                          Ez nekien
                        </button>
                      </>
                    )}
                  </div>
                )}

                {q.kind === 'zer' && style === 'idatzi' && (
                  <form
                    className={s.typeForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!quiz.done && quiz.typed.trim()) settle(matchesName(quiz.typed, asked));
                    }}
                  >
                    <input
                      ref={input}
                      value={quiz.typed}
                      onChange={(e) => setQuiz({ ...quiz, typed: e.target.value })}
                      disabled={quiz.done}
                      placeholder="Egituraren izena…"
                      aria-label="Egituraren izena"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {!quiz.done && (
                      <div className="lab-actions">
                        <button type="submit" className="btn primary small" disabled={!quiz.typed.trim()}>
                          Egiaztatu
                        </button>
                        <button type="button" className="btn small ghost" onClick={() => settle(false)}>
                          Ez dakit
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {quiz.done && (
                  <div className={`quiz-expl${quiz.right ? ' ok' : ' bad'}`}>
                    <p>
                      <b>{quiz.right ? 'Bai!' : 'Ez.'}</b> {asked.group ? `${asked.group} · ` : ''}
                      <b>{asked.name}</b>
                      {q.kind === 'non' && !quiz.right && quiz.picked && <> · sakatutakoa: {itemOf(shown, quiz.picked)?.name}</>}
                      {q.kind === 'non' && !quiz.right && !quiz.picked && <> · argituta dago irudian</>}
                    </p>
                    {!quiz.right && q.kind === 'zer' && style !== 'aukerak' && (
                      <button className="btn small ghost" onClick={overrule} title="Zuzena zen (idazkera, sinonimoa…)">
                        Ondo neukan
                      </button>
                    )}
                  </div>
                )}
                {quiz.done && (
                  <div className="lab-actions">
                    <button className="btn primary" onClick={nextQuestion} autoFocus={style !== 'idatzi'}>
                      Hurrengoa →
                    </button>
                  </div>
                )}
                <p className="lab-keys">{q.kind === 'zer' ? (style === 'aukerak' ? 'Teklak: 1–4 erantzun · Enter hurrengoa' : style === 'buruz' ? 'Teklak: zuriunea erakutsi · 1 banekien · 2 ez nekien · Enter hurrengoa' : 'Enter egiaztatu / hurrengoa') : 'Sakatu egituraren gainean · Enter hurrengoa'}</p>
              </>
            )}

            {finished && quiz && (
              <div className="plate-done">
                <p className="plate-score">
                  {quiz.total - quiz.missed.length}/{quiz.total} <small>lehen saiakeran</small>
                </p>
                {quiz.missed.length > 0 ? (
                  <>
                    <p className="muted">Berriz begiratu:</p>
                    <ul className={s.missed}>
                      {quiz.missed.map((m) => {
                        const x = findItem(m.key);
                        if (!x) return null;
                        return (
                          <li key={m.key}>
                            <button onClick={() => (setMode('esploratu'), open(x.plate, m.key))}>
                              <span className="num-chip">{x.item.n}</span> {x.item.name} <small>· {x.plate.title}</small>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="muted">Dena lehen saiakeran. Bikain.</p>
                )}
                <div className="lab-actions">
                  {quiz.missed.length > 0 && (
                    <button className="btn small" onClick={() => setQuiz(fresh(shuffle(quiz.missed), quiz.review))}>
                      Hutsak berriz
                    </button>
                  )}
                  {quiz.review ? (
                    <button className="btn small" onClick={startReview}>
                      Beste errepaso bat
                    </button>
                  ) : (
                    <button className="btn small" onClick={() => startPlate(mode === 'non' ? 'non' : 'zer')}>
                      Berriz
                    </button>
                  )}
                  {!quiz.review && at < list.length - 1 && (
                    <button className="btn primary small" onClick={() => open(list[at + 1])}>
                      Hurrengo irudia →
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="plate-foot">
              <div className="plate-nav">
                <button className="btn small ghost" disabled={at <= 0 || (!!quiz?.review && !finished)} onClick={() => open(list[at - 1])} aria-label="Aurreko irudia">
                  ←
                </button>
                <span>
                  {at + 1} / {list.length}
                </span>
                <button className="btn small ghost" disabled={at >= list.length - 1 || (!!quiz?.review && !finished)} onClick={() => open(list[at + 1])} aria-label="Hurrengo irudia">
                  →
                </button>
              </div>
              <span className={s.known}>
                {known(shown)}/{shown.items.length} ikasita
              </span>
            </div>
          </aside>
        </div>
      </section>
      <LandFoot>
        <p>Irudiak ikasgaikoak dira (egile-eskubideak): zure ordenagailuan bakarrik daude eta ez dira argitaratzen. Aurrerapena nabigatzaile honetan gordetzen da.</p>
      </LandFoot>
    </div>
  );
}
