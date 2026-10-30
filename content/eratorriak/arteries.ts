/**
 * Topic 12 on the Eratorriak page: the arterial system as pieces that keep their identity while they
 * change. Every piece (segment) of the aortic arch system has an origin (what it is in the embryo), a
 * fate (what it becomes), and a life over six moments that follow the notes (2 → 2.4, then birth).
 * The same keys name the pieces of topic 12's 3D model (components/scenes/week12/arteries3d.ts), so the
 * 2D diagram and the 3D light the same thing. The text follows the notes' prose (Basque terms as the
 * notes write them); tests/eratorriak.test.ts checks the ids, the keys and the stage lives.
 */

/** Where a piece comes from: the colours of topic 12's 3D model (the notes' Langman figure). */
export type OriginId = 'sac' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'da' | 'is7';

export const ORIGINS: Record<OriginId, { name: string; short: string; color: string }> = {
  sac: { name: 'Aorta zakua eta enbor arteriosoa', short: 'Zakua', color: '#efe3c8' },
  a1: { name: '1. aorta arkua', short: '1.', color: '#7dd3fc' },
  a2: { name: '2. aorta arkua', short: '2.', color: '#b9a3ff' },
  a3: { name: '3. aorta arkua', short: '3.', color: '#ff9a3c' },
  a4: { name: '4. aorta arkua', short: '4.', color: '#e0408f' },
  a5: { name: '5. aorta arkua', short: '5.', color: '#a3a1b3' },
  a6: { name: '6. aorta arkua', short: '6.', color: '#3b82f6' },
  da: { name: 'Aorta dortsalak', short: 'A. dortsala', color: '#dc2626' },
  is7: { name: '7. segmentu arteko arteria', short: '7. segm.', color: '#14b8a6' },
};

/** What a piece becomes: one colour per adult artery (the "Eratorria" colouring). */
export type FateId =
  | 'goranzko-aorta'
  | 'birika-enborra'
  | 'aortaren-makoa'
  | 'beheranzko-aorta'
  | 'enbor-brakiozefalikoa'
  | 'karotida-komuna'
  | 'barneko-karotida'
  | 'kanpoko-karotida'
  | 'eskuineko-subklabioa'
  | 'ezkerreko-subklabioa'
  | 'birika-arteriak'
  | 'hodi-arteriosoa'
  | 'arteria-maxilarra'
  | 'hioide-ointoki';

export interface Fate {
  id: FateId;
  name: string;
  color: string;
  /** Registry structure (for the simulator link). */
  structure?: string;
  /** One line from the notes to remember it by. */
  hook: string;
  /** Notes section. */
  sec: string;
}

export const FATES: Record<FateId, Fate> = {
  'goranzko-aorta': { id: 'goranzko-aorta', name: 'Goranzko aorta', color: '#ffd27a', structure: 'goranzko-aorta', hook: 'Enbor arteriosoa trenkadaz banatzean, aortaren hasierako zatia; aorta zakua goranzko aorta bihurtzen da.', sec: '2.2' },
  'birika-enborra': { id: 'birika-enborra', name: 'Birika enborra', color: '#60a5fa', structure: 'birika-enborra', hook: 'Enbor arteriosoaren beste erdia (trenkadaren ondoren); eskuineko bentrikulutik irteten da eta 6. arkuekin kontaktatzen du.', sec: '2.2.1' },
  'aortaren-makoa': { id: 'aortaren-makoa', name: 'Aortaren makoa', color: '#ff7a59', structure: 'aortaren-makoa', hook: 'Bi zati: hasierakoa zakuaren ezkerreko luzapenetik (lodiagoa), urrutikoa ezkerreko 4. arkutik.', sec: '2.2.2 · 2.3.2' },
  'beheranzko-aorta': { id: 'beheranzko-aorta', name: 'Beheranzko aorta', color: '#e0453a', structure: 'beheranzko-aorta', hook: 'Ezkerreko aorta dortsaletik eta T4tik behera fusionatutako aorta dortsal bakarretik.', sec: '2.4 · 2.5' },
  'enbor-brakiozefalikoa': { id: 'enbor-brakiozefalikoa', name: 'Enbor brakiozefalikoa', color: '#c084fc', structure: 'enbor-brakiozefalikoa', hook: 'Zakuaren eskuineko luzapenetik (estuagoa). BAKARRA dago: ez da "eskuinekoa" edo "ezkerrekoa".', sec: '2.2.2' },
  'karotida-komuna': { id: 'karotida-komuna', name: 'Karotida komuna', color: '#ff9a3c', structure: 'karotida-komuna', hook: '3. arkutik, bi aldeetan berdin.', sec: '2.3.2' },
  'barneko-karotida': { id: 'barneko-karotida', name: 'Barneko karotida', color: '#f472b6', structure: 'barneko-karotida', hook: 'Bi zati: hurbilekoa 3. arkutik, urrutikoa aorta dortsaletik (3. arkuaren gainetik).', sec: '2.3.2' },
  'kanpoko-karotida': { id: 'kanpoko-karotida', name: 'Kanpoko karotida', color: '#fdba74', structure: 'kanpoko-karotida', hook: 'Ez dator arku batetik zuzenean: karotida komunaren kimu (ebaginazio) bat da.', sec: '2.3.2' },
  'eskuineko-subklabioa': { id: 'eskuineko-subklabioa', name: 'Eskuineko subklabioa', color: '#2dd4bf', structure: 'eskuineko-subklabioa', hook: 'Hiru zati: hasierakoa eskuineko 4. arkutik, bitartekoa eskuineko aorta dortsaletik, urrutikoa eskuineko 7. segmentu arteko arteriatik.', sec: '2.3.2' },
  'ezkerreko-subklabioa': { id: 'ezkerreko-subklabioa', name: 'Ezkerreko subklabioa', color: '#22c55e', structure: 'ezkerreko-subklabioa', hook: 'Osoa ezkerreko 7. segmentu arteko arteriatik; garapenean gorago kokatzen da (makotik irten, ezk. karotidatik gertu).', sec: '2.3.2 · 2.4' },
  'birika-arteriak': { id: 'birika-arteriak', name: 'Birika arteriak', color: '#93c5fd', hook: '6. arkuaren hurbileko atala + bertan garatutako hasierako birika arteria, alde bakoitzean.', sec: '2.3.4' },
  'hodi-arteriosoa': { id: 'hodi-arteriosoa', name: 'Hodi arteriosoa → lotailu arteriosoa', color: '#818cf8', structure: 'hodi-arteriosoa', hook: 'Ezkerreko 6. arkuaren urrutiko atala: ezkerreko birika arteria aortarekin lotzen du; jaio ondoren lotailu arteriosoa.', sec: '2.3.4 · 2.4' },
  'arteria-maxilarra': { id: 'arteria-maxilarra', name: 'Arteria maxilarra', color: '#7dd3fc', structure: 'arteria-maxilarra', hook: '1. arkuaren hondarra: ia arku osoa desagertzen da.', sec: '2.1 · 2.3.1' },
  'hioide-ointoki': { id: 'hioide-ointoki', name: 'Hioide azpiko eta ointokiko arteriak', color: '#b9a3ff', structure: 'hioide-arteria', hook: '2. arkuaren atal txikia: hioide azpiko arteria eta ointoki hezurraren arteria.', sec: '2.1 · 2.3.1' },
};

