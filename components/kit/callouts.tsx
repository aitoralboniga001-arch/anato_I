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
  /** A second, smaller line under the name (e.g. where it comes from). */
  sub?: string;
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
  /** How much larger than drawn size the names print (the label scale): a smaller frame needs wider spacing. */
  k?: number;
  /** A narrow tool column at the frame's right edge (scene and zoom buttons): names level with it end left of it. */
  toolsR?: { bottom: number; x: number };
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
  const room = (left: boolean) => (left ? o.left : o.right) ?? (left ? [140, 590] : [240, 590]);
  // Each name on its structure's side; but a side too full for its names even at drawn size (small frames:
  // tablets) hands the names nearest the middle to the other side, while that one has room.
  const onLeft = new Map(items.map((c) => [c, c.at.x < mid]));
  const need = (left: boolean) => items.filter((c) => onLeft.get(c) === left).reduce((a, c) => a + (c.small ? HEIGHT_SMALL : HEIGHT) * (c.sub ? 1.45 : 1) * smooth(c.show / 0.6), 0);
  // The room a side has: its column, less the band its side pill keeps clear.
  const span = (left: boolean) => {
    const b = left ? o.bandL : o.bandR;
    return room(left)[1] - room(left)[0] + HEIGHT - (b ? b[1] - b[0] : 0);
  };
  for (const left of [false, true]) {
    while (need(left) > span(left)) {
      const c = items.filter((d) => onLeft.get(d) === left && d.show > 0.02).sort((a, b) => Math.abs(a.at.x - mid) - Math.abs(b.at.x - mid))[0];
      const h = c ? (c.small ? HEIGHT_SMALL : HEIGHT) * (c.sub ? 1.45 : 1) : 0;
      if (!c || need(!left) + h > span(!left)) break;
      onLeft.set(c, !left);
    }
  }
  for (const left of [true, false]) {
    const [top, bottom] = room(left);
    const col = items.filter((c) => onLeft.get(c) === left).sort((a, b) => a.at.y - b.at.y);
    const w = col.map((c) => smooth(c.show / 0.6));
    // Names print k times their drawn size, so they need k times the spacing. A column too crowded
    // for that eases back towards drawn-size spacing rather than climbing above its top.
    const place = (k: number, airMax = 1.4) => {
      const h = col.map((c) => (c.small ? HEIGHT_SMALL : HEIGHT) * (c.sub ? 1.45 : 1) * k);
      // A crowded column breathes a little (up to 1.4 lines a name, as the room allows): a tight stack reads as a list.
      const n = w.reduce((a, b) => a + b, 0);
      const air = n > 1.5 ? Math.max(1, Math.min(airMax, (bottom - top) / ((n - 1) * HEIGHT * k))) : 1;
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
          // A two-line name reaches further down: it keeps its second line off the pill too.
          const b0 = band[0] - (col[i].sub ? 14 * k : 0);
          if (w[i] < 0.02 || y[i] <= b0 || y[i] >= band[1]) continue;
          const move = (to: number) => {
            const next = [...y];
            next[i] = to;
            for (let j = i + 1; j < next.length; j++) next[j] = Math.max(next[j], next[j - 1] + gap(j));
            for (let j = i - 1; j >= 0; j--) next[j] = Math.min(next[j], next[j + 1] - gap(j + 1));
            return next;
          };
          // The nearer side, as long as the names it pushes still fit in the column: up only while those above
          // stay under its top, down only while those below stay above its bottom (the camera keys).
          const up = move(b0);
          const down = move(band[1]);
          const upFits = up[0] >= top - 0.5;
          const downFits = down[down.length - 1] <= bottom + 0.5;
          const nearUp = y[i] < (b0 + band[1]) / 2;
          const moved = upFits && (nearUp || !downFits) ? up : downFits ? down : top - up[0] < down[down.length - 1] - bottom ? up : down;
          moved.forEach((v, j) => (y[j] = v));
        }
      return y;
    };
    const K = o.k ?? 1;
    // Out of the column: above its top, or below its bottom (the camera keys), e.g. after stepping past the pill.
    const spills = (v: number[]) => v.length > 0 && (v[0] < top - 0.5 || v[v.length - 1] > bottom + 0.5);
    let y = place(K);
    // Too full: first without the breathing room, then towards drawn-size spacing.
    if (spills(y)) y = place(K, 1);
    for (let k = K - 0.1; k > 1 && spills(y); k -= 0.1) y = place(k, 1);
    if (spills(y) && K > 1) y = place(1, 1);
    // Sorting by height is not enough when points lie at different depths into the picture: two names
    // whose leaders still cross trade places (their slots stay where they are).
    const x0 = left ? (o.xl ?? 24) : (o.xr ?? 976);
    // Level with the right edge's tool column, a name ends just left of it.
    const xAt = (yy: number) => (!left && o.toolsR && yy - 16 * (o.k ?? 1) < o.toolsR.bottom ? Math.min(x0, o.toolsR.x - 8) : x0);
    // The leader as the label draws it: from the plate's edge, level for a third of the way, then to the point.
    const path = (c: Callout, yy: number): P[] => {
      const x = xAt(yy);
      const wd = (o.width?.(c) ?? 120) * (o.k ?? 1);
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
    order.forEach((ci, slot) => out.set(col[ci], { x: xAt(y[slot]), y: y[slot], align: left ? 'start' : 'end' }));
  }
  return out;
}

