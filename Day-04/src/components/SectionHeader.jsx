import './SectionHeader.css';

/**
 * SectionHeader component demonstrating:
 * - Simple string & element props (title, subtitle, badge, action)
 * - Conditional rendering: only renders subtitle and badge when passed
 * - Consistent section title hierarchy and action control placement
 */
function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  className = '',
}) {
  return (
    <div className={`section-header ${className}`.trim()}>
      <div className="section-header-main">
        <div className="section-header-title-row">
          <h2 className="section-header-title">{title}</h2>
          {badge && <div className="section-header-badge">{badge}</div>}
        </div>
        {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
      </div>

      {action && <div className="section-header-action">{action}</div>}
    </div>
  );
}

export default SectionHeader;