/** The six moments: the notes' sections 2 → 2.4 and birth. */
export const STAGES = [
  { id: 'sistema', title: 'Arku sistema', when: '4. astea', sec: '2', sim: 'arku-sistema' },
  { id: 'e27', title: '27. eguna', when: '4 mm', sec: '2.1', sim: 'eguna-27' },
  { id: 'e29', title: '29. eguna', when: '10 mm', sec: '2.2', sim: 'eguna-29' },
  { id: 'arkuak', title: 'Arkuen garapena', when: '3., 4., 6. arkuak', sec: '2.3', sim: 'hirugarren-arkua' },
  { id: 'beste', title: 'Beste aldaketak', when: 'hodi karotideoak, jaitsiera', sec: '2.4', sim: 'beste-aldaketak' },
  { id: 'heldua', title: 'Jaio ondoren', when: 'patroi heldua', sec: '2.4', sim: 'aorta-heldua' },
] as const;
export const STAGE_COUNT = STAGES.length;

/**
 * A piece's state at one moment: 0 not there, 1 there, 2 going (degenerating, drawn thin), 3 gone (a faint
 * ghost where it was).
 */
export type Life = 0 | 1 | 2 | 3;

export type Side = 'R' | 'L' | 'C';

export interface Seg {
  /** The 2D key; also the 3D model's item key (`k3` when they differ). */
  key: string;
  k3?: string;
  side: Side;
  origin: OriginId;
  /** Its embryonic name. */
  emb: string;
  /** What it becomes ('gone' = it disappears) and from which moment the diagram names it so. */
  fate: FateId | 'gone';
  fateText: string;
  fateFrom: number;
  /** After birth (the ductus → ligament). */
  late?: { from: number; text: string };
  life: readonly [Life, Life, Life, Life, Life, Life];
  sec: string;
  /** The 3D model's name point and structure id for its callout (side letter appended for paired points). */
  p3?: string;
  id3?: string;
}

type Pair = Omit<Seg, 'key' | 'side'> & { R?: Partial<Seg>; L?: Partial<Seg> };

/** A pair of pieces, right and left: the same unless a side overrides. */
const pair = (key: string, base: Pair): Seg[] =>
  (['R', 'L'] as const).map((side) => {
    const { R, L, ...rest } = base;
    const own = side === 'R' ? R : L;
    const k3 = rest.k3;
    return { ...rest, key: `${key}${side}`, side, ...(k3 ? { k3: `${k3}${side}` } : {}), ...own } as Seg;
  });

const ON = [1, 1, 1, 1, 1, 1] as const;

