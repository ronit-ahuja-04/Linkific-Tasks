-- Lumo M6: explicit table privileges.
--
-- The local Supabase stack grants every API role ALL on every new table, and the earlier migrations relied on that.
-- New hosted projects grant nothing by default, so on the cloud no role could read any table. Rather than copy the
-- broad local default, each role now gets exactly what its Row Level Security policies use; RLS still decides which
-- rows. Writes that go through SECURITY DEFINER functions (grading, rewards, publishing, reports…) need no grant.
-- TRUNCATE, REFERENCES and TRIGGER are granted to no API role (TRUNCATE skips RLS).
--
-- New tables need their own grants here too: nothing is granted by default any more, locally or in the cloud.

revoke all on all tables in schema public from anon, authenticated, service_role;
revoke all on all sequences in schema public from anon, authenticated, service_role;

-- Visitors: the public catalogue (live islands only, by RLS) and the taste.
grant select on public.courses, public.units, public.lessons, public.questions to anon;

-- Signed-in people: reads everywhere their policies allow…
grant select on
  public.profiles, public.courses, public.units, public.lessons, public.questions, public.answer_keys,
  public.attempts, public.lesson_progress, public.memory_items, public.enrollments, public.certificates,
  public.generation_jobs, public.wisp_flags, public.audit_log
to authenticated;
-- …the studio's direct writes (editors only, by RLS; deleting a course goes through delete_course())…
grant insert, update on public.courses to authenticated;
grant insert, update, delete on public.units, public.lessons, public.questions, public.answer_keys to authenticated;
grant insert on public.generation_jobs to authenticated;
grant insert, update, delete on public.wisp_flags to authenticated;
-- …and their own profile, only the columns a learner may change (points and roles stay server-side).
grant update (display_name, handle, timezone, daily_goal_minutes, wisp_persona) on public.profiles to authenticated;

-- The content worker (service role, server side only) reads and writes everything; it bypasses RLS by design.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
