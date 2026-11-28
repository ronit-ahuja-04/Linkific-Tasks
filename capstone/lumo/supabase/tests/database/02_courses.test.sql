-- Courses: live ones are public, drafts are private, only admins publish, answer keys never reach learners.
begin;
select plan(15);

-- A visitor who isn't signed in (Explore before sign-up).
set local role anon;
select is((select count(*) from public.courses), 1::bigint, 'a visitor sees only the live course');
select is((select count(*) from public.lessons), 5::bigint, 'a visitor can see the live course''s lessons');
select is((select count(*) from public.answer_keys), 0::bigint, 'a visitor sees no answer keys');
reset role;

-- Maya, a learner.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.courses), 1::bigint, 'a learner does not see a draft course');
select is((select count(*) from public.answer_keys), 0::bigint, 'a learner sees no answer keys');
select throws_ok(
  $$ insert into public.courses (slug, title, island_name, topic, owner_id) values ('my-course', 'My course', 'My isle', 'code', 'a0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'a learner cannot create a course'
);
update public.courses set title = 'Hacked' where slug = 'javascript-foundations';
select is((select title from public.courses where slug = 'javascript-foundations'), 'JavaScript Foundations', 'a learner cannot edit a course');

-- Riya, an instructor.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.courses), 2::bigint, 'an instructor sees live courses plus their own draft');
select is((select count(*) from public.answer_keys), 3::bigint, 'an instructor sees the answer keys of their own course');
select lives_ok(
  $$ insert into public.courses (slug, title, island_name, topic, owner_id) values ('design-basics', 'Design Basics', 'Hue Hollow', 'design', 'a0000000-0000-4000-8000-000000000003') $$,
  'an instructor can create a draft course they own'
);
select throws_ok(
  $$ insert into public.courses (slug, title, island_name, topic, owner_id) values ('someone-elses', 'Not mine', 'Elsewhere', 'code', 'a0000000-0000-4000-8000-000000000002') $$,
  '42501', null, 'an instructor cannot create a course for someone else'
);
select throws_ok($$ update public.courses set status = 'live' where slug = 'data-basics' $$, '42501', null, 'an instructor cannot publish their own course');
select lives_ok($$ update public.courses set status = 'in_review' where slug = 'data-basics' $$, 'an instructor can submit their course for review');

-- The admin.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select lives_ok($$ update public.courses set status = 'live' where slug = 'data-basics' $$, 'an admin can publish a course');

-- Back to Maya: the published course is now visible.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.courses), 2::bigint, 'once published, learners see the course');

select * from finish();
rollback;