/** The names of a 3D view, laid out by `layoutCallouts`. `dim` fades them all (e.g. while the camera turns). */
export function Callouts({ items, dim = 1, axes = true, ...o }: Opts & { items: Callout[]; dim?: number; axes?: boolean }) {
  const { nameOf } = useScene();
  const pills = useLabelScale();
  const live = items.filter((c) => c.show * dim > 0.02);
  // Plate width as the label sizes it (≈7.1 units a character, 6.4 for small names, plus padding).
  const width = (c: Callout) => Math.max((c.text ?? nameOf(c.id)).length * (c.small ? 6.4 : 7.1), (c.sub?.length ?? 0) * 7.1 * 0.8) + 16;
  // The side pills sit level with the frame's middle, a fixed size on screen: the smaller the frame is
  // drawn (the larger k), the more frame units they cover. Half the pill plus half a name, with air.
  const r = 30 * pills.k;
  const band: [number, number] = [320 - r, 320 + r];
  // The right column ends above the camera keys (a name plate is ~14 label units tall either side of its line).
  // At the top right, measured: the wide turn button and drag hint push the column's top down; the narrow
  // tool column at the edge only moves the names level with it inwards (on tablets it reaches far down).
  const right = o.right ?? [240, 590];
  const keysEnd = pills.keysTop != null ? pills.keysTop - 20 * pills.k : undefined;
  const bottomR = keysEnd != null && keysEnd < right[1] ? keysEnd : right[1];
  const topRight = (pills.chrome ?? []).filter((b) => b.y1 < 320 && b.x1 > 550);
  const narrow = topRight.filter((b) => b.x0 > 860);
  const wide = topRight.filter((b) => b.x0 <= 860);
  const topR = wide.length ? Math.max(right[0], Math.max(...wide.map((b) => b.y1)) + 18 * pills.k) : right[0];
  const rightCol: [number, number] = [Math.min(topR, bottomR - 40), bottomR];
  const toolsR = narrow.length ? { bottom: Math.max(...narrow.map((b) => b.y1)), x: Math.min(...narrow.map((b) => b.x0)) } : undefined;
  // The orientation key of a 3D view (Stage3D Axes: top left, at y 52, 54 tall, grown up to 1.5×) sits over
  // the left column's top: on small frames (tablets) its first name would land on the plate.
  // Kimu (bottom left, a fixed size on screen) ends the left column above him, as the keys end the right one.
  const left = o.left ?? [140, 590];
  const keyEnd = axes ? 52 + 54 * Math.min(1.5, pills.k) + 16 * pills.k : 0;
  const kimu = (pills.chrome ?? []).find((b) => b.x0 < 60 && b.y0 > 320);
  // It also stops short of the bottom captions (y ≈ 612), whose band grows with the names on small frames.
  const bottomL = Math.min(left[1], 612 - 23 * pills.k, kimu ? kimu.y0 - 20 * pills.k : Infinity);
  const leftCol: [number, number] = [Math.min(Math.max(left[0], keyEnd), bottomL - 40), bottomL];
  const pos = layoutCallouts(live, { width, k: pills.k, bandL: pills.left ? band : undefined, bandR: pills.right ? band : undefined, toolsR, ...o, left: leftCol, right: rightCol });
  return (
    <>
      {live.map((c) => {
        const p = pos.get(c)!;
        return <Label key={c.key ?? c.id} id={c.id} x={p.x} y={p.y} align={p.align} ax={c.at.x} ay={c.at.y} show={c.show * dim} small={c.small} text={c.text} sub={c.sub} />;
      })}
    </>
  );
}
