-- Grading, Light and the daily flame: all decided by the server, Light awarded once per lesson.
begin;
select plan(16);

create temporary table ids on commit drop as
select
  (select id from public.lessons where title = 'What prints?') as quiz,
  (select id from public.lessons where title = 'For-loops in 90 seconds') as video,
  (select id from public.questions q where q.lesson_id = (select id from public.lessons where title = 'What prints?') and position = 1) as q1,
  (select id from public.questions q where q.lesson_id = (select id from public.lessons where title = 'What prints?') and position = 2) as q2,
  ((now() at time zone 'Asia/Kolkata')::date) as today;
grant select on ids to authenticated;

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ insert into public.attempts (user_id, question_id, chosen_index, correct) select 'a0000000-0000-4000-8000-000000000001', q1, 0, true from ids $$, '42501', null, 'a learner cannot write an attempt directly');
select is((select correct from public.submit_answer((select q1 from ids), 1)), false, 'a wrong answer is graded wrong');
select is((select mistake from public.submit_answer((select q1 from ids), 1)), 'The loop starts where you tell it: i = 0, not 1.', 'a wrong answer returns the explanation for that mistake');
select throws_ok($$ select * from public.complete_lesson((select quiz from ids)) $$, '22023', null, 'a quiz can''t be completed before every question is right');
select is((select correct from public.submit_answer((select q1 from ids), 0)), true, 'the right answer is graded right');
select is((select correct from public.submit_answer((select q2 from ids), 1)), true, 'second question right');

select is((select xp_awarded from public.complete_lesson((select quiz from ids))), 15, 'finishing the quiz awards its 15 Light');
select is((select xp_awarded from public.complete_lesson((select quiz from ids))), 0, 'finishing it again awards nothing');
select is((select light from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 15, 'Light was added once');
select is((select flame_days from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 1, 'the first lesson ever starts a 1-day flame');
select is((select count(*) from public.memory_items where user_id = 'a0000000-0000-4000-8000-000000000001'), 2::bigint, 'both concepts entered the review schedule');

-- Flame rules (dates in Maya's timezone). Set the state as the database owner, then finish a lesson as Maya.
reset role;
update public.profiles set last_goal_date = (select today - 1 from ids), flame_days = 5 where id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select flame_days from public.complete_lesson((select video from ids))), 6, 'learning on the next day grows the flame');

reset role;
update public.profiles set last_goal_date = (select today - 2 from ids), flame_days = 6, embers = 2 where id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select flame_days from public.complete_lesson((select video from ids))), 7, 'one missed day is covered by an Ember');
select is((select embers from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 1, 'and the Ember is used up');

reset role;
update public.profiles set last_goal_date = (select today - 3 from ids), flame_days = 7 where id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select flame_days from public.complete_lesson((select video from ids))), 1, 'two missed days start the flame again');

-- A draft course's questions can't be answered by a learner.
reset role;
insert into public.units (id, course_id, position, title) values ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 1, 'Stars');
insert into public.lessons (id, unit_id, position, kind, title) values ('d0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 1, 'quiz', 'Counting stars');
insert into public.questions (id, lesson_id, position, prompt, options, concept) values ('d0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 1, 'How many?', '["1","2"]', 'counting');
insert into public.answer_keys (question_id, correct_index, explanation) values ('d0000000-0000-4000-8000-000000000003', 0, 'One.');
set local role authenticated;
select throws_ok($$ select * from public.submit_answer('d0000000-0000-4000-8000-000000000003', 0) $$, 'P0002', null, 'a learner cannot answer questions from a draft course');

select * from finish();
rollback;
