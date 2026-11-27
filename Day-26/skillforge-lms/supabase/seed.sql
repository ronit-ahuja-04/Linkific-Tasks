-- Local development seed data (`npm run db:reset`).
-- Demo accounts (password: demo-password-123):
--   Instructor: dev@skillforge.local  (@dev)
--   Admin:      admin@skillforge.local (@alex)
--   Students:   maya@skillforge.local (@maya), ada@skillforge.local (@ada)

do $$
declare
  v_instructor uuid := '11111111-1111-4111-8111-111111111111';
  v_student    uuid := '22222222-2222-4222-8222-222222222222';
  v_ada        uuid := '33333333-3333-4333-8333-333333333333';
  v_admin      uuid := '44444444-4444-4444-8444-444444444444';
  v_course_1   uuid;
  v_course_2   uuid;
  v_course_3   uuid;
  v_mod_1      uuid;
  v_mod_2      uuid;
  v_mod_3      uuid;
  v_mod_4      uuid;
  v_lesson_1   uuid;
  v_lesson_2   uuid;
  v_lesson_3   uuid;
  v_lesson_4   uuid;
  v_quiz_1     uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values
    (
      '00000000-0000-0000-0000-000000000000', v_instructor, 'authenticated', 'authenticated',
      'dev@skillforge.local', extensions.crypt('demo-password-123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Prof. Dev","handle":"dev","character_class":"fullstack_ranger","pip_tint":4,"pip_accessory":1}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_student, 'authenticated', 'authenticated',
      'maya@skillforge.local', extensions.crypt('demo-password-123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Maya Sharma","handle":"maya","character_class":"frontend_mage","pip_tint":1,"pip_accessory":4}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_ada, 'authenticated', 'authenticated',
      'ada@skillforge.local', extensions.crypt('demo-password-123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Ada Lovelace","handle":"ada","character_class":"backend_knight","pip_tint":2,"pip_accessory":2}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
      'admin@skillforge.local', extensions.crypt('demo-password-123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Alex Mercer","handle":"alex","character_class":"design_bard","pip_tint":5,"pip_accessory":1}',
      now(), now(), '', '', '', ''
    );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values
    (gen_random_uuid(), v_instructor, v_instructor::text, jsonb_build_object('sub', v_instructor::text, 'email', 'dev@skillforge.local'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_student, v_student::text, jsonb_build_object('sub', v_student::text, 'email', 'maya@skillforge.local'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_ada, v_ada::text, jsonb_build_object('sub', v_ada::text, 'email', 'ada@skillforge.local'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_admin, v_admin::text, jsonb_build_object('sub', v_admin::text, 'email', 'admin@skillforge.local'), 'email', now(), now(), now());

  update public.profiles set role = 'instructor' where id = v_instructor;
  update public.profiles set role = 'admin' where id = v_admin;

  insert into public.courses (
    instructor_id, slug, title, subtitle, description, category, skill_tag, level, status, xp_reward, estimated_minutes
  )
  values (
    v_instructor,
    'react-architecture-design-patterns',
    'React Architecture & Design Patterns',
    'Feature-sliced realms, typed Redux Toolkit, and scalable component boundaries',
    'Master production React 19 + TypeScript patterns with predictable state flows, compound components, and clean module isolation.',
    'Frontend',
    'react',
    'intermediate',
    'published',
    450,
    180
  )
  returning id into v_course_1;

  insert into public.courses (
    instructor_id, slug, title, subtitle, description, category, skill_tag, level, status, xp_reward, estimated_minutes
  )
  values (
    v_instructor,
    'supabase-postgres-security-mastery',
    'Supabase & Postgres Security Mastery',
    'Row Level Security, RPCs, and multi-role access control',
    'Design tamper-resistant multi-tenant schemas using Postgres RLS, security-definer RPCs, and local Docker workflows.',
    'Backend',
    'database',
    'beginner',
    'published',
    350,
    140
  )
  returning id into v_course_2;

  insert into public.courses (
    instructor_id, slug, title, subtitle, description, category, skill_tag, level, status, xp_reward, estimated_minutes
  )
  values (
    v_instructor,
    'tactile-design-systems-tailwind-v4',
    'Tactile Design Systems with Tailwind v4',
    'Playful RPG interfaces, accessible contrast, and Motion micro-interactions',
    'Craft expressive UI tokens, dark modes, SVG companions, and reduced-motion-safe animations that delight learners.',
    'Design',
    'design',
    'advanced',
    'published',
    500,
    160
  )
  returning id into v_course_3;

  insert into public.modules (course_id, title, position)
  values (v_course_1, 'Chapter 1: Component Design Foundations', 1)
  returning id into v_mod_1;

  insert into public.modules (course_id, title, position)
  values (v_course_1, 'Chapter 2: Typed Redux Toolkit State', 2)
  returning id into v_mod_2;

  insert into public.modules (course_id, title, position)
  values (v_course_2, 'Chapter 1: RLS Fundamentals', 1)
  returning id into v_mod_3;

  insert into public.modules (course_id, title, position)
  values (v_course_3, 'Chapter 1: Semantic CSS Tokens', 1)
  returning id into v_mod_4;

  insert into public.lessons (module_id, title, video_url, duration_seconds, summary_md, difficulty, xp_reward, position, is_preview)
  values
    (v_mod_1, '1.1 Composition & Feature Boundaries', '', 420, 'Organize features around domains rather than technical file types.', 'easy', 50, 1, true)
    returning id into v_lesson_1;

  insert into public.lessons (module_id, title, video_url, duration_seconds, summary_md, difficulty, xp_reward, position, is_preview)
  values
    (v_mod_1, '1.2 Compound Components in Strict TypeScript', '', 540, 'Build flexible UI primitives without prop-drilling explosions.', 'normal', 100, 2, false)
    returning id into v_lesson_2;

  insert into public.lessons (module_id, title, video_url, duration_seconds, summary_md, difficulty, xp_reward, position, is_preview)
  values
    (v_mod_2, '2.1 Typed Store, Slices & Async Thunks', '', 600, 'Configure Redux Toolkit with zero explicit any and clean API adapters.', 'hard', 150, 1, false)
    returning id into v_lesson_3;

  insert into public.lessons (module_id, title, video_url, duration_seconds, summary_md, difficulty, xp_reward, position, is_preview)
  values
    (v_mod_3, '1.1 How Row Level Security Works', '', 480, 'Write enforceable SELECT, INSERT, UPDATE, and DELETE policies in Postgres.', 'normal', 100, 1, true)
    returning id into v_lesson_4;

  insert into public.lessons (module_id, title, video_url, duration_seconds, summary_md, difficulty, xp_reward, position, is_preview)
  values
    (v_mod_4, '1.1 Token Systems & Dark Theme Contrast', '', 390, 'Bridge CSS variables into Tailwind v4 @theme inline utilities.', 'normal', 100, 1, true);

  insert into public.quizzes (course_id, module_id, title, passing_score, xp_reward)
  values (v_course_1, v_mod_1, 'Boss Battle: Chapter 1 Architecture Check', 70, 250)
  returning id into v_quiz_1;

  insert into public.quiz_questions (quiz_id, prompt, options, correct_option_index, explanation, remediation_lesson_id, remediation_seconds, position)
  values
    (
      v_quiz_1,
      'Where should quiz answers be graded in SkillForge LMS?',
      '["Inside the React QuizPage component", "Inside a Postgres SECURITY DEFINER RPC", "Inside localStorage"]'::jsonb,
      1,
      'Server-side Postgres RPC grading prevents exposing correct_option_index or letting clients forge scores.',
      v_lesson_1,
      45,
      1
    ),
    (
      v_quiz_1,
      'Which Redux Toolkit helper exposes typed dispatch and selector hooks?',
      '["useDispatch.withTypes and useSelector.withTypes", "React.createContext", "window.__REDUX__"]'::jsonb,
      0,
      'Typed hooks in src/app/hooks.ts give full RootState and AppDispatch inference without any.',
      v_lesson_3,
      120,
      2
    );

  insert into public.enrollments (user_id, course_id)
  values (v_student, v_course_1), (v_ada, v_course_1), (v_ada, v_course_2);

  insert into public.lesson_progress (user_id, lesson_id, watched_seconds, is_completed, completed_at)
  values
    (v_student, v_lesson_1, 420, true, now() - interval '1 day'),
    (v_ada, v_lesson_1, 420, true, now() - interval '2 days'),
    (v_ada, v_lesson_2, 540, true, now() - interval '1 day'),
    (v_ada, v_lesson_4, 480, true, now());

  insert into public.quiz_attempts (user_id, quiz_id, answers, score_percent, passed)
  values (v_ada, v_quiz_1, '{}'::jsonb, 100, true);

  insert into public.course_reviews (user_id, course_id, rating, comment)
  values
    (v_student, v_course_1, 5, 'Turning chapters into quests with Pip made architecture actually stick.'),
    (v_ada, v_course_1, 5, 'Boss battles catch misconceptions right away.');
end $$;
