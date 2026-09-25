import type { WeekDef } from './types';

/** Developmental age as the notes write it: days in the embryonic period, weeks from the 9th week on. */
export const ageLabel = (day: number) => (day <= 56 ? `${Math.floor(day)}. eguna` : `${Math.min(38, Math.ceil(day / 7))}. astea`);

/** The age number and its unit, for layouts that set them in different weights. */
export const ageParts = (day: number): [number, string] =>
  day <= 56 ? [Math.floor(day), '. eguna'] : [Math.min(38, Math.ceil(day / 7)), '. astea'];

/** Span of a topic, long ("22–28. egunak") and short ("22–28"). */
export const spanOf = (w: WeekDef) => w.span ?? { long: `${w.dayRange[0]}–${w.dayRange[1]}. egunak`, short: `${w.dayRange[0]}–${w.dayRange[1]}` };
