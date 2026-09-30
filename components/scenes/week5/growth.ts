import { lerp } from '@/components/kit';

/**
 * The notes' table "Enbrio aroko luzeera eta pisuen gehikuntza": each row is a week band with
 * a crown–rump length range (cm) and a weight range (g). Points are (week, value) at the start
 * and end of each band, so interpolating them reads the table directly.
 */
export const ROWS: { w: [number, number]; len: [number, number]; wt: [number, number] }[] = [
  { w: [9, 12], len: [5, 8], wt: [10, 45] },
  { w: [13, 16], len: [9, 14], wt: [60, 200] },
  { w: [17, 20], len: [15, 19], wt: [250, 450] },
  { w: [21, 24], len: [20, 23], wt: [500, 820] },
  { w: [25, 28], len: [24, 27], wt: [900, 1300] },
  { w: [29, 32], len: [28, 30], wt: [1400, 2100] },
  { w: [33, 36], len: [31, 34], wt: [2200, 2900] },
  { w: [37, 38], len: [35, 36], wt: [3000, 3400] },
];

export const LEN: [number, number][] = ROWS.flatMap((r) => [[r.w[0], r.len[0]], [r.w[1], r.len[1]]] as [number, number][]);
export const WT: [number, number][] = ROWS.flatMap((r) => [[r.w[0], r.wt[0]], [r.w[1], r.wt[1]]] as [number, number][]);

/**
 * Where the notes' prose and table disagree, the prose wins: at the end of the 5th month (week 20)
 * the fetus is ~15 cm and ~500 g (the table's 17–20 week row says 15–19 cm and 250–450 g). The
 * fetus drawings and their live read-outs follow these curves; the growth charts still plot the table.
 */
export const TEXT_W20 = { len: 15, wt: 500 };
export const LEN_TEXT: [number, number][] = [...LEN.filter(([w]) => w <= 12), [20, TEXT_W20.len], ...LEN.filter(([w]) => w >= 28)];
export const WT_TEXT: [number, number][] = [...WT.filter(([w]) => w <= 16), [20, TEXT_W20.wt], ...WT.filter(([w]) => w >= 24)];

export const interp = (tab: [number, number][], x: number) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) if (x <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], (x - tab[i][0]) / (tab[i + 1][0] - tab[i][0]));
  return tab[tab.length - 1][1];
};

/** Weight as read out in the UI: grams rounded to 5, or kilograms with a decimal comma. */
export const fmtWeight = (g: number): [string, string] => (g >= 1000 ? [(g / 1000).toFixed(1).replace('.', ','), ' kg'] : [String(Math.round(g / 5) * 5), ' g']);
