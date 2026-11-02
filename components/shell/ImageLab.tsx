'use client';

import { firstSentence } from '@/content/generate';
import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type QuizFlash, type SceneContextValue } from '@/components/kit/context';
import { isSpace, partsOf, nameOf, structures, weeks } from '@/content/registry';
import { imageId } from '@/content/pool';
import type { Orientation, PlaneKind } from '@/lib/sim/types';
import { recordAnswer } from './answers';
import { LandFoot, LandNav, isWip } from './LandNav';
import { PLANE_TEXT } from './Locator';
import { PrivateImages, PrivateTab } from './PrivateImages';
import { SceneView } from '@/components/kit';
import { CourseFigures } from './CourseFigures';

/**
 * Image lab: our own scenes shown as plain figures (black and white, no labels, sometimes turned or
 * mirrored), with four exercises: point at a structure, name the arrowed one, read the orientation
 * and recognise the cut plane. Every attempt feeds the "Irudian" competence of that structure.
 */

type Kind = 'seinalatu' | 'gezia' | 'orientazioa' | 'planoa';
type Mode = 'nahastu' | Kind;
type Rot = 0 | 90 | 180 | 270;

interface Item {
  w: number;
  stage: string;
  view: string;
  t: number;
  rot: Rot;
  mirror: boolean;
  kind: Kind;
  target?: string;
  /** Orientation exercise: the edge asked about. */
  edge?: Edge;
}

type Edge = 'top' | 'right' | 'bottom' | 'left';
const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];
const EDGE_NAME: Record<Edge, string> = { top: 'GOIAN', right: 'ESKUINEAN', bottom: 'BEHEAN', left: 'EZKERREAN' };

const KINDS: { id: Mode; label: string; hint: string }[] = [
  { id: 'nahastu', label: 'Nahastu', hint: 'Ariketa mota guztiak, txandaka' },
  { id: 'seinalatu', label: 'Seinalatu', hint: 'Egitura baten izena duzu: klikatu irudian' },
  { id: 'gezia', label: 'Gezia', hint: 'Gezi batek egitura bat seinalatzen du: zein da?' },
  { id: 'orientazioa', label: 'Orientazioa', hint: 'Irudia biratuta egon daiteke: non dago kraneala, dortsala…?' },
  { id: 'planoa', label: 'Ebaki-planoa', hint: 'Zein ebaki edo ikuspegi da?' },
];

// ——— Which figures exist ———
interface Entry {
  w: number;
  stage: string;
  view: string;
  plane: PlaneKind;
  orientation?: Orientation;
  times: number[];
}
const ENTRIES: Entry[] = weeks
  .filter((w) => !isWip(w))
  .flatMap((w) =>
    w.stages.flatMap((st) =>
      st.views
        .filter((v) => v.plane !== 'eskema' && v.description !== 'Prestatzen')
        .map((v) => ({
          w: w.week,
          stage: st.id,
          view: v.id,
          plane: v.plane,
          orientation: v.orientation,
          // The end of the stage and a moment inside its later steps: the figure is complete there.
          times: [...new Set([1, ...st.beats.filter((b) => b.at >= 0.3).map((b) => Math.min(1, Math.round((b.at + 0.06) * 100) / 100))])],
        })),
    ),
  );
const entryOf = (it: Pick<Item, 'w' | 'stage' | 'view'>) => ENTRIES.find((e) => e.w === it.w && e.stage === it.stage && e.view === it.view);

