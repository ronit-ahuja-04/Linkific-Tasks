-- The learner loop (M3): onboarding, enrollments, FSRS scheduling, and the fog coming back the next day.
begin;
select plan(24);

create temporary table ids on commit drop as
select
  (select id from public.lessons where title = 'What prints?') as quiz,
  (select id from public.questions q where q.lesson_id = (select id from public.lessons where title = 'What prints?') and position = 1) as q1,
  (select id from public.questions q where q.lesson_id = (select id from public.lessons where title = 'What prints?') and position = 2) as q2,
  (select q.id from public.questions q join public.lessons l on l.id = q.lesson_id join public.units u on u.id = l.unit_id
     where u.course_id = 'c0000000-0000-4000-8000-000000000003' limit 1) as other_course_q;
grant select on ids to authenticated;

-- FSRS maths (pure function).
select is((select round(stability::numeric, 2) from public.fsrs_next(1, 5, 0, 0, true)), 3.71, 'a first right answer starts at the FSRS initial stability for "Good"');
select is((select interval_days from public.fsrs_next(1, 5, 0, 0, true)), 4::real, '…so the next review is in about 4 days');
select ok((select interval_days < 0.01 from public.fsrs_next(1, 5, 0, 0, false)), 'a miss comes back within minutes');
select ok((select stability > 10 from public.fsrs_next(4, 5, 1, 4, true)), 'remembering after 4 days grows stability a lot');
select ok((select stability < 4 from public.fsrs_next(4, 5, 1, 4, false)), 'forgetting shrinks stability');
select ok((select difficulty > 5 from public.fsrs_next(4, 5, 1, 4, false)), 'forgetting makes the idea count as harder');

-- Maya, a learner.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ select public.finish_onboarding('c0000000-0000-4000-8000-000000000001', 7, 'calm') $$, '22023', null, 'the daily goal must be one of the offered options');
select throws_ok($$ select public.finish_onboarding('c0000000-0000-4000-8000-000000000002', 10, 'calm') $$, 'P0002', null, 'a draft island can''t be joined');
select throws_ok($$ select public.finish_onboarding('c0000000-0000-4000-8000-000000000001', 10, 'calm', 99) $$, '22023', null, 'the start unit must exist');
select lives_ok($$ select public.finish_onboarding('c0000000-0000-4000-8000-000000000001', 20, 'calm', 2) $$, 'onboarding saves goal, personality and placement');
select is((select daily_goal_minutes from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 20, 'the goal is saved');
select is((select start_unit from public.enrollments where course_id = 'c0000000-0000-4000-8000-000000000001'), 2, 'the placement is saved on the enrollment');
select throws_ok($$ select public.bump_flame('a0000000-0000-4000-8000-000000000001') $$, '42501', null, 'the flame can''t be bumped directly');

-- Finish the quiz: its two ideas enter the schedule, due tomorrow, so there's no fog today.
select public.submit_answer((select q1 from ids), 0);
select public.submit_answer((select q2 from ids), 1);
select public.complete_lesson((select quiz from ids));
select is((select count(*) from public.memory_items where user_id = 'a0000000-0000-4000-8000-000000000001'), 2::bigint, 'two ideas are now remembered');
select is((select count(*) from public.due_reviews()), 0::bigint, 'no fog on the day you learn something');
select throws_ok($$ select * from public.review_answer((select other_course_q from ids), 0) $$, 'P0002', null, 'you can''t review an idea you never learned');

-- Time travel: a day later (moved as the database owner, like the clock passing).
reset role;
update public.memory_items set due_at = now() - interval '1 minute', last_review_at = now() - interval '1 day'
where user_id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;

select is((select count(*) from public.due_reviews()), 2::bigint, 'the next day both ideas are foggy');
select is((select count(*) from public.fog_concepts('c0000000-0000-4000-8000-000000000001')), 2::bigint, 'the map sees the fog on Code Reef');

select is((select correct from public.review_answer((select q1 from ids), 2)), false, 'a wrong review answer is graded wrong');
select ok(
  (select due_at < now() + interval '1 hour' and lapses = 1 from public.memory_items where user_id = 'a0000000-0000-4000-8000-000000000001' and concept = 'for-loop bounds'),
  'a missed idea comes back soon and counts a lapse'
);
select is((select light_awarded from public.review_answer((select q2 from ids), 1)), 2, 'clearing real fog gives 2 Light');
select ok(
  (select due_at > now() + interval '1 day' from public.memory_items where user_id = 'a0000000-0000-4000-8000-000000000001' and concept = 'while checks first'),
  'a remembered idea is pushed days ahead'
);
select is((select light_awarded from public.review_answer((select q2 from ids), 1)), 0, 'reviewing again early gives no Light');

-- Sam can't see Maya's enrollment.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.enrollments where user_id = 'a0000000-0000-4000-8000-000000000001'), 0::bigint, 'enrollments are private');

select * from finish();
rollback;
