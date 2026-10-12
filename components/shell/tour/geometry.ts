/**
 * Pure geometry for the guide: which live element a stop lights, and where its card goes. Kept free
 * of React and of the real DOM (only the few methods used), so it can be tested without a browser.
 */

export type Box = { x: number; y: number; w: number; h: number };
export type Lit = Box & { r: number };

export type ElementLike = {
  getBoundingClientRect(): { left: number; top: number; width: number; height: number };
  readonly children?: ArrayLike<ElementLike> | HTMLCollection;
};
export type RootLike = { querySelectorAll(sel: string): ArrayLike<ElementLike> | NodeListOf<Element> };

/** How the live element is found: `[data-tour="id"]`, or that container's children (generated content). */
export type TargetSpec = {
  /** The data-tour id(s), any of which may match. */
  ids: string[];
  /** Light the container's own children (labels, orientation chips) instead of the container. */
  children?: boolean;
  /** Light at most this many (the first found). */
  max?: number;
  /** The variant needs at least this many lit elements, or the next one is tried. */
  min?: number;
  /** Only those on the first one's row (a grid of cards: its first row, whatever the column count). */
  row?: boolean;
};

const sel = (ids: string[]) => ids.map((id) => `[data-tour="${id}"]`).join(', ');

export const boxOf = (el: ElementLike): Box => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

/** On screen and drawn: has a size, and some of it lies inside the window. */
export function shown(b: Box, vw: number, vh: number, scrolls = false): boolean {
  if (b.w < 2 || b.h < 2) return false;
  if (b.x + b.w <= 0 || b.x >= vw) return false;
  // A page that scrolls can bring it into view; a fixed screen cannot.
  if (!scrolls && (b.y + b.h <= 0 || b.y >= vh)) return false;
  return true;
}

export function findTargets(root: RootLike, spec: TargetSpec, vw: number, vh: number, scrolls = false, visible?: (el: ElementLike) => boolean): ElementLike[] {
  const found: ElementLike[] = [];
  const containers = Array.from(root.querySelectorAll(sel(spec.ids)) as ArrayLike<ElementLike>);
  for (const c of containers) {
    const pool = spec.children ? Array.from((c.children ?? []) as ArrayLike<ElementLike>) : [c];
    for (const el of pool) {
      if (!shown(boxOf(el), vw, vh, scrolls)) continue;
      if (visible && !visible(el)) continue;
      if (spec.row && found.length && Math.abs(boxOf(el).y - boxOf(found[0]).y) > 4) continue;
      found.push(el);
      if (spec.max && found.length >= spec.max) return found;
    }
  }
  return found;
}

export const union = (bs: Box[]): Box => {
  const x0 = Math.min(...bs.map((b) => b.x));
  const y0 = Math.min(...bs.map((b) => b.y));
  const x1 = Math.max(...bs.map((b) => b.x + b.w));
  const y1 = Math.max(...bs.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

export const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

const clampTo = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export type Placement = { x: number; y: number; side: 'below' | 'above' | 'right' | 'left' | 'over' };

/** How far (px) a card may sit from its target before the distance starts to count. */
const FAR = 120;

/**
 * The card goes beside what is lit, never over it: every side and alignment is tried, kept inside the
 * window, and scored by what it would cover — the lit elements weigh most, then the specimen (`avoid`),
 * then a slight preference for below / above / right / left, near the target. A card far from what it
 * explains costs more than one that covers part of the dimmed specimen (a top-bar key at 1024 is
 * explained right under it, not at the far corner of the window).
 */
export function placeCard(targets: Box[], card: { w: number; h: number }, vw: number, vh: number, avoid: Box[] = [], margin = 16, gap = 14): Placement {
  const u = union(targets);
  const cands: Placement[] = [];
  // Centred, aligned to either edge, or just clear of the specimen's edges.
  // A card wider than a small target lines up with its outer edge rather than overhanging it.
  const edge = u.x + u.w / 2 < vw / 2 ? [u.x, u.x + u.w / 2 - card.w / 2, u.x + u.w - card.w] : [u.x + u.w - card.w, u.x + u.w / 2 - card.w / 2, u.x];
  const xs = [...edge, ...avoid.flatMap((b) => [b.x + b.w + gap, b.x - gap - card.w])];
  const ys = [u.y + u.h / 2 - card.h / 2, u.y, u.y + u.h - card.h, ...avoid.flatMap((b) => [b.y + b.h + gap, b.y - gap - card.h])];
  for (const x of xs) cands.push({ x, y: u.y + u.h + gap, side: 'below' });
  for (const x of xs) cands.push({ x, y: u.y - gap - card.h, side: 'above' });
  for (const y of ys) cands.push({ x: u.x + u.w + gap, y, side: 'right' });
  for (const y of ys) cands.push({ x: u.x - gap - card.w, y, side: 'left' });
  const order = { below: 0, above: 1, right: 2, left: 3, over: 4 };
  let best: Placement | null = null;
  let bestScore = Infinity;
  for (const c of cands) {
    const x = clampTo(c.x, margin, vw - margin - card.w);
    const y = clampTo(c.y, margin, vh - margin - card.h);
    const b = { x, y, w: card.w, h: card.h };
    const onTargets = targets.reduce((a, t) => a + overlap(b, t), 0);
    const onAvoid = avoid.reduce((a, t) => a + overlap(b, t), 0);
    const moved = Math.abs(x - c.x) + Math.abs(y - c.y);
    const dx = Math.max(0, u.x - (x + card.w), x - (u.x + u.w));
    const dy = Math.max(0, u.y - (y + card.h), y - (u.y + u.h));
    const far = Math.max(0, Math.hypot(dx, dy) - FAR);
    const score = onTargets * 50 + onAvoid + order[c.side] * 400 + moved * 2 + far * 150;
    if (score < bestScore) {
      bestScore = score;
      best = { x, y, side: c.side };
    }
  }
  return best ?? { x: margin, y: margin, side: 'over' };
}

/** A lit box hugs the element: the element's own corner radius, grown by the padding. */
export const litOf = (b: Box, radius: number, pad: number): Lit => ({ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2, r: Math.max(0, radius) + pad });
