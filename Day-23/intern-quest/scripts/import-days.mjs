// Imports the real Days 1 to 20 of this repository (supabase/days-1-20.json) as quests for ONE existing account.
// Meant for the production database, where there is no seed (the seed's demo accounts have a published password).
//
//   1. Register on the live site and create your character.
//   2. SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-days.mjs you@example.com
//      (the two values from Supabase → Project Settings → API; type them in your terminal, never commit them)
//
// Days you already logged are skipped, so running it twice is safe.
import { readFileSync } from 'node:fs';

// supabase-js needs Node 22+ outside the browser (it relies on the built-in WebSocket)
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error(`This script needs Node.js 22 or newer (this is ${process.version}). Run \`nvm use\` in this folder, or use /opt/homebrew/bin/node.`);
  process.exit(1);
}
const { createClient } = await import('@supabase/supabase-js');

const email = process.argv[2]?.toLowerCase();
if (email?.endsWith('@example.com')) {
  console.error('Replace YOUR-EMAIL@example.com with the email you registered with on the live site.');
  process.exit(1);
}
const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
if (!email || !url || !key) {
  console.error('Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-days.mjs you@example.com');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: user, error: userError } = await db.from('users').select('id').eq('email', email).maybeSingle();
if (userError) {
  // most often the wrong key: the publishable (public) key is refused by design
  console.error(`The database refused the query: ${userError.message}`);
  console.error('Check the key: it must be the SECRET key (sb_secret_…) or the legacy service_role key, not the publishable one.');
  process.exit(1);
}
if (!user) {
  console.error(`No account with the email ${email}. Register on the site first (and check the spelling).`);
  process.exit(1);
}
const { data: character } = await db.from('characters').select('handle').eq('user_id', user.id).maybeSingle();
if (!character) {
  console.error('That account has no character yet. Create it on the site first.');
  process.exit(1);
}

const { data: existing } = await db.from('quests').select('day').eq('user_id', user.id);
const taken = new Set((existing ?? []).map((q) => q.day));
const days = JSON.parse(readFileSync(new URL('../supabase/days-1-20.json', import.meta.url), 'utf8'));
const rows = days
  .filter((d) => !taken.has(d.day))
  .map((d) => ({ user_id: user.id, day: d.day, date: d.date, title: d.title, body: d.body, blockers: d.blockers, difficulty: d.difficulty, skills: d.skills, pr_links: d.prLinks }));

if (rows.length === 0) {
  console.log('Nothing to import: every day is already logged.');
} else {
  const { error } = await db.from('quests').insert(rows);
  if (error) throw new Error(`Import failed: ${error.message}`);
  console.log(`Imported ${rows.length} quests for @${character.handle} (skipped ${days.length - rows.length} already logged).`);
}
console.log('The public pages refresh within the hour, or at once on your next quest.');
