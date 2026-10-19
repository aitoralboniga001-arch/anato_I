'use client';

import { Label } from './Label';
import { useLabelScale, useScene } from './context';

/** A name for a point of a moving (3D) picture: where it points this frame, and how much it shows. */
export interface Callout {
  id: string;
  /** Where the leader ends, in frame units (from the 3D view's `at`). */
  at: { x: number; y: number };
  show: number;
  small?: boolean;
  text?: string;
  /** For two names of the same structure (e.g. upper and lower limb). */
  key?: string;
}

interface Opts {
  /** Anchors left of this x are named in the left column, the rest in the right one. */
  mid?: number;
  /** Vertical room of each column (the right one starts under the scene tools). */
  left?: [number, number];
  right?: [number, number];
  /** Column x positions. */
  xl?: number;
  xr?: number;
  /** The name's width in frame units (the leader leaves from the plate's edge). */
  width?: (c: Callout) => number;
  /** A band (top, bottom) each column keeps clear for a side orientation pill: no name is centred inside it. */
  bandL?: [number, number];
  bandR?: [number, number];
}

const HEIGHT = 40;
const HEIGHT_SMALL = 34;
const smooth = (u: number) => {
  const v = Math.max(0, Math.min(1, u));
  return v * v * (3 - 2 * v);
};

type P = [number, number];
const side = (p: P, q: P, r: P) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
const cross = (a: P, b: P, c: P, d: P) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
const crossLeaders = (p: P[], q: P[]) => p.slice(1).some((b, i) => q.slice(1).some((d, j) => cross(p[i], b, q[j], d)));

/**
 * Places the names of a 3D view the way an atlas does: each name on the side its structure is on,
 * the names of one side in the same top-to-bottom order as their points and as level with them as
 * the room allows. So no two leaders cross and none runs across the picture to the other side.
 * A name that fades in makes room gradually, so the others glide aside rather than jump.
 */
export function layoutCallouts(items: Callout[], o: Opts = {}) {
  const mid = o.mid ?? 500;
  const out = new Map<Callout, { x: number; y: number; align: 'start' | 'end' }>();
  for (const left of [true, false]) {
    const [top, bottom] = (left ? o.left : o.right) ?? (left ? [140, 590] : [240, 590]);
    const col = items.filter((c) => (c.at.x < mid) === left).sort((a, b) => a.at.y - b.at.y);
    const w = col.map((c) => smooth(c.show / 0.6));
    const h = col.map((c) => (c.small ? HEIGHT_SMALL : HEIGHT));
    // A crowded column breathes a little (up to 1.4 lines a name, as the room allows): a tight stack reads as a list.
    const n = w.reduce((a, b) => a + b, 0);
    const air = n > 1.5 ? Math.max(1, Math.min(1.4, (bottom - top) / ((n - 1) * HEIGHT))) : 1;
    const gap = (i: number) => ((h[i] + h[i - 1]) / 2) * air * Math.min(w[i], w[i - 1]);
    const y = col.map((c) => Math.max(top, Math.min(bottom, c.at.y)));
    // Down the column, each name at least a line under the one above; then, if that ran past the
    // bottom, back up from the bottom.
    const want = [...y];
    for (let i = 1; i < y.length; i++) y[i] = Math.max(y[i], y[i - 1] + gap(i));
    // The stack centres on its points instead of hanging below the first one.
    let shift = 0;
    let sw = 0;
    y.forEach((v, i) => ((shift += (v - want[i]) * w[i]), (sw += w[i])));
    if (sw > 0) {
      shift /= sw;
      for (let i = 0; i < y.length; i++) y[i] -= shift;
      y[0] = Math.max(top, y[0]);
      for (let i = 1; i < y.length; i++) y[i] = Math.max(y[i], y[i - 1] + gap(i));
    }
    if (y.length && y[y.length - 1] > bottom) {
      y[y.length - 1] = bottom;
      for (let i = y.length - 2; i >= 0; i--) y[i] = Math.min(y[i], y[i + 1] - gap(i + 1));
    }
    // A name level with the side pill moves just above or below it (whichever is nearer), and the
    // names around it make room: stepping it in past the pill instead met the other column's name.
    const band = left ? o.bandL : o.bandR;
    if (band)
      for (let i = 0; i < y.length; i++) {
        if (w[i] < 0.02 || y[i] <= band[0] || y[i] >= band[1]) continue;
        const move = (to: number) => {
          const next = [...y];
          next[i] = to;
          for (let j = i + 1; j < next.length; j++) next[j] = Math.max(next[j], next[j - 1] + gap(j));
          for (let j = i - 1; j >= 0; j--) next[j] = Math.min(next[j], next[j + 1] - gap(j + 1));
          return next;
        };
        // Up only when the names above still fit under the column's top.
        const up = move(band[0]);
        const moved = y[i] < (band[0] + band[1]) / 2 && up[0] >= top ? up : move(band[1]);
        moved.forEach((v, j) => (y[j] = v));
      }
    // Sorting by height is not enough when points lie at different depths into the picture: two names
    // whose leaders still cross trade places (their slots stay where they are).
    const x = left ? (o.xl ?? 24) : (o.xr ?? 976);
    // The leader as the label draws it: from the plate's edge, level for a third of the way, then to the point.
    const path = (c: Callout, yy: number): P[] => {
      const wd = o.width?.(c) ?? 120;
      const lx = left ? x + wd : x - wd;
      const ex = lx + (c.at.x - lx) * 0.35;
      return [[lx, yy], [ex, yy], [c.at.x, c.at.y]];
    };
    const order = col.map((_, i) => i);
    for (let pass = 0; pass < col.length; pass++) {
      let swapped = false;
      for (let i = 0; i < col.length; i++)
        for (let j = i + 1; j < col.length; j++) {
          const a = col[order[i]];
          const b = col[order[j]];
          if (w[order[i]] < 0.5 || w[order[j]] < 0.5) continue;
          if (crossLeaders(path(a, y[i]), path(b, y[j]))) {
            [order[i], order[j]] = [order[j], order[i]];
            swapped = true;
          }
        }
      if (!swapped) break;
    }
    order.forEach((ci, slot) => out.set(col[ci], { x, y: y[slot], align: left ? 'start' : 'end' }));
  }
  return out;
}

/** The names of a 3D view, laid out by `layoutCallouts`. `dim` fades them all (e.g. while the camera turns). */
export function Callouts({ items, dim = 1, ...o }: Opts & { items: Callout[]; dim?: number }) {
  const { nameOf } = useScene();
  const pills = useLabelScale();
  const live = items.filter((c) => c.show * dim > 0.02);
  // Plate width as the label sizes it (≈7.1 units a character, 6.4 for small names, plus padding).
  const width = (c: Callout) => (c.text ?? nameOf(c.id)).length * (c.small ? 6.4 : 7.1) + 16;
  // The side pills sit level with the frame's middle, a fixed size on screen: the smaller the frame is
  // drawn (the larger k), the more frame units they cover. Half the pill plus half a name, with air.
  const r = 30 * pills.k;
  const band: [number, number] = [320 - r, 320 + r];
  const pos = layoutCallouts(live, { width, bandL: pills.left ? band : undefined, bandR: pills.right ? band : undefined, ...o });
  return (
    <>
      {live.map((c) => {
        const p = pos.get(c)!;
        return <Label key={c.key ?? c.id} id={c.id} x={p.x} y={p.y} align={p.align} ax={c.at.x} ay={c.at.y} show={c.show * dim} small={c.small} text={c.text} />;
      })}
    </>
  );
}
