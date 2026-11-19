import { createContext, useCallback, useContext, useMemo, useReducer, useState, type Context, type Dispatch, type ReactNode } from 'react';

/**
 * 06. Context API, typed.
 *
 * The problem: `createContext` needs a default value, but there is no real value until a Provider exists.
 * Three honest answers: (a) `T | undefined` plus a guarded hook, (b) a real default, (c) a factory that does (a) once.
 */

// ---- 1. The basic form: value type, Provider props, consumer hook ----

export interface AuthValue {
  user: string | null;
  login: (name: string) => void;
  logout: () => void;
}

/** `| undefined` is the "no Provider" state. It is never exposed: the hook below removes it. */
const AuthContext = createContext<AuthValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  /** start logged in (handy for tests) */
  initialUser?: string | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<string | null>(initialUser);
  const login = useCallback((name: string) => setUser(name), []);
  const logout = useCallback(() => setUser(null), []);
  const value = useMemo<AuthValue>(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** The consumer hook: callers get `AuthValue`, never `undefined`, and a clear error when the Provider is missing */
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (value === undefined) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

// ---- 2. A context with a real default: no guard needed, but the default must make sense alone ----

export type Theme = 'light' | 'dark';
export const ThemeContext = createContext<Theme>('light');
export const useTheme = (): Theme => useContext(ThemeContext);

// ---- 3. A generic factory: the guarded pattern, written once ----

/**
 * `createStrictContext<T>()` returns [Provider, hook]. T is chosen by the caller, so every context made with it
 * is fully typed and impossible to read outside its Provider.
 */
export function createStrictContext<T>(name: string): readonly [Context<T | undefined>, () => T] {
  const Ctx = createContext<T | undefined>(undefined);
  Ctx.displayName = name;
  function useStrict(): T {
    const value = useContext(Ctx);
    if (value === undefined) throw new Error(`use${name} must be used inside <${name}Provider>`);
    return value;
  }
  return [Ctx, useStrict];
}

// ---- 4. Split state and dispatch contexts with a typed reducer ----
// Components that only dispatch never re-render when the state changes.

export interface CartItem {
  sku: string;
  qty: number;
}
export type CartAction =
  | { type: 'add'; sku: string }
  | { type: 'remove'; sku: string }
  | { type: 'clear' };

export function cartReducer(state: readonly CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find((i) => i.sku === action.sku);
      return existing
        ? state.map((i) => (i.sku === action.sku ? { ...i, qty: i.qty + 1 } : i))
        : [...state, { sku: action.sku, qty: 1 }];
    }
    case 'remove':
      return state.filter((i) => i.sku !== action.sku);
    case 'clear':
      return [];
  }
}

const [CartStateContext, useCart] = createStrictContext<readonly CartItem[]>('CartState');
const [CartDispatchContext, useCartDispatch] = createStrictContext<Dispatch<CartAction>>('CartDispatch');
export { useCart, useCartDispatch };

export function CartProvider({ children, initial = [] }: { children: ReactNode; initial?: readonly CartItem[] }) {
  const [state, dispatch] = useReducer(cartReducer, initial, (items) => [...items]);
  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>{children}</CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}
