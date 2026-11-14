import { useEffect, useState } from 'react';
import { listUsers } from '../../api/projectsApi';
import { formatDate } from '../../components/app/format';
import '../../styles/app.css';

// RequireRole already hides this page from members, but the server is the real gate: a 403 is handled too.
export default function AdminPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = 'Admin · FlowLane';
  }, []);

  useEffect(() => {
    let cancelled = false;
    listUsers().then(
      (list) => {
        if (!cancelled) setUsers(list);
      },
      (err) => {
        if (!cancelled) setError({ status: err?.status, message: (err && err.message) || 'Could not load users.' });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const forbidden = error?.status === 403;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Admin</h1>
        <p className="muted">All registered users. Only admins can see this page.</p>
      </div>
      <section className="card" aria-label="Users">
        {!users && !error && <p className="state-box" role="status">Loading users…</p>}
        {error && (
          <div className="state-box" role="alert">
            <p>{forbidden ? 'You do not have access to this page.' : error.message}</p>
            {!forbidden && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setError(null);
                  setReloadKey((k) => k + 1);
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {users && (
          <div className="table-wrap">
            <table className="data">
              <caption className="sr-only">Registered users</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Verified</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge${u.role === 'admin' ? ' badge-admin' : ''}`}>{u.role}</span></td>
                    <td>{u.provider}</td>
                    <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
