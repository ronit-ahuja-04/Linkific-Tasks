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
      }
    : null;
