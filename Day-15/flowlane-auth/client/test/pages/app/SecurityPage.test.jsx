// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../src/api/authApi', () => ({
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
  resendVerification: vi.fn(),
}));
import { listSessions, revokeSession, resendVerification } from '../../../src/api/authApi';
import SecurityPage from '../../../src/pages/app/SecurityPage';
import { AuthContext } from '../../../src/auth/AuthContext';
import { ToastProvider } from '../../../src/context/ToastContext';

const T0 = Date.parse('2026-06-01T12:00:00.000Z');
const claims = { sub: 'u1', role: 'member', email: 'ada@x.dev', name: 'Ada', sid: 'sess-9', iss: 'flowlane-auth', aud: 'flowlane-web', iat: T0 / 1000, exp: T0 / 1000 + 900 };
const makeAuth = (over = {}) => ({
  user: { id: 'u1', name: 'Ada', email: 'ada@x.dev', role: 'member', emailVerified: true },
  session: { expiresAt: T0 + 900_000, claims, refreshCount: 3 },
  refreshNow: vi.fn().mockResolvedValue(undefined),
  ...over,
});
const sessions = () => [
  { id: 's1', createdAt: '2026-05-31T10:00:00Z', lastUsedAt: '2026-06-01T11:00:00Z', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0 Safari/537.36', remember: true, current: true },
  { id: 's2', createdAt: '2026-05-30T10:00:00Z', lastUsedAt: '2026-05-30T11:00:00Z', userAgent: 'Mozilla/5.0 (Windows NT 10.0) Gecko/20100101 Firefox/121.0', remember: false, current: false },
];

beforeEach(() => {
  globalThis.jest = { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) };
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(T0);
  vi.clearAllMocks();
  listSessions.mockResolvedValue(sessions());
});
afterEach(() => {
  vi.useRealTimers();
  delete globalThis.jest;
});

async function setup(auth = makeAuth()) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  await act(async () => {
    render(
      <ToastProvider>
        <AuthContext.Provider value={auth}>
          <SecurityPage />
        </AuthContext.Provider>
      </ToastProvider>
    );
  });
  return { user, auth };
}
const flush = () => act(async () => {});
const tick = (ms) => act(() => { vi.advanceTimersByTime(ms); });

