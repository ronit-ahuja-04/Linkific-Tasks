-- Local demo data. NOT applied to a cloud project (see the README).
-- Everyone's password is demo-password-123 (bcrypt, made by pgcrypto; bcryptjs in the app verifies the same hashes).

insert into public.users (id, email, name, role, password_hash) values
  ('00000000-0000-4000-8000-000000000001', 'ronit@example.com', 'Ronit Ahuja', 'intern', extensions.crypt('demo-password-123', extensions.gen_salt('bf', 10))),
  ('00000000-0000-4000-8000-000000000002', 'ada@example.com', 'Ada Lovelace', 'intern', extensions.crypt('demo-password-123', extensions.gen_salt('bf', 10))),
  ('00000000-0000-4000-8000-000000000003', 'grace@example.com', 'Grace Hopper', 'intern', extensions.crypt('demo-password-123', extensions.gen_salt('bf', 10))),
  ('00000000-0000-4000-8000-000000000009', 'mentor@example.com', 'Maya (mentor)', 'mentor', extensions.crypt('demo-password-123', extensions.gen_salt('bf', 10)));

insert into public.characters (user_id, handle, display_name, bio, class, avatar) values
  ('00000000-0000-4000-8000-000000000001', 'ronit', 'Ronit', 'Linkific intern. Twenty days from HTML to a deployed Next.js app.', 'fullstack_ranger', '{"skin": 2, "hair": 1, "colour": 0, "accessory": 1}'),
  ('00000000-0000-4000-8000-000000000002', 'ada', 'Ada', 'Writes the first program, then the tests for it.', 'frontend_mage', '{"skin": 0, "hair": 3, "colour": 4, "accessory": 2}'),
  ('00000000-0000-4000-8000-000000000003', 'grace', 'Grace', 'Found the bug. It was a moth.', 'backend_knight', '{"skin": 1, "hair": 2, "colour": 2, "accessory": 0}');

-- Ronit's quest log: the real first twenty days of this repository (dates and pull requests from git history)
insert into public.quests (user_id, day, date, title, body, blockers, difficulty, skills, pr_links)
select
  '00000000-0000-4000-8000-000000000001', q.day, q.date::date, q.title, q.body, q.blockers, q.difficulty::public.difficulty, q.skills::public.skill[],
  array(select 'https://github.com/ronit-ahuja-04/Linkific-Tasks/pull/' || n from unnest(q.prs) as n)
