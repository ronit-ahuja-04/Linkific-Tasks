-- =====================================================================================================
-- Huddle, migration 2: notes, tags and full-text search
--
--   profiles 1 ---- * notes          (one author, many notes)
--   notes    * ---- * tags           (a many-to-many relationship through the join table note_tags)
-- =====================================================================================================

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 120),
  body       text not null default '' check (char_length(body) <= 20000),
  visibility text not null default 'private' check (visibility in ('private', 'team')),
  pinned     boolean not null default false,
  priority   smallint not null default 0 check (priority between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A COMPUTED (generated) column: Postgres keeps it up to date by itself. Title words weigh more than body words.
  fts        tsvector generated always as (
               setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
               setweight(to_tsvector('english', coalesce(body, '')),  'B')
             ) stored
);

-- INDEXES: without them Postgres reads every row. Each one answers a question the app asks.
create index notes_owner_created_idx on public.notes (owner_id, created_at desc);        -- "my notes, newest first"
create index notes_team_created_idx  on public.notes (created_at desc) where visibility = 'team';   -- partial: only team notes
create index notes_fts_idx           on public.notes using gin (fts);                      -- full-text search

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create table public.tags (
  id       uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name     text not null check (char_length(btrim(name)) between 1 and 30),
  unique (owner_id, name)
);

create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id  uuid not null references public.tags (id)  on delete cascade,
  primary key (note_id, tag_id)
);
create index note_tags_tag_idx on public.note_tags (tag_id);

-- ---- row level security -------------------------------------------------------------------------------
alter table public.notes     enable row level security;
alter table public.tags      enable row level security;
alter table public.note_tags enable row level security;

create policy "read my notes and the team's notes"
  on public.notes for select to authenticated
  using (owner_id = (select auth.uid()) or visibility = 'team');

create policy "create notes as myself"
  on public.notes for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "change only my notes"
  on public.notes for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "delete only my notes"
  on public.notes for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "tags belong to their owner"
  on public.tags for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- A tag link is visible when its note is visible, and changeable only by the note's owner
create policy "see tag links of visible notes"
  on public.note_tags for select to authenticated
  using (exists (select 1 from public.notes n where n.id = note_id));   -- the notes policy above already filters

create policy "tag only my own notes"
  on public.note_tags for insert to authenticated
  with check (
    exists (select 1 from public.notes n where n.id = note_id and n.owner_id = (select auth.uid()))
    and exists (select 1 from public.tags t where t.id = tag_id and t.owner_id = (select auth.uid()))
  );

create policy "untag only my own notes"
  on public.note_tags for delete to authenticated
  using (exists (select 1 from public.notes n where n.id = note_id and n.owner_id = (select auth.uid())));

-- ---- a database function you call from the browser: supabase.rpc('search_notes', { q }) --------------
-- SECURITY INVOKER (the default) means it runs AS THE CALLER, so the policies above still apply and a
-- search can never return someone else's private note.
-- The snippet marks matches with [[ and ]] (not HTML), so the app can show it without trusting the text.
create function public.search_notes(q text)
returns table (id uuid, title text, snippet text, rank real, visibility text, owner_id uuid, updated_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select n.id,
         n.title,
         ts_headline('english', n.body, query, 'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=18, MinWords=5'),
         ts_rank(n.fts, query),
         n.visibility,
         n.owner_id,
         n.updated_at
  from public.notes n, websearch_to_tsquery('english', q) as query
  where n.fts @@ query
  order by ts_rank(n.fts, query) desc, n.updated_at desc
  limit 50;
$$;
