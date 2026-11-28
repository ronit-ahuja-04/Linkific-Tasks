-- Lumo M5: certificates anyone can verify, a no-sign-up taste, and the safety queue.
--
--   * claim_certificate(): only when every visible lesson of a live island is finished; verify_certificate() lets
--     anyone check a certificate code (it shows only the name, the island and the date).
--   * taste_check(): visitors can try the first unit's questions without an account. Nothing is saved, and only
--     first-unit questions of live islands can be checked this way.
--   * report_content(): any signed-in person can flag a question or explanation ("the answer is wrong",
--     "upsetting"). Admins review flags (wellbeing first) with review_flag(); instructors see flags on their
--     own courses so they can fix them. Everything is audit-logged.

-- ---------------------------------------------------------------------------------------------------------------
-- Certificates
-- ---------------------------------------------------------------------------------------------------------------
create function public.claim_certificate(p_course uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_missing int;
  v_total int;
  v_code text;
begin
  if v_uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses where id = p_course and status = 'live' and deleted_at is null) then
    raise exception 'That island isn''t open' using errcode = 'P0002';
  end if;
  select count(*), count(*) filter (where p.lesson_id is null) into v_total, v_missing
  from public.lessons l
  join public.units u on u.id = l.unit_id and u.course_id = p_course and u.published
  left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = v_uid
  where l.deleted_at is null;
  if v_total = 0 then raise exception 'This island has no lessons yet' using errcode = '22023'; end if;
  if v_missing > 0 then
    raise exception 'Finish every lesson first (% to go)', v_missing using errcode = '22023';
  end if;
  insert into public.certificates (user_id, course_id) values (v_uid, p_course) on conflict (user_id, course_id) do nothing;
  select code into v_code from public.certificates where user_id = v_uid and course_id = p_course;
  return v_code;
end;
$$;

-- Public check of a certificate code. Returns nothing for an unknown code.
create function public.verify_certificate(p_code text)
returns table (display_name text, course_title text, island_name text, guardian text, issued_at timestamptz, lessons int)
language sql stable security definer set search_path = '' as $$
  select p.display_name, c.title, c.island_name, c.guardian, ce.issued_at,
         (select count(*)::int from public.lessons l join public.units u on u.id = l.unit_id
          where u.course_id = c.id and u.published and l.deleted_at is null)
  from public.certificates ce
  join public.profiles p on p.id = ce.user_id
  join public.courses c on c.id = ce.course_id
  where ce.code = upper(btrim(p_code))
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- A taste without an account: grade first-unit questions of live islands, save nothing
-- ---------------------------------------------------------------------------------------------------------------
create function public.taste_check(p_question uuid, p_choice int)
returns table (correct boolean, correct_index int, explanation text, mistake text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_course uuid := public.course_of_question(p_question);
  v_unit uuid;
  v_first uuid;
  v_key public.answer_keys;
begin
  select l.unit_id into v_unit from public.questions q join public.lessons l on l.id = q.lesson_id
  where q.id = p_question and l.deleted_at is null;
  select u.id into v_first from public.units u
  where u.course_id = v_course and u.published order by u.position limit 1;
  if v_course is null or v_unit is distinct from v_first
     or not exists (select 1 from public.courses where id = v_course and status = 'live' and deleted_at is null) then
    raise exception 'Only the first unit can be tasted without an account' using errcode = '42501';
  end if;
  select * into v_key from public.answer_keys k where k.question_id = p_question;
  if not found then raise exception 'This question has no answer key yet' using errcode = 'P0002'; end if;
  return query select p_choice = v_key.correct_index, v_key.correct_index, v_key.explanation,
    v_key.mistakes ->> p_choice::text;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Reports and the safety queue
-- ---------------------------------------------------------------------------------------------------------------
alter table public.wisp_flags add column question_id uuid references public.questions (id) on delete set null;
alter table public.wisp_flags add column admin_note text check (char_length(admin_note) <= 1000);
alter table public.wisp_flags add column reviewed_at timestamptz;
create index wisp_flags_open_idx on public.wisp_flags (status, created_at);

create policy "instructors see reports on their courses" on public.wisp_flags
  for select to authenticated using (course_id is not null and public.can_edit_course(course_id));

create function public.report_content(p_question uuid, p_category text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_course uuid := public.course_of_question(p_question);
  v_shown text;
begin
  if v_uid is null then raise exception 'Sign in to report' using errcode = '28000'; end if;
  if v_course is null or not public.can_view_course(v_course) then
    raise exception 'No such question' using errcode = 'P0002';
  end if;
  if p_category not in ('integrity', 'wellbeing', 'abuse', 'off_topic', 'other') then
    raise exception 'Pick what''s wrong' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Keep the note under 500 characters' using errcode = '22023';
  end if;
  -- A gentle cap, so the queue can't be flooded: 20 reports a day per person.
  if (select count(*) from public.wisp_flags where user_id = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Thanks! You''ve sent a lot of reports today; we''ll look at those first.' using errcode = '22023';
  end if;
  select q.prompt || coalesce(E'\n\nExplanation: ' || k.explanation, '') into v_shown
  from public.questions q left join public.answer_keys k on k.question_id = q.id where q.id = p_question;
  insert into public.wisp_flags (user_id, course_id, question_id, category, learner_text, wisp_text)
  values (v_uid, v_course, p_question, p_category, coalesce(btrim(p_note), ''), v_shown);
end;
$$;

create function public.review_flag(p_flag uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only admins review reports' using errcode = '42501'; end if;
  if p_status not in ('approved', 'adjusted', 'escalated') then
    raise exception 'Unknown decision' using errcode = '22023';
  end if;
  update public.wisp_flags
  set status = p_status, admin_note = nullif(btrim(coalesce(p_note, '')), ''), reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_flag;
  if not found then raise exception 'No such report' using errcode = 'P0002'; end if;
  insert into public.audit_log (actor_id, action, target, details)
  values ((select auth.uid()), 'review_flag', p_flag::text, jsonb_build_object('status', p_status));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.claim_certificate(uuid), public.report_content(uuid, text, text),
  public.review_flag(uuid, text, text) from public, anon;
grant execute on function public.claim_certificate(uuid), public.report_content(uuid, text, text),
  public.review_flag(uuid, text, text) to authenticated;
-- Visitors may verify certificates and taste a first unit.
grant execute on function public.verify_certificate(text), public.taste_check(uuid, int) to anon, authenticated;
