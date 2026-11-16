import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { errors } from '../src/errors.js'
import { githubFetch, testConfig, baseClaims } from './helpers.js'

// A stand-in verifier: "good" is a valid token, "expired" an expired one, anything else is invalid.
const verifyIdToken = async (token) => {
  if (token === 'good') return { claims: baseClaims({ name: 'Ada', picture: 'http://img/a.png' }), verifiedBy: 'google-certificate' }
  if (token === 'expired') throw errors.tokenExpired()
  throw errors.unauthorized('Invalid token.')
}

const AUTH = { Authorization: 'Bearer good' }
const GH = { ...AUTH, 'X-GitHub-Token': 'gho_abc123' }

function build(respond = () => ({ body: [] }), config = {}) {
  const fetch = githubFetch(respond)
  return { app: createApp({ config: testConfig(config), verifyIdToken, fetch }), fetch }
}

const ghIssue = (n, extra = {}) => ({
  id: 100 + n, number: n, title: `Issue ${n}`, body: `body ${n}`, html_url: `https://github.com/o/r/issues/${n}`, state: 'open',
  labels: [{ name: 'bug', color: 'ff0000', id: 9 }], user: { login: 'ada', id: 1 }, comments: 2,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z', ...extra,
})

describe('health and unknown routes', () => {
  it('GET /api/health is public', async () => {
    const { app } = build()
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('unknown routes answer 404 in the error shape', async () => {
    const { app } = build()
    const res = await request(app).get('/nothing/here')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { code: 'not_found', message: expect.any(String) } })
  })

  it('an unknown /api route with a valid token is 404 not_found; without a token it is 401', async () => {
    const { app } = build()
    expect((await request(app).get('/api/nope').set(AUTH)).body.error.code).toBe('not_found')
    expect((await request(app).get('/api/nope')).status).toBe(401)
  })

  it('sets security headers and hides x-powered-by', async () => {
    const { app } = build()
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('rejects a body over 10kb and malformed JSON in the error shape', async () => {
    const { app } = build()
    const big = await request(app).post('/api/me').set('Content-Type', 'application/json').send(JSON.stringify({ a: 'x'.repeat(11_000) }))
    expect(big.status).toBe(413)
    expect(big.body.error.code).toBe('validation_failed')
    const bad = await request(app).post('/api/me').set('Content-Type', 'application/json').send('{oops')
    expect(bad.status).toBe(400)
    expect(bad.body.error.code).toBe('validation_failed')
  })

  it('answers CORS preflight only for CLIENT_URL', async () => {
    const { app } = build()
    const ok = await request(app).options('/api/me').set('Origin', 'http://localhost:5173')
    expect(ok.status).toBe(204)
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    const other = await request(app).options('/api/me').set('Origin', 'http://evil.test')
    expect(other.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('authentication middleware', () => {
  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['empty bearer', 'Bearer '],
    ['spaces in token', 'Bearer a b'],
    ['invalid token', 'Bearer nope'],
  ])('401 unauthorized for %s', async (_n, header) => {
    const { app } = build()
    const req = request(app).get('/api/me')
    if (header !== undefined) req.set('Authorization', header)
    const res = await req
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('unauthorized')
  })

  it('401 token_expired for an expired token', async () => {
    const { app } = build()
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer expired')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('token_expired')
  })

  it('rejects an absurdly long token without calling the verifier', async () => {
    const { app } = build()
    const res = await request(app).get('/api/me').set('Authorization', `Bearer ${'a'.repeat(9000)}`)
    expect(res.status).toBe(401)
  })

  it('the protected GitHub routes need a token too', async () => {
    const { app, fetch } = build()
    expect((await request(app).get('/api/github/repos')).status).toBe(401)
    expect((await request(app).get('/api/github/issues?repo=o/r')).status).toBe(401)
    expect(fetch.calls).toHaveLength(0)
  })
})

describe('GET /api/me', () => {
  it('returns the verified identity with ms epoch dates', async () => {
    const { app } = build()
    const claims = baseClaims()
    const res = await request(app).get('/api/me').set(AUTH)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      uid: 'user-123', email: 'ada@example.com', emailVerified: true, name: 'Ada', picture: 'http://img/a.png', provider: 'password',
      issuedAt: claims.iat * 1000, expiresAt: claims.exp * 1000, authTime: claims.auth_time * 1000, verifiedBy: 'google-certificate',
    })
  })
})

describe('GET /api/github/repos', () => {
  const repos = [
    { id: 1, full_name: 'ada/Alpha', private: false, description: 'first', open_issues_count: 3, updated_at: '2026-01-01T00:00:00Z', html_url: 'https://github.com/ada/Alpha', node_id: 'secret-ish' },
    { id: 2, full_name: 'ada/beta', private: true, description: null, open_issues_count: 0, updated_at: '2026-01-02T00:00:00Z', html_url: 'https://github.com/ada/beta' },
    { id: 3, full_name: 'org/gamma', private: false, description: 'g', open_issues_count: 1, updated_at: '2026-01-03T00:00:00Z', html_url: 'https://github.com/org/gamma' },
  ]

  it('requires the X-GitHub-Token header', async () => {
    const { app, fetch } = build(() => ({ body: repos }))
    const res = await request(app).get('/api/github/repos').set(AUTH)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('github_token_missing')
    expect(fetch.calls).toHaveLength(0)
  })

  it('rejects a malformed GitHub token as github_token_invalid without calling GitHub', async () => {
    const { app, fetch } = build()
    const res = await request(app).get('/api/github/repos').set(AUTH).set('X-GitHub-Token', 'has space')
    expect(res.body.error.code).toBe('github_token_invalid')
    expect(fetch.calls).toHaveLength(0)
  })

  it('maps repos, forwards the token and the required headers, and uses the configured URL', async () => {
    const { app, fetch } = build(() => ({ body: repos }))
    const res = await request(app).get('/api/github/repos').set(GH)
    expect(res.status).toBe(200)
    expect(res.body.hasMore).toBe(false)
    expect(res.body.repos[0]).toEqual({ id: 1, fullName: 'ada/Alpha', private: false, description: 'first', openIssues: 3, updatedAt: '2026-01-01T00:00:00Z', url: 'https://github.com/ada/Alpha' })
    expect(res.body.repos).toHaveLength(3)
    expect(res.body.repos[1].private).toBe(true)
    const call = fetch.calls[0]
    expect(call.url).toBe('https://github.test/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=1')
    expect(call.init.headers).toMatchObject({ Authorization: 'Bearer gho_abc123', Accept: 'application/vnd.github+json', 'User-Agent': 'flowlane-api' })
  })

  it('filters by q (case-insensitive substring of full_name)', async () => {
    const { app } = build(() => ({ body: repos }))
    const res = await request(app).get('/api/github/repos?q=ALPHA').set(GH)
    expect(res.body.repos.map((r) => r.fullName)).toEqual(['ada/Alpha'])
    const org = await request(app).get('/api/github/repos?q=org/').set(GH)
    expect(org.body.repos.map((r) => r.fullName)).toEqual(['org/gamma'])
  })

  it('passes the page through and reads hasMore from the Link header', async () => {
    const { app, fetch } = build(() => ({ body: repos, headers: { link: '<https://github.test/user/repos?page=3>; rel="next", <https://github.test/user/repos?page=9>; rel="last"' } }))
    const res = await request(app).get('/api/github/repos?page=2').set(GH)
    expect(res.body.hasMore).toBe(true)
    expect(fetch.calls[0].url).toMatch(/&page=2$/)
  })

  it.each(['0', '-1', 'abc', '1.5', '99999'])('400 for page=%s', async (page) => {
    const { app } = build()
    const res = await request(app).get(`/api/github/repos?page=${page}`).set(GH)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('validation_failed')
  })

  it('400 for an over-long or repeated q', async () => {
    const { app } = build()
    expect((await request(app).get(`/api/github/repos?q=${'a'.repeat(101)}`).set(GH)).status).toBe(400)
    expect((await request(app).get('/api/github/repos?q=a&q=b').set(GH)).status).toBe(400)
  })
})

describe('GET /api/github/issues', () => {
  it('requires the GitHub token', async () => {
    const { app } = build()
    const res = await request(app).get('/api/github/issues?repo=o/r').set(AUTH)
    expect(res.body.error.code).toBe('github_token_missing')
  })

  it.each(['', 'noslash', 'a/b/c', 'a b/c', '../etc', 'o/..', './r', 'o/r?x=1', 'o/r#frag'])('400 for repo %j', async (repo) => {
    const { app, fetch } = build()
    const res = await request(app).get('/api/github/issues').query({ repo }).set(GH)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('validation_failed')
    expect(fetch.calls).toHaveLength(0)
  })

  it('400 when repo is missing or repeated, and for a bad state', async () => {
    const { app } = build()
    expect((await request(app).get('/api/github/issues').set(GH)).status).toBe(400)
    expect((await request(app).get('/api/github/issues?repo=a/b&repo=c/d').set(GH)).status).toBe(400)
    expect((await request(app).get('/api/github/issues?repo=a/b&state=weird').set(GH)).status).toBe(400)
  })

  it('maps issues, drops pull requests, defaults to open page 1', async () => {
    const { app, fetch } = build(() => ({ body: [ghIssue(1), ghIssue(2, { pull_request: { url: 'x' } }), ghIssue(3, { body: null, user: null })] }))
    const res = await request(app).get('/api/github/issues?repo=octocat/hello-flowlane').set(GH)
    expect(res.status).toBe(200)
    expect(res.body.issues.map((i) => i.number)).toEqual([1, 3])
    expect(res.body.issues[0]).toEqual({
      id: 101, number: 1, title: 'Issue 1', body: 'body 1', url: 'https://github.com/o/r/issues/1', state: 'open',
      labels: [{ name: 'bug', color: 'ff0000' }], author: 'ada', comments: 2, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z',
    })
    expect(res.body.issues[1].body).toBe('')
    expect(res.body.issues[1].author).toBeNull()
    expect(fetch.calls[0].url).toBe('https://github.test/repos/octocat/hello-flowlane/issues?state=open&per_page=30&page=1')
  })

  it('truncates long bodies to 600 characters', async () => {
    const { app } = build(() => ({ body: [ghIssue(1, { body: 'x'.repeat(5000) })] }))
    const res = await request(app).get('/api/github/issues?repo=o/r').set(GH)
    expect(res.body.issues[0].body).toHaveLength(600)
  })

  it('passes state and page, and computes hasMore from the Link header', async () => {
    const { app, fetch } = build((url) => ({
      body: [ghIssue(1)],
      headers: url.endsWith('page=1') ? { link: '<https://github.test/x?page=2>; rel="next"' } : { link: '<https://github.test/x?page=1>; rel="prev"' },
    }))
    const first = await request(app).get('/api/github/issues?repo=o/r&state=all&page=1').set(GH)
    expect(first.body.hasMore).toBe(true)
    const second = await request(app).get('/api/github/issues?repo=o/r&state=closed&page=2').set(GH)
    expect(second.body.hasMore).toBe(false)
    expect(fetch.calls[0].url).toContain('state=all')
    expect(fetch.calls[1].url).toContain('state=closed&per_page=30&page=2')
  })

  it('returns an empty list with no PR leak when everything is a pull request', async () => {
    const { app } = build(() => ({ body: [ghIssue(1, { pull_request: {} })] }))
    expect((await request(app).get('/api/github/issues?repo=o/r').set(GH)).body).toEqual({ issues: [], hasMore: false })
  })
})

describe('GitHub error mapping', () => {
  it('401 from GitHub becomes 401 github_token_invalid', async () => {
    const { app } = build(() => ({ status: 401, body: { message: 'Bad credentials' } }))
    const res = await request(app).get('/api/github/repos').set(GH)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('github_token_invalid')
  })

  it('403 with x-ratelimit-remaining 0 becomes 429 github_rate_limited with resetAt (ms)', async () => {
    const { app } = build(() => ({ status: 403, body: { message: 'rate limit' }, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' } }))
    const res = await request(app).get('/api/github/repos').set(GH)
    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('github_rate_limited')
    expect(res.body.error.resetAt).toBe(1800000000 * 1000)
  })

  it('429 from GitHub also becomes github_rate_limited', async () => {
    const { app } = build(() => ({ status: 429, body: {} }))
    const res = await request(app).get('/api/github/issues?repo=o/r').set(GH)
    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('github_rate_limited')
    expect(res.body.error.resetAt).toBeNull()
  })

  it('a plain 403 (no rate limit) is github_forbidden, not a rate limit', async () => {
    const { app } = build(() => ({ status: 403, body: {}, headers: { 'x-ratelimit-remaining': '10' } }))
    const res = await request(app).get('/api/github/issues?repo=o/r').set(GH)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('github_forbidden')
  })

  it('404 on issues becomes 404 repo_not_found', async () => {
    const { app } = build(() => ({ status: 404, body: { message: 'Not Found' } }))
    const res = await request(app).get('/api/github/issues?repo=o/missing').set(GH)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('repo_not_found')
  })

  it.each([500, 502, 503])('GitHub %i becomes 502 github_unavailable', async (status) => {
    const { app } = build(() => ({ status, body: {} }))
    const res = await request(app).get('/api/github/repos').set(GH)
    expect(res.status).toBe(502)
    expect(res.body.error.code).toBe('github_unavailable')
  })

  it('a network failure becomes 502 github_unavailable', async () => {
    const app = createApp({ config: testConfig(), verifyIdToken, fetch: async () => { throw new TypeError('fetch failed') } })
    const res = await request(app).get('/api/github/repos').set(GH)
    expect(res.status).toBe(502)
    expect(res.body.error.code).toBe('github_unavailable')
  })

  it('a non-array / non-JSON GitHub body becomes 502', async () => {
    const { app } = build(() => ({ body: { message: 'weird' } }))
    expect((await request(app).get('/api/github/repos').set(GH)).status).toBe(502)
    const broken = createApp({ config: testConfig(), verifyIdToken, fetch: async () => new Response('<html>', { status: 200 }) })
    expect((await request(broken).get('/api/github/repos').set(GH)).status).toBe(502)
  })

  it('never echoes the GitHub token or GitHub error bodies back to the client', async () => {
    const { app } = build(() => ({ status: 401, body: { message: 'Bad credentials gho_abc123' } }))
    const res = await request(app).get('/api/github/repos').set(GH)
    expect(JSON.stringify(res.body)).not.toContain('gho_abc123')
  })
})
