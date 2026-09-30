export { Part } from './Part';
export { Label, Note } from './Label';
export { Mark } from './Mark';
export { CellBand, Cell, Arrow, Flow, scatterInEllipse } from './tissue';
export { useScene } from './context';
export { C } from '@/lib/sim/palette';
export { seg, lin, fade, lerp, lerpPt, lerpPts, mix, clamp, rand, easeOut, easeIn, easeInOut } from '@/lib/sim/anim';
export { ellipseArc, line, bezier, polyline, curvePath, bandPath, smoothPath, ellipsePts, ellipseD, curveLength, tube } from '@/lib/sim/geometry';
export type { Pt, Curve, Sample } from '@/lib/sim/geometry';

/**
 * Magnify the region around (fx, fy) by `s` and place it at (tx, ty) of the 1000×640 frame.
 * Wrap geometry in <g transform={z.transform}> and map label anchors with z.at(x, y),
 * so one drawing can serve both the overview and a close-up view.
 */
export const zoom = (fx: number, fy: number, s: number, tx = 500, ty = 320) => ({
  transform: `translate(${tx} ${ty}) scale(${s}) translate(${-fx} ${-fy})`,
  at: (x: number, y: number): [number, number] => [tx + (x - fx) * s, ty + (y - fy) * s],
});
export type { SceneProps } from '@/lib/sim/types';
