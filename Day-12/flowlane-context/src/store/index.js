import { combineReducers, configureStore } from '@reduxjs/toolkit';
import users from './slices/usersSlice';
import projects from './slices/projectsSlice';
import board from './slices/boardSlice';
import invitations from './slices/invitationsSlice';
import notifications from './slices/notificationsSlice';
import ui from './slices/uiSlice';
import { getSessionUser } from '../lib/session';

// Each key is one slice of the state tree: state.board, state.projects, ...
// The signed-in user and the theme are NOT here: they live in React Context (src/context/).
export const rootReducer = combineReducers({
  users,
  projects,
  board,
  invitations,
  notifications,
  ui,
});

/**
 * Factory so tests can build a fresh store; the app uses the `store` singleton below.
 *
 * `getUser` is how thunks learn who is signed in. The user lives in the AuthContext, which Redux
 * cannot reach, so it is passed in as the thunk "extra argument": every thunk receives
 * `{ extra: { getUser } }` and calls `extra.getUser()`.
 */
export function makeStore(preloadedState, { getUser = getSessionUser } = {}) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument: { getUser } } }),
    // Redux DevTools: on outside production (inspect, diff, time travel, replay)
    devTools: import.meta.env?.PROD ? false : { name: 'FlowLane' },
  });
}

export const store = makeStore(undefined, { getUser: getSessionUser });
