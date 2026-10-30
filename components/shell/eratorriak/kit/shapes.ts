/** Small SVG path builders for the rooms' schematic drawings (all in the 960-wide diagram space). */

const f = (n: number) => Math.round(n * 10) / 10;

/** A bar with rounded ends between two points: a bone shaft, a muscle belly, a cartilage rod. */
export function bar(x1: number, y1: number, x2: number, y2: number, w: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / len) * (w / 2);
  const ny = ((x2 - x1) / len) * (w / 2);
  const r = f(w / 2);
  return `M${f(x1 + nx)},${f(y1 + ny)} L${f(x2 + nx)},${f(y2 + ny)} A${r},${r} 0 0 0 ${f(x2 - nx)},${f(y2 - ny)} L${f(x1 - nx)},${f(y1 - ny)} A${r},${r} 0 0 0 ${f(x1 + nx)},${f(y1 + ny)} Z`;
}

/** An ellipse as a path (so it can join a compound piece). */
export function oval(cx: number, cy: number, rx: number, ry = rx): string {
  return `M${f(cx - rx)},${f(cy)} A${f(rx)},${f(ry)} 0 1 0 ${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 1 0 ${f(cx - rx)},${f(cy)} Z`;
}

/** A ring (draw with fillRule evenodd, which PieceDiagram uses). */
export function ring(cx: number, cy: number, r1: number, r2: number, ry1 = r1, ry2 = r2): string {
  return `${oval(cx, cy, r1, ry1)} ${oval(cx, cy, r2, ry2)}`;
}

/** One sector of a ring, from angle a0 to a1 (degrees, 0 = up, clockwise). */
export function sector(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)].map(f).join(',');
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${p(r1, a0)} A${r1},${r1} 0 ${big} 1 ${p(r1, a1)} L${p(r2, a1)} A${r2},${r2} 0 ${big} 0 ${p(r2, a0)} Z`;
}

/** Mirror a path's x coordinates about the diagram's middle line (x → 960 − x): the body's other side. */
export function mirror(d: string, mid = 480): string {
  // Absolute commands only (M L Q C A Z), as written by these helpers and the room geometries.
  const out: string[] = [];
  const re = /([MLQCAZ])([^MLQCAZ]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const [, c, rest] = m;
    const n = rest.trim() ? rest.trim().split(/[\s,]+/).map(Number) : [];
    if (c === 'A') {
      const v: number[] = [];
      for (let i = 0; i + 6 < n.length + 1; i += 7) v.push(n[i], n[i + 1], n[i + 2], n[i + 3], 1 - n[i + 4], f(2 * mid - n[i + 5]), n[i + 6]);
      out.push(`A${v.join(' ')}`);
    } else out.push(c + n.map((v, i) => (i % 2 === 0 ? f(2 * mid - v) : v)).join(','));
  }
  return out.join(' ');
}

/** A path and its mirror image, as one compound piece (paired structures). */
export const both = (d: string) => `${d} ${mirror(d)}`;
