import Card from './Card';
import Button from './Button';
import Avatar from './Avatar';
import Badge from './Badge';
import './UserCard.css';

/**
 * UserCard component demonstrating:
 * - Simple string & boolean props (name, role, avatar, isOnline)
 * - Component composition: composed from generic `Card`, `Avatar`, `Badge`, and `Button` primitives
 * - Conditional rendering: online vs offline badge tone
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
  const statusTone = isOnline ? 'success' : 'neutral';

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
        <Avatar
          name={name}
          src={avatar}
          size="lg"
          status={isOnline ? 'online' : 'offline'}
        />

        <div className="user-info">
          <h4 className="user-name">{name}</h4>
          <p className="user-role">{role}</p>
          <Badge tone={statusTone} dot>
            {statusLabel}
          </Badge>
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
