'use client';

import { useId, type ReactNode } from 'react';
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
  /** Kept for callers; every pointer uses the one focus colour so it always means "look here". */
  color?: string;
  /** Draw this instead of the ring (an arrow, a bracket, a dashed outline). It stays clickable and lights up as one part. */
  children?: ReactNode;
}

const FOCUS = '#ffb86b';

/**
 * A marker for something the explanation names but that has no shape of its own — a process, a
 * direction, a phenomenon. It is a soft, breathing pool of light (or the given drawing) at the place it happens, so
 * the student sees where to look, can click it, and it lights up when the step is about it.
 */
export function Mark({ id, x = 0, y = 0, rx = 16, ry, rot = 0, show = 1, children }: MarkProps) {
  const glow = `mark-glow-${useId().replace(/:/g, '')}`;
  if (show <= 0.02) return null;
  const big = Math.max(rx, ry ?? rx) > 28;
  return (
    <Part id={id} show={show}>
      {children ?? (
        <g transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
          {/* A soft pool of light where it happens: no line drawn over the tissue. */}
          <radialGradient id={glow}>
            <stop offset="0" stopColor={FOCUS} stopOpacity={0.42} />
            <stop offset="0.5" stopColor={FOCUS} stopOpacity={0.24} />
            <stop offset="1" stopColor={FOCUS} stopOpacity={0} />
          </radialGradient>
          {/* Large marks often sit over other structures: they let the pointer through to what is underneath, except along their rim. */}
          <ellipse className="mark-light" cx={x} cy={y} rx={rx * 1.3} ry={(ry ?? rx) * 1.3} fill={`url(#${glow})`} pointerEvents={big ? 'none' : undefined} />
          {big && <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx} fill="none" stroke="transparent" strokeWidth={14} pointerEvents="stroke" />}
        </g>
      )}
    </Part>
  );
}
