# Firebase vs Supabase

**Day 17 · Ronit Ahuja.** Written from building FlowLane on Firebase (Days 10 to 15) and Huddle on Supabase (Day 17). The Supabase side was run on the local stack; the Firebase side on a real project and the emulators. Where a statement comes from a measurement or a test it says so.

## In one paragraph

Firebase is a set of managed services for apps (Auth, Firestore, Storage, Functions) with great client SDKs and almost no server to think about. Supabase is **PostgreSQL with a layer of services around it** (Auth, an automatic REST API, Realtime, Storage), all open source and runnable on your laptop. The practical difference: in Firebase your data model is documents shaped for your queries, and security is a separate rules language. In Supabase your data model is relational tables, queries are SQL (through a client), and security is SQL policies on the same tables. If your data has relations and you will want reports, joins and constraints, Supabase fits; if it is a deeply nested, offline-first, mobile-heavy app with unpredictable scale, Firebase is still very good.

## Side by side

| | Firebase | Supabase |
|---|---|---|
| **Database** | Firestore: documents in collections (NoSQL) | PostgreSQL: tables, rows, SQL |
| **Relations and joins** | None. Denormalise, or read twice. | Foreign keys, joins; supabase-js embeds them: `select('*, owner:profiles(username)')` |
| **Constraints** | Only in security rules or Cloud Functions | `not null`, `unique`, `check`, foreign keys, enforced by the database for every client |
| **Queries** | Filters on indexed fields; one range/inequality field per query; no full-text, no `OR` across fields without workarounds | Any SQL: `ilike`, ranges, aggregates, full-text search (`tsvector`), your own functions through `rpc()` |
| **Indexes** | Single-field automatic; composite you create (and the console links to the missing one) | You create them in SQL (B-tree, GIN, partial); `EXPLAIN` shows if they are used |
| **Security** | Firestore Rules, a separate language, tested with the rules emulator | Row Level Security, policies in SQL, tested with pgTAP in the real database |
| **Auth** | Firebase Auth: email, many OAuth providers, phone, anonymous, MFA; ID token is a JWT | GoTrue: email, magic link, OAuth, phone; the JWT is used directly by the database (`auth.uid()` inside policies) |
| **Realtime** | Listeners on any query (`onSnapshot`), offline cache built in | `postgres_changes` on tables (filtered by RLS), plus Broadcast and Presence channels; no offline cache |
| **File storage** | Cloud Storage for Firebase, security rules | Storage buckets, policies on `storage.objects` (SQL), signed URLs, public or private bucket |
| **Server code** | Cloud Functions (Node, pay-as-you-go plan) | SQL functions, triggers, and Edge Functions (Deno) |
| **Local development** | Emulator Suite (needs Java for some) | The whole stack in Docker: real Postgres, Auth, Storage, Realtime, mail catcher |
| **Open source / lock-in** | Closed; data export and a proprietary API | Open source; it is Postgres, so `pg_dump` and any Postgres host work; the client API is Supabase's |
| **Pricing shape** | Per read, write, delete and bandwidth: cost follows usage, can surprise | Per project and resources (database size, bandwidth): more predictable; free tier projects pause when idle |
| **Mobile and offline** | Best in class (offline persistence, SDKs for every platform) | Works, but no built-in offline sync |

## What I noticed building the same kind of thing twice

### 1. Security: "rules are not filters" vs "RLS is a filter"
In Firestore a query that could return a document you may not read is **refused as a whole** (rules are not filters), so the client must ask a question the rules can prove. In Supabase, RLS silently **filters rows out**: `select * from notes` returns only the rows you may see. That is convenient (the same query works for everyone) and a little dangerous: a missing policy looks like an empty list, not an error. My pgTAP and e2e tests therefore assert both the rows that come back and that forbidden writes are rejected.

### 2. Policies combine with OR, so a query must still say what it wants
Huddle lets room members read files attached to messages. That policy is correct, and it made "my files" show other people's files, because I had assumed RLS limited the list to my own. Found by a browser test. The fix is one `.eq('owner_id', me)`. In Firestore the equivalent mistake cannot hide, because the query would be refused. **RLS defines what you may see, not what you asked for.**

