// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../src/context/LanguageContext.jsx';
import { DEFAULT_LOCALE, DICTIONARIES, LOCALES, interpolate, translate } from '../../src/i18n/index.js';

const storage = {};
let browserLanguage = 'en-US';

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
  browserLanguage = 'en-US';
  vi.stubGlobal('localStorage', { getItem: (k) => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } });
  vi.spyOn(navigator, 'language', 'get').mockImplementation(() => browserLanguage);
  document.documentElement.removeAttribute('lang');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const setup = () => renderHook(() => useLanguage(), { wrapper: LanguageProvider });

describe('LanguageProvider and useLanguage', () => {
  it('defaults to English and sets <html lang>', () => {
    const { result } = setup();
    expect(result.current.locale).toBe('en');
    expect(result.current.t('settings.title')).toBe('Settings');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('switches language: t() changes, <html lang> follows, the choice is saved', () => {
    const { result } = setup();
    act(() => result.current.setLocale('es'));
    expect(result.current.locale).toBe('es');
    expect(result.current.t('settings.title')).toBe('Ajustes');
    expect(document.documentElement.getAttribute('lang')).toBe('es');
    expect(storage['flowlane-language']).toBe('es');
    act(() => result.current.setLocale('hi'));
    expect(result.current.t('settings.title')).toBe('सेटिंग्स');
  });

  it('ignores a language it does not have', () => {
    const { result } = setup();
    act(() => result.current.setLocale('klingon'));
    expect(result.current.locale).toBe('en');
    expect(storage['flowlane-language']).toBeUndefined();
  });

  it('starts from the saved language', () => {
    storage['flowlane-language'] = 'hi';
    const { result } = setup();
    expect(result.current.locale).toBe('hi');
  });

  it('falls back to the browser language when it is supported, else English', () => {
    browserLanguage = 'es-MX';
    expect(setup().result.current.locale).toBe('es');
    cleanup();
    browserLanguage = 'fr-FR';
    expect(setup().result.current.locale).toBe('en');
  });

  it('a saved choice beats the browser language', () => {
    storage['flowlane-language'] = 'en';
    browserLanguage = 'hi-IN';
    expect(setup().result.current.locale).toBe('en');
  });

  it('exposes the available languages, each labelled in its own language', () => {
    const { result } = setup();
    expect(result.current.locales).toEqual(LOCALES);
    expect(result.current.locales.map((l) => l.label)).toEqual(['English', 'Español', 'हिन्दी']);
  });

  it('keeps `t` and the context value stable until the language changes (useMemo, useCallback)', () => {
    const seen = [];
    function Probe() {
      seen.push(useLanguage());
      return null;
    }
    const { rerender } = render(<LanguageProvider><Probe /></LanguageProvider>);
    rerender(<LanguageProvider><Probe /></LanguageProvider>);
    expect(new Set(seen).size).toBe(1);
    expect(new Set(seen.map((v) => v.t)).size).toBe(1);
  });

  it('re-renders text everywhere a component uses t()', () => {
    let change;
    function Label() {
      const { t, setLocale } = useLanguage();
      change = setLocale;
      return <p>{t('settings.tabs.language')}</p>;
    }
    render(<LanguageProvider><Label /></LanguageProvider>);
    expect(screen.getByText('Language')).toBeTruthy();
    act(() => change('es'));
    expect(screen.getByText('Idioma')).toBeTruthy();
  });
});

describe('translate and interpolate', () => {
  it('replaces {placeholders}, leaves unknown ones, and handles no variables', () => {
    expect(interpolate('Hi {name}, you have {count} items', { name: 'Ann', count: 3 })).toBe('Hi Ann, you have 3 items');
    expect(interpolate('Hi {name}', {})).toBe('Hi {name}');
    expect(interpolate('Hi {name}')).toBe('Hi {name}');
  });

  it('falls back to English, then to the key itself', () => {
    expect(translate('es', 'settings.title')).toBe('Ajustes');
    expect(translate('xx', 'settings.title')).toBe('Settings'); // unknown language
    expect(translate('es', 'no.such.key')).toBe('no.such.key'); // visible, not blank
  });

  it('English is the default and every language has the same keys (see i18n-completeness test)', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(Object.keys(DICTIONARIES)).toEqual(['en', 'es', 'hi']);
  });
});
