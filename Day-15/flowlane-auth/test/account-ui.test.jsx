// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mockAuth = vi.hoisted(() => ({ value: {} }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => mockAuth.value }));
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ auth: { name: 'auth' }, db: {}, googleProvider: {}, githubProvider: {}, isFirebaseConfigured: true }));

import { authMock } from './mocks/auth.js';
import { LanguageProvider } from '../src/context/LanguageContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ProtectedRoute, PublicOnlyRoute } from '../src/components/RouteGuards';
import { returnPath } from '../src/lib/session';
import PasswordStrength from '../src/components/PasswordStrength';
import PasswordField from '../src/components/PasswordField';
import VerifyEmailBanner from '../src/components/VerifyEmailBanner';
import Auth from '../src/pages/Auth';
import ForgotPassword from '../src/pages/ForgotPassword';
import AuthAction from '../src/pages/AuthAction';
import { DICTIONARIES } from '../src/i18n';

const en = DICTIONARIES.en;
const ann = { uid: 'u1', email: 'ann@x.com', displayName: 'Ann', emailVerified: false, providerIds: ['password'] };

const baseAuth = () => ({
  user: null, status: 'unauthenticated', busy: false, error: null, errorCode: null, notice: null,
  signIn: vi.fn().mockResolvedValue(false), signUp: vi.fn().mockResolvedValue(false),
  signInWithGoogle: vi.fn().mockResolvedValue(false), signInWithGithub: vi.fn().mockResolvedValue(false),
  sendPasswordReset: vi.fn().mockResolvedValue(true), resendVerification: vi.fn().mockResolvedValue(true),
  refreshUser: vi.fn().mockResolvedValue(null), clearError: vi.fn(), clearNotice: vi.fn(),
});

function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname + loc.search}</div>;
}
const wrap = (ui, entries = ['/']) => render(
  <LanguageProvider><ToastProvider><MemoryRouter initialEntries={entries}>{ui}<Where /></MemoryRouter></ToastProvider></LanguageProvider>
);

