import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addTodo,
  clearCompleted,
  editTodo,
  importTodos,
  removeTodo,
  selectFilter,
  selectTodoCounts,
  selectVisibleTodos,
  setFilter,
  toggleTodo,
} from '../store/slices/todosSlice.js';
import { selectUser } from '../store/slices/authSlice.js';

const FILTERS = ['all', 'active', 'done'];

function TodoItem({ todo }) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  const save = () => {
    if (draft.trim()) dispatch(editTodo({ id: todo.id, text: draft }));
    else setDraft(todo.text);
    setEditing(false);
  };

  return (
    <li className={todo.done ? 'todo done' : 'todo'}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => dispatch(toggleTodo(todo.id))}
        aria-label={`Mark "${todo.text}" as ${todo.done ? 'not done' : 'done'}`}
      />
      {editing ? (
        <input
          className="edit"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
              setDraft(todo.text);
              setEditing(false);
            }
          }}
          aria-label="Edit todo"
        />
      ) : (
        <span className="text" onDoubleClick={() => setEditing(true)}>{todo.text}</span>
      )}
      <button className="btn ghost" onClick={() => setEditing(true)} aria-label={`Edit "${todo.text}"`}>Edit</button>
      <button className="btn ghost danger" onClick={() => dispatch(removeTodo(todo.id))} aria-label={`Delete "${todo.text}"`}>Delete</button>
    </li>
  );
}

export default function Todos() {
  // REDUX: derived values come from memoized selectors; the component just renders them
  const todos = useSelector(selectVisibleTodos);
  const filter = useSelector(selectFilter);
  const counts = useSelector(selectTodoCounts);
  const importStatus = useSelector((s) => s.todos.importStatus);
  const importError = useSelector((s) => s.todos.importError);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [text, setText] = useState('');

  const handleAdd = (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    dispatch(addTodo(text)); // an action: { type: 'todos/addTodo', payload: {...} }
    setText('');
  };

  return (
    <section className="card">
      <h1>{user ? `${user.firstName}'s todos` : 'Todos'}</h1>
      <p className="muted">
        {counts.active} open · {counts.done} done · {counts.total} total
      </p>

      <form className="row" onSubmit={handleAdd}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" aria-label="New todo" />
        <button className="btn primary" disabled={!text.trim()}>Add</button>
      </form>

      <div className="row between">
        <div className="tabs" role="tablist" aria-label="Filter todos">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? 'tab active' : 'tab'}
              onClick={() => dispatch(setFilter(f))}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="row">
          <button className="btn" onClick={() => dispatch(importTodos())} disabled={importStatus === 'loading'}>
            {importStatus === 'loading' ? 'Importing…' : 'Import sample todos'}
          </button>
          <button className="btn ghost" onClick={() => dispatch(clearCompleted())} disabled={counts.done === 0}>
            Clear completed
          </button>
        </div>
      </div>
      {importError && <p role="alert" className="error">Import failed: {importError}</p>}

      {todos.length === 0 ? (
        <p className="empty">{counts.total === 0 ? 'No todos yet. Add one above.' : 'Nothing in this view.'}</p>
      ) : (
        <ul className="list">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </section>
  );
}
