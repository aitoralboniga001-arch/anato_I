/** Shared study-room contract. Geometry, content and future 3D use these stable piece keys. */
export type Life = 0 | 1 | 2 | 3;
export type ColourMode = 'origin' | 'fate';
export interface Origin {
  name: string;
  short: string;
  color: string;
}
export interface Fate {
  name: string;
  color: string;
  structure?: string;
  hook: string;
}
export interface Piece {
  key: string;
  side: 'R' | 'L' | 'C';
  origin: string;
  emb: string;
  fate: string;
  fateText: string;
  fateFrom?: number;
  late?: { from: number; text: string };
  /** Only temporal topics have lives; matrix topics leave this absent. */
  life?: readonly Life[];
  sec: string;
  /** Auditable sentence ids in the supplied notes. */
  source: string[];
  id3?: string;
}
export interface Moment {
  id: string;
  title: string;
  when: string;
  sim: string;
  sec: string;
}
export interface Keyed {
  keys: string[];
  stage: number;
}
export interface Pick extends Keyed {
  id: string;
  label: string;
  group: 'enbrioia' | 'heldua';
  detail?: boolean;
}
export interface TableRow extends Keyed {
  id: string;
  origin: string;
  label: string;
  cells: string[];
  note?: string;
}
export interface Gone extends Keyed {
  what: string;
  when: string;
  why: string;
}
export interface Pitfall extends Keyed {
  wrong: string;
  right: string;
}
export interface StudyCard {
  id: string;
  tag: string;
  q: string;
  a: string;
  keys?: string[];
  stage?: number;
  source?: string[];
}
export interface RoomData {
  week: number;
  title: string;
  lead: string;
  schemaTitle: string;
  origins: Record<string, Origin>;
  fates: Record<string, Fate>;
  pieces: Piece[];
  stages: Moment[];
  changes: { text: string; keys: string[] }[][];
  picks: Pick[];
  columns: string[];
  table: TableRow[];
  composites: { fate: string; keys: string[]; stage: number }[];
  gone: Gone[];
  pitfalls: Pitfall[];
  overview: { title: string; sec: string; text: string; out: string }[];
  /** A categorical schema uses stages as views, without pretending tissue disappears. */
  categorical?: boolean;
}
export const lifeAt = (p: Piece, stage: number): Life => p.life?.[Math.max(0, Math.min(p.life.length - 1, stage))] ?? 1;
export const aliveAt = (p: Piece, stage: number) => [1, 2].includes(lifeAt(p, stage));
export const drawnAt = (p: Piece, stage: number) => lifeAt(p, stage) !== 0;
export const changedAt = (p: Piece, stage: number) =>
  stage > 0 && (lifeAt(p, stage) !== lifeAt(p, stage - 1) || p.fateFrom === stage || p.late?.from === stage);
export const nameAt = (p: Piece, stage: number) =>
  p.late && stage >= p.late.from ? p.late.text : stage >= (p.fateFrom ?? Infinity) && p.fate !== 'gone' ? p.fateText : p.emb;
export const colourOf = (p: Piece, mode: ColourMode, d: { origins: RoomData['origins']; fates: RoomData['fates'] }) =>
  mode === 'origin' ? d.origins[p.origin].color : p.fate === 'gone' ? '#77737f' : d.fates[p.fate].color;
export const originText = (p: Piece, d: RoomData) =>
  `${d.origins[p.origin].name}${p.side === 'C' ? '' : p.side === 'R' ? ' · eskuinekoa' : ' · ezkerrekoa'}`;
export const partsOf = (d: RoomData, fate: string) => d.pieces.filter((p) => p.fate === fate);
/** Find a structure under its embryonic name, derivative, later remnant or source synonym. */
export function pickMatches(d: RoomData, pick: Pick, query: string): boolean {
  const names = [
    pick.label,
    ...pick.keys.flatMap((key) => {
      const p = d.pieces.find((p) => p.key === key);
      return p ? [p.emb, p.fateText, p.late?.text ?? '', d.origins[p.origin].name, d.fates[p.fate]?.name ?? ''] : [];
    }),
  ];
  return names.join(' · ').toLocaleLowerCase('eu').includes(query.trim().toLocaleLowerCase('eu'));
}

/** Derive explorer, table and composites from the very same records the diagram reads. */
export function derive(d: Omit<RoomData, 'picks' | 'table' | 'composites' | 'columns'>): RoomData {
  const last = d.stages.length - 1;
  const best = (p: Piece) => Math.max(0, p.life ? p.life.findLastIndex((l) => l === 1 || l === 2) : last);
  return {
    ...d,
    columns: ['Eratorria / patua', 'Apunteak'],
    picks: [
      ...Object.entries(d.origins).map(([id, o]) => {
        const ps = d.pieces.filter((p) => p.origin === id);
        const stage = d.stages.findIndex((_, i) => ps.every((p) => aliveAt(p, i)));
        return {
          id: `origin-${id}`,
          label: o.name,
          keys: ps.map((p) => p.key),
          stage: stage < 0 ? best(ps[0]) : stage,
          group: 'enbrioia' as const,
        };
      }),
      ...d.pieces
        .filter((p) => d.pieces.filter((s) => s.origin === p.origin).length > 1)
        .map((p) => ({ id: `piece-${p.key}`, label: p.emb, keys: [p.key], stage: best(p), group: 'enbrioia' as const, detail: true })),
      ...Object.entries(d.fates).map(([id, f]) => ({
        id,
        label: f.name,
        keys: d.pieces.filter((p) => p.fate === id).map((p) => p.key),
        stage: last,
        group: 'heldua' as const,
      })),
    ],
    table: d.pieces.map((p) => ({
      id: p.key,
      origin: p.origin,
      label: p.emb,
      cells: [p.fateText + (p.late ? ` → ${p.late.text}` : ''), p.sec],
      keys: [p.key],
      stage: best(p),
    })),
    composites: Object.keys(d.fates)
      .map((fate) => ({ fate, keys: d.pieces.filter((p) => p.fate === fate).map((p) => p.key), stage: last }))
      .filter((c) => c.keys.length > 0),
  };
}
