import { describe, expect, it } from 'vitest';
import { armTo, blocked, shoulderOf, standAt, type Rect } from '@/lib/klasea/stand';

const view = { w: 1000, h: 520 };
const kimu = { w: 88, h: 110 };
const reach = (kimu.w / 120) * 86;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const box = (s: { x: number; y: number }) => ({ x: s.x, y: s.y, ...kimu });

describe('Kimu stands beside what it names', () => {
  const target = { x: 500, y: 260 };
  const organ: Rect = { x: 440, y: 200, w: 120, h: 120 };
  const name: Rect = { x: 600, y: 240, w: 140, h: 26 };

  it('never on the structure, its dot or its name, inside the scene', () => {
    const s = standAt({ view, kimu, targets: [target], keepClear: [organ], avoid: [{ r: name, weight: 9 }], from: null, reach });
    expect(overlaps(box(s), organ)).toBe(false);
    expect(overlaps(box(s), name)).toBe(false);
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.y + kimu.h).toBeLessThanOrEqual(view.h);
  });

  it('within its pointer’s reach, and facing it', () => {
    const s = standAt({ view, kimu, targets: [target], keepClear: [organ], avoid: [], from: null, reach });
    const sh = shoulderOf(s.x, s.y, kimu, s.facing);
    expect(Math.hypot(target.x - sh.x, target.y - sh.y)).toBeLessThan(reach + 110);
    expect(s.facing).toBe(target.x >= s.x + kimu.w / 2 ? 'right' : 'left');
  });

  it('the stick stops short of the target', () => {
    const s = standAt({ view, kimu, targets: [target], keepClear: [organ], avoid: [], from: null, reach });
    const a = armTo(s, kimu, target, reach);
    const sh = shoulderOf(s.x, s.y, kimu, s.facing);
    expect(a.reach * reach).toBeLessThanOrEqual(Math.hypot(target.x - sh.x, target.y - sh.y) - 13);
  });

  it('stays put when the next structure is already within reach', () => {
    const first = standAt({ view, kimu, targets: [target], keepClear: [organ], avoid: [], from: null, reach });
    const again = standAt({ view, kimu, targets: [{ x: target.x, y: target.y + 6 }], keepClear: [organ], avoid: [], from: first, reach });
    expect(Math.hypot(again.x - first.x, again.y - first.y)).toBeLessThan(40);
  });

  it('with nothing named, goes to its corner', () => {
    const home = { x: 8, y: view.h - kimu.h - 8 };
    const s = standAt({ view, kimu, targets: [], keepClear: [], avoid: [], from: null, home, reach });
    expect(Math.hypot(s.x - home.x, s.y - home.y)).toBeLessThan(60);
  });

  it('steps aside when a name appears under it, not for a brush', () => {
    const s = standAt({ view, kimu, targets: [target], keepClear: [organ], avoid: [], from: null, reach });
    const input = { view, kimu, targets: [target], keepClear: [organ], from: s, reach };
    expect(blocked(s, { ...input, avoid: [] })).toBe(false);
    const late: Rect = { x: s.x + 10, y: s.y + 30, w: 120, h: 24 };
    expect(blocked(s, { ...input, avoid: [{ r: late, weight: 9 }] })).toBe(true);
    const brush: Rect = { x: s.x + kimu.w - 3, y: s.y + 30, w: 120, h: 24 };
    expect(blocked(s, { ...input, avoid: [{ r: brush, weight: 9 }] })).toBe(false);
  });

  it('steps closer when what it names moved out of reach', () => {
    const s = standAt({ view, kimu, targets: [target], keepClear: [organ], avoid: [], from: null, reach });
    expect(blocked(s, { view, kimu, targets: [{ x: s.x > 500 ? 20 : 980, y: 40 }], keepClear: [], avoid: [], from: s, reach })).toBe(true);
  });
});
