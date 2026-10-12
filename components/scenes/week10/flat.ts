import { lerp, type Pt } from '@/components/kit';

/**
 * The flat disc of the end of week 3 in transverse section (dorsal up), close up: the layers fill the
 * middle of the frame and the amniotic cavity (above) and the yolk sac (below) are only hinted at the
 * edges. Frame units; the right half is given, the left half is its mirror image about x = 500.
 * Stage 2's section (Fusion) starts from exactly these shapes, so the two read as one film.
 */
export const F = {
  x0: 226, // field edges (the section fades out there: it goes on beyond the frame)
  x1: 774,
  fade: 56,
  top: 132, // ectoderm surface
  ecto: 32,
  plate: 62, // neural plate thickness at the midline
  plateHalf: 104,
  groove: 10,
  /** Where the coelom begins on the right (its medial tip). */
  cm: 622,
  parBot: 206, // parietal layer: from the ectoderm to the coelom
  visTop: 280, // visceral layer: from the coelom to the endoderm
  endoTop: 410,
  endoBot: 446,
  /** The endocardial tube (right) in the visceral layer, and its blood islands. */
  tube: [688, 342] as Pt,
  islands: [646, 690, 732] as const,
  noto: [500, 238] as Pt,
  notoR: 20,
  aorta: [568, 300] as Pt,
  aortaR: 16,
} as const;

/** Dorsal surface of the ectoderm (the neural groove dips in the midline). */
export const ectoTopAt = (x: number) => {
  const d = Math.abs(x - 500);
  return F.top + (d < 22 ? (1 + Math.cos((Math.PI * d) / 22)) * 0.5 * F.groove : 0);
};
/** Lower face of the ectoderm (thick neural plate near the midline). */
export const ectoBottomAt = (x: number) => {
  const d = Math.abs(x - 500);
  const th = d < F.plateHalf ? lerp(F.plate, F.ecto, Math.pow(d / F.plateHalf, 3)) : F.ecto;
  return ectoTopAt(x) + th;
};

/** Coelom on the right: a lens from its medial tip out to the field edge (`deep` 0..1 widens it). */
export function coelomRight(deep = 0, bulge = 0): { top: Pt[]; bot: Pt[] } {
  const n = 28;
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = lerp(F.cm, F.x1 + 6, i / n);
    const k = Math.min(1, (x - F.cm) / 46);
    const open = Math.sqrt(k);
    const mid = (F.parBot + F.visTop) / 2;
    const half = ((F.visTop - F.parBot) / 2 + deep * 10) * open;
    // The tube bulges up into the coelom from the visceral layer.
    const b = bulge * 16 * Math.exp(-(((x - F.tube[0]) / 40) ** 2));
    top.push([x, mid - half - deep * 4]);
    bot.push([x, Math.max(mid - half - deep * 4 + 2, mid + half + deep * 8 - b)]);
  }
  return { top, bot };
}

export const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));
