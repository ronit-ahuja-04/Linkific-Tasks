import { execSync } from 'node:child_process';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { CLASS_INFO, CLASSES, computeStats, DIFFICULTIES, earnedBadges, SKILLS, type CharacterClass, type QuestInput } from '@/lib/game';

/**
 * Runs against the LOCAL Supabase stack (`npm run db:start`, then `npm run env:local`), with the seed loaded.
 * Proves three things: the database speaks the same vocabulary as the TypeScript, the SQL XP views give exactly the
 * numbers `computeStats` gives, and the public key is locked out.
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing: run `npm run env:local` with the local stack running');
const sql = postgres(url, { max: 2, onnotice: () => {} });
afterAll(() => sql.end());

const enumValues = async (name: string): Promise<string[]> =>
  (await sql<{ v: string }[]>`select unnest(enum_range(null::public.${sql.unsafe(name)}))::text as v`).map((r) => r.v);

describe('the vocabulary matches src/lib/game/catalog.ts', () => {
  it('skills, difficulties and classes', async () => {
    expect(await enumValues('skill')).toEqual([...SKILLS]);
    expect(await enumValues('difficulty')).toEqual([...DIFFICULTIES]);
    expect(await enumValues('character_class')).toEqual([...CLASSES]);
  });

  it('the class home skills', async () => {
    for (const c of CLASSES) {
      const [row] = await sql<{ home: string[] }[]>`select public.class_home_skills(${c}::public.character_class)::text[] as home`;
      expect(row?.home, c).toEqual([...CLASS_INFO[c].home]);
    }
  });
});

interface QuestRow {
  id: string;
  day: number;
  date: string;
  difficulty: QuestInput['difficulty'];
  skills: QuestInput['skills'];
  pr_links: string[];
  blockers: string;
  status: QuestInput['status'];
}

async function loadCharacters() {
  const characters = await sql<{ user_id: string; handle: string; class: CharacterClass }[]>`select user_id, handle, class from public.characters order by handle`;
  return Promise.all(
    characters.map(async (c) => {
      const rows = await sql<QuestRow[]>`
        select id, day, to_char(date, 'YYYY-MM-DD') as date, difficulty, skills::text[] as skills, pr_links, blockers, status
        from public.quests where user_id = ${c.user_id}`;
      const quests: QuestInput[] = rows.map((r) => ({ id: r.id, day: r.day, date: r.date, difficulty: r.difficulty, skills: r.skills, prLinks: r.pr_links, blockers: r.blockers, status: r.status }));
      return { ...c, quests };
    }),
  );
}

describe('the SQL XP views agree with computeStats', () => {
  it('per character: total XP and level', async () => {
    for (const c of await loadCharacters()) {
      const stats = computeStats(c.class, c.quests);
      const [row] = await sql<{ total_xp: number; level: number }[]>`select total_xp, level from public.character_stats where user_id = ${c.user_id}`;
      expect({ handle: c.handle, xp: row?.total_xp, level: row?.level }).toEqual({ handle: c.handle, xp: stats.totalXp, level: stats.progress.level });
    }
  });

  it('per character and skill', async () => {
    for (const c of await loadCharacters()) {
      const stats = computeStats(c.class, c.quests);
      const rows = await sql<{ skill: string; xp: number }[]>`select skill::text, xp from public.skill_xp where user_id = ${c.user_id}`;
      const fromSql = Object.fromEntries(rows.map((r) => [r.skill, r.xp]));
      const fromTs = Object.fromEntries(SKILLS.filter((s) => stats.skills[s].xp > 0).map((s) => [s, stats.skills[s].xp]));
      expect(fromSql, c.handle).toEqual(fromTs);
    }
  });

  it('per quest: streak, raw XP and total', async () => {
    for (const c of await loadCharacters()) {
      const stats = computeStats(c.class, c.quests);
      const rows = await sql<{ quest_id: string; streak: boolean; raw: number; total: number }[]>`
        select quest_id, bool_and(streak) as streak, min(raw) as raw, sum(xp)::int as total from public.quest_xp where user_id = ${c.user_id} group by quest_id`;
      expect(rows.length).toBe(stats.quests.size);
      for (const r of rows) {
        const ts = stats.quests.get(r.quest_id);
        expect({ streak: r.streak, raw: r.raw, total: r.total }).toEqual({ streak: ts?.streak, raw: ts?.raw, total: ts?.total });
      }
    }
  });
});

describe('the seed', () => {
  it("Ronit's character has the twenty real days and the badges they earn", async () => {
    const ronit = (await loadCharacters()).find((c) => c.handle === 'ronit');
    expect(ronit?.quests).toHaveLength(20);
    const stats = computeStats('fullstack_ranger', ronit?.quests ?? []);
    expect(stats.progress.level).toBeGreaterThanOrEqual(8);
    expect(earnedBadges(ronit?.quests ?? []).map((b) => b.id)).toEqual(
      expect.arrayContaining(['first_quest', 'streak_7', 'boss_defeated', 'polyglot', 'pr_machine', 'unblocked']),
    );
  });
});

describe('constraints reject bad data', () => {
  const ronit = '00000000-0000-4000-8000-000000000001';
  const tryInsert = (fields: { day?: number; title?: string; skills?: string }) =>
    sql.begin(async (tx) => {
      await tx`insert into public.quests (user_id, day, date, title, skills)
               values (${ronit}, ${fields.day ?? 300}, '2026-12-01', ${fields.title ?? 'A fine title'}, ${fields.skills ?? '{react}'}::public.skill[])`;
      throw new Error('ROLLBACK'); // keep the database clean when the insert is accepted
    });

  it('accepts a valid quest (then rolls back)', async () => {
    await expect(tryInsert({})).rejects.toThrow('ROLLBACK');
  });
  it('one quest per day', async () => {
    await expect(tryInsert({ day: 1 })).rejects.toThrow(/duplicate key/);
  });
  it('one to four distinct skills', async () => {
    await expect(tryInsert({ skills: '{}' })).rejects.toThrow(/check constraint/);
    await expect(tryInsert({ skills: '{react,state,routing,testing,auth}' })).rejects.toThrow(/check constraint/);
    await expect(tryInsert({ skills: '{react,react}' })).rejects.toThrow(/check constraint/);
    await expect(tryInsert({ skills: '{cooking}' })).rejects.toThrow(/invalid input value for enum/);
  });
  it('a real title', async () => {
    await expect(tryInsert({ title: 'no' })).rejects.toThrow(/check constraint/);
  });
  it('handles are 3 to 24 lowercase letters, digits and inner hyphens', async () => {
    const tryHandle = (handle: string) =>
      sql.begin(async (tx) => {
        await tx`update public.characters set handle = ${handle} where user_id = ${ronit}`;
        throw new Error('ROLLBACK');
      });
    await expect(tryHandle('ok-handle-1')).rejects.toThrow('ROLLBACK');
    for (const bad of ['ab', 'Upper', '-edge', 'edge-', 'has space', 'a'.repeat(25)]) await expect(tryHandle(bad), bad).rejects.toThrow(/check constraint/);
  });
});

describe('Row Level Security', () => {
  // the public (anon) key, which a browser could have: it must be able to read and write nothing
  const status = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const anonKey = status.match(/^ANON_KEY="?([^"\n]+)"?$/m)?.[1] ?? '';
  const rest = process.env.SUPABASE_URL ?? '';
  const call = (path: string, init: RequestInit = {}) =>
    fetch(`${rest}/rest/v1/${path}`, { ...init, headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json', ...init.headers } });

  it('the anon key can not read any table or view', async () => {
    for (const table of ['users', 'characters', 'quests', 'badges', 'notes', 'character_stats', 'quest_xp']) {
      const response = await call(`${table}?select=*`);
      const body: unknown = await response.json();
      const empty = Array.isArray(body) && body.length === 0;
      expect(response.status === 401 || response.status === 403 || empty, `${table}: ${response.status}`).toBe(true);
    }
  });

  it('the anon key can not write', async () => {
    const response = await call('quests', { method: 'POST', body: JSON.stringify({ user_id: '00000000-0000-4000-8000-000000000001', day: 99, date: '2026-12-01', title: 'Sneaky', skills: ['react'] }) });
    expect([401, 403]).toContain(response.status);
  });

  it('the service key (server only) can read', async () => {
    const response = await fetch(`${rest}/rest/v1/characters?select=handle&order=handle`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}` },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.arrayContaining([{ handle: 'ada' }, { handle: 'grace' }, { handle: 'ronit' }]));
  });
});
