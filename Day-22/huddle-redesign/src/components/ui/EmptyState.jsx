/**
 * An empty list is a design moment, not a blank space: say what is missing, why, and the one next step.
 *   <EmptyState icon={<Inbox />} title="No notes yet" action={<button className="btn btn-primary">New note</button>}>
 *     Notes you write, or that your team shares, show up here.
 *   </EmptyState>
 */
export default function EmptyState({ icon, title, children, action, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="empty-state">
      {icon && <span className="empty-state-icon" aria-hidden="true">{icon}</span>}
      <Heading className="empty-state-title">{title}</Heading>
      {children && <p className="empty-state-text">{children}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
