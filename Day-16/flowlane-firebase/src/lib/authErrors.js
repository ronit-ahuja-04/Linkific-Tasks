/**
 * Friendly messages for the Firebase Auth error codes people actually meet.
 *
 * Firebase errors look like { code: 'auth/invalid-credential', message: 'Firebase: Error (...)' }.
 * The message is for developers; users should see a sentence in their language. This file only
 * maps a CODE to a translation KEY, because AuthProvider sits above the LanguageProvider and
 * cannot translate by itself: the page calls t(key).
 */
const KEYS = {
  // Firebase now answers "invalid-credential" for both an unknown email and a wrong password, so
  // an attacker cannot learn which emails have an account (email enumeration protection).
  'auth/invalid-credential': 'account.error.invalidCredential',
  'auth/wrong-password': 'account.error.invalidCredential',
  'auth/user-not-found': 'account.error.invalidCredential',
  'auth/invalid-login-credentials': 'account.error.invalidCredential',
  'auth/email-already-in-use': 'account.error.emailInUse',
  'auth/weak-password': 'account.error.weakPassword',
  'auth/too-many-requests': 'account.error.tooManyRequests',
  'auth/network-request-failed': 'account.error.network',
  'auth/account-exists-with-different-credential': 'account.error.accountExists',
  'auth/popup-blocked': 'account.error.popupBlocked',
  'auth/user-disabled': 'account.error.userDisabled',
  'auth/invalid-email': 'account.error.invalidEmail',
  // The provider (GitHub, Google...) is not switched on in the Firebase console for this project
  'auth/operation-not-allowed': 'account.error.providerOff',
};

/** The user closed the popup on purpose: not an error, show nothing */
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

export const isSilentAuthError = (code) => SILENT.has(code);

/** Translation key for a Firebase error code, or null when we have no friendly text for it */
export const errorKeyFor = (code) => KEYS[code] ?? null;
