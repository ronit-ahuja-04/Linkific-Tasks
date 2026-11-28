import { configureStore } from '@reduxjs/toolkit';
import auth, { type AuthState } from '../features/auth/authSlice';
import toast from '../features/toast/toastSlice';

const initialAuth: AuthState = {
  status: 'checking',
  profile: null,
  busy: false,
  error: null,
  notice: null,
};

export function createAppStore(preloaded?: { auth?: Partial<AuthState> }) {
  return configureStore({
    reducer: { auth, toast },
    preloadedState: preloaded?.auth
      ? { auth: { ...initialAuth, ...preloaded.auth }, toast: [] }
      : undefined,
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
