import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { providersOf, signOutScope } from '../../lib/profiles';

/** Facts about the account (from the JWT's user object) and the two ways to sign out */
export default function AccountPanel() {
  const { client, user, signOut } = useAuth();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const created = user?.created_at ? new Date(user.created_at).toLocaleString() : '';

  async function out(scope) {
    setBusy(scope);
    setError('');
    // 'local' ends this browser's session; 'global' revokes every refresh token, so every other device is signed out too
    const { error: outError } = scope === 'global' ? await signOutScope(client, 'global') : await signOut();
    if (outError) {
      setBusy('');
      setError(outError.message || 'Could not sign out.');
    }
  }

  return (
    <section aria-labelledby="profile-account-title">
      <h2 id="profile-account-title" className="profile-h2">Your account</h2>
      <dl className="profile-facts">
        <dt>Email</dt><dd>{user?.email}</dd>
        <dt>User id</dt><dd><code>{user?.id}</code></dd>
        <dt>Created</dt><dd>{created}</dd>
        <dt>Signed in with</dt>
        <dd>{providersOf(user).map((p) => <span key={p} className="badge profile-provider">{p}</span>)}</dd>
      </dl>
      <div className="profile-signout">
        <button type="button" className="btn" onClick={() => out('local')} disabled={busy !== ''}>{busy === 'local' ? 'Signing out…' : 'Sign out of this device'}</button>
        <button type="button" className="btn btn-danger" onClick={() => out('global')} disabled={busy !== ''}>{busy === 'global' ? 'Signing out…' : 'Sign out of all devices'}</button>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
    </section>
  );
}
