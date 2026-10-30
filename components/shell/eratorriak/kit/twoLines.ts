/** A long name on two lines, split at its own separator nearest the middle (every word kept). */
export function twoLines(text: string): { text: string; sub?: string } {
  if (text.length <= 34) return { text };
  let best = -1;
  for (const sep of ['; ', ' · ', ' / ', ', ']) {
    for (let k = text.indexOf(sep); k > 0; k = text.indexOf(sep, k + 1))
      if (best < 0 || Math.abs(k - text.length / 2) < Math.abs(best - text.length / 2)) best = k;
  }
  if (best < 0) return { text };
  const cut = text.slice(best, best + 3).match(/^(; |, )/) ? best + 1 : best;
  return {
    text: text.slice(0, cut).trim(),
    sub: text
      .slice(cut)
      .replace(/^[;,]?\s*/, '')
      .trim(),
  };
}
