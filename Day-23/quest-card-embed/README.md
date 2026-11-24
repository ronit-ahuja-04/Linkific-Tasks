# Quest card embed (Day 23)

A second website for the Day 23 CORS work. It is **another origin** that calls Intern Quest's public API, the way a
portfolio or a team page would. The explanation lives in [../intern-quest/docs/CORS.md](../intern-quest/docs/CORS.md).

| Page | What it shows |
|---|---|
| `/` (`index.html`) | A live **quest card** from `GET /api/public/characters/:handle`. |
| `/lab.html` | The **CORS lab**: six requests with known outcomes, run live, each with what to expect and why. |

## Run it

```bash
cd Day-23/intern-quest && npm run dev         # the app (and its API) on http://localhost:3000
cd Day-23/quest-card-embed && node server.mjs  # this site on http://localhost:4000
```

- **The allowed origin.** Open http://localhost:4000. The app's `.env.local` sets `CORS_ALLOWED_ORIGINS=http://localhost:4000` (`npm run env:local` writes it).
- **A refused origin.** Open http://127.0.0.1:4000/lab.html. It's the same files on the same machine, but a different host name, so a different origin, and it isn't on the list.
- **The live site.** Add `?api=https://intern-quest-smoky.vercel.app` to call the live API instead. Its allowlist is the Vercel environment variable.

No dependencies: `server.mjs` is a static file server on the loopback addresses only, and the pages are plain HTML
with ES modules. Data from the API is written with `textContent`, never `innerHTML`.
