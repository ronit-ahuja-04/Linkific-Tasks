-- =================================================================================================
-- SkillForge LMS (RPG Edition) — Initial Schema, RLS Policies, Storage & Authoritative RPCs
-- =================================================================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------------------------------------------
-- 1. Profiles, Character Class, Pip Companion & Role Helpers
-- -------------------------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_-]{3,24}$'),
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  character_class text not null default 'frontend_mage'
    check (character_class in ('frontend_mage', 'backend_knight', 'fullstack_ranger', 'design_bard')),
  pip_tint int not null default 0 check (pip_tint >= 0 and pip_tint <= 7),
  pip_accessory int not null default 0 check (pip_accessory >= 0 and pip_accessory <= 5),
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_instructor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('instructor', 'admin')
  );
$$;

create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    if auth.uid() is not null then
      raise exception 'Only admins may change user roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.prevent_non_admin_role_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_handle text;
  v_class text;
begin
  v_base := regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1))), '[^a-z0-9_-]', '', 'g');
  if length(v_base) < 3 then
    v_base := 'hero_' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  v_handle := left(v_base, 18);
  if exists (select 1 from public.profiles where handle = v_handle) then
    v_handle := left(v_base, 15) || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  v_class := coalesce(new.raw_user_meta_data ->> 'character_class', 'frontend_mage');
  if v_class not in ('frontend_mage', 'backend_knight', 'fullstack_ranger', 'design_bard') then
    v_class := 'frontend_mage';
  end if;

  insert into public.profiles (id, handle, full_name, character_class, pip_tint, pip_accessory, avatar_url)
  values (
    new.id,
    v_handle,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    v_class,
    greatest(0, least(7, coalesce((new.raw_user_meta_data ->> 'pip_tint')::int, 0))),
    greatest(0, least(5, coalesce((new.raw_user_meta_data ->> 'pip_accessory')::int, 0))),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles are readable by public Guild Hall and course viewers"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- -------------------------------------------------------------------------------------------------
-- 2. Course Realms, Modules & Lesson Quests
-- -------------------------------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  category text not null,
  skill_tag text not null default 'react'
    check (skill_tag in ('frontend', 'backend', 'react', 'typescript', 'database', 'design', 'testing')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  xp_reward int not null default 250 check (xp_reward >= 0),
  thumbnail_url text,
  estimated_minutes int not null default 0 check (estimated_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_status_category_idx on public.courses (status, category, level);
create index courses_instructor_idx on public.courses (instructor_id);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position int not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create index modules_course_position_idx on public.modules (course_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  video_url text not null default '',
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  summary_md text not null default '',
  difficulty text not null default 'normal' check (difficulty in ('easy', 'normal', 'hard', 'boss')),
  xp_reward int not null default 50 check (xp_reward >= 0),
  position int not null default 0 check (position >= 0),
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create index lessons_module_position_idx on public.lessons (module_id, position);

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;

create policy "Published courses are viewable by everyone; drafts by owner or admin"
  on public.courses for select
  using (status = 'published' or instructor_id = auth.uid() or public.is_admin());

create policy "Instructors and admins can create courses"
  on public.courses for insert
  with check (instructor_id = auth.uid() and public.is_instructor_or_admin());

create policy "Owners and admins can update courses"
  on public.courses for update
  using (instructor_id = auth.uid() or public.is_admin())
  with check (instructor_id = auth.uid() or public.is_admin());

create policy "Owners and admins can delete courses"
  on public.courses for delete
  using (instructor_id = auth.uid() or public.is_admin());

create policy "Modules inherit visibility from parent course"
  on public.modules for select
  using (
    exists (
      select 1 from public.courses c
      where c.id = modules.course_id
        and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Course owners and admins manage modules"
  on public.modules for all
  using (
    exists (
      select 1 from public.courses c
      where c.id = modules.course_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = modules.course_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  );

-- -------------------------------------------------------------------------------------------------
-- 3. Enrollments & Lesson Progress (1 row per user/lesson = zero XP farming)
-- -------------------------------------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create index enrollments_user_idx on public.enrollments (user_id);
create index enrollments_course_idx on public.enrollments (course_id);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  watched_seconds int not null default 0 check (watched_seconds >= 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  last_watched_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index lesson_progress_user_idx on public.lesson_progress (user_id, lesson_id);

alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "Lessons readable for preview, enrolled learners, or course owners"
  on public.lessons for select
  using (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and (
          (c.status = 'published' and lessons.is_preview = true)
          or c.instructor_id = auth.uid()
          or public.is_admin()
          or exists (
            select 1 from public.enrollments e
            where e.course_id = c.id and e.user_id = auth.uid()
          )
        )
    )
  );

create policy "Course owners and admins manage lessons"
  on public.lessons for all
  using (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Users view own enrollments; instructors view enrollments in own courses"
  on public.enrollments for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = enrollments.course_id and c.instructor_id = auth.uid()
    )
  );

create policy "Authenticated users can enroll in published courses"
  on public.enrollments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.courses c
      where c.id = enrollments.course_id and c.status = 'published'
    )
  );

create policy "Users or admins can delete own enrollments"
  on public.enrollments for delete
  using (user_id = auth.uid() or public.is_admin());

create policy "Users manage their own lesson progress when enrolled"
  on public.lesson_progress for all
  using (user_id = auth.uid() or public.is_admin())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.enrollments e on e.course_id = m.course_id
      where l.id = lesson_progress.lesson_id and e.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------------------------------
-- 4. Boss Quizzes, Questions, Attempts & Authoritative Grading RPC
-- -------------------------------------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  title text not null,
  passing_score int not null default 70 check (passing_score between 1 and 100),
  xp_reward int not null default 150 check (xp_reward >= 0),
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_option_index int not null check (correct_option_index >= 0),
  explanation text not null default '',
  remediation_lesson_id uuid references public.lessons (id) on delete set null,
  remediation_seconds int not null default 0 check (remediation_seconds >= 0),
  position int not null default 0 check (position >= 0)
);

create index quiz_questions_quiz_pos_idx on public.quiz_questions (quiz_id, position);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  answers jsonb not null,
  score_percent int not null check (score_percent between 0 and 100),
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

create index quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id, attempted_at desc);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "Quizzes readable for published courses or owners"
  on public.quizzes for select
  using (
    exists (
      select 1 from public.courses c
      where c.id = quizzes.course_id
        and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Course owners and admins manage quizzes"
  on public.quizzes for all
  using (
    exists (
      select 1 from public.courses c
      where c.id = quizzes.course_id and (c.instructor_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = quizzes.course_id and (c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Only course owners and admins read raw quiz questions with answer keys"
  on public.quiz_questions for select
  using (
    exists (
      select 1
      from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_questions.quiz_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Course owners and admins manage quiz questions"
  on public.quiz_questions for all
  using (
    exists (
      select 1
      from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_questions.quiz_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_questions.quiz_id
        and (c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Users view own quiz attempts; instructors view attempts on own courses"
  on public.quiz_attempts for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_attempts.quiz_id and c.instructor_id = auth.uid()
    )
  );

create or replace function public.get_student_quiz_questions(p_quiz_id uuid)
returns table (
  id uuid,
  quiz_id uuid,
  prompt text,
  options jsonb,
  "position" int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
begin
  select q.course_id into v_course_id
  from public.quizzes q
  where q.id = p_quiz_id;

  if v_course_id is null then
    raise exception 'Quiz not found';
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.course_id = v_course_id and e.user_id = auth.uid()
  ) and not exists (
    select 1 from public.courses c
    where c.id = v_course_id and (c.instructor_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'Enrollment required to access quiz questions';
  end if;

  return query
  select qq.id, qq.quiz_id, qq.prompt, qq.options, qq.position
  from public.quiz_questions qq
  where qq.quiz_id = p_quiz_id
  order by qq.position asc;
end;
$$;

create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_course_id uuid;
  v_passing int;
  v_quiz_xp int;
  v_prev_best int := 0;
  v_prev_passed boolean := false;
  v_total int := 0;
  v_correct int := 0;
  v_score int := 0;
  v_passed boolean := false;
  v_xp_earned int := 0;
  v_attempt_id uuid;
  v_breakdown jsonb := '[]'::jsonb;
  q_rec record;
  v_selected int;
  v_is_right boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select q.course_id, q.passing_score, q.xp_reward into v_course_id, v_passing, v_quiz_xp
  from public.quizzes q
  where q.id = p_quiz_id;

  if v_course_id is null then
    raise exception 'Quiz not found';
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.course_id = v_course_id and e.user_id = v_uid
  ) then
    raise exception 'Must be enrolled in course to submit quiz';
  end if;

  select coalesce(max(score_percent), 0), coalesce(bool_or(passed), false)
  into v_prev_best, v_prev_passed
  from public.quiz_attempts
  where user_id = v_uid and quiz_id = p_quiz_id;

  for q_rec in
    select qq.id, qq.correct_option_index, qq.explanation, qq.remediation_lesson_id, qq.remediation_seconds
    from public.quiz_questions qq
    where qq.quiz_id = p_quiz_id
    order by qq.position asc
  loop
    v_total := v_total + 1;
    v_selected := nullif(coalesce(p_answers, '{}'::jsonb) ->> q_rec.id::text, '')::int;
    v_is_right := (v_selected is not null and v_selected = q_rec.correct_option_index);
    if v_is_right then
      v_correct := v_correct + 1;
    end if;
    v_breakdown := v_breakdown || jsonb_build_object(
      'questionId', q_rec.id,
      'selectedIndex', v_selected,
      'correctIndex', q_rec.correct_option_index,
      'isCorrect', v_is_right,
      'explanation', q_rec.explanation,
      'remediationLessonId', q_rec.remediation_lesson_id,
      'remediationSeconds', q_rec.remediation_seconds
    );
  end loop;

  if v_total = 0 then
    raise exception 'Quiz has no questions';
  end if;

  v_score := round((v_correct::numeric / v_total::numeric) * 100)::int;
  v_passed := v_score >= v_passing;

  -- Anti-farming XP: first pass awards base xp_reward; beating previous best awards score improvement delta only
  if v_passed then
    if not v_prev_passed then
      v_xp_earned := v_quiz_xp + v_score;
    elsif v_score > v_prev_best then
      v_xp_earned := v_score - v_prev_best;
    end if;
  end if;

  insert into public.quiz_attempts (user_id, quiz_id, answers, score_percent, passed)
  values (v_uid, p_quiz_id, coalesce(p_answers, '{}'::jsonb), v_score, v_passed)
  returning id into v_attempt_id;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'scorePercent', v_score,
    'passed', v_passed,
    'passingScore', v_passing,
    'xpEarned', v_xp_earned,
    'correctCount', v_correct,
    'totalQuestions', v_total,
    'breakdown', v_breakdown
  );
end;
$$;

-- -------------------------------------------------------------------------------------------------
-- 5. Course Reviews, Mentor Badges & Certificates
-- -------------------------------------------------------------------------------------------------
create table public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create trigger course_reviews_set_updated_at
  before update on public.course_reviews
  for each row execute function public.set_updated_at();

create table public.mentor_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  awarded_by uuid references public.profiles (id) on delete set null,
  name text not null,
  icon text not null default '🏅',
  reason text not null default '',
  awarded_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  certificate_code text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.course_reviews enable row level security;
alter table public.mentor_badges enable row level security;
alter table public.certificates enable row level security;

create policy "Reviews on published courses are publicly readable"
  on public.course_reviews for select
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_reviews.course_id
        and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())
    )
  );

create policy "Enrolled students manage their own course review"
  on public.course_reviews for all
  using (user_id = auth.uid() or public.is_admin())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.course_id = course_reviews.course_id and e.user_id = auth.uid()
    )
  );

create policy "Mentor badges are publicly readable"
  on public.mentor_badges for select
  using (true);

create policy "Instructors and admins can award mentor badges"
  on public.mentor_badges for insert
  with check (public.is_instructor_or_admin() and awarded_by = auth.uid());

create policy "Certificates are publicly verifiable by code"
  on public.certificates for select
  using (true);

create or replace function public.claim_course_certificate(p_course_id uuid)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.certificates;
  v_total_lessons int;
  v_completed_lessons int;
  v_total_quizzes int;
  v_passed_quizzes int;
  v_code text;
  v_created public.certificates;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id and e.user_id = v_uid
  ) then
    raise exception 'User is not enrolled in this course';
  end if;

  select * into v_existing
  from public.certificates cert
  where cert.course_id = p_course_id and cert.user_id = v_uid;

  if v_existing.id is not null then
    return v_existing;
  end if;

  select count(*) into v_total_lessons
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course_id;

  select count(*) into v_completed_lessons
  from public.lessons l
  join public.modules m on m.id = l.module_id
  join public.lesson_progress lp on lp.lesson_id = l.id and lp.user_id = v_uid
  where m.course_id = p_course_id and lp.is_completed = true;

  if v_total_lessons = 0 or v_completed_lessons < v_total_lessons then
    raise exception 'All course lessons must be completed before claiming certificate';
  end if;

  select count(*) into v_total_quizzes
  from public.quizzes q
  where q.course_id = p_course_id;

  select count(distinct q.id) into v_passed_quizzes
  from public.quizzes q
  join public.quiz_attempts qa on qa.quiz_id = q.id and qa.user_id = v_uid
  where q.course_id = p_course_id and qa.passed = true;

  if v_passed_quizzes < v_total_quizzes then
    raise exception 'All course quizzes must be passed before claiming certificate';
  end if;

  v_code := 'SF-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.certificates (user_id, course_id, certificate_code)
  values (v_uid, p_course_id, v_code)
  returning * into v_created;

  update public.enrollments
  set completed_at = coalesce(completed_at, now())
  where user_id = v_uid and course_id = p_course_id;

  return v_created;
end;
$$;

-- -------------------------------------------------------------------------------------------------
-- 6. Deterministic Guild Hall Leaderboard View (Anti-Farming XP)
-- -------------------------------------------------------------------------------------------------
create or replace view public.guild_leaderboard as
with lesson_xp as (
  select
    lp.user_id,
    coalesce(sum(l.xp_reward), 0)::int as xp,
    count(*)::int as completed_lessons
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  where lp.is_completed = true
  group by lp.user_id
),
best_quiz as (
  select
    qa.user_id,
    qa.quiz_id,
    q.xp_reward,
    max(qa.score_percent)::int as best_score,
    bool_or(qa.passed) as any_passed
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  group by qa.user_id, qa.quiz_id, q.xp_reward
),
quiz_xp as (
  select
    user_id,
    coalesce(sum(case when any_passed then xp_reward + best_score else 0 end), 0)::int as xp,
    count(*) filter (where any_passed)::int as passed_quizzes
  from best_quiz
  group by user_id
),
cert_counts as (
  select user_id, count(*)::int as certificates_earned
  from public.certificates
  group by user_id
)
select
  p.id as user_id,
  p.handle,
  p.full_name,
  p.role,
  p.character_class,
  p.pip_tint,
  p.pip_accessory,
  (coalesce(lx.xp, 0) + coalesce(qx.xp, 0))::int as total_xp,
  coalesce(lx.completed_lessons, 0)::int as completed_lessons,
  coalesce(qx.passed_quizzes, 0)::int as passed_quizzes,
  coalesce(cc.certificates_earned, 0)::int as certificates_earned
from public.profiles p
left join lesson_xp lx on lx.user_id = p.id
left join quiz_xp qx on qx.user_id = p.id
left join cert_counts cc on cc.user_id = p.id
order by total_xp desc, p.created_at asc;

-- -------------------------------------------------------------------------------------------------
-- 7. Storage Buckets & Policies
-- -------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('course-thumbnails', 'course-thumbnails', true),
  ('lesson-videos', 'lesson-videos', false)
on conflict (id) do nothing;

create policy "Course thumbnails are publicly readable"
  on storage.objects for select
  using (bucket_id = 'course-thumbnails');

create policy "Instructors manage their own thumbnail folder"
  on storage.objects for all
  using (
    bucket_id = 'course-thumbnails'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_instructor_or_admin()
  )
  with check (
    bucket_id = 'course-thumbnails'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_instructor_or_admin()
  );

create policy "Authenticated learners and owners can read lesson videos"
  on storage.objects for select
  using (
    bucket_id = 'lesson-videos'
    and auth.role() = 'authenticated'
  );

create policy "Instructors manage their own lesson video folder"
  on storage.objects for all
  using (
    bucket_id = 'lesson-videos'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_instructor_or_admin()
  )
  with check (
    bucket_id = 'lesson-videos'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_instructor_or_admin()
  );
