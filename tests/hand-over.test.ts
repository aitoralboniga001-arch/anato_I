import { describe, expect, it } from 'vitest';
import { handOver } from '@/components/kit/columns';

/**
 * Two names in the same slot take turns (a crossfade): never both legible at once. The labels test samples
 * a few moments of each step, so a short crossfade between them was missed (topic 10, "Miokardioa" over
 * "Orri epimiokardikoa"); the rule is checked here on its own, over the whole fade.
 */
describe('names sharing a slot hand it over', () => {
  const at = { x: 790, y: 456, align: 'start' as const };

  it('shows at most one of them at any moment of the crossfade', () => {
    for (let u = 0; u <= 1.0001; u += 0.01) {
      const out = handOver([
        ['a', at, 1 - u],
        ['b', at, u],
      ]);
      const shown = (k: string, s: number) => out.get(k) ?? s;
      const a = shown('a', 1 - u);
      const b = shown('b', u);
      expect(Math.min(a, b), `u = ${u.toFixed(2)}`).toBeLessThanOrEqual(0.02);
    }
  });

  it('lets the leaving name go before the coming one is legible', () => {
    const out = handOver([
      ['a', at, 0.55],
      ['b', at, 0.45],
    ]);
    expect(out.get('b')).toBe(0);
    expect(out.get('a')!).toBeLessThan(0.3);
  });

  it('leaves names in different slots, and a lone name, alone', () => {
    const out = handOver([
      ['a', at, 0.5],
      ['b', { ...at, y: 500 }, 0.5],
      ['c', { ...at, x: 10 }, 1],
    ]);
    expect(out.size).toBe(0);
  });
});
