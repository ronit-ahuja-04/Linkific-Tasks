// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../src/context/ThemeContext';
import { CONTRAST_PAIRS } from '../src/lib/contrast';
import { SCALES } from '../src/lib/designTokens';
import StyleguidePage from '../src/pages/StyleguidePage';

function setup() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/styleguide']}>
        <StyleguidePage />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('StyleguidePage', () => {
  it('has one h1, a section nav and a heading for every section', () => {
    setup();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Principles', 'Colour', 'Contrast', 'Typography', 'Spacing and layout', 'Shape and elevation', 'Components']);
    for (const link of links) {
      const id = link.getAttribute('href').slice(1);
      expect(document.getElementById(id)?.tagName, `${id} target`).toBe('H2');
    }
    expect(screen.getByRole('main')).toBeTruthy();
    expect(document.title).toBe('Design system · Huddle');
  });

  it('shows every scale step and one contrast row per pair', () => {
    setup();
    const swatches = document.querySelectorAll('.sg-swatches li');
    expect(swatches).toHaveLength(SCALES.reduce((n, s) => n + s.steps.length, 0));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(CONTRAST_PAIRS.length + 1);
    expect(screen.getByRole('region', { name: 'Contrast table' }).getAttribute('tabindex')).toBe('0'); // scrollable, so reachable by keyboard
  });

  it('keeps the light/dark previews out of the accessibility tree and the tab order', () => {
    setup();
    const previews = document.querySelector('.sg-previews');
    expect(previews.getAttribute('aria-hidden')).toBe('true');
    expect(previews.hasAttribute('inert')).toBe(true);
    expect(previews.querySelectorAll('button, a, input')).toHaveLength(0);
  });

  it('every demo input has a label, and the error is wired to its input', () => {
    setup();
    expect(screen.getByLabelText('Room name')).toBeTruthy();
    const email = screen.getByLabelText('Email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(email.getAttribute('aria-describedby')).textContent).toMatch(/full email address/);
    expect(screen.getByLabelText('Workspace')).toHaveProperty('disabled', true);
  });

  it('filter chips toggle aria-pressed, and a removable chip can be removed', async () => {
    setup();
    const pinned = screen.getByRole('button', { name: 'Pinned' });
    expect(pinned.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(pinned);
    expect(pinned.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: tag design' }));
    expect(screen.queryByRole('button', { name: 'Remove filter: tag design' })).toBeNull();
  });

  it('the theme button switches the whole page', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
