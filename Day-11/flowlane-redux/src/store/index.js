import { combineReducers, configureStore } from '@reduxjs/toolkit';
import auth from './slices/authSlice';
import theme from './slices/themeSlice';
import users from './slices/usersSlice';
import projects from './slices/projectsSlice';
import board from './slices/boardSlice';
import invitations from './slices/invitationsSlice';
import notifications from './slices/notificationsSlice';
import ui from './slices/uiSlice';

// Each key is one slice of the state tree: state.auth, state.board, ...
export const rootReducer = combineReducers({
  auth,
  theme,
  users,
  projects,
  board,
  invitations,
  notifications,
  ui,
});

/** Factory so tests can build a fresh store; the app uses the `store` singleton below */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Redux DevTools: on outside production (inspect, diff, time travel, replay)
    devTools: import.meta.env?.PROD ? false : { name: 'FlowLane' },
  });
}

export const store = makeStore();
