# PRD: Next.js fundamentals (Day 20)

| Field     | Value                                                                        |
| --------- | ---------------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                                  |
| Programme | Linkific internship, Month 1 (training phase), Day 20                        |
| Repo path | `Linkific-Tasks/Day-20/nextjs-blog`                                          |
| Status    | **Built.** App merged in PR #95; tests and docs in the Day 20 documentation PR |
| Companion | the project README                                                           |

## 1. Summary

Day 20 introduces Next.js. The deliverable is **Dispatch**, a blog about Next.js built on the App Router, that uses each concept in the brief on real code: file-based routing with nested, dynamic and grouped routes, layouts, loading and error states; server and client components; server-side data fetching with caching and streaming; SSG, ISR, SSR and CSR side by side; image and font optimisation; SEO metadata; and route handlers.

## 2. Goals and non-goals

- A multi-page Next.js app where every bullet of the Day 20 task list is used and has a test.
- Learn the framework as it is **now** (Next.js 16.4.6), not as older tutorials describe it.
- Prove behaviour in a production build: rendering strategy, caching, image output, metadata, accessibility.
- Non-goals: a database or CMS, authentication, deployment, Redux or other state libraries (Days 21 onward).

## 3. Decisions

| Decision | Why |
|---|---|
| Next.js 16.4.6 with **Cache Components** (the scaffold default) | It is the current model and what the shipped docs teach. The older `revalidate` / `force-dynamic` style is mapped to it in the README rather than built twice. |
| Read the docs bundled in `node_modules/next/dist/docs` first | The package's own `AGENTS.md` warns the API differs from older knowledge; it did (`retry` instead of `reset`, `params` as a Promise, `use cache` instead of `revalidate`). |
| Posts as Markdown files, read on the server and cached | The build needs no network or database, yet it is real server-side data fetching with caching and tags. |
| A small hand-written Markdown reader returning data, not HTML | No new dependency, nothing to sanitise, and the tests can check script text is escaped. |
| Generated PNG covers | Real raster images, so `next/image` has something to optimise. A script with no dependencies makes them. |
| A `/rendering` page that stamps each part with its creation time | The four strategies become observable, and testable. |
| TypeScript strict | Continues Days 18 and 19; route props are generated types. |
| Tests run against `next build` + `next start` | Caching, ISR and image optimisation do not behave like this in `next dev`. |
| Report and standup script kept local | Same as Days 16, 18 and 19. |

## 4. Mapping the task list

| Task | Where |
|---|---|
| What is Next.js, vs Create React App, full-stack, performance, SEO | README sections 1 and "Rendering" |
| Create the app, structure, `app` directory, dev server | `create-next-app`, README "Project structure" |
| `page.tsx`, nested routes, dynamic `[id]`, route groups, layouts, loading and error states | `app/` (see the routing table in the README) |
| Server Components, Client Components, when to use each, composition | `components/`, `Disclosure`, README table |
| Server-side fetching, async components, caching, streaming and Suspense, error handling | `lib/posts.ts`, `/blog`, `/rendering`, `error.tsx`, `notFound()` |
| SSG, SSR, ISR, CSR and when to use each | `/rendering`, README table |
| `next/image`, `next/font`, metadata and SEO, `Link`, route handlers | `PostCard`, `layout.tsx`, `generateMetadata`, `app/api` |
| Build: multi-page site, dynamic blog routes, server fetching, images, SEO, loading and error states | the whole app |

## 5. Requirements and verification

| # | Requirement | Verified by |
|---|---|---|
| N1 | Multiple pages with file-based routing, including nested, dynamic and grouped routes | e2e: routing, route group, sitemap crawl of all 6 posts |
| N2 | `[slug]` pages prerendered, unknown slugs handled | build output (6 paths); e2e not-found test |
| N3 | Server and client components used where each belongs | e2e: article text in server HTML; like and disclosure tests |
| N4 | All four rendering strategies demonstrable | e2e: stamp tests incl. 16 s ISR rebuild and CSR-not-in-HTML |
| N5 | Images optimised | e2e: WebP via `/_next/image`, size, width/height, lazy and priority |
| N6 | SEO metadata complete | e2e: title, description, canonical, Open Graph, Twitter, JSON-LD, sitemap, robots |
| N7 | Loading and error states | `loading.tsx`, Suspense fallback in the HTML, `error.tsx` e2e |
| N8 | Accessible | axe WCAG 2.1 AA on six pages in light and dark (12 tests) |
| N9 | Code quality | `tsc` strict, eslint clean, 17 unit tests, `next build` green |

## 6. Milestones

| # | Milestone | PR |
|---|---|---|
| A | The app: routes, data layer, components, rendering demo, API, SEO | #95 |
| B | Unit and browser tests, README, PRD, root index | see the repository history |

## 7. Risks

| Risk | Handling |
|---|---|
| Tutorials describe the older caching model | Read the bundled docs; README table maps old to new |
| `next/font` needs the network at build | Documented; fonts are self-hosted after the build |
| Unknown post slug returns 200 instead of 404 under Cache Components | Documented in Limits; the page is `noindex` |
| ISR cannot be tested without waiting | One 18 second test, marked as such |
