-- Intern Quest schema.
-- The app talks to this database ONLY from the server, with the service role key. Row Level Security is on
-- for every table and there are no policies, so the public (anon) key can read and write nothing.

-- ---------------------------------------------------------------- vocabulary (mirrors src/lib/game/catalog.ts)
create type public.user_role as enum ('intern', 'mentor');
create type public.character_class as enum ('frontend_mage', 'backend_knight', 'fullstack_ranger', 'design_bard');
create type public.difficulty as enum ('easy', 'normal', 'hard', 'boss');
create type public.skill as enum (
  'html_css', 'javascript', 'react', 'state', 'routing', 'styling', 'testing',
  'typescript', 'nextjs', 'backend', 'database', 'auth', 'devops'
);
create type public.quest_status as enum ('draft', 'published');

-- true when an array has no repeated values (a CHECK constraint can not contain a subquery, a function can)
create function public.array_is_distinct(values_ anyarray) returns boolean
language sql immutable as $$
  select cardinality(values_) = (select count(distinct v) from unnest(values_) as v)
$$;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- people and sign-in
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email like '%@%'),
  name text not null default '' check (char_length(name) <= 60),
  image text,
  -- bcrypt hash for email-and-password users; null for GitHub-only users
  password_hash text,
  role public.user_role not null default 'intern',
  created_at timestamptz not null default now()
);

-- links an OAuth login (GitHub) to a user
create table public.accounts (
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  primary key (provider, provider_account_id)
);
create index accounts_user_id_idx on public.accounts (user_id);

-- ---------------------------------------------------------------- the game
create table public.characters (
  user_id uuid primary key references public.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 280),
  class public.character_class not null default 'fullstack_ranger',
  -- presets chosen in the avatar editor: { "skin": 2, "hair": 5, "colour": 1, "accessory": 0 }
  avatar jsonb not null default '{}'::jsonb check (jsonb_typeof(avatar) = 'object'),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger characters_touch before update on public.characters for each row execute function public.touch_updated_at();

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.characters (user_id) on delete cascade,
  day integer not null check (day between 1 and 366),
  date date not null,
  title text not null check (char_length(title) between 3 and 80),
  body text not null default '' check (char_length(body) <= 10000),
  blockers text not null default '' check (char_length(blockers) <= 1000),
  difficulty public.difficulty not null default 'normal',
  skills public.skill[] not null check (cardinality(skills) between 1 and 4 and public.array_is_distinct(skills)),
  pr_links text[] not null default '{}' check (cardinality(pr_links) <= 5),
  status public.quest_status not null default 'published',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one quest per internship day
  unique (user_id, day)
);
create index quests_user_day_idx on public.quests (user_id, day);
create trigger quests_touch before update on public.quests for each row execute function public.touch_updated_at();

-- badges awarded by a mentor (automatic badges are worked out from the quests, never stored)
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.characters (user_id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  note text not null default '' check (char_length(note) <= 280),
  icon text not null default '🏅' check (char_length(icon) <= 8),
  awarded_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index badges_user_id_idx on public.badges (user_id);

-- a mentor's note on a quest
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index notes_quest_id_idx on public.notes (quest_id);

-- ---------------------------------------------------------------- XP, in SQL (mirrors src/lib/game/xp.ts exactly)
-- Integer arithmetic only: ×11/10 with integer division is "plus 10%, rounded down", the same as the TypeScript.

create function public.class_home_skills(c public.character_class) returns public.skill[]
language sql immutable as $$
  select case c
    when 'frontend_mage'    then array['html_css', 'javascript', 'react', 'styling']::public.skill[]
    when 'backend_knight'   then array['backend', 'database', 'auth', 'devops']::public.skill[]
    when 'fullstack_ranger' then array['react', 'nextjs', 'backend', 'database']::public.skill[]
    when 'design_bard'      then array['html_css', 'styling', 'state', 'routing']::public.skill[]
  end
$$;

create view public.quest_xp with (security_invoker = true) as
with scored as (
  select
    q.id, q.user_id, q.day, q.skills, c.class,
    case q.difficulty when 'easy' then 50 when 'normal' then 100 when 'hard' then 150 when 'boss' then 250 end as base,
    20 * least(cardinality(q.pr_links), 3) as pr_bonus,
    exists (
      select 1 from public.quests p
      where p.user_id = q.user_id and p.day = q.day - 1 and p.status = 'published'
    ) as streak
  from public.quests q
  join public.characters c on c.user_id = q.user_id
  where q.status = 'published'
), raw as (
  select *, case when streak then ((base + pr_bonus) * 11) / 10 else base + pr_bonus end as raw
  from scored
)
select
  r.id as quest_id, r.user_id, r.day, r.base, r.pr_bonus, r.streak, r.raw,
  s.skill,
  case when s.skill = any (public.class_home_skills(r.class))
    then ((r.raw / cardinality(r.skills)) * 11) / 10
    else r.raw / cardinality(r.skills)
  end as xp
from raw r
cross join lateral unnest(r.skills) as s (skill);

create view public.skill_xp with (security_invoker = true) as
select user_id, skill, sum(xp)::integer as xp
from public.quest_xp
group by user_id, skill;

-- level L starts at 100 × L(L-1)/2 XP, so L = floor((1 + sqrt(1 + 8·xp/100)) / 2)
create view public.character_stats with (security_invoker = true) as
select
  c.user_id, c.handle,
  coalesce(sum(x.xp), 0)::integer as total_xp,
  floor((1 + sqrt(1 + 8 * coalesce(sum(x.xp), 0) / 100.0)) / 2)::integer as level
from public.characters c
left join public.quest_xp x on x.user_id = c.user_id
group by c.user_id, c.handle;

-- ---------------------------------------------------------------- lock everything down
alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.characters enable row level security;
alter table public.quests enable row level security;
alter table public.badges enable row level security;
alter table public.notes enable row level security;
-- no policies on purpose: only the server (service role, which bypasses RLS) reads and writes
revoke all on all tables in schema public from anon, authenticated;
