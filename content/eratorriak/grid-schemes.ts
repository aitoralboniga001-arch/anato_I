/**
 * Eskema integratuak: one grid per notes section that puts origin, place, structure and nerve (or artery
 * piece) side by side, so a whole row reads as one path. Written from the notes prose (content/notes-text
 * of each topic); `section` names the notes heading the grid stands for. Checked by tests/grid-schemes.test.ts.
 */

import type { GridScheme } from './grid-kit';
import { GRID_7 } from './grid-schemes-7';
import { GRID_8 } from './grid-schemes-8';
import { GRID_9 } from './grid-schemes-9';
import { GRID_10 } from './grid-schemes-10';
import { GRID_11 } from './grid-schemes-11';
import { GRID_12 } from './grid-schemes-12';
import { GRID_13 } from './grid-schemes-13';
import { GRID_14 } from './grid-schemes-14';

export type { GridCell, GridColumn, GridRow, GridScheme, Tone } from './grid-kit';

/** In topic order; each topic's grids follow its notes. */
export const GRID_SCHEMES: GridScheme[] = [...GRID_7, ...GRID_8, ...GRID_9, ...GRID_10, ...GRID_11, ...GRID_12, ...GRID_13, ...GRID_14];

export const gridSchemesFor = (week: number) => GRID_SCHEMES.filter((s) => s.week === week);
