import type { ComponentType } from 'react';

/** Props every scene receives. Scenes are pure functions of `t` so scrubbing is deterministic. */
export interface SceneProps {
  /** Local progress of the stage, 0..1. */
  t: number;
  /** True when the user prefers reduced motion; skip decorative ambient loops. */
  reduced: boolean;
}

export type SceneComponent = ComponentType<SceneProps>;

/** How the viewer is looking at the specimen. Drives the plane icon and the orientation compass. */
export type PlaneKind =
  | 'sagitala'
  | 'zeharkakoa'
  | 'koronala'
  | 'dortsala'
  | 'kanpokoa'
  | 'xehetasuna'
  | 'eskema';

/** Anatomical direction shown on each edge of the viewport. Omit an edge to hide it. */
export interface Orientation {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface ViewDef {
  id: string;
  /** Short Basque tab label, e.g. "Mozketa sagitala". */
  label: string;
  plane: PlaneKind;
  /** One sentence: what this perspective shows and where the cut is. */
  description: string;
  orientation?: Orientation;
  scene: SceneComponent;
}

/** A narrative caption active from `at` until the next beat. `focus` highlights structures while active. */
export interface Beat {
  at: number;
  text: string;
  focus?: string[];
}

export interface SourceRef {
  file: string;
  section: string;
}

export interface StageDef {
  id: string;
  /** Short day chip: "0. eguna", "8. eguna", "15–16. egunak". */
  day: string;
  /** Development days covered, used on the global day ruler. */
  dayRange: [number, number];
  title: string;
  subtitle?: string;
  /** Optional one-paragraph preview of what the stage shows (defaults to the view description). */
  intro?: string;
  /** Playback seconds at 1x. */
  duration: number;
  views: ViewDef[];
  beats: Beat[];
  /** Structure ids that appear in this stage (quiz pool + structure list). */
  structures: string[];
  /** Exam-oriented summary bullets, faithful to the notes. */
  keyPoints: string[];
  /** "KONTUZ" traps the notes warn about. */
  cautions?: string[];
  /** Marks content the notes exclude from the exam. */
  optional?: boolean;
  source: SourceRef;
}

export type StructureCategory =
  | 'ektodermoa'
  | 'mesodermoa'
  | 'endodermoa'
  | 'enbrioi-kanpokoa'
  | 'trofoblastoa'
  | 'enbrioblastoa'
  | 'amarena'
  | 'barrunbea'
  | 'gametoa'
  | 'anatomia'
  | 'prozesua'
  | 'ardatza';

export interface StructureDef {
  id: string;
  /** Basque name exactly as in the notes. */
  name: string;
  /** Spanish equivalent (secondary, for recognition only). */
  es?: string;
  /** Other Basque names the notes use for the same thing. */
  aka?: string[];
  category: StructureCategory;
  /** Swatch colour; defaults to the category colour. */
  color?: string;
  definition: string;
  location?: string;
  origin?: string;
  fate?: string;
  caution?: string;
  related?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  stageId?: string;
}

export interface WeekDef {
  week: 1 | 2 | 3 | 4 | 5 | 6;
  slug: string;
  title: string;
  subtitle: string;
  dayRange: [number, number];
  /** How the span is written when days are not a natural unit (e.g. the fetal period). */
  span?: { long: string; short: string };
  stages: StageDef[];
  structures: StructureDef[];
  quiz: QuizQuestion[];
  source: SourceRef;
}
