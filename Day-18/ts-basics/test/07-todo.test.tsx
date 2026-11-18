// @vitest-environment jsdom
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, TodoApp, todosReducer, visibleTodos, type Action, type Todo } from '../src/07-todo-typed';

afterEach(cleanup);
const todo = (id: number, text: string, done = false): Todo => ({ id, text, done });

describe('07 todo: the reducer', () => {
  it('adds with the next id and ignores blank text', () => {
    expect(todosReducer([], { type: 'add', text: ' milk ' })).toEqual([todo(1, 'milk')]);
    expect(todosReducer([todo(5, 'x')], { type: 'add', text: 'y' })[1]?.id).toBe(6);
    const same: Todo[] = [];
    expect(todosReducer(same, { type: 'add', text: '   ' })).toBe(same);
  });

  it('toggles, removes and clears finished', () => {
    const start = [todo(1, 'a'), todo(2, 'b', true)];
    expect(todosReducer(start, { type: 'toggle', id: 1 }).map((t) => t.done)).toEqual([true, true]);
    expect(todosReducer(start, { type: 'remove', id: 1 })).toEqual([todo(2, 'b', true)]);
    expect(todosReducer(start, { type: 'clearDone' })).toEqual([todo(1, 'a')]);
  });

  it('filters', () => {
    const all = [todo(1, 'a'), todo(2, 'b', true)];
    expect(visibleTodos(all, 'open')).toEqual([todo(1, 'a')]);
    expect(visibleTodos(all, 'done')).toEqual([todo(2, 'b', true)]);
    expect(visibleTodos(all, 'all')).toHaveLength(2);
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    // @ts-expect-error  'rename' is not an action type
    const a: Action = { type: 'rename', id: 1 };
    // @ts-expect-error  a 'toggle' action needs an id, not text
    const b: Action = { type: 'toggle', text: 'x' };
    // @ts-expect-error  the id of a todo is a number
    const c: Todo = { id: '1', text: 'x', done: false };
    expectTypeOf<Todo>().toEqualTypeOf<{ id: number; text: string; done: boolean }>();
    expect([a, b, c]).toHaveLength(3);
  });
});

describe('07 todo: the components', () => {
  it('adds, completes, filters and clears todos', async () => {
    const user = userEvent.setup();
    render(<TodoApp initial={[todo(1, 'water plants')]} />);
    await user.type(screen.getByLabelText('New todo'), 'buy milk');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('buy milk')).toBeTruthy();
    expect(screen.getByLabelText('New todo')).toHaveProperty('value', '');
    expect(document.activeElement).toBe(screen.getByLabelText('New todo')); // the typed ref refocused the input
    expect(screen.getByText('2 open')).toBeTruthy();

    await user.click(screen.getByRole('checkbox', { name: 'water plants' }));
    expect(screen.getByText('1 open')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Show'), 'done');
    expect(screen.queryByText('buy milk')).toBeNull();
    expect(screen.getByText('water plants')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear finished' }));
    expect(screen.getByText('Nothing here.')).toBeTruthy();
  });

  it('removes a todo', async () => {
    const user = userEvent.setup();
    render(<TodoApp initial={[todo(1, 'a'), todo(2, 'b')]} />);
    await user.click(screen.getByRole('button', { name: 'Remove a' }));
    expect(screen.queryByText('a')).toBeNull();
    expect(screen.getByText('b')).toBeTruthy();
  });

  it('Card renders its children', () => {
    render(<Card title="Box"><p>inside</p></Card>);
    expect(within(screen.getByRole('region', { name: 'Box' })).getByText('inside')).toBeTruthy();
  });
});
