import type { StageDef, StructureDef, WeekDef } from '@/lib/sim/types';
import { week1 } from './weeks/week1';
import { week2 } from './weeks/week2';
import { week3 } from './weeks/week3';
import { week4 } from './weeks/week4';
import { week5 } from './weeks/week5';
import { week6 } from './weeks/week6';
import { week7 } from './weeks/week7';
import { week8 } from './weeks/week8';
import { week9 } from './weeks/week9';
import { week10 } from './weeks/week10';
import { week11 } from './weeks/week11';
import { week12 } from './weeks/week12';
import { week13 } from './weeks/week13';
import { week14 } from './weeks/week14';

export const weeks: WeekDef[] = [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12, week13, week14];

/** All structures, deduplicated by id. The week that introduces a structure owns its definition. */
export const structures: Map<string, StructureDef> = (() => {
  const map = new Map<string, StructureDef>();
  for (const w of weeks) for (const s of w.structures) if (!map.has(s.id)) map.set(s.id, s);
  return map;
})();

export interface StageRef {
  week: WeekDef;
  stage: StageDef;
  stageIndex: number;
}

/** Where each structure appears, in chronological order. */
export const appearances: Map<string, StageRef[]> = (() => {
  const map = new Map<string, StageRef[]>();
  for (const w of weeks)
    w.stages.forEach((stage, stageIndex) => {
      for (const id of stage.structures) {
        const list = map.get(id) ?? [];
        list.push({ week: w, stage, stageIndex });
        map.set(id, list);
      }
    });
  return map;
})();

export const getWeek = (n: number) => weeks.find((w) => w.week === n);

export const nameOf = (id: string) => structures.get(id)?.name ?? id;

/** The drawn structures a whole is made of (none for an ordinary structure). */
export const partsOf = (id: string): readonly string[] => structures.get(id)?.parts ?? structures.get(id)?.spans ?? [];

/** A layered whole's layers in order (its name takes a span bracket across them); none for anything else. */
export const spansOf = (id: string): readonly string[] => structures.get(id)?.spans ?? [];

/** A space (cavity / lacuna) rather than a tissue. */
export const isSpace = (id: string) => {
  const s = structures.get(id);
  return !!s && (s.category === 'barrunbea' || !!s.space);
};