from (values
  (1,  '2026-10-24', 'Forge the first page',            'HTML5 and CSS3: a responsive nav, a card grid, a blog layout and a portfolio, each building on the last.', '', 'easy', array['html_css','styling'], array[]::int[]),
  (2,  '2026-10-25', 'Learn the tongue of the web',     'Modern JavaScript: ES6+, the DOM and async code, in practice scripts and four small apps.', '', 'normal', array['javascript'], array[]::int[]),
  (3,  '2026-10-27', 'Summon the GitHub oracle',        'Git, GitHub and npm. Built repo-report, a CLI that asks the GitHub REST API about a repository.', '', 'normal', array['javascript','devops'], array[1,2,3,4,5]),
  (4,  '2026-10-28', 'Assemble the first components',   'React basics with DevHub: components, props, keys, composition and conditional UI.', '', 'normal', array['react','html_css'], array[9,10,11,12,13]),
  (5,  '2026-10-29', 'Bend state to my will',           'HackHQ control room: five stations built with useState only, a State Lab and 58 tests.', '', 'hard', array['react','state','testing'], array[]::int[]),
  (6,  '2026-10-30', 'Tame the side effects',           'useEffect and custom hooks: a debounced directory with abort, a hack clock with cleanup, safe localStorage.', 'Effects ran twice in development until I understood Strict Mode.', 'normal', array['react','javascript'], array[21,22,23,24,25]),
  (7,  '2026-10-31', 'Map the realm',                   'React Router: real URLs for every station, nested routes and protected routes.', '', 'hard', array['routing','react','auth'], array[29,30,31,32,33]),
  (8,  '2026-11-02', 'Restyle the castle',              'Tailwind CSS: replaced a 5,400-line stylesheet with utilities and design tokens, with dark mode.', '', 'normal', array['styling','html_css'], array[37,38,39,40]),
  (9,  '2026-11-03', 'Learn the Bootstrap arts',        'Bootstrap 5: a full redesign plus two new features.', '', 'normal', array['styling'], array[41,42,43,44,45]),
  (10, '2026-11-04', 'Style with sorcery',              'styled-components: themes, props-driven styles and a third redesign.', '', 'normal', array['styling','react'], array[48,49,50,51]),
  (11, '2026-11-05', 'Raise the Redux citadel',         'FlowLane: a board, chat and notifications on Redux Toolkit, with thunks and many tests.', '', 'boss', array['state','react','testing'], array[52,53,54,55,56]),
  (12, '2026-11-06', 'Share the context',               'React Context for auth, theme and language in FlowLane.', '', 'normal', array['state','react'], array[65,66,67]),
  (13, '2026-11-12', 'Study the Lodash scrolls',        'DataDesk: a Lodash lab, and when the native language is enough.', '', 'easy', array['javascript'], array[68]),
  (14, '2026-11-13', 'Chart the stars',                 'SalesPulse: a Recharts dashboard with filters, drill-downs and accessible tables.', '', 'hard', array['react','styling'], array[69]),
  (15, '2026-11-14', 'Guard the gates',                 'Authentication: GitHub sign-in, issue import and an API that checks JWTs.', '', 'boss', array['auth','backend'], array[70,71,72,73]),
  (16, '2026-11-16', 'Bottle the lightning',            'Firebase Storage and real-time: image uploads, a live dashboard and a setup guide.', 'Setting the Storage retry limits with the setter functions broke two test files.', 'hard', array['database','backend'], array[76,77,78,79,80]),
  (17, '2026-11-17', 'Descend into Postgres',           'Huddle on Supabase: Postgres, Row Level Security, Realtime and Storage, with database tests.', '', 'boss', array['database','auth','backend'], array[85]),
  (18, '2026-11-18', 'Learn the language of types',     'TypeScript: a workbook, then SalesPulse converted to strict TypeScript with zero any.', 'noUncheckedIndexedAccess found nine unchecked array reads to fix.', 'hard', array['typescript','react'], array[86,87,88,89,90]),
  (19, '2026-11-19', 'Bend types to my will',           'Advanced TypeScript: utility, conditional and mapped types, and a fully typed Redux store.', '', 'hard', array['typescript','state'], array[93,94]),
  (20, '2026-11-20', 'Tame the App Router',             'Next.js: Dispatch, a blog with SSG, ISR, SSR and CSR shown side by side.', 'Under Cache Components an unknown post returns 200 instead of 404.', 'hard', array['nextjs','react'], array[95,96])
) as q (day, date, title, body, blockers, difficulty, skills, prs);

-- two more interns, so the Guild hall has company
insert into public.quests (user_id, day, date, title, body, blockers, difficulty, skills, pr_links) values
  ('00000000-0000-4000-8000-000000000002', 1, '2026-11-16', 'Hello, world', 'Set up the editor and wrote a first page.', '', 'easy', '{html_css}', '{}'),
  ('00000000-0000-4000-8000-000000000002', 2, '2026-11-17', 'The box model', 'Margins collapse. Who knew.', '', 'normal', '{html_css,styling}', '{}'),
  ('00000000-0000-4000-8000-000000000002', 3, '2026-11-18', 'First React app', 'A counter, then a todo list.', '', 'normal', '{react,javascript}', '{}'),
  ('00000000-0000-4000-8000-000000000002', 4, '2026-11-19', 'Hooks', 'useState and useEffect.', 'Not sure when an effect needs cleanup.', 'hard', '{react,state}', '{}'),
  ('00000000-0000-4000-8000-000000000003', 1, '2026-11-18', 'Spin up a server', 'An Express hello world and a health check.', '', 'normal', '{backend}', '{}'),
  ('00000000-0000-4000-8000-000000000003', 2, '2026-11-19', 'Talk to Postgres', 'Tables, keys and a first join.', '', 'hard', '{database,backend}', '{}');

-- a mentor's badge and note for Ronit
insert into public.badges (user_id, name, note, icon, awarded_by) values
  ('00000000-0000-4000-8000-000000000001', 'Ships on time', 'Twenty days, twenty working deliverables.', '🚀', '00000000-0000-4000-8000-000000000009');
insert into public.notes (quest_id, author_id, body)
select id, '00000000-0000-4000-8000-000000000009', 'Good call documenting the 200-vs-404 behaviour instead of hiding it.'
from public.quests where user_id = '00000000-0000-4000-8000-000000000001' and day = 20;
