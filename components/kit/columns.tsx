'use client';

import { useLayoutEffect, useReducer, useState } from 'react';
import { LabelDraw, labelGeom, labelSize } from './Label';
import { LabelCollector, LabelCollectorContext, partState, useLabelScale, useScene, type LabelEntry } from './context';
import type { SceneComponent, SceneProps } from '@/lib/sim/types';

type P = [number, number];
type Box = [number, number, number, number];

const side = (p: P, q: P, r: P) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
const cross = (a: P, b: P, c: P, d: P) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
const crossLeaders = (p: P[], q: P[]) => p.slice(1).some((b, i) => q.slice(1).some((d, j) => cross(p[i], b, q[j], d)));

/** Does the segment a→b pass through the box (shrunk a little, so grazing a corner is allowed)? */
function through(a: P, b: P, [x0, x1, y0, y1]: Box) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - (x0 + 3)],
    [dx, x1 - 3 - a[0]],
    [-dy, a[1] - (y0 + 2)],
    [dy, y1 - 2 - a[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return true;
}
const runs = (l: P[], b: Box) => l.slice(1).some((q, i) => through(l[i], q, b));
/** Two names printed on each other (as the rules judge it: a little vertical slack). */
const overlap = (a: Box, b: Box) => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] - 2 && a[3] > b[2] + 2;

/** The label sizes the layout is judged at: as drawn, and as grown on small screens (see Label's fitScale). */
export const ARRANGE_SCALES = [1, 1.3];

export type Pos = { x: number; y: number; align: 'start' | 'middle' | 'end' };
/** A name's text box and leader at a place, at each of ARRANGE_SCALES. */
export type Shape = (e: LabelEntry, p: Pos) => { box: Box; leader: P[] }[];

/** A point's place for reusing a seating (see LabelLayer). */
const q = (v: number | undefined) => (v === undefined ? '' : Math.round(v / 3));
const alignOf = (e: LabelEntry): Pos['align'] => e.align ?? (e.ax !== undefined && e.ax > e.x ? 'end' : 'start');

/**
 * In every column of names (one side of their points, one half of the frame), the names may trade the
 * column's slots so fewer leaders cross. The slots are the scene's own (spacing and the free corners
 * stay as designed); only who sits where changes. A new seating is taken only if strictly fewer
 * leaders cross and no name breaks a layout rule (tests/labels.test: frame, toolbar, pills, names on
 * names, leaders through names) at the drawn and the grown size; otherwise the scene's layout stands.
 * A name with `noArrange` keeps its place (it still counts as an obstacle), and so does every name of a
 * scene marked `noArrange` (see SceneView). Returns the new place of each moved entry.
 */
