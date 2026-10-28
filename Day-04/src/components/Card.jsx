import './Card.css';

/**
 * Reusable Card component demonstrating:
 * - Component composition via `children` prop
 * - Conditional rendering for optional header (title, subtitle) and footer
 * - Flexible className prop forwarding for customized layouts
 */
function Card({
  title,
  subtitle,
  children,
  footer,
  className = '',
  elevation = 'md',
}) {
  const hasHeader = Boolean(title || subtitle);

  const cardClasses = [
    'card',
    `card-elevation-${elevation}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClasses}>
      {hasHeader && (
        <header className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </header>
      )}

      <div className="card-body">{children}</div>

      {footer && <footer className="card-footer">{footer}</footer>}
    </article>
  );
}

export default Card;