export const SEGS: Seg[] = [
  // ——— the truncus and the aortic sac ———
  { key: 'truncus', side: 'C', origin: 'sac', emb: 'Enbor arteriosoa', fate: 'goranzko-aorta', fateText: 'Trenkadaz bitan banatzen da: goranzko aorta eta birika enborra', fateFrom: 2, life: [1, 1, 0, 0, 0, 0], sec: '1 · 2.2.1', p3: 'enbor-arteriosoa', id3: 'enbor-arteriosoa' },
  { key: 'asc-aorta', side: 'C', origin: 'sac', emb: 'Goranzko aorta', fate: 'goranzko-aorta', fateText: 'Goranzko aorta (aortaren hasierako zatia)', fateFrom: 2, life: [0, 0, 1, 1, 1, 1], sec: '2.2.1', p3: 'goranzko-aorta', id3: 'goranzko-aorta' },
  { key: 'pulm-trunk', side: 'C', origin: 'sac', emb: 'Birika enborra', fate: 'birika-enborra', fateText: 'Birika enborra (eskuineko bentrikulutik)', fateFrom: 2, life: [0, 0, 1, 1, 1, 1], sec: '2.2.1', p3: 'birika-arteria', id3: 'birika-enborra' },
  { key: 'sac', side: 'C', origin: 'sac', emb: 'Aorta zakua', fate: 'goranzko-aorta', fateText: 'Goranzko aorta bihurtzen da', fateFrom: 2, life: ON, sec: '2 · 2.2.2', p3: 'aorta-zakua', id3: 'aorta-zakua' },
  ...pair('horn', {
    origin: 'sac',
    emb: '',
    fate: 'enbor-brakiozefalikoa',
    fateText: '',
    fateFrom: 2,
    life: ON,
    sec: '2.2.2',
    p3: 'luzapena',
    R: { emb: 'Zakuaren eskuineko luzapena (estuagoa)', fateText: 'Enbor brakiozefalikoa (besondo buruetako enborra)', id3: 'enbor-brakiozefalikoa' },
    L: { emb: 'Zakuaren ezkerreko luzapena (lodiagoa)', fate: 'aortaren-makoa', fateText: 'Aortaren makoa · hasierako zatia', id3: 'aortaren-makoa' },
  }),
  // The horns' cranial part, which feeds the 1st and 2nd arches: it goes with them.
  ...pair('cran', { origin: 'sac', emb: 'Luzapenaren goiko zatia (1. eta 2. arkuetara)', fate: 'gone', fateText: '1. eta 2. arkuekin batera desagertzen da', fateFrom: 2, life: [1, 2, 3, 3, 3, 3], sec: '2.2.1' }),

  // ——— the arches ———
  ...pair('a1v', { origin: 'a1', emb: '1. aorta arkua', fate: 'gone', fateText: 'Ia arku osoa desagertzen da', fateFrom: 1, life: [1, 2, 3, 3, 3, 3], sec: '2.1', p3: 'lehen-aorta-arkua', id3: 'lehen-aorta-arkua' }),
  ...pair('a1d', { origin: 'a1', emb: '1. aorta arkua', fate: 'arteria-maxilarra', fateText: 'Arteria maxilarra (geratzen den atal txikia)', fateFrom: 1, life: ON, sec: '2.1 · 2.3.1', p3: 'arteria-maxilarra', id3: 'arteria-maxilarra' }),
  ...pair('a2v', { origin: 'a2', emb: '2. aorta arkua', fate: 'gone', fateText: 'Atal garrantzitsuenak desagertzen dira', fateFrom: 1, life: [1, 2, 3, 3, 3, 3], sec: '2.1', p3: 'bigarren-aorta-arkua', id3: 'bigarren-aorta-arkua' }),
  ...pair('a2d', { origin: 'a2', emb: '2. aorta arkua', fate: 'hioide-ointoki', fateText: 'Hioide azpiko arteria + ointokiko arteria', fateFrom: 1, life: ON, sec: '2.1 · 2.3.1', p3: 'hioide-arteria', id3: 'hioide-arteria' }),
  ...pair('a3cc', { k3: 'a3', origin: 'a3', emb: '3. aorta arkua (hurbileko zatia)', fate: 'karotida-komuna', fateText: 'Karotida komuna', fateFrom: 3, life: ON, sec: '2.3.2', p3: 'karotida-komuna', id3: 'karotida-komuna' }),
  ...pair('a3ica', { k3: 'a3', origin: 'a3', emb: '3. aorta arkua', fate: 'barneko-karotida', fateText: 'Barneko karotida · hurbileko zatia', fateFrom: 3, life: ON, sec: '2.3.2', p3: 'barneko-karotida', id3: 'barneko-karotida' }),
  ...pair('eca', { origin: 'a3', emb: 'Kanpoko karotida (kimua)', fate: 'kanpoko-karotida', fateText: 'Kanpoko karotida: karotida komunaren kimua', fateFrom: 3, life: [0, 0, 0, 1, 1, 1], sec: '2.3.2', p3: 'kanpoko-karotida', id3: 'kanpoko-karotida' }),
  ...pair('a4', {
    origin: 'a4',
    emb: '4. aorta arkua',
    fate: 'eskuineko-subklabioa',
    fateText: '',
    fateFrom: 3,
    life: ON,
    sec: '2.3.2',
    p3: 'laugarren-aorta-arkua',
    R: { fateText: 'Eskuineko subklabioa · hasierako (hurbileko) atala', id3: 'eskuineko-subklabioa' },
    L: { fate: 'aortaren-makoa', fateText: 'Aortaren makoa · urrutiko atala (ezk. karotida komunaren eta ezk. subklabioaren artean)', id3: 'makoaren-urrutiko-atala' },
  }),
  ...pair('a5', { origin: 'a5', emb: '5. aorta arkua', fate: 'gone', fateText: 'Guztiz desagertzen da: ez du ezer sortzen', fateFrom: 1, life: [1, 2, 3, 3, 3, 3], sec: '2.1 · 2.3.3', p3: 'bostgarren-aorta-arkua', id3: 'bostgarren-aorta-arkua' }),
  ...pair('a6p', {
    origin: 'a6',
    emb: '6. aorta arkua (hurbileko zatia)',
    fate: 'birika-arteriak',
    fateText: '',
    fateFrom: 3,
    life: ON,
    sec: '2.3.4',
    R: { fateText: 'Eskuineko birika arteria', p3: 'eskuineko-birika-arteria', id3: 'eskuineko-birika-arteria' },
    L: { fateText: 'Ezkerreko birika arteria', p3: 'ezkerreko-birika-arteria', id3: 'ezkerreko-birika-arteria' },
  }),
  ...pair('pulm', {
    origin: 'a6',
    emb: 'Hasierako birika arteria',
    fate: 'birika-arteriak',
    fateText: '',
    fateFrom: 3,
    life: [0, 1, 1, 1, 1, 1],
    sec: '2.1 · 2.3.4',
    p3: 'hasierako-birika-arteriak',
    id3: 'hasierako-birika-arteriak',
    R: { fateText: 'Eskuineko birika arteria (6. arkuaren hurbileko atalarekin)' },
    L: { fateText: 'Ezkerreko birika arteria (6. arkuaren hurbileko atalarekin)' },
  }),
  ...pair('a6d', {
    origin: 'a6',
    emb: '6. aorta arkua (urrutiko zatia)',
    fate: 'gone',
    fateText: '',
    fateFrom: 3,
    life: ON,
    sec: '2.3.4',
    R: { fateText: 'Desagertzen da', life: [1, 1, 1, 2, 3, 3], p3: 'seigarren-distala-R', id3: 'seigarren-aorta-arkua' },
    L: { fate: 'hodi-arteriosoa', fateText: 'Hodi arteriosoa: ezkerreko birika arteria aortarekin lotzen du', late: { from: 5, text: 'Lotailu arteriosoa (hodi arteriosoa, jaio ondoren)' }, p3: 'hodi-arteriosoa', id3: 'hodi-arteriosoa' },
  }),

  // ——— the dorsal aortas ———
  ...pair('daCran', { origin: 'da', emb: 'Aorta dortsala (3. arkuaren gainetik)', fate: 'barneko-karotida', fateText: 'Barneko karotida · urrutiko zatia', fateFrom: 3, life: ON, sec: '2.3.2', p3: 'aorta-dortsalak-cran', id3: 'barneko-karotida' }),
  ...pair('daDuct', { origin: 'da', emb: 'Aorta dortsala (3. eta 4. arkuen artean)', fate: 'gone', fateText: 'Hodi karotideoa: desagertzen da', fateFrom: 4, life: [1, 1, 1, 1, 2, 3], sec: '2.4', p3: 'hodi-karotideoa', id3: 'hodi-karotideoa' }),
  ...pair('daMid', {
    origin: 'da',
    emb: 'Aorta dortsala (4. arkutik 7. segmentu arteko arteriara)',
    fate: 'eskuineko-subklabioa',
    fateText: '',
    fateFrom: 3,
    life: ON,
    sec: '2.3.2 · 2.4',
    p3: 'aorta-dortsalak',
    R: { fateText: 'Eskuineko subklabioa · bitarteko atala', id3: 'eskuineko-subklabioa' },
    L: { fate: 'beheranzko-aorta', fateFrom: 4, fateText: 'Beheranzko aorta (ezkerreko aorta dortsaletik)', id3: 'beheranzko-aorta' },
  }),
  ...pair('is7', {
    origin: 'is7',
    emb: '7. segmentu arteko arteria',
    fate: 'eskuineko-subklabioa',
    fateText: '',
    fateFrom: 3,
    life: [0, 0, 0, 1, 1, 1],
    sec: '2.3.2 · 2.5.3',
    p3: 'zazpigarren-segmentu-arteko-arteria',
    R: { fateText: 'Eskuineko subklabioa · urrutiko atala', id3: 'eskuineko-subklabioa' },
    L: { fate: 'ezkerreko-subklabioa', fateText: 'Ezkerreko subklabioa osoa (gero gorago kokatzen da)', id3: 'ezkerreko-subklabioa' },
  }),
  ...pair('daLow', {
    origin: 'da',
    emb: 'Aorta dortsala (7. segmentu artekotik fusiora)',
    fate: 'beheranzko-aorta',
    fateText: 'Beheranzko aorta',
    fateFrom: 4,
    life: ON,
    sec: '2.4',
    p3: 'aorta-dortsalak-low',
    id3: 'aorta-dortsalak',
    R: { fate: 'gone', fateText: 'Desagertzen da: beraz beheranzko aorta ezkerreko aorta dortsaletik eratzen da', life: [1, 1, 1, 1, 2, 3] },
  }),
  { key: 'fused', side: 'C', origin: 'da', emb: 'Aorta dortsal bakarra (T4tik behera fusionatuta)', fate: 'beheranzko-aorta', fateText: 'Beheranzko aorta', fateFrom: 4, life: ON, sec: '2 · 2.5', p3: 'aorta-dortsal-bakarra', id3: 'beheranzko-aorta' },
];

