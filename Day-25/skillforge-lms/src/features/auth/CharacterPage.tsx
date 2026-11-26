import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PipCustomizer } from '../../components/pip/PipCustomizer';
import type { ApiError, UserProfile } from '../../types/lms';
import { pushToast } from '../ui/uiSlice';
import { saveCharacterProfile } from './authSlice';

export function CharacterPage() {
  const { profile, error } = useAppSelector((state) => state.auth);
  if (!profile) return null;
  return <CharacterEditor key={profile.id} profile={profile} error={error} />;
}

function CharacterEditor({ profile, error }: { profile: UserProfile; error: ApiError | null }) {
  const dispatch = useAppDispatch();
  const [fullName, setFullName] = useState(profile.fullName);
  const [bio, setBio] = useState(profile.bio);
  const [characterClass, setCharacterClass] = useState(profile.characterClass);
  const [pipTint, setPipTint] = useState(profile.pipTint);
  const [pipAccessory, setPipAccessory] = useState(profile.pipAccessory);
  const [saving, setSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await dispatch(
      saveCharacterProfile({
        userId: profile.id,
        params: {
          fullName,
          bio,
          characterClass,
          pipTint,
          pipAccessory,
        },
      }),
    );
    setSaving(false);

    if (saveCharacterProfile.fulfilled.match(result)) {
      dispatch(
        pushToast({
          id: `char-${Date.now()}`,
          kind: 'success',
          text: 'Character & Pip look saved!',
        }),
      );
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Character &amp; Pip Studio</h1>
          <p className="text-sm text-muted">
            Customize @{profile.handle}&apos;s class bonus and Pip companion look.
          </p>
        </div>
        <Link
          to={`/c/${profile.handle}`}
          className="rounded-xl border-2 border-line bg-surface px-4 py-2 text-sm font-bold hover:bg-surface-2"
        >
          View Public Sheet
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm font-medium text-danger"
        >
          {error.message}
        </div>
      )}

      <form onSubmit={(e) => void handleSave(e)} className="rpg-card space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="char-name" className="block text-sm font-bold">
              Display Name
            </label>
            <input
              id="char-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="char-bio" className="block text-sm font-bold">
              Guild Motto / Bio
            </label>
            <input
              id="char-bio"
              type="text"
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <PipCustomizer
          characterClass={characterClass}
          pipTint={pipTint}
          pipAccessory={pipAccessory}
          stage="sprite"
          mood="proud"
          onChangeClass={setCharacterClass}
          onChangeTint={setPipTint}
          onChangeAccessory={setPipAccessory}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rpg-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Character'}
          </button>
        </div>
      </form>
    </section>
  );
}
