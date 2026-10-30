import { describe, expect, it } from 'vitest';
import { BEL_ITEMS, BEL_PLATES, BEL_SYSTEMS, matchesName, normalizeName, sameKey } from '@/content/belortzioak';
import { arrange, H } from '@/lib/belortzioakLayout';

const inUnit = ([x, y]: [number, number]) => x >= 0 && x <= 1 && y >= 0 && y <= 1;

describe('belortzioak: the figure set', () => {
  it('covers skin anatomy to the digestive system, every system with figures', () => {
    expect(BEL_PLATES.map((p) => p.id)).toEqual(Array.from({ length: 22 }, (_, i) => `p${String(i + 2).padStart(2, '0')}`));
    for (const sys of BEL_SYSTEMS) expect(BEL_PLATES.some((p) => p.system === sys.id)).toBe(true);
  });

  it('gives every figure its size and named, placed structures', () => {
    for (const p of BEL_PLATES) {
      expect(p.size[0], p.id).toBeGreaterThan(500);
      expect(p.items.length, p.id).toBeGreaterThan(2);
      for (const it of p.items) {
        expect(it.name.trim(), it.key).not.toBe('');
        expect(inUnit(it.label), it.key).toBe(true);
        expect(it.targets.length, it.key).toBeGreaterThan(0);
        expect(it.targets.every(inUnit), it.key).toBe(true);
        expect(it.r.length, it.key).toBe(it.targets.length);
      }
    }
  });

  it('keeps keys unique and one number per name within a figure', () => {
    const keys = BEL_ITEMS.map((x) => x.item.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of BEL_PLATES) {
      const names = p.items.map((it) => normalizeName(it.name));
      expect(new Set(names).size, p.id).toBe(names.length);
    }
  });

  it('leaves out numbers whose legend line is crossed out or not visible', () => {
    // p04 12 "Ildo zerbikala" (not visible), p07 6/21 (crossed out), p17 13 (not visible), p21 10/11 (no legend)
    const has = (k: string) => BEL_ITEMS.some((x) => x.item.key === k);
    for (const k of ['p04:12', 'p07:6', 'p07:21', 'p17:13', 'p21:10', 'p21:11']) expect(has(k), k).toBe(false);
  });

  it('links the same structure across figures', () => {
    const sinus = BEL_ITEMS.filter((x) => sameKey(x.item.name) === sameKey('Kloaka'));
    expect(sinus.map((x) => x.plate.id).sort()).toEqual(['p19', 'p20']);
  });
});

describe('belortzioak: typed answers', () => {
  const item = (name: string, accept?: string[]) => ({ name, accept });

  it('forgives accents, case, hyphens, ordinals and small typos', () => {
    expect(matchesName('sinu benosua', item('Sinu benosoa'))).toBe(true);
    expect(matchesName('3 faringe arkua', item('III. faringe-arkua'))).toBe(true);
    expect(matchesName('zilborarteriak', item('Zilbor-arteriak'))).toBe(true);
    expect(matchesName('mesodermo paraxiala', item('Mesodermo paraxiala'))).toBe(true);
    expect(matchesName('hestegorria', item('Hodi tiroglosoa, hestegorria', ['hodi tiroglosoa', 'hestegorria']))).toBe(true);
    expect(matchesName('Rathke poltsa', item('Rathke poltsa (adenohipofisia)'))).toBe(true);
  });

  it('does not pass a sibling for the asked structure', () => {
    expect(matchesName('Beheko arteria mesenterikoa', item('Goiko arteria mesenterikoa'))).toBe(false);
    expect(matchesName('Ezkerreko aurikula', item('Eskuineko aurikula'))).toBe(false);
    expect(matchesName('II. faringe-arkua', item('III. faringe-arkua'))).toBe(false);
    expect(matchesName('Somita lunbarrak', item('Somita sakroak'))).toBe(false);
    expect(matchesName('ab', item('Ahoa'))).toBe(false);
  });
});

describe('belortzioak: name columns', () => {
  it('keeps every name on the plate, apart from its neighbours, with no crossing leaders', () => {
    for (const p of BEL_PLATES) {
      const placed = arrange(p.items);
      expect(placed.length, p.id).toBe(p.items.length);
      for (const side of ['l', 'r'] as const) {
        const col = placed.filter((x) => x.side === side).sort((a, b) => a.y - b.y);
        for (const x of col) expect(x.y >= 0 && x.y <= H, p.id).toBe(true);
        for (let i = 1; i < col.length; i++) expect(col[i].y - col[i - 1].y, `${p.id} ${side}`).toBeGreaterThanOrEqual(40);
        // leaders from the column edge to the mean target: no two cross
        const ex = side === 'l' ? 0 : 1;
        const seg = col.map((x) => {
          const it = p.items.find((i) => i.key === x.key)!;
          const tx = it.targets.reduce((a, t) => a + t[0], 0) / it.targets.length;
          const ty = it.targets.reduce((a, t) => a + t[1], 0) / it.targets.length;
          return [ex, x.y / H, tx, ty] as const;
        });
        const d = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        for (let i = 0; i < seg.length; i++)
          for (let j = i + 1; j < seg.length; j++) {
            const [a, b] = [seg[i], seg[j]];
            const crosses = d(a[0], a[1], a[2], a[3], b[0], b[1]) * d(a[0], a[1], a[2], a[3], b[2], b[3]) < 0 && d(b[0], b[1], b[2], b[3], a[0], a[1]) * d(b[0], b[1], b[2], b[3], a[2], a[3]) < 0;
            expect(crosses, `${p.id}: ${col[i].key} × ${col[j].key}`).toBe(false);
          }
      }
    }
  });
});
