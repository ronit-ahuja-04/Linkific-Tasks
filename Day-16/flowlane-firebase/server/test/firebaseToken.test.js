import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { createFirebaseTokenVerifier, createCertStore } from '../src/firebaseToken.js'
import { makeKeyPair, signToken, unsignedToken, certFetch, testConfig, baseClaims, NOW_MS, NOW_S } from './helpers.js'

const keys = makeKeyPair()
const otherKeys = makeKeyPair()

function setup({ config = testConfig(), certs = { 'kid-1': keys.publicPem }, clock = { t: NOW_MS } } = {}) {
  const state = { certs }
  const fetch = certFetch(() => state.certs)
  const verify = createFirebaseTokenVerifier({ config, fetch, now: () => clock.t })
  return { verify, fetch, state, clock }
}

const code = async (promise) => promise.then(() => null, (e) => ({ status: e.status, code: e.code }))

describe('verifyIdToken: signed (production) path', () => {
  it('accepts a valid RS256 token and returns its claims', async () => {
    const { verify } = setup()
    const out = await verify(signToken({ key: keys }))
    expect(out.verifiedBy).toBe('google-certificate')
    expect(out.claims.sub).toBe('user-123')
    expect(out.claims.email).toBe('ada@example.com')
  })

  it('reports an expired (but genuine) token as token_expired', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: keys, claims: { exp: NOW_S - 10 } })))).toEqual({ status: 401, code: 'token_expired' })
  })

  it('reports an expired token with a FORGED signature as unauthorized, not expired', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: otherKeys, claims: { exp: NOW_S - 10 } })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects a token signed by another key', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: otherKeys })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects a tampered payload', async () => {
    const { verify } = setup()
    const [h, , s] = signToken({ key: keys }).split('.')
    const evil = Buffer.from(JSON.stringify(baseClaims({ sub: 'admin' }))).toString('base64url')
    expect(await code(verify(`${h}.${evil}.${s}`))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects a wrong audience', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: keys, claims: { aud: 'other-project' } })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects a wrong issuer', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: keys, claims: { iss: 'https://securetoken.google.com/other' } })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it.each([
    ['missing', { omit: ['sub'] }],
    ['empty', { claims: { sub: '' } }],
    ['too long', { claims: { sub: 'x'.repeat(129) } }],
    ['not a string', { claims: { sub: 42 } }],
  ])('rejects a %s sub', async (_name, extra) => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: keys, ...extra })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('accepts a 128 character sub', async () => {
    const { verify } = setup()
    expect((await verify(signToken({ key: keys, claims: { sub: 'x'.repeat(128) } }))).claims.sub).toHaveLength(128)
  })

  it('rejects an auth_time in the future and a missing auth_time', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: keys, claims: { auth_time: NOW_S + 3600 } })))).toEqual({ status: 401, code: 'unauthorized' })
    expect(await code(verify(signToken({ key: keys, omit: ['auth_time'] })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects an iat in the future', async () => {
    const { verify } = setup()
    expect(await code(verify(signToken({ key: keys, claims: { iat: NOW_S + 3600 } })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects a token with no exp', async () => {
    const { verify } = setup()
    expect((await code(verify(signToken({ key: keys, omit: ['exp'] }))))?.code).toBe('unauthorized')
  })

  it('rejects HS256 signed with the public key as the secret (algorithm confusion)', async () => {
    const { verify } = setup()
    const forged = signToken({ alg: 'HS256', secret: keys.publicPem })
    expect(await code(verify(forged))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects alg none when the emulator is not enabled', async () => {
    const { verify } = setup()
    expect(await code(verify(unsignedToken()))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('rejects a downgraded header that claims alg none but keeps a real signature', async () => {
    const { verify } = setup()
    const [, p, s] = signToken({ key: keys }).split('.')
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT', kid: 'kid-1' })).toString('base64url')
    expect(await code(verify(`${header}.${p}.${s}`))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it.each(['ES256', 'PS256', 'RS512'])('rejects algorithm %s', async (alg) => {
    const { verify } = setup()
    const [, p, s] = signToken({ key: keys }).split('.')
    const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT', kid: 'kid-1' })).toString('base64url')
    expect((await code(verify(`${header}.${p}.${s}`)))?.code).toBe('unauthorized')
  })

  it('rejects a token with no kid and one with an unknown kid', async () => {
    const { verify } = setup()
    const noKid = jwt.sign(baseClaims(), keys.privatePem, { algorithm: 'RS256' })
    expect(await code(verify(noKid))).toEqual({ status: 401, code: 'unauthorized' })
    expect(await code(verify(signToken({ key: keys, kid: 'nope' })))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it.each(['', 'abc', 'a.b.c.d', 'not.json.here', null, undefined, 42])('rejects garbage %j', async (garbage) => {
    const { verify } = setup()
    expect(await code(verify(garbage))).toEqual({ status: 401, code: 'unauthorized' })
  })
})

describe('certificate cache', () => {
  it('downloads once and caches while max-age lasts, then refetches', async () => {
    const { verify, fetch, clock } = setup()
    const token = signToken({ key: keys })
    await verify(token)
    await verify(token)
    expect(fetch.calls).toBe(1)
    clock.t += 3601 * 1000
    await verify(signToken({ key: keys, claims: { exp: NOW_S + 10_000 } }))
    expect(fetch.calls).toBe(2)
  })

  it('refetches once when it sees an unknown kid (key rotation) and then accepts it', async () => {
    const { verify, fetch, state, clock } = setup()
    await verify(signToken({ key: keys }))
    expect(fetch.calls).toBe(1)
    state.certs = { 'kid-1': keys.publicPem, 'kid-2': otherKeys.publicPem }
    clock.t += 60_000 // past the minimum refetch interval
    const out = await verify(signToken({ key: otherKeys, kid: 'kid-2', claims: { exp: NOW_S + 10_000 } }))
    expect(out.claims.sub).toBe('user-123')
    expect(fetch.calls).toBe(2)
  })

  it('does not hammer Google when bad kids keep arriving', async () => {
    const { verify, fetch } = setup()
    await verify(signToken({ key: keys }))
    for (let i = 0; i < 5; i++) await code(verify(signToken({ key: keys, kid: `random-${i}` })))
    expect(fetch.calls).toBe(1)
  })

  it('shares one download between concurrent requests', async () => {
    const { verify, fetch } = setup()
    const token = signToken({ key: keys })
    await Promise.all([verify(token), verify(token), verify(token)])
    expect(fetch.calls).toBe(1)
  })

  it('answers 503 auth_unavailable when the certificates cannot be downloaded', async () => {
    const store = createCertStore({ fetch: async () => { throw new Error('offline') }, now: () => NOW_MS })
    const verify = createFirebaseTokenVerifier({ config: testConfig(), certStore: store, now: () => NOW_MS })
    expect(await code(verify(signToken({ key: keys })))).toEqual({ status: 503, code: 'auth_unavailable' })
  })

  it('answers 503 when Google replies with an error status', async () => {
    const store = createCertStore({ fetch: async () => new Response('x', { status: 500 }), now: () => NOW_MS })
    expect((await code(store.get('kid-1'))).status).toBe(503)
  })
})

describe('emulator (unsigned) mode', () => {
  const emulator = () => testConfig({ emulatorHost: '127.0.0.1:9199' })

  it('accepts an unsigned token when the emulator host is set and not production', async () => {
    const { verify, fetch } = setup({ config: emulator() })
    const out = await verify(unsignedToken())
    expect(out.verifiedBy).toBe('emulator-unsigned')
    expect(fetch.calls).toBe(0)
  })

  it('still checks aud, iss, sub, auth_time and exp', async () => {
    const { verify } = setup({ config: emulator() })
    expect((await code(verify(unsignedToken({ aud: 'x' }))))?.code).toBe('unauthorized')
    expect((await code(verify(unsignedToken({ iss: 'x' }))))?.code).toBe('unauthorized')
    expect((await code(verify(unsignedToken({ sub: '' }))))?.code).toBe('unauthorized')
    expect((await code(verify(unsignedToken({ auth_time: NOW_S + 999 }))))?.code).toBe('unauthorized')
    expect((await code(verify(unsignedToken({ exp: NOW_S - 5 }))))?.code).toBe('token_expired')
  })

  it('ignores the emulator host in production (defence in depth, even if config leaks it)', async () => {
    const { verify } = setup({ config: testConfig({ emulatorHost: '127.0.0.1:9199', nodeEnv: 'production', production: true }) })
    expect(await code(verify(unsignedToken()))).toEqual({ status: 401, code: 'unauthorized' })
  })

  it('still verifies real RS256 tokens in emulator mode and rejects HS256', async () => {
    const { verify } = setup({ config: emulator() })
    expect((await verify(signToken({ key: keys }))).verifiedBy).toBe('google-certificate')
    expect((await code(verify(signToken({ alg: 'HS256', secret: keys.publicPem }))))?.code).toBe('unauthorized')
  })
})
