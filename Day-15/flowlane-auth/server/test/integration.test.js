import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { CERTS_URL } from '../src/firebaseToken.js'
import { makeKeyPair, signToken, unsignedToken, testConfig, NOW_S } from './helpers.js'

// The real verifier wired into the real app, with ONE injected fetch that plays both Google's
// certificate endpoint and GitHub. No network.
const keys = makeKeyPair()
function build(config = {}) {
  const calls = []
  const fetch = async (url) => {
    calls.push(String(url))
    if (String(url) === CERTS_URL) return new Response(JSON.stringify({ 'kid-1': keys.publicPem }), { headers: { 'cache-control': 'max-age=3600' } })
    return new Response(JSON.stringify([{ id: 1, full_name: 'a/b', private: false, description: null, open_issues_count: 0, updated_at: 'x', html_url: 'u' }]), { status: 200 })
  }
  return { app: createApp({ config: testConfig(config), fetch }), calls }
}

describe('full stack with the real token verifier', () => {
  it('serves /api/me for a valid RS256 token (verifiedBy google-certificate)', async () => {
    const { app } = build()
    const res = await request(app).get('/api/me').set('Authorization', `Bearer ${signToken({ key: keys, claims: { iat: Math.floor(Date.now() / 1000) - 60, auth_time: Math.floor(Date.now() / 1000) - 60, exp: Math.floor(Date.now() / 1000) + 600 } })}`)
    expect(res.status).toBe(200)
    expect(res.body.verifiedBy).toBe('google-certificate')
  })

  it('401 token_expired for a genuine expired token and 401 unauthorized for alg none', async () => {
    const { app } = build()
    const expired = signToken({ key: keys, claims: { exp: NOW_S - 100000, iat: NOW_S - 200000, auth_time: NOW_S - 200000 } })
    const res = await request(app).get('/api/me').set('Authorization', `Bearer ${expired}`)
    expect(res.body.error.code).toBe('token_expired')
    const none = await request(app).get('/api/me').set('Authorization', `Bearer ${unsignedToken()}`)
    expect(none.status).toBe(401)
    expect(none.body.error.code).toBe('unauthorized')
  })

  it('emulator mode: accepts an unsigned token and proxies GitHub; the cert endpoint is never contacted', async () => {
    const { app, calls } = build({ emulatorHost: '127.0.0.1:9199' })
    const now = Math.floor(Date.now() / 1000)
    const token = unsignedToken({ iat: now - 10, auth_time: now - 10, exp: now + 600 })
    const me = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`)
    expect(me.body.verifiedBy).toBe('emulator-unsigned')
    const repos = await request(app).get('/api/github/repos').set('Authorization', `Bearer ${token}`).set('X-GitHub-Token', 'tok')
    expect(repos.body.repos[0].fullName).toBe('a/b')
    expect(calls).not.toContain(CERTS_URL)
  })
})
