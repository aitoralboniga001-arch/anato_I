'use client';

import type { ReactNode } from 'react';
import { Part } from './Part';

interface MarkProps {
  /** Structure id (usually a process or a direction term: something with no outline of its own). */
  id: string;
  /** Centre of the ring. */
  x?: number;
  y?: number;
  rx?: number;
  ry?: number;
  /** Rotation of the ring, degrees. */
  rot?: number;
  show?: number;
  color?: string;
  /** Draw this instead of the ring (an arrow, a bracket, a dashed outline). It stays clickable and lights up as one part. */
  children?: ReactNode;
}

/**
 * A marker for something the explanation names but that has no shape of its own — a process, a
 * direction, a phenomenon. It is a dashed ring (or the given drawing) at the place it happens, so
 * the student sees where to look, can click it, and it lights up when the step is about it.
 */
export function Mark({ id, x = 0, y = 0, rx = 16, ry, rot = 0, show = 1, color = '#ffb86b', children }: MarkProps) {
  if (show <= 0.02) return null;
  const big = Math.max(rx, ry ?? rx) > 28;
  return (
    <Part id={id} show={show}>
      {children ?? (
        <g transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
          {/* Large rings often sit over other structures: only their outline takes the pointer, the inside stays clickable for what is underneath. */}
          <ellipse className="mark-ring" cx={x} cy={y} rx={rx} ry={ry ?? rx} fill={color} fillOpacity={0.1} stroke={color} strokeWidth={1.8} strokeDasharray="5 4" pointerEvents={big ? 'none' : undefined} />
          {big && <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx} fill="none" stroke="transparent" strokeWidth={14} pointerEvents="stroke" />}
        </g>
      )}
    </Part>
  );
}
