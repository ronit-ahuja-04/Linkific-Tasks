-- Lumo M2: the course studio.
--
--   * Lesson media becomes private: a file is readable only by people who can see its course (drafts stop leaking).
--   * New units, lessons and questions get the next position automatically; reordering is one atomic call.
--   * A question and its answer key are saved together (save_question), so a question never exists without a key.
--   * Content of a live course can't be hard-deleted (learner progress would cascade away): hide lessons instead.
--   * Courses are soft-deleted through delete_course (audit-logged); only admins remove live ones.
--   * Generation jobs: one active job per course and kind; editors can cancel. A worker (fake now, Gemini in M4)
--     writes progress with the service role, and the studio watches it over Realtime.

-- ---------------------------------------------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------------------------------------------

-- The course id is the first folder of every object path. Returns null (instead of failing) for anything else.
create function public.course_from_path(p_name text) returns uuid
language plpgsql stable set search_path = '' as $$
declare
  v_first text := (storage.foldername(p_name))[1];
begin
  if v_first ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

update storage.buckets set public = false where id = 'course-media';

drop policy "editors upload course files" on storage.objects;
drop policy "editors replace course files" on storage.objects;
drop policy "editors delete course files" on storage.objects;
drop policy "editors read their sources" on storage.objects;

create policy "editors upload course files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('course-media', 'course-sources') and public.can_edit_course(public.course_from_path(name)));
create policy "editors replace course files" on storage.objects
  for update to authenticated
  using (bucket_id in ('course-media', 'course-sources') and public.can_edit_course(public.course_from_path(name)));
create policy "editors delete course files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('course-media', 'course-sources') and public.can_edit_course(public.course_from_path(name)));
create policy "editors read their sources" on storage.objects
  for select to authenticated
  using (bucket_id = 'course-sources' and public.can_edit_course(public.course_from_path(name)));
create policy "media is visible to whoever can see its course" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'course-media' and public.can_view_course(public.course_from_path(name)));

-- ---------------------------------------------------------------------------------------------------------------
-- Positions: append automatically, reorder atomically
-- ---------------------------------------------------------------------------------------------------------------
create function public.next_position() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.position is null then
    if tg_table_name = 'units' then
      select coalesce(max(position), 0) + 1 into new.position from public.units where course_id = new.course_id;
    elsif tg_table_name = 'lessons' then
      select coalesce(max(position), 0) + 1 into new.position from public.lessons where unit_id = new.unit_id;
    else
      select coalesce(max(position), 0) + 1 into new.position from public.questions where lesson_id = new.lesson_id;
    end if;
  end if;
  return new;
end;
$$;
create trigger units_next_position before insert on public.units for each row execute function public.next_position();
create trigger lessons_next_position before insert on public.lessons for each row execute function public.next_position();
create trigger questions_next_position before insert on public.questions for each row execute function public.next_position();

