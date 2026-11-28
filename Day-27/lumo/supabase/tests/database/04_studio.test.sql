-- The studio (M2): positions, question + key saves, reordering, safe deletes, generation jobs, private media.
begin;
select plan(23);

-- Files to look for later: one in the live course, one in Riya's draft (inserted as the owner, like an upload would).
insert into storage.objects (bucket_id, name) values
  ('course-media', 'c0000000-0000-4000-8000-000000000001/lessons/test/live.mp4'),
  ('course-media', 'c0000000-0000-4000-8000-000000000002/lessons/test/draft.mp4');

select is((select public from storage.buckets where id = 'course-media'), false, 'lesson media is a private bucket');

-- A visitor: the live course's file is readable, the draft's isn't.
set local role anon;
select is((select count(*) from storage.objects where name like '%/lessons/test/live.mp4'), 1::bigint, 'a visitor can read media of a live course');
select is((select count(*) from storage.objects where name like '%/lessons/test/draft.mp4'), 0::bigint, 'a visitor cannot read media of a draft');
reset role;

-- Riya, an instructor.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from storage.objects where name like '%/lessons/test/draft.mp4'), 1::bigint, 'the owner can read media of their draft');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('course-media', 'c0000000-0000-4000-8000-000000000003/x.mp4') $$,
  '42501', null, 'an instructor cannot upload into someone else''s course'
);

select lives_ok(
  $$ insert into public.courses (slug, title, island_name, topic, owner_id) values ('returning-check', 'Returning check', 'Echo Isle', 'code', 'a0000000-0000-4000-8000-000000000003') returning id $$,
  'an instructor can create a course and read it back in the same request (what the app does)'
);
insert into public.units (course_id, title) values ('c0000000-0000-4000-8000-000000000002', 'Reading the stars');
select is((select position from public.units where title = 'Reading the stars'), 1, 'a new unit gets the next position');
insert into public.units (course_id, title) values ('c0000000-0000-4000-8000-000000000002', 'Your own spreadsheet');
select is((select position from public.units where title = 'Your own spreadsheet'), 2, 'and the next one after it');
insert into public.lessons (unit_id, kind, title) select id, 'quiz', 'Star quiz' from public.units where title = 'Reading the stars';
select is((select position from public.lessons where title = 'Star quiz'), 1, 'a new lesson gets the next position');

select isnt(
  public.save_question((select id from public.lessons where title = 'Star quiz'), null, 'Brightest star at night?', null,
    '["Sirius", "Polaris", "Vega"]', 'bright stars', 0, 'Sirius is the brightest star in the night sky.', '{"1": "Polaris is famous, not bright."}'),
  null, 'save_question creates a question'
);
select is(
  (select k.verified from public.answer_keys k join public.questions q on q.id = k.question_id where q.prompt = 'Brightest star at night?'),
  true, 'and its answer key, marked verified because a person wrote it'
);
select throws_ok(
  $$ select public.save_question((select id from public.lessons where title = 'Star quiz'), null, 'Pick one', null, '["A", "B"]', 'letters', 2, 'Because.') $$,
  '22023', 'Choose which option is correct', 'the correct option must be one of the options'
);
select throws_ok(
  $$ select public.save_question((select id from public.lessons where title = 'Star quiz'), null, 'Pick one', null, '["Yes", " yes "]', 'letters', 0, 'Because.') $$,
  '22023', 'Two options say the same thing', 'two options can''t be the same'
);

select lives_ok(
  $$ select public.reorder_units('c0000000-0000-4000-8000-000000000002',
       array[(select id from public.units where title = 'Your own spreadsheet'), (select id from public.units where title = 'Reading the stars')]) $$,
  'units can be reordered in one call'
);
select is((select position from public.units where title = 'Reading the stars'), 2, 'the order changed');
select throws_ok(
  $$ select public.reorder_units('c0000000-0000-4000-8000-000000000002', array[(select id from public.units where title = 'Reading the stars')]) $$,
  '22023', null, 'a reorder that leaves out a unit is refused'
);

select throws_ok(
  $$ delete from public.units where title = 'Variables' $$,
  '42501', null, 'a unit of a live course cannot be deleted'
);
select throws_ok(
  $$ select public.delete_course('c0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'an instructor cannot delete a live course'
);

-- Generation jobs.
insert into public.generation_jobs (course_id, requested_by, kind)
values ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'outline');
select throws_ok(
  $$ insert into public.generation_jobs (course_id, requested_by, kind) values ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'outline') $$,
  '23505', null, 'only one active job of a kind per course'
);
select public.cancel_job((select id from public.generation_jobs where course_id = 'c0000000-0000-4000-8000-000000000002'));
select is((select status::text from public.generation_jobs where course_id = 'c0000000-0000-4000-8000-000000000002'), 'cancelled', 'the editor can cancel a job');

-- Maya can't see Riya's jobs or write questions.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.generation_jobs), 0::bigint, 'a learner sees no generation jobs');
select throws_ok(
  $$ select public.save_question((select id from public.lessons where title = 'What prints?'), null, 'Hack?', null, '["a", "b"]', 'x', 0, 'Because.') $$,
  '42501', null, 'a learner cannot write questions'
);

-- Back to Riya: delete her draft (soft), and it's gone from her view.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select public.delete_course('c0000000-0000-4000-8000-000000000002');
select is((select count(*) from public.courses where slug = 'data-basics' and deleted_at is null), 0::bigint, 'a deleted draft disappears from the studio');

select * from finish();
rollback;
