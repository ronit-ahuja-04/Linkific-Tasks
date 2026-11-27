import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PageHeader } from '../../components/layout';
import { PipCustomizer } from '../../components/pip/PipCustomizer';
import { Button, Card, ErrorState, Input, buttonClasses } from '../../components/ui';
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
      <PageHeader
        title="Character & Pip Studio"
        description={`Customize @${profile.handle}'s class bonus and Pip companion look.`}
        actions={
          <Link
            to={`/c/${profile.handle}`}
            className={buttonClasses({ variant: 'outline', size: 'md' })}
          >
            View Public Sheet
          </Link>
        }
      />

      {error && <ErrorState code={error.code} message={error.message} />}

      <Card padding="md">
        <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="char-name"
              type="text"
              label="Display Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              id="char-bio"
              type="text"
              label="Guild Motto / Bio"
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
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
            <Button type="submit" variant="primary" loading={saving} loadingText="Saving...">
              Save Character
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
