/**
 * A number in a pill. `attention` makes it amber, which Huddle keeps for "this needs you".
 * The colour never carries the meaning alone: the number is visible, and `label` gives screen readers the
 * words ("3 unread messages") that sighted people get from the context around it.
 */
export default function CountBadge({ count, label, attention = false, max = 99 }) {
  if (!count) return null;
  const shown = count > max ? `${max}+` : String(count);
  return (
    <span className={`count${attention ? ' count-attention' : ''}`}>
      <span aria-hidden={label ? 'true' : undefined}>{shown}</span>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
