// SQL to set up a hosted Lumo project: node scripts/cloud-content.mjs you@example.com > lumo-cloud.sql
//
// The local seed (supabase/seed.sql) creates demo accounts with a published password, so it must never run on a
// hosted project. This turns it into a bootstrap for one REAL account instead: sign up on the deployed app first,
// then paste the output into the Supabase SQL editor. It makes that account the admin and the owner of the
// starter islands (Code Reef and friends), with no demo accounts at all.
import { readFileSync } from 'node:fs';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@']+@[^\s@']+\.[^\s@']+$/.test(email)) {
  console.error('Usage: node scripts/cloud-content.mjs you@example.com > lumo-cloud.sql');
  process.exit(1);
}

let sql = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8');
const cut = (from, to) => {
  const a = sql.indexOf(from);
  const b = sql.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`seed.sql changed: can't find "${from}"`);
  sql = sql.slice(0, a) + sql.slice(b + to.length);
};

// No demo accounts: drop their creation and role grants, and the "skip the setup chat" shortcut.
cut(
  '  for r in\n    select * from (values\n      (v_maya',
  "update public.profiles set role = 'admin' where id = v_admin;\n",
);
cut('-- The demo accounts skip the first-run setup chat', 'where onboarded_at is null;\n');
sql = sql.replace(/^-- Local seed[\s\S]*?\n\n/, '');
// Every island belongs to the one real account.
const owner = `(select id from auth.users where lower(email) = '${email}')`;
sql = sql.replace(
  /v_(riya|admin)\s+uuid := '[0-9a-f-]+';/g,
  (_, who) => `v_${who} uuid := ${owner};`,
);
if (/a0000000-0000-4000-8000/.test(sql.replace(/v_(maya|sam)\s+uuid := '[^']+';/g, ''))) {
  throw new Error('seed.sql changed: a demo account id is still referenced');
}

process.stdout
  .write(`-- Lumo cloud bootstrap for ${email}. Paste into the Supabase SQL editor and run once.
do $$
begin
  if not exists (select 1 from auth.users where lower(email) = '${email}') then
    raise exception 'Sign up on the deployed app as % first, then run this again.', '${email}';
  end if;
  update public.profiles set role = 'admin' where id = ${owner};
end;
$$;

${sql.trim()}
`);
