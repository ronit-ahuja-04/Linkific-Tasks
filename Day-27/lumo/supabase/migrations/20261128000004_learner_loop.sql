-- Lumo M3: the learner loop.
--
--   * Onboarding: a learner picks an island, a daily goal and Wisp's personality (finish_onboarding). Where they
--     start on the path (start_unit) comes from Wisp's placement check; it only moves the START marker, so it's
--     safe to take from the client.
--   * Enrollments: the islands a learner has started; the map opens the most recent one.
--   * Fog review: memory_items are scheduled with FSRS (fsrs_next). Overdue items are "the fog". review_answer
--     grades on the server, reschedules, and gives a little Light only for items that were actually due.
--   * The daily flame logic moves into bump_flame(), shared by lessons and reviews.

-- ---------------------------------------------------------------------------------------------------------------
-- Onboarding and enrollments
-- ---------------------------------------------------------------------------------------------------------------
alter table public.profiles add column onboarded_at timestamptz;
-- Everyone who already has an account has been using Lumo; only new sign-ups see the setup chat.
update public.profiles set onboarded_at = now() where onboarded_at is null;

create table public.enrollments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  start_unit int not null default 1 check (start_unit >= 1),
  enrolled_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.enrollments enable row level security;
create policy "learners see their own enrollments" on public.enrollments
  for select to authenticated using (user_id = (select auth.uid()));
-- Written only by the functions below.

