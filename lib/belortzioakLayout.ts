import type { BelItem } from '@/content/belortzioak';

/** Stage height in layout units; the label columns' y positions are in these units. */
export const H = 1000;

export interface Placed {
  key: string;
  side: 'l' | 'r';
  y: number;
}
/** Names in two columns, each beside its structure, in the order their structures run down the figure. */
export function arrange(items: BelItem[]): Placed[] {
  const pts = items.map((it) => ({
    key: it.key,
    x: it.targets.reduce((a, t) => a + t[0], 0) / it.targets.length,
    y: it.targets.reduce((a, t) => a + t[1], 0) / it.targets.length,
  }));
  const left = pts.filter((p) => p.x < 0.5);
  const right = pts.filter((p) => p.x >= 0.5);
  // Balanced columns: the structures nearest the middle cross over first.
  while (Math.abs(left.length - right.length) > 2) {
    const [from, to] = left.length > right.length ? [left, right] : [right, left];
    from.sort((a, b) => Math.abs(b.x - 0.5) - Math.abs(a.x - 0.5));
    to.push(from.pop()!);
  }
  const place = (col: typeof pts, side: 'l' | 'r'): Placed[] => {
    const n = col.length;
    if (!n) return [];
    const top = 34;
    const bottom = H - 34;
    const gap = Math.min(96, Math.max(58, (bottom - top) / n), (bottom - top) / Math.max(1, n - 1));
    const sorted = [...col].sort((a, b) => a.y - b.y);
    const ys = sorted.map((p) => Math.min(bottom, Math.max(top, p.y * H)));
    for (let i = 1; i < n; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    if (ys[n - 1] > bottom) {
      ys[n - 1] = bottom;
      for (let i = n - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - gap);
    }
    if (ys[0] < top) {
      ys[0] = top;
      for (let i = 1; i < n; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    }
    // Leaders must not cross: two names whose lines cross swap places (their structures keep theirs).
    const order = [...sorted];
    const ex = side === 'l' ? 0 : 1;
    const cross = (a: (typeof pts)[number], ya: number, b: (typeof pts)[number], yb: number) => {
      // segments (ex, y) → (x, y·H) in a frame where the column edge is at x = ex
      const d = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
      const [p1, p2, p3, p4] = [
        [ex, ya / H],
        [a.x, a.y],
        [ex, yb / H],
        [b.x, b.y],
      ] as const;
      return d(...p1, ...p2, ...p3) * d(...p1, ...p2, ...p4) < 0 && d(...p3, ...p4, ...p1) * d(...p3, ...p4, ...p2) < 0;
    };
    for (let pass = 0; pass < n * n; pass++) {
      let swapped = false;
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          if (cross(order[i], ys[i], order[j], ys[j])) {
            [order[i], order[j]] = [order[j], order[i]];
            swapped = true;
          }
      if (!swapped) break;
    }
    return order.map((p, i) => ({ key: p.key, side, y: ys[i] }));
  };
  return [...place(left, 'l'), ...place(right, 'r')];
}
