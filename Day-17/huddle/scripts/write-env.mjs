// Writes .env for the LOCAL Supabase stack: node scripts/write-env.mjs
// (run `npm run db:start` first). The anon key is a public key (it ships to every browser); the secret and
// service-role keys are never written anywhere.
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const out = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const read = (name) => out.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
const url = read('API_URL');
const anon = read('ANON_KEY');
if (!url || !anon) {
  console.error('Could not read the local Supabase keys. Is the stack running? (npm run db:start)');
  process.exit(1);
}
if (existsSync('.env') && !process.argv.includes('--force')) {
  console.log('.env already exists; pass --force to overwrite it.');
  process.exit(0);
}
writeFileSync('.env', `# Local Supabase (written by scripts/write-env.mjs)\nVITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${anon}\n`);
console.log(`Wrote .env for ${url}`);
