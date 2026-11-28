/** Style builders kept out of the .tsx files so a <Link> can look exactly like a <Button>. */
export type ButtonVariant = 'glow' | 'violet' | 'lagoon' | 'ember' | 'ghost' | 'dark' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  glow: 'press bg-glow text-ink shadow-[0_5px_0_var(--color-glow-deep)]',
  violet: 'press bg-violet text-white shadow-[0_5px_0_var(--color-violet-deep)]',
  lagoon: 'press bg-lagoon text-white shadow-[0_5px_0_var(--color-lagoon-deep)]',
  ember: 'press bg-ember text-white shadow-[0_5px_0_var(--color-ember-deep)]',
  ghost:
    'press border-2 border-line-strong bg-white text-ink shadow-[0_4px_0_var(--color-line-strong)]',
  dark: 'border-2 border-night-line bg-transparent text-white hover:bg-night-2',
  plain: 'bg-transparent text-violet-ink hover:bg-violet-soft',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 rounded-xl px-3 text-sm',
  md: 'min-h-12 rounded-2xl px-5 text-base',
  lg: 'min-h-14 rounded-2xl px-6 text-lg',
};

export function buttonClasses({
  variant = 'glow',
  size = 'md',
  fullWidth = false,
  className = '',
}: ButtonStyleOptions = {}) {
  return [
    'inline-flex items-center justify-center gap-2 font-display font-semibold no-underline select-none',
    'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function cardClasses(className = '') {
  return ['rounded-[var(--radius-card)] border-2 border-line bg-white', className]
    .filter(Boolean)
    .join(' ');
}
