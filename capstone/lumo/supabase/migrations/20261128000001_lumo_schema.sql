-- Lumo schema v2 (Day 27, M1).
--
-- Principles:
--   * Security lives in Postgres: every table has Row Level Security; the browser only holds the anon key + a JWT.
--   * Answer keys are in their own table that learners can never read. Grading happens in submit_answer().
--   * Points (Light), flames and roles can't be written by the client: column privileges block it, and only
--     SECURITY DEFINER functions (which check who is calling) change them.
--   * Courses are soft-deleted (deleted_at), so learner history and certificates survive.

-- ---------------------------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------------------------
create type public.app_role as enum ('learner', 'instructor', 'admin');
create type public.course_status as enum ('draft', 'in_review', 'live', 'archived');
create type public.lesson_kind as enum ('video', 'quiz', 'practice', 'guardian');
create type public.job_status as enum ('queued', 'running', 'waiting_quota', 'succeeded', 'failed', 'cancelled');

-- ---------------------------------------------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  role public.app_role not null default 'learner',
  timezone text not null default 'UTC',
  daily_goal_minutes int not null default 10 check (daily_goal_minutes in (3, 10, 20, 30)),
  wisp_persona text not null default 'cheeky' check (wisp_persona in ('cheeky', 'calm', 'coach')),
  light int not null default 0 check (light >= 0),
  flame_days int not null default 0 check (flame_days >= 0),
  best_flame int not null default 0 check (best_flame >= 0),
  last_goal_date date,
  embers int not null default 2 check (embers between 0 and 2),
  created_at timestamptz not null default now()
);

-- Helpers used by policies. SECURITY DEFINER so a policy on profiles can read profiles without recursion.
create function public.current_role_name() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = (select auth.uid())), false)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('instructor', 'admin') from public.profiles where id = (select auth.uid())), false)
$$;

-- A new auth user always becomes a LEARNER, whatever the sign-up metadata says (no self-made admins).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_handle text := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'handle', ''), '[^a-zA-Z0-9_]', '', 'g'));
begin
  if char_length(v_handle) < 3 then
    v_handle := 'learner_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if exists (select 1 from public.profiles where handle = v_handle) then
    v_handle := left(v_handle, 15) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, handle, display_name, timezone)
  values (
    new.id,
    v_handle,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), v_handle),
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'UTC')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles are visible to signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "people update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Column privileges: a learner may change their name, handle, timezone, goal and Wisp persona. Nothing else.
revoke update on public.profiles from authenticated, anon;
grant update (handle, display_name, timezone, daily_goal_minutes, wisp_persona) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Courses (islands), units, lessons, questions, answer keys
-- ---------------------------------------------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  island_name text not null check (char_length(island_name) between 2 and 60),
  guardian text not null default 'byte' check (guardian in ('byte', 'nova', 'mystery')),
  topic text not null check (topic in ('code', 'data', 'design', 'money', 'languages', 'mind')),
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  summary text not null default '' check (char_length(summary) <= 600),
  owner_id uuid not null references public.profiles (id),
  status public.course_status not null default 'draft',
  version int not null default 1 check (version >= 1),
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index courses_owner_idx on public.courses (owner_id);
create index courses_live_idx on public.courses (status) where deleted_at is null;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position int not null check (position >= 1),
  title text not null check (char_length(title) between 2 and 120),
  summary text not null default '',
  unique (course_id, position) deferrable initially deferred
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  position int not null check (position >= 1),
  kind public.lesson_kind not null,
  title text not null check (char_length(title) between 2 and 120),
  summary text not null default '',
  duration_seconds int check (duration_seconds is null or duration_seconds between 10 and 1800),
  video_path text,
  transcript text,
  xp int not null default 15 check (xp between 0 and 100),
  deleted_at timestamptz,
  unique (unit_id, position) deferrable initially deferred
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  position int not null check (position >= 1),
  prompt text not null check (char_length(prompt) between 3 and 500),
  code text,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  concept text not null check (char_length(concept) between 2 and 80),
  unique (lesson_id, position) deferrable initially deferred
);

