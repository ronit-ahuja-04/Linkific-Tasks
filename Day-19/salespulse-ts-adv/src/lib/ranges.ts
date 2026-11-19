/** The period buttons. `as const` makes the array a tuple of literals, so `Range` can be derived from it. */
export const RANGES = [3, 6, 12, 24] as const;
/** 3 | 6 | 12 | 24: derived from the list, so the buttons and the type can never disagree */
export type Range = (typeof RANGES)[number];