export const SEG = new Map(SEGS.map((s) => [s.key, s]));

/** The 3D model's items for a piece (the sac is no tube of its own there: the truncus top, then the ascending aorta). */
export const items3Of = (s: Seg): string[] => (s.key === 'sac' ? ['truncus', 'asc-aorta'] : [s.k3 ?? s.key]);

/** The piece's state at a moment. */
export const lifeAt = (s: Seg, stage: number): Life => s.life[Math.max(0, Math.min(STAGE_COUNT - 1, stage))];
/** Drawn at all (there, going, or a ghost). */
export const drawnAt = (s: Seg, stage: number) => lifeAt(s, stage) > 0;
/** Present as a vessel (not gone). */
export const aliveAt = (s: Seg, stage: number) => lifeAt(s, stage) === 1 || lifeAt(s, stage) === 2;
/** Its name at a moment: the embryonic one until it has become its derivative. */
export function nameAt(s: Seg, stage: number): string {
  if (s.late && stage >= s.late.from) return s.late.text;
  return stage >= s.fateFrom && s.fate !== 'gone' ? s.fateText : s.emb;
}
/** Its state changed at this moment (it appeared, began to go, or went). */
export const changedAt = (s: Seg, stage: number) => stage > 0 && lifeAt(s, stage) !== lifeAt(s, stage - 1);

