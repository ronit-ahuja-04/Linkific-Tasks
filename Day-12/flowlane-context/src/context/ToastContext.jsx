import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
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
 * 2. SPLIT CONTEXTS, again. `useToast()` returns the actions and never changes, so a component
 *    that only *shows* toasts (a button handler) never re-renders when a toast appears or
 *    disappears. Only the viewport that draws them reads the list.
 */
const ToastStateContext = createContext(null);
const ToastActionsContext = createContext(null);

export const MAX_VISIBLE_TOASTS = 4;
export const DEFAULT_DURATION = { success: 4000, info: 4000, error: 7000 };

/** Pure reducer: the whole behaviour of the toast list, testable without React */
export function toastReducer(state, action) {
  switch (action.type) {
    case 'add':
      // newest last; when there are too many, the oldest is dropped
      return [...state, action.toast].slice(-MAX_VISIBLE_TOASTS);
    case 'dismiss':
      return state.filter((toast) => toast.id !== action.id);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const counter = useRef(0);

  const show = useCallback((message, { type = 'info', duration } = {}) => {
    counter.current += 1;
    const id = `toast-${counter.current}`;
    dispatch({ type: 'add', toast: { id, type, message, duration: duration ?? DEFAULT_DURATION[type] } });
    return id;
  }, []);
  const dismiss = useCallback((id) => dispatch({ type: 'dismiss', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  // Created once: none of these change, so consumers of useToast() never re-render
  const actions = useMemo(
    () => ({
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

/** The list of toasts currently on screen. Used by the viewport only. */
export function useToasts() {
  const context = useContext(ToastStateContext);
  if (context === null) throw new Error('useToasts must be used inside a <ToastProvider>.');
  return context;
}

/** Actions: { show, success, error, info, dismiss, clear }. Stable, never re-renders the caller. */
export function useToast() {
  const context = useContext(ToastActionsContext);
  if (context === null) throw new Error('useToast must be used inside a <ToastProvider>.');
  return context;
}
