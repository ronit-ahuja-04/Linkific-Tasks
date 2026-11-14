import { errors } from '../errors.js'

const MAX_TOKEN_LENGTH = 8192

// Reads "Authorization: Bearer <Firebase ID token>", verifies it and puts the trusted identity on
// req.user. Everything after this middleware can rely on req.user.uid being genuine.
export function requireAuth(verifyIdToken) {
  return async (req, _res, next) => {
    const header = req.get('authorization') ?? ''
    const match = /^Bearer ([A-Za-z0-9_\-.]+)$/i.exec(header)
    if (!match || match[1].length > MAX_TOKEN_LENGTH) throw errors.unauthorized('Send an "Authorization: Bearer <ID token>" header.')
    const { claims, verifiedBy } = await verifyIdToken(match[1])
    req.user = { uid: claims.sub, claims, verifiedBy }
    next()
  }
}
