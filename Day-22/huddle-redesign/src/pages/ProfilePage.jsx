import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import AccountPanel from '../components/auth/AccountPanel';
import AvatarEditor from '../components/auth/AvatarEditor';
import ChangePasswordForm from '../components/auth/ChangePasswordForm';
import ProfileForm from '../components/auth/ProfileForm';
import PageHeader from '../components/ui/PageHeader';
import UnderTheHood from '../components/ui/UnderTheHood';
import '../styles/profile.css';

export default function ProfilePage() {
  const { profile } = useAuth();
  useEffect(() => {
    document.title = 'Profile · Huddle';
  }, []);
  return (
    <div className="profile-page">
      <PageHeader title="Profile" description="How teammates see you, and how you sign in." />
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
      <UnderTheHood>
        <ul>
          <li><code>from(&apos;profiles&apos;).update(&#123; full_name, username, bio &#125;).eq(&apos;id&apos;, me)</code> is <code>UPDATE profiles SET ... WHERE id = me</code>; a policy also requires <code>id = auth.uid()</code>.</li>
          <li>A duplicate username comes back as Postgres error <code>23505</code>; a badly formatted one as <code>23514</code> (CHECK constraint).</li>
          <li><code>storage.from(&apos;avatars&apos;).upload(path, file)</code> stores the picture; <code>getPublicUrl(path)</code> builds its URL because the bucket is public.</li>
          <li><code>auth.updateUser(&#123; password &#125;)</code> changes the password; <code>signOut(&#123; scope: &apos;global&apos; &#125;)</code> revokes all sessions.</li>
        </ul>
      </UnderTheHood>
    </div>
  );
}
