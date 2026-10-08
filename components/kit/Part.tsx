'use client';

import type { ReactNode } from 'react';
import { partState, useScene } from './context';

interface PartProps {
  /** Structure id from the registry. Several <Part>s may share an id (e.g. left/right somites). */
  id: string;
  children: ReactNode;
  /** 0..1 visibility; the part is not interactive while fully hidden. */
  show?: number;
  /** Decorative parts (e.g. background stroma) are interactive but never glow. */
  quiet?: boolean;
  /** Groups this drawing belongs to here (e.g. intraperitoneal organs): naming a group lights its members. */
  groups?: string[];
  className?: string;
}

/**
 * Interactive wrapper for one anatomical structure. Handles hover, click, highlight and dimming.
 * Do not nest <Part>s: dimming a parent would dim its children too.
 */
export function Part({ id, children, show = 1, quiet, groups, className }: PartProps) {
  const ctx = useScene();
  if (show <= 0.001) return null;
  const state = partState(ctx, id, groups);
  const flash = ctx.quizFlash?.id === id ? (ctx.quizFlash.ok ? ' flash-ok' : ' flash-bad') : '';
  // Outer <g> carries the stage-driven visibility; the inner one the interaction styling (CSS opacity/filter).
  return (
    <g data-part={id} data-groups={groups?.join(' ') || undefined} opacity={show}>
      <g
        className={`part part-${state}${quiet ? ' part-quiet' : ''}${flash}${className ? ` ${className}` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          ctx.onSelect(id);
        }}
        onPointerEnter={() => ctx.onHover(id)}
        onPointerLeave={() => ctx.onHover(null)}
      >
        {children}
      </g>
    </g>
  );
}
