/** Today's date as YYYY-MM-DD in UTC (the same on the server and in the browser) */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);
