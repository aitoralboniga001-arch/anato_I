/**
 * Where Kimu stands in the scene while it teaches: beside what it names, within its stick's reach, and
 * never over that structure, any name or name dot, or the scene's buttons. Pure (rectangles in, a spot
 * out) so it is tested without a browser. Coordinates are the viewport's, in CSS pixels.
 */

export interface Pt {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Facing = 'left' | 'right';

/** The stick shoulder within Kimu's box when it faces right (mirrored when it faces left). */
export const SHOULDER = { x: 92 / 120, y: 80 / 150 };

export interface StandInput {
  view: { w: number; h: number };
  kimu: { w: number; h: number };
  /** What is named: the points to point at (a name's dot, else the structure's middle). */
  targets: Pt[];
  /** The named structures' boxes (small ones only): Kimu never stands on them. */
  keepClear: Rect[];
  /** Everything else not to cover, each with how much covering it costs (names and dots high). */
  avoid: { r: Rect; weight: number }[];
  /** Where Kimu is now (its box's top-left), so it does not wander without a reason. */
  from: Pt | null;
  /** Without a target: the corner it prefers (looking at the student). */
  home?: Pt;
  /** How far the stick reaches from the shoulder, in pixels. */
  reach: number;
}

export interface Stand {
  x: number;
  y: number;
  facing: Facing;
  /** The point it aims at, if any. */
  aim: Pt | null;
}

const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

export const shoulderOf = (x: number, y: number, kimu: { w: number; h: number }, facing: Facing): Pt => ({
  x: x + (facing === 'right' ? SHOULDER.x : 1 - SHOULDER.x) * kimu.w,
  y: y + SHOULDER.y * kimu.h,
});

/** The middle of the targets (one structure, or several named together). */
export const centreOf = (pts: Pt[]): Pt | null => (pts.length ? { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length } : null);

export function standAt(input: StandInput): Stand {
  const { view, kimu, targets, keepClear, avoid, from, reach } = input;
  const aim = centreOf(targets);
  const area = kimu.w * kimu.h;
  const diag = Math.hypot(view.w, view.h);
  const pad = 6;
  const step = Math.max(12, Math.round(Math.min(view.w, view.h) / 28));
  const dots: Rect[] = targets.map((t) => ({ x: t.x - 22, y: t.y - 22, w: 44, h: 44 }));
  let best: Stand & { score: number } = { x: pad, y: view.h - kimu.h - pad, facing: 'right', aim, score: Infinity };

  for (let y = pad; y <= view.h - kimu.h - pad; y += step) {
    for (let x = pad; x <= view.w - kimu.w - pad; x += step) {
      const box = { x, y, w: kimu.w, h: kimu.h };
      const facing: Facing = aim ? (aim.x >= x + kimu.w / 2 ? 'right' : 'left') : (input.home?.x ?? 0) > view.w / 2 ? 'left' : 'right';
      let score = 0;
      // Covering a name, a dot or what is named at all costs a fixed amount on top of how much is covered:
      // a corner over a name hides it as surely as standing on it.
      for (const r of keepClear) { const o = overlap(box, r); if (o > 0) score += 3 + (o / area) * 40; }
      for (const r of dots) { const o = overlap(box, r); if (o > 0) score += 6 + (o / area) * 60; }
      for (const a of avoid) { const o = overlap(box, a.r); if (o > 0) score += (a.weight >= 6 ? 3 : 0) + (o / area) * a.weight; }
      if (aim) {
        // Within the telescopic stick's reach: nearer is a little better, but standing clear of the drawing
        // (the costs above) is worth drawing the stick out; too close and the stick cannot bend to it.
        const s = shoulderOf(x, y, kimu, facing);
        const d = Math.hypot(aim.x - s.x, aim.y - s.y);
        const near = reach * 0.4 + 14;
        const far = reach + 14;
        score += d < near ? ((near - d) / 30) ** 2 * 4 : d > far ? ((d - far) / 60) ** 2 * 2 + 0.6 : ((d - near) / (far - near)) * 0.6;
        // Pointing from below or from the side reads better than reaching down over the head.
        if (aim.y > s.y + 40) score += 0.4;
      } else if (input.home) {
        score += (Math.hypot(x - input.home.x, y - input.home.y) / diag) * 6;
      }
      if (from) score += (Math.hypot(x - from.x, y - from.y) / diag) * 1.5;
      if (score < best.score) best = { x, y, facing, aim, score };
    }
  }
  return { x: best.x, y: best.y, facing: best.facing, aim: best.aim };
}

/**
 * Whether where Kimu stands has gone wrong since it chose it (a name appeared under it, the camera moved,
 * what it names moved out of reach): then it steps aside. Small brushes do not count, so it does not fidget.
 */
export function blocked(at: { x: number; y: number; facing: Facing }, input: StandInput): boolean {
  const { kimu, targets, keepClear, avoid, reach, view } = input;
  const box = { x: at.x, y: at.y, w: kimu.w, h: kimu.h };
  const area = kimu.w * kimu.h;
  const hit = (r: Rect) => overlap(box, r) / area > 0.015;
  if (at.x < -2 || at.y < -2 || at.x + kimu.w > view.w + 2 || at.y + kimu.h > view.h + 2) return true;
  if (keepClear.some(hit)) return true;
  if (targets.some((t) => hit({ x: t.x - 22, y: t.y - 22, w: 44, h: 44 }))) return true;
  if (avoid.some((a) => a.weight >= 6 && hit(a.r))) return true;
  const aim = centreOf(targets);
  if (!aim) return false;
  const s = shoulderOf(at.x, at.y, kimu, at.facing);
  // Far out of reach (the camera moved it away), not just beyond the stick: standAt may pick a spot a
  // little beyond when the near ones would cover the drawing, and that is not a reason to walk.
  return Math.hypot(aim.x - s.x, aim.y - s.y) > reach * 1.8 + 20;
}

/** Whether the stick reaches what is named from where Kimu stands (then it points without walking). */
export function reaches(at: { x: number; y: number; facing: Facing }, kimu: { w: number; h: number }, targets: Pt[], reach: number): boolean {
  const aim = centreOf(targets);
  if (!aim) return true;
  const facing: Facing = aim.x >= at.x + kimu.w / 2 ? 'right' : 'left';
  const s = shoulderOf(at.x, at.y, kimu, facing);
  return Math.hypot(aim.x - s.x, aim.y - s.y) <= reach + 14;
}

/** The stick arm's angle (degrees, Kimu's own frame: 0 = ahead, −90 = up) and length toward a point. */
export function armTo(stand: { x: number; y: number; facing: Facing }, kimu: { w: number; h: number }, aim: Pt, reach: number): { angle: number; reach: number } {
  const s = shoulderOf(stand.x, stand.y, kimu, stand.facing);
  const dx = aim.x - s.x;
  const dy = aim.y - s.y;
  const screen = (Math.atan2(dy, dx) * 180) / Math.PI;
  const own = stand.facing === 'right' ? screen : ((180 - screen + 540) % 360) - 180;
  return { angle: Math.max(-160, Math.min(85, own)), reach: Math.max(0.35, Math.min(1, (Math.hypot(dx, dy) - 14) / reach)) };
}
