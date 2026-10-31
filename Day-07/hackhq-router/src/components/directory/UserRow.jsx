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
      className={`live-user-row ${isSelected ? 'selected' : ''}`}
    >
      <img src={user.image} alt={fullName} className="live-user-avatar" loading="lazy" />
      <div className="live-user-meta">
        <div className="live-user-name-row">
          <span className="live-user-fullname">{fullName}</span>
          <span className="live-user-age-pill">{user.age} yrs</span>
        </div>
        <div className="live-user-email">{user.email}</div>
      </div>
      <div className="live-user-action-hint">{isSelected ? 'Selected ✓' : 'View posts →'}</div>
    </button>
  );
}
