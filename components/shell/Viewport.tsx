'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Defs } from '@/components/kit/Defs';
import type { Orientation } from '@/lib/sim/types';
import { IconFit, IconZoomIn, IconZoomOut } from './icons';

const W = 1000;
const H = 640;

interface ViewportProps {
  orientation?: Orientation;
  children: ReactNode;
  /** Changing this key resets zoom (e.g. when the view changes). */
  resetKey: string;
  onBackgroundClick: () => void;
  overlay?: ReactNode;
}

/** SVG stage with wheel/drag zoom-pan, orientation edges and a feathered specimen backdrop. */
export const Viewport = forwardRef<SVGSVGElement, ViewportProps>(function Viewport(
  { orientation, children, resetKey, onBackgroundClick, overlay },
  svgRef,
) {
  const [z, setZ] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; zx: number; zy: number; moved: boolean } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setZ({ k: 1, x: 0, y: 0 }), [resetKey]);

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const el = wrap.current;
    if (!el) return { x: W / 2, y: H / 2, s: 1 };
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H);
    const ox = (r.width - W * s) / 2;
    const oy = (r.height - H * s) / 2;
    return { x: (clientX - r.left - ox) / s, y: (clientY - r.top - oy) / s, s };
  }, []);

  const zoomAt = useCallback((factor: number, px = W / 2, py = H / 2) => {
    setZ((p) => {
      const k = Math.min(6, Math.max(1, p.k * factor));
      const f = k / p.k;
      let x = px - (px - p.x) * f;
      let y = py - (py - p.y) * f;
      if (k === 1) {
        x = 0;
        y = 0;
      }
      return { k, x, y };
    });
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [toSvg, zoomAt]);

  return (
    <div
      ref={wrap}
      className={`viewport${z.k > 1 ? ' is-zoomed' : ''}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        drag.current = { x: e.clientX, y: e.clientY, zx: z.x, zy: z.y, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
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
      onClickCapture={(e) => {
        if (drag.current?.moved) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onDoubleClick={() => setZ({ k: 1, x: 0, y: 0 })}
    >
      <svg
        ref={svgRef}
        className="viewport-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={onBackgroundClick}
        role="img"
      >
        <Defs />
        <g transform={`translate(${z.x} ${z.y}) scale(${z.k})`}>{children}</g>
      </svg>

      {orientation && (
        <div className="orient" aria-hidden>
          {orientation.top && <span className="orient-top">▲ {orientation.top}</span>}
          {orientation.bottom && <span className="orient-bottom">▼ {orientation.bottom}</span>}
          {orientation.left && <span className="orient-left">◀ {orientation.left}</span>}
          {orientation.right && <span className="orient-right">{orientation.right} ▶</span>}
        </div>
      )}

      <div className="zoom-controls">
        <button className="icon-btn" onClick={() => zoomAt(1.35)} aria-label="Handitu" title="Handitu (Ctrl + gurpila)">
          <IconZoomIn />
        </button>
        <button className="icon-btn" onClick={() => zoomAt(1 / 1.35)} aria-label="Txikitu" title="Txikitu">
          <IconZoomOut />
        </button>
        <button className="icon-btn" onClick={() => setZ({ k: 1, x: 0, y: 0 })} aria-label="Doitu" title="Doitu (klik bikoitza)">
          <IconFit />
        </button>
      </div>
      {overlay}
    </div>
  );
});
