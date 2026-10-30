'use client';

import { FATES, ORIGINS, SEGS, STAGE_COUNT, changedAt, lifeAt, type Seg } from '@/content/eratorriak/arteries';
import styles from './eratorriak.module.css';

/**
 * The aortic arch system as the notes' ladder figure (Langman): seen from the front, the embryo's right on
 * the viewer's left; the aortic sac and its horns in the middle, the six arch pairs as rungs, the dorsal
 * aortas at the sides fusing below. Every piece keeps its place at every moment, so what changes is only
 * whether it is there, going, or gone: the same figure, six times. The real adult shape is the 3D's job.
 */

export const W = 960;
export const H = 640;

type Anchor = 'start' | 'middle' | 'end';
type Txt = readonly [string, string?];

/** The right side's geometry; the left one is its mirror (x → W − x) unless a key draws its own. */
const R_PATHS: Record<string, string> = {
  horn: 'M480,340 C452,340 400,334 400,308 L400,258',
  cran: 'M400,190 L400,70',
  a1v: 'M400,70 L300,70',
  a1d: 'M300,70 L245,70',
  a2v: 'M400,128 L300,128',
  a2d: 'M300,128 L245,128',
  a3cc: 'M400,258 L400,190',
  a3ica: 'M400,190 L245,190',
  eca: 'M400,190 C407,170 413,150 413,96',
  a4: 'M400,258 L245,258',
  a5: 'M400,308 L245,308',
  a6d: 'M330,392 L245,392',
  pulm: 'M330,392 C330,420 326,444 322,468',
  daCran: 'M245,190 L245,24',
  daDuct: 'M245,190 L245,258',
  daMid: 'M245,258 L245,440',
  is7: 'M245,440 L170,440',
  daLow: 'M245,440 C245,530 400,575 480,588',
};
/** The 6th arch's proximal part leaves the truncus, then (after the division) the pulmonary trunk. */
const A6P = {
  R: ['M480,412 C452,398 420,392 330,392', 'M492,414 C462,398 420,392 330,392'],
  L: ['M480,412 C508,398 540,392 630,392', 'M492,414 C524,400 548,392 630,392'],
};
const C_PATHS: Record<string, string> = {
  truncus: 'M480,500 L480,340',
  'asc-aorta': 'M468,500 L468,354 Q468,340 480,340',
  'pulm-trunk': 'M492,500 L492,414',
  sac: 'M468,340 L492,340',
  fused: 'M480,588 L480,634',
};

