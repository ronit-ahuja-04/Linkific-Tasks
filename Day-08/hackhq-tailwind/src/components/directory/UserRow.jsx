import { cx } from '../ui.jsx';

/**
 * Single participant list row rendering avatar, full name, email, and age.
 * Complies with requirement PD-2.
 */
export function UserRow({ user, isSelected, onSelect }) {
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(user.id)}
      className={cx(
        'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
        isSelected
          ? 'border-accent bg-accent-soft'
          : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
      )}
    >
      <img
        src={user.image}
        alt={fullName}
        className="size-11 shrink-0 rounded-full border border-line bg-surface-2 object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{fullName}</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[0.65rem] text-muted">
            {user.age} yrs
          </span>
        </div>
        <div className="truncate text-xs text-muted">{user.email}</div>
      </div>
      <div
        className={cx(
          'hidden shrink-0 font-mono text-[0.68rem] uppercase tracking-wider sm:block',
          isSelected ? 'text-accent' : 'text-muted group-hover:text-ink'
        )}
      >
        {isSelected ? 'Selected ✓' : 'View posts →'}
      </div>
    </button>
  );
}
