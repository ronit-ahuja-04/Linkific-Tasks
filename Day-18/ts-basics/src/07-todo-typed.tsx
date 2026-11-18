import { useReducer, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { assertNever } from './03-any-unknown-never';

/**
 * 07. A small Todo app with everything typed: props interfaces, `children`, events, `useState`,
 * `useRef`, a reducer with a discriminated union of actions, and a custom hook.
 */

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}
export type Filter = 'all' | 'open' | 'done';

// ---- state: a reducer. The action union means each `case` knows exactly which fields exist ----
export type Action =
  | { type: 'add'; text: string }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number }
  | { type: 'clearDone' };

export function todosReducer(state: Todo[], action: Action): Todo[] {
  switch (action.type) {
    case 'add': {
      const text = action.text.trim();
      if (!text) return state;
      const id = state.reduce((max, todo) => Math.max(max, todo.id), 0) + 1; // pure: no Date.now() or random
      return [...state, { id, text, done: false }];
    }
    case 'toggle':
      return state.map((todo) => (todo.id === action.id ? { ...todo, done: !todo.done } : todo));
    case 'remove':
      return state.filter((todo) => todo.id !== action.id);
    case 'clearDone':
      return state.filter((todo) => !todo.done);
    default:
      return assertNever(action); // a new action type that is not handled above fails the build here
  }
}

export function visibleTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  if (filter === 'open') return todos.filter((t) => !t.done);
  if (filter === 'done') return todos.filter((t) => t.done);
  return [...todos];
}

// ---- a custom hook: its return type is inferred, and every consumer gets it for free ----
export function useTodos(initial: Todo[] = []) {
  const [todos, dispatch] = useReducer(todosReducer, initial);
  return {
    todos,
    add: (text: string) => dispatch({ type: 'add', text }),
    toggle: (id: number) => dispatch({ type: 'toggle', id }),
    remove: (id: number) => dispatch({ type: 'remove', id }),
    clearDone: () => dispatch({ type: 'clearDone' }),
    openCount: todos.filter((t) => !t.done).length,
  };
}

// ---- components ----
interface CardProps {
  title: string;
  children: ReactNode; // anything React can render
}
export function Card({ title, children }: CardProps) {
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

interface TodoFormProps {
  onAdd: (text: string) => void;
}
export function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState(''); // inferred as string
  const input = useRef<HTMLInputElement>(null); // null until React attaches the element

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(text);
    setText('');
    input.current?.focus(); // `?.` because the ref may still be null as far as the types know
  }

  return (
    <form onSubmit={onSubmit}>
      <input ref={input} value={text} onChange={onChange} aria-label="New todo" placeholder="What needs doing?" />
      <button type="submit">Add</button>
    </form>
  );
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}
export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <li>
      <label>
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
        <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
      </label>
      <button type="button" onClick={() => onRemove(todo.id)} aria-label={`Remove ${todo.text}`}>
        ×
      </button>
    </li>
  );
}

interface FilterSelectProps {
  value: Filter;
  onChange: (next: Filter) => void;
}
const FILTERS: readonly Filter[] = ['all', 'open', 'done'];
function isFilter(value: string): value is Filter {
  return FILTERS.some((f) => f === value);
}
export function FilterSelect({ value, onChange }: FilterSelectProps) {
  function handle(event: ChangeEvent<HTMLSelectElement>) {
    // event.target.value is a plain string: check it before trusting it as a Filter
    if (isFilter(event.target.value)) onChange(event.target.value);
  }
  return (
    <select value={value} onChange={handle} aria-label="Show">
      {FILTERS.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}

interface TodoListProps {
  todos: readonly Todo[];
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}
export function TodoList({ todos, onToggle, onRemove }: TodoListProps) {
  if (todos.length === 0) return <p>Nothing here.</p>;
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  );
}

export function TodoApp({ initial = [] }: { initial?: Todo[] }) {
  const { todos, add, toggle, remove, clearDone, openCount } = useTodos(initial);
  const [filter, setFilter] = useState<Filter>('all'); // explicit: 'all' alone would infer `string`
  return (
    <Card title="Todos">
      <TodoForm onAdd={add} />
      <FilterSelect value={filter} onChange={setFilter} />
      <TodoList todos={visibleTodos(todos, filter)} onToggle={toggle} onRemove={remove} />
      <p>{openCount} open</p>
      <button type="button" onClick={clearDone}>
        Clear finished
      </button>
    </Card>
  );
}
