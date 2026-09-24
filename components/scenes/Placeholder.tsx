'use client';

import { Note, type SceneProps } from '@/components/kit';

/** Temporary scene while a stage is being drawn. */
export function Placeholder({ t }: SceneProps) {
  return (
    <g>
      <circle cx={500} cy={300} r={90 + 20 * t} fill="none" stroke="#33415c" strokeDasharray="6 8" />
      <Note x={500} y={300}>Eszena prestatzen…</Note>
    </g>
  );
}
