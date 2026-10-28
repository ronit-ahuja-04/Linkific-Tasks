import './Avatar.css';

/**
 * Reusable Avatar component demonstrating:
 * - Simple string & image props (name, src, size, status)
 * - Conditional rendering: image element vs initials fallback container
 * - Fallback string processing: extracting capitalized initials from multi-word names
 * - Optional status dot indicator
 */
function Avatar({
  name = 'Developer',
  src,
  size = 'md',
  status,
  alt,
  className = '',
}) {
  const getInitials = (str) => {
    if (!str) return 'D';
    const parts = str.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const avatarClasses = [
    'avatar',
    `avatar-size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={avatarClasses}>
      {src ? (
        <img
          src={src}
          alt={alt || `${name}'s avatar`}
          className="avatar-image"
          loading="lazy"
        />
      ) : (
        <div className="avatar-fallback" aria-label={name}>
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`avatar-status avatar-status-${status}`}
          title={`Status: ${status}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export default Avatar;
