'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { FormState } from '@/app/(auth)/actions';
import { guardAction } from '@/lib/action-guard';

/**
 * One form for both sign-in and registration. `useActionState` runs the server action and keeps what it returns
 * (an error, per-field messages, the values to refill) without any client-side fetch code; `pending` disables the button.
 */
interface AuthFormProps {
  mode: 'login' | 'register';
  action: (state: FormState, data: FormData) => Promise<FormState>;
  next: string;
}

export default function AuthForm({ mode, action, next }: AuthFormProps) {
  // guarded: offline, a failed sign-in POST becomes a message in the form, like a wrong password, instead of
  // replacing the page with an error screen; what was typed is kept (except the password)
  const [state, formAction, pending] = useActionState(
    guardAction(action, (error, data): FormState => ({ error: error.message, values: { email: String(data.get('email') ?? ''), name: String(data.get('name') ?? '') } })),
    {},
  );
  const register = mode === 'register';
  const fieldError = (name: string) => state.fields?.[name];
  return (
    // React 19 resets a form after its action runs. Keying the form on the returned values remounts it with those
    // values as defaults, so a failed attempt keeps the email and name (and, deliberately, clears the password).
    <form key={JSON.stringify(state.values ?? {})} action={formAction} className="auth-form" noValidate
      onSubmit={(event) => { if (pending) event.preventDefault(); /* React would queue a second sign-in, not drop it */ }}>
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {register && (
        <label>
          <span>Name</span>
          <input name="name" autoComplete="name" required defaultValue={state.values?.name ?? ''} aria-invalid={Boolean(fieldError('name'))} aria-describedby={fieldError('name') ? 'name-error' : undefined} />
          {fieldError('name') && <small id="name-error">{fieldError('name')}</small>}
        </label>
      )}
      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required defaultValue={state.values?.email ?? ''} aria-invalid={Boolean(fieldError('email'))} aria-describedby={fieldError('email') ? 'email-error' : undefined} />
        {fieldError('email') && <small id="email-error">{fieldError('email')}</small>}
      </label>
      <label>
        <span>Password</span>
        <input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 10 : undefined}
          aria-invalid={Boolean(fieldError('password'))} aria-describedby={register ? 'password-hint' : undefined} />
        {register && <small id="password-hint" className={fieldError('password') ? '' : 'hint-text'}>{fieldError('password') ?? 'At least 10 characters.'}</small>}
      </label>
      {/* aria-disabled keeps focus on the button while the action runs (with `disabled`, focus fell to <body> and a
          failed sign-in left keyboard users at the top of the page); the form's onSubmit drops a second press */}
      <button type="submit" className="auth-submit" aria-disabled={pending}>
        {pending ? (register ? 'Creating your character…' : 'Signing in…') : register ? 'Start your quest' : 'Sign in'}
      </button>
      <p className="auth-switch">
        {register ? 'Already questing? ' : 'New here? '}
        <Link href={`${register ? '/login' : '/register'}${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>{register ? 'Sign in' : 'Create an account'}</Link>
      </p>
    </form>
  );
}
