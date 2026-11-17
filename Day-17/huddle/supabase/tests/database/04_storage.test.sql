begin;
select plan(16);
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
select tests.make_user('91000000-0000-4000-8000-000000000001', 'sender@example.com');
select tests.make_user('91000000-0000-4000-8000-000000000002', 'friend@example.com');
select tests.make_user('91000000-0000-4000-8000-000000000003', 'stranger@example.com');

-- buckets
select is((select public from storage.buckets where id = 'avatars'), true, 'the avatars bucket is PUBLIC');
select is((select public from storage.buckets where id = 'attachments'), false, 'the attachments bucket is PRIVATE');
select is((select file_size_limit from storage.buckets where id = 'avatars'), 2097152::bigint, 'avatars are limited to 2 MiB');
select ok((select 'image/png' = any (allowed_mime_types) and not ('application/pdf' = any (allowed_mime_types)) from storage.buckets where id = 'avatars'), 'avatars accept images only');

-- avatars: anyone can read, only the owner can write into their own folder
select tests.login_as('91000000-0000-4000-8000-000000000001');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('avatars', '91000000-0000-4000-8000-000000000001/me.png') $$, 'I can upload an avatar into my own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('avatars', '91000000-0000-4000-8000-000000000002/pretend.png') $$, '42501', null, 'RLS: I cannot upload into someone else''s folder');
select tests.logout();
select tests.login_anon();
select is((select count(*) from storage.objects where bucket_id = 'avatars' and name = '91000000-0000-4000-8000-000000000001/me.png'), 1::bigint, 'an avatar is readable even without signing in');
select tests.logout();
select tests.login_as('91000000-0000-4000-8000-000000000002');
update storage.objects set name = '91000000-0000-4000-8000-000000000002/stolen.png' where bucket_id = 'avatars' and name = '91000000-0000-4000-8000-000000000001/me.png';   -- (deleting straight from SQL is blocked by Storage itself)
select tests.logout();
select is((select count(*) from storage.objects where name = '91000000-0000-4000-8000-000000000001/me.png'), 1::bigint, 'RLS: I cannot rename or take over someone else''s avatar');

-- attachments: private by default
select tests.login_as('91000000-0000-4000-8000-000000000001');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('attachments', '91000000-0000-4000-8000-000000000001/plan.pdf') $$, 'I can upload an attachment into my own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('attachments', '91000000-0000-4000-8000-000000000002/plan.pdf') $$, '42501', null, 'but not into another user''s folder');
select is((select count(*) from storage.objects where bucket_id = 'attachments' and name = '91000000-0000-4000-8000-000000000001/plan.pdf'), 1::bigint, 'I can read my own attachment');
select tests.logout();
select tests.login_as('91000000-0000-4000-8000-000000000002');
select is((select count(*) from storage.objects where bucket_id = 'attachments' and name = '91000000-0000-4000-8000-000000000001/plan.pdf'), 0::bigint, 'RLS: a private attachment is invisible to everybody else');
select tests.logout();
select tests.login_anon();
select is((select count(*) from storage.objects where bucket_id = 'attachments'), 0::bigint, 'and to the anon key');
select tests.logout();

-- sharing: attaching the file to a message in a room opens it to that room's readers (a policy that joins tables)
insert into public.rooms (id, name, is_private, created_by) values ('92000000-0000-4000-8000-000000000001', 'Public lounge', false, '91000000-0000-4000-8000-000000000001');
insert into public.rooms (id, name, is_private, created_by) values ('92000000-0000-4000-8000-000000000002', 'Closed door', true,  '91000000-0000-4000-8000-000000000001');
insert into public.room_members (room_id, user_id) values ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002');   -- the friend may enter the closed room
insert into public.files (id, owner_id, path, name, mime, size) values ('93000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001/plan.pdf', 'plan.pdf', 'application/pdf', 100);
insert into public.messages (room_id, user_id, body, attachment_id) values ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000001', 'here is the plan', '93000000-0000-4000-8000-000000000001');

select tests.login_as('91000000-0000-4000-8000-000000000002');
select is((select count(*) from storage.objects where name = '91000000-0000-4000-8000-000000000001/plan.pdf'), 1::bigint, 'a member of the closed room can read the file attached to a message there');
select is((select count(*) from public.files where id = '93000000-0000-4000-8000-000000000001'), 1::bigint, 'and sees its record (name, size)');
select tests.logout();
select tests.login_as('91000000-0000-4000-8000-000000000003');
select is((select count(*) from storage.objects where name = '91000000-0000-4000-8000-000000000001/plan.pdf'), 0::bigint, 'a stranger still cannot read it');
select tests.logout();

select * from finish();
rollback;
