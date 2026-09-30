/**
 * Two small protections for a shared free-tier key. Both live in the memory of one server instance:
 * on serverless they are best-effort (each instance counts on its own), which is enough to stop a
 * single tab from draining the minute's tokens.
 */

const hits = new Map<string, number[]>();

/** True while `key` (an IP) has made fewer than `max` requests in the last `windowMs`. */
export function allow(key: string, max = 14, windowMs = 5 * 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  return true;
}

const cache = new Map<string, { at: number; value: unknown }>();
const TTL = 12 * 60 * 60_000;

export function cached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function remember(key: string, value: unknown) {
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), value });
}
