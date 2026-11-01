/** Types and builders shared by the integrated-scheme data files (grid-schemes*.ts). */

/** Colour family of a column or a single cell. */
export type Tone = 'jatorria' | 'kokapena' | 'begia' | 'arkua' | 'mihia' | 'muskulua' | 'nerbioa' | 'arteria' | 'aldaketa' | 'ondorioa' | 'neutral';

export interface GridColumn {
  label: string;
  tone: Tone;
  /** Relative width (fr); 1 by default. */
  w?: number;
}

export interface GridCell {
  text: string;
  note?: string;
  /** Rows this cell covers, downwards (the rows below hold `null` in this column). */
  span?: number;
  /** Columns this cell covers, rightwards (the next cells in this row are `null`): the same on both sides. */
  cols?: number;
  /** Overrides the column's colour (eye / arch / tongue places). */
  tone?: Tone;
  /** It disappears: drawn muted and struck. */
  gone?: boolean;
  /** A real displacement (migrates / moves up). */
  move?: boolean;
}

export interface GridRow {
  /** One entry per column; `null` where a cell above spans into this row. */
  cells: (GridCell | null)[];
  /** Filter keys this row belongs to. */
  tags?: string[];
}

export interface GridScheme {
  id: string;
  week: number;
  /** Notes section(s) this grid stands for. */
  section: string;
  title: string;
  lead?: string;
  /** Simulator stage that shows it. */
  stage?: string;
  /** Read left to right as a path (arrows between columns); otherwise a comparison table. */
  path: boolean;
  columns: GridColumn[];
  rows: GridRow[];
  /** Row filters: show only the rows with this tag. */
  filters?: { tag: string; label: string; tone?: Tone }[];
  /** Short traps, from the notes. */
  pitfalls?: string[];
  links?: { href: string; label: string }[];
  /** Notes mark the section as not required. */
  optional?: boolean;
}

export const c = (text: string, extra?: Omit<GridCell, 'text'>): GridCell => ({ text, ...extra });
export const r = (cells: (GridCell | string | null)[], tags?: string[]): GridRow => ({ cells: cells.map((x) => (typeof x === 'string' ? c(x) : x)), tags });
