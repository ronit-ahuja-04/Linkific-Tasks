-- =====================================================================================================
-- Huddle, migration 1: profiles
--
-- Supabase Auth keeps users in its own schema (auth.users). We never edit that table. Everything the app
-- needs to know about a person lives in our own table, public.profiles, with the SAME id: a "one to one"
-- relationship. A trigger creates the profile the moment someone signs up.
-- =====================================================================================================

-- A trigger function used by several tables: keep updated_at honest
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,  -- delete the user, the profile goes too
  username    text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  full_name   text check (char_length(full_name) <= 80),
  bio         text check (char_length(bio) <= 280),
  avatar_path text,                                                            -- a path inside the public 'avatars' bucket
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ROW LEVEL SECURITY: with it switched on, a table has NO rows visible to anyone until a policy says so.
-- The browser holds only the public "anon" key, so these policies ARE the security of the app.
alter table public.profiles enable row level security;

create policy "profiles are visible to signed-in users"
  on public.profiles for select to authenticated
  using (true);

-- (select auth.uid()) instead of auth.uid(): Postgres evaluates it once per query, not once per row
create policy "users update only their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert or delete policy on purpose: profiles are created by the trigger below and removed with the user.

-- ---- create a profile for every new user -------------------------------------------------------------
-- SECURITY DEFINER = runs with its owner's rights (it must write to a table the new user cannot write to
-- yet), so it pins search_path to '' and names every schema explicitly.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base      text;
  candidate text;
  n         int := 0;
begin
  -- GitHub sign-in sends user_name, email sign-up may send username, otherwise use the part of the email before the @
  base := regexp_replace(
            lower(coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'user')),
            '[^a-z0-9_]', '', 'g');
  base := case when char_length(base) < 3 then rpad(base, 3, '0') else left(base, 20) end;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := left(base, 18) || n::text;   -- ada, ada1, ada2, ...
  end loop;

  insert into public.profiles (id, username, full_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
