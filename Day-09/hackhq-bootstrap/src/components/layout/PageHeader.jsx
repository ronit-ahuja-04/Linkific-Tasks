import { Badge, Eyebrow, PulseDot } from '../ui.jsx';

/**
 * Shared breadcrumb + title + status pill used by every page.
 * `children` renders under the title (descriptions, actions).
 */
export default function PageHeader({ breadcrumb, title, pill, children }) {
  return (
    <header className="mb-4 mb-lg-5 animate-rise">
      <Eyebrow className="mb-3">
        Control room <span className="text-body-tertiary">/</span>{' '}
        <span className="text-body">{breadcrumb}</span>
      </Eyebrow>
      <div className="d-flex flex-wrap align-items-center gap-3">
        <h1 className="display-6 fw-bold mb-0">{title}</h1>
        {pill && (
          <Badge tone="good">
            <PulseDot />
            {pill}
          </Badge>
        )}
      </div>
      {children && (
        <div className="mt-3 text-body-secondary" style={{ maxWidth: '42rem' }}>
          {children}
        </div>
      )}
    </header>
  );
}
