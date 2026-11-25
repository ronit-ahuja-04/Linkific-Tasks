begin;
select plan(17);
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

select tests.make_user('b0000000-0000-4000-8000-00000000000a', 'alice@example.com');
select tests.make_user('b0000000-0000-4000-8000-00000000000b', 'bob@example.com');

insert into public.notes (id, owner_id, title, body, visibility) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000a', 'Alice private', 'secret zyzzyvapineapple plans', 'private'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000a', 'Alice team',    'shared zyzzyvapineapple zyzzyvaroadmap', 'team'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-00000000000b', 'Bob private',   'bobs diary', 'private');

select tests.login_as('b0000000-0000-4000-8000-00000000000a');
select is((select count(*) from public.notes where id = 'c0000000-0000-4000-8000-000000000001'), 1::bigint, 'I see my own private note');
select is((select count(*) from public.notes where id = 'c0000000-0000-4000-8000-000000000003'), 0::bigint, 'RLS: I do not see another user''s private note');
select tests.login_as('b0000000-0000-4000-8000-00000000000b');
select is((select count(*) from public.notes where id = 'c0000000-0000-4000-8000-000000000002'), 1::bigint, 'I see another user''s TEAM note');
select is((select count(*) from public.notes where id = 'c0000000-0000-4000-8000-000000000001'), 0::bigint, 'but not their private one');

-- writing
select throws_ok($$ insert into public.notes (owner_id, title) values ('b0000000-0000-4000-8000-00000000000a', 'forged as alice') $$, '42501', null, 'RLS: I cannot create a note owned by someone else');
select lives_ok($$ insert into public.notes (title) values ('my note, owner defaults to me') $$, 'owner_id defaults to auth.uid()');
select is((select owner_id from public.notes where title = 'my note, owner defaults to me'), 'b0000000-0000-4000-8000-00000000000b'::uuid, 'the default owner is the signed-in user');

update public.notes set title = 'hacked' where id = 'c0000000-0000-4000-8000-000000000002';
delete from public.notes where id = 'c0000000-0000-4000-8000-000000000002';
select tests.logout();
select is((select title from public.notes where id = 'c0000000-0000-4000-8000-000000000002'), 'Alice team', 'RLS: I cannot update a team note I do not own (and no error, the row is just invisible to the update)');
select is((select count(*) from public.notes where id = 'c0000000-0000-4000-8000-000000000002'), 1::bigint, 'nor delete it');

select tests.login_as('b0000000-0000-4000-8000-00000000000b');
select throws_ok($$ update public.notes set owner_id = 'b0000000-0000-4000-8000-00000000000a' where title = 'my note, owner defaults to me' $$, '42501', null, 'RLS WITH CHECK: I cannot hand my note to someone else');
select throws_ok($$ insert into public.notes (title, priority) values ('too important', 9) $$, '23514', null, 'CHECK constraint: priority must be 0 to 5');
select tests.logout();

-- tags (a many-to-many relationship)
insert into public.tags (id, owner_id, name) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000a', 'plans'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b', 'bobtag');
select tests.login_as('b0000000-0000-4000-8000-00000000000b');
select throws_ok($$ insert into public.note_tags values ('c0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002') $$, '42501', null, 'RLS: I cannot tag a note I do not own');
select lives_ok($$ insert into public.note_tags select id, 'd0000000-0000-4000-8000-000000000002' from public.notes where title = 'my note, owner defaults to me' $$, 'I can tag my own note with my own tag');
select tests.logout();

-- full-text search runs AS the caller, so it obeys RLS too
select tests.login_as('b0000000-0000-4000-8000-00000000000b');
select is((select count(*) from public.search_notes('zyzzyvapineapple')), 1::bigint, 'search_notes finds the team note but NOT the private one that also matches');
select is((select title from public.search_notes('zyzzyvapineapple')), 'Alice team', 'and returns the right title');
select ok((select snippet from public.search_notes('zyzzyvaroadmap')) like '%[[zyzzyvaroadmap]]%', 'the snippet marks the match with [[ ]], not HTML');
select tests.logout();

select tests.login_anon();
select is((select count(*) from public.notes), 0::bigint, 'RLS: the anon key alone reads no notes');
select tests.logout();

select * from finish();
rollback;
