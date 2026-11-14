import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { errors } from '../src/errors.js'
import { githubFetch, testConfig, baseClaims } from './helpers.js'

const verifyIdToken = async (token) => {
  if (token.startsWith('uid-')) return { claims: baseClaims({ sub: token }), verifiedBy: 'google-certificate' }
  throw errors.unauthorized()
}

afterEach(() => vi.restoreAllMocks())

describe('per-user rate limiting', () => {
  it('answers 429 rate_limited after RATE_LIMIT_MAX requests, per uid', async () => {
    const app = createApp({ config: testConfig({ rateLimitMax: 3 }), verifyIdToken, fetch: githubFetch(() => ({})) })
    const as = (uid) => request(app).get('/api/me').set('Authorization', `Bearer ${uid}`)
    for (let i = 0; i < 3; i++) expect((await as('uid-a')).status).toBe(200)
    const blocked = await as('uid-a')
    expect(blocked.status).toBe(429)
    expect(blocked.body).toEqual({ error: { code: 'rate_limited', message: expect.any(String) } })
    expect(blocked.headers['ratelimit-policy'] ?? blocked.headers.ratelimit).toBeDefined()
    // Another user is not affected by uid-a's usage.
    expect((await as('uid-b')).status).toBe(200)
  })

  it('applies to the GitHub routes too and does not count unauthenticated or health requests', async () => {
    const fetch = githubFetch(() => ({ body: [] }))
    const app = createApp({ config: testConfig({ rateLimitMax: 2 }), verifyIdToken, fetch })
    for (let i = 0; i < 5; i++) expect((await request(app).get('/api/health')).status).toBe(200)
    for (let i = 0; i < 5; i++) expect((await request(app).get('/api/me').set('Authorization', 'Bearer bogus')).status).toBe(401)
    const gh = () => request(app).get('/api/github/repos').set('Authorization', 'Bearer uid-a').set('X-GitHub-Token', 'tok')
    expect((await gh()).status).toBe(200)
    expect((await gh()).status).toBe(200)
    expect((await gh()).status).toBe(429)
    expect(fetch.calls).toHaveLength(2)
  })
})

describe('no secrets in logs', () => {
  it('request logs contain method, path and status only: no query string, tokens or headers', async () => {
    const lines = []
    for (const m of ['log', 'info', 'warn', 'error', 'debug']) vi.spyOn(console, m).mockImplementation((...a) => lines.push(a.join(' ')))
    const app = createApp({
      config: testConfig({ logSilent: false }),
      verifyIdToken,
      fetch: githubFetch(() => ({ status: 401, body: { message: 'Bad credentials' } })),
    })
    await request(app).get('/api/github/repos?q=SECRET-QUERY&page=1').set('Authorization', 'Bearer uid-secret-id-token').set('X-GitHub-Token', 'gho_SECRETGITHUBTOKEN')
    await request(app).get('/api/github/issues?repo=private-org/private-repo').set('Authorization', 'Bearer uid-secret-id-token').set('X-GitHub-Token', 'gho_SECRETGITHUBTOKEN')
    await request(app).get('/api/me').set('Authorization', 'Bearer not-valid-token-xyz')
    expect(lines.length).toBeGreaterThanOrEqual(3)
    expect(lines[0]).toMatch(/^GET \/api\/github\/repos 401 \d+ms$/)
    const all = lines.join('\n')
    for (const secret of ['SECRET-QUERY', 'gho_SECRETGITHUBTOKEN', 'uid-secret-id-token', 'not-valid-token-xyz', 'private-org', 'Bearer', 'page=1']) {
      expect(all).not.toContain(secret)
    }
  })

  it('an unexpected error logs only its name and returns a generic 500', async () => {
    const lines = []
    for (const m of ['log', 'error']) vi.spyOn(console, m).mockImplementation((...a) => lines.push(a.join(' ')))
    const boom = async () => { throw new Error('contains-secret-xyz') }
    const app = createApp({ config: testConfig({ logSilent: false }), verifyIdToken: boom })
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer anything')
    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('internal_error')
    expect(JSON.stringify(res.body)).not.toContain('contains-secret-xyz')
    expect(lines.join('\n')).not.toContain('contains-secret-xyz')
  })

  it('logSilent produces no output at all', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const app = createApp({ config: testConfig({ logSilent: true }), verifyIdToken })
    await request(app).get('/api/health')
    expect(spy).not.toHaveBeenCalled()
  })

  it('the GitHub token is only forwarded: it is not in any response body or header', async () => {
    const app = createApp({ config: testConfig(), verifyIdToken, fetch: githubFetch(() => ({ body: [] })) })
    const res = await request(app).get('/api/github/repos').set('Authorization', 'Bearer uid-a').set('X-GitHub-Token', 'gho_FORWARDONLY')
    expect(JSON.stringify(res.body) + JSON.stringify(res.headers)).not.toContain('gho_FORWARDONLY')
  })
})
