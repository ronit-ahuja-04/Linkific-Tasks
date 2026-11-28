/** Form rules shared by the sign-in and sign-up forms. They mirror the database checks so errors show early. */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9_]{3,24}$/;

export function validateSignIn(v: {
  email: string;
  password: string;
}): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {};
  if (!EMAIL.test(v.email.trim())) errors.email = 'Enter an email like name@example.com.';
  if (!v.password) errors.password = 'Enter your password.';
  return errors;
}

export function validateSignUp(v: {
  displayName: string;
  handle: string;
  email: string;
  password: string;
}): FieldErrors<'displayName' | 'handle' | 'email' | 'password'> {
  const errors: FieldErrors<'displayName' | 'handle' | 'email' | 'password'> = {};
  if (!v.displayName.trim()) errors.displayName = 'What should Wisp call you?';
  else if (v.displayName.trim().length > 60) errors.displayName = 'Keep it under 60 characters.';
  if (!HANDLE.test(v.handle.trim().toLowerCase()))
    errors.handle = '3–24 characters: lowercase letters, numbers and _.';
  if (!EMAIL.test(v.email.trim())) errors.email = 'Enter an email like name@example.com.';
  if (v.password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}
