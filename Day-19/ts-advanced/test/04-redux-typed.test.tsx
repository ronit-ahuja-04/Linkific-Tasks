// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import {
  counterReducer, filterChanged, incremented, loadTodos, makeStore, reset, selectCounts, selectVisibleTodos, setValue,
  todoAdded, todoRenamed, todoToggled, useAppDispatch, useAppSelector,
  type AppDispatch, type CounterAction, type RootState, type Todo, type TodoApi,
} from '../src/04-redux-typed';

afterEach(cleanup);
const okApi = (todos: Todo[] = []): TodoApi => ({ fetchTodos: async () => todos });

describe('04 plain Redux, by hand', () => {
  it('action creators return exact action types', () => {
    expectTypeOf(incremented(2)).toEqualTypeOf<{ readonly type: 'counter/incremented'; readonly by: number }>();
    expectTypeOf(reset()).toEqualTypeOf<{ readonly type: 'counter/reset' }>();
    expectTypeOf(incremented).returns.toExtend<CounterAction>();
  });
  it('the reducer handles each action', () => {
    let s = counterReducer(undefined, { type: 'counter/set', value: 0 });
    s = counterReducer(s, incremented(5));
    s = counterReducer(s, incremented());
    expect(s.value).toBe(6);
    expect(counterReducer(s, setValue(9)).value).toBe(9);
    expect(counterReducer(s, reset()).value).toBe(0);
  });
  it('wrong actions do not compile', () => {
    // @ts-expect-error  'counter/set' needs a value
    counterReducer(undefined, { type: 'counter/set' });
    // @ts-expect-error  unknown action type
    counterReducer(undefined, { type: 'counter/explode' });
    // @ts-expect-error  `by` must be a number
    incremented('3');
  });
});

describe('04 Redux Toolkit: slice, store, types', () => {
  it('actions are generated and typed from the reducers', () => {
    const store = makeStore(okApi());
    store.dispatch(todoAdded('write types'));
    store.dispatch(todoAdded('test types'));
    store.dispatch(todoToggled(1));
    store.dispatch(todoRenamed(2, '  tidy types  ')); // prepare() trims
    expect(store.getState().todos.items).toEqual([
      { id: 1, title: 'write types', done: true },
      { id: 2, title: 'tidy types', done: false },
    ]);
    expectTypeOf(todoAdded).parameters.toEqualTypeOf<[string]>();
    expectTypeOf(todoRenamed).parameters.toEqualTypeOf<[number, string]>();
    // @ts-expect-error  todoAdded takes a string, not a number
    todoAdded(5);
    expect(() =>
      // @ts-expect-error  todoRenamed(id, title) takes two arguments
      todoRenamed(1)
    ).toThrow();
  });
  it('RootState and AppDispatch come from the store', () => {
    expectTypeOf<RootState['todos']['status']>().toEqualTypeOf<'idle' | 'loading' | 'succeeded' | 'failed'>();
    expectTypeOf<RootState['filter']['show']>().toEqualTypeOf<'all' | 'open' | 'done'>();
    const store = makeStore(okApi());
    // @ts-expect-error  state has no `user` slice
    void store.getState().user;
    // @ts-expect-error  'later' is not a filter value
    store.dispatch(filterChanged('later'));
    expectTypeOf<AppDispatch>().toBeFunction();
  });
  it('selectors are memoised and typed', () => {
    const store = makeStore(okApi());
    store.dispatch(todoAdded('a'));
    store.dispatch(todoAdded('b'));
    store.dispatch(todoToggled(1));
    expect(selectCounts(store.getState())).toEqual({ total: 2, done: 1 });
    const first = selectVisibleTodos(store.getState());
    expect(selectVisibleTodos(store.getState())).toBe(first); // same reference: memoised
    store.dispatch(filterChanged('done'));
    expect(selectVisibleTodos(store.getState()).map((t) => t.title)).toEqual(['a']);
    expectTypeOf(selectVisibleTodos).returns.toEqualTypeOf<Todo[]>();
  });
});

describe('04 createAsyncThunk', () => {
  it('fulfilled: payload is Todo[]', async () => {
    const store = makeStore(okApi([{ id: 1, title: 'x', done: false }]));
    const result = await store.dispatch(loadTodos());
    expect(loadTodos.fulfilled.match(result)).toBe(true);
    if (loadTodos.fulfilled.match(result)) expectTypeOf(result.payload).toEqualTypeOf<Todo[]>();
    expect(store.getState().todos).toMatchObject({ status: 'succeeded', items: [{ id: 1 }] });
  });
  it('rejected: the payload is a typed ApiError', async () => {
    const store = makeStore({ fetchTodos: async () => { throw new Error('offline'); } });
    const result = await store.dispatch(loadTodos());
    if (loadTodos.rejected.match(result)) {
      expectTypeOf(result.payload).toEqualTypeOf<{ message: string; status: number } | undefined>();
      expect(result.payload).toEqual({ message: 'offline', status: 500 });
    } else {
      expect.unreachable('should have been rejected');
    }
    expect(store.getState().todos.status).toBe('failed');
    expect(store.getState().todos.error?.message).toBe('offline');
  });
  it('the thunk takes no argument', () => {
    // @ts-expect-error  loadTodos was declared with a void argument
    loadTodos(5);
  });
});

describe('04 typed hooks in a component', () => {
  function App() {
    const dispatch = useAppDispatch();
    const items = useAppSelector(selectVisibleTodos);
    return (
      <div>
        <button onClick={() => dispatch(todoAdded('new'))}>add</button>
        <ul>{items.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
      </div>
    );
  }
  it('dispatches and reads through useAppDispatch / useAppSelector', async () => {
    render(<Provider store={makeStore(okApi())}><App /></Provider>);
    await userEvent.click(screen.getByText('add'));
    expect(screen.getByText('new')).toBeTruthy();
  });
  it('useAppSelector knows the state shape', () => {
    function Bad() {
      // @ts-expect-error  RootState has no `nope` slice
      return <p>{useAppSelector((s) => s.nope.x)}</p>;
    }
    expect(Bad).toBeTypeOf('function'); // never rendered: we only need the compiler's opinion
  });
});
