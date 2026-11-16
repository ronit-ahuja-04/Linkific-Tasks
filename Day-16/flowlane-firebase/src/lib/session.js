/**
 * The bridge between React Context and Redux.
 *
 * The signed-in user lives in the AuthContext (React state). Redux thunks also need to know who is
 * signed in, but they run outside React and cannot call useContext. AuthProvider therefore
 * publishes the current user here, and the Redux store hands `getUser` to every thunk as its
 * "extra argument" (see store/index.js). Context stays the single owner of the user; Redux only
 * reads it.
 */
let currentUser = null;

export const getSessionUser = () => currentUser;
export const setSessionUser = (user) => {
  currentUser = user;
};

/** Firebase's user object is a large class instance. Only these plain fields are kept. */
export const toPlainUser = (user) =>
  user
    ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        // Has the user clicked the link in the verification email? Google and GitHub accounts
        // usually arrive already verified; password accounts start as false.
        emailVerified: Boolean(user.emailVerified),
        // How this account can sign in: 'password', 'google.com', 'github.com'
        providerIds: (user.providerData ?? []).map((p) => p.providerId).filter(Boolean),
      }
    : null;

/** Where to send someone after signing in: the page they tried to open, or the home page */
export function returnPath(state) {
  const from = state?.from;
  if (!from?.pathname) return '/';
  const path = `${from.pathname}${from.search ?? ''}`;
  // Never bounce back to a sign-in screen
  return path.startsWith('/auth') || path.startsWith('/forgot-password') ? '/' : path;
}
