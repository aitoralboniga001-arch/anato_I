'use client';

import { ModelView, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import type { At3 } from '@/components/kit/three/Stage3D';
import { useLabelScale } from '@/components/kit/context';
import type { Camera3, V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { AC, arteryModel, type ArtOpts, type ArtPose } from './arteries3d';

export { cameraAt, orbit, Trail, DirArrows, DIRS, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
export { vis } from '@/components/scenes/week10/common';

/** Every 3D view of the arterial system shares one continuity: a stage change glides the camera. */
export const CONT = 'arteriak-12';

/** One view of topic 12's arch model: the pose, a camera, the names. */
export function ArtView({
  pose,
  opts,
  camera,
  names,
  over,
  caption,
  right,
  extra,
}: {
  pose: ArtPose;
  opts: ArtOpts;
  camera: Camera3;
  names: CalloutSpec[];
  over?: (at: At3, asked: number) => React.ReactNode;
  caption?: string;
  right?: [number, number];
  /** More of the same frame (the descending aorta's branches). */
  extra?: { items: Item3[]; pts: Record<string, V3> };
}) {
  const m = arteryModel(pose, opts);
  const model = extra ? { items: [...m.items, ...extra.items], pts: { ...m.pts, ...extra.pts } } : m;
  return <ModelView model={model} continuity={CONT} camera={camera} names={names} over={over} caption={caption} right={right} />;
}

/** The colour key: each colour is where a piece comes from (the notes' Langman figure). */
export const ORIGIN_KEY: { color: string; text: string }[] = [
  { color: AC.sac, text: 'zakua' },
  { color: AC.a1, text: '1.' },
  { color: AC.a2, text: '2.' },
  { color: AC.a3, text: '3.' },
  { color: AC.a4, text: '4.' },
  { color: AC.a5, text: '5.' },
  { color: AC.a6, text: '6.' },
  { color: AC.da, text: 'a. dortsala' },
  { color: AC.is7, text: '7. segm.' },
];

const ROW = 16;
const MAX_ROW = 340;

/**
 * Colour chips at the top of the picture (right of the caption), saying what each colour means. The
 * title leads the first row; rows wrap at MAX_ROW and each ends short of the turn button and drag hint,
 * which are fixed on screen and so cover more of the frame on a tablet.
 */
export function ColourKey({ items, show, title = 'Kolorea = jatorria', y = 22 }: { items: { color: string; text: string }[]; show: number; title?: string; y?: number }) {
  const { chrome, k } = useLabelScale();
  if (show <= 0.02) return null;
  // Grown with the names on a small frame (a tablet), so it stays as readable as they are.
  const s = Math.min(1.35, Math.max(1, k));
  const end = (ry: number) => Math.min(840, ...(chrome ?? []).filter((b) => b.x1 > 450 && b.y0 < ry + (ROW * s) / 2 && b.y1 > ry - (ROW * s) / 2).map((b) => b.x0 - 12));
  const cells = [{ text: `${title}:`, color: '', w: (title.length * 5.6 + 6) * s }, ...items.map((it) => ({ ...it, w: (18 + it.text.length * 6.6) * s }))];
  const rows: (typeof cells)[] = [[]];
  for (const c of cells) {
    const row = rows[rows.length - 1];
    if (row.length && row.reduce((sum, d) => sum + d.w + 8, 0) + c.w > MAX_ROW * s) rows.push([c]);
    else row.push(c);
  }
  return (
    <g opacity={show} pointerEvents="none">
      {rows.map((row, r) => {
        const ry = y * s + r * ROW * s;
        let cx = end(ry) - row.reduce((sum, d, i) => sum + d.w + (i ? 8 : 0), 0);
        return row.map((c) => {
          const at = cx;
          cx += c.w + 8;
          return c.color ? (
            <g key={c.text}>
              <circle cx={at + 6 * s} cy={ry} r={5.5 * s} fill={c.color} stroke="rgba(10,6,12,0.8)" strokeWidth={1.2} />
              <text x={at + 15 * s} y={ry} dy="0.35em" className="note note-dim" style={{ fontSize: 11.5 * s }}>
                {c.text}
              </text>
            </g>
          ) : (
            <text key={c.text} x={at} y={ry} dy="0.35em" className="note note-dim" style={{ fontSize: 11 * s, fontStyle: 'italic' }}>
              {c.text}
            </text>
          );
        });
      })}
    </g>
  );
}
