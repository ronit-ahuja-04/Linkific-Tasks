-- Lumo M4: the AI content pipeline.
--
--   * Units drafted by Wisp arrive unpublished: learners can't see them (or their lessons and questions) until an
--     editor has checked every question and published the unit with publish_unit(). This holds even on a live
--     course, so AI content never reaches learners unreviewed.
--   * Generation jobs carry the instructor's request (input), a result summary, and run_after, so a job that hit
--     the free quota waits and resumes later instead of failing.

-- ---------------------------------------------------------------------------------------------------------------
-- Draft units
-- ---------------------------------------------------------------------------------------------------------------
alter table public.units add column published boolean not null default true;
alter table public.units add column ai_drafted boolean not null default false;

-- A unit is visible to learners when its course is and it's published; editors always see it.
create function public.unit_visible(p_unit uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.units u
    where u.id = p_unit
      and public.can_view_course(u.course_id)
      and (u.published or public.can_edit_course(u.course_id))
  )
$$;

drop policy "units follow their course (read)" on public.units;
create policy "units follow their course (read)" on public.units
  for select to anon, authenticated
  using (public.can_view_course(course_id) and (published or public.can_edit_course(course_id)));

drop policy "lessons follow their course (read)" on public.lessons;
create policy "lessons follow their course (read)" on public.lessons
  for select to anon, authenticated
  using (public.unit_visible(unit_id) and (deleted_at is null or public.can_edit_course(public.course_of_unit(unit_id))));

drop policy "questions follow their course (read)" on public.questions;
create policy "questions follow their course (read)" on public.questions
  for select to anon, authenticated
  using (public.unit_visible((select l.unit_id from public.lessons l where l.id = lesson_id)));

-- Publishing a drafted unit: only editors, and only once every question's answer key has been checked by a person.
create function public.publish_unit(p_unit uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_course uuid := public.course_of_unit(p_unit);
  v_unchecked int;
begin
  if v_course is null or not public.can_edit_course(v_course) then
    raise exception 'You can''t edit this course' using errcode = '42501';
  end if;
  select count(*) into v_unchecked
  from public.questions q
  join public.lessons l on l.id = q.lesson_id and l.deleted_at is null
  left join public.answer_keys k on k.question_id = q.id
  where l.unit_id = p_unit and (k.question_id is null or not k.verified);
  if v_unchecked > 0 then
    raise exception 'Check every question first (% still unchecked)', v_unchecked using errcode = '22023';
  end if;
  update public.units set published = true where id = p_unit;
  insert into public.audit_log (actor_id, action, target, details)
  values ((select auth.uid()), 'publish_unit', p_unit::text, jsonb_build_object('course', v_course));
end;
$$;

-- Reviews (a SECURITY DEFINER function, so it doesn't go through RLS) must skip unpublished units too.
create or replace function public.due_reviews(p_limit int default 10)
returns table (course_id uuid, island_name text, concept text, question_id uuid, prompt text, code text, options jsonb, due_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.course_id, c.island_name, m.concept, q.id, q.prompt, q.code, q.options, m.due_at
  from public.memory_items m
  join public.courses c on c.id = m.course_id and c.status = 'live' and c.deleted_at is null
  cross join lateral (
    select q.id, q.prompt, q.code, q.options
    from public.questions q
    join public.lessons l on l.id = q.lesson_id and l.deleted_at is null
    join public.units u on u.id = l.unit_id and u.published
    where u.course_id = m.course_id and q.concept = m.concept
      and exists (select 1 from public.answer_keys k where k.question_id = q.id)
    order by random()
    limit 1
  ) q
  where m.user_id = (select auth.uid()) and m.due_at <= now()
  order by m.due_at
  limit least(greatest(coalesce(p_limit, 10), 1), 10)
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Generation jobs: the request, the outcome, and waiting for quota
-- ---------------------------------------------------------------------------------------------------------------
alter table public.generation_jobs add column input jsonb not null default '{}'::jsonb;
alter table public.generation_jobs add column result jsonb;
alter table public.generation_jobs add column run_after timestamptz;
alter table public.generation_jobs add constraint generation_jobs_input_topic
  check (char_length(coalesce(input ->> 'topic', '')) <= 200 and char_length(coalesce(input ->> 'notes', '')) <= 1000);

revoke execute on function public.publish_unit(uuid) from public, anon;
grant execute on function public.publish_unit(uuid) to authenticated;
