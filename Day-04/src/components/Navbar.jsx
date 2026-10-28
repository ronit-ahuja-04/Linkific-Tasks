import './Navbar.css';

/**
 * Reusable Navbar component demonstrating:
 * - Complex props (array of navigation objects: label, href, active)
 * - List rendering with stable unique keys
 * - Conditional styling for active nav links
 * - Component composition with brand and optional action slot
 */
function Navbar({
  brand = 'DevHub',
  links = [],
  action,
  className = '',
}) {
  return (
    <nav className={`navbar ${className}`.trim()} aria-label="Main Navigation">
      <div className="navbar-container">
        <a href="#home" className="navbar-brand">
          <span className="navbar-logo-icon">⚡</span>
          <span className="navbar-brand-text">{brand}</span>
        </a>

        {Array.isArray(links) && links.length > 0 && (
          <ul className="navbar-links">
            {links.map((link) => {
              const key = link.id || link.href || link.label;
              const isActive = Boolean(link.active);

              return (
                <li key={key} className="navbar-item">
                  <a
                    href={link.href}
                    className={`navbar-link ${isActive ? 'is-active' : ''}`.trim()}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {action && <div className="navbar-action">{action}</div>}
      </div>
    </nav>
  );
}

export default Navbar;
