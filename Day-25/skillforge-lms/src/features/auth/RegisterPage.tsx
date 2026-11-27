import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PipCustomizer } from '../../components/pip/PipCustomizer';
import type { CharacterClass } from '../../types/lms';
import { clearAuthError, registerUser } from './authSlice';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((state) => state.auth);

  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterClass, setCharacterClass] = useState<CharacterClass>('frontend_mage');
  const [pipTint, setPipTint] = useState(1);
  const [pipAccessory, setPipAccessory] = useState(4);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await dispatch(
      registerUser({
        email,
        password,
        fullName,
        handle,
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
      <div className="rpg-card p-6 sm:p-8">
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

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm font-medium text-danger"
          >
            {error.message}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-bold">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ronit Ahuja"
                className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-handle" className="block text-sm font-bold">
                Guild Handle
              </label>
              <input
                id="reg-handle"
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="ronit"
                className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-bold">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ronit@example.com"
                className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-bold">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
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
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rpg-btn-gold rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-60"
            >
              {status === 'loading' ? 'Hatching Pip...' : 'Start My Quest'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
