import './Badge.css';

/**
 * Reusable Badge component demonstrating:
 * - Simple string & boolean props (label, tone, variant, dot)
 * - Conditional styling with a ternary/dynamic classes based on tone
 * - Conditional rendering of status indicator dot
 */
function Badge({
  label,
  children,
  tone = 'neutral',
  variant = 'subtle',
  dot = false,
  className = '',
}) {
  const content = label || children;

  const badgeClasses = [
    'badge',
    `badge-tone-${tone}`,
    `badge-var-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      <span className="badge-text">{content}</span>
    </span>
  );
}

export default Badge;