const sideWord = { R: 'eskuinekoa', L: 'ezkerrekoa', C: '' } as const;
export const originText = (s: Seg) => `${ORIGINS[s.origin].name}${s.side === 'C' ? '' : `, ${sideWord[s.side]}`}`;

/** The pieces of one adult artery (one side when the two sides differ). */
export function partsOf(fate: FateId, side?: Side): Seg[] {
  return SEGS.filter((s) => s.fate === fate && (!side || s.side === side || s.side === 'C'));
}

/** What changes at each moment, in the notes' words; each line lights its pieces. */
export const CHANGES: { text: string; keys: string[] }[][] = [
  [
    { text: 'Enbor arteriosoaren urrutiko atala (aorta zakua) bi luzapenetan jarraitzen da.', keys: ['sac', 'hornR', 'hornL'] },
    { text: 'Zeharkako tolespenaren ondorioz, bi aorta dortsalak zakuaren luzapenekin komunikatzen dira: komunikazio horiek aorta arkuak dira.', keys: ['a1vR', 'a1vL', 'a3icaR', 'a3icaL', 'a4R', 'a4L', 'a6dR', 'a6dL'] },
    { text: '6 bikote garatzen dira, kronologikoki (bata bestearen ondoren, arku faringeoekin batera, zefalikotik kaudalera): eskemak denak batera erakusten ditu.', keys: [] },
    { text: 'Aorta dortsalak T4tik behera fusionatzen dira: aorta dortsal bakarra. Alde zefalikoan banatuta jarraitzen dute.', keys: ['fused', 'daLowR', 'daLowL'] },
  ],
  [
    { text: '1. arkua poliki endekatzen da; geratzen den atal txikitik arteria maxilarrak.', keys: ['a1vR', 'a1vL', 'a1dR', 'a1dL'] },
    { text: '2. arkuan antzera: atal txikitik hioide azpiko eta ointokiko arteriak.', keys: ['a2vR', 'a2vL', 'a2dR', 'a2dL'] },
    { text: '3. arkuak agertu eta tamaina handia hartzen dute; 4. bikotea agertzen hasten da.', keys: ['a3ccR', 'a3ccL', 'a3icaR', 'a3icaL', 'a4R', 'a4L'] },
    { text: '5.a ez da guztiz garatzen eta denbora gutxitan desagertzen da (askotan ez da agertzen).', keys: ['a5R', 'a5L'] },
    { text: '6.a garatzen hasten da: hasierako birika arteriak, enbor arteriosotik sortutako birika enborrarekin kontaktatuko dutenak.', keys: ['a6pR', 'a6pL', 'a6dR', 'a6dL', 'pulmR', 'pulmL'] },
  ],
  [
    { text: '1. eta 2. arkuak guztiz desagertu dira (hondarrak geratzen dira).', keys: ['a1vR', 'a1vL', 'a2vR', 'a2vL', 'cranR', 'cranL', 'a1dR', 'a1dL', 'a2dR', 'a2dL'] },
    { text: '3. eta 4. aorta arkuak tamainaz handitzen dira; 5.ak oso azkar desagertzen dira.', keys: ['a3ccR', 'a3ccL', 'a3icaR', 'a3icaL', 'a4R', 'a4L', 'a5R', 'a5L'] },
    { text: 'Trenkadaz, enbor arteriosoa bitan banatzen da: goranzko aorta eta birika enborra. 6. arkuak birika enborrarekin kontaktatzen du.', keys: ['asc-aorta', 'pulm-trunk', 'a6pR', 'a6pL'] },
    { text: 'Aorta zakua goranzko aorta bihurtzen da; luzapenak ez dira simetrikoak: ezkerrekoa (lodiagoa) → makoaren hasierako zatia, eskuinekoa (estuagoa) → enbor brakiozefalikoa.', keys: ['sac', 'hornR', 'hornL'] },
  ],
  [
    { text: '3. arkuak: karotida komunak eta barneko karotiden hurbileko zatia (bi aldeetan berdin).', keys: ['a3ccR', 'a3ccL', 'a3icaR', 'a3icaL'] },
    { text: 'Aorta dortsalen alde kranealetik (3. arkuaren gainetik), barneko karotiden urrutiko atala.', keys: ['daCranR', 'daCranL'] },
    { text: 'Kanpoko karotidak karotida komunaren kimu gisa garatzen dira.', keys: ['ecaR', 'ecaL'] },
    { text: 'Ezkerreko 4. arkua → makoaren urrutiko atala. Eskuineko 4. arkua → eskuineko subklabioaren hasierako atala.', keys: ['a4R', 'a4L'] },
    { text: 'Eskuineko subklabioa: 4. arkua + eskuineko aorta dortsala + eskuineko 7. segmentu arteko arteria. Ezkerrekoa: ezkerreko 7. segmentu arteko arteria osoa.', keys: ['a4R', 'daMidR', 'is7R', 'is7L'] },
    { text: '6. arkuak: hurbileko atala + hasierako birika arteria → birika arteriak. Ezkerreko urrutikoa → hodi arteriosoa; eskuineko urrutikoa desagertzen da.', keys: ['a6pR', 'a6pL', 'pulmR', 'pulmL', 'a6dR', 'a6dL'] },
  ],
  [
    { text: 'III. eta IV. arkuen arteko aorta dortsalaren atalak desagertzen dira: hodi karotideoak.', keys: ['daDuctR', 'daDuctL'] },
    { text: 'Eskuineko 7. segmentu arteko arteriaren eta aorta dortsal komunaren arteko atala desagertzen da: beheranzko aorta ezkerreko aorta dortsaletik eratzen da.', keys: ['daLowR', 'daLowL', 'daMidL', 'fused'] },
    { text: 'Bihotza lepotik toraxera jaisten da: karotida komunak eta arteria brakiozefalikoa asko luzatzen dira (3D ereduan ikusten da).', keys: ['hornR', 'a3ccR', 'a3ccL'] },
    { text: 'Ezkerreko subklabioak jatorria aldatzen du eta askoz gorago kokatzen da: aortaren makotik irtengo da (3D ereduan ikusten da).', keys: ['is7L'] },
  ],
  [
    { text: 'Jaio ondoren, hodi arteriosoa lotailu bihurtzen da: lotailu arteriosoa.', keys: ['a6dL'] },
    { text: 'Makotik: enbor brakiozefalikoa (eskuineko karotida komuna + eskuineko subklabioa), ezkerreko karotida komuna, ezkerreko subklabioa.', keys: ['hornR', 'a3ccL', 'is7L'] },
    { text: 'Goranzko aorta → makoa → beheranzko aorta: toraxetik jaitsi, diafragma zeharkatu eta abdomenera.', keys: ['asc-aorta', 'hornL', 'a4L', 'daMidL', 'daLowL', 'fused'] },
  ],
];

