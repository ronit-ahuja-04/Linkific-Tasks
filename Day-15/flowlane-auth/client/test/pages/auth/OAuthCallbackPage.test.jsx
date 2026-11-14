// @vitest-environment jsdom
import { StrictMode } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OAuthCallbackPage from '../../../src/pages/auth/OAuthCallbackPage';
import { FakeApiError, makeAuth, renderPage } from './helpers';

const strict = (node) => <StrictMode>{node}</StrictMode>;
const setup = (auth) => renderPage(<OAuthCallbackPage />, { auth, path: '/oauth/callback', url: '/oauth/callback', wrapper: strict });

describe('OAuthCallbackPage', () => {
  it('shows a status message while finishing', () => {
    setup(makeAuth({ completeOAuth: vi.fn(() => new Promise(() => {})) }));
    expect(screen.getByRole('status')).toHaveTextContent('Finishing sign-in…');
    expect(document.title).toBe('Signing in · FlowLane');
  });

  it('completes once (StrictMode) and navigates to the dashboard on success', async () => {
    const auth = makeAuth();
    setup(auth);
    expect(await screen.findByTestId('where')).toHaveTextContent('/dashboard');
    expect(auth.completeOAuth).toHaveBeenCalledTimes(1);
  });

  it('navigates to the login page with oauth_failed on failure', async () => {
    const auth = makeAuth({ completeOAuth: vi.fn().mockRejectedValue(new FakeApiError({ code: 'refresh_invalid' })) });
    setup(auth);
    expect(await screen.findByTestId('where')).toHaveTextContent('/login?error=oauth_failed');
    expect(auth.completeOAuth).toHaveBeenCalledTimes(1);
  });
});