beforeEach(() => {
  mockAuth.value = baseAuth();
  Object.values(authMock).forEach((m) => m.mockClear?.());
  authMock.applyActionCode.mockResolvedValue(undefined);
  authMock.verifyPasswordResetCode.mockResolvedValue('user@example.com');
  authMock.confirmPasswordReset.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('RouteGuards', () => {
  const routes = (
    <Routes>
      <Route path="/auth" element={<PublicOnlyRoute><div>AUTH PAGE</div></PublicOnlyRoute>} />
      <Route path="/*" element={<ProtectedRoute><div>PRIVATE</div></ProtectedRoute>} />
    </Routes>
  );
  it('sends anonymous visitors to /auth', () => {
    wrap(routes, ['/projects/p1?tab=x']);
    expect(screen.getByText('AUTH PAGE')).toBeTruthy();
    expect(screen.getByTestId('where').textContent).toBe('/auth');
  });
  it('lets signed-in users in', () => {
    mockAuth.value = { ...baseAuth(), user: ann };
    wrap(routes, ['/projects/p1']);
    expect(screen.getByText('PRIVATE')).toBeTruthy();
  });
  it('bounces a signed-in user away from /auth to the page they wanted (from state)', () => {
    mockAuth.value = { ...baseAuth(), user: ann };
    wrap(routes, [{ pathname: '/auth', state: { from: { pathname: '/projects/p1', search: '?x=1' } } }]);
    expect(screen.getByTestId('where').textContent).toBe('/projects/p1?x=1');
  });
  it('bounces to / without a from', () => {
    mockAuth.value = { ...baseAuth(), user: ann };
    wrap(routes, ['/auth']);
    expect(screen.getByTestId('where').textContent).toBe('/');
  });
  describe('what is remembered for after sign-in', () => {
    // shows the router state the /auth page receives
    function StateProbe() {
      const location = useLocation();
      return <div data-testid="from">{location.state?.from?.pathname ?? 'none'}</div>;
    }
    const probeRoutes = (
      <Routes>
        <Route path="/auth" element={<StateProbe />} />
        <Route path="/*" element={<ProtectedRoute><div>PRIVATE</div></ProtectedRoute>} />
      </Routes>
    );
    it('remembers the page an anonymous visitor wanted', () => {
      wrap(probeRoutes, ['/projects/p1']);
      expect(screen.getByTestId('from').textContent).toBe('/projects/p1');
    });
    it('remembers nothing after the user signed out themselves, so the next person starts at the dashboard', () => {
      mockAuth.value = { ...baseAuth(), signedOutByUser: true };
      wrap(probeRoutes, ['/projects/p1']);
      expect(screen.getByTestId('from').textContent).toBe('none');
    });
  });
  it('returnPath ignores missing state and sign-in pages', () => {
    expect(returnPath(undefined)).toBe('/');
    expect(returnPath({ from: { pathname: '/auth' } })).toBe('/');
    expect(returnPath({ from: { pathname: '/settings' } })).toBe('/settings');
  });
});

describe('PasswordStrength', () => {
  it('renders nothing visible for an empty password but keeps the live region', () => {
    render(<LanguageProvider><PasswordStrength password="" /></LanguageProvider>);
    expect(screen.getByTestId('password-strength').getAttribute('aria-live')).toBe('polite');
    expect(screen.queryByRole('meter')).toBeNull();
  });
  it('shows a text label, a meter value and tips for a weak password', () => {
    render(<LanguageProvider><PasswordStrength password="abc" /></LanguageProvider>);
    expect(screen.getByText(en['account.strength.label'].replace('{label}', en['account.strength.0']))).toBeTruthy();
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuenow')).toBe('0');
    expect(meter.getAttribute('aria-valuetext')).toBe('Too weak');
    expect(screen.getByText(en['account.suggest.length'])).toBeTruthy();
  });
  it('shows Strong and no tips for a long mixed password', () => {
    render(<LanguageProvider><PasswordStrength password="Tr0ub4dor&3-horse-Staple" /></LanguageProvider>);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('4');
    expect(screen.queryByRole('listitem')).toBeNull();
  });
  it('shows at most three tips', () => {
    render(<LanguageProvider><PasswordStrength password="aaaa" /></LanguageProvider>);
    expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(3);
  });
  it('uses the email to flag personal passwords', () => {
    render(<LanguageProvider><PasswordStrength password="annabelle-2024!" email="annabelle@x.com" /></LanguageProvider>);
    expect(screen.getByText(en['account.suggest.personal'])).toBeTruthy();
  });
});

describe('PasswordField', () => {
  it('toggles visibility and exposes aria-pressed', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><PasswordField id="pw" value="secret" onChange={() => {}} /></LanguageProvider>);
    const input = document.getElementById('pw');
    const toggle = screen.getByRole('button', { name: en['account.password.show'] });
    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await user.click(toggle);
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    await user.click(toggle);
    expect(input.type).toBe('password');
  });
  it('does not submit a form when toggled and passes props through', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const user = userEvent.setup();
    render(<LanguageProvider><form onSubmit={onSubmit}><PasswordField id="pw" value="" onChange={() => {}} autoComplete="new-password" placeholder="pw" required={false} /></form></LanguageProvider>);
    await user.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
    const input = screen.getByPlaceholderText('pw');
    expect(input.getAttribute('autocomplete')).toBe('new-password');
    expect(input.required).toBe(false);
  });
});

