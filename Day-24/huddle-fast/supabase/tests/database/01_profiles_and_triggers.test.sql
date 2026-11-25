begin;
select plan(12);
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

select tests.make_user('a0000000-0000-4000-8000-000000000001', 'newcomer@example.com', '{"full_name":"New Comer"}');
select tests.make_user('a0000000-0000-4000-8000-000000000002', 'newcomer@other.com');            -- same name before the @
select tests.make_user('a0000000-0000-4000-8000-000000000003', 'x@example.com', '{"user_name":"Octo-Cat!"}'); -- GitHub style

select is((select username from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 'newcomer', 'sign-up trigger: a profile is created, username from the email');
select is((select full_name from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 'New Comer', 'full_name comes from the sign-up metadata');
select is((select username from public.profiles where id = 'a0000000-0000-4000-8000-000000000002'), 'newcomer1', 'a taken username gets a number instead of failing the sign-up');
select is((select username from public.profiles where id = 'a0000000-0000-4000-8000-000000000003'), 'octocat', 'GitHub user_name is cleaned: lower case, only a-z 0-9 _');
select tests.make_user('a0000000-0000-4000-8000-000000000004', 'ab@example.com');
select is((select username from public.profiles where id = 'a0000000-0000-4000-8000-000000000004'), 'ab0', 'too-short names are padded to the 3 character minimum');

select tests.login_as('a0000000-0000-4000-8000-000000000001');
select is((select count(*) from public.profiles where id = 'a0000000-0000-4000-8000-000000000002'), 1::bigint, 'signed-in users can see other profiles');

update public.profiles set bio = 'Hello' where id = 'a0000000-0000-4000-8000-000000000001';
select is((select bio from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 'Hello', 'I can update my own profile');

update public.profiles set bio = 'Hacked' where id = 'a0000000-0000-4000-8000-000000000002';
select tests.logout();
select is((select bio from public.profiles where id = 'a0000000-0000-4000-8000-000000000002'), null, 'RLS: updating someone else''s profile changes nothing');

select tests.login_as('a0000000-0000-4000-8000-000000000001');
select throws_ok($$ insert into public.profiles (id, username) values (gen_random_uuid(), 'sneaky') $$, '42501', null, 'RLS: a client cannot insert profiles (only the trigger can)');
select throws_ok($$ update public.profiles set username = 'AB' where id = 'a0000000-0000-4000-8000-000000000001' $$, '23514', null, 'a CHECK constraint rejects an invalid username');
select tests.logout();

select tests.login_anon();
select is((select count(*) from public.profiles), 0::bigint, 'RLS: the anon key alone reads no profiles');
select tests.logout();

-- (inside one transaction now() never changes, so first move created_at into the past)
update public.profiles set created_at = now() - interval '1 day' where id = 'a0000000-0000-4000-8000-000000000001';
select tests.login_as('a0000000-0000-4000-8000-000000000001');
update public.profiles set bio = 'First' where id = 'a0000000-0000-4000-8000-000000000001';
select tests.logout();
select ok((select updated_at > created_at from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 'trigger: updated_at moves forward when a row changes');

select * from finish();
rollback;