const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${W - Number(x)},${y}`);
const base = (s: Seg) => (s.side === 'C' ? s.key : s.key.slice(0, -1));

export function pathOf(s: Seg, stage: number): string {
  if (s.side === 'C') return C_PATHS[s.key];
  const b = base(s);
  if (b === 'a6p') return A6P[s.side][stage >= 2 ? 1 : 0];
  const d = R_PATHS[b];
  return s.side === 'R' ? d : mirror(d);
}

const BIG = new Set(['horn', 'a3cc', 'a3ica', 'a4', 'a6p', 'a6d', 'daCran', 'daDuct', 'daMid', 'daLow', 'truncus', 'asc-aorta', 'pulm-trunk', 'fused']);
const widthOf = (s: Seg) => (s.key === 'sac' ? 15 : BIG.has(base(s)) ? 10 : base(s) === 'is7' ? 8 : 6);

/** The diagram's own names: short, two lines at most; [embryonic, fate (right), fate (left)] and where they sit (right side). */
const LABELS: Record<string, { emb?: Txt; fate?: Txt; fateL?: Txt; late?: Txt; pos: readonly [number, number, Anchor]; posL?: readonly [number, number, Anchor] }> = {
  truncus: { emb: ['Enbor arteriosoa'], pos: [494, 494, 'start'] },
  'asc-aorta': { fate: ['Goranzko', 'aorta'], pos: [456, 468, 'end'] },
  'pulm-trunk': { fate: ['Birika', 'enborra'], pos: [504, 468, 'start'] },
  sac: { emb: ['Aorta zakua'], pos: [494, 360, 'start'] },
  horn: { emb: ['Eskuineko', 'luzapena'], fate: ['Enbor', 'brakiozefalikoa'], fateL: ['Aortaren makoa', 'hasierako zatia'], pos: [412, 286, 'start'], posL: [548, 260, 'end'] },
  a1d: { fate: ['Arteria maxilarra'], pos: [232, 70, 'end'] },
  a2d: { fate: ['Hioide azpiko arteria', '+ ointokiko arteria'], pos: [232, 124, 'end'] },
  a3cc: { fate: ['Karotida', 'komuna'], pos: [412, 220, 'start'] },
  a3ica: { fate: ['Barneko karotida', 'hurbileko zatia'], pos: [232, 186, 'end'] },
  eca: { fate: ['Kanpoko', 'karotida'], pos: [392, 92, 'end'] },
  a4: { fate: ['Eskuineko subklabioa', '1. zatia · hurbilekoa'], fateL: ['Aortaren makoa', 'urrutiko atala'], pos: [232, 254, 'end'] },
  a6p: { fate: ['Eskuineko', 'birika arteria'], fateL: ['Ezkerreko', 'birika arteria'], pos: [342, 418, 'start'] },
  pulm: { emb: ['Hasierako', 'birika arteria'], pos: [338, 452, 'start'] },
  a6d: { fate: ['6. arkua, urrutikoa', 'desagertzen da'], fateL: ['Hodi arteriosoa'], late: ['Lotailu arteriosoa'], pos: [232, 388, 'end'] },
  daCran: { emb: ['Aorta dortsala'], fate: ['Barneko karotida', 'urrutiko zatia'], pos: [232, 34, 'end'] },
  daDuct: { fate: ['Hodi karotideoa', 'desagertzen da'], pos: [258, 216, 'start'] },
  daMid: { fate: ['Eskuineko subklabioa', '2. zatia · bitartekoa'], fateL: ['Beheranzko aorta'], pos: [232, 338, 'end'] },
  is7: { emb: ['7. segmentu', 'arteko arteria'], fate: ['Eskuineko subklabioa', '3. zatia · urrutikoa'], fateL: ['Ezkerreko subklabioa', 'osoa'], pos: [160, 432, 'end'] },
  daLow: { fate: ['Eskuineko aorta dortsala', 'desagertzen da'], pos: [312, 562, 'end'] },
  fused: { emb: ['Aorta dortsal bakarra', 'T4tik behera'], fate: ['Beheranzko aorta'], pos: [494, 616, 'start'] },
};

/** The diagram's name for a piece at a moment (null: none, e.g. an arch rung, which wears its number). */
export function labelOf(s: Seg, stage: number): { t: string; sub?: string; x: number; y: number; a: Anchor } | null {
  const l = LABELS[base(s)];
  if (!l) return null;
  // Left pieces of the same fate as their whole (the left low dorsal aorta is part of the descending aorta).
  if (s.key === 'daLowL') return null;
  const fateNow = stage >= s.fateFrom;
  let txt: Txt | undefined;
  if (s.late && stage >= s.late.from) txt = l.late;
  else if (fateNow) txt = s.side === 'L' ? (l.fateL ?? l.fate) : l.fate;
  else txt = l.emb;
  if (s.key === 'hornL' && !fateNow) txt = ['Ezkerreko', 'luzapena'];
  // The pulmonary branch is named with its arch once both are the pulmonary artery; the sac with the aorta.
  if ((base(s) === 'pulm' || s.key === 'sac') && fateNow) return null;
  // The right low dorsal aorta is named only once it is going.
  if (s.key === 'daLowR' && lifeAt(s, stage) < 2) return null;
  if (!txt) return null;
  const [x, y, a] = s.side === 'L' ? (l.posL ?? [W - l.pos[0], l.pos[1], l.pos[2] === 'end' ? 'start' : l.pos[2] === 'start' ? 'end' : 'middle']) : l.pos;
  return { t: txt[0], sub: txt[1], x, y, a: a as Anchor };
}

/** Arch numbers on their rungs (right side; mirrored). */
const BADGES: { n: number; key: string; x: number; y: number }[] = [
  { n: 1, key: 'a1v', x: 322, y: 60 },
  { n: 2, key: 'a2v', x: 322, y: 118 },
  { n: 3, key: 'a3ica', x: 322, y: 180 },
  { n: 4, key: 'a4', x: 322, y: 248 },
  { n: 5, key: 'a5', x: 322, y: 298 },
  { n: 6, key: 'a6d', x: 288, y: 382 },
];

export type ColourMode = 'origin' | 'fate';

export function colourOf(s: Seg, mode: ColourMode): string {
  if (mode === 'origin') return ORIGINS[s.origin].color;
  return s.fate === 'gone' ? '#77737f' : FATES[s.fate].color;
}

const GHOST = '#d8d2e6';

export function ArchLadder({
  stage,
  mode,
  lit,
  focus,
  hover,
  labels = true,
  glow = true,
  mini = false,
  onPick,
  onHover,
}: {
  stage: number;
  mode: ColourMode;
  /** Pieces lit (the rest dim); empty = none. */
  lit?: ReadonlySet<string>;
  /** The one piece picked (outlined). */
  focus?: string | null;
  hover?: string | null;
  labels?: boolean;
  /** Glow the pieces that change at this moment. */
  glow?: boolean;
  mini?: boolean;
  onPick?: (key: string) => void;
  onHover?: (key: string | null) => void;
}) {
  const st = Math.max(0, Math.min(STAGE_COUNT - 1, stage));
  const any = !!lit && lit.size > 0;
  const segs = SEGS.filter((s) => lifeAt(s, st) > 0);
  // Ghosts first, then the vessels; the ascending aorta last, over the right pulmonary artery that passes behind it.
  const order = [...segs].sort((a, b) => rank(a, st) - rank(b, st));
  const alive = (s: Seg) => lifeAt(s, st) === 1 || lifeAt(s, st) === 2;
  const lungs = SEGS.filter((s) => s.key.startsWith('pulm') && alive(s));

  return (
    <svg className={`${styles.ladder}${mini ? ` ${styles.ladderMini}` : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Aorta arkuen eskema, aurretik ikusita">
      <defs>
        <filter id="lad-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {!mini && (
        <g className={styles.sideHead} aria-hidden>
          <text x={322} y={14} textAnchor="middle">
            Eskuina
          </text>
          <text x={W - 322} y={14} textAnchor="middle">
            Ezkerra
          </text>
        </g>
      )}
      {/* The heart under the truncus, and the lung buds the pulmonary arteries reach. */}
      <ellipse cx={480} cy={524} rx={46} ry={22} className={styles.heart} />
      {!mini && (
        <text x={480} y={528} textAnchor="middle" className={styles.heartText}>
          bihotza
        </text>
      )}
      {lungs.map((s) => (
        <ellipse key={s.key} cx={s.side === 'R' ? 318 : W - 318} cy={486} rx={20} ry={12} className={styles.lung} />
      ))}

      {order.map((s) => {
        const life = lifeAt(s, st);
        const d = pathOf(s, st);
        const w = widthOf(s);
        const isLit = !any || lit!.has(s.key);
        const ghost = life === 3;
        const going = life === 2;
        const col = ghost ? GHOST : colourOf(s, mode);
        const changed = glow && !any && changedAt(s, st) && !ghost;
        const op = ghost ? (any && isLit ? 0.5 : 0.17) : isLit ? (going ? 0.8 : 1) : 0.16;
        const sw = ghost ? 3 : going ? Math.max(2.5, w * 0.42) : w;
        const picked = focus === s.key;
        const hovered = hover === s.key;
        return (
          <g key={s.key} className={styles.seg} data-key={s.key}>
            {(picked || hovered) && !ghost && <path d={d} className={styles.halo} strokeWidth={sw + (picked ? 7 : 4)} opacity={picked ? 0.95 : 0.45} />}
            {s.key === 'asc-aorta' && <path d={d} className={styles.gap} strokeWidth={sw + 8} />}
            <path d={d} stroke={col} strokeWidth={sw} opacity={op} fill="none" strokeLinecap="round" filter={changed ? 'url(#lad-glow)' : undefined} className={styles.vessel} />
            {!mini && onPick && (
              <path
                d={d}
                className={styles.hit}
                strokeWidth={Math.max(18, sw + 10)}
                onClick={() => onPick(s.key)}
                onPointerEnter={() => onHover?.(s.key)}
                onPointerLeave={() => onHover?.(null)}
              >
                <title>{`${s.emb}${s.fate === 'gone' ? ' — desagertzen da' : ` → ${s.fateText}`}`}</title>
              </path>
            )}
          </g>
        );
      })}

      {/* Arch numbers on the rungs. */}
      {BADGES.flatMap((b) =>
        (['R', 'L'] as const).map((side) => {
          const s = SEGS.find((x) => x.key === `${b.key}${side}`)!;
          const life = lifeAt(s, st);
          if (life === 0) return null;
          const isLit = !any || lit!.has(s.key) || SEGS.some((x) => x.origin === s.origin && x.side === side && lit!.has(x.key));
          return (
            <text
              key={`${b.n}${side}`}
              x={side === 'R' ? b.x : W - b.x}
              y={b.y}
              textAnchor="middle"
              className={styles.badge}
              fill={life === 3 ? '#8e8a97' : ORIGINS[s.origin].color}
              opacity={(life === 3 ? 0.55 : 1) * (isLit ? 1 : 0.3)}
            >
              {b.n}
            </text>
          );
        }),
      )}

      {labels &&
        !mini &&
        segs.map((s) => {
          const l = labelOf(s, st);
          if (!l) return null;
          const life = lifeAt(s, st);
          const isLit = !any || lit!.has(s.key);
          const gone = life === 3 || (s.fate === 'gone' && st >= s.fateFrom);
          return (
            <g key={`l-${s.key}`} className={`${styles.label}${gone ? ` ${styles.labelGone}` : ''}`} opacity={isLit ? 1 : 0.28} onClick={onPick ? () => onPick(s.key) : undefined}>
              <text x={l.x} y={l.y} textAnchor={l.a} dy="0.35em">
                <tspan className={styles.labelMain}>{l.t}</tspan>
                {l.sub && (
                  <tspan x={l.x} dy="1.25em" className={styles.labelSub}>
                    {l.sub}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

function rank(s: Seg, st: number) {
  const life = lifeAt(s, st);
  if (life === 3) return 0;
  if (s.key === 'asc-aorta') return 3;
  if (s.key.startsWith('a6p')) return 2;
  return 1;
}