describe('VerifyEmailBanner', () => {
  const show = (user) => {
    mockAuth.value = { ...baseAuth(), user };
    return wrap(<VerifyEmailBanner />);
  };
  it('shows for an unverified password account', () => {
    show(ann);
    expect(screen.getByText(/ann@x.com/)).toBeTruthy();
    expect(screen.getByRole('button', { name: en['account.verify.resend'] })).toBeTruthy();
  });
  it.each([
    ['verified', { ...ann, emailVerified: true }],
    ['a Google account', { ...ann, providerIds: ['google.com'] }],
    ['signed out', null],
  ])('is hidden for %s', (_n, user) => {
    show(user);
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('resend: success toast', async () => {
    show(ann);
    await userEvent.click(screen.getByRole('button', { name: en['account.verify.resend'] }));
    expect(mockAuth.value.resendVerification).toHaveBeenCalled();
    expect(await screen.findByText(en['account.verify.sent'])).toBeTruthy();
  });
  it('resend: failure toast', async () => {
    show(ann);
    mockAuth.value.resendVerification.mockResolvedValue(false);
    await userEvent.click(screen.getByRole('button', { name: en['account.verify.resend'] }));
    expect(await screen.findByText(en['account.verify.sendFailed'])).toBeTruthy();
  });
  it("I've verified: success when the refreshed user is verified", async () => {
    show(ann);
    mockAuth.value.refreshUser.mockResolvedValue({ ...ann, emailVerified: true });
    await userEvent.click(screen.getByRole('button', { name: en['account.verify.check'] }));
    expect(await screen.findByText(en['account.verify.nowVerified'])).toBeTruthy();
  });
  it("I've verified: tells the user when it is still unverified", async () => {
    show(ann);
    mockAuth.value.refreshUser.mockResolvedValue(ann);
    await userEvent.click(screen.getByRole('button', { name: en['account.verify.check'] }));
    expect(await screen.findByText(en['account.verify.stillNot'])).toBeTruthy();
  });
  it("I've verified: error toast when reload fails", async () => {
    show(ann);
    mockAuth.value.refreshUser.mockRejectedValue(new Error('x'));
    await userEvent.click(screen.getByRole('button', { name: en['account.verify.check'] }));
    expect(await screen.findByText(en['account.verify.refreshFailed'])).toBeTruthy();
  });
});

describe('Auth page', () => {
  const page = (entries) => wrap(<Routes><Route path="/auth" element={<Auth />} /><Route path="*" element={<div>HOME</div>} /></Routes>, entries ?? ['/auth']);

  it('has Google and GitHub buttons, remember checked by default, forgot link on sign-in', () => {
    page();
    expect(screen.getByRole('button', { name: /Sign in with Google/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: en['account.github.signIn'] })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: en['account.remember'] }).checked).toBe(true);
    expect(screen.getByRole('link', { name: en['account.forgot.link'] }).getAttribute('href')).toBe('/forgot-password');
    expect(screen.queryByTestId('password-strength')).toBeNull();
  });
  it('sign-up mode hides the forgot link and shows the strength meter', async () => {
    page();
    await userEvent.click(screen.getByText(en['auth.switch.signUp']));
    expect(screen.queryByRole('link', { name: en['account.forgot.link'] })).toBeNull();
    expect(screen.getByTestId('password-strength')).toBeTruthy();
    await userEvent.type(document.getElementById('auth-password'), 'abc');
    expect(screen.getByRole('meter')).toBeTruthy();
  });
  it('submits with remember=true by default and goes home on success', async () => {
    mockAuth.value.signIn.mockResolvedValue(true);
    page();
    await userEvent.type(document.getElementById('auth-email'), 'a@x.com');
    await userEvent.type(document.getElementById('auth-password'), 'pw12345');
    await userEvent.click(screen.getByRole('button', { name: en['auth.submit.signIn'] }));
    expect(mockAuth.value.signIn).toHaveBeenCalledWith({ email: 'a@x.com', password: 'pw12345', remember: true });
    await waitFor(() => expect(screen.getByText('HOME')).toBeTruthy());
  });
  it('unchecking remember passes remember=false', async () => {
    page();
    await userEvent.click(screen.getByRole('checkbox', { name: en['account.remember'] }));
    await userEvent.type(document.getElementById('auth-email'), 'a@x.com');
    await userEvent.type(document.getElementById('auth-password'), 'pw12345');
    await userEvent.click(screen.getByRole('button', { name: en['auth.submit.signIn'] }));
    expect(mockAuth.value.signIn).toHaveBeenCalledWith(expect.objectContaining({ remember: false }));
  });
  it('sign-up calls signUp', async () => {
    page();
    await userEvent.click(screen.getByText(en['auth.switch.signUp']));
    await userEvent.type(document.getElementById('auth-email'), 'a@x.com');
    await userEvent.type(document.getElementById('auth-password'), 'Str0ng-pass!');
    await userEvent.click(screen.getByRole('button', { name: en['auth.submit.signUp'] }));
    expect(mockAuth.value.signUp).toHaveBeenCalledWith({ email: 'a@x.com', password: 'Str0ng-pass!', remember: true });
  });
  it('GitHub and Google buttons pass the remember choice', async () => {
    page();
    await userEvent.click(screen.getByRole('checkbox', { name: en['account.remember'] }));
    await userEvent.click(screen.getByRole('button', { name: en['account.github.signIn'] }));
    expect(mockAuth.value.signInWithGithub).toHaveBeenCalledWith({ remember: false });
    await userEvent.click(screen.getByRole('button', { name: /Sign in with Google/ }));
    expect(mockAuth.value.signInWithGoogle).toHaveBeenCalledWith({ remember: false });
  });
  it('returns to the page the visitor first asked for', async () => {
    mockAuth.value.signInWithGithub.mockResolvedValue(true);
    page([{ pathname: '/auth', state: { from: { pathname: '/settings', search: '' } } }]);
    await userEvent.click(screen.getByRole('button', { name: en['account.github.signIn'] }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/settings'));
  });
  it.each([['idle', 'account.notice.idle'], ['expired', 'account.notice.expired']])('shows the %s notice', (type, key) => {
    mockAuth.value.notice = { type };
    page();
    expect(screen.getByRole('status').textContent).toBe(en[key]);
  });
  it('shows no notice normally', () => {
    page();
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('translates known error codes', () => {
    mockAuth.value.error = 'Firebase: Error (auth/invalid-credential).';
    mockAuth.value.errorCode = 'auth/invalid-credential';
    page();
    expect(screen.getByRole('alert').textContent).toBe(en['account.error.invalidCredential']);
  });
  it('falls back to the raw message for unknown codes', () => {
    mockAuth.value.error = 'Something odd';
    mockAuth.value.errorCode = 'auth/something-new';
    page();
    expect(screen.getByRole('alert').textContent).toBe('Something odd');
  });
  it('shows the account-exists text for the GitHub case', () => {
    mockAuth.value.error = 'account.error.accountExists';
    mockAuth.value.errorCode = 'auth/account-exists-with-different-credential';
    page();
    expect(screen.getByRole('alert').textContent).toBe(en['account.error.accountExists']);
  });
});

describe('ForgotPassword page', () => {
  it('sends the reset email and shows the generic confirmation', async () => {
    wrap(<ForgotPassword />);
    await userEvent.type(screen.getByLabelText(en['auth.email.label']), ' a@x.com ');
    await userEvent.click(screen.getByRole('button', { name: en['account.forgot.submit'] }));
    expect(mockAuth.value.sendPasswordReset).toHaveBeenCalledWith('a@x.com');
    expect(await screen.findByText(en['account.forgot.sent'].replace('{email}', 'a@x.com'))).toBeTruthy();
    expect(screen.getByRole('link', { name: en['account.forgot.back'] }).getAttribute('href')).toBe('/auth');
  });
  it('stays on the form and shows the error when sending fails', async () => {
    mockAuth.value.sendPasswordReset.mockResolvedValue(false);
    mockAuth.value.error = 'Firebase: Error (auth/too-many-requests).';
    mockAuth.value.errorCode = 'auth/too-many-requests';
    wrap(<ForgotPassword />);
    await userEvent.type(screen.getByLabelText(en['auth.email.label']), 'a@x.com');
    await userEvent.click(screen.getByRole('button', { name: en['account.forgot.submit'] }));
    expect(screen.getByRole('alert').textContent).toBe(en['account.error.tooManyRequests']);
    expect(screen.queryByText(/we have sent/)).toBeNull();
  });
  it('disables the button while busy', () => {
    mockAuth.value.busy = true;
    wrap(<ForgotPassword />);
    expect(screen.getByRole('button', { name: en['account.forgot.submit'] }).disabled).toBe(true);
  });
});

describe('AuthAction page', () => {
  const action = (search) =>
    wrap(<Routes><Route path="/auth/action" element={<AuthAction />} /></Routes>, [`/auth/action${search}`]);

  it.each(['', '?mode=verifyEmail', '?oobCode=abc', '?mode=other&oobCode=abc'])('invalid or unknown link %s', (search) => {
    action(search);
    expect(screen.getByText(en['account.action.invalidTitle'])).toBeTruthy();
    expect(authMock.applyActionCode).not.toHaveBeenCalled();
  });

  describe('verifyEmail', () => {
    it('applies the code and shows success with a sign-in link when signed out', async () => {
      action('?mode=verifyEmail&oobCode=abc');
      expect(await screen.findByText(en['account.action.verifiedTitle'])).toBeTruthy();
      expect(authMock.applyActionCode).toHaveBeenCalledWith({ name: 'auth' }, 'abc');
      expect(screen.getByRole('link', { name: en['account.action.toSignIn'] }).getAttribute('href')).toBe('/auth');
    });
    it('refreshes the user and links to the app when signed in', async () => {
      mockAuth.value.user = ann;
      action('?mode=verifyEmail&oobCode=abc');
      expect(await screen.findByText(en['account.action.verifiedTitle'])).toBeTruthy();
      expect(mockAuth.value.refreshUser).toHaveBeenCalled();
      expect(screen.getByRole('link', { name: en['account.action.continue'] }).getAttribute('href')).toBe('/');
    });
    it('still succeeds when the refresh fails', async () => {
      mockAuth.value.refreshUser.mockRejectedValue(new Error('x'));
      action('?mode=verifyEmail&oobCode=abc');
      expect(await screen.findByText(en['account.action.verifiedTitle'])).toBeTruthy();
    });
    it('shows a friendly failure for an expired or used link', async () => {
      authMock.applyActionCode.mockRejectedValue({ code: 'auth/expired-action-code' });
      action('?mode=verifyEmail&oobCode=abc');
      expect(await screen.findByText(en['account.action.verifyFailTitle'])).toBeTruthy();
      expect(screen.getByRole('alert').textContent).toBe(en['account.action.verifyFailBody']);
      expect(mockAuth.value.refreshUser).not.toHaveBeenCalled();
    });
    it('applies the one-time code only once under StrictMode', async () => {
      const { StrictMode } = await import('react');
      render(
        <StrictMode><LanguageProvider><MemoryRouter initialEntries={['/auth/action?mode=verifyEmail&oobCode=abc']}>
          <Routes><Route path="/auth/action" element={<AuthAction />} /></Routes>
        </MemoryRouter></LanguageProvider></StrictMode>
      );
      expect(await screen.findByText(en['account.action.verifiedTitle'])).toBeTruthy();
      expect(authMock.applyActionCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    const open = () => action('?mode=resetPassword&oobCode=abc');
    const fill = async (pw, confirm) => {
      await userEvent.type(document.getElementById('reset-password'), pw);
      await userEvent.type(document.getElementById('reset-confirm'), confirm);
      await userEvent.click(screen.getByRole('button', { name: en['account.action.resetSubmit'] }));
    };
    it('shows which account is being reset, with a strength meter', async () => {
      open();
      expect(await screen.findByText(en['account.action.resetFor'].replace('{email}', 'user@example.com'))).toBeTruthy();
      expect(authMock.verifyPasswordResetCode).toHaveBeenCalledWith({ name: 'auth' }, 'abc');
      expect(screen.getByTestId('password-strength')).toBeTruthy();
    });
    it('verifies the code only once under StrictMode', async () => {
      const { StrictMode } = await import('react');
      render(
        <StrictMode><LanguageProvider><MemoryRouter initialEntries={['/auth/action?mode=resetPassword&oobCode=abc']}>
          <Routes><Route path="/auth/action" element={<AuthAction />} /></Routes>
        </MemoryRouter></LanguageProvider></StrictMode>
      );
      await screen.findByText(en['account.action.resetTitle']);
      expect(authMock.verifyPasswordResetCode).toHaveBeenCalledTimes(1);
    });
    it('saves a good password and offers to sign in', async () => {
      open();
      await screen.findByText(en['account.action.resetTitle']);
      await fill('Tr0ub4dor&3-horse', 'Tr0ub4dor&3-horse');
      expect(await screen.findByText(en['account.action.resetDoneTitle'])).toBeTruthy();
      expect(authMock.confirmPasswordReset).toHaveBeenCalledWith({ name: 'auth' }, 'abc', 'Tr0ub4dor&3-horse');
      expect(screen.getByRole('link', { name: en['account.action.toSignIn'] }).getAttribute('href')).toBe('/auth');
    });
    it('refuses a weak password', async () => {
      open();
      await screen.findByText(en['account.action.resetTitle']);
      await fill('abc', 'abc');
      expect(screen.getByRole('alert').textContent).toBe(en['account.error.weakChosen']);
      expect(authMock.confirmPasswordReset).not.toHaveBeenCalled();
    });
    it('refuses when the passwords differ', async () => {
      open();
      await screen.findByText(en['account.action.resetTitle']);
      await fill('Tr0ub4dor&3-horse', 'Tr0ub4dor&3-horsy');
      expect(screen.getByRole('alert').textContent).toBe(en['account.error.mismatch']);
      expect(authMock.confirmPasswordReset).not.toHaveBeenCalled();
    });
    it('shows the invalid-link page when the code is bad', async () => {
      authMock.verifyPasswordResetCode.mockRejectedValue({ code: 'auth/invalid-action-code' });
      open();
      expect(await screen.findByText(en['account.action.invalidTitle'])).toBeTruthy();
      expect(screen.getByRole('link', { name: en['account.forgot.title'] }).getAttribute('href')).toBe('/forgot-password');
    });
    it('goes to the invalid page when the code expires while typing', async () => {
      authMock.confirmPasswordReset.mockRejectedValue({ code: 'auth/expired-action-code' });
      open();
      await screen.findByText(en['account.action.resetTitle']);
      await fill('Tr0ub4dor&3-horse', 'Tr0ub4dor&3-horse');
      expect(await screen.findByText(en['account.action.invalidTitle'])).toBeTruthy();
    });
    it('shows a friendly message for other failures and keeps the form', async () => {
      authMock.confirmPasswordReset.mockRejectedValue({ code: 'auth/network-request-failed' });
      open();
      await screen.findByText(en['account.action.resetTitle']);
      await fill('Tr0ub4dor&3-horse', 'Tr0ub4dor&3-horse');
      expect((await screen.findByRole('alert')).textContent).toBe(en['account.error.network']);
    });
  });
});
