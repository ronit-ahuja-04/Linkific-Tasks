// GitHub OAuth 2.0 "authorization code" flow, performed by the SERVER so the client secret
// never reaches the browser. A provider has: enabled, authorizeUrl(state), exchange(code).
// exchange() returns a normalised profile: { id, login, name, email, emailVerified, avatarUrl }.

const TIMEOUT = 10_000;

export function createGithubProvider({ clientId, clientSecret, callbackUrl }) {
  const enabled = Boolean(clientId && clientSecret);

  const json = async (url, init) => {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error(`GitHub request failed (${res.status})`);
    return res.json();
  };

  return {
    enabled,
    authorizeUrl(state) {
      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', callbackUrl);
      url.searchParams.set('scope', 'read:user user:email');
      url.searchParams.set('state', state);
      return url.toString();
    },
    async exchange(code) {
      const tokenRes = await json('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUrl }),
      });
      if (!tokenRes.access_token) throw new Error('GitHub did not return an access token');
      const headers = {
        Authorization: `Bearer ${tokenRes.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'flowlane-auth',
      };
      const profile = await json('https://api.github.com/user', { headers });
      const emails = await json('https://api.github.com/user/emails', { headers });
      // Only trust an email GitHub itself has verified (otherwise anyone could claim anyone's email).
      const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : null;
      return {
        id: String(profile.id),
        login: profile.login,
        name: profile.name || profile.login,
        email: primary ? primary.email : null,
        emailVerified: Boolean(primary),
        avatarUrl: profile.avatar_url || null,
      };
    },
  };
}

// Development/test stand-in: no network, no GitHub account needed.
export function createFakeGithubProvider() {
  return {
    enabled: true,
    fake: true,
    authorizeUrl: (state) => `/api/dev/fake-github?state=${encodeURIComponent(state)}`,
    async exchange(code) {
      if (code !== 'fake-code') throw new Error('Bad code');
      return {
        id: 'fake-1001',
        login: 'octocat',
        name: 'The Octocat',
        email: 'octocat@example.com',
        emailVerified: true,
        avatarUrl: null,
      };
    },
  };
}
