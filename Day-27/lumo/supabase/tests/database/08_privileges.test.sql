-- Table privileges are explicit (M6): the same locally and on the hosted project, and no broader than RLS needs.
begin;
select plan(7);

select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'every public table has Row Level Security on'
);
select is(
  (select count(*) from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
     and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')),
  0::bigint, 'no API role can truncate (which skips RLS), reference or add triggers'
);
select is(
  (select array_agg(distinct table_name::text order by table_name::text) from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon'),
  array['courses', 'lessons', 'questions', 'units'],
  'visitors can read only the catalogue'
);
select is(
  (select count(*) from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon' and privilege_type <> 'SELECT'),
  0::bigint, 'visitors can''t write anything'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'update')
  and has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'light', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'role', 'update'),
  'people can edit their name, but not their Light or role'
);
select ok(
  not has_table_privilege('authenticated', 'public.attempts', 'insert')
  and not has_table_privilege('authenticated', 'public.lesson_progress', 'insert')
  and not has_table_privilege('authenticated', 'public.certificates', 'insert'),
  'progress, attempts and certificates are written only by server functions'
);
select ok(
  has_table_privilege('service_role', 'public.generation_jobs', 'update')
  and has_table_privilege('service_role', 'public.units', 'insert'),
  'the content worker (service role) can save drafts and job progress'
);

select * from finish();
rollback;
