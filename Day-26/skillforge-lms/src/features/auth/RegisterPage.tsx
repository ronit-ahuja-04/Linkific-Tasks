import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PipCustomizer } from '../../components/pip/PipCustomizer';
import { Button, Card, ErrorState, Input, buttonClasses } from '../../components/ui';
import type { CharacterClass } from '../../types/lms';
import { clearAuthError, registerUser } from './authSlice';

interface RegisterErrors {
  fullName?: string;
  handle?: string;
  email?: string;
  password?: string;
}

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, profile } = useAppSelector((state) => state.auth);

  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [characterClass, setCharacterClass] = useState<CharacterClass>('frontend_mage');
  const [pipTint, setPipTint] = useState(1);
  const [pipAccessory, setPipAccessory] = useState(4);
  const [validationError, setValidationError] = useState<RegisterErrors>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: RegisterErrors = {};
    const trimmedHandle = handle.trim().toLowerCase();

    if (!fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }
    if (!/^[a-z0-9_-]{3,24}$/.test(trimmedHandle)) {
      nextErrors.handle = 'Handle must be 3–24 lowercase letters, numbers, _ or -.';
    }
    if (!email.trim() || !email.includes('@')) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (nextErrors.fullName || nextErrors.handle || nextErrors.email || nextErrors.password) {
      setValidationError(nextErrors);
      return;
    }

    setValidationError({});
    const result = await dispatch(
      registerUser({
        email,
        password,
        fullName,
        handle: trimmedHandle,
        characterClass,
        pipTint,
        pipAccessory,
      }),
    );
    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true });
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Card padding="lg">
        <h1 className="text-2xl font-bold">Forge Your Adventurer</h1>
        <p className="mt-1 text-sm text-muted">
          Pick your Character Class, hatch Pip, and join the Guild. Already registered?{' '}
          <Link
            to="/login"
            onClick={() => dispatch(clearAuthError())}
            className="font-bold text-brand underline"
          >
            Sign in
          </Link>
        </p>

        {profile && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/30 bg-brand/10 p-3 text-xs font-semibold">
            <span>
              Currently signed in as <strong>@{profile.handle}</strong>
            </span>
            <Link to="/dashboard" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Open Dashboard
            </Link>
          </div>
        )}

        {error && <ErrorState code={error.code} message={error.message} className="mt-4" />}

        <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="reg-name"
              type="text"
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={validationError.fullName}
              placeholder="Ronit Ahuja"
            />

            <Input
              id="reg-handle"
              type="text"
              label="Guild Handle"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              error={validationError.handle}
              hint="3–24 characters: a-z, 0-9, _ or -"
              placeholder="ronit"
              className="font-mono"
            />

            <Input
              id="reg-email"
              type="email"
              label="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationError.email}
              placeholder="ronit@example.com"
            />

            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validationError.password}
              placeholder="Minimum 6 characters"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-lg p-1 text-muted hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              }
            />
          </div>

          <PipCustomizer
            characterClass={characterClass}
            pipTint={pipTint}
            pipAccessory={pipAccessory}
            stage="egg"
            mood="happy"
            onChangeClass={setCharacterClass}
            onChangeTint={setPipTint}
            onChangeAccessory={setPipAccessory}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={status === 'loading'}
              loadingText="Hatching Pip..."
            >
              Start My Quest
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
