// Writes .env.local for LOCAL development against the local Supabase stack: `npm run env:local`
// (run `npm run db:start` first). The keys of the local stack are the same public demo keys on every machine;
// the AUTH_SECRET is generated fresh. Production values are set in Vercel instead (see the README).
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';

const out = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const read = (name) => out.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
const url = read('API_URL');
const serviceKey = read('SERVICE_ROLE_KEY');
const dbUrl = read('DB_URL');
if (!url || !serviceKey || !dbUrl) {
  console.error('Could not read the local Supabase settings. Is the stack running? (npm run db:start)');
  process.exit(1);
}
if (existsSync('.env.local') && !process.argv.includes('--force')) {
  console.log('.env.local already exists; pass --force to overwrite it.');
  process.exit(0);
}
writeFileSync(
  '.env.local',
  [
    '# Local development (written by scripts/write-env.mjs). Never commit this file.',
    '# Public: inlined into the browser bundle',
    'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
    '# Server only',
    `AUTH_SECRET=${randomBytes(32).toString('base64url')}`,
    `SUPABASE_URL=${url}`,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`,
    'MENTOR_INVITE_CODE=demo-mentor',
    '# GitHub sign-in (optional locally): create an OAuth app, callback http://localhost:3000/api/auth/callback/github',
    'AUTH_GITHUB_ID=',
    'AUTH_GITHUB_SECRET=',
    '# Used only by the database tests',
    `DATABASE_URL=${dbUrl}`,
    '',
  ].join('\n'),
);
console.log(`Wrote .env.local for ${url}`);