-- The answer key: never readable by learners. Graded only inside submit_answer().
create table public.answer_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_index int not null check (correct_index >= 0),
  explanation text not null check (char_length(explanation) between 3 and 1000),
  mistakes jsonb not null default '{}'::jsonb,
  verified boolean not null default false
);

create function public.course_of_unit(p_unit uuid) returns uuid
language sql stable security definer set search_path = '' as $$ select course_id from public.units where id = p_unit $$;
create function public.course_of_lesson(p_lesson uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.course_id from public.lessons l join public.units u on u.id = l.unit_id where l.id = p_lesson
$$;
create function public.course_of_question(p_question uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.course_id from public.questions q join public.lessons l on l.id = q.lesson_id join public.units u on u.id = l.unit_id
  where q.id = p_question
$$;

-- Who may see a course: anyone if it's live; its owner and admins always.
create function public.can_view_course(p_course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course
      and (
        (c.status = 'live' and c.deleted_at is null)
        or c.owner_id = (select auth.uid())
        or public.is_admin()
      )
  )
$$;

-- Who may change a course's content: its owner (an instructor) and admins.
create function public.can_edit_course(p_course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course and c.deleted_at is null
      and ((c.owner_id = (select auth.uid()) and public.is_staff()) or public.is_admin())
  )
$$;

alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.answer_keys enable row level security;

create policy "live courses are public; owners and admins see their own" on public.courses
  for select to anon, authenticated using (public.can_view_course(id));
create policy "instructors create courses they own" on public.courses
  for insert to authenticated with check (owner_id = (select auth.uid()) and public.is_staff() and status = 'draft');
create policy "owners and admins edit courses" on public.courses
  for update to authenticated using (public.can_edit_course(id)) with check (public.can_edit_course(id) or public.is_admin());

create policy "units follow their course (read)" on public.units
  for select to anon, authenticated using (public.can_view_course(course_id));
create policy "units follow their course (write)" on public.units
  for all to authenticated using (public.can_edit_course(course_id)) with check (public.can_edit_course(course_id));

create policy "lessons follow their course (read)" on public.lessons
  for select to anon, authenticated using (public.can_view_course(public.course_of_unit(unit_id)) and (deleted_at is null or public.can_edit_course(public.course_of_unit(unit_id))));
create policy "lessons follow their course (write)" on public.lessons
  for all to authenticated using (public.can_edit_course(public.course_of_unit(unit_id))) with check (public.can_edit_course(public.course_of_unit(unit_id)));

create policy "questions follow their course (read)" on public.questions
  for select to anon, authenticated using (public.can_view_course(public.course_of_lesson(lesson_id)));
create policy "questions follow their course (write)" on public.questions
  for all to authenticated using (public.can_edit_course(public.course_of_lesson(lesson_id))) with check (public.can_edit_course(public.course_of_lesson(lesson_id)));

create policy "only editors see and change answer keys" on public.answer_keys
  for all to authenticated using (public.can_edit_course(public.course_of_question(question_id))) with check (public.can_edit_course(public.course_of_question(question_id)));

-- Status rules: owners move draft <-> in_review; only admins publish (live) or archive. Slug/owner never move.
create function public.guard_course_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id <> old.owner_id and not public.is_admin() then
    raise exception 'Only an admin can change who owns a course' using errcode = '42501';
  end if;
  if new.status <> old.status and not public.is_admin() then
    if not ((old.status = 'draft' and new.status = 'in_review') or (old.status = 'in_review' and new.status = 'draft')) then
      raise exception 'Only an admin can publish or archive a course' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger courses_guard before update on public.courses for each row execute function public.guard_course_update();

-- ---------------------------------------------------------------------------------------------------------------
-- Learner progress: written only by RPCs
-- ---------------------------------------------------------------------------------------------------------------
create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  chosen_index int not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index attempts_user_question_idx on public.attempts (user_id, question_id);

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_awarded int not null default 0,
  primary key (user_id, lesson_id)
);

-- One row per concept a learner has met: the spaced-repetition state. Overdue rows are "the fog".
create table public.memory_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  concept text not null,
  stability real not null default 1,
  difficulty real not null default 5,
  reps int not null default 0,
  lapses int not null default 0,
  last_review_at timestamptz,
  due_at timestamptz not null default now() + interval '1 day',
  primary key (user_id, course_id, concept)
);