/** Structures to pick and explore (2D and 3D): embryonic ones and adult arteries. */
export interface Pick {
  id: string;
  label: string;
  keys: string[];
  /** The moment it is best seen at, when it is not there at the current one. */
  stage: number;
  group: 'enbrioia' | 'heldua';
}

const keysOf = (fate: FateId) => partsOf(fate).map((s) => s.key);

export const PICKS: Pick[] = [
  { id: 'enbor-arteriosoa', label: 'Enbor arteriosoa', keys: ['truncus'], stage: 1, group: 'enbrioia' },
  { id: 'aorta-zakua', label: 'Aorta zakua', keys: ['sac'], stage: 1, group: 'enbrioia' },
  { id: 'luzapenak', label: 'Zakuaren luzapenak', keys: ['hornR', 'hornL', 'cranR', 'cranL'], stage: 0, group: 'enbrioia' },
  { id: 'aorta-dortsalak', label: 'Aorta dortsalak', keys: ['daCranR', 'daCranL', 'daDuctR', 'daDuctL', 'daMidR', 'daMidL', 'daLowR', 'daLowL', 'fused'], stage: 0, group: 'enbrioia' },
  ...(['1', '2', '3', '4', '5', '6'] as const).map((n, i) => ({
    id: `arkua-${n}`,
    label: `${n}. arkua`,
    keys: SEGS.filter((s) => s.origin === (`a${n}` as OriginId) && !s.key.startsWith('eca') && !s.key.startsWith('pulm')).map((s) => s.key),
    stage: i < 2 ? 0 : i === 4 ? 0 : 1,
    group: 'enbrioia' as const,
  })),
  { id: 'hasierako-birika-arteriak', label: 'Hasierako birika arteriak', keys: ['pulmR', 'pulmL'], stage: 1, group: 'enbrioia' },
  { id: 'segmentu-arteko-7', label: '7. segmentu arteko arteriak', keys: ['is7R', 'is7L'], stage: 3, group: 'enbrioia' },
  { id: 'hodi-karotideoak', label: 'Hodi karotideoak', keys: ['daDuctR', 'daDuctL'], stage: 3, group: 'enbrioia' },
  { id: 'goranzko-aorta', label: 'Goranzko aorta', keys: ['asc-aorta', 'sac'], stage: 5, group: 'heldua' },
  { id: 'aortaren-makoa', label: 'Aortaren makoa', keys: keysOf('aortaren-makoa'), stage: 5, group: 'heldua' },
  { id: 'beheranzko-aorta', label: 'Beheranzko aorta', keys: keysOf('beheranzko-aorta'), stage: 5, group: 'heldua' },
  { id: 'enbor-brakiozefalikoa', label: 'Enbor brakiozefalikoa', keys: keysOf('enbor-brakiozefalikoa'), stage: 5, group: 'heldua' },
  { id: 'karotida-komuna', label: 'Karotida komunak', keys: keysOf('karotida-komuna'), stage: 5, group: 'heldua' },
  { id: 'barneko-karotida', label: 'Barneko karotidak', keys: keysOf('barneko-karotida'), stage: 5, group: 'heldua' },
  { id: 'kanpoko-karotida', label: 'Kanpoko karotidak', keys: keysOf('kanpoko-karotida'), stage: 5, group: 'heldua' },
  { id: 'eskuineko-subklabioa', label: 'Eskuineko subklabioa', keys: keysOf('eskuineko-subklabioa'), stage: 5, group: 'heldua' },
  { id: 'ezkerreko-subklabioa', label: 'Ezkerreko subklabioa', keys: keysOf('ezkerreko-subklabioa'), stage: 5, group: 'heldua' },
  { id: 'birika-enborra', label: 'Birika enborra', keys: ['pulm-trunk'], stage: 5, group: 'heldua' },
  { id: 'birika-arteriak', label: 'Birika arteriak', keys: keysOf('birika-arteriak'), stage: 5, group: 'heldua' },
  { id: 'hodi-arteriosoa', label: 'Hodi / lotailu arteriosoa', keys: ['a6dL'], stage: 3, group: 'heldua' },
  { id: 'arteria-maxilarra', label: 'Arteria maxilarrak', keys: ['a1dR', 'a1dL'], stage: 5, group: 'heldua' },
  { id: 'hioide-ointoki', label: 'Hioide azpiko eta ointokiko arteriak', keys: ['a2dR', 'a2dL'], stage: 5, group: 'heldua' },
];