export function arrangeLabels(entries: LabelEntry[], shape: Shape, o: { pillL?: boolean; pillR?: boolean } = {}) {
  const moved = new Map<LabelEntry, Pos>();
  // Every name that is drawn, however faint: the seating then changes only when a name appears or goes.
  const live = entries.filter((e) => (e.show ?? 1) > 0.02);
  const n = live.length;
  if (n < 2) return moved;
  const home = live.map((e): Pos => ({ x: e.x, y: e.y, align: alignOf(e) }));
  const pos = home.slice();
  const cache = live.map(() => new Map<string, ReturnType<Shape>>());
  const geo = (i: number, p: Pos) => {
    const key = `${p.x},${p.y},${p.align}`;
    let g = cache[i].get(key);
    if (!g) cache[i].set(key, (g = shape(live[i], p)));
    return g;
  };
  /** Rules broken by one name alone (a bit per rule and scale). */
  const solo = (i: number, p: Pos) => {
    let bits = 0;
    geo(i, p).forEach(({ box: b }, s) => {
      if (b[0] < 2 || b[1] > 998 || b[2] < 2 || b[3] > 638) bits |= 1 << (s * 3);
      if (b[1] > 932 && b[2] < 222) bits |= 2 << (s * 3);
      if (b[3] > 302 && b[2] < 338 && ((o.pillL && b[0] < 114) || (o.pillR && b[1] > 891))) bits |= 4 << (s * 3);
    });
    return bits;
  };
  /** Rules broken between two names (i < j), and at how many scales their leaders cross. */
  const duo = (i: number, p: Pos, j: number, q: Pos) => {
    let bits = 0;
    let crossings = 0;
    const gj = geo(j, q);
    geo(i, p).forEach((a, s) => {
      const b = gj[s];
      if (live[i].id !== live[j].id && (overlap(a.box, b.box) || overlap(b.box, a.box))) bits |= 1 << (s * 3);
      if (a.leader.length && runs(a.leader, b.box)) bits |= 2 << (s * 3);
      if (b.leader.length && runs(b.leader, a.box)) bits |= 4 << (s * 3);
      if (a.leader.length && b.leader.length && crossLeaders(a.leader, b.leader)) crossings++;
    });
    return { bits, crossings };
  };
  const homeSolo = live.map((_, i) => solo(i, home[i]));
  const homeDuo: number[][] = live.map(() => new Array<number>(n).fill(0));
  const nowCross: number[][] = live.map(() => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const d = duo(i, home[i], j, home[j]);
      homeDuo[i][j] = d.bits;
      nowCross[i][j] = d.crossings;
    }

  /**
   * New places for some names (the rest stay where they are now), taken only if every name keeps the
   * rules it kept at home and fewer leaders cross. Returns whether they were taken.
   */
  const attempt = (change: Map<number, Pos>) => {
    const at = (i: number) => change.get(i) ?? pos[i];
    let delta = 0;
    const next = new Map<number, number>();
    // A moved name must fit its new slot outright; a name that stays may lose nothing it had.
    for (const i of change.keys()) if (solo(i, at(i))) return false;
    for (const i of change.keys())
      for (let j = 0; j < n; j++) {
        if (j === i || (change.has(j) && j < i)) continue;
        const [a, b] = i < j ? [i, j] : [j, i];
        const d = duo(a, at(a), b, at(b));
        if (d.bits & ~homeDuo[a][b]) return false;
        // Two names sharing a slot (one after the other) may keep sharing it; nothing else may touch a moved name.
        if (d.bits && !(change.has(a) && change.has(b) && at(a) === at(b))) return false;
        delta += d.crossings - nowCross[a][b];
        next.set(a * n + b, d.crossings);
      }
    if (delta >= 0) return false;
    for (const [i, p] of change) pos[i] = p;
    for (const [k, c] of next) nowCross[Math.floor(k / n)][k % n] = c;
    return true;
  };

  // A column: the names on one side of their points, in one half of the frame (staggered x and mixed
  // alignments included). Centred names and names without a leader keep their place.
  const cols = new Map<string, number[]>();
  live.forEach((e, i) => {
    if (e.ax === undefined || e.ay === undefined || home[i].align === 'middle' || e.noArrange) return;
    const [x0, x1] = geo(i, home[i])[0].box;
    const c = (x0 + x1) / 2;
    const k = `${c > e.ax ? 'R' : 'L'}${c > 500 ? 'r' : 'l'}`;
    cols.set(k, [...(cols.get(k) ?? []), i]);
  });
  for (const col of cols.values()) {
    // A slot is a place; names shown one after the other in one place share it (and move together).
    const groups = new Map<string, number[]>();
    for (const i of col) {
      const k = `${home[i].x},${home[i].y},${home[i].align}`;
      groups.set(k, [...(groups.get(k) ?? []), i]);
    }
    if (groups.size < 2) continue;
    const g = [...groups.values()].sort((a, b) => home[a[0]].y - home[b[0]].y);
    const slots = g.map((m) => home[m[0]]);
    const ay = (m: number[]) => live[m[0]].ay!;
    /** seat[s]: the group sitting in slot s. */
    let seat = g.map((_, s) => s);
    const seatAs = (next: number[]) => {
      const change = new Map<number, Pos>();
      next.forEach((gi, s) => {
        if (seat[s] !== gi) for (const i of g[gi]) change.set(i, slots[s]);
      });
      if (!change.size || !attempt(change)) return false;
      seat = next;
      return true;
    };
    // First in the order of their points' heights; then single moves (swaps, shifts) while they help.
    seatAs([...seat].sort((a, b) => ay(g[a]) - ay(g[b])));
    for (let pass = 0; pass < 2 * g.length; pass++) {
      let better = false;
      for (let a = 0; a < g.length; a++)
        for (let b = 0; b < g.length; b++) {
          if (a === b) continue;
          if (a < b) {
            const swap = [...seat];
            [swap[a], swap[b]] = [swap[b], swap[a]];
            if (seatAs(swap)) better = true;
          }
          if (Math.abs(a - b) > 1) {
            const shift = [...seat];
            shift.splice(b, 0, ...shift.splice(a, 1));
            if (seatAs(shift)) better = true;
          }
        }
      if (!better) break;
    }
  }
  live.forEach((e, i) => {
    if (pos[i] !== home[i]) moved.set(e, pos[i]);
  });
  return moved;
}

