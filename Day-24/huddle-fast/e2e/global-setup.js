// Fail fast, with the fix, when the local Supabase stack is not running
export default async function globalSetup() {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url || !process.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('No .env. Start Supabase with `npm run db:start`, then run `npm run env:local`.');
  }
  try {
    const response = await fetch(`${url}/auth/v1/health`, { headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY } });
    if (!response.ok) throw new Error(String(response.status));
  } catch {
    throw new Error(`Supabase is not answering at ${url}. Start it with \`npm run db:start\`.`);
  }
}