/** Anatomical direction behind an edge label ("Dortsala (amniosa)" → Dortsala); other labels don't count. */
const DIRS = ['Kraneala', 'Kaudala', 'Dortsala', 'Bentrala', 'Ezkerra', 'Eskuina'] as const;
type Dir = (typeof DIRS)[number];
const canon = (label?: string): Dir | null => {
  const l = (label ?? '').toLowerCase();
  if (l.startsWith('kran')) return 'Kraneala';
  if (l.startsWith('kaud')) return 'Kaudala';
  if (l.startsWith('dorts')) return 'Dortsala';
  if (l.startsWith('bentr')) return 'Bentrala';
  if (l.startsWith('ezker')) return 'Ezkerra';
  if (l.startsWith('eskuin')) return 'Eskuina';
  return null;
};
const OPPOSITE: Record<Dir, Dir> = { Kraneala: 'Kaudala', Kaudala: 'Kraneala', Dortsala: 'Bentrala', Bentrala: 'Dortsala', Ezkerra: 'Eskuina', Eskuina: 'Ezkerra' };
const DIR_HINT: Record<Dir, string> = {
  Kraneala: 'buruaren aldea: nerbio-hodiaren mutur zabala, bihotza eta aho-mintza bertan',
  Kaudala: 'buztanaren aldea: marra primitiboa, kloaka-mintza eta alantoidea bertan',
  Dortsala: 'bizkarra: ektodermoa / amniosa eta nerbio-hodia',
  Bentrala: 'sabela: endodermoa, bitelo-zakua eta hestea',
  Ezkerra: 'enbrioiaren ezkerra',
  Eskuina: 'enbrioiaren eskuina',
};

/** The original edge that ends up at `at` after mirroring (left↔right) and turning clockwise by `rot`. */
const sourceEdge = (at: Edge, rot: Rot, mirror: boolean): Edge => {
  const i = (EDGES.indexOf(at) - rot / 90 + 4) % 4;
  const e = EDGES[i];
  return mirror && (e === 'left' || e === 'right') ? (e === 'left' ? 'right' : 'left') : e;
};
export const dirAt = (o: Orientation | undefined, at: Edge, rot: Rot, mirror: boolean): Dir | null => {
  const src = sourceEdge(at, rot, mirror);
  const direct = canon(o?.[src]);
  if (direct) return direct;
  // The opposite edge names this one too (only "Kraneala" drawn at the top still means Kaudala below).
  const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[src] as Edge;
  const other = canon(o?.[opp]);
  return other ? OPPOSITE[other] : null;
};

const ORIENT_PLANES: PlaneKind[] = ['sagitala', 'zeharkakoa', 'koronala', 'dortsala'];
const PLANE_CHOICES: PlaneKind[] = ['sagitala', 'zeharkakoa', 'koronala', 'dortsala', 'kanpokoa'];

const pickOne = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function newItem(mode: Mode, week: number | null, prev?: Item): Item {
  const kind: Kind = mode === 'nahastu' ? pickOne<Kind>(['seinalatu', 'gezia', 'gezia', 'orientazioa', 'planoa']) : mode;
  let pool = ENTRIES.filter((e) => week === null || e.w === week);
  if (kind === 'orientazioa') pool = pool.filter((e) => ORIENT_PLANES.includes(e.plane) && EDGES.some((x) => canon(e.orientation?.[x])));
  if (kind === 'planoa') pool = pool.filter((e) => PLANE_CHOICES.includes(e.plane));
  if (kind === 'seinalatu' || kind === 'gezia') pool = pool.filter((e) => e.plane !== 'xehetasuna' || Math.random() < 0.5);
  if (prev && pool.length > 1) pool = pool.filter((e) => !(e.stage === prev.stage && e.view === prev.view));
  if (!pool.length) pool = ENTRIES;
  const e = pickOne(pool);
  // Figures come in the textbook orientation most of the time; turning them is the orientation drill.
  const turn = kind === 'orientazioa' ? 1 : kind === 'planoa' ? 0.45 : 0.25;
  const rot: Rot = Math.random() < turn ? pickOne<Rot>([90, 180, 270]) : 0;
  const mirror = Math.random() < (kind === 'orientazioa' ? 0.4 : turn / 2);
  const item: Item = { w: e.w, stage: e.stage, view: e.view, t: pickOne(e.times), rot, mirror, kind };
  if (kind === 'orientazioa') {
    const known = EDGES.filter((x) => dirAt(e.orientation, x, rot, mirror));
    item.edge = known.includes('top') && Math.random() < 0.6 ? 'top' : pickOne(known);
  }
  return item;
}

