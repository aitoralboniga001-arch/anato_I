'use client';

import { forwardRef, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from 'react';
import { Defs } from '@/components/kit/Defs';
import { LabelScaleContext, TextLayerContext, UnderlayContext, type LookSide, type Underlay } from '@/components/kit/context';
import { prewarm3D } from '@/components/kit/three/Stage3D';
import type { Orientation } from '@/lib/sim/types';
import { IconFit, IconZoomIn, IconZoomOut } from './icons';

const W = 1000;
const H = 640;

interface ViewportProps {
  /** Show keyboard- and touch-accessible camera controls for an interactive 3D view. */
  interactive3d?: boolean;
  orientation?: Orientation;
  children: ReactNode;
  /** Changing this key resets zoom (e.g. when the view changes). */
  resetKey: string;
  onBackgroundClick: () => void;
  overlay?: ReactNode;
  /** Structures the step is about: when one is drawn too small to notice, a pulsing ring points at it. */
  marks?: readonly string[];
  /** Names for the ring tags. */
  nameOf?: (id: string) => string;
  /**
   * What goes full screen. The whole study screen, not just the scene, so the explanation stays
   * beside the picture; the scene alone is the fallback.
   */
  fullscreenRef?: RefObject<HTMLElement | null>;
  /** Told when full screen starts or ends (the screen hides its chrome while it lasts). */
  onFullscreenChange?: (on: boolean) => void;
  /** A card sits over the left of the scene (the stage preview): the specimen glides aside to stay in view. */
  makeRoom?: boolean;
  /**
   * Name whatever the pointer is on when the scene shows no label for it, so nothing drawn is ever
   * unnamed. Off while names are hidden on purpose (labels off, the find quiz).
   */
  hoverNames?: boolean;
  /** The viewer turned a 3D view by dragging it (once is enough: the shell stops explaining how). */
  onTurn?: () => void;
  /**
   * What the step names. When the zoomed frame cuts one of them off, the camera backs off just enough
   * to show them, holds a moment, then glides back to the zoom the viewer had.
   */
  reveal?: readonly string[];
  /** Changes with the step: the reveal runs once per step. */
  revealKey?: string;
}

interface Zoom {
  k: number;
  x: number;
  y: number;
}

const HOME: Zoom = { k: 1, x: 0, y: 0 };

/** Zoom by `factor` about the scene point (px, py), clamped to 1..6. */
function zoomedAt(p: Zoom, factor: number, px: number, py: number): Zoom {
  const k = Math.min(6, Math.max(1, p.k * factor));
  if (k === 1) return HOME;
  const f = k / p.k;
  return { k, x: px - (px - p.x) * f, y: py - (py - p.y) * f };
}

/**
 * The named sides as the camera keys say them ("see it from…"). Keyed by the view's own direction words,
 * so each key says the side in plain words and, beside it, the anatomical name the edges use.
 */
const FROM: Record<string, string> = {
  Bentrala: 'Aurretik',
  Dortsala: 'Atzetik',
  Ezkerra: 'Ezkerretik',
  Eskuina: 'Eskuinetik',
  Kraneala: 'Goitik',
  Kaudala: 'Behetik',
};
const fromWord = (name: string) => FROM[name] ?? `${name}etik`;
/** Key order: front and back, the two sides (the embryo's left first), above and below. */
const LOOK_ORDER = (names: Record<LookSide, string>): LookSide[] => {
  const sides: LookSide[] = names.side === 'Eskuina' ? ['otherSide', 'side'] : ['side', 'otherSide'];
  return ['front', 'back', ...sides, 'up', 'down'];
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Mark {
  id: string;
  /** The scene already names it with a visible label (then the ring carries no tag). */
  named: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Visible opacity of a drawn element (stage-driven `opacity` attributes and CSS), up to the svg. */
function seenOpacity(el: Element, svg: SVGSVGElement) {
  let o = 1;
  for (let e: Element | null = el; e && e !== svg; e = e.parentElement) {
    o *= Number(e.getAttribute('opacity') ?? 1);
    const cs = getComputedStyle(e);
    o *= Number(cs.opacity);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
  }
  return o;
}

/** Bounding box of an element in the coordinates of `root` (the un-zoomed scene group). */
function boxIn(el: SVGGraphicsElement, root: SVGGraphicsElement) {
  const b = el.getBBox();
  const m = root.getScreenCTM()?.inverse().multiply(el.getScreenCTM() ?? new DOMMatrix());
  if (!m || b.width + b.height === 0) return null;
  const pts = [
    [b.x, b.y],
    [b.x + b.width, b.y],
    [b.x, b.y + b.height],
    [b.x + b.width, b.y + b.height],
  ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** On-screen size (scene units × zoom) below which a structure gets a ring. */
const SMALL_AREA = 2600;
const SMALL_SIDE = 12;

/** Where the marked structures are drawn small enough to be missed (at most 6 rings). */
function measureMarks(svg: SVGSVGElement, root: SVGGraphicsElement, ids: string[], k: number): Mark[] {
  const out: Mark[] = [];
  for (const id of ids) {
    const drawn = [...svg.querySelectorAll<SVGGElement>(`[data-part="${CSS.escape(id)}"]`)].filter((el) => seenOpacity(el, svg) > 0.3);
    // Features painted into a figure (the fetus's eye, lanugo…) have no part of their own: point at the label's anchor.
    const pins = drawn.length ? [] : [...svg.querySelectorAll<SVGCircleElement>(`[data-label="${CSS.escape(id)}"] .label-dot`)].filter((el) => seenOpacity(el, svg) > 0.3);
    const boxes = [...drawn, ...pins]
      .map((el) => boxIn(el, root))
      .filter((b): b is NonNullable<typeof b> => !!b);
    if (!boxes.length) continue;
    const named = [...svg.querySelectorAll(`[data-label="${CSS.escape(id)}"]`)].some((el) => seenOpacity(el, svg) > 0.3);
    const small = (b: { w: number; h: number }) => b.w * b.h * k * k < SMALL_AREA || Math.min(b.w, b.h) * k < SMALL_SIDE;
    const x0 = Math.min(...boxes.map((b) => b.x));
    const y0 = Math.min(...boxes.map((b) => b.y));
    const all = { id, named, x: x0, y: y0, w: Math.max(...boxes.map((b) => b.x + b.w)) - x0, h: Math.max(...boxes.map((b) => b.y + b.h)) - y0 };
    if (Math.max(all.w, all.h) * k < 160 && small(all)) out.push(all);
    else out.push(...boxes.filter(small).slice(0, 3).map((b) => ({ id, named, ...b })));
  }
  // Rings that overlap become one (e.g. the ear hillocks and the meatus they surround).
  const merged: Mark[] = [];
  for (const m of out) {
    const o = merged.find((n) => m.x < n.x + n.w + 8 && n.x < m.x + m.w + 8 && m.y < n.y + n.h + 8 && n.y < m.y + m.h + 8);
    if (!o) merged.push({ ...m });
    else {
      const x = Math.min(o.x, m.x);
      const y = Math.min(o.y, m.y);
      Object.assign(o, { w: Math.max(o.x + o.w, m.x + m.w) - x, h: Math.max(o.y + o.h, m.y + m.h) - y, x, y, named: o.named && m.named });
    }
  }
  return merged.slice(0, 6);
}

/** Scene-space box of all drawn pieces of the given structures together (null when none is drawn in this view). */
function boxOf(svg: SVGSVGElement, root: SVGGraphicsElement, ids: readonly string[]): { x: number; y: number; w: number; h: number } | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const id of ids) {
    const drawn = [...svg.querySelectorAll<SVGGElement>(`[data-part="${CSS.escape(id)}"]`)].filter((el) => seenOpacity(el, svg) > 0.3);
    const pins = drawn.length ? [] : [...svg.querySelectorAll<SVGCircleElement>(`[data-label="${CSS.escape(id)}"] .label-dot`)].filter((el) => seenOpacity(el, svg) > 0.3);
    for (const el of [...drawn, ...pins]) {
      const b = boxIn(el, root);
      if (!b) continue;
      x0 = Math.min(x0, b.x);
      y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.w);
      y1 = Math.max(y1, b.y + b.h);
    }
  }
  return x1 > x0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/** How long the wider view stays before the camera glides back in. */
const REVEAL_HOLD_MS = 2600;

const sameMarks = (a: Mark[], b: Mark[]) =>
  a.length === b.length && a.every((m, i) => m.id === b[i].id && Math.abs(m.x - b[i].x) + Math.abs(m.y - b[i].y) + Math.abs(m.w - b[i].w) + Math.abs(m.h - b[i].h) < 3);

/** SVG stage with wheel/drag zoom-pan, orientation edges and a feathered specimen backdrop. */
export const Viewport = forwardRef<SVGSVGElement, ViewportProps>(function Viewport(
  { orientation, children, resetKey, onBackgroundClick, overlay, marks, nameOf, fullscreenRef, onFullscreenChange, makeRoom, hoverNames, onTurn, reveal, revealKey, interactive3d },
  svgRef,
) {
  const [tag, setTag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [z, setZ] = useState<Zoom>(HOME);
  // Zoom glides (buttons, rings, reset); the wheel and dragging stay direct.
  const zNow = useRef<Zoom>(HOME);
  const zGoal = useRef<Zoom | null>(null);
  const zRaf = useRef(0);
  useEffect(() => {
    zNow.current = z;
  }, [z]);
  const stopZoom = () => {
    cancelAnimationFrame(zRaf.current);
    zGoal.current = null;
  };
  const glideZoom = useCallback((to: Zoom) => {
    cancelAnimationFrame(zRaf.current);
    const from = zNow.current;
    if (reducedMotion()) {
      zGoal.current = null;
      setZ(to);
      return;
    }
    zGoal.current = to;
    // The point at the centre of the frame moves in a straight line while the scale changes geometrically.
    const c0 = { x: (W / 2 - from.x) / from.k, y: (H / 2 - from.y) / from.k };
    const c1 = { x: (W / 2 - to.x) / to.k, y: (H / 2 - to.y) / to.k };
    const t0 = performance.now();
    const ms = 420;
    const frame = (now: number) => {
      const u = Math.min(1, (now - t0) / ms);
      const e = 1 - (1 - u) ** 3;
      const k = from.k * (to.k / from.k) ** e;
      const cx = c0.x + (c1.x - c0.x) * e;
      const cy = c0.y + (c1.y - c0.y) * e;
      setZ(u < 1 ? { k, x: W / 2 - cx * k, y: H / 2 - cy * k } : to);
      if (u < 1) zRaf.current = requestAnimationFrame(frame);
      else zGoal.current = null;
    };
    zRaf.current = requestAnimationFrame(frame);
  }, []);
  useEffect(() => () => cancelAnimationFrame(zRaf.current), []);
  // A reveal in progress: the zoom to glide back to once the hold is over (and its timer).
  const revealRun = useRef<{ home: Zoom; timer: number } | null>(null);
  /** The viewer takes the zoom into their own hands: no glide back. */
  const cancelReveal = useCallback(() => {
    if (revealRun.current) window.clearTimeout(revealRun.current.timer);
    revealRun.current = null;
  }, []);
  useEffect(() => cancelReveal, [cancelReveal]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ x: number; y: number; zx: number; zy: number; moved: boolean; turned?: boolean } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const scene = useRef<SVGGElement>(null);
  const [rings, setRings] = useState<Mark[]>([]);
  const [textLayer, setTextLayer] = useState<SVGGElement | null>(null);
  // 3D views draw their shaded tissue here, behind the SVG that keeps the names and the pointing.
  const [underHost, setUnderHost] = useState<HTMLDivElement | null>(null);
  const [sceneEl, setSceneEl] = useState<SVGGElement | null>(null);
  // WebGL made ready once the page is quiet, so no 3D view (or camera move into one) waits for it.
  useEffect(() => {
    if (!underHost) return;
    const id = window.setTimeout(() => prewarm3D(underHost), 1200);
    return () => window.clearTimeout(id);
  }, [underHost]);
  const sceneRef = useCallback((el: SVGGElement | null) => {
    scene.current = el;
    setSceneEl(el);
  }, []);
  const zoomed = z.k > 1.01;
  const [orbitCommand, setOrbitCommand] = useState<{ key: string; request: NonNullable<Underlay['orbitRequest']> } | null>(null);
  const orbitRequest = orbitCommand?.key === resetKey ? orbitCommand.request : undefined;
  // A 3D view keeps the edge pills true to its camera as it turns (the view's own words otherwise).
  const [liveOrient, setLiveOrient] = useState<{ key: string; o: Orientation } | null>(null);
  const setOrient = useCallback((o: Orientation | null) => setLiveOrient(o ? { key: resetKey, o } : null), [resetKey]);
  // A 3D view with named sides: the camera keys say them, and light the one it is seen from.
  const [liveLook, setLiveLook] = useState<{ key: string; names: Record<LookSide, string>; facing?: LookSide } | null>(null);
  const setLook = useCallback((l: { names: Record<LookSide, string>; facing?: LookSide } | null) => setLiveLook(l ? { key: resetKey, ...l } : null), [resetKey]);
  const look = liveLook?.key === resetKey ? liveLook : null;
  const underlay = useMemo<Underlay | null>(() => (underHost ? { host: underHost, scene: sceneEl, zoomed, orbitRequest, setOrient, setLook } : null), [underHost, sceneEl, zoomed, orbitRequest, setOrient, setLook]);
  const turnModel = (direction: NonNullable<Underlay['orbitRequest']>['direction'], side?: LookSide) => {
    cancelReveal();
    if (direction === 'reset') glideZoom(HOME);
    setOrbitCommand((old) => ({ key: resetKey, request: { direction, look: side, serial: (old?.request.serial ?? 0) + 1 } }));
    onTurn?.();
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const markKey = (marks ?? []).join('|');

  // Re-measured after renders (the scene moves while it plays), but at most four times a second while
  // it plays (measuring reads the styles of every marked part): new marks or a new zoom are measured
  // at once. State changes only when a ring moves.
  const lastMarks = useRef({ t: -1e9, key: '', k: 0 });
  useEffect(() => {
    const last = lastMarks.current;
    const fresh = last.key !== markKey || last.k !== z.k;
    const wait = fresh ? 0 : Math.max(0, 250 - (performance.now() - last.t));
    const measure = () => {
      const svg = scene.current?.ownerSVGElement;
      const next = svg && scene.current && markKey ? measureMarks(svg, scene.current, markKey.split('|'), z.k) : [];
      lastMarks.current = { t: performance.now(), key: markKey, k: z.k };
      setRings((prev) => (sameMarks(prev, next) ? prev : next));
    };
    let raf = 0;
    const timer = window.setTimeout(() => (raf = requestAnimationFrame(measure)), wait);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  });

  useEffect(() => {
    cancelAnimationFrame(zRaf.current);
    cancelReveal();
    zGoal.current = null;
    setZ(HOME);
    setOrbitCommand(null);
  }, [resetKey, cancelReveal]);

  // The step names structures that the zoomed frame may cut off: back off just enough to show them, hold,
  // then glide back to the viewer's zoom. Runs once per step, after the step is drawn.
  const revealStep = useEffectEvent(() => {
    const svg = scene.current?.ownerSVGElement;
    const root = scene.current;
    if (!svg || !root || !reveal?.length) return;
    const cur = zGoal.current ?? zNow.current;
    // A reveal under way keeps the viewer's own zoom as the one to return to.
    const home = revealRun.current?.home ?? cur;
    if (home.k <= 1.01) return;
    const box = boxOf(svg, root, reveal);
    if (!box) return;
    // The part of the scene the frame shows now, in scene units.
    const view = { x: -cur.x / cur.k, y: -cur.y / cur.k, w: W / cur.k, h: H / cur.k };
    const m = view.w * 0.03;
    const inside = box.x >= view.x + m && box.y >= view.y + m && box.x + box.w <= view.x + view.w - m && box.y + box.h <= view.y + view.h - m;
    if (inside) return;
    // The closest zoom that still shows all of them (never closer than the viewer's own zoom).
    const k = Math.max(1, Math.min(home.k, W / (box.w * 1.12 + 40), H / (box.h * 1.12 + 40)));
    if (k > home.k * 0.97) return;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const to = k <= 1.01 ? HOME : { k, x: W / 2 - cx * k, y: H / 2 - cy * k };
    if (revealRun.current) window.clearTimeout(revealRun.current.timer);
    glideZoom(to);
    const timer = window.setTimeout(() => {
      revealRun.current = null;
      glideZoom(home);
    }, REVEAL_HOLD_MS);
    revealRun.current = { home, timer };
  });
  useEffect(() => {
    if (!revealKey) return;
    const raf = requestAnimationFrame(() => revealStep());
    return () => cancelAnimationFrame(raf);
  }, [revealKey]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Room for the preview card (min(400px, 44%) wide, 14px in): the specimen (≈78% of the frame wide)
  // shrinks just enough and centres itself in what is left, then glides back when the card goes.
  let room: Zoom = HOME;
  if (makeRoom && size && size.w >= 820) {
    const s = Math.min(size.w / W, size.h / H);
    const ox = (size.w - W * s) / 2;
    const left = (Math.min(400, size.w * 0.44) + 14 + 18 - ox) / s;
    if (left > 30) {
      const k = Math.min(1, Math.max(0.6, (W - left) / (W * 0.78)));
      room = { k, x: left + (W - left) / 2 - (W / 2) * k, y: (H / 2) * (1 - k) };
    }
  }

  // Labels keep about 13.5px on screen however small the frame is drawn (13.5 frame units at scale
  // 1), growing at most 50% (tablets, short laptop screens; each label still only grows as far as it
  // fits); zooming in makes them larger as usual.
  const fit = size ? Math.min(size.w / W, size.h / H) : 1;
  const labelK = Math.round(Math.min(1.5, Math.max(1, 1 / (fit * z.k * room.k))) * 50) / 50;
  const edges = orientation && liveOrient?.key === resetKey ? liveOrient.o : orientation;
  const pillL = !!edges?.left;
  const pillR = !!edges?.right;
  const labelScale = useMemo(() => ({ k: labelK, left: pillL, right: pillR }), [labelK, pillL, pillR]);

  const changed = useEffectEvent((on: boolean) => onFullscreenChange?.(on));

  useEffect(() => {
    let was = false;
    const syncFullscreen = () => {
      const on = !!document.fullscreenElement && document.fullscreenElement === (fullscreenRef?.current ?? wrap.current);
      setIsFullscreen(on);
      setFullscreenError('');
      if (on !== was) {
        was = on;
        changed(on);
      }
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    syncFullscreen();
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, [fullscreenRef]);

  const toggleFullscreen = useCallback(async () => {
    const el = fullscreenRef?.current ?? wrap.current;
    if (!el) return;
    setFullscreenError('');
    try {
      if (document.fullscreenElement === el) {
        if (!document.exitFullscreen) {
          setFullscreenError('Ezin izan da pantaila osotik irten.');
          return;
        }
        await document.exitFullscreen();
      } else {
        if (!el.requestFullscreen) {
          setFullscreenError('Pantaila osoa ez dago erabilgarri nabigatzaile honetan.');
          return;
        }
        await el.requestFullscreen();
      }
    } catch {
      setFullscreenError(document.fullscreenElement === el
        ? 'Ezin izan da pantaila osotik irten.'
        : 'Ezin izan da pantaila osoa aktibatu.');
    }
  }, [fullscreenRef]);

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const el = wrap.current?.querySelector('svg.viewport-svg');
    if (!el) return { x: W / 2, y: H / 2, s: 1 };
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H);
    const ox = (r.width - W * s) / 2;
    const oy = (r.height - H * s) / 2;
    return { x: (clientX - r.left - ox) / s, y: (clientY - r.top - oy) / s, s };
  }, []);

  /** Buttons: glide, building on a zoom still under way so quick clicks add up. */
  const zoomAt = useCallback((factor: number, px = W / 2, py = H / 2) => {
    cancelReveal();
    glideZoom(zoomedAt(zGoal.current ?? zNow.current, factor, px, py));
  }, [glideZoom, cancelReveal]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      cancelReveal();
      cancelAnimationFrame(zRaf.current);
      zGoal.current = null;
      setZ((z) => zoomedAt(z, Math.exp(-e.deltaY * 0.0022), p.x, p.y));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [toSvg, cancelReveal]);

  return (
    <div
      ref={wrap}
      data-tour="eszena"
      className={`viewport${z.k > 1 ? ' is-zoomed' : ''}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        cancelReveal();
        if (z.k > 1) stopZoom();
        drag.current = { x: e.clientX, y: e.clientY, zx: z.x, zy: z.y, moved: false };
      }}
      onPointerMove={(e) => {
        if (hoverNames && e.pointerType === 'mouse') {
          const svg = wrap.current?.querySelector<SVGSVGElement>('svg.viewport-svg');
          const el = e.target instanceof Element && !e.target.closest('[data-label]') ? e.target.closest('[data-part]') : null;
          const id = el?.getAttribute('data-part') ?? null;
          // Only what the picture leaves unnamed: a visible label already says it.
          const named = !!id && !!svg && [...svg.querySelectorAll(`[data-label="${CSS.escape(id)}"]`)].some((l) => seenOpacity(l, svg) > 0.3);
          const r = wrap.current!.getBoundingClientRect();
          const next = id && !named && !drag.current?.moved ? { id, x: e.clientX - r.left, y: e.clientY - r.top } : null;
          setTag((p) => (!next ? null : p && p.id === next.id && Math.abs(p.x - next.x) + Math.abs(p.y - next.y) < 3 ? p : next));
        }
        const d = drag.current;
        if (d && !d.turned && onTurn && e.target instanceof Element && e.target.closest('.stage3d') && Math.hypot(e.clientX - d.x, e.clientY - d.y) >= 5) {
          d.turned = true;
          onTurn();
        }
        if (!d || z.k === 1) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 4) return;
        d.moved = true;
        const { s } = toSvg(e.clientX, e.clientY);
        setZ((p) => ({ ...p, x: d.zx + dx / s, y: d.zy + dy / s }));
      }}
      onPointerUp={() => {
        setTimeout(() => (drag.current = null), 0);
      }}
      onPointerLeave={() => setTag(null)}
      onClickCapture={(e) => {
        if (drag.current?.moved) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onDoubleClick={() => {
        cancelReveal();
        glideZoom(HOME);
      }}
    >
      <div ref={setUnderHost} className="viewport-underlay" aria-hidden />
      <svg
        ref={svgRef}
        className="viewport-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={onBackgroundClick}
        role="img"
      >
        <Defs />
        <g transform={`translate(${z.x} ${z.y}) scale(${z.k})`}>
          <g className="scene-room" style={{ transform: `translate(${room.x}px, ${room.y}px) scale(${room.k})` }}>
          <g ref={sceneRef}>
            <UnderlayContext.Provider value={underlay}>
              <TextLayerContext.Provider value={textLayer}>
                <LabelScaleContext.Provider value={labelScale}>{children}</LabelScaleContext.Provider>
              </TextLayerContext.Provider>
            </UnderlayContext.Provider>
          </g>
          {rings.length > 0 && (
            <defs>
              <radialGradient id="vp-mark-light">
                <stop offset="0" stopColor="#ffb86b" stopOpacity={0.5} />
                <stop offset="0.45" stopColor="#ffb86b" stopOpacity={0.3} />
                <stop offset="1" stopColor="#ffb86b" stopOpacity={0} />
              </radialGradient>
            </defs>
          )}
          {rings.map((m, i) => {
            const u = 1 / z.k;
            const pad = 10 * u;
            const r = Math.max(m.w / 2 + pad, m.h / 2 + pad, 16 * u);
            const rx = Math.max(m.w / 2 + pad, r * 0.6);
            const ry = Math.max(m.h / 2 + pad, r * 0.6);
            const cx = m.x + m.w / 2;
            const cy = m.y + m.h / 2;
            const name = m.named ? undefined : nameOf?.(m.id);
            const zoomIn = (e: ReactMouseEvent) => {
              e.stopPropagation();
              const k = Math.min(6, Math.max(z.k * 1.5, Math.min(W / (m.w * 6 + 60), H / (m.h * 6 + 60))));
              cancelReveal();
              glideZoom({ k, x: W / 2 - cx * k, y: H / 2 - cy * k });
            };
            // Name pill above the ring (below it when the ring is at the top edge), joined by a short stem.
            const fs = 11.5 * u;
            const pw = (name ? name.length * 6.6 + 34 : 0) * u;
            const ph = 21 * u;
            const above = cy - ry - 34 * u > 4;
            const py = above ? cy - ry - 12 * u - ph : cy + ry + 12 * u;
            return (
              <g key={`${m.id}-${i}-${markKey}`} className="mark mark-still" aria-hidden>
                {/* No outline drawn over the anatomy: a soft pool of warm light on the structure itself. */}
                <ellipse className="mark-light" cx={cx} cy={cy} rx={rx * 1.45} ry={ry * 1.45} fill="url(#vp-mark-light)" />
                <ellipse className="mark-hit" cx={cx} cy={cy} rx={rx} ry={ry} onClick={zoomIn}>
                  <title>{name ? `${name}: handitu` : 'Handitu'}</title>
                </ellipse>
                {name && i < 3 && (
                  <g className="mark-pill" onClick={zoomIn}>
                    <title>{`${name}: handitu`}</title>
                    <path className="mark-tick-casing" d={`M${cx},${cy} L${cx},${above ? py + ph : py}`} vectorEffect="non-scaling-stroke" />
                    <path className="mark-tick" d={`M${cx},${cy} L${cx},${above ? py + ph : py}`} vectorEffect="non-scaling-stroke" />
                    <circle className="mark-pin" cx={cx} cy={cy} r={3.2 * u} />
                    <rect className="mark-pill-plate" x={cx - pw / 2} y={py} width={pw} height={ph} rx={ph / 2} vectorEffect="non-scaling-stroke" />
                    {/* Magnifier: the pill (and the ring) zoom in on what it points at. */}
                    <circle className="mark-pill-icon" cx={cx - pw / 2 + 12 * u} cy={py + ph / 2 - 1 * u} r={3.6 * u} vectorEffect="non-scaling-stroke" />
                    <path className="mark-pill-icon" d={`M${cx - pw / 2 + 14.6 * u},${py + ph / 2 + 1.6 * u} l${3 * u},${3 * u}`} vectorEffect="non-scaling-stroke" />
                    <text className="mark-tag" x={cx - pw / 2 + 21 * u} y={py + ph / 2} dy="0.35em" fontSize={fs}>
                      {name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {/* Names, notes and call-outs land here (kit OnTop): above every leader, arrow and marker. */}
          <g ref={setTextLayer} className="text-layer" data-tour="etiketak" />
          </g>
        </g>
      </svg>

      {edges && (
        // Keyed by their words: a pill whose direction changed as a 3D view turned fades in anew.
        <div className="orient" data-tour="norabideak" aria-hidden>
          {edges.top && <span key={`t:${edges.top}`} className="orient-top">▲ {edges.top}</span>}
          {edges.bottom && <span key={`b:${edges.bottom}`} className="orient-bottom">▼ {edges.bottom}</span>}
          {edges.left && <span key={`l:${edges.left}`} className="orient-left">◀ {edges.left}</span>}
          {edges.right && <span key={`r:${edges.right}`} className="orient-right">{edges.right} ▶</span>}
        </div>
      )}

      <div className="zoom-controls">
        <button className="icon-btn" onClick={() => zoomAt(1.35)} aria-label="Handitu" data-tip="Handitu · Ctrl + gurpila" data-tip-pos="left">
          <IconZoomIn />
        </button>
        <button className="icon-btn" onClick={() => zoomAt(1 / 1.35)} aria-label="Txikitu" data-tip="Txikitu" data-tip-pos="left">
          <IconZoomOut />
        </button>
        {z.k > 1.01 && (
          <button className="icon-btn zoom-level" onClick={() => { cancelReveal(); glideZoom(HOME); }} aria-label="Zooma berrezarri" data-tip="Irudi osoa ikusi · klik bikoitza" data-tip-pos="left">
            {Math.round(z.k * 100)}%
          </button>
        )}
        <button
          className="icon-btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Irten pantaila osotik' : 'Pantaila osoa'}
          aria-pressed={isFullscreen}
          data-tip={isFullscreen ? 'Irten pantaila osotik · Esc' : 'Pantaila osoa (azalpenarekin)'}
          data-tip-pos="left"
        >
          <IconFit />
        </button>
      </div>
      {interactive3d && look && (
        // Named sides: "see it from the front, from behind, from its left…" — the words a student
        // studies with, and the lit key always says where the picture is seen from now.
        <div className="look-controls" role="group" aria-label="Ikusi alde batetik" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
          <span className="look-title">{look.facing ? `${fromWord(look.names[look.facing])} ikusita` : 'Ikusi'}</span>
          <div className="look-keys">
            {LOOK_ORDER(look.names).map((side) => (
              <button
                key={side}
                type="button"
                className={`look-${side}`}
                aria-pressed={look.facing === side}
                onClick={() => turnModel('look', side)}
                data-tip={`Ikusi ${fromWord(look.names[side]).toLowerCase()} (${look.names[side].toLowerCase()})`}
                data-tip-pos="top"
              >
                {fromWord(look.names[side])}
              </button>
            ))}
          </div>
          <button type="button" className="look-reset" onClick={() => turnModel('reset')} aria-label="Ikuspegia berrezarri" data-tip="Hasierako ikuspegira itzuli (kamera eta zooma) · klik bikoitza" data-tip-pos="top">
            ↺
          </button>
        </div>
      )}
      {interactive3d && !look && (
        // A small camera cross in the view's lower corner, as on a map: the four turns round the reset key.
        <div className="orbit-controls" role="group" aria-label="Kamera" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
          {([
            ['up', '↑', 'Ikusi goragotik'],
            ['left', '←', 'Biratu ikuspegia ezkerrera'],
            ['reset', '↺', 'Ikuspegia berrezarri (kamera eta zooma; denbora ez da aldatzen)'],
            ['right', '→', 'Biratu ikuspegia eskuinera'],
            ['down', '↓', 'Ikusi beheragotik'],
          ] as const).map(([direction, symbol, label]) => (
            <button key={direction} type="button" className={`orbit-${direction}`} onClick={() => turnModel(direction)} aria-label={label} data-tip={label} data-tip-pos="left">{symbol}</button>
          ))}
        </div>
      )}
      {fullscreenError && <div className="viewport-fullscreen-error" role="status" aria-live="polite">{fullscreenError}</div>}
      {hoverNames && tag && nameOf && (
        <div className="hover-name" style={{ left: tag.x, top: tag.y }} aria-hidden>
          {nameOf(tag.id)}
        </div>
      )}
      {overlay}
    </div>
  );
});
