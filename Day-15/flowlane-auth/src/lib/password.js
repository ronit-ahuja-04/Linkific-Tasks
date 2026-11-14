// Password strength estimator. It runs in the browser only to GUIDE the user; the server enforces
// the real policy (min 8, a letter and a digit, not a common password). Never send or log the password.

// Lower-cased list of passwords attackers try first. A match is always "Too weak".
const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', '12345678', '123456789', '1234567890',
  '123456789a', 'qwerty123', 'qwertyuiop', 'qwerty12', 'letmein', 'letmein1', 'iloveyou', 'iloveyou1',
  'admin123', 'administrator', 'welcome1', 'welcome123', 'monkey123', 'dragon123', 'football1', 'baseball1',
  'sunshine1', 'princess1', 'superman1', 'trustno1', 'abc12345', 'abcd1234', 'abcdefgh', 'asdfghjk',
  'asdf1234', 'zxcvbnm1', '11111111', '00000000', '87654321', '1q2w3e4r', '1qaz2wsx', 'changeme',
  'changeme1', 'master123', 'login123', 'hello123', 'test1234', 'testtest', 'flowlane', 'flowlane1',
  'summer2024', 'winter2024', 'freedom1', 'whatever1', 'shadow123', 'michael1', 'charlie1', 'jordan23',
]);

export function isCommonPassword(password) {
  return COMMON.has(String(password ?? '').toLowerCase());
}

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

// "aaaa", "1234", "abcd", "dcba", "qwer": cheap patterns that look random but are not.
function hasPattern(password) {
  const p = password.toLowerCase();
  if (/(.)\1{3,}/.test(p)) return true;
  for (let i = 0; i + 3 < p.length; i += 1) {
    const codes = [0, 1, 2, 3].map((k) => p.charCodeAt(i + k));
    const step = codes[1] - codes[0];
    if ((step === 1 || step === -1) && codes[2] - codes[1] === step && codes[3] - codes[2] === step) return true;
  }
  return KEYBOARD_ROWS.some((row) => {
    const reversed = [...row].reverse().join('');
    for (let i = 0; i + 4 <= p.length; i += 1) {
      const chunk = p.slice(i, i + 4);
      if (row.includes(chunk) || reversed.includes(chunk)) return true;
    }
    return false;
  });
}

// Does the password contain something an attacker who knows the user would try first?
function isPersonal(password, { email, name } = {}) {
  const p = password.toLowerCase();
  const parts = [];
  if (email) parts.push(String(email).split('@')[0]);
  if (name) parts.push(...String(name).split(/\s+/));
  return parts.map((part) => part.toLowerCase()).some((part) => part.length >= 3 && p.includes(part));
}

/**
 * Returns { score 0-4, label, checks, suggestions }.
 * `checks` values are all "passed" flags: common === true means "NOT a common password",
 * personal === true means "does NOT contain your name or email".
 */
export function passwordStrength(password, context = {}) {
  const value = String(password ?? '');
  const lower = /[a-z]/.test(value);
  const upper = /[A-Z]/.test(value);
  const digit = /\d/.test(value);
  const symbol = /[^A-Za-z0-9]/.test(value);
  const common = !isCommonPassword(value);
  const personal = !isPersonal(value, context);
  const patternFree = !hasPattern(value);
  const checks = { length: value.length >= 8, lower, upper, digit, symbol, common, personal };

  const suggestions = [];
  if (value.length > 0) {
    if (!checks.length) suggestions.push('Use at least 8 characters.');
    else if (value.length < 12) suggestions.push('Make it 12 characters or longer.');
    if (!lower || !upper) suggestions.push('Mix uppercase and lowercase letters.');
    if (!digit) suggestions.push('Add a number.');
    if (!symbol) suggestions.push('Add a symbol such as ! or -.');
    if (!common) suggestions.push('This is a very common password. Pick something unique.');
    if (!personal) suggestions.push('Do not include your name or email.');
    if (!patternFree) suggestions.push('Avoid repeated characters and sequences like 1234 or abcd.');
  }

  let score = 0;
  if (value.length > 0 && common) {
    let points = 0;
    if (value.length >= 8) points += 1;
    if (value.length >= 12) points += 1;
    if (value.length >= 16) points += 1;
    if ([lower, upper, digit, symbol].filter(Boolean).length >= 3) points += 1;
    if (!patternFree) points -= 1;
    if (!personal) points -= 1;
    score = Math.max(0, Math.min(4, points));
    if (value.length < 8) score = Math.min(score, 1);
  }
  return { score, label: LABELS[score], checks, suggestions };
}
