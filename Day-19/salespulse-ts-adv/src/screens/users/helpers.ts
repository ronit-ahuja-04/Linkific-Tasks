import type { DayKey, UsersRow } from '../../types';

export const WEEKDAYS: readonly string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekdayOf = (date: DayKey): string | undefined => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
export const perVisitor = (row: Pick<UsersRow, 'visitors' | 'sessions'>): number =>
  row.visitors ? Math.round((row.sessions / row.visitors) * 100) / 100 : 0;
