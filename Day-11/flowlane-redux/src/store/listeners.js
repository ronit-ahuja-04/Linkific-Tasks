import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { makeEmptyBoard } from '../lib/board';
import { docToPlain, toPlain } from '../lib/serialize';
import { authStateChanged } from './slices/authSlice';
import { loadUserTheme } from './slices/themeSlice';
import { ensureDefaultProject, projectRemoved, projectsReceived, projectsReset } from './slices/projectsSlice';
import { usersReceived } from './slices/usersSlice';
import { invitationsReceived, invitationsReset } from './slices/invitationsSlice';
import { notificationsReceived, notificationsReset, unreadMessagesChanged } from './slices/notificationsSlice';
import { boardReceived } from './slices/boardSlice';
import { activityFlagged } from './slices/uiSlice';

/**
 * Firestore -> Redux bridge. Each onSnapshot callback converts the snapshot to plain data and
 * dispatches an action; components never talk to Firestore for reading. Every function returns
 * an unsubscribe function, so React effects can clean up.
 */
/**
 * A project's own listeners are refused (permission-denied) when the project was deleted or the
 * user was removed from it: the rules cannot read a document that no longer exists. That is an
 * expected outcome, not a failure, so the project is dropped from the list and the UI moves on.
 */
const projectGone = (dispatch, projectId, label) => (err) => {
  if (err?.code === 'permission-denied') dispatch(projectRemoved(projectId));
  else logError(label)(err);
};

const logError = (label) => (err) => console.error(`${label} listener error: ${err?.code ?? 'unknown'}: ${err?.message ?? err}`);

/** Keep state.auth in sync with Firebase Auth and save the user's profile for invitations */
export function startAuthListener({ dispatch }) {
  if (!isFirebaseConfigured) {
    // No keys: nobody can be signed in, so report "signed out" and show the sign-in page
    console.warn('Firebase is not configured. Copy .env.example to .env and add your keys.');
    dispatch(authStateChanged(null));
    return () => {};
  }
  return onAuthStateChanged(auth, async (firebaseUser) => {
    dispatch(authStateChanged(firebaseUser));
    if (firebaseUser && isFirebaseConfigured) {
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL || null,
            lastSeen: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Firestore error (did you enable it in the console?):', error);
      }
    }
  });
}

/** Everything that belongs to the signed-in user: projects, people, notifications, invitations */
export function startUserListeners({ dispatch }, user) {
  const { uid, email } = user;
  dispatch(loadUserTheme(uid));

  // Ids of projects the server has confirmed at least once
  const confirmedProjects = new Set();

  const unsubscribers = [
    onSnapshot(
      query(collection(db, 'projects'), where('members', 'array-contains', uid)),
      // Metadata changes are included so we hear when a local write is confirmed by the server
      { includeMetadataChanges: true },
      (snapshot) => {
        // A project that was just created is visible locally before the server has it. Opening a
        // board listener on it at that moment is refused with permission-denied (the server
        // checks the rules against a document it does not have yet), so a project is only
        // published once the server has confirmed it. After that it stays published even while
        // later edits (a new task, a drag) are still waiting to be saved.
        const present = new Set(snapshot.docs.map((d) => d.id));
        for (const id of confirmedProjects) if (!present.has(id)) confirmedProjects.delete(id);
        for (const d of snapshot.docs) if (!d.metadata.hasPendingWrites) confirmedProjects.add(d.id);
        const items = snapshot.docs.filter((d) => confirmedProjects.has(d.id)).map(docToPlain);
        dispatch(projectsReceived(items));
        if (items.length === 0 && !snapshot.metadata.fromCache) dispatch(ensureDefaultProject());
      },
      logError('projects')
    ),
    onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const byId = {};
        snapshot.docs.forEach((d) => {
          byId[d.id] = docToPlain(d);
        });
        dispatch(usersReceived(byId));
      },
      logError('users')
    ),
    onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) dispatch(unreadMessagesChanged(snap.data().unreadMessages || 0));
      },
      logError('profile')
    ),
    onSnapshot(
      query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map(docToPlain);
        const added = snapshot
          .docChanges()
          .filter((change) => change.type === 'added')
          .map((change) => docToPlain(change.doc));
        dispatch(notificationsReceived({ items, added }));
      },
      logError('notifications')
    ),
    onSnapshot(
      query(collection(db, 'invitations'), where('inviteeEmail', '==', email)),
      (snapshot) => dispatch(invitationsReceived(snapshot.docs.map(docToPlain))),
      logError('invitations')
    ),
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    dispatch(projectsReset());
    dispatch(invitationsReset());
    dispatch(notificationsReset());
  };
}

/** The open project: its board, and a flag when someone else chats while you are on another tab */
export function startProjectListener({ dispatch, getState }, projectId, uid) {
  dispatch(activityFlagged(false));

  const unsubBoard = onSnapshot(
    doc(db, 'projects', projectId),
    (snap) => {
      if (!snap.exists()) return;
      const data = toPlain(snap.data());
      if (data.columns) {
        dispatch(
          boardReceived({
            projectId,
            tasks: data.tasks || {},
            columns: data.columns,
            columnOrder: data.columnOrder || [],
          })
        );
      } else {
        // First time this project is opened: give it an empty Kanban board
        dispatch(boardReceived({ projectId, ...makeEmptyBoard() }));
        setDoc(snap.ref, { ...snap.data(), ...makeEmptyBoard() }, { merge: true });
      }
    },
    projectGone(dispatch, projectId, 'board')
  );

  let isInitial = true;
  const unsubActivity = onSnapshot(
    query(collection(db, 'projects', projectId, 'messages'), orderBy('createdAt', 'desc'), limit(1)),
    (snapshot) => {
      if (isInitial) {
        isInitial = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && change.doc.data().uid !== uid && getState().ui.activeTab !== 'activity') {
          dispatch(activityFlagged(true));
        }
      });
    },
    projectGone(dispatch, projectId, 'activity')
  );

  return () => {
    unsubBoard();
    unsubActivity();
  };
}