const encode = (it: Item) => [it.w, it.stage, it.view, it.t, `${it.rot}${it.mirror ? 'm' : ''}`, it.kind, it.target ?? '', it.edge ?? ''].join('~');
function decode(code: string | null): Item | null {
  if (!code) return null;
  const [w, stage, view, t, tr, kind, target, edge] = code.split('~');
  const it: Item = {
    w: Number(w),
    stage,
    view,
    t: Math.min(1, Math.max(0, Number(t) || 1)),
    rot: ([0, 90, 180, 270].includes(parseInt(tr)) ? parseInt(tr) : 0) as Rot,
    mirror: /m$/.test(tr ?? ''),
    kind: (['seinalatu', 'gezia', 'orientazioa', 'planoa'].includes(kind) ? kind : 'gezia') as Kind,
    target: target && structures.has(target) ? target : undefined,
    edge: EDGES.includes(edge as Edge) ? (edge as Edge) : undefined,
  };
  const e = entryOf(it);
  if (!e) return null;
  if (it.kind === 'orientazioa' && !(it.edge && dirAt(e.orientation, it.edge, it.rot, it.mirror))) return null;
  return it;
}

const W = 1000;
const H = 640;

/** The figure's transform: mirror first (inside), then turn clockwise about the new frame. */
function frame(rot: Rot, mirror: boolean) {
  const vw = rot % 180 ? H : W;
  const vh = rot % 180 ? W : H;
  const turn = rot === 90 ? `translate(${H} 0) rotate(90)` : rot === 180 ? `translate(${W} ${H}) rotate(180)` : rot === 270 ? `translate(0 ${W}) rotate(270)` : '';
  return { vw, vh, turn, flip: mirror ? `translate(${W} 0) scale(-1 1)` : '' };
}

/** Width / height of a viewBox: the figure is drawn at exactly this shape, one clean printed card. */
const aspectOf = (vb: string) => {
  const [, , w, h] = vb.split(' ').map(Number);
  return w > 0 && h > 0 ? (w / h).toFixed(4) : String(W / H);
};

interface Measured {
  code: string;
  target: string | null;
  /** Arrow tip, in figure-box pixels, and the box size it was measured in. */
  pt: { x: number; y: number } | null;
  box: { w: number; h: number };
  options: string[];
}

const subscribeNothing = () => () => {};

