import './matchers';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../../../src/auth/AuthContext';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// What the real ApiError looks like, without importing it (another module owns it).
export class FakeApiError extends Error {
  constructor({ status = 400, code = 'error', message = 'Failed', fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function makeAuth(overrides = {}) {
  return {
    user: null,
    status: 'anonymous',
    isAuthenticated: false,
    session: { expiresAt: null, claims: null, refreshCount: 0 },
    notice: null,
    clearNotice: vi.fn(),
    login: vi.fn().mockResolvedValue({}),
    register: vi.fn().mockResolvedValue({}),
    logout: vi.fn().mockResolvedValue(undefined),
    beginGithubLogin: vi.fn(),
    completeOAuth: vi.fn().mockResolvedValue({}),
    refreshNow: vi.fn().mockResolvedValue(undefined),
    setUser: vi.fn(),
    ...overrides,
  };
}

// oxlint-disable-next-line react/only-export-components
function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

// Renders `element` at `path` inside a router, a theme provider and a fake auth context.
// Other routes just print where we are, so tests can assert navigation.
export function renderPage(element, { auth = makeAuth(), url = '/', path = '/', wrapper = (node) => node } = {}) {
  const ui = (
    <ThemeProvider>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path={path} element={element} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
  return { auth, ...render(wrapper(ui)) };
}
