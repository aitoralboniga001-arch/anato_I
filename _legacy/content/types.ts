export type Locale = 'eu' | 'es' | 'en';

export interface SourceReference {
  file: string;
  section: string;
  note?: string;
}

export interface LocalizedLabel {
  primary: string;
  secondary?: Partial<Record<Exclude<Locale, 'eu'>, string>>;
}

export interface GlossaryTerm {
  id: string;
  label: LocalizedLabel;
  definition: string;
  source: SourceReference;
}

export interface Structure {
  id: string;
  label: LocalizedLabel;
  kind: 'anatomy' | 'cell' | 'tissue' | 'cavity' | 'process' | 'orientation';
  description?: string;
  source: SourceReference;
}

export interface VisualHint {
  renderer: 'svg' | 'css-2.5d' | 'three';
  assetId?: string;
  layers?: string[];
  lazy?: boolean;
}

export interface Stage {
  id: string;
  title: LocalizedLabel;
  summary: string;
  order: number;
  start: number;
  end: number;
  transition: 'discrete' | 'interpolate';
  structures: string[];
  source: SourceReference;
  visual?: VisualHint;
  explanation?: {
    changes: string[];
    relations: string[];
    caution?: string;
  };
}

export interface Topic {
  id: string;
  title: LocalizedLabel;
  week: 1 | 2 | 3 | 4;
  learningGoals: string[];
  structures: Structure[];
  stages: Stage[];
  source: SourceReference;
}

export interface ProgressRecord {
  topicId: string;
  timeline: number;
  completedStageIds: string[];
  updatedAt: string;
}
