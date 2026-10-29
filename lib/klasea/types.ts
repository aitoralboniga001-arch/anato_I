/**
 * A class ("Modu gidatua" with Kimu as teacher): a short spoken lecture over a topic's existing stages,
 * views and camera moves, covering only the core of the notes. Every line, board cell and check cites
 * the notes sentences it rests on (tests/klasea.test.ts holds them to those sentences).
 */

export type Tone = 'explain' | 'emphasis' | 'caution' | 'why' | 'recall' | 'summary';

export interface Line {
  /** Spoken Basque, short and written for the ear; the subtitle shows it too. */
  say: string;
  /** "Ez dut ulertu": the same facts in simpler words. */
  plain?: string;
  /** Notes sentence ids (week-prefixed) this line rests on. */
  notes: string[];
  /** Stage this line is shown in, when not the chunk's. */
  stage?: string;
  /** View to show (defaults to the view of the step at `at`, else the chunk's). */
  view?: string;
  /** Stage time (0..1) the scene glides to before the line is said. */
  at?: number;
  /** Structures lit while it is said; each lights, shows its name and is pointed at as the voice names it. */
  focus?: string[];
  /**
   * Where the line names a lit structure, when its names alone do not find it (a pronoun, an elided
   * name): id → the words as `say` (or `plain`) has them. Unnamed ones are lit from the line's start.
   */
  cues?: Record<string, string>;
  tone?: Tone;
  /** Board item (line or table cell id) written in once the line has been said. */
  writes?: string;
  /** Silent seconds to watch the scene after the line. */
  hold?: number;
}

export interface BoardLine {
  id: string;
  kind: 'line';
  text: string;
  notes: string[];
  /** Highlighted as a key point. */
  key?: boolean;
}

export interface BoardTable {
  id: string;
  kind: 'table';
  head: string[];
  rows: { id: string; cells: string[]; notes: string[]; structures: string[] }[];
}

export type BoardItem = BoardLine | BoardTable;

interface CheckBase {
  /** Asked after this line of the chunk (index); defaults to the chunk's end. */
  after?: number;
}

export interface ChoiceCheck extends CheckBase {
  q: string;
  options: string[];
  answer: number;
  /** One short reason per option. */
  why: string[];
  notes: string[];
}

/** Asked before it is shown: a guess, never recorded as an answer. */
export interface PredictCheck extends ChoiceCheck { kind: 'predict' }
/** Two look-alikes set against each other. */
export interface ContrastCheck extends ChoiceCheck { kind: 'contrast'; id: string; concept?: string }
/** One structure lit with its name hidden; the student picks the name. */
export interface SpotCheck extends CheckBase { kind: 'zer-da-hau'; structure: string; options: string[]; notes: string[] }
/** Chips put in order; each placed chip lights its structure. */
export interface OrderCheck extends CheckBase { kind: 'order'; id: string; q: string; items: { label: string; structure: string }[]; notes: string[] }
/** Cells of a board table blanked and slotted back from memory. */
export interface FillCheck extends CheckBase { kind: 'fill'; id: string; table: string; blanks: string[] }
/** A question of the reviewed pool (or a step's own micro-question, by its pool id). */
export interface PoolCheck extends CheckBase { kind: 'pool'; id: string }

export type Check = PredictCheck | ContrastCheck | SpotCheck | OrderCheck | FillCheck | PoolCheck;

export interface Chunk {
  id: string;
  /** Board heading and chunk-menu entry. */
  title: string;
  stage: string;
  view?: string;
  lines: Line[];
  board?: BoardItem[];
  checks?: Check[];
}

export interface Lesson {
  week: number;
  title: string;
  /** "Gaur": what the class is for, written on the board first. */
  goals: string[];
  /** In order. The first one opens the class (goals, pre-question); the last one closes it (table, exit quiz). */
  chunks: Chunk[];
}
