import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, contrastRatio, formatRatio, parseColor, relativeLuminance, toHex } from '../src/lib/contrast';
import { documentedTokens } from '../src/lib/designTokens';
import { checkContrast, readThemes, TOKENS_FILE } from '../scripts/contrast.mjs';

const TOKENS_CSS = readFileSync(TOKENS_FILE, 'utf8');

describe('contrast maths (WCAG 2.2 definition)', () => {
  it('scores the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5); // order does not matter
    expect(contrastRatio('#0b6b54', '#0b6b54')).toBe(1);
  });

  it('matches reference values', () => {
    // #767676 is the classic "lightest grey that passes on white"; #777777 just fails
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it('parses hex, short hex, rgb() and rgba() in comma and space syntax', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('#0B6B54')).toEqual({ r: 11, g: 107, b: 84, a: 1 });
    expect(parseColor('#00000080').a).toBeCloseTo(0.5, 2);
    expect(parseColor('rgb(11, 107, 84)')).toEqual({ r: 11, g: 107, b: 84, a: 1 });
    expect(parseColor('rgb(0 0 0 / 50%)').a).toBe(0.5);
    expect(parseColor('not a colour')).toBeNull();
  });

  it('blends a see-through foreground onto its background before measuring', () => {
    const halfBlack = contrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff');
    expect(halfBlack).toBeGreaterThan(3);
    expect(halfBlack).toBeLessThan(contrastRatio('#000000', '#ffffff'));
  });

  it('rounds down, so a pair just under the line never shows as passing', () => {
    expect(formatRatio(4.4999)).toBe('4.49');
    expect(formatRatio(Number.NaN)).toBe('n/a');
    expect(toHex('rgb(11, 107, 84)')).toBe('#0b6b54');
  });
});

describe('design tokens', () => {
  const themes = readThemes(TOKENS_CSS);

  it('resolves every semantic colour to a real colour in both themes', () => {
    for (const theme of ['light', 'dark']) {
      const colours = Object.entries(themes[theme]).filter(([name]) => name.startsWith('--color-'));
      expect(colours.length).toBeGreaterThan(30);
      for (const [name, value] of colours) expect(parseColor(value), `${theme} ${name} = ${value}`).not.toBeNull();
    }
  });

  it('defines the dark theme as a full mapping, not a partial override', () => {
    const lightNames = Object.keys(themes.light).filter((n) => n.startsWith('--color-'));
    const darkBlock = TOKENS_CSS.slice(TOKENS_CSS.indexOf("[data-theme='dark'] {"));
    for (const name of lightNames) expect(darkBlock, `${name} missing from the dark theme`).toContain(`${name}:`);
  });

  it('every text and control pair passes WCAG AA in light and dark', () => {
    const rows = checkContrast(themes);
    expect(rows).toHaveLength(CONTRAST_PAIRS.length * 2);
    const failures = rows.filter((r) => !r.pass).map((r) => `${r.theme}: ${r.use} (${r.fg} on ${r.bg}) = ${formatRatio(r.ratio)}:1, needs ${r.min}:1`);
    expect(failures).toEqual([]);
  });

  it('catches a bad token (the check is a real gate)', () => {
    const broken = TOKENS_CSS.replace('--color-text-secondary: var(--neutral-600);', '--color-text-secondary: #aaaaaa;');
    const failing = checkContrast(readThemes(broken)).filter((r) => !r.pass);
    expect(failing.map((r) => r.fg)).toContain('--color-text-secondary');
    expect(failing.every((r) => r.theme === 'light')).toBe(true);
  });

  it('fails loudly when a theme is missing a token a pair needs', () => {
    // Strict on purpose: a nested [data-theme='dark'] scope would NOT get the light value, so dark must define everything
    const noDarkFocus = TOKENS_CSS.replace('--color-focus: var(--blue-400);', '');
    expect(() => checkContrast(readThemes(noDarkFocus))).toThrow(/dark: --color-focus/);
  });

  it('fails loudly on a var() that points nowhere', () => {
    const dangling = TOKENS_CSS.replace('--color-text: var(--neutral-900);', '--color-text: var(--neutral-999);');
    expect(() => readThemes(dangling)).toThrow(/--neutral-999/);
  });

  it('every token the style guide documents exists in tokens.css', () => {
    const defined = new Set([...Object.keys(themes.light), ...Object.keys(themes.dark)]);
    const missing = documentedTokens().filter((name) => !defined.has(name));
    expect(missing).toEqual([]);
  });

  it('keeps raw colours in tokens.css only: every other stylesheet uses tokens', () => {
    const dir = resolve(TOKENS_FILE, '..');
    const offenders = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.css') && f !== 'tokens.css')) {
      const css = readFileSync(resolve(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) offenders.push(`${file}: ${match[0]}`);
    }
    expect(offenders).toEqual([]);
  });
});
