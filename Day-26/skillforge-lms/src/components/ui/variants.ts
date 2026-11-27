export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'rpg-btn-primary border-2 border-transparent font-bold',
  gold: 'rpg-btn-gold border-2 border-transparent font-bold',
  secondary: 'border-2 border-line bg-surface-2 text-ink font-bold hover:border-brand',
  outline: 'border-2 border-line bg-surface text-ink font-bold hover:bg-surface-2',
  ghost:
    'border-2 border-transparent bg-transparent text-muted font-bold hover:bg-surface-2 hover:text-ink',
  danger:
    'border-2 border-danger/40 bg-danger text-white font-bold shadow-[0_3px_0_rgba(153,27,27,0.75)] hover:opacity-95 active:translate-y-0.5',
};

const BUTTON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-1.5 text-xs',
  md: 'rounded-xl px-4 py-2 text-sm',
  lg: 'rounded-xl px-6 py-3 text-sm',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: ButtonStyleOptions = {}): string {
  return [
    'inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55',
    BUTTON_VARIANT_STYLES[variant],
    BUTTON_SIZE_STYLES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export type CardVariant = 'default' | 'elevated' | 'muted' | 'brand' | 'gold';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardStyleOptions {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  className?: string;
}

const CARD_VARIANT_STYLES: Record<CardVariant, string> = {
  default: 'rpg-card',
  elevated: 'rpg-card shadow-[0_6px_0_rgba(42,30,59,0.12)] dark:shadow-[0_6px_0_rgba(0,0,0,0.45)]',
  muted: 'rpg-card bg-surface-2/60',
  brand:
    'rpg-card bg-gradient-to-br from-brand via-brand to-brand-deep text-on-brand border-brand-deep',
  gold: 'rpg-card border-gold bg-gold/10',
};

const CARD_PADDING_STYLES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

export function cardClasses({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
}: CardStyleOptions = {}): string {
  return [
    CARD_VARIANT_STYLES[variant],
    CARD_PADDING_STYLES[padding],
    interactive ? 'transition-all hover:-translate-y-0.5 hover:border-brand' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export type BadgeTone = 'brand' | 'gold' | 'good' | 'warn' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeStyleOptions {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
}

const BADGE_TONE_STYLES: Record<BadgeTone, string> = {
  brand: 'bg-brand/15 text-brand',
  gold: 'bg-gold/30 text-ink dark:text-gold',
  good: 'bg-good/15 text-good',
  warn: 'bg-warn/15 text-warn',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-surface-2 text-muted',
};

const BADGE_SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs',
};

export function badgeClasses({
  tone = 'brand',
  size = 'md',
  className = '',
}: BadgeStyleOptions = {}): string {
  return [
    'inline-flex items-center gap-1.5 rounded-full font-bold',
    BADGE_TONE_STYLES[tone],
    BADGE_SIZE_STYLES[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