### 3. Recursion in policies
A policy on `room_members` that asks "am I a member?" by querying `room_members` loops forever (`infinite recursion detected in policy`). The cure is a `security definer` function used inside the policy. Firestore rules have their own limits (document reads per rule evaluation) but not this trap.

### 4. Auth tokens and "sign out everywhere"
Both systems use JWTs, and both have the same property: signing out on all devices revokes the **refresh** token but an already issued **access/ID token** stays valid until it expires (an hour by default). In Huddle the second device stayed "signed in" until I added a `getUser()` call, which asks the server instead of trusting the local token. `getSession()` alone only reads local storage. Firebase has the same shape (`getIdToken()` vs `checkRevoked` on the server). Day 15 also found Firebase's `browserLocalPersistence` multi-tab behaviour; Supabase keeps one `sb-...-auth-token` entry in `localStorage`, which is simpler but readable by any script on the page.

### 5. Realtime: very different models
Firestore `onSnapshot` gives you **the result of a query**, kept up to date, with an offline cache and local latency compensation. Supabase `postgres_changes` gives you **change events** (insert, update, delete) for a table; you apply them to your own state, and the browser must refetch if it missed any while offline. In tests, the channel reports `SUBSCRIBED` slightly before the server has actually started following the database, so a change made in that instant is lost: the app refetches counts when the channel connects. Broadcast and Presence (typing indicators, who is online) have no direct Firestore equivalent and were easy to build.

### 6. Search
Firestore has no full-text search; the usual answer is Algolia or Typesense. In Postgres it is a generated `tsvector` column, a GIN index and `websearch_to_tsquery`: `run` finds `running`, `-word` excludes, `"phrase"` matches a phrase, and `ts_headline` builds the highlighted snippet. One migration, no extra service. (The highlight markers are `[[ ]]` rather than HTML so a note containing `<script>` cannot become markup.)

### 7. Local development and tests
Supabase's local stack is real Postgres, so the same SQL, policies and triggers run in tests as in production, and `supabase test db` runs pgTAP inside the database (77 assertions here). Starting it needed Docker and about 4 GB of memory, which is heavier than Firebase's emulators, and the defaults (2 emails an hour) had to be raised for tests. Firebase's emulators are lighter but are re-implementations, and a few behaviours differ from production.

### 8. Bundle size (measured with `scripts/bundle-sizes.mjs`, minified and gzipped, tree-shaken)

| Package | gzip |
|---|---|
| `@supabase/supabase-js` (Auth, REST, Realtime, Storage in one client) | 60.3 kB |
| Firebase Auth | 33.1 kB |
| Firebase Firestore | 144.2 kB |
| Firebase Auth + Firestore | 168.6 kB |
| Firebase Auth + Firestore + Storage | 175.9 kB |

supabase-js is smaller than Firebase's database SDK because it is a thin HTTP and WebSocket client: the work happens on the server.

### 9. Where each one made me write more code
- **Supabase:** the schema, policies, helper functions and triggers (about 500 lines of SQL for 9 tables) before the UI works. In return the rules are enforced for every client and are testable.
- **Firebase:** denormalised copies (counts, user names stored in each message), rules for each shape, and Cloud Functions for anything a client may not do (such as creating a notification). In return there was less to set up and the offline behaviour is free.

## When I would pick which

| Choose Firebase when | Choose Supabase when |
|---|---|
| mobile-first with offline use and real-time sync as the core | the data is relational (users, orders, rooms, memberships) |
| the data is document-shaped and read the way it is written | you need joins, aggregates, reports, full-text search |
| you want zero database administration and Google's SDKs | you want constraints and security enforced in the database |
| usage is small or spiky and you want to pay per operation | you want predictable cost, open source, or to leave later (it is Postgres) |
| push notifications, Analytics, Crashlytics, Remote Config are needed | you want to run the whole thing locally or self-host |

For a typical web app with accounts, shared data and permissions I would now start with Supabase, and keep Firebase for mobile apps that must work offline. The cost of Supabase is that you must learn SQL and Postgres security properly: a missing policy is a silent hole, and the tests are not optional.

## What I did not compare
Pricing at scale, Edge Functions vs Cloud Functions, phone and anonymous auth, multi-factor, and self-hosting for real. Those are from documentation, not from this project, so I have left them out.
