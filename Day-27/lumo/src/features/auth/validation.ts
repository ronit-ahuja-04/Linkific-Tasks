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

const COMMON = [
  'password',
  '12345678',
  '123456789',
  'qwertyui',
  'iloveyou',
  'lumo1234',
  'abcd1234',
  '11111111',
];

export interface Strength {
  /** 0 (too short) to 4 (great). */
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Okay' | 'Strong' | 'Great';
  /** One concrete way to make it better, or null when it's already great. */
  tip: string | null;
}

/** A friendly strength meter: length matters most, then variety. Common passwords are always weak. */
export function passwordStrength(password: string): Strength {
  if (password.length < 8)
    return { score: 0, label: 'Too short', tip: 'Use at least 8 characters.' };
  if (COMMON.includes(password.toLowerCase()))
    return {
      score: 1,
      label: 'Weak',
      tip: 'That one is on every hacker’s list. Try a short phrase.',
    };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  let score =
    1 + (password.length >= 12 ? 1 : 0) + (password.length >= 16 ? 1 : 0) + (kinds >= 3 ? 1 : 0);
  if (kinds === 1) score = Math.min(score, 2);
  const s = Math.min(score, 4) as Strength['score'];
  const label = (['Too short', 'Weak', 'Okay', 'Strong', 'Great'] as const)[s];
  const tip =
    s === 4
      ? null
      : password.length < 12
        ? 'Longer is stronger: try 12 or more characters, like a short phrase.'
        : 'Mix in capitals, numbers or a symbol.';
  return { score: s, label, tip };
}

/** A handle suggestion from a display name: "Maya Iyer" → "maya_iyer". Empty if nothing usable is left. */
export function suggestHandle(displayName: string): string {
  const base = displayName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)
    .replace(/_+$/, '');
  return base.length >= 3 ? base : '';
}
