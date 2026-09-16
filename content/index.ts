export * from './types';
export { week1 } from './week-1';
export { week2 } from './week-2';
export { glossary } from './glossary';

import { glossary } from './glossary';
import { week1 } from './week-1';
import { week2 } from './week-2';
import type { GlossaryTerm, Stage, Structure, Topic } from './types';

export const allTopics: Topic[] = [week1, week2];
export const allGlossaryTerms: GlossaryTerm[] = glossary;

/** Backwards-compatible alias for consumers that used the original collection name. */
export const topics = allTopics;

export function getTopic(topicId: string): Topic | undefined {
  return allTopics.find((topic) => topic.id === topicId);
}

export function getStage(topicId: string, stageId: string): Stage | undefined {
  return getTopic(topicId)?.stages.find((stage) => stage.id === stageId);
}

export function getStructure(topicId: string, structureId: string): Structure | undefined {
  return getTopic(topicId)?.structures.find((structure) => structure.id === structureId);
}
