// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook } from '@testing-library/react';

vi.mock('firebase/auth', async () => (await import('../mocks/auth.js')).authMock);
vi.mock('firebase/firestore', async () => (await import('../mocks/firestore.js')).firestoreMock);
vi.mock('../../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true }));

import { authMock } from '../mocks/auth.js';
import { useAuth, AuthProvider } from '../../src/context/AuthContext.jsx';
import { ThemeProvider, useTheme, useThemeActions, useThemeState } from '../../src/context/ThemeContext.jsx';
import { LanguageProvider, useLanguage } from '../../src/context/LanguageContext.jsx';
import { Tabs } from '../../src/components/Tabs.jsx';

beforeEach(() => authMock.onAuthStateChanged.mockReturnValue(vi.fn()));
afterEach(cleanup);

// React logs the error it catches in an error boundary; keep the test output clean
const quiet = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('custom context hooks fail loudly outside their provider', () => {
  it.each([
    ['useAuth', useAuth, /useAuth must be used inside an <AuthProvider>/],
    ['useThemeState', useThemeState, /useThemeState must be used inside a <ThemeProvider>/],
    ['useThemeActions', useThemeActions, /useThemeActions must be used inside a <ThemeProvider>/],
    ['useTheme', useTheme, /must be used inside a <ThemeProvider>/],
    ['useLanguage', useLanguage, /useLanguage must be used inside a <LanguageProvider>/],
  ])('%s throws a clear message', (_name, hook, message) => {
    const spy = quiet();
    expect(() => renderHook(() => hook())).toThrow(message);
    spy.mockRestore();
  });

  it('the Tabs parts throw when used outside <Tabs>', () => {
    const spy = quiet();
    expect(() => render(<Tabs.Tab value="a">A</Tabs.Tab>)).toThrow('<Tabs.Tab> must be rendered inside <Tabs>.');
    expect(() => render(<Tabs.Panel value="a">A</Tabs.Panel>)).toThrow('<Tabs.Panel> must be rendered inside <Tabs>.');
    expect(() => render(<Tabs.List>x</Tabs.List>)).toThrow('<Tabs.List> must be rendered inside <Tabs>.');
    spy.mockRestore();
  });

  it('ThemeProvider needs AuthProvider above it (context composition)', () => {
    const spy = quiet();
    expect(() =>
      render(
        <ThemeProvider>
          <span />
        </ThemeProvider>
      )
    ).toThrow(/useAuth must be used inside an <AuthProvider>/);
    spy.mockRestore();
  });

  it('works once the providers are in place, in dependency order', () => {
    const { result } = renderHook(() => ({ auth: useAuth(), theme: useTheme(), language: useLanguage() }), {
      wrapper: ({ children }) => (
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      ),
    });
    expect(result.current.auth.status).toBeDefined();
    expect(result.current.theme.mode).toBe('light');
    expect(result.current.language.locale).toBe('en');
  });
});
