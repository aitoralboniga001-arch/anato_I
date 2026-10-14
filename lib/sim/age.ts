import type { WeekDef } from './types';

/** Developmental age as the notes write it: days in the embryonic period, weeks from the 9th week on. */
export const ageLabel = (day: number) => (day <= 56 ? `${Math.floor(day)}. eguna` : `${Math.min(38, Math.ceil(day / 7))}. astea`);

/**
 * What the player's clock says. A step or a view can pin its own age (a later stage drawn ahead, an
 * adult drawing, a table with no age); a stage whose day chip has no number ("Helduarora") shows that
 * chip; otherwise the stage's days run with the playhead. Empty string = no clock.
 */
export function clockLabel(day: number, stageDay: string, viewAge?: number | string | null, beatAge?: number | string | null): string {
  const pinned = beatAge !== undefined ? beatAge : viewAge;
  if (pinned === null) return '';
  if (typeof pinned === 'number') return ageLabel(pinned);
  if (typeof pinned === 'string') return pinned;
  return /\d/.test(stageDay) ? ageLabel(day) : stageDay;
}

/** The age number and its unit, for layouts that set them in different weights. */
export const ageParts = (day: number): [number, string] =>
  day <= 56 ? [Math.floor(day), '. eguna'] : [Math.min(38, Math.ceil(day / 7)), '. astea'];

/** Span of a topic, long ("22–28. egunak") and short ("22–28"). */
export const spanOf = (w: WeekDef) => w.span ?? { long: `${w.dayRange[0]}–${w.dayRange[1]}. egunak`, short: `${w.dayRange[0]}–${w.dayRange[1]}` };
