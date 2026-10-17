/**
 * Work counters for the performance harness (scripts/perf-topic10.mjs). They cost one property read and
 * count nothing unless the harness set `window.__perf = {}` before the page loaded.
 */
type Counters = Record<string, number>;

export function perfCount(name: string, n = 1) {
  const p = (globalThis as { __perf?: Counters }).__perf;
  if (p) p[name] = (p[name] ?? 0) + n;
}
