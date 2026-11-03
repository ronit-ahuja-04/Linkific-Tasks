import { Badge, PulseDot } from '../ui.jsx';

/**
 * Shared breadcrumb + title + status pill used by every page.
 * `children` renders under the title (descriptions, actions).
 */
export default function PageHeader({ breadcrumb, title, pill, children }) {
  return (
    <header className="mb-8 animate-rise">
      <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Control room <span className="text-line">/</span>{' '}
        <span className="text-ink">{breadcrumb}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {pill && (
          <Badge tone="good">
            <PulseDot />
            {pill}
          </Badge>
        )}
      </div>
      {children && <div className="mt-3 max-w-2xl text-muted">{children}</div>}
    </header>
  );
}
