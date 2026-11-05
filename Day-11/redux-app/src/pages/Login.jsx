import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  clearAuthError,
  loginUser,
  selectAuthError,
  selectAuthStatus,
  selectIsLoggedIn,
} from '../store/slices/authSlice.js';

// Demo account from https://dummyjson.com/users
const DEMO = { username: 'emilys', password: 'emilyspass' };

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const loggedIn = useSelector(selectIsLoggedIn);
  // Form fields are local state on purpose: only this component cares about them
  const [form, setForm] = useState({ username: '', password: '' });

  if (loggedIn) return <Navigate to={location.state?.from ?? '/todos'} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    // dispatching a thunk returns a promise; unwrap() turns a rejected action into a thrown error
    try {
      await dispatch(loginUser(form)).unwrap();
      navigate(location.state?.from ?? '/todos', { replace: true });
    } catch {
      /* the error message is already in the store (state.auth.error) and shown below */
    }
  };

  const update = (field) => (event) => {
    if (error) dispatch(clearAuthError());
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <section className="card narrow">
      <h1>Log in</h1>
      <p className="muted">
        Authentication state lives in the <code>auth</code> slice. Try the demo account.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Username
          <input value={form.username} onChange={update('username')} autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={update('password')} autoComplete="current-password" required />
        </label>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="row">
          <button className="btn primary" disabled={status === 'loading' || !form.username || !form.password}>
            {status === 'loading' ? 'Logging in…' : 'Log in'}
          </button>
          <button type="button" className="btn ghost" onClick={() => setForm(DEMO)}>
            Fill demo account
          </button>
        </div>
      </form>
    </section>
  );
}
