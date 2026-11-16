import { afterEach } from 'vitest';
import { setSessionUser } from '../src/lib/session.js';

// The signed-in user is shared module state (the Context -> Redux bridge in src/lib/session.js),
// so every test starts signed out
afterEach(() => setSessionUser(null));
