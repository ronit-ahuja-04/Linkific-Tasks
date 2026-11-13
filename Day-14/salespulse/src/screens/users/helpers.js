export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekdayOf = (date) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
export const perVisitor = (row) => (row.visitors ? Math.round((row.sessions / row.visitors) * 100) / 100 : 0);

