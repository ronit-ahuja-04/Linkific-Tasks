begin;
select plan(32);
create schema tests;
grant usage on schema tests to anon, authenticated;   -- so a test can switch user while it is logged in as one

-- Pretend a request comes from this user: auth.uid() reads request.jwt.claims, and `role` decides which grants apply
create function tests.login_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function tests.login_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;

-- Back to the superuser that runs the tests (sees everything, like the dashboard or a server with the service key)
create function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', null, true);
  execute 'reset role';
end $$;

-- A user exactly as Supabase Auth would create one (the trigger then creates the profile)
create function tests.make_user(uid uuid, mail text, meta jsonb default '{}') returns uuid language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values (uid, mail, meta, 'authenticated', 'authenticated');
  return uid;
end $$;
select tests.make_user('e0000000-0000-4000-8000-000000000001', 'host@example.com');
select tests.make_user('e0000000-0000-4000-8000-000000000002', 'member@example.com');
select tests.make_user('e0000000-0000-4000-8000-000000000003', 'outsider@example.com');

-- rooms are created BY the host, through the same policies the app goes through
select tests.login_as('e0000000-0000-4000-8000-000000000001');
insert into public.rooms (id, name, is_private) values ('f0000000-0000-4000-8000-000000000001', 'Design Team!', false);
insert into public.rooms (id, name, is_private) values ('f0000000-0000-4000-8000-000000000002', 'Secret Plans', true);
select tests.logout();

select is((select slug from public.rooms where id = 'f0000000-0000-4000-8000-000000000001'), 'design-team', 'computed column: the slug is made from the name');
select is((select role from public.room_members where room_id = 'f0000000-0000-4000-8000-000000000002' and user_id = 'e0000000-0000-4000-8000-000000000001'), 'owner', 'trigger: the creator is the first member, as owner');
select tests.login_as('e0000000-0000-4000-8000-000000000001');
select throws_ok($$ insert into public.rooms (name, created_by) values ('Forged room', 'e0000000-0000-4000-8000-000000000003') $$, '42501', null, 'RLS: I cannot create a room in someone else''s name');
select tests.logout();

-- who can see which room
select tests.login_as('e0000000-0000-4000-8000-000000000003');
select is((select count(*) from public.rooms where id = 'f0000000-0000-4000-8000-000000000001'), 1::bigint, 'RLS: an outsider sees the PUBLIC room');
select is((select count(*) from public.rooms where id = 'f0000000-0000-4000-8000-000000000002'), 0::bigint, 'RLS: an outsider does not see the PRIVATE room');
select throws_ok($$ insert into public.room_members (room_id, user_id) values ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003') $$, '42501', null, 'RLS: I cannot join a private room myself');
select tests.logout();

select tests.login_as('e0000000-0000-4000-8000-000000000001');
select lives_ok($$ insert into public.room_members (room_id, user_id) values ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002') $$, 'the creator can add a member to a private room');
select tests.logout();
select tests.login_as('e0000000-0000-4000-8000-000000000002');
select is((select count(*) from public.rooms where id = 'f0000000-0000-4000-8000-000000000002'), 1::bigint, 'the added member now sees the private room');
select tests.logout();

-- messages
insert into public.messages (room_id, user_id, body) values ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'top secret');   -- as the superuser
select tests.login_as('e0000000-0000-4000-8000-000000000003');
select is((select count(*) from public.messages where room_id = 'f0000000-0000-4000-8000-000000000002'), 0::bigint, 'RLS: an outsider reads no messages of a private room');
select throws_ok($$ insert into public.messages (room_id, body) values ('f0000000-0000-4000-8000-000000000002', 'let me in') $$, '42501', null, 'RLS: an outsider cannot post in a private room');
select lives_ok($$ insert into public.messages (room_id, body) values ('f0000000-0000-4000-8000-000000000001', 'hello public') $$, 'but can post in a public room');
select is((select user_id from public.messages where body = 'hello public'), 'e0000000-0000-4000-8000-000000000003'::uuid, 'user_id defaults to me');
select throws_ok($$ insert into public.messages (room_id, user_id, body) values ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'forged') $$, '42501', null, 'RLS: I cannot post as someone else');
select throws_ok($$ insert into public.messages (room_id, body) values ('f0000000-0000-4000-8000-000000000001', '   ') $$, '23514', null, 'CHECK: an empty message is refused');
select tests.logout();
select tests.login_as('e0000000-0000-4000-8000-000000000001');
update public.messages set body = 'defaced' where body = 'hello public';
delete from public.messages where body = 'hello public';
select tests.logout();
select is((select count(*) from public.messages where body = 'hello public'), 1::bigint, 'RLS: I can neither edit nor delete another user''s message');
select tests.login_as('e0000000-0000-4000-8000-000000000003');
update public.messages set body = 'hello public (edited)' where body = 'hello public';
select tests.logout();
select isnt((select edited_at from public.messages where body = 'hello public (edited)'), null, 'trigger: editing my own message sets edited_at');

