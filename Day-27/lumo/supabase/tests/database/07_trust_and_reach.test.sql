-- M5: certificates (earned, verifiable by anyone), the no-account taste, and the reports queue.
begin;
select plan(17);

-- Code Reef's questions: one in its first published unit, one in a later unit (whatever order the studio set).
create temporary table ids on commit drop as
with ordered as (
  select u.id, row_number() over (order by u.position) as n from public.units u
  where u.course_id = 'c0000000-0000-4000-8000-000000000001' and u.published
)
select
  (select q.id from public.questions q join public.lessons l on l.id = q.lesson_id
     join ordered o on o.id = l.unit_id where o.n = 1 and l.deleted_at is null limit 1) as first_q,
  (select q.id from public.questions q join public.lessons l on l.id = q.lesson_id
     join ordered o on o.id = l.unit_id where o.n > 1 and l.deleted_at is null limit 1) as later_q;
grant select on ids to anon, authenticated;

-- A visitor.
set local role anon;
select is((select count(*) from public.taste_check((select first_q from ids), 0)), 1::bigint, 'a visitor can taste a first-unit question');
select throws_ok($$ select * from public.taste_check((select later_q from ids), 0) $$, '42501', null, 'but not questions beyond the first unit');
select is((select count(*) from public.verify_certificate('NOPE123456')), 0::bigint, 'an unknown certificate code verifies as nothing');
select throws_ok($$ select public.report_content((select first_q from ids), 'other', 'x') $$, '42501', null, 'a visitor can''t file reports');
reset role;

-- Maya.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ select public.claim_certificate('c0000000-0000-4000-8000-000000000001') $$, '22023', null, 'no certificate before every lesson is finished');

-- She finishes the island (written as the owner, like complete_lesson would).
reset role;
insert into public.lesson_progress (user_id, lesson_id)
select 'a0000000-0000-4000-8000-000000000001', l.id from public.lessons l
join public.units u on u.id = l.unit_id
where u.course_id = 'c0000000-0000-4000-8000-000000000001' and u.published and l.deleted_at is null
on conflict do nothing;
set local role authenticated;

create temporary table cert on commit drop as select public.claim_certificate('c0000000-0000-4000-8000-000000000001') as code;
select ok((select length(code) = 10 from cert), 'finishing every lesson earns a certificate code');
select is(public.claim_certificate('c0000000-0000-4000-8000-000000000001'), (select code from cert), 'claiming again returns the same certificate');

select throws_ok($$ select public.report_content((select first_q from ids), 'nonsense', '') $$, '22023', null, 'a report needs a known category');
select lives_ok($$ select public.report_content((select first_q from ids), 'integrity', 'I think B is right') $$, 'a learner can report a question');
select is((select count(*) from public.wisp_flags), 0::bigint, 'learners can''t read the reports queue');

reset role;
grant select on cert to anon;
set local role anon;
select is((select display_name from public.verify_certificate((select lower(code) from cert))), 'Maya Iyer', 'anyone with the code can verify it (case doesn''t matter)');
reset role;
set local role authenticated;

-- Riya owns Code Reef: she sees the report so she can fix the content, but she doesn't rule on it.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.wisp_flags where learner_text = 'I think B is right'), 1::bigint, 'the course''s instructor sees reports on it');
select ok((select wisp_text like '%Explanation:%' from public.wisp_flags where learner_text = 'I think B is right'), 'the report keeps exactly what the learner was shown');
select throws_ok($$ select public.review_flag((select id from public.wisp_flags limit 1), 'approved') $$, '42501', null, 'instructors can''t close reports');

-- The admin rules on it.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select lives_ok($$ select public.review_flag((select id from public.wisp_flags where learner_text = 'I think B is right'), 'adjusted', 'Fixed the explanation') $$, 'an admin reviews the report');
select is((select status from public.wisp_flags where learner_text = 'I think B is right'), 'adjusted', 'the decision is saved');
select is((select count(*) from public.audit_log where action = 'review_flag'
  and target = (select id::text from public.wisp_flags where learner_text = 'I think B is right')), 1::bigint, 'and written to the audit log');

select * from finish();
rollback;
