/**
 * Where the guide is: the stop shown, the way it is going (a missing stop is passed over in that
 * direction) and whether it has ended — finished (last stop done) or left early (Esc, the cross).
 */
export type Nav = { idx: number; dir: 1 | -1; done: boolean; finished: boolean; missed: number };
export type NavAction = 'next' | 'prev' | 'close' | 'missing';

export const start = (n: number): Nav => ({ idx: 0, dir: 1, done: n === 0, finished: false, missed: 0 });

export function advance(s: Nav, a: NavAction, n: number): Nav {
  if (s.done) return s;
  switch (a) {
    case 'close':
      return { ...s, done: true, finished: false };
    case 'next':
      return s.idx >= n - 1 ? { ...s, done: true, finished: true } : { ...s, idx: s.idx + 1, dir: 1, missed: 0 };
    case 'prev':
      return s.idx <= 0 ? s : { ...s, idx: s.idx - 1, dir: -1, missed: 0 };
    case 'missing': {
      // Every stop has been tried and none is on screen: nothing to show.
      if (s.missed + 1 >= n) return { ...s, done: true, finished: false, missed: s.missed + 1 };
      const to = s.idx + s.dir;
      if (to >= n) return { ...s, done: true, finished: true, missed: s.missed + 1 };
      // Going back past the first stop: turn round and go on instead.
      if (to < 0) return { ...s, idx: s.idx + 1, dir: 1, missed: s.missed + 1 };
      return { ...s, idx: to, missed: s.missed + 1 };
    }
  }
}
