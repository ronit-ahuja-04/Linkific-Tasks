import { combineReducers, configureStore } from '@reduxjs/toolkit';
import theme from './slices/themeSlice.js';
import auth from './slices/authSlice.js';
import cart from './slices/cartSlice.js';
import tasks from './slices/tasksSlice.js';
import announcements from './slices/announcementsSlice.js';
import schedule from './slices/scheduleSlice.js';
import laps from './slices/lapsSlice.js';
import toasts from './slices/toastsSlice.js';
import ui from './slices/uiSlice.js';
import users from './slices/usersSlice.js';
import wishlist from './slices/wishlistSlice.js';
import { loadPersistedState, startPersisting } from './persist.js';

// combineReducers: each key becomes one branch of the state tree, e.g. state.cart.items
export const rootReducer = combineReducers({
  theme,
  auth,
  cart,
  tasks,
  announcements,
  schedule,
  laps,
  toasts,
  ui,
  users,
  wishlist,
});

/** Factory so tests can build a fresh store; the app uses the `store` singleton below */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Redux DevTools: on in development (time travel, action replay, state inspector)
    devTools: import.meta.env?.DEV !== false && { name: 'HackHQ', trace: true, traceLimit: 25 },
  });
}

export const store = makeStore(loadPersistedState());
startPersisting(store);
