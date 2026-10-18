import type { GLFrame } from './gl';
import type { Clip3, Hole3 } from '@/lib/three-d/scene';

const numbers = (a: ArrayLike<number> | undefined, b: ArrayLike<number> | undefined) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};
const hole = (a: Hole3 | undefined, b: Hole3 | undefined): boolean => a === b || !!a && !!b &&
  a.front === b.front && a.back === b.back && a.side === b.side && numbers(a.c, b.c) && numbers(a.u, b.u) && numbers(a.v, b.v);
const clip = (a: Clip3 | undefined, b: Clip3 | undefined) => {
  if (a === b) return true;
  if (!a || !b || !numbers(a.o, b.o) || !hole(a.keep, b.keep)) return false;
  if (!!a.grow !== !!b.grow) return false;
  if (a.grow && b.grow && (a.grow.cos !== b.grow.cos || a.grow.spicules !== b.grow.spicules || !numbers(a.grow.dir, b.grow.dir))) return false;
  const ah = a.holes ?? [], bh = b.holes ?? [];
  return ah.length === bh.length && ah.every((h, i) => hole(h, bh[i]));
};

/** Scenes supply immutable meshes/routes and fresh pose values. A new React object is not a new picture. */
export function sameGLFrame(a: GLFrame | null, b: GLFrame): boolean {
  if (!a || !numbers(a.view, b.view) || !numbers(a.proj, b.proj) || !numbers(a.light, b.light) || a.items.length !== b.items.length) return false;
  return a.items.every((x, i) => {
    const y = b.items[i];
    if (x.key !== y.key || x.mesh !== y.mesh || !numbers(x.matrix, y.matrix) || x.color !== y.color || x.deep !== y.deep ||
      x.tissue !== y.tissue || x.opacity !== y.opacity || x.outline !== y.outline || x.state !== y.state ||
      x.quiet !== y.quiet || x.thin !== y.thin || !clip(x.clip, y.clip)) return false;
    const xs = x.stream, ys = y.stream;
    return xs === ys || !!xs && !!ys && xs.cells === ys.cells && xs.gates === ys.gates && xs.route === ys.route && xs.phase === ys.phase && xs.grow === ys.grow;
  });
}
