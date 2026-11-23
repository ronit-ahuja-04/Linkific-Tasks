import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BIO_MAX, NAME_MAX, friendlyProfileError, updateProfile, validateUsername } from '../../lib/profiles';

/** Edit full name, username and bio: one `.update()` on my own row (RLS only lets me touch it) */
export default function ProfileForm() {
  const { client, user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: profile?.full_name ?? '', username: profile?.username ?? '', bio: profile?.bio ?? '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return; // the button stays focusable while busy (A-4), so guard against a second submit here
    setError('');
    const next = { username: validateUsername(form.username, { required: true }), bio: form.bio.length > BIO_MAX ? `Bio can be at most ${BIO_MAX} characters.` : '' };
    setErrors(next);
    if (next.username || next.bio) return;
    setBusy(true);
    const { error: saveError } = await updateProfile(client, user.id, form);
    if (saveError) {
      setBusy(false);
      const text = friendlyProfileError(saveError);
      // a taken username belongs next to the field it is about
      if (saveError.code === '23505' || saveError.code === '23514') setErrors({ username: text });
      else setError(text);
      return;
    }
    await refreshProfile();
    setBusy(false);
    setErrors({});
    toast.success('Profile saved');
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-labelledby="profile-details-title">
      <h2 id="profile-details-title" className="profile-h2">Your details</h2>
      <div className="field">
        <label htmlFor="profile-name">Full name</label>
        <input id="profile-name" className="input" value={form.fullName} maxLength={NAME_MAX} onChange={set('fullName')} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="profile-username">Username</label>
        <input id="profile-username" className="input" value={form.username} onChange={set('username')} autoCapitalize="none" aria-invalid={errors.username ? 'true' : undefined} aria-describedby="profile-username-msg" />
        <p id="profile-username-msg" className={errors.username ? 'field-error' : 'field-hint'} role={errors.username ? 'alert' : undefined}>{errors.username || '3 to 24 characters: a-z, 0-9 and _. Must be unique.'}</p>
      </div>
      <div className="field">
        <label htmlFor="profile-bio">Bio</label>
        <textarea id="profile-bio" className="input" rows={3} value={form.bio} onChange={set('bio')} aria-invalid={errors.bio ? 'true' : undefined} aria-describedby="profile-bio-msg" />
        <p id="profile-bio-msg" className={errors.bio ? 'field-error' : 'field-hint'} role={errors.bio ? 'alert' : undefined}>{errors.bio || `${form.bio.length} / ${BIO_MAX}`}</p>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div><button type="submit" className="btn btn-primary" aria-disabled={busy || undefined}>{busy ? 'Saving…' : 'Save profile'}</button></div>
    </form>
  );
}
