import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createFakeGithub } from '../src/dev/fake-github.js'

let server
let base
const get = (path, token = 'any-token') => fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })

beforeAll(async () => {
  server = createFakeGithub()
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise((r) => server.close(r)))

describe('fake GitHub', () => {
  it('requires a non-empty Authorization header', async () => {
    expect((await get('/user', null)).status).toBe(401)
  })

  it('bad-token is 401 Bad credentials; limited-token is 403 with remaining 0', async () => {
    const bad = await get('/user/repos', 'bad-token')
    expect(bad.status).toBe(401)
    expect((await bad.json()).message).toBe('Bad credentials')
    const limited = await get('/user/repos', 'limited-token')
    expect(limited.status).toBe(403)
    expect(limited.headers.get('x-ratelimit-remaining')).toBe('0')
  })

  it('serves /user and 3 repos (one private)', async () => {
    expect((await (await get('/user')).json()).login).toBe('octocat')
    const repos = await (await get('/user/repos')).json()
    expect(repos).toHaveLength(3)
    expect(repos.filter((r) => r.private)).toHaveLength(1)
  })

  it('serves 35 open items over 2 pages with PRs mixed in', async () => {
    const first = await get('/repos/octocat/hello-flowlane/issues?state=open&per_page=30&page=1')
    expect(first.headers.get('link')).toContain('rel="next"')
    const a = await first.json()
    const second = await get('/repos/octocat/hello-flowlane/issues?state=open&per_page=30&page=2')
    expect(second.headers.get('link') ?? '').not.toContain('rel="next"')
    const b = await second.json()
    expect(a).toHaveLength(30)
    expect(b).toHaveLength(5)
    expect([...a, ...b].filter((i) => i.pull_request).length).toBeGreaterThan(0)
  })

  it('honours state=closed and 404s other repos', async () => {
    const closed = await (await get('/repos/octocat/hello-flowlane/issues?state=closed')).json()
    expect(closed.every((i) => i.state === 'closed')).toBe(true)
    expect((await get('/repos/someone/else/issues')).status).toBe(404)
  })
})
