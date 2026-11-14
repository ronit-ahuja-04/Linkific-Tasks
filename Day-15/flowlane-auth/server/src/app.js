import express from 'express'
import helmet from 'helmet'
import { errors, errorHandler } from './errors.js'
import { createFirebaseTokenVerifier } from './firebaseToken.js'
import { requireAuth } from './middleware/auth.js'
import { perUserRateLimit } from './middleware/rateLimit.js'
import { requestLogger } from './middleware/logger.js'
import { healthRouter } from './routes/health.js'
import { meRouter } from './routes/me.js'
import { githubRouter } from './routes/github.js'

// Everything the app needs from outside is injected, so tests run without network or real keys.
export function createApp({ config, verifyIdToken, fetch = globalThis.fetch } = {}) {
  const verify = verifyIdToken ?? createFirebaseTokenVerifier({ config, fetch })
  const app = express()
  app.disable('x-powered-by')

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
  app.use(requestLogger({ silent: config.logSilent }))

  // CORS only matters if the browser calls the API directly (dev uses the Vite proxy instead).
  app.use((req, res, next) => {
    const origin = req.get('origin')
    if (origin && origin === config.clientUrl) {
      res.set('Access-Control-Allow-Origin', origin)
      res.set('Access-Control-Allow-Headers', 'Authorization, X-GitHub-Token, Content-Type')
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      res.vary('Origin')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })
  app.use(express.json({ limit: '10kb' }))

  const api = express.Router()
  api.use(healthRouter()) // public

  // Everything below needs a verified ID token, then is limited per user.
  api.use(requireAuth(verify), perUserRateLimit({ max: config.rateLimitMax }))
  api.use(meRouter())
  api.use('/github', githubRouter({ config, fetch }))
  app.use('/api', api)

  app.use((_req, _res, next) => next(errors.notFound()))
  app.use(errorHandler(config))
  return app
}
