/**
 * Shared Tailwind primitives. Every page and station composes these, so the look stays
 * consistent and a design change is a one-file edit.
 */

export const cx = (...parts) => parts.filter(Boolean).join(' ');

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ' +
  'transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const BUTTON_VARIANTS = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover shadow-sm',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'bg-bad-soft text-bad hover:bg-bad hover:text-white',
  dark: 'bg-ink text-bg hover:opacity-90',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: '',
  lg: 'px-6 py-3 text-base',
};

/** Class string for anything that should look like a button (e.g. a <Link>). */
export function buttonClass({ variant = 'primary', size = 'md', className } = {}) {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export function Button({ variant, size, className, type = 'button', ...props }) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}

export function Card({ as: Tag = 'div', className, ...props }) {
  return (
    <Tag
      className={cx('rounded-card border border-line bg-surface shadow-card', className)}
      {...props}
    />
  );
}

const BADGE_TONES = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand text-on-brand',
  accent: 'bg-accent-soft text-accent',
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
};

export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-wider',
        BADGE_TONES[tone],
        className
      )}
      {...props}
    />
  );
}

/** Pulsing "live" dot */
export function PulseDot({ tone = 'good', className }) {
  const color = tone === 'bad' ? 'bg-bad' : tone === 'warn' ? 'bg-warn' : 'bg-good';
  return (
    <span className={cx('relative flex size-2', className)} aria-hidden="true">
      <span
        className={cx(
          'absolute inline-flex size-full animate-ping-slow rounded-full opacity-60',
          color
        )}
      />
      <span className={cx('relative inline-flex size-2 rounded-full', color)} />
    </span>
  );
}

/** Class strings for form controls */
export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink ' +
  'placeholder:text-muted/70 transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft ' +
  'disabled:opacity-50 aria-[invalid=true]:border-bad aria-[invalid=true]:ring-bad-soft';

export const labelClass = 'mb-1.5 block text-sm font-medium text-ink';
export const hintClass = 'mt-1.5 text-xs text-muted';
export const errorClass = 'mt-1.5 text-xs font-medium text-bad';

/** Small uppercase mono label used above sections */
export function Eyebrow({ className, ...props }) {
  return (
    <p
      className={cx(
        'font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted',
        className
      )}
      {...props}
    />
  );
}

/** Section heading inside a page */
export function SectionTitle({ eyebrow, title, children, className }) {
  return (
    <div className={cx('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>}
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cx(
        'rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.68rem] text-muted',
        className
      )}
      {...props}
    />
  );
}
