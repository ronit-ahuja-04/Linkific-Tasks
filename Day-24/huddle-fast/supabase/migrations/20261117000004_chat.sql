-- =====================================================================================================
-- Huddle, migration 4: chat rooms, messages and notifications
--
--   rooms   1 ---- * messages
--   rooms   * ---- * profiles   (through room_members: who joined, and when they last read the room)
--   messages * ---- 0..1 files  (an optional attachment)
-- =====================================================================================================

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 40),
  -- a computed column: "Design Team!" -> "design-team"
  slug       text generated always as (trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))) stored unique,
  topic      text check (char_length(topic) <= 160),
  is_private boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id      uuid not null references public.rooms (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index room_members_user_idx on public.room_members (user_id);

create table public.messages (
  id            bigint generated always as identity primary key,
  room_id       uuid not null references public.rooms (id) on delete cascade,
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 2000),
  attachment_id uuid references public.files (id) on delete set null,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz
);
-- "the latest messages of a room" is the one query that matters: a composite index serves it directly
create index messages_room_created_idx on public.messages (room_id, created_at desc);

create table public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,   -- who is told
  type       text not null check (type in ('mention')),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  message_id bigint not null references public.messages (id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

-- ---- helpers used by the policies ---------------------------------------------------------------------
-- SECURITY DEFINER helpers avoid an endless loop: a policy on room_members that queried room_members would
-- trigger the same policy again. The helper runs with its owner's rights and skips RLS for that one lookup.
create function public.is_room_member(p_room uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.room_members rm where rm.room_id = p_room and rm.user_id = auth.uid());
$$;

create function public.can_access_room(p_room uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room and (not r.is_private or r.created_by = auth.uid() or public.is_room_member(r.id))
  );
$$;

-- ---- triggers -------------------------------------------------------------------------------------------
-- The creator of a room is its first member, automatically
create function public.add_room_creator() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.room_members (room_id, user_id, role) values (new.id, new.created_by, 'owner');
  return new;
end;
$$;
create trigger rooms_add_creator after insert on public.rooms
  for each row execute function public.add_room_creator();

-- Mark edited messages
create function public.mark_message_edited() returns trigger
language plpgsql as $$
begin
  if new.body is distinct from old.body then new.edited_at = now(); end if;
  return new;
end;
$$;
create trigger messages_mark_edited before update on public.messages
  for each row execute function public.mark_message_edited();

-- "@ada" in a message tells ada (if ada may read the room). Clients cannot insert notifications themselves:
-- only this trigger can, which is what makes them trustworthy.
create function public.notify_mentions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, room_id, message_id, message)
  select distinct p.id, 'mention', new.room_id, new.id, left(new.body, 140)
  from regexp_matches(lower(new.body), '@([a-z0-9_]{3,24})', 'g') as m(hit)
  join public.profiles p on p.username = m.hit[1]
  where p.id <> new.user_id
    and exists (
      select 1 from public.rooms r
      where r.id = new.room_id
        and (not r.is_private or exists (select 1 from public.room_members rm where rm.room_id = r.id and rm.user_id = p.id))
    );
  return new;
end;
$$;
create trigger messages_notify_mentions after insert on public.messages
  for each row execute function public.notify_mentions();

-- ---- row level security -------------------------------------------------------------------------------
alter table public.rooms         enable row level security;
alter table public.room_members  enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;

-- rooms: public ones are open to everybody who is signed in, private ones only to members
create policy "see public rooms and my private rooms"
  on public.rooms for select to authenticated
  using (not is_private or created_by = (select auth.uid()) or public.is_room_member(id));
create policy "create rooms as myself"
  on public.rooms for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "only the creator changes a room"
  on public.rooms for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "only the creator deletes a room"
  on public.rooms for delete to authenticated
  using (created_by = (select auth.uid()));

-- members: I see my own memberships and those of rooms I belong to
create policy "see members of my rooms"
  on public.room_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_room_member(room_id));
create policy "join a public room, or add people to a room I created"
  on public.room_members for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and exists (select 1 from public.rooms r where r.id = room_id and not r.is_private))
    or exists (select 1 from public.rooms r where r.id = room_id and r.created_by = (select auth.uid()))
  );
create policy "update my own membership (last read)"
  on public.room_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "leave a room, or remove people from a room I created"
  on public.room_members for delete to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.rooms r where r.id = room_id and r.created_by = (select auth.uid())));

-- messages: read where I can access the room, write as myself where I can access it
create policy "read messages of rooms I can access"
  on public.messages for select to authenticated
  using (public.can_access_room(room_id));
create policy "post as myself in rooms I can access"
  on public.messages for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_access_room(room_id));
create policy "edit only my messages"
  on public.messages for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.can_access_room(room_id));
create policy "delete only my messages"
  on public.messages for delete to authenticated
  using (user_id = (select auth.uid()));

-- notifications: mine only. The browser may only set read_at (column-level privilege, below)
create policy "see my notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "mark my notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete my notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- COLUMN-LEVEL PRIVILEGES: RLS decides which ROWS, grants decide which COLUMNS. A signed-in user can change
-- read_at on their own notification, and nothing else about it.
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;
revoke insert on public.notifications from authenticated, anon;

-- files attached to a message are visible to everybody who can read that message
create policy "room members see files attached to messages"
  on public.files for select to authenticated
  using (exists (
    select 1 from public.messages m where m.attachment_id = files.id and public.can_access_room(m.room_id)
  ));

-- ---- database functions called from the app (supabase.rpc) ----------------------------------------------
-- Opening a room marks it read. Reading a public room for the first time joins it.
create function public.mark_room_read(p_room uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.room_members (room_id, user_id, role, last_read_at)
  values (p_room, auth.uid(), 'member', now())
  on conflict (room_id, user_id) do update set last_read_at = now();
end;
$$;

-- Unread messages per room (other people's messages after I last read)
create function public.unread_counts() returns table (room_id uuid, unread bigint)
language sql stable security invoker set search_path = '' as $$
  select rm.room_id, count(m.id)
  from public.room_members rm
  left join public.messages m
         on m.room_id = rm.room_id and m.created_at > rm.last_read_at and m.user_id <> rm.user_id
  where rm.user_id = auth.uid()
  group by rm.room_id;
$$;

-- Numbers for the dashboard, in one round trip
create function public.workspace_stats() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'my_notes',       (select count(*) from public.notes where owner_id = auth.uid()),
    'team_notes',     (select count(*) from public.notes where visibility = 'team'),
    'rooms',          (select count(*) from public.rooms),
    'messages_today', (select count(*) from public.messages where created_at >= date_trunc('day', now())),
    'unread_mentions',(select count(*) from public.notifications where user_id = auth.uid() and read_at is null)
  );
$$;
