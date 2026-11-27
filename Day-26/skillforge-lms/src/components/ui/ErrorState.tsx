import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export type ErrorStateVariant = 'inline' | 'panel';

export interface ErrorStateProps {
  /** Short heading shown in panel variant or optional prefix in inline mode. */
  title?: string;
  /** Human-readable error explanation. */
  message: string;
  /** Optional machine-readable error code shown in monospace. */
  code?: string;
  /** Compact alert banner or full centered recovery panel. */
  variant?: ErrorStateVariant;
  /** Label for the retry action button when onRetry is provided. */
  actionLabel?: string;
  /** Optional retry callback. */
  onRetry?: () => void;
  /** Optional custom action node (e.g. a navigation link). */
  actionSlot?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  code,
  variant = 'inline',
  actionLabel = 'Try again',
  onRetry,
  actionSlot,
  className = '',
}: ErrorStateProps) {
  if (variant === 'panel') {
    return (
      <section
        role="alert"
        className={`rpg-card mx-auto max-w-lg p-8 text-center ${className}`.trim()}
      >
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        {code && (
          <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-danger">
            {code}
          </p>
        )}
        <h2 className="mt-2 font-display text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        {(onRetry || actionSlot) && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {onRetry && (
              <Button
                variant="primary"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={onRetry}
              >
                {actionLabel}
              </Button>
            )}
            {actionSlot}
          </div>
        )}
      </section>
    );
  }

  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-sm font-medium text-danger ${className}`.trim()}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p>{message}</p>
          {code && <p className="mt-0.5 font-mono text-[11px] opacity-80">Code: {code}</p>}
        </div>
      </div>
      {(onRetry || actionSlot) && (
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              {actionLabel}
            </Button>
          )}
          {actionSlot}
        </div>
      )}
    </div>
  );
}
