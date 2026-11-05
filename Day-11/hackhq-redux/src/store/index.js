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
import notifications from './slices/notificationsSlice.js';
import badges from './slices/badgesSlice.js';
import activity from './slices/activitySlice.js';
import { makeHistoryReducer, withHistory } from './undoable.js';
import { activityLogger, badgeListener } from './middleware.js';
import { loadPersistedState, startPersisting } from './persist.js';

// combineReducers: each key becomes one branch of the state tree, e.g. state.cart.items
const UNDOABLE = ['tasks', 'cart'];

const combined = combineReducers({
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
  notifications,
  badges,
  activity,
  history: makeHistoryReducer(UNDOABLE),
});

// withHistory adds undo/redo for the checklist and the cart without touching their slices
export const rootReducer = withHistory(combined, UNDOABLE);

/** Factory so tests can build a fresh store; the app uses the `store` singleton below */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Listener middleware must come first; the activity logger goes last so it sees every action
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(badgeListener.middleware).concat(activityLogger),
    // Redux DevTools: on in development (time travel, action replay, state inspector)
    devTools: import.meta.env?.DEV !== false && { name: 'HackHQ', trace: true, traceLimit: 25 },
  });
}

export const store = makeStore(loadPersistedState());
startPersisting(store);
