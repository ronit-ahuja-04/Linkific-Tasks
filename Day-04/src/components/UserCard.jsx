import Card from './Card';
import Button from './Button';
import './UserCard.css';

/**
 * UserCard component demonstrating:
 * - Simple string & boolean props (name, role, avatar, isOnline)
 * - Conditional rendering using ternary operator (isOnline ? 'Online' : 'Offline')
 * - Conditional rendering with logical AND for optional bio & location
 * - Component composition: wraps content inside the generic `Card` primitive
 */
function UserCard({
  name = 'Anonymous Developer',
  role = 'Software Engineer',
  avatar,
  isOnline = false,
  bio,
  location,
  onConnect,
}) {
  const statusLabel = isOnline ? 'Online' : 'Offline';
  const statusClass = isOnline ? 'status-online' : 'status-offline';

  const handleConnect = () => {
    if (typeof onConnect === 'function') {
      onConnect(name);
    } else {
      alert(`Connected with ${name}!`);
    }
  };

  return (
    <Card className="user-card" elevation="sm">
      <div className="user-card-header">
        <div className="user-avatar-wrapper">
          {avatar ? (
            <img src={avatar} alt={`${name}'s avatar`} className="user-avatar-img" />
          ) : (
            <div className="user-avatar-fallback">
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <span
            className={`user-status-dot ${statusClass}`}
            title={`Status: ${statusLabel}`}
            aria-label={`Status: ${statusLabel}`}
          />
        </div>

        <div className="user-info">
          <h4 className="user-name">{name}</h4>
          <p className="user-role">{role}</p>
          <span className={`user-status-badge ${statusClass}`}>
            <span className="user-status-indicator" />
            {statusLabel}
          </span>
        </div>
      </div>

      {bio && <p className="user-bio">{bio}</p>}

      {location && (
        <div className="user-meta">
          <span className="user-meta-icon" aria-hidden="true">📍</span>
          <span className="user-location">{location}</span>
        </div>
      )}

      <div className="user-card-actions">
        <Button variant="primary" size="sm" onClick={handleConnect}>
          Connect
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert(`Viewing profile for ${name}`)}
        >
          Profile
        </Button>
      </div>
    </Card>
  );
}

export default UserCard;
