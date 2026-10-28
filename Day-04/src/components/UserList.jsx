import UserCard from './UserCard';
import './UserList.css';

/**
 * UserList component demonstrating:
 * - List rendering with `Array.prototype.map()`
 * - Strict use of stable, unique keys (`key={user.id}`) rather than array indices
 * - Destructuring user objects cleanly into UserCard props
 * - Grid container layout for responsive presentation
 */
function UserList({ users = [], onConnectUser }) {
  if (!users || users.length === 0) {
    return (
      <div className="user-list-empty">
        <p>No community members found.</p>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-grid">
        {users.map((user) => (
          <UserCard
            key={user.id}
            name={user.name}
            role={user.role}
            avatar={user.avatar}
            isOnline={user.isOnline}
            bio={user.bio}
            location={user.location}
            onConnect={onConnectUser}
          />
        ))}
      </div>
    </div>
  );
}

export default UserList;
