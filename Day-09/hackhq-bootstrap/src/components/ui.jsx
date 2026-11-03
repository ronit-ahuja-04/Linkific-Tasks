import { Badge as BsBadge, Button as BsButton, Card as BsCard } from 'react-bootstrap';

/**
 * Shared Bootstrap primitives. Every page and station composes these, so the look stays
 * consistent and a design change is a one-file edit.
 */

export const cx = (...parts) => parts.filter(Boolean).join(' ');

const BUTTON_VARIANTS = {
  primary: 'brand',
  secondary: 'outline-secondary',
  ghost: 'link',
  danger: 'outline-danger',
  dark: 'ink',
};

const BUTTON_SIZES = { sm: 'sm', md: undefined, lg: 'lg' };

/** Class string for anything that should look like a button (e.g. a <Link>). */
export function buttonClass({ variant = 'primary', size = 'md', className } = {}) {
  return cx(
    'btn d-inline-flex align-items-center justify-content-center gap-2',
    `btn-${BUTTON_VARIANTS[variant]}`,
    BUTTON_SIZES[size] && `btn-${BUTTON_SIZES[size]}`,
    variant === 'ghost' && 'text-body-secondary text-decoration-none',
    className
  );
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }) {
  return (
    <BsButton
      type={type}
      variant={BUTTON_VARIANTS[variant]}
      size={BUTTON_SIZES[size]}
      className={cx(
        'd-inline-flex align-items-center justify-content-center gap-2',
        variant === 'ghost' && 'text-body-secondary text-decoration-none',
        className
      )}
      {...props}
    />
  );
}

export function Card({ as: Tag = 'div', className, ...props }) {
  return <BsCard as={Tag} className={cx('p-4 shadow-sm', className)} {...props} />;
}

const BADGE_TONES = {
  neutral: 'bg-secondary-subtle text-secondary-emphasis',
  brand: 'bg-brand',
  accent: 'bg-primary-subtle text-primary-emphasis',
  good: 'bg-success-subtle text-success-emphasis',
  warn: 'bg-warning-subtle text-warning-emphasis',
  bad: 'bg-danger-subtle text-danger-emphasis',
};

export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <BsBadge
      pill
      bg={null}
      className={cx(
        'd-inline-flex align-items-center gap-2 font-monospace fw-medium text-uppercase ls-wide',
        BADGE_TONES[tone],
        className
      )}
      {...props}
    />
  );
}

/** Pulsing "live" dot */
export function PulseDot({ tone = 'good', className }) {
  const color = tone === 'bad' ? 'bg-danger' : tone === 'warn' ? 'bg-warning' : 'bg-success';
  return (
    <span className={cx('pulse-dot position-relative d-inline-flex', className)} aria-hidden="true">
      <span
        className={cx(
          'pulse-ring position-absolute top-0 start-0 w-100 h-100 rounded-circle',
          color
        )}
      />
      <span className={cx('pulse-dot position-relative d-inline-flex rounded-circle', color)} />
    </span>
  );
}

/** Class strings for form controls */
export const inputClass = 'form-control';
export const labelClass = 'form-label fw-medium';
export const hintClass = 'form-text';
export const errorClass = 'invalid-feedback d-block fw-medium';

/** Small uppercase mono label used above sections */
export function Eyebrow({ className, ...props }) {
  return (
    <p
      className={cx(
        'mb-0 small font-monospace fw-medium text-uppercase ls-wider text-body-secondary',
        className
      )}
      {...props}
    />
  );
}

/** Section heading inside a page */
export function SectionTitle({ eyebrow, title, children, className }) {
  return (
    <div
      className={cx(
        'mb-4 d-flex flex-wrap align-items-end justify-content-between gap-3',
        className
      )}
    >
      <div>
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h2 className="fs-3 fw-bold mb-0">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cx(
        'border bg-body-tertiary text-body-secondary font-monospace fw-normal px-2 py-1',
        className
      )}
      {...props}
    />
  );
}