export function ImageLab() {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [mode, setMode] = useState<Mode>('nahastu');
  const [week, setWeek] = useState<number | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [m, setM] = useState<Measured | null>(null);
  // The figure is framed on what is drawn (a turned or small specimen would otherwise be tiny).
  const [fit, setFit] = useState<{ key: string; vb: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [labels, setLabels] = useState(false);
  const [color, setColor] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const [tab, setTab] = useState<'geureak' | 'pribatuak' | 'orriak'>('geureak');
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const retries = useRef(0);

  // First item: the one in the URL (a way back from the simulator), else a random one.
  // Read after commit: on a client-side navigation the router writes the new URL after the first render.
  useEffect(() => {
    if (item) return;
    const raf = requestAnimationFrame(() => setItem(decode(new URLSearchParams(window.location.search).get('irudia')) ?? newItem(mode, week)));
    return () => cancelAnimationFrame(raf);
  }, [item, mode, week]);

  const entry = item ? entryOf(item) : undefined;
  const wk = item ? weeks.find((w) => w.week === item.w) : undefined;
  const stage = wk?.stages.find((s) => s.id === item?.stage);
  const view = stage?.views.find((v) => v.id === item?.view);
  const code = item ? encode(item) : '';
  const figKey = code.split('~').slice(0, 5).join('~');
  const answered = picked !== null;

  const next = (nextMode = mode, nextWeek = week) => {
    retries.current = 0;
    setPicked(null);
    setLabels(false);
    setM(null);
    setItem(newItem(nextMode, nextWeek, item ?? undefined));
  };

  /** Where a structure can really be pointed at in the drawn figure (not hidden under another one). */
  const spotOf = (id: string, root: SVGSVGElement, b: DOMRect) => {
    const groups = [...root.querySelectorAll<SVGGElement>(`[data-part="${CSS.escape(id)}"]`)].filter((g) => Number(g.getAttribute('opacity') ?? 1) > 0.5);
    if (!groups.length) return null;
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (const g of groups) {
      const r = g.getBoundingClientRect();
      x0 = Math.min(x0, r.left);
      y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right);
      y1 = Math.max(y1, r.bottom);
    }
    x0 = Math.max(x0, b.left + 4);
    y0 = Math.max(y0, b.top + 4);
    x1 = Math.min(x1, b.right - 4);
    y1 = Math.min(y1, b.bottom - 4);
    if (x1 - x0 < 4 || y1 - y0 < 4) return null;
    const hits: { x: number; y: number }[] = [];
    const N = 10;
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const x = x0 + ((x1 - x0) * i) / N;
        const y = y0 + ((y1 - y0) * j) / N;
        const el = document.elementFromPoint(x, y);
        if (el && root.contains(el) && el.closest('[data-part]')?.getAttribute('data-part') === id) hits.push({ x, y });
      }
    if (hits.length < 4) return null;
    const cx = hits.reduce((s, p) => s + p.x, 0) / hits.length;
    const cy = hits.reduce((s, p) => s + p.y, 0) / hits.length;
    const best = hits.reduce((a, p) => (Math.hypot(p.x - cx, p.y - cy) < Math.hypot(a.x - cx, a.y - cy) ? p : a));
    return { x: best.x - b.left, y: best.y - b.top, n: hits.length };
  };

  const measure = useEffectEvent(() => {
    const root = svg.current;
    const el = box.current;
    if (!item || !root || !el) return;
    if (fit?.key !== figKey) {
      const ctm = root.getScreenCTM();
      const { vw, vh } = frame(item.rot, item.mirror);
      if (!ctm) {
        setFit({ key: figKey, vb: `0 0 ${vw} ${vh}` });
        return;
      }
      // Frame on everything drawn, not only the named structures: membranes, cavities and walls
      // that are not structures would otherwise be cut at the frame. Skipped: hidden or faded-out
      // ink, defs, and backdrops that fill the whole frame.
      const inv = ctm.inverse();
      const alpha = new Map<Element, number>();
      const opacityOf = (el: Element | null): number => {
        if (!el || el === root) return 1;
        const known = alpha.get(el);
        if (known !== undefined) return known;
        const own = Number(el.getAttribute('opacity') ?? 1) * Number((el as SVGElement).style?.opacity || 1);
        const a = (Number.isFinite(own) ? own : 1) * opacityOf(el.parentElement);
        alpha.set(el, a);
        return a;
      };
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const g of root.querySelectorAll<SVGGraphicsElement>('path, circle, ellipse, rect, polygon, polyline, line, use, image')) {
        if (g.closest('defs, clipPath, mask, pattern, marker, symbol')) continue;
        const r = g.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        if (opacityOf(g) < 0.12 || (g.checkVisibility && !g.checkVisibility({ visibilityProperty: true }))) continue;
        const a = new DOMPoint(r.left, r.top).matrixTransform(inv);
        const b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
        const [gx0, gx1] = [Math.max(0, Math.min(a.x, b.x)), Math.min(vw, Math.max(a.x, b.x))];
        const [gy0, gy1] = [Math.max(0, Math.min(a.y, b.y)), Math.min(vh, Math.max(a.y, b.y))];
        if (gx1 <= gx0 || gy1 <= gy0) continue;
        if (gx1 - gx0 >= 0.9 * vw && gy1 - gy0 >= 0.9 * vh) continue;
        x0 = Math.min(x0, gx0);
        y0 = Math.min(y0, gy0);
        x1 = Math.max(x1, gx1);
        y1 = Math.max(y1, gy1);
      }
      if (!Number.isFinite(x0)) {
        setFit({ key: figKey, vb: `0 0 ${vw} ${vh}` });
        return;
      }
      const pad = 0.08 * Math.max(x1 - x0, y1 - y0);
      x0 = Math.max(0, x0 - pad);
      y0 = Math.max(0, y0 - pad);
      x1 = Math.min(vw, x1 + pad);
      y1 = Math.min(vh, y1 + pad);
      // Never closer than a third of the frame: the figure keeps its surroundings.
      const minW = vw / 3;
      const minH = vh / 3;
      if (x1 - x0 < minW) [x0, x1] = [Math.max(0, (x0 + x1 - minW) / 2), Math.min(vw, (x0 + x1 + minW) / 2)];
      if (y1 - y0 < minH) [y0, y1] = [Math.max(0, (y0 + y1 - minH) / 2), Math.min(vh, (y0 + y1 + minH) / 2)];
      setFit({ key: figKey, vb: Number.isFinite(x0) ? `${x0} ${y0} ${x1 - x0} ${y1 - y0}` : `0 0 ${vw} ${vh}` });
      return;
    }
    if (item.kind === 'orientazioa' || item.kind === 'planoa') {
      setM({ code, target: null, pt: null, options: [], box: { w: el.clientWidth, h: el.clientHeight } });
      return;
    }
    let b = el.getBoundingClientRect();
    // Hit-testing only sees what is on screen: bring the whole figure into view first.
    if (b.top < 0 || b.bottom > window.innerHeight) {
      el.scrollIntoView({ block: b.height > window.innerHeight ? 'start' : 'nearest', behavior: 'instant' });
      b = el.getBoundingClientRect();
    }
    // Already chosen (a resize): only move the arrow, keep the question and its options.
    if (m && m.code === code && m.target) {
      const s = spotOf(m.target, root, b);
      if (s && (s.x !== m.pt?.x || s.y !== m.pt?.y)) setM({ ...m, pt: { x: s.x, y: s.y }, box: { w: el.clientWidth, h: el.clientHeight } });
      return;
    }
    const ids = [...new Set([...root.querySelectorAll<SVGGElement>('[data-part]')].map((g) => g.dataset.part!))].filter((id) => structures.has(id) && structures.get(id)!.category !== 'prozesua');
    const visible = ids.map((id) => ({ id, s: spotOf(id, root, b) })).filter((x) => x.s) as { id: string; s: { x: number; y: number; n: number } }[];
    const want = item.target && visible.find((v) => v.id === item.target);
    const chosen = want || (visible.length ? pickOne(visible) : null);
    if (!chosen) {
      // Nothing clickable here (a moment where everything is still forming): draw another figure.
      if (retries.current++ < 8) setItem(newItem(mode, week, item));
      return;
    }
    const others = shuffle(visible.filter((v) => v.id !== chosen.id).map((v) => v.id));
    const filler = shuffle((stage?.structures ?? []).filter((id) => id !== chosen.id && !others.includes(id) && structures.get(id)?.category !== 'prozesua'));
    const options = shuffle([chosen.id, ...[...others, ...filler].slice(0, 3)]);
    if (item.target !== chosen.id) setItem({ ...item, target: chosen.id });
    setM({ code: encode({ ...item, target: chosen.id }), target: chosen.id, pt: { x: chosen.s.x, y: chosen.s.y }, options, box: { w: el.clientWidth, h: el.clientHeight } });
  });

  // Measure once the figure is drawn (two frames: the scene mounts, then its parts settle).
  useEffect(() => {
    if (!item) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => (r2 = requestAnimationFrame(() => measure())));
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [code, item, fit]);

  // The arrow follows the figure when the window changes size.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [hydrated]);

  // Keep the item in the URL: the simulator's "Bueltatu irudira" and a reload come back to it.
  useEffect(() => {
    if (!item || !m || m.code !== code) return;
    const url = new URL(window.location.href);
    url.searchParams.set('irudia', code);
    window.history.replaceState(null, '', url);
  }, [code, item, m]);

  const ready = !!item && !!m && m.code === code;
  const target = ready ? m.target : null;

  // What is asked, what the options are and which one is right.
  let prompt = '';
  let choices: { value: string; label: string }[] = [];
  let right = '';
  if (item && entry && ready) {
    if (item.kind === 'seinalatu' && target) {
      prompt = `Seinalatu irudian: ${nameOf(target)}`;
      right = target;
    } else if (item.kind === 'gezia' && target) {
      prompt = 'Zer seinalatzen du geziak?';
      choices = m.options.map((id) => ({ value: id, label: nameOf(id) }));
      right = target;
    } else if (item.kind === 'orientazioa' && item.edge) {
      const d = dirAt(entry.orientation, item.edge, item.rot, item.mirror)!;
      prompt = `Irudia biratuta edo ispiluan egon daiteke. Zer dago ${EDGE_NAME[item.edge]}?`;
      const lr = d === 'Ezkerra' || d === 'Eskuina';
      const set: Dir[] = lr ? ['Kraneala', 'Kaudala', 'Ezkerra', 'Eskuina'] : ['Kraneala', 'Kaudala', 'Dortsala', 'Bentrala'];
      choices = set.map((x) => ({ value: x, label: x }));
      right = d;
    } else if (item.kind === 'planoa') {
      prompt = 'Zein ebaki edo ikuspegi da hau?';
      choices = PLANE_CHOICES.map((p) => ({ value: p, label: PLANE_TEXT[p].name }));
      right = entry.plane;
    }
  }

  function answer(value: string) {
    if (!item || answered || !right) return;
    const ok = value === right;
    setPicked(value);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
    if (item.kind === 'seinalatu' || item.kind === 'gezia') recordAnswer(imageId(right), ok, nameOf(value));
    else recordAnswer(`irudia:~${item.kind}`, ok, choices.find((c) => c.value === value)?.label);
  }

  // Keyboard: 1–4 answer, Enter / → next.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tab !== 'geureak') return;
    if ((e.key === 'Enter' || e.key === 'ArrowRight') && answered) next();
    else if (/^[1-5]$/.test(e.key) && !answered) {
      const o = choices[Number(e.key) - 1];
      if (o) answer(o.value);
    }
  });
  useEffect(() => {
    const l = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', l);
    return () => window.removeEventListener('keydown', l);
  }, []);

  const flash: QuizFlash = answered && target ? { id: target, ok: true } : null;
  const ctx: SceneContextValue = {
    selected: null,
    hovered: item?.kind === 'seinalatu' && !answered ? hovered : null,
    focus: [],
    showLabels: labels,
    quiz: !labels,
    quizFlash: flash,
    nameOf,
    isSpace,
    partsOf,
    onSelect: (id) => {
      if (item?.kind === 'seinalatu' && !answered) answer(id);
    },
    onHover: (id) => setHovered(id),
  };

  const f = item ? frame(item.rot, item.mirror) : frame(0, false);
  const vb = fit?.key === figKey && !labels ? fit.vb : `0 0 ${f.vw} ${f.vh}`;
  const Scene = view?.scene;
  const ok = answered && picked === right;

  // The arrow: from the roomier side toward the structure.
  let arrow = null;
  if (item?.kind === 'gezia' && ready && m.pt && !labels) {
    const bw = m.box.w;
    const bh = m.box.h;
    const { x, y } = m.pt;
    let dx = x - bw / 2;
    let dy = y - bh / 2;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    if (len < 20) {
      dx = -0.7;
      dy = -0.7;
    }
    const L = Math.min(110, Math.max(60, bw * 0.09));
    const sx = x + dx * L;
    const sy = y + dy * L;
    const a = Math.atan2(y - sy, x - sx);
    const h = 13;
    const head = `M${x} ${y}L${x - h * Math.cos(a - 0.45)} ${y - h * Math.sin(a - 0.45)}L${x - h * Math.cos(a + 0.45)} ${y - h * Math.sin(a + 0.45)}Z`;
    arrow = (
      <svg className="lab-arrow" viewBox={`0 0 ${bw} ${bh}`} aria-hidden>
        <path d={`M${sx} ${sy}L${x - Math.cos(a) * 6} ${y - Math.sin(a) * 6}`} className="lab-arrow-line" />
        <path d={head} className="lab-arrow-head" />
        <circle cx={sx} cy={sy} r={4} className="lab-arrow-head" />
      </svg>
    );
  }

  // After an orientation answer: the four edges, as they now stand.
  const pills =
    answered && item && entry && (item.kind === 'orientazioa' || item.kind === 'planoa')
      ? EDGES.map((e) => ({ e, d: dirAt(entry.orientation, e, item.rot, item.mirror) })).filter((x) => x.d)
      : [];

  const simHref =
    item && target
      ? `/astea/${item.w}?${new URLSearchParams({ etapa: item.stage, ikuspegia: item.view, une: String(Math.max(0.001, item.t)), egitura: target }).toString()}`
      : item
        ? `/astea/${item.w}?${new URLSearchParams({ etapa: item.stage, ikuspegia: item.view, une: String(Math.max(0.001, item.t)) }).toString()}`
        : '#';
  const toSim = () => {
    if (!item) return;
    try {
      window.sessionStorage.setItem(
        'enbrioatlas:back',
        JSON.stringify({ week: 0, stage: '', t: 0, selected: null, title: 'irudira', href: `/irudiak?irudia=${encodeURIComponent(code)}`, at: Date.now(), to: `${item.w}/${item.stage}` }),
      );
    } catch {
      // Without storage the link still opens the simulator; only the way back is lost.
    }
  };

  const transformNote = item && (item.rot || item.mirror) ? `${item.rot ? `${item.rot}° biratuta` : ''}${item.rot && item.mirror ? ' eta ' : ''}${item.mirror ? 'ispiluan' : ''}` : '';
  const def = target ? structures.get(target)?.definition : undefined;

  return (
    <div className="landing">
      <LandNav current="irudiak" />
      <section className="ln-hero lab-hero">
        <p className="eyebrow">Irudi-laborategia</p>
        <h1>Irudiak irakurtzen</h1>
        <p className="hero-lead">Irudi bat etiketarik gabe, zuri-beltzean eta biratuta ere irakurtzen jakin behar da. Hemen gure eszenak horrela ikusten dituzu: seinalatu egitura, esan zer den gezia, aurkitu orientazioa eta ebaki-planoa.</p>
      </section>

      <section className="lab">
        <div className="lab-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'geureak'} className={tab === 'geureak' ? 'is-on' : ''} onClick={() => setTab('geureak')}>
            Atlaseko irudiak
          </button>
          <button role="tab" aria-selected={tab === 'orriak'} className={tab === 'orriak' ? 'is-on' : ''} onClick={() => setTab('orriak')}>PDFetako irudiak</button>
          <PrivateTab active={tab === 'pribatuak'} onOpen={() => setTab('pribatuak')} />
        </div>

        {tab === 'orriak' ? (
          <CourseFigures />
        ) : tab === 'pribatuak' ? (
          <PrivateImages />
        ) : (
          <>
            <div className="lab-controls">
              <div className="qz-kinds" role="group" aria-label="Ariketa mota">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    className={mode === k.id ? 'is-on' : ''}
                    title={k.hint}
                    onClick={() => {
                      setMode(k.id);
                      next(k.id, week);
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <div className="qz-kinds" role="group" aria-label="Gaia">
                {[null, ...weeks.filter((w) => !isWip(w)).map((w) => w.week)].map((n) => (
                  <button
                    key={n ?? 'all'}
                    className={week === n ? 'is-on' : ''}
                    onClick={() => {
                      setWeek(n);
                      next(mode, n);
                    }}
                  >
                    {n === null ? 'Gai guztiak' : `${n}. gaia`}
                  </button>
                ))}
              </div>
              <span className="lab-score" title="Saio honetan zuzen erantzundakoak / erantzundakoak">
                {score.ok}/{score.n} <small>zuzen</small>
              </span>
            </div>

            <div className="lab-main">
              <div className={`lab-fig${color ? '' : ' is-print'}${labels ? ' is-labelled' : ''}${item?.kind === 'seinalatu' && !answered ? ' is-pointing' : ''}`} ref={box} style={{ ['--lab-r' as string]: `${-(item?.rot ?? 0)}deg`, ['--lab-m' as string]: item?.mirror ? -1 : 1 }}>
                {hydrated && item && Scene && (
                  <svg ref={svg} viewBox={vb} preserveAspectRatio="xMidYMid meet" className={`lab-svg${fit?.key === figKey ? '' : ' is-fitting'}`} style={{ ['--lab-ar' as string]: aspectOf(vb) }} role="img" aria-label="Etiketarik gabeko irudia">
                    <Defs />
                    <SceneContext.Provider value={ctx}>
                      <g transform={f.turn}>
                        <g transform={f.flip}>
                          <g key={figKey} className="scene-enter">
                            <SceneView Scene={Scene} t={item.t} reduced />
                          </g>
                        </g>
                      </g>
                    </SceneContext.Provider>
                  </svg>
                )}
                {arrow}
                {pills.map(({ e, d }) => (
                  <span key={e} className={`lab-pill is-${e}${item?.kind === 'orientazioa' && e === item.edge ? ' is-asked' : ''}`}>
                    {d}
                  </span>
                ))}
              </div>

              <aside className="lab-side">
                <p className="kicker">{KINDS.find((k) => k.id === item?.kind)?.label ?? 'Irudia'}</p>
                <h2 className="lab-q">{prompt || 'Irudia prestatzen…'}</h2>
                {item?.kind === 'seinalatu' && !answered && ready && <p className="muted">Klikatu egituraren gainean. Etiketak ezkutatuta daude.</p>}

                {choices.length > 0 && (
                  <div className="quiz-options">
                    {choices.map((c, k) => {
                      const state = !answered ? '' : c.value === right ? ' is-right' : c.value === picked ? ' is-wrong' : ' is-faded';
                      return (
                        <button key={c.value} className={`quiz-option${state}`} disabled={answered} onClick={() => answer(c.value)}>
                          <span className="opt-letter">{k + 1}</span>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {answered && item && (
                  <div className={`quiz-expl${ok ? ' ok' : ' bad'}`}>
                    {(item.kind === 'seinalatu' || item.kind === 'gezia') && target && (
                      <>
                        <p>
                          <b>{ok ? 'Bai!' : 'Ez.'}</b> {ok ? `Hori da ${nameOf(target)}.` : `Hori ${nameOf(picked!)} da; ${nameOf(target)} irudian argiztatuta dago.`}
                        </p>
                        {def && <p className="muted">{firstSentence(def)}</p>}
                      </>
                    )}
                    {item.kind === 'orientazioa' && (
                      <>
                        <p>
                          <b>{ok ? 'Bai!' : 'Ez.'}</b> {EDGE_NAME[item.edge!].toLowerCase()}: <b>{right}</b>.{transformNote && ` Irudia ${transformNote} zegoen.`}
                        </p>
                        <p className="muted">Pista: {DIR_HINT[right as Dir]}.</p>
                      </>
                    )}
                    {item.kind === 'planoa' && entry && (
                      <>
                        <p>
                          <b>{ok ? 'Bai!' : 'Ez.'}</b> {PLANE_TEXT[entry.plane].name}.
                        </p>
                        <p className="muted">{PLANE_TEXT[entry.plane].text}</p>
                      </>
                    )}
                    <p className="lab-where">
                      {wk?.week}. gaia · {stage?.title} · {view?.label}
                      {transformNote && item.kind !== 'orientazioa' ? ` · ${transformNote}` : ''}
                    </p>
                  </div>
                )}

                <div className="lab-actions">
                  {answered ? (
                    <button className="btn primary" onClick={() => next()} autoFocus>
                      Hurrengoa →
                    </button>
                  ) : (
                    <button className="btn ghost small" onClick={() => next()}>
                      Beste irudi bat
                    </button>
                  )}
                  {answered && (
                    <button className={`btn small ghost${labels ? ' is-on' : ''}`} onClick={() => setLabels((v) => !v)} aria-pressed={labels}>
                      Etiketak
                    </button>
                  )}
                  <button className={`btn small ghost${color ? ' is-on' : ''}`} onClick={() => setColor((v) => !v)} aria-pressed={color} title="Koloreak ala zuri-beltza">
                    Koloretan
                  </button>
                  {answered && (
                    <Link className="btn small" href={simHref} onClick={toSim}>
                      Ikusi simulazioan
                    </Link>
                  )}
                </div>
                <p className="lab-keys">Teklak: 1–5 erantzun · Enter hurrengoa</p>
              </aside>
            </div>
          </>
        )}
      </section>
      <LandFoot>
        <p>Irudi hauek atlasaren eszenak dira (geureak). Ikasgaiko irudiak (Langman…) ez dira hemen argitaratzen: zure ordenagailuan bakarrik kargatzen dira, «Ikasgaiko irudiak» fitxan.</p>
      </LandFoot>
    </div>
  );
}
