/** Browser storage is optional; ignore obsolete or malformed progress without breaking a round. */
export function decodeBoxes(raw: string | null): Record<string, number> {
  try {
    const value: unknown = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, n]) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 4));
  } catch {
    return {};
  }
}
