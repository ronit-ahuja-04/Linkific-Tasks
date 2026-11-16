import { rateLimit } from 'express-rate-limit'
import { sendError } from '../errors.js'

// Limits each signed-in user (by uid, not IP: many people share an IP, and a uid cannot be faked
// because it comes from the verified token). Must run AFTER requireAuth.
export function perUserRateLimit({ max }) {
  return rateLimit({
    windowMs: 60_000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.user.uid,
    validate: { keyGeneratorIpFallback: false },
    handler: (_req, res) => sendError(res, 429, 'rate_limited', 'Too many requests. Slow down and retry shortly.'),
  })
}
