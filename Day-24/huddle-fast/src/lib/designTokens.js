/**
 * What the /styleguide page documents. Names only: the VALUES are read live from the CSS in the browser,
 * so the page can never show a colour the app does not use. test/design-tokens.test.js checks that every
 * name here exists in tokens.css.
 */
export const SCALES = [
  { name: 'Green', prefix: '--green', steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], role: 'Brand. 500 is the Day 17 green (icons, logo); 700 carries white text (buttons, links).' },
  { name: 'Warm grey', prefix: '--neutral', steps: [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 925, 950], role: 'Every surface, border and text colour. A little warmth so the greys sit calmly next to green.' },
  { name: 'Amber', prefix: '--amber', steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], role: 'The one accent, kept for "this needs you": unread counts, mentions. Used sparingly so it keeps its pull.' },
  { name: 'Red', prefix: '--red', steps: [50, 100, 300, 500, 600, 700, 900], role: 'Errors and destructive actions only.' },
  { name: 'Blue', prefix: '--blue', steps: [50, 200, 300, 400, 600, 700, 800, 900], role: 'Information, @mentions and the focus ring.' },
];

export const SEMANTIC_GROUPS = [
  {
    name: 'Surfaces and lines',
    tokens: [
      ['--color-bg', 'The page'],
      ['--color-bg-subtle', 'Sidebar, code, wells'],
      ['--color-surface', 'Cards and inputs'],
      ['--color-surface-raised', 'Menus and toasts'],
      ['--color-surface-hover', 'Hovered rows'],
      ['--color-border', 'Dividers (decoration)'],
      ['--color-border-input', 'Control edges (3:1)'],
    ],
  },
  {
    name: 'Text',
    tokens: [
      ['--color-text', 'Everything you read'],
      ['--color-text-secondary', 'Dates, hints, meta'],
      ['--color-text-disabled', 'Disabled controls'],
    ],
  },
  {
    name: 'Brand and selection',
    tokens: [
      ['--color-brand', 'Logo, icons, online dot'],
      ['--color-primary', 'Primary button'],
      ['--color-primary-text', 'Links'],
      ['--color-selected', 'Current page, selected row'],
      ['--color-selected-text', 'Text on selected'],
      ['--color-focus', 'Focus ring'],
    ],
  },
  {
    name: 'Attention and status',
    tokens: [
      ['--color-attention', 'Unread and mention counts'],
      ['--color-attention-subtle', 'Attention banner'],
      ['--color-success-text', 'Saved, uploaded'],
      ['--color-warning-text', 'Expiring soon'],
      ['--color-danger', 'Destructive confirm'],
      ['--color-danger-text', 'Errors'],
      ['--color-info-text', 'Information'],
      ['--color-mention-bg', '@mention'],
    ],
  },
];

export const TYPE_SCALE = [
  { token: '--text-3xl', px: 39, use: 'Sign-in headline' },
  { token: '--text-2xl', px: 31, use: 'Page title (h1)' },
  { token: '--text-xl', px: 25, use: 'Page title on a phone' },
  { token: '--text-lg', px: 20, use: 'Section and card titles (h2)' },
  { token: '--text-md', px: 16, use: 'Body text, inputs' },
  { token: '--text-sm', px: 14, use: 'Navigation, labels, buttons, meta' },
  { token: '--text-xs', px: 12, use: 'Badges, counts, captions' },
];

export const SPACING = [
  ['--space-1', 4, 'Icon to its label'],
  ['--space-2', 8, 'Inside a group: label to input, chips'],
  ['--space-3', 12, 'List rows, compact padding'],
  ['--space-4', 16, 'Card padding on a phone, form fields'],
  ['--space-6', 24, 'Card padding, gaps between cards'],
  ['--space-8', 32, 'Between page sections'],
  ['--space-12', 48, 'Large section breaks'],
  ['--space-16', 64, 'Hero spacing (sign-in)'],
];

export const RADII = [
  ['--radius-sm', 'Inline code, badges in text'],
  ['--radius-md', 'Buttons, inputs'],
  ['--radius-lg', 'Cards, menus, toasts'],
  ['--radius-full', 'Pills, avatars, counts'],
];

export const SHADOWS = [
  ['--shadow-xs', 'Cards at rest'],
  ['--shadow-sm', 'Hovered card'],
  ['--shadow-md', 'Dropdowns, popovers'],
  ['--shadow-lg', 'Toasts, dialogs'],
];

/** Every token name the style guide reads, for the drift test */
export function documentedTokens() {
  return [
    ...SCALES.flatMap((s) => s.steps.map((step) => `${s.prefix}-${step}`)),
    ...SEMANTIC_GROUPS.flatMap((g) => g.tokens.map(([name]) => name)),
    ...TYPE_SCALE.map((t) => t.token),
    ...SPACING.map(([name]) => name),
    ...RADII.map(([name]) => name),
    ...SHADOWS.map(([name]) => name),
  ];
}