alter table public.attempts enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.memory_items enable row level security;

create policy "learners see their own attempts; editors see their course's" on public.attempts
  for select to authenticated using (user_id = (select auth.uid()) or public.can_edit_course(public.course_of_question(question_id)));
create policy "learners see their own progress; editors see their course's" on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()) or public.can_edit_course(public.course_of_lesson(lesson_id)));
create policy "learners see their own memory" on public.memory_items
  for select to authenticated using (user_id = (select auth.uid()));

-- Grade one answer. Reveals the key only after the learner has committed to an answer.
create function public.submit_answer(p_question uuid, p_choice int)
returns table (correct boolean, correct_index int, explanation text, mistake text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_key public.answer_keys;
  v_course uuid := public.course_of_question(p_question);
begin
  if v_uid is null then raise exception 'Sign in to answer' using errcode = '28000'; end if;
  if v_course is null or not public.can_view_course(v_course) then
    raise exception 'No such question' using errcode = 'P0002';
  end if;
  select * into v_key from public.answer_keys k where k.question_id = p_question;
  if not found then raise exception 'This question has no answer key yet' using errcode = 'P0002'; end if;

  insert into public.attempts (user_id, question_id, chosen_index, correct)
  values (v_uid, p_question, p_choice, p_choice = v_key.correct_index);

  return query select p_choice = v_key.correct_index, v_key.correct_index, v_key.explanation,
    v_key.mistakes ->> p_choice::text;
end;
$$;

-- Finish a lesson: Light once per lesson, the daily flame in the learner's own timezone, and the concepts it
-- taught enter the memory schedule. Quiz-type lessons require every question answered correctly at least once.
create function public.complete_lesson(p_lesson uuid)
returns table (xp_awarded int, light int, flame_days int, first_time boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_course uuid := public.course_of_lesson(p_lesson);
  v_lesson public.lessons;
  v_profile public.profiles;
  v_today date;
  v_new_flame int;
  v_new_embers int;
  v_inserted int;
  v_xp int := 0;
begin
  if v_uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if v_course is null or not public.can_view_course(v_course) then
    raise exception 'No such lesson' using errcode = 'P0002';
  end if;
  select * into v_lesson from public.lessons where id = p_lesson and deleted_at is null;
  if not found then raise exception 'No such lesson' using errcode = 'P0002'; end if;

  if exists (
    select 1 from public.questions q
    where q.lesson_id = p_lesson
      and not exists (select 1 from public.attempts a where a.user_id = v_uid and a.question_id = q.id and a.correct)
  ) then
    raise exception 'Answer every question correctly first' using errcode = '22023';
  end if;

  insert into public.lesson_progress (user_id, lesson_id, xp_awarded)
  values (v_uid, p_lesson, v_lesson.xp)
  on conflict (user_id, lesson_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then v_xp := v_lesson.xp; end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  v_today := (now() at time zone v_profile.timezone)::date;
  v_new_flame := v_profile.flame_days;
  v_new_embers := v_profile.embers;
  if v_profile.last_goal_date is null or v_profile.last_goal_date < v_today then
    if v_profile.last_goal_date = v_today - 1 then
      v_new_flame := v_profile.flame_days + 1;
    elsif v_profile.last_goal_date = v_today - 2 and v_profile.embers > 0 then
      v_new_flame := v_profile.flame_days + 1;   -- one missed day, covered by an Ember automatically
      v_new_embers := v_profile.embers - 1;
    else
      v_new_flame := 1;
    end if;
  end if;

  update public.profiles p set
    light = p.light + v_xp,
    flame_days = v_new_flame,
    best_flame = greatest(p.best_flame, v_new_flame),
    embers = v_new_embers,
    last_goal_date = v_today
  where p.id = v_uid;

  insert into public.memory_items (user_id, course_id, concept)
  select distinct v_uid, v_course, q.concept from public.questions q where q.lesson_id = p_lesson
  on conflict do nothing;

  return query select v_xp, p.light, p.flame_days, v_inserted = 1 from public.profiles p where p.id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- AI generation jobs (watched live by the studio over Realtime), Wisp safety flags, audit log, certificates
-- ---------------------------------------------------------------------------------------------------------------
create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  kind text not null check (kind in ('outline', 'lesson', 'quiz', 'video')),
  target_id uuid,
  status public.job_status not null default 'queued',
  progress int not null default 0 check (progress between 0 and 100),
  message text not null default '',
  error text,
  attempts int not null default 0,
  requests_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index generation_jobs_course_idx on public.generation_jobs (course_id, created_at desc);

create table public.wisp_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  category text not null check (category in ('integrity', 'wellbeing', 'abuse', 'off_topic', 'other')),
  learner_text text not null,
  wisp_text text not null,
  status text not null default 'open' check (status in ('open', 'approved', 'adjusted', 'escalated')),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.generation_jobs enable row level security;
alter table public.wisp_flags enable row level security;
alter table public.audit_log enable row level security;
alter table public.certificates enable row level security;

create policy "editors see their course's jobs" on public.generation_jobs
  for select to authenticated using (public.can_edit_course(course_id));
create policy "editors queue jobs for their courses" on public.generation_jobs
  for insert to authenticated with check (public.can_edit_course(course_id) and requested_by = (select auth.uid()) and status = 'queued');
create policy "admins review Wisp flags" on public.wisp_flags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read the audit log" on public.audit_log
  for select to authenticated using (public.is_admin());
create policy "learners see their certificates" on public.certificates
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Roles change only here: admins only, logged, and the last admin can't be demoted.
create function public.set_user_role(p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_old public.app_role;
begin
  if not public.is_admin() then raise exception 'Only admins can change roles' using errcode = '42501'; end if;
  select role into v_old from public.profiles where id = p_user for update;
  if not found then raise exception 'No such person' using errcode = 'P0002'; end if;
  if v_old = 'admin' and p_role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Lumo needs at least one admin' using errcode = '22023';
  end if;
  update public.profiles set role = p_role where id = p_user;
  insert into public.audit_log (actor_id, action, target, details)
  values ((select auth.uid()), 'set_role', p_user::text, jsonb_build_object('from', v_old, 'to', p_role));
end;
$$;

-- Function privileges: helpers are callable (policies need them), RPCs only by signed-in users.
revoke execute on function public.submit_answer(uuid, int), public.complete_lesson(uuid), public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.submit_answer(uuid, int), public.complete_lesson(uuid), public.set_user_role(uuid, public.app_role) to authenticated;

-- Live job updates for the studio.
alter publication supabase_realtime add table public.generation_jobs;

-- ---------------------------------------------------------------------------------------------------------------
-- Storage: lesson media (public once a course is live) and instructor sources (private)
-- Object paths start with the course id: <course_id>/<file>
-- ---------------------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('course-media', 'course-media', true, 52428800, array['video/mp4', 'video/webm', 'image/png', 'image/jpeg', 'image/webp', 'text/vtt']),
  ('course-sources', 'course-sources', false, 52428800, array['application/pdf', 'text/plain', 'text/markdown', 'video/mp4', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do nothing;

create policy "editors upload course files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('course-media', 'course-sources') and public.can_edit_course(((storage.foldername(name))[1])::uuid));
create policy "editors replace course files" on storage.objects
  for update to authenticated
  using (bucket_id in ('course-media', 'course-sources') and public.can_edit_course(((storage.foldername(name))[1])::uuid));
create policy "editors delete course files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('course-media', 'course-sources') and public.can_edit_course(((storage.foldername(name))[1])::uuid));
create policy "editors read their sources" on storage.objects
  for select to authenticated
  using (bucket_id = 'course-sources' and public.can_edit_course(((storage.foldername(name))[1])::uuid));
