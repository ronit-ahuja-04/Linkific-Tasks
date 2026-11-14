// Password hashing and the password policy.
//
// We never store passwords, only bcrypt hashes. bcrypt is deliberately slow and salted,
// so a stolen database cannot be reversed quickly, and equal passwords get different hashes.
import bcrypt from 'bcryptjs';

const COMMON = new Set([
  'password', 'password1', 'password12', 'password123', 'passw0rd', 'p@ssw0rd', 'pass1234',
  '12345678', '123456789', '1234567890', '123123123', '11111111', '00000000', 'qwerty123',
  'qwertyuiop', 'qwerty12', 'abc12345', 'abcd1234', 'iloveyou1', 'welcome1', 'welcome123',
  'letmein123', 'admin123', 'admin1234', 'changeme1', 'football1', 'monkey123', 'dragon123',
  'sunshine1', 'princess1', 'superman1', 'trustno1', 'whatever1', 'master123', 'login123',
]);

export function passwordError(password) {
  if (typeof password !== 'string' || password.length === 0) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  // bcrypt only looks at the first 72 bytes, so longer passwords would be silently truncated.
  if (Buffer.byteLength(password) > 72) return 'Password must be at most 72 bytes.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  if (COMMON.has(password.toLowerCase())) return 'That password is too common. Pick another one.';
  return null;
}

export const hashPassword = (password, cost) => bcrypt.hash(password, cost);
export const hashPasswordSync = (password, cost) => bcrypt.hashSync(password, cost);

// A hash of a random value, used when the email is unknown so that "unknown email" costs the
// same bcrypt time as "wrong password". Otherwise response time would reveal which emails exist.
const dummyHashes = new Map();
async function dummyHash(cost) {
  if (!dummyHashes.has(cost)) {
    dummyHashes.set(cost, bcrypt.hash(`dummy-${Math.random()}-${Date.now()}`, cost));
  }
  return dummyHashes.get(cost);
}

// Always runs exactly one bcrypt compare, whether or not the user exists.
export async function verifyPassword(user, password, cost) {
  const hash = user?.passwordHash || (await dummyHash(cost));
  const matches = await bcrypt.compare(typeof password === 'string' ? password : '', hash);
  return Boolean(user?.passwordHash) && matches;
}
