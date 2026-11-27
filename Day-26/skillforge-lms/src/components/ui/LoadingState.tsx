import { Loader2 } from 'lucide-react';

export type LoadingVariant = 'spinner' | 'skeleton-cards' | 'skeleton-rows';

export interface LoadingStateProps {
  /** Visual loading presentation mode. */
  variant?: LoadingVariant;
  /** Accessible status message read to assistive tech and optionally displayed. */
  label?: string;
  /** Number of skeleton cards or rows rendered in skeleton variants. */
  count?: number;
  /** Additional classes for the container. */
  className?: string;
}

export function LoadingState({
  variant = 'spinner',
  label = 'Loading...',
  count = 3,
  className = '',
}: LoadingStateProps) {
  if (variant === 'skeleton-cards') {
    return (
      <div role="status" aria-live="polite" aria-label={label} className={className}>
        <span className="sr-only">{label}</span>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }, (_, idx) => (
            <div
              key={idx}
              className="rpg-card flex h-72 animate-pulse flex-col justify-between bg-surface-2/60 p-5"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-28 rounded-full bg-line/70" />
                  <div className="h-5 w-16 rounded-full bg-line/70" />
                </div>
                <div className="h-6 w-3/4 rounded-lg bg-line/80" />
                <div className="h-4 w-full rounded-lg bg-line/60" />
                <div className="h-4 w-2/3 rounded-lg bg-line/60" />
              </div>
              <div className="flex items-center justify-between border-t border-line pt-4">
                <div className="h-4 w-24 rounded bg-line/70" />
                <div className="h-8 w-24 rounded-xl bg-line/80" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'skeleton-rows') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={`space-y-3 ${className}`.trim()}
      >
        <span className="sr-only">{label}</span>
        {Array.from({ length: count }, (_, idx) => (
          <div
            key={idx}
            className="rpg-card flex h-24 animate-pulse items-center justify-between gap-4 bg-surface-2/60 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-line/80" />
              <div className="h-12 w-12 rounded-full bg-line/70" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-line/80" />
                <div className="h-3 w-28 rounded bg-line/60" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-lg bg-line/80" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rpg-card flex items-center gap-3 p-5 text-sm font-semibold text-muted ${className}`.trim()}
    >
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
