'use client';

import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { PaneContext } from '@/components/kit/context';
import type { ViewDef } from '@/lib/sim/types';

/**
 * The camera move into a close-up and back out. A detail view (one tissue, one organ) is never shown
 * placeless: the camera first darkens the rest of the view it comes from, dives into where that
 * structure is drawn, and the close-up grows out of that very spot; going back, the close-up shrinks
 * into its place in the whole view while the camera pulls back. One camera for both drawings, so the
 * close-up always sits where its structure is.
 */

export const ZOOM_MS = 2100;

const W = 1000;
const H = 640;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Camera easing: slow away, slow arrival (smootherstep). */
const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));
const ramp = (ms: number, a: number, b: number) => ease((ms - a) / (b - a));

export interface ZoomPlan {
  /** True going into the close-up, false coming back out of it. */
  inward: boolean;
  part: string;
  at?: [number, number, number];
  fromLabel: string;
  toLabel: string;
}

/** The zoom between two views of one stage, or null: one must be the other's close-up. */
export function zoomPlan(from: ViewDef, to: ViewDef): ZoomPlan | null {
  if (to.zoom?.from === from.id) return { inward: true, part: to.zoom.part, at: to.zoom.at, fromLabel: from.label, toLabel: to.label };
  if (from.zoom?.from === to.id) return { inward: false, part: from.zoom.part, at: from.zoom.at, fromLabel: from.label, toLabel: to.label };
  return null;
}

type Box = { x: number; y: number; w: number; h: number };

