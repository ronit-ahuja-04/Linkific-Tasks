import { fullDateTime, relativeTime } from '../../lib/format';

/** "2 days ago", with the exact date on hover (title) and in the markup (dateTime) */
export default function RelativeTime({ date, now, className }) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return (
    <time className={className} dateTime={value.toISOString()} title={fullDateTime(value)}>
      {relativeTime(value, now)}
    </time>
  );
}
