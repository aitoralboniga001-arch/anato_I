/** Topics with a study room (Ikasgela): own page at /ikasgela/N. */
export const ROOM_WEEKS = [7, 8, 9, 10, 11, 12, 13] as const;

export const hasRoom = (week: number) => (ROOM_WEEKS as readonly number[]).includes(week);
