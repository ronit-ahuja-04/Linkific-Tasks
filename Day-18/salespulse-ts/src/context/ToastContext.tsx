import { useCallback, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { createStrictContext } from '../lib/createStrictContext';
import ToastViewport from '../components/ToastViewport';

/**
 * TOAST CONTEXT: short messages ("Task created", "Language: Español") from anywhere in the app.
 *
 *   const toast = useToast();
 *   toast.success('Task created');
 *   toast.error('Could not save', { duration: 8000 });
 *
 * Two patterns on show here:
 *
 * 1. useReducer INSIDE a Context. The list of toasts changes through a few named actions (add,
 *    dismiss, clear), so a reducer is clearer than several setState calls, and it is a plain
 *    function that is easy to test (see `toastReducer`).
 *
 * 2. SPLIT CONTEXTS. `useToast()` returns the actions and never changes, so a component
 *    that only *shows* toasts (a button handler) never re-renders when a toast appears or
 *    disappears. Only the viewport that draws them reads the list.
 */
export type ToastType = 'success' | 'info' | 'error';
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}
export interface ToastOptions {
  type?: ToastType;
  /** milliseconds on screen */
  duration?: number;
}
export type ToastAction =
  | { type: 'add'; toast: Toast }
  | { type: 'dismiss'; id: string }
  | { type: 'clear' };
export interface ToastActions {
  show: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const [ToastStateContext, useToasts] = createStrictContext<Toast[]>('useToasts', 'ToastProvider');
const [ToastActionsContext, useToast] = createStrictContext<ToastActions>('useToast', 'ToastProvider');
/** The list of toasts currently on screen. Used by the viewport only. */
export { useToasts };
/** Actions: { show, success, error, info, dismiss, clear }. Stable, never re-renders the caller. */
export { useToast };

export const MAX_VISIBLE_TOASTS = 4;
export const DEFAULT_DURATION: Record<ToastType, number> = { success: 4000, info: 4000, error: 7000 };

/** Pure reducer: the whole behaviour of the toast list, testable without React */
export function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'add':
      // newest last; when there are too many, the oldest is dropped
      return [...state, action.toast].slice(-MAX_VISIBLE_TOASTS);
    case 'dismiss':
      return state.filter((toast) => toast.id !== action.id);
    case 'clear':
      return [];
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const counter = useRef(0);

  const show = useCallback((message: string, { type = 'info', duration }: ToastOptions = {}) => {
    counter.current += 1;
    const id = `toast-${counter.current}`;
    dispatch({ type: 'add', toast: { id, type, message, duration: duration ?? DEFAULT_DURATION[type] } });
    return id;
  }, []);
  const dismiss = useCallback((id: string) => dispatch({ type: 'dismiss', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  // Created once: none of these change, so consumers of useToast() never re-render
  const actions = useMemo(
    (): ToastActions => ({
      show,
      success: (message, options) => show(message, { ...options, type: 'success' }),
      error: (message, options) => show(message, { ...options, type: 'error' }),
      info: (message, options) => show(message, { ...options, type: 'info' }),
      dismiss,
      clear,
    }),
    [show, dismiss, clear]
  );

  return (
    <ToastStateContext.Provider value={toasts}>
      <ToastActionsContext.Provider value={actions}>
        {children}
        <ToastViewport />
      </ToastActionsContext.Provider>
    </ToastStateContext.Provider>
  );
}

