/**
 * Build a 3D view's meshes ahead of time, in the browser's idle time after the page settles, one job
 * per idle slot, so opening the view does not stall on a one-time build. A no-op on the server.
 */
export function prewarm(...jobs: (() => unknown)[]) {
  if (typeof window === 'undefined') return;
  const idle = (fn: () => void) =>
    'requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 300);
  const run = () => {
    const job = jobs.shift();
    if (!job) return;
    try {
      job();
    } catch {
      // Built again (and reported) when the view opens.
    }
    if (jobs.length) idle(run);
  };
  setTimeout(() => idle(run), 1500);
}
