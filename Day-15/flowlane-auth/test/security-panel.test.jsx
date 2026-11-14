// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import SecurityPanel from '../src/components/SecurityPanel.jsx';

const RAW_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1MSJ9.SECRETSIGNATURE';

const h = vi.hoisted(() => ({ auth: {}, github: {}, getMe: vi.fn() }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => h.auth }));
vi.mock('../src/context/GitHubContext', () => ({ useGitHub: () => h.github }));
vi.mock('../src/api/github', () => ({ getMe: (...a) => h.getMe(...a) }));

const NOW = new Date('2026-01-01T12:00:00Z').getTime();

function makeInfo(over = {}) {
  return {
    token: RAW_TOKEN,
    claims: { iss: 'https://securetoken.google.com/demo', aud: 'demo', sub: 'uid-123', email: 'ana@example.com' },
    issuedAt: NOW - 60_000,
    expiresAt: NOW + 3_600_000,
    authTime: NOW - 120_000,
    signInProvider: 'password',
    ...over,
  };
}

function setup({ auth = {}, github = {}, lang } = {}) {
  h.auth = {
    user: { uid: 'u1', email: 'ana@example.com', emailVerified: true, providerIds: ['password', 'google.com'] },
    getTokenInfo: vi.fn().mockResolvedValue(makeInfo()),
    refreshToken: vi.fn().mockResolvedValue(makeInfo({ expiresAt: NOW + 7_200_000 })),
    resendVerification: vi.fn().mockResolvedValue(true),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    ...auth,
  };
  h.github = {
    connected: false, connecting: false, linked: false, githubLogin: null, error: null,
    connect: vi.fn().mockResolvedValue(true), unlink: vi.fn().mockResolvedValue(true), disconnect: vi.fn(),
    ...github,
  };
  if (lang) localStorage.setItem('flowlane-language', lang);
  return render(
    <LanguageProvider><ToastProvider><SecurityPanel /></ToastProvider></LanguageProvider>,
  );
}

beforeEach(() => { localStorage.clear(); h.getMe.mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('SecurityPanel: ID token card', () => {
  it('shows a loading state until getTokenInfo resolves', async () => {
    let resolve;
    setup({ auth: { getTokenInfo: vi.fn(() => new Promise((r) => { resolve = r; })) } });
    expect(screen.getByText(/Reading your ID token/)).toBeTruthy();
    await act(async () => {});
    expect(screen.getByText(/Reading your ID token/)).toBeTruthy();
    await act(async () => resolve(makeInfo()));
    expect(screen.queryByText(/Reading your ID token/)).toBeNull();
    expect(screen.getByText('uid-123')).toBeTruthy();
  });

  it('shows an error state when there is no token info', async () => {
    setup({ auth: { getTokenInfo: vi.fn().mockResolvedValue(null) } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/No ID token/);
  });

  it('shows an error state when getTokenInfo throws', async () => {
    setup({ auth: { getTokenInfo: vi.fn().mockRejectedValue(new Error('x')) } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/No ID token/);
  });

  it('renders the decoded claims in a definition list including the provider', async () => {
    const { container } = setup();
    await screen.findByText('uid-123');
    expect(container.querySelector('dl')).toBeTruthy();
    expect(screen.getByText('https://securetoken.google.com/demo')).toBeTruthy();
    expect(screen.getByText('demo')).toBeTruthy();
    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('password')).toBeTruthy();
  });

  it('shows dates as readable text and not as raw numbers', async () => {
    setup();
    await screen.findByText('uid-123');
    expect(screen.queryByText(String(NOW + 3_600_000))).toBeNull();
    expect(screen.getAllByText(/2026/).length).toBeGreaterThanOrEqual(3);
  });

  it('never renders the raw token or its signature', async () => {
    const { container } = setup();
    await screen.findByText('uid-123');
    expect(container.innerHTML).not.toContain(RAW_TOKEN);
    expect(container.innerHTML).not.toContain('SECRETSIGNATURE');
  });

  it('does not log anything to the console', async () => {
    const spies = ['log', 'warn', 'error'].map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    setup();
    await screen.findByText('uid-123');
    spies.forEach((s) => expect(s).not.toHaveBeenCalled());
    spies.forEach((s) => s.mockRestore());
  });

  it('counts down live with a timer', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(NOW);
    setup({ auth: { getTokenInfo: vi.fn().mockResolvedValue(makeInfo({ expiresAt: NOW + 125_000 })) } });
    await act(async () => {});
    expect(screen.getByTestId('token-countdown').textContent).toBe('02:05');
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.getByTestId('token-countdown').textContent).toBe('02:00');
  });

  it('says Expired when the time is up and stops at zero', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(NOW);
    setup({ auth: { getTokenInfo: vi.fn().mockResolvedValue(makeInfo({ expiresAt: NOW + 2000 })) } });
    await act(async () => {});
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByTestId('token-countdown').textContent).toBe('Expired');
  });

  it('clears the interval on unmount', async () => {
    const clear = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = setup();
    await screen.findByText('uid-123');
    unmount();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });

  it('Refresh token now calls refreshToken, updates the expiry and toasts', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(NOW);
    setup({ auth: { getTokenInfo: vi.fn().mockResolvedValue(makeInfo({ expiresAt: NOW + 60_000 })) } });
    await act(async () => {});
    expect(screen.getByTestId('token-countdown').textContent).toBe('01:00');
    await act(async () => { screen.getByRole('button', { name: 'Refresh token now' }).click(); });
    expect(h.auth.refreshToken).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('token-countdown').textContent).toBe('120:00');
    expect(screen.getByText('Token refreshed')).toBeTruthy();
  });

  it('shows an error toast when the refresh fails', async () => {
    setup({ auth: { refreshToken: vi.fn().mockResolvedValue(null) } });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Refresh token now' }));
    expect(await screen.findByText('Could not refresh the token')).toBeTruthy();
  });
});

