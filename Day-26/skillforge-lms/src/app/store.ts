import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';
import { catalogReducer } from '../features/catalog/catalogSlice';
import { guildReducer } from '../features/guild/guildSlice';
import { questReducer } from '../features/quest/questSlice';
import { uiReducer } from '../features/ui/uiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  catalog: catalogReducer,
  guild: guildReducer,
  quest: questReducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
