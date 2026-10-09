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
  /** The scene dims its own context per step (tracked-cell scenes); the shell must not dim on top. */
  ownFocus?: boolean;
  /** "Non nago?": where the cut lies along the body (0 = cranial … 1 = caudal) and an optional note. */
  locator?: { level?: number; note?: string };
  /**
   * For a diagram (`eskema`) that is still drawn in one plane of the body (a view from below), that
   * plane: the move from or to this view can then be shown as a camera travelling between planes.
   */
  frame?: PlaneKind;
  /** For the camera move: the stretch of the body the drawing shows (0 = head … 1 = tail end), when it is not the whole body. */
  span?: [number, number];
  /** No camera move to or from this view (it shows one organ or bone, not a cut of the whole body). */
  travel?: false;
}

/** A narrative caption active from `at` until the next beat. `focus` highlights structures while active. */
/** A one-tap check the guided mode asks at the end of a step, before moving on. */
/** What a question trains: timing, origin, formation, location, relations, fate, causality, image recognition. */
export type Competence = 'noiz' | 'jatorria' | 'eraketa' | 'kokapena' | 'erlazioak' | 'patua' | 'kausa' | 'irudia';

export interface MicroQuestion {
  q: string;
  options: string[];
  answer: number;
  /** One short reason per option (why it is right, or what that option actually is). */
  why: string[];
  /** Competence it trains (inferred from the wording when omitted). */
  comp?: Competence;
  /** The structure it is about (inferred when omitted). */
  concept?: string;
}

export interface Beat {
  at: number;
  /** Original notes sentence ids (week-prefixed), or paragraph ranges such as w1/4.2/p3/s1-s4. */
  notes?: string[];
  /** AZALPEN LABURRA: what just happened on screen, in 2–4 short sentences. */
  text: string;
  /** IDEIA NAGUSIA: the step in one sentence (the only line the quick replay shows). */
  idea?: string;
  /** ULERTZEKO GAKOA: the one idea that makes this step make sense. */
  key?: string;
  /**
   * FUNTSEZKOA: the fact of this step to keep, worded from the notes.
   */
  exam?: string;
  /** GOGORATU: earlier structures this step builds on (re-activated before it, with a way to watch them again). */
  recall?: string[];
  /** KONTUZ: the trap this step invites. */
  caution?: string;
  /** SAKONDU: longer detail, folded away by default. */
  more?: string;
  /** Guided mode: a micro-question at the end of the step. */
  ask?: MicroQuestion;
  focus?: string[];
  /** The view where this step is best seen; playback switches to it unless the viewer picked a view. */
  view?: string;
  /**
   * Guided tour: structures lit one at a time (in their own colour, the rest shaded) while the
   * animation holds at `tourAt`, so the viewer meets each part before the process starts.
   */
  tour?: string[];
  /** Stage time the animation holds at during the tour (defaults to three quarters into the step). */
  tourAt?: number;
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
  /** Summary bullets, faithful to the notes. */
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
  /** A space (cavity, lacuna), not a tissue — drawn and labelled differently so the two are never confused. */
  space?: boolean;
  /** A whole made of other drawn structures (e.g. lateral mesoderm = its two layers): naming it lights them. */
  parts?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  stageId?: string;
  /** Competence it trains (inferred from the wording when omitted). */
  comp?: Competence;
  /** The structure it is about (inferred when omitted). */
  concept?: string;
}

export interface WeekDef {
  week: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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