create function public.finish_onboarding(p_course uuid, p_goal int, p_persona text, p_start_unit int default 1)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_units int;
begin
  if v_uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if p_goal not in (3, 10, 20, 30) then raise exception 'Pick 3, 10, 20 or 30 minutes' using errcode = '22023'; end if;
  if p_persona not in ('cheeky', 'calm', 'coach') then raise exception 'Unknown Wisp personality' using errcode = '22023'; end if;
  if not exists (select 1 from public.courses where id = p_course and status = 'live' and deleted_at is null) then
    raise exception 'That island isn''t open' using errcode = 'P0002';
  end if;
  select count(*) into v_units from public.units where course_id = p_course;
  if p_start_unit < 1 or p_start_unit > greatest(v_units, 1) then
    raise exception 'No such unit' using errcode = '22023';
  end if;

  update public.profiles
  set daily_goal_minutes = p_goal, wisp_persona = p_persona, onboarded_at = coalesce(onboarded_at, now())
  where id = v_uid;

  insert into public.enrollments (user_id, course_id, start_unit)
  values (v_uid, p_course, p_start_unit)
  on conflict (user_id, course_id) do update set start_unit = excluded.start_unit, last_opened_at = now();
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- The daily flame (moved out of complete_lesson so reviews keep it alive too). Internal: not callable by clients.
-- ---------------------------------------------------------------------------------------------------------------
create function public.bump_flame(p_uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles;
  v_today date;
  v_flame int;
  v_embers int;
begin
  select * into v_profile from public.profiles where id = p_uid for update;
  v_today := (now() at time zone v_profile.timezone)::date;
  v_flame := v_profile.flame_days;
  v_embers := v_profile.embers;
  if v_profile.last_goal_date is null or v_profile.last_goal_date < v_today then
    if v_profile.last_goal_date = v_today - 1 then
      v_flame := v_profile.flame_days + 1;
    elsif v_profile.last_goal_date = v_today - 2 and v_profile.embers > 0 then
      v_flame := v_profile.flame_days + 1;   -- one missed day, covered by an Ember automatically
      v_embers := v_profile.embers - 1;
    else
      v_flame := 1;
    end if;
  end if;
  update public.profiles set
    flame_days = v_flame,
    best_flame = greatest(best_flame, v_flame),
    embers = v_embers,
    last_goal_date = v_today
  where id = p_uid;
end;
$$;

-- Same contract as before; now also records the enrollment and uses bump_flame().
create or replace function public.complete_lesson(p_lesson uuid)
returns table (xp_awarded int, light int, flame_days int, first_time boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_course uuid := public.course_of_lesson(p_lesson);
  v_lesson public.lessons;
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

  update public.profiles p set light = p.light + v_xp where p.id = v_uid;
  perform public.bump_flame(v_uid);

  insert into public.enrollments (user_id, course_id) values (v_uid, v_course)
  on conflict (user_id, course_id) do update set last_opened_at = now();

  insert into public.memory_items (user_id, course_id, concept)
  select distinct v_uid, v_course, q.concept from public.questions q where q.lesson_id = p_lesson
  on conflict do nothing;

  return query select v_xp, p.light, p.flame_days, v_inserted = 1 from public.profiles p where p.id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- FSRS (Free Spaced Repetition Scheduler, v4.5 default weights). Two grades: a wrong answer is "Again" (1), a right
-- one is "Good" (3). With the 90 % target retention FSRS-4.5 is built around, the next interval in days equals the
-- new stability. A first review (reps = 0) uses the initial stability and difficulty for the grade.
-- ---------------------------------------------------------------------------------------------------------------
create function public.fsrs_next(
  p_stability real, p_difficulty real, p_reps int, p_elapsed_days real, p_correct boolean
) returns table (stability real, difficulty real, interval_days real)
language plpgsql immutable set search_path = '' as $$
declare
  w constant real[] := array[0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367,
                             1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
  -- w[1] in SQL is FSRS's w0.
  g int := case when p_correct then 3 else 1 end;
  r real;
  s real;
  d real;
begin
  if p_reps = 0 then
    s := w[g];                             -- S0(G) = w_{G-1}
    d := w[5] - (g - 3) * w[6];            -- D0(G) = w4 - (G - 3) * w5
  else
    r := power(1 + (19.0 / 81.0) * greatest(p_elapsed_days, 0) / greatest(p_stability, 0.01), -0.5);
    if p_correct then
      s := p_stability * (1 + exp(w[9]) * (11 - p_difficulty) * power(p_stability, -w[10]) * (exp(w[11] * (1 - r)) - 1));
    else
      s := least(p_stability,
                 w[12] * power(p_difficulty, -w[13]) * (power(p_stability + 1, w[14]) - 1) * exp(w[15] * (1 - r)));
    end if;
    -- Difficulty moves with the grade, then reverts a little towards the default.
    d := w[8] * (w[5]) + (1 - w[8]) * (p_difficulty - w[7] * (g - 3));
  end if;
  d := least(10, greatest(1, d));
  s := greatest(0.1, s);
  return query select s, d,
    case when p_correct then least(365, greatest(1, round(s)))::real
         else (10.0 / 1440.0)::real        -- a miss comes back in 10 minutes
    end;
end;
$$;

-- Ideas the learner should review now (the fog), each with one question for that idea. At most 10 per session,
-- oldest first, so a long absence never becomes a wall of red.
create function public.due_reviews(p_limit int default 10)
returns table (course_id uuid, island_name text, concept text, question_id uuid, prompt text, code text, options jsonb, due_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.course_id, c.island_name, m.concept, q.id, q.prompt, q.code, q.options, m.due_at
  from public.memory_items m
  join public.courses c on c.id = m.course_id and c.status = 'live' and c.deleted_at is null
  cross join lateral (
    select q.id, q.prompt, q.code, q.options
    from public.questions q
    join public.lessons l on l.id = q.lesson_id and l.deleted_at is null
    join public.units u on u.id = l.unit_id
    where u.course_id = m.course_id and q.concept = m.concept
      and exists (select 1 from public.answer_keys k where k.question_id = q.id)
    order by random()
    limit 1
  ) q
  where m.user_id = (select auth.uid()) and m.due_at <= now()
  order by m.due_at
  limit least(greatest(coalesce(p_limit, 10), 1), 10)
$$;

-- Which ideas of one island are foggy right now (by the server's clock), for the map.
create function public.fog_concepts(p_course uuid)
returns table (concept text, due_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.concept, m.due_at from public.memory_items m
  where m.user_id = (select auth.uid()) and m.course_id = p_course and m.due_at <= now()
  order by m.due_at
$$;

create function public.review_answer(p_question uuid, p_choice int)
returns table (correct boolean, correct_index int, explanation text, mistake text, next_due_at timestamptz, light_awarded int)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_course uuid := public.course_of_question(p_question);
  v_key public.answer_keys;
  v_concept text;
  v_item public.memory_items;
  v_next record;
  v_correct boolean;
  v_light int := 0;
  v_elapsed real;
begin
  if v_uid is null then raise exception 'Sign in to review' using errcode = '28000'; end if;
  if v_course is null or not public.can_view_course(v_course) then
    raise exception 'No such question' using errcode = 'P0002';
  end if;
  select concept into v_concept from public.questions where id = p_question;
  select * into v_key from public.answer_keys k where k.question_id = p_question;
  if not found then raise exception 'This question has no answer key yet' using errcode = 'P0002'; end if;
  select * into v_item from public.memory_items m
  where m.user_id = v_uid and m.course_id = v_course and m.concept = v_concept for update;
  if not found then raise exception 'You haven''t learned this idea yet' using errcode = 'P0002'; end if;

  v_correct := p_choice = v_key.correct_index;
  insert into public.attempts (user_id, question_id, chosen_index, correct) values (v_uid, p_question, p_choice, v_correct);

  v_elapsed := extract(epoch from now() - coalesce(v_item.last_review_at, v_item.due_at - interval '1 day')) / 86400.0;
  select * into v_next from public.fsrs_next(v_item.stability, v_item.difficulty, v_item.reps, v_elapsed, v_correct);

  update public.memory_items m set
    stability = v_next.stability,
    difficulty = v_next.difficulty,
    reps = m.reps + 1,
    lapses = m.lapses + (case when v_correct then 0 else 1 end),
    last_review_at = now(),
    due_at = now() + v_next.interval_days * interval '1 day'
  where m.user_id = v_uid and m.course_id = v_course and m.concept = v_concept;

  -- Light only for clearing real fog (an item that was due), so reviewing early can't be farmed.
  if v_correct and v_item.due_at <= now() then
    v_light := 2;
    update public.profiles p set light = p.light + v_light where p.id = v_uid;
    perform public.bump_flame(v_uid);
  end if;

  return query select v_correct, v_key.correct_index, v_key.explanation, v_key.mistakes ->> p_choice::text,
    now() + v_next.interval_days * interval '1 day', v_light;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.bump_flame(uuid) from public, anon, authenticated;
revoke execute on function
  public.finish_onboarding(uuid, int, text, int), public.due_reviews(int), public.fog_concepts(uuid),
  public.review_answer(uuid, int)
from public, anon;
grant execute on function
  public.finish_onboarding(uuid, int, text, int), public.due_reviews(int), public.fog_concepts(uuid),
  public.review_answer(uuid, int)
to authenticated;
