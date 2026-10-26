/** Acquire the frame for a view, or restore its current values after its callbacks change. */
export function registerPublication<T>(list: T[], entry: T, ghost: boolean, publish: (value: T | null) => void) {
  if (ghost) list.unshift(entry);
  else list.push(entry);
  // The camera may be paused and its directions unchanged. Publish on ownership acquisition too,
  // otherwise a new viewport reset key discards the old values without ever receiving replacements.
  if (list[list.length - 1] === entry) publish(entry);
  return () => {
    const i = list.indexOf(entry);
    if (i < 0) return;
    const top = i === list.length - 1;
    list.splice(i, 1);
    if (top) publish(list[list.length - 1] ?? null);
  };
}