describe('SecurityPanel: What the server sees', () => {
  it('shows the verified claims the API returns', async () => {
    h.getMe.mockResolvedValue({ uid: 'srv-uid', email: 'srv@example.com', provider: 'google.com', verifiedBy: 'google-certificate', expiresAt: NOW });
    setup();
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Ask the API' }));
    expect(await screen.findByText('srv-uid')).toBeTruthy();
    expect(screen.getByText('google-certificate')).toBeTruthy();
    expect(screen.getByText('srv@example.com')).toBeTruthy();
  });

  it('shows a friendly message for a 401', async () => {
    h.getMe.mockRejectedValue({ status: 401, code: 'unauthorized' });
    setup();
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Ask the API' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/rejected your token/);
  });

  it('shows a friendly message for a network error', async () => {
    h.getMe.mockRejectedValue({ code: 'network_error' });
    setup();
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Ask the API' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Could not reach the API/);
  });

  it('shows a generic message for other errors and clears it on success', async () => {
    h.getMe.mockRejectedValueOnce({ status: 500 });
    h.getMe.mockResolvedValueOnce({ uid: 'ok-uid' });
    setup();
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Ask the API' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/returned an error/);
    await userEvent.click(screen.getByRole('button', { name: 'Ask the API' }));
    expect(await screen.findByText('ok-uid')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('SecurityPanel: Sign-in methods', () => {
  it('lists providers with friendly names', async () => {
    setup();
    await screen.findByText('uid-123');
    expect(screen.getByText('Email and password')).toBeTruthy();
    expect(screen.getByText('Google')).toBeTruthy();
  });

  it('offers Link GitHub when not linked and runs the link flow, then re-fetches', async () => {
    setup();
    await screen.findByText('uid-123');
    expect(h.auth.getTokenInfo).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Link GitHub' }));
    expect(h.github.connect).toHaveBeenCalled();
    await waitFor(() => expect(h.auth.getTokenInfo).toHaveBeenCalledTimes(2));
    expect(h.auth.refreshUser).toHaveBeenCalled();
    expect(await screen.findByText('GitHub linked')).toBeTruthy();
  });

  it('does not re-fetch when linking is cancelled', async () => {
    setup({ github: { connect: vi.fn().mockResolvedValue(false) } });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Link GitHub' }));
    expect(h.auth.getTokenInfo).toHaveBeenCalledTimes(1);
  });

  it('unlinks GitHub when another method remains', async () => {
    setup({
      auth: { user: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerIds: ['password', 'github.com'] } },
      github: { linked: true },
    });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Unlink GitHub' }));
    expect(h.github.unlink).toHaveBeenCalled();
    await waitFor(() => expect(h.auth.getTokenInfo).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('GitHub unlinked')).toBeTruthy();
  });

  it('refuses to unlink the last sign-in method', async () => {
    setup({
      auth: { user: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerIds: ['github.com'] } },
      github: { linked: true },
    });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Unlink GitHub' }));
    expect(h.github.unlink).not.toHaveBeenCalled();
    expect((await screen.findByRole('alert')).textContent).toMatch(/only sign-in method/);
  });

  it('shows the GitHub login when known', async () => {
    setup({ github: { githubLogin: 'octocat', linked: true } });
    await screen.findByText('uid-123');
    expect(screen.getByText('GitHub account: octocat')).toBeTruthy();
  });

  it('Forget GitHub token appears only when connected and disconnects', async () => {
    setup();
    await screen.findByText('uid-123');
    expect(screen.queryByRole('button', { name: 'Forget GitHub token' })).toBeNull();
    cleanup();
    setup({ github: { connected: true } });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Forget GitHub token' }));
    expect(h.github.disconnect).toHaveBeenCalled();
    expect(await screen.findByText('GitHub token forgotten')).toBeTruthy();
  });

  it('shows friendly translated errors from useGitHub().error', async () => {
    setup({ github: { error: { code: 'credential_in_use', message: 'raw' } } });
    await screen.findByText('uid-123');
    expect(screen.getByRole('alert').textContent).toMatch(/already linked to another/);
    expect(screen.queryByText('raw')).toBeNull();
  });

  it('falls back to the unknown message for unexpected error codes', async () => {
    setup({ github: { error: { code: 'weird', message: 'raw' } } });
    await screen.findByText('uid-123');
    expect(screen.getByRole('alert').textContent).toMatch(/Something went wrong with GitHub/);
  });
});

describe('SecurityPanel: Email and sessions', () => {
  it('shows the Verified badge and no actions for a verified email', async () => {
    setup();
    await screen.findByText('uid-123');
    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Resend verification email' })).toBeNull();
  });

  it('resends the verification email', async () => {
    setup({ auth: { user: { uid: 'u1', email: 'a@b.c', emailVerified: false, providerIds: ['password'] } } });
    await screen.findByText('uid-123');
    expect(screen.getByText('Not verified')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
    expect(h.auth.resendVerification).toHaveBeenCalled();
    expect(await screen.findByText('Verification email sent')).toBeTruthy();
  });

  it('shows an error toast when resending fails', async () => {
    setup({ auth: { user: { uid: 'u1', email: 'a@b.c', emailVerified: false, providerIds: ['password'] }, resendVerification: vi.fn().mockResolvedValue(false) } });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
    expect(await screen.findByText('Could not send the email')).toBeTruthy();
  });

  it("I've verified calls refreshUser", async () => {
    setup({ auth: { user: { uid: 'u1', email: 'a@b.c', emailVerified: false, providerIds: ['password'] } } });
    await screen.findByText('uid-123');
    await userEvent.click(screen.getByRole('button', { name: "I've verified" }));
    expect(h.auth.refreshUser).toHaveBeenCalled();
  });

  it('explains how sessions work', async () => {
    setup();
    await screen.findByText('uid-123');
    expect(screen.getByRole('heading', { name: 'How sessions work' })).toBeTruthy();
    expect(screen.getByText(/30 minutes without activity/)).toBeTruthy();
    expect(screen.getByText(/only in memory/)).toBeTruthy();
  });

  it('is translated to Spanish', async () => {
    setup({ lang: 'es' });
    expect(await screen.findByText('Tu token de identidad')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Renovar token ahora' })).toBeTruthy();
  });
});
