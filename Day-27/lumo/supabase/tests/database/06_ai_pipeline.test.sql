-- The AI pipeline (M4): drafted units are hidden from learners until every question is checked and the unit is
-- published, even on a live course.
begin;
select plan(11);

-- As the worker would: a hidden draft unit in the LIVE Code Reef, with one unchecked question.
insert into public.units (id, course_id, title, published, ai_drafted)
values ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Arrays (draft)', false, true);
insert into public.lessons (id, unit_id, kind, title)
values ('e0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'quiz', 'Array check');
insert into public.questions (id, lesson_id, prompt, options, concept)
values ('e0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002', 'How long is [3,5,8]?', '["3","8"]', 'array length');
insert into public.answer_keys (question_id, correct_index, explanation, verified)
values ('e0000000-0000-4000-8000-000000000003', 0, 'Three items.', false);

-- A visitor and a learner can't see any of it.
set local role anon;
select is((select count(*) from public.units where id = 'e0000000-0000-4000-8000-000000000001'), 0::bigint, 'a visitor can''t see a draft unit');
reset role;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.units where id = 'e0000000-0000-4000-8000-000000000001'), 0::bigint, 'a learner can''t see a draft unit of a live course');
select is((select count(*) from public.lessons where id = 'e0000000-0000-4000-8000-000000000002'), 0::bigint, '…nor its lessons');
select is((select count(*) from public.questions where id = 'e0000000-0000-4000-8000-000000000003'), 0::bigint, '…nor its questions');
select throws_ok($$ select public.publish_unit('e0000000-0000-4000-8000-000000000001') $$, '42501', null, 'a learner can''t publish a unit');

-- Riya, the owner.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.units where id = 'e0000000-0000-4000-8000-000000000001'), 1::bigint, 'the owner sees the draft');
select throws_ok($$ select public.publish_unit('e0000000-0000-4000-8000-000000000001') $$, '22023', null, 'a unit with unchecked questions can''t be published');
select public.save_question('e0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003', 'How long is [3,5,8]?', null, '["3","8"]', 'array length', 0, 'Three items.');
select lives_ok($$ select public.publish_unit('e0000000-0000-4000-8000-000000000001') $$, 'once every question is checked, the owner publishes it');
select throws_ok(
  $$ insert into public.generation_jobs (course_id, requested_by, kind, input) values ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'outline', jsonb_build_object('topic', repeat('x', 201))) $$,
  '23514', null, 'a job''s topic is limited to 200 characters'
);

-- Maya now sees it.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.units where id = 'e0000000-0000-4000-8000-000000000001'), 1::bigint, 'after publishing, learners see the unit');
select is((select count(*) from public.questions where id = 'e0000000-0000-4000-8000-000000000003'), 1::bigint, '…and its questions');

select * from finish();
rollback;