/** The last seating of each label layer (see LabelLayer). */
const seatings = new WeakMap<LabelCollector, { sig: string; moved: Map<string, Pos> }>();

/** Draws every collected name, laid out by `arrangeLabels`. */
function LabelLayer({ col, fixed }: { col: LabelCollector; fixed?: boolean }) {
  const ctx = useScene();
  const scale = useLabelScale();
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  // A name that unmounts (or mounts) between frames redraws the layer before the paint.
  useLayoutEffect(() => col.listen(redraw), [col]);
  const list = [...col.entries.entries()];
  col.drawn = col.version;
  // Judged as each label draws itself (its state's size and its growth) at the drawn and the grown size,
  // with the character estimate, so the server and the client seat the names alike.
  const shape: Shape = (e, p) => {
    const chars = (e.text ?? ctx.nameOf(e.id)).length;
    const size = labelSize(partState(ctx, e.id), e.small);
    return ARRANGE_SCALES.map((k) => labelGeom({ ...e, ...p }, chars, size, { ...scale, k }));
  };
  // The seating depends only on what the rules judge (which names are drawn, where, their size and
  // the scale), not on how faint each is: while a view plays, that rarely changes from one frame to
  // the next, so the last seating is reused until it does (the search is the costly part of a frame).
  // Points that drift with the drawing count once they have moved a few units: who sits where only
  // changes when the order of the points does, never for a fraction of a unit.
  let moved = new Map<string, Pos>();
  if (!fixed) {
    const sig =
      `${scale.k},${scale.left},${scale.right}|` +
      list
        .filter(([, e]) => (e.show ?? 1) > 0.02)
        .map(([k, e]) => [k, e.id, e.text ?? ctx.nameOf(e.id), e.x, e.y, q(e.ax), q(e.ay), e.align, e.small, e.noArrange, labelSize(partState(ctx, e.id), e.small)].join(','))
        .join(';');
    const last = seatings.get(col);
    if (last?.sig === sig) moved = last.moved;
    else {
      const byEntry = arrangeLabels(
        list.map(([, e]) => e),
        shape,
        { pillL: scale.left, pillR: scale.right },
      );
      for (const [k, e] of list) {
        const m = byEntry.get(e);
        if (m) moved.set(k, m);
      }
      seatings.set(col, { sig, moved });
    }
  }
  return (
    <>
      {list.map(([k, e]) => {
        const m = moved.get(k);
        return <LabelDraw key={k} {...e} x={m?.x ?? e.x} y={m?.y ?? e.y} align={m?.align ?? e.align} moved={!!m && (m.x !== e.x || m.y !== e.y)} />;
      })}
    </>
  );
}

function Collected({ Scene, t, reduced }: { Scene: SceneComponent } & SceneProps) {
  const [col] = useState(() => new LabelCollector());
  return (
    <LabelCollectorContext.Provider value={col}>
      <Scene t={t} reduced={reduced} />
      <LabelLayer col={col} fixed={!!(Scene as { noArrange?: boolean }).noArrange} />
    </LabelCollectorContext.Provider>
  );
}

const ids = new WeakMap<object, number>();
let nextId = 1;
const idOf = (f: object) => {
  let id = ids.get(f);
  if (!id) ids.set(f, (id = nextId++));
  return id;
};

/**
 * Draws a view's scene with its names laid out together (see arrangeLabels). Use it wherever a scene
 * is drawn, so the app, the cards and the tests show the same layout. Keyed by the scene, so another
 * view starts with a fresh set of names. A scene that sets `Scene.noArrange = true` keeps every name
 * where it put it (as does a single <Label noArrange>).
 */
export function SceneView({ Scene, t, reduced }: { Scene: SceneComponent } & SceneProps) {
  return <Collected key={idOf(Scene)} Scene={Scene} t={t} reduced={reduced} />;
}
