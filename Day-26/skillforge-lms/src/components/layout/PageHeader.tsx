import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  /** Small uppercase eyebrow label above the title. */
  eyebrow?: string;
  /** Optional icon next to the eyebrow label. */
  eyebrowIcon?: ReactNode;
  /** Main page heading text. */
  title: string;
  /** Supporting summary paragraph below the heading. */
  description?: string;
  /** Optional breadcrumb link rendered above the eyebrow. */
  backTo?: { to: string; label: string };
  /** Right-aligned action controls (e.g. sort select, primary button). */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  backTo,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {backTo && (
        <Link
          to={backTo.to}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{backTo.label}</span>
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand">
              {eyebrowIcon && (
                <span className="inline-flex shrink-0" aria-hidden="true">
                  {eyebrowIcon}
                </span>
              )}
              <span>{eyebrow}</span>
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
