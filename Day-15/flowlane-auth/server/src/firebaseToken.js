import jwt from 'jsonwebtoken'
import { errors, ApiError } from './errors.js'

// What is an ID token? After a user signs in, Firebase gives the browser a JWT: three base64url
// parts (header.payload.signature). Google signs it with a PRIVATE key (RS256). We hold no secret:
// we download Google's PUBLIC certificates and check the signature. A valid signature proves the
// token was issued by Google and not edited, so we can trust the claims inside (who the user is).

export const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

const CLOCK_SKEW_SECONDS = 5 // tolerate tiny clock differences between Google and this machine
const MIN_REFETCH_MS = 10_000 // an unknown kid may trigger a refetch, but never more often than this
const DEFAULT_MAX_AGE_MS = 5 * 60_000

function b64urlJson(part) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))
}

// Split a compact JWT and decode header + payload WITHOUT trusting them yet.
function parseUnverified(token) {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length < 2 || parts.length > 3) throw errors.unauthorized('Malformed token.')
  try {
    const header = b64urlJson(parts[0])
    const payload = b64urlJson(parts[1])
    if (!header || typeof header !== 'object' || !payload || typeof payload !== 'object') throw new Error('shape')
    return { header, payload, parts }
  } catch {
    throw errors.unauthorized('Malformed token.')
  }
}

// Claim checks shared by the signed (production) and unsigned (emulator) paths.
// Google's rules: aud = project id, iss = securetoken URL for the project, sub = non-empty uid
// (max 128 chars), auth_time in the past, exp in the future.
function checkClaims(claims, { projectId, nowSeconds }) {
  if (claims.aud !== projectId) throw errors.unauthorized('Token audience does not match this project.')
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw errors.unauthorized('Token issuer does not match this project.')
  if (typeof claims.sub !== 'string' || claims.sub.length === 0 || claims.sub.length > 128) throw errors.unauthorized('Token subject is invalid.')
  if (typeof claims.auth_time !== 'number' || claims.auth_time > nowSeconds + CLOCK_SKEW_SECONDS) throw errors.unauthorized('Token auth_time is invalid.')
  if (typeof claims.iat !== 'number' || claims.iat > nowSeconds + CLOCK_SKEW_SECONDS) throw errors.unauthorized('Token issued-at is invalid.')
  if (typeof claims.exp !== 'number') throw errors.unauthorized('Token has no expiry.')
  if (claims.exp <= nowSeconds) throw errors.tokenExpired()
}

// A cache of Google's public certificates (kid -> PEM). Google rotates keys, and says how long a
// response may be reused in the Cache-Control max-age header, so we honour it.
export function createCertStore({ fetch = globalThis.fetch, url = CERTS_URL, now = Date.now } = {}) {
  let certs = null
  let expiresAt = 0
  let fetchedAt = -Infinity
  let inflight = null

  async function load() {
    let res
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    } catch {
      throw new ApiError(503, 'auth_unavailable', 'Could not load the signing certificates.')
    }
    if (!res.ok) throw new ApiError(503, 'auth_unavailable', 'Could not load the signing certificates.')
    let body
    try {
      body = await res.json()
    } catch {
      throw new ApiError(503, 'auth_unavailable', 'Could not load the signing certificates.')
    }
    const match = /max-age=(\d+)/i.exec(res.headers?.get?.('cache-control') ?? '')
    const maxAgeMs = match ? Number(match[1]) * 1000 : DEFAULT_MAX_AGE_MS
    certs = body
    fetchedAt = now()
    expiresAt = fetchedAt + maxAgeMs
    return certs
  }

  // Concurrent requests share a single download.
  function refresh() {
    inflight ??= load().finally(() => {
      inflight = null
    })
    return inflight
  }

  return {
    async get(kid) {
      if (!certs || now() >= expiresAt) await refresh()
      if (certs[kid]) return certs[kid]
      // Unknown kid: Google may have rotated keys. Refetch ONCE, but not on every bad token,
      // otherwise anyone could make us hammer Google by sending random kids.
      if (now() - fetchedAt >= MIN_REFETCH_MS) await refresh()
      return certs[kid] ?? null
    },
  }
}

export function createFirebaseTokenVerifier({ config, fetch = globalThis.fetch, now = Date.now, certStore } = {}) {
  const { projectId } = config
  // Defence in depth: even if a caller passes emulatorHost in production, it is ignored here too.
  const allowUnsigned = Boolean(config.emulatorHost) && config.nodeEnv !== 'production'
  const store = certStore ?? createCertStore({ fetch, now })

  return async function verifyIdToken(token) {
    const nowSeconds = Math.floor(now() / 1000)
    const { header, payload } = parseUnverified(token)

    // Emulator mode: the Firebase Auth emulator signs nothing (alg: none). Only in that explicit
    // dev mode do we accept it, and we still check iss, aud, sub, auth_time and exp.
    if (header.alg === 'none') {
      if (!allowUnsigned) throw errors.unauthorized('Unsigned tokens are not accepted.')
      checkClaims(payload, { projectId, nowSeconds })
      return { claims: payload, verifiedBy: 'emulator-unsigned' }
    }

    // Production path: RS256 only. Naming the algorithm ourselves blocks the classic confusion
    // attack where HS256 is used with Google's public certificate as the "secret".
    if (header.alg !== 'RS256') throw errors.unauthorized('Unsupported token algorithm.')
    if (typeof header.kid !== 'string' || !header.kid) throw errors.unauthorized('Token has no key id.')

    const cert = await store.get(header.kid)
    if (!cert) throw errors.unauthorized('Unknown signing key.')

    let claims
    try {
      // The signature is checked BEFORE exp, so a forged expired token is "invalid", not "expired".
      claims = jwt.verify(token, cert, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
        clockTimestamp: nowSeconds,
        clockTolerance: 0,
      })
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) throw errors.tokenExpired()
      throw errors.unauthorized('Invalid token.')
    }
    checkClaims(claims, { projectId, nowSeconds })
    return { claims, verifiedBy: 'google-certificate' }
  }
}