/** The arch-by-arch table, in the notes' words (rows: origin; columns: right, left). */
export const TABLE: { origin: OriginId | 'sac'; label: string; right: string; left: string; both?: string; note?: string; keys: string[] }[] = [
  { origin: 'sac', label: 'Aorta zakua · enbor arteriosoa', right: 'Eskuineko luzapena (estuagoa) → enbor brakiozefalikoa', left: 'Ezkerreko luzapena (lodiagoa) → aortaren makoaren hasierako zatia', note: 'Zakua → goranzko aorta; enbor arteriosoa, trenkadaz → goranzko aorta + birika enborra', keys: ['sac', 'hornR', 'hornL', 'asc-aorta', 'pulm-trunk'] },
  { origin: 'a1', label: '1. arkua', right: '', left: '', both: 'Arteria maxilarra (ia arku osoa desagertzen da)', keys: ['a1dR', 'a1dL', 'a1vR', 'a1vL'] },
  { origin: 'a2', label: '2. arkua', right: '', left: '', both: 'Hioide azpiko arteria + ointokiko arteria', keys: ['a2dR', 'a2dL', 'a2vR', 'a2vL'] },
  { origin: 'a3', label: '3. arkua', right: '', left: '', both: 'Karotida komuna + barneko karotidaren hurbileko zatia', note: 'Kanpoko karotida = karotida komunaren kimua', keys: ['a3ccR', 'a3ccL', 'a3icaR', 'a3icaL', 'ecaR', 'ecaL'] },
  { origin: 'a4', label: '4. arkua', right: 'Eskuineko subklabioaren hasierako (hurbileko) atala', left: 'Aortaren makoaren urrutiko atala', keys: ['a4R', 'a4L'] },
  { origin: 'a5', label: '5. arkua', right: '', left: '', both: 'Ezer ez: guztiz desagertzen da', keys: ['a5R', 'a5L'] },
  { origin: 'a6', label: '6. arkua', right: 'Hurbilekoa (+ hasierako birika a.) → eskuineko birika arteria · urrutikoa desagertzen da', left: 'Hurbilekoa (+ hasierako birika a.) → ezkerreko birika arteria · urrutikoa → hodi arteriosoa → lotailu arteriosoa', keys: ['a6pR', 'a6pL', 'pulmR', 'pulmL', 'a6dR', 'a6dL'] },
  { origin: 'da', label: 'Aorta dortsalak', right: '3.aren gainetik → barneko karotida (urrutikoa) · 3.–4. → desagertu · 4.tik 7. segm.-ra → esk. subklabioaren bitarteko atala · 7.tik fusiora → desagertu', left: '3.aren gainetik → barneko karotida (urrutikoa) · 3.–4. → desagertu · 4.tik behera → beheranzko aorta', note: 'T4tik behera fusionatuta → beheranzko aorta', keys: ['daCranR', 'daCranL', 'daDuctR', 'daDuctL', 'daMidR', 'daMidL', 'daLowR', 'daLowL', 'fused'] },
  { origin: 'is7', label: '7. segmentu arteko a.', right: 'Eskuineko subklabioaren urrutiko atala', left: 'Ezkerreko subklabioa osoa (gero gorago, makora)', keys: ['is7R', 'is7L'] },
];

