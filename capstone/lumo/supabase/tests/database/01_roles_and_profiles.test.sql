-- Roles and profiles: nobody makes themselves an admin, learners can't edit their own points.
begin;
select plan(12);

select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'every table in public has Row Level Security on'
);

-- Sign-up metadata that tries to claim a role is ignored.
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values ('b0000000-0000-4000-8000-000000000001', 'sneaky@lumo.local', '{"handle":"sneaky","display_name":"Sneaky","role":"admin"}', 'authenticated', 'authenticated');
select is((select role::text from public.profiles where id = 'b0000000-0000-4000-8000-000000000001'), 'learner', 'a new account is always a learner, whatever the metadata says');

-- A taken handle gets a suffix instead of failing the sign-up.
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values ('b0000000-0000-4000-8000-000000000002', 'maya2@lumo.local', '{"handle":"maya"}', 'authenticated', 'authenticated');
select isnt((select handle from public.profiles where id = 'b0000000-0000-4000-8000-000000000002'), 'maya', 'a duplicate handle is made unique, not rejected');

-- Act as Maya (learner).
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ update public.profiles set role = 'admin' where id = 'a0000000-0000-4000-8000-000000000001' $$, '42501', null, 'a learner cannot change their own role');
select throws_ok($$ update public.profiles set light = 999999 where id = 'a0000000-0000-4000-8000-000000000001' $$, '42501', null, 'a learner cannot give themselves Light');
select throws_ok($$ update public.profiles set flame_days = 500 where id = 'a0000000-0000-4000-8000-000000000001' $$, '42501', null, 'a learner cannot edit their flame');
select lives_ok($$ update public.profiles set display_name = 'Maya I.', wisp_persona = 'coach' where id = 'a0000000-0000-4000-8000-000000000001' $$, 'a learner can edit their name and Wisp persona');
update public.profiles set display_name = 'Hacked' where id = 'a0000000-0000-4000-8000-000000000003';
select is((select display_name from public.profiles where id = 'a0000000-0000-4000-8000-000000000003'), 'Riya Menon', 'a learner cannot edit someone else''s profile');
select throws_ok($$ select public.set_user_role('a0000000-0000-4000-8000-000000000002', 'admin') $$, '42501', null, 'a learner cannot change roles');

-- Act as the admin.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select lives_ok($$ select public.set_user_role('a0000000-0000-4000-8000-000000000002', 'instructor') $$, 'an admin can promote someone');
select is((select count(*) from public.audit_log where action = 'set_role' and target = 'a0000000-0000-4000-8000-000000000002'), 1::bigint, 'the role change is in the audit log');
select throws_ok($$ select public.set_user_role('a0000000-0000-4000-8000-000000000004', 'learner') $$, '22023', null, 'the last admin cannot demote themselves');

select * from finish();
rollback;