/** Where `part` is drawn inside `host`, in the host's coordinates (union of its visible pieces). */
function partBox(host: SVGGElement | null, part: string): Box | null {
  if (!host) return null;
  const inv = host.getScreenCTM()?.inverse();
  if (!inv) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  host.querySelectorAll<SVGGraphicsElement>(`[data-part="${CSS.escape(part)}"]`).forEach((el) => {
    if (Number(el.getAttribute('opacity') ?? 1) < 0.05) return;
    const b = el.getBBox();
    if (b.width + b.height === 0) return;
    const m = inv.multiply(el.getScreenCTM() ?? new DOMMatrix());
    for (const [x, y] of [
      [b.x, b.y],
      [b.x + b.width, b.y],
      [b.x, b.y + b.height],
      [b.x + b.width, b.y + b.height],
    ]) {
      const p = new DOMPoint(x, y).matrixTransform(m);
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
  });
  if (!(x1 > x0)) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** The region the camera closes in on: the structure with room round it, in the stage's proportions. */
function region(b: Box | null): Box {
  if (!b) return { x: 300, y: 192, w: 400, h: 256 };
  let w = Math.max(b.w * 1.5, 150);
  let h = Math.max(b.h * 1.5, 96);
  if (w / h > W / H) h = (w * H) / W;
  else w = (h * W) / H;
  // Never so close that the structure is all there is (and never wider than the stage).
  w = Math.min(W, Math.max(w, 260));
  h = (w * H) / W;
  const cx = Math.min(W - w / 2, Math.max(w / 2, b.x + b.w / 2));
  const cy = Math.min(H - h / 2, Math.max(h / 2, b.y + b.h / 2));
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** The camera at e (0 = the whole view, 1 = the region filling the stage). */
function camera(r: Box, e: number) {
  const s = W / r.w;
  const k = Math.exp(lerp(0, Math.log(s), e));
  // The centre moves so the region's own centre reaches the middle exactly as the scale arrives.
  const f = s === 1 ? e : (k - 1) / (s - 1);
  const cx = lerp(W / 2, r.x + r.w / 2, f);
  const cy = lerp(H / 2, r.y + r.h / 2, f);
  return `translate(${W / 2} ${H / 2}) scale(${k.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
}

/** The close-up laid on the region (the inverse of the camera's end). */
const onRegion = (r: Box) => `translate(${r.x.toFixed(2)} ${r.y.toFixed(2)}) scale(${(r.w / W).toFixed(4)})`;

export function ViewZoom({ plan, old, children, onDone, progress }: { plan: ZoomPlan; old: ReactNode; children: ReactNode; onDone: () => void; progress?: number }) {
  const root = useRef<SVGGElement>(null);
  /** The whole view's drawing (the one the close-up belongs to). */
  const wholeRef = useRef<SVGGElement>(null);
  const reg = useRef<Box | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const draw = (ms: number) => {
    const g = root.current;
    const r = reg.current;
    if (!g || !r) return;
    const q = (k: string) => g.querySelector<SVGElement>(`[data-z="${k}"]`);
    const set = (k: string, attrs: Record<string, string | number>) => {
      const el = q(k);
      if (el) for (const [a, v] of Object.entries(attrs)) el.setAttribute(a, typeof v === 'number' ? v.toFixed(3) : v);
    };
    // The whole view's camera, and the close-up riding on it at its region.
    const IN0 = 350;
    const IN1 = 1550;
    const e = glide((ms - IN0) / (IN1 - IN0));
    const cam = camera(r, plan.inward ? e : 1 - e);
    const whole = plan.inward ? 'old' : 'new';
    const close = plan.inward ? 'new' : 'old';
    set(`${whole}-cam`, { transform: cam });
    set(`${close}-cam`, { transform: `${cam} ${onRegion(r)}` });
    // Everything but the region dims while the camera aims, then lifts as the close-up takes over.
    const dim = plan.inward ? ramp(ms, 0, 350) * (1 - ramp(ms, 1200, 1600)) : ramp(ms, 300, 700) * (1 - ramp(ms, 1450, 1900));
    set('dim', { opacity: dim * 0.8 });
    // The two drawings cross only where the camera is close in: one picture at a time, never a blend of both.
    if (plan.inward) {
      set('old', { opacity: 1 - ramp(ms, 1250, 1700) });
      set('new', { opacity: ramp(ms, 1050, 1500) });
    } else {
      set('old', { opacity: 1 - ramp(ms, 250, 700) });
      set('new', { opacity: ramp(ms, 0, 450) });
    }
    set('caption', { opacity: ramp(ms, 0, 350) * (1 - ramp(ms, ZOOM_MS - 500, ZOOM_MS - 100)) });
  };

  const finish = useEffectEvent(onDone);
  const paint = useEffectEvent(draw);
  useLayoutEffect(() => {
    if (!reg.current) {
      const at = plan.at;
      const h = at ? (at[2] * H) / W : 0;
      const r = region(at ? { x: at[0] - at[2] / 3, y: at[1] - h / 3, w: (at[2] * 2) / 3, h: (h * 2) / 3 } : partBox(wholeRef.current, plan.part));
      reg.current = r;
      // The vignette centres on the region, in the whole view's coordinates.
      const grad = root.current?.querySelector('[data-z="grad"]');
      grad?.setAttribute('cx', (r.x + r.w / 2).toFixed(1));
      grad?.setAttribute('cy', (r.y + r.h / 2).toFixed(1));
      grad?.setAttribute('r', (Math.hypot(r.w, r.h) * 0.62).toFixed(1));
    }
    paint((progress ?? 0) * ZOOM_MS);
  }, [progress, plan.part, plan.at]);
  useEffect(() => {
    if (progress !== undefined) return;
    let raf = 0;
    let start = 0;
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      finish();
    };
    const tick = (now: number) => {
      if (!start) start = now;
      const ms = Math.min(ZOOM_MS, now - start);
      paint(ms);
      if (ms < ZOOM_MS) raf = requestAnimationFrame(tick);
      else end();
    };
    raf = requestAnimationFrame(tick);
    // Never left half-way (a tab in the background stops animation frames).
    const safety = window.setTimeout(end, ZOOM_MS + 2500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.removeEventListener('keydown', onKey);
    };
  }, [progress]);

  const title = `${plan.fromLabel}  →  ${plan.toLabel}`;
  const pillW = Math.max(340, title.length * 10.4 + 72);
  const sans = 'var(--font-sans, system-ui)';
  const z = (k: string) => ({ 'data-z': k });
  const whole = plan.inward ? 'old' : 'new';
  const close = plan.inward ? 'new' : 'old';

  return (
    <g ref={root} className={`view-zoom${plan.inward ? ' is-in' : ' is-out'}`} aria-hidden>
      {/* The whole view lies under the close-up, whichever way the camera goes. */}
      <g {...z(whole)} opacity={plan.inward ? 1 : 0} pointerEvents="none">
        <g {...z(`${whole}-cam`)}>
          <g ref={wholeRef} className="zoom-layer">
            <PaneContext.Provider value={true}>{plan.inward ? old : children}</PaneContext.Provider>
          </g>
          {/* A soft vignette round the region (placed once it is measured): it moves with the camera, no drawn edge. */}
          <radialGradient {...z('grad')} id={`zv${uid}`} gradientUnits="userSpaceOnUse" cx={W / 2} cy={H / 2} r={W / 2}>
            <stop offset="0.45" stopColor="#05070c" stopOpacity={0} />
            <stop offset="1" stopColor="#05070c" stopOpacity={1} />
          </radialGradient>
          <rect {...z('dim')} x={-2 * W} y={-2 * H} width={5 * W} height={5 * H} fill={`url(#zv${uid})`} opacity={0} />
        </g>
      </g>
      <g {...z(close)} opacity={plan.inward ? 0 : 1} pointerEvents="none">
        <g {...z(`${close}-cam`)}>
          <g className="zoom-layer">
            <PaneContext.Provider value={true}>{plan.inward ? children : old}</PaneContext.Provider>
          </g>
        </g>
      </g>
      <g {...z('caption')} opacity={0}>
        <rect x={500 - pillW / 2} y={14} width={pillW} height={60} rx={16} fill="rgba(12,14,20,0.84)" stroke="rgba(255,255,255,0.09)" />
        <text x={500} y={35} textAnchor="middle" style={{ font: '600 10.5px var(--font-mono, monospace)', letterSpacing: '0.16em', fill: '#fbbf24' }}>
          {plan.inward ? 'GERTUTIK BEGIRATZEN' : 'OSORIK IKUSTEN'}
        </text>
        <text x={500} y={60} textAnchor="middle" style={{ font: `650 19px ${sans}`, fill: '#e8eefc' }}>
          <tspan fill="rgba(232,238,252,0.85)">{plan.fromLabel}</tspan>
          <tspan fill="#fbbf24">{'  →  '}</tspan>
          <tspan>{plan.toLabel}</tspan>
        </text>
      </g>
      {progress === undefined && (
        <g
          className="travel-skip"
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
          pointerEvents="all"
        >
          <rect width={W} height={H} fill="transparent" />
        </g>
      )}
    </g>
  );
}