describe('SecurityPage session card', () => {
  it('shows decoded claims in a description list and never a raw token', async () => {
    await setup();
    expect(document.title).toBe('Security · FlowLane');
    const card = screen.getByRole('region', { name: 'Your session' });
    for (const [k, v] of [['sub', 'u1'], ['role', 'member'], ['email', 'ada@x.dev'], ['sid', 'sess-9'], ['iss', 'flowlane-auth'], ['aud', 'flowlane-web']]) {
      expect(within(card).getByText(k, { selector: 'dt' }).nextElementSibling.textContent).toBe(v);
    }
    expect(within(card).getByText('iat', { selector: 'dt' }).nextElementSibling.textContent).toBe(new Date(T0).toLocaleString());
    expect(within(card).getByText('exp', { selector: 'dt' }).nextElementSibling.textContent).toBe(new Date(T0 + 900_000).toLocaleString());
    expect(card.textContent).not.toMatch(/eyJ/);
  });
  it('explains where the tokens live', async () => {
    await setup();
    expect(screen.getByText(/lives only in this page's memory/)).toBeTruthy();
    expect(screen.getByText(/HttpOnly cookie/)).toBeTruthy();
  });
  it('shows the refresh count', async () => {
    await setup();
    expect(screen.getByText(/Silent refreshes so far/).textContent).toContain('3');
  });
  it('counts down every second', async () => {
    await setup();
    expect(screen.getByText('Access token expires in 15:00')).toBeTruthy();
    tick(1000);
    expect(screen.getByText('Access token expires in 14:59')).toBeTruthy();
    tick(59_000);
    expect(screen.getByText('Access token expires in 14:00')).toBeTruthy();
  });
  it('stops at 00:00 and never goes negative', async () => {
    await setup();
    tick(901_000);
    expect(screen.getByText('Access token expires in 00:00')).toBeTruthy();
  });
  it('stops the interval on unmount', async () => {
    const clear = vi.spyOn(globalThis, 'clearInterval');
    const view = render(
      <ToastProvider>
        <AuthContext.Provider value={makeAuth()}>
          <SecurityPage />
        </AuthContext.Provider>
      </ToastProvider>
    );
    await act(async () => {});
    view.unmount();
    expect(clear).toHaveBeenCalled();
  });
  it('Refresh now calls auth.refreshNow and toasts', async () => {
    const { user, auth } = await setup();
    await user.click(screen.getByRole('button', { name: 'Refresh now' }));
    await flush();
    expect(auth.refreshNow).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Access token refreshed').length).toBeGreaterThan(0);
  });
  it('toasts an error when refresh fails', async () => {
    const { user } = await setup(makeAuth({ refreshNow: vi.fn().mockRejectedValue({ message: 'Refresh failed' }) }));
    await user.click(screen.getByRole('button', { name: 'Refresh now' }));
    await flush();
    expect(screen.getByText('Refresh failed')).toBeTruthy();
  });
  it('copes with a missing session', async () => {
    await setup(makeAuth({ session: { expiresAt: null, claims: null, refreshCount: 0 } }));
    expect(screen.getByText('No access token claims available.')).toBeTruthy();
    expect(screen.queryByText(/expires in/)).toBeNull();
  });
});

describe('SecurityPage sessions', () => {
  it('lists sessions with browser, remember and the current badge', async () => {
    await setup();
    const card = screen.getByRole('region', { name: 'Active sessions' });
    expect(within(card).getAllByRole('listitem')).toHaveLength(2);
    expect(within(card).getByText('Chrome on macOS')).toBeTruthy();
    expect(within(card).getByText('Firefox on Windows')).toBeTruthy();
    expect(within(card).getByText('This device')).toBeTruthy();
    expect(within(card).getByText(/^Remembered/)).toBeTruthy();
    expect(within(card).getByText(/^Not remembered/)).toBeTruthy();
  });
  it('offers Sign out only for other sessions', async () => {
    await setup();
    expect(screen.getAllByRole('button', { name: 'Sign out' })).toHaveLength(1);
  });
  it('revokes another session after confirming', async () => {
    revokeSession.mockResolvedValue();
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(revokeSession).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm sign out' }));
    await flush();
    expect(revokeSession).toHaveBeenCalledWith('s2');
    expect(screen.queryByText('Firefox on Windows')).toBeNull();
  });
  it('can cancel the confirm', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });
  it('keeps the session and toasts when revoke fails', async () => {
    revokeSession.mockRejectedValue({ message: 'Revoke failed' });
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.click(screen.getByRole('button', { name: 'Confirm sign out' }));
    await flush();
    expect(screen.getByText('Revoke failed')).toBeTruthy();
    expect(screen.getByText('Firefox on Windows')).toBeTruthy();
  });
  it('shows an error with Retry when listing fails', async () => {
    listSessions.mockRejectedValueOnce({ message: 'List failed' });
    const { user } = await setup();
    expect(screen.getByText('List failed')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await flush();
    expect(screen.getByText('Chrome on macOS')).toBeTruthy();
  });
});

describe('SecurityPage email and explanations', () => {
  it('shows verified status without a resend button', async () => {
    await setup();
    const card = screen.getByRole('region', { name: 'Email' });
    expect(within(card).getByText('Verified')).toBeTruthy();
    expect(within(card).queryByRole('button')).toBeNull();
  });
  it('shows not verified and resends', async () => {
    resendVerification.mockResolvedValue({});
    const auth = makeAuth({ user: { id: 'u1', name: 'Ada', email: 'ada@x.dev', role: 'member', emailVerified: false } });
    const { user } = await setup(auth);
    expect(screen.getByText('Not verified')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));
    await flush();
    expect(resendVerification).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/verification email sent/i)).toBeTruthy();
  });
  it('toasts when resend fails', async () => {
    resendVerification.mockRejectedValue({ message: 'Mail is down' });
    const auth = makeAuth({ user: { id: 'u1', name: 'Ada', email: 'ada@x.dev', role: 'member', emailVerified: false } });
    const { user } = await setup(auth);
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));
    await flush();
    expect(screen.getByText('Mail is down')).toBeTruthy();
  });
  it('lists how the system works', async () => {
    await setup();
    const card = screen.getByRole('region', { name: 'How this works' });
    for (const t of ['Access token:', 'Refresh token rotation:', 'Remember me:', 'Auto-logout:']) {
      expect(within(card).getByText(t)).toBeTruthy();
    }
  });
});
