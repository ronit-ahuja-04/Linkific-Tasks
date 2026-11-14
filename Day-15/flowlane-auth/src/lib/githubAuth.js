import { GithubAuthProvider } from 'firebase/auth';

/**
 * Small pure helpers around the Firebase GitHub popup (kept out of the React context so they are
 * easy to test).
 */

export const GITHUB_PROVIDER_ID = 'github.com';

/** Does the Firebase user (plain object from AuthContext) have GitHub as a sign-in method? */
export const hasGithubProvider = (user) => Boolean(user?.providerIds?.includes(GITHUB_PROVIDER_ID));

/**
 * The OAuth access token for GitHub's own API. Firebase hands it to us once, in the popup result.
 * (It is NOT the Firebase ID token: that one proves who you are to OUR server, this one lets the
 * server act on GitHub for you.)
 */
export const tokenFromResult = (result) => GithubAuthProvider.credentialFromResult(result)?.accessToken ?? null;

/** The GitHub username, read defensively (the SDK exposes it in a few places). */
export function loginFromResult(result) {
  const login =
    result?.additionalUserInfo?.username ??
    result?._tokenResponse?.screenName ??
    result?.user?.reloadUserInfo?.screenName ??
    null;
  return typeof login === 'string' && login ? login : null;
}

/**
 * Firebase error -> { code, message } for the UI, or null when nothing should be shown
 * (closing the popup is the user's choice, not an error).
 */
export function mapGithubAuthError(error) {
  const firebaseCode = error?.code ?? '';
  if (firebaseCode === 'auth/popup-closed-by-user' || firebaseCode === 'auth/cancelled-popup-request') {
    return null;
  }
  if (firebaseCode === 'auth/credential-already-in-use') {
    return { code: 'credential_in_use', message: 'That GitHub account is already linked to another user.' };
  }
  return { code: 'unknown', message: error?.message || 'Could not connect GitHub.' };
}
