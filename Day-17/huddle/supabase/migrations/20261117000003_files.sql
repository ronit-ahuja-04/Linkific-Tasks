-- =====================================================================================================
-- Huddle, migration 3: file records
--
-- The FILE itself lives in Supabase Storage (an S3-like bucket). This table is its record in Postgres: who
-- owns it, its name, size and type, and which note it belongs to. Records can be queried and joined, and
-- protected with RLS, like any other row.
-- =====================================================================================================

create table public.files (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  bucket     text not null default 'attachments' check (bucket = 'attachments'),
  path       text not null unique,                                    -- '<owner id>/<random>-<name>' inside the bucket
  name       text not null check (char_length(name) between 1 and 200),
  mime       text,
  size       bigint not null check (size >= 0),
  note_id    uuid references public.notes (id) on delete set null,    -- optional: attached to a note
  created_at timestamptz not null default now()
);
create index files_owner_created_idx on public.files (owner_id, created_at desc);
create index files_note_idx          on public.files (note_id) where note_id is not null;

alter table public.files enable row level security;

create policy "owners manage their own file records"
  on public.files for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
-- (migration 4 adds a read policy for files attached to chat messages)
