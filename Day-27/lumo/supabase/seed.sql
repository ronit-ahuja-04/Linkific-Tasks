-- Local seed (`npm run db:reset`). Demo accounts, all with the password: lumo-demo-123
--   Learner:    maya@lumo.local   (@maya)
--   Learner:    sam@lumo.local    (@sam)
--   Instructor: riya@lumo.local   (@riya)
--   Admin:      admin@lumo.local  (@admin)
-- They exist only in the local database. The cloud project gets its own accounts.

do $$
declare
  v_maya  uuid := 'a0000000-0000-4000-8000-000000000001';
  v_sam   uuid := 'a0000000-0000-4000-8000-000000000002';
  v_riya  uuid := 'a0000000-0000-4000-8000-000000000003';
  v_admin uuid := 'a0000000-0000-4000-8000-000000000004';
  v_reef  uuid := 'c0000000-0000-4000-8000-000000000001';
  v_lagoon uuid := 'c0000000-0000-4000-8000-000000000002';
  v_u1 uuid; v_u2 uuid;
  v_l uuid; v_q uuid;
  r record;
begin
  for r in
    select * from (values
      (v_maya,  'maya@lumo.local',  'maya',  'Maya Iyer'),
      (v_sam,   'sam@lumo.local',   'sam',   'Sam Okafor'),
      (v_riya,  'riya@lumo.local',  'riya',  'Riya Menon'),
      (v_admin, 'admin@lumo.local', 'admin', 'Lumo Admin')
    ) as t(id, email, handle, display_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', r.email,
      extensions.crypt('lumo-demo-123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('handle', r.handle, 'display_name', r.display_name, 'timezone', 'Asia/Kolkata'),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), r.id, r.id::text, jsonb_build_object('sub', r.id::text, 'email', r.email), 'email', now(), now(), now());
  end loop;

  update public.profiles set role = 'instructor' where id = v_riya;
  update public.profiles set role = 'admin' where id = v_admin;

  -- Code Reef: live, owned by Riya.
  insert into public.courses (id, slug, title, island_name, guardian, topic, level, summary, owner_id, status)
  values (v_reef, 'javascript-foundations', 'JavaScript Foundations', 'Code Reef', 'byte', 'code', 'beginner',
    'Variables, loops and functions in 90-second bites, taught by Byte the robot crab.', v_riya, 'live');

  insert into public.units (course_id, position, title, summary) values
    (v_reef, 1, 'Variables', 'Boxes with names: let, const and strings.') returning id into v_u1;
  insert into public.units (course_id, position, title, summary) values
    (v_reef, 2, 'Loops that know when to stop', 'for, while, and the moment a loop ends.') returning id into v_u2;

  insert into public.lessons (unit_id, position, kind, title, summary, duration_seconds, xp) values
    (v_u1, 1, 'video', 'Boxes with names', 'What a variable is, in 90 seconds.', 88, 10);

  insert into public.lessons (unit_id, position, kind, title, summary, xp) values
    (v_u1, 2, 'quiz', 'let or const?', 'Pick the right box.', 15) returning id into v_l;
  insert into public.questions (lesson_id, position, prompt, code, options, concept) values
    (v_l, 1, 'Which line throws an error?', E'const a = 1;\na = 2;', '["const a = 1;", "a = 2;", "Neither"]', 'let vs const')
    returning id into v_q;
  insert into public.answer_keys (question_id, correct_index, explanation, mistakes, verified) values
    (v_q, 1, 'A const can be set once. Giving it a new value throws a TypeError.',
     '{"0": "Declaring a const is fine; changing it later is the problem.", "2": "Reassigning a const always throws."}', true);

  insert into public.lessons (unit_id, position, kind, title, summary, duration_seconds, xp) values
    (v_u2, 1, 'video', 'For-loops in 90 seconds', 'Start, check, step.', 92, 10);

  insert into public.lessons (unit_id, position, kind, title, summary, xp) values
    (v_u2, 2, 'quiz', 'What prints?', 'Read a loop like the computer does.', 15) returning id into v_l;
  insert into public.questions (lesson_id, position, prompt, code, options, concept) values
    (v_l, 1, 'What will this print?', E'for (let i = 0; i < 3; i++) {\n  console.log(i)\n}', '["0 1 2", "1 2 3", "0 1 2 3"]', 'for-loop bounds')
    returning id into v_q;
  insert into public.answer_keys (question_id, correct_index, explanation, mistakes, verified) values
    (v_q, 0, 'i starts at 0, and the loop stops the moment i < 3 is false.',
     '{"1": "The loop starts where you tell it: i = 0, not 1.", "2": "When i is 3, i < 3 is false, so 3 is never printed."}', true);
  insert into public.questions (lesson_id, position, prompt, code, options, concept) values
    (v_l, 2, 'What does this print?', E'let i = 5;\nwhile (i < 3) { console.log(i); i++ }', '["5", "nothing", "5 6 7", "3 4"]', 'while checks first')
    returning id into v_q;
  insert into public.answer_keys (question_id, correct_index, explanation, mistakes, verified) values
    (v_q, 1, 'A while loop checks before the first lap. 5 < 3 is false, so it never starts.',
     '{"0": "The body never runs: the check fails before the first lap.", "2": "The check fails straight away, so nothing repeats.", "3": "i starts at 5, not 3, and the loop never runs."}', true);

  insert into public.lessons (unit_id, position, kind, title, summary, xp) values
    (v_u2, 3, 'guardian', 'Byte''s loop gauntlet', 'Mixed questions from the whole unit.', 30);

  -- Starfall Lagoon: Riya's draft, invisible to learners.
  insert into public.courses (id, slug, title, island_name, guardian, topic, level, summary, owner_id, status, ai_generated)
  values (v_lagoon, 'data-basics', 'Data Basics', 'Starfall Lagoon', 'nova', 'data', 'beginner',
    'Read the stars, then your own spreadsheets.', v_riya, 'draft', true);
end;
$$;
