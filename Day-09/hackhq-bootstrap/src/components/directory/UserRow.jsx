import { ListGroup } from 'react-bootstrap';
import { Badge, cx } from '../ui.jsx';

/**
 * Single participant list row rendering avatar, full name, email, and age.
 * Complies with requirement PD-2.
 */
export function UserRow({ user, isSelected, onSelect }) {
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <ListGroup.Item
      action
      active={isSelected}
      as="button"
      type="button"
      onClick={() => onSelect(user.id)}
      className="d-flex align-items-center gap-3 p-3 text-start"
    >
      <img
        src={user.image}
        alt={fullName}
        className="flex-shrink-0 rounded-circle border bg-body-secondary object-fit-cover"
        style={{ width: 44, height: 44 }}
        loading="lazy"
      />
      <div className="min-w-0 flex-grow-1" style={{ minWidth: 0 }}>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold text-truncate">{fullName}</span>
          <Badge tone="neutral">{user.age} yrs</Badge>
        </div>
        <div className={cx('small text-truncate', !isSelected && 'text-body-secondary')}>
          {user.email}
        </div>
      </div>
      <div className="d-none d-sm-block flex-shrink-0 font-monospace small text-uppercase ls-wide">
        {isSelected ? 'Selected ✓' : 'View posts →'}
      </div>
    </ListGroup.Item>
  );
}
