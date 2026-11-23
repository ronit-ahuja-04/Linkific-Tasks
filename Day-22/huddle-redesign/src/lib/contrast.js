/**
 * WCAG 2.2 colour contrast, shared by the token check (scripts/contrast.mjs, the unit test) and the
 * live /styleguide page, so the numbers in the docs and the numbers on screen come from one function.
 *
 * Contrast ratio = (L1 + 0.05) / (L2 + 0.05), where L is the relative luminance of the lighter (L1)
 * and darker (L2) colour. https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */

/** '#0b6b54', '#fff', '#0b6b5480', 'rgb(11, 107, 84)', 'rgba(0,0,0,.5)', 'rgb(0 0 0 / 50%)' to {r, g, b, a} */
export function parseColor(input) {
  const value = String(input).trim().toLowerCase();
  const hex = value.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) digits = [...digits].map((d) => d + d).join('');
    if (digits.length !== 6 && digits.length !== 8) return null;
    const n = (i) => parseInt(digits.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: digits.length === 8 ? n(6) / 255 : 1 };
  }
  const fn = value.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p));
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a: alpha };
  }
  return null;
}

const linear = (channel) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** https://www.w3.org/TR/WCAG22/#dfn-relative-luminance */
export function relativeLuminance({ r, g, b }) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** A see-through foreground is blended onto the background first: that is the colour people actually see */
function composite(fg, bg) {
  if (fg.a >= 1) return fg;
  const mix = (f, b) => f * fg.a + b * (1 - fg.a);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

/** The contrast ratio between two colours (strings or {r,g,b,a}), from 1 to 21 */
export function contrastRatio(foreground, background) {
  const bg = typeof background === 'string' ? parseColor(background) : background;
  const fgRaw = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  if (!bg || !fgRaw) return NaN;
  const fg = composite(fgRaw, bg);
  const [light, dark] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** {r,g,b} (or any colour string) to '#rrggbb', for showing a computed colour as people write it */
export function toHex(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  if (!c) return '';
  return `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Round down to 2 decimals, so 4.499 never shows as a passing 4.5 */
export const formatRatio = (ratio) => (Number.isFinite(ratio) ? (Math.floor(ratio * 100) / 100).toFixed(2) : 'n/a');

/**
 * Every foreground/background pair the interface actually uses, with the WCAG minimum it must meet:
 *   4.5 = normal text (1.4.3), 3 = large text, icons, input borders and focus rings (1.4.3, 1.4.11, 2.4.11/2.4.13 guidance).
 * Adding a new text colour or surface means adding its pairs here; the unit test then fails until it passes.
 */
export const CONTRAST_PAIRS = [
  // Text on every surface it appears on
  { fg: '--color-text', bg: '--color-bg', min: 4.5, use: 'Body text on the page' },
  { fg: '--color-text', bg: '--color-surface', min: 4.5, use: 'Body text in a card' },
  { fg: '--color-text', bg: '--color-bg-subtle', min: 4.5, use: 'Text in the sidebar and code blocks' },
  { fg: '--color-text', bg: '--color-surface-hover', min: 4.5, use: 'Text on a hovered row' },
  { fg: '--color-text-secondary', bg: '--color-bg', min: 4.5, use: 'Secondary text on the page' },
  { fg: '--color-text-secondary', bg: '--color-surface', min: 4.5, use: 'Secondary text in a card (dates, hints)' },
  { fg: '--color-text-secondary', bg: '--color-bg-subtle', min: 4.5, use: 'Secondary text in the sidebar' },
  { fg: '--color-text-secondary', bg: '--color-surface-hover', min: 4.5, use: 'Secondary text on a hovered row' },
  // Brand green as text and as a button
  { fg: '--color-primary-text', bg: '--color-bg', min: 4.5, use: 'Link on the page' },
  { fg: '--color-primary-text', bg: '--color-surface', min: 4.5, use: 'Link in a card' },
  { fg: '--color-primary-text', bg: '--color-bg-subtle', min: 4.5, use: 'Link in the sidebar' },
  { fg: '--color-on-primary', bg: '--color-primary', min: 4.5, use: 'Primary button label' },
  { fg: '--color-on-primary', bg: '--color-primary-hover', min: 4.5, use: 'Primary button label, hovered' },
  { fg: '--color-selected-text', bg: '--color-selected', min: 4.5, use: 'Current nav item, selected row' },
  // Amber: reserved for "needs your attention"
  { fg: '--color-on-attention', bg: '--color-attention', min: 4.5, use: 'Unread / mention count badge' },
  { fg: '--color-attention-text', bg: '--color-attention-subtle', min: 4.5, use: 'Attention banner text' },
  { fg: '--color-attention-text', bg: '--color-surface', min: 4.5, use: 'Attention text in a card' },
  { fg: '--color-mention-text', bg: '--color-mention-bg', min: 4.5, use: '@mention inside a message' },
  { fg: '--color-mark-text', bg: '--color-mark-bg', min: 4.5, use: 'Search-match highlight' },
  // Status colours
  { fg: '--color-success-text', bg: '--color-success-subtle', min: 4.5, use: 'Success message' },
  { fg: '--color-success-text', bg: '--color-surface', min: 4.5, use: 'Success text in a card' },
  { fg: '--color-warning-text', bg: '--color-warning-subtle', min: 4.5, use: 'Warning message' },
  { fg: '--color-warning-text', bg: '--color-surface', min: 4.5, use: 'Warning text in a card' },
  { fg: '--color-danger-text', bg: '--color-danger-subtle', min: 4.5, use: 'Error message' },
  { fg: '--color-danger-text', bg: '--color-surface', min: 4.5, use: 'Field error, danger button label' },
  { fg: '--color-on-danger', bg: '--color-danger', min: 4.5, use: 'Destructive confirm button label' },
  { fg: '--color-info-text', bg: '--color-info-subtle', min: 4.5, use: 'Info message' },
  { fg: '--color-info-text', bg: '--color-surface', min: 4.5, use: 'Info text in a card' },
  // Non-text: parts you need to see to use the control (WCAG 1.4.11, 3:1)
  { fg: '--color-border-input', bg: '--color-surface', min: 3, use: 'Input, select and checkbox border' },
  { fg: '--color-border-input', bg: '--color-bg', min: 3, use: 'Input border on the page' },
  { fg: '--color-focus', bg: '--color-bg', min: 3, use: 'Focus ring on the page' },
  { fg: '--color-focus', bg: '--color-surface', min: 3, use: 'Focus ring in a card' },
  { fg: '--color-focus', bg: '--color-bg-subtle', min: 3, use: 'Focus ring in the sidebar' },
  { fg: '--color-brand', bg: '--color-surface', min: 3, use: 'Brand-green icons and the online dot' },
];
