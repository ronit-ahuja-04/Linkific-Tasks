// @vitest-environment jsdom
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { createStrictContext } from '../../src/lib/createStrictContext';
import { toastReducer, type Toast } from '../../src/context/ToastContext';

interface Greeting {
  text: string;
}
const [GreetingContext, useGreeting] = createStrictContext<Greeting>('useGreeting', 'GreetingProvider');

describe('createStrictContext', () => {
  it('gives the hook a real value, never null', () => {
    const { result } = renderHook(() => useGreeting(), {
      wrapper: ({ children }) => <GreetingContext.Provider value={{ text: 'hi' }}>{children}</GreetingContext.Provider>,
    });
    expect(result.current.text).toBe('hi');
    expectTypeOf(result.current).toEqualTypeOf<Greeting>(); // no `| null` for callers to check
  });

  it('throws a clear message outside its Provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useGreeting())).toThrow('useGreeting must be used inside a <GreetingProvider>.');
    quiet.mockRestore();
  });

  it('keeps two contexts apart', () => {
    const [OtherContext, useOther] = createStrictContext<number>('useOther', 'OtherProvider');
    function Show() {
      return <p>{useGreeting().text} {useOther()}</p>;
    }
    render(
      <GreetingContext.Provider value={{ text: 'a' }}>
        <OtherContext.Provider value={2}><Show /></OtherContext.Provider>
      </GreetingContext.Provider>,
    );
    expect(screen.getByText('a 2')).toBeTruthy();
  });
});

describe('toastReducer (typed actions)', () => {
  const toast = (id: string): Toast => ({ id, type: 'info', message: id, duration: 1 });
  it('adds at most four, newest last, then dismisses and clears', () => {
    let state: Toast[] = [];
    for (const id of ['a', 'b', 'c', 'd', 'e']) state = toastReducer(state, { type: 'add', toast: toast(id) });
    expect(state.map((t) => t.id)).toEqual(['b', 'c', 'd', 'e']);
    expect(toastReducer(state, { type: 'dismiss', id: 'c' }).map((t) => t.id)).toEqual(['b', 'd', 'e']);
    expect(toastReducer(state, { type: 'clear' })).toEqual([]);
  });
  it('the compiler rejects a toast without a message', () => {
    // @ts-expect-error  a Toast needs a message
    const bad: Toast = { id: 'x', type: 'info', duration: 1 };
    expect(bad).toBeDefined();
  });
});
