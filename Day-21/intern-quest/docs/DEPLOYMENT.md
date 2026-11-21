# Deploying Intern Quest

Three services, each on a free tier:

| Service | What it does here |
|---|---|
| **Vercel** | builds the Next.js app from GitHub and runs it (pages, API routes, the proxy, images) |
| **Supabase** | the production Postgres database (the local Docker stack is for development only) |
| **GitHub OAuth app** | "Continue with GitHub" (optional: email and password work without it) |

Order matters: database first, then Vercel (which gives you the site's address), then the GitHub app (which needs that address).

---

## 1. The database (Supabase)

1. supabase.com → **New project**. Pick a region near your users (for India: *South Asia (Mumbai)*). Save the database password somewhere safe.
2. Apply the schema. Either:
   - **CLI** (from `Day-21/intern-quest`):
     ```bash
     npx supabase login
     npx supabase link --project-ref <your-project-ref>
     npx supabase db push
     ```
     `db push` applies `supabase/migrations/` only. The seed is **not** applied, on purpose: its demo accounts have a published password.
   - or **SQL editor**: paste `supabase/migrations/20261121000000_intern_quest.sql` and run it.
3. Project Settings → **API**: copy the **Project URL** and the **service_role** key. The service key bypasses Row Level Security, so it goes only into Vercel's server-side settings. Never into chat, a commit, or a `NEXT_PUBLIC_` variable.

## 2. The app (Vercel)

1. vercel.com → **Add New → Project** → import the GitHub repository `Linkific-Tasks`.
2. **Root Directory: `Day-21/intern-quest`** (the repository holds every day; this is the one app to deploy). Framework: Next.js (detected).
3. **Environment variables** (Settings → Environment Variables):

   | Name | Environments | Value |
   |---|---|---|
   | `SUPABASE_URL` | Production, Preview | the Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | the service_role key (mark **Sensitive**) |
   | `AUTH_SECRET` | Production, Preview | `openssl rand -base64 32` (a different one per environment is best) |
   | `MENTOR_INVITE_CODE` | Production, Preview | a secret phrase you give to mentors (not `demo-mentor`: the app refuses to start with it) |
   | `NEXT_PUBLIC_SITE_URL` | Production | `https://<your-project>.vercel.app` (or your domain) |
   | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Production | from step 3 (add after creating the GitHub app) |

   `NEXT_PUBLIC_` values are baked into the browser JavaScript **at build time**: change one, then redeploy.
4. **Deploy.** When it is live: Analytics tab → **Enable**; Speed Insights tab → **Enable** (the app already includes both components).

What happens from then on:

- **Every push to `main`** deploys production; **every pull request** gets its own preview URL (posted on the PR).
- `vercel.json` has an `ignoreCommand` (`git diff --quiet HEAD^ HEAD -- .`): a push that does not touch `Day-21/intern-quest` (another day's work) does not rebuild this app.
- The build needs **no** database access or secrets (the leaderboard and sitemap are read at request time, then cached), so a build can not fail because the database is down.
- `src/instrumentation.ts` checks the settings when a server starts. On the production deployment (`VERCEL_ENV=production`) it refuses to start with a missing secret, a short `AUTH_SECRET`, a local database URL, the demo mentor code, or no `NEXT_PUBLIC_SITE_URL`, and the error names the setting.

> Preview deployments use the same database as production in this setup (the free tier allows two projects: for real work, give previews their own Supabase project). GitHub sign-in does not work on preview URLs, because an OAuth app has one callback URL; email and password do.

## 3. GitHub sign-in (optional)

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**
   - Homepage URL: `https://<your-project>.vercel.app`
   - Authorization callback URL: `https://<your-project>.vercel.app/api/auth/callback/github`
2. Copy the **Client ID**, generate a **Client secret**, put them in Vercel as `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (Production), and redeploy.
3. For local development make a second OAuth app with the callback `http://localhost:3000/api/auth/callback/github` and put its values in `.env.local`.

## 4. Your 20 days (optional)

Register on the live site, create your character, then import the real Days 1 to 20 of this repository into your account:

```bash
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-days.mjs you@example.com
```

Type the two values in your own terminal. Days you already logged are skipped.

## 5. A custom domain (optional)

Vercel → Settings → **Domains** → add `quest.example.com`, then create the DNS record Vercel shows (a `CNAME` to `cname.vercel-dns.com` for a subdomain, or an `A` record for an apex domain) at your registrar. HTTPS is issued automatically. Then update `NEXT_PUBLIC_SITE_URL` and the GitHub app's URLs to the new domain, and redeploy.

## 6. Check the live site

- [ ] `/` shows the Guild hall; `/robots.txt` and `/sitemap.xml` use the real domain
- [ ] register → create a character → log a quest → the reward screen appears
- [ ] `/c/<handle>` shows the quest; a link to it previews with the share card (try the LinkedIn Post Inspector)
- [ ] sign out, then `/journal` sends you to sign-in
- [ ] the mentor invite code opens `/guild`
- [ ] Vercel → Logs shows one `{"at":"proxy", …}` line per request, each with an `x-request-id`
- [ ] Analytics and Speed Insights start showing data after a few visits

---

## How the app runs on Vercel

| Part | Runs as |
|---|---|
| Pages and route handlers (`/api/*`) | **Serverless Functions** (Node.js): started on demand, scale to zero |
| `proxy.ts` | runs before every matched request; in Next.js 16 it uses the Node.js runtime by default |
| Static files, prerendered shells | Vercel's CDN |
| `use cache` results | each function instance's memory (`'use cache: remote'` would share them across instances) |

**Edge vs serverless.** Edge functions run in a lightweight runtime in many locations close to users (fast start, limited APIs); serverless functions run full Node.js in one region (all of npm, longer start). This app uses Node.js everywhere because bcrypt, the Supabase client and NextAuth's credentials flow need it, and the database lives in one region anyway: running code next to the user but far from the database would make each request slower, not faster.

## Alternatives to Vercel

- **Docker** (any VPS, Fly.io, Railway, Render): the repository has a `Dockerfile` (multi-stage, `output: 'standalone'`, runs as a non-root user, has a health check). Tested locally:
  ```bash
  docker build -t intern-quest --build-arg NEXT_PUBLIC_SITE_URL=https://quest.example.com .
  docker run -p 3000:3000 --env-file .env.production -e APP_ENV=production intern-quest
  ```
  Secrets go to `docker run`, never into the image. `APP_ENV=production` switches on the strict settings check (Vercel sets `VERCEL_ENV` instead).
- **A VPS without Docker**: `npm ci && npm run build && npm start` behind a reverse proxy (Caddy or nginx) for HTTPS, kept running by systemd or pm2. You then own updates, certificates and restarts.
- **Netlify**: supports Next.js through its own adapter. Not tested here; check that Cache Components and the proxy are supported by the adapter version before choosing it.
