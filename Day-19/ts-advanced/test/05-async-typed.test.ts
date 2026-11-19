import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  HttpError, NetworkError, ValidationError, attempt, createPost, delayed, describeError, err, fetchJson, getPosts, getPostsChecked,
  isArrayOf, isPost, loadPair, makeClient, ok, retry, settle, toAppError, withTimeout,
  type AppError, type Post, type Result,
} from '../src/05-async-typed';

const reply = (config: InternalAxiosRequestConfig, status: number, data: unknown) => ({ data, status, statusText: String(status), headers: {}, config });
/** A fake transport: it answers by path, and never opens a socket */
const adapterFor = (routes: Record<string, { status: number; data: unknown }>): AxiosAdapter => async (config) => {
  const route = routes[config.url ?? ''];
  if (!route) throw new AxiosError('no route', 'ERR_NETWORK', config);
  const response = reply(config, route.status, route.data);
  if (route.status >= 400) throw new AxiosError(`status ${route.status}`, 'ERR_BAD_RESPONSE', config, null, response);
  return response;
};

describe('05 promises', () => {
  it('async functions return Promise<T>; Promise.all keeps a tuple', async () => {
    expectTypeOf(delayed(1)).toEqualTypeOf<Promise<number>>();
    expectTypeOf(delayed<string>).returns.resolves.toBeString();
    expect(await loadPair()).toEqual([1, 'one']);
    const tuple = await Promise.all([delayed(1), delayed('a'), delayed(true)]);
    expectTypeOf(tuple).toEqualTypeOf<[number, string, boolean]>();
    // @ts-expect-error  an async function's result needs `await` before it can be used as a number
    const wrong: number = delayed(1);
    expect(wrong).toBeInstanceOf(Promise);
  });
  it('allSettled splits successes and failures', async () => {
    const out = await settle([delayed(1), Promise.reject(new Error('bad')), delayed(3)]);
    expect(out).toEqual({ values: [1, 3], errors: ['bad'] });
  });
  it('retry and withTimeout keep T', async () => {
    const value = await retry(async (n) => { if (n < 3) throw new Error('flaky'); return `ok after ${n}`; }, 5);
    expect(value).toBe('ok after 3');
    expectTypeOf(retry<string>).returns.resolves.toBeString();
    await expect(retry(async () => { throw new Error('always'); }, 2)).rejects.toThrow('always');
    expect(await withTimeout(delayed('fast', 1), 50)).toBe('fast');
    await expect(withTimeout(delayed('slow', 50), 5)).rejects.toThrow('Timed out after 5ms');
  });
});

describe('05 errors', () => {
  it('describeError is exhaustive over `kind`', () => {
    expect(describeError(new HttpError(404, 'nf'))).toBe('Server said 404');
    expect(describeError(new NetworkError())).toBe('You appear to be offline');
    expect(describeError(new ValidationError('id'))).toBe('Bad field: id');
    const widen = (x: AppError): AppError => x; // assignment would narrow it back to HttpError
    const e = widen(new HttpError(500, 'x'));
    // @ts-expect-error  `status` exists only on HttpError, not on every AppError
    expect(e.status).toBe(500);
    if (e.kind === 'http') expectTypeOf(e.status).toBeNumber();
  });
  it('toAppError narrows anything that was thrown', () => {
    expect(toAppError('a string').kind).toBe('network');
    expect(toAppError(null).kind).toBe('network');
    expect(toAppError(new TypeError('Failed to fetch')).kind).toBe('network');
    const original = new ValidationError('x');
    expect(toAppError(original)).toBe(original);
    expectTypeOf(toAppError).returns.toEqualTypeOf<AppError>();
  });
  it('Result forces a check before reading the value', async () => {
    const good = await attempt(delayed(5));
    const bad = await attempt(Promise.reject(new HttpError(500, 'boom')));
    expect(good).toEqual({ ok: true, value: 5 });
    expect(bad.ok).toBe(false);
    // @ts-expect-error  `value` does not exist until `ok` is checked
    void good.value;
    if (good.ok) expectTypeOf(good.value).toBeNumber();
    if (!bad.ok) expectTypeOf(bad.error).toEqualTypeOf<AppError>();
    expectTypeOf(ok(1)).toEqualTypeOf<Result<number, never>>();
    expectTypeOf(err('x')).toEqualTypeOf<Result<never, string>>();
  });
});

describe('05 fetch', () => {
  const jsonFetch = (status: number, body: unknown): typeof fetch => async () => new Response(JSON.stringify(body), { status, statusText: `S${status}` });
  it('returns a T only when the guard accepts the body', async () => {
    const post = await fetchJson('/p/1', isPost, jsonFetch(200, { id: 1, title: 'hi' }));
    expectTypeOf(post).toEqualTypeOf<Post>();
    expect(post.title).toBe('hi');
    const posts = await fetchJson('/p', isArrayOf(isPost), jsonFetch(200, [{ id: 1, title: 'a' }]));
    expectTypeOf(posts).toEqualTypeOf<Post[]>();
  });
  it('a wrong body is a ValidationError, a bad status an HttpError', async () => {
    await expect(fetchJson('/p/1', isPost, jsonFetch(200, { id: 'one' }))).rejects.toBeInstanceOf(ValidationError);
    await expect(fetchJson('/p/1', isPost, jsonFetch(404, {}))).rejects.toMatchObject({ kind: 'http', status: 404 });
  });
  it('the guard type and the wanted type must agree', () => {
    // @ts-expect-error  a Guard<number> can not be used where the result is declared as Post
    const bad: Promise<Post> = fetchJson('/x', (v): v is number => typeof v === 'number');
    expect(bad).toBeInstanceOf(Promise);
    bad.catch(() => {});
  });
});

describe('05 axios', () => {
  const posts: Post[] = [{ id: 1, title: 'a' }];
  it('generic response data', async () => {
    const client = makeClient(adapterFor({ '/posts': { status: 200, data: posts } }));
    const got = await getPosts(client);
    expectTypeOf(got).toEqualTypeOf<Post[]>();
    expect(got).toEqual(posts);
    // @ts-expect-error  `title` is a string on Post, not a number
    const n: number = got[0]?.title;
    expect(n).toBe('a');
  });
  it('unknown + guard when the server is not yours', async () => {
    const client = makeClient(adapterFor({ '/posts': { status: 200, data: [{ id: 'x' }] } }));
    await expect(getPostsChecked(client)).rejects.toBeInstanceOf(ValidationError);
  });
  it('typed request body', async () => {
    const client = makeClient(async (config) => reply(config, 201, { id: 9, ...JSON.parse(String(config.data)) }));
    expect(await createPost(client, { title: 'new' })).toEqual({ id: 9, title: 'new' });
    // @ts-expect-error  `id` is not part of the request body
    await createPost(client, { id: 1, title: 'x' });
  });
  it('AxiosError is narrowed with isAxiosError', async () => {
    const client = makeClient(adapterFor({ '/posts': { status: 503, data: {} } }));
    const result = await attempt(getPosts(client));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
      expect(describeError(result.error)).toBe('Server said 503');
    }
    const offline = await attempt(getPosts(makeClient(adapterFor({}))));
    if (!offline.ok) expect(offline.error.kind).toBe('network');
  });
});
