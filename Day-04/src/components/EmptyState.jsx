import './EmptyState.css';

/**
 * EmptyState component demonstrating:
 * - Simple & slot props (title, message, icon, action)
 * - Conditional rendering: only renders action slot if provided
 * - Accessible empty state container
 */
function EmptyState({
  icon = '📦',
  title = 'No items found',
  message = 'There are currently no items to display matching your criteria.',
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`.trim()} role="status">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
