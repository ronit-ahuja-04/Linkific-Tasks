import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import AccountPanel from '../components/auth/AccountPanel';
import AvatarEditor from '../components/auth/AvatarEditor';
import ChangePasswordForm from '../components/auth/ChangePasswordForm';
import ProfileForm from '../components/auth/ProfileForm';
import '../styles/profile.css';

export default function ProfilePage() {
  const { profile } = useAuth();
  useEffect(() => {
    document.title = 'Profile · Huddle';
  }, []);
  return (
    <div className="profile-page">
      <h1 className="page-title">Profile</h1>
      <p className="page-sub">How teammates see you, and how you sign in.</p>
      {!profile ? (
        <p className="muted" role="status">Loading your profile…</p>
      ) : (
        <div className="profile-grid">
          <div className="card profile-card"><AvatarEditor /></div>
          {/* key: if the profile row is replaced (another user signed in) the form starts again from it */}
          <div className="card profile-card"><ProfileForm key={profile.id} /></div>
          <div className="card profile-card"><AccountPanel /></div>
          <div className="card profile-card"><ChangePasswordForm /></div>
        </div>
      )}
      <details className="card profile-how">
        <summary>How this works</summary>
        <ul>
          <li><code>supabase.from('profiles').update({'{ full_name, username, bio }'}).eq('id', me)</code> is <code>UPDATE profiles SET ... WHERE id = me</code>; a policy also requires <code>id = auth.uid()</code>.</li>
          <li>A duplicate username comes back as Postgres error <code>23505</code>; a badly formatted one as <code>23514</code> (CHECK constraint).</li>
          <li><code>supabase.storage.from('avatars').upload(path, file)</code> stores the picture; <code>getPublicUrl(path)</code> builds its URL because the bucket is public.</li>
          <li><code>supabase.auth.updateUser({'{ password }'})</code> changes the password; <code>signOut({'{ scope: \'global\' }'})</code> revokes all sessions.</li>
        </ul>
      </details>
    </div>
  );
}
