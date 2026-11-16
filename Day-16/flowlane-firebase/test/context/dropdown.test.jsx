// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from '../../src/components/Dropdown.jsx';
import LanguageMenu from '../../src/components/LanguageMenu.jsx';
import { LanguageProvider } from '../../src/context/LanguageContext.jsx';
import { ToastProvider } from '../../src/context/ToastContext.jsx';

afterEach(cleanup);

function Demo({ onSelect = () => {} }) {
  return (
    <>
      <p>outside</p>
      <Dropdown>
        <Dropdown.Trigger aria-label="Sort">Sort</Dropdown.Trigger>
        <Dropdown.Menu aria-label="Sort by">
          <Dropdown.Item onSelect={() => onSelect('name')}>Name</Dropdown.Item>
          <Dropdown.Item onSelect={() => onSelect('date')}>Date</Dropdown.Item>
          <Dropdown.Item checked onSelect={() => onSelect('priority')}>Priority</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}
const trigger = () => screen.getByRole('button', { name: 'Sort' });

describe('Dropdown (compound component)', () => {
  it('starts closed and exposes the ARIA state on the trigger', () => {
    render(<Demo />);
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens on click, links trigger and menu, and focuses the selected item', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    const menu = screen.getByRole('menu', { name: 'Sort by' });
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(menu.id);
    expect(menu.getAttribute('aria-labelledby')).toBeNull(); // it has its own aria-label
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Priority' }));
  });

  it('without its own aria-label, the menu is named by its trigger button', async () => {
    render(
      <Dropdown>
        <Dropdown.Trigger>Actions</Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Item>One</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(menu.getAttribute('aria-labelledby')).toBe(screen.getByRole('button', { name: 'Actions' }).id);
  });

  it('uses menuitem for plain items and menuitemradio with aria-checked for checkable ones', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Name', 'Date']);
    expect(screen.getByRole('menuitemradio', { name: 'Priority' }).getAttribute('aria-checked')).toBe('true');
  });

  it('ArrowDown on the closed trigger opens it', async () => {
    render(<Demo />);
    trigger().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('arrow keys, Home and End move between items, wrapping around', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Name' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Date' }));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Priority' }));
    await userEvent.keyboard('{ArrowDown}'); // wraps to the first
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Name' }));
    await userEvent.keyboard('{ArrowUp}'); // wraps to the last
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Priority' }));
  });

  it('Escape closes the menu and returns focus to the trigger', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('a click outside closes it without moving focus back', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByText('outside'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Tab closes it and lets focus move on', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{Tab}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('choosing an item calls onSelect once, closes the menu and refocuses the trigger', async () => {
    const onSelect = vi.fn();
    render(<Demo onSelect={onSelect} />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Date' }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('date');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('clicking the trigger again closes it', async () => {
    render(<Demo />);
    await userEvent.click(trigger());
    await userEvent.click(trigger());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('parts throw outside <Dropdown>', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Dropdown.Trigger>x</Dropdown.Trigger>)).toThrow('<Dropdown.Trigger> must be rendered inside <Dropdown>.');
    expect(() => render(<Dropdown.Menu>x</Dropdown.Menu>)).toThrow('<Dropdown.Menu> must be rendered inside <Dropdown>.');
    expect(() => render(<Dropdown.Item>x</Dropdown.Item>)).toThrow('<Dropdown.Item> must be rendered inside <Dropdown>.');
    spy.mockRestore();
  });
});

describe('LanguageMenu (the Dropdown driven by the LanguageContext)', () => {
  const storage = {};
  const renderMenu = () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.stubGlobal('localStorage', { getItem: (k) => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } });
    return render(
      <LanguageProvider>
        <ToastProvider>
          <LanguageMenu />
        </ToastProvider>
      </LanguageProvider>
    );
  };
  afterEach(() => vi.unstubAllGlobals());

  it('shows the current language, lists all languages with the current one checked', async () => {
    renderMenu();
    expect(screen.getByRole('button', { name: 'Language' }).textContent).toContain('EN');
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((i) => i.textContent)).toEqual(['EnglishEnglish'.slice(0, 7), 'Español', 'हिन्दी']);
    expect(items.map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
  });

  it('choosing a language switches everything, updates the label, saves it and announces it in that language', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Español' }));
    expect(screen.getByRole('button', { name: 'Idioma' }).textContent).toContain('ES'); // the button's name is translated too
    expect(storage['flowlane-language']).toBe('es');
    expect(screen.getByRole('status').textContent).toContain('Idioma: Español'); // announced in Spanish
  });

  it('choosing the language that is already selected does nothing', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(storage['flowlane-language']).toBeUndefined();
  });
});