-- p_ids must be exactly the unit's current units/lessons (hidden ones included), in the new order.
create function public.reorder_units(p_course uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_course(p_course) then
    raise exception 'You can''t edit this course' using errcode = '42501';
  end if;
  if (select array_agg(id order by id) from public.units where course_id = p_course)
     is distinct from (select array_agg(x order by x) from unnest(p_ids) x) then
    raise exception 'The units changed while you were editing. Reload and try again.' using errcode = '22023';
  end if;
  update public.units u set position = o.ord
  from unnest(p_ids) with ordinality as o(id, ord) where u.id = o.id;
end;
$$;

create function public.reorder_lessons(p_unit uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_course(public.course_of_unit(p_unit)) then
    raise exception 'You can''t edit this course' using errcode = '42501';
  end if;
  if (select array_agg(id order by id) from public.lessons where unit_id = p_unit)
     is distinct from (select array_agg(x order by x) from unnest(p_ids) x) then
    raise exception 'The lessons changed while you were editing. Reload and try again.' using errcode = '22023';
  end if;
  update public.lessons l set position = o.ord
  from unnest(p_ids) with ordinality as o(id, ord) where l.id = o.id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Deletes that would lose learner history
-- ---------------------------------------------------------------------------------------------------------------
create function public.guard_live_content_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_course uuid;
begin
  -- IF branches, not CASE: PL/pgSQL would resolve every CASE branch's field on the row and fail.
  if tg_table_name = 'units' then
    v_course := old.course_id;
  elsif tg_table_name = 'lessons' then
    v_course := public.course_of_unit(old.unit_id);
  else
    v_course := public.course_of_lesson(old.lesson_id);
  end if;
  -- This also blocks a cascade from hard-deleting a live course: archive it first (courses are soft-deleted anyway).
  if v_course is not null and exists (select 1 from public.courses where id = v_course and status = 'live') then
    raise exception 'This course is live: learners'' progress depends on it. Hide the lesson instead.' using errcode = '42501';
  end if;
  return old;
end;
$$;
create trigger units_guard_delete before delete on public.units for each row execute function public.guard_live_content_delete();
create trigger lessons_guard_delete before delete on public.lessons for each row execute function public.guard_live_content_delete();
create trigger questions_guard_delete before delete on public.questions for each row execute function public.guard_live_content_delete();

create function public.delete_course(p_course uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_course public.courses;
begin
  select * into v_course from public.courses where id = p_course and deleted_at is null for update;
  if not found or not public.can_edit_course(p_course) then
    raise exception 'No such course' using errcode = 'P0002';
  end if;
  if v_course.status = 'live' and not public.is_admin() then
    raise exception 'Learners are using this course. Ask an admin to archive it.' using errcode = '42501';
  end if;
  update public.courses set deleted_at = now() where id = p_course;
  insert into public.audit_log (actor_id, action, target, details)
  values ((select auth.uid()), 'delete_course', p_course::text,
          jsonb_build_object('title', v_course.title, 'status', v_course.status));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Questions and answer keys, saved together
-- ---------------------------------------------------------------------------------------------------------------
create function public.save_question(
  p_lesson uuid,
  p_question uuid,
  p_prompt text,
  p_code text,
  p_options jsonb,
  p_concept text,
  p_correct_index int,
  p_explanation text,
  p_mistakes jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_course uuid := public.course_of_lesson(p_lesson);
  v_id uuid;
  v_count int;
begin
  if v_course is null or not public.can_edit_course(v_course) then
    raise exception 'You can''t edit this lesson' using errcode = '42501';
  end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 2 and 6 then
    raise exception 'A question needs 2 to 6 options' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p_options);
  if exists (
    select 1 from jsonb_array_elements(p_options) e
    where jsonb_typeof(e) <> 'string' or char_length(btrim(e #>> '{}')) not between 1 and 200
  ) then
    raise exception 'Every option needs text (up to 200 characters)' using errcode = '22023';
  end if;
  if (select count(distinct lower(btrim(e #>> '{}'))) from jsonb_array_elements(p_options) e) <> v_count then
    raise exception 'Two options say the same thing' using errcode = '22023';
  end if;
  if p_correct_index is null or p_correct_index < 0 or p_correct_index >= v_count then
    raise exception 'Choose which option is correct' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_mistakes, '{}'::jsonb)) <> 'object' then
    raise exception 'Mistake notes must be an object keyed by option number' using errcode = '22023';
  end if;

  if p_question is null then
    insert into public.questions (lesson_id, prompt, code, options, concept)
    values (p_lesson, btrim(p_prompt), nullif(p_code, ''), p_options, btrim(p_concept))
    returning id into v_id;
  else
    update public.questions
    set prompt = btrim(p_prompt), code = nullif(p_code, ''), options = p_options, concept = btrim(p_concept)
    where id = p_question and lesson_id = p_lesson
    returning id into v_id;
    if v_id is null then raise exception 'No such question' using errcode = 'P0002'; end if;
  end if;

  -- A person saved it, so the key is verified (AI drafts arrive unverified).
  insert into public.answer_keys (question_id, correct_index, explanation, mistakes, verified)
  values (v_id, p_correct_index, btrim(p_explanation), coalesce(p_mistakes, '{}'::jsonb), true)
  on conflict (question_id) do update
  set correct_index = excluded.correct_index, explanation = excluded.explanation,
      mistakes = excluded.mistakes, verified = true;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Generation jobs
-- ---------------------------------------------------------------------------------------------------------------
create unique index generation_jobs_one_active_idx on public.generation_jobs (course_id, kind)
  where status in ('queued', 'running', 'waiting_quota');

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger generation_jobs_touch before update on public.generation_jobs
  for each row execute function public.touch_updated_at();

create function public.cancel_job(p_job uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_course uuid;
begin
  select course_id into v_course from public.generation_jobs where id = p_job;
  if v_course is null or not public.can_edit_course(v_course) then
    raise exception 'No such job' using errcode = 'P0002';
  end if;
  update public.generation_jobs set status = 'cancelled', message = 'Cancelled'
  where id = p_job and status in ('queued', 'running', 'waiting_quota');
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function
  public.reorder_units(uuid, uuid[]), public.reorder_lessons(uuid, uuid[]), public.delete_course(uuid),
  public.save_question(uuid, uuid, text, text, jsonb, text, int, text, jsonb), public.cancel_job(uuid)
from public, anon;
grant execute on function
  public.reorder_units(uuid, uuid[]), public.reorder_lessons(uuid, uuid[]), public.delete_course(uuid),
  public.save_question(uuid, uuid, text, text, jsonb, text, int, text, jsonb), public.cancel_job(uuid)
to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Creating a course and reading it back in one request (insert ... returning) needs the read policy to pass on
-- the new row. can_view_course() looks the course up in the table, and a row inserted by the same statement isn't
-- visible to that lookup, so owners are also matched directly on the row.
-- ---------------------------------------------------------------------------------------------------------------
drop policy "live courses are public; owners and admins see their own" on public.courses;
create policy "live courses are public; owners and admins see their own" on public.courses
  for select to anon, authenticated
  using (owner_id = (select auth.uid()) or public.can_view_course(id));
