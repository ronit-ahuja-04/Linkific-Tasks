import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { CERTS_URL } from '../src/firebaseToken.js'

export const PROJECT_ID = 'demo-flowlane'
export const ISS = `https://securetoken.google.com/${PROJECT_ID}`

export function makeKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  return {
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }),
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  }
}

export const NOW_MS = Date.parse('2026-11-14T12:00:00Z')
export const NOW_S = Math.floor(NOW_MS / 1000)

export function baseClaims(overrides = {}) {
  return {
    iss: ISS,
    aud: PROJECT_ID,
    sub: 'user-123',
    auth_time: NOW_S - 600,
    iat: NOW_S - 600,
    exp: NOW_S + 3000,
    email: 'ada@example.com',
    email_verified: true,
    firebase: { sign_in_provider: 'password', identities: {} },
    ...overrides,
  }
}

// Sign a token like Google would. Use `omit` to remove a claim, `alg`/`secret` to attack.
export function signToken({ claims = {}, omit = [], key, kid = 'kid-1', alg = 'RS256', secret } = {}) {
  const payload = baseClaims(claims)
  for (const name of omit) delete payload[name]
  return jwt.sign(payload, secret ?? key.privatePem, { algorithm: alg, keyid: kid })
}

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')

// What the Firebase Auth emulator hands out: alg none, empty signature.
export function unsignedToken(claims = {}, header = {}) {
  return `${b64({ alg: 'none', typ: 'JWT', ...header })}.${b64(baseClaims(claims))}.`
}

// A fetch that serves Google's certificate endpoint from memory and counts calls.
export function certFetch(getCerts, { maxAge = 3600 } = {}) {
  const fn = async (url) => {
    fn.calls += 1
    if (String(url) !== CERTS_URL) throw new Error(`unexpected url ${url}`)
    return new Response(JSON.stringify(getCerts()), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${maxAge}, must-revalidate` },
    })
  }
  fn.calls = 0
  return fn
}

export function testConfig(overrides = {}) {
  return {
    nodeEnv: 'test',
    production: false,
    port: 0,
    projectId: PROJECT_ID,
    githubApiUrl: 'https://github.test',
    clientUrl: 'http://localhost:5173',
    emulatorHost: null,
    emulatorIgnored: false,
    rateLimitMax: 100,
    logSilent: true,
    ...overrides,
  }
}

// A fake GitHub fetch: `respond(url, init)` returns { status, body, headers }.
export function githubFetch(respond) {
  const fn = async (url, init) => {
    fn.calls.push({ url: String(url), init })
    const { status = 200, body = [], headers = {} } = await respond(String(url), init)
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
  }
  fn.calls = []
  return fn
}