/** What disappears, and why it matters. */
export const GONE: { what: string; when: string; why: string; keys: string[]; stage: number }[] = [
  { what: '1. eta 2. arkuak (hondar txikiak izan ezik)', when: '27.–29. eguna', why: 'Hondarretatik arteria maxilarra (1.) eta hioide azpiko + ointokiko arteriak (2.).', keys: ['a1vR', 'a1vL', 'a2vR', 'a2vL', 'cranR', 'cranL'], stage: 2 },
  { what: '5. arkuak, osorik', when: '27.–29. eguna', why: 'Ez dute ezer sortzen (5. arku faringeoekin gauza bera). Askotan ez dira agertu ere egiten.', keys: ['a5R', 'a5L'], stage: 2 },
  { what: 'Eskuineko 6. arkuaren urrutiko atala', when: 'Arkuen garapena', why: 'Horregatik eskuineko nerbio atzerakaria gorago igotzen da, 4. arkura (subklabioa).', keys: ['a6dR'], stage: 4 },
  { what: 'Hodi karotideoak (aorta dortsala, III. eta IV. arkuen artean)', when: 'Beste aldaketak', why: 'Karotidak eta makoa ez daude aorta dortsalaren bidez lotuta.', keys: ['daDuctR', 'daDuctL'], stage: 5 },
  { what: 'Eskuineko aorta dortsalaren atala (eskuineko 7. segm. arteriaren eta aorta dortsal komunaren artean)', when: 'Beste aldaketak', why: 'Ezkerreko aorta bakarrik geratzen da: beheranzko aorta ezkerreko aorta dortsaletik.', keys: ['daLowR'], stage: 5 },
];

/** Mix-ups the notes warn about (or that the topic invites). */
export const PITFALLS: { wrong: string; right: string; keys?: string[] }[] = [
  { wrong: '"Eskuineko enbor brakiozefalikoa"', right: 'Enbor brakiozefalikoa BAKARRA da (eskuinean): ez jarri eskumakoa/ezkerrekoa.', keys: ['hornR'] },
  { wrong: 'Ezkerreko subklabioa 4. arkutik', right: 'Ezkerreko subklabioa osoa ezkerreko 7. segmentu arteko arteriatik; ezkerreko 4. arkua makoaren urrutiko atala da.', keys: ['is7L', 'a4L'] },
  { wrong: 'Eskuineko subklabioa = 4. arkua', right: 'Hiru zati: 4. arkua (hurbilekoa) + eskuineko aorta dortsala (bitartekoa) + eskuineko 7. segm. arteria (urrutikoa).', keys: ['a4R', 'daMidR', 'is7R'] },
  { wrong: 'Kanpoko karotida 3. arkutik', right: 'Kanpoko karotida karotida komunaren kimua da; barneko karotida bi zatitan (3. arkua + aorta dortsala).', keys: ['ecaR', 'ecaL', 'a3icaR', 'daCranR'] },
  { wrong: '5. arkuak zerbait ematen du', right: '5. arkua guztiz desagertzen da eta ez du ezer sortzen.', keys: ['a5R', 'a5L'] },
  { wrong: 'Beheranzko aorta eskuineko aorta dortsaletik', right: 'Eskuineko atala desagertzen da: beheranzko aorta ezkerreko aorta dortsaletik (eta T4tik beherako aorta bakarretik).', keys: ['daLowR', 'daMidL', 'daLowL', 'fused'] },
  { wrong: 'Goiko gorputz adarreko arteriak subklabioetatik datoz', right: 'Ardatz arteria sistematik sortzen dira; subklabioak haiekin konektatu bakarrik egiten dira.' },
  { wrong: 'Zilbor arteriek beti aortatik irteten dute', right: 'Aortarekin duten kontaktua galtzen dute eta barneko arteria iliakoarekin konektatzen dira.' },
];
