import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPeople, json, params, people, quest, record, removePeople, request, sql } from './fixtures';

// The real route handlers, against the real local database. Only two things are replaced:
//   the session (sign-in arrives in milestone 3)        and   Next's cache invalidation (no Next server here)
vi.mock('@/lib/server/session', () => ({ currentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
const { currentUser } = await import('@/lib/server/session');
const { revalidateTag } = await import('next/cache');
const collection = await import('@/app/api/quests/route');
const item = await import('@/app/api/quests/[id]/route');

const signIn = (user: (typeof people)[keyof typeof people] | null) => vi.mocked(currentUser).mockResolvedValue(user);

beforeAll(createPeople);
afterAll(async () => {
  await removePeople();
  await sql.end();
});
beforeEach(() => vi.mocked(revalidateTag).mockClear());

const create = async (body: unknown) => json(await collection.POST(request('POST', '/api/quests', body)));
const idOf = (body: unknown): string => {
  const id = record(record(body).quest).id;
  if (typeof id !== 'string') throw new Error('no id');
  return id;
};

describe('POST /api/quests', () => {
  it('401 when not signed in', async () => {
    signIn(null);
    expect(await create(quest(1))).toEqual({ status: 401, body: { error: 'Sign in to do this.' } });
  });

  it('409 until the user has created a character', async () => {
    signIn(people.newbie);
    expect((await create(quest(1))).status).toBe(409);
  });

  it('400 for a body that is not JSON', async () => {
    signIn(people.one);
    expect(await create('{not json')).toEqual({ status: 400, body: { error: 'The request body is not valid JSON.' } });
  });

  it('400 with every field problem listed', async () => {
    signIn(people.one);
    const { status, body } = await create({ day: 0, title: '', skills: ['cooking'] });
    expect(status).toBe(400);
    expect(Object.keys(record(record(body).fields)).sort()).toEqual(['date', 'day', 'skills', 'title']);
  });

  it('201: saves the quest and returns the reward, with Pip reacting', async () => {
    signIn(people.one);
    const { status, body } = await create(quest(1, { difficulty: 'hard', skills: ['backend', 'testing'], prLinks: ['https://github.com/x/y/pull/1'] }));
    expect(status).toBe(201);
    const saved = record(record(body).quest);
    expect(saved).toMatchObject({ day: 1, title: 'Quest for day 1', difficulty: 'hard', status: 'published', isPublic: true });
    expect(saved).not.toHaveProperty('userId');
    // 150 + 20 = 170, no streak; split 85 / 85; Backend is a Ranger home skill: 93 + 85 = 178
    expect(record(body).reward).toMatchObject({ xpGained: 178, levelUp: true, level: 2, newBadges: [{ id: 'first_quest', name: 'First Quest' }] });
    expect(record(record(body).reward).pip).toMatchObject({ mood: 'proud', line: expect.any(String) });
  });

  it('refreshes the cached character sheet and the Guild hall', async () => {
    signIn(people.one);
    await create(quest(2));
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([['character:tester-one', { expire: 0 }], ['guild', { expire: 0 }]]);
  });

  it('409 for a day already logged', async () => {
    signIn(people.one);
    const { status, body } = await create(quest(1));
    expect(status).toBe(409);
    expect(record(body).error).toMatch(/already logged day 1/);
  });

  it('a draft earns no reward', async () => {
    signIn(people.one);
    const { status, body } = await create(quest(3, { status: 'draft' }));
    expect(status).toBe(201);
    expect(record(body).reward).toBeNull();
  });
});

describe('GET /api/quests', () => {
  it('401 when not signed in', async () => {
    signIn(null);
    expect((await json(await collection.GET(request('GET', '/api/quests')))).status).toBe(401);
  });

  it('lists only my quests, drafts included, by day; ?status filters', async () => {
    signIn(people.two);
    await create(quest(5));
    signIn(people.one);
    const all = record((await json(await collection.GET(request('GET', '/api/quests')))).body).quests;
    expect(Array.isArray(all) && all.map((q) => record(q).day)).toEqual([1, 2, 3]);
    const drafts = record((await json(await collection.GET(request('GET', '/api/quests?status=draft')))).body).quests;
    expect(Array.isArray(drafts) && drafts.map((q) => record(q).day)).toEqual([3]);
    expect((await json(await collection.GET(request('GET', '/api/quests?status=secret')))).status).toBe(400);
  });
});

describe('/api/quests/:id', () => {
  let publicId = '';
  let draftId = '';
  let privateId = '';
  beforeAll(async () => {
    signIn(people.two);
    publicId = idOf((await create(quest(10, { title: 'Out in the open' }))).body);
    draftId = idOf((await create(quest(11, { status: 'draft' }))).body);
    privateId = idOf((await create(quest(12, { isPublic: false }))).body);
  });

  const get = async (id: string) => json(await item.GET(request('GET', `/api/quests/${id}`), params({ id })));
  const put = async (id: string, body: unknown) => json(await item.PUT(request('PUT', `/api/quests/${id}`, body), params({ id })));
  const del = async (id: string) => json(await item.DELETE(request('DELETE', `/api/quests/${id}`), params({ id })));

  describe('GET', () => {
    it("anyone can read a published public quest, with its owner's handle", async () => {
      signIn(null);
      const { status, body } = await get(publicId);
      expect(status).toBe(200);
      expect(record(body)).toMatchObject({ handle: 'tester-two', quest: { title: 'Out in the open' } });
    });

    it('drafts and private quests: the owner sees them, everyone else gets 404 (not 403: their existence stays secret)', async () => {
      for (const id of [draftId, privateId]) {
        signIn(people.two);
        expect((await get(id)).status).toBe(200);
        signIn(people.one);
        expect((await get(id)).status).toBe(404);
        signIn(people.mentor);
        expect((await get(id)).status).toBe(404);
      }
    });

    it('404 for an unknown id and for something that is not an id at all', async () => {
      signIn(null);
      expect((await get('00000000-0000-4000-8000-00000000ffff')).status).toBe(404);
      expect((await get('not-a-uuid')).status).toBe(404);
    });
  });

  describe('PUT', () => {
    it('401 when not signed in', async () => {
      signIn(null);
      expect((await put(publicId, quest(10))).status).toBe(401);
    });

    it("403 on someone else's public quest, 404 on someone else's private one", async () => {
      signIn(people.one);
      expect((await put(publicId, quest(10))).status).toBe(403);
      expect((await put(privateId, quest(12))).status).toBe(404);
    });

    it('400 for an invalid body', async () => {
      signIn(people.two);
      expect((await put(publicId, { day: 10 })).status).toBe(400);
    });

    it('200: replaces the quest', async () => {
      signIn(people.two);
      const { status, body } = await put(publicId, quest(10, { title: 'Renamed', difficulty: 'boss' }));
      expect(status).toBe(200);
      expect(record(body).quest).toMatchObject({ title: 'Renamed', difficulty: 'boss' });
      expect(record(body).reward).toBeNull(); // editing a published quest is not a new reward
    });

    it('publishing a draft returns its reward', async () => {
      signIn(people.two);
      const { body } = await put(draftId, quest(11, { status: 'published' }));
      expect(record(body).reward).toMatchObject({ xpGained: expect.any(Number), pip: { line: expect.any(String) } });
    });

    it('409 when moving a quest onto a day already logged', async () => {
      signIn(people.two);
      expect((await put(publicId, quest(11))).status).toBe(409);
    });
  });

  describe('DELETE', () => {
    it("401 signed out, 403 for someone else's quest", async () => {
      signIn(null);
      expect((await del(publicId)).status).toBe(401);
      signIn(people.one);
      expect((await del(publicId)).status).toBe(403);
    });

    it('204, and then it is gone', async () => {
      signIn(people.two);
      expect(await del(publicId)).toEqual({ status: 204, body: null });
      expect((await get(publicId)).status).toBe(404);
    });
  });
});
