// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { AuthProvider, CartProvider, ThemeContext, cartReducer, createStrictContext, useAuth, useCart, useCartDispatch, useTheme, type AuthValue, type CartItem } from '../src/06-context-typed';

afterEach(cleanup);

function Who() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <p>{user ?? 'nobody'}</p>
      <button onClick={() => login('Ann')}>in</button>
      <button onClick={logout}>out</button>
    </div>
  );
}

describe('06 context', () => {
  it('the hook returns AuthValue (never undefined) and works', async () => {
    expectTypeOf(useAuth).returns.toEqualTypeOf<AuthValue>();
    render(<AuthProvider><Who /></AuthProvider>);
    expect(screen.getByText('nobody')).toBeTruthy();
    await userEvent.click(screen.getByText('in'));
    expect(screen.getByText('Ann')).toBeTruthy();
    await userEvent.click(screen.getByText('out'));
    expect(screen.getByText('nobody')).toBeTruthy();
  });
  it('using the hook with no Provider throws a clear error', () => {
    expect(() => render(<Who />)).toThrow('useAuth must be used inside <AuthProvider>');
  });
  it('Provider props are typed', () => {
    // @ts-expect-error  initialUser must be string or null
    render(<AuthProvider initialUser={5}><span /></AuthProvider>);
  });
  it('a context with a default needs no Provider', () => {
    function Show() { return <p>{useTheme()}</p>; }
    render(<Show />);
    expect(screen.getByText('light')).toBeTruthy();
    cleanup();
    render(<ThemeContext.Provider value="dark"><Show /></ThemeContext.Provider>);
    expect(screen.getByText('dark')).toBeTruthy();
    // @ts-expect-error  only 'light' | 'dark' are valid themes
    render(<ThemeContext.Provider value="blue"><Show /></ThemeContext.Provider>);
  });
  it('createStrictContext infers T for the hook', () => {
    const [Ctx, useThing] = createStrictContext<{ n: number }>('Thing');
    expectTypeOf(useThing).returns.toEqualTypeOf<{ n: number }>();
    function Read() { return <p>{useThing().n}</p>; }
    render(<Ctx.Provider value={{ n: 7 }}><Read /></Ctx.Provider>);
    expect(screen.getByText('7')).toBeTruthy();
    // @ts-expect-error  the Provider value must be { n: number }
    render(<Ctx.Provider value={{ n: 'seven' }}><Read /></Ctx.Provider>);
  });
});

describe('06 split state and dispatch contexts', () => {
  it('the reducer is a plain typed function', () => {
    let s: CartItem[] = [];
    s = cartReducer(s, { type: 'add', sku: 'a' });
    s = cartReducer(s, { type: 'add', sku: 'a' });
    s = cartReducer(s, { type: 'add', sku: 'b' });
    expect(s).toEqual([{ sku: 'a', qty: 2 }, { sku: 'b', qty: 1 }]);
    expect(cartReducer(s, { type: 'remove', sku: 'a' })).toEqual([{ sku: 'b', qty: 1 }]);
    expect(cartReducer(s, { type: 'clear' })).toEqual([]);
    // @ts-expect-error  'add' needs a sku
    cartReducer(s, { type: 'add' });
    // @ts-expect-error  'rename' is not an action
    cartReducer(s, { type: 'rename', sku: 'a' });
  });
  it('components read state and dispatch separately', async () => {
    function Count() { return <p>items: {useCart().length}</p>; }
    function Add() { const dispatch = useCartDispatch(); return <button onClick={() => dispatch({ type: 'add', sku: 'x' })}>add</button>; }
    render(<CartProvider><Count /><Add /></CartProvider>);
    expect(screen.getByText('items: 0')).toBeTruthy();
    await userEvent.click(screen.getByText('add'));
    expect(screen.getByText('items: 1')).toBeTruthy();
  });
});
