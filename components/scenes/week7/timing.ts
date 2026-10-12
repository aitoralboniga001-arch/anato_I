/**
 * Stage times shared by topic 7's content (week7.ts, evaluated on the server too) and its client scenes.
 * Kept out of the 'use client' scene files so the content can read the numbers on the server.
 */

/** diafragma-eraketa: the old drawings play over [0, at]; then the four components become the adult dome. */
export const FATE = { at: 0.86, morph: [0.875, 0.935] as const, named: [0.93, 0.945] as const };

/** diafragma-heldua: the old drawings play over [0, at]; the last step builds the one-cavity → four strip. */
export const SUMMARY = { at: 0.84, p2: 0.875, p3: 0.91 };

/** peritoneo-barrunbea: the section plays over [0, at]; the last step compares the three kinds of organ. */
export const TYPES = { at: 0.88, c2: 0.9, c3: 0.92, fuse: [0.925, 0.955] as const };