-- joining, unread counts
select tests.login_as('e0000000-0000-4000-8000-000000000002');
select lives_ok($$ select public.mark_room_read('f0000000-0000-4000-8000-000000000001') $$, 'opening a public room joins it (mark_room_read)');
select tests.logout();
update public.room_members set last_read_at = now() - interval '1 hour' where room_id = 'f0000000-0000-4000-8000-000000000001' and user_id = 'e0000000-0000-4000-8000-000000000002';
select tests.login_as('e0000000-0000-4000-8000-000000000002');
select is((select unread from public.unread_counts() where room_id = 'f0000000-0000-4000-8000-000000000001'), 1::bigint, 'unread_counts: the outsider''s message after I last read counts as unread');
select tests.logout();

-- opening the room marks it read: nothing is unread any more
select tests.login_as('e0000000-0000-4000-8000-000000000002');
select public.mark_room_read('f0000000-0000-4000-8000-000000000001');
select is((select unread from public.unread_counts() where room_id = 'f0000000-0000-4000-8000-000000000001'), 0::bigint, 'mark_room_read resets the unread count');
select tests.logout();

-- @mentions create notifications through a trigger
select tests.login_as('e0000000-0000-4000-8000-000000000001');
insert into public.messages (room_id, body) values ('f0000000-0000-4000-8000-000000000001', 'hey @member, and @host (me), and @nobody_here');
insert into public.messages (room_id, body) values ('f0000000-0000-4000-8000-000000000002', 'private: @outsider cannot be told, @member can');
select tests.logout();
select is((select count(*) from public.notifications where user_id = 'e0000000-0000-4000-8000-000000000002'), 2::bigint, 'trigger: @member is notified in the public room and in the private room they belong to');
select is((select count(*) from public.notifications where user_id = 'e0000000-0000-4000-8000-000000000001'), 0::bigint, 'trigger: mentioning yourself notifies nobody');
select is((select count(*) from public.notifications where user_id = 'e0000000-0000-4000-8000-000000000003'), 0::bigint, 'trigger: someone who cannot read a private room is not notified of a mention there');

select tests.login_as('e0000000-0000-4000-8000-000000000002');
select is((select count(*) from public.notifications), 2::bigint, 'RLS: I see my own notifications');
select throws_ok($$ insert into public.notifications (user_id, type, room_id, message_id, message) values ('e0000000-0000-4000-8000-000000000002', 'mention', 'f0000000-0000-4000-8000-000000000001', 1, 'forged') $$, '42501', null, 'a client cannot invent notifications (only the trigger can)');
select lives_ok($$ update public.notifications set read_at = now() $$, 'I can mark my notifications read');
select is((select count(*) from public.notifications where read_at is not null), 2::bigint, 'and they are read');
select throws_ok($$ update public.notifications set message = 'rewritten' $$, '42501', null, 'COLUMN-LEVEL privilege: read_at is the only column I may change');
select tests.logout();
select tests.login_as('e0000000-0000-4000-8000-000000000003');
select is((select count(*) from public.notifications), 0::bigint, 'RLS: I do not see other people''s notifications');
select tests.logout();

-- function used by the dashboard
select tests.login_as('e0000000-0000-4000-8000-000000000002');
select ok((select (public.workspace_stats() ->> 'rooms')::int >= 2), 'workspace_stats() returns the counts in one round trip');
select is((select (public.workspace_stats() ->> 'unread_mentions')::int), 0, 'and counts only unread mentions (all of mine are read now)');
select tests.logout();

-- realtime
select ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'), 'Realtime: messages is in the supabase_realtime publication');
select ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'), 'Realtime: so is notifications');

select * from finish();
rollback;
