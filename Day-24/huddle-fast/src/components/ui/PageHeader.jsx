/**
 * Every page starts the same way: the h1, one line saying what the page is for, and the page's actions
 * on the right (below on a phone). Same place, same size, every page: repetition is what makes it learnable.
 */
export default function PageHeader({ title, description, actions, titleId, headingLevel = 1 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="page-header">
      <div className="page-header-text">
        <Heading id={titleId} className="page-header-title">{title}</Heading>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
